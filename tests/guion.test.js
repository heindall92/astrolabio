// Del CV al guion: análisis del CV, bloques por tipo de pregunta, salario y Ley 3/2023, preguntas probables y saneado.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../app/src/engine/index.js';
import { COMUNES, PREGUNTAS_ENTREVISTADOR } from '../app/src/content/comunes.js';
import { ROLE_CONTENT } from '../app/src/content/roles/index.js';
import { GUION_CATEGORIAS, GUION_TXT, PREGUNTAS_TEC, SALARIO_LEY, PREGUNTAS_POR_ENTREVISTADOR } from '../app/src/content/guion.js';
import { BAUL_TIPOS, BAUL_CATEGORIAS } from '../app/src/content/baul.js';
import { VAC_TECNOLOGIAS } from '../app/src/content/vacante.js';

const CV_ES = fs.readFileSync(new URL('./fixtures/cv/cv-es.txt', import.meta.url), 'utf8').replace(/^#+\s*|\*\*/gm, '');
const CV_EN = fs.readFileSync(new URL('./fixtures/cv/cv-en.txt', import.meta.url), 'utf8').replace(/^#+\s*|\*\*/gm, '');
const OFERTA = 'Buscamos analista SOC con experiencia en EDR/XDR, SIEM y MITRE ATT&CK. Valoramos trabajo bajo presión y comunicación. Retribución: 32.000 - 38.000 € brutos anuales.';
const NOTA_EDR = { id: 'n_edr', tipo: 'herramienta', campos: { nombre: 'CrowdStrike Falcon', categoria: 'edr', definicion: 'Un EDR registra lo que pasa en cada equipo y deja aislarlo', uso: 'investigué alertas y aislé equipos', nivel: 'produccion', cifra: 'bajé el triaje de 20 a 8 minutos', claves: '' } };

function guion(over = {}) {
  const cv = E.leerCV(over.cvTexto ?? CV_ES, '2026-11');
  const textoOferta = over.textoOferta ?? OFERTA;
  return E.generarGuion({
    idioma: 'es', cv, textoOferta, oferta: textoOferta ? E.analyzeOffer(textoOferta) : null, historias: [], scoreFn: h => E.scoreStory(h), presentacion: { texto: '' },
    marca: {}, baul: [NOTA_EDR], perfil: { rol: 'blue' }, preguntasRol: ROLE_CONTENT.blue.preguntas, comunes: COMUNES, preguntasEntrevistador: PREGUNTAS_ENTREVISTADOR,
    ...over,
    entrevista: { empresa: 'Acme', puesto: 'Analista SOC', entrevistadores: ['rrhh'], formato: 'video', pais: 'es', resp: {}, ...(over.entrevista || {}) },
  });
}

test('CV: nombre, titular, experiencias con fechas, meses sin contar solapes y puesto actual', () => {
  const cv = E.leerCV(CV_ES, '2026-11');
  assert.equal(cv.nombre, 'Marta Vidal Soler');
  assert.equal(cv.titular, 'Analista SOC junior');
  assert.deepEqual(cv.experiencias.map(e => [e.puesto, e.empresa, e.desde, e.hasta, e.actual]), [
    ['Analista SOC N1', 'Ciberdefensa Levante (ficticia)', '2024-03', '2026-11', true],
    ['Técnica de soporte IT', 'Hotel Mediterráneo (ficticio)', '2022-06', '2024-02', false],
  ]);
  assert.equal(cv.meses, 33 + 21);
  assert.equal(cv.anos, 4);
  assert.equal(cv.actual.puesto, 'Analista SOC N1');
  assert.equal(cv.experiencias[0].logros.length, 3);
  assert.equal(cv.logros[0], 'Reduje un 30 % los falsos positivos ajustando 12 reglas de correlación.', 'primero el logro con porcentaje y verbo de mejora');
  assert.ok(cv.tecnologias.includes('EDR') && cv.tecnologias.includes('MITRE ATT&CK'));
  assert.deepEqual(cv.certificaciones, ['eJPT (eLearnSecurity Junior Penetration Tester)', 'CompTIA Security+']);
  assert.deepEqual(cv.contacto, { email: true, telefono: true });
  assert.equal(cv.idioma, 'es');
});

test('CV en inglés: «Present», meses en inglés e idioma detectado', () => {
  const cv = E.leerCV(CV_EN, '2026-11');
  assert.equal(cv.idioma, 'en');
  assert.deepEqual(cv.experiencias.map(e => [e.desde, e.hasta, e.actual]), [['2023-01', '2026-11', true], ['2021-09', '2022-12', false]]);
  assert.equal(cv.logros[0], 'Cut monthly cloud costs by 18% by rightsizing 70 instances.');
});

test('rangos de fechas en los formatos habituales', () => {
  const r = l => { const x = E.leerRango(l, '2026-11'); return x && [x.desde, x.hasta, x.meses]; };
  assert.deepEqual(r('Analista · ACME · marzo de 2021 - junio de 2023'), ['2021-03', '2023-06', 28]);
  assert.deepEqual(r('2019 – 2020'), ['2019-01', '2020-12', 24]);
  assert.deepEqual(r('Sept. 2025 to now'), ['2025-09', '2026-11', 15]);
  assert.deepEqual(r('01/2024 hasta la fecha'), ['2024-01', '2026-11', 35]);
  assert.equal(r('Inglés B2, nivel alto'), null);
  assert.equal(r('2024 - 2020'), null, 'un rango al revés no cuenta');
  assert.equal(E.mesesTotales([{ desde: '2020-01', hasta: '2020-12' }, { desde: '2020-06', hasta: '2021-05' }]), 17, 'los solapes no suman dos veces');
});

test('el guion trae bloques de todos los tipos de pregunta, en orden y con ids únicos', () => {
  const g = guion();
  const orden = GUION_CATEGORIAS.map(c => c.id);
  const cats = g.bloques.map(b => b.cat);
  assert.deepEqual([...new Set(cats)], orden, 'todas las categorías, en el orden de la entrevista');
  assert.deepEqual(cats.map(c => orden.indexOf(c)), cats.map(c => orden.indexOf(c)).slice().sort((a, b) => a - b));
  const ids = g.bloques.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const b of g.bloques) {
    assert.ok(b.pregunta && b.texto, b.id);
    assert.ok(b.claves.length <= 6, b.id);
    assert.ok(b.segundos > 0, b.id);
  }
});

test('«Háblame de ti» se arma con el CV, la marca y el motivo; tu presentación guardada manda', () => {
  const g = guion({ marca: { ventaja: 'que convierto el ruido de alertas en señal', frase: 'Encuentro el hueco y lo cierro.', hilo: 'pasar de soportar a defender' }, entrevista: { resp: { motivoPuesto: 'quiero especializarme en detección' } } });
  const p = g.bloques.find(b => b.id === 'presentacion');
  assert.equal(p.fuente, 'generada');
  for (const t of ['Soy analista SOC junior, con 4 años de experiencia.', 'Ahora trabajo como Analista SOC N1 en Ciberdefensa Levante (ficticia).', 'reduje un 30 %', 'Lo que me diferencia es que convierto el ruido', 'eJPT y CompTIA Security+', 'El hilo de mi carrera es pasar de soportar a defender', 'porque quiero especializarme en detección.', 'Encuentro el hueco y lo cierro.']) {
    assert.ok(p.texto.includes(t), `falta «${t}» en: ${p.texto}`);
  }
  assert.deepEqual(p.huecos, []);
  assert.ok(g.pitch.total >= 80, 'la presentación generada puntúa con el mismo analizador: ' + g.pitch.total);
  const g2 = guion({ presentacion: { texto: 'Mi presentación de siempre.' } });
  assert.equal(g2.bloques.find(b => b.id === 'presentacion').texto, 'Mi presentación de siempre.');
  assert.equal(g2.bloques.find(b => b.id === 'presentacion').fuente, 'presentacion');
});

test('sin datos, el guion marca los huecos entre corchetes en vez de inventar', () => {
  const g = guion({ cvTexto: '', textoOferta: '', baul: [] });
  const hueco = id => g.bloques.find(b => b.id === id).huecos.length;
  assert.ok(hueco('motivo-empresa') && hueco('motivo-puesto') && hueco('experiencia') && hueco('logro') && hueco('salario-rango'));
  assert.ok(!g.bloques.some(b => /undefined|null|NaN/.test(b.texto)), 'ningún dato vacío se cuela en el texto');
});

test('técnica: la nota del Baúl responde, lo que solo está en el CV pide un ejemplo y lo que falta se reconoce con honestidad', () => {
  const g = guion();
  const edr = g.bloques.find(b => b.id === 'tec-edr');
  assert.match(edr.texto, /^Un EDR registra lo que pasa en cada equipo y deja aislarlo\. La he usado en producción: investigué alertas y aislé equipos\. Un dato: bajé el triaje de 20 a 8 minutos\.$/);
  assert.equal(edr.fuente, 'baul:n_edr');
  assert.match(g.bloques.find(b => b.id === 'tec-mitre-att-ck').texto, /^La he usado: escribí 8 playbooks/);
  const siem = g.bloques.find(b => b.id === 'tec-siem');
  assert.equal(siem.fuente, 'hueco');
  assert.match(siem.texto, /^Todavía no la he usado en un entorno real/);
  // El banco de preguntas técnicas se suma a las posibles preguntas.
  const ps = g.probables.map(p => p.pregunta);
  assert.ok(ps.includes(PREGUNTAS_TEC.EDR[0].es) && ps.includes(PREGUNTAS_TEC.SIEM[0].es));
  assert.ok(g.probables.filter(p => p.cat === 'tecnica').every(p => p.motivo === 'oferta' && p.bloque));
});

test('salario en dos tiempos: primero no cerrarse y, si insisten, un rango con argumento', () => {
  assert.deepEqual(E.salarioEnOferta(OFERTA), { min: 32000, max: 38000 });
  assert.deepEqual(E.salarioEnOferta('Salary: £? no; €45k-€55k gross'), { min: 45000, max: 55000 });
  assert.deepEqual(E.salarioEnOferta('Salario hasta 40.000 euros brutos'), { min: 40000, max: 40000 });
  assert.equal(E.salarioEnOferta('Somos 250 personas en 12 oficinas desde 2005'), null, 'cifras sin contexto de salario no cuentan');
  const sin = guion({ textoOferta: '', entrevista: { resp: { salarioMin: 30000, salarioObjetivo: 35000, salarioAncla: 39000, salarioPagas: 14, condiciones: 'teletrabajo y formación' } } });
  const b = id => sin.bloques.find(x => x.id === id);
  assert.equal(b('salario').texto, 'Prefiero no cerrarme a una banda salarial concreta y centrarme en esta posición. ¿Cuál es la banda prevista para el puesto?');
  assert.equal(b('salario-rango').pregunta, '¿Y una cifra concreta?');
  assert.match(b('salario-rango').texto.replace(/\u00a0/g, ' '), /^Teniendo en cuenta logros como reduje un 30 % los falsos positivos ajustando 12 reglas de correlación y el proyecto de Acme, busco posiciones entre 35\.000 € y 39\.000 € brutos anuales, en 14 pagas\. Valoro también teletrabajo y formación\.$/);
  assert.doesNotMatch(sin.bloques.filter(x => x.cat === 'salario').map(x => x.texto).join(' '), /30\.000/, 'el mínimo no se dice nunca');
  assert.match(b('salario-menos').texto.replace(/\u00a0/g, ' '), /Por debajo de 35\.000 € tendría que valorar/);
  assert.match(b('salario-escrito').texto.replace(/\u00a0/g, ' '), /¿sería posible acercarnos a 39\.000 €\?/);
  assert.ok(b('salario').apoyo.some(a => a.includes('convenio colectivo')), 'fuentes para investigar la banda, sin cifras');
  // Con la oferta: la banda publicada y el argumento sale de lo que pide.
  const con = guion({ entrevista: { resp: { salarioMin: 30000, salarioObjetivo: 35000, salarioAncla: 38000 } } });
  assert.match(con.bloques.find(x => x.id === 'salario').texto.replace(/\u00a0/g, ' '), /^La oferta indica 32\.000 € – 38\.000 €/);
  assert.match(con.bloques.find(x => x.id === 'salario-rango').texto, /^Teniendo en cuenta las responsabilidades del puesto \(SOC y EDR\), logros como/);
  assert.match(guion({ entrevista: { resp: { salarioMin: 45000, salarioObjetivo: 50000, salarioAncla: 55000 } } }).bloques.find(x => x.id === 'salario').apoyo[0], /por debajo de tu mínimo/);
  // Sin cifras: huecos, nunca un salario inventado.
  const vacio = guion({ textoOferta: '' }).bloques.find(x => x.id === 'salario-rango');
  assert.deepEqual(vacio.huecos, ['tu objetivo', 'tu ancla']);
  assert.ok(['salario-rango', 'salario-menos'].every(id => guion().probables.some(p => p.bloque === id && p.motivo === 'insisten')));
});

test('preparador de rango: X nunca es el mínimo, ancho máximo del 20 %, ancla por encima y pagas', () => {
  assert.deepEqual(E.prepararRango({ minimo: 30000, objetivo: 35000, ancla: 39000 }), { x: 35000, y: 39000, ancho: 11, avisos: [] });
  assert.deepEqual(E.prepararRango({ minimo: 35000, objetivo: 35000, ancla: 38000 }).avisos, ['x-minimo']);
  assert.deepEqual(E.prepararRango({ objetivo: 35000, ancla: 50000 }), { x: 35000, y: 42000, ancho: 20, avisos: ['ancho'] });
  assert.deepEqual(E.prepararRango({ objetivo: 2500, ancla: 3500, unidad: 'mensual' }), { x: 2500, y: 3000, ancho: 20, avisos: ['ancho'] });
  assert.deepEqual(E.prepararRango({ objetivo: 35000, ancla: 30000 }), { x: 35000, y: null, ancho: null, avisos: ['y-menor'] });
  assert.deepEqual(E.prepararRango({}).avisos, ['sin-objetivo', 'sin-ancla']);
  assert.equal(E.textoPagas({ unidad: 'anual', pagas: 14 }), 'brutos anuales, en 14 pagas');
  assert.equal(E.textoPagas({ unidad: 'mensual', pagas: 13 }), 'brutos al mes, en 13 pagas (con aguinaldo)');
  assert.equal(E.textoPagas({ unidad: 'anual', pagas: 12 }, 'en'), 'gross per year, paid in 12 instalments');
  const en = E.frasesSalario({ objetivo: 40000, ancla: 44000 }, { proyecto: 'Nimbus' }, 'en');
  assert.equal(en.primero, 'I would rather not commit to a specific salary band yet and focus on this role. What is the planned range for the position?');
  assert.equal(en.segundo.replace(/\u00a0/g, ' '), 'Taking into account the project at Nimbus, I am looking for roles between €40,000 and €44,000 gross per year, paid in 14 instalments.');
});

test('ronda salarial: rango justificado con condiciones puntúa 100; una cifra suelta, disculparse o dar el mínimo, no', () => {
  assert.deepEqual(E.cantidades('Entre 35.000 y 39.000 €, o 35k; en 2026 y un 20 %'), [35000, 39000, 35000]);
  const buena = E.evaluarSalario('Teniendo en cuenta las responsabilidades y mis logros, busco entre 35.000 y 39.000 € brutos, y valoro el teletrabajo y la formación.', { minimo: 30000 });
  assert.equal(buena.total, 100);
  assert.equal(buena.repregunta, null);
  const vaga = E.evaluarSalario('Lo siento, no lo sé, lo que me deis estará bien.', { minimo: 30000 });
  assert.equal(vaga.repregunta, 'cifra', 'sin cifra, el recruiter insiste: «¿y una cifra concreta?»');
  assert.ok(!vaga.criterios.find(c => c.id === 'sinDisculpa').ok);
  const suelta = E.evaluarSalario('Pues unos 30.000 euros.', { minimo: 30000 });
  assert.equal(suelta.repregunta, 'rango');
  assert.ok(!suelta.criterios.find(c => c.id === 'rango').ok && !suelta.criterios.find(c => c.id === 'sinMinimo').ok, 'una cifra suelta y además el mínimo');
  assert.equal(E.evaluarSalario('Taking into account my experience, between 40k and 44k, plus remote work.', { idioma: 'en' }).total, 100);
  assert.equal(Object.values(E.RONDA_PESOS).reduce((a, b) => a + b, 0), 100);
});

test('salario anterior: en España se responde con la Ley 3/2023 art. 5 g); fuera de España no aparece', () => {
  const g = guion({ entrevista: { resp: { salarioObjetivo: 35000 } } });
  const b = g.bloques.find(x => x.id === 'salario-historial');
  assert.equal(b.texto, 'Prefiero centrarme en este puesto. ¿Me puedes contar la banda prevista?', 'no da cifras: vuelve a la banda del puesto');
  assert.ok(b.apoyo[0].includes('no podrán hacer a las personas solicitantes preguntas sobre su historial retributivo'), 'cita literal del BOE');
  assert.ok(b.apoyo[0].includes('19 de noviembre de 2026') && b.apoyo[0].includes('Real Decreto-ley 39/2026'));
  assert.equal(SALARIO_LEY.fuente, 'https://www.boe.es/eli/es/rdl/2026/11/17/39');
  assert.equal(g.probables.find(p => p.bloque === 'salario-historial').motivo, 'ley');
  assert.equal(guion({ entrevista: { pais: 'otro' } }).bloques.find(x => x.id === 'salario-historial'), undefined);
});

test('un hueco de más de seis meses en el CV trae su pregunta; sin hueco, no', () => {
  assert.deepEqual(E.huecosCV([{ desde: '2018-01', hasta: '2019-06' }, { desde: '2020-03', hasta: '2022-01' }]), [{ desde: '2019-06', hasta: '2020-03', meses: 8 }]);
  assert.deepEqual(E.huecosCV([{ desde: '2018-01', hasta: '2019-06' }, { desde: '2019-09', hasta: '2022-01' }]), []);
  const conHueco = 'Ana Pérez\nExperiencia\nTécnica · Uno · 01/2018 – 06/2019\nAnalista · Dos · 03/2020 – actualidad';
  const g = guion({ cvTexto: conHueco, mesTexto: iso => iso });
  assert.match(g.bloques.find(b => b.id === 'c-hueco').texto, /^Entre 2019-06 y 2020-03 \[/);
  assert.equal(guion().bloques.find(b => b.id === 'c-hueco'), undefined);
});

test('conducta: cada pregunta probable lleva la mejor historia, sin repetir, en formato STAR resumido', () => {
  const h = (id, comps, r) => ({ id, titulo: 'Historia ' + id, tipo: 'real', s: 'Era lunes en el SOC. Había mucho ruido.', t: 'Tenía que revisar las alertas.', a: 'Analicé los registros. Ajusté la regla. Avisé al equipo.', r, l: '', competencias: comps, creada: '', editada: '' });
  const historias = [h('h1', ['presion', 'resultados'], 'Bajamos un 40 % el ruido.'), h('h2', ['analisis'], 'Detectamos el ataque en 10 minutos.')];
  const g = guion({ historias });
  const star = g.bloques.filter(b => b.cat === 'conducta');
  const usadas = star.filter(b => b.fuente.startsWith('historia:')).map(b => b.fuente);
  assert.ok(usadas.length >= 2);
  assert.equal(new Set(usadas.slice(0, 2)).size, 2, 'dos preguntas no usan la misma historia mientras haya otras');
  const b = star.find(x => x.fuente === 'historia:h1');
  assert.equal(b.texto, 'La situación: era lunes en el SOC. Mi tarea: tenía que revisar las alertas. Lo que hice: analicé los registros. Ajusté la regla. El resultado: bajamos un 40 % el ruido.');
});

test('tus preguntas dependen de quién entrevista y la nota de la empresa va primero', () => {
  const empresa = { id: 'n_emp', tipo: 'empresa', campos: { nombre: 'Acme', hace: 'protege a hospitales', noticia: 'su nuevo SOC en Valencia', encaje: 'quiero trabajar en sanidad', valores: 'cercanía', pregunta: '¿Cómo mide Acme el éxito del SOC' } };
  const g = guion({ baul: [empresa], entrevista: { entrevistadores: ['direccion'] } });
  const b = g.bloques.find(x => x.id === 'tus-preguntas');
  assert.ok(b.texto.startsWith('¿Cómo mide Acme el éxito del SOC.') || b.texto.startsWith('¿Cómo mide Acme el éxito del SOC'));
  const esperado = PREGUNTAS_POR_ENTREVISTADOR.direccion.map(id => PREGUNTAS_ENTREVISTADOR.find(q => q.id === id).es);
  assert.ok(esperado.slice(0, 3).every(q => b.texto.includes(q)));
  assert.equal(g.bloques.find(x => x.id === 'motivo-empresa').texto, 'Acme protege a hospitales. Me llamó la atención su nuevo SOC en Valencia. Encaja conmigo porque quiero trabajar en sanidad.');
});

test('guion en inglés: mismas piezas, textos en inglés y sin el bloque legal español si el país es otro', () => {
  const cv = E.leerCV(CV_EN, '2026-11');
  const g = E.generarGuion({ idioma: 'en', cv, oferta: null, textoOferta: '', historias: [], scoreFn: h => E.scoreStory(h), presentacion: { texto: '' }, marca: {}, baul: [], perfil: { rol: 'cloud' }, preguntasRol: ROLE_CONTENT.cloud.preguntas, comunes: COMUNES, preguntasEntrevistador: PREGUNTAS_ENTREVISTADOR,
    entrevista: { empresa: 'Nimbus', puesto: 'Cloud Engineer', entrevistadores: ['tecnico'], pais: 'otro', resp: {} } });
  assert.match(g.bloques.find(b => b.id === 'presentacion').texto, /^I am a junior Cloud Engineer with 5 years of experience\. I currently work as Cloud Support Engineer at Nimbus Data \(fictitious\)\./);
  assert.equal(g.bloques.find(b => b.id === 'salario-historial'), undefined);
  assert.ok(!g.bloques.some(b => /[áéíóúñ¿¡]/.test(b.texto + b.pregunta)), 'nada en español');
});

test('ediciones a mano: sustituyen el texto del bloque, recalculan huecos y claves, y el resto sigue igual', () => {
  const g = guion();
  const ed = E.aplicarEdiciones(g, { presentacion: 'Soy analista con 3 años en Splunk. [Cierre]', 'no-existe': 'x' });
  const p = ed.bloques.find(b => b.id === 'presentacion');
  assert.equal(p.editado, true);
  assert.deepEqual(p.huecos, ['Cierre']);
  assert.ok(p.claves.includes('Splunk'));
  assert.equal(ed.bloques.length, g.bloques.length);
  assert.equal(ed.bloques.find(b => b.id === 'apertura').texto, g.bloques.find(b => b.id === 'apertura').texto);
  const txt = E.guionTexto(ed, 'Guion · Acme', Object.fromEntries(GUION_CATEGORIAS.map(c => [c.id, c.id.toUpperCase()])));
  assert.ok(txt.startsWith('Guion · Acme\n') && txt.includes('## PRESENTACION') && txt.includes('> Háblame de ti.\nSoy analista con 3 años en Splunk. [Cierre]'));
});

test('plantillas con las mismas claves en los dos idiomas y huecos bien cerrados', () => {
  assert.deepEqual(Object.keys(GUION_TXT.es).sort(), Object.keys(GUION_TXT.en).sort());
  for (const lang of ['es', 'en']) for (const [k, v] of Object.entries(GUION_TXT[lang])) {
    if (typeof v !== 'string') continue;
    assert.equal((v.match(/\[/g) || []).length, (v.match(/\]/g) || []).length, `${lang}.${k}`);
  }
  for (const tec of Object.keys(PREGUNTAS_TEC)) assert.ok(VAC_TECNOLOGIAS.some(x => x[0] === tec), 'tecnología del léxico: ' + tec);
  for (const qs of Object.values(PREGUNTAS_TEC)) for (const q of qs) assert.ok(q.es && q.en);
  for (const [, label] of BAUL_CATEGORIAS) if (label) assert.ok(VAC_TECNOLOGIAS.some(x => x[0] === label), label);
});

test('Baúl: la nota cruza con las tecnologías por nombre, categoría y claves', () => {
  assert.deepEqual(E.tecnologiasNota(NOTA_EDR).sort(), ['CrowdStrike', 'EDR']);
  assert.deepEqual(E.tecnologiasNota({ tipo: 'concepto', campos: { termino: 'Diferencia entre SIEM y SOAR', claves: 'splunk, correlación' } }).sort(), ['SIEM', 'Splunk']);
});

test('saneado: notas por tipo y campo, marca y entrevista con límites; nada de prototipos', () => {
  const raw = E.safeParse(JSON.stringify({
    baul: [NOTA_EDR, { id: 'x1', tipo: 'inventado', campos: { nombre: 'a' } }, { id: 'x2', tipo: 'herramienta', campos: { nombre: '' } },
      { id: 'x3', tipo: 'herramienta', campos: { nombre: 'Wazuh', categoria: 'trampa', nivel: 'experto', extra: 'fuera', uso: 'u'.repeat(5000) } }, { ...NOTA_EDR }],
    marca: { frase: 'f'.repeat(1000), otra: 1 },
    entrevista: { empresa: 'Acme', formato: 'holograma', entrevistadores: ['rrhh', 'rrhh', 'jefe'], resp: { salarioMin: -5, salarioObjetivo: '35000', motivoPuesto: 7 }, ediciones: { presentacion: 'ok', __proto__: 'x', 'mal id!': 'y' } },
  }));
  const s = E.sanitizeState(raw);
  assert.deepEqual(s.baul.map(n => n.id), ['n_edr', 'x3'], 'tipos y títulos válidos, sin ids repetidos');
  assert.deepEqual(Object.keys(s.baul[1].campos), BAUL_TIPOS.find(t => t.id === 'herramienta').campos.map(c => c[0]));
  assert.equal(s.baul[1].campos.categoria, '');
  assert.equal(s.baul[1].campos.nivel, '');
  assert.equal(s.baul[1].campos.uso.length, 800);
  assert.equal(s.marca.frase.length, 300);
  assert.equal('otra' in s.marca, false);
  assert.equal(s.entrevista.formato, 'video');
  assert.deepEqual(s.entrevista.entrevistadores, ['rrhh']);
  assert.equal(s.entrevista.resp.salarioMin, 0);
  assert.equal(s.entrevista.resp.salarioObjetivo, 35000);
  assert.equal(s.entrevista.resp.motivoPuesto, '');
  assert.deepEqual(s.entrevista.ediciones, { presentacion: 'ok' });
  assert.equal(E.emptyState().entrevista, null);
  assert.deepEqual(E.sanitizeState({}).baul, []);
});

test('las frases que el PDF parte por el margen se unen; viñetas, títulos y fechas no', async () => {
  const doc = await E.leerDocumento('cv.pdf', new Uint8Array(fs.readFileSync(new URL('./fixtures/cv/cv-es-chromium.pdf', import.meta.url))));
  const cv = E.leerCV(doc.texto, '2026-11');
  assert.equal(cv.resumen, 'Analista SOC junior con dos años en monitorización y respuesta a incidentes. Me especializo en EDR/XDR y en reducir falsos positivos.');
  assert.deepEqual(E.unirPartidas(['Logré bajar el', 'tiempo de triaje.', '• siguiente viñeta', 'Experiencia', 'analista · 2020 – 2022']), ['Logré bajar el tiempo de triaje.', '• siguiente viñeta', 'Experiencia', 'analista · 2020 – 2022']);
});

test('nivel de idioma del CV y dudas automáticas: años y nivel por debajo de lo que pide la oferta', () => {
  assert.equal(E.nivelIdiomaCV(['Español nativo · Inglés B2'], 'ingles'), 'B2');
  assert.equal(E.nivelIdiomaCV(['English: fluent'], 'ingles'), 'C1');
  assert.equal(E.nivelIdiomaCV(['Francés'], 'ingles'), null);
  const cv = E.leerCV(CV_ES, '2026-11');
  const oferta = E.analyzeOffer('Analista SOC con al menos 5 años de experiencia. Inglés C1 imprescindible.');
  assert.deepEqual(E.dudasOferta(oferta, cv), [{ tipo: 'anos', pide: 5, tienes: 4 }, { tipo: 'idioma', idioma: 'ingles', pide: 'C1', tienes: 'B2' }]);
  assert.deepEqual(E.dudasOferta(E.analyzeOffer('Analista SOC con 2 años de experiencia. Inglés B2.'), cv), [], 'si lo cumples, no hay duda');
  const g = guion({ textoOferta: 'Analista SOC con al menos 5 años de experiencia. Inglés C1 imprescindible.' });
  const anos = g.bloques.find(b => b.id === 'duda-anos');
  assert.equal(anos.pregunta, 'La oferta pide 5 años de experiencia y tú tienes 4 años y 6 meses. ¿Por qué deberíamos elegirte?');
  assert.match(anos.texto, /^Es cierto que llevo 4 años y 6 meses en el sector\. En ese tiempo reduje un 30 %/);
  assert.match(g.bloques.find(b => b.id === 'duda-idioma-ingles').texto, /^Mi nivel es B2\./);
  assert.ok(g.probables.some(p => p.bloque === 'duda-anos' && p.motivo === 'oferta'));
});

test('ninguna cifra salarial en el contenido: Astrolabio no propone salarios', async () => {
  const fs2 = await import('node:fs');
  // Los archivos que hablan de salario (las historias modelo sí pueden citar costes o ahorros de un proyecto).
  const dir = new URL('../app/src/', import.meta.url);
  const files = ['content/guion.js', 'content/comunes.js', 'content/baul.js', 'i18n/es.js', 'i18n/en.js'];
  for (const f of files) {
    const txt = fs2.readFileSync(new URL(f, dir), 'utf8');
    const m = txt.match(/\d{1,3}(?:[.,]\d{3})+\s?(?:€|euros?)|€\s?\d{2,3}[.,]?\d{3}|\d{2,3}\s?k\s?(?:€|euros?)/i);
    assert.equal(m, null, `cifra salarial en ${f}: ${m && m[0]}`);
  }
});
