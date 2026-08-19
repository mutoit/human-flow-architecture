// Puerto de GROK/segunda vista/app.js (renderCascade) — capas expandibles
// con subnodos reales del dataset (dataset.nodes agrupados por layer), no
// contenido fijo como en el original (spec §9, mapeo de datos).
//
// Selección independiente (Rev4, feedback del usuario): este panel tiene
// su propio estado de expandido/seleccionado, desacoplado del muñeco y de
// la lista de capas. Solo informa al padre vía onSelectNode (para que la
// Ficha B, en el panel central, muestre el detalle de lo que se pincha
// aquí) — no toca la selección global (Ficha A).

import { useState } from 'react'

const REACH_LABEL = { hit: 'activa', faint: 'rozada', spared: 'fuera' }

function countByReach(nodeIds, nodeReach) {
  const c = { hit: 0, faint: 0, spared: 0 }
  for (const id of nodeIds) c[nodeReach[id] ?? 'spared']++
  return c
}

export default function LayerCascade({ layers, dataset, nodeReach, onSelectNode }) {
  const [openLayerId, setOpenLayerId] = useState(layers[0]?.id ?? null)
  const [selectedNodeId, setSelectedNodeId] = useState(null)

  function selectNode(nodeId) {
    setSelectedNodeId(nodeId)
    onSelectNode(nodeId)
  }

  return (
    <div className="layer-cascade">
      {layers.map((layer) => {
        const nodes = dataset.nodes.filter((n) => n.layer === layer.id)
        const nodeIds = nodes.map((n) => n.id)
        const counts = countByReach(nodeIds, nodeReach)
        const layerReach = counts.hit > 0 ? 'hit' : counts.faint > 0 ? 'faint' : 'spared'
        const open = layer.id === openLayerId

        return (
          <div key={layer.id} className="layer-cascade__layer">
            <button
              type="button"
              className="layer-cascade__row"
              aria-expanded={open}
              onClick={() => setOpenLayerId(open ? null : layer.id)}
            >
              <span className={`layer-cascade__orb layer-cascade__orb--${layerReach}`}>
                {String(layer.id).padStart(2, '0')}
              </span>
              <span className="layer-cascade__title">
                <span className="layer-cascade__name">{layer.name}</span>
                <span className={`layer-cascade__badge layer-cascade__badge--${layerReach}`}>{REACH_LABEL[layerReach]}</span>
                <span className="layer-cascade__role">
                  {counts.hit} activos · {counts.faint} rozados · {counts.spared} fuera
                </span>
              </span>
            </button>

            {open && (
              <div className="layer-cascade__subs">
                {nodes.map((node) => {
                  const reach = nodeReach[node.id] ?? 'spared'
                  const state = reach === 'hit' ? 'on' : reach === 'faint' ? 'soft' : 'off'
                  return (
                    <button
                      type="button"
                      key={node.id}
                      className={`layer-cascade__sub layer-cascade__sub--${state}${node.id === selectedNodeId ? ' layer-cascade__sub--active' : ''}`}
                      onClick={() => selectNode(node.id)}
                    >
                      <span className="layer-cascade__sub-dot" />
                      <span className="layer-cascade__sub-name">{node.name}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
