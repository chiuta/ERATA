// Tokenizare, împărțire în paragrafe și propoziții. Implementare proprie.

export const TOKEN_RE =
  /(?<url>(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"')\]]+)|(?<email>(?<![\p{L}\p{N}._%+-])[\p{L}\p{N}._%+-]{1,64}@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)|(?<tag>[@#][\p{L}\p{N}_]+)|(?<word>[\p{L}\p{M}\p{N}]+(?:['’ʼ\-][\p{L}\p{M}\p{N}]+)*)|(?<space>\s+)|(?<punct>[\s\S])/gu;

/** @returns {{text:string,start:number,end:number,type:string}[]} */
export function tokenize(text) {
  const out = [];
  TOKEN_RE.lastIndex = 0;
  for (const m of text.matchAll(TOKEN_RE)) {
    const g = m.groups;
    let type = 'punct';
    if (g.url) type = 'url';
    else if (g.email) type = 'email';
    else if (g.tag) type = 'tag';
    else if (g.word) type = /\p{N}/u.test(g.word) ? 'num' : 'word';
    else if (g.space) type = 'space';
    out.push({ text: m[0], start: m.index, end: m.index + m[0].length, type });
  }
  return out;
}

/** Paragrafe = linii nevide. */
export function splitParagraphs(text) {
  const out = [];
  const re = /[^\n]+/g;
  for (const m of text.matchAll(re)) {
    if (m[0].trim()) out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
  }
  return out;
}

const CLOSERS = '"”»’)\\]\'';
const WORD_OR_DOT = /[\p{L}\p{N}.]/u;

/** Ultimul „cuvânt” (litere, cifre, puncte) care se termină la `idx`; căutare înapoi, limitată la 64 de caractere. */
function lastWordBefore(text, idx, lo) {
  const floor = Math.max(lo, idx - 64);
  let i = idx;
  while (i > floor) {
    let j = i - 1;
    const c = text.charCodeAt(j);
    if (c >= 0xdc00 && c <= 0xdfff && j > floor) j--; // pereche surogat
    if (!WORD_OR_DOT.test(text.slice(j, i))) break;
    i = j;
  }
  return text.slice(i, idx);
}

/**
 * Împarte un paragraf în propoziții. Abrevierile (set de cuvinte fără punct) nu
 * încheie propoziția. Timp liniar: nu se mai reia niciodată textul de la începutul propoziției.
 * @returns {{start:number,end:number}[]}
 */
export function splitSentences(text, abbr = new Set()) {
  const out = [];
  let start = 0;
  // lookbehind-ul împiedică reluarea căutării din interiorul unui șir lung de semne (altfel ar fi pătratic)
  const re = new RegExp(`(?<![.!?…])([.!?…]+)([${CLOSERS}]*)(\\s+)`, 'gu');
  for (const m of text.matchAll(re)) {
    const punctEnd = m.index + m[1].length + m[2].length;
    const after = text[m.index + m[0].length];
    if (m[1] === '.' || m[1] === '…') {
      const lastWord = lastWordBefore(text, m.index, start);
      const lw = lastWord.toLowerCase();
      if (abbr.has(lw) || /^\p{Lu}$/u.test(lastWord) || /^\d+$/.test(lastWord)) continue;
      if (/\p{L}\.\p{L}$/u.test(lastWord)) continue; // e.g., i.e.
      if (after && /\p{Ll}/u.test(after)) continue;
    }
    out.push({ start, end: punctEnd });
    start = m.index + m[0].length;
  }
  if (start < text.length && text.slice(start).trim()) out.push({ start, end: text.length });
  return out;
}

/**
 * Împarte un paragraf foarte lung în bucăți de cel mult `max` caractere, de preferință la sfârșit de
 * propoziție, apoi la un spațiu, în ultimă instanță la limită (fără a rupe o pereche surogat).
 * Fiecare bucată se verifică separat: timpul rămâne liniar chiar și pentru texte de ordinul megaocteților.
 * @returns {{start:number,end:number}[]}
 */
export function chunkRanges(text, max = 20000) {
  const out = [];
  let s = 0;
  const n = text.length;
  const back = Math.min(1500, max >> 1);
  while (n - s > max) {
    const limit = s + max;
    let cut = -1;
    let ws = -1;
    for (let i = limit; i > limit - back; i--) {
      const c = text.charCodeAt(i - 1);
      const isWs = c === 32 || c === 10 || c === 9 || c === 13 || c === 0xa0 || c === 0x202f || (c >= 0x2000 && c <= 0x200a) || c === 0x3000;
      if (!isWs) continue;
      if (ws < 0) ws = i;
      const p = i >= 2 ? text.charCodeAt(i - 2) : 0;
      if (p === 46 || p === 33 || p === 63 || p === 0x2026) {
        cut = i;
        break;
      }
    }
    if (cut < 0) cut = ws;
    if (cut < 0) {
      cut = limit;
      const c = text.charCodeAt(cut - 1);
      if (c >= 0xd800 && c <= 0xdbff) cut--;
    }
    out.push({ start: s, end: cut });
    s = cut;
  }
  out.push({ start: s, end: n });
  return out;
}

export function caseShape(w) {
  const lower = w.toLowerCase();
  const upper = w.toUpperCase();
  if (w === lower) return 'lower';
  if (w === upper) return w.length > 1 ? 'upper' : 'title';
  if (w[0] === upper[0] && w.slice(1) === lower.slice(1)) return 'title';
  return 'mixed';
}

export const title = (w) => (w ? w[0].toUpperCase() + w.slice(1) : w);

export function applyShape(s, shape) {
  if (shape === 'upper') return s.toUpperCase();
  if (shape === 'title') return title(s);
  return s;
}

/** Cuvânt „asemănător cu cod”: snake_case, căi, nume de fișiere, camelCase. */
export function isCodeLike(text, tok) {
  const prev = text[tok.start - 1] || '';
  const next = text[tok.end] || '';
  if ('_/\\@#$'.includes(prev) && prev) return true;
  if ('_/\\@'.includes(next) && next) return true;
  if (prev === '.' && /\p{L}/u.test(text[tok.start - 2] || '')) return true;
  if (next === '.' && /\p{Ll}/u.test(text[tok.end + 1] || '')) return true;
  if (/\p{Ll}\p{Lu}/u.test(tok.text)) return true; // camelCase / iPhone
  if (tok.text.length > 32) return true;
  return false;
}

export function isLatin(word) {
  return /^[\p{Script=Latin}\p{M}\p{N}'’ʼ\-]+$/u.test(word);
}

export const NBSP = ' ';
export const NNBSP = ' ';
