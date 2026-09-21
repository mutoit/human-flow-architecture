// Leyenda de estados (Activo / Rozado / Contradictorio / Apagado). Un solo
// componente para grafo y flujo total: mismos nombres, mismas definiciones
// (engine/reachMeta.js). `counts` opcional muestra cuántos hay de cada uno.

import { REACH_META, REACH_ORDER } from '../engine/reachMeta.js'

export default function ReachLegend({ counts = null, className = '' }) {
  return (
    <ul className={`reach-legend ${className}`.trim()} aria-label="Leyenda de estados">
      {REACH_ORDER.map((reach) => {
        const meta = REACH_META[reach]
        return (
          <li key={reach} className="reach-legend__item" title={`${meta.label}: ${meta.desc}`}>
            <i className={`reach-pip reach-pip--${meta.state}`} />
            <span className="reach-legend__label">{meta.label}</span>
            {counts ? <span className="reach-legend__count">{counts[reach] ?? 0}</span> : null}
          </li>
        )
      })}
    </ul>
  )
}
