// Buscador: lanza el recorrido completo (pipeline/run.js) y muestra en qué
// etapa está. No lista papers sueltos: el resultado es el dossier.

import { useState } from 'react'

export default function TopicSearch({ busy, progress, onSearch }) {
  const [q, setQ] = useState('')

  function onSubmit(e) {
    e.preventDefault()
    const topic = q.trim()
    if (topic && !busy) onSearch(topic)
  }

  return (
    <section className="topic-search" aria-label="Buscar tema">
      <form className="topic-search__form" onSubmit={onSubmit} role="search">
        <input
          className="topic-search__input"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Enfermedad, hormona, vitamina, síntoma…"
          aria-label="Tema a buscar"
          autoComplete="off"
          spellCheck="false"
        />
        <button type="submit" className="topic-search__go" disabled={busy || !q.trim()}>
          {busy ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {progress ? (
        <p className="topic-search__status" role="status" aria-live="polite">
          {progress.message}
        </p>
      ) : null}
    </section>
  )
}
