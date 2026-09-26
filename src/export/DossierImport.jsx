// Reabrir un dossier exportado. Se vuelve a pasar el control mecánico
// (pipeline/dossier.js#importDossier); los avisos se muestran un momento.

import { useEffect, useRef, useState } from 'react'
import { importDossier } from '../pipeline/dossier.js'

export default function DossierImport({ onImport }) {
  const inputRef = useRef(null)
  const [toast, setToast] = useState(null)

  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 7000)
    return () => clearTimeout(t)
  }, [toast])

  async function onFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const { dossier, warnings } = importDossier(JSON.parse(await file.text()))
      onImport(dossier)
      setToast(warnings.length ? { kind: 'warning', text: warnings.join(' ') } : null)
    } catch (err) {
      setToast({ kind: 'error', text: err.message || 'No se pudo abrir el archivo.' })
    }
  }

  return (
    <div className="import-control">
      <button type="button" className="import-control__button" onClick={() => inputRef.current?.click()}>
        Abrir dossier
      </button>
      <input ref={inputRef} type="file" accept="application/json,.json" hidden onChange={onFile} />
      {toast ? (
        <p className={`import-toast import-toast--${toast.kind}`} role="alert">
          {toast.text}
        </p>
      ) : null}
    </div>
  )
}
