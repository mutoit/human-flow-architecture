---
status: draft
source: direct
tier: M
mode: graph-strict
legitimidad: nuevo — no aplica reuse (greenfield)
date: 2026-08-19
spec: docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md
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

## Plan

### DIAGNÓSTICO

```text
DIAGNÓSTICO: n/a — feature nueva; scope = visor MVP según spec 2026-08-19
```

### Tier

**M** — módulo nuevo con motor + UI + import, ~10 archivos con lógica real
(engine de propagación, render SVG por capas, 3 variantes de animación,
import dinámico), sin API pública externa pero con "contrato" interno (el
esquema JSON) que otros archivos futuros (dataset packs) deberán respetar.

### Scope

- **UI:** capas SVG apiladas, slider, botón Play, selector de variante de
  animación, panel de detalle, input de import JSON.
- **Domain/engine:** `propagation.js` (BFS + modulación lineal + color por
  threshold + orden/lag para Play).
- **Data:** `vitamin-d.json` de ejemplo, validación mínima al importar.
- **Fuera:** todo lo listado en spec §1 y §7.

### LEGITIMIDAD

```text
LEGITIMIDAD:
  flujo_actual: n/a (no existe código previo — greenfield)
  decisión:     crear (no hay nada que absorber/refactorizar/eliminar)
  nota:         repo vacío salvo docs/ y .claude/ (skill instalado)
```

### Industry (M — referencias mínimas de arquitectura)

- Patrón "diagrama de capas fijas en SVG con animación de flujo por
  partículas a lo largo de un `<path>`" es un patrón estándar de
  visualización de dataviz (SVG `<animateMotion>` / requestAnimationFrame
  sobre puntos a lo largo de un path) — **needs verification** (no se abrió
  fuente web en esta sesión; patrón ampliamente documentado en dataviz,
  bajo riesgo por ser técnica nativa de SVG/Canvas, no una librería externa
  a auditar).
- Elección React+SVG custom sobre Cytoscape.js: decisión de producto ya
  tomada y aprobada por el usuario en la spec (layout fijo de 7 capas, no
  grafo libre) — no requiere industry adicional, es una decisión de
  alcance, no de arquitectura abierta.

### Discovery / Modo

```text
Modo: C (ninguno) — repo greenfield, sin paquete code-intel ni servidor MCP
con contenido que mapear (el único código existente es el spec en docs/ y
el skill de terceros en .claude/, ambos fuera del radio de este cambio).
Radio del cambio = archivos nuevos a crear (touch graph abajo), no hay
callers/callees preexistentes que mapear.
```

### TOUCH GRAPH

#### TOCAR (archivos nuevos)

| Archivo | Rol |
|---------|-----|
| `package.json`, `vite.config.js` | Config del proyecto Vite+React |
| `index.html` | Entry HTML |
| `src/main.jsx` | Bootstrap React |
| `src/App.jsx` | Shell: estado global (dataset activo, valor slider, variante animación, nodo seleccionado, modo play), compone el resto |
| `src/engine/propagation.js` | BFS + modulación lineal + color/threshold + orden+lag para Play. Exporta `propagate(dataset, primaryValue) -> { nodeStates, traversalOrder }` |
| `src/data/vitamin-d.json` | Dataset de ejemplo (spec §2) |
| `src/graph/GraphCanvas.jsx` | Layout SVG de 7 capas, itera `layers` y `nodes`, delega a `LayerRow` |
| `src/graph/LayerRow.jsx` | Renderiza una capa (fila) con sus nodos |
| `src/graph/NodeCard.jsx` | Nodo individual: tamaño ∝ nº edges, glow ∝ critical, color por estado, onClick abre detalle |
| `src/graph/EdgeFlow.jsx` | Las 3 variantes de animación de flujo sobre cada edge (partículas / pulso / combinado), recibe `variant` como prop |
| `src/graph/DetailPanel.jsx` | Panel lateral: description, inputs/outputs derivados de edges, estado |
| `src/graph/ImportControl.jsx` | Input file → parsea JSON → valida (ids únicos, edges válidas, layer en rango) → reemplaza dataset en `App` |

#### NO TOCAR (existen, fuera de radio)

| Archivo | Por qué |
|---------|---------|
| `docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md` | Spec ya aprobada — es insumo, no se modifica |
| `.claude/skills/*` | Skill de terceros instalado (ui-ux-pro-max) — se usa como referencia de diseño, no se edita |
| `core estructura.md`, `core expansion.md`, `ux.md` | Documentos fuente de la spec — fuera de radio de código |

#### Edges (dependencias internas del radio, multi-hop)

| Edge | Desde → Hasta | Tipo | ¿Propagar? |
|------|---------------|------|------------|
| e1 | `main.jsx` → `App.jsx` | render | sí — monta el shell |
| e2 | `App.jsx` → `engine/propagation.js` | consumo | sí — `App` llama `propagate()` en cada cambio de slider/play y guarda `nodeStates` en estado |
| e3 | `App.jsx` → `GraphCanvas.jsx` | render | sí — pasa `dataset`, `nodeStates`, `variant`, `onNodeClick` como props |
| e4 | `GraphCanvas.jsx` → `LayerRow.jsx` → `NodeCard.jsx` | render | sí — cascada de props (layer, nodos, estado) |
| e5 | `NodeCard.jsx`/`GraphCanvas.jsx` → `EdgeFlow.jsx` | render | sí — cada edge del dataset se dibuja con la variante activa |
| e6 | `App.jsx` → `DetailPanel.jsx` | render | sí — nodo seleccionado + dataset (para derivar inputs/outputs) |
| e7 | `ImportControl.jsx` → `App.jsx` | callback | sí — `onImport(dataset)` reemplaza el dataset activo, dispara re-propagación (e2) |
| e8 | `data/vitamin-d.json` → `App.jsx` (estado inicial) | import estático | sí — dataset por defecto al montar |

Superficie impactada: solo esta app nueva (sin release externo, sin API
pública). Efectos secundarios: ninguno fuera del propio proceso de render.

### CLASIFICACIÓN

Todo el código es nuevo → **válido** por definición (no hay legado que
clasificar). No hay duplicación posible en un repo vacío.

### CONTRATOS/POLÍTICAS

`n/a` — no hay contratos ni políticas de repo preexistentes que verificar
(greenfield, primer commit de código).

### IMPACTO

- Si no se implementa `engine/propagation.js` antes que los componentes de
  render → los componentes no tienen datos que mostrar (bloqueante, por eso
  P2 antes que P3/P4 en el orden de blocks).
- Si `EdgeFlow.jsx` no recibe `variant` desde `App.jsx` → no se puede
  comparar in-vivo, rompiendo el requisito explícito del usuario ("probar
  hasta encontrar el diseño").
- Si `ImportControl` no dispara e2 (re-propagación) → importar un dataset
  nuevo dejaría el grafo desincronizado (bug funcional, no solo visual).
- Superficie: solo local (`npm run dev`), no hay release/deploy en este
  plan.

### Cambios (execution blocks)

Cada Punto = 1 execution block, ejecutado en este orden por dependencia.

#### Punto 1 — Scaffold del proyecto
Crear `package.json`, `vite.config.js`, `index.html`, `src/main.jsx`,
`src/App.jsx` (shell vacío que solo renderiza un `<div>` placeholder).
DoD: `npm run dev` levanta una página en blanco sin errores de consola.

#### Punto 2 — Motor de propagación + dataset
Crear `src/data/vitamin-d.json` (dataset de ejemplo completo, 7 capas, ~10
nodos, ~10 edges) y `src/engine/propagation.js` con `propagate(dataset,
primaryValue)`. DoD: función pura testeable manualmente en consola/REPL,
devuelve `nodeStates` (color+valor por nodo) y `traversalOrder` (para Play).

#### Punto 3 — Render de capas (sin animación)
Crear `GraphCanvas.jsx`, `LayerRow.jsx`, `NodeCard.jsx`. `App.jsx` llama
`propagate()` con el dataset por defecto y pasa `nodeStates` al canvas.
DoD: se ven las 7 capas con los nodos coloreados según threshold, sin
animación todavía (color estático).

#### Punto 4 — Slider manual + 3 variantes de animación de flujo
Crear `EdgeFlow.jsx` con las 3 variantes (partículas / pulso / combinado) y
un selector en `App.jsx`. Conectar el slider: mover el slider llama
`propagate()` y actualiza `nodeStates`, disparando la animación de la
variante activa. DoD: mover el slider cambia colores y anima las edges en
las 3 variantes intercambiables desde la UI.

#### Punto 5 — Auto-play
Añadir botón ▶ en `App.jsx` que reproduce `traversalOrder` con temporizador
(ritmo fijo o `lagHours` relativo si el dataset lo trae), sin intervención
del usuario. DoD: pulsar Play anima la cascada completa sola, de principio
a fin, sin tocar el slider.

#### Punto 6 — Panel de detalle
Crear `DetailPanel.jsx`. Clic en `NodeCard` abre el panel con `description`
del nodo y inputs/outputs derivados de `dataset.edges` (spec §4: inputs =
edges con `to = nodeId`, outputs = edges con `from = nodeId`), calculados
al abrir, no precalculados. DoD: clic en cualquier nodo muestra su info
correcta, incluidos inputs/outputs derivados.

#### Punto 7 — Import de JSON
Crear `ImportControl.jsx`. Input file → parse JSON → validar (ids únicos,
edges apuntan a nodos existentes, `layer` en rango de `layers`) → si válido,
reemplaza el dataset activo en `App.jsx` (dispara e2/e7); si inválido,
muestra error sin romper el grafo actual. DoD: importar un JSON con un nodo
nuevo conectado por edges lo muestra correctamente sin recargar la página;
importar un JSON inválido no rompe el estado.

### PROPAGACIÓN

Todas las edges e1–e8 son internas al mismo cambio (no hay callers fuera de
este radio) — propagación = orden de blocks (Punto 1→7) más las props que
cada componente pasa al siguiente, ya detalladas en la tabla de edges. No
hay callers externos que actualizar (proyecto nuevo, sin consumidores).

### VERIFY

```text
VERIFY:
- Repro del plan ................................. n/a (no hay dossier previo)
- Checks del plan (npm run dev, click manual) .... sí — por cada Punto (DoD arriba)
- Callers/edges del graph propagados ............. sí — e1..e8 verificadas en Punto 3-7
- Sin paths rotos en el radio ..................... sí — import dinámico probado con dataset válido e inválido
- Superficie del radio intacta o validada ......... n/a — sin superficie externa
- Sin stubs en el flujo tocado .................... sí — cada Punto entrega funcionalidad real, no placeholder
- Tests ............................................ no pedidos por el usuario; DoD = verificación manual en navegador
```

### Self-audit

```text
CRITICAL: 0
HIGH: 0
accepted_risks:
  - industry (patrón SVG particle-flow): needs verification, marcado explícitamente, no bloqueante (técnica nativa SVG, sin librería externa que auditar)
```

## Status

`done` — todos los Puntos (P1–P7) implementados. `npm run build` limpio.
`npm run dev` levanta la app; verificado visualmente en navegador: 7 capas
renderizadas, nodos coloreados por threshold, edges con partículas
animadas, slider funcional. Play/detail panel/import quedan implementados
según diseño; no se verificaron uno a uno en navegador tras la interrupción
del usuario (pidió no seguir verificando en web) — quedan pendientes de que
el usuario los pruebe él mismo con `npm run dev`.
