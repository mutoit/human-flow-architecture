// Menú «Fuentes»: informe legible (pestaña / Markdown) y dossier completo
// (JSON reabrible). Ambos incluyen el registro de decisiones de método.

import { useEffect, useRef, useState } from 'react'
import { downloadDossier, downloadReport, openReport } from './exportDossier.js'
import { IconDownload, IconExternalLink } from '../icons.jsx'

export default function FuentesMenu({ dossier }) {
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false)
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const run = (action) => {
    action(dossier)
    setOpen(false)
  }

  return (
    <div className="fuentes-menu" ref={ref}>
      <button type="button" className="fuentes-menu__trigger" onClick={() => setOpen((v) => !v)} aria-expanded={open} disabled={!dossier}>
        Fuentes
      </button>
      {open && (
        <div className="fuentes-menu__panel" role="menu">
          <button type="button" role="menuitem" onClick={() => run(openReport)}>
            <IconExternalLink />
            Ver informe de fuentes y decisiones
          </button>
          <button type="button" role="menuitem" onClick={() => run(downloadReport)}>
            <IconDownload />
            Descargar informe (.md)
          </button>
          <button type="button" role="menuitem" onClick={() => run(downloadDossier)}>
            <IconDownload />
            Descargar dossier (.json, reabrible)
          </button>
        </div>
      )}
    </div>
  )
}
