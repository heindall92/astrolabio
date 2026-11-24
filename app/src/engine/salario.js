// «¿Cuáles son tus expectativas salariales?» en dos tiempos (especificación de Yoandy, 27-10-2026).
// 1) No cerrarse a una banda y preguntar la del puesto. 2) Si insisten, un rango con argumento: de X (tu objetivo,
// nunca tu mínimo) a Y (tu ancla), como mucho un 20 % de ancho, en bruto y con el número de pagas.
// Astrolabio no propone salarios: solo trabaja con las cifras que escribe la persona.
import { foldSameLength } from './vacante.js';
import { SALARIO_TXT, SALARIO_MARCAS } from '../content/guion.js';

export const SALARIO = { anchoMax: 0.2, pagas: [12, 14, 13], unidades: ['anual', 'mensual'] };

function redondear(n, unidad) {
  const paso = unidad === 'mensual' ? 50 : 500;
  return Math.round(n / paso) * paso;
}

/**
 * Rango que se dice en voz alta a partir de tus tres cifras. Devuelve { x, y, ancho, avisos }.
 * Avisos: 'sin-objetivo', 'sin-ancla', 'x-minimo' (tu X no supera tu mínimo), 'y-menor' (el ancla está por debajo
 * del objetivo) y 'ancho' (más de un 20 %: se recorta).
 */
export function prepararRango({ minimo = 0, objetivo = 0, ancla = 0, unidad = 'anual' } = {}) {
  const min = Number(minimo) || 0, x = Number(objetivo) || 0;
  let y = Number(ancla) || 0;
  const avisos = [];
  if (!x) avisos.push('sin-objetivo');
  if (x && min && x <= min) avisos.push('x-minimo');
  if (!y) avisos.push('sin-ancla');
  else if (x && y < x) { avisos.push('y-menor'); y = 0; }
  if (x && y && (y - x) / x > SALARIO.anchoMax) { avisos.push('ancho'); y = redondear(x * (1 + SALARIO.anchoMax), unidad); }
  return { x: x || null, y: y || null, ancho: x && y ? Math.round(((y - x) / x) * 100) : null, avisos };
}

export function euros(n, idioma) {
  return new Intl.NumberFormat(idioma === 'en' ? 'en-GB' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);
}
function rellenarS(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));
}

/** «brutos anuales, en 14 pagas» y equivalentes. */
export function textoPagas({ unidad = 'anual', pagas = 14 } = {}, idioma = 'es') {
  const T = SALARIO_TXT[idioma === 'en' ? 'en' : 'es'];
  return rellenarS(unidad === 'mensual' ? T.mensual : T.anual, { pagas: Number(pagas) === 13 ? T.aguinaldo : rellenarS(T.pagas, { n: Number(pagas) || 14 }) });
}

/**
 * Las frases de la pregunta salarial. arg: { responsabilidades, logro, proyecto } para el argumento del segundo tiempo
 * (salen de la oferta y del CV si los hay). Devuelve { primero, segundo, menos, escrito, rango }.
 */
export function frasesSalario(datos = {}, arg = {}, idioma = 'es') {
  const T = SALARIO_TXT[idioma === 'en' ? 'en' : 'es'];
  const r = prepararRango(datos);
  const X = r.x ? euros(r.x, idioma) : T.huecoX;
  const Y = r.y ? euros(r.y, idioma) : T.huecoY;
  const pagas = textoPagas(datos, idioma);
  const partes = [arg.responsabilidades && rellenarS(T.argResp, { r: arg.responsabilidades }), arg.logro && rellenarS(T.argLogro, { l: arg.logro }), arg.proyecto && rellenarS(T.argProyecto, { p: arg.proyecto })].filter(Boolean);
  const argumento = partes.length ? rellenarS(T.argumentoCon, { lista: partes.length > 1 ? partes.slice(0, -1).join(', ') + ' ' + T.y + ' ' + partes[partes.length - 1] : partes[0] }) : T.argumento;
  return {
    rango: r,
    primero: T.primero,
    segundo: rellenarS(T.segundo, { argumento, x: X, y: Y, pagas }),
    menos: rellenarS(T.menos, { x: X }),
    escrito: rellenarS(T.escrito, { y: Y, argumento }),
  };
}

/** Cantidades de dinero de un texto: «35.000», «35000 €», «35k», «2.500 euros al mes». */
export function cantidades(texto) {
  const out = [];
  for (const m of String(texto || '').matchAll(/(\d{1,3}(?:[.,\s]\d{3})+|\d{3,6}|\d{2,3}\s?[kK])(?![\d%])/g)) {
    const t = m[1].replace(/\s/g, '');
    const n = /k$/i.test(t) ? Number(t.slice(0, -1)) * 1000 : Number(t.replace(/[.,]/g, ''));
    if (n >= 500 && n <= 1_000_000 && !/^(19|20)\d{2}$/.test(t)) out.push(n);
  }
  return out;
}

/** Puntos de cada criterio de la ronda salarial (suman 100). */
export const RONDA_PESOS = { rango: 30, justifica: 25, condiciones: 15, sinDisculpa: 15, sinMinimo: 15 };

/**
 * Puntúa una respuesta a la pregunta salarial: rango y no cifra suelta, justificado, con el resto de condiciones,
 * sin disculparse y sin dar el mínimo. Devuelve { total, criterios, repregunta } — repregunta: 'cifra' si no hay
 * ninguna cifra (el recruiter insiste: «¿y una cifra concreta?»), 'rango' si hay solo una, o null.
 */
export function evaluarSalario(texto, { minimo = 0, idioma = 'es' } = {}) {
  const M = SALARIO_MARCAS[idioma === 'en' ? 'en' : 'es'];
  const f = foldSameLength(texto);
  const hay = lista => lista.some(p => f.includes(p));
  const nums = cantidades(texto);
  const min = Number(minimo) || 0;
  const ok = {
    rango: nums.length >= 2 && Math.max(...nums) > Math.min(...nums),
    justifica: hay(M.justifica),
    condiciones: hay(M.condiciones),
    sinDisculpa: f.trim().length > 0 && !hay(M.disculpa),
    sinMinimo: f.trim().length > 0 && (!min || !nums.some(n => n <= min)),
  };
  const criterios = Object.entries(RONDA_PESOS).map(([id, max]) => ({ id, max, ok: ok[id], puntos: ok[id] ? max : 0 }));
  return { total: criterios.reduce((n, c) => n + c.puntos, 0), criterios, cantidades: nums, repregunta: !nums.length ? 'cifra' : nums.length === 1 ? 'rango' : null };
}
