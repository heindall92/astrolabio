// Juego: XP, rachas, rangos, insignias y celebraciones; vista Progreso, carta de oferta y reglas en la ayuda.

function gameCtx(extra = {}) {
  const scores = UI.state.historias.map(scoreOf);
  return { state: UI.state, scores, lang: UI.lang, hour: new Date().getHours(), meta: META_DIARIA, competencias: coveredCompetencies(UI.state.historias, scores).size, ...extra };
}

/** Suma XP, comprueba insignias y celebra. extra: contexto del evento (p. ej., el duelo). */
function grantXp(xp, extra = {}) {
  const day = today();
  const rangoAntes = rankFor(UI.state.xp).id;
  let meta = false;
  const add = n => { const r = addXp(UI.state, n, day); UI.state = r.state; meta = meta || r.metaCumplida; };
  if (xp > 0) add(xp);
  const scores = UI.state.historias.map(scoreOf);
  if (scores.length) UI.state.historialMedia = { ...UI.state.historialMedia, [day]: Math.round(scores.reduce((n, s) => n + s.total, 0) / scores.length) };
  // Las insignias pueden encadenarse (la XP de una puede cumplir la meta diaria).
  for (let vuelta = 0; vuelta < 3; vuelta++) {
    const nuevas = newBadges(INSIGNIAS, gameCtx(extra));
    if (!nuevas.length) break;
    for (const id of nuevas) {
      const b = INSIGNIAS.find(x => x.id === id);
      UI.state.insignias = [...UI.state.insignias, id];
      add(XP.insignia + (id === 'constelacion-completa' ? XP.constelacion : 0));
      toast(t('juego.insignia', { nombre: L(b.nombre) }), { gold: true, ic: b.icono });
    }
    playSound('star');
  }
  if (meta) toast(t('juego.meta', { n: META_DIARIA }), { gold: true, ic: 'target' });
  const rangoDespues = rankFor(UI.state.xp).id;
  if (rangoDespues !== rangoAntes) celebrate(t('rango.' + rangoDespues));
  renderChrome(document.body.dataset.route ? document.body.dataset.route.split('/')[0] : '');
}

function onStorySaved(story, sc, prevEstado, esNueva) {
  grantXp(storyXp(prevEstado, sc.estado, esNueva));
}
function onDuelEnd(registro, rec, detalle) {
  grantXp(duelXp(registro, !!rec.jefe), { duel: { registro, detalle } });
}

/** Partículas de estrella al subir de rango; con movimiento reducido, un fundido. */
function celebrate(rango) {
  playSound('rank');
  toast(t('juego.rango', { rango }), { gold: true, ic: 'crown' });
  const box = h('div', { class: 'celebra', 'aria-hidden': 'true' }, h('div', { class: 'celebra-t', text: rango }));
  if (!reducedMotion()) {
    for (let i = 0; i < 16; i++) {
      const s = h('span', { class: 'spark' });
      const ang = (i / 16) * Math.PI * 2;
      const dist = 120 + (i % 3) * 50;
      s.style.setProperty('--x', Math.round(Math.cos(ang) * dist) + 'px');
      s.style.setProperty('--y', Math.round(Math.sin(ang) * dist) + 'px');
      s.style.setProperty('--d', (i % 4) * 40 + 'ms');
      box.append(s);
    }
  }
  document.body.append(box);
  setTimeout(() => box.remove(), 1600);
}

// ---------- Vista Progreso ----------
function chartBars(series, label) {
  const W = 560, H = 160, max = Math.max(META_DIARIA, ...series.map(d => d.xp)), bw = W / series.length;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 22}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  const el = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); return e; };
  const gy = H - (META_DIARIA / max) * H;
  svg.append(el('line', { x1: 0, x2: W, y1: gy, y2: gy, class: 'goal-line' }));
  series.forEach((d, i) => {
    const bh = Math.max(d.xp ? 3 : 0, (d.xp / max) * H);
    svg.append(el('rect', { x: i * bw + 4, y: H - bh, width: bw - 8, height: bh, rx: 4, class: d.xp >= META_DIARIA ? 'b gold' : 'b' }));
    if (i % 2 === series.length % 2 || i === series.length - 1) { const tx = el('text', { x: i * bw + bw / 2, y: H + 16, class: 'ax' }); tx.textContent = d.dia.slice(8); svg.append(tx); }
  });
  return svg;
}
function chartLine(points, label) {
  const W = 560, H = 160;
  const svg = document.createElementNS(SVGNS, 'svg');
  svg.setAttribute('viewBox', `0 0 ${W} ${H + 22}`);
  svg.setAttribute('class', 'chart');
  svg.setAttribute('role', 'img');
  svg.setAttribute('aria-label', label);
  const el = (tag, attrs) => { const e = document.createElementNS(SVGNS, tag); for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v)); return e; };
  const step = points.length > 1 ? (W - 24) / (points.length - 1) : 0;
  const xy = points.map((p, i) => [12 + i * step, H - (p.v / 100) * H]);
  svg.append(el('polyline', { points: xy.map(p => p.join(',')).join(' '), class: 'ln' }));
  xy.forEach(([x, y], i) => {
    svg.append(el('circle', { cx: x, cy: y, r: 4, class: 'pt' }));
    if (i === 0 || i === xy.length - 1) { const tx = el('text', { x, y: H + 16, class: 'ax', 'text-anchor': i === 0 ? 'start' : 'end' }); tx.textContent = points[i].dia.slice(5); svg.append(tx); }
  });
  return svg;
}
function dataTable(id, cols, rows) {
  return h('details', { class: 'small' }, h('summary', { text: t('progreso.verTabla') }),
    h('table', { id }, h('thead', null, h('tr', null, cols.map(c => h('th', { scope: 'col', text: c })))),
      h('tbody', null, rows.map(r => h('tr', null, r.map(c => h('td', { class: 'mono', text: String(c) })))))));
}

VIEWS.progreso = view => {
  const st = UI.state;
  const day = today();
  const rk = rankFor(st.xp);
  const hoy = st.historialXp[day] || 0;
  viewHead(view, { eyebrow: t('nav.progreso'), title: t('progreso.titulo'), lede: t('progreso.lede') });
  const pct = Math.round(rk.progress * 100);
  const bar = (w, gold) => { const i = h('i'); i.style.width = w + '%'; return h('div', { class: 'bar' + (gold ? ' gold' : '') }, i); };
  view.append(stagger(h('div', { class: 'grid', id: 'prog-kpis' },
    h('div', { class: 'card stack', id: 'prog-rango' }, h('p', { class: 'eyebrow', text: t('progreso.rango') }), h('div', { class: 'row' }, icon('crown', 'ic lg'), h('h2', { text: t('rango.' + rk.id) })),
      bar(pct, true), h('p', { class: 'small muted', text: rk.next ? t('progreso.siguiente', { n: fmtNum(rk.next.xp - st.xp), rango: t('rango.' + rk.next.id) }) : t('progreso.maximo') })),
    h('div', { class: 'card stack', id: 'prog-meta' }, h('p', { class: 'eyebrow', text: t('progreso.meta') }), h('div', { class: 'row' }, icon('target', 'ic lg'), h('h2', { text: `${fmtNum(hoy)} / ${META_DIARIA} XP` })),
      bar(Math.min(100, Math.round((hoy / META_DIARIA) * 100)), hoy >= META_DIARIA), h('p', { class: 'small muted', text: hoy >= META_DIARIA ? t('progreso.metaOk') : t('progreso.metaFalta', { n: META_DIARIA - hoy }) })),
    h('div', { class: 'card stack' }, h('p', { class: 'eyebrow', text: t('progreso.racha') }), h('div', { class: 'row' }, icon('flame', 'ic lg'), h('h2', { text: t('progreso.dias', { n: currentStreak(st, day) }) })), h('p', { class: 'small muted', text: t('progreso.rachaD') })),
    h('div', { class: 'card stack' }, h('p', { class: 'eyebrow', text: t('progreso.duelos') }), h('div', { class: 'row' }, icon('swords', 'ic lg'), h('h2', { text: `${st.duelos.filter(d => d.superado).length} / ${st.duelos.length}` })), h('p', { class: 'small muted', text: t('progreso.duelosD') })))));

  const series = xpSeries(st.historialXp, day, 14);
  view.append(h('div', { class: 'grid two' },
    h('section', { class: 'card stack', 'aria-labelledby': 'xp-h' }, h('h2', { id: 'xp-h', text: t('progreso.xpDia') }),
      chartBars(series, t('progreso.xpDiaAria', { total: series.reduce((n, d) => n + d.xp, 0), meta: META_DIARIA })),
      h('p', { class: 'tiny muted', text: t('progreso.lineaMeta', { n: META_DIARIA }) }),
      dataTable('tabla-xp', [t('progreso.col.dia'), 'XP'], series.map(d => [fmtDate(d.dia), d.xp]))),
    (() => {
      const pts = Object.entries(st.historialMedia).sort().slice(-14).map(([dia, v]) => ({ dia, v }));
      return h('section', { class: 'card stack', 'aria-labelledby': 'media-h' }, h('h2', { id: 'media-h', text: t('progreso.media') }),
        pts.length ? [chartLine(pts, t('progreso.mediaAria', { a: pts[0].v, b: pts[pts.length - 1].v })), dataTable('tabla-media', [t('progreso.col.dia'), t('progreso.col.media')], pts.map(p => [fmtDate(p.dia), p.v]))]
          : h('p', { class: 'small muted', text: t('progreso.sinMedia') }));
    })()));

  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'rangos-h' }, h('h2', { id: 'rangos-h', text: t('progreso.rangos') }),
    h('ol', { class: 'ranks' }, RANGOS.map((r, i) => h('li', { class: i <= rk.idx ? 'done' : '', 'aria-current': i === rk.idx ? 'step' : null },
      icon(i <= rk.idx ? 'star' : 'circle', 'ic sm'), h('b', { text: t('rango.' + r.id) }), h('span', { class: 'mono small muted', text: fmtNum(r.xp) + ' XP' }))))));

  const jefes = ROLES.filter(r => bossBeaten(st.duelos, r));
  if (jefes.length) view.append(h('div', { class: 'row wrap', id: 'ofertas' }, jefes.map(r => h('a', { class: 'btn', href: '#oferta/' + r }, icon('file-text'), t('oferta.ver', { rol: t('rol.' + r) })))));
};

// ---------- Carta de oferta (juego) ----------
VIEWS.oferta = (view, rol) => {
  if (!ROLES.includes(rol) || !bossBeaten(UI.state.duelos, rol)) {
    viewHead(view, { eyebrow: t('oferta.eyebrow'), title: t('oferta.bloqueada'), lede: t('oferta.bloqueadaD') });
    view.append(h('a', { class: 'btn primary', href: '#arena' }, icon('swords'), t('nav.arena')));
    return;
  }
  const d = UI.state.duelos.filter(x => x.ruta === rol && x.superado && x.recruiter === 'subeliston').pop();
  const nombre = (UI.state.perfil.nombre || '').trim() || t('oferta.anon');
  viewHead(view, { eyebrow: t('oferta.eyebrow'), title: t('oferta.titulo'), lede: t('oferta.lede') });
  view.append(h('div', { class: 'row no-print' },
    h('button', { class: 'btn primary', type: 'button', id: 'oferta-print', onclick: () => window.print() }, icon('printer'), t('oferta.pdf')),
    h('a', { class: 'btn', href: '#progreso' }, t('ui.volver'))));
  view.append(h('article', { class: 'letter', id: 'oferta', 'aria-labelledby': 'oferta-h' },
    h('p', { class: 'stamp', text: t('oferta.sello') }),
    h('div', { class: 'row' }, markSvg('letter-mark'), h('div', null, h('b', { text: 'Astrolabio Interview Lab' }), h('p', { class: 'tiny muted', text: fmtDate(d.fecha || today()) }))),
    h('h2', { id: 'oferta-h', text: t('oferta.asunto', { rol: t('rol.' + rol) }) }),
    h('p', { text: t('oferta.saludo', { nombre }) }),
    h('p', { text: t('oferta.p1', { rol: t('rol.' + rol), n: d.conviccion }) }),
    h('p', { text: t('oferta.p2') }),
    h('ul', null, ['b1', 'b2', 'b3'].map(k => h('li', { text: t('oferta.' + k) }))),
    h('p', { text: t('oferta.p3') }),
    h('p', { class: 'firma' }, h('b', { text: L(RECRUITERS.find(r => r.jefe).nombre) }), h('br'), t('oferta.cargo')),
    h('p', { class: 'tiny muted', text: t('oferta.aviso') })));
};

// ---------- Ayuda «Método»: reglas del juego desde las constantes ----------
function helpGameRules() {
  const xpRows = Object.entries(XP).map(([k, v]) => h('tr', null, h('th', { scope: 'row', text: t('xp.' + k) }), h('td', { class: 'num', text: '+' + v })));
  const rk = RANGOS.map(r => h('tr', null, h('th', { scope: 'row', text: t('rango.' + r.id) }), h('td', { class: 'num', text: fmtNum(r.xp) })));
  return [
    h('h3', { id: 'ayuda-juego', text: t('ayuda.juego') }),
    h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('ayuda.juego.logro') }), h('th', { scope: 'col', text: 'XP' }))), h('tbody', null, xpRows)),
    h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('progreso.rango') }), h('th', { scope: 'col', text: t('ayuda.juego.desde') }))), h('tbody', null, rk)),
    h('p', { text: t('ayuda.juego.meta', { meta: META_DIARIA, jefe: JEFE_DESBLOQUEO, n: INSIGNIAS.length, s: INSIGNIAS.filter(b => b.secreta).length }) }),
  ];
}
