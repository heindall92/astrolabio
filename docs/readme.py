"""Genera README.md con cifras reales (pruebas, preguntas, insignias…) sacadas del propio código.
Ejecuta: python3 docs/readme.py
Con --check no escribe nada: falla si README.md no coincide con lo que generaría (lo usa run_tests.sh)."""
import json
import pathlib
import re
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
EXTRA_ROWS = ['constelacion', 'arena', 'progreso', 'vacante', 'presentacion', 'traductor', 'insignias']  # secciones con capturas ya terminadas
TPL = (ROOT / 'docs' / 'README.template.md').read_text(encoding='utf-8')


def node(js):
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], cwd=ROOT))


def count_node_tests():
    # Ficheros explícitos: `node --test tests/` falla en Node 22 o superior y el README decía «0 pruebas».
    files = sorted(str(f.relative_to(ROOT)) for f in (ROOT / 'tests').glob('*.test.js'))
    out = subprocess.run(['node', '--test', *files], cwd=ROOT, capture_output=True, text=True).stdout
    n = int(re.search(r'^# pass (\d+)', out, re.M).group(1))
    if not n or re.search(r'^# fail [1-9]', out, re.M):
        raise SystemExit('Las pruebas de Node no pasan: no se regenera el README con cifras falsas.')
    return n


def count_py(file):
    src = (ROOT / 'tests' / file).read_text(encoding='utf-8')
    return len(re.findall(r"^\s+\('", src.split('TESTS = [')[1].split(']\n')[0], re.M))


pkg = json.loads((ROOT / 'package.json').read_text(encoding='utf-8'))
c = node("""
const roles = await import('./app/src/content/roles/index.js').catch(() => null);
const com = await import('./app/src/content/comunes.js');
const comp = await import('./app/src/content/competencias.js');
const rec = await import('./app/src/content/recruiters.js');
const ins = await import('./app/src/content/insignias.js').catch(() => null);
const out = { comunes: com.COMUNES.length, competencias: comp.COMPETENCIAS.length, recruiters: rec.RECRUITERS.length, preguntas: {}, modelos: 0, glosario: com.GLOSARIO.length, insignias: 0, secretas: 0 };
if (roles) for (const [k, r] of Object.entries(roles.ROLE_CONTENT)) { out.preguntas[k] = r.preguntas.length; out.modelos += r.modelos.length; out.glosario += r.glosario.length; }
if (ins) { out.insignias = ins.INSIGNIAS.length; out.secretas = ins.INSIGNIAS.filter(i => i.secreta).length; }
console.log(JSON.stringify(out));
""")
icons = len(json.loads((ROOT / 'app/vendor/lucide-icons.json').read_text())['icons'])
vals = {
    'VERSION': pkg['version'],
    'TESTS_NODE': count_node_tests(),
    'TESTS_E2E': count_py('e2e_app.py'),
    'TESTS_A11Y': len(re.findall(r"'(?:light|dark)'", (ROOT / 'tests/a11y_app.py').read_text().split('TESTS = ')[1].split('\n')[0])) * len(re.findall(r'\d{3,4}', (ROOT / 'tests/a11y_app.py').read_text().split('TESTS = ')[1].split('\n')[0])),
    'PREGUNTAS_ROL': sum(c['preguntas'].values()),
    'PREGUNTAS': sum(c['preguntas'].values()) + c['comunes'],
    'COMUNES': c['comunes'],
    'MODELOS': c['modelos'],
    'GLOSARIO': c['glosario'],
    'COMPETENCIAS': c['competencias'],
    'RECRUITERS': c['recruiters'],
    'INSIGNIAS': c['insignias'],
    'SECRETAS': c['secretas'],
    'ICONOS': icons,
}
HIST = [
    ('0.1.0', 'Cimientos: perfil, Forja, motor STAR, shell completo y ayuda'),
    ('0.2.0', 'Constelación de competencias, banco de 104 preguntas, historias modelo y búsqueda'),
    ('0.3.0', 'Arena: cinco recruiters, convicción, repreguntas, informe y modos escrito, voz alta, contrarreloj y sorpresa'),
    ('0.4.0', 'Juego completo: XP, meta diaria, rachas, seis rangos, 34 insignias (4 secretas), jefe final por ruta y carta de oferta'),
    ('0.5.0', 'Analizador en inglés con detección de idioma, entrevista en inglés, chuleta imprimible y ecosistema en «Acerca de»'),
    ('0.6.0', 'Rutas Sistemas y Cloud, Desarrollo, AppSec y DevSecOps, e IA y ML'),
    ('0.7.0', 'Rutas Soporte IT, Proyectos y Agile, UX/UI, Preventa técnica y Cambio de carrera'),
    ('0.7.3', 'Logo: borde fino del bocadillo en el tema oscuro'),
    ('0.7.2', 'Logo: la estrella vuelve a verse en todas las copias, también en el móvil'),
    ('0.7.1', 'Móvil estrecho: barra superior que cabe con cifras grandes, idioma en «Más» y rejillas sin desbordes'),
    ('0.7.4', '`npm test` en Node 22, vista previa con imagen al compartir el enlace y roadmap de crecimiento'),
    ('0.8.0', 'Del filtro a la entrevista: lector de ofertas, viñetas de CV, «Háblame de ti», preguntas difíciles, preguntas para el entrevistador y traductor de experiencia; la app abre siempre en tema claro'),
    ('0.8.1', 'README: novedades de la 0.8 arriba, historial ordenado por versión y comprobación en la CI de que el README está al día'),
]
FILAS = []
ALT_CLARO = {
    'vacante': 'Lector de ofertas: competencias, cobertura con tus historias y años que pide',
    'presentacion': 'Presentación Háblame de ti con puntuación en vivo',
    'traductor': 'Traductor de experiencia por sector',
}
for name, label in [('constelacion', 'Constelación'), ('arena', 'Arena'), ('progreso', 'Progreso'), ('vacante', 'Oferta'),
                    ('presentacion', 'Háblame de ti'), ('traductor', 'Traductor'), ('insignias', 'Insignias')]:
    if (ROOT / 'docs/img' / f'{name}-light.png').exists() and name in EXTRA_ROWS:
        alt = ALT_CLARO.get(name, label)
        FILAS.append(f'| **{label}** | <img src="docs/img/{name}-light.png" width="300" alt="{alt}, tema claro"/> | <img src="docs/img/{name}-dark.png" width="300" alt="{label}, tema oscuro"/> | <img src="docs/img/{name}-movil.png" width="140" alt="{label} en móvil"/> |\n')
vals['FILAS_EXTRA'] = ''.join(FILAS)
# Orden por número de versión, de la más reciente a la más antigua (la lista puede estar desordenada).
HIST.sort(key=lambda x: tuple(int(n) for n in x[0].split('.')), reverse=True)
vals['HISTORIAL'] = '\n'.join(f'- **{v}** · {d}' for v, d in HIST)
out = TPL
for k, v in vals.items():
    out = out.replace('{{' + k + '}}', str(v))
left = re.findall(r'\{\{\w+\}\}', out)
assert not left, left
if '--check' in sys.argv:
    if (ROOT / 'README.md').read_text(encoding='utf-8') != out:
        raise SystemExit('README.md no está al día: ejecuta python3 docs/readme.py y sube el resultado.')
    print('README.md al día.')
else:
    (ROOT / 'README.md').write_text(out, encoding='utf-8')
    print(json.dumps(vals, ensure_ascii=False))
