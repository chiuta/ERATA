// Motorul ERATA: orchestrează detecția limbii, verificarea ortografică (Hunspell propriu),
// regulile gramaticale/tipografice/de stil și sugestiile. Funcționează în orice mediu JS.

import { Hunspell } from './hunspell.js';
import { tokenize, splitParagraphs, isCodeLike, isLatin, caseShape } from './text.js';
import { detectLanguage, STOPWORDS } from './langid.js';
import { commonRules } from './rules/common.js';
import { roPack, roRules } from './rules/ro.js';
import { enPack, enRules } from './rules/en.js';
import { frPack, frRules } from './rules/fr.js';
import { esPack, esRules } from './rules/es.js';
import { styleRules, readability } from './style.js';
import { M } from './rules/util.js';

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

function pickMsg(m, ui) {
  if (!m) return '';
  if (typeof m === 'string') return m;
  return m[ui] || m.en || m.ro || Object.values(m)[0];
}

function hash(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return h >>> 0;
}

export class Erata {
  /**
   * @param {{loadDict:(name:string)=>Promise<{aff:string,dic:string}|null>}} deps
   */
  constructor({ loadDict }) {
    this.loadDict = loadDict;
    this._dicts = new Map();
    this._cache = new Map();
    this.extraLangs = new Set(); // limbi cu dicționar importat
  }

  async _dict(name) {
    if (!this._dicts.has(name)) {
      this._dicts.set(
        name,
        (async () => {
          const d = await this.loadDict(name);
          return d ? new Hunspell(d.aff, d.dic, { name }) : null;
        })().catch(() => null)
      );
    }
    return this._dicts.get(name);
  }

  invalidate(name) {
    if (name) this._dicts.delete(name);
    else this._dicts.clear();
    this._cache.clear();
  }

  /** Întoarce un „verificator”: { spell(w), suggest(w), has } pentru limbă. */
  async speller(lang, opts = DEFAULT_OPTS) {
    const def = LANGUAGES[lang];
    const names = def ? [...def.dicts] : [lang];
    let use = names;
    if (lang === 'en') use = opts.enVariant === 'gb' ? ['en-GB'] : opts.enVariant === 'us' ? ['en'] : ['en', 'en-GB'];
    const dicts = (await Promise.all(use.map((n) => this._dict(n)))).filter(Boolean);
    if (!dicts.length) return null;
    const pack = def?.pack;
    const norm = pack?.normalize || ((w) => w);
    return {
      lang,
      dicts,
      spell: (w) => {
        const x = norm(w);
        return dicts.some((d) => d.spell(x));
      },
      suggest: (w, max = 8) => {
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

  _paragraphLang(text, opts, docLang) {
    if (opts.lang && opts.lang !== 'auto') return opts.lang;
    const d = detectLanguage(text);
    if (d && d.confidence >= 0.2) return d.lang;
    return docLang || opts.defaultLang || 'ro';
  }

  /**
   * Verifică un text. Întoarce potriviri cu offset relativ la text.
   * @returns {Promise<{lang:string, matches:object[], stats:object}>}
   */
  async check(text, options = {}) {
    const opts = { ...DEFAULT_OPTS, ...options, categories: { ...DEFAULT_OPTS.categories, ...(options.categories || {}) } };
    const paras = splitParagraphs(text);
    let docLang = opts.lang;
    if (docLang === 'auto') {
      const d = detectLanguage(text);
      docLang = d && d.confidence >= 0.15 ? d.lang : opts.defaultLang;
    }
    const sig = String(hash(JSON.stringify([opts.categories, opts.disabledRules, opts.userRules, opts.enVariant, opts.ui, opts.longSentence, opts.personal])));
    const all = [];
    const langCount = {};
    for (const p of paras) {
      const lang = this._paragraphLang(p.text, opts, docLang);
      langCount[lang] = (langCount[lang] || 0) + p.text.length;
      const key = `${lang}|${sig}|${p.text}`;
      let ms = this._cache.get(key);
      if (!ms) {
        ms = await this._checkParagraph(p.text, lang, opts);
        this._cache.set(key, ms);
        if (this._cache.size > 600) this._cache.delete(this._cache.keys().next().value);
      }
      for (const m of ms) all.push({ ...m, o: m.o + p.start });
    }
    const mainLang = Object.entries(langCount).sort((a, b) => b[1] - a[1])[0]?.[0] || docLang;
    const stats = { lang: mainLang, readability: readability(text, mainLang), chars: text.length };
    return { lang: mainLang, matches: all, stats };
  }

  async _checkParagraph(text, lang, opts) {
    const def = LANGUAGES[lang];
    const pack = def?.pack || {};
    const sp = await this.speller(lang, opts);
    const tokens = tokenize(text);
    const words = tokens.filter((t) => t.type === 'word');
    const prot = tokens.filter((t) => t.type === 'url' || t.type === 'email' || t.type === 'tag');
    const out = [];
    const personal = new Set((opts.personal || []).map((w) => w.toLowerCase()));
    const disabled = new Set(opts.disabledRules || []);
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
        let rep = m.rep || [];
        if (length === 0 && offset < text.length) {
          rep = rep.map((r) => r + text[offset]);
          length = 1;
        }
        if (length <= 0) return;
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
      for (const t of words) {
        const w = t.text;
        if (w.length < 2 || !isLatin(w)) continue;
        if (/^\p{Lu}+$/u.test(w) && w.length <= 6 && !ctx.spell(w)) continue; // acronim
        if (isCodeLike(text, t) || personal.has(w.toLowerCase())) continue;
        if (ctx.spell(w)) continue;
        if (w.includes('-') && pack.hyphenOk && pack.hyphenOk.call(pack, w.split('-'), ctx.spell)) continue;
        out.push({ o: t.start, l: w.length, id: 'SPELLING', c: 'spelling', m: pickMsg(SPELL_MSG, ui), r: null, word: w, pr: PRIORITY.DICT });
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
    this._userRules(ctx, opts.userRules || [], lang, disabled);

    // 3. filtrare după categorii + rezolvare suprapuneri
    const kept = out.filter((m) => opts.categories[m.c] !== false && !disabled.has(m.id));
    const prio = (m) => m.pr ?? (m.c === 'style' ? PRIORITY.style : m.c === 'typography' ? PRIORITY.typography : m.c === 'punctuation' ? PRIORITY.punctuation : PRIORITY.RULE);
    const order = kept.slice().sort((a, b) => prio(b) - prio(a) || a.o - b.o);
    const MAX_MATCHES = 5000;
    const taken = []; // disjuncte, sortate după offset
    for (const m of order) {
      if (taken.length >= MAX_MATCHES) break;
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
    for (const ur of rules) {
      if (!ur || !ur.pattern || ur.enabled === false || disabled.has(ur.id)) continue;
      if (ur.lang && ur.lang !== 'all' && ur.lang !== lang) continue;
      let re;
      try {
        re = new RegExp(ur.pattern, (ur.flags || 'giu').replace(/[^gimsuy]/g, '').replace(/g?/, 'g'));
      } catch {
        continue;
      }
      let n = 0;
      for (const m of ctx.text.matchAll(re)) {
        if (!m[0].length || ++n > 200) continue;
        ctx.add({
          offset: m.index,
          length: m[0].length,
          id: ur.id || 'USER_RULE',
          cat: ur.cat || 'grammar',
          rep: ur.replacement != null ? [m[0].replace(new RegExp(ur.pattern, (ur.flags || 'iu').replace(/[^imsuy]/g, '')), ur.replacement)] : [],
          msg: ur.message || 'Regulă personalizată',
        });
      }
    }
  }

  /** Sugestii pentru un cuvânt (la cerere, pentru că sunt mai costisitoare). */
  async suggest(word, options = {}) {
    const opts = { ...DEFAULT_OPTS, ...options };
    const lang = opts.lang && opts.lang !== 'auto' ? opts.lang : detectLanguage(opts.context || word)?.lang || opts.defaultLang;
    const sp = await this.speller(lang, opts);
    if (!sp) return { lang, suggestions: [] };
    const sug = sp.suggest(word, opts.max || 8);
    return { lang, suggestions: sug };
  }

  /** Corecții sigure aplicabile dintr-o dată: [{offset,length,replacement}] fără suprapuneri. */
  async fixAll(text, options = {}) {
    const opts = { ...DEFAULT_OPTS, ...options };
    const { lang, matches } = await this.check(text, opts);
    const edits = [];
    for (const m of matches) {
      if (m.c === 'style') continue;
      if (m.r && m.r.length) {
        edits.push({ offset: m.o, length: m.l, replacement: m.r[0], id: m.id });
      } else if (m.id === 'SPELLING') {
        const sp = await this.speller(this._langAt(text, m.o, opts, lang), opts);
        if (!sp) continue;
        const w = text.slice(m.o, m.o + m.l);
        const s = sp.suggest(w, 3);
        const [a, b] = s;
        if (a && !a.text.includes(' ') && (a.cost <= 0.5 || (a.cost <= 1 && (!b || b.cost - a.cost >= 0.5)))) edits.push({ offset: m.o, length: m.l, replacement: a.text, id: m.id });
      }
    }
    return { lang, edits: edits.sort((x, y) => x.offset - y.offset) };
  }

  _langAt(text, pos, opts, fallback) {
    if (opts.lang && opts.lang !== 'auto') return opts.lang;
    const paras = splitParagraphs(text);
    const p = paras.find((x) => pos >= x.start && pos < x.end);
    return p ? this._paragraphLang(p.text, opts, fallback) : fallback;
  }

  /** Restaurează diacriticele lipsă (ro, fr, es, pt) acolo unde varianta este unică. */
  async restoreDiacritics(text, options = {}) {
    const opts = { ...DEFAULT_OPTS, ...options, categories: { ...DEFAULT_OPTS.categories, spelling: true, grammar: true } };
    const { lang, matches } = await this.check(text, opts);
    const edits = [];
    const taken = [];
    const push = (e) => {
      if (taken.some((x) => e.offset < x.offset + x.length && x.offset < e.offset + e.length)) return;
      taken.push(e);
      edits.push(e);
    };
    for (const m of matches) {
      if (['RO_DIACRITICE', 'RO_SA', 'RO_CEDILA', 'RO_SINT', 'RO_INTR_UN'].includes(m.id) && m.r?.length) push({ offset: m.o, length: m.l, replacement: m.r[0], id: m.id });
    }
    for (const m of matches) {
      if (m.id !== 'SPELLING') continue;
      const l = this._langAt(text, m.o, opts, lang);
      const sp = await this.speller(l, opts);
      if (!sp) continue;
      const w = text.slice(m.o, m.o + m.l);
      const shape = caseShape(w);
      const boost = LANGUAGES[l]?.pack?.boost || (() => 0);
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
