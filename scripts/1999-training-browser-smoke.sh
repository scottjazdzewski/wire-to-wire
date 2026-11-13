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
const steps=[];let phase=0,targetId=null,initialSpend=null;
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(text,condition)=>{if(!condition)throw Error(text);steps.push(text)};
frame.addEventListener('load',()=>setTimeout(async()=>{
 try{
  const w=frame.contentWindow,d=frame.contentDocument,ui=w.__WTW_1999_UI_DATA__;
  check('1999 premium management UI loaded',Boolean(d.querySelector('#wtwNextgen .ng-manager-shell')));
  check('Training adapter module loaded',Boolean(ui?.horseTraining&&ui?.assignTraining&&ui?.trainingCosts));
  const key=w.__WTW_1999_MANAGEMENT__?.saveKey;
  check('Training uses isolated founding-world save, not the retired 325k namespace',key==='wtw1999FoundingStateV1');
  if(phase===0){
   check('Clean January 1999 opening',JSON.parse(w.localStorage.getItem(key)).date==='1999-01-01');
   const stable=[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].find(n=>n.dataset.val==='Stable');
   check('Stable menu exists',Boolean(stable));stable.click();await pause(350);
   const filter=d.querySelector('#wtwNextgen [data-ng="stable-filter"][data-val="training"]');
   check('Training is accessible within Stable',Boolean(filter));filter.click();await pause(350);
   check('Actual workout table rendered',Boolean(d.querySelector('.ng-training-table')));
   const h=ui.stableHorses.find(h=>ui.horseTraining(h.horseId)?.status==='ACTIVE');
   check('Active owned horse available',Boolean(h));targetId=h.horseId;
   const button=[...d.querySelectorAll('[data-ng="training-set"]')].find(
    n=>n.dataset.horseId===targetId&&n.dataset.val==='SPEED');
   check('Horse-specific speed plan control exists',Boolean(button));
   button.click();await pause(250);
   const assigned=JSON.parse(w.localStorage.getItem(key));
   check('Workout program saved under source horse ID',assigned.horseDevelopment?.horses?.[targetId]?.plan==='SPEED');
   const go=d.querySelector('#wtwNextgen [data-ng="action"][data-val="Continue"]');
   check('Continue control exists',Boolean(go));go.click();await pause(900);
   const advanced=JSON.parse(w.localStorage.getItem(key));
   check('Continue advances game date',advanced.date==='1999-01-02');
   check('Daily program processed on Continue',advanced.horseDevelopment?.processedThrough==='1999-01-02');
   check('Exactly one daily training expense posted',advanced.horseDevelopment.ledger.length===1);
   check('Trainer chosen program preserved',advanced.horseDevelopment.horses[targetId].plan==='SPEED');
   check('Expense ledger has nonzero costs',advanced.horseDevelopment.totalSpent>0);
   initialSpend=advanced.horseDevelopment.totalSpent;
   // Jump the authoritative career save forward: the same mechanism must
   // deterministically settle every missed day on the next UI projection.
   advanced.date='1999-01-31';
   w.localStorage.setItem(key,JSON.stringify(advanced));
   ui.setGameDate('1999-01-31');
   const settled=JSON.parse(w.localStorage.getItem(key));
   check('Full 30 days settled in one save',settled.horseDevelopment?.ledger?.length===30);
   check('30-day horse record moved with calendar',settled.horseDevelopment?.horses?.[targetId]?.history?.length===30);
   check('Costs accrued without pre-posted results',settled.horseDevelopment.totalSpent>initialSpend&&
    settled.worldAnchor.lastCommittedRaceResult===null);
   const cost=settled.horseDevelopment.totalSpent;
   ui.setGameDate('1999-01-31');
   check('Repeat render never charges a day twice',JSON.parse(w.localStorage.getItem(key)).horseDevelopment.totalSpent===cost);
   phase=1;frame.src='/next/?world=1999&training-check=reload';
  }else{
   const restored=JSON.parse(w.localStorage.getItem(key));
   check('Reload retains the 30-day career date',restored.date==='1999-01-31');
   check('Reload retains exact training expense postings',restored.horseDevelopment.ledger.length===30);
   check('Reload retains chosen program',restored.horseDevelopment.horses[targetId].plan==='SPEED');
   check('Reload does not recreate training ledger',ui.trainingCosts().entries===30);
   check('Source horse ID survived reload',ui.horseTraining(targetId)?.horseId===targetId);
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
assert len(result['steps'])>=23,len(result['steps'])
PY
echo "PASS: stable training assignment, 30-day settlement, persistence, UI refresh"
