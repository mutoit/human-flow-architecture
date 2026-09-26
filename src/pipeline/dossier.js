// El dossier es el ÚNICO dato que ve la app: se crea con cada búsqueda,
// se exporta y se puede reabrir (decisión D-reproducible). Al reabrirlo se
// vuelve a pasar el control mecánico: un dossier editado a mano no cuela
// filas que no estén en el texto guardado.

import { METHOD_VERSION } from '../method/method.js'
import { paperText } from '../engine/paper.js'
import { gateRows } from './gate.js'

export const DOSSIER_FORMAT = 'humanflow-dossier'
export const DOSSIER_VERSION = 1

export function emptyDossier({ input }) {
  return {
    format: DOSSIER_FORMAT,
    formatVersion: DOSSIER_VERSION,
    createdAt: new Date().toISOString(),
    input,
    queryUsed: null,
    normalizedBy: null,
    kind: null,
    method: { ...METHOD_VERSION, extractor: null },
    map: { total: null, pubmedTotal: null, translation: null, layers: {} },
    papers: {},
    rows: { effects: [], measures: [], links: [] },
    rejected: [],
    extraction: { batches: [] },
    errors: [],
  }
}

export const gateContext = (dossier) => ({
  papers: new Map(Object.entries(dossier.papers)),
  textOf: paperText,
  kind: dossier.kind,
})

/** P: JSON parseado. Q: { dossier, warnings } o lanza con el motivo. */
export function importDossier(data) {
  if (!data || data.format !== DOSSIER_FORMAT) throw new Error('No es un dossier de Human Flow.')
  if (data.formatVersion !== DOSSIER_VERSION) throw new Error(`Versión de dossier no soportada (${data.formatVersion}).`)
  for (const key of ['input', 'map', 'papers', 'rows', 'method']) {
    if (data[key] == null) throw new Error(`Falta «${key}» en el dossier.`)
  }
  const warnings = []
  const v = data.method
  for (const k of ['layers', 'schema', 'decisions']) {
    if (v[k] !== METHOD_VERSION[k]) warnings.push(`El dossier usó ${k} v${v[k]}; la app usa v${METHOD_VERSION[k]}.`)
  }
  const regated = gateRows(data.rows, gateContext(data))
  const dropped = regated.rejected.length
  if (dropped) warnings.push(`${dropped} fila(s) del archivo no superan el control y se han apartado.`)
  const { rejected, ...rows } = regated
  return { dossier: { ...data, rows, rejected: [...(data.rejected ?? []), ...rejected] }, warnings }
}
