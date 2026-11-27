[English](README.md) · [Română](README.ro.md) · [Français](README.fr.md) · **Italiano** · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — correttore offline per il browser

Versione: 0.4.1 · Ultimo aggiornamento: 28 novembre 2026

ERATA è un’estensione per il browser che controlla ortografia, grammatica, punteggiatura e tipografia **interamente sul tuo dispositivo**. Nessun account, nessun server, nessuna telemetria: il testo non lascia mai il tuo computer. È sviluppata in modalità clean-room (vedi [CLEANROOM.md](CLEANROOM.md)) e rilasciata con licenza MIT.

## Funzioni
- Funziona nei campi `textarea`, `input` e `contenteditable`, compresi gli editor avanzati. Le sottolineature sono disegnate su un livello separato e **non modificano mai il DOM della pagina**.
- **Rilevamento della lingua per paragrafo**: i brani in lingua straniera non generano falsi allarmi.
- **Rumeno in profondità**: ș/ț con la virgola sottoscritta invece della cediglia, «să/sa», «într-un», «între 5 și 10», virgola prima di «dar/însă», mesi in minuscolo, pleonasmi, clitici e altro.
- **Ripristino dei segni diacritici** (ro, fr, es, pt), solo quando la correzione è inequivocabile.
- Indicatori accessibili: i tipi di errore si distinguono anche per la forma della linea (ondulata, continua, tratteggiata, punteggiata), non solo per il colore.
- Dizionario personale, regole personalizzate (regex), interruttore per sito, importazione/esportazione delle impostazioni, importazione di qualsiasi dizionario Hunspell.
- Pagina Studio di testo, «Correggi tutto», indice di leggibilità, due controlli di stile (frasi molto lunghe, ripetizioni ravvicinate).
- Riformulazione facoltativa tramite un modello **locale** (endpoint compatibile con OpenAI, solo su `localhost`), disattivata per impostazione predefinita.
- Interfaccia in 25 lingue: rumeno, inglese, francese, italiano, spagnolo, portoghese, tedesco, ungherese, più le altre lingue delle minoranze nazionali della Romania (ucraino, turco, tataro di Crimea, russo, serbo, slovacco, bulgaro, croato, greco, yiddish, ceco, polacco, armeno, ruteno, albanese, macedone, romaní). La lingua dell’interfaccia è indipendente dalla lingua controllata.

Scorciatoie: `Alt+Shift+F` corregge tutto nel campo attivo, `Alt+Shift+E` attiva o disattiva ERATA sul sito corrente. Tastiera: Alt+Maiusc+Spazio suggerimenti · Alt+Maiusc+M menu · Esc chiudi.

## Lingue supportate — cosa c’è davvero
| Lingua | Ortografia | Regole |
|---|---|---|
| Rumeno (ro) | dizionario incluso | pacchetto dedicato, il più sviluppato |
| Inglese (en-US, en-GB) | dizionari inclusi | pacchetto dedicato (ridotto) |
| Francese (fr) | dizionario incluso | pacchetto dedicato (ridotto), spaziatura e diacritici |
| Spagnolo (es) | dizionario incluso | pacchetto dedicato (ridotto), segni invertiti e diacritici |
| Portoghese (pt) | dizionario incluso | pacchetto dedicato (ridotto) |
| Tedesco (de) | **non incluso** (licenze GPL); importa il tuo dizionario Hunspell | pacchetto minimo |
| Italiano (it) | **non incluso** (licenze GPL); importa il tuo dizionario Hunspell | pacchetto minimo |
| Ungherese (hu) | **nessuno nella 0.4.1** | **nessuna**: è tradotta solo l’interfaccia; il controllo ortografico dell’ungherese non esiste ancora |

Qualsiasi altro dizionario Hunspell (nl, …) può essere importato, ma il rilevatore di lingua conosce solo quelle elencate sopra.

## Traduzioni
L’interfaccia, questo README e la pagina di presentazione esistono in 25 lingue. Otto di esse (ro, en, fr, it, es, pt, de, hu) sono le lingue di base del progetto; le altre diciassette sono state aggiunte nella 0.4.1. **Solo le 17 lingue nuove sono tradotte automaticamente e nessun madrelingua le ha ancora riviste. Le correzioni sono benvenute: https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Affidabilità minima: ruteno, romaní, tataro di Crimea e yiddish. Tradurre l’interfaccia non aggiunge il controllo ortografico per quella lingua: vedi la tabella qui sopra per ciò che viene effettivamente controllato.

## Privacy
Tutto il controllo avviene all’interno dell’estensione. Non esistono server ERATA, account, telemetria né strumenti di analisi, e l’estensione non richiede permessi di rete. L’unica eccezione è la riformulazione locale, facoltativa e disattivata per impostazione predefinita, che può inviare una frase a un endpoint su `localhost`/`127.0.0.1` scelto da te. Impostazioni, dizionario personale e dizionari importati restano in `storage.local` e IndexedDB, sul tuo dispositivo. I campi password, e-mail e carta, e quelli contrassegnati con `data-erata="off"`, vengono ignorati. Dettagli: [PRIVACY.md](PRIVACY.md).

## Installazione
Per ora ERATA si compila dai sorgenti.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera:** apri `chrome://extensions`, attiva la modalità sviluppatore, scegli «Carica estensione non pacchettizzata» e seleziona `dist/chrome`.
- **Firefox:** apri `about:debugging`, scegli «Carica componente aggiuntivo temporaneo» e seleziona `dist/firefox/manifest.json`.
- **Safari (tramite Xcode, solo macOS):** `xcrun safari-web-extension-converter dist/chrome`, poi compila ed esegui il progetto Xcode generato. La versione per Safari **non è stata testata** dall’autore; vedi [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA non contiene e non deriva nulla dal codice, dalle regole (XML/Java), dai dati o dai messaggi di LanguageTool o di altri correttori. Il parser Hunspell, le regole, il rilevatore di lingua e gli algoritmi dei suggerimenti sono stati scritti da zero, a partire da descrizioni pubbliche del formato e da conoscenze generali di grammatica e tipografia. I dizionari inclusi sono progetti Hunspell indipendenti, con licenze proprie ([dict/LICENSES.md](dict/LICENSES.md)). Metodo completo: [CLEANROOM.md](CLEANROOM.md).

## Confronto con le alternative (breve e onesto)
Versione completa, con fonti e riserve: [docs/COMPARISON.md](docs/COMPARISON.md). I dati sui concorrenti provengono da pagine pubbliche consultate il 2026-11-18; ciò che vi è indicato come *non verificato* non è confermato.

- **LanguageTool, Grammarly, Microsoft Editor:** copertura grammaticale molto più ampia nelle lingue principali (LanguageTool pubblica numeri di regole nell’ordine delle migliaia per inglese, francese, tedesco, spagnolo e portoghese), più funzioni di chiarezza e riscrittura, Google Docs e dispositivi mobili. Per impostazione predefinita inviano il testo ai server del fornitore. ERATA no.
- **Harper:** anch’esso completamente locale e molto attivo, ma solo per l’inglese.
- **Controllo ortografico nativo del browser:** locale nella modalità di base, solo ortografia, nessuna grammatica.
- **Vale e LTeX+:** strumenti per sviluppatori (editor, riga di comando), non estensioni per il browser.
- **Dove ERATA è utile:** un’estensione locale che unisce ortografia e regole mirate per rumeno, francese, spagnolo, portoghese e inglese, con ripristino dei diacritici, regole personalizzate e dizionari importati. Per il rumeno, le fonti trovate suggeriscono che le soluzioni affermate siano relativamente deboli (Microsoft Editor: solo ortografia; LanguageTool segna il rumeno come inattivo); si tratta di dichiarazioni pubbliche, non di un test comparativo.
- **Dove perde:** ERATA ha in tutto circa un centinaio di controlli scritti a mano (stima approssimativa, non verificata da terzi). Non esiste ancora una misurazione di precisione e richiamo su un corpus. L’ungherese non è coperto, mentre Microsoft Editor lo copre e Grammarly lo elenca in beta (profondità non verificata).

## Limiti noti
- Molte meno regole grammaticali dei correttori affermati; nessun livello statistico per gli errori con parole esistenti.
- Niente Google Docs (editor su canvas), niente mobile, nessuna integrazione desktop o con i programmi di videoscrittura.
- I test automatici girano solo su Chromium. Firefox supera `web-ext lint` ma qui non è stato eseguito in un browser. Safari non è testato.
- Nessun controllo ortografico per l’ungherese; nessun dizionario tedesco o italiano incluso.
- Nessun audit di accessibilità indipendente.
- Il progetto è nuovo (prime versioni del 18 novembre 2026): non ha ancora utenti né storia alle spalle.

## Sviluppo
Richiede Node.js >= 24.
```bash
npm i            # installa le dipendenze
npm run dicts    # copia i dizionari Hunspell in dict/
npm test         # test unitari
npm run build    # produce dist/chrome e dist/firefox
```
`npm run pack` crea in più archivi `.zip`.

## Licenza
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Vedi [LICENSE](LICENSE). I dizionari inclusi mantengono le proprie licenze ([dict/LICENSES.md](dict/LICENSES.md)).

## Sostegno
Se ERATA ti è utile, puoi sostenerne lo sviluppo: [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
