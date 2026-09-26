// Forma ÚNICA de un paper. Los enlaces derivados (PubMed / PMC / DOI) se
// calculan aquí y en ningún otro sitio. Diseño y especie salen de los
// metadatos de indexación (decisión D-metadatos), nunca de la IA.

import { SCHEMA } from '../method/method.js'

export const BLOCKED_HOSTS = /sci-hub|annas-archive|libgen|librarygenesis/i

export const normalizeDoi = (doi) => String(doi).replace(/^https?:\/\/(dx\.)?doi\.org\//i, '')
export const pubmedUrl = (pmid) => `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
export const pmcUrl = (pmcid) => `https://pmc.ncbi.nlm.nih.gov/articles/PMC${String(pmcid).replace(/^PMC/i, '')}/`
export const doiUrl = (doi) => `https://doi.org/${normalizeDoi(doi)}`

/** Lista de autores legible: primeros `max` y "et al." si hay más. */
export function authorList(names, max = 6) {
  const clean = names.filter(Boolean)
  return clean.length > max ? `${clean.slice(0, max).join(', ')}, et al.` : clean.join(', ')
}

/** URL de OA solo si es legal (nunca Sci-Hub y similares). */
export const legalUrl = (url) => (url && !BLOCKED_HOSTS.test(url) ? url : null)

/** Diseño por tipo de publicación de PubMed (primera coincidencia de la tabla). */
export function designOf(pubTypes) {
  for (const [pubType, design] of SCHEMA.designFromPubType) if (pubTypes.includes(pubType)) return design
  return 'primario_sin_tipo'
}

/** Especie por etiquetas MeSH; varias a la vez se listan todas. */
export function speciesOf(mesh) {
  const found = Object.entries(SCHEMA.speciesFromMesh)
    .filter(([heading]) => mesh.includes(heading))
    .map(([, label]) => label)
  return found.length ? found : ['no_indicada']
}

export function makePaper({ pmid = null, pmcid = null, doi = null, title, authors = '', journal = null, year = null, pubTypes = [], mesh = [], sections = [] }) {
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
    mesh,
    design: designOf(pubTypes),
    species: speciesOf(mesh),
    sections,
    abstract: sections.map((sec) => (sec.label ? `${sec.label}: ${sec.text}` : sec.text)).join(' '),
    links: {
      pubmed: pmid ? pubmedUrl(String(pmid)) : null,
      pmc: pmc ? pmcUrl(pmc) : null,
      doi: cleanDoi ? doiUrl(cleanDoi) : null,
      oa: null,
    },
  }
}

