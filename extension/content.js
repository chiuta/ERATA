// Script de conținut ERATA: detectează câmpurile de text, trimite textul către motorul local
// (fundalul extensiei) și desenează sublinierile într-un strat separat, fără a modifica DOM-ul paginii
// (singura adăugare este elementul <erata-ui>, mutat în <dialog>/popover doar când câmpul e în „top layer”).
import { t as tr, guessUiLang, uiDir } from './ui-strings.js';

const api = globalThis.browser ?? globalThis.chrome;
if (!window.__erataLoaded) {
  window.__erataLoaded = true;
  boot();
}

function boot() {
  const life = new AbortController(); // toate ascultătoarele DOM se leagă de acest semnal: o singură oprire le scoate
  const on = (target, type, fn, o) => target.addEventListener(type, fn, { ...(o === true ? { capture: true } : o), signal: life.signal });
  let dead = false; // contextul extensiei a fost invalidat (reîncărcare/actualizare)
  let offline = false; // fundalul nu răspunde (temporar)
  let S = null; // setări
  let langs = [];
  let ui = guessUiLang();
  const states = new Map();
  // câmpuri care au fost vreodată de tip parolă: „arată parola” (type=password → text) nu le face verificabile
  const secret = new WeakSet();
  let typeMo = null;
  try {
    typeMo = new MutationObserver((list) => {
      for (const m of list) if (/^password$/i.test(m.oldValue || '')) secret.add(m.target);
    });
    typeMo.observe(document, { attributes: true, attributeFilter: ['type'], attributeOldValue: true, subtree: true });
  } catch {}
  let active = null; // câmpul pentru care se desenează sublinierile
  let focusedSt = null; // câmpul care are focusul tastaturii în acest cadru
  let hits = [];
  let hostDisabled = false;
  let settingsLoading = null;
  const T = (k, v) => tr(ui, k, v);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const composedParent = (n) => n.assignedSlot || n.parentElement || (n.parentNode && n.parentNode.host) || null;
  const isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || '');

  // ---------- mesaje către fundal (cu reîncercări: service worker-ul poate fi adormit) ----------
  const IDEMPOTENT = new Set(['check', 'suggest', 'fixAll', 'restore', 'getSettings']);
  const isGone = (e) => !api.runtime?.id || /context invalidated|extension context/i.test(String(e?.message || e));
  const withTimeout = (p, ms) => {
    let id;
    return Promise.race([p, new Promise((_, rej) => (id = setTimeout(() => rej(new Error('timeout')), ms)))]).finally(() => clearTimeout(id));
  };
  async function send(m) {
    const tries = IDEMPOTENT.has(m.t) ? 4 : 1;
    for (let i = 0; i < tries && !dead; i++) {
      try {
        const r = await withTimeout(api.runtime.sendMessage(m), 25000);
        if (r === undefined) throw new Error('no response');
        setOffline(false);
        return r;
      } catch (e) {
        if (isGone(e)) {
          contextLost();
          return null;
        }
        if (i + 1 < tries) await sleep(200 * 3 ** i);
      }
    }
    if (!dead) setOffline(true);
    return null;
  }
  function setOffline(v) {
    if (offline === v || dead) return;
    offline = v;
    requestRender();
  }

  // ---------- strat UI (shadow DOM) ----------
  const HOST_CSS =
    'all:initial!important;display:block!important;position:fixed!important;inset:0!important;width:auto!important;height:auto!important;margin:0!important;padding:0!important;border:0!important;' +
    'z-index:2147483647!important;pointer-events:none!important;visibility:visible!important;opacity:1!important;transform:none!important;filter:none!important;clip-path:none!important;contain:none!important;overflow:visible!important;';
  const host = document.createElement('erata-ui');
  host.style.cssText = HOST_CSS;
  const shadow = host.attachShadow({ mode: 'closed' });
  const Z = 'z-index:2147483647;';
  const CSS = `
    :host{all:initial;--c-spelling:#c42418;--c-grammar:#a85500;--c-punctuation:#9a4a07;--c-typography:#2563eb;--c-style:#7c3aed}
    *{box-sizing:border-box;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
    [hidden]{display:none!important}
    .u{position:fixed;pointer-events:none;height:4px;${Z}transform-origin:0 100%}
    .u.v{transform-origin:0 0}
    .u.spelling{background:linear-gradient(135deg,transparent 41%,#d92d20 41%,#d92d20 59%,transparent 59%) 0 0/6px 4px repeat-x,linear-gradient(45deg,transparent 41%,#d92d20 41%,#d92d20 59%,transparent 59%) 3px 0/6px 4px repeat-x}
    .u.grammar{border-bottom:2px solid #d97706}
    .u.punctuation{border-bottom:2px dashed #b45309}
    .u.typography{border-bottom:2px dotted #2563eb}
    .u.style{border-bottom:1px dotted #7c3aed}
    #badge{position:fixed;pointer-events:auto;width:22px;height:22px;border-radius:11px;border:0;cursor:pointer;color:#fff;font:600 11px/22px system-ui;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.35);padding:0;user-select:none;${Z}}
    #badge:focus-visible{outline:2px solid #fff;box-shadow:0 0 0 4px #1849a9}
    #badge.ok{background:#16794c}#badge.bad{background:#b42318}#badge.busy{background:#667085}#badge.lost{background:#475467}
    .card,.panel{position:fixed;pointer-events:auto;background:#fff;color:#1d2939;border:1px solid #98a2b3;border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.22);font-size:13px;line-height:1.35;max-width:min(340px,calc(100vw - 16px));min-width:min(200px,calc(100vw - 16px));max-height:calc(100vh - 16px);overflow:auto;padding:10px 32px 10px 12px;${Z}}
    .card:focus,.panel:focus{outline:none}
    .x{position:absolute;top:4px;right:4px;width:24px;height:24px;border:0;background:none;color:inherit;font-size:18px;line-height:22px;cursor:pointer;border-radius:6px;padding:0;text-align:center}
    .x:hover{background:rgba(127,127,127,.25)}
    .x:focus-visible,button.chip:focus-visible,button.act:focus-visible,.panel button.big:focus-visible,.panel select:focus-visible{outline:2px solid #1849a9;outline-offset:1px}
    .card .cat{font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;display:flex;align-items:center;gap:6px;margin-bottom:4px}
    .card .dot{width:8px;height:8px;border-radius:50%}
    .dot.c-spelling{background:var(--c-spelling)}.dot.c-grammar{background:var(--c-grammar)}.dot.c-punctuation{background:var(--c-punctuation)}.dot.c-typography{background:var(--c-typography)}.dot.c-style{background:var(--c-style)}
    .lab.c-spelling{color:var(--c-spelling)}.lab.c-grammar{color:var(--c-grammar)}.lab.c-punctuation{color:var(--c-punctuation)}.lab.c-typography{color:var(--c-typography)}.lab.c-style{color:var(--c-style)}
    .card .msg{margin:2px 0 8px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
    button.chip{background:#eef4ff;color:#1849a9;border:1px solid #b2ccff;border-radius:6px;padding:3px 9px;font-size:13px;cursor:pointer}
    button.chip:hover{background:#d1e0ff}
    button.act{background:none;border:0;color:#475467;font-size:12px;padding:2px 4px;cursor:pointer;text-decoration:underline}
    button.act:hover{color:#101828}
    .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .panel h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475467}
    .panel .line{display:flex;justify-content:space-between;gap:12px;margin:2px 0}
    .panel select{font-size:12px;max-width:130px}
    .panel button.big{width:100%;margin-top:6px;padding:6px 8px;border-radius:7px;border:1px solid #d0d5dd;background:#f9fafb;color:#1d2939;cursor:pointer;font-size:13px;text-align:left}
    .panel button.big:hover{background:#eef4ff}
    .muted{color:#667085;font-size:12px}
    .panel .muted{margin-top:8px}
    .sr{position:fixed;width:1px;height:1px;margin:-1px;padding:0;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0;pointer-events:none}
    @media (prefers-color-scheme:dark){
      :host{--c-spelling:#ff8a80;--c-grammar:#fbbf24;--c-punctuation:#f59e0b;--c-typography:#7aa7ff;--c-style:#b794f6}
      .card,.panel{background:#1d2939;color:#f2f4f7;border-color:#667085}
      button.chip{background:#1e3a8a;color:#dbeafe;border-color:#3b82f6}button.chip:hover{background:#274bb0}
      .panel button.big{background:#263447;color:#f2f4f7;border-color:#475467}.panel button.big:hover{background:#314560}
      .muted{color:#98a2b3}button.act{color:#cbd5e1}button.act:hover{color:#fff}.panel h4{color:#98a2b3}
      .x:focus-visible,button.chip:focus-visible,button.act:focus-visible,.panel button.big:focus-visible,.panel select:focus-visible{outline-color:#93c5fd}
    }
    @media (prefers-contrast:more){.card,.panel{border-color:currentColor}.muted{color:inherit}}
    @media (forced-colors:active){
      .u{forced-color-adjust:none}
      .u.spelling{background:none;border-bottom:3px double CanvasText}
      .u.grammar{border-bottom:2px solid CanvasText}.u.punctuation{border-bottom:2px dashed CanvasText}
      .u.typography{border-bottom:2px dotted CanvasText}.u.style{border-bottom:1px dotted CanvasText}
      #badge,#badge.ok,#badge.bad,#badge.busy,#badge.lost{border:2px solid ButtonText;background:ButtonFace;color:ButtonText;forced-color-adjust:none}
      #badge:focus-visible{outline:3px solid Highlight}
      .card,.panel{border:1px solid CanvasText}
      button.chip,button.act,.panel button.big,.x{border:1px solid ButtonText}
      .x:focus-visible,button.chip:focus-visible,button.act:focus-visible,.panel button.big:focus-visible,.panel select:focus-visible{outline:2px solid Highlight}
      .dot{forced-color-adjust:none;background:CanvasText!important}
      .lab{color:CanvasText!important}
    }
    @media (prefers-reduced-motion:no-preference){.card,.panel{animation:erata-in .12s ease-out}}
    @keyframes erata-in{from{opacity:0;transform:translateY(3px)}to{opacity:1;transform:none}}
    @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important;scroll-behavior:auto!important}}
    @media print{.u,#badge,.card,.panel,.sr{display:none!important}}
  `;
  try {
    const sheet = new CSSStyleSheet(); // nu folosește URL-uri: funcționează și sub CSP strict (img-src/style-src)
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const st = document.createElement('style');
    st.textContent = CSS;
    shadow.append(st);
  }
  const layer = document.createElement('div');
  layer.setAttribute('aria-hidden', 'true');
  const mirror = document.createElement('div');
  mirror.setAttribute('aria-hidden', 'true');
  mirror.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;';
  const badge = document.createElement('button');
  badge.id = 'badge';
  badge.hidden = true;
  badge.type = 'button';
  badge.tabIndex = -1; // nu poluează ordinea Tab; se ajunge cu comenzile de tastatură (sau cititor de ecran)
  badge.setAttribute('aria-haspopup', 'dialog');
  badge.setAttribute('aria-expanded', 'false');
  const overlay = document.createElement('div');
  const live = document.createElement('div');
  live.className = 'sr';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  shadow.append(layer, mirror, badge, overlay, live);

  // calibrare: dacă pagina aplică transform/filter/zoom pe <html>/<dialog>, „fixed” nu mai e relativ la fereastră
  let cal = { ox: 0, oy: 0, kx: 1, ky: 1, id: true };
  // sondă 100×100 fixă în colțul (0,0): independentă de dimensiunea cutiei gazdei (care poate fi 0 când <html> nu are înălțime)
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;left:0;top:0;width:100px;height:100px;margin:0;padding:0;border:0;visibility:hidden;pointer-events:none;';
  shadow.append(probe);
  function calib() {
    const r = probe.getBoundingClientRect();
    const kx = r.width / 100 || 1;
    const ky = r.height / 100 || 1;
    cal = { ox: r.left, oy: r.top, kx, ky, id: Math.abs(r.left) < 0.5 && Math.abs(r.top) < 0.5 && Math.abs(kx - 1) < 0.005 && Math.abs(ky - 1) < 0.005 };
  }
  const fx = (x) => (cal.id ? x : (x - cal.ox) / cal.kx);
  const fy = (y) => (cal.id ? y : (y - cal.oy) / cal.ky);
  const fw = (w) => (cal.id ? w : w / cal.kx);

  // „top layer”: <dialog> modal, popover, ecran complet — UI-ul trebuie să fie în interiorul lor, altfel e acoperit și inert
  let topCache = { el: null, t: 0, root: null };
  function topLayerRoot(el) {
    if (!el) return null;
    const now = performance.now();
    if (topCache.el === el && now - topCache.t < 400) return topCache.root;
    let root = null;
    for (let n = el, i = 0; n && i < 80; n = composedParent(n), i++) {
      for (const q of [':modal', ':popover-open', ':fullscreen']) {
        try {
          if (n.matches(q)) root = root || n;
        } catch {}
      }
      if (root) break;
    }
    topCache = { el, t: now, root };
    return root;
  }
  const uiFocused = () => !!shadow.activeElement;
  let lastReappend = 0;
  function mount() {
    const want = topLayerRoot(active?.el) || document.documentElement || document;
    if (host.parentNode !== want) {
      if (uiFocused()) return;
      want.append(host);
    } else if (want.lastElementChild !== host && !uiFocused() && performance.now() - lastReappend > 700) {
      lastReappend = performance.now();
      want.append(host); // ultimul în ordinea DOM: câștigă la z-index egal
    }
  }

  // ---------- setări ----------
  async function loadSettings() {
    if (settingsLoading) return settingsLoading;
    settingsLoading = (async () => {
      const r = await send({ t: 'getSettings' });
      settingsLoading = null;
      if (!r?.ok) return false;
      S = r.settings;
      langs = r.languages;
      ui = S.ui || ui;
      hostDisabled = !S.enabled || S.disabledSites.includes(location.hostname);
      if (hostDisabled) detachAll();
      else if (active) schedule(active, 0);
      else if (!focusedSt) {
        const f = document.activeElement && targetOf(document.activeElement);
        if (f) focusedSt = attach(f);
      }
      return true;
    })();
    return settingsLoading;
  }
  const onStorage = (ch, area) => {
    if (area === 'local' && ch.settings) loadSettings();
  };
  try {
    api.storage?.onChanged?.addListener(onStorage);
  } catch {}
  loadSettings();

  // ---------- detectarea câmpurilor ----------
  const BAD_CLASS =
    '.CodeMirror,.cm-editor,.monaco-editor,.ace_editor,.xterm,[data-erata="off"],[data-gramm="false"],[data-gramm_editor="false"],[data-enable-grammarly="false"],[data-lt-active="false"],[inert]';
  function targetOf(el) {
    if (!el || el.nodeType !== 1) return null;
    if (el.matches('textarea')) return el;
    if (el.matches('input')) return el;
    const h = el.closest('[contenteditable]:not([contenteditable="false"])');
    if (h && h.isContentEditable) {
      let top = h;
      while (top.parentElement && top.parentElement.isContentEditable) top = top.parentElement;
      return top;
    }
    if (document.designMode === 'on') return document.body;
    return null;
  }

  // Semnale reale pentru câmpuri care NU se corectează (nu „orice nume care conține user/email/pass…”):
  // type, autocomplete (token standard), inputmode și nume/id doar când sunt cuvinte întregi (nu subșiruri).
  const AC_SKIP = /^(cc-|tel|one-time-code$|current-password$|new-password$|username$|email$|postal-code$|street-address$|address-line\d$|address-level\d$|country|bday|name$|given-name$|additional-name$|family-name$|honorific-|nickname$|organization|url$|photo$|impp$|sex$|language$|transaction-)/;
  const SECRET = new Set('password passwd passwort pwd pass passcode passphrase pin otp totp mfa cvv cvc csc iban ssn cnp captcha secret token apikey card cc'.split(' '));
  const IDENT = new Set('user username usr login email mail uid userid account phone tel mobile zip postcode postal'.split(' '));
  const NEUTRAL = new Set('new confirm confirmation current old repeat retype re verify your my the input field txt text box value val code number no num nr id name form data address new1 new2 1 2 3 field1 field2'.split(' '));
  const tokens = (s) =>
    String(s || '')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean);
  function sensitiveName(s) {
    const tk = tokens(s);
    if (!tk.length) return false;
    const rest = (set) => tk.every((x) => set.has(x) || NEUTRAL.has(x) || /^\d+$/.test(x));
    if (tk.some((x) => SECRET.has(x)) && tk.every((x) => SECRET.has(x) || NEUTRAL.has(x) || /^\d+$/.test(x))) return true;
    if (tk.some((x) => IDENT.has(x)) && rest(IDENT)) return true;
    return false;
  }
  function eligible(el, st) {
    if (!el || !el.isConnected) return false;
    if (el.matches?.('input')) {
      const ty = (el.getAttribute('type') || 'text').toLowerCase();
      if (ty === 'password') secret.add(el);
      if (secret.has(el) || !['text', 'search', ''].includes(ty)) return false;
      const ac = (el.getAttribute('autocomplete') || '').toLowerCase().split(/\s+/).filter(Boolean);
      if (ac.length && AC_SKIP.test(ac[ac.length - 1])) return false;
      if (/^(numeric|decimal|tel|email|url)$/i.test(el.getAttribute('inputmode') || '')) return false;
      if (sensitiveName(el.getAttribute('name')) || sensitiveName(el.id)) return false;
    }
    if (el.readOnly || el.disabled) return false;
    // „hideNative” setează noi înșine spellcheck=false: pentru verificare contează valoarea originală a paginii
    const sp = st && st.spell !== undefined ? st.spell : el.getAttribute?.('spellcheck');
    if (sp === 'false' && !el.matches?.('[contenteditable]')) return false;
    if (el.closest?.(BAD_CLASS)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 60 && r.height >= 16;
  }

  const kindOf = (el) => (el.matches('textarea,input') ? 'text' : 'ce');

  function attach(el) {
    if (hostDisabled || !S || dead) return null;
    let st = states.get(el);
    if (st && !eligible(el, st)) {
      detach(st); // ex.: type=password comutat din „arată parola”
      return null;
    }
    if (!st) {
      if (!eligible(el)) return null;
      st = { el, kind: kindOf(el), text: '', matches: [], version: 0, timer: 0, ignored: new Set(), lang: null, stats: null, geo: null, map: null, dirty: true, busy: false, langOverride: null, composing: false, sel: null, mo: null, spell: undefined };
      if (S.hideNative && st.kind === 'text') {
        st.spell = el.getAttribute('spellcheck'); // valoarea atributului înainte (null = absent), pentru restaurare exactă
        el.spellcheck = false;
      }
      if (st.kind === 'ce') {
        st.mo = new MutationObserver(() => (st.dirty = true));
        st.mo.observe(el, { childList: true, characterData: true, subtree: true, attributes: true, attributeFilter: ['contenteditable'] });
      }
      states.set(el, st);
    }
    setActive(st);
    mount();
    schedule(st, 0);
    return st;
  }
  function restoreSpell(st) {
    if (st.spell === undefined) return;
    if (st.spell === null) st.el.removeAttribute('spellcheck');
    else st.el.setAttribute('spellcheck', st.spell);
    st.spell = undefined;
  }
  function detach(st) {
    clearTimeout(st.timer);
    st.mo?.disconnect();
    st.mo = null;
    restoreSpell(st);
    states.delete(st.el);
    if (focusedSt === st) focusedSt = null;
    if (active === st) {
      setActive(null);
      clearUi();
    }
  }
  function detachAll() {
    for (const st of [...states.values()]) detach(st);
    clearUi();
  }
  function deactivate() {
    if (!active) return;
    setActive(null);
    clearUi();
  }

  // observatori pentru câmpul activ: derulare în containere din shadow DOM, redimensionare, mutări fără evenimente
  let watchAC = null;
  let ro = null;
  let poll = 0;
  let lastKey = '';
  function setActive(st) {
    if (active === st) return;
    active = st;
    watchAC?.abort();
    watchAC = null;
    ro?.disconnect();
    ro = null;
    clearInterval(poll);
    poll = 0;
    topCache.el = null;
    if (!st) return;
    watchAC = new AbortController();
    const o = { capture: true, passive: true, signal: watchAC.signal };
    const roots = new Set();
    for (let n = st.el, i = 0; n && i < 80; n = composedParent(n), i++) {
      const root = n.getRootNode?.();
      if (root && root !== document) roots.add(root);
    }
    // „scroll” nu iese din shadow DOM (non-composed): ascultăm pe fiecare shadow root din lanț
    for (const root of roots) root.addEventListener('scroll', requestRender, o);
    try {
      ro = new ResizeObserver(() => requestRender());
      ro.observe(st.el);
    } catch {}
    poll = setInterval(() => {
      if (dead || !active || document.visibilityState === 'hidden') return;
      const r = active.el.getBoundingClientRect();
      const key = `${r.left | 0}|${r.top | 0}|${r.width | 0}|${r.height | 0}`;
      const stale = active.kind === 'text' && active.el.value.length !== active.text.length;
      if (key !== lastKey || stale) {
        lastKey = key;
        if (stale && !active.composing) {
          reconcile(active);
          schedule(active, 500);
        }
        requestRender();
      }
    }, 250);
  }

  const stateOf = (e) => {
    const el = targetOf(e.composedPath?.()[0] || e.target);
    return el && states.get(el);
  };
  on(
    document,
    'focusin',
    (e) => {
      if (host.contains(e.target)) return; // focusul a intrat în UI-ul nostru
      const el = targetOf(e.composedPath?.()[0] || e.target);
      if (el) {
        if (!S) loadSettings().then((ok) => ok && document.activeElement && targetOf(document.activeElement) === el && attach(el));
        const st = attach(el);
        if (cardSt && cardSt !== st) closeCard();
        closePanel();
        focusedSt = st;
        if (!st && active && active.el !== el) deactivate(); // câmp ignorat (parolă, data-erata=off…): fără UI rămas de la alt câmp
      } else {
        focusedSt = null;
        closeCard();
        closePanel();
      }
    },
    true
  );
  on(
    document,
    'focusout',
    (e) => {
      const rt = e.relatedTarget;
      if (rt && host.contains(rt)) return;
      const lost = stateOf(e);
      if (lost?.composing) {
        lost.composing = false; // compoziția se încheie la pierderea focusului
        schedule(lost, 300);
      }
      if (!rt) {
        // focusul a ieșit din document sau s-a dus pe un element nefocalizabil
        queueMicrotask(() => {
          if (!uiFocused() && !(document.activeElement && targetOf(document.activeElement))) focusedSt = null;
        });
      }
    },
    true
  );

  on(
    document,
    'input',
    (e) => {
      const el = targetOf(e.composedPath?.()[0] || e.target);
      const st = el && states.get(el);
      if (st) {
        st.dirty = true;
        if (e.isComposing) st.composing = true;
        if (cardSt === st) closeCard(); // decalajele s-au schimbat: cardul ar aplica pe poziții vechi
        reconcile(st);
        if (active !== st) setActive(st);
        render();
        if (!st.composing) schedule(st, st.text.length > 20000 ? 1200 : 450);
      } else if (el) attach(el);
    },
    true
  );
  /** Mută sublinierile existente după editare: păstrează ce e înaintea/după zona modificată. */
  function reconcile(st) {
    const oldT = st.text;
    const newT = getText(st);
    st.text = newT;
    st.geo = null;
    if (!st.matches.length || oldT === newT) return;
    let p = 0;
    const max = Math.min(oldT.length, newT.length);
    while (p < max && oldT[p] === newT[p]) p++;
    let s = 0;
    while (s < max - p && oldT[oldT.length - 1 - s] === newT[newT.length - 1 - s]) s++;
    const delta = newT.length - oldT.length;
    st.matches = st.matches.map((m) => (m.o + m.l <= p ? m : m.o >= oldT.length - s ? { ...m, o: m.o + delta } : null)).filter(Boolean);
  }
  // IME / taste moarte: nu verificăm și nu modificăm textul cât timp există o compoziție activă
  on(
    document,
    'compositionstart',
    (e) => {
      const st = stateOf(e);
      if (!st) return;
      st.composing = true;
      clearTimeout(st.timer);
      closeCard();
      closePanel();
    },
    true
  );
  on(
    document,
    'compositionend',
    (e) => {
      const st = stateOf(e) || active;
      if (st) {
        st.composing = false;
        st.dirty = true;
        schedule(st, 200);
      }
    },
    true
  );
  on(window, 'scroll', () => requestRender(), { capture: true, passive: true });
  on(window, 'resize', () => requestRender(), { passive: true });
  try {
    on(window.visualViewport, 'resize', () => requestRender(), { passive: true });
    on(window.visualViewport, 'scroll', () => requestRender(), { passive: true });
  } catch {}

  // ---------- text ----------
  const BLOCK = new Set('DIV P LI UL OL H1 H2 H3 H4 H5 H6 BLOCKQUOTE PRE TR TABLE SECTION ARTICLE HEADER FOOTER FORM'.split(' '));
  function collect(root) {
    const segs = [];
    let text = '';
    const ensureNl = () => {
      if (text && !text.endsWith('\n')) text += '\n';
    };
    const walk = (n) => {
      for (let c = n.firstChild; c; c = c.nextSibling) {
        if (c.nodeType === 3) {
          segs.push({ node: c, start: text.length, end: text.length + c.data.length });
          // browserele inserează NBSP în locul spațiilor consecutive; le tratăm ca spații (aceeași lungime)
          text += c.data.replace(/ (?= )|(?<= ) /g, ' ');
        } else if (c.nodeType === 1) {
          if (c.tagName === 'BR') {
            text += '\n';
            continue;
          }
          if (/^(SCRIPT|STYLE)$/.test(c.tagName) || c.getAttribute('contenteditable') === 'false') {
            text += '￼';
            continue;
          }
          const b = BLOCK.has(c.tagName);
          if (b) ensureNl();
          walk(c);
          if (b) ensureNl();
        }
      }
    };
    walk(root);
    return { text, segs };
  }
  function rangeFor(map, a, b) {
    if (!map) return null;
    const find = (pos, end) => {
      for (const s of map.segs) if (pos >= s.start && (end ? pos <= s.end : pos < s.end)) return [s.node, pos - s.start];
      return null;
    };
    const s = find(a, false) || find(a, true);
    const e = find(b, true);
    if (!s || !e || !s[0].isConnected || !e[0].isConnected) return null;
    const r = document.createRange();
    try {
      r.setStart(s[0], s[1]);
      r.setEnd(e[0], e[1]);
    } catch {
      return null;
    }
    return r;
  }
  function freshMap(st) {
    if (!st.map || st.dirty) {
      st.map = collect(st.el);
      st.dirty = false;
    }
    return st.map;
  }
  function getText(st) {
    if (st.kind === 'text') return st.el.value;
    return freshMap(st).text;
  }
  /** Poziția (în text) a unei granițe DOM dintr-un contenteditable. */
  function offsetOf(map, node, off) {
    if (node.nodeType === 3) {
      const s = map.segs.find((x) => x.node === node);
      return s ? s.start + Math.min(off, s.end - s.start) : null;
    }
    const ref = node.childNodes[off];
    if (ref) {
      for (const s of map.segs) if (ref === s.node || ref.contains(s.node) || ref.compareDocumentPosition(s.node) & 4) return s.start;
    } else {
      let last = null;
      for (const s of map.segs) if (node.contains(s.node)) last = s;
      if (last) return last.end;
      for (const s of map.segs) if (node.compareDocumentPosition(s.node) & 4) return s.start;
    }
    return map.text.length;
  }
  /** Selecția curentă în coordonate text: { s, e, d }. */
  function selOffsets(st) {
    if (st.kind === 'text') return { s: st.el.selectionStart ?? 0, e: st.el.selectionEnd ?? 0, d: st.el.selectionDirection || 'none' };
    const sel = getSelection();
    if (!sel || !sel.rangeCount) return null;
    const r = sel.getRangeAt(0);
    if (!st.el.contains(r.startContainer) || !st.el.contains(r.endContainer)) return null;
    const map = freshMap(st);
    const s = offsetOf(map, r.startContainer, r.startOffset);
    const e = offsetOf(map, r.endContainer, r.endOffset);
    return s == null || e == null ? null : { s, e };
  }
  function restoreSel(st, sel) {
    if (!sel || !st.el.isConnected) return;
    try {
      if (st.kind === 'text') {
        st.el.setSelectionRange(sel.s, sel.e, sel.d || 'none');
      } else {
        st.map = collect(st.el);
        st.dirty = false;
        const r = rangeFor(st.map, sel.s, sel.e);
        if (r) {
          const g = getSelection();
          g.removeAllRanges();
          g.addRange(r);
        }
      }
    } catch {}
  }
  function giveBackFocus(st) {
    if (!st || !st.el.isConnected) return;
    st.el.focus({ preventScroll: true });
    if (st.sel) restoreSel(st, st.sel);
    st.sel = null;
  }

  // ---------- verificare ----------
  const MAXC = 80000;
  const WIN = 60000;
  /** Câmpuri uriașe (>80 000 caractere): verificăm o fereastră de ~60 000 în jurul cursorului. */
  function windowOf(st, full) {
    if (full.length <= MAXC) return [0, full];
    const c = selOffsets(st)?.s ?? 0;
    let a = Math.max(0, Math.min(c - WIN / 2, full.length - WIN));
    let b = Math.min(full.length, a + WIN);
    const nl = full.lastIndexOf('\n', a);
    if (nl >= 0 && a - nl < 600) a = nl + 1;
    const nb = full.indexOf('\n', b);
    if (nb >= 0 && nb - b < 600) b = nb;
    return [a, full.slice(a, b)];
  }
  function schedule(st, delay = 450) {
    clearTimeout(st.timer);
    st.timer = setTimeout(() => runCheck(st), delay);
  }
  const langOf = (st) => (st.langOverride && st.langOverride !== 'auto' ? st.langOverride : undefined);
  async function runCheck(st) {
    if (dead) return;
    if (!st.el.isConnected || !eligible(st.el, st)) return detach(st);
    if (st.composing) return schedule(st, 300);
    const full = getText(st);
    if (!full.trim()) {
      st.text = full;
      st.matches = [];
      st.stats = null;
      st.busy = false;
      render();
      return;
    }
    st.text = full;
    st.busy = true;
    render();
    const v = ++st.version;
    const [a, text] = windowOf(st, full);
    const r = await send({ t: 'check', text, lang: langOf(st) });
    if (dead || v !== st.version) return;
    if (st.text !== full) return; // textul s-a schimbat între timp: urmează o verificare nouă (programată de „input”)
    st.busy = false;
    if (!r?.ok) {
      st.matches = [];
      render();
      return;
    }
    st.matches = r.matches.map((m) => (a ? { ...m, o: m.o + a } : m)).filter((m) => !st.ignored.has(keyOf(st, m)));
    st.lang = r.lang;
    st.stats = r.stats;
    st.geo = null;
    render();
  }
  const keyOf = (st, m) => `${m.id}|${st.text.slice(m.o, m.o + m.l)}`;
  // fereastra de verificare urmărește cursorul în câmpuri uriașe
  const moved = () => {
    const st = focusedSt;
    if (!st || st.text.length <= MAXC || st.composing) return;
    schedule(st, 700);
  };
  on(document, 'keyup', moved, { capture: true, passive: true });
  on(document, 'mouseup', moved, { capture: true, passive: true });

  // ---------- randare ----------
  let raf = 0;
  function requestRender() {
    if (raf || dead) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  }
  function clearUi() {
    layer.replaceChildren();
    layer.style.clipPath = '';
    badge.hidden = true;
    hits = [];
    closeCard();
    closePanel();
  }

  // transformări CSS: partea liniară (a,b,c,d) a produsului tuturor transformărilor strămoșilor, ordinea CSS: translate·rotate·scale·transform
  function lin(cs) {
    let m = new DOMMatrix();
    const r = cs.rotate;
    if (r && r !== 'none') {
      const p = r.trim().split(/\s+/);
      const last = p[p.length - 1];
      const ang = parseFloat(last) * (/rad$/.test(last) ? 180 / Math.PI : /turn$/.test(last) ? 360 : /grad$/.test(last) ? 0.9 : 1);
      if (p.length === 4 && (+p[0] || +p[1])) return null; // rotație 3D
      m = m.rotate(0, 0, p.length === 4 && +p[2] < 0 ? -ang : ang);
    }
    const s = cs.scale;
    if (s && s !== 'none') {
      const p = s.trim().split(/\s+/).map(Number);
      m = m.scale(p[0], p[1] ?? p[0]);
    }
    if (cs.transform && cs.transform !== 'none') {
      const t = new DOMMatrix(cs.transform);
      if (!t.is2D) return null;
      m = m.multiply(t);
    }
    return [m.a, m.b, m.c, m.d];
  }
  function fieldMatrix(el, er) {
    let a = 1;
    let b = 0;
    let c = 0;
    let d = 1;
    let bad = false;
    for (let n = el, i = 0; n && i < 80; n = composedParent(n), i++) {
      const cs = getComputedStyle(n);
      if ((cs.transform && cs.transform !== 'none') || (cs.rotate && cs.rotate !== 'none') || (cs.scale && cs.scale !== 'none')) {
        const l = lin(cs);
        if (!l) {
          bad = true;
          continue;
        }
        [a, b, c, d] = [l[0] * a + l[2] * b, l[1] * a + l[3] * b, l[0] * c + l[2] * d, l[1] * c + l[3] * d];
      }
    }
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const xs = [0, a * w, c * h, a * w + c * h];
    const ys = [0, b * w, d * h, b * w + d * h];
    const mx = Math.min(...xs);
    const my = Math.min(...ys);
    const pw = Math.max(...xs) - mx;
    const ph = Math.max(...ys) - my;
    let k = 1;
    if (pw > 1 && ph > 1) {
      // diferența față de dreptunghiul măsurat = factor suplimentar (CSS zoom etc.)
      const kx = er.width / pw;
      const ky = er.height / ph;
      if (Math.abs(kx - ky) / Math.max(kx, ky) < 0.05 && Math.abs(kx - 1) > 0.015) k = (kx + ky) / 2;
    }
    a *= k;
    b *= k;
    c *= k;
    d *= k;
    return { a, b, c, d, e: er.left - mx * k, f: er.top - my * k, rot: Math.abs(b) > 0.01 || Math.abs(c) > 0.01, bad };
  }

  // decupare după strămoșii cu overflow (containere derulabile imbricate), respectând lanțul de „containing block”
  const makesCB = (cs) =>
    (cs.transform && cs.transform !== 'none') || (cs.perspective && cs.perspective !== 'none') || (cs.filter && cs.filter !== 'none') || (cs.backdropFilter && cs.backdropFilter !== 'none') || /layout|paint|strict|content/.test(cs.contain || '') || /transform|perspective|filter/.test(cs.willChange || '');
  function containingBlock(n) {
    const pos = getComputedStyle(n).position;
    for (let a = composedParent(n); a; a = composedParent(a)) {
      const as = getComputedStyle(a);
      if (pos === 'fixed') {
        if (makesCB(as)) return a;
        continue;
      }
      if (pos === 'absolute') {
        if (as.position !== 'static' || makesCB(as)) return a;
        continue;
      }
      if (as.display === 'inline' || as.display === 'contents') continue;
      return a;
    }
    return null;
  }
  function clipRect(el) {
    const de = document.documentElement;
    let r = { l: 0, t: 0, r: de.clientWidth || innerWidth, b: de.clientHeight || innerHeight };
    try {
      let cur = el;
      for (let i = 0; i < 60 && cur; i++) {
        const cb = containingBlock(cur);
        if (!cb || cb === document.body || cb === de) break;
        const cs = getComputedStyle(cb);
        if (cs.overflowX !== 'visible' || cs.overflowY !== 'visible' || /paint|strict|content/.test(cs.contain || '')) {
          const b = cb.getBoundingClientRect();
          const kx = cb.offsetWidth ? b.width / cb.offsetWidth : 1;
          const ky = cb.offsetHeight ? b.height / cb.offsetHeight : 1;
          const l = b.left + cb.clientLeft * kx;
          const t = b.top + cb.clientTop * ky;
          r = { l: Math.max(r.l, l), t: Math.max(r.t, t), r: Math.min(r.r, l + cb.clientWidth * kx), b: Math.min(r.b, t + cb.clientHeight * ky) };
        }
        cur = cb;
      }
    } catch {}
    return r;
  }

  const MPROPS = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'fontStretch', 'fontKerning', 'fontFeatureSettings', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'textAlign', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'tabSize', 'direction', 'writingMode', 'textOrientation', 'wordBreak', 'lineBreak', 'textRendering'];
  const isVertical = (cs) => /^(vertical|sideways)/.test(cs.writingMode || '');
  /**
   * Caseta de padding a câmpului: {bl, bt} = chenar (+ bara de derulare din stânga, la RTL), {cw, ch} = lățime/înălțime cu padding.
   * În mod clasic asta raportează clientLeft/clientTop/clientWidth/clientHeight. Chrome 159 raportează însă, pentru <input>,
   * caseta de CONȚINUT (clientLeft include padding-ul, clientWidth îl exclude), ceea ce deplasa sublinierile cu padding-ul.
   * Semantica se recunoaște pe axa verticală (acolo nu există bară de derulare), altfel pe cea orizontală.
   */
  function padBox(el, cs) {
    const n = (v) => parseFloat(v) || 0;
    const pl = n(cs.paddingLeft), pr = n(cs.paddingRight), pt = n(cs.paddingTop), pb = n(cs.paddingBottom);
    const near = (a, b) => Math.abs(a - b) < 0.75;
    const content = pt > 0 ? near(el.clientTop, n(cs.borderTopWidth) + pt) : pl > 0 && near(el.clientLeft, n(cs.borderLeftWidth) + pl);
    if (!content) return { bl: el.clientLeft || 0, bt: el.clientTop || 0, cw: el.clientWidth, ch: el.clientHeight };
    return { bl: el.clientLeft - pl, bt: el.clientTop - pt, cw: el.clientWidth + pl + pr, ch: el.clientHeight + pt + pb };
  }

  /** Geometria locală (în coordonatele casetei câmpului, înainte de transformări) pentru textarea/input. */
  function textGeo(st) {
    const el = st.el;
    const cs = getComputedStyle(el);
    calib();
    const key = [cal.kx, cal.ky, el.clientWidth, el.clientHeight, el.clientLeft, el.clientTop, cs.paddingRight, st.text.length, st.matches.length, st.version, cs.fontSize, cs.fontFamily, cs.letterSpacing, cs.direction, cs.writingMode, cs.textAlign, cs.paddingLeft, cs.paddingTop, cs.lineHeight].join('|');
    if (st.geo && st.geo.key === key) return st.geo;
    const vertical = isVertical(cs);
    const multi = el.matches('textarea');
    // „bl/bt” = chenarul + eventuala bară de derulare din stânga (RTL), așa cum o raportează clientLeft/clientTop
    const pbx = padBox(el, cs);
    const geo = { key, items: [], yoff: 0, bl: pbx.bl, bt: pbx.bt, vertical };
    st.geo = geo;
    if (!st.matches.length) return geo;
    mirror.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;border:0;margin:0;overflow:visible;';
    for (const p of MPROPS) mirror.style[p] = cs[p];
    mirror.style.whiteSpace = multi ? cs.whiteSpace : 'pre';
    mirror.style.overflowWrap = multi ? cs.overflowWrap : 'normal';
    // dimensiuni fixe: alinierea (center/right/RTL) și textul vertical se calculează ca în câmpul real
    mirror.style.width = pbx.cw + 'px';
    mirror.style.height = vertical ? pbx.ch + 'px' : 'auto';
    mirror.textContent = '';
    let pos = 0;
    const spans = [];
    for (const [i, m] of st.matches.entries()) {
      if (m.o < pos) continue;
      mirror.append(st.text.slice(pos, m.o));
      const sp = document.createElement('span');
      sp.textContent = st.text.slice(m.o, m.o + m.l);
      mirror.append(sp);
      spans.push([i, sp]);
      pos = m.o + m.l;
    }
    mirror.append('​'); // textul de după ultima problemă nu influențează poziția celor dinainte
    const mr = mirror.getBoundingClientRect();
    geo.items = spans.map(([i, sp]) => ({
      mi: i,
      // oglinda e în același context ca gazda: dacă <html> are transform/zoom, dreptunghiurile ei sunt scalate → le readucem în unități locale
      rects: [...sp.getClientRects()].map((r) => ({ x: (r.left - mr.left) / cal.kx, y: (r.top - mr.top) / cal.ky, w: r.width / cal.kx, h: r.height / cal.ky })),
    }));
    if (!multi && !vertical) geo.yoff = Math.max(0, (pbx.ch - mr.height / cal.ky) / 2); // linia unică e centrată vertical
    mirror.textContent = '';
    return geo;
  }

  function ceItems(st) {
    // validare: textul curent al DOM-ului trebuie să corespundă cu cel verificat
    const map = freshMap(st);
    if (map.text !== st.text) return null;
    return st.matches.map((m, i) => {
      const r = rangeFor(map, m.o, m.o + m.l);
      return { mi: i, rects: r ? [...r.getClientRects()].map((c) => ({ x: c.left, y: c.top, w: c.width, h: c.height })) : [] };
    });
  }

  const bbox = (pts) => {
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    return { x: Math.min(...xs), y: Math.min(...ys), w: Math.max(...xs) - Math.min(...xs), h: Math.max(...ys) - Math.min(...ys) };
  };
  const inter = (r, v) => r.x + r.w > v.l && r.x < v.r && r.y + r.h > v.t && r.y < v.b;

  function render() {
    if (dead) return;
    mount();
    calib();
    const st = active;
    layer.replaceChildren();
    hits = [];
    if (!st || !st.el.isConnected || hostDisabled) {
      badge.hidden = true;
      return;
    }
    const er = st.el.getBoundingClientRect();
    const clip = clipRect(st.el);
    const vis = { l: Math.max(clip.l, er.left), t: Math.max(clip.t, er.top), r: Math.min(clip.r, er.right), b: Math.min(clip.b, er.bottom) };
    if (vis.r <= vis.l || vis.b <= vis.t) {
      badge.hidden = true;
      layer.style.clipPath = 'polygon(0 0,0 0,0 0)';
      if (cardSt === st && !uiFocused()) closeCard();
      return;
    }
    layer.style.clipPath = `polygon(${fx(vis.l)}px ${fy(vis.t)}px,${fx(vis.r)}px ${fy(vis.t)}px,${fx(vis.r)}px ${fy(vis.b)}px,${fx(vis.l)}px ${fy(vis.b)}px)`;
    const frag = document.createDocumentFragment();
    const bar = (cls, A, B, vertical) => {
      const u = document.createElement('div');
      u.className = 'u ' + cls + (vertical ? ' v' : '');
      const len = Math.hypot(B[0] - A[0], B[1] - A[1]);
      const ang = Math.atan2(B[1] - A[1], B[0] - A[0]);
      const rot = vertical || Math.abs(ang) > 0.002;
      u.style.left = fx(A[0]) + 'px';
      u.style.top = fy(vertical ? A[1] : A[1] - 4) + 'px';
      u.style.width = fw(len) + 'px';
      if (rot) u.style.transform = `rotate(${ang}rad)`;
      frag.append(u);
    };
    let M = null;
    try {
      M = fieldMatrix(st.el, er);
      if (st.kind === 'text') {
        if (M.bad) throw new Error('3d');
        const g = textGeo(st);
        const el = st.el;
        for (const it of g.items) {
          const m = st.matches[it.mi];
          for (const r of it.rects) {
            const lx = g.bl + r.x - el.scrollLeft;
            const ly = g.bt + r.y - el.scrollTop + g.yoff;
            const P = (x, y) => [M.e + M.a * x + M.c * y, M.f + M.b * x + M.d * y];
            const c4 = [P(lx, ly), P(lx + r.w, ly), P(lx, ly + r.h), P(lx + r.w, ly + r.h)];
            const bb = bbox(c4);
            if (!inter(bb, vis)) continue;
            if (g.vertical) bar(m.c, P(lx + r.w, ly), P(lx + r.w, ly + r.h), true);
            else bar(m.c, P(lx, ly + r.h), P(lx + r.w, ly + r.h), false);
            hits.push({ x: bb.x, y: bb.y, w: bb.w, h: bb.h, mi: it.mi });
          }
        }
      } else if (!M.rot && !M.bad) {
        const vertical = isVertical(getComputedStyle(st.el));
        const items = ceItems(st) || [];
        for (const it of items) {
          const m = st.matches[it.mi];
          for (const r of it.rects) {
            const bb = { x: r.x, y: r.y, w: r.w, h: r.h };
            if (!inter(bb, vis) || r.w < 1 || r.h < 4) continue;
            if (vertical) bar(m.c, [r.x + r.w, r.y], [r.x + r.w, r.y + r.h], true);
            else bar(m.c, [r.x, r.y + r.h], [r.x + r.w, r.y + r.h], false);
            hits.push({ ...bb, mi: it.mi });
          }
        }
      } // CE rotit/3D: fără sublinieri (nu se pot desena corect); insigna și comenzile de tastatură rămân
    } catch {
      layer.replaceChildren();
      hits = [];
    }
    layer.append(frag);
    renderBadge(st, er, vis);
  }

  function renderBadge(st, er, vis) {
    if (!S.badge) {
      badge.hidden = true;
      return;
    }
    const n = st.matches.length;
    const small = er.height < 34;
    const size = small ? 16 : 22;
    badge.hidden = false;
    badge.style.width = badge.style.height = size + 'px';
    badge.style.borderRadius = size / 2 + 'px';
    badge.style.font = `600 ${small ? 9 : 11}px/${size}px system-ui`;
    badge.style.left = Math.max(0, fx(vis.r) - size - 6) + 'px';
    badge.style.top = small ? fy(vis.t) + (vis.b - vis.t - size) / 2 + 'px' : Math.max(0, fy(vis.b) - size - 6) + 'px';
    let status;
    if (offline) {
      badge.className = 'lost';
      badge.textContent = '!';
      status = T('connection_lost');
    } else {
      badge.className = st.busy ? 'busy' : n ? 'bad' : 'ok';
      badge.textContent = st.busy ? '…' : n ? (n > 99 ? '99+' : String(n)) : '✓';
      status = st.busy ? T('loading') : n ? T('issues', { n }) : T('none');
    }
    badge.title = `${status} — ${T('kb_hint')}`;
    badge.setAttribute('aria-label', `${T('open_menu')}: ${status}`);
    badge.setAttribute('aria-expanded', panelEl ? 'true' : 'false');
  }

  // ---------- card cu sugestii ----------
  let cardTimer = 0;
  let closeTimer = 0;
  let cardHover = false;
  let cardEl = null;
  let cardSt = null;
  let cardM = null;
  let cardKbd = false;
  let uidN = 0;

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };
  const announce = (msg) => {
    live.textContent = '';
    requestAnimationFrame(() => (live.textContent = msg));
  };
  const focusables = (root) => [...root.querySelectorAll('button,select,[tabindex="0"]')].filter((x) => !x.disabled && !x.hidden);
  /** Capcană de focus + săgeți + oprirea propagării tastelor către pagină, pentru card/panou. */
  function wireKeys(node) {
    node.tabIndex = -1;
    node.addEventListener('keydown', (e) => {
      if (e.isComposing) return;
      const f = focusables(node);
      const i = f.indexOf(shadow.activeElement);
      if (e.key === 'Tab') {
        if (!f.length) return e.preventDefault();
        const n = e.shiftKey ? (i <= 0 ? f.length - 1 : i - 1) : i === f.length - 1 ? 0 : i + 1;
        f[n].focus();
        e.preventDefault();
      } else if (/^Arrow(Left|Right|Up|Down)$/.test(e.key) && shadow.activeElement?.tagName === 'BUTTON') {
        const back = e.key === 'ArrowLeft' || e.key === 'ArrowUp';
        f[back ? (i <= 0 ? f.length - 1 : i - 1) : i === f.length - 1 ? 0 : i + 1].focus();
        e.preventDefault();
      }
      if (e.key !== 'Escape') e.stopPropagation(); // Escape e tratat la nivel de document (capture)
    });
    // mouse: butoanele nu mută focusul din câmp (evită blur/focus în pagină); doar <select> are nevoie de focus
    node.addEventListener('mousedown', (e) => {
      if (e.target.closest?.('select')) return;
      if (!uiFocused()) e.preventDefault();
    });
  }

  function closeCard(refocus = false) {
    clearTimeout(cardTimer);
    const had = uiFocused() && cardEl && cardEl.contains(shadow.activeElement);
    const st = cardSt;
    overlay.querySelectorAll('.card').forEach((n) => n.remove());
    cardEl = null;
    cardSt = null;
    cardM = null;
    cardHover = false;
    cardKbd = false;
    if ((refocus || had) && st) giveBackFocus(st);
  }
  function hitAt(x, y) {
    for (const h of hits) if (x >= h.x && x <= h.x + h.w && y >= h.y - 2 && y <= h.y + h.h + 3) return h;
    return null;
  }
  let lastMove = 0;
  on(
    document,
    'mousemove',
    (e) => {
      if (!active || !hits.length || cardKbd) return;
      const now = performance.now();
      if (now - lastMove < 40) return;
      lastMove = now;
      const h = hitAt(e.clientX, e.clientY);
      if (h) {
        clearTimeout(closeTimer);
        if (!cardM || active.matches[h.mi] !== cardM) {
          clearTimeout(cardTimer);
          cardTimer = setTimeout(() => openCard(h), 220);
        }
      } else {
        clearTimeout(cardTimer);
        if (cardM && !cardHover && !uiFocused()) {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(() => !cardHover && !uiFocused() && closeCard(), 350);
        }
      }
    },
    { passive: true }
  );
  on(
    document,
    'click',
    (e) => {
      if (!active || !hits.length) return;
      if (e.composedPath().includes(host)) return;
      const h = hitAt(e.clientX, e.clientY);
      if (h) openCard(h);
      else {
        closeCard();
        closePanel();
      }
    },
    true
  );
  on(
    document,
    'keydown',
    (e) => {
      if (dead) return;
      if (e.key === 'Escape' && !e.isComposing && (cardEl || panelEl)) {
        const had = uiFocused();
        const st = cardSt || panelSt;
        closeCard();
        closePanel();
        if (had) {
          giveBackFocus(st);
          e.preventDefault();
          e.stopPropagation(); // Escape a închis doar cardul/panoul, nu și dialogul paginii
        }
        return;
      }
      // rezervă în pagină pentru comenzile de tastatură (dacă browserul nu le-a preluat); pe Mac Option+Shift+tastă produce caractere
      if (!isMac && e.altKey && e.shiftKey && !e.ctrlKey && !e.metaKey && !e.isComposing && e.keyCode !== 229) {
        const cmd = { Space: 'open-suggestions', KeyM: 'open-menu', KeyF: 'fix-all', KeyE: 'toggle-site' }[e.code];
        if (cmd && runCommand(cmd)) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
    },
    true
  );

  function place(node, rect) {
    overlay.append(node);
    node.style.left = '0px';
    node.style.top = '0px';
    const de = document.documentElement;
    const vw = Math.min(innerWidth, de.clientWidth || innerWidth);
    const vh = Math.min(innerHeight, de.clientHeight || innerHeight);
    const nw = node.offsetWidth * cal.kx;
    const nh = node.offsetHeight * cal.ky;
    let x = Math.max(8, Math.min(rect.x, vw - nw - 8));
    let y = rect.y + rect.h + 6;
    if (y + nh > vh - 8) y = rect.y - nh - 6;
    y = Math.max(8, Math.min(y, vh - nh - 8));
    node.style.left = fx(x) + 'px';
    node.style.top = fy(y) + 'px';
  }
  /** Face potrivirea vizibilă (derulează câmpul/pagina), apoi returnează dreptunghiul ei în fereastră. */
  function revealMatch(st, mi) {
    const m = st.matches[mi];
    try {
      const er0 = st.el.getBoundingClientRect();
      if (er0.bottom < 0 || er0.top > innerHeight) st.el.scrollIntoView({ block: 'center', behavior: 'auto' });
      if (st.kind === 'text') {
        const g = textGeo(st);
        const it = g.items.find((x) => x.mi === mi);
        const r = it?.rects[0];
        if (r) {
          const y = r.y + g.yoff;
          if (y < st.el.scrollTop + 4 || y + r.h > st.el.scrollTop + st.el.clientHeight - 4) st.el.scrollTop = Math.max(0, y - st.el.clientHeight / 3);
          if (!g.vertical && getComputedStyle(st.el).direction !== 'rtl' && (r.x < st.el.scrollLeft || r.x + r.w > st.el.scrollLeft + st.el.clientWidth)) st.el.scrollLeft = Math.max(0, r.x - st.el.clientWidth / 3);
        }
      } else {
        const rg = rangeFor(freshMap(st), m.o, m.o + m.l);
        const node = rg?.startContainer;
        (node?.nodeType === 3 ? node.parentElement : node)?.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'auto' });
      }
    } catch {}
    render();
    return hits.find((h) => h.mi === mi) || null;
  }

  async function openCard(h, { kbd = false } = {}) {
    const st = active;
    const m = st?.matches[h.mi];
    if (!m || st.composing) return;
    const sel0 = kbd ? selOffsets(st) || st.sel : null;
    closeCard();
    closePanel();
    st.sel = sel0;
    cardSt = st;
    cardM = m;
    cardKbd = kbd;
    const n = ++uidN;
    const card = el('div', 'card');
    card.dir = uiDir(ui); card.lang = ui;
    cardEl = card;
    card.setAttribute('role', 'dialog');
    card.setAttribute('aria-modal', 'false');
    card.setAttribute('aria-labelledby', `et${n}`);
    card.setAttribute('aria-describedby', `em${n}`);
    const cat = el('div', 'cat');
    const dot = el('span', 'dot c-' + m.c);
    const catName = el('span', '', T('cat_' + m.c));
    catName.id = `et${n}`;
    cat.append(dot, catName);
    const msg = el('div', 'msg', m.m);
    msg.id = `em${n}`;
    const chips = el('div', 'chips');
    chips.setAttribute('role', 'group');
    chips.setAttribute('aria-label', T('suggestions'));
    const acts = el('div', 'row');
    const x = el('button', 'x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', T('close'));
    x.title = T('close');
    x.addEventListener('click', () => closeCard(true));
    card.append(cat, msg, chips, acts, x);
    wireKeys(card);
    card.addEventListener('mouseenter', () => (cardHover = true));
    card.addEventListener('mouseleave', () => {
      cardHover = false;
      if (!uiFocused()) closeTimer = setTimeout(() => !cardHover && !uiFocused() && closeCard(), 350);
    });
    const word = st.text.slice(m.o, m.o + m.l);
    // aplică doar dacă textul de la poziția potrivirii e încă cel verificat (altfel s-ar corupe textul)
    const guarded = (edits) => {
      const cur = getText(st);
      if (cur.slice(m.o, m.o + m.l) !== word) {
        schedule(st, 0);
        return false;
      }
      applyEdits(st, edits);
      return true;
    };
    const addChip = (txt, show = txt) => {
      const b = el('button', 'chip', show === '' ? '⌫' : show.replace(/ /g, '·').replace(/ | /g, '␣'));
      b.type = 'button';
      const label = txt === '' ? T('remove') : txt;
      b.title = label;
      b.setAttribute('aria-label', label);
      b.addEventListener('click', () => {
        closeCard();
        guarded([{ offset: m.o, length: m.l, replacement: txt }]);
      });
      chips.append(b);
    };
    const act = (label, fn) => {
      const b = el('button', 'act', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        closeCard(true);
        fn();
      });
      acts.append(b);
    };
    const focusFirst = () => {
      if (!kbd || cardEl !== card) return;
      const f = focusables(card).find((b) => !b.classList.contains('x')) || focusables(card)[0];
      (f || card).focus({ preventScroll: true });
    };
    const finish = () => {
      act(T('ignore'), () => {
        st.ignored.add(keyOf(st, m));
        st.matches = st.matches.filter((q) => q !== m);
        st.geo = null;
        render();
      });
      if (m.id !== 'SPELLING') {
        act(T('ignore_rule'), async () => {
          await send({ t: 'disableRule', id: m.id });
          schedule(st, 0);
        });
      }
    };
    const anchor = () => h;
    if (m.id === 'SPELLING') {
      chips.append(el('span', 'muted', T('loading')));
      chips.setAttribute('aria-busy', 'true');
      place(card, anchor());
      if (kbd) card.focus({ preventScroll: true });
      const r = await send({ t: 'suggest', word, lang: st.lang, context: st.text.slice(Math.max(0, m.o - 120), m.o + 120) });
      if (cardEl !== card) return;
      chips.textContent = '';
      chips.removeAttribute('aria-busy');
      const list = r?.suggestions || [];
      if (!list.length) chips.append(el('span', 'muted', T('no_sugg')));
      for (const s of list.slice(0, 6)) addChip(s.text);
      act(T('add_word'), async () => {
        await send({ t: 'addWord', word });
        schedule(st, 0);
      });
      finish();
      place(card, anchor()); // înălțimea s-a schimbat după încărcarea sugestiilor
    } else {
      if (m.r && m.r.length) for (const r of m.r.slice(0, 5)) addChip(r);
      else chips.remove();
      if (m.id === 'STYLE_LONG_SENTENCE' && S.llm?.enabled) act(T('rewrite'), () => rewriteSentence(st, m));
      finish();
      place(card, anchor());
    }
    focusFirst();
  }

  async function rewriteSentence(st, m) {
    const full = getText(st);
    const sentence = full.slice(m.o, m.o + 400).split(/(?<=[.!?])\s/)[0];
    const r = await send({ t: 'rewrite', text: sentence, lang: st.lang });
    if (r?.ok && r.text && getText(st) === full) applyEdits(st, [{ offset: m.o, length: sentence.length, replacement: r.text }]);
  }

  // ---------- panou (insigna) ----------
  let panelEl = null;
  let panelSt = null;
  function closePanel(refocus = false) {
    const had = uiFocused() && panelEl && panelEl.contains(shadow.activeElement);
    const st = panelSt;
    overlay.querySelectorAll('.panel').forEach((n) => n.remove());
    panelEl = null;
    panelSt = null;
    badge.setAttribute('aria-expanded', 'false');
    if ((refocus || had) && st) giveBackFocus(st);
  }
  on(badge, 'click', (e) => {
    e.stopPropagation();
    if (panelEl) return closePanel(true);
    openPanel({ kbd: e.detail === 0 });
  });
  on(badge, 'mousedown', (e) => e.preventDefault()); // nu pierde focusul câmpului

  function openPanel({ kbd = false } = {}) {
    const st = active;
    if (!st) return;
    const sel0 = kbd ? selOffsets(st) || st.sel : null;
    closeCard();
    closePanel();
    st.sel = sel0;
    panelSt = st;
    const n = ++uidN;
    const p = el('div', 'panel');
    p.dir = uiDir(ui); p.lang = ui;
    panelEl = p;
    p.setAttribute('role', 'dialog');
    p.setAttribute('aria-modal', 'false');
    p.setAttribute('aria-labelledby', `ep${n}`);
    const h4 = el('h4', '', 'ERATA');
    h4.id = `ep${n}`;
    p.append(h4);
    const counts = {};
    for (const m of st.matches) counts[m.c] = (counts[m.c] || 0) + 1;
    for (const c of ['spelling', 'grammar', 'punctuation', 'typography', 'style']) {
      if (!counts[c]) continue;
      const line = el('div', 'line');
      line.append(el('span', 'lab c-' + c, T('cat_' + c)), el('b', '', String(counts[c])));
      p.append(line);
    }
    if (offline) p.append(el('div', 'muted', T('connection_lost')));
    else if (st.busy) p.append(el('div', 'muted', T('loading')));
    else if (!st.matches.length) p.append(el('div', 'muted', T('none')));
    if (st.stats?.readability) {
      const r = st.stats.readability;
      p.append(el('div', 'muted', `${T('readability')}: ${r.score}/100 · ${T(r.label)}${r.approx ? ' ≈' : ''} · ${r.words} ${T('words_abbr')}`));
    }
    const lrow = el('label', 'line');
    lrow.style.marginTop = '8px';
    lrow.append(el('span', '', T('language')));
    const sel = el('select');
    sel.append(new Option(`${T('auto')}${st.lang ? ' (' + st.lang + ')' : ''}`, 'auto'));
    for (const l of langs) sel.append(new Option(l.name, l.code));
    sel.value = st.langOverride || 'auto';
    sel.addEventListener('change', () => {
      st.langOverride = sel.value;
      schedule(st, 0);
    });
    lrow.append(sel);
    p.append(lrow);
    const btn = (label, fn) => {
      const b = el('button', 'big', label);
      b.type = 'button';
      b.addEventListener('click', async () => {
        closePanel(true);
        await fn();
      });
      p.append(b);
    };
    btn(T('fix_all'), () => fixAll(st));
    if (['ro', 'fr', 'es', 'pt'].includes(st.lang)) btn(T('restore'), () => restore(st));
    btn(T('site_disable'), async () => {
      await send({ t: 'toggleSite', host: location.hostname });
    });
    btn(T('open_options'), () => send({ t: 'openOptions' }));
    p.append(el('div', 'muted', T('kb_hint')));
    const x = el('button', 'x', '×');
    x.type = 'button';
    x.setAttribute('aria-label', T('close'));
    x.title = T('close');
    x.addEventListener('click', () => closePanel(true));
    p.append(x);
    wireKeys(p);
    badge.setAttribute('aria-expanded', 'true');
    const br = badge.getBoundingClientRect();
    place(p, { x: br.left - 200, y: br.top - 6, w: br.width, h: 0 });
    // deasupra insignei, când încape
    const ph = p.offsetHeight * cal.ky;
    p.style.top = fy(Math.max(8, Math.min(br.top - ph - 6, innerHeight - ph - 8))) + 'px';
    if (kbd) (focusables(p).find((b) => !b.classList.contains('x')) || p).focus({ preventScroll: true });
  }

  // ---------- aplicare corecții ----------
  function replaceRange(st, off, len, rep) {
    const el_ = st.el;
    let ok = false;
    if (st.kind === 'text') {
      el_.focus({ preventScroll: true });
      el_.setSelectionRange(off, off + len);
      try {
        ok = document.execCommand('insertText', false, rep); // păstrează istoricul nativ de undo
      } catch {}
      if (!ok) {
        el_.setRangeText(rep, off, off + len, 'end');
        el_.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: rep }));
      }
      return;
    }
    st.map = collect(el_);
    st.dirty = false;
    const r = rangeFor(st.map, off, off + len);
    if (!r) return;
    el_.focus({ preventScroll: true });
    const sel = getSelection();
    sel.removeAllRanges();
    sel.addRange(r);
    try {
      ok = document.execCommand('insertText', false, rep);
    } catch {}
    if (!ok) {
      r.deleteContents();
      r.insertNode(document.createTextNode(rep));
      el_.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: rep }));
    }
    st.dirty = true;
  }
  const mapPos = (p, asc) => {
    let d = 0;
    for (const e of asc) {
      if (p >= e.offset + e.length) d += e.replacement.length - e.length;
      else if (p > e.offset) return e.offset + d + e.replacement.length; // în interiorul înlocuirii: după ea
    }
    return p + d;
  };
  function applyEdits(st, edits) {
    if (st.composing || !edits.length) return 0;
    const sel = selOffsets(st) || st.sel; // selecția/cursorul utilizatorului se păstrează (mapat prin înlocuiri)
    const desc = [...edits].sort((a, b) => b.offset - a.offset);
    for (const e of desc) replaceRange(st, e.offset, e.length, e.replacement);
    if (sel) {
      const asc = [...edits].sort((a, b) => a.offset - b.offset);
      restoreSel(st, { s: mapPos(sel.s, asc), e: mapPos(sel.e, asc), d: sel.d });
    }
    st.matches = [];
    st.dirty = true;
    st.sel = null;
    render();
    schedule(st, 120);
    announce(T('applied', { n: edits.length }));
    return edits.length;
  }
  async function bulk(st, type) {
    if (st.composing) return;
    const full = getText(st);
    const [a, text] = windowOf(st, full);
    const r = await send({ t: type, text, lang: langOf(st) });
    if (!r?.ok || !r.edits?.length) return;
    if (getText(st) !== full) return schedule(st, 0); // textul s-a schimbat în timpul cererii: nu aplicăm poziții vechi
    applyEdits(st, a ? r.edits.map((e) => ({ ...e, offset: e.offset + a })) : r.edits);
  }
  const fixAll = (st) => bulk(st, 'fixAll');
  const restore = (st) => bulk(st, 'restore');

  // ---------- tastatură: deschiderea cardului/panoului fără mouse ----------
  function openSuggestions() {
    const cur = uiFocused() ? cardSt || panelSt : null;
    const st = cur || (focusedSt && active === focusedSt ? focusedSt : null);
    if (!st || st !== active) return false;
    if (!st.matches.length) {
      openPanel({ kbd: true });
      return true;
    }
    const order = st.matches.map((m, i) => i).sort((a, b) => st.matches[a].o - st.matches[b].o);
    let pick;
    if (cur && cardM) {
      const at = order.indexOf(st.matches.indexOf(cardM));
      pick = order[(at + 1) % order.length]; // a doua apăsare: următoarea problemă
    } else {
      const c = selOffsets(st)?.s ?? 0;
      pick = order.find((i) => c >= st.matches[i].o && c <= st.matches[i].o + st.matches[i].l);
      if (pick == null) pick = order.find((i) => st.matches[i].o >= c);
      if (pick == null) pick = order[0];
    }
    const h =
      revealMatch(st, pick) ||
      (() => {
        const er = st.el.getBoundingClientRect();
        return { x: Math.max(0, er.left) + 8, y: Math.max(0, er.top), w: 20, h: Math.min(24, er.height), mi: pick };
      })();
    openCard({ ...h, mi: pick }, { kbd: true });
    return true;
  }
  function runCommand(cmd) {
    const now = performance.now();
    if (runCommand.last === cmd && now - runCommand.t < 250) return true; // browserul + rezerva din pagină: o singură execuție
    runCommand.last = cmd;
    runCommand.t = now;
    const st = focusedSt || (uiFocused() ? cardSt || panelSt : null);
    switch (cmd) {
      case 'fix-all':
        if (!st) return false;
        fixAll(st);
        return true;
      case 'toggle-site':
        if (window !== window.top) return false; // altfel fiecare cadru ar inversa setarea (și ar anula efectul)
        send({ t: 'toggleSite', host: location.hostname });
        return true;
      case 'open-suggestions':
        return openSuggestions();
      case 'open-menu':
        if (!st || st !== active) return false;
        if (panelEl) {
          closePanel(true);
          return true;
        }
        openPanel({ kbd: true });
        return true;
      default:
        return false;
    }
  }

  // ---------- comenzi / stare ----------
  const onMessage = (msg, _s, reply) => {
    if (dead) return false;
    if (msg?.t === 'command') {
      runCommand(msg.cmd);
    } else if (msg?.t === 'status') {
      // răspunde cadrul cu focus; cadrul principal doar dacă niciun iframe nu are focusul
      const iframeFocus = document.activeElement && /^(IFRAME|FRAME)$/.test(document.activeElement.tagName);
      if (window === window.top ? iframeFocus : !focusedSt) return false;
      reply({ host: location.hostname, disabled: hostDisabled, count: active ? active.matches.length : 0, lang: active?.lang || null });
    }
    return false;
  };
  api.runtime.onMessage.addListener(onMessage);

  // curățare periodică a câmpurilor dispărute (SPA)
  const sweep = setInterval(() => {
    for (const st of [...states.values()]) if (!st.el.isConnected) detach(st);
  }, 5000);

  // contextul extensiei a fost invalidat (reîncărcare/actualizare): oprim tot, anunțăm discret, apoi ne scoatem din pagină
  function contextLost() {
    if (dead) return;
    dead = true;
    const st = active;
    const el_ = st?.el;
    life.abort();
    watchAC?.abort();
    ro?.disconnect();
    typeMo?.disconnect();
    clearInterval(poll);
    clearInterval(sweep);
    cancelAnimationFrame(raf);
    clearTimeout(cardTimer);
    clearTimeout(closeTimer);
    for (const s of states.values()) {
      clearTimeout(s.timer);
      s.mo?.disconnect();
      restoreSpell(s);
    }
    states.clear();
    try {
      api.storage?.onChanged?.removeListener(onStorage);
      api.runtime.onMessage.removeListener(onMessage);
    } catch {}
    layer.replaceChildren();
    overlay.replaceChildren();
    hits = [];
    active = focusedSt = null;
    if (el_?.isConnected && S?.badge !== false) {
      const er = el_.getBoundingClientRect();
      badge.hidden = false;
      badge.className = 'lost';
      badge.textContent = '!';
      badge.title = T('connection_lost');
      badge.setAttribute('aria-label', T('connection_lost'));
      badge.style.left = Math.max(0, er.right - 28) + 'px';
      badge.style.top = Math.max(0, er.bottom - 28) + 'px';
      live.textContent = T('connection_lost');
    }
    setTimeout(() => {
      host.remove();
      window.__erataLoaded = false;
    }, 6000);
  }
}
