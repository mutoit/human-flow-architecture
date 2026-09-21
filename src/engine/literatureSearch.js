// Búsqueda de literatura oficial con CADENA de fuentes (PubMed → OpenAlex).
// P: query de tema (enfermedad, hormona, síntoma, vitamina…).
// Q: { query, hitCount, papers[], source, failures[] } con metadatos + abstract
//    + enlaces legales (PubMed / PMC / DOI / OA). Cero cálculo clínico. Cero Sci-Hub.
//
// Garantía: cada fuente es independiente y se llama directo desde el
// navegador (CORS abierto), sin proxy ni regla de servidor — funciona igual
// en `vite dev`, en un dominio propio o en Cloudflare Pages. Si una fuente
// falla (red, límite, error de API) o no encuentra nada, se prueba la
// siguiente. Solo lanza error si NINGUNA responde.

import { createTtlCache, RateLimitError } from './resilientFetch.js'
import { openAlexOaUrl, openAlexSource } from './sources/openalex.js'
import { pubmedSource } from './sources/pubmed.js'

// Orden = prioridad. Añadir una fuente = añadir un objeto { name, search }.
const SOURCES = [pubmedSource, openAlexSource]

// Caché en memoria (por sesión): repetir un tema no vuelve a gastar cuota.
// Los errores no se cachean, ni tampoco los resultados degradados (con
// fallos de una fuente previa) para reintentar la principal en la próxima.
const searchCache = createTtlCache({ ttlMs: 10 * 60 * 1000, max: 50 })

export class SearchUnavailableError extends Error {
  constructor(failures) {
    super(`No se pudo buscar en ninguna fuente. ${failures.map((f) => `${f.source}: ${f.message}`).join(' · ')}`)
    this.name = 'SearchUnavailableError'
    this.failures = failures
  }
}

async function searchChain(query, pageSize) {
  const failures = []
  let emptyFrom = null

  for (const source of SOURCES) {
    try {
      const { hitCount, papers } = await source.search(query, { pageSize })
      if (papers.length > 0) return { query, hitCount, papers, source: source.name, failures }
      emptyFrom ??= source.name // 0 resultados es válido, pero se prueba la siguiente por si acaso
    } catch (err) {
      failures.push({ source: source.name, message: err.message })
    }
  }

  if (emptyFrom) return { query, hitCount: 0, papers: [], source: emptyFrom, failures }
  throw new SearchUnavailableError(failures)
}

/**
 * P: query string no vacía.
 * Q: resultado de la primera fuente con papers oficiales (PMID/PMC/DOI).
 *    `failures` lista las fuentes anteriores que fallaron (vacío = sin incidencias).
 */
export function searchLiterature(query, { pageSize = 20 } = {}) {
  const q = query.trim()
  if (!q) return Promise.reject(new Error('Escribe un tema para buscar.'))

  const key = `${q.toLowerCase().replace(/\s+/g, ' ')}|${pageSize}`
  const pending = searchCache.get(key, () => searchChain(q, pageSize))
  pending.then((result) => {
    if (result.failures.length > 0) searchCache.delete(key)
  }, () => {})
  return pending
}

// ---- Acceso abierto por DOI (papers de fuentes que no lo resuelven) ----

// Máx. peticiones simultáneas y pausa tras un 429 agotado.
const OA_CONCURRENCY = 4
const OA_DEFAULT_COOLDOWN_MS = 30 * 1000
let oaBlockedUntil = 0

async function mapLimit(items, limit, fn) {
  const out = new Array(items.length)
  let next = 0
  async function worker() {
    while (next < items.length) {
      const i = next++
      out[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return out
}

/**
 * P: papers[] de searchLiterature.
 * Q: { papers, throttled } — los primeros `limit` con DOI, sin OA y sin
 *    `oaChecked` ganan `oaUrl` legal de OpenAlex si existe (nunca Sci-Hub).
 *    `throttled` = true si OpenAlex limitó y algún PDF no se pudo comprobar;
 *    en ese caso se pausa OpenAlex un rato en vez de insistir.
 */
export async function enrichPapersOa(papers, { limit = 8 } = {}) {
  let throttled = false

  const enriched = await mapLimit(papers.slice(0, limit), OA_CONCURRENCY, async (paper) => {
    if (!paper.doi || paper.oaUrl || paper.oaChecked) return paper
    if (Date.now() < oaBlockedUntil) {
      throttled = true
      return paper
    }
    try {
      const oaUrl = await openAlexOaUrl(paper.doi)
      return oaUrl ? { ...paper, oaUrl, isOpenAccess: true } : paper
    } catch (err) {
      if (err instanceof RateLimitError) {
        oaBlockedUntil = Date.now() + (err.retryAfterMs ?? OA_DEFAULT_COOLDOWN_MS)
        throttled = true
      }
      return paper
    }
  })

  return { papers: [...enriched, ...papers.slice(limit)], throttled }
}
