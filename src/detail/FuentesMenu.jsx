// Menú "Fuentes" (Rev8) — sustituye al toggle+panel inline anterior.
// 3 acciones, todas client-side, sin backend: ver todas las lecturas en
// una pestaña nueva, descargar un listado legible, descargar el dataset
// JSON completo (para auditar/reimportar). Nunca genera citas — solo
// reformatea lo que `collectReferences` ya recolecta del dataset real.

import { useEffect, useRef, useState } from 'react'
import { collectReferences, pubmedUrl } from '../engine/citations.js'
import { IconDownload, IconExternalLink } from '../icons.jsx'

function refUrl(ref) {
  return ref.url ?? pubmedUrl(ref.pmid)
}

function triggerDownload(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function slug(dataset) {
  return dataset.config?.name?.toLowerCase().replace(/\s+/g, '-') ?? 'dataset'
}

function openReadingsTab(dataset) {
  const groups = collectReferences(dataset)
  const body =
    groups.length === 0
      ? '<p class="empty">Este dataset no incluye fuentes verificadas todavía.</p>'
      : groups
          .map(
            (g) => `
        <section>
          <h2>${g.nodeName}</h2>
          <ul>
            ${g.references
              .map((ref) => {
                const extra = [ref.evidenceTier, ref.claimUsage].filter(Boolean).join(' · ')
                return `<li><a href="${refUrl(ref)}" target="_blank" rel="noopener noreferrer">${ref.title}</a>${extra ? `<p class="meta">${extra}</p>` : ''}</li>`
              })
              .join('')}
          </ul>
        </section>`
          )
          .join('')

  const html = `<!doctype html>
<html lang="es"><head><meta charset="UTF-8" />
<title>Fuentes — ${dataset.config?.name ?? 'dataset'}</title>
<style>
  body{margin:0;padding:2.5rem;background:#0c0c0b;color:#eceae4;font:15px/1.6 'Segoe UI',sans-serif;}
  h1{font-size:1.5rem;margin:0 0 1.5rem;}
  h2{font-size:1rem;color:#9a968c;margin:1.5rem 0 0.5rem;text-transform:uppercase;letter-spacing:0.08em;font-size:0.75rem;}
  ul{margin:0;padding:0;list-style:none;}
  li{margin:0.35rem 0;}
  a{color:#eceae4;text-decoration:none;}
  a:hover{color:#d4af37;}
  .meta{margin:0.15rem 0 0.6rem;color:#9a968c;font-size:0.8rem;}
  .empty{color:#6b6860;font-style:italic;}
</style></head>
<body><h1>Fuentes — ${dataset.config?.name ?? 'dataset'}</h1>${body}</body></html>`

  const blob = new Blob([html], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function downloadReadingsList(dataset) {
  const groups = collectReferences(dataset)
  const lines = [`# Fuentes — ${dataset.config?.name ?? 'dataset'}`, '']
  if (groups.length === 0) {
    lines.push('_Este dataset no incluye fuentes verificadas todavía._')
  } else {
    for (const g of groups) {
      lines.push(`## ${g.nodeName}`, '')
      for (const ref of g.references) {
        const extra = [ref.evidenceTier, ref.claimUsage].filter(Boolean).join(' — ')
        lines.push(`- [${ref.title}](${refUrl(ref)})${extra ? ` — ${extra}` : ''}`)
      }
      lines.push('')
    }
  }
  triggerDownload(`${slug(dataset)}-fuentes.md`, lines.join('\n'), 'text/markdown')
}

function downloadDataset(dataset) {
  triggerDownload(`${slug(dataset)}.json`, JSON.stringify(dataset, null, 2), 'application/json')
}

export default function FuentesMenu({ dataset }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  function run(action) {
    action(dataset)
    setOpen(false)
  }

  return (
    <div className="fuentes-menu" ref={ref}>
      <button type="button" className="fuentes-menu__trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
        Fuentes
      </button>
      {open && (
        <div className="fuentes-menu__panel" role="menu">
          <button type="button" role="menuitem" onClick={() => run(openReadingsTab)}>
            <IconExternalLink />
            Ver lecturas (pestaña nueva)
          </button>
          <button type="button" role="menuitem" onClick={() => run(downloadReadingsList)}>
            <IconDownload />
            Descargar listado
          </button>
          <button type="button" role="menuitem" onClick={() => run(downloadDataset)}>
            <IconDownload />
            Descargar dataset
          </button>
        </div>
      )}
    </div>
  )
}
