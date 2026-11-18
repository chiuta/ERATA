import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { UI_LANGS, t, guessUiLang } from '../extension/ui-strings.js';

const LANGS = ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu'];

test('interfața are 8 limbi', () => {
  assert.deepEqual(Object.keys(UI_LANGS).sort(), [...LANGS].sort());
});

test('paritatea cheilor și valori nevide', () => {
  const src = readFileSync(new URL('../extension/ui-strings.js', import.meta.url), 'utf8');
  const keys = (l) => {
    const m = src.match(new RegExp(`\\n  ${l}: \\{([\\s\\S]*?)\\n  \\},`));
    assert.ok(m, l);
    return [...m[1].matchAll(/(?:^|[\s,])'?([a-z_-]+)'?: '((?:[^'\\]|\\.)*)'/g)].map((x) => [x[1], x[2]]);
  };
  const base = keys('en');
  assert.ok(base.length > 60);
  for (const l of LANGS) {
    const k = keys(l);
    assert.deepEqual(k.map((x) => x[0]).sort(), base.map((x) => x[0]).sort(), `chei diferite în ${l}`);
    for (const [key, v] of k) assert.ok(v.trim(), `${l}.${key} gol`);
    const ph = (arr, key) => (arr.find((x) => x[0] === key)?.[1].match(/\{\w+\}/g) || []).join();
    for (const key of ['issues', 'applied']) assert.equal(ph(k, key), ph(base, key), `${l}.${key}`);
  }
});

test('t() și guessUiLang', () => {
  assert.equal(t('hu', 'issues', { n: 3 }), '3 probléma');
  assert.equal(t('xx', 'save'), 'Save');
  assert.equal(guessUiLang('de-AT'), 'de');
  assert.equal(guessUiLang('ja'), 'en');
});
