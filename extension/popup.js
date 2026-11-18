import { t, guessUiLang } from './ui-strings.js';

const api = globalThis.browser ?? globalThis.chrome;
const $ = (id) => document.getElementById(id);

(async () => {
  const r = await api.runtime.sendMessage({ t: 'getSettings' });
  const S = r.settings;
  const ui = S.ui || guessUiLang();
  document.documentElement.lang = ui;
  $('ver').textContent = 'v' + api.runtime.getManifest().version;
  $('tag').textContent = t(ui, 'tagline');
  $('l-enabled').textContent = t(ui, 'enabled');
  $('studio').textContent = t(ui, 'studio');
  $('opts').textContent = t(ui, 'settings');
  $('priv').textContent = t(ui, 'privacy');
  $('enabled').checked = S.enabled;
  $('enabled').addEventListener('change', (e) => api.runtime.sendMessage({ t: 'setSettings', patch: { enabled: e.target.checked } }));

  let host = '';
  let tab;
  try {
    [tab] = await api.tabs.query({ active: true, currentWindow: true });
    host = new URL(tab.url).hostname;
  } catch {}
  if (host) {
    $('l-site').textContent = `${t(ui, 'site_on')} (${host})`;
    $('site').checked = !S.disabledSites.includes(host);
    $('site').addEventListener('change', () => api.runtime.sendMessage({ t: 'toggleSite', host }));
    try {
      const st = await api.tabs.sendMessage(tab.id, { t: 'status' });
      if (st) $('status').textContent = st.count ? `${t(ui, 'issues', { n: st.count })}${st.lang ? ' · ' + st.lang : ''}` : st.lang ? t(ui, 'none') + ' · ' + st.lang : '';
    } catch {}
  } else $('site').closest('label').hidden = true;

  $('studio').addEventListener('click', () => api.tabs.create({ url: api.runtime.getURL('studio.html') }));
  $('opts').addEventListener('click', () => api.runtime.openOptionsPage());
})();
