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


BAUL_DEMO = [
    {'id': 'n_edr', 'tipo': 'herramienta', 'campos': {'nombre': 'CrowdStrike Falcon', 'categoria': 'edr', 'definicion': 'Un EDR que registra lo que pasa en cada equipo y permite aislarlo en segundos',
     'uso': 'investigué 40 alertas diarias y aislé dos equipos con ransomware antes de que cifraran el servidor', 'nivel': 'produccion', 'cifra': 'bajé el tiempo de triaje de 20 a 8 minutos', 'claves': 'edr, xdr, aislamiento'}, 'creada': '2026-11-20', 'editada': '2026-11-22'},
    {'id': 'n_xdr', 'tipo': 'concepto', 'campos': {'termino': 'EDR frente a XDR', 'sencillo': 'Un EDR vigila cada ordenador; un XDR junta esa vigilancia con el correo, la red y las identidades para ver el ataque completo',
     'tecnico': 'El EDR recoge telemetría del endpoint y responde en él; el XDR la correlaciona con otras fuentes en una misma consola', 'ejemplo': 'Un phishing que deja un proceso sospechoso: el EDR lo ve en el portátil y el XDR lo une al correo que lo trajo', 'claves': 'edr, xdr'}, 'creada': '2026-11-21', 'editada': '2026-11-21'},
    {'id': 'n_lab', 'tipo': 'proyecto', 'campos': {'nombre': 'Laboratorio de detección en casa', 'objetivo': 'Aprender a escribir reglas de detección propias', 'hice': 'Monté Wazuh con Sysmon en tres máquinas virtuales y simulé ataques',
     'stack': 'Wazuh, Sysmon, MITRE ATT&CK', 'resultado': '15 reglas propias que detectan 9 técnicas de ATT&CK', 'claves': 'siem, laboratorio'}, 'creada': '2026-11-19', 'editada': '2026-11-19'},
    {'id': 'n_emp', 'tipo': 'empresa', 'campos': {'nombre': 'Acme Seguridad', 'hace': 'protege a hospitales con un SOC propio', 'noticia': 'la apertura de su SOC en Valencia', 'encaje': 'quiero aplicar la detección en un sector donde un incidente afecta a personas',
     'valores': 'cercanía, transparencia', 'pregunta': '¿Cómo medís el éxito del SOC en el primer año?'}, 'creada': '2026-11-22', 'editada': '2026-11-22'},
]
MARCA_DEMO = {'ventaja': 'que convierto el ruido de alertas en detecciones que se pueden medir', 'puntoVista': 'un EDR sin procesos claros solo cambia el sitio donde se acumulan las alertas',
              'frase': 'Encuentro el hueco, lo cierro rápido y lo explico para que todo el equipo lo entienda.', 'hilo': 'pasar de atender a los usuarios a defenderlos'}


def entrevista_demo():
    cv = (OUT.parent.parent / 'tests/fixtures/cv/cv-es.txt').read_text(encoding='utf-8').replace('**', '').replace('## ', '').replace('# ', '')
    return {'empresa': 'Acme Seguridad', 'puesto': 'Analista SOC', 'fecha': '2026-12-02', 'formato': 'video', 'entrevistadores': ['rrhh', 'tecnico'], 'idioma': 'es', 'pais': 'es',
            'oferta': 'Buscamos analista SOC con experiencia en EDR/XDR, SIEM y MITRE ATT&CK. Valoramos el trabajo bajo presión y la comunicación con negocio. Retribución: 32.000 - 38.000 € brutos anuales.',
            'cv': cv, 'cvArchivo': 'cv-marta-vidal.pdf',
            'resp': {'motivoPuesto': 'quiero especializarme en detección y aquí se trabaja con EDR y XDR a diario', 'salida': 'busco especializarme en detección y en mi empresa actual no hay ese puesto',
                     'salarioObjetivo': 35000, 'salarioMin': 31000, 'condiciones': 'teletrabajo y formación', 'disponibilidad': 'En 15 días, por el preaviso.'}, 'ediciones': {}}


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
            'baul': BAUL_DEMO, 'marca': MARCA_DEMO, 'entrevista': entrevista_demo(),
            'candidaturas': json.loads((OUT.parent.parent / 'tests/fixtures/candidaturas-ajs.json').read_text(encoding='utf-8'))['candidaturas'],
            'duelos': [{'fecha': '2026-10-18', 'recruiter': 'rita', 'ruta': 'blue', 'conviccion': 80, 'superado': True, 'modo': 'escrito'}, {'fecha': '2026-10-19', 'recruiter': 'banca', 'ruta': 'blue', 'conviccion': 58, 'superado': False, 'modo': 'contrarreloj'}], 'xp': 340, 'racha': 3, 'ultimoDia': __import__('datetime').date.today().isoformat(), 'insignias': ['primera-historia', 'primera-estrella', 'brillante', 'cinco-historias', 'cifra-en-mano', 'aprendiz', 'primer-duelo', 'primera-victoria', 'racha-3', 'meta-diaria', 'media-constelacion', 'hosteleria'], 'historialXp': {(__import__('datetime').date.today() - __import__('datetime').timedelta(days=i)).isoformat(): v for i, v in enumerate([45, 70, 20, 0, 85, 60, 35, 0, 0, 25])}, 'historialMedia': {(__import__('datetime').date.today() - __import__('datetime').timedelta(days=i)).isoformat(): v for i, v in enumerate([74, 71, 66, 58, 52, 41])}, 'ajustes': {'sensibles': []}}


SECTIONS = [
    ('inicio', 'inicio', None),
    ('forja', 'forja', None),
    ('editor', 'forja/h_demo1', None),
    ('perfil', 'perfil', None),
    ('ayuda', 'inicio', lambda pg: (pg.click('#help-btn'), pg.click('#tab-metodo'))),
]
def _duelo(pg):
    pg.check('input[name=recruiter][value=manager]', force=True)
    pg.click('#arena-start')
    pg.click('#arena-send')
    pg.wait_for_selector('#arena-follow')
    pg.evaluate('() => window.scrollTo(0, 0)')


SECTIONS.append(('constelacion', 'constelacion', None))
SECTIONS.append(('arena-sala', 'arena', None))
SECTIONS.append(('arena', 'arena', _duelo))
for extra in ['progreso', 'insignias']:
    SECTIONS.append((extra, extra, None))


def _vacante(pg):
    pg.click('#vac-ejemplo')
    pg.evaluate('() => window.scrollTo(0, document.getElementById("vac-res-h").offsetTop - 104)')


def _presentacion(pg):
    pg.fill('#pres-texto', 'Actualmente estoy terminando un máster en ciberseguridad y practico cada semana en laboratorios de análisis de alertas, donde he resuelto más de 40 casos. '
            'Antes trabajé ocho años en hostelería: coordiné un equipo de seis personas en temporada alta y aprendí a mantener la calma con el local lleno. '
            'Busco este puesto porque quiero aportar esa calma a vuestro equipo de monitorización.')
    pg.evaluate('() => window.scrollTo(0, 0)')


SECTIONS.append(('vacante', 'vacante', _vacante))
SECTIONS.append(('presentacion', 'presentacion', _presentacion))
SECTIONS.append(('traductor', 'traductor', None))


def _entrevista(pg):
    pg.evaluate('() => window.scrollTo(0, document.getElementById("ent-cv-sec").offsetTop - 96)')


def _guion(pg):
    pg.evaluate('() => window.scrollTo(0, document.getElementById("cat-presentacion").getBoundingClientRect().top + window.scrollY - 200)')


def _directo(pg):
    pg.keyboard.press('2')
    pg.keyboard.press('k')


SECTIONS.append(('entrevista', 'entrevista', _entrevista))
SECTIONS.append(('guion', 'guion', _guion))
SECTIONS.append(('directo', 'directo', _directo))
SECTIONS.append(('baul', 'baul', None))
SECTIONS.append(('marca', 'marca/linkedin', None))
SECTIONS.append(('candidaturas', 'candidaturas', None))


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
