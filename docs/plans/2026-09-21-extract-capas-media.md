---
status: draft
source: direct
tier: M
mode: graph-strict
date: 2026-09-21
slug: extract-capas-media
legitimidad: mixto
decision: refactorizar
schema_open: false  # propuesta v1 en sección H, pendiente de OK del dueño
---
#  CORE APP
	El usuario busca un termino: enfermedad, sintoma, hormona, vitamina, etc. La app realiza una busqueda de los papers mas valorados, relevantes del tema, El agente muestra los datos mas revelantes aceptados por convencion mundial sobre el tema,
	en ui se muestra una valoracion pero los datos reales se muestran al pasar curson por encima o al hacer click y se quedan fijos hasta hacer click fuera o al mismo enlace. La app no debe calcular nada mas que ese dato que muestra con el rango aproximado, 
	al exportar fuentes, se muestran los datos usados reales y los mostrados en la ui. El como se propaga el elemento buscado en las diferentes capas :Sangre, organos,hueso, linfatico,piel ,nerviso, es parte del core, el paper es el unico que ofrece esa informacion
	no es nunca una interpretacion. Si no existen datos un aviso " sin datos que mostrar " 

# extract-capas-media

## Scope

Buscar tema → **máx. 5 papers más relevantes** (ranking oficial de la fuente, no un score nuestro) → el agente **rellena un JSON de schema fijo** → pantalla: por capa, **media + rango + n** de esos campos → export: cifra real usada vs cifra mostrada.

No es un volcado de cada número del paper. Solo los huecos del schema. Vacío = el paper no lo dice.

## Packet

OLA: n/a (direct)
FILAS: corpus 5 → schema fijo → gate → media display → capas 7 → export crudo
DoD: schema cerrado con fuentes web vigentes (aún NO)
NO TOCAR: `vitamin-d.json` como evidencia; Sci-Hub; `propagate` lookup del catálogo
VERIFY: pendiente hasta schema lock

## Plan

### DIAGNÓSTICO

síntoma: se busca un tema y sale una lista; el muñeco sigue siendo vitamina D curada.
origen: `TopicSearch` no escribe estado de capas; no hay schema de extracción.
provoca: sin formulario fijo el LLM inventa campos; sin tope de papers la UI es inviable.
familia: `stub-smoke` + `contract-drift`
remedio: lote 5 + schema cerrado + media solo de huecos rellenos + export 1:1.

### Cerrado (no se reabre)

- Lote: **5** papers, orden de relevancia de PubMed / Europe PMC (Best Match / default relevance). Si hay menos, esos. Si `hitCount` > 5, se anota “lote 5 de N”.
- Identificador oficial obligatorio (PMID/PMC/DOI). Sin ID → fuera.
- Texto usado: abstract + PDF OA legal si existe. Nada pirateado.
- **7 capas de producto** (fijas): sangre, órganos, hueso, linfático, piel, nervioso, sentidos.
- Capa se enciende si hay ≥1 fila gated mapeada ahí. **La media no pinta intensidad** (no “9.2 = crítico”).
- Pantalla: por (capa × campo del schema) → media aritmética + min–max + n. n=1 → se muestra el valor, etiqueta “1 paper”, no “promedio”.
- Unidades distintas → grupos distintos. **Cero conversión** de unidades.
- Métrica distinta (string exacto del schema) → no se mezcla.
- Export: cada observación (valor, unidad, quote, paper) + qué se mostró (media, n, ids).
- Gate mecánico (no LLM): quote ⊆ texto guardado; número ∈ quote; paper ∈ lote; campo ∈ schema; capa ∈ {7} ∪ `unmapped`.
- Catálogo vitamina D y el path live **no se mezclan** (un gate en App).

### Schema — ABIERTO (hace falta web vigente para cerrarlo)

El agente **no elige qué es importante**. Rellena huecos. Lo que no está en el schema no se extrae.

**Sobre** (cerrado): un JSON, siempre la misma forma.

```text
TopicFill
  query
  kind          # enum ABIERTO: ver kinds abajo
  papers[≤5]    # ids oficiales + texto cacheado
  rows[]        # 0..N filas; cada fila = un hueco del schema con cifra o null
```

**Kinds** (propuesta; lock pendiente): `enfermedad` | `hormona` | `vitamina` | `sintoma`

Mismo envelope; **cambia el enum de `slot`**, no la forma.

**Fila (cerrado como forma, abierto como lista de slots):**

```text
Row
  slot          # enum del kind — LISTA NO CERRADA
  layer         # 1..7 | unmapped
  value         # number | null
  unit          # string del paper | null
  n_paper       # participantes del estudio si el paper lo dice | null
  quote         # substring del texto cacheado
  paperId
```

#### Qué dice la industria hoy (2026) — no es el schema final

| Fuente | Método | Qué copiamos | Qué no |
|--------|--------|--------------|--------|
| [Cochrane Handbook ch.5](https://www.cochrane.org/authors/handbooks-and-manuals/handbook/current/chapter-05) Table 5.3.a | Formulario **preespecificado** (PICOS): diseño, población, intervención/exposición, outcome (5 elementos: dominio, instrumento, métrica, agregación, tiempo), resultados | Formulario fijo **antes** de leer; no extraer “todo”; outcome con unidad y n | RoB completo, IPD, conversión de formatos para meta-análisis ponderado |
| ClinicalTrials.gov results + [MedDRA SOC](https://www.tga.gov.au/safety/adverse-events/medicine-adverse-events/how-search-database-adverse-event-notifications-daen-medicines/medical-dictionary-regulatory-activities-meddra) | Harm agrupado por **sistema orgánico** (27 SOC) | Golpe por sistema, no por cada AE | 27 SOC ≠ nuestras 7 capas; el **mapa SOC→capa** es tabla de producto, no evidencia |
| Endo lab (ATA TSH, HPA cortisol) | Valor + **unidad** + momento (AM) + rango **del ensayo**; no mezclar assays | Hormona: concentración + unidad + timing si el paper lo dice | No inventar rango de referencia de otro lab |

#### Slots — BORRADOR (no lock)

Comunes a todo kind:

- `design` (texto corto del paper: RCT, cohort, review…) — si no cabe en number, va como quote-only, sin media
- `n` (participantes)
- `dose` + `dose_unit` (si el paper afirma dosis)
- `layer_effect` (hay efecto descrito en esa capa: value opcional)

Por kind (huecos típicos; **recortar/ampliar con otra pasada web**):

| kind | slots candidatos |
|------|------------------|
| enfermedad | `mortality`, `incidence`, `severity_score` + instrumento, `ae_by_layer` |
| hormona | `concentration` + unit + `sample_time`, `ref_low`/`ref_high` **solo si el mismo paper los da** |
| vitamina | `serum_level` + unit, `dose`, `threshold` del paper |
| sintoma | `scale_name` (enum abierto por ahora), `score` |

**Regla anti-invento:** slot no listado → el agente no lo crea. Paper no menciona el slot → `null`, la capa no usa ese campo.

**Mapa capa (ABIERTO):** 7 anatomyId del visor ← alias anatómicos del paper. Candidato de industria: colapsar MedDRA SOC a esas 7 (sangre+linfa, órganos viscerales, músculo-hueso, piel, nervio, sentidos/ojo-oído, resto → unmapped). Tabla JSON versionada, fail-close si el sitio no pega con ningún alias.

### LEGITIMIDAD

flujo_actual: mixto — búsqueda live válida; visor catálogo válido; no hay puente.
decisión: absorber `searchLiterature` + `makePaper` + 7 layers; no reutilizar `propagate` para medias; no meter filas live en `vitamin-d.json`.

### Touch graph (radio)

| Archivo | Símbolo | Qué | ¿Propagar? |
|---------|---------|-----|------------|
| `src/engine/literatureSearch.js` · `searchLiterature` | `pageSize` default 5 | sí → `TopicSearch` |
| nuevo `src/engine/topicSchema.js` | enums kind/slot + validate | callers extract/UI |
| nuevo `src/engine/observationGate.js` | quote/número/id | extract |
| nuevo `src/engine/aggregate.js` | mean/min/max/n por (layer,slot,unit) | UI + export |
| nuevo `src/data/layer-aliases.json` | mapa SOC/alias → 7 | gate |
| `src/detail/TopicSearch.jsx` | callback dossier | `App` |
| `src/App.jsx` | gate catalog \| live | `LayerList` reach |
| `src/detail/FuentesMenu.jsx` | export mostrado vs usado | — |
| `docs/CORE.md` | media = display; verdad = filas | agentes |

NO TOCAR: `vitamin-d.json` findings, `GROK/`, Sci-Hub, `resolveNodeState` del catálogo.

### IMPACTO

Sin schema lock, el extract inventa campos. Sin lote 5, la UI no escala. Si se pinta intensidad con la media, se inventa clínica.

### Blocks (cuando el schema cierre)

1. Schema JSON versionado + validate fail-close.
2. Search top-5 + persist texto.
3. Extractor rellena solo slots; gate tira el resto.
4. Aggregate + capas on/off.
5. Export crudo vs mostrado.
6. CORE: media es compresión de lectura.

### VERIFY (cuando se aplique)

- Buscar “TSH”: ≤5 papers; ficha hormona solo slots de hormona.
- Cifra en pantalla tiene n y rango; export lista las 5 (o menos) cifras.
- Slot ausente en el texto → no aparece.
- PMID inventado → no entra.
- Vitamina D catálogo intacta si no hay live.

### accepted_risks / ABIERTO

- Lista exacta de `slot` por kind: **no cerrada**. Hace falta otra pasada web (CORE outcomes por especialidad, CONSORT harms, ATA/Endocrine Society labs) antes de lock.
- Mapa MedDRA SOC → 7 capas: **no cerrado**.
- Media aritmética no ponderada: es compresión de UI, no meta-análisis Cochrane (ch.10). Queda escrito en CORE al aplicar.
- Relevance de la API ≠ “mejor evidencia GRADE”. Se etiqueta como ranking de la fuente.

## Ampliación 2026-09-21 — ideas y huecos (todo ABIERTO)

Esta sección **no cierra nada** ni reabre lo cerrado arriba: recoge ideas que potencian la intención (buscar un tema → ver cuánto repercute en cada capa, con datos de papers y cada cifra trazable) y expone los huecos que hay que resolver para que la app llegue a serlo.

Etiquetas: `[repo]` comprobado en el código · `[memoria]` conocimiento externo sin verificar en esta sesión, **contrastar antes de apoyarse en ello** · `[propuesta]` idea nueva.

### A. Estado real del código (para no planificar sobre humo) `[repo]`

| Pieza | Estado |
|---|---|
| Búsqueda | `searchLiterature`: cadena **PubMed (NCBI E-utilities) → OpenAlex**, llamadas directas desde el navegador (CORS abierto), sin proxy. Europe PMC **ya no se usa** (no envía CORS). Caché con TTL, reintentos ante 429, resultados degradados sin cachear |
| Forma de paper | `src/engine/paper.js` · `makePaper`: campo único (pmid, pmcid, doi, abstract, oaUrl, …). Punto donde añadir el texto guardado |
| Texto disponible | Abstract vía `efetch` XML con `DOMParser`; **fallo del abstract no tumba la búsqueda**. Cuando falta, el paper llega sin abstract |
| Estados de capa | `src/engine/reachMeta.js`: fuente única de nombre/definición de Activo · Rozado · Contradictorio · Apagado, más matiz por capa (7 `anatomyId`) |
| Visor | Catálogo curado (`vitamin-d.json`) con `propagate` como lookup; **no recibe nada de la búsqueda live** |
| Puente búsqueda → capas | **No existe.** La búsqueda lista papers; las capas salen del JSON curado |

### B. Cómo se muestra una cifra: titular + detalle `[propuesta]`

La media no tiene que ser el protagonista. Con 3–5 papers, lo honesto y legible es:

- **Titular:** un valor aproximado + rango + n, p. ej. `≈ 9.4 · 8–10 · 4 papers`.
- **Al pasar/enfocar/tocar:** un panel con **cada valor real**: valor + unidad, n de participantes, diseño, quote con el número resaltado, enlace al paper. El titular es una ayuda de lectura; la verdad son las filas.

Decisiones abiertas dentro de esto:

- **Mediana vs media aritmética** como "aproximado". Con ≤5 valores, un dato extremo mueve la media y no la mediana; con n=2 coinciden. La mediana no añade complejidad. El plan cerrado dice "media"; esto es una propuesta para valorar, no un cambio hecho.
- **Precisión mostrada** = la de los datos de origen (máx. decimales de las entradas), sin exactitud inventada.
- **Si hay metaanálisis/revisión sistemática** entre los papers: su valor ya viene combinado con métodos válidos → candidato a titular, citado tal cual; el resto queda en el detalle. El slot `design` hoy es "quote-only sin media": habría que permitir marcarlo para esta regla.
- **n=1:** se muestra el valor con la etiqueta "1 paper" (ya cerrado); **sin** "≈".
- **Accesibilidad:** el detalle debe abrirse también con foco de teclado y con toque (móvil), no solo con hover.
- **Rango siempre junto al aproximado**, sin umbral mágico de "dispersión alta": el propio rango deja ver si los papers discrepan.

### C. Ideas que potencian la app `[propuesta]` salvo indicación

**C1. Silencio ≠ ausencia (cobertura por capa).** Una capa sin filas no significa "sin efecto"; significa "este lote no habla de ella". Propuesta de tres situaciones distintas por capa: *sin datos en el lote* · *con datos* · *el paper dice explícitamente que no hay efecto* (esta última solo con quote). Mostrar cobertura: "3 de 5 papers hablan de esta capa". Es la protección principal contra que la ausencia de datos se lea como seguridad.

**C2. Dirección del efecto sin promediar.** Además de cifras, un slot `direction` ∈ {aumenta, disminuye, sin efecto, mixto} con quote. Permite resumir "3 de 4 papers reportan descenso" **sin** tocar unidades ni magnitudes, donde los papers no comparten escala. `[memoria]` La guía SWiM (*Synthesis Without Meta-analysis*, BMJ 2020) y los "effect direction plots" recogen justo este enfoque para cuando no se puede combinar; contrastar la referencia antes de citarla en CORE.

**C3. Filtrar por tipo de estudio.** Interruptor "solo revisiones/metaanálisis" que añade un filtro de tipo de publicación a la búsqueda. `[memoria]` PubMed admite filtros tipo `systematic[sb]`; verificar sintaxis exacta y su efecto en `esearch`. Da un lote más denso en evidencia sin inventar un score propio. El ranking sigue siendo el de la fuente.

**C4. Cita resaltada.** El detalle muestra la frase original con el número marcado, y un enlace al paper. Es lo que hace que el usuario confíe sin tener que creerle a la IA. Sale gratis del gate (`quote ⊆ texto`, `número ∈ quote`).

**C5. Texto completo para subir el rendimiento.** Los abstracts suelen no traer las cifras de los slots. `[propuesta / verificar]` Para papers OA en PMC, `efetch db=pmc` devuelve texto completo en XML por el mismo dominio NCBI (mismo CORS); comprobar cobertura real y CORS antes de contar con ello. El plan ya admite "abstract + PDF OA legal".

**C6. Consulta bilingüe.** Los papers están en inglés y el usuario escribe en español. `[repo]` medido hoy: "insomnio" en PubMed da 120 resultados. Propuesta: traducir/normalizar la consulta a términos de búsqueda en inglés (idealmente con la misma llamada del agente), **mostrando siempre la consulta usada** para que sea auditable.

**C7. Caché de extracción por paper.** Un paper fija su contenido: la extracción depende de (`paperId`, `versión de schema`, hash del texto), no del usuario. Si se cachea en el backend, cada paper se extrae **una sola vez**: baja el coste por búsqueda, y los temas populares salen casi gratis y con resultados idénticos (reproducibilidad).

**C8. Dossier como instantánea reproducible.** El plan ya prevé export crudo vs mostrado. Ampliación: incluir fecha, consulta usada, fuente y ranking, versión de schema y hash del texto, de modo que el mismo dossier pueda reabrirse aunque PubMed cambie después. `[repo]` La app ya tiene importación de JSON; explorar que el dossier viaje por ese mismo mecanismo, sin mezclar con el catálogo de vitamina D (lo cerrado se mantiene: un gate en `App`).

**C9. Banco de pruebas con verdad conocida.** El catálogo curado de vitamina D (`[repo]` 11 PMIDs únicos con hallazgos ya transcritos a mano) sirve como **gold set**: ejecutar el extractor sobre esos mismos papers y comparar con lo curado. Da precisión/recuperación reales del extractor antes de exponerlo a usuarios. Es la forma más barata de saber si la idea funciona.

**C10. Revisión humana ligera.** Botón "descartar esta fila" (y motivo opcional), guardado en local y reflejado en el export. Convierte fallos del extractor en señal, sin bloquear el uso.

**C11. Lotes progresivos.** "Cargar 5 más" en lugar de un único lote: el usuario ve cómo cambia el titular al crecer n. Permite ver estabilidad del resultado y evita la falsa seguridad de un lote de 5. Mantiene el tope de 5 por paso.

**C12. Qué muestra el grafo con datos live.** Sin pintar intensidad con la media (cerrado), sí puede codificar **cantidad de evidencia**: tamaño = nº de papers/filas; matiz = capa; borde = cobertura. Así el grafo dice "dónde hay literatura", no "qué gravedad hay".

**C13. Conversión de unidades declarada (opcional).** El plan cierra "cero conversión". Si algún día se quiere comparar p. ej. mg vs nmol para el mismo analito, solo con tabla de factores **visible, versionada y por analito**, mostrando siempre el valor original al lado. Toca un punto marcado como cerrado: decisión del dueño, no propuesta a aplicar.

### D. Huecos por resolver (cada uno = decisión abierta)

**D1. Dónde corre el agente/LLM.** Es el hueco mayor: el plan no lo dice. La app se despliega estática (Vite/Cloudflare) y una clave de API **no puede ir en el navegador**.

| Opción | Cómo | A favor | En contra |
|---|---|---|---|
| Worker/función serverless | El navegador llama a tu endpoint; la clave vive allí | Clave protegida, caché C7 compartida, límites de uso | Coste a tu cargo; hay que limitar abuso |
| Clave del usuario (BYOK) | El usuario pega su clave, se guarda en local | Sin coste ni backend | Fricción; clave en el navegador del usuario |
| Híbrido | Catálogo y extracciones cacheadas gratis; extracción nueva con BYOK o cuota | Escala con el uso | Más piezas |

**D2. Rendimiento con abstract.** No está medido cuántos slots se llenan con solo el abstract. Sin ese dato, las capas podrían quedar casi vacías. Ver E.

**D3. Referencias desactualizadas del plan.** El texto cerrado menciona "PubMed / Europe PMC". Hoy la cadena es PubMed → OpenAlex; el respaldo (OpenAlex) tiene **otro criterio de relevancia**, así que el lote de 5 debe registrar **de qué fuente salió**. Además, el lote de 5 debe ser un subconjunto del listado de búsqueda, no sustituirlo.

**D4. La capa la decide la tabla, no el LLM.** El plan lo insinúa (alias → 7 capas, fail-close). Conviene dejarlo explícito: la asignación de capa es una coincidencia mecánica entre la quote y la tabla versionada; si el LLM proponía otra, se descarta. Si no, la asignación de capa quedaría fuera del gate.

**D5. Semántica de "Apagado" en modo live.** `[repo]` `reachMeta` define Apagado como "el flujo no llega hasta aquí", lo cual es correcto para el catálogo curado pero **engañoso con datos live**, donde significa "el lote no dice nada" (ver C1). Habrá que separar las etiquetas por modo.

**D6. Ranking ≠ calidad.** Ya anotado como riesgo aceptado. Sumar: mostrar siempre nivel de diseño y n de cada paper, para que el usuario juzgue con datos y no por el orden.

**D7. Frontera regulatoria.** `[repo]` El propio doc de idea cita la FDA (CDS): mostrar estudios revisables no es dispositivo; una puntuación de riesgo o una directiva sí puede serlo. Principio para CORE: **la app expone lo que los papers dicen; nunca emite una puntuación propia ni una recomendación**.

**D8. Evaluación del extractor.** Definir qué se mide y quién decide los umbrales: tasa de filas que pasan el gate, tasa de slots rellenos, acuerdo con el gold set (C9), muestra auditada a mano. Los umbrales los fija el dueño **después de ver datos**, no antes.

**D9. Reproducibilidad del modelo.** Guardar versión del modelo y prompt en el dossier (C8). Idea a valorar: dos pasadas independientes y marcar las filas que discrepan.

### E. Prueba de viabilidad propuesta (sin cerrar el schema)

1. Un solo `kind` (p. ej. `hormona`, tema "TSH"), 5 papers reales del lote de búsqueda actual.
2. Extraer con los slots borrador de ese kind; pasar el gate mecánico.
3. Repetir sobre los papers del catálogo de vitamina D y comparar con lo curado (C9).
4. Observar: filas que pasan el gate, slots rellenos con solo abstract, y —si se prueba C5— cuánto mejora con texto completo OA.
5. Con esos datos se decide el schema y D1, no antes.

### F. Orden de trabajo sugerido (no vinculante)

1. Decidir D1 (dónde corre el LLM). 2. Prueba E sobre un kind. 3. Con los resultados, cerrar slots y mapa de capas. 4. Bloques 1–6 del plan con las mejoras B y C1–C4 desde el primer día (son baratas y protegen la honestidad del resultado). 5. Resto de C según lo que enseñe la prueba.

### G. Contraste con análisis externo (2026-09-21): qué dudas quedan despejadas

Origen: un análisis externo pegado por el dueño. Etiquetas: `[repo]` comprobado en este proyecto, `[dueño]` decisión o preferencia expresada, `[externo]` sin verificar. Solo se marca como despejado lo que tiene respaldo `[repo]` o `[dueño]`.

**Despejadas**

- **G1. La fuente no cambia** `[dueño]`. Se mantiene PubMed → OpenAlex; no se cambia de fuente porque el abstract no traiga todos los datos. Lo que falte queda `null`, no se busca otra fuente para rellenarlo.
- **G2. CORS** `[repo]`. NCBI E-utilities responde con CORS abierto y funciona directo desde el navegador; Europe PMC **no** (preflight 403), por eso se descartó. El análisis externo lo afirma al revés y no debe seguirse: Europe PMC no entra como tercera fuente sin volver a probarlo.
- **G3. Método de extracción** `[dueño]`. Un agente LLM por API rellena el schema fijo; no hay parser propio. Cada dato lleva su quote y pasa el gate mecánico (quote ⊆ texto, número ∈ quote). Confirma lo que el plan ya proponía.
- **G4. Lo no dicho queda `null`** `[dueño]`. Un paper sin abstract o sin la cifra sale como "sin datos extraíbles"; nunca se rellena por inferencia (coherente con C1).
- **G5. La tabla de capas es propia** `[repo]`. El mapa término anatómico → 7 capas lo mantiene el proyecto, versionado y fail-close (D4). MedDRA es un diccionario de eventos adversos con licencia y no lo sustituye.

**Siguen abiertas (el texto externo no las cierra)**

- **G6. Rendimiento real** con solo abstract y con nuestros slots (D2, prueba E). Las cifras externas (TrialMind, LEADS, ChatSchema…) `[externo]` son orientativas; ninguna mide `serum_level + unit`.
- **G7. Coste por extracción.** El texto externo da dos cifras que difieren ~30× (≈$0.30/abstract frente a ≈$0.009/documento). No sirve ninguna: se mide en la prueba E con tokens reales y el modelo elegido; C7 (caché por paper) lo reduce.
- **G8. Dónde corre el LLM (D1).** Recomendación del asistente: Worker de Cloudflare con la clave como secret y caché C7 en KV; BYOK como plan B. **Sin decidir por el dueño.** Proveedor y modelo también.
- **G9. Cobertura de abstract.** ~70–80 % de registros con abstract en inglés `[externo]`; no medido en nuestros temas. Medir en ~20 consultas (TSH, insomnio, vitamina D…).

**Huecos nuevos aportados por el análisis**

- **G10. `systematic[sb]` por E-utilities** `[externo]`: verificar con una llamada real a esearch. Además, decidir si el filtro se aplica **antes** o **después** del ranking; cambia qué significa "lote de 5" (C3).
- **G11. Trazabilidad del ranking.** Cada paper del lote lleva `ranking_source` (pubmed | openalex) y `ranking_position`; el lote sale de **una sola fuente** (refuerza D3).
- **G12. Dirección del efecto por regla mecánica** (C2). Si el LLM propone la dirección, el gate comprueba que la quote contiene un término de dirección (aumentó/redujo/sin diferencia…); si no, se descarta. Citar SWiM (Campbell et al., BMJ 2020;368:l6890) `[externo]`, contrastar antes de meterla en CORE.
- **G13. Texto completo solo OA** (C5): se usa únicamente para papers con PMC abierto; no es requisito del flujo base.
- **G14. Cobertura del mapa de capas.** Medir qué % de términos anatómicos de ~50 abstracts cae en `unmapped`; si es alto, el visor queda vacío y hay que ampliar la tabla antes de mostrar nada.

## H. Esquema v1 propuesto (2026-09-26) — evidencia, contraste y lock pendiente de OK del dueño

Objetivo acotado: con ≤5 papers de un tema (hormona, vitamina, enfermedad, síntoma) ver **en qué capas golpea, en qué sentido y por qué cadena llega ahí**, con cada dato citado. No pretende ser un meta-análisis ni un grafo universal.

### H1. Evidencia usada para decidir

| Fuente | Qué aporta al esquema | Etiqueta |
|---|---|---|
| Cochrane Handbook cap. 5 | Formulario **fijo antes de leer**; outcome = dominio + métrica + unidad + momento + n | [externo, ya citado arriba] |
| COMET outcome taxonomy (Dodd et al., J Clin Epidemiol 2018) | 38 dominios en 5 áreas (mortalidad, fisiológico/clínico, impacto en vida, recursos, adversos); lo fisiológico **se agrupa por sistema corporal** | [externo] |
| OECD Adverse Outcome Pathways | Cadena **evento inicial → eventos clave → desenlace**, cada salto ubicado en un **nivel biológico** (molecular, celular, tejido, órgano, organismo) y unido por relaciones causales citadas (KER) | [externo] |
| SemRep / SemMedDB (NLM) | Relaciones extraídas de PubMed como sujeto–**predicado cerrado**–objeto (CAUSES, INHIBITS, STIMULATES, AFFECTS, ASSOCIATED_WITH, PREVENTS…) | [externo] |
| SWiM (Campbell et al., BMJ 2020) | Sin escala común → resumir por **dirección del efecto**, no por media | [externo] |
| MeSH (NLM, gratuito) árboles A (anatomía) y C (enfermedades por sistema) | Vocabulario libre por sistema para construir la tabla alias → 7 capas, sin licencia (a diferencia de MedDRA) | [externo] |
| LLM extrayendo cifras de RCT (PMC12448672, 699 abstracts) | Tamaño de grupo 91–94 %; eventos binarios 57–71 %; **media/DE continuas 24–56 %** | [externo] |
| Catálogo vitamina D del repo | 10 aristas de cadena: **6 sin cita**, 3 de revisiones narrativas, 1 de metaanálisis. Hallazgos: 11 de 21 son de revisiones | [repo] |

Conclusiones que fuerzan el diseño:
1. La **cadena (pipeline)** casi nunca sale de un ensayo; sale de revisiones → hace falta un tipo de fila propio para los saltos y marcar su origen.
2. Las **cifras continuas** son lo que peor extrae un LLM → pocas cifras, siempre con gate; la **dirección** es la unidad fuerte.
3. Las **7 capas** agrupan demasiado (endocrino, cardiovascular, digestivo, renal y músculo caen en «órganos») → se guarda además un **sistema** fino, sin tocar las 7 capas del visor.

### H2. El esquema (v1)

Sobre (igual que el cerrado arriba) + tres tipos de fila. Todas las filas comparten: `paperId`, `quote` (⊆ texto guardado), `design`, `n_paper`, `population` (texto corto del paper | null).

```text
TopicFill v1
  schema_version: "1"
  query, query_used_en        # consulta del usuario y la enviada (C6)
  kind: enfermedad | hormona | vitamina | sintoma
  source: pubmed | openalex   # un lote = una fuente (G11)
  papers[≤5]: { id, ranking_position, design, n_paper, text_hash, has_abstract }
  effects[]  measures[]  links[]

Effect      # «X afecta a esta diana» → alimenta capas on/off y dirección
  target        # entidad del paper tal cual (p. ej. "LDL cholesterol", "bone mineral density")
  system        # enum ~14 derivado de MeSH A/C (tabla, no LLM)
  layer         # 7 capas | unmapped — por tabla alias (D4), nunca por el LLM
  level         # molecular | celular | tejido | organo | organismo (AOP)
  predicate     # aumenta | disminuye | sin_efecto | asociado | mixto
  evidence_kind # medido | afirmado_revision   (dato propio vs lo que cita una revisión)

Measure     # cifra concreta; SOLO slots de la lista del kind
  slot, value, unit, metric, timepoint | null
  target, layer                # igual que Effect

Link        # un salto de la cadena, solo si UNA quote lo afirma
  from_target, to_target, predicate   # aumenta | disminuye | activa | inhibe | causa
  from_layer, to_layer                # por tabla
```

**Slots de Measure (cerrados, pocos a propósito):**

| kind | slots |
|---|---|
| común | `n`, `dose` (+unit), `effect_size` (+metric: OR/RR/HR/MD/SMD) |
| hormona | `concentration` (+unit, `timepoint`), `ref_low`/`ref_high` solo si el mismo paper los da |
| vitamina | `serum_level` (+unit), `threshold` (del paper) |
| enfermedad | `prevalence`, `incidence`, `mortality` |
| sintoma | `score` (+`scale_name` literal) , `prevalence` |

**Sistema → capa (tabla de producto, versionada, fail-close):**

| system (MeSH origen) | capa |
|---|---|
| sangre (A12 sangre, A15 hemático, C15) | sangre |
| inmune/linfático (A15 inmune, C20) | linfatico |
| cardiovascular (A07, C14) · respiratorio (A04, C08) · digestivo/hígado (A03, C06) · renal/urogenital (A05, C12) · endocrino (A06, C19) · metabólico (C18) | organos |
| músculo-esquelético (A02, C05) | hueso |
| piel (A17, C17 piel) | piel |
| nervioso/mental (A08, C10, F03) | nervioso |
| ojo/oído (A09, C09, C11) | sentidos |
| resto | unmapped |

Músculo en `hueso`: MeSH lo agrupa como musculoesquelético; el catálogo actual lo pone en `nervioso` (neuromuscular). **Decisión del dueño.**

### H3. Cómo se ve el resultado (sin calcular clínica)

- **Capa:** encendida si ≥1 Effect/Measure; texto «k de N papers hablan de esta capa» (C1).
- **Dirección por diana:** «3 ↓ · 1 sin efecto» (conteo, SWiM). Nada de medias aquí.
- **Cifra:** solo si mismo `slot`+`metric`+`unit`: mediana + min–max + n (con ≤5 valores la mediana resiste un extremo; propuesta B). Detalle: cada valor con quote.
- **Pipeline:** grafo de Links ordenado por `level` (molecular→organismo) y capa. Sin Links → la lista de capas sin flechas y el aviso «ningún paper del lote describe la cadena». Nunca se infiere un salto.

### H4. Contraste con lo que esperaría un humano (clínico/investigador)

**Prueba de papel — «hipotiroidismo» (enfermedad):** lo que un endocrino espera ver: TSH ↑ / T4 ↓ (sangre), LDL ↑ (sangre/metabólico), bradicardia (cardio→órganos), fatiga y lentitud cognitiva (nervioso), piel seca/mixedema (piel), cadena «T4 ↓ → receptor LDL ↓ → LDL ↑». Con el esquema: las cinco capas salen como Effects con dirección; TSH/T4 como `concentration`; la cadena solo si una revisión del lote la escribe. **Encaja.** Lo que falta: la bradicardia cae en «órganos» junto al hígado; `system=cardiovascular` lo preserva en la ficha.

**Prueba de papel — «vitamina D» (gold set del repo):** las diez aristas del catálogo serían Links; seis no tienen cita → **no entrarían**. Esto no es un fallo del esquema: es el esquema diciendo la verdad sobre el catálogo (hoy el catálogo muestra cadenas que no están citadas).

| Pregunta humana | ¿Responde? | Por qué |
|---|---|---|
| ¿Dónde golpea? | Sí | Effects + tabla de capas mecánica |
| ¿Sube o baja? | Sí, y robusto | Dirección con quote; no depende de unidades |
| ¿Cuánto? | Parcial | Solo slots cerrados; continuas mal extraídas por LLM; con 5 papers la cifra es orientativa |
| ¿Por qué camino llega? | Parcial | Solo si el lote trae revisiones; ensayos casi nunca describen la cadena |
| ¿Es causal o solo asociación? | Sí | `predicate=asociado` separado de aumenta/disminuye + `design` visible |
| ¿Cuán fiable? | Parcial | design + n por fila; ranking de fuente ≠ calidad (D6) |
| ¿Es exhaustivo? | No, y lo dice | lote 5 de N; «silencio ≠ ausencia» |

**Veredicto:** el esquema es suficiente para la tarea (mapa de capas + dirección + cadena citada), no para magnitudes comparables ni para cobertura exhaustiva. Las dos mejoras de mayor rendimiento, ambas dentro de lo ya abierto:
1. Lote **mixto**: parte de revisiones (`systematic[sb]`/review) para que haya Links, parte de primarios para Measures (C3, G10). Sin esto, el pipeline saldrá casi siempre vacío.
2. **MeSH del propio paper** (viene en `efetch` de PubMed) como pista extra de sistema a nivel de paper; no sustituye la quote. OpenAlex no trae MeSH → en esa fuente solo tabla de alias.

### H5. Qué queda para lock definitivo

- OK del dueño a: tres tipos de fila, `system` fino, músculo→hueso o nervioso, mediana vs media.
- Prueba E con este v1 sobre «TSH»/«hipotiroidismo» y sobre el gold set, midiendo: Effects por paper, Links por paper (revisión vs primario), Measures que pasan el gate, % `unmapped` (G14).
- Verificar en red real (no accesible desde esta sesión: NCBI bloqueado por el proxy) `systematic[sb]` y la presencia de MeSH en `efetch`.

Fuentes H: [COMET taxonomy](https://www.comet-initiative.org/Resources/OutcomeClassification) · [Dodd 2018](https://www.sciencedirect.com/science/article/pii/S0895435617305899) · [OECD AOP](https://www.oecd.org/en/topics/sub-issues/testing-of-chemicals/adverse-outcome-pathways.html) · [SemRep](https://pmc.ncbi.nlm.nih.gov/articles/PMC7222583/) · [SemMedDB](https://academic.oup.com/bioinformatics/article/28/23/3158/195282) · [LLM extracción RCT](https://pmc.ncbi.nlm.nih.gov/articles/PMC12448672/) · [MeSH 2022 por categoría](https://www.nlm.nih.gov/mesh/2022/download/NewHeadingsbycategoryforMeSHYear.pdf)

## Status

- isolate: done
- contraste externo 2026-09-21: sección G añadida (G1–G5 despejadas, G6–G9 abiertas, G10–G14 huecos nuevos)
- ampliación 2026-09-21: ideas y huecos añadidos (secciones A–F). **Nada cerrado** por esta ampliación.
- esquema v1 2026-09-26: sección H (propuesta con evidencia y contraste); lock pendiente de OK del dueño + prueba E
- plan: draft, schema v1 propuesto
- apply: blocked hasta lock de slots + mapa de capas
- verify: pending
