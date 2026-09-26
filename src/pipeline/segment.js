// Numeración del texto de un paper ANTES de que lo vea la IA (decisión
// D-esquema). La IA solo puede señalar lo que aquí existe:
//   - frases  s1…sN, cada una con su sección NLM (RESULTS, METHODS…)
//   - números n1…nK, leídos por código: valor, unidad y tipo
//     (valor | p | ic). Un número pegado a un nombre (IL-6, 25(OH)D, T4,
//     COVID-19, 10^9) no es un número: no se lista.

const ABBREVIATIONS = /\b(vs|e\.g|i\.e|et al|approx|Fig|No|Dr|resp|cf|ca)\.$/i

/** Divide un texto en frases sin cortar en abreviaturas ni decimales. */
export function splitSentences(text) {
  const out = []
  let buffer = ''
  for (const part of String(text).split(/(?<=[.!?])\s+(?=[A-Z0-9(\[])/)) {
    buffer = buffer ? `${buffer} ${part}` : part
    if (!ABBREVIATIONS.test(buffer)) {
      out.push(buffer.trim())
      buffer = ''
    }
  }
  if (buffer.trim()) out.push(buffer.trim())
  return out.filter(Boolean)
}

const UNIT =
  /^(%|mm\s?Hg|bpm|kg\/m2|kg\/m²|[a-zµμ]{1,5}\/[a-zµμ0-9]{1,6}(?:\/[a-z]{1,4})?|IU|U|kg|mg|µg|μg|ng|pg|g|mL|ml|L|cm|mm|years?|yrs?|months?|weeks?|days?|hours?|h|min|points?)(?![\p{L}])/iu
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u

function parseValue(raw) {
  let t = raw.replace('−', '-').replace('·', '.')
  if (/^-?\d{1,3}(,\d{3})+$/.test(t)) t = t.replace(/,/g, '')
  else t = t.replace(',', '.')
  if (t.startsWith('.') || t.startsWith('-.')) t = t.replace('.', '0.')
  return Number(t)
}

/**
 * P: una frase. Q: números con { value, unit, kind, text, at }.
 * kind: 'p' (p-valor), 'ic' (dentro de un intervalo de confianza) o 'valor'.
 */
export function parseNumbers(sentence) {
  const out = []
  const re = /[-−]?(?:\d+(?:[.,·]\d+)*|[.,·]\d+)/g
  for (const m of sentence.matchAll(re)) {
    let raw = m[0]
    let at = m.index
    const before = sentence[at - 1] ?? ' '
    if (raw[0] === '-' || raw[0] === '−') {
      // «-» tras letra o dígito es guion o rango, no signo: se descarta el signo.
      if (LETTER_OR_DIGIT.test(before)) {
        raw = raw.slice(1)
        at += 1
      }
    }
    const prev = sentence[at - 1] ?? ' '
    const prev2 = sentence[at - 2] ?? ' '
    const next = sentence[at + raw.length] ?? ' '
    if (LETTER_OR_DIGIT.test(prev) || prev === '^' || prev === '(' && LETTER_OR_DIGIT.test(prev2)) continue
    if ((prev === '-' || prev === '−') && LETTER_OR_DIGIT.test(prev2) && !/\d/.test(prev2)) continue
    if (LETTER_OR_DIGIT.test(next) || next === '(' || next === '^' || (next === '-' && /\p{L}/u.test(sentence[at + raw.length + 1] ?? ''))) continue
    const value = parseValue(raw)
    if (!Number.isFinite(value)) continue

    const head = sentence.slice(Math.max(0, at - 40), at)
    const tail = sentence.slice(at + raw.length, at + raw.length + 25)
    if (/^\s*%\s*(CI|confidence)/i.test(tail)) continue // el «95» de «95% CI»
    let kind = 'valor'
    if (/\bp\s*[<=>≤≥]\s*$/i.test(head)) kind = 'p'
    else if (/95\s*%?\s*(CI|confidence interval)[^);\]]*$/i.test(head)) kind = 'ic'

    const after = sentence.slice(at + raw.length).replace(/^\s+/, '')
    const unit = kind === 'valor' ? (UNIT.exec(after)?.[0] ?? null) : null
    out.push({ value, unit, kind, text: raw, at })
  }

  // Unidad compartida: «145 ± 32 vs 118 ± 27 mg/dL» → todos en mg/dL.
  for (let i = out.length - 1; i >= 0; i--) {
    const n = out[i]
    if (n.kind !== 'valor' || n.unit) continue
    const nextWithUnit = out.slice(i + 1).find((x) => x.kind === 'valor' && x.unit)
    if (!nextWithUnit) continue
    const between = sentence.slice(n.at + n.text.length, nextWithUnit.at)
    if (/^[\s\d.,·±()–\-−]*(?:(?:vs\.?|versus|and|to)[\s\d.,·±()–\-−]*)*$/i.test(between)) {
      n.unit = nextWithUnit.unit
      n.unitInherited = true
    }
  }
  return out
}

/**
 * P: paper con title y sections [{ category, label, text }].
 * Q: { sentences: [{ id, section, text }], numbers: [{ id, sentence, value, unit, kind, text }] }.
 */
export function segmentPaper(paper) {
  const sentences = []
  const numbers = []
  const push = (text, section) => {
    const id = `s${sentences.length + 1}`
    sentences.push({ id, section, text })
    for (const n of parseNumbers(text)) numbers.push({ id: `n${numbers.length + 1}`, sentence: id, ...n })
  }
  if (paper.title) push(paper.title, 'TITLE')
  for (const sec of paper.sections ?? []) for (const s of splitSentences(sec.text)) push(s, sec.category ?? null)
  return { sentences, numbers }
}

/** Texto numerado tal como lo ve el extractor. */
export function renderForModel(paperId, seg) {
  const lines = seg.sentences.map((s) => `${s.id} [${s.section ?? 'SIN_SECCION'}] ${s.text}`)
  const nums = seg.numbers
    .filter((n) => n.kind === 'valor')
    .map((n) => `${n.id}=${n.text}${n.unit ? ` ${n.unit}` : ''} (${n.sentence})`)
  return `<paper id="${paperId}">\n${lines.join('\n')}\nNUMEROS: ${nums.join('; ') || 'ninguno'}\n</paper>`
}
