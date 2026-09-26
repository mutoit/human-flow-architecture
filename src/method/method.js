// Fuente única del método: capas, esquema de extracción y registro de
// decisiones. Todo lo que la app muestra o exporta sale de estos tres
// archivos versionados; el código no repite ninguna de estas listas.

import layersFile from './layers.json' with { type: 'json' }
import schema from './schema.json' with { type: 'json' }
import decisionsFile from './decisions.json' with { type: 'json' }

export const LAYERS = layersFile.layers
export const SCHEMA = schema
export const DECISIONS = decisionsFile.decisions

export const METHOD_VERSION = {
  layers: layersFile.version,
  schema: schema.version,
  decisions: decisionsFile.version,
}

const layerById = new Map(LAYERS.map((l) => [l.id, l]))
export const layerOf = (id) => layerById.get(id) ?? null

/** Consulta PubMed del sistema: descriptores MeSH de la capa unidos con OR. */
export const layerMeshQuery = (layer) => `(${layer.mesh.map((d) => `"${d}"[Mesh]`).join(' OR ')})`

/** Huecos de cifra permitidos para un tipo de tema. */
export const slotsFor = (kind) => [...SCHEMA.slots.comun, ...(SCHEMA.slots[kind] ?? [])]
