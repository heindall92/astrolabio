// Centro de ayuda con seis pestañas. «Método STAR» se genera desde engine/constants.js.

const HELP_TABS = [
  { id: 'guia', ic: 'book-open' },
  { id: 'metodo', ic: 'star' },
  { id: 'recruiters', ic: 'swords' },
  { id: 'atajos', ic: 'keyboard' },
  { id: 'glosario', ic: 'languages' },
  { id: 'acerca', ic: 'info' },
];
let helpTab = 'guia';

function openHelp(tab, opener) {
  if (tab) helpTab = tab;
  const dlg = $('#dlg-help');
  dlg.replaceChildren(h('div', { class: 'dlg' }, dlgHead('help-h', t('ayuda.titulo'), dlg, 'circle-question-mark'), h('div', { class: 'tabs', role: 'tablist', 'aria-label': t('ayuda.titulo') }), h('div', { class: 'dlg-b', role: 'tabpanel', id: 'help-panel', tabindex: '0' })));
  drawHelp(false);
  openDialog(dlg, opener);
}

function drawHelp(focusTab = true) {
  const dlg = $('#dlg-help');
  const tabs = $('.tabs', dlg);
  tabs.replaceChildren(...HELP_TABS.map((tb, i) => h('button', { class: 'tab', role: 'tab', type: 'button', id: 'tab-' + tb.id, 'aria-selected': String(tb.id === helpTab), 'aria-controls': 'help-panel', tabindex: tb.id === helpTab ? '0' : '-1',
    onclick: () => { helpTab = tb.id; drawHelp(); },
    onkeydown: e => {
      let n = null;
      if (e.key === 'ArrowRight') n = (i + 1) % HELP_TABS.length;
      if (e.key === 'ArrowLeft') n = (i + HELP_TABS.length - 1) % HELP_TABS.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = HELP_TABS.length - 1;
      if (n !== null) { e.preventDefault(); helpTab = HELP_TABS[n].id; drawHelp(); }
    } }, icon(tb.ic, 'ic sm'), t('ayuda.tab.' + tb.id))));
  const panel = $('#help-panel', dlg);
  panel.setAttribute('aria-labelledby', 'tab-' + helpTab);
  panel.replaceChildren(h('div', { class: 'prose' }, ...HELP_BUILD[helpTab]()));
  if (focusTab) $('#tab-' + helpTab, dlg).focus();
}

const HELP_BUILD = {
  guia: () => [
    h('p', { text: t('ayuda.guia.intro') }),
    h('ol', null, ['perfil', 'forja', 'constelacion', 'arena', 'informe'].map(s => h('li', null, h('b', { text: t('camino.' + s) }), ': ', t('camino.' + s + '.d')))),
    h('h3', { text: t('ayuda.guia.realTitulo') }),
    h('p', { text: t('ayuda.guia.real') }),
    h('div', { class: 'callout warn' }, icon('triangle-alert'), h('p', { text: t('forja.ensayoAviso') })),
  ],
  metodo: () => {
    const rows = BLOQUES.map(b => h('tr', null, h('th', { scope: 'row', text: b.toUpperCase() + ' · ' + t('bloque.' + b) }), h('td', { class: 'num', text: `${REPARTO[b].min}–${REPARTO[b].max} %` }), h('td', { text: t('forja.hint.' + b) })));
    const pesos = Object.entries(PESOS).map(([k, v]) => h('tr', null, h('th', { scope: 'row', text: t('crit.' + k) }), h('td', { class: 'num', text: String(v) }), h('td', { text: t('crit.' + k + '.d', { min: DURACION.minPalabras, max: DURACION.maxPalabras, ppm: DURACION.palabrasPorMinuto, yo: YO_MINIMO, verbos: VERBOS_MINIMOS, mul: MULETILLAS_TOLERADAS }) })));
    const niveles = NIVELES.map(n => h('tr', null, h('th', { scope: 'row', text: t('nivel.' + n) }), h('td', { class: 'num', text: String(UMBRALES[n].lista) }), h('td', { class: 'num', text: String(UMBRALES[n].brillante) })));
    return [
      h('p', { text: t('ayuda.metodo.intro') }),
      h('h3', { text: t('ayuda.metodo.reparto') }),
      h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('ayuda.metodo.bloque') }), h('th', { scope: 'col', text: t('ayuda.metodo.palabras') }), h('th', { scope: 'col', text: t('ayuda.metodo.que') }))), h('tbody', null, rows)),
      h('p', { class: 'small muted', text: t('ayuda.metodo.tolerancia', { n: REPARTO_TOLERANCIA }) }),
      h('h3', { text: t('ayuda.metodo.criterios') }),
      h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('ayuda.metodo.criterio') }), h('th', { scope: 'col', text: t('ayuda.metodo.puntos') }), h('th', { scope: 'col', text: t('ayuda.metodo.regla') }))), h('tbody', null, pesos)),
      h('p', { text: t('ayuda.metodo.sensibles', { p: SENSIBLE.penalizacion, tope: SENSIBLE.tope }) }),
      h('h3', { text: t('ayuda.metodo.estados') }),
      h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('perfil.nivel') }), h('th', { scope: 'col', text: t('estado.lista') }), h('th', { scope: 'col', text: t('estado.brillante') }))), h('tbody', null, niveles)),
      h('p', { class: 'small muted', text: t('ayuda.metodo.senior') }),
      ...(typeof helpGameRules === 'function' ? helpGameRules() : []),
    ];
  },
  recruiters: () => [
    h('p', { text: t('ayuda.recruiters.intro') }),
    h('div', { class: 'callout', id: 'ayuda-duelo' }, icon('swords'), h('p', null, h('b', { text: t('ayuda.arena.titulo') + '. ' }), t('ayuda.arena.reglas', { ini: DUELO.conviccionInicial, max: DUELO.maxDelta, derrota: DUELO.derrotaInmediata, meta: DUELO.victoria, pen: DUELO.penalizacionTiempo }))),
    ...RECRUITERS.map(r => h('div', { class: 'card stack' }, h('div', { class: 'row' }, icon(r.icono), h('h3', { text: L(r.nombre) }), h('span', { class: 'chip' + (r.jefe ? ' gold' : ''), text: t('dificultad.' + r.dificultad) })), h('p', { class: 'muted', text: L(r.estilo) }))),
  ],
  atajos: () => {
    const rows = [['Ctrl K / ⌘K', 'atajo.buscar'], ['?', 'atajo.ayuda'], ['N', 'atajo.nueva'], ['1 – 6', 'atajo.secciones'], ['Esc', 'atajo.cerrar'], ...(typeof ARENA_SHORTCUTS !== 'undefined' ? ARENA_SHORTCUTS : [])];
    return [h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('ayuda.atajos.tecla') }), h('th', { scope: 'col', text: t('ayuda.atajos.accion') }))),
      h('tbody', null, rows.map(([k, key]) => h('tr', null, h('td', null, h('kbd', { text: k })), h('td', { text: t(key) })))))];
  },
  glosario: () => {
    const items = allGlossary();
    return [h('p', { text: t('ayuda.glosario.intro') }), h('dl', { class: 'gloss' }, items.map(g => [h('dt', { text: L(g.termino) }), h('dd', { text: L(g.def) })]))];
  },
  acerca: () => [
    h('div', { class: 'row' }, markSvg('hero-mark'), h('div', null, h('h3', { text: 'Astrolabio ' + APP_VERSION }), h('p', { class: 'muted', text: t('lema') }))),
    h('p', { text: t('ayuda.acerca.que') }),
    h('p', null, t('ayuda.acerca.autor'), ' ', h('b', { text: 'Yoandy Ramírez Delgado' }), ' (heindall92). ', t('ayuda.acerca.licencia')),
    h('div', { class: 'callout' }, icon('info'), h('p', { text: t('aviso.independencia') })),
    h('h3', { text: t('ayuda.acerca.ecosistema') }),
    h('ul', { id: 'ecosistema' }, ECOSISTEMA.map(e => h('li', null,
      e.url ? h('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer', text: e.nombre }) : h('b', { text: e.nombre }),
      ' · ', L(e.des), ' ',
      e.url ? null : h('span', { class: 'chip', text: t('ayuda.acerca.pendiente') }),
      e.repo ? [' ', h('a', { class: 'small', href: e.repo, target: '_blank', rel: 'noopener noreferrer', 'aria-label': t('ayuda.acerca.repoDe', { n: e.nombre }), text: t('ayuda.acerca.repo') })] : null))),
    h('h3', { text: t('ayuda.acerca.soporte') }),
    h('p', null, t('ayuda.acerca.soporteTxt'), ' ', h('a', { href: 'https://github.com/heindall92/astrolabio/issues', target: '_blank', rel: 'noopener noreferrer', text: 'github.com/heindall92/astrolabio' }), '.'),
  ],
};

// Enlaces comprobados a mano el 2026-10-21 (responden y el título coincide). url: null = pendiente de confirmar.
const ECOSISTEMA = [
  { nombre: 'LemonByte', url: 'https://heindall92.github.io/lemonbyte/', repo: 'https://github.com/heindall92/lemonbyte', des: { es: 'Inglés técnico para ciberseguridad: practica la entrevista en inglés.', en: 'Technical English for cybersecurity: practise the interview in English.' } },
  { nombre: 'ARGOS', url: 'https://heindall92.github.io/argos-grc/', repo: 'https://github.com/heindall92/argos-grc', des: { es: 'Laboratorio GRC con rutas, simulacros, rangos y logros.', en: 'GRC lab with paths, drills, ranks and achievements.' } },
  { nombre: 'Rosetta Multinorma', url: 'https://heindall92.github.io/rosetta_multinorma/', repo: 'https://github.com/heindall92/rosetta_multinorma', des: { es: 'Normas y leyes sobre un catálogo de controles unificado.', en: 'Standards and laws on a unified control catalogue.' } },
  { nombre: 'CTEM-Nexus', url: 'https://heindall92.github.io/ctem-nexus/', repo: 'https://github.com/heindall92/ctem-nexus', des: { es: 'Gestión continua de la exposición a amenazas.', en: 'Continuous threat exposure management.' } },
  { nombre: 'ENS Compliance Studio', url: 'https://heindall92.github.io/grc_ens_compliance_studio/', repo: 'https://github.com/heindall92/grc_ens_compliance_studio', des: { es: 'Categorización, MAGERIT y declaración de aplicabilidad.', en: 'Categorisation, MAGERIT and statement of applicability.' } },
  { nombre: 'KAIROS', url: 'https://heindall92.github.io/kairos/', repo: 'https://github.com/heindall92/kairos', des: { es: 'Continuidad de negocio: BIA, BCP y DRP.', en: 'Business continuity: BIA, BCP and DRP.' } },
  { nombre: 'ENS AD Auditor', url: 'https://heindall92.github.io/ens_ad-auditor/', repo: 'https://github.com/heindall92/ens_ad-auditor', des: { es: 'Directorio activo frente a las medidas del ENS.', en: 'Active Directory against the ENS measures.' } },
  { nombre: 'Norvik', url: null, repo: 'https://github.com/heindall92/Norvik_Gobernanza', des: { es: 'Gobernanza: roles, políticas y el marco que une al resto.', en: 'Governance: roles, policies and the framework that ties the rest together.' } },
];

function allGlossary() {
  const out = [...GLOSARIO];
  if (typeof ROLE_CONTENT !== 'undefined') for (const r of ROLES) out.push(...(ROLE_CONTENT[r].glosario || []));
  return out.sort((a, b) => fold(L(a.termino)).localeCompare(fold(L(b.termino))));
}
