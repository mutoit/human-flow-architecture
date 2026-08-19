---
status: done
source: direct
tier: L
mode: graph-strict
date: 2026-08-19
slug: catalogo-evidencia-cascada
repro: "n/a — no es bug, es reemplazo de motor por decisión de diseño (ver docs/CORE.md §Qué se descarta)"
legitimidad: incorrecto
decision: eliminar
target_ola: null
---

## Scope

Origen: `docs/superpowers/specs/2026-08-19-catalogo-evidencia-cascada-design.md`
(spec aprobado tras brainstorming). Este md es el SoT de planificación —
el spec queda intacto como diseño de referencia, no se reescribe aquí.

Implementar el pivote acordado: el motor deja de **calcular** un estado
clínico (ratio/threshold/strength ponderado) y pasa a **transcribir**
literalmente `findings` autorados por escenario, con soporte de
hallazgos contradictorios, más el catálogo de temas en Postgres/Vercel.

**Fuera de alcance de este plan (no es deuda oculta):** ver spec §4-§5
(fusión de datasets, endpoint LLM en caliente, panel de revisión con UI,
auth/roles).

## DIAGNÓSTICO

```text
síntoma:  el motor produce un "estado clínico" (nodeStates[id].value/ratio/status)
          calculado por ratio×threshold + promedio ponderado por strength — un
          número que ningún estudio real midió, presentado como si lo fuera.
origen:   src/engine/propagation.js (buildGraph → topoSort → propagate →
          statusFor) + el propio esquema de dataset (thresholdMin/Max,
          strength, symptomsBySeverity) que lo alimenta.
provoca:  cualquier nodo con >1 edge entrante o entrada continua se resuelve
          por fórmula propia (media ponderada, interpolación lineal), no por
          lo que dice la literatura — fabricación de precisión clínica.
familia:  seed-vs-runtime  (un valor "de relleno" — el cálculo — se cuela en
          el path de producción/pantalla donde el usuario lo lee como dato
          real; el remedio es sustituirlo por datos autorados honestos, no
          parchear la fórmula)
remedio:  eliminar el cálculo; nodeStates[id] pasa a ser un lookup directo
          de `node.findings[scenarioId]` (uno, varios, o "contradictorio"
          si discrepan) — cero aritmética clínica en el radio.
```

## LEGITIMIDAD

```text
flujo_actual: incorrecto  (decisión ya tomada y documentada en docs/CORE.md
              §"Qué se descarta" — no es una opinión de este plan, es la
              conclusión ya aprobada del brainstorming)
decisión:     eliminar (el motor de ratio/threshold/strength-ponderado)
nota:         src/engine/propagation.js:53-324 — sustituir, no envolver
```

## Industry

`N/A — patrón repo`. La decisión de "transcribir, no calcular" es una
decisión de producto/ética de datos (discutida y aprobada en brainstorming
con el usuario), no un patrón de industria a comparar — ver spec §0.

---

## Modo: graph-strict · Tier: L → 2 olas (PR por ola)

Tamaño real (esquema + engine + UI + Postgres + pipeline de verificación +
revisión) excede un solo pase seguro. Se divide en **Ola 1** (cambios
client-side, sin dependencias de infraestructura nueva — ejecutable ya) y
**Ola 2** (catálogo Postgres/Vercel + pipeline de import/verificación —
bloqueada por una decisión de infraestructura, ver "Bloqueo" al final).
Este documento planifica ambas; **solo Ola 1 se ejecuta en este pase**.

## Ola 1 — Motor + esquema + UI (client-side, sin infra nueva)

### Punto 1: Motor — sustituir cálculo por lookup de findings

| Nodo | path · Symbol | Rol |
|------|---------------|-----|
| propagate | `src/engine/propagation.js:129` | orquesta hoy ratio/threshold; pasa a resolver `findings[scenarioId]` por nodo, sin ponderar |
| buildGraph | `src/engine/propagation.js:53` | se mantiene (aún hace falta el grafo para `pathFromPrimary` y edges "cómo llegó") |
| topoSort | `src/engine/propagation.js:77` | se elimina — ya no hace falta orden topológico sin cálculo iterativo/ciclos |
| statusFor / cálculo ratio-ponderado | `src/engine/propagation.js:~150-280` | se elimina — sustituido por `resolveNodeState(node, scenarioId)`: 0 findings→inactivo, 1 finding→su `state`, >1 states distintos→`"contradictorio"` |
| pathFromPrimary | `src/engine/propagation.js:309` | se mantiene — sigue siendo cadena causal por edges documentados, no cálculo |

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|------|---------------|------|------------|
| e1 | `App.jsx:48 aggregateReach` → `propagate` | caller | sí — `propagate(dataset, primaryValue)` cambia a `propagate(dataset, scenarioId)`; `nodeStates[id]` pasa de `{value,ratio,status}` a `{state, findings[]}` |
| e2 | `propagate` → `nodeReach`/`layerReach` (App.jsx:52,60) | consumer de estado | sí — deben aceptar el nuevo shape (incluye `"contradictorio"`) |

Superficie impactada: toda la lógica de "cuánto se ilumina" un nodo/capa
(BodySilhouette, LayerCascade leen `nodeReach`/`layerReach` — no se tocan
directamente si consumen solo el `state` final, pero **deben poder pintar
un 4º estado visual** — ver Punto 4).

### Punto 2: Esquema de dataset — validación al nuevo shape

| Nodo | path · Symbol | Rol |
|------|---------------|-----|
| validateDataset | `src/data/ImportControl.jsx:5` | valida hoy `thresholdMin/Max` y `references[]` planos; pasa a validar `findings{scenarioId: [...]}`, `claimUsage` opcional, `citation.evidenceTier`/`supersededBy` opcionales |

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|------|---------------|------|------------|
| e3 | `ImportControl.jsx:35 handleFile` → `validateDataset` | caller | sí — mensajes de error deben referirse a los campos nuevos, no a threshold |

### Punto 3: Citas — recorrer `findings`/edges en cascada, no `references[]` plano

| Nodo | path · Symbol | Rol |
|------|---------------|-----|
| collectReferences | `src/engine/citations.js:9` | itera hoy `node.references[]`; pasa a iterar `node.findings[*][*].citation` + `edge.citation`, deduplicando igual que hoy por `pmid`/`url` |

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|------|---------------|------|------------|
| e4 | `FuentesMenu.jsx:32 openReadingsTab` → `collectReferences` | caller | sí — shape de `groups` puede ganar `claimUsage`/`evidenceTier` por entrada |
| e5 | `FuentesMenu.jsx:72 downloadReadingsList` → `collectReferences` | caller | sí — export de texto debe incluir `claimUsage` si existe (es el "cómo lo hemos usado" pedido) |

### Punto 4: UI de ficha — findings en paralelo + estado "contradictorio"

| Nodo | path · Symbol | Rol |
|------|---------------|-----|
| DetailCard | `src/detail/DetailCard.jsx:34` | hoy lee `node.symptomsBySeverity`, `node.references`, `edge.strength` numérico; pasa a listar cada `finding` del escenario activo por separado con su cita/`claimUsage`, ordenados por `evidenceTier` si existe; `edge.strength` se muestra como etiqueta cualitativa (fuerte/moderada/débil), no `%` |
| SourcesTab | `src/detail/SourcesTab.jsx` | consumidor de `collectReferences` — recibe el shape nuevo del Punto 3 |

Superficie impactada: cualquier lugar que pinte color por `nodeStates[id].status`
gana un 4º valor posible (`"contradictorio"`) — requiere entrada en la
leyenda de color (buscar en `src/body/`, `src/layers/` dónde vive el mapeo
estado→color, sin asumir el nombre — inspeccionar antes de tocar).

### Punto 5: Dataset de referencia + prompt generador

| Nodo | path · Symbol | Rol |
|------|---------------|-----|
| vitamin-d.json | `src/data/vitamin-d.json` | dataset demo actual, en esquema viejo — se reescribe al esquema `findings` (mínimo viable, no hace falta recuperar exhaustividad completa) para no dejar la demo rota |
| DATASET_PROMPT.md | `docs/DATASET_PROMPT.md` | reescribir contrato de salida al esquema en cascada (findings, claimUsage opcional, evidenceTier, supersededBy) — sustituye por completo la sección de `thresholdMin/Max`/`strength`-ponderado/`symptomsBySeverity` |

## CLASIFICACIÓN (radio)

```text
propagation.js (cálculo ratio/threshold/strength)  → incorrecto → eliminar
buildGraph / pathFromPrimary                        → válido    → absorber (sin cambios de fondo)
validateDataset / collectReferences                  → mixto     → refactorizar (misma función, nuevo shape)
DetailCard / SourcesTab / FuentesMenu                → mixto     → refactorizar (misma UI, nuevos campos)
vitamin-d.json / DATASET_PROMPT.md                   → incorrecto→ reemplazar contenido al esquema nuevo
```

## IMPACTO

- Si no se propaga e1/e2: `App.jsx` sigue llamando `propagate(dataset, primaryValue)` con un slider que ya no existe conceptualmente — build roto, no solo desalineado.
- Si no se propaga e3: import acepta datasets con el esquema viejo sin avisar — se reintroduce silenciosamente lo que este plan elimina.
- Si no se propaga e4/e5: la pestaña "Lecturas" y el export dejan de mostrar `claimUsage`, perdiendo justo el "cómo lo hemos usado" que el usuario pidió explícitamente.
- Superficie UI: el slider continuo (si existe como control en algún componente — inspeccionar antes de tocar, no asumido en el touch graph de arriba) pasa a selector discreto de escenarios; hay que localizarlo con `mapRelated`/`findCallers` en tiempo de ejecución del block, no queda fijado aquí para no inventar un símbolo no verificado.

## Propagación (checklist por edge)

- [x] e1 `App.jsx` llama `propagate(dataset, scenarioId)`; `nodeStates[id]` es `{state, findings[]}`
- [x] e2 `nodeReach`/`layerReach` aceptan `"contradictorio"` (rank hit > contradictorio > faint > spared)
- [x] e3 `validateDataset` exige `findings`, rechaza `thresholdMin/Max`, `symptomsBySeverity`, `references[]` planos
- [x] e4 `FuentesMenu` openReadingsTab muestra `claimUsage`/`evidenceTier`
- [x] e5 export markdown incluye `claimUsage`
- [x] Slider continuo: no existía; `ScenarioSelector` ya era discreto — se quitó `primaryValue`/`sliderDefault` del path

## Execution blocks (1:1 con Puntos 1-5)

1. **Motor** — reescribir `propagation.js`: eliminar `topoSort`/cálculo ponderado, añadir `resolveNodeState`. Sin cálculo iterativo de ciclos (ya no aplica).
2. **Esquema/import** — reescribir `validateDataset` al shape `findings`.
3. **Citas** — reescribir `collectReferences` para recorrer `findings`/edges.
4. **UI ficha** — `DetailCard`/`SourcesTab`: findings en paralelo, 4º estado visual, `strength` cualitativo; localizar y sustituir el control de escenario (slider→selector).
5. **Dataset demo + prompt** — reescribir `vitamin-d.json` (mínimo viable) y `docs/DATASET_PROMPT.md` al esquema nuevo.

## VERIFY (radio del cambio)

```text
VERIFY:
- Repro: n/a (no bug) — checklist funcional en su lugar ......... sí
- App carga vitamin-d.json reescrito sin error de validación .... sí (validateDataset(demo)=null; vite build ok)
- Escenario con 1 finding por nodo pinta el estado correcto ...... sí (severa.serum_d=critical; normal.bone=null/spared)
- Escenario con findings contradictorios pinta "contradictorio" .. sí (severa.immune=contradictorio, 2 states)
- Ficha muestra findings en paralelo con cita + claimUsage ....... sí (DetailCard lista findings; no click de UI: browsermcp no conectó)
- Export "Lecturas" incluye claimUsage cuando existe .............. sí (FuentesMenu markdown + HTML)
- Callers e1-e5 propagados (checklist arriba) ..................... sí
- Sin referencias a thresholdMin/Max/strength-ponderado en engine . sí
- Sin stubs en el flujo tocado ..................................... sí
- Tests: n/a (no hay suite en el repo; no se pide) ................. n/a
```

## Status

Ola 1 ejecutada (motor lookup, schema, citas, UI 4º estado, demo + prompt).
Ola 2 no tocada (bloqueo de infra intacto).

Dev: `http://localhost:5173/` (vite quedó levantado).
Escenario **Severa** + nodo **Sistema inmune / linfático** = contradictorio (Martineau vs Autier).

---

## Ola 2 — Catálogo Postgres/Vercel (no se ejecuta en este pase)

Cubre spec §2 y §3: tablas `topics`/`topic_versions`/`topic_reviews`,
buscador como entrada principal, CTA "descargar prompt" en estado vacío,
pipeline de verificación de citas (PubMed/Europe PMC/Crossref) al
importar. Requiere decisiones de infraestructura que no están cerradas
todavía (ver Bloqueo) — se planifica en detalle en un okplan aparte una
vez resueltas, para no fijar un touch graph sobre símbolos/servicios que
todavía no existen en el repo.

### Bloqueo — necesito esto antes de planificar Ola 2 en detalle

1. ¿Ya existe un proyecto Vercel enlazado a este repo, con Postgres
   (Neon) provisionado? Si no, hay que crearlo antes de que el touch
   graph tenga sentido (no hay símbolos reales que anclar todavía).
2. ¿Prefieres que el import (validación + verificación de citas) corra
   como función serverless de Vercel, o seguimos 100% client-side y la
   verificación de citas se hace con `fetch` directo desde el navegador
   contra las APIs públicas de PubMed/Crossref (más simple, sin backend,
   pero expone la llamada y sus límites de rate al cliente)?
