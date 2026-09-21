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
import { REACH_META, countReach, labelOfReach, stateOfReach, strongestReach } from '../engine/reachMeta.js'

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
        const reaches = nodeIds.map((id) => nodeReach[id] ?? 'spared')
        const counts = countReach(reaches)
        const layerReach = strongestReach(reaches)
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
                <span className={`layer-cascade__badge layer-cascade__badge--${layerReach}`}>{labelOfReach(layerReach)}</span>
                <span className="layer-cascade__role">
                  {counts.hit} {REACH_META.hit.plural} · {counts.faint} {REACH_META.faint.plural}
                  {counts.contradictorio ? ` · ${counts.contradictorio} ${REACH_META.contradictorio.plural}` : ''} ·{' '}
                  {counts.spared} {REACH_META.spared.plural}
                </span>
              </span>
            </button>

            {open && (
              <div className="layer-cascade__subs">
                {nodes.map((node) => {
                  const reach = nodeReach[node.id] ?? 'spared'
                  const state = stateOfReach(reach)
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
