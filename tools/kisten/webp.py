"""Gerenderte Kisten (PNG) verkleinern und als WebP ins Spiel legen.
Aufruf: python webp.py PNG_ORDNER  →  www/bilder/kisten/<zutat>.webp (224 × 224, durchsichtig)"""
import sys, os
from PIL import Image
src = sys.argv[1]
dst = os.path.join(os.path.dirname(__file__), "..", "..", "www", "bilder", "kisten")
os.makedirs(dst, exist_ok=True)
for f in sorted(os.listdir(src)):
    if f.endswith(".png"):
        im = Image.open(os.path.join(src, f)).convert("RGBA").resize((224, 224), Image.LANCZOS)
        im.save(os.path.join(dst, f[:-4] + ".webp"), "WEBP", quality=82, method=6)
print("fertig:", len(os.listdir(dst)), "Bilder in", os.path.normpath(dst))
