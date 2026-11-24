# Historial de cambios

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [versionado semántico](https://semver.org/lang/es/).

## [0.10.0] · 2026-11-24 · Tu marca fuera de la entrevista

Junta en Astrolabio lo mejor de `ai-job-search-es`, del mismo autor: candidaturas, fórmula XYZ, fechas coherentes y plan de contenido. No se ha copiado código de terceros; los textos son de redacción propia.

### Añadido
- **Tu marca** (`#marca`), con cuatro pestañas:
  - **LinkedIn** (`kitLinkedIn`):
    - hasta tres titulares con su contador sobre los 220 caracteres del editor;
    - «Acerca de» con tu frase, quién eres, tu ventaja, los logros del CV tal cual, tu punto de vista y tus herramientas, con lo que se ve antes de «ver más» resaltado;
    - palabras clave de tus ofertas que faltan en el perfil;
    - mensaje para pedir una recomendación.
  - **CV de resultados** (`revisarCV`):
    - fórmula XYZ por viñeta (verbo de acción, cifra y cómo);
    - verbo propuesto para las viñetas que empiezan por un sustantivo, sin proponer nunca una cifra;
    - fechas sin mes y ficha de fechas para que el CV, los formularios y LinkedIn coincidan.
  - **Bóveda** (`seleccionarBoveda`): seis historias que cubren competencias distintas, con «úsala para…» repartido por turnos (ninguna pregunta se repite) y las competencias que faltan.
  - **Field Notes:**
    - borrador de post desde una nota del Baúl (`borradorPost`), con tu cifra o tu punto de vista como gancho;
    - revisión del borrador (`auditarPost`): longitud, primera línea, pregunta inicial, cifra, hashtags, enlaces, relleno genérico, cebo y huecos;
    - plan cada 7, 14 o 30 días y calendario `.ics` según RFC 5545, con líneas plegadas a 75 octetos;
    - marca de publicado.
- **Candidaturas** (`#candidaturas`):
  - mismo modelo que `ai-job-search-es` (`ajs-candidaturas` v1);
  - importar (también desde «Importar» de la cuenta) y exportar, con fusión que respeta la versión más reciente y nunca borra;
  - estados, prioridad, próximo paso y seguimiento, con avisos de vencidas y de enviadas sin respuesta tras 7 días;
  - enlaces solo http(s), abiertos con `noopener noreferrer`;
  - «Preparar la entrevista» desde cada candidatura.
- Candidaturas en Ctrl K, accesos en Inicio y en «Más», y Privacidad al día.

### Pruebas
- **Motor:** `tests/marca.test.js`, 10 pruebas nuevas (216 en total).
  - Incluye la ida y vuelta con el archivo de ejemplo de `ai-job-search-es` (`tests/fixtures/candidaturas-ajs.json`) y la comprobación de que el «Acerca de» no trae cifras que no estén en el CV.
- **e2e:** `tests/e2e_marca.py` añade tres flujos (34 en total).
- **axe:** 0 infracciones en las vistas nuevas y en el diálogo de importación. El primer barrido encontró un salto de encabezado y un `summary` de 23 px en Field Notes; ya están corregidos.

## [0.9.0] · 2026-11-24 · De tu CV al guion en directo

### Añadido
- **Lector de CV en el navegador** (`engine/documento.js`). Lee PDF, DOCX, ODT y TXT sin librerías ni red.
  - **PDF:** descomprime con `DecompressionStream` y lee los flujos de objetos. Sigue el árbol de páginas y decodifica cada fuente (`ToUnicode`, `/Differences` y WinAnsi). Mide el ancho de cada glifo (`/W`, `/Widths`) para no inventar espacios por el interletraje, que es el fallo típico de los PDF de Chromium y Google Docs.
  - **DOCX y ODT:** lee el ZIP y sus párrafos.
  - Probado con los mismos CV ficticios exportados por Chromium, LibreOffice y pandoc (`tests/fixtures/cv/`, regenerables con `generar.py`).
- **Análisis del CV** (`engine/cvlector.js`):
  - nombre y titular;
  - experiencias con fechas en español e inglés («03/2024 – actualidad», «Jan 2023 – Present», «marzo de 2021 - junio de 2023»), con meses sin contar solapes y puesto actual;
  - tecnologías y certificaciones, con el léxico del lector de ofertas;
  - logros con cifra, ordenados;
  - idiomas con su nivel;
  - frases que el PDF partió por el margen, unidas de nuevo.
- **Baúl de notas** (`#baul`). Formularios para seis tipos de nota: herramienta (como tu EDR o XDR), concepto (versión para negocio y técnica), proyecto, certificación, empresa e idea. Tiene filtro por tipo, búsqueda sin tildes y entra en Ctrl K. Cada nota se cruza con las tecnologías de la oferta.
- **Marca personal**: tu ventaja del 10 %, tu punto de vista, tu frase y tu hilo conductor. Se usan en «Háblame de ti» y en el cierre.
- **Preparar entrevista** (`#entrevista`), en cuatro pasos:
  - la entrevista: formato, quién entrevista, idioma y país;
  - tu CV, subido o pegado;
  - la oferta, con la banda salarial que publique y las dudas automáticas;
  - preguntas de apoyo.

  Se guarda solo en este navegador.
- **Tu guion** (`#guion`, `engine/guion.js`): bloques por tipo de pregunta.
  - **Saludo y «Háblame de ti»**, generado con el CV, la marca y tu motivo, y puntuado con el mismo analizador de la presentación.
  - **Motivación**, con tu respuesta o tu nota de la empresa.
  - **Experiencia y logros.**
  - **Técnicas:** la nota del Baúl responde. Lo que solo está en el CV pide un ejemplo, y lo que no tienes se reconoce con honestidad.
  - **Situaciones STAR** con tus historias, sin repetir la misma.
  - **Difíciles:** salida, defecto, cinco años, hueco del CV y las dudas de la oferta por años o idioma.
  - **Salario:** la pregunta en dos tiempos (ver abajo).
  - **Tus preguntas** según quién entrevista, y **cierre**.

  Los huecos se marcan [entre corchetes]: nada se inventa. Cada bloque se puede editar y restaurar, y el guion se descarga en `.txt` o se imprime.
- **«¿Cuáles son tus expectativas salariales?» en dos tiempos** (especificación del 27-10-2026, `engine/salario.js`):
  - **Primer tiempo:** no cerrarse a una banda y preguntar la del puesto.
  - **Segundo tiempo, si insisten:** un rango con argumento («teniendo en cuenta las responsabilidades, los logros y el proyecto…») que sale de la oferta y del CV.
  - **Preparador de rango en «Preparar entrevista»:**
    - tu objetivo (X), tu ancla (Y) y tu mínimo, que nunca se dice;
    - bruto anual o mensual, y 12, 14 o 13 pagas (con aguinaldo);
    - avisos en vivo si la X no supera el mínimo, si el ancla queda por debajo o si el rango pasa del 20 % (se recorta).
  - **Preguntas relacionadas:** «¿Y una cifra concreta?», «¿Aceptarías menos?», la respuesta por escrito a una oferta con cifra y dónde investigar la banda (ofertas con salario, convenio y sus tablas, informes públicos). Astrolabio no propone ninguna cifra; hay una prueba que lo comprueba.
- **Ronda salarial**, en «Preparar entrevista» y al ganar un duelo en la Arena («Me has convencido. Hablemos de condiciones»):
  - puntúa el rango (no una cifra suelta), que lo justifiques, que hables del resto de condiciones, que no te disculpes y que no des tu mínimo;
  - si no das cifra, el recruiter repregunta «¿Y una cifra concreta?».
- **Pregunta por el salario anterior (España).** Incluye la respuesta y la cita literal de la Ley 3/2023 de Empleo, art. 5 g), en la redacción del Real Decreto-ley 39/2026 (BOE n.º 287, de 18-11-2026, en vigor desde el 19-11-2026). La norma prohíbe preguntar por el historial retributivo y obliga a publicar la retribución inicial en la oferta.
- **Posibles preguntas**, cada una con su motivo (casi siempre, la oferta, tu CV, tu Baúl, la ley o un hueco) y un enlace a la respuesta. Incluye un banco propio de preguntas técnicas para 30 tecnologías.
- **Guion en directo** (`#directo`), un teleprompter para videollamadas:
  - tipos de pregunta en las teclas 1 a 0, y búsqueda de pregunta;
  - modo palabras clave o texto completo con avance por palabras por minuto;
  - tamaño del texto, «cerca de la cámara», pantalla completa y cronómetro por respuesta;
  - pantalla siempre encendida mientras lee.

  Con movimiento reducido avanza línea a línea. Los ajustes se recuerdan.
- Guía de `c-salario` en dos tiempos. Ayuda: guía de la entrevista concreta y atajos del guion en directo. Privacidad: el CV y el Baúl. Inicio: accesos a «Preparar entrevista» y al Baúl.

### Seguridad
- **Límites del lector:**
  - 10 MB por archivo;
  - 40 MB descomprimidos en total, una defensa contra bombas de descompresión aunque el ZIP mienta sobre su tamaño;
  - 20.000 objetos por PDF.
- **PDF cifrado o sin texto:** error claro, sin colgar la página.
- **Saneado del estado nuevo campo a campo:** solo los campos de cada tipo de nota y sus límites, entrevistadores y formatos válidos, ediciones con id seguro y nada de claves de prototipo.

### Pruebas
- **Motor:** `tests/documento.test.js` y `tests/guion.test.js`, 35 pruebas nuevas (206 en total).
- **e2e:** `tests/e2e_guion.py` añade siete flujos:
  - CV en PDF y DOCX, error claro con un PDF escaneado, preparador de rango y ronda salarial;
  - Baúl;
  - guion, con ediciones, ley y descarga;
  - teleprompter con teclado y movimiento reducido;
  - ninguna rama vacía se pinta como «null» (la prueba se escribió fallando contra la primera versión de la ronda salarial);
  - inglés y móvil;
  - borrar la entrevista.
- **axe:** las seis vistas nuevas y sus estados (ronda salarial incluida) en claro, oscuro, 1280 y 390 px, con 0 infracciones.

## [0.8.3] · 2026-11-09 · Cifras que cuadran al importar

### Corregido
- Al sumar historias de otra herramienta, el diálogo anunciaba el total del archivo y luego nuevas y repetidas, que no sumaban ese total si alguna historia no se podía leer. Ahora da las nuevas, las que ya tenías y, si las hay, las que se ignoran, con la cifra al final para no depender del plural. Prueba e2e con un archivo mixto.

## [0.8.2] · 2026-11-09 · Historias de Blue-Jr

### Añadido
- **Historias de Blue-Jr.** El simulador de SOC [Blue-Jr](https://github.com/heindall92/Blue-Jr) exporta cada ticket cerrado como historia STAR en el sobre del ecosistema (`yrd-ecosistema`, tipo `historias`, `app: "blue-jr"`). Al importarlo, el diálogo dice de dónde vienen y cuántas son nuevas, y las suma a las tuyas.
- `mergeStories` en el motor: sanea cada historia que llega, añade las nuevas sin pasar del límite y deja intactas las que ya tenías con el mismo id (puedes haberlas editado).
- Pruebas: `tests/ecosistema.test.js` (el ejemplo de Blue-Jr pasa el saneado sin perder un campo; suma, repetidas, límite y datos hostiles) y e2e de la importación (tus historias, XP, racha y perfil intactos; importar dos veces no duplica).

### Corregido
- Importar un archivo de otra herramienta del ecosistema reemplazaba **todos** tus datos. Ahora solo la copia de Astrolabio reemplaza (y lo avisa); lo demás se suma.

## [0.8.1] · 2026-10-27 · README al día

### Corregido
- **El README no reflejaba bien la 0.8.** Decía «en desarrollo» y las novedades quedaban escondidas en mitad de «Cómo se usa». Ahora hay un apartado «Novedades de la 0.8» arriba, con su captura, y el estado dice «publicada».
- **El generador del README borraba la 0.8.** La 0.8.0 se escribió a mano en `README.md` y no en `docs/README.template.md` ni en `docs/readme.py`. Al regenerarlo desaparecían las novedades, las capturas de Oferta, «Háblame de ti» y Traductor, el apartado «Lo siguiente» y la 0.7.4 y la 0.8.0 del historial. Todo pasa a la plantilla y al generador.
- **Historial de versiones desordenado:** la 0.8.0 aparecía entre la 0.7.4 y la 0.7.0. El generador ordena ahora por número de versión.
- El esquema de arquitectura decía 106 iconos Lucide; son 119 (la cifra sale del propio código).

### Añadido
- `python3 docs/readme.py --check` falla si `README.md` no coincide con lo que generaría. Se ejecuta en `run_tests.sh` y, por tanto, en la CI, para que no vuelva a desfasarse.

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
