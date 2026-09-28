# Farbenzauber Kids

Produktionsnahe, mobile-first Ausmal-App mit React, Vite, SVG-Regionen, Canvas-Pinsel, Raster-Flood-Fill, Offline-Speicherung, PWA und GitHub-Pages-Deployment.

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

1. Repository anlegen und Dateien hochladen.
2. Unter **Settings > Pages > Source** den Eintrag **GitHub Actions** wählen.
3. Auf `main` pushen. Der enthaltene Workflow testet, baut und veröffentlicht die App.

`vite.config.js` verwendet für Produktions-Builds relative Pfade (`base: './'`). Dadurch funktioniert das Ergebnis sowohl in einem Projekt-Repository als auch unter einer eigenen Domain.

## Eigene Ausmalbilder

- Dateien nach `public/images/coloring/` legen.
- Eintrag in `public/data/image_list.json` ergänzen.
- SVG ist bevorzugt. Färbbare Elemente müssen `path`, `rect`, `circle`, `ellipse`, `polygon` oder `polyline` sein. Beim Upload erhalten diese automatisch `.coloring-region` und eine stabile `data-region-id`.
- Für saubere Konturen sollte die Line-Art im SVG am Ende stehen und `pointer-events="none"` verwenden.

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
- `src/components`: UI
- `src/services`: Speicherung und Uploadvalidierung
- `src/utils`: SVG-Parsing und Flood Fill
- `src/store.js`: Zustand Store

## Bewusste Grenzen

- Automatische serverseitige Vektorisierung und Cloud Sync sind nicht enthalten, weil GitHub Pages rein statisch hostet.
- PNG/JPG/WebP werden als Line-Art geladen; für optimale Ergebnisse sollten sie kontrastreiche schwarze Linien auf weißem oder transparentem Hintergrund haben.
- SVG-Export enthält Regionenfarben. Freie Pinselstriche werden beim SVG-Export nicht eingebettet; bei Rasterbildern enthält der PNG-Export Pinsel und Line-Art.
