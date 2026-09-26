import { test } from 'node:test'
import assert from 'node:assert/strict'
import { anchor, applyVerification, buildContext, gateRows, layerOfTarget, significanceVeto, verificationItems } from '../src/pipeline/gate.js'
import { parseNumbers, segmentPaper, splitSentences } from '../src/pipeline/segment.js'
import { summarizeMeasures, targetsOf, layerState } from '../src/pipeline/aggregate.js'
import { chainsOf } from '../src/pipeline/chain.js'
import { deriveRows, emptyDossier, importDossier } from '../src/pipeline/dossier.js'
import { makePaper, designOf, speciesOf } from '../src/engine/paper.js'

const paper = makePaper({
  pmid: '111',
  title: 'Thyroid function and lipids',
  pubTypes: ['Review'],
  mesh: ['Humans'],
  sections: [
    { category: 'BACKGROUND', text: 'Previous studies suggested that hypothyroidism may increase LDL cholesterol.' },
    {
      category: 'RESULTS',
      text:
        'Overt hypothyroidism increased serum LDL cholesterol compared with euthyroid controls. ' +
        'Mean TSH was 12.5 mIU/L in untreated patients (P < .001). ' +
        'LDL was higher in controls than in hypothyroid patients. ' +
        'There was no significant difference in bone mineral density between hypothyroid patients and controls. ' +
        'Hypothyroidism was associated with increased heart rate variability. ' +
        'Reduced thyroid hormone decreases hepatic LDL receptor expression.',
    },
  ],
})
// s1 título · s2 antecedente · s3..s8 resultados
const ctx = () => buildContext({ papers: new Map([['111', paper]]), kind: 'enfermedad', topic: 'hypothyroidism' })
const eff = (over = {}) => ({ paperId: '111', sentence: 's3', exposure: 'Overt hypothyroidism', outcome: 'serum LDL cholesterol', comparator: 'euthyroid controls', direction: 'aumenta', claim: 'causal', role: 'actua_sobre', ...over })

test('segmentación: frases con sección, sin cortar en abreviaturas', () => {
  const seg = segmentPaper(paper)
  assert.deepEqual(seg.sentences.map((s) => s.section), ['TITLE', 'BACKGROUND', 'RESULTS', 'RESULTS', 'RESULTS', 'RESULTS', 'RESULTS', 'RESULTS'])
  assert.equal(splitSentences('LDL was higher vs. controls (P = .02). Smith et al. reported it. HDL did not differ, e.g. in women.').length, 3)
})

test('números: los que parecen números pero no lo son no se listan', () => {
  const vals = (s) => parseNumbers(s).map((n) => `${n.value}${n.unit ? ' ' + n.unit : ''}:${n.kind}`)
  assert.deepEqual(vals('Serum 25(OH)D was 18.2 ng/mL in 1,024 patients.'), ['18.2 ng/mL:valor', '1024:valor'])
  assert.deepEqual(vals('IL-6 rose; OR 1.45 (95% CI 1.12–1.88); WBC 7.2 ×10^9/L.'), ['1.45:valor', '1.12:ic', '1.88:ic', '7.2:valor'])
  assert.deepEqual(vals('Mean TSH was 12·5 mIU/L (P < .001).'), ['12.5 mIU/L:valor', '0.001:p'])
  assert.deepEqual(vals('HbA1c fell by −0.5%; T4 was low; COVID-19 cases.'), ['-0.5 %:valor'])
  assert.deepEqual(vals('LDL was 145 ± 32 vs 118 ± 27 mg/dL.'), ['145 mg/dL:valor', '32 mg/dL:valor', '118 mg/dL:valor', '27 mg/dL:valor'])
})

test('anclaje: el fragmento se devuelve tal como está escrito, o nada', () => {
  assert.equal(anchor('serum ldl  cholesterol', 'Overt hypothyroidism increased serum LDL cholesterol.'), 'serum LDL cholesterol')
  assert.equal(anchor('LDL', 'HDL-LDL ratio'), 'LDL')
  assert.equal(anchor('triglycerides', 'Overt hypothyroidism increased serum LDL cholesterol.'), null)
})

test('efecto correcto: se construye desde el texto, pendiente de 2.ª lectura', () => {
  const out = gateRows({ effects: [eff()] }, ctx())
  assert.equal(out.rejected.length, 0)
  const [r] = out.effects
  assert.equal(r.quote, 'Overt hypothyroidism increased serum LDL cholesterol compared with euthyroid controls.')
  assert.equal(r.layer, 'sangre')
  assert.equal(r.evidenceKind, 'afirmado_revision')
  assert.equal(r.status, 'pendiente_verificacion')
})

test('se rechaza: frase inexistente, antecedente, fragmento inventado, tema ausente, paper ajeno', () => {
  const out = gateRows(
    {
      effects: [
        eff({ sentence: 's99' }),
        eff({ sentence: 's2', exposure: 'hypothyroidism', outcome: 'LDL cholesterol', comparator: null }),
        eff({ outcome: 'triglycerides' }),
        eff({ sentence: 's8', exposure: 'Reduced thyroid hormone', outcome: 'hepatic LDL receptor expression', comparator: null, direction: 'disminuye' }),
        eff({ paperId: '999' }),
      ],
    },
    ctx(),
  )
  assert.equal(out.effects.length, 0)
  const why = out.rejected.map((r) => r.reasons.join(' '))
  assert.match(why[0], /frase inexistente/)
  assert.match(why[1], /BACKGROUND|antecedente/)
  assert.match(why[2], /no está en la frase/)
  assert.match(why[3], /tema no aparece/)
  assert.match(why[4], /fuera del lote/)
})

test('veto de significación: «no significant difference» no puede ser aumenta', () => {
  const out = gateRows({ effects: [eff({ sentence: 's6', exposure: 'hypothyroid patients', outcome: 'bone mineral density', comparator: 'controls', direction: 'aumenta' })] }, ctx())
  assert.match(out.rejected[0].reasons.join(), /significación/)
  assert.equal(significanceVeto('LDL was significantly higher (P < .01).', 'sin_efecto'), true)
  assert.equal(significanceVeto('LDL was significantly higher (P < .01).', 'aumenta'), false)
})

test('asociación: la frase manda aunque la IA diga causal', () => {
  const out = gateRows({ effects: [eff({ sentence: 's7', exposure: 'Hypothyroidism', outcome: 'heart rate variability', comparator: null })] }, ctx())
  assert.equal(out.effects[0].claim, 'asociacion')
  assert.equal(out.effects[0].claimForced, true)
})

test('segunda lectura: solo lo que coincide se muestra; la comparación invertida queda en revisión', () => {
  const rows = gateRows(
    { effects: [eff(), eff({ sentence: 's5', exposure: 'hypothyroid patients', outcome: 'LDL', comparator: 'controls', direction: 'aumenta' })] },
    ctx(),
  )
  const items = verificationItems(rows)
  assert.equal(items.length, 2)
  assert.equal('direction' in items[0], false) // ciega: no ve la primera respuesta
  applyVerification(rows, [
    { key: 'e0', direction: 'aumenta' },
    { key: 'e1', direction: 'disminuye' },
  ])
  assert.deepEqual(rows.effects.map((r) => r.status), ['aceptada', 'en_revision'])
})

test('cifras: el valor y la unidad los pone el código; p-valores no se aceptan', () => {
  const seg = segmentPaper(paper)
  const tsh = seg.numbers.find((n) => n.value === 12.5)
  const p = seg.numbers.find((n) => n.kind === 'p')
  const base = { paperId: '111', sentence: tsh.sentence, outcome: 'TSH', group: 'untreated patients', slot: 'prevalence', metric: null }
  const out = gateRows({ measures: [{ ...base, number: tsh.id }, { ...base, number: p.id }, { ...base, number: 'n999' }] }, ctx())
  assert.equal(out.measures.length, 1)
  assert.deepEqual([out.measures[0].value, out.measures[0].unit, out.measures[0].group], [12.5, 'mIU/L', 'untreated patients'])
  assert.match(out.rejected[0].reasons.join(), /p-valor/)
  assert.match(out.rejected[1].reasons.join(), /inexistente/)
})

test('léxico de capas: inicio de palabra; alias cortos solo palabra completa', () => {
  assert.equal(layerOfTarget('LDL clearance'), null)
  assert.equal(layerOfTarget('inner ear'), 'sentidos')
  assert.equal(layerOfTarget('hepatic LDL receptor'), 'digestivo')
})

test('dossier: filas derivadas de lo crudo; lo aceptado agrega, cadena ensamblada', () => {
  const d = emptyDossier({ input: 'hipotiroidismo' })
  d.queryUsed = 'hypothyroidism'
  d.kind = 'enfermedad'
  d.papers['111'] = paper
  d.map.layers = { sangre: { count: 10 }, piel: { count: 0 }, hueso: { count: 3 } }
  d.extraction.batches.push({
    layer: 'sangre',
    raw: {
      effects: [eff(), eff({ sentence: 's8', exposure: 'Reduced thyroid hormone', outcome: 'hepatic LDL receptor expression', comparator: null, direction: 'disminuye', role: 'origen' })],
      links: [{ paperId: '111', sentence: 's8', from: 'thyroid hormone', to: 'hepatic LDL receptor expression', verb: 'disminuye' }],
    },
    verify: [
      { key: 'e0', direction: 'aumenta' },
      { key: 'l0', direction: 'disminuye' },
    ],
  })
  const full = deriveRows(d)
  assert.equal(layerState(full, 'sangre'), 'efecto')
  assert.equal(layerState(full, 'hueso'), 'literatura')
  assert.equal(layerState(full, 'piel'), 'sin_literatura')
  assert.equal(targetsOf(full)[0].directions.aumenta, 1)
  assert.equal(chainsOf(full).length, 2)

  const tampered = JSON.parse(JSON.stringify(full))
  tampered.rows.effects.push({ ...full.rows.effects[0], target: 'cura todo', status: 'aceptada' })
  const { dossier } = importDossier(tampered)
  assert.equal(dossier.rows.effects.some((r) => r.target === 'cura todo'), false)
})

test('metadatos y cifras agregadas', () => {
  assert.equal(designOf(['Journal Article', 'Meta-Analysis']), 'metaanalisis')
  assert.deepEqual(speciesOf(['Animals']), ['animales'])
  const [ng] = summarizeMeasures([
    { slot: 's', unit: 'ng/mL', value: 10, paperId: 'a' },
    { slot: 's', unit: 'ng/mL', value: 30, paperId: 'b' },
    { slot: 's', unit: 'ng/mL', value: 12, paperId: 'c' },
  ])
  assert.deepEqual([ng.median, ng.min, ng.max], [12, 10, 30])
})
