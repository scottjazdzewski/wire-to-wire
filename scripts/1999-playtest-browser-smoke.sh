#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chrome unavailable"; exit 1; }
mkdir -p visual-audit/1999
python3 -m http.server 8869 --bind 127.0.0.1 --directory public >/tmp/wtw-1999-playtest-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true' EXIT
for i in {1..30}; do curl -fsS 'http://127.0.0.1:8869/next/' >/dev/null 2>&1 && break; sleep .2; done
CHROME="$CHROME" node scripts/1999-playtest-browser-cdp.mjs | tee visual-audit/1999/playtest-cdp.txt
grep -q 'WTW_BROWSER_PLAYTEST_PASS' visual-audit/1999/playtest-cdp.txt
