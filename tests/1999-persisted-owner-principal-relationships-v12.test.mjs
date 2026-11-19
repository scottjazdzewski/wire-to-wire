import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999} from '../public/next/1999-track-program.mjs';
import {create1999DestinationNamingMarkets}
 from '../public/1999/engine/fictional-directory-destination-names-1999.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {materialize1999OwnerPrincipalPeople,ownerPrincipalPersonId,
 validate1999OwnerPrincipalLinks,OWNER_PRINCIPAL_PERSONNEL_1999_MODEL}
 from '../public/1999/engine/fictional-owner-principal-personnel-v12.mjs';
import {fictionalOwnerPortfolioTier,assessFictionalOwnerCapacity}
 from '../public/1999/engine/fictional-owner-portfolio-planner.mjs';
import {createPersistent1999Industry,readPersistent1999Directory,
 readPersistent1999IndustryBatch,findPersistent1999Person,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 reopenPersistent1999Industry,verifyPersistent1999WorldOpen}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';

function memoryStore(){
 const stores={};
 for(const name of ['manifests','horseBatches','personBatches','horseEdits',
  'careerRuns','directory','coveringBatches','calendarBatches','industryLifecycle'])
  stores[name]=new Map();
 const clone=x=>structuredClone(x);
 return {
  get:async(kind,key)=>stores[kind].get(key),
  commitDirectory:async(key,manifest,records)=>{
   stores.directory.set(key,clone(records));
   stores.manifests.set(key,clone(manifest));
  },
  commitBatch:async({worldId,manifest,kind,index,records})=>{
   stores[kind].set(worldId+':'+index,clone(records));
   stores.manifests.set(worldId,clone(manifest));
  },
  commitManifest:async(key,manifest)=>stores.manifests.set(key,clone(manifest)),
  commitLifecycleRun:async({worldKey,runId,record,checkpoint,
   horseUpdates=[],eventWrites=[],dataWrites=[]})=>{
   stores.careerRuns.set(worldKey+':'+runId,clone(record));
   const key=worldKey+':'+runId;
   stores.industryLifecycle.set(key+':checkpoint',clone(checkpoint));
   for(const x of horseUpdates)
    stores.industryLifecycle.set(key+':horse:'+x.id,clone(x));
   for(const x of [...eventWrites,...dataWrites])
    stores.industryLifecycle.set(x.key,clone(x.value));
  }
 };
}
const geo=JSON.parse(readFileSync(
 new URL('../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const byId=new Map(geo.tracks.map(x=>[x.id,x]));
const tracks=['T-0001','T-0013'].map(id=>{
 const t=TRACK_PROGRAM_1999[id],g=byId.get(id);
 assert.ok(t&&g);
 return {id,name:t.name,
  location:{city:g.city_locality,region:g.state_province_region,
   country:g.country}};
});
function fixture(horseCount=12000){
 const seed=19990101;
 const ownerIdAt=i=>'O-FICTIONAL-OWNER-'+String(i+1).padStart(6,'0');
 let n=Math.ceil(horseCount/18);
 let capacity=assessFictionalOwnerCapacity({
  seed,horseCount,owners:Array.from({length:n},(_,i)=>({id:ownerIdAt(i)}))});
 while(capacity.capacityShortfall&&n<29000){
  n=Math.min(29000,n+Math.max(128,Math.ceil(n*.03)));
  capacity=assessFictionalOwnerCapacity({
   seed,horseCount,owners:Array.from({length:n},(_,i)=>({id:ownerIdAt(i)}))});
 }
 assert.equal(capacity.capacityShortfall,0);
 const split=[Math.ceil(n/2),Math.floor(n/2)];
 const destination=create1999DestinationNamingMarkets({
  tracks,ownerCountByTrack:split,farmsPerTrack:4});
 const source=createFictionalWorldNameEngine({
  worldId:'WTW1999OwnerPersonnelV12',seed,year:1999,
  roles:{},owners:n,facilities:{generalFarms:8},
  markets:destination.markets,
  destinationMarketIds:{
   owners:destination.ownerMarketIds,farms:destination.farmMarketIds},
  protectedNames:tracks.map(x=>x.name),
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS_SCALABLE_V11'});
 const owners=source.owners.map((o,i)=>{
  const track=tracks[i<split[0]?0:1];
  return {id:ownerIdAt(i),name:o.name,location:track.location,
   homeTrackId:track.id,
   portfolioTier:fictionalOwnerPortfolioTier(seed,ownerIdAt(i)),
   portfolioModel:'WTW_FICTIONAL_OWNER_PORTFOLIOS_V10',
   namingSourceId:o.id,destinationNamingModel:destination.schema,
   principalId:ownerPrincipalPersonId(i),principalName:o.principalName};
 });
 const farms=tracks.flatMap((track,j)=>Array.from({length:4},(_,i)=>({
  id:'O-FICTIONAL-FARM-'+track.id+'-'+String(i+1).padStart(2,'0'),
  name:source.farms[j*4+i].name,homeTrackId:track.id,
  location:track.location,operatingRoles:['BREEDER','FOALING_FARM',
   'BOARDING_FACILITY'],destinationNamingModel:destination.schema
 })));
 const ownerPrincipalPeople=materialize1999OwnerPrincipalPeople({
  seed,owners,sourceOwners:source.owners,sourcePeople:source.people});
 return {seed,worldId:'WTW1999OwnerPerson-NAMES-V13-TEST',
  targetOpeningHorses:horseCount,tracks,owners,farms,ownerPrincipalPeople,
  batchSize:1000};
}

test('new-world owner principal is real named person with valid reciprocal owner ID',()=>{
 const params=fixture();
 const people=params.ownerPrincipalPeople;
 assert.equal(people.length,params.owners.length);
 assert.ok(validate1999OwnerPrincipalLinks(params.owners,people));
 assert.equal(new Set(people.map(p=>p.id)).size,people.length);
 assert.ok(people.every(p=>p.name&&p.role==='owner_principal'&&
  p.dateOfBirth&&p.birthplace.city&&p.birthCountryCode&&p.homeRegion&&
  p.personnelModel===OWNER_PRINCIPAL_PERSONNEL_1999_MODEL));
 assert.deepEqual(people,fixture().ownerPrincipalPeople,
  'same new-world identities and biography must be deterministic');
 assert.throws(()=>materialize1999OwnerPrincipalPeople({...params,
  sourceOwners:[]}),/Invalid versioned owner principal/);
 assert.equal(validate1999OwnerPrincipalLinks(params.owners,
  people.slice(1)),false);
});

test('real 12k career saves, reopens and finds owner principals with official person IDs',async()=>{
 const params=fixture(),store=memoryStore();
 const manifest=await createPersistent1999Industry({
  ...params,store,onProgress:()=>{},yieldControl:async()=>{}
 });
 assert.equal(manifest.status,'COMPLETE');
 assert.equal(manifest.horseCount,12000);
 assert.equal(manifest.ownerPrincipalCount,params.ownerPrincipalPeople.length);
 assert.equal(manifest.ownerPrincipalModel,OWNER_PRINCIPAL_PERSONNEL_1999_MODEL);
 assert.equal(manifest.personCount,Object.values(manifest.staffing.counts)
  .reduce((n,x)=>n+x,0)+manifest.ownerPrincipalCount);
 assert.equal(manifest.personBatchesCommitted,
  Math.ceil(manifest.personCount/manifest.batchSize));
 const directory=await readPersistent1999Directory(store,manifest);
 const byOwner=new Map(directory.map(x=>[x.id,x]));
 for(const ordinal of [0,Math.floor(params.ownerPrincipalPeople.length/2),
  params.ownerPrincipalPeople.length-1]){
  const id=ownerPrincipalPersonId(ordinal);
  const person=await findPersistent1999Person(store,manifest,id);
  assert.ok(person&&person.name&&person.dateOfBirth);
  const owner=byOwner.get(person.organizationId);
  assert.equal(owner.principalId,person.id);
  assert.equal(owner.principalName,person.name);
  assert.ok(owner.relationships.some(e=>e.type==='REPRESENTED_BY'&&e.toId===id));
  assert.ok(person.relationships.some(e=>e.type==='PRINCIPAL_OF'&&
   e.toId===owner.id));
 }
 const firstBatch=await readPersistent1999IndustryBatch(
  store,manifest,'personBatches',0);
 assert.ok(firstBatch.every(p=>p.role!=='owner_principal'),
  'the existing workforce remains ordered before the added principals');
 const verification=await verifyPersistent1999WorldOpen(store,manifest);
 assert.equal(verification.status,'OPEN_VERIFIED');
 const runId='V12OwnerPrincipalReplay';
 const player={ownerId:params.owners[0].id};
 const saved=await savePersistent1999CareerRun(store,manifest,{
  runId,gameDate:'1999-01-02',player,changes:{}});
 assert.equal(saved.gameDate,'1999-01-02');
 const reopened=await reopenPersistent1999Industry(store,{
  seed:params.seed,worldId:params.worldId});
 assert.equal(reopened.status,'READY');
 const career=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.equal(career.gameDate,'1999-01-02');
 assert.equal(career.player.ownerId,player.ownerId);
 const sourceName=params.ownerPrincipalPeople.at(-1).name;
 const last=await findPersistent1999Person(store,reopened.manifest,
  ownerPrincipalPersonId(params.ownerPrincipalPeople.length-1));
 assert.equal(last.name,sourceName,'career progression and reopen cannot rename owner principal');
});
