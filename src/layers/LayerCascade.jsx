// Vista «Capas»: cada capa desplegable con sus dianas validadas. Selección
// propia; solo informa al padre de la diana pinchada.

import { useState } from 'react'
import { labelOf, stateOf } from '../engine/stateMeta.js'

export default function LayerCascade({ summaries, activeTargetKey, onSelectTarget }) {
  const firstWithTargets = summaries.find((s) => s.targets.length)?.layer.id ?? null
  const [openLayerId, setOpenLayerId] = useState(firstWithTargets)

  return (
    <div className="layer-cascade">
      {summaries.map(({ layer, state, targets }, i) => {
        const open = layer.id === openLayerId
        const vstate = stateOf(state)
        return (
          <div key={layer.id} className="layer-cascade__layer">
            <button
              type="button"
              className="layer-cascade__row"
              aria-expanded={open}
              disabled={targets.length === 0}
              onClick={() => setOpenLayerId(open ? null : layer.id)}
            >
              <span className={`layer-cascade__orb layer-cascade__orb--${vstate}`} style={{ '--layer-hue': layer.hue }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <span className="layer-cascade__title">
                <span className="layer-cascade__name">{layer.name}</span>
                <span className={`layer-cascade__badge layer-cascade__badge--${vstate}`}>{labelOf(state)}</span>
                <span className="layer-cascade__role">
                  {targets.length} diana{targets.length === 1 ? '' : 's'}
                  {targets.some((t) => t.contradictory) ? ' · hay direcciones opuestas' : ''}
                </span>
              </span>
            </button>

            {open && (
              <div className="layer-cascade__subs">
                {targets.map((t) => (
                  <button
                    type="button"
                    key={t.key}
                    className={`layer-cascade__sub layer-cascade__sub--${t.contradictory ? 'split' : 'on'}${t.key === activeTargetKey ? ' layer-cascade__sub--active' : ''}`}
                    onClick={() => onSelectTarget(t.key)}
                  >
                    <span className="layer-cascade__sub-dot" />
                    <span className="layer-cascade__sub-name">{t.name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
