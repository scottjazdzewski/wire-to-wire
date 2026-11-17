import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistent1999Industry,savePersistent1999CareerRun,
 loadPersistent1999CareerRun} from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
import {digestPersistent1999GameSnapshot,openPersistent1999GameCareer,
 format1999OpeningBarnName,PERSISTED_1999_OPENING_BARN_NAMING_MODEL}
 from '../public/1999/engine/fictional-industry-game-world-bridge-1999.mjs';
import {validateGameRun} from '../public/1999/game/state.js';
import {dispatchGameCommand} from '../public/1999/game/kernel.js';
import {gameRaceProgram,supported1999RaceClass,raceEligibility}
 from '../public/1999/game/racing-1999.js';

function memoryStore(){
 const names=['manifests','horseBatches','personBatches','horseEdits',
  'careerRuns','directory','coveringBatches','calendarBatches','industryLifecycle'];
 const data=Object.fromEntries(names.map(name=>[name,new Map()]));
 return {get:async(store,key)=>data[store].get(key),
  commitDirectory:async(id,manifest,records)=>{
   data.directory.set(id,structuredClone(records));
   data.manifests.set(id,structuredClone(manifest));
  },
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   data[kind].set(worldId+':'+index,structuredClone(records));
   data.manifests.set(worldId,structuredClone(manifest));
  },putCareerRun:async(id,runId,record)=>{
   if(data.manifests.get(id)?.status!=='COMPLETE')throw Error('World incomplete');
   data.careerRuns.set(id+':'+runId,structuredClone(record));
  },
  commitLifecycleRun:async({worldKey,runId,record,checkpoint,horseUpdates=[],eventWrites=[],dataWrites=[]})=>{
   if(data.manifests.get(worldKey)?.status!=='COMPLETE')throw Error('World incomplete');
   const runKey=worldKey+':'+runId;
   data.careerRuns.set(worldKey+':'+runId,structuredClone(record));
   data.industryLifecycle.set(runKey+':checkpoint',structuredClone(checkpoint));
   for(const update of horseUpdates)data.industryLifecycle.set(runKey+':horse:'+update.id,structuredClone(update));
   for(const write of [...eventWrites,...dataWrites])data.industryLifecycle.set(write.key,structuredClone(write.value));
  },
  commitManifest:async(id,manifest)=>data.manifests.set(id,structuredClone(manifest))};
}

test('owner-operated barn labels use approved owner and venue names, never generic double Racing',()=>{
 assert.match(PERSISTED_1999_OPENING_BARN_NAMING_MODEL,/OWNER_TRACK_BARN/);
 const owner={id:'O-OWNER-01',name:'North Star Racing'};
 const a={id:'T-0001',name:'Aqueduct'};
 const b={id:'T-0002',name:'Belmont Park'};
 assert.equal(format1999OpeningBarnName(owner,a),'North Star Racing — Aqueduct Barn');
 assert.equal(format1999OpeningBarnName(owner,b),'North Star Racing — Belmont Park Barn');
 assert.notEqual(format1999OpeningBarnName(owner,a),format1999OpeningBarnName(owner,b));
 assert.equal(owner.name,'North Star Racing','source organization is never renamed');
 assert.throws(()=>format1999OpeningBarnName({id:'O-OWNER-01',name:''},a),
  /real named owner and track/);
 assert.throws(()=>format1999OpeningBarnName(owner,{id:'',name:'Aqueduct'}),
  /real named owner and track/);
});

test('full-scale career snapshot hashes preserve census order in bounded chunks',async()=>{
 const manifest={worldId:'FullScaleDigestTest',seed:19990101,
  targetOpeningHorses:300000,horseCount:300000,personCount:75000};
 const entities={
  horses:Array.from({length:300000},(_,i)=>({id:'H-'+i,name:'Horse '+i})),
  people:Array.from({length:75000},(_,i)=>({id:'P-'+i,name:'Person '+i})),
  organizations:Array.from({length:1605},(_,i)=>({id:'O-'+i,name:'Org '+i})),
  tracks:Array.from({length:107},(_,i)=>({id:'T-'+i,name:'Track '+i}))
 };
 const cards=Array.from({length:10000},(_,i)=>({id:'R-'+i,date:'1999-01-01'}));
 const snapshot={manifest,entities,cards};
 const first=await digestPersistent1999GameSnapshot(snapshot);
 assert.match(first,/^[a-f0-9]{64}$/);
 entities.horses[0].name+=' changed';
 const changed=await digestPersistent1999GameSnapshot(snapshot);
 assert.notEqual(changed,first,'any horse record change must change the snapshot digest');
});

test('10,000-horse persisted 1999 world opens and runs a canonical race career',async()=>{
 const store=memoryStore();
 const manifest=await createPersistent1999Industry({store,seed:19990101,
  worldId:'CanonicalBridgeTest',targetOpeningHorses:10000,batchSize:500,
  tracks:[{id:'T-0001',name:'Aqueduct',location:{city:'Queens',region:'NY',country:'USA'}}],
  farms:[{id:'O-FARM-1',name:'Blue Meadow Farm',location:{city:'Lexington',region:'KY',country:'USA'}}],
  owners:Array.from({length:20},(_,i)=>({
   id:'O-OWNER-'+String(i+1).padStart(2,'0'),
   name:i?'North Star Partner '+i:'North Star Racing',
   portfolioTier:'ELITE',maxHorses:900,
   homeTrackId:'T-0001',location:{city:'New York',region:'NY',country:'USA'}}))});
 const career=await openPersistent1999GameCareer(store,manifest,{
  runId:'WTW-RUN-CUSTOM-SIZE-10',operationId:'O-OWNER-01'});
 assert.equal(career.world.manifest.targetOpeningHorses,10000);
 assert.equal(manifest.horseCount,10000);
 assert.equal(career.world.entities.horses.length,manifest.horseCount);
 assert.ok(career.world.entities.horses.every(h=>typeof h.name==='string'&&h.name));
 assert.equal(career.world.calendar.cards.length,manifest.scheduledCards);
 assert.equal(career.run.player.operation_id,'O-OWNER-01');
 const openingSite=career.run.runtime.facilities.sites['F-1999-OPENING-T-0001'];
 assert.ok(openingSite,'new barn should exist in canonical game run');
 assert.equal(openingSite.id,'F-1999-OPENING-T-0001');
 assert.equal(openingSite.name,'North Star Racing — Aqueduct Barn');
 assert.equal(openingSite.owner_id,'O-OWNER-01');
 assert.equal(openingSite.host_track_id,'T-0001');
 assert.ok(openingSite.head_trainer_person_id,'trainer identity must remain linked');
 assert.ok(career.playableHorseCount>0);
 const ownedRunners=career.world.entities.horses.filter(h=>
  h.status==='RACING'&&h.ownerId===career.operation.id);
 assert.equal(career.playableHorseCount,ownedRunners.length,
  'the playable run must not truncate a selected operator at a demo roster size');
 assert.ok(career.openingJockeyCount>=2);
 assert.equal(validateGameRun(career.run,career.world),career.run);
 let state=career.run,raceChoice=null;
 for(let offset=2;offset<=28&&!raceChoice;offset++){
  const date=new Date(Date.UTC(1999,0,1+offset)).toISOString().slice(0,10);
  const book=gameRaceProgram(state,career.world,career.homeTrackId,date)
   .find(r=>supported1999RaceClass(r)&&r.conditions==='Maiden Special Weight');
  if(!book)continue;
  const opened=dispatchGameCommand({state,world:career.world,command:{
   id:'test-open-'+date,type:'OPEN_1999_RACE',actor:'system',
   payload:{track_id:career.homeTrackId,date,race_id:book.id}}});
  state=opened.state;
  const candidates=state.stable_horse_ids.map(id=>state.runtime.registered_horses.by_id[id]);
  for(let i=0;i<candidates.length&&!raceChoice;i++)for(let j=i+1;j<candidates.length;j++){
   const pair=[candidates[i],candidates[j]];
   if(pair.every(h=>raceEligibility(state,h,state.runtime.races[book.id]).eligible)){
    raceChoice={book,horseIds:pair.map(h=>h.horse_id)};break;
   }
  }
  if(!raceChoice)state=career.run;
 }
 assert.ok(raceChoice,'generated world must offer a local testable maiden race');
 for(const horseId of raceChoice.horseIds){
  state=dispatchGameCommand({state,world:career.world,command:{
   id:'test-enter-'+horseId,type:'ENTER_1999_RACE',actor:'player',
   payload:{race_id:raceChoice.book.id,horse_id:horseId}}}).state;
 }
 const used=new Set();
 for(const horseId of raceChoice.horseIds){
  let booked=false;
  for(const jockey of Object.values(state.runtime.racing.jockeys)){
   if(used.has(jockey.id))continue;
   try{
    state=dispatchGameCommand({state,world:career.world,command:{
     id:'test-book-'+horseId+'-'+jockey.id,type:'BOOK_1999_JOCKEY',actor:'player',
     payload:{race_id:raceChoice.book.id,horse_id:horseId,jockey_id:jockey.id}}}).state;
    used.add(jockey.id);booked=true;break;
   }catch{}
  }
  assert.ok(booked,'generated jockey agent must accept one of the local mounts');
 }
 while(state.clock.date<raceChoice.book.date)
  state=dispatchGameCommand({state,world:career.world,command:{
   id:'test-day-'+state.clock.date,type:'ADVANCE_DAY',actor:'player',payload:{}}}).state;
 assert.equal(state.runtime.races[raceChoice.book.id].date,state.clock.date,
  'opened race must settle on its exact game date');
 if(state.runtime.races[raceChoice.book.id].status==='ENTRIES_OPEN')
  state=dispatchGameCommand({state,world:career.world,command:{
   id:'test-settle-'+raceChoice.book.id,type:'SETTLE_1999_RACE',actor:'system',
   payload:{race_id:raceChoice.book.id}}}).state;
 assert.equal(state.runtime.races[raceChoice.book.id].status,'OFFICIAL_SIM_RESULT');
 assert.ok(state.runtime.races[raceChoice.book.id].results.length>=2);
 await savePersistent1999CareerRun(store,manifest,{runId:state.run_id,
  gameDate:state.clock.date,player:state.player,
  changes:{canonicalRun:state},version:state.revision+1});
 const saved=await loadPersistent1999CareerRun(store,manifest,state.run_id);
 assert.deepEqual(saved.changes.canonicalRun,state);
 const resumed=await openPersistent1999GameCareer(store,manifest,{
  runId:state.run_id,operationId:state.player.operation_id});
 assert.equal(validateGameRun(saved.changes.canonicalRun,resumed.world),
  saved.changes.canonicalRun);
 assert.equal(saved.changes.canonicalRun.runtime.facilities.sites[
  'F-1999-OPENING-T-0001'].name,openingSite.name);
 assert.equal(resumed.run.runtime.facilities.sites[
  'F-1999-OPENING-T-0001'].name,openingSite.name);
 assert.equal(saved.changes.canonicalRun.runtime.facilities.sites[
  'F-1999-OPENING-T-0001'].owner_id,openingSite.owner_id);
});

test('approved Kingsmere is an openable owner-farm operator with a persistent full racing string',async()=>{
 const store=memoryStore();
 const kingsmere={id:'O-000061',name:'Kingsmere Farm',
  location:{city:'Versailles',region:'Kentucky',country:'USA'},
  portfolioTier:'ELITE',maxHorses:850,homeTrackId:'T-0001',
  operatingRoles:['LEGAL_OWNER','BREEDER','FOALING_FARM']};
 const owners=[kingsmere,...Array.from({length:20},(_,i)=>({
  id:'O-TEST-OP-'+String(i+1).padStart(2,'0'),name:'Test Operation '+(i+1),
  portfolioTier:'ELITE',
  maxHorses:900,homeTrackId:'T-0001'}))];
 const manifest=await createPersistent1999Industry({store,seed:19990117,
  worldId:'KingsmereCareerIntegration',targetOpeningHorses:10000,batchSize:1000,
  tracks:[{id:'T-0001',name:'Keeneland',location:{city:'Lexington',
   region:'Kentucky',country:'USA'}}],farms:[kingsmere],owners});
 const career=await openPersistent1999GameCareer(store,manifest,{
  runId:'WTW-RUN-KINGSMERE-1999',operationId:'O-000061'});
 const ownedRunners=career.world.entities.horses.filter(h=>
  h.status==='RACING'&&h.ownerId==='O-000061');
 assert.ok(ownedRunners.length>1);
 assert.equal(career.playableHorseCount,ownedRunners.length);
 assert.ok(career.run.stable_horse_ids.every(id=>{
  const horse=career.run.runtime.registered_horses.by_id[id];
  return horse.owner_organization_id==='O-000061'&&horse.world_source_horse_id;
 }));
 const saved=await savePersistent1999CareerRun(store,manifest,{
  runId:career.run.run_id,player:career.run.player,gameDate:career.run.clock.date,
  changes:{canonicalRun:career.run},version:2});
 const reopened=await loadPersistent1999CareerRun(store,manifest,career.run.run_id);
 assert.deepEqual(reopened,saved);
 assert.equal(reopened.changes.canonicalRun.stable_horse_ids.length,
  ownedRunners.length,'the selected operation must survive save and reopen intact');
});
