import { useEffect, useMemo, useState } from 'react'
import { propagate, pathFromPrimary } from './engine/propagation.js'
import { reachFromStatus } from './engine/visualState.js'
import LayerList from './layers/LayerList.jsx'
import LayerCascade from './layers/LayerCascade.jsx'
import NeuralGraph from './layers/NeuralGraph.jsx'
import DetailCard from './detail/DetailCard.jsx'
import ScenarioSelector from './detail/ScenarioSelector.jsx'
import DensitySelector from './detail/DensitySelector.jsx'
import VitalsBar from './detail/VitalsBar.jsx'
import FuentesMenu from './detail/FuentesMenu.jsx'
import ImportControl from './data/ImportControl.jsx'
import defaultDataset from './data/vitamin-d.json'

const DENSITY_KEY = 'hf-density'

function initialDensity() {
  if (typeof window === 'undefined') return 'm'
  const stored = window.localStorage.getItem(DENSITY_KEY)
  return stored === 's' || stored === 'm' || stored === 'l' ? stored : 'm'
}

function aggregateReach(nodeIds, nodeReach) {
  let best = 'spared'
  for (const id of nodeIds) {
    const r = nodeReach[id] ?? 'spared'
    if (r === 'hit') return 'hit'
    if (r === 'faint') best = 'faint'
  }
  return best
}

export default function App() {
  const [density, setDensity] = useState(initialDensity)
  const [dataset, setDataset] = useState(defaultDataset)
  const scenarios = dataset.config.severityScenarios ?? []
  const [scenarioId, setScenarioId] = useState(scenarios[1]?.id ?? scenarios[0]?.id)
  const scenario = scenarios.find((s) => s.id === scenarioId) ?? scenarios[0]
  const primaryValue = scenario?.primaryValue ?? dataset.config.sliderDefault

  // Ficha A: selección global (rail de capas + muñeco).
  const [activeLayerId, setActiveLayerId] = useState(dataset.layers[0]?.id)
  const [activeNodeId, setActiveNodeId] = useState(dataset.nodes.find((n) => n.layer === dataset.layers[0]?.id)?.id ?? null)
  // Ficha B: selección independiente, solo desde el panel de subcapas.
  const [cascadeNodeId, setCascadeNodeId] = useState(null)
  const [layersView, setLayersView] = useState('capas')

  const { nodeStates, traversalOrder, converged } = useMemo(() => propagate(dataset, primaryValue), [dataset, primaryValue])

  const affectedIds = useMemo(() => new Set(traversalOrder.map((t) => t.id)), [traversalOrder])

  const nodeReach = useMemo(() => {
    const m = {}
    for (const node of dataset.nodes) {
      m[node.id] = reachFromStatus(nodeStates[node.id]?.status, affectedIds.has(node.id))
    }
    return m
  }, [dataset, nodeStates, affectedIds])

  const layerReach = useMemo(() => {
    const m = {}
    for (const layer of dataset.layers) {
      const ids = dataset.nodes.filter((n) => n.layer === layer.id).map((n) => n.id)
      m[layer.id] = aggregateReach(ids, nodeReach)
    }
    return m
  }, [dataset, nodeReach])

  const activeLayer = dataset.layers.find((l) => l.id === activeLayerId) ?? null
  const activeNode = dataset.nodes.find((n) => n.id === activeNodeId) ?? null
  const chain = activeNode ? pathFromPrimary(dataset, activeNode.id) : []

  const cascadeNode = dataset.nodes.find((n) => n.id === cascadeNodeId) ?? null
  const cascadeLayer = cascadeNode ? dataset.layers.find((l) => l.id === cascadeNode.layer) ?? null : null
  const cascadeChain = cascadeNode ? pathFromPrimary(dataset, cascadeNode.id) : []

  useEffect(() => {
    document.documentElement.dataset.density = density
    window.localStorage.setItem(DENSITY_KEY, density)
  }, [density])

  useEffect(() => {
    // Reimportar dataset reinicia la selección al primer nodo de la primera capa.
    const firstLayer = dataset.layers[0]?.id
    const firstNode = dataset.nodes.find((n) => n.layer === firstLayer)?.id ?? null
    setActiveLayerId(firstLayer)
    setActiveNodeId(firstNode)
    setCascadeNodeId(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset])

  function selectLayer(layerId) {
    setActiveLayerId(layerId)
    const current = dataset.nodes.find((n) => n.id === activeNodeId)
    if (!current || current.layer !== layerId) {
      const rep = dataset.nodes.find((n) => n.layer === layerId)
      setActiveNodeId(rep?.id ?? null)
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1 className="app__title">Human Flow architecture</h1>
        <div className="app__header-controls">
          <DensitySelector value={density} onChange={setDensity} />
          <FuentesMenu dataset={dataset} />
          <ImportControl onImport={setDataset} />
        </div>
      </header>

      <main className="app__main">
        <div className="app__toprow">
          <ScenarioSelector scenarios={scenarios} activeId={scenarioId} onChange={setScenarioId} />
          <span className="app__dataset-label" title="Dataset cargado actualmente">
            {dataset.config?.name ?? 'Dataset'}
          </span>
          <VitalsBar dataset={dataset} nodeStates={nodeStates} unit={dataset.config.unit} />
          {converged === false && (
            <span className="convergence-warning" title="El dataset tiene un ciclo de retroalimentación que no se ha estabilizado — cifras aproximadas.">
              ⚠ No converge
            </span>
          )}
        </div>

        <div className="layout">
          <div className="layout__rail">
            <LayerList layers={dataset.layers} activeLayerId={activeLayerId} layerReach={layerReach} onSelect={selectLayer} />
          </div>

          <div className={`layout__views${layersView === 'grafo' ? ' layout__views--grafo' : ''}`}>
            <div className="layout__panels">
              <div className="layout__panel">
                <p className="layout__panel-label">Resultado global — capa activa</p>
                <DetailCard
                  dataset={dataset}
                  layer={activeLayer}
                  node={activeNode}
                  nodeState={activeNode ? nodeStates[activeNode.id] : null}
                  reach={activeNode ? nodeReach[activeNode.id] : 'spared'}
                  chain={chain}
                  scenarioId={scenarioId}
                />
              </div>
              <div className="layout__panel">
                <p className="layout__panel-label">Detalle — panel de capas</p>
                <DetailCard
                  dataset={dataset}
                  layer={cascadeLayer}
                  node={cascadeNode}
                  nodeState={cascadeNode ? nodeStates[cascadeNode.id] : null}
                  reach={cascadeNode ? nodeReach[cascadeNode.id] : 'spared'}
                  chain={cascadeChain}
                  scenarioId={scenarioId}
                  emptyHint="Pincha un nodo en el panel de capas (Capas o Grafo) para ver su detalle aquí."
                />
              </div>
            </div>

            <div className="layers-panel">
              <div className="layers-panel__tabs" role="tablist">
                <button
                  type="button"
                  role="tab"
                  aria-selected={layersView === 'capas'}
                  className={`layers-panel__tab${layersView === 'capas' ? ' layers-panel__tab--active' : ''}`}
                  onClick={() => setLayersView('capas')}
                >
                  Capas
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={layersView === 'grafo'}
                  className={`layers-panel__tab${layersView === 'grafo' ? ' layers-panel__tab--active' : ''}`}
                  onClick={() => setLayersView('grafo')}
                >
                  Grafo
                </button>
              </div>

              {layersView === 'capas' ? (
                <LayerCascade layers={dataset.layers} dataset={dataset} nodeReach={nodeReach} onSelectNode={setCascadeNodeId} />
              ) : (
                <NeuralGraph
                  layers={dataset.layers}
                  dataset={dataset}
                  nodeReach={nodeReach}
                  nodeStates={nodeStates}
                  onSelectNode={setCascadeNodeId}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
