// Fuente ÚNICA de cómo se nombra y se explica cada estado (decisión
// D-estado-capa). `state` es la clave visual (on|soft|off|split) que usan
// CSS y canvas; lista, grafo, fichas y leyenda leen de aquí.

export const LAYER_STATES = {
  efecto: { state: 'on', label: 'Efecto citado', desc: 'Al menos una frase de un paper, validada, describe algo en esta capa.' },
  literatura: {
    state: 'soft',
    label: 'Solo literatura',
    desc: 'PubMed tiene papers del tema en esta capa, pero ninguna frase leída se ha validado aquí. No significa «sin efecto».',
  },
  sin_literatura: { state: 'off', label: 'Sin literatura', desc: 'PubMed no tiene papers indexados con el tema y esta capa.' },
  error: { state: 'off', label: 'No consultada', desc: 'La consulta de esta capa falló; no se sabe nada de ella.' },
  pendiente: { state: 'off', label: 'Pendiente', desc: 'Aún no consultada.' },
}

export const LAYER_STATE_ORDER = ['efecto', 'literatura', 'sin_literatura', 'error']

export const DIRECTION_LABEL = { aumenta: 'aumenta', disminuye: 'disminuye', sin_efecto: 'sin efecto' }

export const CLAIM_LABEL = { causal: 'efecto', asociacion: 'asociación' }

export const ROLE_LABEL = {
  actua_sobre: 'actúa sobre',
  alterado_por: 'alterado por',
  origen: 'origen',
  marcador: 'marcador',
}

export const LINK_LABEL = { aumenta: 'aumenta', disminuye: 'disminuye', activa: 'activa', inhibe: 'inhibe', causa: 'causa' }

export const DESIGN_LABEL = {
  metaanalisis: 'Metaanálisis',
  revision_sistematica: 'Revisión sistemática',
  ensayo_aleatorizado: 'Ensayo aleatorizado',
  ensayo: 'Ensayo clínico',
  observacional: 'Observacional',
  caso_clinico: 'Caso clínico',
  revision_narrativa: 'Revisión narrativa',
  primario_sin_tipo: 'Artículo (sin tipo indexado)',
}

export const SPECIES_LABEL = { humanos: 'humanos', animales: 'animales', in_vitro: 'in vitro', no_indicada: 'especie no indexada' }

/** Signo visual de una dirección: pos | neg | neutral. */
export const signOf = (predicate) =>
  predicate === 'aumenta' || predicate === 'activa' || predicate === 'causa' ? 'pos' : predicate === 'disminuye' || predicate === 'inhibe' ? 'neg' : 'neutral'

export const stateOf = (layerState) => (LAYER_STATES[layerState] ?? LAYER_STATES.pendiente).state
export const labelOf = (layerState) => (LAYER_STATES[layerState] ?? LAYER_STATES.pendiente).label
