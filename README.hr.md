[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · **Hrvatski** · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — izvanmrežni korektor za preglednik

Verzija: 0.4.0 · Zadnje ažuriranje: 27. studenoga 2026.

ERATA je proširenje za preglednik koje provjerava pravopis, gramatiku, interpunkciju i tipografiju **u cijelosti na vašem uređaju**. Nema računa, poslužitelja ni telemetrije: vaš tekst nikada ne napušta vaše računalo. Proširenje je napisano metodom clean-room (pogledajte [CLEANROOM.md](CLEANROOM.md)) i objavljeno pod licencijom MIT.

## Mogućnosti
- Radi u poljima `textarea`, `input` i `contenteditable`, uključujući napredne uređivače teksta. Podcrtavanja se iscrtavaju u zasebnom sloju i **nikada ne mijenjaju DOM stranice**.
- **Prepoznavanje jezika po odlomku**, pa odlomci na stranom jeziku ne izazivaju lažne uzbune.
- **Dubinska podrška za rumunjski:** ș/ț sa zarezom ispod umjesto sa sedilom, „să/sa“, „într-un“, „între 5 și 10“, zarezi ispred „dar/însă“, mjeseci malim slovom, pleonazmi, klitike i drugo.
- **Vraćanje dijakritika** (ro, fr, es, pt), primijenjeno samo ondje gdje je ispravak nedvosmislen.
- Pristupačne oznake: vrste pogrešaka razlikuju se po obliku crte (valovita, puna, crtkana, točkasta), a ne samo po boji.
- Osobni rječnik, vlastita pravila s regularnim izrazima, prekidač po web-mjestu, uvoz i izvoz postavki, uvoz bilo kojeg Hunspell rječnika.
- Stranica Studio za tekst, „Ispravi sve“, ocjena čitljivosti, dvije provjere stila (vrlo duge rečenice, bliska ponavljanja).
- Neobavezno preoblikovanje pomoću **lokalnog** modela (krajnja točka kompatibilna s OpenAI-jem, samo na `localhost`), isključeno prema zadanim postavkama.
- Sučelje na 25 jezika: rumunjski, engleski, francuski, talijanski, španjolski, portugalski, njemački, mađarski te ostali jezici nacionalnih manjina u Rumunjskoj (ukrajinski, turski, krimskotatarski, ruski, srpski, slovački, bugarski, hrvatski, grčki, jidiš, češki, poljski, armenski, rusinski, albanski, makedonski, romski). Jezik sučelja neovisan je o jeziku koji se provjerava.

Prečaci: `Alt+Shift+F` ispravlja sve u aktivnom polju, `Alt+Shift+E` uključuje ili isključuje proširenje ERATA na trenutačnom web-mjestu. Tipkovnica: Alt+Shift+Razmaknica prijedlozi · Alt+Shift+M izbornik · Esc zatvaranje.

## Podržani jezici — što doista postoji
| Jezik | Pravopis | Pravila |
|---|---|---|
| Rumunjski (ro) | uključeni rječnik | namjenski paket pravila, najdublji |
| Engleski (en-US, en-GB) | uključeni rječnici | namjenski paket pravila (mali) |
| Francuski (fr) | uključeni rječnik | namjenski paket pravila (mali), razmaci i dijakritici |
| Španjolski (es) | uključeni rječnik | namjenski paket pravila (mali), obrnuti znakovi i dijakritici |
| Portugalski (pt) | uključeni rječnik | namjenski paket pravila (mali) |
| Njemački (de) | **nije uključen** (GPL licenciranje); uvezite vlastiti Hunspell rječnik | minimalni paket pravila |
| Talijanski (it) | **nije uključen** (GPL licenciranje); uvezite vlastiti Hunspell rječnik | minimalni paket pravila |
| Mađarski (hu) | **nema u 0.4.0** | **nema**: preveden je samo sučelje; provjere pravopisa za mađarski još nema |

Bilo koji drugi Hunspell rječnik (nl, …) može se uvesti, ali prepoznavanje jezika zna samo za gore navedene jezike.

## Prijevodi
Sučelje, ovaj README i prezentacijska stranica postoje na 25 jezika. Osam njih (ro, en, fr, it, es, pt, de, hu) osnovni su jezici projekta; ostalih sedamnaest dodano je u 0.4.0. **Strojni prijevod koji još nije pregledao izvorni govornik. Ispravci su dobrodošli: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Najmanja pouzdanost: rusinski, romski, krimskotatarski i jidiš. Prevođenje sučelja ne dodaje provjeru pravopisa za taj jezik: što se doista provjerava, pogledajte u tablici iznad.

## Privatnost
Sva se provjera odvija unutar proširenja. Ne postoji ERATA poslužitelj, račun, telemetrija ni analitika, a proširenje ne traži nikakvo mrežno dopuštenje. Jedina je iznimka neobavezno preoblikovanje pomoću lokalnog modela, isključeno prema zadanim postavkama, koje može poslati jednu rečenicu na krajnju točku na `localhost`/`127.0.0.1` koju sami odaberete. Postavke, osobni rječnik i uvezeni rječnici ostaju u `storage.local` i u IndexedDB na vašem uređaju. Polja za zaporku, e-poštu i karticu te polja označena s `data-erata="off"` zanemaruju se. Pojedinosti: [PRIVACY.md](PRIVACY.md).

## Instalacija
ERATA se za sada gradi iz izvornog koda.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** otvorite `chrome://extensions`, uključite „Način rada za razvojne programere“, odaberite „Učitaj raspakirano“ (Load unpacked) i izaberite `dist/chrome`.
- **Firefox:** otvorite `about:debugging`, odaberite „Učitaj privremeni dodatak“ (Load Temporary Add-on) i izaberite `dist/firefox/manifest.json`.
- **Safari (putem programa Xcode, samo macOS):** `xcrun safari-web-extension-converter dist/chrome`, zatim izgradite i pokrenite generirani Xcode projekt. Autor inačicu za Safari **nije testirao**; pogledajte [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA ne sadrži i ne preuzima ništa iz koda, pravila (XML/Java), podataka ni tekstova poruka alata LanguageTool ili bilo kojeg drugog korektora. Hunspell parser, pravila, prepoznavanje jezika i algoritmi prijedloga napisani su ispočetka na temelju javnih opisa formata te općeg znanja o gramatici i tipografiji. Uključeni rječnici neovisni su Hunspell projekti s vlastitim licencijama ([dict/LICENSES.md](dict/LICENSES.md)). Cjelovita metoda: [CLEANROOM.md](CLEANROOM.md).

## Usporedba s alternativama (kratko i iskreno)
Cjelovit pregled s izvorima i napomenama: [docs/COMPARISON.md](docs/COMPARISON.md). Podaci o konkurenciji prikupljeni su s javnih stranica 2026-11-18; sve što je ondje označeno kao *neprovjereno* nije potvrđeno.

- **LanguageTool, Grammarly, Microsoft Editor:** znatno veća pokrivenost gramatike za velike jezike (LanguageTool objavljuje broj pravila reda veličine tisuća za engleski, francuski, njemački, španjolski i portugalski), uz funkcije jasnoće i preoblikovanja, Google Docs i mobilne uređaje. Prema zadanim postavkama šalju tekst u oblake svojih pružatelja usluga. ERATA ne.
- **Harper:** također posve lokalan i vrlo aktivan, ali samo za engleski.
- **Izvorna provjera pravopisa u pregledniku:** lokalna u osnovnom načinu, samo pravopis, bez gramatike.
- **Vale i LTeX+:** alati za programere, za uređivače i naredbeni redak, a ne proširenja za preglednik.
- **Gdje je ERATA korisna:** lokalno proširenje za preglednik koje spaja provjeru pravopisa i ciljana pravila za rumunjski, francuski, španjolski, portugalski i engleski, uz vraćanje dijakritika, vlastita pravila i uvezene rječnike. Za rumunjski pronađeni izvori upućuju na to da su postojeća rješenja razmjerno slaba (Microsoft Editor: samo pravopis; LanguageTool rumunjski označava kao neaktivan); to odražava javne izjave, a ne mjerenje performansi (benchmark).
- **Gdje gubi:** ERATA ima ukupno otprilike stotinu ručno napisanih provjera (gruba procjena, nije revidirana). Još ne postoji mjerenje preciznosti i odziva (precision/recall) na korpusu. Mađarski nije pokriven, dok ga Microsoft Editor pokriva, a Grammarly ga navodi u beta izdanju (dubina nije provjerena).

## Poznata ograničenja
- Znatno manje gramatičkih pravila nego u dugo uhodanih korektora; nema statističkog sloja za pogreške stvarnih riječi.
- Nema Google Docs (uređivač na canvasu), nema mobilnih aplikacija, nema desktop aplikacije ni integracije s programima za obradu teksta.
- Automatizirani testovi u pregledniku izvode se samo na Chromiumu. Firefox prolazi `web-ext lint`, ali ovdje nije pokretan u pregledniku. Safari nije testiran.
- Nema provjere pravopisa za mađarski; nema uključenog njemačkog ni talijanskog rječnika.
- Nema neovisne revizije pristupačnosti.
- Projekt je nov (prva izdanja datiraju od 18. studenoga 2026.): još nema korisničke baze ni povijesti rada.

## Razvoj
Zahtijeva Node.js >= 24.
```bash
npm i            # instalira ovisnosti
npm run dicts    # kopira Hunspell rječnike u dict/
npm test         # jedinični testovi
npm run build    # stvara dist/chrome i dist/firefox
```
`npm run pack` dodatno stvara `.zip` arhive.

## Licencija
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Pogledajte [LICENSE](LICENSE). Uključeni rječnici zadržavaju vlastite licencije ([dict/LICENSES.md](dict/LICENSES.md)).

## Podrška
Ako vam je ERATA korisna, možete podržati njezin razvoj: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
