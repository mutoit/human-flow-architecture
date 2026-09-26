# Desplegar y probar en Cloudflare

Un solo Worker sirve la web (`dist/`) y la API (`/api/*`). La clave de la IA
vive como secreto del Worker; el registro de cada llamada y de cada dossier
se guarda en Cloudflare D1 (decisión D-registro).

## 1. Preparar (una vez)

```bash
git fetch origin
git checkout claude/schema-capas-papers-i3rdmj
git pull origin claude/schema-capas-papers-i3rdmj
npm install
cd worker && npm install
npx wrangler login                       # abre el navegador
npx wrangler d1 create humanflow-logs    # copia el database_id que imprime
```

Pega ese `database_id` en `worker/wrangler.toml` (sustituye `PEGAR_AQUI_EL_ID`), y después, desde `worker/`:

```bash
npx wrangler d1 migrations apply humanflow-logs --remote
npx wrangler secret put ANTHROPIC_API_KEY   # tu clave de https://console.anthropic.com
npx wrangler secret put LOG_TOKEN           # una contraseña larga inventada: protege el registro
```

## 2. Desplegar

Desde la raíz del repo:

```bash
npm run deploy
```

Imprime la URL (`https://humanflow.<tu-subdominio>.workers.dev`). Ábrela y busca un tema.

## 3. Ver el registro

```bash
# últimas llamadas a la IA
curl -H "Authorization: Bearer <LOG_TOKEN>" "https://<url>/api/logs?limit=20"
# llamadas de una búsqueda concreta (el id sale en el informe de Fuentes)
curl -H "Authorization: Bearer <LOG_TOKEN>" "https://<url>/api/logs?run=<runId>"
# dossiers completos guardados
curl -H "Authorization: Bearer <LOG_TOKEN>" "https://<url>/api/dossiers?limit=5"
# en directo mientras usas la web (desde worker/)
npx wrangler tail
```

## 4. Medir el método (hace falta el paso 2)

```bash
npm test                     # control y segmentación
npm run bench:offline        # vetos sobre 6.292 fragmentos anotados por médicos (sin IA)
BENCH_URL=https://<url>/api/extract npm run bench:api -- 150
```

`bench:api` mide con la IA real: acierto de la 1.ª lectura, de la 2.ª y de la
regla «solo se muestra si coinciden». Guarda el resultado en `bench/results/`
(súbelo al repo: es la evidencia del método).

## Desarrollo local (opcional)

```bash
npm run build
cd worker
printf 'ANTHROPIC_API_KEY=...\nLOG_TOKEN=...\n' > .dev.vars   # no se sube al repo
npx wrangler d1 migrations apply humanflow-logs --local
npx wrangler dev             # http://localhost:8787
```

## Mensaje para tu Claude local

> Estoy en el repo human-flow-architecture, rama `claude/schema-capas-papers-i3rdmj`.
> Lee `docs/CORE.md` y `docs/DEPLOY.md`. Guíame paso a paso por la sección 1 y 2 de
> DEPLOY.md (yo haré `wrangler login` y pegaré la clave cuando me lo pidas; no me
> pidas que te la escriba en el chat). Cuando esté desplegado: haz una búsqueda de
> prueba con curl a `/api/extract` op `normalize`, revisa `/api/logs`, ejecuta
> `npm test`, `npm run bench:offline` y `npm run bench:api -- 150`, sube
> `bench/results/` y resume los números. No cambies el método sin registrar la
> decisión en `src/method/decisions.json`.
