import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../app/src/engine/index.js';
import { RECRUITERS } from '../app/src/content/recruiters.js';
import { ROLE_CONTENT } from '../app/src/content/roles/index.js';
import { BUENAS, MALAS } from './fixtures/historias.js';

const R = id => RECRUITERS.find(r => r.id === id);
const sc = s => E.scoreStory(s, { nivel: 'junior' });
const Q = ROLE_CONTENT.blue.preguntas[0];

function playAll(rec, story, respuesta = '') {
  let d = E.newDuel(rec, Q, 'escrito');
  let s = story;
  d = E.playRound(d, rec, sc(s));
  while (!d.fin) {
    const c = E.nextFollowUp(rec, sc(s), d.preguntadas);
    s = E.applyFollowUp(s, c, respuesta);
    d = E.playRound(d, rec, sc(s), { criterio: c });
  }
  return d;
}

test('cada recruiter tiene umbral, ganancia, pesos de criterios válidos y frases bilingües', () => {
  for (const r of RECRUITERS) {
    assert.ok(r.umbral > 0 && r.umbral < 100 && r.ganancia > 0 && r.repreguntas >= 1, r.id);
    for (const k of Object.keys(r.pesos)) assert.ok(k in E.PESOS, r.id + ':' + k);
    for (const f of ['inicio', 'bien', 'mal', 'gana', 'pierde']) assert.ok(r.frases[f].es && r.frases[f].en, r.id + ':' + f);
  }
});
test('una historia buena gana a todos los recruiters salvo, quizá, al jefe', () => {
  for (const r of RECRUITERS.filter(x => !x.jefe)) {
    const d = playAll(r, BUENAS.blue);
    assert.equal(d.fin, 'ganado', r.id + ' ' + d.conviccion);
    assert.equal(d.rondas.length, r.repreguntas + 1);
  }
});
test('una historia mala pierde contra todos, también con la recruiter amable', () => {
  for (const r of RECRUITERS) assert.equal(playAll(r, MALAS.blue).fin, 'perdido', r.id);
});
test('la convicción siempre queda entre 0 y 100 y el cambio está acotado', () => {
  for (const r of RECRUITERS) for (const s of [BUENAS.red, MALAS.red, { titulo: '', s: '', t: '', a: '', r: '' }]) {
    const d = E.convictionDelta(r, sc(s));
    assert.ok(Math.abs(d) <= E.DUELO.maxDelta);
    const pr = E.playRound(E.newDuel(r, Q, 'escrito'), r, sc(s));
    assert.ok(pr.conviccion >= 0 && pr.conviccion <= 100);
  }
});
test('derrota inmediata si la convicción cae por debajo del mínimo', () => {
  const r = R('subeliston');
  let d = { ...E.newDuel(r, Q, 'escrito'), conviccion: 20 };
  d = E.playRound(d, r, sc({ titulo: '', s: '', t: '', a: '', r: '' }));
  assert.equal(d.fin, 'perdido');
  assert.equal(d.rondas.length, 1);
});
test('el tiempo agotado resta la penalización del contrarreloj', () => {
  const r = R('manager');
  const s = sc(BUENAS.data);
  assert.equal(E.convictionDelta(r, s, { tiempoAgotado: true }), E.convictionDelta(r, s) - E.DUELO.penalizacionTiempo);
});
test('las repreguntas atacan lo que falta, sin repetir, y la del jefe pide cifras primero', () => {
  const sinCifra = { ...BUENAS.blue, r: 'Contuvimos el acceso antes de cualquier transferencia y el equipo quedó tranquilo.' };
  assert.equal(E.nextFollowUp(R('subeliston'), sc(sinCifra)), 'cifra');
  const g = E.gaps(R('manager'), sc(MALAS.blue));
  assert.ok(g.length >= 3);
  assert.notEqual(E.nextFollowUp(R('manager'), sc(MALAS.blue), [g[0]]), g[0]);
  assert.equal(E.nextFollowUp(R('rita'), sc(BUENAS.blue), Object.keys(E.PESOS)), 'profundiza');
});
test('responder a la repregunta de la cifra mejora la convicción', () => {
  const r = R('subeliston');
  const sinCifra = { ...BUENAS.blue, r: 'Contuvimos el acceso antes de cualquier transferencia y el equipo quedó tranquilo.' };
  const con = E.applyFollowUp(sinCifra, 'cifra', 'En 18 minutos, y los falsos positivos bajaron un 35 %.');
  assert.match(con.r, /35 %/);
  assert.ok(E.convictionDelta(r, sc(con)) > E.convictionDelta(r, sc(sinCifra)));
  assert.deepEqual(E.applyFollowUp(sinCifra, 'cifra', '   '), sinCifra);
});
test('el bloque de cada repregunta existe y cubre todos los criterios', () => {
  for (const id of [...Object.keys(E.PESOS), 'profundiza']) assert.ok(['s', 't', 'a', 'r', 'l'].includes(E.REPREGUNTA_BLOQUE[id]), id);
});
test('autoevaluación: todas las marcas dan 100 y ninguna 0', () => {
  const all = Object.fromEntries(Object.keys(E.PESOS).map(k => [k, true]));
  assert.equal(E.selfScore(all).total, 100);
  assert.equal(E.selfScore({}).total, 0);
  assert.equal(E.weightedScore(R('rita'), E.selfScore(all)), 100);
});
test('los datos sensibles cuestan convicción', () => {
  const r = R('banca');
  const s = { ...BUENAS.blue, a: BUENAS.blue.a + ' Lo vi desde 10.20.30.40.' };
  assert.ok(E.weightedScore(r, sc(s)) < E.weightedScore(r, sc(BUENAS.blue)));
});
test('recomendación: primero la historia que comparte competencias con la pregunta', () => {
  const hs = [
    { id: 'a', ...BUENAS.data, competencias: ['cliente'] },
    { id: 'b', ...MALAS.blue, competencias: Q.comp.slice(0, 2) },
    { id: 'c', ...BUENAS.blue, competencias: Q.comp.slice(0, 1) },
  ];
  const rec = E.recommendStories(Q, hs, sc);
  assert.equal(rec[0].historia.id, 'b');
  assert.equal(rec[1].historia.id, 'c');
  assert.equal(E.recommendStories(Q, [], sc).length, 0);
});
test('pick es determinista con un generador inyectado', () => {
  assert.equal(E.pick([1, 2, 3], () => 0), 1);
  assert.equal(E.pick([1, 2, 3], () => 0.99), 3);
});
