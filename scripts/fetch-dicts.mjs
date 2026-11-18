// Copiază dicționarele Hunspell (pachete npm independente de LanguageTool) în dict/.
// Nu descarcă nimic din alte surse și nu atinge date LanguageTool.
import { copyFileSync, mkdirSync, existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = resolve(root, 'dict');
mkdirSync(OUT, { recursive: true });

// cod intern -> pachet npm. Licențele sunt copiate alături (dict/LICENSES.md).
const PACKS = {
  ro: 'dictionary-ro',
  en: 'dictionary-en',
  'en-GB': 'dictionary-en-gb',
  fr: 'dictionary-fr',
  es: 'dictionary-es',
  pt: 'dictionary-pt',
};

const rows = [];
for (const [code, pkg] of Object.entries(PACKS)) {
  const dir = resolve(root, 'node_modules', pkg);
  if (!existsSync(dir)) throw new Error(`Lipsește ${pkg}; rulează npm install.`);
  copyFileSync(resolve(dir, 'index.aff'), resolve(OUT, `${code}.aff`));
  copyFileSync(resolve(dir, 'index.dic'), resolve(OUT, `${code}.dic`));
  const meta = JSON.parse(readFileSync(resolve(dir, 'package.json'), 'utf8'));
  rows.push(`| ${code} | ${pkg}@${meta.version} | ${meta.license} |`);
}
writeFileSync(
  resolve(OUT, 'LICENSES.md'),
  `# Dicționare incluse\n\nDicționarele sunt proiecte Hunspell independente, distribuite sub propriile licențe.\nERATA le citește cu un parser propriu (src/core/hunspell.js).\n\n| Cod | Pachet | Licență |\n|---|---|---|\n${rows.join('\n')}\n\nGermana (GPL-only) și italiana (GPL-3.0) nu sunt incluse; se pot importa din Opțiuni.\n`
);
console.log('Dicționare copiate:', Object.keys(PACKS).join(', '));
