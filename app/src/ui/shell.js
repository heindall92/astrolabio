// Shell: rutas por #hash, lateral, barra superior, tema, acento, idioma, sonido y móvil.

const ROUTES = [
  { id: 'inicio', ic: 'house' },
  { id: 'forja', ic: 'hammer' },
  { id: 'constelacion', ic: 'sparkles' },
  { id: 'arena', ic: 'swords' },
  { id: 'vacante', ic: 'scan-search' },
  { id: 'presentacion', ic: 'mic' },
  { id: 'progreso', ic: 'chart-column' },
  { id: 'insignias', ic: 'award' },
];
const EXTRA_ROUTES = ['perfil', 'privacidad', 'oferta', 'chuleta', 'traductor'];
const VIEWS = {};

function parseHash() {
  const raw = decodeURIComponent(location.hash.replace(/^#/, ''));
  const [id, ...rest] = raw.split('/');
  const known = ROUTES.some(r => r.id === id) || EXTRA_ROUTES.includes(id);
  return { id: known ? id : 'inicio', arg: rest.join('/') };
}
function go(hash) {
  if (location.hash === '#' + hash) render();
  else location.hash = hash;
}

let lastRoute = '';
function render() {
  const route = parseHash();
  const main = $('#contenido');
  const needsProfile = !UI.state.perfil && route.id !== 'privacidad';
  const viewId = needsProfile ? 'wizard' : route.id;
  const fn = VIEWS[viewId] || VIEWS.inicio;
  const view = h('section', { class: 'view', 'aria-labelledby': 'vh' });
  main.replaceChildren(view);
  fn(view, route.arg);
  const key = viewId + '/' + route.arg;
  if (key !== lastRoute) {
    window.scrollTo(0, 0);
    if (lastRoute) main.focus({ preventScroll: true });
    lastRoute = key;
  }
  document.body.dataset.route = route.id + (route.arg ? '/' + route.arg : '');
  const title = $('#vh', view);
  document.title = (title ? title.textContent + ' · ' : '') + 'Astrolabio';
  renderChrome(needsProfile ? '' : route.id);
}

function viewHead(view, { eyebrow, title, lede, action }) {
  view.append(h('header', { class: 'vhead' },
    h('div', null,
      eyebrow ? h('p', { class: 'eyebrow', text: eyebrow }) : null,
      h('h1', { id: 'vh', text: title }),
      lede ? h('p', { class: 'lede', text: lede }) : null),
    action || null));
}

function renderSoon(view, id, version) {
  viewHead(view, { eyebrow: t('nav.' + id), title: t('nav.' + id), lede: t('soon.lede', { v: version }) });
  view.append(h('div', { class: 'empty' }, icon('sparkles', 'ic lg'), h('p', { text: t('soon.body') }), h('a', { class: 'btn primary', href: '#forja' }, icon('hammer'), t('inicio.ir.forja'))));
}

function initials(name) {
  const p = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!p.length) return 'A';
  return (p[0][0] + (p[1] ? p[1][0] : '')).toUpperCase();
}

function renderChrome(current) {
  const nav = $('#nav');
  nav.replaceChildren(...ROUTES.map(r => h('a', { href: '#' + r.id, 'aria-current': r.id === current ? 'page' : null }, icon(r.ic), h('span', { text: t('nav.' + r.id) }))));
  animateNavIcons('#nav > a', current, 20, 'side');
  const mob = ['inicio', 'forja', 'arena', 'constelacion'];
  $('#bnav').replaceChildren(
    ...mob.map(id => { const r = ROUTES.find(x => x.id === id); return h('a', { href: '#' + id, 'aria-current': id === current ? 'page' : null }, icon(r.ic), h('span', { text: t('nav.' + id) })); }),
    h('button', { type: 'button', id: 'more-btn', 'aria-haspopup': 'dialog', onclick: e => openMore(e.currentTarget) }, icon('ellipsis'), h('span', { text: t('nav.mas') })));
  animateNavIcons('#bnav > a, #bnav > button', current, 22, 'tab');
  const p = UI.state.perfil;
  const pill = $('#pill-profile');
  pill.replaceChildren(h('span', { class: 'sr-only', text: t('perfil.cambiar') + ':' }), icon(p ? roleIcon(p.rol) : 'user-round'), h('span', { class: 't' }, h('b', { text: p ? t('rol.' + p.rol) : t('perfil.sinPerfil') }), h('span', { text: p ? t('nivel.' + p.nivel) + ' · ' + t('empresa.' + p.empresa) : t('perfil.crear') })), h('span', { class: 'spacer' }), icon('chevron-right', 'ic sm'));
  $('#avatar').textContent = initials(p && p.nombre);
  const st = UI.state;
  const racha = currentStreak(st, today());
  $('#stat-racha').replaceChildren(icon('flame', 'ic sm'), h('span', { text: fmtNum(racha) }));
  $('#stat-racha').setAttribute('title', t('stat.racha', { n: racha }));
  $('#stat-racha').setAttribute('aria-label', t('stat.racha', { n: racha }));
  $('#stat-racha').setAttribute('role', 'img');
  $('#stat-xp').replaceChildren(icon('zap', 'ic sm'), h('span', { text: fmtNum(st.xp) }), h('span', { class: 'xp-u', text: ' XP' }));
  $('#stat-xp').setAttribute('aria-label', t('stat.xp', { n: st.xp }));
  $('#stat-xp').setAttribute('role', 'img');
  $('#foot').replaceChildren(
    h('p', null, 'Astrolabio ' + APP_VERSION + ' · GPLv2 · ', h('a', { href: '#privacidad', text: t('nav.privacidad') }), ' · ' + t('foot.local')),
    h('p', { text: t('aviso.independencia') }));
}

/* Barra inferior y lateral: iconos animados (AnimateIcons, MIT).
 * Una sola vez al pasar el puntero, al tocar y cuando la pestaña pasa a estar activa; nunca en bucle.
 * Con movimiento reducido no se anima nada. */
const TAB_MOTION = matchMedia('(prefers-reduced-motion: reduce)');
const NAV_ICONS = { ...Object.fromEntries(ROUTES.map(r => [r.id, r.ic])), mas: 'ellipsis' };
const navActive = {};
function animateNavIcons(sel, current, size, group) {
  const AI = window.AstrolabioAnimateIcons;
  if (!AI) return;
  $$(sel).forEach(el => {
    const key = el.id === 'more-btn' ? 'mas' : el.getAttribute('href').slice(1);
    const def = AI.icons[NAV_ICONS[key]], old = el.querySelector('svg.ic');
    if (!def || !old) return;
    const ico = AI.createIcon(def, { size, isAnimated: false });
    ico.classList.add('ic', 'ai');
    ico.setAttribute('aria-hidden', 'true');
    old.replaceWith(ico);
    const play = () => { if (!TAB_MOTION.matches) ico.startAnimation(); };
    el.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse') play(); });
    el.addEventListener('pointerdown', play);
    if (key === current && current !== navActive[group]) requestAnimationFrame(play);
  });
  navActive[group] = current;
}

function roleIcon(rol) {
  return { red: 'swords', blue: 'shield-half', grc: 'scale', data: 'chart-column', cloud: 'cloud', dev: 'code-xml', appsec: 'shield-check', ia: 'brain-circuit', soporte: 'headset', pm: 'kanban', ux: 'pen-tool', preventa: 'presentation', cambio: 'route' }[rol] || 'user-round';
}

// ---------- Textos estáticos del shell ----------
function applyStaticText() {
  document.documentElement.lang = UI.lang;
  $$('[data-t]').forEach(el => { el.textContent = t(el.dataset.t); });
  $('#skip').textContent = t('ui.saltar');
  $('#side').setAttribute('aria-label', t('ui.navPrincipal'));
  $('#nav').setAttribute('aria-label', t('ui.secciones'));
  $('#bnav').setAttribute('aria-label', t('ui.secciones'));
  $('#lang-seg').setAttribute('aria-label', t('ui.idiomaInterfaz'));
  $('#theme-btn').setAttribute('aria-label', t('ui.temaOscuro'));
  $('#help-btn').setAttribute('aria-label', t('ui.ayuda'));
  $('#dlg-search').setAttribute('aria-label', t('ui.buscar'));
  updateCollapseBtn();
  updateSoundBtn();
  $$('#lang-seg button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === UI.lang)));
}

// ---------- Tema ----------
function currentTheme() { return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'; }
function setTheme(theme, { animate = true } = {}) {
  const root = document.documentElement;
  if (animate && !reducedMotion()) {
    root.classList.add('theme-fade');
    clearTimeout(setTheme.tm);
    setTheme.tm = setTimeout(() => root.classList.remove('theme-fade'), 360);
  }
  root.dataset.theme = theme;
  $('#theme-btn').setAttribute('aria-checked', String(theme === 'dark'));
}
function setAccent(a) {
  if (!ACENTOS.includes(a)) a = 'azul';
  document.documentElement.dataset.accent = a;
  lsSet(KEY.acento, a);
  $$('.swatch').forEach(s => s.setAttribute('aria-checked', String(s.dataset.accent === a)));
}
function setLang(l) {
  UI.lang = l === 'en' ? 'en' : 'es';
  lsSet(KEY.idioma, UI.lang);
  applyStaticText();
  render();
}

function accentPicker() {
  const cur = document.documentElement.dataset.accent || 'azul';
  return h('div', { class: 'swatches', role: 'radiogroup', 'aria-label': t('ui.acento') },
    ACENTOS.map(a => h('button', { type: 'button', role: 'radio', class: 'swatch sw-' + a, dataset: { accent: a }, 'aria-checked': String(a === cur), 'aria-label': t('acento.' + a), title: t('acento.' + a),
      onclick: () => setAccent(a),
      onkeydown: e => {
        const i = ACENTOS.indexOf(a);
        let n = null;
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') n = (i + 1) % ACENTOS.length;
        if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') n = (i + ACENTOS.length - 1) % ACENTOS.length;
        if (n !== null) { e.preventDefault(); setAccent(ACENTOS[n]); e.currentTarget.parentElement.children[n].focus(); }
      } }, h('i'))));
}

// ---------- Popovers del lateral ----------
let openPop = null;
function togglePop(pop, btn, build) {
  if (openPop && openPop.pop === pop) { closePop(); return; }
  closePop();
  pop.replaceChildren(...build());
  pop.hidden = false;
  const r = btn.getBoundingClientRect();
  pop.style.left = Math.round(r.left) + 'px';
  pop.style.bottom = Math.round(innerHeight - r.top + 8) + 'px';
  pop.style.setProperty('--origin', 'bottom left');
  btn.setAttribute('aria-expanded', 'true');
  openPop = { pop, btn };
  const first = pop.querySelector('[aria-checked="true"], button, a');
  if (first) first.focus();
}
function closePop(returnFocus = false) {
  if (!openPop) return;
  openPop.pop.hidden = true;
  openPop.btn.setAttribute('aria-expanded', 'false');
  if (returnFocus) openPop.btn.focus();
  openPop = null;
}
function accountItems() {
  const item = (ic, label, fn, cls = '') => h('button', { class: 'navlike ' + cls, type: 'button', role: 'menuitem', onclick: () => { closePop(); fn(); } }, icon(ic), h('span', { text: label }));
  return [
    item('user-round', t('cuenta.perfil'), () => go('perfil')),
    item('download', t('cuenta.exportar'), exportData),
    item('upload', t('cuenta.importar'), () => $('#import-file').click()),
    item('lock', t('nav.privacidad'), () => go('privacidad')),
    item('trash-2', t('cuenta.borrar'), wipeAll),
  ];
}

function openMore(btn) {
  fillMore();
  openDialog($('#dlg-more'), btn);
}
// En el móvil, «Más» lleva también el idioma (en la barra superior no cabe con cifras grandes).
function fillMore() {
  const dlg = $('#dlg-more');
  const langBtn = l => h('button', { type: 'button', lang: l, dataset: { langM: l }, 'aria-pressed': String(UI.lang === l),
    onclick: () => { setLang(l); fillMore(); const b = dlg.querySelector(`[data-lang-m="${l}"]`); if (b) b.focus(); } }, l.toUpperCase());
  const link = (href, ic, label) => h('a', { href, onclick: () => closeDialog(dlg) }, icon(ic), h('span', { text: label }));
  dlg.replaceChildren(h('div', { class: 'dlg' },
    dlgHead('more-h', t('nav.mas'), dlg),
    h('div', { class: 'dlg-b' },
      h('div', { class: 'more-list' },
        link('#vacante', 'scan-search', t('nav.vacante')),
        link('#presentacion', 'mic', t('nav.presentacion')),
        link('#traductor', 'arrow-left-right', t('nav.traductor')),
        link('#progreso', 'chart-column', t('nav.progreso')),
        link('#insignias', 'award', t('nav.insignias')),
        link('#perfil', 'user-round', t('nav.perfil')),
        link('#privacidad', 'lock', t('nav.privacidad')),
        h('button', { type: 'button', onclick: () => { closeDialog(dlg); openHelp(); } }, icon('circle-question-mark'), h('span', { text: t('ui.ayuda') })),
        h('button', { type: 'button', onclick: () => { closeDialog(dlg); exportData(); } }, icon('download'), h('span', { text: t('cuenta.exportar') }))),
      h('h3', { id: 'more-lang', text: t('ui.idiomaInterfaz') }),
      h('div', { class: 'seg', role: 'group', 'aria-labelledby': 'more-lang' }, langBtn('es'), langBtn('en')),
      h('h3', { id: 'more-acc', text: t('ui.acento') }),
      accentPicker())));
}

// ---------- Datos ----------
function exportData() {
  const env = { formato: 'yrd-ecosistema', version: 1, tipo: 'historias', app: 'astrolabio', appVersion: APP_VERSION, exportado: new Date().toISOString(), datos: UI.state };
  download(`astrolabio-${today()}.json`, JSON.stringify(env, null, 2));
  toast(t('toast.exportado'), { ic: 'download' });
}
async function importData(file) {
  if (!file) return;
  if (file.size > 5_000_000) { toast(t('toast.importGrande'), { ic: 'triangle-alert' }); return; }
  const text = await file.text();
  const raw = safeParse(text);
  if (!raw || typeof raw !== 'object') { toast(t('toast.importError'), { ic: 'triangle-alert' }); return; }
  const data = raw.formato === 'yrd-ecosistema' ? (raw.tipo === 'historias' ? raw.datos : null) : raw;
  if (!data) { toast(t('toast.importTipo'), { ic: 'triangle-alert' }); return; }
  const clean = sanitizeState(data, { competencias: COMPETENCIA_IDS });
  const ok = await confirmDialog({ title: t('import.titulo'), body: t('import.cuerpo', { n: clean.historias.length }), ok: t('import.ok') });
  if (!ok) return;
  UI.state = clean;
  saveState();
  toast(t('toast.importado', { n: clean.historias.length }), { ic: 'upload' });
  go('inicio');
}
async function wipeAll() {
  const ok = await confirmDialog({ title: t('borrar.titulo'), body: t('borrar.cuerpo'), ok: t('borrar.ok'), danger: true });
  if (!ok) return;
  UI.state = emptyState();
  lsDel(KEY.estado);
  toast(t('toast.borrado'), { ic: 'trash-2' });
  go('inicio');
}

function updateCollapseBtn() {
  const collapsed = $('#app').classList.contains('collapsed');
  const b = $('#collapse-btn');
  b.setAttribute('aria-expanded', String(!collapsed));
  b.setAttribute('aria-label', collapsed ? t('ui.mostrarLateral') : t('ui.ocultarLateral'));
}
function updateSoundBtn() {
  const on = soundOn();
  const b = $('#sound-btn');
  b.setAttribute('aria-pressed', String(on));
  b.setAttribute('aria-label', t('ui.sonido'));
  b.replaceChildren(icon(on ? 'volume-2' : 'volume-x'));
}

function initShell() {
  wireDialog($('#dlg-help'));
  wireDialog($('#dlg-search'));
  wireDialog($('#dlg-confirm'));
  wireDialog($('#dlg-more'));
  wireDialog($('#dlg-misc'));
  const savedTheme = lsGet(KEY.tema);
  // Siempre en claro salvo que la persona haya elegido el oscuro con el interruptor.
  setTheme(savedTheme === 'dark' ? 'dark' : 'light', { animate: false });
  setAccent(lsGet(KEY.acento) || 'azul');
  if (lsGet(KEY.lateral) === 'oculto') $('#app').classList.add('collapsed');
  $('#theme-btn').addEventListener('click', () => { const n = currentTheme() === 'dark' ? 'light' : 'dark'; setTheme(n); lsSet(KEY.tema, n); });
  $$('#lang-seg button').forEach(b => b.addEventListener('click', () => setLang(b.dataset.lang)));
  $('#collapse-btn').addEventListener('click', () => {
    const c = $('#app').classList.toggle('collapsed');
    lsSet(KEY.lateral, c ? 'oculto' : 'visible');
    updateCollapseBtn();
  });
  $('#sound-btn').addEventListener('click', () => { setSound(!soundOn()); updateSoundBtn(); if (soundOn()) playSound('ok'); });
  $('#help-btn').addEventListener('click', e => openHelp(undefined, e.currentTarget));
  $('#search-btn').addEventListener('click', e => openSearch(e.currentTarget));
  $('#pill-profile').addEventListener('click', () => go('perfil'));
  $('#accent-btn').addEventListener('click', e => togglePop($('#accent-pop'), e.currentTarget, () => [h('h3', { id: 'accent-h', text: t('ui.acento') }), accentPicker()]));
  $('#account-btn').addEventListener('click', e => togglePop($('#account-pop'), e.currentTarget, accountItems));
  $('#import-file').addEventListener('change', e => { importData(e.target.files[0]); e.target.value = ''; });
  document.addEventListener('click', e => { if (openPop && !openPop.pop.contains(e.target) && !openPop.btn.contains(e.target)) closePop(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && openPop) { e.preventDefault(); closePop(true); return; }
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); openSearch(); return; }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName) || document.activeElement.isContentEditable;
    if (typing || e.ctrlKey || e.metaKey || e.altKey || document.querySelector('dialog[open]')) return;
    if (e.key === '?') { e.preventDefault(); openHelp('atajos'); }
    else if (e.key === 'n' && UI.state.perfil) { e.preventDefault(); go('forja/nueva'); }
    else if (/^[1-6]$/.test(e.key) && UI.state.perfil) { go(ROUTES[Number(e.key) - 1].id); }
  });
  window.addEventListener('hashchange', render);
}
