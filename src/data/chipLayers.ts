/**
 * The twelve layers of the AI accelerator module, cut out of the exploded
 * render (see scripts/chip-sprites). Coordinates are in the cropped render's
 * pixel space (CHIP_SIZE), so the scene scales by one factor. `collapse` is how
 * far (px, down) a layer travels to sit pressed on the layer below, and
 * `anchor*` is where its right edge is, for the label leader lines.
 * Listed top to bottom; draw order is the reverse.
 */
export interface ChipLayer {
  file: string;
  name: string;
  note: string;
  x: number;
  y: number;
  w: number;
  h: number;
  collapse: number;
  anchorX: number;
  anchorY: number;
}

export const CHIP_SIZE = { w: 520, h: 725 };

export const chipLayers: ChipLayer[] = [
  { file: 'layer-00.webp', name: "Heatsink", note: "Sheds the heat", x: 14, y: 12, w: 488, h: 167, collapse: 375, anchorX: 500, anchorY: 90 },
  { file: 'layer-01.webp', name: "Heat-pipe base", note: "Spreads it sideways", x: 33, y: 131, w: 450, h: 100, collapse: 334, anchorX: 481, anchorY: 170 },
  { file: 'layer-02.webp', name: "Vapor chamber", note: "Moves heat in a thin sheet", x: 33, y: 171, w: 450, h: 98, collapse: 297, anchorX: 481, anchorY: 210 },
  { file: 'layer-03.webp', name: "Thermal sheet", note: "Fills microscopic gaps", x: 47, y: 215, w: 423, h: 93, collapse: 261, anchorX: 467, anchorY: 251 },
  { file: 'layer-04.webp', name: "Copper lid", note: "Protects the die", x: 37, y: 256, w: 442, h: 105, collapse: 225, anchorX: 478, anchorY: 302 },
  { file: 'layer-05.webp', name: "Die and memory", note: "Where the math happens", x: 37, y: 325, w: 442, h: 71, collapse: 188, anchorX: 477, anchorY: 350 },
  { file: 'layer-06.webp', name: "Interposer", note: "Wires die to memory", x: 42, y: 378, w: 432, h: 94, collapse: 168, anchorX: 472, anchorY: 403 },
  { file: 'layer-07.webp', name: "Substrate", note: "Routes signals out", x: 20, y: 413, w: 476, h: 98, collapse: 135, anchorX: 494, anchorY: 442 },
  { file: 'layer-08.webp', name: "Capacitors", note: "Smooth the power", x: 27, y: 450, w: 462, h: 114, collapse: 95, anchorX: 487, anchorY: 492 },
  { file: 'layer-09.webp', name: "Solder balls", note: "Hundreds of connections", x: 39, y: 510, w: 438, h: 86, collapse: 68, anchorX: 475, anchorY: 532 },
  { file: 'layer-10.webp', name: "Circuit board", note: "Power and I/O", x: 20, y: 543, w: 477, h: 92, collapse: 40, anchorX: 495, anchorY: 572 },
  { file: 'layer-11.webp', name: "Backplate", note: "Holds it together", x: 23, y: 579, w: 470, h: 131, collapse: 0, anchorX: 491, anchorY: 621 },
];
