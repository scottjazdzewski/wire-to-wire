#!/usr/bin/env node
/** Actual full-population browser open/reopen acceptance.
 * Runs the approved /next/ UI and its real IndexedDB (no mocked storage).
 * Does NOT claim the separate founding gameplay kernel uses these records.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {tmpdir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const profile=mkdtempSync(join(tmpdir(),'wtw-full-industry-'));
const port=Number(process.env.WTW_CDP_PORT||9443),
 sitePort=Number(process.env.WTW_SITE_PORT||8891);
const chrome=process.env.CHROME||'google-chrome';
const limit=Number(process.env.WTW_FULL_WORLD_TIMEOUT_MS||540000);
const server=spawn('python3',['-m','http.server',String(sitePort),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let browser=null;
async function readyServer(){
 for(let i=0;i<100;i++){
  try{if((await fetch('http://127.0.0.1:'+sitePort+'/next/')).ok)return}catch{}
  await pause(200);
 }
 throw Error('WTW local server did not start');
}
async function launch(){
 const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--disable-extensions','--disable-background-networking',
  '--no-first-run','--remote-allow-origins=*','--remote-debugging-port='+port,
  '--user-data-dir='+profile,'http://127.0.0.1:'+sitePort+'/next/'],{stdio:'ignore'});
 let socket;
 try{
  let page;
  for(let i=0;i<150;i++){
   if(proc.exitCode!==null)throw Error('Chromium closed before startup');
   try{
    const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
    page=tabs.find(t=>t.type==='page'&&t.url.includes('/next/'));
    if(page)break;
   }catch{}
   await pause(200);
  }
  assert.ok(page,'No /next/ Chromium page');
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});
   socket.addEventListener('error',no,{once:true})});
  let seq=0;const waiting=new Map();
  socket.addEventListener('message',event=>{
   let msg;try{msg=JSON.parse(event.data)}catch{return}
   const item=waiting.get(msg.id);if(!item)return;
   waiting.delete(msg.id);if(msg.error)item.no(Error(msg.error.message));
   else item.yes(msg.result);
  });
  const send=(method,params={})=>new Promise((yes,no)=>{
   const id=++seq;waiting.set(id,{yes,no});
   socket.send(JSON.stringify({id,method,params}));
  });
  await send('Runtime.enable');
  const evalJS=async expression=>{
   const res=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
   if(res.exceptionDetails)throw Error('Chromium runtime exception: '+JSON.stringify(res.exceptionDetails));
   return res.result.value;
  };
  return {proc,socket,evalJS};
 }catch(error){try{socket?.close()}catch{}proc.kill('SIGTERM');throw error}
}
async function stop(b){
 if(!b)return;try{b.socket.close()}catch{}
 if(b.proc.exitCode===null){
  b.proc.kill('SIGTERM');
  await Promise.race([new Promise(ok=>b.proc.once('exit',ok)),pause(5000)]);
  if(b.proc.exitCode===null)b.proc.kill('SIGKILL');
 }
}
async function waitFor(label,fn,ms=30000){
 const start=Date.now(),errors=[];
 while(Date.now()-start<ms){
  try{const result=await fn();if(result?.done)return result.value;
   if(result?.fatal)throw Error(label+': '+result.fatal)}
  catch(err){errors.push(String(err.message||err));if(errors.length>3)errors.shift()}
  await pause(300);
 }
 throw Error(label+' timed out. Last exceptions: '+errors.join(' | '));
}
const inspect=`(async()=>{
 const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
 const store=await api.open1999IndustryDatabase();
 try{
  const status=await api.reopenPersistent1999Industry(store,{
   seed:19990101,worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});
  if(!status)return {state:'MISSING'};
  if(status.status!=='READY')return {state:status.status,
   batches:status.manifest?.horseBatchesCommitted||0};
  const c=status.certificate;
  const directory=await api.readPersistent1999Directory(store,status.manifest);
  const first=await api.readPersistent1999IndustryBatch(store,status.manifest,'horseBatches',0);
  const cards=await api.readPersistent1999IndustryBatch(store,status.manifest,'calendarBatches',0);
  const staff=await api.readPersistent1999IndustryBatch(store,status.manifest,'personBatches',0);
  const firstRunner=await api.findPersistent1999Horse(store,status.manifest,
   'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001');
  return {state:'READY',horses:c.horses,people:c.people,coverings:c.coverings,
   raceDays:c.raceDays,scheduledRaces:c.scheduledRaces,organizations:directory.length,
   tracks:directory.filter(x=>x.id.startsWith('T-')).length,
   approvedExpansion:['T-0119','T-0120','T-0121','T-0122','T-0123','T-0124'].every(id=>directory.some(t=>t.id===id)),
   archivedExcluded:!['T-0033','T-0103','T-0104','T-0105','T-0107','T-0108'].some(id=>directory.some(t=>t.id===id)),
   comanche:directory.find(t=>t.id==='T-0061')?.name,
   fairHostTrack:directory.find(t=>t.id==='T-0075')?.physicalTrackId,
   namedPersonnel:staff.filter(x=>!!x.name).length,
   staffBios:staff.every(x=>!!x.dateOfBirth&&!!x.birthplace?.city&&!!x.birthCountryCode),
   ratedHorse:first.every(x=>x.ratings?.speed>0),
   horseBirthplaces:first.every(x=>!!x.birthplace?.city&&!!x.birthplace?.country),
   namedBreeders:first.every(x=>!!x.name&&x.namingStatus==='PROVISIONAL_EDITABLE_1999_OPENING'),
   namedRacehorse:!!firstRunner?.name,cards:cards.length,
   immutableHorseId:first[0]?.id,worldId:status.manifest.worldId,
   calendarHasEntries:cards.some(x=>x.races.some(r=>r.fieldHorseIds.length>0))};
 }finally{store.close()}
})()`;
try{
 await readyServer();
 browser=await launch();
 await waitFor('Career Manager module',async()=>{
  const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:v,value:v};
 });
 await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
 const clicked=await browser.evalJS(`(()=>{
  const button=document.querySelector('[data-cc-action="open-full-industry"]');
  if(!button)return false;button.click();return true;
 })()`);
 assert.equal(clicked,true,'Create full industry action missing from approved UI');
 const start=Date.now();let snap;
 while(Date.now()-start<limit){
  snap=await browser.evalJS(inspect);
  const alert=await browser.evalJS(`document.querySelector('#wtwCommercialCareerModal')?.textContent?.match(/ERROR:[^\\n]{0,220}/)?.[0]||null`);
  if(alert)throw Error('Full-industry UI failed: '+alert);
  if(snap.state==='READY')break;
  await pause(900);
 }
 assert.equal(snap?.state,'READY','Full industry never reached READY: '+JSON.stringify(snap));
 assert.equal(snap.horses,300000,'Default world must materialize the complete selected 300k horses');
 assert.ok(snap.people>30000,'Expected full support workforce');
 assert.equal(snap.tracks,107,'Owner-approved operating 1999 track count');
 assert.equal(snap.approvedExpansion,true,'Missing approved six expansion venues');
 assert.equal(snap.archivedExcluded,true,'Archived 1999 venues remained active');
 assert.equal(snap.comanche,'Comanche Raceway');
 assert.equal(snap.fairHostTrack,'T-0032','San Mateo County Fair must use Bay Meadows facility');
 assert.ok(snap.raceDays>=1500,'Expected complete condition-book race calendar');
 assert.ok(snap.scheduledRaces>snap.raceDays);
 assert.ok(snap.coverings>40000,'Expected full breeding books');
 assert.equal(snap.calendarHasEntries,false,'No pre-generated race results or entries');
 assert.equal(snap.ratedHorse,true,'Every opening horse must have ratings');
 assert.equal(snap.horseBirthplaces,true,'Opening horses require actual modeled foaling locations');
 assert.equal(snap.staffBios,true,'Every opening staff record needs a full modeled birthplace and birthdate');
 assert.equal(snap.namedBreeders,true,'Broodmares must have provisional registered names');
 assert.equal(snap.namedRacehorse,true,'Race-ready horses must have provisional names');
 assert.ok(snap.namedPersonnel>0,'Personnel naming provider did not populate names');
 const fullWorldKingsmereRunId='WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061';
 const readCareerSave=async(selectedRunId=null)=>browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const db=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(db,{
    seed:19990101,worldId:${JSON.stringify(snap.worldId)}});
   const manifest=world.manifest;
   const runId=${JSON.stringify(selectedRunId)}||'WTW-RUN-1999-'+manifest.seed+'-SIZE-'+
    (manifest.targetOpeningHorses??manifest.horseCount)+'-OP-O-000061';
   const record=await api.loadPersistent1999CareerRun(db,manifest,runId);
   if(!record)return null;
   const json=JSON.stringify(record),run=record.changes?.canonicalRun;
   const races=Object.values(run?.runtime?.races||{});
   return {gameDate:record.gameDate,runId:record.runId,
    operationId:run?.player?.operation_id||record.player?.operation_id||null,
    utf8JsonBytes:new TextEncoder().encode(json).length,
    stableHorses:run?.stable_horse_ids?.length??0,
    registeredHorses:Object.keys(run?.runtime?.registered_horses?.by_id||{}).length,
    races:races.length,
    officialRaces:races.filter(r=>r.status==='OFFICIAL_SIM_RESULT').length,
    raceFields:races.map(r=>({status:r.status,field:r.field?.length??0,date:r.date,
     raceId:r.id,results:(r.results||[]).map(x=>({horseId:x.horse_id,
      finish:x.finish,earningsMinor:x.earnings_minor,
      ownerShareMinor:x.owner_share_minor,jockeyShareMinor:x.jockey_share_minor,
      trainerShareMinor:x.trainer_share_minor}))}))};
  }finally{db.close()}
 })()`);
 await waitFor('Kingsmere full-world career selector',async()=>{
  const ready=await browser.evalJS(`!!document.querySelector('[data-cc="player-operation"]')&&!!document.querySelector('[data-cc-action="open-selected-operation"]')`);
  return {done:ready,value:ready};
 });
 const storageBeforeCareer=await browser.evalJS('navigator.storage.estimate()');
 const startClicked=await browser.evalJS(`(()=>{
  const select=document.querySelector('[data-cc="player-operation"]');
  const button=document.querySelector('[data-cc-action="open-selected-operation"]');
  if(!select||!button||![...select.options].some(o=>o.value==='O-000061'))return false;
  select.value='O-000061';
  select.dispatchEvent(new Event('change',{bubbles:true}));
  button.click();return true;
 })()`);
 assert.equal(startClicked,true,'Kingsmere full-world operation control missing');
 await waitFor('full-world career save',async()=>{
  const saved=await readCareerSave();return {done:!!saved,value:saved};
 },300000);
 const careerAtStart=await readCareerSave();
 assert.equal(careerAtStart.operationId,'O-000061','Full-world career must open Kingsmere');
 assert.ok(careerAtStart.stableHorses>=5,'Kingsmere career lacks its approved opening inventory');
 // Prove the REAL saved 300,000-horse industry has complete ratings across
 // every horse and every real worker. Unit fixtures alone cannot certify it.
 const allRatings=await browser.evalJS(
  'window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldRatingAudit?.()||null');
 assert.ok(allRatings?.valid,
  '1999 full-world saved rating census missing values: '+JSON.stringify(allRatings));
 assert.equal(allRatings.horses,300000);
 assert.equal(allRatings.ratedHorses,300000);
 assert.equal(allRatings.people,allRatings.expectedPeople);
 assert.equal(allRatings.ratedPeople,allRatings.people);
 assert.ok(allRatings.people>=75000,'Saved 1999 personnel census unexpectedly incomplete');
 console.log('WTW_1999_ALL_HORSES_AND_PEOPLE_RATED_PASS '+JSON.stringify(allRatings));
 // Real saved V10 edit on a permanent existing horse ID, NOT a demo registry.
 const editorHorseId=snap.immutableHorseId;
 const editorNewName='V10 Acceptance World Horse';
 const editorBefore=await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldHorseById?.(${JSON.stringify(editorHorseId)})?.name||null`);
 assert.ok(editorBefore,'Active playable 300k World profile not available to the editor');
 const editSaved=await browser.evalJS(`window.WTWCompactCareerManager.editSavedWorldEntity({
  kind:'horse',id:${JSON.stringify(editorHorseId)},
  patch:{name:${JSON.stringify(editorNewName)},biography:'Approved saved-career test identity'}})`);
 assert.equal(editSaved.kind,'horse');
 assert.equal(editSaved.id,editorHorseId);
 const readCareerWorldEdit=async()=>browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const db=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(db,{seed:19990101,
    worldId:${JSON.stringify(snap.worldId)}});
   const runId='WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061';
   const saved=await api.loadPersistent1999CareerRun(db,world.manifest,runId);
   return {name:saved?.changes?.worldEdits?.byId?.[${JSON.stringify('horse:'+editorHorseId)}]?.name||null,
    count:Object.keys(saved?.changes?.worldEdits?.byId||{}).length,
    horseCount:world.manifest.horseCount,runId:saved?.runId};
  }finally{db.close()}
 })()`);
 const editedAtStart=await readCareerWorldEdit();
 assert.equal(editedAtStart.name,editorNewName);
 assert.equal(editedAtStart.horseCount,300000);
 assert.ok(editedAtStart.count>=1);
 const editedView=await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldHorseById?.(${JSON.stringify(editorHorseId)})?.name||null`);
 assert.equal(editedView,editorNewName,'World profile still showed old horse name after durable save');

 // Naming Desk must ACTUALLY rename a distinct player-owned source horse,
 // not merely record a preference or change the frozen industry snapshot.
 const ownedNamingTarget=await browser.evalJS(`(()=>{
  const view=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
  const row=(view?.horseRows||[]).find(h=>h.sourceHorseId&&
   h.sourceHorseId!==${JSON.stringify(editorHorseId)}&&
   String(h.tag||'').split(' · ').includes('OWNED'));
  return row?{id:row.sourceHorseId,name:row.name}:null;
 })()`);
 assert.ok(ownedNamingTarget?.id,
  'Real 300k owner career did not expose another owned horse for naming');
 const chosenCareerName='Kingsmere Sunday';
 assert.equal(await browser.evalJS(`window.WTWCompactCareerManager.isSavedCareerHorseNameInUse(
  ${JSON.stringify(chosenCareerName)})`),false);
 const nameReceipt=await browser.evalJS(`window.WTWCompactCareerManager.commitSavedCareerHorseNamingPreference({
  name:${JSON.stringify(chosenCareerName)},decision:'CHOOSE',
  motif_id:'owner-story',horse_id:${JSON.stringify(ownedNamingTarget.id)},
  prompt:'one memorable natural racehorse name'})`);
 assert.equal(nameReceipt.identityUpdated,true,
  'Naming Desk choice did not apply to the saved V10 horse identity');
 const savedHorseNaming=async()=>browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const db=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(db,{seed:19990101,
    worldId:${JSON.stringify(snap.worldId)}});
   const saved=await api.loadPersistent1999CareerRun(db,world.manifest,
    'WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061');
   return {name:saved?.changes?.worldEdits?.byId?.[
    ${JSON.stringify('horse:'+ownedNamingTarget.id)}]?.name||null,
    feedback:saved?.changes?.namingFeedback?.decisions?.kingsmeresunday||null};
  }finally{db.close()}
 })()`);
 const firstNamingSave=await savedHorseNaming();
 assert.equal(firstNamingSave.name,chosenCareerName);
 assert.equal(firstNamingSave.feedback?.decision,'CHOOSE');
 assert.equal(firstNamingSave.feedback?.horseId,ownedNamingTarget.id);
 assert.equal(await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldHorseById?.(
  ${JSON.stringify(ownedNamingTarget.id)})?.name||null`),chosenCareerName);

 const storageAfterStart=await browser.evalJS('navigator.storage.estimate()');
 await waitFor('full-world game-day control',async()=>{
  const ready=await browser.evalJS(`!!document.querySelector('[data-cc-action="advance-test-day"]')`);
  return {done:ready,value:ready};
 });
 await pause(500);
 const dayClicked=await browser.evalJS(`(()=>{
  const button=document.querySelector('[data-cc-action="advance-test-day"]');
  if(!button)return false;button.click();return true;
 })()`);
 assert.equal(dayClicked,true,'Full-world game-day control missing');
 const dayAction=await waitFor('full-world day-advance result',async()=>{
  const state=await browser.evalJS(`(()=>{
   const text=document.querySelector('#wtwCommercialCareerModal')?.textContent||'';
   return {error:text.match(/ERROR:[^\\n]*/)?.[0]||null,
    advanced:text.match(/GAME DATE [^\\n]*/)?.[0]||null};
  })()`);
  return {done:!!(state.error||state.advanced),value:state};
 },45000);
 assert.ok(dayAction.advanced,'Full-world day advance failed: '+dayAction.error);
 const careerAfterDay=await waitFor('full-world one-day career save',async()=>{
  const saved=await readCareerSave();
  return {done:!!saved&&saved.gameDate!==careerAtStart.gameDate,value:saved};
 },60000);
 const editedAfterDay=await readCareerWorldEdit();
 assert.equal(editedAfterDay.name,editorNewName,
  'Advancing the actual 1999 gameplay career erased the saved World override');
 const namingAfterDay=await savedHorseNaming();
 assert.equal(namingAfterDay.name,chosenCareerName,
  'Advancing the 1999 game erased a chosen horse name');
 assert.equal(namingAfterDay.feedback?.horseId,ownedNamingTarget.id,
  'Advancing the game lost its owner naming decision');
 assert.equal(careerAfterDay.gameDate,dayAction.advanced.match(/GAME DATE (\d{4}-\d{2}-\d{2})/)?.[1],
  'The one-day game advance notice and persisted career date disagree');
 const storageAfterDay=await browser.evalJS('navigator.storage.estimate()');
 const playedCareerEvidence={worldHorses:snap.horses,worldId:snap.worldId,
  storageUsageBytes:{beforeCareer:storageBeforeCareer.usage,
   afterStart:storageAfterStart.usage,afterOneDay:storageAfterDay.usage},
  saves:{careerAtStart,careerAfterOneDay:careerAfterDay},
  deltas:{startToOneDayBytes:careerAfterDay.utf8JsonBytes-careerAtStart.utf8JsonBytes,
   worldToCareerStartStorageBytes:storageAfterStart.usage-storageBeforeCareer.usage,
   worldToOneDayStorageBytes:storageAfterDay.usage-storageBeforeCareer.usage}};
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_PASS '+JSON.stringify(dayAction));
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_SIZE '+JSON.stringify(playedCareerEvidence));
 console.log('WTW_FULL_WORLD_FIRST_OPEN_PASS '+JSON.stringify(snap));
 await stop(browser);browser=null;
 browser=await launch();
 await waitFor('Career Manager after restart',async()=>{
  const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:v,value:v};
 });
 const careerAfterProcessRestart=await readCareerSave();
 assert.deepEqual(careerAfterProcessRestart,careerAfterDay,
  'Played full-world career record changed or failed to reopen after Chromium restart');
 const editedAfterRestart=await readCareerWorldEdit();
 assert.equal(editedAfterRestart.name,editorNewName,
  'Restart lost the career-owned World edit from IndexedDB');
 await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
 const reopenedEditor=await waitFor('reopened saved World editor and immutable horse identity',async()=>{
  const name=await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldHorseById?.(${JSON.stringify(editorHorseId)})?.name||null`);
  return {done:name===editorNewName,value:name};
 },120000);
 assert.equal(reopenedEditor,editorNewName);
 const renamedAfterProcessRestart=await waitFor(
  'saved player-owned horse name after full Chromium restart',async()=>{
   const name=await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.worldHorseById?.(
    ${JSON.stringify(ownedNamingTarget.id)})?.name||null`);
   return {done:name===chosenCareerName,value:name};
  },120000);
 assert.equal(renamedAfterProcessRestart,chosenCareerName);
 const verifiedNameReopen=await savedHorseNaming();
 assert.equal(verifiedNameReopen.name,chosenCareerName);
 assert.equal(verifiedNameReopen.feedback?.horseId,ownedNamingTarget.id);
 console.log('WTW_V10_NAMING_DESK_ACTUAL_HORSE_REOPEN_PASS '+
  JSON.stringify({horseId:ownedNamingTarget.id,name:chosenCareerName,
   decisionRevision:nameReceipt.feedbackRevision,worldHorseCount:300000}));
 console.log('WTW_V10_WORLD_EDITOR_DURABLE_REOPEN_PASS '+
  JSON.stringify({horseId:editorHorseId,before:editorBefore,after:reopenedEditor,
   careerDate:careerAfterDay.gameDate,worldHorseCount:300000}));
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_REOPEN_PASS '+JSON.stringify(careerAfterProcessRestart));
 if(process.env.WTW_PLAYABLE_WORLD_ONLY==='1'){
  // The purpose of the playable-world gate is to prove a complete world can
  // be opened, advanced, saved, and used with a real persisted race result.
  // The bundled checkpoint supplies that already-settled race, so this fast
  // path avoids replaying months of calendar days just to recreate it.
  await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
  const bundled=await browser.evalJS(`(async()=>{
   const response=await fetch('/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER_V10.wtwcareer.gz');
   if(!response.ok)throw Error('Bundled playable career checkpoint is unavailable');
   const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
   window.confirm=()=>true;
   return window.WTWCompactCareerManager.importSharedCareerFile(
    new File([bytes],'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
     {type:'application/json'}));
  })()`);
  assert.equal(bundled.worldId,snap.worldId,'Bundled race checkpoint must use this exact full world');
  assert.equal(bundled.runId,careerAfterDay.runId);
  const bundledSave=await readCareerSave();
  assert.ok(bundledSave?.officialRaces>=1,'Playable checkpoint must contain an official race');
  assert.ok(bundledSave.raceFields.some(r=>r.status==='OFFICIAL_SIM_RESULT'&&r.results.length>=2),
   'Playable checkpoint must retain the official race field and result');
  console.log('WTW_FULL_WORLD_PLAYABLE_RACE_PASS '+JSON.stringify({
   worldId:bundled.worldId,runId:bundled.runId,gameDate:bundled.gameDate,
   horses:snap.horses,people:snap.people,tracks:snap.tracks,
   stableHorses:bundledSave.stableHorses,officialRaces:bundledSave.officialRaces,
   raceFields:bundledSave.raceFields.filter(r=>r.status==='OFFICIAL_SIM_RESULT')}));
  const shared=await browser.evalJS(`(async()=>{
   const bytes=await window.WTWCompactCareerManager.sharedCareerBytes();
   const json=new TextDecoder().decode(bytes);
   const imported=await window.WTWCompactCareerManager.importSharedCareerFile(
    new File([bytes],'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
     {type:'application/json'}));
   return {json,imported};
  })()`);
  const path=resolve(process.env.WTW_SHARED_CAREER_EXPORT_PATH||
   'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer');
  mkdirSync(dirname(path),{recursive:true});writeFileSync(path,shared.json,'utf8');
  assert.equal(shared.imported.worldId,snap.worldId);
  const exportedEnvelope=JSON.parse(shared.json);
  assert.ok(Object.values(exportedEnvelope.payload?.careerRecord?.changes?.canonicalRun?.runtime?.races||{})
   .some(r=>r.status==='OFFICIAL_SIM_RESULT'));
  console.log('WTW_SHARED_CAREER_EXPORT_PASS '+JSON.stringify({
   path:'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
   bytes:Buffer.byteLength(shared.json),
   sha256:createHash('sha256').update(shared.json).digest('hex'),
   worldId:shared.imported.worldId,runId:shared.imported.runId,
   gameDate:shared.imported.gameDate,officialRaces:bundledSave.officialRaces,
   importReadBack:true}));
  const afterImport=await readCareerSave();
  assert.ok(afterImport.raceFields.some(r=>r.status==='OFFICIAL_SIM_RESULT'));
  await stop(browser);browser=null;browser=await launch();
  await waitFor('Career Manager after playable-world restart',async()=>{
   const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
   return {done:v,value:v};
  });
  await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
  await waitFor('Kingsmere selector after playable-world restart',async()=>{
   const v=await browser.evalJS(`!!document.querySelector('[data-cc="player-operation"]')&&
    !!document.querySelector('[data-cc-action="open-selected-operation"]')`);
   return {done:v,value:v};
  });
  const resumed=await browser.evalJS(`(()=>{
   const select=document.querySelector('[data-cc="player-operation"]');
   const button=document.querySelector('[data-cc-action="open-selected-operation"]');
   if(!select||!button||![...select.options].some(o=>o.value==='O-000061'))return false;
   select.value='O-000061';select.dispatchEvent(new Event('change',{bubbles:true}));
   button.click();return true;
  })()`);
  assert.equal(resumed,true,'Kingsmere could not be selected after restart');
  const resumedUi=await waitFor('Kingsmere playable roster after restart',async()=>{
   const v=await browser.evalJS(`(()=>{const x=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
    return x?.operationId==='O-000061'?{worldId:x.worldId,runId:x.runId,date:x.date,
     worldHorseCount:x.worldHorseCount,personCount:x.personCount,
     operationInventoryCount:x.operationInventoryCount,rosterCount:x.horseRows?.length||0}:null})()`);
   return {done:!!v,value:v};
  });
  assert.equal(resumedUi.worldHorseCount,300000);
  assert.ok(resumedUi.rosterCount>0);
  assert.equal(resumedUi.operationInventoryCount,resumedUi.rosterCount,
   'Kingsmere UI must show its complete linked horse inventory');
  const afterRestart=await readCareerSave();
  assert.deepEqual(afterRestart,afterImport,
   'Full-world career and official race changed after process restart');
  assert.ok(afterRestart.raceFields.some(r=>r.status==='OFFICIAL_SIM_RESULT'));
  console.log('WTW_FULL_WORLD_RACE_REOPEN_PASS '+JSON.stringify({
   worldId:snap.worldId,runId:afterRestart.runId,gameDate:afterRestart.gameDate,
   stableHorses:afterRestart.stableHorses,officialRaces:afterRestart.officialRaces,
   playableUi:resumedUi,durableReadBack:true}));
  console.log('WTW_FULL_WORLD_BROWSER_REOPEN_PASS '+JSON.stringify({snap,ui:resumedUi}));
  await stop(browser);browser=null;server.kill('SIGTERM');
  try{rmSync(profile,{recursive:true,force:true,maxRetries:20,retryDelay:100})}
  catch(error){if(!['ENOTEMPTY','EBUSY','EPERM'].includes(error?.code))throw error}
  process.exit(0);
 }
 const raceSettlement=await browser.evalJS(`(async()=>{
  const persistence=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const bridge=await import('/1999/engine/fictional-industry-game-world-bridge-1999.mjs');
  const {dispatchGameCommand}=await import('/1999/game/kernel.js');
  const {validateGameRun}=await import('/1999/game/state.js');
  const {gameRaceProgram,supported1999RaceClass,raceEligibility}=await import('/1999/game/racing-1999.js');
  const db=await persistence.open1999IndustryDatabase();
  try{
   const reopened=await persistence.reopenPersistent1999Industry(db,{
    seed:19990101,worldId:${JSON.stringify(snap.worldId)}});
   if(!reopened||reopened.status!=='READY')throw Error('Completed full world did not reopen');
   const runId='WTW-RUN-1999-'+reopened.manifest.seed+'-SIZE-'+
    (reopened.manifest.targetOpeningHorses??reopened.manifest.horseCount)+'-OP-O-000061';
   const saved=await persistence.loadPersistent1999CareerRun(db,reopened.manifest,runId);
   if(!saved?.changes?.canonicalRun)throw Error('Saved full-world career is missing');
   const career=await bridge.openPersistent1999GameCareer(db,reopened.manifest,{
    runId,operationId:saved.player.operation_id});
   const world=career.world;let state=saved.changes.canonicalRun;
   const relationshipFields={OWNED:'ownerId',MANAGED:'managementOrganizationId',
    BOARDED:'careFacilityId',TRAINED:'trainingBarnId',BRED:'breederId',
    FOALED_AT:'foalingFarmId'};
   const approvedNames=['Kingsmere Farm','Wetherby Plain','Four Corners Farm',
    'Crescent Mile Farm','Aurelian Stud','Davenport Hall Farm','Split Rail Farm'];
   const approvedOrganizationRosters=approvedNames.map(name=>{
    const org=world.entities.organizations.find(x=>x.name===name);
    if(!org)return {name,found:false};
    const byRelationship=Object.fromEntries(Object.keys(relationshipFields).map(role=>
     [role,{count:0,samples:[]}]));
    const ownedByStatus={};let ownedRunnerCount=0;
    for(const horse of world.entities.horses){
     if(horse.ownerId===org.id){
      ownedByStatus[horse.status]=(ownedByStatus[horse.status]||0)+1;
      if(['RACING','TWO_YEAR_OLD_PROSPECT'].includes(horse.status))ownedRunnerCount++;
     }
     for(const [role,field] of Object.entries(relationshipFields)){
      if(horse[field]!==org.id)continue;
      const bucket=byRelationship[role];bucket.count++;
      if(bucket.samples.length<2)bucket.samples.push({id:horse.id,name:horse.name,
       status:horse.status,foalYear:horse.foalYear,ratings:horse.ratings||null});
     }
    }
    return {found:true,id:org.id,name:org.name,portfolioTier:org.portfolioTier||null,
     location:org.location||null,resourcesRating:org.ratings?.resources??null,
     operatingRoles:org.operatingRoles||[],ownedRunnerCount,ownedByStatus,byRelationship};
   });
   const otherOperationCandidates=approvedOrganizationRosters
    .filter(x=>x.found&&x.id!==state.player.operation_id&&x.ownedRunnerCount>0)
    .sort((a,b)=>b.ownedRunnerCount-a.ownedRunnerCount||a.name.localeCompare(b.name))
    .slice(0,2);
   if(otherOperationCandidates.length<2)
    throw Error('Full saved world must expose at least two other approved operations with playable owned runners: '+
     JSON.stringify(approvedOrganizationRosters.map(x=>({name:x.name,found:x.found,
      id:x.id,ownedRunnerCount:x.ownedRunnerCount||0}))));
   const batchCache=new Map(),cachedStore=Object.create(db);
   cachedStore.get=async(storeName,key)=>{
    const cacheKey=storeName+'\\u0000'+String(key);
    if(!batchCache.has(cacheKey))batchCache.set(cacheKey,db.get(storeName,key));
    return batchCache.get(cacheKey);
   };
   const otherOperationCareerProofs=[];
   for(const org of otherOperationCandidates){
    const otherRunId='WTW-RUN-1999-'+reopened.manifest.seed+'-SIZE-'+
     (reopened.manifest.targetOpeningHorses??reopened.manifest.horseCount)+'-OP-'+org.id;
    const otherCareer=await bridge.openPersistent1999GameCareer(cachedStore,
     reopened.manifest,{runId:otherRunId,operationId:org.id});
    if(otherCareer.playableHorseCount!==org.ownedRunnerCount||
     otherCareer.run.player.operation_id!==org.id)
     throw Error('Approved operation opening runner string does not reconcile: '+org.name);
    await persistence.savePersistent1999CareerRun(db,reopened.manifest,{
     runId:otherRunId,gameDate:otherCareer.run.clock.date,
     player:otherCareer.run.player,changes:{canonicalRun:otherCareer.run},
     version:otherCareer.run.revision+1});
    const otherSaved=await persistence.loadPersistent1999CareerRun(
     db,reopened.manifest,otherRunId);
    if(!otherSaved||JSON.stringify(otherSaved.changes.canonicalRun)!==
      JSON.stringify(otherCareer.run))
     throw Error('Approved operation career did not save and reopen: '+org.name);
    otherOperationCareerProofs.push({runId:otherRunId,operationId:org.id,
     name:org.name,gameDate:otherSaved.gameDate,
     stableHorses:otherCareer.run.stable_horse_ids.length,
     registeredRunners:Object.keys(otherCareer.run.runtime.registered_horses.by_id).length,
     inventoryByRelationship:otherCareer.operationInventoryByRelationship});
   }
   // Full-world annual births, aging, attrition, broodmare/stallion turnover,
   // save/reopen, and the 32-year cohort run are verified below through the
   // persistent lifecycle engine. Keep this playable race proof bounded to
   // actual career open, one-day advance, race settlement and restart.
   const sourceHorseIds=new Set(world.entities.horses.map(h=>h.id));
   const registeredStableHorseIds=state.stable_horse_ids.filter(id=>
    Boolean(state.runtime.registered_horses.by_id[id]));
   const unresolvedStableHorseIds=state.stable_horse_ids.filter(id=>
    !state.runtime.registered_horses.by_id[id]&&!sourceHorseIds.has(id));
   if(unresolvedStableHorseIds.length)throw Error('Opening operation roster contains unresolved horse IDs: '+
    JSON.stringify(unresolvedStableHorseIds.slice(0,12)));
   if(!registeredStableHorseIds.length)throw Error('Opening operation has no registered racing horses');
   const baselineBalance=state.runtime.finances.operation_balances_minor[state.player.operation_id];
   const dayGap=(from,to)=>(Date.parse(to+'T00:00:00Z')-
    Date.parse(from+'T00:00:00Z'))/86400000;
   const raceView=book=>({id:book.id,track_id:book.trackId,date:book.date,
    age:book.ageRequirement,sex:book.sexRestriction,conditions:book.conditions,
    surface:book.surface,distance_furlongs:book.distanceFurlongs,
    field_capacity:book.fieldCapacity,max_wins:book.maxCareerWins,
    maiden:book.maidenOnly,status:'ENTRIES_OPEN',field:[]});
   const occupiedTracks=[...new Set(registeredStableHorseIds.map(id=>
    state.runtime.registered_horses.by_id[id].host_track_id))].sort();
   const careerDateBeforeRaceProbe=state.clock.date;
   const excludedRaces=new Set();let chosen=null;const scheduleEvidence=[],raceEligibilityFailures=[];
   for(let attempt=0;attempt<12&&!chosen;attempt++){
    let plan=null;
    for(let offset=7;offset<=365&&!plan;offset++){
     const date=new Date(Date.parse(state.clock.date+'T00:00:00Z')+
      offset*86400000).toISOString().slice(0,10);
     if(!date.startsWith('1999-'))break;
     for(const trackId of occupiedTracks){
      const localHorses=registeredStableHorseIds.map(id=>
       state.runtime.registered_horses.by_id[id]).filter(h=>h.host_track_id===trackId);
      const books=gameRaceProgram(state,world,trackId,date).filter(book=>
       supported1999RaceClass(book)&&book.conditions==='Maiden Special Weight'&&
       !state.runtime.races[book.id]&&!excludedRaces.has(book.id)&&
       (trackId===career.homeTrackId||dayGap(state.clock.date,date)>=4));
      if(books.length)scheduleEvidence.push({date,trackId,books:books.length,
       stableHorses:localHorses.length});
      for(const book of books){
       const legalEntryDate=new Date(Math.max(Date.parse(state.clock.date+'T00:00:00Z'),
        Date.parse(book.date+'T00:00:00Z')-4*86400000)).toISOString().slice(0,10);
       const probe={...state,clock:{...state.clock,date:legalEntryDate}};
       const possible=localHorses.filter(h=>raceEligibility(probe,h,raceView(book)).reasons
        .every(reason=>reason==='CONDITION_NOT_CLEARED'));
       if(possible.length<2)continue;
       plan={book,trackId,entryDate:legalEntryDate};break;
      }
      if(plan)break;
     }
    }
    if(!plan)throw Error('No statically eligible maiden on player stable tracks in 1999; tracks '+
     JSON.stringify(occupiedTracks)+'; scheduled candidates '+JSON.stringify(scheduleEvidence.slice(0,12)));
    // Reach the legal four-day entry window through real game commands so every
    // registered horse's care/training clock remains contiguous. A direct clock
    // jump makes the next daily care pass reject the stale training records.
    let raceEntryState=state;
    while(raceEntryState.clock.date<plan.entryDate){
     raceEntryState=dispatchGameCommand({state:raceEntryState,world,command:{
      id:'full-world-entry-window-'+raceEntryState.clock.date,
      type:'ADVANCE_DAY',actor:'player',payload:{}}}).state;
    }
    const localHorses=registeredStableHorseIds.map(id=>
     raceEntryState.runtime.registered_horses.by_id[id]).filter(h=>h.host_track_id===plan.trackId);
    const ready=localHorses.filter(h=>raceEligibility(raceEntryState,h,raceView(plan.book)).eligible)
     .sort((a,b)=>raceEntryState.runtime.horse[b.horse_id].training.readiness-
      raceEntryState.runtime.horse[a.horse_id].training.readiness||
      raceEntryState.runtime.horse[a.horse_id].training.currentRisk-
      raceEntryState.runtime.horse[b.horse_id].training.currentRisk||
      a.horse_id.localeCompare(b.horse_id));
    if(ready.length<2){
       const reasonCounts={};
       for(const horse of localHorses)
        for(const reason of raceEligibility(raceEntryState,horse,raceView(plan.book)).reasons)
         reasonCounts[reason]=(reasonCounts[reason]||0)+1;
       raceEligibilityFailures.push({date:plan.book.date,trackId:plan.trackId,
        raceId:plan.book.id,localHorses:localHorses.length,clearedStarters:ready.length,
        reasonCounts});
       excludedRaces.add(plan.book.id);continue
      }
    state=raceEntryState;
    chosen={...plan,horses:ready.slice(0,Math.min(8,plan.book.fieldCapacity))};
   }
   if(!chosen)throw Error('Could not find a race with two cleared starters after 12 scheduled candidates; latest failures '+JSON.stringify(raceEligibilityFailures.slice(-12))+'; schedule '+JSON.stringify(scheduleEvidence.slice(-12))+'; date '+state.clock.date);
   const opened=dispatchGameCommand({state,world,command:{
    id:'full-world-open-'+chosen.book.id,type:'OPEN_1999_RACE',actor:'system',
    payload:{track_id:chosen.trackId,date:chosen.book.date,race_id:chosen.book.id}}}).state;
   const horses=chosen.horses.map(h=>opened.runtime.registered_horses.by_id[h.horse_id]);
   state=opened;
   for(const horse of horses){
    state=dispatchGameCommand({state,world,command:{
     id:'full-world-enter-'+chosen.book.id+'-'+horse.horse_id,
     type:'ENTER_1999_RACE',actor:'player',
     payload:{race_id:chosen.book.id,horse_id:horse.horse_id}}}).state;
   }
   const used=new Set();
   for(const horse of chosen.horses){
    let booked=false;
    for(const jockey of Object.values(state.runtime.racing.jockeys)){
     if(used.has(jockey.id))continue;
     try{
      state=dispatchGameCommand({state,world,command:{
       id:'full-world-book-'+chosen.book.id+'-'+horse.horse_id+'-'+jockey.id,
       type:'BOOK_1999_JOCKEY',actor:'player',
       payload:{race_id:chosen.book.id,horse_id:horse.horse_id,jockey_id:jockey.id}}}).state;
      used.add(jockey.id);booked=true;break;
     }catch{}
    }
    if(!booked)throw Error('No available local jockey accepted horse '+horse.horse_id);
   }
   const openedDate=state.clock.date;
   while(state.clock.date<chosen.book.date){
    state=dispatchGameCommand({state,world,command:{
     id:'full-world-race-day-'+state.clock.date,type:'ADVANCE_DAY',
     actor:'player',payload:{}}}).state;
   }
   let race=state.runtime.races[chosen.book.id];
   if(race.status==='ENTRIES_OPEN'){
    state=dispatchGameCommand({state,world,command:{
     id:'full-world-finalize-'+chosen.book.id,type:'SETTLE_1999_RACE',
     actor:'system',payload:{race_id:chosen.book.id}}}).state;
    race=state.runtime.races[chosen.book.id];
   }
   if(race.status!=='OFFICIAL_SIM_RESULT')
    throw Error('Full-world race did not settle: '+race.status);
   if(race.results.length<2)throw Error('Official full-world race has fewer than two results');
   const awarded=race.results.reduce((sum,row)=>sum+row.earnings_minor,0);
   if(awarded!==race.purse_minor)throw Error('Race purse distribution does not balance');
   if(new Set(race.results.map(x=>x.horse_id)).size!==race.results.length)
    throw Error('Official race contains duplicate horses');
   const savedRace={runId,gameDate:state.clock.date,player:state.player,
    changes:{canonicalRun:state},version:state.revision+1};
   await persistence.savePersistent1999CareerRun(db,reopened.manifest,savedRace);
   const roundTrip=await persistence.loadPersistent1999CareerRun(db,reopened.manifest,runId);
   if(JSON.stringify(roundTrip.changes.canonicalRun)!==JSON.stringify(state))
    throw Error('Official race did not survive persistent save read-back');
   return {worldHorses:reopened.manifest.horseCount,worldId:reopened.manifest.worldId,
    operationId:state.player.operation_id,homeTrack:career.homeTrackId,raceTrack:chosen.trackId,
    operationRosterCount:state.stable_horse_ids.length,
    registeredRacingHorseCount:registeredStableHorseIds.length,
    canonicalNonrunnerRosterCount:state.stable_horse_ids.length-registeredStableHorseIds.length,
    inventoryByRelationship:career.operationInventoryByRelationship,
    inventoryByStatus:career.operationInventoryByStatus,
    approvedOrganizationRosters,otherOperationCareerProofs,
    raceId:race.id,raceName:race.name,raceDate:race.date,openedFromDate:openedDate,
    testClockJumpDays:dayGap(careerDateBeforeRaceProbe,chosen.entryDate),
    status:race.status,starterCount:race.results.length,purseMinor:race.purse_minor,
    awardedMinor:awarded,playerBalanceBefore:baselineBalance,
    playerBalanceAfter:state.runtime.finances.operation_balances_minor[state.player.operation_id],
    results:race.results.map(x=>({horseId:x.horse_id,finish:x.finish,
     earningsMinor:x.earnings_minor,ownerShareMinor:x.owner_share_minor,
     jockeyShareMinor:x.jockey_share_minor,trainerShareMinor:x.trainer_share_minor})),
    saveReadBack:true,careerDate:state.clock.date};
  }finally{db.close()}
 })()`);
 assert.equal(raceSettlement.worldHorses,300000,'Race must use the persisted 300k world');
 assert.equal(raceSettlement.status,'OFFICIAL_SIM_RESULT');
 assert.ok(raceSettlement.starterCount>=2);
 assert.equal(raceSettlement.awardedMinor,raceSettlement.purseMinor,
  'Official purse awards must reconcile to the scheduled purse');
 assert.equal(raceSettlement.saveReadBack,true);
 console.log('WTW_FULL_WORLD_RACE_SETTLEMENT_PASS '+JSON.stringify(raceSettlement));
 const careerAfterRace=await readCareerSave();
 assert.ok(careerAfterRace.officialRaces>=1,'Saved career must contain an official race');
 assert.ok(careerAfterRace.raceFields.some(r=>r.raceId===raceSettlement.raceId&&
  r.status==='OFFICIAL_SIM_RESULT'&&r.results.length===raceSettlement.starterCount),
  'Saved official race does not match the race settlement evidence');
 await stop(browser);browser=null;
 browser=await launch();
 await waitFor('Career Manager after race restart',async()=>{
  const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:v,value:v};
 });
 await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
 const kingsmereSelector=await browser.evalJS(`(()=>{
  const select=document.querySelector('[data-cc="player-operation"]');
  const button=document.querySelector('[data-cc-action="open-selected-operation"]');
  if(!select||!button)return false;
  select.value='O-000061';select.dispatchEvent(new Event('change',{bubbles:true}));
  button.click();return true;
 })()`);
 assert.equal(kingsmereSelector,true,'Kingsmere operation did not resume after restart');
 const careerAfterRaceRestart=await readCareerSave(fullWorldKingsmereRunId);
 assert.deepEqual(careerAfterRaceRestart,careerAfterRace,
  'Kingsmere official race changed or failed to reopen after Chromium restart');
 assert.ok(careerAfterRaceRestart.raceFields.some(r=>r.raceId===raceSettlement.raceId&&
  r.status==='OFFICIAL_SIM_RESULT'&&r.results.length===raceSettlement.starterCount),
  'Official result is missing after Chromium process restart');
 console.log('WTW_FULL_WORLD_RACE_REOPEN_PASS '+JSON.stringify({raceSettlement,careerAfterRaceRestart}));
 const additionalReopen=await browser.evalJS(`(async()=>{
  const persistence=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const db=await persistence.open1999IndustryDatabase();
  try{
   const reopened=await persistence.reopenPersistent1999Industry(db,{
    seed:19990101,worldId:${JSON.stringify(snap.worldId)}});
   if(!reopened||reopened.status!=='READY')throw Error('World did not reopen for multi-operation proof');
   const otherRuns=${JSON.stringify(raceSettlement.otherOperationCareerProofs.map(x=>x.runId))};
   const other=[];
   for(const runId of otherRuns){
    const saved=await persistence.loadPersistent1999CareerRun(db,reopened.manifest,runId);
    if(!saved?.changes?.canonicalRun)throw Error('Approved operation save is missing after process restart: '+runId);
    const run=saved.changes.canonicalRun;
    other.push({runId,operationId:saved.player.operation_id,gameDate:saved.gameDate,
     stableHorses:run.stable_horse_ids.length,
     registeredRunners:Object.keys(run.runtime.registered_horses.by_id).length});
   }
   return {other};

  }finally{db.close()}
 })()`);
 const expectedOtherReopen=raceSettlement.otherOperationCareerProofs.map(x=>({
  runId:x.runId,operationId:x.operationId,gameDate:x.gameDate,
  stableHorses:x.stableHorses,registeredRunners:x.registeredRunners}));
 assert.deepEqual(additionalReopen.other,expectedOtherReopen,
  'Other approved operation careers changed or failed to reopen after Chromium process restart');

 await waitFor('Kingsmere game roster after restart',async()=>{
  const view=await browser.evalJS(`window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.operationId==='O-000061'`);
  return {done:view,value:view};
 });
 const resumedCareerView=await waitFor('saved test career resume in the game UI',async()=>{
  const value=await browser.evalJS(`(()=>{const v=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
   return v?{operationId:v.operationId,date:v.date,worldHorseCount:v.worldHorseCount,
    inventoryCount:v.operationInventoryCount}:null})()`);
  return {done:value?.operationId===careerAfterRaceRestart.operationId&&
   value?.date===careerAfterRaceRestart.gameDate,value};
 },120000);
 assert.equal(resumedCareerView.worldHorseCount,300000,
  'The saved career must reopen against the same persisted full world');
 const sharedCareer=await browser.evalJS(`(async()=>{
  const bytes=await window.WTWCompactCareerManager.sharedCareerBytes();
  const json=new TextDecoder().decode(bytes);
  const imported=await window.WTWCompactCareerManager.importSharedCareerFile(
   new File([bytes],'shared-full-world-career.wtwcareer',{type:'application/json'}));
  return {json,imported};
 })()`);
 const sharedEnvelope=JSON.parse(sharedCareer.json);
 const sharedPath=resolve(process.env.WTW_SHARED_CAREER_EXPORT_PATH||
  'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer');
 mkdirSync(dirname(sharedPath),{recursive:true});
 writeFileSync(sharedPath,sharedCareer.json,'utf8');
 assert.equal(sharedCareer.imported.worldId,raceSettlement.worldId);
 assert.equal(sharedCareer.imported.gameDate,raceSettlement.raceDate);
 assert.equal(sharedEnvelope.payload?.careerRecord?.runId,
  'WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061');
 assert.equal(sharedEnvelope.payload?.careerRecord?.changes?.canonicalRun?.runtime?.races?.[
  raceSettlement.raceId]?.status,'OFFICIAL_SIM_RESULT');
 console.log('WTW_SHARED_CAREER_EXPORT_PASS '+JSON.stringify({
  path:'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
  bytes:Buffer.byteLength(sharedCareer.json),
  sha256:createHash('sha256').update(sharedCareer.json).digest('hex'),
  worldId:sharedCareer.imported.worldId,runId:sharedCareer.imported.runId,
  gameDate:sharedCareer.imported.gameDate,raceId:raceSettlement.raceId,
  importReadBack:true}));
 const careerAfterSharedImport=await readCareerSave();
 assert.deepEqual(careerAfterSharedImport,careerAfterRace,
  'Export/import of the shared career changed its official race checkpoint');
 const bundledCheckpoint=await browser.evalJS(`(async()=>{
  const response=await fetch('/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER_V10.wtwcareer.gz');
  if(!response.ok)throw Error('Bundled career checkpoint asset is unavailable');
  const bytes=await new Response(response.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  const result=await window.WTWCompactCareerManager.importSharedCareerFile(
   new File([bytes],'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
    {type:'application/json'}),{preserveExistingProgress:true});
  const view=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
  return {...result,mainUiCareer:view?{worldId:view.worldId,runId:view.runId,
   gameDate:view.date,horses:view.horseRows.length,
   worldHorseCount:view.worldHorseCount,people:view.personCount}:null};
 })()`);
 assert.equal(bundledCheckpoint.worldId,raceSettlement.worldId);
 assert.equal(bundledCheckpoint.snapshotSha256,sharedCareer.imported.snapshotSha256,
  'Bundled 300k checkpoint does not match the current executable world generator');
 assert.equal(bundledCheckpoint.gameDate,careerAfterRace.gameDate,
  'Bundled checkpoint import did not preserve local gameplay progress');
 assert.equal(bundledCheckpoint.mainUiCareer?.worldId,raceSettlement.worldId);
 assert.equal(bundledCheckpoint.mainUiCareer?.runId,careerAfterRace.runId);
 assert.equal(bundledCheckpoint.mainUiCareer?.gameDate,careerAfterRace.gameDate);
 assert.equal(bundledCheckpoint.mainUiCareer?.worldHorseCount,300000);
 assert.equal(bundledCheckpoint.mainUiCareer?.people,75705);
 const careerAfterBundledImport=await readCareerSave();
 assert.deepEqual(careerAfterBundledImport,careerAfterRace,
  'Bundled career bootstrap replaced local race progress');
 console.log('WTW_BUNDLED_CAREER_CHECKPOINT_REOPEN_PASS '+JSON.stringify(bundledCheckpoint));
 const reopened=await browser.evalJS(inspect);
 assert.deepEqual(reopened,snap,'Full world changed after Chromium process restart');
 const ui=await browser.evalJS(`(()=>{
  const root=document.querySelector('#wtwCommercialCareerModal');
  return {visible:!!root&&!root.hidden,hasFullWorld:!!root?.textContent.includes('FULL FICTIONAL 1999 INDUSTRY'),
   hasSavedWorld:!!root?.textContent.includes('WORLD STORED'),
   hasDirectory:!!root?.textContent.includes('TRACKS / FARMS / OWNERS')};
 })()`);
 assert.ok(ui.visible&&ui.hasFullWorld&&ui.hasSavedWorld&&ui.hasDirectory,
  'Stored world not accessible through the actual Career Manager');
 const profileView=await browser.evalJS(`(async()=>{
  const root=()=>document.querySelector('#wtwCommercialCareerModal');
  const click=selector=>{
   const button=document.querySelector(selector);
   if(!button)throw Error('Missing world UI control '+selector);
   button.click();
  };
  const waitForElement=async(selector)=>{
   for(let i=0;i<150;i++){
    if(document.querySelector(selector))return;
    await new Promise(ok=>setTimeout(ok,100));
   }
   throw Error('Timed out waiting for world UI control '+selector);
  };
  const waitForText=async(text)=>{
   for(let i=0;i<150;i++){
    if(root()?.textContent?.includes(text))return;
    await new Promise(ok=>setTimeout(ok,100));
   }
   throw Error('Timed out waiting for world profile text '+text);
  };
  click('[data-cc-action="industry-people"]');
  await waitForText('PERSONNEL');
  await waitForElement('[data-cc-action="inspect-listed-person"]');
  click('[data-cc-action="inspect-listed-person"]');
  await waitForText('PERSON PROFILE');
  const person=true;
  click('[data-cc-action="industry-directory"]');
  await waitForText('TRACKS / FARMS / OWNERS');
  await waitForElement('[data-cc-action="inspect-listed-entity"]');
  click('[data-cc-action="inspect-listed-entity"]');
  await waitForText('INDUSTRY PROFILE');
  return {person:true,entity:true};
 })()`);
 assert.equal(profileView.person,true,'Birthplace/person profile cannot open from staff directory');
 assert.equal(profileView.entity,true,'Track/farm/owner profile cannot open from directory');
 console.log('WTW_FULL_WORLD_PROFILE_NAVIGATION_PASS '+JSON.stringify(profileView));
 const selectedKingsmere=await browser.evalJS(`(()=>{
  const select=document.querySelector('[data-cc="player-operation"]');
  const button=document.querySelector('[data-cc-action="open-selected-operation"]');
  if(!select||!button||![...select.options].some(o=>o.value==='O-000061'))
   throw Error('Kingsmere is missing from the playable operation selector');
  select.value='O-000061';
  select.dispatchEvent(new Event('change',{bubbles:true}));
  button.click();return true;
 })()`);
 assert.equal(selectedKingsmere,true,'Kingsmere player career control failed');
 const kingsmereView=await waitFor('playable Kingsmere opening career',async()=>{
  const view=await browser.evalJS(`(()=>{
   const v=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
   return v?{operationId:v.operationId,operationName:v.operationName,
    date:v.date,worldHorseCount:v.worldHorseCount,
    inventoryCount:v.operationInventoryCount,
    relationships:v.operationInventoryByRelationship,
    horseRows:v.horseRows.map(h=>({horseId:h.horseId,sourceHorseId:h.sourceHorseId,
     name:h.name,activity:h.activity,tag:h.tag}))}:null;
  })()`);
  return {done:view?.operationId==='O-000061',value:view};
 },180000);
 assert.ok(kingsmereView.inventoryCount>=5,'Kingsmere opening operation inventory is incomplete');
 assert.equal(kingsmereView.horseRows.length,kingsmereView.inventoryCount,
  'Every owned, managed, boarded and trained Kingsmere horse must be on its roster');
 assert.ok(kingsmereView.horseRows.filter(h=>/^H-\d{4}-/.test(h.sourceHorseId||'')).length>=5,
  'Kingsmere roster must include the five approved canonical breeding residents');
 const kingRunId=fullWorldKingsmereRunId;
 const kingsmereAtStart=await readCareerSave(kingRunId);
 assert.equal(kingsmereAtStart.operationId,'O-000061');
 assert.equal(kingsmereAtStart.stableHorses,kingsmereView.inventoryCount);
 const kingsmereFounder=kingsmereView.horseRows.find(h=>/^H-\d{4}-/.test(h.sourceHorseId||''));
 const founderProfile=await browser.evalJS(`(async()=>{
  const input=document.querySelector('[data-cc="inspect-horse"]');
  const button=document.querySelector('[data-cc-action="inspect-full-horse"]');
  input.value=${JSON.stringify(kingsmereFounder?.sourceHorseId||'')};button.click();
  await new Promise(ok=>setTimeout(ok,300));
  return document.querySelector('#wtwCommercialCareerModal')?.textContent||'';
 })()`);
 assert.ok(founderProfile.includes('HORSE PROFILE')&&
  founderProfile.includes(kingsmereFounder?.sourceHorseId||''),
  'Kingsmere founding horse profile did not open from the actual saved operation');
 const expectedKingsmereNextDate=new Date(Date.parse(kingsmereView.date+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const kingsmereDay=await browser.evalJS(`(()=>{
  const button=document.querySelector('[data-cc-action="advance-test-day"]');
  if(!button)throw Error('Kingsmere game-day control missing');
  button.click();return true;
 })()`);
 assert.equal(kingsmereDay,true);
 await waitFor('Kingsmere career save after permitted game advance',async()=>{
  const saved=await readCareerSave(kingRunId);
  return {done:saved?.gameDate===expectedKingsmereNextDate,value:saved};
 },120000);
 const kingsmereSaved=await readCareerSave(kingRunId);
 assert.equal(kingsmereSaved.operationId,'O-000061');
 assert.equal(kingsmereSaved.stableHorses,kingsmereView.inventoryCount);
 await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
 const kingsmereReopenedView=await waitFor('Kingsmere career manager reopen',async()=>{
  const view=await browser.evalJS(`(()=>{
   const v=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
   return v?{operationId:v.operationId,date:v.date,
    inventoryCount:v.operationInventoryCount,horseRows:v.horseRows.length}:null;
  })()`);
  return {done:view?.operationId==='O-000061'&&view?.date===kingsmereSaved.gameDate,value:view};
 },120000);
 assert.equal(kingsmereReopenedView.inventoryCount,kingsmereView.inventoryCount);
 assert.equal(kingsmereReopenedView.horseRows,kingsmereView.inventoryCount);
 console.log('WTW_KINGSMERE_PLAYABLE_SAVE_REOPEN_PASS '+JSON.stringify({
  operationId:kingsmereView.operationId,operationName:kingsmereView.operationName,
  worldHorses:kingsmereView.worldHorseCount,inventory:kingsmereView.inventoryCount,
  relationshipCounts:kingsmereView.relationships,approvedResidentHorses:
   kingsmereView.horseRows.filter(h=>/^H-\d{4}-/.test(h.sourceHorseId||'')).length,
  gameDate:kingsmereSaved.gameDate,registeredHorses:kingsmereSaved.registeredHorses,
  savedStableHorseCount:kingsmereSaved.stableHorses,horseProfileOpened:true,
  roster:kingsmereView.horseRows}));
 const majorOperationRosters=[];
 for(const operation of [
  {id:'O-000001',name:'Wetherby Plain'},
  {id:'O-000003',name:'Four Corners Farm'},
  {id:'O-000062',name:'Crescent Mile Farm'},
  {id:'O-000066',name:'Aurelian Stud'},
  {id:'O-FOUNDING-1999-001',name:'Davenport Hall Farm'},
  {id:'O-FOUNDING-1999-004',name:'Split Rail Farm'}
 ]){
  await browser.evalJS(`(()=>{
   const select=document.querySelector('[data-cc="player-operation"]');
   const button=document.querySelector('[data-cc-action="open-selected-operation"]');
   if(!select||!button||![...select.options].some(option=>option.value===${JSON.stringify(operation.id)}))
    throw Error(${JSON.stringify(operation.name+' is missing from the playable operation selector')});
   select.value=${JSON.stringify(operation.id)};
   select.dispatchEvent(new Event('change',{bubbles:true}));button.click();return true;
  })()`);
  const view=await waitFor('playable '+operation.name+' roster',async()=>{
   const value=await browser.evalJS(`(()=>{const v=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
    return v?{operationId:v.operationId,operationName:v.operationName,date:v.date,
     worldHorseCount:v.worldHorseCount,inventoryCount:v.operationInventoryCount,
     relationships:v.operationInventoryByRelationship,
     horses:v.horseRows.map(h=>({horseId:h.horseId,sourceHorseId:h.sourceHorseId,
      name:h.name,activity:h.activity,tag:h.tag}))}:null})()`);
   return {done:value?.operationId===operation.id,value};
  },180000);
  assert.ok(view.inventoryCount>0,operation.name+' has no playable horse relationships');
  assert.equal(view.horses.length,view.inventoryCount,
   operation.name+' roster omitted relationship-linked horses');
  assert.equal(view.worldHorseCount,300000);
  const saved=await waitFor(operation.name+' saved-world career',async()=>{
   const value=await readCareerSave('WTW-RUN-1999-19990101-SIZE-300000-OP-'+operation.id);
   return {done:value?.operationId===operation.id,value};
  },120000);
  assert.equal(saved.stableHorses,view.inventoryCount);
  majorOperationRosters.push({id:operation.id,name:operation.name,
   inventory:view.inventoryCount,relationships:view.relationships,
   gameDate:saved.gameDate,roster:view.horses});
 }
 console.log('WTW_APPROVED_MAJOR_OPERATION_SAVED_ROSTERS_PASS '+
  JSON.stringify(majorOperationRosters));
 await browser.evalJS(`(()=>{
  const select=document.querySelector('[data-cc="player-operation"]');
  const button=document.querySelector('[data-cc-action="open-selected-operation"]');
  if(!select||!button)throw Error('Kingsmere selector missing before lifecycle audit');
  select.value='O-000061';select.dispatchEvent(new Event('change',{bubbles:true}));
  button.click();return true;
 })()`);
 const readSharedReferenceFingerprint=async()=>browser.evalJS("(async()=>{"+
   "const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');"+
   "const db=await api.open1999IndustryDatabase();try{"+
   "const world=await api.reopenPersistent1999Industry(db,{seed:19990101,"+
   "worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});"+
   "const runId='WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061';"+
   "const record=await api.loadPersistent1999CareerRun(db,world.manifest,runId);"+
   "if(!record)throw Error('Shared reference career missing during lifecycle audit');"+
   "const digest=await crypto.subtle.digest('SHA-256',"+
   "new TextEncoder().encode(JSON.stringify(record)));"+
   "return {runId:record.runId,gameDate:record.gameDate,version:record.version,"+
   "sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};"+
   "}finally{db.close()}})()");
 const sharedReferenceBeforeLifecycle=await readSharedReferenceFingerprint();
 assert.equal(sharedReferenceBeforeLifecycle.runId,
  'WTW-RUN-1999-19990101-SIZE-300000-OP-O-000061');
 assert.equal(sharedReferenceBeforeLifecycle.gameDate,kingsmereSaved.gameDate,
  'Lifecycle audit must start from the preserved shared career checkpoint');
 const lifecycleProbe=`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const breeding=await import('/1999/engine/fictional-industry-breeding-book-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});
   if(world?.status!=='READY'||world.manifest.horseCount!==300000)
    throw Error('Lifecycle probe did not load the exact 300,000-horse opening census');
   const manifest=world.manifest,runId='WTW-FULL-WORLD-LIFECYCLE-300K-KINGSMERE';
   const player={role:'owner',organizationId:'O-000061'};
   const save=async(gameDate,version)=>api.savePersistent1999CareerRun(store,manifest,
    {runId,gameDate,player,changes:{},version});
   const opening=await save('1999-01-01',1);
   if(opening.lifecycle.openingHorseCount!==300000)
    throw Error('Lifecycle changed the exact opening census');
   const sampleCandidates=[];
   for(let time=Date.UTC(1999,1,1);time<Date.UTC(1999,7,1);time+=86400000){
    const date=new Date(time).toISOString().slice(0,10);
    const forecasts=await api.readPersistent1999FoalForecasts(store,manifest,runId,1999,date);
    sampleCandidates.push(...forecasts.filter(f=>breeding.resolve1999FoalBirth({
     seed:manifest.seed,forecast:f})).slice(0,32-sampleCandidates.length));
    if(sampleCandidates.length>=32)break;
   }
   const sample=sampleCandidates[0];
   if(!sample)throw Error('No modeled live foal found in the 300,000-horse first crop');
   const before=new Date(Date.parse(sample.birthDate+'T00:00:00Z')-86400000)
    .toISOString().slice(0,10);
   await save(before,2);
   if(await api.readPersistent1999LifecycleHorse(store,manifest,runId,sample.foalId))
    throw Error('A forecast foal materialized before its birth date');
   await save(sample.birthDate,3);
   const born=await api.readPersistent1999LifecycleHorse(store,manifest,runId,sample.foalId);
   if(!born||born.status!=='FOAL'||born.sireId!==sample.sireId||
    born.damId!==sample.damId||born.ownerId!==sample.ownerId||
    born.dateOfBirth!==sample.birthDate||born.birthplace?.farmId!==sample.foalingFarmId)
    throw Error('Full-world live foal lost date, parentage, ownership, or farm');
   if(await api.findPersistent1999Horse(store,manifest,sample.foalId))
    throw Error('Seasonal foal was inserted into the immutable opening census');
   await save('1999-12-31',4);
   const year2000=await save('2000-01-01',5);
   const events2000=await api.readPersistent1999LifecycleEvents(store,manifest,
    runId,'2000-01-01');
   const turnover2000=events2000.find(e=>e.type==='BROODMARE_TURNOVER');
   const stallionTurnover2000=events2000.find(e=>e.type==='STALLION_TURNOVER');
   const attrition2000=events2000.filter(e=>e.type==='YOUNGSTOCK_ATTRITION');
   if(!turnover2000?.retired||!turnover2000?.graduated||
    turnover2000.closingBroodmares!==turnover2000.openingBroodmares-
     turnover2000.retired+turnover2000.graduated)
    throw Error('Full-world 2000 mare turnover was not committed per horse');
   if(!stallionTurnover2000?.retired||
    stallionTurnover2000.closingStallions!==stallionTurnover2000.openingStallions-
     stallionTurnover2000.retired+stallionTurnover2000.graduated)
    throw Error('Full-world 2000 stallion turnover was not committed per horse');
   const stallionPool2000=await store.get('industryLifecycle',manifest.worldId+':'+
    manifest.seed+':'+runId+':stallion-pool:2000');
   if(stallionPool2000.length!==stallionTurnover2000.closingStallions||
    new Set(stallionPool2000).size!==stallionPool2000.length)
    throw Error('Full-world stallion pool has missing or duplicate identities');
   const season2000=await store.get('industryLifecycle',manifest.worldId+':'+
    manifest.seed+':'+runId+':season:2000');
   if(!season2000?.marketConditions?.marketIndex||!season2000.plannedFoals)
    throw Error('Full-world foal plan did not persist its market conditions');
   if(attrition2000.length!==2||attrition2000.some(e=>e.deaths<=0||
    e.closingCohortSize>=e.openingCohortSize))
    throw Error('Full-world first-season young-horse attrition did not move cohorts');
   const deadId=attrition2000.find(e=>e.deaths>0).deathHorseIds[0];
   const deadHorse=await api.readPersistent1999LifecycleHorse(store,manifest,runId,deadId);
   const deadDam=await api.readPersistent1999LifecycleHorse(store,manifest,runId,deadHorse?.damId);
   const deadSire=await api.findPersistent1999Horse(store,manifest,deadHorse?.sireId);
   const directory=await api.readPersistent1999Directory(store,manifest);
   if(deadHorse?.status!=='DECEASED'||deadHorse.deathDate!=='2000-01-01'||
    !deadDam||!deadSire||deadSire.id===deadDam.id||!deadHorse.ownerId||
    deadHorse.ownerId!==deadDam.ownerId||!directory.some(e=>e.id===deadHorse.ownerId)||
    !directory.some(e=>e.id===deadHorse.foalingFarmId)||
    deadHorse.birthplace?.farmId!==deadHorse.foalingFarmId)
    throw Error('Full-world attrition lost the deceased horse record or pedigree');
   const retiredId=turnover2000.retiredHorseIds[0],graduateId=turnover2000.graduatedHorseIds[0];
   const retired=await api.readPersistent1999LifecycleHorse(store,manifest,runId,retiredId);
   const graduate=await api.readPersistent1999LifecycleHorse(store,manifest,runId,graduateId);
   if(retired?.status!=='RETIRED_BROODMARE'||retired.breedingStatus!=='RETIRED'||
    graduate?.status!=='BROODMARE'||graduate.sex!=='MARE'||graduate.graduatedYear!==2000)
    throw Error('Full-world retirement or filly graduation did not persist per horse');
   const retiredStallionId=stallionTurnover2000.retiredHorseIds[0];
   const retiredStallion=await api.readPersistent1999LifecycleHorse(store,manifest,
    runId,retiredStallionId);
   if(retiredStallion?.status!=='RETIRED_STALLION'||
    retiredStallion.breedingStatus!=='RETIRED'||retiredStallion.retirementYear!==2000)
    throw Error('Full-world stallion retirement did not persist per horse');
   const year2001=await save('2001-01-01',6);
   const events2001=await api.readPersistent1999LifecycleEvents(store,manifest,
    runId,'2001-01-01');
   const turnover2001=events2001.find(e=>e.type==='BROODMARE_TURNOVER');
   const stallionTurnover2001=events2001.find(e=>e.type==='STALLION_TURNOVER');
   const attrition2001=events2001.filter(e=>e.type==='YOUNGSTOCK_ATTRITION');
   if(!turnover2001?.retired||!turnover2001?.graduated||
    !stallionTurnover2001?.retired||
    stallionTurnover2001.closingStallions!==stallionTurnover2001.openingStallions-
     stallionTurnover2001.retired+stallionTurnover2001.graduated||
    year2001.lifecycle.birthsByYear[2000]===year2000.lifecycle.birthsByYear[1999])
    throw Error('Second full-world season did not vary its crop and turnover');
   if(attrition2001.length!==2||attrition2001.some(e=>e.deaths<=0))
    throw Error('Full-world second-season young-horse attrition was not committed');
   for(const stage of ['FOAL_TO_YEARLING','YEARLING_TO_TWO_YEAR_OLD'])
    if(attrition2000.find(e=>e.stage===stage).deaths===
     attrition2001.find(e=>e.stage===stage).deaths)
     throw Error('Full-world annual attrition counts repeated instead of varying');
   const deceasedIds=new Set([...attrition2000,...attrition2001].flatMap(e=>e.deathHorseIds));
   const survivor=sampleCandidates.find(f=>!deceasedIds.has(f.foalId));
   if(!survivor)throw Error('Full-world crop did not retain a testable two-year-old survivor');
   const aged=await api.readPersistent1999LifecycleHorse(store,manifest,runId,survivor.foalId);
   if(aged?.status!=='TWO_YEAR_OLD_PROSPECT'||aged.cohort!=='twoYearOldProspects'||
    aged.age!==2||aged.dateOfBirth!==survivor.birthDate)
    throw Error('Full-world seasonal foal did not age into the correct 2YO cohort');
   const saved=await api.loadPersistent1999CareerRun(store,manifest,runId);
   if(saved.lifecycle.population!==300000+saved.lifecycle.birthsByYear[1999]+
    saved.lifecycle.birthsByYear[2000]-saved.lifecycle.horseDeaths)
    throw Error('Full-world population checkpoint does not equal opening horses plus births less deaths');
   return {runId,operationId:saved.player.organizationId,openingHorseCount:saved.lifecycle.openingHorseCount,
    population2000:year2000.lifecycle.population,population2001:saved.lifecycle.population,
    births1999:saved.lifecycle.birthsByYear[1999],births2000:saved.lifecycle.birthsByYear[2000],
    deaths2000:year2000.lifecycle.deathsByYear[2000],
    deaths2001:saved.lifecycle.deathsByYear[2001],
    foalDeaths2000:attrition2000.find(e=>e.stage==='FOAL_TO_YEARLING').deaths,
    yearlingDeaths2000:attrition2000.find(e=>e.stage==='YEARLING_TO_TWO_YEAR_OLD').deaths,
    foalDeaths2001:attrition2001.find(e=>e.stage==='FOAL_TO_YEARLING').deaths,
    yearlingDeaths2001:attrition2001.find(e=>e.stage==='YEARLING_TO_TWO_YEAR_OLD').deaths,
    retired2000:turnover2000.retired,graduated2000:turnover2000.graduated,
    retired2001:turnover2001.retired,graduated2001:turnover2001.graduated,
    broodmares1999:manifest.plan.counts.broodmares,
    broodmares2000:turnover2000.closingBroodmares,
    broodmares2001:turnover2001.closingBroodmares,
    stallions1999:manifest.plan.counts.stallions,
    stallions2000:stallionTurnover2000.closingStallions,
    stallions2001:stallionTurnover2001.closingStallions,
    stallionsRetired2000:stallionTurnover2000.retired,
    stallionsRetired2001:stallionTurnover2001.retired,
    plannedFoals1999:(await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':season:1999')).plannedFoals,
    plannedFoals2000:season2000.plannedFoals,
    marketIndex1999:(await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':season:1999')).marketConditions.marketIndex,
    marketIndex2000:season2000.marketConditions.marketIndex,
    foalId:sample.foalId,birthDate:sample.birthDate,agedFoalId:survivor.foalId,
    deceasedHorseId:deadId,retiredId,graduateId};
  }finally{store.close()}
 })()`;
 const lifecycle=await browser.evalJS(lifecycleProbe);
 assert.equal(lifecycle.openingHorseCount,300000);
 assert.ok(lifecycle.births1999>0&&lifecycle.births2000>0);
 assert.ok(lifecycle.population2000>300000&&lifecycle.population2001>lifecycle.population2000);
 assert.ok(lifecycle.broodmares2000>0&&lifecycle.stallions2000>0&&
  lifecycle.stallionsRetired2000>0&&lifecycle.marketIndex2000>0);
 console.log('WTW_FULL_WORLD_LIFECYCLE_PASS '+JSON.stringify(lifecycle));
 const maximumWorld=await browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});
   const directory=await api.readPersistent1999Directory(store,world.manifest);
   const clean=entity=>Object.fromEntries(Object.entries(entity).filter(([key])=>
    !['ratings','relationships','ratingsProvenance'].includes(key)));
   const tracks=directory.filter(entity=>entity.id.startsWith('T-')).map(clean);
   const farms=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-FARM-')).map(clean);
   const owners=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-OWNER-')).map(clean);
   const manifest=await api.createPersistent1999Industry({store,seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H325000',targetOpeningHorses:325000,
    farms,tracks,owners,batchSize:2000});
   return {status:manifest.status,horseCount:manifest.horseCount,
    targetOpeningHorses:manifest.targetOpeningHorses,worldId:manifest.worldId};
  }finally{store.close()}
 })()`);
 assert.deepEqual(maximumWorld,{status:'COMPLETE',horseCount:325000,
  targetOpeningHorses:325000,worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H325000'});
 console.log('WTW_MAX_WORLD_OPENING_PASS '+JSON.stringify(maximumWorld));
 const smallWorld=await browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const source=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});
   const directory=await api.readPersistent1999Directory(store,source.manifest);
   const clean=entity=>Object.fromEntries(Object.entries(entity).filter(([key])=>
    !['ratings','relationships','ratingsProvenance'].includes(key)));
   const tracks=directory.filter(entity=>entity.id.startsWith('T-')).map(clean);
   const farms=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-FARM-')).map(clean);
   const owners=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-OWNER-')).map(clean);
   const manifest=await api.createPersistent1999Industry({store,seed:19990111,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H10000',targetOpeningHorses:10000,
    farms,tracks,owners,batchSize:1000});
   return {status:manifest.status,horseCount:manifest.horseCount,
    targetOpeningHorses:manifest.targetOpeningHorses,seed:manifest.seed,
    worldId:manifest.worldId};
  }finally{store.close()}
 })()`);
 assert.deepEqual(smallWorld,{status:'COMPLETE',horseCount:10000,
  targetOpeningHorses:10000,seed:19990111,
  worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H10000'});
 console.log('WTW_SMALL_WORLD_OPENING_PASS '+JSON.stringify(smallWorld));
 const maximumProbe=lifecycleProbe
  .replaceAll('WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000','WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H325000')
  .replaceAll('WTW-FULL-WORLD-LIFECYCLE-300K','WTW-FULL-WORLD-LIFECYCLE-325K')
  .replaceAll('300000','325000');
 const maximumLifecycle=await browser.evalJS(maximumProbe);
 assert.equal(maximumLifecycle.openingHorseCount,325000);
 assert.ok(maximumLifecycle.births1999>0&&maximumLifecycle.births2000>0);
 assert.ok(maximumLifecycle.population2000>325000&&
  maximumLifecycle.population2001>maximumLifecycle.population2000);
 assert.ok(maximumLifecycle.broodmares2000>0&&maximumLifecycle.stallions2000>0&&
  maximumLifecycle.stallionsRetired2000>0&&maximumLifecycle.marketIndex2000>0);
 console.log('WTW_MAX_WORLD_LIFECYCLE_PASS '+JSON.stringify(maximumLifecycle));
 const decades=await browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  let store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990111,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H10000'});
   if(world?.status!=='READY'||world.manifest.horseCount!==10000)
    throw Error('Decade run did not open the exact 10,000-horse world');
   const manifest=world.manifest,runId='WTW-INDUSTRY-DECADES-10000';
   const directory=await api.readPersistent1999Directory(store,manifest);
   const careerOwner=directory.find(entity=>entity.operatingRoles?.includes('LEGAL_OWNER'))||
    directory.find(entity=>entity.portfolioTier);
   if(!careerOwner)throw Error('10,000-horse world has no legal owner directory record');
   const player={role:'owner',organizationId:careerOwner.id};
   const save=(gameDate,version)=>api.savePersistent1999CareerRun(store,manifest,
    {runId,gameDate,player,changes:{},version});
   const opening=await save('1999-01-01',1);
   if(opening.lifecycle.openingHorseCount!==10000)
    throw Error('Small-world lifecycle changed the opening census');
   const annual=[];
   const deceasedIds=new Set(),retiredIds=new Set(),graduatedIds=new Set(),
    stallionRetiredIds=new Set(),stallionGraduatedIds=new Set();
   const marketIndices=new Set(),plannedCrops=new Set();
   const directoryIds=new Set(directory.map(entity=>entity.id));
   if(!directoryIds.has(player.organizationId))throw Error('Lifecycle career owner is not a real directory record');
   for(let year=2000;year<=2031;year++){
    const date=year+'-01-01',version=year-1998;
    const saved=await save(date,version),events=await api.readPersistent1999LifecycleEvents(
     store,manifest,runId,date);
    const turnover=events.find(event=>event.type==='BROODMARE_TURNOVER');
    const stallionTurnover=events.find(event=>event.type==='STALLION_TURNOVER');
    const attrition=events.filter(event=>event.type==='YOUNGSTOCK_ATTRITION');
    if(!turnover||!stallionTurnover||attrition.length!==2)
     throw Error('Missing annual transition records in '+year);
    if(turnover.closingBroodmares!==turnover.openingBroodmares-turnover.retired+
     turnover.graduated||turnover.retiredHorseIds.length!==turnover.retired||
     turnover.graduatedHorseIds.length!==turnover.graduated)
     throw Error('Broodmare pool arithmetic failed in '+year);
    if(stallionTurnover.closingStallions!==stallionTurnover.openingStallions-
     stallionTurnover.retired+stallionTurnover.graduated||
     stallionTurnover.retiredHorseIds.length!==stallionTurnover.retired||
     stallionTurnover.graduatedHorseIds.length!==stallionTurnover.graduated)
     throw Error('Stallion pool arithmetic failed in '+year);
    for(const id of turnover.retiredHorseIds){
     if(retiredIds.has(id))throw Error('Broodmare retired twice: '+id);
     retiredIds.add(id);
    }
    for(const id of turnover.graduatedHorseIds){
     if(graduatedIds.has(id))throw Error('Filly graduated twice: '+id);
     graduatedIds.add(id);
    }
    for(const id of stallionTurnover.retiredHorseIds){
     if(stallionRetiredIds.has(id))throw Error('Stallion retired twice: '+id);
     stallionRetiredIds.add(id);
    }
    for(const id of stallionTurnover.graduatedHorseIds){
     if(stallionGraduatedIds.has(id))throw Error('Colt graduated twice: '+id);
     stallionGraduatedIds.add(id);
    }
    const marketSeason=await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':season:'+year);
    if(!marketSeason?.marketConditions?.marketIndex||!marketSeason.plannedFoals)
     throw Error('Missing market-adjusted foal totals in '+year);
    marketIndices.add(marketSeason.marketConditions.marketIndex);
    plannedCrops.add(marketSeason.plannedFoals);
    let annualDeaths=0;
    for(const event of attrition){
     if(event.openingCohortSize!==event.closingCohortSize+event.deaths||
      event.deathHorseIds.length!==event.deaths)
      throw Error('Young-horse cohort arithmetic failed in '+year);
     annualDeaths+=event.deaths;
     for(const id of event.deathHorseIds){
      if(deceasedIds.has(id))throw Error('Horse died more than once: '+id);
      deceasedIds.add(id);
     }
    }
    const births=saved.lifecycle.birthsByYear[year-1]||0;
    const totalBirths=Object.values(saved.lifecycle.birthsByYear)
     .reduce((sum,count)=>sum+count,0);
    if(saved.lifecycle.population!==10000+totalBirths-saved.lifecycle.horseDeaths||
     saved.lifecycle.deathsByYear[year]!==annualDeaths)
     throw Error('Population checkpoint did not reconcile in '+year);
    const pool=await store.get('industryLifecycle',manifest.worldId+':'+manifest.seed+
     ':'+runId+':breeding-pool:'+year);
    if(pool.length!==turnover.closingBroodmares||new Set(pool).size!==pool.length)
     throw Error('Active breeding pool has missing or duplicate horse IDs in '+year);
    const stallionPool=await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':stallion-pool:'+year);
    if(stallionPool.length!==stallionTurnover.closingStallions||
     new Set(stallionPool).size!==stallionPool.length)
     throw Error('Active stallion pool has missing or duplicate horse IDs in '+year);
    if(stallionTurnover.retiredHorseIds.length){
     const horse=await api.readPersistent1999LifecycleHorse(store,manifest,runId,
      stallionTurnover.retiredHorseIds[0]);
     if(horse?.status!=='RETIRED_STALLION'||horse.breedingStatus!=='RETIRED')
      throw Error('Stallion retirement was not persisted in '+year);
    }
    if(stallionTurnover.graduatedHorseIds.length){
     const horse=await api.readPersistent1999LifecycleHorse(store,manifest,runId,
      stallionTurnover.graduatedHorseIds[0]);
     if(horse?.status!=='STALLION'||horse.sex!=='HORSE'||horse.graduatedYear!==year)
      throw Error('Eligible colt graduation was not persisted in '+year);
    }
    if(annualDeaths){
     const id=attrition.find(event=>event.deathHorseIds.length)?.deathHorseIds[0];
     const horse=await api.readPersistent1999LifecycleHorse(store,manifest,runId,id);
     const dam=horse?.damId?await api.readPersistent1999LifecycleHorse(store,
      manifest,runId,horse.damId):null;
     const sire=horse?.sireId?
      (await api.readPersistent1999LifecycleHorse(store,manifest,runId,horse.sireId)||
       await api.findPersistent1999Horse(store,manifest,horse.sireId)):null;
     if(horse?.status!=='DECEASED'||horse.deathDate!==date||!dam||!sire||
      horse.damId===horse.sireId||!directoryIds.has(horse.ownerId)||
      !directoryIds.has(horse.foalingFarmId)||horse.birthplace?.farmId!==horse.foalingFarmId)
      throw Error('Deceased horse lost its record, pedigree, owner, or foaling farm in '+year);
    }
    const completedYear=year-1;
    const completedSeason=await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':season:'+completedYear);
    const completedMares=await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':breeding-pool:'+completedYear);
    const completedStallions=await store.get('industryLifecycle',manifest.worldId+':'+
     manifest.seed+':'+runId+':stallion-pool:'+completedYear);
    annual.push({year:completedYear,broodmares:completedMares.length,
     stallions:completedStallions.length,plannedFoals:completedSeason.plannedFoals,
     marketIndex:completedSeason.marketConditions.marketIndex,births,population:
      saved.lifecycle.population,deathsAtRollover:annualDeaths,
     mareRetiredNextYear:turnover.retired,mareGraduatedNextYear:turnover.graduated,
     stallionsRetiredNextYear:stallionTurnover.retired,
     stallionsGraduatedNextYear:stallionTurnover.graduated});
    if(year%10===0){
     const repeated=await save(date,version);
     if(JSON.stringify(repeated.lifecycle)!==JSON.stringify(saved.lifecycle))
      throw Error('Repeated rollover duplicated decade transitions in '+year);
     store.close();store=await api.open1999IndustryDatabase();
     const reopened=await api.reopenPersistent1999Industry(store,{seed:19990111,
      worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H10000'});
     const roundTrip=await api.loadPersistent1999CareerRun(store,reopened.manifest,runId);
     if(reopened.status!=='READY'||roundTrip?.gameDate!==date||
      roundTrip.lifecycle.population!==saved.lifecycle.population)
      throw Error('Career save did not reopen at '+year);
    }
   }
   for(let birthYear=1999;birthYear<=2029;birthYear++){
    const survivors=await store.get('industryLifecycle',manifest.worldId+':'+manifest.seed+
     ':'+runId+':foal-cohort:'+birthYear)||[];
    const first=(await api.readPersistent1999LifecycleEvents(store,manifest,runId,
     (birthYear+1)+'-01-01')).find(event=>event.type==='YOUNGSTOCK_ATTRITION'&&
      event.stage==='FOAL_TO_YEARLING')?.deathHorseIds||[];
    const second=(await api.readPersistent1999LifecycleEvents(store,manifest,runId,
     (birthYear+2)+'-01-01')).find(event=>event.type==='YOUNGSTOCK_ATTRITION'&&
      event.stage==='YEARLING_TO_TWO_YEAR_OLD')?.deathHorseIds||[];
    const cohortIds=new Set([...survivors,...first,...second]);
    if(cohortIds.size!==survivors.length+first.length+second.length||
     cohortIds.size!==(annual.find(row=>row.year===birthYear)?.births||0))
     throw Error('Cohort '+birthYear+' has duplicate or orphan horse identities');
   }
   const oldCohort=await store.get('industryLifecycle',manifest.worldId+':'+manifest.seed+
    ':'+runId+':foal-cohort:2000');
   const longLivedHorseId=oldCohort[0];
   const horse=await api.readPersistent1999LifecycleHorse(store,manifest,runId,longLivedHorseId);
   if(horse?.age!==31||!horse.sireId||!horse.damId||!horse.ownerId||
    !horse.foalingFarmId||!directoryIds.has(horse.ownerId)||
    !directoryIds.has(horse.foalingFarmId))
    throw Error('Thirty-one-year-old horse lost age, pedigree, ownership, or foaling place');
   const final=await api.loadPersistent1999CareerRun(store,manifest,runId);
   if(new Set(annual.map(row=>row.births)).size<10||marketIndices.size<10||
    plannedCrops.size<10)
    throw Error('Annual live foal totals did not vary over the decades');
   if(!deceasedIds.size||!retiredIds.size||!graduatedIds.size||
    !stallionRetiredIds.size||!stallionGraduatedIds.size)
    throw Error('Decade run did not exercise mortality and both breeding-pool transitions');
   return {seed:manifest.seed,openingHorseCount:manifest.horseCount,
    runId,annual,finalPopulation:final.lifecycle.population,
    totalBirths:Object.values(final.lifecycle.birthsByYear).reduce((sum,count)=>sum+count,0),
    totalDeaths:final.lifecycle.horseDeaths,totalRetirements:retiredIds.size,
    totalGraduates:graduatedIds.size,totalStallionRetirements:stallionRetiredIds.size,
    totalStallionGraduates:stallionGraduatedIds.size,uniqueDeathIds:deceasedIds.size,
    longLivedHorseId,lastDate:final.gameDate};
  }finally{store.close()}
 })()`);
 assert.equal(decades.seed,19990111);
 assert.equal(decades.openingHorseCount,10000);
 assert.equal(decades.lastDate,'2031-01-01');
 assert.ok(decades.totalBirths>0&&decades.totalDeaths>0&&
  decades.totalRetirements>0&&decades.totalGraduates>0);
 console.log('WTW_INDUSTRY_THREE_DECADES_PASS '+JSON.stringify(decades));
 await stop(browser);browser=null;
 browser=await launch();
 await waitFor('Career Manager after lifecycle process restart',async()=>{
  const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:v,value:v};
 });
 const reopenedLifecycleProbe=`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000'});
   const runId='WTW-FULL-WORLD-LIFECYCLE-300K-KINGSMERE';
   const saved=await api.loadPersistent1999CareerRun(store,world.manifest,runId);
   const foal=await api.readPersistent1999LifecycleHorse(store,world.manifest,runId,
    '${lifecycle.foalId}');
   const retired=await api.readPersistent1999LifecycleHorse(store,world.manifest,runId,
    '${lifecycle.retiredId}');
   const graduate=await api.readPersistent1999LifecycleHorse(store,world.manifest,runId,
    '${lifecycle.graduateId}');
   return {lastDate:saved?.gameDate,lifecycle:saved?.lifecycle,
    foal:foal&&{id:foal.id,status:foal.status,age:foal.age,cohort:foal.cohort,
     dateOfBirth:foal.dateOfBirth,sireId:foal.sireId,damId:foal.damId,ownerId:foal.ownerId,
     foalingFarmId:foal.foalingFarmId},
    retired:retired&&{id:retired.id,status:retired.status,
     breedingStatus:retired.breedingStatus},
    graduate:graduate&&{id:graduate.id,status:graduate.status,sex:graduate.sex,
     graduatedYear:graduate.graduatedYear}};
  }finally{store.close()}
 })()`;
 const reopenedLifecycle=await browser.evalJS(reopenedLifecycleProbe);
 assert.equal(reopenedLifecycle.lastDate,'2001-01-01');
 assert.equal(reopenedLifecycle.lifecycle.openingHorseCount,300000);
 assert.equal(reopenedLifecycle.foal.status,'TWO_YEAR_OLD_PROSPECT');
 assert.equal(reopenedLifecycle.retired.status,'RETIRED_BROODMARE');
 assert.equal(reopenedLifecycle.graduate.status,'BROODMARE');
 console.log('WTW_FULL_WORLD_LIFECYCLE_REOPEN_PASS '+JSON.stringify(reopenedLifecycle));
 const maxReopenedProbe=reopenedLifecycleProbe
  .replaceAll('WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H300000','WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H325000')
  .replaceAll('WTW-FULL-WORLD-LIFECYCLE-300K','WTW-FULL-WORLD-LIFECYCLE-325K')
  .replaceAll(lifecycle.foalId,maximumLifecycle.foalId)
  .replaceAll(lifecycle.retiredId,maximumLifecycle.retiredId)
  .replaceAll(lifecycle.graduateId,maximumLifecycle.graduateId);
 const maxReopenedLifecycle=await browser.evalJS(maxReopenedProbe);
 assert.equal(maxReopenedLifecycle.lastDate,'2001-01-01');
 assert.equal(maxReopenedLifecycle.lifecycle.openingHorseCount,325000);
 assert.equal(maxReopenedLifecycle.foal.status,'TWO_YEAR_OLD_PROSPECT');
 assert.equal(maxReopenedLifecycle.retired.status,'RETIRED_BROODMARE');
 assert.equal(maxReopenedLifecycle.graduate.status,'BROODMARE');
 console.log('WTW_MAX_WORLD_LIFECYCLE_REOPEN_PASS '+JSON.stringify(maxReopenedLifecycle));
 const decadesReopen=await browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990111,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H10000'});
   const runId='WTW-INDUSTRY-DECADES-10000';
   const saved=await api.loadPersistent1999CareerRun(store,world.manifest,runId);
   const horse=await api.readPersistent1999LifecycleHorse(store,world.manifest,runId,
    '${decades.longLivedHorseId}');
   return {lastDate:saved?.gameDate,openingHorseCount:saved?.lifecycle.openingHorseCount,
    population:saved?.lifecycle.population,seasonYear:saved?.lifecycle.seasonYear,
    horse:horse&&{id:horse.id,age:horse.age,status:horse.status,cohort:horse.cohort,
     sireId:horse.sireId,damId:horse.damId,ownerId:horse.ownerId,
     foalingFarmId:horse.foalingFarmId}};
  }finally{store.close()}
 })()`);
 assert.equal(decadesReopen.lastDate,'2031-01-01');
 assert.equal(decadesReopen.openingHorseCount,10000);
 assert.equal(decadesReopen.seasonYear,2031);
 assert.equal(decadesReopen.population,decades.finalPopulation);
 assert.equal(decadesReopen.horse.age,31);
 assert.ok(decadesReopen.horse.sireId&&decadesReopen.horse.damId&&
  decadesReopen.horse.ownerId&&decadesReopen.horse.foalingFarmId);
 console.log('WTW_INDUSTRY_DECADES_REOPEN_PASS '+JSON.stringify(decadesReopen));
 const sharedReferenceAfterLifecycle=await readSharedReferenceFingerprint();
 assert.deepEqual(sharedReferenceAfterLifecycle,sharedReferenceBeforeLifecycle,
  'Lifecycle tests changed the shared reference career during copy-based testing');
 console.log('WTW_SHARED_REFERENCE_CAREER_PRESERVED_PASS '+
  JSON.stringify(sharedReferenceAfterLifecycle));
 console.log('WTW_FULL_WORLD_BROWSER_REOPEN_PASS '+JSON.stringify({snap,ui}));
}finally{
 await stop(browser);
 server.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true,maxRetries:30,retryDelay:100})}
 catch(error){console.warn('WTW_BROWSER_PROFILE_CLEANUP_WARNING '+JSON.stringify({code:error?.code,message:error?.message}))}
}
