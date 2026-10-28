# Pizzeria Parola

Italienisch lernen als Pizzeria-Spiel in Neapel. Du begrüßt Gäste, belegst Pizzen, nimmst Telefon-
bestellungen an und handelst auf dem Markt, alles auf Italienisch. Mit dem verdienten Geld richtest
du deinen Laden ein und steigst vom Imbissstand bis zur berühmtesten Pizzeria Italiens auf.

Android-App, gebaut mit [Capacitor](https://capacitorjs.com). Das Spiel selbst ist eine Webseite im
Ordner `www/` und läuft auch in jedem Browser.

## App bekommen

Jeder Push auf `main` baut die App automatisch (GitHub Actions). Die fertige Datei
`PizzeriaParola.apk` liegt danach unter **Releases**.

1. Auf dem Handy die neueste Release öffnen und `PizzeriaParola.apk` herunterladen.
2. Datei antippen. Android fragt einmal, ob Apps aus dieser Quelle installiert werden dürfen: erlauben.
3. Installieren, fertig.

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
| Neue Sätze und Wörter | `www/js/inhalt/` |
| Automatischer Test | `node test/spiel-test.mjs` |

## Orte

Die Pizzeria siehst du von hinter dem Tresen, neue Gäste kommen durch die Tür herein. Nach Feierabend
geht es auf den Markt mit mehreren Ständen. Als Ausflüge gibt es den **Eisladen** und den **Hafen**
mit eigenen Gesprächen.

## Einstellungen im Spiel

Oben links auf jedem Bildschirm:

- **Zahnrad:** Lautstärke für Musik, Geräusche und Vorlese-Stimme, automatisches Vorlesen an/aus
- **Lautsprecher:** alles mit einem Tipp stumm schalten und wieder an

Männliche Figuren sprechen mit Männerstimme, weibliche mit Frauenstimme, wenn das Handy passende
italienische Stimmen hat. Sonst klingt dieselbe Stimme tiefer bzw. höher.

## Musik

- „Italian Tarantella – Loop“ und „Italian Sweetness – Tarantella Loop“ von Sonican (Pixabay)
- „Tarantella Napoletana“ von PaoloArgento (Pixabay)
