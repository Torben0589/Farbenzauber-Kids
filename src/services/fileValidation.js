export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

export function validateFile(file) {
  const ok = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/webp'].includes(file.type);
  if (!ok) throw new Error('Erlaubt sind SVG, PNG, JPG und WebP.');
  if (file.size > MAX_UPLOAD_BYTES) throw new Error('Die Datei ist größer als 10 MB.');
  return true;
}
