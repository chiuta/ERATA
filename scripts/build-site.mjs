// Asamblează docs/index.html (un singur fișier) din docs/index.src.html + docs/i18n/<cod>.js
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const langs = JSON.parse(readFileSync(new URL('scripts/languages.json', root), 'utf8'));
let tpl = readFileSync(new URL('docs/index.src.html', root), 'utf8');
const have = langs.filter(l => existsSync(new URL(`docs/i18n/${l.code}.js`, root)));
const missing = langs.filter(l => !have.includes(l)).map(l => l.code);
if (missing.length) console.warn('lipsesc traduceri site:', missing.join(','));
const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;');
const options = have.map(l => `     <option value="${l.code}" lang="${l.code}">${esc(l.name)}</option>`).join('\n');
const sup = `var SUP=${JSON.stringify(have.map(l => l.code))};\nvar NAMES=${JSON.stringify(Object.fromEntries(have.map(l => [l.code, l.name])))};\nvar RTL=${JSON.stringify(have.filter(l => l.dir === 'rtl').map(l => l.code))};\nvar T={};`;
const blocks = have.map(l => readFileSync(new URL(`docs/i18n/${l.code}.js`, root), 'utf8').trimEnd()).join('\n\n');
// old template had "var T={};" before blocks; keep it only once
tpl = tpl.replace('/*@LANGS@*/', sup).replace('<!--@OPTIONS@-->', options).replace('/*@I18N@*/', blocks);
tpl = tpl.replace(/var T=\{\};\s*var T=\{\};/, 'var T={};');
writeFileSync(new URL('docs/index.html', root), tpl);
console.log('docs/index.html:', have.length, 'limbi,', tpl.length, 'octeți');
