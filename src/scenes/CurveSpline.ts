import { CatmullRomCurve3, Vector3 } from 'three';
import { timeline } from '@/data/timeline';

/**
 * The literal path the camera travels, built once from the hand-authored
 * milestone anchors in data/timeline.ts. A module-level singleton — the
 * spine is static, so this is computed once at import time, not per-render.
 */
export const spineCurve = new CatmullRomCurve3(
  timeline.map((m) => new Vector3(m.anchor.x, m.anchor.y, m.anchor.z)),
  false,
  'catmullrom',
  // higher tension = tighter path, less overshoot past each anchor. Raised
  // from the default 0.5 after the zigzag amplitude alone still let the
  // curve swing/spiral more than intended between anchors.
  0.8,
);
