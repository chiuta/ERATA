"""Audit adversarial (Chromium real, Playwright). Secțiuni:
  legacy   câmpuri ignorate, iframe, shadow DOM, RTL, câmp mare, undo, Escape, SPA, reîncărcarea extensiei, setări corupte, import ISO-8859
  kbd      navigare doar cu tastatura: deschidere card/panou, capcană de focus, Esc, restaurarea focusului, role/aria localizate (8 limbi)
  ime      compoziție IME (CJK/taste moarte), undo nativ în contenteditable, selecție activă la reconciliere
  geom     derulare imbricată, iframe, transformări CSS, zoom 50–300 %, RTL/ebraică, text vertical, top layer (<dialog>), CSP strict
  theme    mod închis, forced-colors, prefers-reduced-motion, contrast WCAG AA
  sw       service worker adormit, reconectare, reîncărcarea extensiei (context invalidat)
  leak     500 de montări/demontări: noduri/ascultători/heap stabile
  privacy  manifest, câmpuri sensibile fără ascultători, CSP de extensie, netlog complet (0 cereri în afara celor documentate)
  names    regex-ul de nume restrâns la semnale reale
  rules    regulile utilizatorului: aceeași analiză anti-ReDoS ca în motor (fundal + pagina de opțiuni)
  hostile  5000 de textarea, 1 MB, SPA rapid, all:unset, z-index extrem, html transformat
Rulare: python3 test/e2e/audit.py [secțiune ...]  (implicit toate)."""
import asyncio, os, re, shutil, subprocess, sys, json, time
from playwright.async_api import async_playwright
from helpers import *
from pages import PAGES

Pages.html = PAGES
PAGE = 'file://' + os.path.join(ROOT, 'test', 'e2e', 'audit.html')
PROFILE = '/tmp/erata-audit-profile'
LANGS8 = ['ro', 'en', 'fr', 'it', 'es', 'pt', 'de', 'hu']


class Env:
    pass


# ---------- texte de interfață (din extension/ui-strings.js, nu copiate aici) ----------
def load_ui_strings():
    js = ("import {t} from '%s/extension/ui-strings.js';const L=%s;const K=%s;const o={};"
          "for(const l of L){o[l]={};for(const k of K)o[l][k]=t(l,k,{n:'{n}',code:'{code}'})}console.log(JSON.stringify(o))") % (
        ROOT, json.dumps(LANGS8), json.dumps(
            'close suggestions open_menu import_invalid import_encoding connection_lost kb_hint custom_rule copy dict_aff dict_dic import_done '
            'add pattern_unsafe cat_spelling cat_grammar ignore ignore_rule add_word remove loading no_sugg fix_all restore site_disable open_options none issues language auto studio app'.split()))
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js], text=True))


UI = load_ui_strings()


async def open_page(env, name, qs='', wait=500, viewport=None):
    page = await env.ctx.new_page()
    errs = []
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
    if viewport:
        await page.set_viewport_size(viewport)
    await page.goto(f'{env.base}/{name}{qs}')
    await page.wait_for_timeout(wait)
    return page, errs


async def close_others(env, keep=()):
    for pg in list(env.ctx.pages):
        if pg not in keep:
            try:
                await pg.close()
            except Exception:
                pass


async def refresh_sw(env):
    """După reîncărcarea/oprirea extensiei: pornește (prin pagina de opțiuni, care trimite mesaje) și ia noua instanță a worker-ului."""
    wake = None
    for attempt in range(12):
        sws = [s for s in env.ctx.service_workers if env.eid in s.url]
        for s in reversed(sws):
            try:
                await asyncio.wait_for(s.evaluate('1'), 2)
                env.sw = s
                if wake:
                    await wake.close()
                return s
            except Exception:
                pass
        if wake is None:
            wake = await env.ctx.new_page()
            try:
                await wake.goto(f'chrome-extension://{env.eid}/options.html')
            except Exception:
                pass
        await asyncio.sleep(0.5)
    raise RuntimeError('service worker indisponibil')


# =====================================================================================================================
async def sec_legacy(env):
    ctx, sw, eid = env.ctx, env.sw, env.eid
    errs = []
    page = await ctx.new_page()
    for pg in list(ctx.pages):
        if pg is not page:
            await pg.close()
    page.on('pageerror', lambda e: errs.append(str(e)))
    page.on('console', lambda m: errs.append('console:' + m.text) if m.type == 'error' else None)
    await page.goto(PAGE); await page.wait_for_timeout(500)
    TXT = 'scoala'

    # 1. câmp de referință: textarea normal produce card (control pozitiv)
    await page.click('#ta'); await page.keyboard.type(TXT, delay=3); await page.wait_for_timeout(1600)
    check('control: textarea normal deschide card', await card_near(page, 30, 21))
    await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
    check('Escape închide cardul', not await page.evaluate(CARD_JS, [30, 29]))

    # 2. câmpuri ignorate: parolă / email / card / spellcheck=false nu primesc nimic
    for sel, top in (('#pw', 110), ('#em', 150), ('#cc', 190)):
        await page.click(sel); await page.keyboard.type(TXT, delay=2); await page.wait_for_timeout(1500)
        check(f'ignorat: {sel}', not await card_near(page, 30, top + 10))
    await page.click('#nospell'); await page.keyboard.type(TXT, delay=2); await page.wait_for_timeout(1500)
    check('ignorat: textarea cu spellcheck=false (decizia paginii) nu primește UI', not await card_near(page, 30, 240))
    check('ignorat: spellcheck=false — atributul paginii rămâne neschimbat', await page.evaluate("document.getElementById('nospell').getAttribute('spellcheck')") == 'false')

    # 3. input cu padding mare: sublinierea trebuie să cadă pe cuvânt
    await page.click('#pad'); await page.keyboard.type('scoala', delay=3); await page.wait_for_timeout(1600)
    # Poziția se calculează din caseta reală a câmpului: înălțimea rândului depinde de fontul care ține locul lui Arial.
    r = await page.evaluate("(()=>{const b=document.getElementById('pad').getBoundingClientRect();return [b.left,b.top,b.bottom]})()")
    hit = False
    for yy in (r[2] - 12, (r[1] + r[2]) / 2 + 4, (r[1] + r[2]) / 2):
        if await card_near(page, r[0] + 2 + 60 + 20, yy):
            hit = True; break
    check('input cu padding mare: card pe cuvânt', hit, r)

    # 4. RTL contenteditable: nu stricăm DOM-ul, nu apar erori
    await page.click('#rtl'); await page.keyboard.type('שלום scoala', delay=3); await page.wait_for_timeout(1500)
    check('RTL: text păstrat', 'שלום' in await page.inner_text('#rtl'))

    # 5. contenteditable imbricat/rich: structura rămâne neatinsă
    before = await page.inner_html('#nest')
    await page.click('#nest p'); await page.keyboard.type(' scoala', delay=3); await page.wait_for_timeout(1500)
    after = await page.inner_html('#nest')
    check('rich CE: fără noduri străine', 'erata' not in after.lower().replace('erata-ui', ''), after)

    # 6. iframe
    fr = page.frame_locator('#fr')
    await fr.locator('#t').click(); await page.keyboard.type(TXT, delay=3); await page.wait_for_timeout(1600)
    check('iframe: câmpul rămâne editabil', (await fr.locator('#t').input_value()) == TXT)

    # 7. shadow DOM deschis
    await page.click('#host >> textarea'); await page.keyboard.type(TXT, delay=3); await page.wait_for_timeout(1500)
    check('shadow DOM: câmp editabil, fără erori', (await page.evaluate("document.getElementById('host').shadowRoot.getElementById('sht').value")) == TXT)

    # 8. câmp mare (200 KB): răspuns rapid, fără blocare
    big = ('Mama si copiii merg la scoala. ' * 6600)[:200000]
    t0 = await page.evaluate("""(b)=>{const t=document.getElementById('ta');t.value=b;t.dispatchEvent(new Event('input',{bubbles:true}));const s=performance.now();t.focus();return s}""", big)
    await page.wait_for_timeout(2500)
    lat = await page.evaluate("""()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})""")
    check('200 KB: pagina rămâne receptivă (<500 ms/cadru)', lat < 500, lat)

    # 9. SPA: înlocuirea elementului și ștergerea lui nu produc erori
    await page.click('#s1'); await page.keyboard.type(TXT, delay=3); await page.wait_for_timeout(800)
    await page.evaluate("document.getElementById('spa').innerHTML='<textarea id=\"s2\" style=\"width:300px;height:60px\"></textarea>'")
    await page.wait_for_timeout(300); await page.click('#s2'); await page.keyboard.type(TXT, delay=3); await page.wait_for_timeout(1500)
    await page.evaluate("document.getElementById('spa').remove()"); await page.wait_for_timeout(6000)
    check('SPA: elemente înlocuite/șterse fără erori', not errs, errs)

    # 10. zoom 200 % : câmpul rămâne funcțional
    await page.evaluate("document.getElementById('ta').value='';document.body.style.zoom=2")
    await page.click('#ta'); await page.keyboard.type('scoala', delay=3); await page.wait_for_timeout(1500)
    await page.evaluate("document.body.style.zoom=1")
    check('zoom 200%: fără erori', not errs, errs)


    # 13. undo: Ctrl+Z după aplicarea unei sugestii restaurează textul
    await page.evaluate("document.getElementById('ta').value=''")
    await page.click('#ta'); await page.keyboard.type('scoala', delay=3); await page.wait_for_timeout(1600)
    await page.mouse.move(10, 60); await page.mouse.move(28, 21); await page.wait_for_timeout(100); await page.mouse.move(30, 21); await page.wait_for_timeout(1200)
    clicked = False
    for dy in range(30, 120, 8):
        e = await page.evaluate("([x,y])=>{const e=document.elementFromPoint(x,y);return e&&e.tagName}", [60, 21 + dy])
        if e == 'ERATA-UI':
            await page.mouse.click(60, 21 + dy); clicked = True; await page.wait_for_timeout(300)
            if (await page.input_value('#ta')) != 'scoala': break
    v1 = await page.input_value('#ta')
    await page.focus('#ta'); await page.keyboard.press('Control+z'); await page.wait_for_timeout(400)
    v2 = await page.input_value('#ta')
    check('undo: Ctrl+Z restaurează după sugestie', v1 != 'scoala' and v2 == 'scoala', (v1, v2))


    # 14. import dicționar ISO-8859-2 (aff + dic cu diacritice) – decodat corect, salvat ca UTF-8
    op = await ctx.new_page(); await op.goto(f'chrome-extension://{eid}/options.html'); await op.wait_for_timeout(700)
    aff = 'SET ISO8859-2\nTRY aeiou\n'.encode('latin1')
    dic = '3\nsă\npădure\nșcoală\n'.encode('iso-8859-2', errors='replace')
    inputs = op.locator('input[type=file]')
    n = await inputs.count()
    await op.fill('input[placeholder][size="8"]', 'xx')
    await op.locator('input[accept=".aff"]').set_input_files(files=[{'name': 'x.aff', 'mimeType': 'text/plain', 'buffer': aff}])
    await op.locator('input[accept=".dic"]').set_input_files(files=[{'name': 'x.dic', 'mimeType': 'text/plain', 'buffer': dic}])
    await op.locator('input[accept=".dic"] + button').click(); await op.wait_for_timeout(800)
    stored = await op.evaluate("""()=>new Promise(r=>{const q=indexedDB.open('erata',1);q.onsuccess=()=>{const g=q.result.transaction('dicts').objectStore('dicts').get('xx');g.onsuccess=()=>r(g.result)}})""")
    print('  msg:', await op.evaluate("[...document.querySelectorAll('[role=status]')].map(e=>e.textContent).join('|')"), n)
    check('import ISO-8859-2: decodat și salvat UTF-8', bool(stored) and 'pădure' in stored['dic'] and 'SET UTF-8' in stored['aff'], stored)

    # 11. setări corupte în storage: fundalul nu cade, răspunde în continuare
    bad = {'enabled': 'da', 'lang': {'x': 1}, 'userRules': [{'pattern': '(a+)+$', 'replacement': 'x'}, 'junk', None, {'pattern': '['}],
           'disabledRules': 'nu-e-listă', 'categories': 'x', 'llm': 5, 'longSentence': 'mult'}
    await sw.evaluate("(b)=>chrome.storage.local.set({settings:b})", bad)
    await page.wait_for_timeout(500)
    st = await ctx.new_page(); await st.goto(f'chrome-extension://{eid}/studio.html'); await st.wait_for_timeout(600)
    await st.fill('#txt', 'Mama si copiii merg in padure sa culeaga fructe.'); await st.wait_for_timeout(1200)
    await st.click('#restore'); await st.wait_for_timeout(1500)
    v = await st.input_value('#txt')
    check('setări corupte: Studio funcționează', 'pădure' in v, v)
    # ReDoS: regula (a+)+$ trebuie respinsă, textul lung de "a" nu blochează
    await st.fill('#txt', 'a' * 5000 + '!'); await st.wait_for_timeout(1500)
    alive = await st.evaluate("1+1")
    check('regulă ReDoS respinsă: pagina vie', alive == 2)
    await sw.evaluate("()=>chrome.storage.local.remove('settings')")

    # 12. reîncărcarea extensiei: contextul invalidat nu aruncă erori în pagină
    n = len(errs)
    await sw.evaluate("()=>chrome.runtime.reload()"); await page.wait_for_timeout(2000)
    await page.click('#ta'); await page.keyboard.type(' scoala', delay=3); await page.wait_for_timeout(1500)
    await page.keyboard.press('Escape'); await page.mouse.move(100, 50); await page.wait_for_timeout(500)
    check('extensie reîncărcată: fără erori noi în pagină', len(errs) == n, errs[n:])
    check('fără erori JavaScript (legacy)', not errs, errs)


CARD_JS = """function(a){var x=a[0],y0=a[1];for(var dx=-20;dx<=120;dx+=20){for(var y=y0;y<y0+150;y+=6){var e=document.elementFromPoint(x+dx,y);if(e&&e.tagName==='ERATA-UI')return true}}return false}"""


async def card_near(page, x, y):
    """Mută mouse-ul peste cuvânt și verifică dacă apare cardul ERATA (gazda ERATA-UI prinde punctul)."""
    await page.mouse.move(x - 80, y + 60); await page.mouse.move(x - 2, y); await page.wait_for_timeout(100); await page.mouse.move(x, y)
    await page.wait_for_timeout(1100)
    r = await page.evaluate(CARD_JS, [x, y + 8])
    await page.keyboard.press('Escape'); await page.mouse.move(850, 650); await page.wait_for_timeout(300)
    return r


# =====================================================================================================================
async def focus_names(cdp):
    return [(n['role'], n['name']) for n in await ax_nodes(cdp) if n['focused'] and n['role'] != 'RootWebArea']


async def sec_kbd(env):
    await set_settings(env.sw, ui='ro')
    page, errs = await open_page(env, 'kbd')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    kb = page.keyboard
    L = UI['ro']
    await kb.press('Tab')
    check('kbd: Tab ajunge în primul câmp', await page.evaluate('document.activeElement.id') == 'a')
    await kb.type('la scoala si mama', delay=8)
    await page.wait_for_timeout(1500)
    badge = [n for n in await ax_nodes(cdp) if n['role'] == 'button' and n['name'].startswith(L['open_menu'])]
    check('kbd: insigna are nume localizat (open_menu)', len(badge) == 1, [n['name'] for n in await ax_nodes(cdp) if n['role'] == 'button'])
    check('kbd: insigna nu e în ordinea Tab (tabindex=-1)', all(not n['focused'] for n in badge))

    # --- deschidere cu Alt+Shift+Space (cursorul la sfârșit → prima problemă, cu înfășurare)
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(700)
    nodes = await ax_nodes(cdp)
    dlg = [n for n in nodes if n['role'] == 'dialog']
    check('kbd: Alt+Shift+Space deschide cardul (un singur dialog)', len(dlg) == 1, dlg)
    check('kbd: dialogul are nume localizat (categoria)', bool(dlg) and dlg[0]['name'].casefold() == L['cat_spelling'].casefold(), dlg)
    grp = [n for n in nodes if n['role'] == 'group' and n['name'] == L['suggestions']]
    check('kbd: grupul de sugestii e etichetat (suggestions)', len(grp) == 1, [(n['role'], n['name']) for n in nodes if n['role'] in ('group', 'dialog')])
    foc = [n for n in nodes if n['focused'] and n['role'] != 'RootWebArea']
    check('kbd: focusul intră pe prima sugestie', bool(foc) and foc[0]['role'] == 'button' and foc[0]['name'] == 'școala', foc)
    check('kbd: activeElement din pagină = gazda ERATA (focus în card)', await page.evaluate('document.activeElement.tagName') == 'ERATA-UI')
    check('kbd: toate butoanele au nume', all(n['name'].strip() for n in nodes if n['role'] == 'button'), [n for n in nodes if n['role'] == 'button' and not n['name'].strip()])

    # --- capcană de focus: Tab ciclează în card și nu iese în pagină
    seq = []
    for _ in range(12):
        await kb.press('Tab'); await page.wait_for_timeout(40)
        f = await focus_names(cdp)
        seq.append(f[0] if f else None)
    expected = {'školu'} | {L['add_word'], L['ignore'], L['close']}
    names = {s[1] for s in seq if s}
    check('kbd: Tab rămâne în card (nu iese în pagină)', None not in seq and L['close'] in names and 'dupa' not in names and await page.evaluate('document.activeElement.tagName') == 'ERATA-UI', seq)
    period = next((i for i in range(1, 12) if seq[i] == seq[0]), None)
    check('kbd: ordinea Tab e ciclică (capcană)', period is not None and all(seq[i] == seq[i % period] for i in range(12)), seq)
    first = (await focus_names(cdp))[0]
    await kb.press('Shift+Tab'); await page.wait_for_timeout(60)
    before = (await focus_names(cdp))[0]
    check('kbd: Shift+Tab merge înapoi (ciclic)', before != first or period == 1, (first, before))
    # Shift+Tab de pe primul element → ultimul (Închide)
    for _ in range(12):
        f = (await focus_names(cdp))[0]
        if f[1] == 'școala':
            break
        await kb.press('Shift+Tab'); await page.wait_for_timeout(40)
    await kb.press('Shift+Tab'); await page.wait_for_timeout(60)
    check('kbd: Shift+Tab de pe prima sugestie → butonul Închide', (await focus_names(cdp))[0][1] == L['close'], await focus_names(cdp))

    # --- Esc: închide și restaurează focusul + cursorul
    await kb.press('Escape'); await page.wait_for_timeout(300)
    check('kbd: Esc închide cardul', not [n for n in await ax_nodes(cdp) if n['role'] == 'dialog'])
    st = await page.evaluate("[document.activeElement.id, a.selectionStart, a.selectionEnd]")
    check('kbd: Esc restaurează focusul în câmp, cu cursorul neschimbat', st == ['a', 17, 17], st)

    # --- Enter pe prima sugestie: aplică, focus în câmp, cursorul rămâne la sfârșit (se poate continua tastarea)
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(700)
    await kb.press('Enter'); await page.wait_for_timeout(500)
    v = await page.input_value('#a')
    st = await page.evaluate("[document.activeElement.id, a.selectionStart]")
    check('kbd: Enter aplică sugestia', v.startswith('la școala'), v)
    check('kbd: după aplicare focusul revine în câmp, cursorul nu sare (rămâne la sfârșit)', st == ['a', len(v)], st)
    await kb.type('X'); check('kbd: tastarea continuă la sfârșit', (await page.input_value('#a')).endswith('mamaX'), await page.input_value('#a'))
    # --- Esc din card nu închide dialogul paginii (vezi și secțiunea geom/dialog)

    # --- panou: Alt+Shift+M
    await kb.press('Alt+Shift+M'); await page.wait_for_timeout(600)
    nodes = await ax_nodes(cdp)
    dlg = [n for n in nodes if n['role'] == 'dialog']
    check('kbd: Alt+Shift+M deschide panoul (dialog „ERATA”)', len(dlg) == 1 and dlg[0]['name'] == 'ERATA', dlg)
    btns = {n['name'] for n in nodes if n['role'] == 'button'}
    check('kbd: butoanele panoului sunt localizate', {L['fix_all'], L['site_disable'], L['open_options'], L['close']} <= btns, sorted(btns))
    check('kbd: panoul are selector de limbă etichetat', any(n['role'] in ('combobox', 'listbox', 'menulistbutton', 'button') and L['language'] in n['name'] for n in nodes) or any(L['language'] in n['name'] for n in nodes), [(n['role'], n['name']) for n in nodes][-12:])
    check('kbd: focusul intră în panou', bool(await focus_names(cdp)) and await page.evaluate('document.activeElement.tagName') == 'ERATA-UI')
    await kb.press('Escape'); await page.wait_for_timeout(300)
    check('kbd: Esc închide panoul și restaurează focusul', await page.evaluate('document.activeElement.id') == 'a' and not [n for n in await ax_nodes(cdp) if n['role'] == 'dialog'])

    # --- Tab normal din câmp ajunge la elementul următor din pagină (cardul închis nu captează Tab)
    await kb.press('Tab'); await page.wait_for_timeout(100)
    check('kbd: după închidere, Tab merge la următorul element din pagină', await page.evaluate('document.activeElement.id') == 'b')

    # --- fără probleme: scurtătura deschide panoul cu mesajul „nicio problemă”
    await page.focus('#b'); await kb.type('mama', delay=8); await page.wait_for_timeout(1400)
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(600)
    nodes = await ax_nodes(cdp)
    check('kbd: fără probleme → panou cu „Nicio problemă găsită”', any(L['none'] in n['name'] for n in nodes) and [n for n in nodes if n['role'] == 'dialog'], [n['name'] for n in nodes if n['role'] in ('dialog', 'StaticText')])
    await kb.press('Escape'); await page.wait_for_timeout(200)

    # --- ruta comenzii browserului (background → content): același efect ca scurtătura
    await page.focus('#a'); await kb.press('End'); await page.wait_for_timeout(300)
    await page.bring_to_front()
    await env.sw.evaluate("""async()=>{const [t]=await chrome.tabs.query({active:true,currentWindow:true});await chrome.tabs.sendMessage(t.id,{t:'command',cmd:'open-suggestions'})}""")
    await page.wait_for_timeout(700)
    check('kbd: comanda din fundal (open-suggestions) deschide cardul', len([n for n in await ax_nodes(cdp) if n['role'] == 'dialog']) == 1)
    await kb.press('Escape'); await page.wait_for_timeout(200)
    # a doua apăsare a scurtăturii (card deschis) trece la problema următoare
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(600)
    n1 = [n['name'] for n in await ax_nodes(cdp) if n['role'] == 'dialog']
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(600)
    n2 = [n['name'] for n in await ax_nodes(cdp) if n['role'] == 'dialog']
    check('kbd: a doua apăsare păstrează un singur dialog (ciclează problemele)', len(n1) == 1 and len(n2) == 1, (n1, n2))
    await kb.press('Escape'); await page.wait_for_timeout(200)

    # --- CE: aceeași navigare; cursorul și structura DOM neatinse
    await page.focus('#c'); await kb.type('la scoala si mama', delay=8); await page.wait_for_timeout(1500)
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(700)
    check('kbd: contenteditable — scurtătura deschide cardul', len([n for n in await ax_nodes(cdp) if n['role'] == 'dialog']) == 1)
    await kb.press('Enter'); await page.wait_for_timeout(500)
    txt = await page.inner_text('#c')
    check('kbd: contenteditable — Enter aplică, focus înapoi în câmp', 'școala' in txt and await page.evaluate('document.activeElement.id') == 'c', txt)
    await kb.type('Y'); check('kbd: contenteditable — tastarea continuă la sfârșit', (await page.inner_text('#c')).strip().endswith('mamaY'), await page.inner_text('#c'))
    check('kbd: fără erori JS', not errs, errs)
    await page.close()

    # --- etichete localizate în TOATE cele 8 limbi (card + panou + insignă)
    for lang in LANGS8:
        Lg = UI[lang]
        await set_settings(env.sw, ui=lang)
        page, errs = await open_page(env, 'kbd', wait=400)
        await page.bring_to_front()
        cdp = await env.ctx.new_cdp_session(page)
        await cdp.send('Accessibility.enable')
        await page.focus('#a'); await page.keyboard.type('la scoala', delay=6); await page.wait_for_timeout(1500)
        await page.keyboard.press('Alt+Shift+Space'); await page.wait_for_timeout(700)
        nodes = await ax_nodes(cdp)
        d = [n for n in nodes if n['role'] == 'dialog']
        g = [n for n in nodes if n['role'] == 'group']
        b = {n['name'] for n in nodes if n['role'] == 'button'}
        bad = (len(d) != 1 or d[0]['name'].casefold() != Lg['cat_spelling'].casefold() or not any(x['name'] == Lg['suggestions'] for x in g)
               or not {Lg['close'], Lg['add_word'], Lg['ignore']} <= b or not any(x.startswith(Lg['open_menu']) for x in b))
        check(f'kbd: etichete ARIA localizate în {lang}', not bad, (d, [x['name'] for x in g], sorted(b)))
        await page.keyboard.press('Escape'); await page.keyboard.press('Alt+Shift+M'); await page.wait_for_timeout(500)
        nodes = await ax_nodes(cdp)
        b = {n['name'] for n in nodes if n['role'] == 'button'}
        check(f'kbd: panou localizat în {lang}', {Lg['fix_all'], Lg['site_disable'], Lg['open_options'], Lg['close']} <= b, sorted(b))
        await page.close()
    await set_settings(env.sw, ui='ro')


# =====================================================================================================================
async def sec_ime(env):
    await set_settings(env.sw, ui='ro', badge=False)
    await env.sw.evaluate("()=>{self.__log=[];if(!self.__hooked){self.__hooked=1;chrome.runtime.onMessage.addListener((m)=>{if(m&&m.t==='check')self.__log.push(m.text);return false})}}")
    page, errs = await open_page(env, 'ime')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    kb = page.keyboard
    log = lambda: env.sw.evaluate('self.__log')
    cmd = lambda c: env.sw.evaluate("async(c)=>{const [t]=await chrome.tabs.query({active:true,currentWindow:true});await chrome.tabs.sendMessage(t.id,{t:'command',cmd:c})}", c)

    # ---- textarea: compoziție CJK
    await page.focus('#t'); await kb.type('la scoala ', delay=6); await page.wait_for_timeout(1600)
    n0 = len(await log())
    await cdp.send('Input.imeSetComposition', {'text': 'ni', 'selectionStart': 2, 'selectionEnd': 2})
    await page.wait_for_timeout(1600)
    new = (await log())[n0:]
    check('ime: textarea — în timpul compoziției NU se trimite text parțial la verificare', not any('scoala ni' in t for t in new), new)
    check('ime: textarea — valoarea conține compoziția (browserul o gestionează)', 'ni' in await page.input_value('#t'))
    await kb.press('Alt+Shift+Space'); await page.wait_for_timeout(400)
    check('ime: textarea — cardul nu se deschide în timpul compoziției', not [n for n in await ax_nodes(cdp) if n['role'] == 'dialog'])
    await cmd('fix-all'); await page.wait_for_timeout(1000)
    check('ime: textarea — fix-all e ignorat în timpul compoziției (compoziția nu e stricată)', 'scoala' in await page.input_value('#t') and 'ni' in await page.input_value('#t'), await page.input_value('#t'))
    await cdp.send('Input.insertText', {'text': '你'}); await page.wait_for_timeout(1500)
    v = await page.input_value('#t')
    check('ime: textarea — după commit textul e corect', v == 'la scoala 你', v)
    check('ime: textarea — după commit se verifică textul final', any('你' in t for t in (await log())[n0:]), (await log())[n0:])
    # sublinierea rămâne pe „scoala” după inserarea CJK
    truth = await page.evaluate(TWIN_JS, ['#t', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page))), (truth[0] - 20, truth[1] - 5, truth[2] + 20, truth[3] + 15))
    check('ime: textarea — sublinierea rămâne pe „scoala”', underline_matches(box, truth), (box, truth))
    await cmd('fix-all'); await page.wait_for_timeout(900)
    v = await page.input_value('#t')
    check('ime: textarea — fix-all după commit funcționează', v == 'la școala 你', v)
    # tastă moartă / accent: compoziție „´” apoi „é”
    await page.focus('#t'); await kb.press('End')
    await cdp.send('Input.imeSetComposition', {'text': '´', 'selectionStart': 1, 'selectionEnd': 1}); await page.wait_for_timeout(300)
    await cdp.send('Input.insertText', {'text': 'é'}); await page.wait_for_timeout(1000)
    v = await page.input_value('#t')
    check('ime: tastă moartă (´ → é) fără corupere', v == 'la școala 你é', v)

    # ---- selecție activă în timpul reconcilierii/aplicării (textarea): intervalul „mat” rămâne selectat
    await set_settings(env.sw, ui='ro', badge=False, lang='en')
    await page.evaluate("t.value='i have a apple and the the cat , sat on the mat.Then left.';t.dispatchEvent(new Event('input',{bubbles:true}))")
    await page.focus('#t'); await page.wait_for_timeout(1700)
    await page.evaluate("t.setSelectionRange(t.value.indexOf('mat.'),t.value.indexOf('mat.')+3)")
    await cmd('fix-all'); await page.wait_for_timeout(1500)
    sel = await page.evaluate("[t.value, t.value.slice(t.selectionStart,t.selectionEnd)]")
    check('selecție: textarea — fix-all păstrează selecția (mapată peste înlocuiri)', sel[1] == 'mat' and sel[0].startswith('I have an apple'), sel)

    # ---- contenteditable: IME + undo nativ + selecție
    await set_settings(env.sw, ui='ro', badge=False, lang='ro')
    await page.focus('#c'); await kb.type('la scoala ', delay=6); await page.wait_for_timeout(1600)
    html0 = await page.inner_html('#c')
    await cdp.send('Input.imeSetComposition', {'text': 'あ', 'selectionStart': 1, 'selectionEnd': 1}); await page.wait_for_timeout(700)
    await cdp.send('Input.insertText', {'text': 'は'}); await page.wait_for_timeout(1500)
    html1 = await page.inner_html('#c')
    check('ime: contenteditable — text corect după commit, fără noduri străine', 'は' in html1 and 'erata' not in html1.lower(), html1)
    await cmd('fix-all'); await page.wait_for_timeout(1000)
    txt = await page.inner_text('#c')
    check('undo: contenteditable — fix-all a aplicat „școala”', 'școala' in txt, txt)
    await page.focus('#c'); await kb.press('Control+z'); await page.wait_for_timeout(500)
    txt2 = await page.inner_text('#c')
    check('undo: contenteditable — Ctrl+Z restaurează „scoala” (istoric nativ intact)', 'scoala' in txt2 and 'școala' not in txt2, txt2)
    await kb.press('Control+z'); await page.wait_for_timeout(300)
    txt3 = await page.inner_text('#c')
    check('undo: contenteditable — încă un Ctrl+Z anulează tastarea (stiva nu a fost ștearsă)', txt3 != txt2, (txt2, txt3))
    await set_settings(env.sw, ui='ro', badge=False, lang='en')
    await page.evaluate("c.textContent='i have a apple and the the cat , sat on the mat.Then left.';c.dispatchEvent(new Event('input',{bubbles:true}))")
    await page.focus('#c'); await page.wait_for_timeout(1700)
    await page.evaluate("""()=>{const n=c.firstChild;const i=n.data.indexOf('mat.');const r=document.createRange();r.setStart(n,i);r.setEnd(n,i+3);const s=getSelection();s.removeAllRanges();s.addRange(r)}""")
    await cmd('fix-all'); await page.wait_for_timeout(1500)
    sel = await page.evaluate("[c.textContent, getSelection().toString()]")
    check('selecție: contenteditable — fix-all păstrează selecția „mat”', sel[1] == 'mat' and sel[0].startswith('I have an apple'), sel)
    # undo textarea după fix-all (mai multe editări): Ctrl+Z repetat readuce originalul și nu golește istoricul
    await page.evaluate("t.value='';t.dispatchEvent(new Event('input',{bubbles:true}))")
    await page.focus('#t'); await kb.type('i have a apple', delay=6); await page.wait_for_timeout(1600)
    await cmd('fix-all'); await page.wait_for_timeout(1000)
    after = await page.input_value('#t')
    for _ in range(6):
        await kb.press('Control+z'); await page.wait_for_timeout(120)
    final = await page.input_value('#t')
    check('undo: textarea — fix-all e anulabil nativ (Ctrl+Z)', 'an apple' in after.lower() and 'an apple' not in final.lower(), (after, final))
    check('ime: fără erori JS', not errs, errs)
    await page.close()


# =====================================================================================================================
async def twin_for(page, sel, word, ce=False, frame=None):
    tgt = frame or page
    return await tgt.evaluate(CE_WORD_JS if ce else TWIN_JS, [sel, word])


async def geom_case(env, name, text, *, ce=False, mode='axis', page_name=None, qs='', word='scoala', setup=None, hover=True, expect=True,
                    emulate=None, offset=(0, 0), frame_sel=None, scheme=None, viewport=None):
    pg = page_name or name
    page, errs = await open_page(env, pg, qs, viewport=viewport)
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    if emulate:
        await cdp.send('Emulation.setDeviceMetricsOverride', emulate)
    if scheme:
        await page.emulate_media(**scheme)
    tgt = page
    if frame_sel:
        tgt = page.frame_locator(frame_sel)
        fr = [f for f in page.frames if f != page.main_frame][0]
        tgt = fr
    setter = ("f=>{f.textContent=%s;f.dispatchEvent(new Event('input',{bubbles:true}))}" if ce else "f=>{f.value=%s;f.dispatchEvent(new Event('input',{bubbles:true}))}") % json.dumps(text)
    await tgt.evaluate("(a)=>{const f=document.getElementById('f');(%s)(f)}" % setter, None)
    if setup:
        await tgt.evaluate(setup)
    await tgt.evaluate("document.getElementById('f').focus()")
    await page.wait_for_timeout(1800)
    png = await screenshot(page)
    if expect is False:
        n = int(RED(pixels(png)).sum())
        check(f'geom: {name} — fără sublinieri greșite (nedesenabil corect → ascuns)', n < 12, n)
        await page.close()
        return
    truth = await twin_for(page, '#f', word, ce, frame=tgt if frame_sel else None)
    truth = [truth[0] + offset[0], truth[1] + offset[1], truth[2] + offset[0], truth[3] + offset[1]]
    box = bbox_of(RED(pixels(png)), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    total = int(RED(pixels(png)).sum())
    ok = False
    if mode == 'x':
        ok = bool(box) and box[4] >= 15 and box[0] >= truth[0] - 8 and box[2] <= truth[2] + 8 and (box[2] - box[0]) >= 0.5 * (truth[2] - truth[0])
    elif mode == 'vert':
        ok = bool(box) and box[4] >= 15 and (box[3] - box[1]) >= 0.5 * (truth[3] - truth[1]) and box[0] >= truth[2] - 14 and box[2] <= truth[2] + 8
    else:
        ok = underline_matches(box, truth, mode)
    if not (ok and total <= (box[4] if box else 0) + 30):
        save_shot(f'geom-{name}', png)
        try:
            print('   DIAG', json.dumps(await env.sw.evaluate("async()=>{const s=(await chrome.storage.local.get('settings')).settings||{};return {lang:s.lang,ui:s.ui,badge:s.badge,hideNative:s.hideNative,enabled:s.enabled}}")), 'text=', json.dumps(text))
        except Exception as e:
            print('   DIAG err', e)
    check(f'geom: {name} — sublinierea cade pe cuvânt', ok and total <= (box[4] if box else 0) + 30, (box, [round(v) for v in truth], total))
    if hover and ok:
        cx = (truth[0] + truth[2]) / 2
        cy = (truth[1] + truth[3]) / 2
        await page.mouse.move(cx - 60, cy + 60); await page.mouse.move(cx, cy); await page.wait_for_timeout(100); await page.mouse.move(cx + 1, cy)
        await page.wait_for_timeout(1000)
        if frame_sel:  # cardul e în documentul cadrului: îl detectăm prin elementFromPoint în coordonate locale
            lx, ly = cx - offset[0], cy - offset[1]
            opened = await tgt.evaluate(CARD_JS, [lx, ly + 8])
            d = [opened] if opened else []
        else:
            d = [n for n in await ax_nodes(cdp) if n['role'] == 'dialog']
        check(f'geom: {name} — hover pe cuvânt deschide cardul (zona de atingere corectă)', len(d) == 1, d)
    if qs and 'csp=' in qs:  # singura încălcare admisă: atributul style din markup-ul paginii de test (nu al extensiei)
        inline = [e for e in errs if e.startswith('console:Applying inline style violates')]
        errs = [e for e in errs if e not in inline]
        check(f'geom: {name} — extensia nu produce încălcări CSP (doar <body style> din pagină)', len(inline) <= 1, inline)
    check(f'geom: {name} — fără erori JS', not errs, errs)
    await page.close()


async def sec_geom(env):
    await set_settings(env.sw, ui='ro', badge=False)
    T = 'la scoala'
    await geom_case(env, 'textarea (control)', T, page_name='g_ta')
    await geom_case(env, 'scale(1.7)', T, page_name='g_ta_scale')
    await geom_case(env, 'scale(1.4,0.8) anizotrop', T, page_name='g_ta_scale_xy')
    await geom_case(env, 'rotate(15deg)', T, page_name='g_ta_rot15', mode='rot')
    await geom_case(env, 'rotate(90deg)', T, page_name='g_ta_rot90', mode='rot')
    await geom_case(env, 'rotate(-8deg) scale(1.3)', T, page_name='g_ta_rotscale', mode='rot')
    await geom_case(env, 'CSS zoom:2', T, page_name='g_ta_zoom')
    await geom_case(env, 'RTL (dir=rtl pe pagină)', T, page_name='g_ta_rtl')
    await geom_case(env, 'RTL cu bară de derulare', 'x\n' * 8 + 'la scoala', page_name='g_ta_rtl_scroll', setup="document.getElementById('f').scrollTop=9999")
    await geom_case(env, 'ebraică/idiș + latin (RTL)', 'שלום עולם scoala שלום', page_name='g_ta_he')
    await geom_case(env, 'text vertical (vertical-rl)', 'scoala mama', page_name='g_ta_vert', mode='vert')
    await geom_case(env, 'input (control)', T, page_name='g_in', mode='x')
    await geom_case(env, 'input text-align:center', T, page_name='g_in_center', mode='x')
    await geom_case(env, 'input text-align:right', T, page_name='g_in_right', mode='x')
    await geom_case(env, 'input RTL', T, page_name='g_in_rtl', mode='x')
    await geom_case(env, 'contenteditable (control)', T, page_name='g_ce', ce=True)
    await geom_case(env, 'contenteditable scale(1.7)', T, page_name='g_ce_scale', ce=True)
    await geom_case(env, 'contenteditable RTL', T, page_name='g_ce_rtl', ce=True)
    await geom_case(env, 'contenteditable text vertical', 'scoala mama', page_name='g_ce_vert', ce=True, mode='vert')
    await geom_case(env, 'contenteditable rotit 15° (nedesenabil → ascuns)', T, page_name='g_ce_rot15', ce=True, expect=False)
    # iframe
    await geom_case(env, 'iframe', T, page_name='g_iframe', frame_sel='#fr', offset=(100, 60))
    # html transformat (fixed devine relativ la html): calibrare
    await geom_case(env, '<html> cu transform:scale(1.25)', T, page_name='g_htmltransform')
    # CSP strict (img-src none, style-src none): fără URL-uri în stiluri
    await geom_case(env, 'CSP strict (default-src none, img-src none)', T, page_name='g_csp', qs='?csp=strict', hover=False)
    # zoom de browser 50 % … 300 % (emulat prin metrici de ecran: aceeași fereastră fizică, viewport CSS mai mic/mare)
    for z in (0.5, 1.5, 2, 3):
        em = {'width': int(900 / z), 'height': int(700 / z), 'deviceScaleFactor': z, 'mobile': False}
        await geom_case(env, f'zoom browser {int(z * 100)}%', T, page_name='g_ta', emulate=em, hover=(z in (2,)))

    # derulare în containere imbricate: sublinierea urmează câmpul și nu iese din containere
    page, errs = await open_page(env, 'g_ta_nest')
    await page.bring_to_front()
    await page.evaluate("f.value='la scoala';f.dispatchEvent(new Event('input',{bubbles:true}));f.focus()")
    await page.wait_for_timeout(1700)
    truth = await page.evaluate(TWIN_JS, ['#f', 'scoala'])
    # twin-ul din containere derulabile: folosim direct getBoundingClientRect al cuvântului prin Range peste un clon vizibil
    truth = await page.evaluate("""()=>{const f=document.getElementById('f');const r=f.getBoundingClientRect();return [r.left+8,r.top+8,r.left+8+7*12,r.top+8+28]}""")
    png = await screenshot(page)
    o2 = await page.evaluate("(()=>{const r=document.getElementById('o2').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
    box = bbox_of(RED(pixels(png)))
    check('geom: containere imbricate — sublinierea e în interiorul containerului vizibil', bool(box) and box[1] >= o2[1] - 2 and box[3] <= o2[3] + 2, (box, o2))
    # derulăm containerul exterior ca să ascundă linia: nicio sublinire în afara containerelor
    await page.evaluate("document.getElementById('o1').scrollTop=130;document.getElementById('o2').scrollTop=60")
    await page.wait_for_timeout(500)
    png = await screenshot(page)
    o1 = await page.evaluate("(()=>{const r=document.getElementById('o1').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
    o2 = await page.evaluate("(()=>{const r=document.getElementById('o2').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
    red = RED(pixels(png))
    out = red.copy()
    out[int(max(o1[1], o2[1])):int(min(o1[3], o2[3])), int(max(o1[0], o2[0])):int(min(o1[2], o2[2]))] = False
    check('geom: containere imbricate — după derulare nu rămân sublinieri în afara zonei vizibile', int(out.sum()) < 12, (int(out.sum()), bbox_of(out)))
    # derulare în containerul interior: sublinierea urmează cuvântul
    await page.evaluate("document.getElementById('o1').scrollTop=0;document.getElementById('o2').scrollTop=10")
    await page.wait_for_timeout(500)
    png = await screenshot(page)
    fr = await page.evaluate("(()=>{const r=document.getElementById('f').getBoundingClientRect();return [r.left,r.top]})()")
    o2 = await page.evaluate("(()=>{const r=document.getElementById('o2').getBoundingClientRect();return [r.left,r.top,r.right,r.bottom]})()")
    box = bbox_of(RED(pixels(png)))
    exp_y = fr[1] + 8 + 28
    check('geom: containere imbricate — după derulare sublinierea urmează cuvântul', bool(box) and abs(box[3] - exp_y) <= 8 and box[1] >= o2[1] - 2, (box, exp_y, o2))
    await page.close()

    # <dialog> modal (top layer): UI-ul trebuie să fie vizibil și utilizabil, iar Esc din card nu închide dialogul
    page, errs = await open_page(env, 'g_dialog')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    await page.evaluate("f.value='la scoala';f.dispatchEvent(new Event('input',{bubbles:true}));f.focus()")
    await page.wait_for_timeout(1800)
    truth = await page.evaluate(TWIN_JS, ['#f', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page))), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    check('geom: <dialog> modal — sublinierea e vizibilă (top layer)', underline_matches(box, truth), (box, truth))
    await page.keyboard.press('Alt+Shift+Space'); await page.wait_for_timeout(700)
    d = [n for n in await ax_nodes(cdp) if n['role'] == 'dialog']
    check('geom: <dialog> modal — cardul se deschide (în top layer, neinert)', any(n['name'].casefold() == UI['ro']['cat_spelling'].casefold() for n in d), d)
    foc = await focus_names(cdp)
    check('geom: <dialog> modal — focusul intră în card', bool(foc) and foc[0][0] == 'button', foc)
    await page.keyboard.press('Escape'); await page.wait_for_timeout(400)
    check('geom: <dialog> modal — Esc închide doar cardul, nu și dialogul paginii', await page.evaluate("d.open") is True and await page.evaluate('document.activeElement.id') == 'f')
    await page.keyboard.press('Escape'); await page.wait_for_timeout(300)
    check('geom: <dialog> modal — al doilea Esc închide dialogul paginii (comportament normal)', await page.evaluate("d.open") is False)
    check('geom: <dialog> — fără erori JS', not errs, errs)
    await page.close()


# =====================================================================================================================
async def sec_theme(env):
    await set_settings(env.sw, ui='ro', badge=True)
    page, errs = await open_page(env, 'kbd')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')

    async def card_styles():
        await page.focus('#a')
        await page.keyboard.press('Control+a'); await page.keyboard.press('Delete')
        await page.keyboard.type('la scoala si mama', delay=5); await page.wait_for_timeout(1500)
        await page.keyboard.press('Alt+Shift+Space'); await page.wait_for_timeout(600)
        s = await styled_nodes(cdp)
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        return s

    def pairs(nodes, label):
        res = []
        for n in nodes:
            if n['tag'] in ('button', 'div', 'span', 'b', 'h4', 'label') and n['text'].strip() and n['color'] and n['bg'] and n['display'] != 'none':
                res.append((n['cls'] or n['tag'], n['text'].strip()[:20], contrast(n['color'][:3], n['bg'][:3]), n['color'], n['bg']))
        return res

    for scheme, name in (({'color_scheme': 'light'}, 'luminos'), ({'color_scheme': 'dark'}, 'închis'), ({'color_scheme': 'light', 'forced_colors': 'active'}, 'forced-colors'), ({'color_scheme': 'dark', 'forced_colors': 'active'}, 'forced-colors închis')):
        await page.emulate_media(**scheme)
        nodes = await card_styles()
        pr = pairs(nodes, name)
        low = [p for p in pr if p[2] < 4.5]
        check(f'contrast WCAG AA (≥4.5:1) card/butoane — mod {name} ({len(pr)} perechi)', len(pr) >= 4 and not low, low)
    # panoul (etichete colorate pe categorii) în mod luminos/închis
    for scheme, name in (({'color_scheme': 'light', 'forced_colors': 'none'}, 'luminos'), ({'color_scheme': 'dark', 'forced_colors': 'none'}, 'închis')):
        await page.emulate_media(**scheme)
        await page.focus('#a'); await page.wait_for_timeout(300)
        await page.keyboard.press('Alt+Shift+M'); await page.wait_for_timeout(600)
        nodes = await styled_nodes(cdp)
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        pr = pairs(nodes, name)
        low = [p for p in pr if p[2] < 4.5]
        labs = [n for n in nodes if 'lab' in n['cls']]
        check(f'contrast panou (etichete de categorie, text mic) — mod {name}', len(labs) >= 1 and not low, (low, [(n['cls'], n['text'][:20]) for n in nodes if n['cls']][:14]))
    # insigna: text alb pe fundal colorat
    await page.emulate_media(color_scheme='light', forced_colors='none')
    nodes = await styled_nodes(cdp)
    badges = [n for n in nodes if n['id'] == 'badge']
    check('contrast insignă (alb pe culoare de stare) ≥ 4.5:1', bool(badges) and all(contrast(b['color'][:3], b['bg'][:3]) >= 4.5 for b in badges if b['bg']), [(b['cls'], b['color'], b['bg']) for b in badges])

    # forced-colors: sublinierile folosesc culori de sistem și stiluri distincte (nu doar culoare)
    await page.emulate_media(color_scheme='light', forced_colors='active')
    await page.focus('#a'); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete')
    await page.keyboard.type('la scoala si mama', delay=5); await page.wait_for_timeout(1600)
    nodes = await styled_nodes(cdp)
    us = [n for n in nodes if 'u ' in (n['cls'] + ' ') and n['cls'].startswith('u')]
    check('forced-colors: sublinierile se desenează (border-bottom vizibil, stil distinct)', len(us) >= 1 and all(u['st'].get('border-bottom-style') in ('double', 'solid', 'dashed', 'dotted') and u['st'].get('border-bottom-width') not in ('0px', None) for u in us), [(u['cls'], u['st'].get('border-bottom-style'), u['st'].get('border-bottom-width')) for u in us])
    await page.emulate_media(color_scheme='light', forced_colors='none')

    # prefers-reduced-motion: cardul NU animă; fără preferință animă (control pozitiv: testul detectează animațiile)
    await cdp.send('Animation.enable')
    started = []
    cdp.on('Animation.animationStarted', lambda e: started.append(e['animation'].get('name') or e['animation'].get('type')))
    for rm, label in (('reduce', 'reduce'), ('no-preference', 'no-preference')):
        started.clear()
        await page.emulate_media(reduced_motion=rm)
        await page.focus('#a'); await page.keyboard.press('Control+a'); await page.keyboard.press('Delete')
        await page.keyboard.type('la scoala', delay=5); await page.wait_for_timeout(1500)
        await page.keyboard.press('Alt+Shift+Space'); await page.wait_for_timeout(500)
        await page.keyboard.press('Escape'); await page.wait_for_timeout(200)
        if rm == 'reduce':
            check('reduced-motion: reduce → nicio animație la deschiderea cardului', not started, started)
        else:
            check('reduced-motion: fără preferință → animația discretă rulează (control pozitiv)', len(started) >= 1, started)
    await page.emulate_media(reduced_motion='no-preference')
    check('theme: fără erori JS', not errs, errs)
    await page.close()


# =====================================================================================================================
async def sec_sw(env):
    await set_settings(env.sw, ui='ro', badge=False)
    page0, _ = await open_page(env, 'blank')
    cdp0 = await env.ctx.new_cdp_session(page0)
    evs = []
    cdp0.on('ServiceWorker.workerVersionUpdated', lambda e: evs.append(e))
    await cdp0.send('ServiceWorker.enable')
    await asyncio.sleep(0.5)

    async def stop_sw():
        evs.clear()
        await cdp0.send('ServiceWorker.stopAllWorkers')
        for _ in range(40):
            await asyncio.sleep(0.25)
            vs = [v for e in evs for v in e['versions'] if env.eid in v['scriptURL']]
            if vs and vs[-1]['runningStatus'] == 'stopped':
                return True
        return False

    stopped = await stop_sw()
    check('sw: service worker-ul a fost oprit (CDP stopAllWorkers)', stopped, [(v['runningStatus']) for e in evs for v in e['versions']])
    # prima cerere către worker-ul adormit: pagina nouă + tastare imediată
    page, errs = await open_page(env, 'g_ta', wait=100)
    await page.bring_to_front()
    await page.evaluate("f.value='la scoala';f.dispatchEvent(new Event('input',{bubbles:true}));f.focus()")
    await page.wait_for_timeout(6000)
    truth = await page.evaluate(TWIN_JS, ['#f', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page))), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    check('sw: prima cerere către worker adormit → sublinierea apare', underline_matches(box, truth), (box, truth))
    # oprire în timpul lucrului: următoarea verificare se reface singură
    await stop_sw()
    await page.evaluate("f.value='la scoala mama';f.dispatchEvent(new Event('input',{bubbles:true}))")
    await page.wait_for_timeout(5000)
    truth = await page.evaluate(TWIN_JS, ['#f', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page))), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    check('sw: oprire în timpul lucrului → verificarea următoare reușește', underline_matches(box, truth), (box, truth))
    # setările nu se încarcă la boot (worker adormit chiar la injectare) → reîncercare, apoi atașare la focus
    await stop_sw()
    page2, errs2 = await open_page(env, 'g_ta', wait=100)
    await page2.bring_to_front()
    await page2.evaluate("f.value='la scoala';f.focus()")
    await page2.wait_for_timeout(6000)
    truth = await page2.evaluate(TWIN_JS, ['#f', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page2))), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    check('sw: worker adormit la încărcarea paginii → câmpul focalizat e totuși verificat', underline_matches(box, truth), (box, truth))
    await refresh_sw(env)
    check('sw: fără erori JS (worker adormit)', not errs and not errs2, (errs, errs2))
    await page2.close()
    await page.close()
    await page0.close()

    # reîncărcarea extensiei: scriptul orfan se oprește, anunță, apoi se scoate singur; nicio eroare
    await set_settings(env.sw, ui='ro', badge=True)
    page, errs = await open_page(env, 'kbd')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    await page.focus('#a'); await page.keyboard.type('la scoala', delay=6); await page.wait_for_timeout(1500)
    host_before = await page.evaluate("document.querySelectorAll('erata-ui').length")
    await env.sw.evaluate("()=>chrome.runtime.reload()")
    await asyncio.sleep(2.5)
    await page.focus('#a'); await page.keyboard.type(' mama', delay=6); await page.wait_for_timeout(2500)
    nodes = await ax_nodes(cdp)
    lost = [n for n in nodes if n['role'] == 'button' and UI['ro']['connection_lost'] in n['name']]
    check('sw: după reîncărcarea extensiei scriptul orfan anunță „conexiune pierdută”', len(lost) >= 1, [n['name'] for n in nodes if n['role'] == 'button'])
    await page.wait_for_timeout(6500)
    hosts = await page.evaluate("document.querySelectorAll('erata-ui').length")
    check('sw: scriptul orfan se scoate din pagină (fără rămășițe)', host_before == 1 and hosts == 0, (host_before, hosts))
    errs_before = len(errs)
    await page.keyboard.type(' mai mult text', delay=5); await page.wait_for_timeout(800)
    check('sw: scriptul orfan nu mai reacționează și nu produce erori', len(errs) == errs_before and not errs, errs)
    await page.close()


# =====================================================================================================================
async def sec_leak(env):
    await set_settings(env.sw, ui='ro', badge=True)
    page, errs = await open_page(env, 'leak')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Memory.getDOMCounters')
    await cdp.send('HeapProfiler.enable')
    cycle = """async (n)=>{
      const box=document.getElementById('box');
      for(let i=0;i<n;i++){
        const k=i%5; let el;
        if(k===0){el=document.createElement('textarea');el.style.cssText='width:300px;height:60px'}
        else if(k===1){el=document.createElement('input');el.style.cssText='width:300px'}
        else if(k===2){el=document.createElement('div');el.contentEditable='true';el.style.cssText='width:300px;height:60px;border:1px solid #888'}
        else if(k===3){const h=document.createElement('div');const sr=h.attachShadow({mode:'open'});el=document.createElement('textarea');el.style.cssText='width:300px;height:60px';sr.append(el);box.append(h);el.value='la scoala si mama';el.focus();el.dispatchEvent(new Event('input',{bubbles:true}));await new Promise(r=>setTimeout(r,12));h.remove();continue}
        else {el=document.createElement('textarea');el.style.cssText='width:300px;height:60px;direction:rtl'}
        box.append(el);
        if(el.isContentEditable) el.textContent='la scoala si mama'; else el.value='la scoala si mama';
        el.focus(); el.dispatchEvent(new Event('input',{bubbles:true}));
        await new Promise(r=>setTimeout(r,12));
        el.remove();
      }
    }"""
    ids = await ext_contexts(cdp)
    check('scurgeri: contextul izolat al extensiei e vizibil prin CDP', len(ids) == 1, ids)
    await page.evaluate(cycle, 40)  # încălzire
    await page.wait_for_timeout(6500)
    # controale pozitive: detectorul „noduri detașate reținute” și numărătoarea ascultătorilor chiar văd ce trebuie
    await page.evaluate("()=>{window.__keep=[];for(let i=0;i<5;i++){const t=document.createElement('textarea');document.getElementById('box').append(t);window.__keep.push(t);t.remove()}}")
    cK = await heap_census(cdp)
    check('scurgeri: control — recensământul de heap detectează noduri detașate reținute (≥5)', cK.get('detached', 0) >= 5, cK)
    await page.evaluate("window.__keep=null")
    base_doc = await ext_listeners(cdp, ids[0], 'document')
    base_win = await ext_listeners(cdp, ids[0], 'window')
    check('scurgeri: control — ascultătorii extensiei pe document/window sunt vizibili', bool(base_doc) and bool(base_win), (base_doc, base_win))
    await page.wait_for_timeout(300)
    await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage')
    c0 = await cdp.send('Memory.getDOMCounters')
    h0 = (await cdp.send('Runtime.getHeapUsage'))['usedSize']
    s0 = await shadow_stats(cdp)
    k0 = await heap_census(cdp)
    t0 = time.time()
    await page.evaluate(cycle, 500)
    print(f'  500 cicluri: {time.time() - t0:.1f}s')
    await page.wait_for_timeout(6500)  # intervalul de curățare (5 s) scoate stările câmpurilor dispărute
    await cdp.send('HeapProfiler.collectGarbage'); await cdp.send('HeapProfiler.collectGarbage')
    c1 = await cdp.send('Memory.getDOMCounters')
    h1 = (await cdp.send('Runtime.getHeapUsage'))['usedSize']
    s1 = await shadow_stats(cdp)
    k1 = await heap_census(cdp)
    d1 = await ext_listeners(cdp, ids[0], 'document')
    w1 = await ext_listeners(cdp, ids[0], 'window')
    print(f'  noduri {c0["nodes"]}→{c1["nodes"]}  heap {h0 // 1024}→{h1 // 1024} KB  shadow {s0}→{s1}  recensământ {k0}→{k1}')
    check('scurgeri: o singură gazdă <erata-ui>', s1[0] == 1, s1)
    check('scurgeri: nodurile din shadow root nu cresc după 500 de montări/demontări', s1[1] <= s0[1] + 6 and s1[2] <= s0[2] + 2, (s0, s1))
    check('scurgeri: numărul de noduri din pagină stabil (±30)', c1['nodes'] - c0['nodes'] <= 30, (c0, c1))
    check('scurgeri: ascultătorii extensiei pe document și window identici (nu se acumulează)', d1 == base_doc and w1 == base_win, (base_doc, d1, base_win, w1))
    check('scurgeri: niciun nod DOM detașat reținut (≤3) după 500 de cicluri', k1.get('detached', 0) <= 3, k1)
    check('scurgeri: observatoarele (Mutation/Resize/Intersection) și AbortController nu cresc (+2)', all(k1.get(n, 0) <= k0.get(n, 0) + 2 for n in ('MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'AbortController')), (k0, k1))
    check('scurgeri: memoria heap stabilă (<+4 MB după 500 de cicluri)', h1 - h0 < 4 * 1024 * 1024, (h0, h1))
    check('scurgeri: fără erori JS', not errs, errs)
    await page.close()


# =====================================================================================================================
SENS = {
    'pw': '<input id=pw type=password>', 'em': '<input id=em type=email>', 'cc': '<input id=cc autocomplete="cc-number">',
    'off': '<textarea id=off data-erata="off"></textarea>', 'cur': '<input id=cur autocomplete="current-password" type=text>',
    'otp': '<input id=otp name="otp">', 'cvv': '<input id=cvv name="card_cvv">',
}


async def attach_all_dump(page):
    return await page.evaluate("[...document.querySelectorAll('input,textarea')].map(e=>[e.id,e.getAttribute('spellcheck')])")


async def sec_privacy(env):
    await set_settings(env.sw, ui='ro', badge=False)
    # --- manifest: permisiuni minime, CSP, fără gazde
    for tgt in ('chrome', 'firefox', 'safari'):
        m = json.load(open(os.path.join(ROOT, 'dist', tgt, 'manifest.json')))
        perms = set(m.get('permissions', []))
        check(f'privacy: manifest {tgt} — permisiuni minime (storage, activeTab)', perms == {'storage', 'activeTab'}, perms)
        opt = set(m.get('optional_host_permissions', []) + m.get('optional_permissions', []))
        check(f'privacy: manifest {tgt} — doar localhost opțional', opt <= {'http://127.0.0.1/*', 'http://localhost/*'}, opt)
        check(f'privacy: manifest {tgt} — fără host_permissions, web_accessible_resources, externally_connectable', not any(k in m for k in ('host_permissions', 'web_accessible_resources', 'externally_connectable', 'content_security_policy_unsafe')), list(m))
        csp = m.get('content_security_policy', {}).get('extension_pages', '')
        check(f'privacy: manifest {tgt} — CSP restrânge connect-src la self + localhost și interzice object/base/form',
              "connect-src 'self' http://127.0.0.1:* http://localhost:*" in csp and "object-src 'none'" in csp and "base-uri 'none'" in csp and "script-src 'self'" in csp and 'unsafe-eval' not in csp and not re.search(r"script-src[^;]*unsafe-inline", csp), csp)
        check(f'privacy: manifest {tgt} — comenzile sunt localizate (__MSG_)', all(c['description'].startswith('__MSG_') for c in m['commands'].values()), m['commands'])
        check(f'privacy: manifest {tgt} — doar content script <all_urls> documentat', [c['matches'] for c in m['content_scripts']] == [['<all_urls>']], m['content_scripts'])
    # --- câmpuri sensibile: fără ascultători, fără modificări de atribute, fără sublinieri/insignă
    page, errs = await open_page(env, 'blank')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await page.evaluate("""(h)=>{document.body.insertAdjacentHTML('beforeend',h);[...document.querySelectorAll('input,textarea')].forEach((e,i)=>{e.style.cssText='position:absolute;left:20px;top:'+(20+i*50)+'px;width:300px;height:30px;font:18px monospace'})}""", ''.join(SENS.values()))
    await env.sw.evaluate("()=>{self.__log=[];if(!self.__hooked){self.__hooked=1;chrome.runtime.onMessage.addListener((m)=>{if(m&&m.t==='check')self.__log.push(m.text);return false})}}")
    for i in SENS:
        await page.focus('#' + i); await page.keyboard.type('scoala CANARY-ERATA-77', delay=3); await page.wait_for_timeout(900)
    logged = [t for t in await env.sw.evaluate('self.__log') if 'CANARY' in t]
    check('privacy: câmpurile sensibile (parolă/email/cc/data-erata=off/…) nu trimit niciun text la verificare', not logged, logged)
    attrs = await attach_all_dump(page)
    check('privacy: câmpurile sensibile rămân neatinse (fără spellcheck modificat)', all(a[1] is None for a in attrs), attrs)
    ids = await ext_contexts(cdp)
    check('privacy: contextul izolat al extensiei e vizibil prin CDP (altfel verificările de ascultători ar fi goale)', len(ids) == 1, ids)
    doc_l = await ext_listeners(cdp, ids[0], 'document')
    win_l = await ext_listeners(cdp, ids[0], 'window')
    check('privacy: control — extensia are ascultători delegați pe document/window (vizibili prin lumea izolată)', bool(doc_l) and bool(win_l), (doc_l, win_l))
    for i in SENS:
        ls = await ext_listeners(cdp, ids[0], f"document.getElementById('{i}')")
        check(f'privacy: #{i} nu are ascultători proprii ai extensiei (designul e delegat: nimic atașat pe câmp)', ls == [], ls)
    check('privacy: ascultătorii delegați sunt doar cei documentați (focus/input/taste/mouse/compoziție/derulare)',
          set(doc_l) <= {'click', 'compositionend', 'compositionstart', 'focusin', 'focusout', 'input', 'keydown', 'keyup', 'mousemove', 'mouseup', 'mousedown', 'selectionchange', 'beforeinput', 'pointerdown', 'scroll', 'visibilitychange', 'fullscreenchange', 'toggle', 'keypress'} and set(win_l) <= {'resize', 'scroll', 'blur', 'focus', 'pagehide', 'pageshow'}, (doc_l, win_l))
    n = int(RED(pixels(await screenshot(page))).sum())
    check('privacy: câmpurile sensibile nu primesc sublinieri', n < 12, n)
    # un câmp obișnuit trimite text DOAR către fundalul extensiei (mesaj intern), nu în rețea (verificat în netlog la final)
    await page.evaluate("document.body.insertAdjacentHTML('beforeend','<textarea id=ok style=\"position:absolute;left:20px;top:420px;width:300px;height:60px\"></textarea>')")
    await page.focus('#ok'); await page.keyboard.type('scoala CANARY-ERATA-77 mama', delay=3); await page.wait_for_timeout(1500)
    check('privacy: câmpul obișnuit e verificat local (control pozitiv)', any('CANARY' in t for t in await env.sw.evaluate('self.__log')))
    # controale de rețea: cerere din pagină (apare în netlog cu inițiator pagină) și din worker (blocată de CSP înainte de rețea)
    await page.evaluate("fetch('https://control.invalid/page-control').catch(()=>0)")
    await page.evaluate("(u)=>fetch(u,{method:'POST',body:'CTL-CANARY-91 deliberate'}).catch(()=>0)", f'{env.base}/ctl')
    r = await env.sw.evaluate("()=>fetch('https://control.invalid/sw-control').then(()=>'OK').catch(e=>'ERR '+e.message)")
    check('privacy: CSP-ul extensiei blochează fetch către gazde externe din worker', r.startswith('ERR'), r)
    r = await env.sw.evaluate(f"()=>fetch('http://127.0.0.1:{env.port}/blank').then(r=>'OK '+r.status).catch(e=>'ERR '+e.message)")
    check('privacy: localhost rămâne permis (LLM local opțional)', r.startswith('OK'), r)
    # pagina de opțiuni/popup/studio: același CSP
    op = await env.ctx.new_page()
    await op.goto(f'chrome-extension://{env.eid}/options.html'); await op.wait_for_timeout(500)
    r = await op.evaluate("()=>fetch('https://control.invalid/opt-control').then(()=>'OK').catch(e=>'ERR '+e.message)")
    check('privacy: CSP-ul blochează fetch extern și din pagina de opțiuni', r.startswith('ERR'), r)
    await op.close()
    errs = [e for e in errs if 'ERR_TUNNEL_CONNECTION_FAILED' not in e and 'ERR_NAME_NOT_RESOLVED' not in e]  # controlul deliberat din pagină
    check('privacy: fără erori JS', not errs, errs)
    await page.close()


def post_netlog(paths, ctl_path):
    """După închiderea browserului: analiza completă a rețelei (netlog Chromium, toate procesele) pe TOATE sesiunile; controalele pozitive sunt în sesiunea secțiunii privacy."""
    allreq, ext_ext, page_other = 0, [], []
    for path in paths:
        if not os.path.exists(path):
            continue
        reqs, d, names = netlog_requests(path)
        allreq += len(reqs)
        for u, i in reqs:
            local = re.match(r'https?://(127\.0\.0\.1|localhost)[:/]', u)
            if i.startswith('chrome-extension://') and not local:
                ext_ext.append((u, i))
            # cererile proprii ale browserului (accounts.google.com, checkin… cu inițiator „not an origin”) nu sunt ale paginii sau ale extensiei
            if not local and 'control.invalid' not in u and i.startswith('http://127.0.0.1') and u.startswith('http'):
                page_other.append((u, i))
        if netlog_has_bytes(d, names, b'CANARY-ERATA-77') and path != ctl_path:
            page_other.append(('canar în ' + path, ''))
    reqs, d, names = netlog_requests(ctl_path)
    ext = [(u, i) for u, i in reqs if i.startswith('chrome-extension://')]
    page_ext = [(u, i) for u, i in reqs if not re.match(r'https?://(127\.0\.0\.1|localhost)[:/]', u) and u.startswith('http') and i.startswith('http://127.0.0.1')]
    controls_page = [u for u, i in page_ext if 'control.invalid/page-control' in u]
    controls_sw = [u for u, i in reqs if i.startswith('chrome-extension://') and ('control.invalid/sw-control' in u or 'control.invalid/opt-control' in u)]
    print(f'  netlog: {len(paths)} sesiuni, {allreq} cereri URL în total; sesiunea privacy: {len(reqs)} (din extensie: {len(ext)})')
    check('rețea: control — cererea deliberată din pagină apare în netlog (detectorul funcționează)', len(controls_page) >= 1, page_ext[:5])
    check('rețea: control — detectorul de octeți vede un canar trimis deliberat (POST local)', netlog_has_bytes(d, names, b'CTL-CANARY-91'), 'canarul de control lipsește din netlog (captura nu e completă)')
    check('rețea: 0 cereri externe inițiate de extensie în toate sesiunile (worker, opțiuni, popup, studio)', not ext_ext, ext_ext[:10])
    check('rețea: controlul din worker/opțiuni a fost blocat de CSP înainte de rețea', not controls_sw, controls_sw)
    check('rețea: nicio pagină (content script inclus) nu a contactat exteriorul în afară de controlul deliberat', not page_other, page_other[:10])
    check('rețea: textul-canar tastat nu apare nicăieri în traficul de rețea', not netlog_has_bytes(d, names, b'CANARY-ERATA-77'), 'canar găsit în netlog')
    print('  cereri locale ale extensiei:', sorted({u.split('//')[1].split('/', 1)[1] if '//' in u else u for u, i in ext}))


# =====================================================================================================================
NAMES_OK = ['user_bio', 'email_body', 'discard_reason', 'classname', 'compass_notes', 'cardholder_notes', 'pin_description', 'passage', 'subject', 'userComment', 'titleOfEmail', 'bypass_note', 'q']
NAMES_SKIP = [('username', ''), ('email', ''), ('user_email', ''), ('password', ''), ('newPassword', ''), ('card_number', ''), ('cvv', ''), ('otp', ''), ('iban', ''), ('ssn', ''), ('cnp', ''), ('captcha', '')]


# Prag de latență pe cadru; pe mașini lente/partajate (CI) se ridică prin ERATA_LAT_MS.
LAT_MS = float(os.environ.get('ERATA_LAT_MS', '400'))


SHOTS = os.environ.get('ERATA_SHOTS', '/tmp/erata-audit-shots')
_shots = [0]


def save_shot(name, png):
    # Capturi pentru eșecuri (cel mult 12), ca să poată fi cercetate când mediul diferă de cel de dezvoltare.
    if _shots[0] >= 12: return
    _shots[0] += 1
    os.makedirs(SHOTS, exist_ok=True)
    with open(os.path.join(SHOTS, re.sub(r'[^A-Za-z0-9_.-]+', '_', name)[:60] + '.png'), 'wb') as f:
        f.write(png)


async def sec_names(env):
    await set_settings(env.sw, ui='ro', badge=False)
    page, errs = await open_page(env, 'blank')
    await page.bring_to_front()
    html = ''
    items = [(n, True, f'name="{n}"') for n in NAMES_OK]
    items += [(n, False, f'name="{n}"') for n, _ in NAMES_SKIP]
    items += [('ac-username', False, 'autocomplete="username"'), ('ac-cc', False, 'autocomplete="cc-number"'), ('ac-otp', False, 'autocomplete="one-time-code"'), ('im-num', False, 'inputmode="numeric"'),
              ('ac-name', False, 'autocomplete="name"'), ('ac-off', True, 'autocomplete="off"'), ('ty-text', True, 'type="text"'), ('ty-search', True, 'type="search"'), ('ty-pw', False, 'type="password"'), ('ty-email', False, 'type="email"'),
              ('ty-tel', False, 'type="tel"'), ('ty-url', False, 'type="url"'), ('id-bio', True, 'id="user_bio"'), ('id-user', False, 'id="username"')]
    for i, (n, ok, attr) in enumerate(items):
        html += f'<input data-t="{n}" {attr} style="position:absolute;left:20px;top:{20 + (i % 12) * 48}px;width:{300}px;height:30px;font:18px monospace;margin-left:{(i // 12) * 340}px">'
    await page.evaluate("(h)=>document.body.insertAdjacentHTML('beforeend',h)", html)
    bad_ok, bad_skip = [], []
    for n, ok, attr in items:
        loc = f'[data-t="{n}"]'
        await page.evaluate("(s)=>{const e=document.querySelector(s);e.value='scoala';e.dispatchEvent(new Event('input',{bubbles:true}));e.focus()}", loc)
        await page.wait_for_timeout(750)
        red = RED(pixels(await screenshot(page)))
        got = int(red.sum()) >= 12
        if ok and not got:
            bad_ok.append(n)
        if not ok and got:
            if not bad_skip: save_shot(f'names-{n}', await screenshot(page))
            bad_skip.append(n)
        await page.evaluate("(s)=>{document.querySelector(s).blur()}", loc)
    check('nume: câmpuri legitime (user_bio, email_body, discard_reason, classname, …) SUNT verificate', not bad_ok, bad_ok)
    check('nume: câmpuri sensibile (type/autocomplete/inputmode/nume exact) NU sunt verificate', not bad_skip, bad_skip)
    # „arată parola”: type=password comutat în text nu trebuie să înceapă verificarea
    await page.evaluate("document.body.insertAdjacentHTML('beforeend','<input id=sp type=password style=\"position:absolute;left:20px;top:620px;width:300px;height:30px;font:18px monospace\">')")
    await page.focus('#sp'); await page.keyboard.type('scoala', delay=3); await page.wait_for_timeout(500)
    await page.evaluate("document.getElementById('sp').type='text'")
    await page.focus('#sp'); await page.keyboard.type(' mama', delay=3); await page.wait_for_timeout(1400)
    check('nume: „arată parola” (password→text) — câmpul rămâne exclus', int(RED(pixels(await screenshot(page))).sum()) < 12)
    check('nume: fără erori JS', not errs, errs)
    await page.close()


# =====================================================================================================================
EVIL_RULES = ['(a|a)*$', '((a+))+$', '(a?){30}b', '(a|aa)+$', '(.*)*x', '(a+)+$', '(x+x+)+y', '(\\w+\\s?)*$', 'a' * 250]
GOOD_RULES = ['\\bteh\\b', 'colour', '(foo|bar)baz', 'a{2,5}', '[A-Z]{3}\\d+']


def engine_verdicts(patterns):
    """Verdictul motorului (src/core/userrules.js: isSafePattern) — sursa de adevăr pentru fundal și pagina de opțiuni."""
    js = "import {isSafePattern} from '%s/src/core/userrules.js';const P=JSON.parse(process.argv[1]);console.log(JSON.stringify(P.map(isSafePattern)))" % ROOT
    return json.loads(subprocess.check_output(['node', '--input-type=module', '-e', js, json.dumps(patterns)], text=True))


async def sec_rules(env):
    await set_settings(env.sw, ui='ro', badge=False)
    allp = EVIL_RULES + GOOD_RULES
    verd = engine_verdicts(allp)
    check('rules: motorul respinge toate tiparele ostile și acceptă tiparele bune (sursa de adevăr)', verd == [False] * len(EVIL_RULES) + [True] * len(GOOD_RULES), list(zip(allp, verd)))
    old_weak = re.compile(r'\((?:[^()\\]|\\.)*[+*](?:[^()\\]|\\.)*\)[+*{]')
    evaded = [p for p in EVIL_RULES if len(p) < 200 and not old_weak.search(p)]
    check('rules: control — fostul filtru slab din fundal lăsa să treacă tipare ostile (testul chiar prinde regresia)', len(evaded) >= 3, evaded)
    op = await env.ctx.new_page()
    await op.goto(f'chrome-extension://{env.eid}/options.html'); await op.wait_for_timeout(500)
    rules = [{'pattern': p, 'replacement': 'x', 'message': 'm', 'flags': 'giuu'} for p in allp]
    await env.sw.evaluate("(r)=>chrome.storage.local.set({settings:{lang:'ro',ui:'ro',userRules:r}})", rules)
    await asyncio.sleep(0.7)
    r = await op.evaluate("chrome.runtime.sendMessage({t:'getSettings'})")
    kept = [u['pattern'] for u in r['settings']['userRules']]
    check('rules: fundalul păstrează exact tiparele pe care le acceptă motorul (aceeași validare, fără variantă slabă)', kept == GOOD_RULES, kept)
    check('rules: indicatorii normalizați fără dubluri (iu, nu iuuu/giuu)', all(re.fullmatch(r'[ims]*u', u['flags']) and len(set(u['flags'])) == len(u['flags']) for u in r['settings']['userRules']), [u['flags'] for u in r['settings']['userRules']])
    # chiar dacă o regulă ostilă ajunge direct în motor (ocolind fundalul), verificarea rămâne rapidă
    t0 = time.time()
    res = await op.evaluate("chrome.runtime.sendMessage({t:'check',text:'a'.repeat(5000)+'!',lang:'ro'})")
    dt = time.time() - t0
    check('rules: verificare cu reguli ostile salvate rămâne rapidă (<3 s) și răspunde', res and res.get('ok') is not False and dt < 3, (dt, str(res)[:80]))
    # pagina de opțiuni: un tipar nesigur primește mesaj localizat și NU e salvat în tăcere
    await env.sw.evaluate("()=>chrome.storage.local.set({settings:{lang:'ro',ui:'ro'}})")
    await op.reload(); await op.wait_for_timeout(700)
    ph = op.locator('input[placeholder="\\\\bteh\\\\b"]')
    check('rules: câmpul de tipar există în pagina de opțiuni', await ph.count() == 1)
    row = ph.locator('xpath=..')
    for p in ('((a+))+$', '(a|a)*$'):
        await ph.fill(p)
        await row.locator('button', has_text=UI['ro']['add']).click(); await op.wait_for_timeout(400)
        msg = await op.evaluate("[...document.querySelectorAll('[role=alert]')].map(e=>e.textContent).join('|')")
        n = await env.sw.evaluate("()=>chrome.storage.local.get('settings').then(r=>(r.settings&&r.settings.userRules||[]).length)")
        check(f'rules: opțiuni — {p} respins cu mesaj localizat (pattern_unsafe) și nesalvat', UI['ro']['pattern_unsafe'] in msg and n == 0, (msg, n))
    await ph.fill('\\bteh\\b')
    await row.locator('button', has_text=UI['ro']['add']).click(); await op.wait_for_timeout(600)
    n = await env.sw.evaluate("()=>chrome.storage.local.get('settings').then(r=>(r.settings&&r.settings.userRules||[]).map(x=>x.pattern))")
    check('rules: opțiuni — un tipar sigur (\\bteh\\b) se salvează', n == ['\\bteh\\b'], n)
    await op.close()


# =====================================================================================================================
async def sec_hostile(env):
    await set_settings(env.sw, ui='ro', badge=False)
    # --- 5000 de textarea
    page, errs = await open_page(env, 'many')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await page.evaluate("""()=>{const b=document.getElementById('box');const f=document.createDocumentFragment();for(let i=0;i<5000;i++){const t=document.createElement('textarea');t.id='t'+i;t.rows=1;t.style.cssText='display:block;width:300px;height:30px';f.append(t)}b.append(f);
      window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>__lt.push(e.duration))).observe({entryTypes:['longtask']})}""")
    t0 = time.time()
    await page.evaluate("document.getElementById('t2500').scrollIntoView();document.getElementById('t2500').focus()")
    await page.keyboard.type('la scoala si mama merg', delay=5)
    await page.wait_for_timeout(1800)
    box = bbox_of(RED(pixels(await screenshot(page))))
    check('ostil: 5000 de textarea — câmpul focalizat e verificat (sublinierea apare)', bool(box) and box[4] >= 15, box)
    for i in range(0, 60):  # Tab rapid prin câmpuri: fiecare focus atașează o stare; fără blocaje
        await page.keyboard.press('Tab')
    await page.wait_for_timeout(600)
    lt = await page.evaluate('window.__lt')
    check('ostil: 5000 de textarea — nicio sarcină lungă >300 ms pe firul principal', not lt or max(lt) < 300, lt)
    lat = await page.evaluate("()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})")
    check('ostil: 5000 de textarea — cadru <120 ms după 60 de Tab-uri', lat < 120, lat)
    check('ostil: 5000 de textarea — fără erori JS', not errs, errs)
    await page.close()

    # --- câmpuri de 1 MB (textarea + contenteditable)
    page, errs = await open_page(env, 'big')
    await page.bring_to_front()
    cdp = await env.ctx.new_cdp_session(page)
    await cdp.send('Accessibility.enable')
    await page.evaluate("""()=>{const w='Mama merge la scoala si mama copiii acasa. ';let s='';while(s.length<1000000)s+=w;f.value=s.slice(0,250000)+' scoala '+s.slice(250000);
      g.textContent=s.slice(0,250000)+' scoala '+s.slice(250000);h.textContent=g.textContent}""")
    await page.focus('#f')
    await page.keyboard.press('Control+End'); await page.wait_for_timeout(300)
    t0 = time.time()
    await page.keyboard.type('x', delay=0)
    lat = await page.evaluate("()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})")
    check('ostil: textarea 1 MB — pagina receptivă după tastare (<' + str(int(LAT_MS)) + ' ms/cadru)', lat < LAT_MS, lat)
    await page.wait_for_timeout(3500)
    lat = await page.evaluate("()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})")
    check('ostil: textarea 1 MB — pagina receptivă după verificare (<' + str(int(LAT_MS)) + ' ms/cadru)', lat < LAT_MS, lat)
    await page.evaluate("f.setSelectionRange(250000,250000);f.focus()")
    await page.keyboard.press('Alt+Shift+Space'); await page.wait_for_timeout(1500)
    dlg = [n for n in await ax_nodes(cdp) if n['role'] == 'dialog']
    check('ostil: textarea 1 MB — problema de la 250 000 se verifică (fereastra urmărește cursorul)', len(dlg) == 1, dlg)
    await page.keyboard.press('Escape')
    await page.focus('#g'); await page.keyboard.press('Control+End')
    t0 = time.time()
    await page.keyboard.type('y', delay=0)
    lat = await page.evaluate("()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})")
    check('ostil: contenteditable 1 MB — pagina receptivă după tastare (<' + str(int(LAT_MS)) + ' ms/cadru)', lat < LAT_MS, lat)
    await page.wait_for_timeout(4000)
    lat = await page.evaluate("()=>new Promise(r=>{const s=performance.now();requestAnimationFrame(()=>r(performance.now()-s))})")
    check('ostil: contenteditable 1 MB — pagina receptivă după verificare (<' + str(int(LAT_MS)) + ' ms/cadru)', lat < LAT_MS, lat)
    # derulare rapidă în CE uriaș: costul de aranjare îl plătește pagina însăși; extensia nu trebuie să-l mărească sensibil.
    # Referință: același text într-un CE exclus de extensie (data-erata="off") în aceeași pagină.
    scroll = """async(id)=>{const e=document.getElementById(id);const t=[];for(let i=0;i<20;i++){e.scrollTop=i*300;await new Promise(r=>requestAnimationFrame(r));t.push(performance.now())}let m=0;for(let i=1;i<t.length;i++)m=Math.max(m,t[i]-t[i-1]);return m}"""
    base = await page.evaluate(scroll, 'h')
    await page.focus('#g'); await page.wait_for_timeout(1500)
    ours = await page.evaluate(scroll, 'g')
    print(f'  derulare CE 1 MB: referință (fără extensie) {base:.0f} ms, cu extensia {ours:.0f} ms (cadru maxim)')
    check('ostil: contenteditable 1 MB — derulare: extensia nu adaugă >2× + 150 ms față de pagina goală', ours <= 2 * base + 150, (base, ours))
    check('ostil: 1 MB — fără erori JS', not errs, errs)
    await page.close()

    # --- SPA care înlocuiește rapid nodurile
    page, errs = await open_page(env, 'spa')
    await page.bring_to_front()
    await page.evaluate("""async()=>{const b=document.getElementById('box');let el;for(let i=0;i<1500;i++){const n=document.createElement(i%3?'textarea':'div');if(n.tagName==='DIV')n.contentEditable='true';n.style.cssText='display:block;width:300px;height:60px';
      if(el)el.replaceWith(n);else b.append(n);el=n;n.focus();if(n.tagName==='DIV')n.textContent='la scoala si mama';else n.value='la scoala si mama';n.dispatchEvent(new Event('input',{bubbles:true}));if(i%7===0)await new Promise(r=>setTimeout(r,0))}
      window.__last=el}""")
    await page.wait_for_timeout(2500)
    box = bbox_of(RED(pixels(await screenshot(page))))
    check('ostil: SPA cu 1500 de înlocuiri rapide — ultimul câmp e verificat corect', bool(box) and box[4] >= 15, box)
    check('ostil: SPA — fără erori JS', not errs, errs)
    await page.close()

    # --- all:unset + erata-ui{display:none!important}, z-index extrem inserat DUPĂ noi
    await geom_case(env, 'CSS all:unset!important + erata-ui{display:none!important}', 'la scoala', page_name='g_allunset', hover=False)
    page, errs = await open_page(env, 'g_zmax')
    await page.bring_to_front()
    await page.evaluate("f.value='la scoala';f.dispatchEvent(new Event('input',{bubbles:true}));f.focus()")
    await page.wait_for_timeout(2000)
    # peste noi: un strat opac cu z-index 2147483647 inserat după montare; reapendarea ne readuce deasupra
    await page.evaluate("document.documentElement.append(document.getElementById('ov'))"); await page.wait_for_timeout(1500)
    await page.evaluate("f.value='la scoala ';f.dispatchEvent(new Event('input',{bubbles:true}))"); await page.wait_for_timeout(1800)
    truth = await page.evaluate(TWIN_JS, ['#f', 'scoala'])
    box = bbox_of(RED(pixels(await screenshot(page))), (truth[0] - 30, truth[1] - 30, truth[2] + 30, truth[3] + 30))
    check('ostil: strat de pagină cu z-index maxim inserat după noi — UI-ul rămâne deasupra', underline_matches(box, truth), (box, truth))
    await page.close()


# =====================================================================================================================
SECTIONS = {'legacy': sec_legacy, 'kbd': sec_kbd, 'ime': sec_ime, 'geom': sec_geom, 'theme': sec_theme, 'sw': sec_sw, 'leak': sec_leak, 'privacy': sec_privacy, 'names': sec_names, 'rules': sec_rules, 'hostile': sec_hostile}


async def launch(env, tag):
    """Pornește Chromium cu extensia (profil proaspăt, netlog complet, DNS blocat în afară de localhost)."""
    prof = f'{PROFILE}-{tag}'
    shutil.rmtree(prof, ignore_errors=True)
    env.netlog = f'{NETLOG}.{tag}.json'
    env.netlogs = getattr(env, 'netlogs', []) + [env.netlog]
    if os.path.exists(env.netlog):
        os.remove(env.netlog)
    # Testele numără pixeli roșii. Două surse străine de roșu trebuie oprite: netezirea subpixel (LCD) a textului,
    # care lasă franjuri colorate pe marginea literelor (--disable-lcd-text), și verificatorul nativ al browserului.
    os.makedirs(os.path.join(prof, 'Default'), exist_ok=True)
    with open(os.path.join(prof, 'Default', 'Preferences'), 'w') as f:
        json.dump({'browser': {'enable_spellcheck': False}, 'spellcheck': {'dictionaries': [], 'use_spelling_service': False}}, f)
    env.ctx = await env.p.chromium.launch_persistent_context(
        prof, headless=False, locale='ro-RO',
        args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox', '--disable-lcd-text',
              f'--log-net-log={env.netlog}', '--net-log-capture-mode=Everything',
              '--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'],
        viewport={'width': 900, 'height': 700})
    sw = env.ctx.service_workers[0] if env.ctx.service_workers else await env.ctx.wait_for_event('serviceworker')
    env.sw, env.eid = sw, re.search(r'//([a-z]+)/', sw.url).group(1)
    await asyncio.sleep(1.5)


# secțiunile care reîncarcă extensia (chrome.runtime.reload dezactivează extensia încărcată din linia de comandă) sau
# trebuie să închidă browserul ca să finalizeze netlog-ul: după ele se repornește Chromium
RELAUNCH = {'legacy', 'sw', 'privacy'}


async def main(selected):
    srv, port = start_server()
    async with async_playwright() as p:
        env = Env()
        env.p, env.port, env.base = p, port, f'http://127.0.0.1:{port}'
        await launch(env, 'a')
        n = 0
        for name in selected:
            print(f'--- {name}')
            t0 = time.time()
            try:
                await SECTIONS[name](env)
            except Exception as e:  # o secțiune stricată nu oprește restul, dar se numără ca eșec
                import traceback; traceback.print_exc()
                check(f'secțiune {name}: fără excepții de test', False, repr(e))
            print(f'    ({time.time() - t0:.0f}s)')
            if name in RELAUNCH:
                try:
                    await env.ctx.close()
                except Exception:
                    pass
                if name == 'privacy':
                    env.privacy_log = env.netlog
                n += 1
                if name != selected[-1]:
                    await launch(env, str(n))
            else:
                await close_others(env)
        try:
            await env.ctx.close()
        except Exception:
            pass
        if 'privacy' in selected:
            post_netlog(env.netlogs, env.privacy_log)


if __name__ == '__main__':
    sel = [a for a in sys.argv[1:] if a in SECTIONS] or list(SECTIONS)
    asyncio.run(main(sel))
    print(f'\n{len(fails)} eșecuri' if fails else '\ntoate verificările au trecut')
    sys.exit(1 if fails else 0)
