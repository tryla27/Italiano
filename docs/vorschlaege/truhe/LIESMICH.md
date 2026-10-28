# Entwurf: Belohnungs-Truhe („il forziere“)

Nur ein Entwurf, noch nicht im Spiel eingebaut.

| Datei | Inhalt |
|---|---|
| `truhe-zu.webp` | Truhe geschlossen, 768 × 1344 |
| `truhe-offen.webp` | Truhe offen mit Lichtstrahl, Münzen und Edelsteinen, 768 × 1344 |
| `truhe-oeffnen.webp` | Probe-Animation, 36 Bilder bei 24 fps (1,5 s) plus Standbild am Ende, 540 × 960, ca. 0,6 MB |
| `truhe.py` | Blender-Skript, baut und rendert alles: `blender -b --python truhe.py -- still <ordner>` oder `-- anim <ordner>` |

Gerendert mit Blender 5.2 Cycles auf einer RTX 3060 (OptiX): ein Standbild ca. 14 s, die ganze Animation ca. 3,5 min.

## Ablauf der Animation

1. Bild 1–13: Truhe wackelt hin und her (Spannung aufbauen, Tippen zum Öffnen).
2. Bild 13–16: duckt sich zusammen, erster Lichtspalt.
3. Bild 16–19: Deckel springt auf, Lichtstrahl und Glut schießen hoch.
4. Bild 19–36: Deckel federt nach, Licht pendelt sich ein.

## Vorschlag für den Einbau

- Für das Spiel die Animation ohne Hintergrund rendern (`film_transparent`), quadratisch 512 × 512,
  24 Bilder als ein Sprite-Sheet (6 × 4) im WebP-Format: etwa 300–500 KB.
- Der Hintergrund (abgedunkelter Bildschirm, Strahlenkranz, der sich langsam dreht) kommt per CSS.
- Funkeln, Sterne und Münzen, die herausfliegen, kommen per Code (Canvas oder CSS), damit sie
  jedes Mal etwas anders aussehen und die Datei klein bleibt.
- Danach fliegen die Belohnungen einzeln heraus und drehen sich als Karte um; seltene Gegenstände (4 %)
  bekommen einen violetten oder goldenen Schein und einen eigenen Ton.
