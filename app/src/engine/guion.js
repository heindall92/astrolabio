// Guion de una entrevista concreta: junta tu CV, tus notas del Baúl, tu marca personal, tus historias y
// tus respuestas de apoyo, y devuelve bloques por tipo de pregunta para leerlos (o mirarlos) en directo.
// Motor puro: sin DOM, sin red y con reglas explicables.
import { foldSameLength, vacFind, likelyQuestions } from './vacante.js';
import { nivelIdiomaCV } from './cvlector.js';
import { analyzePitch } from './presentacion.js';
import { recommendStories } from './arena.js';
import { wordCount } from './analyzer.js';
import { VAC_TECNOLOGIAS } from '../content/vacante.js';
import { BAUL_CATEGORIAS } from '../content/baul.js';
import { GUION_TXT, NOMBRE_IDIOMA, NO_HERRAMIENTAS, PREGUNTAS_TEC, PREGUNTAS_POR_ENTREVISTADOR, CONSEJOS_ENTREVISTADOR, SALARIO_LEY, SALARIO_CONSEJOS, SALARIO_FUENTES, SALARIO_AVISOS } from '../content/guion.js';
import { frasesSalario, euros } from './salario.js';

export const GUION = {
  maxTecnicas: 8,
  maxConducta: 5,
  maxExperiencias: 3,
  huecoMeses: 6,
  margenRango: 0.1,
  palabrasPorMinuto: 140,
};

function rellenar(tpl, vars) {
  return tpl.replace(/\{(\w+)\}/g, (_, k) => (vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));
}
function frase(s) {
  const t = String(s || '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return /[.!?…]$/.test(t) ? t : t + '.';
}
function minuscula(s) {
  const t = String(s || '').trim();
  // Solo si la segunda letra es minúscula: «Reduje» → «reduje», pero «SOC» o «AWS» se quedan.
  return t.length > 1 && /\p{Ll}/u.test(t[1]) ? t[0].toLowerCase() + t.slice(1) : t;
}
function primeraFrase(s) {
  const m = String(s || '').trim().match(/^[\s\S]*?[.!?](?=\s|$)/);
  return (m ? m[0] : String(s || '')).trim();
}
function lista(items, idioma) {
  const xs = items.filter(Boolean);
  if (xs.length <= 1) return xs.join('');
  return xs.slice(0, -1).join(', ') + ' ' + GUION_TXT[idioma].y + ' ' + xs[xs.length - 1];
}
/** Huecos del texto: lo que está entre corchetes y la persona aún tiene que escribir. */
export function huecosDe(texto) {
  return [...String(texto || '').matchAll(/\[([^\]]+)\]/g)].map(m => m[1]);
}
/** Palabras clave de un texto: cifras y tecnologías del léxico, más las que se pasen. */
export function clavesDe(texto, extra = []) {
  const f = foldSameLength(texto);
  const out = [];
  const add = x => { const k = String(x || '').trim(); if (k && !out.some(o => foldSameLength(o) === foldSameLength(k))) out.push(k); };
  extra.forEach(add);
  for (const m of String(texto || '').matchAll(/(?:[+-]?\d[\d.,]*\s?(?:%|€|k|K)?)(?:\s?(?:alertas|reglas|equipos|usuarios|incidencias|proyectos|endpoints|personas|clientes|días|horas|meses|años|alerts|rules|users|projects|days|hours|months|years))?/g)) {
    if (/\d{2,}|%|€/.test(m[0]) && !/^(19|20)\d{2}$/.test(m[0].trim())) add(m[0].trim());
  }
  for (const [label, ...variants] of VAC_TECNOLOGIAS) if (variants.some(v => vacFind(f, v).length)) add(label);
  return out.slice(0, 6);
}

/** Tecnologías del léxico que cubre una nota del Baúl (por su nombre, categoría y claves). */
export function tecnologiasNota(nota) {
  const c = nota.campos || {};
  const texto = foldSameLength([c.nombre, c.termino, c.titulo, c.claves, c.stack].filter(Boolean).join(' , '));
  const out = new Set();
  for (const [label, ...variants] of VAC_TECNOLOGIAS) if (variants.some(v => vacFind(texto, v).length)) out.add(label);
  const cat = BAUL_CATEGORIAS.find(x => x[0] === c.categoria);
  if (cat && cat[1]) out.add(cat[1]);
  return [...out];
}

/** Retribución que publica una oferta: «30.000 – 35.000 €», «30k-35k», «hasta 40.000 euros brutos». En euros. */
export function salarioEnOferta(texto) {
  const f = foldSameLength(texto).replace(/ /g, ' ');
  const num = '(\\d{2,3}(?:[.,\\s]\\d{3})|\\d{2,3}\\s?k)';
  const re = new RegExp(`${num}\\s*(?:€|eur|euros)?\\s*(?:[-–—]|a|y|to|hasta)\\s*(?:€\\s?)?${num}|${num}`, 'gi');
  const valor = s => { const t = s.replace(/\s/g, ''); return /k$/i.test(t) ? Number(t.slice(0, -1)) * 1000 : Number(t.replace(/[.,]/g, '')); };
  for (const m of f.matchAll(re)) {
    const ctx = f.slice(Math.max(0, m.index - 60), m.index + m[0].length + 40);
    if (!/€|eur|salari|retribuci|brut|sueldo|banda|salary|pay|compensation|k\b/.test(ctx)) continue;
    const a = m[1] ? valor(m[1]) : valor(m[3]);
    const b = m[2] ? valor(m[2]) : a;
    if (a >= 10_000 && b <= 400_000 && b >= a) return { min: a, max: b };
  }
  return null;
}


function duracion(meses, idioma) {
  const a = Math.floor(meses / 12), m = meses % 12;
  if (idioma === 'en') return [a ? `${a} year${a > 1 ? 's' : ''}` : '', m ? `${m} month${m > 1 ? 's' : ''}` : ''].filter(Boolean).join(' ') || '1 month';
  return [a ? `${a} año${a > 1 ? 's' : ''}` : '', m ? `${m} mes${m > 1 ? 'es' : ''}` : ''].filter(Boolean).join(' y ') || '1 mes';
}

/** Periodos sin trabajo de más de seis meses entre experiencias del CV (la pregunta del «hueco»). */
export function huecosCV(experiencias) {
  const xs = (experiencias || []).slice().sort((a, b) => (a.desde < b.desde ? -1 : 1));
  const out = [];
  let fin = null;
  for (const e of xs) {
    if (fin) {
      const [a1, m1] = fin.split('-').map(Number), [a2, m2] = e.desde.split('-').map(Number);
      const meses = (a2 - a1) * 12 + (m2 - m1) - 1;
      if (meses >= GUION.huecoMeses) out.push({ desde: fin, hasta: e.desde, meses });
    }
    if (!fin || e.hasta > fin) fin = e.hasta;
  }
  return out;
}

/**
 * Argumento del segundo tiempo de la pregunta salarial: las responsabilidades que pide la oferta y ya haces
 * (o, si no coincide ninguna, las dos primeras que pide), tu mejor logro del CV y el proyecto (la empresa).
 */
export function argumentoSalario({ oferta = null, cv = null, baul = [], empresa = '', idioma = 'es' } = {}) {
  const tecOferta = oferta ? oferta.tecnologias : [];
  const propias = new Set([...(cv ? cv.tecnologias : []), ...(baul || []).flatMap(tecnologiasNota)]);
  const coinciden = tecOferta.filter(x => propias.has(x));
  const respons = (coinciden.length ? coinciden : tecOferta).slice(0, 2);
  return {
    responsabilidades: respons.length ? lista(respons, idioma === 'en' ? 'en' : 'es') : '',
    logro: cv && cv.logros[0] ? minuscula(cv.logros[0]).replace(/[.]$/, '') : '',
    proyecto: String(empresa || '').trim(),
  };
}

const NIVELES_MCER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
/**
 * Lo que la oferta pide y el CV no muestra: más años de los que tienes o un nivel de idioma más alto
 * (o que el CV no dice). No descarta a nadie: prepara la respuesta a la duda que va a salir.
 */
export function dudasOferta(oferta, cv) {
  const out = [];
  if (!oferta || !cv) return out;
  if (oferta.anos && cv.experiencias.length && cv.anos < oferta.anos) out.push({ tipo: 'anos', pide: oferta.anos, tienes: cv.anos });
  for (const i of oferta.idiomas || []) {
    if (!i.nivel || !NIVELES_MCER.includes(i.nivel)) continue;
    const tienes = nivelIdiomaCV(cv.idiomas || [], i.id);
    if (!tienes || NIVELES_MCER.indexOf(tienes) < NIVELES_MCER.indexOf(i.nivel)) out.push({ tipo: 'idioma', idioma: i.id, pide: i.nivel, tienes: tienes || '' });
  }
  return out;
}

/**
 * Genera el guion. ctx:
 * { idioma, entrevista: { empresa, puesto, entrevistadores, pais, resp }, cv (leerCV) | null, oferta (analyzeOffer) | null,
 *   textoOferta, historias, scoreFn, presentacion: { texto }, marca: { ventaja, puntoVista, frase, hilo }, baul, perfil,
 *   preguntasRol, comunes, preguntasEntrevistador, mesTexto(iso) }
 * Devuelve { bloques: [{ id, cat, pregunta, texto, claves, apoyo, huecos, segundos, fuente }], probables, pitch }.
 */
export function generarGuion(ctx) {
  const idioma = ctx.idioma === 'en' ? 'en' : 'es';
  const T = GUION_TXT[idioma];
  const L = o => (o && typeof o === 'object' ? o[idioma] || o.es || '' : o || '');
  const e = ctx.entrevista || {};
  const r = e.resp || {};
  const cv = ctx.cv || null;
  const marca = ctx.marca || {};
  const baul = Array.isArray(ctx.baul) ? ctx.baul : [];
  const empresa = String(e.empresa || '').trim();
  const puesto = String(e.puesto || '').trim();
  const entrevistadores = Array.isArray(e.entrevistadores) && e.entrevistadores.length ? e.entrevistadores : ['rrhh'];
  const tecnico = entrevistadores.includes('tecnico');
  const bloques = [];
  const probables = [];
  const add = (b) => {
    const texto = b.texto.replace(/\s+/g, ' ').trim();
    const bloque = { apoyo: [], fuente: '', ...b, texto, huecos: huecosDe(texto), claves: clavesDe(texto.replace(/\[[^\]]*\]/g, ''), b.claves || []), segundos: Math.round((wordCount(texto) / GUION.palabrasPorMinuto) * 60) };
    bloques.push(bloque);
    return bloque;
  };
  const probable = (pregunta, cat, bloque, motivo, detalle = '') => {
    if (!probables.some(p => foldSameLength(p.pregunta) === foldSameLength(pregunta))) probables.push({ pregunta, cat, bloque: bloque ? bloque.id : null, motivo, detalle });
  };
  const comun = id => (ctx.comunes || []).find(q => q.id === id);

  // 1. Apertura
  add({ id: 'apertura', cat: 'apertura', pregunta: idioma === 'en' ? 'Greeting' : 'Saludo', texto: rellenar(empresa && puesto ? T.apertura : T.aperturaSin, { puesto, empresa }), claves: [empresa, puesto].filter(Boolean),
    apoyo: e.formato === 'video' ? [idioma === 'en' ? 'Look at the camera, not the screen, when you greet them.' : 'Al saludar, mira a la cámara, no a la pantalla.'] : [] });

  // 2. Háblame de ti
  let texPres = String((ctx.presentacion && ctx.presentacion.texto) || '').trim();
  let fuentePres = 'presentacion';
  if (!texPres) {
    fuentePres = 'generada';
    const partes = [];
    const act = cv && cv.actual;
    const titular = (cv && cv.titular) || (act && act.puesto) || '';
    if (titular) partes.push(rellenar(T.presente, { titular: minuscula(titular), anos: cv && cv.anos >= 2 ? rellenar(T.presenteAnos, { n: cv.anos }) : cv && cv.anos === 1 ? T.presenteAnos1 : '' }));
    if (act && act.puesto && foldSameLength(act.puesto) !== foldSameLength(titular)) partes.push(rellenar(T.ahora, { puesto: act.puesto, empresa: act.empresa ? rellenar(T.ahoraEmpresa, { empresa: act.empresa }) : '' }));
    const anterior = cv && cv.experiencias.find(x => x !== act);
    const herramientas = cv ? cv.tecnologias.filter(x => !NO_HERRAMIENTAS.includes(x) && !cv.certificaciones.some(c => foldSameLength(c).includes(foldSameLength(x)))) : [];
    if (herramientas.length >= 2) {
      const ofTec = ctx.oferta ? ctx.oferta.tecnologias : [];
      const orden = [...herramientas.filter(x => ofTec.includes(x)), ...herramientas.filter(x => !ofTec.includes(x))];
      partes.push(rellenar(T.tecs, { lista: lista(orden.slice(0, 3), idioma) }));
    }
    if (anterior) partes.push(rellenar(T.antes, { puesto: minuscula(anterior.puesto), empresa: anterior.empresa ? rellenar(T.ahoraEmpresa, { empresa: anterior.empresa }) : '' }));
    const logro = (r.logro && r.logro.trim()) || (cv && cv.logros[0]) || '';
    if (logro) partes.push(rellenar(T.logro, { logro: frase(minuscula(logro)) }));
    if (marca.ventaja) partes.push(rellenar(T.ventaja, { ventaja: frase(minuscula(marca.ventaja)) }));
    if (cv && cv.certificaciones.length) partes.push(rellenar(T.certs, { lista: lista(cv.certificaciones.slice(0, 2).map(c => c.replace(/\s*\(.*\)$/, '')), idioma) }));
    if (marca.hilo) partes.push(rellenar(T.hilo, { hilo: minuscula(marca.hilo).replace(/[.]$/, '') }));
    const motivo = (r.motivoPuesto || '').trim();
    partes.push(rellenar(motivo ? T.futuro : T.futuroHueco, { puesto: puesto || (idioma === 'en' ? 'this' : 'este'), empresa: empresa ? rellenar(T.ahoraEmpresa, { empresa }) : '', motivo: frase(minuscula(motivo)) }));
    if (marca.frase) partes.push(rellenar(T.frase, { frase: frase(marca.frase) }));
    texPres = partes.join(' ');
  }
  const pitch = analyzePitch(texPres.replace(/\[[^\]]*\]/g, ''), { idioma, puesto: puesto || empresa });
  const bPres = add({ id: 'presentacion', cat: 'presentacion', pregunta: L(comun('c-hablame')) || (idioma === 'en' ? 'Tell me about yourself.' : 'Háblame de ti.'), texto: texPres, fuente: fuentePres,
    claves: [marca.frase ? marca.frase.split(/[,.]/)[0] : ''].filter(Boolean),
    apoyo: entrevistadores.map(x => L(CONSEJOS_ENTREVISTADOR[x])).filter(Boolean) });
  probable(bPres.pregunta, 'presentacion', bPres, 'siempre');

  // 3. Motivación: por qué la empresa y por qué el puesto
  const notaEmpresa = baul.find(n => n.tipo === 'empresa' && empresa && foldSameLength(n.campos.nombre || '').trim() === foldSameLength(empresa).trim())
    || baul.find(n => n.tipo === 'empresa' && empresa && foldSameLength(n.campos.nombre || '').includes(foldSameLength(empresa)));
  let tEmp = '';
  if (r.motivoEmpresa && r.motivoEmpresa.trim()) tEmp = frase(r.motivoEmpresa);
  else if (notaEmpresa) {
    const c = notaEmpresa.campos;
    tEmp = [c.hace && frase(rellenar(T.porEmpresa, { empresa, hace: minuscula(c.hace) })), c.noticia && frase(rellenar(T.porNoticia, { noticia: minuscula(c.noticia) })), c.encaje && frase(rellenar(T.porEncaje, { encaje: minuscula(c.encaje) }))].filter(Boolean).join(' ');
  }
  if (!tEmp) tEmp = rellenar(T.porEmpresaHueco, { empresa: empresa || (idioma === 'en' ? 'the company' : 'la empresa') });
  const qEmp = idioma === 'en' ? `Why ${empresa || 'our company'}?` : `¿Por qué ${empresa || 'nuestra empresa'}?`;
  const bEmp = add({ id: 'motivo-empresa', cat: 'motivacion', pregunta: qEmp, texto: tEmp, fuente: notaEmpresa ? 'baul:' + notaEmpresa.id : 'resp', claves: notaEmpresa && notaEmpresa.campos.valores ? [notaEmpresa.campos.valores.split(',')[0]] : [] });
  probable(qEmp, 'motivacion', bEmp, 'siempre');
  const tecOferta = ctx.oferta ? ctx.oferta.tecnologias : [];
  const tecPropias = new Set([...(cv ? cv.tecnologias : []), ...baul.flatMap(tecnologiasNota)]);
  const coinciden = tecOferta.filter(x => tecPropias.has(x));
  let tPue = r.motivoPuesto && r.motivoPuesto.trim() ? rellenar(T.porPuesto, { motivo: frase(minuscula(r.motivoPuesto)) }) : T.porPuestoHueco;
  if (coinciden.length) tPue += ' ' + rellenar(T.porPuestoTec, { lista: lista(coinciden.slice(0, 3), idioma) });
  const qPue = L(comun('c-motivo')) || (idioma === 'en' ? 'Why do you want this role?' : '¿Por qué quieres este puesto?');
  const bPue = add({ id: 'motivo-puesto', cat: 'motivacion', pregunta: qPue, texto: tPue, fuente: 'resp', apoyo: [L(comun('c-motivo') && comun('c-motivo').guia)].filter(Boolean) });
  probable(qPue, 'motivacion', bPue, 'siempre');

  // 4. Experiencia y logros
  const exps = cv ? cv.experiencias.slice(0, GUION.maxExperiencias) : [];
  const tExp = exps.length ? exps.map(x => rellenar(x.empresa ? T.expItem : T.expItemSinEmpresa, {
    empresa: x.empresa, puesto: minuscula(x.puesto), tiempo: duracion(x.meses, idioma),
    logros: x.logros.length ? x.logros.slice(0, 2).map(l => frase(minuscula(l)).replace(/\.$/, '')).join('; ') + '.' : T.expSinLogros,
  })).join(' ') : T.expHueco;
  const qExp = idioma === 'en' ? 'Walk me through your experience.' : 'Cuéntame tu experiencia.';
  const bExp = add({ id: 'experiencia', cat: 'experiencia', pregunta: qExp, texto: tExp, fuente: 'cv', claves: exps.map(x => x.empresa).filter(Boolean) });
  probable(qExp, 'experiencia', bExp, 'siempre');
  const logroTop = (r.logro && r.logro.trim()) || (cv && cv.logros[0]) || '';
  const qLog = idioma === 'en' ? 'What is your biggest achievement?' : '¿Cuál es tu mayor logro?';
  add({ id: 'logro', cat: 'experiencia', pregunta: qLog, texto: logroTop ? rellenar(T.mayorLogro, { logro: frase(logroTop) }) : T.mayorLogroHueco, fuente: r.logro ? 'resp' : 'cv',
    apoyo: cv ? cv.logros.slice(1, 4) : [] });

  // 5. Técnica: cada tecnología de la oferta (o, sin oferta, las de tu CV y tu Baúl)
  const tecs = (tecOferta.length ? tecOferta : [...tecPropias]).slice(0, GUION.maxTecnicas);
  for (const tec of tecs) {
    const nota = baul.find(n => n.tipo === 'herramienta' && tecnologiasNota(n).includes(tec)) || baul.find(n => n.tipo === 'proyecto' && tecnologiasNota(n).includes(tec));
    const q = idioma === 'en' ? `What experience do you have with ${tec}?` : `¿Qué experiencia tienes con ${tec}?`;
    let texto, fuente = '';
    const apoyo = [];
    if (nota && nota.tipo === 'herramienta') {
      const c = nota.campos;
      texto = rellenar(T.tecNota, { definicion: frase(c.definicion), nivel: c.nivel && T.nivel[c.nivel] ? T.nivel[c.nivel] : T.nivelSin, uso: frase(minuscula(c.uso)) || T.expSinLogros });
      if (c.cifra) texto += ' ' + rellenar(T.tecNotaCifra, { cifra: frase(c.cifra) });
      fuente = 'baul:' + nota.id;
    } else if (nota) {
      const c = nota.campos;
      texto = frase(c.objetivo) + ' ' + frase(c.hice) + ' ' + frase(c.resultado);
      fuente = 'baul:' + nota.id;
    } else if (cv && cv.tecnologias.includes(tec)) {
      const vars = (VAC_TECNOLOGIAS.find(x => x[0] === tec) || [tec]).slice(1);
      const logro = cv.experiencias.flatMap(x => x.logros).find(l => vars.some(v => vacFind(foldSameLength(l), v).length));
      texto = logro ? rellenar(T.tecCv, { logro: frase(minuscula(logro)) }) : T.tecCvSolo;
      fuente = 'cv';
    } else {
      texto = T.tecHueco;
      fuente = 'hueco';
    }
    const b = add({ id: 'tec-' + foldSameLength(tec).replace(/[^a-z0-9]+/g, '-'), cat: 'tecnica', pregunta: q, texto, fuente, claves: [tec], apoyo });
    probable(q, 'tecnica', b, tecOferta.includes(tec) ? 'oferta' : 'cv', tec);
    for (const pq of PREGUNTAS_TEC[tec] || []) probable(L(pq), 'tecnica', b, tecOferta.includes(tec) ? 'oferta' : 'cv', tec);
  }
  // Conceptos del Baúl que tocan la oferta (o todos, si no hay oferta): «explícame…».
  const conceptos = baul.filter(n => n.tipo === 'concepto' && (!tecOferta.length || tecnologiasNota(n).some(x => tecOferta.includes(x)) || !tecnologiasNota(n).length)).slice(0, 4);
  for (const n of conceptos) {
    const c = n.campos;
    const q = idioma === 'en' ? `Can you explain ${c.termino}?` : `¿Me explicas qué es ${c.termino}?`;
    const usaTecnico = tecnico && c.tecnico;
    const b = add({ id: 'concepto-' + n.id, cat: 'tecnica', pregunta: q, texto: usaTecnico ? frase(c.tecnico) : c.sencillo ? frase(c.sencillo) : T.conceptoHueco, fuente: 'baul:' + n.id,
      claves: [c.termino, ...(c.claves || '').split(',').slice(0, 2)], apoyo: [usaTecnico ? frase(c.sencillo) : frase(c.tecnico), frase(c.ejemplo)].filter(Boolean) });
    probable(q, 'tecnica', b, 'baul', c.termino);
  }

  // 6. Conducta (STAR): las preguntas más probables con la historia que mejor encaja.
  const banco = [...(ctx.preguntasRol || []), ...(ctx.comunes || []).filter(q => !q.guia)];
  let preguntasStar = ctx.oferta ? likelyQuestions(ctx.oferta, banco, GUION.maxConducta) : [];
  if (preguntasStar.length < GUION.maxConducta) for (const q of banco) { if (preguntasStar.length >= GUION.maxConducta) break; if (!preguntasStar.includes(q) && (ctx.comunes || []).includes(q)) preguntasStar.push(q); }
  const historias = Array.isArray(ctx.historias) ? ctx.historias : [];
  const usadas = new Set();
  for (const q of preguntasStar) {
    const libres = historias.filter(h => !usadas.has(h.id));
    const recs = ctx.scoreFn ? recommendStories(q, libres.length ? libres : historias, ctx.scoreFn, 1) : [];
    const rec = recs.find(x => x.match > 0);
    let texto, fuente = 'hueco';
    if (rec) {
      const h = rec.historia;
      usadas.add(h.id);
      texto = [h.s && rellenar(T.starS, { s: frase(minuscula(primeraFrase(h.s))) }), h.t && rellenar(T.starT, { t: frase(minuscula(primeraFrase(h.t))) }),
        h.a && rellenar(T.starA, { a: frase(minuscula(String(h.a).split(/(?<=[.!?])\s+/).slice(0, 2).join(' '))) }),
        h.r && rellenar(T.starR, { r: frase(minuscula(primeraFrase(h.r))) })].filter(Boolean).join(' ');
      fuente = 'historia:' + h.id;
    } else texto = T.starHueco;
    const b = add({ id: 'star-' + q.id, cat: 'conducta', pregunta: L(q), texto, fuente, claves: rec ? [rec.historia.titulo] : [] });
    probable(L(q), 'conducta', b, ctx.oferta ? 'oferta' : 'siempre');
  }

  // 7. Preguntas difíciles
  const dif = (id, cat, resp, tpl, tplHueco, vars = {}, motivo = 'siempre') => {
    const q = comun(id);
    if (!q) return null;
    const b = add({ id, cat, pregunta: L(q), texto: resp && resp.trim() ? rellenar(tpl, { resp: frase(resp), ...vars }) : rellenar(tplHueco, vars), fuente: resp ? 'resp' : 'hueco', apoyo: [L(q.guia)].filter(Boolean) });
    probable(L(q), cat, b, motivo);
    return b;
  };
  dif('c-salida', 'dificiles', r.salida, T.salida, T.salidaHueco);
  if (r.duda && r.duda.trim()) {
    const q = idioma === 'en' ? 'A likely doubt about your profile' : 'La duda que pueden tener sobre tu perfil';
    const b = add({ id: 'duda', cat: 'dificiles', pregunta: q, texto: r.dudaRespuesta && r.dudaRespuesta.trim() ? rellenar(T.duda, { resp: frase(r.dudaRespuesta) }) : T.dudaHueco, fuente: r.dudaRespuesta ? 'resp' : 'hueco', claves: [r.duda], apoyo: [frase(r.duda)] });
    probable(frase(r.duda), 'dificiles', b, 'duda');
  }
  // Dudas que salen solas de cruzar la oferta con el CV: años y nivel de idioma.
  for (const d of dudasOferta(ctx.oferta, cv)) {
    if (d.tipo === 'anos') {
      const tienes = duracion(cv.meses, idioma);
      const logro = cv.logros[0];
      const q = rellenar(T.dudaAnosQ, { pide: d.pide, tienes });
      const b = add({ id: 'duda-anos', cat: 'dificiles', pregunta: q, texto: rellenar(logro ? T.dudaAnos : T.dudaAnosSinLogro, { tienes, logro: logro ? frase(minuscula(logro)) : '' }), fuente: 'oferta', claves: [String(d.pide)] });
      probable(q, 'dificiles', b, 'oferta');
    } else {
      const nom = L(NOMBRE_IDIOMA[d.idioma]) || d.idioma;
      const q = rellenar(T.dudaIdiomaQ, { idioma: nom, pide: d.pide });
      const b = add({ id: 'duda-idioma-' + d.idioma, cat: 'dificiles', pregunta: q, texto: rellenar(T.dudaIdioma, { idioma: nom, tienes: d.tienes || '[tu nivel]' }), fuente: 'oferta', claves: [nom + ' ' + d.pide] });
      probable(q, 'dificiles', b, 'oferta');
    }
  }
  for (const h of huecosCV(cv && cv.experiencias)) {
    const mt = ctx.mesTexto || (x => x);
    dif('c-hueco', 'dificiles', r.hueco, T.hueco, T.huecoHueco, { desde: mt(h.desde), hasta: mt(h.hasta) }, 'hueco');
    break;
  }
  dif('c-defecto', 'dificiles', r.defecto, T.defecto, T.defectoHueco);
  dif('c-futuro', 'dificiles', r.futuro, T.futuroCinco, T.futuroCincoHueco);
  if (ctx.perfil && ctx.perfil.rol === 'cambio') dif('c-cambio', 'dificiles', r.cambio, T.salida, T.salidaHueco);

  // 8. Salario y condiciones: la pregunta en dos tiempos (no cerrarse; si insisten, rango con argumento).
  const enEspana = (e.pais || 'es') === 'es';
  const oferta = ctx.textoOferta ? salarioEnOferta(ctx.textoOferta) : null;
  const datosSal = { minimo: r.salarioMin, objetivo: r.salarioObjetivo, ancla: r.salarioAncla, unidad: r.salarioUnidad || 'anual', pagas: r.salarioPagas || 14 };
  const fs = frasesSalario(datosSal, argumentoSalario({ oferta: ctx.oferta, cv, baul, empresa, idioma }), idioma);
  const rango = fs.rango;
  const cond = String(r.condiciones || '').trim();
  const apoyoSal = [...SALARIO_CONSEJOS[idioma], ...SALARIO_FUENTES[idioma]];
  let tSal = fs.primero;
  if (oferta) {
    const ofTxt = oferta.min === oferta.max ? euros(oferta.min, idioma) : `${euros(oferta.min, idioma)} – ${euros(oferta.max, idioma)}`;
    tSal = rellenar(T.salarioOfertaSolo, { oferta: ofTxt });
    if (r.salarioMin && Number(r.salarioMin) > oferta.max) apoyoSal.unshift(L(SALARIO_AVISOS.ofertaBaja));
  }
  const bSal = add({ id: 'salario', cat: 'salario', pregunta: L(comun('c-salario')) || (idioma === 'en' ? 'What are your salary expectations?' : '¿Cuáles son tus expectativas salariales?'), texto: tSal, fuente: oferta ? 'oferta' : 'plantilla', apoyo: apoyoSal });
  probable(bSal.pregunta, 'salario', bSal, 'siempre');
  const qCifra = idioma === 'en' ? 'And a specific figure?' : '¿Y una cifra concreta?';
  const bRango = add({ id: 'salario-rango', cat: 'salario', pregunta: qCifra, texto: fs.segundo + (cond ? ' ' + rellenar(T.valoro, { lista: frase(cond) }) : ''), fuente: rango.x ? 'resp' : 'hueco',
    claves: [rango.x ? euros(rango.x, idioma) : '', rango.y ? euros(rango.y, idioma) : ''].filter(Boolean), apoyo: rango.avisos.filter(x => SALARIO_AVISOS[x]).map(x => L(SALARIO_AVISOS[x])) });
  probable(qCifra, 'salario', bRango, 'insisten');
  const qMenos = idioma === 'en' ? 'Would you accept less?' : '¿Aceptarías menos?';
  probable(qMenos, 'salario', add({ id: 'salario-menos', cat: 'salario', pregunta: qMenos, texto: fs.menos, fuente: rango.x ? 'resp' : 'hueco' }), 'insisten');
  if (enEspana) {
    const q = idioma === 'en' ? 'How much do you earn now (or did you earn before)?' : '¿Cuánto cobras ahora o cobrabas antes?';
    const b = add({ id: 'salario-historial', cat: 'salario', pregunta: q, texto: T.salarioHistorialSin, fuente: 'ley', apoyo: [SALARIO_LEY[idioma]] });
    probable(q, 'salario', b, 'ley');
  }
  const qEsc = idioma === 'en' ? 'They send you a written offer with a figure' : 'Te mandan la oferta por escrito con una cifra';
  add({ id: 'salario-escrito', cat: 'salario', pregunta: qEsc, texto: fs.escrito, fuente: rango.y ? 'resp' : 'hueco' });
  const qDisp = idioma === 'en' ? 'When could you start?' : '¿Cuándo podrías incorporarte?';
  const bDisp = add({ id: 'disponibilidad', cat: 'salario', pregunta: qDisp, texto: r.disponibilidad && r.disponibilidad.trim() ? frase(r.disponibilidad) : T.disponibilidadHueco, fuente: r.disponibilidad ? 'resp' : 'hueco' });
  probable(qDisp, 'salario', bDisp, 'rrhh');

  // 9. Tus preguntas
  const ids = [...new Set(entrevistadores.flatMap(x => PREGUNTAS_POR_ENTREVISTADOR[x] || []))].slice(0, 4);
  const propias = notaEmpresa && notaEmpresa.campos.pregunta ? [frase(notaEmpresa.campos.pregunta)] : [];
  const preguntas = [...propias, ...ids.map(id => L((ctx.preguntasEntrevistador || []).find(q => q.id === id))).filter(Boolean)].slice(0, 4);
  add({ id: 'tus-preguntas', cat: 'preguntas', pregunta: L(comun('c-preguntas')) || (idioma === 'en' ? 'Do you have any questions for us?' : '¿Tienes alguna pregunta para nosotros?'), texto: preguntas.join(' '), fuente: 'banco', apoyo: [L(comun('c-preguntas') && comun('c-preguntas').guia)].filter(Boolean) });

  // 10. Cierre
  const encaje = coinciden.length ? rellenar(T.cierreEncaje, { lista: lista(coinciden.slice(0, 2), idioma) }) : '';
  add({ id: 'cierre', cat: 'cierre', pregunta: idioma === 'en' ? 'Closing' : 'Cierre', texto: rellenar(T.cierre, { encaje, frase: marca.frase ? rellenar(T.cierreFrase, { frase: frase(marca.frase) }) : '' }), fuente: 'plantilla' });

  return { idioma, bloques, probables, pitch, salarioOferta: oferta, rango };
}

/** Aplica las ediciones que la persona hizo a mano en cada bloque (por id), sin perder el resto. */
export function aplicarEdiciones(guion, ediciones) {
  if (!ediciones || typeof ediciones !== 'object') return guion;
  const bloques = guion.bloques.map(b => {
    const ed = ediciones[b.id];
    if (typeof ed !== 'string' || !ed.trim()) return b;
    return { ...b, texto: ed.trim(), editado: true, huecos: huecosDe(ed), claves: clavesDe(ed.replace(/\[[^\]]*\]/g, ''), b.claves.slice(0, 2)), segundos: Math.round((wordCount(ed) / GUION.palabrasPorMinuto) * 60) };
  });
  return { ...guion, bloques };
}

/** Guion como texto plano para descargarlo o imprimirlo. */
export function guionTexto(guion, titulo, etiquetasCat) {
  const lineas = [titulo, '='.repeat(Math.min(60, titulo.length)), ''];
  let cat = null;
  for (const b of guion.bloques) {
    if (b.cat !== cat) { cat = b.cat; lineas.push('', '## ' + (etiquetasCat[cat] || cat), ''); }
    lineas.push('> ' + b.pregunta, b.texto);
    if (b.claves.length) lineas.push('   · ' + b.claves.join(' · '));
    lineas.push('');
  }
  return lineas.join('\n').replace(/\n{3,}/g, '\n\n').trim() + '\n';
}
