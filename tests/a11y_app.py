"""axe-core sobre todas las vistas y estados: claro y oscuro, a 1280 y 390 px. 0 infracciones.
Ejecuta: python3 tests/a11y_app.py"""
import sys
import pathlib
sys.path.insert(0, str(pathlib.Path(__file__).parent))
from helpers import axe, fresh, check, goto, new_page, run, settle  # noqa: E402
from e2e_app import BUENA, state  # noqa: E402

MALA = dict(BUENA, id='h_mala', titulo='Una alerta', s='Estaba en el SOC.', t='Había alertas.', a='Estuve mirando cosas. Lo miramos entre todos en 10.1.2.3.', r='Se solucionó más o menos.', l='')
ROUTES = ['inicio', 'forja', 'forja/h_buena', 'forja/h_mala', 'forja/nueva', 'perfil', 'privacidad', 'constelacion', 'arena', 'progreso', 'insignias', 'vacante', 'presentacion', 'traductor']
def _arena_lobby(pg):
    goto(pg, 'arena')


def _arena_duelo(pg):
    pg.click('#arena-start')
    pg.wait_for_selector('#arena-answer')


def _arena_repregunta(pg):
    pg.click('#arena-send')
    pg.wait_for_selector('#arena-follow, #arena-veredicto')


def _arena_informe(pg):
    for _ in range(4):
        if pg.locator('#arena-veredicto').count():
            break
        pg.fill('#arena-follow', 'La decisión más difícil fue aislar el equipo; lo hice porque el riesgo era alto.')
        pg.click('#arena-send')
        pg.wait_for_selector('#arena-follow, #arena-veredicto')


def _arena_voz(pg):
    pg.click('#arena-again')
    pg.check('input[name=modo][value=voz]')
    pg.click('#arena-start')
    pg.wait_for_selector('input[name=marca]')


def _arena_reloj(pg):
    pg.click('#arena-quit')
    pg.check('input[name=modo][value=contrarreloj]')
    pg.click('#arena-start')
    pg.wait_for_selector('#arena-timer')


def _oferta(pg):
    pg.evaluate("""() => { const s = JSON.parse(localStorage.getItem('astrolabio-estado'));
        s.duelos.push({fecha: '2026-10-21', recruiter: 'subeliston', ruta: s.perfil.rol, conviccion: 77, superado: true, modo: 'escrito'});
        s.historialXp = {'2026-10-20': 40}; s.historialMedia = {'2026-10-19': 50, '2026-10-20': 72};
        localStorage.setItem('astrolabio-estado', JSON.stringify(s)); }""")
    fresh(pg, 'oferta/' + pg.evaluate("() => JSON.parse(localStorage.getItem('astrolabio-estado')).perfil.rol"))


def _progreso(pg):
    goto(pg, 'progreso')
    for el in pg.locator('details').all():
        el.locator('summary').click()


def _insignias(pg):
    goto(pg, 'insignias')


def _chuleta(pg):
    goto(pg, 'chuleta')


def _arena_en(pg):
    goto(pg, 'arena')
    pg.check('#arena-en')
    pg.click('#arena-start')
    pg.wait_for_selector('#arena-answer')
    pg.click('#arena-send')
    pg.wait_for_selector('#arena-follow, #arena-veredicto')


def _acerca(pg):
    goto(pg, 'inicio')
    pg.click('#help-btn')
    pg.click('#tab-acerca')


EXTRA_STEPS = [('arena', _arena_lobby), ('arena-duelo', _arena_duelo), ('arena-repregunta', _arena_repregunta),
               ('arena-informe', _arena_informe), ('arena-voz', _arena_voz), ('arena-contrarreloj', _arena_reloj),
               ('oferta', _oferta), ('progreso-datos', _progreso), ('insignias', _insignias),
               ('chuleta', _chuleta), ('arena-ingles', _arena_en), ('acerca', _acerca)]


def _vacante(pg):
    pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d => d.close())")
    goto(pg, 'vacante')
    pg.click('#vac-ejemplo')
    pg.fill('#vac-cv', 'Analista con Splunk y Linux.')
    pg.click('#vac-comparar')
    settle(pg)


def _presentacion(pg):
    pg.evaluate("document.querySelectorAll('dialog[open]').forEach(d => d.close())")
    goto(pg, 'presentacion')
    pg.fill('#pres-texto', 'Actualmente estudio un máster. Antes trabajé 8 años en hostelería. Busco este puesto.')
    for el in pg.locator('#dificiles details').all()[:2]:
        el.click()
    settle(pg)


EXTRA_STEPS += [('vacante-resultado', _vacante), ('presentacion-escrita', _presentacion)]


def sweep(theme, width):
    def fn(browser):
        n = 0
        pg = new_page(browser, width=width, height=860 if width > 500 else 844, theme=theme)
        goto(pg)
        axe(pg, f'{theme}/{width}/asistente-1')
        pg.click('label.choice:has(input[value=red])')
        pg.click('#wiz-next')
        settle(pg)
        axe(pg, f'{theme}/{width}/asistente-2')
        pg.click('label.choice:has(input[value=junior])')
        pg.click('#wiz-next')
        settle(pg)
        axe(pg, f'{theme}/{width}/asistente-3')
        pg = new_page(browser, width=width, height=860 if width > 500 else 844, theme=theme, state=state(historias=[BUENA, MALA]))
        for r in ROUTES:
            goto(pg, r)
            axe(pg, f'{theme}/{width}/{r}')
            n += 1
        goto(pg)
        pg.click('#help-btn')
        for tab in ['guia', 'metodo', 'recruiters', 'atajos', 'glosario', 'acerca']:
            pg.click('#tab-' + tab)
            axe(pg, f'{theme}/{width}/ayuda-{tab}')
        pg.keyboard.press('Escape')
        pg.keyboard.press('Control+k')
        pg.fill('#search-input', 'alerta')
        axe(pg, f'{theme}/{width}/buscar')
        pg.keyboard.press('Escape')
        if width > 500:
            pg.click('#accent-btn')
            axe(pg, f'{theme}/{width}/acento')
            pg.keyboard.press('Escape')
            pg.click('#account-btn')
            axe(pg, f'{theme}/{width}/cuenta')
            pg.keyboard.press('Escape')
        else:
            pg.click('#more-btn')
            axe(pg, f'{theme}/{width}/mas')
            pg.keyboard.press('Escape')
        goto(pg, 'forja/h_buena')
        pg.click('#delete-story')
        axe(pg, f'{theme}/{width}/confirmar')
        pg.keyboard.press('Escape')
        for label, step in EXTRA_STEPS:
            step(pg)
            axe(pg, f'{theme}/{width}/{label}')
        check(n == len(ROUTES), 'todas las rutas')
    return fn


TESTS = [(f'axe {th} {w}px', sweep(th, w)) for th in ('light', 'dark') for w in (1280, 390)]

if __name__ == '__main__':
    run(TESTS)
