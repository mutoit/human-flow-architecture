import { useRef, useState } from 'react'

const FINDING_STATES = new Set(['normal', 'alert', 'critical'])
const EVIDENCE_TIERS = new Set(['meta-analysis', 'rct', 'cohort', 'case-report', 'expert-opinion'])
const STRENGTH_LABELS = new Set(['fuerte', 'moderada', 'débil'])

function citationError(citation, where) {
  if (!citation || typeof citation !== 'object') return `${where}: "citation" debe ser un objeto.`
  if (!citation.pmid && !citation.url) return `${where}: citation necesita "pmid" o "url".`
  if (citation.evidenceTier && !EVIDENCE_TIERS.has(citation.evidenceTier)) {
    return `${where}: evidenceTier inválido ("${citation.evidenceTier}").`
  }
  return null
}

/**
 * P: objeto JSON parseado.
 * Q: null si el shape es findings/cascada; string de error si es inválido
 *    o si trae el esquema viejo (threshold/symptomsBySeverity/references planos).
 */
export function validateDataset(dataset) {
  if (!dataset || typeof dataset !== 'object') return 'JSON inválido: se esperaba un objeto.'
  if (!Array.isArray(dataset.layers) || dataset.layers.length === 0) return 'Falta "layers" (array no vacío).'
  if (!Array.isArray(dataset.nodes) || dataset.nodes.length === 0) return 'Falta "nodes" (array no vacío).'
  if (!Array.isArray(dataset.edges)) return 'Falta "edges" (array).'

  const scenarios = dataset.config?.severityScenarios
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return 'Falta config.severityScenarios (array no vacío de escenarios discretos).'
  }
  const scenarioIds = new Set()
  for (const sc of scenarios) {
    if (!sc?.id) return 'Escenario sin "id".'
    if (scenarioIds.has(sc.id)) return `Id de escenario duplicado: "${sc.id}".`
    scenarioIds.add(sc.id)
  }

  const layerIds = new Set(dataset.layers.map((l) => l.id))
  const nodeIds = new Set()
  for (const node of dataset.nodes) {
    if (!node.id) return 'Nodo sin "id".'
    if (nodeIds.has(node.id)) return `Id de nodo duplicado: "${node.id}".`
    nodeIds.add(node.id)
    if (!layerIds.has(node.layer)) return `Nodo "${node.id}" referencia layer inexistente: ${node.layer}.`
    if ('thresholdMin' in node || 'thresholdMax' in node) {
      return `Nodo "${node.id}": esquema antiguo (thresholdMin/Max). Usa findings[scenarioId].`
    }
    if ('symptomsBySeverity' in node) {
      return `Nodo "${node.id}": symptomsBySeverity ya no se usa. Mueve los signos a findings.`
    }
    if ('references' in node) {
      return `Nodo "${node.id}": references[] plano ya no se usa. Las citas van en finding.citation.`
    }
    if (!node.findings || typeof node.findings !== 'object' || Array.isArray(node.findings)) {
      return `Nodo "${node.id}" necesita "findings" (objeto scenarioId → array).`
    }
    for (const [key, list] of Object.entries(node.findings)) {
      if (!scenarioIds.has(key)) {
        return `Nodo "${node.id}": findings["${key}"] no coincide con ningún scenarioId.`
      }
      if (!Array.isArray(list)) return `Nodo "${node.id}": findings["${key}"] debe ser un array.`
      for (let i = 0; i < list.length; i++) {
        const finding = list[i]
        const where = `Nodo "${node.id}" findings["${key}"][${i}]`
        if (!finding || typeof finding !== 'object') return `${where}: se esperaba un objeto.`
        if (!FINDING_STATES.has(finding.state)) {
          return `${where}: "state" debe ser normal, alert o critical.`
        }
        if (!finding.summary || typeof finding.summary !== 'string') {
          return `${where}: falta "summary".`
        }
        if (finding.citation) {
          const err = citationError(finding.citation, where)
          if (err) return err
        }
      }
    }
  }

  for (const edge of dataset.edges) {
    if (!nodeIds.has(edge.from)) return `Edge con "from" inexistente: "${edge.from}".`
    if (!nodeIds.has(edge.to)) return `Edge con "to" inexistente: "${edge.to}".`
    if (edge.strength != null && !STRENGTH_LABELS.has(edge.strength)) {
      const n = Number(edge.strength)
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        return `Edge ${edge.from}→${edge.to}: strength debe ser 0–1 o fuerte/moderada/débil.`
      }
    }
    if (edge.citation) {
      const err = citationError(edge.citation, `Edge ${edge.from}→${edge.to}`)
      if (err) return err
    }
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
