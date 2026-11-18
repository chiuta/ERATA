// Fundalul extensiei: găzduiește motorul ERATA (local, fără rețea) și răspunde mesajelor.
import { Erata, LANGUAGES, DEFAULT_OPTS } from '../src/core/engine.js';
import { guessUiLang } from './ui-strings.js';

const api = globalThis.browser ?? globalThis.chrome;

export const DEFAULT_SETTINGS = {
  enabled: true,
  lang: 'auto',
  defaultLang: 'ro',
  enVariant: 'auto',
  ui: guessUiLang(),
  categories: { spelling: true, grammar: true, punctuation: true, typography: true, style: true },
  disabledRules: [],
  personal: [],
  userRules: [],
  disabledSites: [],
  longSentence: 40,
  hideNative: true,
  badge: true,
  llm: { enabled: false, endpoint: 'http://127.0.0.1:11434/v1/chat/completions', model: '' },
};

let settings = { ...DEFAULT_SETTINGS };
const ready = (async () => {
  const stored = await api.storage.local.get('settings');
  settings = merge(DEFAULT_SETTINGS, stored.settings || {});
  await refreshCustomLangs();
})();

function merge(a, b) {
  return { ...a, ...b, categories: { ...a.categories, ...(b.categories || {}) }, llm: { ...a.llm, ...(b.llm || {}) } };
}

api.storage.onChanged.addListener((ch, area) => {
  if (area === 'local' && ch.settings) settings = merge(DEFAULT_SETTINGS, ch.settings.newValue || {});
});

// ---------- dicționare ----------
const idb = () =>
  new Promise((res, rej) => {
    const r = indexedDB.open('erata', 1);
    r.onupgradeneeded = () => r.result.createObjectStore('dicts', { keyPath: 'name' });
    r.onsuccess = () => res(r.result);
    r.onerror = () => rej(r.error);
  });
const idbGet = async (name) => {
  const db = await idb();
  return new Promise((res) => {
    const q = db.transaction('dicts').objectStore('dicts').get(name);
    q.onsuccess = () => res(q.result || null);
    q.onerror = () => res(null);
  });
};
const idbAll = async () => {
  const db = await idb();
  return new Promise((res) => {
    const q = db.transaction('dicts').objectStore('dicts').getAllKeys();
    q.onsuccess = () => res(q.result || []);
    q.onerror = () => res([]);
  });
};

async function fetchText(path) {
  const r = await fetch(api.runtime.getURL(path));
  if (!r.ok) throw new Error(path);
  return r.text();
}

const engine = new Erata({
  loadDict: async (name) => {
    const custom = await idbGet(name);
    if (custom) return { aff: custom.aff, dic: custom.dic };
    try {
      const [aff, dic] = await Promise.all([fetchText(`dict/${name}.aff`), fetchText(`dict/${name}.dic`)]);
      return { aff, dic };
    } catch {
      return null;
    }
  },
});

async function refreshCustomLangs() {
  const keys = await idbAll();
  engine.extraLangs = new Set(keys.filter((k) => !LANGUAGES[k] && k !== 'en-GB'));
}

// ---------- LLM local (opțional) ----------
async function rewrite(text, lang) {
  const cfg = settings.llm;
  if (!cfg.enabled || !cfg.endpoint) throw new Error('llm-disabled');
  const u = new URL(cfg.endpoint);
  if (!['127.0.0.1', 'localhost'].includes(u.hostname)) throw new Error('local-only');
  const origin = `${u.protocol}//${u.hostname}/*`;
  const has = await api.permissions.contains({ origins: [origin] });
  if (!has) throw new Error('permission');
  const r = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model || undefined,
      temperature: 0.3,
      messages: [
        { role: 'system', content: `Rewrite the user's text in ${lang || 'the same language'}: fix errors, keep meaning, tone and language. Reply with the rewritten text only.` },
        { role: 'user', content: text },
      ],
    }),
  });
  if (!r.ok) throw new Error('http ' + r.status);
  const j = await r.json();
  return j.choices?.[0]?.message?.content?.trim() || '';
}

// ---------- mesaje ----------
function engineOpts(extra = {}) {
  return { ...DEFAULT_OPTS, ...settings, ...extra };
}

const handlers = {
  async getSettings() {
    return { settings, languages: [...Object.entries(LANGUAGES).map(([code, v]) => ({ code, name: v.name })), ...[...engine.extraLangs].map((c) => ({ code: c, name: c }))] };
  },
  async setSettings({ patch }) {
    settings = merge(settings, patch);
    await api.storage.local.set({ settings });
    return { ok: true };
  },
  async check({ text, lang }) {
    const t = text.length > 80000 ? text.slice(0, 80000) : text;
    return engine.check(t, engineOpts(lang ? { lang } : {}));
  },
  async suggest({ word, lang, context }) {
    return engine.suggest(word, engineOpts({ lang: lang || settings.lang, context }));
  },
  async fixAll({ text, lang }) {
    return engine.fixAll(text, engineOpts(lang ? { lang } : {}));
  },
  async restore({ text, lang }) {
    return engine.restoreDiacritics(text, engineOpts(lang ? { lang } : {}));
  },
  async addWord({ word }) {
    const w = word.trim();
    if (w && !settings.personal.includes(w)) settings.personal = [...settings.personal, w];
    await api.storage.local.set({ settings });
    return { ok: true };
  },
  async disableRule({ id }) {
    if (!settings.disabledRules.includes(id)) settings.disabledRules = [...settings.disabledRules, id];
    await api.storage.local.set({ settings });
    return { ok: true };
  },
  async toggleSite({ host }) {
    const set = new Set(settings.disabledSites);
    set.has(host) ? set.delete(host) : set.add(host);
    settings.disabledSites = [...set];
    await api.storage.local.set({ settings });
    return { disabled: set.has(host) };
  },
  async openOptions() {
    await api.runtime.openOptionsPage();
    return { ok: true };
  },
  async reloadDicts() {
    engine.invalidate();
    await refreshCustomLangs();
    return { ok: true };
  },
  async rewrite({ text, lang }) {
    return { text: await rewrite(text, lang) };
  },
};

api.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const h = handlers[msg?.t];
  if (!h) return false;
  ready
    .then(() => h(msg))
    .then((r) => sendResponse({ ok: true, ...r }))
    .catch((e) => sendResponse({ ok: false, error: String(e?.message || e) }));
  return true;
});

api.commands?.onCommand.addListener(async (cmd) => {
  const [tab] = await api.tabs.query({ active: true, currentWindow: true });
  if (tab?.id != null) api.tabs.sendMessage(tab.id, { t: 'command', cmd }).catch(() => {});
});

api.runtime.onInstalled.addListener((d) => {
  if (d.reason === 'install') api.runtime.openOptionsPage?.();
});
