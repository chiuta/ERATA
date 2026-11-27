// Evaluarea detecției de limbă: fragmente de 3–50 de cuvinte, amestecuri, nume proprii.
// ATENȚIE: setul este scris de autor, nu este un etalon independent.
import { loadCorpus, HELDOUT_DIR } from './lib.mjs';
import { normalizeOptions } from '../../src/core/engine.js';
import { EXTRA_TEXTS, MIXTURES, NAMES } from './langid-data.mjs';
import { existsSync } from 'node:fs';

export const BUCKETS = [
  { name: '3–5', sizes: [3, 4, 5] },
  { name: '6–10', sizes: [7, 10] },
  { name: '11–20', sizes: [14, 20] },
  { name: '21–50', sizes: [30, 50] },
];
export const DICT_LANGS = ['ro', 'en', 'fr', 'es', 'pt'];
export const ALL_LANGS = ['ro', 'en', 'fr', 'es', 'pt', 'de', 'it', 'nl'];

/** Decizia folosită de motor pentru un paragraf (cuvinte funcționale + dicționare): limba sau null (= abținere). */
export async function decide(engine, text) {
  const opts = { ...normalizeOptions({ lang: 'auto' }), defaultLang: '??' };
  const l = await engine._paragraphLang(text, opts, null);
  return l === '??' ? null : l;
}

function sources(lang, heldOut) {
  if (heldOut) return existsSync(`${HELDOUT_DIR}/${lang}.txt`) ? Object.values(loadCorpus(lang, HELDOUT_DIR)) : [];
  if (DICT_LANGS.includes(lang)) return Object.values(loadCorpus(lang));
  return EXTRA_TEXTS[lang] || [];
}

/** Ferestre de N cuvinte, la pas determinist, din fiecare sursă. */
export function windows(lang, n, { heldOut = false, max = 60 } = {}) {
  const out = [];
  const stride = n * 2 + 5;
  for (const src of sources(lang, heldOut)) {
    const words = src.split(/\s+/).filter(Boolean);
    for (let i = 0; i + n <= words.length && out.length < max; i += stride) out.push(words.slice(i, i + n).join(' '));
  }
  return out;
}

/** Rulează decizia pe o listă de [limbaAșteptată, text]; întoarce numărătorile. */
async function tally(engine, items) {
  const t = { n: 0, ok: 0, wrong: 0, abstain: 0, confusions: {} };
  for (const [lang, text] of items) {
    t.n++;
    const got = await decide(engine, text);
    if (got === lang) t.ok++;
    else if (got === null) t.abstain++;
    else {
      t.wrong++;
      const k = `${lang}→${got}`;
      t.confusions[k] = (t.confusions[k] || 0) + 1;
    }
  }
  return t;
}

const merge = (a, b) => {
  a.n += b.n; a.ok += b.ok; a.wrong += b.wrong; a.abstain += b.abstain;
  for (const [k, v] of Object.entries(b.confusions)) a.confusions[k] = (a.confusions[k] || 0) + v;
  return a;
};
const empty = () => ({ n: 0, ok: 0, wrong: 0, abstain: 0, confusions: {} });

export async function evalLangid(engine, { heldOut = false } = {}) {
  const langs = heldOut ? ALL_LANGS.filter((l) => existsSync(`${HELDOUT_DIR}/${l}.txt`)) : ALL_LANGS;
  const byBucket = {};
  const byLang = {};
  const total = empty();
  for (const b of BUCKETS) {
    byBucket[b.name] = empty();
    for (const lang of langs) {
      const items = [];
      for (const n of b.sizes) for (const w of windows(lang, n, { heldOut, max: 40 })) items.push([lang, w]);
      const t = await tally(engine, items);
      merge(byBucket[b.name], t);
      byLang[lang] ||= empty();
      merge(byLang[lang], t);
      merge(total, t);
    }
  }
  const mixtures = await tally(engine, MIXTURES.map(([a, , text]) => [a, text]));
  const names = await tally(engine, NAMES);
  return { byBucket, byLang, total, mixtures, names, langs };
}
