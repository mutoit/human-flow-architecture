import { useEffect, useRef, useState } from 'react'
import { searchLiterature, enrichPapersOa } from '../engine/literatureSearch.js'
import { IconExternalLink } from '../icons.jsx'

const EXAMPLES = ['vitamina D', 'cortisol', 'insomnio', 'TSH', 'fatiga crónica']

function PaperCard({ paper }) {
  const [open, setOpen] = useState(false)
  const types = paper.pubTypes.slice(0, 3).join(' · ')

  return (
    <article className="paper-card">
      <header className="paper-card__head">
        <h3 className="paper-card__title">{paper.title}</h3>
        <p className="paper-card__meta">
          {[paper.year, paper.journal, paper.authors].filter(Boolean).join(' · ')}
        </p>
        <p className="paper-card__tags">
          {paper.pmid ? <span>PMID {paper.pmid}</span> : null}
          {types ? <span>{types}</span> : null}
          {paper.isOpenAccess ? <span>acceso abierto</span> : null}
        </p>
      </header>

      {paper.abstract ? (
        <div className="paper-card__abs">
          <p className={open ? '' : 'paper-card__abs-clip'}>{paper.abstract}</p>
          {paper.abstract.length > 420 ? (
            <button type="button" className="paper-card__more" onClick={() => setOpen((v) => !v)}>
              {open ? 'Cerrar abstract' : 'Leer abstract'}
            </button>
          ) : null}
        </div>
      ) : (
        <p className="paper-card__empty">Este registro no trae abstract. Ábrelo en PubMed.</p>
      )}

      <p className="paper-card__links">
        {paper.pubmed ? (
          <a href={paper.pubmed} target="_blank" rel="noopener noreferrer">
            PubMed <IconExternalLink />
          </a>
        ) : null}
        {paper.pmc ? (
          <a href={paper.pmc} target="_blank" rel="noopener noreferrer">
            PMC <IconExternalLink />
          </a>
        ) : null}
        {paper.doiHref ? (
          <a href={paper.doiHref} target="_blank" rel="noopener noreferrer">
            DOI <IconExternalLink />
          </a>
        ) : null}
        {paper.oaUrl ? (
          <a href={paper.oaUrl} target="_blank" rel="noopener noreferrer">
            PDF abierto <IconExternalLink />
          </a>
        ) : null}
      </p>
    </article>
  )
}

export default function TopicSearch() {
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)
  const [showResults, setShowResults] = useState(false)
  const rootRef = useRef(null)

  // Escape o clic fuera cierran el popover de resultados (no borra la búsqueda).
  useEffect(() => {
    if (!showResults) return undefined
    function onKey(e) {
      if (e.key === 'Escape') setShowResults(false)
    }
    function onDown(e) {
      if (rootRef.current && !rootRef.current.contains(e.target)) setShowResults(false)
    }
    document.addEventListener('keydown', onKey)
    document.addEventListener('mousedown', onDown)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('mousedown', onDown)
    }
  }, [showResults])

  async function run(query) {
    const topic = (query ?? q).trim()
    if (!topic) return
    setQ(topic)
    setBusy(true)
    setError(null)
    setShowResults(true)
    try {
      const found = await searchLiterature(topic)
      const { papers, throttled } = await enrichPapersOa(found.papers)
      setResult({ ...found, papers, throttled })
    } catch (err) {
      setError(err.message || 'No se pudo buscar.')
      setResult(null)
    } finally {
      setBusy(false)
    }
  }

  function onSubmit(e) {
    e.preventDefault()
    run()
  }

  const hasPanel = showResults && (busy || error || result)

  return (
    <section className="topic-search" aria-label="Buscar literatura" ref={rootRef}>
      <form className="topic-search__form" onSubmit={onSubmit} role="search">
        <input
          id="topic-q"
          className="topic-search__input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar papers: enfermedad, hormona, síntoma…"
          aria-label="Buscar papers en PubMed"
          aria-describedby="topic-tip"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="topic-search__go" disabled={busy || !q.trim()} title="Buscar (Enter)">
          {busy ? 'Buscando…' : 'Buscar'}
        </button>

        <div id="topic-tip" role="tooltip" className="topic-search__tip">
          <strong>Busca literatura científica</strong>
          <span>
            Escribe un tema y pulsa Enter. Consulta PubMed (con OpenAlex de respaldo) y lista lo que se publicó; no
            calcula dosis ni riesgo. Esc cierra los resultados.
          </span>
          <span className="topic-search__examples">
            {EXAMPLES.map((ex) => (
              <button key={ex} type="button" className="topic-search__ex" onClick={() => run(ex)} disabled={busy}>
                {ex}
              </button>
            ))}
          </span>
        </div>
      </form>

      {hasPanel ? (
        <div className="topic-search__pop">
          <div className="topic-search__pop-head">
            <p className="topic-search__count">
              {busy
                ? 'Buscando…'
                : result
                  ? `«${result.query}» — ${result.papers.length} de ${result.hitCount.toLocaleString('es')} registros · ${result.source}`
                  : ''}
            </p>
            <button type="button" className="topic-search__close" onClick={() => setShowResults(false)} title="Cerrar resultados (Esc)">
              Cerrar
            </button>
          </div>
          {error ? <p className="topic-search__error">{error}</p> : null}
          {result?.failures?.length ? (
            <p className="topic-search__notice">
              {result.failures.map((f) => f.source).join(' y ')} no respondió; resultados de {result.source}.
            </p>
          ) : null}
          {result?.throttled ? (
            <p className="topic-search__notice">
              OpenAlex limitó las peticiones: algunos enlaces de PDF abierto no se han podido comprobar. Reintenta en unos
              segundos.
            </p>
          ) : null}
          {result ? (
            <div className="topic-search__results">
              {result.papers.length === 0 ? (
                <p className="topic-search__empty">Ningún paper con PMID/PMC/DOI para ese tema.</p>
              ) : (
                result.papers.map((p) => <PaperCard key={p.pmid || p.pmcid || p.doi} paper={p} />)
              )}
            </div>
          ) : null}
        </div>
      ) : null}
    </section>
  )
}
