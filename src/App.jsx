import { useEffect, useMemo, useRef, useState } from 'react'
import GraphCanvas from './graph/GraphCanvas.jsx'
import DetailPanel from './graph/DetailPanel.jsx'
import ImportControl from './graph/ImportControl.jsx'
import { propagate } from './engine/propagation.js'
import defaultDataset from './data/vitamin-d.json'

const VARIANTS = [
  { id: 'particles', label: 'Partículas' },
  { id: 'pulse', label: 'Pulso' },
  { id: 'combined', label: 'Combinado' },
]

const PLAY_DURATION_MS = 5000

export default function App() {
  const [dataset, setDataset] = useState(defaultDataset)
  const [primaryValue, setPrimaryValue] = useState(defaultDataset.config.sliderDefault)
  const [variant, setVariant] = useState('particles')
  const [selectedNodeId, setSelectedNodeId] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playRevealedIds, setPlayRevealedIds] = useState(new Set())
  const playTimeouts = useRef([])

  const { nodeStates, traversalOrder } = useMemo(() => propagate(dataset, primaryValue), [dataset, primaryValue])

  const affectedIds = useMemo(() => new Set(traversalOrder.map((t) => t.id)), [traversalOrder])

  const activeNodeIds = isPlaying ? playRevealedIds : affectedIds

  const selectedNode = dataset.nodes.find((n) => n.id === selectedNodeId) ?? null

  useEffect(() => {
    // Cambiar de dataset o reimportar limpia la selección y para el play.
    setSelectedNodeId(null)
    stopPlay()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataset])

  function stopPlay() {
    playTimeouts.current.forEach(clearTimeout)
    playTimeouts.current = []
    setIsPlaying(false)
    setPlayRevealedIds(new Set())
  }

  function handlePlay() {
    stopPlay()
    if (traversalOrder.length === 0) return
    setIsPlaying(true)
    const maxLag = Math.max(1, ...traversalOrder.map((t) => t.cumulativeLagHours))
    const revealed = new Set()
    traversalOrder.forEach((step) => {
      const delay = (step.cumulativeLagHours / maxLag) * PLAY_DURATION_MS
      const timeout = setTimeout(() => {
        revealed.add(step.id)
        setPlayRevealedIds(new Set(revealed))
      }, delay)
      playTimeouts.current.push(timeout)
    })
    const endTimeout = setTimeout(() => setIsPlaying(false), PLAY_DURATION_MS + 400)
    playTimeouts.current.push(endTimeout)
  }

  return (
    <div className="app">
      <header className="app__topbar">
        <h1 className="app__title">Biophysical Flow Mapper</h1>

        <div className="app__control">
          <label htmlFor="primary-slider">
            {dataset.config.primaryVariable}: <strong>{primaryValue}</strong> {dataset.config.unit}
          </label>
          <input
            id="primary-slider"
            type="range"
            min={dataset.config.sliderMin}
            max={dataset.config.sliderMax}
            value={primaryValue}
            onChange={(e) => {
              stopPlay()
              setPrimaryValue(Number(e.target.value))
            }}
          />
        </div>

        <div className="app__control">
          <span>Flujo:</span>
          {VARIANTS.map((v) => (
            <button
              key={v.id}
              className={`app__variant-btn${variant === v.id ? ' app__variant-btn--active' : ''}`}
              onClick={() => setVariant(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>

        <button className="app__play-btn" onClick={isPlaying ? stopPlay : handlePlay}>
          {isPlaying ? '■ Detener' : '▶ Play'}
        </button>

        <ImportControl onImport={setDataset} />
      </header>

      <main className="app__main">
        <GraphCanvas
          dataset={dataset}
          nodeStates={nodeStates}
          variant={variant}
          selectedNodeId={selectedNodeId}
          activeNodeIds={activeNodeIds}
          onSelectNode={setSelectedNodeId}
        />
        <DetailPanel
          dataset={dataset}
          node={selectedNode}
          state={selectedNode ? nodeStates[selectedNode.id] : null}
          onClose={() => setSelectedNodeId(null)}
        />
      </main>
    </div>
  )
}
