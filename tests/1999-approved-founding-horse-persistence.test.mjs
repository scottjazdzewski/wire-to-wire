import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPersistent1999Industry,findPersistent1999Horse,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 readPersistent1999LifecycleHorse}
 from '../public/1999/engine/fictional-industry-persistence-1999.mjs';
import {openPersistent1999GameCareer}
 from '../public/1999/engine/fictional-industry-game-world-bridge-1999.mjs';

function store(){
 const data=Object.fromEntries(['manifests','horseBatches','personBatches',
  'horseEdits','careerRuns','directory','coveringBatches','calendarBatches',
  'industryLifecycle'].map(x=>[x,new Map()]));
 return {get:async(s,k)=>data[s].get(k),
  commitDirectory:async(id,m,r)=>{data.directory.set(id,structuredClone(r));data.manifests.set(id,structuredClone(m))},
  commitBatch:async({worldId,manifest,kind,index,records})=>{data[kind].set(worldId+':'+index,structuredClone(records));data.manifests.set(worldId,structuredClone(manifest))},
  commitManifest:async(id,m)=>data.manifests.set(id,structuredClone(m)),
  commitLifecycleRun:async({worldKey,runId,record,checkpoint,horseUpdates=[],eventWrites=[],dataWrites=[]})=>{
   const key=worldKey+':'+runId;data.careerRuns.set(key,structuredClone(record));
   data.industryLifecycle.set(key+':checkpoint',structuredClone(checkpoint));
   for(const h of horseUpdates)data.industryLifecycle.set(key+':horse:'+h.id,structuredClone(h));
   for(const w of [...eventWrites,...dataWrites])data.industryLifecycle.set(w.key,structuredClone(w.value));
  }};
}

test('all 73 approved founding breeding horses keep permanent IDs inside the playable 10k world',async()=>{
 const founding=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url)));
 const organizations=founding.organizations||[],orgById=new Map(organizations.map(o=>[o.id,o]));
 const foundingHorses=founding.horses.map(h=>{
  const resident=h.standingFarm1999||h.boardingFarm1999;
  const facilityId=resident?.farmOrganizationId||h.farmOrganizationId;
  assert.ok(orgById.has(facilityId),h.id+' must retain its approved physical resident');
  return {id:h.id,name:h.name,status:h._role==='stallion'?'STALLION':'BROODMARE',
   cohort:h._role,sex:h.sex||(h._role==='broodmare'?'MARE':'HORSE'),
   foalYear:h.foalYear,ownerId:null,breederId:facilityId,foalingFarmId:facilityId,
   careFacilityId:facilityId,managementOrganizationId:facilityId,
   sourcePedigree:{sireId:h.sireId||null,damId:h.damId||null},
   sourceRecord:h};
 });
 const facilityIds=[...new Set(foundingHorses.map(h=>h.careFacilityId))];
 const farms=facilityIds.map(id=>({id,name:orgById.get(id).name,
  location:{city:'Lexington',region:'Kentucky',country:'USA'},homeTrackId:'T-0001',
  operatingRoles:['BREEDER','FOALING_FARM','BOARDING_FACILITY','TRAINING_BARN']}));
 const owners=[...new Set([...facilityIds,'O-PRIVATE-1999-01'])].map(id=>({id,
  name:orgById.get(id)?.name||'Private Owner',maxHorses:10000,homeTrackId:'T-0001'}));
 const track={id:'T-0001',name:'Keeneland',location:{city:'Lexington',region:'Kentucky',country:'USA'}};
 const storage=store(),manifest=await createPersistent1999Industry({store:storage,
  seed:19991117,worldId:'ApprovedFounding73InOneWorld',targetOpeningHorses:10000,
  farms,tracks:[track],owners,foundingHorses,batchSize:1000});
 assert.equal(manifest.horseCount,10000);
 assert.equal(manifest.generatedHorseCount+manifest.foundingHorseCount,10000);
 const career=await openPersistent1999GameCareer(storage,manifest,{
  runId:'WTW-RUN-KingsmereFoundingResidents',operationId:'O-000061'});
 const kingsmereSource=foundingHorses.filter(h=>h.managementOrganizationId==='O-000061');
 assert.equal(kingsmereSource.length,5);
 assert.ok(kingsmereSource.every(h=>career.run.stable_horse_ids.includes(h.id)));
 for(const source of foundingHorses){
  const stored=await findPersistent1999Horse(storage,manifest,source.id);
  assert.equal(stored.id,source.id);assert.equal(stored.name,source.name);
  assert.equal(stored.foundingSource.id,source.id);
 }
 const saved=await savePersistent1999CareerRun(storage,manifest,{runId:career.run.run_id,
  gameDate:'1999-01-02',player:career.run.player,changes:{canonicalRun:career.run},version:3});
 const reopened=await loadPersistent1999CareerRun(storage,manifest,career.run.run_id);
 assert.equal(reopened.changes.canonicalRun.stable_horse_ids.length,
  career.operationInventoryCount);
 assert.equal(saved.lifecycle.activeBroodmares,
  manifest.plan.counts.broodmares+55);
 const later=await savePersistent1999CareerRun(storage,manifest,{runId:career.run.run_id,
  gameDate:'2005-01-02',player:career.run.player,changes:{canonicalRun:career.run},version:4});
 assert.ok(later.lifecycle.population>manifest.horseCount,
  'approved resident bloodstock must participate in the saved multi-year industry lifecycle');
 for(const source of foundingHorses){
  const live=await readPersistent1999LifecycleHorse(storage,manifest,
   career.run.run_id,source.id);
  assert.equal(live.id,source.id);
  assert.ok(['BROODMARE','STALLION','RETIRED_BROODMARE','RETIRED_STALLION'].includes(live.status));
 }
});
