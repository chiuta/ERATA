import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { UI_LANGS, UI_RTL, t, guessUiLang, uiDir } from '../extension/ui-strings.js';

const root = new URL('../', import.meta.url);
const ALL = JSON.parse(readFileSync(new URL('scripts/languages.json', root), 'utf8'));
// Localizări acceptate de Chrome Web Store pentru _locales (celelalte limbi au doar interfața din aplicație).
const STORE = ['en', 'ro', 'fr', 'it', 'es', 'pt', 'de', 'hu', 'uk', 'tr', 'ru', 'sr', 'sk', 'bg', 'hr', 'el', 'cs', 'pl'];
const load = async c => (await import(`../extension/i18n/${c}.js`)).default;
const ph = s => (s.match(/\{\w+\}/g) || []).sort().join();

test('interfața are toate cele 25 de limbi', () => {
  assert.equal(ALL.length, 25);
  assert.deepEqual(Object.keys(UI_LANGS), ALL.map(l => l.code));
  assert.deepEqual(UI_RTL, ['yi']);
});

for (const l of ALL) {
  test(`UI ${l.code}: paritatea cheilor, valori nevide, substituenți`, async () => {
    const en = await load('en'), s = await load(l.code);
    assert.deepEqual(Object.keys(s).sort(), Object.keys(en).sort());
    for (const [k, v] of Object.entries(s)) {
      assert.equal(typeof v, 'string'); assert.ok(v.trim(), `${l.code}.${k} gol`);
      assert.equal(ph(v), ph(en[k]), `${l.code}.${k} substituenți`);
      assert.ok(v.length <= Math.max(60, en[k].length * 3), `${l.code}.${k} prea lung`);
      assert.doesNotMatch(v, /<[a-z]/i, 'fără HTML');
    }
    assert.equal(s.app, 'ERATA');
  });
}

for (const c of STORE) {
  test(`_locales ${c}: nume ≤ 75, descriere ≤ 132, aceleași chei`, () => {
    const p = new URL(`extension/_locales/${c}/messages.json`, root);
    assert.ok(existsSync(p), 'lipsește');
    const m = JSON.parse(readFileSync(p, 'utf8')), en = JSON.parse(readFileSync(new URL('extension/_locales/en/messages.json', root), 'utf8'));
    assert.deepEqual(Object.keys(m).sort(), Object.keys(en).sort());
    assert.ok([...m.extName.message].length <= 75); assert.ok([...m.extDesc.message].length <= 132);
    for (const v of Object.values(m)) assert.ok(v.message.trim());
  });
}

test('t(), guessUiLang, uiDir', () => {
  assert.equal(t('ro', 'issues', { n: 3 }), '3 probleme');
  assert.equal(t('xx', 'fix_all'), 'Fix all');
  assert.equal(t('en', 'cheie_inexistenta'), 'cheie_inexistenta');
  assert.equal(guessUiLang('hu-HU'), 'hu');
  assert.equal(guessUiLang('rom'), 'rmy');
  assert.equal(guessUiLang('ydd'), 'yi');
  assert.equal(guessUiLang('sr_RS'), 'sr');
  assert.equal(guessUiLang('ja'), 'en');
  assert.equal(uiDir('yi'), 'rtl'); assert.equal(uiDir('ro'), 'ltr');
});
