// Motor de transcripción del visor de flujo.
// Spec: docs/superpowers/specs/2026-08-19-catalogo-evidencia-cascada-design.md §1
// Plan:  docs/plans/2026-08-19-catalogo-evidencia-cascada.md Ola 1
//
// P: dataset con nodes[].findings y un scenarioId.
// Q: nodeStates[id] = lookup literal de findings[scenarioId] —
//    0 findings → inactivo (state null), 1 state → ese state,
//    >1 states distintos → "contradictorio". Cero aritmética clínica.

/** @typedef {'normal'|'alert'|'critical'|'contradictorio'} NodeState */

function findPrimaryNodeIds(dataset) {
  const explicit = dataset.nodes.filter((n) => n.isPrimary).map((n) => n.id)
  if (explicit.length > 0) return explicit
  const minLayer = Math.min(...dataset.nodes.map((n) => n.layer))
  const fallback = dataset.nodes.find((n) => n.layer === minLayer)
  if (!fallback) throw new Error('propagation: dataset sin nodos')
  return [fallback.id]
}

function buildGraph(dataset) {
  const incoming = new Map()
  const outgoing = new Map()
  for (const node of dataset.nodes) {
    incoming.set(node.id, [])
    outgoing.set(node.id, [])
  }
  for (const edge of dataset.edges) {
    if (!incoming.has(edge.to) || !outgoing.has(edge.from)) continue
    incoming.get(edge.to).push(edge)
    outgoing.get(edge.from).push(edge.to)
  }
  return { incoming, outgoing }
}

/** Rango numérico 0–1 o etiqueta cualitativa → número para elegir vía dominante. */
function strengthRank(strength) {
  if (strength === 'fuerte') return 0.9
  if (strength === 'moderada') return 0.55
  if (strength === 'débil') return 0.2
  const n = Number(strength)
  return Number.isFinite(n) ? n : 0
}

/**
 * P: node con findings opcional, scenarioId string.
 * Q: { state, findings } sin ponderar ni interpolar.
 */
export function resolveNodeState(node, scenarioId) {
  const findings = Array.isArray(node.findings?.[scenarioId]) ? node.findings[scenarioId] : []
  if (findings.length === 0) return { state: null, findings: [] }
  const states = new Set(findings.map((f) => f.state))
  const state = states.size > 1 ? 'contradictorio' : findings[0].state
  return { state, findings }
}

/**
 * P: dataset validado + scenarioId de config.severityScenarios.
 * Q: nodeStates por lookup; primaryIds para pathFromPrimary. Sin ratio,
 *    sin threshold, sin iteración, sin converged.
 */
export function propagate(dataset, scenarioId) {
  const primaryIds = findPrimaryNodeIds(dataset)
  const nodeStates = {}
  for (const node of dataset.nodes) {
    nodeStates[node.id] = resolveNodeState(node, scenarioId)
  }
  return { nodeStates, primaryId: primaryIds[0], primaryIds }
}

/** Deriva inputs/outputs de un nodo a partir de las edges. */
export function nodeConnections(dataset, nodeId) {
  const inputs = dataset.edges.filter((e) => e.to === nodeId).map((e) => e.from)
  const outputs = dataset.edges.filter((e) => e.from === nodeId).map((e) => e.to)
  return { inputs, outputs }
}

/**
 * Cadena causal por edges documentados, no por cálculo.
 * En cada paso hacia atrás elige el edge de mayor `strength` (etiqueta
 * o 0–1) como vía dominante. Si entra en un ciclo, cierra ahí.
 */
export function pathFromPrimary(dataset, nodeId) {
  const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]))
  if (!nodeById.has(nodeId)) return []

  const primarySet = new Set(findPrimaryNodeIds(dataset))
  if (primarySet.has(nodeId)) return [nodeId]

  const { incoming } = buildGraph(dataset)
  const chain = [nodeId]
  const seen = new Set([nodeId])
  let currentId = nodeId

  while (!primarySet.has(currentId)) {
    const edges = incoming.get(currentId) ?? []
    if (edges.length === 0) return []
    const best = edges.reduce((a, b) => (strengthRank(b.strength) > strengthRank(a.strength) ? b : a))
    chain.push(best.from)
    if (seen.has(best.from)) return chain.reverse()
    seen.add(best.from)
    currentId = best.from
  }

  return chain.reverse()
}
