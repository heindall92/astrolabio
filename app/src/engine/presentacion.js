// «Háblame de ti»: presentación de 60 a 90 segundos en tres partes (presente, pasado y por qué este
// puesto). Reglas explicables, como el analizador STAR.
import { lexicon, normalize, wordCount, countList, countPhrase, measurable } from './analyzer.js';
import { DURACION } from './constants.js';
import { PRESENTACION_MARCAS } from '../content/vacante.js';

/** Duración y peso de cada criterio de la presentación (suman 100). */
export const PRESENTACION = {
  minSegundos: 60,
  maxSegundos: 90,
  pesos: { duracion: 25, presente: 15, pasado: 15, futuro: 20, cifra: 15, muletillas: 10 },
  /** Si no llega a la mitad del tiempo mínimo, la nota no pasa de aquí: tres frases no son una presentación. */
  topeCorta: 50,
};

function hasAny(text, list) {
  return list.some(p => countPhrase(text, p) > 0);
}

/**
 * Analiza una presentación. puesto: nombre del puesto o de la empresa (opcional) para comprobar que
 * la cierra con ellos. Devuelve { total, palabras, segundos, estado, criterios: [{ id, ok, puntos, max }] }.
 */
export function analyzePitch(text, { idioma = 'es', puesto = '' } = {}) {
  const m = PRESENTACION_MARCAS[idioma === 'en' ? 'en' : 'es'];
  const lex = lexicon(idioma);
  const palabras = wordCount(text);
  const segundos = Math.round((palabras / DURACION.palabrasPorMinuto) * 60);
  const minP = Math.round((PRESENTACION.minSegundos * DURACION.palabrasPorMinuto) / 60);
  const maxP = Math.round((PRESENTACION.maxSegundos * DURACION.palabrasPorMinuto) / 60);
  const estado = !palabras ? 'vacia' : palabras < minP ? 'corta' : palabras > maxP ? 'larga' : 'ok';
  const norm = normalize(text);
  const nombrePuesto = String(puesto || '').trim().toLowerCase();
  const futuro = hasAny(norm, m.futuro);
  const conPuesto = nombrePuesto.length >= 2 ? countPhrase(norm, nombrePuesto) > 0 : hasAny(norm, m.puesto);
  const mul = countList(norm, lex.muletillas).total;
  const P = PRESENTACION.pesos;
  const frac = {
    duracion: estado === 'ok' ? 1 : estado === 'vacia' ? 0 : estado === 'corta' ? palabras / minP : Math.max(0, 1 - (palabras - maxP) / maxP),
    presente: hasAny(norm, m.presente) ? 1 : 0,
    pasado: hasAny(norm, m.pasado) ? 1 : 0,
    futuro: futuro && conPuesto ? 1 : futuro || conPuesto ? 0.5 : 0,
    cifra: measurable(text, idioma).ok ? 1 : 0,
    muletillas: !palabras ? 0 : mul === 0 ? 1 : mul === 1 ? 0.5 : 0,
  };
  const criterios = Object.keys(P).map(id => ({ id, max: P[id], puntos: Math.round(P[id] * Math.max(0, Math.min(1, frac[id]))), ok: frac[id] >= 0.999 }));
  const suma = criterios.reduce((a, c) => a + c.puntos, 0);
  const tope = palabras > 0 && palabras < minP / 2;
  const total = tope ? Math.min(suma, PRESENTACION.topeCorta) : suma;
  return { total, tope, palabras, segundos, estado, minPalabras: minP, maxPalabras: maxP, muletillas: mul, conPuesto, criterios };
}
