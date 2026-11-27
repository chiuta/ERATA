// Regras para português, redigidas de forma original para ERATA.
import { M, rule, tableRule, textBefore } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));
// Dicționarul livrat este brazilian (VERO). Ortografia europeană (AO90) diferă regulat de cea braziliană;
// încercăm echivalentul brazilian înainte de a semnala cuvântul.
const PT_VARIANTS = [
  (w) => w.replace(/([éó])(?=[mn][aeiouáéíóúâêôãõ])/giu, (c) => ({ é: 'ê', ó: 'ô', É: 'Ê', Ó: 'Ô' })[c]), // quilómetro → quilômetro
  (w) => w.replace(/ámos$/iu, 'amos'), // começámos → começamos
  (w) => w.replace(/e(ç(?:ão|ões))$/iu, 'ep$1'), // receção → recepção
  (w) => w.replace(/^(\p{L}*?)ót(i)/iu, '$1ópt$2'), // ótimo ↔ óptimo (ortografia veche)
  (w) => w.replace(/cç/giu, 'c'), // direcção → direção
  (w) => w.replace(/([aeiou])ct([aeiou])/giu, '$1t$2'), // facto → fato, ato
];

export const ptPack = {
  abbr: L('sr sra srta dr dra etc pág av ex art tel lda ltda'),
  repeatOk: L('que já muito'),
  altSpell(w, spell) {
    for (const f of PT_VARIANTS) {
      const v = f(w);
      if (v !== w && spell(v)) return true;
    }
    return false;
  },
};

const MONTHS = 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split(' ');
const DAYS = 'segunda-feira terça-feira quarta-feira quinta-feira sexta-feira sábado domingo'.split(' ');
const LOWER = new Set([...MONTHS, ...DAYS]);

export const ptRules = [
  tableRule('PT_GRAMATICA', 'grammar', [
    [/\b(a) (\d+) (anos|dias|meses|horas) atrás\b/giu, (m) => `há ${m[2]} ${m[3]}`, M('Tempo decorrido: «há …» (sem «atrás»)', 'Elapsed time uses “há” (no “atrás”)')],
    [/\b(um|o|esse|este|aquele) mal (homem|aluno|exemplo|hábito|momento|dia)\b/giu, (m) => `${m[1]} mau ${m[2]}`, M('«mau» (adjetivo) é o oposto de «bom»', '“mau” (adjective) is the opposite of “bom”')],
    [/\b(estou|estás|está|estava|estavam|estamos|estão|ficou|fiquei) mau\b/giu, (m) => `${m[1]} mal`, M('«mal» (advérbio) é o oposto de «bem»', '“mal” (adverb) is the opposite of “bem”')],
    [/\bhaviam (?!\p{L}*(?:ado|ada|ados|adas|ido|ída|ído|idos|idas|ito|ita|isto|osto|erto|eito|vindo|pago|gasto|ganho|tido|sido|feito|morto|preso|solto|salvo)\b)(\p{L}+)\b/giu, (m) => `havia ${m[1]}`, M('«haver» impessoal fica no singular', 'Impersonal “haver” stays singular')],
  ]),
  rule('PT_MESES_DIAS', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      const lower = w.text.toLowerCase();
      if (!LOWER.has(lower) || w.text === lower || w.text === w.text.toUpperCase()) continue;
      const before = textBefore(ctx.text, w.start);
      if (!before || /[.!?:«“"—–\-(\[]$/u.test(before)) continue;
      ctx.add({ offset: w.start, length: w.text.length, rep: [lower], msg: M('Meses e dias escrevem-se com minúscula', 'Months and weekdays are lowercase'), autofix: true });
    }
  }),
];
