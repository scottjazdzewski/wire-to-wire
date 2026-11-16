#!/usr/bin/env python3
"""Repair *baked exterior mattes* on runtime identity marks in place.

Scope is deliberately identity artwork, not photography, horse/people
portraits, track hero images, trophies or intentional branded badge panels.
Preserves original dimensions, colors, names and image formats.
"""
from __future__ import annotations

import argparse
import json
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageOps
from scipy.ndimage import binary_propagation, distance_transform_edt

ROOT = Path(__file__).resolve().parents[1]
TARGETS = (
    "public/assets/places/track-logos/*.*",
    "public/assets/places/track-hero/*.*",
    "public/assets/office/founding-organization-logos/*.*",
    "public/assets/profile-badges/v2/*.*",
    "public/assets/wtw-logo.png",
    "public/assets/wtw-office-approved-logo.png",
)
EXCLUDED = ("/portraits/", "/places/farms/", "/trophies/")
APPROVED_EXTENSIONS = {".png", ".webp"}
# These backgrounds are known to be integral to the source *raster*, not
# cutouts. Keep foreground text/emblems; remove backdrop chroma only.
CHROMA_LOGOS = {
    "T-0002.webp": "white-on-green",
    "T-0006.webp": "white-yellow-on-purple",
    "T-0007.webp": "white-gold-on-black",
}

def bounded(values, low, high):
    return np.clip((values - low) / (high - low), 0.0, 1.0)

def repaired_rgba(im: Image.Image, path: Path):
    original = np.asarray(im.convert("RGBA"), dtype=np.uint8)
    rgb = original[:, :, :3].astype(np.float32)
    old_alpha = original[:, :, 3].astype(np.float32)
    h, w = old_alpha.shape
    if h < 32 or w < 32:
        return None, "too-small"
    margin = max(2, min(w, h) // 45)
    corners = np.concatenate([
        original[:margin, :margin].reshape(-1, 4),
        original[:margin, -margin:].reshape(-1, 4),
        original[-margin:, :margin].reshape(-1, 4),
        original[-margin:, -margin:].reshape(-1, 4),
    ])
    # A genuine alpha-cutout is not a defect. Do not erase artwork inside it.
    transparent_corners = float(np.mean(corners[:, 3] < 32))
    if transparent_corners >= 0.85:
        return None, "already-transparent-corners"
    bg = np.median(corners[:, :3].astype(np.float32), axis=0)
    spread = np.max(np.abs(corners[:, :3].astype(np.float32) - bg), axis=1)
    if float(np.mean(spread < 42)) < 0.83:
        return None, "corners-not-common-matte"
    edge = np.zeros((h, w), dtype=bool)
    edge[:margin] = edge[-margin:] = True
    edge[:, :margin] = edge[:, -margin:] = True
    opaque_border = float(np.mean(old_alpha[edge] > 220))
    if opaque_border < 0.79:
        return None, "already-alpha-edge"

    special = CHROMA_LOGOS.get(path.name) if "track-logos" in path.parts else None
    strength = None
    method = ""
    if special == "white-on-green":
        # Belmont source has a textured green panel covering the full image.
        # The approved artwork itself is white; retaining only whites removes
        # the entire baked green rectangle, not just the outer pixels.
        strength = bounded(np.min(rgb, axis=2), 135, 215)
        method = "white-emblem-green-matte"
    elif special == "white-yellow-on-purple":
        # Finger Lakes uses a purple baked rectangle with white/yellow art.
        # Preserve a narrow, dark-purple stroke next to approved lettering.
        pale = bounded(np.min(rgb, axis=2), 138, 213)
        gold = bounded(rgb[:, :, 0], 115, 210) * bounded(rgb[:, :, 1], 75, 165) * (1 - bounded(rgb[:, :, 2], 120, 205))
        strength = np.maximum(pale, gold)
        close_to_mark = distance_transform_edt(strength < 0.6)
        strength = np.maximum(strength, bounded(5.2-close_to_mark, 0.1, 5.2) * 0.36)
        method = "pale-gold-emblem-purple-matte"
    elif special == "white-gold-on-black":
        strength = bounded(np.max(rgb, axis=2), 12, 72)
        method = "bright-emblem-black-matte"
    else:
        distance = np.max(np.abs(rgb - bg[None, None, :]), axis=2)
        white = float(np.min(bg)) >= 233 and float(np.max(bg) - np.min(bg)) < 28
        black = float(np.max(bg)) < 37
        near_corner = float(np.mean(distance[edge] < (70 if white else 65)))
        # Do not treat a colorful, intentional rounded badge as a matte.
        if not ("track-logos" in path.parts or white or black):
            return None, "intentional-colored-badge"
        if near_corner < 0.70:
            return None, "border-is-not-matte"
        if white:
            threshold, low, high, method = 80, 7, 58, "exterior-white-matte"
        elif black:
            threshold, low, high, method = 84, 7, 60, "exterior-black-matte"
        else:
            # A highly uniform chromatic outer field can be removed without
            # stripping the distinct central mark or photographic interiors.
            if float(np.mean(spread < 22)) < 0.90:
                return None, "nonuniform-colored-field"
            threshold, low, high, method = 62, 6, 52, "exterior-solid-color-matte"
        candidate = distance < threshold
        outside = binary_propagation(candidate & edge, mask=candidate)
        strength = np.where(outside, bounded(distance, low, high), 1.0)

    if strength is None:
        return None, "not-a-cutout"
    alpha = np.rint(old_alpha * strength).astype(np.uint8)
    total_transparent = float(np.mean(alpha < 20))
    remaining = float(np.mean(alpha > 180))
    if total_transparent < 0.08 or remaining < 0.002:
        return None, "unsafe-matte-classification"
    if np.array_equal(alpha, original[:, :, 3]):
        return None, "unchanged"

    # Neutralize color-fringes while preserving original logo pigments. For
    # translucent edge pixels, reverse their blend against the source matte.
    result = original.copy()
    new_a = np.maximum(strength, 0.015)
    affected = (strength > 0.02) & (strength < 0.98)
    for k in range(3):
        channel = (rgb[:, :, k] - (1.0 - strength) * bg[k]) / new_a
        result[:, :, k][affected] = np.clip(channel[affected], 0, 255).astype(np.uint8)
    result[:, :, 3] = alpha
    result[alpha == 0, :3] = 0
    rgba = Image.fromarray(result, "RGBA")
    return rgba, method

def logo_paths():
    found = set()
    for glob in TARGETS:
        for path in ROOT.glob(glob):
            if path.is_file() and path.suffix.lower() in APPROVED_EXTENSIONS:
                rel = path.relative_to(ROOT).as_posix()
                if not any(block in "/" + rel for block in EXCLUDED):
                    found.add(path)
    return sorted(found, key=lambda p: (
        0 if "track-logos" in p.parts else 1 if "track-hero" in p.parts else 2,
        p.as_posix()))

def save_image(path, image):
    # Keep the existing URL and extension; no new filenames or logos.
    if path.suffix.lower() == ".webp":
        image.save(path, format="WEBP", lossless=True, method=5)
    else:
        image.save(path, format="PNG", optimize=True)

def tile(image, label, width=300, height=220):
    canvas = Image.new("RGB", (width, height), "#143325")
    image = image.convert("RGBA")
    image.thumbnail((width - 20, height - 35), Image.Resampling.LANCZOS)
    canvas.paste(image, ((width-image.width)//2, 21 + (height-32-image.height)//2), image)
    draw = ImageDraw.Draw(canvas)
    draw.text((8, 5), label[:47], fill="#fff8e3")
    return canvas

def contact_sheet(samples, output: Path):
    if not samples:
        return
    # Each before/after pair is on the same dark in-game-style ground.
    w, h = 300, 220
    cols = 4
    rows = (len(samples) * 2 + cols - 1) // cols
    sheet = Image.new("RGB", (cols*w, rows*h), "#101b17")
    for i, (path, before, after) in enumerate(samples):
        for j, item in enumerate((before, after)):
            n = i * 2 + j
            sheet.paste(tile(item, path.name + (" · BEFORE" if j == 0 else " · AFTER")),
                        ((n % cols)*w, (n//cols)*h))
    output.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(output, quality=87)

def synthetic_test():
    white = Image.new("RGBA", (128, 96), "white")
    ImageDraw.Draw(white).rectangle([35, 25, 95, 73], fill="#008b55")
    converted, method = repaired_rgba(white, Path("track-logos/TEST.webp"))
    assert converted is not None and converted.getpixel((0, 0))[3] == 0
    assert converted.getpixel((55, 40))[3] == 255, method
    black = Image.new("RGBA", (128, 96), "black")
    ImageDraw.Draw(black).ellipse([30, 20, 90, 78], fill="#ffda64")
    converted, method = repaired_rgba(black, Path("track-logos/TEST.webp"))
    assert converted is not None and converted.getpixel((0, 0))[3] == 0
    assert converted.getpixel((62, 50))[3] == 255, method
    cutout = Image.new("RGBA", (128, 96), (0, 0, 0, 0))
    ImageDraw.Draw(cutout).ellipse([30, 20, 90, 78], fill="#ffda64")
    assert repaired_rgba(cutout, Path("track-logos/TEST.webp"))[0] is None
    print("Transparency repair synthetic tests passed.")

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--apply", action="store_true", help="Rewrite recognized mattes in repo files")
    parser.add_argument("--verify", action="store_true", help="Fail if a known logo matte remains")
    parser.add_argument("--report", default="visual-audit/logo-alpha-repair/report.json")
    parser.add_argument("--sheet", default="visual-audit/logo-alpha-repair/changes.jpg")
    opts = parser.parse_args()
    synthetic_test()
    paths = logo_paths()
    records = []
    samples = []
    changed = []
    for path in paths:
        rel = path.relative_to(ROOT).as_posix()
        try:
            with Image.open(path) as source:
                before = source.convert("RGBA")
                output, method = repaired_rgba(before, path)
            # The legacy Saratoga hero contains a flat red export panel,
            # not a visible mark. Reconstruct its transparent *display* mark
            # from the already-approved original T-0003 track logo; never
            # invent a new emblem, alter the ID, or change the canvas size.
            if ("track-hero" in path.parts and path.name == "T-0003.webp" and
                float(np.max(np.std(np.asarray(before.convert("RGB")),
                                        axis=(0, 1)))) < 12):
                sibling = path.parent.parent / "track-logos" / path.name
                with Image.open(sibling) as src:
                    approved = src.convert("RGBA")
                    cutout, _ = repaired_rgba(approved, sibling)
                    approved = cutout if cutout is not None else approved
                approved.thumbnail((int(before.width * .92),
                                    int(before.height * .88)), Image.Resampling.LANCZOS)
                output = Image.new("RGBA", before.size, (0, 0, 0, 0))
                output.alpha_composite(approved, (
                    (before.width-approved.width)//2,
                    (before.height-approved.height)//2))
                method = "approved-saratoga-mark-replaces-flat-red-export-matte"
        except (OSError, ValueError) as exc:
            # Do not destroy a truncated source image by saving a guessed
            # result. Record the exact source path as unresolved instead.
            records.append({"path":rel, "method":"UNREADABLE", "changed":False,
                            "error":type(exc).__name__+": "+str(exc)})
            continue
        record = {"path": rel, "method": method, "dimensions": list(before.size),
                  "changed": bool(output is not None)}
        if output is not None:
            record["before_corner_alpha"] = int(before.getpixel((0,0))[3])
            record["after_corner_alpha"] = int(output.getpixel((0,0))[3])
            if len(samples) < 36:
                samples.append((path, before.copy(), output.copy()))
            if opts.apply:
                save_image(path, output)
            changed.append(rel)
        records.append(record)
    # Versioned asset identity stays fixed; photo textures stay untouched.
    if opts.apply:
        for basename in ("T-0017.webp", "T-0013.webp"):
            path = ROOT / "public/assets/places/track-logos" / basename
            with Image.open(path) as img:
                assert img.convert("RGBA").getpixel((0, 0))[3] < 12, \
                    basename+" still has an opaque source matte"
    if opts.verify:
        problem = [r for r in records if r["changed"] and
                   ("/places/track-logos/" in r["path"] or
                    "/places/track-hero/" in r["path"])]
        if problem:
            raise SystemExit("Track identity still has a removable baked matte: "+str(problem))
    unreadable = [r["path"] for r in records if r["method"] == "UNREADABLE"]
    report = {"inspected": len(paths), "changed": len(changed), "files": changed,
              "unreadable": unreadable, "records": records,
              "mode": "apply" if opts.apply else "verify" if opts.verify else "scan"}
    report_path = ROOT / opts.report
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(json.dumps(report, indent=2) + "\n")
    contact_sheet(samples, ROOT / opts.sheet)
    print("WTW_RUNTIME_ALPHA_REPORT "+json.dumps({
        "inspected": len(paths), "changed": len(changed), "files": changed,
        "unreadable": unreadable
    }))
    print("WTW_RUNTIME_ALPHA_REPAIR_PASS")

if __name__ == "__main__":
    main()
