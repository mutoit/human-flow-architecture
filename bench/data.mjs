// Corpus Evidence Inference (Lehman 2019 / DeYoung 2020): fragmentos de
// ensayos con intervención, comparador, resultado y dirección anotados por
// médicos. Se descarga a bench/.data (no se versiona).

import fs from 'node:fs'
import path from 'node:path'

const DIR = path.join(path.dirname(new URL(import.meta.url).pathname), '.data')
const BASE = 'https://raw.githubusercontent.com/jayded/evidence-inference/master/annotations'
const LABEL = { 'significantly increased': 'aumenta', 'significantly decreased': 'disminuye', 'no significant difference': 'sin_efecto' }

function parseCsv(text) {
  const rows = []
  let row = [], field = '', quoted = false
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === '"' && text[i + 1] === '"') (field += '"'), i++
      else if (c === '"') quoted = false
      else field += c
    } else if (c === '"') quoted = true
    else if (c === ',') row.push(field), (field = '')
    else if (c === '\n') row.push(field), rows.push(row), (row = []), (field = '')
    else if (c !== '\r') field += c
  }
  if (field || row.length) row.push(field), rows.push(row)
  const [head, ...body] = rows
  return body.map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])))
}

async function file(name) {
  const p = path.join(DIR, name)
  if (!fs.existsSync(p)) {
    fs.mkdirSync(DIR, { recursive: true })
    const res = await fetch(`${BASE}/${name}`)
    if (!res.ok) throw new Error(`No se pudo descargar ${name} (${res.status})`)
    fs.writeFileSync(p, await res.text())
  }
  return fs.readFileSync(p, 'utf8')
}

/** Q: [{ id, direction, sentence, exposure, comparator, outcome }] — una por pregunta, validadas y del abstract. */
export async function loadItems() {
  const prompts = new Map(parseCsv(await file('prompts_merged.csv')).map((r) => [r.PromptID, r]))
  const seen = new Set()
  const out = []
  for (const r of parseCsv(await file('annotations_merged.csv'))) {
    const direction = LABEL[r.Label]
    if (!direction || r['Valid Label'] !== 'True' || r['Valid Reasoning'] !== 'True' || r['In Abstract'] !== 'True') continue
    if (seen.has(r.PromptID) || !prompts.has(r.PromptID) || (r.Annotations ?? '').trim().length < 20) continue
    seen.add(r.PromptID)
    const p = prompts.get(r.PromptID)
    out.push({ id: r.PromptID, direction, sentence: r.Annotations.trim(), exposure: p.Intervention.trim(), comparator: p.Comparator.trim(), outcome: p.Outcome.trim() })
  }
  return out
}

/** Muestra reproducible (semilla fija), equilibrada por dirección. */
export function sample(items, n, seed = 42) {
  let s = seed
  const rand = () => ((s = (s * 1103515245 + 12345) % 2 ** 31) / 2 ** 31)
  const by = {}
  for (const it of items) (by[it.direction] ??= []).push(it)
  const out = []
  for (const list of Object.values(by)) {
    const copy = [...list]
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    out.push(...copy.slice(0, Math.ceil(n / 3)))
  }
  return out.slice(0, n)
}
