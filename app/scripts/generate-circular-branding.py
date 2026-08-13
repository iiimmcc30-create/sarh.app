#!/usr/bin/env python3
"""Generate Sarh official branding assets from brand-master.png.

Master artwork: dark forest-green square with white wave mark + emerald diamond.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
ANDROID_SRC = ASSETS / "Android"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_SET = ASSETS / "images" / "iOS" / "AppIcon.appiconset"
LEGACY_MIRROR = ASSETS / "images"

# Official Sarh emblem (user-approved).
MASTER_SOURCE = ASSETS / "brand-master.png"
# Arabic alias kept for docs / older scripts.
ARABIC_ALIAS = ASSETS / "ايقونه.png"

# Sampled from master edge — matches adaptive / splash brand surface.
BRAND_BG = (2, 27, 18, 255)  # #021B12
BRAND_BG_HEX = "#021B12"

LAUNCHER_EMBLEM_SCALE = 1.0
ADAPTIVE_EMBLEM_SCALE = 1.0
CIRCLE_INSET = 0.012
ANDROID_SPLASH_SAFE_SCALE = 2 / 3
SPLASH_WIDTH_DP = 280

DENSITIES = {
    "mipmap-mdpi": 48,
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
FG_DENSITIES = {
    "mipmap-mdpi": 108,
    "mipmap-hdpi": 162,
    "mipmap-xhdpi": 216,
    "mipmap-xxhdpi": 324,
    "mipmap-xxxhdpi": 432,
}
SPLASH_DENSITIES = {
    "drawable-mdpi": int(SPLASH_WIDTH_DP * 1),
    "drawable-hdpi": int(SPLASH_WIDTH_DP * 1.5),
    "drawable-xhdpi": int(SPLASH_WIDTH_DP * 2),
    "drawable-xxhdpi": int(SPLASH_WIDTH_DP * 3),
    "drawable-xxxhdpi": int(SPLASH_WIDTH_DP * 4),
}


def center_square(img: Image.Image) -> Image.Image:
    w, h = img.size
    side = min(w, h)
    left = (w - side) // 2
    top = (h - side) // 2
    return img.crop((left, top, left + side, top + side))


def load_master() -> Image.Image:
    if not MASTER_SOURCE.exists():
        raise FileNotFoundError(MASTER_SOURCE)
    return center_square(Image.open(MASTER_SOURCE).convert("RGBA"))


def apply_circle_mask(img: Image.Image, inset_ratio: float = CIRCLE_INSET) -> Image.Image:
    size = img.size[0]
    mask = Image.new("L", (size, size), 0)
    draw = ImageDraw.Draw(mask)
    inset = int(size * inset_ratio)
    draw.ellipse((inset, inset, size - inset - 1, size - inset - 1), fill=255)
    out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    out.paste(img, (0, 0), mask)
    return out


def square_from_master(size: int) -> Image.Image:
    return load_master().resize((size, size), Image.Resampling.LANCZOS)


def emblem_circle(size: int) -> Image.Image:
    return apply_circle_mask(square_from_master(size))


def splash_logo(size: int) -> Image.Image:
    """Circular emblem only — splash backgroundColor provides the canvas."""
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    emblem_size = max(1, int(size * ANDROID_SPLASH_SAFE_SCALE))
    emblem = emblem_circle(emblem_size)
    offset = (size - emblem_size) // 2
    canvas.paste(emblem, (offset, offset), emblem)
    return canvas


def adaptive_foreground(canvas_size: int = 1024) -> Image.Image:
    """Full-bleed brand mark for Android adaptive foreground."""
    return square_from_master(canvas_size)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG", optimize=True)


def sync_ios_icons(master_1024: Image.Image) -> None:
    contents_path = IOS_SET / "Contents.json"
    if not contents_path.exists():
        return
    data = json.loads(contents_path.read_text(encoding="utf-8"))
    for entry in data.get("images", []):
        filename = entry.get("filename")
        if not filename:
            continue
        size_str = str(entry.get("size", "1024x1024")).split("x")[0]
        scale_str = str(entry.get("scale", "1x")).replace("x", "")
        try:
            base = float(size_str)
            scale = float(scale_str)
            px = int(round(base * scale))
        except ValueError:
            px = 1024
        save_png(
            master_1024.resize((px, px), Image.Resampling.LANCZOS),
            IOS_SET / filename,
        )


def mirror_primary_assets() -> None:
    """Keep legacy assets/images/images/* in sync for older paths."""
    for name in (
        "icon.png",
        "adaptive-icon.png",
        "logo.png",
        "logo-circle.png",
        "splash-circle.png",
        "favicon.png",
        "brand-master.png",
    ):
        src = ASSETS / name
        if src.exists():
            save_png(Image.open(src).convert("RGBA"), LEGACY_MIRROR / name)


def main() -> None:
    master = load_master()
    # Keep Arabic alias identical to master.
    save_png(master, ARABIC_ALIAS)

    emblem_512 = emblem_circle(512)
    master_512 = square_from_master(512)
    master_1024 = square_from_master(1024)

    save_png(emblem_512, ASSETS / "logo-circle.png")
    save_png(emblem_512, ASSETS / "logo.png")
    save_png(adaptive_foreground(1024), ASSETS / "adaptive-icon.png")
    save_png(splash_logo(512), ASSETS / "splash-icon.png")
    save_png(splash_logo(1024), ASSETS / "splash-circle.png")
    save_png(master_1024, ASSETS / "icon.png")
    save_png(
        master_512.resize((120, 120), Image.Resampling.LANCZOS),
        ASSETS / "favicon.png",
    )
    save_png(master_512, ANDROID_SRC / "play_store_512.png")

    for folder, size in DENSITIES.items():
        icon = square_from_master(size)
        src_dir = ANDROID_SRC / folder
        res_dir = ANDROID_RES / folder
        for target_dir in (src_dir, res_dir):
            save_png(icon, target_dir / "ic_launcher.png")
            save_png(icon, target_dir / "ic_launcher_round.png")

    for folder, size in FG_DENSITIES.items():
        fg = square_from_master(size)
        save_png(fg, ANDROID_RES / folder / "ic_launcher_foreground.png")
        save_png(fg, ANDROID_SRC / folder / "ic_launcher_foreground.png")

    for folder, size in SPLASH_DENSITIES.items():
        save_png(splash_logo(size), ANDROID_RES / folder / "splashscreen_logo.png")

    sync_ios_icons(master_1024)
    mirror_primary_assets()

    # Align Android drawable / color helpers written by companion JS script.
    bg_xml = ANDROID_RES / "drawable" / "ic_launcher_background.xml"
    bg_xml.parent.mkdir(parents=True, exist_ok=True)
    bg_xml.write_text(
        f"""<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="{BRAND_BG_HEX}"/>
</shape>
""",
        encoding="utf-8",
    )

    print("Generated official Sarh branding assets.")
    print(f"- Master: {MASTER_SOURCE.name}")
    print(f"- Brand background: {BRAND_BG_HEX}")


if __name__ == "__main__":
    main()
