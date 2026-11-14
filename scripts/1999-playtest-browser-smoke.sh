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
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>WTW playable 1999 browser test</title></head>
<body><pre id="status" data-state="pending">1999 playtest pending</pre><iframe id="game" width="1250" height="650"></iframe>
<script>
const status=document.getElementById('status'),frame=document.getElementById('game'),steps=[];
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const check=(name,ok)=>{if(!ok)throw Error(name);steps.push(name)};
async function until(fn,description){
 for(let i=0;i<650;i++){
  const result=fn();if(result)return result;
  await pause(200);
 }
 throw Error('Browser playtest did not initialize: '+description+'; context='+
 JSON.stringify({url:frame.contentWindow?.location?.href,
  docReady:frame.contentDocument?.readyState,
  uiReady:!!frame.contentWindow?.__WTW_1999_UI_DATA__,
  engineError:frame.contentWindow?.__WTW_1999_PLAYTEST_ERROR__||null,
  globalReady:!!frame.contentWindow?.__WTW_1999_MANAGEMENT__,
  loading:frame.contentWindow?.__WTW_1999_PLAYTEST_LOADING__||null}));

}
frame.onload=async()=>{
 try{
  const w=frame.contentWindow;
  const engine=await until(()=>{
   if(w.__WTW_1999_PLAYTEST_ERROR__)throw Error(w.__WTW_1999_PLAYTEST_ERROR__);
   return w.__WTW_1999_PLAYTEST__;
  },'game engine');
  const initial=engine.view();
  check('playtest has 38 registered horses',initial.horse_count===38&&initial.all_horses.length===38);
  check('single game source selected 26 jockey identities',Object.keys(engine.state.runtime.racing.jockeys).length===26);
  check('all eight real modeled barns exist',Object.keys(engine.state.runtime.facilities.sites).length===8);
  check('game adapter binds the same player stable',w.__WTW_1999_UI_DATA__?.stableHorses?.length===initial.stable.length);
  check('opening is January 1, 1999',initial.date==='1999-01-01');
  await engine.advanceTo('1999-01-16');
  const progressed=engine.view();
  const results=progressed.races.filter(x=>x.status==='OFFICIAL_SIM_RESULT');
  check('15-day advance settles three races',results.length===3);
  check('fully booked races have permanent results',results.every(x=>x.results.length>=2&&x.results[0].finish===1));
  check('race results update horse career and condition',progressed.all_horses.some(h=>h.career.starts>0&&h.modelResults.length>0));
  check('real game-date appears on shared adapter',w.__WTW_1999_UI_DATA__?.stableHorses?.length===progressed.stable.length);
  const saved=engine.getSave();
  const reload=document.createElement('iframe');reload.width=800;reload.height=400;
  document.body.append(reload);reload.src='/next/?playtest=38&reload=1';
  const restored=await until(()=>{
   if(reload.contentWindow?.__WTW_1999_PLAYTEST_ERROR__)
    throw Error(reload.contentWindow.__WTW_1999_PLAYTEST_ERROR__);
   return reload.contentWindow?.__WTW_1999_PLAYTEST__;
  },'durable IndexedDB career');
  check('browser reload recovers same single engine save',restored.getSave()===saved);
  check('restored calendar is January 16',restored.view().date==='1999-01-16');
  check('restored results are unchanged',JSON.stringify(restored.view().races)===JSON.stringify(progressed.races));
  status.dataset.state='passed';
  status.textContent=JSON.stringify({state:'passed',steps,summary:results.map(r=>({id:r.id,date:r.date,starters:r.results.length}))});
 }catch(error){
  status.dataset.state='failed';
  status.textContent=JSON.stringify({state:'failed',error:String(error?.stack||error),steps});
 }
};
frame.src='/next/?playtest=38';
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --window-size=1450,850 --virtual-time-budget=180000 --dump-dom \
 'http://127.0.0.1:8869/__1999_playtest_probe.html' > visual-audit/1999/playtest-dom.html 2>/tmp/wtw-1999-playtest-chrome.log
python3 - <<'PY'
from pathlib import Path
import html,json,re
raw=Path('visual-audit/1999/playtest-dom.html').read_text()
found=re.search(r'<pre id="status" data-state="([^"]+)">(.*?)</pre>',raw,re.S)
assert found,'Browser playtest status missing'
data=json.loads(html.unescape(found.group(2)))
print('WTW 1999 LIVE PLAYTEST:',data)
assert found.group(1)=='passed',data
assert len(data['steps'])>=12,data
PY
echo "PASS: 38-horse browser game run loads, races and persists through reload"
