// Analizador STAR: reglas explicables, deterministas y sin DOM.
import { REPARTO, REPARTO_TOLERANCIA, DURACION, YO_MINIMO, VERBOS_MINIMOS, MULETILLAS_TOLERADAS } from './constants.js';
import { LEX_ES } from '../content/lexico/es.js';
import { LEX_EN } from '../content/lexico/en.js';

export const BLOQUES = ['s', 't', 'a', 'r'];

export function lexicon(idioma) {
  return idioma === 'en' ? LEX_EN : LEX_ES;
}

/** Normaliza a minúsculas y quita signos, conservando tildes (las necesitan los verbos). */
export function normalize(text) {
  return String(text || '').toLowerCase().replace(/[\u2019]/g, "'");
}

/** Quita tildes: para búsquedas insensibles a acentos. */
export function fold(text) {
  return String(text || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

export function tokens(text) {
  return normalize(text).match(/[\p{L}\p{N}][\p{L}\p{N}'%.,-]*[\p{L}\p{N}%]|[\p{L}\p{N}]/gu) || [];
}

export function wordCount(text) {
  return tokens(text).length;
}

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Cuenta apariciones de una expresión como palabra completa. */
export function countPhrase(text, phrase) {
  const re = new RegExp(`(^|[^\\p{L}\\p{N}'])${escapeRe(phrase)}(?=$|[^\\p{L}\\p{N}'])`, 'gu');
  return (normalize(text).match(re) || []).length;
}

export function countList(text, list) {
  const found = [];
  let total = 0;
  for (const p of list) {
    const n = countPhrase(text, p);
    if (n) { total += n; found.push({ term: p, n }); }
  }
  return { total, found };
}

/** Reparto de palabras entre S, T, A y R. */
export function distribution(story) {
  const counts = {};
  let total = 0;
  for (const b of BLOQUES) { counts[b] = wordCount(story[b]); total += counts[b]; }
  const pct = {};
  for (const b of BLOQUES) pct[b] = total ? Math.round((counts[b] / total) * 100) : 0;
  const issues = [];
  if (total) {
    for (const b of BLOQUES) {
      const { min, max } = REPARTO[b];
      if (pct[b] < min - REPARTO_TOLERANCIA) issues.push({ bloque: b, tipo: 'poco', pct: pct[b], min, max });
      else if (pct[b] > max + REPARTO_TOLERANCIA) issues.push({ bloque: b, tipo: 'mucho', pct: pct[b], min, max });
    }
  }
  return { counts, pct, total, issues };
}

export function duration(story) {
  const words = BLOQUES.reduce((n, b) => n + wordCount(story[b]), 0) + wordCount(story.l);
  const seconds = Math.round((words / DURACION.palabrasPorMinuto) * 60);
  let estado = 'ok';
  if (words < DURACION.minPalabras) estado = 'corta';
  else if (words > DURACION.maxPalabras) estado = 'larga';
  return { words, seconds, estado };
}

/** Verbos en primera persona del singular frente a plural, dentro de la acción. */
export function firstPerson(text, idioma = 'es') {
  const lex = lexicon(idioma);
  const plural = countList(text, lex.plural);
  let singular = countList(text, lex.singular).total;
  if (idioma === 'en') {
    singular = countList(text, ['i']).total + countList(text, ['myself']).total;
  } else {
    const nov = new Set(lex.noVerbos);
    const sing = new Set(lex.singular);
    for (const w of tokens(text)) {
      if (w.length > 2 && /[éí]$/.test(w) && !nov.has(w) && !sing.has(w)) singular++;
    }
  }
  const total = singular + plural.total;
  const pct = total ? Math.round((singular / total) * 100) : 100;
  return { singular, plural: plural.total, pluralFound: plural.found, pct, ok: total === 0 ? false : pct >= YO_MINIMO, vacio: total === 0 };
}

const NUM_RE = /\d|%/;

/** ¿El resultado tiene una cifra, un porcentaje, un tiempo o un antes y después? */
export function measurable(text, idioma = 'es') {
  const lex = lexicon(idioma);
  const digits = NUM_RE.test(String(text || ''));
  const palabras = countList(text, lex.cifrasPalabras);
  const antesDespues = idioma === 'en'
    ? /\bfrom\b[^.]{1,40}\bto\b/i.test(text || '')
    : /\bde\b[^.]{1,40}\ba\b[^.]{0,20}\d/i.test(text || '') || (countPhrase(text, 'antes') > 0 && countPhrase(text, 'después') > 0);
  return { ok: digits || antesDespues || palabras.total >= 2, digits, antesDespues };
}

export function actionVerbs(text, idioma = 'es') {
  const lex = lexicon(idioma);
  let { found } = countList(text, lex.verbosAccion);
  if (idioma === 'en') {
    // En inglés, «I» + verbo regular en pasado también cuenta aunque no esté en el léxico.
    const seen = new Set(found.map(f => f.term));
    for (const m of normalize(text).matchAll(/\bi (?:then |also |quickly |personally |first )?([a-z]{3,}ed)\b/g)) {
      if (!seen.has(m[1]) && !lex.noVerbos.includes(m[1])) { seen.add(m[1]); found = [...found, { term: m[1], n: 1 }]; }
    }
  }
  const sentences = String(text || '').split(/[.!?\n]+/).map(s => normalize(s).trim()).filter(Boolean);
  const weak = [];
  for (const s of sentences) {
    for (const w of lex.arranquesDebiles) {
      if (s === w || s.startsWith(w + ' ')) { weak.push(w); break; }
    }
  }
  return { distinct: found.length, verbs: found.map(f => f.term), weak, ok: found.length >= VERBOS_MINIMOS && weak.length < 3 };
}

export function fillers(story, idioma = 'es') {
  const lex = lexicon(idioma);
  const text = [...BLOQUES, 'l'].map(b => story[b] || '').join('\n');
  const { total, found } = countList(text, lex.muletillas);
  return { total, found, ok: total <= MULETILLAS_TOLERADAS };
}

export function learning(story, idioma = 'es') {
  const lex = lexicon(idioma);
  const hasL = wordCount(story.l) >= 4;
  const inR = countList(story.r, lex.aprendizaje).total > 0;
  return { ok: hasL || inR };
}

const IPV4 = /\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g;
const EMAIL = /\b[\w.+-]+@[\w-]+(?:\.[\w-]+)+\b/g;
const INTERNO = /\b[\w-]+(?:\.[\w-]+)*\.(?:local|corp|internal|intranet|lan|ad|int)\b/gi;
const CVE = /\bCVE-\d{4}-\d{4,7}\b/gi;
const DOC_IPS = [/^192\.0\.2\./, /^198\.51\.100\./, /^203\.0\.113\./, /^0\.0\.0\.0$/, /^127\./];

/**
 * Datos sensibles: IP, correos, dominios internos, CVE (pueden señalar un cliente sin parchear)
 * y términos que la persona marca como confidenciales.
 */
export function sensitive(story, marcados = []) {
  const text = [...BLOQUES, 'l', 'titulo'].map(b => story[b] || '').join('\n');
  const hits = [];
  for (const m of text.match(IPV4) || []) if (!DOC_IPS.some(re => re.test(m))) hits.push({ tipo: 'ip', valor: m });
  for (const m of text.match(EMAIL) || []) hits.push({ tipo: 'email', valor: m });
  const emails = new Set((text.match(EMAIL) || []).map(e => e.split('@')[1].toLowerCase()));
  for (const m of text.match(INTERNO) || []) if (!emails.has(m.toLowerCase())) hits.push({ tipo: 'dominio', valor: m });
  for (const m of text.match(CVE) || []) hits.push({ tipo: 'cve', valor: m.toUpperCase() });
  for (const term of marcados) {
    const t = String(term || '').trim();
    if (t.length >= 2 && countPhrase(text, t.toLowerCase()) > 0) hits.push({ tipo: 'cliente', valor: t });
  }
  const seen = new Set();
  return hits.filter(h => { const k = h.tipo + ':' + h.valor.toLowerCase(); if (seen.has(k)) return false; seen.add(k); return true; });
}

/** Análisis completo de una historia. */
export function analyze(story, { idioma = 'es', marcados = [] } = {}) {
  return {
    reparto: distribution(story),
    duracion: duration(story),
    yo: firstPerson(story.a, idioma),
    cifra: measurable(story.r, idioma),
    verbos: actionVerbs(story.a, idioma),
    muletillas: fillers(story, idioma),
    aprendizaje: learning(story, idioma),
    sensibles: sensitive(story, marcados),
  };
}

/** Idioma probable de una historia ('es' o 'en'), o null si hay poco texto. */
export function detectLanguage(story) {
  const text = normalize([...BLOQUES, 'l'].map(b => (story && story[b]) || '').join(' '));
  const words = text.split(/[^a-zñáéíóúü']+/).filter(Boolean);
  if (words.length < 12) return null;
  const ES_W = new Set(['el', 'la', 'de', 'que', 'y', 'en', 'los', 'las', 'un', 'una', 'del', 'por', 'con', 'para', 'se', 'mi', 'lo', 'al', 'es', 'como', 'pero', 'más']);
  const EN_W = new Set(['the', 'and', 'of', 'to', 'in', 'a', 'i', 'was', 'with', 'for', 'my', 'that', 'it', 'on', 'we', 'had', 'is', 'as', 'by', 'from', 'which', 'this']);
  let es = 0, en = 0;
  for (const w of words) { if (ES_W.has(w)) es++; if (EN_W.has(w)) en++; }
  if (es === en) return null;
  return en > es ? 'en' : 'es';
}
