import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as E from '../app/src/engine/index.js';
import { BUENA_EN, BUENA_EN_GRC, MALA_EN, BUENAS, MALAS } from './fixtures/historias.js';

const sc = (s, idioma = 'en') => E.scoreStory(s, { idioma, nivel: 'junior' });

test('analizador en inglés: las historias buenas llegan a «Lista» o mejor', () => {
  for (const s of [BUENA_EN, BUENA_EN_GRC]) assert.notEqual(sc(s).estado, 'borrador', s.titulo + ' ' + sc(s).total);
});
test('analizador en inglés: la mala se queda en borrador con consejos de «we», cifra y muletillas', () => {
  const r = sc(MALA_EN);
  assert.equal(r.estado, 'borrador');
  const ids = r.consejos.map(c => c.id);
  for (const id of ['nosotros', 'cifra', 'muletilla']) assert.ok(ids.includes(id), id + ' en ' + ids);
});
test('en inglés, «I» + verbo regular en pasado cuenta como verbo de acción', () => {
  const v = E.actionVerbs('I untangled the queue. I then rebalanced the shifts. I personally reconciled both logs.', 'en');
  assert.ok(v.distinct >= 3, JSON.stringify(v.verbs));
  assert.equal(E.actionVerbs('I was interested and I used the tool.', 'en').distinct, 0);
});
test('detección de idioma por historia', () => {
  assert.equal(E.detectLanguage(BUENA_EN), 'en');
  assert.equal(E.detectLanguage(BUENA_EN_GRC), 'en');
  for (const s of Object.values(BUENAS)) assert.equal(E.detectLanguage(s), 'es');
  assert.equal(E.detectLanguage({ s: 'Estaba en el SOC.' }), null, 'muy poco texto');
  assert.equal(E.detectLanguage({}), null);
});
test('una historia en inglés puntúa peor con el léxico español (por eso se detecta el idioma)', () => {
  assert.ok(sc(BUENA_EN_GRC, 'es').total < sc(BUENA_EN_GRC, 'en').total);
});
