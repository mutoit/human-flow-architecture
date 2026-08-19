// Selector de tamaño de interfaz (Rev5, feedback del usuario) — S/M/L
// fija html[data-density], que a su vez escala todo styles.css vía rem
// (ver Punto 2 del plan). Mismo patrón visual que ScenarioSelector.

const OPTIONS = [
  { id: 's', label: 'S' },
  { id: 'm', label: 'M' },
  { id: 'l', label: 'L' },
]

export default function DensitySelector({ value, onChange }) {
  return (
    <div role="tablist" aria-label="Tamaño de interfaz" className="density-switch">
      {OPTIONS.map((opt) => {
        const active = opt.id === value
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`density-switch__btn${active ? ' density-switch__btn--active' : ''}`}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
