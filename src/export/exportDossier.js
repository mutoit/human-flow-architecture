// Exportación de fuentes: el dossier completo (JSON, reabrible) y un
// informe legible (Markdown / HTML) con cifras mostradas, frases usadas,
// filas rechazadas y el registro de decisiones de método (D-*).

import { DECISIONS, LAYERS, layerOf } from '../method/method.js'
import { layerSummaries, targetsOf } from '../pipeline/aggregate.js'
import { chainsOf, TOPIC_KEY } from '../pipeline/chain.js'
import { CLAIM_LABEL, DESIGN_LABEL, DIRECTION_LABEL, LAYER_STATES, LINK_LABEL, ROLE_LABEL, SPECIES_LABEL } from '../engine/stateMeta.js'

const slug = (d) => (d.input || 'dossier').toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '')
const pct = (x) => `${(x * 100).toFixed(1)} %`

function download(filename, content, mime) {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}

function paperRef(p) {
  const species = p.species.map((s) => SPECIES_LABEL[s] ?? s).join(' + ')
  return `${p.title} (${[p.year, DESIGN_LABEL[p.design] ?? p.design, species].filter(Boolean).join(', ')}) — PMID ${p.pmid} ${p.links.pubmed}`
}

/** Informe en Markdown: lo mostrado, lo usado para mostrarlo y cómo se decidió. */
export function dossierMarkdown(d) {
  const L = []
  const paper = (id) => d.papers[id]
  L.push(`# Dossier — ${d.input}`, '')
  L.push(`- Fecha: ${d.createdAt}`)
  L.push(`- Consulta enviada a PubMed: \`${d.queryUsed}\` (${d.normalizedBy === 'ia' ? 'traducida por el extractor' : 'literal'})`)
  if (d.map.translation) L.push(`- Traducción de PubMed: \`${d.map.translation}\``)
  L.push(`- Tipo de tema: ${d.kind ?? 'sin clasificar'}`)
  L.push(`- Papers del tema en PubMed: ${d.map.total ?? '—'} · leídos: ${Object.keys(d.papers).length}`)
  L.push(`- Método: capas v${d.method.layers} · esquema v${d.method.schema} · decisiones v${d.method.decisions}`)
  L.push(`- Extractor: ${d.method.extractor ? `${d.method.extractor.model} (prompt v${d.method.extractor.promptVersion})` : 'no disponible — solo mapa (D-extractor)'}`)
  if (d.method.verifier) L.push(`- Segunda lectura: ${d.method.verifier.model} (prompt v${d.method.verifier.promptVersion})`)
  L.push(`- Id de ejecución (registro del servicio): ${d.runId ?? '—'}`)
  if (d.errors.length) L.push(`- Incidencias: ${d.errors.map((e) => `${e.stage}: ${e.message}`).join(' · ')}`)
  L.push('')

  L.push('## Capas (lo mostrado)', '')
  L.push('| Capa | Estado | Papers tema+capa | % del tema | Obs/esp | Consulta |', '|---|---|---|---|---|---|')
  for (const s of layerSummaries(d)) {
    const m = s.map
    L.push(
      `| ${s.layer.name} | ${LAYER_STATES[s.state].label} | ${m?.count ?? (m?.error ? 'error' : '—')} | ${m?.share != null ? pct(m.share) : '—'} | ${m?.observedExpected != null ? m.observedExpected.toFixed(2) : '—'} | \`${m?.query ?? ''}\` |`,
    )
  }
  L.push('')

  L.push('## Dianas: dirección y cifras (lo mostrado) con cada frase usada', '')
  const targets = targetsOf(d)
  if (!targets.length) L.push('_Sin filas validadas._', '')
  for (const t of targets) {
    const dirs = Object.entries(t.directions).filter(([, n]) => n).map(([k, n]) => `${n} ${DIRECTION_LABEL[k]}`).join(' · ')
    L.push(`### ${t.name} — ${t.layers.map((id) => layerOf(id)?.name).join(', ') || 'sin capa'}`, '')
    if (dirs) L.push(`Mostrado: ${dirs}`)
    for (const s of t.measureSummary) {
      const shown = s.n === 1 ? `${s.min}` : `mediana ${s.median}, rango ${s.min}–${s.max}`
      L.push(`Mostrado: ${[s.slot, s.metric].filter(Boolean).join(' · ')} = ${shown}${s.unit ? ` ${s.unit}` : ''} (n=${s.n}) — D-cifra`)
    }
    L.push('')
    for (const e of t.effects) {
      L.push(`- ${DIRECTION_LABEL[e.direction]} · ${CLAIM_LABEL[e.claim]}${e.claimForced ? ' (forzado por la frase)' : ''} · ${ROLE_LABEL[e.role]} · exposición «${e.exposure}»${e.comparator ? ` vs «${e.comparator}»` : ''} · capa ${e.layer ?? '—'} · 2.ª lectura: ${DIRECTION_LABEL[e.secondReading]}`)
      L.push(`  > [${e.sentence}] ${e.quote}`)
      L.push(`  — ${paperRef(paper(e.paperId))}`)
    }
    for (const m of t.measures) {
      L.push(`- ${m.slot} = ${m.value}${m.unit ? ` ${m.unit}` : ''}${m.metric ? ` (${m.metric})` : ''}${m.group ? ` · grupo «${m.group}»` : ''} · número ${m.numberId}`)
      L.push(`  > [${m.sentence}] ${m.quote}`)
      L.push(`  — ${paperRef(paper(m.paperId))}`)
    }
    L.push('')
  }

  L.push('## Recorridos citados (D-cadena)', '')
  const chains = chainsOf(d)
  if (!chains.length) L.push('_Ningún paper leído describe una cadena._', '')
  for (const c of chains) {
    const text = c.hops
      .map((h, i) => `${i === 0 ? (h.from === TOPIC_KEY ? d.queryUsed : h.fromName) : ''} —${(h.kind === 'efecto' ? DIRECTION_LABEL : LINK_LABEL)[h.verb]}→ ${h.toName}`)
      .join('')
    L.push(`- ${text}${c.assembled ? ' _(ensamblada entre papers)_' : ''}`)
    for (const h of c.hops) L.push(`  - «${h.row.quote}» — PMID ${h.row.paperId}`)
  }
  L.push('')

  L.push('## Papers leídos', '')
  for (const p of Object.values(d.papers)) {
    L.push(`- ${paperRef(p)} — elegido para ${layerOf(p.retrieval.layer)?.name} (${p.retrieval.bucket}, puesto ${p.retrieval.position})`)
  }
  L.push('')

  const review = [...d.rows.effects, ...d.rows.links].filter((r) => r.status === 'en_revision')
  L.push(`## En revisión: lecturas que no coinciden (${review.length}) — D-lectura-doble`, '')
  for (const r of review) {
    L.push(`- ${r.target ?? `${r.from_target} → ${r.to_target}`}: 1.ª «${r.direction}», 2.ª «${r.secondReading ?? 'sin respuesta'}» — PMID ${r.paperId}`)
    L.push(`  > [${r.sentence}] ${r.quote}`)
  }
  L.push('')

  L.push(`## Filas rechazadas por el control (${d.rejected.length})`, '')
  for (const r of d.rejected) L.push(`- ${r.type} · PMID ${r.row?.paperId ?? '—'} · ${r.row?.sentence ?? ''}: ${r.reasons.join('; ')}`)
  L.push('')

  L.push('## Decisiones de método', '')
  for (const dec of DECISIONS) {
    L.push(`### ${dec.id} — ${dec.tema}`, '', dec.decision, '')
    L.push(`- Opciones: ${dec.opciones.join(' · ')}`)
    L.push(`- Por qué: ${dec.porque}`)
    L.push(`- Estado: ${dec.estado}`)
    for (const ev of dec.evidencia) L.push(`- Fuente: [${ev.label}](${ev.url})`)
    L.push('')
  }
  L.push(`_Capas y descriptores MeSH: ${LAYERS.map((l) => `${l.name} = ${l.mesh.join(' / ')}`).join('; ')}._`)
  return L.join('\n')
}

const escapeHtml = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

/** Markdown mínimo → HTML (encabezados, listas, citas, tablas, enlaces). */
function mdToHtml(md) {
  const inline = (t) =>
    escapeHtml(t)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      .replace(/_([^_]+)_/g, '<em>$1</em>')
      .replace(/(https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/\d+\/)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>')
  return md
    .split('\n')
    .map((line) => {
      if (/^### /.test(line)) return `<h3>${inline(line.slice(4))}</h3>`
      if (/^## /.test(line)) return `<h2>${inline(line.slice(3))}</h2>`
      if (/^# /.test(line)) return `<h1>${inline(line.slice(2))}</h1>`
      if (/^\|---/.test(line)) return ''
      if (/^\|/.test(line)) return `<div class="row">${line.split('|').slice(1, -1).map((c) => `<span>${inline(c.trim())}</span>`).join('')}</div>`
      if (/^ {2}> /.test(line)) return `<blockquote>${inline(line.slice(4))}</blockquote>`
      if (/^ {2}- /.test(line)) return `<p class="sub">${inline(line.slice(4))}</p>`
      if (/^ {2}— /.test(line)) return `<p class="cite">${inline(line.slice(2))}</p>`
      if (/^- /.test(line)) return `<p class="li">${inline(line.slice(2))}</p>`
      return line.trim() ? `<p>${inline(line)}</p>` : ''
    })
    .join('\n')
}

export function openReport(d) {
  const html = `<!doctype html><html lang="es"><head><meta charset="UTF-8" /><title>Fuentes — ${escapeHtml(d.input)}</title>
<style>
body{margin:0;padding:2rem;max-width:62rem;background:#0c0c0b;color:#eceae4;font:15px/1.6 'Segoe UI',sans-serif}
h1{font-size:1.5rem}h2{margin-top:2rem;font-size:1.1rem;color:#d4af37}h3{font-size:.95rem;margin-top:1.25rem}
a{color:#eceae4}a:hover{color:#d4af37}code{font-size:.8em;color:#9a968c;word-break:break-all}
blockquote{margin:.2rem 0 .2rem 1rem;padding-left:.75rem;border-left:2px solid #3f3d38;color:#eceae4;font-style:italic}
.cite,.sub{margin:.1rem 0 .1rem 1rem;color:#9a968c;font-size:.85rem}.li{margin:.5rem 0 0}
.row{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:.5rem;font-size:.8rem;border-bottom:1px solid #1b1b18;padding:.25rem 0}
</style></head><body>${mdToHtml(dossierMarkdown(d))}</body></html>`
  const url = URL.createObjectURL(new Blob([html], { type: 'text/html' }))
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

export const downloadReport = (d) => download(`${slug(d)}-fuentes.md`, dossierMarkdown(d), 'text/markdown')
export const downloadDossier = (d) => download(`${slug(d)}.dossier.json`, JSON.stringify(d, null, 2), 'application/json')
