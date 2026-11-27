// Règles pour le français, rédigées de façon originale pour ERATA.
import { M, rule, scan, matchCase, tableRule, textBefore } from './util.js';
import { NBSP, NNBSP } from '../text.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const frPack = {
  abbr: L('m mme mlle dr pr etc cf env av bd fig p vol no ex apr chap'),
  repeatOk: L('nous vous que ça si très bien'),
};

const H_ASPIRE_OR_SEMI = L('onze onzième onzièmes onzièmement oui ouistiti yacht yaourt yoga yen yéti yeti yucca ukase uhlan ululer');
const MONTHS = 'janvier février mars avril mai juin juillet août septembre octobre novembre décembre'.split(' ');
const DAYS = 'lundi mardi mercredi jeudi vendredi samedi dimanche'.split(' ');
const LOWER = new Set([...MONTHS, ...DAYS]);

export const frRules = [
  rule('FR_ESPACE_PONCTUATION', 'typography', (ctx) => {
    scan(ctx, /(?<=[\p{L}\p{N})»”])([;!?])(?=\s|$)/gu, (m) => {
      if (ctx.protectedAt(m.index)) return null;
      return { offset: m.index, length: 1, rep: [NNBSP + m[1]], msg: M('Espace fine insécable avant « ; ! ? »', 'Narrow non-breaking space before “; ! ?”') };
    });
    scan(ctx, /(?<=[\p{L}\p{N})»”])(:)(?=\s|$)/gu, (m) => {
      if (ctx.protectedAt(m.index) || /\d:$/.test(ctx.text.slice(m.index - 1, m.index + 1))) return null;
      return { offset: m.index, length: 1, rep: [NBSP + ':'], msg: M('Espace insécable avant « : »', 'Non-breaking space before “:”') };
    });
    scan(ctx, /(?<=[\p{L}\p{N}]) +([;!?:])(?=\s|$)/gu, (m) => {
      if (m[0][0] === NNBSP || m[0][0] === NBSP) return null;
      return { offset: m.index, length: m[0].length, rep: [(m[1] === ':' ? NBSP : NNBSP) + m[1]], msg: M('Utilisez une espace insécable avant cette ponctuation', 'Use a non-breaking space before this mark') };
    });
  }),

  rule('FR_ELISION', 'grammar', (ctx) => {
    scan(ctx, /\b(ce|je|me|te|se|ne|de|que|le|la)(?: | )(\p{L}[\p{L}'’-]*)/giu, (m) => {
      const next = m[2].toLowerCase();
      if (!/^[aeiouyàâäéèêëîïôöùûüœ]/u.test(next)) return null;
      if (H_ASPIRE_OR_SEMI.has(next)) return null;
      const art = m[1].toLowerCase();
      // « à la une » (première page) : pas d’élision
      if (art === 'la' && next === 'une' && /(?:^|\s)(?:à|en|sur|dans|pour|faire|fait|fera|font|fais)$/iu.test(textBefore(ctx.text, m.index, 12))) return null;
      if (art === 'ce' && !/^(est|était|etait|a|ont|en)$/u.test(next)) return null; // « ce on » etc.
      if ((art === 'le' || art === 'la') && /^[aeiouyàâäéèêëîïôöùûüœ]{1,2}$/.test(next) && next.length <= 1) return null;
      const base = art === 'que' ? 'qu' : art === 'ce' ? 'c' : art[0];
      return {
        offset: m.index,
        length: m[1].length + 1,
        rep: [matchCase(m[1], `${base}'`)],
        msg: M('Élision obligatoire devant une voyelle', 'Elision is required before a vowel', { fr: 'Élision obligatoire devant une voyelle' }),
        autofix: true,
      };
    });
  }),

  tableRule('FR_ACCORD', 'grammar', [
    [/\b(il|elle|on) à\b/giu, (m) => `${m[1]} a`, M('« a » (avoir), sans accent', '“a” (verb avoir) takes no accent', { fr: '« a » (verbe avoir) sans accent' })],
    [/\b(ils|elles) (est|a)\b/giu, (m) => `${m[1]} ${m[2].toLowerCase() === 'est' ? 'sont' : 'ont'}`, M('Accord sujet–verbe', 'Subject–verb agreement', { fr: 'Accord sujet–verbe' })],
    [/\b(il|elle|on) (ont|sont)\b/giu, (m) => `${m[1]} ${m[2].toLowerCase() === 'ont' ? 'a' : 'est'}`, M('Accord sujet–verbe', 'Subject–verb agreement', { fr: 'Accord sujet–verbe' })],
    [/\b(ils|elles) on\b/giu, (m) => `${m[1]} ont`, M('« ont » (verbe avoir)', '“ont” (verb avoir)', { fr: '« ont » (verbe avoir)' })],
  ]),

  rule('FR_PARTICIPE', 'grammar', (ctx) => {
    const skip = new Set(['premier', 'dernier', 'léger', 'étranger', 'danger', 'boulanger', 'berger', 'passager', 'ménager', 'escalier', 'quartier', 'papier', 'métier', 'cahier', 'panier', 'sanglier', 'fermier', 'ouvrier', 'banquier', 'été', 'fer', 'hiver', 'enfer', 'mer', 'cher', 'amer', 'fier']);
    scan(ctx, /\b(j'ai|j’ai|ai|as|avons|avez|ont|il a|elle a|on a) (\p{Ll}+er)\b/giu, (m) => {
      const verb = m[2].toLowerCase();
      if (skip.has(verb) || verb.length < 5) return null;
      const fixed = verb.slice(0, -2) + 'é';
      if (!ctx.spell(verb) || !ctx.spell(fixed)) return null;
      return {
        offset: m.index + m[1].length + 1,
        length: m[2].length,
        rep: [fixed],
        msg: M('Après avoir, on emploie le participe passé (-é)', 'After “avoir” use the past participle (-é)', { fr: 'Après « avoir », on emploie le participe passé (-é)' }),
      };
    });
  }),

  rule('FR_MOIS_JOURS', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      const lower = w.text.toLowerCase();
      if (!LOWER.has(lower) || w.text === lower || w.text === w.text.toUpperCase()) continue;
      const before = textBefore(ctx.text, w.start);
      if (!before || /[.!?:«“"—–\-(\[]$/u.test(before)) continue;
      // « Mars » : planète ou dieu, sauf s’il suit un quantième ou une préposition de date
      if (lower === 'mars' && !/(?:\d(?:er)?|(?:^|[\s-])(?:en|fin|début|debut|mi|avant|après|apres|depuis|pendant|dès|des|mois de)|\bd['’])$/iu.test(before)) continue;
      ctx.add({ offset: w.start, length: w.text.length, rep: [lower], msg: M('Les mois et les jours s’écrivent en minuscules', 'Months and weekdays are lowercase', { fr: 'Les mois et les jours s’écrivent en minuscules' }), autofix: true });
    }
  }),
];
