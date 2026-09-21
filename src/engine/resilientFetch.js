// Único flujo de red para las APIs de literatura (PubMed/NCBI, OpenAlex):
// - fetchJson / fetchText: GET con reintento ante 429/503 respetando
//   `Retry-After` (o backoff exponencial con jitter si el servidor no lo
//   manda / el navegador no lo expone por CORS). Agotados los reintentos
//   lanza un error TIPADO (RateLimitError / HttpError / NetworkError) —
//   nunca un fallo silencioso.
// - createTtlCache: caché en memoria de PROMESAS por clave. Al guardar la
//   promesa, dos llamadas simultáneas iguales comparten una sola petición;
//   si falla, la entrada se descarta (los errores no se cachean).

export class HttpError extends Error {
  constructor(service, status) {
    super(`${service} no respondió (${status}).`)
    this.name = 'HttpError'
    this.service = service
    this.status = status
  }
}

export class NetworkError extends Error {
  constructor(service) {
    super(`No se pudo conectar con ${service}. Revisa tu conexión o si una extensión (bloqueador) la impide.`)
    this.name = 'NetworkError'
    this.service = service
  }
}

export class RateLimitError extends Error {
  constructor(service, retryAfterMs) {
    super(`${service} limitó las peticiones. Espera unos segundos y vuelve a intentarlo.`)
    this.name = 'RateLimitError'
    this.service = service
    this.retryAfterMs = retryAfterMs
  }
}

const RETRIABLE = new Set([429, 503])
const MAX_RETRIES = 2
const BASE_BACKOFF_MS = 500
const MAX_WAIT_MS = 4000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** `Retry-After` en ms (segundos o fecha HTTP), o null si no viene/ilegible. */
function retryAfterMs(res) {
  const raw = res.headers.get('retry-after')
  if (!raw) return null
  const seconds = Number(raw)
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
  const date = Date.parse(raw)
  return Number.isNaN(date) ? null : Math.max(0, date - Date.now())
}

/**
 * P: service (nombre para el mensaje de error), url, accept (cabecera), read (res → body).
 * Q: cuerpo leído; o lanza HttpError (status no reintentable / 503 agotado),
 *    RateLimitError (429 agotado, o Retry-After demasiado largo para esperar)
 *    o NetworkError (sin red / bloqueo del navegador).
 */
async function request(service, url, accept, read) {
  for (let attempt = 0; ; attempt++) {
    let res
    try {
      res = await fetch(url, { headers: { Accept: accept } })
    } catch {
      // "Failed to fetch": sin red, bloqueo CORS o extensión — sin detalle en el navegador.
      throw new NetworkError(service)
    }
    if (res.ok) return read(res)
    if (!RETRIABLE.has(res.status)) throw new HttpError(service, res.status)

    const hinted = retryAfterMs(res)
    const tooLong = hinted != null && hinted > MAX_WAIT_MS
    if (attempt >= MAX_RETRIES || tooLong) {
      throw res.status === 429 ? new RateLimitError(service, hinted) : new HttpError(service, res.status)
    }
    const backoff = BASE_BACKOFF_MS * 2 ** attempt + Math.random() * 250
    await sleep(hinted ?? backoff)
  }
}

export const fetchJson = (service, url) => request(service, url, 'application/json', (res) => res.json())
export const fetchText = (service, url) => request(service, url, 'application/xml, text/xml, */*', (res) => res.text())

/**
 * Caché TTL de promesas con tope de tamaño (descarta la entrada más antigua).
 * `get(key, loader)`: devuelve la promesa cacheada si sigue viva; si no, llama
 * a `loader()` (que devuelve una promesa) y la guarda. `delete(key)` la descarta.
 */
export function createTtlCache({ ttlMs, max }) {
  const store = new Map()

  return {
    get(key, loader) {
      const hit = store.get(key)
      if (hit && hit.expires > Date.now()) return hit.value

      const value = Promise.resolve().then(loader)
      store.set(key, { value, expires: Date.now() + ttlMs })
      while (store.size > max) store.delete(store.keys().next().value)
      value.catch(() => {
        if (store.get(key)?.value === value) store.delete(key)
      })
      return value
    },
    delete(key) {
      store.delete(key)
    },
  }
}
