// Constelación: cada competencia es una constelación en una posición fija; cada historia, una estrella.
// Se acompaña siempre de una tabla equivalente.

const STAR_SLOTS = [[0.5, 0.42], [0.24, 0.58], [0.74, 0.62], [0.38, 0.8], [0.64, 0.86], [0.16, 0.86], [0.86, 0.4], [0.3, 0.36]];
const STAR_SIZE = { borrador: 7, lista: 10, brillante: 14 };

function sparklePath(cx, cy, r) {
  const k = r * 0.28;
  return `M${cx} ${cy - r}C${cx + k * 0.4} ${cy - k} ${cx + k} ${cy - k * 0.4} ${cx + r} ${cy}C${cx + k} ${cy + k * 0.4} ${cx + k * 0.4} ${cy + k} ${cx} ${cy + r}C${cx - k * 0.4} ${cy + k} ${cx - k} ${cy + k * 0.4} ${cx - r} ${cy}C${cx - k} ${cy - k * 0.4} ${cx - k * 0.4} ${cy - k} ${cx} ${cy - r}Z`;
}
function svgEl(tag, attrs, ...kids) {
  const el = document.createElementNS(SVGNS, tag);
  for (const [k, v] of Object.entries(attrs || {})) if (v !== null && v !== undefined) el.setAttribute(k, String(v));
  for (const c of kids.flat()) if (c) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

function coverage() {
  const hs = UI.state.historias.map(s => ({ s, sc: scoreOf(s) }));
  return COMPETENCIAS.map(c => {
    const list = hs.filter(x => x.s.competencias.includes(c.id)).sort((a, b) => b.sc.total - a.sc.total);
    return { c, list, best: list.length ? list[0].sc.total : null };
  });
}

VIEWS.constelacion = (view) => {
  const cov = coverage();
  const covered = cov.filter(x => x.list.length).length;
  const missing = cov.filter(x => !x.list.length);
  viewHead(view, { eyebrow: t('nav.constelacion'), title: t('const.titulo'), lede: t('const.lede', { n: covered, total: COMPETENCIAS.length }),
    action: h('a', { class: 'btn primary', href: '#forja/nueva' }, icon('plus'), t('forja.nueva')) });

  const mobile = matchMedia('(max-width: 767px)').matches;
  const cols = mobile ? 2 : 4, rows = Math.ceil(COMPETENCIAS.length / cols);
  const ZW = 300, ZH = mobile ? 250 : 230;
  const W = cols * ZW, H = rows * ZH;
  const summary = missing.length
    ? t('const.aria', { n: covered, total: COMPETENCIAS.length, faltan: missing.map(m => compName(m.c.id)).join(', ') })
    : t('const.ariaCompleta', { total: COMPETENCIAS.length });
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, class: 'sky', role: 'group', 'aria-label': summary });
  const tip = h('div', { class: 'star-tip', role: 'tooltip', id: 'star-tip', hidden: true });
  const stars = [];
  const fresh = UI.lastSaved;
  UI.lastSaved = null;

  cov.forEach((zone, i) => {
    const x0 = (i % cols) * ZW, y0 = Math.floor(i / cols) * ZH;
    const g = svgEl('g', { class: 'zone' + (zone.list.length ? '' : ' empty') });
    g.append(svgEl('text', { x: x0 + 20, y: y0 + 34, class: 'zone-label' }, compName(zone.c.id)));
    g.append(svgEl('text', { x: x0 + 20, y: y0 + 54, class: 'zone-meta' }, zone.list.length ? t('const.zoneMeta', { n: zone.list.length, best: zone.best }) : t('const.vacia')));
    const pts = STAR_SLOTS.map(([fx, fy]) => [x0 + 20 + fx * (ZW - 40), y0 + 40 + fy * (ZH - 70)]);
    if (!zone.list.length) {
      const d = pts.slice(0, 4).map((p, k) => (k ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('');
      g.append(svgEl('path', { d, class: 'ghost-line' }));
      pts.slice(0, 4).forEach(p => g.append(svgEl('path', { d: sparklePath(p[0], p[1], 6), class: 'ghost-star' })));
    } else {
      const used = zone.list.slice(0, STAR_SLOTS.length);
      if (used.length > 1) {
        const d = used.map((_, k) => (k ? 'L' : 'M') + pts[k][0].toFixed(1) + ' ' + pts[k][1].toFixed(1)).join('');
        const line = svgEl('path', { d, class: 'const-line' + (used.some(u => u.s.id === fresh) ? ' draw' : '') });
        g.append(line);
      }
      used.forEach((u, k) => {
        const [cx, cy] = pts[k];
        const r = STAR_SIZE[u.sc.estado];
        const label = t('const.estrella', { titulo: u.s.titulo || t('forja.sinTitulo'), nota: u.sc.total, estado: t('estado.' + u.sc.estado), comp: compName(zone.c.id) });
        const a = svgEl('a', { href: '#forja/' + u.s.id, class: 'star st-' + u.sc.estado + (u.s.id === fresh ? ' nueva' : ''), 'aria-label': label, tabindex: '-1', 'aria-describedby': 'star-tip' },
          svgEl('rect', { x: cx - 16, y: cy - 16, width: 32, height: 32, class: 'hit', rx: 8 }),
          u.sc.estado === 'brillante' ? svgEl('path', { d: sparklePath(cx, cy, r * 1.9), class: 'glow' }) : null,
          svgEl('path', { d: sparklePath(cx, cy, r), class: 'core' }));
        a.dataset.id = u.s.id;
        a.dataset.x = cx / W;
        a.dataset.y = cy / H;
        a._info = { titulo: u.s.titulo || t('forja.sinTitulo'), nota: u.sc.total, estado: u.sc.estado, comps: u.s.competencias };
        g.append(a);
        stars.push(a);
      });
    }
    svg.append(g);
  });
  if (stars.length) stars[0].setAttribute('tabindex', '0');

  const stage = h('div', { class: 'sky-wrap' + (mobile ? ' tall' : '') }, svg, tip);
  const showTip = a => {
    const inf = a._info;
    tip.replaceChildren(h('b', { text: inf.titulo }), h('span', { class: 'row' }, stateChip(inf.estado), h('span', { class: 'score', text: inf.nota + '/100' })), h('span', { class: 'tiny', text: inf.comps.map(compName).join(' · ') }));
    tip.hidden = false;
    const fx = Number(a.dataset.x), fy = Number(a.dataset.y);
    tip.style.left = Math.min(78, Math.max(2, fx * 100 - 10)) + '%';
    tip.style.top = (fy * 100 + 4) + '%';
  };
  const hideTip = () => { tip.hidden = true; };
  stars.forEach((a, i) => {
    a.addEventListener('mouseenter', () => showTip(a));
    a.addEventListener('mouseleave', hideTip);
    a.addEventListener('focus', () => showTip(a));
    a.addEventListener('blur', hideTip);
    a.addEventListener('keydown', e => {
      let n = null;
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % stars.length;
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + stars.length - 1) % stars.length;
      if (e.key === 'Home') n = 0;
      if (e.key === 'End') n = stars.length - 1;
      if (e.key === 'Escape') { hideTip(); return; }
      if (n !== null) { e.preventDefault(); a.setAttribute('tabindex', '-1'); stars[n].setAttribute('tabindex', '0'); stars[n].focus(); }
    });
  });

  view.append(h('div', { class: 'card sky-card' }, stage,
    h('p', { class: 'small muted', text: stars.length ? t('const.teclado') : t('const.sinEstrellas') }),
    h('div', { class: 'legend' }, ['borrador', 'lista', 'brillante'].map(e => stateChip(e)))));

  if (missing.length) {
    view.append(h('h2', { text: t('const.faltanTitulo') }), stagger(h('div', { class: 'grid' }, missing.map(m => {
      const q = suggestQuestion(m.c.id);
      return h('div', { class: 'card stack' }, h('div', { class: 'row' }, icon(m.c.icono), h('h3', { text: compName(m.c.id) })),
        h('p', { class: 'muted small', text: t('const.teFalta', { comp: compName(m.c.id).toLowerCase() }) }),
        q ? h('p', { class: 'small' }, h('span', { class: 'faint', text: t('const.prueba') + ' ' }), L(q)) : null,
        h('button', { class: 'btn sm', type: 'button', onclick: () => { renderEditor.prefill = { competencias: [m.c.id], titulo: '' }; go('forja/nueva'); } }, icon('plus', 'ic sm'), t('const.escribir')));
    }))));
  }

  const rows2 = cov.map(z => h('tr', null,
    h('th', { scope: 'row' }, compName(z.c.id)),
    h('td', { class: 'num', text: String(z.list.length) }),
    h('td', { class: 'num', text: z.best === null ? '—' : String(z.best) }),
    h('td', { class: 'small muted', text: PRINCIPIOS.filter(p => p.comp.includes(z.c.id)).map(p => p.nombre).join(' · ') })));
  view.append(h('div', { class: 'card stack' },
    h('h2', { id: 'tabla-h', text: t('const.tabla') }),
    h('div', { class: 'table-wrap', role: 'region', 'aria-labelledby': 'tabla-h', tabindex: '0' }, h('table', null,
      h('caption', { class: 'sr-only', text: t('const.tablaCaption') }),
      h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('const.col.comp') }), h('th', { scope: 'col', text: t('const.col.n') }), h('th', { scope: 'col', text: t('const.col.best') }), h('th', { scope: 'col', text: t('const.col.principios') }))),
      h('tbody', null, rows2))),
    h('p', { class: 'tiny muted', text: t('aviso.independencia') })));
};

function suggestQuestion(compId) {
  const rol = UI.state.perfil ? UI.state.perfil.rol : 'red';
  const qs = [...ROLE_CONTENT[rol].preguntas, ...COMUNES.filter(q => !q.trampa)];
  return qs.find(q => q.comp[0] === compId) || qs.find(q => q.comp.includes(compId)) || null;
}
