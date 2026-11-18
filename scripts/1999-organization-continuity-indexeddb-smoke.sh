#!/usr/bin/env bash
set -euo pipefail
CHROME="$(command -v google-chrome || command -v chromium || command -v chromium-browser || true)"
test -n "$CHROME" || { echo "Chromium not available"; exit 1; }
mkdir -p visual-audit/1999
python3 -m http.server 8872 --bind 127.0.0.1 --directory public >/tmp/wtw-v17-continuity-http.log 2>&1 &
server=$!
trap 'kill "$server" 2>/dev/null || true; rm -f public/__v17_continuity_probe.html' EXIT
for i in {1..30}; do
 curl -fsS 'http://127.0.0.1:8872/' >/dev/null 2>&1 && break
 sleep .2
done
cat >public/__v17_continuity_probe.html <<'HTML'
<!doctype html><html><head><meta charset="utf-8"><title>V17 continuity IDB QA</title></head>
<body><pre id="status">PENDING V17</pre>
<script type="module">
import {createIndexedDBOrganizationContinuityStore}
 from '/1999/engine/indexeddb-organization-continuity-v17.mjs';
import {openDurableOrganizationContinuityService,
 restoreDurableOrganizationContinuityArchive}
 from '/1999/engine/durable-organization-continuity-v17.mjs';

const node=document.querySelector('#status');
const unique=(Date.now().toString(36)+'-'+Math.random().toString(36).slice(2));
const dbName='V17-CONTINUITY-TEST-'+unique,destName=dbName+'-RESTORE';
const worldId='BROWSER-V17';
const source={
 worldId,foundingYear:1999,
 people:[
  {id:'P-1',name:'Margaret Hughes',role:'owner',primarySurname:'Hughes',birthYear:1970},
  {id:'P-2',name:'Brenda Green',role:'owner',primarySurname:'Green',birthYear:1975},
  {id:'P-3',name:'Carlos Morales',role:'trainer',primarySurname:'Morales',birthYear:1968},
  {id:'P-4',name:'Javier Ruiz',role:'trainer',primarySurname:'Ruiz',birthYear:1978},
  {id:'P-5',name:'Sarah Fox',role:'farm_manager',primarySurname:'Fox',birthYear:1980}
 ],
 owners:[{id:'O-1',name:'Foxgate Racing',principalId:'P-1',
  ownershipArchetype:'PRIVATE_RACING_OPERATION',familyName:null,namingRegion:'KENTUCKY'}],
 stables:[{id:'S-1',name:'Morales Racing',trainerId:'P-3',
  namingRegion:'KENTUCKY'}],
 farms:[{id:'F-1',name:'North Farm',managerIds:['P-5'],namingRegion:'KENTUCKY'}],
 trainingCenters:[],familyLinks:[]
};
const assert=(condition,message)=>{if(!condition)throw Error(message)};
const event=(id,type,organizationId,year,extra={})=>({
 eventId:id,sourceId:'BROWSER-PROVENANCE-'+id,
 type,organizationId,year,...extra
});
const deleteDB=name=>new Promise((resolve,reject)=>{
 const req=indexedDB.deleteDatabase(name);
 req.onsuccess=()=>resolve();
 req.onerror=()=>reject(req.error);
 req.onblocked=()=>reject(Error('Deleting database was blocked'));
});
let a,b,target;
try{
 a=createIndexedDBOrganizationContinuityStore({databaseName:dbName});
 const primary=await openDurableOrganizationContinuityService({storage:a,worldId,source});
 b=createIndexedDBOrganizationContinuityStore({databaseName:dbName});
 const stale=await openDurableOrganizationContinuityService({storage:b,worldId});
 assert(primary.revision===0&&stale.revision===0,'Initial load failed');

 const first=event('E1','CHANGE_OWNER_PRINCIPAL','O-1',2025,{toPersonId:'P-2'});
 await primary.apply({expectedRevision:0,event:first});
 assert(primary.getOrganization('O-1').id==='O-1','Owner ID changed');
 assert(primary.getOrganization('O-1').name==='Foxgate Racing','Owner name changed');
 let rejected=false;
 try{await stale.apply({expectedRevision:0,event:first})}
 catch(e){rejected=/Stale persisted/i.test(String(e))}
 assert(rejected,'Stale independent browser session was accepted');
 assert(stale.revision===0,'Rejected stale write mutated local state');

 await stale.refresh();
 await stale.apply({expectedRevision:1,event:event(
  'E2','CHANGE_STABLE_TRAINER','S-1',2026,{toPersonId:'P-4'}
 )});
 assert(stale.getOrganization('S-1').name==='Morales Racing','Stable name changed');
 const journal=await b.read({worldId});
 assert(journal.events.length===2&&journal.meta.revision===2,'Append-only journal failed');

 // Native IndexedDB unique event ID must abort an otherwise valid CAS.
 const proposed={...stale.cursor,revision:3,year:2027,eventCount:3};
 let duplicateBlocked=false;
 try{await b.append({worldId,expectedRevision:2,cursor:proposed,
  event:{...event('E1','CLOSE_ORGANIZATION','F-1',2027),revision:3}})}
 catch(e){duplicateBlocked=true}
 assert(duplicateBlocked,'Native IndexedDB duplicate event ID not rejected');
 assert((await b.read({worldId})).meta.revision===2,
  'Failed IDB write incorrectly advanced the durable revision');

 const archive=await stale.exportArchive();
 target=createIndexedDBOrganizationContinuityStore({databaseName:destName});
 const imported=await restoreDurableOrganizationContinuityArchive({
  storage:target,archive
 });
 assert(imported.revision===2,'Archive restore missing revisions');
 assert(imported.getOrganization('O-1').principalId==='P-2','Owner transition lost');
 assert(imported.getOrganization('S-1').trainerId==='P-4','Trainer transition lost');
 assert(imported.getOrganization('O-1').name==='Foxgate Racing',
  'Restore changed permanent organization name');
 let overwriteBlocked=false;
 try{await restoreDurableOrganizationContinuityArchive({storage:target,archive})}
 catch(e){overwriteBlocked=true}
 assert(overwriteBlocked,'Restore overwrote an existing continuity journal');
 await imported.apply({expectedRevision:2,event:event(
  'E3','CLOSE_ORGANIZATION','F-1',2030
 )});
 assert(imported.getOrganization('F-1').status==='CLOSED','Close event failed');
 await a.close();await b.close();await target.close();
 await deleteDB(dbName);await deleteDB(destName);
 node.textContent='WTW_V17_CONTINUITY_IDB_PASS rev=3 stale=blocked duplicate=blocked restore=verified';
}catch(e){node.textContent='WTW_V17_CONTINUITY_IDB_FAIL '+String(e.stack||e)}
</script></body></html>
HTML

output=visual-audit/1999/continuity-v17-indexeddb-dom.txt
"$CHROME" --headless=new --no-sandbox --disable-gpu --disable-dev-shm-usage \
 --disable-extensions --disable-background-networking \
 --virtual-time-budget=45000 --dump-dom \
 'http://127.0.0.1:8872/__v17_continuity_probe.html' >"$output" 2>/tmp/wtw-v17-chromium-errors.log || {
 cat /tmp/wtw-v17-chromium-errors.log
 exit 1
}
if grep -q 'WTW_V17_CONTINUITY_IDB_PASS' "$output"; then
 echo "PASS: real Chromium IndexedDB organization continuity, stale CAS, event ID, backup and restart"
else
 echo "FAIL: V17 Chromium continuity persistence"
 sed -n '/<pre id="status"/p' "$output" | head -c 5000
 tail -25 /tmp/wtw-v17-chromium-errors.log
 exit 1
fi
