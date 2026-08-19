import { useRef, useState } from 'react'

// Validación mínima estructural (spec §2): ids únicos, edges apuntan a
// nodos existentes, layer dentro del rango declarado.
export function validateDataset(dataset) {
  if (!dataset || typeof dataset !== 'object') return 'JSON inválido: se esperaba un objeto.'
  if (!Array.isArray(dataset.layers) || dataset.layers.length === 0) return 'Falta "layers" (array no vacío).'
  if (!Array.isArray(dataset.nodes) || dataset.nodes.length === 0) return 'Falta "nodes" (array no vacío).'
  if (!Array.isArray(dataset.edges)) return 'Falta "edges" (array).'

  const layerIds = new Set(dataset.layers.map((l) => l.id))
  const nodeIds = new Set()
  for (const node of dataset.nodes) {
    if (!node.id) return 'Nodo sin "id".'
    if (nodeIds.has(node.id)) return `Id de nodo duplicado: "${node.id}".`
    nodeIds.add(node.id)
    if (!layerIds.has(node.layer)) return `Nodo "${node.id}" referencia layer inexistente: ${node.layer}.`
  }
  for (const edge of dataset.edges) {
    if (!nodeIds.has(edge.from)) return `Edge con "from" inexistente: "${edge.from}".`
    if (!nodeIds.has(edge.to)) return `Edge con "to" inexistente: "${edge.to}".`
  }
  return null
}

export default function ImportControl({ onImport }) {
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  const handleFile = async (file) => {
    setError(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const validationError = validateDataset(parsed)
      if (validationError) {
        setError(validationError)
        return
      }
      onImport(parsed)
    } catch (err) {
      setError(`No se pudo leer el JSON: ${err.message}`)
    } finally {
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <div className="import-control">
      <button className="import-control__button" onClick={() => inputRef.current?.click()}>
        Importar JSON
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="application/json"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) handleFile(file)
        }}
      />
      {error && <p className="import-control__error">{error}</p>}
    </div>
  )
}
