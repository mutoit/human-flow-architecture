---
status: isolate
source: idea
date: 2026-09-21
slug: idea-asistente-medico-papers
---

# idea — visor de papers vs asistente médico / pronóstico

## Producto Report

**Petición:** la app llama a un agente IA, busca papers oficiales según lo que busca el usuario, expone esos datos; ¿basta para un pronóstico? ¿sirve como asistente médico?

**Detectado:** visor de evidencia transcrita sobre un JSON curado (vitamina D). Sin API LLM, sin PubMed live, sin catálogo de temas, sin paciente.

## ESPERADO

**Según el usuario:** query → API agente IA → papers oficiales → datos en pantalla, útiles para pronóstico / asistencia clínica.

**Según CORE (`docs/CORE.md`):**

- Principio: *«La app no calcula nada clínico. Transcribe.»*
- Uso: consulta de evidencia capa a capa, **no diagnóstico**.
- Entrada principal: catálogo de temas ya recopilados (no búsqueda live de literatura).
- LLM: hueco futuro de *generación asistida*; PMID/DOI verificados + revisión humana **antes** de entrar al catálogo. *«La IA ayuda a encontrar y resumir, no certifica.»*
- Límites: no consejo clínico (dosis, tratamiento, qué hacer); si no hay estudio, la sección no aparece.

**Corrección 2026-09-21 (usuario):** dosis / riesgo / «qué hacer» **sí se muestran si el paper los afirma**. La app no los inventa ni los calcula; los transcribe con la misma cita. El médico interpreta.

**Discrepancia CORE vs usuario:** CORE L144 dice *«No da consejo clínico (dosis, tratamiento, qué hacer)»*. Eso choca con la corrección: hay que reescribir L144 a *no inventa consejo; si el paper lo dice, lo expone citado*. El CORE **sigue** prohibiendo que la IA certifique.

**Hueco de producto (usuario):** falta **buscar** papers de verdad. La API gratuita que encaja con los PMID ya usados es **NCBI E-utilities** (`https://eutils.ncbi.nlm.nih.gov/entrez/eutils/`): `esearch` (query→PMIDs) + `esummary`/`efetch` (título, abstract). Gratis, 3 req/s sin clave, 10 con clave NCBI. Docs: https://www.ncbi.nlm.nih.gov/books/NBK25497/

E-utilities **encuentra y trae metadatos/abstract**. Extraer dosis/riesgo estructurados del texto sigue siendo lectura humana o LLM *proponiendo* findings, no certificando.

**Discrepancia interna CORE:** §pendiente dice que `docs/DATASET_PROMPT.md` sigue el modelo antiguo (umbrales/ratio). El prompt **ya** está en modelo transcripción (sin cálculo). El CORE está desactualizado en esa frase.

**Web (comportamiento esperado industria):**

- FDA CDS (sección 520(o)(1)(E)): mostrar estudios peer-reviewed a un clínico, con base revisable, **no** es dispositivo; un **risk score / directiva diagnóstica / output para paciente o cuidador** sí puede serlo. Fuente: https://www.fda.gov/medical-devices/digital-health-center-excellence/step-6-software-function-intended-provide-clinical-decision-support
- RAG clínico: cada claim con PMID verificable; retrieval reactivo por query **no es reproducible** para auditoría. Fuente: arXiv 2604.17114 (Provenance Gap).
- Búsqueda IA vs bibliotecario: Elicit ~39.5% sensibilidad vs ~94.5% búsqueda diseñada. Fuente: evidencemd.ai / eval independiente citada ahí.
- Pronóstico / multimorbilidad exige redes de comorbilidad, labs del paciente, tiempo, fármacos — no un grafo de un solo tema. Fuente: Frontiers 2023, PMID 38404463.

## ACTUAL

Path ejecutable (code-intel `mapRelated` query papers/LLM/pubmed):

```
dataset JSON → ImportControl.validateDataset → App setDataset
            → propagate/resolveNodeState (lookup findings[scenarioId])
            → DetailCard / FuentesMenu
            → pubmedUrl = `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
```

| Promesa usuario | Código |
|---|---|
| Llamada API a agente IA | Cero `fetch` / LLM / `/api` en `src/` (`package.json`: solo react+vite) |
| Buscar papers oficiales por query | Catálogo/buscador **no existe** (CORE lo marca pendiente). Un tema embebido: `src/data/vitamin-d.json`. Otro tema = archivo JSON a mano (`ImportControl.handleFile` :184) |
| Exponer datos de papers | Sí, si el JSON ya trae `finding.citation`. Links construidos, **sin** `esummary` NCBI (PMID no se verifica que exista) |
| Pronóstico | `propagate` :62 es lookup literal. Cero aritmética clínica, cero paciente, cero tiempo |
| Asistente médico | CORE lo niega. UI no pide edad/sexo/labs/comorbilidades/medicación |

Dataset vitamina D: 10 nodos, 7 capas, 21 findings, **11 PMIDs únicos** (+1 solo en edges). Tiers: 11 expert-opinion, 8 meta-analysis, 1 RCT, 1 cohort. Un escenario contradictorio. No hay perfil de paciente.

Copia GROK (`GROK/src/lib/flow-data.ts`): capas hardcodeadas, papers como lista estática; aún menos pipeline.

## CAUSA / CÓMO DEBERÍA IR

La app **hace bien** lo que el CORE vende: transcribir un dataset curado y pintar cascada + citas.

**No hace** lo que el usuario imagina: no hay agente, no hay búsqueda live, no hay certificación de papers.

Para que el hueco LLM del CORE exista de verdad (sin romper el principio):

1. Query de tema → LLM propone JSON (DATASET_PROMPT) **marcado sin verificar**.
2. Verificación PMID/DOI contra NCBI **fail-close**.
3. Revisión humana → entra al catálogo.
4. El visor solo lee catálogo verificado.

Eso **sigue sin ser** pronóstico. Faltan (y el CORE dice que no deben inventarse): paciente, labs vivos, comorbilidad, umbrales personalizados, dosis, riesgo, tiempo acumulado, cobertura sistemática de la literatura (11 papers ≠ corpus).

**Asistente médico:** no. Como **visor de evidencia** de un tema curado: sí, con honestidad de cobertura (subset, no revisión sistemática). Como CDS no-dispositivo FDA: solo si se queda en mostrar estudios + base revisable a un clínico, sin score ni directiva, sin usuario paciente.

## VEREDICTO

**PARCIAL** (visor de evidencia curada) · **ROTO** (agente IA + papers live + pronóstico / asistente médico)

Severidad: alta si se vende como asistente clínico; baja si se vende como CORE.

## FUENTES

- CORE: «no calcula / transcribe», «no diagnóstico», «LLM hueco + revisión humana», «no consejo clínico» — `docs/CORE.md` L16–43, L105–117, L135–148, L158–164
- Prompt dataset: `docs/DATASET_PROMPT.md` §6 anti-fabricación
- Código: `src/engine/propagation.js:62` `propagate` · `src/engine/citations.js:78` `pubmedUrl` · `src/data/ImportControl.jsx:180` `ImportControl` · `src/App.jsx:37` dataset default
- Web: FDA Step 6 CDS · Provenance Gap arXiv:2604.17114 · Elicit sensibilidad vs librarian · Frontiers multimorbidity PMID 38404463

## Packet

```
OLA: idea → okplan (buscador E-utilities + transcribir dosis/riesgo si el paper los dice)
FILAS: CORE L144 reescribir · esearch/esummary NCBI · campos finding dosis/riesgo/acción citados · visor lookup NO TOCAR
DoD: query → PMIDs reales; finding de dosis/riesgo solo con citation; sin cálculo
NO TOCAR: propagate/resolveNodeState (lookup)
VERIFY: hoy pubmedUrl concatenado, cero esearch
```

## Plan

Buscador Europe PMC (PMID/PMC/DOI, abstract, OA legal). No Sci-Hub.
No genera el mapa de capas: solo expone papers. CORE L144 reescrito.

## Status

- isolate: done
- plan: executed-search
- verify: pending-surface
