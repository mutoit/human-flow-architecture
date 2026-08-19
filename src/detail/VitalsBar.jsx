// config.vitalNodeIds + nodeStates del lookup de findings (sin cifras calculadas).

const TONE_CLASS = {
  normal: 'vitals-bar__value--ok',
  alert: 'vitals-bar__value--warn',
  critical: 'vitals-bar__value--bad',
  contradictorio: 'vitals-bar__value--split',
}

const STATE_LABEL = {
  normal: 'Normal',
  alert: 'Alerta',
  critical: 'Crítico',
  contradictorio: 'Contradictorio',
}

export default function VitalsBar({ dataset, nodeStates }) {
  const ids = dataset.config.vitalNodeIds ?? []
  if (ids.length === 0) return null

  return (
    <dl className="vitals-bar">
      {ids.map((id) => {
        const node = dataset.nodes.find((n) => n.id === id)
        const state = nodeStates[id]
        if (!node || !state) return null
        const tone = TONE_CLASS[state.state] ?? 'vitals-bar__value--idle'
        const label = STATE_LABEL[state.state] ?? 'Sin hallazgo'
        return (
          <div key={id} className="vitals-bar__card">
            <dt className="vitals-bar__key">{node.name}</dt>
            <dd className={`vitals-bar__value ${tone}`}>{label}</dd>
          </div>
        )
      })}
    </dl>
  )
}
