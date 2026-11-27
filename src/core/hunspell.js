// Implementare proprie (clean-room) a formatului Hunspell .aff/.dic:
// parser, verificare cu prefixe/sufixe (inclusiv două niveluri), compuse simple
// și generare de sugestii. Scrisă pornind de la descrierea publică a formatului.

import { caseShape, applyShape, title } from './text.js';

const hasFlag = (flags, f) => !!f && !!flags && flags.includes(f);

export const HUNSPELL_LIMITS = {
  maxWordLength: 128, // cuvintele mai lungi nu se caută în dicționar
  maxRules: 400000, // reguli de afix acceptate dintr-un .aff
  maxEntries: 8_000_000, // intrări acceptate dintr-un .dic
  maxLineLength: 2000,
  maxIconv: 5000,
  maxRep: 5000,
  cacheEntries: 60000,
  cacheKeyLength: 64,
};

const EMPTY = Object.freeze([]);

function parseFlags(str, mode) {
  if (!str) return EMPTY;
  if (mode === 'long') {
    const out = [];
    for (let i = 0; i + 1 < str.length; i += 2) out.push(str.slice(i, i + 2));
    return out;
  }
  if (mode === 'num') return str.split(',').filter(Boolean);
  return Array.from(str);
}

const NAMED = {
  NEEDAFFIX: 'needAffix',
  PSEUDOROOT: 'needAffix',
  ONLYINCOMPOUND: 'onlyCompound',
  FORBIDDENWORD: 'forbidden',
  KEEPCASE: 'keepCase',
  NOSUGGEST: 'noSuggest',
  COMPOUNDFLAG: 'compoundFlag',
  COMPOUNDBEGIN: 'compoundBegin',
  COMPOUNDMIDDLE: 'compoundMiddle',
  COMPOUNDEND: 'compoundEnd',
  COMPOUNDPERMITFLAG: 'compoundPermit',
};

/** Etichetă TextDecoder pentru valoarea directivei SET (sau null dacă nu o recunoaștem). */
export function encodingLabel(set) {
  const v = String(set || '').trim();
  if (!v || /^utf-?8$/i.test(v)) return 'utf-8';
  let m = v.match(/^ISO-?8859-(\d+)$/i);
  if (m) return `iso-8859-${m[1]}`;
  m = v.match(/^(?:microsoft-)?(?:cp|windows-?)(\d{3,4})$/i);
  if (m) return `windows-${m[1]}`;
  if (/^koi8-?r$/i.test(v)) return 'koi8-r';
  if (/^koi8-?u$/i.test(v)) return 'koi8-u';
  if (/^TIS620/i.test(v)) return 'windows-874';
  if (/^utf-?16(le)?$/i.test(v)) return 'utf-16le';
  return null;
}

/**
 * Transformă octeții unui fișier .aff/.dic în text. Detectează BOM-ul (UTF-8/16) și, pentru .aff,
 * directiva `SET`; `fallbackLabel` (din .aff) se aplică fișierului .dic. Nu aruncă niciodată.
 * @returns {{text:string, label:string, warnings:string[]}}
 */
export function decodeBytes(bytes, fallbackLabel = null) {
  const warnings = [];
  let u8 = bytes instanceof Uint8Array ? bytes : ArrayBuffer.isView(bytes) ? new Uint8Array(bytes.buffer, bytes.byteOffset, bytes.byteLength) : new Uint8Array(bytes);
  let label = fallbackLabel;
  if (u8.length >= 3 && u8[0] === 0xef && u8[1] === 0xbb && u8[2] === 0xbf) {
    u8 = u8.subarray(3);
    label = 'utf-8';
  } else if (u8.length >= 2 && u8[0] === 0xff && u8[1] === 0xfe) {
    u8 = u8.subarray(2);
    label = 'utf-16le';
  } else if (u8.length >= 2 && u8[0] === 0xfe && u8[1] === 0xff) {
    u8 = u8.subarray(2);
    label = 'utf-16be';
  } else if (!label) {
    // căutăm „SET xxx” în primii 4 KB, interpretați ca latin1 (SET este ASCII)
    let head = '';
    const n = Math.min(u8.length, 4096);
    for (let i = 0; i < n; i++) head += String.fromCharCode(u8[i]);
    const m = head.match(/^\s*SET[ \t]+(\S+)/m);
    label = m ? encodingLabel(m[1]) : 'utf-8';
    if (m && !label) warnings.push(`codare necunoscută în SET: ${m[1].slice(0, 30)}; se folosește UTF-8`);
    label = label || 'utf-8';
  }
  let text;
  try {
    text = new TextDecoder(label).decode(u8);
  } catch {
    warnings.push(`TextDecoder nu cunoaște „${label}”; se folosește UTF-8`);
    label = 'utf-8';
    text = new TextDecoder('utf-8').decode(u8);
  }
  return { text, label, warnings };
}

/**
 * Condiție de afix Hunspell → expresie regulată sigură. În Hunspell doar `.`, `[...]` și `[^...]` au sens
 * special; orice alt caracter este literal (nu se pot produce cuantificatori sau grupuri).
 * @returns {RegExp|null|false} null = fără condiție („.”); false = condiție invalidă
 */
export function conditionToRegex(cond, suffix) {
  if (cond === '.' || cond === '') return null;
  let src = '';
  const chars = Array.from(cond);
  for (let i = 0; i < chars.length; i++) {
    const c = chars[i];
    if (c === '[') {
      let j = i + 1;
      let neg = false;
      if (chars[j] === '^') {
        neg = true;
        j++;
      }
      let members = '';
      while (j < chars.length && chars[j] !== ']') members += '\\u{' + chars[j++].codePointAt(0).toString(16) + '}';
      if (j >= chars.length || !members) return false;
      src += (neg ? '[^' : '[') + members + ']';
      i = j;
    } else if (c === '.') src += '.';
    else if (c === ']') return false;
    else src += '\\u{' + c.codePointAt(0).toString(16) + '}';
  }
  try {
    return new RegExp(suffix ? `(?:${src})$` : `^(?:${src})`, 'su');
  } catch {
    return false;
  }
}

export class Hunspell {
  /**
   * @param {string|Uint8Array|ArrayBuffer} aff
   * @param {string|Uint8Array|ArrayBuffer} dic
   * Nu aruncă niciodată: problemele din fișiere se găsesc în `this.warnings`.
   */
  constructor(aff, dic, { name = '' } = {}) {
    this.name = name;
    this.warnings = [];
    this.flagMode = 'ascii';
    this.tryChars = '';
    this.keyRows = [];
    this.rep = [];
    this.iconv = [];
    this.maps = [];
    this.af = [];
    this.flag = {};
    this.compoundMin = 3;
    this.prefixes = [];
    this.suffixes = [];
    this.encoding = 'utf-8';
    this._cache = new Map();
    this.dict = new Map();
    try {
      const a = this._text(aff, 'aff', null);
      this.encoding = a.label;
      const d = this._text(dic, 'dic', a.label);
      this._parseAff(a.text);
      this._buildIndex();
      this._parseDic(d.text);
    } catch (e) {
      this.warnings.push(`eroare neașteptată la încărcare: ${String(e && e.message ? e.message : e).slice(0, 120)}`);
      this._buildIndex();
    }
    this._alphabet = this._buildAlphabet();
    this._neighbors = this._buildNeighbors();
  }

  _text(x, what, label) {
    if (typeof x === 'string') {
      if (x.includes('�')) this.warnings.push(`${what}: conține caractere de înlocuire U+FFFD (decodare greșită?)`);
      return { text: x.replace(/^﻿/, ''), label: label || 'utf-8' };
    }
    if (x instanceof ArrayBuffer || ArrayBuffer.isView(x)) {
      const r = decodeBytes(x, label);
      for (const w of r.warnings) this.warnings.push(`${what}: ${w}`);
      return r;
    }
    if (x != null) this.warnings.push(`${what}: tip neașteptat (${typeof x}); se ignoră`);
    else this.warnings.push(`${what}: lipsește`);
    return { text: '', label: label || 'utf-8' };
  }

  /** Rezolvă un șir de flaguri, ținând cont de aliasurile AF (indici 1..n). */
  _flags(str) {
    if (!str) return EMPTY;
    if (this.af.length && /^\d+$/.test(str)) {
      const a = this.af[+str - 1];
      return a ? parseFlags(a, this.flagMode) : EMPTY;
    }
    return parseFlags(str, this.flagMode);
  }

  // ---------- AFF ----------
  _parseAff(aff) {
    const blocks = new Map();
    const lines = aff.split(/\r\n|\n|\r/);
    let afLeft = 0;
    for (let ln = 0; ln < lines.length; ln++) {
      const line = lines[ln].trim();
      if (!line || line[0] === '#' || line.length > HUNSPELL_LIMITS.maxLineLength * 4) continue;
      const t = line.split(/\s+/);
      const k = t[0];
      if (k === 'FLAG') {
        this.flagMode = t[1] === 'long' ? 'long' : t[1] === 'num' ? 'num' : 'utf8';
      } else if (k === 'TRY') this.tryChars = t[1] || '';
      else if (k === 'KEY') this.keyRows = (t[1] || '').split('|');
      else if (k === 'AF') {
        if (t.length === 2 && /^\d+$/.test(t[1]) && !afLeft && !this.af.length) afLeft = Math.min(+t[1], 100000);
        else if (t[1]) {
          if (this.af.length < 100000) this.af.push(t[1]);
          afLeft = Math.max(0, afLeft - 1);
        }
      } else if (k === 'REP' && t.length >= 3) {
        if (this.rep.length < HUNSPELL_LIMITS.maxRep && t[1] !== '^' && t[1] !== '$' && t[1] !== '^$') this.rep.push([t[1], t[2].replace(/_/g, ' ')]);
      } else if (k === 'ICONV' && t.length >= 3) {
        if (this.iconv.length < HUNSPELL_LIMITS.maxIconv && t[1]) this.iconv.push([t[1], t[2]]);
      } else if (k === 'MAP' && t.length === 2 && !/^\d+$/.test(t[1])) this.maps.push(Array.from(t[1]));
      else if (k === 'COMPOUNDMIN') this.compoundMin = Math.max(1, Math.min(20, parseInt(t[1], 10) || 3));
      else if (NAMED[k] && t[1]) this.flag[NAMED[k]] = parseFlags(t[1], this.flagMode)[0];
      else if (k === 'PFX' || k === 'SFX') {
        const isHeader = t.length >= 4 && /^[YN]$/.test(t[2]) && /^\d+$/.test(t[3]) && t.length <= 5;
        if (isHeader) {
          blocks.set(k + t[1], t[2] === 'Y');
          continue;
        }
        if (t.length < 4) {
          this.warnings.push(`aff:${ln + 1}: regulă ${k} prea scurtă`);
          continue;
        }
        if (this.prefixes.length + this.suffixes.length >= HUNSPELL_LIMITS.maxRules) continue;
        const [strip0, addFull] = [t[2], t[3]];
        const cond = t[4] || '.';
        const sl = addFull.indexOf('/');
        let add = sl < 0 ? addFull : addFull.slice(0, sl);
        const contStr = sl < 0 ? '' : addFull.slice(sl + 1);
        if (add === '0') add = '';
        const strip = strip0 === '0' ? '' : strip0;
        const re = conditionToRegex(cond, k === 'SFX');
        if (re === false) {
          if (this.warnings.length < 200) this.warnings.push(`aff:${ln + 1}: condiție de afix invalidă „${cond.slice(0, 30)}”; regula se omite`);
          continue;
        }
        const rule = {
          flag: t[1],
          cross: blocks.get(k + t[1]) ?? true,
          strip,
          add,
          cond: re,
          cont: contStr ? new Set(this._flags(contStr)) : null,
        };
        (k === 'SFX' ? this.suffixes : this.prefixes).push(rule);
      }
    }
  }

  _buildIndex() {
    // indexare după șirul exact `add` (nu doar după ultima literă): dicționarele mari (fr: 5000 de reguli de sufix,
    // pt: 25 000) altfel testează sute de reguli pentru fiecare cuvânt verificat.
    const build = (rules, key) => {
      const all = new Map();
      const cont = new Map();
      for (const r of rules) {
        const k = key(r);
        (all.get(k) || all.set(k, []).get(k)).push(r);
        if (r.cont) (cont.get(k) || cont.set(k, []).get(k)).push(r);
      }
      const lens = (m) => Array.from(new Set(Array.from(m.keys(), (k) => k.length))).sort((x, y) => x - y);
      return { all, cont, lens: lens(all), contLens: lens(cont) };
    };
    this.sfxIdx = build(this.suffixes, (r) => r.add);
    this.pfxIdx = build(this.prefixes, (r) => r.add);
  }

  // ---------- DIC ----------
  _parseDic(dic) {
    const interned = new Map();
    const intern = (arr) => {
      if (!arr.length) return EMPTY;
      const key = arr.join('\u0001');
      let v = interned.get(key);
      if (!v) interned.set(key, (v = arr));
      return v;
    };
    const lines = dic.split(/\r\n|\n|\r/);
    let i = /^\d+\s*$/.test(lines[0] || '') ? 1 : 0;
    let entries = 0;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] === '\t' || line[0] === '#') continue;
      if (line.length > HUNSPELL_LIMITS.maxLineLength) {
        if (this.warnings.length < 200) this.warnings.push(`dic:${i + 1}: linie prea lungă; se omite`);
        continue;
      }
      const tok = line.split(/[ \t]/, 1)[0];
      if (!tok) continue;
      let slash = -1;
      for (let k = 1; k < tok.length; k++) {
        if (tok[k] === '/' && tok[k - 1] !== '\\') {
          slash = k;
          break;
        }
      }
      const word = (slash < 0 ? tok : tok.slice(0, slash)).replace(/\\\//g, '/').normalize('NFC');
      if (!word || word.length > HUNSPELL_LIMITS.maxWordLength) continue;
      const flags = slash < 0 ? EMPTY : this._flags(tok.slice(slash + 1));
      const prev = this.dict.get(word);
      if (prev) {
        this.dict.set(word, intern(Array.from(new Set([...prev, ...flags]))));
      } else {
        if (++entries > HUNSPELL_LIMITS.maxEntries) {
          this.warnings.push('dic: prea multe intrări; restul se ignoră');
          break;
        }
        this.dict.set(word, intern(flags.slice ? flags.slice() : flags));
      }
    }
  }

  // ---------- Verificare ----------
  _applyIconv(w) {
    for (const [from, to] of this.iconv) if (w.includes(from)) w = w.split(from).join(to);
    return w;
  }

  _entryOk(flags, folded) {
    const f = this.flag;
    if (hasFlag(flags, f.forbidden)) return false;
    if (hasFlag(flags, f.onlyCompound)) return false;
    if (folded && hasFlag(flags, f.keepCase)) return false;
    return true;
  }

  _stemOk(root, needFlag, folded) {
    const e = this.dict.get(root);
    return !!e && hasFlag(e, needFlag) && this._entryOk(e, folded) && !this._isForbidden(root);
  }

  _isForbidden(w) {
    const ff = this.flag.forbidden;
    if (!ff) return false;
    const e = this.dict.get(w);
    return !!e && e.includes(ff);
  }

  /** Reguli de sufix al căror `add` este un sufix al lui `w` (cu `contOnly`: doar cele cu continuări). */
  _sfxCandidates(w, contOnly = false) {
    const out = [];
    const idx = this.sfxIdx;
    const map = contOnly ? idx.cont : idx.all;
    for (const len of contOnly ? idx.contLens : idx.lens) {
      if (len > w.length) break;
      const list = map.get(len === 0 ? '' : w.slice(w.length - len));
      if (list) for (const r of list) out.push(r);
    }
    return out;
  }

  _pfxCandidates(w, contOnly = false) {
    const out = [];
    const idx = this.pfxIdx;
    const map = contOnly ? idx.cont : idx.all;
    for (const len of contOnly ? idx.contLens : idx.lens) {
      if (len > w.length) break;
      const list = map.get(w.slice(0, len));
      if (list) for (const r of list) out.push(r);
    }
    return out;
  }

  /** Verifică dacă `w` (deja normalizat la un caz) este formă validă din dicționar. */
  _stem(w, folded) {
    const e = this.dict.get(w);
    if (e && this._entryOk(e, folded) && !hasFlag(e, this.flag.needAffix)) return true;
    if (e && this._isForbidden(w)) return false;
    // sufix (+ opțional prefix, + opțional sufix intern)
    for (const sr of this._sfxCandidates(w)) {
      const root = w.slice(0, w.length - sr.add.length) + sr.strip;
      if (!root || (sr.cond && !sr.cond.test(root))) continue;
      if (this._stemOk(root, sr.flag, folded)) return true;
      // al doilea nivel de sufix: root = stem + sufix2, iar sufix2 permite sr.flag
      for (const s2 of this._sfxCandidates(root, true)) {
        if (!s2.cont.has(sr.flag)) continue;
        const stem = root.slice(0, root.length - s2.add.length) + s2.strip;
        if (!stem || (s2.cond && !s2.cond.test(stem))) continue;
        if (this._stemOk(stem, s2.flag, folded)) return true;
      }
      // prefix + sufix (produs încrucișat)
      if (sr.cross) {
        for (const pr of this._pfxCandidates(root)) {
          if (!pr.cross) continue;
          const stem = pr.strip + root.slice(pr.add.length);
          if (!stem || (pr.cond && !pr.cond.test(stem))) continue;
          const se = this.dict.get(stem);
          if (se && hasFlag(se, pr.flag) && hasFlag(se, sr.flag) && this._entryOk(se, folded)) return true;
        }
      }
    }
    // prefix singur (+ al doilea nivel de prefix)
    for (const pr of this._pfxCandidates(w)) {
      const root = pr.strip + w.slice(pr.add.length);
      if (!root || (pr.cond && !pr.cond.test(root))) continue;
      if (this._stemOk(root, pr.flag, folded)) return true;
      for (const p2 of this._pfxCandidates(root, true)) {
        if (!p2.cont.has(pr.flag)) continue;
        const stem = p2.strip + root.slice(p2.add.length);
        if (!stem || (p2.cond && !p2.cond.test(stem))) continue;
        if (this._stemOk(stem, p2.flag, folded)) return true;
      }
      // prefix → sufix intern (prefix aplicat peste o formă cu sufix)
      for (const sr of this._sfxCandidates(root)) {
        if (!pr.cross || !sr.cross) continue;
        const stem = root.slice(0, root.length - sr.add.length) + sr.strip;
        if (!stem || (sr.cond && !sr.cond.test(stem))) continue;
        const se = this.dict.get(stem);
        if (se && hasFlag(se, pr.flag) && hasFlag(se, sr.flag) && this._entryOk(se, folded)) return true;
      }
    }
    return false;
  }

  _checkVariants(w) {
    const shape = caseShape(w);
    const lower = w.toLowerCase();
    if (shape === 'lower') return this._stem(w, false);
    if (shape === 'title') return this._stem(w, false) || this._stem(lower, true);
    if (shape === 'upper') return this._stem(w, false) || this._stem(title(lower), true) || this._stem(lower, true);
    return this._stem(w, false);
  }

  _compound(w) {
    const f = this.flag;
    if (!f.compoundFlag && !f.compoundBegin) return false;
    const min = this.compoundMin;
    if (w.length < min * 2 || w.length > 100) return false;
    const part = (s, role) => {
      const e = this.dict.get(s) || this.dict.get(s.toLowerCase());
      if (!e) return false;
      if (hasFlag(e, f.compoundFlag)) return true;
      return hasFlag(e, role === 'b' ? f.compoundBegin : role === 'm' ? f.compoundMiddle : f.compoundEnd);
    };
    // programare dinamică pe poziții: O(n²) căutări, nu exponențial
    const failed = new Set();
    const rec = (pos, first) => {
      const key = pos * 2 + (first ? 1 : 0);
      if (failed.has(key)) return false;
      const rest = w.slice(pos);
      if (!first && rest.length >= min && part(rest, 'e')) return true;
      for (let i = min; i <= rest.length - min; i++) {
        if (part(rest.slice(0, i), first ? 'b' : 'm') && rec(pos + i, false)) return true;
      }
      failed.add(key);
      return false;
    };
    return rec(0, true);
  }

  /** Cuvântul este corect? */
  spell(word) {
    if (!word || typeof word !== 'string') return true;
    if (word.length > HUNSPELL_LIMITS.maxWordLength) return false;
    const hit = this._cache.get(word);
    if (hit !== undefined) return hit;
    const w = this._applyIconv(word.normalize('NFC'));
    const ok = this._spell(w, 0);
    if (this._cache.size > HUNSPELL_LIMITS.cacheEntries) this._cache.clear();
    this._cache.set(word, ok);
    return ok;
  }

  _spell(w, depth = 0) {
    if (!w || /\p{N}/u.test(w)) return true;
    if (this._isForbidden(w)) return false;
    if (this._checkVariants(w)) return true;
    if (depth > 4) return false;
    if (w.includes('-')) {
      const parts = w.split('-').filter(Boolean);
      if (parts.length > 1 && parts.length <= 12 && parts.every((p) => this._spell(p, depth + 1))) return true;
    }
    // elidare: l'homme, c'est, qu'il -> „l'” + „homme” (dicționarul franceză le tratează separat)
    const ap = w.search(/['’ʼ]/u);
    if (ap > 0 && ap < w.length - 1) {
      const left = w.slice(0, ap + 1);
      const right = w.slice(ap + 1);
      if (this._spell(left, depth + 1) && this._spell(right, depth + 1)) return true;
    }
    return this._compound(w.toLowerCase());
  }

  // ---------- Sugestii ----------
  _buildAlphabet() {
    const s = new Set();
    for (const c of Array.from(this.tryChars.toLowerCase())) s.add(c);
    for (const row of this.keyRows) for (const c of Array.from(row.toLowerCase())) s.add(c);
    if (!s.size) for (const c of 'abcdefghijklmnopqrstuvwxyz') s.add(c);
    return Array.from(s);
  }

  _buildNeighbors() {
    const n = new Map();
    const add = (a, b) => {
      if (!n.has(a)) n.set(a, new Set());
      n.get(a).add(b);
    };
    this.keyRows.forEach((row, r) => {
      const chars = Array.from(row.toLowerCase());
      chars.forEach((c, i) => {
        if (chars[i + 1]) {
          add(c, chars[i + 1]);
          add(chars[i + 1], c);
        }
        for (const dr of [-1, 1]) {
          const other = this.keyRows[r + dr];
          if (!other) continue;
          const oc = Array.from(other.toLowerCase());
          for (const j of [i - 1, i, i + 1]) if (oc[j]) add(c, oc[j]);
        }
      });
    });
    return n;
  }

  /** Aceeași literă de bază (diferă doar prin diacritice)? */
  static sameBase(a, b) {
    if (a === b) return true;
    return a.normalize('NFD')[0] === b.normalize('NFD')[0];
  }

  _altChars(c) {
    const base = c.normalize('NFD')[0];
    const out = [];
    for (const a of this._alphabet) if (a !== c && a.normalize('NFD')[0] === base) out.push(a);
    // include litera de bază, chiar dacă nu apare în TRY
    if (base !== c && !out.includes(base)) out.push(base);
    return out;
  }

  /** Distanță Damerau–Levenshtein ponderată. */
  _dist(a, b) {
    const A = Array.from(a);
    const B = Array.from(b);
    const n = A.length;
    const m = B.length;
    const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = 0; i <= n; i++) d[i][0] = i;
    for (let j = 0; j <= m; j++) d[0][j] = j;
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        let sub;
        if (A[i - 1] === B[j - 1]) sub = 0;
        else if (Hunspell.sameBase(A[i - 1], B[j - 1])) sub = 0.25;
        else if (this._neighbors.get(A[i - 1])?.has(B[j - 1])) sub = 0.7;
        else sub = 1;
        let v = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + sub);
        if (i > 1 && j > 1 && A[i - 1] === B[j - 2] && A[i - 2] === B[j - 1]) v = Math.min(v, d[i - 2][j - 2] + 0.8);
        d[i][j] = v;
      }
    }
    return d[n][m];
  }

  *_edits1(w) {
    const c = Array.from(w);
    const n = c.length;
    for (let i = 0; i < n; i++) yield c.slice(0, i).concat(c.slice(i + 1)).join('');
    for (let i = 0; i < n - 1; i++) {
      const t = c.slice();
      [t[i], t[i + 1]] = [t[i + 1], t[i]];
      yield t.join('');
    }
    for (let i = 0; i < n; i++) {
      for (const a of this._alphabet) {
        if (a === c[i]) continue;
        const t = c.slice();
        t[i] = a;
        yield t.join('');
      }
    }
    for (let i = 0; i <= n; i++) {
      for (const a of this._alphabet) yield c.slice(0, i).join('') + a + c.slice(i).join('');
    }
  }

  *_diacriticVariants(w, maxChanges = 3, cap = 1500) {
    const chars = Array.from(w);
    const positions = [];
    chars.forEach((ch, i) => {
      const alts = this._altChars(ch);
      if (alts.length) positions.push([i, alts]);
    });
    const results = [];
    const go = (pi, changes, cur) => {
      if (results.length >= cap) return;
      if (changes > 0) results.push(cur.join(''));
      if (changes >= maxChanges) return;
      for (let k = pi; k < positions.length; k++) {
        const [idx, alts] = positions[k];
        const orig = cur[idx];
        for (const a of alts) {
          cur[idx] = a;
          go(k + 1, changes + 1, cur);
        }
        cur[idx] = orig;
      }
    };
    go(0, 0, chars.slice());
    for (const r of results) yield r;
  }

  _validSurface(c) {
    if (this.spell(c)) return c;
    const t = title(c);
    if (t !== c && this.spell(t)) return t;
    return null;
  }

  _suggestible(s) {
    const e = this.dict.get(s) || this.dict.get(s.toLowerCase());
    return !(e && hasFlag(e, this.flag.noSuggest));
  }

  /**
   * Cuvântul este „aproape” corect? (diacritice schimbate, două litere adiacente inversate).
   * Ieftin: cel mult ~70 de căutări. Folosit pentru a deosebi numele proprii de greșelile de scriere.
   */
  /**
   * Cuvântul este „aproape” corect doar prin diacritice (Perez → Pérez)? Folosit pentru a distinge numele proprii
   * de greșeli. Inversările de litere adiacente NU se iau în calcul: o mulțime de nume proprii (Cairo, Lima, Oslo)
   * sunt inversări ale unor cuvinte comune (cario, mila, solo).
   */
  nearMiss(word) {
    if (typeof word !== 'string' || word.length < 3 || word.length > 40) return false;
    const lw = word.toLowerCase();
    for (const v of this._diacriticVariants(lw, 2, 40)) if (this._validSurface(v)) return true;
    return false;
  }

  /**
   * Sugestii pentru un cuvânt greșit.
   * @returns {{text:string,cost:number}[]}
   */
  suggest(word, max = 8) {
    if (typeof word !== 'string' || !word || word.length > HUNSPELL_LIMITS.cacheKeyLength) return [];
    const w = this._applyIconv(word.normalize('NFC'));
    const ap = w.search(/'/u);
    if (ap > 0 && ap < w.length - 1 && this.spell(w.slice(0, ap + 1)) && !this.spell(w.slice(ap + 1))) {
      const head = w.slice(0, ap + 1);
      return this.suggest(w.slice(ap + 1), max).map((x) => ({ text: head + x.text, cost: x.cost }));
    }
    const lw = w.toLowerCase();
    const shape = caseShape(w);
    const found = new Map(); // surface -> cost

    const consider = (cand, bonus = 0, cap = Infinity) => {
      if (!cand || cand === lw || cand === w) return;
      const surface = this._validSurface(cand);
      if (!surface || !this._suggestible(surface)) return;
      let cost = this._dist(lw, cand.toLowerCase()) + bonus;
      if (cand[0] !== lw[0] && !Hunspell.sameBase(cand[0], lw[0])) cost += 0.3;
      cost = Math.min(cost, cap);
      const out = applyShape(surface, shape === 'upper' || (shape === 'title' && surface === cand) ? shape : 'lower');
      const final = shape === 'title' && out === cand ? title(out) : out;
      const prev = found.get(final);
      if (prev === undefined || prev > cost) found.set(final, cost);
    };

    // 0. aceeași literă mică, dar cuvântul există doar cu majusculă (nume proprii: pérez → Pérez, madrid → Madrid)
    if (shape === 'lower') {
      const t = title(lw);
      if (t !== lw && this.spell(t) && !this.spell(lw)) found.set(t, 0.15);
    }
    // 1. diacritice (cel mai frecvent caz în română/franceză)
    for (const v of this._diacriticVariants(lw)) consider(v, 0);
    // 2. tabelul REP
    for (const [from, to] of this.rep) {
      let pat = from;
      const anchorStart = pat.startsWith('^');
      const anchorEnd = pat.endsWith('$');
      if (anchorStart) pat = pat.slice(1);
      if (anchorEnd) pat = pat.slice(0, -1);
      if (!pat) continue; // model gol: ar produce o buclă infinită
      let idx = lw.indexOf(pat);
      while (idx >= 0) {
        if ((!anchorStart || idx === 0) && (!anchorEnd || idx + pat.length === lw.length)) {
          const cand = lw.slice(0, idx) + to + lw.slice(idx + pat.length);
          if (cand.includes(' ')) {
            const ok = cand.split(' ').every((p) => this.spell(p));
            if (ok) found.set(cand, Math.min(found.get(cand) ?? 9, 0.9));
          } else consider(cand, 0, 0.8);
        }
        idx = lw.indexOf(pat, idx + 1);
      }
    }
    // 3. distanță de editare 1
    if (lw.length <= 40) for (const e of this._edits1(lw)) consider(e, 0);
    // 4. distanță 2 (limitat) dacă avem puține rezultate; dacă există deja o sugestie bună, doar un buget mic
    //    (altfel un cuvânt de 11 litere în franceză ajungea la ~5 s)
    if (lw.length >= 5 && lw.length <= 14 && (found.size < 2 || Math.min(...found.values()) > 1.05)) {
      let budget = found.size && Math.min(...found.values()) <= 1.05 ? 2500 : 60000;
      const firstLevel = Array.from(this._edits1(lw)).filter((e) => e.length < lw.length || e === lw);
      const seen = new Set();
      outer: for (const e1 of firstLevel.slice(0, 120)) {
        for (const e2 of this._edits1(e1)) {
          if (seen.has(e2)) continue;
          seen.add(e2);
          if (--budget < 0) break outer;
          consider(e2, 0.2);
        }
        if (found.size >= 6) break;
      }
    }
    // 5. separare în două cuvinte
    if (lw.length >= 4) {
      for (let i = 2; i <= lw.length - 2; i++) {
        const a = lw.slice(0, i);
        const b = lw.slice(i);
        if (this.spell(a) && this.spell(b)) {
          const s = applyShape(a, shape === 'title' ? 'title' : 'lower') + ' ' + b;
          if (!found.has(s)) found.set(s, 1.4 + (i < 3 ? 0.4 : 0));
        }
      }
    }
    return Array.from(found, ([text, cost]) => ({ text, cost }))
      .sort((a, b) => a.cost - b.cost || Math.abs(a.text.length - w.length) - Math.abs(b.text.length - w.length) || a.text.localeCompare(b.text))
      .slice(0, max);
  }
}
