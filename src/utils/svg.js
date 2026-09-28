import DOMPurify from 'dompurify';

const ALLOWED = [
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
];

export function parseSvgText(text) {
  const clean = DOMPurify.sanitize(text, {
    USE_PROFILES: { svg: true, svgFilters: true },
    ALLOWED_TAGS: ALLOWED,
    FORBID_TAGS: ['script', 'foreignObject', 'image', 'use'],
    FORBID_ATTR: ['onload', 'onclick', 'onerror', 'href', 'xlink:href', 'style'],
  });

  const doc = new DOMParser().parseFromString(clean, 'image/svg+xml');
  if (doc.querySelector('parsererror')) throw new Error('Ungültige SVG-Datei');

  const svg = doc.documentElement;
  if (svg.tagName.toLowerCase() !== 'svg') throw new Error('Keine SVG-Datei');

  svg.querySelectorAll('path,rect,circle,ellipse,polygon,polyline').forEach((el, i) => {
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
