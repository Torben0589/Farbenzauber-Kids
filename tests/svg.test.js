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
