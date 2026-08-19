// Puerto de GROK/src/components/labs-strip.tsx, alimentado por
// config.vitalNodeIds (spec §2) + nodeStates del motor (no valores fijos).

const TONE_CLASS = { ok: 'vitals-bar__value--ok', warning: 'vitals-bar__value--warn', critical: 'vitals-bar__value--bad' }

export default function VitalsBar({ dataset, nodeStates, unit }) {
  const ids = dataset.config.vitalNodeIds ?? []
  if (ids.length === 0) return null

  return (
    <dl className="vitals-bar">
      {ids.map((id) => {
        const node = dataset.nodes.find((n) => n.id === id)
        const state = nodeStates[id]
        if (!node || !state) return null
        return (
          <div key={id} className="vitals-bar__card">
            <dt className="vitals-bar__key">{node.name}</dt>
            <dd className={`vitals-bar__value ${TONE_CLASS[state.status]}`}>
              {state.value.toFixed(1)} {unit}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}
