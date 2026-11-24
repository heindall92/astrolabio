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
  assert.ok(hueco('motivo-empresa') && hueco('motivo-puesto') && hueco('experiencia') && hueco('logro') && hueco('salario'));
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

test('salario: con la banda de la oferta, con tu rango (empieza en el objetivo, nunca en el mínimo) y sin datos', () => {
  assert.deepEqual(E.salarioEnOferta(OFERTA), { min: 32000, max: 38000 });
  assert.deepEqual(E.salarioEnOferta('Salary: £? no; €45k-€55k gross'), { min: 45000, max: 55000 });
  assert.deepEqual(E.salarioEnOferta('Salario hasta 40.000 euros brutos'), { min: 40000, max: 40000 });
  assert.equal(E.salarioEnOferta('Somos 250 personas en 12 oficinas desde 2005'), null, 'cifras sin contexto de salario no cuentan');
  assert.deepEqual(E.rangoSalarial(30000, 35000), { min: 35000, max: 39000 });
  assert.deepEqual(E.rangoSalarial(30000, 0), { min: 30000, max: 33000 });
  assert.equal(E.rangoSalarial(0, 0), null);
  const conOferta = guion({ entrevista: { resp: { salarioMin: 30000, salarioObjetivo: 35000 } } }).bloques.find(b => b.id === 'salario');
  assert.match(conOferta.texto, /La oferta indica 32\.000 € – 38\.000 €.*en torno a 35\.000 €/);
  const sinOferta = guion({ textoOferta: '', entrevista: { resp: { salarioMin: 30000, salarioObjetivo: 35000, condiciones: 'teletrabajo y formación' } } }).bloques.find(b => b.id === 'salario');
  assert.match(sinOferta.texto, /entre 35\.000 € y 39\.000 € brutos al año, según el paquete completo \(teletrabajo y formación\)\./);
  assert.doesNotMatch(sinOferta.texto, /30\.000/, 'el mínimo no se dice');
  const bajo = guion({ entrevista: { resp: { salarioMin: 45000, salarioObjetivo: 50000 } } }).bloques.find(b => b.id === 'salario');
  assert.match(bajo.apoyo[0], /por debajo de tu mínimo/);
});

test('salario anterior: en España se responde con la Ley 3/2023 art. 5 g); fuera de España no aparece', () => {
  const g = guion({ entrevista: { resp: { salarioObjetivo: 35000 } } });
  const b = g.bloques.find(x => x.id === 'salario-historial');
  assert.match(b.texto, /^Prefiero centrarme en este puesto\./);
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
