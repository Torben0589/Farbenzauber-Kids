# Farbenzauber Kids

Produktionsnahe, mobile-first Ausmal-App mit React, Vite, SVG-Regionen, Canvas-Pinsel, Raster-Flood-Fill, Offline-Speicherung, PWA und GitHub-Pages-Deployment.

## Version 1.0.1 – Fehlerkorrekturen

Diese Version behebt zwei konkrete Probleme aus der vorherigen Fassung:

1. **Upload-Box überlappte die Galerie-Karten.**
   Die Datei `src/components/Gallery.jsx` enthielt zuvor beschädigten Quellcode (HTML-Entities wie `&gt;` statt `>`), der durch einen fehlerhaften Copy-Paste-Vorgang entstanden war. Die Upload-Box lag zudem im selben CSS-Grid wie die Bildkarten, wodurch sie nur die Breite einer Spalte einnahm und optisch unter der ersten Karte "hing". Jetzt ist der Upload-Bereich ein eigenständiger Block außerhalb von `.gallery`, `.modal` ist ein Flex-Container, und `.upload` hat `width: 100%`.
2. **Line-Art überlagerte die Klickflächen doppelt.**
   `src/canvas/ColoringStage.jsx` rendert die Konturen jetzt als separate, garantiert nicht-interaktive Ebene ohne `.coloring-region`-Klassen, damit `document.querySelectorAll('.coloring-region')` nur die tatsächlich färbbaren Flächen zählt.

## Start

```bash
npm install
npm run dev
```

## Qualität

```bash
npm test
npm run build
npm run preview
```

## GitHub Pages

1. Repository anlegen und **den gesamten Ordnerinhalt** hochladen (siehe Hinweis unten zu `.github`).
2. Unter **Settings → Pages → Source** den Eintrag **GitHub Actions** wählen.
3. Auf `main` pushen. Der enthaltene Workflow testet, baut und veröffentlicht die App automatisch.

### Wichtiger Hinweis zum Hochladen von `.github`

Der Ordner `.github/workflows/deploy.yml` beginnt mit einem Punkt. Browser-Uploads über "Add file → Upload files" lassen versteckte Ordner manchmal verschwinden. Am zuverlässigsten funktioniert:

- Das Repository per `git clone` lokal auschecken und die Dateien mit `git add .` / `git commit` / `git push` übertragen, **oder**
- GitHub Desktop verwenden, **oder**
- Die Datei direkt in GitHub über **Add file → Create new file** anlegen und dabei `.github/workflows/deploy.yml` als vollständigen Dateinamen eingeben (GitHub erstellt die Ordner automatisch).

`vite.config.js` verwendet für Produktions-Builds relative Pfade (`base: './'`), damit die App sowohl in einem Projekt-Repository als auch unter einer eigenen Domain funktioniert.

## Eigene Ausmalbilder

- Dateien nach `public/images/coloring/` legen.
- Eintrag in `public/data/image_list.json` ergänzen.
- SVG ist bevorzugt. Färbbare Elemente müssen `path`, `rect`, `circle`, `ellipse`, `polygon` oder `polyline` sein. Beim Upload erhalten diese automatisch `.coloring-region` und eine stabile `data-region-id`.
- Für saubere Konturen sollte die Line-Art im SVG am Ende stehen; die App trennt Konturen und Regionen zur Laufzeit ohnehin automatisch in zwei Ebenen.

## Sicherheit

Uploads werden nach MIME-Typ und Größe (10 MB) geprüft. SVG-Dateien werden mit DOMPurify bereinigt. Skripte, `foreignObject`, externe Bilder/Referenzen, Event-Handler und `style`-Attribute werden verworfen. Alles bleibt lokal im Browser. Es gibt kein Backend und keinen Cloud-Upload.

## Enthalten

- Galerie, Kategorien, Suche, Favoriten
- SVG Tap-to-Fill, Raster-Flood-Fill
- Pinsel, Radierer, Pipette, Verschieben
- Pinch/Scroll-Zoom
- Undo/Redo mit 50 Zuständen
- Autosave in LocalStorage
- SVG- oder PNG-Export
- Dark Mode, responsive Touch-Oberfläche
- PWA/Offline-Cache
- Unit Tests für Flood Fill und SVG-Sanitizing

## Architektur

- `src/canvas`: Zeichenfläche und Pointer-/Touch-Ereignisse
- `src/components`: UI (Toolbar, Palette, Gallery)
- `src/services`: Speicherung und Uploadvalidierung
- `src/utils`: SVG-Parsing und Flood Fill
- `src/store.js`: Zustand Store

## Bewusste Grenzen

- Automatische serverseitige Vektorisierung und Cloud Sync sind nicht enthalten, weil GitHub Pages rein statisch hostet.
- PNG/JPG/WebP werden als Line-Art geladen; für optimale Ergebnisse sollten sie kontrastreiche schwarze Linien auf weißem oder transparentem Hintergrund haben.
- SVG-Export enthält Regionenfarben. Freie Pinselstriche werden beim SVG-Export nicht eingebettet; bei Rasterbildern enthält der PNG-Export Pinsel und Line-Art.
