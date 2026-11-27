[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · **Qırımtatarca** · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — brauzer içün oflayn yazı tekşericisi

Versiya: 0.4.0 · Soñki yañartuv: 27 noyabr 2026

ERATA — imlâni, grammatikanı, punktuatsiyanı ve tipografiyanı **tamamen cihazıñızda** tekşergen brauzer keñeytmesidir. Hesap, server ve telemetriya yoq: metniñiz kompyuteriñizden asla çıqmaz. ERATA sıfırdan, clean-room usulında yazılğandır ([CLEANROOM.md](CLEANROOM.md) faylına baqıñız) ve MIT litsenziyasınen neşir etilgen.

## İmkânlar
- `textarea`, `input` ve `contenteditable` sahalarında, zengin redaktorlarda da, işler. Astı çizgiler ayrı bir qatlamda çizilir ve **saifeniñ DOM'unı asla deñiştirmez**.
- **Er abzats içün tilni añıqlav**; şuña körä başqa tildeki parçalar yañlış alarmlarğa sebep olmaz.
- **Rumın tili içün çuqur destek:** cedilla yerine astında virgüllü ș/ț, «să/sa», «într-un», «între 5 și 10», «dar/însă» aldında virgül, kiçik ariflernen yazılğan ay adları, pleonazmlar, klitikler ve digerleri.
- **Diakritik işaretlerniñ restavratsiyası** (ro, fr, es, pt), yalıñız tüzetüv bir manalı olğan yerlerde qullanılır.
- Erişilebilir işaretler: hata türleri yalıñız renknen degil, sızıq şeklinen de (dalğalı, tutaş, kesik, noqtalı) farq etilir.
- Şahsiy luğat, kendi regex qaideleriñiz, er sayt içün ayrı açmaq/qapatmaq imkânı, ayarlarnı import ve eksport etmek, istegen Hunspell luğatını import etmek.
- Text Studio saifesi, «Hepsini tüzet», oqulışlılıq balı, eki üslüp tekşerüvi (pek uzun cümleler, yaqın tekrarlar).
- İhtiyariy qayta yazuv: **mahalliy** modelnen (OpenAI API'sine uyğun endpoint, yalıñız `localhost` üzerinde), ilkin ayarında qapalı.
- İnterfeys 25 tilde: rumınca, inglizce, fransuzca, italyanca, ispanca, portugalca, almanca, macarca ve Rumıniyadaki diger milliy azlıq tilleri (ukrainaca, türkçe, qırımtatarca, rusça, sırpça, slovakça, bulğarca, hırvatça, yunanca, yidiş, çehçe, lehçe, ermenice, rusin tili, arnavutça, makedonca, romani tili). İnterfeys tili tekşerilgen tilge bağlı degil.

Qısqa tuşlar: `Alt+Shift+F` aktiv sahadaki er şeyni tüzetir, `Alt+Shift+E` ERATA'nı şimdiki saytta açar yaki qapatır. Klaviatura: Alt+Shift+Boşluq teklifler · Alt+Shift+M menü · Esc qapat.

## Desteklengen tiller — aqiqatta neler bar
| Til | İmlâ | Qaideler |
|---|---|---|
| Rumın tili (ro) | birge berilgen luğat | ayrı qaide paketi, eñ çuqur olğanı |
| İnglis tili (en-US, en-GB) | birge berilgen luğatlar | ayrı qaide paketi (kiçik) |
| Fransuz tili (fr) | birge berilgen luğat | ayrı qaide paketi (kiçik), boşluqlar ve diakritik işaretler |
| İspan tili (es) | birge berilgen luğat | ayrı qaide paketi (kiçik), tersine çevrilgen sual ve nida işaretleri ile diakritik işaretler |
| Portugal tili (pt) | birge berilgen luğat | ayrı qaide paketi (kiçik) |
| Alman tili (de) | **birge berilmegen** (GPL litsenziyası sebebinden); öz Hunspell luğatıñıznı import etiñiz | minimal qaide paketi |
| İtalyan tili (it) | **birge berilmegen** (GPL litsenziyası sebebinden); öz Hunspell luğatıñıznı import etiñiz | minimal qaide paketi |
| Macar tili (hu) | **0.4.0 versiyasında yoq** | **yoq**: yalıñız interfeys tercime etilgen; macar tili içün imlâ tekşerüvi daa yoq |

Başqa er bir Hunspell luğatını (nl, …) da import etmek mümkün, amma til añıqlayıcı yalıñız yuqarıdaki tillerni biler.

## Tercimeler
İnterfeys, bu README ve tanıştırma saifesi 25 tilde bar. Olarnıñ sekizi (ro, en, fr, it, es, pt, de, hu) proyektniñ asıl tilleridir; qalğan on yedisi 0.4.0 versiyasında ilâve etildi. **Maşina tercimesi, ana tilini soylegen kişi tarafından daa tekşerilmegen. Tüzetmeler memnuniyetnen qabul etilir: https://github.com/chiuta/ERATA/issues** (*Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues*) Eñ aşağı añıqlıq: rusin tili, romani tili, qırımtatarca ve yidiş. İnterfeysniñ tercime etilmesi o til içün imlâ tekşerüvi ilâve etmez: aqiqatta ne tekşerilgenini yuqarıdaki cedvelde baqıñız.

## Mahremiyet
Bütün tekşerüv keñeytmeniñ içinde keçer. ERATA serveri, hesap, telemetriya yaki analitika yoq, keñeytme hiç bir şebeke icazetini de istemez. Tek istisna — ihtiyariy, ilkin ayarında qapalı mahalliy qayta yazuvdır: o, siz saylağan `localhost`/`127.0.0.1` endpoint'ine bir cümle yiberip bile. Ayarlar, şahsiy luğat ve import etilgen luğatlar cihazıñızdaki `storage.local` ve IndexedDB içinde qalır. Parol, e-poçta ve kart sahaları, şeyle de `data-erata="off"` ile işaretlengen sahalar nazarğa alınmaz. Tafsilât: [PRIVACY.md](PRIVACY.md).

## Quruv
Şimdilik ERATA menba kodundan build etilir.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** `chrome://extensions` saifesini açıñız, “Developer mode” rejimini açıñız, “Load unpacked” saylañız ve `dist/chrome` papkasını saylañız.
- **Firefox:** `about:debugging` saifesini açıñız, “Load Temporary Add-on” saylañız ve `dist/firefox/manifest.json` faylını saylañız.
- **Safari (Xcode vastasınen, yalıñız macOS):** `xcrun safari-web-extension-converter dist/chrome`, soñra yaratılğan Xcode proyektini build etip çalıştırıñız. Safari versiyası müellif tarafından **sınalmağan**; baqıñız [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA, LanguageTool'nıñ yaki başqa er bir tekşericiniñ kodundan, qaidelerinden (XML/Java), malümatlarından yaki mesaj metinlerinden hiç bir şeyni özünde saqlamaz ve ondan hiç bir şey almaz. Hunspell parseri, qaideler, til añıqlayıcı ve teklif algoritmaları açıq format tasvirlerinden ve grammatika ile tipografiya haqqında umumiy bilgilerden sıfırdan yazılğandır. Birge berilgen luğatlar öz litsenziyaları olğan müstaqil Hunspell proyektleridir ([dict/LICENSES.md](dict/LICENSES.md)). Tam usul: [CLEANROOM.md](CLEANROOM.md).

## Alternativlernen qıyaslav (qısqa ve samimiy)
Menbalar ve eskertüvlernen tam metin: [docs/COMPARISON.md](docs/COMPARISON.md). Raqiplerge ait malümatlar 18 noyabr 2026 senesinde açıq saifelerden toplanğan; orada *tasdiqlanmağan* dep işaretlengen er şey tasdiq etilmegendir.

- **LanguageTool, Grammarly, Microsoft Editor:** esas tillerde grammatika qaplaması çoq keñ (LanguageTool inglis, fransuz, alman, ispan ve portugal tilleri içün minglerce qaide sanını ilân eter), bundan ğayrı añlaşıqlıq ve qayta yazuv imkânları, Google Docs ve mobil destek. Olar metinni ilkin ayarında satıcılarnıñ bulutlarına yiberirler. ERATA yibermez.
- **Harper:** o da tamamen mahalliy ve pek faal, amma yalıñız inglis tili içün.
- **Brauzerniñ öz imlâ tekşerüvi:** esas rejimde mahalliy, yalıñız imlâ, grammatika yoq.
- **Vale ve LTeX+:** redaktorlar ve komanda satırı içün programmistler aletleri, brauzer keñeytmeleri degil.
- **ERATA nerede faydalı:** rumın, fransuz, ispan, portugal ve inglis tilleri içün imlâ tekşerüvini maqsatlı qaidelernen birleştirgen mahalliy brauzer keñeytmesi; diakritik işaretlerniñ restavratsiyası, kendi qaideler ve import etilgen luğatlar da bar. Rumın tili içün tapılğan menbalar, mevcut çözümlerniñ qıyaslanğanda zayıf olğanını köstere (Microsoft Editor'da yalıñız imlâ; LanguageTool rumın tilini faal degil dep işaretler); bu açıq beyanatlarğa dayanır, ölçüv testine degil.
- **Nerede yeñilir:** ERATA'da cemi qolnen yazılğan yüzge yaqın tekşerüv bar (yaqın sanav, tekşerilmegen). Bir korpusta precision/recall ölçüvi daa yoq. Macar tili qaplanmağan, Microsoft Editor ise onı qaplar, Grammarly onı beta olaraq kösterir (çuqurlığı tasdiqlanmağan).

## Belli sıñırlar
- Köpten berli qullanılğan tekşericilerge nisbeten grammatika qaideleri pek az; mevcut sözlerniñ yañlış qullanıluvı içün statistik qatlam yoq.
- Google Docs yoq (canvas redaktor), mobil yoq, desktop yaki metin redaktorı integratsiyası yoq.
- Avtomatik brauzer testleri yalıñız Chromium'da işler. Firefox `web-ext lint`'ten keçer, amma burada brauzerde çalıştırılmağan. Safari sınalmağan.
- Macar tili içün imlâ tekşerüvi yoq; birge berilgen alman yaki italyan luğatı yoq.
- Müstaqil erişilebilirlik auditi yoq.
- Proyekt yañı (ilk neşirler 18 noyabr 2026 tarihli): daa qullanıcı toplulığı yaki keçmiş tecribe yoq.

## İnkişaf
Node.js >= 24 kerek.
```bash
npm i            # bağlılıqlarnı quray
npm run dicts    # Hunspell lugatlarını dict/ ğa köçürir
npm test         # birim testleri
npm run build    # dist/chrome ve dist/firefox yaratır
```
`npm run pack` ilâveten `.zip` arhivlerini yaratır.

## Litsenziya
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Baqıñız [LICENSE](LICENSE). Birge berilgen luğatlar öz litsenziyalarını saqlar ([dict/LICENSES.md](dict/LICENSES.md)).

## Destek
ERATA sizge faydalı olsa, onıñ inkişafına destek bermek mümkün: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
