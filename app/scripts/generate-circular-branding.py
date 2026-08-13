#!/usr/bin/env python3
"""Resize the user-provided brand-master.png for native slots only.

Does not create extra logo/icon copies. The official file is brand-master.png.
"""

from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "images"
ANDROID_RES = ROOT / "android" / "app" / "src" / "main" / "res"
IOS_SET = ASSETS / "images" / "iOS" / "AppIcon.appiconset"
MASTER_SOURCE = ASSETS / "brand-master.png"
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


def main() -> None:
    if not MASTER_SOURCE.exists():
        raise FileNotFoundError(MASTER_SOURCE)
    master = Image.open(MASTER_SOURCE).convert("RGBA")

    def save(img: Image.Image, path: Path) -> None:
        path.parent.mkdir(parents=True, exist_ok=True)
        img.save(path, format="PNG")

    def resize(size: int) -> Image.Image:
        return master.resize((size, size), Image.Resampling.LANCZOS)

    save(resize(120), ASSETS / "favicon.png")

    for folder, size in DENSITIES.items():
        icon = resize(size)
        res_dir = ANDROID_RES / folder
        save(icon, res_dir / "ic_launcher.png")
        save(icon, res_dir / "ic_launcher_round.png")

    for folder, size in FG_DENSITIES.items():
        save(resize(size), ANDROID_RES / folder / "ic_launcher_foreground.png")

    contents_path = IOS_SET / "Contents.json"
    if contents_path.exists():
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
            save(resize(px), IOS_SET / filename)

    bg_xml = ANDROID_RES / "drawable" / "ic_launcher_background.xml"
    bg_xml.write_text(
        f"""<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android" android:shape="rectangle">
  <solid android:color="{BRAND_BG_HEX}"/>
</shape>
""",
        encoding="utf-8",
    )
    print("Native sizes updated from brand-master.png only.")


if __name__ == "__main__":
    main()
