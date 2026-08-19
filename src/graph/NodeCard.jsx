const STATUS_COLOR = {
  ok: '#10b981',
  warning: '#f59e0b',
  critical: '#ef4444',
}

export default function NodeCard({ node, position, state, isSelected, isActive, onSelect }) {
  const color = STATUS_COLOR[state?.status ?? 'ok']
  const glow = node.critical ? position.radius * 1.9 : position.radius * 1.3

  return (
    <g
      className={`node-card${isActive ? ' node-card--active' : ''}`}
      transform={`translate(${position.x} ${position.y})`}
      onClick={() => onSelect(node.id)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onSelect(node.id)
      }}
    >
      <circle r={glow} fill={color} opacity={node.critical ? 0.22 : 0.12} className="node-card__glow" />
      <circle
        r={position.radius}
        fill={color}
        opacity={0.9}
        stroke={isSelected ? '#e2e8f0' : 'rgba(255,255,255,0.35)'}
        strokeWidth={isSelected ? 3 : 1.5}
        className="node-card__body"
      />
      <text y={position.radius + 16} textAnchor="middle" className="node-card__label">
        {node.name}
      </text>
      <text y={4} textAnchor="middle" className="node-card__value">
        {state ? Math.round(state.value) : ''}
      </text>
    </g>
  )
}
