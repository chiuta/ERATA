# Metodologie clean-room / Clean-room methodology

ERATA este scris de la zero. **Nu conține și nu derivă din** codul, regulile (XML/Java),
datele sau textele de mesaje ale LanguageTool sau ale altui corector.

## Ce a fost făcut
- **Motorul Hunspell** (`src/core/hunspell.js`) este o implementare proprie a formatului `.aff`/`.dic`,
  scrisă după descrierea publică a formatului (prefixe, sufixe, steaguri de continuare, REP, MAP, KEY, TRY, ICONV).
- **Regulile** (`src/core/rules/*.js`) au fost redactate original, din cunoștințe generale de gramatică și
  tipografie (norme de limbă: DOOM3 pentru română etc.), fiecare ca funcție JavaScript sau tabel propriu.
- **Detecția limbii** (`src/core/langid.js`) folosește liste de cuvinte funcționale redactate manual.
- **Sugestiile** (distanță Damerau–Levenshtein ponderată, variante de diacritice, REP, separare) sunt algoritmi proprii.
- **Lista de frecvență** din `rules/ro.js` e alcătuită manual și servește doar la departajarea sugestiilor.

## Ce NU a fost făcut
- Nu s-a deschis, copiat sau tradus niciun fișier din depozitul LanguageTool.
- Nu s-au reprodus identificatori de reguli, formulări de mesaje sau seturi de exemple ale altor proiecte.
- Nu s-au folosit n-grame/modele de la LanguageTool.

## Dicționare
Dicționarele din `dict/` sunt proiecte Hunspell independente (pachete npm `dictionary-*`), cu licențe proprii
(vezi `dict/LICENSES.md`). Sunt date, nu cod; ERATA le citește cu parserul propriu.

## Reguli pentru contribuții
1. Scrieți regula din cunoștințele dvs. despre limbă, nu după un alt corector.
2. Adăugați un test pozitiv și unul negativ (text corect care nu trebuie semnalat) în `test/`.
3. Dacă ați consultat o gramatică sau un dicționar normativ, citați-l în mesajul commit-ului.

---
Version note (0.3.0, 2026-11-18): the methodology is unchanged. The `docs/COMPARISON.md` research used only public product pages, documentation and store listings; no LanguageTool source code or rule files were opened. The minimal de/it/pt rule packs and the interface translations were likewise written originally. German and Italian dictionaries are not bundled (GPL licensing); users may import their own.

Version note (0.4.0, 2026-11-27): the methodology is unchanged. The evaluation corpora and labelled sets under `test/eval/` were written by the project itself; no external corpus or third-party rule data was copied. The 17 new interface and documentation translations are original machine translations of the project's own English texts.
