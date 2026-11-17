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
   return {gameDate:record.gameDate,runId:record.runId,
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
 console.log('WTW_FULL_WORLD_PLAYED_SAVE_REOPEN_PASS '+JSON.stringify(careerAfterProcessRestart));
 const raceSettlement=await browser.evalJS(`(async()=>{
  const persistence=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const bridge=await import('/1999/engine/fictional-industry-game-world-bridge-1999.mjs');
  const {dispatchGameCommand}=await import('/1999/game/kernel.js');
  const {gameRaceProgram,supported1999RaceClass,raceEligibility}=await import('/1999/game/racing-1999.js');
  const db=await persistence.open1999IndustryDatabase();
  try{
   const reopened=await persistence.reopenPersistent1999Industry(db,{
    seed:19990101,worldId:${JSON.stringify(snap.worldId)}});
   if(!reopened||reopened.status!=='READY')throw Error('Completed full world did not reopen');
   const runId='WTW-RUN-1999-'+reopened.manifest.seed+'-SIZE-'+
    (reopened.manifest.targetOpeningHorses??reopened.manifest.horseCount);
   const saved=await persistence.loadPersistent1999CareerRun(db,reopened.manifest,runId);
   if(!saved?.changes?.canonicalRun)throw Error('Saved full-world career is missing');
   const career=await bridge.openPersistent1999GameCareer(db,reopened.manifest,{
    runId,operationId:saved.player.operation_id});
   const world=career.world;let state=saved.changes.canonicalRun;
   const baselineBalance=state.runtime.finances.operation_balances_minor[state.player.operation_id];
   const dayGap=(from,to)=>(Date.parse(to+'T00:00:00Z')-
    Date.parse(from+'T00:00:00Z'))/86400000;
   const raceView=book=>({id:book.id,track_id:book.trackId,date:book.date,
    age:book.ageRequirement,sex:book.sexRestriction,conditions:book.conditions,
    surface:book.surface,distance_furlongs:book.distanceFurlongs,
    field_capacity:book.fieldCapacity,max_wins:book.maxCareerWins,
    maiden:book.maidenOnly,status:'ENTRIES_OPEN',field:[]});
   const occupiedTracks=[...new Set(state.stable_horse_ids.map(id=>
    state.runtime.registered_horses.by_id[id].host_track_id))].sort();
   const excludedRaces=new Set();let chosen=null;const scheduleEvidence=[];
   for(let attempt=0;attempt<24&&!chosen;attempt++){
    let plan=null;
    for(let offset=2;offset<=365&&!plan;offset++){
     const date=new Date(Date.parse(state.clock.date+'T00:00:00Z')+
      offset*86400000).toISOString().slice(0,10);
     if(!date.startsWith('1999-'))break;
     for(const trackId of occupiedTracks){
      const localHorses=state.stable_horse_ids.map(id=>
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
       plan={book,trackId};break;
      }
      if(plan)break;
     }
    }
    if(!plan)throw Error('No statically eligible maiden on player stable tracks in 1999; tracks '+
     JSON.stringify(occupiedTracks)+'; scheduled candidates '+JSON.stringify(scheduleEvidence.slice(0,12)));
    while(dayGap(state.clock.date,plan.book.date)>4){
     state=dispatchGameCommand({state,world,command:{
      id:'full-world-race-window-'+state.clock.date,type:'ADVANCE_DAY',
      actor:'player',payload:{}}}).state;
    }
    const localHorses=state.stable_horse_ids.map(id=>
     state.runtime.registered_horses.by_id[id]).filter(h=>h.host_track_id===plan.trackId);
    const ready=localHorses.filter(h=>raceEligibility(state,h,raceView(plan.book)).eligible)
     .sort((a,b)=>state.runtime.horse[b.horse_id].training.readiness-
      state.runtime.horse[a.horse_id].training.readiness||
      state.runtime.horse[a.horse_id].training.currentRisk-
      state.runtime.horse[b.horse_id].training.currentRisk||
      a.horse_id.localeCompare(b.horse_id));
    if(ready.length<2){excludedRaces.add(plan.book.id);continue}
    chosen={...plan,horses:ready.slice(0,Math.min(8,plan.book.fieldCapacity))};
   }
   if(!chosen)throw Error('Could not find a race with two cleared starters after 24 scheduled candidates');
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
    raceId:race.id,raceName:race.name,raceDate:race.date,openedFromDate:openedDate,
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
 const careerAfterRaceRestart=await readCareerSave();
 assert.deepEqual(careerAfterRaceRestart,careerAfterRace,
  'Official full-world race changed or failed to reopen after Chromium restart');
 assert.ok(careerAfterRaceRestart.raceFields.some(r=>r.raceId===raceSettlement.raceId&&
  r.status==='OFFICIAL_SIM_RESULT'&&r.results.length===raceSettlement.starterCount),
  'Official result is missing after Chromium process restart');
 console.log('WTW_FULL_WORLD_RACE_REOPEN_PASS '+JSON.stringify({raceSettlement,careerAfterRaceRestart}));
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
  'WTW-RUN-1999-19990101-SIZE-300000');
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
  const response=await fetch('/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz');
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
 assert.equal(bundledCheckpoint.mainUiCareer?.people,75724);
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
 const readSharedReferenceFingerprint=async()=>browser.evalJS("(async()=>{"+
   "const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');"+
   "const db=await api.open1999IndustryDatabase();try{"+
   "const world=await api.reopenPersistent1999Industry(db,{seed:19990101,"+
   "worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});"+
   "const runId='WTW-RUN-1999-19990101-SIZE-300000';"+
   "const record=await api.loadPersistent1999CareerRun(db,world.manifest,runId);"+
   "if(!record)throw Error('Shared reference career missing during lifecycle audit');"+
   "const digest=await crypto.subtle.digest('SHA-256',"+
   "new TextEncoder().encode(JSON.stringify(record)));"+
   "return {runId:record.runId,gameDate:record.gameDate,version:record.version,"+
   "sha256:Array.from(new Uint8Array(digest),b=>b.toString(16).padStart(2,'0')).join('')};"+
   "}finally{db.close()}})()");
 const sharedReferenceBeforeLifecycle=await readSharedReferenceFingerprint();
 assert.equal(sharedReferenceBeforeLifecycle.runId,
  'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(sharedReferenceBeforeLifecycle.gameDate,careerAfterBundledImport.gameDate,
  'Lifecycle audit must start from the preserved shared career checkpoint');
 const lifecycleProbe=`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const breeding=await import('/1999/engine/fictional-industry-breeding-book-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const world=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});
   if(world?.status!=='READY'||world.manifest.horseCount!==300000)
    throw Error('Lifecycle probe did not load the exact 300,000-horse opening census');
   const manifest=world.manifest,runId='WTW-FULL-WORLD-LIFECYCLE-300K';
   const player={role:'owner',organizationId:'O-OWNER-1'};
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
   // The 300k industry runs in a separate career key, never the shared
   // May 1999 checkpoint. Certify real mature transitions through 2005.
   let final2005=saved;
   const adultYearChecks=[];
   for(let season=2002;season<=2005;season++){
    final2005=await save(season+'-01-01',season-1995);
    const events=await api.readPersistent1999LifecycleEvents(store,manifest,
     runId,season+'-01-01');
    const mature=events.find(event=>event.type==='MATURE_HORSE_LIFECYCLE');
    const young=events.filter(event=>event.type==='YOUNGSTOCK_ATTRITION')
     .reduce((sum,event)=>sum+event.deaths,0);
    if(!mature||mature.deaths<=0||
     final2005.lifecycle.deathsByYear[season]!==young+mature.deaths)
     throw Error('Full 300k adult mortality did not reconcile in '+season);
    const births=Object.values(final2005.lifecycle.birthsByYear)
     .reduce((sum,count)=>sum+count,0);
    if(final2005.lifecycle.population!==300000+births-
     final2005.lifecycle.horseDeaths)
     throw Error('Full 300k living population drift in '+season);
    adultYearChecks.push({season,adultDeaths:mature.deaths,
     racingRetirements:mature.retired,population:final2005.lifecycle.population});
   }
   const persisted2005=await api.loadPersistent1999CareerRun(store,manifest,runId);
   if(persisted2005.gameDate!=='2005-01-01'||
    persisted2005.lifecycle.population!==final2005.lifecycle.population)
    throw Error('300k five-year lifecycle checkpoint did not save and reopen');
   return {runId,openingHorseCount:saved.lifecycle.openingHorseCount,
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
    deceasedHorseId:deadId,retiredId,graduateId,
    adultYearChecks,population2005:final2005.lifecycle.population,
    matureDeaths2005:final2005.lifecycle.matureHorseDeaths};
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
    worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});
   const directory=await api.readPersistent1999Directory(store,world.manifest);
   const clean=entity=>Object.fromEntries(Object.entries(entity).filter(([key])=>
    !['ratings','relationships','ratingsProvenance'].includes(key)));
   const tracks=directory.filter(entity=>entity.id.startsWith('T-')).map(clean);
   const farms=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-FARM-')).map(clean);
   const owners=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-OWNER-')).map(clean);
   const manifest=await api.createPersistent1999Industry({store,seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V2-H325000',targetOpeningHorses:325000,
    farms,tracks,owners,batchSize:2000});
   return {status:manifest.status,horseCount:manifest.horseCount,
    targetOpeningHorses:manifest.targetOpeningHorses,worldId:manifest.worldId};
  }finally{store.close()}
 })()`);
 assert.deepEqual(maximumWorld,{status:'COMPLETE',horseCount:325000,
  targetOpeningHorses:325000,worldId:'WTW1999FullIndustry-COHORTS-V2-H325000'});
 console.log('WTW_MAX_WORLD_OPENING_PASS '+JSON.stringify(maximumWorld));
 const smallWorld=await browser.evalJS(`(async()=>{
  const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
  const store=await api.open1999IndustryDatabase();
  try{
   const source=await api.reopenPersistent1999Industry(store,{seed:19990101,
    worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});
   const directory=await api.readPersistent1999Directory(store,source.manifest);
   const clean=entity=>Object.fromEntries(Object.entries(entity).filter(([key])=>
    !['ratings','relationships','ratingsProvenance'].includes(key)));
   const tracks=directory.filter(entity=>entity.id.startsWith('T-')).map(clean);
   const farms=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-FARM-')).map(clean);
   const owners=directory.filter(entity=>entity.id.startsWith('O-FICTIONAL-OWNER-')).map(clean);
   const manifest=await api.createPersistent1999Industry({store,seed:19990111,
    worldId:'WTW1999FullIndustry-COHORTS-V2-H10000',targetOpeningHorses:10000,
    farms,tracks,owners,batchSize:1000});
   return {status:manifest.status,horseCount:manifest.horseCount,
    targetOpeningHorses:manifest.targetOpeningHorses,seed:manifest.seed,
    worldId:manifest.worldId};
  }finally{store.close()}
 })()`);
 assert.deepEqual(smallWorld,{status:'COMPLETE',horseCount:10000,
  targetOpeningHorses:10000,seed:19990111,
  worldId:'WTW1999FullIndustry-COHORTS-V2-H10000'});
 console.log('WTW_SMALL_WORLD_OPENING_PASS '+JSON.stringify(smallWorld));
 const maximumProbe=lifecycleProbe
  .replaceAll('WTW1999FullIndustry-COHORTS-V2-H300000','WTW1999FullIndustry-COHORTS-V2-H325000')
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
    worldId:'WTW1999FullIndustry-COHORTS-V2-H10000'});
   if(world?.status!=='READY'||world.manifest.horseCount!==10000)
    throw Error('Decade run did not open the exact 10,000-horse world');
   const manifest=world.manifest,runId='WTW-INDUSTRY-DECADES-10000';
   const player={role:'owner',organizationId:'O-OWNER-1'};
   const save=(gameDate,version)=>api.savePersistent1999CareerRun(store,manifest,
    {runId,gameDate,player,changes:{},version});
   const opening=await save('1999-01-01',1);
   if(opening.lifecycle.openingHorseCount!==10000)
    throw Error('Small-world lifecycle changed the opening census');
   const annual=[];
   const deceasedIds=new Set(),retiredIds=new Set(),graduatedIds=new Set(),
    stallionRetiredIds=new Set(),stallionGraduatedIds=new Set();
   const marketIndices=new Set(),plannedCrops=new Set();
   const directory=await api.readPersistent1999Directory(store,manifest);
   const directoryIds=new Set(directory.map(entity=>entity.id));
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
    const mature=events.find(event=>event.type==='MATURE_HORSE_LIFECYCLE');
    if(!mature||mature.deathHorseIds.length!==mature.deaths||
     mature.retiredHorseIds.length!==mature.retired)
     throw Error('Mature horse transitions were not durably committed in '+year);
    annualDeaths+=mature.deaths;
    for(const id of mature.deathHorseIds){
     if(deceasedIds.has(id))throw Error('Adult death duplicated a previous horse '+id);
     deceasedIds.add(id);
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
      worldId:'WTW1999FullIndustry-COHORTS-V2-H10000'});
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
   if(!horse||horse.age>31||horse.status==='RACING'||!horse.sireId||
     !horse.damId||!horse.ownerId||!horse.foalingFarmId||
     !directoryIds.has(horse.ownerId)||!directoryIds.has(horse.foalingFarmId))
     throw Error('A thirty-one-year-old cohort horse was immortal or lost its pedigree');
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
    worldId:'WTW1999FullIndustry-COHORTS-V2-H300000'});
   const runId='WTW-FULL-WORLD-LIFECYCLE-300K';
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
  .replaceAll('WTW1999FullIndustry-COHORTS-V2-H300000','WTW1999FullIndustry-COHORTS-V2-H325000')
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
    worldId:'WTW1999FullIndustry-COHORTS-V2-H10000'});
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
