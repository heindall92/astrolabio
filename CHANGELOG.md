# Historial de cambios

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [versionado semántico](https://semver.org/lang/es/).

## [0.8.0] · 2026-10-22 · Del filtro a la entrevista

### Añadido
- **Oferta (lector de ofertas).** Se pega el texto de una oferta, en español o en inglés, y Astrolabio extrae:
  - las competencias que pide, con las expresiones literales de la oferta y ordenadas por las veces que las menciona;
  - las tecnologías, marcos y certificaciones (más de 100 de las 13 rutas);
  - los años de experiencia, los idiomas con su nivel y la modalidad.

  Cruza las competencias con tus historias (cubierta, a medias o sin historia) y propone las cinco preguntas más probables de tu ruta. Con un puesto junior que pide tres años o más, explica cómo contar la experiencia equivalente. Todo con reglas y un léxico propio (`content/vacante.js`), sin IA ni red.
- **Tu CV frente a la oferta:** qué palabras clave de la oferta faltan en el CV pegado y **viñetas de CV** generadas a partir de la Acción y el Resultado de cada historia (verbo de acción y cifra), con botón de copiar. Aviso explícito de que no garantiza pasar ningún filtro automático.
- **Háblame de ti:** presentación de 60 a 90 segundos puntuada en vivo (duración, ahora, antes, por qué este puesto, una cifra y sin muletillas). Si no llega a la mitad del tiempo mínimo, la nota no pasa de 50.
- **Preguntas difíciles** con guía de respuesta: «Háblame de ti», sobrecualificación, cambio de sector, por qué dejaste tu último trabajo, dónde te ves en cinco años y «¿tienes alguna pregunta?». La guía del hueco en el CV menciona los cuidados y la salud.
- **Preguntas para hacer al entrevistador:** diez, con el porqué de cada una y botón para copiarlas.
- **Traductor de experiencia:** seis sectores (hostelería, comercio, docencia, logística, sanidad y administración) con cuatro situaciones cada uno, la competencia que demuestran y cómo contarlas en una entrevista técnica. Cada una se convierte en historia con un clic.
- Inicio enlaza las tres herramientas en «Prepárate para una oferta concreta»; también están en el lateral y en «Más» del móvil. Privacidad explica qué pasa con la oferta.
- Pruebas: 26 de motor y contenido (`tests/vacante.test.js`), dos flujos e2e (el de la 0.8 y el del tema) y las vistas nuevas en los cuatro barridos de axe, en la prueba de inglés y en la de móvil estrecho.

### Cambiado
- **La app abre siempre en tema claro.** Antes seguía el tema del sistema y en un móvil en oscuro arrancaba en oscuro. El oscuro solo se usa si se elige con el interruptor, y se recuerda. El `<meta name="color-scheme">` pasa a `light` para que no haya un fondo oscuro antes de que cargue la app.
- La imagen principal del README es la Forja en tema claro.

### Corregido
- Los botones de las vistas nuevas tenían un nombre accesible que no empezaba por su texto visible (WCAG 2.5.3, lo detectó axe): ahora «Escribir historia: …», «Practicar: …», etc.

## [0.7.4] · 2026-10-22 · Base para crecer

### Corregido
- **`npm test` fallaba en Node 22 o superior** (`Cannot find module …/tests`): desde Node 21, `node --test` ya no acepta una carpeta. La 0.7.1 lo arregló en `run_tests.sh`, pero `package.json` seguía con `node --test tests/`. La CI no lo veía porque usa Node 20. Ahora `npm test` ejecuta `node --test tests/*.test.js`, igual que `run_tests.sh`.
- **El enlace de la demo se compartía sin imagen ni descripción.** La página raíz solo redirigía a `dist/`, así que LinkedIn, WhatsApp y otras redes mostraban un enlace vacío. Ahora lleva título, descripción, Open Graph y `twitter:card`, con una imagen propia de 1200 × 630.

### Añadido
- `docs/social.py` genera `docs/img/social.png` con el logo y las fuentes del repositorio.
- `tests/site.test.js`: la raíz lleva los metadatos completos, la imagen existe y mide 1200 × 630, y la redirección a la app no cambia.
- **ROADMAP:** fases 0.8 a 2.0 (lector de ofertas y viñetas de CV, «Háblame de ti», preguntas difíciles para quien cambia de etapa, grabadora local, plan para una entrevista concreta, PWA, modo orientador, Latinoamérica e IA opcional) y un plan de crecimiento sin analítica (§ 17).

## [0.7.3] · 2026-10-21 · Logo en oscuro

### Cambiado
- **En el tema oscuro el bocadillo del logo lleva un borde fino** (1,25 px, blanco al 28 %) para que no se pierda sobre el fondo casi negro. Se aplica en todas las copias (lateral, asistente, «Acerca de» y carta de oferta). El tema claro no cambia.
- README: botón «Probar demo en vivo» bajo el lema y «Cómo se usa» habla de las 13 rutas (antes solo nombraba cuatro).
- La prueba del logo comprueba también que el borde solo aparece en oscuro.

## [0.7.2] · 2026-10-21 · Logo

### Corregido
- **La estrella del logo no se veía** en el asistente de perfil, «Acerca de» y la carta de oferta: solo aparecía el bocadillo oscuro. Todas las copias del logo compartían el id del degradado (`am-g`), así que `url(#am-g)` apuntaba a la copia del lateral, y en el móvil el lateral está oculto (`display: none`), con lo que el degradado no se pintaba. Ahora cada copia lleva su propio id.
- Nueva prueba: comprueba que no hay ids repetidos y mide los píxeles dorados del logo en claro, oscuro, escritorio y móvil.

## [0.7.1] · 2026-10-21 · Móvil estrecho

### Corregido
- **La barra superior no cabía en el móvil.** Con cifras reales (racha de tres dígitos y XP de cinco) necesitaba unos 410 px: a 390 px la búsqueda se aplastaba y la ayuda se salía, y a 320 px la página medía 435 px de ancho. Ahora, por debajo de 768 px, la búsqueda es un botón de icono de 38 px, los botones miden 36 px, el interruptor es más estrecho, la unidad «XP» queda solo para el lector de pantalla y **el idioma pasa al menú «Más»**, junto a los acentos. Por debajo de 360 px la racha se ve en Inicio y Progreso.
- **Rejillas con mínimo fijo** (`minmax(320px, 1fr)` y similares) que desbordaban el contenido a 320 px en Inicio y Perfil: ahora usan `minmax(min(…, 100%), 1fr)`.
- **Tarjetas huérfanas:** las cuatro cifras del inicio van en una fila (2 × 2 en pantallas medianas) y el jefe final de la Arena ocupa su propia fila.
- `node --test tests/` fallaba en Node 22 o superior: ahora `node --test tests/*.test.js` en `run_tests.sh` y en `npm test`.
- El README decía que el repositorio era privado y que la demo llegaría con la 1.0: ya es público y la demo está en GitHub Pages.

### Añadido
- Prueba e2e del móvil estrecho: a 320, 360 y 390 px, con cifras grandes y en todas las vistas, nada se desborda, ningún control sale de la barra y la búsqueda no se deforma. También cubre el idioma desde «Más». Falla con la 0.4.0.

## [0.7.0] · 2026-10-21 · Cinco rutas más

### Añadido
- Rutas Soporte IT, Proyectos y Agile, UX/UI, Preventa técnica y Cambio de carrera: 26 preguntas propias por ruta, 3 historias modelo bilingües (todas «Brillantes») y 7 términos de glosario.
- La ruta Cambio de carrera usa historias de hostelería, administración y farmacia para mostrar cómo se transfiere la experiencia a IT.
- El asistente ofrece trece rutas.

## [0.6.0] · 2026-10-21 · Cuatro rutas nuevas

### Añadido
- Rutas Sistemas y Cloud, Desarrollo, AppSec y DevSecOps, e IA y ML: 26 preguntas propias por ruta, 3 historias modelo bilingües (todas «Brillantes») y 7 términos de glosario.
- El asistente, la Forja, la Arena, la búsqueda, el glosario y la carta de oferta funcionan con las ocho rutas.
- La insignia «Leyenda de las cuatro rutas» se consigue venciendo al jefe en cuatro rutas cualesquiera.

## [0.5.0] · 2026-10-21 · Inglés, chuleta y ecosistema

### Añadido
- Analizador en inglés completo: léxico ampliado, verbos regulares en pasado tras «I» y detección automática del idioma de cada historia.
- «Entrevista en inglés» en la Arena: pregunta, repreguntas y recruiter en inglés (marcados con `lang="en"`), enlazada con LemonByte.
- Chuleta imprimible con las mejores historias (primera frase de cada bloque).
- «Acerca de» con las ocho herramientas del ecosistema; enlaces comprobados a mano y marca «pendiente de confirmar» cuando no hay web publicada.
- La insignia «Bilingüe» se consigue con una entrevista en inglés.

## [0.4.0] · 2026-10-21 · Juego completo

### Añadido
- XP por historia, por estado alcanzado, por duelo y por insignia; meta diaria de 60 XP y racha de días.
- Seis rangos (Candidato → Estrella) con celebración de partículas al subir; con movimiento reducido, un fundido.
- 34 insignias, 4 de ellas secretas, con vista propia.
- Jefe final por ruta: el Subelistón se desbloquea tras superar a dos recruiters distintos; al vencerlo, carta de oferta ficticia marcada como juego e imprimible en PDF.
- Vista Progreso: rango, meta de hoy, racha, XP por día y evolución de la nota media, con tablas equivalentes.
- La ayuda «Método» genera las reglas del juego desde las constantes del motor.
- Motor `engine/progress.js` probado (XP, rachas, rangos, jefe e insignias).

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
