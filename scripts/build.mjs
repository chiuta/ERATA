// Construiește extensia pentru Chrome/Edge/Opera (service worker) și Firefox (event page).
// Folosește esbuild pentru a împacheta scripturile; copiază dicționarele și resursele statice.
import { build } from 'esbuild';
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ext = resolve(root, 'extension');
const zip = process.argv.includes('--zip');
const base = JSON.parse(readFileSync(resolve(ext, 'manifest.base.json'), 'utf8'));

if (!existsSync(resolve(root, 'dict/ro.dic'))) execFileSync(process.execPath, [resolve(root, 'scripts/fetch-dicts.mjs')], { stdio: 'inherit' });
if (!existsSync(resolve(ext, 'icons/128.png'))) execFileSync('python3', [resolve(root, 'scripts/make-icons.py')], { stdio: 'inherit' });

const ENTRIES = ['background', 'content', 'popup', 'options', 'studio'];
const STATIC = ['popup.html', 'options.html', 'studio.html', 'ui.css'];

const targets = {
  chrome: (m) => {
    m.background = { service_worker: 'background.js' };
    m.optional_host_permissions = ['http://127.0.0.1/*', 'http://localhost/*'];
    return m;
  },
  firefox: (m) => {
    m.background = { scripts: ['background.js'] };
    m.optional_permissions = ['http://127.0.0.1/*', 'http://localhost/*'];
    m.browser_specific_settings = { gecko: { id: 'erata@trom.tf', strict_min_version: '142.0', data_collection_permissions: { required: ['none'] } }, gecko_android: { strict_min_version: '142.0' } };
    return m;
  },
  // Safari 17+ (Web Extension converter): fără câmpuri Firefox/Chrome-specifice; background cu scripts.
  safari: (m) => {
    m.background = { scripts: ['background.js'], persistent: false };
    m.optional_permissions = ['http://127.0.0.1/*', 'http://localhost/*'];
    delete m.homepage_url;
    return m;
  },
};

for (const [name, patch] of Object.entries(targets)) {
  const out = resolve(root, 'dist', name);
  rmSync(out, { recursive: true, force: true });
  mkdirSync(out, { recursive: true });
  await build({
    entryPoints: ENTRIES.map((e) => resolve(ext, `${e}.js`)),
    outdir: out,
    bundle: true,
    format: 'iife',
    target: ['chrome120', 'firefox121', 'safari17'],
    minify: true,
    legalComments: 'none',
    logLevel: 'warning',
  });
  for (const f of STATIC) cpSync(resolve(ext, f), resolve(out, f));
  cpSync(resolve(ext, 'icons'), resolve(out, 'icons'), { recursive: true });
  cpSync(resolve(root, 'dict'), resolve(out, 'dict'), { recursive: true });
  writeFileSync(resolve(out, 'manifest.json'), JSON.stringify(patch(structuredClone(base)), null, 2));
  if (zip) {
    const file = resolve(root, 'dist', `erata-${base.version}-${name}.zip`);
    rmSync(file, { force: true });
    execFileSync('zip', ['-qr', '-X', file, '.'], { cwd: out });
    console.log('→', file);
  }
  console.log('build ok:', name);
}
