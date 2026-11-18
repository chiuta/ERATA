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
const rep = async (t, id) => (await e.check(t, { lang: 'ro' })).matches.find((m) => m.id === id)?.r?.[0];
const none = async (t, id) => assert.equal(await rep(t, id), undefined, `alarmă falsă ${id}: ${t}`);

const CASES = [
  ['RO_CLITIC_LIPSA', 'El mia spus adevărul.', 'mi-a spus', 'El mi-a spus adevărul.'],
  ['RO_CLITIC_LIPSA', 'Copilul sa dus acasă.', null, 'Copilul s-a dus acasă.'],
  ['RO_IAR_I_AR', 'Cred că iar plăcea să vină.', null, 'Cred că i-ar plăcea să vină.'],
  ['RO_IA_EA', 'Ia este acasă.', 'Ea este', 'Ea este acasă.'],
  ['RO_A_AI_AM', 'Cred că tu a făcut asta.', 'tu ai făcut', 'Cred că tu ai făcut asta.'],
  ['RO_ORTO_COMPUSE', 'Deaceea am plecat.', 'De aceea', 'De aceea am plecat.'],
  ['RO_NICIUN', 'Nu am nici un prieten aici.', 'niciun', 'Nu am niciun prieten aici.'],
  ['RO_VIRGULA_CI', 'Nu am vrut asta ci altceva.', 'nu am vrut asta, ci'.replace('n', 'N'), 'Nu am vrut asta, ci altceva.'],
  ['RO_VOCATIV_SALUT', 'Bună ziua Ion!', 'Bună ziua, Ion', 'Bună ziua, Ion!'],
];
for (const [id, bad, , good] of CASES) {
  test(`${id}: pozitiv + negativ`, async () => {
    assert.ok(await rep(bad, id), `lipsește ${id} în: ${bad}`);
    await none(good, id);
  });
}

test('negative suplimentare (fraze corecte)', async () => {
  await none('Ei au zis că nici un copil, nici doi nu vor veni.', 'RO_NICIUN');
  await none('Nu doar el, ci și ea a venit.', 'RO_IA_EA');
  await none('Ea ia cartea și el a luat banii.', 'RO_A_AI_AM');
  await none('Mi-a spus că i-ar plăcea. S-a dus acasă. De aceea a plecat.', 'RO_CLITIC_LIPSA');
  await none('Salut, Ion! Mulțumesc.', 'RO_VOCATIV_SALUT');
});
