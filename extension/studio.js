import { t, guessUiLang } from './ui-strings.js';

const api = globalThis.browser ?? globalThis.chrome;
const send = (m) => api.runtime.sendMessage(m);
const $ = (id) => document.getElementById(id);
const COLORS = { spelling: '#d92d20', grammar: '#d97706', punctuation: '#b45309', typography: '#2563eb', style: '#7c3aed' };
let ui = guessUiLang();
let timer = 0;
let version = 0;

function applyEdits(text, edits) {
  let out = text;
  for (const e of [...edits].sort((a, b) => b.offset - a.offset)) out = out.slice(0, e.offset) + e.replacement + out.slice(e.offset + e.length);
  return out;
}

async function run() {
  const text = $('txt').value;
  const v = ++version;
  const lang = $('lang').value;
  const r = await send({ t: 'check', text, lang: lang === 'auto' ? undefined : lang });
  if (v !== version || !r?.ok) return;
  const ul = $('issues');
  ul.replaceChildren();
  if (!r.matches.length) {
    const li = document.createElement('li');
    li.textContent = text.trim() ? t(ui, 'none') : t(ui, 'empty');
    ul.append(li);
  }
  for (const m of r.matches) {
    const li = document.createElement('li');
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.style.background = COLORS[m.c];
    chip.textContent = t(ui, 'cat_' + m.c);
    const ctxA = text.slice(Math.max(0, m.o - 25), m.o);
    const bad = text.slice(m.o, m.o + m.l);
    const ctxB = text.slice(m.o + m.l, m.o + m.l + 25);
    const p = document.createElement('div');
    p.append('…' + ctxA, Object.assign(document.createElement('mark'), { textContent: bad }), ctxB + '…');
    const msg = document.createElement('div');
    msg.className = 'muted';
    msg.textContent = m.m;
    const sug = document.createElement('div');
    sug.className = 'sug';
    const addBtn = (rep) => {
      const b = document.createElement('button');
      b.textContent = rep === '' ? '⌫' : rep;
      b.addEventListener('click', () => {
        $('txt').value = applyEdits($('txt').value, [{ offset: m.o, length: m.l, replacement: rep }]);
        schedule(0);
      });
      sug.append(b);
    };
    if (m.id === 'SPELLING') {
      const more = document.createElement('button');
      more.textContent = '…';
      more.addEventListener('click', async () => {
        more.remove();
        const s = await send({ t: 'suggest', word: bad, lang: r.lang, context: text.slice(Math.max(0, m.o - 100), m.o + 100) });
        for (const x of (s.suggestions || []).slice(0, 6)) addBtn(x.text);
        const add = document.createElement('button');
        add.textContent = t(ui, 'add_word');
        add.addEventListener('click', async () => {
          await send({ t: 'addWord', word: bad });
          schedule(0);
        });
        sug.append(add);
      });
      sug.append(more);
    } else for (const rep of (m.r || []).slice(0, 4)) addBtn(rep);
    li.append(chip, p, msg, sug);
    ul.append(li);
  }
  const rd = r.stats?.readability;
  $('stats').textContent = [r.lang, rd ? `${t(ui, 'readability')} ${rd.score}/100 (${t(ui, rd.label)})${rd.approx ? ' ≈' : ''}` : '', r.matches.length ? t(ui, 'issues', { n: r.matches.length }) : ''].filter(Boolean).join(' · ');
}
const schedule = (d = 350) => {
  clearTimeout(timer);
  timer = setTimeout(run, d);
};

(async () => {
  const r = await send({ t: 'getSettings' });
  ui = r.settings.ui || ui;
  document.documentElement.lang = ui;
  document.title = 'ERATA — ' + t(ui, 'studio');
  $('title').textContent = 'ERATA · ' + t(ui, 'studio');
  $('hint').textContent = t(ui, 'studio_hint');
  $('fix').textContent = t(ui, 'fix_all');
  $('restore').textContent = t(ui, 'restore');
  $('lang').append(new Option(t(ui, 'auto'), 'auto'), ...r.languages.map((l) => new Option(l.name, l.code)));
  $('txt').addEventListener('input', () => schedule());
  $('lang').addEventListener('change', () => schedule(0));
  $('fix').addEventListener('click', async () => {
    const x = await send({ t: 'fixAll', text: $('txt').value, lang: $('lang').value === 'auto' ? undefined : $('lang').value });
    if (x?.ok) $('txt').value = applyEdits($('txt').value, x.edits);
    schedule(0);
  });
  $('restore').addEventListener('click', async () => {
    const x = await send({ t: 'restore', text: $('txt').value, lang: $('lang').value === 'auto' ? undefined : $('lang').value });
    if (x?.ok) $('txt').value = applyEdits($('txt').value, x.edits);
    schedule(0);
  });
  $('copy').addEventListener('click', () => navigator.clipboard?.writeText($('txt').value));
  schedule(0);
})();
