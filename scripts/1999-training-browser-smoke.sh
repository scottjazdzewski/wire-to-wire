#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable"; exit 1; }
mkdir -p visual-audit/training-1999
python3 -m http.server 8872 --bind 127.0.0.1 --directory public >/tmp/wtw-training-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f public/__training_1999_probe.html' EXIT
for i in {1..40}; do curl -fsS http://127.0.0.1:8872/next/ >/dev/null 2>&1 && break; sleep .2; done
cat > public/__training_1999_probe.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>WTW 1999 Horse Development Smoke</title></head>
<body><pre id="result" data-state="pending">Training smoke pending</pre>
<iframe id="game" width="1450" height="810" style="border:0"></iframe>
<script>
const frame=document.getElementById('game'),result=document.getElementById('result');
const steps=[];let phase=0;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(text,condition)=>{if(!condition)throw Error(text);steps.push(text)};
frame.addEventListener('load',()=>setTimeout(async()=>{
 try{
  const w=frame.contentWindow,d=frame.contentDocument,ui=w.__WTW_1999_UI_DATA__;
  check('Existing premium 1999 FM/OOTP interface loads',Boolean(d.querySelector('#wtwNextgen .ng-manager-shell')));
  check('Training module remains available for later registration',Boolean(ui?.horseTraining&&ui?.assignTraining&&ui?.trainingCosts));
  const key=w.__WTW_1999_MANAGEMENT__?.saveKey;
  check('Clean founding career uses only new approved save namespace',key==='wtw1999FoundingStateV1');
  const game=JSON.parse(w.localStorage.getItem(key)||'null');
  check('Opening remains January 1, 1999',game?.worldAnchor?.startDate==='1999-01-01');
  check('No imported generated owner finances or horse portfolio',(!ui.stableHorses||ui.stableHorses.length===0));
  if(phase===0){
   const stable=[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].find(n=>n.dataset.val==='Stable');
   check('Stable menu remains available',Boolean(stable));stable.click();await pause(350);
   const filter=d.querySelector('#wtwNextgen [data-ng="stable-filter"][data-val="training"]');
   check('Stable retains its original Training view',Boolean(filter));filter.click();await pause(350);
   check('Existing training table renders without invented horses',Boolean(d.querySelector('.ng-training-table')));
   check('No fake horse-specific speed-program controls',!d.querySelector('[data-ng="training-set"]'));
   check('Zero unapproved training expenses in opening save',!(game?.horseDevelopment?.totalSpent>0));
   const go=d.querySelector('#wtwNextgen [data-ng="action"][data-val="Continue"]');
   check('Continue action remains available',Boolean(go));go.click();await pause(800);
   const progressed=JSON.parse(w.localStorage.getItem(key));
   check('A day can be advanced with no registered racehorses',progressed.date==='1999-01-02');
   check('Empty horse roster creates no horse-specific training charges',
    !(progressed.horseDevelopment?.totalSpent>0)&&
    !(progressed.horseDevelopment?.ledger?.some(e=>e.charges?.length>0)));
   phase=1;frame.src='/next/?world=1999&training-check=reload';
  }else{
   const restored=JSON.parse(w.localStorage.getItem(key));
   check('Reload preserves date and does not resurrect old save',restored.date==='1999-01-02');
   check('Reload does not import synthetic training costs',!(restored.horseDevelopment?.totalSpent>0));
   check('Reopened stable remains truly empty',!ui.stableHorses?.length);
   result.dataset.state='passed';result.textContent=JSON.stringify({state:'passed',steps});
  }
 }catch(error){
  result.dataset.state='failed';
  result.textContent=JSON.stringify({state:'failed',error:String(error),phase,steps});
 }
},2600));
frame.src='/next/?world=1999';
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --window-size=1550,900 --virtual-time-budget=35000 --dump-dom \
 'http://127.0.0.1:8872/__training_1999_probe.html' \
 > visual-audit/training-1999/smoke-dom.html 2>/tmp/wtw-training-chrome.log
python3 - <<'PY'
from pathlib import Path
import html,json,re
source=Path('visual-audit/training-1999/smoke-dom.html').read_text()
hit=re.search(r'<pre id="result" data-state="([^"]+)">(.*?)</pre>',source,re.S)
assert hit,'Training browser status missing'
result=json.loads(html.unescape(hit.group(2)))
print('1999 training browser test:',result)
assert hit.group(1)=='passed',result
assert len(result['steps'])>=13,len(result['steps'])
PY
echo "PASS: clean stable remains empty through day advancement and reload; training available for future horses"
