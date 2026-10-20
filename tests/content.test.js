import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROLE_CONTENT, allQuestions } from '../app/src/content/roles/index.js';
import { COMUNES, GLOSARIO } from '../app/src/content/comunes.js';
import { COMPETENCIAS, COMPETENCIA_IDS, PRINCIPIOS } from '../app/src/content/competencias.js';
import { RECRUITERS } from '../app/src/content/recruiters.js';
import { scoreStory } from '../app/src/engine/score.js';

const RUTAS = ['red', 'blue', 'grc', 'data'];
const todas = [...allQuestions(), ...COMUNES];
const texts = o => JSON.stringify(o);

test('hay 12 competencias con id único', () => {
  assert.equal(COMPETENCIAS.length, 12);
  assert.equal(new Set(COMPETENCIA_IDS).size, 12);
});
test('los 16 principios públicos están y cada uno apunta a competencias válidas', () => {
  assert.equal(PRINCIPIOS.length, 16);
  for (const p of PRINCIPIOS) for (const c of p.comp) assert.ok(COMPETENCIA_IDS.includes(c), p.nombre + ' → ' + c);
});
test('todas las competencias tienen al menos un principio asociado', () => {
  for (const c of COMPETENCIA_IDS) assert.ok(PRINCIPIOS.some(p => p.comp.includes(c)), c);
});
for (const r of RUTAS) {
  test(`ruta ${r}: al menos 25 preguntas y 3 historias modelo`, () => {
    assert.ok(ROLE_CONTENT[r].preguntas.length >= 25, String(ROLE_CONTENT[r].preguntas.length));
    assert.ok(ROLE_CONTENT[r].modelos.length >= 3);
  });
  test(`ruta ${r}: las historias modelo son Brillantes en español y en inglés`, () => {
    for (const m of ROLE_CONTENT[r].modelos) {
      const es = scoreStory(m.es, { idioma: 'es' });
      const en = scoreStory(m.en, { idioma: 'en' });
      assert.equal(es.estado, 'brillante', `${m.id} ES ${es.total} ${es.consejos.map(c => c.id)}`);
      assert.ok(en.total >= 85, `${m.id} EN ${en.total} ${en.consejos.map(c => c.id)}`);
    }
  });
}
test('ninguna pregunta repetida (id ni texto)', () => {
  assert.equal(new Set(todas.map(q => q.id)).size, todas.length);
  assert.equal(new Set(todas.map(q => q.es.toLowerCase())).size, todas.length);
  assert.equal(new Set(todas.map(q => q.en.toLowerCase())).size, todas.length);
});
test('cada pregunta tiene al menos una competencia válida y texto ES y EN', () => {
  for (const q of todas) {
    assert.ok(q.comp.length >= 1, q.id);
    for (const c of q.comp) assert.ok(COMPETENCIA_IDS.includes(c), q.id + ': ' + c);
    assert.ok(q.es.length > 10 && q.en.length > 10, q.id);
  }
});
test('cada competencia tiene preguntas en todas las rutas o en las comunes', () => {
  for (const c of COMPETENCIA_IDS) assert.ok(todas.some(q => q.comp.includes(c)), c);
});
test('las preguntas trampa llevan guía de respuesta', () => {
  for (const q of COMUNES.filter(q => q.trampa)) assert.ok(q.guia && q.guia.es && q.guia.en, q.id);
});
test('ningún contenido contiene < ni >', () => {
  for (const blob of [ROLE_CONTENT, COMUNES, GLOSARIO, COMPETENCIAS, PRINCIPIOS, RECRUITERS]) assert.ok(!/[<>]/.test(texts(blob)));
});
test('glosario sin términos duplicados', () => {
  const g = [...GLOSARIO, ...RUTAS.flatMap(r => ROLE_CONTENT[r].glosario)];
  assert.equal(new Set(g.map(x => x.id)).size, g.length);
  assert.equal(new Set(g.map(x => x.termino.es.toLowerCase())).size, g.length);
});
test('los modelos usan competencias válidas', () => {
  for (const r of RUTAS) for (const m of ROLE_CONTENT[r].modelos) for (const c of m.competencias) assert.ok(COMPETENCIA_IDS.includes(c), m.id);
});
test('cinco recruiters y un jefe final', () => {
  assert.equal(RECRUITERS.length, 5);
  assert.equal(RECRUITERS.filter(r => r.jefe).length, 1);
});
