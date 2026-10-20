# Cómo contribuir

¡Gracias por querer mejorar Astrolabio!

1. Abre una incidencia antes de una PR grande, para hablarlo.
2. Crea una rama desde `main`.
3. Instala las dependencias de desarrollo (`npm ci`, `pip install playwright` y `python -m playwright install chromium`).
4. Haz tus cambios en `app/src/` y regenera con `node app/build.js`.
5. Ejecuta `./run_tests.sh`: build, motor, contenido, i18n, e2e y axe deben quedar en verde.
6. Commits en español, en imperativo, explicando el porqué.

## Contenido

- Preguntas, historias de ejemplo y glosario: **redacción propia**. No copies textos de empresas, libros ni cursos.
- Cada pregunta lleva al menos una competencia y su traducción al inglés.
- Las claves de `i18n/es.js` y `i18n/en.js` deben coincidir (lo comprueba `tests/i18n.test.js`).

## Seguridad

Lee `SECURITY.md`. Si encuentras una vulnerabilidad, no abras una incidencia pública: escribe al autor.
