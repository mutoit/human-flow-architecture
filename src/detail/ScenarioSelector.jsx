// Puerto de GROK/src/components/severity-switch.tsx, alimentado por
// config.severityScenarios (spec §2) en vez de una lista fija de 2.

export default function ScenarioSelector({ scenarios, activeId, onChange }) {
  return (
    <div role="tablist" aria-label="Escenario de carencia" className="scenario-switch">
      {scenarios.map((sc) => {
        const active = sc.id === activeId
        return (
          <button
            key={sc.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(sc.id)}
            className={`scenario-switch__btn${active ? ' scenario-switch__btn--active' : ''}`}
          >
            <span className="scenario-switch__label">{sc.label}</span>
            {sc.range && <span className="scenario-switch__range">{sc.range}</span>}
          </button>
        )
      })}
    </div>
  )
}
