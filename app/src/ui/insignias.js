// Vista Insignias: las conseguidas en oro; las secretas no se revelan hasta conseguirlas.

VIEWS.insignias = view => {
  const have = new Set(UI.state.insignias);
  const got = INSIGNIAS.filter(b => have.has(b.id)).length;
  viewHead(view, { eyebrow: t('nav.insignias'), title: t('insignias.titulo'), lede: t('insignias.lede', { n: got, total: INSIGNIAS.length, s: INSIGNIAS.filter(b => b.secreta).length }) });
  const i = h('i');
  i.style.width = Math.round((got / INSIGNIAS.length) * 100) + '%';
  view.append(h('div', { class: 'bar gold', id: 'ins-bar' }, i));
  view.append(stagger(h('ul', { class: 'badges', id: 'badges' }, INSIGNIAS.map(b => {
    const ok = have.has(b.id);
    const oculta = b.secreta && !ok;
    return h('li', { class: 'badge' + (ok ? ' got' : '') + (oculta ? ' secret' : ''), id: 'ins-' + b.id },
      h('span', { class: 'b-ic', 'aria-hidden': 'true' }, icon(oculta ? 'lock' : b.icono, 'ic lg')),
      h('b', { text: oculta ? t('insignias.secreta') : L(b.nombre) }),
      h('span', { class: 'small muted', text: oculta ? t('insignias.secretaD') : L(b.desc) }),
      h('span', { class: 'chip' + (ok ? ' gold' : ''), text: ok ? t('insignias.conseguida') : t('insignias.pendiente') }));
  }))));
};
