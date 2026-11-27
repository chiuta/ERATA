"""Infrastructură comună pentru auditul adversarial (Chromium real, Playwright): server local, CDP, pixeli, AX, netlog."""
import asyncio, base64, collections, io, json, os, re, subprocess, threading, http.server, socketserver
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
EXT = os.path.join(ROOT, 'dist', 'chrome')
NETLOG = '/tmp/erata-audit-netlog.json'
fails = []


def check(name, cond, got=None):
    print(('PASS' if cond else 'FAIL'), name, '' if cond else f'-> {got!r}')
    if not cond:
        fails.append(name)


# ---------- server local (pagini ostile; antete CSP la cerere) ----------
class Pages:
    html = {}  # nume -> conținut; se completează din pages.py


CSP = {
    'strict': "default-src 'none'; img-src 'none'; style-src 'none'; font-src 'none'; connect-src 'none'; base-uri 'none'",
    'nostyle': "default-src 'none'; style-src 'none'; img-src 'none'",
}


class Handler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path, _, qs = self.path.partition('?')
        name = path.strip('/').removesuffix('.html')
        if name == 'favicon.ico':
            self.send_response(204); self.end_headers(); return
        body = Pages.html.get(name)
        if body is None:
            self.send_response(404); self.end_headers(); return
        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        m = re.search(r'csp=(\w+)', qs)
        if m and m.group(1) in CSP:
            self.send_header('Content-Security-Policy', CSP[m.group(1)])
        self.end_headers()
        self.wfile.write(body.encode())

    def do_POST(self):  # ținta controlului pozitiv al netlog-ului (nu face nimic cu corpul)
        n = int(self.headers.get('Content-Length') or 0)
        self.rfile.read(n)
        self.send_response(204); self.end_headers()

    def log_message(self, *a):
        pass


def start_server():
    srv = socketserver.ThreadingTCPServer(('127.0.0.1', 0), Handler)
    srv.daemon_threads = True
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


# ---------- pixeli ----------
RED = lambda a: (a[:, :, 0] > 150) & (a[:, :, 1] < 115) & (a[:, :, 2] < 105) & (a[:, :, 0] - a[:, :, 1] > 70)
AMBER = lambda a: (a[:, :, 0] > 170) & (a[:, :, 1] > 80) & (a[:, :, 1] < 150) & (a[:, :, 2] < 70)


def pixels(png):
    return np.array(Image.open(io.BytesIO(png)).convert('RGB')).astype(int)


def bbox_of(mask, region=None):
    """Caseta (x0,y0,x1,y1,n) a pixelilor activi, opțional restrânsă la regiunea (x0,y0,x1,y1)."""
    m = mask
    if region:
        x0, y0, x1, y1 = [int(round(v)) for v in region]
        z = np.zeros_like(mask)
        z[max(0, y0):max(0, y1), max(0, x0):max(0, x1)] = mask[max(0, y0):max(0, y1), max(0, x0):max(0, x1)]
        m = z
    ys, xs = np.nonzero(m)
    return None if len(xs) == 0 else (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max()), int(m.sum()))


def underline_matches(box, truth, mode='axis', slack=8):
    """Sublinierea (caseta de pixeli) trebuie să cadă pe cuvânt: truth = (x0,y0,x1,y1) al cuvântului."""
    if not box or box[4] < 15:
        return False
    bx0, by0, bx1, by1, _ = box
    tx0, ty0, tx1, ty1 = truth
    tw, th = tx1 - tx0, ty1 - ty0
    inside = bx0 >= tx0 - slack and bx1 <= tx1 + slack and by0 >= ty0 - slack and by1 <= ty1 + slack
    if mode == 'axis':
        return inside and (bx1 - bx0) >= 0.5 * tw and by1 >= ty1 - 10
    return inside and ((bx1 - bx0) >= 0.5 * tw or (by1 - by0) >= 0.5 * th)  # rotit: marginea cuvântului, nu o cutie exactă


# cuvântul „truth”: geamăn invizibil al câmpului (în același context transformat) cu același text și stil
TWIN_JS = """([sel, word, frameSel])=>{
  const f=document.querySelector(sel); const cs=getComputedStyle(f);
  const d=document.createElement('div');
  const decl=['position:absolute','display:block','visibility:hidden','margin:0','white-space:'+(f.tagName==='INPUT'?'pre':'pre-wrap'),'overflow-wrap:break-word','left:'+f.offsetLeft+'px','top:'+f.offsetTop+'px','width:'+f.offsetWidth+'px','height:'+f.offsetHeight+'px','box-sizing:border-box','border:'+cs.borderTopWidth+' solid transparent','padding:'+cs.padding,'font:'+cs.font,'letter-spacing:'+cs.letterSpacing,'writing-mode:'+cs.writingMode,'text-align:'+cs.textAlign,'direction:'+cs.direction,'overflow:auto','line-height:'+cs.lineHeight];
  for(const x of decl){const i=x.indexOf(':');d.style.setProperty(x.slice(0,i),x.slice(i+1),'important')}
  const v=f.value!==undefined?f.value:f.textContent; const i=v.indexOf(word);
  d.append(v.slice(0,i)); const s=document.createElement('span'); s.textContent=word; s.style.setProperty('display','inline','important'); d.append(s, v.slice(i+word.length));
  f.parentNode.append(d);
  if(f.scrollTop) d.scrollTop=f.scrollTop; if(f.scrollLeft) d.scrollLeft=f.scrollLeft;
  const r=s.getBoundingClientRect(); d.remove(); return [r.left,r.top,r.right,r.bottom];
}"""
CE_WORD_JS = """([sel, word])=>{
  const f=document.querySelector(sel); const w=document.createTreeWalker(f,NodeFilter.SHOW_TEXT); let n;
  while((n=w.nextNode())){const i=n.data.indexOf(word); if(i>=0){const r=document.createRange(); r.setStart(n,i); r.setEnd(n,i+word.length); const b=r.getBoundingClientRect(); return [b.left,b.top,b.right,b.bottom]}}
  return null}"""


# ---------- CDP / AX / DOM ----------
async def ax_nodes(cdp):
    r = await cdp.send('Accessibility.getFullAXTree')
    out = []
    for n in r['nodes']:
        if n.get('ignored'):
            continue
        props = {p['name']: p['value'].get('value') for p in n.get('properties', [])}
        out.append({'role': (n.get('role') or {}).get('value'), 'name': (n.get('name') or {}).get('value', ''), 'focused': bool(props.get('focused')), 'props': props, 'id': n['nodeId']})
    return out


async def erata_ui_tree(cdp):
    """Rădăcina shadow (închis) a lui <erata-ui>: lista nodurilor-copil (pătrunde în shadow-ul închis prin CDP)."""
    doc = await cdp.send('DOM.getDocument', {'depth': -1, 'pierce': True})
    found = []

    def walk(n):
        if n.get('nodeName', '').lower() == 'erata-ui':
            found.append(n)
        for c in n.get('children', []):
            walk(c)
        for s in n.get('shadowRoots', []):
            walk(s)
        if n.get('contentDocument'):
            walk(n['contentDocument'])
    walk(doc['root'])
    return found


def count_nodes(n):
    return 1 + sum(count_nodes(c) for c in n.get('children', []))


async def shadow_stats(cdp):
    """(număr gazde erata-ui, noduri în shadow, copii directe ai shadow) — pentru testul de scurgeri."""
    hosts = await erata_ui_tree(cdp)
    nodes = 0
    direct = 0
    for h in hosts:
        for s in h.get('shadowRoots', []):
            direct += len(s.get('children', []))
            nodes += count_nodes(s)
    return len(hosts), nodes, direct


def lum(rgb):
    def f(c):
        c /= 255
        return c / 12.92 if c <= 0.03928 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = rgb
    return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b)


def contrast(a, b):
    la, lb = lum(a), lum(b)
    if la < lb:
        la, lb = lb, la
    return (la + 0.05) / (lb + 0.05)


def parse_rgba(s):
    m = re.match(r'rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)(?:,\s*([\d.]+))?\)', s.strip())
    if not m:
        return None
    r, g, b = [float(m.group(i)) for i in (1, 2, 3)]
    a = float(m.group(4)) if m.group(4) is not None else 1.0
    return r, g, b, a


async def styled_nodes(cdp):
    """Toate nodurile element din shadow-ul ERATA cu stilurile calculate relevante: [{cls, tag, color, bg, ...}]."""
    await cdp.send('DOM.enable')
    await cdp.send('CSS.enable')
    hosts = await erata_ui_tree(cdp)
    out = []

    async def visit(n, bgchain):
        if n.get('nodeType') == 1:
            cs = await cdp.send('CSS.getComputedStyleForNode', {'nodeId': n['nodeId']})
            st = {x['name']: x['value'] for x in cs['computedStyle']}
            attrs = dict(zip(n.get('attributes', [])[::2], n.get('attributes', [])[1::2]))
            bg = parse_rgba(st.get('background-color', 'rgba(0, 0, 0, 0)'))
            chain = bgchain + ([bg] if bg and bg[3] > 0.02 else [])
            out.append({'tag': n['nodeName'].lower(), 'cls': attrs.get('class', ''), 'id': attrs.get('id', ''), 'color': parse_rgba(st.get('color', '')), 'bg': chain[-1] if chain else None,
                        'text': ''.join(c.get('nodeValue', '') for c in n.get('children', []) if c.get('nodeType') == 3), 'st': st, 'display': st.get('display'), 'attrs': attrs})
            for c in n.get('children', []):
                await visit(c, chain)
        else:
            for c in n.get('children', []):
                await visit(c, bgchain)
    for h in hosts:
        for s in h.get('shadowRoots', []):
            await visit(s, [])
    return out


# ---------- setări / mesaje ----------
async def set_settings(sw, **patch):
    # limba fixată: testele verifică interfața, nu detecția automată (ambiguă pe texte scurte: „la scoala si mama” poate ieși ro/it)
    patch.setdefault('lang', 'ro')
    await sw.evaluate("(p)=>chrome.storage.local.set({settings:p})", patch)
    await asyncio.sleep(0.5)


async def screenshot(page):
    return await page.screenshot(scale='css')


# ---------- netlog ----------
def netlog_requests(path=NETLOG):
    """Toate cererile URL înregistrate de Chromium: [(url, initiator)]."""
    d = json.load(open(path))
    names = {v: k for k, v in d['constants']['logEventTypes'].items()}
    out = []
    for e in d['events']:
        if names.get(e['type']) == 'URL_REQUEST_START_JOB' and 'params' in e:
            out.append((e['params'].get('url', ''), e['params'].get('initiator', '')))
    return out, d, names


def netlog_has_bytes(d, names, needle: bytes):
    """Caută `needle` în octeții trimiși pe socket (netlog Everything: base64) și în JSON brut."""
    for e in d['events']:
        p = e.get('params') or {}
        b = p.get('bytes')
        if isinstance(b, str):
            try:
                if needle in base64.b64decode(b):
                    return True
            except Exception:
                pass
    return needle.decode() in json.dumps(d['events'])


# ---------- lumea izolată a extensiei (content script): ascultători, recensământ de heap ----------
async def ext_contexts(cdp):
    """Id-urile contextelor de execuție „izolate” ale extensiei ERATA (un content script per cadru)."""
    found = []
    h = lambda e: found.append(e['context'])
    cdp.on('Runtime.executionContextCreated', h)
    await cdp.send('Runtime.enable')
    await asyncio.sleep(0.3)
    cdp.remove_listener('Runtime.executionContextCreated', h)
    return [c['id'] for c in found if c.get('auxData', {}).get('type') == 'isolated' and c.get('name', '').startswith('ERATA')]


async def ext_listeners(cdp, ctx_id, expr):
    """Tipurile ascultătorilor înregistrați de extensie pe obiectul `expr` (evaluat în lumea ei). DOMDebugger nu vede lumea izolată din contextul principal."""
    r = await cdp.send('Runtime.evaluate', {'expression': expr, 'contextId': ctx_id})
    if 'objectId' not in r['result']:
        return None
    ls = await cdp.send('DOMDebugger.getEventListeners', {'objectId': r['result']['objectId'], 'depth': 0})
    return sorted(l['type'] for l in ls['listeners'])


async def heap_census(cdp, names=('MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'AbortController')):
    """Instantaneu de heap: câte obiecte „Detached …” (noduri DOM scoase din document dar încă reținute) și câte observatoare există."""
    chunks = []
    h = lambda e: chunks.append(e['chunk'])
    cdp.on('HeapProfiler.addHeapSnapshotChunk', h)
    await cdp.send('HeapProfiler.collectGarbage')
    await cdp.send('HeapProfiler.takeHeapSnapshot', {'reportProgress': False})
    cdp.remove_listener('HeapProfiler.addHeapSnapshotChunk', h)
    snap = json.loads(''.join(chunks))
    f = snap['snapshot']['meta']['node_fields']
    stride = len(f)
    ni = f.index('name')
    di = f.index('detachedness') if 'detachedness' in f else None  # V8 recent: 2 = detașat (în loc de prefixul „Detached ”)
    strings = snap['strings']
    nodes = snap['nodes']
    cnt = collections.Counter()
    for i in range(0, len(nodes), stride):
        nm = strings[nodes[i + ni]]
        if nm.startswith('Detached ') or (di is not None and nodes[i + di] == 2 and nm.startswith('<')):  # element DOM detașat (detachedness=2)
            cnt['detached'] += 1
        elif nm in names:
            cnt[nm] += 1
    return dict(cnt)
