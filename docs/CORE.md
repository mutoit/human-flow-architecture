# Human Flow architecture — qué es y cómo funciona

> Fuente de verdad del producto. Si el código no coincide con esto, el
> código está mal. Las decisiones de método viven en
> `src/method/decisions.json` (se exportan con cada búsqueda); este
> documento no las repite, las referencia por su id (`D-…`).

## Objetivo

Buscar cualquier tema (enfermedad, hormona, vitamina, síntoma…) y ver **por
qué capas del cuerpo pasa, en qué sentido y por qué recorrido**, con cada
dato respaldado por una frase literal de un paper real. La app no calcula
nada clínico ni recomienda nada (D-principio).

## Qué no hay

- Ningún dato escrito a mano: todo sale de la búsqueda (el dossier).
- Ninguna cifra sin frase, ninguna frase sin paper, ningún paper sin PMID.
- Ningún salto de recorrido que no afirme una frase.
- Ninguna puntuación de gravedad: tamaños y colores indican cantidad de
  literatura o de papers, nunca intensidad clínica.

## Capas

13, definidas en `src/method/layers.json` (D-capas): sangre, inmune y
linfático, cardiovascular, respiratorio, digestivo, urinario, reproductor,
endocrino, nervioso, sentidos, piel, hueso y articulaciones, músculo. Cada
capa tiene sus descriptores MeSH (para contar literatura) y su léxico (para
confirmar a qué capa pertenece una diana).

## Recorrido de una búsqueda (`src/pipeline/run.js`)

| Etapa | Qué hace | IA | Decisiones |
|---|---|---|---|
| 0. Consulta | Pasa el tema a términos de PubMed en inglés y clasifica su tipo | sí (si hay extractor) | D-idioma |
| 1. Mapa | Cuenta en PubMed los papers del tema en cada capa; % y observado/esperado | no | D-mapa, D-volumen |
| 2. Selección | Por capa: 2 revisiones + 1 primario, en el orden de PubMed | no | D-seleccion |
| 3. Lectura | Título, abstract, tipo de publicación y MeSH; diseño y especie salen de ahí | no | D-texto, D-metadatos |
| 4. Extracción | La IA **señala** (ids de frase y número, fragmentos de la frase); el código construye cada dato y veta; una 2.ª lectura ciega confirma la dirección | señala, no escribe | D-extractor, D-esquema, D-rol, D-control, D-lectura-doble |
| 5. PDF abierto | Enlace legal vía OpenAlex | no | D-fuente |

Antes de la IA, el código numera el texto (`src/pipeline/segment.js`):
frases `s#` con su sección NLM y números `n#` con valor, unidad y tipo.

Tipos de fila (`src/method/schema.json`), todas señaladas, ninguna escrita:

- **Efecto**: exposición → resultado frente a comparador; dirección, tipo
  (causal / asociación) y rol.
- **Cifra**: un número `n#` de la frase, su resultado y su grupo; hueco cerrado
  según el tipo de tema.
- **Eslabón**: A → B afirmado en una misma frase.

Estado de cada fila: **aceptada** (se muestra), **en revisión** (las dos
lecturas no coinciden; se lista aparte) o **rechazada** (motivo exportado).

## Qué se muestra

- **Capas** con estado (D-estado-capa): Efecto citado · Solo literatura ·
  Sin literatura · No consultada. «Solo literatura» no es «sin efecto».
- **Ficha de capa**: conteos de PubMed y la consulta exacta; dianas con su
  conteo de dirección (D-direccion) y cifras como mediana + rango + n
  (D-cifra); papers leídos para esa capa.
- **Ficha de diana**: cada frase que la respalda con su paper (diseño,
  especie, año) y los recorridos que pasan por ella.
- **Recorrido**: cadenas tema → diana → diana, cada salto con su frase;
  «ensamblada» si mezcla papers (D-cadena).
- **Grafo**: lo mismo en red; color = capa, tamaño = papers que la respaldan.
- **Fuentes**: informe (lo mostrado, las frases usadas, las filas
  rechazadas y el registro completo de decisiones) y el dossier JSON, que
  se puede reabrir; al reabrirlo se vuelve a pasar el control (D-reproducible).

## Piezas del código

| Carpeta | Contenido |
|---|---|
| `src/method/` | capas, esquema y decisiones (datos versionados) |
| `src/engine/` | PubMed / OpenAlex, forma del paper, nombres de estados |
| `src/pipeline/` | recorrido, control mecánico, agregación, cadenas, grafo, dossier |
| `src/export/` | informe, dossier e importación |
| `src/detail/`, `src/layers/`, `src/search/` | interfaz |
| `worker/` | servicio extractor (la clave de la IA vive aquí) |
| `test/` | pruebas del núcleo (`npm test`) |
| `bench/` | medición del método con datos anotados por médicos (`npm run bench:offline`, `bench:api`) |

## Puesta en marcha

`docs/DEPLOY.md`: web + API en un Worker de Cloudflare, registro en D1.
Solo la web (`npm run dev`) funciona hasta la etapa 1 (mapa).

## Pendiente (no se da por hecho)

- Verificar contra MeSH Browser los descriptores de cada capa en una
  ejecución real (la app ya registra los términos que PubMed no reconoce).
- Normalizar dianas a MeSH/HPO para que los sinónimos unan cadenas (D-cadena).
- Contraste automático con HPO y CTD (D-validacion).
- Texto completo abierto de PMC (D-texto).
- Medir con la IA real la regla de doble lectura (`npm run bench:api`).
- El control no comprueba que el hueco de una cifra sea el correcto (p. ej.
  una concentración marcada como prevalencia) ni que la IA haya señalado el
  resultado correcto dentro de una frase correcta; la frase se muestra
  siempre con lo señalado resaltado.
