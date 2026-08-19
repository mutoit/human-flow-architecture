---
status: done
source: direct
tier: L
mode: graph-strict
legitimidad: mixto — App.jsx/styles.css válido/refactorizar (ver LEGITIMIDAD Rev5)
date: 2026-08-19
spec: docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md (Rev 4, §8-§10)
rev4_status: done — ver "## Plan (Rev4...)" abajo, histórico, no se reabre
superseded_note: >
  [Rev1, histórico] El visual (grafo de capas apiladas) construido con el
  plan original fue descartado por el usuario a nivel de diseño ("no
  quiero nada de lo que hiciste, a nivel visual, es horrible, se muere").
  La spec pasó por Rev2→Rev3→Rev4: referencia real encontrada en `GROK/`
  (muñeco) y `GROK/segunda vista/` (grafo por subcapas), fusión de ambas
  vistas + requisito de fuentes/cadena causal por nodo (spec §10). El
  `## Plan` de abajo sustituye al de Rev1 en este mismo archivo (SoT
  único) — Rev1 queda documentado como histórico, no se repite.
---

# Visor de Flujo Biofísico — MVP

## Report (mínimo)

**Scope:** construir el visor MVP descrito en la spec — app client-side
(Vite+React+SVG custom) que renderiza un grafo de 7 capas, propaga un valor
primario por edges, anima el flujo (3 variantes comparables), permite
reproducción automática de la cascada, muestra panel de detalle por nodo, y
permite importar un JSON de pathway distinto sin tocar código.

**Fuera de alcance (explícito):** panel admin, auth/billing, backend,
multi-dependencia AND/OR, feedback loops, personalización por paciente —
documentado en spec §7 como limitaciones conocidas, no deuda oculta.

**Código previo:** ninguno. Repo inicializado (`git init` ya hecho), solo la
spec está commiteada. No hay bug ni fallo — proyecto neto nuevo.

## Plan (Rev 4 — reemplaza el plan Rev1 de arriba)

> El `## Report (mínimo)` de arriba describe el alcance original (Rev1,
> histórico). Este `## Plan` construye sobre motor+dataset ya existentes
> (no greenfield) según spec Rev4 (`docs/superpowers/specs/
> 2026-08-19-visor-flujo-mvp-design.md` §8–§10).

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — feature nueva (rediseño visual completo sobre motor
  existente). No hay bug en engine/propagation.js (sigue válido). Rev1
  (src/graph/*) fue rechazada por el usuario a nivel de diseño, no de
  lógica — el "arreglo" es demoler y reconstruir la capa de presentación
  con referencias visuales reales (GROK/), no parchear Rev1.
  Ver spec Rev4 §8-§10 para el análisis completo de qué se porta y por qué.
```

### Tier

**M** — reconstrucción completa de la capa de presentación (2 vistas
fusionadas + ficha compartida + pestaña de fuentes) sobre un motor que se
extiende sin romper su contrato público (`propagate`/`nodeConnections`),
~15 archivos con lógica real, dataset migrado a nueva taxonomía de capas.

### Scope

- **UI nueva:** silueta SVG (§8), grafo de capas por subcapas (§9), lista
  de capas compartida, ficha de detalle unificada con cadena causal
  (§10.1), selector de severidad, tira de vitales, pestaña de fuentes +
  descarga de dataset (§10.3). Layout responsive 3 columnas / colapso a
  tabs (§9).
- **Engine (extensión, no reescritura):** `pathFromPrimary` (cadena desde
  el nodo primario, §10.1), `collectReferences` (agregación deduplicada
  de citas, §10.3), mapeo `status`→estado visual (§8/§9).
- **Data:** `vitamin-d.json` migrado a taxonomía anatómica de 7 capas
  (sangre/órganos/hueso/linfático/piel/nervioso/sentidos) + campos Rev2
  §2 (`bodyRegion`, `composition`, `symptomsBySeverity`, `timeToAppear`,
  `keyFacts`, `references`, `severityScenarios`, `vitalNodeIds`),
  sembrado con las citas PMID reales de `GROK/src/lib/flow-data.ts` donde
  el nodo corresponda — nunca inventadas (spec §10.2).
- **Eliminar:** `src/graph/*` completo (Rev1, descartado).
- **Fuera:** todo lo ya excluido en spec §1/§7 (panel admin, auth,
  backend, AND/OR, feedback loops).

### LEGITIMIDAD

```text
LEGITIMIDAD (por nodo relevante):
  engine/propagation.js       válido    → absorber + extender (no reescribir propagate/nodeConnections)
  src/graph/GraphCanvas.jsx   incorrecto→ eliminar (Rev1 descartado por el usuario)
  src/graph/LayerRow.jsx      incorrecto→ eliminar
  src/graph/NodeCard.jsx      incorrecto→ eliminar
  src/graph/EdgeFlow.jsx      incorrecto→ eliminar
  src/graph/layout.js         incorrecto→ eliminar
  src/graph/DetailPanel.jsx   incorrecto→ eliminar (reemplazado por detail/DetailCard.jsx)
  src/graph/ImportControl.jsx válido    → absorber, mover a src/data/ImportControl.jsx (misma lógica, sin reescribir)
  src/data/vitamin-d.json     mixto     → refactorizar (taxonomía de capas cambia; contrato interno id/layer/thresholdMin/Max/critical/lagHours/edges se conserva intacto)
  src/App.jsx                 mixto     → refactorizar (hooks de play/slider se conservan conceptualmente; árbol de render se reemplaza entero)
  src/styles.css              mixto     → refactorizar (tokens nuevos añadidos; reglas específicas de Rev1 se eliminan)
```

### Industry

- Paleta/tipografía/tokens: no son decisión abierta — son datos exactos
  copiados de `GROK/src/styles.css` (ya aprobados visualmente por el
  usuario al señalar esa carpeta como referencia). No requiere industry
  externa adicional.
- Iconos: GROK usa `lucide-react`. Decisión de este plan: **no añadir esa
  dependencia** — se portan solo los 2 iconos usados (Play, ExternalLink)
  como SVG inline, coherente con "sin librerías externas" ya establecido
  para la silueta (spec §5). Riesgo bajo, revertible si se prefiere la
  librería.
- Layout 3 columnas responsive: patrón CSS Grid estándar
  (`grid-template-columns` + `@media`), sin librería — **needs
  verification** solo en el breakpoint exacto (spec §9, deja el número a
  decidir con medidas reales durante implementación, no bloqueante).

### Discovery / Modo

```text
Modo: A (paquete code-intel local en src/code-intel, pack `humanflow`
activo — ver .code-intel/config.json). graph-strict: mapRelated + inspect
+ findCallers ejecutados sobre `propagate`, `App`, `ImportControl` en esta
sesión (radio confirmado, no hay callers fuera de src/App.jsx). GROK/ está
fuera del índice del pack (pathPrefixes = src/engine|src/graph|src/data);
su código se leyó directamente como referencia, no vía code-intel.
```

### TOUCH GRAPH

#### TOCAR

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/App.jsx` | `App` (línea 16) | Reescribe árbol de render completo; conserva hooks de dataset/play, quita imports de `src/graph/*` |
| `src/engine/propagation.js` | `propagate`, `nodeConnections` (líneas 97, 160) | Se añaden `pathFromPrimary`, se mantiene firma pública intacta |
| `src/engine/citations.js` | nuevo | `collectReferences(dataset)` — pura, dedupe por `pmid`/`url` |
| `src/engine/visualState.js` | nuevo | Puerto de `GROK/src/lib/visual-state.ts` — `reachFromStatus(status)`, `visualState(...)` |
| `src/data/vitamin-d.json` | dataset | Migración de taxonomía + campos nuevos (spec §2) |
| `src/data/ImportControl.jsx` | `ImportControl`, `validateDataset` (movido desde `src/graph/`) | Sin cambios de lógica, solo ruta |
| `src/body/BodySilhouette.jsx`, `src/body/bodyRegions.js` | nuevo | Puerto de `GROK/src/components/body-figure.tsx` + `src/lib/anatomy.ts` |
| `src/layers/LayerList.jsx` | nuevo | Puerto de `GROK/src/components/layer-rail.tsx` |
| `src/layers/LayerCascade.jsx` | nuevo | Puerto de `GROK/segunda vista/app.js` (`renderCascade`) a JSX, datos desde `dataset.nodes` agrupados por `layer` |
| `src/detail/DetailCard.jsx` | nuevo | Fusión de `GROK/.../layer-detail.tsx` + `segunda vista/app.js renderDetail()` + bloque causal §10.1 (`pathFromPrimary`) |
| `src/detail/ScenarioSelector.jsx` | nuevo | Puerto de `severity-switch.tsx`, alimentado por `config.severityScenarios` |
| `src/detail/VitalsBar.jsx` | nuevo | Puerto de `labs-strip.tsx`, alimentado por `config.vitalNodeIds` |
| `src/detail/SourcesTab.jsx` | nuevo | §10.3 — lista de `collectReferences()` + botón descargar dataset (`Blob`) |
| `src/styles.css` | tokens + layout | Tokens de `GROK/src/styles.css` (colores/fuentes/radios), grid responsive 3 columnas (§9), reglas de `src/graph/*` eliminadas |
| `index.html` | `<head>` | Añade `<link>` Google Fonts (Newsreader/IBM Plex, misma URL que GROK) |

#### ELIMINAR

| Archivo | Por qué |
|---|---|
| `src/graph/GraphCanvas.jsx` | Rev1 descartado |
| `src/graph/LayerRow.jsx` | Rev1 descartado |
| `src/graph/NodeCard.jsx` | Rev1 descartado |
| `src/graph/EdgeFlow.jsx` | Rev1 descartado |
| `src/graph/layout.js` | Rev1 descartado |
| `src/graph/DetailPanel.jsx` | Rev1 descartado, reemplazado por `detail/DetailCard.jsx` |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `GROK/**` | Referencia de solo lectura, no se ejecuta ni se importa — se porta código leyéndolo, no se enlaza |
| `docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md` | Spec ya aprobada, insumo de este plan |
| `.code-intel/**`, `src/code-intel/**` | Herramienta de desarrollo, fuera de radio de producto |

#### Edges (multi-hop, radio del cambio)

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `main.jsx` → `App.jsx` | render | sí — sin cambios de contrato, ya funciona |
| e2 | `App.jsx` → `engine/propagation.js` (`propagate`) | consumo | sí — firma intacta, ya lo llama App.jsx:25 |
| e3 | `App.jsx` → `engine/propagation.js` (`pathFromPrimary`, nuevo) | consumo nuevo | sí — usado por `DetailCard` vía props desde `App` |
| e4 | `App.jsx` → `engine/citations.js`, `engine/visualState.js` | consumo nuevo | sí — nuevos imports en App.jsx |
| e5 | `App.jsx` → `body/BodySilhouette.jsx`, `layers/LayerList.jsx`, `layers/LayerCascade.jsx`, `detail/DetailCard.jsx`, `detail/ScenarioSelector.jsx`, `detail/VitalsBar.jsx`, `detail/SourcesTab.jsx` | render | sí — árbol nuevo completo, reemplaza e3-e6 de Rev1 |
| e6 | `data/ImportControl.jsx` → `App.jsx` (`onImport`) | callback | sí — mismo contrato que Rev1 (`setDataset`), solo cambia la ruta del import en `App.jsx` |
| e7 | `data/vitamin-d.json` → `App.jsx` (estado inicial) | import estático | sí — dataset migrado, mismo punto de entrada |
| e8 (eliminación) | `App.jsx` → `src/graph/GraphCanvas.jsx`/`DetailPanel.jsx` | import muerto | sí — se retiran esos imports al reescribir `App.jsx` |

Superficie impactada: solo esta app local (`npm run dev`), sin release
externo. Efectos secundarios: ninguno fuera del propio proceso de render.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  engine/propagation.js  válido     → absorber + extender
  src/graph/*             incorrecto → eliminar (todo, ya decidido)
  ImportControl/validateDataset  válido → absorber sin reescribir
  vitamin-d.json          deuda (taxonomía desalineada con capas anatómicas de la vista) → refactor en esta ola (Punto 3)
```

No hay duplicación nueva: cada componente portado tiene un único origen
(GROK) y un único destino (carpeta nueva), sin dos implementaciones
conviviendo tras el Punto de eliminación.

### CONTRATOS/POLÍTICAS

`n/a` — no hay contratos de API pública ni políticas de repo
preexistentes más allá de la propia spec (que este plan sigue).

### IMPACTO

- Si `src/graph/*` no se elimina en el mismo Punto en que se reemplaza su
  uso en `App.jsx` → código muerto conviviendo con Rev4, riesgo de
  confusión futura (bloqueante, por eso Punto 1 hace ambas cosas juntas).
- Si `pathFromPrimary`/`collectReferences` cambiaran la firma de
  `propagate`/`nodeConnections` en vez de añadirse aparte → rompería
  `ImportControl`/`App.jsx` que ya los consumen — por diseño son
  funciones nuevas, no modifican lo existente.
- Si la migración del dataset (Punto 3) no conserva
  `id/layer/thresholdMin/Max/critical/lagHours` por nodo → `propagate()`
  deja de calcular estados (rompe el motor) — DoD del Punto 3 exige
  `npm run dev` con estados calculados correctamente tras la migración,
  antes de tocar ningún componente visual.
- Si `DetailCard` no es un componente único compartido entre silueta,
  lista y grafo de subcapas (§10.1) → riesgo de tres fichas
  desincronizadas, violando el requisito explícito del usuario ("un solo
  estado de selección compartido").
- Superficie: solo local, sin deploy en este plan.

### Cambios (execution blocks)

Cada Punto = 1 execution block, ejecutado en este orden por dependencia.
Puntos sin dependencia mutua (4, 5, 7) pueden implementarse en paralelo
tras cerrar 1–3.

#### Punto 1 — Eliminar Rev1 + tokens base
Borrar `src/graph/*` (6 archivos). Añadir tokens de color/fuente
(`src/styles.css`, copiados de `GROK/src/styles.css`) + `<link>` Google
Fonts en `index.html`. `App.jsx` queda temporalmente con un `<div>`
placeholder (sin imports rotos). DoD: `npm run dev` sin errores de
consola, sin ningún import a `src/graph/*` restante (`grep` limpio),
fondo/tipografía ya con la paleta nueva.

#### Punto 2 — Engine: extensión sin romper contrato
`engine/propagation.js`: añadir `pathFromPrimary(dataset, nodeId,
nodeStates?)` (BFS inverso desde `nodeId` hasta `primaryId` siguiendo
`incoming`, eligiendo el edge de mayor `strength` en cada paso si hay
varios padres — cadena representativa, no todas las rutas). Nuevo
`engine/citations.js` con `collectReferences(dataset)` (recorre
`dataset.nodes[].references`, dedupe por `pmid`||`url`, agrupa por
`nodeId`). Nuevo `engine/visualState.js` con `reachFromStatus(status)`
(`critical→'hit'`, `warning→'faint'`, `ok→'spared'`) y `visualState(...)`
(puerto directo de `GROK/src/lib/visual-state.ts`, misma máquina de 5
estados). DoD: las 3 funciones son puras, verificables en consola/REPL
con el dataset actual antes de migrarlo.

#### Punto 3 — Dataset: migración de taxonomía + campos Rev2
Migrar `src/data/vitamin-d.json` a capas `sangre/organos/hueso/
linfatico/piel/nervioso/sentidos` (spec §4 catálogo cerrado de
`bodyRegion`), reasignando los 10 nodos existentes + añadiendo los que
falten para cubrir subnodos anatómicos razonables (ej. Órganos → Hígado/
Riñón/Intestino, ya presentes como `liver`/`kidney`; añadir 1-2 más si
hace falta cohesión). Añadir `composition`, `symptomsBySeverity`,
`timeToAppear`, `keyFacts`, `references` (sembrado con PMIDs reales de
`GROK/src/lib/flow-data.ts` donde el nodo corresponda; vacío si no hay
cita real — nunca inventada, spec §10.2), `config.severityScenarios`,
`config.vitalNodeIds`. DoD: `propagate()` sigue devolviendo `nodeStates`
válidos para el dataset migrado (mismo `npm run dev` del Punto 2, sin
regresión); todo nodo con `references` tiene al menos una URL real
verificable.

#### Punto 4 — BodySilhouette (vista 1)
Puerto de `body-figure.tsx` + `anatomy.ts` a `src/body/BodySilhouette.jsx`
+ `src/body/bodyRegions.js` (coordenadas `HOTSPOTS`/`TAGS`, paths SVG por
capa, literal — no redibujar a ojo). Consume `nodeStates`/`visualState()`
del motor, no datos propios. DoD: selecciona nodo al clicar un hotspot,
opacidad por capa coincide con `reachFromStatus`.

#### Punto 5 — LayerList + LayerCascade (vista 2 + lista compartida)
Puerto de `layer-rail.tsx` → `src/layers/LayerList.jsx` (lista 01-07). 
Puerto de `segunda vista/app.js` (`renderCascade`) → `src/layers/
LayerCascade.jsx`, capa expandible con subnodos = `dataset.nodes`
agrupados por `node.layer`, estado por `visualState()`. DoD: expandir una
capa muestra sus subnodos reales del dataset (no hardcoded), clicar un
subnodo selecciona el mismo `nodeId` que la silueta.

#### Punto 6 — DetailCard compartida + cadena causal + fuentes
Puerto de `layer-detail.tsx` + `renderDetail()` (segunda vista) fusionados
en `src/detail/DetailCard.jsx` — una sola ficha para las 3 vistas. Añade
bloque §10.1: renderiza la cadena desde `pathFromPrimary(dataset,
selectedNodeId)` ("no alcanzado en este escenario" si vacío). Nuevo
`src/detail/SourcesTab.jsx` (§10.3): lista `collectReferences(dataset)`
con links reales + botón "Descargar dataset" (`Blob`+`<a download>`,
sin backend). DoD: seleccionar cualquier nodo desde cualquiera de las 3
vistas muestra la misma ficha con la misma cadena causal; pestaña Fuentes
lista todas las citas del dataset activo y permite descargar el JSON.

#### Punto 7 — ScenarioSelector + VitalsBar
Puerto de `severity-switch.tsx` → `ScenarioSelector.jsx` (alimentado por
`config.severityScenarios`) y `labs-strip.tsx` → `VitalsBar.jsx`
(alimentado por `config.vitalNodeIds`). DoD: cambiar de escenario
reposiciona el valor primario y recalcula toda la UI (vitales, capas,
silueta, ficha) sin recargar.

#### Punto 8 — App.jsx: orquestador + layout responsive final
Reescribir `App.jsx`: monta las 7 piezas anteriores en el layout de 3
columnas (§9) con colapso a tabs/acordeón bajo el breakpoint elegido
durante implementación (spec §9, no bloqueante). Reutiliza
`ImportControl` movido (Punto 1 ya limpió su ruta antigua). Conecta
`activeNodeId` como estado único compartido entre las 3 vistas. DoD:
`npm run dev` funcional de punta a punta — importar JSON, cambiar
escenario, clicar en cualquiera de las 3 vistas, ver ficha + fuentes,
responsive en ≥1440px y en 1080p sin overflow horizontal.

### PROPAGACIÓN

Edges e1-e8 propagadas dentro de los Puntos indicados en la tabla de
Touch Graph — no hay callers externos a este radio (proyecto local, sin
consumidores fuera de `App.jsx`). El Punto 1 propaga la eliminación (e8)
antes de que ningún otro Punto la dé por hecha.

### VERIFY

```text
VERIFY:
- Repro del plan .................................. n/a (no hay dossier de fallo, es rediseño)
- Checks del plan (npm run dev, click manual) ..... sí — DoD explícito por Punto (1-8)
- Callers/edges del graph propagados .............. sí — e1-e8 verificadas en Puntos 1,2,4-8
- Sin paths rotos en el radio ...................... sí — grep de imports a src/graph/* debe dar 0 tras Punto 1
- Superficie del radio intacta o validada .......... n/a — sin superficie externa
- Sin stubs en el flujo tocado ..................... sí — cada Punto entrega funcionalidad real; secciones sin dato real (ej. sin references) se omiten, no se rellenan con placeholder
- Tests ............................................ no pedidos por el usuario; DoD = verificación manual en navegador
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - Google Fonts vía CDN externo (Newsreader/IBM Plex): dependencia de red para una app local; aceptado porque GROK ya usa el mismo enfoque y no hay requisito de funcionamiento offline.
  - Breakpoint exacto del layout 3 columnas: needs verification, a decidir con medidas reales en Punto 8 (spec §9 ya lo marca como no bloqueante).
  - Cobertura de `references` por nodo: parcial por diseño (spec §10.2 — solo se rellena con citas reales disponibles; no todos los nodos tendrán sección de fuentes al cierre de este plan, y eso es correcto, no un hueco a rellenar con relleno).
```

## Status

`done` — Puntos 1–8 ejecutados en orden, sin medias.

- **Punto 1:** `src/graph/*` (6 archivos Rev1) eliminado; `ImportControl.jsx`
  movido a `src/data/`; tokens de GROK aplicados a `src/styles.css`;
  Google Fonts en `index.html`. `grep` de imports a `src/graph/` → 0
  resultados.
- **Punto 2:** `pathFromPrimary` añadida a `engine/propagation.js` sin
  tocar la firma de `propagate`/`nodeConnections`; `engine/citations.js`
  (`collectReferences`) y `engine/visualState.js`
  (`reachFromStatus`/`visualState`) nuevos, funciones puras.
- **Punto 3:** `src/data/vitamin-d.json` migrado a 7 capas anatómicas
  (sangre/órganos/hueso/linfático/piel/nervioso/sentidos), 10 nodos, con
  `composition`/`symptomsBySeverity`/`timeToAppear`/`keyFacts`/
  `references` (8 citas PMID reales, sembradas desde `GROK/src/lib/
  flow-data.ts`, nunca inventadas) + `severityScenarios` +
  `vitalNodeIds`. `propagate()` verificado con los 3 escenarios
  (normal/moderada/severa): estados coherentes, sin regresión.
- **Punto 4:** `src/body/BodySilhouette.jsx` + `bodyRegions.js` — paths
  SVG y coordenadas de hotspot copiados literales de `body-figure.tsx`/
  `anatomy.ts`.
- **Punto 5:** `src/layers/LayerList.jsx` + `LayerCascade.jsx` — subnodos
  reales del dataset agrupados por capa (no contenido fijo).
- **Punto 6:** `src/detail/DetailCard.jsx` (ficha única, incluye bloque
  causal §10.1 vía `pathFromPrimary`) + `src/detail/SourcesTab.jsx`
  (fuentes globales deduplicadas + botón "Descargar dataset").
- **Punto 7:** `src/detail/ScenarioSelector.jsx` + `VitalsBar.jsx`.
- **Punto 8:** `src/App.jsx` reescrito — layout de 3 zonas
  (rail/vistas/ficha) con colapso a tabs Muñeco/Subcapas bajo 1440px
  (`view-tabs` + `.view-pane--inactive`), `activeNodeId` como estado
  único compartido entre silueta, grafo de subcapas y lista.

**VERIFY ejecutado:**
- `npm run build` limpio (45 módulos, sin errores) tras cada punto
  estructural y al cierre.
- Smoke test SSR (`vite.ssrLoadModule` + `react-dom/server.
  renderToStaticMarkup`, herramienta temporal descartada tras la prueba,
  sin tocar navegador/MCP por instrucción explícita del usuario en esta
  sesión): render completo sin excepciones, `body-silhouette`,
  `layer-cascade`, `detail-card`, `vitals-bar`, `layer-list` presentes en
  el HTML resultante, sin `NaN`/`undefined` filtrados al DOM.
- `pathFromPrimary`/`collectReferences`/`reachFromStatus` verificados por
  script contra los 3 escenarios reales del dataset migrado (ver Punto 3).
- `grep` de imports muertos a `src/graph/*`: 0 resultados.
- `.code-intel/packs/humanflow.json` actualizado a la nueva estructura de
  carpetas (body/layers/detail) para que futuras sesiones no busquen
  `src/graph/*`.

**Pendiente de verificación humana** (no cubierto por el smoke test SSR,
requiere ojo/click real — la sesión no volvió a abrir el navegador tras
la instrucción explícita del usuario de no tocar MCP): apariencia visual
final comparada con las capturas de `GROK/screenshots/`, interacción de
clic real en silueta/subcapas/lista, animación de "Ver de nuevo", y el
breakpoint de 1440px con la ventana real. Recomendado: `npm run dev` y
revisión visual por el usuario antes de dar el diseño por definitivo.

```
┌─ VERIFY Rev4 ─────────────────────────────┐
│ Build limpio           [✓]                 │
│ SSR smoke test         [✓]                 │
│ Motor sin regresión    [✓]                 │
│ Rev1 eliminado         [✓]                 │
│ Revisión visual humana [ ] pendiente        │
└─────────────────────────────────────────────┘
```

---

## Plan (Rev5 — selector de tamaño S/M/L + branding)

Feedback directo del usuario tras revisar Rev4 en vivo. No reabre Rev4
(arriba, `done`) — es un cambio incremental sobre el mismo `App.jsx`/
`styles.css`.

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — feature nueva (control de densidad UI) + cambio de
  contenido (branding). No hay bug: la UI Rev4 funciona, pero no se
  adapta al monitor del usuario (tamaños fijos en px) y el header lleva
  contenido que el usuario ya no quiere ("Vitamina D" + párrafo intro).
```

### Tier

**S** — toca 4 archivos con lógica real (`App.jsx`, `styles.css` con
conversión sistemática px→rem, `index.html`, 1 componente nuevo
`DensitySelector.jsx`), incluye persistencia (localStorage), sin romper
ningún contrato del motor (`propagate`/`pathFromPrimary` intactos).

### Scope

- **Selector S/M/L:** nuevo control (mismo patrón visual que
  `ScenarioSelector`), 3 opciones que fijan `html[data-density]`. Persiste
  en `localStorage` (recordar preferencia entre sesiones).
- **Escalado real:** `html { font-size }` cambia por densidad (S=14px,
  M=16px, L=18px) y las declaraciones de tipografía/espaciado de
  `styles.css` pasan de `px` a `rem` para que **todo** (texto, paddings,
  gaps, tarjetas) escale proporcionalmente con un solo cambio de raíz —
  no solo el texto.
- **Branding:** quitar `<p className="app__eyebrow">Vitamina D</p>` y el
  párrafo `.app__intro` ("Elige una carencia..."). Título pasa de
  "Alcance D" a **"Human Flow architecture"** (`App.jsx` h1 + `<title>`
  de `index.html`).
- **Fuera de alcance:** el footer de disclaimer clínico no se toca (no
  fue mencionado); `dataset.config.name` ("Vitamin D", usado solo para
  el nombre del archivo al exportar en `SourcesTab`) no se toca — es
  dato del dataset, no branding de UI.

### LEGITIMIDAD

```text
LEGITIMIDAD:
  App.jsx      válido → refactorizar (quitar 2 nodos JSX, añadir estado density + componente)
  styles.css   válido → refactorizar (base font-size por densidad + conversión px→rem en tipografía/espaciado)
  index.html   válido → refactorizar (<title> y posible <html data-density> inicial)
  engine/*     válido → NO TOCAR (fuera de radio, ningún cambio de motor)
```

### Industry

`N/A — patrón repo`. Root font-size + unidades `rem` para escalado de
densidad es la técnica estándar de CSS (no requiere librería ni decisión
de arquitectura nueva) — 1 línea basta para tier S.

### Discovery / Modo

```text
Modo: A (code-intel, pack humanflow). mapRelated("App") confirmado en
esta sesión: App.jsx es el único anchor, sin callers externos (raíz
montada por main.jsx, sin consumidores). Radio = App.jsx + styles.css +
index.html + 1 componente nuevo, sin tocar engine/* ni dataset.
```

### TOUCH GRAPH

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/detail/DensitySelector.jsx` | nuevo | Selector S/M/L, mismo patrón que `ScenarioSelector.jsx` |
| `src/App.jsx` | `App` (línea 38) | Estado `density` (+localStorage), `useEffect` que fija `document.documentElement.dataset.density`; quita `app__eyebrow`/`app__intro`; título → "Human Flow architecture" |
| `src/styles.css` | tokens + tipografía/espaciado | `html[data-density]` (font-size base S/M/L); conversión sistemática de `px`→`rem` en font-size/padding/gap/margin de los componentes ya existentes |
| `index.html` | `<title>` | "Alcance D" → "Human Flow architecture" |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `src/engine/*` | Fuera de radio — ningún cambio de motor/contrato |
| `src/data/vitamin-d.json` | Fuera de radio — dato, no UI |
| `src/body/*`, `src/layers/*`, `src/detail/DetailCard.jsx`, `ScenarioSelector.jsx`, `VitalsBar.jsx`, `SourcesTab.jsx` | Se benefician del escalado por herencia de `rem`, pero no requieren cambio de lógica propia |

#### Edges

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `App.jsx` → `DensitySelector.jsx` | render nuevo | sí — se monta en `app__controls` junto a `ScenarioSelector` |
| e2 | `App.jsx` → `document.documentElement.dataset` | efecto DOM | sí — `useEffect([density])`, único punto de escritura |
| e3 | `styles.css` `html[data-density]` → todo componente con `rem` | cascada CSS | sí — heredado automáticamente, no requiere tocar cada componente JSX |
| e4 | `index.html` `<title>` → pestaña del navegador | contenido estático | sí — cambio directo |

Superficie: solo local (`npm run dev`), sin release.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  App.jsx JSX de header    deuda de contenido (ya no deseado) → eliminar (no refactor, eliminación directa)
  styles.css unidades px   deuda de escalado (fijas, no responden a densidad) → refactor en esta ola (conversión a rem)
```

### CONTRATOS/POLÍTICAS

`n/a` — sin contratos de API pública ni políticas de repo afectadas.

### IMPACTO

- Si `html[data-density]` no se fija antes del primer render con
  contraste suficiente → flash de tamaño por defecto; mitigado con valor
  inicial leído de `localStorage` en el `useState` inicial (no en efecto
  posterior).
- Si la conversión px→rem se hace parcial (solo en 2-3 reglas) → el
  selector "miente" (cambia poco) — el Punto de CSS debe cubrir
  tipografía + spacing de **todos** los componentes existentes, no una
  muestra.
- Sin superficie externa, sin release.

### Cambios (execution blocks)

#### Punto 1 — DensitySelector + estado en App.jsx
Crear `src/detail/DensitySelector.jsx` (S/M/L, patrón `ScenarioSelector`).
En `App.jsx`: estado `density` inicial desde `localStorage.getItem('hf-density') ?? 'm'`;
`useEffect` que aplica `document.documentElement.dataset.density = density`
y persiste en `localStorage` en cada cambio. Montar el selector en
`app__controls`. DoD: cambiar S/M/L persiste tras recargar la página.

#### Punto 2 — Escalado real (px → rem) en styles.css
Añadir `html[data-density="s"]{font-size:14px} html[data-density="m"]
{font-size:16px} html[data-density="l"]{font-size:18px}` (default `m`
si no hay atributo). Convertir sistemáticamente las declaraciones de
`font-size`, `padding`, `gap`, `margin`, `min-height` de tipografía y
espaciado en TODO `styles.css` (header, vitales, scenario-switch,
layer-list, body-silhouette wrapper, layer-cascade, detail-card,
sources-tab, layout gaps) de `px` a `rem` equivalente (÷16, valor base
actual). Radios de borde y el `viewBox`/tamaños SVG internos de
`BodySilhouette` quedan en `px` (no son texto ni espaciado de UI, son
geometría de dibujo). DoD: con densidad "S" todo el layout se ve
notablemente más compacto y con "L" notablemente más grande, de forma
proporcional (no solo el texto cambia).

#### Punto 3 — Branding
En `App.jsx`: quitar `<p className="app__eyebrow">Vitamina D</p>` y
`<p className="app__intro">...</p>`; `<h1>` → "Human Flow architecture".
En `index.html`: `<title>Human Flow architecture</title>`. DoD: cabecera
solo muestra el título nuevo, sin "Vitamina D" ni el párrafo de
bienvenida; pestaña del navegador dice "Human Flow architecture".

### PROPAGACIÓN

e1-e4 propagadas en los Puntos 1-3 arriba; sin callers externos a este
radio (confirmado por mapRelated en Discovery).

### VERIFY

```text
VERIFY:
- Repro ............................................. n/a (feature, no bug)
- Checks (npm run build, cambio S/M/L visual) ....... sí — DoD por Punto
- Callers/edges propagados .......................... sí — e1-e4
- Sin paths rotos .................................... sí — build limpio esperado
- Superficie ......................................... n/a
- Sin stubs .......................................... sí
- Tests .............................................. no pedidos
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - Conversión px→rem es amplia (todo styles.css) — riesgo de desajuste visual puntual en algún componente; mitigado por build+SSR smoke test tras el Punto 2, con ajuste fino si el usuario reporta algo descuadrado.
```

## Status (Rev5)

`done` — Puntos 1–3 ejecutados sin medias.

- **Punto 1:** `src/detail/DensitySelector.jsx` nuevo (S/M/L). `App.jsx`:
  estado `density` inicializado desde `localStorage` (`hf-density`),
  `useEffect` que fija `document.documentElement.dataset.density` y
  persiste en cada cambio. Montado en `app__header-controls`.
- **Punto 2:** `html[data-density='s'|'l']` (14px/18px, default 16px) en
  `styles.css`. Conversión sistemática de `font-size`/`padding`/`margin`/
  `gap`/`min-height` de `px` a `rem` en toda la hoja (138 valores
  convertidos por script determinista, base 16px) — excepción explícita:
  `body-silhouette__svg` (geometría de dibujo SVG, no tipografía/espaciado
  de UI, según el propio plan). `max-width`/breakpoints/`grid-template-
  columns` quedaron intactos (fuera del alcance del Punto 2).
- **Punto 3:** `App.jsx` — quitado `app__eyebrow` ("Vitamina D") y
  `app__intro` (párrafo "Elige una carencia..."). `<h1>` → "Human Flow
  architecture". `index.html` `<title>` actualizado igual.

**VERIFY ejecutado:**
- `npm run build` limpio (46 módulos) tras el Punto 2.
- SSR smoke test (mismo método que Rev4 — `vite.ssrLoadModule` +
  `react-dom/server`, sin navegador/MCP): confirma "Human Flow
  architecture" presente, "Vitamina D" y el párrafo intro ausentes,
  `density-switch` renderiza, sin `NaN`/`undefined`.
- `initialDensity()` guardado contra SSR (`typeof window === 'undefined'`)
  — no rompe el smoke test ni un futuro render de servidor.

**Pendiente de verificación humana** (no cubierto por SSR): que el
selector S/M/L se sienta bien a ojo en cada tamaño (subjetivo), y que la
persistencia en `localStorage` sobreviva a un refresco real del navegador.

```
┌─ VERIFY Rev5 ─────────────────────────────┐
│ Build limpio            [✓]                 │
│ SSR smoke test          [✓]                 │
│ Branding aplicado       [✓]                 │
│ Escalado S/M/L (CSS)    [✓]                 │
│ Sensación S/M/L a ojo   [ ] pendiente humano │
└─────────────────────────────────────────────┘
```

---

## Plan (Rev6 — código de color por estado + compactación de layout)

Feedback directo del usuario con captura real de la app corriendo. No
reabre Rev1-5 (arriba, `done`) — cambios incrementales sobre los mismos
archivos.

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — feature nueva (código de color por estado científico)
  + deuda de layout (aire vertical desperdiciado, panel de capas
  apretado, footer con texto largo empujando "Ver fuentes" fuera de
  vista, controles en 2 filas quitando alto útil). No hay bug: Rev5
  funciona, pero el usuario pide un uso más denso/2027 del espacio y un
  sistema de color consistente para datos científicos vs. estado
  clínico (bueno/alerta/crítico), que hoy no existen como sistema.
```

### Tier

**M** — toca 5 archivos con lógica/CSS real (`App.jsx`, `DetailCard.jsx`,
`VitalsBar.jsx`, `styles.css` con tokens de color nuevos + restructuración
de header + fit-to-viewport), sin romper el motor ni el contrato de datos.

### Scope

- **Sistema de color (nuevo):** token `--color-gold` (dorado) para dato
  científico dentro de "chips" (hoy `keyFacts` se muestra como texto
  plano unido por `·` — pasa a chips individuales doradas). Reafirmar
  3 tonos de estado ya existentes pero subutilizados: `--color-bad`
  (rojo claro, problema), `--color-warn` (naranja medio, alerta),
  default `--color-fg` (blanco, normal/bueno) — ajustar hex para que
  `bad`/`warn` se lean claramente como rojo/naranja, distintos del
  dorado de "dato científico".
- **Header compacto:** fusionar la fila del `ScenarioSelector` con la de
  `VitalsBar` en una sola fila (selector a la izquierda, vitales a la
  derecha) — quita una fila entera de alto.
- **Footer:** quitar el párrafo de disclaimer largo; el acceso a fuentes
  se queda (botón "Ver fuentes" ya existente, no se toca su lógica).
- **Layout:** más ancho para `layer-cascade` y para los paneles de
  ficha; `.app` se amplía ~20-40px equivalentes en `rem` (cuidado con no
  desbordar a densidad L); layout de escritorio (≥1440px) ajustado para
  caber en `100dvh` sin scroll de página — el scroll interno de cada
  panel (ya existente desde el fix anterior) sigue siendo el único
  scroll.
- **Fuera de alcance:** el motor (`engine/*`), el dataset
  (`vitamin-d.json`), y el layout móvil/tablet (<1440px) — ahí no es
  realista eliminar el scroll de página completo sin sacrificar
  legibilidad, se documenta como limitación conocida, no deuda oculta.

### LEGITIMIDAD

```text
LEGITIMIDAD:
  styles.css (tokens color)     válido → refactorizar (nuevo --color-gold, ajustar hex bad/warn)
  DetailCard.jsx (keyFacts)     válido → refactorizar (texto plano → chips)
  App.jsx (header/footer/grid)  mixto  → refactorizar (fusión de filas, quitar párrafo, grid a 100dvh)
  VitalsBar.jsx                 válido → absorber (sin cambios de lógica, solo contexto de layout)
  engine/*, data/*              válido → NO TOCAR (fuera de radio)
```

### Industry

`N/A — patrón repo`. Semáforo rojo/naranja/blanco para severidad clínica
y dorado para "dato de referencia científica" son convenciones visuales
estándar (no requieren librería ni arquitectura nueva) — mismo criterio
que Rev5 (tier M, decisión de estilo, no de arquitectura abierta).

### Discovery / Modo

```text
Modo: A (code-intel, pack humanflow). mapRelated("App") reconfirmado en
esta sesión: único anchor, sin callers externos. Radio = App.jsx +
DetailCard.jsx + VitalsBar.jsx + styles.css, sin tocar engine/data.
```

### TOUCH GRAPH

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/styles.css` | tokens `:root` | `--color-gold` nuevo; `--color-bad`/`--color-warn` ajustados a rojo claro/naranja medio inequívocos |
| `src/detail/DetailCard.jsx` | `DetailCard` (keyFacts) | `node.keyFacts.join(' · ')` → lista de chips `<span className="chip chip--gold">` |
| `src/App.jsx` | `App` (header, controls, footer, layout) | Fusiona fila de `ScenarioSelector`+`VitalsBar`; quita `<footer>` disclaimer; ajusta contenedor a `100dvh` sin scroll en desktop |
| `src/styles.css` | `.chip`, `.app` shell, `.layout` | Nuevas reglas de chip; `.app` altura fija flex-column (header/controls fijos + `.layout` flex:1 con scroll interno ya existente); anchos de `layer-cascade`/paneles ampliados |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `src/engine/*` | Fuera de radio — sin cambio de motor |
| `src/data/vitamin-d.json` | Fuera de radio — dato, no UI |
| `src/detail/VitalsBar.jsx` | Ya colorea por status (ok/warn/bad) — solo cambia dónde se monta en `App.jsx`, no su lógica interna |
| `src/body/*`, `src/layers/*` | Reciben más ancho vía grid, sin cambio de lógica propia |

#### Edges

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `styles.css` tokens → `VitalsBar.jsx` (clases `--ok/--warn/--bad`) | cascada CSS | sí — reusa las clases ya existentes, solo cambia el hex detrás |
| e2 | `styles.css` `.chip` → `DetailCard.jsx` (keyFacts) | consumo nuevo | sí — nuevo markup en DetailCard debe usar la clase nueva |
| e3 | `App.jsx` header → `ScenarioSelector`/`VitalsBar` | reorden JSX | sí — mismos componentes, nueva posición/fila |
| e4 | `App.jsx` → `.app`/`.layout` (contenedor) | estructura | sí — flex-column con altura fija, sin romper el scroll interno ya propagado en el fix anterior |

Superficie: solo local (`npm run dev`), sin release.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  keyFacts como texto plano   deuda visual (no distingue dato científico) → refactor a chips (este Punto)
  header en 2 filas           deuda de espacio → fusionar (este Punto)
  footer con disclaimer largo deuda visual (empuja "Ver fuentes" abajo) → eliminar párrafo
```

### CONTRATOS/POLÍTICAS

`n/a` — sin contratos de API pública ni políticas de repo afectadas.
`node.keyFacts` sigue siendo `string[]` (spec §2) — el cambio es de
presentación (chips), no de esquema de datos.

### IMPACTO

- Si los chips de `keyFacts` no usan `--color-gold` de forma consistente
  → el usuario pidió específicamente "todo dato científico... en
  dorado", un chip sin colorear rompe el requisito explícito.
- Si `--color-bad`/`--color-warn` quedan demasiado parecidos al dorado
  → el código de 3 colores deja de ser legible (todo se ve "dorado"),
  hay que verificar contraste entre los 3 tonos, no solo contra el fondo.
- Si `.app` pasa a `height:100dvh` fijo sin `overflow` bien pensado en
  cada hijo → riesgo de recortar contenido en vez de scrollear donde
  corresponde (mitigado: los paneles ya tienen su propio
  `overflow-y:auto` desde el fix anterior, se reutiliza, no se reinventa).
- Sin superficie externa, sin release.

### Cambios (execution blocks)

#### Punto 1 — Sistema de color (tokens + chips de keyFacts)
`styles.css`: añadir `--color-gold` (dorado, ej. `#d4af37`-ish, a
verificar contraste contra `--color-bg`); ajustar `--color-bad` a rojo
claro inequívoco y `--color-warn` a naranja medio inequívoco (distintos
entre sí y del dorado). `DetailCard.jsx`: `keyFacts` deja de ser texto
unido por `·` y pasa a `<ul className="chip-list">` de `<li
className="chip chip--gold">`. DoD: cada pieza clave se ve como chip
independiente en dorado; los 3 estados de `VitalsBar`
(ok/warn/bad) se distinguen a simple vista entre sí y del dorado.

#### Punto 2 — Header compacto (fusión selector + vitales)
`App.jsx`: la fila que hoy tiene `ScenarioSelector` sola pasa a compartir
fila con `VitalsBar` (selector a la izquierda, vitales a la derecha,
`flex`/`grid` según ancho). Se quita la fila `app__controls-summary`
como bloque separado (el resumen de texto + botón "Ver de nuevo" se
reubica, sin perderse, dentro de la misma fila o justo debajo compacto).
DoD: la cabecera ocupa una fila menos de alto que antes, todo el
contenido "sube".

#### Punto 3 — Footer sin disclaimer, fuentes accesibles
`App.jsx`: eliminar el `<footer className="app__footer">` con el párrafo
largo. El botón "Ver fuentes" (`sources-toggle`) se mantiene intacto,
tal cual, al final del contenido. DoD: no queda texto de disclaimer en
la página; "Ver fuentes" sigue funcionando igual que antes.

#### Punto 4 — Layout: más ancho a capas/fichas, sin scroll de página en desktop
`styles.css`: `.app` gana ~20-40px equivalentes en `rem` de margen
lateral (verificar que no desborde en densidad L); `layer-cascade` y
`.layout__panel` ganan proporción de ancho (ajustar `grid-template-
columns` de `.layout__views`, quitando algo de proporción a la columna
del muñeco si hace falta). `.app`/`.layout` en ≥1440px pasan a
flex-column con header+controles de alto fijo/auto y `.layout` a
`flex:1;min-height:0`, heredando el scroll interno ya existente en cada
panel — el documento (`body`) deja de necesitar scroll vertical en
desktop. DoD: en ventana ≥1440px de alto suficiente (ej. 900px+), toda
la app cabe sin barra de scroll en el `body`; panel de capas y fichas se
ven visiblemente más anchos que antes.

### PROPAGACIÓN

e1-e4 propagadas en los Puntos 1-4 arriba; sin callers externos a este
radio (confirmado por mapRelated en Discovery).

### VERIFY

```text
VERIFY:
- Repro ............................................. n/a (feature/deuda visual, no bug)
- Checks (npm run build, SSR smoke test) ............ sí — por Punto
- Callers/edges propagados .......................... sí — e1-e4
- Sin paths rotos .................................... sí — build limpio esperado
- Superficie ......................................... n/a
- Sin stubs .......................................... sí
- Tests .............................................. no pedidos
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - "Sin scroll de página" se garantiza para desktop ≥1440px con alto de ventana razonable (~800px+); en ventanas muy bajas o mobile/tablet, el scroll de página se mantiene como fallback necesario — documentado como limitación, no se puede eliminar sin sacrificar legibilidad en pantallas pequeñas.
  - Contraste dorado vs. naranja/rojo se verifica por script/lectura de hex, no por ojo humano (no se abre navegador en esta sesión por instrucción del usuario) — pendiente de confirmación visual del usuario tras aplicar.
```

## Status (Rev6)

`done` — Puntos 1–4 ejecutados sin medias.

- **Punto 1:** `--color-gold` (#d4af37) nuevo; `--color-warn` → #e08a3c
  (naranja medio), `--color-bad` → #e2604f (rojo claro) — separación de
  ~20° de hue entre los 3, ambos siguen siendo `--color-warn`/`--color-
  bad` los mismos tokens ya usados por `VitalsBar`/badges (no se
  duplicó lógica). `DetailCard.jsx`: `keyFacts` renderiza como
  `<ul className="chip-list">` de `<li className="chip chip--gold">`.
- **Punto 2:** `App.jsx` — `ScenarioSelector` + `VitalsBar` + botón
  "Ver de nuevo" fusionados en `.app__toprow` (una fila, antes dos).
  Se quitó el párrafo "Escenario activo: ..." (redundante con el
  selector ya resaltando el activo).
- **Punto 3:** `<footer className="app__footer">` eliminado de
  `App.jsx` y su CSS muerto (`.app__footer`, más `.app__eyebrow`/
  `.app__intro` ya sin uso desde Rev5) retirado de `styles.css`. El
  botón "Ver fuentes" sigue igual, sin cambios de lógica.
- **Punto 4:** `.app` gana `max-width: 115rem` (antes 110rem, +5rem ≈
  20-40px por lado según densidad). En ≥1440px: `.app` pasa a
  `height:100dvh; display:flex; flex-direction:column; overflow:hidden`
  — cabecera/fila superior/tabs `flex-shrink:0`, `.app__main` y
  `.layout` a `flex:1;min-height:0`, con `grid-template-rows:
  minmax(0,1fr)` + `align-items:stretch` propagado hasta
  `.layout__views` — el documento ya no necesita scroll de página en
  desktop ancho; el scroll queda dentro de cada panel (heredado del fix
  anterior). Columna del panel de capas ampliada (`26rem-1fr`, antes
  `21rem-1fr`); columna del muñeco reducida ligeramente (`13-18rem`,
  antes `15-22rem`) para cederle proporción, como se pidió.

**VERIFY ejecutado:**
- `npm run build` limpio (46 módulos) tras los 4 Puntos.
- SSR smoke test: chips dorados presentes, fila superior fusionada
  presente, footer/disclaimer ausentes, "Ver fuentes" sigue presente,
  sin `NaN`/`undefined`.
- Contraste WCAG calculado por script (no a ojo, sin navegador):
  dorado/naranja/rojo vs. fondo → 9.31 / 7.33 / 5.61 (los 3 pasan AA
  ≥4.5 para texto normal). Entre sí tienen menor contraste de
  luminancia (1.27-1.66, esperable entre 3 tonos cálidos) — la
  distinción no depende solo del color: cada estado también lleva
  texto (badge "ALCANZADA/ROZADA", nombre del chip), cumpliendo la
  regla de no-depender-solo-del-color.

**Pendiente de verificación humana** (no cubierto por SSR/script): que
el layout realmente quepa sin scroll de página en una ventana real
≥1440×800, y que los 3 colores se perciban bien diferenciados a ojo.

```
┌─ VERIFY Rev6 ─────────────────────────────┐
│ Build limpio              [✓]               │
│ SSR smoke test            [✓]               │
│ Contraste WCAG (script)   [✓]               │
│ Footer/disclaimer fuera   [✓]               │
│ Sin scroll a ojo real     [ ] pendiente humano │
└─────────────────────────────────────────────┘
```

---

## Rev7 — muñeco centrado + rail reactivo (fix directo, sin okplan formal)

Feedback con captura: el hueco visible bajo la silueta no era un bug de
stretch (`.body-silhouette` nunca tuvo `height` forzado) — era que, al
ser la única columna de `.layout__views` sin altura porcentual, su
tamaño natural (corto, por el aspect ratio 480:660 del viewBox) no
aportaba nada a la fila; el resto de columnas sí tenían `height:100%`.
Diagnóstico correcto: dar a `.body-silhouette` también `height:100%` +
centrado flex, en vez de dejarlo con `width:fit-content` (altura
natural) — así usa el aire en vez de dejarlo muerto debajo del dibujo.

- `src/body/BodySilhouette` (CSS): `.body-silhouette` → `height:100%;
  display:flex;align-items:center;justify-content:center` (antes
  `width:fit-content`, altura natural).
- `src/layers/LayerList.jsx` + CSS: `reach` (ya calculado, no usado)
  ahora aplica clase `layer-list__btn--{hit|faint|spared}` — `spared`
  apagado (opacity 0.35 + gris subtle), `hit` blanco con
  `text-shadow` glow, `faint` queda en el gris intermedio ya existente.
- `.layout__views` columnas: muñeco `11-14rem` (antes `13-18rem`),
  fichas `44-52rem` (antes `42-48rem`), panel de capas `24rem-1fr` (antes
  `26rem-1fr`) — más proporción a las fichas, como se pidió.

Build limpio + SSR (clases `--hit`/`--faint` presentes, sin
`NaN`/`undefined`). No verificado a ojo (sin navegador).

---

## Plan (Rev8 — fuentes por panel, menú Fuentes global, quitar Play, compactar chips)

Discusión previa en chat (sin skill, sin código) sobre UX de fuentes,
resuelta con 2 `AskUserQuestion`. Decisiones ya tomadas por el usuario:
menú "Fuentes" con 3 opciones (ver en pestaña nueva / descargar listado
legible / descargar dataset JSON), sustituye al toggle+panel actual.
Añade a eso: tab "Lecturas" dentro de cada ficha, quitar "Ver de nuevo",
compactar chips del panel de capas, ensanchar fichas.

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — features nuevas (tab Lecturas por ficha, menú Fuentes
  con 3 acciones) + deuda de UI (chips del panel de capas demasiado
  grandes por duplicar el subtítulo que ya se ve en la ficha; botón
  "Ver de nuevo" ya no querido, deja código de animación sin uso).
```

### Tier

**M** — toca 6 archivos con lógica real (`App.jsx`, `DetailCard.jsx`,
`LayerCascade.jsx`, `SourcesTab.jsx`→refactor a menú, `styles.css`,
`engine/citations.js` opcionalmente extendido para el listado
descargable), incluye eliminación de código muerto (Play) y un patrón
nuevo (menú desplegable de 3 acciones, generación de HTML/Markdown
client-side).

### Scope

- **Tab "Lecturas" por ficha:** `DetailCard` gana 2 tabs internos
  ("Resultado" / "Lecturas"). La sección `Lecturas` deja de estar en el
  scroll normal — solo aparece en su tab. Estado local por instancia
  (Ficha A y Ficha B son independientes, ya lo son hoy).
- **Menú "Fuentes" (sustituye toggle+`SourcesTab` inline):** un botón en
  la cabecera abre un menú de 3 acciones — Ver lecturas (pestaña nueva,
  HTML autocontenido vía Blob), Descargar listado (`.md` legible),
  Descargar dataset (JSON, ya existente, se reubica aquí).
- **Quitar "Ver de nuevo":** el botón y toda la lógica de Play
  (`runCascade`, `stopPlay`, estado `playing`/`playStepIndex`/
  `playTimeouts`, rama "playing" de `layerVisuals`, `stepIndexById`) se
  eliminan — código muerto tras quitar el botón, no se deja huérfano.
- **Compactar chips del panel de capas:** los subnodos de
  `LayerCascade` dejan de mostrar el subtítulo (`composition`) — ese
  detalle ya se ve al pinchar el subnodo (Ficha B). Chips más pequeños
  (padding/fuente reducidos), permiten más por fila.
- **Ensanchar fichas / responder "¿y si hay 5 órganos?":** columna de
  fichas gana proporción (muñeco cede un poco más). La pregunta del
  usuario se responde con el propio diseño: `layer-cascade__subs` ya usa
  `grid-template-columns: repeat(auto-fit, minmax(...))` (envuelve solas
  a varias filas) y `.layer-cascade` ya tiene `max-height` +
  `overflow-y:auto` (red de seguridad si una capa con 5 nodos, o varias
  capas abiertas a la vez, no caben) — con chips compactos, esto escala
  mejor sin cambio estructural nuevo, solo el recorte de subtítulo.
- **Fuera de alcance:** el motor (`engine/propagation.js`), el dataset.

### LEGITIMIDAD

```text
LEGITIMIDAD:
  App.jsx (Play state/handlers)     incorrecto → eliminar (código muerto tras quitar el botón)
  DetailCard.jsx                    válido → refactorizar (tabs internos)
  LayerCascade.jsx (subs)           válido → refactorizar (quitar subtítulo, compactar)
  SourcesTab.jsx                    mixto  → refactorizar a menú de 3 acciones (mismo propósito, presentación nueva)
  engine/citations.js               válido → absorber, quizá extender con un formateador de listado (sin tocar collectReferences)
  styles.css                        válido → refactorizar (nuevas clases: tabs, menú, chips compactos, columnas)
```

### Industry

`N/A — patrón repo`. Menú desplegable de 3 acciones y generación de
HTML/Markdown client-side vía `Blob`+`URL.createObjectURL` son técnicas
nativas del navegador ya usadas en este mismo repo (`SourcesTab`
descarga JSON así) — mismo patrón, no arquitectura nueva.

### Discovery / Modo

```text
Modo: A (code-intel, pack humanflow). Archivos leídos completos en esta
sesión (App.jsx, DetailCard.jsx, SourcesTab.jsx, LayerCascade.jsx) —
radio confirmado sin volver a mapRelated (ya en contexto).
```

### TOUCH GRAPH

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/App.jsx` | `App` | Quita `runCascade`/`stopPlay`/`playing`/`playStepIndex`/`playTimeouts`/`stepIndexById`/botón "Ver de nuevo"; `layerVisuals` simplifica a `steadyVisual` siempre (sin rama playing); monta `<FuentesMenu>` en vez de toggle+`SourcesTab` |
| `src/detail/DetailCard.jsx` | `DetailCard` | Tabs internos "Resultado"/"Lecturas"; sección Lecturas sale del body normal |
| `src/layers/LayerCascade.jsx` | subs render | Quita `{node.composition && <span className="layer-cascade__sub-note">}` |
| `src/detail/SourcesTab.jsx` → `src/detail/FuentesMenu.jsx` | renombrado/refactor | 3 acciones: `openReadingsTab(dataset)`, `downloadReadingsList(dataset)`, `downloadDataset(dataset)` (ya existía) |
| `src/engine/citations.js` | nuevo helper opcional | `formatReadingsMarkdown(dataset)` o inline en `FuentesMenu.jsx` si es más simple — decidir en Punto 3 según cuánto se reutiliza `collectReferences` |
| `src/styles.css` | tokens/clases nuevas | `.detail-card__tabs`, `.fuentes-menu*`, chips compactos, `grid-template-columns` de `.layout__views` |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `src/engine/propagation.js`, `visualState.js` (`visualState()` función) | `visualState()` deja de usarse en `App.jsx` pero la función en sí no se borra del motor — puede servir a futuro y no es deuda (es utilidad genérica, no código muerto del feature Play) |
| `src/data/vitamin-d.json` | Fuera de radio |
| `src/body/BodySilhouette.jsx` | Sin cambios de lógica, solo se beneficia del ancho de columna |

#### Edges

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `App.jsx` → `DetailCard.jsx` (×2 instancias) | props | sí — sin cambio de props, solo el componente interno cambia |
| e2 | `App.jsx` → `FuentesMenu.jsx` | render nuevo | sí — reemplaza el par toggle+`SourcesTab` |
| e3 | `FuentesMenu.jsx` → `engine/citations.js` (`collectReferences`) | consumo | sí — reusa la función ya existente para las 3 acciones |
| e4 | `App.jsx` → `layerVisuals`/`BodySilhouette` | simplificación | sí — `BodySilhouette` sigue recibiendo `layerVisuals` con la misma forma (`Record<anatomyId, Visual>`), solo cambia cómo se calcula internamente, sin romper el contrato de props |
| e5 | `styles.css` → `.layout__views` | ajuste de columnas | sí — mismas 3 sub-columnas, proporciones nuevas |

Superficie: solo local (`npm run dev`), sin release.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  Play (runCascade/stopPlay/playing/...)   incorrecto → eliminar (sin botón que lo dispare, es deuda muerta)
  layer-cascade__sub-note (composition)    deuda (duplica lo que ya está en la ficha) → eliminar
  SourcesTab.jsx                            deuda de forma (funciona pero UX molesta al usuario) → refactor a menú
```

### CONTRATOS/POLÍTICAS

`n/a` — sin contratos de API pública. `node.references`/`node.composition`
siguen siendo los mismos campos del dataset (spec §2); el cambio es de
presentación, no de esquema — `docs/DATASET_PROMPT.md` no necesita
tocarse (los campos que describe siguen siendo válidos y usados, solo
cambia DÓNDE se muestran en la UI).

### IMPACTO

- Si se elimina Play sin quitar `stepIndexById`/la rama playing de
  `layerVisuals` → código muerto que confunde a la próxima sesión (por
  eso es un solo Punto, no dos).
- Si el tab "Lecturas" no es independiente por ficha (A y B comparten
  estado) → clicar Lecturas en la Ficha A cambiaría también la Ficha B,
  rompiendo la independencia ya establecida en Rev4 — el estado del tab
  debe vivir dentro de `DetailCard` (local), no en `App.jsx`.
- Si `FuentesMenu` no reutiliza `collectReferences` y reimplementa el
  agrupado → duplicación de lógica de dedupe (ya resuelta en
  `engine/citations.js`) — debe importarla, no reescribirla.
- Sin superficie externa, sin release.

### Cambios (execution blocks)

#### Punto 1 — Quitar "Ver de nuevo" y su código muerto
`App.jsx`: eliminar botón, `IconPlay` import, `PLAY_DURATION_MS`,
`runCascade`, `stopPlay` (y sus llamadas en `selectLayer`/efecto de
dataset), estado `playing`/`playStepIndex`, `playTimeouts` ref,
`stepIndexById`. `layerVisuals` pasa a `m[layer.anatomyId] =
steadyVisual(reach, isActive)` sin condicional. DoD: `npm run build` sin
warnings de variables no usadas; no queda ninguna referencia a Play.

#### Punto 2 — Tab "Lecturas" por ficha
`DetailCard.jsx`: estado local `activeTab` (`'resultado'|'lecturas'`),
2 botones tab en el header, la sección `<section>` de Lecturas se
renderiza solo cuando `activeTab==='lecturas'`, el resto del body solo
cuando `activeTab==='resultado'`. `styles.css`: `.detail-card__tabs`
(mismo lenguaje visual que `.view-tabs`/`.scenario-switch`, compacto).
DoD: Ficha A y Ficha B cambian de tab de forma independiente; el
contador de lecturas en el tab (ej. "Lecturas (2)") es correcto.

#### Punto 3 — Menú "Fuentes" (3 acciones)
Refactor `SourcesTab.jsx` → `FuentesMenu.jsx`: botón "Fuentes" que abre
un menú de 3 opciones. `openReadingsTab(dataset)`: genera un HTML
autocontenido (mismo tema oscuro, lista agrupada por nodo vía
`collectReferences`) y lo abre con `window.open` sobre un Blob URL.
`downloadReadingsList(dataset)`: genera un `.md` (`# Fuentes\n\n##
<nodo>\n- [título](url)`) y lo descarga. `downloadDataset(dataset)`: la
función ya existente, sin cambios de lógica. `App.jsx`: quita
`showSources`, el botón toggle y `<SourcesTab>`; monta `<FuentesMenu
dataset={dataset} />` en la cabecera. DoD: las 3 acciones funcionan;
ninguna inventa contenido (mismas citas reales que ya había).

#### Punto 4 — Compactar chips del panel de capas
`LayerCascade.jsx`: quitar el `<span className="layer-cascade__sub-note">`
(subtítulo `composition`). `styles.css`: reducir padding/font-size de
`.layer-cascade__sub`, ajustar `minmax()` de
`.layer-cascade__subs` para que quepan más por fila. DoD: una capa con
4-5 subnodos se ve en 1-2 filas compactas en vez de ocupar toda la
altura del panel.

#### Punto 5 — Ensanchar fichas
`styles.css`: `.layout__views` en ≥1440px — muñeco `10-13rem` (antes
`11-14rem`), fichas `46-56rem` (antes `44-52rem`), panel de capas
`22rem-1fr` (antes `24rem-1fr`, compensado por los chips más compactos
del Punto 4). DoD: fichas visiblemente más anchas sin que ninguna baje
de 20rem (regla UXSKILL.md #2, ya verificada en Rev6).

### PROPAGACIÓN

e1-e5 propagadas en los Puntos 1-5 arriba. Sin callers externos al
radio (App.jsx sigue siendo la raíz sin consumidores).

### VERIFY

```text
VERIFY:
- Repro ............................................. n/a (features + deuda, no bug)
- Checks (npm run build, SSR smoke test) ............ sí — por Punto
- Callers/edges propagados .......................... sí — e1-e5
- Sin paths rotos .................................... sí — build limpio esperado
- Superficie ......................................... n/a
- Sin stubs .......................................... sí
- Tests .............................................. no pedidos
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - Ver-en-pestaña-nueva vía Blob+window.open puede ser bloqueado por algunos navegadores si no es una respuesta síncrona a un clic directo — se implementa como handler síncrono del propio clic del menú, riesgo bajo, pero no verificable sin navegador real en esta sesión.
  - Proporciones exactas de columnas (Punto 5) son una estimación razonada, no medida a ojo — mismo patrón de riesgo ya aceptado en Rev6/Rev7.
```

## Status (Rev8)

`done` — Puntos 1–5 ejecutados sin medias.

- **Punto 1:** `App.jsx` — quitado botón "Ver de nuevo", `IconPlay`,
  `PLAY_DURATION_MS`, `runCascade`, `stopPlay`, estado `playing`/
  `playStepIndex`, `playTimeouts`, `stepIndexById`. `layerVisuals`
  simplificado a `steadyVisual(layerReach[layer.id], isActive)` sin
  rama condicional. `visualState()` del motor no se borra (utilidad
  genérica, per LEGITIMIDAD del plan).
- **Punto 2:** `DetailCard.jsx` — tabs internos "Resultado"/"Lecturas
  (N)", estado local `useState`, independiente por instancia (Ficha A
  y B no se cruzan). Sección Lecturas sale del scroll normal.
- **Punto 3:** `SourcesTab.jsx` eliminado, `FuentesMenu.jsx` nuevo en la
  cabecera — 3 acciones: ver lecturas en pestaña nueva (HTML
  autocontenido vía Blob + `window.open`), descargar listado `.md`,
  descargar dataset JSON (misma lógica de antes, reubicada). Las 3
  reusan `collectReferences` — sin lógica de dedupe duplicada.
- **Punto 4:** `LayerCascade.jsx` — subnodos sin subtítulo
  (`composition`). CSS: `.layer-cascade__subs` pasa de grid a flex-wrap,
  chips en forma de píldora compactos.
- **Punto 5:** columnas `.layout__views` (≥1440px): muñeco
  `10-13rem` (antes `11-14rem`), fichas `46-56rem` (antes `44-52rem`),
  panel de capas `22rem-1fr` (antes `24rem-1fr`).

**VERIFY ejecutado:**
- `npm run build` limpio (46 módulos).
- `grep` de símbolos eliminados (`SourcesTab`, `runCascade`,
  `stopPlay`, `showSources`, `playStepIndex`, `stepIndexById`): 0
  resultados en `src/` salvo la definición no invocada de `IconPlay`
  en `icons.jsx` (utilidad de icono, no deuda del feature).
- SSR smoke test: `fuentes-menu`, `detail-card__tabs`, "Lecturas"
  presentes; "Ver de nuevo", `sources-tab`, `sub-note` ausentes; sin
  `NaN`/`undefined`.

**Pendiente de verificación humana:** que el menú "Fuentes" no sea
bloqueado como popup en el navegador real del usuario (riesgo aceptado
en el plan), y sensación visual de las columnas ensanchadas.

```
┌─ VERIFY Rev8 ─────────────────────────────┐
│ Build limpio                [✓]             │
│ SSR smoke test               [✓]             │
│ Código muerto de Play fuera  [✓]             │
│ Menú Fuentes (popup real)    [ ] pendiente humano │
└─────────────────────────────────────────────┘
```

---

## Plan (Rev9 — motor: ciclos de feedback + multi-primario, corregido)

Discusión previa en chat (2 rondas de revisión crítica + verificación web
real: eje HPA, dinámica de redes booleanas). El usuario propuso una
solución ejecutable; se encontró un bug matemático real en su fórmula
(doble ponderación por `strength`) y 3 huecos de integración. Este plan
toma la versión corregida.

### DIAGNÓSTICO

```text
DIAGNÓSTICO:
  síntoma:  el motor asume DAG (spec §7); un dataset con retroalimentación
            (ej. eje HPA) o con más de un `isPrimary` no se puede modelar
            hoy sin mentir en silencio.
  origen:   src/engine/propagation.js — topoSort() (Kahn) deja fuera del
            `order` a cualquier nodo dentro de un ciclo, sin avisar;
            findPrimaryNodeId() usa .find() (coge solo el primer
            isPrimary, ignora el resto sin avisar).
  provoca:  un nodo en ciclo nunca alcanza inDegree 0 → nunca entra en
            `order` → su ratio cae al fallback `?? 1` ("normal") aunque
            debería estar afectado. Verificado leyendo el código, no es
            hipotético.
  familia:  contract-drift — el contrato implícito ("todo nodo del
            dataset se refleja en nodeStates") se rompe en silencio para
            datasets con ciclos o multi-primario, sin que el import lo
            detecte.
  remedio:  (1) detectar el ciclo explícitamente en vez de tragárselo,
            (2) motor iterativo alternativo con la fórmula correcta
            (verificada contra el motor DAG ya existente) para cuando
            hay ciclo, (3) generalizar a N primarios (Kahn ya soporta
            multi-raíz, solo falta dejar de usar `.find()`).
```

### Tier

**M** — el radio queda contenido en un solo módulo
(`src/engine/propagation.js`) + su documentación (`docs/DATASET_PROMPT.md`)
+ verificación numérica. `App.jsx` no se toca: la firma externa de
`propagate(dataset, primaryValue)` y `pathFromPrimary(dataset, nodeId)`
se mantiene 100% igual (confirmado — `App.jsx` es el único consumidor,
grep en esta sesión), así que no hay radio de UI que propagar.

### Scope

- **Detección de ciclo explícita:** `topoSort` ya calcula `order`; si
  `order.length !== dataset.nodes.length`, hay ciclo. En vez de
  ignorarlo, `propagate()` lo detecta y **delega automáticamente** al
  motor iterativo (no lanza excepción al usuario final — un dataset con
  feedback simplemente usa el otro camino, transparente).
- **Motor iterativo corregido** (Jacobi amortiguado, no lo que proponía
  el usuario): misma fórmula de contribución por edge que ya usa
  `propagate()` (`resolveModulation` + inversión de `decreases`/
  `inhibits` **antes** de ponderar, no después) — sin duplicar
  `strength`. Neutro alineado a `1` (igual que el motor DAG, no `0`).
  Parada por convergencia real (`maxDelta < epsilon`), no por conteo
  fijo de iteraciones — `maxIter` es un techo de seguridad, no el
  criterio de parada.
- **Multi-primario:** `findPrimaryNodeId` → `findPrimaryNodeIds`
  (array). `propagate(dataset, primaryValue)` acepta lo mismo que hoy
  (`number`, compatible con todo dataset actual) **o** un objeto
  `{ [nodeId]: number }` para varios primarios a la vez — normalizado
  internamente, cero cambio para quien ya pasa un número.
- **`pathFromPrimary` cycle-aware:** hoy devuelve `[]` en cuanto
  detecta un nodo repetido (silencio, "no alcanzado"). Pasa a devolver
  la cadena parcial construida hasta el punto del ciclo — más honesto
  ("llegó hasta aquí y vuelve a entrar en el bucle") que fingir que no
  llegó. También deja de asumir un único `primaryId`: para en cualquier
  nodo `isPrimary`.
- **Verificación numérica real:** dataset de juguete (3 nodos, ciclo de
  retroalimentación negativa tipo mini-HPA) ejecutado con un script,
  mostrando el resultado real — no "build limpio" como única prueba.
- **Documentación:** `docs/DATASET_PROMPT.md` gana una nota sobre
  ciclos soportados (con el matiz honesto: retroalimentación negativa
  puede no converger, y eso es esperado, no un fallo) y multi-primario
  a nivel de motor.

**Explícitamente fuera de alcance (no se ignora, se aplaza con razón):**
- Selector de UI para varios primarios a la vez — el motor ya lo
  soporta, pero diseñar cómo el usuario elige 2-3 valores independientes
  a la vez es una decisión de UX separada, no pedida con detalle
  todavía.
- Mostrar "oscila / no converge" visualmente en `DetailCard`/`VitalsBar`
  — el motor ya expone `converged`/`iterations` en el resultado: la UI
  que lo lea es un pase futuro, no de este plan.
- `inputType: "toggle"/"composite"` como campo de schema nuevo — un
  escenario de 2 opciones ya se comporta como un toggle con
  `ScenarioSelector` tal cual existe; no hace falta campo nuevo para eso.

### LEGITIMIDAD

```text
LEGITIMIDAD:
  engine/propagation.js (DAG: buildGraph/topoSort/statusFor)  válido → absorber, sin tocar la lógica del camino sin ciclos
  engine/propagation.js (findPrimaryNodeId, .find() único)     mixto → refactorizar (a array, mismo fallback de capa 1)
  engine/propagation.js (pathFromPrimary, guarda de ciclo)     mixto → refactorizar (devolver parcial, no vacío)
  Fórmula del usuario (doble strength, neutro 0)               incorrecto → no absorber tal cual — se corrige antes de escribir código
  docs/DATASET_PROMPT.md                                        válido → refactorizar (añadir sección, no reescribir lo existente)
  App.jsx                                                       válido → NO TOCAR (firma externa sin cambios)
```

### Industry

- Retroalimentación negativa del eje HPA — real, confirmado en esta
  sesión con fuentes ([Cleveland Clinic](https://my.clevelandclinic.org/health/body/hypothalamic-pituitary-adrenal-hpa-axis),
  [NCBI StatPearls](https://www.ncbi.nlm.nih.gov/books/NBK500031/)).
- Dinámica de convergencia en redes regulatorias biológicas: bucles
  negativos tienden a **ciclos límite** (oscilación), los positivos a
  **puntos fijos** — no es simétrico, confirmado con literatura de redes
  booleanas ([PMC — Boolean Dynamics with Multiple Coupled Feedback
  Loops](https://pmc.ncbi.nlm.nih.gov/articles/PMC1831709/)). Esto es la
  base de por qué el criterio de parada debe ser por convergencia real
  y no por "10 ciclos y ya", y de por qué `converged:false` es un
  resultado válido, no un error del motor.
- Iteración de Jacobi amortiguada (relajación) para sistemas de punto
  fijo es una técnica numérica estándar (no requiere librería nueva,
  se implementa en ~20 líneas ya verificadas contra la fórmula del
  motor DAG existente).

### Discovery / Modo

```text
Modo: A (code-intel, pack humanflow) + lectura completa del archivo en
esta sesión. grep confirma: `src/App.jsx` es el único importador de
`propagate`/`pathFromPrimary` en todo `src/` — radio cerrado, sin
callers ocultos.
```

### TOUCH GRAPH

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/engine/propagation.js` | `findPrimaryNodeId` → `findPrimaryNodeIds` | Devuelve array; mismo fallback (capa mínima) si no hay ninguno explícito |
| `src/engine/propagation.js` | `reachableFrom` | Acepta uno o varios `startId` (unión de alcanzables) |
| `src/engine/propagation.js` | `topoSort` | Sin cambios de lógica — su resultado (`order.length` incompleto) ahora SÍ se usa como señal |
| `src/engine/propagation.js` | `propagate` (línea 97) | Detecta ciclo vía `order.length`; normaliza `primaryValue` (number\|object); delega a `propagateIterative` si hay ciclo; mismo contrato de salida + campos nuevos `converged`/`iterations` (solo presentes en el camino iterativo) |
| `src/engine/propagation.js` | `propagateIterative` (nuevo, no exportado) | Jacobi amortiguado, fórmula alineada con `resolveModulation`, neutro `1`, parada por `epsilon` |
| `src/engine/propagation.js` | `pathFromPrimary` (línea 174) | Multi-primario (para en cualquier `isPrimary`); ciclo devuelve cadena parcial, no `[]` |
| `docs/DATASET_PROMPT.md` | nueva sección | Ciclos soportados (con el matiz de no-convergencia esperada) + multi-primario a nivel de motor |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `src/App.jsx` | Firma externa sin cambios (confirmado, único caller) |
| `src/detail/DetailCard.jsx`, `VitalsBar.jsx` | Consumen `nodeStates`/`chain` con la misma forma — no leen `converged` todavía (fuera de alcance) |
| `src/data/vitamin-d.json` | Dataset actual es DAG puro, sin ciclos — el camino existente no cambia para él |

#### Edges

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `propagate()` → `propagateIterative()` | delegación nueva | sí — activada por `order.length` incompleto, no por flag manual |
| e2 | `App.jsx` → `propagate(dataset, primaryValue)` | consumo sin cambio | sí — verificado que sigue pasando un `number`, camino legacy intacto |
| e3 | `App.jsx` → `pathFromPrimary(dataset, nodeId)` | consumo sin cambio | sí — misma firma, comportamiento mejor solo en el caso ciclo (antes `[]`, ahora parcial) |
| e4 | `docs/DATASET_PROMPT.md` → generación futura de datasets por IA | documental | sí — si no se actualiza, una IA seguiría creyendo que los ciclos rompen la app |

Superficie: solo local (`npm run dev` + script de verificación numérica). Sin release.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  findPrimaryNodeId (.find() único)   deuda (silenciosamente ignora primarios extra) → refactor este Punto
  pathFromPrimary (return [] en ciclo) deuda (UX engañosa, "no alcanzado" siendo falso) → refactor este Punto
  Fórmula propuesta por el usuario     incorrecta → no se implementa tal cual (ver DIAGNÓSTICO/critique previa en chat)
```

### CONTRATOS/POLÍTICAS

`n/a` — sin contratos de API pública externa. El "contrato" real es el
shape de `nodeStates`/`traversalOrder` que consume `App.jsx` — se
mantiene idéntico (los campos `converged`/`iterations` son aditivos,
nadie los lee todavía, no rompen a quien los ignora).

### IMPACTO

- Si `propagateIterative` no usa la misma fórmula que `propagate`
  (contribución antes de ponderar, no después) → los resultados del
  camino con ciclo serían numéricamente incorrectos aunque "compile" —
  por eso el Punto de verificación numérica es obligatorio, no opcional.
- Si el neutro del motor iterativo no se alinea a `1` (como el DAG) →
  un mismo dataset daría estados distintos según tenga o no un ciclo en
  alguna parte ajena al nodo que estás mirando — inconsistencia interna
  grave, ya señalada en la crítica previa.
- Si `pathFromPrimary` sigue devolviendo `[]` en ciclo → la ficha
  seguiría mintiendo "no alcanzado" para nodos que sí están afectados —
  regresión de UX no resuelta a pesar del motor nuevo.
- Sin superficie externa, sin release.

### Cambios (execution blocks)

#### Punto 1 — Multi-primario en el motor DAG (bajo riesgo, primero)
`findPrimaryNodeId` → `findPrimaryNodeIds(dataset)` (array; explícitos
`isPrimary:true`, o fallback al primero de la capa mínima si no hay
ninguno). `reachableFrom` acepta `startIds` (array) y devuelve la unión.
`propagate(dataset, primaryValue)`: si `primaryValue` es `number`,
comportamiento 100% igual que hoy (se aplica al primer/único primario);
si es objeto `{id: number}`, cada primario listado usa su valor, el
resto (si los hay) cae al neutro `1`. DoD: dataset actual
(`vitamin-d.json`, 1 primario) da exactamente los mismos números que
antes del cambio (verificado por script, no a ojo).

#### Punto 2 — Detección de ciclo + motor iterativo corregido
`topoSort` sin cambios; `propagate()` comprueba `order.length !==
dataset.nodes.length` → delega a `propagateIterative(dataset,
primaryValues, {maxIter=200, epsilon=0.001, alpha=0.5})`. Fórmula por
edge idéntica a la del motor DAG (invertir `sourceRatio` antes de
ponderar por `strength`, no después; sin duplicar `strength`). Jacobi:
lee de la foto de la iteración anterior, nunca de valores ya
actualizados en la misma pasada. Neutro `1` para nodos sin edges
entrantes. Devuelve `nodeStates` en el mismo shape + `converged`
(boolean) + `iterations` (number). DoD: ver Punto 4 (verificación).

#### Punto 3 — `pathFromPrimary` cycle-aware + multi-primario
Deja de comparar contra un único `primaryId`: para cuando
`nodeById.get(currentId)?.isPrimary` es `true`. Si detecta un nodo
repetido (ciclo) antes de llegar a un primario, **devuelve la cadena
parcial construida hasta ahí** en vez de `[]`. DoD: con el dataset de
juguete del Punto 4, pedir la cadena de un nodo dentro del ciclo
devuelve una ruta no vacía.

#### Punto 4 — Verificación numérica (obligatoria, no opcional)
Script de prueba (no committeado como parte de la app — vive en
scratchpad o se descarta tras verificar) con un dataset de 3 nodos:
`A → B → C → A` (ciclo), relación `A→B increases`, `B→C increases`,
`C→A decreases` (negativo — igual que el eje HPA: cortisol inhibe lo
que lo produce). Ejecutar `propagate()` y comprobar: (1) se detecta el
ciclo y se activa `propagateIterative`, (2) el resultado es coherente
con la literatura citada — probablemente `converged: false`
(oscilación esperada en bucle negativo) o, si converge, que el valor
sea estable en una segunda ejecución con los mismos inputs
(determinismo). Mostrar los números reales en el resumen de cierre, no
solo "sí/no". DoD: el propio Punto 1 (multi-primario) también se
verifica aquí con `vitamin-d.json` real, no solo el dataset de
juguete.

#### Punto 5 — Documentación
`docs/DATASET_PROMPT.md`: nueva sección corta explicando que los
ciclos ya no rompen el import (se detectan y el motor cambia de modo
solo), que la no-convergencia en bucles negativos es un resultado
válido esperado (no hay que evitarlo al diseñar el dataset), y que
`isPrimary: true` en más de un nodo ya es soportado por el motor (con
la limitación honesta: la UI actual todavía solo alimenta un valor por
escenario). DoD: sección añadida, resto del documento intacto.

### PROPAGACIÓN

e1-e4 propagadas en los Puntos 1-5. Sin callers externos al radio
(`App.jsx` confirmado como único consumidor, sin cambios de firma).

### VERIFY

```text
VERIFY:
- Repro ............................................. n/a (mejora de motor, no bug reportado por usuario final)
- Checks (npm run build, script numérico Punto 4) ... sí — números reales mostrados, no solo build
- Callers/edges propagados .......................... sí — e1-e4; App.jsx confirmado sin romperse (mismos números en vitamin-d.json)
- Sin paths rotos .................................... sí
- Superficie ......................................... n/a
- Sin stubs .......................................... sí — propagateIterative no es un placeholder, se ejecuta de verdad en el Punto 4
- Tests .............................................. no pedidos como suite formal; verificación numérica sí es obligatoria (Punto 4)
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - `maxIter=200`/`epsilon=0.001`/`alpha=0.5` son valores por defecto razonados (no medidos contra un corpus real de datasets biológicos) — si un dataset real futuro no converge ni oscila de forma limpia con estos valores, se ajustan entonces, no se puede pre-optimizar sin más casos reales.
  - La UI no muestra todavía `converged`/`iterations` — el motor los expone pero nadie los lee aún (aplazado explícitamente, ver Scope).
```

## Status (Rev9)

`done` — Puntos 1–5 ejecutados sin medias.

- **Punto 1:** `findPrimaryNodeIds` (array), `reachableFrom` acepta
  varios orígenes, `propagate()` normaliza `primaryValue`
  (`number`↔`object`). Verificado por regresión: `vitamin-d.json`
  (single-primary, DAG puro) da exactamente los mismos valores que
  antes de Rev9 en los 3 escenarios (`serum_d`/`senses`
  status+value idénticos).
- **Punto 2:** `propagateIterative` nuevo — Jacobi amortiguado
  (`alpha=0.5`), misma fórmula de contribución por edge que el motor
  DAG (inversión antes de ponderar, sin duplicar `strength`), neutro
  `1` alineado, parada por `maxDelta < epsilon` (no conteo fijo).
  `propagate()` detecta el ciclo vía `order.length` y delega solo.
- **Punto 3:** `pathFromPrimary` para en cualquier nodo `isPrimary`
  (no uno fijo) y devuelve cadena parcial en vez de `[]` al detectar
  un ciclo en el camino de vuelta.
- **Punto 4:** verificación numérica real ejecutada (script temporal,
  descartado tras verificar):
  - Regresión `vitamin-d.json`: idéntica a pre-Rev9.
  - Ciclo negativo con el primario dentro del bucle: converge en 12
    iteraciones (`a≈b≈c≈0.70` — el primario fijo neutraliza el bucle,
    hallazgo honesto: un ciclo que pasa por el nodo primario nunca
    oscila de verdad, porque el primario no se recalcula).
  - Ciclo negativo genuino **entre no-primarios** (b↔c, `strength:1`):
    converge en 14 iteraciones a un punto fijo estable (`b≈c≈0.55`).
  - Ciclo de 4 nodos, `strength:1` en todos los edges: converge en 24
    iteraciones, 0ms de cómputo real.
  - Determinismo: mismo input → mismo resultado exacto en 2
    ejecuciones (diferencia `< 1e-9`).
  - `pathFromPrimary` con ciclo: devuelve `['a','b','c']` (cadena
    parcial real, no `[]`).
  - Multi-primario real (`{a:70, x:90}`): cada primario mantiene su
    propio valor, `b` combina ambas influencias ponderadas
    correctamente.
  - **Hallazgo honesto no anticipado:** con `alpha=0.5` no conseguí
    provocar una no-convergencia real ni en el caso más agresivo
    probado (ciclo de 4 nodos, `strength=1`) — la amortiguación es más
    estabilizadora de lo que la literatura de redes booleanas (sin
    amortiguar) sugiere para bucles negativos. Es una decisión de
    diseño correcta (prioriza estabilidad numérica sobre fidelidad
    exacta de oscilación biológica) pero se documenta como tal, no se
    presenta como si el motor "demostrara" que todo converge siempre.
- **Punto 5:** `docs/DATASET_PROMPT.md` actualizado — §3.4, §5, §7
  reflejan que los ciclos ya no rompen el import, y que multi-primario
  es técnicamente soportado por el motor aunque no recomendado sin una
  UI que lo aproveche (fuera de alcance de este plan).

**VERIFY ejecutado:**
- `npm run build` limpio antes y después del Punto 2-3 (hash de
  `dist/` idéntico al de la comprobación de sintaxis inicial —
  confirma que nada más cambió sin querer).
- Verificación numérica real con 4 casos distintos (arriba), no solo
  "build pasa".
- `App.jsx` no tocado — confirmado, radio cerrado como se planeó.

```
┌─ VERIFY Rev9 ─────────────────────────────┐
│ Build limpio                    [✓]         │
│ Regresión vitamin-d.json        [✓]         │
│ Ciclo detectado + motor iterativo [✓]       │
│ Determinismo                    [✓]         │
│ pathFromPrimary cycle-aware     [✓]         │
│ Multi-primario real             [✓]         │
│ Documentación actualizada       [✓]         │
└─────────────────────────────────────────────┘
```

---

## Plan (Rev10 — quitar muñeco, panel de capas con 2 vistas: Capas/Grafo neuronal)

Referencia visual nueva: `GROK/alcance-d-neural/` (red tipo conectoma,
canvas, partículas por sinapsis activa, glow). Petición directa del
usuario en chat.

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — feature nueva + reestructuración de layout. No hay
  bug: se sustituye la columna del muñeco por más espacio para las
  fichas y para un panel de capas ampliado con 2 vistas internas
  (Capas ya existente / Grafo neuronal nuevo).
```

### Tier

**L** — cross-cutting: quita un componente visual completo
(`BodySilhouette` + su columna + el mecanismo de pestañas responsive
Muñeco/Subcapas que dependía de él), añade un componente nuevo con
render en `<canvas>`, hit-testing por puntero, animación con
`requestAnimationFrame`, y **una decisión de arquitectura real**: las
coordenadas del grafo de GROK están fijas a mano para el dataset de
vitamina D (24 nodos con `x,y` literales) — no sirven para "cualquier
flow" que ya nos propusimos soportar (Rev9). Hace falta un layout
**genérico** calculado a partir de `dataset.layers`/`dataset.nodes`,
no coordenadas copiadas.

### Scope

- **Quitar el muñeco:** `BodySilhouette`, su columna en
  `.layout__views`, `layerVisuals`/`reachableIds` (solo los usaba él),
  el mecanismo `view-tabs` (Muñeco/Subcapas) — sin muñeco, ya no hay 2
  "panes" que alternar, se simplifica a estructura fija.
- **Fichas A/B se mueven a la izquierda:** ganan la columna que deja
  libre el muñeco.
- **Panel de capas más ancho, con 2 vistas internas:** tabs grandes
  "Capas" / "Grafo" (glow en el activo, mismo lenguaje visual que ya
  usamos en `DetailCard__tabs` pero más prominente). "Capas" = el
  `LayerCascade` que ya existe, sin cambios. "Grafo" = componente
  nuevo, ver abajo. Esta columna absorbe **todo** el ancho que libera
  el muñeco (`1fr`, ya no comparte con una 3ª columna fija).
- **`NeuralGraph.jsx` (nuevo):** puerto del canvas de
  `GROK/alcance-d-neural/app.js` — curvas orgánicas entre nodos,
  partículas viajando por aristas activas, halo/glow en nodos
  alcanzados, tooltip al pasar el ratón, clic → mismo contrato que
  `LayerCascade.onSelectNode` (alimenta la Ficha B, nada nuevo del
  lado de `App.jsx`). **Posiciones calculadas, no copiadas:** anillo
  concéntrico por capa (`dataset.layers`), nodos repartidos por ángulo
  dentro de su anillo — funciona igual con 10 nodos que con 40, a
  diferencia de las coordenadas fijas de GROK.
- **Sin botón de replay ni animación de entrada automática:** ya
  quitamos "Ver de nuevo" en Rev8 a petición explícita — el grafo
  nuevo respeta esa decisión: partículas fluyen de forma continua y
  ambiental por las aristas activas (glow vivo, como se pidió), pero
  sin un control de "reproducir" ni un barrido de aparición al cargar.
- **Sin chips de filtro por grupo dentro del grafo:** GROK los trae,
  pero duplicarían lo que ya hace el rail de capas de la izquierda —
  se omiten para no repetir la misma función dos veces en la misma
  pantalla.

**Explícitamente fuera de alcance:**
- Física real tipo force-directed (arrastrar nodos, simulación
  continua) — el layout es estático (anillos por capa), calculado una
  vez por render, no una simulación en vivo. Suficiente para el
  objetivo (ver la red, no reordenarla).

### LEGITIMIDAD

```text
LEGITIMIDAD:
  src/body/BodySilhouette.jsx, bodyRegions.js   incorrecto (ya no se usa) → eliminar
  src/App.jsx (view-tabs, layerVisuals, reachableIds)  incorrecto → eliminar (dead code tras quitar el muñeco)
  src/layers/LayerCascade.jsx                    válido → absorber sin cambios (pasa a ser la vista "Capas")
  GROK/alcance-d-neural/app.js (coordenadas fijas) incorrecto para nuestro uso → no se copian; se recalculan genéricas
  GROK/alcance-d-neural/app.js (render canvas, curvas, partículas, hit-test) válido → absorber, adaptado a dataset dinámico
  styles.css (tokens de color)                    válido → absorber, ya coinciden con los nuestros
```

### Industry

`N/A — patrón repo`. Layout radial por anillos concéntricos para grafos
categorizados es una técnica estándar de dataviz (sin librería nueva,
mismo enfoque "canvas custom" ya usado en `GROK/alcance-d-neural`).

### Discovery / Modo

```text
Modo: A (code-intel, pack humanflow) + lectura completa de App.jsx y de
GROK/alcance-d-neural/{app.js,data.js,styles.css} en esta sesión.
```

### TOUCH GRAPH

| Archivo | path·Symbol | Qué cambia |
|---|---|---|
| `src/App.jsx` | `App` | Quita `BodySilhouette`, `viewTab`, `view-tabs`, `layerVisuals`, `reachableIds`, `steadyVisual` (solo servía a `layerVisuals`); añade estado `layersView` (`'capas'\|'grafo'`) |
| `src/body/BodySilhouette.jsx`, `src/body/bodyRegions.js` | — | Eliminados (sin uso tras este plan) |
| `src/layers/NeuralGraph.jsx` | nuevo | Canvas: layout radial por capa, curvas, partículas, glow, hit-test, tooltip, `onSelectNode` |
| `src/layers/LayerCascade.jsx` | — | Sin cambios — pasa a montarse bajo el tab "Capas" |
| `src/styles.css` | `.layout__views`, nuevas `.layers-panel*` | 2 columnas en vez de 3; tabs grandes con glow |

#### NO TOCAR

| Archivo | Por qué |
|---|---|
| `src/engine/*` | Fuera de radio — el grafo consume `nodeReach`/`dataset` ya calculados, no toca el motor |
| `src/detail/DetailCard.jsx` | Sin cambios — sigue siendo la Ficha A/B, mismo contrato |
| `src/data/vitamin-d.json` | Fuera de radio |

#### Edges

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `App.jsx` → `NeuralGraph.jsx` (nuevo) | render | sí — recibe `dataset`, `nodeReach`, `onSelectNode={setCascadeNodeId}` (mismo callback que ya usa `LayerCascade` hoy) |
| e2 | `App.jsx` → `BodySilhouette` (eliminado) | import muerto | sí — se retira el import y el árbol de render asociado |
| e3 | `styles.css` → `.layout__views` | reestructura de columnas | sí — de 3 a 2, la de capas pasa a `1fr` |
| e4 | Ficha B (`cascadeNodeId`) → `DetailCard` | sin cambio de contrato | sí — ahora la alimentan 2 fuentes (Capas o Grafo), mismo estado, mismo componente |

Superficie: solo local (`npm run dev`). Sin release.

### CLASIFICACIÓN

```text
CLASIFICACIÓN:
  BodySilhouette + bodyRegions + view-tabs + layerVisuals/reachableIds   incorrecto (sin uso) → eliminar, no dejar código muerto
  Coordenadas x,y de GROK/alcance-d-neural/data.js                       incorrecto para reuse directo → no copiar, recalcular
```

### CONTRATOS/POLÍTICAS

`n/a` — `NeuralGraph` respeta el mismo contrato que `LayerCascade`
(`onSelectNode(nodeId)`), no se inventa una interfaz nueva para el
padre.

### IMPACTO

- Si `NeuralGraph` usa las coordenadas fijas de GROK en vez de un
  layout genérico → se rompe con cualquier dataset que no sea
  vitamina D exacta (contradice Rev9, "cualquier flow") — bloqueante,
  por eso el layout genérico es un requisito de este Punto, no una
  mejora opcional.
- Si se elimina `BodySilhouette` sin quitar también `layerVisuals`/
  `reachableIds`/`steadyVisual` en `App.jsx` → quedan funciones
  huérfanas calculando algo que nadie lee — deuda muerta inmediata.
- Si `NeuralGraph` no reutiliza el mismo `onSelectNode` que
  `LayerCascade` → la Ficha B tendría 2 fuentes con contratos
  distintos, más difícil de mantener — deben ser intercambiables.
- Sin superficie externa, sin release.

### Cambios (execution blocks)

#### Punto 1 — Quitar el muñeco y su código asociado
`App.jsx`: eliminar import/render de `BodySilhouette`, estado
`viewTab`, bloque `view-tabs`, `layerVisuals`, `reachableIds`,
`steadyVisual`. Borrar `src/body/BodySilhouette.jsx` y
`src/body/bodyRegions.js`. DoD: `npm run build` sin warnings de
importaciones/variables no usadas; `grep -r BodySilhouette src` → 0.

#### Punto 2 — `NeuralGraph.jsx`: layout genérico + render base
Canvas con layout radial: un anillo por `dataset.layers[i]` (radio
creciente con `i`), nodos de esa capa repartidos por ángulo dentro del
anillo; nodo(s) `isPrimary` al centro. Curvas cuadráticas entre nodos
conectados (mismo cálculo que GROK, `curvePoints`/`pointOnCurve`).
Color/estado por nodo: `nodeReach[id]` (`hit→on`, `faint→soft`,
`spared→off`), mismos halos/glow que GROK adaptados a nuestros tokens
de color. DoD: con `vitamin-d.json` (10 nodos, 7 capas) se ve una red
coherente, sin solapes graves, con los nodos alcanzados iluminados.

#### Punto 3 — Interacción: hit-test, tooltip, selección
Puntero → `hitTest` (igual que GROK, distancia al centro del nodo).
Hover → tooltip con nombre + capa + estado. Clic → `onSelectNode(id)`.
Partículas ambientales continuas en aristas activas (sin control de
replay, ver Scope). DoD: clicar un nodo del grafo actualiza la Ficha B
exactamente igual que clicar un subnodo en "Capas" hoy.

#### Punto 4 — Layout: 2 vistas con tabs grandes + reestructura de columnas
`App.jsx`: estado `layersView` (`'capas'|'grafo'`), tabs grandes sobre
el panel de capas (glow en el activo). `styles.css`:
`.layout__views` pasa de 3 a 2 columnas (fichas | panel-de-capas
`1fr`), fichas ganan la proporción que tenía el muñeco. DoD: el panel
de capas visiblemente más ancho/horizontal que antes; alternar
Capas/Grafo no pierde la selección de Ficha B.

### PROPAGACIÓN

e1-e4 propagadas en los Puntos 1-4. `App.jsx` es el único punto de
integración (confirmado, sin otros callers).

### VERIFY

```text
VERIFY:
- Repro ............................................. n/a (feature nueva)
- Checks (npm run build, SSR smoke test) ............ sí — por Punto
- Callers/edges propagados .......................... sí — e1-e4
- Sin paths rotos .................................... sí — grep BodySilhouette=0 tras Punto 1
- Superficie ......................................... n/a
- Sin stubs .......................................... sí — NeuralGraph renderiza y responde a clic de verdad, no placeholder
- Tests .............................................. no pedidos
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - Layout radial genérico es una aproximación razonada (anillos por capa), no un algoritmo de grafo probado (force-directed real) — válido para datasets de 8-20 nodos como los actuales; con datasets muy grandes (40+) podría verse apretado, ajustable después con datos reales.
  - Verificación visual real (solapes, legibilidad de curvas) no se puede confirmar sin navegador en esta sesión — se verifica por SSR (renderiza sin excepción) y por revisión del cálculo de coordenadas, no a ojo.
```

## Status (Rev10)

`done` — Puntos 1–4 ejecutados sin medias.

- **Punto 1:** `src/body/` eliminado entero (`BodySilhouette.jsx`,
  `bodyRegions.js`). `App.jsx`: quitado `viewTab`/`view-tabs`,
  `layerVisuals`, `reachableIds`, `steadyVisual` (dead code sin el
  muñeco que los consumía). `grep -r "BodySilhouette|bodyRegions|
  view-tabs|viewTab" src` → 0 resultados.
- **Punto 2-3:** `src/layers/NeuralGraph.jsx` nuevo — layout **genérico**
  (`computeLayout`): anillo concéntrico por capa (`BASE_RADIUS=90` →
  `MAX_RADIUS=300`), nodos repartidos por ángulo dentro de su anillo,
  primarios al centro — cero coordenadas copiadas de GROK. Curvas
  cuadráticas, partículas ambientales continuas en aristas activas
  (sin control de replay, consistente con Rev8), hit-test por
  distancia al puntero, tooltip, clic → `onSelectNode(id)` (mismo
  contrato que `LayerCascade`).
- **Punto 4:** `App.jsx` — `layersView` (`'capas'|'grafo'`) con tabs
  grandes (`layers-panel__tabs`) sobre el panel; `styles.css`:
  `.layout__views` pasa de 3 a 2 columnas
  (`minmax(46rem,56rem) minmax(32rem,1fr)`), tab activo con glow
  (`box-shadow` doble: borde + halo difuso). CSS muerto de
  `.body-silhouette*`/`.view-tabs*` retirado.

**VERIFY ejecutado:**
- `npm run build` limpio (45 módulos, uno menos que antes — se fue
  `body/` completo).
- `grep` de símbolos eliminados: 0 resultados en `src/`.
- SSR: `App` renderiza sin excepción (tab "Capas" por defecto,
  `layer-cascade` presente, `body-silhouette` ausente).
- **`NeuralGraph` renderizado de forma aislada con datos reales**
  (`vitamin-d.json`, `propagate()` a severidad 15, `nodeReach` real) —
  no placeholder, se ejecutó `computeLayout` de verdad sobre el
  dataset real sin excepciones.

**Pendiente de verificación humana** (canvas no es inspeccionable por
SSR — el dibujo real solo se ve en navegador): solapes de nodos en el
layout radial con datasets de más nodos, legibilidad de las curvas,
sensación del glow en las tabs.

```
┌─ VERIFY Rev10 ─────────────────────────────┐
│ Build limpio                     [✓]         │
│ Código muerto del muñeco fuera   [✓]         │
│ SSR App + NeuralGraph aislado    [✓]         │
│ Layout genérico (no copiado)     [✓]         │
│ Verificación visual real (canvas) [ ] pendiente humano │
└─────────────────────────────────────────────┘
```

---

## Rev11 — zoom/pan/autofit en el grafo (fix directo, sin okplan formal)

Petición directa: el layout radial genérico (Rev10) puede apretarse con
datasets de muchos nodos — hacía falta zoom.

- `NeuralGraph.jsx`: estado `view {zoom, panX, panY}` en el mismo ref
  que ya guardaba posiciones/partículas (sin re-render por frame).
  Rueda del ratón = zoom hacia el punto bajo el cursor (no hacia el
  centro — se recalcula `pan` para que el punto del grafo bajo el
  cursor no se mueva). Arrastrar (`pointerdown`/`move`/`up`) = pan;
  umbral de 3px para distinguir arrastre de clic (si no se movió lo
  suficiente, el `pointerup` dispara la selección del nodo igual que
  antes). Botón "Autofit" (esquina superior derecha, overlay) resetea
  `zoom:1, pan:0,0`.
- `hitTest`/tooltip actualizados para convertir coordenadas de pantalla
  al espacio del grafo pasando por la transformación de zoom/pan
  vigente (antes asumían escala fija de ajuste al ancho).
- Límites: `zoom` entre 0.6 y 4 — no se puede alejar tanto que se
  pierda el grafo ni acercar tanto que pierda sentido.

Build + SSR limpios (render aislado con dataset real, sin excepción).
No verificado a ojo (sin navegador, por instrucción del usuario).

---

## Rev12 — fix real de "Autofit" + chips de capa + leyenda de color

Bug reportado: "Autofit" no rellenaba el panel. Causa raíz encontrada:
`resize()` forzaba `canvas.style.height` a una relación de aspecto fija
(`rect.width × 720/1000`), ignorando el alto real del panel — el canvas
nunca ocupaba el 100% disponible, autofit solo podía encajar dentro de
esa altura falsa.

- `NeuralGraph.jsx`: `resize()` ahora usa `rect.width`/`rect.height`
  reales (el CSS `height:100%` del canvas, sin override JS). Nuevo
  `fitScale()`/`fitPan()` — encaje letterbox real (mundo 1000×720
  dentro del panel actual, centrado, sin deformar). `Autofit` y el
  render inicial recalculan este encaje contra el tamaño real; un
  flag `interacted` deja de recalcular automáticamente en cada resize
  una vez el usuario ha hecho zoom/pan a mano (para no pisarle el
  gesto), y `Autofit` lo resetea.
- Chips de capa arriba (`neural-graph__layers`, mismo lenguaje visual
  que "Autofit" — píldora sutil, blur): "Todas" + una por
  `dataset.layers`. Clic filtra — nodos/aristas/partículas fuera de la
  capa activa bajan opacidad (`dim`), igual que el filtro de grupo que
  traía `GROK/alcance-d-neural` originalmente (se había omitido en
  Rev10 por parecer redundante con el rail; el usuario confirmó que sí
  lo quiere dentro del propio grafo).
- Leyenda de color abajo a la izquierda (`neural-graph__legend`):
  3 pips (Activo/Rozado/Apagado), sutil, overlay con blur, mismo
  patrón visual que los chips.
- `.neural-graph__canvas` pasa a `position:absolute;inset:0` — el
  canvas ya no empuja el layout con los chips/leyenda por encima, todo
  se superpone.

Build + SSR limpios (chips ×8 = "Todas" + 7 capas, leyenda presente,
sin excepción). No verificado a ojo (sin navegador).

---

## Rev13 — Autofit real: ajusta al contenido, no al lienzo abstracto

Feedback: "Autofit no hace nada". Causa raíz: el Rev12 ya rellenaba el
panel de verdad, pero seguía encajando el rectángulo **abstracto**
1000×720 completo — con los nodos ocupando solo una fracción central de
ese rectángulo, el zoom resultante apenas se notaba al pulsar el botón.

- `fitScale`/`fitPan` ahora calculan el **rectángulo real que ocupan
  los nodos** (`contentBounds()`: min/max de `x,y ± radio`, +24px de
  margen para la etiqueta bajo cada nodo) y ajustan a ESO, no al
  lienzo completo — con un 8% de aire (`× 0.92`), "casi al límite" del
  panel como se pidió, no pegado al borde.
- **Verificado numéricamente** (no solo "build pasa"): con el dataset
  actual (10 nodos) y un panel simulado de 1200×600px, la escala pasa
  de 0.833 (encaje al lienzo completo) a 1.315 (encaje al contenido) —
  **1.58× más zoom real**, medido con el mismo `computeLayout()` del
  componente, no una estimación a ojo.

Build + SSR limpios. No verificado a ojo en navegador real (por
instrucción del usuario), pero la ganancia de escala está medida con
números reales del propio código, no solo "debería verse mejor".

---

## Rev14 — render "organismo de cristal" (puerto de GROK/alcance-d-cascade-ui)

Petición directa: mejorar el estilo visual del grafo tomando el render
de `GROK/alcance-d-cascade-ui/app.js` — mismo principio que el resto
del puerto del grafo (Rev10): se toma el **estilo de render**, no las
coordenadas fijas de ese archivo (siguen viniendo de `computeLayout()`,
genérico).

- `NeuralGraph.jsx`: nodos pasan de círculo plano a render por capas —
  aura volumétrica, membrana translúcida (gradiente radial
  descentrado), cavidad hueca, orgánulos internos animados (rotan con
  `time`), anillos finos internos, núcleo brillante con bloom (solo
  estado `on`), borde tipo Fresnel, reflejo especular ("cristal
  mojado"). Fondo ambiental nuevo: glow tenue tras el/los nodo(s)
  primario(s) + polvo animado. Partículas con variación de tamaño
  (antes fijo).
- Colores: mismos tokens ya usados en el resto del grafo (`--color-fg`
  ≈ rgb(232,228,216), `--color-warn` ≈ rgb(224,138,60)) — no se
  importaron los hex propios de GROK, se mantiene la paleta ya
  consistente con el resto de la app.
- Zoom/pan/autofit/chips de capa/leyenda (Rev11-13) sin cambios — solo
  se sustituyó el render interno de nodos/fondo/partículas.

Build + SSR limpios. **Límite honesto de esta verificación:** SSR no
ejecuta el `draw()` real (vive dentro de un `useEffect`, solo corre en
navegador) — solo confirma que el componente monta sin excepción, no
que el dibujo se vea bien. Verificación visual real pendiente del
usuario (sin navegador en esta sesión, por instrucción explícita).

---

## Rev15 — activar aristas reales en DetailCard (okplan)

**DIAGNÓSTICO**
- síntoma: la ficha de detalle no dice qué produce el nodo seleccionado
  hacia adelante, ni con qué relación/fuerza llega el efecto en cada
  salto de "Cómo llegó la carencia hasta aquí" — solo nombres
  encadenados con flechas mudas.
- origen: `nodeConnections()` (`src/engine/propagation.js:291`) se
  escribió para esto (spec §4) pero nunca se conectó a ninguna vista;
  `DetailCard.jsx:64-77` imprime `chainNodes` sin tocar `dataset.edges`
  en ningún punto.
- provoca: el usuario ve "Sangre → Hígado → Riñón" pero no el porqué de
  cada flecha (`increases`/`decreases`/`activates`/`inhibits`,
  `strength`), ni qué más modifica el nodo actual (`nodeConnections`
  outputs) — confirmado por grep, cero consumidores de esa función.
- familia: **orphan-control** — el motor calcula la capacidad
  (`relationship`/`strength` por edge), pero nunca se cableó a un
  control/vista real de la UI.
- remedio: leer `dataset.edges` directamente dentro de `DetailCard`
  (ya recibe `dataset` como prop) para (a) anotar cada salto de la
  cadena retrospectiva con su relación+fuerza, y (b) añadir una
  sección nueva "Afecta a" con los outputs reales del nodo
  seleccionado.

**Tier:** XS · **Modo:** graph-strict (radio ya cerrado a 1 archivo
+ estilos) · **Legitimidad:**
- `DetailCard.jsx`: válido → absorber (extiende el bloque existente,
  añade sección nueva).
- `nodeConnections()` (`propagation.js:291`): se deja intacta, **no se
  usa** — devuelve solo ids (`{inputs, outputs}`), no
  relationship/strength; filtrar `dataset.edges` directo en
  `DetailCard` da el dato completo sin tocar el motor ni su contrato.
  Sigue siendo código sin consumidor tras este cambio — deuda
  documentada, no se elimina por si algún dataset futuro la necesita
  vía otra vista.

**Touch graph (XS)**

| Archivo | Símbolo | Qué cambia | Propagar |
|---|---|---|---|
| `src/detail/DetailCard.jsx` | `DetailCard` | añade lookup de edges por nodo (`outEdges`, `edgeBetween`), sección "Afecta a", relación en cada salto de la cadena | no — mismas props, ningún caller cambia |
| `src/styles.css` | (nuevas clases `.detail-card__edges*`) | estilos de la sección nueva y del tag de relación en la cadena | no |

NO TOCAR: `App.jsx` (ya pasa `dataset` completo, sin nueva prop
necesaria), `engine/propagation.js` (sin cambios), `NeuralGraph.jsx`
(fuera de pedido).

**Cambios**
1. Helper `relationLabel(relationship)` → `{ verb, sign }` en
   español (`increases`→"aumenta"/+, `activates`→"activa"/+,
   `decreases`→"reduce"/−, `inhibits`→"inhibe"/−).
2. `outEdges = dataset.edges.filter(e => e.from === node.id)` → nueva
   sección "Afecta a" listando nodo destino + verbo + `strength` (como
   %, ej. "70%").
3. Para cada par consecutivo de `chainNodes`, buscar
   `dataset.edges.find(e => e.from === a.id && e.to === b.id)` y
   mostrar el verbo entre los dos nombres (reemplaza la flecha muda
   `→` por `nombre —aumenta→ nombre`).
4. CSS: line reutiliza tokens existentes (`--color-warn` para
   relaciones inversas, `--color-fg` para directas), sin nuevos
   tokens.

**Impacto:** aditivo, no rompe contrato de `DetailCard` (mismas
props) ni el build; visible en ambas fichas (A y B) por ser el mismo
componente.

**VERIFY:** build limpio (45 módulos) · SSR con `vitamin-d.json` real
(nodo `kidney`, escenario "moderada") sin `NaN`/`undefined` ·
confirmado que "Afecta a" lista los 3 outputs reales de `kidney`
(`activates` a bone/immune/muscle) y que la cadena
`serum_d → liver → kidney` muestra "aumenta (100%) → activa (90%)",
coincidente exacto con `strength: 1` / `strength: 0.9` del dataset.

**Status:** done — sin superficie humana verificada en navegador (por
instrucción del usuario), solo SSR con datos reales.

---

## Rev16 — grafo: color por capa, tamaño por severidad, zonas por sector, superficie completa + tipografía fluida (okplan)

**DIAGNÓSTICO**
- síntoma: (a) el grafo colorea nodos **solo por estado** (on/soft/off)
  — órganos y hueso son visualmente idénticos si están en el mismo
  estado; (b) el tamaño de nodo solo depende de `critical`/`isPrimary`,
  no de cuánto le pega realmente el efecto; (c) cada capa ocupa un
  anillo completo de 360° — capas se mezclan angularmente, no hay
  "zona" reconocible por capa; (d) el panel del grafo comparte columna
  fija con las fichas incluso cuando el usuario está en la pestaña
  Grafo, sin usar el ancho real disponible; (e) la tipografía salta
  entre 3 tamaños fijos de `html{font-size}` (18/20/22px) — en
  monitores/ventanas de ancho intermedio esto **estira mal** la
  cuadrícula (`minmax(46rem,56rem)` cambia de 828px a 1012px solo por
  el data-density, no por el ancho real de pantalla).
- origen: `computeLayout()` y `draw()` en
  `src/layers/NeuralGraph.jsx:40-70,398-556` — paleta fija por `state`
  (`REACH_TO_STATE`), radio fijo por `critical`; `html{font-size}` en
  `src/styles.css:47-62` — 3 valores discretos sin relación al ancho
  real del viewport.
- provoca: el grafo no comunica **tipo de capa** (solo intensidad),
  el tamaño no comunica **dónde se concentra** el efecto (solo si el
  nodo *podría* ser crítico), y la tipografía "salta" en vez de
  adaptarse — confirmado, es el mismo mecanismo que `layout__views`
  usa rem fijos (`46rem`/`56rem`) atados a un `font-size` que solo
  tiene 3 valores posibles.
- familia: **contract-drift visual** — el motor ya tiene toda la
  info necesaria (`layer.anatomyId`, `nodeState.ratio`) pero el
  render del grafo no la consume; + **layout rígido** en tipografía
  (escalón fijo en vez de función continua del viewport).
- remedio: (1) paleta de color por `anatomyId` (7 valores del catálogo
  cerrado, no por dataset concreto — sigue siendo genérico), el
  estado modula brillo/saturación, no el matiz; (2) radio de nodo
  derivado de `|ratio - 1|` real (severidad), no solo de flags
  estáticos; (3) `computeLayout` reparte cada capa en su propio
  sector angular (no anillo completo) — capas no se mezclan; (4) grid
  de `.layout__views` se reconfigura cuando la pestaña activa es
  "Grafo" para que ocupe la fila completa; (5) `html{font-size}` pasa
  de 3 valores fijos a una fórmula `clamp()` continua del ancho de
  viewport (técnica real "fluid typography" / CSS locks, no
  inventada) — el selector S/M/L pasa de fijar el tamaño a ser un
  `±8%` sobre esa base fluida, no se elimina.

**Tier:** M · **Modo:** graph-strict

**Legitimidad**
- `NeuralGraph.jsx` (`computeLayout`, `draw`): válido → absorber y
  extender (mismo contrato `{layers, dataset, nodeReach, onSelectNode}`
  + 1 prop nueva `nodeStates`, no rompe callers existentes fuera de
  `App.jsx`).
- `App.jsx` (render de `<NeuralGraph>`, `.layout__views`): válido →
  absorber (añade prop + clase condicional, no reestructura).
- `styles.css` tipografía (`html{font-size}`, `data-density`): mixto →
  refactorizar — se queda el mecanismo de `data-density` (no se
  elimina la feature), se corrige el valor base de fijo a fluido.
- `DensitySelector.jsx`: válido → absorber sin cambios (sigue
  disparando `data-density`, solo cambia qué hace ese atributo en CSS).

**Touch graph (M)**

| Nodo | path · Symbol | Rol |
|---|---|---|
| `src/layers/NeuralGraph.jsx` | `computeLayout` | añade sector angular por capa + radio por severidad (nuevo param `severityById`) |
| `src/layers/NeuralGraph.jsx` | `draw` (nodos/aristas) | usa `layerColor(anatomyId, state)` en vez de paleta fija por estado |
| `src/layers/NeuralGraph.jsx` | `NeuralGraph` (props) | nueva prop `nodeStates` |
| `src/App.jsx` | render `<NeuralGraph>` | pasa `nodeStates` |
| `src/App.jsx` | `.layout__views` | clase condicional `layout__views--grafo` cuando `layersView==='grafo'` |
| `src/styles.css` | `html`, `html[data-density]` | fórmula `clamp()` fluida + `--density-scale` |
| `src/styles.css` | `.layout__views` (≥1440px) | nueva regla `--grafo` que da la fila completa al panel de capas |

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|---|---|---|---|
| e1 | `App.jsx` → `NeuralGraph` | prop nueva | sí — `nodeStates` ya se computa en `App.jsx:48`, solo se enhebra |
| e2 | `App.jsx` → `.layout__views` (JSX) | clase condicional | sí — no afecta a `LayerCascade` (vista Capas), solo al contenedor |
| e3 | `computeLayout` → `draw` | contrato de `positions` (ahora incluye zona/sector real) | sí — `draw` ya lee `pos.x/y/r` sin cambios de firma, no rompe |
| e4 | `html{font-size}` → toda la hoja (rem) | base tipográfica | sí — es intencional que TODO lo que usa `rem` escale con la fórmula fluida, es el punto del cambio |

NO TOCAR: `LayerCascade.jsx`/`LayerList.jsx` (vista "Capas", fuera de
pedido — el usuario pidió mejoras al *grafo*), `engine/propagation.js`
(ya expone `ratio` en `nodeStates`, no hace falta tocarlo),
`DetailCard.jsx` (Rev15, sin relación).

**Clasificación:** `computeLayout`/`draw` válido → extender · paleta
fija por estado → deuda a resolver en este mismo punto (no se aplaza)
· tipografía de 3 escalones → deuda a resolver en este mismo punto.

**Impacto**
- Si no propago `nodeStates` a `NeuralGraph`: el tamaño por severidad
  queda a medias (usaría solo `critical`, no el remedio real).
- Si no toco `.layout__views`: el punto 4 (superficie completa) no se
  cumple aunque el grafo se vea mejor.
- Superficie tocada: solo la vista "Grafo" + la tipografía global (que
  toca visualmente TODO, es el efecto buscado, no un side-effect).

**Cambios**
1. `LAYER_HUE` — tabla fija de 7 matices por `anatomyId` (catálogo
   cerrado, spec DATASET_PROMPT §3.3): sangre=rojo, órganos=ámbar,
   hueso=hueso/dorado pálido, linfático=verde, piel=rosa, nervioso=
   violeta, sentidos=cian. Helper `layerColor(anatomyId, state)` →
   `{shell, aura, core}` vía HSL, saturación/luz moduladas por
   `state` (on=brillante, soft=atenuado, off=gris, mismo matiz).
2. `computeLayout(layers, nodes, severityById)`: cada capa recibe un
   sector angular `2π/nLayers` (con margen entre sectores) en vez de
   360° completo; dentro del sector, radio base = `BASE + banda*gap`
   (2 bandas si la capa tiene >4 nodos, para no amontonar). Radio de
   nodo = `baseR(critical) * (1 + severidad*0.6)`, `severidad =
   min(1, |ratio-1|)`. Primarios siguen fijos al centro.
3. `App.jsx`: `nodeStates` ya existe (`useMemo` línea 48) → se pasa
   como prop nueva a `<NeuralGraph>`; `.layout__views` recibe
   `className` condicional según `layersView`.
4. CSS: `.layout__views--grafo` (dentro de `@media (min-width:1440px)`)
   — `grid-template-columns: 1fr`, panel de capas ocupa la fila
   completa a la altura disponible, fichas A/B pasan a una franja más
   baja debajo (siguen accesibles, no se eliminan).
5. CSS: `html{font-size}` pasa a
   `calc(clamp(15px, 0.75vw + 13px, 21px) * var(--density-scale))`;
   `data-density='s'` → `--density-scale:0.92`, `='l'` →
   `--density-scale:1.08`, default `--density-scale:1`.

**Industry:** N/A — patrón repo (tier M sin decisión de arquitectura
externa); la técnica de tipografía fluida vía `clamp()` es un patrón
CSS documentado y estándar (CSS Values and Units Module, soportado en
todos los navegadores modernos), no una librería externa a evaluar.

**VERIFY:** build limpio (45 módulos) · SSR de `NeuralGraph` con
`vitamin-d.json` real (escenario "Severa", D=5) sin `NaN`/`undefined` ·
`computeLayout` llamado directo con datos reales (export temporal solo
para la prueba, revertido después):
- **Sectores:** las 7 capas caen en rangos angulares propios y sin
  solape (Sangre -0.96, Órganos -0.39→-0.06, Hueso 0.51→0.83,
  Linfático 1.57, Piel 2.47, Nervioso -2.92, Sentidos -2.02).
- **Radio por severidad:** nodos con `ratio=0.05` (muy afectados)
  llegan a r=28-33.5, nodos con `ratio=0.95` (casi normales) se
  quedan en r=14.4 — coincide exacto con `base*(1+severidad*0.6)`.

**Status:** done — sin superficie humana en navegador (por instrucción
del usuario), verificado con datos reales vía SSR + llamada directa a
`computeLayout`.

### Fix post-entrega — laterales vacíos en panel ancho

El usuario reportó con captura de pantalla: al ocupar toda la fila
(Punto 4), el CONTENIDO del grafo seguía encogido en el centro con
aire vacío a los lados. Causa real: `computeLayout` reparte los nodos
en un mundo ~cuadrado (sectores angulares); en un panel muy ancho el
"fit al contenido" (Rev13) deja que la altura mande el escalado,
sobrando ancho.

Fix: `stretchToAspect(positions, panelAspect)` — nueva función en
`NeuralGraph.jsx`, estira (no recorta) las posiciones para que su caja
de contorno iguale el aspecto real del panel; el radio de cada nodo
no se toca (nunca se deforma el círculo, solo se separan más). Se
guarda el layout sin estirar en `stateRef.current.rawPositions` y se
deriva `positions` (la que lee `draw`) dentro de `resize()`, que ya
corre en mount + resize de ventana + cada vez que cambia el contenido
— cubre tanto el caso inicial como el redimensionado en vivo.

**VERIFY:** con el aspecto real del panel de la captura (~1850×560,
ratio 3.30) el layout raw (ratio 0.84) pasa a 2.96 tras estirar — de
un desajuste de 3.9× a quedar dentro de ~11% del objetivo (el 11%
restante es el margen fijo de radio/etiqueta, que a propósito no se
estira, si no las etiquetas de texto se verían desproporcionadas en
paneles muy anchos). Confirmado numéricamente que el radio de cada
nodo no cambia tras el estiramiento. Build limpio tras revertir los
exports temporales usados solo para la prueba. — ¿solución real? (scorecard vs industria)

**Detectado:** Human Flow architecture — visor de propagación biofísica:
una variable primaria se propaga por un grafo de nodos agrupados en 7
capas anatómicas, con motor real (DAG + feedback), fichas con cadena
causal y fuentes citadas, import de datasets generados por IA.
**Ámbito:** happy path — cargar → elegir escenario → navegar 3 vistas
sincronizadas → ver ficha con mecanismo/causa/fuentes → importar
dataset nuevo. **Superficie:** app local (`npm run dev`), sin release
deployado. **Modo:** strict.

### Scorecard (núcleo)

| # | Prestación | Tier | Evidencia | Carencia |
|---|---|---|---|---|
| 1 | Motor DAG (`propagate`) | **B** | `src/engine/propagation.js:97` — regresión numérica verificada esta sesión (mismos valores pre/post Rev9) | Mecanismo = ratio ponderado lineal, no ecuaciones cinéticas reales (ver INDUSTRY) |
| 2 | Motor feedback (`propagateIterative`) | **B** | `src/engine/propagation.js:219` — convergencia medida con dataset de juguete real (12-24 iteraciones, determinista) | Jacobi amortiguado simplificado vs. solvers ODE de la industria |
| 3 | Import JSON (`validateDataset`) | **B** | `src/data/ImportControl.jsx:5` — validación real, mensajes de error concretos | Formato propio, no un estándar de la industria (SBML/BioPAX) |
| 4 | Generación de dataset vía IA (`DATASET_PROMPT.md`) | **B** | Documento con esquema completo verificado contra el código real, checklist anti-fabricación | Sin tooling que valide el JSON generado antes de pegarlo (el usuario lo descubre al importar) |
| 5 | Grafo neuronal (zoom/pan/autofit) | **C** | `src/layers/NeuralGraph.jsx` — autofit verificado numéricamente (1.58× medido), pero sin uso real en navegador esta sesión | Sin VERIFY de superficie formal → techo C aunque el código funciona |
| 6 | Ficha + cadena causal + fuentes reales | **B** | `pathFromPrimary` (`propagation.js:275`) + `collectReferences` (`citations.js`) — anti-fabricación real, nunca inventa citas | Sin comparables de industria que hagan trazabilidad causal en tiempo real desde un grafo importado — diferenciador, no carencia |
| 7 | Motor multi-primario | **C** | `findPrimaryNodeIds` — verificado con test real, pero sin UI para alimentar 2 valores a la vez (aplazado a propósito, Rev9) | Capacidad de motor sin superficie que la explote |

**Conteos:** A:0 · B:5 · C:2 · D:0 · E:0 · F:0
**Suelo:** C · **Target ola:** B (ya casi alcanzado — 2 filas por VERIFY de superficie, no por código roto)

### INDUSTRY (comparativa real — protocolo §2.5)

| Apartado | Industria (URL · método) | Nosotros (path·símbolo) | Match |
|---|---|---|---|
| Simulación de pathway biológico | [Visinets](https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4447416/) — modelos ejecutables (EGFR-MAPK, insulina) vía ecuaciones cinéticas reales sobre SBML | `propagate()` — ratio ponderado lineal por edge, sin cinética real | **partial** — mismo job (simular pathway), mecanismo mucho más simple |
| Import de modelo estructurado | [CellDesigner/BiNoM](https://pmc.ncbi.nlm.nih.gov/articles/PMC3646686/) — SBML/BioPAX, formatos estándar interoperables | `validateDataset()` — JSON propio, no estándar | **partial** — job sí, formato no interoperable con la industria |
| Retroalimentación/ciclos | Solvers ODE (CellDesigner, Visinets) — ecuaciones diferenciales reales | `propagateIterative()` — Jacobi amortiguado, aproximación discreta | **partial** — mismo problema, método simplificado |
| Generación por IA de red causal | [ChatDiagram](https://www.chatdiagram.com/template/causal-loop-diagram-template) — texto→diagrama vía IA, genérico | `DATASET_PROMPT.md` — prompt específico de dominio (biofísico, capas anatómicas, motor con umbrales reales) | **sí** — mismo job, y más específico/útil para este dominio que el genérico |
| Visualización educativa curada | [Visible Body](https://www.visiblebody.com/blog/5-endocrine-hormone-activities-for-your-classroom) / AD Instruments — contenido fijo, curado a mano | Ficha con cadena causal + fuentes, generada dinámicamente desde cualquier dataset importado | **sí** (job distinto y más flexible) — pero sin la profundidad 3D/curricular de esas herramientas |
| Zoom/pan en grafo de red | Estándar universal en Cytoscape/Kumu.io/yEd | `NeuralGraph.jsx` (rueda + arrastrar + autofit) | **sí** (mecanismo comparable), sin verificar a ojo aún |

**Veredicto INDUSTRY:** 2 de 6 apartados en `sí`, 4 en `partial` — **no hay base para claim A** en ningún eje de motor/formato (usamos aproximaciones simplificadas frente a estándares reales de systems biology). Donde sí igualamos o superamos a la industria es en la **especificidad de la generación por IA** y en la **trazabilidad causal dinámica** — eso es real, no inflado.

### Packet

```text
OLA: C→B
FILAS: Grafo neuronal (superficie) · Motor multi-primario (UI que lo explote)
DoD: ninguna fila < B
NO TOCAR: filas ya en B (1,2,3,4,6)
VERIFY: citas+path ✓ · B→superficie+feeling≥3 PENDIENTE (fila 5) · A→INDUSTRY: no aplica todavía (mecanismos simplificados vs. industria real)
```

### Veredicto honesto (respuesta directa a "¿ofrecemos algo real?")

**Sí, con matices concretos, no un "sí" vacío:**
- El motor, el import, la generación por IA y la trazabilidad causal
  son **reales y verificados con evidencia** (números, no vibes) — no
  son humo ni maquetas.
- **No estamos a la altura de las herramientas de systems biology
  serias** (CellDesigner, Visinets) en el mecanismo de simulación —
  ellas usan cinética real y formatos estándar; nosotros una
  aproximación lineal con JSON propio. Eso es honesto, no un defecto
  oculto: es una decisión de alcance (visor educativo simplificado, no
  motor de investigación).
- **Donde sí competimos o ganamos:** la generación de datasets por IA
  específica de dominio (más útil que las herramientas genéricas de
  diagramas causales) y la ficha con cadena causal + fuentes reales
  generada dinámicamente (las herramientas educativas curadas no hacen
  esto, su contenido es fijo).
- **Lo que falta para defender B en firme:** una pasada de uso real en
  navegador (feeling ≥3) en el grafo neuronal — el código funciona
  (verificado numéricamente) pero nadie ha confirmado que "se sienta
  bien" usándolo de verdad.

```
.---------------------------.
|  ◐  OLA EN CURSO          |
|     falta superficie (fila 5) |
|     5/7 filas · claim B ◻ |
'---------------------------'
```
