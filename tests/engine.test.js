import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../app/src/engine/index.js';
import { BUENAS, MALAS, BUENA_EN } from './fixtures/historias.js';

const RUTAS = ['red', 'blue', 'grc', 'data'];

// ---------- Constantes ----------
test('los pesos suman 100', () => {
  assert.equal(Object.values(E.PESOS).reduce((a, b) => a + b, 0), 100);
});
test('el reparto ideal es coherente (mínimo < máximo) y la acción es el bloque mayor', () => {
  for (const b of E.BLOQUES) assert.ok(E.REPARTO[b].min < E.REPARTO[b].max);
  assert.ok(E.REPARTO.a.min > E.REPARTO.s.max);
});
test('los umbrales crecen con el nivel', () => {
  const n = E.NIVELES.map(k => E.UMBRALES[k].lista);
  assert.deepEqual(n, [...n].sort((a, b) => a - b));
  for (const k of E.NIVELES) assert.ok(E.UMBRALES[k].lista < E.UMBRALES[k].brillante);
});
test('la duración usa 140 palabras por minuto', () => {
  assert.equal(E.DURACION.palabrasPorMinuto, 140);
});

// ---------- Utilidades de texto ----------
test('wordCount cuenta palabras con cifras y porcentajes', () => {
  assert.equal(E.wordCount('Reduje el tiempo un 35 % en 2 días.'), 8);
  assert.equal(E.wordCount(''), 0);
  assert.equal(E.wordCount(null), 0);
});
test('countPhrase respeta los límites de palabra', () => {
  assert.equal(E.countPhrase('algo, algoritmo y algo más', 'algo'), 2);
  assert.equal(E.countPhrase('Un poco de un poco', 'un poco'), 2);
});
test('fold quita tildes para buscar sin acentos', () => {
  assert.equal(E.fold('Constelación ÉTICA'), 'constelacion etica');
});

// ---------- Reparto ----------
test('el reparto calcula porcentajes por bloque', () => {
  const r = E.distribution({ s: 'uno dos', t: 'tres', a: 'cuatro cinco seis siete', r: 'ocho' });
  assert.equal(r.total, 8);
  assert.equal(r.pct.a, 50);
});
test('una situación enorme se marca como «mucho»', () => {
  const r = E.distribution(MALAS.red);
  assert.ok(r.issues.some(i => i.bloque === 's' && i.tipo === 'mucho'));
});
test('una acción corta se marca como «poco»', () => {
  const r = E.distribution(MALAS.red);
  assert.ok(r.issues.some(i => i.bloque === 'a' && i.tipo === 'poco'));
});
test('las historias buenas tienen un reparto sin problemas', () => {
  for (const k of RUTAS) assert.deepEqual(E.distribution(BUENAS[k]).issues, [], k);
});

// ---------- Duración ----------
test('la duración convierte palabras en segundos', () => {
  const d = E.duration({ s: Array(140).fill('palabra').join(' ') });
  assert.equal(d.seconds, 60);
  assert.equal(d.estado, 'corta');
});
test('más de 350 palabras es larga', () => {
  assert.equal(E.duration({ a: Array(400).fill('x').join(' ') }).estado, 'larga');
});
test('las historias buenas duran entre 1 y 2,5 minutos', () => {
  for (const k of RUTAS) assert.equal(E.duration(BUENAS[k]).estado, 'ok', k);
});

// ---------- Yo frente a nosotros ----------
test('detecta verbos en primera persona del singular', () => {
  const y = E.firstPerson('Analicé los registros, decidí escalar y avisé al responsable.');
  assert.equal(y.plural, 0);
  assert.ok(y.singular >= 3);
  assert.ok(y.ok);
});
test('detecta el exceso de «nosotros»', () => {
  const y = E.firstPerson('Hicimos un análisis, decidimos parar y nosotros lo arreglamos. Revisé un log.');
  assert.ok(y.plural >= 3);
  assert.equal(y.ok, false);
});
test('no cuenta palabras como «aquí» o «así» como verbos', () => {
  assert.equal(E.firstPerson('aquí así allí sí').singular, 0);
});
test('en inglés cuenta I frente a we', () => {
  const y = E.firstPerson('We did it. We shipped. I helped.', 'en');
  assert.equal(y.plural, 2);
  assert.equal(y.singular, 1);
  assert.equal(y.ok, false);
});
test('una acción sin verbos personales no aprueba', () => {
  assert.equal(E.firstPerson('Se revisaron los registros.').ok, false);
});

// ---------- Resultado medible ----------
test('una cifra hace medible el resultado', () => {
  assert.ok(E.measurable('Bajó un 35 %').ok);
  assert.ok(E.measurable('Tardamos 4 días').ok);
});
test('un antes y después hace medible el resultado', () => {
  assert.ok(E.measurable('Antes tardaba mucho y después casi nada').ok);
});
test('un resultado vago no es medible', () => {
  assert.equal(E.measurable('Fue bien y el cliente quedó contento').ok, false);
});
test('en inglés, «from … to» cuenta como antes y después', () => {
  assert.ok(E.measurable('It went from weekly to daily reviews', 'en').ok);
});

// ---------- Verbos y muletillas ----------
test('cuenta verbos de acción distintos', () => {
  const v = E.actionVerbs('Analicé el caso, prioricé tareas y automaticé el informe. Analicé otra vez.');
  assert.equal(v.distinct, 3);
  assert.ok(v.ok);
});
test('detecta arranques débiles como «estuve»', () => {
  const v = E.actionVerbs(MALAS.blue.a);
  assert.ok(v.weak.length >= 2);
  assert.equal(v.weak[0], 'estuve');
});
test('detecta muletillas en toda la historia', () => {
  const m = E.fillers(MALAS.red);
  assert.ok(m.total >= 3);
  assert.equal(m.ok, false);
});
test('«intenté» se detecta como vaguedad', () => {
  assert.ok(E.fillers(MALAS.data).found.some(f => f.term === 'intenté'));
});
test('muletillas en inglés', () => {
  assert.ok(E.fillers({ a: 'I basically did stuff, kind of.' }, 'en').total >= 3);
});

// ---------- Aprendizaje ----------
test('el bloque L cuenta como aprendizaje', () => {
  assert.ok(E.learning({ l: 'Aprendí a preguntar antes de actuar.' }).ok);
});
test('un aprendizaje dentro del resultado también cuenta', () => {
  assert.ok(E.learning({ r: 'Funcionó y desde entonces lo aplico.' }).ok);
});
test('sin aprendizaje no aprueba', () => {
  assert.equal(E.learning({ r: 'Funcionó.' }).ok, false);
});

// ---------- Datos sensibles ----------
test('detecta IP reales y no las de documentación', () => {
  const h = E.sensitive({ a: 'Escaneé 10.20.30.40 y 192.0.2.10' });
  assert.deepEqual(h.map(x => x.valor), ['10.20.30.40']);
});
test('detecta correos y dominios internos', () => {
  const h = E.sensitive({ s: 'Escribí a ana@cliente.com desde srv01.corp' });
  assert.ok(h.some(x => x.tipo === 'email'));
  assert.ok(h.some(x => x.tipo === 'dominio' && x.valor === 'srv01.corp'));
});
test('detecta CVE y clientes marcados', () => {
  const h = E.sensitive({ r: 'Explotamos CVE-2024-12345 en Banco Patata' }, ['Banco Patata']);
  assert.ok(h.some(x => x.tipo === 'cve'));
  assert.ok(h.some(x => x.tipo === 'cliente'));
});
test('no repite el mismo dato sensible', () => {
  assert.equal(E.sensitive({ s: '10.1.1.1', a: '10.1.1.1' }).length, 1);
});
test('un dato sensible baja la nota y deja la historia en borrador', () => {
  const s = E.scoreStory({ ...BUENAS.blue, a: BUENAS.blue.a + ' Accedí a 10.4.5.6.' });
  assert.equal(s.estado, 'borrador');
  assert.ok(s.total <= 90);
  assert.equal(s.consejos[0].clave, 'tip.sensible.ip');
});

// ---------- Puntuación ----------
test('una historia vacía puntúa 0', () => {
  const s = E.scoreStory({});
  assert.equal(s.total, 0);
  assert.equal(s.consejos[0].clave, 'tip.vacia');
});
for (const k of RUTAS) {
  test(`ruta ${k}: la buena y la mala dan notas claramente distintas`, () => {
    const g = E.scoreStory(BUENAS[k]);
    const b = E.scoreStory(MALAS[k]);
    assert.ok(g.total - b.total >= 40, `${g.total} frente a ${b.total}`);
    assert.equal(g.estado, 'brillante');
    assert.equal(b.estado, 'borrador');
  });
}
test('la puntuación está entre 0 y 100 y el desglose suma el total sin sensibles', () => {
  for (const k of RUTAS) for (const h of [BUENAS[k], MALAS[k]]) {
    const s = E.scoreStory(h);
    assert.ok(s.total >= 0 && s.total <= 100);
    assert.equal(s.criterios.reduce((n, c) => n + c.puntos, 0), s.total);
  }
});
test('cada criterio no pasa de su peso', () => {
  const s = E.scoreStory(MALAS.red);
  for (const c of s.criterios) assert.ok(c.puntos <= c.max && c.puntos >= 0);
});
test('un bloque vacío genera el consejo «falta»', () => {
  const s = E.scoreStory({ ...BUENAS.red, t: '' });
  assert.ok(s.consejos.some(c => c.id === 'falta-t'));
});
test('mucho «nosotros» genera el consejo con el término más repetido', () => {
  const s = E.scoreStory(MALAS.grc);
  const c = s.consejos.find(x => x.id === 'nosotros');
  assert.ok(c);
  assert.ok(c.params.veces >= 3);
});
test('sin cifra genera el consejo de resultado medible', () => {
  assert.ok(E.scoreStory(MALAS.blue).consejos.some(c => c.id === 'cifra'));
});
test('el nivel senior es más exigente que el junior', () => {
  const h = { ...BUENAS.data, l: '' };
  const j = E.scoreStory(h, { nivel: 'sin-experiencia' });
  const s = E.scoreStory(h, { nivel: 'senior' });
  assert.equal(j.total, s.total);
  assert.ok(E.ESTADOS.indexOf(j.estado) >= E.ESTADOS.indexOf(s.estado));
});
test('el analizador en inglés puntúa bien una historia buena', () => {
  const s = E.scoreStory(BUENA_EN, { idioma: 'en' });
  assert.ok(s.total >= 85, String(s.total));
});
test('analizar con reglas españolas un texto inglés no da «brillante» por casualidad en yo/nosotros', () => {
  const s = E.scoreStory(BUENA_EN, { idioma: 'es' });
  assert.ok(s.total < E.scoreStory(BUENA_EN, { idioma: 'en' }).total);
});
test('el análisis es determinista', () => {
  assert.deepEqual(E.scoreStory(BUENAS.red), E.scoreStory(BUENAS.red));
});

// ---------- Saneado ----------
test('safeParse devuelve null con JSON roto', () => {
  assert.equal(E.safeParse('{roto'), null);
});
test('safeParse descarta __proto__, constructor y prototype', () => {
  const o = E.safeParse('{"__proto__":{"x":1},"a":{"constructor":{"prototype":{"y":2}}}}');
  assert.equal(({}).x, undefined);
  assert.equal(Object.prototype.hasOwnProperty.call(o, '__proto__'), false);
  assert.equal(Object.keys(o.a).length, 0);
});
test('sanitizeState con basura devuelve un estado vacío válido', () => {
  for (const v of [null, 42, 'x', [], { historias: 'no' }]) {
    const s = E.sanitizeState(v);
    assert.deepEqual(s.historias, []);
    assert.equal(s.perfil, null);
  }
});
test('sanitizeState recorta textos largos y quita campos desconocidos', () => {
  const s = E.sanitizeState({ historias: [{ id: 'h_1', titulo: 'x'.repeat(500), s: 'y'.repeat(9000), malo: '<script>' }] });
  assert.equal(s.historias[0].titulo.length, E.LIMITES.titulo);
  assert.equal(s.historias[0].s.length, E.LIMITES.bloque);
  assert.equal('malo' in s.historias[0], false);
});
test('sanitizeState descarta historias sin id válido y duplicadas', () => {
  const s = E.sanitizeState({ historias: [{ id: 'a b' }, { id: 'h_1' }, { id: 'h_1' }] });
  assert.equal(s.historias.length, 1);
});
test('sanitizeState limita el número de historias', () => {
  const hs = Array.from({ length: 400 }, (_, i) => ({ id: 'h_' + i }));
  assert.equal(E.sanitizeState({ historias: hs }).historias.length, E.LIMITES.historias);
});
test('sanitizeState valida el perfil', () => {
  assert.equal(E.sanitizeState({ perfil: { rol: 'hacker' } }).perfil, null);
  const p = E.sanitizeState({ perfil: { rol: 'blue', nivel: 'dios', empresa: 'banca', idioma: 'fr' } }).perfil;
  assert.deepEqual(p, { nombre: '', rol: 'blue', nivel: 'junior', empresa: 'banca', idioma: 'es' });
});
test('sanitizeState filtra competencias desconocidas', () => {
  const s = E.sanitizeState({ historias: [{ id: 'h_1', competencias: ['presion', 'inventada', 'presion'] }] }, { competencias: ['presion'] });
  assert.deepEqual(s.historias[0].competencias, ['presion']);
});
test('sanitizeState limita números y fechas', () => {
  const s = E.sanitizeState({ xp: -5, racha: 'mucho', historialXp: { '2026-10-20': 40, malo: 3 }, duelos: [{ conviccion: 300, fecha: 'ayer', ruta: 'blue' }] });
  assert.equal(s.xp, 0);
  assert.equal(s.racha, 0);
  assert.deepEqual(s.historialXp, { '2026-10-20': 40 });
  assert.equal(s.duelos[0].conviccion, 100);
  assert.equal(s.duelos[0].fecha, '');
});
test('el tipo de historia es real por defecto', () => {
  assert.equal(E.sanitizeState({ historias: [{ id: 'h_1', tipo: 'falso' }] }).historias[0].tipo, 'real');
});
test('una historia de pocas palabras no puede pasar de 35 puntos', () => {
  const s = E.scoreStory({ a: 'Analicé los registros y decidí escalar.' });
  assert.ok(s.total <= 35, String(s.total));
});
