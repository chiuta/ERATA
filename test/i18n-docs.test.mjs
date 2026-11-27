// Paritate pentru README-uri și pagina de prezentare, pentru toate limbile din scripts/languages.json.
// LANGS=uk,tr node --test test/i18n-docs.test.mjs  → doar limbile indicate.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import vm from 'node:vm';

const root = new URL('../', import.meta.url);
const all = JSON.parse(readFileSync(new URL('scripts/languages.json', root), 'utf8'));
const only = process.env.LANGS ? process.env.LANGS.split(',') : null;
const langs = all.filter(l => !only || only.includes(l.code));
const read = p => readFileSync(new URL(p, root), 'utf8');

const bar = cur => all.map(l => {
  const f = l.code === 'en' ? 'README.md' : `README.${l.code}.md`;
  return l.code === cur ? `**${l.name}**` : `[${l.name}](${f})`;
}).join(' · ');

function shape(v) {
  if (Array.isArray(v)) return v.map(shape);
  if (v && typeof v === 'object') return Object.fromEntries(Object.keys(v).sort().map(k => [k, shape(v[k])]));
  return typeof v;
}
function loadT(code) {
  const ctx = { T: {} };
  vm.runInNewContext(read(`docs/i18n/${code}.js`), ctx);
  return ctx.T[code];
}
const urls = md => [...md.matchAll(/\]\((https?:[^)\s]+|[^)\s#]*(?:CLEANROOM|PRIVACY|LICENSE|COMPARISON|SAFARI|LICENSES)[^)\s]*)\)/g)].map(m => m[1]).sort();
const strip = md => md.replace(/<\/?div[^>]*>/g, '');

for (const l of langs) {
  const rf = l.code === 'en' ? 'README.md' : `README.${l.code}.md`;
  test(`README ${l.code}: structură identică cu engleza`, () => {
    assert.ok(existsSync(new URL(rf, root)), `lipsește ${rf}`);
    const en = read('README.md'), md = strip(read(rf));
    assert.equal(md.split('\n')[0], bar(l.code), 'bara de limbi');
    const heads = s => s.split('\n').filter(x => /^#{1,3} /.test(x)).map(x => x.match(/^#+/)[0]);
    assert.deepEqual(heads(md), heads(en), 'titluri');
    assert.equal((md.match(/^```/gm) || []).length, (en.match(/^```/gm) || []).length, 'blocuri de cod');
    const cmds = t => (t.match(/```bash\n[\s\S]*?```/g) || []).map(b => b.split('\n').map(x => x.replace(/\s+#.*$/, '')).filter(x => x.trim() && !x.startsWith('#')).join('\n'));
    assert.deepEqual(cmds(md), cmds(en), 'comenzile rămân neschimbate (comentariile pot fi traduse)');
    const rows = s => s.split('\n').filter(x => x.startsWith('|')).length;
    assert.equal(rows(md), rows(en), 'rânduri de tabel');
    assert.deepEqual(urls(md).filter(u => /^https?:/.test(u)), urls(en).filter(u => /^https?:/.test(u)), 'URL-uri');
    assert.match(md, /0\.4\.0/, 'versiunea');
    assert.match(md, /2026/, 'data');
    assert.doesNotMatch(md, /patreon|CNRED/i);
    assert.match(md, /buymeacoffee\.com\/echo\.of\.the\.strings/);
  });
  test(`site ${l.code}: aceleași chei ca engleza`, () => {
    assert.ok(existsSync(new URL(`docs/i18n/${l.code}.js`, root)), `lipsește docs/i18n/${l.code}.js`);
    const en = loadT('en'), t = loadT(l.code);
    assert.ok(t, 'T.' + l.code);
    assert.equal(JSON.stringify(shape(t)), JSON.stringify(shape(en)));
    const flat = (v, o = []) => (typeof v === 'string' ? o.push(v) : Object.values(v).forEach(x => flat(x, o)), o);
    for (const s of flat(t)) assert.ok(s.trim().length, 'șir gol');
    assert.match(JSON.stringify(t), /0\.4\.0/);
    assert.doesNotMatch(JSON.stringify(t), /patreon|CNRED/i);
  });
}
