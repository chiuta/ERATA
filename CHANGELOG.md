# Changelog

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
