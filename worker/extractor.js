// Servicio extractor: recibe papers (id + título/abstract) y devuelve filas
// del esquema fijo. La IA PROPONE; la app valida cada fila con un control
// mecánico (src/pipeline/gate.js) antes de mostrarla. Enums y huecos salen
// del mismo archivo que usa la app (src/method/schema.json).

import Anthropic from '@anthropic-ai/sdk'
import schema from '../src/method/schema.json'

const MODEL = 'claude-opus-5'
const PROMPT_VERSION = '1'
const keys = (o) => Object.keys(o)

const nullable = (s) => ({ anyOf: [s, { type: 'null' }] })
const obj = (properties) => ({ type: 'object', properties, required: Object.keys(properties), additionalProperties: false })

function rowsSchema(layerIds, slots) {
  const common = { paperId: { type: 'string' }, quote: { type: 'string' } }
  return obj({
    effects: {
      type: 'array',
      items: obj({
        ...common,
        target: { type: 'string' },
        layer: { enum: [...layerIds, 'ninguna'] },
        role: { enum: keys(schema.roles) },
        predicate: { enum: keys(schema.predicates) },
        level: { enum: schema.levels },
        evidence_kind: { enum: keys(schema.evidenceKinds) },
      }),
    },
    measures: {
      type: 'array',
      items: obj({
        ...common,
        target: { type: 'string' },
        layer: { enum: [...layerIds, 'ninguna'] },
        slot: { enum: slots },
        value: { type: 'number' },
        unit: nullable({ type: 'string' }),
        metric: nullable({ enum: schema.effectSizeMetrics }),
        timepoint: nullable({ type: 'string' }),
      }),
    },
    links: {
      type: 'array',
      items: obj({
        ...common,
        from_target: { type: 'string' },
        to_target: { type: 'string' },
        from_layer: { enum: [...layerIds, 'ninguna'] },
        to_layer: { enum: [...layerIds, 'ninguna'] },
        predicate: { enum: keys(schema.linkPredicates) },
      }),
    },
  })
}

const describe = (o) => Object.entries(o).map(([k, v]) => `- ${k}: ${v}`).join('\n')

const EXTRACT_SYSTEM = `Eres un extractor de datos de literatura biomédica. Rellenas un formulario fijo; no resumes ni opinas.

Reglas duras:
1. "quote" es una frase COPIADA LITERALMENTE del texto del paper (misma ortografía). Si no puedes copiarla literal, no escribas la fila.
2. "target" es la diana tal como aparece escrita en esa frase (p. ej. "serum LDL cholesterol"). Todas sus palabras deben estar en la quote.
3. Solo lo que el texto afirma. Si el paper no lo dice, no hay fila. No completes con conocimiento propio.
4. Cifras: "value" es un número que aparece tal cual en la quote; "unit" tal como aparece en la quote. Solo los huecos permitidos.
5. Un eslabón (links) solo si UNA frase afirma que A cambia B.
6. "layer": la capa del cuerpo de la diana; "ninguna" si no corresponde a ninguna.
7. Nunca inventes paperId: usa el id que acompaña a cada texto.

Rol del tema respecto a la diana:
${describe(schema.roles)}

Dirección del efecto:
${describe(schema.predicates)}

Verbos de eslabón:
${describe(schema.linkPredicates)}

Tipo de evidencia:
${describe(schema.evidenceKinds)}

Nivel biológico: ${schema.levels.join(', ')}.`

const NORMALIZE_SYSTEM = `Conviertes el tema que escribe un usuario (en cualquier idioma) en una consulta de PubMed en inglés y clasificas el tipo de tema.
- query_en: términos en inglés, preferentemente el término MeSH si existe; sin operadores inventados.
- kind: uno de ${schema.kinds.join(', ')}.`

const cors = (env) => ({
  'Access-Control-Allow-Origin': env.ALLOWED_ORIGIN ?? '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
})

const json = (env, body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json', ...cors(env) } })

async function structured(client, system, user, outSchema) {
  const response = await client.beta.messages.create({
    model: MODEL,
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

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors(env) })
    if (request.method !== 'POST') return json(env, { error: 'Solo POST.' }, 405)

    const body = await request.json().catch(() => null)
    if (!body?.op) return json(env, { error: 'Falta op.' }, 400)
    const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY })

    try {
      if (body.op === 'normalize') {
        const { data, model } = await structured(
          client,
          NORMALIZE_SYSTEM,
          String(body.query ?? '').slice(0, 300),
          obj({ query_en: { type: 'string' }, kind: { enum: schema.kinds } }),
        )
        return json(env, { ...data, model, promptVersion: PROMPT_VERSION })
      }

      if (body.op === 'extract') {
        const papers = (body.papers ?? []).slice(0, 5)
        const layerIds = (body.layers ?? []).map((l) => l.id)
        const slots = (body.slots ?? []).filter((s) => Object.values(schema.slots).flat().includes(s))
        const user = [
          `Tema: ${body.topic}`,
          `Tipo de tema: ${body.kind ?? 'desconocido'}`,
          `Capas: ${(body.layers ?? []).map((l) => `${l.id} (${l.name})`).join(', ')}`,
          `Huecos de cifra permitidos: ${slots.join(', ') || 'ninguno'}`,
          '',
          ...papers.map((p) => `<paper id="${p.id}">\n${p.text}\n</paper>`),
        ].join('\n')
        const { data, model } = await structured(client, EXTRACT_SYSTEM, user, rowsSchema(layerIds, slots.length ? slots : ['n']))
        return json(env, { rows: data, model, promptVersion: PROMPT_VERSION })
      }

      return json(env, { error: `op desconocida: ${body.op}` }, 400)
    } catch (err) {
      if (err instanceof Anthropic.RateLimitError) return json(env, { error: 'Límite de la IA alcanzado; reintenta en un momento.' }, 429)
      if (err instanceof Anthropic.APIError) return json(env, { error: `Error de la IA (${err.status}).` }, 502)
      return json(env, { error: err.message }, 500)
    }
  },
}
