// Mide, sin IA, los vetos del control (src/pipeline/gate.js) sobre el
// corpus real: cuántas filas correctas rechazan y cuántos errores
// inyectados atrapan. Uso: npm run bench:offline

import { loadItems } from './data.mjs'
import { significanceVeto } from '../src/pipeline/gate.js'

const items = await loadItems()
const pct = (a, b) => `${((100 * a) / b).toFixed(1)} %`
const faults = {
  'efecto → sin efecto': (d) => (d !== 'sin_efecto' ? 'sin_efecto' : null),
  'sin efecto → efecto': (d) => (d === 'sin_efecto' ? 'aumenta' : null),
  'sube ↔ baja': (d) => ({ aumenta: 'disminuye', disminuye: 'aumenta' })[d] ?? null,
}
let wrong = 0
for (const it of items) if (significanceVeto(it.sentence, it.direction)) wrong++
console.log(`Corpus: ${items.length} fragmentos anotados por médicos`)
console.log(`Veto de significación — rechaza filas correctas: ${pct(wrong, items.length)}`)
for (const [name, f] of Object.entries(faults)) {
  let n = 0, caught = 0
  for (const it of items) {
    const bad = f(it.direction)
    if (!bad) continue
    n++
    if (significanceVeto(it.sentence, bad)) caught++
  }
  console.log(`  error inyectado «${name}»: atrapa ${pct(caught, n)}`)
}
