// Implementare proprie (clean-room) a formatului Hunspell .aff/.dic:
// parser, verificare cu prefixe/sufixe (inclusiv două niveluri), compuse simple
// și generare de sugestii. Scrisă pornind de la descrierea publică a formatului.

import { caseShape, applyShape, title } from './text.js';

const hasFlag = (flags, f) => !!f && !!flags && flags.includes(f);

function parseFlags(str, mode) {
  if (!str) return [];
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

export class Hunspell {
  constructor(aff, dic, { name = '' } = {}) {
    this.name = name;
    this.flagMode = 'ascii';
    this.tryChars = '';
    this.keyRows = [];
    this.rep = [];
    this.iconv = [];
    this.maps = [];
    this.flag = {};
    this.compoundMin = 3;
    this.prefixes = [];
    this.suffixes = [];
    this._parseAff(aff);
    this._buildIndex();
    this._parseDic(dic);
    this._cache = new Map();
    this._alphabet = this._buildAlphabet();
    this._neighbors = this._buildNeighbors();
  }

  // ---------- AFF ----------
  _parseAff(aff) {
    const blocks = new Map();
    const lines = aff.replace(/^﻿/, '').split(/\r?\n/);
    for (const raw of lines) {
      const line = raw.trim();
      if (!line || line[0] === '#') continue;
      const t = line.split(/\s+/);
      const k = t[0];
      if (k === 'FLAG') {
        this.flagMode = t[1] === 'long' ? 'long' : t[1] === 'num' ? 'num' : 'utf8';
      } else if (k === 'TRY') this.tryChars = t[1] || '';
      else if (k === 'KEY') this.keyRows = (t[1] || '').split('|');
      else if (k === 'REP' && t.length >= 3) this.rep.push([t[1], t[2].replace(/_/g, ' ')]);
      else if (k === 'ICONV' && t.length >= 3) this.iconv.push([t[1], t[2]]);
      else if (k === 'MAP' && t.length === 2 && !/^\d+$/.test(t[1])) this.maps.push(Array.from(t[1]));
      else if (k === 'COMPOUNDMIN') this.compoundMin = parseInt(t[1], 10) || 3;
      else if (NAMED[k] && t[1]) this.flag[NAMED[k]] = parseFlags(t[1], this.flagMode)[0];
      else if (k === 'PFX' || k === 'SFX') {
        const isHeader = t.length === 4 && /^[YN]$/.test(t[2]) && /^\d+$/.test(t[3]);
        if (isHeader) {
          blocks.set(k + t[1], t[2] === 'Y');
          continue;
        }
        if (t.length < 4) continue;
        const [strip0, addFull] = [t[2], t[3]];
        const cond = t[4] || '.';
        const sl = addFull.indexOf('/');
        let add = sl < 0 ? addFull : addFull.slice(0, sl);
        const contStr = sl < 0 ? '' : addFull.slice(sl + 1);
        if (add === '0') add = '';
        const strip = strip0 === '0' ? '' : strip0;
        let re = null;
        if (cond !== '.') {
          try {
            re = new RegExp(k === 'SFX' ? `(?:${cond})$` : `^(?:${cond})`, 'u');
          } catch {
            continue;
          }
        }
        const rule = {
          flag: t[1],
          cross: blocks.get(k + t[1]) ?? true,
          strip,
          add,
          cond: re,
          cont: contStr ? new Set(parseFlags(contStr, this.flagMode)) : null,
        };
        (k === 'SFX' ? this.suffixes : this.prefixes).push(rule);
      }
    }
  }

  _buildIndex() {
    this.sfxIdx = new Map();
    this.pfxIdx = new Map();
    for (const r of this.suffixes) {
      const key = r.add ? r.add[r.add.length - 1] : '';
      (this.sfxIdx.get(key) || this.sfxIdx.set(key, []).get(key)).push(r);
    }
    for (const r of this.prefixes) {
      const key = r.add ? r.add[0] : '';
      (this.pfxIdx.get(key) || this.pfxIdx.set(key, []).get(key)).push(r);
    }
  }

  // ---------- DIC ----------
  _parseDic(dic) {
    this.dict = new Map();
    const interned = new Map();
    const intern = (arr) => {
      const key = arr.join('\u0001');
      let v = interned.get(key);
      if (!v) interned.set(key, (v = arr));
      return v;
    };
    const lines = dic.replace(/^﻿/, '').split(/\r?\n/);
    let i = /^\d+\s*$/.test(lines[0] || '') ? 1 : 0;
    for (; i < lines.length; i++) {
      const line = lines[i];
      if (!line || line[0] === '\t' || line[0] === '#') continue;
      const tok = line.split(/[ \t]/, 1)[0];
      let slash = -1;
      for (let k = 1; k < tok.length; k++) {
        if (tok[k] === '/' && tok[k - 1] !== '\\') {
          slash = k;
          break;
        }
      }
      const word = (slash < 0 ? tok : tok.slice(0, slash)).replace(/\\\//g, '/');
      const flags = slash < 0 ? [] : parseFlags(tok.slice(slash + 1), this.flagMode);
      const prev = this.dict.get(word);
      if (prev) {
        const merged = Array.from(new Set([...prev, ...flags]));
        this.dict.set(word, intern(merged));
      } else this.dict.set(word, intern(flags));
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

  _sfxCandidates(w) {
    const out = [];
    const last = w[w.length - 1];
    for (const r of this.sfxIdx.get(last) || []) if (w.endsWith(r.add)) out.push(r);
    for (const r of this.sfxIdx.get('') || []) out.push(r);
    return out;
  }

  _pfxCandidates(w) {
    const out = [];
    for (const r of this.pfxIdx.get(w[0]) || []) if (w.startsWith(r.add)) out.push(r);
    for (const r of this.pfxIdx.get('') || []) out.push(r);
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
      for (const s2 of this._sfxCandidates(root)) {
        if (!s2.cont || !s2.cont.has(sr.flag)) continue;
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
      for (const p2 of this._pfxCandidates(root)) {
        if (!p2.cont || !p2.cont.has(pr.flag)) continue;
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
    const part = (s, role) => {
      const e = this.dict.get(s) || this.dict.get(s.toLowerCase());
      if (!e) return false;
      if (hasFlag(e, f.compoundFlag)) return true;
      return hasFlag(e, role === 'b' ? f.compoundBegin : role === 'm' ? f.compoundMiddle : f.compoundEnd);
    };
    const rec = (rest, first) => {
      if (rest.length >= min && part(rest, 'e') && !first) return true;
      for (let i = min; i <= rest.length - min; i++) {
        if (part(rest.slice(0, i), first ? 'b' : 'm') && rec(rest.slice(i), false)) return true;
      }
      return false;
    };
    return w.length >= min * 2 && rec(w, true);
  }

  /** Cuvântul este corect? */
  spell(word) {
    if (!word) return true;
    const hit = this._cache.get(word);
    if (hit !== undefined) return hit;
    const w = this._applyIconv(word.normalize('NFC'));
    let ok = this._spell(w);
    if (this._cache.size > 60000) this._cache.clear();
    this._cache.set(word, ok);
    return ok;
  }

  _spell(w) {
    if (!w || /^[\p{N}]+$/u.test(w) || /\p{N}/u.test(w)) return true;
    if (this._isForbidden(w)) return false;
    if (this._checkVariants(w)) return true;
    if (w.includes('-')) {
      const parts = w.split('-').filter(Boolean);
      if (parts.length > 1 && parts.every((p) => this._spell(p))) return true;
    }
    // elidare: l'homme, c'est, qu'il -> „l'” + „homme” (dicționarul franceză le tratează separat)
    const ap = w.search(/['’ʼ]/u);
    if (ap > 0 && ap < w.length - 1) {
      const left = w.slice(0, ap + 1);
      const right = w.slice(ap + 1);
      if (this._spell(left) && this._spell(right)) return true;
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
   * Sugestii pentru un cuvânt greșit.
   * @returns {{text:string,cost:number}[]}
   */
  suggest(word, max = 8) {
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

    // 1. diacritice (cel mai frecvent caz în română/franceză)
    for (const v of this._diacriticVariants(lw)) consider(v, 0);
    // 2. tabelul REP
    for (const [from, to] of this.rep) {
      let pat = from;
      const anchorStart = pat.startsWith('^');
      const anchorEnd = pat.endsWith('$');
      if (anchorStart) pat = pat.slice(1);
      if (anchorEnd) pat = pat.slice(0, -1);
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
    // 4. distanță 2 (limitat) dacă avem puține rezultate
    if (lw.length >= 5 && lw.length <= 14 && (found.size < 2 || Math.min(...found.values()) > 1.05)) {
      const firstLevel = Array.from(this._edits1(lw)).filter((e) => e.length < lw.length || e === lw);
      const seen = new Set();
      for (const e1 of firstLevel.slice(0, 120)) {
        for (const e2 of this._edits1(e1)) {
          if (seen.has(e2)) continue;
          seen.add(e2);
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
