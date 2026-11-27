"""Sondă: desenează browserul singur (fără ERATA) sublinieri roșii? Compară câteva moduri de a opri verificatorul nativ."""
import asyncio, json, os, shutil, sys, tempfile
sys.path.insert(0, os.path.dirname(__file__))
from helpers import RED, pixels
from playwright.async_api import async_playwright

VARIANTS = {
    'implicit': ([], None),
    'preferinte': ([], {'browser': {'enable_spellcheck': False}, 'spellcheck': {'dictionaries': [], 'use_spelling_service': False}}),
    'fara-retea': (['--host-resolver-rules=MAP * ~NOTFOUND, EXCLUDE 127.0.0.1, EXCLUDE localhost'], None),
    'disable-features': (['--disable-features=Spellcheck,SpellcheckService,WinUseBrowserSpellChecker'], None),
}


async def main():
    out = {}
    async with async_playwright() as p:
        for name, (args, prefs) in VARIANTS.items():
            prof = tempfile.mkdtemp(prefix='erata-probe-')
            if prefs:
                os.makedirs(os.path.join(prof, 'Default'), exist_ok=True)
                json.dump(prefs, open(os.path.join(prof, 'Default', 'Preferences'), 'w'))
            ctx = await p.chromium.launch_persistent_context(prof, headless=False, locale='ro-RO', args=['--headless=new', '--no-sandbox'] + args, viewport={'width': 600, 'height': 300})
            page = await ctx.new_page()
            await page.set_content('<textarea id=f style="font:20px monospace;width:400px;height:80px"></textarea><input id=g style="font:20px monospace">')
            await page.focus('#f'); await page.keyboard.type('la scoala zzxqv '); await page.wait_for_timeout(2500)
            a = int(RED(pixels(await page.screenshot())).sum())
            await page.focus('#g'); await page.keyboard.type('scoala zzxqv '); await page.wait_for_timeout(2500)
            b = int(RED(pixels(await page.screenshot())).sum())
            out[name] = (a, b)
            await ctx.close(); shutil.rmtree(prof, ignore_errors=True)
    print('SONDA verificator nativ (pixeli roșii fără ERATA):', json.dumps(out))

asyncio.run(main())
