#!/usr/bin/env node
// Evaluare ERATA: precision/recall/F1 pe seturi etichetate, alarme false pe corpusuri corecte, detecția limbii.
//
//   npm run eval                      tot (ro,en,fr,es,pt)
//   npm run eval -- --lang ro,fr      doar anumite limbi
//   npm run eval -- --verbose         listează și erorile (FN/FP/FIX/SUGGEST)
//   npm run eval -- --strict          cod de ieșire 1 dacă țintele nu sunt atinse
//
// ATENȚIE: toate seturile (etichetate, corpusuri, fragmente de limbă) sunt scrise de autorul motorului.
// NU sunt un etalon independent: cifrele sunt optimiste, iar regulile au fost reglate pe setul de dezvoltare.
// Setul „heldout/” a fost scris după reglarea detecției de limbă și raportat separat.
import { createEngine, evalCases, evalCorpus, CASE_LANGS, CORPUS_LANGS } from '../test/eval/evaluate.mjs';
import { loadCorpus, HELDOUT_DIR } from '../test/eval/lib.mjs';
import { evalLangid, BUCKETS } from '../test/eval/langid.mjs';
import { LANGUAGES } from '../src/core/engine.js';
import { commonRules } from '../src/core/rules/common.js';
import { styleRules } from '../src/core/style.js';
import { loadCases } from '../test/eval/cases/index.mjs';

const args = process.argv.slice(2);
const flag = (n) => args.includes(`--${n}`);
const opt = (n) => {
  const i = args.indexOf(`--${n}`);
  return i >= 0 ? args[i + 1] : null;
};
const langs = (opt('lang') ? opt('lang').split(',') : CASE_LANGS).filter((l) => CASE_LANGS.includes(l));
const verbose = flag('verbose');
const strict = flag('strict');

const fx = (x, d = 2) => (x === null || x === undefined ? '  -  ' : x.toFixed(d));
const pct = (a, n) => (n ? `${((100 * a) / n).toFixed(1)}%` : '-').padStart(6);
const pad = (s, n) => String(s).padEnd(n);

const TARGET = { f1: 0.9, fa: 1.0, langid: 0.9 };
const problems = [];

console.log('='.repeat(100));
console.log('ERATA — evaluare. ATENȚIE: seturile sunt SCRISE DE AUTORUL MOTORULUI, NU sunt un etalon independent.');
console.log('Cifrele sunt optimiste (reguli reglate pe setul de dezvoltare); nu le comparați cu rezultate ale altor corectoare.');
console.log('='.repeat(100));

const engine = createEngine();

// ---------------------------------------------------------------- 1. seturi etichetate
console.log('\n[1] SET ETICHETAT (greșit cu poziție + corecție așteptată; corect). TP = potrivire a regulii peste poziția etichetată;');
console.log('    FP = orice potrivire a regulii pe o propoziție corectă sau potrivire în plus pe una greșită; fix = aplicarea tuturor potrivirilor dă textul corectat.');
const summary = [];
for (const lang of langs) {
  const r = await evalCases(engine, lang);
  const t = r.total;
  summary.push({ lang, ...t });
  console.log(`\n--- ${lang}: precision ${fx(t.p)}  recall ${fx(t.r)}  F1 ${fx(t.f1)}   (TP ${t.tp}, FP ${t.fp}, FN ${t.fn}; ${t.bad} greșite / ${t.good} corecte)  corecții exacte ${t.fixOk}/${t.fixTried}  sugestii top-1 ${t.sugTop1}/${t.sugN}, top-5 ${t.sugTop5}/${t.sugN}`);
  console.log(`    ${pad('regulă', 28)} ${pad('P', 5)} ${pad('R', 5)} ${pad('F1', 5)} ${pad('TP', 3)} ${pad('FP', 3)} ${pad('FN', 3)} ${pad('greșite', 8)} ${pad('corecte', 8)} fix`);
  for (const [id, s] of Object.entries(r.rules)) {
    const note = s.na ? `  (n/a: ${s.na})` : '';
    console.log(`    ${pad(id, 28)} ${pad(fx(s.p), 5)} ${pad(fx(s.r), 5)} ${pad(fx(s.f1), 5)} ${pad(s.tp, 3)} ${pad(s.fp, 3)} ${pad(s.fn, 3)} ${pad(s.bad, 8)} ${pad(s.good, 8)} ${s.fixTried ? `${s.fixOk}/${s.fixTried}` : '-'}${note}`);
  }
  if (verbose || t.fp || t.fn) for (const x of r.failures) console.log('    !', x.kind, x.rule, JSON.stringify(x.text), x.at ? `@${x.at}` : '', x.expected ? `așteptat=${JSON.stringify(x.expected)}` : '', x.got ? `obținut=${JSON.stringify(x.got)}` : '');
  if (verbose) for (const x of r.collateral) console.log('    ~ colateral', x.rule, JSON.stringify(x.text), x.got.join(' '));
  if (t.f1 < TARGET.f1) problems.push(`F1 ${lang} = ${fx(t.f1)} < ${TARGET.f1}`);

  // acoperire: fiecare regulă are ≥3 greșite și ≥3 corecte?
  const spec = await loadCases(lang);
  const ids = [...commonRules, ...LANGUAGES[lang].rules, ...styleRules].map((x) => x.id);
  const thin = [];
  for (const id of ids) {
    const c = spec.rules[id];
    if (!c) thin.push(`${id}: FĂRĂ seturi`);
    else if (!c.na && ((c.bad?.length || 0) < 3 || (c.good?.length || 0) < 3)) thin.push(`${id}: ${c.bad?.length || 0} greșite/${c.good?.length || 0} corecte`);
  }
  if (thin.length) {
    console.log(`    Acoperire incompletă (<3 greșite sau <3 corecte): ${thin.join('; ')}`);
    problems.push(`acoperire ${lang}: ${thin.length} reguli`);
  }
}
console.log('\n    Rezumat F1: ' + summary.map((s) => `${s.lang} ${fx(s.f1)}`).join('   '));

// ---------------------------------------------------------------- 2. alarme false pe corpusuri corecte
console.log('\n[2] ALARME FALSE pe text CORECT scris de autor (fără avizele de stil; la 1000 de cuvinte). Ținta: ≤ 1.');
for (const [title, dir] of [['dezvoltare (corpus/ — pe acesta s-au reglat euristicile)', undefined], ['held-out (heldout/ — scris după reglare; vezi nota)', HELDOUT_DIR]]) {
  console.log(`\n  ${title}`);
  let W = 0, A = 0;
  for (const lang of langs.filter((l) => CORPUS_LANGS.includes(l))) {
    const r = await evalCorpus(engine, lang, { corpus: loadCorpus(lang, dir) });
    W += r.words;
    A += r.alarms;
    const cats = Object.entries(r.cats).map(([c, v]) => `${c} ${v.alarms}/${v.words}w`).join('  ');
    console.log(`    ${pad(lang, 3)} ${String(r.words).padStart(5)} cuvinte  ${String(r.alarms).padStart(3)} alarme = ${fx(r.per1000)}/1000   [${cats}]`);
    for (const a of r.list) console.log(`        ! ${a.id} «${a.text}»  …${a.ctx}…`);
    if (r.per1000 > TARGET.fa) problems.push(`alarme false ${lang}${dir ? ' (held-out)' : ''} = ${fx(r.per1000)}/1000`);
  }
  console.log(`    total ${W} cuvinte, ${A} alarme = ${fx((A * 1000) / W)}/1000`);
}
console.log('\n  Notă: pe setul held-out, prima măsurătoare (înainte de reparații) a dat 6 alarme/2948 cuvinte (rsync ×4, „Mr. Kowalski”, „GHz”) în secțiunea „hard”; după reparare acele cazuri au devenit set de dezvoltare.');

// ---------------------------------------------------------------- 3. detecția limbii
console.log('\n[3] DETECȚIA LIMBII (decizia paragrafului: cuvinte funcționale + acoperire în dicționare). „abținere” = motorul folosește limba documentului/implicită.');
for (const [title, held] of [['dezvoltare', false], ['held-out', true]]) {
  const eng = createEngine();
  for (const l of CORPUS_LANGS) await eng.speller(l); // toate dicționarele încărcate (rezultatul depinde de dicționarele disponibile)
  const r = await evalLangid(eng, { heldOut: held });
  console.log(`\n  ${title}: ferestre de 3–50 de cuvinte din text scris de autor`);
  console.log(`    ${pad('cuvinte', 8)} ${pad('n', 5)} ${pad('corect', 8)} ${pad('greșit', 8)} ${pad('abținere', 8)}`);
  for (const b of BUCKETS) {
    const t = r.byBucket[b.name];
    console.log(`    ${pad(b.name, 8)} ${pad(t.n, 5)} ${pad(pct(t.ok, t.n), 8)} ${pad(pct(t.wrong, t.n), 8)} ${pad(pct(t.abstain, t.n), 8)} ${Object.keys(t.confusions).length ? JSON.stringify(t.confusions) : ''}`);
  }
  console.log('    pe limbă: ' + r.langs.map((l) => `${l} ${pct(r.byLang[l].ok, r.byLang[l].n).trim()}`).join('  '));
  console.log(`    TOTAL ${r.total.n}: corect ${pct(r.total.ok, r.total.n).trim()}, greșit ${pct(r.total.wrong, r.total.n).trim()}, abținere ${pct(r.total.abstain, r.total.n).trim()}`);
  if (!held) {
    console.log(`    amestecuri (paragraf + citat străin, ${r.mixtures.n}; doar set de dezvoltare): corect ${pct(r.mixtures.ok, r.mixtures.n).trim()}${r.mixtures.wrong ? ' ' + JSON.stringify(r.mixtures.confusions) : ''}`);
    console.log(`    nume proprii (${r.names.n}; doar set de dezvoltare): corect ${pct(r.names.ok, r.names.n).trim()}, greșit ${r.names.wrong}, abținere ${r.names.abstain} (abținerea e comportamentul dorit pentru liste de nume)`);
  }
  if (r.total.ok / r.total.n < TARGET.langid) problems.push(`detecția limbii (${title}) = ${pct(r.total.ok, r.total.n).trim()}`);
}

console.log('\nCe NU măsoară această evaluare: texte reale ale utilizatorilor, alte limbi decât ro/en/fr/es/pt (de/it/nl doar la detecție),');
console.log('erori produse de oameni (seturile sunt construite de autor), registre neacoperite (SMS, poezie, cod amestecat cu text).');
if (problems.length) {
  console.log(`\nȚinte neatinse (${problems.length}): ${problems.join('; ')}`);
  if (strict) process.exit(1);
}
