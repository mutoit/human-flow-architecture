// Las 13 capas (src/method/layers.json) con su estado y su conteo de
// literatura. Se puede abrir cualquier capa: también las vacías, para ver
// la consulta exacta y por qué están vacías.

import { labelOf, stateOf } from '../engine/stateMeta.js'

export default function LayerList({ summaries, activeLayerId, onSelect }) {
  return (
    <nav className="layer-list" aria-label="Capas del cuerpo">
      <ol className="layer-list__ol">
        {summaries.map(({ layer, state, map }, i) => {
          const active = layer.id === activeLayerId
          return (
            <li key={layer.id}>
              <button
                type="button"
                onClick={() => onSelect(layer.id)}
                title={labelOf(state)}
                aria-current={active ? 'true' : undefined}
                className={`layer-list__btn layer-list__btn--${stateOf(state)}${active ? ' layer-list__btn--active' : ''}`}
              >
                <span className="layer-list__index" style={{ '--layer-hue': layer.hue }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className="layer-list__name">{layer.name}</span>
                <span className="layer-list__count">{map?.count != null ? map.count.toLocaleString('es') : ''}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
