# Confidențialitate / Privacy

- Tot textul este verificat **local**, în extensia dvs. Nu există server ERATA, cont, telemetrie sau analitice.
- Extensia nu are permisiuni de rețea. Singura excepție, **dezactivată implicit**: „Reformulare cu model local",
  care poate trimite o propoziție către un endpoint de pe `localhost`/`127.0.0.1` ales de dvs. (permisiune cerută la activare).
- Setările, dicționarul personal și dicționarele importate se păstrează în `storage.local` și IndexedDB, doar pe acest dispozitiv.
- Câmpurile de parolă, e-mail, card și cele marcate `data-erata="off"` sunt ignorate.

Your text never leaves your computer. No account, no telemetry, no network permissions
(except the optional, off-by-default localhost rewrite).
