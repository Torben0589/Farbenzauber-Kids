# Farbenzauber Kids

Produktionsnahe, mobile-first Ausmal-App mit React, Vite, SVG-Regionen, Canvas-Pinsel, Raster-Flood-Fill, Offline-Speicherung, PWA und GitHub-Pages-Deployment.

## Version 1.0.2 – Fehlerkorrektur: eigene SVG-Uploads waren leer/weiß

### Ursache

Eigene, in Illustrator, Inkscape oder Figma erstellte SVG-Dateien legen Fläche
und Kontur häufig **nicht** als eigene Attribute ab
(`fill="#fff" stroke="#000"`), sondern als **Inline-Style**
(`style="fill:#fff;stroke:#000"`) oder über **CSS-Klassen** in einem
`<style>`-Block. Die vorherige Version hat das `style`-Attribut beim
Bereinigen der Datei komplett entfernt (aus Sicherheitsgründen). Dadurch
gingen sowohl die Füllfarbe als auch die schwarze Kontur vollständig
verloren – sichtbar war nur noch ein leeres, weißes Feld.

### Fix

`src/utils/svg.js` wurde überarbeitet:

- `style`-Attribute und der `<style>`-Tag werden jetzt zugelassen (DOMPurify
  bereinigt den CSS-Inhalt weiterhin automatisch von gefährlichen Mustern wie
  `url(javascript:...)`, `expression()` etc.).
- Aus jedem Inline-Style und jedem `<style>`-Block wird **gezielt nur** die
  `fill:`-Deklaration entfernt (nicht `fill-opacity`, nicht `fill-rule`).
  Das ist notwendig, weil Inline-Style/CSS-Klassen in SVG eine höhere
  Priorität als das reine `fill`-Attribut haben – ohne diesen Schritt hätte
  unsere spätere `fill="#ffffff"`-Zuweisung für die Malfläche keine
  sichtbare Wirkung gehabt.
- `stroke`, `stroke-width`, `stroke-linecap` usw. bleiben unangetastet, damit
  die schwarzen Konturen weiterhin sichtbar sind.

Drei neue automatisierte Tests in `tests/svg.test.js` reproduzieren genau
dieses Szenario (Inline-Style, `fill-opacity`/`fill-rule`-Erhalt,
CSS-Klassen im `<style>`-Block) und schlagen fehl, falls der Fehler erneut
auftritt.

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
- SVG ist bevorzugt. Färbbare Elemente müssen `path`, `rect`, `circle`, `ellipse`, `polygon` oder `polyline` sein. Beim Upload erhalten diese automatisch `.coloring-region` und eine stabile `data-region-id` – unabhängig davon, ob die Originaldatei Attribute, Inline-Styles oder CSS-Klassen verwendet.
- Für saubere Konturen sollte die Line-Art im SVG am Ende stehen; die App trennt Konturen und Regionen zur Laufzeit ohnehin automatisch in zwei Ebenen.

## Sicherheit

Uploads werden nach MIME-Typ und Größe (10 MB) geprüft. SVG-Dateien werden mit DOMPurify bereinigt. Skripte, `foreignObject`, externe Bilder/Referenzen und Event-Handler werden verworfen. `style`-Inhalte werden von DOMPurify auf gefährliche CSS-Muster geprüft und zusätzlich von der App um alle `fill:`-Deklarationen bereinigt. Alles bleibt lokal im Browser. Es gibt kein Backend und keinen Cloud-Upload.

## Enthalten

- Galerie, Kategorien, Suche, Favoriten
- SVG Tap-to-Fill (funktioniert jetzt zuverlässig auch mit Style-/Klassen-basierten SVGs), Raster-Flood-Fill
- Pinsel, Radierer, Pipette, Verschieben
- Pinch/Scroll-Zoom
- Undo/Redo mit 50 Zuständen
- Autosave in LocalStorage
- SVG- oder PNG-Export
- Dark Mode, responsive Touch-Oberfläche
- PWA/Offline-Cache
- Unit Tests für Flood Fill und SVG-Sanitizing (inkl. Regressionstests für den behobenen Upload-Fehler)

## Architektur

- `src/canvas`: Zeichenfläche und Pointer-/Touch-Ereignisse
- `src/components`: UI (Toolbar, Palette, Gallery)
- `src/services`: Speicherung und Uploadvalidierung
- `src/utils`: SVG-Parsing (inkl. Style-Normalisierung) und Flood Fill
- `src/store.js`: Zustand Store

## Bewusste Grenzen

- Automatische serverseitige Vektorisierung und Cloud Sync sind nicht enthalten, weil GitHub Pages rein statisch hostet.
- PNG/JPG/WebP werden als Line-Art geladen; für optimale Ergebnisse sollten sie kontrastreiche schwarze Linien auf weißem oder transparentem Hintergrund haben.
- Sehr komplexe SVGs (z. B. mit verschachtelten `<defs>`-Verweisen, `<use>` oder Filtern) werden aus Sicherheitsgründen weiterhin vereinfacht; für beste Ergebnisse eignen sich einfache, aus einzelnen Pfaden bestehende Ausmalbilder am besten.
- SVG-Export enthält Regionenfarben. Freie Pinselstriche werden beim SVG-Export nicht eingebettet; bei Rasterbildern enthält der PNG-Export Pinsel und Line-Art.
