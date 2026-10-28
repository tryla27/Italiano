# Pizzeria Parola am PC weiterentwickeln

Diese Anleitung ist für Windows. Du brauchst nur zwei Programme, beide kostenlos.

## 1. Einmalig installieren

| Programm | Wofür | Download |
|---|---|---|
| **Node.js** (LTS-Version) | Spiel lokal starten, App-Teile bauen | https://nodejs.org |
| **Git** | Änderungen zu GitHub hochladen (dann baut GitHub die App) | https://git-scm.com |

Empfohlen als Editor: **Visual Studio Code** (https://code.visualstudio.com).
Du kannst aber jeden Editor nehmen, mit dem du arbeitest.

## 2. Projekt auf den PC holen

**Variante A (empfohlen, mit Git):** Eingabeaufforderung oder PowerShell öffnen und eingeben:

```
cd %USERPROFILE%\Documents
git clone https://github.com/tryla27/Italiano.git
cd Italiano
```

**Variante B (ohne Git):** Die ZIP-Datei `PizzeriaParola-Export.zip` entpacken, zum Beispiel nach
`Dokumente\Italiano`. Zum Hochladen auf GitHub brauchst du später trotzdem Git (siehe Punkt 5).

## 3. Spiel am PC starten und richtig anzeigen

Doppelklick auf **`Spiel-starten.bat`** im Projektordner.
Das startet einen kleinen lokalen Server und öffnet das Spiel im Browser unter
`http://localhost:5173`.

Wichtig: Öffne `index.html` **nicht** per Doppelklick direkt aus dem Ordner. Dann laufen Musik,
Speichern und manche Browser-Funktionen nicht richtig. Immer über `Spiel-starten.bat`.

**So siehst du es wie auf dem Handy:**
1. Im Chrome, Edge oder Brave **F12** drücken.
2. Oben links auf das **Handy-Symbol** klicken (oder `Strg + Umschalt + M`).
3. Oben ein Handy auswählen, zum Beispiel „Pixel 7“ oder „Samsung Galaxy S20“.

Nach einer Änderung an der Datei einfach **F5** drücken, dann ist sie sichtbar.

Hinweis: Der Spielstand am PC ist getrennt vom Spielstand auf dem Handy.

## 4. Wo ist was?

```
Italiano/
├── www/index.html          ← DAS GANZE SPIEL (Aussehen, Texte, Logik)
├── www/music/              ← die 3 Hintergrund-Lieder (MP3)
├── assets/                 ← App-Icon und Startbild (PNG)
├── signing/debug.keystore  ← App-Schlüssel. NIEMALS löschen oder ersetzen!
├── .github/workflows/      ← Bauplan, mit dem GitHub die Android-App baut
├── capacitor.config.json   ← App-Name und App-ID
├── package.json            ← benötigte Pakete
└── Spiel-starten.bat       ← Spiel am PC starten
```

In `www/index.html` findest du die Bereiche über diese Überschriften
(in VS Code mit `Strg + F` suchen):

| Suchbegriff | Was dort steht |
|---|---|
| `/* Layout:` | Farben und Schriften (ganz oben im `<style>`) |
| `---------- Content` | Alle Sätze der Gäste, Pizzen, Preise, Stufen, Einkaufsliste |
| `const DICT=` | Wörterbuch für das Antippen von Wörtern |
| `---------- Save state` | Speichern des Spielstands |
| `---------- Music` | Musik und Geräusche |
| `---------- Drawing` | Gesichter der Gäste (`const CHARS=`) und die Pizza-Grafik |
| `---------- Game flow` | Ablauf eines Spieltags, Trinkgeld, Rechnung |
| `---------- Laden einrichten` | Einrichten per Drag-and-drop, Gegenstände (`ROOM_ITEMS`) |
| `---------- Vokabeln` | Vokabeltrainer nach Tagen |
| `---------- Render` | Die einzelnen Bildschirme |

**Neuen Gast-Satz hinzufügen:** In `GREET`, `TALK`, `PROB`, `DRINK` usw. eine Zeile nach diesem Muster:

```
["Italienischer Satz","Deutsche Übersetzung","Richtige Antwort","Antwort auf Deutsch",["Falsch 1","Falsch 2","Falsch 3"],"Tipp-Text"],
```

Neue italienische Wörter auch in `DICT` eintragen, damit das Antippen funktioniert.

## 5. Neue App-Version machen

Wenn du mit einer Änderung zufrieden bist:

```
git add -A
git commit -m "Was ich geändert habe"
git push
```

GitHub baut die App dann automatisch (ca. 5 Minuten). Fortschritt siehst du unter
https://github.com/tryla27/Italiano/actions

Danach zeigt die App auf dem Handy „Neue Version verfügbar“. Über die alte App drüber
installieren, nichts löschen, der Spielstand bleibt.

Beim ersten `git push` fragt Windows nach deinem GitHub-Login. Das ist normal.

## 6. Optional: Android-App selbst am PC bauen und im Emulator testen

Nur nötig, wenn du nicht auf GitHub warten willst.

1. **Android Studio** installieren: https://developer.android.com/studio
2. Im Projektordner:
   ```
   npm install
   npx cap add android
   npx cap sync android
   npx cap open android
   ```
3. In Android Studio oben auf den grünen **Play-Knopf** klicken. Das startet einen Handy-Emulator.

Wichtig: Eine so gebaute App hat einen **anderen Schlüssel** als die GitHub-Version.
Installiere sie nur im Emulator, nicht auf deinem echten Handy, sonst musst du dort wieder
löschen und der Spielstand ist weg. Für dein Handy immer die Version von GitHub nehmen.

## 7. Wenn etwas nicht geht

| Problem | Lösung |
|---|---|
| `Spiel-starten.bat` schließt sich sofort | Node.js ist nicht installiert oder der PC wurde danach nicht neu gestartet |
| `git` wird nicht erkannt | Git installieren, Eingabeaufforderung neu öffnen |
| GitHub-Bau ist rot (fehlgeschlagen) | Auf den roten Eintrag unter „Actions“ klicken, der rote Schritt zeigt den Fehler |
| Spiel zeigt nur schwarzen Bildschirm | F12 drücken, Reiter „Console“, die rote Meldung zeigt den Fehler in `index.html` |

## Musik-Rechte

„Italian Tarantella – Loop“ und „Italian Sweetness – Tarantella Loop“ von Sonican,
„Tarantella Napoletana“ von PaoloArgento, alle von Pixabay (frei nutzbar).
