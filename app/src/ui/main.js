// Arranque de la aplicación.
for (const [id, v] of [['constelacion', '0.2.0'], ['arena', '0.3.0'], ['progreso', '0.4.0'], ['insignias', '0.4.0']]) {
  if (!VIEWS[id]) VIEWS[id] = view => renderSoon(view, id, v);
}
loadState();
const savedLang = lsGet(KEY.idioma);
UI.lang = savedLang === 'en' ? 'en' : 'es';
initShell();
applyStaticText();
render();
