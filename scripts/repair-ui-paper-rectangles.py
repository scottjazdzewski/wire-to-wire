#!/usr/bin/env python3
"""Remove embedded WHITE PAPER RECTANGLES from two approved 1999 track marks.

Pure presentation assets. Reconstruct from the immutable original at PR #250
base; do not progressively process earlier damaged mattes or recolor artwork.
Keep all permanent IDs, dimensions and filenames.
"""
from __future__ import annotations
import argparse
from collections import deque
from io import BytesIO
from pathlib import Path
import json
import subprocess
import numpy as np
from PIL import Image, ImageDraw

BASE_SHA="6d98025e65dfc6ad74d6e7f9c7815c2ee138f5db"
IDS=("T-0004","T-0014")
LOGOS=Path("public/assets/places/track-logos")
HEROS=Path("public/assets/places/track-hero")
REPORT=Path("visual-audit/asset-transparency/paper-matte-review.json")

def connected_paper_mask(rgba):
    pixels=np.asarray(rgba.convert("RGBA"),dtype=np.uint8)
    h,w=pixels.shape[:2]
    rgb=pixels[:,:,:3].astype(np.int16)
    light=(rgb.min(axis=2)>=224)&((rgb.max(axis=2)-rgb.min(axis=2))<=45)&(pixels[:,:,3]>=225)
    visited=np.zeros((h,w),dtype=np.bool_)
    biggest=None;size=0
    for y in range(h):
        for x in range(w):
            if not light[y,x] or visited[y,x]:continue
            q=deque([y*w+x]);visited[y,x]=True
            points=[]
            minx,maxx,miny,maxy=x,x,y,y
            while q:
                p=q.popleft();cy,cx=divmod(p,w);points.append(p)
                minx=min(minx,cx);maxx=max(maxx,cx)
                miny=min(miny,cy);maxy=max(maxy,cy)
                if cx>0 and light[cy,cx-1] and not visited[cy,cx-1]:visited[cy,cx-1]=True;q.append(p-1)
                if cx+1<w and light[cy,cx+1] and not visited[cy,cx+1]:visited[cy,cx+1]=True;q.append(p+1)
                if cy>0 and light[cy-1,cx] and not visited[cy-1,cx]:visited[cy-1,cx]=True;q.append(p-w)
                if cy+1<h and light[cy+1,cx] and not visited[cy+1,cx]:visited[cy+1,cx]=True;q.append(p+w)
            if len(points)>size:
                biggest=(points,(minx,miny,maxx+1,maxy+1));size=len(points)
    if not biggest or size<h*w*.08:raise RuntimeError("large white paper component not found")
    points,bbox=biggest
    if (bbox[2]-bbox[0])<w*.42 or (bbox[3]-bbox[1])<h*.35:
        raise RuntimeError("candidate is not a broad rectangular export canvas")
    mask=np.zeros((h,w),dtype=np.bool_)
    mask.reshape(-1)[points]=True
    return pixels,mask,bbox,size

def repair(id):
    path=f"{LOGOS}/{id}.webp"
    original=subprocess.check_output(["git","show",f"{BASE_SHA}:{path}"],timeout=12)
    with Image.open(BytesIO(original)) as src:
        rgba=src.convert("RGBA")
    pixels,mask,bbox,size=connected_paper_mask(rgba)
    h,w=pixels.shape[:2]
    before=Image.fromarray(pixels.copy(),"RGBA")
    pixels[mask,3]=0
    pixels[mask,0:3]=0
    # Do NOT flood white details on the horse or in letter counters, which
    # live in separate interior components and are part of the approved mark.
    # Neutralize only near-white, immediate matte fringe along the removed
    # component. Dark green/brown/yellow logo pixels remain unchanged.
    rim=np.zeros_like(mask)
    rim[1:,:]|=mask[:-1,:]
    rim[:-1,:]|=mask[1:,:]
    rim[:,1:]|=mask[:,:-1]
    rim[:,:-1]|=mask[:,1:]
    rim&=~mask
    col=pixels[:,:,:3].astype(np.int16)
    lo=col.min(axis=2);hi=col.max(axis=2)
    pale=rim&(lo>=195)&((hi-lo)<40)
    soft=np.clip((245-lo[pale])*255/50,0,255).astype(np.uint8)
    pixels[:,:,3][pale]=np.minimum(pixels[:,:,3][pale],soft)
    pixels[:,:,:3][pale&(pixels[:,:,3]<4)]=0
    result=Image.fromarray(pixels,"RGBA")
    assert int(np.min(pixels[[0,0,h-1,h-1],[0,w-1,0,w-1],3]))<12
    for p in (LOGOS/f"{id}.webp",HEROS/f"{id}.webp"):
        p.parent.mkdir(parents=True,exist_ok=True)
        result.save(p,"WEBP",lossless=True,method=6)
    return before,result,{"track_id":id,"area_percent":round(size*100/(w*h),2),
                          "paper_bbox":list(bbox),"alpha_corners":[int(pixels[y,x,3]) for y,x in [(0,0),(0,w-1),(h-1,0),(h-1,w-1)]]}

def main():
    ap=argparse.ArgumentParser();ap.add_argument("--apply",action="store_true")
    args=ap.parse_args()
    output=[]
    sheet=Image.new("RGB",(600*2,450*len(IDS)),(23,48,40))
    draw=ImageDraw.Draw(sheet)
    for i,id in enumerate(IDS):
        before,after,report=repair(id) if args.apply else (None,None,None)
        if not args.apply:continue
        for j,img in enumerate((before,after)):
            img.thumbnail((570,408))
            x=j*600+(600-img.width)//2
            y=i*450+35+(410-img.height)//2
            sheet.paste(img,(x,y),img)
            draw.text((j*600+10,i*450+8),id+(" · BEFORE" if j==0 else " · CORRECTED TRANSPARENT"),fill="white")
        output.append(report)
    REPORT.parent.mkdir(parents=True,exist_ok=True)
    REPORT.write_text(json.dumps({"schema":"WTW_UI_PAPER_ALPHA_V1","results":output},indent=2)+"\n")
    if args.apply:sheet.save(REPORT.parent/"paper-matte-before-after.jpg",quality=90)
    print("WTW_UI_PAPER_MATTE_PASS "+json.dumps(output))

if __name__=="__main__":main()
