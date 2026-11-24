// Preparar una entrevista concreta (#entrevista), su guion (#guion) y el guion en directo (#directo).
// El CV se lee en el navegador; nada sale del dispositivo. Datos del usuario siempre con textContent.

/** La entrevista guardada o, si no hay, un borrador que solo pasa al estado cuando escribes algo. */
let entBorrador = null;
function entrevistaActual() {
  if (UI.state.entrevista) return UI.state.entrevista;
  if (!entBorrador) entBorrador = sanitizeEntrevista({});
  return entBorrador;
}
let entTimer = null;
function guardarEntrevista(e, ya = false) {
  clearTimeout(entTimer);
  const guardar = () => { UI.state.entrevista = sanitizeEntrevista(e); entBorrador = null; saveState(); };
  if (ya) guardar(); else entTimer = setTimeout(guardar, 400);
}
function mesHoy() { return today().slice(0, 7); }
function mesTexto(iso) {
  const [a, m] = iso.split('-').map(Number);
  return new Intl.DateTimeFormat(UI.lang === 'en' ? 'en-GB' : 'es-ES', { month: 'short', year: 'numeric' }).format(new Date(a, m - 1, 15));
}
function cvDe(e) { return e.cv && e.cv.trim() ? leerCV(e.cv, mesHoy()) : null; }

/** Guion de la entrevista guardada, con las ediciones a mano aplicadas. */
function construirGuion() {
  const e = entrevistaActual();
  const p = UI.state.perfil;
  const g = generarGuion({
    idioma: e.idioma, entrevista: e, cv: cvDe(e), oferta: e.oferta.trim() ? analyzeOffer(e.oferta) : null, textoOferta: e.oferta,
    historias: UI.state.historias, scoreFn: scoreOf, presentacion: UI.state.presentacion, marca: UI.state.marca, baul: UI.state.baul, perfil: p,
    preguntasRol: ROLE_CONTENT[p.rol].preguntas, comunes: COMUNES, preguntasEntrevistador: PREGUNTAS_ENTREVISTADOR,
    mesTexto: iso => { const [a, m] = iso.split('-').map(Number); return new Intl.DateTimeFormat(e.idioma === 'en' ? 'en-GB' : 'es-ES', { month: 'long', year: 'numeric' }).format(new Date(a, m - 1, 15)); },
  });
  return aplicarEdiciones(g, e.ediciones);
}
const CAT_IC = Object.fromEntries(GUION_CATEGORIAS.map(c => [c.id, c.icono]));

// ---------- Preparar entrevista ----------
VIEWS.entrevista = view => {
  const e = entrevistaActual();
  viewHead(view, { eyebrow: t('nav.entrevista'), title: t('ent.titulo'), lede: t('ent.lede'),
    action: h('a', { class: 'btn primary', href: '#guion', id: 'ent-generar' }, icon('scroll-text'), t('ent.generar')) });
  const set = (k, v) => { e[k] = v; guardarEntrevista(e); };
  const setR = (k, v) => { e.resp[k] = v; guardarEntrevista(e); };
  const input = (k, extra = {}) => h('input', { type: 'text', id: 'ent-' + k, value: e[k], maxlength: LIMITES.puesto, oninput: ev => set(k, ev.target.value), ...extra });
  const field = (id, label, ctl, hint) => h('div', { class: 'field' }, h('label', { for: id, text: label }), ctl, hint ? h('p', { class: 'hint', id: id + '-h', text: hint }) : null);
  const seg = (k, opts, labelKey) => h('div', { class: 'seg wide', role: 'group', 'aria-label': t(labelKey), id: 'ent-' + k },
    opts.map(o => h('button', { type: 'button', 'aria-pressed': String(e[k] === o), dataset: { v: o }, onclick: ev => {
      set(k, o); $$(`#ent-${k} button`).forEach(b => b.setAttribute('aria-pressed', String(b === ev.currentTarget)));
    } }, t(`ent.${k}.${o}`))));

  // 1. La entrevista
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'ent-1-h', id: 'ent-datos' },
    h('h2', { id: 'ent-1-h' }, h('span', { class: 'paso', text: '1' }), t('ent.paso1')),
    h('div', { class: 'form-grid' },
      field('ent-empresa', t('ent.empresa'), input('empresa', { placeholder: t('ent.empresa.ph') })),
      field('ent-puesto', t('ent.puesto'), input('puesto', { placeholder: t('ent.puesto.ph') })),
      field('ent-fecha', t('ent.fecha'), h('input', { type: 'date', id: 'ent-fecha', value: e.fecha, oninput: ev => set('fecha', ev.target.value) })),
      h('div', { class: 'field' }, h('span', { class: 'label', id: 'ent-formato-l', text: t('ent.formato') }), seg('formato', FORMATOS, 'ent.formato')),
      h('div', { class: 'field' }, h('span', { class: 'label', text: t('ent.idiomaEnt') }), seg('idioma', IDIOMAS, 'ent.idiomaEnt')),
      h('div', { class: 'field' }, h('span', { class: 'label', text: t('ent.pais') }), seg('pais', ['es', 'otro'], 'ent.pais'))),
    h('fieldset', { class: 'field chips-field' }, h('legend', { class: 'label', text: t('ent.quien') }),
      h('div', { class: 'row wrap', id: 'ent-quien' }, ENTREVISTADORES.map(x => h('label', { class: 'choice-chip' },
        h('input', { type: 'checkbox', value: x, checked: e.entrevistadores.includes(x), onchange: ev => {
          const s = new Set(e.entrevistadores); ev.target.checked ? s.add(x) : s.delete(x); set('entrevistadores', ENTREVISTADORES.filter(y => s.has(y)));
        } }), h('span', { text: t('ent.quien.' + x) })))),
      h('p', { class: 'hint', text: t('ent.quien.d') }))));

  // 2. Tu CV
  const cvBox = h('div', { class: 'stack', id: 'cv-resumen', 'aria-live': 'polite' });
  const archivo = h('p', { class: 'tiny muted', id: 'cv-archivo' });
  const cvTa = h('textarea', { id: 'ent-cv', rows: 6, maxlength: LIMITES.cv, value: e.cv, placeholder: t('cv.ph'), oninput: ev => { set('cv', ev.target.value); set('cvArchivo', ''); pintarCv(); } });
  const file = h('input', { type: 'file', id: 'cv-file', accept: '.pdf,.docx,.odt,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.oasis.opendocument.text,text/plain', class: 'sr-only',
    onchange: async ev => {
      const f = ev.target.files[0];
      ev.target.value = '';
      if (!f) return;
      rellenarNodo(cvBox, h('p', { class: 'small muted', id: 'cv-leyendo' }, icon('loader', 'ic sm spin'), ' ', t('cv.leyendo', { f: f.name })));
      try {
        if (f.size > DOC_LIMITES.archivo) throw Object.assign(new Error('grande'), { codigo: 'grande' });
        const r = await leerDocumento(f.name, new Uint8Array(await f.arrayBuffer()));
        cvTa.value = r.texto;
        e.cv = r.texto; e.cvArchivo = f.name.slice(0, LIMITES.puesto);
        guardarEntrevista(e, true);
        playSound('ok');
        toast(t('cv.leido', { f: f.name }), { ic: 'file-check' });
        if (r.recortado) toast(t('cv.recortado'), { ic: 'info' });
        pintarCv();
      } catch (err) {
        const cod = err && err.codigo ? err.codigo : 'danado';
        rellenarNodo(cvBox, h('div', { class: 'callout warn', role: 'alert', id: 'cv-error' }, icon('triangle-alert'), h('p', { text: t('cv.error.' + cod) })));
      }
    } });
  function pintarCv() {
    const cv = cvDe(e);
    rellenarNodo(archivo, ...(e.cvArchivo ? [icon('file-text', 'ic sm'), ' ', e.cvArchivo] : []));
    if (!cv) { rellenarNodo(cvBox, h('p', { class: 'small muted', text: t('cv.sin') })); return; }
    const exp = cv.experiencias;
    rellenarNodo(cvBox, 
      h('div', { class: 'grid', id: 'cv-kpis' },
        h('div', { class: 'kpi' }, h('span', { text: t('cv.kpi.anos') }), h('b', { text: cv.meses ? fmtNum(cv.anos) : '–' })),
        h('div', { class: 'kpi' }, h('span', { text: t('cv.kpi.puestos') }), h('b', { text: fmtNum(exp.length) })),
        h('div', { class: 'kpi' }, h('span', { text: t('cv.kpi.tec') }), h('b', { text: fmtNum(cv.tecnologias.length) })),
        h('div', { class: 'kpi' }, h('span', { text: t('cv.kpi.logros') }), h('b', { text: fmtNum(cv.logros.length) }))),
      cv.titular || cv.nombre ? h('p', null, h('b', { text: cv.nombre || '' }), cv.nombre && cv.titular ? ' · ' : '', h('span', { text: cv.titular })) : null,
      exp.length ? h('ul', { class: 'small stack tight', id: 'cv-exp' }, exp.map(x => h('li', null, h('b', { text: x.puesto }), x.empresa ? ' · ' + x.empresa : '', h('span', { class: 'muted', text: ` · ${mesTexto(x.desde)} – ${x.actual ? t('cv.actualidad') : mesTexto(x.hasta)}` })))) : h('p', { class: 'small warn-text', text: t('cv.sinFechas') }),
      cv.tecnologias.length ? h('div', { class: 'meta', id: 'cv-tec' }, cv.tecnologias.map(x => h('span', { class: 'chip', text: x }))) : null,
      cv.certificaciones.length ? h('p', { class: 'small' }, h('b', { text: t('cv.certs') + ': ' }), cv.certificaciones.join(' · ')) : null,
      cv.logros.length ? h('details', null, h('summary', { text: t('cv.logros', { n: cv.logros.length }) }), h('ul', { class: 'small stack tight' }, cv.logros.map(l => h('li', { text: l })))) : null,
      cv.contacto.email || cv.contacto.telefono ? h('p', { class: 'tiny muted' }, icon('lock', 'ic sm'), ' ', t('cv.contacto')) : null);
  }
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'ent-2-h', id: 'ent-cv-sec' },
    h('div', { class: 'row spread' }, h('h2', { id: 'ent-2-h' }, h('span', { class: 'paso', text: '2' }), t('ent.paso2')),
      h('div', { class: 'row' },
        h('label', { class: 'btn primary', for: 'cv-file', id: 'cv-subir' }, icon('file-up'), t('cv.subir')), file,
        e.cv ? h('button', { class: 'btn ghost', type: 'button', id: 'cv-quitar', onclick: () => { cvTa.value = ''; set('cv', ''); set('cvArchivo', ''); pintarCv(); toast(t('cv.quitado'), { ic: 'trash-2' }); } }, icon('trash-2'), t('cv.quitar')) : null)),
    h('p', { class: 'small muted', text: t('cv.lede') }),
    archivo,
    cvBox,
    h('details', { id: 'cv-texto' }, h('summary', { text: t('cv.verTexto') }), field('ent-cv', t('cv.texto'), cvTa, t('cv.textoHint')))));
  pintarCv();

  // 3. La oferta
  const ofBox = h('div', { class: 'stack', id: 'oferta-resumen', 'aria-live': 'polite' });
  const pintarOferta = () => {
    if (!e.oferta.trim()) { rellenarNodo(ofBox); return; }
    const of = analyzeOffer(e.oferta);
    const sal = salarioEnOferta(e.oferta);
    const dudas = dudasOferta(of, cvDe(e));
    rellenarNodo(ofBox, 
      of.tecnologias.length ? h('div', { class: 'meta' }, h('span', { class: 'small muted', text: t('ent.ofertaPide') }), of.tecnologias.map(x => h('span', { class: 'chip', text: x }))) : null,
      h('p', { class: 'small', id: 'oferta-salario' }, icon('wallet', 'ic sm'), ' ', sal ? t('ent.ofertaSalario', { s: sal.min === sal.max ? fmtEur(sal.min) : fmtEur(sal.min) + ' – ' + fmtEur(sal.max) }) : t('ent.ofertaSinSalario')),
      dudas.length ? h('ul', { class: 'tips', id: 'oferta-dudas' }, dudas.map(d => h('li', null, icon('shield-alert'), h('span', { text: d.tipo === 'anos' ? t('ent.dudaAnos', { pide: d.pide, tienes: d.tienes }) : t('ent.dudaIdioma', { pide: d.pide, tienes: d.tienes || t('ent.sinNivel') }) })))) : null);
  };
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'ent-3-h', id: 'ent-oferta-sec' },
    h('h2', { id: 'ent-3-h' }, h('span', { class: 'paso', text: '3' }), t('ent.paso3'), h('span', { class: 'tiny muted', text: ' · ' + t('ui.opcional') })),
    field('ent-oferta', t('ent.oferta'), h('textarea', { id: 'ent-oferta', rows: 5, maxlength: LIMITES.oferta, value: e.oferta, placeholder: t('vac.ph'), oninput: ev => { set('oferta', ev.target.value); pintarOferta(); } }), t('ent.ofertaHint')),
    ofBox));
  pintarOferta();

  // 4. Preguntas de apoyo
  const resp = (k, rows = 2) => field('ent-r-' + k, t('ent.r.' + k), h('textarea', { id: 'ent-r-' + k, rows, maxlength: LIMITES.respuesta, value: e.resp[k], placeholder: t('ent.r.' + k + '.ph'), 'aria-describedby': 'ent-r-' + k + '-h', oninput: ev => setR(k, ev.target.value) }), t('ent.r.' + k + '.d'));
  const euro = k => field('ent-r-' + k, t('ent.r.' + k), h('input', { type: 'number', id: 'ent-r-' + k, min: 0, max: LIMITES.salario, step: 50, inputmode: 'numeric', value: e.resp[k] || '', 'aria-describedby': 'ent-r-' + k + '-h', oninput: ev => { setR(k, Number(ev.target.value) || 0); pintarSal(); } }), t('ent.r.' + k + '.d'));
  const segR = (k, opts) => h('div', { class: 'seg wide', role: 'group', 'aria-label': t('ent.' + k), id: 'ent-' + k },
    opts.map(o => h('button', { type: 'button', 'aria-pressed': String(String(e.resp[k] || (k === 'salarioPagas' ? 14 : 'anual')) === String(o)), dataset: { v: o }, onclick: ev => {
      setR(k, o); $$(`#ent-${k} button`).forEach(b => b.setAttribute('aria-pressed', String(b === ev.currentTarget))); pintarSal();
    } }, t(`ent.${k}.${o}`))));
  // Vista previa de la pregunta salarial en dos tiempos, con los avisos del preparador de rango.
  const salVista = h('div', { class: 'card stack sal-vista', id: 'sal-vista', 'aria-live': 'polite' });
  function pintarSal() {
    const of = e.oferta.trim() ? analyzeOffer(e.oferta) : null;
    const cv = cvDe(e);
    const fs = frasesSalario({ minimo: e.resp.salarioMin, objetivo: e.resp.salarioObjetivo, ancla: e.resp.salarioAncla, unidad: e.resp.salarioUnidad || 'anual', pagas: e.resp.salarioPagas || 14 },
      argumentoSalario({ oferta: of, cv, baul: UI.state.baul, empresa: e.empresa, idioma: e.idioma }), e.idioma);
    const avisos = fs.rango.avisos.filter(a => a !== 'sin-objetivo' && a !== 'sin-ancla');
    rellenarNodo(salVista, 
      h('p', { class: 'eyebrow', text: t('sal.vista') }),
      h('div', { class: 'stack tight' }, h('b', { class: 'small', text: '1 · ' + t('sal.primero') }), h('p', { class: 'guion-texto', id: 'sal-primero', text: fs.primero })),
      h('div', { class: 'stack tight' }, h('b', { class: 'small', text: '2 · ' + t('sal.segundo') }), h('p', { class: 'guion-texto', id: 'sal-segundo' }, textoConHuecos(fs.segundo))),
      avisos.length ? h('ul', { class: 'tips', id: 'sal-avisos' }, avisos.map(a => h('li', { class: 'crit' }, icon('triangle-alert'), h('span', { text: L(SALARIO_AVISOS[a]) })))) : null,
      h('details', null, h('summary', { text: t('sal.fuentes') }), h('ul', { class: 'small stack tight' }, SALARIO_FUENTES[UI.lang === 'en' ? 'en' : 'es'].map(x => h('li', { text: x })))));
  }
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'ent-4-h', id: 'ent-apoyo' },
    h('h2', { id: 'ent-4-h' }, h('span', { class: 'paso', text: '4' }), t('ent.paso4')),
    h('p', { class: 'small muted', text: t('ent.paso4.d') }),
    h('div', { class: 'form-grid' }, resp('motivoPuesto'), resp('motivoEmpresa'), resp('logro'), resp('salida'), resp('futuro'), resp('defecto'), resp('duda'), resp('dudaRespuesta'), resp('hueco'),
      UI.state.perfil.rol === 'cambio' ? resp('cambio') : null),
    h('h3', { id: 'ent-salario-h', text: t('ent.salario') }),
    h('p', { class: 'small muted', text: t('ent.salario.d') }),
    h('div', { class: 'form-grid' }, euro('salarioObjetivo'), euro('salarioAncla'), euro('salarioMin'),
      h('div', { class: 'field' }, h('span', { class: 'label', text: t('ent.salarioUnidad') }), segR('salarioUnidad', ['anual', 'mensual'])),
      h('div', { class: 'field' }, h('span', { class: 'label', text: t('ent.salarioPagas') }), segR('salarioPagas', [14, 12, 13])),
      resp('condiciones', 1), resp('disponibilidad', 1)),
    salVista,
    h('p', { class: 'small muted' }, icon('scale', 'ic sm'), ' ', t('ent.salarioLey'))));
  pintarSal();
  view.append(rondaSalarial({ id: 'ronda-ent', minimo: () => e.resp.salarioMin, idioma: () => e.idioma }));

  view.append(h('div', { class: 'row', id: 'ent-acciones' },
    h('a', { class: 'btn primary', href: '#guion' }, icon('scroll-text'), t('ent.generar')),
    h('a', { class: 'btn', href: '#baul' }, icon('archive'), t('ent.irBaul')),
    h('span', { class: 'spacer' }),
    h('button', { class: 'btn danger', type: 'button', id: 'ent-borrar', onclick: async () => {
      if (!await confirmDialog({ title: t('ent.borrarTitulo'), body: t('ent.borrarCuerpo'), ok: t('ui.borrar'), danger: true })) return;
      clearTimeout(entTimer); UI.state.entrevista = null; entBorrador = null; saveState(); toast(t('ent.borrada'), { ic: 'trash-2' }); render();
    } }, icon('trash-2'), t('ent.borrar'))));
};
/**
 * Ronda salarial: el recruiter pregunta por tus expectativas, puntúa la respuesta con evaluarSalario y, si te quedas
 * en el primer tiempo o das una cifra suelta, repregunta («¿y una cifra concreta?»). Se usa en «Preparar entrevista»
 * y al ganar un duelo en la Arena. opts: { id, voz (frase del recruiter), minimo(), idioma() }.
 */
function rondaSalarial(opts) {
  const id = opts.id;
  const caja = h('section', { class: 'card stack ronda', id, 'aria-labelledby': id + '-h' });
  let intento = 0;
  const pintar = (preguntaTxt, previo) => {
    const ta = h('textarea', { id: id + '-txt', rows: 3, maxlength: LIMITES.respuesta, placeholder: t('ronda.ph'), 'aria-labelledby': id + '-q' });
    const res = h('div', { class: 'stack', id: id + '-res', 'aria-live': 'polite' });
    const form = h('form', { class: 'stack', onsubmit: ev => {
      ev.preventDefault();
      if (!ta.value.trim()) { ta.focus(); return; }
      intento++;
      const r = evaluarSalario(ta.value, { minimo: opts.minimo ? opts.minimo() : 0, idioma: opts.idioma ? opts.idioma() : UI.lang });
      rellenarNodo(res, 
        h('p', { class: 'kpi-line' }, h('b', { id: id + '-nota', text: String(r.total) }), h('span', { class: 'faint', text: ' / 100' })),
        h('ul', { class: 'checks' }, r.criterios.map(c => h('li', { class: c.ok ? 'ok' : 'no' }, icon(c.ok ? 'check' : 'x', 'ic sm'), h('span', { text: t('ronda.crit.' + c.id) }), h('span', { class: 'sr-only', text: c.ok ? t('ronda.cumple') : t('ronda.falta') })))),
        r.repregunta && intento < 3 ? h('button', { class: 'btn', type: 'button', id: id + '-sigue', onclick: () => pintar(t('ronda.rep.' + r.repregunta), r) }, icon('message-square-quote'), t('ronda.seguir')) : null,
        r.total === 100 ? h('p', { class: 'callout ok' }, icon('trophy'), h('span', { text: t('ronda.perfecta') })) : null);
      if (r.total === 100) playSound('ok');
    } },
      h('p', { class: 'ronda-q', id: id + '-q' }, icon('message-square-quote', 'ic sm'), ' ', preguntaTxt),
      ta, h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'submit', id: id + '-enviar' }, icon('send'), t('ronda.responder'))));
    rellenarNodo(caja, h('h2', { id: id + '-h' }, icon('wallet'), ' ', t('ronda.titulo')), h('p', { class: 'small muted', text: opts.voz || t('ronda.lede') }), form, res);
    if (previo) ta.focus();
  };
  pintar(L(COMUNES.find(q => q.id === 'c-salario')));
  return caja;
}

function fmtEur(n) { return new Intl.NumberFormat(UI.lang === 'en' ? 'en-GB' : 'es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n); }

/** Texto con los [huecos] marcados. */
function textoConHuecos(texto) {
  return String(texto).split(/(\[[^\]]+\])/).filter(Boolean).map(p => (/^\[.*\]$/.test(p) ? h('mark', { class: 'hueco', text: p }) : p));
}
function etiquetaFuente(f) {
  const k = f.split(':')[0];
  return t('guion.fuente.' + (['baul', 'historia', 'cv', 'resp', 'oferta', 'ley', 'presentacion', 'generada', 'hueco', 'banco', 'plantilla'].includes(k) ? k : 'plantilla'));
}

// ---------- Tu guion ----------
VIEWS.guion = view => {
  const e = UI.state.entrevista;
  viewHead(view, { eyebrow: t('nav.entrevista'), title: e && (e.empresa || e.puesto) ? t('guion.tituloDe', { d: [e.puesto, e.empresa].filter(Boolean).join(' · ') }) : t('guion.titulo'), lede: t('guion.lede'),
    action: e ? h('div', { class: 'row wrap' },
      h('a', { class: 'btn', href: '#entrevista', id: 'guion-editar' }, icon('pencil'), t('guion.preparar')),
      h('a', { class: 'btn primary', href: '#directo', id: 'guion-directo' }, icon('monitor-play'), t('guion.directo'))) : null });
  if (!e) {
    view.append(h('div', { class: 'empty', id: 'guion-vacio' }, icon('scroll-text', 'ic lg'), h('h2', { text: t('guion.vacioTitulo') }), h('p', { class: 'muted', text: t('guion.vacio') }),
      h('a', { class: 'btn primary', href: '#entrevista' }, icon('clipboard-list'), t('nav.entrevista'))));
    return;
  }
  const g = construirGuion();
  const huecos = g.bloques.reduce((n, b) => n + b.huecos.length, 0);
  const total = g.bloques.reduce((n, b) => n + b.segundos, 0);
  const kpi = (id, n, label, ic) => h('div', { class: 'card kpi', id }, h('div', { class: 'row' }, icon(ic), h('span', { text: label })), h('b', { text: n }));
  view.append(stagger(h('div', { class: 'grid', id: 'guion-kpis' },
    kpi('k-bloques', fmtNum(g.bloques.length), t('guion.kpi.bloques'), 'list-checks'),
    kpi('k-huecos', fmtNum(huecos), t('guion.kpi.huecos'), 'pencil'),
    kpi('k-pitch', String(g.pitch.total), t('guion.kpi.pitch'), 'mic'),
    kpi('k-tiempo', fmtDuration(total), t('guion.kpi.tiempo'), 'timer'))));
  if (huecos) view.append(h('div', { class: 'callout', id: 'guion-aviso-huecos' }, icon('lightbulb'), h('p', { text: t('guion.avisoHuecos', { n: huecos }) })));
  view.append(h('nav', { class: 'row wrap cat-nav', 'aria-label': t('guion.saltar'), id: 'guion-cats' },
    GUION_CATEGORIAS.filter(c => g.bloques.some(b => b.cat === c.id)).map(c => h('button', { class: 'btn sm', type: 'button', onclick: () => { const x = $('#cat-' + c.id); x.scrollIntoView({ behavior: reducedMotion() ? 'auto' : 'smooth', block: 'start' }); x.focus({ preventScroll: true }); } }, icon(c.icono, 'ic sm'), t('guion.cat.' + c.id))),
    h('button', { class: 'btn sm', type: 'button', onclick: () => { const x = $('#probables-h'); x.scrollIntoView({ block: 'start' }); x.focus({ preventScroll: true }); } }, icon('circle-question-mark', 'ic sm'), t('guion.probables'))));

  for (const c of GUION_CATEGORIAS) {
    const bs = g.bloques.filter(b => b.cat === c.id);
    if (!bs.length) continue;
    view.append(h('section', { class: 'stack guion-cat', 'aria-labelledby': 'cat-' + c.id },
      h('h2', { id: 'cat-' + c.id, tabindex: '-1' }, icon(c.icono), ' ', t('guion.cat.' + c.id)),
      bs.map(b => bloqueCard(b, e))));
  }
  // Posibles preguntas
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'probables-h', id: 'probables' },
    h('h2', { id: 'probables-h', tabindex: '-1' }, icon('circle-question-mark'), ' ', t('guion.probables'), h('span', { class: 'chip', text: fmtNum(g.probables.length) })),
    h('p', { class: 'small muted', text: t('guion.probablesLede') }),
    h('ol', { class: 'qlist numerada' }, g.probables.map(p => h('li', null, h('div', { class: 'stack tight' },
      h('p', { text: p.pregunta }),
      h('div', { class: 'row wrap' }, h('span', { class: 'chip', text: t('guion.motivo.' + p.motivo, { d: p.detalle }) }),
        p.bloque ? h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { const x = $('#b-' + p.bloque); x.scrollIntoView({ block: 'center' }); x.focus(); } }, icon('corner-down-right', 'ic sm'), t('guion.verRespuesta')) : null)))))));
  view.append(h('div', { class: 'row', id: 'guion-acciones' },
    h('button', { class: 'btn', type: 'button', id: 'guion-descargar', onclick: () => {
      const titulo = 'Astrolabio · ' + [e.puesto, e.empresa].filter(Boolean).join(' · ');
      download(`guion-${(e.empresa || 'entrevista').toLowerCase().replace(/[^a-z0-9]+/gi, '-').slice(0, 40)}-${today()}.txt`, guionTexto(g, titulo, Object.fromEntries(GUION_CATEGORIAS.map(c => [c.id, t('guion.cat.' + c.id)]))), 'text/plain;charset=utf-8');
      toast(t('guion.descargado'), { ic: 'download' });
    } }, icon('download'), t('guion.descargar')),
    h('button', { class: 'btn', type: 'button', id: 'guion-imprimir', onclick: () => window.print() }, icon('printer'), t('guion.imprimir'))));
};

function bloqueCard(b, e) {
  const card = h('article', { class: 'card stack bloque' + (b.huecos.length ? ' con-huecos' : ''), id: 'b-' + b.id, tabindex: '-1', 'aria-labelledby': 'bq-' + b.id });
  const pintar = () => {
    const enlace = b.fuente === 'hueco' && b.cat === 'conducta' ? h('a', { class: 'btn sm', href: '#forja/nueva' }, icon('hammer', 'ic sm'), t('guion.escribirHistoria'))
      : b.fuente === 'hueco' && b.cat === 'tecnica' ? h('a', { class: 'btn sm', href: '#baul/nueva/herramienta' }, icon('archive', 'ic sm'), t('guion.crearNota'))
        : b.huecos.length && b.fuente !== 'generada' ? h('a', { class: 'btn sm', href: '#entrevista' }, icon('pencil', 'ic sm'), t('guion.completar')) : null;
    rellenarNodo(card, 
      h('div', { class: 'row spread' }, h('h3', { id: 'bq-' + b.id, text: b.pregunta }),
        h('div', { class: 'row' }, b.editado ? h('span', { class: 'chip st-lista', text: t('guion.editado') }) : null, h('span', { class: 'chip', text: etiquetaFuente(b.fuente) }), h('span', { class: 'tiny muted mono', text: fmtDuration(b.segundos) }))),
      h('p', { class: 'guion-texto' }, textoConHuecos(b.texto)),
      b.claves.length ? h('div', { class: 'meta claves' }, icon('key-round', 'ic sm'), b.claves.map(k => h('span', { class: 'chip', text: k }))) : null,
      b.apoyo.length ? h('details', null, h('summary', { text: t('guion.apoyo') }), h('ul', { class: 'small stack tight' }, b.apoyo.map(a => h('li', { text: a })))) : null,
      h('div', { class: 'row' },
        h('button', { class: 'btn sm', type: 'button', 'aria-label': t('guion.editarAria', { q: b.pregunta }), onclick: editar }, icon('pencil', 'ic sm'), t('guion.editar')),
        enlace));
  };
  const editar = () => {
    const ta = h('textarea', { rows: Math.min(14, Math.max(4, Math.ceil(b.texto.length / 90))), maxlength: LIMITES.edicion, value: b.texto, 'aria-label': t('guion.editarAria', { q: b.pregunta }) });
    rellenarNodo(card, h('h3', { id: 'bq-' + b.id, text: b.pregunta }), ta, h('p', { class: 'hint', text: t('guion.editarHint') }),
      h('div', { class: 'row' },
        h('button', { class: 'btn sm primary', type: 'button', onclick: () => { e.ediciones = { ...e.ediciones, [b.id]: ta.value }; UI.state.entrevista = sanitizeEntrevista(e); saveState(); toast(t('guion.guardado')); render(); } }, icon('check', 'ic sm'), t('ui.guardar')),
        e.ediciones[b.id] ? h('button', { class: 'btn sm', type: 'button', onclick: () => { const ed = { ...e.ediciones }; delete ed[b.id]; e.ediciones = ed; UI.state.entrevista = sanitizeEntrevista(e); saveState(); toast(t('guion.restaurado'), { ic: 'rotate-ccw' }); render(); } }, icon('rotate-ccw', 'ic sm'), t('guion.restaurar')) : null,
        h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { pintar(); card.querySelector('button').focus(); } }, t('ui.cancelar'))));
    ta.focus();
  };
  pintar();
  return card;
}

// ---------- Guion en directo (teleprompter) ----------
const DIRECTO_SHORTCUTS = [
  ['tecla.espacio', 'atajo.dir.leer'], ['← →', 'atajo.dir.mover'], ['↑ ↓', 'atajo.dir.velocidad'], ['+ −', 'atajo.dir.tamano'],
  ['1 – 0', 'atajo.dir.tipo'], ['K', 'atajo.dir.modo'], ['F', 'atajo.dir.pantalla'], ['/', 'atajo.dir.buscar'],
];
const DIRECTO_DEF = { ppm: 130, tam: 34, modo: 'claves', camara: true };
function directoAjustes() {
  const raw = safeParse(lsGet(KEY.directo) || 'null') || {};
  return {
    ppm: Math.max(60, Math.min(260, Number(raw.ppm) || DIRECTO_DEF.ppm)),
    tam: Math.max(20, Math.min(72, Number(raw.tam) || DIRECTO_DEF.tam)),
    modo: raw.modo === 'texto' ? 'texto' : 'claves',
    camara: raw.camara !== false,
  };
}
const DIR = { i: 0, play: false, raf: 0, wake: null, inicio: 0, reloj: 0 };

VIEWS.directo = view => {
  const e = UI.state.entrevista;
  if (!e) { go('guion'); return; }
  const g = construirGuion();
  const aj = directoAjustes();
  const bloques = g.bloques;
  DIR.i = Math.min(DIR.i, bloques.length - 1);
  DIR.play = false;
  const guardarAj = () => lsSet(KEY.directo, JSON.stringify(aj));
  view.classList.add('directo-view');
  viewHead(view, { eyebrow: t('guion.directo'), title: [e.puesto, e.empresa].filter(Boolean).join(' · ') || t('guion.directo'), lede: t('dir.lede') });

  const cats = GUION_CATEGORIAS.filter(c => bloques.some(b => b.cat === c.id));
  const pregunta = h('h2', { class: 'dir-q', id: 'dir-q', tabindex: '-1' });
  const eyebrow = h('p', { class: 'eyebrow', id: 'dir-cat' });
  const marco = h('div', { class: 'dir-marco', id: 'dir-marco' });
  const cuerpo = h('div', { class: 'dir-cuerpo', id: 'dir-cuerpo' });
  marco.append(cuerpo);
  const reloj = h('span', { class: 'mono small', id: 'dir-reloj', role: 'timer', 'aria-live': 'off' });
  const pos = h('span', { class: 'mono small muted', id: 'dir-pos' });
  const estado = h('p', { class: 'sr-only', 'aria-live': 'polite', id: 'dir-estado' });
  const btnPlay = h('button', { class: 'btn primary', type: 'button', id: 'dir-play', 'aria-keyshortcuts': 'Space', onclick: () => alternar() });
  const ppm = h('output', { class: 'mono', id: 'dir-ppm', 'aria-live': 'polite' });
  const tam = h('output', { class: 'mono', id: 'dir-tam' });
  const modoSeg = h('div', { class: 'seg', role: 'group', 'aria-label': t('dir.modo'), id: 'dir-modo' },
    ['claves', 'texto'].map(m => h('button', { type: 'button', 'aria-pressed': String(aj.modo === m), dataset: { m }, onclick: () => cambiarModo(m) }, t('dir.modo.' + m))));
  const buscar = h('input', { type: 'search', id: 'dir-buscar', placeholder: t('dir.buscar'), 'aria-label': t('dir.buscar'), autocomplete: 'off',
    onkeydown: ev => {
      if (ev.key !== 'Enter') return;
      ev.preventDefault();
      const q = fold(ev.target.value);
      if (!q) return;
      const k = bloques.findIndex(b => fold(b.pregunta + ' ' + b.claves.join(' ') + ' ' + t('guion.cat.' + b.cat)).includes(q));
      if (k >= 0) { ir(k); ev.target.value = ''; pregunta.focus(); } else toast(t('dir.noEncontrado'), { ic: 'info' });
    } });
  const barraCats = h('div', { class: 'dir-cats', role: 'toolbar', 'aria-label': t('dir.tipos'), id: 'dir-cats' },
    cats.map((c, k) => h('button', { type: 'button', class: 'btn sm', dataset: { cat: c.id }, 'aria-keyshortcuts': String((k + 1) % 10), title: t('dir.atajoCat', { n: (k + 1) % 10 }),
      onclick: () => ir(bloques.findIndex(b => b.cat === c.id)) }, h('kbd', { text: String((k + 1) % 10) }), icon(c.icono, 'ic sm'), h('span', { text: t('guion.cat.' + c.id) }))));
  const controles = h('div', { class: 'dir-controles row wrap', role: 'toolbar', 'aria-label': t('dir.controles') },
    h('button', { class: 'icon-btn', type: 'button', id: 'dir-prev', 'aria-label': t('dir.anterior'), 'aria-keyshortcuts': 'ArrowLeft', onclick: () => ir(DIR.i - 1) }, icon('chevron-left')),
    btnPlay,
    h('button', { class: 'icon-btn', type: 'button', id: 'dir-next', 'aria-label': t('dir.siguiente'), 'aria-keyshortcuts': 'ArrowRight', onclick: () => ir(DIR.i + 1) }, icon('chevron-right')),
    modoSeg,
    h('div', { class: 'row tight', role: 'group', 'aria-label': t('dir.velocidad') },
      h('button', { class: 'icon-btn', type: 'button', id: 'dir-lento', 'aria-label': t('dir.lento'), 'aria-keyshortcuts': 'ArrowDown', onclick: () => velocidad(-10) }, icon('minus')),
      icon('gauge', 'ic sm'), ppm,
      h('button', { class: 'icon-btn', type: 'button', id: 'dir-rapido', 'aria-label': t('dir.rapido'), 'aria-keyshortcuts': 'ArrowUp', onclick: () => velocidad(10) }, icon('plus'))),
    h('div', { class: 'row tight dir-tam-grupo', role: 'group', 'aria-label': t('dir.tamano') },
      h('button', { class: 'icon-btn', type: 'button', id: 'dir-menos', 'aria-label': t('dir.menos'), 'aria-keyshortcuts': '-', onclick: () => tamano(-2) }, icon('a-arrow-down')),
      tam,
      h('button', { class: 'icon-btn', type: 'button', id: 'dir-mas', 'aria-label': t('dir.mas'), 'aria-keyshortcuts': '+', onclick: () => tamano(2) }, icon('a-arrow-up'))),
    h('button', { class: 'btn sm', type: 'button', id: 'dir-camara', 'aria-pressed': String(aj.camara), onclick: ev => { aj.camara = !aj.camara; guardarAj(); ev.currentTarget.setAttribute('aria-pressed', String(aj.camara)); aplicarAj(); } }, icon('webcam', 'ic sm'), t('dir.camara')),
    h('button', { class: 'btn sm', type: 'button', id: 'dir-pantalla', 'aria-keyshortcuts': 'F', onclick: pantallaCompleta }, icon('maximize', 'ic sm'), t('dir.pantalla')),
    h('span', { class: 'spacer' }), reloj, pos);
  const atajos = h('p', { class: 'tiny muted', id: 'dir-atajos', text: t('dir.atajos') });
  const escenario = h('div', { class: 'dir-escenario', id: 'dir-escenario' }, buscar, barraCats, eyebrow, pregunta, marco, controles, atajos, estado);
  view.append(escenario, h('p', { class: 'small muted', text: t('dir.etica') }), h('a', { class: 'btn', href: '#guion' }, icon('arrow-left'), t('dir.volver')));

  function aplicarAj() {
    escenario.style.setProperty('--dir-tam', aj.tam + 'px');
    escenario.classList.toggle('camara', aj.camara);
    ppm.textContent = t('dir.ppm', { n: aj.ppm });
    tam.textContent = aj.tam + ' px';
  }
  function pintar() {
    const b = bloques[DIR.i];
    rellenarNodo(eyebrow, icon(CAT_IC[b.cat], 'ic sm'), ' ', t('guion.cat.' + b.cat));
    pregunta.textContent = b.pregunta;
    $$('#dir-cats button').forEach(x => x.setAttribute('aria-current', x.dataset.cat === b.cat ? 'true' : 'false'));
    if (aj.modo === 'claves') {
      rellenarNodo(cuerpo, 
        b.claves.length ? h('ul', { class: 'dir-claves' }, b.claves.map(k => h('li', { text: k }))) : null,
        h('p', { class: 'dir-guia', text: primeraFraseUI(b.texto) }));
    } else {
      rellenarNodo(cuerpo, h('p', { class: 'dir-texto' }, textoConHuecos(b.texto)), h('div', { class: 'dir-final', 'aria-hidden': 'true' }));
    }
    marco.scrollTop = 0;
    pos.textContent = `${DIR.i + 1}/${bloques.length}`;
    DIR.inicio = performance.now();
    estado.textContent = t('dir.estadoBloque', { q: b.pregunta });
  }
  function primeraFraseUI(s) {
    const m = String(s).match(/^[\s\S]*?[.!?](?=\s|$)/);
    return (m ? m[0] : s).trim();
  }
  function ir(k) {
    if (k < 0 || k >= bloques.length) return;
    DIR.i = k;
    pintar();
  }
  function cambiarModo(m) {
    aj.modo = m; guardarAj();
    $$('#dir-modo button').forEach(x => x.setAttribute('aria-pressed', String(x.dataset.m === m)));
    if (m === 'claves' && DIR.play) alternar(false);
    pintar();
  }
  function velocidad(d) { aj.ppm = Math.max(60, Math.min(260, aj.ppm + d)); guardarAj(); aplicarAj(); }
  function tamano(d) { aj.tam = Math.max(20, Math.min(72, aj.tam + d)); guardarAj(); aplicarAj(); }
  async function pantallaCompleta() {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await escenario.requestFullscreen(); } catch { toast(t('dir.sinPantalla'), { ic: 'info' }); }
  }
  async function bloqueoPantalla(on) {
    try {
      if (on && 'wakeLock' in navigator && !DIR.wake) DIR.wake = await navigator.wakeLock.request('screen');
      if (!on && DIR.wake) { await DIR.wake.release(); DIR.wake = null; }
    } catch { DIR.wake = null; }
  }
  function alternar(forzar) {
    const on = typeof forzar === 'boolean' ? forzar : !DIR.play;
    if (on && aj.modo !== 'texto') cambiarModo('texto');
    DIR.play = on;
    rellenarNodo(btnPlay, icon(on ? 'pause' : 'play'), t(on ? 'dir.pausa' : 'dir.leer'));
    btnPlay.setAttribute('aria-pressed', String(on));
    bloqueoPantalla(on);
    cancelAnimationFrame(DIR.raf);
    if (on) { let prev = performance.now(); let acum = 0; const paso = ahora => {
      if (!marco.isConnected || !DIR.play) return;
      const texto = cuerpo.querySelector('.dir-texto');
      const palabras = Math.max(1, (texto ? texto.textContent : '').split(/\s+/).filter(Boolean).length);
      const pxPorSeg = (texto ? texto.offsetHeight : 0) / palabras * (aj.ppm / 60);
      acum += pxPorSeg * (ahora - prev) / 1000;
      prev = ahora;
      const linea = aj.tam * 1.5;
      // Con movimiento reducido avanza línea a línea, sin desplazamiento continuo.
      if (reducedMotion()) { if (acum >= linea) { marco.scrollTop += linea; acum = 0; } } else if (acum >= 1) { marco.scrollTop += Math.floor(acum); acum -= Math.floor(acum); }
      DIR.raf = requestAnimationFrame(paso);
    }; DIR.raf = requestAnimationFrame(paso); }
    estado.textContent = t(on ? 'dir.estadoLeyendo' : 'dir.estadoPausa');
  }
  function tic() {
    if (!reloj.isConnected) { clearInterval(DIR.reloj); bloqueoPantalla(false); return; }
    const s = Math.floor((performance.now() - DIR.inicio) / 1000);
    const obj = bloques[DIR.i].segundos;
    reloj.textContent = `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')} / ${String(Math.floor(obj / 60)).padStart(2, '0')}:${String(obj % 60).padStart(2, '0')}`;
    reloj.classList.toggle('pasado', s > obj * 1.3 + 5);
  }
  DIR.teclas = ev => {
    if (!escenario.isConnected) return;
    if (document.querySelector('dialog[open]') || ev.ctrlKey || ev.metaKey || ev.altKey) return;
    const escribiendo = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement.tagName);
    if (escribiendo) return;
    const k = ev.key;
    if (k === ' ') { ev.preventDefault(); alternar(); }
    else if (k === 'ArrowRight' || k === 'PageDown') { ev.preventDefault(); ir(DIR.i + 1); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { ev.preventDefault(); ir(DIR.i - 1); }
    else if (k === 'ArrowUp') { ev.preventDefault(); velocidad(10); }
    else if (k === 'ArrowDown') { ev.preventDefault(); velocidad(-10); }
    else if (k === '+' || k === '=') { ev.preventDefault(); tamano(2); }
    else if (k === '-') { ev.preventDefault(); tamano(-2); }
    else if (k.toLowerCase() === 'k') { ev.preventDefault(); cambiarModo(aj.modo === 'claves' ? 'texto' : 'claves'); }
    else if (k.toLowerCase() === 'f') { ev.preventDefault(); pantallaCompleta(); }
    else if (k === '/') { ev.preventDefault(); buscar.focus(); }
    else if (/^[0-9]$/.test(k)) { const c = cats[(Number(k) + 9) % 10]; if (c) { ev.preventDefault(); ir(bloques.findIndex(b => b.cat === c.id)); } }
  };
  if (!DIR.escucha) { document.addEventListener('keydown', ev => DIR.teclas && DIR.teclas(ev)); DIR.escucha = true; }
  /** El marco ocupa lo que queda de ventana, para que controles y texto se vean sin desplazar la página. */
  function ajustarAltura() {
    if (!marco.isConnected) { removeEventListener('resize', ajustarAltura); return; }
    if (document.fullscreenElement) { marco.style.height = ''; return; }
    const dentro = marco.getBoundingClientRect().top - escenario.getBoundingClientRect().top;
    const bnav = $('#bnav');
    const abajo = bnav && bnav.offsetParent ? bnav.offsetHeight + 8 : 0;
    marco.style.height = Math.max(200, Math.min(620, innerHeight - dentro - controles.offsetHeight - atajos.offsetHeight - abajo - 64)) + 'px';
  }
  addEventListener('resize', ajustarAltura);
  document.addEventListener('fullscreenchange', ajustarAltura);
  aplicarAj();
  alternar(false);
  pintar();
  requestAnimationFrame(() => { ajustarAltura(); escenario.scrollIntoView({ block: 'start' }); });
  clearInterval(DIR.reloj);
  DIR.reloj = setInterval(tic, 500);
  tic();
};
