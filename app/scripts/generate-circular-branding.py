#!/usr/bin/env python3
"""Propagate the user-provided Sarh icon (brand-master.png) as-is.

No redesign, no circle crop. Platform sizes are simple resizes of the same file.
"""

from __future__ import annotations

import json
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
ANDROID_SRC = ASSETS / "Android"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_SET = ASSETS / "images" / "iOS" / "AppIcon.appiconset"
LEGACY_MIRROR = ASSETS / "images"

MASTER_SOURCE = ASSETS / "brand-master.png"
ARABIC_ALIAS = ASSETS / "ايقونه.png"
BRAND_BG_HEX = "#021B12"

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
    "drawable-mdpi": 280,
    "drawable-hdpi": 420,
    "drawable-xhdpi": 560,
    "drawable-xxhdpi": 840,
    "drawable-xxxhdpi": 1120,
}


def load_master() -> Image.Image:
    if not MASTER_SOURCE.exists():
        raise FileNotFoundError(MASTER_SOURCE)
    return Image.open(MASTER_SOURCE).convert("RGBA")


def resize_exact(img: Image.Image, size: int) -> Image.Image:
    return img.resize((size, size), Image.Resampling.LANCZOS)


def save_png(img: Image.Image, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, format="PNG")


def copy_master(dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(MASTER_SOURCE, dest)


def sync_ios_icons(master: Image.Image) -> None:
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
            px = int(round(float(size_str) * float(scale_str)))
        except ValueError:
            px = 1024
        if px == 1024:
            copy_master(IOS_SET / filename)
        else:
            save_png(resize_exact(master, px), IOS_SET / filename)


def main() -> None:
    master = load_master()

    # Exact same file — no processing.
    for dest in (
        ASSETS / "icon.png",
        ASSETS / "adaptive-icon.png",
        ARABIC_ALIAS,
        ASSETS / "logo.png",
        ASSETS / "logo-circle.png",
        ASSETS / "splash-circle.png",
        ASSETS / "splash-icon.png",
    ):
        copy_master(dest)

    save_png(resize_exact(master, 120), ASSETS / "favicon.png")
    save_png(resize_exact(master, 512), ANDROID_SRC / "play_store_512.png")

    for folder, size in DENSITIES.items():
        icon = resize_exact(master, size)
        for target_dir in (ANDROID_SRC / folder, ANDROID_RES / folder):
            save_png(icon, target_dir / "ic_launcher.png")
            save_png(icon, target_dir / "ic_launcher_round.png")

    for folder, size in FG_DENSITIES.items():
        fg = resize_exact(master, size)
        save_png(fg, ANDROID_RES / folder / "ic_launcher_foreground.png")
        save_png(fg, ANDROID_SRC / folder / "ic_launcher_foreground.png")

    for folder, size in SPLASH_DENSITIES.items():
        save_png(resize_exact(master, size), ANDROID_RES / folder / "splashscreen_logo.png")

    sync_ios_icons(master)

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
            shutil.copy2(src, LEGACY_MIRROR / name)

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

    print("Copied user icon as-is (resize only for platform sizes).")
    print(f"- Master: {MASTER_SOURCE}")


if __name__ == "__main__":
    main()
