# Farbenzauber Kids 1.1.0

Korrigierte GitHub-Pages-Version der Kinder-Ausmal-App.

## Korrektur der Galerie

Die Upload-Fläche ist jetzt ein eigener Block **außerhalb** des Galerie-Grids. Die bisherigen generischen Klassen `.gallery`, `.card` und `.upload` wurden durch eindeutige Klassen ersetzt:

- `.gallery-grid`
- `.gallery-card`
- `.upload-section`
- `.upload-box`

`width: 100%`, `display: block`, `clear: both`, `box-sizing: border-box` und eine getrennte DOM-Struktur verhindern, dass Upload-Feld, Upload-Text oder Karten einander überlagern. Auf schmalen Displays wechselt die Galerie auf eine Spalte.

## Start

```bash
npm install
npm run dev
```

## Tests und Build

```bash
npm test
npm run build
```

## Aktualisierung des bestehenden GitHub-Repositorys

1. ZIP entpacken.
2. Den kompletten Inhalt des bisherigen Repositorys durch den Inhalt dieses Ordners ersetzen.
3. Commit und Push auf `main` ausführen.

> Hinweis: Der Workflow verwendet `npm install`, damit das Projekt auch ohne mitgelieferte `package-lock.json` direkt gebaut werden kann.
4. Der vorhandene GitHub-Actions-Workflow veröffentlicht die korrigierte Version.
5. Nach dem Deployment die Seite mit Strg+F5 neu laden, damit alter CSS-/PWA-Cache verworfen wird.
