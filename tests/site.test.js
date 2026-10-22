// Página raíz: es la URL que se comparte. Sin estos metadatos, LinkedIn o WhatsApp muestran el enlace sin imagen.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const meta = (prop) => (html.match(new RegExp(`<meta (?:property|name)="${prop}" content="([^"]+)"`)) || [])[1];

test('la raíz lleva título, descripción y Open Graph completos', () => {
  for (const p of ['description', 'og:title', 'og:description', 'og:image', 'og:url', 'og:type', 'twitter:card']) {
    assert.ok(meta(p), `falta ${p}`);
  }
  assert.equal(meta('twitter:card'), 'summary_large_image');
});

test('la imagen de vista previa existe y mide 1200 × 630', () => {
  const url = meta('og:image');
  assert.match(url, /^https:\/\/heindall92\.github\.io\/astrolabio\//);
  const file = new URL('../' + url.replace('https://heindall92.github.io/astrolabio/', ''), import.meta.url);
  assert.ok(existsSync(file), 'no existe ' + file.pathname);
  const png = readFileSync(file);
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert.equal(meta('og:image:width'), '1200');
  assert.equal(meta('og:image:height'), '630');
});

test('la raíz sigue llevando a la app y sin scripts', () => {
  assert.match(html, /http-equiv="refresh" content="0; url=dist\/index\.html"/);
  assert.doesNotMatch(html, /<script/);
});
