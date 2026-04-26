#!/usr/bin/env python3
import math
from pathlib import Path
from PIL import Image, ImageDraw

OUT = Path(__file__).parent / "extension" / "icons"
OUT.mkdir(parents=True, exist_ok=True)

BG = (38, 132, 255, 255)
FG = (255, 255, 255, 255)
SIZES = [48, 96, 128, 256, 512]

ARC_START_DEG = 30
ARC_END_DEG = 300


def make(size: int) -> Image.Image:
    scale = 4
    big = size * scale
    img = Image.new("RGBA", (big, big), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    radius = int(big * 0.22)
    d.rounded_rectangle((0, 0, big - 1, big - 1), radius=radius, fill=BG)

    cx = cy = big / 2
    outer_r = big * 0.30
    stroke = max(2, int(big * 0.085))

    bbox = (cx - outer_r, cy - outer_r, cx + outer_r, cy + outer_r)
    d.arc(bbox, start=ARC_START_DEG, end=ARC_END_DEG, fill=FG, width=stroke)

    end_rad = math.radians(ARC_END_DEG)
    ex = cx + outer_r * math.cos(end_rad)
    ey = cy + outer_r * math.sin(end_rad)

    tx, ty = -math.sin(end_rad), math.cos(end_rad)

    head_len = stroke * 2.2
    head_half = stroke * 1.35

    px, py = -ty, tx

    tip = (ex + tx * head_len, ey + ty * head_len)
    base_l = (ex + px * head_half, ey + py * head_half)
    base_r = (ex - px * head_half, ey - py * head_half)
    d.polygon([tip, base_l, base_r], fill=FG)

    return img.resize((size, size), Image.LANCZOS)


for s in SIZES:
    p = OUT / f"icon-{s}.png"
    make(s).save(p)
    print(f"wrote {p}")
