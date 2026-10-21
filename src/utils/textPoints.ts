/**
 * Samples `count` points from the filled pixels of `text`, returned as xyz
 * triples centered on the origin and scaled so the wider half-extent is 1
 * (y is flipped so +y is up, matching world space). Needs the text's font to
 * be loaded before it's called, otherwise it rasterizes the fallback face.
 */
export function sampleTextPoints(text: string, count: number, fontFamily: string): Float32Array {
  const width = 720;
  const height = 360;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const out = new Float32Array(count * 3);
  if (!ctx) return out;

  ctx.fillStyle = '#fff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `700 300px ${fontFamily}`;
  ctx.fillText(text, width / 2, height / 2 + 12);

  const data = ctx.getImageData(0, 0, width, height).data;
  const filled: number[] = [];
  let minX = width;
  let maxX = 0;
  let minY = height;
  let maxY = 0;
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      if ((data[(y * width + x) * 4 + 3] ?? 0) > 128) {
        filled.push(x, y);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  const pixels = filled.length / 2;
  if (pixels === 0) return out;

  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const half = Math.max(maxX - minX, maxY - minY) / 2;

  for (let i = 0; i < count; i++) {
    const pick = Math.floor(Math.random() * pixels) * 2;
    const px = (filled[pick] ?? cx) + (Math.random() - 0.5) * 2;
    const py = (filled[pick + 1] ?? cy) + (Math.random() - 0.5) * 2;
    out[i * 3] = (px - cx) / half;
    out[i * 3 + 1] = -(py - cy) / half;
    out[i * 3 + 2] = (Math.random() - 0.5) * 0.08;
  }
  return out;
}
