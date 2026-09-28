export function floodFill(imageData, startX, startY, fill, tolerance = 32) {
  const { data, width, height } = imageData;
  const x = Math.floor(startX);
  const y = Math.floor(startY);
  if (x < 0 || y < 0 || x >= width || y >= height) return imageData;

  const start = (y * width + x) * 4;
  const target = [data[start], data[start + 1], data[start + 2], data[start + 3]];
  if (close(target, fill, 0)) return imageData;

  const stack = [[x, y]];
  const seen = new Uint8Array(width * height);

  while (stack.length) {
    const [cx, cy] = stack.pop();
    const p = cy * width + cx;
    if (seen[p]) continue;
    seen[p] = 1;

    const i = p * 4;
    const c = [data[i], data[i + 1], data[i + 2], data[i + 3]];
    if (!close(c, target, tolerance)) continue;

    data[i] = fill[0];
    data[i + 1] = fill[1];
    data[i + 2] = fill[2];
    data[i + 3] = fill[3] ?? 255;

    if (cx > 0) stack.push([cx - 1, cy]);
    if (cx < width - 1) stack.push([cx + 1, cy]);
    if (cy > 0) stack.push([cx, cy - 1]);
    if (cy < height - 1) stack.push([cx, cy + 1]);
  }

  return imageData;
}

const close = (a, b, t) =>
  Math.abs(a[0] - b[0]) <= t &&
  Math.abs(a[1] - b[1]) <= t &&
  Math.abs(a[2] - b[2]) <= t &&
  Math.abs(a[3] - b[3]) <= t;

export function hexToRgba(hex) {
  const x = hex.replace('#', '');
  return [parseInt(x.slice(0, 2), 16), parseInt(x.slice(2, 4), 16), parseInt(x.slice(4, 6), 16), 255];
}
