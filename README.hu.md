[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · **Magyar** · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — offline helyesírás- és nyelvhelyesség-ellenőrző böngészőhöz

Verzió: 0.4.1 · Utolsó frissítés: 2026. november 28.

Az ERATA egy böngészőbővítmény, amely a helyesírást, a nyelvtant, az írásjelezést és a tipográfiát **teljes egészében az Ön eszközén** ellenőrzi. Nincs fiók, nincs szerver, nincs telemetria: a szövege soha nem hagyja el a számítógépét. „Clean-room” módszerrel készült (lásd: [CLEANROOM.md](CLEANROOM.md)), és MIT licenc alatt érhető el.

> **Fontos, őszinte megjegyzés:** a 0.4.1 verzióban a magyar nyelvből csak a **felület** van lefordítva. **Magyar helyesírás-ellenőrzés még nincs**: nincs magyar szótár és nincsenek magyar szabályok. Magyar szöveget az ERATA egyelőre nem javít.

## Funkciók
- Működik `textarea`, `input` és `contenteditable` mezőkben, a gazdag szövegszerkesztőkben is. Az aláhúzásokat külön réteg rajzolja, és **soha nem módosítják az oldal DOM-ját**.
- **Nyelvfelismerés bekezdésenként**: az idegen nyelvű részek nem okoznak téves riasztást.
- **Részletes román támogatás**: ș/ț vesszővel cedilla helyett, „să/sa”, „într-un”, „între 5 și 10”, vessző a „dar/însă” előtt, kisbetűs hónapnevek, pleonazmusok, klitikumok és egyebek.
- **Diakritikus jelek visszaállítása** (ro, fr, es, pt), csak ott, ahol a javítás egyértelmű.
- Akadálymentes jelölések: a hibatípusok a vonal alakjában is különböznek (hullámos, folytonos, szaggatott, pontozott), nem csak a színben.
- Személyes szótár, saját szabályok (regex), webhelyenkénti kapcsoló, beállítások importja és exportja, tetszőleges Hunspell-szótár importálása.
- Szövegstúdió oldal, „Mindent javít”, olvashatósági mutató, két stílusellenőrzés (nagyon hosszú mondatok, közeli ismétlések).
- Opcionális átfogalmazás **helyi** modellel (OpenAI-kompatibilis végpont, kizárólag `localhost` címen), alapértelmezés szerint kikapcsolva.
- A felület 25 nyelvű: román, angol, francia, olasz, spanyol, portugál, német, magyar, valamint Románia többi nemzeti kisebbségi nyelve (ukrán, török, krími tatár, orosz, szerb, szlovák, bolgár, horvát, görög, jiddis, cseh, lengyel, örmény, ruszin, albán, macedón, romani). A felület nyelve független az ellenőrzött nyelvtől.

Billentyűparancsok: az `Alt+Shift+F` mindent kijavít az aktív mezőben, az `Alt+Shift+E` az aktuális webhelyen be- vagy kikapcsolja az ERATA-t. Billentyűzet: Alt+Shift+Szóköz javaslatok · Alt+Shift+M menü · Esc bezárás.

## Támogatott nyelvek — ami valóban megvan
| Nyelv | Helyesírás | Szabályok |
|---|---|---|
| Román (ro) | beépített szótár | saját szabálycsomag, a legkidolgozottabb |
| Angol (en-US, en-GB) | beépített szótárak | saját szabálycsomag (kicsi) |
| Francia (fr) | beépített szótár | saját szabálycsomag (kicsi), szóközök és diakritikus jelek |
| Spanyol (es) | beépített szótár | saját szabálycsomag (kicsi), fordított írásjelek és diakritikus jelek |
| Portugál (pt) | beépített szótár | saját szabálycsomag (kicsi) |
| Német (de) | **nincs beépítve** (GPL-licencek miatt); saját Hunspell-szótár importálható | minimális szabálycsomag |
| Olasz (it) | **nincs beépítve** (GPL-licencek miatt); saját Hunspell-szótár importálható | minimális szabálycsomag |
| Magyar (hu) | **nincs a 0.4.1-ban** | **nincs**: csak a felület van lefordítva; magyar helyesírás-ellenőrzés még nincs |

Bármely más Hunspell-szótár (nl, …) importálható, de a nyelvfelismerő csak a fent felsorolt nyelveket ismeri.

## Fordítások
A felület, ez a README és a bemutatóoldal 25 nyelven érhető el. Közülük nyolc (ro, en, fr, it, es, pt, de, hu) a projekt alapnyelve; a másik tizenhét a 0.4.1-ban került hozzá. **Csak a 17 új nyelv gépi fordítás, amelyet anyanyelvi beszélő még nem ellenőrzött. A javításokat szívesen fogadjuk: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Legkisebb a megbízhatóság: ruszin, romani, krími tatár és jiddis. A felület lefordítása nem ad helyesírás-ellenőrzést az adott nyelvhez: hogy az ERATA valójában mit ellenőriz, azt a fenti táblázat mutatja.

## Adatvédelem
Az ellenőrzés teljes egészében a bővítményen belül zajlik. Nincs ERATA-szerver, fiók, telemetria vagy analitika, és a bővítmény nem kér hálózati engedélyt. Az egyetlen kivétel az opcionális, alapból kikapcsolt helyi átfogalmazás, amely egy mondatot küldhet az Ön által választott `localhost`/`127.0.0.1` végpontra. A beállítások, a személyes szótár és az importált szótárak a `storage.local` és az IndexedDB tárolóban maradnak, az Ön eszközén. A jelszó-, e-mail- és bankkártyamezőket, valamint a `data-erata="off"` jelölésű mezőket a bővítmény figyelmen kívül hagyja. Részletek: [PRIVACY.md](PRIVACY.md).

## Telepítés
Egyelőre az ERATA-t forrásból kell lefordítani.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** nyissa meg a `chrome://extensions` oldalt, kapcsolja be a fejlesztői módot, válassza a „Kicsomagolt bővítmény betöltése” lehetőséget, és jelölje ki a `dist/chrome` mappát.
- **Firefox:** nyissa meg az `about:debugging` oldalt, válassza az „Ideiglenes kiegészítő betöltése” lehetőséget, és jelölje ki a `dist/firefox/manifest.json` fájlt.
- **Safari (Xcode-on keresztül, csak macOS):** `xcrun safari-web-extension-converter dist/chrome`, majd fordítsa le és futtassa a létrehozott Xcode-projektet. A Safari-változatot a szerző **nem tesztelte**; lásd: [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
Az ERATA semmit sem tartalmaz és semmit sem származtat a LanguageTool vagy bármely más ellenőrző kódjából, szabályaiból (XML/Java), adataiból vagy üzenetszövegeiből. A Hunspell-elemző, a szabályok, a nyelvfelismerő és a javaslatalgoritmusok a nulláról készültek, nyilvános formátumleírások, valamint a nyelvtanról és a tipográfiáról szerzett általános ismeretek alapján. A mellékelt szótárak független Hunspell-projektek, saját licenccel ([dict/LICENSES.md](dict/LICENSES.md)). A teljes módszertan: [CLEANROOM.md](CLEANROOM.md).

## Összehasonlítás az alternatívákkal (röviden és őszintén)
A teljes változat forrásokkal és fenntartásokkal: [docs/COMPARISON.md](docs/COMPARISON.md). A versenytársakra vonatkozó adatok 2026-11-18-án elért nyilvános oldalakról származnak; ami ott *nem ellenőrzött* jelölést kapott, az nem megerősített.

- **LanguageTool, Grammarly, Microsoft Editor:** a nagy nyelveken jóval szélesebb nyelvtani lefedettség (a LanguageTool angolra, franciára, németre, spanyolra és portugálra több ezres szabályszámot közöl), emellett érthetőséget javító és átfogalmazó funkciók, Google Docs és mobil támogatás. Alapértelmezés szerint a szolgáltató szervereire küldik a szöveget. Az ERATA nem.
- **Harper:** szintén teljesen helyi és nagyon aktív, de csak angolra.
- **A böngésző beépített helyesírás-ellenőrzője:** alap módban helyi, csak helyesírást ellenőriz, nyelvtant nem.
- **Vale és LTeX+:** fejlesztőknek szóló eszközök (szerkesztők, parancssor), nem böngészőbővítmények.
- **Hol hasznos az ERATA:** helyi bővítmény, amely a helyesírás-ellenőrzést célzott szabályokkal ötvözi románra, franciára, spanyolra, portugálra és angolra, diakritikus jelek visszaállításával, saját szabályokkal és importált szótárakkal. A románnál a talált források szerint a bevett megoldások viszonylag gyengék (Microsoft Editor: csak helyesírás; a LanguageTool a románt inaktívnak jelöli); ez nyilvános állításokon alapul, nem összehasonlító teszten.
- **Hol marad alul:** az ERATA-ban összesen nagyjából száz kézzel írt ellenőrzés van (durva, nem auditált becslés). Korpuszon mért pontosság- és fedettségi adat még nincs. A magyar nincs lefedve, miközben a Microsoft Editor lefedi, a Grammarly pedig bétaként felsorolja (mélysége nem ellenőrzött).

## Ismert korlátok
- Jóval kevesebb nyelvtani szabály, mint a hosszú ideje fejlesztett ellenőrzőkben; nincs statisztikai réteg a létező szavakkal elkövetett hibákra.
- Nincs Google Docs (vászonalapú szerkesztő), nincs mobil, nincs asztali vagy szövegszerkesztő-integráció.
- Az automatikus tesztek csak Chromiumon futnak. A Firefox átmegy a `web-ext lint` ellenőrzésen, de itt böngészőben nem futtattuk. A Safari nincs tesztelve.
- Nincs magyar helyesírás-ellenőrzés; nincs beépített német vagy olasz szótár.
- Nincs független akadálymentességi audit.
- A projekt új (az első kiadások 2026. november 18-i keltezésűek): még nincs felhasználói bázis és előzmény.

## Fejlesztés
Node.js >= 24 szükséges.
```bash
npm i            # függőségek telepítése
npm run dicts    # a Hunspell-szótárak másolása a dict/ mappába
npm test         # egységtesztek
npm run build    # létrehozza a dist/chrome és dist/firefox mappát
```
Az `npm run pack` ezen felül `.zip` csomagokat is készít.

## Licenc
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Lásd: [LICENSE](LICENSE). A mellékelt szótárak megtartják saját licencüket ([dict/LICENSES.md](dict/LICENSES.md)).

## Támogatás
Ha az ERATA hasznos az Ön számára, támogathatja a fejlesztését: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
