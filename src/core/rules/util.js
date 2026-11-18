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

/** Cuvântul precedent/următor (tokeni de tip word) față de poziția dată. */
export function wordBefore(ctx, pos) {
  for (let i = ctx.words.length - 1; i >= 0; i--) if (ctx.words[i].end <= pos) return ctx.words[i];
  return null;
}
export function wordAfter(ctx, pos) {
  for (const w of ctx.words) if (w.start >= pos) return w;
  return null;
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
        rep: [typeof repl === 'function' ? repl(m) : matchCase(m[0], m[0].replace(local, repl))],
        msg,
      }));
    }
  });
}
