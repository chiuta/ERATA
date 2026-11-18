// English rules, authored from scratch for ERATA.
import { M, rule, scan, matchCase, tableRule } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const enPack = {
  abbr: L(`mr mrs ms dr prof sr jr st vs etc no fig inc ltd co jan feb mar apr jun jul aug sep sept oct nov dec approx dept est misc vol pp ca cf al`),
  repeatOk: L('had that is was do can very so no yes bye knock really'),
};

// „an” înaintea unui sunet vocalic; excepții scrise de mână
const AN_ACRONYM_LETTERS = new Set('aefhilmnorsx'.split(''));
const A_BEFORE_VOWEL_LETTER = /^(uni(?!n|m)|use|usu|uti|ura|uro|eu|one|once|ubiq|ukr|ufo|uk\b|euro|ewe|ut(?:e|a)h)/i;
const AN_BEFORE_CONSONANT_LETTER = /^(hour|honest|honou?r|heir|hono|herb)/i;

function needsAn(word) {
  if (!word) return null;
  if (/^[A-Z]{2,}$/.test(word)) return AN_ACRONYM_LETTERS.has(word[0].toLowerCase());
  if (AN_BEFORE_CONSONANT_LETTER.test(word)) return true;
  if (A_BEFORE_VOWEL_LETTER.test(word)) return false;
  return /^[aeiou]/i.test(word);
}

const IRREG_PAST = 'went saw took made came got gave ate wrote knew thought brought said found told felt became began ran spoke sat stood wore chose drove flew grew threw';

export const enRules = [
  rule('EN_I', 'grammar', (ctx) => {
    scan(ctx, /(?<![\p{L}\p{N}'’])i(?=(?:'(?:m|ll|ve|d)|’(?:m|ll|ve|d))?(?![\p{L}\p{N}]))/gu, (m) => {
      const after = ctx.text.slice(m.index + 1, m.index + 4);
      const len = /^['’](?:m|ll|ve|d)/.test(after) ? 1 : 1;
      return {
        offset: m.index,
        length: len,
        rep: ['I'],
        msg: M('Pronumele „I” se scrie cu majusculă', 'The pronoun “I” is always capitalised'),
        autofix: true,
      };
    });
  }),

  rule('EN_A_AN', 'grammar', (ctx) => {
    scan(ctx, /(?<![\p{L}'’-])(a|an|A|An)\s+([\p{L}][\p{L}'’-]*)/gu, (m) => {
      const art = m[1];
      const word = m[2];
      if (/^\p{Lu}[\p{Ll}]/u.test(word) && art.toLowerCase() === 'a' && /^[AEIOU]/.test(word) && !A_BEFORE_VOWEL_LETTER.test(word)) {
        // nume proprii: „a Eiffel” rămâne verificat la fel ca restul
      }
      const an = needsAn(word);
      if (an === null) return null;
      const isAn = art.toLowerCase() === 'an';
      if (isAn === an) return null;
      if (isAn && /^hist/i.test(word)) return null; // „an historic” acceptat în engleza britanică
      return {
        offset: m.index,
        length: art.length,
        rep: [matchCase(art, an ? 'an' : 'a')],
        msg: M(`Articolul potrivit aici este „${an ? 'an' : 'a'}”`, `Use “${an ? 'an' : 'a'}” before “${word}”`),
        autofix: true,
      };
    });
  }),

  tableRule('EN_AGREEMENT', 'grammar', [
    [/\b(he|she|it) (have|don't|don’t|are)\b/giu, (m) => `${m[0].split(' ')[0]} ${{ have: 'has', "don't": "doesn't", 'don’t': 'doesn’t', are: 'is' }[m[0].split(' ')[1].toLowerCase()]}`, M('Acordul subiect–predicat', 'Subject–verb agreement')],
    [/\b(they|we|you) (is|has|doesn't|doesn’t)\b/giu, (m) => `${m[0].split(' ')[0]} ${{ is: 'are', has: 'have', "doesn't": "don't", 'doesn’t': 'don’t' }[m[0].split(' ')[1].toLowerCase()]}`, M('Acordul subiect–predicat', 'Subject–verb agreement')],
    [/\bI (is|are|has|does)\b/gu, (m) => `I ${{ is: 'am', are: 'am', has: 'have', does: 'do' }[m[1]]}`, M('Acordul subiect–predicat', 'Subject–verb agreement')],
  ]),

  tableRule('EN_COULD_OF', 'grammar', [
    [/\b(could|should|would|must|might) of\b/giu, (m) => `${m[1]} have`, M('Se scrie „have”, nu „of”', 'It is “have”, not “of”')],
    [/\balot\b/giu, (m) => matchCase(m[0], 'a lot'), M('Corect: „a lot”', 'Correct: “a lot”')],
    [/\b(more|less|better|worse|bigger|smaller|rather|other|greater|fewer|higher|lower|faster|slower|older|younger|easier|harder|larger) then\b/giu, (m) => `${m[1]} than`, M('Comparativ: „than”', 'Comparatives take “than”')],
    [/\b(and|but|if|until|just|since) than\b/giu, (m) => `${m[1]} then`, M('Secvență temporală: „then”', 'Sequence in time: “then”')],
    [/\byour welcome\b/giu, (m) => matchCase(m[0], "you're welcome"), M('Corect: „you’re welcome”', 'Correct: “you’re welcome”')],
    [/\byour (going|being|not|doing|getting|making|coming|a|an|the best|so|very|too)\b/giu, (m) => `you're ${m[1]}`, M('„you’re” = „you are”', '“you’re” means “you are”')],
    [/\b(you're|you’re) (own|car|house|name|phone|email|account|team|work|life|friends?|family|mom|dad|mother|father|dog|cat|company|business|website|order|book)\b/giu, (m) => `your ${m[2]}`, M('Posesivul este „your”', 'The possessive is “your”')],
    [/\bits (a|an|the|not|been|going|time|very|just|too|only|also|still|really|about|all|now|okay|ok|fine|true|possible|important|clear|easy|hard)\b/giu, (m) => `it's ${m[1]}`, M('„it’s” = „it is/has”', '“it’s” means “it is/has”')],
    [/\b(it's|it’s) (own|value|purpose|size|shape|colou?r|content|owner|features|performance|price|members|name)\b/giu, (m) => `its ${m[2]}`, M('Posesivul este „its”', 'The possessive is “its”')],
    [/\b(their|there) (is|are|was|were|isn't|aren't)\b/giu, (m) => (m[1].toLowerCase() === 'their' ? `there ${m[2]}` : m[0]), M('„there is/are” (nu „their”)', '“there is/are”, not “their”')],
    [/\bthey're (own|car|house|name|team|work|life|friends?|family|dog|cat|company|business|website)\b/giu, (m) => `their ${m[1]}`, M('Posesivul este „their”', 'The possessive is “their”')],
    [/\b(a|an) (people|children|men|women|peoples)\b/giu, (m) => `${{ people: 'a person', peoples: 'a person', children: 'a child', men: 'a man', women: 'a woman' }[m[2].toLowerCase()]}`, M('Substantiv la plural după „a/an”', 'Plural noun after “a/an”')],
    [/\b(this) (things|people|days|years|times|ways|problems|ideas)\b/giu, (m) => `these ${m[2]}`, M('Acord singular/plural', 'Number agreement')],
    [/\b(these|those) (thing|person|day|year|time|way|problem|idea)\b/giu, (m) => `${m[1]} ${m[2]}s`, M('Acord singular/plural', 'Number agreement')],
  ]),

  rule('EN_PAST_AFTER_AUX', 'grammar', (ctx) => {
    const past = IRREG_PAST.split(' ').join('|');
    const base = { went: 'go', saw: 'see', took: 'take', made: 'make', came: 'come', got: 'get', gave: 'give', ate: 'eat', wrote: 'write', knew: 'know', thought: 'think', brought: 'bring', said: 'say', found: 'find', told: 'tell', felt: 'feel', became: 'become', began: 'begin', ran: 'run', spoke: 'speak', sat: 'sit', stood: 'stand', wore: 'wear', chose: 'choose', drove: 'drive', flew: 'fly', grew: 'grow', threw: 'throw' };
    scan(ctx, new RegExp(`\\b(did|didn't|didn’t|does|doesn't|doesn’t|do|don't|don’t|can|could|should|would|will|won't|won’t|to) (${past})\\b`, 'giu'), (m) => {
      if (m[1].toLowerCase() === 'to' && /^(got|said|thought|found|felt)$/i.test(m[2])) return null;
      return {
        offset: m.index + m[1].length + 1,
        length: m[2].length,
        rep: [base[m[2].toLowerCase()]],
        msg: M('După verbul auxiliar se folosește forma de bază', 'Use the base form after an auxiliary'),
      };
    });
  }),
];
