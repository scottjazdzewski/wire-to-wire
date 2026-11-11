#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable" >&2; exit 1; }
mkdir -p visual-audit/manager-v2/screenshots visual-audit/manager-v2/dom
python3 -m http.server 8767 --bind 127.0.0.1 --directory public >/tmp/wtw-v2-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8767/manager/' >/dev/null 2>&1 && break; sleep .4; done
cat > public/manager/__wtw_interaction_probe.html <<'HTML'
<!doctype html><html><head><meta charset="utf-8"></head><body>
<pre id="probe" data-state="pending">Checking interactive game navigation</pre>
<iframe id="app" src="/manager/?ui=search" width="1536" height="864" style="border:0"></iframe>
<script>
const frame=document.getElementById('app'),result=document.getElementById('probe');
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
frame.addEventListener('load',()=>setTimeout(async()=>{
 const steps=[];
 try{
  const win=frame.contentWindow,doc=frame.contentDocument;
  const runtimeErrors=[];
  win.addEventListener('error',e=>runtimeErrors.push(String(e.message||e.error||'unknown error')));
  win.addEventListener('unhandledrejection',e=>runtimeErrors.push(String(e.reason||'unhandled rejection')));
  const check=(name,condition)=>{if(!condition)throw Error(name);steps.push(name)};
  const locate=(act,val)=>[...doc.querySelectorAll('#mgApp [data-mg]')].find(x=>
   x.dataset.mg===act&&(val==null||x.dataset.value===val||
   x.dataset.value?.startsWith(val)));
  check('Search screen mounted',!!doc.querySelector('.mg-search-layout'));
  const input=doc.querySelector('#mgSearch');
  check('Search field accepts input',!!input);
  input.value='Gabe Larkin';
  input.dispatchEvent(new win.Event('input',{bubbles:true}));
  await delay(250);
  check('Search filters correct person',doc.querySelector('.mg-table')?.textContent.includes('Gabe Larkin'));
  const person=locate('open','person|Gabe Larkin|');
  check('Search result opens person',!!person);
  person.click();
  await delay(350);
  check('Click displays People Profile',!!doc.querySelector('.mg-person-dossier')&&
   doc.querySelector('.mg-main')?.textContent.includes('Gabe Larkin'));
  const racing=locate('nav','racing');
  check('Racing is actionable',!!racing);
  racing.click();await delay(200);
  check('Click opens Racing dashboard',!!doc.querySelector('.mg-department-suite.racing'));
  const finance=locate('nav','finances');
  check('Finance is actionable',!!finance);
  finance.click();await delay(200);
  check('Click opens financial management screen',!!doc.querySelector('.mg-finance-grid'));
  const cash=locate('open-case','cash');
  check('Cash case opens from Finance',!!cash);
  cash.click();await delay(200);
  check('Cash review returns to Office decision',!!doc.querySelector('.mg-home-top')&&
    doc.querySelector('.mg-home-top')?.textContent.includes('Monthly cash projection'));
  const back=locate('back');
  check('Back control exists',!!back);
  back.click();await delay(250);
  check('Back restores Finance screen',!!doc.querySelector('.mg-finance-grid'));
  const forward=locate('forward');
  check('Forward control exists',!!forward);
  forward.click();await delay(250);
  check('Forward restores Office screen',!!doc.querySelector('.mg-home-top'));
  const global=doc.querySelector('#mgTopSearch');
  check('Global search available on every screen',!!global);
  global.value='Aqueduct';
  global.dispatchEvent(new win.Event('input',{bubbles:true}));
  await delay(250);
  const aqueduct=locate('open','track|Aqueduct|');
  check('Archived track is searchable',!!aqueduct);
  aqueduct.click();await delay(250);
  check('Archived track opens in native Management Studio',!!doc.querySelector('.mg-track-layout')&&
    doc.querySelector('.mg-main')?.textContent.includes('South Ozone Park'));
  check('Read-only Aqueduct track registry is populated',
    doc.querySelector('.mg-track-layout>.mg-section')?.querySelectorAll('tbody tr').length>=100);
  const saratoga=locate('open','track|Saratoga|');
  check('Circuit registry records are clickable',!!saratoga);
  saratoga.click();await delay(240);
  check('Registry click opens selected track',!!doc.querySelector('.mg-track-layout')&&
    doc.querySelector('.mg-profile-identity')?.textContent.includes('Saratoga'));
  const searchNav=locate('nav','search');
  check('Global Search remains accessible from track',!!searchNav);
  searchNav.click();await delay(200);
  const qScreen=doc.querySelector('#mgSearch');
  qScreen.value='Racing';qScreen.dispatchEvent(new win.Event('input',{bubbles:true}));
  await delay(200);
  const page=locate('open','screen|Racing|');
  check('Search returns game department screens',!!page);
  page.click();await delay(200);
  check('Game department result navigates',!!doc.querySelector('.mg-department-suite.racing'));
  locate('nav','search').click();await delay(200);
  const qPerson=doc.querySelector('#mgSearch');
  qPerson.value='Ismael Rosario';qPerson.dispatchEvent(new win.Event('input',{bubbles:true}));
  await delay(220);
  const rightArrow=[...doc.querySelectorAll('.mg-search-table tbody tr td:last-child [data-mg="open"]')]
   .find(x=>x.dataset.value==='person|Ismael Rosario|@HP-T-06-013-3');
  check('Historical person right-arrow retains immutable ID',!!rightArrow);
  rightArrow.click();await delay(260);
  check('Search right-arrow opens exact ID-matched historical person',
   win.location.search.includes('id=HP-T-06-013-3')&&
   !!doc.querySelector('.mg-person-dossier')&&doc.querySelector('.mg-main')?.textContent.includes('Camagüey'));


  result.dataset.state='passed';
  result.textContent=JSON.stringify({state:'passed',steps});
 }catch(e){
  result.dataset.state='failed';
  const d=frame.contentDocument,w=frame.contentWindow;
  result.textContent=JSON.stringify({state:'failed',steps,error:String(e),url:w.location.href,view:w.__WTW_MANAGER_V2__?.ui?.view,sourceTitle:d.querySelector('#routeTitle')?.textContent,sourcePresent:!!d.querySelector('#routeBody .profilePage'),personVisible:!!d.querySelector('.mg-person-dossier'),engineFn:typeof w.__wtwOfficeOpenSearchRecord,apiFn:typeof w.__WTW_MANAGER_V2__?.openRecord,runtimeErrors:typeof runtimeErrors!=='undefined'?runtimeErrors:[],stageText:d.querySelector('.mg-main')?.textContent.slice(0,200)});
 }
},950));
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --window-size=1536,864 --force-device-scale-factor=1 --virtual-time-budget=12000 \
  --dump-dom 'http://127.0.0.1:8767/manager/__wtw_interaction_probe.html' \
  > visual-audit/manager-v2/dom/interaction-probe.html 2>/tmp/wtw-mg-interaction.log
rm -f public/manager/__wtw_interaction_probe.html

capture(){
  local name="$1" route="$2" marker="$3"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --window-size=1536,864 --force-device-scale-factor=1 --virtual-time-budget=5000 \
    --screenshot="visual-audit/manager-v2/screenshots/$name.png" \
    "http://127.0.0.1:8767/manager/$route" >/tmp/wtw-v2-chrome-"$name".log 2>&1
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --window-size=1536,864 --force-device-scale-factor=1 --virtual-time-budget=5000 \
    --dump-dom "http://127.0.0.1:8767/manager/$route" \
    >"visual-audit/manager-v2/dom/$name.html" 2>/tmp/wtw-v2-dom-"$name".log
  grep -q "$marker" "visual-audit/manager-v2/dom/$name.html" || { echo "V2 render missing $marker on $name" >&2; exit 1; }
  test -s "visual-audit/manager-v2/screenshots/$name.png"
}
capture racing-office '' 'mg-home-top'
capture global-search '?ui=search' 'mg-search-layout'
capture horse-profile '?page=horse&name=The+Last+Match' 'mg-profile-grid4'
capture people-profile '?page=person&name=Gabe+Larkin' 'mg-person-dossier'
capture stable-roster '?ui=stable' 'mg-operations-grid'
capture racetracks '?ui=track' 'mg-operations-grid'
capture racing-calendar '?ui=racing' 'mg-department-suite racing'
capture breeding '?ui=breeding' 'mg-directory-layout breeding'
capture sales '?ui=sales' 'mg-directory-layout sales'
capture personnel '?ui=person' 'mg-directory-layout person'
capture farms '?ui=farm' 'mg-directory-layout farm'
capture world '?ui=world' 'mg-department-suite world'
capture finances '?ui=finances' 'mg-finance-grid'
capture keeneland-profile '?page=track&name=Keeneland' 'mg-track-layout'
capture aqueduct-directory '?page=track&name=Aqueduct' 'mg-track-layout'
capture historical-person '?page=person&name=Ismael+Rosario&id=HP-T-06-013-3' 'mg-person-dossier'

# Secondary desktop viewport: verify the full-width management design still
# composes at a normal 1280x800 monitor without redesigning for mobile.
capture_1280(){
 local name="$1" route="$2"
 "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --window-size=1280,800 --force-device-scale-factor=1 --virtual-time-budget=5000 \
  --screenshot="visual-audit/manager-v2/screenshots/$name-1280.png" \
  "http://127.0.0.1:8767/manager/$route" >/tmp/wtw-v2-1280-"$name".log 2>&1
 test -s "visual-audit/manager-v2/screenshots/$name-1280.png"
}
capture_1280 racing-office ''
capture_1280 horse-profile '?page=horse&name=The+Last+Match'
capture_1280 people-profile '?page=person&name=Gabe+Larkin'
capture_1280 global-search '?ui=search'


python3 - <<'PY'
from pathlib import Path
import html,re,json
source=Path('visual-audit/manager-v2/dom/interaction-probe.html').read_text()
match=re.search(r'<pre id="probe" data-state="([^"]+)">(.*?)</pre>',source,re.S)
assert match,( 'Manager UI navigation probe failed to run',source[-500:] )
data=json.loads(html.unescape(match.group(2)))
assert match.group(1)=='passed',data
assert len(data['steps'])>=14,data
print('PASS manager interactive navigation',len(data['steps']),'steps')
PY

python3 - <<'PY'
from pathlib import Path
import re,html
for name in ('racing-office','global-search','horse-profile','people-profile','stable-roster','racetracks','racing-calendar','breeding','sales','personnel','farms','world','finances','keeneland-profile','aqueduct-directory','historical-person'):
 s=Path('visual-audit/manager-v2/dom/'+name+'.html').read_text()
 assert 'id="mgApp"' in s,(name,'manager root absent')
 assert 'class="mg-rail"' in s,(name,'shared rail absent')
 assert 'class="mg-main"' in s,(name,'shared game stage absent')
 assert 'MG UI' in s,(name,'button action isolation absent')
 assert 'Internal Server Error' not in s,(name,'server error')
 print('PASS v2 route',name)
s=Path('visual-audit/manager-v2/dom/horse-profile.html').read_text()
assert len(re.findall(r'class="mg-attribute"',s))>=45,'Full horse attributes missing'
s=Path('visual-audit/manager-v2/dom/global-search.html').read_text()
assert len(re.findall(r'<tr>',s))>=20,'Dense search results missing'
people=Path('visual-audit/manager-v2/dom/people-profile.html').read_text()
assert 'Jacksonville' in people and 'Charles Town' in people,'Locked birthplace and 1999 base are not displayed for Gabe Larkin'
tracks=Path('visual-audit/manager-v2/dom/racetracks.html').read_text()
assert len(re.findall(r'data-value="track\\|',tracks))>=100,'Complete 134-track geography register did not reach Racecourses'
aqueduct=Path('visual-audit/manager-v2/dom/aqueduct-directory.html').read_text()
assert 'South Ozone Park' in aqueduct,'Read-only historic track profile lacks approved locality'
assert 'Racing World · Racecourse Register' in aqueduct,'Empty major-races panel was not replaced with actionable track register'
assert len(re.findall(r'data-value="track\\\\|',aqueduct))>=100,'Aqueduct source-backed course register did not populate with real tracks'
world_people=Path('visual-audit/manager-v2/dom/personnel.html').read_text()
assert len(re.findall(r'data-value="person\\|',world_people))>=1000,'People directory did not load the approved 1308-person projection'
historic=Path('visual-audit/manager-v2/dom/historical-person.html').read_text()
assert 'Camagüey' in historic and 'Havana' in historic,'Historical person-by-ID profile lost source career base/birthplace'

PY
echo "Management Studio V2: sixteen real browser screenshots and source-bound DOM checks completed."
