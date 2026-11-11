#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
if [[ -z "$CHROME" ]]; then echo "Browser unavailable: cannot visually validate" >&2; exit 1; fi
mkdir -p visual-audit/screenshots visual-audit/dom
python3 -m http.server 8765 --bind 127.0.0.1 --directory public >/tmp/wtw-visual-http.log 2>&1 &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8765/' >/dev/null 2>&1 && break; sleep .5; done

capture(){
  local name="$1" route="$2" marker="$3"
  echo "Rendering $name -> $route"
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --screenshot="visual-audit/screenshots/$name.png" \
    "http://127.0.0.1:8765/$route" >/tmp/wtw-chrome-"$name".log 2>&1
  "$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
    --force-device-scale-factor=1 --window-size=1536,864 \
    --virtual-time-budget=4000 --dump-dom \
    "http://127.0.0.1:8765/$route" >"visual-audit/dom/$name.html" 2>/tmp/wtw-dom-"$name".log
  if ! grep -q "$marker" "visual-audit/dom/$name.html"; then
    echo "RENDER FAILURE: $name missing $marker" >&2
    tail -35 /tmp/wtw-dom-"$name".log || true
    exit 1
  fi
  test -s "visual-audit/screenshots/$name.png"
}
capture racing-office '' 'ng-board'
capture global-search '?ui=Search' 'ng-search-roster-page'
capture horse-profile '?page=horse&name=The+Last+Match' 'ng-horse-dossier'
capture people-profile '?page=person&name=Gabe+Larkin' 'ng-person-workspace-overview'
capture personnel '?ui=Personnel' 'ng-manager-screen'
capture facilities '?ui=Facilities' 'ng-manager-screen'
capture finances '?ui=Finances' 'ng-manager-screen'
capture breeding '?ui=Breeding' 'ng-manager-screen'
capture history-vault 'archive/' 'History Vault'
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
