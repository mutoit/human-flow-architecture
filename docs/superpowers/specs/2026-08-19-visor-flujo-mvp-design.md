# Visor de Flujo Biofísico — MVP (diseño)

**Fecha:** 2026-08-19 (revisión visual: 2026-08-19)
**Estado:** Revisión 2 — rediseño visual aprobado en chat, spec actualizada; NO implementado todavía
**Fuentes:** `core estructura.md`, `core expansion.md`, `ux.md` (raíz del repo), referencia visual aportada por el usuario (silueta + lista de capas + ficha de detalle)

**Historial:**
- Rev 1 (2026-08-19): grafo de 7 capas apiladas en SVG, nodos-círculo con
  edges animadas. **Implementado, construido, y descartado por el usuario**
  ("no quiero nada de lo que hiciste, a nivel visual, es horrible, se
  muere") — el código de esa revisión (`src/graph/*`, `EdgeFlow`,
  `NodeCard`, etc.) queda obsoleto y debe eliminarse en la próxima
  implementación, no reutilizarse.
- Rev 2 (este documento): silueta humana + lista numerada de capas + ficha
  de detalle ampliada, inspirado en referencia visual del usuario. Motor de
  propagación (`engine/propagation.js`) y modelo de datos base **sí se
  conservan** — el cambio es de capa visual, no de motor.

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
