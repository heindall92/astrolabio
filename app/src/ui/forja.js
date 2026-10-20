// Forja: banco de historias y editor STAR con puntuación en vivo.

function scoreOf(story) {
  const p = UI.state.perfil || {};
  return scoreStory(story, { idioma: p.idioma || 'es', nivel: p.nivel || 'junior', marcados: UI.state.ajustes.sensibles });
}
const ESTADO_IC = { borrador: 'pencil', lista: 'check', brillante: 'sparkles' };
function stateChip(estado) {
  return h('span', { class: 'chip st-' + estado }, icon(ESTADO_IC[estado], 'ic sm'), t('estado.' + estado));
}
function compName(id) {
  const c = COMPETENCIAS.find(x => x.id === id);
  return c ? L({ es: c.es, en: c.en }) : id;
}

function storyCard(st) {
  const sc = scoreOf(st);
  return h('a', { class: 'card link', href: '#forja/' + st.id },
    h('div', { class: 'row spread' }, stateChip(sc.estado), h('span', { class: 'score' }, String(sc.total), h('small', { text: '/100' }))),
    h('h2', { text: st.titulo || t('forja.sinTitulo') }),
    h('div', { class: 'meta' },
      st.tipo === 'ensayo' ? h('span', { class: 'chip ensayo' }, icon('pencil', 'ic sm'), t('tipo.ensayo')) : null,
      st.competencias.slice(0, 3).map(c => h('span', { text: compName(c) }))),
    st.editada ? h('p', { class: 'tiny faint', text: t('forja.editada', { fecha: fmtDate(st.editada) }) }) : null);
}

VIEWS.forja = (view, arg) => {
  if (arg) return renderEditor(view, arg);
  const hs = UI.state.historias;
  viewHead(view, { eyebrow: t('nav.forja'), title: t('forja.titulo'), lede: t('forja.lede'),
    action: h('a', { class: 'btn primary', href: '#forja/nueva', 'aria-keyshortcuts': 'N' }, icon('plus'), t('forja.nueva')) });
  if (!hs.length) {
    view.append(h('div', { class: 'empty' }, icon('star', 'ic lg'), h('h2', { text: t('forja.vacioTitulo') }), h('p', { class: 'muted', text: t('forja.vacio') }),
      h('div', { class: 'row' }, h('a', { class: 'btn primary', href: '#forja/nueva' }, icon('plus'), t('forja.nueva')))));
    return;
  }
  const sorted = hs.slice().sort((a, b) => (b.editada || '').localeCompare(a.editada || ''));
  view.append(stagger(h('div', { class: 'story-list', id: 'story-list' }, sorted.map(storyCard))));
};

function renderEditor(view, id) {
  const existing = UI.state.historias.find(x => x.id === id);
  if (id !== 'nueva' && !existing) {
    viewHead(view, { eyebrow: t('nav.forja'), title: t('forja.noExiste') });
    view.append(h('a', { class: 'btn', href: '#forja' }, icon('chevron-left'), t('forja.volver')));
    return;
  }
  const draft = existing ? { ...existing, competencias: [...existing.competencias] } : { id: uid(), titulo: '', tipo: 'real', s: '', t: '', a: '', r: '', l: '', competencias: [], creada: today(), editada: today() };
  const prefill = renderEditor.prefill;
  renderEditor.prefill = null;
  if (!existing && prefill) Object.assign(draft, prefill);

  viewHead(view, { eyebrow: t('nav.forja'), title: existing ? t('forja.editar') : t('forja.nueva'), lede: t('forja.editorLede') });
  const form = h('form', { class: 'stack', id: 'story-form', 'aria-label': t('forja.formulario') });
  const panel = h('aside', { class: 'card panel stack', 'aria-labelledby': 'score-h' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite', id: 'score-live' });

  const titulo = h('input', { type: 'text', id: 'f-titulo', maxlength: LIMITES.titulo, value: draft.titulo, required: true, placeholder: t('forja.tituloPh') });
  form.append(h('div', { class: 'field' }, h('label', { for: 'f-titulo', text: t('forja.tituloLabel') }), titulo));

  const tipo = h('fieldset', null, h('legend', { text: t('forja.tipo') }),
    h('div', { class: 'checks' }, TIPOS.map(tp => h('label', { class: 'check' }, h('input', { type: 'radio', name: 'tipo', value: tp, checked: draft.tipo === tp, onchange: () => { draft.tipo = tp; update(); } }), icon(tp === 'real' ? 'star' : 'pencil', 'ic sm'), t('tipo.' + tp)))));
  const ensayoNote = h('div', { class: 'callout warn', id: 'ensayo-note' }, icon('triangle-alert'), h('p', { text: t('forja.ensayoAviso') }));
  form.append(tipo, ensayoNote);

  const comps = h('fieldset', null, h('legend', { text: t('forja.competencias') }),
    h('p', { class: 'hint small muted', text: t('forja.competenciasHint', { n: LIMITES.competenciasPorHistoria }) }),
    h('div', { class: 'checks' }, COMPETENCIAS.map(c => h('label', { class: 'check' }, h('input', { type: 'checkbox', value: c.id, checked: draft.competencias.includes(c.id), onchange: e => {
      if (e.target.checked) { if (draft.competencias.length >= LIMITES.competenciasPorHistoria) { e.target.checked = false; toast(t('forja.maxComp', { n: LIMITES.competenciasPorHistoria }), { ic: 'info' }); return; } draft.competencias.push(c.id); }
      else draft.competencias = draft.competencias.filter(x => x !== c.id);
    } }), L({ es: c.es, en: c.en })))));
  form.append(comps);

  const counters = {};
  for (const b of [...BLOQUES, 'l']) {
    const fid = 'f-' + b;
    counters[b] = h('span', { class: 'wc', id: fid + '-wc' });
    const ta = h('textarea', { id: fid, rows: b === 'a' ? 7 : 3, maxlength: LIMITES.bloque, 'aria-describedby': fid + '-hint ' + fid + '-wc', value: draft[b], placeholder: t('forja.ph.' + b), oninput: e => { draft[b] = e.target.value; update(); } });
    form.append(h('div', { class: 'block' }, h('span', { class: 'letter', 'aria-hidden': 'true', text: b.toUpperCase() }),
      h('div', { class: 'field' }, h('label', { for: fid }, t('bloque.' + b), b === 'l' ? h('span', { class: 'chip', text: t('ui.opcional') }) : null, h('span', { class: 'spacer' }), counters[b]),
        h('p', { class: 'hint', id: fid + '-hint', text: t('forja.hint.' + b) }), ta)));
  }
  titulo.addEventListener('input', e => { draft.titulo = e.target.value; });

  const actions = h('div', { class: 'row' },
    h('button', { class: 'btn primary', type: 'submit', id: 'save-story' }, icon('check'), t('ui.guardar')),
    h('a', { class: 'btn', href: '#forja' }, t('ui.cancelar')),
    h('span', { class: 'spacer' }),
    existing ? h('button', { class: 'btn danger', type: 'button', id: 'delete-story', onclick: async () => {
      const ok = await confirmDialog({ title: t('forja.borrarTitulo'), body: t('forja.borrarCuerpo', { titulo: existing.titulo || t('forja.sinTitulo') }), ok: t('forja.borrarOk'), danger: true });
      if (!ok) return;
      UI.state.historias = UI.state.historias.filter(x => x.id !== existing.id);
      saveState();
      toast(t('toast.borradaHistoria'), { ic: 'trash-2' });
      go('forja');
    } }, icon('trash-2'), t('ui.borrar')) : null);
  form.append(actions);

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!draft.titulo.trim()) { titulo.focus(); toast(t('forja.faltaTitulo'), { ic: 'info' }); return; }
    const clean = sanitizeStory({ ...draft, titulo: draft.titulo.trim(), editada: today() }, COMPETENCIA_IDS);
    const prev = existing ? scoreOf(existing).estado : null;
    const sc = scoreOf(clean);
    const i = UI.state.historias.findIndex(x => x.id === clean.id);
    if (i >= 0) UI.state.historias[i] = clean;
    else {
      if (UI.state.historias.length >= LIMITES.historias) { toast(t('forja.limite'), { ic: 'triangle-alert' }); return; }
      UI.state.historias.push(clean);
    }
    if (typeof onStorySaved === 'function') onStorySaved(clean, sc, prev, !existing);
    saveState();
    playSound(sc.estado === 'brillante' ? 'star' : 'ok');
    toast(t('toast.guardada', { estado: t('estado.' + sc.estado) }), { gold: sc.estado === 'brillante', ic: ESTADO_IC[sc.estado] });
    UI.lastSaved = clean.id;
    go('forja');
  });

  let liveTimer = null;
  function update() {
    ensayoNote.hidden = draft.tipo !== 'ensayo';
    const sc = scoreOf(draft);
    const an = sc.analisis;
    for (const b of [...BLOQUES, 'l']) {
      const n = wordCount(draft[b]);
      counters[b].textContent = b === 'l' ? t('forja.palabras', { n }) : t('forja.palabrasPct', { n, pct: an.reparto.pct[b] || 0 });
    }
    panel.replaceChildren(
      h('div', { class: 'row spread' }, h('h2', { id: 'score-h', text: t('forja.puntuacion') }), stateChip(sc.estado)),
      h('div', { class: 'row' }, h('span', { class: 'kpi' }, h('b', { id: 'score-total', text: String(sc.total) })), h('span', { class: 'faint', text: '/ 100' }), h('span', { class: 'spacer' }), h('span', { class: 'small muted' }, icon('timer', 'ic sm'), ' ', fmtDuration(an.duracion.seconds))),
      h('div', { class: 'bar' + (sc.estado === 'brillante' ? ' gold' : ''), role: 'img', 'aria-label': t('forja.barra', { n: sc.total }) }, (() => { const i = h('i'); i.style.width = sc.total + '%'; return i; })()),
      h('div', { class: 'stack' },
        h('p', { class: 'small', text: t('forja.reparto') }),
        h('div', { class: 'dist', role: 'img', 'aria-label': t('forja.repartoAria', an.reparto.pct) }, BLOQUES.map(b => { const i = h('i'); i.style.flexGrow = String(an.reparto.pct[b] || 0.0001); return i; })),
        h('div', { class: 'legend' }, BLOQUES.map(b => h('span', { text: `${b.toUpperCase()} ${an.reparto.pct[b] || 0}% · ${REPARTO[b].min}–${REPARTO[b].max}` })))),
      h('div', { class: 'stack' }, sc.criterios.map(c => h('div', { class: 'crit-row' },
        h('span', { text: t('crit.' + c.id) }), h('span', { class: 'mono tiny', text: `${c.puntos}/${c.max}` }),
        h('div', { class: 'bar' }, (() => { const i = h('i'); i.style.width = Math.round((c.puntos / c.max) * 100) + '%'; return i; })())))),
      h('h3', { text: t('forja.consejos') }),
      sc.consejos.length
        ? h('ul', { class: 'tips', id: 'tips' }, sc.consejos.slice(0, 8).map(c => h('li', { class: c.clave.startsWith('tip.sensible') ? 'crit' : '' }, icon(c.clave.startsWith('tip.sensible') ? 'triangle-alert' : 'lightbulb'), h('span', { text: tipText(c) }))))
        : h('p', { class: 'small muted', id: 'tips', text: t('forja.sinConsejos') }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = t('forja.live', { n: sc.total, estado: t('estado.' + sc.estado) }); }, 900);
  }
  update();
  view.append(h('div', { class: 'forge' }, h('div', { class: 'card' }, form), panel), live);
}

function tipText(c) {
  const p = { ...c.params };
  if (p.bloque) p.bloque = t('bloque.' + p.bloque);
  if (p.segundos !== undefined) p.tiempo = fmtDuration(p.segundos);
  return t(c.clave, p);
}
