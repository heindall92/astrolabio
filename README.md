<p align="center">
  <img src="docs/img/logo.svg" width="128" height="128" alt="Logo de Astrolabio: una estrella de cuatro puntas dentro de un bocadillo de diálogo"/>
</p>

<h1 align="center">Astrolabio</h1>

<p align="center">
  <b>Cuenta tu historia. Gana la entrevista.</b><br/>
  <i>Tell your story. Win the interview.</i>
</p>

<p align="center">
  Laboratorio-juego, gratuito y de código abierto, para preparar entrevistas laborales con el <b>método STAR</b> (Situación, Tarea, Acción, Resultado).
  Funciona en el navegador, sin cuentas y sin servidor: <b>las historias nunca salen del dispositivo</b>.
</p>

<p align="center">
  <a href="LICENSE"><img alt="Licencia GPLv2" src="https://img.shields.io/badge/LICENCIA-GPLv2-4169A1?style=flat"/></a>
  <img alt="Versión 0.4.1" src="https://img.shields.io/badge/versi%C3%B3n-0.4.1-1a4fe0?style=flat"/>
  <img alt="axe-core: 0 infracciones" src="https://img.shields.io/badge/axe--core-0%20infracciones-2E8B57?style=flat"/>
  <img alt="Interfaz ES/EN" src="https://img.shields.io/badge/UI-ES%20%2F%20EN-2E8B57?style=flat"/>
  <img alt="Iconos Lucide" src="https://img.shields.io/badge/iconos-Lucide-F56565?style=flat"/>
  <img alt="Cero red" src="https://img.shields.io/badge/red-cero%20peticiones-0B1024?style=flat"/>
</p>

<p align="center">
  <img src="docs/img/forja-dark.png" alt="La Forja en tema oscuro: banco de historias STAR con su estado y su puntuación" width="880"/>
</p>

> **Estado:** versión 0.4.1 en desarrollo, con la demo ya publicada: **[abrir Astrolabio](https://heindall92.github.io/astrolabio/)**. Funciona en el navegador y tus historias no salen de él.

## Índice

- [Cómo se usa](#cómo-se-usa)
- [Mapa mental](#mapa-mental)
- [Capturas](#capturas)
- [El analizador STAR](#el-analizador-star)
- [Arranque rápido](#arranque-rápido)
- [Arquitectura](#arquitectura)
- [Calidad](#calidad)
- [Seguridad y privacidad](#seguridad-y-privacidad)
- [Historial de versiones](#historial-de-versiones)
- [Contribuidores](#contribuidores)
- [Licencia y aviso de independencia](#licencia-y-aviso-de-independencia)

## Cómo se usa

1. **Perfil.** Un asistente de tres pasos: rol (Red Team, Blue Team, GRC o Data), nivel (sin experiencia, junior, mid o senior) y tipo de empresa e idioma de la entrevista.
2. **Forja.** Escribe una vivencia real en cuatro bloques (y un quinto opcional, lo aprendido). El analizador la puntúa de 0 a 100 mientras escribes y explica cada corrección.
3. **Constelación.** Cada historia es una estrella y cada competencia, una constelación: se ve al momento qué te falta.
4. **Arena.** Duelos contra recruiters con carácter que repreguntan según lo que falte en tu respuesta.
5. **Informe.** Qué funcionó, qué faltó, la frase que conviene reescribir y la historia que mejor encaja.

> «No estás solo. Tu experiencia vale aunque venga de unas prácticas, un CTF, un máster, un voluntariado o un trabajo de hostelería. Aquí aprendes a contarla».

## Mapa mental

```mermaid
mindmap
  root((Astrolabio))
    Perfil
      Rol
      Nivel
      Empresa
      Idioma
    Forja
      Editor STAR-L
      Puntuación en vivo
      Datos sensibles
      Real o ensayo
    Constelación
      12 competencias
      Lista equivalente
    Arena
      5 recruiters
      Convicción
      Repreguntas
      Informe del duelo
    Juego
      XP y rachas
      Rangos
      Insignias
```

```mermaid
flowchart LR
  P[Perfil] --> F[Forja]
  F --> C[Constelación]
  C --> A[Arena]
  A --> I[Informe]
  I -->|reescribe| F
  I --> X[XP, rangos e insignias]
```

## Capturas

| | Claro | Oscuro | Móvil |
|---|---|---|---|
| **Asistente** | <img src="docs/img/asistente-light.png" width="300" alt="Asistente de perfil, tema claro"/> | <img src="docs/img/asistente-dark.png" width="300" alt="Asistente de perfil, tema oscuro"/> | |
| **Inicio** | <img src="docs/img/inicio-light.png" width="300" alt="Inicio, tema claro"/> | <img src="docs/img/inicio-dark.png" width="300" alt="Inicio, tema oscuro"/> | <img src="docs/img/inicio-movil.png" width="140" alt="Inicio en móvil"/> |
| **Forja** | <img src="docs/img/forja-light.png" width="300" alt="Forja, tema claro"/> | <img src="docs/img/forja-dark.png" width="300" alt="Forja, tema oscuro"/> | <img src="docs/img/forja-movil.png" width="140" alt="Forja en móvil"/> |
| **Editor STAR** | <img src="docs/img/editor-light.png" width="300" alt="Editor con puntuación en vivo, tema claro"/> | <img src="docs/img/editor-dark.png" width="300" alt="Editor con puntuación en vivo, tema oscuro"/> | <img src="docs/img/editor-movil.png" width="140" alt="Editor en móvil"/> |
| **Constelación** | <img src="docs/img/constelacion-light.png" width="300" alt="Constelación, tema claro"/> | <img src="docs/img/constelacion-dark.png" width="300" alt="Constelación, tema oscuro"/> | <img src="docs/img/constelacion-movil.png" width="140" alt="Constelación en móvil"/> |
| **Arena** | <img src="docs/img/arena-light.png" width="300" alt="Arena, tema claro"/> | <img src="docs/img/arena-dark.png" width="300" alt="Arena, tema oscuro"/> | <img src="docs/img/arena-movil.png" width="140" alt="Arena en móvil"/> |
| **Progreso** | <img src="docs/img/progreso-light.png" width="300" alt="Progreso, tema claro"/> | <img src="docs/img/progreso-dark.png" width="300" alt="Progreso, tema oscuro"/> | <img src="docs/img/progreso-movil.png" width="140" alt="Progreso en móvil"/> |
| **Insignias** | <img src="docs/img/insignias-light.png" width="300" alt="Insignias, tema claro"/> | <img src="docs/img/insignias-dark.png" width="300" alt="Insignias, tema oscuro"/> | <img src="docs/img/insignias-movil.png" width="140" alt="Insignias en móvil"/> |
| **Perfil** | <img src="docs/img/perfil-light.png" width="300" alt="Perfil, tema claro"/> | <img src="docs/img/perfil-dark.png" width="300" alt="Perfil, tema oscuro"/> | <img src="docs/img/perfil-movil.png" width="140" alt="Perfil en móvil"/> |
| **Ayuda · Método** | <img src="docs/img/ayuda-light.png" width="300" alt="Centro de ayuda, pestaña Método STAR, tema claro"/> | <img src="docs/img/ayuda-dark.png" width="300" alt="Centro de ayuda, tema oscuro"/> | <img src="docs/img/ayuda-movil.png" width="140" alt="Centro de ayuda en móvil"/> |

Las capturas se regeneran con `python3 docs/capturas.py`.

## El analizador STAR

Local, determinista, sin IA y con reglas explicables. Todas las cifras viven en [`app/src/engine/constants.js`](app/src/engine/constants.js) y la pestaña **Método STAR** de la ayuda se genera a partir de ellas.

| Criterio | Puntos | Regla |
|---|---|---|
| Reparto S/T/A/R | 25 | S 15–20 %, T 10–15 %, **A 50–60 %**, R 15–20 % de las palabras (margen de 7 puntos) |
| Duración | 10 | 150–350 palabras ≈ 1–2,5 min a 140 palabras por minuto |
| «Yo» en la acción | 20 | ≥ 60 % de verbos en primera persona del singular |
| Resultado medible | 20 | Una cifra, un porcentaje, un tiempo o un antes y después |
| Verbos de acción | 10 | ≥ 3 verbos de acción distintos y pocos arranques débiles («estuve», «había») |
| Sin muletillas | 10 | Se tolera una; después resta |
| Aprendizaje | 5 | Cierre con lo aprendido (STAR-L) |

**Datos sensibles:** IP, correos, dominios internos, CVE y nombres que marques como confidenciales restan 10 puntos cada uno (hasta 20) y dejan la historia en *Borrador*. Los umbrales de *Lista* y *Brillante* suben con el nivel del perfil.

```mermaid
flowchart TD
  H[Historia S·T·A·R·L] --> R[Reparto] & D[Duración] & Y[Yo / nosotros] & C[Cifra] & V[Verbos] & M[Muletillas] & L[Aprendizaje]
  H --> S{¿Datos sensibles?}
  R & D & Y & C & V & M & L --> P[Puntuación 0–100]
  S -->|sí| B[Borrador y aviso]
  P --> E{Umbral del nivel}
  E --> E1[Borrador] & E2[Lista] & E3[Brillante]
```

## Arranque rápido

```bash
git clone https://github.com/heindall92/astrolabio.git && cd astrolabio
npm ci                                   # lucide-static y Fontsource (solo para el build)
node app/build.js                        # genera dist/index.html
open dist/index.html                     # o xdg-open: funciona con file:// y sin conexión
```

## Arquitectura

JavaScript sin framework. `app/build.js` concatena los módulos, incrusta fuentes e iconos, calcula la CSP por hashes y escribe **un único HTML autónomo** (`dist/index.html`) más una versión sin `<head>` para incrustar (`dist/artifact/astrolabio.html`).

```mermaid
flowchart LR
  subgraph src[app/src]
    I18N[i18n es/en] --> UI
    CONT[content: competencias, recruiters, preguntas, léxico] --> ENG
    ENG[engine: analyzer, score, sanitize…<br/>puro y sin DOM] --> UI[ui: shell, perfil, forja, ayuda…]
  end
  V[vendor: Geist, Sora, 97 iconos Lucide, logo] --> B
  src --> B[app/build.js]
  B --> D[dist/index.html<br/>CSP por hashes]
  B --> A[dist/artifact/astrolabio.html]
  D --> LS[(localStorage<br/>astrolabio-estado)]
```

## Calidad

| Prueba | Cifra |
|---|---|
| Motor, contenido e i18n (`node --test`) | 115 pruebas |
| Extremo a extremo (Playwright) | 17 flujos |
| Accesibilidad (axe-core, WCAG 2.2 AA) | 4 barridos (claro y oscuro, 1280 y 390 px), 0 infracciones |

```bash
./run_tests.sh   # build + dist al día + motor + e2e + axe; falla si algo falla
```

## Seguridad y privacidad

- Sin servidor, sin cuentas, sin analítica. CSP con `connect-src 'none'`: la app no puede hacer peticiones.
- Todo el texto del usuario entra al DOM como texto, nunca como HTML.
- El JSON importado pasa por `safeParse` y se reconstruye campo a campo con límites.
- Detalle en [SECURITY.md](SECURITY.md).

## Historial de versiones

- **0.4.1** · Móvil estrecho: barra superior que cabe con cifras grandes, idioma en «Más» y rejillas sin desbordes
- **0.4.0** · Juego completo: XP, meta diaria, rachas, seis rangos, 34 insignias (4 secretas), jefe final por ruta y carta de oferta
- **0.3.0** · Arena: cinco recruiters, convicción, repreguntas, informe y modos escrito, voz alta, contrarreloj y sorpresa
- **0.2.0** · Constelación de competencias, banco de 104 preguntas, historias modelo y búsqueda
- **0.1.0** · Cimientos: perfil, Forja, motor STAR, shell completo y ayuda

Detalle en [CHANGELOG.md](CHANGELOG.md) y plan completo en [ROADMAP.md](ROADMAP.md).

## Contribuidores

| | |
|---|---|
| <img src="https://github.com/heindall92.png" width="64" height="64" alt="Avatar de heindall92"/> | **Yoandy Ramírez Delgado** ([@heindall92](https://github.com/heindall92)) · autor y mantenedor |

¿Quieres ayudar? Lee [CONTRIBUTING.md](CONTRIBUTING.md).

## Licencia y aviso de independencia

[GPLv2](LICENSE). Fuentes Geist, Geist Mono y Sora bajo licencia OFL (vía Fontsource); iconos [Lucide](https://lucide.dev) bajo licencia ISC.

> Astrolabio no está afiliado ni respaldado por Amazon ni por ninguna empresa citada. Los nombres de principios y competencias se usan solo como referencia.
