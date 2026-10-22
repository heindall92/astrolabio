#!/usr/bin/env python3
"""Imagen de vista previa al compartir el enlace (Open Graph, 1200 × 630).

Uso: python3 docs/social.py   →   docs/img/social.png
Se dibuja con el logo y las fuentes del repositorio; superficie lisa, sin patrones.
"""
import base64
import pathlib

from playwright.sync_api import sync_playwright

ROOT = pathlib.Path(__file__).resolve().parent.parent
VENDOR = ROOT / "app" / "vendor"


def font(name):
    return base64.b64encode((VENDOR / name).read_bytes()).decode()


MARK = (VENDOR / "astrolabio-mark.svg").read_text(encoding="utf-8").replace(
    'class="am-b" fill="#0B1024"', 'fill="#0B1024" stroke="rgba(255,255,255,.28)" stroke-width="1.25"')

HTML = """<!doctype html><html lang="es"><head><meta charset="utf-8"><style>
@font-face { font-family: Sora; src: url(data:font/woff2;base64,%(sora)s) format('woff2'); font-weight: 100 900; }
@font-face { font-family: Geist; src: url(data:font/woff2;base64,%(geist)s) format('woff2'); font-weight: 100 900; }
@font-face { font-family: GeistMono; src: url(data:font/woff2;base64,%(mono)s) format('woff2'); font-weight: 100 900; }
html, body { margin: 0; width: 1200px; height: 630px; background: #08090b; color: #f4f6f8; }
main { box-sizing: border-box; height: 630px; padding: 84px 96px; display: flex; flex-direction: column; justify-content: space-between; }
.top { display: flex; align-items: center; gap: 28px; }
.top svg { width: 120px; height: 120px; }
.brand { font: 700 84px/1 Sora, sans-serif; letter-spacing: -.02em; }
.brand b { color: #FFC233; font-weight: 700; }
.sub { font: 600 20px/1 GeistMono, monospace; letter-spacing: .22em; color: #8b93a1; margin-top: 14px; }
h1 { font: 650 52px/1.12 Sora, sans-serif; letter-spacing: -.015em; margin: 0; max-width: 980px; }
p { font: 400 27px/1.45 Geist, sans-serif; color: #b8bfca; margin: 18px 0 0; max-width: 1000px; }
.chips { display: flex; gap: 14px; }
.chip { font: 600 21px/1 Geist, sans-serif; padding: 14px 22px; border-radius: 999px; background: #171a1f; border: 1px solid #2a2f37; color: #dfe3e8; }
.chip.gold { background: #FFC233; border-color: #FFC233; color: #0B1024; }
</style></head><body><main>
<div class="top">%(mark)s<div><div class="brand">Astro<b>labio</b></div><div class="sub">STAR INTERVIEW LAB</div></div></div>
<div><h1>Cuenta tu historia. Gana la entrevista.</h1>
<p>Prepara entrevistas con el método STAR: escribe tus vivencias, entrénalas contra recruiters que repreguntan y aprende qué te falta.</p></div>
<div class="chips"><span class="chip gold">Gratis y de código abierto</span><span class="chip">13 rutas</span><span class="chip">Tus historias no salen del navegador</span></div>
</main></body></html>"""


def main():
    out = ROOT / "docs" / "img" / "social.png"
    html = HTML % {"sora": font("sora-latin-wght-normal.woff2"), "geist": font("geist-latin-wght-normal.woff2"),
                   "mono": font("geist-mono-latin-wght-normal.woff2"), "mark": MARK}
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport={"width": 1200, "height": 630})
        page.set_content(html)
        page.evaluate("document.fonts.ready")
        page.screenshot(path=str(out))
        browser.close()
    print(out)


if __name__ == "__main__":
    main()
