// Tokenizare, împărțire în paragrafe și propoziții. Implementare proprie.

export const TOKEN_RE =
  /(?<url>(?:https?:\/\/|ftp:\/\/|www\.)[^\s<>"')\]]+)|(?<email>[\p{L}\p{N}._%+-]+@[\p{L}\p{N}-]+(?:\.[\p{L}\p{N}-]+)+)|(?<tag>[@#][\p{L}\p{N}_]+)|(?<word>[\p{L}\p{M}\p{N}]+(?:['’ʼ\-][\p{L}\p{M}\p{N}]+)*)|(?<space>\s+)|(?<punct>[\s\S])/gu;

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

/**
 * Împarte un paragraf în propoziții. Abrevierile (set de cuvinte fără punct) nu
 * încheie propoziția.
 * @returns {{start:number,end:number}[]}
 */
export function splitSentences(text, abbr = new Set()) {
  const out = [];
  let start = 0;
  const re = new RegExp(`([.!?…]+)([${CLOSERS}]*)(\\s+)`, 'gu');
  for (const m of text.matchAll(re)) {
    const punctEnd = m.index + m[1].length + m[2].length;
    const after = text[m.index + m[0].length];
    if (m[1] === '.' || m[1] === '…') {
      const before = text.slice(start, m.index);
      const lastWord = (before.match(/([\p{L}\p{N}.]+)$/u) || [])[1] || '';
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
