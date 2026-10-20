"""Regenera las capturas del README: cada sección en claro, oscuro y móvil.
Ejecuta: python3 docs/capturas.py  (antes: node app/build.js)"""
import json
import pathlib
import shutil
import sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'tests'))
from helpers import goto, new_page, settle  # noqa: E402
from playwright.sync_api import sync_playwright  # noqa: E402
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent.parent / 'tests' / 'fixtures'))

OUT = pathlib.Path(__file__).resolve().parent / 'img'
EXTRA = pathlib.Path('/workspace/shots')


def demo_state():
    import subprocess
    js = "import('./tests/fixtures/historias.js').then(m => console.log(JSON.stringify(m.BUENAS)))"
    buenas = json.loads(subprocess.check_output(['node', '-e', js], cwd=OUT.parent.parent))
    comps = {'red': ['comunicacion', 'problemas', 'etica'], 'blue': ['presion', 'analisis', 'resultados'], 'grc': ['liderazgo', 'conflictos', 'etica'], 'data': ['analisis', 'resultados', 'cliente']}
    hs = []
    for i, (k, h) in enumerate(buenas.items()):
        hs.append(dict(h, id='h_demo' + str(i), tipo='real', competencias=comps[k], creada='2026-10-1' + str(i), editada='2026-10-1' + str(i + 2)))
    hs.append({'id': 'h_borrador', 'titulo': 'El turno del sábado en el bar', 'tipo': 'real', 's': 'Trabajaba los fines de semana en un bar del centro mientras estudiaba el grado.', 't': 'Había que sacar las mesas.',
               'a': 'Hicimos un reparto de mesas y estuve un poco organizando cosas con los compañeros.', 'r': 'Salió bien.', 'l': '', 'competencias': ['presion', 'equipo'], 'creada': '2026-10-19', 'editada': '2026-10-19'})
    return {'version': 1, 'perfil': {'nombre': 'Ana García', 'rol': 'blue', 'nivel': 'junior', 'empresa': 'banca', 'idioma': 'es'}, 'historias': hs,
            'duelos': [], 'xp': 340, 'racha': 3, 'insignias': [], 'historialXp': {}, 'ajustes': {'sensibles': []}}


SECTIONS = [
    ('inicio', 'inicio', None),
    ('forja', 'forja', None),
    ('editor', 'forja/h_demo1', None),
    ('perfil', 'perfil', None),
    ('ayuda', 'inicio', lambda pg: (pg.click('#help-btn'), pg.click('#tab-metodo'))),
]
for extra in ['constelacion', 'arena', 'progreso', 'insignias']:
    SECTIONS.append((extra, extra, None))


def shoot(browser, name, route, action, theme, mobile, state):
    w, hgt = (390, 844) if mobile else (1280, 820)
    pg = new_page(browser, width=w, height=hgt, theme=theme, state=state)
    goto(pg, route)
    if action:
        action(pg)
    settle(pg)
    pg.wait_for_timeout(250)
    suffix = 'movil' if mobile else theme
    path = OUT / f'{name}-{suffix}.png'
    pg.screenshot(path=str(path))
    pg.context.close()
    if EXTRA.exists():
        shutil.copy(path, EXTRA / f'astrolabio-{name}-{suffix}.png')
    return path


def main(only=None):
    OUT.mkdir(parents=True, exist_ok=True)
    state = demo_state()
    with sync_playwright() as p:
        b = p.chromium.launch()
        # Asistente (sin perfil)
        for theme in ('light', 'dark'):
            pg = new_page(b, width=1280, height=820, theme=theme)
            goto(pg)
            pg.click('label.choice:has(input[value=blue])')
            settle(pg)
            pg.screenshot(path=str(OUT / f'asistente-{theme}.png'))
            if EXTRA.exists():
                shutil.copy(OUT / f'asistente-{theme}.png', EXTRA / f'astrolabio-asistente-{theme}.png')
            pg.context.close()
        for name, route, action in SECTIONS:
            if only and name not in only:
                continue
            for theme, mobile in (('light', False), ('dark', False), ('light', True)):
                print(shoot(b, name, route, action, theme, mobile, state))
        b.close()


if __name__ == '__main__':
    main(sys.argv[1:] or None)
