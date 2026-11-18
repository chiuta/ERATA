// Detecție de limbă proprie: cuvinte funcționale + semne diacritice distinctive.
// Listele sunt redactate manual pentru acest proiect.

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));

export const STOPWORDS = {
  ro: L(`și de la în cu pe un o că să nu este sunt care pentru din mai dar sau ca al ale ai ei el ea eu tu noi voi lor cum când unde foarte
    acest această acești acestea fost fi va vor am ați au are avea ne vă își se mi ți doar după între fără până despre peste sub prin către decât
    deci iar însă ci nici tot toate orice nimic aici acolo acum apoi atunci încă deja cel cea cei cele unei unui unor lui ar aș fiind dacă`),
  en: L(`the of and to in is that it for was on are as with his they be at one have this from or had by not but what all were we when your can said
    there use an each which she do how their if will up other about out many then them these so some her would make like him into time has look
    two more go see no way could my than been who its now people only over you i he me our`),
  fr: L(`le la les de des du un une et est en que qui dans pour pas sur au aux ce cette ces il elle ils elles nous vous je tu ne se sont avec par plus
    ou mais son sa ses leur leurs été être avoir comme tout très bien aussi fait y où donc car ni si mon ma mes ton ta tes notre votre`),
  es: L(`el la los las de del que y en un una es se no por con para su sus al lo como más pero o este esta estos estas muy ya también fue son ha han
    hay sin sobre entre cuando todo ser está están yo tú él ella nosotros ellos mi mis tu tus nos les le`),
  pt: L(`o a os as de do da dos das que e em um uma para com não se por mais como mas foi são ao aos seu sua seus suas ele ela eles elas nos já também
    muito só pelo pela está tem têm ser até quando onde isso este esta eu tu você vocês`),
  it: L(`il lo la i gli le di del della dei delle che e in un una per con non è sono si da su come più ma anche o questo questa nel nella al alla ha
    hanno essere molto già loro io tu lui lei noi voi mi ti ci vi`),
  de: L(`der die das und ist in den von zu mit sich des auf für nicht ein eine als auch es an werden aus er hat dass sie nach wird bei einer um am
    sind noch wie einem über einen so zum war haben nur oder aber vor zur bis mehr durch man sein wurde sei ich du wir ihr`),
  nl: L(`de het een en van in is dat op te zijn met voor niet aan er maar om ook als dan bij nog uit naar door over ze zich ik je hij wij`),
};

// litere distinctive și bonusul acordat fiecărei apariții
const CHAR_HINTS = {
  ro: [/[ăâîșțşţ]/giu, 2],
  fr: [/[èêëçœùûàâ]/giu, 1],
  es: [/[ñ¿¡]/giu, 3],
  pt: [/[ãõç]/giu, 2],
  de: [/[ßäöü]/giu, 2],
  it: [/\b(?:gli|che|della|degli)\b/giu, 1],
  nl: [/\b(?:ij|het|een)\b/giu, 1],
};

/**
 * @returns {{lang:string, score:number, confidence:number}|null}
 */
export function detectLanguage(text, { candidates } = {}) {
  const words = text.toLowerCase().match(/[\p{L}]+/gu) || [];
  if (words.length < 3) return null;
  const scores = {};
  for (const lang of Object.keys(STOPWORDS)) {
    if (candidates && !candidates.includes(lang)) continue;
    let s = 0;
    for (const w of words) if (STOPWORDS[lang].has(w)) s += 1;
    const hint = CHAR_HINTS[lang];
    if (hint) s += ((text.match(hint[0]) || []).length * hint[1]) / 2;
    scores[lang] = s / Math.sqrt(words.length);
  }
  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [best, second] = ranked;
  if (!best || best[1] < 0.8) return null;
  const confidence = second ? (best[1] - second[1]) / best[1] : 1;
  return { lang: best[0], score: best[1], confidence };
}
