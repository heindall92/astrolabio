import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as E from '../app/src/engine/index.js';
import { INSIGNIAS } from '../app/src/content/insignias.js';
import { BUENAS, MALAS } from './fixtures/historias.js';

const base = () => E.emptyState();
const icons = JSON.parse(fs.readFileSync(new URL('../app/vendor/lucide-icons.json', import.meta.url))).icons;

test('XP: sumar actualiza el total, el día y la racha', () => {
  let r = E.addXp(base(), 25, '2026-10-20');
  assert.equal(r.state.xp, 25);
  assert.equal(r.state.historialXp['2026-10-20'], 25);
  assert.equal(r.state.racha, 1);
  r = E.addXp(r.state, 10, '2026-10-20');
  assert.equal(r.state.racha, 1, 'el mismo día no suma racha');
  r = E.addXp(r.state, 10, '2026-10-21');
  assert.equal(r.state.racha, 2);
  r = E.addXp(r.state, 10, '2026-10-24');
  assert.equal(r.state.racha, 1, 'un hueco reinicia la racha');
  assert.equal(E.addXp(base(), 0, '2026-10-20').state.racha, 0, 'sin XP no hay racha');
});
test('la racha cruza meses y años', () => {
  let s = E.addXp(base(), 5, '2026-12-31').state;
  s = E.addXp(s, 5, '2027-01-01').state;
  assert.equal(s.racha, 2);
  assert.equal(E.daysBetween('2026-02-28', '2026-03-01'), 1);
  assert.equal(E.addDays('2026-10-01', -1), '2026-09-30');
});
test('racha visible: se pierde tras un día sin practicar', () => {
  const s = { ...base(), racha: 5, ultimoDia: '2026-10-20' };
  assert.equal(E.currentStreak(s, '2026-10-20'), 5);
  assert.equal(E.currentStreak(s, '2026-10-21'), 5);
  assert.equal(E.currentStreak(s, '2026-10-22'), 0);
  assert.equal(E.currentStreak(base(), '2026-10-22'), 0);
});
test('meta diaria: se avisa solo al cruzarla', () => {
  let r = E.addXp(base(), E.META_DIARIA - 1, '2026-10-20');
  assert.equal(r.metaCumplida, false);
  r = E.addXp(r.state, 1, '2026-10-20');
  assert.equal(r.metaCumplida, true);
  assert.equal(E.addXp(r.state, 50, '2026-10-20').metaCumplida, false);
});
test('rangos: seis, en orden creciente, y progreso hacia el siguiente', () => {
  assert.deepEqual(E.RANGOS.map(r => r.id), ['candidato', 'preseleccionado', 'entrevistado', 'finalista', 'contratado', 'estrella']);
  for (let i = 1; i < E.RANGOS.length; i++) assert.ok(E.RANGOS[i].xp > E.RANGOS[i - 1].xp);
  assert.equal(E.rankFor(0).id, 'candidato');
  assert.equal(E.rankFor(E.RANGOS[1].xp).id, 'preseleccionado');
  assert.equal(E.rankFor(E.RANGOS[1].xp - 1).id, 'candidato');
  assert.equal(E.rankFor(10 ** 7).id, 'estrella');
  assert.equal(E.rankFor(10 ** 7).next, null);
  assert.equal(E.rankFor(75).progress, 0.5);
  const r = E.addXp({ ...base(), xp: 140 }, 20, '2026-10-20');
  assert.equal(r.rangoAntes, 'candidato');
  assert.equal(r.rangoDespues, 'preseleccionado');
});
test('XP de historias: nueva, y cada estado una sola vez', () => {
  assert.equal(E.storyXp(null, 'borrador', true), E.XP.historia);
  assert.equal(E.storyXp(null, 'brillante', true), E.XP.historia + E.XP.lista + E.XP.brillante);
  assert.equal(E.storyXp('lista', 'brillante', false), E.XP.brillante);
  assert.equal(E.storyXp('brillante', 'lista', false), 0, 'bajar de estado no da XP');
  assert.equal(E.storyXp('lista', 'lista', false), 0, 'editar sin mejorar no da XP');
});
test('XP de duelos', () => {
  assert.equal(E.duelXp({ superado: false }, false), E.XP.dueloIntento);
  assert.equal(E.duelXp({ superado: true }, false), E.XP.duelo);
  assert.equal(E.duelXp({ superado: true }, true), E.XP.dueloJefe);
});
test('jefe final: se desbloquea por ruta tras superar a recruiters distintos', () => {
  const d = (recruiter, ruta, superado = true) => ({ recruiter, ruta, superado });
  assert.equal(E.bossUnlocked([], 'blue'), false);
  assert.equal(E.bossUnlocked([d('rita', 'blue'), d('rita', 'blue')], 'blue'), false, 'el mismo recruiter no cuenta dos veces');
  assert.equal(E.bossUnlocked([d('rita', 'blue'), d('manager', 'red')], 'blue'), false, 'otra ruta no cuenta');
  assert.equal(E.bossUnlocked([d('rita', 'blue'), d('manager', 'blue', false)], 'blue'), false, 'perder no cuenta');
  assert.equal(E.bossUnlocked([d('rita', 'blue'), d('manager', 'blue')], 'blue'), true);
  assert.equal(E.bossBeaten([d('subeliston', 'blue')], 'blue'), true);
  assert.equal(E.bossBeaten([d('subeliston', 'blue')], 'red'), false);
});
test('serie de XP: 14 días terminando hoy, con ceros', () => {
  const s = E.xpSeries({ '2026-10-20': 30 }, '2026-10-21', 14);
  assert.equal(s.length, 14);
  assert.equal(s[13].dia, '2026-10-21');
  assert.equal(s[12].xp, 30);
  assert.equal(s[0].dia, '2026-10-08');
});

// ---------- Insignias ----------
test('unas 30 insignias, 4 secretas, ids únicos, textos bilingües e iconos incluidos', () => {
  assert.ok(INSIGNIAS.length >= 28 && INSIGNIAS.length <= 36, String(INSIGNIAS.length));
  assert.equal(INSIGNIAS.filter(b => b.secreta).length, 4);
  assert.equal(new Set(INSIGNIAS.map(b => b.id)).size, INSIGNIAS.length);
  for (const b of INSIGNIAS) {
    assert.ok(b.nombre.es && b.nombre.en && b.desc.es && b.desc.en, b.id);
    assert.ok(icons[b.icono], 'icono ' + b.icono);
    assert.match(b.id, /^[a-z0-9-]+$/);
  }
});
function ctx(state, extra = {}) {
  const scores = state.historias.map(h => E.scoreStory(h, { nivel: 'junior' }));
  return { state, scores, lang: 'es', hour: 12, meta: E.META_DIARIA, competencias: E.coveredCompetencies(state.historias, scores).size, ...extra };
}
const story = (src, i, comps = ['analisis']) => ({ ...src, id: 'h' + i, tipo: 'real', l: src.l || '', competencias: comps });
test('insignias: estado vacío no da ninguna y no se repiten', () => {
  assert.deepEqual(E.newBadges(INSIGNIAS, ctx(base())), []);
  const s = { ...base(), historias: [story(BUENAS.blue, 1)] };
  const first = E.newBadges(INSIGNIAS, ctx(s));
  assert.ok(first.includes('primera-historia') && first.includes('primera-estrella'));
  assert.deepEqual(E.newBadges(INSIGNIAS, ctx({ ...s, insignias: first })), []);
});
test('insignias de historias: borradores no cuentan como estrella', () => {
  const s = { ...base(), historias: [story(MALAS.blue, 1)] };
  const got = E.newBadges(INSIGNIAS, ctx(s));
  assert.ok(got.includes('primera-historia'));
  assert.ok(!got.includes('primera-estrella') && !got.includes('cifra-en-mano'));
});
test('constelación completa con historias listas', () => {
  const comps = ['iniciativa', 'cliente', 'aprendizaje', 'analisis', 'problemas', 'comunicacion', 'equipo', 'liderazgo', 'conflictos', 'presion', 'etica', 'resultados'];
  const hs = [0, 1].map(i => story(Object.values(BUENAS)[i], i, comps.slice(i * 6, i * 6 + 6)));
  const got = E.newBadges(INSIGNIAS, ctx({ ...base(), historias: hs }));
  assert.ok(got.includes('constelacion-completa') && got.includes('media-constelacion'));
});
test('insignias de duelos, rachas y secretas', () => {
  const d = (recruiter, superado, modo = 'escrito', ruta = 'blue', conviccion = 80) => ({ recruiter, superado, modo, ruta, conviccion, fecha: '2026-10-20' });
  const s = { ...base(), racha: 7, historialXp: { '2026-10-20': E.META_DIARIA },
    duelos: [d('rita', true, 'contrarreloj'), d('manager', true, 'sorpresa'), d('banca', true), d('startup', true), d('subeliston', true), d('rita', false, 'voz')] };
  const got = E.newBadges(INSIGNIAS, ctx(s));
  for (const id of ['primer-duelo', 'primera-victoria', 'todos-convencidos', 'panel-banca', 'subeliston', 'contrarreloj', 'voz-alta', 'sorpresa', 'racha-3', 'racha-7', 'meta-diaria']) assert.ok(got.includes(id), id);
  for (const id of ['racha-30', 'subeliston-todas', 'diez-duelos', 'madrugador', 'remontada', 'bilingue']) assert.ok(!got.includes(id), id);
  assert.ok(E.newBadges(INSIGNIAS, ctx(base(), { hour: 6 })).includes('madrugador'));
  const duel = { registro: d('manager', true, 'escrito', 'blue', 71), detalle: { rondas: [{ conviccion: 25 }, { conviccion: 71 }] } };
  const sec = E.newBadges(INSIGNIAS, ctx(base(), { duel, lang: 'en' }));
  assert.ok(sec.includes('remontada') && sec.includes('por-los-pelos') && sec.includes('bilingue'));
});
test('secreta de hostelería: historia lista que nace en un bar', () => {
  const bar = { ...BUENAS.blue, s: 'Trabajaba los fines de semana en un bar del centro mientras estudiaba, con la terraza llena y solo dos personas en sala.' };
  assert.ok(E.newBadges(INSIGNIAS, ctx({ ...base(), historias: [story(bar, 1)] })).includes('hosteleria'));
});
test('saneado: historialMedia acepta solo fechas y notas 0–100', () => {
  const s = E.sanitizeState({ historialMedia: { '2026-10-20': 250, 'x': 3, '__proto__': 1, '2026-10-21': '40' } });
  assert.deepEqual(s.historialMedia, { '2026-10-20': 100, '2026-10-21': 40 });
});
