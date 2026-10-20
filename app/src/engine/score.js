// Puntuación 0–100 con desglose por criterio y sugerencias explicadas.
import { PESOS, SENSIBLE, UMBRALES, DURACION, MULETILLAS_TOLERADAS } from './constants.js';
import { analyze, BLOQUES } from './analyzer.js';

function clamp(n, lo = 0, hi = 1) { return Math.max(lo, Math.min(hi, n)); }

export function isEmpty(story) {
  return BLOQUES.every(b => !String(story[b] || '').trim());
}

/**
 * Devuelve { total, estado, criterios: [{id, puntos, max, ok}], consejos: [{id, clave, params}], analisis }.
 * Las claves de los consejos se traducen en la interfaz (i18n: tip.*).
 */
export function scoreStory(story, { idioma = 'es', nivel = 'junior', marcados = [] } = {}) {
  const an = analyze(story, { idioma, marcados });
  const criterios = [];
  const consejos = [];
  const add = (id, frac, extra = {}) => {
    const max = PESOS[id];
    criterios.push({ id, max, puntos: Math.round(max * clamp(frac)), ok: frac >= 0.999, ...extra });
  };

  if (isEmpty(story)) {
    for (const id of Object.keys(PESOS)) criterios.push({ id, max: PESOS[id], puntos: 0, ok: false });
    return { total: 0, estado: 'borrador', criterios, consejos: [{ id: 'vacia', clave: 'tip.vacia', params: {} }], analisis: an };
  }

  // Reparto: cada bloque vacío o desequilibrado resta su parte.
  const r = an.reparto;
  let repFrac = 1;
  for (const b of BLOQUES) {
    if (!r.counts[b]) { repFrac -= 0.25; consejos.push({ id: 'falta-' + b, clave: 'tip.falta', params: { bloque: b } }); }
  }
  for (const is of r.issues) {
    if (!r.counts[is.bloque]) continue;
    repFrac -= 0.15;
    consejos.push({ id: 'reparto-' + is.bloque, clave: is.tipo === 'mucho' ? 'tip.repartoMucho' : 'tip.repartoPoco', params: { bloque: is.bloque, pct: is.pct, min: is.min, max: is.max } });
  }
  add('reparto', repFrac);

  // Duración.
  const d = an.duracion;
  if (d.estado === 'ok') add('duracion', 1);
  else if (d.estado === 'corta') {
    add('duracion', d.words / DURACION.minPalabras);
    consejos.push({ id: 'corta', clave: 'tip.corta', params: { palabras: d.words, segundos: d.seconds, min: DURACION.minPalabras } });
  } else {
    add('duracion', 1 - (d.words - DURACION.maxPalabras) / DURACION.maxPalabras);
    consejos.push({ id: 'larga', clave: 'tip.larga', params: { palabras: d.words, segundos: d.seconds, max: DURACION.maxPalabras } });
  }

  // Yo frente a nosotros.
  const y = an.yo;
  if (y.vacio) {
    add('yo', 0);
    consejos.push({ id: 'yo-vacio', clave: 'tip.yoVacio', params: {} });
  } else if (y.ok) add('yo', 1);
  else {
    add('yo', y.pct / 100);
    const top = y.pluralFound.slice().sort((a, b) => b.n - a.n)[0];
    consejos.push({ id: 'nosotros', clave: 'tip.nosotros', params: { termino: top ? top.term : '', veces: y.plural, pct: y.pct } });
  }

  // Resultado medible.
  if (an.cifra.ok) add('cifra', 1);
  else { add('cifra', 0); consejos.push({ id: 'cifra', clave: 'tip.cifra', params: {} }); }

  // Verbos de acción.
  const v = an.verbos;
  add('verbos', Math.min(1, v.distinct / 3) - (v.weak.length >= 3 ? 0.4 : 0));
  if (v.weak.length >= 2) consejos.push({ id: 'arranques', clave: 'tip.arranques', params: { termino: v.weak[0], veces: v.weak.length } });
  else if (v.distinct < 3) consejos.push({ id: 'verbos', clave: 'tip.verbos', params: { n: v.distinct } });

  // Muletillas.
  const m = an.muletillas;
  add('muletillas', m.ok ? 1 : 1 - (m.total - MULETILLAS_TOLERADAS) * 0.25);
  if (m.total) {
    const top = m.found.slice().sort((a, b) => b.n - a.n)[0];
    consejos.push({ id: 'muletilla', clave: top.term === 'intenté' || top.term === 'i tried' ? 'tip.intente' : 'tip.muletilla', params: { termino: top.term, veces: m.total } });
  }

  // Aprendizaje.
  if (an.aprendizaje.ok) add('aprendizaje', 1);
  else { add('aprendizaje', 0); consejos.push({ id: 'aprendizaje', clave: 'tip.aprendizaje', params: {} }); }

  // Una historia muy corta no puede puntuar alto por lo que no tiene: los criterios de estilo
  // se escalan según lo completa que esté (a partir de la longitud mínima cuentan enteros).
  const completitud = Math.min(1, 0.3 + 0.7 * (d.words / DURACION.minPalabras));
  if (completitud < 1) for (const c of criterios) if (c.id !== 'duracion') c.puntos = Math.round(c.puntos * completitud);
  let total = criterios.reduce((n, c) => n + c.puntos, 0);
  const sens = an.sensibles;
  if (sens.length) {
    total -= Math.min(SENSIBLE.tope, sens.length * SENSIBLE.penalizacion);
    for (const h of sens) consejos.unshift({ id: 'sensible-' + h.tipo + '-' + h.valor, clave: 'tip.sensible.' + h.tipo, params: { valor: h.valor } });
  }
  total = Math.max(0, Math.min(100, Math.round(total)));
  const u = UMBRALES[nivel] || UMBRALES.junior;
  let estado = total >= u.brillante ? 'brillante' : total >= u.lista ? 'lista' : 'borrador';
  if (sens.length && estado !== 'borrador') estado = 'borrador';
  if (nivel === 'senior' && !an.cifra.ok && estado === 'brillante') estado = 'lista';
  return { total, estado, criterios, consejos, analisis: an };
}
