// PubMed vía NCBI E-utilities (CORS abierto: se llama directo desde el
// navegador). Tres operaciones, todas con el límite de NCBI sin clave
// (3 peticiones/s) respetado en cola:
//   count(term)            → { count, translation, notFound[] }
//   ids(term, retmax)      → PMIDs en orden de relevancia (Best Match)
//   records(pmids)         → registros con abstract, tipos de publicación y MeSH

import { fetchJson, fetchText } from '../resilientFetch.js'
import { authorList, makePaper } from '../paper.js'

const BASE = 'https://eutils.ncbi.nlm.nih.gov/entrez/eutils'
const TOOL = 'humanflow'
const MIN_GAP_MS = 350

const url = (endpoint, params) => `${BASE}/${endpoint}.fcgi?${new URLSearchParams({ ...params, tool: TOOL })}`

// Cola global: una petición cada MIN_GAP_MS, en orden de llegada.
let queue = Promise.resolve()
function throttled(fn) {
  const run = queue.then(fn)
  queue = run.catch(() => {}).then(() => new Promise((r) => setTimeout(r, MIN_GAP_MS)))
  return run
}

/** NCBI a veces contesta 200 con `ERROR` en el cuerpo. */
function assertNoApiError(body, where) {
  const message = body?.error ?? body?.esearchresult?.ERROR
  if (message) throw new Error(`PubMed (${where}): ${message}`)
}

async function esearch(term, retmax) {
  const body = await throttled(() =>
    fetchJson('PubMed', url('esearch', { db: 'pubmed', term, retmode: 'json', retmax: String(retmax), sort: 'relevance' })),
  )
  assertNoApiError(body, 'búsqueda')
  return body.esearchresult ?? {}
}

export async function count(term) {
  const r = await esearch(term, 0)
  return {
    count: Number(r.count) || 0,
    translation: r.querytranslation ?? null,
    notFound: [...(r.errorlist?.phrasesnotfound ?? []), ...(r.errorlist?.fieldsnotfound ?? [])],
  }
}

export async function ids(term, retmax) {
  const r = await esearch(term, retmax)
  return r.idlist ?? []
}

const text = (el) => (el?.textContent ?? '').replace(/\s+/g, ' ').trim()

function parseArticle(article) {
  const citation = article.querySelector('MedlineCitation')
  const pmid = text(citation?.querySelector(':scope > PMID'))
  const art = citation?.querySelector(':scope > Article')
  // Secciones del abstract con su categoría normalizada de la NLM
  // (BACKGROUND, OBJECTIVE, METHODS, RESULTS, CONCLUSIONS, UNASSIGNED).
  const sections = [...(art?.querySelectorAll(':scope > Abstract > AbstractText') ?? [])]
    .map((el) => ({ category: el.getAttribute('NlmCategory') || null, label: el.getAttribute('Label') || null, text: text(el) }))
    .filter((sec) => sec.text)
  const authors = [...(art?.querySelectorAll(':scope > AuthorList > Author') ?? [])].map((a) =>
    [text(a.querySelector('LastName')), text(a.querySelector('Initials'))].filter(Boolean).join(' ') || text(a.querySelector('CollectiveName')),
  )
  const idOf = (type) => text(article.querySelector(`PubmedData > ArticleIdList > ArticleId[IdType="${type}"]`)) || null
  const year =
    text(art?.querySelector('Journal > JournalIssue > PubDate > Year')) ||
    /\d{4}/.exec(text(art?.querySelector('Journal > JournalIssue > PubDate > MedlineDate')))?.[0] ||
    null

  return makePaper({
    pmid,
    pmcid: idOf('pmc'),
    doi: idOf('doi'),
    title: text(art?.querySelector(':scope > ArticleTitle')),
    authors: authorList(authors),
    journal: text(art?.querySelector('Journal > Title')) || null,
    year,
    pubTypes: [...(art?.querySelectorAll('PublicationTypeList > PublicationType') ?? [])].map(text),
    mesh: [...(citation?.querySelectorAll('MeshHeadingList > MeshHeading > DescriptorName') ?? [])].map(text),
    sections,
  })
}

export async function records(pmids) {
  if (pmids.length === 0) return []
  const xml = await throttled(() => fetchText('PubMed', url('efetch', { db: 'pubmed', id: pmids.join(','), retmode: 'xml' })))
  const doc = new DOMParser().parseFromString(xml, 'text/xml')
  if (doc.querySelector('parsererror')) throw new Error('PubMed devolvió un XML ilegible.')
  return [...doc.querySelectorAll('PubmedArticle')].map(parseArticle).filter((p) => p.pmid)
}
