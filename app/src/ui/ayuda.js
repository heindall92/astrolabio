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
    h('ul', null, ECOSISTEMA.map(e => h('li', null, h('a', { href: e.url, target: '_blank', rel: 'noopener noreferrer', text: e.nombre }), ' · ', L(e.des)))),
    h('h3', { text: t('ayuda.acerca.soporte') }),
    h('p', null, t('ayuda.acerca.soporteTxt'), ' ', h('a', { href: 'https://github.com/heindall92/astrolabio/issues', target: '_blank', rel: 'noopener noreferrer', text: 'github.com/heindall92/astrolabio' }), '.'),
  ],
};

const ECOSISTEMA = [
  { nombre: 'LemonByte', url: 'https://github.com/heindall92', des: { es: 'Inglés técnico para IT: practica el vocabulario de la entrevista en inglés.', en: 'Technical English for IT: practise interview vocabulary in English.' } },
  { nombre: 'ARGOS', url: 'https://github.com/heindall92', des: { es: 'Laboratorio de GRC.', en: 'GRC lab.' } },
  { nombre: 'Rosetta', url: 'https://heindall92.github.io/rosetta_multinorma/', des: { es: 'Mapa multinorma de cumplimiento (ENS, ISO 27001, NIS2…).', en: 'Multi-framework compliance map (ENS, ISO 27001, NIS2…).' } },
  { nombre: 'CTEM-Nexus', url: 'https://github.com/heindall92', des: { es: 'Gestión continua de la exposición a amenazas.', en: 'Continuous threat exposure management.' } },
];

function allGlossary() {
  const out = [...GLOSARIO];
  if (typeof ROLE_CONTENT !== 'undefined') for (const r of ROLES) out.push(...(ROLE_CONTENT[r].glosario || []));
  return out.sort((a, b) => fold(L(a.termino)).localeCompare(fold(L(b.termino))));
}
