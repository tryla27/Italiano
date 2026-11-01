# Kisten auf dem Markt

Für jede Zutat eine Holzkiste voller Ware, in Blender gebaut und mit Cycles gerendert (`kisten.py`).
Die Bilder liegen in `www/bilder/kisten/<zutat>.webp` und erscheinen im Mercato und am Stand von Signor Esposito.

Neu rendern (Blender 4.2 als Python-Modul):

```
python3.11 -m venv bpyenv && bpyenv/bin/pip install bpy==4.2.0
bpyenv/bin/python kisten.py kisten_png 64          # alle Zutaten, 64 Samples (ca. 10 Minuten)
bpyenv/bin/python kisten.py kisten_png 64 pomodoro # nur eine Zutat
python3 webp.py kisten_png                          # verkleinern und ins Spiel legen
python3 sheet.py kisten_png uebersicht.png          # alle Kisten auf einem Bild
```

Neue Zutat: in `PROTO` eine Form-Funktion und die Art des Einräumens eintragen
(`pile` Haufen, `logs` liegend in Reihen, `upright` stehend, `stack` gestapelt, `wedges` Käsekeile, `few` zwei große Stücke).
Kleine Ware wird über `SC` größer gemacht.
