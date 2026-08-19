// Motor de propagación del visor de flujo (MVP).
// Ver docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md §3.
//
// Limitaciones conocidas (explícitas, no deuda oculta):
// - Un edge = una influencia lineal ponderada por `strength`. No hay
//   AND/OR multi-dependencia por nodo.
// - No hay feedback loops / convergencia iterativa: el grafo se asume DAG.
// - `modulation.type` solo soporta "linear" — otros tipos quedan sin
//   implementar (needs verification si un dataset los usa).

/** @typedef {'ok'|'warning'|'critical'} NodeStatus */

const MODULATORS = {
  linear: (value) => value,
}

function resolveModulation(edge, ratio) {
  const type = edge.modulation?.type ?? 'linear'
  const modulator = MODULATORS[type] ?? MODULATORS.linear
  return modulator(ratio)
}

function findPrimaryNodeId(dataset) {
  const explicit = dataset.nodes.find((n) => n.isPrimary)
  if (explicit) return explicit.id
  // Fallback: primer nodo de la capa 1.
  const minLayer = Math.min(...dataset.nodes.map((n) => n.layer))
  const fallback = dataset.nodes.find((n) => n.layer === minLayer)
  if (!fallback) throw new Error('propagation: dataset sin nodos')
  return fallback.id
}

function buildGraph(dataset) {
  const incoming = new Map() // nodeId -> [edge, ...]
  const outgoing = new Map() // nodeId -> [nodeId, ...]
  for (const node of dataset.nodes) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  }
  for (const edge of dataset.edges) {
    if (!incoming.has(edge.to) || !outgoing.has(edge.from)) {
      // Edge apunta a un nodo inexistente: se ignora (el import valida esto
      // antes de llegar aquí; aquí solo evitamos crashear).
      continue
    }
    incoming.get(edge.to).push(edge)
    outgoing.get(edge.from).push(edge.to)
  }
  return { incoming, outgoing }
}

/** Orden topológico (Kahn) sobre todo el dataset. Asume DAG (spec §7). */
function topoSort(dataset, incoming, outgoing) {
  const inDegree = new Map(dataset.nodes.map((n) => [n.id, incoming.get(n.id).length]))
  const queue = dataset.nodes.filter((n) => inDegree.get(n.id) === 0).map((n) => n.id)
  const order = []
  while (queue.length > 0) {
    const id = queue.shift()
    order.push(id)
    for (const nextId of outgoing.get(id) ?? []) {
      inDegree.set(nextId, inDegree.get(nextId) - 1)
      if (inDegree.get(nextId) === 0) queue.push(nextId)
    }
  }
  return order
}

function reachableFrom(startId, outgoing) {
  const seen = new Set([startId])
  const stack = [startId]
  while (stack.length > 0) {
    const id = stack.pop()
    for (const nextId of outgoing.get(id) ?? []) {
      if (!seen.has(nextId)) {
        seen.add(nextId)
        stack.push(nextId)
      }
    }
  }
  return seen
}

function statusFor(value, node) {
  if (value < node.thresholdMin || value > node.thresholdMax) {
    return node.critical ? 'critical' : 'warning'
  }
  return 'ok'
}

/**
 * Propaga el valor primario por el grafo.
 * @param {object} dataset - shape spec §2 (config/layers/nodes/edges)
 * @param {number} primaryValue - valor actual del slider
 * @returns {{ nodeStates: Record<string, {value:number,status:NodeStatus,ratio:number}>,
 *             traversalOrder: Array<{id:string,cumulativeLagHours:number}> }}
 */
export function propagate(dataset, primaryValue) {
  const { incoming, outgoing } = buildGraph(dataset)
  const primaryId = findPrimaryNodeId(dataset)
  const order = topoSort(dataset, incoming, outgoing)
  const affected = reachableFrom(primaryId, outgoing)

  const ratios = new Map()
  const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]))

  for (const id of order) {
    const node = nodeById.get(id)
    if (id === primaryId) {
      ratios.set(id, primaryValue / node.thresholdMax)
      continue
    }
    const edges = incoming.get(id)
    if (edges.length === 0) {
      // Nodo sin dependencias entrantes y no primario: se asume aporte
      // externo estable (p.ej. dieta) — ratio neutro.
      ratios.set(id, 1)
      continue
    }
    let weightedSum = 0
    let weightTotal = 0
    for (const edge of edges) {
      const sourceRatio = ratios.get(edge.from) ?? 1
      const inverse = edge.relationship === 'decreases' || edge.relationship === 'inhibits'
      const contribution = resolveModulation(edge, inverse ? 1 - sourceRatio : sourceRatio)
      weightedSum += contribution * edge.strength
      weightTotal += edge.strength
    }
    ratios.set(id, weightTotal > 0 ? weightedSum / weightTotal : 1)
  }

  const nodeStates = {}
  for (const node of dataset.nodes) {
    const ratio = ratios.get(node.id) ?? 1
    const value = ratio * node.thresholdMax
    nodeStates[node.id] = { value, ratio, status: statusFor(value, node) }
  }

  // Orden de recorrido para el modo Play: solo nodos alcanzables desde el
  // nodo primario, en orden topológico, con lag acumulado.
  const cumulativeLag = new Map([[primaryId, 0]])
  const traversalOrder = []
  for (const id of order) {
    if (!affected.has(id)) continue
    const node = nodeById.get(id)
    if (id !== primaryId) {
      const parentLags = incoming
        .get(id)
        .filter((e) => affected.has(e.from))
        .map((e) => cumulativeLag.get(e.from) ?? 0)
      const base = parentLags.length > 0 ? Math.max(...parentLags) : 0
      cumulativeLag.set(id, base + (node.lagHours ?? 0))
    }
    traversalOrder.push({ id, cumulativeLagHours: cumulativeLag.get(id) })
  }

  return { nodeStates, traversalOrder, primaryId }
}

/** Deriva inputs/outputs de un nodo a partir de las edges (spec §4). */
export function nodeConnections(dataset, nodeId) {
  const inputs = dataset.edges.filter((e) => e.to === nodeId).map((e) => e.from)
  const outputs = dataset.edges.filter((e) => e.from === nodeId).map((e) => e.to)
  return { inputs, outputs }
}
