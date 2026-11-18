import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Erata } from '../src/core/engine.js';
import { tokenize, splitSentences } from '../src/core/text.js';
import { detectLanguage } from '../src/core/langid.js';
import { Hunspell } from '../src/core/hunspell.js';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../dict');
const e = new Erata({
  loadDict: async (n) => (existsSync(`${dir}/${n}.aff`) ? { aff: readFileSync(`${dir}/${n}.aff`, 'utf8'), dic: readFileSync(`${dir}/${n}.dic`, 'utf8') } : null),
});
const apply = (t, edits) => [...edits].sort((a, b) => b.offset - a.offset).reduce((s, x) => s.slice(0, x.offset) + x.replacement + s.slice(x.offset + x.length), t);
const has = async (t, lang, id) => (await e.check(t, { lang })).matches.some((m) => m.id === id);
const clean = async (t, lang) => (await e.check(t, { lang })).matches.filter((m) => m.c !== 'style').map((m) => `${m.id}:${t.slice(m.o, m.o + m.l)}`);

const CORRECT = {
  ro: 'Ieri am ajuns acasă târziu, pentru că trenul a întârziat aproape o oră. În gară nu era nimeni, iar vântul bătea tare. Unul dintre colegi mi-a zis: „Nu te mai gândi la asta!” Între 5 și 10 persoane au venit în ianuarie. Într-o zi, un prieten mi-a scris că s-a mutat la București. Dintr-un motiv sau altul, el nu s-a plâns. Ce-ți place mai mult: vara sau iarna? Sper să putem afla împreună până mâine.',
  en: 'Yesterday I arrived home late because the train was delayed. There was nobody at the station. If I had to choose, I would rather stay in the city. It\'s an honest answer; an hour later, we\'d finished. They\'re going to their house, and its roof is new. She has a university degree and an MBA. We didn\'t go there, but I saw them leave.',
  fr: 'Hier, je suis rentré tard parce que le train avait du retard. C\'est l\'homme qui a mangé tous les gâteaux ! Elle a dit : « Ne t\'inquiète pas ». Nous sommes arrivés en janvier, et ils ont décidé d\'attendre jusqu\'à mardi. Qu\'est-ce que tu veux ?',
  es: 'Ayer llegué a casa tarde porque el tren se retrasó. ¿Qué quieres hacer hoy? ¡Vamos al parque! El problema es que él ha comido todo. Fuimos al cine el lunes y volveremos en marzo. La mano de Pedro está en el mapa.',
};
for (const [lang, text] of Object.entries(CORRECT)) {
  test(`fără alarme false: ${lang}`, async () => {
    const t = lang === 'fr' ? text.replaceAll(' !', ' !').replaceAll(' :', ' :').replaceAll(' ?', ' ?') : text;
    assert.deepEqual(await clean(t, lang), []);
  });
}

test('tokenizer: url, email, hashtag, număr', () => {
  const k = tokenize('Vezi https://x.ro/a_b și ana@x.ro #tag 3,5 bine-venit').filter((t) => t.type !== 'space' && t.type !== 'punct');
  assert.deepEqual(k.map((t) => t.type), ['word', 'url', 'word', 'email', 'tag', 'num', 'num', 'word']);
});

test('segmentare: abrevieri nu încheie propoziția', () => {
  const s = splitSentences('Dr. Popescu a venit. El a plecat! Apoi ea a rămas?', new Set(['dr']));
  assert.equal(s.length, 3);
});

test('detecție de limbă pe fraze scurte', () => {
  assert.equal(detectLanguage('Nu știu dacă o să vină mâine la ședință').lang, 'ro');
  assert.equal(detectLanguage('I do not know if he will come tomorrow to the meeting').lang, 'en');
  assert.equal(detectLanguage('Je ne sais pas s’il viendra demain à la réunion').lang, 'fr');
  assert.equal(detectLanguage('No sé si vendrá mañana a la reunión').lang, 'es');
});

test('ro: erori tipice detectate', async () => {
  assert.ok(await has('Am venit dar nu era nimeni.', 'ro', 'RO_VIRGULA_DAR'));
  assert.ok(await has('Unul din ei a plecat.', 'ro', 'RO_UNUL_DIN'));
  assert.ok(await has('Ne vedem pe 3 Ianuarie.', 'ro', 'RO_LUNI_ZILE'));
  assert.ok(await has('El a intrat intr-un magazin.', 'ro', 'RO_INTR_UN'));
  assert.ok(await has('Ei sînt aici.', 'ro', 'RO_SINT'));
  assert.ok(await has('Vreau să urc sus pe deal.', 'ro', 'RO_PLEONASM'));
  assert.ok(await has('Locul e vis-a-vis de școală.', 'ro', 'RO_VIZAVI'));
});

test('en: confuzii frecvente', async () => {
  assert.ok(await has('Its a nice day.', 'en', 'EN_COULD_OF'));
  assert.ok(await has('Your welcome to join.', 'en', 'EN_COULD_OF'));
  assert.ok(await has('He have two cats.', 'en', 'EN_AGREEMENT'));
  assert.ok(await has('I should of gone.', 'en', 'EN_COULD_OF'));
  assert.ok(await has('He did went home.', 'en', 'EN_PAST_AFTER_AUX'));
  assert.equal(await has('An hour ago, a university student left.', 'en', 'EN_A_AN'), false);
});

test('es/fr: reguli de bază', async () => {
  assert.ok(await has('Voy de el parque.', 'es', 'ES_GRAMATICA'));
  assert.ok(await has('Creo de que vendrá.', 'es', 'ES_GRAMATICA'));
  assert.ok(await has('Elle a manger la pomme.', 'fr', 'FR_PARTICIPE'));
  assert.ok(await has('Je ai faim.', 'fr', 'FR_ELISION'));
});

test('fixAll: rezultat determinist și idempotent', async () => {
  const t = 'Vreau sa merg la şcoala,dar este târziu .';
  const a = await e.fixAll(t, { lang: 'ro' });
  const out = apply(t, a.edits);
  const b = await e.fixAll(out, { lang: 'ro' });
  assert.ok(out.includes('școala'));
  assert.ok(out.includes('să'));
  assert.deepEqual(b.edits, [], 'a doua trecere nu mai găsește corecții sigure');
});

test('dicționar personal și reguli utilizator', async () => {
  const t = 'Zorgulon este un nume.';
  assert.ok((await e.check(t, { lang: 'ro' })).matches.some((m) => m.id === 'SPELLING'));
  assert.equal((await e.check(t, { lang: 'ro', personal: ['Zorgulon'] })).matches.filter((m) => m.id === 'SPELLING').length, 0);
  const r = await e.check('Foloseste termenul vechi.', { lang: 'ro', userRules: [{ id: 'U1', pattern: '\\bvechi\\b', replacement: 'nou', message: 'm', lang: 'ro' }] });
  const m = r.matches.find((x) => x.id === 'U1');
  assert.equal(m.r[0], 'nou');
});

test('Hunspell: afixe pe două niveluri și majuscule', () => {
  const aff = 'SET UTF-8\nSFX A Y 1\nSFX A 0 s .\nSFX B Y 1\nSFX B 0 ed/A .\nPFX U Y 1\nPFX U 0 un .\n';
  const dic = '3\nwalk/BU\nParis\nOK/\n';
  const h = new Hunspell(aff, dic);
  assert.ok(h.spell('walk') && h.spell('walked') && h.spell('walkeds') && h.spell('unwalk') && h.spell('Walk'));
  assert.ok(h.spell('Paris') && !h.spell('paris') && h.spell('PARIS'));
  assert.ok(!h.spell('walkd'));
});

test('performanță: 20 000 de caractere sub 3 s', async () => {
  const para = 'Aceasta este o propoziție simplă, scrisă corect. Mâine mergem la școală, dar nu vom întârzia deloc.\n';
  const t0 = Date.now();
  await e.check(para.repeat(200), { lang: 'ro' });
  assert.ok(Date.now() - t0 < 3000);
});
