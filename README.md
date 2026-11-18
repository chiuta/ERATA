# ERATA — offline proofreader for the browser

A browser extension (Chrome, Edge, Opera, Firefox; Safari via converter) that checks spelling, grammar,
punctuation and typography **locally** — no account, no server, your text never leaves the device.
Built **clean-room** (see [CLEANROOM.md](CLEANROOM.md)).

## Features
- **Languages:** spelling for ro, en (US/GB), fr, es, pt; dedicated rule packs for ro, en, fr, es; import any Hunspell dictionary (de, it, nl …).
- **Per-paragraph language detection**, so foreign passages don't produce false alarms.
- **Deep Romanian support:** comma-below ș/ț, “să/sa”, “într-un”, “între 5 și 10”, commas before “dar/însă”, lowercase months, pleonasms …
- **Diacritics restoration** (ro, fr, es, pt) — only where the fix is unambiguous.
- Works in `textarea`, `input` and `contenteditable`; underlines are drawn in a separate layer and **never touch the page DOM**.
- Accessible markers (wavy / solid / dashed / dotted), personal dictionary, custom regex rules, per-site switch, import/export.
- Text Studio page, “Fix all”, readability score, optional **local** LLM rewrite (localhost only, off by default).

Shortcuts: `Alt+Shift+F` fix all in the active field, `Alt+Shift+E` toggle on this site.

## Build
```bash
npm ci && npm run dicts && npm test && npm run build   # Node >= 24
```
Load `dist/chrome` as an unpacked extension (Chromium) or `dist/firefox/manifest.json` as a temporary add-on (Firefox).
Safari: `xcrun safari-web-extension-converter dist/chrome` (macOS + Xcode; untested here).

## Limits
Fewer grammar rules than long-established checkers; no Google Docs (canvas editor); automated browser tests run on Chromium only.

MIT-licensed code; bundled dictionaries keep their own licenses ([dict/LICENSES.md](dict/LICENSES.md)). See also [PRIVACY.md](PRIVACY.md).
