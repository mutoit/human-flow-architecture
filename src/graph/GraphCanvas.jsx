import { useMemo } from 'react'
import LayerRow from './LayerRow.jsx'
import EdgeFlow from './EdgeFlow.jsx'
import { computeLayout, VIEW_WIDTH } from './layout.js'

export default function GraphCanvas({ dataset, nodeStates, variant, selectedNodeId, activeNodeIds, onSelectNode }) {
  const { positions, layersSorted, totalHeight } = useMemo(() => computeLayout(dataset), [dataset])

  const nodesByLayer = useMemo(() => {
    const map = new Map(layersSorted.map((l) => [l.id, []]))
    for (const node of dataset.nodes) {
      if (!map.has(node.layer)) map.set(node.layer, [])
      map.get(node.layer).push(node)
    }
    return map
  }, [dataset, layersSorted])

  return (
    <svg className="graph-canvas" viewBox={`0 0 ${VIEW_WIDTH} ${totalHeight}`} role="img" aria-label="Grafo de flujo por capas">
      <g className="graph-canvas__edges">
        {dataset.edges.map((edge, i) => (
          <EdgeFlow
            key={`${edge.from}-${edge.to}-${i}`}
            edge={edge}
            from={positions.get(edge.from)}
            to={positions.get(edge.to)}
            variant={variant}
            isActive={activeNodeIds.has(edge.from) && activeNodeIds.has(edge.to)}
          />
        ))}
      </g>
      <g className="graph-canvas__layers">
        {layersSorted.map((layer, layerIndex) => (
          <LayerRow
            key={layer.id}
            layer={layer}
            layerIndex={layerIndex}
            nodes={nodesByLayer.get(layer.id) ?? []}
            positions={positions}
            nodeStates={nodeStates}
            selectedNodeId={selectedNodeId}
            activeNodeIds={activeNodeIds}
            onSelectNode={onSelectNode}
          />
        ))}
      </g>
    </svg>
  )
}
