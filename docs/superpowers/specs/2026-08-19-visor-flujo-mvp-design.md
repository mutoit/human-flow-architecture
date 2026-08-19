# Visor de Flujo Biofísico — MVP (diseño)

**Fecha:** 2026-08-19 (revisión visual: 2026-08-19; referencia de código encontrada: 2026-08-19; segunda vista añadida: 2026-08-19)
**Estado:** Revisión 4 — dos vistas de referencia real encontradas (`GROK/` y `GROK/segunda vista/`), a fusionar lado a lado; spec actualizada, NO implementado todavía
**Fuentes:** `core estructura.md`, `core expansion.md`, `ux.md` (raíz del repo), referencia visual aportada por el usuario (silueta + lista de capas + ficha de detalle), **`GROK/` (app TanStack Start/React/TS ya construida por el usuario, vista "muñeco")**, **`GROK/segunda vista/` (paquete HTML/CSS/JS vanilla independiente, vista "grafo por subcapas")**

**Historial:**
- Rev 1 (2026-08-19): grafo de 7 capas apiladas en SVG, nodos-círculo con
  edges animadas. **Implementado, construido, y descartado por el usuario**
  ("no quiero nada de lo que hiciste, a nivel visual, es horrible, se
  muere") — el código de esa revisión (`src/graph/*`, `EdgeFlow`,
  `NodeCard`, etc.) queda obsoleto y debe eliminarse en la próxima
  implementación, no reutilizarse.
- Rev 2 (2026-08-19): silueta humana + lista numerada de capas + ficha de
  detalle ampliada, inspirado en referencia visual del usuario. Diseño
  descrito de memoria/inferido, sin código de referencia real.
- Rev 3 (este documento): el usuario señaló `E:\HumanFlow\GROK\` — una app
  completa ya construida ("Vitamina D · Alcance D") que implementa el
  mismo concepto visual de Rev 2 con calidad de producción real (SVG de
  silueta, lista de capas, ficha de detalle, selector de severidad, tiras
  de labs). **Pasa a ser la referencia visual primaria** — Rev 2 queda
  como intención de diseño confirmada; Rev 3 documenta qué portar y qué
  diverge de nuestro motor. Ver §8.

## 1. Alcance

Sub-proyecto 1 de N. La especificación original (`core estructura.md`) describe una
plataforma comercial completa (visor + panel admin + auth/billing + backend +
fases predictivas/EHR). Este MVP es **solo el visor**: una app 100% client-side
que demuestra el concepto central — "¿qué pasa cuando X cambia?" — mediante un
grafo de 7 capas animado, sin backend, sin auth, sin panel admin.

Explícitamente fuera de alcance para este sub-proyecto: panel admin, auth/billing,
motor de dependencias múltiples (AND/OR, feedback loops — ver `core expansion.md`
§1.1/§1.3), personalización por paciente, integraciones externas. Se documentan
como limitaciones conocidas, no como deuda oculta.

## 2. Modelo de datos

Un solo archivo JSON por pathway, importable desde la UI (input file / drag-drop):

```json
{
  "config": {
    "name": "Vitamin D",
    "primaryVariable": "25(OH)D",
    "sliderMin": 0,
    "sliderMax": 150,
    "sliderDefault": 30,
    "unit": "ng/mL"
  },
  "layers": [
    { "id": 1, "name": "Input & Absorption" },
    { "id": 2, "name": "Transport & Stabilization" },
    { "id": 3, "name": "Activation & Regulation" },
    { "id": 4, "name": "Tissue Utilization" },
    { "id": 5, "name": "Homeostatic Regulation" },
    { "id": 6, "name": "Systemic Remodeling" },
    { "id": 7, "name": "Clinical Manifestations" }
  ],
  "nodes": [
    {
      "id": "kidney",
      "name": "Kidney (CYP27B1)",
      "layer": 3,
      "critical": true,
      "thresholdMin": 20,
      "thresholdMax": 100,
      "lagHours": 6,
      "description": "Convierte 25(OH)D a 1,25(OH)₂D mediante la enzima CYP27B1.",
      "bodyRegion": "kidney",
      "composition": "Túbulo renal proximal, enzima CYP27B1",
      "symptomsBySeverity": {
        "moderada": ["Fatiga leve", "Niebla mental ocasional"],
        "severa": ["Fatiga marcada", "Dolor óseo", "Infecciones frecuentes"]
      },
      "timeToAppear": "4-8 semanas en carencia sostenida",
      "keyFacts": ["VDR renal", "CYP27B1 es el paso limitante"],
      "references": [
        { "title": "Autor et al. Título del estudio. Año.", "url": "https://pubmed.ncbi.nlm.nih.gov/EJEMPLO/" }
      ]
    }
  ],
  "edges": [
    {
      "from": "liver",
      "to": "kidney",
      "relationship": "activates",
      "strength": 0.9,
      "modulation": { "type": "linear" }
    }
  ]
}
```

Añadir un componente nuevo = añadir un nodo con su `layer` + una o más `edges`
que lo conecten a nodos existentes. El motor lo posiciona y calcula su flujo
sin tocar código. Validación mínima al importar: ids únicos, edges apuntan a
nodos existentes, `layer` entre 1 y el máximo definido en `layers`.

`description` es opcional (texto libre, se muestra en el panel de detalle).
`modulation` en el edge es opcional; el motor MVP solo implementa
`type: "linear"` — el campo deja la puerta abierta a `"sigmoid"` /
`"saturation"` en una expansión futura sin cambiar el formato del JSON. Si
`modulation` falta, se asume lineal.

**Campos nuevos (Rev 2, todos opcionales — si faltan, esa sección de la
ficha simplemente no se muestra):**

| Campo | Tipo | Uso |
|-------|------|-----|
| `bodyRegion` | string | Ancla el nodo a un punto de la silueta (id de región predefinida: `brain`, `liver`, `kidney`, `bone`, `heart`, `gut`, `skin`, `blood`, `lymphatic`, `nerve`, `sense` — catálogo cerrado, ver §4). Si falta, el nodo no se puede seleccionar desde la silueta (solo desde la lista de capas). |
| `composition` | string | Subtítulo bajo el título de la ficha — "qué contiene" esa capa/nodo (ej. "Túbulo renal proximal, enzima CYP27B1"). |
| `symptomsBySeverity` | `{ [severityId]: string[] }` | Bullets de síntomas por escenario de severidad activo. Las claves deben coincidir con los `id` de `config.severityScenarios` (nuevo, ver abajo). |
| `timeToAppear` | string | Texto libre, tarjeta "tiempo hasta verse". |
| `keyFacts` | string[] | Bullets cortos, tarjeta "piezas clave". |
| `references` | `{ title: string, url: string }[]` | Lecturas — se muestran como links. **No inventar citas**: si el dataset no trae referencias reales, se omite la sección (nunca se genera contenido de relleno). |

**Nuevo en `config`:** `severityScenarios` — lista de escenarios
seleccionables en la barra superior (sustituye/expande el slider simple):

```json
"severityScenarios": [
  { "id": "normal", "label": "Normal", "primaryValue": 30 },
  { "id": "moderada", "label": "Moderada", "primaryValue": 15, "range": "10-19 ng/mL" },
  { "id": "severa", "label": "Severa", "primaryValue": 5, "range": "<10 ng/mL" }
]
```

El slider manual se mantiene disponible (no se elimina), los escenarios son
atajos que lo posicionan a un valor concreto.

**Vitales de cabecera:** `config.vitalNodeIds` — array de ids de nodo que se
muestran siempre como tarjetas en la barra superior (ej. `["kidney", "pth",
"remodeling"]` para mostrar 25(OH)D/Ca/PTH/ALP-equivalentes). Si falta, no
se muestra la barra de vitales.

## 3. Motor de propagación (MVP)

Propagación de una sola variable primaria, un input por nodo (sin AND/OR
multi-dependencia, sin loops de feedback — ver limitaciones §1). Algoritmo:

1. El nodo con `primaryVariable` recibe el valor del slider.
2. BFS por `edges` desde ahí: cada nodo destino calcula su valor con
   modulación lineal simple ponderada por `strength` del edge entrante.
   La función de modulación se resuelve por `edge.modulation.type`
   (dispatch simple); MVP solo implementa `"linear"` — otros tipos quedan
   `needs verification`/no soportados hasta una expansión futura.
3. Color por nodo según `thresholdMin`/`thresholdMax`: verde/ámbar/rojo.
4. `critical: true` fuera de rango dispara estado de alerta visual.
5. Se registra el orden de recorrido (para animación) y el `lagHours`
   acumulado desde el origen (para el modo Play).

Dos modos de disparo, ambos sobre el mismo motor:
- **Manual:** arrastrar el slider recalcula y anima en tiempo real.
- **Auto-play:** botón ▶ reproduce la cascada completa sola, nodo por nodo,
  respetando el orden BFS y el `lagHours` relativo (ritmo fijo si el dataset
  no trae lag), sin intervención del usuario.

## 4. Visual (Rev 2 — reemplaza el grafo de capas apiladas de Rev 1)

**El grafo SVG apilado de Rev 1 queda descartado.** Nuevo layout, inspirado
en la referencia visual del usuario, de 4 zonas:

```
┌──────────────────────────────────────────────────────────────────────┐
│  [Escenario: Normal|Moderada|Severa]        [▶ Ver de nuevo]         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                 │
│  │ 25(OH)D  │ │   Ca     │ │   PTH    │ │   ALP    │  ← vitales      │
│  │ 14 ng/mL │ │ 9.1mg/dL │ │    ↑     │ │  normal  │    cabecera     │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘                 │
├───────────┬──────────────────────────────┬───────────────────────────┤
│ 01 Sangre │                              │  CAPA 06  [rozada]        │
│ 02 Órganos│         SILUETA SVG          │  [emergente]              │
│ 03 Hueso  │      (con punto/callout      │  Nervioso                 │
│ 04 Linfát.│       en la región activa)   │  Neuronas, astrocitos...  │
│ 05 Piel   │                              │  ─────────────────────    │
│ 06 Nervi. │←── lista numerada,           │  [mecanismo en prosa]     │
│ 07 Sentid.│    clic = selecciona         │  ─────────────────────    │
│           │                              │  EN ESTA CARENCIA         │
│           │                              │  • Cansancio · niebla     │
│           │                              │  • Ánimo más plano        │
│           │                              │  ┌────────┐ ┌──────────┐  │
│           │                              │  │ tiempo │ │  piezas  │  │
│           │                              │  │ verse  │ │  clave   │  │
│           │                              │  └────────┘ └──────────┘  │
│           │                              │  LECTURAS                 │
│           │                              │  🔗 ...                   │
└───────────┴──────────────────────────────┴───────────────────────────┘
```

**Zona 1 — Vitales de cabecera:** tarjetas para `config.vitalNodeIds`, con
valor actual (del `nodeStates` del motor) y flecha ↑/↓/normal según status.

**Zona 2 — Selector de escenario + replay:** botones por
`config.severityScenarios` (posicionan el slider interno a su
`primaryValue`) + botón "Ver de nuevo" = el Play/auto-cascada ya diseñado
en §3, sin cambios de motor.

**Zona 3 — Lista numerada de capas** (`layers` del dataset, ordenadas por
`id`): clic selecciona la capa activa. Si la capa tiene un único nodo
representativo (o el dataset marca uno con `isPrimaryOfLayer: true`), ese
nodo se selecciona automáticamente para la ficha; si tiene varios, se
selecciona el primero y los demás quedan accesibles clicando directamente
en la silueta.

**Zona 4 — Silueta SVG:** figura humana de línea fina (trazado propio, sin
libería externa — mismo enfoque "SVG custom" ya decidido). Catálogo cerrado
de regiones anclables (`bodyRegion`, ver §2): cada región tiene una
coordenada fija dentro del viewBox de la silueta. El nodo/capa activo
dibuja un callout (línea + etiqueta) apuntando a su región. Nodos sin
`bodyRegion` no aparecen en la silueta (se seleccionan solo desde la lista
de capas) — limitación conocida a documentar en §7.

**Zona 5 — Ficha de detalle** (panel derecho, siempre visible cuando hay
capa/nodo seleccionado — no es un drawer que se abre/cierra, sustituye al
`DetailPanel` lateral de Rev 1):
- Header: `CAPA 0N` + badges de estado (ej. "rozada"/"emergente" — derivados
  de `status` del motor: `ok`→sin badge, `warning`→"rozada", `critical`→
  "emergente"/"crítica").
- Título = `node.name`. Subtítulo = `node.composition`.
- Párrafo de mecanismo = `node.description`.
- "En esta carencia" = `node.symptomsBySeverity[escenarioActivo]`. Si el
  dataset no trae bullets para el escenario activo, la sección se omite
  (no se inventa contenido).
- Tarjetas: `node.timeToAppear`, `node.keyFacts`.
- "Lecturas": `node.references`, como links (`target="_blank"` +
  `rel="noopener"`).
- Footer: `capa · valor actual · "alcanza <siguiente nodo del traversal>"`
  (reutiliza `traversalOrder` del motor §3 para saber qué nodo sigue en la
  cascada desde el seleccionado).

**Estética:** se mantiene fondo oscuro, tipografía limpia, colores de
estado (verde/ámbar/rojo) — pero el "glow" y las animaciones de partículas
de Rev 1 quedan fuera; el único movimiento vivo es el replay (§3) resaltando
capas en secuencia en la lista + silueta, no partículas viajando por
aristas (esa metáfora de grafo se abandona junto con el layout).

## 5. Stack y estructura (Rev 2)

React + Vite, SVG custom (sin Cytoscape.js, sin librería de anatomía
externa — la silueta es un `<path>`/trazado propio), sin backend.

```
E:\HumanFlow\
  index.html
  src/
    main.jsx, App.jsx
    engine/   (propagation.js — SIN CAMBIOS respecto a Rev 1)
    data/     (vitamin-d.json — dataset ampliado con campos Rev 2)
    body/     (BodySilhouette.jsx, bodyRegions.js — coordenadas del catálogo cerrado de regiones)
    layers/   (LayerList.jsx — lista numerada 01..N)
    detail/   (DetailCard.jsx, VitalsBar.jsx, ScenarioSelector.jsx)
  package.json, vite.config.js
docs/
  superpowers/specs/2026-08-19-visor-flujo-mvp-design.md  (este archivo)
```

**Eliminar en la próxima implementación** (código de Rev 1, ya descartado
por el usuario): `src/graph/GraphCanvas.jsx`, `LayerRow.jsx`,
`NodeCard.jsx`, `EdgeFlow.jsx`, `layout.js`. `DetailPanel.jsx` y
`ImportControl.jsx` de Rev 1 se **absorben/reescriben** (la lógica de
`nodeConnections`/import de `engine/propagation.js` e `ImportControl` se
mantiene, pero la presentación cambia a `DetailCard`/import se reubica).

## 6. Testing / DoD (Rev 2)

- `npm run dev` levanta la app; escenario "Normal" cargado por defecto.
- Clic en un escenario (Normal/Moderada/Severa) actualiza vitales de
  cabecera, colores de estado y la ficha si hay capa seleccionada.
- Clic en una capa de la lista numerada selecciona su nodo representativo y
  muestra su callout en la silueta + su ficha completa a la derecha.
- Clic en un punto de la silueta selecciona ese nodo (si tiene
  `bodyRegion`) igual que clicar la capa en la lista.
- Botón "Ver de nuevo" reproduce la cascada completa (resaltando capas en
  secuencia en lista + silueta) sin intervención del usuario.
- Importar un JSON distinto con los campos Rev 2 se refleja correctamente
  en vitales, lista de capas, silueta y ficha, sin recargar la página.
- Un nodo sin alguno de los campos opcionales (`composition`,
  `symptomsBySeverity`, `references`, etc.) omite esa sección de la ficha
  sin romper el render.

## 7. Limitaciones conocidas (explícitas, no deuda oculta)

- Sin multi-dependencia AND/OR por nodo (un edge = una influencia lineal).
- Sin feedback loops / convergencia iterativa.
- Sin panel admin, auth, backend, ni personalización por paciente.
- Validación de import es mínima (estructural, no biológica).
- **(Rev 2)** Catálogo de `bodyRegion` es cerrado y fijo (§4) — un dataset
  cuyos nodos no correspondan a regiones humanas (ej. un pathway sin
  anatomía, puramente conceptual) no podrá anclarse a la silueta; esos
  nodos solo son accesibles desde la lista de capas, sin callout visual.
- **(Rev 2)** `references` nunca se genera automáticamente — si el dataset
  no trae citas reales, la sección se omite (evita inventar bibliografía).

## 8. Referencia real encontrada — `GROK/` (Rev 3)

Carpeta `E:\HumanFlow\GROK\` — app propia del usuario, stack TanStack
Start + React + TypeScript + Tailwind, con auth/PWA/DB montados
(`src/lib/auth`, `migrations/`, `.vercel/`). **No se adopta el stack**
(HumanFlow sigue Vite+React+JSX plano, sin backend) — se porta solo la
**capa visual**, verificada contra el código fuente real de
`GROK/src/components/`:

| Componente GROK | Rol | Puerto a HumanFlow (Rev 2 target) |
|---|---|---|
| `body-figure.tsx` + `src/lib/anatomy.ts` (`HOTSPOTS`, `TAGS`, `CX`, `VB`) | Silueta SVG con 7 `<g>` de trazado (uno por capa), opacidad por estado (`op()`/`LAYER_OPACITY`), callout línea+etiqueta hacia la capa activa, círculos-hotspot clicables | `src/body/BodySilhouette.jsx` + `bodyRegions.js` — **mismo enfoque exacto**, trazado SVG propio por capa (no una silueta única con puntos, sino 7 dibujos superpuestos que aparecen/desaparecen) |
| `layer-rail.tsx` | Lista numerada 01–07, opacidad por `dim`/`passed`/`active`, disabled si `reach === "spared"` | `src/layers/LayerList.jsx` |
| `layer-detail.tsx` | Ficha: badges (capa + reach + evidencia), título, `where`, `lead`, "en esta carencia" (`what` + `signs[]`), grid 2 tarjetas (`lag`/`enzymes`), lecturas con links PubMed | `src/detail/DetailCard.jsx` |
| `severity-switch.tsx` | Selector de severidad tipo tabs (2 opciones aquí; Rev 2 pide 3: normal/moderada/severa) | `src/detail/ScenarioSelector.jsx` |
| `labs-strip.tsx` | Tarjetas de vitales de cabecera con tono ok/warn/bad | `src/detail/VitalsBar.jsx` |
| `flow-app.tsx` | Orquestador: estado `severity`/`activeIndex`/`playIndex`/`playing`/`settled`, cascada con `setTimeout` (720ms/paso), `runCascade()` | Lógica de Play/replay a portar a `App.jsx`, adaptada a nuestro `traversalOrder` del motor en vez de `lastReachedIndex` fijo |
| `src/lib/visual-state.ts` (`visualState()`, `LAYER_OPACITY`) | Máquina de 5 estados visuales (`ahead/active/passed/faint/spared`) → opacidad | Se porta tal cual como función pura, reutilizable con nuestro `nodeStates` |

**Divergencia clave — contenido fijo vs. motor genérico (no trivial, decidir antes de implementar):**
GROK no tiene motor de propagación por grafo: `flow-data.ts` es un
**array `LAYERS` estático** con bloques `moderate`/`severe` **escritos a
mano** (`reach`, `what`, `signs`) por cada una de las 2 severidades. No
hay `nodes`/`edges`/`thresholds` ni BFS — es contenido editorial fijo,
no un dataset importable. Nuestro Rev 2 pide lo contrario: motor genérico
con JSON importable, N nodos por capa, propagación por edges. **Opciones
para Rev 3, a decidir con el usuario antes de tocar código:**
1. **Motor decide, GROK da la piel:** mantener `engine/propagation.js` +
   dataset JSON (nodos/edges/thresholds) tal como en Rev 2 §2–3, y que
   `LayerDetail`/`BodySilhouette`/etc. consuman `nodeStates` del motor en
   vez de bloques `moderate`/`severe` escritos a mano. Preserva la
   promesa "añadir un nodo = editar JSON, sin tocar código". Requiere
   mapear el `status` del motor (ok/warning/critical) a los 3 `ReachKind`
   de GROK (`hit`/`faint`/`spared`) y generar `what`/`signs` desde los
   campos ya definidos en Rev 2 §2 (`description`,
   `symptomsBySeverity`).
2. **Copiar el modelo de GROK tal cual:** contenido fijo por capa y
   severidad (2–3 escenarios cerrados), sin motor de grafo genérico. Más
   rápido de portar 1:1, pero **abandona el requisito de import JSON
   dinámico** de la spec original (`core estructura.md`) — cualquier
   pathway nuevo requeriría escribir código, no solo JSON.

Sin resolver esta divergencia el "puerto" no es solo visual — cambia el
contrato de datos.

**Decisión del usuario (2026-08-19): opción 1 — "Motor decide, GROK da la
piel".** Se mantiene `engine/propagation.js` + dataset JSON (nodos/edges/
thresholds, Rev 2 §2–3) como fuente de verdad. Los componentes portados
de GROK (`BodySilhouette`, `LayerList`, `DetailCard`, `ScenarioSelector`,
`VitalsBar`) son puramente de presentación: reciben `nodeStates`/
`traversalOrder` del motor como props y no contienen contenido editorial
propio. Consecuencias concretas para el plan de ejecución:

- Mapeo `status` del motor (`ok`/`warning`/`critical`) → `ReachKind` de
  GROK (`hit`/`faint`/`spared`): `critical`→`hit`, `warning`→`faint`,
  `ok`→`spared` (a falta de mejor señal; revisar con datos reales del
  dataset vitamin-d.json ampliado).
- `what`/`signs` de la ficha salen de `node.description` +
  `node.symptomsBySeverity[escenarioActivo]` (ya definidos en Rev 2 §2),
  no se escriben a mano por capa como en GROK.
- La máquina de 5 estados visuales (`visualState()` de
  `GROK/src/lib/visual-state.ts`) se porta tal cual — es pura función de
  `reach`+`playIndex`/`playing`/`settled`, no depende del origen del dato.
- Próximo paso: **okplan** de ejecución (Punto por Punto) para portar los
  componentes de §8 sobre el motor Rev 2, sustituyendo Rev 1
  (`src/graph/*`) por completo. No implementar sin ese plan.

## 9. Segunda vista — `GROK/segunda vista/` (Rev 4)

Paquete independiente (HTML/CSS/JS vanilla, sin build), verificado
renderizando en navegador. Su propio `LEEME.md` ya lo describe como
complemento, no sustituto: *"No sustituye el muñeco de la app"*. Vista:
lista de 7 capas donde cada capa **se expande en subnodos** (ej. Órganos
→ Hígado, Riñón, Intestino, Paratiroides, Páncreas), estado `on`/`soft`/
`off` por subnodo y por capa, panel derecho con conteos (`n activos / n
rozados / n apagados`) y detalle de la capa seleccionada.

**Decisión del usuario (2026-08-19): las dos vistas se fusionan, una al
lado de la otra**, no se sustituyen ni se elige una — pantallas anchas
(2K/4K en adelante) tienen espacio de sobra; en 1080 debe seguir cabiendo
sin romperse. Layout objetivo:

```
┌─────────────────────────────────────────────────────────────────────┐
│  Zona 1 — vitales cabecera │ Zona 2 — severidad + replay             │
├───────────┬─────────────────────────┬─────────────────────────────┤
│ 01 Sangre │      SILUETA (muñoco)    │   GRAFO POR SUBCAPAS         │
│ ...lista..│      (GROK/, §8)         │   (segunda vista, este §9)   │
│           │                          │   01 Sangre ▸ 25OH-D · PTH…  │
│           │                          │   02 Órganos ▸ Hígado · ...  │
├───────────┴─────────────────────────┴─────────────────────────────┤
│                     Zona 5 — Ficha de detalle (§4, DetailCard)      │
└─────────────────────────────────────────────────────────────────────┘
```

- **≥ breakpoint ancho** (a definir en okplan, orientativo `≥1440px`):
  tres columnas — lista de capas | silueta | grafo de subcapas — con la
  ficha de detalle debajo o en cuarta columna si cabe (a decidir con
  medidas reales, no a ojo).
- **< breakpoint** (incluye 1080p): las dos vistas visuales pasan a
  pestañas/acordeón (Muñeco / Subcapas) bajo la misma lista de capas y la
  misma ficha de detalle — nunca se solapan ni se cortan.
- Selección de capa/nodo es **un solo estado compartido** (`activeNodeId`
  en `App.jsx`): clicar un subnodo en el grafo de subcapas selecciona el
  mismo nodo que clicar su región en la silueta o su fila en la lista —
  las tres vistas están sincronizadas sobre el mismo `nodeStates` del
  motor, no son independientes.

**Mapeo de datos — esta vista encaja aún mejor con el motor genérico que
la silueta:** `data.js` de esta vista ya modela "capa → lista de
subnodos con estado", que es exactamente `dataset.nodes` agrupados por
`node.layer`, con estado derivado de `nodeStates[node.id].status` (igual
mapeo `critical→on(activo)`, `warning→soft(rozado)`, `ok→off(apagado)`
que en §8, a validar con datos reales). No hace falta contenido nuevo:
los mismos nodos del dataset Rev 2 alimentan silueta + grafo de subcapas
+ lista + ficha, un solo modelo, cuatro vistas sincronizadas.

**Puerto a HumanFlow:**

| Origen (`segunda vista/`) | Puerto |
|---|---|
| `app.js` → `renderCascade()` (capas expandibles + subs) | `src/graph2/LayerCascade.jsx` |
| `app.js` → `renderDetail()` (panel derecho con conteos) | Se fusiona con `DetailCard.jsx` (§8) — mismo componente de ficha para ambas vistas, no duplicar |
| `data.js` (`ALCANCE_V2`) | **No se porta como dato** — era contenido fijo; sus subnodos (higado, rinon, intestino…) se convierten en `nodes` reales del `vitamin-d.json` (Rev 2 §2) con su propio `layer`, `thresholdMin/Max`, etc. |
| `styles.css` (tokens `--bg`, `--fg`, `--on`, `--soft`...) | **No se copian los hex propios** — se unifican a los tokens ya elegidos en §8 (`--color-bg: #0c0c0b`, etc.) para que ambas vistas compartan una sola paleta al estar lado a lado |

**Pendiente para el okplan:** breakpoint exacto de colapso a
tabs/acordeón, y si la cuarta zona (ficha) queda fija a la derecha en
ancho o pasa a franja inferior en las tres columnas — deben decidirse con
medidas reales durante la implementación, no en la spec.

## 10. Explicación por nodo + fuentes obligatorias (Rev 4, requisito del usuario 2026-08-19)

Dos requisitos nuevos, transversales a todas las vistas (§4, §8, §9):

### 10.1 Todo nodo clicable explica su relación con el origen de la búsqueda

No basta con mostrar `description`/`lead` del nodo de forma aislada.
**Cada nodo interactivo** (capa, subnodo del grafo de subcapas, punto de
la silueta — mismo `nodeId`, misma ficha) debe responder, al
seleccionarse, a dos preguntas encadenadas:
1. *"¿Qué es/qué pasa aquí?"* — ya cubierto por `description` +
   `symptomsBySeverity` (Rev 2 §2, `lead`/`what`/`signs` de GROK, §8).
2. *"¿Por qué está afectado, y cómo llegó la carencia hasta aquí desde el
   nodo de origen (`primaryVariable`)?"* — **nuevo bloque en la ficha de
   detalle**, no es un campo de datos nuevo: se deriva en runtime del
   motor (`nodeConnections`/`traversalOrder` de `engine/propagation.js`,
   ya existente) mostrando la cadena real recorrida, ej. *"25(OH)D →
   Hígado (CYP2R1) → Riñón (CYP27B1) → Paratiroides"*, con el `strength`/
   modulación de cada tramo si el dataset lo trae. Si el nodo no es
   alcanzable desde el origen en el escenario activo, el bloque indica
   explícitamente "no alcanzado en este escenario" (nunca se oculta en
   silencio ni se inventa una ruta).

Esto aplica igual de estricto a los subnodos del grafo de subcapas (§9)
que a las capas del muñeco (§8) — es una sola ficha compartida (§4), un
solo dato de origen (el motor), ninguna vista tiene contenido propio no
derivado del dataset.

### 10.2 Preparado para citas reales, nunca inventadas — botones/campos listos, contenido pendiente

El dataset Rev 2 (§2) ya define `node.references[]` (`{title, url}`) con
la regla **"nunca se inventa, si falta se omite"**. Rev 4 la refuerza y
la extiende a nivel global, no solo por nodo:

- Los campos/UI de referencias (por nodo y global, ver 10.3) se
  implementan ahora, **vacíos o con los papers reales ya usados como
  fuente de este dataset** (los mismos citados en `GROK/src/lib/
  flow-data.ts` §8, que sí son PMIDs reales de PubMed verificables — se
  pueden portar tal cual, son citas reales, no inventadas). Nodos nuevos
  que el usuario añada más adelante sin cita real quedan con la sección
  vacía hasta que se les añada — la UI no genera ni sugiere una fuente.
- Toda URL de referencia debe apuntar a la fuente original (PubMed, DOI,
  web del propio estudio) — nunca a un resumen de terceros no
  verificado.

### 10.3 Nueva zona: pestaña/sección "Fuentes" en la vista principal (obligatoria)

Además de las referencias por nodo (ficha, §4), la vista principal
necesita una **pestaña de nivel superior "Fuentes"**, visible siempre
(no escondida dentro de un nodo), que:

- Lista **todas** las referencias (`node.references[]`) de **todo** el
  dataset cargado, deduplicadas por `url`/`pmid`, agrupadas por nodo o
  capa de origen para que se sepa qué afirmación respalda cada cita.
- Cada entrada es un link real (`target="_blank"`, `rel="noopener"`) a la
  fuente original — el requisito no es "citar", es **enlazar** siempre a
  algo verificable.
- Incluye un botón **"Descargar dataset"** que exporta el JSON actual
  cargado en la app (`Blob` + `<a download>` client-side, sin backend) —
  así cualquiera puede auditar exactamente qué datos alimentan el
  flujo/las cifras/las citas que está viendo. Si en el futuro se adjuntan
  documentos fuente propios (PDFs de los papers, no solo el link), esta
  misma pestaña es donde se listarían para descarga — fuera de alcance
  de este MVP incluirlos ahora, pero la pestaña se diseña para poder
  añadir esa lista sin rehacer la UI.
- Si el dataset activo no trae ninguna referencia, la pestaña lo dice
  explícitamente ("Este dataset no incluye fuentes verificadas todavía")
  en vez de aparecer vacía sin explicación.

**Touch graph nuevo para el okplan:** `src/detail/SourcesTab.jsx` (o
integrado como pestaña dentro de la ficha existente, a decidir layout en
okplan), más una función pura en `engine/propagation.js` o nuevo
`engine/citations.js` que recorra `dataset.nodes[].references` y
devuelva la lista deduplicada — no se recalcula a mano en cada
componente.
