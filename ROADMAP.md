# ASTROLABIO · Roadmap

> **Cuenta tu historia. Gana la entrevista.**
> *Tell your story. Win the interview.*

Laboratorio-juego, gratuito y de código abierto, para preparar entrevistas laborales con el **método STAR** (Situación, Tarea, Acción, Resultado). Cada persona elige su rol y su nivel y escribe sus propias vivencias. Con ellas, Astrolabio la entrena contra *recruiters* que repreguntan, puntúa sus respuestas y le enseña qué le falta. Funciona en el navegador, sin cuentas y sin servidor: **las historias nunca salen del dispositivo**.

Autor: **Yoandy Ramírez Delgado** (`heindall92`). Repositorio previsto: `heindall92/astrolabio`. Web: `https://heindall92.github.io/astrolabio/`.

---

## 0. Por qué «Astrolabio»

| Lectura | Qué significa |
|---|---|
| **ASTRO** | *Star*, estrella: el método STAR. |
| **LAB** | Es un laboratorio, como LemonByte y ARGOS. |
| **LABIO** | El labio, hablar: la entrevista se gana contando bien. |
| **Astrolabio** | Instrumento con el que los navegantes se orientaban por las estrellas. Aquí orienta a quien busca trabajo. |

- Una sola palabra, en español, curiosa y fácil de recordar. En inglés se entiende como *Astrolabe*.
- Antes de crear el repositorio, comprobar que el nombre está libre en GitHub y en las tiendas de dominios, y que no hay ningún producto de empleo con ese nombre.

### Logo

**Concepto:** una **estrella de cuatro puntas** (destello) dentro de un **bocadillo de diálogo**. Cada punta lleva, muy sutil, una letra: S arriba, T a la derecha, A abajo y R a la izquierda. La cola del bocadillo forma una pequeña curva, como un labio sonriendo. Es «una estrella que habla».

- **Prohibido el anillo o el círculo como forma principal**, que es la firma de Rosetta. El bocadillo es redondeado, pero no un anillo.
- **Colores:** estrella en oro estelar (`#FFC233`) con un degradado suave hasta blanco cálido en el centro. Bocadillo en tinta noche (`#0B1024`) o transparente según el fondo.
- **Debe leerse** a 16 px (favicon), 32 px (lateral) y 512 px (README y redes).
- **Indicación para el generador de imágenes:** *«Minimal app logo: a four-pointed sparkle star inside a rounded speech bubble, the bubble tail curving like a subtle smile. Star in warm golden yellow (#FFC233) with soft white glow at the center, bubble in deep night navy (#0B1024). Flat vector, clean geometry, no text, no circles or rings, centered, transparent background, premium Apple-like style.»*
- **Marca escrita:** `Astro` en tinta y `labio` en oro, y debajo una submarca en monoespaciada mayúscula: `STAR INTERVIEW LAB`.
- **Vídeo de intro** (opcional, como en LemonByte): la estrella cae, se enciende, sus cuatro puntas dibujan S-T-A-R y aparece la marca. Formato horizontal para ordenador y vertical para móvil, WebM y MP4 de respaldo, solo en la primera visita y nunca con movimiento reducido.

---

## 1. La idea: «Junior contra Recruiter»

La entrevista se plantea como un juego que la persona puede ganar, para que pierda el miedo.

```
  PERFIL ──► FORJA ──► CONSTELACIÓN ──► ARENA ──► INFORME ──► (XP, rangos, insignias)
  quién soy   mis       qué cubro y       duelo con  qué hice
              historias qué me falta      recruiters bien y qué mejoro
```

1. **Perfil.** Rol, nivel, idioma de la entrevista y tipo de empresa. Como en Rosetta, la app **empieza por aquí**, y todo lo demás se adapta al perfil.
2. **Forja.** Formulario guiado para escribir historias STAR a partir de vivencias reales. El analizador las puntúa en vivo y explica cada corrección.
3. **Constelación.** Mapa de las competencias que cubren las historias de la persona. Cada historia es una estrella y cada competencia, una constelación. Se ve al momento qué competencias no tienen ninguna historia.
4. **Arena.** Duelos contra recruiters con carácter. Lanzan preguntas del rol, repreguntan («¿y tú qué hiciste exactamente?») y tienen una barra de **convicción** que la persona tiene que llenar.
5. **Informe.** Al acabar cada duelo: qué funcionó, qué faltó, la frase que conviene reescribir y la historia que mejor encaja con esa pregunta.

**El mensaje para los perfiles junior:** «No estás solo. Tu experiencia vale aunque venga de unas prácticas, un CTF, un máster, un voluntariado o un trabajo de hostelería. Aquí aprendes a contarla».

### Historias reales y de ensayo

- **Real (por defecto):** vivencias propias.
- **Ensayo:** historias inventadas o plantillas de ejemplo para practicar **la estructura**. Llevan una etiqueta visible: «Ensayo: en la entrevista usa una historia real. Los entrevistadores repreguntan hasta encontrar los detalles y una historia inventada se nota». Así se cumple lo que pidió Yoandy (que cada cual se prepare también con lo que quiera inventar) sin animar a mentir en el proceso real.

---

## 2. Rutas por rol

Cada ruta tiene su banco de preguntas, historias de ejemplo, recruiters y glosario propios.

| Fase | Rutas |
|---|---|
| **v0.x (lanzamiento)** | **Red Team / Pentesting** · **Blue Team / SOC** · **GRC / Auditoría** · **Data / Analítica** |
| v1.x | Sistemas y Cloud · Desarrollo · AppSec y DevSecOps · IA y ML |
| v2.x | Soporte IT · Gestión de proyectos y Agile · UX/UI · Preventa técnica · **Cambio de carrera** (de otro sector a IT) |

**Niveles del perfil:** Sin experiencia (estudiante, bootcamp o reconversión) · Junior (0–2 años) · Mid (2–5 años) · Senior (5 años o más). El nivel cambia las preguntas, la exigencia del analizador y lo que espera el recruiter: un junior puede usar historias académicas, a un senior se le piden impacto e influencia.

**Tipo de empresa:** consultora · banca y seguros · gran tecnológica · startup · administración pública · industria. Cambia el tono del recruiter y las competencias que más se valoran. En banca, por ejemplo, pesan el cumplimiento, el riesgo y la confianza.

### Preguntas semilla (redacción propia, se amplían en cada fase)

**Red Team / Pentesting**
1. Cuéntame una vez que encontraste una vulnerabilidad crítica y tuviste que explicársela a alguien no técnico.
2. Háblame de un reto (CTF, máquina o auditoría) en el que te atascaste. ¿Qué hiciste para desbloquearlo?
3. Una vez que el alcance de un trabajo no estaba claro: ¿cómo lo resolviste?
4. Cuéntame una ocasión en la que tuviste que decir que no a una prueba arriesgada.
5. ¿Cuál es el informe del que estás más orgulloso y por qué?

**Blue Team / SOC**
1. Cuéntame una alerta que parecía un falso positivo y no lo era.
2. Una noche de guardia en la que todo se complicó: ¿qué priorizaste?
3. Una regla de detección que mejoraste. ¿Cómo mediste que funcionaba?
4. Una vez que tuviste que escalar un incidente sin tener toda la información.
5. Háblame de un error tuyo en un incidente y de lo que cambiaste después.

**GRC / Auditoría**
1. Una vez que tuviste que convencer a un área de negocio de aplicar un control que no quería.
2. Una auditoría con poco tiempo y muchas evidencias pendientes: ¿cómo la organizaste?
3. Un hallazgo incómodo que tuviste que comunicar a dirección.
4. Cuando una norma decía una cosa y la realidad de la empresa otra: ¿qué hiciste?
5. Un proceso que simplificaste sin perder cumplimiento.

**Data / Analítica**
1. Un análisis tuyo que cambió una decisión. ¿Cómo lo supiste?
2. Datos sucios y un plazo imposible: ¿qué sacrificaste y por qué?
3. Una vez que tus números contradecían lo que alguien importante quería oír.
4. Un panel o informe que nadie usaba y cómo lo arreglaste.
5. Cuando tuviste que explicar una métrica compleja a alguien sin formación técnica.

**Comunes a todos los roles (incluidas las preguntas trampa):** tu mayor error · un conflicto con un compañero · cuándo cambiaste de opinión · un objetivo que no cumpliste · por qué quieres este puesto · un hueco en el CV · tu mayor defecto · expectativas salariales. Para estas últimas hay una **guía de respuesta**, no una plantilla STAR.

---

## 3. Competencias

Hay dos capas, para no depender de una sola empresa.

**A. Competencias genéricas (12):** iniciativa y responsabilidad · orientación al cliente · aprendizaje continuo · análisis y detalle · resolución de problemas · comunicación · trabajo en equipo · liderazgo e influencia · gestión de conflictos · trabajo bajo presión · ética y confianza · resultados.

**B. Correspondencia con marcos conocidos.** Los 16 *Leadership Principles* de Amazon se citan **solo por su nombre**, que es público: Customer Obsession, Ownership, Invent and Simplify, Are Right A Lot, Learn and Be Curious, Hire and Develop the Best, Insist on the Highest Standards, Think Big, Bias for Action, Frugality, Earn Trust, Dive Deep, Have Backbone; Disagree and Commit, Deliver Results, Strive to be Earth's Best Employer, Success and Scale Bring Broad Responsibility.

- Las descripciones y ejemplos de cada principio son **de redacción propia**; no se copian los textos oficiales.
- **Aviso de independencia** (README, ayuda y pie): «Astrolabio no está afiliado ni respaldado por Amazon ni por ninguna empresa citada. Los nombres de principios y competencias se usan solo como referencia».

---

## 4. El analizador STAR (el motor)

Funciona en local, con reglas explicables y sin IA. Es determinista, puro y está probado. **Todas las constantes se exportan desde el motor y la ayuda se genera a partir de ellas** (nunca se escriben a mano).

| Comprobación | Regla inicial (constante ajustable) | Mensaje de ejemplo |
|---|---|---|
| Reparto S/T/A/R | S 15–20 %, T 10–15 %, **A 50–60 %**, R 15–20 % de las palabras | «La situación ocupa el 45 %: el entrevistador quiere saber qué hiciste, no todo el contexto». |
| Duración | 150–350 palabras ≈ 1–2,5 min hablando (140 palabras por minuto) | «Unos 3 min 40 s: recorta la situación». |
| «Yo» frente a «nosotros» en la acción | ≥ 60 % de verbos en primera persona del singular | «Dices "hicimos" 6 veces: ¿qué parte hiciste tú?». |
| Resultado medible | Al menos una cifra, un porcentaje, un tiempo o un antes y después | «Sin cifra: ¿cuánto tiempo, dinero o riesgo ahorraste?». |
| Verbos de acción | Lista ES/EN (analicé, prioricé, automaticé, escalé, negocié…) | «Empiezas tres frases con "estuve"; prueba con verbos de acción». |
| Muletillas y vaguedades | básicamente, un poco, cosas, algo, intenté, más o menos… | «"Intenté" resta fuerza: ¿lo hiciste o no?». |
| Aprendizaje | Opcional (STAR-L): frase de cierre con lo aprendido | «Añade qué harías distinto la próxima vez». |
| **Datos sensibles** | Detecta IP, correos, dominios internos, nombres de clientes marcados y CVE de clientes | «Has escrito una IP real. Anonimízala: en entrevista no se revelan datos de clientes». Encaja con el público de ciberseguridad. |

- **Puntuación de 0 a 100** por historia, con desglose por criterio, y estados *Borrador*, *Lista* y *Brillante*.
- **Idioma:** reglas en español e inglés, porque la persona puede preparar la entrevista en inglés. Se enlaza con **LemonByte** para practicar el vocabulario.
- **Más adelante (v1.x, opcional y desactivado por defecto):** IA con la clave de API de la propia persona, siempre avisando de que el texto saldría del dispositivo. Por defecto, cero red.

---

## 5. La Arena: recruiters con carácter

Personajes de creación propia. Cada ruta tiene su elenco y un **jefe final**.

| Recruiter | Estilo | Dificultad |
|---|---|---|
| **Rita, de RRHH** | Filtro inicial, amable, preguntas de motivación y encaje | Fácil |
| **El Hiring Manager** | Técnico y de comportamiento, repregunta detalles | Media |
| **El Panel de Banca** | Tres a la vez: riesgo, cumplimiento y negocio. Valora la confianza | Difícil |
| **La Startup a Mil** | Ritmo rápido, ambigüedad, «¿y si mañana cambia todo?» | Difícil |
| **El Subelistón** (jefe final) | Busca huecos, repregunta tres veces y pide cifras | Insane |

**Mecánica:**
- **Barra de convicción** del recruiter, de 0 a 100. Cada respuesta la sube o la baja según el analizador más los criterios del personaje. Si llega a 100, «Pasas a la siguiente fase».
- **Barra de nervios** de la persona. Sube con el cronómetro y baja con buenas respuestas. Es solo un efecto visual; con movimiento reducido se queda quieta.
- **Repreguntas** según lo que falte en la respuesta: sin cifra → «¿Cómo mediste el resultado?»; mucho «nosotros» → «¿Y tú, concretamente?»; acción corta → «Llévame paso a paso».
- **Modos:**
  1. **Escrito:** el analizador puntúa la respuesta.
  2. **En voz alta:** cronómetro, y la persona se autoevalúa con una lista de comprobación.
  3. **Contrarreloj:** 90 segundos por respuesta.
  4. **Sorpresa:** pregunta aleatoria de cualquier competencia.
- **Elige tu historia:** antes de responder, la persona elige qué historia de su banco usar. La app sugiere la que mejor encaja con la competencia de la pregunta.
- **Informe del duelo:** lo que funcionó, lo que faltó, la frase a reescribir y la historia que habría encajado mejor.
- **Voz (opcional y avisado):** el reconocimiento de voz del navegador envía el audio a servidores externos en algunos navegadores. Por eso va **desactivado por defecto**, con una advertencia clara. La lectura en voz alta de las preguntas (síntesis local) sí se puede usar.

---

## 6. Gamificación

- **Rangos:** Candidato → Preseleccionado → Entrevistado → Finalista → Contratado → **Estrella**.
- **XP:** por historia escrita, por historia que pasa a *Lista* o *Brillante*, por duelo superado y por constelación completa. Hay **meta diaria** y **rachas**, como en LemonByte.
- **Unas 30 insignias, 4 de ellas secretas.** Ejemplos: *Primera estrella* · *Sin «nosotros»* · *Cifra en mano* · *Constelación completa* · *Sobreviviste al Subelistón* · *Bilingüe* · *Madrugador* · *De la hostelería al SOC* (reconversión).
- **Carta de oferta:** al vencer al jefe final de una ruta se genera una «carta de oferta» ficticia, divertida y descargable en PDF, marcada claramente como **juego**. Es el momento para compartir en LinkedIn: «He sobrevivido al Subelistón en Astrolabio».
- **Sonidos** sintetizados con Web Audio (acierto, fallo, estrella nueva, rango) y un botón para silenciarlos.
- **Celebraciones** breves: partículas de estrella al subir de rango. Con movimiento reducido, un fundido.

---

## 7. Firma visual: la Constelación

Cada herramienta del ecosistema tiene su visualización: Rosetta los anillos, CTEM-Nexus las franjas y el grafo, LemonByte la matriz de 100 laboratorios. **Astrolabio tiene la Constelación.**

- Un lienzo nocturno (`#0B1024` en oscuro; en claro, papel azulado `#F2F4FB` con estrellas en tinta).
- **Cada competencia es una constelación**, en una posición fija y estable (no aleatoria) en una cuadrícula de 4 × 3 zonas.
- **Cada historia es una estrella** dentro de las constelaciones que cubre. Su brillo y tamaño dependen de la puntuación: *Borrador* tenue, *Lista* nítida, *Brillante* con destello.
- **Las líneas** unen las estrellas de una misma competencia. Una competencia sin historias se ve como un contorno punteado con el texto «Te falta una historia de *gestión de conflictos*».
- **Interacción:** al pasar o enfocar una estrella se abre una ficha con el título, la puntuación y las competencias. Las flechas del teclado recorren las estrellas y Enter abre la historia. Objetivos táctiles de al menos 24 × 24 px.
- **Accesible:** se acompaña de una lista equivalente (tabla de competencias con número de historias y la mejor puntuación) y de un `aria-label` resumen.
- **Movimiento:** al guardar una historia, su estrella aparece con un destello de 300 ms y la línea se dibuja con `stroke-dashoffset`. Con movimiento reducido, un fundido.
- **No usar anillos, donuts ni gráficos circulares** en ningún sitio.

---

## 8. Diseño: el sistema de siempre

Resumen operativo del sistema de diseño.

### Shell (igual que Rosetta, LemonByte y ARGOS)

```
┌──────────────┬───────────────────────────────────────────────────────────────────┐
│  LATERAL     │  BARRA SUPERIOR (píldora de cristal, sticky)                      │
│  flotante    │  [⇤]  [🔥 racha] [⚡ XP] [🔍 Buscar Ctrl K] [ES|EN] [☀|☾] [🔊] [?] │
│              ├───────────────────────────────────────────────────────────────────┤
│  logo +      │  ANTETÍTULO · MONO · ACENTO                                       │
│  Astrolabio  │  Título h1                                          [acción]      │
│  STAR LAB    │  Entradilla                                                       │
│  [Perfil ▾]  │                                                                   │
│  Inicio      │  Tarjetas con aparición escalonada (40 ms)                        │
│  Forja       │                                                                   │
│  Constelación│                                                                   │
│  Arena       │                                                                   │
│  Progreso    │                                                                   │
│  Insignias   │                                                                   │
│  ──────────  │                                                                   │
│  Acento 🎨   │                                                                   │
│  Cuenta ⋯    │                                                                   │
└──────────────┴───────────────────────────────────────────────────────────────────┘
Móvil (< 768 px): sin lateral; barra inferior con Inicio · Forja · Arena · Constelación · Más.
«Más» contiene Progreso, Insignias, Perfil, Ayuda y los 7 ACENTOS (en LemonByte se olvidaron al principio).
```

- **Todo en una sola página web** (una app de página única con rutas por `#hash`): `#inicio`, `#perfil`, `#forja`, `#constelacion`, `#arena`, `#progreso`, `#insignias`.
- **Perfil como en Rosetta:** en la primera visita, un asistente de tres pasos (rol → nivel → empresa e idioma). Después, una píldora de perfil en el lateral para cambiarlo y la cuenta abajo, con avatar de iniciales.
- **Barra superior:** cada control una sola vez. Búsqueda `Ctrl K` / `⌘K` (historias, preguntas, competencias, glosario), `ES | EN` con `aria-pressed`, interruptor de tema con `role="switch"`, sonido y ayuda.
- **Centro de ayuda** con pestañas: *Guía*, *Método STAR* (generado desde las constantes del motor), *Recruiters*, *Atajos*, *Glosario* y *Acerca de* (autor, versión, aviso de independencia, ecosistema y soporte).

### Tokens

- **Superficies:** oscuro `#08090b` / `#111317` / `#171a1f` / `#1e2228`; claro `#f3f5f7` / `#ffffff` / `#eef1f4` / `#e2e6eb`.
- **Tinta:** oscuro `#eef1f3`, `#a3aab2` y `#8f97a0`; claro `#101418`, `#2c3440` y `#5c6773`.
- **Los 7 acentos de Rosetta** en `data-accent`, con **azul eléctrico por defecto**:

| Acento | Oscuro | Claro |
|---|---|---|
| azul (por defecto) | `#6b9bff` | `#1a4fe0` |
| rosa | `#ff7ab8` | `#b8155a` |
| solar | `#ffb020` | `#8a4a00` |
| glaciar | `#5ee7f5` | `#0a6a7d` |
| orquídea | `#b79bff` | `#5b35f0` |
| verde bosque | `#5aa86a` | `#1a6b36` |
| rojo | `#ff6b6b` | `#b3141a` |

- **Color de marca, el oro estelar**, solo para lo que se gana (XP, estrellas, rangos, insignias) y **siempre de relleno con texto oscuro**: `--star: #ffc233` (oscuro `#ffcf4d`) y `--star-ink: #241a00`. Lienzo de la Constelación: `--night: #0b1024`.
- **Colores de estado:** *Brillante* en el oro de marca, *Lista* en el acento, *Borrador* en `ink-3`. Nunca solo color: llevan también icono y texto.
- **Tipografía:** Geist y Geist Mono (Fontsource, OFL, incrustadas en woff2) para interfaz, cifras, `kbd` y antetítulos. Una fuente de titular propia solo para tamaños grandes, por ejemplo *Sora* o *Bricolage Grotesque*: probar las dos en claro y oscuro y quedarse con una.
- **Iconos: solo Lucide**, por ejemplo `sparkles`, `star`, `message-square-quote`, `swords`, `user-round`, `briefcase-business`, `shield-half`, `shield-check`, `scale`, `chart-column`, `flame`, `zap`, `award`, `trophy`, `timer`, `mic`, `languages`, `palette`, `search`, `circle-question-mark`, `sun` y `moon`. Usar los nombres canónicos de la versión instalada.

### Movimiento (Emil Kowalski, estilo Apple)

- `:active { transform: scale(.97) }` en todo lo que se pulsa (de 100 a 160 ms).
- **Curvas:** `--ease-out: cubic-bezier(.23,1,.32,1)`, `--ease-in-out: cubic-bezier(.77,0,.175,1)`, `--ease-drawer: cubic-bezier(.32,.72,0,1)`.
- **Vistas:** aparecen en 200 ms con `@starting-style` (opacidad más `translateY(6px)`), y las tarjetas de forma escalonada, 40 ms entre una y otra.
- **Muelles sin rebote**, interrumpibles, con el mismo camino de entrada y de salida. Los *popovers* usan `transform-origin` en el botón que los abre y nunca parten de `scale(0)`.
- **Cambio de tema** (lección de LemonByte 0.2.2–0.2.4): un único fundido CSS en vivo. Todos los elementos cambian a la vez, con la misma duración (0,32 s) y la misma curva, mediante una clase temporal en `<html>`. **Nada de View Transitions**, porque congelan la barra de cristal y duplican la bola del interruptor.
- **Movimiento reducido = fundido.** Sin partículas, sin la barra de nervios animada y sin intro.

### Accesibilidad

- **WCAG 2.2 AA verificado con axe-core: 0 infracciones** en todas las vistas, en claro y oscuro, a 1280 y 390 px, y en cada paso de la Arena.
- Foco visible, diálogos con foco atrapado y devuelto, Escape en cada ventana, objetivos de al menos 24 × 24 px.
- La Constelación lleva siempre su lista equivalente y el cronómetro se anuncia con `aria-live` sin saturar.

---

## 9. Arquitectura

**Igual que LemonByte:** JavaScript sin framework, un `app/build.js` que genera **un único HTML autónomo** con **CSP por hashes**, más una versión sin `<head>` para incrustarla como artefacto.

- **Local-first:** el progreso en `localStorage` (con IndexedDB si crece). Se exporta e importa como JSON.
- **Motor puro sin DOM** (`app/src/engine/`): analizador STAR, puntuación, recruiters, XP, insignias y saneado. Todo con pruebas unitarias.
- **i18n:** diccionarios `es.js` y `en.js` con **paridad de claves comprobada en una prueba**, y formatos con `Intl` (`es-ES`, `en-GB`). Una prueba e2e recorre todas las vistas en inglés buscando restos en español.
- **CSP:** `default-src 'none'`, `script-src` y `style-src` con los hashes del build, `font-src data:`, `img-src data:`, `media-src 'self'` (solo para la intro), `connect-src 'none'`, `base-uri 'none'`, `form-action 'none'` y `object-src 'none'`.
- **Seguridad de la entrada:** las historias son **texto del usuario**. Siempre `textContent` o un escapado central, **nunca `innerHTML` con datos del usuario**. El JSON importado pasa por `safeParse` (descarta `__proto__`, `constructor` y `prototype`) y se reconstruye campo a campo con un `sanitize()` que pone límites de longitud y de número de elementos.
- **Privacidad:** son datos personales. No hay red, analítica ni cuentas. Un botón «Borrar todo» pide confirmación, y el aviso de datos sensibles se ocupa de las IP y de los clientes.
- **Ecosistema:** se exporta en el sobre común `yrd-ecosistema` v1 (tipo `historias`) y se enlaza con LemonByte (inglés), ARGOS (GRC), Rosetta y CTEM-Nexus en «Acerca de».

### Modelo de datos (JSON)

```json
{
  "version": 1,
  "perfil": { "nombre": "Ana", "rol": "blue", "nivel": "junior", "empresa": "banca", "idioma": "es" },
  "historias": [
    {
      "id": "h_8f2c",
      "titulo": "La alerta de las 3:00",
      "tipo": "real",
      "s": "…", "t": "…", "a": "…", "r": "…", "l": "…",
      "competencias": ["presion", "analisis", "resultados"],
      "creada": "2026-10-20", "editada": "2026-10-21"
    }
  ],
  "duelos": [ { "fecha": "2026-10-21", "recruiter": "rita", "ruta": "blue", "conviccion": 82, "superado": true } ],
  "xp": 340, "racha": 3, "insignias": ["primera-estrella"], "historialXp": { "2026-10-21": 60 }
}
```

La puntuación de cada historia **no se guarda**: se recalcula con el motor para que siempre esté al día con las reglas.

---

## 10. Árbol de directorios

> El logo se versiona como SVG dibujado a mano (`app/vendor/astrolabio-mark.svg`) en lugar de WebP: pesa menos y escala a cualquier tamaño.

```
astrolabio/
├── index.html                    # Portada de GitHub Pages: abre dist/index.html (como LemonByte 0.2.1)
├── README.md                     # Qué es, demo, capturas, método, privacidad, ecosistema, independencia
├── ROADMAP.md                    # Este documento, con las casillas marcadas al avanzar
├── CHANGELOG.md                  # Keep a Changelog + semver
├── SECURITY.md                   # Modelo de amenazas, CSP, datos personales
├── CONTRIBUTING.md
├── CLAUDE.md                     # Autoría y diseño para los asistentes de código
├── LICENSE                       # GPLv2 o MIT (como LemonByte: GPLv2)
├── package.json                  # Única fuente de versión
├── run_tests.sh                  # build + motor + e2e + axe
├── app/
│   ├── build.js                  # Concatena, incrusta fuentes e iconos, calcula la CSP, escribe dist/
│   ├── media/                    # intro-h.webm/.mp4, intro-v.webm/.mp4 (opcional)
│   ├── vendor/
│   │   ├── geist-latin-wght-normal.woff2
│   │   ├── geist-mono-latin-wght-normal.woff2
│   │   ├── lucide-icons.json     # Solo los iconos usados (generado desde lucide)
│   │   └── astrolabio-mark.webp  # Logo
│   └── src/
│       ├── body.html             # Shell: lateral, barra, vistas, diálogos, barra inferior
│       ├── styles.css            # Tokens, shell, vistas, movimiento, reducido
│       ├── i18n/
│       │   ├── es.js
│       │   └── en.js
│       ├── engine/               # Puro, sin DOM, probado
│       │   ├── constants.js      # Umbrales del analizador, XP, rangos (la ayuda se genera de aquí)
│       │   ├── analyzer.js       # Reparto S/T/A/R, yo/nosotros, cifras, verbos, muletillas, sensibles
│       │   ├── score.js          # 0–100 con desglose
│       │   ├── arena.js          # Recruiters, convicción, repreguntas, informe del duelo
│       │   ├── progress.js       # XP, rachas, rangos, insignias
│       │   ├── sanitize.js       # safeParse + reconstrucción campo a campo
│       │   └── index.js
│       ├── content/
│       │   ├── competencias.js   # 12 genéricas + correspondencia con principios públicos
│       │   ├── recruiters.js     # Personajes, estilo, pesos, frases
│       │   ├── roles/
│       │   │   ├── red.js        # Preguntas, historias de ejemplo, glosario del rol
│       │   │   ├── blue.js
│       │   │   ├── grc.js
│       │   │   └── data.js
│       │   ├── comunes.js        # Preguntas comunes y trampa (con guía de respuesta)
│       │   └── lexico/
│       │       ├── es.js         # Verbos de acción, muletillas, vaguedades
│       │       └── en.js
│       └── ui/
│           ├── shell.js          # Rutas #hash, lateral, tema, acento, idioma, sonido, Ctrl K
│           ├── perfil.js         # Asistente inicial y perfil
│           ├── forja.js          # Editor STAR con puntuación en vivo
│           ├── constelacion.js   # SVG de la constelación + lista equivalente
│           ├── arena.js          # Duelo, cronómetro, barras, informe
│           ├── progreso.js
│           ├── insignias.js
│           ├── ayuda.js          # Centro de ayuda generado desde constants.js
│           └── sound.js          # Web Audio
├── dist/                         # Generado y versionado (la CI comprueba que está al día)
│   ├── index.html
│   ├── intro/
│   └── artifact/astrolabio.html
├── tests/
│   ├── engine.test.js            # node --test: analizador, puntuación, arena, progreso, saneado
│   ├── i18n.test.js              # Paridad de claves ES/EN
│   ├── content.test.js           # Sin duplicados, cada pregunta con competencia, sin < >
│   ├── e2e_app.py                # Playwright: flujos completos, móvil, CSP, cero red
│   ├── a11y_app.py               # axe-core en todos los estados
│   └── vendor/axe.min.js
├── docs/
│   ├── capturas.py               # Regenera las capturas del README
│   └── img/
└── .github/
    ├── workflows/tests.yml       # Acciones fijadas por SHA
    └── dependabot.yml
```

---

## 11. Fases

Una **PR por versión**: rama `version/X.Y.Z` desde `main`, con las pruebas y axe en verde antes de abrirla. **La fusiona Yoandy.**

### v0.1.0 · Cimientos: perfil y Forja
- [x] Repositorio creado, autoría configurada, `CLAUDE.md`, licencia, README esqueleto, CI con acciones por SHA.
- [x] `build.js` con un HTML autónomo, CSP por hashes, fuentes e iconos incrustados y artefacto sin `<head>`.
- [x] Shell completo: lateral, barra, `Ctrl K`, ES/EN, tema, 7 acentos (también en «Más» del móvil), ayuda con 6 pestañas y barra inferior en móvil.
- [x] Asistente de perfil de 3 pasos y píldora de perfil.
- [x] Forja: editor STAR con puntuación en vivo, sugerencias explicadas, etiqueta *Real* o *Ensayo* y aviso de datos sensibles.
- [x] Motor: `analyzer`, `score`, `sanitize` y `constants`.
- **Hecho cuando:** ≥ 40 pruebas de motor; e2e completo (crear, editar y borrar historia, puntuación, recargar, datos corruptos, móvil, CSP, cero red); axe con 0 infracciones; capturas reales en el README.

### v0.2.0 · Constelación y banco de preguntas
- [x] Constelación SVG accesible, con lista equivalente y animación de estrella nueva.
- [x] 12 competencias con la correspondencia de principios públicos.
- [x] Rutas Red, Blue, GRC y Data con **al menos 25 preguntas por ruta** (redacción propia) y **3 historias modelo** por ruta.
- [x] Búsqueda `Ctrl K` sobre historias, preguntas y glosario, insensible a acentos.
- **Hecho cuando:** pruebas de contenido (sin duplicados y cada pregunta con competencia) en verde, y la paridad ES/EN al 100 %.

### v0.3.0 · Arena
- [x] Cinco recruiters con su carácter, la barra de convicción, las repreguntas según lo que falte y el informe del duelo.
- [x] Modos escrito, en voz alta con autoevaluación, contrarreloj y sorpresa.
- [x] Recomendación de la historia que mejor encaja con cada pregunta.
- **Hecho cuando:** e2e de un duelo completo ganado y otro perdido; atajos de teclado en la Arena; axe en cada paso del duelo.

### v0.4.0 · Juego completo
- [x] XP, meta diaria, rachas, rangos, unas 30 insignias (4 secretas), sonidos y celebraciones.
- [x] Jefe final por ruta (el Subelistón) y carta de oferta en PDF marcada como juego.
- [x] Vista Progreso (XP por día y evolución de la puntuación media) y vista Insignias.
- **Hecho cuando:** las reglas de XP e insignias están probadas en el motor y la ayuda «Método» se genera desde las constantes.

### v0.5.0 · Inglés, exportación y ecosistema
- [x] Analizador en inglés completo y modo «entrevista en inglés» enlazado con LemonByte.
- [x] Exportar e importar JSON (`yrd-ecosistema`, tipo `historias`) y «chuleta» imprimible de las mejores historias.
- [x] «Acerca de» con el ecosistema completo y los enlaces comprobados.
- [ ] Intro de vídeo (si hay vídeo de la marca). *Pendiente: no hay vídeo de la marca todavía.*

### v1.0.0 · Lanzamiento
- [ ] Cifras del README verdaderas (pruebas, preguntas, insignias), capturas en claro, oscuro y móvil, y GIF del duelo.
- [ ] Revisión con usuarios reales: 3 juniors de rutas distintas y 1 recruiter de verdad.
- [ ] Publicación en LinkedIn (ver § 14).

### Después de la 1.0
- [x] v1.1: rutas Sistemas/Cloud, Desarrollo, AppSec e IA. *Adelantadas en la 0.6.0 para reservar la 1.0 al lanzamiento.*
- v1.2: IA opcional con la clave propia de la persona, desactivada por defecto y avisando de que el texto sale del dispositivo.
- v1.3: modo «coach» para profesores y mentores (exportar un paquete de preguntas para una clase).
- [x] v2.x (rutas): Soporte IT, PM, UX, preventa y Cambio de carrera. *Adelantadas en la 0.7.0.*
- [ ] v2.x: versiones para LATAM (vocabulario y tipos de empresa por país).

---

## 12. Pruebas (cómo se trabaja siempre)

```bash
node app/build.js                 # genera dist/
node --test tests/                # motor, contenido, i18n
python3 tests/e2e_app.py          # Playwright en Chromium
python3 tests/a11y_app.py         # axe-core, 0 infracciones
./run_tests.sh                    # todo lo anterior; falla si algo falla
```

Lecciones de LemonByte que no se pueden repetir:
- Encadenar con `set -o pipefail` o comprobar el código de salida antes del `git push`, porque `| tail` oculta los fallos.
- Antes de que axe mida, esperar solo a las animaciones finitas: las infinitas nunca terminan.
- La prueba del tema exige que todas las transiciones de color tengan la misma duración y arranquen a la vez.
- En el móvil, comprobar que **todo** lo del lateral (acentos incluidos) tiene acceso en «Más».
- Mirar las capturas con los propios ojos antes de dar algo por cerrado.

---

## 13. Reglas para cualquier asistente de código

1. **Autoría:** en cada clon, `git config user.name "Yoandy Ramírez Delgado"` y `git config user.email "yoandyramirezdelgado@gmail.com"`, y comprobarlo con `git log -1 --format='%an <%ae>'`. **Nunca** `Co-Authored-By` de una IA ni ninguna atribución a IA en commits, PR, código o documentación.
2. **Commits en español**, en imperativo, explicando el porqué. Una PR por versión, y la fusiona Yoandy.
3. **Solo iconos Lucide.** Sin emoji como icono, sin CDN, sin Google Fonts y sin analítica.
4. **Nada de anillos ni donuts**, que son la firma de Rosetta.
5. **Pruebas y axe en verde antes de cada push.** Si algo falla, se dice con la salida.
6. **Contenido propio.** Ni textos de Amazon ni de otras empresas (solo nombres públicos), ni material de cursos, ni contenido o recursos de **ORBIT Jr.** ni de terceros sin permiso.
7. **Tono:** español de España claro y directo, sin relleno, y cada término técnico explicado en el glosario.
8. **Cifras reales en el README**, nunca redondeadas hacia arriba.

---

## 14. Lanzamiento en LinkedIn

- **Gancho:** «Hice 94 máquinas en HTB y aun así me quedaba en blanco en las entrevistas. Por eso he creado Astrolabio: un juego gratuito para preparar entrevistas con el método STAR, por rol (Red, Blue, GRC, Data), que no saca tus datos del navegador».
- **Formato:** carrusel (Forja → Constelación → duelo con el Subelistón → carta de oferta) más un enlace a la demo. Mencionar **LATAM** y **banca** (el Panel de Banca).
- **Espaciar los lanzamientos** al menos 3 o 4 días respecto a otros. Después, un artículo práctico: «Cómo convertir tu primer CTF en una respuesta STAR que convence».
- Invitar a recruiters reales a «enfrentarse» a la herramienta y opinar: genera conversación.

---

## 15. Riesgos

| Riesgo | Mitigación |
|---|---|
| Parecer oficial de Amazon | Aviso de independencia, sin logos y solo nombres públicos de principios |
| Que se use para mentir en entrevistas | Las historias de ensayo llevan etiqueta y el mensaje «usa historias reales» |
| Fugas de datos de clientes en las historias | Detector de datos sensibles y todo en local |
| Que el analizador parezca arbitrario | Reglas explicables, constantes visibles en la ayuda y sugerencias con el porqué |
| Demasiado alcance | Cuatro rutas en la 1.0 y el resto después, sin hervir el océano |
| Nombre ocupado | Comprobar GitHub, dominios y tiendas antes de la v0.1 |

---

## 16. Primer día (para empezar ya)

1. Comprobar que el nombre está libre y crear `heindall92/astrolabio` (vacío, `main`).
2. Clonar el repositorio y configurar la autoría (regla 1).
3. Copiar de **LemonByte** como punto de partida: `app/build.js`, el patrón de `body.html` y `styles.css`, `tests/a11y_app.py`, `run_tests.sh`, el flujo de CI y `index.html` de la raíz. Renombrar las claves de `localStorage` a `astrolabio-*` y quitar el contenido de inglés.
4. Generar el logo con la indicación del § 0, convertirlo a WebP sin fondo y ponerlo en `app/vendor/astrolabio-mark.webp`.
5. Escribir `engine/constants.js` y `engine/analyzer.js`, con sus pruebas primero: una historia mala y otra buena de cada rol deben dar puntuaciones claramente distintas.
6. Montar el asistente de perfil y la Forja (v0.1.0) y abrir la primera PR `version/0.1.0`.

*Cada versión se revisa contra este documento antes de fusionarla: pruebas, axe y diseño pulido.*
