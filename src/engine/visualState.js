// Puerto generalizado de GROK/src/lib/visual-state.ts.
//
// `reach` se deriva del lookup de findings (propagation.resolveNodeState):
// - sin findings (state null) → 'spared'
// - state 'critical' → 'hit'
// - state 'contradictorio' → 'contradictorio' (4º valor, no es un juicio clínico)
// - state 'alert'|'normal' → 'faint'

/** @typedef {'hit'|'faint'|'spared'|'contradictorio'} ReachKind */
/** @typedef {'ahead'|'active'|'passed'|'faint'|'spared'} Visual */

/** @param {{state: string|null}|null|undefined} nodeState @returns {ReachKind} */
export function reachFromState(nodeState) {
  const state = nodeState?.state
  if (!state) return 'spared'
  if (state === 'contradictorio') return 'contradictorio'
  if (state === 'critical') return 'hit'
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
  if (reach === 'faint' || reach === 'contradictorio') return 'faint'
  if (!settled) return stepIndex === playIndex ? 'active' : 'ahead'
  return stepIndex === playIndex ? 'active' : 'passed'
}
