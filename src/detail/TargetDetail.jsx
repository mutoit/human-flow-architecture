// Ficha de una diana: cada frase validada que habla de ella, sus cifras y
// los recorridos citados que pasan por ella.

import { layerOf } from '../method/method.js'
import { CLAIM_LABEL, DIRECTION_LABEL, LINK_LABEL, ROLE_LABEL, signOf } from '../engine/stateMeta.js'
import { TOPIC_KEY } from '../pipeline/chain.js'
import { DirectionChips, MeasureLine } from './LayerDetail.jsx'
import { RowEvidence } from './Evidence.jsx'

const EVIDENCE_KIND_LABEL = { medido: 'dato propio', afirmado_revision: 'afirmado en revisión' }

export function ChainText({ chain, topic, activeKey }) {
  return (
    <p className="chain">
      {chain.hops.map((h, i) => (
        <span key={i}>
          {i === 0 ? (
            h.from === TOPIC_KEY ? <strong>{topic}</strong> : <span className={h.from === activeKey ? 'chain__here' : ''}>{h.fromName}</span>
          ) : null}
          <span className={`chain__verb chain__verb--${signOf(h.verb)}`} title={`«${h.row.quote}» — PMID ${h.row.paperId}`}>
            {' '}
            {(h.kind === 'efecto' ? DIRECTION_LABEL : LINK_LABEL)[h.verb]} →{' '}
          </span>
          <span className={h.to === activeKey ? 'chain__here' : ''}>
            {h.toName}
            {h.toLayer ? <span className="chain__layer"> ({layerOf(h.toLayer)?.name})</span> : null}
          </span>
        </span>
      ))}
    </p>
  )
}

export default function TargetDetail({ target, dossier, chains }) {
  if (!target) return <p className="detail-card__empty">Pincha una diana (en la ficha de capa, en Capas o en el Grafo) para ver cada frase que la respalda.</p>
  const paper = (id) => dossier.papers[id]
  const through = chains.filter((c) => c.hops.some((h) => h.from === target.key || h.to === target.key))

  return (
    <article className="detail-card">
      <header className="detail-card__header">
        <div className="detail-card__top">
          <span className="detail-card__eyebrow">Diana</span>
          {target.layers.map((id) => (
            <span key={id} className="detail-card__badge detail-card__badge--on">
              {layerOf(id)?.name}
            </span>
          ))}
          {target.layers.length === 0 ? <span className="detail-card__badge">sin capa</span> : null}
        </div>
        <h2 className="detail-card__title">{target.name}</h2>
        <DirectionChips directions={target.directions} />
      </header>

      <div className="detail-card__body">
        {through.length ? (
          <section>
            <h3 className="detail-card__h3">Recorridos citados que pasan por aquí</h3>
            {through.map((c, i) => (
              <div key={i} className="chain-card">
                <ChainText chain={c} topic={dossier.queryUsed} activeKey={target.key} />
                <p className="chain-card__meta">
                  {c.papers.length} paper{c.papers.length > 1 ? 's' : ''}
                  {c.assembled ? ' · ensamblada entre papers (cada salto con su frase)' : ''}
                </p>
              </div>
            ))}
          </section>
        ) : null}

        {target.effects.length ? (
          <section>
            <h3 className="detail-card__h3">Frases que lo respaldan</h3>
            <ul className="evidence-list">
              {target.effects.map((e, i) => (
                <RowEvidence
                  key={i}
                  row={e}
                  paper={paper(e.paperId)}
                  marks={[
                    [e.exposure, 'exposure'],
                    [e.target, 'target'],
                    [e.comparator, 'comparator'],
                  ]}
                >
                  <span className={`tag tag--${signOf(e.direction)}`}>{DIRECTION_LABEL[e.direction]}</span>
                  <span className="tag" title={e.claimForced ? 'La frase habla de asociación: se marca así aunque la IA dijera efecto.' : ''}>
                    {CLAIM_LABEL[e.claim]}
                  </span>
                  <span className="tag">{ROLE_LABEL[e.role]}</span>
                  <span className="tag">{EVIDENCE_KIND_LABEL[e.evidenceKind]}</span>
                  <span className="tag" title="Una segunda lectura independiente llegó a la misma dirección.">2 lecturas coinciden</span>
                </RowEvidence>
              ))}
            </ul>
          </section>
        ) : null}

        {target.measures.length ? (
          <section>
            <h3 className="detail-card__h3">Cifras</h3>
            {target.measureSummary.map((s) => (
              <MeasureLine key={`${s.slot}|${s.metric}|${s.unit}`} s={s} />
            ))}
            <ul className="evidence-list">
              {target.measures.map((m, i) => (
                <RowEvidence key={i} row={m} paper={paper(m.paperId)} marks={[[m.target, 'target'], [m.group, 'comparator']]}>
                  <span className="tag">{m.slot}</span>
                  <span className="tag tag--value">
                    {m.value}
                    {m.unit ? ` ${m.unit}` : ''}
                  </span>
                  {m.metric ? <span className="tag">{m.metric}</span> : null}
                  {m.group ? <span className="tag">grupo: {m.group}</span> : null}
                  {m.unitInherited ? <span className="tag" title="La unidad aparece una vez para varios valores de la frase.">unidad compartida</span> : null}
                </RowEvidence>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  )
}
