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
  check('Correct January 1 game date',d.querySelector('.ng-global-date strong')?.textContent.trim()==='1999-01-01');
  const ui=w.__WTW_1999_UI_DATA__;
  check('1999 data adapter initialized',Boolean(ui));
  check('87,500-horse world available',ui.counts.horses===87500);
  check('118 US/Canada/Cuba courses available',ui.counts.tracks===118);
  check('Opening stable has source-recorded horses',ui.stableHorses.length>0&&ui.stableHorses.every(h=>h.horseId?.startsWith('H-')));
  check('1999 inbox not 2014 demo',d.querySelector('.ng-msgtitle')?.textContent.includes('1999'));
  check('1999 decision desk not 2014 case',d.querySelector('.ng-casetitle')?.textContent.includes('1999'));
  check('All original department controls present',['Stable','Racing','Breeding','Sales','Personnel','Facilities','Finances','Tracks','World'].every(x=>[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].some(n=>n.dataset.val===x)));
  const click=(section)=>{const button=[...d.querySelectorAll('#wtwNextgen [data-ng="menu"]')].find(n=>n.dataset.val===section);if(!button)throw Error(section+' menu absent');button.click()};
  click('Stable');await pause(250);
  check('Original stable roster displays source horse',Boolean(d.querySelector('.ng-wtw-roster-row'))||Boolean(d.querySelector('.ng-rs-horse')));
  const firstHorse=d.querySelector('#wtwNextgen .ng-rs-horse');
  check('Stable horse profile navigation button is present',Boolean(firstHorse?.dataset.val));
  const openingHorseName=firstHorse.dataset.val;
  firstHorse.click();await pause(240);
  check('Stable horse opens a linked 1999 profile',Boolean(d.querySelector('#wtwNextgen .ng-profile-horse'))&&
   d.querySelector('#wtwNextgen')?.textContent.includes(openingHorseName));
  check('Original FM horse profile shows all 46 specialized horse ratings',
   d.querySelectorAll('#wtwNextgen .ng-horse-rating-row').length===46&&
   d.querySelector('#wtwNextgen .ng-horse-dossier')?.textContent.includes('SPEED & PACE'));
  click('Stable');await pause(180);
  click('Racing');await pause(300);
  const fullTrackPicker=d.querySelector('#wtwNextgen select[data-ng-select="department-track"]');
  check('Racing drop-down includes all 118 playable tracks',
   Boolean(fullTrackPicker)&&fullTrackPicker.options.length===119&&[...fullTrackPicker.options].some(o=>o.value==='Saratoga'));
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
   [...d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr td:nth-child(2)')].every(x=>x.textContent.trim()==='Saratoga')&&
   d.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr').length>1);
  d.querySelector('#wtwNextgen button[data-ng="dept-race-calendar"]')?.click();await pause(170);
  check('Calendar toggle displays the month grid and daily browse buttons',
   d.querySelectorAll('#wtwNextgen .ng-racing-calendar button[data-ng="racing-calendar-day"]').length===31);
  d.querySelector('#wtwNextgen button[data-ng="dept-meets"]')?.click();await pause(170);
  check('Selected track shows complete meet dates even outside active meets',
   Boolean(d.querySelector('#wtwNextgen .ng-rs-table')?.textContent.includes('Jul 28–Sep 6')));
  check('Browsing races and meets has not advanced January 1 game date',
   d.querySelector('.ng-global-date strong')?.textContent.trim()==='1999-01-01');
  click('Breeding');await pause(180);
  check('Original Breeding screen shown',Boolean(d.querySelector('.ng-manager-stage')));
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
  click('Breeding');await pause(180);
  const stallions=ui.departmentRows('Breeding','Stallions');
  check('31 source-backed stallions preserved alongside model stallions',stallions.length>=31&&stallions.filter(h=>h.status?.includes('SOURCE')).length===31&&stallions.every(h=>h._canonId||h._testGenerated));
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
