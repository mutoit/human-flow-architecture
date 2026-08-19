# Catálogo de temas + esquema de evidencia en cascada (diseño)

**Fecha:** 2026-08-19
**Estado:** Diseño aprobado en conversación, pendiente de implementación
**Precede a:** este documento sustituye el modelo de cálculo descrito en
`docs/superpowers/specs/2026-08-19-visor-flujo-mvp-design.md` (motor de
ratio/threshold) y en `docs/DATASET_PROMPT.md` (esquema plano de
`references[]`). Ver `docs/CORE.md` — este spec desarrolla lo que ahí
queda marcado como "pendiente de cerrar".

## 0. Por qué existe este documento

En brainstorming se acordó un pivote de fondo: la app deja de **calcular**
un estado clínico (ratio, umbrales, pesos de arista) y pasa a
**transcribir** literalmente lo que dicen los estudios reales, mostrando
desacuerdo entre estudios en vez de resolverlo. Esto obliga a rediseñar
tres piezas relacionadas, cubiertas cada una en su sección: el esquema de
datos (§1), dónde vive la biblioteca de temas (§2), y cómo entran datasets
nuevos al sistema (§3).

## 1. Esquema de datos — citas en cascada

Sustituye por completo, para cada nodo, los campos `thresholdMin`,
`thresholdMax`, `symptomsBySeverity` y `references[]` planos del esquema
anterior.

```json
{
  "id": "hpa_axis",
  "name": "Eje HPA",
  "layer": 3,
  "findings": {
    "restriccion_cronica_6h": [
      {
        "state": "alert",
        "summary": "Elevación sostenida del cortisol matutino en restricción crónica <6h/noche durante 2+ semanas.",
        "claimUsage": "Meta-análisis, resultado primario (no subgrupo).",
        "citation": { "pmid": "12345678", "title": "Autor et al. Título real. Revista. Año." },
        "verified": true,
        "verifiedAt": "2026-08-19"
      },
      {
        "state": "normal",
        "summary": "Un estudio independiente no encontró elevación significativa en la misma ventana de restricción.",
        "claimUsage": "Cohorte de 40 sujetos, resultado secundario.",
        "citation": { "pmid": "87654321", "title": "Autor et al. Título real 2. Revista. Año." },
        "verified": true,
        "verifiedAt": "2026-08-19"
      }
    ]
  }
}
```

Reglas:

- La clave de `findings` es el `id` del escenario tal como lo define el
  propio dataset (§1.1) — no hay catálogo fijo de severidades compartido
  entre temas.
- Un mismo escenario puede tener **más de un finding**. Si dos estudios
  discrepan, ambos se listan — el nodo se activa en pantalla si *al
  menos un* finding existe para ese escenario, sin importar si hay
  contradicción. La ficha de detalle, al abrirse, muestra todos los
  findings de ese nodo/escenario por separado, cada uno con su propia
  cita — nunca se promedian ni se elige un ganador.
- `claimUsage` es obligatorio si hay `citation` — describe qué parte
  exacta del estudio sustenta el `summary` (ej. "Tabla 3, grupo <6h",
  "conclusión del meta-análisis, no hallazgo primario"). No es
  decorativo: es lo que permite a un usuario verificar la afirmación sin
  releer el paper entero.
- `verified` / `verifiedAt` los rellena el **pipeline de verificación de
  citas** (§3.3), nunca la fuente del dataset directamente. Un finding
  con `citation` pero `verified: false` se muestra igualmente en la
  ficha, pero con un aviso visible de "cita no verificada automáticamente
  — revisar manualmente".
- Si un nodo no tiene ningún `finding` para el escenario activo, el nodo
  no se activa. No se interpola ni se infiere desde otro escenario.

### 1.1 Escenarios definidos por tema

`config.severityScenarios[]` se mantiene como lista de escenarios
seleccionables, pero deja de representar puntos en un rango continuo
(`primaryValue` sobre un slider) — pasa a representar los estadios que la
propia literatura del tema distingue (ej. "agudo <24h" / "crónico
moderado <6h" / "crónico severo <4h"), tantos como el dataset necesite,
sin obligación de encajar en una escala fija compartida entre temas.

### 1.2 Edges

Un `edge` sigue representando una cadena mecánica documentada (ej. "reduce
leptina, lo que reduce saciedad"), pero:

- `strength` dejar de alimentar ningún cálculo — se muestra en UI como
  etiqueta cualitativa (`"fuerte"` 0.8–1, `"moderada"` 0.4–0.7, `"débil"`
  0.1–0.3), con nota explícita de que es una estimación de consistencia
  de evidencia, no un efecto cuantitativo.
- Cada `edge` gana un campo `citation` propio (mismo shape que en
  findings) — la afirmación de causalidad entre dos nodos es en sí misma
  una cita que debe poder verificarse, igual que el estado de un nodo.

## 2. Catálogo de temas

La app es una web (Vercel). El buscador de temas ya recopilados necesita
una base de datos real, no solo archivos sueltos.

### 2.1 Almacenamiento

Postgres gestionado en Vercel (integración Neon), tabla `topics`:

```
topics
  id             uuid, pk
  slug           text, unique   -- "vitamina-d", "privacion-sueno"
  name           text
  aliases        text[]         -- términos de búsqueda alternativos
  tags           text[]
  status         text           -- 'available' | 'pending_review' | 'not_found'
  dataset        jsonb          -- el JSON completo, esquema §1
  created_at     timestamptz
  updated_at     timestamptz
  verified_at    timestamptz    -- último paso de verificación de citas ejecutado
```

Se guarda el dataset completo como `jsonb` en vez de modelarlo en tablas
relacionales — el sistema sigue siendo fundamentalmente "JSON-driven",
solo que ahora la fuente vive en una base de datos consultable en lugar
de en un archivo suelto. Búsqueda por `name`/`aliases`/`tags` (ILIKE o
full-text search de Postgres, suficiente para el volumen esperado).

### 2.2 Flujo de búsqueda

- El usuario busca un tema en el catálogo (punto de entrada principal de
  la app, sustituye a "Importar JSON" como vía primaria — importar sigue
  existiendo como vía secundaria).
- Si hay coincidencia con `status: 'available'` → se carga directo.
- Si no hay ninguna coincidencia → estado vacío explícito ("Este tema aún
  no está en la base") con el CTA de generación (§3).
- Los temas con `status: 'pending_review'` **no aparecen** en resultados
  de búsqueda pública — solo son visibles en un futuro panel de revisión
  (fuera de alcance de este spec, ver §5).

## 3. Generación de datasets nuevos

Se descarta la idea de un endpoint server-side que llame a un LLM en
caliente. Se reutiliza el flujo manual que ya funciona hoy, sin coste de
infraestructura ni gestión de API keys.

### 3.1 Flujo

1. En el estado vacío de búsqueda (§2.2), el CTA es **"Descargar prompt
   para [tema buscado]"** — genera un `.md` a partir de una plantilla
   base (sucesora de `docs/DATASET_PROMPT.md`, actualizada al esquema en
   cascada de §1) con el nombre del tema ya insertado.
2. El usuario lleva ese prompt a la IA que prefiera, recibe el JSON.
3. Lo sube por la **misma vía de import que ya existe** — un único
   pipeline de entrada, sin importar si el JSON lo escribió una IA o una
   persona a mano.

### 3.2 Qué hace el import al recibir un dataset nuevo

1. Validación estructural contra el esquema §1 (misma dureza que las
   reglas actuales: layers no vacío, ids únicos, referencias de
   layer/edge existentes...). Si falla, se rechaza entero con error
   concreto — nada se guarda.
2. Si la validación estructural pasa, el dataset entra a `topics` con
   `status: 'pending_review'` — nunca directo a `'available'`.
3. Se dispara la verificación de citas (§3.3).

### 3.3 Verificación de citas

Para cada `citation` (en findings y en edges): se consulta la API de
PubMed/Europe PMC (por PMID) o Crossref (por DOI/URL) para confirmar que
la fuente existe y el título coincide razonablemente.

Manejo de error en capas — nunca todo-o-nada:

- Cita no verificable (PMID no existe / no coincide) → **ese finding
  concreto** se marca `verified: false`, se conserva visible con aviso,
  no se descarta el nodo ni el tema completo.
- Ningún finding del tema verifica → el tema queda igualmente en
  `pending_review` con un contador visible de "0/N citas verificadas",
  para que la revisión humana sepa que probablemente hay que rehacerlo.
- Un dataset con `status: 'pending_review'` solo pasa a `'available'`
  mediante una acción explícita de revisión humana (hoy: el propio
  usuario). No hay promoción automática por número de citas verificadas.

## 4. Qué se descarta (explícito, para que no se reintroduzca sin querer)

- El endpoint server-side de generación (`/api/topics/generate` con LLM
  en caliente) — descartado en esta iteración. Si se retoma en el
  futuro, se construye encima del mismo pipeline de validación de §3.2,
  sin cambiarlo.
- Cualquier fusión automática de datasets por coincidencia de `id` de
  nodo entre temas — no está en este spec, requiere un catálogo de
  entidades canónico que no existe todavía (ver limitaciones).
- El motor de cálculo por ratio/threshold y el promedio ponderado de
  `strength` — descartados, ver `docs/CORE.md`.

## 5. Fuera de alcance de este spec (no es deuda oculta, es explícito)

- Panel de revisión humana para promover `pending_review` → `available`
  (hoy: edición directa en la base de datos por el propio usuario).
- Autenticación / roles de revisor.
- Fusión de temas superpuestos.
- Cualquier automatización server-side de la generación (§3 queda
  manual a propósito).

## 6. Límites honestos

- La verificación de citas confirma que la fuente **existe**, no que
  respalda exactamente lo que dice `summary` — eso sigue exigiendo
  revisión humana, tal como está diseñado en §3.3 (nunca se promueve
  sin ese paso).
- El nivel de detalle de los nodos sigue limitado por lo que la
  literatura realmente diferencia — este spec no cambia esa limitación,
  solo la forma en que se citan los hallazgos.
