// Genera app/vendor/lucide-icons.json solo con los iconos que usa la app.
// Busca en app/src las cadenas que nombran iconos Lucide.
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const src = path.join(root, 'app/src');
const dir = path.join(root, 'node_modules/lucide-static/icons');
const names = new Set();
function walk(d) {
  for (const f of fs.readdirSync(d)) {
    const p = path.join(d, f);
    if (fs.statSync(p).isDirectory()) walk(p);
    else {
      const txt = fs.readFileSync(p, 'utf8');
      // Cualquier cadena literal que sea el nombre de un icono Lucide (cubre mapas y ternarios).
      for (const m of txt.matchAll(/['"]([a-z][a-z0-9-]+)['"]/g)) if (fs.existsSync(path.join(dir, m[1] + '.svg'))) names.add(m[1]);
      for (const m of txt.matchAll(/(?:icon\(\s*|data-icon=)['"]([a-z0-9-]+)['"]/g)) names.add(m[1]);
    }
  }
}
walk(src);
const out = {};
for (const n of [...names].sort()) {
  const f = path.join(dir, n + '.svg');
  if (!fs.existsSync(f)) { console.error('Icono Lucide inexistente:', n); process.exit(1); }
  const svg = fs.readFileSync(f, 'utf8');
  out[n] = svg.replace(/<!--.*?-->/gs, '').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').replace(/\s+/g, ' ').trim();
}
const version = JSON.parse(fs.readFileSync(path.join(root, 'node_modules/lucide-static/package.json'), 'utf8')).version;
fs.writeFileSync(path.join(root, 'app/vendor/lucide-icons.json'), JSON.stringify({ version, icons: out }, null, 0) + '\n');
console.log(`lucide-icons.json: ${Object.keys(out).length} iconos (lucide-static ${version})`);
