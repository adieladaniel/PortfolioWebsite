/** Warm-ember color grammar: dim rust (early) -> amber (mid) -> hot white-amber (now). */
export const EMBER_STOPS = ['#6b4a35', '#e08a3e', '#fff1de'] as const;

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex(r: number, g: number, b: number): string {
  const c = (v: number) => Math.round(v).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

/** Linear-interpolates through a list of hex color stops. t is clamped to [0, 1]. */
export function lerpColorStops(t: number, stops: readonly string[] = EMBER_STOPS): string {
  const clamped = Math.min(1, Math.max(0, t));
  const segments = stops.length - 1;
  const scaled = clamped * segments;
  const index = Math.min(segments - 1, Math.floor(scaled));
  const localT = scaled - index;

  const [r1, g1, b1] = hexToRgb(stops[index] as string);
  const [r2, g2, b2] = hexToRgb(stops[index + 1] as string);

  return rgbToHex(r1 + (r2 - r1) * localT, g1 + (g2 - g1) * localT, b1 + (b2 - b1) * localT);
}
