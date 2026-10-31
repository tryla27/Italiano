# Parla Pizza!

Italienisch lernen als Pizzeria-Spiel in Neapel. Du begrüßt Gäste, belegst Pizzen, nimmst Telefon-
bestellungen an und handelst auf dem Markt, alles auf Italienisch. Mit dem verdienten Geld richtest
du dein Restaurant in 3D ein und machst aus deiner kleinen Pizzeria die berühmteste Pizzeria Italiens.

Android-App, gebaut mit [Capacitor](https://capacitorjs.com). Das Spiel selbst ist eine Webseite im
Ordner `www/` und läuft auch in jedem Browser.

## App bekommen

Jeder Push auf `main` baut die App automatisch (GitHub Actions). Die fertige Datei
`ParlaPizza-v1.N.apk` (mit der Versionsnummer im Namen) liegt danach unter **Releases**.

1. Auf dem Handy die neueste Release öffnen und `ParlaPizza-v1.N.apk` herunterladen. Welche Version installiert ist, steht unten in den Einstellungen (Zahnrad).
2. Datei antippen. Android fragt einmal, ob Apps aus dieser Quelle installiert werden dürfen: erlauben.
3. Installieren, fertig.

### iPhone und Browser

Derselbe Push stellt das Spiel auch als Webseite online: **https://tryla27.github.io/Italiano/**
(einmalig nötig: unter *Settings → Pages* als *Source* „GitHub Actions“ wählen).
Auf dem iPhone in Safari öffnen, *Teilen → Zum Home-Bildschirm*, dann startet es wie eine App.
Der Spielstand liegt dann im Browser des Handys.

## Updates

Die App sucht beim Start selbst nach einer neuen Version und zeigt dann auf der Startseite
„Neue Version verfügbar“. Antippen, APK laden, installieren: Android installiert sie über die
alte App drüber, der Spielstand bleibt erhalten. Dafür sorgen:

- `signing/debug.keystore`: immer derselbe Signatur-Schlüssel (nicht löschen!)
- steigende Versionsnummer bei jedem Bau
- Das Repo muss **öffentlich** sein, damit die App die neue Version findet.

## Weiterentwickeln

| Thema | Wo |
|---|---|
| Am Windows-PC starten und ändern | [docs/ANLEITUNG-PC.md](docs/ANLEITUNG-PC.md) |
| Ordner, Dateien, Spielstand, Bau | [docs/AUFBAU.md](docs/AUFBAU.md) |
| Neue Sätze und Wörter | `www/js/inhalt/` (danach die Stimmen aufnehmen, siehe [AUFBAU](docs/AUFBAU.md#stimmen)) |
| Automatischer Test | `node test/spiel-test.mjs` |

## Orte

Die Startseite ist ein kleines Viertel von Neapel in 3D (ein Finger dreht, zwei Finger zoomen).
Gelernt wird in den Häusern: **Scuola** (Vokabeln), **Bar** (Memory), **Biblioteca** (Bücher wie *Pinocchio* in einfachem Italienisch, dazu das Notizbuch) und **Forno** (Rezepte).
Für alle Orte gilt: Gebäude oder Schild antippen, die Ladentür klingelt,
und du bist dort. In der Pizzeria laufen die Gäste mit ganzem Körper herein und stehen neben der Bar.
An Markttagen (mercoledì und sabato) geht es nach Feierabend auf den Markt mit mehreren Ständen; die Woche mit den Markttagen steht auf der Startseite. Als Ausflüge gibt es den **Eisladen** und
den **Hafen** mit eigenen Gesprächen. Capri ist auf der Karte schon zu sehen, aber noch zu.
Am Markt-Stand feilschst du mit Signor Esposito um den Preis. Auf der Startseite gibt es ein Zutaten-Memory.

## Einstellungen im Spiel

Oben rechts in der Kopfzeile jedes Bildschirms:

- **Zahnrad:** Lautstärke für Musik, Geräusche und Vorlese-Stimme, automatisches Vorlesen an/aus
- **Lautsprecher:** alles mit einem Tipp stumm schalten und wieder an

Außerdem:

- **Pause / Zurück-Knopf am Handy:** weiterspielen, später weitermachen oder abbrechen (ohne Belohnung)
- **Spielstand-Code:** in den Einstellungen kopieren und auf einem anderen Gerät einfügen

Männliche Figuren sprechen mit Männerstimme, weibliche mit Frauenstimme, wenn das Handy passende
italienische Stimmen hat. Sonst klingt dieselbe Stimme tiefer bzw. höher.

## Musik

- „Italian Tarantella – Loop“ und „Italian Sweetness – Tarantella Loop“ von Sonican (Pixabay)
- „Tarantella Napoletana“ von PaoloArgento (Pixabay)
