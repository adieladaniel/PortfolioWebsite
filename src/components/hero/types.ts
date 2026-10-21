/** What the hero shell drives: scroll progress through the pinned scene, 0 (closed) to 1 (open, labelled). */
export interface HeroObjectHandle {
  apply: (progress: number) => void;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
