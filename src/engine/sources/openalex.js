// OpenAlex (CORS abierto): SOLO para encontrar el PDF abierto legal de un
// paper por su DOI (decisión D-fuente). No participa en la búsqueda.

import { normalizeDoi, legalUrl } from '../paper.js'
import { HttpError, createTtlCache, fetchJson } from '../resilientFetch.js'

const WORKS = 'https://api.openalex.org/works'
const MAILTO = 'humanflow-architecture@local'
const oaCache = createTtlCache({ ttlMs: 60 * 60 * 1000, max: 300 })

/** URL OA legal para un DOI, o null si no hay / OpenAlex no lo conoce. */
export function openAlexOaUrl(doi) {
  const id = normalizeDoi(doi).toLowerCase()
  return oaCache.get(id, async () => {
    try {
      const work = await fetchJson('OpenAlex', `${WORKS}/https://doi.org/${encodeURIComponent(id)}?mailto=${MAILTO}`)
      return legalUrl(work.best_oa_location?.pdf_url || work.best_oa_location?.landing_page_url)
    } catch (err) {
      if (err instanceof HttpError && err.status === 404) return null
      throw err
    }
  })
}
