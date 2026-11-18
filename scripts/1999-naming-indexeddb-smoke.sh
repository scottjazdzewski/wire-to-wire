#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chromium unavailable for naming IndexedDB smoke"; exit 1; }
mkdir -p visual-audit/1999
python3 -m http.server 8868 --bind 127.0.0.1 --directory public >/tmp/wtw-v12-idb-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f public/__v12_name_idb_probe.html' EXIT
for i in {1..30}; do
 curl -fsS 'http://127.0.0.1:8868/' >/dev/null 2>&1 && break
 sleep .2
done
cat > public/__v12_name_idb_probe.html <<'HTML'
<!doctype html><html lang="en"><head><meta charset="utf-8"><title>WTW naming V12 IndexedDB test</title></head>
<body><pre id="status" data-state="pending">NAMING V12 PENDING</pre>
<script type="module">
import {createIndexedDBFictionalNamingStore} from
 '/1999/engine/indexeddb-fictional-naming-store.mjs';
import {
 openDurableFictionalNameService,restoreDurableFictionalNamingBundle
} from '/1999/engine/durable-fictional-name-service.mjs';

const node=document.getElementById('status');
const unique=(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const sourceDB='WTW-V12-QA-'+unique,restoreDB=sourceDB+'-restore';
const key={worldId:'Browser-V12-QA',seed:19990101};
const spec={roles:{trainer:5,jockey:4},owners:12,
 facilities:{generalFarms:2,studFarms:1},maxPartnershipGroups:3};
let s1,s2,backup;
const check=(condition,message)=>{if(!condition)throw Error(message)};
const deleteDB=name=>new Promise((resolve,reject)=>{
 const req=indexedDB.deleteDatabase(name);
 req.onsuccess=()=>resolve();
 req.onerror=()=>reject(req.error);
 req.onblocked=()=>reject(Error('Database deletion blocked: '+name));
});
try {
 s1=createIndexedDBFictionalNamingStore({databaseName:sourceDB});
 const first=await openDurableFictionalNameService({
  storage:s1,...key,protectedPeople:['José García'],
  protectedOrganizations:['Kingsmere Farm']
 });
 const emitted=await first.generate(spec);
 check(emitted.nextCursor.revision===1,'First durable revision');
 check(!emitted.nextCursor.mintedNames,'Name history leaked to compact cursor');
 check(first.hasName('Jose Garcia'),'Accented protected person missing');
 check(first.hasName(emitted.people[0].name),'Fresh person not indexed');

 s2=createIndexedDBFictionalNamingStore({databaseName:sourceDB});
 const concurrent=await openDurableFictionalNameService({storage:s2,...key});
 check(concurrent.revision===1,'Browser restart failed');
 const second=await first.generate(spec);
 check(second.nextCursor.revision===2,'Second naming commit');

 let stale=false;
 try{await concurrent.generate(spec)}catch(error){stale=/Stale persisted/i.test(String(error))}
 check(stale,'Concurrent stale revision must reject');
 check(concurrent.revision===1,'Stale commit modified in-memory registry');
 await concurrent.refresh();
 check(concurrent.revision===2,'Refresh did not recover revision');

 const fromDisk=await s2.read(key);
 check(fromDisk.meta.revision===2,'IndexedDB cursor not committed');
 check(fromDisk.batches.length===2,'Append-only IndexedDB journal missing');
 check(!('mintedNames' in fromDisk.meta.cursor),'Complete history in persisted cursor');
 const directory=await s1.findOwners({...key,limit:100});
 check(directory.length===24,'Indexed owner directory incorrect');
 const region=directory[0].region;
 const regional=await s1.findOwners({...key,region,limit:100});
 check(regional.length>=1&&regional.every(r=>r.region===region),'Indexed region lookup failed');

 // Probe a native IDB transaction that writes a name key already present.
 // The entire transaction must abort and leave cursor/revision unchanged.
 const badBatch={expectedRevision:2,revision:3,batchIndex:2,
  people:[{id:'BAD-PERSON',name:emitted.people[0].name}],
  organizations:[],owners:[]};
 const badCursor={...second.nextCursor,revision:3,nextBatch:3};
 let rolledBack=false;
 try{await s1.append({...key,expectedRevision:2,batch:badBatch,cursor:badCursor})}
 catch(error){rolledBack=true}
 check(rolledBack,'IndexedDB unique collision did not cause rollback');
 check((await s1.read(key)).meta.revision===2,'Failed IndexedDB write advanced revision');

 backup=await first.exportBundle();
 const target=createIndexedDBFictionalNamingStore({databaseName:restoreDB});
 const imported=await restoreDurableFictionalNamingBundle({storage:target,bundle:backup});
 check(imported.revision===2,'Standalone naming backup restore failed');
 check(imported.ownerCount===24,'Backup owner registry lost entries');
 const nextImported=await imported.generate(spec);
 await first.refresh();
 const nextSource=await first.generate(spec);
 check(JSON.stringify(nextSource.owners.map(o=>o.name))===
  JSON.stringify(nextImported.owners.map(o=>o.name)),
  'Post-restart deterministic names mismatch');
 await s1.close();await s2.close();await target.close();
 await deleteDB(sourceDB);await deleteDB(restoreDB);
 node.dataset.state='passed';
 node.textContent='NAMING_V12_INDEXEDDB_PASS revisions=3 owners=36 rollback=verified restore=verified';
}catch(error){
 node.dataset.state='failed';
 node.textContent='NAMING_V12_INDEXEDDB_FAIL '+String(error?.stack||error);
}
</script></body></html>
HTML
output=visual-audit/1999/naming-v12-indexeddb-dom.txt
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --disable-extensions --disable-background-networking --disable-software-rasterizer \
 --virtual-time-budget=45000 --dump-dom \
 'http://127.0.0.1:8868/__v12_name_idb_probe.html' >"$output" 2>/tmp/wtw-naming-v12-chromium-errors.log || {
 cat /tmp/wtw-naming-v12-chromium-errors.log
 exit 1
}
if grep -q 'NAMING_V12_INDEXEDDB_PASS' "$output"; then
 echo "PASS: real Chromium IndexedDB naming rollback, restart, CAS, archive and identity tests"
else
 echo "FAILED: V12 browser test"
 sed -n '/<pre id="status"/p' "$output" | head -c 4000
 cat /tmp/wtw-naming-v12-chromium-errors.log | tail -25
 exit 1
fi
