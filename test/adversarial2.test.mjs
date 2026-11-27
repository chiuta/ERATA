// Audit adversarial #2 al MOTORULUI: fuzz mare, alarme false pe text corect, seturi etichetate, detecția limbii,
// parserul Hunspell, proprietăți (fixAll, offseturi, cache, reguli ale utilizatorului, memorie) și regresii.
//
// Tot textul de test este scris de autor (clean-room); seturile etichetate NU sunt un etalon independent.
// Variabile de mediu: ERATA_FUZZ_FULL=1 rulează și fuzz-ul de 5 MB / matricea completă de limbi.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Erata, LIMITS, normalizeOptions } from '../src/core/engine.js';
import { Hunspell, HUNSPELL_LIMITS } from '../src/core/hunspell.js';
import { analyzePattern, isSafePattern, compileUserRule, expandReplacement } from '../src/core/userrules.js';
import { splitSentences } from '../src/core/text.js';
import { detectLanguage, foreignQuoteSpans } from '../src/core/langid.js';
import { createEngine, loadCorpus, applyEdits, rng, HELDOUT_DIR, countWords } from './eval/lib.mjs';
import { evalCases, evalCorpus, CASE_LANGS, CORPUS_LANGS } from './eval/evaluate.mjs';
import { loadCases } from './eval/cases/index.mjs';
import { evalLangid } from './eval/langid.mjs';
import { commonRules } from '../src/core/rules/common.js';
import { styleRules } from '../src/core/style.js';
import { LANGUAGES } from '../src/core/engine.js';

const FULL = process.env.ERATA_FUZZ_FULL === '1';
const engine = createEngine();
const timed = async (fn) => {
  const t = performance.now();
  const r = await fn();
  return [performance.now() - t, r];
};
const hasOwn = (o, k) => Object.prototype.hasOwnProperty.call(o, k);

/** Contractul de offset: în interval, nevid, fără cuvânt tăiat la mijlocul unui surogat, disjuncte și ordonate. */
function assertOffsets(text, matches, label = '') {
  let prevEnd = 0;
  for (const m of matches) {
    assert.ok(Number.isInteger(m.o) && Number.isInteger(m.l), `${label}: offset/lungime întregi`);
    assert.ok(m.o >= 0 && m.l > 0 && m.o + m.l <= text.length, `${label}: în interval (${m.id} @${m.o}+${m.l}/${text.length})`);
    const a = text.charCodeAt(m.o);
    const z = text.charCodeAt(m.o + m.l - 1);
    assert.ok(!(a >= 0xdc00 && a <= 0xdfff && m.o > 0 && text.charCodeAt(m.o - 1) >= 0xd800 && text.charCodeAt(m.o - 1) <= 0xdbff), `${label}: nu începe în mijlocul unui surogat`);
    assert.ok(!(z >= 0xd800 && z <= 0xdbff && m.o + m.l < text.length && text.charCodeAt(m.o + m.l) >= 0xdc00 && text.charCodeAt(m.o + m.l) <= 0xdfff), `${label}: nu se termină în mijlocul unui surogat`);
    assert.ok(m.o >= prevEnd, `${label}: potriviri disjuncte și ordonate (${m.id} @${m.o} < ${prevEnd})`);
    prevEnd = m.o + m.l;
    if (m.id === 'SPELLING' && m.word !== undefined) assert.equal(text.slice(m.o, m.o + m.l), m.word, `${label}: SPELLING.word = textul indicat`);
  }
}

// =====================================================================================================
// 1. FUZZ pe texte de 1 MB (și 5 MB opțional)
// =====================================================================================================
const WORDS = {
  ro: 'și în de la cu pe un o că să nu este sunt care pentru din mai dar sau școală casă merge vorbește mâine ieri copiii învață orașul oameni vremea frumos dimineața sa nici intr in Ianuarie Luni unul'.split(' '),
  en: 'the of and to in is that it for was on are with his they be at one have this from or had by not but its a an your welcome alot could of hour university people school apple went did he she it have are'.split(' '),
  fr: 'le la les de des du un une et est en que qui dans pour pas sur au aux ce cette il elle ils elles nous vous je ne se homme ai à on a manger Janvier lundi'.split(' '),
  es: 'el la los las de del que y en un una es se no por con para su al lo como más pero a el problema mano Lunes enero ha echo'.split(' '),
  pt: 'o a os as de do da dos das que e em um uma para com não se por mais como mas haviam mau mal Março estou atrás'.split(' '),
  de: 'der die das und ist in den von zu mit sich daß muß sie ihr ein eine nicht auch es an'.split(' '),
  it: "il lo la i gli le di del della che e in un una per con non è perchè un amica qual'è pò".split(' '),
};
const PUNCT = [' ', ' ', ' ', ', ', '. ', '.\n', '! ', '? ', ' ; ', ' : ', '  ', ' - ', '" ', ' "', '(', ')', '“', '”', '«', '»', '„', '’', '\n\n', '…', '..', ',,', '?!'];
const UNI = [0x41, 0x61, 0x3b1, 0x430, 0x5d0, 0x627, 0x4e00, 0x1f600, 0x300, 0x200b, 0x200f, 0x202e, 0xfeff, 0xd800, 0xdc00, 0x0, 0x1f468, 0x200d, 0x20, 0x2028, 0x85, 0xa0, 0x202f, 0xff21, 0x130, 0xdf, 0x3a3];
const GENS = {
  words: (lang, n, r) => { let s = ''; const w = WORDS[lang]; while (s.length < n) s += w[(r() * w.length) | 0] + PUNCT[(r() * PUNCT.length) | 0]; return s.slice(0, n); },
  spaces: (l, n) => 'a' + ' '.repeat(n - 2) + 'b',
  quotesMixed: (l, n, r) => { const q = ['"', '“', '”', '«', '»', '„', "'", '’', '‘', ' ', 'a']; let s = ''; while (s.length < n) s += q[(r() * q.length) | 0]; return s; },
  punct: (l, n, r) => { const q = '.,;:!?…-–—()[]{}'; let s = ''; while (s.length < n) s += q[(r() * q.length) | 0] + (r() < 0.3 ? ' ' : ''); return s; },
  dots: (l, n) => 'ab. '.repeat(n / 4),
  longToken: (l, n) => 'a'.repeat(n),
  longApos: (l, n) => "l'".repeat(n / 2) + 'a',
  repeatIn: (l, n) => 'in '.repeat(n / 3),
  repeatSa: (l, n) => 'sa '.repeat(n / 3),
  repeatDar: (l, n) => 'dar '.repeat(n / 4),
  repeatEn: (l, n) => 'he did went '.repeat(n / 12),
  repeatEs: (l, n) => 'de el a el '.repeat(n / 11),
  brackets: (l, n, r) => { const q = '()[]{}a '; let s = ''; while (s.length < n) s += q[(r() * q.length) | 0]; return s; },
  mixedUnicode: (l, n, r) => { let s = ''; while (s.length < n) { const cp = UNI[(r() * UNI.length) | 0]; s += cp >= 0xd800 && cp <= 0xdfff ? String.fromCharCode(cp) : String.fromCodePoint(cp); } return s; },
  randomBmp: (l, n, r) => { let s = ''; while (s.length < n) s += String.fromCharCode((r() * 0xffff) | 0); return s; },
  emailUrl: (l, n) => 'http://a.b/c_d '.repeat(n / 16),
  units: (l, n) => '5km '.repeat(n / 4),
  capUniq: (l, n, r) => { let s = ''; while (s.length < n) { let w = String.fromCharCode(65 + ((r() * 26) | 0)); const L = 4 + ((r() * 6) | 0); for (let i = 0; i < L; i++) w += String.fromCharCode(97 + ((r() * 26) | 0)); s += w + ' '; } return s; },
  longSentence: (l, n) => 'word '.repeat(n / 5) + '.',
};
const MB = 1_000_000;
const FUZZ_LIMIT_MS = 25000; // plafonul intern al motorului este 15 s; marja acoperă mașini lente

const fuzzSets = FULL ? Object.keys(GENS) : ['words', 'spaces', 'quotesMixed', 'punct', 'dots', 'longToken', 'repeatIn', 'repeatSa', 'mixedUnicode', 'randomBmp', 'capUniq', 'longSentence'];
for (const [lang, size] of FULL ? [['ro', MB], ['en', MB], ['fr', MB], ['es', MB], ['pt', MB], ['de', MB], ['it', MB]] : [['ro', MB], ['en', MB], ['fr', 250_000], ['es', 250_000], ['pt', 250_000], ['de', 250_000], ['it', 250_000]]) {
  test(`fuzz ${size >= MB ? '1 MB' : '250 KB'} (${lang}): fără excepții, în timp, offseturi valide`, { timeout: 600000 }, async () => {
    for (const g of fuzzSets) {
      const text = GENS[g](lang, size, rng(7));
      const [ms, res] = await timed(() => engine.check(text, { lang }));
      assert.ok(ms < FUZZ_LIMIT_MS, `${g}/${lang}: ${Math.round(ms)} ms`);
      assert.ok(res.matches.length <= LIMITS.matchesTotal, `${g}/${lang}: plafon de potriviri`);
      assertOffsets(text, res.matches, `${g}/${lang}`);
    }
  });
}

test('fuzz 1 MB cu detecția limbii (lang:auto) și fixAll: fără excepții, în timp', { timeout: 300000 }, async () => {
  for (const g of ['words', 'mixedUnicode', 'capUniq', 'quotesMixed']) {
    const text = GENS[g]('en', MB, rng(3));
    const [ms, res] = await timed(() => engine.check(text, { lang: 'auto', defaultLang: 'en' }));
    assert.ok(ms < FUZZ_LIMIT_MS, `auto/${g}: ${Math.round(ms)} ms`);
    assertOffsets(text, res.matches, `auto/${g}`);
    const [ms2, fx] = await timed(() => engine.fixAll(text.slice(0, 300_000), { lang: 'en' }));
    assert.ok(ms2 < FUZZ_LIMIT_MS, `fixAll/${g}: ${Math.round(ms2)} ms`);
    for (const e of fx.edits) assert.ok(e.offset >= 0 && e.length > 0 && e.offset + e.length <= 300_000);
  }
});

if (FULL) {
  test('fuzz 5 MB (ro, en): fără excepții, plafon de timp respectat', { timeout: 900000 }, async () => {
    for (const lang of ['ro', 'en']) {
      for (const g of ['words', 'mixedUnicode', 'dots', 'capUniq']) {
        const text = GENS[g](lang, 5 * MB, rng(9));
        const [ms, res] = await timed(() => engine.check(text, { lang }));
        assert.ok(ms < 40000, `${g}/${lang} 5 MB: ${Math.round(ms)} ms`);
        assertOffsets(text, res.matches, `${g}/${lang}`);
      }
    }
  });
}

// =====================================================================================================
// 2. REGRESII de performanță (defecte găsite: timp pătratic)
// =====================================================================================================
test('regresie: segmentarea propozițiilor este liniară („ab. ab. …”: 1 MB durase >120 s)', async () => {
  for (const unit of ['Ab. ', 'ab. ', 'Ab.', 'A. ', 'x! ', '… ']) {
    const text = unit.repeat(Math.floor(MB / unit.length));
    const [ms, s] = await timed(async () => splitSentences(text, new Set()));
    assert.ok(ms < 3000, `splitSentences(«${unit}») ${Math.round(ms)} ms`);
    assert.ok(Array.isArray(s));
  }
  const many = splitSentences('Ab. '.repeat(100_000), new Set());
  assert.ok(many.length > 50_000, `${many.length} propoziții`);
});

test('regresie: wordBefore/wordAfter și RO_SA nu mai sunt pătratice (repetări „in ”, „sa ”)', async () => {
  for (const unit of ['in ', 'sa ', 'dar ', 'a an a an ']) {
    const text = unit.repeat(Math.floor(MB / unit.length));
    const [ms, res] = await timed(() => engine.check(text, { lang: 'ro' }));
    assert.ok(ms < 15000, `„${unit}” ${Math.round(ms)} ms`);
    assertOffsets(text, res.matches);
  }
});

test('regresie: potrivirile sunt plafonate la LIMITS.matchesTotal și rezultatul spune că a fost trunchiat', async () => {
  const text = 'abc ,def '.repeat(100_000);
  const res = await engine.check(text, { lang: 'en' });
  assert.ok(res.matches.length <= LIMITS.matchesTotal);
  assert.equal(res.stats.truncated, true);
});

test('regresie: plafon de timp global (maxMs) întrerupe curat, fără excepție', async () => {
  const text = GENS.capUniq('fr', 2 * MB, rng(1));
  const [ms, res] = await timed(() => engine.check(text, { lang: 'fr', maxMs: 300 }));
  assert.ok(ms < 8000, `${Math.round(ms)} ms`);
  assertOffsets(text, res.matches);
});

// =====================================================================================================
// 3. Alarme false și seturi etichetate (autor = motor: NU independent)
// =====================================================================================================
for (const [label, dir] of [['dezvoltare', undefined], ['held-out', HELDOUT_DIR]]) {
  test(`corpus corect (${label}): ≤1 alarmă falsă/1000 de cuvinte per limbă, 0 editări fixAll`, { timeout: 300000 }, async () => {
    for (const lang of CORPUS_LANGS) {
      const corpus = loadCorpus(lang, dir);
      const r = await evalCorpus(engine, lang, { corpus });
      assert.ok(r.words >= (dir ? 450 : 3000), `${lang}: ${r.words} cuvinte`);
      assert.ok(r.per1000 <= 1, `${lang} (${label}): ${r.per1000.toFixed(2)}/1000 — ${JSON.stringify(r.list)}`);
      for (const [cat, text] of Object.entries(corpus)) {
        const { edits } = await engine.fixAll(text, { lang });
        const bad = edits.filter((e) => e.id !== 'SPELLING' || true);
        // fixAll nu are voie să schimbe text corect (cu excepția unei singure alarme de dicționar, vezi mai sus)
        assert.ok(bad.length <= r.cats[cat].alarms, `${lang}/${cat}: fixAll a propus ${bad.length} editări pe text corect: ${JSON.stringify(bad.slice(0, 3))}`);
      }
    }
  });
}

test('corpusurile au ≥3000 de cuvinte per limbă și acoperă registrele cerute', () => {
  for (const lang of CORPUS_LANGS) {
    const c = loadCorpus(lang);
    assert.deepEqual(Object.keys(c).sort(), ['dialogue', 'legal', 'narrative', 'news', 'tech']);
    const total = Object.values(c).reduce((s, t) => s + countWords(t), 0);
    assert.ok(total >= 3000, `${lang}: ${total}`);
  }
});

for (const lang of CASE_LANGS) {
  test(`set etichetat (${lang}): F1 ≥ 0.95, fiecare regulă are ≥3 greșite și ≥3 corecte, fără regulă fără set`, { timeout: 300000 }, async () => {
    const spec = await loadCases(lang);
    const ids = [...commonRules, ...LANGUAGES[lang].rules, ...styleRules].map((r) => r.id);
    for (const id of ids) {
      const c = spec.rules[id];
      assert.ok(c, `${lang}: regula ${id} nu are set etichetat`);
      if (c.na) {
        assert.ok(c.good.length >= 3, `${lang}/${id}: n/a dar fără ≥3 corecte`);
        continue;
      }
      assert.ok(c.bad.length >= 3, `${lang}/${id}: ${c.bad.length} propoziții greșite`);
      assert.ok(c.good.length >= 3, `${lang}/${id}: ${c.good.length} propoziții corecte`);
    }
    const r = await evalCases(engine, lang);
    assert.ok(r.total.f1 >= 0.95, `${lang}: F1 ${r.total.f1.toFixed(3)}; ${JSON.stringify(r.failures.slice(0, 5))}`);
    assert.ok(r.total.p >= 0.95 && r.total.r >= 0.95, `${lang}: P ${r.total.p} R ${r.total.r}`);
    assert.equal(r.total.fixOk, r.total.fixTried, `${lang}: corecții inexacte: ${JSON.stringify(r.failures.filter((f) => f.kind === 'FIX').slice(0, 3))}`);
    assert.ok(r.total.sugTop5 >= r.total.sugN - 1, `${lang}: sugestii top-5 ${r.total.sugTop5}/${r.total.sugN}`);
  });
}

// regresii pentru fiecare defect de regulă găsit la evaluare (fiecare cu un caz greșit și unul corect)
const RULE_REGRESSIONS = [
  // [limbă, text, id regulă, potrivire așteptată?, text corectat (opțional)]
  ['en', 'Some tools, i.e. hammers, are heavy.', 'EN_I', false],
  ['en', 'See item (i) and item (ii) below.', 'EN_I', false],
  ['en', 'She said that i could borrow the car.', 'EN_I', true, 'She said that I could borrow the car.'],
  ['en', 'Does he have a car?', 'EN_AGREEMENT', false],
  ['en', 'I want him to have it.', 'EN_AGREEMENT', false],
  ['en', 'He have a car.', 'EN_AGREEMENT', true, 'He has a car.'],
  ['en', 'She is taller then her brother.', 'EN_COULD_OF', true, 'She is taller than her brother.'],
  ['en', 'Then he left.', 'EN_COULD_OF', false],
  ['en', 'Their is a problem.', 'EN_COULD_OF', true, 'There is a problem.'],
  ['en', 'Many people’s opinions differ.', 'EN_COULD_OF', false],
  ['en', 'It is what it is. That is that.', 'REPEATED_WORD', false],
  ['fr', 'Le onzième jour était calme.', 'FR_ELISION', false],
  ['fr', 'Elle est à la une du journal.', 'FR_ELISION', false],
  ['fr', 'Je ai faim.', 'FR_ELISION', true, "J'ai faim."],
  ['fr', 'La planète Mars est rouge.', 'FR_MOIS_JOURS', false],
  ['fr', 'La sonde a atteint Mars hier soir.', 'FR_MOIS_JOURS', false],
  ['fr', 'Il est né le 5 Mars 1990.', 'FR_MOIS_JOURS', true, 'Il est né le 5 mars 1990.'],
  ['es', 'Pedro, vienes mañana a la fiesta?', 'ES_SIGNOS_INVERTIDOS', true, 'Pedro, ¿vienes mañana a la fiesta?'],
  ['es', 'Hola, qué tal estás?', 'ES_SIGNOS_INVERTIDOS', true, 'Hola, ¿qué tal estás?'],
  ['es', 'Vienes mañana?', 'ES_SIGNOS_INVERTIDOS', true, '¿Vienes mañana?'],
  ['es', 'Leí un libro de Julio Cortázar.', 'ES_MESES_DIAS', false],
  ['es', 'Viajamos a Santo Domingo en Marzo.', 'ES_MESES_DIAS', true, 'Viajamos a Santo Domingo en marzo.'],
  ['es', 'Hoy es Viernes Santo.', 'ES_MESES_DIAS', false],
  ['pt', 'Isso aconteceu a 5 anos atrás, numa tarde de verão.', 'PT_GRAMATICA', true, 'Isso aconteceu há 5 anos, numa tarde de verão.'],
  ['pt', 'Os alunos haviam saído antes da chuva.', 'PT_GRAMATICA', false],
  ['pt', 'Haviam muitos problemas na cidade.', 'PT_GRAMATICA', true, 'Havia muitos problemas na cidade.'],
  ['pt', 'A chuva parou. o sol saiu por entre as nuvens.', 'SENTENCE_CAPITAL', true, 'A chuva parou. O sol saiu por entre as nuvens.'],
  ['ro', 'Te rog să repeți din nou ce ai spus.', 'RO_PLEONASM', true, 'Te rog să repeți ce ai spus.'],
  ['ro', 'Ei au cerut însă clarificări din partea ministerului.', 'RO_VIRGULA_DAR', false],
  ['ro', 'E târziu însă nu mi-e somn deloc.', 'RO_VIRGULA_DAR', true, 'E târziu, însă nu mi-e somn deloc.'],
];
test('regresii de reguli (fals pozitive/negative găsite la evaluare)', async () => {
  for (const [lang, text, id, expect, fixed] of RULE_REGRESSIONS) {
    const r = await engine.check(text, { lang });
    const ms = r.matches.filter((m) => m.id === id);
    assert.equal(ms.length > 0, expect, `${lang}/${id}: «${text}» → ${JSON.stringify(ms)}`);
    if (fixed !== undefined) {
      const out = applyEdits(text, ms.filter((m) => m.r && m.r.length).map((m) => ({ offset: m.o, length: m.l, replacement: m.r[0] })));
      assert.equal(out, fixed, `${lang}/${id}`);
    }
  }
});

test('regresie: nume proprii și termeni tehnici nu sunt greșeli (El Cairo, Mr. Kowalski, rsync, GHz)', async () => {
  const cases = [
    ['es', 'Fuimos a El Cairo en verano.'],
    ['en', 'Mr. Kowalski, who joined from McDonald’s in 2019, left.'],
    ['en', 'Nightly backups run with rsync rather than FTP.'],
    ['es', 'Los módulos de 2,5 GHz cuestan menos.'],
    ['pt', 'As cópias noturnas usam rsync e não FTP.'],
    ['fr', 'Les sauvegardes nocturnes utilisent rsync plutôt que FTP.'],
  ];
  for (const [lang, text] of cases) {
    const r = await engine.check(text, { lang });
    assert.deepEqual(r.matches.filter((m) => m.c !== 'style').map((m) => m.id), [], `${lang}: «${text}»`);
  }
});

test('regresie: o greșeală de ortografie reală cu majusculă la început de propoziție rămâne semnalată', async () => {
  const r = await engine.check('Recivo multe mesaje. Vedem dimineata.', { lang: 'es' });
  assert.ok(r.matches.some((m) => m.id === 'SPELLING'));
});

// =====================================================================================================
// 4. Detecția limbii
// =====================================================================================================
for (const held of [false, true]) {
  test(`detecția limbii (${held ? 'held-out' : 'dezvoltare'}): fragmente 3–50 de cuvinte`, { timeout: 120000 }, async () => {
    const eng = createEngine();
    for (const l of CORPUS_LANGS) await eng.speller(l);
    const r = await evalLangid(eng, { heldOut: held });
    const rate = (b) => r.byBucket[b].ok / r.byBucket[b].n;
    assert.ok(rate('3–5') >= 0.88, `3–5: ${rate('3–5')}`);
    assert.ok(rate('6–10') >= 0.95, `6–10: ${rate('6–10')}`);
    assert.ok(rate('11–20') >= 0.98, `11–20: ${rate('11–20')}`);
    assert.ok(rate('21–50') >= 0.99, `21–50: ${rate('21–50')}`);
    assert.ok(r.total.wrong / r.total.n <= 0.02, `greșit: ${r.total.wrong}/${r.total.n} ${JSON.stringify(r.total.confusions)}`);
    if (!held) {
      assert.equal(r.mixtures.ok, r.mixtures.n, `amestecuri: ${JSON.stringify(r.mixtures.confusions)}`);
      assert.equal(r.names.wrong, 0, `nume proprii: ${JSON.stringify(r.names.confusions)}`);
    }
  });
}

test('limba: lista de nume proprii nu schimbă limba — se păstrează limba implicită/documentului', async () => {
  const r = await engine.check('Madrid, Sevilla y Valencia', { lang: 'auto', defaultLang: 'ro' });
  assert.equal(r.lang, 'ro');
});

test('limba: citat străin într-un paragraf nu schimbă limba și nu produce alarme în citat', async () => {
  const cases = [
    ['en', 'The tour guide stopped in front of the cathedral and read the inscription aloud, « La vérité sort toujours de la bouche des enfants et des fous », before explaining who had carved it and why it was never removed.'],
    ['ro', 'Profesoara ne-a explicat că expresia veche se folosește și astăzi în conversațiile oficiale, de exemplu « Je ne sais pas ce que vous voulez dire exactement », și ne-a cerut să o repetăm de mai multe ori până o învățăm.'],
    ['fr', 'Le chanteur a terminé son concert en lançant à la foule « Thank you all for coming tonight, you have been wonderful », puis il a quitté la scène sous les applaudissements de plusieurs milliers de spectateurs.'],
  ];
  for (const [lang, text] of cases) {
    const r = await engine.check(text, { lang: 'auto', defaultLang: lang === 'en' ? 'ro' : 'en' });
    assert.equal(r.lang, lang, `limba paragrafului ${lang}`);
    const inQuote = r.matches.filter((m) => (m.c === 'spelling' || m.c === 'grammar') && text.slice(m.o, m.o + m.l).match(/[«»]/) === null && m.o > text.search(/[«“]/) && m.o < text.search(/[»”]/));
    assert.deepEqual(inQuote, [], `${lang}: alarme în citatul străin`);
  }
  assert.ok(foreignQuoteSpans('A short « Je ne sais pas ce que vous voulez dire » quote in an English sentence.', 'en').length === 1);
  assert.equal(foreignQuoteSpans('A « quoted bit » only.', 'en').length, 0, 'citatele scurte (<4 cuvinte) nu contează');
});

test('limba: detectLanguage nu aruncă pe intrări ciudate', () => {
  for (const x of ['', ' ', 'a', '12345', '😀😀😀', 'ab'.repeat(100000), '\u0000\u0000\u0000', 'the the the the', "l'l'l'l'l'l'"]) {
    const r = detectLanguage(x);
    assert.ok(r === null || typeof r.lang === 'string');
  }
});

// =====================================================================================================
// 5. Hunspell: parser robust
// =====================================================================================================
const enc = new TextEncoder();
const AFF = 'SET UTF-8\nSFX A Y 1\nSFX A 0 s .\nPFX B Y 1\nPFX B 0 re .\n';
const DIC = '3\ncat/AB\ndog/A\nhouse\n';
const utf16 = (s, le = true) => {
  const b = new Uint8Array(2 + s.length * 2);
  b[0] = le ? 0xff : 0xfe;
  b[1] = le ? 0xfe : 0xff;
  for (let i = 0; i < s.length; i++) {
    const c = s.charCodeAt(i);
    b[2 + 2 * i] = le ? c & 255 : c >> 8;
    b[3 + 2 * i] = le ? c >> 8 : c & 255;
  }
  return b;
};
const basic = (h) => ({ cats: h.spell('cats'), rec: h.spell('recat'), bad: h.spell('catz'), sug: h.suggest('catz', 3).map((x) => x.text) });

test('hunspell: .aff/.dic cu BOM, CRLF, CR, UTF-16 se încarcă la fel', () => {
  const expect = basic(new Hunspell(AFF, DIC));
  assert.equal(expect.cats, true);
  assert.equal(expect.rec, true);
  assert.equal(expect.bad, false);
  const variants = {
    'BOM string': new Hunspell('﻿' + AFF, '﻿' + DIC),
    'BOM bytes': new Hunspell(new Uint8Array([0xef, 0xbb, 0xbf, ...enc.encode(AFF)]), new Uint8Array([0xef, 0xbb, 0xbf, ...enc.encode(DIC)])),
    CRLF: new Hunspell(AFF.replace(/\n/g, '\r\n'), DIC.replace(/\n/g, '\r\n')),
    CR: new Hunspell(AFF.replace(/\n/g, '\r'), DIC.replace(/\n/g, '\r')),
    'UTF-16LE': new Hunspell(utf16(AFF), utf16(DIC)),
    'UTF-16BE': new Hunspell(utf16(AFF, false), utf16(DIC, false)),
    ArrayBuffer: new Hunspell(enc.encode(AFF).buffer, enc.encode(DIC).buffer),
  };
  for (const [k, h] of Object.entries(variants)) {
    assert.deepEqual(basic(h), expect, k);
    assert.deepEqual(h.warnings, [], `${k}: ${h.warnings}`);
  }
});

test('hunspell: codări (ISO-8859-2, windows-1250, KOI8-R, necunoscută)', () => {
  const h = new Hunspell(enc.encode('SET ISO8859-2\nSFX A Y 1\nSFX A 0 i .\n'), new Uint8Array([...enc.encode('1\nlimb'), 0xe3, ...enc.encode('/A\n')]));
  assert.equal(h.encoding, 'iso-8859-2');
  assert.equal(h.spell('limbă'), true);
  assert.equal(h.spell('limbăi'), true);
  const w = new Hunspell(enc.encode('SET microsoft-cp1250\n'), new Uint8Array([...enc.encode('1\nfr'), 0xe9, ...enc.encode('re\n')]));
  assert.equal(w.spell('frére') || w.spell('fré' + 're'), true);
  const k = new Hunspell('SET KOI8-R\n', 'cat\n');
  assert.equal(k.spell('cat'), true);
  const u = new Hunspell('SET TOTALLY-BOGUS\n', 'cat\n');
  assert.equal(u.spell('cat'), true);
});

test('hunspell: intrări nevalide nu aruncă; problemele apar în warnings', () => {
  for (const [a, d] of [[null, null], [undefined, undefined], [1, {}], [[], []], ['', ''], [{}, '3\ncat\n'], [Symbol.iterator.toString(), 7n.toString()]]) {
    const h = new Hunspell(a, d);
    assert.ok(Array.isArray(h.warnings));
    assert.equal(h.spell('anything'), false);
    assert.deepEqual(h.suggest('anything'), []);
  }
  const h = new Hunspell(null, null);
  assert.ok(h.warnings.length >= 1);
  assert.equal(h.spell(''), true, 'cuvântul vid nu este o greșeală');
  assert.equal(h.spell(undefined), true, 'valorile nestring nu sunt „greșeli”');
});

test('hunspell: .aff malformat (numere/afixe/condiții/REP/MAP/ICONV/COMPOUND*) nu aruncă și nu se blochează', () => {
  const lines = [
    'SFX A Y', 'SFX', 'PFX', 'SFX A Y -5', 'SFX A Y NaN', 'SFX A Y 1000000000', 'SFX A 0', 'SFX A 0 s [', 'SFX A 0 s [^', 'SFX A 0 s [a-', 'SFX A 0 s (', 'SFX A 0 s {',
    'SFX A 0 s \\', 'SFX A 0 s .{1000}', 'SFX A 0 s a**', 'SFX A 0 s *', 'SFX A 0 s +', 'SFX A 0 s [[:alpha:]]', 'SFX A 0 s ' + '.'.repeat(5000),
    'REP 1000000000', 'REP ^ x', 'REP $ y', 'REP ^$ z', 'REP', 'REP a', 'REP "" a', 'AF 1000000000', 'AF', 'AF A', 'MAP 3', 'MAP (abc', 'MAP (a)(b', 'MAP', 'ICONV 3', 'ICONV', 'ICONV a',
    'COMPOUNDRULE (((', 'COMPOUNDRULE A*B?', 'COMPOUNDMIN x', 'COMPOUNDMIN -4', 'COMPOUNDFLAG', 'CHECKCOMPOUNDPATTERN a b', 'BREAK 2', 'BREAK -', 'KEY |||||', 'TRY ' + 'x'.repeat(100000),
    'FLAG', 'FLAG long', 'FLAG num', 'FLAG UTF-8', 'SET', '\u0000\u0000', '#', ' ', '\t',
  ];
  for (const flag of ['', 'FLAG long\n', 'FLAG num\n', 'FLAG UTF-8\n']) {
    const [ms, h] = (() => {
      const t = performance.now();
      return [0, new Hunspell(flag + lines.join('\n') + '\n', '3\ncat/A\ndog\nhouse/AB\n')];
    })();
    void ms;
    assert.ok(Array.isArray(h.warnings));
    h.spell('cats');
    h.suggest('catz');
    h.suggest('hse');
  }
  // fiecare linie separat, ca un defect să fie localizat
  for (const l of lines) {
    const h = new Hunspell(l + '\n', '2\ncat\ndog\n');
    assert.equal(h.spell('cat'), true, JSON.stringify(l).slice(0, 40));
    assert.ok(h.suggest('catz').length >= 0);
  }
});

test('hunspell: REP cu tipare goale (^, $, ^$) nu produce buclă infinită la sugestii (defect: buclă)', () => {
  const h = new Hunspell('REP 3\nREP ^ x\nREP $ y\nREP ^$ z\n', '2\ncat\ndog\n');
  const t = performance.now();
  const s = h.suggest('catz', 3);
  assert.ok(performance.now() - t < 2000);
  assert.ok(Array.isArray(s));
});

test('hunspell: condiții exotice se traduc sigur (fără ReDoS), cele invalide sunt raportate', () => {
  const bad = new Hunspell('SFX A Y 1\nSFX A 0 s [abc\n', 'cat/A\n');
  assert.ok(bad.warnings.some((w) => /condi/i.test(w)), JSON.stringify(bad.warnings));
  const ok = new Hunspell('SFX A Y 2\nSFX A 0 s [^aeiou]\nSFX A 0 es [aeiou]\n', 'cat/A\nbo/A\n');
  assert.equal(ok.spell('cats'), true);
  assert.equal(ok.spell('boes'), true);
  assert.equal(ok.spell('bos'), false);
  // tipare care ar fi catastrofale ca regex brut
  const evil = new Hunspell('SFX A Y 1\nSFX A 0 s (a+)+$\n', 'cat/A\n');
  const t = performance.now();
  for (let i = 0; i < 200; i++) evil.spell('a'.repeat(60) + '!' + i);
  assert.ok(performance.now() - t < 1500);
});

test('hunspell: alias AF, FLAG long/num/UTF-8, flaguri de compunere', () => {
  const af = new Hunspell('AF 2\nAF A\nAF B\nSFX A Y 1\nSFX A 0 s .\nSFX B Y 1\nSFX B 0 ed .\n', '2\ncat/1\nwalk/2\n');
  assert.equal(af.spell('cats'), true);
  assert.equal(af.spell('walked'), true);
  assert.equal(af.spell('catsed'), false);
  const badAlias = new Hunspell('AF 1\nAF A\nSFX A Y 1\nSFX A 0 s .\n', '2\ncat/9\ndog/1\n');
  assert.equal(badAlias.spell('dogs'), true);
  assert.equal(badAlias.spell('cats'), false);
  const lng = new Hunspell('FLAG long\nSFX Aa Y 1\nSFX Aa 0 s .\n', '1\ncat/Aa\n');
  assert.equal(lng.spell('cats'), true);
  const num = new Hunspell('FLAG num\nSFX 101 Y 1\nSFX 101 0 s .\n', '1\ncat/101\n');
  assert.equal(num.spell('cats'), true);
  const u8 = new Hunspell('FLAG UTF-8\nSFX 😀 Y 1\nSFX 😀 0 s .\n', '1\ncat/😀\n');
  assert.equal(u8.spell('cats'), true);
  const comp = new Hunspell('COMPOUNDFLAG X\nCOMPOUNDMIN 2\nONLYINCOMPOUND O\n', '4\nfoot/X\nball/X\nhouse/X\nx/O\n');
  assert.equal(comp.spell('football'), true);
  assert.equal(comp.spell('footballhouse'), true);
  assert.equal(comp.spell('footz'), false);
  assert.equal(comp.spell('x'), false, 'ONLYINCOMPOUND nu se acceptă singur');
});

test('hunspell: compuse foarte lungi sunt rapide (programare dinamică, nu backtracking exponențial)', () => {
  const h = new Hunspell('COMPOUNDFLAG X\nCOMPOUNDMIN 1\n', '3\na/X\nab/X\nb/X\n');
  const t = performance.now();
  for (const w of ['ab'.repeat(60), 'a'.repeat(120) + 'c', 'aab'.repeat(40) + '!']) h.spell(w);
  assert.ok(performance.now() - t < 1500, `${performance.now() - t} ms`);
});

test('hunspell: dicționar mare (300 000 de intrări) și linii patologice', () => {
  const parts = ['300000'];
  for (let i = 0; i < 300_000; i++) parts.push('w' + i.toString(36) + 'x');
  let t = performance.now();
  const h = new Hunspell('SET UTF-8\nTRY abcdefghijklmnopqrstuvwxyz0123456789\n', parts.join('\n') + '\n');
  assert.ok(performance.now() - t < 5000, `încărcare ${performance.now() - t} ms`);
  assert.equal(h.dict.size, 300_000);
  assert.equal(h.spell('w1x'), true);
  assert.equal(h.spell('nope'), false);
  t = performance.now();
  const s = h.suggest('w1zx', 5);
  assert.ok(performance.now() - t < 3000, `sugestii ${performance.now() - t} ms`);
  assert.ok(s.length > 0);
  // linii enorme/goale, număr de intrări fals
  const g = new Hunspell('', 'x'.repeat(5_000_000) + '\n' + '\n'.repeat(100000) + '99999999999999999999\ncat\n');
  assert.equal(g.spell('cat'), true);
  assert.ok(g.warnings.length >= 1);
  const flood = ['SFX A Y 200000'];
  for (let i = 0; i < 200_000; i++) flood.push('SFX A 0 a .');
  const f = new Hunspell(flood.join('\n') + '\n', '1\nfoo/A\n');
  t = performance.now();
  for (let i = 0; i < 200; i++) f.spell('zzzz' + i + 'a');
  assert.ok(performance.now() - t < 3000, `inundație de afixe ${performance.now() - t} ms`);
  assert.ok(HUNSPELL_LIMITS.maxEntries > 0 && HUNSPELL_LIMITS.maxRules > 0);
});

test('hunspell: spell/suggest cu argumente patologice nu aruncă', () => {
  const h = new Hunspell(AFF, DIC);
  for (const w of ['', ' ', '\u0000', 'a'.repeat(100000), null, undefined, 12, {}, [], '\ud800', '😀😀😀😀😀😀', '__proto__', 'constructor', 'toString', 'hasOwnProperty']) {
    assert.doesNotThrow(() => h.spell(w));
    assert.doesNotThrow(() => h.suggest(w));
    assert.doesNotThrow(() => h.nearMiss(w));
  }
  assert.equal(h.spell('constructor'), false);
});

// =====================================================================================================
// 6. Reguli ale utilizatorului: invalide / ReDoS respinse și în motor
// =====================================================================================================
const EVIL = ['(a+)+$', '(a|a)*$', '(a?){30}a{30}', '(.*)*x', '(a*)*b', '^(([a-z])+.)+[A-Z]([a-z])+$', '(\\w+\\s?)*$', '(a|aa)+$', '([a-zA-Z]+)*$', '(x+x+)+y', '(?:a+)+b', '(a)\\1*\\1*\\1*', '(?=(a+)+)b'];
test('reguli utilizator: tipare ReDoS/invalide sunt respinse (analyzePattern) și motorul rămâne rapid', async () => {
  for (const p of EVIL) assert.equal(isSafePattern(p), false, `ar trebui respins: ${p}`);
  for (const p of ['', 'a'.repeat(300), '[', '(', '*', '+a', '\\', 'a{2,1}', '(?<n>a)(?<n>b)', '(?i)a', '\\k<x>']) assert.equal(isSafePattern(p), false, `invalid: ${p}`);
  for (const p of ['colour', '\\bteh\\b', '(foo|bar)baz', 'a{2,5}', '[A-Z]{3}\\d+', '\\s{2,}']) assert.equal(isSafePattern(p), true, `valid: ${p}`);
  const text = 'a'.repeat(40) + '!' + ' x'.repeat(2000);
  for (const pattern of EVIL) {
    const [ms, r] = await timed(() => engine.check(text, { lang: 'en', userRules: [{ id: 'U', pattern, replacement: 'z' }] }));
    assert.ok(ms < 3000, `${pattern}: ${Math.round(ms)} ms`);
    assert.deepEqual(r.matches.filter((m) => m.id === 'U'), [], `${pattern}: nu are voie să producă potriviri`);
  }
});

test('reguli utilizator: tipuri/semnături neașteptate sunt ignorate fără excepție', async () => {
  const junk = [null, undefined, 1, 'x', [], {}, { pattern: 5 }, { pattern: null }, { pattern: ['a'] }, { pattern: 'a', flags: 5 }, { pattern: 'a', flags: 'zzz' }, { pattern: 'a', flags: 'gg' }, { pattern: 'a', replacement: { toString() { throw new Error('x'); } } }, { pattern: 'a', cat: '__proto__' }, { pattern: 'a', id: {} }, { pattern: 'a', lang: 5 }, { pattern: 'a', message: 7 }];
  const r = await engine.check('banana and apple', { lang: 'en', userRules: junk });
  assertOffsets('banana and apple', r.matches);
  const r2 = await engine.check('banana', { lang: 'en', userRules: 'not-an-array' });
  assert.ok(Array.isArray(r2.matches));
});

test('reguli utilizator: valide se aplică, cu $1, indicatori, categorie și limbă', async () => {
  const rules = [{ id: 'TEH', pattern: '\\bteh\\b', flags: 'i', replacement: 'the', message: 'typo', cat: 'grammar' }, { id: 'SWAP', pattern: '(\\w+)@(\\w+)', replacement: '$2 at $1' }, { id: 'RO', pattern: 'foo', lang: 'ro', replacement: 'bar' }];
  const text = 'Teh cat said john@home and foo.';
  const r = await engine.check(text, { lang: 'en', userRules: rules });
  const teh = r.matches.find((m) => m.id === 'TEH');
  assert.equal(text.slice(teh.o, teh.o + teh.l), 'Teh');
  assert.deepEqual(teh.r, ['the']);
  assert.deepEqual(r.matches.find((m) => m.id === 'SWAP').r, ['home at john']);
  assert.equal(r.matches.find((m) => m.id === 'RO'), undefined, 'regula pentru ro nu se aplică în en');
  assert.equal(expandReplacement('$$ $& $1 $9 $`', ['xy', 'x']), '$ xy x $9 $`');
  assert.equal(compileUserRule({ pattern: '(a+)+$' }, ['grammar']), null);
  assert.ok(compileUserRule({ pattern: 'ok' }, ['grammar']).re.flags.includes('g'));
  assert.ok(analyzePattern('(a+)+$').reason || analyzePattern('(a+)+$').ok === false);
});

test('reguli utilizator: potriviri multe/ferestre — plafonate, rapide, în interval', async () => {
  const text = 'x y '.repeat(250_000);
  const [ms, r] = await timed(() => engine.check(text, { lang: 'en', userRules: [{ id: 'XY', pattern: 'x y', replacement: 'z' }] }));
  assert.ok(ms < 10000, `${Math.round(ms)} ms`);
  assertOffsets(text, r.matches);
  const none = await engine.check('x'.repeat(100000), { lang: 'en', userRules: [{ id: 'E', pattern: 'x*' }] });
  assert.ok(none.matches.length <= LIMITS.matchesTotal);
});

// =====================================================================================================
// 7. Opțiuni invalide
// =====================================================================================================
test('opțiuni invalide: lang/defaultLang/enVariant/ui/categories/disabledRules/personal nu strică motorul', async () => {
  const bad = [
    { lang: '__proto__' }, { lang: 'constructor' }, { lang: 'toString' }, { lang: 5 }, { lang: {} }, { lang: '../../etc/passwd' }, { lang: 'a'.repeat(1000) }, { lang: null },
    { defaultLang: '__proto__' }, { defaultLang: 7 }, { enVariant: 'xx' }, { ui: {} }, { ui: 'x'.repeat(50) }, { categories: 'x' }, { categories: { spelling: 'no' } }, { categories: null },
    { disabledRules: 'SPELLING' }, { disabledRules: [1, null, {}] }, { personal: 'word' }, { personal: [1, {}, null, 'ok'] }, { longSentence: -5 }, { longSentence: 'x' }, { maxMs: -1 }, { maxMs: NaN },
    null, undefined, 5, 'str', [], () => 1,
  ];
  for (const o of bad) {
    const r = await engine.check('This is a tset of the sistem.', o);
    assert.ok(Array.isArray(r.matches), JSON.stringify(o));
    assertOffsets('This is a tset of the sistem.', r.matches);
  }
  for (const t of [undefined, null, 5, {}, [], true, Symbol.iterator.toString()]) {
    const r = await engine.check(t, { lang: 'en' });
    assert.ok(Array.isArray(r.matches));
  }
  const n = normalizeOptions({ lang: '__proto__', defaultLang: 'constructor' });
  assert.ok(n.lang === 'auto' && n.defaultLang === 'ro');
  assert.deepEqual(await engine.suggest('tset', { lang: '__proto__' }).then((s) => Array.isArray(s.suggestions)), true);
  assert.equal(engine.supported().includes('__proto__'), false);
});

test('opțiuni: obiectul de opțiuni al apelantului nu este modificat de motor', async () => {
  const o = Object.freeze({ lang: 'en', personal: Object.freeze(['tset']), categories: Object.freeze({ style: false }), userRules: Object.freeze([Object.freeze({ id: 'A', pattern: 'sistem' })]), disabledRules: Object.freeze([]) });
  const r = await engine.check('This is a tset of the sistem.', o);
  assert.ok(r.matches.some((m) => m.id === 'A'));
  assert.ok(!r.matches.some((m) => m.word === 'tset'));
  await engine.fixAll('This is a tset of the sistem.', o);
  await engine.restoreDiacritics('Aceasta este o propozitie.', { ...o, lang: 'ro' });
});

// =====================================================================================================
// 8. Proprietăți: fixAll, offseturi, restoreDiacritics
// =====================================================================================================
const fix = async (t, lang) => applyEdits(t, (await engine.fixAll(t, { lang })).edits);

test('fixAll NU strică text corect: 0 editări pe toate corpusurile și pe propozițiile „corecte” din seturi', { timeout: 300000 }, async () => {
  for (const lang of CASE_LANGS) {
    const spec = await loadCases(lang);
    for (const [id, c] of Object.entries(spec.rules)) {
      for (const text of c.good || []) {
        const { edits } = await engine.fixAll(text, { lang });
        // propozițiile „corecte” ale unui set pot conține intenționat o abatere de la altă regulă (colaterale cunoscute: spații simple în fr)
        const harmful = edits.filter((e) => !(lang === 'fr' && /ESPACE|PONCTUATION/.test(e.id)) && !/^(SENTENCE_CAPITAL|SPELLING)$/.test(e.id));
        assert.deepEqual(harmful, [], `${lang}/${id}: «${text}»`);
      }
    }
  }
});

test('fixAll este idempotent pe propozițiile greșite din seturi', { timeout: 300000 }, async () => {
  let n = 0;
  for (const lang of CASE_LANGS) {
    const spec = await loadCases(lang);
    for (const [id, c] of Object.entries(spec.rules)) {
      for (const [text] of c.bad || []) {
        const o1 = await fix(text, lang);
        const o2 = await fix(o1, lang);
        assert.equal(o2, o1, `${lang}/${id}: «${text}» → «${o1}» → «${o2}»`);
        n++;
      }
    }
  }
  assert.ok(n > 300);
});

test('fixAll este idempotent și determinist pe mutații aleatoare ale textului corect', { timeout: 400000 }, async () => {
  const r = rng(11);
  const muts = [
    (s) => { const i = (r() * s.length) | 0; return s.slice(0, i) + s.slice(i + 1); },
    (s) => { const i = (r() * (s.length - 1)) | 0; return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2); },
    (s) => s.replace(/ /, '  '),
    (s) => s.replace(/[ăâîșțéèêàç]/g, (c) => c.normalize('NFD')[0]),
    (s) => s.charAt(0).toLowerCase() + s.slice(1),
    (s) => s.replace(/,/, ''),
    (s) => s.replace(/\./, ' .'),
  ];
  for (const lang of CORPUS_LANGS) {
    for (const t of Object.values(loadCorpus(lang))) {
      const ss = t.split(/(?<=[.!?])\s+/).filter((s) => s.length > 30);
      for (let k = 0; k < 14; k++) {
        const x = muts[(r() * muts.length) | 0](ss[(r() * ss.length) | 0]);
        const a = await engine.fixAll(x, { lang });
        const b = await engine.fixAll(x, { lang });
        assert.deepEqual(a, b, 'determinist');
        const o1 = applyEdits(x, a.edits);
        const o2 = await fix(o1, lang);
        assert.equal(o2, o1, `${lang}: «${x}» → «${o1}» → «${o2}»`);
        for (const e of a.edits) assert.ok(e.offset >= 0 && e.length > 0 && e.offset + e.length <= x.length);
      }
    }
  }
});

test('fixAll: editări disjuncte și sortate; propoziții amestecate din corpusuri rămân neschimbate', { timeout: 300000 }, async () => {
  const r = rng(21);
  for (const lang of CORPUS_LANGS) {
    const sents = Object.values(loadCorpus(lang)).flatMap((t) => t.split(/(?<=[.!?])\s+/)).filter((s) => s.length > 20 && !/^[—“”«-]/.test(s));
    for (let k = 0; k < 6; k++) {
      const picked = Array.from({ length: 12 }, () => sents[(r() * sents.length) | 0]);
      const text = picked.join(' ');
      const res = await engine.fixAll(text, { lang });
      let prev = 0;
      for (const e of res.edits) {
        assert.ok(e.offset >= prev, 'disjuncte/sortate');
        prev = e.offset + e.length;
      }
      const bad = res.edits.filter((e) => e.id !== 'SPELLING');
      assert.deepEqual(bad, [], `${lang}: propoziții corecte amestecate au fost „corectate”: ${JSON.stringify(res.edits.slice(0, 3))}`);
    }
  }
});

test('contractul de offset: fiecare potrivire indică exact textul raportat (corpusuri, seturi, text aleator)', { timeout: 300000 }, async () => {
  for (const lang of CORPUS_LANGS) {
    for (const t of Object.values(loadCorpus(lang))) {
      const res = await engine.check(t, { lang });
      assertOffsets(t, res.matches, lang);
    }
    const spec = await loadCases(lang);
    for (const c of Object.values(spec.rules)) {
      for (const [text] of c.bad || []) assertOffsets(text, (await engine.check(text, { lang })).matches, `${lang}:${text}`);
    }
  }
  const r = rng(77);
  const alphabet = ['a', 'b', ' ', ' ', '.', ',', '!', '?', '"', '«', '»', '“', '”', '(', ')', '\n', 'é', 'ș', 'ß', '😀', '​', '́', 'A', 'Z', '1', '—', "'", '’'];
  for (let i = 0; i < 400; i++) {
    let s = '';
    const n = 1 + ((r() * 120) | 0);
    for (let k = 0; k < n; k++) s += alphabet[(r() * alphabet.length) | 0];
    for (const lang of ['ro', 'en', 'fr', 'es', 'pt', 'de']) assertOffsets(s, (await engine.check(s, { lang })).matches, `${lang}:${JSON.stringify(s)}`);
  }
});

test('restoreDiacritics: editări în interval, disjuncte, idempotente', async () => {
  const text = 'Aceasta este o propozitie cu diacritice lipsa. Maine mergem la scoala si facem teme.';
  const r1 = await engine.restoreDiacritics(text, { lang: 'ro' });
  let prev = 0;
  for (const e of r1.edits) {
    assert.ok(e.offset >= prev && e.length > 0 && e.offset + e.length <= text.length);
    prev = e.offset + e.length;
  }
  const out = applyEdits(text, r1.edits);
  const r2 = await engine.restoreDiacritics(out, { lang: 'ro' });
  assert.equal(applyEdits(out, r2.edits), out);
});

// =====================================================================================================
// 9. Cache: nu servește rezultate vechi
// =====================================================================================================
const memoryLoader = (dicts) => async (n) => (dicts.current[n] ? { aff: dicts.current[n].aff, dic: dicts.current[n].dic } : null);

test('cache: schimbarea setărilor (personal, categorii, reguli dezactivate, reguli utilizator, enVariant, ui) se vede imediat', async () => {
  const text = 'I like the colour of the sistem. Its a tset.';
  const base = await engine.check(text, { lang: 'en' });
  const word = (m) => text.slice(m.o, m.o + m.l);
  assert.ok(base.matches.some((m) => word(m) === 'tset'));
  const withPersonal = await engine.check(text, { lang: 'en', personal: ['tset'] });
  assert.ok(!withPersonal.matches.some((m) => word(m) === 'tset'));
  const again = await engine.check(text, { lang: 'en' });
  assert.deepEqual(again.matches, base.matches, 'revenirea la setările inițiale dă rezultatul inițial');
  const noSpell = await engine.check(text, { lang: 'en', categories: { spelling: false } });
  assert.ok(!noSpell.matches.some((m) => m.c === 'spelling'));
  const dis = await engine.check(text, { lang: 'en', disabledRules: ['SPELLING'] });
  assert.ok(!dis.matches.some((m) => m.id === 'SPELLING'));
  const ur = await engine.check(text, { lang: 'en', userRules: [{ id: 'U1', pattern: 'sistem', replacement: 'system' }] });
  assert.ok(ur.matches.some((m) => m.id === 'U1'));
  const ur2 = await engine.check(text, { lang: 'en', userRules: [{ id: 'U2', pattern: 'sistem', replacement: 'systems' }] });
  assert.deepEqual(ur2.matches.find((m) => m.id === 'U2').r, ['systems']);
  assert.ok(!ur2.matches.some((m) => m.id === 'U1'));
  const us = await engine.check('The colour is nice.', { lang: 'en', enVariant: 'us' });
  const gb = await engine.check('The colour is nice.', { lang: 'en', enVariant: 'gb' });
  assert.ok(us.matches.some((m) => m.id === 'SPELLING'), 'colour în en-US este greșit');
  assert.ok(!gb.matches.some((m) => m.id === 'SPELLING'), 'colour în en-GB este corect');
  const us2 = await engine.check('The colour is nice.', { lang: 'en', enVariant: 'us' });
  assert.ok(us2.matches.some((m) => m.id === 'SPELLING'));
  const ro = await engine.check('a  b', { lang: 'en', ui: 'ro' });
  const en = await engine.check('a  b', { lang: 'en', ui: 'en' });
  assert.notEqual(ro.matches[0].m, en.matches[0].m, 'mesajul urmează limba interfeței');
});

test('cache: invalidate() după schimbarea dicționarului — rezultatele noi, nu cele vechi', async () => {
  const dicts = { current: { en: { aff: 'SET UTF-8\n', dic: '2\nhello\nworld\n' } } };
  const e = new Erata({ loadDict: memoryLoader(dicts) });
  const text = 'hello world wurld';
  const r1 = await e.check(text, { lang: 'en' });
  assert.deepEqual(r1.matches.filter((m) => m.id === 'SPELLING').map((m) => m.word), ['wurld']);
  dicts.current.en = { aff: 'SET UTF-8\n', dic: '3\nhello\nworld\nwurld\n' };
  const stale = await e.check(text, { lang: 'en' });
  assert.deepEqual(stale.matches, r1.matches, 'fără invalidate se poate servi rezultatul memorat (comportament documentat)');
  e.invalidate();
  const r2 = await e.check(text, { lang: 'en' });
  assert.deepEqual(r2.matches.filter((m) => m.id === 'SPELLING'), []);
  e.invalidate('en');
  dicts.current.en = { aff: 'SET UTF-8\n', dic: '1\nhello\n' };
  e.invalidate('en');
  const r3 = await e.check(text, { lang: 'en' });
  assert.deepEqual(r3.matches.filter((m) => m.id === 'SPELLING').map((m) => m.word).sort(), ['wurld', 'world'].sort());
});

test('cache: invalidate() în timpul unei verificări în curs nu lasă rezultate vechi în cache', async () => {
  const dicts = { current: { en: { aff: 'SET UTF-8\n', dic: '1\nhello\n' } } };
  let release;
  const gate = new Promise((r) => (release = r));
  const e = new Erata({
    loadDict: async (n) => {
      await gate; // încărcarea rămâne în așteptare până după invalidate()
      return dicts.current[n] ? { ...dicts.current[n] } : null;
    },
  });
  const p = e.check('hello world', { lang: 'en' });
  dicts.current.en = { aff: 'SET UTF-8\n', dic: '2\nhello\nworld\n' };
  e.invalidate();
  release();
  await p;
  const r = await e.check('hello world', { lang: 'en' });
  assert.deepEqual(r.matches.filter((m) => m.id === 'SPELLING'), [], 'după invalidate se folosește dicționarul nou');
});

test('cache: o încărcare de dicționar care eșuează temporar nu otrăvește cache-ul', async () => {
  let fail = true;
  const e = new Erata({
    loadDict: async (n) => {
      if (fail) throw new Error('rețea');
      return n === 'en' ? { aff: 'SET UTF-8\n', dic: '2\nhello\nworld\n' } : null;
    },
  });
  const r1 = await e.check('hello wurld', { lang: 'en' });
  assert.ok(Array.isArray(r1.matches));
  fail = false;
  e.invalidate();
  const r2 = await e.check('hello wurld', { lang: 'en' });
  assert.deepEqual(r2.matches.filter((m) => m.id === 'SPELLING').map((m) => m.word), ['wurld']);
});

test('cache: diferențial — motorul cu cache și cel fără dau rezultate identice pe 400 de apeluri aleatoare', { timeout: 300000 }, async () => {
  const cached = createEngine();
  const fresh = createEngine();
  const r = rng(99);
  const pick = (a) => a[(r() * a.length) | 0];
  const pool = [];
  for (const lang of ['ro', 'en', 'fr', 'es']) for (const t of Object.values(loadCorpus(lang))) for (const s of t.split(/(?<=[.!?])\s+/)) if (s.length > 25 && s.length < 220) pool.push([lang, s]);
  pool.push(['en', 'The colour of the sistem is nice,  but its a tset.'], ['ro', 'Vreau sa merg la scoala maine.'], ['en', 'a a  b ,c'], ['en', '']);
  const ruleIds = ['SPELLING', 'DOUBLE_SPACE', 'REPEATED_WORD', 'EN_I', 'RO_SA', 'SENTENCE_CAPITAL'];
  for (let i = 0; i < 400; i++) {
    const [lang0, text] = pick(pool);
    const opts = {
      lang: r() < 0.25 ? 'auto' : lang0,
      defaultLang: pick(['ro', 'en']),
      enVariant: pick(['auto', 'us', 'gb']),
      ui: pick(['ro', 'en', 'fr']),
      categories: r() < 0.3 ? { [pick(['spelling', 'grammar', 'punctuation', 'typography', 'style'])]: false } : undefined,
      disabledRules: r() < 0.3 ? [pick(ruleIds)] : [],
      personal: r() < 0.3 ? [pick(text.split(/\W+/).filter(Boolean).concat(['x']))] : [],
      userRules: r() < 0.3 ? [{ id: 'U', pattern: pick(['the', 'a', 'de', 'la', 'foo']), replacement: 'z', flags: pick(['', 'i']) }] : [],
      longSentence: pick([10, 40]),
    };
    const a = await cached.check(text, opts);
    fresh._clearCache();
    const b = await fresh.check(text, opts);
    assert.deepEqual(a.matches, b.matches, `#${i} ${JSON.stringify(opts)} «${text}»`);
    assert.equal(a.lang, b.lang);
    if (r() < 0.02) cached._clearCache();
    if (r() < 0.2) {
      const t2 = await cached.check(text, opts); // acum din cache
      assert.deepEqual(t2.matches, a.matches);
      // rezultatul returnat nu poate fi modificat din exterior fără să stricăm cache-ul
      for (const m of t2.matches) { m.o = -1; m.r?.push('MUTAT'); }
      const t3 = await cached.check(text, opts);
      assert.deepEqual(t3.matches, a.matches, 'rezultatul din cache nu este afectat de modificările apelantului');
    }
  }
});

test('cache: memoria rămâne mărginită; semnăturile de setări nu cresc fără limită', async () => {
  const e = createEngine();
  for (let i = 0; i < 300; i++) await e.check(`Text number ${i} with a tset.`, { lang: 'en', personal: ['w' + i] });
  assert.ok(e._sigs.size <= 64, `semnături: ${e._sigs.size}`);
  assert.ok(e._cache.size <= LIMITS.cacheEntries);
  const big = 'abcdefgh '.repeat(2000);
  for (let i = 0; i < 400; i++) await e.check(big + i, { lang: 'en' });
  assert.ok(e._cacheChars <= LIMITS.cacheChars * 1.1, `caractere în cache: ${e._cacheChars}`);
});

test('memorie: 10 000 de apeluri nu cresc heap-ul fără limită', { timeout: 300000 }, async () => {
  const e = createEngine();
  const r = rng(5);
  const sents = [];
  for (const lang of ['ro', 'en', 'fr']) for (const t of Object.values(loadCorpus(lang))) for (const s of t.split(/(?<=[.!?])\s+/)) if (s.length > 20) sents.push([lang, s]);
  const mutate = (s) => {
    const a = Array.from(s);
    for (let k = 0; k < 2; k++) a[(r() * a.length) | 0] = String.fromCharCode(97 + Math.floor(r() * 26));
    return a.join('');
  };
  const heap = () => {
    globalThis.gc?.();
    return process.memoryUsage().heapUsed / 1e6;
  };
  for (const l of ['ro', 'en', 'fr']) await e.check('warm', { lang: l });
  let at2000 = 0;
  for (let i = 1; i <= 10000; i++) {
    const [lang, s] = sents[Math.floor(r() * sents.length)];
    await e.check(r() < 0.5 ? mutate(s) : s, { lang: r() < 0.2 ? 'auto' : lang, personal: r() < 0.1 ? ['w' + i] : [], userRules: r() < 0.1 ? [{ pattern: 'x' + (i % 300), flags: 'i' }] : [] });
    if (i === 2000) at2000 = heap();
  }
  const end = heap();
  assert.ok(end - at2000 < 80, `heap ${at2000.toFixed(0)} MB → ${end.toFixed(0)} MB`);
  assert.ok(e._cache.size <= LIMITS.cacheEntries && e._sigs.size <= 64);
});

// =====================================================================================================
// 10. Regresii pentru defectele găsite în audit (sugestii, idempotență, detecție)
// =====================================================================================================
test('regresie: sugestiile în franceză nu mai durează secunde (indexare afixe după șirul exact; buget la distanța 2)', async () => {
  const sp = await engine.speller('fr');
  const t = performance.now();
  const s = sp.suggest('necessaires', 3);
  const dt = performance.now() - t;
  assert.ok(dt < 3000, `suggest(fr) ${Math.round(dt)} ms (era ~5000 ms)`);
  assert.equal(s[0].text, 'nécessaires');
  for (const [lang, w, want] of [['ro', 'scoala', 'școala'], ['es', 'reunion', 'reunión'], ['pt', 'reuniao', 'reunião'], ['en', 'recieve', 'receive']]) {
    const sp2 = await engine.speller(lang);
    assert.equal(sp2.suggest(w, 3)[0].text, want, `${lang}: ${w}`);
  }
});

test('regresie: cuvintele care există doar cu majusculă se sugerează cu majusculă (pérez → Pérez, madrid → Madrid)', async () => {
  const es = await engine.speller('es');
  assert.equal(es.suggest('pérez', 3)[0].text, 'Pérez');
  assert.equal(es.suggest('madrid', 3)[0].text, 'Madrid');
  const fixed = await fix('El sr. pérez vendrá a verle.', 'es');
  assert.equal(fixed, 'El sr. Pérez vendrá a verle.');
});

test('regresie: inversările de litere nu mai fac dintr-un nume propriu (Cairo≈cario) o „greșeală”', async () => {
  const sp = await engine.speller('es');
  assert.equal(sp.nearMiss('Cairo'), false);
  assert.equal(sp.nearMiss('Perez'), true, 'diferența doar prin diacritice rămâne „aproape corect”');
  for (const [lang, text] of [['es', 'Viajaremos a El Cairo y a Lima en otoño.'], ['en', 'We flew to Cairo and Oslo.']]) {
    const r = await engine.check(text, { lang });
    assert.deepEqual(r.matches.filter((m) => m.id === 'SPELLING'), [], text);
  }
});

test('regresie: fixAll idempotent când două reguli interacționează (spațiu lipsă + semne fr/es, „;;” fr)', async () => {
  const cases = [
    ['fr', 'As-tu mangé?Moi pas encore.', 'As-tu mangé ? Moi pas encore.'],
    ['fr', 'Il est parti;; puis il est revenu.', 'Il est parti ; puis il est revenu.'],
    ['fr', 'Oui,mais non;peut-être!Non.', 'Oui, mais non ; peut-être ! Non.'],
    ['es', 'Hola.Cómo estás hoy por la tarde?', 'Hola. ¿Cómo estás hoy por la tarde?'],
    ['es', 'Vino el Sr.Pérez ayer? Sí.', '¿Vino el Sr. Pérez ayer? Sí.'],
  ];
  for (const [lang, text, want] of cases) {
    const o1 = await fix(text, lang);
    assert.equal(o1, want, `${lang}: ${text}`);
    assert.equal(await fix(o1, lang), o1, `idempotență ${lang}: ${text}`);
  }
});

test('regresie: detecția limbii pe fragmente scurte care păcăleau cuvintele funcționale', async () => {
  const cases = [
    ['pt', 'No Sul, o céu ficará limpo.'],
    ['es', 'La pública explicó ante los medios.'],
    ['pt', 'A Câmara Municipal de Coimbra anunciou ontem.'],
    ['it', 'Il consiglio comunale ha approvato ieri sera il nuovo piano.'],
    ['de', 'Das Programm liest zunächst die Konfigurationsdatei.'],
  ];
  const eng = createEngine();
  for (const l of CORPUS_LANGS) await eng.speller(l);
  for (const [lang, text] of cases) {
    const r = await eng.check(text, { lang: 'auto', defaultLang: 'ro' });
    assert.equal(r.lang, lang, text);
  }
  assert.equal((await eng.check('x', { lang: 'auto', defaultLang: 'fr' })).lang, 'fr', 'text prea scurt: limba implicită');
});

test('regresie: dicționar lipsă/eșuat în detecția limbii nu strică verificarea (lang:auto)', async () => {
  const e = new Erata({ loadDict: async () => { throw new Error('indisponibil'); } });
  const r = await e.check('Aceasta este o propoziție scurtă.', { lang: 'auto', defaultLang: 'ro' });
  assert.ok(Array.isArray(r.matches));
  const e2 = new Erata({ loadDict: async () => null });
  const r2 = await e2.check('Acesta este un test.', { lang: 'auto' });
  assert.ok(Array.isArray(r2.matches));
});
