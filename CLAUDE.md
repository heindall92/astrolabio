# Instrucciones para asistentes de código

## Autoría

- El autor de todo el trabajo es **Yoandy Ramírez Delgado** (`yoandyramirezdelgado@gmail.com`). Siempre debe aparecer él.
- Antes del primer commit en cualquier clon: `git config user.name "Yoandy Ramírez Delgado"` y `git config user.email "yoandyramirezdelgado@gmail.com"`. Comprueba con `git log -1 --format='%an <%ae>'` que el commit sale a su nombre.
- Nada de líneas `Co-Authored-By` ni de atribuciones a herramientas en commits, PR, código o documentación.

## Flujo de trabajo

- **Una PR por versión.** Rama `version/X.Y.Z` desde `main`, con `./run_tests.sh` en verde (build, motor, e2e y axe con 0 infracciones) antes de abrirla.
- Commits en español, en imperativo y explicando el porqué.
- `dist/` se versiona: ejecuta `node app/build.js` antes de cada commit (la CI lo comprueba con `--check`).
- Si añades un icono, ejecuta `npm run icons`.

## Diseño

- Superficies lisas: **nunca** cuadrículas ni patrones de puntos de fondo. Nada de anillos ni donuts.
- Solo iconos Lucide. Sin emoji como icono, sin CDN, sin Google Fonts, sin analítica.
- 7 acentos con azul eléctrico por defecto; el oro estelar solo para lo que se gana, siempre de relleno con texto oscuro.
- Movimiento: `:active { scale(.97) }`, curvas `--ease-*`, cambio de tema con un único fundido de 0,32 s. Movimiento reducido = fundido.
- WCAG 2.2 AA con axe-core: 0 infracciones en claro y oscuro, a 1280 y 390 px.

## Contenido

- Contenido de redacción propia. De los Leadership Principles de Amazon solo se citan los nombres públicos.
- Nada de material de cursos, de ORBIT Jr. ni de terceros sin permiso.
- Datos del usuario: siempre `textContent` (la función `h()`), nunca `innerHTML`.

## Siguiente paso

- Lee `ROADMAP.md` antes de proponer trabajo nuevo: las casillas marcadas son lo hecho.
