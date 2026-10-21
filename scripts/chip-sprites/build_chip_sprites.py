"""
Cuts the exploded AI-chip render into one transparent sprite per layer.

    python scripts/chip-sprites/build_chip_sprites.py path/to/exploded.jpg

Writes public/chip/layer-NN.webp and src/data/chipLayers.ts.

How it works: in the render each layer is a thin slab seen from above, so
layers overlap on screen but each one's *bottom edge* is a clean V shape. The
table below gives that V (left tip, front corner, right tip) for every layer,
for a 1376x768 render. A pixel belongs to the top-most layer whose bottom edge
is below it, which splits the picture into stacked bands, one per layer. The
background is found by flood fill from the border, tiny stray fragments are
handed to the neighbouring layer, and each band becomes a sprite that overlaps
its neighbours by two pixels so no seam shows.

A render of another size works if the layers are in the same places in the
frame; coordinates are scaled by width / 1376. If a new render moves things,
adjust LAYERS (and REF, ANCHORS) by looking at the band overlay (--overlay).
"""
import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

BASE_W = 1376
CROP = (430, 20, 950, 745)  # x0, y0, x1, y1 in the 1376x768 render

# name, label, note, bottom-edge V polyline (x, y)
LAYERS = [
    ("heatsink", "Heatsink", "Sheds the heat", [(440, 136), (449, 136), (692, 196), (930, 138), (936, 138)]),
    ("copper_base", "Heat-pipe base", "Spreads it sideways", [(460, 192), (464, 192), (700, 248), (911, 197), (915, 197)]),
    ("hex_plate", "Vapor chamber", "Moves heat in a thin sheet", [(460, 234), (464, 234), (690, 286), (911, 233), (915, 233)]),
    ("silver_sheet", "Thermal sheet", "Fills microscopic gaps", [(474, 273), (478, 273), (690, 325), (897, 272), (901, 272)]),
    ("copper_lid", "Copper lid", "Protects the die", [(464, 323), (468, 323), (690, 378), (908, 329), (912, 329)]),
    ("die_group", "Die and memory", "Where the math happens", [(463, 400), (557, 399), (630, 413), (750, 413), (823, 399), (912, 400)]),
    ("interposer", "Interposer", "Wires die to memory", [(469, 426), (473, 426), (690, 489), (902, 425), (906, 425)]),
    ("substrate", "Substrate", "Routes signals out", [(447, 465), (451, 465), (690, 528), (924, 466), (928, 466)]),
    ("cap_frame", "Capacitors", "Smooth the power", [(454, 519), (458, 519), (690, 581), (917, 519), (921, 519)]),
    ("ball_grid", "Solder balls", "Hundreds of connections", [(466, 558), (470, 558), (690, 613), (905, 558), (909, 558)]),
    ("pcb", "Circuit board", "Power and I/O", [(447, 594), (451, 594), (690, 652), (925, 596), (929, 596)]),
    ("backplate", "Backplate", "Holds it together", None),  # takes everything below the board
]
# left-tip top y and slab thickness, per layer: used to stack the layers pressed together
REF = [(85, 51), (177, 15), (229, 5), (270, 3), (309, 14), (360, 40), (420, 6), (459, 6), (505, 14), (546, 12), (586, 8), (634, 14)]
# where each layer's right edge is, for the label leader lines
ANCHORS = [(930, 110), (911, 190), (911, 230), (897, 271), (908, 322), (907, 370), (902, 423), (924, 462), (917, 512), (905, 552), (925, 592), (921, 641)]
BG = np.array([15, 14, 10], float)  # BGR of the render's near-black background


def foreground(img):
    dist = np.abs(img.astype(float) - BG).max(axis=2)
    low = (dist <= 11).astype(np.uint8)
    _, lab, _, _ = cv2.connectedComponentsWithStats(low, 4)
    border = set(lab[0, :]) | set(lab[-1, :]) | set(lab[:, 0]) | set(lab[:, -1])
    fg = (~np.isin(lab, list(border))).astype(np.uint8)
    fg = cv2.morphologyEx(fg, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    _, lab2, st2, _ = cv2.connectedComponentsWithStats(fg, 8)
    fg = (lab2 == 1 + np.argmax(st2[1:, 4])).astype(np.uint8)
    _, lab3, _, _ = cv2.connectedComponentsWithStats(1 - fg, 4)
    border3 = set(lab3[0, :]) | set(lab3[-1, :]) | set(lab3[:, 0]) | set(lab3[:, -1])
    return (~np.isin(lab3, list(border3))).astype(np.uint8), dist


def bands(fg, shape, s):
    h, w = shape
    xs = np.arange(w)
    yy = np.arange(h)[:, None]
    lab = np.full((h, w), len(LAYERS) - 1, np.int32)
    taken = np.zeros((h, w), bool)
    for i, (_, _, _, poly) in enumerate(LAYERS[:-1]):
        px = [p[0] * s for p in poly]
        py = [p[1] * s for p in poly]
        v = np.interp(xs, px, py, left=np.nan, right=np.nan)
        cond = (yy <= np.nan_to_num(v, nan=-1)[None, :]) & (~np.isnan(v))[None, :] & (~taken)
        lab[cond] = i
        taken |= cond
    lab[fg == 0] = -1
    # hand tiny stray fragments to the neighbouring layer
    for i in range(len(LAYERS)):
        cnt, cl, st, _ = cv2.connectedComponentsWithStats((lab == i).astype(np.uint8), 8)
        for c in range(1, cnt):
            if st[c, 4] < 400 * s * s and cnt > 2:
                comp = cl == c
                ring = cv2.dilate(comp.astype(np.uint8), np.ones((7, 7), np.uint8)) > 0
                near = lab[ring & ~comp]
                near = near[(near >= 0) & (near != i)]
                if len(near):
                    lab[comp] = np.bincount(near).argmax()
    return lab


TS_HEADER = """/**
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
"""


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--out", default="public/chip")
    ap.add_argument("--data", default="src/data/chipLayers.ts")
    ap.add_argument("--overlay", help="optional PNG path showing the layer bands, to check them by eye")
    a = ap.parse_args()

    img = cv2.imread(a.image)
    h, w = img.shape[:2]
    s = w / BASE_W
    fg, dist = foreground(img)
    lab = bands(fg, (h, w), s)
    x0, y0, x1, y1 = [int(round(v * s)) for v in CROP]

    if a.overlay:
        rng = np.random.RandomState(11)
        over = img.copy()
        for i in range(len(LAYERS)):
            m = lab == i
            over[m] = (0.5 * over[m] + 0.5 * rng.randint(60, 255, 3)).astype(np.uint8)
        cv2.imwrite(a.overlay, over[y0:y1, x0:x1])

    soft = np.clip((dist - 4) / 14, 0, 1)
    fgd = cv2.dilate(fg, np.ones((3, 3), np.uint8))
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)
    out_dir = Path(a.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    sprites = []
    for i in range(len(LAYERS)):
        m = (lab == i).astype(np.uint8)
        md = cv2.dilate(m, np.ones((5, 5), np.uint8)) * fgd
        alpha = np.where(md > 0, soft, 0.0)
        alpha = np.clip(np.where(m > 0, np.maximum(alpha, 1.0 * (fg > 0)), alpha), 0, 1)
        ys, xs = np.where(alpha > 0.02)
        sx0, sx1, sy0, sy1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        rgba = np.dstack([rgb, (alpha * 255).astype(np.uint8)])[sy0:sy1, sx0:sx1]
        Image.fromarray(rgba, "RGBA").save(out_dir / f"layer-{i:02d}.webp", "WEBP", quality=90, method=6)
        sprites.append((int(sx0), int(sy0), int(sx1 - sx0), int(sy1 - sy0)))

    # stack the layers pressed together, working up from the backplate
    collapse = [0] * len(LAYERS)
    cur = REF[-1][0] * s
    for i in range(len(LAYERS) - 2, -1, -1):
        cur -= REF[i][1] * s
        collapse[i] = int(round(cur - REF[i][0] * s))

    rows = []
    for i, (_, label, note, _) in enumerate(LAYERS):
        sx, sy, sw, sh = sprites[i]
        ax, ay = ANCHORS[i]
        rows.append(
            f"  {{ file: 'layer-{i:02d}.webp', name: {json.dumps(label)}, note: {json.dumps(note)}, "
            f"x: {sx - x0}, y: {sy - y0}, w: {sw}, h: {sh}, collapse: {collapse[i]}, "
            f"anchorX: {int(round(ax * s)) - x0}, anchorY: {int(round(ay * s)) - y0} }},"
        )
    body = "\n".join(rows)
    ts = f"{TS_HEADER}\nexport const CHIP_SIZE = {{ w: {x1 - x0}, h: {y1 - y0} }};\n\nexport const chipLayers: ChipLayer[] = [\n{body}\n];\n"
    Path(a.data).write_text(ts, encoding="utf-8")
    print(f"wrote {len(LAYERS)} sprites to {out_dir} and {a.data}")


if __name__ == "__main__":
    main()
