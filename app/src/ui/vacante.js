// Del filtro a la entrevista: lector de ofertas (#vacante), presentación «Háblame de ti» (#presentacion)
// y traductor de experiencia de otros sectores (#traductor). Todo en local.

// La oferta y el CV viven en memoria mientras dura la sesión; solo se guardan si se pide.
const vacDraft = { texto: null, cv: null, recordar: null, resultado: null };
function vacLoad() {
  if (vacDraft.texto !== null) return;
  const v = UI.state.vacante;
  vacDraft.texto = v ? v.texto : '';
  vacDraft.cv = v ? v.cv : '';
  vacDraft.recordar = !!v;
  vacDraft.resultado = v && v.texto.trim() ? analyzeOffer(v.texto) : null;
}
function vacPersist() {
  UI.state.vacante = vacDraft.recordar && vacDraft.texto.trim() ? { texto: vacDraft.texto.slice(0, LIMITES.oferta), cv: vacDraft.cv.slice(0, LIMITES.cv), fecha: today() } : null;
  saveState();
}

async function copyText(text, okMsg) {
  try {
    await navigator.clipboard.writeText(text);
    toast(okMsg, { ic: 'check' });
  } catch {
    toast(t('vac.noCopia'), { ic: 'triangle-alert' });
  }
}

function coverageChip(estado) {
  if (estado === 'cubierta') return h('span', { class: 'chip st-lista' }, icon('check', 'ic sm'), t('vac.cov.cubierta'));
  if (estado === 'media') return h('span', { class: 'chip st-borrador' }, icon('pencil', 'ic sm'), t('vac.cov.media'));
  return h('span', { class: 'chip ensayo' }, icon('circle-dashed', 'ic sm'), t('vac.cov.sin'));
}

VIEWS.vacante = view => {
  vacLoad();
  viewHead(view, { eyebrow: t('nav.vacante'), title: t('vac.titulo'), lede: t('vac.lede') });
  const ta = h('textarea', { id: 'vac-texto', rows: 9, maxlength: LIMITES.oferta, value: vacDraft.texto, placeholder: t('vac.ph'), 'aria-describedby': 'vac-texto-hint',
    oninput: e => { vacDraft.texto = e.target.value; } });
  const recordar = h('input', { type: 'checkbox', id: 'vac-recordar', checked: vacDraft.recordar,
    onchange: e => { vacDraft.recordar = e.target.checked; vacPersist(); toast(t(e.target.checked ? 'vac.recordada' : 'vac.olvidada'), { ic: e.target.checked ? 'lock' : 'trash-2' }); } });
  const res = h('div', { class: 'stack', id: 'vac-res' });
  const run = () => {
    if (!vacDraft.texto.trim()) { ta.focus(); toast(t('vac.faltaTexto'), { ic: 'info' }); return; }
    vacDraft.resultado = analyzeOffer(vacDraft.texto);
    if (vacDraft.recordar) vacPersist();
    drawResults(res);
    const hd = $('#vac-res-h');
    if (hd) hd.focus();
  };
  view.append(h('div', { class: 'card stack' },
    h('div', { class: 'field' }, h('label', { for: 'vac-texto', text: t('vac.label') }), h('p', { class: 'hint', id: 'vac-texto-hint', text: t('vac.hint') }), ta),
    h('div', { class: 'stack' }, h('label', { class: 'check' }, recordar, icon('lock', 'ic sm'), t('vac.recordar')), h('p', { class: 'tiny muted', text: t('vac.recordarHint') })),
    h('div', { class: 'row wrap' },
      h('button', { class: 'btn primary', type: 'button', id: 'vac-analizar', onclick: run }, icon('scan-search'), t('vac.analizar')),
      h('button', { class: 'btn', type: 'button', id: 'vac-ejemplo', onclick: () => { vacDraft.texto = t('vac.ejemploTexto'); ta.value = vacDraft.texto; run(); } }, icon('file-text'), t('vac.ejemplo')),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn', type: 'button', id: 'vac-limpiar', onclick: () => {
        vacDraft.texto = ''; vacDraft.cv = ''; vacDraft.resultado = null; ta.value = '';
        if (UI.state.vacante) { UI.state.vacante = null; saveState(); }
        res.replaceChildren(); ta.focus();
      } }, icon('eraser'), t('vac.limpiar')))),
    res);
  if (vacDraft.resultado) drawResults(res);
};

function drawResults(res) {
  const o = vacDraft.resultado;
  const p = UI.state.perfil;
  const scored = UI.state.historias.map(s => { const sc = scoreOf(s); return { historia: s, total: sc.total, estado: sc.estado }; });
  const cov = offerCoverage(o, scored);
  const cubiertas = cov.filter(c => c.estado === 'cubierta').length;
  res.replaceChildren(h('h2', { id: 'vac-res-h', tabindex: '-1', text: t('vac.resultado') }));
  if (!o.competencias.length && !o.tecnologias.length) {
    res.append(h('div', { class: 'callout warn', id: 'vac-nada' }, icon('info'), h('p', { text: t('vac.nada') })));
    return;
  }
  const kpi = (n, label, ic, id) => h('div', { class: 'card kpi', id }, h('div', { class: 'row' }, icon(ic), h('span', { text: label })), h('b', { text: n }));
  res.append(stagger(h('div', { class: 'grid', id: 'vac-kpis' },
    kpi(fmtNum(o.competencias.length), t('vac.kpi.competencias'), 'target', 'vac-k-comp'),
    kpi(`${cubiertas}/${o.competencias.length}`, t('vac.kpi.cubiertas'), 'check', 'vac-k-cub'),
    kpi(fmtNum(o.tecnologias.length), t('vac.kpi.tecnologias'), 'cpu', 'vac-k-tec'),
    kpi(o.anos === null ? '—' : t('vac.anos', { n: o.anos }), t('vac.kpi.experiencia'), 'calendar', 'vac-k-anos'))));
  const extra = [
    ...o.idiomas.map(i => t('vac.idioma.' + i.id) + (i.nivel ? ' · ' + i.nivel : '')),
    ...o.modalidad.map(m => t('vac.modalidad.' + m)),
  ];
  if (extra.length) res.append(h('div', { class: 'row wrap', id: 'vac-extra' }, extra.map(x => h('span', { class: 'chip', text: x }))));
  if (juniorMismatch(o, p.nivel)) {
    res.append(h('div', { class: 'callout warn', id: 'vac-junior' }, icon('triangle-alert'), h('p', { text: t('vac.junior', { n: o.anos }) })));
  }

  // Competencias que pide y tus historias.
  res.append(h('section', { class: 'card stack', 'aria-labelledby': 'vac-comp-h' },
    h('h2', { id: 'vac-comp-h', text: t('vac.compTitulo') }),
    h('p', { class: 'small muted', text: t('vac.compLede') }),
    h('ul', { class: 'qlist', id: 'vac-comp' }, cov.map(c => {
      const best = c.historias[0] ? UI.state.historias.find(x => x.id === c.historias[0]) : null;
      return h('li', { dataset: { comp: c.id, cov: c.estado } },
        h('div', { class: 'stack' },
          h('div', { class: 'row wrap' }, h('b', { text: compName(c.id) }), coverageChip(c.estado)),
          h('p', { class: 'tiny muted' }, t('vac.dice') + ' ', c.terminos.map((x, i) => [i ? ', ' : '', '«' + x + '»']))),
        c.estado === 'cubierta' && best
          ? h('a', { class: 'btn sm', href: '#forja/' + best.id, 'aria-label': t('vac.verHistoriaAria', { c: compName(c.id) }) }, icon('star', 'ic sm'), t('vac.verHistoria'))
          : h('button', { class: 'btn sm', type: 'button', 'aria-label': t('vac.escribirAria', { c: compName(c.id) }), onclick: () => { renderEditor.prefill = { competencias: [c.id] }; go('forja/nueva'); } }, icon('plus', 'ic sm'), t('vac.escribir')));
    }))));

  if (o.tecnologias.length) {
    res.append(h('section', { class: 'card stack', 'aria-labelledby': 'vac-tec-h' },
      h('h2', { id: 'vac-tec-h', text: t('vac.tecTitulo') }),
      h('p', { class: 'small muted', text: t('vac.tecLede') }),
      h('div', { class: 'row wrap', id: 'vac-tec' }, o.tecnologias.map(x => h('span', { class: 'chip', text: x })))));
  }

  // Preguntas probables.
  const qs = likelyQuestions(o, [...ROLE_CONTENT[p.rol].preguntas, ...COMUNES]);
  if (qs.length) {
    res.append(h('section', { class: 'card stack', 'aria-labelledby': 'vac-q-h' },
      h('h2', { id: 'vac-q-h', text: t('vac.qTitulo') }),
      h('p', { class: 'small muted', text: t('vac.qLede') }),
      h('ol', { class: 'qlist', id: 'vac-preguntas' }, qs.map(q => h('li', null,
        h('div', { class: 'stack' }, h('p', { text: L(q) }), h('p', { class: 'tiny muted', text: q.comp.map(compName).join(' · ') })),
        h('div', { class: 'row wrap' },
          h('a', { class: 'btn sm', href: '#arena/pregunta/' + q.id, 'aria-label': t('vac.arenaAria', { q: L(q) }) }, icon('swords', 'ic sm'), t('vac.arena')),
          h('button', { class: 'btn sm', type: 'button', 'aria-label': t('forja.responderAria', { q: L(q) }), onclick: () => { renderEditor.prefill = { competencias: q.comp.slice(0, LIMITES.competenciasPorHistoria), _pregunta: q.id }; go('forja/nueva'); } }, icon('plus', 'ic sm'), t('forja.responder'))))))));
  }

  // CV: palabras clave y viñetas.
  const cvTa = h('textarea', { id: 'vac-cv', rows: 6, maxlength: LIMITES.cv, value: vacDraft.cv, placeholder: t('vac.cvPh'), oninput: e => { vacDraft.cv = e.target.value; } });
  const gapBox = h('div', { class: 'stack', id: 'vac-gap' });
  const drawGap = () => {
    if (!vacDraft.cv.trim()) { gapBox.replaceChildren(); return; }
    const g = keywordGap(o, vacDraft.cv);
    gapBox.replaceChildren(
      h('p', { class: 'small', id: 'vac-gap-sum', text: t('vac.gapResumen', { si: g.presentes.length, no: g.faltan.length }) }),
      g.faltan.length ? h('div', { class: 'stack' }, h('h3', { text: t('vac.faltan') }), h('div', { class: 'row wrap', id: 'vac-faltan' }, g.faltan.map(x => h('span', { class: 'chip ensayo', text: x })))) : null,
      g.presentes.length ? h('div', { class: 'stack' }, h('h3', { text: t('vac.presentes') }), h('div', { class: 'row wrap', id: 'vac-presentes' }, g.presentes.map(x => h('span', { class: 'chip st-lista' }, icon('check', 'ic sm'), x)))) : null);
  };
  const compIds = o.competencias.map(c => c.id);
  const stories = scored.filter(x => x.historia.competencias.some(c => compIds.includes(c)) && (x.historia.a || '').trim()).sort((a, b) => b.total - a.total).slice(0, 6);
  const lang = s => detectLanguage(s) || p.idioma || 'es';
  res.append(h('section', { class: 'card stack', 'aria-labelledby': 'vac-cv-h' },
    h('h2', { id: 'vac-cv-h', text: t('vac.cvTitulo') }),
    h('div', { class: 'callout', id: 'vac-aviso-ats' }, icon('info'), h('p', { text: t('vac.avisoAts') })),
    h('div', { class: 'field' }, h('label', { for: 'vac-cv', text: t('vac.cvLabel') }), cvTa),
    h('div', { class: 'row' }, h('button', { class: 'btn', type: 'button', id: 'vac-comparar', onclick: () => { if (vacDraft.recordar) vacPersist(); drawGap(); } }, icon('list-checks'), t('vac.comparar'))),
    gapBox,
    h('h3', { text: t('vac.vinetasTitulo') }),
    stories.length
      ? h('div', { class: 'stack', id: 'vac-vinetas' }, stories.map(x => {
        const bs = bulletsFromStory(x.historia, lang(x.historia));
        return h('div', { class: 'cv-card' },
          h('div', { class: 'row spread' }, h('b', { text: x.historia.titulo || t('forja.sinTitulo') }),
            h('button', { class: 'btn sm', type: 'button', 'aria-label': t('vac.copiarAria', { t: x.historia.titulo || t('forja.sinTitulo') }), onclick: () => copyText(bs.map(b => '• ' + b.texto).join('\n'), t('vac.copiadas')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar'))),
          h('ul', { class: 'bullets' }, bs.map(b => h('li', { class: b.tipo, text: b.texto }))));
      }))
      : h('p', { class: 'small muted', id: 'vac-vinetas', text: t('vac.sinVinetas') })));
  drawGap();
}

// ---------- «Háblame de ti» ----------
VIEWS.presentacion = view => {
  const st = UI.state.presentacion;
  const draft = { texto: st.texto, puesto: st.puesto };
  viewHead(view, { eyebrow: t('nav.presentacion'), title: t('pres.titulo'), lede: t('pres.lede') });
  const panel = h('aside', { class: 'card panel stack', 'aria-labelledby': 'pres-score-h' });
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite', id: 'pres-live' });
  const idioma = () => detectLanguage({ s: draft.texto }) || (UI.state.perfil && UI.state.perfil.idioma) || 'es';
  const puesto = h('input', { type: 'text', id: 'pres-puesto', maxlength: LIMITES.puesto, value: draft.puesto, placeholder: t('pres.puestoPh'), oninput: e => { draft.puesto = e.target.value; update(); } });
  const ta = h('textarea', { id: 'pres-texto', rows: 11, maxlength: LIMITES.presentacion, value: draft.texto, placeholder: t('pres.ph'), 'aria-describedby': 'pres-partes', oninput: e => { draft.texto = e.target.value; update(); } });
  const form = h('form', { class: 'stack', id: 'pres-form', 'aria-label': t('pres.titulo') },
    h('ol', { class: 'stack small', id: 'pres-partes' }, ['presente', 'pasado', 'futuro'].map(k => h('li', null, h('b', { text: t('pres.parte.' + k) }), ' · ', h('span', { class: 'muted', text: t('pres.parte.' + k + '.d') })))),
    h('div', { class: 'field' }, h('label', { for: 'pres-puesto', text: t('pres.puesto') }), puesto),
    h('div', { class: 'field' }, h('label', { for: 'pres-texto', text: t('pres.label') }), ta),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit', id: 'pres-guardar' }, icon('check'), t('ui.guardar'))));
  form.addEventListener('submit', e => {
    e.preventDefault();
    UI.state.presentacion = { texto: draft.texto.slice(0, LIMITES.presentacion), puesto: draft.puesto.trim().slice(0, LIMITES.puesto) };
    saveState();
    playSound('ok');
    toast(t('pres.guardada'), { ic: 'check' });
  });
  let liveTimer = null;
  function update() {
    const r = analyzePitch(draft.texto, { idioma: idioma(), puesto: draft.puesto });
    const tips = r.criterios.filter(c => !c.ok).map(c => c.id === 'duracion'
      ? t(r.estado === 'larga' ? 'pres.tip.larga' : 'pres.tip.corta', { n: r.palabras, min: r.minPalabras, max: r.maxPalabras })
      : t('pres.tip.' + c.id));
    if (r.tope) tips.unshift(t('pres.tip.tope', { n: PRESENTACION.topeCorta }));
    panel.replaceChildren(
      h('h2', { id: 'pres-score-h', text: t('pres.puntuacion') }),
      h('div', { class: 'row' }, h('span', { class: 'kpi' }, h('b', { id: 'pres-total', text: String(r.total) })), h('span', { class: 'faint', text: '/ 100' }), h('span', { class: 'spacer' }),
        h('span', { class: 'small muted', id: 'pres-tiempo' }, icon('timer', 'ic sm'), ' ', fmtDuration(r.segundos), ' · ', t('pres.objetivo'))),
      h('div', { class: 'bar' + (r.total === 100 ? ' gold' : ''), role: 'img', 'aria-label': t('forja.barra', { n: r.total }) }, (() => { const i = h('i'); i.style.width = r.total + '%'; return i; })()),
      h('div', { class: 'stack' }, r.criterios.map(c => h('div', { class: 'crit-row' },
        h('span', { text: t('pres.crit.' + c.id) }), h('span', { class: 'mono tiny', text: `${c.puntos}/${c.max}` }),
        h('div', { class: 'bar' }, (() => { const i = h('i'); i.style.width = Math.round((c.puntos / c.max) * 100) + '%'; return i; })())))),
      h('h3', { text: t('forja.consejos') }),
      tips.length ? h('ul', { class: 'tips', id: 'pres-tips' }, tips.map(x => h('li', null, icon('lightbulb'), h('span', { text: x })))) : h('p', { class: 'small muted', id: 'pres-tips', text: t('pres.perfecta') }));
    clearTimeout(liveTimer);
    liveTimer = setTimeout(() => { live.textContent = t('pres.live', { n: r.total }); }, 900);
  }
  update();
  view.append(h('div', { class: 'forge' }, h('div', { class: 'card' }, form), panel), live);

  // Preguntas difíciles y preguntas para el entrevistador.
  const dificiles = COMUNES.filter(q => q.trampa && !q.presentacion);
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'dif-h', id: 'dificiles' },
    h('h2', { id: 'dif-h', text: t('pres.dificiles') }),
    h('p', { class: 'small muted', text: t('pres.dificilesLede') }),
    h('ul', { class: 'qlist' }, dificiles.map(q => h('li', null, h('div', { class: 'stack' },
      h('p', { text: L(q) }),
      q.etapa ? h('p', { class: 'tiny' }, h('span', { class: 'chip', text: t('pres.etapa') })) : null,
      h('details', null, h('summary', { text: t('forja.guia') }), h('p', { class: 'small', text: L(q.guia) }))))))));
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'tu-h', id: 'preguntas-tu' },
    h('div', { class: 'row spread' }, h('h2', { id: 'tu-h', text: t('pres.tuPreguntas') }),
      h('button', { class: 'btn sm', type: 'button', id: 'tu-copiar', onclick: () => copyText(PREGUNTAS_ENTREVISTADOR.map(q => '• ' + L(q)).join('\n'), t('vac.copiadas')) }, icon('clipboard-copy', 'ic sm'), t('pres.copiarTodas'))),
    h('p', { class: 'small muted', text: t('pres.tuLede') }),
    h('ul', { class: 'qlist' }, PREGUNTAS_ENTREVISTADOR.map(q => h('li', null, h('div', { class: 'stack' }, h('p', { text: L(q) }), h('p', { class: 'tiny muted', text: L(q.por) })))))));
  view.append(h('a', { class: 'card link', href: '#traductor', id: 'ir-traductor' }, h('div', { class: 'row' }, icon('arrow-left-right', 'ic lg'), h('h2', { text: t('trad.titulo') })), h('p', { class: 'muted', text: t('trad.enlace') })));
};

// ---------- Traductor de experiencia ----------
let tradSector = null;
VIEWS.traductor = view => {
  if (!TRADUCTOR.some(s => s.id === tradSector)) tradSector = TRADUCTOR[0].id;
  viewHead(view, { eyebrow: t('nav.traductor'), title: t('trad.titulo'), lede: t('trad.lede') });
  const list = h('div', { class: 'stack', id: 'trad-lista' });
  const draw = () => {
    const s = TRADUCTOR.find(x => x.id === tradSector);
    list.replaceChildren(h('h2', { id: 'trad-h', text: t('trad.desde', { sector: L(s.nombre) }) }),
      stagger(h('div', { class: 'grid two' }, s.items.map(it => h('div', { class: 'card stack' },
        h('div', { class: 'row wrap' }, h('span', { class: 'chip st-lista', text: compName(it.comp) })),
        h('p', null, h('b', { text: L({ es: it.es.sit, en: it.en.sit }) })),
        h('p', { class: 'small muted', text: L({ es: it.es.como, en: it.en.como }) }),
        h('div', null, h('button', { class: 'btn sm', type: 'button', 'aria-label': t('trad.escribirAria', { s: L({ es: it.es.sit, en: it.en.sit }) }), onclick: () => {
          renderEditor.prefill = { competencias: [it.comp], s: L({ es: it.es.sit, en: it.en.sit }) };
          go('forja/nueva');
        } }, icon('plus', 'ic sm'), t('trad.escribir'))))))));
  };
  view.append(h('fieldset', { class: 'card' }, h('legend', { text: t('trad.elige') }),
    h('div', { class: 'choices', id: 'trad-sectores' }, TRADUCTOR.map(s => h('label', { class: 'choice' },
      h('input', { type: 'radio', name: 'sector', value: s.id, checked: s.id === tradSector, onchange: () => { tradSector = s.id; draw(); } }),
      icon(s.icono), h('div', null, h('b', { text: L(s.nombre) }), h('span', { text: t('trad.n', { n: s.items.length }) })))))), list);
  draw();
};
