// Carga segura de datos: safeParse descarta claves peligrosas y sanitize reconstruye campo a campo.
import { LIMITES, ROLES, NIVELES, EMPRESAS, IDIOMAS, TIPOS } from './constants.js';

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
  // La oferta solo está aquí si la persona pidió recordarla.
  if (raw.vacante && typeof raw.vacante === 'object' && typeof raw.vacante.texto === 'string' && raw.vacante.texto.trim()) {
    out.vacante = { texto: str(raw.vacante.texto, LIMITES.oferta), cv: str(raw.vacante.cv, LIMITES.cv), fecha: date(raw.vacante.fecha) };
  }
  return out;
}
