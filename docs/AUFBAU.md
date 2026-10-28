# Aufbau von Pizzeria Parola

Das Spiel ist eine Webseite (HTML, CSS, JavaScript) ohne Fremdbibliotheken und ohne Build-Schritt.
Capacitor verpackt den Ordner `www/` als Android-App. Jede Datei kann direkt im Editor geändert
werden, nach **F5** im Browser ist die Änderung sichtbar.

## Ordner

```
Italiano/
├── www/                      ← das Spiel (genau dieser Ordner kommt in die App)
│   ├── index.html            ← Grundgerüst, lädt CSS und die JS-Dateien der Reihe nach
│   ├── css/spiel.css         ← Aussehen: Farben, Schriften, alle Bildschirme
│   ├── js/                   ← Spiellogik, eine Datei pro Thema (Tabelle unten)
│   │   └── inhalt/           ← reine Inhalte: Dialoge und Wörterbuch
│   ├── bilder/umgebungen/    ← Hintergrundbilder der Spielorte (WebP)
│   └── music/                ← Hintergrundmusik (MP3)
├── assets/                   ← Quellbilder für App-Icon und Startbild
├── test/spiel-test.mjs       ← automatischer Test im Handy-Browser
├── docs/                     ← Anleitungen (diese Datei, PC-Anleitung)
├── signing/debug.keystore    ← App-Schlüssel, NIEMALS löschen oder ersetzen
├── .github/workflows/        ← baut bei jedem Push auf main die Android-App
├── capacitor.config.json     ← App-Name, App-ID
├── package.json              ← benötigte Pakete
└── Spiel-starten.bat         ← Spiel am Windows-PC starten
```

## JavaScript-Dateien

Die Dateien sind normale Skripte (keine Module) und teilen sich ihre Variablen. Deshalb ist die
Reihenfolge in `index.html` wichtig: jede Datei darf nur benutzen, was vorher festgelegt wurde
oder erst beim Spielen aufgerufen wird.

| Datei | Inhalt |
|---|---|
| `hilfen.js` | Kleine Helfer: `$`, Zufall, Mischen, Listen |
| `inhalt/dialoge.js` | Zutaten, Speisekarte, alle Gäste-Sätze, Stufen (`LEVELS`), Shop (`SHOP`), Ausflüge (`TRIPS`: Eisladen, Hafen) |
| `inhalt/woerterbuch.js` | `DICT`: Italienisch → Deutsch zum Antippen |
| `speichern.js` | Spielstand `S`, Speichern nach jeder Aktion, Laden alter Spielstände |
| `audio.js` | Vorlese-Stimme (Männer/Frauen), Musik, Geräusche, „Alles stumm“ |
| `grafik.js` | Gesichter der Gäste (`CHARS`) und die Pizza |
| `szenen.js` | Umgebungen: Pizzeria, Markt, Eisladen, Hafen, laufende Figuren (`walker`: Gast kommt herein und geht, Passanten auf Markt und Hafen). Nutzt die Bilder aus `www/bilder/umgebungen/` (Ausschnitt und Platz der Figur in `SCENE_IMG`), sonst gezeichnete Ersatz-Szenen |
| `karte.js` | Karte mit allen Orten: antippen spielt das Tür-Geräusch und geht direkt dorthin |
| `schritte.js` | Bausteine eines Spieltags: Frage, Pizza, Telefon, Reservierung, Rechnung |
| `spieltag.js` | Ablauf eines Tages, Trinkgeld, Fehler, Markt, Abrechnung |
| `laden.js` | Laden einrichten per Drag-and-drop und Namens-Abfrage |
| `vokabeln.js` | Vokabeltrainer nach Tagen und fürs Notizbuch (abwechselnd beide Richtungen, Klammer-Hinweise erst nach der Antwort) |
| `bildschirme.js` | Alle Bildschirme, Leiste oben links, Einstellungsmenü |
| `eingaben.js` | Klicks, Antippen, langes Drücken, Regler |
| `start.js` | Start: Spielstand laden, Cloud abgleichen, nach App-Updates suchen |

## Spielstand

Alles, was gespeichert wird, steht im Objekt `S` (Startwerte in `S0` in `speichern.js`).
Ein neues Feld bekommt dort einen Startwert; alte Spielstände übernehmen ihn automatisch.
Felder nie umbenennen oder löschen, sonst verlieren Spieler ihren Fortschritt.

## Testen

```
node test/spiel-test.mjs
```

Startet das Spiel im Handy-Format, klickt alle Bildschirme durch, prüft Einstellungen, Stimmenwahl
und alte Spielstände und legt Screenshots in `test/screenshots/` ab. Braucht Playwright
(am PC einmalig: `npm i -D playwright && npx playwright install chromium`).

## App bauen

Bei jedem Push auf `main`, der `www/`, `assets/` oder die Konfiguration ändert, baut GitHub Actions
die APK und veröffentlicht sie als Release. Die Versionsnummer wird dabei in `www/js/start.js`
eingesetzt.
