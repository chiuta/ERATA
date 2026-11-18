// Reguli independente de limbă (spațiere, punctuație, repetiții, ghilimele, paranteze).
import { M, rule, scan, matchCase } from './util.js';
import { NNBSP, NBSP } from '../text.js';

const QUOTES = {
  ro: { open: '„', close: '”' },
  en: { open: '“', close: '”' },
  fr: { open: '«' + NNBSP, close: NNBSP + '»' },
  es: { open: '«', close: '»' },
  pt: { open: '“', close: '”' },
  de: { open: '„', close: '“' },
  it: { open: '«', close: '»' },
  nl: { open: '“', close: '”' },
};

export const commonRules = [
  rule('DOUBLE_SPACE', 'typography', (ctx) => {
    scan(ctx, /(?<=\S) {2,}(?=\S)/g, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [' '],
      msg: M('Spații multiple', 'Multiple spaces', { fr: 'Espaces multiples', es: 'Espacios múltiples' }),
    }));
  }),

  rule('SPACE_BEFORE_PUNCT', 'punctuation', (ctx) => {
    const re = ctx.lang === 'fr' ? /(?<=[\p{L}\p{N})"”»])[ \t]+([,.…])(?=\s|$)/gu : /(?<=[\p{L}\p{N})"”»])[ \t]+([,.;:!?…])(?=\s|$)/gu;
    scan(ctx, re, (m) => {
      if (ctx.protectedAt(m.index)) return null;
      return {
        offset: m.index,
        length: m[0].length,
        rep: [m[1]],
        msg: M('Spațiu în plus înaintea semnului de punctuație', 'Remove the space before the punctuation mark', {
          fr: 'Espace superflue avant la ponctuation',
          es: 'Sobra el espacio antes del signo de puntuación',
        }),
      };
    });
  }),

  rule('SPACE_AFTER_PUNCT', 'punctuation', (ctx) => {
    scan(ctx, /(?<=\p{L}{2})([,;!?])(?=\p{L})/gu, (m) => {
      if (ctx.protectedAt(m.index)) return null;
      return {
        offset: m.index,
        length: 1,
        rep: [m[1] + ' '],
        msg: M('Lipsește spațiul după semnul de punctuație', 'Missing space after punctuation', {
          fr: 'Espace manquante après la ponctuation',
          es: 'Falta un espacio tras el signo de puntuación',
        }),
      };
    });
    scan(ctx, /(?<=\p{L}{2})([.:])(?=\p{Lu}\p{Ll}{2})/gu, (m) => {
      if (ctx.protectedAt(m.index)) return null;
      const before = ctx.text.slice(Math.max(0, m.index - 12), m.index);
      if (/[\p{L}\p{N}]\.[\p{L}\p{N}]*$/u.test(before)) return null; // e.g., foo.bar.Baz
      return {
        offset: m.index,
        length: 1,
        rep: [m[1] + ' '],
        msg: M('Lipsește spațiul după punct', 'Missing space after the full stop', {
          fr: 'Espace manquante après le point',
          es: 'Falta un espacio tras el punto',
        }),
      };
    });
  }),

  rule('PUNCT_REPEAT', 'punctuation', (ctx) => {
    scan(ctx, /,{2,}|;{2,}|(?<![.…])\.\.(?![.…])|,\./g, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [m[0][0] === ',' && m[0] === ',.' ? '.' : m[0][0]],
      msg: M('Semn de punctuație dublat', 'Repeated punctuation', { fr: 'Ponctuation répétée', es: 'Puntuación repetida' }),
    }));
  }),

  rule('REPEATED_WORD', 'grammar', (ctx) => {
    const ok = ctx.pack?.repeatOk || new Set();
    const w = ctx.words;
    for (let i = 1; i < w.length; i++) {
      const a = w[i - 1];
      const b = w[i];
      if (a.type !== 'word' || b.type !== 'word') continue;
      if (/\S/.test(ctx.text.slice(a.end, b.start)) || b.start === a.end) continue;
      const x = a.text.toLowerCase();
      if (x.length < 2 || x !== b.text.toLowerCase() || ok.has(x)) continue;
      ctx.add({
        offset: a.end,
        length: b.end - a.end,
        rep: [''],
        msg: M('Cuvânt repetat', 'Repeated word', { fr: 'Mot répété', es: 'Palabra repetida' }),
      });
    }
  }),

  rule('SENTENCE_CAPITAL', 'grammar', (ctx) => {
    const abbr = ctx.pack?.abbr || new Set();
    scan(ctx, /(?<!\p{L})(\p{L}{3,64})\.( {1,8})(\p{Ll}{2,64})/gu, (m) => {
      const prev = m[1].toLowerCase();
      if (abbr.has(prev) || ctx.protectedAt(m.index)) return null;
      const lead = ctx.text.slice(Math.max(0, m.index - 2), m.index);
      if (/\./.test(lead)) return null; // ex. „e.g. word”
      const start = m.index + m[1].length + 1 + m[2].length;
      return {
        offset: start,
        length: m[3].length,
        rep: [matchCase('A', m[3])],
        msg: M('Propoziția începe cu literă mică', 'Sentence should start with a capital letter', {
          fr: 'La phrase doit commencer par une majuscule',
          es: 'La oración debe comenzar con mayúscula',
        }),
      };
    });
  }),

  rule('UNPAIRED_BRACKET', 'punctuation', (ctx) => {
    const pairs = { ')': '(', ']': '[', '}': '{' };
    const stack = [];
    const t = ctx.text;
    for (let i = 0; i < t.length; i++) {
      const c = t[i];
      if ('([{'.includes(c)) {
        stack.push({ c, i });
      } else if (pairs[c]) {
        // enumerări „a)” / „1)” și emoticoane „:)” nu sunt paranteze
        const before = t.slice(Math.max(0, i - 3), i);
        if (c === ')' && (/(^|\s)[\p{L}\p{N}]{1,2}$/u.test(before) || /[:;=8][-o^]?$/.test(before))) {
          const top = stack[stack.length - 1];
          if (!top) continue;
        }
        if (stack.length && stack[stack.length - 1].c === pairs[c]) stack.pop();
        else ctx.add({ offset: i, length: 1, rep: [''], msg: M('Paranteză închisă fără pereche', 'Closing bracket without opening one', { fr: 'Parenthèse fermante sans ouvrante', es: 'Paréntesis de cierre sin apertura' }) });
      }
    }
    for (const s of stack) {
      ctx.add({ offset: s.i, length: 1, rep: [], msg: M('Paranteză neînchisă', 'Unclosed bracket', { fr: 'Parenthèse non fermée', es: 'Paréntesis sin cerrar' }) });
    }
  }),

  rule('TYPOGRAPHIC_QUOTES', 'typography', (ctx) => {
    const q = QUOTES[ctx.lang];
    if (!q || ['en', 'pt', 'nl'].includes(ctx.lang)) return; // ghilimelele drepte sunt acceptate curent în aceste limbi
    const idx = [];
    for (let i = 0; i < ctx.text.length; i++) if (ctx.text[i] === '"') idx.push(i);
    if (idx.length < 2 || idx.length % 2) return;
    const msg = M('Folosiți ghilimele tipografice', 'Use typographic quotation marks', { fr: 'Utilisez les guillemets typographiques', es: 'Use comillas tipográficas' });
    for (let k = 0; k < idx.length; k += 2) {
      let [a, b] = [idx[k], idx[k + 1]];
      let aLen = 1;
      let bStart = b;
      let bLen = 1;
      if (ctx.lang === 'fr') {
        if (ctx.text[a + 1] === ' ') aLen = 2;
        if (ctx.text[b - 1] === ' ') {
          bStart = b - 1;
          bLen = 2;
        }
      }
      ctx.add({ offset: a, length: aLen, rep: [q.open], msg });
      ctx.add({ offset: bStart, length: bLen, rep: [q.close], msg });
    }
  }),

  rule('WRONG_OPEN_QUOTE', 'typography', (ctx) => {
    const target = { ro: '„', de: '„', fr: '«' + NNBSP, es: '«' }[ctx.lang];
    if (!target) return;
    scan(ctx, /“(?=\S)/g, (m) => ({
      offset: m.index,
      length: 1,
      rep: [target],
      msg: M('Ghilimele de deschidere nepotrivite limbii', 'Opening quote does not match the language convention', { fr: 'Guillemet ouvrant inadapté', es: 'Comilla de apertura inadecuada' }),
    }));
  }),

  rule('SPACED_HYPHEN', 'typography', (ctx) => {
    scan(ctx, /(?<=\p{L}) - (?=\p{L})/gu, (m) => ({
      offset: m.index,
      length: 3,
      rep: [' – '],
      msg: M('Folosiți linia de pauză (–) cu spații', 'Use an en dash (–) with spaces', { fr: 'Utilisez le tiret demi-cadratin (–)', es: 'Use la raya o el guion largo (–)' }),
    }));
  }),

  rule('UNIT_SPACE', 'typography', (ctx) => {
    scan(ctx, /(?<![\p{L}\p{N}])(\d+(?:[.,]\d+)?)(km|kg|cm|mm|ml|mg|MB|GB|TB|kB|kHz|MHz|GHz|Hz|kW|kWh)(?![\p{L}\p{N}])/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [`${m[1]}${NBSP}${m[2]}`],
      msg: M('Spațiu între număr și unitatea de măsură', 'Put a (non-breaking) space between number and unit', { fr: 'Espace entre le nombre et l’unité', es: 'Espacio entre número y unidad' }),
    }));
  }),

  rule('SPACE_BEFORE_CLOSE_BRACKET', 'typography', (ctx) => {
    scan(ctx, /\( +(?=\p{L})|(?<=\p{L}) +\)/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [m[0].trim()],
      msg: M('Spațiu în plus lângă paranteză', 'Extra space next to bracket', { fr: 'Espace superflue près de la parenthèse', es: 'Espacio sobrante junto al paréntesis' }),
    }));
  }),
];
