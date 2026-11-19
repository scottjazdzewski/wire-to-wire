import test from 'node:test';
import assert from 'node:assert/strict';
import {createPersistent1999Industry,savePersistent1999CareerRun,
 loadPersistent1999CareerRun} from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
import {digestPersistent1999GameSnapshot,openPersistent1999GameCareer,
 format1999OpeningBarnName,plan1999OpeningTrainerBarnAssignments,
 PERSISTED_1999_OPENING_BARN_NAMING_MODEL,
 calculate1999OpeningTreasury}
 from '../public/1999/engine/fictional-industry-game-world-bridge-1999.mjs';
import {validateGameRun} from '../public/1999/game/state.js';
import {dispatchGameCommand} from '../public/1999/game/kernel.js';
import {gameRaceProgram,supported1999RaceClass,raceEligibility}
 from '../public/1999/game/racing-1999.js';
import {getCareerHorseConnections}
 from '../public/1999/game/horse-connections.js';

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

test('opening trainer barn plan keeps original stable IDs for one head and never replaces a source trainer',()=>{
 const owner={id:'O-000061',name:'Kingsmere Farm'},
  tracks=[{id:'T-0001',name:'Keeneland'}],
  people=[
   {id:'P-TRAINER-A',name:'Alex Veteran',role:'trainer',workplaceId:'T-0001'},
   {id:'P-TRAINER-B',name:'Bryn Apprentice',role:'trainer',workplaceId:'T-0001'},
   {id:'P-OTHER',name:'Other Circuit',role:'trainer',workplaceId:'T-0002'}];
 const a={id:'H-A',homeTrackId:'T-0001',trainerId:'P-TRAINER-A'},
  b={id:'H-B',homeTrackId:'T-0001',trainerId:'P-TRAINER-B'},
  c={id:'H-C',homeTrackId:'T-0001',trainerId:'P-TRAINER-A'};
 const one=plan1999OpeningTrainerBarnAssignments({
  openingRoster:[a,c],people,tracks,operation:owner});
 assert.equal(one.sites.length,1);
 assert.equal(one.sites[0].siteId,'F-1999-OPENING-T-0001');
 assert.equal(one.sites[0].siteName,'Kingsmere Farm — Keeneland Barn');
 const mixed=plan1999OpeningTrainerBarnAssignments({
  openingRoster:[b,c,a],people,tracks,operation:owner});
 const stable=plan1999OpeningTrainerBarnAssignments({
  openingRoster:[a,b,c],people,tracks,operation:owner});
 assert.deepEqual(mixed,stable,'open population insertion order cannot change the ID mapping');
 assert.equal(stable.sites.length,2);
 assert.equal(stable.sites.find(site=>site.trainerId==='P-TRAINER-A').horseCount,2);
 assert.equal(stable.sites.find(site=>site.trainerId==='P-TRAINER-B').horseCount,1);
 assert.notEqual(stable.bySourceHorseId['H-A'],stable.bySourceHorseId['H-B']);
 assert.equal(stable.bySourceHorseId['H-A'],stable.bySourceHorseId['H-C']);
 assert.ok(stable.sites.every(site=>site.siteName.startsWith('Kingsmere Farm — Keeneland Barn')));
 assert.deepEqual(people[0],{id:'P-TRAINER-A',name:'Alex Veteran',
  role:'trainer',workplaceId:'T-0001'},'never mutate source personnel identity');
 assert.throws(()=>plan1999OpeningTrainerBarnAssignments({
  openingRoster:[{...a,trainerId:'P-OTHER'}],people,tracks,operation:owner}),
  /no locally employed assigned trainer/i);
 assert.throws(()=>plan1999OpeningTrainerBarnAssignments({
  openingRoster:[a,a],people,tracks,operation:owner}),
  /Repeated or missing original racing horse ID/i);
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
 const expectedOpeningCapital=calculate1999OpeningTreasury({
  portfolioTier:career.operation.portfolioTier,
  resources:career.operation.ratings?.resources??55,
  activeRunnerCount:career.playableHorseCount});
 assert.equal(career.run.runtime.finances.balance_minor,expectedOpeningCapital);
 assert.equal(career.run.runtime.finances.operation_balances_minor[
  career.operation.id],expectedOpeningCapital);
 const openingSites=career.run.runtime.facilities.sites;
 const openingSite=Object.values(openingSites)[0];
 assert.ok(openingSite,'real assigned-trainer barn should exist in canonical game run');
 assert.match(openingSite.id,/^F-1999-OPENING-T-0001(?:-P-[A-Za-z0-9-]+)?$/);
 assert.ok(openingSite.name.startsWith('North Star Racing — Aqueduct Barn'));
 assert.equal(openingSite.owner_id,'O-OWNER-01');
 assert.equal(openingSite.host_track_id,'T-0001');
 assert.ok(openingSite.head_trainer_person_id,'exact trainer identity must remain linked');
 const ownerHorses=Object.values(career.run.runtime.registered_horses.by_id);
 assert.equal(ownerHorses.length,career.playableHorseCount);
 assert.equal(new Set(ownerHorses.map(h=>h.trainer_id)).size,
  Object.values(openingSites).length,
  'every distinct operating trainer has one real owner-controlled barn');
 for(const h of ownerHorses){
  const barn=openingSites[h.current_residence_id];
  assert.equal(barn?.head_trainer_person_id,h.trainer_id,
   'horse cannot be managed by the wrong trainer at its physical barn');
  assert.equal(barn?.owner_id,h.owner_organization_id);
  assert.equal(barn?.operator_organization_id,h.owner_organization_id);
  assert.equal(barn?.host_track_id,h.host_track_id);
  assert.equal(h.racing_barn_id,barn.id);
  assert.equal(career.world.entities.people.find(p=>p.id===h.trainer_id)?.workplaceId,
   h.host_track_id,'the actual professional must work on the same circuit');
 }
 assert.ok(career.playableHorseCount>0);
 const ownedRunners=career.world.entities.horses.filter(h=>
  ['RACING','TWO_YEAR_OLD_PROSPECT'].includes(h.status)&&
  h.ownerId===career.operation.id);
 assert.equal(career.playableHorseCount,ownedRunners.length,
  'the playable run must not truncate a selected operator at a demo roster size');
 assert.ok(career.openingJockeyCount>=2);
 assert.equal(validateGameRun(career.run,career.world),career.run);
 const registered=Object.values(career.run.runtime.registered_horses.by_id)[0];
 assert.ok(registered.care_facility_organization_id);
 assert.ok(registered.training_barn_organization_id);
 const careRoster=getCareerHorseConnections(career.run,career.world,{
  kind:'care_facility',id:registered.care_facility_organization_id});
 assert.ok(careRoster.horses.some(h=>
  h.id===registered.horse_id&&h.training_barn_organization_id===registered.training_barn_organization_id));
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
  const candidates=state.stable_horse_ids.map(id=>state.runtime.registered_horses.by_id[id]).filter(Boolean);
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
 // The exact locally assigned groom receives real modeled earnings while
 // the owner-operated barn posts the corresponding paid cash expense.
 const receipts=state.runtime.finances.ledger.filter(x=>
  x.kind==='FACILITY_NAMED_EMPLOYEE_RECEIPT');
 assert.ok(receipts.length>0,'a playable race career must pay actual persisted staff');
 for(const receipt of receipts.slice(0,30)){
  const employee=career.world.entities.people.find(p=>p.id===receipt.person_id);
  assert.equal(employee?.role,'groom');
  assert.equal(employee.workplaceId,'T-0001');
  assert.equal(receipt.employer_operation_id,career.operation.id);
  assert.ok(state.runtime.people[employee.id].stable_payroll_earned_minor>=
   receipt.amount_minor);
  const matching=state.runtime.finances.ledger.filter(x=>
   x.transaction_id===receipt.transaction_id&&
   x.kind==='FACILITY_STAFF_PAYROLL');
  assert.equal(matching.length,1,'every paid salary has exactly one employer cash debit');
  assert.equal(matching[0].amount_minor,-receipt.amount_minor);
 }
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
  openingSite.id].name,openingSite.name);
 assert.equal(resumed.run.runtime.facilities.sites[
  openingSite.id].name,openingSite.name);
 assert.equal(saved.changes.canonicalRun.runtime.facilities.sites[
  openingSite.id].owner_id,openingSite.owner_id);
 assert.deepEqual(resumed.run.runtime.facilities.sites,openingSites,
  'reopening preserves all trainer-site IDs, names, organizations and responsibilities');
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
 const trainingFarm={id:'O-TRAINING-1999-01',name:'Keeneland Training Barn',
  location:kingsmere.location,homeTrackId:'T-0001',
  operatingRoles:['RACING_STABLE','TRAINING_BARN','BOARDING_FACILITY']};
 const careFarm={id:'O-CARE-1999-01',name:'Bluegrass Boarding Farm',
  location:kingsmere.location,homeTrackId:'T-0001',
  operatingRoles:['BOARDING_FACILITY']};
 kingsmere.operatingRoles.push('BOARDING_FACILITY');
 const manifest=await createPersistent1999Industry({store,seed:19990117,
  worldId:'KingsmereCareerIntegration',targetOpeningHorses:10000,batchSize:1000,
  tracks:[{id:'T-0001',name:'Keeneland',location:{city:'Lexington',
   region:'Kentucky',country:'USA'}}],farms:[kingsmere,trainingFarm,careFarm],owners});
 const career=await openPersistent1999GameCareer(store,manifest,{
  runId:'WTW-RUN-KINGSMERE-1999',operationId:'O-000061'});
 const ownedRunners=career.world.entities.horses.filter(h=>
  ['RACING','TWO_YEAR_OLD_PROSPECT'].includes(h.status)&&
  h.ownerId==='O-000061');
 assert.ok(ownedRunners.length>1);
 assert.equal(career.operationInventoryByRelationship.BOARDED,
  career.world.entities.horses.filter(h=>h.careFacilityId==='O-000061').length,
  'operation inventory must include horses physically boarded at its facilities');
 assert.ok(career.operationInventoryByRelationship.OWNED>=ownedRunners.length);
 assert.equal(career.operationInventoryByRelationship.BRED,
  career.world.entities.horses.filter(h=>h.breederId==='O-000061').length);
 assert.equal(career.operationInventoryByRelationship.FOALED_AT,
  career.world.entities.horses.filter(h=>h.foalingFarmId==='O-000061').length);
 const firstActive=career.run.runtime.registered_horses.by_id[
  'H-GAME-1999-WORLD-'+ownedRunners[0].id.replace(/^H-FICTIONAL-1999-/,'')];
 assert.notEqual(firstActive.care_facility_organization_id,
  firstActive.training_barn_organization_id,
  'boarding and racing-stable relationships must remain distinct when the world has separate facilities');
 const kingsmereStables=career.run.runtime.facilities.sites;
 const kingsmereRunners=Object.values(career.run.runtime.registered_horses.by_id);
 const employed=new Set(kingsmereRunners.map(h=>h.trainer_id));
 assert.ok(employed.size>1,'Kingsmere has more than one real employed trainer');
 assert.equal(Object.keys(kingsmereStables).length,employed.size,
  'Kingsmere trainer employer/site relationships must be represented in the game');
 for(const h of kingsmereRunners){
  const site=kingsmereStables[h.current_residence_id];
  const trainer=career.world.entities.people.find(p=>p.id===h.trainer_id);
  assert.ok(site&&trainer,'Kingsmere horse must retain known trainer and real barn');
  assert.equal(site.owner_id,'O-000061');
  assert.equal(site.operator_organization_id,'O-000061');
  assert.equal(site.head_trainer_person_id,h.trainer_id);
  assert.equal(site.host_track_id,'T-0001');
  assert.equal(trainer.workplaceId,'T-0001');
  const activeSkills=career.run.runtime.people[h.trainer_id]?.game_training_skills;
  assert.equal(activeSkills?.source,
   'MODELED_FROM_PERSISTED_1999_TRAINER_ROLE_RATINGS',
   'Kingsmere trainer must have real persisted conditioning, placement and development');
  assert.equal(activeSkills.biography.date_of_birth,trainer.dateOfBirth);
  assert.equal(activeSkills.biography.age_at_opening,trainer.ageAtOpening);
  assert.equal(activeSkills.biography.home_track_id,'T-0001');
  assert.deepEqual(activeSkills.source_role_ratings,trainer.ratings);
  for(const trait of Object.values(activeSkills.roleAttributes))
   assert.ok(Number.isFinite(trait)&&trait>=0&&trait<=1);
  for(const hired of site.payroll_staff||[]){
   const employee=career.world.entities.people.find(p=>p.id===hired.person_id);
   assert.ok(employee,'only a real saved source employee can work for Kingsmere');
   assert.equal(employee.role,'groom');
   assert.equal(employee.workplaceId,'T-0001');
   assert.equal(hired.daily_wage_minor,6000+employee.ratings.horseCare*40,
    'actual persisted horse-care rating determines real paid terms');
  }
  assert.ok(site.name.startsWith('Kingsmere Farm — Keeneland Barn'));
  assert.equal(h.racing_barn_id,site.id);
 }

 const twoYearProspects=ownedRunners.filter(h=>h.status==='TWO_YEAR_OLD_PROSPECT');
 assert.ok(twoYearProspects.length>0);
 assert.ok(twoYearProspects.every(source=>{
  const id='H-GAME-1999-WORLD-'+source.id.replace(/^H-FICTIONAL-1999-/,'');
  const active=career.run.runtime.registered_horses.by_id[id];
  return active?.foaling_year===1997&&active.racing_age_1999===2&&
   active.status==='IN_TRAINING'&&active.starting_attributes.current_ability<
    active.starting_attributes.potential_ability;
 }), '2-year-old prospects should enter as developing, non-peak game horses');
 assert.equal(career.playableHorseCount,ownedRunners.length);
 const registeredRunnerIds=career.run.stable_horse_ids.filter(id=>
  Boolean(career.run.runtime.registered_horses.by_id[id]));
 assert.equal(registeredRunnerIds.length,ownedRunners.length);
 const ownedNonRunners=career.world.entities.horses.filter(h=>
  h.ownerId==='O-000061'&&
  !['RACING','TWO_YEAR_OLD_PROSPECT'].includes(h.status));
 assert.ok(ownedNonRunners.some(h=>h.status==='BROODMARE'));
 assert.ok(ownedNonRunners.every(h=>career.run.stable_horse_ids.includes(h.id)),
  'breeding stock and youngstock must appear on the same playable stable roster');
 assert.equal(career.operationInventoryCount,new Set(career.run.stable_horse_ids).size,
  'the playable roster includes every distinct horse with an operation relationship');
 assert.ok(Object.values(kingsmereStables).some(site=>site.payroll_staff?.length),
  'Kingsmere opening operation needs actual locally employed stable workers');
 const employedPeople=Object.values(kingsmereStables).
  flatMap(site=>site.payroll_staff?.map(x=>x.person_id)||[]);
 assert.equal(new Set(employedPeople).size,employedPeople.length,
  'no worker can draw two unrelated Kingsmere barn wages for one shift');
 const saved=await savePersistent1999CareerRun(store,manifest,{
  runId:career.run.run_id,player:career.run.player,gameDate:career.run.clock.date,
  changes:{canonicalRun:career.run},version:2});
 const reopened=await loadPersistent1999CareerRun(store,manifest,career.run.run_id);
 assert.deepEqual(reopened,saved);
 assert.equal(reopened.changes.canonicalRun.stable_horse_ids.length,
  career.operationInventoryCount,'the full operation inventory must survive save and reopen intact');
});
