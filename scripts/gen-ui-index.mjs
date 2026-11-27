// Generează extension/ui-strings.js din extension/i18n/<cod>.js și scripts/languages.json.
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
const root = new URL('../', import.meta.url);
const langs = JSON.parse(readFileSync(new URL('scripts/languages.json', root), 'utf8'))
  .filter(l => existsSync(new URL(`extension/i18n/${l.code}.js`, root)));
const out = `// GENERAT de scripts/gen-ui-index.mjs — nu edita manual. Textele sunt în extension/i18n/<cod>.js.
${langs.map(l => `import ${l.code} from './i18n/${l.code}.js';`).join('\n')}

const S = { ${langs.map(l => l.code).join(', ')} };

export const UI_LANGS = ${JSON.stringify(Object.fromEntries(langs.map(l => [l.code, l.name])))};
export const UI_RTL = ${JSON.stringify(langs.filter(l => l.dir === 'rtl').map(l => l.code))};
// Limbi noi, traduse automat și nerevizuite de vorbitori nativi.
export const UI_MACHINE = ${JSON.stringify(langs.filter(l => !l.core).map(l => l.code))};
const ALIAS = { rom: 'rmy', ydd: 'yi', ji: 'yi', iw: 'he', sh: 'sr' };

export function uiDir(lang) { return UI_RTL.includes(lang) ? 'rtl' : 'ltr'; }

export function t(lang, key, vars = {}) {
  const s = (S[lang] && S[lang][key]) || S.en[key] || key;
  return s.replace(/\\{(\\w+)\\}/g, (_, k) => (vars[k] ?? ''));
}

export function guessUiLang(nav = (globalThis.navigator && navigator.language) || 'en') {
  let l = String(nav).toLowerCase().split(/[-_]/)[0];
  l = ALIAS[l] || l;
  return S[l] ? l : 'en';
}
`;
writeFileSync(new URL('extension/ui-strings.js', root), out);
console.log('ui-strings.js:', langs.length, 'limbi');
