// Inicio: resumen del banco de historias y siguiente paso.

VIEWS.inicio = (view) => {
  const p = UI.state.perfil;
  const hs = UI.state.historias;
  const scores = hs.map(scoreOf);
  const listas = scores.filter(s => s.estado !== 'borrador').length;
  const brillantes = scores.filter(s => s.estado === 'brillante').length;
  const media = scores.length ? Math.round(scores.reduce((n, s) => n + s.total, 0) / scores.length) : 0;
  viewHead(view, {
    eyebrow: t('rol.' + p.rol) + ' · ' + t('nivel.' + p.nivel),
    title: p.nombre ? t('inicio.hola', { nombre: p.nombre }) : t('inicio.holaAnon'),
    lede: t('inicio.lede'),
    action: h('a', { class: 'btn primary', href: '#forja/nueva' }, icon('plus'), t('forja.nueva')),
  });
  if (UI.corrupt) {
    view.append(h('div', { class: 'callout crit', role: 'alert', id: 'corrupt-alert' }, icon('triangle-alert'), h('p', { text: t('inicio.corrupto') })));
  }
  const kpi = (n, label, ic) => h('div', { class: 'card kpi' }, h('div', { class: 'row' }, icon(ic), h('span', { text: label })), h('b', { text: fmtNum(n) }));
  view.append(stagger(h('div', { class: 'grid', id: 'kpis' },
    kpi(hs.length, t('inicio.kpi.historias'), 'star'),
    kpi(listas, t('inicio.kpi.listas'), 'check'),
    kpi(brillantes, t('inicio.kpi.brillantes'), 'sparkles'),
    kpi(media, t('inicio.kpi.media'), 'target'))));

  const next = !hs.length ? ['forja/nueva', 'inicio.next.primera', 'hammer']
    : listas < 3 ? ['forja', 'inicio.next.pulir', 'pencil']
      : ['arena', 'inicio.next.arena', 'swords'];
  const steps = ['perfil', 'forja', 'constelacion', 'arena', 'informe'];
  view.append(stagger(h('div', { class: 'grid two' },
    h('a', { class: 'card link', href: '#' + next[0] }, h('p', { class: 'eyebrow', text: t('inicio.siguiente') }), h('div', { class: 'row' }, icon(next[2], 'ic lg'), h('h2', { text: t(next[1]) })), h('p', { class: 'muted', text: t(next[1] + '.d') })),
    h('div', { class: 'card stack' }, h('p', { class: 'eyebrow', text: t('inicio.camino') }),
      h('ol', { class: 'stack small' }, steps.map(s => h('li', null, h('b', { text: t('camino.' + s) }), ' · ', h('span', { class: 'muted', text: t('camino.' + s + '.d') })))),
      h('p', { class: 'small', text: t('inicio.mensaje') })))));
  view.append(h('h2', { text: t('inicio.oferta') }), stagger(h('div', { class: 'grid', id: 'inicio-oferta' },
    [['vacante', 'scan-search'], ['presentacion', 'mic'], ['traductor', 'arrow-left-right']].map(([id, ic]) => h('a', { class: 'card link', href: '#' + id },
      h('div', { class: 'row' }, icon(ic, 'ic lg'), h('h3', { text: t('inicio.oferta.' + id) })), h('p', { class: 'small muted', text: t('inicio.oferta.' + id + '.d') }))))));
  if (hs.length) {
    const recent = hs.slice().sort((a, b) => (b.editada || '').localeCompare(a.editada || '')).slice(0, 3);
    view.append(h('h2', { text: t('inicio.recientes') }), stagger(h('div', { class: 'story-list' }, recent.map(storyCard))));
  }
};
