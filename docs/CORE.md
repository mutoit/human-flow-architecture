# Human Flow architecture — qué es esto

> **Nota para cualquier agente/IA que trabaje en este repo:** este documento
> es la fuente de verdad del producto. Si el código no coincide con lo que
> aquí se describe, el código está desactualizado, no este documento. Antes
> de cambiar el motor o el esquema de datos, lee esto entero.

## En una frase

Un visor que muestra, capa por capa del cuerpo, **qué dice literalmente
la evidencia científica real** sobre cómo una variable biológica (una
hormona, vitamina, hábito, carencia...) afecta al organismo — sin
calcular, sin inventar cifras intermedias, mostrando incluso cuándo los
propios estudios se contradicen entre sí.

## Principio central (no negociable)

**La app no calcula nada clínico. Transcribe.**

No hay fórmulas propias, no hay ratios inventados, no hay pesos
numéricos que combinen variables para producir un resultado que ningún
paper firmó. Cada afirmación que se muestra en pantalla — "en privación
crónica de sueño, el eje HPA está en alerta" — es una frase que un
estudio real dice, con su cita al lado. Si no hay un estudio que lo
diga, esa sección no aparece. Punto.

Esto es la razón de ser de la primera versión del motor (que calculaba
un ratio a partir de un slider continuo y umbrales) quedó descartada:
un ratio interpolado entre dos valores clínicos es una cifra que nadie
midió, por muy bien que sonara la fórmula. Ver "Qué se descarta" más
abajo.

## Para qué sirve

Un médico, un estudiante o cualquier persona busca un tema (una
patología, una hormona, un hábito como la falta de sueño) y la app le
enseña, capa por capa del cuerpo, **qué ha demostrado la ciencia real**
sobre ese tema — qué órganos, tejidos o sistemas se ven afectados, con
qué grado de consenso, y con las citas exactas de cada afirmación.

No es una herramienta de diagnóstico. Es una herramienta de consulta de
evidencia: para ver de un vistazo qué dice la literatura sobre un
mecanismo, con la trazabilidad completa hasta la fuente.

## Qué muestra en pantalla

- **Buscador/catálogo de temas** (punto de entrada principal): el
  usuario busca o navega por los temas ya recopilados en la base de
  datos de la app (ej. "vitamina D", "cortisol", "privación de sueño")
  y los carga desde ahí — no depende de tener un archivo `.json` a
  mano. Importar un `.json` suelto sigue existiendo como vía adicional
  (para temas nuevos aún no incorporados al catálogo), pero la vía
  principal de uso es la biblioteca ya construida.
- **Escenarios seleccionables**, definidos por lo que la propia
  literatura del tema distingue como estadios/niveles (ej. "privación
  aguda <24h" / "restricción crónica <6h/noche" / "privación total") —
  no son categorías fijas iguales para todos los temas ni un valor
  interpolado en un slider continuo; cada dataset define los suyos
  según cómo los agrupan los estudios que lo respaldan.
- **Lista de capas** (izquierda): las regiones del cuerpo que el tema
  puede tocar. Una capa se activa si al menos un estudio documenta un
  efecto ahí para el escenario elegido.
- **Panel de capas**, con vista de lista y vista de grafo — cada
  componente concreto se activa según lo que digan los estudios para
  ese escenario, no según un cálculo.
- **Ficha de detalle** de cada componente, con:
  - qué dice la evidencia sobre ese componente en ese escenario,
  - **si hay contradicción entre estudios, se muestran todos los
    hallazgos en paralelo** — el nodo se activa igual (hay evidencia de
    que algo pasa ahí), pero al abrir la ficha el usuario ve cada
    hallazgo por separado con su propia cita, sin que la app finja un
    consenso que no existe,
  - **cómo llegó el efecto hasta ahí**, cuando el propio estudio
    describe una cadena mecánica concreta (ej. "reduce leptina, lo que
    reduce saciedad") — con el verbo real de cada salto, no una flecha
    muda,
  - **a qué otros componentes afecta él a su vez**, con la misma lógica.
- **Lecturas / Procedencia:** dentro de cada ficha, una pestaña con:
  - los estudios reales que respaldan cada afirmación concreta (no una
    lista genérica al final del nodo — la cita cuelga de la frase que
    respalda),
  - **cómo se ha usado esa fuente** — qué parte exacta del estudio
    sustenta la afirmación mostrada (ej. "tabla 3, grupo de restricción
    <6h", o "conclusión del meta-análisis, no hallazgo primario") — para
    que el usuario pueda verificarlo él mismo sin tener que releer el
    paper entero,
  - **exportable**: el usuario puede exportar esa procedencia (citas +
    cómo se han usado) para su propio uso o verificación externa.

## Cómo funciona por dentro (sin tecnicismos)

1. Cada tema es una **base de conocimiento**: componentes del cuerpo,
   agrupados en capas, con lo que la evidencia dice de cada uno para
   cada escenario clínico reconocido en la literatura de ese tema.
2. El usuario elige un tema (del catálogo o por import) y un escenario.
3. La app **busca en los datos ya recopilados** qué componentes tienen
   información para ese escenario y los pinta activos — no interpola,
   no promedia, no calcula un estado intermedio.
4. Si dos estudios se contradicen sobre el mismo componente, ambos se
   guardan y se muestran — la app no decide cuál "gana".
5. Nada de esto está escrito a mano por pantalla — todo sale de una
   base de datos de temas, cada uno con su propio archivo de origen.

## De dónde sale la base de datos

Hoy, la recopilación es manual: una persona busca los papers reales de
un tema y rellena el dataset siguiendo el esquema documentado (ver
`docs/DATASET_PROMPT.md` — pendiente de actualizar al nuevo modelo sin
cálculo, ver "Qué queda pendiente" abajo).

**La arquitectura debe dejar sitio, desde ya, para automatizar esta
recopilación con una API de LLM** que busque y proponga estudios reales
para un tema — pero como paso de *generación asistida*, nunca como
fuente de verdad directa: todo lo que proponga una IA pasa por
verificación (¿existe de verdad el PMID/DOI?) y por revisión humana
antes de entrar al catálogo. La IA ayuda a encontrar y resumir, no
certifica.

## Lo que se descarta de la versión anterior

- **El motor de propagación por ratio/umbral** (`ratio × thresholdMax`
  comparado contra `thresholdMin/thresholdMax`, con un slider continuo)
  queda descartado como mecanismo de cálculo del estado de un nodo. Un
  valor interpolado entre dos puntos clínicos no es un dato real.
- **El promedio ponderado de `strength` en nodos con varias entradas**
  queda descartado por el mismo motivo: era un número inventado
  combinando otros números inventados.
- **La detección de ciclos con cálculo iterativo** (para bucles de
  retroalimentación hormonal) deja de ser necesaria — al no calcular
  nada, no hay nada que pueda no converger.
- El **slider continuo de una sola variable primaria** deja de ser la
  única vía de entrada — se sustituye por escenarios discretos que la
  propia literatura del tema define.

## Lo que no hace (límites honestos)

- No inventa citas ni cifras clínicas — si no hay fuente real para una
  afirmación, esa afirmación no aparece.
- No calcula ni infiere estados intermedios entre lo que dicen los
  estudios — si la evidencia no cubre un escenario o un componente, se
  queda sin datos y lo dice explícitamente, no rellena el hueco.
- No decide "quién tiene razón" cuando los estudios se contradicen —
  muestra el desacuerdo tal cual.
- No da consejo clínico (dosis, tratamiento, "qué hacer") — solo
  transcribe mecanismo y evidencia.
- El nivel de detalle (ej. diferenciar un músculo concreto de otro) está
  limitado por lo que la literatura realmente diferencia — la app no
  inventa granularidad que la ciencia no ofrece.

## Qué queda pendiente de cerrar (para que ningún agente lo dé por hecho)

- El esquema exacto del nuevo dataset (cómo se modelan escenarios
  definidos por tema, citas por afirmación en vez de por nodo, y
  hallazgos contradictorios en paralelo) todavía no está escrito —
  `docs/DATASET_PROMPT.md` sigue describiendo el modelo antiguo
  (umbrales, ratio, `strength` numérico) y hay que reescribirlo antes de
  generar datasets nuevos con este documento.
- El diseño del catálogo/buscador de temas (UX de "cargar" desde
  biblioteca) no está especificado todavía — solo acordado el objetivo.
- El formato de exportación de "procedencia + cómo se ha usado" no está
  definido.
- La forma concreta de la futura integración con una API de LLM
  (qué hace, qué no hace, cómo se marca "sin verificar" hasta revisión
  humana) no está diseñada, solo reservado el hueco arquitectónico.
