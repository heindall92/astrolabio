"""Pruebas de extremo a extremo de Astrolabio (Playwright, Chromium).
Ejecuta: python3 tests/e2e_app.py  (antes: node app/build.js)"""
import json
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from helpers import (PERFIL, SPANISH, check, goto, new_page, no_errors, run, settle, story)  # noqa: E402

BUENA = story('h_buena', 'La alerta de las 3:00',
              'Trabajaba de analista junior en un SOC de un banco mediano durante una guardia nocturna, con un único compañero y más de 200 alertas abiertas en la cola.',
              'Tenía que decidir qué alertas atender primero y si alguna justificaba despertar al responsable de incidentes.',
              'Clasifiqué la cola por criticidad del activo y aislé una alerta de inicio de sesión que el sistema marcaba como falso positivo. Correlacioné los registros del proxy y del directorio y detecté que la misma cuenta había entrado desde dos países en diez minutos. Bloqueé la sesión según el procedimiento, avisé al responsable con un resumen de tres líneas y documenté la cronología mientras él llegaba. Después revisé la regla de detección y propuse un umbral nuevo que tuviera en cuenta los viajes imposibles.',
              'Contuvimos el acceso en 18 minutos, antes de cualquier transferencia, y con la regla nueva los falsos positivos de esa familia bajaron un 35 % el mes siguiente.',
              'La próxima vez documentaría la cronología desde el primer minuto: me habría ahorrado media hora en el informe.', ['presion', 'analisis'])


def state(**kw):
    s = {'version': 1, 'perfil': PERFIL, 'historias': [], 'duelos': [], 'xp': 0, 'racha': 0, 'insignias': [], 'historialXp': {}}
    s.update(kw)
    return s


def t_csp(browser):
    pg = new_page(browser)
    goto(pg)
    csp = pg.get_attribute('meta[http-equiv="Content-Security-Policy"]', 'content')
    for d in ["default-src 'none'", "connect-src 'none'", "script-src 'sha256-", "style-src 'sha256-", 'font-src data:', "base-uri 'none'", "form-action 'none'", "object-src 'none'"]:
        check(d in csp, 'falta en la CSP: ' + d)
    check("'unsafe-inline'" not in csp and "'unsafe-eval'" not in csp, 'CSP con unsafe-*')
    ok = pg.evaluate("() => { try { fetch('https://example.com').catch(() => {}); return true; } catch { return false; } }")
    pg.wait_for_timeout(200)
    check(any('Content Security Policy' in e or 'connect-src' in e for e in pg.errors) or ok, 'fetch no bloqueado')
    pg.errors.clear()
    pg.requests[:] = [u for u in pg.requests if 'example.com' not in u]
    fonts = pg.evaluate("() => document.fonts.check('16px Geist') && document.fonts.check('16px \"Geist Mono\"')")
    check(fonts, 'fuentes incrustadas no cargadas')
    no_errors(pg, 'csp')


def t_wizard(browser):
    pg = new_page(browser)
    goto(pg)
    check(pg.locator('#wiz-next').is_disabled(), 'Siguiente debería estar desactivado sin rol')
    pg.click('label.choice:has(input[value=grc])')
    pg.click('#wiz-next')
    pg.click('label.choice:has(input[value=sin-experiencia])')
    pg.click('#wiz-next')
    pg.click('label.choice:has(input[value=publica])')
    pg.fill('#wiz-nombre', 'Lucía Pérez')
    pg.click('#wiz-next')
    settle(pg)
    check('Lucía' in pg.inner_text('#vh'), 'saludo con el nombre')
    check(pg.inner_text('#avatar') == 'LP', 'iniciales del avatar')
    check('GRC' in pg.inner_text('#pill-profile'), 'píldora de perfil')
    saved = json.loads(pg.evaluate("localStorage.getItem('astrolabio-estado')"))
    check(saved['perfil'] == {'nombre': 'Lucía Pérez', 'rol': 'grc', 'nivel': 'sin-experiencia', 'empresa': 'publica', 'idioma': 'es'}, 'perfil guardado')
    no_errors(pg, 'wizard')


def t_story_crud(browser):
    pg = new_page(browser, state=state())
    goto(pg, 'forja')
    pg.click('text=Nueva historia >> nth=0')
    pg.wait_for_selector('#f-titulo')
    check(pg.inner_text('#score-total') == '0', 'nota inicial 0')
    pg.fill('#f-titulo', BUENA['titulo'])
    for b in 'star':
        pg.fill('#f-' + b, BUENA[b])
    pg.fill('#f-l', BUENA['l'])
    pg.click('label.check:has(input[value=presion])')
    total = int(pg.inner_text('#score-total'))
    check(total >= 90, f'puntuación en vivo alta ({total})')
    check('Brillante' in pg.inner_text('.panel'), 'estado brillante')
    pg.click('#save-story')
    pg.wait_for_selector('#story-list')
    check(pg.locator('#story-list .card').count() == 1, 'una historia en la lista')
    # Editar: añadir un «nosotros» de más y una IP.
    pg.click('#story-list .card')
    pg.wait_for_selector('#f-a')
    pg.fill('#f-a', BUENA['a'] + ' Accedí al servidor 10.20.30.40.')
    tips = pg.inner_text('#tips')
    check('IP real' in tips, 'aviso de IP')
    check('Borrador' in pg.inner_text('.panel'), 'con dato sensible queda en borrador')
    pg.click('#save-story')
    pg.wait_for_selector('#story-list')
    # Recargar: persiste.
    pg.reload()
    pg.wait_for_selector('#story-list')
    check('Borrador' in pg.inner_text('#story-list'), 'persistencia tras recargar')
    # Borrar con confirmación (primero cancelar).
    pg.click('#story-list .card')
    pg.click('#delete-story')
    pg.wait_for_selector('#dlg-confirm[open]')
    pg.keyboard.press('Escape')
    check(pg.locator('#dlg-confirm[open]').count() == 0, 'Escape cierra el diálogo')
    check(pg.evaluate('document.activeElement.id') == 'delete-story', 'el foco vuelve al botón')
    pg.click('#delete-story')
    pg.click('#confirm-ok')
    pg.wait_for_selector('.empty')
    check(json.loads(pg.evaluate("localStorage.getItem('astrolabio-estado')"))['historias'] == [], 'historia borrada')
    no_errors(pg, 'crud')


def t_ensayo(browser):
    pg = new_page(browser, state=state())
    goto(pg, 'forja/nueva')
    check(pg.locator('#ensayo-note').is_hidden(), 'sin aviso en historias reales')
    pg.click('label.check:has(input[value=ensayo])')
    check(pg.locator('#ensayo-note').is_visible(), 'aviso de ensayo visible')
    check('historia real' in pg.inner_text('#ensayo-note'), 'texto del aviso')


def t_corrupt(browser):
    pg = new_page(browser)
    pg.add_init_script("localStorage.setItem('astrolabio-estado', '{roto: sí')")
    goto(pg)
    check(pg.locator('#wiz-next').count() == 1, 'con datos rotos arranca el asistente')
    check(pg.evaluate("localStorage.getItem('astrolabio-estado-corrupto')") == '{roto: sí', 'copia de los datos dañados')
    pg2 = new_page(browser, state={'perfil': PERFIL, 'historias': [{'id': '__proto__'}, {'id': 'h_ok', 'titulo': '<img src=x onerror=alert(1)>', 'a': 'x' * 9000, 'competencias': ['nada', 'presion']}], '__proto__': {'polucion': 1}, 'xp': 'mucho'})
    goto(pg2, 'forja')
    check(pg2.locator('#story-list .card').count() == 1, 'solo la historia válida')
    check(pg2.locator('#story-list img').count() == 0, 'el título se pinta como texto')
    check('<img' in pg2.inner_text('#story-list'), 'texto literal')
    check(pg2.evaluate('({}).polucion === undefined'), 'sin contaminación del prototipo')
    no_errors(pg2, 'corrupt')


def t_shell(browser):
    pg = new_page(browser, state=state(historias=[BUENA]))
    goto(pg)
    # Tema
    pg.click('#theme-btn')
    check(pg.get_attribute('html', 'data-theme') == 'dark' and pg.get_attribute('#theme-btn', 'aria-checked') == 'true', 'tema oscuro')
    durs = pg.evaluate("""() => { const s = getComputedStyle(document.querySelector('.card')); return [s.transitionDuration, document.documentElement.classList.contains('theme-fade')]; }""")
    check(durs[1] and '0.32s' in durs[0], f'fundido de tema único: {durs}')
    # Acento
    pg.click('#accent-btn')
    pg.click('#accent-pop .sw-verde')
    check(pg.get_attribute('html', 'data-accent') == 'verde', 'acento verde')
    pg.keyboard.press('Escape')
    check(pg.locator('#accent-pop').is_hidden(), 'Escape cierra el popover')
    # Idioma
    pg.click('#lang-seg [data-lang=en]')
    check(pg.get_attribute('html', 'lang') == 'en' and pg.inner_text('#nav').startswith('Home'), 'interfaz en inglés')
    pg.click('#lang-seg [data-lang=es]')
    # Ayuda con 6 pestañas
    pg.click('#help-btn')
    check(pg.locator('#dlg-help [role=tab]').count() == 6, 'seis pestañas de ayuda')
    pg.click('#tab-metodo')
    check('50–60 %' in pg.inner_text('#help-panel'), 'Método generado con las constantes')
    pg.keyboard.press('ArrowRight')
    check(pg.get_attribute('#tab-recruiters', 'aria-selected') == 'true', 'flechas entre pestañas')
    pg.keyboard.press('Escape')
    # Búsqueda Ctrl K insensible a acentos
    pg.keyboard.press('Control+k')
    pg.wait_for_selector('#search-input')
    pg.fill('#search-input', 'alerta')
    check(pg.locator('#search-results [role=option]').count() >= 1, 'resultados de búsqueda')
    pg.fill('#search-input', 'presion')
    check('presión' in pg.inner_text('#search-results').lower(), 'búsqueda sin tildes')
    pg.keyboard.press('Escape')
    # Atajos
    pg.keyboard.press('2')
    pg.wait_for_selector('#story-list')
    check('#forja' in pg.url, 'atajo 2 abre la Forja')
    # Lateral plegable
    pg.click('#collapse-btn')
    check(pg.get_attribute('#collapse-btn', 'aria-expanded') == 'false', 'lateral plegado')
    no_errors(pg, 'shell')


def t_mobile(browser):
    pg = new_page(browser, width=390, height=844, state=state(historias=[BUENA]))
    goto(pg)
    check(pg.locator('#side').is_hidden(), 'sin lateral en móvil')
    check(pg.locator('#bnav').is_visible(), 'barra inferior visible')
    check(pg.locator('#bnav a, #bnav button').count() == 5, 'cinco botones abajo')
    pg.click('#more-btn')
    pg.wait_for_selector('#dlg-more[open]')
    more = pg.inner_text('#dlg-more')
    for w in ['Progreso', 'Insignias', 'Perfil', 'Ayuda']:
        check(w in more, 'falta en Más: ' + w)
    check(pg.locator('#dlg-more .swatch').count() == 7, 'los 7 acentos en Más')
    pg.click('#dlg-more .sw-rosa')
    check(pg.get_attribute('html', 'data-accent') == 'rosa', 'acento desde Más')
    pg.keyboard.press('Escape')
    sw = pg.evaluate('document.documentElement.scrollWidth')
    check(sw <= 390, f'sin desbordamiento horizontal ({sw})')
    goto(pg, 'forja/' + BUENA['id'])
    sw = pg.evaluate('document.documentElement.scrollWidth')
    check(sw <= 390, f'editor sin desbordamiento ({sw})')
    no_errors(pg, 'mobile')


def t_export_import(browser):
    pg = new_page(browser, state=state(historias=[BUENA]))
    goto(pg, 'perfil')
    with pg.expect_download() as dl:
        pg.click('text=Exportar mis datos')
    data = json.loads(pathlib.Path(dl.value.path()).read_text(encoding='utf-8'))
    check(data['formato'] == 'yrd-ecosistema' and data['tipo'] == 'historias' and data['datos']['historias'][0]['id'] == 'h_buena', 'sobre yrd-ecosistema')
    data['datos']['historias'].append(dict(BUENA, id='h_dos', titulo='Segunda'))
    tmp = pathlib.Path('/tmp/astrolabio-import.json')
    tmp.write_text(json.dumps(data), encoding='utf-8')
    pg.set_input_files('#import-file', str(tmp))
    pg.wait_for_selector('#dlg-confirm[open]')
    pg.click('#confirm-ok')
    pg.wait_for_function('() => document.body.dataset.route === "inicio"')
    goto(pg, 'forja')
    check(pg.locator('#story-list .card').count() == 2, 'importadas dos historias')
    pg.click('#account-btn') if pg.locator('#account-btn').is_visible() else None
    pg.keyboard.press('Escape')
    goto(pg, 'perfil')
    pg.click('#wipe-btn')
    pg.click('#confirm-ok')
    pg.wait_for_selector('#wiz-next')
    no_errors(pg, 'export')


def t_english(browser):
    en_story = story('h_en', 'The night alert', 'I was on a night shift in a bank SOC.', 'I had to triage the queue.', 'I triaged, isolated and blocked the session.', 'Contained in 18 minutes.')
    pg = new_page(browser, state=state(historias=[en_story]), lang='en')
    for route in ['inicio', 'forja', 'forja/h_en', 'forja/nueva', 'perfil', 'privacidad', 'constelacion', 'arena', 'progreso', 'insignias']:
        goto(pg, route)
        txt = pg.inner_text('body')
        m = SPANISH.search(txt)
        check(not m, f'resto en español en #{route}: «{m.group(0) if m else ""}» … {txt[max(0, (m.start() if m else 0) - 60):(m.end() if m else 0) + 40]!r}')
    pg.click('#help-btn')
    for tab in ['guia', 'metodo', 'recruiters', 'atajos', 'glosario', 'acerca']:
        pg.click('#tab-' + tab)
        txt = pg.inner_text('#help-panel')
        m = SPANISH.search(txt.replace('Ramírez', ''))
        check(not m, f'resto en español en ayuda/{tab}: {m.group(0) if m else ""} … {txt[max(0, (m.start() if m else 0) - 60):(m.end() if m else 0) + 40]!r}')
    no_errors(pg, 'english')


def t_reduced(browser):
    pg = new_page(browser, state=state(historias=[BUENA]), reduced=True)
    goto(pg)
    pg.click('#theme-btn')
    check(not pg.evaluate("document.documentElement.classList.contains('theme-fade')"), 'sin fundido de tema con movimiento reducido')
    no_errors(pg, 'reduced')


def t_constelacion(browser):
    pg = new_page(browser, state=state(historias=[BUENA, dict(BUENA, id='h_dos', titulo='Otra', competencias=['presion'])]))
    goto(pg, 'constelacion')
    check(pg.locator('.sky .star').count() == 3, 'tres estrellas (dos en presión y una en análisis)')
    check(pg.locator('.sky .zone.empty').count() == 10, 'diez constelaciones vacías')
    check('Te faltan' in pg.get_attribute('.sky', 'aria-label'), 'aria-label resumen')
    check(pg.locator('table tbody tr').count() == 12, 'lista equivalente con 12 competencias')
    pg.focus('.sky .star[tabindex="0"]')
    first = pg.evaluate('document.activeElement.dataset.id')
    pg.keyboard.press('ArrowRight')
    second = pg.evaluate('document.activeElement.dataset.id')
    check(first and second and pg.locator('#star-tip').is_visible(), 'flechas entre estrellas y ficha visible')
    pg.keyboard.press('Enter')
    pg.wait_for_selector('#f-titulo')
    check('#forja/' in pg.url, 'Enter abre la historia')
    goto(pg, 'constelacion')
    pg.click('#contenido .card button:has-text("Escribir una historia") >> nth=0')
    pg.wait_for_selector('#f-titulo')
    check(pg.locator('#story-form input[type=checkbox]:checked').count() == 1, 'nueva historia con la competencia que falta')
    box = pg.evaluate("[...document.querySelectorAll('.sky .star .hit')].map(r => r.getBoundingClientRect().width)")
    no_errors(pg, 'constelacion')


def t_contenido(browser):
    pg = new_page(browser, state=state())
    goto(pg, 'forja')
    check(pg.locator('#modelos .card').count() == 3, 'tres historias modelo de la ruta')
    n = int(pg.inner_text('#banco p.small').split()[0])
    check(n >= 25, f'banco con al menos 25 preguntas ({n})')
    pg.select_option('#banco-filtro', 'presion')
    m = int(pg.inner_text('#banco p.small').split()[0])
    check(0 < m < n, 'filtro por competencia')
    pg.click('#modelos .card button >> nth=0')
    pg.wait_for_selector('#f-titulo')
    check(pg.locator('#ensayo-note').is_visible(), 'el modelo se practica como ensayo')
    check(int(pg.inner_text('#score-total')) >= 85, 'el modelo puntúa alto')
    goto(pg, 'forja')
    pg.click('#banco li button >> nth=0')
    pg.wait_for_selector('#pregunta-guia')
    # Búsqueda sin tildes sobre preguntas y glosario
    pg.keyboard.press('Control+k')
    pg.fill('#search-input', 'guardia nocturna')
    pg.fill('#search-input', 'falso positivo')
    txt = pg.inner_text('#search-results').lower()
    check('pregunta' in txt and 'glosario' in txt, 'preguntas y glosario en la búsqueda')
    pg.fill('#search-input', 'estacionalidad')
    check(pg.locator('#search-results [role=option]').count() >= 1, 'glosario de otra ruta')
    pg.fill('#search-input', 'CONVICCION')
    check(pg.locator('#search-results [role=option]').count() >= 1, 'insensible a mayúsculas y tildes')
    pg.keyboard.press('Escape')
    no_errors(pg, 'contenido')


TESTS = [
    ('CSP, fuentes y cero red', t_csp),
    ('asistente de perfil en 3 pasos', t_wizard),
    ('crear, puntuar, editar, recargar y borrar historia', t_story_crud),
    ('historias de ensayo', t_ensayo),
    ('datos corruptos y saneado', t_corrupt),
    ('shell: tema, acento, idioma, ayuda, Ctrl K, atajos', t_shell),
    ('móvil: barra inferior y Más con acentos', t_mobile),
    ('exportar, importar y borrar todo', t_export_import),
    ('inglés sin restos en español', t_english),
    ('movimiento reducido', t_reduced),
    ('constelación accesible con teclado y lista equivalente', t_constelacion),
    ('historias modelo, banco de preguntas y búsqueda', t_contenido),
]

if __name__ == '__main__':
    extra = globals().get('EXTRA_TESTS', [])
    run(TESTS + extra)
