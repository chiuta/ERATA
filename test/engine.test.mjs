import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Erata } from '../src/core/engine.js';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../dict');
const engine = new Erata({
  loadDict: async (n) => (existsSync(`${dir}/${n}.aff`) ? { aff: readFileSync(`${dir}/${n}.aff`, 'utf8'), dic: readFileSync(`${dir}/${n}.dic`, 'utf8') } : null),
});
const ids = (r) => r.matches.map((m) => m.id);
const txt = (t, m) => t.slice(m.o, m.o + m.l);

test('română: ortografie și diacritice', async () => {
  const t = 'Copiii merg la scoala și învață.';
  const r = await engine.check(t, { lang: 'ro' });
  const m = r.matches.find((x) => x.id === 'SPELLING');
  assert.equal(txt(t, m), 'scoala');
  const s = await engine.suggest('scoala', { lang: 'ro' });
  assert.equal(s.suggestions[0].text, 'școala');
});

test('română: cedilă, să, între, virgulă', async () => {
  const t = 'Vreau sa merg. Între 5-10 oameni, dar şcoala e închisă.';
  const r = await engine.check(t, { lang: 'ro' });
  const got = ids(r);
  for (const id of ['RO_SA', 'RO_INTERVAL', 'RO_CEDILA']) assert.ok(got.includes(id), `lipsește ${id}: ${got}`);
  const ced = r.matches.find((x) => x.id === 'RO_CEDILA');
  assert.equal(ced.r[0], 'școala');
});

test('română: text corect nu are alarme false', async () => {
  const t = 'Aceasta este o propoziție simplă, scrisă corect. Mâine mergem la școală, dar nu vom întârzia.';
  const r = await engine.check(t, { lang: 'ro' });
  assert.deepEqual(r.matches.filter((m) => m.c !== 'style').map((m) => [m.id, txt(t, m)]), []);
});

test('detecție automată a limbii pe paragrafe', async () => {
  const t = 'Aceasta este o propoziție în limba română.\nThis is a sentence written in English, and it has a typo: teh.';
  const r = await engine.check(t, { lang: 'auto' });
  const sp = r.matches.filter((m) => m.id === 'SPELLING').map((m) => txt(t, m));
  assert.deepEqual(sp, ['teh']);
});

test('engleză: a/an, i, alot', async () => {
  const t = 'i saw an cat and a apple, alot of them.';
  const r = await engine.check(t, { lang: 'en' });
  const got = ids(r);
  assert.ok(got.includes('EN_I'));
  assert.ok(got.includes('EN_A_AN'));
  assert.ok(got.includes('EN_COULD_OF'));
});

test('franceză: elidare și accord', async () => {
  const t = "Je ai vu que il à mangé. C'est l'homme.";
  const r = await engine.check(t, { lang: 'fr' });
  assert.ok(ids(r).includes('FR_ELISION'));
  assert.ok(ids(r).includes('FR_ACCORD'));
  assert.equal(r.matches.filter((m) => m.id === 'SPELLING').length, 0);
});

test('spaniolă: semne inversate', async () => {
  const t = 'Cómo estás? Muy bien.';
  const r = await engine.check(t, { lang: 'es' });
  const m = r.matches.find((x) => x.id === 'ES_SIGNOS_INVERTIDOS');
  assert.ok(m);
  assert.equal(m.r[0], '¿C');
});

test('reguli comune: spațiere și repetiții', async () => {
  const t = 'The the cat  sat , on the mat.Then left';
  const r = await engine.check(t, { lang: 'en' });
  const got = ids(r);
  for (const id of ['REPEATED_WORD', 'DOUBLE_SPACE', 'SPACE_BEFORE_PUNCT', 'SPACE_AFTER_PUNCT']) assert.ok(got.includes(id), id);
});

test('restaurare diacritice', async () => {
  const t = 'Mama si copiii merg in padure sa culeaga fructe.';
  const r = await engine.restoreDiacritics(t, { lang: 'ro' });
  let out = t;
  for (const e of [...r.edits].reverse()) out = out.slice(0, e.offset) + e.replacement + out.slice(e.offset + e.length);
  assert.ok(out.includes('și'));
  assert.ok(out.includes('în'));
  assert.ok(out.includes('pădure'));
  assert.ok(out.includes('să'));
});

test('fixAll aplică doar corecții sigure', async () => {
  const t = 'i have a apple.';
  const { edits } = await engine.fixAll(t, { lang: 'en' });
  let out = t;
  for (const e of [...edits].reverse()) out = out.slice(0, e.offset) + e.replacement + out.slice(e.offset + e.length);
  assert.equal(out, 'I have an apple.');
});
