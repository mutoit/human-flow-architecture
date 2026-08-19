import { nodeConnections } from '../engine/propagation.js'

const STATUS_LABEL = { ok: 'Normal', warning: 'Advertencia', critical: 'Crítico' }

export default function DetailPanel({ dataset, node, state, onClose }) {
  if (!node) return null
  const { inputs, outputs } = nodeConnections(dataset, node.id)
  const nameOf = (id) => dataset.nodes.find((n) => n.id === id)?.name ?? id

  return (
    <aside className="detail-panel">
      <button className="detail-panel__close" onClick={onClose} aria-label="Cerrar">
        ✕
      </button>
      <h2 className="detail-panel__title">{node.name}</h2>
      <p className="detail-panel__meta">
        Capa {node.layer} · {STATUS_LABEL[state?.status ?? 'ok']}
        {node.critical ? ' · Nodo crítico' : ''}
      </p>

      {node.description && <p className="detail-panel__description">{node.description}</p>}

      <div className="detail-panel__section">
        <h3>Valor actual</h3>
        <p>
          {state ? Math.round(state.value) : '—'} (rango normal {node.thresholdMin}–{node.thresholdMax})
        </p>
      </div>

      <div className="detail-panel__section">
        <h3>Inputs</h3>
        {inputs.length === 0 ? <p className="detail-panel__empty">Sin dependencias entrantes</p> : (
          <ul>{inputs.map((id) => <li key={id}>{nameOf(id)}</li>)}</ul>
        )}
      </div>

      <div className="detail-panel__section">
        <h3>Outputs</h3>
        {outputs.length === 0 ? <p className="detail-panel__empty">Sin efectos aguas abajo</p> : (
          <ul>{outputs.map((id) => <li key={id}>{nameOf(id)}</li>)}</ul>
        )}
      </div>
    </aside>
  )
}
