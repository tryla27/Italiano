# Vorschlag: Gäste mit ganzem Körper

Nur ein Vorschlagsbild, noch nicht im Spiel eingebaut.

- `vorschlag-pizzeria.webp`: Blick vom Pizzabäcker hinter dem Tresen, Marco läuft auf den Tresen zu, Giulia kommt herein.
  Hintergrund mit ComfyUI/SDXL erzeugt (Seed 1065997202), Tresen und Figuren darübergelegt.
- `Marco.svg`, `Giulia.svg`, `Signor_Bianchi.svg`: Figuren in Laufhaltung. Der Kopf ist genau die
  Zeichnung aus `face()` in `www/js/grafik.js`, darunter Rumpf, Arme, Beine und Schuhe in denselben flachen Formen.
- `koerper.py`: Skript, das die SVGs erzeugt (Python-Nachbau von `face()` plus Körper). Für den Einbau
  ins Spiel lässt sich der Körper direkt als JavaScript-Funktion neben `face()` übernehmen.
