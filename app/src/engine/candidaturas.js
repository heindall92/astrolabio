// Candidaturas: cada oferta a la que te presentas, con su estado, su próximo paso y su seguimiento.
// El modelo es el mismo que el de ai-job-search-es (formato «ajs-candidaturas», versión 1), del mismo autor, para que
// las candidaturas vayan y vuelvan entre las dos herramientas sin perder nada. Todo local; funciones puras.

export const CAND = {
  estados: ['guardada', 'pendiente', 'enviada', 'proceso', 'entrevista', 'oferta', 'rechazada', 'retirada', 'sin-respuesta'],
  cerrados: ['rechazada', 'retirada', 'sin-respuesta'],
  prioridades: ['baja', 'media', 'alta'],
  modalidades: ['sin', 'presencial', 'hibrida', 'remota'],
  vias: ['sin', 'web', 'correo', 'linkedin', 'indeed', 'infojobs', 'portal', 'contacto', 'otro'],
  formato: 'ajs-candidaturas',
  version: 1,
  max: 5000,
  texto: 200,
  notas: 10000,
  enlace: 2048,
  /** Días tras enviar una candidatura sin respuesta para proponer un seguimiento. */
  seguimientoDias: 7,
};

const FECHA_C = /^\d{4}-\d{2}-\d{2}$/;
const MARCA_C = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})$/;
const ID_C = /^[A-Za-z0-9_-]{1,64}$/;
function esFechaC(s) {
  if (typeof s !== 'string' || !FECHA_C.test(s)) return false;
  const [a, m, d] = s.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d));
  return f.getUTCFullYear() === a && f.getUTCMonth() === m - 1 && f.getUTCDate() === d;
}
const esMarcaC = s => typeof s === 'string' && esFechaC(s.slice(0, 10)) && (s.length === 10 || (MARCA_C.test(s) && !Number.isNaN(Date.parse(s))));
const tiempoC = s => (s.length === 10 ? Date.UTC(...s.split('-').map((n, i) => Number(n) - (i === 1 ? 1 : 0))) : Date.parse(s));
const txtC = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const unoC = (v, lista, def) => (lista.includes(v) ? v : def);

/** Enlace de la oferta: añade https:// si falta y solo admite http(s). null si no es un enlace web válido. */
export function normalizarEnlace(entrada) {
  const s = String(entrada || '').trim();
  if (!s) return '';
  const conEsquema = /^[a-z][a-z0-9+.-]*:/i.test(s) ? s : 'https://' + s.replace(/^\/+/, '');
  try {
    const u = new URL(conEsquema);
    if (u.protocol !== 'https:' && u.protocol !== 'http:') return null;
    if (!u.hostname || (!u.hostname.includes('.') && u.hostname !== 'localhost')) return null;
    return u.href.length > CAND.enlace ? null : u.href;
  } catch {
    return null;
  }
}

/** Candidatura saneada campo a campo (mismos campos que ai-job-search-es). null si no tiene id válido ni empresa o puesto. */
export function sanitizeCandidatura(x, hoy) {
  if (!x || typeof x !== 'object' || Array.isArray(x)) return null;
  const id = typeof x.id === 'string' && ID_C.test(x.id) && !['__proto__', 'constructor', 'prototype'].includes(x.id) ? x.id : null;
  const empresa = txtC(x.empresa, CAND.texto).trim(), puesto = txtC(x.puesto, CAND.texto).trim();
  if (!id || (!empresa && !puesto)) return null;
  const enlace = normalizarEnlace(txtC(x.enlace, CAND.enlace));
  const fecha = v => (esFechaC(v) ? v : '');
  return {
    id, empresa, puesto,
    enlace: enlace || '',
    ubicacion: txtC(x.ubicacion, CAND.texto),
    modalidad: unoC(x.modalidad, CAND.modalidades, 'sin'),
    salario: txtC(x.salario, CAND.texto),
    fechaPublicacion: fecha(x.fechaPublicacion),
    estado: unoC(x.estado, CAND.estados, 'guardada'),
    prioridad: unoC(x.prioridad, CAND.prioridades, 'media'),
    fechaSolicitud: fecha(x.fechaSolicitud),
    via: unoC(x.via, CAND.vias, 'sin'),
    proximaAccion: txtC(x.proximaAccion, CAND.texto),
    fechaSeguimiento: fecha(x.fechaSeguimiento),
    notas: txtC(x.notas, CAND.notas),
    ofertaId: txtC(x.ofertaId, CAND.texto),
    creada: esMarcaC(x.creada) ? x.creada : hoy,
    actualizada: esMarcaC(x.actualizada) ? x.actualizada : hoy,
  };
}

/** Lista saneada, sin ids repetidos y con el tope de candidaturas. */
export function sanitizeCandidaturas(lista, hoy) {
  const out = [], vistos = new Set();
  for (const x of (Array.isArray(lista) ? lista : []).slice(0, CAND.max)) {
    const c = sanitizeCandidatura(x, hoy);
    if (c && !vistos.has(c.id)) { vistos.add(c.id); out.push(c); }
  }
  return out;
}

/**
 * Lee una copia de candidaturas de ai-job-search-es (o una lista suelta). Lanza un Error con código
 * 'formato' (otro formato), 'version' (más nueva) o 'vacia'.
 */
export function leerCopiaCandidaturas(datos, hoy) {
  const lista = Array.isArray(datos) ? datos : datos && typeof datos === 'object' && Array.isArray(datos.candidaturas) ? datos.candidaturas : null;
  const err = codigo => Object.assign(new Error(codigo), { codigo });
  if (!lista) throw err('formato');
  if (!Array.isArray(datos) && datos.formato !== undefined && datos.formato !== CAND.formato) throw err('formato');
  if (!Array.isArray(datos) && typeof datos.version === 'number' && datos.version > CAND.version) throw err('version');
  const limpias = sanitizeCandidaturas(lista, hoy);
  if (!limpias.length) throw err('vacia');
  return limpias;
}

/** Copia en el formato de ai-job-search-es, para llevar las candidaturas de vuelta. */
export function exportarCandidaturas(lista, hoy) {
  return { formato: CAND.formato, version: CAND.version, exportada: hoy, candidaturas: lista };
}

/** Une dos listas: añade las que faltan y, si están en las dos, gana la actualizada más reciente. Nunca borra. */
export function fusionarCandidaturas(actual, nuevas) {
  const lista = actual.slice();
  let anadidas = 0, actualizadas = 0;
  for (const n of nuevas) {
    const i = lista.findIndex(c => c.id === n.id);
    if (i < 0) { if (lista.length < CAND.max) { lista.push(n); anadidas++; } }
    else if (tiempoC(n.actualizada) > tiempoC(lista[i].actualizada)) { lista[i] = n; actualizadas++; }
  }
  return { lista, anadidas, actualizadas };
}

function sumarDiasC(fecha, dias) {
  const [a, m, d] = fecha.split('-').map(Number);
  const f = new Date(Date.UTC(a, m - 1, d + dias));
  return f.toISOString().slice(0, 10);
}

/**
 * Lo que toca hoy: seguimientos con fecha vencida y candidaturas enviadas hace una semana o más sin seguimiento
 * puesto. Excluye los procesos cerrados. Devuelve [{ c, motivo: 'vencido' | 'sinRespuesta', dias }].
 */
export function pendientesCandidaturas(lista, hoy) {
  const out = [];
  for (const c of lista) {
    if (CAND.cerrados.includes(c.estado) || c.estado === 'oferta') continue;
    if (c.fechaSeguimiento && c.fechaSeguimiento <= hoy) out.push({ c, motivo: 'vencido', dias: Math.round((tiempoC(hoy) - tiempoC(c.fechaSeguimiento)) / 86_400_000) });
    else if (!c.fechaSeguimiento && c.estado === 'enviada' && c.fechaSolicitud && sumarDiasC(c.fechaSolicitud, CAND.seguimientoDias) <= hoy) {
      out.push({ c, motivo: 'sinRespuesta', dias: Math.round((tiempoC(hoy) - tiempoC(c.fechaSolicitud)) / 86_400_000) });
    }
  }
  return out.sort((a, b) => b.dias - a.dias);
}

/** Orden de la lista: abiertas antes que cerradas, más prioridad antes y, a igualdad, la tocada más recientemente. */
export function ordenarCandidaturas(lista) {
  const p = { alta: 0, media: 1, baja: 2 };
  return lista.slice().sort((a, b) => Number(CAND.cerrados.includes(a.estado)) - Number(CAND.cerrados.includes(b.estado)) || p[a.prioridad] - p[b.prioridad] || tiempoC(b.actualizada) - tiempoC(a.actualizada));
}

/** Recuento por estado (para el tablero). */
export function recuentoEstados(lista) {
  return Object.fromEntries(CAND.estados.map(e => [e, lista.filter(c => c.estado === e).length]));
}
