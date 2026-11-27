[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · **Čeština** · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — offline korektor pro prohlížeč

Verze: 0.4.1 · Poslední aktualizace: 28. listopadu 2026

ERATA je rozšíření prohlížeče, které kontroluje pravopis, gramatiku, interpunkci a typografii **zcela na vašem zařízení**. Žádný účet, žádný server, žádná telemetrie: váš text nikdy neopustí váš počítač. Vznikla metodou clean-room (viz [CLEANROOM.md](CLEANROOM.md)) a je vydána pod licencí MIT.

## Funkce
- Funguje v polích `textarea`, `input` a `contenteditable`, včetně editorů s formátovaným textem. Podtržení se vykreslují v samostatné vrstvě a **nikdy nemění DOM stránky**.
- **Rozpoznávání jazyka po odstavcích**, takže pasáže v cizím jazyce nevyvolávají falešné poplachy.
- **Hluboká podpora rumunštiny:** ș/ț s čárkou pod písmenem místo cedilly, „să/sa“, „într-un“, „între 5 și 10“, čárky před „dar/însă“, měsíce psané malým písmenem, pleonasmy, klitika a další.
- **Doplňování diakritiky** (ro, fr, es, pt), použité jen tam, kde je oprava jednoznačná.
- Přístupné značky: druhy chyb se liší tvarem čáry (vlnovka, plná, čárkovaná, tečkovaná), nejen barvou.
- Osobní slovník, vlastní pravidla na bázi regulárních výrazů, přepínač pro jednotlivé weby, import a export nastavení, import libovolného slovníku Hunspell.
- Stránka Text Studio, „Opravit vše“, skóre čitelnosti, dvě kontroly stylu (velmi dlouhé věty, blízká opakování).
- Volitelné přepsání pomocí **lokálního** modelu (koncový bod kompatibilní s OpenAI pouze na `localhost`), ve výchozím stavu vypnuté.
- Rozhraní v 25 jazycích: rumunština, angličtina, francouzština, italština, španělština, portugalština, němčina, maďarština a další jazyky národnostních menšin v Rumunsku (ukrajinština, turečtina, krymská tatarština, ruština, srbština, slovenština, bulharština, chorvatština, řečtina, jidiš, čeština, polština, arménština, rusínština, albánština, makedonština, romština). Jazyk rozhraní je nezávislý na kontrolovaném jazyce.

Klávesové zkratky: `Alt+Shift+F` opraví vše v aktivním poli, `Alt+Shift+E` zapne či vypne ERATA na aktuálním webu. Klávesnice: Alt+Shift+Mezerník návrhy · Alt+Shift+M nabídka · Esc zavřít.

## Podporované jazyky — co v ní skutečně je
| Jazyk | Pravopis | Pravidla |
|---|---|---|
| rumunština (ro) | přibalený slovník | vlastní sada pravidel, nejrozsáhlejší |
| angličtina (en-US, en-GB) | přibalené slovníky | vlastní sada pravidel (malá) |
| francouzština (fr) | přibalený slovník | vlastní sada pravidel (malá), mezery a diakritika |
| španělština (es) | přibalený slovník | vlastní sada pravidel (malá), obrácená interpunkční znaménka a diakritika |
| portugalština (pt) | přibalený slovník | vlastní sada pravidel (malá) |
| němčina (de) | **není přibalen** (licence GPL); naimportujte si vlastní slovník Hunspell | minimální sada pravidel |
| italština (it) | **není přibalen** (licence GPL); naimportujte si vlastní slovník Hunspell | minimální sada pravidel |
| maďarština (hu) | **žádný ve verzi 0.4.1** | **žádná**: přeloženo je pouze rozhraní; kontrola pravopisu pro maďarštinu zatím neexistuje |

Libovolný jiný slovník Hunspell (nl, …) lze importovat, ale detektor jazyka zná pouze výše uvedené jazyky.

## Překlady
Rozhraní, tento soubor README i prezentační stránka existují v 25 jazycích. Osm z nich (ro, en, fr, it, es, pt, de, hu) je základními jazyky projektu; dalších sedmnáct přibylo ve verzi 0.4.1. **Strojový překlad, dosud neověřený rodilým mluvčím. Opravy jsou vítány: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Nejméně spolehlivé jsou překlady do rusínštiny, romštiny, krymské tatarštiny a jidiš. Překlad rozhraní nepřidává kontrolu pravopisu pro daný jazyk: co se skutečně kontroluje, ukazuje tabulka výše.

## Soukromí
Veškerá kontrola probíhá uvnitř rozšíření. Neexistuje žádný server ERATA, účet, telemetrie ani analytika a rozšíření nežádá o žádné síťové oprávnění. Jedinou výjimkou je volitelné lokální přepsání, ve výchozím stavu vypnuté, které může odeslat jednu větu na koncový bod na `localhost`/`127.0.0.1`, který si zvolíte. Nastavení, osobní slovník a importované slovníky zůstávají v `storage.local` a v IndexedDB na vašem zařízení. Pole pro hesla, e-maily a platební karty a pole označená `data-erata="off"` se ignorují. Podrobnosti: [PRIVACY.md](PRIVACY.md).

## Instalace
ERATA se zatím sestavuje ze zdrojového kódu.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** otevřete `chrome://extensions`, zapněte režim pro vývojáře, zvolte „Načíst nezabalené rozšíření“ a vyberte `dist/chrome`.
- **Firefox:** otevřete `about:debugging`, zvolte „Načíst dočasný doplněk“ a vyberte `dist/firefox/manifest.json`.
- **Safari (přes Xcode, pouze macOS):** `xcrun safari-web-extension-converter dist/chrome`, poté sestavte a spusťte vygenerovaný projekt Xcode. Sestavení pro Safari autor **netestoval**; viz [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA neobsahuje a neodvozuje nic z kódu, pravidel (XML/Java), dat ani textů hlášení nástroje LanguageTool či jakéhokoli jiného korektoru. Parser Hunspellu, pravidla, detektor jazyka i algoritmy návrhů byly napsány od základu podle veřejných popisů formátů a obecných znalostí gramatiky a typografie. Přibalené slovníky jsou nezávislé projekty Hunspell s vlastními licencemi ([dict/LICENSES.md](dict/LICENSES.md)). Úplný postup: [CLEANROOM.md](CLEANROOM.md).

## Srovnání s alternativami (stručně a upřímně)
Úplný rozbor se zdroji a výhradami: [docs/COMPARISON.md](docs/COMPARISON.md). Informace o konkurenci byly shromážděny z veřejných stránek dne 2026-11-18; vše, co je tam označeno *unverified* (neověřeno), není potvrzeno.

- **LanguageTool, Grammarly, Microsoft Editor:** mnohem širší pokrytí gramatiky ve velkých jazycích (LanguageTool uvádí počty pravidel v tisících pro angličtinu, francouzštinu, němčinu, španělštinu a portugalštinu), navíc funkce pro srozumitelnost a přepisování, Google Docs a mobilní zařízení. Ve výchozím stavu posílají text do cloudu poskytovatele. ERATA ne.
- **Harper:** rovněž plně lokální a velmi aktivně vyvíjený, ale pouze pro angličtinu.
- **Nativní kontrola pravopisu v prohlížeči:** v základním režimu lokální, jen pravopis, žádná gramatika.
- **Vale a LTeX+:** nástroje pro vývojáře určené pro editory a příkazový řádek, nikoli rozšíření prohlížeče.
- **Kde je ERATA užitečná:** lokální rozšíření prohlížeče, které spojuje kontrolu pravopisu a cílená pravidla pro rumunštinu, francouzštinu, španělštinu, portugalštinu a angličtinu s doplňováním diakritiky, vlastními pravidly a importovanými slovníky. U rumunštiny nalezené zdroje naznačují, že zavedená konkurence je poměrně slabá (Microsoft Editor kontroluje jen pravopis; LanguageTool označuje rumunštinu jako neaktivní); odráží to veřejná prohlášení, nikoli srovnávací test.
- **Kde prohrává:** ERATA má celkem přibližně sto ručně psaných kontrol (hrubý odhad, nikoli audit). Zatím neexistuje žádné měření přesnosti a úplnosti (precision/recall) na korpusu. Maďarština není pokryta, zatímco Microsoft Editor ji podporuje a Grammarly ji uvádí v betě (hloubka neověřena).

## Známá omezení
- Mnohem méně gramatických pravidel než dlouho zavedené kontrolory; žádná statistická vrstva pro chyby v existujících slovech (real-word errors).
- Žádné Google Docs (editor na plátně), žádné mobilní zařízení, žádná integrace s desktopem ani textovými procesory.
- Automatizované testy v prohlížeči běží pouze v Chromiu. Firefox projde kontrolou `web-ext lint`, ale zde nebyl v prohlížeči spuštěn. Safari je netestováno.
- Žádná kontrola pravopisu pro maďarštinu; žádný přibalený německý ani italský slovník.
- Žádný nezávislý audit přístupnosti.
- Projekt je nový (první vydání z 18. listopadu 2026): zatím žádná uživatelská základna ani historie.

## Vývoj
Vyžaduje Node.js >= 24.
```bash
npm i            # nainstaluje závislosti
npm run dicts    # zkopíruje slovníky Hunspell do dict/
npm test         # jednotkové testy
npm run build    # vytvoří dist/chrome a dist/firefox
```
`npm run pack` navíc vytvoří archivy `.zip`.

## Licence
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Viz [LICENSE](LICENSE). Přibalené slovníky si ponechávají své vlastní licence ([dict/LICENSES.md](dict/LICENSES.md)).

## Podpora
Pokud je vám ERATA užitečná, můžete podpořit její vývoj: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
