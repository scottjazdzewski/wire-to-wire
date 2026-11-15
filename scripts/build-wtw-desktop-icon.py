#!/usr/bin/env python3
"""Derive a multi-resolution Windows icon from the game's approved brand PNG.

This is BUILD tooling only; customers require no Python/Pillow installation.
Never overwrite or redraw the approved original logo.
"""
from pathlib import Path
from PIL import Image, ImageOps

ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/"public/assets/wtw-office-approved-logo.png"
TARGET=ROOT/"desktop/assets/wtw-app.ico"
SIZES=[(16,16),(24,24),(32,32),(48,48),(64,64),(128,128),(256,256)]

if not SOURCE.is_file():
    raise SystemExit(f"Missing approved brand asset: {SOURCE}")
with Image.open(SOURCE) as original:
    original.load()
    image=original.convert("RGBA")
    art=ImageOps.contain(image,(244,244),method=Image.Resampling.LANCZOS)
    canvas=Image.new("RGBA",(256,256),(0,0,0,0))
    canvas.alpha_composite(art,((256-art.width)//2,(256-art.height)//2))
    TARGET.parent.mkdir(parents=True,exist_ok=True)
    canvas.save(TARGET,format="ICO",sizes=SIZES)
with Image.open(TARGET) as check:
    check.load()
    if check.format!="ICO":
        raise SystemExit("ICO generation did not produce a valid Windows icon")
print(f"WTW_DESKTOP_BRAND_ICON_OK {TARGET} from {SOURCE}")
