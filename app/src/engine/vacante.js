// Lector de ofertas: qué competencias, tecnologías y requisitos pide una oferta, qué historias las
// cubren y qué preguntas son más probables. Reglas locales y explicables, sin IA ni red.
import { VAC_COMPETENCIAS, VAC_TECNOLOGIAS, VAC_MODALIDAD, VAC_IDIOMAS } from '../content/vacante.js';

/** Expresión regular de un término del léxico, sin tildes; «raíz*» admite cualquier final. */
export function vacTermRe(term) {
  const stem = term.endsWith('*');
  const base = foldSameLength(stem ? term.slice(0, -1) : term).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`(^|[^\\p{L}\\p{N}])${base}${stem ? '[\\p{L}\\p{N}-]*' : ''}(?=$|[^\\p{L}\\p{N}#+])`, 'gu');
}
const RE_CACHE = new Map();
function cachedRe(term) {
  let re = RE_CACHE.get(term);
  if (!re) { re = vacTermRe(term); RE_CACHE.set(term, re); }
  re.lastIndex = 0;
  return re;
}
/** Apariciones de un término en un texto ya pasado por foldSameLength(). Devuelve el texto encontrado. */
export function vacFind(folded, term) {
  return vacSpans(folded, term).map(sp => folded.slice(sp.start, sp.end));
}
/** Posiciones [start, end) de cada aparición de un término. */
export function vacSpans(folded, term) {
  const out = [];
  for (const m of folded.matchAll(cachedRe(term))) {
    const start = m.index + m[1].length;
    out.push({ start, end: m.index + m[0].length });
  }
  return out;
}

/**
 * Minúsculas y sin tildes, conservando la longitud del texto: así una posición encontrada en el
 * texto plegado sirve para recortar el original y mostrar el término tal como lo escribe la oferta.
 */
export function foldSameLength(text) {
  let out = '';
  for (const ch of String(text || '').normalize('NFC')) {
    if (ch.length > 1) { out += ch; continue; }
    const base = ch.normalize('NFD')[0].toLowerCase();
    out += base.length === 1 ? base : ch;
  }
  return out.replace(/\u2019/g, "'");
}

function anosExperiencia(folded) {
  const pats = [
    /(\d{1,2})\s*\+?\s*(?:o mas\s+)?anos?\s+(?:de\s+)?(?:experiencia|exp\.)/g,
    /experiencia\s+(?:minima\s+|demostrable\s+|previa\s+)?(?:de\s+)?(?:al menos\s+)?(\d{1,2})\s*\+?\s*anos?/g,
    /al menos\s+(\d{1,2})\s+anos?/g,
    /(\d{1,2})\s*\+?\s*years?'?\s+(?:of\s+)?(?:relevant\s+|professional\s+|proven\s+|hands-on\s+)?experience/g,
    /(?:at least|minimum(?: of)?)\s+(\d{1,2})\s+years?/g,
  ];
  let max = null;
  for (const re of pats) for (const m of folded.matchAll(re)) {
    const n = Number(m[1]);
    if (n > 0 && n <= 40 && (max === null || n > max)) max = n;
  }
  return max;
}

const NIVEL_IDIOMA = /\b(a1|a2|b1|b2|c1|c2|nativo|bilingue|native|fluent|fluido|alto|avanzado|advanced|intermedio|intermediate|basico|basic)\b/;

/**
 * Analiza el texto de una oferta. Devuelve:
 * { palabras, competencias: [{ id, terminos, peso }], tecnologias: [etiqueta], anos, idiomas: [{ id, nivel }], modalidad: [] }
 * Las competencias van ordenadas por peso (veces que la oferta las menciona).
 */
export function analyzeOffer(text) {
  const original = String(text || '').normalize('NFC');
  const folded = foldSameLength(original);
  const palabras = (folded.match(/[\p{L}\p{N}]+/gu) || []).length;
  const competencias = [];
  for (const [id, terms] of Object.entries(VAC_COMPETENCIAS)) {
    // Primero las expresiones más largas: «trabajo bajo presión» no cuenta además como «bajo presión».
    const spans = terms.flatMap(term => vacSpans(folded, term)).sort((a, b) => (b.end - b.start) - (a.end - a.start) || a.start - b.start);
    const taken = [];
    for (const sp of spans) if (!taken.some(x => sp.start < x.end && x.start < sp.end)) taken.push(sp);
    if (!taken.length) continue;
    taken.sort((a, b) => a.start - b.start);
    const seen = new Map();
    for (const sp of taken) {
      const key = folded.slice(sp.start, sp.end);
      if (!seen.has(key)) seen.set(key, original.slice(sp.start, sp.end).toLowerCase());
    }
    competencias.push({ id, terminos: [...seen.values()], peso: taken.length });
  }
  competencias.sort((a, b) => b.peso - a.peso);
  const tecnologias = [];
  for (const [label, ...variants] of VAC_TECNOLOGIAS) {
    if (variants.some(v => vacFind(folded, v).length)) tecnologias.push(label);
  }
  const idiomas = [];
  for (const [id, terms] of Object.entries(VAC_IDIOMAS)) {
    for (const term of terms) {
      const re = cachedRe(term);
      const m = re.exec(folded);
      if (!m) continue;
      const after = folded.slice(m.index, m.index + 60);
      const before = folded.slice(Math.max(0, m.index - 30), m.index);
      const raw = (after.match(NIVEL_IDIOMA) || before.match(NIVEL_IDIOMA) || [])[1] || null;
      idiomas.push({ id, nivel: raw && /^[abc][12]$/.test(raw) ? raw.toUpperCase() : raw });
      break;
    }
  }
  const modalidad = Object.entries(VAC_MODALIDAD).filter(([, terms]) => terms.some(t => vacFind(folded, t).length)).map(([id]) => id);
  return { palabras, competencias, tecnologias, anos: anosExperiencia(folded), idiomas, modalidad };
}

/**
 * Cobertura de las competencias de la oferta con las historias propias.
 * scored: [{ historia, total, estado }]. Estado: 'cubierta' (alguna historia lista o brillante),
 * 'media' (solo borradores) o 'sin' (ninguna historia).
 */
export function offerCoverage(offer, scored) {
  return offer.competencias.map(c => {
    const list = scored.filter(x => x.historia.competencias.includes(c.id)).sort((a, b) => b.total - a.total);
    const estado = !list.length ? 'sin' : list.some(x => x.estado !== 'borrador') ? 'cubierta' : 'media';
    return { id: c.id, peso: c.peso, terminos: c.terminos, estado, historias: list.map(x => x.historia.id) };
  });
}

/** Las preguntas más probables: las que tocan más competencias de la oferta y con más peso. */
export function likelyQuestions(offer, preguntas, n = 5) {
  const peso = Object.fromEntries(offer.competencias.map(c => [c.id, c.peso]));
  return preguntas
    .filter(q => !q.guia)
    .map((q, i) => ({ q, i, s: q.comp.reduce((acc, c) => acc + (peso[c] || 0), 0) }))
    .filter(x => x.s > 0)
    .sort((a, b) => b.s - a.s || a.i - b.i)
    .slice(0, n)
    .map(x => x.q);
}

/** Una oferta «junior» que pide tres años o más: conviene contar experiencia equivalente. */
export function juniorMismatch(offer, nivel) {
  return (nivel === 'sin-experiencia' || nivel === 'junior') && offer.anos !== null && offer.anos >= 3;
}
