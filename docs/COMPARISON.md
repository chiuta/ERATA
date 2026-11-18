# ERATA 0.3 versus the alternatives: an adversarial comparison

Prepared 18 November 2026. All web sources were accessed on 2026-11-18 and only public product pages, documentation, pricing pages, privacy policies and extension-store listings were used. No LanguageTool source code or rule files were opened (clean-room constraint, see CLEANROOM.md). Where a fact could only be found on a third-party aggregator, it is marked **[3rd-party]**; where sources disagree or nothing could be found, it is marked **[unverified]**. Figures about ERATA come from counting the repository at `/home/claude/erata` and are approximate where stated.

## 1. Method and caveats

ERATA's own numbers were measured locally: the rule modules in `src/core/rules/` export 48 rule objects (ro 18, en 5, fr 5, es 3, pt 2, de 2, it 1, language-independent 12), plus 2 style rules in `src/core/style.js`. Many of those objects are "table rules" that bundle several regex patterns; a rough line count of table rows gives about 61 patterns (ro 21, en 17, es 7, it 5, fr 4, pt 4, de 3). So ERATA 0.3 has on the order of one hundred hand-written checks in total, which is a rough figure, not an audited one. Bundled Hunspell dictionaries exist for ro, en-US, en-GB, fr, es and pt only (`dict/`); de and it work only if the user imports a dictionary; there is no Hungarian dictionary, no Hungarian rules, and the language detector knows ro, en, fr, es, pt, it, de and nl but not hu.

Competitor rule counts are almost never published by vendors. The one public per-language statistic found for the LanguageTool engine is from its project-documentation page and describes LanguageTool 6.6 (27 March 2025), so it is about 20 months old. Treat every competitor number below as a lower bound on what exists today and as a snapshot, not a current count.

A note on evidence quality: free-tier limits and Premium prices for LanguageTool are contradictory across sources (see section 3.1). Grammarly, Ginger and Reverso prices come mostly from third-party aggregators because official pricing pages did not load through the research tools.

## 2. Summary matrix

Legend: Y = yes, N = no, P = partial, ? = unverified.

| Capability | ERATA 0.3 | LanguageTool Free | LanguageTool Premium | Harper | Grammarly Free | Microsoft Editor | Chrome/Firefox native | Vale | Ginger / Reverso | LTeX+ (ltex-ls-plus) |
|---|---|---|---|---|---|---|---|---|---|---|
| Runs fully local | Y | N by default (web checking) | N by default | Y | N | N for grammar; spelling local only in Edge "Basic" mode | Y for basic spelling; N for Chrome "Enhanced" | Y | N | P (bundled engine possible; hosted API optional) [unverified details] |
| Text leaves device | No (optional localhost rewrite only) | Yes, to vendor servers | Yes | No | Yes (AWS, US) | Yes (Microsoft cloud) | No (basic); Yes (Chrome enhanced) | No | Yes | No if bundled; yes if hosted API is chosen |
| Account needed | No | Not for the website; the extension page says Premium-only | Yes | No | Yes | Microsoft account | No | No | Yes for most features ? | No |
| Browser extension | Y (Chromium, Firefox; Safari untested) | Site only; extension reportedly Premium-only | Y | Y (Chrome, Firefox, Edge) | Y | Y (Chrome, Edge) | Built in | N | Y | N (editors) |
| Google Docs | N | N | Y (add-on) | P: release notes mention Google Docs fixes [unverified depth] | Y | N ? | N | N | N ? | N |
| Mobile | N | iOS app | iOS app, others ? | N | Y (keyboards) | via Microsoft apps ? | OS spellcheck | N | Y (Reverso apps) | N |
| Desktop apps | N | Windows/macOS apps | same | macOS app | Windows/macOS | Word | n/a | CLI | Y | via editors |
| Paragraph language detection | Y | Y ? | Y ? | N (English only) | ? | ? | N | N | ? | P ("auto" mode in 18.7.0) |
| Diacritic restoration | Y (ro, fr, es, pt) | N ? | N ? | N | N ? | N ? | N | N | N ? | N |
| Custom regex rules | Y | N (Premium has a style guide) | Y (Personal Style Guide, CSV import) | N ? | N | N | N | Y (YAML, regex) | N | via LanguageTool config |
| Import Hunspell dictionaries | Y | N | N | N | N | N | Y (installable dictionaries) | Y | N | N ? |
| LLM / AI rewrite | Optional, local only, off by default | 3 to 5 per day (sources differ) | Unlimited paraphrasing | N (explicitly no LLM) | 100 prompts/month (Free) | Refinements need Microsoft 365 | N | N | Y | N |
| Open source | Y (MIT) | Engine Y; extension N | same | Y (Apache-2.0) | N | N | Y (browsers) | Y (MIT) | N | Y |
| Cost | Free | Free (limited) | See 3.1 | Free | Free; Pro see 3.4 | Free basic; M365 for refinements | Free | Free | See 3.8 | Free |

## 3. Per-product findings

### 3.1 LanguageTool (free and Premium)

Run model: cloud by default. The Chrome Web Store listing (version 11.5.0, updated 21 October 2026, about 2,000,000 users, rating 3.3) states that text is sent to languagetool.org over an encrypted connection by default and that the developer discloses collecting personal communications, website content and user activity. Source: https://chromewebstore.google.com/detail/ai-grammar-checker-paraph/oldceeleldhonbafppcapldpdifcinji (accessed 2026-11-18). A self-hosted server is possible and the extension can point to it, but a third-party review says the self-hosted server contains only base rules **[3rd-party, https://hackceleration.com/labs/switch/languagetool]**.

What data leaves: the privacy policy (https://languagetool.org/legal/privacy, accessed 2026-11-18) says it processes entered text and metadata such as IP, user ID and source URL, that browser extensions may collect content and metadata from sites visited during a session, that retention is "a commercially reasonable period" with no specific period given, and that session-replay and analytics tools are used on the vendor's properties. It also states that LanguageTool user inputs are not used to train the vendor's models. The policy does not mention EU data residency and cites transfer safeguards for non-EEA processing.

Important and unresolved contradiction on extension access: an official help article says the browser extension is now available only to Premium subscribers and that free users keep the web Grammar Checker and Paraphrasing Tool (https://help.languagetool.org/hc/en-us/articles/39254502438551). The Chrome Web Store text fetched the same day says "No account is needed to use this extension". A third-party review says the extension went Premium-only in 2026 without an exact date **[3rd-party]**. ERATA's author should verify this by installing the current extension, because it is the single most favourable market fact for a free, local alternative.

Character limits, all contradictory **[unverified]**: the Premium page fetched at https://languagetool.org/premium shows 2,000 characters per field (free) and 150,000 (Premium); an official help article shows 10,000 and 100,000 (https://help.languagetool.org/en/articles/307894-what-is-the-difference-between-the-free-version-of-languagetool-and-languagetool-premium); a software-download listing shows 10,000 and 40,000 (https://www.majorgeeks.com/files/details/languagetool.html); an aggregator shows 20,000 and 150,000 **[3rd-party]**. The likely explanation is that limits differ by surface (website, extension, API) and have changed over time, but this was not confirmed.

Price: the official pricing figures did not load. Aggregators give $69.90 per year and $24.90 per month **[3rd-party]**, and another gives $4.99 per month **[3rd-party]**; a download listing gives $69.90 per year (majorgeeks, above). Do not quote a price without checking the live page.

Languages and depth: the vendor says 30 or more languages, with the enhanced Premium checks covering English, German, French, Spanish, Dutch, Polish and Portuguese (https://languagetool.org/premium). Its language-support article (published 13 June 2025, revised 10 March 2026) lists Italian and Romanian only as "also supported" and says rephrasing does not cover them (https://languagetool.org/insights/post/product-languages-supported/). Hungarian is not mentioned there and is not on the project's language table. That table (https://dev.languagetool.org/languages, LanguageTool 6.6, March 2025) gives XML-rule counts of Romanian 457, Italian 141, German 5,224, French 6,984, Spanish 1,644, Portuguese 2,919, English 6,074, and marks Romanian and Italian "Inactive" (no rule changes in six months). These are vendor-project statistics, not quality measures, but they show the scale gap with ERATA's roughly one hundred patterns for all languages together. Even for Romanian, where LanguageTool is reportedly stagnant, its count of 457 rules is far above ERATA's 18 rule objects and about 21 table patterns, so ERATA's Romanian advantage is in targeted rules and diacritics, not in count.

Platforms: browser add-ons for Chrome, Edge, Firefox, Opera, Safari; email add-ons (Gmail, Outlook beta, Apple Mail, Thunderbird); Google Docs, Word, Pages, LibreOffice; Windows, macOS and iOS apps (https://languagetool.org/premium).

Project activity: the extension listing shows version 11.5.0 on 21 October 2026 (store link above). For the open-source engine, the developer roadmap page says the last numbered release it lists is 6.6 (27 March 2025) and that since then the project uses daily snapshots without new numbered ZIP files (https://dev.languagetool.org/roadmap). LTeX+ release notes nevertheless reference bundled LanguageTool 6.7 (October 2025) and 6.8 (June 2026) (https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/changelog.html), so the engine is clearly still alive. The page contradiction is flagged **[unverified]**.

Accessibility: no accessibility statement or conformance claim was found **[unverified]**.

### 3.2 Harper

Run model: fully local; the site says checking runs on the device, no telemetry, no LLM, and that data never leaves the device (https://writewithharper.com/). The Chrome store listing says the developer will not collect or use data; permissions on Firefox are tabs and all-sites data (https://addons.mozilla.org/en-GB/firefox/addon/private-grammar-checker-harper).

Languages: English only (US, GB, Canadian, Australian, Indian); other languages are described as a future goal. Therefore Harper offers nothing for ro/fr/es/pt/de/it/hu. Rule count: not published (https://www.everydev.ai/tools/harper says so) **[unverified]**.

Limits: no stated character limit; sub-10 ms suggestions claimed by the vendor.

Price: free, Apache-2.0.

Platforms: macOS desktop app, Chrome, Edge and Firefox extensions, VS Code, Obsidian, Neovim, Zed, WordPress, Emacs/Helix/Sublime configurations, a language server, a JavaScript library and a Rust crate (https://writewithharper.com/). Release notes for v3.1.0 mention Google Docs handling and WordPress Gutenberg improvements (https://newreleases.io/project/github/Automattic/harper/release/v3.1.0), so Google Docs is plausibly supported through the extension but no vendor page confirms it **[unverified]**.

Activity: version 3.2.0 on the Chrome Web Store and Firefox listings, updated 13 November 2026, about 30,000 Chrome users and 6,242 Firefox users (links above and https://chromewebstore.google.com/detail/private-grammar-checking/lodbfhdipoipcjmlebjbgmmgekckhpfb). Very active.

Accessibility: nothing found **[unverified]**.

### 3.3 Grammarly (free)

Run model: cloud. Grammarly's own security FAQ says data is processed on AWS servers in the United States, encrypted in transit and at rest, that anonymized and aggregated samples of user content may be used to improve services unless the user opts out, and that generative-AI prompts go to large-language-model providers who may not train on the content (https://support.grammarly.com/hc/en-us/articles/20916119474829-Privacy-and-security-FAQ).

Languages: the company announced multilingual grammar and spelling on 10 September 2025 for Spanish, French, German, Portuguese and Italian (https://www.grammarly.com/blog/product/multilingual-support-launch/), and on 11 March 2026 extended real-time grammar and spelling to 22 languages including Hungarian and Romanian as a beta that offers correction only, with clarity and tone to follow (https://www.grammarly.com/blog/product/multilingual-support-in-additional-languages/). The article says the quality is still being refined. Depth for ro and hu is therefore unproven and probably thinner than English.

Free-plan limits: 100 AI prompts per month, basic grammar and spelling, tone detection without tone change, no full-sentence rewrites or plagiarism check **[3rd-party: https://eesel.ai/blog/grammarly-pricing, 9 June 2026 and https://costbench.com/software/ai-writing-tools/grammarly/free-plan]**. Pro is $12 per member per month billed annually ($144 upfront) or $30 per month billed monthly **[3rd-party]**. Character limits: none found **[unverified]**.

Platforms: browser extension, Windows and Mac desktop apps, iOS and Android keyboards, Google Docs (aggregator and vendor material; keyboard claim from https://costbench.com above **[3rd-party]**).

Activity: new language launches in September 2025 and March 2026, so highly active. Accessibility: no statement checked **[unverified]**.

### 3.4 Microsoft Editor

Run model: cloud for grammar. Microsoft's support page says that in Edge, typed text for spelling and grammar goes to a Microsoft cloud service that does not store it and deletes it after processing, that text prediction caches typed characters for up to 30 days when enabled, and that Edge "Basic" spellcheck runs only on the device (https://support.microsoft.com/en-au/office/welcome-to-the-microsoft-editor-browser-extension-9a5ee6c4-f6b7-4b26-bbca-cd38a8b44d6a). The extension needs a Microsoft account.

Languages: more than 20. Per Microsoft's availability table, among the eight target languages, English, French, Spanish, Portuguese (both variants), German, Italian and Hungarian have spelling, grammar and refinements, while Romanian has spelling only (https://support.microsoft.com/en-au/word/editor-s-spelling-grammar-and-refinement-availability-by-language). This makes Microsoft Editor the strongest incumbent for Hungarian among the tools studied and weaker than ERATA's targeted rules for Romanian grammar.

Free versus paid: free gives basic spelling and grammar; refinements (clarity, conciseness, formality, vocabulary) require Microsoft 365 (https://support.microsoft.com/office/microsoft-editor-checks-grammar-and-more-in-documents-mail-and-the-web-91ecbe1b-d021-4e9e-a82e-abc4cd7163d7). Character limits: not found **[unverified]**. Platforms: Edge built in, Chrome and Edge extensions, Word for the web, Word for Windows, Outlook on the web. Activity and accessibility statement: not verified; Microsoft products generally publish accessibility conformance reports, but none was fetched **[unverified]**.

### 3.5 Native Chrome and Firefox spellchecking (Hunspell)

Chrome has basic spellcheck provided by the browser or operating system, which does not send text to Google, and "enhanced" spellcheck, which sends text typed in the browser to Google (https://support.google.com/chrome/answer/12027911). Firefox underlines unknown words in multi-line text boxes using installed dictionaries, lets users add dictionaries and enable several at once, and notes some languages ship no dictionary for licensing reasons (https://support.mozilla.org/fi/kb/how-do-i-use-firefox-spell-checker). Neither does grammar. Languages and platform coverage follow the browser and OS dictionaries; the Chrome page does not list languages **[unverified]**. Both are free and local (basic mode), and are the baseline ERATA must beat on spelling quality. Whether ERATA's own Hunspell engine matches the native suggestion quality has not been benchmarked here.

### 3.6 Vale

Vale is an MIT-licensed command-line prose linter for Windows, macOS and Linux, built on YAML style files that may use regular expressions (https://docs.vale.sh). It does not do general grammar checking and gives no advice of its own. It supports non-English Hunspell dictionaries through a custom `spelling` rule, with a stated limitation that `MAP`, `KEY` and `PHONE` directives are not read for suggestions (https://docs.vale.sh/guides/hunspell). Version 3.22.0 is listed on a release tracker with a date only as "2 months ago", so roughly September 2026 **[3rd-party; exact date unverified: https://newreleases.io/project/github/vale-cli/vale/release/v3.22.0]**. Local, no data leaves the machine. No GUI and no browser integration. No character limit was found. Accessibility not applicable in the same sense; not checked.

### 3.7 LTeX and LTeX+ (ltex-ls-plus)

LTeX+ is a language server and VS Code extension that applies LanguageTool to LaTeX, Markdown, Typst, AsciiDoc, Org, Quarto, reStructuredText and other markups, in about 40 languages including de, fr, es, pt, it and others (https://ltex-plus.github.io/ltex-plus/supported-languages.html). Hungarian and Romanian were not named in the part of the page that was readable **[unverified]**. Latest release 18.7.0 dated 13 June 2026, bundling LanguageTool 6.8, with an incremental paragraph re-check; 18.7.1 listed as upcoming (https://ltex-plus.github.io/ltex-plus/ltex-ls-plus/changelog.html). It can run against a bundled checker or a LanguageTool server, and can take LanguageTool Premium credentials, so whether data leaves the machine depends on configuration; the official pages did not state offline behaviour explicitly **[unverified]**. The original LTeX project describes itself as a successor to an abandoned extension and its site shows older version numbers; its last release date could not be established **[unverified]**. Platforms: VS Code, Emacs, Neovim, Sublime, Helix and any LSP client (https://ltex-plus.github.io/ltex-plus/installation-usage.html). Not a browser tool, so it overlaps ERATA only through shared use of an offline engine.

### 3.8 Ginger and Reverso

Reverso's grammar checker is listed as covering English, Spanish, French and Italian (translation 28 languages), with free apps for Mac, Windows, iOS and Android and Chrome, Edge and Firefox extensions; free tier caps text length and document volume without published numbers on the page used; reviewed 13 September 2026 **[3rd-party: https://tooldirectory.ai/tools/reverso]**. It is cloud-based as far as can be inferred; no privacy policy was read **[unverified]**. Neither Romanian nor Hungarian nor German nor Portuguese is listed for Reverso's grammar checker in that source.

Ginger: a Chrome listing says translation covers 40 or more languages and that Ginger "doesn't store any personal data" (https://chrome.google.com/webstore/detail/ginger-ai-grammar-spell-c/kdfieneakcjfaiglcfcgkidlkmlijjnh/reviews). An aggregator gives Premium at $13.99 per month and a free plan with a daily correction cap of unpublished size **[3rd-party: https://toolradar.com/tools/ginger-software/pricing]**. Grammar languages for Ginger were not established **[unverified]**, nor was the date of its last release.

## 4. Language depth for the eight target languages

| Language | ERATA 0.3 | LanguageTool | Harper | Grammarly | Microsoft Editor | Native browser | LTeX+ |
|---|---|---|---|---|---|---|---|
| ro | Bundled Hunspell (about 181k dictionary entries), 18 rule objects, about 21 table patterns, diacritics restoration | 457 XML rules, project marks it inactive; not in rephrasing | N | Beta, correction only (Mar 2026) | Spelling only | Spelling if dictionary installed | Included via LanguageTool, depth as LT |
| en | Bundled US and GB, 5 rule objects, about 17 patterns | 6,074 XML rules plus 686 confusion pairs (LT 6.6) | Yes, deep and fast, count not published | Yes, strongest | Yes | Spelling | Yes |
| fr | Bundled, 5 rule objects, about 4 patterns, spacing rules, diacritics | 6,984 XML rules | N | Yes (since Sep 2025) | Yes | Spelling | Yes |
| es | Bundled, 3 rule objects, about 7 patterns, inverted marks, diacritics | 1,644 XML rules | N | Yes | Yes | Spelling | Yes |
| pt | Bundled (largest dictionary, about 312k entries), 2 rule objects, about 4 patterns | 2,919 XML rules, very active | N | Yes | Yes (BR and PT) | Spelling | Yes |
| de | Only via user-imported dictionary; 2 rule objects, about 3 patterns | 5,224 XML rules | N | Yes | Yes | Spelling | Yes |
| it | Only via user-imported dictionary; 1 rule object, about 5 patterns | 141 XML rules, inactive | N | Yes | Yes | Spelling | Yes |
| hu | None: no dictionary, no rules, not in language detector; imported Hunspell untested | Not in language table | N | Beta, correction only | Spelling, grammar, refinements | Spelling if dictionary installed | Not confirmed |

The ERATA dictionary sizes are raw line counts of `.dic` files and are not a measure of correctness. Competitor counts are the project's own statistic for the 2025 snapshot (section 3.1).

## 5. Where ERATA loses

ERATA's weakest point is raw grammatical coverage. With roughly one hundred hand-written patterns spread across seven languages, it cannot match engines with thousands of rules per major language, and its own README concedes that it has fewer grammar rules than established checkers. Even in English, where its rule set (five rule objects) is the thinnest relative to the market, it faces Harper, a free local competitor that is under very active development, and Grammarly. In German and Italian it has effectively no coverage unless the user imports a dictionary, and Hungarian is entirely missing while Microsoft Editor and Grammarly's beta both cover it.

On AI and style, ERATA offers only two style rules, a Flesch-like readability score and an optional rewrite that must be wired by the user to a localhost model. Grammarly, LanguageTool Premium and Microsoft 365 Editor offer clarity, tone, conciseness and one-click rewriting inside the checker with no setup. ERATA's rewrite path requires the user to run their own inference engine, which is a real barrier for the non-technical audience that would otherwise appreciate a privacy-first tool.

The statistical layer is absent. A search of the source for n-gram, frequency or confusion-pair logic found nothing. LanguageTool reports confusion-pair data (686 pairs for English in the 2025 snapshot), which catches real-word errors such as there/their that Hunspell cannot see and that regex rules cover only for hand-picked phrases. ERATA also has no word-frequency ranking for spelling suggestions, so suggestion order depends on edit-cost heuristics alone, and its first-position hit rate was not measured against native browser spellcheckers.

There is no learning from context. Grammarly and others adapt to a user's accepted and ignored suggestions, domain vocabulary and team style guides. ERATA has a personal dictionary and custom regex rules, which are manual. Premium LanguageTool offers a personal style guide with CSV import; ERATA has the regex rule editor, but nothing resembling shared team configuration.

Surface coverage is narrow. There is no Google Docs support (a canvas editor, as the README admits), no mobile support, no desktop or system-wide integration, and no Word, Outlook or email add-in. Safari is untested, and automated tests run on Chromium only. Distribution status in extension stores is not documented in the repository, so discoverability, auto-update and store review are open questions.

There is also an evidence gap. No false-positive or recall measurement exists against a shared corpus, no external accessibility audit was found, and the project is days old (0.1.0 and 0.2.0 both dated 18 November 2026), so it has no user base, no issue history and no track record of maintenance, which matters for tools users rely on every day. The README also lags the code slightly: it lists dedicated rule packs for ro, en, fr and es, while the 0.2.0 changelog and code add pt, de and it packs of minimal size.

## 6. Where ERATA wins

ERATA's strongest argument is architectural privacy. It has no server, no account, no telemetry and no network permission except an optional, off-by-default localhost rewrite endpoint (PRIVACY.md). LanguageTool, Grammarly and Microsoft Editor all send text to vendor clouds, and the LanguageTool policy discloses extension-level collection of content and metadata, session replay and analytics, and an unspecified retention period. Harper and Vale are the only competitors that match this property, and Harper covers English only, while Vale is a developer tool.

The second advantage is the combination of languages with offline operation. Among local tools, Harper covers English alone; native browser spellchecking covers spelling in many languages without grammar; Vale needs setup. ERATA is the only product reviewed that delivers local spelling plus targeted rules for Romanian, French, Spanish, Portuguese and English in a browser extension. For Romanian specifically, LanguageTool's project marks the language inactive and Microsoft Editor offers spelling only, so ERATA's dedicated rules (cedilla versus comma-below, "să/sa", "într-un", "între 5 și 10", commas before "dar/însă", pleonasms, clitics, "iar/i-ar") address a niche that incumbents serve weakly. Diacritics restoration for ro, fr, es and pt is a feature that none of the other products documented in this study advertises, although absence was not exhaustively verified for every competitor.

Third, ERATA is free of the pricing and limit turbulence around LanguageTool, whose own pages disagree on free limits from 2,000 to 20,000 characters and whose extension may now require a subscription. ERATA has no cap in its user-facing design, but the background script truncates the text it checks at 80,000 characters (extension/background.js, line 188), which is still far above LanguageTool free limits and comparable to LanguageTool Premium, and large-text performance was not tested. Fourth, extensibility is unusual: users can import any Hunspell dictionary, write regex rules, set per-site switches and import or export settings, a combination otherwise found only in Vale, which has no browser UI. Fifth, accessible markers (wavy, solid, dashed, dotted underlines) and a non-intrusive overlay that does not alter the page DOM are explicit design goals; no competitor accessibility claim was found, but ERATA's own accessibility has not been independently audited. Finally, the MIT licence and documented clean-room process make it easy to reuse in public-sector settings such as procurement checks where cloud grammar services are not allowed.

## 7. Prioritised gaps to close (maximum 15)

Effort scale: S is days, M is weeks, L is months. Order reflects impact on the product's stated promise (local, multilingual, deep Romanian) and on credibility.

1. Build an evaluation corpus and publish precision, recall and false-positive rates per language (ro, en, fr, es, pt first), including a comparison against Hunspell-only baseline. Without it every claim above is unmeasured. Effort M.
2. Expand grammar rule coverage in the target languages, starting with the highest-frequency real errors in ro, then en, fr, es, pt, using only original sources (corpus research, official orthography references, grammar handbooks). Effort L, continuous.
3. Add a statistical layer for real-word errors: confusion pairs and a compact n-gram or word-frequency model per language, built from freely licensed corpora, and use word frequency to rank spelling suggestions. Effort L.
4. Add Hungarian: validate that the Hunspell parser handles a Hungarian dictionary, add language detection, and ship a small rule pack. Effort M, with a licence review of the dictionary.
5. Bundle German and Italian dictionaries (licence permitting) and expand the de and it rule packs beyond their current handful of patterns. Effort S for dictionaries, M for rules.
6. Google Docs support, for example through a document-text export or the accessible-DOM mode if available, checked against how Harper handles it (its mechanism is unverified here). Effort L.
7. Mobile: assess Firefox for Android extension support and a Safari iOS build; run and document the Safari path currently labelled untested. Effort M to L.
8. Style and clarity checks that need no AI: passive voice, wordiness, nominalisation, sentence-length variants per language, repeated sentence openings, inclusive-language lists as optional packs. Effort M.
9. Make the optional local LLM rewrite easier: a guided setup for common local runtimes, prompt templates per language, and an optional in-browser model so a localhost server is not mandatory. Effort M to L.
10. Context learning that stays local: remember accepted and ignored suggestions per site and per field, offer to add frequent unknown words to the personal dictionary, and per-domain rule sets. Effort M.
11. Shareable rule packs and team configuration: a signed, versioned import format for custom rules and dictionaries, comparable in function to Vale styles or a style guide with CSV import, plus managed-policy deployment for organisations. Effort M.
12. Cross-browser test automation for Firefox and, where possible, Safari in CI, and a regression suite from the evaluation corpus. Effort S to M.
13. Independent accessibility review (screen-reader announcements of issues, keyboard-only correction flow, contrast of markers, high-contrast mode) and publication of a conformance statement. Effort S to M.
14. Store distribution and trust signals: publish on Chrome Web Store, Edge Add-ons and Firefox Add-ons, with reproducible builds and a public changelog cadence. Effort S.
15. An optional language-server or command-line front end that reuses the core engine, so that it can serve editors and documentation pipelines, an area where LTeX+ and Vale are established. Effort M.

## 8. Items that could not be verified

The live prices for LanguageTool Premium and Grammarly Pro; the correct free and Premium character limits for LanguageTool; whether the LanguageTool browser extension still works without a subscription; Harper's rule count and its exact Google Docs support; LanguageTool rule counts for 2026; the date of Vale 3.22.0 and of the last Ginger and Reverso releases; any accessibility statements for the competitors; Reverso and Ginger grammar languages and privacy terms; whether LTeX+ checks Hungarian and Romanian and how it behaves fully offline; and ERATA's own suggestion quality, false-positive rate and behaviour on a Hungarian dictionary.
