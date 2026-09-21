// Fuente OpenAlex (CORS abierto). Dos usos con la misma API:
//  - openAlexSource: búsqueda de respaldo cuando PubMed falla o no encuentra.
//    Ya trae el enlace de PDF abierto → `oaChecked`, sin llamadas extra.
//  - openAlexOaUrl: para papers de otras fuentes, busca su PDF legal por DOI.

import { authorList, hasOfficialId, legalUrl, makePaper, normalizeDoi } from '../paper.js'
import { HttpError, createTtlCache, fetchJson } from '../resilientFetch.js'

const WORKS = 'https://api.openalex.org/works'
const MAILTO = 'humanflow-architecture@local'
const SELECT = 'id,doi,title,publication_year,ids,abstract_inverted_index,open_access,cited_by_count,primary_location,authorships,type'

const lastSegment = (u) => (u ? String(u).split('/').filter(Boolean).pop() : null)

/** OpenAlex guarda el abstract como índice invertido {palabra: [posiciones]}. */
function abstractFromIndex(index) {
  if (!index) return ''
  const words = []
  for (const [word, positions] of Object.entries(index)) for (const p of positions) words[p] = word
  return words.filter(Boolean).join(' ')
}

function toPaper(work) {
  return makePaper({
    pmid: lastSegment(work.ids?.pmid),
    pmcid: lastSegment(work.ids?.pmcid),
    doi: work.doi,
    title: work.title,
    authors: authorList((work.authorships ?? []).map((a) => a.author?.display_name)),
    journal: work.primary_location?.source?.display_name ?? null,
    year: work.publication_year ?? null,
    pubTypes: work.type ? [work.type] : [],
    abstract: abstractFromIndex(work.abstract_inverted_index),
    isOpenAccess: work.open_access?.is_oa,
    citedByCount: work.cited_by_count,
    oaUrl: work.open_access?.oa_url,
    oaChecked: true,
  })
}

export const openAlexSource = {
  name: 'OpenAlex',

  async search(query, { pageSize }) {
    const params = new URLSearchParams({ search: query, 'per-page': String(pageSize), select: SELECT, mailto: MAILTO })
    const data = await fetchJson('OpenAlex', `${WORKS}?${params}`)
    const papers = (data.results ?? []).map(toPaper).filter(hasOfficialId)
    return { hitCount: Number(data.meta?.count) || papers.length, papers }
  },
}

const oaCache = createTtlCache({ ttlMs: 60 * 60 * 1000, max: 300 })

/** URL OA legal para un DOI, o null si no hay / OpenAlex no lo conoce. */
export function openAlexOaUrl(doi) {
  const id = normalizeDoi(doi).toLowerCase()
  return oaCache.get(id, async () => {
    try {
      const work = await fetchJson('OpenAlex', `${WORKS}/https://doi.org/${encodeURIComponent(id)}?mailto=${MAILTO}`)
      return legalUrl(work.best_oa_location?.pdf_url || work.best_oa_location?.landing_page_url)
    } catch (err) {
      // 404 = OpenAlex no conoce el DOI: respuesta válida, se cachea como "sin OA".
      if (err instanceof HttpError && err.status === 404) return null
      throw err
    }
  })
}
