# Aufbau von Parla Pizza!

Das Spiel ist eine Webseite (HTML, CSS, JavaScript) ohne Build-Schritt. Einzige Fremdbibliothek ist three.js für das Restaurant in 3D, fertig gepackt in `www/js/lib/three-mini.js`.
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
│   ├── modelle/              ← 3D-Modelle aus Blender (glTF .glb) für das Restaurant
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
| `inhalt/dialoge.js` | Zutaten (`ING`: Farbe, Markt-Stufe, Preis), Pizzen (`PIZZE`), alle Gäste-Sätze, Stufen (`LEVELS`), Shop (`SHOP`), Ausflüge (`TRIPS`: Eisladen, Hafen) |
| `inhalt/gaeste.js` | Stammgäste mit Persönlichkeit (`PERS`: eigene Begrüßungen, Plaudereien, Reaktionen auf Fehler) und Geschichten über mehrere Tage (`STORIES`) |
| `inhalt/woerterbuch.js` | `DICT`: Italienisch → Deutsch zum Antippen |
| `memory.js` | Zutaten-Memory: Bild und italienisches Wort als Paar finden, einmal pro Spieltag Geld (`S.memDay`) |
| `einrichtung.js` | Möbel mit Ausbaustufen (`START_FURN`, Einrichtung in `SHOP`), ihre Boni (`fx`, Trinkgeld höchstens +50 %), nach dem Kauf fragt Signor Moretti nach dem Platz |
| `lib/three-mini.js` | three.js 0.170 (nur die benötigten Teile, Quelle `docs/three/entry.js`) |
| `restaurant3d.js` | Il mio locale: Restaurant in 3D mit den Modellen aus `www/modelle/` (`MODEL`: welches Modell, wohin es darf). Drehen, Zoomen, Ziehen, Drehen, Einlagern, Vorschaubild für Startseite und Shop |
| `speichern.js` | Spielstand `S`, Speichern nach jeder Aktion, Laden alter Spielstände, Versionen mit Umwandlung (`SAVE_V`, `MIGRATE`), Kopie im Handy-Speicher (Capacitor Preferences), tägliche Sicherheitskopie |
| `audio.js` | Vorlese-Stimme (Männer/Frauen), Musik, Geräusche, „Alles stumm“ |
| `grafik.js` | Gesichter der Gäste (`CHARS`) und die Pizza |
| `szenen.js` | Umgebungen: Pizzeria, Markt, Eisladen, Hafen, laufende Figuren (`walker`: Gast kommt herein und geht, Passanten auf Markt und Hafen). Nutzt die Bilder aus `www/bilder/umgebungen/` (Ausschnitt und Platz der Figur in `SCENE_IMG`), sonst gezeichnete Ersatz-Szenen |
| `karte.js` | Karte mit allen Orten: antippen spielt das Tür-Geräusch und geht direkt dorthin. Zeigt das 3D-Viertel aus `stadt3d.js`, ohne WebGL die flache Karte |
| `stadt3d.js` | La mappa als 3D-Viertel von Neapel: Piazza mit Brunnen, Häuserreihen, Promenade, Hafen, Meer, Capri und Vesuv aus einfachen Formen (gleiche Teile zu wenigen Meshes zusammengelegt), dazu Vespa, Terrasse, Schirme und Boot aus `www/modelle/`. Orte stehen in `CITY_SPOTS`, Schilder darüber sind HTML-Knöpfe mit `data-act="place"` |
| `schritte.js` | Bausteine eines Spieltags: Frage, Pizza, Telefon, Reservierung, Rechnung |
| `spieltag.js` | Ablauf eines Tages, Trinkgeld, Fehler, Markt mit Feilschen (`hagStart`, `hagOffer`), Abrechnung |
| `laden.js` | Laden einrichten per Drag-and-drop und Namens-Abfrage |
| `vokabeln.js` | Vokabeltrainer nach Tagen und fürs Notizbuch (abwechselnd beide Richtungen, Klammer-Hinweise erst nach der Antwort) |
| `truhe.js` | Belohnungs-Truhe nach bestandenem Vokabeltag: Belohnungen würfeln (4 % selten), Sprite-Animation, Karten |
| `bildschirme.js` | Alle Bildschirme (jeder passt ohne Scrollen), Kopfzeile mit Zurück, Ton und Zahnrad, Einstellungen, Pause-Fenster, „So geht's“ |
| `eingaben.js` | Klicks, Antippen, langes Drücken, Regler |
| `start.js` | Start: Spielstand laden, Cloud abgleichen, nach App-Updates suchen |

## Spielstand

Alles, was gespeichert wird, steht im Objekt `S` (Startwerte in `S0` in `speichern.js`).
Ein neues Feld bekommt dort einen Startwert; alte Spielstände übernehmen ihn automatisch.
Felder nie umbenennen oder löschen, sonst verlieren Spieler ihren Fortschritt.

Ändert sich der Aufbau eines Spielstands, dann:
1. `SAVE_V` in `speichern.js` um eins erhöhen und in `MIGRATE` die Umwandlung von der alten Version eintragen.
2. Ein Beispiel des alten Stands als `test/spielstaende/vN.json` ablegen (mit erwartetem Geld, Tag, Stufe).
3. `node test/spiel-test.mjs` lädt alle Beispiele und muss grün sein.

Der Spielstand liegt dreifach: im Browser-Speicher, im Handy-Speicher der App (Capacitor Preferences)
und als tägliche Sicherheitskopie. Dazu kommt der Spielstand-Code in den Einstellungen zum Mitnehmen.
App-Kennung (`capacitor.config.json`) und Schlüssel (`signing/`) nie ändern, sonst geht kein Update.

## Pizzen und Zutaten

- Ein neues Spiel startet mit sechs Zutaten (`START_ING`). Weitere kauft man am Markttag beim Stand von Signor Esposito. Er bietet drei Zutaten an, die man noch nicht hat, aus der aktuellen Stufe oder darunter.
- Eine Pizza ist freigeschaltet, sobald man alle ihre Zutaten besitzt. Gäste bestellen nur, was man backen kann. Eine neu freigeschaltete Pizza bestellt am nächsten Tag garantiert jemand (`S.newPz`).
- Sterne: Für je drei fehlerfreie Pizzen einer Sorte gibt es einen Stern, höchstens drei (`S.pz`). Unter zwei Sternen steht das Rezept in der Aufgabe. Mit drei Sternen gibt es +1 € Trinkgeld.
- Spielstände vor Version 4 behalten alle zwölf alten Zutaten plus die neuen Start-Zutaten.

## Stammgäste und Geschichten

- Jeder der zwölf Stammgäste (`NAMES`) hat in `inhalt/gaeste.js` eigene Sätze: Begrüßung und Plauderei kommen zu etwa zwei Dritteln aus seinem eigenen Vorrat. Ein Satz hat dasselbe Format wie in `dialoge.js`, nur stehen die falschen Antworten gleich mit Übersetzung dabei.
- Falsche Antwort: der Gast reagiert in der Sprechblase, beim ersten Fehler verwirrt, bei schlechter Laune verärgert (`huh`), jeder auf seine Art. Bei der Pizza gibt es eigene Sätze (`HUH_PIZZA`).
- Geschichten (`STORIES`): Ab Tag 3 beginnt die erste. Jeder Teil kommt an einem eigenen Spieltag mit einem Tag Pause, der Gast bringt seine Sätze statt Begrüßung und Plauderei mit („📖 Geschichte“). Weiter geht es erst, wenn der Tag zu Ende gespielt ist. Spielstand: `S.story`, `S.storiesDone`, `S.storyNext`.
- Neue Geschichte: einfach einen Eintrag in `STORIES_RAW` anhängen, `who` muss einer der `NAMES` sein.

## Feilschen am Markt

- Signor Esposito (`CHARS`/`OUTFIT` in `grafik.js`) steht als ganze Figur im Markt. Beim Feilschen zeigt sein Gesicht, wie viel Geduld er noch hat.
- Preis antippen startet das Feilschen. Er nennt den Preis auf Italienisch, du wählst ein Gegenangebot. Unter 70 % des Preises ist er beleidigt und verliert Geduld; nach zwei Frechheiten gilt sein Preis. Sonst trifft er dich in der Mitte, nach zwei Runden kommt sein letzter Preis.
- „Übersetzen“ zeigt die Zahlen auf Deutsch. „Lascio stare“ geht weg, der letzte Preis bleibt für diesen Markttag (`st.asks`).
- Das Gesparte steht in der Abrechnung bei „Neue Zutaten“ (`G.haggled`).

## Zutaten-Memory

- Auf der Startseite neben „Vocabolario“. Sechs Paare: Bild der Zutat und italienisches Wort, das Wort wird beim Aufdecken vorgelesen.
- Eigene Zutaten zuerst. Einmal pro Spieltag gibt es 12 € minus Fehlversuche (mindestens 3 €).

## Einrichtung und Kaffee

- Der Laden startet mit Elektroofen, Bretter-Theke, Plastiktisch und Kühlbox. Im Shop gibt es pro Stufe neue Möbel; Ofen, Theke, Tische, Kühlung und Kaffeemaschine haben drei Ausbaustufen.
- Jedes Stück hat einen eigenen Bonus (`fx` in `SHOP`): mehr Gäste, günstigere Zutaten, Hilfen. Nach dem Kauf geht es ins 3D-Restaurant, das neue Stück ist ausgewählt und Signor Moretti fragt, wohin es soll.

## Restaurant in 3D (Il mio locale)

- Man startet direkt mit einer kleinen Pizzeria (Stufe 1 „La Piccola Pizzeria“). Raum 9 × 7 m, Tür vorne in der Mitte, davor Gehweg und Meer.
- Alles aus Shop und Truhe steht als 3D-Modell im Raum (`MODEL` in `restaurant3d.js`). Bodenstücke rasten auf 25 cm ein, kleine Sachen (Kaffeemaschine, Basilikum, Kerze …) stellt man auf Theke oder Tisch, Bilder, Uhr, Spiegel und Wandlampen hängen an der Wand, Vespa, Terrasse und Schirm stehen draußen, das Boot liegt im Wasser. Tür und Durchgang bleiben frei, nichts überlappt.
- Ein Finger dreht die Kamera, zwei Finger zoomen und verschieben. Ein Stück antippen: Name hören, Drehen, ins Lager. Aus dem Lager mit einem Tipp wieder aufstellen.
- Die Tischdecken (Shop und Truhe) machen alle Tische kariert. Licht kommt von Wandlampen, nicht von der Decke.
- Gespeichert in `S.locale` (`{x, z, r, y}` in Metern, `st: 1` = im Lager). Alte Rasterplätze (`S.place`) werden beim ersten Öffnen umgerechnet und bleiben im Spielstand stehen.
- Für ältere Handys: einfaches Licht (Lambert), keine Echtzeit-Schatten (weiche Schattenflecken), gezeichnet wird nur, wenn sich etwas bewegt.
- Kaffee (`CAFFE` in `inhalt/dialoge.js`) gibt es ab der Moka-Kanne. Die Reihenfolge der Zutaten zählt, eine falsche Tasse kostet nur Trinkgeld.

## Gesundheitsamt

- Ab La Pizzeria kommt etwa jeden fünften Tag Dottoressa Severini (`S.inspDue`), nie zwei Tage hintereinander. Am Abend davor steht ein Brief in der Abrechnung.
- Sie stellt vier von zwölf Fragen (`ISPEZIONE`). Ohne Fehler: Zertifikat, +15 € und drei Tage lang ein Stern mehr (`S.cert`). Ein oder zwei Fehler: sie kommt in drei Tagen wieder. Ab drei Fehlern: 20 € Strafe, sie kommt am nächsten Tag wieder.

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
