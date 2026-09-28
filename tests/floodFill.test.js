import { describe, it, expect } from 'vitest';
import { floodFill } from '../src/utils/floodFill';

describe('floodFill', () => {
  it('füllt nur zusammenhängende Pixel', () => {
    const d = new Uint8ClampedArray(3 * 1 * 4);
    d.set([255, 255, 255, 255, 255, 255, 255, 255, 0, 0, 0, 255]);
    const out = floodFill({ data: d, width: 3, height: 1 }, 0, 0, [255, 0, 0, 255], 0);
    expect([...out.data.slice(0, 8)]).toEqual([255, 0, 0, 255, 255, 0, 0, 255]);
    expect([...out.data.slice(8, 12)]).toEqual([0, 0, 0, 255]);
  });
});
