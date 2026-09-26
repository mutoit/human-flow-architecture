// Leyenda de estados de capa. Nombres y definiciones: engine/stateMeta.js.

import { LAYER_STATES, LAYER_STATE_ORDER } from '../engine/stateMeta.js'

export default function StateLegend({ counts = null, className = '' }) {
  return (
    <ul className={`reach-legend ${className}`.trim()} aria-label="Leyenda de estados">
      {LAYER_STATE_ORDER.map((key) => {
        const meta = LAYER_STATES[key]
        return (
          <li key={key} className="reach-legend__item" title={`${meta.label}: ${meta.desc}`}>
            <i className={`reach-pip reach-pip--${meta.state}`} />
            <span className="reach-legend__label">{meta.label}</span>
            {counts ? <span className="reach-legend__count">{counts[key] ?? 0}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
