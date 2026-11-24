"""0.9.0 · Baúl, marca personal, preparar entrevista, guion y guion en directo (Playwright, Chromium).
Se ejecuta dentro de tests/e2e_app.py (EXTRA_TESTS)."""
import json
import pathlib
from helpers import PERFIL, SPANISH, check, fresh, goto, new_page, no_errors, settle, story

CV_DIR = pathlib.Path(__file__).resolve().parent / 'fixtures' / 'cv'
OFERTA = 'Analista SOC con al menos 5 años de experiencia en EDR/XDR, SIEM y MITRE ATT&CK. Inglés C1. Salario 32.000 - 38.000 € brutos anuales.'
NOTA_EDR = {'id': 'n_edr', 'tipo': 'herramienta', 'campos': {'nombre': 'CrowdStrike Falcon', 'categoria': 'edr', 'definicion': 'Un EDR registra lo que pasa en cada equipo y deja aislarlo',
            'uso': 'investigué alertas y aislé equipos', 'nivel': 'produccion', 'cifra': 'bajé el triaje de 20 a 8 minutos', 'claves': 'edr, xdr'}, 'creada': '2026-11-20', 'editada': '2026-11-20'}


def base(**kw):
    s = {'version': 1, 'perfil': PERFIL, 'historias': [], 'duelos': [], 'xp': 0, 'racha': 0, 'insignias': [], 'historialXp': {}}
    s.update(kw)
    return s


def con_entrevista(idioma='es', **kw):
    cv = (CV_DIR / ('cv-es.txt' if idioma == 'es' else 'cv-en.txt')).read_text(encoding='utf-8').replace('**', '').replace('## ', '').replace('# ', '')
    ent = {'empresa': 'Acme', 'puesto': 'Analista SOC' if idioma == 'es' else 'SOC Analyst', 'formato': 'video', 'entrevistadores': ['rrhh', 'tecnico'], 'idioma': idioma, 'pais': 'es',
           'oferta': OFERTA, 'cv': cv, 'cvArchivo': 'cv.txt', 'resp': {'motivoPuesto': 'quiero especializarme en detección', 'salarioObjetivo': 35000, 'salarioAncla': 39000, 'salarioMin': 30000}, 'ediciones': {}}
    if idioma == 'en':
        nota = {**NOTA_EDR, 'campos': {**NOTA_EDR['campos'], 'definicion': 'An EDR records what happens on each endpoint', 'uso': 'I investigated alerts and isolated machines', 'cifra': 'cut triage from 20 to 8 minutes'}}
        ent['oferta'] = 'SOC analyst with EDR/XDR, SIEM and MITRE ATT&CK. Salary 32,000 - 38,000 EUR.'
        ent['resp'] = {'motivoPuesto': 'I want to specialise in detection', 'salarioObjetivo': 35000}
        return base(entrevista=ent, baul=[nota], marca={'ventaja': 'turning noise into signal', 'puntoVista': '', 'frase': 'I find the gap and close it.', 'hilo': ''}, **kw)
    return base(entrevista=ent, baul=[NOTA_EDR], marca={'ventaja': 'que convierto el ruido en señal', 'puntoVista': '', 'frase': 'Encuentro el hueco y lo cierro.', 'hilo': ''}, **kw)


def estado(pg):
    return json.loads(pg.evaluate("localStorage.getItem('astrolabio-estado')"))


def t_preparar_cv(browser):
    pg = new_page(browser, state=base())
    goto(pg, 'entrevista')
    check('Prepara tu entrevista' in pg.inner_text('#vh'), 'título')
    pg.fill('#ent-empresa', 'Acme Seguridad')
    pg.fill('#ent-puesto', 'Analista SOC')
    pg.click('#ent-quien label:has(input[value=direccion])')
    pg.click('#ent-formato button[data-v=telefono]')
    # PDF de navegador: se lee en local y sale el resumen.
    pg.set_input_files('#cv-file', str(CV_DIR / 'cv-es-chromium.pdf'))
    pg.wait_for_selector('#cv-kpis')
    txt = pg.inner_text('#cv-resumen')
    check('Marta Vidal Soler' in txt and 'Analista SOC N1' in txt and 'CrowdStrike' in txt, f'resumen del CV: {txt[:300]}')
    check([pg.inner_text(f'#cv-kpis .kpi:nth-child({i}) b') for i in (1, 2)] == ['4', '2'], 'años y puestos')
    check('cv-es-chromium.pdf' in pg.inner_text('#ent-cv-sec'), 'nombre del archivo')
    # Oferta: tecnologías, salario publicado y dudas automáticas.
    pg.fill('#ent-oferta', OFERTA)
    check('32.000 € – 38.000 €' in pg.inner_text('#oferta-salario').replace('\xa0', ' '), 'salario de la oferta')
    dudas = pg.inner_text('#oferta-dudas')
    check('5 años' in dudas and 'C1' in dudas and 'B2' in dudas, f'dudas automáticas: {dudas}')
    pg.fill('#ent-r-motivoPuesto', 'quiero especializarme en detección')
    # Preparador de rango: X nunca el mínimo, ancho máximo del 20 % y vista previa en dos tiempos.
    pg.fill('#ent-r-salarioMin', '35000')
    pg.fill('#ent-r-salarioObjetivo', '35000')
    pg.fill('#ent-r-salarioAncla', '50000')
    avisos = pg.inner_text('#sal-avisos')
    check('nunca el mínimo' in avisos and '20 %' in avisos, f'avisos del preparador: {avisos}')
    pg.fill('#ent-r-salarioMin', '30000')
    pg.click('#ent-salarioPagas button[data-v="12"]')
    seg = pg.inner_text('#sal-segundo').replace('\xa0', ' ')
    check('entre 35.000 € y 42.000 € brutos anuales, en 12 pagas' in seg and 'Acme Seguridad' in seg and 'EDR' in seg, f'segundo tiempo recortado al 20 % y con argumento de la oferta: {seg}')
    check(pg.inner_text('#sal-primero').startswith('Prefiero no cerrarme a una banda salarial concreta'), 'primer tiempo')
    # Ronda salarial: una cifra suelta pide rango; una respuesta redonda saca 100.
    pg.fill('#ronda-ent-txt', 'Unos 30.000 euros.')
    pg.click('#ronda-ent-enviar')
    check(pg.inner_text('#ronda-ent-nota') != '100' and pg.locator('#ronda-ent-res li.no').count() >= 3, 'cifra suelta y mínimo: suspende')
    pg.click('#ronda-ent-sigue')
    check('¿Me das un rango, entonces?' in pg.inner_text('#ronda-ent-q'), 'repregunta por el rango')
    pg.fill('#ronda-ent-txt', 'Teniendo en cuenta las responsabilidades y mis logros, busco entre 35.000 y 39.000 € brutos, y valoro el teletrabajo.')
    pg.click('#ronda-ent-enviar')
    check(pg.inner_text('#ronda-ent-nota') == '100', 'respuesta redonda: 100')
    pg.wait_for_timeout(700)
    s = estado(pg)['entrevista']
    check(s['empresa'] == 'Acme Seguridad' and s['entrevistadores'] == ['direccion'] and s['formato'] == 'telefono', f'guardado: {s["empresa"]} {s["entrevistadores"]} {s["formato"]}')
    check('Marta Vidal Soler' in s['cv'] and s['resp']['salarioObjetivo'] == 35000 and s['resp']['salarioAncla'] == 50000 and s['resp']['salarioPagas'] == 12, 'CV y respuestas guardados')
    fresh(pg, 'entrevista')
    check(pg.input_value('#ent-empresa') == 'Acme Seguridad' and pg.locator('#cv-kpis').count() == 1, 'persistencia tras recargar')
    # DOCX y ODT también; un PDF escaneado da un error claro.
    pg.set_input_files('#cv-file', str(CV_DIR / 'cv-en.docx'))
    pg.wait_for_function("() => document.querySelector('#cv-resumen').innerText.includes('Daniel Ortega')")
    pg.set_input_files('#cv-file', {'name': 'escaneado.pdf', 'mimeType': 'application/pdf', 'buffer': b'%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /Contents 4 0 R >> endobj\n4 0 obj << /Length 10 >> stream\n0 0 m 1 1 l\nendstream endobj\ntrailer << /Root 1 0 R >>\n%%EOF'})
    pg.wait_for_selector('#cv-error')
    check('escaneado' in pg.inner_text('#cv-error'), 'error de PDF sin texto')
    pg.click('#cv-quitar') if pg.locator('#cv-quitar').count() else None
    no_errors(pg, 'preparar')


def t_baul(browser):
    pg = new_page(browser, state=base())
    goto(pg, 'baul')
    check(pg.locator('#baul-vacio').count() == 1, 'baúl vacío')
    pg.fill('#marca-frase', 'Encuentro el hueco y lo cierro.')
    pg.fill('#marca-ventaja', 'que convierto el ruido en señal')
    pg.click('#marca-guardar')
    check(estado(pg)['marca']['frase'] == 'Encuentro el hueco y lo cierro.', 'marca guardada')
    pg.click('#nueva-herramienta')
    pg.wait_for_selector('#nota-form')
    pg.click('#nota-guardar')
    check(pg.get_attribute('#nota-nombre', 'aria-invalid') == 'true' and pg.evaluate('document.activeElement.id') == 'nota-nombre', 'sin nombre no se guarda y el foco va al campo')
    pg.fill('#nota-nombre', 'CrowdStrike Falcon')
    pg.select_option('#nota-categoria', 'edr')
    pg.select_option('#nota-nivel', 'produccion')
    pg.fill('#nota-definicion', 'Un EDR registra lo que pasa en cada equipo.')
    pg.fill('#nota-uso', 'Investigué alertas y aislé equipos con ransomware.')
    pg.click('#nota-guardar')
    pg.wait_for_selector('#baul-lista .nota')
    card = pg.inner_text('#baul-lista')
    check('CrowdStrike Falcon' in card and 'EDR' in card and 'Producción' in card, f'tarjeta con tipo, nivel y tecnologías: {card}')
    goto(pg, 'baul/nueva/concepto')
    pg.fill('#nota-termino', 'EDR frente a XDR')
    pg.fill('#nota-sencillo', 'Un EDR vigila cada equipo; un XDR une varias fuentes.')
    pg.click('#nota-guardar')
    pg.wait_for_selector('#baul-filtros')
    pg.click('#baul-filtros button[data-tipo=concepto]')
    check(pg.locator('#baul-lista .nota').count() == 1 and 'EDR frente a XDR' in pg.inner_text('#baul-lista'), 'filtro por tipo')
    pg.click('#baul-filtros button[data-tipo=""]')
    pg.fill('#baul-buscar', 'ransomware')
    check(pg.locator('#baul-lista .nota').count() == 1, 'búsqueda dentro del baúl sin tildes')
    pg.keyboard.press('Control+k')
    pg.fill('#search-input', 'falcon')
    check('nota' in pg.inner_text('#search-results').lower(), 'la nota aparece en Ctrl K')
    pg.keyboard.press('Enter')
    pg.wait_for_selector('#nota-form')
    check(pg.input_value('#nota-nombre') == 'CrowdStrike Falcon', 'Ctrl K abre la nota')
    pg.click('#nota-borrar')
    pg.click('#confirm-ok')
    pg.wait_for_selector('#baul-filtros')
    check(len(estado(pg)['baul']) == 1, 'nota borrada')
    no_errors(pg, 'baul')


def t_guion(browser):
    pg = new_page(browser, state=con_entrevista())
    goto(pg, 'guion')
    check('Acme' in pg.inner_text('#vh'), 'título con la empresa')
    for cat in ['apertura', 'presentacion', 'motivacion', 'experiencia', 'tecnica', 'conducta', 'dificiles', 'salario', 'preguntas', 'cierre']:
        check(pg.locator('#cat-' + cat).count() == 1, 'falta la categoría ' + cat)
    pres = pg.inner_text('#b-presentacion')
    check('Soy analista SOC junior' in pres and 'Lo que me diferencia es que convierto el ruido en señal' in pres and 'Encuentro el hueco y lo cierro.' in pres, f'«Háblame de ti» con CV y marca: {pres[:400]}')
    check('La he usado en producción' in pg.inner_text('#b-tec-edr'), 'la nota del Baúl responde a EDR')
    check(pg.locator('#b-tec-siem mark.hueco').count() == 2, 'lo que falta (SIEM) sale con huecos marcados')
    sal = pg.inner_text('#b-salario').replace('\xa0', ' ')
    check('La oferta indica 32.000 € – 38.000 €' in sal, f'salario: primero, la banda de la oferta: {sal}')
    rango = pg.inner_text('#b-salario-rango').replace('\xa0', ' ')
    check('¿Y una cifra concreta?' in rango and 'entre 35.000 € y 39.000 € brutos anuales, en 14 pagas' in rango, f'si insisten, el rango con argumento: {rango}')
    todo = ' '.join(pg.locator('#cat-salario ~ article, section:has(#cat-salario) article').all_inner_texts())
    check('30.000' not in todo.replace('\xa0', ' '), 'el mínimo no aparece en ningún bloque de salario')
    hist = pg.locator('#b-salario-historial')
    hist.locator('summary').click()
    check('historial retributivo' in hist.inner_text() and 'Real Decreto-ley 39/2026' in hist.inner_text(), 'la ley en el apoyo del salario anterior')
    check('La oferta pide 5 años' in pg.inner_text('#b-duda-anos'), 'duda de años')
    n = int(pg.inner_text('#probables-h .chip'))
    check(n >= 20 and pg.locator('#probables li').count() == n, f'posibles preguntas: {n}')
    check('¿Qué diferencia hay entre un EDR, un antivirus y un XDR?' in pg.inner_text('#probables'), 'banco de preguntas técnicas')
    # Editar un bloque, recargar y volver al texto generado.
    pg.locator('#b-apertura button', has_text='Editar').click()
    pg.fill('#b-apertura textarea', 'Buenos días, gracias por recibirme. [nombre de quien entrevista]')
    pg.locator('#b-apertura button', has_text='Guardar').click()
    pg.wait_for_selector('#b-apertura .chip.st-lista')
    check(pg.locator('#b-apertura mark.hueco').count() == 1, 'la edición marca su hueco')
    fresh(pg, 'guion')
    check('Buenos días, gracias por recibirme.' in pg.inner_text('#b-apertura'), 'la edición sobrevive a la recarga')
    pg.locator('#b-apertura button', has_text='Editar').click()
    pg.locator('#b-apertura button', has_text='Volver al texto generado').click()
    pg.wait_for_function("() => !document.querySelector('#b-apertura').innerText.includes('Buenos días')")
    # «Ver la respuesta» lleva al bloque.
    pg.locator('#probables li', has_text='¿Cuáles son tus expectativas salariales?').locator('button').click()
    check(pg.evaluate('document.activeElement.id') == 'b-salario', 'ir a la respuesta desde las posibles preguntas')
    with pg.expect_download() as d:
        pg.click('#guion-descargar')
    txt = pathlib.Path(d.value.path()).read_text(encoding='utf-8')
    check(txt.startswith('Astrolabio · Analista SOC · Acme') and '## Háblame de ti' in txt and '> ¿Cuáles son tus expectativas salariales?' in txt, 'guion descargado en texto')
    no_errors(pg, 'guion')


def t_directo(browser):
    pg = new_page(browser, state=con_entrevista())
    goto(pg, 'directo')
    check(pg.locator('#dir-cats button').count() == 10, 'diez tipos de pregunta con su tecla')
    check(pg.inner_text('#dir-q') == 'Saludo', 'empieza por el saludo')
    pg.keyboard.press('2')
    check(pg.inner_text('#dir-q') == 'Háblame de ti.' and pg.get_attribute('#dir-cats button[data-cat=presentacion]', 'aria-current') == 'true', 'la tecla 2 salta a «Háblame de ti» (y no cambia de vista)')
    check('#directo' in pg.url, 'los números no navegan por la app en el guion en directo')
    check(pg.locator('#dir-cuerpo .dir-claves li').count() >= 2, 'modo palabras clave por defecto')
    pg.keyboard.press('ArrowRight')
    check(pg.inner_text('#dir-pos').startswith('3/'), 'flecha derecha: siguiente respuesta')
    pg.keyboard.press('ArrowLeft')
    pg.keyboard.press('k')
    check(pg.locator('#dir-cuerpo .dir-texto').count() == 1, 'K cambia a texto completo')
    pg.keyboard.press('ArrowUp')
    pg.keyboard.press('ArrowUp')
    check('150' in pg.inner_text('#dir-ppm'), 'flechas arriba: más velocidad')
    pg.keyboard.press('+')
    check(pg.inner_text('#dir-tam') == '36 px', 'más tamaño')
    antes = pg.evaluate("document.querySelector('#dir-marco').scrollTop")
    pg.keyboard.press(' ')
    check(pg.get_attribute('#dir-play', 'aria-pressed') == 'true', 'espacio: leer')
    pg.wait_for_timeout(2500)
    despues = pg.evaluate("document.querySelector('#dir-marco').scrollTop")
    check(despues > antes, f'el texto avanza solo ({antes} → {despues})')
    pg.keyboard.press(' ')
    check(pg.get_attribute('#dir-play', 'aria-pressed') == 'false', 'espacio: pausa')
    aj = json.loads(pg.evaluate("localStorage.getItem('astrolabio-directo')"))
    check(aj == {'ppm': 150, 'tam': 36, 'modo': 'texto', 'camara': True}, f'ajustes guardados: {aj}')
    pg.fill('#dir-buscar', 'salariales')
    pg.keyboard.press('Enter')
    check('salariales' in pg.inner_text('#dir-q'), 'buscar una pregunta y saltar a ella')
    check(pg.evaluate("document.querySelector('#dir-marco').getBoundingClientRect().bottom") <= 860, 'el texto cabe en la ventana')
    no_errors(pg, 'directo')
    # Con movimiento reducido avanza a saltos de línea y nunca en continuo.
    pr = new_page(browser, state=con_entrevista(), reduced=True)
    goto(pr, 'directo')
    pr.keyboard.press('2')
    pr.keyboard.press(' ')
    pr.wait_for_timeout(5000)
    top = pr.evaluate("document.querySelector('#dir-marco').scrollTop")
    linea = pr.evaluate("parseFloat(getComputedStyle(document.querySelector('#dir-escenario')).getPropertyValue('--dir-tam')) * 1.5")
    check(top > 0 and abs(top / linea - round(top / linea)) < 0.01, f'movimiento reducido: saltos de línea enteros ({top} / {linea})')
    no_errors(pr, 'directo reducido')


def t_sin_null(browser):
    """Ninguna rama condicional se pinta como «null» o «undefined» en las vistas nuevas, en ningún estado."""
    import re
    pg = new_page(browser, state=con_entrevista())
    goto(pg, 'entrevista')
    pg.fill('#ronda-ent-txt', 'Unos 30.000 euros.')
    pg.click('#ronda-ent-enviar')
    estados = [('entrevista', None), ('guion', None), ('directo', None), ('baul', None), ('baul/n_edr', None)]
    txt = pg.inner_text('main')
    check(not re.search(r'\b(null|undefined|NaN)\b', txt), 'texto «null» en #entrevista tras la ronda salarial')
    for r, _ in estados:
        goto(pg, r)
        txt = pg.inner_text('main')
        m = re.search(r'\b(null|undefined|NaN)\b', txt)
        check(not m, f'texto «{m.group(0) if m else ""}» en #{r}')
    pv = new_page(browser, state=base(entrevista={'empresa': '', 'puesto': '', 'cv': '', 'oferta': '', 'resp': {}}))
    for r in ['entrevista', 'guion', 'directo']:
        goto(pv, r)
        m = re.search(r'\b(null|undefined|NaN)\b', pv.inner_text('main'))
        check(not m, f'texto «{m.group(0) if m else ""}» en #{r} con la entrevista vacía')
    no_errors(pg, 'sin null')


def t_guion_ingles_y_movil(browser):
    pg = new_page(browser, state=con_entrevista('en'), lang='en')
    for route in ['entrevista', 'guion', 'directo', 'baul', 'baul/nueva/herramienta', 'baul/n_edr', 'inicio']:
        goto(pg, route)
        txt = pg.inner_text('body')
        m = SPANISH.search(txt.replace('Acme', ''))
        check(not m, f'resto en español en #{route}: «{m.group(0) if m else ""}» … {txt[max(0, (m.start() if m else 0) - 60):(m.end() if m else 0) + 40]!r}')
    goto(pg, 'guion')
    check('I am a junior Cloud Engineer' in pg.inner_text('#b-presentacion'), 'guion en inglés con el CV en inglés')
    no_errors(pg, 'guion inglés')
    pm = new_page(browser, width=390, height=844, state=con_entrevista())
    for route in ['entrevista', 'guion', 'directo', 'baul', 'baul/nueva/empresa']:
        goto(pm, route)
        for el in pm.locator('main details').all():
            el.evaluate('d => d.open = true')
        sw = pm.evaluate('document.documentElement.scrollWidth')
        check(sw <= 390, f'#{route} sin desbordar en móvil ({sw})')
    pm.click('#more-btn')
    more = pm.inner_text('#dlg-more')
    check('Preparar entrevista' in more and 'Baúl' in more, 'las vistas nuevas están en «Más»')
    no_errors(pm, 'móvil 0.9')


def t_borrar_entrevista(browser):
    pg = new_page(browser, state=con_entrevista())
    goto(pg, 'entrevista')
    pg.click('#ent-borrar')
    pg.click('#confirm-ok')
    pg.wait_for_function("() => JSON.parse(localStorage.getItem('astrolabio-estado')).entrevista === null")
    s = estado(pg)
    check(s['entrevista'] is None and len(s['baul']) == 1 and s['marca']['frase'], 'se borra la entrevista; el Baúl y la marca se quedan')
    goto(pg, 'guion')
    check(pg.locator('#guion-vacio').count() == 1, 'guion vacío tras borrar')
    no_errors(pg, 'borrar entrevista')


TESTS_GUION = [
    ('0.9: preparar entrevista con CV en PDF, DOCX y errores claros', t_preparar_cv),
    ('0.9: baúl con marca personal, notas, filtros y Ctrl K', t_baul),
    ('0.9: guion por tipo de pregunta, ley del salario, ediciones y descarga', t_guion),
    ('0.9: guion en directo con teclado, velocidad y movimiento reducido', t_directo),
    ('0.9: ninguna rama vacía se pinta como «null»', t_sin_null),
    ('0.9: inglés sin restos y móvil sin desbordar', t_guion_ingles_y_movil),
    ('0.9: borrar la entrevista no toca el Baúl', t_borrar_entrevista),
]
