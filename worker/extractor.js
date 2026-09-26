// Servicio de Human Flow en Cloudflare: sirve la web (dist/) y la API.
//   POST /api/extract   op = normalize | extract | verify | read_direction | log_dossier
//   GET  /api/logs      registro de llamadas (Authorization: Bearer LOG_TOKEN)
//   GET  /api/dossiers  dossiers guardados   (Authorization: Bearer LOG_TOKEN)
// La IA SEÑALA (ids de frase y de número, fragmentos de la frase); la app
// valida y construye los datos (src/pipeline/gate.js). Enums y huecos salen
// del mismo archivo que usa la app (src/method/schema.json).

import Anthropic from '@anthropic-ai/sdk'
import schema from '../src/method/schema.json'

const PROMPT_VERSION = '2'
const keys = (o) => Object.keys(o)
const nullable = (s) => ({ anyOf: [s, { type: 'null' }] })
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })
const describe = (o) => Object.entries(o).map(([k, v]) => `- ${k}: ${v}`).join('\n')

// Misma definición de dirección para la extracción y para la segunda lectura.
const DIRECTION_RULES = `Dirección, siempre desde la EXPOSICIÓN frente al COMPARADOR (o frente a no tenerla / antes):
- aumenta: el resultado es mayor con la exposición.
- disminuye: el resultado es menor con la exposición.
- sin_efecto: la frase dice que no hay diferencia.
Ojo con las comparaciones invertidas: «X fue mayor en los controles que en los pacientes» significa que en los pacientes es MENOR.`

function rowsSchema(slots) {
  const base = { paperId: { type: 'string' }, sentence: { type: 'string' } }
  return obj({
    effects: {
      type: 'array',
      items: obj({
        ...base,
        exposure: { type: 'string' },
        outcome: { type: 'string' },
        comparator: nullable({ type: 'string' }),
        direction: { enum: keys(schema.directions) },
        claim: { enum: keys(schema.claims) },
        role: { enum: keys(schema.roles) },
      }),
    },
    measures: {
      type: 'array',
      items: obj({
        ...base,
        number: { type: 'string' },
        outcome: { type: 'string' },
        group: nullable({ type: 'string' }),
        slot: { enum: slots },
        metric: nullable({ enum: schema.effectSizeMetrics }),
      }),
    },
    links: {
      type: 'array',
      items: obj({ ...base, from: { type: 'string' }, to: { type: 'string' }, verb: { enum: keys(schema.linkPredicates) } }),
    },
  })
}

const EXTRACT_SYSTEM = `Eres un anotador de literatura biomédica. No escribes datos: SEÑALAS dónde están en el texto.

Cada paper llega con sus frases numeradas (s1, s2…) y su sección, y con una lista NUMEROS (n1, n2…) ya leídos por el sistema.

Reglas:
1. "sentence" es el id de UNA frase (p. ej. "s4"). Solo frases de resultados o conclusiones.
2. "exposure", "outcome", "comparator", "group", "from", "to" son fragmentos COPIADOS EXACTAMENTE de esa misma frase, lo más cortos posible (2–6 palabras). Si no puedes copiarlos exactos, no escribas la fila.
3. "number" es un id de la lista NUMEROS que pertenezca a esa frase. Nunca escribas el valor.
4. Efectos: la exposición es lo que produce o compara (normalmente el tema); el resultado es lo que cambia.
5. Eslabón (links): solo si la frase afirma que A cambia B.
6. "claim": asociacion si la frase habla de asociación o correlación; causal si afirma un efecto.
7. Solo lo que el texto afirma. Nada de conocimiento propio.

${DIRECTION_RULES}

Rol del tema respecto al resultado:
${describe(schema.roles)}`

const VERIFY_SYSTEM = `Lees UNA frase de un artículo científico y respondes una pregunta cerrada sobre ella. Solo cuenta lo que dice la frase.

${DIRECTION_RULES}
- indeterminado: la frase no permite saberlo.`

const NORMALIZE_SYSTEM = `Conviertes el tema que escribe un usuario (en cualquier idioma) en una consulta de PubMed en inglés y clasificas el tipo de tema.
- query_en: términos en inglés, preferentemente el término MeSH si existe; sin operadores inventados.
- kind: uno de ${schema.kinds.join(', ')}.`

const verifyQuestion = (it) =>
  `[${it.key}] Frase: «${it.sentence}»\nPregunta: según la frase, ¿«${it.outcome}» es mayor, menor o igual con «${it.exposure}» que ${it.comparator ? `con «${it.comparator}»` : 'sin ello / antes'}?`

// ---------- HTTP ----------

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

async function structured(client, model, system, user, outSchema) {
  const response = await client.beta.messages.create({
    model,
    max_tokens: 16000,
    betas: ['server-side-fallback-2026-07-01'],
    fallbacks: 'default',
    thinking: { type: 'adaptive' },
    output_config: { effort: 'high', format: { type: 'json_schema', schema: outSchema } },
    system,
    messages: [{ role: 'user', content: user }],
  })
  if (response.stop_reason === 'refusal') throw new Error('El modelo rechazó la petición.')
  if (response.stop_reason === 'max_tokens') throw new Error('Respuesta truncada (max_tokens).')
  const text = response.content.find((b) => b.type === 'text')?.text
  if (!text) throw new Error('Respuesta vacía del modelo.')
  return { data: JSON.parse(text), model: response.model }
}

async function logCall(env, entry) {
  if (!env.DB) return
  await env.DB.prepare(
    'INSERT INTO calls (ts, run_id, op, model, prompt_version, ms, ok, request, response, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  )
    .bind(new Date().toISOString(), entry.runId ?? null, entry.op, entry.model ?? null, PROMPT_VERSION, entry.ms, entry.ok ? 1 : 0, entry.request, entry.response ?? null, entry.error ?? null)
    .run()
}

async function handleOp(body, env) {
  const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })
  const extractModel = env.EXTRACT_MODEL || 'claude-opus-5'
  const verifyModel = env.VERIFY_MODEL || 'claude-opus-5'

  switch (body.op) {
    case 'normalize': {
      const { data, model } = await structured(
        client,
        extractModel,
        NORMALIZE_SYSTEM,
        String(body.query ?? '').slice(0, 300),
        obj({ query_en: { type: 'string' }, kind: { enum: schema.kinds } }),
      )
      return { ...data, model, promptVersion: PROMPT_VERSION }
    }
    case 'extract': {
      const allSlots = Object.values(schema.slots).flat()
      const slots = (body.slots ?? []).filter((s) => allSlots.includes(s))
      const user = [
        `Tema: ${body.topic}`,
        `Tipo de tema: ${body.kind ?? 'desconocido'}`,
        `Huecos de cifra permitidos: ${slots.join(', ') || 'ninguno'}`,
        '',
        ...(body.papers ?? []).slice(0, 5).map((p) => p.text),
      ].join('\n')
      const { data, model } = await structured(client, extractModel, EXTRACT_SYSTEM, user, rowsSchema(slots.length ? slots : ['n']))
      return { rows: data, model, promptVersion: PROMPT_VERSION }
    }
    case 'verify':
    case 'read_direction': {
      // verify = segunda lectura ciega (producción). read_direction = misma
      // pregunta con el modelo de extracción: solo para bench/evidence-inference.mjs.
      const items = (body.items ?? []).slice(0, 60)
      const { data, model } = await structured(
        client,
        body.op === 'verify' ? verifyModel : extractModel,
        VERIFY_SYSTEM,
        items.map(verifyQuestion).join('\n\n'),
        obj({ answers: { type: 'array', items: obj({ key: { type: 'string' }, direction: { enum: schema.verifyAnswers } }) } }),
      )
      return { answers: data.answers, model, promptVersion: PROMPT_VERSION }
    }
    default:
      throw Object.assign(new Error(`op desconocida: ${body.op}`), { status: 400 })
  }
}

function authorized(request, env) {
  return env.LOG_TOKEN && request.headers.get('Authorization') === `Bearer ${env.LOG_TOKEN}`
}

async function readLogs(request, env, table) {
  if (!authorized(request, env)) return json({ error: 'No autorizado.' }, 401)
  if (!env.DB) return json({ error: 'Sin base de datos de registro (D1).' }, 500)
  const url = new URL(request.url)
  const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 500)
  const run = url.searchParams.get('run')
  const q = run
    ? env.DB.prepare(`SELECT * FROM ${table} WHERE run_id = ? ORDER BY id DESC LIMIT ?`).bind(run, limit)
    : env.DB.prepare(`SELECT * FROM ${table} ORDER BY id DESC LIMIT ?`).bind(limit)
  return json((await q.all()).results)
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (!url.pathname.startsWith('/api/')) return env.ASSETS.fetch(request)
    if (request.method === 'GET' && url.pathname === '/api/logs') return readLogs(request, env, 'calls')
    if (request.method === 'GET' && url.pathname === '/api/dossiers') return readLogs(request, env, 'dossiers')
    if (request.method !== 'POST' || url.pathname !== '/api/extract') return json({ error: 'Ruta no válida.' }, 404)

    const body = await request.json().catch(() => null)
    if (!body?.op) return json({ error: 'Falta op.' }, 400)

    if (body.op === 'log_dossier') {
      if (env.DB && body.dossier) {
        ctx.waitUntil(
          env.DB.prepare('INSERT INTO dossiers (ts, run_id, input, json) VALUES (?, ?, ?, ?)')
            .bind(new Date().toISOString(), body.runId ?? null, body.dossier.input ?? null, JSON.stringify(body.dossier))
            .run(),
        )
      }
      return json({ ok: true })
    }

    const started = Date.now()
    const request_ = JSON.stringify(body)
    try {
      const result = await handleOp(body, env)
      ctx.waitUntil(logCall(env, { runId: body.runId, op: body.op, model: result.model, ms: Date.now() - started, ok: true, request: request_, response: JSON.stringify(result) }))
      return json(result)
    } catch (err) {
      ctx.waitUntil(logCall(env, { runId: body.runId, op: body.op, ms: Date.now() - started, ok: false, request: request_, error: err.message }))
      if (err instanceof Anthropic.RateLimitError) return json({ error: 'Límite de la IA alcanzado; reintenta en un momento.' }, 429)
      if (err instanceof Anthropic.APIError) return json({ error: `Error de la IA (${err.status}).` }, 502)
      return json({ error: err.message }, err.status ?? 500)
    }
  },
}
