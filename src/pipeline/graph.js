// Modelo del grafo a partir del dossier: tema en el centro, dianas por
// capa, aristas = saltos citados. Tamaño = nº de papers que respaldan la
// diana (cantidad de evidencia, no gravedad).

import { LAYERS } from '../method/method.js'
import { hopsOf, TOPIC_KEY } from './chain.js'

const NO_LAYER = { id: 'sin_capa', name: 'Sin capa', hue: 40 }

export function graphOf(dossier, targets) {
  const nodes = [{ id: TOPIC_KEY, name: dossier.queryUsed ?? dossier.input, layer: null, isPrimary: true }]
  const nodeState = { [TOPIC_KEY]: 'on' }
  const weight = { [TOPIC_KEY]: 1 }
  const maxPapers = Math.max(1, ...targets.map((t) => t.papers))

  for (const t of targets) {
    nodes.push({ id: t.key, name: t.name, layer: t.layers[0] ?? NO_LAYER.id })
    nodeState[t.key] = t.contradictory ? 'split' : 'on'
    weight[t.key] = (t.papers - 1) / Math.max(1, maxPapers - 1)
  }

  // Dianas que solo aparecen en eslabones (sin fila de efecto propia).
  const known = new Set(nodes.map((n) => n.id))
  const edges = []
  for (const h of hopsOf(dossier)) {
    for (const [id, name, layer] of [
      [h.from, h.fromName, h.fromLayer],
      [h.to, h.toName, h.toLayer],
    ]) {
      if (known.has(id)) continue
      known.add(id)
      nodes.push({ id, name, layer: layer ?? NO_LAYER.id })
      nodeState[id] = 'on'
      weight[id] = 0
    }
    edges.push({ from: h.from, to: h.to, relationship: h.verb })
  }

  const used = new Set(nodes.map((n) => n.layer))
  const layers = [...LAYERS, NO_LAYER].filter((l) => used.has(l.id))
  return { layers, nodes, edges, nodeState, weight }
}
