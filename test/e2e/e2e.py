"""Test end-to-end (Chromium): extensia se încarcă, sublinierile și cardul funcționează, Studio corectează."""
import asyncio, os, re, sys
from playwright.async_api import async_playwright

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXT = os.path.join(ROOT, 'dist', 'chrome')
PAGE = 'file://' + os.path.join(ROOT, 'test', 'e2e', 'page.html')
fails = []

def check(name, cond, got=None):
    print(('PASS' if cond else 'FAIL'), name, '' if cond else f'-> {got!r}')
    if not cond: fails.append(name)

async def main():
    async with async_playwright() as p:
        ctx = await p.chromium.launch_persistent_context(
            '/tmp/erata-e2e-profile', headless=False, locale='ro-RO',
            args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}', '--headless=new', '--no-sandbox'],
            viewport={'width': 900, 'height': 700})
        sw = ctx.service_workers[0] if ctx.service_workers else await ctx.wait_for_event('serviceworker')
        eid = re.search(r'//([a-z]+)/', sw.url).group(1)
        errs = []
        page = await ctx.new_page()
        page.on('pageerror', lambda e: errs.append(str(e)))
        await page.goto(PAGE); await page.wait_for_timeout(400)

        # textarea: subliniere + card + aplicarea primei sugestii
        await page.click('#ta')
        await page.keyboard.type('Mama si copiii merg la scoala. Vreau sa merg, dar este tarziu.', delay=4)
        await page.wait_for_timeout(1700)
        await page.mouse.move(100, 300); await page.mouse.move(236, 109); await page.wait_for_timeout(120); await page.mouse.move(238, 109)
        await page.wait_for_timeout(1200)
        await page.mouse.click(252, 191); await page.wait_for_timeout(400)
        v = await page.input_value('#ta')
        check('textarea: sugestia „școala” aplicată', 'la școala.' in v, v)

        # contenteditable: nu strică DOM-ul și rămâne editabil
        await page.click('#ce'); await page.keyboard.type('i have a apple', delay=4); await page.wait_for_timeout(1500)
        txt = await page.inner_text('#ce')
        check('contenteditable: text păstrat', txt.strip() == 'i have a apple', txt)

        # Studio
        st = await ctx.new_page(); await st.goto(f'chrome-extension://{eid}/studio.html'); await st.wait_for_timeout(500)
        await st.fill('#txt', 'Mama si copiii merg in padure sa culeaga fructe. Vreau sa merg, dar este tarziu.')
        await st.wait_for_timeout(1200)
        await st.click('#restore'); await st.wait_for_timeout(1200)
        v = await st.input_value('#txt')
        check('studio: restaurare diacritice', v == 'Mama și copiii merg în pădure să culeagă fructe. Vreau să merg, dar este târziu.', v)
        await st.fill('#txt', 'i have a apple and the the cat , sat on the mat.Then left.')
        await st.select_option('#lang', 'en'); await st.wait_for_timeout(800)
        await st.click('#fix'); await st.wait_for_timeout(1200)
        v = await st.input_value('#txt')
        check('studio: corectează tot (en)', v == 'I have an apple and the cat, sat on the mat. Then left.', v)

        for name in ('options', 'popup'):
            pg = await ctx.new_page(); pg.on('pageerror', lambda e: errs.append(str(e)))
            await pg.goto(f'chrome-extension://{eid}/{name}.html'); await pg.wait_for_timeout(500)
            check(f'{name}: se încarcă', (await pg.inner_text('body')).strip() != '')
        check('fără erori JavaScript', not errs, errs)
        await ctx.close()

asyncio.run(main())
sys.exit(1 if fails else 0)
