/** What the scene tells the knife on every scroll update. */
export interface KnifeState {
  /** How far the tools have swung open, 0 (shut) to 1 (fully out). */
  open: number;
  /** Opacity of the captions beside the tools, 0 to 1. */
  labels: number;
  /** The tool picked out (the rest dim), or null for none. */
  focus: string | null;
}

export interface HeroObjectHandle {
  apply: (state: KnifeState) => void;
}

export const clamp01 = (n: number) => Math.min(1, Math.max(0, n));
export const smooth = (t: number) => {
  const c = clamp01(t);
  return c * c * (3 - 2 * c);
};
