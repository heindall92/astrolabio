// Núcleo de la interfaz: estado, almacenamiento, i18n, construcción segura del DOM y diálogos.
// Regla: los datos del usuario solo entran al DOM con textContent (h() lo garantiza).

const KEY = {
  estado: 'astrolabio-estado',
  tema: 'astrolabio-tema',
  acento: 'astrolabio-acento',
  idioma: 'astrolabio-idioma',
  sonido: 'astrolabio-sonido',
  lateral: 'astrolabio-lateral',
};
const ACENTOS = ['azul', 'rosa', 'solar', 'glaciar', 'orquidea', 'verde', 'rojo'];
const DICTS = { es: ES, en: EN };

const UI = {
  lang: 'es',
  state: emptyState(),
  corrupt: false,
};

function lsGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function lsSet(k, v) { try { localStorage.setItem(k, v); return true; } catch { return false; } }
function lsDel(k) { try { localStorage.removeItem(k); } catch { /* sin almacenamiento */ } }

function loadState() {
  const raw = lsGet(KEY.estado);
  if (!raw) { UI.state = emptyState(); return; }
  const parsed = safeParse(raw);
  if (parsed === null || typeof parsed !== 'object') {
    UI.corrupt = true;
    lsSet(KEY.estado + '-corrupto', raw.slice(0, 200000));
    UI.state = emptyState();
    return;
  }
  UI.state = sanitizeState(parsed, { competencias: COMPETENCIA_IDS });
}
function saveState() {
  if (!lsSet(KEY.estado, JSON.stringify(UI.state))) toast(t('toast.noGuardado'));
}

// ---------- i18n ----------
function t(key, params) {
  let s = DICTS[UI.lang][key];
  if (s === undefined) s = DICTS.es[key];
  if (s === undefined) return key;
  if (params) s = s.replace(/\{(\w+)\}/g, (_, k) => (params[k] !== undefined ? String(params[k]) : ''));
  return s;
}
/** Texto de contenido bilingüe { es, en }. */
function L(obj) {
  if (!obj) return '';
  if (typeof obj === 'string') return obj;
  return obj[UI.lang] || obj.es || '';
}
function fmtNum(n) { return new Intl.NumberFormat(UI.lang === 'en' ? 'en-GB' : 'es-ES').format(n); }
function fmtDate(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T12:00:00');
  return new Intl.DateTimeFormat(UI.lang === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' }).format(d);
}
function fmtDuration(sec) {
  const m = Math.floor(sec / 60), s = sec % 60;
  return m ? t('fmt.minseg', { m, s }) : t('fmt.seg', { s });
}
function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ---------- DOM ----------
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

/** Crea un elemento. Los hijos de texto se insertan como nodos de texto, nunca como HTML. */
function h(tag, attrs, ...kids) {
  const el = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
      else if (k === 'dataset') Object.assign(el.dataset, v);
      else if (k === 'value') el.value = v;
      else if (k === 'checked') el.checked = !!v;
      else el.setAttribute(k, v === true ? '' : String(v));
    }
  }
  append(el, kids);
  return el;
}
function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return el;
}

const SVGNS = 'http://www.w3.org/2000/svg';
const ICON_TEMPLATES = new Map();
/** Icono Lucide (marcado de confianza incrustado en el build, nunca datos del usuario). */
function icon(name, cls = 'ic') {
  let tpl = ICON_TEMPLATES.get(name);
  if (!tpl) {
    tpl = document.createElementNS(SVGNS, 'svg');
    tpl.setAttribute('viewBox', '0 0 24 24');
    tpl.setAttribute('width', '20');
    tpl.setAttribute('height', '20');
    tpl.setAttribute('fill', 'none');
    tpl.setAttribute('stroke', 'currentColor');
    tpl.setAttribute('stroke-width', '1.75');
    tpl.setAttribute('stroke-linecap', 'round');
    tpl.setAttribute('stroke-linejoin', 'round');
    tpl.setAttribute('aria-hidden', 'true');
    tpl.setAttribute('focusable', 'false');
    tpl.innerHTML = ICONS[name] || '';
    ICON_TEMPLATES.set(name, tpl);
  }
  const svg = tpl.cloneNode(true);
  svg.setAttribute('class', cls);
  return svg;
}
let markSeq = 0;
/** Logo en línea. Cada copia lleva su propio id de degradado: si dos copias comparten id,
 *  url(#…) apunta a la primera del documento y, si esa está oculta (lateral en móvil), la estrella no se pinta. */
function markSvg(cls) {
  const tpl = document.createElement('template');
  const id = 'am-g' + (++markSeq);
  tpl.innerHTML = MARK_SVG.replace(/am-g/g, id);
  const svg = tpl.content.firstElementChild;
  if (cls) svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  svg.removeAttribute('role');
  svg.removeAttribute('aria-label');
  return svg;
}

function stagger(container) {
  [...container.children].forEach((c, i) => c.style.setProperty('--i', String(Math.min(i, 12))));
  container.classList.add('stagger');
  return container;
}

function uid() {
  const a = new Uint8Array(6);
  crypto.getRandomValues(a);
  return 'h_' + [...a].map(b => b.toString(16).padStart(2, '0')).join('');
}

function reducedMotion() { return matchMedia('(prefers-reduced-motion: reduce)').matches; }

// ---------- Avisos ----------
function toast(msg, { gold = false, ic = 'check' } = {}) {
  const box = $('#toasts');
  const el = h('div', { class: 'toast' + (gold ? ' gold' : '') }, icon(ic, 'ic sm'), h('span', { text: msg }));
  box.append(el);
  setTimeout(() => el.remove(), 3600);
}

// ---------- Diálogos ----------
const dialogReturn = new WeakMap();
function openDialog(dlg, opener) {
  dialogReturn.set(dlg, opener || document.activeElement);
  if (!dlg.open) dlg.showModal();
}
function closeDialog(dlg) {
  if (dlg.open) dlg.close();
}
function wireDialog(dlg) {
  dlg.addEventListener('close', () => {
    const r = dialogReturn.get(dlg);
    if (r && document.contains(r) && typeof r.focus === 'function') r.focus();
  });
  dlg.addEventListener('click', e => { if (e.target === dlg) closeDialog(dlg); });
}
function dlgHead(id, title, dlg, ic) {
  return h('div', { class: 'dlg-h' },
    ic ? icon(ic, 'ic lg') : null,
    h('h2', { id, text: title }),
    h('button', { class: 'icon-btn', type: 'button', 'aria-label': t('ui.cerrar'), onclick: () => closeDialog(dlg) }, icon('x')));
}

/** Confirmación accesible. Devuelve una promesa con true o false. */
function confirmDialog({ title, body, ok, danger = false }) {
  const dlg = $('#dlg-confirm');
  return new Promise(resolve => {
    let result = false;
    dlg.replaceChildren(h('div', { class: 'dlg' },
      dlgHead('confirm-h', title, dlg, danger ? 'triangle-alert' : 'info'),
      h('div', { class: 'dlg-b' }, h('p', { text: body })),
      h('div', { class: 'dlg-f' },
        h('button', { class: 'btn', type: 'button', autofocus: true, onclick: () => closeDialog(dlg) }, t('ui.cancelar')),
        h('button', { class: 'btn ' + (danger ? 'danger solid' : 'primary'), type: 'button', id: 'confirm-ok', onclick: () => { result = true; closeDialog(dlg); } }, ok))));
    dlg.addEventListener('close', () => resolve(result), { once: true });
    openDialog(dlg);
  });
}

function download(name, text, type = 'application/json') {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type })), download: name });
  document.body.append(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
}
