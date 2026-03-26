#!/usr/bin/env python3
"""Generate mobile app icon and splash screen PNGs from the favicon SVG."""

import os
import cairosvg
from PIL import Image, ImageDraw

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
FAVICON_SVG = os.path.join(ROOT_DIR, "apps", "web", "public", "favicon.svg")
MOBILE_ASSETS = os.path.join(ROOT_DIR, "apps", "mobile", "assets")

os.makedirs(MOBILE_ASSETS, exist_ok=True)


def svg_to_png(svg_path, png_path, width, height):
    """Render SVG to PNG at the given size."""
    cairosvg.svg2png(
        url=svg_path,
        write_to=png_path,
        output_width=width,
        output_height=height,
    )
    print(f"  Created {os.path.basename(png_path)} ({width}x{height})")


def create_splash(icon_path, output_path, canvas_w=1284, canvas_h=2778):
    """Create a splash screen: icon centered on a yellow background."""
    bg_color = (254, 240, 138)  # #fef08a — matches the game background
    canvas = Image.new("RGBA", (canvas_w, canvas_h), bg_color)

    icon = Image.open(icon_path).convert("RGBA")
    icon_size = min(canvas_w, canvas_h) // 4
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)

    x = (canvas_w - icon_size) // 2
    y = (canvas_h - icon_size) // 2
    canvas.paste(icon, (x, y), icon)

    canvas.save(output_path, "PNG")
    print(f"  Created {os.path.basename(output_path)} ({canvas_w}x{canvas_h})")


def create_adaptive_icon(svg_path, output_path, size=1024):
    """Create Android adaptive icon — foreground with padding on transparent bg."""
    # Adaptive icons need ~30% padding around the content
    content_size = int(size * 0.65)
    offset = (size - content_size) // 2

    # Render SVG to the content size
    temp_path = output_path + ".tmp.png"
    cairosvg.svg2png(
        url=svg_path,
        write_to=temp_path,
        output_width=content_size,
        output_height=content_size,
    )

    # Place on transparent canvas with padding
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    icon = Image.open(temp_path).convert("RGBA")
    canvas.paste(icon, (offset, offset), icon)
    canvas.save(output_path, "PNG")
    os.remove(temp_path)
    print(f"  Created {os.path.basename(output_path)} ({size}x{size})")


print("Generating mobile app assets...")

# App icon (1024x1024 — used by iOS and as base)
icon_path = os.path.join(MOBILE_ASSETS, "icon.png")
svg_to_png(FAVICON_SVG, icon_path, 1024, 1024)

# Android adaptive icon foreground
adaptive_path = os.path.join(MOBILE_ASSETS, "adaptive-icon.png")
create_adaptive_icon(FAVICON_SVG, adaptive_path, 1024)

# Favicon for Expo web
favicon_path = os.path.join(MOBILE_ASSETS, "favicon.png")
svg_to_png(FAVICON_SVG, favicon_path, 48, 48)

# Splash screen (iPhone 14 Pro Max size, works for most devices)
splash_path = os.path.join(MOBILE_ASSETS, "splash.png")
create_splash(icon_path, splash_path)

print("\nDone! All assets generated in apps/mobile/assets/")
