// Detecție de limbă proprie: cuvinte funcționale, litere distinctive, terminații și elisiuni.
// Listele sunt redactate manual pentru acest proiect (nu provin din corpusuri sau biblioteci externe).
// Un cuvânt funcțional prezent în mai multe limbi contribuie cu 1/k din greutate fiecărei limbi,
// astfel încât formele ambigue (de, que, se, no, e, a...) nu decid singure.

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const STOPWORDS = {
  ro: L(`și de la în cu pe un o a că să nu este sunt care pentru din mai dar sau ca al ale ai ei el ea eu tu noi voi lor cum când unde foarte
    acest această acești acestea fost fi va vor am ați au are avea ne vă își se mi ți doar după între fără până despre peste sub prin către decât
    deci iar însă ci nici tot toate orice nimic aici acolo acum apoi atunci încă deja cel cea cei cele unei unui unor lui ar aș fiind dacă
    acel acea aceea aceia aceste aceasta asta eram era erau fie fiecare vom veți vei putea poate pot putem ceva cineva nimeni cât câte câți câtă
    cărei cărui căror ceea ce cine mea mei mele meu tău tale ta său sa sale săi noastră nostru voastră vostru îți îmi mă într dintr spre lângă
    deoarece fiindcă totuși așadar chiar numai prea tare mult multă mulți multe puțin puțină bine rău așa astfel cam mereu uneori niciodată
    ieri azi mâine astăzi seara dimineața stau stă merg merge vine vin făcut face fac zice spune spus dat vrea vreau trebuie fost sunt eram
    mine tine el ei dânsul dânsa ale altă alt alte alți altul altfel anume sper ori niște nişte unele unii unul una`),
  en: L(`the a of and to in is that it for was on are as with his they be at one have this from or had by not but what all were we when your can said
    there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look
    two more go see no way could my than been who its now people only over you i he me our
    because while where why very just also any such much most being does did done doing am should might must shall may after before again
    against between during through under until above below off down own same too both few those here once every another still yet never always
    often rather quite almost already enough around among without within upon toward towards whether either neither nor although though
    unless since whose whom itself himself herself themselves myself yourself ourselves yours mine ours theirs hers don isn aren wasn weren
    hasn haven hadn doesn didn won wouldn can couldn shouldn let lets get got gets going gone made makes take took taken give gave given
    know knew known think thought want wanted need needed come came say says tell told ask asked work works first last new old good great
    little own right big high small large next early young important able`),
  fr: L(`le la les de des du un une et est en que qui dans pour pas sur au aux a ce cette ces il elle ils elles nous vous je tu ne se sont avec par plus
    ou mais son sa ses leur leurs été être avoir comme tout très bien aussi fait y où donc car ni si mon ma mes ton ta tes notre votre
    cet quel quelle quels quelles lequel laquelle lesquels dont chez sous vers entre depuis pendant avant après sans contre selon malgré lors
    alors puis encore déjà jamais toujours souvent parfois peu beaucoup trop assez moins autre autres même mêmes chaque plusieurs quelques
    quelque aucun aucune personne rien tous toutes toute ceux celle celles celui ceci cela ça là ici voici voilà était étaient sera seront
    serait avait avaient avons avez ont ai as aura auront eu eue suis es sommes êtes fut faire fais font fera peut peuvent pouvoir doit doivent
    devoir veut veulent vouloir dit dire va vont aller me te lui moi toi eux soi nos vos nôtre vôtre quand comment pourquoi lorsque puisque
    parce quoique ainsi cependant pourtant oui non était fois jour jours`),
  es: L(`el la los las de del que y e a en un una es se no por con para su sus al lo como más pero o este esta estos estas muy ya también fue son ha han
    hay sin sobre entre cuando todo ser está están yo tú él ella nosotros ellos mi mis tu tus nos les le
    ese esa esos esas eso esto aquel aquella aquellos aquellas aquello otro otra otros otras mismo misma mismos mismas cada todos todas toda
    tanto tanta tantos tantas poco poca pocos pocas mucho mucha muchos muchas algo alguien alguno alguna algunos algunas ninguno ninguna nadie
    nada ni sí tampoco además aunque porque pues sino donde dónde cómo qué quién quiénes cuál cuáles cuándo cuánto cuánta hasta desde durante
    antes después ahora entonces siempre nunca aquí allí allá así bien mal mejor peor menos casi solo sólo había habían hubo he has hemos
    habéis era eran fui fueron será serán sería soy eres somos sois estaba estaban estoy estás estamos estuvo tiene tienen tengo tienes
    tenemos puede pueden podía hacer hace hacen hizo dice dicen dijo ir va van voy vamos ver visto te ellas ustedes usted vosotros vuestro
    vuestra nuestro nuestra suyo suya`),
  pt: L(`o a os as de do da dos das que e em um uma para com não se por mais como mas foi são ao aos seu sua seus suas ele ela eles elas nos já também
    muito só pelo pela está tem têm ser até quando onde isso este esta eu tu você vocês
    no na nas num numa nuns numas pelos pelas dum duma àquele aquele aquela aquilo isto esse essa esses essas estes estas outro outra outros
    outras mesmo mesma cada todo toda todos todas tanto tanta tantos pouco pouca muitos muita muitas algum alguma alguns algumas nenhum nenhuma
    ninguém nada algo nem sim ou porque pois porém contudo todavia embora enquanto entre sobre sem sob após antes depois durante desde agora
    então sempre nunca aqui ali lá assim bem mal melhor pior menos quase havia haviam houve tinha tinham tive teve foram será serão seria era
    eram sou és somos estou estás estamos estava estavam esteve tenho tens temos pode podem podia fazer faz fazem fez diz dizem disse ir vai
    vão vou vamos ver visto me te lhe lhes meu minha meus minhas teu tua nosso nossa vosso vossa dele dela deles delas nele nela neles nelas`),
  it: L(`il lo la i gli le di a o del della dei delle che e in un una per con non è sono si da su come più ma anche o questo questa nel nella al alla ha
    hanno essere molto già loro io tu lui lei noi voi mi ti ci vi
    uno dello degli dal dalla dai dalle nei nelle sul sulla sui sulle col coi allo agli alle questi queste quello quella quelli quelle stesso
    stessa stessi altro altra altri altre ogni tutto tutta tutti tutte nessuno nessuna niente nulla qualche qualcuno qualcosa ancora sempre mai
    quando dove perché poiché mentre sebbene però quindi dunque allora poi prima dopo durante fra tra senza sotto sopra verso presso contro
    oltre fino qui qua lì così bene male meglio peggio meno poco troppo tanto quanto era erano fu furono sarà saranno sarebbe ero sei siamo
    siete stato stata stati state ho hai abbiamo avete aveva avevano ebbe avrà fa fanno fatto può possono potere deve devono dovere vuole
    vogliono volere dice dicono detto va vanno andare vedere mio mia miei mie tuo tua tuoi tue suo sua suoi sue nostro nostra vostro vostra
    siano sia siamo siete devo devi dobbiamo facciamo fare fatto dire dico vado vai vedo so sai sa sanno voglio vuoi posso puoi possiamo
    davvero domani oggi ieri stasera adesso ora subito spesso forse certo magari sì grazie prego ciao nostri nostre vostri vostre suoi
    cui quale quali chi cosa cose dentro fuori accanto lontano vicino contro insieme invece infatti inoltre ovvero oppure eppure
    tuttavia comunque quindi pure neanche nemmeno neppure affatto abbastanza assai piuttosto circa quasi solo soltanto sempre
    sulla nello negli nelle nei dall dell all nell sull`),
  de: L(`der die das und ist in den von zu mit sich des auf für nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am
    sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei ich du wir ihr
    dem eines wenn weil ob denn doch schon wieder immer nie niemals sehr viel viele vielen wenig wenige alle allen alles jede jeder jedes jeden
    kein keine keinen keinem keiner mein meine meinen dein deine seine seinen ihre ihren unser unsere euer dieser diese dieses diesem diesen
    jener welche welcher welches was wer wem wen wo wohin woher warum wann wieso hier dort da dann damit dafür dagegen darauf daran darüber
    darum deshalb deswegen daher jedoch trotz während wegen gegen ohne unter zwischen seit im ins vom beim ans aufs fürs hatte hatten wäre
    wären wurden worden gewesen geworden kann können konnte muss müssen musste soll sollen sollte will wollen wollte darf dürfen mag möchte
    bin bist seid habe hast habt ihm ihn ihnen mir mich dir dich uns euch
    heute morgen gestern jetzt später früher bald oft selten manchmal vielleicht wirklich eigentlich sogar etwa fast kaum genug ganz gar
    gut besser beste schlecht groß klein neu alt lang kurz hoch früh spät erst zuerst zuletzt anders gleich beide beiden mal doch
    ja nein bitte danke leider also nämlich außerdem zudem übrigens bereits endlich sofort gerade nun`),
  nl: L(`de het een en van in is dat op te zijn met voor niet aan er maar om ook als dan bij nog uit naar door over ze zich ik je hij wij
    dit deze die zo wat wie waar waarom wanneer hoe omdat toen terwijl want of zonder tussen tegen onder boven naast achter tijdens sinds tot
    hun haar hem ons onze mijn jouw uw zij jullie u wordt worden werd werden geweest heeft hebben had hadden kan kunnen kon konden moet
    moeten moest zal zullen zou zouden wil willen wilde mag mogen alle alles veel weinig meer meest geen niets niemand iets iemand elke
    ieder andere ander zelf nu hier daar dus echter toch al weer altijd nooit vaak soms heel zeer erg
    vandaag morgen gisteren later vroeger misschien echt eigenlijk zelfs bijna nauwelijks genoeg best goed beter slecht groot klein nieuw oud
    lang kort hoog laat eerst anders gelijk beide ja nee alsjeblieft dank helaas ook verder bovendien overigens reeds eindelijk meteen
    net ons naar mij mijn me haar`),
};

// Număr de limbi în care apare fiecare cuvânt funcțional → greutate 1/k.
const WEIGHT = (() => {
  const count = new Map();
  for (const set of Object.values(STOPWORDS)) for (const w of set) count.set(w, (count.get(w) || 0) + 1);
  const out = {};
  for (const [lang, set] of Object.entries(STOPWORDS)) {
    out[lang] = new Map();
    // cuvintele de 1–2 litere sunt cele mai ambigue: greutate redusă
    for (const w of set) out[lang].set(w, (1 / count.get(w)) * (w.length === 1 ? 0.4 : w.length === 2 ? 0.75 : 1));
  }
  return out;
})();

// litere distinctive: [limbă, greutate pe apariție] — cumulativ pe text întreg
const CHARS = [
  [/[ășțşţ]/gu, { ro: 2.5 }],
  [/[âî]/gu, { ro: 0.8, fr: 0.5, pt: 0.2 }],
  [/[èù]/gu, { fr: 0.7, it: 0.8 }],
  [/[êëœû]/gu, { fr: 1.2 }],
  [/à/gu, { fr: 0.3, it: 0.4, pt: 0.4 }],
  [/ç/gu, { fr: 1, pt: 1 }],
  [/[ñ¿¡]/gu, { es: 3 }],
  [/[ãõ]/gu, { pt: 3 }],
  [/[ôê]/gu, { pt: 0.8, fr: 0.8 }],
  [/[ìò]/gu, { it: 2 }],
  [/ß/gu, { de: 3 }],
  [/[äö]/gu, { de: 1.5 }],
  [/ü/gu, { de: 1, es: 0.2, fr: 0.2 }],
  [/ï/gu, { nl: 1, fr: 0.5 }],
];

// terminații/fragmente de cuvânt (pe cuvinte de ≥4 litere): [regex, greutăți]
const SHAPES = [
  [/(?:ului|ilor|elor|ește|ească|ității|ațiune|ațiuni|iune|iuni|eală|ățile|ării|ând|înd)$/u, { ro: 1 }],
  [/(?:ției|ția|ție|ții)$/u, { ro: 0.8 }],
  [/(?:ement|ements|eaux|euse|euses|eux|ières?|aient|ique|iques|tions|ouille)$/u, { fr: 0.9 }],
  [/(?:ción|ciones|miento|mientos|aron|ieron|ían|ías|ando|iendo|dad|dades|ísimo)$/u, { es: 0.9 }],
  [/(?:ção|ções|ão|ões|ência|ências|mento|mentos|ável|inha|inhas|inho|inhos|eira|eiro)$/u, { pt: 1 }],
  [/(?:zione|zioni|ità|ssimo|ggio|ggi|mente|etto|etta|ello|ella|ando|endo)$/u, { it: 0.6, es: 0.1, pt: 0.1 }],
  [/(?:zione|zioni|ità|ssim[oaie]|ggio|cchi|cche|zza|gnare)$/u, { it: 0.7 }],
  [/(?:ung|ungen|heit|keit|lich|lichen|ischen|chen|lein|schaft|schaften|sche|schen|ig|ern)$/u, { de: 0.8 }],
  [/(?:lijk|lijke|heid|ische|isch|aar|aan|ing|ingen|ijk)$/u, { nl: 0.8, de: 0.1, en: 0.1 }],
  [/(?:ing|ings|ness|ous|ful|able|ably|ight|ough|tch|ally|ment|ments|tion|tions|sion|ed)$/u, { en: 0.7, fr: 0.1 }],
  [/ij/u, { nl: 1.3 }],
  [/^(?:sch|spr|str)/u, { de: 0.5 }],
  [/sch/u, { de: 0.5, nl: 0.1 }],
  [/(?:lh|nh)/u, { pt: 0.7 }],
  [/ll/u, { es: 0.3, it: 0.3, en: 0.3, fr: 0.2, pt: 0.1 }],
  [/gli|cchi|gn[aeio]/u, { it: 0.6 }],
  [/th/u, { en: 0.5 }],
  [/(?:eau|oux|oir|ais|ait)$/u, { fr: 0.5 }],
  [/(?:oo|ee)/u, { en: 0.15, nl: 0.15 }],
];

// elisiuni cu apostrof: l'amour, qu'il, dell'anno, don't
const ELISION = [
  [/^(?:qu|j|jusqu|lorsqu|puisqu|aujourd)['’]/u, { fr: 1.5 }],
  [/^(?:l|d|n|s|c|m|t)['’]/u, { fr: 0.7, it: 0.5 }],
  [/^(?:dell|all|nell|sull|dall|un|anch|quest|quell|senz|com|dov|cos|nessun|sant|bell)['’]/u, { it: 1.5 }],
  [/(?:n['’]t|['’](?:re|ve|ll|s|m|d))$/u, { en: 1 }],
];

const TOKEN = /\p{L}+(?:['’]\p{L}+)*/gu;
const MIN_EVIDENCE = 0.9;

function accumulate(scores, weights, mul = 1) {
  for (const lang in weights) if (lang in scores) scores[lang] += weights[lang] * mul;
}

/**
 * Scoruri brute pe limbă (descrescător), fără decizie.
 * @returns {{ranked:[string,number][], words:number}}
 */
export function scoreLanguages(text, { candidates } = {}) {
  const lower = text.toLowerCase();
  const words = lower.match(TOKEN) || [];
  if (words.length < 3) return { ranked: [], words: words.length };
  const langs = Object.keys(STOPWORDS).filter((l) => !candidates || candidates.includes(l));
  const scores = {};
  for (const l of langs) scores[l] = 0;

  for (const w of words) {
    for (const lang of langs) {
      const wt = WEIGHT[lang].get(w);
      if (wt) scores[lang] += wt;
    }
    if (w.includes("'") || w.includes('’')) {
      for (const [re, wts] of ELISION) if (re.test(w)) accumulate(scores, wts);
      // partea de după apostrof, ca cuvânt de sine stătător (l'homme, dell'anno)
      const tail = w.split(/['’]/).pop();
      for (const lang of langs) {
        const wt = WEIGHT[lang].get(tail);
        if (wt) scores[lang] += wt * 0.5;
      }
    }
    if (w.length >= 4) for (const [re, wts] of SHAPES) if (re.test(w)) accumulate(scores, wts);
  }
  for (const [re, wts] of CHARS) {
    const n = (lower.match(re) || []).length;
    if (n) accumulate(scores, wts, Math.min(n, 6));
  }

  return { ranked: Object.entries(scores).sort((a, b) => b[1] - a[1]), words: words.length };
}

/**
 * @returns {{lang:string, score:number, confidence:number, evidence:number}|null}
 */
export function detectLanguage(text, options = {}) {
  const { ranked, words } = scoreLanguages(text, options);
  const [best, second] = ranked;
  if (!best || best[1] < MIN_EVIDENCE) return null;
  const confidence = second ? (best[1] - second[1]) / best[1] : 1;
  return { lang: best[0], score: best[1] / Math.sqrt(words), confidence, evidence: best[1] };
}

// Citate între ghilimele: «…», “…”, „…”, "…" (cu margini de lungime pentru a evita costul pe texte patologice)
const QUOTE_SRC = '«[^»]{8,600}»|“[^”]{8,600}”|„[^”“]{8,600}[”“]|"[^"\\n]{8,600}"';

/**
 * Textul pe care se bazează limba unui paragraf: fără citatele lungi (poate fi într-o altă limbă),
 * dacă restul este suficient de lung (≥ 8 cuvinte); altfel textul întreg.
 */
export function analysisText(text) {
  if (text.length < 80 || !/["«“„]/.test(text)) return text;
  const outside = text.replace(new RegExp(QUOTE_SRC, 'gu'), ' ');
  if (outside.length === text.length) return text;
  return (outside.match(TOKEN) || []).length >= 8 ? outside : text;
}

/** Limba unui paragraf (cu `analysisText`), pe baza cuvintelor funcționale și a formelor de cuvânt. */
export function detectParagraphLanguage(text, options) {
  return detectLanguage(analysisText(text), options);
}

/**
 * Citate de cel puțin 4 cuvinte dintr-o limbă clar diferită de `lang`.
 * @returns {{start:number,end:number,lang:string}[]} intervale (fără ghilimele)
 */
export function foreignQuoteSpans(text, lang, max = 40) {
  const out = [];
  if (text.length < 40 || !/["«“„]/.test(text)) return out;
  for (const m of text.matchAll(new RegExp(QUOTE_SRC, 'gu'))) {
    if (out.length >= max) break;
    const inner = m[0].slice(1, -1);
    if ((inner.match(TOKEN) || []).length < 4) continue;
    const d = detectLanguage(inner);
    if (d && d.lang !== lang && d.confidence >= 0.3 && d.evidence >= 2.5) out.push({ start: m.index + 1, end: m.index + m[0].length - 1, lang: d.lang });
  }
  return out;
}
