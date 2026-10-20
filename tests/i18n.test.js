import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { ES } from '../app/src/i18n/es.js';
import { EN } from '../app/src/i18n/en.js';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');

test('ES y EN tienen exactamente las mismas claves', () => {
  const es = Object.keys(ES).sort(), en = Object.keys(EN).sort();
  assert.deepEqual(es.filter(k => !EN[k]), [], 'faltan en EN');
  assert.deepEqual(en.filter(k => !ES[k]), [], 'sobran en EN');
});
test('ningún texto está vacío', () => {
  for (const d of [ES, EN]) for (const [k, v] of Object.entries(d)) assert.ok(typeof v === 'string' && v.trim(), k);
});
test('los marcadores {x} coinciden en ES y EN', () => {
  const ph = s => (s.match(/\{\w+\}/g) || []).sort().join(',');
  for (const k of Object.keys(ES)) assert.equal(ph(EN[k]), ph(ES[k]), k);
});
test('ningún texto contiene < o > (se insertan como texto, pero así no hay dudas)', () => {
  for (const d of [ES, EN]) for (const [k, v] of Object.entries(d)) assert.ok(!/[<>]/.test(v), k);
});
test('todas las claves t(...) usadas en la interfaz existen', () => {
  const dir = path.join(root, 'app/src/ui');
  const missing = [];
  for (const f of fs.readdirSync(dir)) {
    const src = fs.readFileSync(path.join(dir, f), 'utf8');
    for (const m of src.matchAll(/\bt\('([a-zA-Z0-9.\-]+)'\s*[,)]/g)) if (!(m[1] in ES)) missing.push(f + ': ' + m[1]);
  }
  assert.deepEqual(missing, []);
});
test('el texto en inglés no conserva tildes ni signos de apertura del español', () => {
  for (const [k, v] of Object.entries(EN)) {
    if (k.startsWith('acento.') || k === 'lema') continue;
    assert.ok(!/[¿¡áéíóúñ]/i.test(v.replace(/Constelación|Ramírez/g, '')), k + ': ' + v);
  }
});
