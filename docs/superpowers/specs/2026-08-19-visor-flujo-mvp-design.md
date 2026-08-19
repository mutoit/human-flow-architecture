# Visor de Flujo Biofísico — MVP (diseño)

**Fecha:** 2026-08-19
**Estado:** Aprobado por el usuario, listo para plan de implementación
**Fuentes:** `core estructura.md`, `core expansion.md`, `ux.md` (raíz del repo)

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
      "lagHours": 6
    }
  ],
  "edges": [
    { "from": "liver", "to": "kidney", "relationship": "activates", "strength": 0.9 }
  ]
}
```

Añadir un componente nuevo = añadir un nodo con su `layer` + una o más `edges`
que lo conecten a nodos existentes. El motor lo posiciona y calcula su flujo
sin tocar código. Validación mínima al importar: ids únicos, edges apuntan a
nodos existentes, `layer` entre 1 y el máximo definido en `layers`.

## 3. Motor de propagación (MVP)

Propagación de una sola variable primaria, un input por nodo (sin AND/OR
multi-dependencia, sin loops de feedback — ver limitaciones §1). Algoritmo:

1. El nodo con `primaryVariable` recibe el valor del slider.
2. BFS por `edges` desde ahí: cada nodo destino calcula su valor con
   modulación lineal simple ponderada por `strength` del edge entrante.
3. Color por nodo según `thresholdMin`/`thresholdMax`: verde/ámbar/rojo.
4. `critical: true` fuera de rango dispara estado de alerta visual.
5. Se registra el orden de recorrido (para animación) y el `lagHours`
   acumulado desde el origen (para el modo Play).

Dos modos de disparo, ambos sobre el mismo motor:
- **Manual:** arrastrar el slider recalcula y anima en tiempo real.
- **Auto-play:** botón ▶ reproduce la cascada completa sola, nodo por nodo,
  respetando el orden BFS y el `lagHours` relativo (ritmo fijo si el dataset
  no trae lag), sin intervención del usuario.

## 4. Visual

Layout de 7 capas apiladas en SVG (React + SVG custom, no librería de grafos
genérica — el layout es fijo, no un grafo libre).

- Nodo: tamaño ∝ nº de edges conectadas, glow ∝ `critical`, color por estado
  (verde/ámbar/rojo), transiciones suaves.
- Fondo oscuro para que el glow resalte — estética "dashboard científico
  premium".
- **3 variantes de animación de flujo**, seleccionables en vivo desde la UI
  (sin rebuild), para que el usuario compare y elija:
  1. Partículas viajando por las aristas.
  2. Pulso de color propagándose por edge.
  3. Combinación de ambas.
- Clic en nodo → panel de detalle lateral (nombre, capa, inputs/outputs,
  estado, descripción) — progressive disclosure, según `ux.md` §3.

## 5. Stack y estructura

React + Vite, SVG custom (sin Cytoscape.js), sin backend.

```
E:\HumanFlow\
  index.html
  src/
    main.jsx, App.jsx
    graph/   (GraphCanvas.jsx, LayerRow.jsx, NodeCard.jsx, EdgeFlow.jsx)
    engine/  (propagation.js)
    data/    (vitamin-d.json — dataset de ejemplo)
  package.json, vite.config.js
docs/
  superpowers/specs/2026-08-19-visor-flujo-mvp-design.md  (este archivo)
```

## 6. Testing / DoD

- `npm run dev` levanta la app y carga `vitamin-d.json` por defecto.
- Mover el slider actualiza colores y dispara animación de flujo en las 3
  variantes.
- Botón Play reproduce la cascada completa sin interacción.
- Importar un JSON distinto (con nodos/edges nuevos) reemplaza el grafo sin
  recargar la página ni tocar código.
- Clic en nodo abre panel de detalle con su info.

## 7. Limitaciones conocidas (explícitas, no deuda oculta)

- Sin multi-dependencia AND/OR por nodo (un edge = una influencia lineal).
- Sin feedback loops / convergencia iterativa.
- Sin panel admin, auth, backend, ni personalización por paciente.
- Validación de import es mínima (estructural, no biológica).
