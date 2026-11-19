import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999} from '../public/next/1999-track-program.mjs';
import {create1999DestinationNamingMarkets}
 from '../public/1999/engine/fictional-directory-destination-names-1999.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {materialize1999OwnerPrincipalPeople,ownerPrincipalPersonId,
 validate1999OwnerPrincipalLinks}
 from '../public/1999/engine/fictional-owner-principal-personnel-v12.mjs';
import {fictionalOwnerPortfolioTier,assessFictionalOwnerCapacity}
 from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';
import {createPersistent1999Industry,readPersistent1999Directory,
 readPersistent1999IndustryBatch,findPersistent1999Person,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 reopenPersistent1999Industry,verifyPersistent1999WorldOpen}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';

const SEED=19990101;
const WORLD_ID='WTW1999AllCircuits-NAMES-V13-H12000';
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const geo=JSON.parse(readFileSync(
 new URL('../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const geoById=new Map(geo.tracks.map(row=>[row.id,row]));
const tracks=Object.values(TRACK_PROGRAM_1999)
 .filter(track=>track.playableIn1999!==false&&track.trackOperating==='OPEN_1999')
 .map(track=>{
  const geographic=geoById.get(track.id);
  assert.ok(geographic?.city_locality&&geographic?.state_province_region&&
   geographic?.country,'Missing actual 1999 geography for '+track.id);
  return {id:track.id,name:track.name,
   location:{city:geographic.city_locality,
    region:geographic.state_province_region,country:geographic.country}};
 });
const ownerId=i=>'O-FICTIONAL-OWNER-'+String(i+1).padStart(6,'0');
const farmId=(track,index)=>'O-FICTIONAL-FARM-'+track.id+'-'+
 String(index+1).padStart(2,'0');
const sum=array=>array.reduce((total,x)=>total+x,0);

function memoryStore(){
 const stores=Object.fromEntries(['manifests','horseBatches','personBatches',
  'horseEdits','careerRuns','directory','coveringBatches','calendarBatches',
  'industryLifecycle'].map(name=>[name,new Map()]));
 const copy=x=>structuredClone(x);
 return {
  get:async(kind,key)=>stores[kind].get(key),
  commitDirectory:async(key,manifest,records)=>{
   stores.directory.set(key,copy(records));
   stores.manifests.set(key,copy(manifest));
  },
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   stores[kind].set(worldId+':'+index,copy(records));
   stores.manifests.set(worldId,copy(manifest));
  },
  commitManifest:async(key,manifest)=>stores.manifests.set(key,copy(manifest)),
  commitLifecycleRun:async({worldKey,runId,record,checkpoint,
   horseUpdates=[],eventWrites=[],dataWrites=[]})=>{
   const key=worldKey+':'+runId;
   stores.careerRuns.set(key,copy(record));
   stores.industryLifecycle.set(key+':checkpoint',copy(checkpoint));
   for(const item of horseUpdates)
    stores.industryLifecycle.set(key+':horse:'+item.id,copy(item));
   for(const item of [...eventWrites,...dataWrites])
    stores.industryLifecycle.set(item.key,copy(item.value));
  }
 };
}

function makeCircuitWorld(){
 assert.equal(tracks.length,107,'Test requires the real 107 active circuits');
 const ownerCountByTrack=tracks.map(()=>10);
 const destination=create1999DestinationNamingMarkets({
  tracks,ownerCountByTrack,farmsPerTrack:4});
 assert.equal(destination.ownerMarketIds.length,1070);
 assert.equal(destination.farmMarketIds.length,428);
 const source=createFictionalWorldNameEngine({
  worldId:'WTW1999AllCircuitsSourceV13',seed:SEED,year:1999,roles:{},
  owners:1070,facilities:{generalFarms:428},
  markets:destination.markets,
  destinationMarketIds:{
   owners:destination.ownerMarketIds,farms:destination.farmMarketIds},
  protectedNames:tracks.map(t=>t.name),
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS_SCALABLE_V11'
 });
 const owners=tracks.flatMap((track,trackIndex)=>Array.from(
  {length:10},(_,index)=>{
   const i=trackIndex*10+index,named=source.owners[i];
   return {id:ownerId(i),name:named.name,location:track.location,
    homeTrackId:track.id,
    portfolioTier:fictionalOwnerPortfolioTier(SEED,ownerId(i)),
    portfolioModel:'WTW_FICTIONAL_OWNER_PORTFOLIOS_V10',
    namingSourceId:named.id,destinationNamingModel:destination.schema,
    principalId:ownerPrincipalPersonId(i),principalName:named.principalName};
  }));
 const farms=tracks.flatMap((track,trackIndex)=>Array.from({length:4},(_,i)=>{
  const named=source.farms[trackIndex*4+i];
  return {id:farmId(track,i),name:named.name,homeTrackId:track.id,
   location:track.location,destinationNamingModel:destination.schema,
   operatingRoles:i>=2?
    ['RACING_STABLE','TRAINING_BARN','BOARDING_FACILITY']:
    ['BREEDER','FOALING_FARM','BOARDING_FACILITY']};
 }));
 const ownerPrincipalPeople=materialize1999OwnerPrincipalPeople({
  seed:SEED,owners,sourceOwners:source.owners,sourcePeople:source.people});
 return {seed:SEED,worldId:WORLD_ID,targetOpeningHorses:12000,
  tracks,owners,farms,ownerPrincipalPeople,batchSize:1000};
}

test('107 exact 1999 circuits issue deterministic owner/farm/principal identities',()=>{
 const world=makeCircuitWorld();
 assert.ok(validate1999OwnerPrincipalLinks(
  world.owners,world.ownerPrincipalPeople));
 assert.equal(world.owners.length,1070);
 assert.equal(world.farms.length,428);
 assert.equal(world.ownerPrincipalPeople.length,1070);
 const all=[...world.owners,...world.farms];
 assert.equal(new Set(all.map(x=>norm(x.name))).size,all.length,
  'no owner or farm may duplicate any other business name');
 assert.ok(!all.some(x=>tracks.some(track=>norm(track.name)===norm(x.name))),
  'a generated organization may not impersonate a 1999 track');
 assert.equal(new Set(world.ownerPrincipalPeople.map(x=>x.id)).size,1070);
 const ownersByTrack=new Map(),farmsByTrack=new Map();
 for(const owner of world.owners){
  const track=tracks.find(t=>t.id===owner.homeTrackId);
  assert.ok(track);
  assert.equal(owner.location.region,track.location.region);
  const person=world.ownerPrincipalPeople.find(p=>p.id===owner.principalId);
  assert.ok(person);
  assert.equal(person.organizationId,owner.id);
  assert.equal(person.name,owner.principalName);
  assert.equal(person.homeRegion,track.location.region);
  ownersByTrack.set(track.id,(ownersByTrack.get(track.id)||0)+1);
 }
 for(const farm of world.farms){
  const track=tracks.find(t=>t.id===farm.homeTrackId);
  assert.ok(track);
  assert.equal(farm.location.city,track.location.city);
  assert.equal(farm.location.region,track.location.region);
  farmsByTrack.set(track.id,(farmsByTrack.get(track.id)||0)+1);
 }
 assert.deepEqual([...ownersByTrack.values()],Array(107).fill(10));
 assert.deepEqual([...farmsByTrack.values()],Array(107).fill(4));
 assert.deepEqual(makeCircuitWorld(),world,
  'new V13 identities must be reproducible with the same world seed');
 assert.equal(assessFictionalOwnerCapacity({seed:SEED,horseCount:12000,
  owners:world.owners}).capacityShortfall,0);
});

test('every circuit owner/principal and employed farm manager survives real 12k world save/reopen',async()=>{
 const world=makeCircuitWorld(),store=memoryStore();
 const manifest=await createPersistent1999Industry({
  ...world,store,onProgress:()=>{},yieldControl:async()=>{}
 });
 assert.equal(manifest.status,'COMPLETE');
 assert.equal(manifest.horseCount,12000);
 assert.equal(manifest.ownerPrincipalCount,1070);
 assert.equal(manifest.personBatchesCommitted,Math.ceil(manifest.personCount/1000));
 const directory=await readPersistent1999Directory(store,manifest);
 const byId=new Map(directory.map(row=>[row.id,row]));
 assert.equal(new Set(directory.map(row=>row.id)).size,directory.length);
 const peopleByOwnerId=new Map();
 let managersVerified=0,farmsManaged=0;
 for(let i=0;i<1070;i++){
  const saved=byId.get(ownerId(i));
  assert.ok(saved&&saved.name);
  assert.equal(saved.principalId,ownerPrincipalPersonId(i));
  const person=await findPersistent1999Person(store,manifest,saved.principalId);
  assert.ok(person,'owner principal missing in saved person batches: '+saved.id);
  assert.equal(person.organizationId,saved.id);
  assert.equal(person.workplaceId,saved.id);
  assert.equal(person.name,saved.principalName);
  assert.equal(person.homeRegion,saved.location.region);
  assert.ok(saved.relationships.some(edge=>
   edge.type==='REPRESENTED_BY'&&edge.toId===person.id));
  assert.ok(person.relationships.some(edge=>
   edge.type==='PRINCIPAL_OF'&&edge.toId===saved.id));
  peopleByOwnerId.set(saved.id,person.name);
 }
 assert.equal(peopleByOwnerId.size,1070);
 for(const farm of world.farms){
  const saved=byId.get(farm.id);
  assert.ok(saved&&saved.name);
  assert.equal(saved.homeTrackId,farm.homeTrackId);
  assert.equal(saved.location.region,farm.location.region);
  if(!saved.managerIds?.length)continue;
  farmsManaged++;
  assert.equal(saved.managerIds.length,saved.managerNames.length);
  for(let i=0;i<saved.managerIds.length;i++){
   const manager=await findPersistent1999Person(
    store,manifest,saved.managerIds[i]);
   assert.ok(manager);
   assert.equal(manager.role,'farm_manager');
   assert.equal(manager.workplaceId,saved.id);
   assert.equal(manager.name,saved.managerNames[i]);
   assert.ok(saved.relationships.some(edge=>
    edge.type==='MANAGED_BY'&&edge.toId===manager.id));
   assert.ok(manager.relationships.some(edge=>
    edge.type==='MANAGES'&&edge.toId===saved.id));
   managersVerified++;
  }
 }
 assert.ok(farmsManaged>0&&managersVerified>0,
  'model must persist real farm managers, not placeholder name labels');
 const allTrackIds=new Set(world.tracks.map(t=>t.id));
 const seenWorkforceByTrack={trainer:new Set(),jockey:new Set()};
 const staffCount=sum(Object.values(manifest.staffing.counts));
 let staffSeen=0;
 for(let i=0;staffSeen<staffCount;i++){
  const batch=await readPersistent1999IndustryBatch(
   store,manifest,'personBatches',i);
  for(const person of batch.slice(0,staffCount-staffSeen)){
   if(seenWorkforceByTrack[person.role]&&
    allTrackIds.has(person.workplaceId)){
    assert.ok(person.name&&person.dateOfBirth);
    seenWorkforceByTrack[person.role].add(person.workplaceId);
   }
  }
  staffSeen+=Math.min(batch.length,staffCount-staffSeen);
 }
 for(const role of ['trainer','jockey'])
  assert.equal(seenWorkforceByTrack[role].size,107,
   'all 107 circuits require real named '+role+' workers');
 assert.equal((await verifyPersistent1999WorldOpen(store,manifest)).status,
  'OPEN_VERIFIED');
 const runId='V13FullCircuitNamedPeople';
 await savePersistent1999CareerRun(store,manifest,{
  runId,gameDate:'1999-01-02',
  player:{ownerId:world.owners[0].id},changes:{}});
 const reopened=await reopenPersistent1999Industry(store,{
  seed:SEED,worldId:WORLD_ID});
 assert.equal(reopened.status,'READY');
 assert.equal((await loadPersistent1999CareerRun(
  store,reopened.manifest,runId)).gameDate,'1999-01-02');
 const reloadedDirectory=await readPersistent1999Directory(store,reopened.manifest);
 assert.deepEqual(reloadedDirectory.map(row=>[row.id,row.name,
  row.principalId??null,row.managerIds??null]),
  directory.map(row=>[row.id,row.name,
   row.principalId??null,row.managerIds??null]),
  'every owner, stud, farm and barn retains its name and leader ID');
 for(let i=0;i<1070;i++){
  const id=ownerPrincipalPersonId(i);
  const p=await findPersistent1999Person(store,reopened.manifest,id);
  assert.equal(p.name,peopleByOwnerId.get(p.organizationId),
   'every saved principal name and legal organization must survive day advance');
 }
});
