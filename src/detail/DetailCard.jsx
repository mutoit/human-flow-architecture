// Ficha compartida entre silueta, grafo de subcapas y lista (spec §4/§9) —
// puerto fusionado de GROK layer-detail.tsx + segunda vista/app.js
// renderDetail(), más el bloque causal §10.1.
//
// Tabs internos (Rev8, feedback del usuario): "Resultado" / "Lecturas",
// estado local — cada instancia (Ficha A, Ficha B) es independiente, no
// se comparte entre paneles (mismo principio que su selección, Rev4).
//
// Rev15: la cadena causal y la sección "Afecta a" leen `dataset.edges`
// directo (relationship + strength) — el motor ya calculaba esto para
// propagar valores, pero no llegaba a la UI. No se usa
// `nodeConnections()` de engine/propagation.js: esa función solo
// devuelve ids, no el tipo de relación ni la fuerza, que es justo lo
// que faltaba mostrar.

import { useState } from 'react'
import { pubmedUrl } from '../engine/citations.js'
import { IconExternalLink } from '../icons.jsx'

const REACH_LABEL = { hit: 'Alcanzada', faint: 'Rozada', spared: 'No llega' }

// Verbo + signo por tipo de relación (spec DATASET_PROMPT §3.5).
const RELATION_LABEL = {
  increases: { verb: 'aumenta', sign: 'pos' },
  activates: { verb: 'activa', sign: 'pos' },
  decreases: { verb: 'reduce', sign: 'neg' },
  inhibits: { verb: 'inhibe', sign: 'neg' },
}

function relationLabel(relationship) {
  return RELATION_LABEL[relationship] ?? { verb: 'afecta', sign: 'neutral' }
}

export default function DetailCard({ dataset, layer, node, nodeState, reach, chain, scenarioId, emptyHint }) {
  const [tab, setTab] = useState('resultado')

  if (!node || !layer) {
    return <p className="detail-card__empty">{emptyHint ?? 'Selecciona una capa o un nodo para ver su ficha.'}</p>
  }

  const signs = node.symptomsBySeverity?.[scenarioId] ?? []
  const chainNodes = chain.map((id) => dataset.nodes.find((n) => n.id === id)).filter(Boolean)
  const refCount = node.references?.length ?? 0

  // Rev15: arista real entre cada salto consecutivo de la cadena (para
  // mostrar el verbo, no solo el nombre) y outputs directos del nodo
  // seleccionado ("Afecta a").
  const edgeBetween = (fromId, toId) => dataset.edges.find((e) => e.from === fromId && e.to === toId)
  const outEdges = dataset.edges
    .filter((e) => e.from === node.id)
    .map((e) => ({ edge: e, target: dataset.nodes.find((n) => n.id === e.to) }))
    .filter((e) => e.target)

  return (
    <article className="detail-card">
      <header className="detail-card__header">
        <div className="detail-card__top">
          <span className="detail-card__eyebrow">Capa {String(layer.id).padStart(2, '0')}</span>
          <span className={`detail-card__badge detail-card__badge--${reach}`}>{REACH_LABEL[reach]}</span>
        </div>

        <h2 className="detail-card__title">{node.name}</h2>
        {node.composition && <p className="detail-card__where">{node.composition}</p>}

        <div className="detail-card__tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'resultado'}
            className={`detail-card__tab${tab === 'resultado' ? ' detail-card__tab--active' : ''}`}
            onClick={() => setTab('resultado')}
          >
            Resultado
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === 'lecturas'}
            className={`detail-card__tab${tab === 'lecturas' ? ' detail-card__tab--active' : ''}`}
            onClick={() => setTab('lecturas')}
          >
            Lecturas{refCount > 0 ? ` (${refCount})` : ''}
          </button>
        </div>
      </header>

      {tab === 'resultado' ? (
        <div className="detail-card__body">
          {node.description && <p className="detail-card__lead">{node.description}</p>}

          <section>
            <h3 className="detail-card__h3">Cómo llegó la carencia hasta aquí</h3>
            {chainNodes.length > 0 ? (
              <p className="detail-card__chain">
                {chainNodes.map((n, i) => {
                  const prev = chainNodes[i - 1]
                  const rel = prev ? edgeBetween(prev.id, n.id) : null
                  const relInfo = rel ? relationLabel(rel.relationship) : null
                  return (
                    <span key={n.id}>
                      {relInfo && (
                        <span className={`detail-card__chain-rel detail-card__chain-rel--${relInfo.sign}`}>
                          {' '}
                          {relInfo.verb}
                          {rel.strength != null ? ` (${Math.round(rel.strength * 100)}%)` : ''}
                          {' → '}
                        </span>
                      )}
                      {n.id === node.id ? <strong>{n.name}</strong> : n.name}
                    </span>
                  )
                })}
              </p>
            ) : (
              <p className="detail-card__chain">No alcanzado desde el origen en este escenario.</p>
            )}
          </section>

          {outEdges.length > 0 && (
            <section>
              <h3 className="detail-card__h3">Afecta a</h3>
              <ul className="detail-card__edges">
                {outEdges.map(({ edge, target }) => {
                  const relInfo = relationLabel(edge.relationship)
                  return (
                    <li key={`${edge.from}-${edge.to}`}>
                      <span className={`detail-card__edges-verb detail-card__edges-verb--${relInfo.sign}`}>
                        {relInfo.verb}
                      </span>
                      <span className="detail-card__edges-target">{target.name}</span>
                      {edge.strength != null && (
                        <span className="detail-card__edges-strength">{Math.round(edge.strength * 100)}%</span>
                      )}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          {signs.length > 0 && (
            <section>
              <h3 className="detail-card__h3">En esta carencia</h3>
              <ul className="detail-card__signs">
                {signs.map((sign) => (
                  <li key={sign}>{sign}</li>
                ))}
              </ul>
            </section>
          )}

          {(node.timeToAppear || node.keyFacts?.length > 0) && (
            <dl className="detail-card__grid">
              {node.timeToAppear && (
                <div className="detail-card__stat">
                  <dt>Tiempo hasta verse</dt>
                  <dd>{node.timeToAppear}</dd>
                </div>
              )}
              {node.keyFacts?.length > 0 && (
                <div className="detail-card__stat">
                  <dt>Piezas clave</dt>
                  <dd>
                    <ul className="chip-list">
                      {node.keyFacts.map((fact) => (
                        <li key={fact} className="chip chip--gold">
                          {fact}
                        </li>
                      ))}
                    </ul>
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      ) : (
        <div className="detail-card__body">
          {refCount > 0 ? (
            <ul className="detail-card__refs">
              {node.references.map((ref) => (
                <li key={ref.pmid ?? ref.url}>
                  <a href={ref.url ?? pubmedUrl(ref.pmid)} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink />
                    <span>{ref.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-card__empty">Sin fuentes verificadas para este nodo en este dataset todavía.</p>
          )}
        </div>
      )}
    </article>
  )
}
