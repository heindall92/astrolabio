// Arena: duelos contra recruiters que repreguntan según lo que le falta a tu historia.

const ARENA_SHORTCUTS = [
  ['Ctrl Enter', 'atajo.arena.enviar'],
  ['Alt R', 'atajo.arena.aleatoria'],
  ['Alt N', 'atajo.arena.otro'],
];
const MODO_IC = { escrito: 'pen-line', voz: 'mic', contrarreloj: 'timer', sorpresa: 'shuffle' };
const ARENA = { recruiter: 'rita', modo: 'escrito', pregunta: null, historia: '', duel: null, story: null, score: null, timer: null, marcas: {} };

function arenaQuestions() {
  const rol = UI.state.perfil.rol;
  return [...ROLE_CONTENT[rol].preguntas, ...COMUNES.filter(q => !q.guia)];
}
function arenaRecruiter(id) { return RECRUITERS.find(r => r.id === id) || RECRUITERS[0]; }
function arenaQuestion(id) { return arenaQuestions().find(q => q.id === id) || allQuestions().find(q => q.id === id) || COMUNES.find(q => q.id === id && !q.guia) || null; }
function stopTimer() { if (ARENA.timer) { clearInterval(ARENA.timer.id); ARENA.timer = null; } }

VIEWS.arena = (view, arg) => {
  stopTimer();
  if (arg && arg.startsWith('pregunta/')) {
    const q = arenaQuestion(arg.slice('pregunta/'.length));
    if (q) { ARENA.pregunta = q.id; ARENA.duel = null; }
  }
  if (!ARENA.pregunta || !arenaQuestion(ARENA.pregunta)) ARENA.pregunta = arenaQuestions()[0].id;
  if (ARENA.duel) { renderDuel(view); return; }
  renderLobby(view);
};

function renderLobby(view) {
  viewHead(view, { eyebrow: t('nav.arena'), title: t('arena.titulo'), lede: t('arena.lede') });
  const form = h('form', { class: 'stack', id: 'arena-form', 'aria-label': t('arena.preparar') });

  const jefeOk = bossUnlocked(UI.state.duelos, UI.state.perfil.rol);
  if (!jefeOk && arenaRecruiter(ARENA.recruiter).jefe) ARENA.recruiter = 'rita';
  form.append(h('fieldset', null, h('legend', { text: t('arena.elige.recruiter') }),
    stagger(h('div', { class: 'rec-grid' }, RECRUITERS.map(r => h('label', { class: 'rec-card' + (r.jefe ? ' boss' : '') + (r.jefe && !jefeOk ? ' locked' : '') },
      h('input', { type: 'radio', name: 'recruiter', value: r.id, checked: ARENA.recruiter === r.id, disabled: r.jefe && !jefeOk, 'aria-describedby': r.jefe && !jefeOk ? 'jefe-lock' : null, onchange: () => { ARENA.recruiter = r.id; } }),
      h('span', { class: 'rec-av', 'aria-hidden': 'true' }, icon(r.icono)),
      h('span', { class: 'stack tight' },
        h('b', { text: L(r.nombre) }),
        h('span', { class: 'chip' + (r.jefe ? ' gold' : ''), text: t('dificultad.' + r.dificultad) }),
        h('span', { class: 'small muted', text: L(r.estilo) }),
        r.jefe && !jefeOk ? h('span', { class: 'small', id: 'jefe-lock' }, icon('lock', 'ic sm'), ' ', t('arena.jefeBloqueado', { n: JEFE_DESBLOQUEO })) : null)))))));

  form.append(h('fieldset', null, h('legend', { text: t('arena.elige.modo') }),
    h('div', { class: 'checks' }, DUELO.modos.map(m => h('label', { class: 'check' },
      h('input', { type: 'radio', name: 'modo', value: m, checked: ARENA.modo === m, 'aria-describedby': 'modo-d-' + m, onchange: () => { ARENA.modo = m; } }),
      icon(MODO_IC[m], 'ic sm'), t('arena.modo.' + m)))),
    h('ul', { class: 'small muted stack tight' }, DUELO.modos.map(m => h('li', { id: 'modo-d-' + m }, h('b', { text: t('arena.modo.' + m) + ': ' }), t('arena.modo.' + m + '.d', { s: DUELO.contrarreloj }))))));

  const qs = arenaQuestions();
  const rol = UI.state.perfil.rol;
  const sel = h('select', { id: 'arena-q', onchange: e => { ARENA.pregunta = e.target.value; ARENA.historia = ''; drawRec(); } },
    h('optgroup', { label: t('rol.' + rol) }, qs.filter(q => q.rol).map(q => h('option', { value: q.id, selected: q.id === ARENA.pregunta || null, text: L(q) }))),
    h('optgroup', { label: t('arena.comunes') }, qs.filter(q => !q.rol).map(q => h('option', { value: q.id, selected: q.id === ARENA.pregunta || null, text: L(q) }))));
  const rnd = h('button', { class: 'btn', type: 'button', id: 'arena-random', onclick: randomQuestion }, icon('shuffle'), t('arena.aleatoria'));
  form.append(h('div', { class: 'field' }, h('label', { for: 'arena-q', text: t('arena.elige.pregunta') }), h('div', { class: 'row wrap' }, sel, rnd)));

  const recBox = h('fieldset', { id: 'arena-rec' });
  form.append(recBox);
  function randomQuestion() {
    ARENA.pregunta = pick(qs).id;
    sel.value = ARENA.pregunta;
    ARENA.historia = '';
    drawRec();
    toast(t('arena.aleatoriaToast'), { ic: 'shuffle' });
  }
  renderLobby.random = randomQuestion;
  function drawRec() {
    const q = arenaQuestion(ARENA.pregunta);
    const rec = recommendStories(q, UI.state.historias, scoreOf);
    if (!ARENA.historia && rec.length) ARENA.historia = rec[0].historia.id;
    const opt = (value, title, extra) => h('label', { class: 'check block-check' },
      h('input', { type: 'radio', name: 'historia', value, checked: ARENA.historia === value, onchange: () => { ARENA.historia = value; } }),
      h('span', { class: 'stack tight' }, h('b', { text: title }), extra ? h('span', { class: 'small muted', text: extra }) : null));
    recBox.replaceChildren(h('legend', { text: t('arena.elige.historia') }),
      rec.length ? h('p', { class: 'hint small muted', text: t('arena.recomendadaHint') }) : h('p', { class: 'hint small muted', text: t('arena.sinHistorias') }),
      h('div', { class: 'stack tight' },
        rec.map((r, i) => opt(r.historia.id, r.historia.titulo || t('forja.sinTitulo'),
          (i === 0 ? t('arena.recomendada') + ' · ' : '') + t('arena.encaje', { n: r.match, total: r.total }))),
        opt('', t('arena.desdeCero'), t('arena.desdeCero.d'))));
  }
  drawRec();

  form.append(h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit', id: 'arena-start' }, icon('swords'), t('arena.empezar'))));
  form.addEventListener('submit', e => { e.preventDefault(); startDuel(); });
  view.append(h('div', { class: 'card' }, form));

  const ds = UI.state.duelos.slice(-5).reverse();
  if (ds.length) {
    view.append(h('h2', { text: t('arena.ultimos') }), h('ul', { class: 'qlist', id: 'arena-hist' }, ds.map(d => h('li', null,
      icon(d.superado ? 'trophy' : 'circle-x', 'ic sm'),
      h('span', { text: L(arenaRecruiter(d.recruiter).nombre) + ' · ' + t('arena.modo.' + (DUELO.modos.includes(d.modo) ? d.modo : 'escrito')) }),
      h('span', { class: 'spacer' }),
      h('span', { class: 'mono small', text: t('arena.conviccionN', { n: d.conviccion }) }), ' ',
      h('span', { class: 'chip' + (d.superado ? ' ok' : ''), text: t(d.superado ? 'arena.ganado' : 'arena.perdido') })))));
  }
}

function startDuel() {
  let rec = arenaRecruiter(ARENA.recruiter);
  let q = arenaQuestion(ARENA.pregunta);
  if (ARENA.modo === 'sorpresa') {
    rec = pick(RECRUITERS.filter(r => !r.jefe));
    q = pick(arenaQuestions());
    const best = recommendStories(q, UI.state.historias, scoreOf, 1)[0];
    ARENA.historia = best ? best.historia.id : '';
  }
  const base = UI.state.historias.find(x => x.id === ARENA.historia);
  ARENA.story = base ? { ...base } : { id: 'arena', titulo: '', tipo: 'ensayo', s: '', t: '', a: '', r: '', l: '', competencias: [] };
  ARENA.duel = newDuel(rec, q, ARENA.modo);
  ARENA.marcas = {};
  ARENA.score = null;
  ARENA.ultima = null;
  playSound('tick');
  render();
}

function meter(conv) {
  const i = h('i');
  i.style.width = conv + '%';
  return h('div', { class: 'conv' },
    h('div', { class: 'row spread small' }, h('span', { text: t('arena.conviccion') }), h('b', { class: 'mono', id: 'arena-conv', text: conv + ' / 100' })),
    h('div', { class: 'bar conv-bar' + (conv >= DUELO.victoria ? ' gold' : ''), role: 'meter', 'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': String(conv), 'aria-label': t('arena.conviccion') }, i, (() => { const m = h('span', { class: 'goal', 'aria-hidden': 'true' }); m.style.left = DUELO.victoria + '%'; return m; })()),
    h('p', { class: 'tiny muted', text: t('arena.meta', { n: DUELO.victoria }) }));
}

function renderDuel(view) {
  const d = ARENA.duel;
  const rec = arenaRecruiter(d.recruiter);
  const q = arenaQuestion(d.pregunta);
  if (d.fin) { renderReport(view, rec, q); return; }
  const ronda = d.rondas.length;
  const criterio = ronda ? nextFollowUp(rec, ARENA.score, d.preguntadas) : null;
  viewHead(view, { eyebrow: t('nav.arena') + ' · ' + t('arena.modo.' + d.modo), title: L(rec.nombre), lede: t('arena.ronda', { n: ronda + 1, total: rec.repreguntas + 1 }) });

  const said = ronda ? (ARENA.ultima >= 0 ? rec.frases.bien : rec.frases.mal) : rec.frases.inicio;
  const bubble = h('div', { class: 'card rec-say', id: 'arena-say' },
    h('span', { class: 'rec-av' + (rec.jefe ? ' boss' : ''), 'aria-hidden': 'true' }, icon(rec.icono)),
    h('div', { class: 'stack tight' },
      h('p', { text: L(said) }),
      ronda ? h('p', { class: 'small mono ' + (ARENA.ultima >= 0 ? 'up' : 'down'), id: 'arena-delta', text: t('arena.delta', { n: (ARENA.ultima >= 0 ? '+' : '') + ARENA.ultima }) }) : null));
  const ask = h('div', { class: 'callout', id: 'arena-pregunta' }, icon('message-square-quote'),
    h('p', null, h('b', { text: (ronda ? t('arena.repregunta') : t('arena.pregunta')) + ' ' }), ronda ? t('arena.rep.' + criterio) : L(q)));
  view.append(h('div', { class: 'duel-top' }, bubble, h('div', { class: 'card' }, meter(d.conviccion))), ask);
  const live = h('p', { class: 'sr-only', 'aria-live': 'polite', id: 'arena-live', text: ronda ? L(said) + ' ' + t('arena.conviccionN', { n: d.conviccion }) : '' });
  view.append(live);

  const form = h('form', { class: 'card stack', id: 'arena-answer', 'aria-label': t('arena.respuesta') });
  const voz = d.modo === 'voz';
  if (voz) {
    if (ARENA.story.a || ARENA.story.s) {
      form.append(h('details', null, h('summary', { text: t('arena.verHistoria') }),
        h('div', { class: 'stack small' }, [...BLOQUES, 'l'].filter(b => ARENA.story[b]).map(b => h('p', null, h('b', { text: t('bloque.' + b) + ': ' }), ARENA.story[b])))));
    }
    form.append(h('p', { text: t('arena.voz.instr') }),
      h('fieldset', null, h('legend', { text: t('arena.voz.check') }),
        h('div', { class: 'stack tight' }, Object.keys(PESOS).map(id => h('label', { class: 'check' },
          h('input', { type: 'checkbox', name: 'marca', value: id, checked: !!ARENA.marcas[id], onchange: e => { ARENA.marcas[id] = e.target.checked; } }),
          t('arena.voz.' + id))))));
  } else if (!ronda) {
    for (const b of [...BLOQUES, 'l']) {
      const fid = 'a-' + b;
      form.append(h('div', { class: 'field' }, h('label', { for: fid }, t('bloque.' + b), b === 'l' ? h('span', { class: 'chip', text: t('ui.opcional') }) : null),
        h('textarea', { id: fid, rows: b === 'a' ? 5 : 2, maxlength: LIMITES.bloque, value: ARENA.story[b], placeholder: t('forja.ph.' + b), oninput: e => { ARENA.story[b] = e.target.value; } })));
    }
  } else {
    form.append(h('div', { class: 'field' }, h('label', { for: 'arena-follow', text: t('arena.tuRespuesta') }),
      h('p', { class: 'hint', id: 'arena-follow-hint', text: t('arena.seAnade', { bloque: t('bloque.' + REPREGUNTA_BLOQUE[criterio]) }) }),
      h('textarea', { id: 'arena-follow', rows: 4, maxlength: LIMITES.bloque, 'aria-describedby': 'arena-follow-hint' })));
  }

  let timerBox = null;
  if (d.modo === 'contrarreloj') {
    timerBox = h('div', { class: 'row timer', id: 'arena-timer' },
      icon('timer'), h('span', { class: 'mono', id: 'arena-secs', text: fmtDuration(DUELO.contrarreloj) }),
      h('span', { class: 'spacer' }),
      h('button', { class: 'btn sm', type: 'button', id: 'arena-stop-timer', onclick: () => { stopTimer(); ARENA.duel = { ...ARENA.duel, modo: 'escrito' }; toast(t('arena.relojParado'), { ic: 'timer' }); render(); } }, t('arena.pararReloj')));
    form.prepend(timerBox);
  }
  form.append(h('div', { class: 'row' },
    h('button', { class: 'btn primary', type: 'submit', id: 'arena-send' }, icon('send'), t('arena.enviar')),
    h('span', { class: 'small muted', text: t('arena.enviarHint') }),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn', type: 'button', id: 'arena-quit', onclick: () => { stopTimer(); ARENA.duel = null; render(); } }, t('arena.abandonar'))));
  form.addEventListener('submit', e => { e.preventDefault(); submit(false); });
  view.append(form);

  function submit(tiempoAgotado) {
    stopTimer();
    if (!voz && ronda) {
      const extra = $('#arena-follow').value;
      ARENA.story = applyFollowUp(ARENA.story, criterio, extra);
    }
    const sc = voz ? selfScore(ARENA.marcas) : scoreOf(ARENA.story);
    const before = ARENA.duel.conviccion;
    ARENA.duel = playRound(ARENA.duel, rec, sc, { criterio, tiempoAgotado });
    ARENA.score = sc;
    ARENA.ultima = ARENA.duel.conviccion - before;
    playSound(ARENA.ultima >= 0 ? 'ok' : 'fail');
    if (ARENA.duel.fin) finishDuel(rec);
    render();
    const f = $('#arena-follow') || $('#arena-again');
    if (f) f.focus();
  }
  renderDuel.submit = () => submit(false);

  if (d.modo === 'contrarreloj') {
    let left = DUELO.contrarreloj;
    ARENA.timer = { id: setInterval(() => {
      left -= 1;
      const s = $('#arena-secs');
      if (s) s.textContent = fmtDuration(Math.max(0, left));
      if (left === 15) toast(t('arena.quedan', { s: 15 }), { ic: 'timer' });
      if (left <= 0) { toast(t('arena.tiempo'), { ic: 'timer' }); submit(true); }
    }, 1000) };
  }
}

function finishDuel(rec) {
  const d = ARENA.duel;
  const rec0 = { fecha: today(), recruiter: rec.id, ruta: UI.state.perfil.rol, conviccion: d.conviccion, superado: d.fin === 'ganado', modo: d.modo };
  UI.state.duelos.push(rec0);
  if (UI.state.duelos.length > LIMITES.duelos) UI.state.duelos = UI.state.duelos.slice(-LIMITES.duelos);
  if (typeof onDuelEnd === 'function') onDuelEnd(rec0, rec, d, ARENA.score);
  saveState();
  playSound(d.fin === 'ganado' ? 'star' : 'fail');
}

function renderReport(view, rec, q) {
  const d = ARENA.duel;
  const won = d.fin === 'ganado';
  viewHead(view, { eyebrow: t('nav.arena') + ' · ' + t('arena.informe'), title: t(won ? 'arena.ganadoTitulo' : 'arena.perdidoTitulo'), lede: L(won ? rec.frases.gana : rec.frases.pierde) });
  view.append(h('div', { class: 'callout ' + (won ? 'ok' : 'warn'), id: 'arena-veredicto', role: 'status' }, icon(won ? 'trophy' : 'circle-x'),
    h('p', null, h('b', { text: t(won ? 'arena.ganado' : 'arena.perdido') + '. ' }), t('arena.veredicto', { rec: L(rec.nombre), n: d.conviccion, meta: DUELO.victoria }))));
  view.append(h('div', { class: 'grid two' },
    h('div', { class: 'card stack' }, meter(d.conviccion), h('p', { class: 'small' }, h('b', { text: t('arena.pregunta') + ' ' }), L(q))),
    h('div', { class: 'card stack' }, h('h2', { text: t('arena.rondas') }),
      h('table', { id: 'arena-rondas' }, h('thead', null, h('tr', null, ['arena.col.ronda', 'arena.col.tema', 'arena.col.nota', 'arena.col.cambio'].map(k => h('th', { scope: 'col', text: t(k) })))),
        h('tbody', null, d.rondas.map((r, i) => h('tr', null,
          h('td', { text: String(i + 1) }),
          h('td', { text: r.criterio ? t('crit.' + r.criterio) : t('arena.inicial') }),
          h('td', { class: 'mono', text: String(r.total) }),
          h('td', { class: 'mono', text: (r.delta >= 0 ? '+' : '') + r.delta + (r.tiempoAgotado ? ' ⏱' : '') }))))))));
  const sc = ARENA.score;
  const tips = sc && sc.consejos ? sc.consejos.slice(0, 3) : [];
  const flojos = sc ? gaps(rec, sc).slice(0, 3) : [];
  view.append(h('div', { class: 'card stack' }, h('h2', { text: t('arena.mejorar') }),
    tips.length ? h('ul', { class: 'tips' }, tips.map(c => h('li', null, icon('lightbulb'), h('span', { text: tipText(c) }))))
      : flojos.length ? h('ul', { class: 'tips' }, flojos.map(id => h('li', null, icon('lightbulb'), h('span', { text: t('arena.rep.' + id) }))))
        : h('p', { class: 'small muted', text: t('arena.nadaQueMejorar') })));
  const base = UI.state.historias.find(x => x.id === ARENA.historia);
  view.append(h('div', { class: 'row wrap' },
    h('button', { class: 'btn primary', type: 'button', id: 'arena-again', onclick: () => { ARENA.duel = null; render(); } }, icon('rotate-ccw'), t('arena.otro')),
    !base && ARENA.duel.modo !== 'voz' ? h('button', { class: 'btn', type: 'button', id: 'arena-save', onclick: () => {
      renderEditor.prefill = { titulo: '', s: ARENA.story.s, t: ARENA.story.t, a: ARENA.story.a, r: ARENA.story.r, l: ARENA.story.l, competencias: (q.comp || []).slice(0, LIMITES.competenciasPorHistoria), _pregunta: q.id };
      ARENA.duel = null; go('forja/nueva');
    } }, icon('hammer'), t('arena.guardarComo')) : null,
    base ? h('a', { class: 'btn', href: '#forja/' + base.id }, icon('pencil'), t('arena.pulir')) : null,
    won && rec.jefe ? h('a', { class: 'btn gold', href: '#oferta/' + UI.state.perfil.rol, id: 'arena-oferta' }, icon('file-text'), t('arena.verOferta')) : null));
}

document.addEventListener('keydown', e => {
  if (!String(document.body.dataset.route || '').startsWith('arena') || document.querySelector('dialog[open]')) return;
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && $('#arena-send')) { e.preventDefault(); $('#arena-answer').requestSubmit(); }
  else if (e.altKey && e.code === 'KeyR' && $('#arena-random')) { e.preventDefault(); renderLobby.random(); }
  else if (e.altKey && e.code === 'KeyN' && ARENA.duel && ARENA.duel.fin) { e.preventDefault(); ARENA.duel = null; render(); }
});
