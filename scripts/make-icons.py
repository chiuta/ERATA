#!/usr/bin/env python3
"""Generează pictogramele ERATA (PNG) — desen original: pătrat rotunjit + literă E + subliniere ondulată."""
from PIL import Image, ImageDraw
import math, os

OUT = os.path.join(os.path.dirname(__file__), '..', 'extension', 'icons')
os.makedirs(OUT, exist_ok=True)


def draw(size):
    S = size * 8  # supraeșantionare
    im = Image.new('RGBA', (S, S), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    r = int(S * 0.22)
    # fundal: degrade vertical albastru închis -> albastru
    grad = Image.new('RGBA', (S, S))
    gp = grad.load()
    for y in range(S):
        t = y / S
        c = (int(24 + 20 * t), int(73 + 40 * t), int(169 + 30 * t), 255)
        for x in range(S):
            gp[x, y] = c
    mask = Image.new('L', (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, S - 1, S - 1], radius=r, fill=255)
    im.paste(grad, (0, 0), mask)
    d = ImageDraw.Draw(im)
    w = max(2, int(S * 0.095))
    # litera E
    x0, x1 = int(S * 0.30), int(S * 0.68)
    y0, y1 = int(S * 0.18), int(S * 0.62)
    ym = (y0 + y1) // 2
    white = (255, 255, 255, 255)
    d.line([(x0, y0), (x0, y1)], fill=white, width=w)
    for y in (y0, ym, y1):
        d.line([(x0 - w // 2, y), (x1, y)], fill=white, width=w)
    # subliniere ondulată (roșu-coral)
    pts = []
    xs = int(S * 0.16)
    xe = int(S * 0.84)
    base = int(S * 0.80)
    amp = S * 0.045
    n = 80
    for i in range(n + 1):
        x = xs + (xe - xs) * i / n
        y = base + amp * math.sin(i / n * math.pi * 2 * (2.5 if size > 24 else 1.5))
        pts.append((x, y))
    d.line(pts, fill=(255, 122, 104, 255), width=max(2, int(S * 0.075)), joint='curve')
    return im.resize((size, size), Image.LANCZOS)


for s in (16, 32, 48, 128):
    draw(s).save(os.path.join(OUT, f'{s}.png'))
print('icons ok')
