// De la historia al CV: viñetas a partir de la Acción y el Resultado, y palabras clave de una oferta
// que faltan en el CV. Reglas locales; no promete pasar ningún filtro automático.
import { lexicon, normalize, wordCount, countList } from './analyzer.js';
import { vacFind, foldSameLength } from './vacante.js';
import { VAC_TECNOLOGIAS, CV_CONECTORES } from '../content/vacante.js';

export const CV = { maxCaracteres: 220, minPalabras: 5, maxAcciones: 2 };

function sentences(text) {
  return String(text || '').split(/(?<=[.!?;])\s+|\n+/).map(s => s.trim()).filter(Boolean);
}

/** Quita conectores iniciales («Después,», «Luego», «Then») y deja la frase lista para una viñeta. */
export function cleanBullet(s) {
  let out = s.trim().replace(/[.;:]+$/, '');
  for (let changed = true; changed;) {
    changed = false;
    for (const c of CV_CONECTORES) {
      const re = new RegExp(`^${c.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}(?:,\\s*|\\s+)`, 'i');
      if (re.test(out) && out.replace(re, '').length > 0) { out = out.replace(re, ''); changed = true; }
    }
  }
  if (out.length > CV.maxCaracteres) {
    const cut = out.slice(0, CV.maxCaracteres);
    out = cut.slice(0, cut.lastIndexOf(' ')).replace(/[,;:]$/, '') + '…';
  }
  return out.charAt(0).toUpperCase() + out.slice(1);
}

function actionScore(s, idioma) {
  const lex = lexicon(idioma);
  const first = normalize(s).split(/\s+/).slice(0, 3).join(' ');
  let score = countList(first, lex.verbosAccion).total ? 3 : 0;
  // Como en el analizador STAR: en español, un verbo en primera persona del pasado acaba en -é o -í.
  if (idioma !== 'en' && first.split(/\s+/).some(w => w.replace(/[^\p{L}]/gu, '').length > 2 && /[éí]$/.test(w.replace(/[^\p{L}]/gu, '')) && !lex.noVerbos.includes(w.replace(/[^\p{L}]/gu, '')))) score = Math.max(score, 3);
  if (idioma === 'en' && /^(?:i\s+)?\w+ed\b/i.test(s.trim())) score = Math.max(score, 2);
  if (/\d|%/.test(s)) score += 2;
  const w = wordCount(s);
  if (w >= CV.minPalabras && w <= 35) score += 1;
  if (w < CV.minPalabras) score -= 3;
  return score;
}

/**
 * Viñetas de CV de una historia: hasta dos frases de acción (las que empiezan con un verbo de acción
 * o llevan cifras) y una de resultado (la primera con cifra). Devuelve [{ tipo, texto }].
 */
export function bulletsFromStory(story, idioma = 'es') {
  const acciones = sentences(story.a).map((s, i) => ({ s, i, score: actionScore(s, idioma) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score || a.i - b.i)
    .slice(0, CV.maxAcciones)
    .sort((a, b) => a.i - b.i)
    .map(x => ({ tipo: 'accion', texto: cleanBullet(x.s) }));
  const rs = sentences(story.r).filter(s => wordCount(s) >= 3);
  const r = rs.find(s => /\d|%/.test(s)) || rs[0];
  const out = [...acciones];
  if (r) out.push({ tipo: 'resultado', texto: cleanBullet(r) });
  return out;
}

/**
 * Palabras clave de la oferta (tecnologías y expresiones de competencias que usa) presentes y ausentes
 * en el texto del CV. La comparación no distingue mayúsculas ni tildes.
 */
export function keywordGap(offer, cvText) {
  const cv = foldSameLength(cvText);
  const presentes = [], faltan = [];
  for (const label of offer.tecnologias) {
    const variants = (VAC_TECNOLOGIAS.find(x => x[0] === label) || [label]).slice(1);
    (variants.some(v => vacFind(cv, v).length) ? presentes : faltan).push(label);
  }
  const seen = new Set();
  for (const c of offer.competencias) {
    for (const term of c.terminos) {
      const k = foldSameLength(term);
      if (seen.has(k)) continue;
      seen.add(k);
      (vacFind(cv, k).length ? presentes : faltan).push(term);
    }
  }
  return { presentes, faltan };
}
