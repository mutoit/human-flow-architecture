// Recorrido (pipeline) del tema a través de las capas (decisión D-cadena).
// Saltos posibles, todos con su frase:
//   - efecto con rol «actua_sobre»: tema → diana
//   - eslabón: A → B
// Las cadenas se unen por diana normalizada; si mezclan papers se marcan
// como ensambladas. Nunca se añade un salto que ninguna frase afirme.

import { targetKey } from './text.js'

export const TOPIC_KEY = '__tema__'
const MAX_DEPTH = 6

/** Grafo de saltos citados. */
export function hopsOf(dossier) {
  const hops = []
  for (const e of dossier.rows.effects) {
    if (e.role !== 'actua_sobre') continue
    hops.push({ from: TOPIC_KEY, to: targetKey(e.target), toName: e.target, toLayer: e.layer, verb: e.predicate, row: e, kind: 'efecto' })
  }
  for (const l of dossier.rows.links) {
    hops.push({
      from: targetKey(l.from_target),
      fromName: l.from_target,
      fromLayer: l.from_layer,
      to: targetKey(l.to_target),
      toName: l.to_target,
      toLayer: l.to_layer,
      verb: l.predicate,
      row: l,
      kind: 'eslabon',
    })
  }
  return hops
}

/**
 * Q: cadenas maximales que salen del tema (y sueltas, si no conectan con él).
 *    Cada cadena = lista de saltos; `assembled` si hay más de un paper.
 */
export function chainsOf(dossier) {
  const hops = hopsOf(dossier)
  const out = new Map()
  const incoming = new Set()
  for (const h of hops) {
    if (!out.has(h.from)) out.set(h.from, [])
    out.get(h.from).push(h)
    incoming.add(h.to)
  }

  const chains = []
  function walk(node, path, seen) {
    const next = (out.get(node) ?? []).filter((h) => !seen.has(h.to))
    if (next.length === 0 || path.length >= MAX_DEPTH) {
      if (path.length) chains.push(path)
      return
    }
    for (const h of next) walk(h.to, [...path, h], new Set([...seen, h.to]))
  }

  walk(TOPIC_KEY, [], new Set([TOPIC_KEY]))
  const reachable = new Set(chains.flat().map((h) => h.to))
  for (const start of out.keys()) {
    if (start === TOPIC_KEY || incoming.has(start) || reachable.has(start)) continue
    walk(start, [], new Set([start]))
  }

  // Una cadena contenida en otra más larga no aporta: solo se listan las maximales.
  const sig = (c) => c.map((h) => `${h.from}>${h.to}`).join('|')
  const sigs = chains.map(sig)
  return chains
    .filter((c, i) => !sigs.some((s, j) => j !== i && s.length > sigs[i].length && s.startsWith(sigs[i])))
    .map((hops) => ({
      hops,
      fromTopic: hops[0].from === TOPIC_KEY,
      papers: [...new Set(hops.map((h) => h.row.paperId))],
      assembled: new Set(hops.map((h) => h.row.paperId)).size > 1,
      layers: [...new Set(hops.flatMap((h) => [h.fromLayer, h.toLayer]).filter(Boolean))],
    }))
}
