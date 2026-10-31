"""Nimmt alle Sätze aus saetze.json mit Kokoro auf (Open Source, Apache-2.0) und legt sie als MP3 ab.

    www/stimmen/f/<kennung>.mp3   Frauenstimme (Kokoro "if_sara")
    www/stimmen/m/<kennung>.mp3   Männerstimme (Kokoro "im_nicola")
    www/js/inhalt/stimmen.js      Liste der vorhandenen Aufnahmen (liest audio.js)

Schon vorhandene Aufnahmen werden übersprungen, nicht mehr gebrauchte gelöscht.
Aufruf:  python aufnehmen.py <ordner-mit-kokoro-modell>
(Modell: kokoro-v1.0.onnx und voices-v1.0.bin von github.com/thewh1teagle/kokoro-onnx/releases)
"""
import json, os, re, subprocess, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
WWW = os.path.join(HERE, "..", "..", "www")
VOICES = {"f": "if_sara", "m": "im_nicola"}
SPEED = 0.9  # etwas langsamer als normal, für Lernende


def norm(t):
    return re.sub(r"\s+", " ", t.strip())


def kennung(t):
    """FNV-1a (32 Bit) über die UTF-16-Zeichen, Base36. Genau so rechnet audio.js."""
    h = 0x811C9DC5
    b = norm(t).encode("utf-16-le")
    for i in range(0, len(b), 2):
        h ^= b[i] | (b[i + 1] << 8)
        h = (h * 0x01000193) & 0xFFFFFFFF
    s, n = "", h
    while True:
        n, r = divmod(n, 36)
        s = "0123456789abcdefghijklmnopqrstuvwxyz"[r] + s
        if n == 0:
            return s


def trim(x, sr):
    """Stille am Anfang und Ende kürzen (je 40 ms bleiben), damit Bausteine sauber aneinanderpassen."""
    loud = np.where(np.abs(x) > 0.01)[0]
    if not len(loud):
        return x
    pad = int(0.04 * sr)
    return x[max(0, loud[0] - pad): loud[-1] + pad]


def main():
    model_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    saetze = json.load(open(os.path.join(HERE, "saetze.json"), encoding="utf-8"))
    kokoro = None
    liste = {}
    bausteine = saetze.pop("bausteine", {})
    for v, texte in saetze.items():
        out = os.path.join(WWW, "stimmen", v)
        os.makedirs(out, exist_ok=True)
        ids = {}
        for t in texte:
            k = kennung(t)
            if k in ids and norm(ids[k]) != norm(t):
                sys.exit(f"Kennung doppelt: {t!r} / {ids[k]!r}")
            ids[k] = t
        neu = [(k, t) for k, t in ids.items() if not os.path.exists(os.path.join(out, k + ".mp3"))]
        print(f"{v}: {len(ids)} Sätze, {len(neu)} neu", flush=True)
        for i, (k, t) in enumerate(neu):
            if kokoro is None:
                from kokoro_onnx import Kokoro
                kokoro = Kokoro(os.path.join(model_dir, "kokoro-v1.0.onnx"), os.path.join(model_dir, "voices-v1.0.bin"))
            x, sr = kokoro.create(norm(t), voice=VOICES[v], speed=SPEED, lang="it")
            x = trim(np.asarray(x, dtype=np.float32), sr)
            subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-f", "f32le", "-ar", str(sr), "-ac", "1", "-i", "-",
                            "-codec:a", "libmp3lame", "-b:a", "32k", "-ar", "24000", os.path.join(out, k + ".mp3")],
                           input=x.tobytes(), check=True)
            if i % 100 == 0:
                print(f"  {v} {i}/{len(neu)}", flush=True)
        for f in os.listdir(out):
            if f.endswith(".mp3") and f[:-4] not in ids:
                os.remove(os.path.join(out, f))
        liste[v] = sorted(ids)
    with open(os.path.join(WWW, "js", "inhalt", "stimmen.js"), "w", encoding="utf-8") as f:
        f.write("/* Aufgenommene Sätze (automatisch erzeugt von tools/stimmen/aufnehmen.py, nicht von Hand ändern).\n"
                "   f = Frauenstimme, m = Männerstimme, fb/mb = Bausteine für zusammengesetzte Sätze; jede Kennung ist eine Datei in stimmen/<f|m>/<kennung>.mp3 */\n")
        for v, ts in bausteine.items():
            liste[v + "b"] = sorted({kennung(t) for t in ts})
        f.write("const STIMMEN={" + ",".join(f'{v}:"{" ".join(ks)}"' for v, ks in liste.items()) + "};\n")
    print("fertig", flush=True)


if __name__ == "__main__":
    main()
