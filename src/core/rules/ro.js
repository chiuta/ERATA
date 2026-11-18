// Reguli pentru limba română, redactate original pentru ERATA (nu provin din alte corectoare).
import { M, rule, scan, matchCase, tableRule, wordBefore } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));


// Cuvinte românești frecvente cu diacritice: folosite doar pentru a departaja sugestiile.
const FREQ = L(`și în că să când până după între această acest aceasta acestea așa față viață dimineață dimineața învăța învățământ școală școala
  școli școlii țară țara țări român română românia fără făcut făcea făcută două două ființă câte câți câteva cât mâine încă încât îți îmi își
  împreună înainte înapoi înăuntru întotdeauna întâi întâmplare întrebare întrebări îndoială începe început începutul încredere îmbunătăți
  mulțumesc mulțumim ție nouă mă pământ cuvânt cuvinte gând rând sânge vânt sfânt mânca mâncare mână mâini câine pâine râu zâmbet zâmbi înțelege
  înțeles înțelepciune țin ține ținut țesut șase șef școlar știu știi știe știm știți știință științific știri știre părere pădure părinți părți
  mărime măsură iată dată săptămână lună vară iarnă toamnă primăvară seară noapte oră număr numărul număra câștig câștigat puțin puțină puțini multă
  mulți totuși așadar oricât oricând răspuns răspunde rămâne rămas rămân părăsi călător călătorie căutare căuta căldură cărți cărare căsătorie
  sfârșit sfârși gândire gândit văd vedea văzut vânzare vând vândut tată mamă casă masă fată băiat băieți fete oameni țărani sătean oraș orașe
  în aceea acela aceia acelea alături acolo atât atâta atâția atâtea cărui cărei cărora căreia care mare mică bună rău rea frumoasă frumos
  mâncat băut băutură dată dăm dau dă dați vă vi li le ne mi ți și își îl ea ei ele noi voi sunt suntem sunteți era erau fost fi fiind
  pot poți poate putem puteți putea mai mult mulți multe tot toți toate fiecare oricine oricare nicio niciun nimic nimeni încolo încoace`);

export const roPack = {
  boost: (w) => (FREQ.has(w.toLowerCase()) ? 0.2 : 0),
  abbr: L(`dr dl dna nr str bd bl sc ap et jud loc prof conf lect ing ec av cca etc pag vol fig tel ex cf pt ct cod mun sect ședința
    asist drd ș.a d.p.d.v i.e inc srl sa sca scs dna ale`),
  repeatOk: L('nu da mai ba poate aproape încet bine foarte mult pas ce cine cum unde când tot'),
  /** Cedilă → virgulă, ca să fie verificat corect cuvântul. */
  normalize: (w) => w.replace(/ş/g, 'ș').replace(/ţ/g, 'ț').replace(/Ş/g, 'Ș').replace(/Ţ/g, 'Ț'),
  clitics: L('m n s l i ți ti v c d ne mi vi li și ni te se nu o a ai au am ar aș ați'),
  /** „s-a”, „m-am”, „într-un” — părțile separate prin cratimă. */
  hyphenOk(parts, spell) {
    return parts.every((p) => this.clitics.has(p.toLowerCase()) || spell(p)) && parts.some((p) => p.length > 0);
  },
};

const PRE_SA = L(`ca pentru fara fără vreau vrei vrea vrem vreți pot poți poate putem puteți trebuie încerc încerci încearcă încercăm încercați
  încerca incerc incerci incearca îmi îți își imi iti isi ne vă va nici doar mai decât decat hai lasă lasa las ar aș as am ai are avem aveți aveti
  au sper speră spera cred crede cer cere doresc dorește doreste caut caută cauta merg mergem mergi vine vin încât incat până pana după dupa când
  cand dacă daca deși desi cum vrut putut`);
const NEXT_SA = L(`nu fie fii fim fiți fiti ma te se ne va il o le mi ti isi imi iti am ai aiba avem aveti faca fac merg mearga vin vina spun
  spuna pot poata stiu stie stea dea ajunga inceapa înceapă mă ți îl îți îmi își aibă facă meargă vină spună poată știu știe ajungă`);

const NOUN_END = /(?:a|ul|ii|ele|ile|ei|ului|ilor|ea|ia)$/iu;

const MONTHS = 'ianuarie februarie martie aprilie iunie iulie septembrie octombrie noiembrie decembrie'.split(' ');
const DAYS = 'luni marți miercuri joi vineri sâmbătă duminică'.split(' ');
const LOWER_NAMES = new Set([...MONTHS, ...DAYS]);

export const roRules = [
  rule('RO_CEDILA', 'spelling', (ctx) => {
    for (const w of ctx.words) {
      if (!/[şţŞŢ]/u.test(w.text)) continue;
      const fixed = roPack.normalize(w.text);
      ctx.add({
        offset: w.start,
        length: w.text.length,
        rep: [fixed],
        msg: M('Folosiți ș/ț cu virgulă (nu cu sedilă), conform normei', 'Use comma-below ș/ț (not cedilla), as the standard requires'),
        autofix: true,
      });
    }
  }),

  rule('RO_DIACRITICE', 'spelling', (ctx) => {
    const map = { si: 'și', in: 'în', iti: 'îți', imi: 'îmi' };
    for (const w of ctx.words) {
      const key = w.text.toLowerCase();
      const to = map[key];
      if (!to) continue;
      // „in” poate fi englezesc într-un citat; verificăm dacă vecinii sunt cuvinte românești
      const prev = wordBefore(ctx, w.start);
      const nextTok = ctx.words.find((x) => x.start > w.end - 1 && x !== w);
      if (key === 'in' && prev && /^(the|of|and|to|is|a)$/i.test(prev.text)) continue;
      if (key === 'in' && nextTok && /^(the|a|an|my|your|this|that)$/i.test(nextTok.text)) continue;
      ctx.add({
        offset: w.start,
        length: w.text.length,
        rep: [matchCase(w.text, to)],
        msg: M(`Diacritice lipsă: „${to}”`, `Missing diacritics: "${to}"`),
        autofix: true,
      });
    }
  }),

  rule('RO_SA', 'grammar', (ctx) => {
    for (let i = 0; i < ctx.words.length; i++) {
      const w = ctx.words[i];
      const key = w.text.toLowerCase();
      const prev = ctx.words[i - 1];
      const next = ctx.words[i + 1];
      if (key === 'sa') {
        const afterTxt = ctx.text.slice(w.end, w.end + 2);
        if (/^\s*[,.;:!?]|^\s*$/.test(afterTxt)) continue; // probabil posesiv
        const p = prev && ctx.text.slice(prev.end, w.start).trim() === '' ? prev.text.toLowerCase() : '';
        const n = next && ctx.text.slice(w.end, next.start).trim() === '' ? next.text.toLowerCase() : '';
        const sentenceStart = !prev || /[.!?…]\s*$/.test(ctx.text.slice(0, w.start));
        if (PRE_SA.has(p) || NEXT_SA.has(n) || sentenceStart || (prev && !NOUN_END.test(prev.text))) {
          ctx.add({
            offset: w.start,
            length: w.text.length,
            rep: [matchCase(w.text, 'să')],
            msg: M('Conjuncția „să” se scrie cu ă', 'The conjunction “să” is written with ă'),
            autofix: true,
          });
        }
      } else if (key === 'să' && prev) {
        const after = ctx.text.slice(w.end, w.end + 3);
        if (!/^\s*([,.;:!?)]|$)/.test(after)) continue;
        if (/^(ca|nu|cum|să|ce|cine|pentru|fără|fara|încât|incat)$/i.test(prev.text)) continue;
        if (!NOUN_END.test(prev.text) || !ctx.spell(prev.text)) continue;
        ctx.add({
          offset: w.start,
          length: w.text.length,
          rep: [matchCase(w.text, 'sa')],
          msg: M('Dacă e posesiv („mama sa”), se scrie „sa”, fără diacritică', 'If this is the possessive (“mama sa”), write “sa” without the diacritic'),
        });
      }
    }
  }),

  tableRule('RO_INTR_UN', 'grammar', [
    [
      /\b(d?)intr(?:-|\s+)(un|o|unul|una|unui|unei)\b/giu,
      (m) => matchCase(m[0], `${m[1].toLowerCase()}${m[1] ? 'intr' : 'într'}-${m[2].toLowerCase()}`),
      M('Scriere corectă: „într-un” / „dintr-o” (cu cratimă și diacritice)', 'Correct spelling: “într-un” / “dintr-o” (hyphen + diacritics)'),
    ],
  ]),

  tableRule('RO_SINT', 'spelling', [
    [/\bsîn(t|tem|teți|tești)\b/giu, (m) => matchCase(m[0], `sun${m[1].replace('ți', 'ți')}`), M('Ortografia actuală: „sunt” (nu „sînt”)', 'Current spelling: “sunt” (not “sînt”)'), 'RO_SINT'],
    [/\bvis[- ]?a[- ]?vis\b/giu, 'vizavi', M('În română se scrie „vizavi”', 'In Romanian the standard form is “vizavi”'), 'RO_VIZAVI'],
  ]),

  rule('RO_INTERVAL', 'grammar', (ctx) => {
    scan(ctx, /\b(între|Între) (\d[\d.,]*)\s*[-–—]\s*(\d[\d.,]*)\b/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [`${m[1]} ${m[2]} și ${m[3]}`],
      msg: M('După „între” se folosește „și”, nu cratima', 'After “între” use “și”, not a dash'),
    }));
    scan(ctx, /\b(de la|De la) (\d[\d.,]*)\s*[-–—]\s*(\d[\d.,]*)\b/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [`${m[1]} ${m[2]} la ${m[3]}`],
      msg: M('După „de la” se folosește „la”, nu cratima', 'After “de la” use “la”, not a dash'),
    }));
  }),

  rule('RO_VIRGULA_DAR', 'punctuation', (ctx) => {
    scan(ctx, /(?<!\p{L})(\p{L}{1,64})( {1,8})(dar|însă|insa)(?= {1,8}\p{L})/gu, (m) => {
      if (/^(ba|și|si|nu|ci|iar|dar|însă|insa|deci|ca)$/iu.test(m[1])) return null;
      return {
        offset: m.index,
        length: m[0].length,
        rep: [`${m[1]}, ${m[3]}`],
        msg: M(`Se pune virgulă înainte de „${m[3]}”`, `A comma is needed before “${m[3]}”`),
      };
    });
  }),

  rule('RO_UNUL_DIN', 'grammar', (ctx) => {
    const plural = /(?:ii|ilor|ele|ile|uri|ți|ști|ni|ci|gi|ori)$/iu;
    const pron = /^(ei|ele|noi|voi|cei|cele|aceștia|acestea|ceilalți|ceilalte)$/iu;
    scan(ctx, /\b(unul|una|unii|unele|fiecare|oricare|niciunul|niciuna) din (\p{L}+)/giu, (m) => {
      if (!plural.test(m[2]) && !pron.test(m[2])) return null;
      const start = m.index + m[1].length + 1;
      return {
        offset: start,
        length: 3,
        rep: ['dintre'],
        msg: M('Înaintea unui plural se preferă „dintre”', 'Before a plural the standard prefers “dintre”'),
      };
    });
  }),

  rule('RO_LUNI_ZILE', 'grammar', (ctx) => {
    for (const w of ctx.words) {
      const lower = w.text.toLowerCase();
      if (!LOWER_NAMES.has(lower) || w.text === lower || w.text === w.text.toUpperCase()) continue;
      const before = ctx.text.slice(0, w.start).trimEnd();
      if (!before || /[.!?:„“"»—–\-(\[]$/u.test(before)) continue;
      ctx.add({
        offset: w.start,
        length: w.text.length,
        rep: [lower],
        msg: M('Lunile și zilele săptămânii se scriu cu literă mică', 'Months and weekdays are written in lowercase'),
        autofix: true,
      });
    }
  }),

  tableRule('RO_PLEONASM', 'style', [
    [/\b(urc|urca|urcă|urcat|urcăm|urcați|urcând|urcă) sus\b/giu, '$1', M('Pleonasm: „a urca” include direcția „sus”', 'Pleonasm: “a urca” already means going up')],
    [/\b(cobor|coborî|coboară|coborât|coborâm|coborâți|coborând) jos\b/giu, '$1', M('Pleonasm: „a coborî” include „jos”', 'Pleonasm: “a coborî” already means going down')],
    [/\b(intra|intră|intrat|intrăm|intrați|intrând) înăuntru\b/giu, '$1', M('Pleonasm: „a intra” include „înăuntru”', 'Pleonasm: “a intra” already means going in')],
    [/\b(ies|iese|ieși|ieșit|ieșim|ieșiți|ieșind) afară\b/giu, '$1', M('Pleonasm: „a ieși” include „afară”', 'Pleonasm: “a ieși” already means going out')],
    [/\b(repet|repeta|repetă|repetat|repetăm|repetați|repetând) (din nou|iarăși|iarasi)\b/giu, '$1', M('Pleonasm: „a repeta” include „din nou”', 'Pleonasm: “a repeta” already means doing again')],
    [/\b(întorc|întoarce|întors|întoarcem|întoarceți|întorcând) înapoi\b/giu, '$1', M('Pleonasm: „a (se) întoarce” include „înapoi”', 'Pleonasm: “a întoarce” already implies back')],
  ]),
];

// ---------- reguli suplimentare (precizie ridicată, redactate original) ----------
roRules.push(
  tableRule('RO_CLITIC_LIPSA', 'grammar', [
    [/\b(mia|ția|tia) (spus|dat|zis|cerut|luat|trimis|fost|plăcut|rămas|răspuns)\b/gu, (m) => `${m[1] === 'mia' ? 'mi' : 'ți'}-a ${m[2]}`, M('Lipsește cratima: „mi-a” / „ți-a”', 'Missing hyphen: “mi-a” / “ți-a”')],
    [/\bsa (dus|întâmplat|făcut|terminat|mutat|speriat|născut|întors|schimbat|oprit|încheiat|apropiat)\b/gu, (m) => `s-a ${m[1]}`, M('Forma corectă: „s-a” (cu cratimă)', 'Correct form: “s-a” (with hyphen)')],
    [/\bs a (dus|întâmplat|făcut|terminat|mutat|speriat|născut|întors|schimbat|oprit|încheiat|apropiat)\b/gu, (m) => `s-a ${m[1]}`, M('Forma corectă: „s-a” (cu cratimă)', 'Correct form: “s-a” (with hyphen)')],
  ]),

  tableRule('RO_IAR_I_AR', 'grammar', [
    [/\biar (plăcea|putea|ajuta|conveni|trebui|folosi|spune)\b/gu, (m) => `i-ar ${m[1]}`, M('Condiționalul se scrie „i-ar”', 'The conditional is written “i-ar”')],
  ]),

  tableRule('RO_IA_EA', 'grammar', [
    [/\b(ia|Ia) (este|era|a fost|are|va fi)\b/gu, (m) => `${m[1] === 'Ia' ? 'Ea' : 'ea'} ${m[2]}`, M('Pronumele personal este „ea”', 'The personal pronoun is “ea”')],
    [/\bsă ea (un|o|ceva|banii|cartea|loc|în|pe|de)\b/gu, (m) => `să ia ${m[1]}`, M('Verbul „a lua” la conjunctiv: „să ia”', 'Verb “a lua” in the subjunctive: “să ia”')],
  ]),

  tableRule('RO_A_AI_AM', 'grammar', [
    [/\btu a (\p{L}+(?:at|it|ut|ât|ît))\b/gu, (m) => `tu ai ${m[1]}`, M('Acord: „tu ai”', 'Agreement: “tu ai”')],
    [/\b(el|ea) ai (\p{L}+(?:at|it|ut|ât|ît))\b/gu, (m) => `${m[1]} a ${m[2]}`, M('Acord: „el/ea a”', 'Agreement: “el/ea a”')],
    [/\beu a (\p{L}+(?:at|it|ut|ât|ît))\b/gu, (m) => `eu am ${m[1]}`, M('Acord: „eu am”', 'Agreement: “eu am”')],
  ]),

  tableRule('RO_ORTO_COMPUSE', 'spelling', [
    [/\bdeaceea\b/giu, (m) => (m[0][0] === 'D' ? 'De aceea' : 'de aceea'), M('Se scrie separat: „de aceea”', 'Written separately: “de aceea”')],
    [/\bdeasemenea\b/giu, (m) => (m[0][0] === 'D' ? 'De asemenea' : 'de asemenea'), M('Se scrie separat: „de asemenea”', 'Written separately: “de asemenea”')],
    [/\bdealtfel\b/giu, (m) => (m[0][0] === 'D' ? 'De altfel' : 'de altfel'), M('Se scrie separat: „de altfel”', 'Written separately: “de altfel”')],
    [/\b(aproximativ (?:cca\.?|circa)|(?:cca\.?|circa) aproximativ)\b/giu, 'aproximativ', M('Pleonasm: folosiți un singur termen', 'Pleonasm: use only one term')],
  ]),

  rule('RO_NICIUN', 'grammar', (ctx) => {
    scan(ctx, /\bnici (un|o) (\p{L}+)/gu, (m) => {
      const rest = ctx.text.slice(m.index + m[0].length);
      if (/\bnici\b/u.test(rest) || /^(unul|una)/u.test(m[2])) return null; // „nici un X, nici doi”
      return {
        offset: m.index,
        length: 4 + 1 + m[1].length,
        rep: [m[1] === 'un' ? 'niciun' : 'nicio'],
        msg: M('Nehotărâtul negativ se scrie legat: „niciun/nicio”', 'The negative determiner is one word: “niciun/nicio”'),
      };
    });
  }),

  rule('RO_VIRGULA_CI', 'punctuation', (ctx) => {
    scan(ctx, /\b(nu|Nu) (\p{L}+(?: \p{L}+){0,3}) ci(?= \p{L})/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [`${m[1]} ${m[2]}, ci`],
      msg: M('Se pune virgulă înainte de „ci”', 'A comma is needed before “ci”'),
    }));
  }),

  rule('RO_VOCATIV_SALUT', 'punctuation', (ctx) => {
    scan(ctx, /\b(Bună dimineața|Bună ziua|Bună seara|Salut|Noapte bună) (\p{Lu}\p{Ll}+)(?=[,.!?]|$)/gu, (m) => ({
      offset: m.index,
      length: m[0].length,
      rep: [`${m[1]}, ${m[2]}`],
      msg: M('Vocativul se desparte prin virgulă', 'Separate the vocative with a comma'),
    }));
  })
);
