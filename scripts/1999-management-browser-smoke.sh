#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable; 1999 management smoke test cannot run"; exit 1; }
mkdir -p visual-audit/1999
python3 -m http.server 8866 --bind 127.0.0.1 --directory public >/tmp/wtw-1999-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f public/__1999_ui_probe.html' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8866/next/' >/dev/null 2>&1 && break; sleep .2; done
cat > public/__1999_ui_probe.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>1999 Office smoke</title></head>
<body><pre id="status" data-state="pending">1999 Office pending</pre>
<iframe id="game" width="1450" height="800" style="border:0"></iframe>
<script>
const frame=document.getElementById('game'),node=document.getElementById('status');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const steps=[];
function check(title,condition){if(!condition)throw Error(title);steps.push(title)}
frame.addEventListener('load',()=>setTimeout(async()=>{
 try{
  const w=frame.contentWindow,d=frame.contentDocument;
  check('1999 approved UI mounted',Boolean(d.querySelector('#wtwNextgen .ng-manager-shell')));
  check('Correct January 1 game date',d.querySelector('.ng-global-date strong')?.textContent.trim()==='1999-01-01');
  const ui=w.__WTW_1999_UI_DATA__;
  check('1999 data adapter initialized',Boolean(ui));
  check('87,500-horse world available',ui.counts.horses===87500);
  check('134 track universe available',ui.counts.tracks===134);
  check('Opening stable has source-recorded horses',ui.stableHorses.length>0&&ui.stableHorses.every(h=>h.horseId?.startsWith('H-')));
  check('1999 inbox not 2014 demo',d.querySelector('.ng-msgtitle')?.textContent.includes('1999'));
  check('1999 decision desk not 2014 case',d.querySelector('.ng-casetitle')?.textContent.includes('1999'));
  check('All original department controls present',['Stable','Racing','Breeding','Sales','Personnel','Facilities','Finances','Tracks','World'].every(x=>[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].some(n=>n.dataset.val===x)));
  const click=(section)=>{const button=[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].find(n=>n.dataset.val===section);if(!button)throw Error(section+' menu absent');button.click()};
  click('Stable');await pause(250);
  check('Original stable roster displays source horse',Boolean(d.querySelector('.ng-wtw-roster-row'))||Boolean(d.querySelector('.ng-rs-horse')));
  click('Breeding');await pause(180);
  check('Original Breeding screen shown',Boolean(d.querySelector('.ng-manager-stage')));
  const stallions=ui.departmentRows('Breeding','Stallions');
  check('31 source-backed stallions',stallions.length===31);
  const finances=ui.departmentRows('Finances','Overview');
  check('Test finances marked',finances.length>0&&finances.every(x=>x.source==='GENERATED_TEST_BASELINE'));
  const auction=ui.auctionList();
  check('36 scheduled test sales',auction.length===36);
  const horses=ui.worldHorsePage(267,20);
  check('Generated horses paged without loading all 87,500 at once',horses.total===87500&&horses.items.length===20);
  const first=horses.items[0];
  check('Generated horse profile retains required values',first?._testGenerated&&first?._id&&first?.owner&&first?.trainer&&first?._testAttrs);
  check('No 1999 future outcomes pre-recorded',ui.bridgeStatus.includes('NO_1999_OUTCOME_COMMITTED'));
  const saveKey=w.__WTW_1999_MANAGEMENT__.saveKey;
  const before=JSON.parse(w.localStorage.getItem(saveKey)||'null');
  check('1999 session uses dedicated save state',saveKey==='wtw1999ManagementStateV1'&&before?.date==='1999-01-01');
  check('No old 2014 case or follow-ups imported',before?.currentCase==='opening-stable'&&before.decisionLog.length===0&&before.followUps.length===0);
  const continueButton=d.querySelector('#wtwNextgen [data-ng="action"][data-val="Continue"]');
  check('Approved UI Continue control is wired',Boolean(continueButton));
  continueButton.click();await pause(350);
  const advanced=JSON.parse(w.localStorage.getItem(saveKey)||'null');
  check('Continue advances to January 2, 1999',advanced?.date==='1999-01-02');
  check('January 1999 date is visible in header',d.querySelector('.ng-global-date strong')?.textContent.trim()==='1999-01-02');
  check('Advance does not invent a race result or old Office decision',advanced.decisionLog.length===0&&advanced.followUps.length===0&&advanced.worldAnchor.lastCommittedRaceResult===null);
  const archive=await w.fetch('/archive/?page=seasons');
  check('Pre-1999 historical archive remains accessible',archive.ok);
  check('No 2014 demo content visible in manager',!d.querySelector('#wtwNextgen')?.innerText.includes('2014-07-15'));
  node.dataset.state='passed';node.textContent=JSON.stringify({state:'passed',steps});
 }catch(e){node.dataset.state='failed';node.textContent=JSON.stringify({state:'failed',error:String(e),steps});}
},2800));
frame.src='/next/?world=1999';
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --window-size=1550,850 --virtual-time-budget=17000 --dump-dom \
 'http://127.0.0.1:8866/__1999_ui_probe.html' > visual-audit/1999/smoke-dom.html 2>/tmp/wtw-1999-chrome.log
python3 - <<'PY'
from pathlib import Path
import html, json, re
source=Path('visual-audit/1999/smoke-dom.html').read_text()
hit=re.search(r'<pre id="status" data-state="([^"]+)">(.*?)</pre>',source,re.S)
assert hit, '1999 smoke status missing'
result=json.loads(html.unescape(hit.group(2)))
print('1999 management browser test:',result)
assert hit.group(1)=='passed',result
assert len(result['steps'])>=14
PY
echo "PASS: existing desktop management UI renders 1999 universe across departments"
