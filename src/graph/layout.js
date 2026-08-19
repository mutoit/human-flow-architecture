// Cálculo de posiciones para el layout de capas apiladas (SVG).
export const VIEW_WIDTH = 1100
export const LAYER_HEIGHT = 150
export const LAYER_PADDING_X = 90
export const NODE_MIN_RADIUS = 20
export const NODE_MAX_RADIUS = 38

export function computeLayout(dataset) {
  const layersSorted = [...dataset.layers].sort((a, b) => a.id - b.id)
  const nodesByLayer = new Map(layersSorted.map((l) => [l.id, []]))
  for (const node of dataset.nodes) {
    if (!nodesByLayer.has(node.layer)) nodesByLayer.set(node.layer, [])
    nodesByLayer.get(node.layer).push(node)
  }

  const connectionCount = new Map(dataset.nodes.map((n) => [n.id, 0]))
  for (const edge of dataset.edges) {
    connectionCount.set(edge.from, (connectionCount.get(edge.from) ?? 0) + 1)
    connectionCount.set(edge.to, (connectionCount.get(edge.to) ?? 0) + 1)
  }
  const maxConnections = Math.max(1, ...connectionCount.values())

  const positions = new Map()
  layersSorted.forEach((layer, layerIndex) => {
    const nodes = nodesByLayer.get(layer.id) ?? []
    const y = layerIndex * LAYER_HEIGHT + LAYER_HEIGHT / 2
    const usableWidth = VIEW_WIDTH - LAYER_PADDING_X * 2
    nodes.forEach((node, i) => {
      const x =
        nodes.length === 1
          ? VIEW_WIDTH / 2
          : LAYER_PADDING_X + (usableWidth * i) / (nodes.length - 1)
      const ratio = (connectionCount.get(node.id) ?? 0) / maxConnections
      const radius = NODE_MIN_RADIUS + ratio * (NODE_MAX_RADIUS - NODE_MIN_RADIUS)
      positions.set(node.id, { x, y, radius })
    })
  })

  return {
    positions,
    layersSorted,
    totalHeight: layersSorted.length * LAYER_HEIGHT,
  }
}
