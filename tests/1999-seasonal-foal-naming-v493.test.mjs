import test from 'node:test';
import assert from 'node:assert/strict';
import {
 commitPersistent1999CareerFoalName,readPersistent1999LifecycleHorse,
 readPersistent1999HorseProfile,loadPersistent1999CareerRun,
 PERSISTENT_INDUSTRY_SCHEMA
} from '../public/1999/engine/fictional-industry-persistence-1999.mjs';

const seed=19990101,worldId='WTW1999FullIndustry-COHORTS-V6-OWNER-V10-TEST';
const runId='WTW-RUN-V493-OWNER-01',playerId='O-000061';
const foalId=n=>'H-FICTIONAL-1999-FOALS-2000-'+String(n).padStart(7,'0');
const story='During a spring thunderstorm the mare delivered her foal while rain struck the stable roof and the owner watched the first steps.';
const sourceFoal=(n,ownerId=playerId,dateOfBirth='2000-03-10')=>({
 id:foalId(n),name:null,namingStatus:'UNNAMED_PERMANENT_ID',namingRevision:null,
 status:'FOAL',foalYear:2000,dateOfBirth,
 sireId:'H-SIRE-1',damId:'H-DAM-1',ownerId,breederId:ownerId,
 foalingFarmId:'O-FOALING-FARM',careFacilityId:'O-FOALING-FARM',
 registryProvenance:'MODELED_SEASONAL_BIRTH',
 birthplace:{farmId:'O-FOALING-FARM',city:'Versailles',region:'Kentucky',country:'USA'}
});
function fixture(){
 const manifest={schema:PERSISTENT_INDUSTRY_SCHEMA,status:'COMPLETE',worldId,seed,
  horseCount:1,batchSize:1000,horseBatchesCommitted:1};
 const worldKey=worldId+':'+seed,runKey=worldKey+':'+runId;
 const checkpoint={seasonYear:2000,lastDate:'2000-03-12',runId};
 const record={schema:'WTW_INDUSTRY_CAREER_RUN_V1',worldId,worldSeed:seed,
  worldSchema:manifest.schema,runId,gameDate:'2000-03-12',
  player:{role:'owner',operation_id:playerId},version:3,
  lifecycle:structuredClone(checkpoint),
  changes:{canonicalRun:{runtime:{registered_horses:{by_id:{}}}}}};
 const foals=[sourceFoal(1),sourceFoal(2),sourceFoal(3,'O-RIVAL')];
 const maps={
  manifests:new Map([[worldKey,manifest]]),
  careerRuns:new Map([[runKey,structuredClone(record)]]),
  industryLifecycle:new Map([[runKey+':checkpoint',structuredClone(checkpoint)],
   ...foals.map(h=>[runKey+':horse:'+h.id,{id:h.id,kind:'BORN',horse:structuredClone(h)}])]),
  horseBatches:new Map([[worldKey+':0',[{
   id:'H-FICTIONAL-1999-BROODMARES-0000001',
   name:'Opening Winner',ownerId:playerId}]]]),
  horseEdits:new Map()
 };
 let writes=0,openingBatchReads=0;
 const store={
  get:async(kind,key)=>{
   if(kind==='horseBatches')openingBatchReads++;
   return structuredClone(maps[kind].get(key));
  },
  commitLifecycleFoalNaming:async({worldKey:w,runId:r,horseId,ownerId,name,
   expectedVersion,record:updated})=>{
   const rk=w+':'+r;
   const prior=maps.careerRuns.get(rk),entry=maps.industryLifecycle.get(rk+':horse:'+horseId);
   if(w!==worldKey||r!==runId||prior?.version!==expectedVersion||
    prior.gameDate!==updated.gameDate||prior.player.operation_id!==ownerId)
    throw Error('Stale owner career or invalid version');
   const effective=entry?.horse?{...entry.horse,...(entry.patch||{})}:null;
   if(entry?.kind!=='BORN'||effective?.ownerId!==ownerId||
    effective.name||effective.status==='DECEASED'||
    effective.dateOfBirth>prior.gameDate||
    updated.version!==expectedVersion+1)
    throw Error('Invalid actual saved birth');
   // Apply both writes only after ALL guards pass, modeling one IDB tx.
   maps.industryLifecycle.set(rk+':horse:'+horseId,{
    ...entry,horse:{...entry.horse,name,
     namingStatus:'PLAYER_NAMED_PENDING_REGISTRAR',
     namingRevision:'WTW_SAVED_CAREER_FOAL_NAME_V1'}});
   maps.careerRuns.set(rk,structuredClone(updated));writes++;
   return {horseId,name,version:updated.version};
  }
 };
 return {manifest,store,maps,runKey,foals,writes:()=>writes,
  openingBatchReads:()=>openingBatchReads};
}
test('V493 commits an actual born horse ID and naming decision in one saved career',async()=>{
 const {store,manifest,foals,maps,runKey,writes}=fixture();
 const before=structuredClone(foals[0]);
 const reply=await commitPersistent1999CareerFoalName(store,manifest,runId,{
  horseId:foals[0].id,name:'Silver Morning',story,motifId:'storm'
 });
 assert.equal(reply.externalRegistrationApproved,false);
 assert.equal(reply.ownerStoryPersisted,true);
 assert.equal(reply.namingStatus,'PLAYER_NAMED_PENDING_REGISTRAR');
 assert.equal(writes(),1);
 const actual=await readPersistent1999LifecycleHorse(store,manifest,runId,foals[0].id);
 assert.equal(actual.name,'Silver Morning');
 assert.equal(actual.namingStatus,'PLAYER_NAMED_PENDING_REGISTRAR');
 for(const field of ['id','ownerId','sireId','damId','foalingFarmId','dateOfBirth'])
  assert.deepEqual(actual[field],before[field],'foal identity changed at '+field);
 assert.equal((await readPersistent1999HorseProfile(store,manifest,
  foals[0].id,{runId})).name,'Silver Morning');
 assert.equal(maps.horseBatches.get(worldId+':'+seed+':0')[0].name,'Opening Winner');
 const saved=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.equal(saved.version,4);
 assert.equal(saved.changes.namingFeedback.decisions.silvermorning.horseId,foals[0].id);
 assert.equal(saved.changes.namedSeasonalFoals[foals[0].id].name,'Silver Morning');
 assert.equal(saved.changes.namingOriginStories[foals[0].id].story,story);
 assert.equal(maps.careerRuns.get(runKey).version,4);
 await assert.rejects(commitPersistent1999CareerFoalName(store,manifest,runId,{
  horseId:foals[0].id,name:'Another Story',story
 }),/not born, unnamed/);
 assert.equal(writes(),1,'reassignment must not write');
});
test('V493 rejects rival, unborn, foreign, duplicate and owner-reviewed names',async()=>{
 const {store,manifest,foals,writes}=fixture();
 const pick=(horseId,name)=>commitPersistent1999CareerFoalName(store,manifest,runId,{
  horseId,name,story,motifId:'storm'
 });
 await assert.rejects(pick(foals[2].id,'Cannot Take Me'),/not born, unnamed/);
 await assert.rejects(pick(foalId(9000),'Not Born Yet'),/not born, unnamed/);
 await assert.rejects(pick(foals[1].id,'Opening-Winner'),/already used by a 1999 opening horse/);
 await assert.rejects(pick(foals[1].id,'Another Epilogue'),/Previously rejected/);
 await assert.rejects(pick(foals[1].id,'Bad Name This Is Too Long'),/Valid saved foal/);
 await assert.rejects(commitPersistent1999CareerFoalName(store,manifest,'WRONG-RUN',{
  horseId:foals[0].id,name:'Only My Career',story
 }),/real saved owner career/);
 assert.equal(writes(),0);
 await pick(foals[0].id,'Two Bells');
 await assert.rejects(pick(foals[1].id,'Two-Bells'),
  /Name already used by an earlier born foal/);
 assert.equal(writes(),1);
});
test('V493 existing MY FOALS screen submits real saved horse and story through single career store',async()=>{
 const {readFile}=await import('node:fs/promises');
 const manager=await readFile(new URL('../public/next/1999-commercial-career-manager.mjs',
  import.meta.url),'utf8');
 const engine=await readFile(new URL('../public/1999/engine/fictional-industry-persistence-1999.mjs',
  import.meta.url),'utf8');
 assert.match(manager,/const nameable=born.items.filter/);
 assert.match(manager,/h.ownerId===career.run.player.operation_id&&!h.name/);
 assert.match(manager,/data-cc-action="name-born-foal"/);
 assert.match(manager,/data-cc="industry-foal-year"/);
 assert.match(manager,/industryFoalYear=Number\(event.target.value\)/);
 assert.match(manager,/Math.max\(1999,Math.min\(currentYear,industryFoalYear\)\)/);
 assert.match(manager,/commitPersistent1999CareerFoalName\(db,/);
 assert.match(manager,/await browseFullIndustry\(industryBrowsePage,industryBrowseKind\)/);
 assert.match(engine,/db.transaction\(\['manifests','careerRuns','industryLifecycle'\],'readwrite'\)/);
 assert.match(engine,/tx.onabort=.*reject\(failure/);
});
test('V493 foal name and lineage survive aging into a saved future season',async()=>{
 const {store,manifest,foals,maps,runKey}=fixture();
 await commitPersistent1999CareerFoalName(store,manifest,runId,{
  horseId:foals[0].id,name:'Silver Morning',story,motifId:'storm'
 });
 const newCheckpoint={...maps.industryLifecycle.get(runKey+':checkpoint'),
  lastDate:'2001-01-10',seasonYear:2001};
 maps.industryLifecycle.set(runKey+':checkpoint',newCheckpoint);
 const saved=maps.careerRuns.get(runKey);
 maps.careerRuns.set(runKey,{...saved,gameDate:'2001-01-10',
  lifecycle:structuredClone(newCheckpoint)});
 const a=await readPersistent1999LifecycleHorse(store,manifest,runId,foals[0].id);
 assert.equal(a.status,'YEARLING');
 assert.equal(a.name,'Silver Morning');
 assert.equal(a.namingRevision,'WTW_SAVED_CAREER_FOAL_NAME_V1');
 assert.equal(a.sireId,foals[0].sireId);
 assert.equal(a.damId,foals[0].damId);
 assert.equal(a.ownerId,foals[0].ownerId);
 const reopened=await loadPersistent1999CareerRun(store,manifest,runId);
 assert.equal(reopened.changes.namedSeasonalFoals[foals[0].id].name,'Silver Morning');
 assert.equal(await readPersistent1999LifecycleHorse(store,manifest,
  'DIFFERENT-CAREER',foals[0].id),null);
});

test('V493 reuses one immutable 300k name registry across multiple real foal saves',async()=>{
 const {store,manifest,foals,writes,openingBatchReads}=fixture();
 const select=(id,name)=>commitPersistent1999CareerFoalName(
  store,manifest,runId,{horseId:id,name,story,motifId:'storm'});
 await select(foals[0].id,'First Lark');
 assert.equal(openingBatchReads(),1,'initial request loads one source batch');
 await select(foals[1].id,'Second Lark');
 assert.equal(openingBatchReads(),1,'do not decompress 300k source names per new foal');
 assert.equal(writes(),2);
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,
  runId,foals[0].id)).name,'First Lark');
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,
  runId,foals[1].id)).name,'Second Lark');
});

test('V493 refuses stale patched ownership at the atomic commit boundary',async()=>{
 const {store,foals,maps,runKey,writes}=fixture();
 const prior=maps.careerRuns.get(runKey);
 const key=runKey+':horse:'+foals[0].id;
 maps.industryLifecycle.set(key,{
  ...maps.industryLifecycle.get(key),patch:{ownerId:'O-NEW-OWNER'}
 });
 await assert.rejects(store.commitLifecycleFoalNaming({
  worldKey:worldId+':'+seed,runId,horseId:foals[0].id,
  ownerId:playerId,name:'Not My Foal',
  expectedVersion:prior.version,record:{...prior,version:prior.version+1}
 }),/Invalid actual saved birth/);
 assert.equal(writes(),0);
 assert.equal(maps.industryLifecycle.get(key).horse.name,null);
 const engine=(await import('node:fs/promises')).readFile;
 const source=await engine(new URL('../public/1999/engine/fictional-industry-persistence-1999.mjs',
  import.meta.url),'utf8');
 assert.match(source,/const effective=horse\?\{\.\.\.horse,\.\.\.\(state.patch\|\|\{\}\)\}/);
});

test('V493 optimistic version prevents atomic foal name overwrite',async()=>{
 const {store,manifest,foals,writes}=fixture();
 const prior=await loadPersistent1999CareerRun(store,manifest,runId);
 await commitPersistent1999CareerFoalName(store,manifest,runId,{
  horseId:foals[0].id,name:'One Clear Note',story
 });
 await assert.rejects(store.commitLifecycleFoalNaming({
  worldKey:worldId+':'+seed,runId,horseId:foals[1].id,
  ownerId:playerId,name:'Late Writer',expectedVersion:prior.version,
  record:{...prior,version:prior.version+1}
 }),/Stale owner career/);
 assert.equal((await readPersistent1999LifecycleHorse(store,manifest,
  runId,foals[1].id)).name,null);
 assert.equal(writes(),1);
});
