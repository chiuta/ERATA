# ERATA — corector offline pentru browser

Extensie pentru Chrome, Edge, Opera, Firefox (și Safari prin convertor) care verifică ortografia, gramatica,
punctuația și tipografia **local**, fără cont, fără server și fără să trimită textul nicăieri.
Implementare **clean-room** (vezi [CLEANROOM.md](CLEANROOM.md)).

## Ce face
| Funcție | Detalii |
|---|---|
| Limbi | ortografie: **ro, en (US/GB), fr, es, pt**; reguli dedicate: ro, en, fr, es; orice alt dicționar Hunspell se poate importa (de, it, nl …) |
| Detecție automată | limba se stabilește **pe paragraf**; în text străin sau nesuportat nu apar alarme false |
| Română în profunzime | cedilă → virgulă (ș/ț), „să/sa”, „într-un/dintr-o”, „între 5 și 10”, virgulă înainte de „dar/însă”, „unul dintre”, luni/zile cu literă mică, pleonasme, „vizavi”, „sunt” |
| **Restaurare de diacritice** | transformă textul scris fără diacritice (ro, fr, es, pt) într-unul corect, doar unde varianta e sigură |
| Câmpuri | `textarea`, `input`, `contenteditable` (inclusiv editoare bogate); sublinierile se desenează într-un strat separat, **fără a modifica DOM-ul paginii** |
| Accesibil | tipurile de eroare diferă și prin formă (ondulat / continuu / punctat), nu doar prin culoare |
| Control | dicționar personal, reguli proprii (regex), reguli dezactivabile, site-uri dezactivate, import/export setări |
| Studio de text | pagină proprie pentru verificare, „Corectează tot”, lizibilitate |
| Stil | propoziții foarte lungi, repetiții apropiate, indice de lizibilitate |
| Opțional | reformulare cu un model **local** (OpenAI-compatibil pe `localhost`), dezactivată implicit |

Scurtături: `Alt+Shift+F` corectează tot în câmpul activ, `Alt+Shift+E` activează/dezactivează pe site.

## Instalare (dezvoltare)
```bash
npm ci
npm run dicts    # copiază dicționarele Hunspell în dict/
npm test         # teste unitare (Node >= 24)
npm run build    # produce dist/chrome și dist/firefox
npm run pack     # + arhive .zip
```
- **Chrome / Edge / Opera:** `chrome://extensions` → Mod dezvoltator → „Încarcă extensia despachetată” → `dist/chrome`.
- **Firefox:** `about:debugging` → „Încarcă un supliment temporar” → `dist/firefox/manifest.json`.
- **Safari:** `xcrun safari-web-extension-converter dist/chrome` (necesită macOS și Xcode; netestat aici).

## Arhitectură
```
src/core/        motor independent de browser (rulează și în Node)
  hunspell.js    parser .aff/.dic, verificare cu afixe pe 2 niveluri, sugestii
  engine.js      orchestrare: limbă → ortografie → reguli → suprapuneri → cache pe paragraf
  rules/         common · ro · en · fr · es
  style.js       stil + lizibilitate
extension/       background (motorul), content (UI), popup, opțiuni, studio
```
Fundalul găzduiește motorul; scriptul de conținut doar trimite textul și desenează. Rezultatele sunt memorate pe paragraf,
deci la tastare se reverifică doar paragraful modificat.

## Limite cunoscute
- Acoperirea gramaticală e mai restrânsă decât a unui corector cu mii de reguli scrise în ani; ERATA pornește
  cu reguli puține, dar curate, și un cadru ușor de extins (vezi `src/core/rules/`).
- Nu verifică în Google Docs / editoare pe `canvas`.
- Verificat automat doar în Chromium; Firefox trece `web-ext lint`, dar nu a fost rulat într-un browser aici.
- Interfața: ro, en, fr, es.

## Licență
MIT pentru codul ERATA. Dicționarele din `dict/` au licențe proprii ([dict/LICENSES.md](dict/LICENSES.md)).
