// Motor de la Arena: convicción del recruiter, repreguntas según lo que falte y recomendación de historias.
// Puro y sin DOM: todas las reglas del duelo están aquí y se prueban con node --test.
import { PESOS } from './constants.js';

/** Reglas del duelo (la ayuda las muestra desde aquí). */
export const DUELO = {
  conviccionInicial: 50,
  victoria: 70,
  derrotaInmediata: 15,
  factor: 0.6,
  maxDelta: 30,
  contrarreloj: 90,
  penalizacionTiempo: 10,
  modos: ['escrito', 'voz', 'contrarreloj', 'sorpresa'],
};

/** Bloque al que se añade la respuesta de cada repregunta. */
export const REPREGUNTA_BLOQUE = { reparto: 's', duracion: 'a', yo: 'a', cifra: 'r', verbos: 'a', muletillas: 'a', aprendizaje: 'l', profundiza: 'a' };

function clampN(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/** Nota ponderada 0–100 según lo que valora el recruiter. */
export function weightedScore(recruiter, score) {
  let num = 0, den = 0;
  for (const c of score.criterios) {
    const w = PESOS[c.id] * ((recruiter.pesos && recruiter.pesos[c.id]) || 1);
    num += (c.max ? c.puntos / c.max : 0) * w;
    den += w;
  }
  let pct = den ? (num / den) * 100 : 0;
  // Los datos sensibles cuestan confianza aunque el resto esté bien.
  if (score.analisis && score.analisis.sensibles && score.analisis.sensibles.length) pct -= 15;
  return Math.round(clampN(pct, 0, 100));
}

/** Cambio de convicción de una respuesta. */
export function convictionDelta(recruiter, score, { tiempoAgotado = false } = {}) {
  const w = weightedScore(recruiter, score);
  let d = Math.round((w - recruiter.umbral) * DUELO.factor * recruiter.ganancia);
  d = clampN(d, -DUELO.maxDelta, DUELO.maxDelta);
  if (tiempoAgotado) d -= DUELO.penalizacionTiempo;
  return d;
}

/** Criterios flojos ordenados por lo que más le importa al recruiter. */
export function gaps(recruiter, score) {
  return score.criterios
    .filter(c => !c.ok)
    .map(c => ({ id: c.id, falta: (1 - c.puntos / c.max) * PESOS[c.id] * ((recruiter.pesos && recruiter.pesos[c.id]) || 1) }))
    .sort((a, b) => b.falta - a.falta)
    .map(g => g.id);
}

/** Siguiente repregunta: el hueco más importante que aún no se ha preguntado, o «profundiza». */
export function nextFollowUp(recruiter, score, preguntadas = []) {
  const g = gaps(recruiter, score).find(id => !preguntadas.includes(id));
  return g || 'profundiza';
}

/** Une la respuesta a una repregunta con la historia en el bloque correspondiente. */
export function applyFollowUp(story, criterio, texto) {
  const b = REPREGUNTA_BLOQUE[criterio] || 'a';
  const extra = String(texto || '').trim();
  if (!extra) return { ...story };
  return { ...story, [b]: (String(story[b] || '').trim() + ' ' + extra).trim() };
}

/** Crea un duelo nuevo. */
export function newDuel(recruiter, pregunta, modo) {
  return { recruiter: recruiter.id, pregunta: pregunta.id, modo, conviccion: DUELO.conviccionInicial, rondas: [], preguntadas: [], fin: null };
}

/** Registra una ronda y decide si el duelo sigue. Devuelve el duelo actualizado. */
export function playRound(duel, recruiter, score, { criterio = null, tiempoAgotado = false } = {}) {
  const delta = convictionDelta(recruiter, score, { tiempoAgotado });
  const conviccion = clampN(duel.conviccion + delta, 0, 100);
  const rondas = [...duel.rondas, { criterio, delta, conviccion, total: score.total, tiempoAgotado }];
  const preguntadas = criterio ? [...duel.preguntadas, criterio] : duel.preguntadas;
  let fin = null;
  if (conviccion <= DUELO.derrotaInmediata) fin = 'perdido';
  else if (rondas.length > recruiter.repreguntas) fin = conviccion >= DUELO.victoria ? 'ganado' : 'perdido';
  return { ...duel, conviccion, rondas, preguntadas, fin };
}

/** Puntuación de autoevaluación (modo en voz alta): marcas por criterio → misma forma que scoreStory. */
export function selfScore(marcas) {
  const criterios = Object.keys(PESOS).map(id => ({ id, max: PESOS[id], puntos: marcas[id] ? PESOS[id] : 0, ok: !!marcas[id] }));
  return { total: criterios.reduce((n, c) => n + c.puntos, 0), criterios, consejos: [], analisis: { sensibles: [] } };
}

/**
 * Historias que mejor encajan con una pregunta: coincidencia de competencias primero, luego la nota.
 * scoreFn(story) → { total }.
 */
export function recommendStories(pregunta, historias, scoreFn, n = 3) {
  const comps = pregunta.comp || [];
  return historias
    .map(h => {
      const match = h.competencias.filter(c => comps.includes(c)).length;
      const total = scoreFn(h).total;
      return { historia: h, match, total, rank: match * 100 + total };
    })
    .sort((a, b) => b.rank - a.rank)
    .slice(0, n);
}

/** Elige un elemento con un número aleatorio inyectable (para pruebas). */
export function pick(list, rnd = Math.random) {
  return list[Math.floor(rnd() * list.length) % list.length];
}
