export type HeroKind = 'knife' | 'gyro';

/** What the hero shell drives: scroll progress through the pinned scene, 0 (closed) to 1 (open, labelled). */
export interface HeroObjectHandle {
  apply: (progress: number) => void;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};

/**
 * Which object is the hero. The knife is the default; `?object=gyro` shows the
 * gyroscope, so the two can be compared on the real page.
 */
export function pickHeroKind(): HeroKind {
  try {
    const q = new URLSearchParams(window.location.search).get('object');
    if (q === 'gyro' || q === 'knife') return q;
  } catch {
    // no window.location in odd environments: fall through to the default
  }
  return 'knife';
}
