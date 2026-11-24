"""0.10 · Tu marca (LinkedIn, CV de resultados, bóveda, Field Notes) y candidaturas (Playwright, Chromium).
Se ejecuta dentro de tests/e2e_app.py (EXTRA_TESTS)."""
import json
import pathlib
import re
from helpers import SPANISH, check, fresh, goto, new_page, no_errors
from e2e_guion import con_entrevista, NOTA_EDR, base

FIX = pathlib.Path(__file__).resolve().parent / 'fixtures'


def historia(id_, comps):
    return {'id': id_, 'titulo': 'Historia ' + id_, 'tipo': 'real', 's': 'Trabajaba en el SOC de un banco con un compañero y doscientas alertas abiertas en la cola.',
            't': 'Tenía que decidir qué alertas atender primero.', 'a': 'Clasifiqué la cola por criticidad. Correlacioné los registros del proxy. Bloqueé la sesión y avisé al responsable con un resumen. Revisé la regla y propuse un umbral nuevo.',
            'r': 'Contuvimos el acceso en 18 minutos y los falsos positivos bajaron un 35 %.', 'l': 'Documentaría desde el minuto uno.', 'competencias': comps, 'creada': '2026-11-01', 'editada': '2026-11-01'}


def estado(pg):
    return json.loads(pg.evaluate("localStorage.getItem('astrolabio-estado')"))


def t_candidaturas(browser):
    pg = new_page(browser, state=con_entrevista())
    goto(pg, 'candidaturas')
    check(pg.locator('#cand-vacio').count() == 1, 'sin candidaturas')
    # Importar la copia de ai-job-search-es: se suman, saneadas.
    pg.set_input_files('#cand-file', str(FIX / 'candidaturas-ajs.json'))
    pg.wait_for_selector('#dlg-confirm[open]')
    check('3 nuevas' in pg.inner_text('#dlg-confirm'), 'resumen de la importación')
    pg.click('#confirm-ok')
    pg.wait_for_selector('#cand-lista article')
    check(pg.locator('#cand-lista article').count() == 3, 'tres abiertas')
    pend = pg.inner_text('#cand-pendientes')
    check('Te toca mover 2' in pend and 'sin respuesta' in pend and 'venció hace' in pend, f'pendientes: {pend}')
    check(pg.locator('#cand-lista a[href^="javascript"]').count() == 0, 'el enlace javascript: no se pinta')
    enlaces = pg.eval_on_selector_all('#cand-lista a[target=_blank]', 'xs => xs.map(a => [a.href, a.rel])')
    check(enlaces and all(h.startswith('https://') and 'noopener' in r and 'noreferrer' in r for h, r in enlaces), f'enlaces externos seguros: {enlaces}')
    # Cambiar el estado desde la tarjeta y filtrar.
    card = pg.locator('#cand-lista article', has_text='Pentester junior')
    card.locator('select').select_option('rechazada')
    pg.wait_for_selector('#cand-lista article')
    check(pg.locator('#cand-lista article').count() == 2, 'la rechazada sale de abiertas')
    pg.click('#cand-filtro button:has-text("Cerradas")')
    check('Pentester junior' in pg.inner_text('#cand-lista'), 'y aparece en cerradas')
    # Nueva candidatura: validación del enlace y guardado.
    goto(pg, 'candidaturas/nueva')
    pg.click('#cand-guardar')
    check(pg.get_attribute('#cand-empresa', 'aria-invalid') == 'true', 'sin empresa ni puesto no se guarda')
    pg.fill('#cand-empresa', 'Faro Ciber (ficticia)')
    pg.fill('#cand-puesto', 'Analista GRC')
    pg.fill('#cand-enlace', 'javascript:alert(1)')
    pg.click('#cand-guardar')
    check(pg.get_attribute('#cand-enlace', 'aria-invalid') == 'true', 'enlace no web rechazado')
    pg.fill('#cand-enlace', 'faro.example.com/empleo')
    pg.select_option('#cand-estado', 'enviada')
    pg.click('#cand-guardar')
    pg.wait_for_selector('#cand-lista')
    nueva = [c for c in estado(pg)['candidaturas'] if c['empresa'] == 'Faro Ciber (ficticia)'][0]
    check(nueva['enlace'] == 'https://faro.example.com/empleo' and nueva['estado'] == 'enviada', f'guardada: {nueva}')
    # Ida y vuelta: exportar en el formato de ai-job-search-es.
    with pg.expect_download() as d:
        pg.click('#cand-exportar')
    copia = json.loads(pathlib.Path(d.value.path()).read_text(encoding='utf-8'))
    check(copia['formato'] == 'ajs-candidaturas' and copia['version'] == 1 and len(copia['candidaturas']) == 4, 'copia en formato ajs-candidaturas')
    # Preparar la entrevista desde una candidatura: avisa porque ya preparabas otra.
    goto(pg, 'candidaturas')
    pg.click('#cand-filtro button:has-text("Todas")')
    pg.locator('#cand-lista article', has_text='Analista GRC').locator('button', has_text='Preparar la entrevista').click()
    pg.wait_for_selector('#dlg-confirm[open]')
    pg.click('#confirm-ok')
    pg.wait_for_function("() => document.body.dataset.route === 'entrevista'")
    check(pg.input_value('#ent-empresa') == 'Faro Ciber (ficticia)' and pg.input_value('#ent-puesto') == 'Analista GRC', 'la entrevista toma empresa y puesto')
    check('Marta Vidal Soler' in estado(pg)['entrevista']['cv'], 'y conserva el CV')
    # Importar desde el menú de la cuenta también reconoce el formato.
    pg.click('#account-btn')
    with pg.expect_file_chooser() as fc:
        pg.click('#account-pop button:has-text("Importar")')
    fc.value.set_files(str(FIX / 'candidaturas-ajs.json'))
    pg.wait_for_selector('#dlg-confirm[open]')
    check('0 nuevas' in pg.inner_text('#dlg-confirm'), 'reimportar no duplica')
    pg.keyboard.press('Escape')
    pg.keyboard.press('Control+k')
    pg.fill('#search-input', 'faro')
    check('candidatura' in pg.inner_text('#search-results').lower(), 'las candidaturas en Ctrl K')
    pg.keyboard.press('Escape')
    no_errors(pg, 'candidaturas')


def t_marca(browser):
    hs = [historia('h1', ['presion', 'analisis']), historia('h2', ['equipo']), historia('h3', ['etica'])]
    pg = new_page(browser, state=con_entrevista(historias=hs))
    goto(pg, 'marca')
    check(pg.get_attribute('#mtab-linkedin', 'aria-current') == 'page', 'abre en LinkedIn')
    t1 = pg.inner_text('#li-titular-0')
    check(t1 == 'Analista SOC junior | Splunk · Wazuh · EDR | Encuentro el hueco y lo cierro', f'titular: {t1}')
    acerca = pg.inner_text('#li-acerca-texto')
    check(acerca.startswith('Encuentro el hueco y lo cierro.') and 'Reduje un 30 %' in acerca, 'acerca de con la frase y los logros')
    check(pg.inner_text('#li-acerca mark.pliegue') == acerca[:210], 'se resalta lo que se ve antes de «ver más»')
    check('SIEM' in pg.inner_text('#li-palabras tr.falta'), 'la oferta pide SIEM y falta en el perfil')
    check(pg.input_value('#li-rec').startswith('Hola, [nombre]:'), 'mensaje de recomendación')
    pg.click('#mtab-cv')
    pg.wait_for_selector('#cvr-kpis')
    check(pg.inner_text('#cvr-pct') == '67 %', 'porcentaje XYZ')
    check('Hice el triaje de 40 alertas' in pg.inner_text('#cvr-vinetas'), 'propone el verbo sin inventar cifras')
    pg.click('#mtab-boveda')
    pg.wait_for_selector('#bov-lista')
    check(pg.locator('#bov-lista article').count() == 3 and pg.inner_text('#bov-n') == '3/6', 'bóveda con las tres historias')
    check(all(pg.locator(f'#bov-{h} li').count() >= 1 for h in ('h1', 'h2', 'h3')), 'cada historia con su «úsala para…»')
    check(pg.locator('#bov-faltan a').count() >= 5, 'competencias sin historia')
    pg.click('#mtab-contenido')
    pg.wait_for_selector('#fn-plan')
    pg.fill('#fn-inicio', '2026-12-01')
    pg.dispatch_event('#fn-inicio', 'change')
    pg.wait_for_selector('#fn-plan')
    pg.click('#fn-cadencia button:has-text("Cada 14 días")')
    item = pg.locator('#fn-n_edr')
    check('1 dic 2026' in item.inner_text() and '#1 · CrowdStrike Falcon' in item.inner_text(), 'la nota del Baúl en el plan')
    item.locator('summary').click()
    ta = item.locator('textarea')
    check(ta.input_value().startswith('Field Notes #1 · Bajé el triaje de 20 a 8 minutos.'), 'borrador con tu cifra de gancho')
    check('Complétalo antes de publicar' in item.inner_text(), 'la revisión avisa del hueco de la lección')
    ta.fill(ta.input_value().replace('[qué harías distinto o qué recomiendas]', 'automatizar el aislamiento con un playbook revisado') + '\nEn el panorama actual esto importa.')
    check('Suena genérico' in item.inner_text(), 'detecta relleno genérico al escribir')
    item.locator('button', has_text='Guardar').click()
    check('automatizar el aislamiento' in estado(pg)['contenido']['borradores']['n_edr'], 'borrador guardado')
    item.locator('input[type=checkbox]').check()
    check(estado(pg)['contenido']['publicados'] == ['n_edr'], 'marcado como publicado')
    with pg.expect_download() as d:
        pg.click('#fn-ics')
    ics = pathlib.Path(d.value.path()).read_bytes().decode('utf-8')
    check('DTSTART;VALUE=DATE:20261201\r\n' in ics and 'SUMMARY:Field Notes #1: CrowdStrike Falcon' in ics, f'calendario .ics con fin de línea CRLF: {ics[:300]!r}')
    fresh(pg, 'marca/contenido')
    check('automatizar el aislamiento' in pg.locator('#fn-n_edr textarea').input_value(), 'el borrador sobrevive a la recarga')
    no_errors(pg, 'marca')


def t_marca_vacia_ingles_movil(browser):
    pg = new_page(browser, state=base())
    for r in ['marca/linkedin', 'marca/cv', 'marca/boveda', 'marca/contenido', 'candidaturas']:
        goto(pg, r)
        m = re.search(r'\b(null|undefined|NaN)\b', pg.inner_text('main'))
        check(not m, f'«{m.group(0) if m else ""}» en #{r} sin datos')
    goto(pg, 'marca/cv')
    check(pg.locator('#marca-sin-cv').count() == 1, 'sin CV, lleva a Preparar entrevista')
    pe = new_page(browser, state=con_entrevista('en', candidaturas=[]), lang='en')
    for r in ['marca/linkedin', 'marca/cv', 'marca/boveda', 'marca/contenido', 'candidaturas', 'candidaturas/nueva']:
        goto(pe, r)
        txt = pe.inner_text('body').replace('Acme', '')
        m = SPANISH.search(txt)
        check(not m, f'resto en español en #{r}: «{m.group(0) if m else ""}» … {txt[max(0, (m.start() if m else 0) - 60):(m.end() if m else 0) + 40]!r}')
    pm = new_page(browser, width=390, height=844, state=con_entrevista())
    for r in ['marca/linkedin', 'marca/cv', 'marca/boveda', 'marca/contenido', 'candidaturas', 'candidaturas/nueva']:
        goto(pm, r)
        for el in pm.locator('main details').all():
            el.evaluate('d => d.open = true')
        sw = pm.evaluate('document.documentElement.scrollWidth')
        check(sw <= 390, f'#{r} sin desbordar en móvil ({sw})')
    pm.click('#more-btn')
    more = pm.inner_text('#dlg-more')
    check('Tu marca' in more and 'Candidaturas' in more, 'las vistas nuevas en «Más»')
    no_errors(pe, 'marca inglés')
    no_errors(pm, 'marca móvil')


TESTS_MARCA = [
    ('0.10: candidaturas de ai-job-search-es: importar, estados, enlaces seguros, exportar y preparar', t_candidaturas),
    ('0.10: tu marca: LinkedIn, CV XYZ, bóveda y Field Notes con calendario', t_marca),
    ('0.10: sin datos, en inglés y en móvil', t_marca_vacia_ingles_movil),
]
