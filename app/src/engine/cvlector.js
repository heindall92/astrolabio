// Del texto de un CV a datos para preparar la entrevista: secciones, experiencia con fechas, años,
// puesto actual, tecnologías, certificaciones y logros con cifra. Reglas locales y explicables, sin IA.
import { analyzeOffer, foldSameLength, vacFind } from './vacante.js';
import { VAC_TECNOLOGIAS } from '../content/vacante.js';

/** Títulos de sección de un CV, en español y en inglés (sin tildes y en minúsculas). */
export const CV_SECCIONES = {
  perfil: ['perfil', 'perfil profesional', 'resumen', 'resumen profesional', 'sobre mi', 'acerca de mi', 'extracto', 'objetivo', 'objetivo profesional', 'summary', 'profile', 'about me', 'professional summary', 'objective', 'about'],
  experiencia: ['experiencia', 'experiencia profesional', 'experiencia laboral', 'trayectoria', 'trayectoria profesional', 'historial laboral', 'experience', 'work experience', 'professional experience', 'employment', 'employment history', 'work history'],
  formacion: ['formacion', 'formacion academica', 'educacion', 'estudios', 'formacion complementaria', 'education', 'academic background', 'training'],
  certificaciones: ['certificaciones', 'certificados', 'certificaciones y cursos', 'cursos', 'licencias y certificaciones', 'certifications', 'certificates', 'licenses & certifications', 'licenses and certifications', 'courses'],
  proyectos: ['proyectos', 'proyectos personales', 'laboratorios', 'portfolio', 'portafolio', 'projects', 'personal projects', 'labs'],
  habilidades: ['habilidades', 'competencias', 'competencias tecnicas', 'conocimientos', 'conocimientos tecnicos', 'aptitudes', 'tecnologias', 'herramientas', 'stack', 'skills', 'technical skills', 'core skills', 'tools', 'technologies'],
  idiomas: ['idiomas', 'languages'],
  otros: ['voluntariado', 'intereses', 'aficiones', 'premios', 'logros', 'publicaciones', 'referencias', 'volunteering', 'interests', 'awards', 'achievements', 'publications', 'references', 'hobbies'],
};

const MESES = {
  ene: 1, enero: 1, jan: 1, january: 1, feb: 2, febrero: 2, february: 2, mar: 3, marzo: 3, march: 3, abr: 4, abril: 4, apr: 4, april: 4,
  may: 5, mayo: 5, jun: 6, junio: 6, june: 6, jul: 7, julio: 7, july: 7, ago: 8, agosto: 8, aug: 8, august: 8,
  sep: 9, sept: 9, septiembre: 9, setiembre: 9, september: 9, oct: 10, octubre: 10, october: 10, nov: 11, noviembre: 11, november: 11,
  dic: 12, diciembre: 12, dec: 12, december: 12,
};
const MES_RE = Object.keys(MESES).sort((a, b) => b.length - a.length).join('|');
const FECHA_RE = `(?:(?:(\\d{1,2})[/.-])|(?:(${MES_RE})\\.?\\s+(?:de\\s+)?))?((?:19|20)\\d{2})`;
const HOY_RE = 'actualidad|actual|presente|hoy|la fecha|present|current|now|today';
/** Rango de fechas: «03/2024 – actualidad», «Jan 2023 - Present», «2020 - 2022». */
export const RANGO_RE = new RegExp(`${FECHA_RE}\\s*(?:[-–—]|a|al|hasta|to|until)\\s*(?:${FECHA_RE}|(${HOY_RE}))`, 'i');

/** Mes ISO (AAAA-MM) de una fecha del rango; sin mes, enero para el inicio y diciembre para el final. */
function mesIso(mesNum, mesNombre, anio, esFin) {
  const m = mesNum ? Number(mesNum) : mesNombre ? MESES[foldSameLength(mesNombre)] : esFin ? 12 : 1;
  return `${anio}-${String(Math.min(12, Math.max(1, m || 1))).padStart(2, '0')}`;
}
function mesesEntre(desde, hasta) {
  const [a1, m1] = desde.split('-').map(Number), [a2, m2] = hasta.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1) + 1;
}

/** Lee un rango de fechas de una línea. hoy: 'AAAA-MM' para «actualidad». */
export function leerRango(linea, hoy) {
  const m = RANGO_RE.exec(foldSameLength(linea));
  if (!m) return null;
  const desde = mesIso(m[1], m[2], m[3], false);
  const actual = !!m[7];
  const hasta = actual ? hoy : mesIso(m[4], m[5], m[6], true);
  if (hasta < desde) return null;
  // Sin mes (solo el año) en alguno de los extremos: el formulario de un ATS y LinkedIn lo pedirán y conviene que coincidan.
  const sinMes = !(m[1] || m[2]) || (!actual && !(m[4] || m[5]));
  return { desde, hasta, actual, sinMes, meses: mesesEntre(desde, hasta), texto: linea.slice(m.index, m.index + m[0].length) };
}

/** Meses distintos cubiertos por varios periodos (los solapes no cuentan dos veces). */
export function mesesTotales(periodos) {
  const meses = new Set();
  for (const p of periodos) {
    let [a, m] = p.desde.split('-').map(Number);
    const fin = p.hasta;
    for (let k = 0; k < 600; k++) {
      const iso = `${a}-${String(m).padStart(2, '0')}`;
      if (iso > fin) break;
      meses.add(iso);
      m++; if (m > 12) { m = 1; a++; }
    }
  }
  return meses.size;
}

const VINETA = /^\s*(?:[•●▪■◦‣∙·*–—-]|\d{1,2}[.)])\s+/;
function limpiaLinea(l) { return l.replace(VINETA, '').replace(/\s+/g, ' ').trim(); }
function seccionDe(linea) {
  const f = foldSameLength(linea).replace(/[:|]+\s*$/, '').replace(/\s+/g, ' ').trim();
  if (!f || f.length > 40 || /[.,;]$/.test(f)) return null;
  for (const [id, titulos] of Object.entries(CV_SECCIONES)) if (titulos.includes(f)) return id;
  return null;
}

const STOP_ES = ['de', 'la', 'que', 'el', 'en', 'los', 'del', 'las', 'por', 'con', 'una', 'para', 'y'];
const STOP_EN = ['the', 'and', 'of', 'to', 'in', 'for', 'with', 'on', 'at', 'by', 'from', 'as'];
function idiomaCv(texto) {
  const w = foldSameLength(texto).match(/\p{L}+/gu) || [];
  let es = 0, en = 0;
  for (const x of w) { if (STOP_ES.includes(x)) es++; if (STOP_EN.includes(x)) en++; }
  return en > es ? 'en' : 'es';
}

/** Parte la cabecera de una experiencia en puesto y empresa: «Puesto · Empresa», «Puesto en Empresa», «Role at Company». */
function puestoEmpresa(cabecera) {
  const sinFecha = cabecera.replace(/\(\s*\)|\s*[·|,–—-]\s*$/g, '').trim();
  const partes = sinFecha.split(/\s+[·|•–—]\s+|\s+-\s+|\s*\|\s*/).map(s => s.replace(/^[·|,\s]+|[·|,\s]+$/g, '').trim()).filter(Boolean);
  if (partes.length >= 2) return { puesto: partes[0], empresa: partes[1] };
  const m = /^(.+?)\s+(?:en|at|@)\s+(.+)$/i.exec(sinFecha);
  if (m) return { puesto: m[1].trim(), empresa: m[2].trim() };
  const c = sinFecha.split(/\s*,\s*/);
  return c.length >= 2 ? { puesto: c[0], empresa: c[1] } : { puesto: sinFecha, empresa: '' };
}

const CV_EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/;
const CV_TELEFONO = /(?:\+\d{1,3}[\s.-]?)?(?:\d[\s.-]?){9,12}\b/;

/**
 * Une las frases que el PDF partió en dos líneas por el ajuste del margen: la siguiente empieza en minúscula,
 * la anterior no termina en punto y ninguna es viñeta, título de sección ni rango de fechas.
 */
export function unirPartidas(lineas) {
  const out = [];
  for (const l of lineas) {
    const prev = out[out.length - 1];
    const t = l.trim();
    if (prev && prev.trim() && t && /^\p{Ll}/u.test(t) && !VINETA.test(l) && !/[.:;!?]$/.test(prev.trim()) && !seccionDe(prev) && !RANGO_RE.test(foldSameLength(t))) {
      out[out.length - 1] = prev.replace(/\s+$/, '') + ' ' + t;
    } else out.push(l);
  }
  return out;
}

/** Nivel de un idioma en el CV («Inglés B2», «English C1», «inglés nativo»). null si no lo dice. */
export function nivelIdiomaCV(lineasIdiomas, idioma) {
  const nombres = { ingles: ['ingles', 'english'], frances: ['frances', 'french'], aleman: ['aleman', 'german'], portugues: ['portugues', 'portuguese'] }[idioma] || [idioma];
  for (const l of lineasIdiomas) {
    for (const trozo of foldSameLength(l).split(/[·|,;]/)) {
      if (!nombres.some(n => trozo.includes(n))) continue;
      const m = /\b([abc][12])\b/.exec(trozo);
      if (m) return m[1].toUpperCase();
      if (/nativ|native|bilingue|bilingual/.test(trozo)) return 'C2';
      if (/fluid|fluent|avanzad|advanced/.test(trozo)) return 'C1';
      if (/intermedi/.test(trozo)) return 'B1';
      return '';
    }
  }
  return null;
}

/**
 * Analiza el texto de un CV. Devuelve:
 * { idioma, nombre, titular, secciones, experiencias, meses, anos, actual, tecnologias, certificaciones,
 *   logros, competencias, idiomas, resumen, contacto }.
 * hoy: 'AAAA-MM' (para «actualidad»; se inyecta para que las pruebas no dependan de la fecha).
 */
export function leerCV(texto, hoy) {
  const lineas = unirPartidas(String(texto || '').split('\n').map(l => l.replace(/\s+$/, '')));
  const idioma = idiomaCv(texto);
  // Secciones
  const secciones = { cabecera: [] };
  let actual = 'cabecera';
  for (const l of lineas) {
    if (!l.trim()) continue;
    const s = seccionDe(l);
    if (s) { actual = s; secciones[s] = secciones[s] || []; continue; }
    (secciones[actual] = secciones[actual] || []).push(l);
  }
  // Nombre y titular: primeras líneas de la cabecera.
  const cab = secciones.cabecera.map(limpiaLinea).filter(Boolean);
  const pareceNombre = l => l.length <= 60 && !/\d|@|https?:/.test(l) && l.split(/\s+/).length >= 2 && l.split(/\s+/).length <= 5 && !RANGO_RE.test(l);
  const nombre = cab[0] && pareceNombre(cab[0]) ? cab[0] : '';
  const titularBruto = cab.find(l => l !== nombre && !CV_EMAIL.test(l.split(/[·|]/)[0])) || '';
  const titular = titularBruto.split(/\s+[·|•]\s+|\s*\|\s*/)[0].trim().slice(0, 120);
  // Experiencias: cada línea con un rango de fechas abre una; lo que sigue son sus logros.
  const experiencias = [];
  const fuenteExp = secciones.experiencia || (secciones.experiencia === undefined ? lineas.filter(l => l.trim()) : []);
  let exp = null;
  fuenteExp.forEach((l, i) => {
    const r = leerRango(l, hoy);
    if (r) {
      let cabecera = l.replace(r.texto, '').replace(/\(\s*\)/g, ' ');
      if (!limpiaLinea(cabecera).replace(/[·|,–—-]/g, '').trim() && i > 0) cabecera = fuenteExp[i - 1];
      const pe = puestoEmpresa(limpiaLinea(cabecera));
      exp = { ...pe, desde: r.desde, hasta: r.hasta, actual: r.actual, sinMes: r.sinMes, meses: r.meses, logros: [] };
      experiencias.push(exp);
    } else if (exp && VINETA.test(l)) {
      exp.logros.push(limpiaLinea(l));
    } else if (exp && exp.logros.length && /^\s+/.test(l)) {
      exp.logros[exp.logros.length - 1] += ' ' + l.trim();
    } else if (exp) {
      // Sin viñeta (PDF de navegador): es un logro salvo que sea la cabecera de la siguiente experiencia.
      const sig = fuenteExp[i + 1] || '';
      const rs = leerRango(sig, hoy);
      const sigSoloFecha = rs && !limpiaLinea(sig.replace(rs.texto, '')).replace(/[·|,()–—-]/g, '').trim();
      const limpia = limpiaLinea(l);
      if (!sigSoloFecha && limpia.split(/\s+/).length >= 4) exp.logros.push(limpia);
    }
  });
  // Si el CV no tiene sección de experiencia reconocible, las fechas sueltas de formación no cuentan.
  const laborales = secciones.experiencia ? experiencias : [];
  const meses = mesesTotales(laborales);
  const actualExp = laborales.find(e => e.actual) || laborales.slice().sort((a, b) => (b.hasta > a.hasta ? 1 : -1))[0] || null;
  // Tecnologías y competencias con el mismo léxico que el lector de ofertas.
  const analisis = analyzeOffer(texto);
  const certSec = (secciones.certificaciones || []).map(limpiaLinea).filter(Boolean).map(l => l.replace(/\s*[·|,–—-]\s*(?:19|20)\d{2}\s*$/, '').trim());
  const certLex = VAC_TECNOLOGIAS.slice(VAC_TECNOLOGIAS.findIndex(x => x[0] === 'OSCP')).filter(([, ...v]) => v.some(t => vacFind(foldSameLength(texto), t).length)).map(x => x[0]);
  const certificaciones = [...certSec];
  for (const c of certLex) if (!certificaciones.some(x => foldSameLength(x).includes(foldSameLength(c)))) certificaciones.push(c);
  // Logros: frases con cifra de la experiencia y los proyectos (lo que más convence en una entrevista).
  const candidatos = [...laborales.flatMap(e => e.logros), ...(secciones.proyectos || []).map(limpiaLinea)];
  const logros = candidatos.filter(l => /\d/.test(l) && l.split(/\s+/).length >= 4 && !RANGO_RE.test(l) && !CV_EMAIL.test(l))
    .map((l, i) => ({ l, i, p: (/%|€|\$/.test(l) ? 2 : 0) + (/reduj|aument|ahorr|mejor|automatic|cut|reduc|increas|sav|improv|automat/i.test(l) ? 2 : 0) }))
    .sort((a, b) => b.p - a.p || a.i - b.i).map(x => x.l).slice(0, 8);
  const resumen = (secciones.perfil || []).map(limpiaLinea).join(' ').trim();
  return {
    idioma,
    nombre,
    titular,
    secciones: Object.fromEntries(Object.entries(secciones).filter(([k]) => k !== 'cabecera').map(([k, v]) => [k, v.map(limpiaLinea).filter(Boolean)])),
    experiencias: laborales,
    meses,
    anos: Math.floor(meses / 12),
    actual: actualExp,
    tecnologias: analisis.tecnologias,
    certificaciones: certificaciones.slice(0, 15),
    logros,
    competencias: analisis.competencias.map(c => c.id),
    idiomas: (secciones.idiomas || []).map(limpiaLinea).filter(Boolean).slice(0, 6),
    resumen: resumen.slice(0, 600),
    contacto: { email: CV_EMAIL.test(texto), telefono: CV_TELEFONO.test(cab.join(' ')) },
  };
}
