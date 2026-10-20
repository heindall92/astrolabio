// Búsqueda Ctrl K / ⌘K sobre historias, preguntas, competencias y glosario. Insensible a acentos.

function searchIndex() {
  const items = [];
  for (const s of UI.state.historias) items.push({ kind: 'historia', ic: 'star', label: s.titulo || t('forja.sinTitulo'), text: [s.titulo, s.s, s.t, s.a, s.r, s.l].join(' '), href: '#forja/' + s.id });
  for (const c of COMPETENCIAS) items.push({ kind: 'competencia', ic: c.icono, label: L({ es: c.es, en: c.en }), text: c.es + ' ' + c.en + ' ' + L(c.des), href: '#constelacion' });
  const qs = [...COMUNES];
  if (typeof ROLE_CONTENT !== 'undefined') for (const r of ROLES) qs.push(...ROLE_CONTENT[r].preguntas);
  for (const q of qs) items.push({ kind: 'pregunta', ic: 'message-square-quote', label: L(q), text: q.es + ' ' + q.en, href: '#arena/pregunta/' + q.id });
  for (const g of allGlossary()) items.push({ kind: 'glosario', ic: 'book-open', label: L(g.termino), text: L(g.termino) + ' ' + L(g.def), help: 'glosario' });
  return items;
}

function searchQuery(q, items) {
  const terms = fold(q).split(/\s+/).filter(Boolean);
  if (!terms.length) return [];
  const scored = [];
  for (const it of items) {
    const lab = fold(it.label), txt = fold(it.text);
    if (!terms.every(w => txt.includes(w) || lab.includes(w))) continue;
    const s = terms.reduce((n, w) => n + (lab.startsWith(w) ? 3 : lab.includes(w) ? 2 : 1), 0);
    scored.push([s, it]);
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, 30).map(x => x[1]);
}

function openSearch(opener) {
  const dlg = $('#dlg-search');
  if (dlg.open) return;
  const items = searchIndex();
  const input = h('input', { type: 'search', id: 'search-input', role: 'combobox', 'aria-expanded': 'true', 'aria-controls': 'search-results', 'aria-autocomplete': 'list', 'aria-label': t('ui.buscarLargo'), placeholder: t('buscar.ph'), autocomplete: 'off' });
  const list = h('ul', { class: 'results', id: 'search-results', role: 'listbox', 'aria-label': t('buscar.resultados') });
  const status = h('p', { class: 'sr-only', 'aria-live': 'polite' });
  let results = [], sel = 0;
  const choose = it => {
    closeDialog(dlg);
    if (it.help) openHelp(it.help);
    else go(it.href.slice(1));
  };
  const draw = () => {
    results = searchQuery(input.value, items);
    sel = Math.min(sel, Math.max(0, results.length - 1));
    list.replaceChildren(...(results.length ? results.map((it, i) => h('li', { role: 'none' }, h('a', { role: 'option', id: 'sr-' + i, href: it.href || '#', 'aria-selected': String(i === sel), onclick: e => { e.preventDefault(); choose(it); } }, icon(it.ic, 'ic sm'), h('span', { text: it.label }), h('span', { class: 'k', text: t('buscar.k.' + it.kind) }))))
      : [h('li', { class: 'small muted', role: 'none' }, h('p', { class: 'muted', text: input.value.trim() ? t('buscar.nada') : t('buscar.pista') }))]));
    if (results.length) input.setAttribute('aria-activedescendant', 'sr-' + sel); else input.removeAttribute('aria-activedescendant');
    status.textContent = input.value.trim() ? t('buscar.n', { n: results.length }) : '';
  };
  input.addEventListener('input', () => { sel = 0; draw(); });
  input.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(results.length - 1, sel + 1); draw(); $('#sr-' + sel)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); $('#sr-' + sel)?.scrollIntoView({ block: 'nearest' }); }
    else if (e.key === 'Enter' && results[sel]) { e.preventDefault(); choose(results[sel]); }
    else if (e.key === 'Escape') { e.preventDefault(); closeDialog(dlg); }
  });
  dlg.replaceChildren(h('div', { class: 'dlg' }, h('div', { class: 'search-in' }, icon('search'), input, h('kbd', { text: 'Esc' })), list, status));
  draw();
  openDialog(dlg, opener);
  input.focus();
}
