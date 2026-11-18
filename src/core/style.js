// Reguli de stil și indicatori de lizibilitate. Nu folosesc date externe.
import { M, rule } from './rules/util.js';
import { splitSentences } from './text.js';
import { STOPWORDS } from './langid.js';

export function countSyllables(word) {
  const g = word.toLowerCase().match(/[aeiouyăâîàáäãåèéêëìíïòóôöõùúûüœ]+/gu);
  return Math.max(1, g ? g.length : 1);
}

export function readability(text, lang) {
  const words = text.match(/[\p{L}]+/gu) || [];
  const sentences = Math.max(1, splitSentences(text).length);
  if (words.length < 5) return null;
  const syl = words.reduce((a, w) => a + countSyllables(w), 0);
  const asl = words.length / sentences;
  const asw = syl / words.length;
  let score;
  if (lang === 'en') score = 206.835 - 1.015 * asl - 84.6 * asw;
  else if (lang === 'es') score = 206.84 - 0.6 * (asw * 100) - 1.02 * (100 / asl);
  else score = 207 - 1.015 * asl - 73.6 * asw; // Kandel–Moles, aproximare pentru limbile romanice
  score = Math.max(0, Math.min(100, score));
  const label = score >= 80 ? 'easy' : score >= 60 ? 'plain' : score >= 40 ? 'medium' : score >= 20 ? 'hard' : 'very-hard';
  return { score: Math.round(score), label, words: words.length, sentences, avgSentence: +asl.toFixed(1), approx: lang !== 'en' && lang !== 'es' };
}

export const styleRules = [
  rule('STYLE_LONG_SENTENCE', 'style', (ctx) => {
    const limit = ctx.opts.longSentence || 40;
    for (const s of splitSentences(ctx.text, ctx.pack?.abbr)) {
      const seg = ctx.text.slice(s.start, s.end);
      const n = (seg.match(/[\p{L}\p{N}]+/gu) || []).length;
      if (n <= limit) continue;
      ctx.add({
        offset: s.start,
        length: Math.min(seg.length, 60),
        rep: [],
        msg: M(`Propoziție foarte lungă (${n} cuvinte). Luați în calcul împărțirea ei.`, `Very long sentence (${n} words). Consider splitting it.`, { fr: `Phrase très longue (${n} mots). Pensez à la scinder.`, es: `Oración muy larga (${n} palabras). Considere dividirla.` }),
        sev: 'hint',
      });
    }
  }),

  rule('STYLE_REPEATED_WORD', 'style', (ctx) => {
    const stop = STOPWORDS[ctx.lang] || new Set();
    const win = 45;
    const seen = new Map();
    const ws = ctx.words;
    for (let i = 0; i < ws.length; i++) {
      const w = ws[i].text.toLowerCase();
      if (w.length < 6 || stop.has(w)) continue;
      const arr = (seen.get(w) || []).filter((j) => i - j <= win);
      arr.push(i);
      seen.set(w, arr);
      if (arr.length === 3) {
        ctx.add({
          offset: ws[i].start,
          length: ws[i].text.length,
          rep: [],
          msg: M(`Cuvântul „${w}” se repetă des; încercați un sinonim`, `“${w}” is repeated often; try a synonym`, { fr: `« ${w} » se répète souvent`, es: `«${w}» se repite con frecuencia` }),
          sev: 'hint',
        });
      }
    }
  }),
];
