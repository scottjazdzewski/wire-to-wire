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
  local name="$1" route="$2" marker="$3"
  echo "Rendering $name -> $route"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --screenshot="visual-audit/screenshots/$name.png" \
    "http://127.0.0.1:8765/$route" >/tmp/wtw-chrome-"$name".log 2>&1
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --dump-dom \
    "http://127.0.0.1:8765/$route" >"visual-audit/dom/$name.html" 2>/tmp/wtw-dom-"$name".log
  if ! grep -q "$marker" "visual-audit/dom/$name.html"; then
    echo "RENDER FAILURE: $name missing $marker" >&2
    tail -35 /tmp/wtw-dom-"$name".log || true
    exit 1
  fi
  test -s "visual-audit/screenshots/$name.png"
}
capture racing-office '' 'ng-board'
capture global-search '?ui=Search' 'ng-search-roster-page'
capture horse-profile '?page=horse&name=The+Last+Match' 'ng-horse-dossier'
capture people-profile '?page=person&name=Gabe+Larkin' 'ng-person-workspace-overview'
capture personnel '?ui=Personnel' 'ng-manager-screen'
capture facilities '?ui=Facilities' 'ng-manager-screen'
capture finances '?ui=Finances' 'ng-manager-screen'
capture breeding '?ui=Breeding' 'ng-manager-screen'
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
   people:rect('.ng-person-workspace-overview')
  };
  const node=document.getElementById('measure');
  node.dataset.check='ready';
  node.textContent=JSON.stringify(result);
 }catch(e){const node=document.getElementById('measure');node.dataset.check='error';node.textContent=String(e)}
},700);
frame.src='/'+route;
</script></body></html>
HTML
probe(){
  local key="$1" route="$2"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 --virtual-time-budget=5000 \
    --dump-dom "http://127.0.0.1:8765/__wtw_visual_probe.html?route=$route" \
    >"visual-audit/dom/probe-$key.html" 2>"/tmp/wtw-probe-$key.log"
}
probe office ''
probe search '%3Fui%3DSearch'
probe horse '%3Fpage%3Dhorse%26name%3DThe%2BLast%2BMatch'
probe person '%3Fpage%3Dperson%26name%3DGabe%2BLarkin'
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
 if name=='person':assert data['people'] and data['people']['width']>=990,(name,'People dossier not visible')
 print('VISUAL GEOMETRY',name,'rail',rail['width'],'stage',stage['width'],'crest',brand['width'])
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
