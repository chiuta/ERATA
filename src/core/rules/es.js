// Reglas para español, redactadas de forma original para ERATA.
import { M, rule, scan, matchCase, tableRule } from './util.js';
import { splitSentences } from '../text.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const esPack = {
  abbr: L('sr sra srta dr dra etc pág av núm ud uds art ej vs tel no'),
  repeatOk: L('que ya muy poco mucho'),
};

const MONTHS = 'enero febrero marzo abril mayo junio julio agosto septiembre setiembre octubre noviembre diciembre'.split(' ');
const DAYS = 'lunes martes miércoles jueves viernes sábado domingo'.split(' ');
const LOWER = new Set([...MONTHS, ...DAYS]);
const MASC_MA = 'problema tema sistema programa idioma poema día mapa planeta clima'.split(' ').join('|');

export const esRules = [
  rule('ES_SIGNOS_INVERTIDOS', 'punctuation', (ctx) => {
    for (const s of splitSentences(ctx.text, esPack.abbr)) {
      const seg = ctx.text.slice(s.start, s.end);
      for (const [close, open, name] of [['?', '¿', 'interrogación'], ['!', '¡', 'exclamación']]) {
        if (!seg.trimEnd().endsWith(close) || seg.includes(open)) continue;
        // Se omiten secuencias como «?!» emparejadas con signos abiertos antes
        const lead = seg.match(/^\s*/)[0].length;
        ctx.add({
          offset: s.start + lead,
          length: 0,
          rep: [open],
          insert: true,
          msg: M(`Falta el signo de ${name} de apertura (${open})`, `Missing opening ${close === '?' ? 'question' : 'exclamation'} mark (${open})`, { es: `Falta el signo de ${name} de apertura (${open})` }),
          autofix: true,
        });
      }
    }
  }),

  tableRule('ES_GRAMATICA', 'grammar', [
    [/\bde el\b(?! \p{Lu})/gu, (m) => matchCase(m[0], 'del'), M('Contracción obligatoria: «del»', 'Mandatory contraction: “del”', { es: 'Contracción obligatoria: «del»' })],
    [/\ba el\b(?! \p{Lu})/gu, (m) => matchCase(m[0], 'al'), M('Contracción obligatoria: «al»', 'Mandatory contraction: “al”', { es: 'Contracción obligatoria: «al»' })],
    [/\b(creo|pienso|opino|digo|dijo|dicen|supongo|pensamos|creemos|opinamos|cree|piensa|opina) de que\b/giu, (m) => m[1] + ' que', M('Dequeísmo: sobra «de»', 'Dequeísmo: “de” is superfluous', { es: 'Dequeísmo: sobra «de»' })],
    [/\bhaber (si|qué|cómo|cuándo|cuál|dónde)\b/giu, (m) => `a ver ${m[1]}`, M('Se escribe «a ver» (mirar)', 'Write “a ver” (to see)', { es: 'Se escribe «a ver» (mirar)' })],
    [/\b(he|ha|has|han|hemos|habéis|había|habían) echo\b/giu, (m) => `${m[1]} hecho`, M('Participio de «hacer»: «hecho»', 'Past participle of “hacer”: “hecho”', { es: 'Participio de «hacer»: «hecho»' })],
    [/\b(él|ella|usted|ya|que|se) a (\p{L}+(?:ado|ido))\b/giu, (m) => `${m[1]} ha ${m[2]}`, M('Verbo auxiliar «haber»: «ha»', 'Auxiliary verb “haber”: “ha”', { es: 'Verbo auxiliar «haber»: «ha»' })],
    [new RegExp(`\\bla (${MASC_MA})\\b`, 'giu'), (m) => `el ${m[1]}`, M('Sustantivo masculino: «el»', 'Masculine noun: “el”', { es: 'Sustantivo masculino: «el»' })],
    [/\bel (mano|foto|moto)\b/giu, (m) => `la ${m[1]}`, M('Sustantivo femenino: «la»', 'Feminine noun: “la”', { es: 'Sustantivo femenino: «la»' })],
  ]),

  rule('ES_MESES_DIAS', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      const lower = w.text.toLowerCase();
      if (!LOWER.has(lower) || w.text === lower || w.text === w.text.toUpperCase()) continue;
      const before = ctx.text.slice(0, w.start).trimEnd();
      if (!before || /[.!?:«“"—–\-(\[¿¡]$/u.test(before)) continue;
      ctx.add({ offset: w.start, length: w.text.length, rep: [lower], msg: M('Los meses y los días se escriben en minúscula', 'Months and weekdays are lowercase', { es: 'Los meses y los días se escriben en minúscula' }), autofix: true });
    }
  }),
];
