"""
Cuts the multi-tool knife render into one transparent sprite per tool, plus the body.

    python scripts/hero-sprites/build_knife_sprites.py path/to/knife.jpg

Writes public/hero/knife/*.webp and src/data/hero/knifeGeometry.ts.

The render is a top-down flat lay with every tool open. Each tool hinges on a pin at
either end of the body, so in the page a tool is one sprite that rotates about its pin.
Tools are split with a seeded watershed (Canny edges act as barriers), the body is a
hand-drawn pill, and the root of each tool is extended back to its pin so nothing
pokes out when it folds shut.

Coordinates below are for a 1376x768 render and are scaled by width / 1376, so a 2K
render of the same picture works unchanged. If a new render moves the tools, adjust
SEEDS, PINS and BODY by looking at --overlay.
"""
import argparse
import json
import math
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

BASE_W = 1376

# name -> points along the centre line of each tool (1376x768 space)
SEEDS = {
    "L_blade": [(230, 225), (385, 312)],
    "L_saw": [(200, 372), (385, 389)],
    "L_driver": [(235, 488), (385, 428)],
    "L_opener": [(358, 572), (445, 485)],
    "R_serrated": [(1150, 215), (955, 322)],
    "R_file": [(1262, 340), (990, 362)],
    "R_awl": [(1180, 490), (985, 413)],
    "R_small": [(1070, 570), (968, 468)],
}
BODY_SEEDS = [(690, 385), (600, 370), (790, 400), (481, 383), (909, 383), (560, 360), (820, 360)]
PINS = {"L": (481, 383), "R": (909, 383)}
BODY = (437, 329, 950, 442)  # x0, y0, x1, y1 of the pill
CAP = 46                     # radius of the rounded ends
# tools, drawn bottom to top, and the order they swing open
DRAW_ORDER = ["L_opener", "L_driver", "L_saw", "L_blade", "R_small", "R_awl", "R_file", "R_serrated"]
OPEN_ORDER = ["L_blade", "R_serrated", "L_saw", "R_file", "L_driver", "R_awl", "L_opener", "R_small"]


def line(a, b, k):
    return [(int(a[0] + (b[0] - a[0]) * t / k), int(a[1] + (b[1] - a[1]) * t / k)) for t in range(k + 1)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("image")
    ap.add_argument("--out", default="public/hero/knife")
    ap.add_argument("--data", default="src/data/hero/knifeGeometry.ts")
    ap.add_argument("--overlay", help="optional PNG showing the tool regions, to check them by eye")
    a = ap.parse_args()

    img = cv2.imread(a.image)
    H, W = img.shape[:2]
    s = W / BASE_W
    k = lambda n: max(1, int(round(n * s)))  # noqa: E731  pixel sizes scale with the render
    sc = lambda p: (int(round(p[0] * s)), int(round(p[1] * s)))  # noqa: E731

    bgc = np.median(img[k(5):k(60), k(5):k(60)].reshape(-1, 3), axis=0)
    dist = np.abs(img.astype(float) - bgc).max(axis=2)
    fg = (dist > 20).astype(np.uint8)
    fg[int(640 * s):, int(1200 * s):] = 0  # corner watermark
    fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, np.ones((k(5), k(5)), np.uint8))
    _, lab, st, _ = cv2.connectedComponentsWithStats(fg, 8)
    fg = (lab == 1 + np.argmax(st[1:, 4])).astype(np.uint8)

    names = list(SEEDS) + ["body"]
    nb = len(names) + 1
    markers = np.zeros((H, W), np.int32)
    markers[fg == 0] = nb
    er = cv2.erode(fg, np.ones((k(5), k(5)), np.uint8))
    markers[(fg == 1) & (er == 0)] = 0
    for i, nm in enumerate(names, 1):
        pts = BODY_SEEDS if nm == "body" else line(SEEDS[nm][0], SEEDS[nm][1], 8 if nm != "R_file" else 30)
        for p in pts:
            cv2.circle(markers, sc(p), k(3), i, -1)

    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    edges = cv2.Canny(cv2.GaussianBlur(gray, (3, 3), 0), 30, 90)
    wsimg = cv2.GaussianBlur(img, (3, 3), 0).copy()
    wsimg[edges > 0] = (255, 255, 255)
    ws = cv2.watershed(wsimg, markers.copy())
    ws[fg == 0] = nb
    # boundary pixels the watershed left unlabelled join the nearest tool
    unl = (ws == -1) & (fg > 0)
    if unl.any():
        lab_img = np.where((ws > 0) & (ws < nb), ws, 0).astype(np.uint8)
        _, idx = cv2.distanceTransformWithLabels((lab_img == 0).astype(np.uint8), cv2.DIST_L2, 3, labelType=cv2.DIST_LABEL_PIXEL)
        zy, zx = np.where(lab_img > 0)
        lut = np.zeros(len(zy) + 2, np.uint8)
        lut[1:len(zy) + 1] = lab_img[zy, zx]
        ws = np.where(unl, lut[idx], ws)

    # the body: a pill between the two pins
    bx0, by0, bx1, by1 = [int(round(v * s)) for v in BODY]
    cap = int(round(CAP * s))
    body = np.zeros((H, W), np.uint8)
    cv2.rectangle(body, (bx0 + cap, by0), (bx1 - cap, by1), 1, -1)
    cyb = (by0 + by1) // 2
    cv2.ellipse(body, (bx0 + cap, cyb), (cap, (by1 - by0) // 2), 0, 0, 360, 1, -1)
    cv2.ellipse(body, (bx1 - cap, cyb), (cap, (by1 - by0) // 2), 0, 0, 360, 1, -1)
    soft = np.clip((dist - 5) / 16, 0, 1)
    rgb = cv2.cvtColor(img, cv2.COLOR_BGR2RGB)

    if a.overlay:
        over = img.copy()
        rng = np.random.RandomState(5)
        for i in range(1, len(names) + 1):
            m = ws == i
            over[m] = (0.5 * over[m] + 0.5 * rng.randint(60, 255, 3)).astype(np.uint8)
        cv2.imwrite(a.overlay, over)

    out_dir = Path(a.out)
    out_dir.mkdir(parents=True, exist_ok=True)

    def save(name, rgba):
        ys, xs = np.where(rgba[..., 3] > 4)
        x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
        Image.fromarray(rgba[y0:y1, x0:x1], "RGBA").save(out_dir / f"{name}.webp", "WEBP", quality=88, method=6)
        return int(x0), int(y0), int(x1 - x0), int(y1 - y0)

    tools = []
    for i, nm in enumerate(SEEDS, 1):
        px, py = sc(PINS[nm[0]])
        mask = (ws == i) & (body == 0)
        ys, xs = np.where(mask)
        d = np.hypot(xs - px, ys - py)
        sel = d < d.min() + 12 * s
        cx, cy = xs[sel].mean(), ys[sel].mean()
        ux, uy = cx - px, cy - py
        ln = math.hypot(ux, uy)
        ux, uy = ux / ln, uy / ln
        perp = (xs[sel] - cx) * (-uy) + (ys[sel] - cy) * ux
        half = (perp.max() - perp.min()) / 2 + 2 * s
        nx, ny = -uy, ux
        ext = np.zeros((H, W), np.uint8)
        quad = np.array([[px + nx * half, py + ny * half], [cx + nx * half, cy + ny * half],
                         [cx - nx * half, cy - ny * half], [px - nx * half, py - ny * half]], np.int32)
        cv2.fillConvexPoly(ext, quad, 1)
        ext = ext * (1 - mask.astype(np.uint8))
        bgr = img.copy()
        bgr[~mask] = 0
        filled = cv2.inpaint(bgr, ext, k(4), cv2.INPAINT_TELEA)
        full = mask | (ext > 0)
        alpha = np.where(mask, 1.0, 0.0)
        alpha = np.where(ext > 0, 1.0, alpha)
        edge = cv2.dilate(full.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        alpha = np.where(edge & ~full, soft * 0.9, alpha).astype(np.float32)
        rgb_t = cv2.cvtColor(np.where(full[..., None], filled, img), cv2.COLOR_BGR2RGB)
        rgba = np.dstack([rgb_t, (alpha * 255).astype(np.uint8)])
        x0, y0, w, h = save(nm, rgba)
        kd = np.argmax(np.hypot(xs - px, ys - py))
        tip = (int(xs[kd]), int(ys[kd]))
        phi = math.degrees(math.atan2(tip[1] - py, tip[0] - px))
        if nm[0] == "L":
            delta = 0.0 - phi
        else:
            delta = (-180.0 - phi) if phi < 0 else (180.0 - phi)
        tools.append({"name": nm, "x": x0, "y": y0, "w": w, "h": h, "pinX": px - x0, "pinY": py - y0,
                      "tipX": tip[0], "tipY": tip[1], "delta": round(delta, 2), "length": round(float(np.hypot(xs - px, ys - py).max()), 1)})
        print(f"{nm:11s} tip={tip} open angle={phi:7.1f} fold={delta:7.1f}")

    bal = cv2.GaussianBlur(body.astype(np.float32), (3, 3), 0)
    body_rgba = np.dstack([rgb, (bal * 255).astype(np.uint8)])
    bx, by, bw, bh = save("body", body_rgba)

    # crop box around everything, then express all positions relative to it
    allbox = [(t["x"], t["y"], t["x"] + t["w"], t["y"] + t["h"]) for t in tools] + [(bx, by, bx + bw, by + bh)]
    m = int(round(24 * s))
    cx0 = max(0, min(b[0] for b in allbox) - m)
    cy0 = max(0, min(b[1] for b in allbox) - m)
    cx1 = min(W, max(b[2] for b in allbox) + m)
    cy1 = min(H, max(b[3] for b in allbox) + m)
    for t in tools:
        t["x"] -= cx0
        t["y"] -= cy0
        t["tipX"] -= cx0
        t["tipY"] -= cy0
    body_g = {"x": bx - cx0, "y": by - cy0, "w": bw, "h": bh}
    pins = {side: [round(p[0] * s) - cx0, round(p[1] * s) - cy0] for side, p in PINS.items()}

    geom = {
        "size": {"w": cx1 - cx0, "h": cy1 - cy0},
        "body": body_g,
        "pins": pins,
        "tools": {t["name"]: t for t in tools},
        "drawOrder": DRAW_ORDER,
        "openOrder": OPEN_ORDER,
    }
    ts = (
        "/** Generated by scripts/hero-sprites/build_knife_sprites.py. Positions are in the sprite sheet's pixel space (size). */\n"
        "import type { KnifeGeometry } from './types';\n\n"
        f"export const knifeGeometry: KnifeGeometry = {json.dumps(geom, indent=2)};\n"
    )
    Path(a.data).parent.mkdir(parents=True, exist_ok=True)
    Path(a.data).write_text(ts, encoding="utf-8")

    # check: every tool rotated back to its open pose, under the body, should match the render
    canvas = np.zeros((H, W, 3), np.float32) + bgc[::-1].astype(np.float32)
    for nm in DRAW_ORDER:
        webp = np.array(Image.open(out_dir / f"{nm}.webp").convert("RGBA")).astype(np.float32)
        t = geom["tools"][nm]
        oy, ox = t["y"] + cy0, t["x"] + cx0
        al = webp[..., 3:4] / 255
        reg = canvas[oy:oy + t["h"], ox:ox + t["w"]]
        canvas[oy:oy + t["h"], ox:ox + t["w"]] = reg * (1 - al) + webp[..., :3] * al
    bw_ = np.array(Image.open(out_dir / "body.webp").convert("RGBA")).astype(np.float32)
    oy, ox = body_g["y"] + cy0, body_g["x"] + cx0
    al = bw_[..., 3:4] / 255
    reg = canvas[oy:oy + body_g["h"], ox:ox + body_g["w"]]
    canvas[oy:oy + body_g["h"], ox:ox + body_g["w"]] = reg * (1 - al) + bw_[..., :3] * al
    err = np.abs(canvas - rgb.astype(np.float32)).max(axis=2)
    print(f"open pose vs render: mean err {np.abs(canvas - rgb).mean():.2f}, pixels off by >30: {(err > 30).mean() * 100:.2f}%")
    total = sum(p.stat().st_size for p in out_dir.glob("*.webp"))
    print(f"wrote {len(tools) + 1} sprites ({total // 1024} KB) to {out_dir}, crop {cx1 - cx0}x{cy1 - cy0}")


if __name__ == "__main__":
    main()
