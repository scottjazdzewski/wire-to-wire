#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable"; exit 1; }
mkdir -p visual-audit/1999
python3 -m http.server 8869 --bind 127.0.0.1 --directory public >/tmp/wtw-1999-playtest-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f public/__1999_playtest_probe.html' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8869/next/' >/dev/null 2>&1 && break; sleep .2; done
cat > public/__1999_playtest_probe.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>1999 isolated career engine</title></head>
<body><pre id="status" data-state="pending">1999 playtest pending</pre>
<script type="module">
import {bootBrowserPlaytest1999,createPlaytestCareer,PLAYTEST_KEY,PLAYTEST_STORAGE}
 from '/1999/game/playtest-service.mjs';
const status=document.getElementById('status'),steps=[];
function check(name,pass){if(!pass)throw Error(name);steps.push(name)}
async function getSaved(){
 const db=await new Promise((resolve,reject)=>{
  const request=indexedDB.open(PLAYTEST_STORAGE,1);
  request.onerror=()=>reject(request.error);
  request.onsuccess=()=>resolve(request.result);
 });
 const data=await new Promise((resolve,reject)=>{
  const tx=db.transaction('careers','readonly'),req=tx.objectStore('careers').get(PLAYTEST_KEY);
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error);
 });
 db.close();return data;
}
try{
 const engine=await bootBrowserPlaytest1999();
 check('opted-in game engine initialized',!!engine);
 const initial=engine.view();
 check('38 registered game horses',initial.horse_count===38);
 check('26 selected jockey agents',Object.keys(engine.state.runtime.racing.jockeys).length===26);
 check('8 staffed physical barn records',Object.keys(engine.state.runtime.facilities.sites).length===8);
 check('clean founding history is not modified',initial.source_history_modified===false);
 await engine.advanceTo('1999-01-16');
 const latest=engine.view(),results=latest.races.filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 check('15-day game clock advances',latest.date==='1999-01-16');
 check('3 source-calendar game races settled',results.length===3);
 check('race results change actual horse careers',latest.all_horses.filter(h=>h.career.starts>0).length===27);
 const saved=await getSaved();
 check('IndexedDB contains committed career save',saved?.save===engine.getSave());
 const resources=await Promise.all([
  fetch('/data/wtw-1999-founding-directory-v1.json').then(r=>r.json()),
  fetch('/data/wtw-1999-trainer-pilot-v1.json').then(r=>r.json()),
  fetch('/data/wtw-1999-jockey-pilot-v1.json').then(r=>r.json()),
  fetch('/data/wtw-1999-playtest-cohort-38-v1.json').then(r=>r.json())
 ]);
 const restored=await createPlaytestCareer({
  directory:resources[0],trainers:resources[1],jockeys:resources[2],
  cohort:resources[3],save:saved.save});
 check('IndexedDB save rehydrates identical engine state',restored.getSave()===engine.getSave());
 check('restored race and finances remain identical',JSON.stringify(restored.view())===JSON.stringify(latest));
 status.dataset.state='passed';
 status.textContent=JSON.stringify({state:'passed',steps,races:results.map(r=>({
  id:r.id,date:r.date,starters:r.results.length}))});
}catch(error){
 status.dataset.state='failed';
 status.textContent=JSON.stringify({state:'failed',steps,error:String(error?.stack||error),
  stage:globalThis.__WTW_1999_PLAYTEST_LOADING__||'NOT_STARTED'});
}
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --window-size=1450,850 --virtual-time-budget=60000 --dump-dom \
 'http://127.0.0.1:8869/__1999_playtest_probe.html?playtest=38' > visual-audit/1999/playtest-dom.html 2>/tmp/wtw-1999-playtest-chrome.log
python3 - <<'PY'
from pathlib import Path
import html,json,re
raw=Path('visual-audit/1999/playtest-dom.html').read_text()
found=re.search(r'<pre id="status" data-state="([^"]+)">(.*?)</pre>',raw,re.S)
assert found,'Browser playtest status missing'
data=json.loads(html.unescape(found.group(2)))
print('WTW 1999 PLAYTEST ENGINE:',data)
assert found.group(1)=='passed',data
assert len(data['steps'])>=11,data
PY
echo "PASS: 38-horse real-browser game engine and IndexedDB save rehydration"
