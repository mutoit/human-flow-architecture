// Lectura de un dossier: estado de cada capa, dianas con su conteo de
// dirección (D-direccion) y cifras agrupadas por hueco+métrica+unidad con
// mediana y rango (D-cifra). Cero cálculo clínico, cero conversión.

import { LAYERS, SCHEMA } from '../method/method.js'
import { decimalsOf, targetKey } from './text.js'

/** Estado de capa (D-estado-capa): efecto | literatura | sin_literatura | error | pendiente. */
export function layerState(dossier, layerId) {
  const entry = dossier.map?.layers?.[layerId]
  if (!entry) return 'pendiente'
  if (entry.error) return 'error'
  if (entry.count === 0) return 'sin_literatura'
  const rows = dossier.rows
  const has = rows.effects.some((r) => r.layer === layerId) || rows.measures.some((r) => r.layer === layerId)
  return has ? 'efecto' : 'literatura'
}

export function median(values) {
  const v = [...values].sort((a, b) => a - b)
  const mid = Math.floor(v.length / 2)
  return v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2
}

/** Cifras de un conjunto de filas agrupadas; nunca mezcla unidades ni métricas. */
export function summarizeMeasures(measures) {
  const groups = new Map()
  for (const m of measures) {
    const key = [m.slot, m.metric ?? '', m.unit ?? ''].join('|')
    if (!groups.has(key)) groups.set(key, { slot: m.slot, metric: m.metric ?? null, unit: m.unit ?? null, rows: [] })
    groups.get(key).rows.push(m)
  }
  return [...groups.values()].map((g) => {
    const values = g.rows.map((r) => r.value)
    const decimals = Math.max(...values.map(decimalsOf))
    return {
      ...g,
      n: values.length,
      papers: new Set(g.rows.map((r) => r.paperId)).size,
      median: Number(median(values).toFixed(decimals)),
      min: Math.min(...values),
      max: Math.max(...values),
    }
  })
}

const EMPTY_COUNTS = () => Object.fromEntries(Object.keys(SCHEMA.predicates).map((p) => [p, 0]))

/** Dianas del dossier (efectos + cifras), agrupadas por diana normalizada. */
export function targetsOf(dossier) {
  const byKey = new Map()
  const get = (row) => {
    const key = targetKey(row.target)
    if (!byKey.has(key)) byKey.set(key, { key, name: row.target, layers: new Set(), effects: [], measures: [] })
    const t = byKey.get(key)
    if (row.layer) t.layers.add(row.layer)
    return t
  }
  for (const e of dossier.rows.effects) get(e).effects.push(e)
  for (const m of dossier.rows.measures) get(m).measures.push(m)

  return [...byKey.values()].map((t) => {
    const directions = EMPTY_COUNTS()
    for (const e of t.effects) directions[e.predicate]++
    return {
      ...t,
      layers: [...t.layers],
      directions,
      contradictory: directions.aumenta > 0 && directions.disminuye > 0,
      papers: new Set([...t.effects, ...t.measures].map((r) => r.paperId)).size,
      measureSummary: summarizeMeasures(t.measures),
    }
  })
}

/** Resumen por capa para la lista lateral y la ficha de capa. */
export function layerSummaries(dossier) {
  const targets = targetsOf(dossier)
  return LAYERS.map((layer) => {
    const entry = dossier.map?.layers?.[layer.id] ?? null
    const papersRead = Object.values(dossier.papers ?? {}).filter((p) => p.retrievedFor?.includes(layer.id))
    const layerTargets = targets.filter((t) => t.layers.includes(layer.id))
    const talking = new Set(
      [...dossier.rows.effects, ...dossier.rows.measures].filter((r) => r.layer === layer.id).map((r) => r.paperId),
    )
    return {
      layer,
      state: layerState(dossier, layer.id),
      map: entry,
      papersRead,
      papersWithRows: talking.size,
      targets: layerTargets,
    }
  })
}
