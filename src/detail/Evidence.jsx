// Piezas comunes para enseñar evidencia: la frase exacta con su paper
// (diseño y especie de PubMed) y la ficha de un paper leído.

import { useState } from 'react'
import { IconExternalLink } from '../icons.jsx'
import { DESIGN_LABEL, SPECIES_LABEL } from '../engine/stateMeta.js'

export const paperMeta = (p) =>
  [DESIGN_LABEL[p.design] ?? p.design, p.species.map((s) => SPECIES_LABEL[s] ?? s).join(' + '), p.year].filter(Boolean).join(' · ')

function PaperLinks({ paper }) {
  const links = [
    ['PubMed', paper.links.pubmed],
    ['PMC', paper.links.pmc],
    ['DOI', paper.links.doi],
    ['PDF abierto', paper.links.oa],
  ].filter(([, href]) => href)
  return (
    <p className="paper-card__links">
      {links.map(([label, href]) => (
        <a key={label} href={href} target="_blank" rel="noopener noreferrer">
          {label} <IconExternalLink />
        </a>
      ))}
    </p>
  )
}

/** Una fila validada: frase literal + de qué paper sale. */
export function RowEvidence({ row, paper, children }) {
  return (
    <li className="evidence">
      {children ? <div className="evidence__top">{children}</div> : null}
      <blockquote className="evidence__quote">«{row.quote}»</blockquote>
      {paper ? (
        <p className="evidence__cite">
          <a href={paper.links.pubmed ?? paper.links.doi} target="_blank" rel="noopener noreferrer">
            <IconExternalLink />
            <span>{paper.title}</span>
          </a>
          <span className="evidence__meta">{paperMeta(paper)}</span>
        </p>
      ) : null}
    </li>
  )
}

export function PaperCard({ paper, note }) {
  const [open, setOpen] = useState(false)
  return (
    <article className="paper-card">
      <header>
        <h4 className="paper-card__title">{paper.title}</h4>
        <p className="paper-card__meta">{[paper.journal, paper.authors].filter(Boolean).join(' · ')}</p>
        <p className="paper-card__tags">
          <span>{paperMeta(paper)}</span>
          {paper.pmid ? <span>PMID {paper.pmid}</span> : null}
          {note ? <span>{note}</span> : null}
        </p>
      </header>
      {paper.abstract ? (
        <div className="paper-card__abs">
          <p className={open ? '' : 'paper-card__abs-clip'}>{paper.abstract}</p>
          <button type="button" className="paper-card__more" onClick={() => setOpen((v) => !v)}>
            {open ? 'Cerrar abstract' : 'Leer abstract'}
          </button>
        </div>
      ) : (
        <p className="paper-card__empty">PubMed no trae abstract de este registro: no se ha podido leer.</p>
      )}
      <PaperLinks paper={paper} />
    </article>
  )
}
