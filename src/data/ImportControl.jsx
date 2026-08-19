import { useEffect, useRef, useState } from 'react'

const FINDING_STATES = new Set(['normal', 'alert', 'critical'])
const EVIDENCE_TIERS = new Set([
  'meta-analysis',
  'systematic-review',
  'rct',
  'cohort',
  'case-report',
  'expert-opinion',
])
const STRENGTH_LABELS = new Set(['fuerte', 'moderada', 'débil'])

// citation.evidenceTier inválido es SOFT (aviso, no bloquea): el campo es
// puramente decorativo — "solo ordena la ficha, nunca desempata el estado"
// (docs/DATASET_PROMPT.md §3.4). Se elimina y se avisa, en vez de tumbar
// todo el dataset por un campo que no afecta a la lógica. No se adivina un
// valor de reemplazo — eso exige leer la cita real (revisión humana).
function sanitizeCitation(citation, where, warnings) {
  if (!citation || typeof citation !== 'object') return citation
  if (citation.evidenceTier && !EVIDENCE_TIERS.has(citation.evidenceTier)) {
    warnings.push(
      `${where}: evidenceTier inválido ("${citation.evidenceTier}") — se ha quitado. ` +
        `Revisa la cita y ponle "systematic-review"/"expert-opinion" a mano si aplica.`
    )
    const { evidenceTier, ...rest } = citation
    return rest
  }
  return citation
}

function citationError(citation, where) {
  if (!citation || typeof citation !== 'object') return `${where}: "citation" debe ser un objeto.`
  if (!citation.pmid && !citation.url) return `${where}: citation necesita "pmid" o "url".`
  return null
}

/**
 * P: objeto JSON parseado.
 * Q: { error, warnings, sanitized }.
 *    error: string si el shape es inválido de forma estructural (bloquea
 *    el import — ids duplicados, layer/edge inexistente, esquema viejo...)
 *    o null si pasa. warnings: campos blandos corregidos sin bloquear
 *    (ver sanitizeCitation). sanitized: dataset con esos campos limpiados,
 *    listo para importar si error es null.
 */
export function validateDataset(dataset) {
  const warnings = []
  const fail = (error) => ({ error, warnings, sanitized: null })

  if (!dataset || typeof dataset !== 'object') return fail('JSON inválido: se esperaba un objeto.')
  if (!Array.isArray(dataset.layers) || dataset.layers.length === 0) return fail('Falta "layers" (array no vacío).')
  if (!Array.isArray(dataset.nodes) || dataset.nodes.length === 0) return fail('Falta "nodes" (array no vacío).')
  if (!Array.isArray(dataset.edges)) return fail('Falta "edges" (array).')

  const scenarios = dataset.config?.severityScenarios
  if (!Array.isArray(scenarios) || scenarios.length === 0) {
    return fail('Falta config.severityScenarios (array no vacío de escenarios discretos).')
  }
  const scenarioIds = new Set()
  for (const sc of scenarios) {
    if (!sc?.id) return fail('Escenario sin "id".')
    if (scenarioIds.has(sc.id)) return fail(`Id de escenario duplicado: "${sc.id}".`)
    scenarioIds.add(sc.id)
  }

  const layerIds = new Set(dataset.layers.map((l) => l.id))
  const nodeIds = new Set()
  const sanitizedNodes = []
  for (const node of dataset.nodes) {
    if (!node.id) return fail('Nodo sin "id".')
    if (nodeIds.has(node.id)) return fail(`Id de nodo duplicado: "${node.id}".`)
    nodeIds.add(node.id)
    if (!layerIds.has(node.layer)) return fail(`Nodo "${node.id}" referencia layer inexistente: ${node.layer}.`)
    if ('thresholdMin' in node || 'thresholdMax' in node) {
      return fail(`Nodo "${node.id}": esquema antiguo (thresholdMin/Max). Usa findings[scenarioId].`)
    }
    if ('symptomsBySeverity' in node) {
      return fail(`Nodo "${node.id}": symptomsBySeverity ya no se usa. Mueve los signos a findings.`)
    }
    if ('references' in node) {
      return fail(`Nodo "${node.id}": references[] plano ya no se usa. Las citas van en finding.citation.`)
    }
    if (!node.findings || typeof node.findings !== 'object' || Array.isArray(node.findings)) {
      return fail(`Nodo "${node.id}" necesita "findings" (objeto scenarioId → array).`)
    }
    const sanitizedFindings = {}
    for (const [key, list] of Object.entries(node.findings)) {
      if (!scenarioIds.has(key)) {
        return fail(`Nodo "${node.id}": findings["${key}"] no coincide con ningún scenarioId.`)
      }
      if (!Array.isArray(list)) return fail(`Nodo "${node.id}": findings["${key}"] debe ser un array.`)
      const sanitizedList = []
      for (let i = 0; i < list.length; i++) {
        const finding = list[i]
        const where = `Nodo "${node.id}" findings["${key}"][${i}]`
        if (!finding || typeof finding !== 'object') return fail(`${where}: se esperaba un objeto.`)
        if (!FINDING_STATES.has(finding.state)) {
          return fail(`${where}: "state" debe ser normal, alert o critical.`)
        }
        if (!finding.summary || typeof finding.summary !== 'string') {
          return fail(`${where}: falta "summary".`)
        }
        let sanitizedFinding = finding
        if (finding.citation) {
          const err = citationError(finding.citation, where)
          if (err) return fail(err)
          sanitizedFinding = { ...finding, citation: sanitizeCitation(finding.citation, where, warnings) }
        }
        sanitizedList.push(sanitizedFinding)
      }
      sanitizedFindings[key] = sanitizedList
    }
    sanitizedNodes.push({ ...node, findings: sanitizedFindings })
  }

  const sanitizedEdges = []
  for (const edge of dataset.edges) {
    if (!nodeIds.has(edge.from)) return fail(`Edge con "from" inexistente: "${edge.from}".`)
    if (!nodeIds.has(edge.to)) return fail(`Edge con "to" inexistente: "${edge.to}".`)
    if (edge.strength != null && !STRENGTH_LABELS.has(edge.strength)) {
      const n = Number(edge.strength)
      if (!Number.isFinite(n) || n < 0 || n > 1) {
        return fail(`Edge ${edge.from}→${edge.to}: strength debe ser 0–1 o fuerte/moderada/débil.`)
      }
    }
    let sanitizedEdge = edge
    if (edge.citation) {
      const err = citationError(edge.citation, `Edge ${edge.from}→${edge.to}`)
      if (err) return fail(err)
      sanitizedEdge = { ...edge, citation: sanitizeCitation(edge.citation, `Edge ${edge.from}→${edge.to}`, warnings) }
    }
    sanitizedEdges.push(sanitizedEdge)
  }

  return {
    error: null,
    warnings,
    sanitized: { ...dataset, nodes: sanitizedNodes, edges: sanitizedEdges },
  }
}

// Agrupa avisos casi-idénticos (ej. el mismo evidenceTier inválido repetido
// en 29 citas) en una línea por motivo, para no pintar un muro de texto que
// reviente el layout del header. `where` no lleva ": " nunca (ver formato
// en sanitizeCitation/citationError), así que el primer ": " separa limpio
// "dónde" de "por qué".
function groupWarnings(warnings) {
  const byReason = new Map()
  for (const w of warnings) {
    const i = w.indexOf(': ')
    const where = i === -1 ? w : w.slice(0, i)
    const reason = i === -1 ? '' : w.slice(i + 2)
    if (!byReason.has(reason)) byReason.set(reason, [])
    byReason.get(reason).push(where)
  }
  return [...byReason.entries()].map(([reason, wheres]) => ({ reason, wheres }))
}

const TOAST_MS = 10000

// Toast flotante: `position: fixed`, fuera del flujo normal — no puede
// empujar ni aplastar el layout, pase lo que pase con el contenido.
// Detalle completo (por nodo/edge) va a console.warn, nunca al DOM.
function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(onDismiss, TOAST_MS)
    return () => clearTimeout(t)
  }, [toast, onDismiss])

  if (!toast) return null
  return (
    <div className={`import-toast import-toast--${toast.kind}`} role="status">
      {toast.text}
    </div>
  )
}

export default function ImportControl({ onImport }) {
  const inputRef = useRef(null)
  const [toast, setToast] = useState(null)

  const handleFile = async (file) => {
    setToast(null)
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const result = validateDataset(parsed)
      if (result.error) {
        setToast({ kind: 'error', text: result.error })
        return
      }
      if (result.warnings.length > 0) {
        // eslint-disable-next-line no-console
        console.warn(`[ImportControl] ${result.warnings.length} avisos al importar:`)
        for (const { reason, wheres } of groupWarnings(result.warnings)) {
          // eslint-disable-next-line no-console
          console.warn(`${wheres.length}× ${reason}\n  ${wheres.join('\n  ')}`)
        }
        setToast({
          kind: 'warning',
          text: `Importado con ${result.warnings.length} aviso${result.warnings.length > 1 ? 's' : ''} — detalle en la consola.`,
        })
      }
      onImport(result.sanitized)
    } catch (err) {
      setToast({ kind: 'error', text: `No se pudo leer el JSON: ${err.message}` })
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
      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  )
}
