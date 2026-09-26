// Recorrido del tema por el cuerpo: cadenas de saltos citados
// (pipeline/chain.js). Sin cadena citada, lo dice; nunca la inventa.

import { ChainText } from '../detail/TargetDetail.jsx'

export default function PipelineView({ chains, dossier, onSelectTarget }) {
  const fromTopic = chains.filter((c) => c.fromTopic)
  const loose = chains.filter((c) => !c.fromTopic)

  if (chains.length === 0) {
    return (
      <p className="pipeline__empty">
        Ningún paper leído describe un efecto directo del tema ni un eslabón A → B. Las revisiones suelen contener estas
        cadenas: sin ellas el recorrido queda vacío en lugar de inventarse.
      </p>
    )
  }

  const block = (title, list) =>
    list.length ? (
      <section className="pipeline__group">
        <h3 className="pipeline__title">{title}</h3>
        <ol className="pipeline__list">
          {list.map((c, i) => (
            <li key={i} className="chain-card">
              <button type="button" className="chain-card__btn" onClick={() => onSelectTarget(c.hops[c.hops.length - 1].to)}>
                <ChainText chain={c} topic={dossier.queryUsed} />
              </button>
              <p className="chain-card__meta">
                {c.hops.length} salto{c.hops.length > 1 ? 's' : ''} · {c.papers.length} paper{c.papers.length > 1 ? 's' : ''}
                {c.assembled ? ' · ensamblada' : ''} · pasa el cursor por cada verbo para ver su frase
              </p>
            </li>
          ))}
        </ol>
      </section>
    ) : null

  return (
    <div className="pipeline">
      {block('Desde el tema', fromTopic)}
      {block('Cadenas citadas que no enlazan con el tema', loose)}
    </div>
  )
}
