// Ficha compartida — findings en paralelo por escenario (spec cascada §1).
// Tabs: Resultado / Lecturas. Cada instancia es independiente.

import { useState } from 'react'
import { pubmedUrl, evidenceTierRank } from '../engine/citations.js'
import { IconExternalLink } from '../icons.jsx'
import { labelOfReach } from '../engine/reachMeta.js'

const RELATION_LABEL = {
  increases: { verb: 'aumenta', sign: 'pos' },
  activates: { verb: 'activa', sign: 'pos' },
  decreases: { verb: 'reduce', sign: 'neg' },
  inhibits: { verb: 'inhibe', sign: 'neg' },
}

const FINDING_STATE_LABEL = {
  normal: 'Normal',
  alert: 'Alerta',
  critical: 'Crítico',
}

function relationLabel(relationship) {
  return RELATION_LABEL[relationship] ?? { verb: 'afecta', sign: 'neutral' }
}

/** strength 0–1 o etiqueta → etiqueta cualitativa (spec §1.2). */
export function strengthLabel(strength) {
  if (strength === 'fuerte' || strength === 'moderada' || strength === 'débil') return strength
  const n = Number(strength)
  if (!Number.isFinite(n)) return null
  if (n >= 0.8) return 'fuerte'
  if (n >= 0.4) return 'moderada'
  return 'débil'
}

function citationHref(citation) {
  if (!citation) return null
  return citation.url ?? (citation.pmid ? pubmedUrl(citation.pmid) : null)
}

function sortFindings(findings) {
  return [...findings].sort((a, b) => evidenceTierRank(a.citation?.evidenceTier) - evidenceTierRank(b.citation?.evidenceTier))
}

function nodeReadings(node) {
  const seen = new Set()
  const list = []
  for (const findings of Object.values(node.findings ?? {})) {
    if (!Array.isArray(findings)) continue
    for (const finding of findings) {
      const citation = finding.citation
      const key = citation?.pmid ?? citation?.url
      if (!key || seen.has(key)) continue
      seen.add(key)
      list.push({ ...citation, claimUsage: finding.claimUsage })
    }
  }
  return list
}

export default function DetailCard({ dataset, layer, node, nodeState, reach, chain, scenarioId, emptyHint }) {
  const [tab, setTab] = useState('resultado')

  if (!node || !layer) {
    return <p className="detail-card__empty">{emptyHint ?? 'Selecciona una capa o un nodo para ver su ficha.'}</p>
  }

  const findings = sortFindings(nodeState?.findings ?? node.findings?.[scenarioId] ?? [])
  const readings = nodeReadings(node)
  const chainNodes = chain.map((id) => dataset.nodes.find((n) => n.id === id)).filter(Boolean)

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
          <span className={`detail-card__badge detail-card__badge--${reach}`}>{labelOfReach(reach)}</span>
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
            Lecturas{readings.length > 0 ? ` (${readings.length})` : ''}
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
                  const strength = rel ? strengthLabel(rel.strength) : null
                  return (
                    <span key={n.id}>
                      {relInfo && (
                        <span className={`detail-card__chain-rel detail-card__chain-rel--${relInfo.sign}`}>
                          {' '}
                          {relInfo.verb}
                          {strength ? ` (${strength})` : ''}
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
                  const strength = strengthLabel(edge.strength)
                  return (
                    <li key={`${edge.from}-${edge.to}`}>
                      <span className={`detail-card__edges-verb detail-card__edges-verb--${relInfo.sign}`}>
                        {relInfo.verb}
                      </span>
                      <span className="detail-card__edges-target">{target.name}</span>
                      {strength && <span className="detail-card__edges-strength">{strength}</span>}
                    </li>
                  )
                })}
              </ul>
            </section>
          )}

          <section>
            <h3 className="detail-card__h3">Hallazgos de este escenario</h3>
            {findings.length > 0 ? (
              <ul className="detail-card__findings">
                {findings.map((finding, i) => {
                  const href = citationHref(finding.citation)
                  const superseded = finding.citation?.supersededBy
                  return (
                    <li
                      key={finding.citation?.pmid ?? finding.citation?.url ?? i}
                      className={`detail-card__finding${superseded ? ' detail-card__finding--superseded' : ''}`}
                    >
                      <div className="detail-card__finding-top">
                        <span className={`detail-card__finding-state detail-card__finding-state--${finding.state}`}>
                          {FINDING_STATE_LABEL[finding.state] ?? finding.state}
                        </span>
                        {finding.citation?.evidenceTier && (
                          <span className="detail-card__finding-tier">{finding.citation.evidenceTier}</span>
                        )}
                      </div>
                      <p className="detail-card__finding-summary">{finding.summary}</p>
                      {finding.claimUsage && <p className="detail-card__finding-usage">{finding.claimUsage}</p>}
                      {finding.citation && (
                        href ? (
                          <a className="detail-card__finding-cite" href={href} target="_blank" rel="noopener noreferrer">
                            <IconExternalLink />
                            <span>{finding.citation.title ?? href}</span>
                          </a>
                        ) : (
                          <p className="detail-card__finding-cite">{finding.citation.title}</p>
                        )
                      )}
                      {finding.verified === false && (
                        <p className="detail-card__finding-warn">Cita no verificada automáticamente — revisar manualmente.</p>
                      )}
                      {superseded && (
                        <p className="detail-card__finding-warn">Reemplazada por estudio más reciente ({superseded}).</p>
                      )}
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p className="detail-card__empty">Sin hallazgo autorado para este escenario — el nodo no se activa.</p>
            )}
          </section>

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
          {readings.length > 0 ? (
            <ul className="detail-card__refs">
              {readings.map((ref) => (
                <li key={ref.pmid ?? ref.url}>
                  <a href={ref.url ?? pubmedUrl(ref.pmid)} target="_blank" rel="noopener noreferrer">
                    <IconExternalLink />
                    <span>{ref.title}</span>
                  </a>
                  {ref.claimUsage && <p className="detail-card__finding-usage">{ref.claimUsage}</p>}
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
