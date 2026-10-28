# Pizzeria Parola

**Am PC weiterentwickeln:** siehe [ANLEITUNG-PC.md](ANLEITUNG-PC.md)

Italienisch lernen als Pizzeria-Spiel in Neapel. Android-App, gebaut mit Capacitor.

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

## Aufbau

- `www/index.html`: das komplette Spiel
- `www/music/`: Hintergrundmusik (Pixabay, frei nutzbar)
- `assets/`: Quellbilder für App-Icon und Startbild
- `.github/workflows/android.yml`: baut die APK

## Musik

- „Italian Tarantella – Loop“ und „Italian Sweetness – Tarantella Loop“ von Sonican (Pixabay)
- „Tarantella Napoletana“ von PaoloArgento (Pixabay)

## Automatisch testen

`node test/spiel-test.mjs` startet das Spiel in einem unsichtbaren Handy-Browser (Pixel 7),
klickt Startseite, Laden einrichten, Shop, Vokabeln, Notizbuch, Lautstärke und einen Spieltag durch,
speichert Screenshots in `test/screenshots/` und meldet JavaScript-Fehler.
Anderes Handy: `DEVICE="iPhone 13" node test/spiel-test.mjs`.
Braucht Playwright (am PC einmalig: `npm i -D playwright && npx playwright install chromium`).
