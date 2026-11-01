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
│   ├── stimmen/              ← aufgenommene Sätze (MP3): f = Frauenstimme, m = Männerstimme
│   └── music/                ← Hintergrundmusik (MP3)
├── assets/                   ← Quellbilder für App-Icon und Startbild
├── test/spiel-test.mjs       ← automatischer Test im Handy-Browser
├── test/woerter-test.mjs     ← prüft, ob jedes italienische Wort eine antippbare Übersetzung hat
├── tools/stimmen/            ← nimmt die Stimmen auf (siehe „Stimmen“ unten)
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
| `inhalt/dialoge.js` | Zutaten (`ING`: Farbe, Stufe, Kistenpreis), Marktstände (`BANCHE`), Pizzen (`PIZZE`), alle Gäste-Sätze, Stufen (`LEVELS`), Shop (`SHOP`), Ausflüge (`TRIPS`: Eisladen, Hafen) |
| `inhalt/gaeste.js` | Stammgäste mit Persönlichkeit (`PERS`: eigene Begrüßungen, Plaudereien, Reaktionen auf Fehler) und Geschichten über mehrere Tage (`STORIES`) |
| `inhalt/woerterbuch.js` | `DICT`: Italienisch → Deutsch zum Antippen |
| `memory.js` | Zutaten-Memory: Bild und italienisches Wort als Paar finden, einmal pro Spieltag Geld (`S.memDay`) |
| `einrichtung.js` | Möbel mit Ausbaustufen (`START_FURN`, Einrichtung in `SHOP`), ihre Boni (`fx`, Trinkgeld höchstens +50 %), nach dem Kauf fragt Signor Moretti nach dem Platz |
| `lib/three-mini.js` | three.js 0.170 (nur die benötigten Teile, Quelle `docs/three/entry.js`) |
| `restaurant3d.js` | Il mio locale: Restaurant in 3D mit den Modellen aus `www/modelle/` (`MODEL`: welches Modell, wohin es darf). Drehen, Zoomen, Ziehen, Drehen, Einlagern, Vorschaubild für Startseite und Shop |
| `speichern.js` | Spielstand `S`, Speichern nach jeder Aktion, Laden alter Spielstände, Versionen mit Umwandlung (`SAVE_V`, `MIGRATE`), Kopie im Handy-Speicher (Capacitor Preferences), tägliche Sicherheitskopie |
| `audio.js` | Vorlese-Stimme (aufgenommene Männer-/Frauenstimmen, sonst Gerätestimme), Musik, Geräusche, „Alles stumm“ |
| `inhalt/stimmen.js` | Liste der aufgenommenen Sätze (automatisch erzeugt, nicht von Hand ändern) |
| `grafik.js` | Gesichter der Gäste (`CHARS`) und die Pizza |
| `szenen.js` | Umgebungen: Pizzeria, Markt, Eisladen, Hafen, laufende Figuren (`walker`: Gast kommt herein und geht, Passanten auf Markt und Hafen). Nutzt die Bilder aus `www/bilder/umgebungen/` (Ausschnitt und Platz der Figur in `SCENE_IMG`), sonst gezeichnete Ersatz-Szenen |
| `karte.js` | Karte mit allen Orten: antippen spielt das Tür-Geräusch und geht direkt dorthin. Zeigt das 3D-Viertel aus `stadt3d.js`, ohne WebGL die flache Karte |
| `biblioteca.js` | La Biblioteca: Bücherregal (Bücher in `inhalt/libri.js`), Lesen Seite für Seite mit Antippen, Vorlesen und Übersetzung, drei Fragen pro Kapitel, beim ersten Mal 5 €. Fortschritt in `S.libri`. Regal „Poesie“ (`POESIE`): Kinderreime anhören, Reime ergänzen, eine Stufe pro Spieltag, nach 3 Stufen auswendig (+5 €, `S.poesie`) |
| `stadt3d.js` | La mappa als 3D-Viertel von Neapel: Piazza mit Brunnen, Häuserreihen, Promenade, Hafen, Meer, Capri und Vesuv aus einfachen Formen (gleiche Teile zu wenigen Meshes zusammengelegt), dazu Vespa, Terrasse, Schirme und Boot aus `www/modelle/`. Orte stehen in `CITY_SPOTS`, Schilder darüber sind HTML-Knöpfe mit `data-act="place"`. Das Viertel ist auch die Startseite (`rHomeCity` in `bildschirme.js`); Lernhäuser: Scuola → Vokabeln, Bar → Memory, Biblioteca → Bücher und Notizbuch, Forno → Rezepte (`CITY_GO` in `karte.js`) |
| `campagna3d.js` | La campagna: das Land am Vesuv in 3D (eigene Szene, gebaut wie `stadt3d.js`). La Masseria (Bauernhof mit Beeten, Stall, Kühen, Hühnern), das Haus von Don Vincenzo (grantiger Winzer in Rente, Garten, Pergola, alte Vespa) und La Vigna (Weinberg auf Terrassen mit Cantina, Tor zu, bis `S.amici.vincenzo` 5 Herzen hat). Erreichbar über den Wegweiser „Campagna“ in der Stadt (`CITY_GO.campagna`). Orte in `LAND_SPOTS`, Sätze beim Antippen in `LAND_SAY`. Betretbar: „Hineingehen“ fährt die Kamera zu `LAND_VIEW[id]` und blendet die Dächer aus (`house(…, tag)` baut hohle Wände, Dächer liegen in `K3.roofs[tag]`); Innenräume in `casaInside`, `stallaInside`, `vincenzoInside`, `cantinaInside`. Noch ohne Spielinhalt |
| `schritte.js` | Bausteine eines Spieltags: Frage, Pizza, Telefon, Reservierung, Rechnung |
| `spieltag.js` | Ablauf eines Tages, Trinkgeld, Fehler, Markt mit Feilschen (`hagStart`, `hagOffer`), Abrechnung, Vorrat verbrauchen |
| `mercato.js` | Il Mercato in der 3D-Stadt: fünf Stände (`BANCHE` in `inhalt/dialoge.js`) mit allen Zutaten, Kisten kaufen (`mkBuy`), „Vorrat auffüllen“ (`mkFill`), Markttag −20 % |
| `markt3d.js` | Il Mercato als begehbarer Ort in 3D (eigene Szene wie `campagna3d.js`): Piazza mit Häusern, Brunnen, Wimpelketten, Passanten und Tauben, fünf Stände (`MK_STANDS`: Lage, Farben, Händlerfigur). Jede Zutat liegt in einer eigenen Holzkiste (Inhalt je Zutat in `MK_LOOK`) mit italienischem Preisschild. Boden antippen: hingehen (um den Brunnen herum), Stand oder Kiste antippen: zum Stand, Händler winkt und grüßt, unten erscheinen seine Kisten (`mkCard3`, gekauft wird mit `mkBuy`). Am PC auch Pfeiltasten/WASD. Ohne WebGL der flache Markt (`rMercato2D`) |
| `laden.js` | Laden einrichten per Drag-and-drop und Namens-Abfrage |
| `vokabeln.js` | Vokabeltrainer nach Tagen und fürs Notizbuch (abwechselnd beide Richtungen, Klammer-Hinweise erst nach der Antwort) |
| `truhe.js` | Belohnungs-Truhe nach bestandenem Vokabeltag: Belohnungen würfeln (4 % selten), Sprite-Animation, Karten |
| `bildschirme.js` | Alle Bildschirme (jeder passt ohne Scrollen), Kopfzeile mit „‹ Stadt“, Ton und Zahnrad, „So geht's“. Pause und Einstellungen sind ein Menü: im Spiel oben Weiter / Zurück zur Stadt / Abbrechen, darunter Ton und Spielstand |
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

## Pizzen, Zutaten und Vorrat

- Verkauft wird nur, was vorher eingekauft wurde. Jede Pizza verbraucht eine Portion von jeder ihrer Zutaten (bei „senza“ eine weniger, bei „con“ eine mehr). Der Vorrat steht in `S.lager` (Portionen je Zutat).
- Eingekauft wird im **Mercato** (`mercato.js`): fünf Stände (Frutta e verdura, Latticini, Salumeria, Pescheria, Alimentari Esposito), zusammen alle 33 Zutaten (darunter neun Käsesorten) (`BANCHE`). Eine Kiste hat 10 Portionen (`KISTE`), der Preis steht in `ING[k][3]`. Der Kühlschrank macht billiger, am Markttag (mercoledì, sabato) ist alles 20 % günstiger. Offen ist der Markt immer, wenn gerade kein Spieltag läuft.
- „Vorrat auffüllen“ kauft so viele Kisten, dass es für etwa einen Spieltag reicht (`mkTargets`: nach Anteil an den Pizzen, die man backen kann).
- Beim Planen eines Spieltags (`startDay`) legen die Bestellungen ihre Portionen zurück (`G.left`, `G.use`). Gäste bestellen nur, was im Vorrat ist; reicht es nicht, gehen sie gleich wieder (`G.away`). Abgezogen wird am Abend (`endDay`), Abbrechen kostet also nichts. Mit leerer Küche schickt „Apri il locale!“ zum Markt. Reicht dort das Geld nicht einmal für die günstigste Pizza, schenken die Händler je eine Kiste ihrer Zutaten (`mkRescue`), damit es keine Sackgasse gibt.
- In der Abrechnung kosten nur noch Getränke und Kaffee pauschal 35 % ihres Preises; die Pizza-Zutaten sind ja schon bezahlt.
- Ein neues Spiel startet mit einer Kiste von jeder der sechs Start-Zutaten (`START_LAGER`). Spielstände vor Version 5 bekommen zwei Kisten von jeder Zutat, die sie schon hatten.
- Eine Pizza ist freigeschaltet, sobald man alle ihre Zutaten einmal gekauft hat (`S.ing`), und Gäste bestellen sie ab ihrer Stufe (`lv`). Eine neu freigeschaltete Pizza bestellt am nächsten Tag garantiert jemand (`S.newPz`).
- Sterne: Für je drei fehlerfreie Pizzen einer Sorte gibt es einen Stern, höchstens drei (`S.pz`). Unter zwei Sternen steht das Rezept in der Aufgabe. Mit drei Sternen gibt es +1 € Trinkgeld.
- Spielstände vor Version 4 behalten alle zwölf alten Zutaten plus die neuen Start-Zutaten.

## Stammgäste und Geschichten

- Jeder der zwölf Stammgäste (`NAMES`) hat in `inhalt/gaeste.js` eigene Sätze: Begrüßung und Plauderei kommen zu etwa zwei Dritteln aus seinem eigenen Vorrat. Ein Satz hat dasselbe Format wie in `dialoge.js`, nur stehen die falschen Antworten gleich mit Übersetzung dabei.
- Falsche Antwort: der Gast reagiert in der Sprechblase, beim ersten Fehler verwirrt, bei schlechter Laune verärgert (`huh`), jeder auf seine Art. Bei der Pizza gibt es eigene Sätze (`HUH_PIZZA`).
- Geschichten (`STORIES`): Ab Tag 3 beginnt die erste. Jeder Teil kommt an einem eigenen Spieltag mit einem Tag Pause, der Gast bringt seine Sätze statt Begrüßung und Plauderei mit („📖 Geschichte“). Weiter geht es erst, wenn der Tag zu Ende gespielt ist. Spielstand: `S.story`, `S.storiesDone`, `S.storyNext`.
- Neue Geschichte: einfach einen Eintrag in `STORIES_RAW` anhängen, `who` muss einer der `NAMES` sein.

## Feilschen am Markt

- Signor Esposito (`CHARS`/`OUTFIT` in `grafik.js`) steht als ganze Figur im Markt. Beim Feilschen zeigt sein Gesicht, wie viel Geduld er noch hat.
- Am Markttag nach Feierabend bietet er drei große Kisten (20 Portionen, doppelter Kistenpreis) an: zuerst Zutaten, die man noch nie hatte, dann was am knappsten ist. Bezahlt wird am Abend.
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

## Stimmen

- Alle Sätze sind mit [Kokoro](https://github.com/hexgrad/kokoro) aufgenommen (Open Source, Apache-2.0, kostenlos): Frauen sprechen mit „Sara“, Männer mit „Nicola“. Wer spricht, kommt aus `CHARS` (`f:1` = Frau).
- Jede Figur klingt etwas anders: `VOICE_RATE` in `audio.js` spielt die Aufnahme etwas langsamer und tiefer (Nonna Pina, Zio Gennaro) oder schneller und heller (Giulia, Sofia).
- Vokabeln, Bücher, Gedichte, die eigenen Antworten und Anrufer sprechen mit Sara.
- Bestellungen, Anrufe, Reservierungen und Preise gibt es in zu vielen Varianten. Dafür gibt es aufgenommene Bausteine („Vorrei due margherite“, „senza basilico“, „con funghi, per favore.“), die `recParts` beim Abspielen aneinandersetzt.
- Fehlt eine Aufnahme (neuer Satz, Webseite ohne Internet), spricht wie früher die Stimme des Geräts.

**Neue Sätze aufnehmen** (nach Änderungen in `inhalt/`), einmalig vorbereiten:

```
python -m venv venv && venv/bin/pip install kokoro-onnx soundfile
```

Dazu `kokoro-v1.0.onnx` und `voices-v1.0.bin` von https://github.com/thewh1teagle/kokoro-onnx/releases in einen Ordner laden. Außerdem braucht es `ffmpeg`. Dann:

```
node tools/stimmen/sammeln.mjs                      # welche Sätze, wer spricht
venv/bin/python tools/stimmen/aufnehmen.py <modell-ordner>   # nimmt nur neue Sätze auf
```

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
