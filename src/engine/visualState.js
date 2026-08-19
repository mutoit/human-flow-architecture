// Puerto generalizado de GROK/src/lib/visual-state.ts (spec §8/§9).
//
// Diferencia deliberada con el original: GROK deriva `reach` de contenido
// escrito a mano por severidad. Aquí `reach` se deriva del motor real:
// - no alcanzado desde el nodo primario (fuera de `traversalOrder`) → 'spared'
// - alcanzado + status 'critical' → 'hit'
// - alcanzado + status 'warning'|'ok' → 'faint' (la onda llega, sin ser crítico)
// needs verification: este mapeo se valida con datos reales del dataset
// (spec Rev4 §8), no es una regla biológica fija.

/** @typedef {'hit'|'faint'|'spared'} ReachKind */
/** @typedef {'ahead'|'active'|'passed'|'faint'|'spared'} Visual */

/** @param {import('./propagation.js').NodeStatus} status @param {boolean} isAffected @returns {ReachKind} */
export function reachFromStatus(status, isAffected) {
  if (!isAffected) return 'spared'
  if (status === 'critical') return 'hit'
  return 'faint'
}

export const LAYER_OPACITY = {
  active: 1,
  passed: 0.14,
  faint: 0.07,
  ahead: 0,
  spared: 0,
}

/**
 * Estado visual de un nodo dado su `reach` y, si hay auto-play en curso, su
 * posición (`stepIndex`) dentro de `traversalOrder` frente al paso actual
 * (`playIndex`).
 * @param {{reach: ReachKind, stepIndex: number|null, playIndex: number, playing: boolean, settled: boolean}} args
 * @returns {Visual}
 */
export function visualState({ reach, stepIndex, playIndex, playing, settled }) {
  if (reach === 'spared') return 'spared'
  if (playing) {
    if (stepIndex == null || stepIndex > playIndex) return 'ahead'
    if (stepIndex === playIndex) return 'active'
    return 'passed'
  }
  if (reach === 'faint') return 'faint'
  if (!settled) return stepIndex === playIndex ? 'active' : 'ahead'
  return stepIndex === playIndex ? 'active' : 'passed'
}
