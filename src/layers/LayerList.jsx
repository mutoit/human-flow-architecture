// Puerto de GROK/src/components/layer-rail.tsx — lista compartida 01..N,
// misma capa activa que la silueta y el grafo de subcapas (spec §9).

export default function LayerList({ layers, activeLayerId, layerReach, onSelect }) {
  return (
    <nav className="layer-list">
      <ol className="layer-list__ol">
        {layers.map((layer) => {
          const reach = layerReach[layer.id] ?? 'spared'
          const active = layer.id === activeLayerId
          const disabled = reach === 'spared'
          return (
            <li key={layer.id}>
              <button
                type="button"
                disabled={disabled}
                onClick={() => onSelect(layer.id)}
                className={`layer-list__btn layer-list__btn--${reach}${active ? ' layer-list__btn--active' : ''}`}
              >
                <span className="layer-list__index">{String(layer.id).padStart(2, '0')}</span>
                <span className="layer-list__name">{layer.name}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
