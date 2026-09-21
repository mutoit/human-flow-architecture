// Fuente ÚNICA de cómo se nombra y se explica cada estado de un nodo.
// `reach` sale de visualState.reachFromState (hit|faint|spared|contradictorio);
// `state` es la clave de CSS/canvas (on|soft|off|split). Grafo, cascada,
// flujo total, ficha y leyenda leen de aquí — no hay otra tabla copiada.

/** @typedef {'hit'|'faint'|'spared'|'contradictorio'} ReachKind */

export const REACH_ORDER = ['hit', 'faint', 'contradictorio', 'spared']

export const REACH_META = {
  hit: {
    state: 'on',
    label: 'Activo',
    plural: 'activos',
    desc: 'El escenario elegido lo golpea de forma crítica.',
  },
  faint: {
    state: 'soft',
    label: 'Rozado',
    plural: 'rozados',
    desc: 'Hay hallazgos en este escenario, pero no críticos (alerta o normal).',
  },
  contradictorio: {
    state: 'split',
    label: 'Contradictorio',
    plural: 'contradictorios',
    desc: 'Los hallazgos de este escenario se contradicen entre sí.',
  },
  spared: {
    state: 'off',
    label: 'Apagado',
    plural: 'apagados',
    desc: 'Sin hallazgos en este escenario: el flujo no llega hasta aquí.',
  },
}

export const stateOfReach = (reach) => (REACH_META[reach] ?? REACH_META.spared).state
export const labelOfReach = (reach) => (REACH_META[reach] ?? REACH_META.spared).label

// Matiz por capa anatómica (catálogo cerrado de 7 `anatomyId`, no por
// dataset): sangre=rojo, órganos=ámbar, hueso=dorado, linfático=verde,
// piel=rosa, nervioso=violeta, sentidos=cian.
export const LAYER_HUE = {
  sangre: 6,
  organos: 30,
  hueso: 45,
  linfatico: 150,
  piel: 335,
  nervioso: 265,
  sentidos: 200,
}
export const DEFAULT_HUE = 40
export const SPLIT_HUE = 280

export const hueOfAnatomy = (anatomyId) => LAYER_HUE[anatomyId] ?? DEFAULT_HUE

/** Cuenta cuántos de `reaches` caen en cada estado. */
export function countReach(reaches) {
  const c = { hit: 0, faint: 0, contradictorio: 0, spared: 0 }
  for (const r of reaches) c[REACH_META[r] ? r : 'spared']++
  return c
}

// Del más débil al más fuerte: la capa "hereda" el estado más alto de sus nodos.
const REACH_RANK = { spared: 0, faint: 1, contradictorio: 2, hit: 3 }

/** Estado más fuerte de una lista de `reach` (spared si está vacía). */
export function strongestReach(reaches) {
  let best = 'spared'
  for (const r of reaches) if ((REACH_RANK[r] ?? 0) > REACH_RANK[best]) best = r
  return best
}
