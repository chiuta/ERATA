// Motorul ERATA: orchestrează detecția limbii, verificarea ortografică (Hunspell propriu),
// regulile gramaticale/tipografice/de stil și sugestiile. Funcționează în orice mediu JS.

import { Hunspell } from './hunspell.js';
import { tokenize, splitParagraphs, chunkRanges, isCodeLike, isLatin, caseShape } from './text.js';
import { detectLanguage, detectParagraphLanguage, analysisText, scoreLanguages, foreignQuoteSpans, STOPWORDS } from './langid.js';
import { commonRules } from './rules/common.js';
import { roPack, roRules } from './rules/ro.js';
import { enPack, enRules } from './rules/en.js';
import { frPack, frRules } from './rules/fr.js';
import { esPack, esRules } from './rules/es.js';
import { styleRules, readability } from './style.js';
import { M } from './rules/util.js';
import { lexiconHas } from './lexicon.js';
import { compileUserRule, expandReplacement } from './userrules.js';

import { ptPack, ptRules } from './rules/pt.js';
import { dePack, deRules } from './rules/de.js';
import { itPack, itRules } from './rules/it.js';

export const LANGUAGES = {
  ro: { name: 'Română', pack: roPack, rules: roRules, dicts: ['ro'] },
  en: { name: 'English', pack: enPack, rules: enRules, dicts: ['en', 'en-GB'] },
  fr: { name: 'Français', pack: frPack, rules: frRules, dicts: ['fr'] },
  es: { name: 'Español', pack: esPack, rules: esRules, dicts: ['es'] },
  pt: { name: 'Português', pack: ptPack, rules: ptRules, dicts: ['pt'] },
  de: { name: 'Deutsch', pack: dePack, rules: deRules, dicts: ['de'] },
  it: { name: 'Italiano', pack: itPack, rules: itRules, dicts: ['it'] },
};

const PRIORITY = { RULE: 4, punctuation: 3.5, DICT: 3, typography: 2, style: 1 };
const SPELL_MSG = M('Posibilă greșeală de ortografie', 'Possible spelling mistake', {
  fr: 'Faute d’orthographe possible',
  es: 'Posible error ortográfico',
});

const CATS = ['spelling', 'grammar', 'punctuation', 'typography', 'style'];
export const DEFAULT_OPTS = {
  lang: 'auto',
  defaultLang: 'ro',
  enVariant: 'auto',
  ui: 'ro',
  categories: { spelling: true, grammar: true, punctuation: true, typography: true, style: true },
  disabledRules: [],
  personal: [],
  userRules: [],
  longSentence: 40,
};

// ---- limite de siguranță (timp și memorie) ----
export const LIMITS = {
  chunk: 20000, // un paragraf mai lung se verifică pe bucăți de atâtea caractere
  userWindow: 1500, // regulile utilizatorului rulează pe ferestre scurte
  matchesPerParagraph: 5000,
  matchesTotal: 5000, // plafon global; stats.truncated=true când este atins
  cacheEntries: 600,
  cacheChars: 3_000_000,
  langSample: 200_000,
  readabilitySample: 200_000,
  maxWord: 64, // sugestiile se calculează doar pentru cuvinte mai scurte
  fixSuggestions: 400,
  fixMillis: 6000, // după acest timp, fixAll nu mai calculează sugestii noi
  maxMillis: 15000, // plafon de timp pentru o verificare (la granița bucăților de 20 000 de caractere)
  nameChecks: 20, langDictCover: 0.85, // cuvinte distincte cu majusculă verificate „aproape corect” pe bucată
};

const LANG_RE = /^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$/;
const DICT_NAME_RE = /^[A-Za-z0-9][A-Za-z0-9_-]{0,15}$/;
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
const cleanLang = (l) => (typeof l === 'string' && LANG_RE.test(l) ? l : null);
const strList = (x, max = 20000) => (Array.isArray(x) ? x.filter((v) => typeof v === 'string' && v.length < 200).slice(0, max) : []);
const TITLE_RE = /^\p{Lu}\p{Ll}{2,}$/u;
const SENT_END = /[.!?…]/;

/** Normalizează opțiunile primite din exterior: tipuri greșite, limbi inexistente, liste murdare. */
export function normalizeOptions(options) {
  const o = options && typeof options === 'object' ? options : {};
  const opts = { ...DEFAULT_OPTS, ...o };
  opts.lang = o.lang === undefined || o.lang === 'auto' ? 'auto' : cleanLang(o.lang) || 'auto';
  opts.defaultLang = cleanLang(opts.defaultLang) || 'ro';
  opts.enVariant = ['auto', 'gb', 'us'].includes(opts.enVariant) ? opts.enVariant : 'auto';
  opts.ui = typeof opts.ui === 'string' && opts.ui.length < 12 ? opts.ui : 'ro';
  const cats = o.categories && typeof o.categories === 'object' ? o.categories : {};
  opts.categories = {};
  for (const k of CATS) opts.categories[k] = k in cats ? !!cats[k] : true;
  opts.disabledRules = strList(opts.disabledRules, 5000);
  opts.personal = strList(opts.personal);
  opts.userRules = Array.isArray(opts.userRules) ? opts.userRules.filter((r) => r && typeof r === 'object').slice(0, 200) : [];
  opts.longSentence = Number.isFinite(opts.longSentence) ? Math.max(5, Math.min(1000, opts.longSentence)) : 40;
  opts.maxMs = Number.isFinite(opts.maxMs) ? Math.max(50, Math.min(600000, opts.maxMs)) : LIMITS.maxMillis;
  return opts;
}

function pickMsg(m, ui) {
  if (!m) return '';
  if (typeof m === 'string') return m;
  return m[ui] || m.en || m.ro || Object.values(m)[0];
}

const isHi = (c) => c >= 0xd800 && c <= 0xdbff;
const isLo = (c) => c >= 0xdc00 && c <= 0xdfff;

/** Primul cuvânt dintr-o propoziție (după spații, ghilimele, linii de dialog)? */
function atSentenceStart(text, pos, abbr) {
  let i = pos - 1;
  for (let guard = 0; i >= 0 && guard < 16; guard++, i--) {
    const c = text[i];
    if (c === '\n' || c === '\r') return true;
    if (' \t  "“”„«»‘’\'([—–-¿¡*_'.includes(c)) continue;
    if (c === '.' && abbr && abbr.size) {
      // „Mr. Kowalski”, „Dr. Popescu”: după o abreviere de titlu nu începe o propoziție
      let j = i;
      while (j > 0 && /\p{L}/u.test(text[j - 1]) && i - j < 12) j--;
      if (j < i && abbr.has(text.slice(j, i).toLowerCase())) return false;
    }
    return SENT_END.test(c);
  }
  return i < 0;
}

export class Erata {
  /**
   * @param {{loadDict:(name:string)=>Promise<{aff:string,dic:string}|null>}} deps
   */
  constructor({ loadDict }) {
    this.loadDict = loadDict;
    this._dicts = new Map();
    this._cache = new Map();
    this._cacheChars = 0;
    this._sigs = new Map();
    this._sigSeq = 0;
    this._gen = 0; // crește la fiecare invalidare: rezultatele calculate înainte nu se mai păstrează
    this._nameCache = new Map();
    this.extraLangs = new Set(); // limbi cu dicționar importat
  }

  async _dict(name) {
    if (typeof name !== 'string' || !DICT_NAME_RE.test(name)) return null;
    const hit = this._dicts.get(name);
    if (hit && (!hit.failedAt || Date.now() - hit.failedAt < 30000)) return hit.p;
    const entry = { p: null, failedAt: 0 };
    entry.p = (async () => {
      try {
        const d = await this.loadDict(name);
        const h = d && d.aff != null && d.dic != null ? new Hunspell(d.aff, d.dic, { name }) : null;
        if (h) entry.done = true;
        return h;
      } catch {
        entry.failedAt = Date.now(); // eșec trecător: se reîncearcă după 30 s, iar rezultatele nu intră în cache
        return null;
      }
    })();
    this._dicts.set(name, entry);
    return entry.p;
  }

  _hasFailedDict() {
    for (const e of this._dicts.values()) if (e.failedAt && Date.now() - e.failedAt < 30000) return true;
    return false;
  }

  invalidate(name) {
    if (name) this._dicts.delete(name);
    else this._dicts.clear();
    this._clearCache();
    this._nameCache.clear();
  }

  _clearCache() {
    this._gen++;
    this._cache.clear();
    this._cacheChars = 0;
  }

  _cachePut(key, value, chars) {
    this._cache.set(key, value);
    this._cacheChars += chars;
    while (this._cache.size > LIMITS.cacheEntries || this._cacheChars > LIMITS.cacheChars) {
      const k = this._cache.keys().next().value;
      if (k === undefined) break;
      // lungimea textului este în cheie: o scădem aproximativ (cheia = limbă|sig|text)
      this._cacheChars -= Math.max(0, k.length - k.indexOf('\u0001', k.indexOf('\u0001') + 1) - 1);
      this._cache.delete(k);
    }
  }

  _sigId(opts) {
    const s = JSON.stringify([opts.categories, opts.disabledRules, opts.userRules, opts.enVariant, opts.ui, opts.longSentence, opts.personal]);
    let id = this._sigs.get(s);
    if (!id) {
      if (this._sigs.size >= 64) {
        this._sigs.clear();
        this._clearCache();
      }
      id = ++this._sigSeq;
      this._sigs.set(s, id);
    }
    return id;
  }

  /** Întoarce un „verificator”: { spell(w), suggest(w), has } pentru limbă. */
  async speller(lang, opts = DEFAULT_OPTS) {
    const lc = cleanLang(lang);
    if (!lc) return null;
    const def = hasOwn(LANGUAGES, lc) ? LANGUAGES[lc] : null;
    const names = def ? [...def.dicts] : [lc];
    let use = names;
    if (lc === 'en') use = opts.enVariant === 'gb' ? ['en-GB'] : opts.enVariant === 'us' ? ['en'] : ['en', 'en-GB'];
    const dicts = (await Promise.all(use.map((n) => this._dict(n)))).filter(Boolean);
    if (!dicts.length) return null;
    const pack = def?.pack;
    const norm = pack?.normalize || ((w) => w);
    const base = (x) => dicts.some((d) => d.spell(x));
    const memo = new Map();
    return {
      lang: lc,
      dicts,
      spell: (w) => {
        const x = norm(w);
        if (base(x)) return true;
        if (x.length > LIMITS.maxWord) return false;
        let v = memo.get(x);
        if (v === undefined) {
          v = lexiconHas(lc, x) || (pack?.altSpell ? !!pack.altSpell(x, base) : false);
          if (memo.size > 5000) memo.clear();
          memo.set(x, v);
        }
        return v;
      },
      /** Cuvântul este „aproape” corect (diacritice, inversare, tastă vecină)? Folosit pentru a distinge numele proprii de greșeli. */
      nearMiss: (w) => dicts.some((d) => d.nearMiss(norm(w))),
      suggest: (w, max = 8) => {
        if (typeof w !== 'string' || w.length > LIMITS.maxWord) return [];
        const x = norm(w);
        const seen = new Map();
        for (const d of dicts) for (const s of d.suggest(x, max)) if (!seen.has(s.text) || seen.get(s.text) > s.cost) seen.set(s.text, s.cost);
        const boost = pack?.boost;
        return Array.from(seen, ([text, cost]) => ({ text, cost: boost ? cost - boost(text) : cost }))
          .sort((a, b) => a.cost - b.cost)
          .slice(0, max);
      },
    };
  }

  supported() {
    return [...Object.keys(LANGUAGES), ...this.extraLangs];
  }

  /**
   * Limba unui paragraf. Cuvintele funcționale decid când dovezile sunt clare; la texte scurte sau ambigue
   * decide acoperirea de către dicționarele candidatelor (primele 3 limbi cu dicționar).
   */
  async _paragraphLang(text, opts, docLang) {
    if (opts.lang && opts.lang !== 'auto') return opts.lang;
    const fallback = docLang || opts.defaultLang || 'ro';
    const at = analysisText(text);
    const { ranked, words } = scoreLanguages(at);
    const top = ranked[0];
    if (!top || words < 3) return fallback;
    const conf = top[1] >= 0.9 && ranked[1] ? (top[1] - ranked[1][1]) / top[1] : top[1] >= 0.9 ? 1 : 0;
    if (conf >= 0.5 && top[1] >= 4) return top[0];
    // candidate cu dicționar: primele 3 limbi (după cuvinte funcționale) + cele al căror dicționar e deja încărcat
    const cands = [];
    const seenL = new Set();
    for (const [l, sc] of ranked) {
      if (cands.length >= 3) break;
      const sp = await this.speller(l, opts);
      if (sp) { cands.push([l, sc, sp]); seenL.add(l); }
    }
    for (const [l, sc] of ranked) {
      if (seenL.has(l) || !hasOwn(LANGUAGES, l) || !this._loadedDict(l)) continue;
      const sp = await this.speller(l, opts);
      if (sp) { cands.push([l, sc, sp]); seenL.add(l); }
    }
    const topHasDict = seenL.has(top[0]);
    if (!cands.length) return conf >= 0.2 ? top[0] : fallback;
    // limbă fără dicționar (de, it, nl) cu dovezi clare: rămâne decizia pe cuvinte funcționale
    if (!topHasDict && conf >= 0.4 && top[1] >= 2) return top[0];
    const toks = [];
    const re = /\p{L}+(?:['’]\p{L}+)*/gu;
    let m;
    while ((m = re.exec(at)) && toks.length < 80) {
      if (m[0].length < 2) continue;
      // nume proprii (majuscule în interiorul propoziției) nu spun nimic despre limbă
      if (m.index > 0 && /\p{Lu}/u.test(m[0][0]) && !/[.!?…:]\s*$/u.test(at.slice(Math.max(0, m.index - 4), m.index)) && !/[«“„"(]$/.test(at.slice(Math.max(0, m.index - 1), m.index))) continue;
      toks.push(m[0]);
    }
    if (toks.length < 2) return conf >= 0.2 ? top[0] : fallback;
    const best = Math.max(top[1], 1);
    const scored = [];
    for (const [l, s, sp] of cands) {
      let ok = 0;
      for (const w of toks) if (sp.spell(w)) ok++;
      const cov = ok / toks.length;
      scored.push({ l, cov, score: cov + 0.3 * (s / best) });
    }
    scored.sort((a, b) => b.score - a.score);
    const pick = scored[0];
    if (!topHasDict) {
      // doar o acoperire foarte bună a unei alte limbi (≥ 3 cuvinte) poate înlocui o limbă fără dicționar
      return toks.length >= 3 && pick.cov >= LIMITS.langDictCover ? pick.l : conf >= 0.1 ? top[0] : fallback;
    }
    // dicționarele cunoscute acoperă slab textul, iar o limbă fără dicționar are dovezi comparabile: ea câștigă
    const dl = ranked.find(([l]) => !seenL.has(l));
    if (dl && dl[1] >= 0.3 && dl[1] >= 0.7 * top[1] && pick.cov < 0.8) return dl[0];
    // egalitate între candidate: nu ghicim; rămâne limba documentului dacă e printre ele
    const tied = scored.filter((x) => x.score >= pick.score - 0.04).map((x) => x.l);
    if (tied.length > 1) return tied.includes(fallback) ? fallback : conf >= 0.2 ? top[0] : fallback;
    if (pick.cov >= 0.4) return pick.l;
    return conf >= 0.2 ? top[0] : fallback;
  }

  /** Dicționarul limbii este deja încărcat (fără a declanșa încărcarea)? */
  _loadedDict(lang) {
    const names = lang === 'en' ? ['en', 'en-GB'] : LANGUAGES[lang]?.dicts || [];
    return names.some((n) => {
      const e = this._dicts.get(n);
      return e && e.done;
    });
  }

  /** Paragrafe (linii nevide), cele foarte lungi fiind tăiate în bucăți. */
  _segments(text) {
    const out = [];
    for (const p of splitParagraphs(text)) {
      if (p.text.length <= LIMITS.chunk) {
        out.push(p);
        continue;
      }
      for (const r of chunkRanges(p.text, LIMITS.chunk)) {
        const t = p.text.slice(r.start, r.end);
        if (t.trim()) out.push({ start: p.start + r.start, end: p.start + r.end, text: t });
      }
    }
    return out;
  }

  /**
   * Verifică un text. Întoarce potriviri cu offset relativ la text.
   * @returns {Promise<{lang:string, matches:object[], stats:object}>}
   */
  async check(text, options = {}) {
    const r = await this._run(text, options);
    return { lang: r.lang, matches: r.matches, stats: r.stats };
  }

  async _run(text, options) {
    text = typeof text === 'string' ? text : text == null ? '' : String(text);
    const opts = normalizeOptions(options);
    const segs = this._segments(text);
    let docLang = opts.lang;
    if (docLang === 'auto') {
      const d = detectLanguage(text.length > LIMITS.langSample ? text.slice(0, LIMITS.langSample) : text);
      docLang = d && d.confidence >= 0.15 ? d.lang : opts.defaultLang;
    }
    const sigId = this._sigId(opts);
    const all = [];
    const segLang = [];
    const langCount = {};
    let truncated = false;
    let timedOut = false;
    const t0 = Date.now();
    for (const p of segs) {
      if (all.length >= LIMITS.matchesTotal) {
        truncated = true;
        break;
      }
      if (Date.now() - t0 > opts.maxMs) {
        truncated = timedOut = true;
        break;
      }
      const lang = await this._paragraphLang(p.text, opts, docLang);
      segLang.push({ start: p.start, end: p.end, lang });
      langCount[lang] = (langCount[lang] || 0) + p.text.length;
      const key = `${lang}\u0001${sigId}\u0001${p.text}`;
      let ms = this._cache.get(key);
      if (!ms) {
        const gen = this._gen;
        ms = await this._checkParagraph(p.text, lang, opts);
        if (gen === this._gen && !this._hasFailedDict()) this._cachePut(key, ms, p.text.length);
      }
      for (const m of ms) {
        if (all.length >= LIMITS.matchesTotal) {
          truncated = true;
          break;
        }
        all.push({ ...m, r: m.r ? m.r.slice() : m.r, o: m.o + p.start });
      }
    }
    this._dropRepeatedNames(all, text);
    const mainLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] || docLang;
    const sample = text.length > LIMITS.readabilitySample ? text.slice(0, LIMITS.readabilitySample) : text;
    const stats = { lang: mainLang, readability: readability(sample, mainLang), chars: text.length };
    if (truncated) stats.truncated = true;
    if (timedOut) stats.timedOut = true;
    return { lang: mainLang, matches: all, stats, segLang, opts };
  }

  /** Un nume propriu necunoscut care apare de cel puțin două ori în text nu este o greșeală de scriere. */
  _dropRepeatedNames(all, text) {
    const names = new Set();
    for (const m of all) if (m.nm) names.add(m.word);
    if (names.size) {
      const counts = new Map();
      for (const x of text.matchAll(/(?<![\p{L}\p{M}\p{N}])\p{Lu}\p{Ll}+(?![\p{L}\p{M}\p{N}])/gu)) if (names.has(x[0])) counts.set(x[0], (counts.get(x[0]) || 0) + 1);
      let j = 0;
      for (let i = 0; i < all.length; i++) {
        const m = all[i];
        if (m.nm && (counts.get(m.word) || 0) >= 2) continue;
        all[j++] = m;
      }
      all.length = j;
    }
    for (const m of all) if ('nm' in m) delete m.nm;
  }

  async _checkParagraph(text, lang, opts) {
    const def = hasOwn(LANGUAGES, lang) ? LANGUAGES[lang] : null;
    const pack = def?.pack || {};
    const sp = await this.speller(lang, opts);
    const tokens = tokenize(text);
    const words = tokens.filter((t) => t.type === 'word');
    const prot = tokens.filter((t) => t.type === 'url' || t.type === 'email' || t.type === 'tag');
    const out = [];
    const personal = new Set(opts.personal.map((w) => w.toLowerCase()));
    const disabled = new Set(opts.disabledRules);
    const ui = opts.ui;

    const ctx = {
      text,
      tokens,
      words,
      lang,
      pack,
      opts,
      spell: (w) => (sp ? sp.spell(w) : true),
      protectedAt: (pos) => {
        let lo = 0, hi = prot.length - 1;
        while (lo <= hi) {
          const mid = (lo + hi) >> 1;
          const t = prot[mid];
          if (pos < t.start) hi = mid - 1;
          else if (pos >= t.end) lo = mid + 1;
          else return true;
        }
        return false;
      },
      add: (m) => {
        let { offset, length } = m;
        if (!Number.isFinite(offset) || !Number.isFinite(length)) return;
        let rep = m.rep || [];
        if (offset < 0 || offset > text.length) return;
        if (length === 0 && offset < text.length) {
          // inserție: ancorăm la caracterul (punctul de cod) următor
          const cp = String.fromCodePoint(text.codePointAt(offset));
          rep = rep.map((r) => r + cp);
          length = cp.length;
        }
        if (length <= 0 || offset + length > text.length) return;
        // niciodată în mijlocul unei perechi surogat
        if (offset > 0 && isLo(text.charCodeAt(offset)) && isHi(text.charCodeAt(offset - 1))) {
          offset--;
          length++;
        }
        const e = offset + length;
        if (e < text.length && isHi(text.charCodeAt(e - 1)) && isLo(text.charCodeAt(e))) length++;
        if (rep.length === 1 && rep[0] === text.slice(offset, offset + length)) return; // fără schimbare reală
        out.push({
          o: offset,
          l: length,
          id: m.id || ctx.ruleId,
          c: m.cat || ctx.cat,
          m: pickMsg(m.msg, ui),
          r: rep,
          af: !!m.autofix,
          sev: m.sev || undefined,
          pr: m.pr ?? undefined,
        });
      },
    };

    // 1. ortografie
    if (sp && opts.categories.spelling && !disabled.has('SPELLING')) {
      const abbr = pack.abbr;
      const nameMemo = new Map();
      let nameBudget = LIMITS.nameChecks;
      for (const t of words) {
        const w = t.text;
        if (w.length < 2 || !isLatin(w)) continue;
        if (/^\p{Lu}+$/u.test(w) && w.length <= 6 && !ctx.spell(w)) continue; // acronim
        if (isCodeLike(text, t) || personal.has(w.toLowerCase())) continue;
        if (ctx.spell(w)) continue;
        if (w.includes('-') && pack.hyphenOk && pack.hyphenOk.call(pack, w.split('-'), ctx.spell)) continue;
        if (abbr && abbr.has(w.toLowerCase()) && text[t.end] === '.') continue; // „Lda.”, „Ltd.”
        let nm = false;
        if (TITLE_RE.test(w)) {
          // nearMiss costă câteva sute de căutări: cel mult `nameBudget` cuvinte distincte pe bucată (determinist),
          // iar restul se tratează ca nume proprii
          nm = nameMemo.get(w);
          if (nm === undefined) {
            nm = nameBudget > 0 ? !sp.nearMiss(w) : true;
            nameBudget--;
            nameMemo.set(w, nm);
          }
          if (nm && !atSentenceStart(text, t.start, abbr)) continue; // nume propriu în interiorul propoziției
        }
        const rec = { o: t.start, l: w.length, id: 'SPELLING', c: 'spelling', m: pickMsg(SPELL_MSG, ui), r: null, word: w, pr: PRIORITY.DICT };
        if (nm) rec.nm = true;
        out.push(rec);
      }
    }

    // 2. reguli: comune + limbă + stil + ale utilizatorului
    const run = (rules) => {
      for (const r of rules) {
        if (disabled.has(r.id) || !opts.categories[r.cat]) continue;
        ctx.ruleId = r.id;
        ctx.cat = r.cat;
        try {
          r.run(ctx);
        } catch (e) {
          // o regulă defectă nu trebuie să oprească verificarea
          if (typeof console !== 'undefined' && opts.debug) console.warn('rule failed', r.id, e);
        }
      }
    };
    run(commonRules);
    if (def) run(def.rules);
    if (opts.categories.style) run(styleRules);
    this._userRules(ctx, opts.userRules, lang, disabled);

    // 3. filtrare după categorii + rezolvare suprapuneri
    // citatele clar străine (≥4 cuvinte) nu primesc alarme de ortografie/gramatică/stil
    const foreign = foreignQuoteSpans(text, lang);
    const inForeign = foreign.length
      ? (m) => (m.c === 'spelling' || m.c === 'grammar' || m.c === 'style') && foreign.some((f) => m.o >= f.start && m.o + m.l <= f.end)
      : () => false;
    const kept = out.filter((m) => opts.categories[m.c] !== false && !disabled.has(m.id) && !inForeign(m));
    const prio = (m) => m.pr ?? (m.c === 'style' ? PRIORITY.style : m.c === 'typography' ? PRIORITY.typography : m.c === 'punctuation' ? PRIORITY.punctuation : PRIORITY.RULE);
    const order = kept.slice().sort((a, b) => prio(b) - prio(a) || a.o - b.o || b.l - a.l);
    const taken = []; // disjuncte, sortate după offset
    for (const m of order) {
      if (taken.length >= LIMITS.matchesPerParagraph) break;
      let lo = 0, hi = taken.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (taken[mid].o < m.o) lo = mid + 1;
        else hi = mid;
      }
      const prev = taken[lo - 1], next = taken[lo];
      if (prev && prev.o + prev.l > m.o) continue;
      if (next && m.o + m.l > next.o) continue;
      taken.splice(lo, 0, m);
    }
    return taken.map(({ pr, ...m }) => m);
  }

  _userRules(ctx, rules, lang, disabled) {
    if (!rules.length) return;
    const compiled = [];
    for (const ur of rules) {
      if (!ur || ur.enabled === false || (typeof ur.id === 'string' && disabled.has(ur.id))) continue;
      if (ur.lang && ur.lang !== 'all' && ur.lang !== lang) continue;
      const c = compileUserRule(ur, CATS);
      if (c) compiled.push(c);
    }
    if (!compiled.length) return;
    const wins = chunkRanges(ctx.text, LIMITS.userWindow);
    const t0 = Date.now();
    for (const c of compiled) {
      let n = 0;
      let iters = 0;
      outer: for (const w of wins) {
        if (Date.now() - t0 > 400) return; // plafon de timp pentru ansamblul regulilor utilizatorului
        const seg = wins.length === 1 ? ctx.text : ctx.text.slice(w.start, w.end);
        for (const m of seg.matchAll(c.re)) {
          if (++iters > 5000) break outer;
          if (!m[0].length) continue;
          if (++n > 200) break outer;
          ctx.add({
            offset: w.start + m.index,
            length: m[0].length,
            id: c.id,
            cat: c.cat,
            rep: c.replacement != null ? [expandReplacement(c.replacement, m)] : [],
            msg: c.message,
          });
        }
      }
    }
  }

  /** Sugestii pentru un cuvânt (la cerere, pentru că sunt mai costisitoare). */
  async suggest(word, options = {}) {
    const opts = normalizeOptions(options);
    const ctxText = typeof options?.context === 'string' ? options.context.slice(0, 5000) : null;
    const lang = opts.lang !== 'auto' ? opts.lang : detectLanguage(ctxText || (typeof word === 'string' ? word : ''))?.lang || opts.defaultLang;
    if (typeof word !== 'string' || !word || word.length > LIMITS.maxWord) return { lang, suggestions: [] };
    const sp = await this.speller(lang, opts);
    if (!sp) return { lang, suggestions: [] };
    const max = Number.isFinite(options?.max) ? Math.max(1, Math.min(50, options.max | 0)) : 8;
    return { lang, suggestions: sp.suggest(word, max) };
  }

  /** Corecții sigure aplicabile dintr-o dată: [{offset,length,replacement}] fără suprapuneri. */
  async fixAll(text, options = {}) {
    text = typeof text === 'string' ? text : text == null ? '' : String(text);
    const { lang, matches, segLang, opts } = await this._run(text, options);
    const edits = [];
    const memo = new Map();
    let budget = LIMITS.fixSuggestions;
    const deadline = Date.now() + LIMITS.fixMillis;
    for (const m of matches) {
      if (m.c === 'style') continue;
      if (m.r && m.r.length) {
        edits.push({ offset: m.o, length: m.l, replacement: m.r[0], id: m.id });
      } else if (m.id === 'SPELLING') {
        const l = this._langIn(segLang, m.o, lang);
        const w = text.slice(m.o, m.o + m.l);
        const key = `${l}\u0001${w}`;
        let s = memo.get(key);
        if (s === undefined) {
          s = null;
          if (budget > 0 && Date.now() < deadline) {
            budget--;
            const sp = await this.speller(l, opts);
            if (sp) s = sp.suggest(w, 3);
          }
          memo.set(key, s);
        }
        if (!s) continue;
        const [a, b] = s;
        if (a && !a.text.includes(' ') && (a.cost <= 0.5 || (a.cost <= 1 && (!b || b.cost - a.cost >= 0.5)))) edits.push({ offset: m.o, length: m.l, replacement: a.text, id: m.id });
      }
    }
    return { lang, edits: edits.sort((x, y) => x.offset - y.offset) };
  }

  /** Limba segmentului care conține `pos` (căutare binară în segmentele sortate). */
  _langIn(segLang, pos, fallback) {
    let lo = 0, hi = segLang.length - 1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      const s = segLang[mid];
      if (pos < s.start) hi = mid - 1;
      else if (pos >= s.end) lo = mid + 1;
      else return s.lang;
    }
    return fallback;
  }

  /** Restaurează diacriticele lipsă (ro, fr, es, pt) acolo unde varianta este unică. */
  async restoreDiacritics(text, options = {}) {
    text = typeof text === 'string' ? text : text == null ? '' : String(text);
    const base = options && typeof options === 'object' ? options : {};
    const { lang, matches, segLang, opts } = await this._run(text, { ...base, categories: { ...(base.categories || {}), spelling: true, grammar: true } });
    const edits = [];
    const taken = []; // intervale deja ocupate, sortate după început
    const overlaps = (e) => {
      let lo = 0, hi = taken.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (taken[mid].offset < e.offset) lo = mid + 1;
        else hi = mid;
      }
      const prev = taken[lo - 1], next = taken[lo];
      return (prev && prev.offset + prev.length > e.offset) || (next && e.offset + e.length > next.offset);
    };
    const push = (e) => {
      if (overlaps(e)) return;
      let lo = 0, hi = taken.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (taken[mid].offset < e.offset) lo = mid + 1;
        else hi = mid;
      }
      taken.splice(lo, 0, e);
      edits.push(e);
    };
    for (const m of matches) {
      if (['RO_DIACRITICE', 'RO_SA', 'RO_CEDILA', 'RO_SINT', 'RO_INTR_UN'].includes(m.id) && m.r?.length) push({ offset: m.o, length: m.l, replacement: m.r[0], id: m.id });
    }
    const spellers = new Map();
    for (const m of matches) {
      if (m.id !== 'SPELLING') continue;
      const l = this._langIn(segLang, m.o, lang);
      let sp = spellers.get(l);
      if (sp === undefined) {
        sp = await this.speller(l, opts);
        spellers.set(l, sp);
      }
      if (!sp) continue;
      const w = text.slice(m.o, m.o + m.l);
      const shape = caseShape(w);
      const boost = (hasOwn(LANGUAGES, l) && LANGUAGES[l].pack?.boost) || (() => 0);
      const lw = w.toLowerCase();
      const seen = new Set();
      const cands = [];
      for (const d of sp.dicts) {
        for (const v of d._diacriticVariants(lw, 4)) {
          const s2 = d._validSurface(v);
          if (!s2 || seen.has(s2)) continue;
          seen.add(s2);
          const a = Array.from(lw);
          const b = Array.from(s2.toLowerCase());
          const changes = a.length === b.length ? a.reduce((n, ch, i) => n + (ch !== b[i] ? 1 : 0), 0) : 99;
          cands.push({ text: s2, changes, boost: boost(s2) });
        }
      }
      if (!cands.length) continue;
      cands.sort((x, y) => x.changes - y.changes || y.boost - x.boost);
      const best = cands[0];
      const tie = cands.some((c) => c !== best && c.changes === best.changes && c.boost === best.boost);
      if (best.changes === 99 || tie) continue;
      let r = best.text;
      if (shape === 'upper') r = r.toUpperCase();
      else if (shape === 'title' && r[0] === r[0].toLowerCase()) r = r[0].toUpperCase() + r.slice(1);
      push({ offset: m.o, length: m.l, replacement: r, id: 'DIACRITICS' });
    }
    return { lang, edits: edits.sort((a, b) => a.offset - b.offset) };
  }
}

export { STOPWORDS, detectLanguage, CATS };
