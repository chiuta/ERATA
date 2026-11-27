[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · **Türkçe** · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — tarayıcı için çevrimdışı yazım ve dil denetimi

Sürüm: 0.4.0 · Son güncelleme: 27 Kasım 2026

ERATA, yazımı, dil bilgisini, noktalamayı ve tipografiyi **tamamen cihazınızda** denetleyen bir tarayıcı eklentisidir. Hesap, sunucu ya da telemetri yoktur: metniniz bilgisayarınızdan asla çıkmaz. Sıfırdan, clean-room yöntemiyle yazılmıştır ([CLEANROOM.md](CLEANROOM.md) dosyasına bakın) ve MIT lisansıyla yayımlanmıştır.

## Özellikler
- `textarea`, `input` ve `contenteditable` alanlarında, zengin metin düzenleyiciler dahil, çalışır. Altı çizili işaretler ayrı bir katmanda çizilir ve **sayfanın DOM'unu asla değiştirmez**.
- **Paragraf başına dil algılama**; böylece yabancı dildeki bölümler yanlış alarmlara yol açmaz.
- **Derin Rumence desteği:** cedilla yerine virgüllü ș/ț, “să/sa”, “într-un”, “între 5 și 10”, “dar/însă” öncesinde virgül, küçük harfle yazılan aylar, pleonazmlar, klitikler ve daha fazlası.
- **Diyakritik işaretlerin geri getirilmesi** (ro, fr, es, pt); yalnızca düzeltmenin belirsiz olmadığı yerlerde uygulanır.
- Erişilebilir işaretler: hata türleri yalnızca renkle değil, çizgi biçimiyle de (dalgalı, düz, kesikli, noktalı) ayırt edilir.
- Kişisel sözlük, düzenli ifadelere (regex) dayalı özel kurallar, site başına açma/kapama anahtarı, ayarları içe ve dışa aktarma, herhangi bir Hunspell sözlüğünü içe aktarma.
- Text Studio sayfası, “Tümünü düzelt”, okunabilirlik puanı, iki üslup denetimi (çok uzun cümleler, birbirine yakın tekrarlar).
- İsteğe bağlı olarak **yerel** bir model üzerinden yeniden yazma (yalnızca `localhost` üzerindeki OpenAI uyumlu uç nokta); varsayılan olarak kapalıdır.
- 25 dilde arayüz: Rumence, İngilizce, Fransızca, İtalyanca, İspanyolca, Portekizce, Almanca, Macarca ve Romanya'daki diğer ulusal azınlık dilleri (Ukraynaca, Türkçe, Kırım Tatarcası, Rusça, Sırpça, Slovakça, Bulgarca, Hırvatça, Yunanca, Yidiş, Çekçe, Lehçe, Ermenice, Rusin dili, Arnavutça, Makedonca, Romani dili). Arayüz dili, denetlenen dilden bağımsızdır.

Kısayollar: `Alt+Shift+F` etkin alandaki her şeyi düzeltir, `Alt+Shift+E` ERATA'yı geçerli sitede açar veya kapatır. Klavye: Alt+Shift+Boşluk öneriler · Alt+Shift+M menü · Esc kapat.

## Desteklenen diller — gerçekte neler var
| Dil | Yazım denetimi | Kurallar |
|---|---|---|
| Rumence (ro) | yerleşik sözlük | özel kural paketi, en kapsamlısı |
| İngilizce (en-US, en-GB) | yerleşik sözlükler | özel kural paketi (küçük) |
| Fransızca (fr) | yerleşik sözlük | özel kural paketi (küçük), boşluklar ve diyakritik işaretler |
| İspanyolca (es) | yerleşik sözlük | özel kural paketi (küçük), ters çevrilmiş noktalama işaretleri ve diyakritik işaretler |
| Portekizce (pt) | yerleşik sözlük | özel kural paketi (küçük) |
| Almanca (de) | **yerleşik değil** (GPL lisansı nedeniyle); kendi Hunspell sözlüğünüzü içe aktarın | asgari kural paketi |
| İtalyanca (it) | **yerleşik değil** (GPL lisansı nedeniyle); kendi Hunspell sözlüğünüzü içe aktarın | asgari kural paketi |
| Macarca (hu) | **0.4.0 sürümünde yok** | **yok**: yalnızca arayüz çevrilmiştir; Macarca için henüz yazım denetimi yoktur |

Başka herhangi bir Hunspell sözlüğü (nl, …) de içe aktarılabilir, ancak dil algılayıcı yalnızca yukarıdaki dilleri tanır.

## Çeviriler
Arayüz, bu README ve tanıtım sayfası 25 dilde mevcuttur. Bunlardan sekizi (ro, en, fr, it, es, pt, de, hu) projenin çekirdek dilleridir; diğer on yedisi 0.4.0 sürümünde eklenmiştir. **Makine çevirisidir, henüz anadili konuşan biri tarafından gözden geçirilmemiştir. Düzeltmeler memnuniyetle karşılanır: https://github.com/chiuta/ERATA/issues** (*Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues*) En düşük güven: Rusin dili, Romani dili, Kırım Tatarcası ve Yidiş. Arayüzün çevrilmesi o dil için yazım denetimi eklemez: gerçekte nelerin denetlendiği için yukarıdaki tabloya bakın.

## Gizlilik
Tüm denetim eklentinin içinde gerçekleşir. ERATA sunucusu, hesap, telemetri ya da analitik yoktur ve eklenti hiçbir ağ izni istemez. Tek istisna, isteğe bağlı ve varsayılan olarak kapalı olan yerel yeniden yazma özelliğidir; bu özellik, sizin seçtiğiniz bir `localhost`/`127.0.0.1` uç noktasına tek bir cümle gönderebilir. Ayarlar, kişisel sözlük ve içe aktarılan sözlükler cihazınızdaki `storage.local` ve IndexedDB içinde kalır. Parola, e-posta ve kart alanları ile `data-erata="off"` olarak işaretlenmiş alanlar yok sayılır. Ayrıntılar: [PRIVACY.md](PRIVACY.md).

## Kurulum
ERATA şimdilik kaynak koddan derlenmektedir.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** `chrome://extensions` adresini açın, Geliştirici modunu etkinleştirin, “Paketlenmemiş öğe yükle”yi seçin ve `dist/chrome` klasörünü gösterin.
- **Firefox:** `about:debugging` adresini açın, “Geçici Eklenti Yükle”yi seçin ve `dist/firefox/manifest.json` dosyasını gösterin.
- **Safari (Xcode ile, yalnızca macOS):** `xcrun safari-web-extension-converter dist/chrome`, ardından oluşturulan Xcode projesini derleyip çalıştırın. Safari sürümü yazar tarafından **test edilmemiştir**; bkz. [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA, LanguageTool'un ya da başka herhangi bir denetleyicinin kodundan, kurallarından (XML/Java), verilerinden veya ileti metinlerinden hiçbir şey içermez ve hiçbir şey türetmez. Hunspell ayrıştırıcısı, kurallar, dil algılayıcı ve öneri algoritmaları; kamuya açık biçim tanımlarından ve dil bilgisi ile tipografiye ilişkin genel bilgiden yola çıkılarak sıfırdan yazılmıştır. Yerleşik sözlükler, kendi lisanslarına sahip bağımsız Hunspell projeleridir ([dict/LICENSES.md](dict/LICENSES.md)). Yöntemin tamamı: [CLEANROOM.md](CLEANROOM.md).

## Alternatiflerle karşılaştırma (kısa ve dürüst)
Kaynaklar ve çekincelerle birlikte tam metin: [docs/COMPARISON.md](docs/COMPARISON.md). Rakipler hakkındaki bilgiler 18 Kasım 2026 tarihinde herkese açık sayfalardan derlenmiştir; orada *doğrulanmadı* olarak işaretlenen hiçbir şey kesinleşmiş değildir.

- **LanguageTool, Grammarly, Microsoft Editor:** başlıca dillerde çok daha geniş dil bilgisi kapsamı (LanguageTool; İngilizce, Fransızca, Almanca, İspanyolca ve Portekizce için binlerle ifade edilen kural sayıları yayımlar), ayrıca anlatım netliği ve yeniden yazma özellikleri, Google Docs ve mobil desteği. Varsayılan olarak metni üreticilerinin bulutlarına gönderirler. ERATA göndermez.
- **Harper:** o da tamamen yerel ve çok etkin biçimde geliştiriliyor, ancak yalnızca İngilizce için.
- **Tarayıcının yerleşik yazım denetimi:** temel kipinde yerel; yalnızca yazım denetimi yapar, dil bilgisi denetimi yoktur.
- **Vale ve LTeX+:** düzenleyiciler ve komut satırı için geliştirici araçları; tarayıcı eklentisi değildir.
- **ERATA'nın yararlı olduğu yer:** Rumence, Fransızca, İspanyolca, Portekizce ve İngilizce için yazım denetimini hedefli kurallarla birleştiren yerel bir tarayıcı eklentisi; ayrıca diyakritik işaretleri geri getirme, özel kurallar ve içe aktarılan sözlükler sunar. Rumence için bulunan kaynaklar, mevcut çözümlerin görece zayıf olduğunu düşündürüyor (Microsoft Editor'da yalnızca yazım denetimi; LanguageTool Rumenceyi etkin değil olarak işaretliyor); bu, bir kıyaslama testine değil, kamuya açık açıklamalara dayanır.
- **Kaybettiği yer:** ERATA'da toplamda elle yazılmış yüz kadar denetim var (kaba bir sayım, denetlenmemiş). Bir derlem üzerinde kesinlik/duyarlılık ölçümü henüz yok. Macarca kapsanmıyor; oysa Microsoft Editor kapsıyor ve Grammarly beta olarak listeliyor (derinliği doğrulanmadı).

## Bilinen sınırlar
- Köklü denetleyicilere göre çok daha az dil bilgisi kuralı; gerçek sözcük hataları için istatistiksel bir katman yok.
- Google Docs yok (canvas tabanlı düzenleyici), mobil yok, masaüstü veya kelime işlemci entegrasyonu yok.
- Otomatik tarayıcı testleri yalnızca Chromium'da çalışır. Firefox `web-ext lint` denetiminden geçer ancak burada bir tarayıcıda çalıştırılmamıştır. Safari test edilmemiştir.
- Macarca yazım denetimi yok; yerleşik Almanca veya İtalyanca sözlük yok.
- Bağımsız bir erişilebilirlik denetimi yok.
- Proje yeni (ilk sürümler 18 Kasım 2026 tarihli): henüz bir kullanıcı kitlesi ya da geçmiş performansı yok.

## Geliştirme
Node.js >= 24 gerekir.
```bash
npm i            # bağımlılıkları kurar
npm run dicts    # Hunspell sözlüklerini dict/ içine kopyalar
npm test         # birim testleri
npm run build    # dist/chrome ve dist/firefox üretir
```
`npm run pack` ayrıca `.zip` arşivleri oluşturur.

## Lisans
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Bkz. [LICENSE](LICENSE). Yerleşik sözlükler kendi lisanslarını korur ([dict/LICENSES.md](dict/LICENSES.md)).

## Destek
ERATA işinize yarıyorsa geliştirilmesine destek olabilirsiniz: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
