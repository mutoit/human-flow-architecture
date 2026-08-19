// Las 3 variantes de animación de flujo sobre una edge (spec §4).
// variant: 'particles' | 'pulse' | 'combined'

function edgePath(from, to) {
  const midY = (from.y + to.y) / 2
  const startY = from.y + from.radius
  const endY = to.y - to.radius
  return `M ${from.x} ${startY} C ${from.x} ${midY}, ${to.x} ${midY}, ${to.x} ${endY}`
}

export default function EdgeFlow({ edge, from, to, variant, isActive, pathId }) {
  if (!from || !to) return null
  const d = edgePath(from, to)
  const showParticles = variant === 'particles' || variant === 'combined'
  const showPulse = variant === 'pulse' || variant === 'combined'
  const strokeColor = isActive ? 'rgba(148, 197, 255, 0.55)' : 'rgba(148, 163, 184, 0.25)'

  return (
    <g className="edge-flow">
      <path id={pathId} d={d} fill="none" stroke={strokeColor} strokeWidth={1.5 + edge.strength * 2} />

      {showPulse && isActive && (
        <path
          d={d}
          fill="none"
          stroke="#7dd3fc"
          strokeWidth={2 + edge.strength * 2}
          strokeDasharray="14 22"
          className="edge-flow__pulse"
        />
      )}

      {showParticles &&
        isActive &&
        [0, 0.33, 0.66].map((delay) => (
          <circle key={delay} r={3.5} fill="#e0f2fe" className="edge-flow__particle">
            <animateMotion dur="1.6s" begin={`${delay * 1.6}s`} repeatCount="indefinite" path={d} rotate="auto" />
          </circle>
        ))}
    </g>
  )
}
