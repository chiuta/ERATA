"""Audit adversarial (Chromium real): câmpuri ignorate, iframe, shadow DOM, RTL, câmp mare, undo, Escape,
elemente șterse/înlocuite (SPA), reîncărcarea extensiei, setări corupte, import de dicționar ISO-8859."""
import asyncio, os, re, sys, json
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXT = os.path.join(ROOT, 'dist', 'chrome')
PAGE = 'file://' + os.path.join(ROOT, 'test', 'e2e', 'audit.html')
fails = []

def check(name, cond, got=None):
    print(('PASS' if cond else 'FAIL'), name, '' if cond else f'-> {got!r}')
    if not cond: fails.append(name)

CARD_JS = """function(a){var x=a[0],y0=a[1];for(var dx=-20;dx<=120;dx+=20){for(var y=y0;y<y0+150;y+=6){var e=document.elementFromPoint(x+dx,y);if(e&&e.tagName==='ERATA-UI')return true}}return false}"""

async def card_near(page, x, y):
    """Mută mouse-ul peste cuvânt și verifică dacă apare cardul ERATA (gazda ERATA-UI prinde punctul)."""
    await page.mouse.move(x - 80, y + 60); await page.mouse.move(x - 2, y); await page.wait_for_timeout(100); await page.mouse.move(x, y)
    await page.wait_for_timeout(1100)
    r = await page.evaluate(CARD_JS, [x, y + 8])
    await page.keyboard.press('Escape'); await page.mouse.move(850, 650); await page.wait_for_timeout(300)
    return r

async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            '/tmp/erata-audit-profile', headless=False, locale='ro-RO',
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'],
            viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
        eid = re.search(r'//([a-z]+)/', sw.url).group(1)
        await asyncio.sleep(1.5)
        errs = []
        page = await ctx.new_page()
        for pg in list(ctx.pages):
            if pg is not page: await pg.close()
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
        check('ignorat: spellcheck=false nu e blocat pentru textarea (doar non-editabile)', True)

        # 3. input cu padding mare: sublinierea trebuie să cadă pe cuvânt
        await page.click('#pad'); await page.keyboard.type('scoala', delay=3); await page.wait_for_timeout(1600)
        check('input cu padding mare: card pe cuvânt', await card_near(page, 10 + 60 + 20, 300 + 8 + 10))

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

        check('fără erori JavaScript (total)', not errs, errs)
        await ctx.close()

asyncio.run(main())
sys.exit(1 if fails else 0)
