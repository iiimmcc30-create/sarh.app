#!/usr/bin/env python3
"""Deprecated: official icon is assets/images/brand-master.png only.

Use scripts/generate-circular-branding.py to refresh native mipmap/iOS sizes.
"""

from __future__ import annotations

import sys
from pathlib import Path

print(
    "Use brand-master.png as the only official icon.\n"
    f"Master: {Path(__file__).resolve().parents[1] / 'assets' / 'images' / 'brand-master.png'}",
    file=sys.stderr,
)
sys.exit(0)
