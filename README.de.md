[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · **Deutsch** · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — Offline-Korrekturhilfe für den Browser

Version: 0.4.0 · Letzte Aktualisierung: 27. November 2026

ERATA ist eine Browser-Erweiterung, die Rechtschreibung, Grammatik, Zeichensetzung und Typografie **vollständig auf Ihrem Gerät** prüft. Kein Konto, kein Server, keine Telemetrie: Ihr Text verlässt Ihren Rechner nie. ERATA wurde im Clean-Room-Verfahren entwickelt (siehe [CLEANROOM.md](CLEANROOM.md)) und steht unter der MIT-Lizenz.

## Funktionen
- Funktioniert in `textarea`-, `input`- und `contenteditable`-Feldern, auch in Rich-Text-Editoren. Die Unterstreichungen werden auf einer eigenen Ebene gezeichnet und **verändern nie das DOM der Seite**.
- **Spracherkennung pro Absatz**: Fremdsprachige Passagen lösen keinen Fehlalarm aus.
- **Rumänisch in der Tiefe**: ș/ț mit Komma statt Cedille, „să/sa“, „într-un“, „între 5 și 10“, Komma vor „dar/însă“, kleingeschriebene Monatsnamen, Pleonasmen, Klitika und mehr.
- **Wiederherstellung von Diakritika** (ro, fr, es, pt), nur wo die Korrektur eindeutig ist.
- Barrierefreie Markierungen: Fehlertypen unterscheiden sich auch durch die Linienform (gewellt, durchgezogen, gestrichelt, gepunktet), nicht nur durch die Farbe.
- Persönliches Wörterbuch, eigene Regeln (Regex), Schalter pro Website, Import und Export der Einstellungen, Import beliebiger Hunspell-Wörterbücher.
- Textstudio-Seite, „Alles korrigieren“, Lesbarkeitsindex, zwei Stilprüfungen (sehr lange Sätze, nahe Wiederholungen).
- Optionale Umformulierung über ein **lokales** Modell (OpenAI-kompatibler Endpunkt, nur auf `localhost`), standardmäßig deaktiviert.
- Oberfläche in 25 Sprachen: Rumänisch, Englisch, Französisch, Italienisch, Spanisch, Portugiesisch, Deutsch, Ungarisch sowie die übrigen Sprachen der nationalen Minderheiten Rumäniens (Ukrainisch, Türkisch, Krimtatarisch, Russisch, Serbisch, Slowakisch, Bulgarisch, Kroatisch, Griechisch, Jiddisch, Tschechisch, Polnisch, Armenisch, Russinisch, Albanisch, Mazedonisch, Romani). Die Sprache der Oberfläche ist unabhängig von der geprüften Sprache.

Tastenkürzel: `Alt+Shift+F` korrigiert alles im aktiven Feld, `Alt+Shift+E` schaltet ERATA für die aktuelle Website ein oder aus. Tastatur: Alt+Umschalt+Leertaste Vorschläge · Alt+Umschalt+M Menü · Esc schließen.

## Unterstützte Sprachen — was wirklich vorhanden ist
| Sprache | Rechtschreibung | Regeln |
|---|---|---|
| Rumänisch (ro) | Wörterbuch enthalten | eigenes Regelpaket, das umfangreichste |
| Englisch (en-US, en-GB) | Wörterbücher enthalten | eigenes Regelpaket (klein) |
| Französisch (fr) | Wörterbuch enthalten | eigenes Regelpaket (klein), Leerzeichen und Diakritika |
| Spanisch (es) | Wörterbuch enthalten | eigenes Regelpaket (klein), umgekehrte Satzzeichen und Diakritika |
| Portugiesisch (pt) | Wörterbuch enthalten | eigenes Regelpaket (klein) |
| Deutsch (de) | **nicht enthalten** (GPL-Lizenzen); eigenes Hunspell-Wörterbuch importieren | minimales Regelpaket |
| Italienisch (it) | **nicht enthalten** (GPL-Lizenzen); eigenes Hunspell-Wörterbuch importieren | minimales Regelpaket |
| Ungarisch (hu) | **keine in 0.4.0** | **keine**: Nur die Oberfläche ist übersetzt; eine Rechtschreibprüfung für Ungarisch gibt es noch nicht |

Jedes weitere Hunspell-Wörterbuch (nl, …) lässt sich importieren, doch die Spracherkennung kennt nur die oben genannten Sprachen.

## Übersetzungen
Die Oberfläche, diese README und die Präsentationsseite gibt es in 25 Sprachen. Acht davon (ro, en, fr, it, es, pt, de, hu) sind die Kernsprachen des Projekts; die übrigen siebzehn kamen in 0.4.0 hinzu. **Nur die 17 neuen Sprachen sind maschinell übersetzt und noch von keinem Muttersprachler geprüft. Korrekturen sind willkommen: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Geringstes Vertrauen: Russinisch, Romani, Krimtatarisch und Jiddisch. Die Übersetzung der Oberfläche fügt keine Rechtschreibprüfung für die jeweilige Sprache hinzu: Was tatsächlich geprüft wird, zeigt die Tabelle oben.

## Datenschutz
Die gesamte Prüfung läuft innerhalb der Erweiterung. Es gibt keinen ERATA-Server, kein Konto, keine Telemetrie und keine Analysen, und die Erweiterung fordert keine Netzwerkberechtigung an. Die einzige Ausnahme ist die optionale, standardmäßig deaktivierte lokale Umformulierung, die einen Satz an einen von Ihnen gewählten Endpunkt auf `localhost`/`127.0.0.1` senden kann. Einstellungen, persönliches Wörterbuch und importierte Wörterbücher bleiben in `storage.local` und IndexedDB auf Ihrem Gerät. Passwort-, E-Mail- und Kartenfelder sowie mit `data-erata="off"` markierte Felder werden ignoriert. Details: [PRIVACY.md](PRIVACY.md).

## Installation
Vorerst wird ERATA aus dem Quellcode gebaut.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** `chrome://extensions` öffnen, Entwicklermodus aktivieren, „Entpackte Erweiterung laden“ wählen und `dist/chrome` auswählen.
- **Firefox:** `about:debugging` öffnen, „Temporäres Add-on laden“ wählen und `dist/firefox/manifest.json` auswählen.
- **Safari (über Xcode, nur macOS):** `xcrun safari-web-extension-converter dist/chrome`, anschließend das erzeugte Xcode-Projekt bauen und starten. Die Safari-Version wurde vom Autor **nicht getestet**; siehe [docs/SAFARI.md](docs/SAFARI.md).

## Clean Room
ERATA enthält nichts aus Code, Regeln (XML/Java), Daten oder Meldungstexten von LanguageTool oder anderen Korrekturprogrammen und leitet nichts davon ab. Der Hunspell-Parser, die Regeln, die Spracherkennung und die Vorschlagsalgorithmen wurden von Grund auf geschrieben, nach öffentlichen Formatbeschreibungen und aus allgemeinem Wissen über Grammatik und Typografie. Die enthaltenen Wörterbücher sind eigenständige Hunspell-Projekte mit eigenen Lizenzen ([dict/LICENSES.md](dict/LICENSES.md)). Vollständige Methode: [CLEANROOM.md](CLEANROOM.md).

## Vergleich mit den Alternativen (kurz und ehrlich)
Ausführliche Fassung mit Quellen und Vorbehalten: [docs/COMPARISON.md](docs/COMPARISON.md). Die Angaben zu Mitbewerbern stammen von öffentlichen Seiten, abgerufen am 2026-11-18; was dort als *nicht verifiziert* markiert ist, ist nicht bestätigt.

- **LanguageTool, Grammarly, Microsoft Editor:** deutlich breitere grammatische Abdeckung in den großen Sprachen (LanguageTool veröffentlicht Regelzahlen im Tausenderbereich für Englisch, Französisch, Deutsch, Spanisch und Portugiesisch), dazu Funktionen für Klarheit und Umformulierung, Google Docs und Mobilgeräte. Sie senden Text standardmäßig an die Server des Anbieters. ERATA nicht.
- **Harper:** ebenfalls vollständig lokal und sehr aktiv, aber nur für Englisch.
- **Eingebaute Rechtschreibprüfung des Browsers:** im Basismodus lokal, nur Rechtschreibung, keine Grammatik.
- **Vale und LTeX+:** Werkzeuge für Entwickler (Editoren, Kommandozeile), keine Browser-Erweiterungen.
- **Wo ERATA nützlich ist:** eine lokale Erweiterung, die Rechtschreibung und gezielte Regeln für Rumänisch, Französisch, Spanisch, Portugiesisch und Englisch verbindet, mit Diakritika-Wiederherstellung, eigenen Regeln und importierten Wörterbüchern. Für Rumänisch deuten die gefundenen Quellen darauf hin, dass die etablierten Lösungen vergleichsweise schwach sind (Microsoft Editor: nur Rechtschreibung; LanguageTool führt Rumänisch als inaktiv); das beruht auf öffentlichen Angaben, nicht auf einem Vergleichstest.
- **Wo ERATA unterliegt:** ERATA hat insgesamt etwa hundert handgeschriebene Prüfungen (grobe, nicht geprüfte Schätzung). Eine Messung von Präzision und Trefferquote an einem Korpus gibt es noch nicht. Ungarisch ist nicht abgedeckt, während Microsoft Editor es abdeckt und Grammarly es in der Beta aufführt (Tiefe nicht verifiziert).

## Bekannte Grenzen
- Weit weniger Grammatikregeln als bei etablierten Korrekturprogrammen; keine statistische Ebene für Fehler mit real existierenden Wörtern.
- Kein Google Docs (Canvas-Editor), kein Mobilbetrieb, keine Desktop- oder Textverarbeitungs-Integration.
- Automatische Tests laufen nur in Chromium. Firefox besteht `web-ext lint`, wurde hier aber nicht in einem Browser ausgeführt. Safari ist ungetestet.
- Keine Rechtschreibprüfung für Ungarisch; kein deutsches oder italienisches Wörterbuch enthalten.
- Kein unabhängiges Barrierefreiheits-Audit.
- Das Projekt ist neu (erste Versionen vom 18. November 2026): noch keine Nutzerschaft, keine Erfahrungswerte.

## Entwicklung
Erfordert Node.js >= 24.
```bash
npm i            # Abhängigkeiten installieren
npm run dicts    # Hunspell-Wörterbücher nach dict/ kopieren
npm test         # Unit-Tests
npm run build    # erzeugt dist/chrome und dist/firefox
```
`npm run pack` erstellt zusätzlich `.zip`-Archive.

## Lizenz
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Siehe [LICENSE](LICENSE). Die enthaltenen Wörterbücher behalten ihre eigenen Lizenzen ([dict/LICENSES.md](dict/LICENSES.md)).

## Unterstützung
Wenn ERATA Ihnen nützt, können Sie die Entwicklung unterstützen: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
