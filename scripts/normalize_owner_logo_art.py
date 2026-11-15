#!/usr/bin/env python3
"""Deterministic, non-destructive logo frame standardization for WTW.

Inputs come from a pinned git revision (approved image bytes), not the current
output. This prevents cumulative loss on repeat runs. Every file gets one exact
256-square opaque frame, same radius, same border stroke and color.
"""
import argparse
import hashlib
import io
import json
from collections import deque
from pathlib import Path
import subprocess
from PIL import Image, ImageDraw

SIZE = 256
RADIUS = 28
STROKE = 5
INSET = 5
IVORY = (244, 237, 222)
CORNER = (6, 7, 9)
EXCLUSION = 33
RENDER_SCALE = 4
PATH_PREFIX = 'public/assets/office/founding-organization-logos/'
DEFAULT_SOURCE_REV = '7ed6774c8bc4fa660f382251d74bac3e8993bb23'

def source_png(revision, path):
    data = subprocess.check_output(['git', 'show', f'{revision}:{path}'])
    source = Image.open(io.BytesIO(data))
    source.load()
    if source.size != (SIZE, SIZE):
        raise ValueError(f'{path}: expected {SIZE}x{SIZE}, got {source.size}')
    return data, source.convert('RGB')

def bg_color(im):
    pix = im.load()
    points = [(x, y) for x, y in ((36,36),(128,28),(219,36),
        (36,219),(128,228),(219,219),(28,128),(228,128))]
    # Ignore points with strong local contrast (lettering on the boundary).
    candidate = [pix[x,y] for x,y in points]
    def score(c):
        return sum(sorted((sum(abs(c[k]-other[k]) for k in range(3))
                           for other in candidate))[:5])
    return min(candidate,key=score)

def remove_connected_old_frames(im, bg):
    w, h = im.size
    p = im.load()
    eligible = bytearray(w*h)
    for y in range(h):
        for x in range(w):
            if min(x,y,w-1-x,h-1-y) > EXCLUSION:
                continue
            c = p[x,y]
            if sum(abs(c[k]-bg[k]) for k in range(3)) >= 55:
                eligible[y*w+x] = 1
    seen = bytearray(w*h)
    erase = bytearray(w*h)
    removed = 0
    for start in range(w*h):
        if not eligible[start] or seen[start]:
            continue
        q = deque([start]);seen[start] = 1; comp=[]; sides=set()
        min_x=min_y=999;max_x=max_y=-1
        while q:
            i=q.popleft();comp.append(i);x=i%w;y=i//w
            min_x=min(min_x,x);max_x=max(max_x,x)
            min_y=min(min_y,y);max_y=max(max_y,y)
            if x < 22:sides.add('left')
            if x > 233:sides.add('right')
            if y < 22:sides.add('top')
            if y > 233:sides.add('bottom')
            for nxt in (i-1 if x>0 else -1, i+1 if x<w-1 else -1,
                        i-w if y>0 else -1, i+w if y<h-1 else -1):
                if nxt >= 0 and eligible[nxt] and not seen[nxt]:
                    seen[nxt]=1;q.append(nxt)
        # Outer ring has a broad coherent arch; isolated emblems stay untouched.
        if len(sides) >= 2 and (max_x-min_x > 115 or max_y-min_y > 115) and len(comp)>=90:
            for i in comp:erase[i]=1
            removed += len(comp)
    # Repaint old border antialiasing too, but never touch interior art.
    widened=erase[:]
    for i, value in enumerate(erase):
        if not value:continue
        x=i%w;y=i//w
        for yy in range(max(0,y-1),min(h,y+2)):
            for xx in range(max(0,x-1),min(w,x+2)):
                if min(xx,yy,w-1-xx,h-1-yy)<=EXCLUSION:
                    widened[yy*w+xx]=1
    result=im.copy();dst=result.load()
    for i,v in enumerate(widened):
        if v:dst[i%w,i//w]=bg
    return result,removed

def render_frame(source):
    bg=bg_color(source)
    clean,old_pixels=remove_connected_old_frames(source,bg)
    mask=Image.new('L',(SIZE*RENDER_SCALE,SIZE*RENDER_SCALE),0)
    md=ImageDraw.Draw(mask)
    md.rounded_rectangle((2*RENDER_SCALE,2*RENDER_SCALE,
                          (SIZE-3)*RENDER_SCALE,(SIZE-3)*RENDER_SCALE),
                         radius=RADIUS*RENDER_SCALE,fill=255)
    mask=mask.resize((SIZE,SIZE),Image.Resampling.LANCZOS)
    final=Image.new('RGB',(SIZE,SIZE),CORNER)
    final.paste(clean,(0,0),mask)
    frame=Image.new('RGBA',(SIZE*RENDER_SCALE,SIZE*RENDER_SCALE),(0,0,0,0))
    fd=ImageDraw.Draw(frame)
    fd.rounded_rectangle((INSET*RENDER_SCALE,INSET*RENDER_SCALE,
                          (SIZE-INSET-1)*RENDER_SCALE,(SIZE-INSET-1)*RENDER_SCALE),
                         radius=RADIUS*RENDER_SCALE,
                         outline=(*IVORY,255),width=STROKE*RENDER_SCALE)
    frame=frame.resize((SIZE,SIZE),Image.Resampling.LANCZOS)
    final=Image.alpha_composite(final.convert('RGBA'),frame).convert('RGB')
    assert final.size==(256,256)
    assert final.getpixel((0,0))==CORNER
    # The exact same fully covered 5px ivory stroke at the four side centers.
    for xy in ((128,6),(128,7),(6,128),(7,128),(249,128),(248,128),(128,249),(128,248)):
        assert max(abs(final.getpixel(xy)[k]-IVORY[k]) for k in range(3))<=2,xy
    return final,{'background':list(bg),'old_frame_pixels_removed':old_pixels}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--source-rev',default=DEFAULT_SOURCE_REV)
    ap.add_argument('--mode',choices=['preview','write','verify'],default='preview')
    ap.add_argument('--preview-dir',default='/tmp/wtw-logo-frame-proof')
    args=ap.parse_args()
    index=json.loads(Path('public/assets/office/founding-organization-logo-index.json').read_text())
    paths=sorted('public'+p for p in index['organizations'].values())
    if len(paths)!=31:
        raise ValueError(f'Unexpected approved count {len(paths)}; update source manifest deliberately')
    thumbs=[];records=[]
    proofdir=Path(args.preview_dir);proofdir.mkdir(parents=True,exist_ok=True)
    for path in paths:
        original,im=source_png(args.source_rev,path)
        out,meta=render_frame(im)
        tmp=proofdir / Path(path).name
        out.save(tmp,optimize=True)
        processed=tmp.read_bytes()
        if args.mode=='write':Path(path).write_bytes(processed)
        if args.mode=='verify' and Path(path).read_bytes()!=processed:
            raise RuntimeError(f'{path}: output does not match deterministic production spec')
        records.append({'path':path,'source_sha256':hashlib.sha256(original).hexdigest(),
            'output_sha256':hashlib.sha256(processed).hexdigest(),**meta})
        old=im.resize((164,164),Image.Resampling.LANCZOS)
        new=out.resize((164,164),Image.Resampling.LANCZOS)
        thumbs.append((Path(path).stem,old,new))
    # Layout full-size before/after columns without clipping.
    sheet=Image.new('RGB',(4*360,((len(thumbs)+3)//4)*216),'#202329')
    draw=ImageDraw.Draw(sheet)
    for i,(name,old,new) in enumerate(thumbs):
        x=(i%4)*360;y=(i//4)*216
        sheet.paste(old,(x+8,y+28));sheet.paste(new,(x+187,y+28))
        draw.text((x+8,y+6),name+'   before  /  standard',fill='#f6f0e6')
    sheet.save(proofdir/'all-31-before-after.png',optimize=True)
    contract={'schema':'WTW_APPROVED_OWNER_FRAME_V1','source_revision':args.source_rev,
      'canvas_px':256,'image_mode':'RGB','radius_px':RADIUS,'border_px':STROKE,
      'border_inset_px':INSET,'border_rgb':list(IVORY),'outer_corners_rgb':list(CORNER),
      'approved_logo_count':len(paths),'assets':records}
    (proofdir/'audit.json').write_text(json.dumps(contract,indent=2)+'\n')
    if args.mode=='write':
        Path('ops/owner-logo-frame-v1.json').write_text(json.dumps(contract,indent=2)+'\n')
        lockpath=Path('ops/approved-visual-assets.lock.json')
        lock=json.loads(lockpath.read_text())
        for path in paths:
            sha=subprocess.check_output(['git','hash-object',path],text=True).strip()
            lock['assets'][path]=sha
        lock['assets']=dict(sorted(lock['assets'].items()))
        lockpath.write_text(json.dumps(lock,indent=2)+'\n')
    print(json.dumps({'mode':args.mode,'processed':len(paths),
        'total_old_border_pixels':sum(r['old_frame_pixels_removed'] for r in records),
        'sheet':str(proofdir/'all-31-before-after.png')}))
if __name__=='__main__':main()