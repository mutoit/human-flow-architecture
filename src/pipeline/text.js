// Normalización mínima de texto para comparar frases y dianas de forma
// literal (sin sinónimos ni stemming: lo que no coincide, no pasa).

export function norm(s) {
  return String(s ?? '')
    .toLowerCase()
    .normalize('NFKC')
    .replace(/[‘’‛′]/g, "'")
    .replace(/[“”″]/g, '"')
    .replace(/[‐-―−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

/** Clave de diana para unir filas de papers distintos (decisión D-cadena). */
export const targetKey = (s) => norm(s).replace(/[^\p{L}\p{N}]+/gu, ' ').trim()

/** Palabras con contenido (≥3 caracteres) de una diana. */
export const contentWords = (s) => targetKey(s).split(' ').filter((w) => w.length >= 3)

/** Números que aparecen en un texto (coma o punto decimal). */
export function numbersIn(s) {
  return [...String(s).matchAll(/-?\d+(?:[.,]\d+)?/g)].map((m) => Number(m[0].replace(',', '.')))
}

/** Decimales de un número tal como se escribió (para no inventar precisión). */
export const decimalsOf = (n) => (String(n).split('.')[1] ?? '').length
