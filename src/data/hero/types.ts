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

export interface GyroRing {
  name: string;
  file: string;
  /** Half the sprite's side: it is a square centred on the gyroscope's centre. */
  half: number;
  inner: number;
  outer: number;
}

export interface GyroGeometry {
  size: { w: number; h: number };
  centre: { x: number; y: number };
  /** Outer to inner. */
  rings: GyroRing[];
}

export interface HeroLabel {
  name: string;
  note: string;
}
