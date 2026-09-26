// El dossier es el ÚNICO dato que ve la app (decisión D-reproducible).
// Guarda lo crudo: papers, respuestas del extractor y de la segunda
// lectura. Las filas se DERIVAN siempre con el control actual
// (deriveRows): un archivo editado a mano no puede colar filas.

import { METHOD_VERSION } from '../method/method.js'
import { applyVerification, buildContext, gateRows } from './gate.js'

export const DOSSIER_FORMAT = 'humanflow-dossier'
export const DOSSIER_VERSION = 2

export function emptyDossier({ input, runId = null }) {
  return {
    format: DOSSIER_FORMAT,
    formatVersion: DOSSIER_VERSION,
    runId,
    createdAt: new Date().toISOString(),
    input,
    queryUsed: null,
    normalizedBy: null,
    kind: null,
    method: { ...METHOD_VERSION, extractor: null },
    map: { total: null, pubmedTotal: null, translation: null, layers: {} },
    papers: {},
    extraction: { batches: [] },
    rows: { effects: [], measures: [], links: [] },
    rejected: [],
    errors: [],
  }
}

/** Recalcula filas aceptadas / en revisión / rechazadas desde lo crudo. */
export function deriveRows(dossier) {
  const ctx = buildContext({ papers: new Map(Object.entries(dossier.papers)), kind: dossier.kind, topic: dossier.queryUsed })
  const rows = { effects: [], measures: [], links: [] }
  const rejected = []
  for (const batch of dossier.extraction.batches) {
    if (!batch.raw) continue
    const gated = applyVerification(gateRows(batch.raw, ctx), batch.verify)
    rows.effects.push(...gated.effects)
    rows.measures.push(...gated.measures)
    rows.links.push(...gated.links)
    rejected.push(...gated.rejected.map((r) => ({ ...r, layer: batch.layer })))
  }
  return { ...dossier, rows, rejected }
}

/** P: JSON parseado. Q: { dossier, warnings } o lanza con el motivo. */
export function importDossier(data) {
  if (!data || data.format !== DOSSIER_FORMAT) throw new Error('No es un dossier de Human Flow.')
  if (data.formatVersion !== DOSSIER_VERSION) throw new Error(`Versión de dossier no soportada (${data.formatVersion}).`)
  for (const key of ['input', 'map', 'papers', 'extraction', 'method']) {
    if (data[key] == null) throw new Error(`Falta «${key}» en el dossier.`)
  }
  const warnings = []
  for (const k of ['layers', 'schema', 'decisions']) {
    if (data.method[k] !== METHOD_VERSION[k]) warnings.push(`El dossier usó ${k} v${data.method[k]}; la app usa v${METHOD_VERSION[k]}: las filas se recalculan con la versión actual.`)
  }
  return { dossier: deriveRows(data), warnings }
}
