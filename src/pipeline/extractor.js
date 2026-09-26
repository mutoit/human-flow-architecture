// Cliente del servicio (decisión D-extractor). La clave de la IA vive en
// el servicio; el navegador solo conoce su URL (VITE_EXTRACTOR_URL; en el
// despliegue de Cloudflare es la misma web: /api/extract). Sin URL, no hay
// extracción y la app lo dice.

const ENDPOINT = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_EXTRACTOR_URL) || null

export const extractorAvailable = () => Boolean(ENDPOINT)

async function call(body) {
  let res
  try {
    res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
  } catch {
    throw new Error('No se pudo conectar con el servicio extractor.')
  }
  const data = await res.json().catch(() => null)
  if (!res.ok || !data) throw new Error(data?.error ?? `El servicio extractor respondió ${res.status}.`)
  return data
}

/** Q: { query_en, kind, model, promptVersion }. */
export const normalizeTopic = (query, runId) => call({ op: 'normalize', query, runId })

/** Q: { rows: { effects, measures, links }, model, promptVersion }. */
export const extractRows = (payload) => call({ op: 'extract', ...payload })

/** Segunda lectura ciega. Q: { answers: [{ key, direction }], model, promptVersion }. */
export const verifyDirections = (items, runId) => call({ op: 'verify', items, runId })

/** Guarda el dossier final en el registro del servicio (best effort). */
export const logDossier = (dossier) => call({ op: 'log_dossier', runId: dossier.runId, dossier }).catch(() => null)
