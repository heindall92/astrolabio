// Candidaturas (#candidaturas): cada oferta con su estado, su próximo paso y su seguimiento. Mismo modelo que
// ai-job-search-es: se importan y se exportan en su formato («ajs-candidaturas»). Todo en este navegador.

const CAND_IC = { guardada: 'bookmark', pendiente: 'clock', enviada: 'send', proceso: 'loader', entrevista: 'messages-square', oferta: 'trophy', rechazada: 'circle-x', retirada: 'undo-2', 'sin-respuesta': 'circle-dashed' };
let candFiltro = 'abiertas';

function marcaAhora() {
  const d = new Date(), o = -d.getTimezoneOffset(), dos = n => String(n).padStart(2, '0');
  return `${today()}T${dos(d.getHours())}:${dos(d.getMinutes())}:${dos(d.getSeconds())}${o >= 0 ? '+' : '-'}${dos(Math.floor(Math.abs(o) / 60))}:${dos(Math.abs(o) % 60)}`;
}
function candChip(estado) {
  return h('span', { class: 'chip cand-' + estado }, icon(CAND_IC[estado], 'ic sm'), t('cand.estado.' + estado));
}
function guardarCandidatura(c) {
  const limpia = sanitizeCandidatura({ ...c, actualizada: marcaAhora() }, today());
  if (!limpia) return null;
  const i = UI.state.candidaturas.findIndex(x => x.id === limpia.id);
  UI.state.candidaturas = i < 0 ? [...UI.state.candidaturas, limpia] : UI.state.candidaturas.map(x => (x.id === limpia.id ? limpia : x));
  saveState();
  return limpia;
}

/** Importa una copia de ai-job-search-es: suma las nuevas y actualiza las que tengan una versión más reciente. */
async function importarCandidaturas(datos) {
  let nuevas;
  try { nuevas = leerCopiaCandidaturas(datos, today()); } catch (err) { toast(t('cand.import.' + (err.codigo || 'formato')), { ic: 'triangle-alert' }); return; }
  const r = fusionarCandidaturas(UI.state.candidaturas, nuevas);
  const ok = await confirmDialog({ title: t('cand.importTitulo'), body: t('cand.importCuerpo', { n: nuevas.length, a: r.anadidas, u: r.actualizadas }), ok: t('cand.importOk') });
  if (!ok) return;
  UI.state.candidaturas = r.lista;
  saveState();
  toast(t('cand.importadas', { a: r.anadidas, u: r.actualizadas }), { ic: 'upload' });
  go('candidaturas');
}

/** Lleva una candidatura a «Preparar entrevista» (empresa y puesto); avisa antes de cambiar otra entrevista en curso. */
async function prepararDesde(c) {
  const e = UI.state.entrevista;
  if (e && (e.empresa || e.puesto) && (e.empresa !== c.empresa || e.puesto !== c.puesto)) {
    const ok = await confirmDialog({ title: t('cand.prepararTitulo'), body: t('cand.prepararCuerpo', { e: [e.puesto, e.empresa].filter(Boolean).join(' · '), c: [c.puesto, c.empresa].filter(Boolean).join(' · ') }), ok: t('cand.prepararOk') });
    if (!ok) return;
  }
  const base = e || sanitizeEntrevista({});
  UI.state.entrevista = sanitizeEntrevista({ ...base, empresa: c.empresa, puesto: c.puesto, ediciones: e && e.empresa === c.empresa && e.puesto === c.puesto ? base.ediciones : {} });
  saveState();
  go('entrevista');
}

VIEWS.candidaturas = (view, arg) => {
  if (arg) return candEditor(view, arg);
  const xs = UI.state.candidaturas;
  const fileIn = h('input', { type: 'file', id: 'cand-file', accept: 'application/json,.json', class: 'sr-only', onchange: async ev => {
    const f = ev.target.files[0];
    ev.target.value = '';
    if (!f) return;
    if (f.size > 2_000_000) { toast(t('toast.importGrande'), { ic: 'triangle-alert' }); return; }
    const raw = safeParse(await f.text());
    if (!raw) { toast(t('toast.importError'), { ic: 'triangle-alert' }); return; }
    importarCandidaturas(raw);
  } });
  viewHead(view, { eyebrow: t('nav.candidaturas'), title: t('cand.titulo'), lede: t('cand.lede'),
    action: h('div', { class: 'row wrap' },
      h('label', { class: 'btn', for: 'cand-file', id: 'cand-importar' }, icon('file-up'), t('cand.importar')), fileIn,
      xs.length ? h('button', { class: 'btn', type: 'button', id: 'cand-exportar', onclick: () => {
        download(`candidaturas-${today()}.json`, JSON.stringify(exportarCandidaturas(xs, today()), null, 2));
        toast(t('cand.exportadas'), { ic: 'download' });
      } }, icon('file-down'), t('cand.exportar')) : null,
      h('a', { class: 'btn primary', href: '#candidaturas/nueva', id: 'cand-nueva' }, icon('plus'), t('cand.nueva'))) });
  const pend = pendientesCandidaturas(xs, today());
  if (pend.length) view.append(h('section', { class: 'callout warn stack', id: 'cand-pendientes', 'aria-labelledby': 'cand-pend-h' },
    h('h2', { id: 'cand-pend-h' }, icon('bell-ring'), ' ', t('cand.pendientes', { n: pend.length })),
    h('ul', { class: 'small stack tight' }, pend.map(p => h('li', null, h('a', { href: '#candidaturas/' + p.c.id, text: [p.c.puesto, p.c.empresa].filter(Boolean).join(' · ') }), ': ',
      t('cand.motivo.' + p.motivo, { n: p.dias }), p.c.proximaAccion ? ' · ' + p.c.proximaAccion : '')))));
  if (!xs.length) {
    view.append(h('div', { class: 'empty', id: 'cand-vacio' }, icon('list-todo', 'ic lg'), h('h2', { text: t('cand.vacioTitulo') }), h('p', { class: 'muted', text: t('cand.vacio') }),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#candidaturas/nueva' }, icon('plus'), t('cand.nueva')), h('label', { class: 'btn', for: 'cand-file' }, icon('file-up'), t('cand.importar')))));
    return;
  }
  const rec = recuentoEstados(xs);
  view.append(h('div', { class: 'cand-tablero', id: 'cand-tablero', role: 'list', 'aria-label': t('cand.tablero') },
    CAND.estados.filter(e => rec[e]).map(e => h('div', { class: 'cand-col', role: 'listitem' }, candChip(e), h('b', { class: 'mono', text: fmtNum(rec[e]) })))));
  const lista = h('div', { class: 'stack', id: 'cand-lista' });
  const pintar = () => {
    const ys = ordenarCandidaturas(xs).filter(c => candFiltro === 'todas' || (candFiltro === 'abiertas' ? !CAND.cerrados.includes(c.estado) : CAND.cerrados.includes(c.estado)));
    rellenarNodo(lista, ...(ys.length ? ys.map(candCard) : [h('p', { class: 'small muted', text: t('cand.nada') })]));
  };
  view.append(h('div', { class: 'seg wide', role: 'group', 'aria-label': t('cand.filtrar'), id: 'cand-filtro' },
    ['abiertas', 'cerradas', 'todas'].map(f => h('button', { type: 'button', 'aria-pressed': String(candFiltro === f), onclick: ev => { candFiltro = f; $$('#cand-filtro button').forEach(b => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); pintar(); } }, t('cand.filtro.' + f)))), lista);
  pintar();
};

function candCard(c) {
  const sel = h('select', { 'aria-label': t('cand.cambiarEstado', { c: c.puesto || c.empresa }), onchange: ev => { guardarCandidatura({ ...c, estado: ev.target.value }); toast(t('cand.estadoCambiado'), { ic: CAND_IC[ev.target.value] }); render(); } },
    CAND.estados.map(e => h('option', { value: e, selected: e === c.estado ? true : null, text: t('cand.estado.' + e) })));
  return h('article', { class: 'card stack cand' + (CAND.cerrados.includes(c.estado) ? ' cerrada' : ''), id: 'cand-' + c.id },
    h('div', { class: 'row spread' }, h('div', { class: 'row' }, candChip(c.estado), c.prioridad === 'alta' ? h('span', { class: 'chip gold', text: t('cand.prio.alta') }) : null), sel),
    h('h3', null, h('a', { href: '#candidaturas/' + c.id, text: c.puesto || t('cand.sinPuesto') })),
    h('p', { class: 'small muted' }, [c.empresa, c.ubicacion, c.modalidad !== 'sin' && !fold(c.ubicacion).startsWith(fold(t('cand.mod.' + c.modalidad)).slice(0, 5)) ? t('cand.mod.' + c.modalidad) : '', c.salario].filter(Boolean).join(' · ')),
    c.proximaAccion || c.fechaSeguimiento ? h('p', { class: 'small' }, icon('arrow-right', 'ic sm'), ' ', c.proximaAccion || t('cand.seguimiento'), c.fechaSeguimiento ? ' · ' + fmtDate(c.fechaSeguimiento) : '') : null,
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn sm', type: 'button', onclick: () => prepararDesde(c) }, icon('clipboard-list', 'ic sm'), t('cand.preparar')),
      c.enlace ? h('a', { class: 'btn sm ghost', href: c.enlace, target: '_blank', rel: 'noopener noreferrer' }, icon('external-link', 'ic sm'), t('cand.verOferta')) : null));
}

function candEditor(view, arg) {
  const existente = arg !== 'nueva' ? UI.state.candidaturas.find(c => c.id === arg) : null;
  if (arg !== 'nueva' && !existente) {
    viewHead(view, { eyebrow: t('nav.candidaturas'), title: t('cand.noExiste') });
    view.append(h('a', { class: 'btn', href: '#candidaturas' }, icon('arrow-left'), t('cand.volver')));
    return;
  }
  const d = existente ? { ...existente } : { id: uid().replace('h_', 'c_'), empresa: '', puesto: '', enlace: '', ubicacion: '', modalidad: 'sin', salario: '', fechaPublicacion: '', estado: 'guardada', prioridad: 'media', fechaSolicitud: '', via: 'sin', proximaAccion: '', fechaSeguimiento: '', notas: '', ofertaId: '', creada: marcaAhora(), actualizada: marcaAhora() };
  viewHead(view, { eyebrow: t('nav.candidaturas'), title: existente ? (existente.puesto || existente.empresa) : t('cand.nueva') });
  const inp = (k, tipo = 'text', extra = {}) => h('div', { class: 'field' }, h('label', { for: 'cand-' + k, text: t('cand.campo.' + k) }),
    h('input', { type: tipo, id: 'cand-' + k, value: d[k], maxlength: k === 'enlace' ? CAND.enlace : CAND.texto, oninput: ev => { d[k] = ev.target.value; }, ...extra }));
  const sel = (k, lista, pref) => h('div', { class: 'field' }, h('label', { for: 'cand-' + k, text: t('cand.campo.' + k) }),
    h('select', { id: 'cand-' + k, onchange: ev => { d[k] = ev.target.value; } }, lista.map(o => h('option', { value: o, selected: d[k] === o ? true : null, text: t(pref + o) }))));
  const form = h('form', { class: 'card stack', id: 'cand-form', novalidate: true },
    h('div', { class: 'form-grid' },
      inp('empresa'), inp('puesto'), inp('enlace', 'url', { inputmode: 'url', placeholder: 'https://…', 'aria-describedby': 'cand-enlace-h' }),
      sel('estado', CAND.estados, 'cand.estado.'), sel('prioridad', CAND.prioridades, 'cand.prio.'), sel('modalidad', CAND.modalidades, 'cand.mod.'),
      inp('ubicacion'), inp('salario'), sel('via', CAND.vias, 'cand.via.'),
      inp('fechaSolicitud', 'date'), inp('proximaAccion'), inp('fechaSeguimiento', 'date')),
    h('p', { class: 'hint', id: 'cand-enlace-h', text: t('cand.enlaceHint') }),
    h('div', { class: 'field' }, h('label', { for: 'cand-notas', text: t('cand.campo.notas') }), h('textarea', { id: 'cand-notas', rows: 4, maxlength: CAND.notas, value: d.notas, oninput: ev => { d.notas = ev.target.value; } })),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'submit', id: 'cand-guardar' }, icon('check'), t('ui.guardar')),
      h('a', { class: 'btn ghost', href: '#candidaturas' }, t('ui.cancelar')),
      h('span', { class: 'spacer' }),
      existente ? h('button', { class: 'btn danger', type: 'button', id: 'cand-borrar', onclick: async () => {
        if (!await confirmDialog({ title: t('cand.borrarTitulo'), body: t('cand.borrarCuerpo', { c: existente.puesto || existente.empresa }), ok: t('ui.borrar'), danger: true })) return;
        UI.state.candidaturas = UI.state.candidaturas.filter(c => c.id !== existente.id);
        saveState(); toast(t('cand.borrada'), { ic: 'trash-2' }); go('candidaturas');
      } }, icon('trash-2'), t('ui.borrar')) : null));
  form.addEventListener('submit', ev => {
    ev.preventDefault();
    if (!d.empresa.trim() && !d.puesto.trim()) { const el = $('#cand-empresa'); el.setAttribute('aria-invalid', 'true'); el.focus(); toast(t('cand.faltaEmpresa'), { ic: 'triangle-alert' }); return; }
    if (d.enlace.trim() && normalizarEnlace(d.enlace) === null) { const el = $('#cand-enlace'); el.setAttribute('aria-invalid', 'true'); el.focus(); toast(t('cand.enlaceMal'), { ic: 'triangle-alert' }); return; }
    if (!existente && UI.state.candidaturas.length >= CAND.max) { toast(t('cand.lleno'), { ic: 'triangle-alert' }); return; }
    guardarCandidatura(d);
    playSound('ok');
    toast(t('cand.guardada'));
    go('candidaturas');
  });
  view.append(form);
}
