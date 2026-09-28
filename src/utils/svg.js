import DOMPurify from 'dompurify';

// Wichtig: 'style' wird bewusst NICHT mehr verboten und <style> ist erlaubt.
// Viele echte, aus Illustrator/Inkscape/Figma exportierte Ausmalbilder legen
// Farbe und Konturfarbe nicht als eigene Attribute (fill="...", stroke="...")
// ab, sondern als Inline-Style (style="fill:#fff;stroke:#000") oder über
// CSS-Klassen in einem <style>-Block. Wurde 'style' komplett entfernt (wie in
// einer früheren Version), gingen dadurch alle Farb- und Linieninformationen
// verloren und übrig blieb ein komplett leeres, weißes Feld.
const ALLOWED_TAGS = [
  'svg',
  'g',
  'path',
  'rect',
  'circle',
  'ellipse',
  'polygon',
  'polyline',
  'line',
  'defs',
  'linearGradient',
  'radialGradient',
  'stop',
  'title',
  'style',
];

const FORBID_TAGS = ['script', 'foreignObject', 'image', 'use'];
const FORBID_ATTR = ['onload', 'onclick', 'onerror', 'href', 'xlink:href'];

const REGION_SELECTOR = 'path,rect,circle,ellipse,polygon,polyline';

// Entfernt ausschließlich "fill:"-Deklarationen aus einem CSS-Text
// (Inline-Style-Attribut ODER Inhalt eines <style>-Blocks), ohne dabei
// "fill-opacity" oder "fill-rule" zu beschädigen. Andere Eigenschaften wie
// stroke, stroke-width, stroke-linecap etc. bleiben unangetastet, damit die
// schwarzen Konturen weiterhin sichtbar sind.
function stripFillDeclarations(cssText) {
  if (!cssText) return cssText;
  return cssText.replace(/\bfill\s*:\s*[^;}"']+;?/gi, '');
}

function normalizeAuthoredStyles(root) {
  // 1) <style>-Block bereinigen (CSS-Klassen-basierte Ausmalbilder)
  root.querySelectorAll('style').forEach((styleTag) => {
    styleTag.textContent = stripFillDeclarations(styleTag.textContent || '');
  });

  // 2) Inline-"style"-Attribute bereinigen
  root.querySelectorAll('[style]').forEach((el) => {
    const cleaned = stripFillDeclarations(el.getAttribute('style') || '').trim();
    if (cleaned) {
      el.setAttribute('style', cleaned);
    } else {
      el.removeAttribute('style');
    }
  });
}

export function parseSvgText(text) {
  const clean = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS,
    FORBID_TAGS,
    FORBID_ATTR,
  });

  const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Ungültige SVG-Datei');

  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') throw new Error('Keine SVG-Datei');

  // Verhindert, dass eine per Style/Klasse gesetzte Füllfarbe unsere
  // spätere fill="#ffffff"-Zuweisung für die Malflächen überstimmt
  // (Inline-Style und CSS-Klassen haben in SVG eine höhere Priorität
  // als das reine Präsentations-Attribut "fill").
  normalizeAuthoredStyles(svg);

  svg.querySelectorAll(REGION_SELECTOR).forEach((el, i) => {
    el.classList.add('coloring-region');
    const id = el.id || `region-${i + 1}`;
    el.dataset.regionId = id;
    el.id = id;
    if (!el.getAttribute('fill') || el.getAttribute('fill') === 'none') {
      el.setAttribute('fill', '#ffffff');
    }
  });

  svg.querySelectorAll('line').forEach((el) => el.setAttribute('pointer-events', 'none'));

  svg.setAttribute(
    'viewBox',
    svg.getAttribute('viewBox') || `0 0 ${svg.getAttribute('width') || 800} ${svg.getAttribute('height') || 800}`
  );
  svg.removeAttribute('width');
  svg.removeAttribute('height');

  return new XMLSerializer().serializeToString(svg);
}

export function exportSvg(svgMarkup, fills) {
  const doc = new DOMParser().parseFromString(svgMarkup, 'image/svg+xml');
  Object.entries(fills).forEach(([id, color]) => {
    const el = doc.querySelector(`[data-region-id="${CSS.escape(id)}"]`);
    if (el) el.setAttribute('fill', color);
  });
  return new XMLSerializer().serializeToString(doc.documentElement);
}
