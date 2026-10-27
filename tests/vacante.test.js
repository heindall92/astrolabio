import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../app/src/engine/index.js';
import { VAC_COMPETENCIAS, VAC_TECNOLOGIAS, CV_CONECTORES, PRESENTACION_MARCAS } from '../app/src/content/vacante.js';
import { COMPETENCIA_IDS } from '../app/src/content/competencias.js';
import { COMUNES, PREGUNTAS_ENTREVISTADOR } from '../app/src/content/comunes.js';
import { TRADUCTOR } from '../app/src/content/traductor.js';
import { ROLE_CONTENT } from '../app/src/content/roles/index.js';
import { OFERTA_SOC, OFERTA_GRC, OFFER_CLOUD, OFERTA_VACIA } from './fixtures/ofertas.js';

const ids = o => o.competencias.map(c => c.id);

// ---------- Léxico ----------
test('el léxico de ofertas cubre las 12 competencias y nada más', () => {
  assert.deepEqual(Object.keys(VAC_COMPETENCIAS).sort(), [...COMPETENCIA_IDS].sort());
  for (const [id, terms] of Object.entries(VAC_COMPETENCIAS)) {
    assert.ok(terms.length >= 6, id);
    assert.equal(new Set(terms).size, terms.length, 'término repetido en ' + id);
  }
});
test('las tecnologías tienen etiqueta única y al menos una variante', () => {
  const labels = VAC_TECNOLOGIAS.map(x => x[0]);
  assert.equal(new Set(labels).size, labels.length);
  for (const t of VAC_TECNOLOGIAS) assert.ok(t.length >= 2, t[0]);
  assert.ok(labels.length >= 100);
});
test('un término no aparece en dos competencias distintas', () => {
  const seen = new Map();
  for (const [id, terms] of Object.entries(VAC_COMPETENCIAS)) for (const t of terms) {
    assert.ok(!seen.has(t), `${t} en ${seen.get(t)} y ${id}`);
    seen.set(t, id);
  }
});
test('los términos son texto plano: sin < ni >', () => {
  assert.ok(!/[<>]/.test(JSON.stringify([VAC_COMPETENCIAS, VAC_TECNOLOGIAS, CV_CONECTORES, PRESENTACION_MARCAS])));
});

// ---------- Plegado ----------
test('foldSameLength quita tildes y mayúsculas sin cambiar la longitud', () => {
  const s = 'Atención al DETALLE, Bajo Presión — C# y Node.js';
  const f = E.foldSameLength(s);
  assert.equal(f.length, s.length);
  assert.equal(f, 'atencion al detalle, bajo presion — c# y node.js');
  assert.equal(E.foldSameLength('Atención'), 'atencion');
});
test('vacFind respeta los límites de palabra y las raíces con *', () => {
  const f = E.foldSameLength('Perfil proactivo; proactividad. JavaScript y Java; excelente Excel. C# y .NET');
  assert.deepEqual(E.vacFind(f, 'proactiv*'), ['proactivo', 'proactividad']);
  assert.deepEqual(E.vacFind(f, 'java'), ['java']);
  assert.deepEqual(E.vacFind(f, 'excel'), ['excel']);
  assert.deepEqual(E.vacFind(f, 'c#'), ['c#']);
  assert.deepEqual(E.vacFind(f, '.net'), ['.net']);
});

// ---------- Oferta ----------
test('oferta de SOC: competencias, tecnologías, años, idioma y modalidad', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  for (const c of ['presion', 'iniciativa', 'aprendizaje', 'analisis', 'equipo', 'comunicacion', 'cliente']) assert.ok(ids(o).includes(c), c);
  assert.equal(o.competencias[0].id, 'presion', 'la más repetida va primero');
  for (const t of ['SIEM', 'Splunk', 'QRadar', 'MITRE ATT&CK', 'Linux', 'eJPT', 'CompTIA Security+']) assert.ok(o.tecnologias.includes(t), t);
  assert.equal(o.anos, 3);
  assert.deepEqual(o.idiomas, [{ id: 'ingles', nivel: 'B2' }]);
  assert.deepEqual(o.modalidad, ['hibrido']);
});
test('los términos se muestran como los escribe la oferta, con tildes y sin contar dos veces', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  const presion = o.competencias.find(c => c.id === 'presion');
  assert.ok(presion.terminos.includes('trabajo bajo presión'));
  assert.ok(!presion.terminos.includes('bajo presión'), 'la expresión corta dentro de la larga no cuenta aparte');
  assert.ok(o.competencias.find(c => c.id === 'analisis').terminos.includes('atención al detalle'));
});
test('oferta de GRC en banca: marcos, remoto, años mínimos e inglés alto', () => {
  const o = E.analyzeOffer(OFERTA_GRC);
  for (const t of ['ISO 27001', 'DORA', 'NIS2', 'Análisis de riesgos', 'Auditoría']) assert.ok(o.tecnologias.includes(t), t);
  for (const c of ['resultados', 'comunicacion', 'etica', 'analisis', 'equipo']) assert.ok(ids(o).includes(c), c);
  assert.equal(o.anos, 2);
  assert.deepEqual(o.modalidad, ['remoto']);
  assert.deepEqual(o.idiomas, [{ id: 'ingles', nivel: 'alto' }]);
});
test('oferta en inglés: se analiza con el mismo léxico', () => {
  const o = E.analyzeOffer(OFFER_CLOUD);
  for (const c of ['aprendizaje', 'iniciativa', 'equipo', 'presion', 'comunicacion', 'problemas']) assert.ok(ids(o).includes(c), c);
  for (const t of ['AWS', 'Azure', 'Terraform', 'Kubernetes', 'CI/CD', 'GitHub Actions', 'Linux']) assert.ok(o.tecnologias.includes(t), t);
  assert.equal(o.anos, 4);
  assert.deepEqual(o.modalidad, ['hibrido']);
  assert.deepEqual(o.idiomas, [{ id: 'ingles', nivel: 'fluent' }]);
});
test('una oferta sin pistas o vacía no inventa nada', () => {
  for (const txt of [OFERTA_VACIA, '', null]) {
    const o = E.analyzeOffer(txt);
    assert.deepEqual(o.competencias, []);
    assert.deepEqual(o.tecnologias, []);
    assert.equal(o.anos, null);
  }
});
test('junior con tres años o más: aviso solo para perfiles sin experiencia o junior', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  assert.equal(E.juniorMismatch(o, 'junior'), true);
  assert.equal(E.juniorMismatch(o, 'sin-experiencia'), true);
  assert.equal(E.juniorMismatch(o, 'mid'), false);
  assert.equal(E.juniorMismatch(E.analyzeOffer(OFERTA_GRC), 'junior'), false);
});

// ---------- Cobertura y preguntas ----------
test('cobertura: cubierta, a medias o sin historia', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  const scored = [
    { historia: { id: 'h1', competencias: ['presion', 'equipo'] }, total: 80, estado: 'lista' },
    { historia: { id: 'h2', competencias: ['aprendizaje'] }, total: 30, estado: 'borrador' },
  ];
  const cov = Object.fromEntries(E.offerCoverage(o, scored).map(c => [c.id, c]));
  assert.equal(cov.presion.estado, 'cubierta');
  assert.deepEqual(cov.presion.historias, ['h1']);
  assert.equal(cov.aprendizaje.estado, 'media');
  assert.equal(cov.analisis.estado, 'sin');
});
test('preguntas probables: las que tocan las competencias que más pide la oferta, sin las de guía', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  const qs = E.likelyQuestions(o, [...ROLE_CONTENT.blue.preguntas, ...COMUNES]);
  assert.equal(qs.length, 5);
  assert.ok(qs.every(q => !q.guia));
  assert.ok(qs.every(q => q.comp.some(c => ids(o).includes(c))));
  assert.ok(qs[0].comp.includes('presion'), 'la primera toca la competencia con más peso');
  assert.deepEqual(E.likelyQuestions(E.analyzeOffer(''), ROLE_CONTENT.blue.preguntas), []);
});

// ---------- CV ----------
const HISTORIA = {
  a: 'Primero analicé las alertas de un mes y clasifiqué cuáles eran reales. Después, ajusté seis reglas del SIEM y excluí las carpetas de pruebas. Validé con dos analistas que no perdíamos ningún hallazgo real. Escribí una guía de una página.',
  r: 'Las alertas bajaron de 600 a 70 por semana. El equipo recuperó la confianza.',
};
test('viñetas de CV: dos acciones en su orden y un resultado con cifra', () => {
  const b = E.bulletsFromStory(HISTORIA, 'es');
  assert.deepEqual(b.map(x => x.tipo), ['accion', 'accion', 'resultado']);
  assert.match(b[0].texto, /^Analicé las alertas/);
  assert.ok(b.some(x => /^Ajusté seis reglas/.test(x.texto)), 'quita «Después,» del principio');
  assert.equal(b[2].texto, 'Las alertas bajaron de 600 a 70 por semana');
  for (const x of b) assert.ok(!/[.;]$/.test(x.texto) && x.texto.length <= E.CV.maxCaracteres + 1);
});
test('viñetas de CV en inglés y con frases largas recortadas', () => {
  const b = E.bulletsFromStory({ a: 'Then I automated the weekly report with Python and cut it from 4 hours to 20 minutes. I trained two colleagues.', r: 'The team saved 15 hours a month.' }, 'en');
  assert.match(b[0].texto, /^I automated the weekly report/);
  assert.equal(b.at(-1).texto, 'The team saved 15 hours a month');
  const largo = E.cleanBullet('Diseñé ' + 'una solución muy completa '.repeat(20));
  assert.ok(largo.length <= E.CV.maxCaracteres + 1 && largo.endsWith('…'));
  assert.deepEqual(E.bulletsFromStory({ a: '', r: '' }), []);
});
test('palabras clave: presentes y ausentes en el CV, sin distinguir tildes', () => {
  const o = E.analyzeOffer(OFERTA_SOC);
  const g = E.keywordGap(o, 'Analista con Splunk, LINUX y redes. Trabajo en equipo y atencion al detalle. eJPT.');
  for (const t of ['Splunk', 'Linux', 'Redes', 'eJPT', 'trabajo en equipo', 'atención al detalle']) assert.ok(g.presentes.includes(t), t);
  for (const t of ['QRadar', 'SIEM', 'trabajo bajo presión']) assert.ok(g.faltan.includes(t), t);
  assert.equal(g.presentes.length + g.faltan.length, new Set([...g.presentes, ...g.faltan]).size);
});

// ---------- Presentación ----------
const PITCH = 'Actualmente estoy terminando un máster en ciberseguridad y practico cada semana en laboratorios de análisis de alertas, donde he resuelto más de 40 casos. ' +
  'Antes trabajé ocho años en hostelería: coordiné un equipo de seis personas en temporada alta, formé a la gente nueva y aprendí a mantener la calma con el local lleno y los clientes esperando. ' +
  'Esa experiencia me dio una forma de trabajar que ahora aplico en seguridad: priorizar rápido, comunicar con claridad y no perder el detalle cuando hay presión. ' +
  'En el máster monté un pequeño SOC con Wazuh, escribí reglas de detección y documenté cada incidente como si fuera para un cliente real, con su cronología, las evidencias y las recomendaciones para que no se repitiera. ' +
  'También preparé una guía de respuesta para ataques de phishing que usaron mis compañeros de promoción. ' +
  'Busco este puesto porque quiero aportar esa calma y esa forma de trabajar a vuestro equipo de monitorización, y seguir aprendiendo de personas con más experiencia que yo en un entorno real.';
test('presentación completa: tres partes, cifra, puesto y duración correcta', () => {
  const p = E.analyzePitch(PITCH, { idioma: 'es' });
  assert.equal(p.estado, 'ok', `${p.palabras} palabras`);
  assert.ok(p.palabras >= p.minPalabras && p.palabras <= p.maxPalabras);
  assert.equal(p.total, 100);
  assert.ok(p.criterios.every(c => c.ok));
});
test('presentación corta y sin cierre: resta duración y por qué este puesto', () => {
  const p = E.analyzePitch('Actualmente soy técnico de sistemas. Antes estudié un grado.', { idioma: 'es' });
  assert.equal(p.estado, 'corta');
  const c = Object.fromEntries(p.criterios.map(x => [x.id, x]));
  assert.equal(c.futuro.puntos, 0);
  assert.equal(c.cifra.puntos, 0);
  assert.ok(p.total < 60);
});
test('presentación de menos de la mitad del tiempo mínimo: la nota no pasa del tope', () => {
  const p = E.analyzePitch('Actualmente estoy terminando un máster. Antes trabajé 8 años en hostelería. Busco este puesto porque quiero aportar a vuestro equipo.', { idioma: 'es' });
  assert.equal(p.tope, true);
  assert.equal(p.total, E.PRESENTACION.topeCorta);
  assert.equal(E.analyzePitch(PITCH, { idioma: 'es' }).tope, false);
});
test('presentación: el nombre del puesto cuenta como cierre y las muletillas restan', () => {
  const p = E.analyzePitch('Ahora trabajo en soporte. Antes fui camarero 5 años. Quiero aportar en Acme Seguridad, básicamente porque me gusta, o sea, mucho.', { idioma: 'es', puesto: 'Acme Seguridad' });
  assert.equal(p.conPuesto, true);
  assert.equal(p.criterios.find(x => x.id === 'futuro').ok, true);
  assert.equal(p.criterios.find(x => x.id === 'muletillas').puntos, 0);
  assert.equal(E.analyzePitch('', {}).total, 0);
});
test('presentación en inglés', () => {
  const p = E.analyzePitch('Currently I work as a support technician. Before that I spent 6 years in retail. I would like to bring that to this role.', { idioma: 'en' });
  for (const id of ['presente', 'pasado', 'futuro', 'cifra']) assert.ok(p.criterios.find(x => x.id === id).ok, id);
});
test('los pesos de la presentación suman 100 y la duración va de 60 a 90 s', () => {
  assert.equal(Object.values(E.PRESENTACION.pesos).reduce((a, b) => a + b, 0), 100);
  const p = E.analyzePitch('x', {});
  assert.equal(p.minPalabras, 140);
  assert.equal(p.maxPalabras, 210);
});

// ---------- Contenido nuevo ----------
test('preguntas difíciles nuevas con guía, y «Háblame de ti» enlazada con la presentación', () => {
  for (const id of ['c-hablame', 'c-sobrecualificado', 'c-cambio', 'c-salida', 'c-futuro', 'c-preguntas']) {
    const q = COMUNES.find(x => x.id === id);
    assert.ok(q && q.trampa && q.guia.es && q.guia.en, id);
  }
  assert.ok(COMUNES.find(x => x.id === 'c-hablame').presentacion);
  assert.ok(COMUNES.filter(x => x.etapa).length >= 5);
});
test('preguntas para el entrevistador: al menos 8, bilingües y con su porqué', () => {
  assert.ok(PREGUNTAS_ENTREVISTADOR.length >= 8);
  assert.equal(new Set(PREGUNTAS_ENTREVISTADOR.map(q => q.id)).size, PREGUNTAS_ENTREVISTADOR.length);
  for (const q of PREGUNTAS_ENTREVISTADOR) assert.ok(q.es && q.en && q.por.es && q.por.en, q.id);
});
test('traductor: seis sectores, cuatro situaciones cada uno, competencias válidas y bilingüe', () => {
  assert.ok(TRADUCTOR.length >= 6);
  for (const s of TRADUCTOR) {
    assert.ok(s.items.length >= 4, s.id);
    for (const it of s.items) {
      assert.ok(COMPETENCIA_IDS.includes(it.comp), s.id + ' → ' + it.comp);
      assert.ok(it.es.sit && it.es.como && it.en.sit && it.en.como, s.id);
    }
  }
  assert.ok(!/[<>]/.test(JSON.stringify(TRADUCTOR)));
});
