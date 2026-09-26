// Ficha de una capa: cuánta literatura hay (etapa 1), qué dicen los papers
// leídos (etapa 2) y qué papers se leyeron. Todo sale del dossier.

import { LAYER_STATES, DIRECTION_LABEL, signOf, stateOf } from '../engine/stateMeta.js'
import { PaperCard } from './Evidence.jsx'

const pct = (x) => `${(x * 100).toLocaleString('es', { maximumFractionDigits: 1 })} %`
const ratio = (x) => x.toLocaleString('es', { maximumFractionDigits: 2 })

export function DirectionChips({ directions }) {
  return (
    <span className="directions">
      {Object.entries(directions)
        .filter(([, n]) => n > 0)
        .map(([pred, n]) => (
          <span key={pred} className={`directions__chip directions__chip--${signOf(pred)}`}>
            {n} {DIRECTION_LABEL[pred]}
          </span>
        ))}
    </span>
  )
}

export function MeasureLine({ s }) {
  const what = [s.slot, s.metric].filter(Boolean).join(' · ')
  const value =
    s.n === 1
      ? `${s.min}`
      : `mediana ${s.median} · ${s.min}–${s.max}`
  return (
    <span className="measure-line">
      <span className="measure-line__what">{what}</span>
      <span className="measure-line__value">
        {value}
        {s.unit ? ` ${s.unit}` : ''}
      </span>
      <span className="measure-line__n">
        {s.n} valor{s.n > 1 ? 'es' : ''} · {s.papers} paper{s.papers > 1 ? 's' : ''}
      </span>
    </span>
  )
}

export default function LayerDetail({ summary, index, onSelectTarget, activeTargetKey }) {
  if (!summary) return <p className="detail-card__empty">Selecciona una capa.</p>
  const { layer, state, map, papersRead, papersWithRows, targets } = summary
  const meta = LAYER_STATES[state]

  return (
    <article className="detail-card">
      <header className="detail-card__header">
        <div className="detail-card__top">
          <span className="detail-card__eyebrow">Capa {String(index + 1).padStart(2, '0')}</span>
          <span className={`detail-card__badge detail-card__badge--${stateOf(state)}`} title={meta.desc}>
            {meta.label}
          </span>
        </div>
        <h2 className="detail-card__title">{layer.name}</h2>
        <p className="detail-card__where">{meta.desc}</p>
      </header>

      <div className="detail-card__body">
        <section>
          <h3 className="detail-card__h3">Literatura en PubMed</h3>
          {!map ? (
            <p className="detail-card__empty">Sin consultar.</p>
          ) : map.error ? (
            <p className="detail-card__warn">La consulta falló: {map.error}</p>
          ) : (
            <dl className="stat-row">
              <div>
                <dt>Papers tema + capa</dt>
                <dd>{map.count.toLocaleString('es')}</dd>
              </div>
              <div title="Porcentaje de los papers del tema que están indexados con esta capa.">
                <dt>% del tema</dt>
                <dd>{pct(map.share)}</dd>
              </div>
              <div title="% del tema en esta capa dividido por el % que esta capa tiene en todo PubMed. >1 = más de lo esperado. Es bibliométrico, no clínico.">
                <dt>Observado / esperado</dt>
                <dd>{map.observedExpected != null ? ratio(map.observedExpected) : '—'}</dd>
              </div>
            </dl>
          )}
          {map?.query ? <code className="query">{map.query}</code> : null}
          {map?.notFound?.length ? (
            <p className="detail-card__warn">PubMed no reconoce: {map.notFound.join(', ')}. La cifra puede quedarse corta.</p>
          ) : null}
        </section>

        <section>
          <h3 className="detail-card__h3">Qué dicen los papers leídos</h3>
          {papersRead.length ? (
            <p className="detail-card__note">
              {papersWithRows} de {papersRead.length} papers leídos para esta capa tienen frases validadas aquí.
            </p>
          ) : null}
          {targets.length ? (
            <ul className="target-list">
              {targets.map((t) => (
                <li key={t.key}>
                  <button
                    type="button"
                    className={`target-list__btn${t.key === activeTargetKey ? ' target-list__btn--active' : ''}${t.contradictory ? ' target-list__btn--split' : ''}`}
                    onClick={() => onSelectTarget(t.key)}
                  >
                    <span className="target-list__name">{t.name}</span>
                    <DirectionChips directions={t.directions} />
                    {t.measureSummary.map((s) => (
                      <MeasureLine key={`${s.slot}|${s.metric}|${s.unit}`} s={s} />
                    ))}
                    <span className="target-list__papers">
                      {t.papers} paper{t.papers > 1 ? 's' : ''}
                      {t.contradictory ? ' · direcciones opuestas' : ''}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="detail-card__empty">
              {state === 'sin_literatura'
                ? 'No hay papers que leer en esta capa.'
                : 'Ninguna frase validada en esta capa. Silencio no es ausencia de efecto.'}
            </p>
          )}
        </section>

        {papersRead.length ? (
          <section>
            <h3 className="detail-card__h3">Papers leídos para esta capa</h3>
            <div className="paper-list">
              {papersRead.map((p) => (
                <PaperCard
                  key={p.pmid}
                  paper={p}
                  note={`${p.retrieval.bucket === 'revision' ? 'revisión' : 'primario'} · puesto ${p.retrieval.position} en PubMed`}
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </article>
  )
}
