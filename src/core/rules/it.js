// Regole per l'italiano, scritte in modo originale per ERATA.
import { M, rule, tableRule } from './util.js';

const L = (s) => new Set(s.split(/\s+/).filter(Boolean));
export const itPack = { abbr: L('sig sig.ra dott prof ing avv ecc pag art es'), repeatOk: L('che di la') };

export const itRules = [
  tableRule('IT_GRAMMATICA', 'grammar', [
    [/\b(perch|poich|affinch|giacch|finch|sebben)è\b/giu, (m) => m[0].slice(0, -1) + 'é', M('Le congiunzioni in -ché hanno l’accento acuto', 'Conjunctions in -ché take an acute accent'), 'IT_ACCENTO_CHE'],
    [/\b(un) (amica|altra|isola|ora|idea|opera|attrice|università|erba)\b/giu, (m) => `un’${m[2]}`, M('Davanti a vocale, il femminile vuole l’apostrofo: «un’»', 'Feminine nouns elide: “un’”'), 'IT_ELISIONE'],
    [/\b(un’|un') (amico|altro|uomo|albero)\b/giu, (m) => `un ${m[2]}`, M('Il maschile non vuole l’apostrofo', 'Masculine nouns take no apostrophe'), 'IT_ELISIONE_M'],
    [/\bqual'è\b/giu, 'qual è', M('«qual è» si scrive senza apostrofo', '“qual è” has no apostrophe'), 'IT_QUAL_E'],
    [/\bpò\b/giu, "po'", M('Troncamento di «poco»: «po’»', 'Truncation of “poco”: “po’”'), 'IT_PO'],
  ]),
];
