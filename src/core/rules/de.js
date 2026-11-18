// Regeln für Deutsch, original für ERATA verfasst.
import { M, rule, tableRule } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));
export const dePack = { abbr: L('z.b d.h u.a usw bzw ca nr dr prof str vgl evtl ggf inkl'), repeatOk: L('haben sein wir sie das die') };

export const deRules = [
  tableRule('DE_GRAMMATIK', 'grammar', [
    [/\bdaß\b/giu, 'dass', M('Neue Rechtschreibung: „dass“', 'Current spelling: “dass”'), 'DE_DASS_ALT'],
    [/\b(muß|mußte|mußten|lassen|läßt|iß)\b/giu, (m) => m[0].replace(/ß/g, 'ss'), M('Nach kurzem Vokal schreibt man „ss“', 'After a short vowel write “ss”'), 'DE_SS'],
    [/\b(ich glaube|ich denke|ich weiß|ich hoffe|ich finde|er sagt|sie sagt), das (ich|du|er|sie|wir|ihr|man)\b/giu, (m) => m[0].replace(/, das /i, ', dass '), M('Nach „glauben/sagen …“ steht die Konjunktion „dass“', 'The conjunction “dass” follows verbs of thinking/saying')],
  ]),
  rule('DE_ANREDE', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      if (w.text !== 'sie' && w.text !== 'ihnen' && w.text !== 'ihr') continue;
      const prev = ctx.text.slice(Math.max(0, w.start - 12), w.start);
      if (/(Haben|Können|Möchten|Werden|Müssen|Sind|Würden) $/.test(prev) && w.text === 'sie') {
        ctx.add({ offset: w.start, length: 3, rep: ['Sie'], msg: M('Höfliche Anrede wird großgeschrieben', 'The formal “Sie” is capitalised') });
      }
    }
  }),
];
