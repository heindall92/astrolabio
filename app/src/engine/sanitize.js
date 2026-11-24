// Carga segura de datos: safeParse descarta claves peligrosas y sanitize reconstruye campo a campo.
import { LIMITES, ROLES, NIVELES, EMPRESAS, IDIOMAS, TIPOS } from './constants.js';
import { BAUL_TIPOS, BAUL_CATEGORIAS, BAUL_NIVELES } from '../content/baul.js';
import { ENTREVISTADORES, FORMATOS } from '../content/guion.js';
import { sanitizeCandidaturas } from './candidaturas.js';

const PELIGROSAS = new Set(['__proto__', 'constructor', 'prototype']);

export function safeParse(text) {
  try {
    return JSON.parse(String(text), (k, v) => (PELIGROSAS.has(k) ? undefined : v));
  } catch {
    return null;
  }
}

function str(v, max) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
function oneOf(v, list, def) {
  return list.includes(v) ? v : def;
}
function int(v, lo, hi, def = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(lo, Math.min(hi, Math.round(n))) : def;
}
const FECHA = /^\d{4}-\d{2}-\d{2}$/;
function date(v) {
  return typeof v === 'string' && FECHA.test(v) ? v : '';
}
const ID = /^[a-z0-9_-]{1,40}$/i;

export function emptyState() {
  return {
    version: 1,
    perfil: null,
    historias: [],
    duelos: [],
    xp: 0,
    racha: 0,
    ultimoDia: '',
    insignias: [],
    historialXp: {},
    historialMedia: {},
    ajustes: { sensibles: [] },
    presentacion: { texto: '', puesto: '' },
    vacante: null,
    baul: [],
    marca: { ventaja: '', puntoVista: '', frase: '', hilo: '' },
    entrevista: null,
    candidaturas: [],
    contenido: { inicio: '', cadencia: 14, plan: [], borradores: {}, publicados: [] },
  };
}

/** Respuestas de apoyo de «Preparar entrevista» (texto) y cifras del salario. */
export const RESPUESTAS = ['motivoEmpresa', 'motivoPuesto', 'logro', 'salida', 'duda', 'dudaRespuesta', 'hueco', 'defecto', 'futuro', 'cambio', 'disponibilidad', 'condiciones'];

/** Una nota del Baúl: solo los campos de su tipo, con su longitud máxima. */
export function sanitizeNota(n) {
  if (!n || typeof n !== 'object') return null;
  const id = typeof n.id === 'string' && ID.test(n.id) && !PELIGROSAS.has(n.id) ? n.id : null;
  const tipo = BAUL_TIPOS.find(x => x.id === n.tipo);
  if (!id || !tipo) return null;
  const src = n.campos && typeof n.campos === 'object' ? n.campos : {};
  const campos = {};
  for (const [k, control, max] of tipo.campos) {
    let v = str(src[k], max);
    if (control === 'categoria') v = BAUL_CATEGORIAS.some(c => c[0] === v) ? v : '';
    if (control === 'nivel') v = BAUL_NIVELES.includes(v) ? v : '';
    campos[k] = v;
  }
  if (!campos[tipo.campos[0][0]].trim()) return null;
  return { id, tipo: tipo.id, campos, creada: date(n.creada), editada: date(n.editada) };
}

export function sanitizeMarca(m) {
  const o = m && typeof m === 'object' ? m : {};
  return { ventaja: str(o.ventaja, LIMITES.marca), puntoVista: str(o.puntoVista, LIMITES.marca), frase: str(o.frase, LIMITES.marca), hilo: str(o.hilo, LIMITES.marca) };
}

/** Plan de contenido: fecha de inicio, cadencia (7–60 días), notas del Baúl en orden, borradores editados y publicadas. */
export function sanitizeContenido(c, idsNotas) {
  const o = c && typeof c === 'object' && !Array.isArray(c) ? c : {};
  const ids = v => (Array.isArray(v) ? [...new Set(v.filter(x => typeof x === 'string' && idsNotas.has(x)))].slice(0, LIMITES.notas) : []);
  const borradores = {};
  if (o.borradores && typeof o.borradores === 'object') for (const k of Object.keys(o.borradores)) if (idsNotas.has(k) && typeof o.borradores[k] === 'string') borradores[k] = o.borradores[k].slice(0, 3000);
  return { inicio: date(o.inicio), cadencia: int(o.cadencia, 7, 60, 14), plan: ids(o.plan), borradores, publicados: ids(o.publicados) };
}

export function sanitizeEntrevista(e) {
  if (!e || typeof e !== 'object' || Array.isArray(e)) return null;
  const resp = {};
  const r = e.resp && typeof e.resp === 'object' ? e.resp : {};
  for (const k of RESPUESTAS) resp[k] = str(r[k], LIMITES.respuesta);
  resp.salarioMin = int(r.salarioMin, 0, LIMITES.salario);
  resp.salarioObjetivo = int(r.salarioObjetivo, 0, LIMITES.salario);
  resp.salarioAncla = int(r.salarioAncla, 0, LIMITES.salario);
  resp.salarioUnidad = oneOf(r.salarioUnidad, ['anual', 'mensual'], 'anual');
  resp.salarioPagas = [12, 13, 14].includes(Number(r.salarioPagas)) ? Number(r.salarioPagas) : 14;
  const ediciones = {};
  if (e.ediciones && typeof e.ediciones === 'object') {
    for (const k of Object.keys(e.ediciones).slice(0, LIMITES.ediciones)) {
      if (/^[a-z0-9_-]{1,80}$/i.test(k) && !PELIGROSAS.has(k) && typeof e.ediciones[k] === 'string') ediciones[k] = e.ediciones[k].slice(0, LIMITES.edicion);
    }
  }
  return {
    empresa: str(e.empresa, LIMITES.puesto),
    puesto: str(e.puesto, LIMITES.puesto),
    fecha: date(e.fecha),
    formato: oneOf(e.formato, FORMATOS, 'video'),
    entrevistadores: Array.isArray(e.entrevistadores) ? [...new Set(e.entrevistadores.filter(x => ENTREVISTADORES.includes(x)))] : [],
    idioma: oneOf(e.idioma, IDIOMAS, 'es'),
    pais: oneOf(e.pais, ['es', 'otro'], 'es'),
    oferta: str(e.oferta, LIMITES.oferta),
    cv: str(e.cv, LIMITES.cv),
    cvArchivo: str(e.cvArchivo, LIMITES.puesto),
    resp,
    ediciones,
  };
}

export function sanitizeStory(h, competenciasValidas) {
  if (!h || typeof h !== 'object') return null;
  const id = typeof h.id === 'string' && ID.test(h.id) && !PELIGROSAS.has(h.id) ? h.id : null;
  if (!id) return null;
  const comps = Array.isArray(h.competencias) ? h.competencias.filter(c => typeof c === 'string' && (!competenciasValidas || competenciasValidas.includes(c))) : [];
  return {
    id,
    titulo: str(h.titulo, LIMITES.titulo),
    tipo: oneOf(h.tipo, TIPOS, 'real'),
    s: str(h.s, LIMITES.bloque),
    t: str(h.t, LIMITES.bloque),
    a: str(h.a, LIMITES.bloque),
    r: str(h.r, LIMITES.bloque),
    l: str(h.l, LIMITES.bloque),
    competencias: [...new Set(comps)].slice(0, LIMITES.competenciasPorHistoria),
    creada: date(h.creada),
    editada: date(h.editada),
  };
}

/**
 * Suma a tus historias las que llegan de otra herramienta del ecosistema (Blue-Jr, por ejemplo).
 * Nunca sustituye: si ya tienes una historia con el mismo id, se queda la tuya, porque puedes haberla editado.
 */
export function mergeStories(actuales, entrantes, competenciasValidas) {
  const historias = (Array.isArray(actuales) ? actuales : []).slice();
  const ids = new Set(historias.map(h => h.id));
  let nuevas = 0, repetidas = 0, descartadas = 0;
  for (const raw of (Array.isArray(entrantes) ? entrantes : []).slice(0, LIMITES.historias)) {
    const s = sanitizeStory(raw, competenciasValidas);
    if (!s) { descartadas++; continue; }
    if (ids.has(s.id)) { repetidas++; continue; }
    if (historias.length >= LIMITES.historias) { descartadas++; continue; }
    ids.add(s.id);
    historias.push(s);
    nuevas++;
  }
  return { historias, nuevas, repetidas, descartadas };
}

export function sanitizePerfil(p) {
  if (!p || typeof p !== 'object') return null;
  if (!ROLES.includes(p.rol)) return null;
  return {
    nombre: str(p.nombre, LIMITES.nombre),
    rol: p.rol,
    nivel: oneOf(p.nivel, NIVELES, 'junior'),
    empresa: oneOf(p.empresa, EMPRESAS, 'consultora'),
    idioma: oneOf(p.idioma, IDIOMAS, 'es'),
  };
}

export function sanitizeState(raw, { competencias } = {}) {
  const out = emptyState();
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return out;
  out.perfil = sanitizePerfil(raw.perfil);
  const ids = new Set();
  if (Array.isArray(raw.historias)) {
    for (const h of raw.historias.slice(0, LIMITES.historias)) {
      const s = sanitizeStory(h, competencias);
      if (s && !ids.has(s.id)) { ids.add(s.id); out.historias.push(s); }
    }
  }
  if (Array.isArray(raw.duelos)) {
    for (const d of raw.duelos.slice(-LIMITES.duelos)) {
      if (!d || typeof d !== 'object') continue;
      out.duelos.push({
        fecha: date(d.fecha),
        recruiter: str(d.recruiter, 40),
        ruta: oneOf(d.ruta, ROLES, 'red'),
        conviccion: int(d.conviccion, 0, 100),
        superado: d.superado === true,
        modo: str(d.modo, 20),
        ingles: d.ingles === true,
      });
    }
  }
  out.xp = int(raw.xp, 0, 10_000_000);
  out.racha = int(raw.racha, 0, 100_000);
  out.ultimoDia = date(raw.ultimoDia);
  out.insignias = Array.isArray(raw.insignias) ? [...new Set(raw.insignias.filter(i => typeof i === 'string' && ID.test(i)))].slice(0, LIMITES.insignias) : [];
  if (raw.historialXp && typeof raw.historialXp === 'object' && !Array.isArray(raw.historialXp)) {
    const keys = Object.keys(raw.historialXp).filter(k => FECHA.test(k)).sort().slice(-LIMITES.diasHistorial);
    for (const k of keys) out.historialXp[k] = int(raw.historialXp[k], 0, 1_000_000);
  }
  if (raw.historialMedia && typeof raw.historialMedia === 'object' && !Array.isArray(raw.historialMedia)) {
    const keys = Object.keys(raw.historialMedia).filter(k => FECHA.test(k)).sort().slice(-LIMITES.diasHistorial);
    for (const k of keys) out.historialMedia[k] = int(raw.historialMedia[k], 0, 100);
  }
  if (raw.ajustes && typeof raw.ajustes === 'object' && Array.isArray(raw.ajustes.sensibles)) {
    out.ajustes.sensibles = raw.ajustes.sensibles.filter(s => typeof s === 'string').map(s => s.slice(0, LIMITES.sensible)).slice(0, LIMITES.sensibles);
  }
  if (raw.presentacion && typeof raw.presentacion === 'object') {
    out.presentacion = { texto: str(raw.presentacion.texto, LIMITES.presentacion), puesto: str(raw.presentacion.puesto, LIMITES.puesto) };
  }
  if (Array.isArray(raw.baul)) {
    const vistos = new Set();
    for (const n of raw.baul.slice(0, LIMITES.notas)) {
      const c = sanitizeNota(n);
      if (c && !vistos.has(c.id)) { vistos.add(c.id); out.baul.push(c); }
    }
  }
  out.marca = sanitizeMarca(raw.marca);
  out.entrevista = sanitizeEntrevista(raw.entrevista);
  out.candidaturas = sanitizeCandidaturas(raw.candidaturas, date(raw.ultimoDia) || '2026-01-01');
  out.contenido = sanitizeContenido(raw.contenido, new Set(out.baul.map(n => n.id)));
  // La oferta solo está aquí si la persona pidió recordarla.
  if (raw.vacante && typeof raw.vacante === 'object' && typeof raw.vacante.texto === 'string' && raw.vacante.texto.trim()) {
    out.vacante = { texto: str(raw.vacante.texto, LIMITES.oferta), cv: str(raw.vacante.cv, LIMITES.cv), fecha: date(raw.vacante.fecha) };
  }
  return out;
}
