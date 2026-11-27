[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · **Polski** · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — korektor offline dla przeglądarki

Wersja: 0.4.0 · Ostatnia aktualizacja: 27 listopada 2026

ERATA to rozszerzenie przeglądarki, które sprawdza pisownię, gramatykę, interpunkcję i typografię **w całości na urządzeniu użytkownika**. Bez konta, bez serwera, bez telemetrii: tekst nigdy nie opuszcza komputera. Powstała metodą clean-room (zob. [CLEANROOM.md](CLEANROOM.md)) i jest wydana na licencji MIT.

## Funkcje
- Działa w polach `textarea`, `input` i `contenteditable`, także w edytorach tekstu sformatowanego. Podkreślenia są rysowane na osobnej warstwie i **nigdy nie modyfikują DOM strony**.
- **Rozpoznawanie języka w obrębie akapitu**, dzięki czemu fragmenty w obcych językach nie wywołują fałszywych alarmów.
- **Rozbudowana obsługa rumuńskiego:** ș/ț z przecinkiem zamiast cedylli, „să/sa”, „într-un”, „între 5 și 10”, przecinki przed „dar/însă”, nazwy miesięcy małą literą, pleonazmy, klityki i inne.
- **Przywracanie znaków diakrytycznych** (ro, fr, es, pt), stosowane tylko tam, gdzie poprawka jest jednoznaczna.
- Dostępne oznaczenia: rodzaje błędów różnią się kształtem linii (falista, ciągła, kreskowana, kropkowana), a nie tylko kolorem.
- Słownik osobisty, własne reguły regex, przełącznik dla poszczególnych witryn, import i eksport ustawień, import dowolnego słownika Hunspell.
- Strona Text Studio, „Popraw wszystko”, wskaźnik czytelności, dwie kontrole stylu (bardzo długie zdania, bliskie powtórzenia).
- Opcjonalne przeredagowanie za pomocą modelu **lokalnego** (punkt końcowy zgodny z OpenAI wyłącznie na `localhost`), domyślnie wyłączone.
- Interfejs w 25 językach: rumuński, angielski, francuski, włoski, hiszpański, portugalski, niemiecki, węgierski oraz pozostałe języki mniejszości narodowych w Rumunii (ukraiński, turecki, krymskotatarski, rosyjski, serbski, słowacki, bułgarski, chorwacki, grecki, jidysz, czeski, polski, ormiański, rusiński, albański, macedoński, romski). Język interfejsu jest niezależny od języka sprawdzanego tekstu.

Skróty klawiszowe: `Alt+Shift+F` poprawia wszystko w aktywnym polu, `Alt+Shift+E` włącza lub wyłącza ERATA w bieżącej witrynie. Klawiatura: Alt+Shift+Spacja sugestie · Alt+Shift+M menu · Esc zamknij.

## Obsługiwane języki — co naprawdę jest
| Język | Pisownia | Reguły |
|---|---|---|
| rumuński (ro) | wbudowany słownik | osobny pakiet reguł, najobszerniejszy |
| angielski (en-US, en-GB) | wbudowane słowniki | osobny pakiet reguł (mały) |
| francuski (fr) | wbudowany słownik | osobny pakiet reguł (mały), odstępy i znaki diakrytyczne |
| hiszpański (es) | wbudowany słownik | osobny pakiet reguł (mały), odwrócone znaki interpunkcyjne i znaki diakrytyczne |
| portugalski (pt) | wbudowany słownik | osobny pakiet reguł (mały) |
| niemiecki (de) | **nie jest dołączony** (ze względu na licencję GPL); zaimportuj własny słownik Hunspell | minimalny pakiet reguł |
| włoski (it) | **nie jest dołączony** (ze względu na licencję GPL); zaimportuj własny słownik Hunspell | minimalny pakiet reguł |
| węgierski (hu) | **brak w wersji 0.4.0** | **brak**: przetłumaczony jest tylko interfejs; sprawdzania pisowni dla węgierskiego jeszcze nie ma |

Każdy inny słownik Hunspell (nl, …) można zaimportować, ale detektor języka zna tylko języki wymienione powyżej.

## Tłumaczenia
Interfejs, ten plik README i strona prezentacyjna istnieją w 25 językach. Osiem z nich (ro, en, fr, it, es, pt, de, hu) to języki podstawowe projektu; pozostałe siedemnaście dodano w wersji 0.4.0. **Tłumaczenie maszynowe, jeszcze niesprawdzone przez rodzimego użytkownika języka. Poprawki są mile widziane: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Najmniejszą pewność mają tłumaczenia na rusiński, romski, krymskotatarski i jidysz. Przetłumaczenie interfejsu nie dodaje sprawdzania pisowni dla danego języka: to, co jest naprawdę sprawdzane, pokazuje tabela powyżej.

## Prywatność
Całe sprawdzanie odbywa się wewnątrz rozszerzenia. Nie ma serwera ERATA, konta, telemetrii ani analityki, a rozszerzenie nie żąda żadnych uprawnień sieciowych. Jedynym wyjątkiem jest opcjonalne lokalne przeredagowanie, domyślnie wyłączone, które może wysłać jedno zdanie do punktu końcowego pod adresem `localhost`/`127.0.0.1`, wskazanego przez użytkownika. Ustawienia, słownik osobisty i zaimportowane słowniki pozostają w `storage.local` i IndexedDB na urządzeniu użytkownika. Pola haseł, adresów e-mail i kart płatniczych oraz pola oznaczone `data-erata="off"` są pomijane. Szczegóły: [PRIVACY.md](PRIVACY.md).

## Instalacja
Na razie ERATA jest budowana ze źródeł.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** otwórz `chrome://extensions`, włącz tryb dewelopera, wybierz „Załaduj rozpakowane” i wskaż `dist/chrome`.
- **Firefox:** otwórz `about:debugging`, wybierz „Załaduj tymczasowy dodatek” i wskaż `dist/firefox/manifest.json`.
- **Safari (przez Xcode, tylko macOS):** `xcrun safari-web-extension-converter dist/chrome`, następnie zbuduj i uruchom wygenerowany projekt Xcode. Wersja dla Safari **nie była testowana** przez autora; zob. [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA nie zawiera i nie wywodzi niczego z kodu, reguł (XML/Java), danych ani tekstów komunikatów LanguageTool ani żadnego innego korektora. Parser Hunspella, reguły, detektor języka i algorytmy podpowiedzi zostały napisane od zera na podstawie publicznych opisów formatów oraz ogólnej wiedzy o gramatyce i typografii. Dołączone słowniki to niezależne projekty Hunspell z własnymi licencjami ([dict/LICENSES.md](dict/LICENSES.md)). Pełny opis metody: [CLEANROOM.md](CLEANROOM.md).

## Porównanie z alternatywami (krótko i uczciwie)
Pełne zestawienie ze źródłami i zastrzeżeniami: [docs/COMPARISON.md](docs/COMPARISON.md). Informacje o konkurencji zebrano z publicznych stron w dniu 2026-11-18; wszystko, co jest tam oznaczone jako *unverified* (niezweryfikowane), nie zostało potwierdzone.

- **LanguageTool, Grammarly, Microsoft Editor:** znacznie szersze pokrycie gramatyki w głównych językach (LanguageTool podaje liczby reguł rzędu tysięcy dla angielskiego, francuskiego, niemieckiego, hiszpańskiego i portugalskiego), a do tego funkcje poprawy jasności i przeredagowywania, Google Docs oraz urządzenia mobilne. Domyślnie wysyłają tekst do chmur dostawców. ERATA tego nie robi.
- **Harper:** również w pełni lokalny i bardzo aktywnie rozwijany, ale tylko dla angielskiego.
- **Natywne sprawdzanie pisowni w przeglądarce:** w trybie podstawowym lokalne, tylko pisownia, bez gramatyki.
- **Vale i LTeX+:** narzędzia dla programistów, do edytorów i wiersza poleceń, a nie rozszerzenia przeglądarki.
- **Gdzie ERATA się przydaje:** lokalne rozszerzenie przeglądarki łączące sprawdzanie pisowni i ukierunkowane reguły dla rumuńskiego, francuskiego, hiszpańskiego, portugalskiego i angielskiego z przywracaniem znaków diakrytycznych, własnymi regułami i importowanymi słownikami. W przypadku rumuńskiego znalezione źródła sugerują, że dotychczasowi gracze są stosunkowo słabi (Microsoft Editor sprawdza tylko pisownię; LanguageTool oznacza rumuński jako nieaktywny); odzwierciedla to publiczne wypowiedzi, a nie test porównawczy.
- **Gdzie przegrywa:** ERATA ma łącznie rzędu stu ręcznie napisanych kontroli (przybliżona liczba, nie audyt). Nie ma jeszcze pomiaru precyzji i pełności (precision/recall) na korpusie. Węgierski nie jest obsługiwany, podczas gdy Microsoft Editor go obsługuje, a Grammarly podaje go w wersji beta (głębokość niezweryfikowana).

## Znane ograniczenia
- Znacznie mniej reguł gramatycznych niż w korektorach z wieloletnią historią; brak warstwy statystycznej dla błędów polegających na użyciu poprawnego, lecz niewłaściwego wyrazu (real-word errors).
- Brak Google Docs (edytor oparty na canvas), urządzeń mobilnych oraz integracji z komputerem i edytorami tekstu.
- Automatyczne testy w przeglądarce działają tylko w Chromium. Firefox przechodzi `web-ext lint`, ale nie był tu uruchamiany w przeglądarce. Safari nie było testowane.
- Brak sprawdzania pisowni dla węgierskiego; brak dołączonego słownika niemieckiego i włoskiego.
- Brak niezależnego audytu dostępności.
- Projekt jest nowy (pierwsze wydania z 18 listopada 2026): nie ma jeszcze bazy użytkowników ani historii działania.

## Rozwój projektu
Wymaga Node.js >= 24.
```bash
npm i            # instaluje zależności
npm run dicts    # kopiuje słowniki Hunspell do dict/
npm test         # testy jednostkowe
npm run build    # tworzy dist/chrome i dist/firefox
```
`npm run pack` dodatkowo tworzy archiwa `.zip`.

## Licencja
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Zob. [LICENSE](LICENSE). Dołączone słowniki zachowują własne licencje ([dict/LICENSES.md](dict/LICENSES.md)).

## Wsparcie
Jeśli ERATA jest przydatna, można wesprzeć jej rozwój: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
