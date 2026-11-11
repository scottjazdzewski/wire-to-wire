#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable" >&2; exit 1; }
mkdir -p visual-audit/manager-v2/screenshots visual-audit/manager-v2/dom
python3 -m http.server 8767 --bind 127.0.0.1 --directory public >/tmp/wtw-v2-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8767/manager/' >/dev/null 2>&1 && break; sleep .4; done
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
capture breeding '?ui=breeding' 'mg-department-suite breeding'
capture sales '?ui=sales' 'mg-department-suite sales'
capture personnel '?ui=person' 'mg-department-suite person'
capture farms '?ui=farm' 'mg-department-suite farm'
capture world '?ui=world' 'mg-department-suite world'
capture finances '?ui=finances' 'mg-finance-grid'

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
  result.dataset.state='passed';
  result.textContent=JSON.stringify({state:'passed',steps});
 }catch(e){
  result.dataset.state='failed';
  result.textContent=JSON.stringify({state:'failed',steps,error:String(e)});
 }
},950));
</script></body></html>
HTML
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
  --window-size=1536,864 --force-device-scale-factor=1 --virtual-time-budget=12000 \
  --dump-dom 'http://127.0.0.1:8767/manager/__wtw_interaction_probe.html' \
  > visual-audit/manager-v2/dom/interaction-probe.html 2>/tmp/wtw-mg-interaction.log
rm -f public/manager/__wtw_interaction_probe.html
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
for name in ('racing-office','global-search','horse-profile','people-profile','stable-roster','racetracks','racing-calendar','breeding','sales','personnel','farms','world','finances'):
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
PY
echo "Management Studio V2: thirteen real browser screenshots and source-bound DOM checks completed."
