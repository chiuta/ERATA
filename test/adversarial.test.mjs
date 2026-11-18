import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Erata } from '../src/core/engine.js';
import { tokenize } from '../src/core/text.js';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../dict');
const engine = new Erata({
  loadDict: async (n) => (existsSync(`${dir}/${n}.aff`) ? { aff: readFileSync(`${dir}/${n}.aff`, 'utf8'), dic: readFileSync(`${dir}/${n}.dic`, 'utf8') } : null),
});

const timed = async (fn) => {
  const t = performance.now();
  const r = await fn();
  return [performance.now() - t, r];
};

const PATHOLOGICAL = {
  letters: 'a'.repeat(100000),
  dots: 'ab.'.repeat(30000),
  underscores: 'a_'.repeat(50000),
  spaces: 'a' + ' '.repeat(100000) + 'b',
  quotes: '"'.repeat(50000),
  commaDar: 'a dar '.repeat(15000),
  emailLike: 'x.'.repeat(40000),
};

for (const [name, text] of Object.entries(PATHOLOGICAL)) {
  test(`performanță: input patologic «${name}» (<3 s)`, async () => {
    for (const lang of ['ro', 'en', 'fr']) {
      const [ms] = await timed(() => engine.check(text, { lang }));
      assert.ok(ms < 3000, `${lang} ${name}: ${ms.toFixed(0)} ms`);
    }
  });
}

test('tokenizer liniar pe rulări lungi', () => {
  const [ms, toks] = [0, null];
  const t = performance.now();
  const r = tokenize('a_'.repeat(50000));
  assert.ok(performance.now() - t < 1000);
  assert.ok(r.length > 0);
  void ms; void toks;
});

test('e-mailul este încă recunoscut și protejat', async () => {
  const toks = tokenize('scrie la ion.popescu@example.ro azi');
  assert.ok(toks.some((t) => t.type === 'email' && t.text === 'ion.popescu@example.ro'));
});

test('număr de potriviri plafonat', async () => {
  const r = await engine.check('a  b '.repeat(20000), { lang: 'en' });
  assert.ok(r.matches.length <= 5000);
});

test('regulile funcționează în continuare (virgulă înainte de „dar”, majusculă)', async () => {
  const r = await engine.check('Am venit dar nu am rămas. este târziu.', { lang: 'ro' });
  const ids = r.matches.map((m) => m.id);
  assert.ok(ids.includes('RO_VIRGULA_DAR'));
  assert.ok(ids.includes('SENTENCE_CAPITAL'));
});

test('Unicode: NFD, emoji, RTL, zero-width, CRLF nu aruncă și offseturile sunt valide', async () => {
  const samples = [
    'Școala'.normalize('NFD') + ' merge.',
    'Salut 😀 lume  dublu',
    'مرحبا بالعالم and  english',
    'zero​width  space',
    'linia unu\r\nlinia  doi\r\n',
    '\ud83d',
  ];
  for (const t of samples) {
    const r = await engine.check(t, { lang: 'auto' });
    for (const m of r.matches) {
      assert.ok(m.o >= 0 && m.o + m.l <= t.length, `offset invalid în «${t}»`);
    }
  }
});

test('fixAll este idempotent', async () => {
  const t = 'Vreau sa merg  la scoala , dar nu pot.';
  const a = await engine.fixAll(t, { lang: 'ro' });
  let out = t;
  for (const e of a.edits.slice().sort((x, y) => y.offset - x.offset)) out = out.slice(0, e.offset) + e.replacement + out.slice(e.offset + e.length);
  const b = await engine.fixAll(out, { lang: 'ro' });
  assert.equal(b.edits.length, 0, JSON.stringify(b.edits));
});

test('cache: modificarea dicționarului personal (nu doar a ultimelor cuvinte) invalidează', async () => {
  const base = ['a1', 'b2', 'c3', 'd4', 'e5', 'f6', 'g7'];
  const t = 'Merge bine zorpglub aici.';
  const r1 = await engine.check(t, { lang: 'ro', personal: base });
  assert.ok(r1.matches.some((m) => m.id === 'SPELLING'));
  const r2 = await engine.check(t, { lang: 'ro', personal: ['zorpglub', ...base.slice(1)] });
  assert.ok(!r2.matches.some((m) => m.id === 'SPELLING'));
});
