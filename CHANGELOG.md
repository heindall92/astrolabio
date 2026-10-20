# Historial de cambios

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [versionado semántico](https://semver.org/lang/es/).

## [0.3.1] · 2026-10-21 · Móvil estrecho

### Corregido
- **La barra superior no cabía en el móvil.** Con cifras reales (racha de tres dígitos y XP de cinco) necesitaba unos 410 px: a 390 px la búsqueda se aplastaba y la ayuda se salía, y a 320 px la página medía 435 px de ancho. Ahora, por debajo de 768 px, la búsqueda es un botón de icono de 38 px, los botones miden 36 px, el interruptor es más estrecho, la unidad «XP» queda solo para el lector de pantalla y **el idioma pasa al menú «Más»**, junto a los acentos. Por debajo de 360 px la racha se ve en Inicio y Progreso.
- **Rejillas con mínimo fijo** (`minmax(320px, 1fr)` y similares) que desbordaban el contenido a 320 px en Inicio y Perfil: ahora usan `minmax(min(…, 100%), 1fr)`.
- **Tarjetas huérfanas:** las cuatro cifras del inicio van en una fila (2 × 2 en pantallas medianas) y el jefe final de la Arena ocupa su propia fila.
- `node --test tests/` fallaba en Node 22 o superior: ahora `node --test tests/*.test.js` en `run_tests.sh` y en `npm test`.
- El README decía que el repositorio era privado y que la demo llegaría con la 1.0: ya es público y la demo está en GitHub Pages.

### Añadido
- Prueba e2e del móvil estrecho: a 320, 360 y 390 px, con cifras grandes y en todas las vistas, nada se desborda, ningún control sale de la barra y la búsqueda no se deforma. También cubre el idioma desde «Más». Falla con la 0.3.0.

## [0.3.0] · 2026-10-21 · Arena

### Añadido
- Arena con cinco recruiters de creación propia, cada uno con lo que más valora, su umbral y su número de repreguntas.
- Barra de convicción (empieza en 50, meta 70, derrota inmediata en 15) y repreguntas sobre el criterio más flojo según el recruiter.
- Modos escrito, en voz alta con autoevaluación, contrarreloj de 90 s (con botón para parar el reloj) y sorpresa.
- Recomendación de la historia que mejor encaja con cada pregunta e informe del duelo con rondas y qué mejorar.
- Atajos: `Ctrl Enter` responde, `Alt R` elige pregunta al azar y `Alt N` empieza otro duelo.
- Motor `engine/arena.js` probado y comprobación en el build de nombres repetidos entre módulos.
- e2e de un duelo ganado y otro perdido, y axe en cada paso del duelo.

## [0.2.0] · 2026-10-20 · Constelación y banco de preguntas

### Añadido
- Constelación SVG de 12 competencias (4×3 en escritorio, 2×6 en móvil), navegable con teclado, con tabla equivalente y animación de estrella nueva.
- Correspondencia de cada competencia con los 16 principios de liderazgo públicos.
- Rutas Red, Blue, GRC y Data: 26 preguntas propias por ruta, 3 historias modelo bilingües y glosario.
- Banco de preguntas en la Forja y preguntas comunes, incluidas las «trampa» con guía.
- Búsqueda `Ctrl K` sobre historias, preguntas y glosario, insensible a mayúsculas y tildes.
- Pruebas de contenido: sin duplicados, cada pregunta con competencia y paridad ES/EN.

## [0.1.0] · 2026-10-20 · Cimientos: perfil y Forja

### Añadido
- `app/build.js`: un único HTML autónomo con CSP por hashes, fuentes Geist, Geist Mono y Sora incrustadas (Fontsource, OFL), iconos Lucide incrustados y artefacto sin `<head>`.
- Shell: lateral flotante plegable, barra superior de cristal (racha, XP, búsqueda `Ctrl K`, ES/EN, tema, sonido y ayuda), 7 acentos con azul eléctrico por defecto y barra inferior en móvil con «Más» (incluye los 7 acentos).
- Asistente de perfil en tres pasos (rol → nivel → empresa e idioma) y píldora de perfil.
- Forja: editor STAR con puntuación en vivo, desglose por criterio, reparto S/T/A/R, sugerencias explicadas, historias *Real* o *Ensayo* y aviso de datos sensibles (IP, correos, dominios internos, CVE y nombres confidenciales).
- Motor puro y probado: `constants`, `analyzer`, `score` y `sanitize`.
- Centro de ayuda con seis pestañas; «Método STAR» se genera desde las constantes del motor.
- Página de privacidad, exportar e importar JSON (sobre `yrd-ecosistema`, tipo `historias`) y «Borrar todo» con confirmación.
- Pruebas: motor e i18n con `node --test`, e2e con Playwright y axe-core en claro y oscuro a 1280 y 390 px.
