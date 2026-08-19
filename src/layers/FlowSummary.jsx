// "Corte" del panel de capas — resumen del flujo total que recorre el
// elemento analizado, a partir de `config.narrativeJourney` del propio
// dataset (ver docs/DATASET_PROMPT.md §3.1.1). Cada paso se colorea con
// el mismo sistema hit/faint/spared/contradictorio que ya usan
// LayerCascade/NeuralGraph — no se inventa una paleta nueva aquí.

const REACH_TO_STATE = { hit: 'on', faint: 'soft', spared: 'off', contradictorio: 'split' }

export default function FlowSummary({ dataset, nodeReach }) {
  const name = dataset?.config?.name ?? 'Dataset'
  const steps = dataset?.config?.narrativeJourney ?? []
  const nodeById = new Map((dataset?.nodes ?? []).map((n) => [n.id, n]))

  return (
    <section className="flow-summary" aria-label={`Flujo total — ${name}`}>
      <header className="flow-summary__header">
        <h2 className="flow-summary__title">Flujo total</h2>
        <span className="flow-summary__tag">{name}</span>
      </header>

      <div className="flow-summary__body">
        {steps.length === 0 ? (
          <p className="flow-summary__empty">
            Este dataset no trae un resumen narrativo (`config.narrativeJourney`).
          </p>
        ) : (
          <ol className="flow-summary__steps">
            {steps.map((step, i) => {
              const node = nodeById.get(step.nodeId)
              const reach = nodeReach?.[step.nodeId] ?? 'spared'
              const state = REACH_TO_STATE[reach] ?? 'off'
              return (
                <li key={`${step.nodeId}-${i}`} className={`flow-summary__step flow-summary__step--${state}`}>
                  <span className="flow-summary__step-dot" />
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
