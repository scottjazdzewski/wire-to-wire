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
  const browserErrors=[];
  w.addEventListener('error',e=>browserErrors.push(String(e.message)+' at '+String(e.filename)+':'+e.lineno));
  w.addEventListener('unhandledrejection',e=>browserErrors.push(String(e.reason)));
  check('1999 approved UI mounted',Boolean(d.querySelector('#wtwNextgen .ng-manager-shell')));
  let paintFailure=null;
  let visibleDate=d.querySelector('.ng-global-date strong')?.textContent.trim()||'';
  if(!visibleDate&&w.__WTW_NEXT__?.paint){
   try{w.__WTW_NEXT__.paint()}catch(error){paintFailure=String(error?.stack||error)}
   visibleDate=d.querySelector('.ng-global-date strong')?.textContent.trim()||'';
  }
  check('Correct January 1 game date '+JSON.stringify({
   displayed:visibleDate,bootReady:!!w.__WTW_1999_UI_DATA__,
   frameText:d.querySelector('#wtwNextgen')?.textContent.slice(0,190),
   app:!!w.__WTW_NEXT__,paintFailure,errorList:browserErrors.slice(-3)
  }),visibleDate==='1999-01-01');
  const ui=w.__WTW_1999_UI_DATA__;
  check('1999 data adapter initialized',Boolean(ui));
  check('Clean founding world excludes old B01 generated racehorses',ui.counts.horses===0&&ui.counts.worldHorses===73);
  check('1999 supported racecourse geography available',ui.counts.tracks>=50&&ui.counts.tracks<=118);
  check('Old B01 opening horses excluded from the visible stable',ui.stableHorses.length===0);
  check('1999 inbox not 2014 demo',d.querySelector('.ng-msgtitle')?.textContent.includes('1999'));
  check('1999 decision desk not 2014 case',d.querySelector('.ng-casetitle')?.textContent.includes('1999'));
  check('All original department controls present',['Stable','Racing','Breeding','Sales','Personnel','Facilities','Finances','Tracks','World'].every(x=>[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].some(n=>n.dataset.val===x)));
  const click=(section)=>{const button=[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].find(n=>n.dataset.val===section);if(!button)throw Error(section+' menu absent');button.click()};
  click('Stable');await pause(250);
  check('Clean opening stable shows no inherited generated horse rows',
   !d.querySelector('#wtwNextgen .ng-rs-horse')&&ui.stableHorses.length===0);
  click('Racing');await pause(300);
  const fullTrackPicker=d.querySelector('#wtwNextgen select[data-ng-select="department-track"]');
  check('Racing drop-down includes all founding circuit tracks',
   Boolean(fullTrackPicker)&&fullTrackPicker.options.length===ui.counts.tracks+1&&[...fullTrackPicker.options].some(o=>o.value==='Saratoga'));
  check('Date browser opens on Jan 1 without advancing the game',
   d.querySelector('#ngRacingBrowseDate')?.value==='1999-01-01');
  d.querySelector('#wtwNextgen button[data-ng="dept-day-card"]')?.click();await pause(260);
  check('January 1 condition books list races across all tracks',
   d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr').length>=40);
  const racePurses=[...d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr td:nth-child(7)')].map(x=>x.textContent.trim());
  check('Daily racing purses display complete dollar amounts',
   racePurses.length>30&&racePurses.every(x=>/^\$[\d,]+$/.test(x)));
  const browseDate=d.querySelector('#ngRacingBrowseDate');
  browseDate.value='1999-08-28';browseDate.dispatchEvent(new w.Event('change',{bubbles:true}));await pause(270);
  check('Date search displays the selected August 28 condition book',
   Boolean(d.querySelector('#wtwNextgen .ng-racing-day-summary')?.textContent.includes('1999-08-28')));
  const chooseTrack=d.querySelector('#wtwNextgen select[data-ng-select="department-track"]');
  chooseTrack.value='Saratoga';chooseTrack.dispatchEvent(new w.Event('change',{bubbles:true}));await pause(270);
  check('Track selection filters the date condition book without resetting to active-only tracks',
   [...d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr td:nth-child(2)')].every(x=>x.textContent.trim().startsWith('Saratoga'))&&
   d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr').length>1);
  d.querySelector('#wtwNextgen button[data-ng="dept-race-calendar"]')?.click();await pause(170);
  check('Calendar toggle displays the month grid and daily browse buttons',
   d.querySelectorAll('#wtwNextgen .ng-racing-calendar button[data-ng="racing-calendar-day"]').length===31);
  d.querySelector('#wtwNextgen button[data-ng="dept-meets"]')?.click();await pause(170);
  check('Selected track shows complete meet dates even outside active meets',
   Boolean(d.querySelector('#wtwNextgen .ng-rs-table')?.textContent.includes('Jul 28–Sep 6')));
  check('Browsing races and meets has not advanced January 1 game date',
   d.querySelector('.ng-global-date strong')?.textContent.trim()==='1999-01-01');
  // Synthetic .click() does not transfer focus like a real pointer event.
  // Release the previous racing select before switching departments.
  d.activeElement?.blur?.();
  click('Breeding');await pause(180);
  check('Original Breeding screen shown',Boolean(d.querySelector('.ng-manager-stage')));
  const breedingView=d.querySelector('#wtwNextgen select[data-ng-select="department-tab"]');
  check('Breeding uses its approved compact in-page view picker',Boolean(breedingView));
  check('Breeding stallion roster remains accessible',
   Boolean([...breedingView.options].some(o=>o.value==='Stallions')));
  breedingView.value='Stallions';
  breedingView.dispatchEvent(new w.Event('change',{bubbles:true}));await pause(230);
  const breedingHorse=d.querySelector('#wtwNextgen [data-ng="dept-open"]');
  check('Stallion record is linked from Breeding',Boolean(breedingHorse));
  breedingHorse.click();await pause(230);
  check('Breeding horse opens the SAME detailed 46-rating dossier, not a simplified alternative',
   Boolean(d.querySelector('#wtwNextgen .ng-profile-horse'))&&
   d.querySelectorAll('#wtwNextgen .ng-horse-rating-row').length===46);
  click('Personnel');await pause(280);
  const trainerTab=[...d.querySelectorAll('#wtwNextgen [data-ng="tab"]')].find(b=>b.dataset.val==='Trainers');
  check('Existing Personnel trainer tab is available',Boolean(trainerTab));
  trainerTab.click();await pause(330);
  const trainerButton=d.querySelector('#wtwNextgen [data-ng="dept-open"]');
  check('Personnel trainer opens from the existing roster',Boolean(trainerButton));
  trainerButton.click();await pause(240);
  if(!d.querySelector('#wtwNextgen .ng-profile-person')||
   d.querySelector('#wtwNextgen .ng-entity-preview')){
   throw Error('Trainer did not open FM profile: '+JSON.stringify({
    custom:w.__WTW_NEXT__?.app?.custom,section:w.__WTW_NEXT__?.app?.section,
    trainer:trainerButton.dataset.val,route:d.querySelector('#wtwNextgen .ng-route')?.textContent.slice(0,200),
    generic:Boolean(d.querySelector('#wtwNextgen .ng-entity-preview')),
    dossier:Boolean(d.querySelector('#wtwNextgen .ng-person-workspace')),
    errors:browserErrors.slice(-5)}));
  }
  steps.push('Trainer opens approved FM people profile, not legacy generic preview');
  check('Trainer profile shows common and trainer-only detailed attributes',
   d.querySelectorAll('#wtwNextgen .ng-person-attribute').length>=21&&
   d.querySelector('#wtwNextgen .ng-person-workspace')?.textContent.includes('Conditioning'));
  click('Personnel');await pause(180);
  const jockeyTab=[...d.querySelectorAll('#wtwNextgen [data-ng="tab"]')].find(b=>b.dataset.val==='Jockeys');
  check('Existing jockey roster tab is present',Boolean(jockeyTab));
  jockeyTab.click();await pause(300);
  const jockeyButton=d.querySelector('#wtwNextgen [data-ng="dept-open"]');
  check('Jockey profile is navigable by exact roster entity',Boolean(jockeyButton));
  jockeyButton.click();await pause(250);
  check('Jockey profile uses jockey skills rather than trainer skills',
   Boolean(d.querySelector('#wtwNextgen .ng-profile-person'))&&
   d.querySelector('#wtwNextgen .ng-person-workspace')?.textContent.includes('Break Timing')&&
   !d.querySelector('#wtwNextgen .ng-person-workspace')?.textContent.includes('Workout Design'));
  click('World');await pause(240);
  const peopleTab=[...d.querySelectorAll('#wtwNextgen [data-ng="tab"]')].find(b=>b.dataset.val==='People');
  if(!peopleTab)throw Error('World People tab missing after Jockey profile: '+JSON.stringify({
   custom:w.__WTW_NEXT__?.app?.custom,section:w.__WTW_NEXT__?.app?.section,page:w.__WTW_NEXT__?.app?.page,
   tabs:[...d.querySelectorAll('#wtwNextgen [data-ng="tab"]')].map(x=>x.dataset.val),
   screen:d.querySelector('#wtwNextgen .ng-route')?.textContent.slice(0,150),errors:browserErrors.slice(-4)}));
  steps.push('Existing World people tab is available');
  peopleTab.click();await pause(270);
  const sourcePersonButton=d.querySelector('#wtwNextgen [data-ng="dept-open"]');
  check('1999 world person source row is navigable',Boolean(sourcePersonButton));
  sourcePersonButton.click();await pause(220);
  check('Canonical World person uses the same professional attribute dossier',
   Boolean(d.querySelector('#wtwNextgen .ng-profile-person'))&&
   d.querySelectorAll('#wtwNextgen .ng-person-attribute').length>=11);
  check('Source person identity displays role-specific modeled test skills, not a generic profile',
   d.querySelectorAll('#wtwNextgen .ng-person-attribute strong.test-modeled').length>=11&&
   d.querySelector('#wtwNextgen .ng-person-workspace')?.textContent.includes('SIMULATED TEST VALUES'));
  click('Breeding');await pause(180);
  const stallions=ui.departmentRows('Breeding','Stallions');
  check('18 source stallions appear only once in founder breeding screen',stallions.length===18&&stallions.every(h=>h._canonId&&h.status?.includes('SOURCE')));
  const finances=ui.departmentRows('Finances','Overview');
  check('Founding finance panel does not invent inherited owner balances',finances.length>0&&finances.every(x=>x.source==='FOUNDING_FINANCE_NOT_CERTIFIED__NO_SETTLEMENT_AUTHORITY'));
  const auction=ui.auctionList();
  check('12 proposed founding sales with empty catalogs',auction.length===12&&auction.every(a=>a.lots.length===0));
  const horses=ui.worldHorsePage(ui.counts.horses,20);
  check('World directory contains only 73 real, connected breeding animals',
   horses.total===73&&horses.items.length===20&&ui.counts.horses===0);
  const first=horses.items[0];
  check('Breeding horse profile retains its existing historical identity',Boolean(first?._canonId&&first?._id&&first?._worldKey));
  check('No 1999 future outcomes pre-recorded',ui.bridgeStatus.includes('NO_1999_OUTCOME_COMMITTED'));
  const saveKey=w.__WTW_1999_MANAGEMENT__.saveKey;
  const before=JSON.parse(w.localStorage.getItem(saveKey)||'null');
  check('1999 session uses isolated founding save state',saveKey==='wtw1999FoundingStateV1'&&before?.date==='1999-01-01');
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
