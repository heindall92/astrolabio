// Historias que llegan de otras herramientas del ecosistema (formato «yrd-ecosistema», tipo «historias»).
// El ejemplo lo genera Blue-Jr con su propio motor (scripts/ejemplo-star.mjs) y vive en los dos repositorios.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import * as E from '../app/src/engine/index.js';
import { COMPETENCIA_IDS } from '../app/src/content/competencias.js';

const BLUE_JR = JSON.parse(readFileSync(new URL('./fixtures/historias-blue-jr.json', import.meta.url), 'utf8'));
const mia = { id: 'h_mia', titulo: 'Mi historia', tipo: 'real', s: 'S', t: 'T', a: 'A', r: 'R', l: '', competencias: ['analisis'], creada: '2026-10-01', editada: '2026-10-02' };

test('Blue-Jr: el sobre es del ecosistema y de tipo historias', () => {
  assert.equal(BLUE_JR.formato, 'yrd-ecosistema');
  assert.equal(BLUE_JR.version, 1);
  assert.equal(BLUE_JR.tipo, 'historias');
  assert.equal(BLUE_JR.app, 'blue-jr');
  assert.ok(BLUE_JR.datos.historias.length >= 2);
});

test('Blue-Jr: cada historia pasa el saneado sin perder nada (el formato encaja campo a campo)', () => {
  for (const h of BLUE_JR.datos.historias) {
    assert.deepEqual(E.sanitizeStory(h, COMPETENCIA_IDS), h, h.id);
    assert.ok(h.s && h.t && h.a && h.r && h.l, `${h.id}: los cinco bloques llegan rellenos`);
    // Tus datos: una historia de un simulador es real si lo dice; Blue-Jr lo dice en la situación.
    assert.match(h.s, /simulador de SOC/);
  }
});

test('mergeStories suma las nuevas, deja intactas las que ya tenías y descarta las inválidas', () => {
  const antes = [mia, { ...BLUE_JR.datos.historias[0], titulo: 'La edité en Astrolabio' }];
  const r = E.mergeStories(antes, [...BLUE_JR.datos.historias, { id: 'mal id', titulo: 'x' }, null], COMPETENCIA_IDS);
  assert.equal(r.nuevas, BLUE_JR.datos.historias.length - 1);
  assert.equal(r.repetidas, 1);
  assert.equal(r.descartadas, 2);
  assert.deepEqual(r.historias[0], mia);
  assert.equal(r.historias[1].titulo, 'La edité en Astrolabio', 'una historia ya importada y editada no se pisa');
  assert.deepEqual(r.historias.map(h => h.id), ['h_mia', ...BLUE_JR.datos.historias.map(h => h.id)]);
  assert.deepEqual(antes.map(h => h.id), ['h_mia', BLUE_JR.datos.historias[0].id], 'no modifica la lista de entrada');
});

test('mergeStories respeta el límite de historias y sanea lo que entra', () => {
  const llenas = Array.from({ length: E.LIMITES.historias }, (_, i) => ({ ...mia, id: 'h_' + i }));
  const r = E.mergeStories(llenas, BLUE_JR.datos.historias, COMPETENCIA_IDS);
  assert.equal(r.historias.length, E.LIMITES.historias);
  assert.equal(r.nuevas, 0);
  assert.equal(r.descartadas, BLUE_JR.datos.historias.length);
  const hostil = E.mergeStories([], [{ id: 'bluejr-x', titulo: 'y'.repeat(999), s: 'z'.repeat(9999), competencias: ['analisis', 'inventada'], tipo: 'otro', __proto__: { x: 1 } }], COMPETENCIA_IDS);
  const h = hostil.historias[0];
  assert.equal(h.titulo.length, E.LIMITES.titulo);
  assert.equal(h.s.length, E.LIMITES.bloque);
  assert.deepEqual(h.competencias, ['analisis']);
  assert.equal(h.tipo, 'real');
  for (const v of [null, 'x', 42, {}]) assert.deepEqual(E.mergeStories(v, v, COMPETENCIA_IDS).historias, []);
});
