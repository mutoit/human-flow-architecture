// Fuente PubMed vía NCBI E-utilities (CORS abierto: se llama directo desde
// el navegador, sin proxy ni regla de servidor).
//   1. esearch  → PMIDs + total          (JSON)
//   2. esummary → metadatos              (JSON)  ← camino esencial
//   3. efetch   → abstracts              (XML)   ← mejora "best effort"
// Si el paso 3 falla, los papers se devuelven igual, sin abstract (la UI ya
// ofrece abrirlo en PubMed): un fallo de abstracts nunca tumba la búsqueda.

import { authorList, hasOfficialId, makePaper } from '../paper.js'
import { fetchJson, fetchText } from '../resilientFetch.js'

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL = 'humanflow'

const url = (endpoint, params) => `${BASE}/${endpoint}.fcgi?${new URLSearchParams({ ...params, tool: TOOL })}`

/** NCBI a veces contesta 200 con `ERROR` en el cuerpo. */
function assertNoApiError(body, where) {
  const message = body?.error ?? body?.esearchresult?.ERROR
  if (message) throw new Error(`PubMed (${where}): ${message}`)
}

/**
 * P: XML de efetch. Q: Map pmid → abstract (con etiquetas si el resumen es estructurado).
 * Selectores exactos: el XML repite <PMID> dentro de las referencias citadas, así
 * que solo se lee el de MedlineCitation de cada PubmedArticle.
 */
function parseAbstracts(xmlText) {
  const out = new Map()
  if (typeof DOMParser === 'undefined') return out
  const doc = new DOMParser().parseFromString(xmlText, 'text/xml')
  if (doc.querySelector('parsererror')) return out

  for (const article of doc.querySelectorAll('PubmedArticle')) {
    const pmid = article.querySelector('MedlineCitation > PMID')?.textContent?.trim()
    const parts = [...article.querySelectorAll('MedlineCitation > Article > Abstract > AbstractText')]
      .map((el) => {
        const text = el.textContent.replace(/\s+/g, ' ').trim()
        const label = el.getAttribute('Label')
        return label && text ? `${label}: ${text}` : text
      })
      .filter(Boolean)
    if (pmid && parts.length) out.set(pmid, parts.join(' '))
  }
  return out
}

async function fetchAbstracts(ids) {
  try {
    const xml = await fetchText('PubMed', url('efetch', { db: 'pubmed', id: ids.join(','), retmode: 'xml' }))
    return parseAbstracts(xml)
  } catch {
    return new Map()
  }
}

const idOf = (record, type) => record.articleids?.find((a) => a.idtype === type)?.value ?? null

function toPaper(record, abstracts) {
  const year = /^\d{4}/.exec(record.pubdate ?? '')?.[0] ?? null
  return makePaper({
    pmid: record.uid,
    pmcid: idOf(record, 'pmc'),
    doi: idOf(record, 'doi'),
    title: record.title,
    authors: authorList((record.authors ?? []).map((a) => a.name)),
    journal: record.fulljournalname || record.source || null,
    year,
    pubTypes: record.pubtype ?? [],
    abstract: abstracts.get(String(record.uid)) ?? '',
    citedByCount: record.pmcrefcount,
  })
}

export const pubmedSource = {
  name: 'PubMed',

  async search(query, { pageSize }) {
    const found = await fetchJson('PubMed', url('esearch', { db: 'pubmed', term: query, retmode: 'json', retmax: String(pageSize) }))
    assertNoApiError(found, 'búsqueda')
    const ids = found.esearchresult?.idlist ?? []
    const hitCount = Number(found.esearchresult?.count) || 0
    if (ids.length === 0) return { hitCount, papers: [] }

    const summary = await fetchJson('PubMed', url('esummary', { db: 'pubmed', id: ids.join(','), retmode: 'json' }))
    assertNoApiError(summary, 'resumen')
    const abstracts = await fetchAbstracts(ids)

    const papers = ids
      .map((id) => summary.result?.[id])
      .filter(Boolean)
      .map((record) => toPaper(record, abstracts))
      .filter(hasOfficialId)
    return { hitCount, papers }
  },
}
