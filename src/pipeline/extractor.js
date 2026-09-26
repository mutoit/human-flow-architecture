// Cliente del servicio extractor (decisión D-extractor). La clave de la IA
// vive en el servicio; el navegador solo conoce su URL pública
// (VITE_EXTRACTOR_URL). Sin URL, no hay extracción y la app lo dice.

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
export const normalizeTopic = (query) => call({ op: 'normalize', query })

/** Q: { rows: { effects, measures, links }, model, promptVersion }. */
export const extractRows = (payload) => call({ op: 'extract', ...payload })
