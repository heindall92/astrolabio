// Progreso: XP, meta diaria, rachas, rangos, desbloqueo del jefe e insignias. Puro y probado.
import { XP, META_DIARIA, RANGOS, JEFE_DESBLOQUEO } from './constants.js';

function dayNum(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return Math.round(Date.UTC(y, m - 1, d) / 86400000);
}
/** Días entre dos fechas AAAA-MM-DD (b − a). */
export function daysBetween(a, b) { return dayNum(b) - dayNum(a); }
export function addDays(iso, n) {
  const d = new Date((dayNum(iso) + n) * 86400000);
  return d.toISOString().slice(0, 10);
}

/** Suma XP en un día y actualiza la racha. Devuelve { state, metaCumplida, rangoAntes, rangoDespues }. */
export function addXp(state, amount, day) {
  const n = Math.max(0, Math.round(amount || 0));
  const s = { ...state, historialXp: { ...state.historialXp } };
  const antes = s.historialXp[day] || 0;
  const rangoAntes = rankFor(s.xp).id;
  s.xp += n;
  s.historialXp[day] = antes + n;
  if (n > 0 && s.ultimoDia !== day) {
    s.racha = s.ultimoDia && daysBetween(s.ultimoDia, day) === 1 ? s.racha + 1 : 1;
    s.ultimoDia = day;
  }
  return { state: s, metaCumplida: antes < META_DIARIA && antes + n >= META_DIARIA, rangoAntes, rangoDespues: rankFor(s.xp).id };
}

/** Racha que se muestra hoy: se pierde si ayer no hubo actividad. */
export function currentStreak(state, day) {
  if (!state.ultimoDia) return 0;
  return daysBetween(state.ultimoDia, day) <= 1 ? state.racha : 0;
}

export function rankFor(xp) {
  let i = 0;
  for (let k = 0; k < RANGOS.length; k++) if (xp >= RANGOS[k].xp) i = k;
  const next = RANGOS[i + 1] || null;
  const progress = next ? (xp - RANGOS[i].xp) / (next.xp - RANGOS[i].xp) : 1;
  return { id: RANGOS[i].id, idx: i, next, progress: Math.max(0, Math.min(1, progress)) };
}

/** XP de guardar una historia: por escribirla y por cada estado nuevo alcanzado. */
export function storyXp(prevEstado, estado, esNueva) {
  const orden = { borrador: 0, lista: 1, brillante: 2 };
  let xp = esNueva ? XP.historia : 0;
  const p = prevEstado ? orden[prevEstado] : 0, n = orden[estado] || 0;
  if (n >= 1 && p < 1) xp += XP.lista;
  if (n >= 2 && p < 2) xp += XP.brillante;
  return xp;
}

/** XP de un duelo. */
export function duelXp(duelo, esJefe) {
  if (!duelo.superado) return XP.dueloIntento;
  return esJefe ? XP.dueloJefe : XP.duelo;
}

/** ¿Puede retar al jefe final de esta ruta? */
export function bossUnlocked(duelos, rol, jefeId = 'subeliston') {
  const ok = new Set(duelos.filter(d => d.ruta === rol && d.superado && d.recruiter !== jefeId).map(d => d.recruiter));
  return ok.size >= JEFE_DESBLOQUEO;
}
export function bossBeaten(duelos, rol, jefeId = 'subeliston') {
  return duelos.some(d => d.ruta === rol && d.superado && d.recruiter === jefeId);
}

/** Competencias cubiertas por historias que no son borrador. */
export function coveredCompetencies(historias, scores) {
  const set = new Set();
  historias.forEach((h, i) => { if (scores[i] && scores[i].estado !== 'borrador') h.competencias.forEach(c => set.add(c)); });
  return set;
}

/**
 * Insignias nuevas. defs: [{ id, check(ctx) }]. ctx = { state, scores, duel?, lang, hour, competencias }.
 * Devuelve los ids que se cumplen y aún no estaban.
 */
export function newBadges(defs, ctx) {
  const have = new Set(ctx.state.insignias);
  return defs.filter(d => !have.has(d.id) && safeCheck(d, ctx)).map(d => d.id);
}
function safeCheck(d, ctx) { try { return !!d.check(ctx); } catch { return false; } }

/** Serie de XP por día de los últimos n días (incluido hoy). */
export function xpSeries(historialXp, day, n = 14) {
  const out = [];
  for (let i = n - 1; i >= 0; i--) { const d = addDays(day, -i); out.push({ dia: d, xp: historialXp[d] || 0 }); }
  return out;
}
