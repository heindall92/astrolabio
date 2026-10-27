// Genera dist/index.html (un único HTML autónomo con CSP por hashes) y
// dist/artifact/astrolabio.html (sin <head>, para incrustar como artefacto).
// Uso: node app/build.js [--check]  (con --check falla si dist/ no está al día)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const app = path.join(root, 'app');
const read = p => fs.readFileSync(path.join(app, p), 'utf8');
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));

// Orden de concatenación: dependencias primero.
const JS = [
  'src/i18n/es.js', 'src/i18n/en.js',
  'src/content/lexico/es.js', 'src/content/lexico/en.js', 'src/content/vacante.js',
  'src/content/competencias.js', 'src/content/recruiters.js', 'src/content/comunes.js',
  'src/content/roles/red.js', 'src/content/roles/blue.js', 'src/content/roles/grc.js', 'src/content/roles/data.js', 'src/content/roles/cloud.js', 'src/content/roles/dev.js', 'src/content/roles/appsec.js', 'src/content/roles/ia.js', 'src/content/roles/soporte.js', 'src/content/roles/pm.js', 'src/content/roles/ux.js', 'src/content/roles/preventa.js', 'src/content/roles/cambio.js',
  'src/content/roles/index.js', 'src/content/insignias.js', 'src/content/traductor.js',
  'src/engine/constants.js', 'src/engine/analyzer.js', 'src/engine/score.js', 'src/engine/sanitize.js',
  'src/engine/vacante.js', 'src/engine/cv.js', 'src/engine/presentacion.js',
  'src/engine/arena.js', 'src/engine/progress.js',
  'src/ui/core.js', 'src/ui/sound.js', 'src/ui/shell.js', 'src/ui/perfil.js', 'src/ui/inicio.js', 'src/ui/forja.js', 'src/ui/vacante.js',
  'src/ui/constelacion.js', 'src/ui/arena.js', 'src/ui/progreso.js', 'src/ui/insignias.js', 'src/ui/ayuda.js',
  'src/ui/buscar.js', 'src/ui/main.js',
].filter(f => fs.existsSync(path.join(app, f)));

function stripModule(code, file) {
  return code
    .split('\n')
    .filter(l => !/^\s*import\s.+from\s.+;?\s*$/.test(l))
    .filter(l => !/^\s*export\s+\*\s+from/.test(l))
    .map(l => l.replace(/^export\s+(const|let|function|class|async function)\s/, '$1 '))
    .join('\n')
    .replace(/^/, `// ---- ${file} ----\n`);
}

// Todo comparte un ámbito: un nombre repetido en dos módulos rompería el otro en silencio.
{
  const seen = new Map();
  for (const f of JS) for (const m of stripModule(read(f), f).matchAll(/^(?:async\s+)?(?:const|let|function|class)\s+([A-Za-z_$][\w$]*)/gm)) {
    if (seen.has(m[1])) throw new Error(`Nombre repetido en el ámbito común: ${m[1]} (${seen.get(m[1])} y ${f})`);
    seen.set(m[1], f);
  }
}

const b64 = f => fs.readFileSync(path.join(app, 'vendor', f)).toString('base64');
const fonts = `
@font-face{font-family:"Geist";font-style:normal;font-display:swap;font-weight:100 900;src:url(data:font/woff2;base64,${b64('geist-latin-wght-normal.woff2')}) format("woff2")}
@font-face{font-family:"Geist Mono";font-style:normal;font-display:swap;font-weight:100 900;src:url(data:font/woff2;base64,${b64('geist-mono-latin-wght-normal.woff2')}) format("woff2")}
@font-face{font-family:"Sora";font-style:normal;font-display:swap;font-weight:100 800;src:url(data:font/woff2;base64,${b64('sora-latin-wght-normal.woff2')}) format("woff2")}
`;

const icons = JSON.parse(read('vendor/lucide-icons.json'));
const mark = read('vendor/astrolabio-mark.svg').trim();
const markDecor = mark.replace(' role="img" aria-label="Astrolabio"', ' aria-hidden="true" focusable="false"');
const css = fonts + read('src/styles.css');
const js = read('vendor/animateicons.js') + `
(()=>{'use strict';\nconst APP_VERSION=${JSON.stringify(pkg.version)};\nconst ICONS=${JSON.stringify(icons.icons)};\nconst MARK_SVG=${JSON.stringify(mark)};\n${JS.map(f => stripModule(read(f), f)).join('\n')}\n})();`;

// Iconos usados en el HTML estático se sustituyen en el build.
function iconSvg(name, cls = 'ic') {
  if (!icons.icons[name]) throw new Error('Icono no incluido: ' + name + ' (ejecuta npm run icons)');
  return `<svg class="${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${icons.icons[name]}</svg>`;
}
let body = read('src/body.html')
  .replace(/<i data-icon="([a-z0-9-]+)"><\/i>/g, (_, n) => iconSvg(n))
  .replace(/\{\{MARK\}\}/g, markDecor)
  .replace(/\{\{VERSION\}\}/g, pkg.version);

const sha = s => "'sha256-" + crypto.createHash('sha256').update(s, 'utf8').digest('base64') + "'";
const csp = [
  "default-src 'none'",
  `script-src ${sha(js)}`,
  `style-src ${sha(css)}`,
  'font-src data:',
  'img-src data:',
  "media-src 'self'",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "object-src 'none'",
].join('; ');

const favicon = 'data:image/svg+xml;base64,' + Buffer.from(mark).toString('base64');
const head = `<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="${csp}">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="referrer" content="no-referrer">
<meta name="color-scheme" content="light">
<meta name="description" content="Astrolabio: prepara entrevistas con el método STAR. Gratis, de código abierto y sin que tus historias salgan del navegador.">
<meta name="author" content="Yoandy Ramírez Delgado">
<title>Astrolabio · Cuenta tu historia. Gana la entrevista.</title>
<link rel="icon" href="${favicon}">`;

const html = `<!doctype html>
<html lang="es" data-accent="azul">
<head>
${head}
<style>${css}</style>
</head>
<body>
${body}
<script>${js}</script>
</body>
</html>
`;
const artifact = `<style>${css}</style>\n${body}\n<script>${js}</script>\n`;

const outs = { 'dist/index.html': html, 'dist/artifact/astrolabio.html': artifact };
if (process.argv.includes('--check')) {
  let stale = false;
  for (const [f, c] of Object.entries(outs)) {
    const p = path.join(root, f);
    if (!fs.existsSync(p) || fs.readFileSync(p, 'utf8') !== c) { console.error('Desactualizado:', f); stale = true; }
  }
  if (stale) { console.error('Ejecuta node app/build.js y versiona dist/.'); process.exit(1); }
  console.log('dist/ al día');
} else {
  for (const [f, c] of Object.entries(outs)) {
    fs.mkdirSync(path.dirname(path.join(root, f)), { recursive: true });
    fs.writeFileSync(path.join(root, f), c);
  }
  console.log(`dist/index.html ${(html.length / 1024).toFixed(0)} KB · ${JS.length} módulos · ${Object.keys(icons.icons).length} iconos`);
}
