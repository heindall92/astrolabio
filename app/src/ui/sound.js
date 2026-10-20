// Sonidos sintetizados con Web Audio: sin archivos y sin red. Se silencian desde la barra.
let audioCtx = null;
function soundOn() { return lsGet(KEY.sonido) !== 'off'; }
function setSound(on) { lsSet(KEY.sonido, on ? 'on' : 'off'); }

const SOUNDS = {
  ok: [[660, 0, .09], [880, .08, .12]],
  fail: [[300, 0, .12], [220, .1, .18]],
  star: [[784, 0, .08], [1047, .07, .08], [1319, .14, .16]],
  rank: [[523, 0, .1], [659, .1, .1], [784, .2, .1], [1047, .3, .26]],
  tick: [[1200, 0, .03]],
};
function playSound(name) {
  if (!soundOn() || !SOUNDS[name]) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    for (const [freq, at, dur] of SOUNDS[name]) {
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = 'sine';
      o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, now + at);
      g.gain.exponentialRampToValueAtTime(0.08, now + at + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, now + at + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(now + at);
      o.stop(now + at + dur + 0.02);
    }
  } catch { /* sin audio */ }
}
