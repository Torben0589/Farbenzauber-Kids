import { describe, it, expect } from 'vitest';
import { parseSvgText } from '../src/utils/svg';

describe('SVG-Sicherheit', () => {
  it('entfernt Skripte und mappt Regionen', () => {
    const out = parseSvgText(
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><path d="M0 0h1v1z"/></svg>'
    );
    expect(out).not.toContain('<script');
    expect(out).toContain('coloring-region');
    expect(out).toContain('data-region-id');
  });
});

describe('Upload-Regression: reale Export-SVGs mit Inline-Style', () => {
  // Reproduziert den gemeldeten Fehler: hochgeladene SVGs aus Illustrator /
  // Inkscape / Figma legen Farbe und Kontur oft NICHT als eigene Attribute
  // (fill="...", stroke="...") ab, sondern als style="fill:...;stroke:...".
  // Wurde 'style' früher komplett entfernt, verschwanden Fläche UND Kontur
  // vollständig -> leeres weißes Feld.

  it('behält die Kontur (stroke) bei Inline-Style und macht die Fläche weiß füllbar', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<path id="body" style="fill:#212121;stroke:#000000;stroke-width:3" d="M10 10h80v80h-80z"/>' +
      '</svg>';

    const out = parseSvgText(svg);

    // Die Fläche muss für die Malebene weiß sein, NICHT die ursprüngliche
    // Exportfarbe (#212121) behalten - sonst kann das Kind sie nicht "leer"
    // vorfinden.
    expect(out).toMatch(/fill="#ffffff"/i);

    // Die Kontur (stroke) darf NICHT verloren gehen, sonst ist das Bild leer.
    expect(out).toMatch(/stroke:#000000|stroke="#000000"/i);

    // Es darf keine style-Deklaration mehr geben, die "fill:" enthält,
    // weil eine verbleibende Inline-Fill-Deklaration das Attribut fill
    // wieder überschreiben würde (Inline-Style hat Vorrang vor Attributen).
    const styleMatch = out.match(/style="([^"]*)"/i);
    if (styleMatch) {
      expect(styleMatch[1]).not.toMatch(/\bfill\s*:/i);
    }

    expect(out).toContain('coloring-region');
    expect(out).toContain('data-region-id="body"');
  });

  it('entfernt nur "fill", nicht "fill-opacity" oder "fill-rule"', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<path id="p" style="fill:#ff0000;fill-opacity:0.5;fill-rule:evenodd;stroke:#111" d="M0 0h10v10h-10z"/>' +
      '</svg>';

    const out = parseSvgText(svg);
    const styleMatch = out.match(/style="([^"]*)"/i);

    expect(styleMatch).not.toBeNull();
    expect(styleMatch[1]).not.toMatch(/(^|;)\s*fill\s*:/i);
    expect(styleMatch[1]).toMatch(/fill-opacity\s*:\s*0\.5/i);
    expect(styleMatch[1]).toMatch(/fill-rule\s*:\s*evenodd/i);
    expect(styleMatch[1]).toMatch(/stroke\s*:\s*#111/i);
  });

  it('bereinigt CSS-Klassen in einem <style>-Block, behält aber stroke', () => {
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
      '<style>.cls-1{fill:#e2231a;stroke:#000;stroke-width:2}</style>' +
      '<path class="cls-1" id="shape" d="M0 0h10v10h-10z"/>' +
      '</svg>';

    const out = parseSvgText(svg);

    expect(out).toMatch(/fill="#ffffff"/i);
    expect(out).toMatch(/stroke:\s*#000/i);
    expect(out).not.toMatch(/fill\s*:\s*#e2231a/i);
    expect(out).toContain('coloring-region');
  });
});
