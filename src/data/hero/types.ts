/** Shapes of the generated sprite geometry (see scripts/hero-sprites). All positions are in source pixels. */

export interface KnifeTool {
  name: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** The hinge pin, relative to the sprite's own top-left. */
  pinX: number;
  pinY: number;
  /** The tool tip when open, in the sheet's pixel space. */
  tipX: number;
  tipY: number;
  /** Degrees (clockwise) the tool turns from open to folded shut. */
  delta: number;
  length: number;
}

export interface KnifeGeometry {
  size: { w: number; h: number };
  body: { x: number; y: number; w: number; h: number };
  pins: { L: [number, number]; R: [number, number] };
  tools: Record<string, KnifeTool>;
  /** Bottom to top. */
  drawOrder: string[];
  /** The order the tools swing open in. */
  openOrder: string[];
}

export interface HeroLabel {
  name: string;
  /** Short caption beside the tool. */
  note: string;
  /** The project that proves it, and what it did. */
  project: string;
  proof: string;
}
