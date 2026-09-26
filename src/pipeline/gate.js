// Control mecánico de lo que propone el extractor (decisión D-control).
// Sin IA: cada regla es una comprobación literal y cada rechazo lleva su
// motivo. La capa la confirma el léxico versionado de la capa, no la IA.

import { LAYERS, SCHEMA, layerOf, slotsFor } from '../method/method.js'
import { contentWords, norm, numbersIn } from './text.js'

const MIN_QUOTE = 20

// Un alias es un comienzo de palabra ("hepat" → hepatic); los de menos de
// 4 letras deben ser palabra completa ("ear" no casa con "clearance").
const aliasRe = new Map()
const aliasIn = (alias, text) => {
  if (!aliasRe.has(alias)) {
    const esc = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    aliasRe.set(alias, new RegExp(`(^|[^\\p{L}\\p{N}])${esc}${alias.length < 4 ? '(?![\\p{L}\\p{N}])' : ''}`, 'u'))
  }
  return aliasRe.get(alias).test(text)
}

/** P: capa propuesta, textos donde buscar. Q: { layer, layerSource }. */
export function resolveLayer(proposed, target, quote) {
  const haystack = norm(`${target} ${quote}`)
  const own = layerOf(proposed)
  if (own && own.aliases.some((a) => aliasIn(a, haystack))) return { layer: own.id, layerSource: 'ia_confirmada_por_lexico' }

  // Sin confirmación: la capa cuyo alias más largo aparece en la diana.
  const t = norm(target)
  let best = null
  for (const layer of LAYERS) {
    for (const alias of layer.aliases) {
      if (aliasIn(alias, t) && (!best || alias.length > best.alias.length)) best = { id: layer.id, alias }
    }
  }
  return best ? { layer: best.id, layerSource: 'lexico' } : { layer: null, layerSource: 'sin_capa' }
}

function checkCommon(row, ctx, reasons) {
  const paper = ctx.papers.get(String(row.paperId))
  if (!paper) {
    reasons.push('paper fuera del lote')
    return
  }
  const quote = norm(row.quote)
  if (quote.length < MIN_QUOTE) reasons.push('frase ausente o demasiado corta')
  else if (!norm(ctx.textOf(paper)).includes(quote)) reasons.push('la frase no está literalmente en el texto del paper')
}

function checkTargetInQuote(target, quote, label, reasons) {
  const words = contentWords(target)
  if (words.length === 0) {
    reasons.push(`${label} vacía`)
    return
  }
  const q = norm(quote)
  const missing = words.filter((w) => !q.includes(w))
  if (missing.length) reasons.push(`${label} no aparece en la frase (${missing.join(', ')})`)
}

const inEnum = (value, enumObjOrArr) => (Array.isArray(enumObjOrArr) ? enumObjOrArr : Object.keys(enumObjOrArr)).includes(value)

function gateEffect(row, ctx) {
  const reasons = []
  checkCommon(row, ctx, reasons)
  checkTargetInQuote(row.target, row.quote, 'diana', reasons)
  if (!inEnum(row.role, SCHEMA.roles)) reasons.push(`rol no válido (${row.role})`)
  if (!inEnum(row.predicate, SCHEMA.predicates)) reasons.push(`dirección no válida (${row.predicate})`)
  if (!inEnum(row.level, SCHEMA.levels)) reasons.push(`nivel no válido (${row.level})`)
  if (!inEnum(row.evidence_kind, SCHEMA.evidenceKinds)) reasons.push(`tipo de evidencia no válido (${row.evidence_kind})`)
  return reasons
}

function gateMeasure(row, ctx) {
  const reasons = []
  checkCommon(row, ctx, reasons)
  checkTargetInQuote(row.target, row.quote, 'diana', reasons)
  if (!slotsFor(ctx.kind).includes(row.slot)) reasons.push(`hueco no permitido para «${ctx.kind}» (${row.slot})`)
  if (typeof row.value !== 'number' || !Number.isFinite(row.value)) reasons.push('valor no numérico')
  else if (!numbersIn(row.quote).includes(row.value)) reasons.push(`el número ${row.value} no está en la frase`)
  if (row.unit && !norm(row.quote).includes(norm(row.unit))) reasons.push(`la unidad «${row.unit}» no está en la frase`)
  if (row.slot === 'effect_size' && !SCHEMA.effectSizeMetrics.includes(row.metric)) reasons.push(`métrica no válida (${row.metric})`)
  return reasons
}

function gateLink(row, ctx) {
  const reasons = []
  checkCommon(row, ctx, reasons)
  checkTargetInQuote(row.from_target, row.quote, 'origen del eslabón', reasons)
  checkTargetInQuote(row.to_target, row.quote, 'destino del eslabón', reasons)
  if (!inEnum(row.predicate, SCHEMA.linkPredicates)) reasons.push(`verbo no válido (${row.predicate})`)
  return reasons
}

/**
 * P: filas crudas del extractor { effects, measures, links }, ctx { papers: Map pmid→paper, textOf, kind }.
 * Q: { effects, measures, links, rejected[] } — aceptadas con capa resuelta;
 *    rechazadas con su tipo, la fila original y los motivos.
 */
export function gateRows(raw, ctx) {
  const out = { effects: [], measures: [], links: [], rejected: [] }
  const take = (type, rows, check, finish) => {
    for (const row of rows ?? []) {
      const reasons = check(row, ctx)
      if (reasons.length) out.rejected.push({ type, row, reasons })
      else out[type].push(finish(row))
    }
  }
  take('effects', raw.effects, gateEffect, (r) => ({ ...r, paperId: String(r.paperId), ...resolveLayer(r.layer, r.target, r.quote) }))
  take('measures', raw.measures, gateMeasure, (r) => ({ ...r, paperId: String(r.paperId), ...resolveLayer(r.layer, r.target, r.quote) }))
  take('links', raw.links, gateLink, (r) => {
    const from = resolveLayer(r.from_layer, r.from_target, '')
    const to = resolveLayer(r.to_layer, r.to_target, '')
    return { ...r, paperId: String(r.paperId), from_layer: from.layer, to_layer: to.layer }
  })
  return out
}
