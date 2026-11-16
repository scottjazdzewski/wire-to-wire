#!/usr/bin/env node
/** Actual full-population browser open/reopen acceptance.
 * Runs the approved /next/ UI and its real IndexedDB (no mocked storage).
 * Does NOT claim the separate founding gameplay kernel uses these records.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
const profile=mkdtempSync(join(tmpdir(),'wtw-full-industry-'));
const port=9443,sitePort=8891;
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
   seed:19990101,worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});
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
 const readCareerSave=async()=>browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const db=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(db,{
    seed:19990101,worldId:${JSON.stringify(snap.worldId)}});
   const manifest=world.manifest;
   const runId='WTW-RUN-1999-'+manifest.seed+'-SIZE-'+
    (manifest.targetOpeningHorses??manifest.horseCount);
   const record=await api.loadPersistent1999CareerRun(db,manifest,runId);
   if(!record)return null;
   const json=JSON.stringify(record),run=record.changes?.canonicalRun;
   const races=Object.values(run?.runtime?.races||{});
   return {gameDate:record.gameDate,
    utf8JsonBytes:new TextEncoder().encode(json).length,
    stableHorses:run?.stable_horse_ids?.length??0,
    registeredHorses:Object.keys(run?.runtime?.registered_horses?.by_id||{}).length,
    races:races.length,
    officialRaces:races.filter(r=>r.status==='OFFICIAL_SIM_RESULT').length,
    raceFields:races.map(r=>({status:r.status,field:r.field?.length??0,date:r.date}))};
  }finally{db.close()}
 })()`);
 await waitFor('full-world career start control',async()=>{
  const ready=await browser.evalJS(`!!document.querySelector('[data-cc-action="start-test-career"]')`);
  return {done:ready,value:ready};
 });
 const storageBeforeCareer=await browser.evalJS('navigator.storage.estimate()');
 const startClicked=await browser.evalJS(`(()=>{
  const button=document.querySelector('[data-cc-action="start-test-career"]');
  if(!button)return false;button.click();return true;
 })()`);
 assert.equal(startClicked,true,'Full-world test career control missing');
 await waitFor('full-world career save',async()=>{
  const saved=await readCareerSave();return {done:!!saved,value:saved};
 },300000);
 const careerAtStart=await readCareerSave();
 assert.ok(careerAtStart.stableHorses>=2,'Full-world career save lacks playable horses');
 const storageAfterStart=await browser.evalJS('navigator.storage.estimate()');
 const raceClicked=await browser.evalJS(`(()=>{
  const button=document.querySelector('[data-cc-action="open-next-test-race"]');
  if(!button)return false;button.click();return true;
 })()`);
 assert.equal(raceClicked,true,'Full-world race entry control missing');
 await waitFor('full-world race entry save',async()=>{
  const saved=await readCareerSave();
  return {done:!!saved&&saved.races.length>0,value:saved};
 },180000);
 const careerWithEntries=await readCareerSave();
 assert.ok(careerWithEntries.raceFields.some(r=>r.field>=2),
  'Full-world player horses were not saved in a real race field');
 let careerAfterRace=careerWithEntries;
 for(let day=0;day<35&&careerAfterRace.officialRaces<1;day++){
  const previousDate=careerAfterRace.gameDate;
  const advanced=await browser.evalJS(`(()=>{
   const button=document.querySelector('[data-cc-action="advance-test-day"]');
   if(!button)return false;button.click();return true;
  })()`);
  assert.equal(advanced,true,'Full-world game-day control missing');
  await waitFor('full-world game-day save',async()=>{
   const saved=await readCareerSave();
   return {done:!!saved&&saved.gameDate!==previousDate,value:saved};
  },120000);
  careerAfterRace=await readCareerSave();
 }
 assert.ok(careerAfterRace.officialRaces>=1,
  'Full-world entered race did not become an official saved result within 35 days');
 const storageAfterRace=await browser.evalJS('navigator.storage.estimate()');
 const playedCareerEvidence={worldHorses:snap.horses,worldId:snap.worldId,
  storageUsageBytes:{beforeCareer:storageBeforeCareer.usage,
   afterStart:storageAfterStart.usage,afterOfficialRace:storageAfterRace.usage},
  saves:{careerAtStart,careerWithEntries,careerAfterOfficialRace:careerAfterRace},
  deltas:{startToEntryBytes:careerWithEntries.utf8JsonBytes-careerAtStart.utf8JsonBytes,
   entryToOfficialBytes:careerAfterRace.utf8JsonBytes-careerWithEntries.utf8JsonBytes,
   worldToCareerStartStorageBytes:storageAfterStart.usage-storageBeforeCareer.usage,
   worldToOfficialRaceStorageBytes:storageAfterRace.usage-storageBeforeCareer.usage}};
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_SIZE '+JSON.stringify(playedCareerEvidence));
 console.log('WTW_FULL_WORLD_FIRST_OPEN_PASS '+JSON.stringify(snap));
 await stop(browser);browser=null;
 browser=await launch();
 await waitFor('Career Manager after restart',async()=>{
  const v=await browser.evalJS('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:v,value:v};
 });
 await browser.evalJS('window.WTWCompactCareerManager.open().then(()=>true)');
 const careerAfterProcessRestart=await readCareerSave();
 assert.deepEqual(careerAfterProcessRestart,careerAfterRace,
  'Played full-world career record changed or failed to reopen after Chromium restart');
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_REOPEN_PASS '+JSON.stringify(careerAfterProcessRestart));
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
  const click=async(selector)=>{
   const button=document.querySelector(selector);
   if(!button)throw Error('Missing world UI control '+selector);
   button.click();
   for(let i=0;i<40;i++){
    await new Promise(ok=>setTimeout(ok,80));
    if(!document.querySelector('#wtwCommercialCareerModal')?.textContent?.includes('Creating'))break;
   }
  };
  await click('[data-cc-action="industry-people"]');
  await new Promise(ok=>setTimeout(ok,300));
  await click('[data-cc-action="inspect-listed-person"]');
  await new Promise(ok=>setTimeout(ok,300));
  const person=!!document.querySelector('#wtwCommercialCareerModal')?.textContent?.includes('PERSON PROFILE');
  await click('[data-cc-action="industry-directory"]');
  await new Promise(ok=>setTimeout(ok,300));
  await click('[data-cc-action="inspect-listed-entity"]');
  await new Promise(ok=>setTimeout(ok,300));
  const entity=!!document.querySelector('#wtwCommercialCareerModal')?.textContent?.includes('INDUSTRY PROFILE');
  return {person,entity};
 })()`);
 assert.equal(profileView.person,true,'Birthplace/person profile cannot open from staff directory');
 assert.equal(profileView.entity,true,'Track/farm/owner profile cannot open from directory');
 console.log('WTW_FULL_WORLD_PROFILE_NAVIGATION_PASS '+JSON.stringify(profileView));
 console.log('WTW_FULL_WORLD_BROWSER_REOPEN_PASS '+JSON.stringify({snap,ui}));
}finally{
 await stop(browser);
 server.kill('SIGTERM');
 rmSync(profile,{recursive:true,force:true});
}
