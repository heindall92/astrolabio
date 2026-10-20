#!/usr/bin/env bash
# Build + motor + e2e + axe. Falla si cualquier paso falla (sin «| tail» que oculte errores).
set -euo pipefail
cd "$(dirname "$0")"
echo "== build" && node app/build.js
echo "== dist al día" && node app/build.js --check
echo "== motor, contenido e i18n" && node --test tests/
echo "== e2e" && python3 tests/e2e_app.py
echo "== axe" && python3 tests/a11y_app.py
echo "Todo en verde."
