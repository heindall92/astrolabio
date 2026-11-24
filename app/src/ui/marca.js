// Tu marca (#marca): kit de LinkedIn, CV de resultados, bóveda de historias y plan de contenido «Field Notes».
// Todo sale de lo que ya escribiste: CV (de «Preparar entrevista»), marca personal y notas del Baúl, e historias.

const MARCA_TABS = [
  { id: 'linkedin', ic: 'id-card' },
  { id: 'cv', ic: 'file-user' },
  { id: 'boveda', ic: 'vault' },
  { id: 'contenido', ic: 'calendar-range' },
];

function cvGuardado() {
  const e = UI.state.entrevista;
  return e && e.cv && e.cv.trim() ? leerCV(e.cv, today().slice(0, 7)) : null;
}
function contador(n, max) {
  return h('span', { class: 'mono tiny ' + (n > max ? 'warn-text' : 'muted'), text: `${fmtNum(n)} / ${fmtNum(max)}` });
}
function sinCvAviso() {
  return h('div', { class: 'empty', id: 'marca-sin-cv' }, icon('file-up', 'ic lg'), h('h2', { text: t('marca2.sinCvTitulo') }), h('p', { class: 'muted', text: t('marca2.sinCv') }),
    h('a', { class: 'btn primary', href: '#entrevista' }, icon('clipboard-list'), t('nav.entrevista')));
}

VIEWS.marca = (view, arg) => {
  const tab = MARCA_TABS.some(x => x.id === arg) ? arg : 'linkedin';
  viewHead(view, { eyebrow: t('nav.marca'), title: t('marca2.titulo'), lede: t('marca2.lede'),
    action: h('a', { class: 'btn', href: '#baul', id: 'marca-editar' }, icon('gem'), t('marca2.editarMarca')) });
  view.append(h('nav', { class: 'seg wide tabs-marca', 'aria-label': t('marca2.secciones'), id: 'marca-tabs' },
    MARCA_TABS.map(x => h('a', { href: '#marca/' + x.id, 'aria-current': x.id === tab ? 'page' : null, id: 'mtab-' + x.id }, icon(x.ic, 'ic sm'), t('marca2.tab.' + x.id)))));
  ({ linkedin: tabLinkedIn, cv: tabCv, boveda: tabBoveda, contenido: tabContenido })[tab](view);
};

// ---------- LinkedIn ----------
function tabLinkedIn(view) {
  const cv = cvGuardado();
  const e = UI.state.entrevista;
  const ofertas = [e && e.oferta, UI.state.vacante && UI.state.vacante.texto].filter(x => x && x.trim());
  const p = UI.state.perfil;
  const k = kitLinkedIn({ cv, marca: UI.state.marca, rol: t('rol.' + p.rol), textoPerfil: e ? e.cv : '', ofertas, idioma: (cv && cv.idioma) || p.idioma || 'es', nombre: p.nombre });
  const m = UI.state.marca;
  if (!m.frase && !m.ventaja) view.append(h('div', { class: 'callout', id: 'li-sin-marca' }, icon('lightbulb'), h('p', null, t('marca2.sinMarca') + ' ', h('a', { href: '#baul', text: t('marca2.irMarca') }))));
  if (!cv) view.append(h('div', { class: 'callout warn', id: 'li-sin-cv' }, icon('file-up'), h('p', null, t('marca2.liSinCv') + ' ', h('a', { href: '#entrevista', text: t('nav.entrevista') }))));
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'li-tit-h', id: 'li-titulares' },
    h('h2', { id: 'li-tit-h' }, icon('id-card'), ' ', t('marca2.titulares')),
    h('p', { class: 'small muted', text: t('marca2.titularesLede', { n: LINKEDIN_LIMITES.titular }) }),
    k.titulares.length ? h('ol', { class: 'qlist numerada' }, k.titulares.map((x, i) => h('li', null, h('div', { class: 'stack tight grow' },
      h('p', { class: 'guion-texto', id: 'li-titular-' + i, text: x.texto }),
      h('div', { class: 'row' }, contador(x.largo, LINKEDIN_LIMITES.titular),
        h('button', { class: 'btn sm', type: 'button', 'aria-label': t('marca2.copiarAria', { n: i + 1 }), onclick: () => copyText(x.texto, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar')))))))
      : h('p', { class: 'small muted', text: t('marca2.sinTitulares') })));
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'li-acerca-h', id: 'li-acerca' },
    h('div', { class: 'row spread' }, h('h2', { id: 'li-acerca-h', text: t('marca2.acerca') }), h('div', { class: 'row' }, contador(k.acerca.largo, LINKEDIN_LIMITES.acerca),
      h('button', { class: 'btn sm', type: 'button', id: 'li-acerca-copiar', onclick: () => copyText(k.acerca.texto, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar')))),
    h('p', { class: 'small muted', text: t('marca2.acercaLede', { n: LINKEDIN_LIMITES.pliegue }) }),
    h('div', { class: 'texto-largo', id: 'li-acerca-texto' }, h('mark', { class: 'pliegue', text: k.acerca.pliegue }), k.acerca.texto.slice(k.acerca.pliegue.length))));
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'li-pal-h', id: 'li-palabras' },
    h('h2', { id: 'li-pal-h', text: t('marca2.palabras') }),
    h('p', { class: 'small muted', text: ofertas.length ? t('marca2.palabrasLede', { n: ofertas.length }) : t('marca2.palabrasSin') }),
    k.palabras.length ? h('table', null, h('thead', null, h('tr', null, h('th', { scope: 'col', text: t('marca2.palabra') }), h('th', { scope: 'col', text: t('marca2.enOfertas') }), h('th', { scope: 'col', text: t('marca2.enPerfil') }))),
      h('tbody', null, k.palabras.map(x => h('tr', { class: x.enPerfil ? '' : 'falta' }, h('th', { scope: 'row', text: x.label }), h('td', { class: 'num', text: fmtNum(x.ofertas) }),
        h('td', null, icon(x.enPerfil ? 'circle-check' : 'circle-alert', 'ic sm'), ' ', t(x.enPerfil ? 'marca2.si' : 'marca2.anadir')))))) : null));
  const rec = h('textarea', { id: 'li-rec', rows: 11, value: k.recomendacion, 'aria-labelledby': 'li-rec-h' });
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'li-rec-h', id: 'li-recomendacion' },
    h('h2', { id: 'li-rec-h', text: t('marca2.recomendacion') }),
    h('p', { class: 'small muted', text: t('marca2.recomendacionLede') }), rec,
    h('div', null, h('button', { class: 'btn sm', type: 'button', id: 'li-rec-copiar', onclick: () => copyText(rec.value, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar')))));
}

// ---------- CV de resultados ----------
function tabCv(view) {
  const cv = cvGuardado();
  if (!cv) { view.append(sinCvAviso()); return; }
  const r = revisarCV(cv, cv.idioma);
  view.append(h('div', { class: 'grid', id: 'cvr-kpis' },
    h('div', { class: 'card kpi' }, h('div', { class: 'row' }, icon('target'), h('span', { text: t('marca2.xyzPct') })), h('b', { id: 'cvr-pct', text: r.pct + ' %' })),
    h('div', { class: 'card kpi' }, h('div', { class: 'row' }, icon('list-checks'), h('span', { text: t('marca2.vinetas') })), h('b', { text: fmtNum(r.vinetas.length) })),
    h('div', { class: 'card kpi' }, h('div', { class: 'row' }, icon('calendar-days'), h('span', { text: t('marca2.fechasSinMes') })), h('b', { text: fmtNum(r.fechas.filter(f => f.sinMes).length) }))));
  view.append(h('div', { class: 'callout' }, icon('info'), h('p', { text: t('marca2.xyzLede') })));
  view.append(h('section', { class: 'stack', 'aria-labelledby': 'cvr-h', id: 'cvr-vinetas' },
    h('h2', { id: 'cvr-h', text: t('marca2.vinetasTitulo') }),
    r.vinetas.map((v, i) => h('article', { class: 'card stack' + (v.ok ? '' : ' con-huecos'), id: 'cvr-' + i },
      h('p', { class: 'guion-texto', text: v.texto }),
      h('div', { class: 'row wrap' }, ['verbo', 'cifra', 'como'].map(k => h('span', { class: 'chip' + (v.falta.includes(k) ? ' falta' : ' st-lista') }, icon(v.falta.includes(k) ? 'x' : 'check', 'ic sm'), t('marca2.xyz.' + k))),
        v.puesto ? h('span', { class: 'tiny muted', text: v.puesto }) : null),
      v.sugerencia ? h('div', { class: 'row wrap' }, h('p', { class: 'small' }, h('b', { text: t('marca2.prueba') + ' ' }), v.sugerencia),
        h('button', { class: 'btn sm', type: 'button', onclick: () => copyText(v.sugerencia, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar'))) : null,
      v.falta.includes('cifra') ? h('p', { class: 'tiny muted', text: t('marca2.sinCifraConsejo') }) : null))));
  view.append(h('section', { class: 'card stack', 'aria-labelledby': 'cvr-f-h', id: 'cvr-fechas' },
    h('div', { class: 'row spread' }, h('h2', { id: 'cvr-f-h', text: t('marca2.fechas') }),
      h('button', { class: 'btn sm', type: 'button', id: 'cvr-ficha', onclick: () => copyText(r.ficha, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('marca2.copiarFicha'))),
    h('p', { class: 'small muted', text: t('marca2.fechasLede') }),
    h('ul', { class: 'tips' }, r.fechas.map(f => h('li', { class: f.sinMes ? 'crit' : '' }, icon(f.sinMes ? 'triangle-alert' : 'check'), h('span', { text: `${f.puesto}${f.empresa ? ' · ' + f.empresa : ''}: ${f.sinMes ? t('marca2.sinMes') : t('marca2.conMes')}` }))))));
}

// ---------- Bóveda ----------
function tabBoveda(view) {
  const p = UI.state.perfil;
  const preguntas = [...ROLE_CONTENT[p.rol].preguntas, ...COMUNES.filter(q => !q.guia)];
  const b = seleccionarBoveda(UI.state.historias, scoreOf, preguntas, COMPETENCIA_IDS);
  const listas = b.boveda.filter(x => x.estado !== 'borrador').length;
  view.append(h('div', { class: 'card stack', id: 'bov-resumen' },
    h('div', { class: 'row spread' }, h('h2', { text: t('marca2.boveda') }), h('span', { class: 'kpi-line' }, h('b', { id: 'bov-n', text: `${listas}/6` }), h('span', { class: 'faint', text: ' ' + t('marca2.bovedaListas') }))),
    h('div', { class: 'bar' + (listas >= 6 ? ' gold' : ''), role: 'img', 'aria-label': t('marca2.bovedaBarra', { n: listas }) }, (() => { const i = h('i'); i.style.width = Math.round((listas / 6) * 100) + '%'; return i; })()),
    h('p', { class: 'small muted', text: t('marca2.bovedaLede') })));
  if (!b.boveda.length) {
    view.append(h('div', { class: 'empty', id: 'bov-vacia' }, icon('vault', 'ic lg'), h('p', { class: 'muted', text: t('marca2.bovedaVacia') }), h('a', { class: 'btn primary', href: '#forja/nueva' }, icon('plus'), t('forja.nueva'))));
    return;
  }
  view.append(h('div', { class: 'story-list', id: 'bov-lista' }, b.boveda.map(x => h('article', { class: 'card stack', id: 'bov-' + x.historia.id },
    h('div', { class: 'row spread' }, stateChip(x.estado), h('span', { class: 'score' }, String(x.total), h('small', { text: '/100' }))),
    h('h3', null, h('a', { href: '#forja/' + x.historia.id, text: x.historia.titulo || t('forja.sinTitulo') })),
    h('div', { class: 'meta' }, x.historia.competencias.map(c => h('span', { class: 'chip', text: compName(c) }))),
    h('p', { class: 'small' }, h('b', { text: t('marca2.usala') })),
    h('ul', { class: 'small stack tight' }, x.usos.map(q => h('li', { text: L(q) })))))));
  if (b.faltan.length) view.append(h('section', { class: 'card stack', id: 'bov-faltan', 'aria-labelledby': 'bov-f-h' },
    h('h2', { id: 'bov-f-h', text: t('marca2.faltan') }),
    h('div', { class: 'row wrap' }, b.faltan.map(c => h('a', { class: 'chip', href: '#constelacion', text: compName(c) })))));
}

// ---------- Field Notes ----------
function tabContenido(view) {
  const c = UI.state.contenido;
  const publicables = notasPublicables(UI.state.baul);
  // El plan sigue el orden guardado y añade al final las notas nuevas.
  const ids = [...c.plan.filter(id => publicables.some(n => n.id === id)), ...publicables.filter(n => !c.plan.includes(n.id)).map(n => n.id)];
  if (!c.inicio) c.inicio = today();
  const guardar = () => { UI.state.contenido = sanitizeContenido({ ...c, plan: ids }, new Set(UI.state.baul.map(n => n.id))); saveState(); };
  view.append(h('div', { class: 'callout', id: 'fn-lede' }, icon('megaphone'), h('p', { text: t('marca2.fnLede') })));
  view.append(h('div', { class: 'card stack', id: 'fn-ajustes' }, h('div', { class: 'form-grid' },
    h('div', { class: 'field' }, h('label', { for: 'fn-inicio', text: t('marca2.fnInicio') }), h('input', { type: 'date', id: 'fn-inicio', value: c.inicio, onchange: ev => { c.inicio = ev.target.value || today(); guardar(); render(); } })),
    h('div', { class: 'field' }, h('span', { class: 'label', text: t('marca2.fnCadencia') }), h('div', { class: 'seg wide', role: 'group', 'aria-label': t('marca2.fnCadencia'), id: 'fn-cadencia' },
      [7, 14, 30].map(d => h('button', { type: 'button', 'aria-pressed': String(c.cadencia === d), onclick: () => { c.cadencia = d; guardar(); render(); } }, t('marca2.fnCada', { n: d })))))),
    h('div', { class: 'row' }, h('button', { class: 'btn primary', type: 'button', id: 'fn-ics', disabled: ids.length ? null : true, onclick: () => {
      const plan = planContenido({ inicio: c.inicio, cadencia: c.cadencia, notas: ids });
      const ev = plan.map(x => { const n = UI.state.baul.find(y => y.id === x.notaId); return { fecha: x.fecha, id: x.notaId, titulo: `Field Notes #${x.n}: ${notaTitulo(n)}`, detalle: t('marca2.fnDetalle') }; });
      download(`field-notes-${today()}.ics`, icsPlan(ev, { nombre: 'Field Notes', sello: new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z') }), 'text/calendar;charset=utf-8');
      toast(t('marca2.fnIcsOk'), { ic: 'calendar-plus' });
    } }, icon('calendar-plus'), t('marca2.fnIcs')))));
  if (!ids.length) {
    view.append(h('div', { class: 'empty', id: 'fn-vacio' }, icon('notebook-pen', 'ic lg'), h('p', { class: 'muted', text: t('marca2.fnVacio') }), h('a', { class: 'btn primary', href: '#baul/nueva/herramienta' }, icon('plus'), t('baul.nueva'))));
    return;
  }
  const plan = planContenido({ inicio: c.inicio, cadencia: c.cadencia, notas: ids });
  const idioma = (UI.state.perfil && UI.state.perfil.idioma) || 'es';
  view.append(h('h2', { id: 'fn-plan-h', text: t('marca2.fnPlan', { n: plan.length }) }));
  view.append(h('ol', { class: 'stack', id: 'fn-plan', 'aria-labelledby': 'fn-plan-h' }, plan.map(x => {
    const n = UI.state.baul.find(y => y.id === x.notaId);
    const publicado = c.publicados.includes(n.id);
    const ta = h('textarea', { rows: 12, maxlength: 3000, value: c.borradores[n.id] || borradorPost(n, { marca: UI.state.marca, n: x.n, idioma }), 'aria-label': t('marca2.fnBorradorAria', { t: notaTitulo(n) }) });
    const informe = h('div', { class: 'stack tight', 'aria-live': 'polite' });
    const auditar = () => {
      const a = auditarPost(ta.value, idioma);
      rellenarNodo(informe, h('p', { class: 'small' }, h('span', { class: 'chip ' + (a.veredicto === 'ok' ? 'st-lista' : a.veredicto === 'revisar' ? '' : 'falta'), text: t('marca2.veredicto.' + a.veredicto) }), ' ', contador(a.caracteres, POST_REGLAS.max)),
        a.hallazgos.length ? h('ul', { class: 'tips' }, a.hallazgos.map(hh => h('li', { class: hh.nivel === 'alta' ? 'crit' : '' }, icon('lightbulb'), h('span', { text: t('marca2.audit.' + hh.id, { d: hh.detalle, min: POST_REGLAS.min, max: POST_REGLAS.max, g: POST_REGLAS.gancho, n: POST_REGLAS.hashtags }) })))) : null);
    };
    ta.addEventListener('input', auditar);
    auditar();
    return h('li', { class: 'card stack fn-item' + (publicado ? ' publicado' : ''), id: 'fn-' + n.id },
      h('div', { class: 'row spread' }, h('div', { class: 'row' }, h('span', { class: 'chip mono', text: fmtDate(x.fecha) }), h('h3', { text: `#${x.n} · ${notaTitulo(n)}` })),
        h('label', { class: 'choice-chip' }, h('input', { type: 'checkbox', checked: publicado, onchange: ev => { c.publicados = ev.target.checked ? [...c.publicados, n.id] : c.publicados.filter(z => z !== n.id); guardar(); ev.target.closest('li').classList.toggle('publicado', ev.target.checked); } }), h('span', { text: t('marca2.fnPublicado') }))),
      h('details', null, h('summary', { text: t('marca2.fnBorrador') }), h('div', { class: 'stack' }, ta, informe,
        h('div', { class: 'row' },
          h('button', { class: 'btn sm primary', type: 'button', onclick: () => { c.borradores = { ...c.borradores, [n.id]: ta.value }; guardar(); toast(t('marca2.fnGuardado')); } }, icon('check', 'ic sm'), t('ui.guardar')),
          h('button', { class: 'btn sm', type: 'button', onclick: () => copyText(ta.value, t('marca2.copiado')) }, icon('clipboard-copy', 'ic sm'), t('vac.copiar')),
          c.borradores[n.id] ? h('button', { class: 'btn sm ghost', type: 'button', onclick: () => { const bb = { ...c.borradores }; delete bb[n.id]; c.borradores = bb; guardar(); render(); } }, icon('rotate-ccw', 'ic sm'), t('guion.restaurar')) : null))));
  })));
}
