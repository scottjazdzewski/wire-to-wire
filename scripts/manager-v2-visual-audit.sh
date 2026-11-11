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
python3 - <<'PY'
from pathlib import Path
import re,html
for name in ('racing-office','global-search','horse-profile','people-profile','stable-roster','racetracks'):
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
echo "Management Studio V2: six real browser screenshots and source-bound DOM checks completed."
