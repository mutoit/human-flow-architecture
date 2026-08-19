// Agregación de citas del dataset (spec cascada §1).
// Nunca genera citas: recorre findings y edges, deduplica por pmid/url.

const TIER_ORDER = {
  'meta-analysis': 0,
  rct: 1,
  cohort: 2,
  'case-report': 3,
  'expert-opinion': 4,
}

export function evidenceTierRank(tier) {
  return TIER_ORDER[tier] ?? 9
}

function refKey(citation) {
  if (!citation) return null
  return citation.pmid ?? citation.url ?? null
}

function asEntry(citation, extra = {}) {
  return {
    pmid: citation.pmid,
    url: citation.url,
    title: citation.title,
    evidenceTier: citation.evidenceTier,
    supersededBy: citation.supersededBy,
    ...extra,
  }
}

/**
 * P: dataset con nodes[].findings[*][*].citation y edges[].citation.
 * Q: grupos por primer nodo (o edge) que citó cada clave, con claimUsage
 *    y evidenceTier si existen.
 */
export function collectReferences(dataset) {
  const seenKeys = new Set()
  const groups = []

  function pushGroup(nodeId, nodeName, entries) {
    if (entries.length === 0) return
    groups.push({ nodeId, nodeName, references: entries })
  }

  for (const node of dataset.nodes ?? []) {
    const entries = []
    for (const findings of Object.values(node.findings ?? {})) {
      if (!Array.isArray(findings)) continue
      for (const finding of findings) {
        const key = refKey(finding.citation)
        if (!key || seenKeys.has(key)) continue
        seenKeys.add(key)
        entries.push(
          asEntry(finding.citation, {
            claimUsage: finding.claimUsage,
            findingState: finding.state,
          }),
        )
      }
    }
    pushGroup(node.id, node.name, entries)
  }

  const nodeById = new Map((dataset.nodes ?? []).map((n) => [n.id, n]))
  for (const edge of dataset.edges ?? []) {
    const key = refKey(edge.citation)
    if (!key || seenKeys.has(key)) continue
    seenKeys.add(key)
    const fromName = nodeById.get(edge.from)?.name ?? edge.from
    const toName = nodeById.get(edge.to)?.name ?? edge.to
    pushGroup(`edge:${edge.from}:${edge.to}`, `${fromName} → ${toName}`, [asEntry(edge.citation)])
  }

  return groups
}

export function pubmedUrl(pmid) {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
}
