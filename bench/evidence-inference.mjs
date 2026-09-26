// Mide la IA REAL contra el corpus anotado por médicos (decisión
// D-lectura-doble): acierto de la 1.ª lectura, de la 2.ª, y de la regla
// «solo se muestra si coinciden». Guarda el resultado en bench/results/.
// Uso: BENCH_URL=https://<tu-worker>/api/extract npm run bench:api -- 150

import fs from 'node:fs'
import path from 'node:path'
import { loadItems, sample } from './data.mjs'

const URL_ = process.env.BENCH_URL
if (!URL_) throw new Error('Falta BENCH_URL (p. ej. https://humanflow.<cuenta>.workers.dev/api/extract)')
const N = Number(process.argv[2]) || 150
const BATCH = 15
const runId = `bench-${new Date().toISOString()}`

async function ask(op, items) {
  const res = await fetch(URL_, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ op, runId, items: items.map((it) => ({ key: it.id, sentence: it.sentence, exposure: it.exposure, comparator: it.comparator, outcome: it.outcome })) }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error ?? res.status)
  return { answers: new Map(data.answers.map((a) => [a.key, a.direction])), model: data.model }
}

const items = sample(await loadItems(), N)
const A = new Map(), B = new Map()
let models = {}
for (let i = 0; i < items.length; i += BATCH) {
  const chunk = items.slice(i, i + BATCH)
  const [a, b] = await Promise.all([ask('read_direction', chunk), ask('verify', chunk)])
  a.answers.forEach((v, k) => A.set(k, v))
  b.answers.forEach((v, k) => B.set(k, v))
  models = { first: a.model, second: b.model }
  process.stdout.write(`\r${Math.min(i + BATCH, items.length)}/${items.length}`)
}

const pct = (x, n) => (n ? `${((100 * x) / n).toFixed(1)} %` : '—')
let okA = 0, okB = 0, agree = 0, agreeOk = 0
for (const it of items) {
  const a = A.get(it.id), b = B.get(it.id)
  if (a === it.direction) okA++
  if (b === it.direction) okB++
  if (a && a === b) {
    agree++
    if (a === it.direction) agreeOk++
  }
}
const report = {
  runId,
  date: new Date().toISOString(),
  n: items.length,
  models,
  firstReadingAccuracy: okA / items.length,
  secondReadingAccuracy: okB / items.length,
  shownFraction: agree / items.length,
  shownAccuracy: agree ? agreeOk / agree : null,
  shownErrors: agree - agreeOk,
}
console.log(`
Fragmentos: ${items.length} (modelos: ${models.first} / ${models.second})
1.ª lectura sola: acierta ${pct(okA, items.length)}
2.ª lectura sola: acierta ${pct(okB, items.length)}
Regla «solo si coinciden»: se muestra el ${pct(agree, items.length)} · de lo mostrado acierta ${pct(agreeOk, agree)} · errores mostrados: ${agree - agreeOk}
El resto (${items.length - agree}) quedaría «en revisión».`)
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), 'results')
fs.mkdirSync(dir, { recursive: true })
fs.writeFileSync(path.join(dir, `${report.date.replace(/[:.]/g, '-')}.json`), JSON.stringify({ report, items: items.map((it) => ({ ...it, first: A.get(it.id), second: B.get(it.id) })) }, null, 2))
