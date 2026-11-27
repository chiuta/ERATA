[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · **Slovenčina** · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — offline korektor pre prehliadač

Verzia: 0.4.0 · Posledná aktualizácia: 27. novembra 2026

ERATA je rozšírenie prehliadača, ktoré kontroluje pravopis, gramatiku, interpunkciu a typografiu **výlučne na vašom zariadení**. Žiadny účet, žiadny server, žiadna telemetria: váš text nikdy neopustí váš počítač. Je napísaná metódou clean-room (pozri [CLEANROOM.md](CLEANROOM.md)) a vydaná pod licenciou MIT.

## Funkcie
- Funguje v poliach `textarea`, `input` a `contenteditable`, vrátane rozšírených editorov. Podčiarknutia sa kreslia v samostatnej vrstve a **nikdy nemenia DOM stránky**.
- **Rozpoznávanie jazyka po odsekoch**, takže pasáže v cudzom jazyku nespúšťajú falošné poplachy.
- **Dôkladná podpora rumunčiny:** ș/ț s čiarkou pod písmenom namiesto cedilly, „să/sa“, „într-un“, „între 5 și 10“, čiarky pred „dar/însă“, názvy mesiacov malými písmenami, pleonazmy, klitiká a ďalšie.
- **Obnova diakritiky** (ro, fr, es, pt), uplatňovaná len tam, kde je oprava jednoznačná.
- Prístupné značky: typy chýb sa líšia tvarom čiary (vlnovka, plná, čiarkovaná, bodkovaná), nielen farbou.
- Osobný slovník, vlastné pravidlá s regulárnymi výrazmi, prepínač pre jednotlivé weby, import a export nastavení, import ľubovoľného slovníka Hunspell.
- Stránka Text Studio, „Opraviť všetko“, skóre čitateľnosti, dve štylistické kontroly (veľmi dlhé vety, blízke opakovania).
- Voliteľné prepisovanie pomocou **lokálneho** modelu (koncový bod kompatibilný s OpenAI, len na `localhost`), predvolene vypnuté.
- Rozhranie v 25 jazykoch: rumunčine, angličtine, francúzštine, taliančine, španielčine, portugalčine, nemčine, maďarčine, ako aj v ďalších jazykoch národnostných menšín Rumunska (ukrajinčine, turečtine, krymskej tatárčine, ruštine, srbčine, slovenčine, bulharčine, chorvátčine, gréčtine, jidiš, češtine, poľštine, arménčine, rusínčine, albánčine, macedónčine, rómčine). Jazyk rozhrania nezávisí od jazyka kontrolovaného textu.

Skratky: `Alt+Shift+F` opraví všetko v aktívnom poli, `Alt+Shift+E` zapne alebo vypne ERATA na aktuálnom webe. Klávesnica: Alt+Shift+medzerník návrhy · Alt+Shift+M ponuka · Esc zavrieť.

## Podporované jazyky — čo tam naozaj je
| Jazyk | Pravopis | Pravidlá |
|---|---|---|
| Rumunčina (ro) | vstavaný slovník | samostatná sada pravidiel, najpodrobnejšia |
| Angličtina (en-US, en-GB) | vstavané slovníky | samostatná sada pravidiel (malá) |
| Francúzština (fr) | vstavaný slovník | samostatná sada pravidiel (malá), medzery a diakritika |
| Španielčina (es) | vstavaný slovník | samostatná sada pravidiel (malá), obrátené znamienka a diakritika |
| Portugalčina (pt) | vstavaný slovník | samostatná sada pravidiel (malá) |
| Nemčina (de) | **nie je súčasťou balíka** (licencovanie GPL); importujte vlastný slovník Hunspell | minimálna sada pravidiel |
| Taliančina (it) | **nie je súčasťou balíka** (licencovanie GPL); importujte vlastný slovník Hunspell | minimálna sada pravidiel |
| Maďarčina (hu) | **žiadny vo verzii 0.4.0** | **žiadne**: preložené je iba rozhranie; kontrola pravopisu pre maďarčinu zatiaľ neexistuje |

Importovať možno aj ľubovoľný iný slovník Hunspell (nl, …), ale detektor jazyka pozná len vyššie uvedené jazyky.

## Preklady
Rozhranie, tento README a prezentačná stránka existujú v 25 jazykoch. Osem z nich (ro, en, fr, it, es, pt, de, hu) sú základné jazyky projektu; ďalších sedemnásť pribudlo vo verzii 0.4.0. **Strojový preklad, ktorý ešte neskontroloval rodený hovorca. Opravy sú vítané: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Najnižšia istota: rusínčina, rómčina, krymská tatárčina a jidiš. Preklad rozhrania nepridáva kontrolu pravopisu pre daný jazyk: čo sa naozaj kontroluje, vidno v tabuľke vyššie.

## Súkromie
Všetka kontrola prebieha vo vnútri rozšírenia. Neexistuje žiadny server ERATA, účet, telemetria ani analytika a rozšírenie nežiada o povolenie na prístup k sieti. Jedinou výnimkou je voliteľné lokálne prepisovanie, predvolene vypnuté, ktoré môže odoslať jednu vetu na koncový bod na `localhost`/`127.0.0.1`, ktorý si sami zvolíte. Nastavenia, osobný slovník a importované slovníky zostávajú v `storage.local` a IndexedDB na vašom zariadení. Polia s heslami, e-mailovými adresami a číslami kariet, ako aj polia označené `data-erata="off"`, sa ignorujú. Podrobnosti: [PRIVACY.md](PRIVACY.md).

## Inštalácia
Zatiaľ sa ERATA zostavuje zo zdrojového kódu.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** otvorte `chrome://extensions`, zapnite „Režim pre vývojárov“, zvoľte „Načítať rozbalené“ a vyberte `dist/chrome`.
- **Firefox:** otvorte `about:debugging`, zvoľte „Načítať dočasný doplnok“ a vyberte `dist/firefox/manifest.json`.
- **Safari (cez Xcode, len macOS):** `xcrun safari-web-extension-converter dist/chrome`, potom zostavte a spustite vygenerovaný projekt Xcode. Zostavenie pre Safari autor **netestoval**; pozri [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA neobsahuje ani neodvodzuje nič z kódu, pravidiel (XML/Java), dát ani textov hlásení programu LanguageTool či akéhokoľvek iného korektora. Parser Hunspell, pravidlá, detektor jazyka a algoritmy návrhov boli napísané od nuly na základe verejných opisov formátov a všeobecných znalostí gramatiky a typografie. Vstavané slovníky sú nezávislé projekty Hunspell s vlastnými licenciami ([dict/LICENSES.md](dict/LICENSES.md)). Celá metóda: [CLEANROOM.md](CLEANROOM.md).

## Porovnanie s alternatívami (stručne a úprimne)
Úplný opis so zdrojmi a výhradami: [docs/COMPARISON.md](docs/COMPARISON.md). Údaje o konkurentoch boli zozbierané z verejných stránok 2026-11-18; všetko, čo je tam označené ako *neoverené*, nie je potvrdené.

- **LanguageTool, Grammarly, Microsoft Editor:** oveľa širšie pokrytie gramatiky vo veľkých jazykoch (LanguageTool uvádza počty pravidiel v tisíckach pre angličtinu, francúzštinu, nemčinu, španielčinu a portugalčinu), k tomu funkcie na zlepšenie jasnosti a prepisovanie, Google Docs a mobilné zariadenia. Text štandardne odosielajú do cloudov svojich výrobcov. ERATA nie.
- **Harper:** tiež plne lokálny a veľmi aktívny, ale len pre angličtinu.
- **Natívna kontrola pravopisu v prehliadači:** v základnom režime lokálna, len pravopis, bez gramatiky.
- **Vale a LTeX+:** nástroje pre vývojárov, určené pre editory a príkazový riadok, nie rozšírenia prehliadača.
- **Kde je ERATA užitočná:** lokálne rozšírenie prehliadača, ktoré spája kontrolu pravopisu a cielené pravidlá pre rumunčinu, francúzštinu, španielčinu, portugalčinu a angličtinu, s obnovou diakritiky, vlastnými pravidlami a importovanými slovníkmi. Pri rumunčine nájdené zdroje naznačujú, že existujúce riešenia sú pomerne skromné (v Microsoft Editore len pravopis; LanguageTool označuje rumunčinu ako neaktívnu); odráža to verejné vyhlásenia, nie porovnávací test.
- **Kde ERATA zaostáva:** má spolu rádovo sto ručne napísaných kontrol (hrubý odhad, bez auditu). Zatiaľ neexistuje meranie presnosti a úplnosti na korpuse. Maďarčina nie je pokrytá, kým Microsoft Editor ju pokrýva a Grammarly ju uvádza v beta verzii (hĺbka neoverená).

## Známe obmedzenia
- Výrazne menej gramatických pravidiel než dlhodobo zavedené kontroly; žiadna štatistická vrstva pre chyby v existujúcich slovách.
- Žiadne Google Docs (editor na plátne), žiadna mobilná verzia, žiadna integrácia s desktopovými aplikáciami ani textovými procesormi.
- Automatizované testy v prehliadači bežia len v Chromiu. Firefox prechádza príkazom `web-ext lint`, ale tu nebol spustený v prehliadači. Safari nie je testovaný.
- Žiadna kontrola pravopisu pre maďarčinu; žiadny vstavaný slovník pre nemčinu a taliančinu.
- Žiadny nezávislý audit prístupnosti.
- Projekt je nový (prvé vydania z 18. novembra 2026): zatiaľ nemá používateľskú základňu ani históriu.

## Vývoj
Vyžaduje Node.js >= 24.
```bash
npm i            # nainštaluje závislosti
npm run dicts    # skopíruje slovníky Hunspell do dict/
npm test         # jednotkové testy
npm run build    # vytvorí dist/chrome a dist/firefox
```
`npm run pack` navyše vytvorí archívy `.zip`.

## Licencia
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Pozri [LICENSE](LICENSE). Vstavané slovníky si ponechávajú vlastné licencie ([dict/LICENSES.md](dict/LICENSES.md)).

## Podpora
Ak je vám ERATA užitočná, môžete podporiť jej vývoj: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
