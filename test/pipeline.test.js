import { test } from 'node:test'
import assert from 'node:assert/strict'
import { gateRows, resolveLayer } from '../src/pipeline/gate.js'
import { summarizeMeasures, targetsOf, layerState } from '../src/pipeline/aggregate.js'
import { chainsOf } from '../src/pipeline/chain.js'
import { emptyDossier, gateContext, importDossier } from '../src/pipeline/dossier.js'
import { makePaper, designOf, speciesOf } from '../src/engine/paper.js'

const ABSTRACT =
  'Overt hypothyroidism was associated with increased serum LDL cholesterol. ' +
  'Mean TSH was 12.5 mIU/L in the untreated group. ' +
  'Reduced thyroid hormone decreases hepatic LDL receptor expression, which increases LDL cholesterol. ' +
  'Bone mineral density did not differ between groups.'

function fixture() {
  const d = emptyDossier({ input: 'hipotiroidismo' })
  d.kind = 'enfermedad'
  d.papers['111'] = makePaper({ pmid: '111', title: 'Thyroid and lipids', abstract: ABSTRACT, pubTypes: ['Review'], mesh: ['Humans'] })
  d.map.layers = { sangre: { count: 10 }, piel: { count: 0 }, hueso: { count: 3 } }
  return d
}

const effect = (over = {}) => ({
  paperId: '111',
  quote: 'Overt hypothyroidism was associated with increased serum LDL cholesterol.',
  target: 'serum LDL cholesterol',
  layer: 'sangre',
  role: 'actua_sobre',
  predicate: 'aumenta',
  level: 'organismo',
  evidence_kind: 'afirmado_revision',
  ...over,
})

test('metadatos: diseño y especie salen de PubMed, no de la IA', () => {
  assert.equal(designOf(['Journal Article', 'Meta-Analysis', 'Review']), 'metaanalisis')
  assert.equal(designOf(['Journal Article']), 'primario_sin_tipo')
  assert.deepEqual(speciesOf(['Animals', 'Mice']), ['animales'])
  assert.deepEqual(speciesOf([]), ['no_indicada'])
})

test('gate acepta un efecto literal y confirma la capa por léxico', () => {
  const d = fixture()
  const out = gateRows({ effects: [effect()] }, gateContext(d))
  assert.equal(out.effects.length, 1)
  assert.equal(out.effects[0].layer, 'sangre')
  assert.equal(out.effects[0].layerSource, 'ia_confirmada_por_lexico')
})

test('gate rechaza frase inventada, diana ausente y enums fuera de esquema', () => {
  const d = fixture()
  const out = gateRows(
    {
      effects: [
        effect({ quote: 'Hypothyroidism dramatically raises LDL in every patient studied.' }),
        effect({ target: 'triglycerides' }),
        effect({ role: 'causa_directa' }),
        effect({ paperId: '999' }),
      ],
    },
    gateContext(d),
  )
  assert.equal(out.effects.length, 0)
  assert.equal(out.rejected.length, 4)
  assert.match(out.rejected[0].reasons.join(), /literalmente/)
  assert.match(out.rejected[1].reasons.join(), /diana no aparece/)
  assert.match(out.rejected[2].reasons.join(), /rol no válido/)
  assert.match(out.rejected[3].reasons.join(), /fuera del lote/)
})

test('gate: la capa propuesta por la IA sin respaldo léxico no se acepta', () => {
  assert.deepEqual(resolveLayer('piel', 'serum LDL cholesterol', ''), { layer: 'sangre', layerSource: 'lexico' })
  assert.deepEqual(resolveLayer('piel', 'quality of life', ''), { layer: null, layerSource: 'sin_capa' })
})

test('gate de cifras: número y unidad deben estar en la frase; hueco según tipo', () => {
  const d = fixture()
  const base = { paperId: '111', quote: 'Mean TSH was 12.5 mIU/L in the untreated group.', target: 'TSH', layer: 'endocrino', slot: 'prevalence', unit: 'mIU/L' }
  const out = gateRows(
    {
      measures: [
        { ...base, value: 12.5 },
        { ...base, value: 13 },
        { ...base, value: 12.5, unit: 'ng/mL' },
        { ...base, value: 12.5, slot: 'concentration' },
      ],
    },
    gateContext(d),
  )
  assert.equal(out.measures.length, 1)
  assert.match(out.rejected[0].reasons.join(), /número 13/)
  assert.match(out.rejected[1].reasons.join(), /unidad/)
  assert.match(out.rejected[2].reasons.join(), /hueco no permitido/)
})

test('cifras: mediana + rango por hueco+métrica+unidad, sin mezclar unidades', () => {
  const rows = [
    { slot: 'serum_level', unit: 'ng/mL', value: 10, paperId: 'a' },
    { slot: 'serum_level', unit: 'ng/mL', value: 30, paperId: 'b' },
    { slot: 'serum_level', unit: 'ng/mL', value: 12, paperId: 'c' },
    { slot: 'serum_level', unit: 'nmol/L', value: 50, paperId: 'd' },
  ]
  const [ng, nmol] = summarizeMeasures(rows)
  assert.deepEqual([ng.median, ng.min, ng.max, ng.n], [12, 10, 30, 3])
  assert.equal(nmol.n, 1)
})

test('dirección por conteo y contradicción visible', () => {
  const d = fixture()
  d.rows.effects = [effect(), effect({ predicate: 'disminuye', paperId: '222' }), effect({ predicate: 'aumenta', paperId: '333' })]
  const [t] = targetsOf(d)
  assert.equal(t.directions.aumenta, 2)
  assert.equal(t.directions.disminuye, 1)
  assert.equal(t.contradictory, true)
})

test('estado de capa: silencio no es ausencia de efecto', () => {
  const d = fixture()
  d.rows.effects = [effect()]
  assert.equal(layerState(d, 'sangre'), 'efecto')
  assert.equal(layerState(d, 'hueso'), 'literatura')
  assert.equal(layerState(d, 'piel'), 'sin_literatura')
  assert.equal(layerState(d, 'nervioso'), 'pendiente')
})

test('cadena: tema → diana → diana, ensamblada entre papers', () => {
  const d = fixture()
  d.rows.effects = [effect({ target: 'thyroid hormone', role: 'actua_sobre', predicate: 'disminuye', paperId: '222' })]
  d.rows.links = [
    { paperId: '111', quote: 'x', from_target: 'Thyroid hormone', to_target: 'hepatic LDL receptor', predicate: 'disminuye', from_layer: 'endocrino', to_layer: 'digestivo' },
    { paperId: '111', quote: 'x', from_target: 'hepatic LDL receptor', to_target: 'LDL cholesterol', predicate: 'aumenta', from_layer: 'digestivo', to_layer: 'sangre' },
  ]
  const chains = chainsOf(d)
  assert.equal(chains.length, 1)
  assert.equal(chains[0].hops.length, 3)
  assert.equal(chains[0].fromTopic, true)
  assert.equal(chains[0].assembled, true)
})

test('importar dossier vuelve a pasar el control y aparta filas manipuladas', () => {
  const d = fixture()
  d.rows.effects = [effect(), effect({ quote: 'Inventada: hypothyroidism cures everything in serum LDL cholesterol.' })]
  const { dossier, warnings } = importDossier(JSON.parse(JSON.stringify(d)))
  assert.equal(dossier.rows.effects.length, 1)
  assert.equal(dossier.rejected.length, 1)
  assert.match(warnings.join(), /no superan el control/)
  assert.throws(() => importDossier({ format: 'otro' }), /No es un dossier/)
})

test('léxico de capas: alias al inicio de palabra; cortos solo palabra completa', () => {
  assert.equal(resolveLayer(null, 'LDL clearance', '').layer, null)
  assert.equal(resolveLayer(null, 'inner ear', '').layer, 'sentidos')
  assert.equal(resolveLayer(null, 'hepatic LDL receptor', '').layer, 'digestivo')
  assert.equal(resolveLayer(null, 'early satiety', '').layer, null)
})
