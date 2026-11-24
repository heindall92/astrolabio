// Lector de documentos en el navegador, sin red ni librerías: texto de un CV en PDF, DOCX, ODT, TXT o MD.
// El archivo nunca sale del dispositivo. Usa DecompressionStream (navegadores actuales y Node 18+).
// Límites contra archivos maliciosos: tamaño del archivo, bytes descomprimidos y número de objetos.

export const DOC_LIMITES = { archivo: 10_000_000, descomprimido: 40_000_000, objetos: 20_000, texto: 20_000 };

/** Error con un código estable para la interfaz: 'grande', 'formato', 'cifrado', 'sin-texto', 'danado'. */
function docError(codigo) {
  const e = new Error(codigo);
  e.codigo = codigo;
  return e;
}

/** Descomprime con DecompressionStream y corta si se pasa del presupuesto. Un flujo truncado devuelve lo leído. */
async function inflar(bytes, formato, presupuesto) {
  const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream(formato)).getReader();
  const trozos = [];
  let n = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      n += value.length;
      if (n > presupuesto.restante) { reader.cancel().catch(() => {}); throw docError('grande'); }
      trozos.push(value);
    }
  } catch (e) {
    if (e.codigo === 'grande') throw e;
    // Datos con basura al final (frecuente en PDF): nos quedamos con lo que se pudo leer.
  }
  presupuesto.restante -= n;
  const out = new Uint8Array(n);
  let off = 0;
  for (const t of trozos) { out.set(t, off); off += t.length; }
  return out;
}

/** Bytes a cadena 1:1 (cada byte, un carácter), sin la conversión de windows-1252 que hace TextDecoder('latin1'). */
function binario(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
  return s;
}
const CP1252 = new TextDecoder('windows-1252');

// ---------- ZIP (DOCX y ODT) ----------
/** Entradas de un ZIP: { nombre → { metodo, comprimido, tamano, inicio } }. Solo lee el directorio central. */
function zipEntradas(bytes) {
  const v = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i--) if (v.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw docError('danado');
  const total = v.getUint16(eocd + 10, true);
  let p = v.getUint32(eocd + 16, true);
  const dec = new TextDecoder();
  const out = new Map();
  for (let k = 0; k < total && k < 5000; k++) {
    if (p + 46 > bytes.length || v.getUint32(p, true) !== 0x02014b50) throw docError('danado');
    const metodo = v.getUint16(p + 10, true);
    const comprimido = v.getUint32(p + 20, true);
    const tamano = v.getUint32(p + 24, true);
    const nl = v.getUint16(p + 28, true), xl = v.getUint16(p + 30, true), cl = v.getUint16(p + 32, true);
    const local = v.getUint32(p + 42, true);
    const nombre = dec.decode(bytes.subarray(p + 46, p + 46 + nl));
    if (local + 30 <= bytes.length && v.getUint32(local, true) === 0x04034b50) {
      const inicio = local + 30 + v.getUint16(local + 26, true) + v.getUint16(local + 28, true);
      out.set(nombre, { metodo, comprimido, tamano, inicio });
    }
    p += 46 + nl + xl + cl;
  }
  return out;
}
async function zipLeer(bytes, entrada, presupuesto) {
  const datos = bytes.subarray(entrada.inicio, entrada.inicio + entrada.comprimido);
  if (entrada.metodo === 0) return datos;
  if (entrada.metodo !== 8) throw docError('formato');
  return inflar(datos, 'deflate-raw', presupuesto);
}

const ENTIDADES = { lt: '<', gt: '>', amp: '&', quot: '"', apos: "'" };
export function xmlTexto(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|lt|gt|amp|quot|apos);/gi, (m, e) => {
    if (e[0] !== '#') return ENTIDADES[e.toLowerCase()] ?? m;
    const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
    return n > 0 && n < 0x110000 ? String.fromCodePoint(n) : '';
  });
}

/** Texto de word/document.xml: un párrafo por línea, tabuladores y saltos respetados. */
export function docxTexto(xml) {
  let out = '';
  for (const m of xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:tab\/>|<w:(?:br|cr)(?:\s[^>]*)?\/>|<\/w:p>/g)) {
    if (m[1] !== undefined) out += xmlTexto(m[1]);
    else if (m[0] === '<w:tab/>') out += '\t';
    else out += '\n';
  }
  return out;
}
/** Texto de content.xml de un ODT: párrafos y títulos. */
export function odtTexto(xml) {
  const cuerpo = xml.replace(/^[\s\S]*?<office:body>/, '');
  return xmlTexto(cuerpo
    .replace(/<text:tab\/>/g, '\t')
    .replace(/<text:s(?:\s+text:c="(\d+)")?\/>/g, (_, n) => ' '.repeat(Math.min(Number(n) || 1, 20)))
    .replace(/<text:line-break\/>|<\/text:p>|<\/text:h>/g, '\n')
    .replace(/<[^>]+>/g, ''));
}

// ---------- PDF ----------
const PDF_DELIM = '()<>[]{}/%';
const esBlanco = c => c === ' ' || c === '\n' || c === '\r' || c === '\t' || c === '\f' || c === '\0';

/** Tokenizador mínimo de PDF (diccionarios, flujos de contenido y CMap). */
function* pdfTokens(s) {
  let i = 0;
  const n = s.length;
  while (i < n) {
    const c = s[i];
    if (esBlanco(c)) { i++; continue; }
    if (c === '%') { while (i < n && s[i] !== '\n' && s[i] !== '\r') i++; continue; }
    if (c === '(') {
      let depth = 1, out = '';
      i++;
      while (i < n && depth) {
        const ch = s[i];
        if (ch === '\\') {
          const nx = s[i + 1];
          const esc = { n: '\n', r: '\r', t: '\t', b: '\b', f: '\f', '(': '(', ')': ')', '\\': '\\' };
          if (nx in esc) { out += esc[nx]; i += 2; }
          else if (nx >= '0' && nx <= '7') {
            let oct = '';
            i++;
            while (oct.length < 3 && s[i] >= '0' && s[i] <= '7') oct += s[i++];
            out += String.fromCharCode(parseInt(oct, 8) & 0xff);
          } else if (nx === '\r') { i += s[i + 2] === '\n' ? 3 : 2; }
          else if (nx === '\n') { i += 2; }
          else { i++; }
          continue;
        }
        if (ch === '(') depth++;
        else if (ch === ')') { depth--; if (!depth) { i++; break; } }
        out += ch;
        i++;
      }
      yield { t: 'str', v: out };
      continue;
    }
    if (c === '<' && s[i + 1] === '<') { yield { t: 'dict<' }; i += 2; continue; }
    if (c === '>' && s[i + 1] === '>') { yield { t: 'dict>' }; i += 2; continue; }
    if (c === '<') {
      const end = s.indexOf('>', i);
      const hex = s.slice(i + 1, end < 0 ? n : end).replace(/[^0-9a-f]/gi, '');
      let out = '';
      for (let k = 0; k < hex.length; k += 2) out += String.fromCharCode(parseInt((hex[k] + (hex[k + 1] || '0')), 16));
      yield { t: 'str', v: out, hex: true };
      i = end < 0 ? n : end + 1;
      continue;
    }
    if (c === '[' || c === ']' || c === '{' || c === '}') { yield { t: c }; i++; continue; }
    if (c === '/') {
      let j = i + 1;
      while (j < n && !esBlanco(s[j]) && !PDF_DELIM.includes(s[j])) j++;
      yield { t: 'name', v: s.slice(i + 1, j).replace(/#([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))) };
      i = j;
      continue;
    }
    let j = i;
    while (j < n && !esBlanco(s[j]) && !PDF_DELIM.includes(s[j])) j++;
    if (j === i) { i++; continue; }
    const w = s.slice(i, j);
    i = j;
    if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(w)) yield { t: 'num', v: Number(w) };
    else yield { t: 'op', v: w };
  }
}

/** Valor PDF a partir de tokens: números, nombres, cadenas, referencias «N G R», arreglos y diccionarios. */
function pdfValor(toks, k) {
  const tk = toks[k];
  if (!tk) return [null, k + 1];
  if (tk.t === 'num') {
    if (toks[k + 1] && toks[k + 1].t === 'num' && toks[k + 2] && toks[k + 2].t === 'op' && toks[k + 2].v === 'R') return [{ ref: tk.v }, k + 3];
    return [tk.v, k + 1];
  }
  if (tk.t === 'name') return [{ name: tk.v }, k + 1];
  if (tk.t === 'str') return [tk.v, k + 1];
  if (tk.t === '[') {
    const arr = [];
    k++;
    while (k < toks.length && toks[k].t !== ']') { const [v, nk] = pdfValor(toks, k); arr.push(v); k = nk; }
    return [arr, k + 1];
  }
  if (tk.t === 'dict<') {
    const d = {};
    k++;
    while (k < toks.length && toks[k].t !== 'dict>') {
      if (toks[k].t !== 'name') { k++; continue; }
      const key = toks[k].v;
      const [v, nk] = pdfValor(toks, k + 1);
      d[key] = v;
      k = nk;
    }
    return [d, k + 1];
  }
  return [tk.t === 'op' ? { op: tk.v } : null, k + 1];
}
function pdfParse(s) {
  return pdfValor([...pdfTokens(s)], 0)[0];
}

function nombre(v) { return v && typeof v === 'object' && 'name' in v ? v.name : null; }
function filtros(d) {
  const f = d.Filter;
  return (Array.isArray(f) ? f : f ? [f] : []).map(nombre);
}

/** Lee todos los objetos de un PDF (también los guardados en flujos de objetos). */
async function pdfObjetos(bin, presupuesto) {
  const objs = new Map();
  const re = /(\d+)\s+(\d+)\s+obj\b/g;
  let m;
  const pendientes = [];
  while ((m = re.exec(bin))) {
    if (objs.size >= DOC_LIMITES.objetos) throw docError('grande');
    const num = Number(m[1]);
    const ini = m.index + m[0].length;
    let fin = bin.indexOf('endobj', ini);
    if (fin < 0) fin = bin.length;
    const posStream = bin.indexOf('stream', ini);
    let dictSrc = bin.slice(ini, fin), datos = null;
    if (posStream >= 0 && posStream < fin && !/end$/.test(bin.slice(posStream - 3, posStream))) {
      dictSrc = bin.slice(ini, posStream);
      let d0 = posStream + 6;
      if (bin[d0] === '\r') d0++;
      if (bin[d0] === '\n') d0++;
      const dict = pdfParse(dictSrc) || {};
      let d1 = -1;
      if (typeof dict.Length === 'number' && /^\s*endstream/.test(bin.slice(d0 + dict.Length, d0 + dict.Length + 16))) d1 = d0 + dict.Length;
      if (d1 < 0) d1 = bin.indexOf('endstream', d0);
      if (d1 < 0) d1 = fin;
      datos = bin.slice(d0, d1);
      fin = Math.max(fin, d1);
      objs.set(num, { dict, datos, dec: null });
      re.lastIndex = d1;
      continue;
    }
    const val = pdfParse(dictSrc);
    objs.set(num, { dict: val, datos: null, dec: null });
    pendientes.push(num);
    re.lastIndex = fin;
  }
  // Flujos de objetos (PDF 1.5+): Word y LibreOffice guardan ahí los diccionarios de páginas y fuentes.
  for (const [, o] of [...objs]) {
    const d = o.dict;
    if (!d || typeof d !== 'object' || nombre(d.Type) !== 'ObjStm') continue;
    const txt = await pdfDecodificar(o, presupuesto);
    if (txt === null) continue;
    const first = Number(d.First) || 0;
    const cab = txt.slice(0, first).trim().split(/\s+/).map(Number);
    for (let k = 0; k + 1 < cab.length; k += 2) {
      const ini = first + cab[k + 1];
      const fin = k + 3 < cab.length ? first + cab[k + 3] : txt.length;
      if (!objs.has(cab[k])) objs.set(cab[k], { dict: pdfParse(txt.slice(ini, fin)), datos: null, dec: null });
    }
  }
  return objs;
}

/** Datos de un flujo como cadena binaria, descomprimidos si usan FlateDecode. null si el filtro no se admite. */
async function pdfDecodificar(o, presupuesto) {
  if (o.dec !== null) return o.dec;
  const fs = filtros(o.dict || {});
  let bytes = Uint8Array.from(o.datos, c => c.charCodeAt(0));
  for (const f of fs) {
    if (f === 'FlateDecode' || f === 'Fl') bytes = await inflar(bytes, 'deflate', presupuesto);
    else { o.dec = null; return null; }
  }
  o.dec = binario(bytes);
  return o.dec;
}

/** Nombres de glifo habituales en /Differences (fuentes Type1 de LaTeX, por ejemplo). */
const GLIFOS = {
  space: ' ', exclam: '!', quotedbl: '"', numbersign: '#', dollar: '$', percent: '%', ampersand: '&', quotesingle: "'", quoteright: '’', quoteleft: '‘',
  parenleft: '(', parenright: ')', asterisk: '*', plus: '+', comma: ',', hyphen: '-', minus: '-', period: '.', slash: '/', colon: ':', semicolon: ';',
  less: '<', equal: '=', greater: '>', question: '?', at: '@', bracketleft: '[', backslash: '\\', bracketright: ']', underscore: '_', bar: '|',
  braceleft: '{', braceright: '}', endash: '–', emdash: '—', bullet: '•', quotedblleft: '“', quotedblright: '”', ellipsis: '…', exclamdown: '¡',
  questiondown: '¿', guillemotleft: '«', guillemotright: '»', ordfeminine: 'ª', ordmasculine: 'º', degree: '°', euro: '€', copyright: '©',
  zero: '0', one: '1', two: '2', three: '3', four: '4', five: '5', six: '6', seven: '7', eight: '8', nine: '9',
  fi: 'fi', fl: 'fl', ff: 'ff', ffi: 'ffi', ffl: 'ffl', dotlessi: 'ı', germandbls: 'ß',
};
const DIACRITICOS = { acute: '́', grave: '̀', dieresis: '̈', circumflex: '̂', tilde: '̃', cedilla: '̧', ring: '̊' };
export function glifo(n) {
  if (GLIFOS[n]) return GLIFOS[n];
  if (/^[A-Za-z]$/.test(n)) return n;
  let m = /^uni([0-9A-F]{4})$/i.exec(n) || /^u([0-9A-F]{4,6})$/i.exec(n);
  if (m) return String.fromCodePoint(parseInt(m[1], 16));
  m = /^([A-Za-z])(acute|grave|dieresis|circumflex|tilde|cedilla|ring)$/.exec(n);
  if (m) return (m[1] + DIACRITICOS[m[2]]).normalize('NFC');
  return '';
}

/** CMap ToUnicode: códigos (cadena binaria) a texto. */
function leerCMap(txt) {
  const mapa = new Map();
  let bytesCodigo = 1;
  const rango = /begincodespacerange([\s\S]*?)endcodespacerange/.exec(txt);
  if (rango) { const h = /<([0-9a-f]+)>/i.exec(rango[1]); if (h) bytesCodigo = Math.max(1, Math.round(h[1].length / 2)); }
  const utf16 = hex => {
    let s = '';
    for (let k = 0; k < hex.length; k += 4) {
      const u = parseInt(hex.slice(k, k + 4).padEnd(4, '0'), 16);
      s += String.fromCharCode(u);
    }
    return s;
  };
  for (const b of txt.matchAll(/beginbfchar([\s\S]*?)endbfchar/g)) {
    for (const m of b[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]*)>/gi)) mapa.set(parseInt(m[1], 16), utf16(m[2]));
  }
  for (const b of txt.matchAll(/beginbfrange([\s\S]*?)endbfrange/g)) {
    for (const m of b[1].matchAll(/<([0-9a-f]+)>\s*<([0-9a-f]+)>\s*(<([0-9a-f]+)>|\[([^\]]*)\])/gi)) {
      const lo = parseInt(m[1], 16), hi = Math.min(parseInt(m[2], 16), lo + 0xffff);
      if (m[4] !== undefined) {
        const base = utf16(m[4]);
        const ult = base.charCodeAt(base.length - 1);
        for (let c = lo; c <= hi; c++) mapa.set(c, base.slice(0, -1) + String.fromCharCode(ult + (c - lo)));
      } else {
        const lista = [...m[5].matchAll(/<([0-9a-f]*)>/gi)].map(x => utf16(x[1]));
        for (let c = lo; c <= hi && c - lo < lista.length; c++) mapa.set(c, lista[c - lo]);
      }
    }
  }
  return { mapa, bytesCodigo };
}

/**
 * Texto de un PDF con capa de texto. Recorre las páginas en orden, decodifica cada fuente
 * (ToUnicode, /Differences o WinAnsi) y separa líneas por la posición vertical.
 */
export async function pdfTexto(bytes) {
  const presupuesto = { restante: DOC_LIMITES.descomprimido };
  const bin = binario(bytes);
  if (!bin.startsWith('%PDF')) throw docError('formato');
  if (/\/Encrypt\s+\d+\s+\d+\s+R|\/Encrypt\s*<</.test(bin)) throw docError('cifrado');
  const objs = await pdfObjetos(bin, presupuesto);
  const res = v => { let n = 0; while (v && typeof v === 'object' && 'ref' in v && n++ < 20) { const o = objs.get(v.ref); v = o ? o.dict : null; } return v; };
  // Páginas en el orden del árbol de páginas; si no hay árbol legible, por número de objeto.
  const raizRef = (/\/Root\s+(\d+)\s+\d+\s+R/.exec(bin) || [])[1];
  const paginas = [];
  const visitados = new Set();
  const recorrer = (ref, heredado) => {
    if (visitados.has(ref) || paginas.length > 500) return;
    visitados.add(ref);
    const o = objs.get(ref);
    const d = o && o.dict;
    if (!d || typeof d !== 'object') return;
    const recursos = d.Resources !== undefined ? d.Resources : heredado;
    if (nombre(d.Type) === 'Pages' || Array.isArray(d.Kids)) { for (const k of d.Kids || []) if (k && k.ref !== undefined) recorrer(k.ref, recursos); }
    else paginas.push({ d, recursos });
  };
  const raiz = raizRef ? res({ ref: Number(raizRef) }) : null;
  if (raiz && raiz.Pages && raiz.Pages.ref !== undefined) recorrer(raiz.Pages.ref, undefined);
  if (!paginas.length) for (const [, o] of [...objs].sort((a, b) => a[0] - b[0])) if (o.dict && nombre(o.dict.Type) === 'Page') paginas.push({ d: o.dict, recursos: o.dict.Resources });

  const fuentesCache = new Map();
  async function fuente(ref) {
    const key = ref && ref.ref !== undefined ? ref.ref : null;
    if (key !== null && fuentesCache.has(key)) return fuentesCache.get(key);
    const d = res(ref) || {};
    let f = { mapa: null, bytesCodigo: 1, dif: null, anchos: null, anchoDefecto: 500 };
    if (d.ToUnicode && d.ToUnicode.ref !== undefined) {
      const o = objs.get(d.ToUnicode.ref);
      const txt = o && o.datos !== null ? await pdfDecodificar(o, presupuesto) : null;
      if (txt) f = { ...f, ...leerCMap(txt) };
    }
    if (nombre(d.Subtype) === 'Type0') {
      if (!f.mapa) f.bytesCodigo = 2;
      const desc = res((res(d.DescendantFonts) || [])[0]) || {};
      f.anchoDefecto = typeof desc.DW === 'number' ? desc.DW : 1000;
      const w = res(desc.W);
      if (Array.isArray(w)) {
        f.anchos = new Map();
        for (let k = 0; k < w.length && f.anchos.size < 70_000;) {
          const c = w[k], sig = res(w[k + 1]);
          if (typeof c !== 'number') { k++; continue; }
          if (Array.isArray(sig)) { sig.forEach((x, j) => typeof x === 'number' && f.anchos.set(c + j, x)); k += 2; }
          else if (typeof sig === 'number' && typeof w[k + 2] === 'number') { for (let j = c; j <= sig && j - c < 70_000; j++) f.anchos.set(j, w[k + 2]); k += 3; }
          else k++;
        }
      }
    } else {
      const ws = res(d.Widths);
      if (Array.isArray(ws)) {
        const primero = typeof d.FirstChar === 'number' ? d.FirstChar : 0;
        f.anchos = new Map(ws.map((x, j) => [primero + j, typeof x === 'number' ? x : 0]));
      }
      f.anchoDefecto = 500;
    }
    const enc = res(d.Encoding);
    if (enc && typeof enc === 'object' && Array.isArray(enc.Differences)) {
      f.dif = new Map();
      let code = 0;
      for (const x of enc.Differences) {
        if (typeof x === 'number') code = x;
        else if (nombre(x) !== null) f.dif.set(code++, glifo(nombre(x)));
      }
    }
    if (key !== null) fuentesCache.set(key, f);
    return f;
  }
  /** Texto y anchura (en milésimas) de una cadena con la fuente activa. */
  function decodificar(f, s) {
    if (!f) return { txt: CP1252.decode(Uint8Array.from(s, c => c.charCodeAt(0))), codigos: [...s].map(c => [c.charCodeAt(0), 500]) };
    let out = '';
    const codigos = [];
    const b = f.bytesCodigo;
    for (let k = 0; k < s.length; k += b) {
      let code = 0;
      for (let j = 0; j < b; j++) code = code * 256 + (s.charCodeAt(k + j) || 0);
      if (f.mapa && f.mapa.has(code)) out += f.mapa.get(code);
      else if (f.dif && f.dif.has(code)) out += f.dif.get(code);
      else if (b === 1) out += CP1252.decode(Uint8Array.of(code));
      codigos.push([code, f.anchos && f.anchos.has(code) ? f.anchos.get(code) : f.anchoDefecto]);
    }
    return { txt: out, codigos };
  }

  const lineas = [];
  let hayTexto = false;
  for (const pag of paginas) {
    const recursos = res(pag.recursos) || {};
    const dicFuentes = res(recursos.Font) || {};
    const conts = Array.isArray(pag.d.Contents) ? pag.d.Contents : pag.d.Contents ? [pag.d.Contents] : [];
    let src = '';
    for (const c of conts) {
      const o = c && c.ref !== undefined ? objs.get(c.ref) : null;
      if (o && o.datos !== null) { const t = await pdfDecodificar(o, presupuesto); if (t) src += t + '\n'; }
    }
    // Estado de texto (ISO 32000-1, 9.3 y 9.4): matriz de línea, posición actual y parámetros de espaciado.
    let actual = '', fnt = null, tam = 12, tc = 0, tw = 0, tz = 1, lider = 0;
    let ma = 1, md = 1, lx = 0, ly = 0, cx = 0, ultY = null, ultFin = null, ultTam = 12;
    const pila = [];
    const cerrar = () => { if (actual.trim()) lineas.push(actual.replace(/\s+$/, '')); actual = ''; };
    /** Pinta una cadena en la posición actual y avanza según los anchos de los glifos. */
    const mostrar = s => {
      const { txt, codigos } = decodificar(fnt, s);
      const ini = cx;
      for (const [code, w] of codigos) cx += ((w / 1000) * tam + tc + (code === 32 && fnt && fnt.bytesCodigo === 1 ? tw : 0)) * tz * ma;
      if (!txt) return;
      hayTexto = true;
      const alto = Math.abs(tam * md) || 1;
      if (ultY !== null && Math.abs(ly - ultY) > Math.max(1, alto * 0.45, Math.abs(ultTam) * 0.45)) cerrar();
      else if (ultFin !== null && actual && !/\s$/.test(actual) && !/^\s/.test(txt) && (ini - ultFin > alto * 0.15 || ini < ultFin - alto * 2)) actual += ' ';
      actual += txt;
      ultY = ly; ultFin = cx; ultTam = alto;
    };
    for (const tk of pdfTokens(src)) {
      if (tk.t !== 'op') { pila.push(tk); if (pila.length > 4096) pila.shift(); continue; }
      const nums = pila.filter(p => p.t === 'num').map(p => p.v);
      const ult = k => nums[nums.length - k];
      switch (tk.v) {
        case 'BT': ma = 1; md = 1; lx = 0; ly = 0; cx = 0; break;
        case 'Tf': {
          const nm = [...pila].reverse().find(p => p.t === 'name');
          fnt = nm && dicFuentes[nm.v] ? await fuente(dicFuentes[nm.v]) : null;
          if (typeof ult(1) === 'number') tam = ult(1);
          break;
        }
        case 'Tc': if (nums.length) tc = ult(1); break;
        case 'Tw': if (nums.length) tw = ult(1); break;
        case 'Tz': if (nums.length) tz = ult(1) / 100; break;
        case 'TL': if (nums.length) lider = ult(1); break;
        case 'Tm': if (nums.length >= 6) { ma = ult(6) || 1; md = ult(3) || 1; lx = cx = ult(2); ly = ult(1); } break;
        case 'Td': case 'TD': if (nums.length >= 2) { lx += ult(2) * ma; ly += ult(1) * md; cx = lx; if (tk.v === 'TD') lider = -ult(1); } break;
        case 'T*': ly -= lider * md; cx = lx; break;
        case 'Tj': case "'": case '"': {
          if (tk.v !== 'Tj') { ly -= lider * md; cx = lx; }
          if (tk.v === '"' && nums.length >= 2) { tw = ult(2); tc = ult(1); }
          const str = [...pila].reverse().find(p => p.t === 'str');
          if (str) mostrar(str.v);
          break;
        }
        case 'TJ': {
          const ini = pila.map(p => p.t).lastIndexOf('[');
          for (const p of pila.slice(ini + 1)) {
            if (p.t === 'str') mostrar(p.v);
            else if (p.t === 'num') cx -= (p.v / 1000) * tam * tz * ma;
          }
          break;
        }
        default: break;
      }
      pila.length = 0;
    }
    cerrar();
  }
  if (!hayTexto) throw docError('sin-texto');
  return lineas.join('\n');
}

/** Texto de un archivo de CV según su tipo. Devuelve { texto, formato }. */
export async function leerDocumento(nombreArchivo, bytes) {
  if (bytes.length > DOC_LIMITES.archivo) throw docError('grande');
  const ext = (String(nombreArchivo).toLowerCase().match(/\.([a-z0-9]+)$/) || [])[1] || '';
  const presupuesto = { restante: DOC_LIMITES.descomprimido };
  let texto, formato;
  if (ext === 'pdf' || binario(bytes.subarray(0, 5)) === '%PDF-') {
    texto = await pdfTexto(bytes); formato = 'pdf';
  } else if (ext === 'docx' || ext === 'odt') {
    if (bytes[0] !== 0x50 || bytes[1] !== 0x4b) throw docError('formato');
    const ents = zipEntradas(bytes);
    const parte = ents.get(ext === 'docx' ? 'word/document.xml' : 'content.xml');
    if (!parte) throw docError('formato');
    if (parte.tamano > DOC_LIMITES.descomprimido) throw docError('grande');
    const xml = new TextDecoder().decode(await zipLeer(bytes, parte, presupuesto));
    texto = ext === 'docx' ? docxTexto(xml) : odtTexto(xml); formato = ext;
  } else if (ext === 'txt' || ext === 'md' || ext === 'text' || ext === '') {
    texto = new TextDecoder('utf-8', { fatal: false }).decode(bytes); formato = 'txt';
  } else {
    throw docError('formato');
  }
  texto = texto.replace(/\r\n?/g, '\n').replace(/[   ]/g, ' ').replace(/[ \t]+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  if (!texto) throw docError('sin-texto');
  return { texto: texto.slice(0, DOC_LIMITES.texto), formato, recortado: texto.length > DOC_LIMITES.texto };
}
