"""Paginile de test (servite de helpers.start_server): geometrii ostile, tastatură, medii extreme."""
BASE = 'position:absolute;left:30px;top:30px;width:300px;height:100px;font:20px/28px monospace;padding:6px;border:2px solid #444;box-sizing:border-box'
HEAD = '<!doctype html><html lang="ro"><meta charset="utf-8"><body style="margin:0;background:#fff;color:#000">'


def ta(extra='', id='f'):
    return f'<textarea id={id} style="{BASE};{extra}"></textarea>'


def ce(extra='', id='f'):
    return f'<div id={id} contenteditable style="{BASE};overflow:auto;{extra}"></div>'


def inp(extra='', id='f'):
    return f'<input id={id} style="position:absolute;left:30px;top:30px;width:300px;font:20px monospace;padding:6px;border:2px solid #444;box-sizing:border-box;{extra}">'


def wrap(style, inner, attrs=''):
    return f'<div {attrs} style="position:absolute;left:0;top:0;width:800px;height:500px;{style}">{inner}</div>'


NEST = (
    '<div id=o1 style="position:absolute;left:20px;top:20px;width:460px;height:240px;overflow:auto;border:1px solid #888;box-sizing:border-box">'
    '<div style="height:60px"></div>'
    '<div id=o2 style="width:400px;height:150px;overflow:auto;margin:0 20px;border:1px solid #888;box-sizing:border-box">'
    '<div style="height:70px"></div>'
    '<textarea id=f style="display:block;width:300px;height:80px;font:20px/28px monospace;padding:6px;border:2px solid #444;box-sizing:border-box;margin:0 0 200px 10px"></textarea>'
    '</div><div style="height:400px"></div></div>'
)

PAGES = {
    # ---- geometrii ----
    'g_ta': HEAD + ta(),
    'g_ta_scale': HEAD + wrap('transform:scale(1.7);transform-origin:0 0', ta()),
    'g_ta_scale_xy': HEAD + wrap('transform:scale(1.4,0.8);transform-origin:0 0', ta()),
    'g_ta_rot15': HEAD + wrap('transform:rotate(15deg);transform-origin:0 0;left:100px', ta()),
    'g_ta_rot90': HEAD + wrap('transform:rotate(90deg);transform-origin:0 0;left:420px', ta()),
    'g_ta_rotscale': HEAD + wrap('transform:rotate(-8deg) scale(1.3);transform-origin:0 0;left:60px;top:120px', ta()),
    'g_ta_zoom': HEAD + wrap('zoom:2', ta()),
    'g_ta_rtl': HEAD + wrap('', ta(), 'dir=rtl'),
    'g_ta_rtl_scroll': HEAD + wrap('', ta(), 'dir=rtl'),
    'g_ta_he': HEAD + wrap('', ta(), 'dir=rtl'),
    'g_ta_vert': HEAD + ta('writing-mode:vertical-rl;width:150px;height:300px'),
    'g_in': HEAD + inp(),
    'g_in_center': HEAD + inp('text-align:center'),
    'g_in_right': HEAD + inp('text-align:right'),
    'g_in_rtl': HEAD + wrap('', inp(), 'dir=rtl'),
    'g_ta_nest': HEAD + NEST,
    'g_ce': HEAD + ce(),
    'g_ce_scale': HEAD + wrap('transform:scale(1.7);transform-origin:0 0', ce()),
    'g_ce_rot15': HEAD + wrap('transform:rotate(15deg);transform-origin:0 0;left:100px', ce()),
    'g_ce_rtl': HEAD + wrap('', ce(), 'dir=rtl'),
    'g_ce_vert': HEAD + ce('writing-mode:vertical-rl;width:150px;height:300px'),
    'g_iframe': HEAD
    + '<iframe id=fr style="position:absolute;left:100px;top:60px;width:420px;height:200px;border:0" '
    'srcdoc="<!doctype html><meta charset=utf-8><body style=margin:0><textarea id=f style=\'position:absolute;left:20px;top:20px;width:300px;height:100px;font:20px/28px monospace;padding:6px;border:2px solid #444;box-sizing:border-box\'></textarea>"></iframe>',
    'g_dialog': HEAD
    + '<dialog id=d style="width:560px;height:320px;padding:0;border:2px solid #444">'
    + ta('left:30px;top:30px')
    + '</dialog><script>document.getElementById("d").showModal()</script>',
    'g_csp': HEAD + '<textarea id=f></textarea>',
    'g_allunset': HEAD
    + '<style>*{all:unset!important}erata-ui{display:none!important;position:static!important;z-index:0!important}'
    + 'textarea{display:block!important;position:absolute!important;left:30px!important;top:30px!important;width:300px!important;height:100px!important;'
    + 'font:20px/28px monospace!important;white-space:pre-wrap!important;overflow-wrap:break-word!important;border:2px solid #444!important;box-sizing:border-box!important;padding:6px!important}</style>'
    + '<textarea id=f></textarea>',
    'g_zmax': HEAD + ta() + '<script>setTimeout(()=>{const o=document.createElement("div");o.id="ov";o.style.cssText="position:fixed;inset:0;z-index:2147483647;background:#fff;pointer-events:none";document.documentElement.append(o)},0)</script>',
    'g_htmltransform': '<!doctype html><html style="transform:scale(1.25);transform-origin:0 0"><meta charset="utf-8"><body style="margin:0;background:#fff">' + ta(),
    # ---- tastatură ----
    'kbd': HEAD
    + '<textarea id=a style="position:absolute;left:20px;top:20px;width:400px;height:90px;font:18px/24px system-ui;padding:6px;box-sizing:border-box"></textarea>'
    + '<input id=b style="position:absolute;left:20px;top:130px;width:300px;font:18px system-ui;padding:6px;box-sizing:border-box">'
    + '<div id=c contenteditable style="position:absolute;left:20px;top:190px;width:400px;height:90px;border:1px solid #888;font:18px/24px system-ui;padding:6px;box-sizing:border-box;overflow:auto"></div>'
    + '<button id=after style="position:absolute;left:20px;top:300px">dupa</button>',
    # ---- nume de câmpuri (regex restrâns) ----
    'names': HEAD + '<div id=box></div>',
    # ---- medii ostile ----
    'many': HEAD + '<div id=box></div>',
    'big': HEAD + ta('width:500px;height:200px') + ce('left:30px;top:260px;width:500px;height:200px', 'g')
    + ce('left:560px;top:260px;width:300px;height:200px', 'h').replace('contenteditable', 'contenteditable data-erata="off"'),
    'spa': HEAD + '<div id=box></div>',
    'leak': HEAD + '<div id=box></div>',
    'ime': HEAD + ta('', 't') + inp('top:160px', 'i') + ce('top:210px', 'c'),
    'blank': HEAD,
}
