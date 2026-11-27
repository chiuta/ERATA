**English** · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — offline proofreader for the browser

Version: 0.4.0 · Last updated: 27 November 2026

ERATA is a browser extension that checks spelling, grammar, punctuation and typography **entirely on your device**. There is no account, no server and no telemetry: your text never leaves your computer. It is written clean-room (see [CLEANROOM.md](CLEANROOM.md)) and released under the MIT licence.

## Features
- Works in `textarea`, `input` and `contenteditable` fields, including rich editors. Underlines are drawn in a separate layer and **never modify the page DOM**.
- **Per-paragraph language detection**, so foreign passages do not trigger false alarms.
- **Deep Romanian support:** comma-below ș/ț instead of cedilla, “să/sa”, “într-un”, “între 5 și 10”, commas before “dar/însă”, lowercase months, pleonasms, clitics and more.
- **Diacritics restoration** (ro, fr, es, pt), applied only where the fix is unambiguous.
- Accessible markers: error types differ by line shape (wavy, solid, dashed, dotted), not only by colour.
- Personal dictionary, custom regex rules, per-site switch, import/export of settings, import of any Hunspell dictionary.
- Text Studio page, “Fix all”, readability score, two style checks (very long sentences, close repetitions).
- Optional rewrite through a **local** model (OpenAI-compatible endpoint on `localhost` only), off by default.
- Interface in 25 languages: Romanian, English, French, Italian, Spanish, Portuguese, German, Hungarian plus the other national-minority languages of Romania (Ukrainian, Turkish, Crimean Tatar, Russian, Serbian, Slovak, Bulgarian, Croatian, Greek, Yiddish, Czech, Polish, Armenian, Rusyn, Albanian, Macedonian, Romani). The interface language is independent of the language being checked.

Shortcuts: `Alt+Shift+F` fixes everything in the active field, `Alt+Shift+E` toggles ERATA on the current site. Keyboard: Alt+Shift+Space suggestions · Alt+Shift+M menu · Esc close.

## Supported languages — what is really there
| Language | Spelling | Rules |
|---|---|---|
| Romanian (ro) | bundled dictionary | dedicated rule pack, the deepest one |
| English (en-US, en-GB) | bundled dictionaries | dedicated rule pack (small) |
| French (fr) | bundled dictionary | dedicated rule pack (small), spacing and diacritics |
| Spanish (es) | bundled dictionary | dedicated rule pack (small), inverted marks and diacritics |
| Portuguese (pt) | bundled dictionary | dedicated rule pack (small) |
| German (de) | **not bundled** (GPL licensing); import your own Hunspell dictionary | minimal rule pack |
| Italian (it) | **not bundled** (GPL licensing); import your own Hunspell dictionary | minimal rule pack |
| Hungarian (hu) | **none in 0.4.0** | **none**: only the interface is translated; there is no spell checking for Hungarian yet |

Any other Hunspell dictionary (nl, …) can be imported, but only the languages above are known to the language detector.

## Translations
The interface, this README and the presentation page exist in 25 languages. Eight of them (ro, en, fr, it, es, pt, de, hu) are the project's core languages; the other seventeen were added in 0.4.0. **Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues** Lowest confidence: Rusyn, Romani, Crimean Tatar and Yiddish. Translating the interface does not add spell checking for that language: see the table above for what is actually checked.

## Privacy
All checking happens inside the extension. There is no ERATA server, account, telemetry or analytics, and the extension requests no network permission. The single exception is the optional, off-by-default local rewrite, which can send one sentence to an endpoint on `localhost`/`127.0.0.1` that you choose. Settings, the personal dictionary and imported dictionaries stay in `storage.local` and IndexedDB on your device. Password, e-mail and card fields, and fields marked `data-erata="off"`, are ignored. Details: [PRIVACY.md](PRIVACY.md).

## Installation
ERATA is built from source for now.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** open `chrome://extensions`, enable Developer mode, choose “Load unpacked” and select `dist/chrome`.
- **Firefox:** open `about:debugging`, choose “Load Temporary Add-on” and select `dist/firefox/manifest.json`.
- **Safari (via Xcode, macOS only):** `xcrun safari-web-extension-converter dist/chrome`, then build and run the generated Xcode project. The Safari build has **not been tested** by the author; see [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA contains and derives nothing from the code, rules (XML/Java), data or message texts of LanguageTool or any other checker. The Hunspell parser, the rules, the language detector and the suggestion algorithms were written from scratch from public format descriptions and general knowledge of grammar and typography. Bundled dictionaries are independent Hunspell projects with their own licences ([dict/LICENSES.md](dict/LICENSES.md)). Full method: [CLEANROOM.md](CLEANROOM.md).

## Comparison with the alternatives (short and honest)
Full write-up with sources and caveats: [docs/COMPARISON.md](docs/COMPARISON.md). Facts about competitors were gathered from public pages on 2026-11-18; anything marked *unverified* there is not confirmed.

- **LanguageTool, Grammarly, Microsoft Editor:** far more grammar coverage in the major languages (LanguageTool publishes rule counts in the thousands for English, French, German, Spanish and Portuguese), plus clarity and rewriting features, Google Docs and mobile. They send text to vendor clouds by default. ERATA does not.
- **Harper:** also fully local and very active, but English only.
- **Native browser spellcheck:** local in its basic mode, spelling only, no grammar.
- **Vale and LTeX+:** developer tools for editors and the command line, not browser extensions.
- **Where ERATA is useful:** a local browser extension combining spelling and targeted rules for Romanian, French, Spanish, Portuguese and English, with diacritics restoration, custom rules and imported dictionaries. For Romanian, the sources found suggest the incumbents are comparatively thin (spelling only in Microsoft Editor; LanguageTool marks Romanian inactive); this reflects public statements, not a benchmark.
- **Where it loses:** ERATA has on the order of one hundred hand-written checks in total (a rough count, not audited). No precision/recall measurement against a corpus exists yet. Hungarian is not covered, while Microsoft Editor covers it and Grammarly lists it in beta (depth unverified).

## Known limits
- Far fewer grammar rules than long-established checkers; no statistical layer for real-word errors.
- No Google Docs (canvas editor), no mobile, no desktop or word-processor integration.
- Automated browser tests run on Chromium only. Firefox passes `web-ext lint` but has not been run in a browser here. Safari is untested.
- No Hungarian spell checking; no bundled German or Italian dictionary.
- No independent accessibility audit.
- The project is new (first releases dated 18 November 2026): no user base or track record yet.

## Development
Requires Node.js >= 24.
```bash
npm i            # install dependencies
npm run dicts    # copy the Hunspell dictionaries into dict/
npm test         # unit tests
npm run build    # produces dist/chrome and dist/firefox
```
`npm run pack` additionally creates `.zip` archives.

## Licence
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). See [LICENSE](LICENSE). Bundled dictionaries keep their own licences ([dict/LICENSES.md](dict/LICENSES.md)).

## Support
If ERATA is useful to you, you can support its development: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
