import { useMemo, useState, useEffect, useCallback } from 'react'
import { runTopic } from './pipeline/run.js'
import { layerSummaries, targetsOf } from './pipeline/aggregate.js'
import { chainsOf } from './pipeline/chain.js'
import { graphOf } from './pipeline/graph.js'
import { extractorAvailable } from './pipeline/extractor.js'
import { LAYER_STATE_ORDER } from './engine/stateMeta.js'
import TopicSearch from './search/TopicSearch.jsx'
import LayerList from './layers/LayerList.jsx'
import LayerCascade from './layers/LayerCascade.jsx'
import NeuralGraph from './layers/NeuralGraph.jsx'
import PipelineView from './layers/PipelineView.jsx'
import StateLegend from './layers/StateLegend.jsx'
import LayerDetail from './detail/LayerDetail.jsx'
import TargetDetail from './detail/TargetDetail.jsx'
import DensitySelector from './detail/DensitySelector.jsx'
import FuentesMenu from './export/FuentesMenu.jsx'
import DossierImport from './export/DossierImport.jsx'

const DENSITY_KEY = 'hf-density'

function initialDensity() {
  try {
    const stored = window.localStorage.getItem(DENSITY_KEY)
    return stored === 's' || stored === 'l' ? stored : 'm'
  } catch {
    return 'm'
  }
}

/** Primera capa con más información: efecto > literatura > resto. */
function bestLayer(summaries) {
  for (const state of LAYER_STATE_ORDER) {
    const hit = summaries.find((s) => s.state === state)
    if (hit) return hit.layer.id
  }
  return summaries[0]?.layer.id ?? null
}

function Empty() {
  return (
    <div className="empty-state">
      <h2 className="empty-state__title">Busca un tema para ver por qué capas del cuerpo pasa</h2>
      <p>
        La app cuenta en PubMed cuánta literatura une el tema con cada una de las 13 capas, lee revisiones y estudios de
        cada capa y enseña solo frases literales de esos papers, validadas una a una. Nada está escrito a mano.
      </p>
      <p>
        Todo lo que ves —y cómo se decidió mostrarlo— se exporta desde <b>Fuentes</b>.
        {extractorAvailable() ? '' : ' Sin servicio extractor configurado solo se verá el mapa de literatura (etapa 1).'}
      </p>
    </div>
  )
}

export default function App() {
  const [density, setDensity] = useState(initialDensity)
  const [dossier, setDossier] = useState(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState(null)
  const [activeLayerId, setActiveLayerId] = useState(null)
  const [activeTargetKey, setActiveTargetKey] = useState(null)
  const [view, setView] = useState('recorrido')

  useEffect(() => {
    document.documentElement.dataset.density = density
    try {
      window.localStorage.setItem(DENSITY_KEY, density)
    } catch {
      /* sin almacenamiento */
    }
  }, [density])

  const summaries = useMemo(() => (dossier ? layerSummaries(dossier) : []), [dossier])
  const targets = useMemo(() => (dossier ? targetsOf(dossier) : []), [dossier])
  const chains = useMemo(() => (dossier ? chainsOf(dossier) : []), [dossier])
  const graph = useMemo(() => (dossier ? graphOf(dossier, targets) : null), [dossier, targets])

  const loadDossier = useCallback((d) => {
    setDossier(d)
    setActiveTargetKey(null)
    setActiveLayerId((current) => current ?? bestLayer(layerSummaries(d)))
  }, [])

  async function search(topic) {
    setBusy(true)
    setActiveLayerId(null)
    setActiveTargetKey(null)
    try {
      const final = await runTopic(topic, (d, p) => {
        setDossier(d)
        setProgress(p)
      })
      setDossier(final)
      setActiveLayerId(bestLayer(layerSummaries(final)))
      const errors = final.errors.map((e) => e.message).join(' · ')
      setProgress((p) => ({ ...p, message: errors ? `${p?.message ?? ''} Incidencias: ${errors}` : p?.message }))
    } finally {
      setBusy(false)
    }
  }

  const activeIndex = summaries.findIndex((s) => s.layer.id === activeLayerId)
  const activeSummary = summaries[activeIndex] ?? null
  const activeTarget = targets.find((t) => t.key === activeTargetKey) ?? null
  const counts = Object.fromEntries(LAYER_STATE_ORDER.map((k) => [k, summaries.filter((s) => s.state === k).length]))

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Human Flow architecture</h1>
        <TopicSearch busy={busy} progress={progress} onSearch={search} />
        <div className="app__header-controls">
          <DensitySelector value={density} onChange={setDensity} />
          <FuentesMenu dossier={dossier} />
          <DossierImport onImport={loadDossier} />
        </div>
      </header>

      <main className="app__main">
        {!dossier ? (
          <Empty />
        ) : (
          <>
            <div className="app__toprow">
              <span className="app__dataset-label" title={dossier.map.translation ?? ''}>
                «{dossier.input}» → <code>{dossier.queryUsed}</code> · {dossier.map.total?.toLocaleString('es') ?? '—'} papers en
                PubMed · {Object.keys(dossier.papers).length} leídos
              </span>
              <StateLegend counts={counts} />
            </div>

            <div className="layout">
              <div className="layout__rail">
                <LayerList summaries={summaries} activeLayerId={activeLayerId} onSelect={setActiveLayerId} />
              </div>

              <div className="layout__views">
                <div className="layout__panels">
                  <div className="layout__panel">
                    <LayerDetail summary={activeSummary} index={activeIndex} activeTargetKey={activeTargetKey} onSelectTarget={setActiveTargetKey} />
                  </div>
                  <div className="layout__panel">
                    <TargetDetail target={activeTarget} dossier={dossier} chains={chains} />
                  </div>
                </div>

                <div className="layers-panel">
                  <div className="layers-panel__tabs" role="tablist">
                    {[
                      ['recorrido', 'Recorrido'],
                      ['capas', 'Capas'],
                      ['grafo', 'Grafo'],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        aria-selected={view === id}
                        className={`layers-panel__tab${view === id ? ' layers-panel__tab--active' : ''}`}
                        onClick={() => setView(id)}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {view === 'recorrido' ? (
                    <PipelineView chains={chains} dossier={dossier} onSelectTarget={setActiveTargetKey} />
                  ) : view === 'capas' ? (
                    <LayerCascade summaries={summaries} activeTargetKey={activeTargetKey} onSelectTarget={setActiveTargetKey} />
                  ) : (
                    <NeuralGraph graph={graph} onSelectNode={setActiveTargetKey} />
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
