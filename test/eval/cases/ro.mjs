// Set de evaluare ETICHETAT pentru română — scris de autorul motorului (NU este independent).
// bad:  [text, at, fixed, nth?]  — `at` = fragmentul greșit (a n-a apariție), `fixed` = propoziția corectată.
// good: text corect, care nu trebuie semnalat de regula respectivă.
export default {
  lang: 'ro',
  rules: {
    RO_CEDILA: {
      bad: [
        ['Am mers la şcoală cu autobuzul.', 'şcoală', 'Am mers la școală cu autobuzul.'],
        ['Ţara noastră are munți frumoși.', 'Ţara', 'Țara noastră are munți frumoși.'],
        ['Îți mulţumesc pentru ajutor.', 'mulţumesc', 'Îți mulțumesc pentru ajutor.'],
        ['Locuim lângă Ploieşti de mulți ani.', 'Ploieşti', 'Locuim lângă Ploiești de mulți ani.'],
      ],
      good: ['Am mers la școală cu autobuzul.', 'Țara noastră are munți frumoși.', 'Îți mulțumesc pentru ajutor.', 'Locuim lângă Ploiești de mulți ani.'],
    },
    RO_DIACRITICE: {
      bad: [
        ['Ion si Maria merg la parc.', 'si', 'Ion și Maria merg la parc.'],
        ['Locuiesc in București de zece ani.', 'in', 'Locuiesc în București de zece ani.'],
        ['Imi place cartea ta.', 'Imi', 'Îmi place cartea ta.'],
        ['Iti trimit un mesaj diseară.', 'Iti', 'Îți trimit un mesaj diseară.'],
      ],
      good: ['Ion și Maria merg la parc.', 'Locuiesc în București de zece ani.', 'Îmi place cartea ta.', 'Ea a spus: „He lives in the city and works there”.'],
    },
    RO_SA: {
      bad: [
        ['Vreau sa merg la mare.', 'sa', 'Vreau să merg la mare.'],
        ['Trebuie sa plec devreme mâine.', 'sa', 'Trebuie să plec devreme mâine.'],
        ['Nu cred ca e bine sa mănânci atât de mult.', 'sa', 'Nu cred ca e bine să mănânci atât de mult.'],
        ['Am vorbit cu sora să, Maria.', 'să', 'Am vorbit cu sora sa, Maria.'],
      ],
      good: ['Vreau să merg la mare.', 'Mama sa a venit ieri.', 'Casa sa este mare și veche.', 'Este cartea sa.', 'Frații lui au plecat, iar sora sa a rămas.'],
    },
    RO_INTR_UN: {
      bad: [
        ['A intrat intr-un magazin de jucării.', 'intr-un', 'A intrat într-un magazin de jucării.'],
        ['Dintr o carte veche am aflat adevărul.', 'Dintr o', 'Dintr-o carte veche am aflat adevărul.'],
        ['Stă intr o casă veche, la marginea satului.', 'intr o', 'Stă într-o casă veche, la marginea satului.'],
      ],
      good: ['A intrat într-un magazin de jucării.', 'Dintr-o carte veche am aflat adevărul.', 'Stă într-o casă veche.', 'Intru în casă și închid ușa.'],
    },
    RO_SINT: {
      bad: [
        ['Noi sîntem acasă în seara asta.', 'sîntem', 'Noi suntem acasă în seara asta.'],
        ['Ei sînt prietenii mei cei mai buni.', 'sînt', 'Ei sunt prietenii mei cei mai buni.'],
        ['Voi sînteți bineveniți aici oricând.', 'sînteți', 'Voi sunteți bineveniți aici oricând.'],
      ],
      good: ['Noi suntem acasă în seara asta.', 'Ei sunt prietenii mei cei mai buni.', 'A fost un om sfânt și blând.'],
    },
    RO_VIZAVI: {
      bad: [
        ['Locuiesc vis-a-vis de bancă.', 'vis-a-vis', 'Locuiesc vizavi de bancă.'],
        ['Magazinul este vis a vis de primărie.', 'vis a vis', 'Magazinul este vizavi de primărie.'],
        ['Stăm visavis de gară.', 'visavis', 'Stăm vizavi de gară.'],
      ],
      good: ['Locuiesc vizavi de bancă.', 'Magazinul este vizavi de primărie.', 'Ne-am așezat față în față.'],
    },
    RO_INTERVAL: {
      bad: [
        ['Au venit între 5-10 oameni la ședință.', 'între 5-10', 'Au venit între 5 și 10 oameni la ședință.'],
        ['Programul se desfășoară de la 10-12 ore.', 'de la 10-12', 'Programul se desfășoară de la 10 la 12 ore.'],
        ['Evenimentul a avut loc între 1990-2000 în capitală.', 'între 1990-2000', 'Evenimentul a avut loc între 1990 și 2000 în capitală.'],
      ],
      good: ['Au venit între 5 și 10 oameni la ședință.', 'Programul este de la 10 la 12.', 'Citiți paginile 5-10 pentru mâine.', 'Telefonul are prefixul 021-555.'],
    },
    RO_VIRGULA_DAR: {
      bad: [
        ['Am venit dar nu era nimeni acasă.', 'venit dar', 'Am venit, dar nu era nimeni acasă.'],
        ['E târziu însă nu mi-e somn deloc.', 'târziu însă', 'E târziu, însă nu mi-e somn deloc.'],
        ['Voiam să ies dar a început ploaia.', 'ies dar', 'Voiam să ies, dar a început ploaia.'],
        ['Ne-am pregătit bine dar tot am pierdut.', 'bine dar', 'Ne-am pregătit bine, dar tot am pierdut.'],
      ],
      good: ['Am venit, dar nu era nimeni acasă.', 'Dar eu nu știu nimic despre asta.', 'Ei au cerut însă clarificări din partea ministerului.', 'Ba dar, nu se poate așa.', 'Nu doar frumos, ci și util.'],
    },
    RO_UNUL_DIN: {
      bad: [
        ['Unul din ei a plecat devreme.', 'din', 'Unul dintre ei a plecat devreme.'],
        ['Fiecare din elevi a primit o carte.', 'din', 'Fiecare dintre elevi a primit o carte.'],
        ['Una din prietenele mele locuiește la Cluj.', 'din', 'Una dintre prietenele mele locuiește la Cluj.'],
        ['Oricare din voi poate răspunde la întrebare.', 'din', 'Oricare dintre voi poate răspunde la întrebare.'],
      ],
      good: ['Unul dintre ei a plecat devreme.', 'Fiecare dintre elevi a primit o carte.', 'Cel mai bun din clasă a fost Andrei.', 'Aerul din cameră era rece.'],
    },
    RO_LUNI_ZILE: {
      bad: [
        ['Voi pleca la mare în Iulie anul acesta.', 'Iulie', 'Voi pleca la mare în iulie anul acesta.'],
        ['Întâlnirea este Luni dimineață la zece.', 'Luni', 'Întâlnirea este luni dimineață la zece.'],
        ['Ne vedem pe 3 Ianuarie la birou.', 'Ianuarie', 'Ne vedem pe 3 ianuarie la birou.'],
      ],
      good: ['Voi pleca la mare în iulie anul acesta.', 'Martie este prima lună de primăvară.', 'Luni este ziua în care încep lucrările.', 'Planeta Marte se vede noaptea.'],
    },
    RO_PLEONASM: {
      bad: [
        ['Vreau să urc sus pe deal înainte de apus.', 'urc sus', 'Vreau să urc pe deal înainte de apus.'],
        ['El a coborât jos în pivniță după vin.', 'coborât jos', 'El a coborât în pivniță după vin.'],
        ['Te rog să repeți din nou ce ai spus.', 'repeți din nou', 'Te rog să repeți ce ai spus.'],
      ],
      good: ['Vreau să urc pe deal înainte de apus.', 'El a coborât în pivniță după vin.', 'Te rog să repeți ce ai spus.', 'Au ieșit din casă și au plecat.'],
    },
    RO_CLITIC_LIPSA: {
      bad: [
        ['Cineva mia spus adevărul ieri.', 'mia spus', 'Cineva mi-a spus adevărul ieri.'],
        ['Ion sa dus acasă după muncă.', 'sa dus', 'Ion s-a dus acasă după muncă.'],
        ['Totul s a terminat repede.', 's a terminat', 'Totul s-a terminat repede.'],
        ['Ție ția dat cartea înapoi?', 'ția dat', 'Ție ți-a dat cartea înapoi?'],
      ],
      good: ['Cineva mi-a spus adevărul ieri.', 'Ion s-a dus acasă după muncă.', 'Totul s-a terminat repede.', 'Cartea mi-a plăcut mult.'],
    },
    RO_IAR_I_AR: {
      bad: [
        ['Lui iar plăcea să cânte în cor.', 'iar plăcea', 'Lui i-ar plăcea să cânte în cor.'],
        ['El iar putea ajuta pe oricine.', 'iar putea', 'El i-ar putea ajuta pe oricine.'],
        ['Nu iar folosi la nimic să plângă.', 'iar folosi', 'Nu i-ar folosi la nimic să plângă.'],
      ],
      good: ['Lui i-ar plăcea să cânte în cor.', 'Eu cânt, iar tu dansezi.', 'Iar mama spune că vine mâine.', 'Ea citește, iar eu scriu.'],
    },
    RO_IA_EA: {
      bad: [
        ['Ia este profesoară la liceu.', 'Ia este', 'Ea este profesoară la liceu.'],
        ['Maria spune că ia este obosită.', 'ia este', 'Maria spune că ea este obosită.'],
        ['Vreau să ea o carte de pe raft.', 'ea o', 'Vreau să ia o carte de pe raft.'],
      ],
      good: ['Ea este profesoară la liceu.', 'Ia cartea de pe masă, te rog.', 'Mama ia pâine de la magazin.', 'Maria spune că ea este obosită.'],
    },
    RO_A_AI_AM: {
      bad: [
        ['Tu a plecat ieri fără să spui nimic.', 'Tu a plecat', 'Tu ai plecat ieri fără să spui nimic.'],
        ['Ea ai terminat lucrarea la timp.', 'Ea ai terminat', 'Ea a terminat lucrarea la timp.'],
        ['Azi eu a cumpărat pâine de la colț.', 'eu a cumpărat', 'Azi eu am cumpărat pâine de la colț.'],
      ],
      good: ['Tu ai plecat ieri fără să spui nimic.', 'Ea a terminat lucrarea la timp.', 'Azi eu am cumpărat pâine de la colț.', 'El a plecat devreme.'],
    },
    RO_ORTO_COMPUSE: {
      bad: [
        ['Deaceea am venit mai devreme.', 'Deaceea', 'De aceea am venit mai devreme.'],
        ['A venit și deasemenea a plecat devreme.', 'deasemenea', 'A venit și de asemenea a plecat devreme.'],
        ['Dealtfel, nu contează deloc.', 'Dealtfel', 'De altfel, nu contează deloc.'],
        ['Erau aproximativ circa 50 de oameni.', 'aproximativ circa', 'Erau aproximativ 50 de oameni.'],
      ],
      good: ['De aceea am venit mai devreme.', 'A venit și de asemenea a plecat.', 'De altfel, nu contează deloc.', 'Erau aproximativ 50 de oameni.'],
    },
    RO_NICIUN: {
      bad: [
        ['Nu am nici un prieten în orașul acesta.', 'nici un', 'Nu am niciun prieten în orașul acesta.'],
        ['Nu este nici o problemă cu asta.', 'nici o', 'Nu este nicio problemă cu asta.'],
        ['Nici un om nu a venit la ședință.', 'Nici un', 'Niciun om nu a venit la ședință.'],
      ],
      good: ['Nu am niciun prieten în orașul acesta.', 'Nu este nicio problemă cu asta.', 'Nici un copil, nici doi nu au venit.', 'N-am văzut nici un om, nici o pasăre.'],
    },
    RO_VIRGULA_CI: {
      bad: [
        ['Nu vreau azi ci mâine dimineață.', 'Nu vreau azi ci', 'Nu vreau azi, ci mâine dimineață.'],
        ['Nu e roșu ci albastru închis.', 'Nu e roșu ci', 'Nu e roșu, ci albastru închis.'],
        ['Nu am plecat ieri ci astăzi.', 'Nu am plecat ieri ci', 'Nu am plecat ieri, ci astăzi.'],
      ],
      good: ['Nu vreau azi, ci mâine dimineață.', 'Nu e roșu, ci albastru închis.', 'Nu mă duc, ci rămân acasă.'],
    },
    RO_VOCATIV_SALUT: {
      bad: [
        ['Salut Maria, ce mai faci?', 'Salut Maria', 'Salut, Maria, ce mai faci?'],
        ['Bună ziua Ion, bine ai venit.', 'Bună ziua Ion', 'Bună ziua, Ion, bine ai venit.'],
        ['Noapte bună Andrei!', 'Noapte bună Andrei', 'Noapte bună, Andrei!'],
      ],
      good: ['Salut, Maria, ce mai faci?', 'Bună ziua, domnule director.', 'Bună seara tuturor.', 'Noapte bună, copii!'],
    },

    // ---- reguli comune ----
    DOUBLE_SPACE: {
      bad: [
        ['Am  mers la cumpărături ieri.', '  ', 'Am mers la cumpărături ieri.'],
        ['Ea citește o carte  veche.', '  ', 'Ea citește o carte veche.'],
        ['Mâine   plecăm devreme.', '   ', 'Mâine plecăm devreme.'],
      ],
      good: ['Am mers la cumpărături ieri.', 'Ea citește o carte veche.', 'Prima linie.\n  A doua linie indentată.'],
    },
    SPACE_BEFORE_PUNCT: {
      bad: [
        ['Bună , lume frumoasă.', ' ,', 'Bună, lume frumoasă.'],
        ['Ce faci ?', ' ?', 'Ce faci?'],
        ['Vino acum !', ' !', 'Vino acum!'],
      ],
      good: ['Bună, lume frumoasă.', 'Ce faci?', 'Așteaptă... nu pleca încă.', 'Prețul este 5,50 lei.'],
    },
    SPACE_AFTER_PUNCT: {
      bad: [
        ['Am venit,dar nu era nimeni.', ',', 'Am venit, dar nu era nimeni.'],
        ['Salut.Ce mai faci astăzi?', '.', 'Salut. Ce mai faci astăzi?'],
        ['Ai mâncat?Eu nu am mâncat încă.', '?', 'Ai mâncat? Eu nu am mâncat încă.'],
      ],
      good: ['Am venit, dar nu era nimeni.', 'Vizitați www.exemplu.ro pentru detalii.', 'Scrie la ion.popescu@exemplu.ro mâine.', 'Prețul este 3,5 lei.'],
    },
    PUNCT_REPEAT: {
      bad: [
        ['Am venit,, dar nu era nimeni.', ',,', 'Am venit, dar nu era nimeni.'],
        ['A plecat;; apoi s-a întors.', ';;', 'A plecat; apoi s-a întors.'],
        ['Totul s-a terminat..', '..', 'Totul s-a terminat.'],
      ],
      good: ['Am venit, dar nu era nimeni.', 'Așteaptă... nu pleca încă.', 'Poate… cine știe?'],
    },
    REPEATED_WORD: {
      bad: [
        ['Am mers la la magazin ieri.', ' la', 'Am mers la magazin ieri.', 1],
        ['Cartea este este pe masă.', ' este', 'Cartea este pe masă.', 1],
        ['Mâine vom vom pleca devreme.', ' vom', 'Mâine vom pleca devreme.', 1],
      ],
      good: ['Am mers la magazin ieri.', 'Nu, nu vreau să plec.', 'Mai, mai vezi tu.'],
    },
    SENTENCE_CAPITAL: {
      bad: [
        ['Am venit acasă. apoi am mâncat.', 'apoi', 'Am venit acasă. Apoi am mâncat.'],
        ['Ploaia s-a oprit. soarele a ieșit din nori.', 'soarele', 'Ploaia s-a oprit. Soarele a ieșit din nori.'],
        ['El a plecat. ea a rămas singură.', 'ea', 'El a plecat. Ea a rămas singură.'],
      ],
      good: ['Am venit acasă. Apoi am mâncat.', 'Dr. popescu a venit la consultație.', 'Mi-am luat pâine, lapte etc. și am plecat.', 'Locuiesc pe str. Mihai Eminescu, nr. 5.'],
    },
    UNPAIRED_BRACKET: {
      bad: [
        ['Am plecat (fără să spun nimic.', '(', undefined],
        ['Am plecat fără să spun) nimic.', ')', undefined],
        ['Lista [pâine, lapte este scurtă.', '[', undefined],
      ],
      good: ['Am plecat (fără să spun nimic).', '(a) primul punct; (b) al doilea punct.', 'Mulțumesc pentru ajutor :)', '1) unu 2) doi 3) trei'],
    },
    TYPOGRAPHIC_QUOTES: {
      bad: [
        ['El a spus "da" imediat.', '"da"', 'El a spus „da” imediat.'],
        ['Cuvântul "casă" are patru litere.', '"casă"', 'Cuvântul „casă” are patru litere.'],
        ['Am citit "Moromeții" într-o seară.', '"Moromeții"', 'Am citit „Moromeții” într-o seară.'],
      ],
      good: ['El a spus „da” imediat.', 'Cuvântul „casă” are patru litere.', 'Am citit „Moromeții” într-o seară.'],
    },
    WRONG_OPEN_QUOTE: {
      bad: [
        ['Ea a spus “da” fără ezitare.', '“', 'Ea a spus „da” fără ezitare.'],
        ['Titlul “Moromeții” e cunoscut.', '“', 'Titlul „Moromeții” e cunoscut.'],
        ['El a strigat “fugiți” spre mulțime.', '“', 'El a strigat „fugiți” spre mulțime.'],
      ],
      good: ['Ea a spus „da” fără ezitare.', 'Titlul „Moromeții” e cunoscut.', 'El a strigat „fugiți” spre mulțime.'],
    },
    SPACED_HYPHEN: {
      bad: [
        ['București - capitala României, este mare.', ' - ', 'București – capitala României, este mare.'],
        ['Ion - prietenul meu, a venit.', ' - ', 'Ion – prietenul meu, a venit.'],
        ['Cartea - o poveste veche, a plăcut.', ' - ', 'Cartea – o poveste veche, a plăcut.'],
      ],
      good: ['București – capitala României, este mare.', 'Este o zi bine-venită.', 'A cumpărat 5 - 3 = 2 mere.', '— Vii mâine? a întrebat Ion.'],
    },
    UNIT_SPACE: {
      bad: [
        ['Distanța este de 5km pe jos.', '5km', 'Distanța este de 5 km pe jos.'],
        ['Fișierul are 20MB în total.', '20MB', 'Fișierul are 20 MB în total.'],
        ['Punga cântărește 3,5kg exact.', '3,5kg', 'Punga cântărește 3,5 kg exact.'],
      ],
      good: ['Distanța este de 5 km pe jos.', 'Fișierul are 20 MB în total.', 'Formula este H2O sau CO2.', 'Viteza este 50 km/h.'],
    },
    SPACE_BEFORE_CLOSE_BRACKET: {
      bad: [
        ['Am plecat ( fără să spun nimic).', '( ', 'Am plecat (fără să spun nimic).'],
        ['Am plecat (fără să spun nimic ).', ' )', 'Am plecat (fără să spun nimic).'],
        ['Cartea ( veche) era pe masă.', '( ', 'Cartea (veche) era pe masă.'],
      ],
      good: ['Am plecat (fără să spun nimic).', 'Cartea (veche) era pe masă.', 'Lista (a, b, c) este completă.'],
    },
    SPELLING: {
      bad: [
        ['Copiii merg la scoala în fiecare zi.', 'scoala', 'Copiii merg la școala în fiecare zi.'],
        ['Mâine vom avea o intâlnire importantă.', 'intâlnire', 'Mâine vom avea o întâlnire importantă.'],
        ['Am cumparat pâine proaspătă de la magazin.', 'cumparat', 'Am cumpărat pâine proaspătă de la magazin.'],
        ['Profesorul a explicat lectia foarte clar.', 'lectia', 'Profesorul a explicat lecția foarte clar.'],
        ['Ea locuiește într-un oras mare din nord.', 'oras', 'Ea locuiește într-un oraș mare din nord.'],
        ['Vremea este placuta astăzi la munte.', 'placuta', 'Vremea este plăcută astăzi la munte.'],
        ['Am primit un mesaj de la un prietan vechi.', 'prietan', 'Am primit un mesaj de la un prieten vechi.'],
        ['Cartea aceasta este foarte intresantă.', 'intresantă', 'Cartea aceasta este foarte interesantă.'],
      ],
      good: [
        'Copiii merg la școală în fiecare zi.',
        'Mâine vom avea o întâlnire importantă.',
        'Am cumpărat pâine proaspătă de la magazin.',
        'Vremea este plăcută astăzi la munte.',
        'Am primit un mesaj de la un prieten vechi.',
        'Brașovul și Sibiul sunt orașe din Transilvania.',
        'Ioana a plecat la București cu trenul de dimineață.',
        'Cartea aceasta este foarte interesantă.',
      ],
    },
    STYLE_LONG_SENTENCE: {
      bad: [
        ['Dimineața, când m-am trezit și am văzut că ploua mărunt peste acoperișurile vechi ale orașului, am hotărât să nu mai plec la serviciu și să rămân acasă, unde am pregătit o cafea lungă, am deschis fereastra, am citit câteva pagini dintr-o carte veche pe care o primisem de la bunicul meu și am așteptat ca ploaia să înceteze, deși știam foarte bine că nu se va opri curând.', 'Dimineața', undefined],
        ['Primarul a anunțat că lucrările la noua centură a orașului vor începe în primăvară, după ce autoritățile vor semna toate documentele necesare, vor primi aprobările de la ministerele implicate, vor desemna constructorul prin licitație publică și vor stabili împreună cu locuitorii traseul exact al drumului, astfel încât să fie afectate cât mai puține gospodării.', 'Primarul', undefined],
        ['Deși profesorii au cerut de mai multe ori ca regulamentul școlii să fie modificat, iar părinții au semnat petiții și au venit la ședințe în fiecare lună, conducerea instituției a amânat decizia până când inspectoratul a trimis o comisie care a verificat dosarele, a vorbit cu elevii și a recomandat schimbări importante în programul zilnic.', 'Deși', undefined],
      ],
      good: [
        'Dimineața am rămas acasă, am pregătit o cafea și am citit câteva pagini dintr-o carte veche pe care o primisem de la bunicul meu.',
        'Primarul a anunțat că lucrările la noua centură vor începe în primăvară, după semnarea documentelor și desemnarea constructorului prin licitație publică.',
        'Profesorii au cerut modificarea regulamentului, iar părinții au semnat petiții, dar decizia a fost amânată până la sosirea unei comisii de verificare.',
      ],
    },
    STYLE_REPEATED_WORD: {
      bad: [
        ['Orașul este mare, iar orașul vechi are străzi înguste, dar orașul nou are bulevarde largi.', 'orașul', undefined, 2],
        ['Proiectul a început în martie, proiectul a continuat în vară și proiectul s-a încheiat în toamnă.', 'proiectul', undefined, 2],
        ['Elevii au venit devreme, elevii au citit mult și elevii au plecat târziu acasă.', 'elevii', undefined, 2],
      ],
      good: [
        'Orașul este mare, iar partea veche are străzi înguste, dar cartierul nou are bulevarde largi.',
        'Proiectul a început în martie și s-a încheiat în toamnă, după două etape de lucru.',
        'Elevii au venit devreme, au citit mult și au plecat târziu acasă, mulțumiți de rezultat.',
      ],
    },
  },
};
