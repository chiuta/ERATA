import { t, UI_LANGS, guessUiLang } from './ui-strings.js';
import { Hunspell } from '../src/core/hunspell.js';

const api = globalThis.browser ?? globalThis.chrome;
const send = (m) => api.runtime.sendMessage(m);
const root = document.getElementById('root');
let S;
let langs = [];
let ui = guessUiLang();

const h = (tag, attrs = {}, ...kids) => {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') n.className = v;
    else if (k.startsWith('on')) n.addEventListener(k.slice(2), v);
    else if (v === true) n.setAttribute(k, '');
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const k of kids.flat()) n.append(k instanceof Node ? k : document.createTextNode(String(k)));
  return n;
};

async function save(patch) {
  Object.assign(S, patch);
  await send({ t: 'setSettings', patch });
  flash();
}
let flashTimer;
function flash() {
  const el = document.getElementById('flash');
  if (!el) return;
  el.textContent = '✓ ' + t(ui, 'saved');
  clearTimeout(flashTimer);
  flashTimer = setTimeout(() => (el.textContent = ''), 1500);
}

const check = (label, key, get = () => S[key], set = (v) => save({ [key]: v })) => {
  const i = h('input', { type: 'checkbox' });
  i.checked = !!get();
  i.addEventListener('change', () => set(i.checked));
  return h('label', {}, i, label);
};

function render() {
  ui = S.ui || ui;
  document.documentElement.lang = ui;
  root.replaceChildren();
  root.append(h('div', { class: 'row', style: 'justify-content:space-between' }, h('h1', {}, 'ERATA'), h('span', { id: 'flash', class: 'muted', role: 'status' })));
  root.append(h('p', { class: 'muted' }, t(ui, 'tagline') + '. ' + t(ui, 'privacy')));

  // General
  const uiSel = h('select', {}, ...Object.entries(UI_LANGS).map(([c, n]) => h('option', { value: c, selected: c === ui }, n)));
  uiSel.addEventListener('change', async () => {
    await save({ ui: uiSel.value });
    render();
  });
  const defSel = h('select', {}, ...langs.map((l) => h('option', { value: l.code, selected: l.code === S.defaultLang }, l.name)));
  defSel.addEventListener('change', () => save({ defaultLang: defSel.value }));
  const enSel = h('select', {}, ...[['auto', 'US + GB'], ['us', 'US'], ['gb', 'GB']].map(([v, n]) => h('option', { value: v, selected: v === S.enVariant }, n)));
  enSel.addEventListener('change', () => save({ enVariant: enSel.value }));
  const long = h('input', { type: 'number', min: 15, max: 120, value: S.longSentence });
  long.addEventListener('change', () => save({ longSentence: Math.max(15, Math.min(120, +long.value || 40)) }));
  root.append(
    h('h2', {}, t(ui, 'general')),
    check(t(ui, 'enabled'), 'enabled'),
    h('div', { class: 'grid' }, t(ui, 'ui_lang'), uiSel, t(ui, 'default_lang'), defSel, t(ui, 'en_variant'), enSel, t(ui, 'long_sentence'), long),
    check(t(ui, 'badge'), 'badge'),
    check(t(ui, 'hide_native'), 'hideNative')
  );

  // Categorii
  root.append(
    h('h2', {}, t(ui, 'categories')),
    ...['spelling', 'grammar', 'punctuation', 'typography', 'style'].map((c) =>
      check(t(ui, 'cat_' + c), c, () => S.categories[c], (v) => save({ categories: { ...S.categories, [c]: v } }))
    )
  );

  // Dicționar personal
  const pers = h('textarea', { rows: 6, 'aria-label': t(ui, 'personal') }, S.personal.join('\n'));
  pers.addEventListener('change', () => save({ personal: [...new Set(pers.value.split(/\n+/).map((x) => x.trim()).filter(Boolean))] }));
  root.append(h('h2', {}, t(ui, 'personal')), pers);

  // Reguli dezactivate
  const dis = h('div', { class: 'row' });
  for (const id of S.disabledRules) {
    dis.append(h('button', { class: 'danger', title: t(ui, 'remove'), onclick: () => save({ disabledRules: S.disabledRules.filter((x) => x !== id) }).then(render) }, id + ' ✕'));
  }
  if (!S.disabledRules.length) dis.append(h('span', { class: 'muted' }, t(ui, 'empty')));
  root.append(h('h2', {}, t(ui, 'disabled_rules')), dis);

  // Site-uri dezactivate
  const sites = h('div', { class: 'row' });
  for (const s of S.disabledSites) sites.append(h('button', { class: 'danger', onclick: () => save({ disabledSites: S.disabledSites.filter((x) => x !== s) }).then(render) }, s + ' ✕'));
  if (!S.disabledSites.length) sites.append(h('span', { class: 'muted' }, t(ui, 'empty')));
  root.append(h('h2', {}, t(ui, 'disabled_sites')), sites);

  // Reguli proprii
  root.append(h('h2', {}, t(ui, 'rules')), customRules());

  // Dicționare importate
  root.append(h('h2', {}, t(ui, 'dicts')), dictImport());

  // LLM local
  root.append(h('h2', {}, t(ui, 'llm_title')), llmSection());

  // Export / import
  const file = h('input', { type: 'file', accept: '.json', hidden: true });
  file.addEventListener('change', async () => {
    try {
      const patch = JSON.parse(await file.files[0].text());
      await save(patch);
      render();
    } catch {}
  });
  root.append(
    h('h2', {}, t(ui, 'advanced')),
    h('div', { class: 'row' },
      h('button', { onclick: () => download('erata-settings.json', JSON.stringify(S, null, 2)) }, t(ui, 'export')),
      h('button', { onclick: () => file.click() }, t(ui, 'import')),
      file)
  );
}

function download(name, text) {
  const a = h('a', { href: URL.createObjectURL(new Blob([text], { type: 'application/json' })), download: name });
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

function customRules() {
  const wrap = h('div');
  const tbl = h('table');
  const draw = () => {
    tbl.replaceChildren(h('tr', {}, ...[t(ui, 'pattern'), t(ui, 'replacement'), t(ui, 'message'), t(ui, 'language'), ''].map((x) => h('th', {}, x))));
    S.userRules.forEach((r, i) =>
      tbl.append(
        h('tr', {}, h('td', {}, h('code', {}, r.pattern)), h('td', {}, r.replacement ?? ''), h('td', {}, r.message ?? ''), h('td', {}, r.lang || 'all'),
          h('td', {}, h('button', { class: 'danger', onclick: () => save({ userRules: S.userRules.filter((_, j) => j !== i) }).then(draw) }, '✕')))
      )
    );
  };
  draw();
  const p = h('input', { type: 'text', placeholder: '\\bteh\\b', 'aria-label': t(ui, 'pattern') });
  const rp = h('input', { type: 'text', placeholder: 'the', 'aria-label': t(ui, 'replacement') });
  const ms = h('input', { type: 'text', placeholder: '…', 'aria-label': t(ui, 'message') });
  const lg = h('select', {}, h('option', { value: 'all' }, '*'), ...langs.map((l) => h('option', { value: l.code }, l.code)));
  const err = h('span', { class: 'muted', role: 'alert' });
  const add = h('button', {
    onclick: async () => {
      try {
        new RegExp(p.value, 'giu');
      } catch (e) {
        err.textContent = String(e.message);
        return;
      }
      if (!p.value) return;
      err.textContent = '';
      await save({ userRules: [...S.userRules, { id: 'USER_' + Date.now().toString(36), pattern: p.value, flags: 'giu', replacement: rp.value, message: ms.value || 'Regulă personalizată', lang: lg.value }] });
      p.value = rp.value = ms.value = '';
      draw();
    },
  }, t(ui, 'add'));
  wrap.append(tbl, h('div', { class: 'row', style: 'margin-top:8px' }, p, rp, ms, lg, add), err);
  return wrap;
}

function dictImport() {
  const wrap = h('div');
  const list = h('div', { class: 'row' });
  const code = h('input', { type: 'text', placeholder: t(ui, 'dict_code'), size: 8, 'aria-label': t(ui, 'dict_code') });
  const aff = h('input', { type: 'file', accept: '.aff' });
  const dic = h('input', { type: 'file', accept: '.dic' });
  const msg = h('span', { class: 'muted', role: 'status' });

  const decode = async (file, isAff) => {
    const buf = await file.arrayBuffer();
    let enc = 'utf-8';
    if (isAff) {
      const head = new TextDecoder('latin1').decode(buf.slice(0, 4000));
      const m = head.match(/^SET\s+(\S+)/m);
      if (m) enc = m[1].toLowerCase().replace(/^iso8859-/, 'iso-8859-');
    }
    return enc;
  };
  const go = h('button', {
    onclick: async () => {
      const c = code.value.trim().toLowerCase();
      if (!/^[a-z]{2,3}(-[a-z0-9]+)?$/i.test(c) || !aff.files[0] || !dic.files[0]) {
        msg.textContent = '!';
        return;
      }
      try {
        const enc = await decode(aff.files[0], true);
        const dec = new TextDecoder(enc);
        const affT = dec.decode(await aff.files[0].arrayBuffer());
        const dicT = dec.decode(await dic.files[0].arrayBuffer());
        const hs = new Hunspell(affT.replace(/^SET\s+\S+/m, 'SET UTF-8'), dicT);
        const db = await new Promise((res, rej) => {
          const r = indexedDB.open('erata', 1);
          r.onupgradeneeded = () => r.result.createObjectStore('dicts', { keyPath: 'name' });
          r.onsuccess = () => res(r.result);
          r.onerror = () => rej(r.error);
        });
        await new Promise((res, rej) => {
          const tx = db.transaction('dicts', 'readwrite');
          tx.objectStore('dicts').put({ name: c, aff: affT.replace(/^SET\s+\S+/m, 'SET UTF-8'), dic: dicT });
          tx.oncomplete = res;
          tx.onerror = () => rej(tx.error);
        });
        await send({ t: 'reloadDicts' });
        msg.textContent = `✓ ${c}: ${hs.dict.size}`;
        await refresh();
      } catch (e) {
        msg.textContent = String(e.message || e);
      }
    },
  }, t(ui, 'import'));
  async function refresh() {
    const r = await send({ t: 'getSettings' });
    langs = r.languages;
    list.replaceChildren(...langs.map((l) => h('span', { class: 'chip', style: 'background:#475467' }, l.code)));
  }
  refresh();
  wrap.append(h('p', { class: 'muted' }, t(ui, 'import_dict')), list, h('div', { class: 'row', style: 'margin-top:8px' }, code, aff, dic, go, msg));
  return wrap;
}

function llmSection() {
  const L = S.llm;
  const ep = h('input', { type: 'text', value: L.endpoint, size: 44, 'aria-label': t(ui, 'llm_endpoint') });
  const md = h('input', { type: 'text', value: L.model, size: 16, 'aria-label': t(ui, 'llm_model') });
  const on = h('input', { type: 'checkbox' });
  on.checked = L.enabled;
  const apply = async () => {
    const llm = { enabled: on.checked, endpoint: ep.value.trim(), model: md.value.trim() };
    if (llm.enabled) {
      try {
        const u = new URL(llm.endpoint);
        if (!['127.0.0.1', 'localhost'].includes(u.hostname)) throw new Error('local-only');
        const origin = `${u.protocol}//${u.hostname}/*`;
        const ok = await api.permissions.request({ origins: [origin] });
        if (!ok) llm.enabled = false;
      } catch {
        llm.enabled = false;
      }
      on.checked = llm.enabled;
    }
    await save({ llm });
  };
  on.addEventListener('change', apply);
  ep.addEventListener('change', apply);
  md.addEventListener('change', apply);
  return h('div', {}, h('p', { class: 'muted' }, t(ui, 'llm_note')), h('label', {}, on, t(ui, 'enabled')), h('div', { class: 'grid' }, t(ui, 'llm_endpoint'), ep, t(ui, 'llm_model'), md));
}

(async () => {
  const r = await send({ t: 'getSettings' });
  S = r.settings;
  langs = r.languages;
  render();
})();
