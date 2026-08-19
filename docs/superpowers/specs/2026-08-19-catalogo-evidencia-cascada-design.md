# Catálogo de temas + esquema de evidencia en cascada (diseño)

**Fecha:** 2026-08-19 (revisión: agujeros de estado contradictorio, claimUsage,
obsolescencia, versionado y revisión tapados tras crítica de segunda pasada)
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
- `claimUsage` describe qué parte exacta del estudio sustenta el
  `summary` (ej. "Tabla 3, grupo <6h", "conclusión del meta-análisis, no
  hallazgo primario"). **Es opcional en el momento del import** — quien
  genera el dataset (IA o persona) normalmente solo tiene PMID/título,
  no el paper completo, y no puede rellenarlo con honestidad. Pasa a ser
  **obligatorio para que un finding cuente en el checklist de promoción
  a `available`** (§3.4/§6.1) — lo completa el revisor humano tras leer
  la fuente real, no la fuente del dataset.
- `verified` / `verifiedAt` los rellena el **pipeline de verificación de
  citas** (§3.3), nunca la fuente del dataset directamente. Un finding
  con `citation` pero `verified: false` se muestra igualmente en la
  ficha, pero con un aviso visible de "cita no verificada automáticamente
  — revisar manualmente".
- Si un nodo no tiene ningún `finding` para el escenario activo, el nodo
  no se activa. No se interpola ni se infiere desde otro escenario.

### 1.0 Estado del nodo cuando los findings discrepan

Si los `findings` de un nodo/escenario no coinciden todos en el mismo
`state`, el nodo **no** se resuelve a favor de ninguno — ni por mayoría
de estudios (contar votos no mide fuerza de evidencia) ni por ningún
otro cálculo. Se pinta con un cuarto estado propio, `"contradictorio"`
(visualmente distinto de normal/alert/critical), derivado de una regla
puramente estructural: *¿hay más de un `state` distinto entre los
findings de este nodo/escenario? sí/no* — no es un juicio clínico, es un
hecho sobre los datos. La ficha de detalle sigue mostrando todos los
findings en paralelo.

Cada `citation` gana un campo opcional `evidenceTier` (`"meta-analysis"
| "rct" | "cohort" | "case-report" | "expert-opinion"`), usado **solo
para ordenar la presentación** en la ficha (meta-análisis primero) —
nunca para calcular o desempatar el estado del nodo.

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

### 1.3 Obsolescencia de una cita

Toda `citation` (en findings o en edges) gana un campo opcional
`supersededBy` (apunta al `pmid`/`doi` de otra citación en el mismo
dataset). Lo rellena un curador humano cuando sabe que un estudio más
reciente reemplaza a uno antiguo — la UI muestra la cita superada
tachada/con aviso ("reemplazada por estudio más reciente"), sin
eliminarla del histórico. **No incluye re-verificación periódica
automática contra literatura nueva** — eso es un sistema de vigilancia
continua (cron + búsqueda + criterio de qué cuenta como reemplazo) que
queda fuera de alcance de este spec, no como deuda oculta sino como
ampliación futura explícita a diseñar aparte si se necesita.

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

`topics.dataset` siempre refleja la última versión. El historial vive
aparte, en `topic_versions`:

```
topic_versions
  id             uuid, pk
  topic_id       uuid, fk -> topics.id
  version        int              -- incremental por topic
  dataset        jsonb            -- snapshot completo en ese momento
  changelog      text             -- qué cambió y por qué, texto libre
  created_at     timestamptz
```

Sin esto no se puede auditar qué cambió entre una versión publicada y la
siguiente, ni revertir un dataset a un estado anterior si una
actualización introduce un error — imprescindible en algo que se
presenta como base de evidencia.

### 2.3 Revisión antes de `available`

`status: 'pending_review'` nunca lo promueve quien subió el dataset por
el mero hecho de subirlo — eso sería auto-publicación. Se añade
`topic_reviews`:

```
topic_reviews
  id             uuid, pk
  topic_id       uuid, fk -> topics.id
  reviewer       text             -- quién revisó
  checklist      jsonb            -- respuestas al checklist, ver abajo
  approved_at    timestamptz
```

Checklist mínimo obligatorio por revisión (todo debe ser `true` para
poder promover):

- Cada `finding` incluido tiene `claimUsage` relleno tras leer la fuente
  real (no solo el título/abstract).
- Los `findings` con `verified: false` fueron revisados uno a uno:
  descartados, o mantenidos con el aviso visible intacto.
- No hay ningún dato numérico o cita con apariencia de verificado que en
  realidad no lo esté.

Hoy el proyecto es de una sola persona, así que **1 fila en
`topic_reviews` con checklist completo promueve el topic a
`available`**. La tabla está diseñada para que exigir varias
aprobaciones independientes en el futuro (si el proyecto crece a
equipo) sea subir un umbral de conteo, no rediseñar el esquema.

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
  cuando existe al menos 1 fila en `topic_reviews` (§2.3) con el
  checklist completo — nunca por número de citas verificadas, ni por
  quien lo subió marcándolo él mismo sin pasar el checklist.

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
- Resolver `findings` contradictorios por mayoría de estudios o por
  cualquier fórmula propia — descartado por el mismo motivo que el
  motor de ratio: contar votos no es evidencia. Ver §1.0.
- Re-verificación periódica automática de citas contra literatura nueva
  — el campo `supersededBy` (§1.3) es manual; la vigilancia continua
  queda fuera de este spec.

## 5. Fuera de alcance de este spec (no es deuda oculta, es explícito)

- Panel de UI para rellenar el checklist de `topic_reviews` (hoy: fila
  insertada directamente en la base de datos por el propio usuario).
- Autenticación / roles de revisor, y exigir más de 1 aprobación — el
  esquema de `topic_reviews` ya lo admite sin rediseño, solo no se activa
  todavía (ver §2.3).
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
- El checklist de `topic_reviews` (§2.3) reduce el riesgo de
  auto-publicación sin criterio, pero con un solo revisor (el propio
  proyecto hoy) no es revisión por pares independiente real — es una
  mejora honesta sobre "sin ningún control", no una garantía equivalente
  a peer review.
