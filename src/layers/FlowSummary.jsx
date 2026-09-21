// "Corte" del panel de capas — resumen del flujo total que recorre el
// elemento analizado, a partir de `config.narrativeJourney` del propio
// dataset (ver docs/DATASET_PROMPT.md §3.1.1). Cada paso se colorea con
// el mismo sistema hit/faint/spared/contradictorio que ya usan
// LayerCascade/NeuralGraph (engine/reachMeta.js) — no se inventa una
// paleta nueva aquí. El estado se dice con TEXTO (badge + conteo), no solo
// con el color del punto.

import { countReach, labelOfReach, stateOfReach } from '../engine/reachMeta.js'
import ReachLegend from './ReachLegend.jsx'

export default function FlowSummary({ dataset, nodeReach }) {
  const name = dataset?.config?.name ?? 'Dataset'
  const steps = dataset?.config?.narrativeJourney ?? []
  const nodeById = new Map((dataset?.nodes ?? []).map((n) => [n.id, n]))
  const reachOf = (step) => nodeReach?.[step.nodeId] ?? 'spared'
  const counts = countReach(steps.map(reachOf))

  return (
    <section className="flow-summary" aria-label={`Flujo total — ${name}`}>
      <header className="flow-summary__header">
        <h2 className="flow-summary__title">Flujo total</h2>
        <span className="flow-summary__tag">{name}</span>
      </header>
      {steps.length > 0 ? <ReachLegend counts={counts} className="flow-summary__legend" /> : null}

      <div className="flow-summary__body">
        {steps.length === 0 ? (
          <p className="flow-summary__empty">
            Este dataset no trae un resumen narrativo (`config.narrativeJourney`).
          </p>
        ) : (
          <ol className="flow-summary__steps">
            {steps.map((step, i) => {
              const node = nodeById.get(step.nodeId)
              const reach = reachOf(step)
              const state = stateOfReach(reach)
              return (
                <li key={`${step.nodeId}-${i}`} className={`flow-summary__step flow-summary__step--${state}`}>
                  <span className={`flow-summary__step-badge flow-summary__step-badge--${state}`}>
                    {labelOfReach(reach)}
                  </span>
                  <span className="flow-summary__step-text">
                    {node ? <strong className="flow-summary__step-node">{node.name}. </strong> : null}
                    {step.text}
                  </span>
                </li>
              )
            })}
          </ol>
        )}
      </div>
    </section>
  )
}
