// Forma ÚNICA de un paper, sea cual sea la fuente (PubMed, OpenAlex…).
// Cada fuente entrega campos crudos a `makePaper`; los enlaces derivados
// (PubMed / PMC / DOI) se calculan aquí y en ningún otro sitio.

import { pubmedUrl } from './citations.js'

export const BLOCKED_HOSTS = /sci-hub|annas-archive|libgen|librarygenesis/i

export const normalizeDoi = (doi) => String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')

export function pmcUrl(pmcid) {
  const id = String(pmcid).replace(/^PMC/i, '')
  return `https://www.ncbi.nlm.nih.gov/pmc/articles/PMC${id}/`
}

export function doiUrl(doi) {
  return `https://doi.org/${normalizeDoi(doi)}`
}

/** Lista de autores legible: primeros `max` y "et al." si hay más. */
export function authorList(names, max = 6) {
  const clean = names.filter(Boolean)
  return clean.length > max ? `${clean.slice(0, max).join(', ')}, et al.` : clean.join(', ')
}

/** URL de OA solo si es legal (nunca Sci-Hub y similares). */
export const legalUrl = (url) => (url && !BLOCKED_HOSTS.test(url) ? url : null)

/**
 * P: campos crudos de una fuente.
 * Q: paper con la forma que consume la UI. `oaChecked` = la fuente ya
 *    resolvió el acceso abierto (no hace falta consultarlo aparte).
 */
export function makePaper({
  pmid = null,
  pmcid = null,
  doi = null,
  title,
  authors = '',
  journal = null,
  year = null,
  pubTypes = [],
  abstract = '',
  isOpenAccess = false,
  citedByCount = 0,
  oaUrl = null,
  oaChecked = false,
}) {
  const pmc = pmcid ? String(pmcid).replace(/^PMC/i, '') : null
  const cleanDoi = doi ? normalizeDoi(doi) : null
  return {
    pmid: pmid ? String(pmid) : null,
    pmcid: pmc,
    doi: cleanDoi,
    title: title?.trim() || 'Sin título',
    authors,
    journal,
    year,
    pubTypes,
    abstract,
    isOpenAccess: Boolean(isOpenAccess),
    citedByCount: Number(citedByCount) || 0,
    pubmed: pmid ? pubmedUrl(String(pmid)) : null,
    pmc: pmc ? pmcUrl(pmc) : null,
    doiHref: cleanDoi ? doiUrl(cleanDoi) : null,
    oaUrl: legalUrl(oaUrl),
    oaChecked,
  }
}

/** Un paper solo entra si tiene un identificador oficial. */
export const hasOfficialId = (p) => Boolean(p.pmid || p.pmcid || p.doi)
