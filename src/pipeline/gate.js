// Control de lo que propone el extractor (decisiones D-esquema, D-control,
// D-lectura-doble). La IA solo SEÑALA: frases por id (s#), números por id
// (n#) y fragmentos que deben existir dentro de esa frase. El código
// construye cada dato desde el texto del paper y veta con reglas medidas
// (bench/offline.mjs). La dirección la confirma una segunda lectura ciega.

import { LAYERS, SCHEMA, layerOf, slotsFor } from '../method/method.js'
import { norm } from './text.js'
import { segmentPaper } from './segment.js'

const CUE = Object.fromEntries(Object.entries(SCHEMA.cues).map(([k, v]) => [k, new RegExp(v, 'i')]))
const CUE_ALL = Object.fromEntries(Object.entries(SCHEMA.cues).map(([k, v]) => [k, new RegExp(v, 'gi')]))

// ---------- Capa por léxico de la diana ----------

// Un alias es un comienzo de palabra ("hepat" → hepatic); los de menos de
// 4 letras deben ser palabra completa ("ear" no casa con "clearance").
const aliasRe = new Map()
function aliasIn(alias, text) {
  if (!aliasRe.has(alias)) {
    const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    aliasRe.set(alias, new RegExp(`(^|[^\\p{L}\\p{N}])${esc}${alias.length < 4 ? '(?![\\p{L}\\p{N}])' : ''}`, 'u'))
  }
  return aliasRe.get(alias).test(text)
}

/** Capa de una diana: la del alias más largo que aparece en ella, o null. */
export function layerOfTarget(target) {
  const t = norm(target)
  let best = null
  for (const layer of LAYERS) {
    for (const alias of layer.aliases) {
      if (aliasIn(alias, t) && (!best || alias.length > best.alias.length)) best = { id: layer.id, alias }
    }
  }
  return best?.id ?? null
}

// ---------- Anclaje de fragmentos ----------

/** Devuelve el fragmento tal como está escrito en la frase, o null si no está. */
export function anchor(fragment, sentence) {
  const words = String(fragment ?? '').trim().split(/\s+/).filter(Boolean)
  if (!words.length) return null
  const esc = words.map((w) => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
  const m = new RegExp(`(?<![\\p{L}\\p{N}])${esc.join('\\s+')}(?![\\p{L}\\p{N}])`, 'iu').exec(sentence)
  return m ? m[0] : null
}

// ---------- Tema ----------

/** Raíces del tema: palabras ≥4 letras recortadas a 5; siglas cortas, enteras. */
export function topicStems(topic) {
  return (norm(topic).match(/[\p{L}\p{N}]+/gu) ?? [])
    .filter((w) => w.length >= 2 && !['and', 'the', 'of', 'in', 'or'].includes(w))
    .map((w) => (w.length >= 4 ? w.slice(0, 5) : w))
}
const mentionsTopic = (text, stems) => {
  const words = norm(text).match(/[\p{L}\p{N}]+/gu) ?? []
  return stems.some((st) => words.some((w) => (st.length >= 4 ? w.startsWith(st) : w === st)))
}

// ---------- Vetos medidos ----------

/** Veto de significación (H2 en bench/offline.mjs): efecto vs sin efecto. */
export function significanceVeto(sentence, direction) {
  const noEffect = CUE.noEffect.test(sentence)
  const effect = CUE.effect.test(sentence.replace(CUE_ALL.noEffect, ' '))
  if (direction === 'sin_efecto') return effect && !noEffect
  return noEffect && !effect
}

// ---------- Contexto por paper ----------

export function buildContext({ papers, kind, topic }) {
  const segments = new Map()
  for (const [id, paper] of papers) segments.set(id, segmentPaper(paper))
  return { papers, segments, kind, stems: topicStems(topic ?? '') }
}

function locate(row, ctx, reasons) {
  const paperId = String(row.paperId)
  const seg = ctx.segments.get(paperId)
  if (!seg) {
    reasons.push('paper fuera del lote')
    return null
  }
  const sentence = seg.sentences.find((s) => s.id === row.sentence)
  if (!sentence) {
    reasons.push(`frase inexistente (${row.sentence})`)
    return null
  }
  if (!SCHEMA.acceptedSections.includes(sentence.section)) reasons.push(`frase de ${sentence.section}, no de resultados`)
  if (CUE.background.test(sentence.text)) reasons.push('la frase es antecedente, objetivo o hipótesis')
  return { paperId, seg, sentence, paper: ctx.papers.get(paperId) }
}

const need = (value, sentence, label, reasons) => {
  const found = anchor(value, sentence.text)
  if (!found) reasons.push(`${label} no está en la frase («${value ?? ''}»)`)
  return found
}
const inEnum = (value, e) => (Array.isArray(e) ? e : Object.keys(e)).includes(value)

function gateEffect(row, ctx) {
  const reasons = []
  const at = locate(row, ctx, reasons)
  if (!at) return { reasons }
  const exposure = need(row.exposure, at.sentence, 'exposición', reasons)
  const target = need(row.outcome, at.sentence, 'resultado', reasons)
  const comparator = row.comparator ? need(row.comparator, at.sentence, 'comparador', reasons) : null
  if (!inEnum(row.direction, SCHEMA.directions)) reasons.push(`dirección no válida (${row.direction})`)
  if (!inEnum(row.claim, SCHEMA.claims)) reasons.push(`tipo no válido (${row.claim})`)
  if (!inEnum(row.role, SCHEMA.roles)) reasons.push(`rol no válido (${row.role})`)
  if (reasons.length) return { reasons }

  const topicWhere = { actua_sobre: exposure, alterado_por: target }[row.role] ?? at.sentence.text
  if (!mentionsTopic(topicWhere, ctx.stems)) reasons.push(`el tema no aparece en ${row.role === 'alterado_por' ? 'el resultado' : 'la exposición'}`)
  if (significanceVeto(at.sentence.text, row.direction)) reasons.push('la dirección contradice lo que la frase dice sobre significación')
  if (reasons.length) return { reasons }

  const association = CUE.association.test(at.sentence.text)
  return {
    row: {
      paperId: at.paperId,
      sentence: at.sentence.id,
      quote: at.sentence.text,
      exposure,
      comparator,
      target,
      direction: row.direction,
      claim: association ? 'asociacion' : row.claim,
      claimForced: association && row.claim !== 'asociacion',
      role: row.role,
      layer: layerOfTarget(target),
      evidenceKind: SCHEMA.reviewDesigns.includes(at.paper.design) ? 'afirmado_revision' : 'medido',
    },
  }
}

function gateMeasure(row, ctx) {
  const reasons = []
  const at = locate(row, ctx, reasons)
  if (!at) return { reasons }
  const number = at.seg.numbers.find((n) => n.id === row.number)
  if (!number) reasons.push(`número inexistente (${row.number})`)
  else if (number.sentence !== at.sentence.id) reasons.push('el número no está en esa frase')
  else if (number.kind !== 'valor') reasons.push(`el número es un ${number.kind === 'p' ? 'p-valor' : 'límite de intervalo'}`)
  const target = need(row.outcome, at.sentence, 'resultado', reasons)
  const group = row.group ? need(row.group, at.sentence, 'grupo', reasons) : null
  if (!slotsFor(ctx.kind).includes(row.slot)) reasons.push(`hueco no permitido para «${ctx.kind}» (${row.slot})`)
  if (row.slot === 'effect_size') {
    if (!SCHEMA.effectSizeMetrics.includes(row.metric)) reasons.push(`métrica no válida (${row.metric})`)
    else if (!new RegExp(`\\b${row.metric}\\b`).test(at.sentence.text)) reasons.push(`la métrica ${row.metric} no aparece en la frase`)
  }
  if (reasons.length) return { reasons }
  return {
    row: {
      paperId: at.paperId,
      sentence: at.sentence.id,
      quote: at.sentence.text,
      numberId: number.id,
      value: number.value,
      unit: number.unit,
      unitInherited: Boolean(number.unitInherited),
      target,
      group,
      slot: row.slot,
      metric: row.slot === 'effect_size' ? row.metric : null,
      layer: layerOfTarget(target),
      status: 'aceptada',
    },
  }
}

function gateLink(row, ctx) {
  const reasons = []
  const at = locate(row, ctx, reasons)
  if (!at) return { reasons }
  const from = need(row.from, at.sentence, 'origen', reasons)
  const to = need(row.to, at.sentence, 'destino', reasons)
  if (!inEnum(row.verb, SCHEMA.linkPredicates)) reasons.push(`verbo no válido (${row.verb})`)
  if (reasons.length) return { reasons }
  return {
    row: {
      paperId: at.paperId,
      sentence: at.sentence.id,
      quote: at.sentence.text,
      from_target: from,
      to_target: to,
      verb: row.verb,
      direction: SCHEMA.linkDirection[row.verb],
      from_layer: layerOfTarget(from),
      to_layer: layerOfTarget(to),
    },
  }
}

/**
 * P: filas crudas del extractor { effects, measures, links } y el contexto.
 * Q: { effects, measures, links, rejected } — efectos y eslabones quedan
 *    «pendiente_verificacion» hasta la segunda lectura (applyVerification).
 */
export function gateRows(raw, ctx) {
  const out = { effects: [], measures: [], links: [], rejected: [] }
  const take = (type, rows, check) => {
    for (const row of rows ?? []) {
      const r = check(row, ctx)
      if (r.reasons?.length) out.rejected.push({ type, row, reasons: r.reasons })
      else out[type].push(r.row)
    }
  }
  take('effects', raw.effects, gateEffect)
  take('measures', raw.measures, gateMeasure)
  take('links', raw.links, gateLink)
  for (const r of [...out.effects, ...out.links]) r.status = 'pendiente_verificacion'
  return out
}

/** Preguntas para la segunda lectura: solo la frase y los fragmentos, nunca la respuesta. */
export function verificationItems(rows) {
  return [
    ...rows.effects.map((r, i) => ({ key: `e${i}`, sentence: r.quote, exposure: r.exposure, comparator: r.comparator, outcome: r.target })),
    ...rows.links.map((r, i) => ({ key: `l${i}`, sentence: r.quote, exposure: r.from_target, comparator: null, outcome: r.to_target })),
  ]
}

/** Coincide → aceptada; discrepa o no se puede saber → en_revision (no se muestra como hecho). */
export function applyVerification(rows, answers) {
  const byKey = new Map((answers ?? []).map((a) => [a.key, a.direction]))
  const settle = (r, key) => {
    const second = byKey.get(key) ?? null
    r.secondReading = second
    r.status = second === r.direction ? 'aceptada' : 'en_revision'
  }
  rows.effects.forEach((r, i) => settle(r, `e${i}`))
  rows.links.forEach((r, i) => settle(r, `l${i}`))
  return rows
}

export { layerOf }
