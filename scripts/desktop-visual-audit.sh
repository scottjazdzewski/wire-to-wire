#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$CHROME" ]]; then echo "Browser unavailable: cannot visually validate" >&2; exit 1; fi
mkdir -p visual-audit/screenshots visual-audit/dom visual-audit/source-logos
# Include exact, UNMODIFIED approved original files for auditing contrast and
# alpha-matte conversion. These are evidence only, never shipped UI variants.
cp public/assets/places/track-logos/T-0017.webp visual-audit/source-logos/T-0017.webp
cp public/assets/places/track-logos/T-0001.webp visual-audit/source-logos/T-0001.webp
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
capture stable-roster '?ui=Stable%20%E2%80%94%20Overview' 'ng-stable-roster-v2'
capture world-directory '?ui=World%20%E2%80%94%20Overview' 'ng-manager-screen'
capture world-tracks '?ui=World%20%E2%80%94%20Tracks' 'ng-dept-roster'
capture world-meets '?ui=World%20%E2%80%94%20Meets' 'ng-dept-roster'
capture world-news '?ui=World%20%E2%80%94%20News' 'ng-news-screen'
capture office-news '?ui=Office%20%E2%80%94%20News' 'ng-news-screen'
capture opportunity-board '?ui=Opportunities' 'ng-opportunity-screen'
capture racing-roster '?ui=Racing%20%E2%80%94%20Overview' 'ng-dept-roster'
capture global-search '?ui=Search' 'ng-search-roster-page'
capture horse-profile '?page=horse&name=The+Last+Match' 'ng-horse-dossier'
capture people-profile '?ui=WorldRecord%3Aperson%3AP-000018' 'ng-person-horse-dossier'
capture founder-owner '?ui=FoundingProfile%3Aownership%3AO-000014' 'ng-track-workspace'
capture founder-facility '?ui=FoundingProfile%3Afacility%3AO-000068' 'ng-track-workspace'
# Narrow desktop acceptance for the restored local dossier arrows beside Overview.
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --force-device-scale-factor=1 --window-size=1280,800 --virtual-time-budget=4000 \
  --screenshot="visual-audit/screenshots/founder-facility-1280.png" \
  'http://127.0.0.1:8765/next/?ui=FoundingProfile%3Afacility%3AO-000068' \
  >/tmp/wtw-chrome-facility1280.log 2>&1
capture aqueduct-track '?ui=WorldRecord%3Atrack%3AT-0001' 'ng-profile-track'
capture belmont-track '?ui=WorldRecord%3Atrack%3AT-0002' 'ng-profile-track'
capture gulfstream-track '?ui=WorldRecord%3Atrack%3AT-0017' 'ng-profile-track'
capture santa-anita-track '?ui=WorldRecord%3Atrack%3AT-0028' 'ng-profile-track'
capture kingsmere-farm '?ui=FoundingProfile%3Afacility%3AO-000061' 'ng-profile-farm'
capture northbank-stable '?ui=FoundingProfile%3Aownership%3AO-000045' 'ng-profile-farm'
capture personnel '?ui=Personnel' 'ng-manager-screen|ng-dept-roster'
capture facilities '?ui=Facilities' 'ng-manager-screen|ng-dept-roster'
capture finances '?ui=Finances' 'ng-manager-screen|ng-dept-roster'
capture breeding '?ui=Breeding' 'ng-manager-screen|ng-dept-roster'
# Extended every-department proof: these are NOT visually signed off merely
# because they render. Their actual screenshot output joins the human ledger.
capture sales-overview '?ui=Sales%20%E2%80%94%20Overview' 'ng-dept-roster'
capture sales-auctions '?ui=Sales%20%E2%80%94%20Auctions' 'ng-dept-roster'
# A zero-row catalogue is not a filter miss; it must show source-honest
# context and genuinely working links to existing sales views.
if ! grep -q 'ng-dept-empty-actions' visual-audit/dom/sales-auctions.html; then
 echo 'Sales Auctions has no unfiltered empty-state management actions' >&2; exit 1
fi
if grep -q 'NO MATCHING RECORDS' visual-audit/dom/sales-auctions.html; then
 echo 'Unfiltered Sales Auctions incorrectly claims a search mismatch' >&2; exit 1
fi
capture naming-desk '?ui=Stable%20%E2%80%94%20Naming%20Desk' 'ng-naming-desk'
capture office-messages '?ui=Messages' 'ng-manager-message-inbox'
capture office-decisions '?ui=Decisions' 'ng-manager-message-inbox'
# Readability at the supported laptop desktop width; never resize the
# ordinary management shell or install another UI presentation.
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --force-device-scale-factor=1 --window-size=1280,800 --virtual-time-budget=4000 \
 --screenshot="visual-audit/screenshots/office-messages-1280.png" \
 'http://127.0.0.1:8765/next/?ui=Messages' >/tmp/wtw-office-inbox1280.log 2>&1
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --force-device-scale-factor=1 --window-size=1280,800 --virtual-time-budget=4000 \
 --screenshot="visual-audit/screenshots/office-decisions-1280.png" \
 'http://127.0.0.1:8765/next/?ui=Decisions' >/tmp/wtw-office-decisions1280.log 2>&1
test -s visual-audit/screenshots/office-messages-1280.png
test -s visual-audit/screenshots/office-decisions-1280.png

capture office-career '?ui=Career' 'ng-manager-career'
capture stable-training '?ui=Stable%20%E2%80%94%20Training' 'ng-training-desk'
# Real content checks: a generic directory is no longer acceptable on these routes.
if grep -q 'CONNECTED WORLD RECORDS' visual-audit/dom/office-messages.html ||
   grep -q 'CONNECTED WORLD RECORDS' visual-audit/dom/office-decisions.html; then
 echo 'Office Inbox/Decisions regressed to generic world directory' >&2; exit 1
fi
if ! grep -q 'WEEKLY PROGRAM / CHANGE PLAN' visual-audit/dom/stable-training.html; then
 echo 'Stable Training missing its real program and condition table' >&2; exit 1
fi
capture racing-calendar '?ui=Racing%20%E2%80%94%20Calendar' 'ng-dept-roster'
capture racing-entries '?ui=Racing%20%E2%80%94%20Entries' 'ng-dept-roster'
capture breeding-foals '?ui=Breeding%20%E2%80%94%20Foals' 'ng-dept-roster'
capture personnel-jockeys '?ui=Personnel%20%E2%80%94%20Jockeys' 'ng-dept-roster'
capture facilities-stud-farms '?ui=Facilities%20%E2%80%94%20Stud%20Farms' 'ng-dept-roster'
capture finances-cash-flow '?ui=Finances%20%E2%80%94%20Cash%20Flow' 'ng-dept-roster'
capture world-organizations '?ui=World%20%E2%80%94%20Organizations' 'ng-dept-roster'
capture world-people '?ui=World%20%E2%80%94%20People' 'ng-dept-roster'

# EVERY department VIEW must have a screenshot before visual signoff.
# The generic shell marker permits an honest screenshot of missing content;
# it does NOT certify the subview as OOTP/FM quality.
capture stable-health '?ui=Stable%20%E2%80%94%20Health' 'ng-manager-onboarding'
capture stable-race-plans '?ui=Stable%20%E2%80%94%20Race%20Plans' 'ng-manager-shell'
capture stable-barns '?ui=Stable%20%E2%80%94%20Barns' 'ng-manager-shell'
capture racing-results '?ui=Racing%20%E2%80%94%20Results' 'ng-manager-shell'
capture racing-stakes '?ui=Racing%20%E2%80%94%20Stakes' 'ng-manager-shell'
capture racing-race-planning '?ui=Racing%20%E2%80%94%20Race%20Planning' 'ng-manager-shell'
capture breeding-stallions '?ui=Breeding%20%E2%80%94%20Stallions' 'ng-manager-shell'
capture breeding-broodmares '?ui=Breeding%20%E2%80%94%20Broodmares' 'ng-manager-shell'
capture breeding-pedigrees '?ui=Breeding%20%E2%80%94%20Pedigrees' 'ng-manager-shell'
capture breeding-stud-farms '?ui=Breeding%20%E2%80%94%20Stud%20Farms' 'ng-manager-shell'
capture sales-sale-calendar '?ui=Sales%20%E2%80%94%20Sale%20Calendar' 'ng-manager-shell'
capture sales-sale-companies '?ui=Sales%20%E2%80%94%20Sale%20Companies' 'ng-manager-shell'
capture sales-catalogs '?ui=Sales%20%E2%80%94%20Catalogs' 'ng-manager-shell'
capture sales-watchlist '?ui=Sales%20%E2%80%94%20Watchlist' 'ng-manager-shell'
capture sales-private-offers '?ui=Sales%20%E2%80%94%20Private%20Offers' 'ng-manager-shell'
capture personnel-trainers '?ui=Personnel%20%E2%80%94%20Trainers' 'ng-manager-shell'
capture personnel-owners '?ui=Personnel%20%E2%80%94%20Owners' 'ng-manager-shell'
capture personnel-principals '?ui=Personnel%20%E2%80%94%20Principals' 'ng-manager-shell'
capture personnel-staff '?ui=Personnel%20%E2%80%94%20Staff' 'ng-manager-shell'
capture facilities-training-centers '?ui=Facilities%20%E2%80%94%20Training%20Centers' 'ng-manager-shell'
capture facilities-breaking-facilities '?ui=Facilities%20%E2%80%94%20Breaking%20Facilities' 'ng-manager-shell'
capture facilities-racing-stables '?ui=Facilities%20%E2%80%94%20Racing%20Stables' 'ng-manager-shell'
capture facilities-farms '?ui=Facilities%20%E2%80%94%20Farms' 'ng-manager-shell'
capture facilities-trainer-barns '?ui=Facilities%20%E2%80%94%20Trainer%20Barns' 'ng-manager-shell'
capture finances-operating-costs '?ui=Finances%20%E2%80%94%20Operating%20Costs' 'ng-manager-shell'
capture finances-budgets '?ui=Finances%20%E2%80%94%20Budgets' 'ng-manager-shell'
capture world-1999-horses '?ui=World%20%E2%80%94%201999%20Horses' 'ng-manager-shell'
capture world-major-races '?ui=World%20%E2%80%94%20Major%20Races' 'ng-manager-shell'
capture tracks-overview '?ui=Tracks%20%E2%80%94%20Overview' 'ng-manager-shell'
capture tracks-active-meets '?ui=Tracks%20%E2%80%94%20Active%20Meets' 'ng-manager-shell'
capture tracks-all-tracks '?ui=Tracks%20%E2%80%94%20All%20Tracks' 'ng-manager-shell'
capture tracks-stakes '?ui=Tracks%20%E2%80%94%20Stakes' 'ng-manager-shell'
capture office-reports '?ui=Reports' 'ng-manager-shell'
capture history-vault 'archive/' 'Historical Racing Records'
capture history-horses 'archive/?page=horses' 'brand-title'
capture history-people-farms 'archive/?page=people' 'brand-title'
capture history-tracks-facilities 'archive/?page=tracks' 'brand-title'
capture history-calendar 'archive/?page=seasons' 'brand-title'
capture history-coverage 'archive/?page=sources' 'brand-title'
capture history-year-review 'archive/?page=races&review=1953' 'history-year-review'
# The annual masthead, three Classic panels and season controls must also
# render at the narrower desktop width used by many laptop/management players.
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --force-device-scale-factor=1 --window-size=1280,800 --virtual-time-budget=4000 \
  --screenshot="visual-audit/screenshots/history-year-review-1280.png" \
  'http://127.0.0.1:8765/archive/?page=races&review=1953' >/tmp/wtw-chrome-year1280.log 2>&1
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
   roster:rect('.ng-rs-roster'),
   rosterToolbar:rect('.ng-rs-tools'),
   densityControls:[...d.querySelectorAll('.ng-rs-mode button')].map(button=>({
    text:button.textContent.trim(),value:button.dataset.val,
    active:button.classList.contains('on'),
    pressed:button.getAttribute('aria-pressed')
   })),
   horse:rect('.ng-horse-dossier'),
   search:rect('.ng-search-roster-page'),
   worldDashboard:rect('.ng-manager-screen'),
   newsDashboard:rect('.ng-news-screen'),
   opportunityDashboard:rect('.ng-opportunity-screen'),
   opportunityDeskLinks:[...d.querySelectorAll('.ng-opportunity-screen [data-ng="menu"]')].map(n=>n.dataset.val),
   opportunityIntegrity:d.querySelector('.ng-opportunity-screen .ng-manager-sidebar')?.textContent?.includes('LIVE SOURCES ONLY')||false,
   newsOfficeLinks:[...d.querySelectorAll('.ng-news-screen [data-ng="case"]')].length,
   newsSourceStatus:d.querySelector('.ng-news-screen .ng-manager-sidebar')?.textContent?.includes('NOT CONNECTED')||false,
   worldPreviewRows:[...d.querySelectorAll('.ng-world-complete [data-ng="world-open"]')].length,
   worldPreviewSourceOnly:(()=>{
    const rows=[...d.querySelectorAll('.ng-world-complete [data-ng="world-open"]')];
    return rows.length>0&&rows.every(button=>
     /^(?:horse|historical-horse|person|farm|track):[A-Za-z0-9-]+$/.test(button.dataset.val||''));
   })(),
   worldDirectoryTools:Boolean(d.querySelector('.ng-world-complete #ngWorldDirectorySearch'))&&
    Boolean(d.querySelector('.ng-world-complete [data-ng="world-export"]'))&&
    Boolean(d.querySelector('.ng-world-complete [data-ng="world-import-open"]'))&&
    Boolean(d.querySelector('.ng-world-complete [data-ng="world-directory-type"]'))&&
    Boolean(d.querySelector('.ng-world-complete [data-ng="manager-sort"]')),
   people:rect('.ng-person-horse-dossier'),
   profile:rect('.ng-route-profile .ng-profile-view'),
   intro:rect('.ng-route-profile .ng-profile-intro'),
   identity:rect('.ng-route-profile .ng-profile-identity'),
   heroMark:rect('.ng-route-profile .ng-profile-source-photo'),
   localNavigation:rect('.ng-route-profile .ng-profiletabs')||rect('.ng-route-profile .ng-person-dossierbar'),
   profileName:d.querySelector('.ng-route-profile .ng-profile-identity h2')?.textContent?.trim()||'',
   identityId:d.getElementById('wtwNextgen')?.getAttribute('data-wtw-identity')||'',
   identitySource:d.getElementById('wtwNextgen')?.getAttribute('data-wtw-identity-source')||'',
   identityBase:win.getComputedStyle(d.getElementById('wtwNextgen')).
    getPropertyValue('--wtw-id-base').trim(),
   logoThemeReady:d.getElementById('wtwNextgen')?.getAttribute('data-wtw-logo-theme')||'',
   logoSrc:d.querySelector('.ng-route-profile .ng-profile-view.ng-profile-track > .ng-profile-intro > .ng-profile-source-photo img')?.currentSrc||'',
   logoMixBlend:d.querySelector('.ng-route-profile .ng-profile-view.ng-profile-track > .ng-profile-intro > .ng-profile-source-photo img')?
    win.getComputedStyle(d.querySelector('.ng-route-profile .ng-profile-view.ng-profile-track > .ng-profile-intro > .ng-profile-source-photo img')).mixBlendMode:'',
   logoMatteFlag:!!d.querySelector('.ng-route-profile .ng-profile-source-photo.wtw-hero-white-matte'),
   logoTransparentFlag:!!d.querySelector('.ng-route-profile .ng-profile-source-photo.wtw-hero-transparent'),
   profileBackdrop:d.querySelector('.ng-route-profile .ng-profile-intro')?
    win.getComputedStyle(d.querySelector('.ng-route-profile .ng-profile-intro')).backgroundImage:'',
   trackWorkspace:rect('.ng-route-profile .ng-track-workspace'),
   trackStakes:rect('.ng-route-profile .ng-track-stakes'),
   trackMeet:rect('.ng-route-profile .ng-track-meet-card'),
   trackHistory:rect('.ng-route-profile .ng-track-history-card'),
   stakeRows:d.querySelectorAll('.ng-route-profile .ng-track-stakes .ng-stakes-data').length,
   stakeSortButtons:d.querySelectorAll('.ng-route-profile .ng-stakes-head [data-ng="stake-sort"]').length,
   approvedTrackBadge:win.getComputedStyle(d.querySelector('.ng-route-profile .ng-profile-badgeframe')||d.body).backgroundImage.includes('wtw_badge_track.png'),
   legacyPilotPanels:d.querySelectorAll('.ng-connected-profile,.ng-connected-drop,.ng-connected-table').length,
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
probe stable-roster '%3Fui%3DStable%2520%25E2%2580%2594%2520Overview'
probe racing-roster '%3Fui%3DRacing%2520%25E2%2580%2594%2520Overview'
probe world-directory '%3Fui%3DWorld%2520%25E2%2580%2594%2520Overview'
probe world-tracks '%3Fui%3DWorld%2520%25E2%2580%2594%2520Tracks'
probe world-meets '%3Fui%3DWorld%2520%25E2%2580%2594%2520Meets'
probe laptop-world-tracks '%3Fui%3DWorld%2520%25E2%2580%2594%2520Tracks' '1280,800'
probe laptop-world-meets '%3Fui%3DWorld%2520%25E2%2580%2594%2520Meets' '1280,800'
probe world-news '%3Fui%3DWorld%2520%25E2%2580%2594%2520News'
probe office-news '%3Fui%3DOffice%2520%25E2%2580%2594%2520News'
probe opportunity-board '%3Fui%3DOpportunities'
probe laptop-opportunity-board '%3Fui%3DOpportunities' '1280,800'
probe laptop-world-news '%3Fui%3DWorld%2520%25E2%2580%2594%2520News' '1280,800'
probe laptop-stable-roster '%3Fui%3DStable%2520%25E2%2580%2594%2520Overview' '1280,800'
probe laptop-racing-roster '%3Fui%3DRacing%2520%25E2%2580%2594%2520Overview' '1280,800'
probe search '%3Fui%3DSearch'
probe horse '%3Fpage%3Dhorse%26name%3DThe%2BLast%2BMatch'
probe person '%3Fui%3DWorldRecord%253Aperson%253AP-000018'
probe aqueduct '%3Fui%3DWorldRecord%253Atrack%253AT-0001'
probe belmont '%3Fui%3DWorldRecord%253Atrack%253AT-0002'
probe gulfstream '%3Fui%3DWorldRecord%253Atrack%253AT-0017'
probe santa-anita '%3Fui%3DWorldRecord%253Atrack%253AT-0028'
probe farm '%3Fui%3DFoundingProfile%253Afacility%253AO-000061'
probe stable '%3Fui%3DFoundingProfile%253Aownership%253AO-000045'
probe owner '%3Fui%3DFoundingProfile%253Aownership%253AO-000014'
probe laptop-horse '%3Fpage%3Dhorse%26name%3DThe%2BLast%2BMatch' '1280,800'
probe laptop-person '%3Fui%3DWorldRecord%253Aperson%253AP-000018' '1280,800'
probe laptop-aqueduct '%3Fui%3DWorldRecord%253Atrack%253AT-0001' '1280,800'
probe laptop-belmont '%3Fui%3DWorldRecord%253Atrack%253AT-0002' '1280,800'
probe laptop-farm '%3Fui%3DFoundingProfile%253Afacility%253AO-000061' '1280,800'
probe laptop-owner '%3Fui%3DFoundingProfile%253Aownership%253AO-000014' '1280,800'
python3 - <<'PY'
import json,html,re
from pathlib import Path
# Verify identity colors are extracted from displayed images, never constants.
# This deliberately does NOT assert hand-picked values for track brands.
expected={
 'aqueduct':'T-0001',
 'belmont':'T-0002',
 'gulfstream':'T-0017',
 'santa-anita':'T-0028',
 'farm':'O-000061'
}
palette_rows={}
for name,identity in expected.items():
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'Identity probe incomplete')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Identity probe metrics missing')
 data=json.loads(html.unescape(match.group(1)))
 assert data['identityId']==identity,(name,'Wrong entity identity',data['identityId'])
 assert data['identitySource']=='logo-pixels',(name,'Not derived from actual displayed logo',data)
 assert data['logoThemeReady']=='ready',(name,'Logo pixel sample not applied')
 assert re.fullmatch(r'#[0-9A-Fa-f]{6}',data['identityBase']),(name,'Invalid pixel-derived color')
 assert data['logoSrc'],(name,'Logo image absent from approved profile')
 if name=='gulfstream':
  # Actual legacy wordmark has an opaque white source canvas. A raw source
  # with normal blending is a white rectangle: this IS a screenshot failure.
  cleaned=data['logoTransparentFlag'] and (
   data['logoSrc'].startswith('blob:') or data['logoSrc'].startswith('data:image/'))
  assert cleaned,(name,'Gulfstream must display an actual alpha-matte derivative; blending a white rectangle is not visual acceptance',data)
  assert data['logoMixBlend'] in ('normal',''),(name,'Temporary blend still active after logo conversion',data)
 assert 'gradient' in data['profileBackdrop'],(name,'Profile atmosphere missing')
 palette_rows[name]=data['identityBase']
assert len(set(palette_rows.values()))>1,'All logos resolve to the same generic color'
plain=Path('visual-audit/dom/probe-office.html').read_text()
match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',plain,re.S)
assert match
data=json.loads(html.unescape(match.group(1)))
assert data['identityId']=='' and data['logoThemeReady']=='',(data,'Brand theme leaked into Office')
print('LOGO-SOURCED ENTITY ATMOSPHERE verified in Chromium:',palette_rows)

# The rendered screenshot itself must contain no Gulfstream white rectangle.
# Chromium CSS/DOM can report 'multiply' even when isolation prevents blending.
# Decode Chrome's standard RGB/RGBA PNG with Python stdlib; no Pillow/network.
import struct,zlib
def png_scanlines(path):
 source=Path(path).read_bytes()
 assert source[:8]==b'\x89PNG\r\n\x1a\n',(path,'Not PNG')
 off=8;idat=bytearray();size=None
 while off<len(source):
  count=int.from_bytes(source[off:off+4],'big')
  label=source[off+4:off+8];chunk=source[off+8:off+8+count]
  off+=count+12
  if label==b'IHDR':
   width,height,depth,mode,comp,flt,interlace=struct.unpack('>IIBBBBB',chunk)
   assert depth==8 and mode in (2,6) and interlace==0,(path,'Unexpected PNG format',mode)
   size=(width,height,3 if mode==2 else 4)
  elif label==b'IDAT':idat.extend(chunk)
  elif label==b'IEND':break
 width,height,ch=size
 raw=zlib.decompress(idat);stride=width*ch;start=0;above=bytearray(stride)
 for y in range(height):
  kind=raw[start];line=bytearray(raw[start+1:start+stride+1]);start+=stride+1
  assert kind in range(5),(path,'Unsupported PNG row filter',kind)
  if kind:
   for i in range(stride):
    left=line[i-ch] if i>=ch else 0
    up=above[i]
    corner=above[i-ch] if i>=ch else 0
    if kind==1:predict=left
    elif kind==2:predict=up
    elif kind==3:predict=(left+up)//2
    else:
     p=left+up-corner
     ds=(abs(p-left),abs(p-up),abs(p-corner))
     predict=(left,up,corner)[ds.index(min(ds))]
    line[i]=(line[i]+predict)&255
  yield y,width,ch,line
  above=line

source=Path('visual-audit/dom/probe-gulfstream.html').read_text()
match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
assert match,'Gulfstream geometry missing'
metrics=json.loads(html.unescape(match.group(1)))
mark=metrics['heroMark']
assert mark and mark['width']>150 and mark['height']>90,'No measurable Gulfstream logo'
# Inspect the centered actual image rather than a fixed page coordinate.
x0=int(mark['left']+mark['width']*.19)
x1=int(mark['left']+mark['width']*.81)
y0=int(mark['top']+mark['height']*.10)
y1=int(mark['top']+mark['height']*.90)
bright=sampled=0
for y,width,ch,line in png_scanlines('visual-audit/screenshots/gulfstream-track.png'):
 if y<y0 or y>=y1:continue
 for x in range(max(0,x0),min(width,x1)):
  rgb=line[x*ch:x*ch+3]
  sampled+=1
  if min(rgb)>235:bright+=1
whiteness=bright/max(1,sampled)
assert whiteness<.08,('Gulfstream still has a white rectangular logo plaque',round(whiteness,3),metrics['logoSrc'],metrics['logoMixBlend'])
print('GULFSTREAM SCREENSHOT WHITE-PLAQUE CHECK',round(whiteness,4))

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
# Actual in-game Stable and Racing rosters must share one density pattern,
# not merely use similar CSS in source. This also checks laptop layouts.
for name in ('stable-roster','racing-roster','laptop-stable-roster','laptop-racing-roster'):
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'Roster geometry probe incomplete')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Missing roster metrics')
 data=json.loads(html.unescape(match.group(1)))
 assert data['roster'] and data['roster']['width']>=850,(name,'Roster workspace missing or clipped')
 assert data['rosterToolbar'] and data['rosterToolbar']['width']>=850,(name,'Shared toolbar missing')
 buttons=data['densityControls']
 assert [b['value'] for b in buttons]==['all','compact'],(name,'View mode order drift',buttons)
 assert [b['text'] for b in buttons]==['ALL COLUMNS','QUICK VIEW'],(name,'Mode labels drift',buttons)
 assert sum(b['active'] and b['pressed']=='true' for b in buttons)==1,(name,'Selected mode state inconsistent',buttons)
 assert not data['sourceBridgeVisible'],(name,'Legacy Office became visible')
 assert not data['duplicateGlobalMenuVisible'],(name,'Redundant navigation appeared')
 print('ROSTER PARITY',name,'width',data['roster']['width'],'toolbar',data['rosterToolbar']['width'])
# The approved track presentation is a two-column stadium dossier. Test
# actual rendered Belmont desktop/laptop geometry; never permit pilot cohort
# tables to displace the Stakes, Meet or History sections.
for name in ('belmont','laptop-belmont','aqueduct','gulfstream'):
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'Track layout not rendered')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Missing track measurements')
 d=json.loads(html.unescape(match.group(1)))
 assert d['trackWorkspace'] and d['trackWorkspace']['width']>=850,(name,'Approved workspace missing')
 assert d['trackStakes'] and d['trackStakes']['width']>=400,(name,'Major Stakes column absent')
 assert d['trackMeet'] and d['trackHistory'],(name,'Meet or Track History missing')
 assert d['trackMeet']['top']<d['trackHistory']['top'],(name,'Meet must be above History')
 assert d['trackStakes']['left']<d['trackHistory']['left'],(name,'Stakes must be left; History right')
 assert d['stakeSortButtons']==4,(name,'Full sortable stakes table replaced by dropdown')
 assert d['stakeRows']>=1,(name,'Approved source-linked stakes absent')
 assert d['legacyPilotPanels']==0,(name,'Obsolete 38-horse cohort overlay returned')
 assert d['approvedTrackBadge'],(name,'Left category badge replaced with duplicate venue logo')
 assert not d['metadataClipped'],(name,'Track identity metadata clipped')
 print('TRACK CHASSIS RESTORED',name,'stakes',d['stakeRows'],'workspace',d['trackWorkspace']['width'])

# Same core chrome, record controls and protected identity space across profiles.
profiles=('horse','person','aqueduct','belmont','gulfstream','farm','stable','owner',
          'laptop-horse','laptop-person','laptop-aqueduct','laptop-belmont','laptop-farm','laptop-owner')
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
 if name in ('aqueduct','belmont','gulfstream','farm','stable','owner','laptop-aqueduct','laptop-belmont','laptop-farm','laptop-owner'):
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
python3 - <<'PY'
import json,html,re
from pathlib import Path
# World and News must use the same FM/OOTP shell on desktop/laptop.
for name in ('world-directory','world-news','office-news','laptop-world-news'):
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'World/News render probe incomplete')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Missing World/News visual metrics')
 data=json.loads(html.unescape(match.group(1)))
 assert data['rail'] and data['stage'] and data['worldDashboard'],(name,'Unified management layout missing')
 assert not data['sourceBridgeVisible'],(name,'Old Office screen reappeared')
 assert not data['duplicateGlobalMenuVisible'],(name,'Duplicate global navigation')
 if name=='world-directory':
  assert 0<data['worldPreviewRows']<=100,(name,'World directory rows missing or unbounded')
  assert data['worldPreviewSourceOnly'],(name,'World directory contains an unverified source ID')
  assert data['worldDirectoryTools'],(name,'World lacks visible search, sort, filters or import/export')
 else:
  assert data['newsDashboard'] and data['newsDashboard']['width']>=800,(name,'News screen not visible')
  assert data['newsSourceStatus'],(name,'Unverified news misrepresented as connected')
 print('WORLD/NEWS UNIFORMITY',name,data['stage']['width'])
PY

python3 - <<'PY'
import json,html,re
from pathlib import Path
for name in ('opportunity-board','laptop-opportunity-board'):
 source=Path(f'visual-audit/dom/probe-{name}.html').read_text()
 assert 'data-check="ready"' in source,(name,'Opportunity Board failed to render')
 match=re.search(r'<pre id="measure"[^>]*>(.*?)</pre>',source,re.S)
 assert match,(name,'Missing Opportunity Board geometry')
 d=json.loads(html.unescape(match.group(1)))
 assert d['rail'] and d['stage'] and d['opportunityDashboard'],(name,'Shared manager workspace missing')
 assert d['opportunityDashboard']['width']>=800,(name,'Manager workspace clipped')
 assert all(x in d['opportunityDeskLinks'] for x in ('Racing','Sales')),(name,'Direct operating desk links missing')
 assert d['opportunityIntegrity'],(name,'Source boundary not disclosed')
 assert not d['sourceBridgeVisible'],(name,'Legacy Office visible')
 print('FM/OOTP OPPORTUNITY BOARD',name,'width',d['opportunityDashboard']['width'])
PY
# Interact with the actual unified application, not static HTML snapshots.
# Every major screen must use the same rail, single route, and browser history.
cat > public/__wtw_nav_probe.html <<'HTML'
<!doctype html><html><head><meta charset="utf-8"><title>WTW direct nav probe</title></head>
<body style="margin:0"><iframe id="game" style="width:100vw;height:100vh;border:0"></iframe>
<pre id="result">pending</pre><script>
const frame=document.getElementById('game'),out=document.getElementById('result');
const tick=(ms=160)=>new Promise(resolve=>setTimeout(resolve,ms));
const records=[];
frame.onload=()=>setTimeout(async()=>{
 try{
  const d=frame.contentDocument,w=frame.contentWindow;
  const press=(key,value)=>{
   const selector='#wtwNextgen [data-ng="'+key+'"]'+(value?'[data-val="'+value+'"]':'');
   const button=d.querySelector(selector);
   if(!button)throw Error('Missing shared navigation: '+selector);
   button.click();
  };
  const check=(name,selector,selected)=>{
   const node=d.querySelector(selector);
   const active=d.querySelector('#wtwNextgen .ng-manager-rail-link.on');
   const hidden=d.querySelector('.app');
   const bridge=w.getComputedStyle(hidden).display==='none';
   const valid=!!node&&node.getBoundingClientRect().width>500&&bridge&&
    (!selected||active?.dataset.val===selected);
   records.push({name,valid,selected:active?.dataset.val||'Office',url:w.location.search});
   if(!valid)throw Error('Navigation mismatch for '+name);
  };
  await tick(550);
  check('Office opening','.ng-board');
  for(const section of ['Personnel','Facilities','Stable','Racing']){
   press('menu',section);await tick();
   check(section,section==='Stable'?'.ng-stable-roster-v2':
    '.ng-dept-roster[data-department="'+section+'"]',section);
  }
  press('office');await tick();
  check('Office return','.ng-board');
  w.history.back();await tick(250);
  check('Browser Back to Racing','.ng-dept-roster[data-department="Racing"]','Racing');
  w.history.forward();await tick(250);
  check('Browser Forward to Office','.ng-board');
  out.dataset.check='ready';out.textContent=JSON.stringify(records);
 }catch(err){out.dataset.check='error';out.textContent=String(err?.stack||err)}
},500);
frame.src='/next/?world=1999';
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --force-device-scale-factor=1 --window-size=1536,864 --virtual-time-budget=8000 \
  --dump-dom 'http://127.0.0.1:8765/__wtw_nav_probe.html' \
  > visual-audit/dom/probe-navigation.html 2>/tmp/wtw-nav-probe.log
python3 - <<'PY'
import json,html,re
from pathlib import Path
source=Path('visual-audit/dom/probe-navigation.html').read_text()
assert 'data-check="ready"' in source,('Shared navigation interactions failed',source[-1400:])
match=re.search(r'<pre id="result"[^>]*>(.*?)</pre>',source,re.S)
assert match, 'Missing browser navigation results'
rows=json.loads(html.unescape(match.group(1)))
assert len(rows)==8 and all(r['valid'] for r in rows),rows
assert [r['name'] for r in rows]==['Office opening','Personnel','Facilities','Stable',
 'Racing','Office return','Browser Back to Racing','Browser Forward to Office'],rows
print('DIRECT FM/OOTP NAVIGATION VERIFIED:',[r['name'] for r in rows])
PY
rm -f public/__wtw_nav_probe.html

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
