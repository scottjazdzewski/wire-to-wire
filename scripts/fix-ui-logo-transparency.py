#!/usr/bin/env python3
"""Audit the exact UI marks and produce SAFE transparent display derivatives.

Original approved logos, badges, horse portraits, farm photography, track
images, and hero artwork are never overwritten. This corrects only opaque
light export mattes on legacy track logos for which no transparent hero exists.
The /next/ profile hero automatically discovers a matching T-ID hero path.
"""
from __future__ import annotations

import argparse
from collections import deque
import json
import shutil
import subprocess
import tempfile
from pathlib import Path
from PIL import Image
import numpy as np

ROOT = Path("public/assets")
LOGOS = ROOT / "places/track-logos"
HEROS = ROOT / "places/track-hero"
REPORT = Path("visual-audit/asset-transparency/ui-alpha-audit.json")
# Immutable PR #250 gameplay base: original approved marks before UI alpha edits.
# This prevents repeated in-place matte correction from contaminating
# transparent hero derivatives, while never changing the source file.
SOURCE_BASE = "6d98025e65dfc6ad74d6e7f9c7815c2ee138f5db"
ASSESS = [
    ROOT / "places/track-logos", ROOT / "places/track-hero",
    ROOT / "places/farms", ROOT / "office/founding-organization-logos",
    ROOT / "profile-badges/v2", ROOT / "portraits/people",
    ROOT / "portraits/horses", ROOT / "trophies",
]

def scan(image_path: Path) -> dict:
    with Image.open(image_path) as img:
        rgba = img.convert("RGBA")
        a = np.asarray(rgba.getchannel("A"), dtype=np.uint8)
        rgb = np.asarray(rgba.convert("RGB"), dtype=np.uint8)
    h,w=a.shape
    corners=rgb[[0,0,h-1,h-1],[0,w-1,0,w-1]].astype(np.int16)
    white_corners=int(np.count_nonzero(
        (corners.min(axis=1)>=225)&
        ((corners.max(axis=1)-corners.min(axis=1))<=35)))
    border_alpha=int(np.min(a[[0,0,h-1,h-1],[0,w-1,0,w-1]]))
    return {
        "path":image_path.as_posix(),"width":w,"height":h,
        "alpha_pixels":int(np.count_nonzero(a<250)),
        "alpha_percent":round(100*float(np.mean(a<250)),2),
        "corner_alpha_min":border_alpha,
        "white_corners":white_corners,
        "opaque_white_matte":white_corners>=3 and int(np.count_nonzero(a<250))==0
    }

def clear_border_matte(src: Path, out: Path) -> dict:
    with Image.open(src) as im: raw=np.asarray(im.convert("RGBA"),dtype=np.uint8).copy()
    h,w=raw.shape[:2]
    rgb=raw[:,:,:3].astype(np.int16)
    alpha=raw[:,:,3]
    lo=rgb.min(axis=2);hi=rgb.max(axis=2)
    # Near-neutral white/off-white canvas. Colored logo ink is excluded.
    white=(lo>=211)&((hi-lo)<=44)&(alpha>=250)
    corners=[(0,0),(0,w-1),(h-1,0),(h-1,w-1)]
    if sum(bool(white[y,x]) for y,x in corners)<3:
        return {"changed":False,"reason":"not a near-white opaque canvas"}
    # Flood only the canvas connected to the actual image boundary.
    edges=np.zeros((h,w),dtype=np.bool_)
    q=deque()
    def enqueue(y,x):
        if white[y,x] and not edges[y,x]:
            edges[y,x]=True;q.append((y,x))
    for x in range(w):enqueue(0,x);enqueue(h-1,x)
    for y in range(h):enqueue(y,0);enqueue(y,w-1)
    while q:
        y,x=q.popleft()
        if x>0:enqueue(y,x-1)
        if x<w-1:enqueue(y,x+1)
        if y>0:enqueue(y-1,x)
        if y<h-1:enqueue(y+1,x)
    share=float(edges.mean())
    if share<.05: return {"changed":False,"reason":"insufficient exterior matte"}
    # Turn the connected export background transparent; perform conservative
    # antialiased edge decontamination. White features isolated INSIDE a crest
    # (e.g. Monmouth's white horse) remain opaque source artwork.
    outpixels=raw.copy()
    edge_rgb=rgb[edges]
    darkest=edge_rgb.min(axis=1)
    # Gray antialias at the logo boundary survives with proportional alpha.
    edge_alpha=np.clip((246-darkest)*255/35,0,255).astype(np.uint8)
    outpixels[edges,3]=edge_alpha
    # Neutralize transparent RGB so its invisible stored white does not
    # bleed into dark UI backdrops during WebP filtering.
    fully=edges & (outpixels[:,:,3]<3)
    outpixels[fully,0:3]=0
    outpixels[fully,3]=0
    # Do not crop/scale, rename original logo files, or modify brand colors.
    out.parent.mkdir(parents=True,exist_ok=True)
    Image.fromarray(outpixels,"RGBA").save(out,"WEBP",lossless=True,method=6)
    result=scan(out)
    if result["alpha_pixels"]<w*h*.05 or result["corner_alpha_min"]>32:
        out.unlink(missing_ok=True)
        return {"changed":False,"reason":"derived alpha validation failed"}
    return {"changed":True,"matte_percent":round(share*100,2),
            "new_alpha_percent":result["alpha_percent"],"output":out.as_posix()}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--write",action="store_true")
    args=ap.parse_args()
    report={"schema":"WTW_UI_ALPHA_AUDIT_V1","source_preservation":True,
            "assets":[],"new_transparent_hero_derivatives":[],"needs_manual_review":[],"unreadable":[]}
    candidates=[]
    for folder in ASSESS:
        if not folder.is_dir():continue
        for source in sorted(folder.iterdir()):
            if source.suffix.lower() not in (".webp",".png",".jpg",".jpeg"):continue
            try:
                item=scan(source)
            except (OSError, ValueError) as exc:
                # An unrelated truncated portrait must not block repair of
                # valid logos. Record the exact corrupt path for a separate
                # asset-integrity fix instead of silently trusting its alpha.
                report["unreadable"].append({"path":source.as_posix(),
                                             "error":type(exc).__name__+": "+str(exc)})
                continue
            report["assets"].append(item)
            if folder==LOGOS:
                out=HEROS/source.name
                if out.exists():continue
                # Recover genuine approved pre-edit pixels; the source may
                # have been transparency-adjusted by another UI window.
                base=None
                try:
                    base=subprocess.check_output(
                        ["git","show",SOURCE_BASE+":"+source.as_posix()],
                        stderr=subprocess.DEVNULL,timeout=12)
                except (subprocess.CalledProcessError, subprocess.TimeoutExpired):
                    pass
                baseline=None
                if base:
                    with tempfile.TemporaryDirectory(prefix="wtw-alpha-baseline-") as tmp:
                        original=Path(tmp)/source.name
                        original.write_bytes(base)
                        try:baseline=scan(original)
                        except (OSError,ValueError):pass
                if baseline and baseline["opaque_white_matte"]:
                    candidates.append((source,out,"original-white-matte",base))
                elif item["alpha_percent"]>=2:
                    # This exact-ID file already has approved transparent
                    # pixels; copy the existing mark without another edit.
                    candidates.append((source,out,"source-already-alpha",None))
    for source,out,method,base in candidates:
        try:
            if args.write and method=="original-white-matte":
                with tempfile.TemporaryDirectory(prefix="wtw-alpha-original-") as tmp:
                    original=Path(tmp)/source.name
                    original.write_bytes(base)
                    result=clear_border_matte(original,out)
            elif args.write:
                out.parent.mkdir(parents=True,exist_ok=True)
                shutil.copy2(source,out)
                verified=scan(out)
                result={"changed":verified["alpha_percent"]>=2,
                        "method":"approved transparent source copied",
                        "new_alpha_percent":verified["alpha_percent"],
                        "output":out.as_posix()}
                if not result["changed"]:out.unlink(missing_ok=True)
            else:
                result={"changed":False,"reason":"preview mode"}
        except (OSError, ValueError) as exc:
            result={"changed":False,"reason":"decode-error: "+str(exc)}
            report["unreadable"].append({"path":source.as_posix(),"error":str(exc)})
        report["new_transparent_hero_derivatives"].append({
            "source":source.as_posix(),"method":method,**result})
    # Existing intentional plaques, portraits and photography are NOT a
    # transparency defect; only logo export canvases without a hero need
    # conversion. Remaining anomalous legacy logos are logged for review.
    hero_ids={f.stem for f in HEROS.glob("T-*.webp")}
    for item in report["assets"]:
        source=Path(item["path"])
        if source.parent==LOGOS and source.stem not in hero_ids and (
            item["opaque_white_matte"] or item["alpha_percent"]<.01):
            report["needs_manual_review"].append(item["path"])
    report["summary"]={
        "assets_checked":len(report["assets"]),
        "track_logos":len(list(LOGOS.glob("T-*.webp"))),
        "track_heroes":len(hero_ids),
        "opaque_white_legacy_logos":sum(x["opaque_white_matte"] for x in report["assets"] if Path(x["path"]).parent==LOGOS),
        "derivatives_written":sum(x["changed"] for x in report["new_transparent_hero_derivatives"]),
        "remaining_suspect_legacy_no_hero":len(report["needs_manual_review"]),
        "unreadable_assets":len(report["unreadable"])
    }
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps(report,indent=2)+"\n")
    print("UI_ALPHA_AUDIT "+json.dumps(report["summary"],sort_keys=True))
    for x in report["new_transparent_hero_derivatives"]:
        print("UI_ALPHA_DERIVATIVE "+json.dumps(x))
    for x in report["needs_manual_review"]:print("UI_ALPHA_REVIEW "+x)
    if args.write and any(not x["changed"] for x in report["new_transparent_hero_derivatives"]):
        raise SystemExit("Some near-white legacy logo derivatives failed safety validation")

if __name__=="__main__":main()
