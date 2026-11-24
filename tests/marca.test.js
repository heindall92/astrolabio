// 0.10: candidaturas (ida y vuelta con ai-job-search-es), kit de LinkedIn, CV de resultados, bóveda y «Field Notes».
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../app/src/engine/index.js';
import { COMUNES } from '../app/src/content/comunes.js';
import { ROLE_CONTENT } from '../app/src/content/roles/index.js';
import { COMPETENCIA_IDS } from '../app/src/content/competencias.js';
import { LINKEDIN_LIMITES, LINKEDIN_TXT, POST_TXT, AUDITORIA, VERBOS_XYZ } from '../app/src/content/marca.js';

const HOY = '2026-11-24';
const AJS = JSON.parse(fs.readFileSync(new URL('./fixtures/candidaturas-ajs.json', import.meta.url), 'utf8'));
const CV_TXT = fs.readFileSync(new URL('./fixtures/cv/cv-es.txt', import.meta.url), 'utf8').replace(/^#+\s*|\*\*/gm, '');
const CV = E.leerCV(CV_TXT, '2026-11');
const MARCA = { ventaja: 'que convierto el ruido de alertas en detecciones medibles', puntoVista: 'un EDR sin procesos solo mueve las alertas de sitio', frase: 'Encuentro el hueco y lo cierro.', hilo: 'pasar de atender a los usuarios a defenderlos' };

test('candidaturas: se leen de ai-job-search-es saneadas campo a campo', () => {
  const xs = E.leerCopiaCandidaturas(AJS, HOY);
  assert.equal(xs.length, 3);
  const [a, b, c] = xs;
  assert.equal(a.enlace, 'https://empleo.example.com/ofertas/123', 'añade https://');
  assert.equal(b.enlace, '', 'un enlace javascript: no se guarda');
  assert.deepEqual([c.estado, c.prioridad, c.via, c.fechaSolicitud, c.creada], ['guardada', 'media', 'sin', '', HOY], 'valores desconocidos a su valor por defecto');
  assert.equal(a.creada, '2026-11-05T09:12:00+01:00', 'marca de tiempo con zona conservada');
  assert.throws(() => E.leerCopiaCandidaturas({ formato: 'otra-cosa', candidaturas: [] }, HOY), { codigo: 'formato' });
  assert.throws(() => E.leerCopiaCandidaturas({ formato: 'ajs-candidaturas', version: 9, candidaturas: AJS.candidaturas }, HOY), { codigo: 'version' });
  assert.throws(() => E.leerCopiaCandidaturas({ formato: 'ajs-candidaturas', version: 1, candidaturas: [{ id: '__proto__', empresa: 'x' }] }, HOY), { codigo: 'vacia' });
});

test('candidaturas: ida y vuelta sin perder un campo', () => {
  const xs = E.leerCopiaCandidaturas(AJS, HOY);
  const copia = E.exportarCandidaturas(xs, HOY);
  assert.equal(copia.formato, 'ajs-candidaturas');
  assert.equal(copia.version, 1);
  const vuelta = E.leerCopiaCandidaturas(JSON.parse(JSON.stringify(copia)), HOY);
  assert.deepEqual(vuelta, xs);
  // Las claves son exactamente las del modelo de ai-job-search-es.
  assert.deepEqual(Object.keys(xs[0]).sort(), Object.keys(AJS.candidaturas[0]).sort());
});

test('candidaturas: fusionar gana la actualizada más reciente y nunca borra', () => {
  const xs = E.leerCopiaCandidaturas(AJS, HOY);
  const mia = { ...xs[0], estado: 'oferta', actualizada: '2026-11-20T10:00:00+01:00' };
  const r = E.fusionarCandidaturas([mia, xs[2]], xs);
  assert.equal(r.anadidas, 1);
  assert.equal(r.actualizadas, 0, 'la mía es más reciente: se queda');
  assert.equal(r.lista.find(c => c.id === mia.id).estado, 'oferta');
  assert.equal(r.lista.length, 3);
  const r2 = E.fusionarCandidaturas([{ ...xs[1], actualizada: '2026-11-01' }], xs);
  assert.equal(r2.actualizadas, 1);
});

test('candidaturas: seguimientos vencidos, enviadas sin respuesta tras 7 días y orden', () => {
  const xs = E.leerCopiaCandidaturas(AJS, HOY);
  const p = E.pendientesCandidaturas(xs, HOY);
  assert.deepEqual(p.map(x => [x.c.puesto, x.motivo, x.dias]), [['Pentester junior', 'sinRespuesta', 14], ['Analista SOC', 'vencido', 6]]);
  assert.deepEqual(E.pendientesCandidaturas(xs.map(c => ({ ...c, estado: 'rechazada' })), HOY), [], 'los procesos cerrados no piden nada');
  assert.deepEqual(E.ordenarCandidaturas(xs).map(c => c.prioridad), ['alta', 'media', 'media']);
  assert.equal(E.recuentoEstados(xs).entrevista, 1);
  assert.equal(E.normalizarEnlace('mailto:a@b.c'), null);
  assert.equal(E.normalizarEnlace('intranet'), null);
});

test('kit de LinkedIn: titulares dentro del límite, «Acerca de» con los logros del CV y sin cifras inventadas', () => {
  const k = E.kitLinkedIn({ cv: CV, marca: MARCA, rol: 'Blue Team / SOC', textoPerfil: CV_TXT, ofertas: ['Analista SOC con EDR, SIEM, Splunk y Microsoft Sentinel', 'SOC N2 con Sentinel'], idioma: 'es', nombre: 'Marta' });
  assert.ok(k.titulares.length >= 2 && k.titulares.every(x => x.ok && x.largo <= LINKEDIN_LIMITES.titular));
  assert.equal(k.titulares[0].texto, 'Analista SOC junior | Splunk · Wazuh · EDR | Encuentro el hueco y lo cierro');
  assert.ok(k.acerca.ok && k.acerca.largo <= LINKEDIN_LIMITES.acerca);
  assert.ok(k.acerca.texto.startsWith('Encuentro el hueco y lo cierro.'), 'abre con tu frase');
  assert.ok(k.acerca.texto.includes('• Reduje un 30 % los falsos positivos ajustando 12 reglas de correlación.'));
  const cifrasAcerca = (k.acerca.texto.match(/\d+/g) || []).map(Number);
  const cifrasFuente = (CV_TXT.match(/\d+/g) || []).map(Number);
  assert.ok(cifrasAcerca.every(n => cifrasFuente.includes(n) || n === CV.anos), 'cada cifra del «Acerca de» está en el CV (o son tus años, que salen de sus fechas)');
  assert.deepEqual(k.palabras.filter(p => !p.enPerfil).map(p => p.label), ['Microsoft Sentinel', 'SIEM'], 'lo que piden tus ofertas y falta en tu perfil, de más a menos pedido');
  assert.match(k.recomendacion, /^Hola, \[nombre\]:/);
  assert.match(k.recomendacion, /cómo convierto el ruido de alertas/);
  assert.match(k.recomendacion, /Marta$/);
  const vacio = E.kitLinkedIn({ cv: null, marca: {}, rol: '', ofertas: [], idioma: 'es' });
  assert.deepEqual(vacio.titulares, []);
  assert.ok(vacio.acerca.texto.includes('escríbeme'));
});

test('kit de LinkedIn en inglés y plantillas con las mismas claves', () => {
  assert.deepEqual(Object.keys(LINKEDIN_TXT.es).sort(), Object.keys(LINKEDIN_TXT.en).sort());
  assert.deepEqual(Object.keys(POST_TXT.es).sort(), Object.keys(POST_TXT.en).sort());
  assert.deepEqual(Object.keys(AUDITORIA.es).sort(), Object.keys(AUDITORIA.en).sort());
  const cvEn = E.leerCV(fs.readFileSync(new URL('./fixtures/cv/cv-en.txt', import.meta.url), 'utf8').replace(/^#+\s*|\*\*/gm, ''), '2026-11');
  const k = E.kitLinkedIn({ cv: cvEn, marca: { frase: 'I automate the boring parts.', ventaja: 'I cut cloud costs without losing speed' }, rol: 'Cloud', ofertas: [], idioma: 'en' });
  assert.match(k.acerca.texto, /I am a junior Cloud Engineer with 5 years of experience\./);
  assert.ok(!/[áéíóúñ¿¡]/.test(k.acerca.texto + k.recomendacion));
});

test('CV de resultados: fórmula XYZ por viñeta, verbo propuesto sin inventar números y fechas sin mes', () => {
  const cv = E.leerCV(CV_TXT.replace('Triaje de 40 alertas', 'Administración de 40 alertas').replace('03/2024', '2024').replace('Migré 60 equipos a Microsoft 365 sin parada del servicio.', 'Gestión de equipos de los usuarios.'), '2026-11');
  const r = E.revisarCV(cv);
  const v = t => r.vinetas.find(x => x.texto.startsWith(t));
  assert.deepEqual(v('Administración').falta, ['verbo']);
  assert.equal(v('Administración').sugerencia, 'Administré 40 alertas diarias en Wazuh y CrowdStrike Falcon (EDR).');
  assert.deepEqual(v('Gestión').falta, ['verbo', 'cifra', 'como'], 'una tarea sin resultado ni cómo');
  assert.ok(!/\d/.test(v('Gestión').sugerencia), 'la sugerencia nunca añade cifras');
  assert.ok(v('Reduje').ok && v('Escribí').ok);
  assert.equal(r.pct, Math.round((r.vinetas.filter(x => x.ok).length / r.vinetas.length) * 100));
  assert.deepEqual(r.fechas.map(f => f.sinMes), [true, false], '«2024 – actualidad» no dice el mes');
  assert.equal(r.ficha.split('\n')[1], 'Técnica de soporte IT · Hotel Mediterráneo (ficticio) · 06/2022 – 02/2024');
  assert.ok(VERBOS_XYZ.es.length >= 40 && VERBOS_XYZ.en.length >= 40);
  assert.deepEqual(E.revisarCV(null), { vinetas: [], pct: 0, fechas: [], ficha: '' });
});

const historia = (id, comps, a) => ({ id, titulo: 'Historia ' + id, tipo: 'real', s: 'Trabajaba en el SOC de un banco con un compañero y doscientas alertas.', t: 'Tenía que decidir qué alertas atender primero.',
  a: a || 'Clasifiqué la cola por criticidad. Correlacioné los registros del proxy. Bloqueé la sesión y avisé al responsable con un resumen. Revisé la regla y propuse un umbral nuevo.', r: 'Contuvimos el acceso en 18 minutos y los falsos positivos bajaron un 35 %.', l: 'Documentaría desde el minuto uno.', competencias: comps, creada: '', editada: '' });

test('bóveda: hasta seis historias que cubren competencias distintas, cada una con «úsala para…»', () => {
  const hs = [historia('h1', ['presion', 'analisis']), historia('h2', ['presion']), historia('h3', ['equipo', 'comunicacion']), historia('h4', ['etica']),
    historia('h5', ['liderazgo']), historia('h6', ['cliente']), historia('h7', ['aprendizaje']), historia('h8', ['problemas'])];
  const preguntas = [...ROLE_CONTENT.blue.preguntas, ...COMUNES.filter(q => !q.guia)];
  const b = E.seleccionarBoveda(hs, h => E.scoreStory(h), preguntas, COMPETENCIA_IDS);
  assert.equal(b.boveda.length, 6);
  assert.ok(!b.boveda.some(x => x.historia.id === 'h2'), 'una historia que no añade competencias nuevas no entra mientras haya otras');
  assert.ok(b.boveda.every(x => x.usos.length >= 1 && x.usos.length <= 3), 'cada historia con 1 a 3 preguntas para las que es la mejor');
  const usos = b.boveda.flatMap(x => x.usos.map(q => q.id));
  assert.equal(new Set(usos).size, usos.length, 'una pregunta apunta a una sola historia');
  assert.ok(b.faltan.length > 0 && b.faltan.every(c => !b.cubiertas.includes(c)));
  assert.deepEqual(E.seleccionarBoveda([], h => E.scoreStory(h), preguntas, COMPETENCIA_IDS).boveda, []);
});

test('Field Notes: borrador desde una nota, auditoría del borrador, plan cada dos semanas y calendario .ics', () => {
  const nota = { id: 'n_edr', tipo: 'herramienta', campos: { nombre: 'CrowdStrike Falcon', categoria: 'edr', definicion: 'Un EDR que registra lo que pasa en cada equipo y permite aislarlo', uso: 'investigué 40 alertas diarias y aislé dos equipos', nivel: 'produccion', cifra: 'bajé el tiempo de triaje de 20 a 8 minutos', claves: 'edr, xdr, threat hunting' } };
  const p = E.borradorPost(nota, { marca: MARCA, n: 3 });
  assert.ok(p.startsWith('Field Notes #3 · Bajé el tiempo de triaje de 20 a 8 minutos.'), 'el gancho es tu cifra');
  assert.ok(p.includes('CrowdStrike Falcon, en una frase: un EDR que registra') && p.endsWith('#edr #xdr #threathunting'));
  const a = E.auditarPost(p);
  assert.deepEqual(a.hallazgos.map(h => h.id), ['corto', 'huecos'], '«Field Notes #3» no cuenta como hashtag; la lección está por completar');
  assert.equal(a.veredicto, 'rehacer');
  const malo = '¿Sabías que en el panorama actual la seguridad es crucial?\nComenta SÍ si quieres la guía. https://x.example #a #b #c #d';
  assert.deepEqual(E.auditarPost(malo).hallazgos.map(h => h.id), ['corto', 'ganchoPregunta', 'sinCifra', 'hashtags', 'enlace', 'relleno', 'relleno', 'cebo']);
  assert.deepEqual(E.planContenido({ inicio: '2026-12-29', cadencia: 14, notas: ['a', 'b'] }), [{ fecha: '2026-12-29', notaId: 'a', n: 1 }, { fecha: '2027-01-12', notaId: 'b', n: 2 }]);
  assert.deepEqual(E.planContenido({ inicio: 'mañana', notas: ['a'] }), []);
  const ics = E.icsPlan([{ fecha: '2026-12-31', titulo: 'Field Notes #1: EDR, XDR; y más', detalle: 'una\nnota', id: 'n_edr' }]);
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\nVERSION:2.0\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART;VALUE=DATE:20261231\r\nDTEND;VALUE=DATE:20270101'), 'fin de año: el evento acaba el 1 de enero');
  assert.ok(ics.includes('SUMMARY:Field Notes #1: EDR\\, XDR\\; y más') && ics.includes('DESCRIPTION:una\\nnota'));
  const largo = E.icsPlan([{ fecha: '2026-12-01', titulo: 'á'.repeat(100) }]);
  assert.ok(largo.split('\r\n').every(l => new TextEncoder().encode(l).length <= 75), 'líneas plegadas a 75 octetos');
});

test('saneado del estado 0.10: candidaturas y plan de contenido solo con notas que existen', () => {
  const s = E.sanitizeState({ ultimoDia: HOY, baul: [{ id: 'n1', tipo: 'idea', campos: { titulo: 'Una idea' } }], candidaturas: AJS.candidaturas,
    contenido: { inicio: '2026-12-01', cadencia: 999, plan: ['n1', 'n1', 'fantasma'], borradores: { n1: 'texto', fantasma: 'x', __proto__: 'y' }, publicados: ['n1'] } });
  assert.equal(s.candidaturas.length, 3);
  assert.deepEqual(s.contenido, { inicio: '2026-12-01', cadencia: 60, plan: ['n1'], borradores: { n1: 'texto' }, publicados: ['n1'] });
  assert.deepEqual(E.emptyState().candidaturas, []);
});
