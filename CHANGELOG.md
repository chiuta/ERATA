# Changelog

## 0.4.0 — 2026-11-27
### Added
- Interface, README and presentation page in **25 languages**: the 8 core ones plus the national-minority languages of Romania (uk, tr, crh, ru, sr, sk, bg, hr, el, yi, cs, pl, hy, rue, sq, mk, rmy). The 17 new ones are machine translations not yet reviewed by native speakers (lowest confidence: rue, rmy, crh, yi; moderate: hy, sq). Store metadata (`_locales`) only for locales browsers' stores accept. Yiddish is laid out right-to-left.
- Keyboard access: `Alt+Shift+Space` opens suggestions at the cursor, `Alt+Shift+M` opens the field menu; focus trap, Esc, focus restore, localised ARIA labels.
- `npm run eval`: precision/recall/F1 per language and per rule on an author-written labelled set (not independent), false alarms per 1000 words on author-written correct corpora, language-detection rate.
- Presentation page is now assembled from `docs/index.src.html` + `docs/i18n/*.js` (`npm run site`); UI strings live in `extension/i18n/*.js`.

### Fixed (second adversarial audit)
- Engine: quadratic time on 1 MB inputs (sentence splitting, word look-around, RO_SA): >120 s down to <4 s; hard time budget.
- Hunspell: infinite loop on `REP ^`/`$`, exponential compounds, slow French suggestions (~1.2 s to ~0.2 s); malformed/BOM/CRLF/UTF-16/legacy-encoded dictionaries load with warnings instead of throwing.
- Rules: false positives/negatives in EN_I, EN_AGREEMENT, EN_COULD_OF, FR_ELISION, FR_MOIS_JOURS, ES_SIGNOS_INVERTIDOS, ES_MESES_DIAS, PT_GRAMATICA, SENTENCE_CAPITAL, RO_PLEONASM; proper names and foreign quotations no longer raise spelling alarms; three non-idempotent `fixAll` cases.
- Language detection on short fragments (3–50 words): 76.9% to 97.5% on the author's set.
- Cache: signature collisions, stale results after invalidation, poisoning by a failing dictionary; options sanitised; unsafe (ReDoS) user rules rejected in the engine and in the extension, with a localised message.
- Extension: UI invisible under modal `<dialog>`/popover/fullscreen (now in the top layer); underlines missing under strict CSP; wrong geometry under CSS transforms, zoom, vertical text, RTL and clipped scroll containers; IME composition, native undo and selection protected; sleeping/orphaned service worker handled (retry, "connection lost" badge).
- Privacy: a password field switched to text ("show password") stays excluded; sensitive-field detection uses `type`/`autocomplete`/`inputmode` instead of a broad name regex; network log shows 0 external requests from the extension.
- Accessibility: AA contrast palette, forced-colors fixes, "Checking…" state.

### Known gaps
- Engine messages (rule explanations) are localised only in the checked language/English, not in the 25 UI languages.
- Evaluation sets are written by the author; no independent benchmark. No Hungarian or other minority-language spell checking: translating the interface adds no dictionary.
- Firefox is linted, not run; Safari untested. Rotated contenteditable has no underlines; tiny iframes clip the card.

## 0.3.0 — 2026-11-18
- Adversarial audit of the engine, rules and extension.
- Added `docs/COMPARISON.md`: an adversarial, sourced comparison with the alternatives (unverified facts are marked).
- Interface available in 8 languages: ro, en, fr, it, es, pt, de, hu.
- Documentation in 8 languages (README.md plus README.ro/fr/it/es/pt/de/hu.md); the README now states accurately that ro, en, fr, es and pt have dedicated rule packs and de and it have minimal ones.
- Hungarian: interface only, no spell checking and no rules yet (stated openly in the docs).
- Added a presentation page.
- License line updated to "Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio)".

### Fixed
- Engine: quadratic tokenizer on long runs (4.7 s -> 47 ms), catastrophic backtracking in SENTENCE_CAPITAL and RO_VIRGULA_DAR, O(n^2) overlap resolution, per-paragraph match cap, binary search in protected ranges.
- Engine: result cache now keyed on the whole personal dictionary.
- Extension: corrupted stored settings are sanitised; unsafe/ReDoS user regex rules rejected; dictionary import tolerates unknown encodings (cp1250 etc.).
- UI: Italian, Portuguese, German and Hungarian added (8 languages), localised extension name/description (_locales).
- Known gaps: keyboard-only navigation of card/panel, IME, nested-scroll repositioning, a few aria strings not yet localised; Hungarian has no spellchecking yet.

## 0.2.0 — 2026-11-18
- ro: 11 reguli noi (clitice, iar/i-ar, ia/ea, a/ai/am, niciun, „nu X, ci Y”, vocativ, compuse).
- pt: reguli; de și it: pachete de reguli (dicționar importat de utilizator).
- Țintă de build Safari (netestată) și workflow macOS.

## 0.1.0 — 2026-11-18
- Motor clean-room: parser Hunspell propriu, sugestii, detecție de limbă pe paragraf.
- Limbi: ro, en (US/GB), fr, es, pt (ortografie); reguli dedicate pentru ro, en, fr, es.
- Restaurare de diacritice (ro/fr/es/pt) și „Corectează tot".
- Extensie MV3: textarea, input, contenteditable; popup, setări, Studio de text.
- Dicționar personal, reguli proprii (regex), import de dicționare Hunspell, reformulare locală opțională.
