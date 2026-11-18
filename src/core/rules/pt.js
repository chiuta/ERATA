// Regras para português, redigidas de forma original para ERATA.
import { M, rule, tableRule } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));
export const ptPack = { abbr: L('sr sra srta dr dra etc pág av ex art tel'), repeatOk: L('que já muito') };

const MONTHS = 'janeiro fevereiro março abril maio junho julho agosto setembro outubro novembro dezembro'.split(' ');
const DAYS = 'segunda-feira terça-feira quarta-feira quinta-feira sexta-feira sábado domingo'.split(' ');
const LOWER = new Set([...MONTHS, ...DAYS]);

export const ptRules = [
  tableRule('PT_GRAMATICA', 'grammar', [
    [/\b(a) (\d+) (anos|dias|meses|horas) atrás\b/giu, (m) => `há ${m[2]} ${m[3]} atrás`, M('Tempo decorrido: «há … atrás» ou «… atrás»', 'Elapsed time uses “há”')],
    [/\b(um|o|esse|este|aquele) mal (homem|aluno|exemplo|hábito|momento|dia)\b/giu, (m) => `${m[1]} mau ${m[2]}`, M('«mau» (adjetivo) é o oposto de «bom»', '“mau” (adjective) is the opposite of “bom”')],
    [/\b(estou|estás|está|estava|estavam|estamos|estão|ficou|fiquei) mau\b/giu, (m) => `${m[1]} mal`, M('«mal» (advérbio) é o oposto de «bem»', '“mal” (adverb) is the opposite of “bem”')],
    [/\bhaviam (\p{L}+)\b/giu, (m) => `havia ${m[1]}`, M('«haver» impessoal fica no singular', 'Impersonal “haver” stays singular')],
  ]),
  rule('PT_MESES_DIAS', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      const lower = w.text.toLowerCase();
      if (!LOWER.has(lower) || w.text === lower || w.text === w.text.toUpperCase()) continue;
      const before = ctx.text.slice(0, w.start).trimEnd();
      if (!before || /[.!?:«“"—–\-(\[]$/u.test(before)) continue;
      ctx.add({ offset: w.start, length: w.text.length, rep: [lower], msg: M('Meses e dias escrevem-se com minúscula', 'Months and weekdays are lowercase'), autofix: true });
    }
  }),
];
