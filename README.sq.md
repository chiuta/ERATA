[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · **Shqip** · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — korrektues pa internet për shfletuesin

Versioni: 0.4.1 · Përditësuar së fundi: 28 nëntor 2026

ERATA është një shtesë shfletuesi që kontrollon drejtshkrimin, gramatikën, pikësimin dhe tipografinë **tërësisht në pajisjen tuaj**. Nuk ka llogari, server apo telemetri: teksti juaj nuk e lë kurrë kompjuterin tuaj. Është shkruar sipas metodës clean-room (shih [CLEANROOM.md](CLEANROOM.md)) dhe publikohet nën licencën MIT.

## Veçoritë
- Funksionon në fushat `textarea`, `input` dhe `contenteditable`, përfshirë redaktuesit me tekst të pasuruar. Nënvizimet vizatohen në një shtresë të veçantë dhe **nuk e ndryshojnë kurrë DOM-in e faqes**.
- **Zbulim i gjuhës për çdo paragraf**, kështu që pjesët në gjuhë të huaj nuk shkaktojnë alarme të rreme.
- **Mbështetje e thellë për rumanishten:** ș/ț me presje poshtë në vend të cedilës, «să/sa», «într-un», «între 5 și 10», presje para «dar/însă», emrat e muajve me shkronja të vogla, pleonazma, klitika etj.
- **Rikthim i shenjave diakritike** (ro, fr, es, pt), i aplikuar vetëm aty ku korrigjimi është i qartë.
- Shënues të qasshëm: llojet e gabimeve dallohen edhe nga forma e vijës (e valëzuar, e plotë, me viza, me pika), jo vetëm nga ngjyra.
- Fjalor personal, rregulla të veta regex, çelës për çdo sajt, importim/eksportim i cilësimeve, importim i çdo fjalori Hunspell.
- Faqja Studio e tekstit, «Korrigjo të gjitha», tregues lexueshmërie, dy kontrolle stili (fjali shumë të gjata, përsëritje të afërta).
- Rishkrim opsional përmes një modeli **lokal** (pikë fundore e përputhshme me OpenAI, vetëm në `localhost`), i çaktivizuar si parazgjedhje.
- Ndërfaqe në 25 gjuhë: rumanisht, anglisht, frëngjisht, italisht, spanjisht, portugalisht, gjermanisht, hungarisht, si dhe gjuhët e tjera të pakicave kombëtare të Rumanisë (ukrainisht, turqisht, tatarishte e Krimesë, rusisht, serbisht, sllovakisht, bullgarisht, kroatisht, greqisht, jidish, çekisht, polonisht, armenisht, rusinisht, shqip, maqedonisht, romani). Gjuha e ndërfaqes është e pavarur nga gjuha që kontrollohet.

Shkurtore: `Alt+Shift+F` korrigjon gjithçka në fushën aktive, `Alt+Shift+E` aktivizon ose çaktivizon ERATA në sajtin aktual. Tastiera: Alt+Shift+Hapësirë sugjerime · Alt+Shift+M meny · Esc mbyll.

## Gjuhët e mbështetura — çfarë ka realisht
| Gjuha | Drejtshkrimi | Rregullat |
|---|---|---|
| Rumanisht (ro) | fjalor i përfshirë | paketë rregullash e dedikuar, më e thella |
| Anglisht (en-US, en-GB) | fjalorë të përfshirë | paketë rregullash e dedikuar (e vogël) |
| Frëngjisht (fr) | fjalor i përfshirë | paketë rregullash e dedikuar (e vogël), hapësira dhe shenja diakritike |
| Spanjisht (es) | fjalor i përfshirë | paketë rregullash e dedikuar (e vogël), shenja të përmbysura dhe shenja diakritike |
| Portugalisht (pt) | fjalor i përfshirë | paketë rregullash e dedikuar (e vogël) |
| Gjermanisht (de) | **nuk përfshihet** (licencim GPL); importoni fjalorin tuaj Hunspell | paketë minimale rregullash |
| Italisht (it) | **nuk përfshihet** (licencim GPL); importoni fjalorin tuaj Hunspell | paketë minimale rregullash |
| Hungarisht (hu) | **asnjë në 0.4.1** | **asnjë**: vetëm ndërfaqja është e përkthyer; për hungarishten ende nuk ka kontroll drejtshkrimi |

Çdo fjalor tjetër Hunspell (nl, …) mund të importohet, por zbuluesi i gjuhës i njeh vetëm gjuhët e mësipërme.

## Përkthime
Ndërfaqja, ky README dhe faqja e prezantimit ekzistojnë në 25 gjuhë. Tetë prej tyre (ro, en, fr, it, es, pt, de, hu) janë gjuhët bazë të projektit; shtatëmbëdhjetë të tjerat u shtuan në 0.4.1. **Përkthim automatik, ende i pashqyrtuar nga një folës amtar. Korrigjimet mirëpriten: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Besueshmëria më e ulët: rusinisht, romani, tatarishte e Krimesë dhe jidish. Përkthimi i ndërfaqes nuk shton kontroll drejtshkrimi për atë gjuhë: shihni tabelën më sipër për atë që kontrollohet realisht.

## Privatësia
I gjithë kontrolli bëhet brenda shtesës. Nuk ka server ERATA, llogari, telemetri apo analitikë, dhe shtesa nuk kërkon leje rrjeti. I vetmi përjashtim është rishkrimi lokal opsional, i çaktivizuar si parazgjedhje, i cili mund të dërgojë një fjali te një pikë fundore në `localhost`/`127.0.0.1` që e zgjidhni ju. Cilësimet, fjalori personal dhe fjalorët e importuar mbeten në `storage.local` dhe IndexedDB në pajisjen tuaj. Fushat e fjalëkalimit, të e-mailit dhe të kartës, si dhe fushat e shënuara me `data-erata="off"`, shpërfillen. Detaje: [PRIVACY.md](PRIVACY.md).

## Instalimi
Për momentin ERATA ndërtohet nga kodi burimor.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** hapni `chrome://extensions`, aktivizoni modalitetin e zhvilluesit (Developer mode), zgjidhni «Ngarko të pambështjellë» (“Load unpacked”) dhe përzgjidhni `dist/chrome`.
- **Firefox:** hapni `about:debugging`, zgjidhni «Ngarko shtesë të përkohshme» (“Load Temporary Add-on”) dhe përzgjidhni `dist/firefox/manifest.json`.
- **Safari (përmes Xcode, vetëm macOS):** `xcrun safari-web-extension-converter dist/chrome`, pastaj ndërtoni dhe nisni projektin Xcode të gjeneruar. Versioni për Safari **nuk është testuar** nga autori; shih [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA nuk përmban dhe nuk buron nga asgjë e kodit, rregullave (XML/Java), të dhënave apo teksteve të mesazheve të LanguageTool ose të ndonjë korrektuesi tjetër. Analizuesi i Hunspell, rregullat, zbuluesi i gjuhës dhe algoritmet e sugjerimeve janë shkruar nga e para, mbi bazën e përshkrimeve publike të formateve dhe të njohurive të përgjithshme për gramatikën e tipografinë. Fjalorët e përfshirë janë projekte të pavarura Hunspell me licencat e tyre ([dict/LICENSES.md](dict/LICENSES.md)). Metoda e plotë: [CLEANROOM.md](CLEANROOM.md).

## Krahasim me alternativat (i shkurtër dhe i ndershëm)
Përshkrimi i plotë me burime dhe rezerva: [docs/COMPARISON.md](docs/COMPARISON.md). Faktet për konkurrentët u mblodhën nga faqe publike më 2026-11-18; çdo gjë e shënuar atje si *e paverifikuar* nuk është konfirmuar.

- **LanguageTool, Grammarly, Microsoft Editor:** mbulim gramatikor shumë më i gjerë në gjuhët e mëdha (LanguageTool publikon numra rregullash në mijëra për anglishten, frëngjishten, gjermanishten, spanjishten dhe portugalishten), plus veçori qartësie dhe rishkrimi, Google Docs dhe celular. Si parazgjedhje ata e dërgojnë tekstin në retë e ofruesve. ERATA jo.
- **Harper:** gjithashtu plotësisht lokal dhe shumë aktiv në zhvillim, por vetëm për anglishten.
- **Kontrolli i drejtshkrimit i shfletuesit:** lokal në modalitetin bazë, vetëm drejtshkrim, pa gramatikë.
- **Vale dhe LTeX+:** vegla zhvillimi për redaktues dhe për rreshtin e komandave, jo shtesa shfletuesi.
- **Ku është e dobishme ERATA:** një shtesë lokale shfletuesi që kombinon drejtshkrimin dhe rregulla të synuara për rumanishten, frëngjishten, spanjishten, portugalishten dhe anglishten, me rikthim të shenjave diakritike, rregulla të veta dhe fjalorë të importuar. Për rumanishten, burimet e gjetura sugjerojnë se zgjidhjet ekzistuese janë relativisht të varfra (vetëm drejtshkrim te Microsoft Editor; LanguageTool e shënon rumanishten si joaktive); kjo pasqyron deklarata publike, jo një matje krahasuese.
- **Ku humbet:** ERATA ka gjithsej rreth njëqind kontrolle të shkruara me dorë (numërim i përafërt, jo i audituar). Ende nuk ka matje të precizionit dhe recall mbi një korpus. Hungarishtja nuk mbulohet, ndërsa Microsoft Editor e mbulon dhe Grammarly e liston në beta (thellësia e paverifikuar).

## Kufizime të njohura
- Shumë më pak rregulla gramatike se korrektuesit e vendosur prej kohësh; nuk ka shtresë statistikore për gabimet me fjalë të vlefshme.
- Pa Google Docs (redaktues canvas), pa celular, pa integrim me desktopin apo me përpunuesit e tekstit.
- Testet automatike të shfletuesit ekzekutohen vetëm në Chromium. Firefox kalon `web-ext lint`, por këtu nuk është provuar në shfletues. Safari nuk është testuar.
- Pa kontroll drejtshkrimi për hungarishten; pa fjalor të përfshirë për gjermanishten apo italishten.
- Pa auditim të pavarur të qasshmërisë.
- Projekti është i ri (versionet e para janë datuar më 18 nëntor 2026): ende pa bazë përdoruesish dhe pa histori të provuar.

## Zhvillimi
Kërkon Node.js >= 24.
```bash
npm i            # instalon varësitë
npm run dicts    # kopjon fjalorët Hunspell te dict/
npm test         # teste njësi
npm run build    # krijon dist/chrome dhe dist/firefox
```
`npm run pack` krijon përveç kësaj arkiva `.zip`.

## Licenca
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Shih [LICENSE](LICENSE). Fjalorët e përfshirë mbajnë licencat e tyre ([dict/LICENSES.md](dict/LICENSES.md)).

## Mbështetja
Nëse ERATA ju është e dobishme, mund ta mbështetni zhvillimin e saj: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
