// Recorrido completo de una búsqueda (docs/CORE.md, «Cómo funciona»):
//   0. tema → consulta (D-idioma)
//   1. mapa: conteos PubMed por capa (D-mapa, D-volumen)
//   2. selección: 2 revisiones + 1 primario por capa (D-seleccion)
//   3. lectura: registros con abstract, tipos y MeSH (D-texto, D-metadatos)
//   4. extracción + control mecánico (D-extractor, D-esquema, D-control)
//   5. enlaces a PDF abierto legal (D-fuente)
// Cada etapa escribe en el dossier; un fallo parcial queda registrado y
// no borra lo ya obtenido.

import { LAYERS, SCHEMA, layerMeshQuery, slotsFor } from '../method/method.js'
import * as pubmed from '../engine/sources/pubmed.js'
import { openAlexOaUrl } from '../engine/sources/openalex.js'
import { paperText } from '../engine/paper.js'
import { emptyDossier, gateContext } from './dossier.js'
import { extractRows, extractorAvailable, normalizeTopic } from './extractor.js'
import { gateRows } from './gate.js'

const REVIEWS = '(systematic[sb] OR review[pt])'
const PER_LAYER = { revision: 2, primario: 1 }
const EXTRACT_CONCURRENCY = 3
const BASELINE_KEY = 'hf-baseline'
const BASELINE_TTL_MS = 30 * 24 * 60 * 60 * 1000

/** Conteos globales (todo PubMed) por capa: cambian despacio, se guardan 30 días. */
async function baselines(version) {
  try {
    const cached = JSON.parse(window.localStorage.getItem(BASELINE_KEY) ?? 'null')
    if (cached?.version === version && Date.now() - cached.at < BASELINE_TTL_MS) return cached.data
  } catch {
    /* sin almacenamiento: se recalcula */
  }
  const data = { pubmedTotal: (await pubmed.count('all[sb]')).count, layers: {} }
  for (const layer of LAYERS) data.layers[layer.id] = (await pubmed.count(layerMeshQuery(layer))).count
  try {
    window.localStorage.setItem(BASELINE_KEY, JSON.stringify({ version, at: Date.now(), data }))
  } catch {
    /* sin almacenamiento */
  }
  return data
}

async function mapLimit(items, limit, fn) {
  let next = 0
  const worker = async () => {
    while (next < items.length) await fn(items[next++])
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
}

/**
 * P: texto del usuario; onProgress(dossier, { stage, message }) tras cada paso.
 * Q: dossier final.
 */
export async function runTopic(input, onProgress = () => {}) {
  const d = emptyDossier({ input })
  const emit = (stage, message) => onProgress(structuredClone(d), { stage, message })
  const fail = (stage, err) => d.errors.push({ stage, message: err.message ?? String(err) })

  // 0. Consulta
  emit('consulta', 'Preparando la consulta…')
  if (extractorAvailable()) {
    try {
      const n = await normalizeTopic(input)
      d.queryUsed = n.query_en
      d.kind = SCHEMA.kinds.includes(n.kind) ? n.kind : 'otro'
      d.normalizedBy = 'ia'
      d.method.extractor = { model: n.model, promptVersion: n.promptVersion }
    } catch (err) {
      fail('consulta', err)
    }
  }
  if (!d.queryUsed) {
    d.queryUsed = input
    d.normalizedBy = 'literal'
  }
  const q = `(${d.queryUsed})`

  // 1. Mapa
  emit('mapa', 'Contando literatura por capa en PubMed…')
  try {
    const total = await pubmed.count(q)
    d.map.total = total.count
    d.map.translation = total.translation
    if (total.count === 0) {
      emit('fin', 'PubMed no tiene papers para esta consulta.')
      return d
    }
    const base = await baselines(d.method.layers)
    d.map.pubmedTotal = base.pubmedTotal
    for (const layer of LAYERS) {
      const query = `${q} AND ${layerMeshQuery(layer)}`
      try {
        const c = await pubmed.count(query)
        const share = c.count / total.count
        const expected = base.layers[layer.id] / base.pubmedTotal
        d.map.layers[layer.id] = {
          query,
          count: c.count,
          share,
          baseline: base.layers[layer.id],
          observedExpected: expected > 0 ? share / expected : null,
          translation: c.translation,
          notFound: c.notFound,
        }
      } catch (err) {
        d.map.layers[layer.id] = { query, error: err.message }
      }
      emit('mapa', `Contando literatura por capa en PubMed… (${Object.keys(d.map.layers).length}/${LAYERS.length})`)
    }
  } catch (err) {
    fail('mapa', err)
    emit('fin', 'No se pudo consultar PubMed.')
    return d
  }

  // 2. Selección
  emit('seleccion', 'Eligiendo revisiones y estudios por capa…')
  const retrieval = new Map() // pmid → [{ layer, bucket, position }]
  for (const layer of LAYERS) {
    const entry = d.map.layers[layer.id]
    if (!entry || entry.error || entry.count === 0) continue
    const buckets = [
      ['revision', `${entry.query} AND ${REVIEWS}`],
      ['primario', `${entry.query} NOT ${REVIEWS}`],
    ]
    for (const [bucket, query] of buckets) {
      try {
        const found = await pubmed.ids(query, PER_LAYER[bucket] + 4)
        let taken = 0
        for (const [position, pmid] of found.entries()) {
          if (taken >= PER_LAYER[bucket]) break
          if (retrieval.has(pmid)) continue
          retrieval.set(pmid, { layer: layer.id, bucket, position: position + 1, query })
          taken++
        }
      } catch (err) {
        fail('seleccion', err)
      }
    }
  }

  // 3. Lectura
  emit('lectura', `Leyendo ${retrieval.size} registros de PubMed…`)
  try {
    for (const paper of await pubmed.records([...retrieval.keys()])) {
      const r = retrieval.get(paper.pmid)
      d.papers[paper.pmid] = { ...paper, retrievedFor: [r.layer], retrieval: r }
    }
  } catch (err) {
    fail('lectura', err)
  }

  // 4. Extracción
  if (!extractorAvailable()) {
    emit('fin', 'Mapa listo. Sin servicio extractor: no se han leído efectos (ver D-extractor).')
    return d
  }
  const batches = LAYERS.map((layer) => ({
    layer: layer.id,
    pmids: Object.values(d.papers).filter((p) => p.retrieval.layer === layer.id && p.abstract).map((p) => p.pmid),
  })).filter((b) => b.pmids.length)
  const allowedSlots = slotsFor(d.kind)
  let done = 0
  await mapLimit(batches, EXTRACT_CONCURRENCY, async (batch) => {
    const record = { layer: batch.layer, pmids: batch.pmids, status: 'ok' }
    try {
      const res = await extractRows({
        topic: d.queryUsed,
        kind: d.kind,
        slots: allowedSlots,
        layers: LAYERS.map((l) => ({ id: l.id, name: l.name })),
        papers: batch.pmids.map((id) => ({ id, text: paperText(d.papers[id]) })),
      })
      d.method.extractor = { model: res.model, promptVersion: res.promptVersion }
      const gated = gateRows(res.rows ?? {}, gateContext(d))
      d.rows.effects.push(...gated.effects)
      d.rows.measures.push(...gated.measures)
      d.rows.links.push(...gated.links)
      d.rejected.push(...gated.rejected)
      record.accepted = gated.effects.length + gated.measures.length + gated.links.length
      record.rejected = gated.rejected.length
    } catch (err) {
      record.status = 'error'
      record.error = err.message
    }
    d.extraction.batches.push(record)
    done++
    emit('extraccion', `Leyendo papers con el extractor… (${done}/${batches.length} capas)`)
  })

  // 5. PDF abierto legal (mejora; un fallo no afecta a nada más)
  await mapLimit(
    Object.values(d.papers).filter((p) => p.doi),
    4,
    async (p) => {
      try {
        p.links.oa = await openAlexOaUrl(p.doi)
      } catch {
        /* sin enlace OA */
      }
    },
  )

  emit('fin', 'Listo.')
  return d
}
