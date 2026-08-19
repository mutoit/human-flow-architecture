# Human Flow architecture — qué es esto

## En una frase

Un visor que muestra **qué le pasa al cuerpo cuando una variable
biológica (una hormona, vitamina, electrolito...) sube o baja**, capa
por capa, con las fuentes científicas de cada afirmación.

## Para qué sirve

Eliges un escenario ("Normal", "Moderada", "Severa"...) y la app te
enseña, de forma visual, **por dónde se propaga el efecto**: qué
órganos se ven afectados, si llega al hueso, al sistema inmune, a la
piel, al sistema nervioso, a los sentidos — y hasta dónde llega según
lo grave que sea la carencia/exceso.

No es una herramienta de diagnóstico. Es educativa: para entender el
mecanismo, no para sustituir a un médico.

## Qué muestra en pantalla

- **Vitales de cabecera:** 2-3 valores clave (ej. el nivel en sangre,
  una hormona reguladora) con color según estén normales o alterados.
- **Lista de capas** (izquierda): las 7 zonas del cuerpo que puede
  tocar el efecto — Sangre, Órganos, Hueso, Linfático, Piel, Nervioso,
  Sentidos. Se iluminan o se apagan según si esa capa está afectada.
- **Panel de capas, con dos vistas intercambiables:**
  - **Capas:** cada capa se despliega y muestra sus componentes
    concretos (ej. dentro de "Órganos": hígado, riñón), con filtro por
    capa y leyenda de colores.
  - **Grafo:** el mismo mapa dibujado como red de nodos conectados —
    zoom, pan, autofit, filtro por capa — la posición de cada nodo se
    calcula sola a partir del dataset cargado, nunca está fijada a
    mano (por eso funciona igual con cualquier tema, no solo vitamina D).
- **Dos fichas de detalle, lado a lado:** una muestra lo que seleccionas
  en la lista de capas, la otra lo que seleccionas en el panel de capas
  (Capas o Grafo) — cada una explica:
  - qué es ese componente y por qué se ve afectado,
  - **cómo llegó el efecto hasta ahí** desde el origen, con el verbo
    real de cada salto ("aumenta", "reduce", "activa", "inhibe") y su
    fuerza — no solo una flecha muda entre nombres,
  - **a qué otros componentes afecta él a su vez** ("Afecta a": sus
    conexiones de salida reales, con relación y fuerza).
- **Lecturas:** dentro de cada ficha, una pestaña con los estudios
  científicos reales que respaldan lo que se muestra — nunca se inventa
  una cita.

## Cómo funciona por dentro (sin tecnicismos)

1. Cada tema (una hormona, una vitamina...) es un **mapa** de
   componentes del cuerpo conectados entre sí — como un árbol de causa
   y efecto.
2. Eliges un escenario, y ese mapa se "recorre" desde el origen (el
   valor que sube o baja) hacia todo lo que depende de él.
3. Cada componente se colorea según si el efecto lo alcanza de lleno,
   lo roza, o no le llega.
4. Nada de esto está escrito a mano por pantalla — todo sale de **un
   archivo de datos** que describes qué componentes hay, cómo se
   conectan, y qué fuentes lo respaldan.

## Importar un tema nuevo

El botón **"Importar JSON"** carga un archivo con la descripción
completa de un tema — no hace falta tocar código para añadir uno nuevo.

- **Qué pide:** un archivo `.json` con 4 partes: la configuración
  general (nombre, escenarios, unidad de medida), las 7 capas del
  cuerpo, los componentes concretos (con su descripción, umbrales y
  citas reales), y las conexiones entre ellos.
- **De dónde sale ese archivo:** no lo escribes a mano — hay un
  documento (`docs/DATASET_PROMPT.md`) que le pasas a cualquier IA junto
  con el tema que quieras ("genera el dataset para el cortisol"), y te
  devuelve el `.json` listo para importar.
- **Qué pasa si algo está mal:** la app avisa con un error concreto
  (id repetido, capa que no existe...) sin borrar lo que ya tenías
  cargado.

## Lo que no hace (límites honestos)

- No inventa citas ni cifras clínicas — si no hay fuente real, esa
  sección simplemente no aparece.
- No da consejo clínico (dosis, tratamiento, "qué hacer") — solo
  explica el mecanismo. Eso es a propósito: no hay forma de darlo sin
  inventar cifras que nadie certificó.
- Sí modela ciclos de retroalimentación (una hormona que regula a la
  que la regula a ella) — el motor los detecta solo y cambia a un
  cálculo iterativo. Pero un bucle real puede no estabilizarse nunca
  (oscila) — en ese caso la app avisa con "⚠ No converge" en vez de
  fingir un resultado limpio.
- Solo un valor de escenario a la vez alimenta el mapa — si un tema
  tiene varias variables de entrada independientes (ej. dieta + sol +
  suplemento), el motor las soporta pero la interfaz hoy solo mueve
  una.
- Funciona mejor con temas que tienen un valor medible en sangre que
  se propaga; temas puramente estructurales (una lesión, por ejemplo)
  encajan peor.
