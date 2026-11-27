// Biblioteca de evaluare: precision/recall/F1 pe seturi etichetate, alarme false pe corpusuri corecte.
// ATENȚIE: seturile sunt scrise de autorul motorului; nu sunt un etalon independent.
import { createEngine, loadCorpus, countWords, applyEdits } from './lib.mjs';
import { CASE_LANGS, loadCases } from './cases/index.mjs';

export const CORPUS_LANGS = ['ro', 'en', 'fr', 'es', 'pt'];
export { CASE_LANGS };

const nthIndexOf = (text, at, nth = 0) => {
  let i = -1;
  const hay = text.toLowerCase();
  const needle = at.toLowerCase();
  for (let k = 0; k <= nth; k++) {
    i = hay.indexOf(needle, i + 1);
    if (i < 0) throw new Error(`fragmentul „${at}” (apariția ${nth}) lipsește din: ${text}`);
  }
  return i;
};

const ratio = (a, b) => (b === 0 ? null : a / b);
const f1 = (p, r) => (p === null || r === null || p + r === 0 ? null : (2 * p * r) / (p + r));

/** Evaluează toate regulile unei limbi. Întoarce { rules: {id: stats}, total: stats, failures: [] }. */
export async function evalCases(engine, lang) {
  const spec = await loadCases(lang);
  const rules = {};
  const failures = [];
  const collateral = [];
  const tot = { tp: 0, fp: 0, fn: 0, bad: 0, good: 0, fixOk: 0, fixTried: 0, sugTop1: 0, sugTop5: 0, sugN: 0 };
  for (const [id, r] of Object.entries(spec.rules)) {
    const s = { tp: 0, fp: 0, fn: 0, bad: r.bad?.length || 0, good: r.good?.length || 0, fixOk: 0, fixTried: 0, sugTop1: 0, sugTop5: 0, sugN: 0, na: r.na || null };
    for (const [text, at, fixed, nth = 0] of r.bad || []) {
      const res = await engine.check(text, { lang, ui: 'en' });
      const M = res.matches.filter((m) => m.id === id);
      const pos = nthIndexOf(text, at, nth);
      const hit = M.filter((m) => m.o < pos + at.length && m.o + m.l > pos);
      const extra = M.length - hit.length;
      s.fp += extra;
      if (extra) failures.push({ rule: id, kind: 'FP-extra', text, got: M.map((m) => `${text.slice(m.o, m.o + m.l)}→${JSON.stringify(m.r)}`) });
      if (!hit.length) {
        s.fn++;
        failures.push({ rule: id, kind: 'FN', text, at });
        continue;
      }
      s.tp++;
      if (id === 'SPELLING') {
        const delta = (fixed ?? text).length - text.length;
        const expected = (fixed ?? text).slice(pos, pos + at.length + delta);
        const sg = (await engine.suggest(at, { lang, context: text, max: 5 })).suggestions.map((x) => x.text);
        s.sugN++;
        if (sg[0] === expected) s.sugTop1++;
        if (sg.includes(expected)) s.sugTop5++;
        else failures.push({ rule: id, kind: 'SUGGEST', text, at, expected, got: sg });
      } else if (fixed !== undefined) {
        s.fixTried++;
        const usable = M.filter((m) => m.r && m.r.length);
        const out = usable.length === M.length ? applyEdits(text, M.map((m) => ({ offset: m.o, length: m.l, replacement: m.r[0] }))) : null;
        if (out === fixed) s.fixOk++;
        else failures.push({ rule: id, kind: 'FIX', text, expected: fixed, got: out });
      }
    }
    for (const text of r.good || []) {
      const res = await engine.check(text, { lang, ui: 'en' });
      const M = res.matches.filter((m) => m.id === id);
      s.fp += M.length;
      if (M.length) failures.push({ rule: id, kind: 'FP', text, got: M.map((m) => `${text.slice(m.o, m.o + m.l)}→${JSON.stringify(m.r)}`) });
      const other = res.matches.filter((m) => m.id !== id && m.c !== 'style');
      if (other.length) collateral.push({ rule: id, text, got: other.map((m) => `${m.id}:${text.slice(m.o, m.o + m.l)}`) });
    }
    s.p = ratio(s.tp, s.tp + s.fp) ?? 1;
    s.r = s.bad ? ratio(s.tp, s.tp + s.fn) : null;
    s.f1 = s.r === null ? null : f1(s.p, s.r);
    rules[id] = s;
    for (const k of ['tp', 'fp', 'fn', 'bad', 'good', 'fixOk', 'fixTried', 'sugTop1', 'sugTop5', 'sugN']) tot[k] += s[k];
  }
  tot.p = ratio(tot.tp, tot.tp + tot.fp) ?? 1;
  tot.r = ratio(tot.tp, tot.tp + tot.fn);
  tot.f1 = f1(tot.p, tot.r);
  return { lang, rules, total: tot, failures, collateral };
}

/** Alarme false pe corpusuri corecte, per categorie, la 1000 de cuvinte (stilul „style” nu se numără). */
export async function evalCorpus(engine, lang, { corpus = loadCorpus(lang) } = {}) {
  const cats = {};
  let words = 0;
  let alarms = 0;
  const list = [];
  for (const [cat, text] of Object.entries(corpus)) {
    const w = countWords(text);
    const r = await engine.check(text, { lang });
    const fa = r.matches.filter((m) => m.c !== 'style');
    cats[cat] = { words: w, alarms: fa.length, per1000: (fa.length * 1000) / w };
    words += w;
    alarms += fa.length;
    for (const m of fa) list.push({ cat, id: m.id, text: text.slice(m.o, m.o + m.l), ctx: text.slice(Math.max(0, m.o - 30), m.o + m.l + 30).replace(/\n/g, '⏎') });
  }
  return { lang, words, alarms, per1000: (alarms * 1000) / words, cats, list };
}

export { createEngine };
