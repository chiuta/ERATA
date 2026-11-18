import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Erata } from '../src/core/engine.js';

const dir = resolve(dirname(fileURLToPath(import.meta.url)), '../dict');
const e = new Erata({
  loadDict: async (n) => (existsSync(`${dir}/${n}.aff`) ? { aff: readFileSync(`${dir}/${n}.aff`, 'utf8'), dic: readFileSync(`${dir}/${n}.dic`, 'utf8') } : null),
});
const ids = async (t, l) => (await e.check(t, { lang: l })).matches.map((m) => m.id);
const rep = async (t, l, id) => (await e.check(t, { lang: l })).matches.find((m) => m.id === id)?.r?.[0];

test('pt: mal/mau, meses, haviam', async () => {
  assert.equal(await rep('Ele estava mau hoje.', 'pt', 'PT_GRAMATICA'), 'estava mal');
  assert.ok((await ids('Nasci em Março.', 'pt')).includes('PT_MESES_DIAS'));
  assert.ok((await ids('Haviam muitas pessoas.', 'pt')).includes('PT_GRAMATICA'));
  assert.deepEqual((await ids('Nasci em março, num dia bom.', 'pt')).filter((x) => x.startsWith('PT_')), []);
});

test('de: sem dicionário não falha; regras funcionam', async () => {
  assert.ok((await ids('Ich weiß, daß er kommt.', 'de')).includes('DE_DASS_ALT'));
  assert.equal(await rep('Er muß gehen.', 'de', 'DE_SS'), 'muss');
  assert.ok((await ids('Ich glaube, das er kommt.', 'de')).includes('DE_GRAMMATIK'));
  assert.ok((await ids('Können sie mir helfen?', 'de')).includes('DE_ANREDE'));
  assert.deepEqual((await ids('Das Buch, das ich lese, ist gut.', 'de')).filter((x) => x.startsWith('DE_')), []);
});

test('it: accenti ed elisioni', async () => {
  assert.equal(await rep('Resto perchè piove.', 'it', 'IT_ACCENTO_CHE'), 'perché');
  assert.equal(await rep('Ho un amica.', 'it', 'IT_ELISIONE'), 'un’amica');
  assert.equal(await rep('Qual\'è il problema?', 'it', 'IT_QUAL_E'), 'Qual è');
  assert.deepEqual((await ids('Resto perché piove; un’amica è qui.', 'it')).filter((x) => x.startsWith('IT_')), []);
});
