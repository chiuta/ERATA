[English](README.md) · **Română** · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — corector offline pentru browser

Versiune: 0.4.1 · Ultima actualizare: 28 noiembrie 2026

ERATA este o extensie de browser care verifică ortografia, gramatica, punctuația și tipografia **integral pe dispozitivul dvs.** Fără cont, fără server, fără telemetrie: textul nu părăsește niciodată calculatorul. Este scrisă clean-room (vezi [CLEANROOM.md](CLEANROOM.md)) și publicată sub licență MIT.

## Funcții
- Funcționează în câmpuri `textarea`, `input` și `contenteditable`, inclusiv în editoare bogate. Sublinierile se desenează într-un strat separat și **nu modifică DOM-ul paginii**.
- **Detecția limbii pe paragraf**, deci pasajele în altă limbă nu produc alarme false.
- **Română în profunzime:** ș/ț cu virgulă în loc de cedilă, „să/sa”, „într-un”, „între 5 și 10”, virgulă înainte de „dar/însă”, luni cu literă mică, pleonasme, clitice și altele.
- **Restaurare de diacritice** (ro, fr, es, pt), doar acolo unde corectura este sigură.
- Marcaje accesibile: tipurile de eroare se deosebesc și prin forma liniei (ondulată, continuă, întreruptă, punctată), nu doar prin culoare.
- Dicționar personal, reguli proprii (regex), activare pe site, import/export de setări, import de orice dicționar Hunspell.
- Pagina Studio de text, „Corectează tot”, indice de lizibilitate, două verificări de stil (propoziții foarte lungi, repetiții apropiate).
- Reformulare opțională cu un model **local** (endpoint compatibil OpenAI, doar pe `localhost`), dezactivată implicit.
- Interfață în 25 de limbi: română, engleză, franceză, italiană, spaniolă, portugheză, germană, maghiară, plus celelalte limbi ale minorităților naționale din România (ucraineană, turcă, tătară crimeeană, rusă, sârbă, slovacă, bulgară, croată, greacă, idiș, cehă, poloneză, armeană, rusină, albaneză, macedoneană, romani). Limba interfeței este independentă de limba verificată.

Scurtături: `Alt+Shift+F` corectează tot în câmpul activ, `Alt+Shift+E` activează/dezactivează ERATA pe site-ul curent. Tastatură: Alt+Shift+Spațiu sugestii · Alt+Shift+M meniu · Esc închide.

## Limbi suportate — ce există cu adevărat
| Limba | Ortografie | Reguli |
|---|---|---|
| Română (ro) | dicționar inclus | pachet dedicat, cel mai dezvoltat |
| Engleză (en-US, en-GB) | dicționare incluse | pachet dedicat (restrâns) |
| Franceză (fr) | dicționar inclus | pachet dedicat (restrâns), spații și diacritice |
| Spaniolă (es) | dicționar inclus | pachet dedicat (restrâns), semne inversate și diacritice |
| Portugheză (pt) | dicționar inclus | pachet dedicat (restrâns) |
| Germană (de) | **neinclus** (licențe GPL); importați propriul dicționar Hunspell | pachet minim |
| Italiană (it) | **neinclus** (licențe GPL); importați propriul dicționar Hunspell | pachet minim |
| Maghiară (hu) | **inexistentă în 0.4.1** | **inexistente**: doar interfața e tradusă; verificarea ortografică pentru maghiară nu există încă |

Orice alt dicționar Hunspell (nl etc.) se poate importa, dar detectorul de limbă le cunoaște doar pe cele de mai sus.

## Traduceri
Interfața, acest README și pagina de prezentare există în 25 de limbi. Opt dintre ele (ro, en, fr, it, es, pt, de, hu) sunt limbile de bază ale proiectului; celelalte șaptesprezece au fost adăugate în 0.4.1. **Doar cele 17 limbi noi sunt traduse automat și nu au fost încă revizuite de un vorbitor nativ. Corecturile sunt binevenite: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Cea mai scăzută încredere: rusina, romani, tătara crimeeană și idișul. Traducerea interfeței nu adaugă verificare ortografică pentru limba respectivă: vezi tabelul de mai sus pentru ce se verifică în realitate.

## Confidențialitate
Toată verificarea se face în interiorul extensiei. Nu există server ERATA, cont, telemetrie sau analitice, iar extensia nu cere permisiuni de rețea. Singura excepție este reformularea locală, opțională și dezactivată implicit, care poate trimite o propoziție către un endpoint de pe `localhost`/`127.0.0.1` ales de dvs. Setările, dicționarul personal și dicționarele importate rămân în `storage.local` și IndexedDB, pe dispozitivul dvs. Câmpurile de parolă, e-mail și card, precum și cele marcate `data-erata="off"`, sunt ignorate. Detalii: [PRIVACY.md](PRIVACY.md).

## Instalare
Deocamdată ERATA se construiește din sursă.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** `chrome://extensions` → Mod dezvoltator → „Încarcă extensia despachetată” → `dist/chrome`.
- **Firefox:** `about:debugging` → „Încarcă un supliment temporar” → `dist/firefox/manifest.json`.
- **Safari (prin Xcode, doar macOS):** `xcrun safari-web-extension-converter dist/chrome`, apoi construiți și rulați proiectul Xcode generat. Varianta Safari **nu a fost testată** de autor; vezi [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA nu conține și nu derivă nimic din codul, regulile (XML/Java), datele sau mesajele LanguageTool ori ale altui corector. Parserul Hunspell, regulile, detectorul de limbă și algoritmii de sugestii au fost scrise de la zero, după descrieri publice de format și din cunoștințe generale de gramatică și tipografie. Dicționarele incluse sunt proiecte Hunspell independente, cu licențe proprii ([dict/LICENSES.md](dict/LICENSES.md)). Metodologia completă: [CLEANROOM.md](CLEANROOM.md).

## Comparație cu alternativele (scurtă și onestă)
Varianta completă, cu surse și rezerve: [docs/COMPARISON.md](docs/COMPARISON.md). Datele despre concurenți provin din pagini publice consultate la 2026-11-18; ce e marcat *neverificat* acolo nu este confirmat.

- **LanguageTool, Grammarly, Microsoft Editor:** acoperire gramaticală mult mai largă la limbile mari (LanguageTool publică numere de reguli de ordinul miilor pentru engleză, franceză, germană, spaniolă și portugheză), plus funcții de claritate și reformulare, Google Docs și mobil. Trimit implicit textul către serverele furnizorului. ERATA nu.
- **Harper:** tot complet local și foarte activ, dar numai pentru engleză.
- **Verificatorul ortografic nativ al browserului:** local în modul de bază, doar ortografie, fără gramatică.
- **Vale și LTeX+:** unelte pentru dezvoltatori (editoare, linie de comandă), nu extensii de browser.
- **Unde e utilă ERATA:** extensie locală care combină ortografia cu reguli țintite pentru română, franceză, spaniolă, portugheză și engleză, cu restaurare de diacritice, reguli proprii și dicționare importate. Pentru română, sursele găsite sugerează că soluțiile consacrate sunt relativ slabe (Microsoft Editor: doar ortografie; LanguageTool marchează româna ca inactivă); este o constatare din declarații publice, nu un test comparativ.
- **Unde pierde:** ERATA are în total cam o sută de verificări scrise de mână (număr aproximativ, neauditat). Nu există încă o măsurare a preciziei și a recall-ului pe un corpus. Maghiara nu e acoperită, deși Microsoft Editor o acoperă, iar Grammarly o listează în beta (profunzime neverificată).

## Limite cunoscute
- Mult mai puține reguli gramaticale decât la corectoarele consacrate; nu există un strat statistic pentru erorile de tip cuvânt real.
- Fără Google Docs (editor pe canvas), fără mobil, fără integrare desktop sau în procesoare de text.
- Testele automate rulează doar în Chromium. Firefox trece `web-ext lint`, dar nu a fost rulat într-un browser aici. Safari e netestat.
- Fără verificare ortografică pentru maghiară; fără dicționar german sau italian inclus.
- Fără audit independent de accesibilitate.
- Proiectul e nou (primele versiuni din 18 noiembrie 2026): nu are încă utilizatori sau istoric.

## Dezvoltare
Necesită Node.js >= 24.
```bash
npm i            # instalează dependențele
npm run dicts    # copiază dicționarele Hunspell în dict/
npm test         # teste unitare
npm run build    # produce dist/chrome și dist/firefox
```
`npm run pack` creează în plus arhive `.zip`.

## Licență
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Vezi [LICENSE](LICENSE). Dicționarele incluse au licențe proprii ([dict/LICENSES.md](dict/LICENSES.md)).

## Sprijin
Dacă ERATA vă este de folos, puteți sprijini dezvoltarea ei: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
