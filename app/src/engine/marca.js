// Tu marca fuera de la entrevista: kit de LinkedIn, CV de tareas a resultados, bóveda de historias y plan de
// contenido «Field Notes». Motor puro: solo usa lo que la persona ya escribió (CV, marca, Baúl, historias).
import { foldSameLength, vacFind } from './vacante.js';
import { wordCount } from './analyzer.js';
import { VAC_TECNOLOGIAS } from '../content/vacante.js';
import { NO_HERRAMIENTAS } from '../content/guion.js';
import { LINKEDIN_LIMITES, LINKEDIN_TXT, VERBOS_XYZ, A_VERBO, COMO_XYZ, AUDITORIA, POST_REGLAS, POST_TXT } from '../content/marca.js';

const rellenarM = (tpl, vars) => tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));
const sinPunto = s => String(s || '').trim().replace(/[.。]+$/, '');
const conPunto = s => { const t = String(s || '').trim(); return !t ? '' : /[.!?…]$/.test(t) ? t : t + '.'; };
const listaM = (xs, idioma) => (xs.length <= 1 ? xs.join('') : xs.slice(0, -1).join(', ') + ' ' + LINKEDIN_TXT[idioma].y + ' ' + xs[xs.length - 1]);
const minusM = s => { const t = String(s || '').trim(); return t.length > 1 && /\p{Ll}/u.test(t[1]) ? t[0].toLowerCase() + t.slice(1) : t; };

// ---------- Kit de LinkedIn ----------
/**
 * Titulares (hasta tres variantes), «Acerca de», palabras clave de tus ofertas que faltan en tu perfil y la
 * petición de recomendación. ctx: { cv (leerCV), marca, rol (nombre de la ruta), textoPerfil, ofertas: [texto], idioma, nombre }.
 * Nunca inventa cifras: los logros salen del CV tal cual.
 */
export function kitLinkedIn(ctx) {
  const idioma = ctx.idioma === 'en' ? 'en' : 'es';
  const T = LINKEDIN_TXT[idioma];
  const cv = ctx.cv, m = ctx.marca || {};
  const herr = cv ? cv.tecnologias.filter(x => !NO_HERRAMIENTAS.includes(x) && !cv.certificaciones.some(c => foldSameLength(c).includes(foldSameLength(x)))) : [];
  const titular = (cv && cv.titular) || ctx.rol || '';
  const act = cv && cv.actual;
  const candidatos = [
    titular && herr.length && m.frase ? rellenarM(T.titularA, { titular, tecs: herr.slice(0, 3).join(' · '), frase: sinPunto(m.frase) }) : null,
    (ctx.rol || titular) && m.ventaja ? rellenarM(T.titularB, { rol: ctx.rol || titular, ventaja: sinPunto(m.ventaja).replace(/^que\s+/i, '') }) : null,
    act && m.hilo ? rellenarM(T.titularC, { puesto: act.puesto, empresa: act.empresa ? (idioma === 'en' ? ' at ' : ' en ') + act.empresa : '', hilo: sinPunto(m.hilo) }) : null,
    titular && herr.length ? `${titular} | ${herr.slice(0, 4).join(' · ')}` : null,
  ].filter(Boolean);
  const titulares = [...new Set(candidatos)].slice(0, 3).map(texto => ({ texto, largo: texto.length, ok: texto.length <= LINKEDIN_LIMITES.titular }));
  // «Acerca de»: gancho, quién soy, ventaja, resultados del CV, punto de vista, tecnologías y llamada a la acción.
  const partes = [];
  if (m.frase) partes.push(conPunto(m.frase));
  if (titular) partes.push(rellenarM(T.quien, { titular: minusM(titular), anos: cv && cv.anos >= 2 ? rellenarM(T.anos, { n: cv.anos }) : '', hilo: m.hilo ? rellenarM(T.quienHilo, { hilo: sinPunto(m.hilo) }) : '' }).trim());
  if (m.ventaja) partes.push(rellenarM(T.ventaja, { ventaja: sinPunto(m.ventaja).replace(/^que\s+/i, '') }));
  const logros = cv ? cv.logros.slice(0, 3) : [];
  if (logros.length) partes.push(T.logros + '\n' + logros.map(l => '• ' + conPunto(l)).join('\n'));
  if (m.puntoVista) partes.push(rellenarM(T.puntoVista, { punto: sinPunto(m.puntoVista) }));
  if (herr.length) partes.push(rellenarM(T.tecs, { lista: listaM(herr.slice(0, 8), idioma) }));
  partes.push(ctx.rol ? rellenarM(T.cta, { rol: ctx.rol }) : T.ctaGenerico);
  let acerca = partes.join('\n\n');
  if (acerca.length > LINKEDIN_LIMITES.acerca) acerca = acerca.slice(0, LINKEDIN_LIMITES.acerca);
  // Palabras clave: tecnologías que piden tus ofertas y no están en tu perfil (CV + lo que vas a publicar).
  const perfil = foldSameLength([ctx.textoPerfil || '', titulares.map(x => x.texto).join(' '), acerca].join(' '));
  const pedidas = new Map();
  for (const of of ctx.ofertas || []) {
    const f = foldSameLength(of);
    for (const [label, ...vs] of VAC_TECNOLOGIAS) if (vs.some(v => vacFind(f, v).length)) pedidas.set(label, (pedidas.get(label) || 0) + 1);
  }
  const palabras = [...pedidas.entries()].sort((a, b) => b[1] - a[1]).map(([label, n]) => {
    const vs = (VAC_TECNOLOGIAS.find(x => x[0] === label) || [label]).slice(1);
    return { label, ofertas: n, enPerfil: vs.some(v => vacFind(perfil, v).length) };
  });
  const recomendacion = rellenarM(T.recomendacion, { nombre: T.recNombre, proyecto: act && act.empresa ? act.empresa : T.recProyecto, destacar: m.ventaja ? sinPunto(m.ventaja).replace(/^que\s+/i, idioma === 'en' ? '' : 'cómo ') : T.recDestacar, yo: ctx.nombre || T.recYo });
  return {
    titulares,
    acerca: { texto: acerca, largo: acerca.length, ok: acerca.length <= LINKEDIN_LIMITES.acerca, pliegue: acerca.slice(0, LINKEDIN_LIMITES.pliegue) },
    palabras,
    recomendacion,
  };
}

// ---------- CV: de tareas a resultados (fórmula XYZ) ----------
/**
 * Revisa cada viñeta de experiencia y proyectos: ¿empieza por un verbo de acción?, ¿trae una cifra?, ¿dice cómo
 * (herramienta o método)? Propone el verbo cuando empieza por un sustantivo («Administración de…»), pero nunca
 * propone números. También marca las fechas sin mes. Devuelve { vinetas, pct, fechas, ficha }.
 */
export function revisarCV(cv, idioma = 'es') {
  if (!cv) return { vinetas: [], pct: 0, fechas: [], ficha: '' };
  const verbos = VERBOS_XYZ[idioma === 'en' ? 'en' : 'es'];
  const como = COMO_XYZ[idioma === 'en' ? 'en' : 'es'];
  const lineas = [...cv.experiencias.flatMap(e => e.logros.map(l => ({ l, puesto: e.puesto }))), ...((cv.secciones && cv.secciones.proyectos) || []).map(l => ({ l, puesto: '' }))];
  const vinetas = lineas.map(({ l, puesto }) => {
    const f = foldSameLength(l);
    const primera = f.split(/\s+/)[0].replace(/[^\p{L}]/gu, '');
    const palabra = l.trim().split(/\s+/)[0].replace(/[^\p{L}]/gu, '').toLowerCase();
    const verbo = verbos.some(v => foldSameLength(v) === primera) || (idioma === 'en' ? /ed$/.test(primera) : palabra.length > 3 && /[éí]$/.test(palabra));
    const sustantivo = !verbo && A_VERBO[primera] ? A_VERBO[primera] : '';
    const cifra = /\d/.test(l);
    const tieneComo = como.some(c => f.includes(c)) || /\(|:/.test(l) || VAC_TECNOLOGIAS.some(([, ...vs]) => vs.some(v => vacFind(f, v).length));
    const falta = [!verbo && 'verbo', !cifra && 'cifra', !tieneComo && 'como'].filter(Boolean);
    return { texto: l, puesto, verbo, cifra, como: tieneComo, sustantivo, sugerencia: sustantivo ? l.replace(/^\S+(\s+de(l)?\b)?/i, sustantivo) : '', falta, ok: !falta.length };
  });
  const pct = vinetas.length ? Math.round((vinetas.filter(v => v.ok).length / vinetas.length) * 100) : 0;
  const fechas = cv.experiencias.map(e => ({ puesto: e.puesto, empresa: e.empresa, desde: e.desde, hasta: e.hasta, actual: e.actual, sinMes: !!e.sinMes }));
  const mm = iso => iso.slice(5, 7) + '/' + iso.slice(0, 4);
  const ficha = fechas.map(x => `${x.puesto}${x.empresa ? ' · ' + x.empresa : ''} · ${mm(x.desde)} – ${x.actual ? (idioma === 'en' ? 'present' : 'actualidad') : mm(x.hasta)}`).join('\n');
  return { vinetas, pct, fechas, ficha };
}

// ---------- Bóveda de historias ----------
/**
 * Elige hasta n historias que cubran competencias distintas (primero las mejor puntuadas que añaden una competencia
 * nueva) y, para cada una, las preguntas para las que mejor encaja: «úsala para…».
 * Devuelve { boveda: [{ historia, total, estado, usos: [pregunta], nuevas }], cubiertas, faltan }.
 */
export function seleccionarBoveda(historias, scoreFn, preguntas, competencias, n = 6) {
  const puntuadas = historias.map(h => ({ historia: h, ...scoreFn(h) })).sort((a, b) => b.total - a.total);
  const cubiertas = new Set();
  const elegidas = [];
  for (const ronda of [true, false]) {
    for (const x of puntuadas) {
      if (elegidas.length >= n || elegidas.includes(x)) continue;
      const nuevas = x.historia.competencias.filter(c => !cubiertas.has(c));
      if (ronda && !nuevas.length) continue;
      elegidas.push(x);
      nuevas.forEach(c => cubiertas.add(c));
    }
  }
  // Reparto por turnos: en cada vuelta, cada historia toma la pregunta que mejor le encaja (más competencias en común)
  // y que aún no tiene otra. Así ninguna se queda sin uso mientras queden preguntas y ninguna pregunta se repite.
  const candidatas = elegidas.map(x => preguntas
    .map((q, i) => ({ q, i, match: (q.comp || []).filter(c => x.historia.competencias.includes(c)).length }))
    .filter(y => y.match > 0)
    .sort((a, b) => b.match - a.match || a.i - b.i));
  const usos = elegidas.map(() => []);
  const usadas = new Set();
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    candidatas.forEach((lista, k) => {
      const y = lista.find(z => !usadas.has(z.q.id));
      if (y) { usadas.add(y.q.id); usos[k].push(y.q); }
    });
  }
  const boveda = elegidas.map((x, k) => ({ historia: x.historia, total: x.total, estado: x.estado, usos: usos[k] }));
  return { boveda, cubiertas: [...cubiertas], faltan: competencias.filter(c => !cubiertas.has(c)) };
}

// ---------- Plan de contenido «Field Notes» ----------
/** Borrador de post a partir de una nota del Baúl: gancho (cifra, punto de vista o título), cuerpo, lección y cierre. */
export function borradorPost(nota, { marca = {}, n = 1, idioma = 'es' } = {}) {
  const T = POST_TXT[idioma === 'en' ? 'en' : 'es'];
  const c = nota.campos || {};
  const titulo = c.nombre || c.termino || c.titulo || '';
  const gancho = c.cifra ? conPunto(c.cifra.charAt(0).toUpperCase() + c.cifra.slice(1)) : marca.puntoVista ? conPunto(marca.puntoVista.charAt(0).toUpperCase() + marca.puntoVista.slice(1)) : rellenarM(T.ganchoTitulo, { titulo });
  const cuerpo = rellenarM(T[nota.tipo] || T.idea, {
    titulo, definicion: conPunto(minusM(c.definicion)), uso: conPunto(minusM(c.uso)), sencillo: conPunto(minusM(c.sencillo)), tecnico: conPunto(minusM(c.tecnico)), ejemplo: conPunto(minusM(c.ejemplo)),
    objetivo: conPunto(minusM(c.objetivo)), hice: conPunto(minusM(c.hice)), resultado: conPunto(minusM(c.resultado)), aprendi: conPunto(minusM(c.aprendi)), demuestra: conPunto(minusM(c.demuestra)), texto: c.texto || '',
  }).split('\n\n').filter(p => !/:\s*$/.test(p.trim())).join('\n\n');
  const tags = [...new Set([...(c.claves || '').split(','), ...(c.stack || '').split(',')].map(x => x.trim().replace(/[^\p{L}\p{N}]/gu, '')).filter(x => x.length >= 2))].slice(0, POST_REGLAS.hashtags).map(x => '#' + x);
  return [rellenarM(T.serie, { n }) + ' · ' + gancho, cuerpo, T.leccion, T.cierre, tags.join(' ')].filter(Boolean).join('\n\n');
}

/**
 * Revisa un borrador: longitud, gancho antes del «ver más» y sin pregunta, una cifra, hashtags, enlaces en el cuerpo,
 * relleno genérico, cebo de interacción y huecos sin completar. Devuelve { hallazgos: [{ id, nivel, detalle }], veredicto }.
 */
export function auditarPost(texto, idioma = 'es') {
  const A = AUDITORIA[idioma === 'en' ? 'en' : 'es'];
  const t = String(texto || '');
  const f = foldSameLength(t);
  const h = [];
  const primera = t.split('\n').find(l => l.trim()) || '';
  if (t.length < POST_REGLAS.min) h.push({ id: 'corto', nivel: 'baja', detalle: String(t.length) });
  if (t.length > POST_REGLAS.max) h.push({ id: 'largo', nivel: 'media', detalle: String(t.length) });
  if (primera.length > POST_REGLAS.gancho) h.push({ id: 'gancho', nivel: 'media', detalle: String(primera.length) });
  if (/\?\s*$/.test(primera.trim())) h.push({ id: 'ganchoPregunta', nivel: 'media', detalle: '' });
  if (!/\d/.test(t)) h.push({ id: 'sinCifra', nivel: 'baja', detalle: '' });
  const tags = (t.match(/#(?=[\p{L}_])[\p{L}\p{N}_]+/gu) || []).length;
  if (tags > POST_REGLAS.hashtags) h.push({ id: 'hashtags', nivel: 'baja', detalle: String(tags) });
  if (/https?:\/\//.test(t)) h.push({ id: 'enlace', nivel: 'baja', detalle: '' });
  for (const r of A.relleno) if (f.includes(r)) h.push({ id: 'relleno', nivel: 'media', detalle: r });
  for (const r of A.cebo) if (f.includes(r)) h.push({ id: 'cebo', nivel: 'alta', detalle: r });
  if (/\[[^\]]+\]/.test(t)) h.push({ id: 'huecos', nivel: 'alta', detalle: String((t.match(/\[[^\]]+\]/g) || []).length) });
  const veredicto = h.some(x => x.nivel === 'alta') ? 'rehacer' : h.some(x => x.nivel === 'media') ? 'revisar' : 'ok';
  return { hallazgos: h, veredicto, caracteres: t.length, palabras: wordCount(t) };
}

/** Fechas de publicación cada «cadencia» días desde «inicio», una por nota. Devuelve [{ fecha, notaId, n }]. */
export function planContenido({ inicio, cadencia = 14, notas = [] }) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(inicio || ''))) return [];
  const [a, m, d] = inicio.split('-').map(Number);
  return notas.map((id, i) => ({ fecha: new Date(Date.UTC(a, m - 1, d + i * Math.max(1, cadencia))).toISOString().slice(0, 10), notaId: id, n: i + 1 }));
}

function icsTexto(s) {
  return String(s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');
}
/** Pliega una línea iCalendar a 75 octetos (RFC 5545, 3.1). */
function icsPliega(linea) {
  const bytes = new TextEncoder();
  const out = [];
  let actual = '';
  for (const ch of linea) {
    if (bytes.encode(actual + ch).length > (out.length ? 74 : 75)) { out.push(actual); actual = ch; } else actual += ch;
  }
  out.push(actual);
  return out.join('\r\n ');
}
/** Calendario .ics (RFC 5545) con un evento de día completo por publicación. eventos: [{ fecha, titulo, detalle }]. */
export function icsPlan(eventos, { nombre = 'Field Notes', sello = '20260101T000000Z' } = {}) {
  const l = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Astrolabio//Field Notes//ES', 'CALSCALE:GREGORIAN', 'X-WR-CALNAME:' + icsTexto(nombre)];
  for (const e of eventos) {
    const d = e.fecha.replace(/-/g, '');
    const fin = new Date(Date.UTC(+e.fecha.slice(0, 4), +e.fecha.slice(5, 7) - 1, +e.fecha.slice(8, 10) + 1)).toISOString().slice(0, 10).replace(/-/g, '');
    l.push('BEGIN:VEVENT', `UID:astrolabio-${d}-${(e.id || e.titulo || '').replace(/[^a-z0-9]/gi, '').slice(0, 24) || 'post'}@astrolabio.local`, 'DTSTAMP:' + sello,
      'DTSTART;VALUE=DATE:' + d, 'DTEND;VALUE=DATE:' + fin, 'SUMMARY:' + icsTexto(e.titulo), 'DESCRIPTION:' + icsTexto(e.detalle || ''), 'TRANSP:TRANSPARENT', 'END:VEVENT');
  }
  l.push('END:VCALENDAR');
  return l.map(icsPliega).join('\r\n') + '\r\n';
}

/** Notas del Baúl que dan para un post (con contenido suficiente), en el orden del plan. */
export function notasPublicables(baul) {
  return baul.filter(n => ['herramienta', 'concepto', 'proyecto', 'certificacion', 'idea'].includes(n.tipo) && Object.values(n.campos).join(' ').trim().split(/\s+/).length >= 12);
}
