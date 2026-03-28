#!/usr/bin/env python3
"""Generate PWA icons, apple-touch-icon, and social preview image for the web app."""

import os
import cairosvg
from PIL import Image, ImageDraw, ImageFont

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.dirname(SCRIPT_DIR)
FAVICON_SVG = os.path.join(ROOT_DIR, "apps", "web", "public", "favicon.svg")
PUBLIC_DIR = os.path.join(ROOT_DIR, "apps", "web", "public")

os.makedirs(PUBLIC_DIR, exist_ok=True)


def svg_to_png(svg_path, png_path, width, height):
    cairosvg.svg2png(url=svg_path, write_to=png_path, output_width=width, output_height=height)
    print(f"  Created {os.path.basename(png_path)} ({width}x{height})")


def create_og_image(icon_path, output_path, w=1200, h=630):
    """Create a social preview image with the app icon and title text."""
    bg_color = (254, 240, 138)  # #fef08a
    canvas = Image.new("RGBA", (w, h), bg_color)
    draw = ImageDraw.Draw(canvas)

    # Place icon on the left
    icon = Image.open(icon_path).convert("RGBA")
    icon_size = 300
    icon = icon.resize((icon_size, icon_size), Image.LANCZOS)
    icon_x = 80
    icon_y = (h - icon_size) // 2
    canvas.paste(icon, (icon_x, icon_y), icon)

    # Draw title text
    title_x = icon_x + icon_size + 60
    try:
        title_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 56)
        sub_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    except (OSError, IOError):
        title_font = ImageFont.load_default()
        sub_font = ImageFont.load_default()

    draw.text((title_x, 160), "Free Fruit", fill=(22, 163, 74), font=title_font)
    draw.text((title_x, 230), "Sudoku", fill=(22, 163, 74), font=title_font)
    draw.text((title_x, 300), "for Kids", fill=(22, 163, 74), font=title_font)
    draw.text((title_x, 380), "Fun puzzle game with fruit emojis!", fill=(55, 65, 81), font=sub_font)
    draw.text((title_x, 430), "Easy - Medium - Hard", fill=(107, 114, 128), font=sub_font)

    canvas.save(output_path, "PNG")
    print(f"  Created {os.path.basename(output_path)} ({w}x{h})")


print("Generating web app assets...")

# PWA icons
svg_to_png(FAVICON_SVG, os.path.join(PUBLIC_DIR, "pwa-192x192.png"), 192, 192)
svg_to_png(FAVICON_SVG, os.path.join(PUBLIC_DIR, "pwa-512x512.png"), 512, 512)

# Apple touch icon
svg_to_png(FAVICON_SVG, os.path.join(PUBLIC_DIR, "apple-touch-icon.png"), 180, 180)

# OG image (social preview)
icon_temp = os.path.join(PUBLIC_DIR, "pwa-512x512.png")
create_og_image(icon_temp, os.path.join(PUBLIC_DIR, "og-image.png"))

print("\nDone! All web assets generated in apps/web/public/")
