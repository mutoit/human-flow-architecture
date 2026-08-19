import NodeCard from './NodeCard.jsx'
import { LAYER_HEIGHT, VIEW_WIDTH } from './layout.js'

export default function LayerRow({ layer, layerIndex, nodes, positions, nodeStates, selectedNodeId, activeNodeIds, onSelectNode }) {
  const y = layerIndex * LAYER_HEIGHT

  return (
    <g className="layer-row">
      <rect x={0} y={y} width={VIEW_WIDTH} height={LAYER_HEIGHT} className="layer-row__band" />
      <text x={24} y={y + 24} className="layer-row__label">
        {`L${layer.id} · ${layer.name}`}
      </text>
      {nodes.map((node) => (
        <NodeCard
          key={node.id}
          node={node}
          position={positions.get(node.id)}
          state={nodeStates[node.id]}
          isSelected={selectedNodeId === node.id}
          isActive={activeNodeIds.has(node.id)}
          onSelect={onSelectNode}
        />
      ))}
    </g>
  )
}
