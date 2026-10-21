"""Utilidades comunes para las pruebas de navegador (Playwright, Chromium)."""
import json
import pathlib
import functools
import http.server
import re
import threading

ROOT = pathlib.Path(__file__).resolve().parent.parent


def _serve():
    """Sirve dist/ por HTTP local: localStorage en file:// no es fiable entre recargas en CI."""
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *a):
            pass
    srv = http.server.ThreadingHTTPServer(('127.0.0.1', 0), functools.partial(Quiet, directory=str(ROOT / 'dist')))
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return 'http://127.0.0.1:%d' % srv.server_address[1]


ORIGIN = _serve()
URL = ORIGIN + '/index.html'
AXE = (ROOT / 'tests' / 'vendor' / 'axe.min.js').read_text(encoding='utf-8')

PERFIL = {'nombre': 'Ana', 'rol': 'blue', 'nivel': 'junior', 'empresa': 'banca', 'idioma': 'es'}


class Fallo(Exception):
    pass


def check(cond, msg):
    if not cond:
        raise Fallo(msg)


def new_page(browser, width=1280, height=860, theme='light', state=None, lang=None, reduced=False):
    ctx = browser.new_context(viewport={'width': width, 'height': height}, reduced_motion='reduce' if reduced else 'no-preference',
                              color_scheme='dark' if theme == 'dark' else 'light')
    page = ctx.new_page()
    page.errors = []
    page.requests = []
    page.on('pageerror', lambda e: page.errors.append('pageerror: ' + str(e)))
    page.on('console', lambda m: page.errors.append(m.type + ': ' + m.text) if m.type == 'error' else None)
    page.on('request', lambda r: page.requests.append(r.url))
    init = {'astrolabio-tema': theme}
    if state is not None:
        init['astrolabio-estado'] = json.dumps(state)
    if lang:
        init['astrolabio-idioma'] = lang
    page.add_init_script('(() => { try { const d = %s; if (!localStorage.getItem("__seed")) { for (const k in d) localStorage.setItem(k, d[k]); localStorage.setItem("__seed", "1"); } } catch (e) {} })()' % json.dumps(init))
    return page


def goto(page, route=''):
    page.goto(URL + ('#' + route if route else ''))
    page.wait_for_function('r => document.body.dataset.route === r', arg=route or 'inicio')
    page.wait_for_selector('#vh')
    settle(page)


def fresh(page, route=''):
    """Recarga de verdad (documento nuevo) y espera a la ruta: más estable que reload() + cambio de hash."""
    page.reload(wait_until='load')
    page.goto(URL + ('#' + route if route else ''), wait_until='load')
    page.wait_for_function('r => document.body.dataset.route === r', arg=route or 'inicio', timeout=15000)
    page.wait_for_selector('#vh')
    settle(page)


def settle(page):
    """Espera solo a las animaciones finitas (las infinitas nunca terminan)."""
    page.evaluate("""() => Promise.all(document.getAnimations()
        .filter(a => { const t = a.effect && a.effect.getComputedTiming(); return t && t.endTime !== Infinity; })
        .map(a => a.finished.catch(() => {})))""")
    page.wait_for_timeout(60)


def axe(page, label):
    if not page.evaluate('typeof window.axe !== "undefined"'):
        page.evaluate(AXE)
    settle(page)
    res = page.evaluate("""async () => {
        const r = await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } });
        return r.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.slice(0, 4).map(n => n.target.join(' ') + ' :: ' + (n.failureSummary || '').split('\\n').slice(0, 2).join(' ')) }));
    }""")
    if res:
        raise Fallo(f'axe [{label}]: ' + json.dumps(res, ensure_ascii=False, indent=1))
    return 0


def no_errors(page, label):
    errs = [e for e in page.errors if 'favicon' not in e]
    check(not errs, f'{label}: errores en consola: {errs}')
    ext = [u for u in page.requests if not (u.startswith(ORIGIN + '/') or u.startswith('file:') or u.startswith('data:') or u.startswith('blob:'))]
    check(not ext, f'{label}: peticiones de red: {ext}')


def story(id_, titulo, s, t, a, r, l='', comps=None, tipo='real'):
    return {'id': id_, 'titulo': titulo, 'tipo': tipo, 's': s, 't': t, 'a': a, 'r': r, 'l': l,
            'competencias': comps or [], 'creada': '2026-10-20', 'editada': '2026-10-20'}


def run(tests):
    """Ejecuta una lista de (nombre, función) y sale con código 1 si algo falla."""
    import sys
    import traceback
    from playwright.sync_api import sync_playwright
    ok = fail = 0
    with sync_playwright() as p:
        browser = p.chromium.launch()
        for name, fn in tests:
            try:
                fn(browser)
                ok += 1
                print(f'ok   {name}')
            except Exception as e:  # noqa: BLE001
                fail += 1
                print(f'FAIL {name}\n     {e}')
                if not isinstance(e, Fallo):
                    traceback.print_exc()
        browser.close()
    print(f'\n{ok} ok, {fail} fallos')
    sys.exit(1 if fail else 0)


SPANISH = re.compile(r'[¿¡]|\b(historia|historias|guardar|borrar|ayuda|buscar|siguiente|competencias|resultado|situación|tarea|acción|también|perfil|para|con|una|que|del)\b', re.I)
