# ERATA pe Safari (netestat)

**Atenție:** build-ul Safari nu a fost testat de autor; necesită macOS + Xcode.

1. `npm ci && npm run dicts && npm run build` → `dist/safari`.
2. `xcrun safari-web-extension-converter dist/safari --project-location build/safari --app-name ERATA --bundle-identifier tf.trom.erata --no-open --no-prompt`
3. Deschideți proiectul Xcode generat, alegeți echipa de semnare (cont Apple Developer pentru distribuție; pentru uz local, „Sign to Run Locally”).
4. Rulați aplicația, apoi Safari → Setări → Extensii → activați ERATA și acordați acces la site-uri.
5. Pentru dezvoltare: Safari → Dezvoltare → „Permite extensii nesemnate”.

## Limitări posibile
- Comenzile rapide (`commands`) pot fi ignorate; folosiți popup-ul.
- `optional_permissions` pentru reformularea locală (localhost) poate să nu fie suportat.
- Service worker/pagina de fundal poate fi oprită mai agresiv; dicționarele se reîncarcă la nevoie.
- Neverificat: sublinierile în `contenteditable` și importul de dicționare (IndexedDB).
