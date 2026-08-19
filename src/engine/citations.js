// Agregación de referencias del dataset (spec §10.2/§10.3).
// Nunca genera citas: solo recolecta las que el dataset ya trae.

/**
 * Recorre `dataset.nodes[].references`, deduplica por `pmid` (o `url` si no
 * hay pmid) y agrupa por el primer nodo que citó cada referencia.
 * @returns {Array<{nodeId:string,nodeName:string,references:Array}>}
 */
export function collectReferences(dataset) {
  const seenKeys = new Set()
  const groups = []

  for (const node of dataset.nodes ?? []) {
    const refs = (node.references ?? []).filter((ref) => {
      const key = ref.pmid ?? ref.url
      if (!key || seenKeys.has(key)) return false
      seenKeys.add(key)
      return true
    })
    if (refs.length > 0) {
      groups.push({ nodeId: node.id, nodeName: node.name, references: refs })
    }
  }

  return groups
}

export function pubmedUrl(pmid) {
  return `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
}
