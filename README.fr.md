[English](README.md) · [Română](README.ro.md) · **Français** · [Italiano](README.it.md) · [Español](README.es.md) · [Português](README.pt.md) · [Deutsch](README.de.md) · [Magyar](README.hu.md) · [Українська](README.uk.md) · [Türkçe](README.tr.md) · [Qırımtatarca](README.crh.md) · [Русский](README.ru.md) · [Српски](README.sr.md) · [Slovenčina](README.sk.md) · [Български](README.bg.md) · [Hrvatski](README.hr.md) · [Ελληνικά](README.el.md) · [ייִדיש](README.yi.md) · [Čeština](README.cs.md) · [Polski](README.pl.md) · [Հայերեն](README.hy.md) · [Русиньскый](README.rue.md) · [Shqip](README.sq.md) · [Македонски](README.mk.md) · [Romani](README.rmy.md)

# ERATA — correcteur hors ligne pour le navigateur

Version : 0.4.1 · Dernière mise à jour : 28 novembre 2026

ERATA est une extension de navigateur qui vérifie l’orthographe, la grammaire, la ponctuation et la typographie **entièrement sur votre appareil**. Pas de compte, pas de serveur, pas de télémétrie : votre texte ne quitte jamais votre ordinateur. Elle est développée en « clean-room » (voir [CLEANROOM.md](CLEANROOM.md)) et publiée sous licence MIT.

## Fonctionnalités
- Fonctionne dans les champs `textarea`, `input` et `contenteditable`, y compris les éditeurs riches. Les soulignements sont dessinés sur une couche séparée et **ne modifient jamais le DOM de la page**.
- **Détection de la langue par paragraphe** : un passage en langue étrangère ne déclenche pas de fausses alertes.
- **Roumain approfondi** : ș/ț avec virgule souscrite au lieu de la cédille, « să/sa », « într-un », « între 5 și 10 », virgule devant « dar/însă », mois en minuscules, pléonasmes, clitiques, etc.
- **Restauration des diacritiques** (ro, fr, es, pt), uniquement lorsque la correction est sans ambiguïté.
- Marqueurs accessibles : les types d’erreur se distinguent aussi par la forme du trait (ondulé, plein, tireté, pointillé), pas seulement par la couleur.
- Dictionnaire personnel, règles personnalisées (regex), activation par site, import/export des réglages, import de tout dictionnaire Hunspell.
- Page Studio de texte, « Tout corriger », indice de lisibilité, deux contrôles de style (phrases très longues, répétitions rapprochées).
- Reformulation facultative via un modèle **local** (point d’accès compatible OpenAI, uniquement sur `localhost`), désactivée par défaut.
- Interface en 25 langues : roumain, anglais, français, italien, espagnol, portugais, allemand, hongrois, ainsi que les autres langues des minorités nationales de Roumanie (ukrainien, turc, tatar de Crimée, russe, serbe, slovaque, bulgare, croate, grec, yiddish, tchèque, polonais, arménien, ruthène, albanais, macédonien, romani). La langue de l’interface est indépendante de la langue vérifiée.

Raccourcis : `Alt+Shift+F` corrige tout dans le champ actif, `Alt+Shift+E` active ou désactive ERATA sur le site courant. Clavier : Alt+Maj+Espace suggestions · Alt+Maj+M menu · Échap fermer.

## Langues prises en charge — ce qui existe réellement
| Langue | Orthographe | Règles |
|---|---|---|
| Roumain (ro) | dictionnaire inclus | jeu de règles dédié, le plus fourni |
| Anglais (en-US, en-GB) | dictionnaires inclus | jeu de règles dédié (réduit) |
| Français (fr) | dictionnaire inclus | jeu de règles dédié (réduit), espaces et diacritiques |
| Espagnol (es) | dictionnaire inclus | jeu de règles dédié (réduit), signes inversés et diacritiques |
| Portugais (pt) | dictionnaire inclus | jeu de règles dédié (réduit) |
| Allemand (de) | **non inclus** (licences GPL) ; importez votre propre dictionnaire Hunspell | jeu de règles minimal |
| Italien (it) | **non inclus** (licences GPL) ; importez votre propre dictionnaire Hunspell | jeu de règles minimal |
| Hongrois (hu) | **aucune dans la 0.4.1** | **aucune** : seule l’interface est traduite ; il n’existe pas encore de vérification orthographique du hongrois |

Tout autre dictionnaire Hunspell (nl, …) peut être importé, mais le détecteur de langue ne connaît que les langues ci-dessus.

## Traductions
L’interface, ce README et la page de présentation existent en 25 langues. Huit d’entre elles (ro, en, fr, it, es, pt, de, hu) sont les langues de base du projet ; les dix-sept autres ont été ajoutées dans la 0.4.1. **Seules les 17 nouvelles langues sont traduites automatiquement, et aucun locuteur natif ne les a encore relues. Les corrections sont les bienvenues : https://github.com/chiuta/ERATA/issues** (Machine translation, not yet reviewed by a native speaker. Corrections are welcome: https://github.com/chiuta/ERATA/issues) Confiance la plus faible : ruthène, romani, tatar de Crimée et yiddish. Traduire l’interface n’ajoute pas de vérification orthographique pour la langue concernée : voir le tableau ci-dessus pour ce qui est réellement vérifié.

## Confidentialité
Toute la vérification s’effectue à l’intérieur de l’extension. Il n’y a ni serveur ERATA, ni compte, ni télémétrie, ni outil d’analyse, et l’extension ne demande aucune permission réseau. La seule exception est la reformulation locale, facultative et désactivée par défaut, qui peut envoyer une phrase à un point d’accès `localhost`/`127.0.0.1` de votre choix. Les réglages, le dictionnaire personnel et les dictionnaires importés restent dans `storage.local` et IndexedDB, sur votre appareil. Les champs de mot de passe, d’e-mail et de carte bancaire, ainsi que ceux marqués `data-erata="off"`, sont ignorés. Détails : [PRIVACY.md](PRIVACY.md).

## Installation
Pour l’instant, ERATA se compile depuis les sources.
```bash
npm i && npm run dicts && npm run build
```
- **Chrome / Edge / Opera :** ouvrez `chrome://extensions`, activez le mode développeur, choisissez « Charger l’extension non empaquetée » et sélectionnez `dist/chrome`.
- **Firefox :** ouvrez `about:debugging`, choisissez « Charger un module complémentaire temporaire » et sélectionnez `dist/firefox/manifest.json`.
- **Safari (via Xcode, macOS uniquement) :** `xcrun safari-web-extension-converter dist/chrome`, puis compilez et lancez le projet Xcode généré. La version Safari **n’a pas été testée** par l’auteur ; voir [docs/SAFARI.md](docs/SAFARI.md).

## Clean-room
ERATA ne contient et ne dérive rien du code, des règles (XML/Java), des données ou des messages de LanguageTool ni d’aucun autre correcteur. L’analyseur Hunspell, les règles, le détecteur de langue et les algorithmes de suggestion ont été écrits de zéro, à partir de descriptions publiques du format et de connaissances générales en grammaire et en typographie. Les dictionnaires inclus sont des projets Hunspell indépendants, sous leurs propres licences ([dict/LICENSES.md](dict/LICENSES.md)). Méthode complète : [CLEANROOM.md](CLEANROOM.md).

## Comparaison avec les alternatives (courte et honnête)
Version détaillée, avec sources et réserves : [docs/COMPARISON.md](docs/COMPARISON.md). Les informations sur les concurrents proviennent de pages publiques consultées le 2026-11-18 ; ce qui y est marqué *non vérifié* n’est pas confirmé.

- **LanguageTool, Grammarly, Microsoft Editor :** couverture grammaticale bien plus large dans les grandes langues (LanguageTool publie des nombres de règles de l’ordre de plusieurs milliers pour l’anglais, le français, l’allemand, l’espagnol et le portugais), plus des fonctions de clarté et de réécriture, Google Docs et mobile. Ils envoient par défaut le texte aux serveurs de l’éditeur. Pas ERATA.
- **Harper :** également 100 % local et très actif, mais pour l’anglais uniquement.
- **Correcteur orthographique natif du navigateur :** local en mode de base, orthographe seulement, pas de grammaire.
- **Vale et LTeX+ :** outils pour développeurs (éditeurs, ligne de commande), pas des extensions de navigateur.
- **Où ERATA est utile :** une extension locale qui associe orthographe et règles ciblées pour le roumain, le français, l’espagnol, le portugais et l’anglais, avec restauration des diacritiques, règles personnalisées et dictionnaires importés. Pour le roumain, les sources trouvées laissent penser que les solutions établies sont relativement faibles (Microsoft Editor : orthographe seule ; LanguageTool classe le roumain comme inactif) ; il s’agit de déclarations publiques, pas d’un test comparatif.
- **Où elle perd :** ERATA compte environ une centaine de contrôles écrits à la main au total (estimation grossière, non auditée). Aucune mesure de précision/rappel sur un corpus n’existe encore. Le hongrois n’est pas couvert, alors que Microsoft Editor le couvre et que Grammarly l’annonce en bêta (profondeur non vérifiée).

## Limites connues
- Beaucoup moins de règles grammaticales que les correcteurs établis ; pas de couche statistique pour les erreurs de mots réels.
- Pas de Google Docs (éditeur sur canvas), pas de mobile, pas d’intégration au bureau ni aux traitements de texte.
- Les tests automatisés ne tournent que sur Chromium. Firefox passe `web-ext lint` mais n’a pas été lancé dans un navigateur ici. Safari n’est pas testé.
- Pas de vérification orthographique du hongrois ; pas de dictionnaire allemand ou italien inclus.
- Pas d’audit d’accessibilité indépendant.
- Le projet est récent (premières versions du 18 novembre 2026) : pas encore d’utilisateurs ni d’historique.

## Développement
Nécessite Node.js >= 24.
```bash
npm i            # installe les dépendances
npm run dicts    # copie les dictionnaires Hunspell dans dict/
npm test         # tests unitaires
npm run build    # produit dist/chrome et dist/firefox
```
`npm run pack` crée en plus des archives `.zip`.

## Licence
MIT — Copyright (c) 2026 Alexandru-Ionuț Chiuță (Alexio). Voir [LICENSE](LICENSE). Les dictionnaires inclus conservent leurs propres licences ([dict/LICENSES.md](dict/LICENSES.md)).

## Soutien
Si ERATA vous est utile, vous pouvez soutenir son développement : [Buy Me a Coffee](https://buymeacoffee.com/echo.of.the.strings).
