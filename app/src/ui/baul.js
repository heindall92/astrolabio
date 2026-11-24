// Baúl (#baul): tu marca personal y tus notas («field notes») guardadas con formularios por tipo.
// Lo que guardes aquí lo usa el guion de «Preparar entrevista». Datos del usuario siempre con textContent.

const BAUL_IC = Object.fromEntries(BAUL_TIPOS.map(x => [x.id, x.icono]));
let baulFiltro = '';
let baulTexto = '';

function notaTitulo(n) {
  const tipo = BAUL_TIPOS.find(x => x.id === n.tipo);
  return (tipo && n.campos[tipo.campos[0][0]]) || t('baul.sinTitulo');
}
function notaResumen(n) {
  const tipo = BAUL_TIPOS.find(x => x.id === n.tipo);
  const k = tipo.campos.slice(1).find(([id, control]) => (control === 'texto' || control === 'linea') && n.campos[id]);
  return k ? n.campos[k[0]] : '';
}
function notaCard(n) {
  const tecs = tecnologiasNota(n);
  return h('a', { class: 'card link nota', href: '#baul/' + n.id, dataset: { tipo: n.tipo } },
    h('div', { class: 'row spread' }, h('span', { class: 'chip' }, icon(BAUL_IC[n.tipo], 'ic sm'), t('baul.tipo.' + n.tipo)),
      n.campos.nivel ? h('span', { class: 'tiny muted', text: t('baul.nivel.' + n.campos.nivel) }) : null),
    h('h3', { text: notaTitulo(n) }),
    notaResumen(n) ? h('p', { class: 'small muted clamp3', text: notaResumen(n) }) : null,
    tecs.length ? h('div', { class: 'meta' }, tecs.slice(0, 4).map(x => h('span', { class: 'chip', text: x }))) : null);
}

function marcaCard() {
  const m = { ...UI.state.marca };
  const campo = (k, ic) => h('div', { class: 'field' },
    h('label', { for: 'marca-' + k }, icon(ic, 'ic sm'), t('marca.' + k)),
    h('textarea', { id: 'marca-' + k, rows: 2, maxlength: LIMITES.marca, value: m[k], placeholder: t('marca.' + k + '.ph'), 'aria-describedby': 'marca-' + k + '-h', oninput: e => { m[k] = e.target.value; } }),
    h('p', { class: 'hint', id: 'marca-' + k + '-h', text: t('marca.' + k + '.d') }));
  const form = h('form', { class: 'card stack', id: 'marca-form', 'aria-labelledby': 'marca-h' },
    h('div', { class: 'row spread' }, h('h2', { id: 'marca-h' }, icon('gem'), ' ', t('marca.titulo')), h('span', { class: 'tiny muted', text: t('marca.usa') })),
    h('p', { class: 'small muted', text: t('marca.lede') }),
    h('div', { class: 'grid two' }, campo('ventaja', 'target'), campo('puntoVista', 'eye'), campo('frase', 'quote'), campo('hilo', 'route')),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit', id: 'marca-guardar' }, icon('check'), t('ui.guardar'))));
  form.addEventListener('submit', e => {
    e.preventDefault();
    UI.state.marca = sanitizeMarca(m);
    saveState();
    playSound('ok');
    toast(t('marca.guardada'));
  });
  return form;
}

VIEWS.baul = (view, arg) => {
  if (arg) return baulEditor(view, arg);
  const notas = UI.state.baul;
  viewHead(view, { eyebrow: t('nav.baul'), title: t('baul.titulo'), lede: t('baul.lede'),
    action: h('a', { class: 'btn', href: '#entrevista', id: 'baul-a-entrevista' }, icon('clipboard-list'), t('nav.entrevista')) });
  view.append(marcaCard());
  view.append(h('section', { class: 'stack', 'aria-labelledby': 'baul-nueva-h' },
    h('h2', { id: 'baul-nueva-h', text: t('baul.nueva') }),
    h('div', { class: 'tipo-grid', id: 'baul-tipos' }, BAUL_TIPOS.map(x => h('a', { class: 'card link tipo', href: '#baul/nueva/' + x.id, id: 'nueva-' + x.id },
      h('div', { class: 'row' }, icon(x.icono, 'ic lg'), h('h3', { text: t('baul.tipo.' + x.id) })), h('p', { class: 'tiny muted', text: t('baul.tipo.' + x.id + '.d') }))))));
  const lista = h('div', { class: 'story-list', id: 'baul-lista', 'aria-live': 'polite' });
  const contador = h('p', { class: 'small muted', id: 'baul-contador' });
  const pintar = () => {
    const q = fold(baulTexto);
    const xs = notas.filter(n => (!baulFiltro || n.tipo === baulFiltro) && (!q || fold(Object.values(n.campos).join(' ')).includes(q)))
      .sort((a, b) => (b.editada || '').localeCompare(a.editada || ''));
    lista.replaceChildren(...(xs.length ? xs.map(notaCard) : [h('p', { class: 'small muted', id: 'baul-nada', text: t('baul.nada') })]));
    contador.textContent = t('baul.contador', { n: xs.length, total: notas.length });
  };
  if (!notas.length) {
    view.append(h('div', { class: 'empty', id: 'baul-vacio' }, icon('archive', 'ic lg'), h('h2', { text: t('baul.vacioTitulo') }), h('p', { class: 'muted', text: t('baul.vacio') }),
      h('a', { class: 'btn primary', href: '#baul/nueva/herramienta' }, icon('plus'), t('baul.primera'))));
    return;
  }
  const filtros = h('div', { class: 'seg wide', role: 'group', 'aria-label': t('baul.filtrar'), id: 'baul-filtros' },
    ['', ...BAUL_TIPOS.map(x => x.id)].map(id => h('button', { type: 'button', 'aria-pressed': String(baulFiltro === id), dataset: { tipo: id },
      onclick: e => { baulFiltro = id; $$('#baul-filtros button').forEach(b => b.setAttribute('aria-pressed', String(b === e.currentTarget))); pintar(); } }, id ? t('baul.tipo.' + id) : t('baul.todas'))));
  view.append(h('section', { class: 'stack', 'aria-labelledby': 'baul-notas-h' },
    h('div', { class: 'row spread' }, h('h2', { id: 'baul-notas-h', text: t('baul.notas') }), contador),
    h('div', { class: 'row wrap' }, filtros, h('input', { type: 'search', id: 'baul-buscar', class: 'grow', value: baulTexto, placeholder: t('baul.buscar'), 'aria-label': t('baul.buscar'), oninput: e => { baulTexto = e.target.value; pintar(); } })),
    lista));
  pintar();
};

function baulEditor(view, arg) {
  const [a, b] = arg.split('/');
  const existente = a !== 'nueva' ? UI.state.baul.find(n => n.id === a) : null;
  const tipoId = existente ? existente.tipo : b;
  const tipo = BAUL_TIPOS.find(x => x.id === tipoId);
  if (!tipo || (a !== 'nueva' && !existente)) {
    viewHead(view, { eyebrow: t('nav.baul'), title: t('baul.noExiste') });
    view.append(h('a', { class: 'btn', href: '#baul' }, icon('arrow-left'), t('baul.volver')));
    return;
  }
  const draft = { ...(existente ? existente.campos : {}) };
  viewHead(view, { eyebrow: t('nav.baul') + ' · ' + t('baul.tipo.' + tipo.id), title: existente ? notaTitulo(existente) : t('baul.nuevaTipo', { tipo: t('baul.tipo.' + tipo.id).toLowerCase() }), lede: t('baul.tipo.' + tipo.id + '.d') });
  const control = ([id, ctl, max], i) => {
    const fid = 'nota-' + id;
    const lbl = t(`baul.campo.${tipo.id}.${id}`);
    const hint = t(`baul.ph.${tipo.id}.${id}`);
    let input;
    if (ctl === 'categoria' || ctl === 'nivel') {
      const opts = ctl === 'categoria' ? BAUL_CATEGORIAS.map(c => c[0]) : BAUL_NIVELES;
      input = h('select', { id: fid, onchange: e => { draft[id] = e.target.value; } },
        h('option', { value: '', text: t('baul.elige') }), opts.map(o => h('option', { value: o, selected: draft[id] === o ? true : null, text: t(`baul.${ctl}.${o}`) })));
    } else if (ctl === 'texto') {
      input = h('textarea', { id: fid, rows: max > 600 ? 5 : 3, maxlength: max, value: draft[id] || '', placeholder: hint, oninput: e => { draft[id] = e.target.value; } });
    } else {
      input = h('input', { type: 'text', id: fid, maxlength: max, value: draft[id] || '', placeholder: hint, required: i === 0 ? true : null, 'aria-required': i === 0 ? 'true' : null, oninput: e => { draft[id] = e.target.value; } });
    }
    return h('div', { class: 'field' + (ctl === 'texto' ? ' full' : '') }, h('label', { for: fid }, lbl, i === 0 ? h('span', { class: 'tiny muted', text: ' · ' + t('baul.obligatorio') }) : null), input,
      ctl === 'claves' ? h('p', { class: 'hint', text: t('baul.clavesHint') }) : null);
  };
  const form = h('form', { class: 'card stack', id: 'nota-form', novalidate: true },
    h('div', { class: 'form-grid' }, tipo.campos.map(control)),
    h('p', { class: 'small muted', id: 'nota-uso' }, icon('info', 'ic sm'), ' ', t('baul.uso.' + tipo.id)),
    h('div', { class: 'row' },
      h('button', { class: 'btn primary', type: 'submit', id: 'nota-guardar' }, icon('check'), t('ui.guardar')),
      h('a', { class: 'btn ghost', href: '#baul' }, t('ui.cancelar')),
      h('span', { class: 'spacer' }),
      existente ? h('button', { class: 'btn danger', type: 'button', id: 'nota-borrar', onclick: async () => {
        if (!await confirmDialog({ title: t('baul.borrarTitulo'), body: t('baul.borrarCuerpo', { t: notaTitulo(existente) }), ok: t('ui.borrar'), danger: true })) return;
        UI.state.baul = UI.state.baul.filter(n => n.id !== existente.id);
        saveState();
        toast(t('baul.borrada'), { ic: 'trash-2' });
        go('baul');
      } }, icon('trash-2'), t('ui.borrar')) : null));
  form.addEventListener('submit', e => {
    e.preventDefault();
    const titulo = tipo.campos[0][0];
    if (!String(draft[titulo] || '').trim()) {
      const el = $('#nota-' + titulo);
      el.setAttribute('aria-invalid', 'true');
      el.focus();
      toast(t('baul.faltaTitulo', { campo: t(`baul.campo.${tipo.id}.${titulo}`) }), { ic: 'triangle-alert' });
      return;
    }
    if (!existente && UI.state.baul.length >= LIMITES.notas) { toast(t('baul.lleno', { n: LIMITES.notas }), { ic: 'triangle-alert' }); return; }
    const nota = sanitizeNota({ id: existente ? existente.id : uid().replace('h_', 'n_'), tipo: tipo.id, campos: draft, creada: existente ? existente.creada : today(), editada: today() });
    UI.state.baul = existente ? UI.state.baul.map(n => (n.id === nota.id ? nota : n)) : [...UI.state.baul, nota];
    saveState();
    playSound('ok');
    toast(t('baul.guardada'));
    go('baul');
  });
  view.append(form);
}
