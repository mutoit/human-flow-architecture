// Motor de propagación del visor de flujo.
// Ver docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md §3 y
// docs/plans/2026-08-19-visor-flujo-mvp.md Rev9.
//
// Limitaciones conocidas (explícitas, no deuda oculta):
// - Un edge = una influencia lineal ponderada por `strength`. No hay
//   AND/OR multi-dependencia por nodo.
// - `modulation.type` solo soporta "linear" — otros tipos quedan sin
//   implementar (needs verification si un dataset los usa).
// - (Rev9) Los ciclos SÍ se soportan vía `propagateIterative`, pero la
//   convergencia no está garantizada: un bucle de retroalimentación
//   negativa puede oscilar en vez de estabilizarse — es un resultado
//   biológicamente esperado (ver Rev9, Industry), no un fallo del motor.
//   `converged: false` en el resultado es un estado válido.

/** @typedef {'ok'|'warning'|'critical'} NodeStatus */

const MODULATORS = {
  linear: (value) => value,
}

function resolveModulation(edge, ratio) {
  const type = edge.modulation?.type ?? 'linear'
  const modulator = MODULATORS[type] ?? MODULATORS.linear
  return modulator(ratio)
}

/**
 * Nodos primarios del dataset (Rev9: puede haber más de uno). Si no hay
 * ninguno marcado `isPrimary: true`, cae al primer nodo de la capa mínima
 * (mismo fallback que antes de Rev9, ahora envuelto en array).
 */
function findPrimaryNodeIds(dataset) {
  const explicit = dataset.nodes.filter((n) => n.isPrimary).map((n) => n.id)
  if (explicit.length > 0) return explicit
  const minLayer = Math.min(...dataset.nodes.map((n) => n.layer))
  const fallback = dataset.nodes.find((n) => n.layer === minLayer)
  if (!fallback) throw new Error('propagation: dataset sin nodos')
  return [fallback.id]
}

/**
 * Normaliza el segundo argumento de `propagate()`: un `number` (uso
 * habitual, un solo primario) o un objeto `{ [nodeId]: number }`
 * (Rev9, varios primarios a la vez). Compatible 1:1 con el uso actual
 * de `App.jsx` (siempre pasa un número).
 */
function normalizePrimaryValues(primaryValue, primaryIds) {
  if (primaryValue !== null && typeof primaryValue === 'object') return primaryValue
  return { [primaryIds[0]]: primaryValue }
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

/**
 * Orden topológico (Kahn). Si el dataset tiene un ciclo, `order` queda
 * más corto que `dataset.nodes` — eso es la señal que usa `propagate()`
 * para detectar el ciclo (Rev9), en vez de dejarlo pasar en silencio.
 */
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

/** Unión de nodos alcanzables desde uno o varios orígenes. */
function reachableFrom(startIds, outgoing) {
  const ids = Array.isArray(startIds) ? startIds : [startIds]
  const seen = new Set(ids)
  const stack = [...ids]
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
 * Propaga el valor primario por el grafo. Si el grafo tiene un ciclo,
 * delega automáticamente a `propagateIterative` (Rev9) — transparente
 * para quien llama, mismo contrato de salida.
 * @param {object} dataset - shape spec §2 (config/layers/nodes/edges)
 * @param {number|Record<string,number>} primaryValue - valor del
 *   escenario activo (un número = un primario, como siempre; un objeto
 *   `{nodeId: number}` = varios primarios a la vez, Rev9)
 * @returns {{ nodeStates: Record<string, {value:number,status:NodeStatus,ratio:number}>,
 *             traversalOrder: Array<{id:string,cumulativeLagHours:number}>,
 *             primaryId: string, primaryIds: string[],
 *             converged?: boolean, iterations?: number }}
 */
export function propagate(dataset, primaryValue) {
  const { incoming, outgoing } = buildGraph(dataset)
  const primaryIds = findPrimaryNodeIds(dataset)
  const primaryValues = normalizePrimaryValues(primaryValue, primaryIds)
  const order = topoSort(dataset, incoming, outgoing)

  if (order.length !== dataset.nodes.length) {
    // Ciclo: Kahn no puede visitar todo el grafo en un pase — se delega
    // al motor iterativo en vez de calcular sobre un orden incompleto.
    return propagateIterative(dataset, primaryValues, primaryIds, incoming, outgoing)
  }

  const primarySet = new Set(primaryIds)
  const affected = reachableFrom(primaryIds, outgoing)

  const ratios = new Map()
  const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]))

  for (const id of order) {
    const node = nodeById.get(id)
    if (primarySet.has(id)) {
      const val = primaryValues[id]
      ratios.set(id, val !== undefined ? val / node.thresholdMax : 1)
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

  // Orden de recorrido (usado hoy solo para saber qué nodos están
  // afectados — ver App.jsx `affectedIds`; `cumulativeLagHours` queda
  // como dato informativo, sin consumidor tras quitar el modo Play).
  const cumulativeLag = new Map(primaryIds.map((id) => [id, 0]))
  const traversalOrder = []
  for (const id of order) {
    if (!affected.has(id)) continue
    const node = nodeById.get(id)
    if (!primarySet.has(id)) {
      const parentLags = incoming
        .get(id)
        .filter((e) => affected.has(e.from))
        .map((e) => cumulativeLag.get(e.from) ?? 0)
      const base = parentLags.length > 0 ? Math.max(...parentLags) : 0
      cumulativeLag.set(id, base + (node.lagHours ?? 0))
    }
    traversalOrder.push({ id, cumulativeLagHours: cumulativeLag.get(id) })
  }

  return { nodeStates, traversalOrder, primaryId: primaryIds[0], primaryIds }
}

/**
 * Motor iterativo (Rev9) — se activa solo cuando el dataset tiene un
 * ciclo (retroalimentación). Jacobi amortiguado: en cada iteración,
 * cada nodo se recalcula a partir de la "foto" de la iteración
 * anterior (nunca de valores ya actualizados en la misma pasada), con
 * un factor de amortiguación (`alpha`) para estabilidad numérica.
 *
 * La fórmula por edge es la MISMA que el camino DAG de `propagate()`
 * (invertir `sourceRatio` antes de ponderar por `strength`, no
 * después; sin duplicar `strength`) — deben dar el mismo resultado si
 * un dataset con ciclo se "rompiera" en un DAG equivalente.
 *
 * Parada por convergencia real (`maxDelta < epsilon`), no por conteo
 * fijo de iteraciones — `maxIter` es un techo de seguridad. Un bucle de
 * retroalimentación negativa puede no converger nunca (oscila) — eso
 * es un resultado válido, se expone en `converged: false`.
 */
function propagateIterative(dataset, primaryValues, primaryIds, incoming, outgoing, opts = {}) {
  const { maxIter = 200, epsilon = 0.001, alpha = 0.5 } = opts
  const primarySet = new Set(primaryIds)

  let ratios = new Map()
  for (const node of dataset.nodes) {
    if (primarySet.has(node.id)) {
      const val = primaryValues[node.id]
      ratios.set(node.id, val !== undefined ? val / node.thresholdMax : 1)
    } else {
      ratios.set(node.id, 1)
    }
  }

  let converged = false
  let iterations = 0

  for (; iterations < maxIter; iterations++) {
    const next = new Map(ratios)
    let maxDelta = 0

    for (const node of dataset.nodes) {
      if (primarySet.has(node.id)) continue // primario fijo, no se recalcula

      const edges = incoming.get(node.id) ?? []
      let raw
      if (edges.length === 0) {
        raw = 1
      } else {
        let weightedSum = 0
        let weightTotal = 0
        for (const edge of edges) {
          const sourceRatio = ratios.get(edge.from) ?? 1 // Jacobi: foto de la iteración anterior
          const inverse = edge.relationship === 'decreases' || edge.relationship === 'inhibits'
          const contribution = resolveModulation(edge, inverse ? 1 - sourceRatio : sourceRatio)
          weightedSum += contribution * edge.strength
          weightTotal += edge.strength
        }
        raw = weightTotal > 0 ? weightedSum / weightTotal : 1
      }

      const old = ratios.get(node.id) ?? 1
      const damped = old * (1 - alpha) + raw * alpha
      next.set(node.id, damped)
      maxDelta = Math.max(maxDelta, Math.abs(damped - old))
    }

    ratios = next
    if (maxDelta < epsilon) {
      converged = true
      iterations++
      break
    }
  }

  const nodeById = new Map(dataset.nodes.map((n) => [n.id, n]))
  const nodeStates = {}
  for (const node of dataset.nodes) {
    const ratio = ratios.get(node.id) ?? 1
    const value = ratio * node.thresholdMax
    nodeStates[node.id] = { value, ratio, status: statusFor(value, node) }
  }

  const affected = reachableFrom(primaryIds, outgoing)
  const traversalOrder = dataset.nodes
    .filter((n) => affected.has(n.id))
    .map((n) => ({ id: n.id, cumulativeLagHours: 0 }))

  return { nodeStates, traversalOrder, primaryId: primaryIds[0], primaryIds, converged, iterations }
}

/** Deriva inputs/outputs de un nodo a partir de las edges (spec §4). */
export function nodeConnections(dataset, nodeId) {
  const inputs = dataset.edges.filter((e) => e.to === nodeId).map((e) => e.from)
  const outputs = dataset.edges.filter((e) => e.from === nodeId).map((e) => e.to)
  return { inputs, outputs }
}

/**
 * Cadena representativa desde un nodo primario hasta `nodeId` (spec
 * §10.1): "¿cómo llegó la carencia hasta aquí?". No enumera todas las
 * rutas posibles (el grafo puede tener varios padres por nodo) — en
 * cada paso hacia atrás elige el edge entrante de mayor `strength`, la
 * vía dominante. Multi-primario (Rev9): para en cualquier nodo
 * primario, no en uno fijo.
 * @returns {string[]} ids desde el primario hasta `nodeId`. Si `nodeId`
 *   no es alcanzable, `[]`. Si el camino de vuelta entra en un ciclo
 *   antes de llegar a un primario, devuelve la cadena parcial hasta
 *   ese punto (Rev9) — más honesto que fingir "no alcanzado".
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
    if (edges.length === 0) return [] // callejón sin salida real, no alcanzable
    const best = edges.reduce((a, b) => ((b.strength ?? 0) > (a.strength ?? 0) ? b : a))
    chain.push(best.from)
    if (seen.has(best.from)) return chain.reverse() // ciclo: cierra aquí, no finge "no alcanzado"
    seen.add(best.from)
    currentId = best.from
  }

  return chain.reverse()
}
