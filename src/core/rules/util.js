// Utilitare pentru reguli. Fiecare regulă: { id, cat, run(ctx) }.
// Categorii: spelling | grammar | punctuation | typography | style

/** Mesaj multilingv: M('română', 'English', {fr:'…'}) */
export const M = (ro, en, extra = {}) => ({ ro, en, ...extra });

export const rule = (id, cat, run) => ({ id, cat, run });

// \b din JavaScript recunoaște doar ASCII; aici folosim o limită de cuvânt Unicode.
const UB = '(?:(?<=[\\p{L}\\p{N}_])(?![\\p{L}\\p{N}_])|(?<![\\p{L}\\p{N}_])(?=[\\p{L}\\p{N}_]))';
export function uni(regex) {
  const src = regex.source.replace(/(?<!\\)\\b/g, UB);
  const flags = (regex.flags.includes('u') ? regex.flags : regex.flags + 'u');
  return new RegExp(src, flags);
}

/** Parcurge toate potrivirile unui regex; `fn(m)` întoarce un obiect de potrivire sau null. */
export function scan(ctx, regex, fn) {
  const base = uni(regex);
  const re = base.flags.includes('g') ? base : new RegExp(base.source, base.flags + 'g');
  for (const m of ctx.text.matchAll(re)) {
    if (!m[0].length) continue;
    const r = fn(m);
    if (r) ctx.add(r);
  }
}

export function matchCase(orig, repl) {
  if (orig.length > 1 && orig === orig.toUpperCase() && orig !== orig.toLowerCase()) return repl.toUpperCase();
  if (orig[0] && orig[0] === orig[0].toUpperCase() && orig[0] !== orig[0].toLowerCase()) return repl[0].toUpperCase() + repl.slice(1);
  return repl;
}

export const lc = (s) => s.toLowerCase();

/** Cuvântul precedent/următor (tokeni de tip word) față de poziția dată. Căutare binară: O(log n). */
export function wordBefore(ctx, pos) {
  const w = ctx.words;
  let lo = 0;
  let hi = w.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (w[mid].end <= pos) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans >= 0 ? w[ans] : null;
}
export function wordAfter(ctx, pos) {
  const w = ctx.words;
  let lo = 0;
  let hi = w.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (w[mid].start >= pos) {
      ans = mid;
      hi = mid - 1;
    } else lo = mid + 1;
  }
  return ans >= 0 ? w[ans] : null;
}

/** Textul de dinaintea lui `pos`, fără spațiile finale, limitat la `max` caractere (evită felierea pătratică a textului întreg). */
export function textBefore(text, pos, max = 64) {
  return text.slice(Math.max(0, pos - max), pos).trimEnd();
}

/** Tabel de substituții simple, insensibil la majuscule: [[regex, replacement, message, id?]] */
export function tableRule(id, cat, table) {
  return rule(id, cat, (ctx) => {
    for (const [pattern, repl, msg, subId] of table) {
      const local = uni(pattern);
      scan(ctx, pattern, (m) => ({
        offset: m.index,
        length: m[0].length,
        id: subId || id,
        rep: [matchCase(m[0], typeof repl === 'function' ? repl(m) : m[0].replace(local, repl))],
        msg,
      }));
    }
  });
}
