#!/usr/bin/env python3
"""Finish the 1999 runtime track-logo alpha cleanup.

Sources:
- Immutable approved PR #250 game-world artwork, never a repeatedly retouched
  image (repeated chroma removal caused horizontal color streaks).
- Existing approved transparent profile heroes where they are a higher-quality
  representation of the same track, including renamed Comanche Raceway.

Only the EXISTING exact-ID WebP track logo/hero display copies are written.
Never touches photos, horse portraits, badges, personnel, breeding or gameplay.
"""
from __future__ import annotations
import argparse
from io import BytesIO
from pathlib import Path
import json
import shutil
import subprocess
import numpy as np
from PIL import Image, ImageDraw
from scipy.ndimage import binary_propagation

BASE="6d98025e65dfc6ad74d6e7f9c7815c2ee138f5db"
LOGOS=Path("public/assets/places/track-logos")
HERO=Path("public/assets/places/track-hero")
OUT=Path("visual-audit/asset-transparency/final-logo-fixes")
# These are different approved clean hero designs, not damaged export mattes.
# Prefer the already-shipping approved hero rather than reconstruct a brand.
APPROVED_HERO_AS_LOGO=("T-0001","T-0012","T-0016","T-0030","T-0061")
# Original raster has white/off-white export canvas.
WHITE_PAPER=("T-0003","T-0004","T-0005","T-0008","T-0015","T-0018")
# Original approved black export canvas.
BLACK_PAPER=("T-0007",)
# These eight originally-translucent raster exports contain horizontal
# out-of-silhouette colored bars on the right. Trim only known bad regions,
# preserving the original emblems, horses, names and approved colors.
TRAILING_ARTIFACTS={
 "T-0028": [(0,207,405)],
 "T-0046": [(0,273,379),(336,384,0)],
 "T-0059": [(0,270,375),(0,39,0)],
 "T-0060": [(0,270,376),(0,40,0)],
 "T-0062": [(0,278,379)],
 "T-0063": [(0,280,397)],
}
# Unchanged and already-acceptable transparent track logos:
# T-0002 Belmont, T-0006 Finger Lakes, T-0009 Delaware,
# T-0013 Churchill, T-0014 Keeneland, T-0017 Gulfstream;
# retain their exact colors and geometry.
TRACKS=APPROVED_HERO_AS_LOGO+WHITE_PAPER+BLACK_PAPER+tuple(TRAILING_ARTIFACTS)

def rgba(path):
    with Image.open(path) as im:return im.convert("RGBA")

def original(id):
    result=subprocess.check_output(["git","show",BASE+":"
        +(LOGOS/(id+".webp")).as_posix()],timeout=15)
    with Image.open(BytesIO(result)) as im:return im.convert("RGBA")

def crop_streaks(id,source):
    p=np.array(source,dtype=np.uint8).copy()
    h,w=p.shape[:2]
    for ymin,ymax,xmin in TRAILING_ARTIFACTS[id]:
        lo=max(0,int(ymin*h/384))
        hi=min(h,int(ymax*h/384))
        x0=min(w,max(0,int(xmin*w/512)))
        p[lo:hi,x0:,3]=0
        p[lo:hi,x0:,:3]=0
    return Image.fromarray(p,"RGBA")

def black_cutout(source):
    p=np.array(source,dtype=np.uint8).copy()
    light=p[:,:,:3].max(axis=2).astype(np.float32)
    # Only near-black background goes transparent. Bright/gold/ivory inks
    # never undergo a color-recovery formula that introduces banding.
    alpha=np.clip((light-15)*255/52,0,255).astype(np.uint8)
    p[:,:,3]=np.minimum(p[:,:,3],alpha)
    p[p[:,:,3]<3,:3]=0
    return Image.fromarray(p,"RGBA")

def white_cutout(source):
    p=np.array(source,dtype=np.uint8).copy()
    rgb=p[:,:,:3].astype(np.int16)
    hi=rgb.max(axis=2)
    lo=rgb.min(axis=2)
    neutral=(hi-lo<=39)
    whiteish=(lo>=200)&neutral
    h,w=p.shape[:2]
    border=np.zeros((h,w),dtype=bool)
    border[0]=border[-1]=True
    border[:,0]=border[:,-1]=True
    # Flood ALL exterior paper components from all four edges, not just the
    # largest component. That was the cause of Monmouth's beige rectangle.
    exterior=binary_propagation(border&whiteish,mask=whiteish)
    brightness_distance=np.maximum(0,255-lo).astype(np.float32)
    matte_alpha=np.clip((brightness_distance-9)*255/58,0,255)
    p[:,:,3][exterior]=np.minimum(p[:,:,3][exterior],matte_alpha[exterior].astype(np.uint8))
    p[p[:,:,3]<3,:3]=0
    return Image.fromarray(p,"RGBA")

def checks(id,before,after):
    a=np.array(after.getchannel("A"))
    h,w=a.shape
    corners=[int(a[y,x]) for y,x in
        [(0,0),(0,w-1),(h-1,0),(h-1,w-1)]]
    visible=float((a>=128).mean())
    assert after.size==before.size and visible>.008, (id,"foreground damaged")
    assert max(corners)<50, (id,"outer export matte remains",corners)
    if id in WHITE_PAPER:
        # A large pale paper field touching the right/top edge indicates
        # Monmouth/Keeneland style partial removal. All selected white logos
        # must have nearly zero alpha on large empty corner regions.
        sample=a[:max(1,h//10),:max(1,w//10)]
        assert float((sample>25).mean())<.02, (id,"top-left paper remains")
    if id in TRAILING_ARTIFACTS:
        for y0,y1,x0 in TRAILING_ARTIFACTS[id]:
            region=a[int(y0*h/384):int(y1*h/384),int(x0*w/512):]
            if region.size:assert int(region.max())==0,(id,"stripe remains")
    return {"id":id,"size":list(after.size),
      "visible_percent":round(visible*100,2),"alpha_corners":corners,
      "method":"existing-approved-hero" if id in APPROVED_HERO_AS_LOGO else
        "white-background-source-cutout" if id in WHITE_PAPER else
        "black-background-source-cutout" if id in BLACK_PAPER else
        "out-of-silhouette-stripe-trim"}

def tile(im,label,width=520,height=370):
    canvas=Image.new("RGB",(width,height),"#15372a")
    img=im.copy()
    img.thumbnail((width-18,height-42),Image.Resampling.LANCZOS)
    canvas.paste(img,((width-img.width)//2,24+(height-30-img.height)//2),img)
    ImageDraw.Draw(canvas).text((7,6),label,fill="#ffffff")
    return canvas

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument("--apply",action="store_true")
    args=ap.parse_args()
    OUT.mkdir(parents=True,exist_ok=True)
    samples=[];records=[]
    for id in TRACKS:
        logo=LOGOS/(id+".webp"); hero=HERO/(id+".webp")
        if id in APPROVED_HERO_AS_LOGO:
            assert hero.is_file(),("approved hero missing",id)
            before=rgba(logo)
            after=rgba(hero)
            # The existing hero is the approved alternate identity. It does
            # not need to be resampled, rescaled or recolored.
            if args.apply:shutil.copyfile(hero,logo)
        else:
            before=original(id)
            if id in WHITE_PAPER:after=white_cutout(before)
            elif id in BLACK_PAPER:after=black_cutout(before)
            else:after=crop_streaks(id,before)
            if args.apply:
                after.save(logo,"WEBP",lossless=True,method=6)
                # Repaint profile hero ONLY when it is the SAME damaged
                # track mark, not a separate approved profile identity.
                if hero.exists():after.save(hero,"WEBP",lossless=True,method=6)
        records.append(checks(id,before,after))
        if not args.apply:
            # A green CI check must be based on actual, committed image bytes,
            # not on a hypothetical new output computed in memory.
            committed=np.asarray(rgba(logo))
            expected=np.asarray(after)
            assert committed.shape==expected.shape and np.array_equal(committed,expected), \
                ("committed runtime track logo differs from certified source",id)
            if id not in APPROVED_HERO_AS_LOGO and (HERO/(id+".webp")).exists():
                committed_hero=np.asarray(rgba(HERO/(id+".webp")))
                assert np.array_equal(committed_hero,expected), \
                    ("profile hero differs from corrected track logo",id)
        samples.append((id,before.copy(),after.copy()))
    # Check all other existing track marks without editing them. Already
    # transparent, curated logos must not be repainted by a generic parser.
    all_tracks=sorted(LOGOS.glob("T-*.webp"))
    for source in all_tracks:
        a=np.asarray(rgba(source).getchannel("A"))
        h,w=a.shape
        assert int(max(a[0,0],a[0,w-1],a[h-1,0],a[h-1,w-1]))<75, \
            ("track logo still has an opaque corner canvas",source.name)
    # A contact sheet exposes matte errors more reliably than alpha-only tests.
    grid=Image.new("RGB",(1040,370*len(samples)),"#10251d")
    for i,(id,before,after) in enumerate(samples):
        grid.paste(tile(before,id+" original"),(0,i*370))
        grid.paste(tile(after,id+" repaired"),(520,i*370))
    grid.save(OUT/"full-before-after.jpg",quality=87)
    (OUT/"report.json").write_text(json.dumps({
        "schema":"WTW_FINAL_UI_LOGO_ALPHA_V1","records":records,
        "count":len(records),"originals_retained_in_git":BASE
    },indent=2)+"\n")
    print("WTW_FINAL_UI_LOGO_ALPHA_PASS "+json.dumps({
        "repaired_or_copied":len(records),
        "approved_existing_heroes_reused":len(APPROVED_HERO_AS_LOGO),
        "rebuilt_from_original":len(WHITE_PAPER)+len(BLACK_PAPER),
        "trimmed_original_stripes":len(TRAILING_ARTIFACTS),
        "status":"committed" if args.apply else "verified_not_written"
    }))

if __name__=="__main__":main()
