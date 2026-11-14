#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$CHROME" ]]; then echo "Browser unavailable: cannot visually validate" >&2; exit 1; fi
mkdir -p visual-audit/screenshots visual-audit/dom
python3 -m http.server 8765 --bind 127.0.0.1 --directory public >/tmp/wtw-visual-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8765/' >/dev/null 2>&1 && break; sleep .5; done

capture(){
  local name="$1" route="$2" marker="$3" target="$2"
  # The management app now lives at /next/; the root forwards there.
  # Go directly to /next/ so route-specific query strings survive.
  if [[ "$route" != archive/* ]]; then target="next/$route"; fi
  echo "Rendering $name -> /$target"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --screenshot="visual-audit/screenshots/$name.png" \
    "http://127.0.0.1:8765/$target" >/tmp/wtw-chrome-"$name".log 2>&1
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --dump-dom \
    "http://127.0.0.1:8765/$target" >"visual-audit/dom/$name.html" 2>/tmp/wtw-dom-"$name".log
  if ! grep -Eq "$marker" "visual-audit/dom/$name.html"; then
    echo "RENDER FAILURE: $name missing $marker" >&2
    tail -35 /tmp/wtw-dom-"$name".log || true
    exit 1
  fi
  test -s "visual-audit/screenshots/$name.png"
}
capture racing-office '' 'ng-board'
capture global-search '?ui=Search' 'ng-search-roster-page'
capture horse-profile '?page=horse&name=The+Last+Match' 'ng-horse-dossier'
capture people-profile '?ui=WorldRecord%3Aperson%3AP-000018' 'ng-person-horse-dossier'
capture founder-owner '?ui=FoundingProfile%3Aownership%3AO-000014' 'ng-track-workspace'
capture founder-facility '?ui=FoundingProfile%3Afacility%3AO-000068' 'ng-track-workspace'
capture aqueduct-track '?ui=WorldRecord%3Atrack%3AT-0001' 'ng-profile-track'
capture gulfstream-track '?ui=WorldRecord%3Atrack%3AT-0017' 'ng-profile-track'
capture kingsmere-farm '?ui=FoundingProfile%3Afacility%3AO-000061' 'ng-profile-farm'
capture northbank-stable '?ui=FoundingProfile%3Aownership%3AO-000045' 'ng-profile-farm'
capture personnel '?ui=Personnel' 'ng-manager-screen|ng-dept-roster'
capture facilities '?ui=Facilities' 'ng-manager-screen|ng-dept-roster'
capture finances '?ui=Finances' 'ng-manager-screen|ng-dept-roster'
capture breeding '?ui=Breeding' 'ng-manager-screen|ng-dept-roster'
capture history-vault 'archive/' 'History Vault'
# Browser geometry probe: screenshot files alone cannot detect a collapsed
# CSS media scope. Measure the *rendered* game viewport at desktop resolution.
cat > public/__wtw_visual_probe.html <<'HTML'
<!doctype html>
<html><head><meta charset="utf-8"><title>WTW desktop geometry</title></head>
<body style="margin:0"><iframe id="game" style="display:block;border:0;width:100vw;height:100vh"></iframe>
<pre id="measure">pending</pre>
<script>
const frame=document.getElementById('game');
const route=new URLSearchParams(location.search).get('route')||'';
frame.onload=()=>setTimeout(()=>{
 try{
  const d=frame.contentDocument,win=frame.contentWindow;
  const rect=selector=>{
   const element=d.querySelector(selector);
   if(!element)return null;
   const b=element.getBoundingClientRect();
   return {width:Math.round(b.width),height:Math.round(b.height),
    left:Math.round(b.left),top:Math.round(b.top),
    right:Math.round(b.right),bottom:Math.round(b.bottom),
    clientWidth:element.clientWidth,scrollWidth:element.scrollWidth,
    display:win.getComputedStyle(element).display};
  };
  const result={
   route,rail:rect('.ng-game-rail'),
   stage:rect('.ng-manager-stage'),
   brand:rect('.ng-manager-rail-brand img'),
   shell:rect('.ng-manager-shell'),
   header:rect('.ng-global'),
   page:rect('.ng-board')||rect('.ng-routegrid'),
   horse:rect('.ng-horse-dossier'),
   search:rect('.ng-search-roster-page'),
   people:rect('.ng-person-horse-dossier'),
   profile:rect('.ng-route-profile .ng-profile-view'),
   intro:rect('.ng-route-profile .ng-profile-intro'),
   identity:rect('.ng-route-profile .ng-profile-identity'),
   heroMark:rect('.ng-route-profile .ng-profile-source-photo'),
   localNavigation:rect('.ng-route-profile .ng-profiletabs')||rect('.ng-route-profile .ng-person-dossierbar'),
   profileName:d.querySelector('.ng-route-profile .ng-profile-identity h2')?.textContent?.trim()||'',
   sourceBridgeVisible:win.getComputedStyle(d.querySelector('.app')).display!=='none',
   duplicateGlobalMenuVisible:[...d.querySelectorAll('#wtwNextgen > .ng-subbar')]
    .some(n=>win.getComputedStyle(n).display!=='none'),
   metadataClipped:[...d.querySelectorAll('.ng-route-profile .ng-tier1-biography strong')]
    .filter(n=>n.clientWidth>0&&n.scrollWidth>n.clientWidth+4)
    .map(n=>n.textContent.trim().slice(0,60))
  };
  const node=document.getElementById('measure');
  node.dataset.check='ready';
  node.textContent=JSON.stringify(result);
 }catch(e){const node=document.getElementById('measure');node.dataset.check='error';node.textContent=String(e)}
},700);
frame.src='/next/'+route;
</script></body></html>
HTML
probe(){
  local key="$1" route="$2" viewport="${3:-1536,864}"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size="$viewport" --virtual-time-budget=5000 \
    --dump-dom "http://127.0.0.1:8765/__wtw_visual_probe.html?route=$route" \
    >"visual-audit/dom/probe-$key.html" 2>"/tmp/wtw-probe-$key.log"
}
probe office ''
probe search '%3Fui%3DSearch'
probe horse '%3Fpage%3Dhorse%26name%3DThe%2BLast%2BMatch'
probe person '%3Fui%3DWorldRecord%253Aperson%253AP-000018'
probe aqueduct '%3Fui%3DWorldRecord%253Atrack%253AT-0001'
probe gulfstream '%3Fui%3DWorldRecord%253Atrack%253AT-0017'
probe farm '%3Fui%3DFoundingProfile%253Afacility%253AO-000061'
probe stable '%3Fui%3DFoundingProfile%253Aownership%253AO-000045'
probe owner '%3Fui%3DFoundingProfile%253Aownership%253AO-000014'
probe laptop-horse '%3Fpage%3Dhorse%26name%3DThe%2BLast%2BMatch' '1280,800'
probe laptop-person '%3Fui%3DWorldRecord%253Aperson%253AP-000018' '1280,800'
probe laptop-aqueduct '%3Fui%3DWorldRecord%253Atrack%253AT-0001' '1280,800'
probe laptop-farm '%3Fui%3DFoundingProfile%253Afacility%253AO-000061' '1280,800'
probe laptop-owner '%3Fui%3DFoundingProfile%253Aownership%253AO-000014' '1280,800'
python3 - <<'PY'
import json,html,re
from pathlib import Path
for name in ('office','search','horse','person'):
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source, (name,'Geometry probe did not complete')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Geometry result missing')
 data=json.loads(html.unescape(match.group(1)))
 rail,stage,brand=data['rail'],data['stage'],data['brand']
 assert rail and 145<=rail['width']<=205 and rail['height']>=600,(name,'Sidebar not in desktop scope',rail)
 assert stage and stage['width']>=1130 and stage['height']>=600,(name,'Content stage collapsed',stage)
 assert brand and 16<=brand['width']<=50 and 16<=brand['height']<=55,(name,'Sidebar crest escaped fixed dimensions',brand)
 assert data['page'] and data['page']['width']>=1000,(name,'Route workspace not using the game stage')
 if name=='horse':assert data['horse'] and data['horse']['width']>=990,(name,'Horse dossier not visible')
 if name=='search':assert data['search'] and data['search']['width']>=990,(name,'Search roster not visible')
 if name=='person':assert data['people'] and data['people']['width']>=990,(name,'People Horse-dossier not visible')
 print('VISUAL GEOMETRY',name,'rail',rail['width'],'stage',stage['width'],'crest',brand['width'])
# Same core chrome, record controls and protected identity space across profiles.
profiles=('horse','person','aqueduct','gulfstream','farm','stable','owner',
          'laptop-horse','laptop-person','laptop-aqueduct','laptop-farm','laptop-owner')
rows=[]
for name in profiles:
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'Profile geometry inspection failed')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Missing profile geometry')
 d=json.loads(html.unescape(match.group(1)))
 assert d['rail'] and d['header'] and d['stage'],(name,'Shared management shell missing')
 assert d['profile'] and d['intro'],(name,'Profile does not use the shared identity shell')
 assert d['profileName'] and not any(x in d['profileName'] for x in ('WorldRecord:','FoundingProfile:')),(name,'Raw route shown as profile identity')
 assert d['localNavigation'],(name,'Profile local navigation absent')
 assert not d['sourceBridgeVisible'],(name,'Obsolete Office screen returned')
 assert not d['duplicateGlobalMenuVisible'],(name,'Redundant top menu returned')
 assert not d['metadataClipped'],(name,'Track/farm metadata clipped',d['metadataClipped'])
 assert d['intro']['width']>=min(850,d['stage']['width']*.7),(name,'Identity band too narrow')
 if name in ('aqueduct','gulfstream','farm','stable','owner','laptop-aqueduct','laptop-farm','laptop-owner'):
  if d['heroMark'] and d['identity']:
   assert d['identity']['right']<=d['heroMark']['left']+6,(name,'Logo occupies metadata space')
 rows.append({'name':name,**d})
for family in ('desktop','laptop'):
 sample=[r for r in rows if r['name'].startswith('laptop-')==(family=='laptop')]
 widths=[r['rail']['width'] for r in sample]
 assert max(widths)-min(widths)<=5,(family,'Department rail changes across profiles',widths)
 starts=[r['rail']['left'] for r in sample]
 assert max(starts)-min(starts)<=5,(family,'Department rail position changes across profiles')
print('UNIFIED PROFILE GEOMETRY VERIFIED:',len(rows),'rendered views')
for d in rows:
 print('PROFILE',d['name'],d['profileName'][:35], 'stage',d['stage']['width'],
       'identity',d['intro']['width'],'local nav',d['localNavigation']['width'])
Path('visual-audit/dom/profile-uniformity-metrics.json').write_text(json.dumps(rows,indent=2))
PY
rm -f public/__wtw_visual_probe.html

python3 - <<'PY'
import os,struct
folder='visual-audit/screenshots'
for file in sorted(os.listdir(folder)):
  path=os.path.join(folder,file)
  with open(path,'rb') as f:
    sig=f.read(24)
  assert sig[:8]==b'\x89PNG\r\n\x1a\n',(file,'bad PNG')
  w,h=struct.unpack('>II',sig[16:24])
  assert w>=1200 and h>=700,(file,w,h)
  print(f'{file}: {w}x{h} ({os.path.getsize(path)} bytes)')
PY
echo "All desktop render routes captured. Screenshots require human comparison to visual references."
