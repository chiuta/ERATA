// Reguli ale utilizatorului: validare statică (anti-ReDoS) și compilare cu cache.
// Motorul nu se bazează pe validarea făcută de extensie: orice regulă ajunge aici prin `compileUserRule`.

export const MAX_PATTERN_LENGTH = 200;
const MAX_GROUPS = 20;
const MAX_DEPTH = 6;
const MAX_UNBOUNDED = 3; // câte repetări nemărginite (*, +, {n,}) are voie să conțină tiparul
const MAX_COUNTED = 100; // plafon pentru {n,m}

const QUANT_BRACE = /^\{(\d+)(?:(,)(\d*))?\}/;

/**
 * Analiză statică. Respinge: repetarea unui grup care conține la rândul lui repetări sau alternanțe
 * (ex. `(a+)+`, `(a|a)*`, `(a?){30}`), prea multe repetări nemărginite, contoare uriașe, grupuri multe,
 * tipare prea lungi sau care nu se compilează.
 * @returns {{ok:boolean, reason?:string}}
 */
export function analyzePattern(pattern) {
  if (typeof pattern !== 'string' || !pattern) return { ok: false, reason: 'empty' };
  if (pattern.length > MAX_PATTERN_LENGTH) return { ok: false, reason: 'too-long' };
  const n = pattern.length;
  const stack = [];
  let cur = { q: false, alt: false };
  let unbounded = 0;
  let groups = 0;
  let i = 0;

  /** Citește un cuantificator la poziția k. Întoarce {len, repeat, unbounded} sau null. */
  const quantAt = (k) => {
    const c = pattern[k];
    let len = 0;
    let repeat = false;
    let unb = false;
    if (c === '*' || c === '+') {
      len = 1;
      repeat = true;
      unb = true;
    } else if (c === '?') {
      len = 1;
    } else if (c === '{') {
      const m = QUANT_BRACE.exec(pattern.slice(k, k + 24));
      if (!m) return null;
      len = m[0].length;
      const lo = +m[1];
      const hasComma = !!m[2];
      const hi = hasComma ? (m[3] === '' ? Infinity : +m[3]) : lo;
      if (lo > MAX_COUNTED || (hi !== Infinity && hi > MAX_COUNTED)) return { bad: 'counter' };
      if (hi < lo) return { bad: 'range' };
      repeat = hi > 1;
      unb = hi === Infinity;
    } else return null;
    if (pattern[k + len] === '?') len++; // modificator „leneș”
    return { len, repeat, unb };
  };

  while (i < n) {
    const c = pattern[i];
    if (c === '\\') {
      const d = pattern[i + 1];
      if (d === undefined) return { ok: false, reason: 'dangling-escape' };
      if (/[1-9]/.test(d) || d === 'k') unbounded++; // referințe inverse: cost polinomial
      if ((d === 'p' || d === 'P' || d === 'u') && pattern[i + 2] === '{') {
        const close = pattern.indexOf('}', i + 3);
        if (close < 0) return { ok: false, reason: 'bad-escape' };
        i = close + 1;
      } else i += 2;
    } else if (c === '[') {
      let k = i + 1;
      if (pattern[k] === '^') k++;
      for (; k < n; k++) {
        if (pattern[k] === '\\') k++;
        else if (pattern[k] === ']') break;
      }
      if (k >= n) return { ok: false, reason: 'unclosed-class' };
      i = k + 1;
    } else if (c === '(') {
      stack.push(cur);
      cur = { q: false, alt: false };
      if (++groups > MAX_GROUPS || stack.length > MAX_DEPTH) return { ok: false, reason: 'too-many-groups' };
      if (pattern[i + 1] === '?') {
        const t = pattern.slice(i + 2, i + 4);
        if (t[0] === ':' || t[0] === '=' || t[0] === '!') i += 3;
        else if (t === '<=' || t === '<!') i += 4;
        else if (t[0] === '<') {
          const close = pattern.indexOf('>', i + 3);
          if (close < 0) return { ok: false, reason: 'bad-group' };
          i = close + 1;
        } else return { ok: false, reason: 'bad-group' };
      } else i += 1;
      continue;
    } else if (c === ')') {
      if (!stack.length) return { ok: false, reason: 'unbalanced' };
      const inner = cur;
      cur = stack.pop();
      i += 1;
      const q = quantAt(i);
      if (q && q.bad) return { ok: false, reason: q.bad };
      if (q) {
        if (q.repeat && (inner.q || inner.alt)) return { ok: false, reason: 'nested-quantifier' };
        if (q.unb) unbounded++;
        cur.q = true;
        i += q.len;
      }
      if (inner.q) cur.q = true;
      if (inner.alt) cur.alt = true;
      continue;
    } else if (c === '|') {
      cur.alt = true;
      i += 1;
      continue;
    } else if (c === '*' || c === '+' || c === '?' || c === '{') {
      const q = quantAt(i);
      if (q && q.bad) return { ok: false, reason: q.bad };
      if (q) {
        cur.q = true;
        if (q.unb) unbounded++;
        i += q.len;
        continue;
      }
      i += 1; // „{” literal în afara unui cuantificator valid
      continue;
    } else i += 1;
    // după un atom (literal, clasă, escape) poate urma un cuantificator
    const q = quantAt(i);
    if (q && q.bad) return { ok: false, reason: q.bad };
    if (q) {
      cur.q = true;
      if (q.unb) unbounded++;
      i += q.len;
    }
  }
  if (stack.length) return { ok: false, reason: 'unbalanced' };
  if (unbounded > MAX_UNBOUNDED) return { ok: false, reason: 'too-many-unbounded' };
  try {
    new RegExp(pattern, 'u');
  } catch {
    return { ok: false, reason: 'syntax' };
  }
  return { ok: true };
}

/** Același verdict ca analiza, sub formă de boolean (pentru interfețe). */
export const isSafePattern = (p) => analyzePattern(p).ok;

const COMPILED = new Map();

/** Indicatori: doar i, m, s, u; `g` și `u` sunt mereu prezente. Implicit „iu”. */
export function normalizeFlags(f) {
  const set = new Set();
  for (const ch of typeof f === 'string' && f.length ? f : 'i') if ('ims'.includes(ch)) set.add(ch);
  return [...set].join('') + 'gu';
}

/**
 * Compilează o regulă a utilizatorului sau întoarce null dacă este invalidă / nesigură.
 * @returns {{re:RegExp, id:string, cat:string|undefined, replacement:string|undefined, message:string, lang:string}|null}
 */
export function compileUserRule(ur, validCats) {
  if (!ur || typeof ur !== 'object' || typeof ur.pattern !== 'string') return null;
  const flags = normalizeFlags(ur.flags);
  const key = `${flags}/${ur.pattern}`;
  let c = COMPILED.get(key);
  if (c === undefined) {
    c = null;
    if (analyzePattern(ur.pattern).ok) {
      try {
        c = new RegExp(ur.pattern, flags);
      } catch {
        c = null;
      }
    }
    if (COMPILED.size > 500) COMPILED.clear();
    COMPILED.set(key, c);
  }
  if (!c) return null;
  const str = (v, max, d) => (typeof v === 'string' ? v.slice(0, max) : d);
  return {
    re: c,
    id: str(ur.id, 40, '') || 'USER_RULE',
    cat: validCats.includes(ur.cat) ? ur.cat : 'grammar',
    replacement: typeof ur.replacement === 'string' ? ur.replacement.slice(0, 200) : undefined,
    message: str(ur.message, 200, '') || 'Regulă personalizată',
    lang: str(ur.lang, 8, 'all'),
  };
}

/** Expandează un șablon de înlocuire ($&, $1, $<nume>, $$) folosind potrivirea `m`. */
export function expandReplacement(template, m) {
  return template.replace(/\$(\$|&|\d{1,2}|<[^>]*>)/g, (all, t) => {
    if (t === '$') return '$';
    if (t === '&') return m[0];
    if (t[0] === '<') return (m.groups && m.groups[t.slice(1, -1)]) ?? '';
    const k = +t;
    if (k >= 1 && k < m.length) return m[k] ?? '';
    return all;
  });
}
