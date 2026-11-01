"""Übersicht aller gerenderten Kisten: python sheet.py ORDNER AUSGABE.png"""
import sys, os
from PIL import Image, ImageDraw
d = sys.argv[1]; out = sys.argv[2]; S = 192
fs = sorted(f for f in os.listdir(d) if f.endswith(".png"))
cols = 6; rows = (len(fs) + cols - 1) // cols
W = Image.new("RGBA", (cols * S, rows * (S + 16)), (40, 48, 44, 255)); dr = ImageDraw.Draw(W)
for i, f in enumerate(fs):
    im = Image.open(os.path.join(d, f)).convert("RGBA").resize((S, S)); x, y = i % cols * S, i // cols * (S + 16)
    W.alpha_composite(im, (x, y)); dr.text((x + 6, y + S), f[:-4], fill=(240, 240, 230, 255))
W.save(out)
