// Lector de documentos: CV en PDF (Chromium y LibreOffice), DOCX, ODT y TXT, y defensas contra archivos maliciosos.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import zlib from 'node:zlib';
import * as E from '../app/src/engine/index.js';

const fx = f => new Uint8Array(fs.readFileSync(new URL('./fixtures/cv/' + f, import.meta.url)));
const lineas = t => t.split('\n').map(l => l.replace(/^[•*\s-]+/, '').trim()).filter(Boolean);
const CLAVE_ES = [
  'Marta Vidal Soler',
  'Analista SOC N1 · Ciberdefensa Levante (ficticia) · 03/2024 – actualidad',
  'Reduje un 30 % los falsos positivos ajustando 12 reglas de correlación.',
  'Escribí 8 playbooks de respuesta a phishing alineados con MITRE ATT&CK.',
  'CompTIA Security+ · 2025',
  'Español nativo · Inglés B2',
];

for (const f of ['cv-es-chromium.pdf', 'cv-es-libreoffice.pdf', 'cv-es.docx', 'cv-es.odt', 'cv-es.txt']) {
  test(`el CV de ejemplo se lee igual en ${f}`, async () => {
    const r = await E.leerDocumento(f, fx(f));
    const ls = lineas(r.texto.replace(/^#+\s*|\*\*/gm, ''));
    for (const l of CLAVE_ES) assert.ok(ls.includes(l), `${f}: falta la línea «${l}»\n${r.texto}`);
    // Sin espacios inventados por el interletraje (el fallo típico de los PDF de navegador).
    assert.doesNotMatch(r.texto, /\bV idal|W azuh|T riaje|A TT/);
  });
}

test('el CV en inglés de LibreOffice conserva acentos, viñetas y guiones', async () => {
  const r = await E.leerDocumento('cv-en-libreoffice.pdf', fx('cv-en-libreoffice.pdf'));
  assert.match(r.texto, /Cloud Support Engineer · Nimbus Data \(fictitious\) · Jan 2023 – Present/);
  assert.match(r.texto, /• Cut monthly cloud costs by 18% by rightsizing 70 instances\./);
  assert.equal(r.formato, 'pdf');
});

/** PDF mínimo escrito a mano: fuente estándar sin anchos, WinAnsi y /Differences con nombres de glifo. */
function pdfMinimo(contenido, { fuente = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>', comprimir = false, extra = '' } = {}) {
  const datos = comprimir ? zlib.deflateSync(Buffer.from(contenido, 'latin1')) : Buffer.from(contenido, 'latin1');
  const partes = [
    '%PDF-1.4\n',
    '1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n',
    '2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n',
    '3 0 obj << /Type /Page /Parent 2 0 R /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >> endobj\n',
  ];
  const cab = Buffer.from(partes.join('') + `4 0 obj << /Length ${datos.length}${comprimir ? ' /Filter /FlateDecode' : ''} >> stream\n`, 'latin1');
  const pie = Buffer.from(`\nendstream endobj\n5 0 obj ${fuente} endobj\n${extra}trailer << /Root 1 0 R >>\n%%EOF\n`, 'latin1');
  return new Uint8Array(Buffer.concat([cab, datos, pie]));
}

test('PDF con fuente WinAnsi: tildes en octal, líneas por posición y saltos con T* y comilla', async () => {
  const pdf = pdfMinimo('BT /F1 12 Tf 14 TL 72 720 Td (Formaci\\363n en ciberseguridad) Tj T* (Segunda l\\355nea) Tj (última) \' ET');
  assert.equal(await E.pdfTexto(pdf), 'Formación en ciberseguridad\nSegunda línea\núltima');
});

test('PDF comprimido con /Differences (como las fuentes Type1 de LaTeX)', async () => {
  const fuente = '<< /Type /Font /Subtype /Type1 /BaseFont /CMR10 /Encoding << /Type /Encoding /Differences [65 /A /n /aacute /l /i /s /i /s /space /d /e /space /r /i /e /s /g /o /s] >> >>';
  const pdf = pdfMinimo('BT /F1 10 Tf 50 700 Td (ABCDEFGHIJKLMNOPQRS) Tj ET', { fuente, comprimir: true });
  assert.equal(await E.pdfTexto(pdf), 'Análisis de riesgos');
});

test('PDF con TJ: un desplazamiento grande es un espacio y el interletraje no', async () => {
  const pdf = pdfMinimo('BT /F1 12 Tf 72 700 Td [(Threat) -300 (hun) 20 (ting)] TJ ET');
  assert.equal(await E.pdfTexto(pdf), 'Threat hunting');
});

test('errores claros: PDF cifrado, escaneado sin texto, formato desconocido y archivo dañado', async () => {
  await assert.rejects(E.leerDocumento('cv.pdf', pdfMinimo('q 0 0 100 100 re f Q')), { codigo: 'sin-texto' });
  const cifrado = new Uint8Array(Buffer.from(Buffer.from(pdfMinimo('BT /F1 12 Tf (x) Tj ET')).toString('latin1').replace('trailer << /Root 1 0 R >>', 'trailer << /Root 1 0 R /Encrypt 9 0 R >>'), 'latin1'));
  await assert.rejects(E.leerDocumento('cv.pdf', cifrado), { codigo: 'cifrado' });
  await assert.rejects(E.leerDocumento('foto.png', new Uint8Array([0x89, 0x50, 0x4e, 0x47])), { codigo: 'formato' });
  await assert.rejects(E.leerDocumento('cv.docx', new Uint8Array([0x50, 0x4b, 3, 4, 0, 0])), { codigo: 'danado' });
  await assert.rejects(E.leerDocumento('cv.docx', new TextEncoder().encode('no soy un zip')), { codigo: 'formato' });
});

test('límites: archivo de más de 10 MB y bomba de descompresión dentro de un DOCX', async () => {
  await assert.rejects(E.leerDocumento('cv.pdf', new Uint8Array(E.DOC_LIMITES.archivo + 1)), { codigo: 'grande' });
  // ZIP con un document.xml que se infla hasta 60 MB (pesa unos 60 KB): se corta en 40 MB.
  const enorme = zlib.deflateRawSync(Buffer.alloc(60_000_000, 0x41), { level: 9 });
  const nombre = Buffer.from('word/document.xml');
  const local = Buffer.alloc(30); local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(8, 8); local.writeUInt32LE(enorme.length, 18); local.writeUInt32LE(1000, 22); local.writeUInt16LE(nombre.length, 26);
  const central = Buffer.alloc(46); central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(8, 10); central.writeUInt32LE(enorme.length, 20); central.writeUInt32LE(1000, 24); central.writeUInt16LE(nombre.length, 28); central.writeUInt32LE(0, 42);
  const offCentral = local.length + nombre.length + enorme.length;
  const fin = Buffer.alloc(22); fin.writeUInt32LE(0x06054b50, 0); fin.writeUInt16LE(1, 8); fin.writeUInt16LE(1, 10); fin.writeUInt32LE(central.length + nombre.length, 12); fin.writeUInt32LE(offCentral, 16);
  const zip = new Uint8Array(Buffer.concat([local, nombre, enorme, central, nombre, fin]));
  // El directorio central miente sobre el tamaño (1000 bytes): el límite real es el de la descompresión.
  await assert.rejects(E.leerDocumento('cv.docx', zip), { codigo: 'grande' });
});

test('el texto del CV se recorta a 20.000 caracteres y lo avisa', async () => {
  const r = await E.leerDocumento('cv.txt', new TextEncoder().encode('Experiencia\n' + 'a '.repeat(15_000)));
  assert.equal(r.texto.length, 20_000);
  assert.equal(r.recortado, true);
});

test('entidades XML y saltos de DOCX y ODT', () => {
  assert.equal(E.docxTexto('<w:p><w:r><w:t>Seguridad &amp; redes</w:t><w:tab/><w:t xml:space="preserve"> 2024</w:t></w:r></w:p><w:p><w:r><w:t>&#xE1;rea</w:t><w:br/><w:t>b</w:t></w:r></w:p>'), 'Seguridad & redes\t 2024\nárea\nb\n');
  assert.equal(E.odtTexto('<office:body><text:h>Perfil</text:h><text:p>Uno<text:s text:c="2"/>dos<text:tab/>tres</text:p></office:body>'), 'Perfil\nUno  dos\ttres\n');
  assert.equal(E.glifo('eacute'), 'é');
  assert.equal(E.glifo('uni00F1'), 'ñ');
  assert.equal(E.glifo('desconocido'), '');
});
