// Script de conținut ERATA: detectează câmpurile de text, trimite textul către motorul local
// (fundalul extensiei) și desenează sublinierile într-un strat separat, fără a modifica DOM-ul paginii.
import { t as tr, guessUiLang } from './ui-strings.js';

const api = globalThis.browser ?? globalThis.chrome;
if (!window.__erataLoaded) {
  window.__erataLoaded = true;
  boot();
}

function boot() {
  let S = null; // setări
  let langs = [];
  let ui = guessUiLang();
  const states = new Map();
  let active = null;
  let hits = [];
  let hostDisabled = false;
  const T = (k, v) => tr(ui, k, v);

  const send = async (m) => {
    try {
      return await api.runtime.sendMessage(m);
    } catch {
      return null; // contextul extensiei a fost reîncărcat
    }
  };

  // ---------- strat UI (shadow DOM) ----------
  const host = document.createElement('erata-ui');
  host.style.cssText = 'all:initial;position:fixed;inset:0;z-index:2147483647;pointer-events:none;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const CSS = `
    :host{all:initial}
    *{box-sizing:border-box;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
    .u{position:fixed;pointer-events:none;height:4px;}
    .u.spelling{background:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='6' height='4'%3E%3Cpath d='M0 3 L1.5 1 L3 3 L4.5 1 L6 3' fill='none' stroke='%23d92d20' stroke-width='1.2'/%3E%3C/svg%3E") repeat-x left bottom/6px 4px}
    .u.grammar{border-bottom:2px solid #d97706}
    .u.punctuation{border-bottom:2px dashed #b45309}
    .u.typography{border-bottom:2px dotted #2563eb}
    .u.style{border-bottom:1px dotted #7c3aed}
    #badge{position:fixed;pointer-events:auto;width:22px;height:22px;border-radius:11px;border:0;cursor:pointer;color:#fff;font:600 11px/22px system-ui;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.35);padding:0;user-select:none}
    #badge.ok{background:#16794c}#badge.bad{background:#b42318}#badge.busy{background:#667085}
    .card,.panel{position:fixed;pointer-events:auto;background:#fff;color:#1d2939;border:1px solid #d0d5dd;border-radius:10px;box-shadow:0 8px 24px rgba(16,24,40,.22);font-size:13px;line-height:1.35;max-width:340px;min-width:200px;padding:10px 12px}
    .card .cat{font-size:11px;font-weight:600;letter-spacing:.03em;text-transform:uppercase;display:flex;align-items:center;gap:6px;margin-bottom:4px}
    .card .dot{width:8px;height:8px;border-radius:50%}
    .card .msg{margin:2px 0 8px}
    .chips{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}
    button.chip{background:#eef4ff;color:#1849a9;border:1px solid #b2ccff;border-radius:6px;padding:3px 9px;font-size:13px;cursor:pointer}
    button.chip:hover,button.chip:focus-visible{background:#d1e0ff;outline:2px solid #528bff}
    button.act{background:none;border:0;color:#475467;font-size:12px;padding:2px 4px;cursor:pointer;text-decoration:underline}
    button.act:hover{color:#101828}
    .row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
    .panel h4{margin:0 0 6px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:#475467}
    .panel .line{display:flex;justify-content:space-between;gap:12px;margin:2px 0}
    .panel select{font-size:12px;max-width:130px}
    .panel button.big{width:100%;margin-top:6px;padding:6px 8px;border-radius:7px;border:1px solid #d0d5dd;background:#f9fafb;cursor:pointer;font-size:13px;text-align:left}
    .panel button.big:hover{background:#eef4ff}
    .muted{color:#667085;font-size:12px}
    @media (prefers-color-scheme:dark){.card,.panel{background:#1d2939;color:#f2f4f7;border-color:#475467}button.chip{background:#1e3a8a;color:#dbeafe;border-color:#3b82f6}.panel button.big{background:#263447;color:#f2f4f7;border-color:#475467}.muted{color:#98a2b3}button.act{color:#cbd5e1}}
  `;
  try {
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(CSS);
    shadow.adoptedStyleSheets = [sheet];
  } catch {
    const st = document.createElement('style');
    st.textContent = CSS;
    shadow.append(st);
  }
  const layer = document.createElement('div');
  const mirror = document.createElement('div');
  mirror.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;';
  const badge = document.createElement('button');
  badge.id = 'badge';
  badge.hidden = true;
  badge.type = 'button';
  const overlay = document.createElement('div');
  shadow.append(layer, mirror, badge, overlay);
  const mount = () => {
    if (!host.isConnected) (document.documentElement || document).append(host);
  };

  // ---------- setări ----------
  async function loadSettings() {
    const r = await send({ t: 'getSettings' });
    if (!r?.ok) return;
    S = r.settings;
    langs = r.languages;
    ui = S.ui || ui;
    hostDisabled = !S.enabled || S.disabledSites.includes(location.hostname);
    if (hostDisabled) detachAll();
    else if (active) schedule(active, 0);
  }
  api.storage?.onChanged?.addListener((ch, area) => {
    if (area === 'local' && ch.settings) loadSettings();
  });
  loadSettings();

  // ---------- detectarea câmpurilor ----------
  const BAD_CLASS = '.CodeMirror,.cm-editor,.monaco-editor,.ace_editor,[data-erata="off"],.xterm';
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
  function eligible(el) {
    if (!el || !el.isConnected) return false;
    if (el.matches?.('input')) {
      const ty = (el.getAttribute('type') || 'text').toLowerCase();
      if (!['text', 'search', ''].includes(ty)) return false;
      const ac = (el.getAttribute('autocomplete') || '').toLowerCase();
      if (/cc-|password|one-time|username|email|tel|postal|address-line/.test(ac)) return false;
      if (/pass|pwd|otp|card|cvv|iban|ssn|cnp|captcha|search-?id|email|user/i.test(el.name + ' ' + el.id)) return false;
    }
    if (el.readOnly || el.disabled) return false;
    if (el.getAttribute?.('spellcheck') === 'false' && !el.matches?.('[contenteditable]')) return false;
    if (el.closest?.(BAD_CLASS)) return false;
    const r = el.getBoundingClientRect();
    return r.width >= 60 && r.height >= 16;
  }

  const kindOf = (el) => (el.matches('textarea,input') ? 'text' : 'ce');

  function attach(el) {
    if (hostDisabled || !S) return null;
    let st = states.get(el);
    if (!st) {
      if (!eligible(el)) return null;
      st = { el, kind: kindOf(el), text: '', matches: [], version: 0, timer: 0, ignored: new Set(), lang: null, stats: null, geo: null, map: null, busy: false, langOverride: null };
      if (S.hideNative && st.kind === 'text') {
        st.nativeSpell = el.spellcheck;
        el.spellcheck = false;
      }
      states.set(el, st);
    }
    active = st;
    mount();
    schedule(st, 0);
    return st;
  }

  function detach(st) {
    clearTimeout(st.timer);
    if (st.nativeSpell !== undefined) st.el.spellcheck = st.nativeSpell;
    states.delete(st.el);
    if (active === st) {
      active = null;
      clearUi();
    }
  }
  function detachAll() {
    for (const st of [...states.values()]) detach(st);
    clearUi();
  }

  document.addEventListener(
    'focusin',
    (e) => {
      const el = targetOf(e.composedPath?.()[0] || e.target);
      if (el) attach(el);
      else if (!host.contains(e.target)) closeCard();
    },
    true
  );
  document.addEventListener(
    'input',
    (e) => {
      const el = targetOf(e.composedPath?.()[0] || e.target);
      const st = el && states.get(el);
      if (st) {
        reconcile(st);
        render();
        schedule(st, st.text.length > 20000 ? 1200 : 450);
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
    st.matches = st.matches
      .map((m) => (m.o + m.l <= p ? m : m.o >= oldT.length - s ? { ...m, o: m.o + delta } : null))
      .filter(Boolean);
  }
  document.addEventListener('compositionend', () => active && schedule(active, 200), true);
  window.addEventListener('scroll', () => requestRender(), { capture: true, passive: true });
  window.addEventListener('resize', () => requestRender(), { passive: true });
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
          text += c.data.replace(/\u00A0(?= )|(?<= )\u00A0/g, ' ');
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
    const s = find(a, false);
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
  function getText(st) {
    if (st.kind === 'text') return st.el.value;
    st.map = collect(st.el);
    return st.map.text;
  }

  // ---------- verificare ----------
  function schedule(st, delay = 450) {
    clearTimeout(st.timer);
    st.timer = setTimeout(() => runCheck(st), delay);
  }
  async function runCheck(st) {
    if (!st.el.isConnected) return detach(st);
    const text = getText(st);
    if (!text.trim()) {
      st.text = text;
      st.matches = [];
      st.stats = null;
      render();
      return;
    }
    st.text = text;
    st.busy = true;
    render();
    const v = ++st.version;
    const r = await send({ t: 'check', text, lang: st.langOverride && st.langOverride !== 'auto' ? st.langOverride : undefined });
    if (v !== st.version) return;
    st.busy = false;
    if (!r?.ok) {
      st.matches = [];
      render();
      return;
    }
    st.matches = r.matches.filter((m) => !st.ignored.has(keyOf(st, m)));
    st.lang = r.lang;
    st.stats = r.stats;
    st.geo = null;
    render();
  }
  const keyOf = (st, m) => `${m.id}|${st.text.slice(m.o, m.o + m.l)}`;

  // ---------- randare ----------
  let raf = 0;
  function requestRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      render();
    });
  }
  function clearUi() {
    layer.replaceChildren();
    badge.hidden = true;
    hits = [];
    closeCard();
    closePanel();
  }

  function textGeo(st) {
    const el = st.el;
    const key = `${el.clientWidth}|${st.text.length}|${st.matches.length}|${st.version}`;
    if (st.geo && st.geo.key === key) return st.geo;
    const cs = getComputedStyle(el);
    const props = ['fontFamily', 'fontSize', 'fontWeight', 'fontStyle', 'fontVariant', 'letterSpacing', 'wordSpacing', 'textTransform', 'textIndent', 'textAlign', 'lineHeight', 'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft', 'tabSize', 'direction'];
    mirror.style.cssText = 'position:fixed;left:-99999px;top:0;visibility:hidden;pointer-events:none;box-sizing:border-box;border:0;margin:0;';
    for (const p of props) mirror.style[p] = cs[p];
    const multi = el.matches('textarea');
    mirror.style.whiteSpace = multi ? 'pre-wrap' : 'pre';
    mirror.style.overflowWrap = multi ? 'break-word' : 'normal';
    mirror.style.width = multi ? el.clientWidth + 'px' : 'auto';
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
    mirror.append(st.text.slice(pos) + '​');
    const mr = mirror.getBoundingClientRect();
    const items = spans.map(([i, sp]) => ({
      mi: i,
      rects: [...sp.getClientRects()].map((r) => ({ x: r.left - mr.left, y: r.top - mr.top, w: r.width, h: r.height })),
    }));
    const yoff = multi ? 0 : Math.max(0, (el.clientHeight - mr.height) / 2);
    st.geo = { key, items, yoff, cs: { bl: parseFloat(cs.borderLeftWidth) || 0, bt: parseFloat(cs.borderTopWidth) || 0 } };
    mirror.textContent = '';
    return st.geo;
  }

  function ceItems(st) {
    // validare: textul curent al DOM-ului trebuie să corespundă cu cel verificat
    const cur = collect(st.el);
    if (cur.text !== st.text) return null;
    st.map = cur;
    return st.matches.map((m, i) => {
      const r = rangeFor(cur, m.o, m.o + m.l);
      return { mi: i, rects: r ? [...r.getClientRects()].map((c) => ({ x: c.left, y: c.top, w: c.width, h: c.height })) : [] };
    });
  }

  function render() {
    mount();
    const st = active;
    layer.replaceChildren();
    hits = [];
    if (!st || !st.el.isConnected || hostDisabled) {
      badge.hidden = true;
      return;
    }
    const er = st.el.getBoundingClientRect();
    const vis = { l: Math.max(0, er.left), t: Math.max(0, er.top), r: Math.min(innerWidth, er.right), b: Math.min(innerHeight, er.bottom) };
    if (vis.r <= vis.l || vis.b <= vis.t) {
      badge.hidden = true;
      return;
    }
    let items = null;
    try {
      if (st.kind === 'text') {
        const g = textGeo(st);
        const el = st.el;
        items = g.items.map((it) => ({
          mi: it.mi,
          rects: it.rects.map((r) => ({
            x: er.left + g.cs.bl + r.x - el.scrollLeft,
            y: er.top + g.cs.bt + r.y - el.scrollTop + g.yoff,
            w: r.w,
            h: r.h,
          })),
        }));
      } else items = ceItems(st);
    } catch {
      items = null;
    }
    if (items) {
      const frag = document.createDocumentFragment();
      for (const it of items) {
        const m = st.matches[it.mi];
        for (const r of it.rects) {
          // decupare la zona vizibilă a câmpului
          const x1 = Math.max(r.x, vis.l);
          const x2 = Math.min(r.x + r.w, vis.r);
          const y1 = Math.max(r.y, vis.t);
          const y2 = Math.min(r.y + r.h, vis.b);
          if (x2 - x1 < 2 || y2 - y1 < 4) continue;
          const u = document.createElement('div');
          u.className = 'u ' + m.c;
          u.style.cssText = `left:${x1}px;top:${r.y + r.h - 4}px;width:${x2 - x1}px;`;
          if (r.y + r.h - 4 >= vis.b || r.y + r.h - 4 < vis.t) continue;
          frag.append(u);
          hits.push({ x: x1, y: y1, w: x2 - x1, h: y2 - y1, mi: it.mi });
        }
      }
      layer.append(frag);
    }
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
    badge.style.left = Math.max(0, vis.r - size - 6) + 'px';
    badge.style.top = small ? vis.t + (vis.b - vis.t - size) / 2 + 'px' : Math.max(0, vis.b - size - 6) + 'px';
    badge.className = st.busy ? 'busy' : n ? 'bad' : 'ok';
    badge.textContent = st.busy ? '…' : n ? (n > 99 ? '99+' : String(n)) : '✓';
    badge.title = n ? T('issues', { n }) : T('none');
    badge.setAttribute('aria-label', badge.title);
  }

  // ---------- card cu sugestii ----------
  let cardTimer = 0;
  let closeTimer = 0;
  let cardHover = false;
  let cardFor = -1;
  const COLORS = { spelling: '#d92d20', grammar: '#d97706', punctuation: '#b45309', typography: '#2563eb', style: '#7c3aed' };

  function closeCard() {
    clearTimeout(cardTimer);
    overlay.querySelectorAll('.card').forEach((n) => n.remove());
    cardFor = -1;
    cardHover = false;
  }
  function hitAt(x, y) {
    for (const h of hits) if (x >= h.x && x <= h.x + h.w && y >= h.y - 2 && y <= h.y + h.h + 3) return h;
    return null;
  }
  let lastMove = 0;
  document.addEventListener(
    'mousemove',
    (e) => {
      if (!active || !hits.length) return;
      const now = performance.now();
      if (now - lastMove < 40) return;
      lastMove = now;
      const h = hitAt(e.clientX, e.clientY);
      if (h) {
        clearTimeout(closeTimer);
        if (h.mi !== cardFor) {
          clearTimeout(cardTimer);
          cardTimer = setTimeout(() => openCard(h), 220);
        }
      } else {
        clearTimeout(cardTimer);
        if (cardFor >= 0 && !cardHover) {
          clearTimeout(closeTimer);
          closeTimer = setTimeout(() => !cardHover && closeCard(), 350);
        }
      }
    },
    { passive: true }
  );
  document.addEventListener(
    'click',
    (e) => {
      if (!active || !hits.length) return;
      const h = hitAt(e.clientX, e.clientY);
      if (h) openCard(h);
      else if (!e.composedPath().includes(host)) {
        closeCard();
        closePanel();
      }
    },
    true
  );
  document.addEventListener('keydown', (e) => e.key === 'Escape' && (closeCard(), closePanel()), true);

  const el = (tag, cls, text) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  };

  function place(node, rect, w = 320) {
    overlay.append(node);
    const h = node.offsetHeight || 120;
    let x = Math.min(Math.max(8, rect.x), innerWidth - Math.min(w, node.offsetWidth || w) - 8);
    let y = rect.y + rect.h + 6;
    if (y + h > innerHeight - 8) y = Math.max(8, rect.y - h - 6);
    node.style.left = x + 'px';
    node.style.top = y + 'px';
  }

  async function openCard(h) {
    const st = active;
    const m = st?.matches[h.mi];
    if (!m) return;
    closeCard();
    closePanel();
    cardFor = h.mi;
    const card = el('div', 'card');
    card.setAttribute('role', 'dialog');
    const cat = el('div', 'cat');
    const dot = el('span', 'dot');
    dot.style.background = COLORS[m.c] || '#667085';
    cat.append(dot, el('span', '', T('cat_' + m.c)));
    const msg = el('div', 'msg', m.m);
    const chips = el('div', 'chips');
    const acts = el('div', 'row');
    card.append(cat, msg, chips, acts);
    card.addEventListener('mouseenter', () => (cardHover = true));
    card.addEventListener('mouseleave', () => {
      cardHover = false;
      closeTimer = setTimeout(closeCard, 350);
    });
    const word = st.text.slice(m.o, m.o + m.l);
    const addChip = (txt, show = txt) => {
      const b = el('button', 'chip', show === '' ? '⌫' : show.replace(/ /g, '·').replace(/ | /g, '␣'));
      b.type = 'button';
      b.title = txt === '' ? 'Șterge / Delete' : txt;
      b.addEventListener('click', () => {
        applyEdits(st, [{ offset: m.o, length: m.l, replacement: txt }]);
        closeCard();
      });
      chips.append(b);
    };
    const act = (label, fn) => {
      const b = el('button', 'act', label);
      b.type = 'button';
      b.addEventListener('click', () => {
        fn();
        closeCard();
      });
      acts.append(b);
    };
    if (m.id === 'SPELLING') {
      chips.append(el('span', 'muted', T('loading')));
      place(card, h);
      const r = await send({ t: 'suggest', word, lang: st.lang, context: st.text.slice(Math.max(0, m.o - 120), m.o + 120) });
      if (cardFor !== h.mi) return;
      chips.textContent = '';
      const list = r?.suggestions || [];
      if (!list.length) chips.append(el('span', 'muted', T('no_sugg')));
      for (const s of list.slice(0, 6)) addChip(s.text);
      act(T('add_word'), async () => {
        await send({ t: 'addWord', word });
        schedule(st, 0);
      });
    } else {
      if (m.r && m.r.length) for (const r of m.r.slice(0, 5)) addChip(r);
      else chips.remove();
      if (m.id === 'STYLE_LONG_SENTENCE' && S.llm?.enabled) {
        act(T('rewrite'), () => rewriteSentence(st, m));
      }
      place(card, h);
    }
    act(T('ignore'), () => {
      st.ignored.add(keyOf(st, m));
      st.matches = st.matches.filter((x) => x !== m);
      st.geo = null;
      render();
    });
    if (m.id !== 'SPELLING') {
      act(T('ignore_rule'), async () => {
        await send({ t: 'disableRule', id: m.id });
        schedule(st, 0);
      });
    }
    if (m.id === 'SPELLING') place(card, h);
  }

  async function rewriteSentence(st, m) {
    const sentence = st.text.slice(m.o, m.o + 400).split(/(?<=[.!?])\s/)[0];
    const r = await send({ t: 'rewrite', text: sentence, lang: st.lang });
    if (r?.ok && r.text) applyEdits(st, [{ offset: m.o, length: sentence.length, replacement: r.text }]);
  }

  // ---------- panou (insigna) ----------
  let panelOpen = false;
  function closePanel() {
    overlay.querySelectorAll('.panel').forEach((n) => n.remove());
    panelOpen = false;
  }
  badge.addEventListener('click', (e) => {
    e.stopPropagation();
    if (panelOpen) return closePanel();
    openPanel();
  });
  badge.addEventListener('mousedown', (e) => e.preventDefault()); // nu pierde focusul câmpului

  function openPanel() {
    const st = active;
    if (!st) return;
    closeCard();
    panelOpen = true;
    const p = el('div', 'panel');
    p.append(el('h4', '', 'ERATA'));
    const counts = {};
    for (const m of st.matches) counts[m.c] = (counts[m.c] || 0) + 1;
    for (const c of Object.keys(COLORS)) {
      if (!counts[c]) continue;
      const line = el('div', 'line');
      const lab = el('span', '', T('cat_' + c));
      lab.style.color = COLORS[c];
      line.append(lab, el('b', '', String(counts[c])));
      p.append(line);
    }
    if (!st.matches.length) p.append(el('div', 'muted', T('none')));
    if (st.stats?.readability) {
      const r = st.stats.readability;
      p.append(el('div', 'muted', `${T('readability')}: ${r.score}/100 · ${T(r.label)}${r.approx ? ' ≈' : ''} · ${r.words} ${ui === 'ro' ? 'cuv.' : 'w.'}`));
    }
    const lrow = el('div', 'line');
    lrow.style.marginTop = '8px';
    lrow.append(el('span', '', T('language')));
    const sel = el('select');
    const optA = new Option(`${T('auto')}${st.lang ? ' (' + st.lang + ')' : ''}`, 'auto');
    sel.append(optA);
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
        await fn();
        closePanel();
      });
      p.append(b);
    };
    btn(T('fix_all'), () => fixAll(st));
    if (['ro', 'fr', 'es', 'pt'].includes(st.lang)) btn(T('restore'), () => restore(st));
    btn(T('site_disable'), async () => {
      await send({ t: 'toggleSite', host: location.hostname });
    });
    btn(T('open_options'), () => send({ t: 'openOptions' }));
    const br = badge.getBoundingClientRect();
    place(p, { x: br.left - 200, y: br.top - 6, w: br.width, h: 0 }, 260);
    // deasupra insignei
    const ph = p.offsetHeight;
    p.style.top = Math.max(8, Math.min(br.top - ph - 6, innerHeight - ph - 8)) + 'px';
  }

  // ---------- aplicare corecții ----------
  function replaceRange(st, off, len, rep) {
    const el_ = st.el;
    let ok = false;
    if (st.kind === 'text') {
      el_.focus({ preventScroll: true });
      el_.setSelectionRange(off, off + len);
      try {
        ok = document.execCommand('insertText', false, rep);
      } catch {}
      if (!ok) {
        el_.setRangeText(rep, off, off + len, 'end');
        el_.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertReplacementText', data: rep }));
      }
      return;
    }
    st.map = collect(el_);
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
  }
  function applyEdits(st, edits) {
    const sorted = [...edits].sort((a, b) => b.offset - a.offset);
    for (const e of sorted) replaceRange(st, e.offset, e.length, e.replacement);
    st.matches = [];
    render();
    schedule(st, 120);
    return sorted.length;
  }
  async function fixAll(st) {
    const text = getText(st);
    const r = await send({ t: 'fixAll', text, lang: st.langOverride && st.langOverride !== 'auto' ? st.langOverride : undefined });
    if (r?.ok && r.edits.length) applyEdits(st, r.edits);
  }
  async function restore(st) {
    const text = getText(st);
    const r = await send({ t: 'restore', text, lang: st.langOverride && st.langOverride !== 'auto' ? st.langOverride : undefined });
    if (r?.ok && r.edits.length) applyEdits(st, r.edits);
  }

  // ---------- comenzi / stare ----------
  api.runtime.onMessage.addListener((msg, _s, reply) => {
    if (msg?.t === 'command') {
      if (msg.cmd === 'fix-all' && active) fixAll(active);
      if (msg.cmd === 'toggle-site') send({ t: 'toggleSite', host: location.hostname });
    } else if (msg?.t === 'status') {
      reply({ host: location.hostname, disabled: hostDisabled, count: active ? active.matches.length : 0, lang: active?.lang || null });
    }
    return false;
  });

  // curățare periodică a câmpurilor dispărute
  setInterval(() => {
    for (const st of [...states.values()]) if (!st.el.isConnected) detach(st);
  }, 5000);
  const first = document.activeElement && targetOf(document.activeElement);
  if (first) setTimeout(() => S && attach(first), 400);
}
