// GENERAT de scripts/gen-ui-index.mjs — nu edita manual. Textele sunt în extension/i18n/<cod>.js.
import en from './i18n/en.js';
import ro from './i18n/ro.js';
import fr from './i18n/fr.js';
import it from './i18n/it.js';
import es from './i18n/es.js';
import pt from './i18n/pt.js';
import de from './i18n/de.js';
import hu from './i18n/hu.js';
import uk from './i18n/uk.js';
import tr from './i18n/tr.js';
import crh from './i18n/crh.js';
import ru from './i18n/ru.js';
import sr from './i18n/sr.js';
import sk from './i18n/sk.js';
import bg from './i18n/bg.js';
import hr from './i18n/hr.js';
import el from './i18n/el.js';
import yi from './i18n/yi.js';
import cs from './i18n/cs.js';
import pl from './i18n/pl.js';
import hy from './i18n/hy.js';
import rue from './i18n/rue.js';
import sq from './i18n/sq.js';
import mk from './i18n/mk.js';
import rmy from './i18n/rmy.js';

const S = { en, ro, fr, it, es, pt, de, hu, uk, tr, crh, ru, sr, sk, bg, hr, el, yi, cs, pl, hy, rue, sq, mk, rmy };

export const UI_LANGS = {"en":"English","ro":"Română","fr":"Français","it":"Italiano","es":"Español","pt":"Português","de":"Deutsch","hu":"Magyar","uk":"Українська","tr":"Türkçe","crh":"Qırımtatarca","ru":"Русский","sr":"Српски","sk":"Slovenčina","bg":"Български","hr":"Hrvatski","el":"Ελληνικά","yi":"ייִדיש","cs":"Čeština","pl":"Polski","hy":"Հայերեն","rue":"Русиньскый","sq":"Shqip","mk":"Македонски","rmy":"Romani"};
export const UI_RTL = ["yi"];
// Limbi noi, traduse automat și nerevizuite de vorbitori nativi.
export const UI_MACHINE = ["uk","tr","crh","ru","sr","sk","bg","hr","el","yi","cs","pl","hy","rue","sq","mk","rmy"];
const ALIAS = { rom: 'rmy', ydd: 'yi', ji: 'yi', iw: 'he', sh: 'sr' };

export function uiDir(lang) { return UI_RTL.includes(lang) ? 'rtl' : 'ltr'; }

export function t(lang, key, vars = {}) {
  const s = (S[lang] && S[lang][key]) || S.en[key] || key;
  return s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? ''));
}

export function guessUiLang(nav = (globalThis.navigator && navigator.language) || 'en') {
  let l = String(nav).toLowerCase().split(/[-_]/)[0];
  l = ALIAS[l] || l;
  return S[l] ? l : 'en';
}
