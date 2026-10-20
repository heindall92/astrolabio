// Asistente de perfil en tres pasos (rol → nivel → empresa e idioma) y vista Perfil.

const wizardDraft = { paso: 1, rol: '', nivel: '', empresa: 'consultora', idioma: 'es', nombre: '' };

function radioChoices(name, items, current, onChange) {
  return h('div', { class: 'choices', role: 'radiogroup', 'aria-labelledby': name + '-lg' },
    items.map(it => h('label', { class: 'choice' },
      h('input', { type: 'radio', name, value: it.id, checked: it.id === current, onchange: () => onChange(it.id) }),
      it.ic ? icon(it.ic) : null,
      h('div', null, h('b', { text: it.label }), it.des ? h('span', { text: it.des }) : null))));
}

VIEWS.wizard = (view) => {
  const d = wizardDraft;
  if (!d.rol && UI.state.perfil) Object.assign(d, UI.state.perfil);
  view.classList.add('wizard');
  view.append(h('div', { class: 'row' }, markSvg('hero-mark'), h('ol', { class: 'steps', 'aria-label': t('wizard.pasos') },
    [1, 2, 3].map(n => h('li', { 'aria-current': n === d.paso ? 'step' : null, class: n < d.paso ? 'done' : '' }, t('wizard.paso', { n, total: 3 }))))));
  viewHead(view, { eyebrow: t('wizard.eyebrow'), title: t('wizard.titulo' + d.paso), lede: t('wizard.lede' + d.paso) });
  const body = h('div', { class: 'stack' });
  const next = h('button', { class: 'btn primary', type: 'button', id: 'wiz-next' }, d.paso < 3 ? t('ui.siguiente') : t('wizard.empezar'), icon('arrow-right'));
  const sync = () => { next.disabled = (d.paso === 1 && !d.rol) || (d.paso === 2 && !d.nivel); };
  if (d.paso === 1) {
    body.append(h('p', { class: 'sr-only', id: 'rol-lg', text: t('perfil.rol') }), radioChoices('rol', ROLES.map(r => ({ id: r, label: t('rol.' + r), des: t('rol.' + r + '.des'), ic: roleIcon(r) })), d.rol, v => { d.rol = v; sync(); }));
    body.append(h('p', { class: 'small muted', text: t('wizard.masRutas') }));
  } else if (d.paso === 2) {
    body.append(h('p', { class: 'sr-only', id: 'nivel-lg', text: t('perfil.nivel') }), radioChoices('nivel', NIVELES.map(n => ({ id: n, label: t('nivel.' + n), des: t('nivel.' + n + '.des'), ic: 'briefcase-business' })), d.nivel, v => { d.nivel = v; sync(); }));
    body.append(h('div', { class: 'callout' }, icon('heart-handshake'), h('p', { text: t('wizard.noEstasSolo') })));
  } else {
    body.append(h('p', { class: 'eyebrow', id: 'empresa-lg', text: t('perfil.empresa') }), radioChoices('empresa', EMPRESAS.map(e => ({ id: e, label: t('empresa.' + e), des: t('empresa.' + e + '.des') })), d.empresa, v => { d.empresa = v; }));
    body.append(h('p', { class: 'eyebrow', id: 'idioma-lg', text: t('perfil.idioma') }), radioChoices('idioma', IDIOMAS.map(i => ({ id: i, label: t('idioma.' + i), ic: 'languages' })), d.idioma, v => { d.idioma = v; }));
    body.append(h('div', { class: 'field' }, h('label', { for: 'wiz-nombre', text: t('perfil.nombre') }), h('input', { type: 'text', id: 'wiz-nombre', maxlength: LIMITES.nombre, autocomplete: 'given-name', value: d.nombre, oninput: e => { d.nombre = e.target.value; } }), h('p', { class: 'hint', text: t('perfil.nombreHint') })));
  }
  const back = d.paso > 1 ? h('button', { class: 'btn', type: 'button', onclick: () => { d.paso--; render(); } }, icon('chevron-left'), t('ui.atras')) : null;
  next.addEventListener('click', () => {
    if (next.disabled) return;
    if (d.paso < 3) { d.paso++; render(); return; }
    UI.state.perfil = sanitizePerfil({ nombre: d.nombre.trim(), rol: d.rol, nivel: d.nivel, empresa: d.empresa, idioma: d.idioma });
    saveState();
    d.paso = 1;
    playSound('star');
    toast(t('toast.perfilListo'), { ic: 'sparkles' });
    go('inicio');
  });
  sync();
  view.append(body, h('div', { class: 'row spread' }, back || h('span'), next));
};

VIEWS.perfil = (view) => {
  const p = UI.state.perfil;
  viewHead(view, { eyebrow: t('nav.perfil'), title: t('perfil.titulo'), lede: t('perfil.lede') });
  const draft = { ...p };
  const sel = (id, list, prefix) => h('div', { class: 'field' }, h('label', { for: 'p-' + id, text: t('perfil.' + id) }),
    h('select', { id: 'p-' + id, onchange: e => { draft[id] = e.target.value; } }, list.map(v => { const o = h('option', { value: v, text: t(prefix + '.' + v) }); if (v === p[id]) o.selected = true; return o; })));
  const form = h('form', { class: 'card stack', onsubmit: e => {
    e.preventDefault();
    UI.state.perfil = sanitizePerfil(draft);
    saveState();
    toast(t('toast.perfilGuardado'));
    render();
  } },
    h('h2', { text: t('perfil.datos') }),
    h('div', { class: 'grid two' },
      h('div', { class: 'field' }, h('label', { for: 'p-nombre', text: t('perfil.nombre') }), h('input', { type: 'text', id: 'p-nombre', maxlength: LIMITES.nombre, value: p.nombre, oninput: e => { draft.nombre = e.target.value; } })),
      sel('rol', ROLES, 'rol'), sel('nivel', NIVELES, 'nivel'), sel('empresa', EMPRESAS, 'empresa'), sel('idioma', IDIOMAS, 'idioma')),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit' }, icon('check'), t('ui.guardar'))));

  const sens = UI.state.ajustes.sensibles;
  const sensInput = h('textarea', { id: 'p-sensibles', rows: 3, 'aria-describedby': 'p-sens-hint', value: sens.join('\n') });
  const sensCard = h('div', { class: 'card stack' },
    h('h2', { text: t('perfil.sensiblesTitulo') }),
    h('div', { class: 'field' }, h('label', { for: 'p-sensibles', text: t('perfil.sensibles') }), sensInput, h('p', { class: 'hint', id: 'p-sens-hint', text: t('perfil.sensiblesHint') })),
    h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', onclick: () => {
      UI.state.ajustes.sensibles = sensInput.value.split(/\n|,/).map(s => s.trim()).filter(Boolean).slice(0, LIMITES.sensibles).map(s => s.slice(0, LIMITES.sensible));
      saveState();
      toast(t('toast.sensiblesGuardados'));
    } }, icon('eye-off'), t('ui.guardar'))));

  const dataCard = h('div', { class: 'card stack' },
    h('h2', { text: t('perfil.datosTitulo') }),
    h('p', { class: 'muted', text: t('perfil.datosLede') }),
    h('div', { class: 'row' },
      h('button', { class: 'btn', type: 'button', onclick: exportData }, icon('download'), t('cuenta.exportar')),
      h('button', { class: 'btn', type: 'button', onclick: () => $('#import-file').click() }, icon('upload'), t('cuenta.importar')),
      h('button', { class: 'btn danger', type: 'button', id: 'wipe-btn', onclick: wipeAll }, icon('trash-2'), t('cuenta.borrar'))));
  const redo = h('button', { class: 'btn ghost', type: 'button', onclick: () => { Object.assign(wizardDraft, UI.state.perfil, { paso: 1 }); UI.state.perfil = null; render(); } }, icon('rotate-ccw'), t('perfil.repetirAsistente'));
  view.append(stagger(h('div', { class: 'stack' }, form, sensCard, dataCard, h('div', null, redo))));
};

VIEWS.privacidad = (view) => {
  viewHead(view, { eyebrow: t('nav.privacidad'), title: t('priv.titulo'), lede: t('priv.lede') });
  const items = ['local', 'red', 'cuentas', 'csp', 'voz', 'borrar', 'export'];
  view.append(stagger(h('div', { class: 'grid two' }, items.map(k => h('div', { class: 'card' }, h('div', { class: 'row' }, icon({ local: 'lock', red: 'shield-check', cuentas: 'user-round', csp: 'shield-half', voz: 'mic', borrar: 'trash-2', export: 'download' }[k]), h('h2', { text: t('priv.' + k + '.t') })), h('p', { class: 'muted', text: t('priv.' + k + '.d') }))))));
  if (!UI.state.perfil) view.append(h('div', null, h('a', { class: 'btn primary', href: '#inicio' }, t('wizard.empezar'), icon('arrow-right'))));
};
