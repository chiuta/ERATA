[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · **Romani**

# ERATA — korektor offline vaš browser

Versia: 0.4.0 · Agorutni aktualizacia: 27 noemvri 2026

ERATA si jekh extensia pe browser so kontrolisarel e ortografia, e gramatika, e punktuacia thaj e tipografia **kompletno pe tumaro aparato**. Nane konto, nane server thaj nane telemetria: tumaro tekst ni kana džal avri katar tumaro kompjuteri. Si skrisardi clean-room (dikh [CLEANROOM.md](CLEANROOM.md)) thaj si dini avri tel e licenca MIT.

## Funkcii
- Kerel buti ande kimpura `textarea`, `input` thaj `contenteditable`, vi ande rich-text editora. E sublinieri si kerde pe jekh aver strato thaj **ni kana modifikisaren o DOM andi pagina**.
- **Detektisarel e čhib pe sako paragrafo**, vašoda e paragrafura andi aver čhib ni keren falše alarme.
- **Sprijin profund vaš e rumunikani čhib:** ș/ț (virgula tele), na ş/ţ (cedila), „să/sa”, „într-un”, „între 5 și 10”, virgule anglal „dar/însă”, e čhona cikne literenca, pleonasme, klitice thaj aver.
- **Restaurare vaš diakritike** (ro, fr, es, pt), aplikisardo numaj kaj si jekh singuri korektura.
- Semne accesibile: e greshale si diferite pala forma (linija ondulata, plini, liniutata, punktata), na numaj pala o rango.
- Personalo lavustik, reguli regex personale, comutator pe sajt, import/export vaš setari, import vaš sako lavustik Hunspell.
- Pagina Text Studio, „Korektisaren sa”, skor vaš citibilitate, duj kontroli vaš stilo (fraze but lungi, repetiții paše jekh avereste).
- Rescrierea opcionala prekal jekh model **lokalo** (endpoint kompatibilo OpenAI, numaj pe `localhost`), dezaktivisardi implicit.
- Interfejs ande 25 čhiba: rumunikani, anglikani, fransuzikani, italikani, spanjolikani, portugalikani, germanikani, ungrikani, plus e aver čhiba minoritare andi Rumunija (ukrainikani, turcikani, krimeako-tatarikani, rusikani, serbikani, slovakikani, bulgarikani, hrvatikani, grekikani, idiš, čehikani, polikani, armenikani, rusinikani, albanikani, makedonikani, romani). E čhib le interfejsoskiri si nezavisimi katar e čhib so si kontrolisardi.

Skurtaturi: `Alt+Shift+F` korektisarel sa ando kimpo aktivo, `Alt+Shift+E` aktivisarel vaj dezaktivisarel e ERATA pe kava sajt. Tastatura: Alt+Shift+Space sugestii · Alt+Shift+M menu · Esc phanden.

## Čhiba suportisarde — so si čačes kote
| Čhib | Ortografia | Reguli |
|---|---|---|
| Rumunikani (ro) | lavustik inkludisardo | pachet dedikato vaš reguli, o maj profundo |
| Anglikani (en-US, en-GB) | lavustika inkludisarde | pachet dedikato vaš reguli (cikno) |
| Fransuzikani (fr) | lavustik inkludisardo | pachet dedikato vaš reguli (cikno), spacii thaj diakritike |
| Spanjolikani (es) | lavustik inkludisardo | pachet dedikato vaš reguli (cikno), semne inversate thaj diakritike |
| Portugalikani (pt) | lavustik inkludisardo | pachet dedikato vaš reguli (cikno) |
| Germanikani (de) | **na inkludisardo** (licenca GPL); importisaren tumaro korkoro lavustik Hunspell | pachet minimalo vaš reguli |
| Italikani (it) | **na inkludisardo** (licenca GPL); importisaren tumaro korkoro lavustik Hunspell | pachet minimalo vaš reguli |
| Ungrikani (hu) | **nane ande 0.4.0** | **nane**: si tradusisardo numaj o interfejs; dži akana nane kontrola ortografiko vaš e ungrikani čhib |

Sako aver lavustik Hunspell (nl, …) šaj importisaren, numaj e čhiba opre si prindžarde katar o detektor e čhib.

## Traducii
O interfejs, kado README thaj e pagina de prezentare si ande 25 čhiba. Oxto katar on (ro, en, fr, it, es, pt, de, hu) si e čhiba principale vaš o proiekto; e aver deš thaj efta si ćhivde ande 0.4.0. **Mašinaki traducia, dži akana bi kontrola katar jekh manuš savo rakirel e čhib sar dakiri čhib. Kamas e korekturi: https://github.com/chiuta/ERATA/issues**
(Original ande anglikani čhib: **Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues**)
Maj nesigurno: rusinikani, romani, krimeako-tatarikani thaj idiš. Kana o interfejs si tradusisardo, kodoja čhib ni lel vi kontrola ortografiko: dikh e tabela opre vaš so si kontrolisardo čačes.
Terminura tehnice: *lavustik* = dicționar (dictionary); *kimpo* = câmp (text field); *skurtaturi* = shortcuts; *browser*, *extensia*, *sajt*, *endpoint* si terminura internacionale.

## Konfidencialitate
Sa e kontrola kerel pes andi extensia. Nane server ERATA, nane konto, nane telemetria vaj analitika, thaj e extensia ni mangel ni jekh permisia vaš e reca. Excepcia singuri si e rescrierea lokala opcionala, dezaktivisardi implicit, so šaj bičhalel jekh fraza ko jekh endpoint pe `localhost`/`127.0.0.1` so tumen alosaren. E setari, o personalo lavustik thaj e lavustika importisarde ačhen ande `storage.local` thaj IndexedDB pe tumaro aparato. E kimpura vaš parola, e-mail thaj karta, thaj e kimpura markisarde `data-erata="off"`, si ignorime. Detalii: [PRIVACY.md](PRIVACY.md).

## Instalacia
Dži akana, ERATA si kerdi katar o kod sursa.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** phraven `chrome://extensions`, aktivisaren „Developer mode”, alosaren „Load unpacked” thaj alosaren `dist/chrome`.
- **Firefox:** phraven `about:debugging`, alosaren „Load Temporary Add-on” thaj alosaren `dist/firefox/manifest.json`.
- **Safari (prekal Xcode, numaj macOS):** `xcrun safari-web-extension-converter dist/chrome`, pala kodo kompilisaren thaj rulisaren o proiekto Xcode generato. E versia vaš Safari **nane testisardi** katar o autoro; dikh [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA ni inkerel thaj ni lel khanči katar o kod, e reguli (XML/Java), e date vaj e texturi de mesaje katar LanguageTool vaj katar aver korektor. O parser Hunspell, e reguli, o detektor e čhib thaj e algoritmura vaš e sugestii si kerde katar o zero, pala deskripcii publice vaš e formate thaj pala o prindžaripe generalo vaš gramatika thaj tipografia. E lavustika inkludisarde si proiekte Hunspell independente, kaj si lenge korkore licence ([dict/LICENSES.md](dict/LICENSES.md)). Metoda kompleta: [CLEANROOM.md](CLEANROOM.md).

## Komparacia le alternativenca (cikni thaj čačuni)
Rapoarto komplet le surse thaj e rezerve: [docs/COMPARISON.md](docs/COMPARISON.md). E fapte vaš e konkurenca sas kolektisarde katar pagini publice pe 2026-11-18; so si markisardo kote *neverifikisardo* nane konfirmisardo.

- **LanguageTool, Grammarly, Microsoft Editor:** but maj bari acoperire gramatikali ande e čhiba bare (LanguageTool publikisarel mii reguli vaš e anglikani, fransuzikani, germanikani, spanjolikani thaj portugalikani čhib), plus funkcii vaš claritate thaj rescriere, Google Docs thaj mobilo. On bičhalen o tekst ande cloud-uri le firmengere implicit. ERATA ni kerel kava.
- **Harper:** vi kompletno lokalo thaj but aktivo, numaj vaš e anglikani čhib.
- **Native browser spellcheck:** lokalo ando režim bazico, numaj ortografia, bi gramatika.
- **Vale thaj LTeX+:** instrumente vaš dezvoltatori, vaš editora thaj linija de komanda, na extensii pe browser.
- **Kaj si ERATA utilo:** jekh extensia lokali pe browser so kombinisarel ortografia thaj reguli specifice vaš e rumunikani, fransuzikani, spanjolikani, portugalikani thaj anglikani čhib, le restaurare vaš diakritike, reguli personale thaj lavustika importisarde. Vaš e rumunikani čhib, e surse arakhle sugerisaren kaj e produkte etablisarde si relativ slabe (numaj ortografia ande Microsoft Editor; LanguageTool markisarel e rumunikani sar inaktivo); kava reflektisarel e deklaracii publice, na jekh benchmark.
- **Kaj si maj nasul:** ERATA si ande total sar jekh šel kontroli kerde ando vas (jekh numaraibe aproximativo, na auditisardo). Dži akana nane masurisaripe vaš precizia/recall pe jekh korpus. E ungrikani čhib nane acoperisardi, thaj Microsoft Editor acoperisarel la, thaj Grammarly ćhivel la ande beta (profunzimo neverifikisardo).

## Limiti prindžarde
- But maj cikne reguli gramatikale sar e korektora phure thaj etablisarde; nane strato statistiko vaš e greshale ande lava reale.
- Nane Google Docs (jekh editor pe canvas), nane mobilo, nane integrare pe desktop vaj ande procesora de tekst.
- E teste automate ande browser rulisaren numaj pe Chromium. Firefox si lačho ande `web-ext lint`, numaj kathe nane rulisardo ande browser. Safari nane testisardo.
- Nane kontrola ortografiko vaš e ungrikani čhib; nane lavustik inkludisardo vaš e germanikani vaj italikani čhib.
- Nane audit independento vaš accesibilitate.
- O proiekto si nevo (e jekhte versii si katar 18 noemvri 2026): dži akana nane bazo de utilizatori thaj nane istorik.

## Dezvoltare
Mangel Node.js >= 24.
```bash
npm i            # install dependencies
npm run dicts    # copy the Hunspell dictionaries into dict/
npm test         # unit tests
npm run build    # produces dist/chrome and dist/firefox
```
`npm run pack` kerel vi arhive `.zip`.

## Licenca
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Dikh [LICENSE](LICENSE). E lavustika inkludisarde inkeren e lengere korkore licence ([dict/LICENSES.md](dict/LICENSES.md)).

## Sprijin
Te si ERATA utilo tumenge, šaj sprijinisaren o dezvoltaripe: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
