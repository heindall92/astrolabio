# Historial de cambios

Formato [Keep a Changelog](https://keepachangelog.com/es-ES/1.1.0/) y [versionado semántico](https://semver.org/lang/es/).

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
