/**
 * Wire to Wire — commercial local-first career manager.
 *
 * No cloud account or paid storage is required. IndexedDB stores the generated
 * world batches and separate career run deltas. Existing localStorage saves are
 * not changed. Compact careers support portable .wtwsave files.
 */
import {encodeCareerSave,decodeCareerSave,packCareerFile,unpackCareerFile}
 from '/1999/engine/compact-career.mjs';
import {open1999IndustryDatabase,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 verifyPersistent1999WorldOpen,reopenPersistent1999Industry}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {readPersistent1999HorseProfile,readPersistent1999IndustryBatch,
 readPersistent1999Directory,findPersistent1999Person}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {openPersistent1999GameCareer,digestPersistent1999GameSnapshot}
 from '/1999/engine/fictional-industry-game-world-bridge-1999.mjs';
import {restoreLegacyApprovedFoundingHorseRelationships}
 from '/1999/engine/fictional-industry-founder-relations-1999.mjs';
import {dispatchGameCommand} from '/1999/game/kernel.js';
import {gameRaceProgram,supported1999RaceClass,raceEligibility}
 from '/1999/game/racing-1999.js';
import {validateGameRun} from '/1999/game/state.js';
import {packShared1999Career,unpackShared1999Career,sameShared1999WorldIdentity,
 migrateShared1999CareerRunWorldReference,migrateShared1999CareerOperationInventory}
 from '/1999/engine/shared-1999-career-package.mjs?rev=wtw-shared-career-operation-inventory-v3';
import {projectCanonical1999RaceRows,renderCanonical1999RaceFile}
 from '/next/1999-canonical-career-race-files.mjs';
import {createPersistedIndustryHorseDirectory,createPersistedIndustryEntityDirectory}
 from '/next/1999-persisted-world-directory.mjs';
import {createCareerWorldEdits,addCareerWorldEdit,applyCareerWorldEdits}
 from '/next/1999-career-world-edits.mjs';
import {buildWorldEditReviewExport}
 from '/next/1999-world-edit-review-export.mjs';

const DB_NAME='WireToWireClean1999CareersV2';
const MAX_SLOTS=60,MAX_TOTAL_BYTES=512*1024*1024;
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const fmt=n=>Number(n||0).toLocaleString('en-US');
const kb=n=>n<1024?fmt(n)+' B':n<1024*1024?(n/1024).toFixed(1)+' KB':
 (n/(1024*1024)).toFixed(2)+' MB';
const req=request=>new Promise((resolve,reject)=>{
 request.onsuccess=()=>resolve(request.result);
 request.onerror=()=>reject(request.error||Error('IndexedDB read failed'));
});
let dbPromise=null;
function openDB(){
 if(dbPromise)return dbPromise;
 if(!('indexedDB' in window))return Promise.reject(Error(
  'This browser does not support the local career database'));
 dbPromise=new Promise((resolve,reject)=>{
  const request=indexedDB.open(DB_NAME,1);
  request.onupgradeneeded=()=>{
   const db=request.result;
   if(!db.objectStoreNames.contains('slots'))db.createObjectStore('slots',{keyPath:'id'});
   if(!db.objectStoreNames.contains('payloads'))db.createObjectStore('payloads',{keyPath:'id'});
  };
  request.onerror=()=>reject(request.error||Error('Cannot open career storage'));
  request.onsuccess=()=>resolve(request.result);
 }).catch(error=>{dbPromise=null;throw error});
 return dbPromise;
}
async function listSlots(){
 const db=await openDB(),tx=db.transaction('slots','readonly');
 const slots=await req(tx.objectStore('slots').getAll());
 return slots.sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
}
async function findSlot(id){
 const db=await openDB(),tx=db.transaction(['slots','payloads'],'readonly');
 const meta=await req(tx.objectStore('slots').get(id));
 const data=await req(tx.objectStore('payloads').get(id));
 if(!meta||!data)throw Error('Saved career is unavailable or incomplete');
 return {meta,...data};
}
async function writeSlot(meta,record){
 const db=await openDB();
 // Atomic: never report success if payload or metadata failed to persist.
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['slots','payloads'],'readwrite');
  tx.oncomplete=()=>resolve();
  tx.onabort=()=>reject(tx.error||Error('Career save was rolled back'));
  tx.onerror=()=>reject(tx.error||Error('Failed to write career save'));
  tx.objectStore('slots').put(meta);
  tx.objectStore('payloads').put({id:meta.id,header:record.header,bytes:record.bytes});
 });
}
async function removeSlot(id){
 const db=await openDB();
 await new Promise((resolve,reject)=>{
  const tx=db.transaction(['slots','payloads'],'readwrite');
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('Could not delete career'));
  tx.objectStore('slots').delete(id);
  tx.objectStore('payloads').delete(id);
 });
}
function config(){
 const api=window.WTW1999CommercialConfig;
 if(!api)throw Error('Commercial world configuration is not loaded');
 return api;
}
function profileForGame(game){
 const a=game.worldAnchor||{};
 return config().normalize({
  seed:a.worldProfile?.seed??a.seed??19990101,
  mode:a.worldProfile?.mode??a.mode??'FOUNDING_1999',
  population:a.worldProfile?.population??a.population??config().current().population
 });
}
function baselineFor(profile){
 const create=window.__WTW_1999_MANAGEMENT__?.createFreshState;
 if(typeof create!=='function')throw Error('Game-state authority not available');
 return create(profile);
}
function captureCurrent(){
 return window.__WTW_OFFICE_COMMANDS__.dispatch('SAVE_CURRENT');
}
function nextID(){
 return 'career-'+(globalThis.crypto?.randomUUID?.()||
  Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12));
}
async function storeGame(name,game,{id=null}={}){
 const current=await listSlots();
 if(!id&&current.length>=MAX_SLOTS)
  throw Error('60 career slots is the maximum. Export or delete an older slot');
 const profile=profileForGame(game);
 const baseline=baselineFor(profile);
 const record=await encodeCareerSave(game,baseline,profile);
 const old=id?current.find(s=>s.id===id):null;
 const otherBytes=current.reduce((sum,slot)=>sum+(slot.id===id?0:Number(slot.bytes||0)),0);
 if(otherBytes+record.bytes.byteLength>MAX_TOTAL_BYTES)
  throw Error('Local careers would exceed the 512 MB safety budget. Export and delete old slots');
 const date=new Date().toISOString();
 const meta={id:id||nextID(),name:String(name||'1999 Career').trim().slice(0,80),
  createdAt:old?.createdAt||date,updatedAt:date,date:game.date,
  profile,bytes:record.bytes.byteLength,
  rawBytes:record.header.rawSize,encoding:record.header.encoding};
 await writeSlot(meta,record);
 return meta;
}
async function restoreGame(id){
 const record=await findSlot(id),profile=config().normalize(record.meta.profile);
 const game=await decodeCareerSave(record,baselineFor(profile));
 if(game.worldAnchor.seed!==profile.seed||game.worldAnchor.mode!==profile.mode)
  throw Error('Save and world profile disagree');
 window.__WTW_OFFICE_COMMANDS__.dispatch('LOAD_CAREER',game);
 location.reload();
}
async function exportSlot(id){
 const record=await findSlot(id);
 const bytes=packCareerFile(record);
 const blob=new Blob([bytes],{type:'application/octet-stream'});
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;
 link.download='WTW_'+record.meta.name.replace(/[^a-z0-9_-]+/gi,'_').slice(0,45)+
  '_'+record.meta.date+'.wtwsave';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
}
async function importFile(file){
 if(!file)throw Error('Choose a career save file');
 if(file.size>64*1024*1024+32780)
  throw Error('This save is larger than the supported 64 MB file limit');
 let game;
 if(/\.json$/i.test(file.name)){
  game=JSON.parse(await file.text());
 }else{
  const data=unpackCareerFile(await file.arrayBuffer());
  const profile=config().normalize(data.header.world);
  game=await decodeCareerSave(data,baselineFor(profile));
 }
 if(!window.__WTW_1999_MANAGEMENT__?.validateCareer(game))
  throw Error('Only a valid founding 1999 career can be imported.');
 return storeGame(file.name.replace(/\.(wtwsave|json)$/i,'').replace(/_/g,' ').slice(0,80),
  game);
}
function modal(){
 let root=$('wtwCommercialCareerModal');
 if(!root){
  root=document.createElement('div');root.id='wtwCommercialCareerModal';
  root.className='wtw-cc-backdrop';root.hidden=true;
  document.body.appendChild(root);
  root.addEventListener('click',handleClick);
  root.addEventListener('change',handleChange);
 }
 return root;
}
let fullIndustryManifest=null;
let activeWorldCareer=null;
/** Working-career changes apply only after a durable IndexedDB read-back. */
function hydrateCareerWorldEdits(career,record){
 const edits=record?.changes?.worldEdits??createCareerWorldEdits();
 applyCareerWorldEdits(career.world,edits,{run:career.run});
 career.worldEdits=edits;
 career.editVersion=0;
 return career;
}
async function editSavedWorldEntity({kind,id,patch}={}){
 const career=activeWorldCareer;
 if(!career?.run||!career.manifest||
   !/^WTW1999FullIndustry-COHORTS-V6-OWNER-V10-/.test(career.manifest.worldId))
  throw Error('Open the playable V10 industry career before editing its records');
 if(career.run.run_id===canonicalRunId(career.manifest))
  throw Error('The frozen shared baseline cannot be edited. Start or open an actual operation career first.');
 const edits=addCareerWorldEdit(career.worldEdits,career.world,kind,id,patch,
  {run:career.run});
 // Keep the player gameplay run intact. Only edit the approved metadata overlay.
 const nextRun=structuredClone(career.run);
 if(kind==='horse'&&Object.hasOwn(patch,'name')){
  const name=patch.name.trim();
  for(const h of Object.values(nextRun.runtime?.registered_horses?.by_id||{}))
   if(h.world_source_horse_id===id||h.registration_receipt?.candidate_id===id){
    h.name=name;h.registered_name=name;
   }
 }
 const db=await open1999IndustryDatabase();
 try{
  const prior=await loadPersistent1999CareerRun(db,career.manifest,nextRun.run_id);
  if(!prior?.changes?.canonicalRun)
   throw Error('The working career is not saved; use Start Career and save it first');
  if(prior.gameDate!==nextRun.clock.date||
    prior.changes.canonicalRun.revision!==career.run.revision)
   throw Error('The career changed while editing. Reopen the saved career and retry');
  const saved=await savePersistent1999CareerRun(db,career.manifest,{
   runId:nextRun.run_id,gameDate:nextRun.clock.date,player:nextRun.player,
   changes:{...prior.changes,canonicalRun:nextRun,worldEdits:edits},
   version:Math.max(prior.version+1,nextRun.revision+1)});
  const verified=await loadPersistent1999CareerRun(db,career.manifest,nextRun.run_id);
  if(JSON.stringify(verified?.changes?.worldEdits)!==JSON.stringify(edits)||
    verified?.version!==saved.version)
   throw Error('World edit did not survive persisted read-back');
  career.run=nextRun;
  // The generated world is never written as a competing world database.
  applyCareerWorldEdits(career.world,edits,{run:career.run});
  career.worldEdits=edits;career.editVersion=(career.editVersion||0)+1;
  liveWorldHorseDirectory?.invalidate();
  Object.values(liveWorldEntityDirectories||{}).forEach(d=>d.invalidate());
  publishCareerReadModel();
  return {kind,id,recordVersion:saved.version,editVersion:career.editVersion};
 }finally{db.close()}
}
// One renderer for exact ID-linked records from the current saved game only.
window.WTW1999CanonicalCareerRaceFile=Object.freeze({render:renderCanonical1999RaceFile});
// Read-only bridge to the existing committed game run: do not seed a second
// balance, infer assets, or mutate the immutable 1999 world directory.
let liveWorldHorseDirectory=null,liveWorldEntityDirectories=null,
 liveWorldDirectorySource=null,liveWorldDirectoryYear=null;
function publishCareerReadModel(){
 const career=activeWorldCareer,run=career?.run;
 if(!run){
  if(window.__WTW_ACTIVE_WORLD_CAREER_VIEW__){
   delete window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
   window.__WTW_NEXT__?.paint?.();
  }
  return;
 }
 const operation=career.world.entities.organizations.find(x=>x.id===run.player.operation_id);
 if(!operation)throw Error('Active game operation missing from the world');
 const rawBalance=run.runtime.finances?.operation_balances_minor?.[operation.id];
 // Only V10 has the operational 300k census with fully linked founder identities.
 // Never replace older saved-world data with this newer generator's records.
 const isV10=/^WTW1999FullIndustry-COHORTS-V6-OWNER-V10-/.test(career.manifest.worldId);
 const careerYear=Number(run.clock.date.slice(0,4));
 if(isV10&&(liveWorldDirectorySource!==career.world||
  liveWorldDirectoryYear!==careerYear)){
  liveWorldHorseDirectory=createPersistedIndustryHorseDirectory({
   world:career.world,manifest:career.manifest,year:careerYear});
  liveWorldEntityDirectories=Object.fromEntries(['person','organization','track'].map(kind=>
   [kind,createPersistedIndustryEntityDirectory({world:career.world,
    manifest:career.manifest,kind})]));
  liveWorldDirectorySource=career.world;
  liveWorldDirectoryYear=careerYear;
 }
 const sourceById=new Map((career.world.entities.horses||[]).map(h=>[h.id,h]));
 const horses=(run.stable_horse_ids||[]).map(id=>{
  const active=run.runtime.registered_horses?.by_id?.[id]||null;
  const source=sourceById.get(active?.registration_receipt?.candidate_id)||
   sourceById.get(id)||null;
  if(!active&&!source)return null;
  const relationships=new Set([
   ...(source?.ownerId===operation.id?['OWNED']:[]),
   ...(source?.managementOrganizationId===operation.id?['MANAGED']:[]),
   ...(source?.careFacilityId===operation.id?['BOARDED']:[]),
   ...(source?.trainingBarnId===operation.id?['TRAINED']:[]),
   ...(source?.breederId===operation.id?['BRED']:[]),
   ...(source?.foalingFarmId===operation.id?['FOALED AT']:[])
  ]);
  return {horseId:active?.horse_id||id,sourceHorseId:source?.id||null,
   name:active?.registered_name||source?.name||id,
   activity:active?.status||source?.status||'Stable care',
   tag:[...relationships].join(' · ')||active?.status||source?.status||'Stable'};
 }).filter(Boolean);
 const races=projectCanonical1999RaceRows(run,career.world);
 const snapshot={schema:'WTW_CANONICAL_CAREER_READ_MODEL_V1',
  worldId:career.manifest.worldId,runId:run.run_id,
  worldHorseCount:career.manifest.horseCount,personCount:career.manifest.personCount,
  operationId:operation.id,operationName:operation.name,
  operationInventoryCount:career.operationInventoryCount,
  operationInventoryByRelationship:career.operationInventoryByRelationship,
  operationInventoryByStatus:career.operationInventoryByStatus,
  date:run.clock.date,revision:run.revision,
  editVersion:career.editVersion||0,worldEditsCount:Object.keys(career.worldEdits?.byId||{}).length,
  horseRows:horses,raceRows:races,
  ...(isV10?{worldHorseBrowse:liveWorldHorseDirectory.browse,
   worldHorseById:liveWorldHorseDirectory.byId,
   worldHorseDirectoryCount:liveWorldHorseDirectory.size,
   worldEntityBrowse:(kind,options)=>liveWorldEntityDirectories[kind]?.browse(options)||null,
   worldEntityById:(kind,id)=>liveWorldEntityDirectories[kind]?.byId(id)||null,
   worldEntityCounts:Object.fromEntries(Object.entries(liveWorldEntityDirectories).map(
    ([kind,directory])=>[kind,directory.size]))}:{}),
  cashMinor:Number.isSafeInteger(rawBalance)?rawBalance:null};
 const prior=window.__WTW_ACTIVE_WORLD_CAREER_VIEW__;
 if(prior?.worldId===snapshot.worldId&&prior?.runId===snapshot.runId&&
  prior?.revision===snapshot.revision&&prior?.editVersion===snapshot.editVersion&&
  prior?.operationId===snapshot.operationId&&
  prior?.date===snapshot.date)return;
 window.__WTW_ACTIVE_WORLD_CAREER_VIEW__=Object.freeze(snapshot);
 window.__WTW_NEXT__?.paint?.();
}
let selectedIndustryHorses=300000,selectedIndustrySeed=19990101,
 selectedPlayerOperationId='O-000061';
const FEATURED_OPERATION_IDS=['O-000061','O-000001','O-000003','O-000062',
 'O-000066','O-FOUNDING-1999-001','O-FOUNDING-1999-004'];
function industryOperationDisplayName(row){
 const verified=activeWorldCareer?.world?.entities?.organizations?.find(
  x=>x.id===row?.id);
 return verified?.name||row?.name||row?.id||'';
}
function featuredOperations(){
 const byId=new Map(industryDirectory.map(row=>[row.id,row]));
 return FEATURED_OPERATION_IDS.map(id=>byId.get(id)).filter(row=>
  row?.operatingRoles?.includes('LEGAL_OWNER')).map(row=>({
   ...row,name:industryOperationDisplayName(row)
  }));
}
function featuredOperationOptions(){
 return featuredOperations().map(row=>'<option value="'+esc(row.id)+'"'+
  (row.id===selectedPlayerOperationId?' selected':'')+'>'+esc(row.name||row.id)+
  ' · '+esc(row.portfolioTier||'OPERATION')+'</option>').join('');
}
const INDUSTRY_SIZE_MIN=10000,INDUSTRY_SIZE_MAX=325000;
function requestedIndustry(){
 const root=modal();
 const horseCount=Number(root.querySelector('[data-cc="industry-size"]')?.value??selectedIndustryHorses);
 const seed=Number(root.querySelector('[data-cc="seed"]')?.value??selectedIndustrySeed);
 if(!Number.isSafeInteger(horseCount)||horseCount<INDUSTRY_SIZE_MIN||
  horseCount>INDUSTRY_SIZE_MAX)throw Error('Choose 10000–325000 opening horses');
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid 1999 industry seed');
 selectedIndustryHorses=horseCount;selectedIndustrySeed=seed;
 // The new cohort model gets its own immutable records; keep legacy manifests
 // addressable through the open-saved fallback below.
 return {seed,targetOpeningHorses:horseCount,
  worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H'+horseCount};
}
let industryBrowsePage=0,industryBrowseHtml='',industryBrowseKind='horseBatches';
let industryDirectory=[];
async function browseFullIndustry(page=0,kind=industryBrowseKind){
 if(!fullIndustryManifest)throw Error('Open the full industry first');
 if(!['horseBatches','personBatches','directory','calendarBatches','coveringBatches'].includes(kind))throw Error('Invalid industry view');
 if(kind==='directory'){
  industryBrowseKind=kind;
  const count=industryDirectory.length;
  industryBrowsePage=Math.max(0,Math.min(Math.ceil(count/20)-1,page));
  const first=industryBrowsePage*20;
  const records=industryDirectory.slice(first,first+20);
  industryBrowseHtml='<p>TRACKS / FARMS / OWNERS '+fmt(first+1)+'–'+
   fmt(first+records.length)+' OF '+fmt(count)+'</p>'+records.map(e=>
   '<div class="wtw-cc-slot"><strong>'+esc(industryOperationDisplayName(e))+'</strong> · '+
   esc(e.id)+' · '+esc(Object.entries(e.ratings).slice(0,3)
    .map(([k,v])=>k+': '+v).join(' / '))+
    ' <button data-cc-action="inspect-listed-entity" data-id="'+esc(e.id)+'">PROFILE</button></div>').join('');
  return;
 }
 industryBrowseKind=kind;
 const count=kind==='horseBatches'?fullIndustryManifest.horseCount:
  kind==='personBatches'?fullIndustryManifest.personCount:
  kind==='calendarBatches'?fullIndustryManifest.scheduledCards:
  fullIndustryManifest.coveringCount;
 const max=Math.ceil(count/20);
 industryBrowsePage=Math.max(0,Math.min(max-1,page));
 const first=industryBrowsePage*20,batchSize=kind==='calendarBatches'?100:
  fullIndustryManifest.batchSize;
 const store=await open1999IndustryDatabase();
 try{
  const ids=[Math.floor(first/batchSize),Math.floor((first+19)/batchSize)];
  const a=await readPersistent1999IndustryBatch(store,fullIndustryManifest,kind,ids[0]);
  const b=ids[1]===ids[0]?a:await readPersistent1999IndustryBatch(store,fullIndustryManifest,kind,ids[1]);
  const records=Array.from({length:Math.min(20,count-first)},
   (_,i)=>{const index=first+i;return (Math.floor(index/batchSize)===ids[0]?a:b)[index%batchSize]});
  const title={horseBatches:'HORSES',personBatches:'PERSONNEL',
   calendarBatches:'RACE CARDS',coveringBatches:'BREEDING BOOKINGS'}[kind];
  industryBrowseHtml='<p>'+title+' '+fmt(first+1)+'–'+
   fmt(first+records.length)+' OF '+fmt(count)+'</p>'+
   '<div style="max-height:260px;overflow:auto">'+records.map(h=>{
    if(kind==='calendarBatches')return '<div class="wtw-cc-slot"><strong>'+
     esc(h.date)+' · '+esc(h.trackId)+'</strong> · '+
     fmt(h.races.length)+' scheduled races · '+esc(h.id)+'</div>';
    if(kind==='coveringBatches')return '<div class="wtw-cc-slot"><strong>'+
     esc(h.id)+'</strong> · mare '+esc(h.mareId)+
     ' · stallion '+esc(h.stallionId)+' · '+esc(h.status)+'</div>';
    return '<div class="wtw-cc-slot"><strong>'+esc(h.name||h.id)+'</strong> · '+
     esc(kind==='horseBatches'?h.cohort:h.role)+' · '+
     esc(kind==='horseBatches'?h.sex:h.tier)+' · '+
     esc(kind==='horseBatches'?h.foalYear:h.workplaceId)+
     (kind==='horseBatches'||kind==='personBatches'?'<button data-cc-action="'+
      (kind==='horseBatches'?'inspect-listed-horse':'inspect-listed-person')+
      '" data-id="'+esc(h.id)+'">PROFILE</button>':'')+'</div>';
   }).join('')+'</div>';
 }finally{store.close()}
}
async function inspectFullIndustryHorse(horseId){
 if(!fullIndustryManifest)throw Error('Open the full industry first');
 const store=await open1999IndustryDatabase();
 try{return await readPersistent1999HorseProfile(store,fullIndustryManifest,horseId)}
 finally{store.close()}
}
async function inspectFullIndustryPerson(personId){
 if(!fullIndustryManifest)throw Error('Open the full industry first');
 const store=await open1999IndustryDatabase();
 try{return await findPersistent1999Person(store,fullIndustryManifest,personId)}
 finally{store.close()}
}
function canonicalRunId(manifest){return 'WTW-RUN-1999-'+manifest.seed+'-SIZE-'+
 (manifest.targetOpeningHorses??manifest.horseCount)}
function operationRunId(manifest,operationId){
 return canonicalRunId(manifest)+'-OP-'+operationId;
}
function savePreferredOperation(manifest,operationId){
 // The active operation is recorded by the canonical career run in IndexedDB.
 // Do not mirror game selection into a second localStorage save surface.
 selectedPlayerOperationId=operationId||selectedPlayerOperationId;
}
function preferredOperation(manifest){
 return selectedPlayerOperationId;
}
async function persistCanonicalRun(){
 if(!activeWorldCareer)return;
 const career=activeWorldCareer,run=career.run;
 const store=await open1999IndustryDatabase();
 try{
  const prior=await loadPersistent1999CareerRun(store,career.manifest,run.run_id);
  await savePersistent1999CareerRun(store,career.manifest,{
   runId:run.run_id,gameDate:run.clock.date,player:run.player,
   changes:{...(prior?.changes||{}),canonicalRun:run,
    worldEdits:career.worldEdits||prior?.changes?.worldEdits||createCareerWorldEdits()},
   version:Math.max((prior?.version||0)+1,run.revision+1)
  });
 }finally{store.close()}
}
async function sharedCareerBytes(){
 if(!activeWorldCareer?.manifest||!activeWorldCareer?.run)
  throw Error('Start or open the full-world test career first');
 const store=await open1999IndustryDatabase();
 try{
  const record=await loadPersistent1999CareerRun(store,activeWorldCareer.manifest,
   activeWorldCareer.run.run_id);
  if(!record)throw Error('The active full-world career has not been saved');
  return packShared1999Career({manifest:activeWorldCareer.manifest,
   snapshotSha256:activeWorldCareer.world.authority.sha256,careerRecord:record});
 }finally{store.close()}
}
function exportCareerWorldChangesForReview(){
 const c=activeWorldCareer;
 if(!c?.run||!c.manifest)throw Error('Open your working 1999 career to export edits');
 const data=buildWorldEditReviewExport({
  manifest:c.manifest,world:c.world,run:c.run,
  worldEdits:c.worldEdits||createCareerWorldEdits(),
  createdAt:new Date().toISOString()
 });
 const blob=new Blob([JSON.stringify(data,null,2)+'\n'],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;link.download='WTW_WORLD_CHANGES_FOR_REVIEW_'+
  c.run.clock.date+'.json';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),5000);
 return {count:data.recordCount,date:c.run.clock.date,worldId:c.manifest.worldId};
}
async function exportSharedCareer(){
 const bytes=await sharedCareerBytes();
 const blob=new Blob([bytes],{type:'application/json'});
 const url=URL.createObjectURL(blob),link=document.createElement('a');
 link.href=url;
 link.download='WTW_1999_FULL_WORLD_'+selectedIndustryHorses+'_'+
  selectedIndustrySeed+'_'+activeWorldCareer.run.clock.date+'.wtwcareer';
 document.body.appendChild(link);link.click();link.remove();
 setTimeout(()=>URL.revokeObjectURL(url),1500);
 return {bytes:bytes.byteLength,worldId:activeWorldCareer.manifest.worldId,
  snapshotSha256:activeWorldCareer.world.authority.sha256,
  runId:activeWorldCareer.run.run_id,gameDate:activeWorldCareer.run.clock.date};
}

function supportsV10FounderInventoryMigration(manifest){
 return manifest?.foundingRelationshipRevision===1&&
  /^WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H\d+$/.test(manifest.worldId||'');
}
function reconcileV10FounderOperationInventory(record,career,manifest){
 if(!supportsV10FounderInventoryMigration(manifest))
  return {careerRecord:record,addedHorseIds:[]};
 return migrateShared1999CareerOperationInventory(record,career.run);
}
async function persistMigratedCareerRecord(store,manifest,record){
 await savePersistent1999CareerRun(store,manifest,{
  runId:record.runId,gameDate:record.gameDate,player:record.player,
  changes:record.changes,version:record.version});
}

async function importSharedCareerFile(file,{preserveExistingProgress=false}={}){
 if(!file)throw Error('Choose a shared full-world career file');
 if(file.size>64*1024*1024)throw Error('Shared career file exceeds 64 MiB');
 const checkpoint=await unpackShared1999Career(await file.arrayBuffer());
 const wanted=checkpoint.world,expected=wanted.manifest;
 selectedIndustrySeed=wanted.seed;selectedIndustryHorses=wanted.targetOpeningHorses;
 const sizeInput=modal().querySelector('[data-cc="industry-size"]');
 if(sizeInput)sizeInput.value=String(selectedIndustryHorses);
 const db=await open1999IndustryDatabase();
 try{
  let existing=await reopenPersistent1999Industry(db,{seed:wanted.seed,worldId:wanted.worldId});
  if(existing?.status==='GENERATING'){
   notice='Resuming the exact shared world before importing its career.';
   fullIndustryManifest=await prepareFictionalIndustry({
    seed:wanted.seed,worldId:wanted.worldId,
    targetOpeningHorses:wanted.targetOpeningHorses,batchSize:expected.batchSize,
    onStage:message=>{
     const progress=modal().querySelector('[data-cc="industry-progress"]');
     if(progress)progress.textContent=message;
    },
    onProgress:({kind,completed,totalRecords})=>{
     const progress=modal().querySelector('[data-cc="industry-progress"]');
     if(progress)progress.textContent='Rebuilding shared '+kind+' · batch '+
      completed+' · '+fmt(totalRecords)+' planned records. Keep this window open.';
    }});
  }else if(!existing){
   notice='Creating the exact shared world before importing its career.';
   fullIndustryManifest=await prepareFictionalIndustry({
    seed:wanted.seed,worldId:wanted.worldId,
    targetOpeningHorses:wanted.targetOpeningHorses,batchSize:expected.batchSize,
    onStage:message=>{
     const progress=modal().querySelector('[data-cc="industry-progress"]');
     if(progress)progress.textContent=message;
    },
    onProgress:({kind,completed,totalRecords})=>{
     const progress=modal().querySelector('[data-cc="industry-progress"]');
     if(progress)progress.textContent='Creating shared '+kind+' · batch '+
      completed+' · '+fmt(totalRecords)+' planned records. Keep this window open.';
    }});
  }else{
   fullIndustryManifest=existing.manifest;
  }
  const ready=await reopenPersistent1999Industry(db,{seed:wanted.seed,worldId:wanted.worldId});
  if(ready?.status!=='READY')throw Error('Shared 1999 world could not be completed');
  fullIndustryManifest=ready.manifest;
  if(!sameShared1999WorldIdentity(fullIndustryManifest,expected))
   throw Error('This build creates a different shared-world identity; checkpoint import stopped safely');
  const sameOpenWorld=activeWorldCareer?.manifest?.worldId===wanted.worldId&&
   activeWorldCareer.manifest.seed===wanted.seed&&
   activeWorldCareer.manifest.foundingRelationshipRevision===
    fullIndustryManifest.foundingRelationshipRevision;
  const career=sameOpenWorld?activeWorldCareer:
   await openPersistent1999GameCareer(db,fullIndustryManifest,{
    runId:checkpoint.careerRecord.runId,
    operationId:checkpoint.careerRecord.player.operation_id,
    playerRole:checkpoint.careerRecord.player.role,
    involvement:checkpoint.careerRecord.player.involvement});
  let importedCareerRecord=checkpoint.careerRecord;
  let checkpointRun=importedCareerRecord.changes.canonicalRun;
  if(career.world.authority.sha256!==wanted.snapshotSha256){
   const supportsFoundingRelationshipMigration=
    fullIndustryManifest.foundingRelationshipRevision===1&&
    !expected.foundingRelationshipRevision;
   const legacyManifest={...fullIndustryManifest};
   delete legacyManifest.foundingRelationshipRevision;
   const legacyEntities={...career.world.entities,
    horses:career.world.entities.horses.map(
     restoreLegacyApprovedFoundingHorseRelationships)};
   const legacySnapshotSha256=supportsFoundingRelationshipMigration?
    await digestPersistent1999GameSnapshot({manifest:legacyManifest,
     entities:legacyEntities,cards:career.world.calendar.cards}):null;
   if(legacySnapshotSha256!==wanted.snapshotSha256)
    throw Error('Generated world records do not match the shared career fingerprint: expected '+
     wanted.snapshotSha256+' but generated '+career.world.authority.sha256+
     (supportsFoundingRelationshipMigration?' (legacy migration projection '+
      legacySnapshotSha256+')':''));
   importedCareerRecord=migrateShared1999CareerRunWorldReference(importedCareerRecord,{
    expectedSnapshotSha256:wanted.snapshotSha256,
    currentAuthority:career.world.authority});
   checkpointRun=importedCareerRecord.changes.canonicalRun;
  }
  const operationInventoryMigration=reconcileV10FounderOperationInventory(
   importedCareerRecord,career,fullIndustryManifest);
  importedCareerRecord=operationInventoryMigration.careerRecord;
  checkpointRun=importedCareerRecord.changes.canonicalRun;
  validateGameRun(checkpointRun,career.world);
  const prior=await loadPersistent1999CareerRun(db,fullIndustryManifest,
   importedCareerRecord.runId);
  let preservedRecord=preserveExistingProgress&&prior?.changes?.canonicalRun?prior:null;
  if(preservedRecord){
   const preserveMigration=reconcileV10FounderOperationInventory(
    preservedRecord,career,fullIndustryManifest);
   preservedRecord=preserveMigration.careerRecord;
   if(preserveMigration.addedHorseIds.length)
    await persistMigratedCareerRecord(db,fullIndustryManifest,preservedRecord);
  }
  const preservedRun=preservedRecord?.changes?.canonicalRun||null;
  if(preservedRun)validateGameRun(preservedRun,career.world);
  if(prior&&JSON.stringify(prior)!==JSON.stringify(importedCareerRecord)&&
   !preservedRun&&
   !window.confirm('This test career already has different progress. Replace only that test career with the imported checkpoint?'))
   throw Error('Import cancelled; current career was not changed');
  if((!prior||JSON.stringify(prior)!==JSON.stringify(importedCareerRecord))&&
   !preservedRun)
   await savePersistent1999CareerRun(db,fullIndustryManifest,{
    runId:importedCareerRecord.runId,gameDate:importedCareerRecord.gameDate,
    player:importedCareerRecord.player,changes:importedCareerRecord.changes,
    version:importedCareerRecord.version});
  const confirmed=await loadPersistent1999CareerRun(db,fullIndustryManifest,
   importedCareerRecord.runId);
  const expectedStoredRecord=preservedRun?preservedRecord:importedCareerRecord;
  if(JSON.stringify(confirmed)!==JSON.stringify(expectedStoredRecord))
   throw Error('Imported career did not survive IndexedDB read-back');
  const run=preservedRun||checkpointRun;
  activeWorldCareer=hydrateCareerWorldEdits(
   {...career,run,manifest:fullIndustryManifest},expectedStoredRecord);
  industryDirectory=await readPersistent1999Directory(db,fullIndustryManifest);
  await browseFullIndustry(0,'directory');
  publishCareerReadModel();
  notice='SHARED CAREER READY · '+run.clock.date+' · '+fmt(fullIndustryManifest.horseCount)+
   ' horses · '+fmt(fullIndustryManifest.personCount)+' personnel · exact world verified.'+
   (preservedRun?' Existing local progress kept.':'');
  return {worldId:wanted.worldId,seed:wanted.seed,runId:run.run_id,
   gameDate:run.clock.date,snapshotSha256:career.world.authority.sha256};
 }finally{db.close()}
}
let bundledCareerBootstrap=null;
function bootstrapBundledCareer(){
 if(bundledCareerBootstrap)return bundledCareerBootstrap;
 bundledCareerBootstrap=(async()=>{
  if(window.WTWDesktop?.runtime!=='windows-desktop')
   throw Error('Bundled career auto-load is available only in the Windows desktop app');
  await open();
  busy=true;notice='LOADING THE SHARED 1999 TEST CAREER…';await refresh();
  try{
   const response=await fetch('/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER_V10.wtwcareer.gz?rev=wtw-shared-career-v10-20261117');
   if(!response.ok)throw Error('Bundled shared career file is missing ('+response.status+')');
   if(typeof DecompressionStream!=='function')
    throw Error('This Windows build cannot decompress its bundled career checkpoint');
   const stream=response.body.pipeThrough(new DecompressionStream('gzip'));
   const bytes=await new Response(stream).arrayBuffer();
   const file=new File([bytes],'WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer',
    {type:'application/json'});
   const result=await importSharedCareerFile(file,{preserveExistingProgress:true});
   return {...result,horseCount:fullIndustryManifest.horseCount,
    personCount:fullIndustryManifest.personCount,
   playableHorseCount:activeWorldCareer.playableHorseCount,
   operationInventoryCount:activeWorldCareer.operationInventoryCount};
  }catch(error){
   notice='SHARED 1999 CAREER LOAD FAILED · '+String(error?.message||error);
   await refresh();throw error;
  }finally{busy=false;await refresh()}
 })();
 return bundledCareerBootstrap;
}
async function resumeCanonicalRun(store,manifest){
 const preferred=preferredOperation(manifest);
 const operationId=preferred&&industryDirectory.some(row=>row.id===preferred&&
  row.operatingRoles?.includes('LEGAL_OWNER'))?preferred:'';
 const runId=operationId?operationRunId(manifest,operationId):canonicalRunId(manifest);
 let saved=await loadPersistent1999CareerRun(store,manifest,runId);
 if(!saved?.changes?.canonicalRun)return null;
 const career=await openPersistent1999GameCareer(store,manifest,{
  runId,operationId:saved.player.operation_id});
 const migration=reconcileV10FounderOperationInventory(saved,career,manifest);
 saved=migration.careerRecord;
 if(migration.addedHorseIds.length)
  await persistMigratedCareerRecord(store,manifest,saved);
 validateGameRun(saved.changes.canonicalRun,career.world);
 selectedPlayerOperationId=saved.player.operation_id;
 return hydrateCareerWorldEdits({...career,run:saved.changes.canonicalRun,manifest},saved);
}
async function startCanonicalRun(operationId=null){
 if(!fullIndustryManifest||fullIndustryManifest.status!=='COMPLETE')
  throw Error('Create or open a completed world first');
 const chosenId=operationId&&featuredOperations().some(row=>row.id===operationId)?
  operationId:null;
 const runId=chosenId?operationRunId(fullIndustryManifest,chosenId):
  canonicalRunId(fullIndustryManifest);
 const store=await open1999IndustryDatabase();
 try{
  let saved=await loadPersistent1999CareerRun(store,fullIndustryManifest,runId);
  activeWorldCareer=await openPersistent1999GameCareer(store,fullIndustryManifest,
   {runId,operationId:chosenId});
  if(saved?.changes?.canonicalRun){
   const migration=reconcileV10FounderOperationInventory(
    saved,activeWorldCareer,fullIndustryManifest);
   saved=migration.careerRecord;
   if(migration.addedHorseIds.length)
    await persistMigratedCareerRecord(store,fullIndustryManifest,saved);
   validateGameRun(saved.changes.canonicalRun,activeWorldCareer.world);
   activeWorldCareer.run=saved.changes.canonicalRun;
  }
  activeWorldCareer.manifest=fullIndustryManifest;
  hydrateCareerWorldEdits(activeWorldCareer,saved);
  await persistCanonicalRun();
 }finally{store.close()}
 if(chosenId){selectedPlayerOperationId=chosenId;
  savePreferredOperation(fullIndustryManifest,chosenId)}
 notice='TEST CAREER READY · '+fmt(activeWorldCareer.playableHorseCount)+
  ' racing horses · '+fmt(activeWorldCareer.operationInventoryCount)+
  ' managed/owned/boarded/trainable horses at '+activeWorldCareer.homeTrackId+'.';
}
async function advanceCanonicalRun(){
 if(!activeWorldCareer)throw Error('Start a test career first');
 const state=dispatchGameCommand({state:activeWorldCareer.run,
  world:activeWorldCareer.world,command:{
   id:'player-day-'+(activeWorldCareer.run.clock.days_elapsed+1),
   type:'ADVANCE_DAY',actor:'player',payload:{}}}).state;
 activeWorldCareer.run=state;await persistCanonicalRun();
 const official=Object.values(state.runtime.races).filter(r=>
  r.status==='OFFICIAL_SIM_RESULT').sort((a,b)=>b.date.localeCompare(a.date))[0];
 const winner=official?.results?.[0]?.horse_id?
  state.runtime.registered_horses.by_id[official.results[0].horse_id]?.registered_name:null;
 notice='GAME DATE '+state.clock.date+(official?' · '+official.track_id+
  ' RACE COMPLETE · '+(winner||official.results[0].horse_id)+' WON':' · simulation advanced');
}
async function openNextTestRace(){
 if(!activeWorldCareer)throw Error('Start a test career first');
 const {run,world,homeTrackId}=activeWorldCareer;
 let selected=null;
 for(let offset=2;offset<=28&&!selected;offset++){
  const date=new Date(Date.parse(run.clock.date+'T00:00:00Z')+
   offset*86400000).toISOString().slice(0,10);
  const race=gameRaceProgram(run,world,homeTrackId,date).find(r=>
   supported1999RaceClass(r)&&r.conditions==='Maiden Special Weight');
  if(!race)continue;
  const opened=dispatchGameCommand({state:run,world,command:{
   id:'player-open-'+race.id,type:'OPEN_1999_RACE',actor:'system',
   payload:{track_id:homeTrackId,date,race_id:race.id}}}).state;
  const eligible=opened.stable_horse_ids.map(id=>
   opened.runtime.registered_horses.by_id[id]).filter(h=>
    raceEligibility(opened,h,opened.runtime.races[race.id]).eligible);
  const field=eligible.slice(0,Math.min(2,race.fieldCapacity));
  if(field.length<2)continue;
  let entered=opened;
  for(const horse of field)entered=dispatchGameCommand({state:entered,world,
   command:{id:'player-enter-'+race.id+'-'+horse.horse_id,
    type:'ENTER_1999_RACE',actor:'player',
    payload:{race_id:race.id,horse_id:horse.horse_id}}}).state;
  selected={race,state:entered};
 }
 if(!selected)throw Error('No eligible local maiden race with two owned runners is scheduled in the next 28 days');
 activeWorldCareer.run=selected.state;await persistCanonicalRun();
 notice='RACE OPEN · '+selected.race.date+' · '+selected.race.name+
  ' · '+selected.state.runtime.races[selected.race.id].field.length+
  ' player horses entered. Advance days to race day.';
}
let busy=false,notice='';
async function refresh(){
 publishCareerReadModel();
 const root=modal();
 const current=config().current(),slots=await listSlots();
 const mareTurnover=fullIndustryManifest?.plan?.nextSeasonMareTurnover||null;
 const saved=slots.map(x=>'<div class="wtw-cc-slot"><div><strong>'+esc(x.name)+'</strong>'+
  '<small>'+esc(x.date)+' · '+fmt(x.profile?.population)+' horses · '+
   esc('1999 career save')+
   ' · '+kb(x.bytes)+' ('+esc(x.encoding)+')</small></div>'+
   '<div class="wtw-cc-actions"><button data-cc-action="load" data-id="'+esc(x.id)+'">LOAD</button>'+
   '<button data-cc-action="export" data-id="'+esc(x.id)+'">EXPORT</button>'+
   '<button data-cc-action="delete" data-id="'+esc(x.id)+'">DELETE</button></div></div>').join('');
 let quota='';
 try{const estimate=await navigator.storage?.estimate?.();
  if(estimate?.usage!=null&&estimate?.quota)
   quota='<p class="wtw-cc-quota">Browser storage: '+kb(estimate.usage)+' used · '+
    kb(estimate.quota)+' available capacity estimate</p>';
 }catch{}
 root.innerHTML='<section class="wtw-cc-panel" role="dialog" aria-modal="true" aria-label="Compact careers and world setup">'+
  '<header><div><small>WIRE TO WIRE / LOCAL-FIRST CAREERS</small><h2>WORLD & CAREER MANAGER</h2></div>'+
  '<button data-cc-action="close">✕ CLOSE</button></header>'+
  '<div class="wtw-cc-current">CURRENT CAREER SAVE · SEED '+esc(current.seed)+'</div>'+
  '<div class="wtw-cc-section"><h3>FULL FICTIONAL 1999 INDUSTRY — WORLD EXPLORER</h3>'+
  '<p>Choose the January 1 horse census. The coming foal crop is forecast separately, varies by world and season, and is not counted as born yet. Breeding mares also turn over as some retire and eligible racing fillies graduate into the breeding pool.</p>'+
  '<label>JANUARY 1 OPENING HORSES (10,000–325,000)<input data-cc="industry-size" type="number" min="10000" max="325000" step="1" value="'+esc(selectedIndustryHorses)+'"/></label>'+
  '<div class="wtw-cc-actions"><button data-cc-action="open-existing-industry">OPEN SAVED 1999 WORLD</button>'+ 
  '<button data-cc-action="open-full-industry">CREATE / RESUME FULL INDUSTRY</button></div>'+ 
  '<p data-cc="industry-progress" role="status" aria-live="polite">'+
  (busy?'Preparing the full world…':'Opening-world records are stored on this device.')+'</p>'+
  (fullIndustryManifest?'<p>WORLD STORED · '+fmt(fullIndustryManifest.horseCount)+
   ' January 1 horses + '+fmt(fullIndustryManifest.plan.counts.annualFoals)+
   ' forecast foals · ABOUT '+fmt(fullIndustryManifest.plan.modeledLivingPopulation)+
   ' total horses · '+fmt(fullIndustryManifest.personCount)+' personnel · '+
   esc(fullIndustryManifest.status)+'</p>'+
   '<div class="wtw-cc-section"><h3>PLAYABLE GAMEPLAY TEST</h3>'+
   '<label>PLAYER OPERATION<select data-cc="player-operation">'+featuredOperationOptions()+'</select></label>'+
   '<button data-cc-action="open-selected-operation">OPEN / SWITCH OPERATION</button> '+
   (activeWorldCareer?'<p>ACTIVE · '+esc(activeWorldCareer.run.clock.date)+
    ' · '+esc(activeWorldCareer.operation.name)+' · '+
    fmt(activeWorldCareer.operationInventoryCount)+' relationship-linked horses · '+
    esc(activeWorldCareer.homeTrackId)+' · canonical race engine connected</p>'+
    '<div class="wtw-cc-actions"><button data-cc-action="open-next-test-race">OPEN NEXT TEST RACE / ENTER TWO</button>'+ 
   '<button data-cc-action="advance-test-day" class="primary">ADVANCE ONE GAME DAY</button>'+
   '<button data-cc-action="export-shared-career">EXPORT SHARED CAREER</button>'+
   '<button data-cc-action="export-world-changes-review">EXPORT WORLD CHANGES FOR CHATGPT ('+
    fmt(Object.keys(activeWorldCareer.worldEdits?.byId||{}).length)+')</button></div>':
    '<p>Start a local test career from this exact saved world. Race decisions and results use the existing game clock and settlement engine.</p>'+ 
    '<button data-cc-action="start-test-career" class="primary">START TEST CAREER</button>')+
   '</div>'+
   '<label>HORSE ID<input data-cc="inspect-horse" value="H-FICTIONAL-1999-BROODMARES-0000001"/></label>'+
   '<button data-cc-action="inspect-full-horse">OPEN HORSE PROFILE</button>'+ 
   '<div class="wtw-cc-actions"><button data-cc-action="industry-horses">HORSES</button>'+ 
   '<button data-cc-action="industry-people">PERSONNEL</button>'+ 
   '<button data-cc-action="industry-directory">TRACKS / FARMS / OWNERS</button>'+ 
   '<button data-cc-action="industry-calendar">RACE CALENDAR</button>'+ 
   '<button data-cc-action="industry-coverings">BREEDING BOOK</button></div>'+ 
   '<p>BREEDING STOCK '+fmt(fullIndustryManifest.plan.counts.broodmares+fullIndustryManifest.plan.counts.stallions)+
   ' · YEARLINGS '+fmt(fullIndustryManifest.plan.counts.yearlings)+
   ' · 2YO PROSPECTS '+fmt(fullIndustryManifest.plan.counts.twoYearOldProspects)+
   ' · 3YO RUNNERS '+fmt(fullIndustryManifest.plan.counts.threeYearOldRunners)+
   ' · 4YO RUNNERS '+fmt(fullIndustryManifest.plan.counts.fourYearOldRunners)+
   ' · OLDER RUNNERS '+fmt(fullIndustryManifest.plan.counts.fivePlusRunners)+
   ' · NEXT SEASON MARES RETIRING '+(mareTurnover?fmt(mareTurnover.retired):'NOT FORECAST')+
   ' / GRADUATING IN '+(mareTurnover?fmt(mareTurnover.graduatedIntoBreeding):'NOT FORECAST')+
   ' · 1999 COVERINGS BOOKED '+fmt(fullIndustryManifest.coveringCount)+
   ' · SCHEDULED RACE DAYS '+fmt(fullIndustryManifest.scheduledCards)+
   ' · RACES '+fmt(fullIndustryManifest.scheduledRaces)+'</p>'+ 
   '<div class="wtw-cc-actions"><button data-cc-action="industry-prev">PREVIOUS 20</button>'+ 
   '<button data-cc-action="industry-next">NEXT 20</button></div>'+industryBrowseHtml:'')+
  '</div>'+
  '<div class="wtw-cc-section"><h3>COMPACT SAVES · '+slots.length+' SLOTS</h3>'+
  '<p>Local device only. No account, monthly fee or cloud storage required. Portable .wtwsave files have checksums and gzip compression where supported. Total compact-save budget: 512 MB across slots.</p>'+
  '<div class="wtw-cc-actions"><input data-cc="save-name" maxlength="80" placeholder="Name current career" value="1999 Career"/>'+
  '<button data-cc-action="save" class="primary">SAVE CURRENT CAREER</button>'+
  '<button data-cc-action="import">IMPORT CAREER</button>'+
  '<input type="file" data-cc="import-file" accept=".wtwsave,.json,application/octet-stream,application/json" hidden>'+
  '<button data-cc-action="import-shared-career">IMPORT SHARED FULL-WORLD CAREER</button>'+
  '<input type="file" data-cc="import-shared-file" accept=".wtwcareer,application/json" hidden>'+
  '</div>'+ 
  (notice?'<p class="wtw-cc-notice" role="status">'+esc(notice)+'</p>':'')+
  '<div class="wtw-cc-slots">'+(saved||'<p>No compact careers yet. Saving creates a portable, compressed career delta.</p>')+'</div>'+
  quota+'</div><footer>Existing career saves remain separate from custom worlds and gameplay test careers.</footer></section>';
 root.hidden=false;
}
async function perform(action,element){
 if(action==='close'){modal().hidden=true;return}
 if(action==='import'){modal().querySelector('[data-cc="import-file"]').click();return}
 if(action==='import-shared-career'){modal().querySelector('[data-cc="import-shared-file"]').click();return}
 if(action==='export-world-changes-review'){
  const result=exportCareerWorldChangesForReview();
  notice='WORLD CHANGES EXPORTED · '+fmt(result.count)+
   ' edited records. Upload the JSON to the WIRE TO WIRE integration chat. '+
   'The default world was NOT changed automatically.';return;
 }
 if(action==='export-shared-career'){
  const result=await exportSharedCareer();
  notice='SHARED CAREER EXPORTED · '+kb(result.bytes)+' · '+result.gameDate+'.';return;
 }
 if(action==='start-test-career'){await startCanonicalRun();return}
 if(action==='open-selected-operation'){
  const operationId=modal().querySelector('[data-cc="player-operation"]')?.value||'';
  if(!operationId)throw Error('No approved major operation is available in this saved world');
  await startCanonicalRun(operationId);return;
 }
 if(action==='advance-test-day'){await advanceCanonicalRun();return}
 if(action==='open-next-test-race'){await openNextTestRace();return}
 if(action==='open-existing-industry'){
  const {seed,worldId}=requestedIndustry();
  const db=await open1999IndustryDatabase();
  try{
   let reopened=await reopenPersistent1999Industry(db,{seed,worldId});
   if(!reopened){
    // Existing V8 worlds keep their original source-backed owner names.
    reopened=await reopenPersistent1999Industry(db,{seed,
     worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V8-H'+selectedIndustryHorses});
   }
   if(!reopened){
    // Keep the previous partnership revision readable before trying V6.
    reopened=await reopenPersistent1999Industry(db,{seed,
     worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V7-H'+selectedIndustryHorses});
   }
   if(!reopened){
    // The Census-only naming revision remains available to its saved careers.
    reopened=await reopenPersistent1999Industry(db,{seed,
     worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V6-H'+selectedIndustryHorses});
   }
   if(!reopened){
    // Keep completed worlds created by the previous cohort model readable.
    reopened=await reopenPersistent1999Industry(db,{
     seed,worldId:'WTW1999FullIndustry-H'+selectedIndustryHorses});
   }
   if(!reopened){
    notice='No saved full 1999 world found. Select CREATE / RESUME FULL INDUSTRY.';
    return;
   }
   if(reopened.status!=='READY'){
    notice='1999 world generation is incomplete. Select CREATE / RESUME FULL INDUSTRY.';
    return;
   }
   fullIndustryManifest=reopened.manifest;
   industryDirectory=await readPersistent1999Directory(db,fullIndustryManifest);
   activeWorldCareer=await resumeCanonicalRun(db,fullIndustryManifest);
  }finally{db.close()}
  await browseFullIndustry(0,'directory');
  notice='Saved 1999 world opened and verified. Existing career unchanged.';
  return;
 }
 if(action==='open-full-industry'){
  notice='Generating the selected industry. Existing careers are untouched.';
  const {seed,worldId,targetOpeningHorses}=requestedIndustry();
  const progress=modal().querySelector('[data-cc="industry-progress"]');
  fullIndustryManifest=await prepareFictionalIndustry({
   seed,worldId,targetOpeningHorses,batchSize:2000,
   onStage:message=>{if(progress)progress.textContent=message},
   onProgress:({kind,completed,totalRecords})=>{
    if(progress)progress.textContent='Creating '+kind+' · batch '+completed+
     ' · '+fmt(totalRecords)+' planned records. Do not close this window.';
   }
  });
  const db=await open1999IndustryDatabase();
  try{
   await verifyPersistent1999WorldOpen(db,fullIndustryManifest);
   industryDirectory=await readPersistent1999Directory(db,fullIndustryManifest)
  }
  finally{db.close()}
  activeWorldCareer=null;
  await browseFullIndustry(0);
  notice='Full 1999 world reopened and census verified. Existing career unchanged.';
  return;
 }
 if(['industry-horses','industry-people','industry-directory',
  'industry-calendar','industry-coverings'].includes(action)){
  await browseFullIndustry(0,action==='industry-horses'?'horseBatches':
   action==='industry-people'?'personBatches':
   action==='industry-calendar'?'calendarBatches':
   action==='industry-coverings'?'coveringBatches':'directory');
  return;
 }
 if(action==='industry-prev'||action==='industry-next'){
  await browseFullIndustry(industryBrowsePage+(action==='industry-next'?1:-1));
  return;
 }
 if(action==='inspect-listed-person'){
  const p=await inspectFullIndustryPerson(element.dataset.id);
  if(!p)throw Error('Selected person missing from saved 1999 world');
  notice='PERSON PROFILE · '+p.name+' · '+p.id+' · '+p.role+' / '+p.tier+
   ' · born '+p.dateOfBirth+' · '+p.birthplace?.city+', '+
   p.birthplace?.region+' ('+p.birthCountryCode+')'+
   ' · age '+p.ageAtOpening+' · works at '+p.workplaceId+
   ' · RATINGS '+Object.entries(p.ratings||{}).map(([k,v])=>k+':'+v).join(', ');
  return;
 }
 if(action==='inspect-listed-entity'){
  const e=industryDirectory.find(x=>x.id===element.dataset.id);
  if(!e)throw Error('Selected organization or track missing');
  notice='INDUSTRY PROFILE · '+(e.name||e.id)+' · '+e.id+
   ' · location '+(e.location?.city||e.location?.region||'To be modeled')+
   ' · RATINGS '+Object.entries(e.ratings||{}).map(([k,v])=>k+':'+v).join(', ')+
   ' · LINKS '+(e.relationships||[]).map(r=>r.type+':'+r.toId).join(', ');
  return;
 }
 if(action==='inspect-listed-horse'){
  const horse=await inspectFullIndustryHorse(element.dataset.id);
  if(!horse)throw Error('Selected horse missing from saved 1999 world');
  notice='HORSE PROFILE · '+horse.id+' · '+(horse.name||'UNNAMED')+
   ' · '+horse.sex+' · foaled '+horse.foalYear+' · '+horse.status+
   ' · owner '+horse.ownerId+' · farm '+horse.foalingFarmId+
   ' · sire '+horse.sireId+' · dam '+horse.damId+
   ' · home track '+horse.homeTrackId+
   ' · trainer '+horse.trainerId+' · jockey '+horse.jockeyId+
   ' · RATINGS '+Object.entries(horse.ratings||{}).map(([k,v])=>k+':'+v).join(', ');
  return;
 }
 if(action==='inspect-full-horse'){
  const id=modal().querySelector('[data-cc="inspect-horse"]')?.value?.trim();
  const horse=await inspectFullIndustryHorse(id);
  notice=horse?('HORSE PROFILE · '+horse.id+' · '+(horse.name||'UNNAMED')+
   ' · '+horse.sex+' · foaled '+horse.foalYear+' · '+horse.status+
   ' · owner '+horse.ownerId+' · sire '+horse.sireId+' · dam '+horse.damId+
   ' · trainer '+horse.trainerId+' · jockey '+horse.jockeyId+
   ' · RATINGS '+Object.entries(horse.ratings||{}).map(([k,v])=>k+':'+v).join(', ')):
   'No horse exists with that ID.';
  return;
 }
 if(action==='save'){
  const name=modal().querySelector('[data-cc="save-name"]').value.trim();
  if(!name)throw Error('Enter a career name');
  const slot=await storeGame(name,captureCurrent());
  notice='Saved '+slot.name+' · '+kb(slot.bytes)+'.';return;
 }
 const id=element.dataset.id;if(!id)throw Error('Save slot ID missing');
 if(action==='load'){
  if(!window.confirm('Load this career and replace unsaved progress?'))return;
  await restoreGame(id);return;
 }
 if(action==='export'){await exportSlot(id);notice='Portable career exported.';return}
 if(action==='delete'){
  if(!window.confirm('Delete this compact save? Export it first if you want a backup.'))return;
  await removeSlot(id);notice='Compact save deleted.';return;
 }
}
async function handleClick(event){
 const button=event.target.closest('[data-cc-action]');
 if(!button)return;
 event.preventDefault();event.stopPropagation();
 const action=button.dataset.ccAction;
 if(busy&&action!=='close')return;
 try{busy=true;await perform(action,button);if(action!=='close')await refresh()}
 catch(error){notice='ERROR: '+String(error?.message||error);await refresh()}
 finally{busy=false}
}
async function handleChange(event){
 if(event.target.matches('[data-cc="player-operation"]')){
  selectedPlayerOperationId=event.target.value;return;
 }
 if(event.target.matches('[data-cc="import-shared-file"]')){
  const file=event.target.files?.[0];if(!file)return;
  try{busy=true;await importSharedCareerFile(file)}
  catch(error){notice='SHARED CAREER IMPORT FAILED: '+String(error?.message||error)}
  finally{busy=false;event.target.value='';await refresh()}
  return;
 }
 if(event.target.matches('[data-cc="import-file"]')){
  const file=event.target.files?.[0];if(!file)return;
  try{busy=true;const slot=await importFile(file);
   notice='Imported '+slot.name+' · '+kb(slot.bytes)}
  catch(error){notice='IMPORT FAILED: '+String(error?.message||error)}
  finally{busy=false;await refresh()}
 }
}
async function open(){
 try{
  notice='';
  const store=await open1999IndustryDatabase();
  try{
   let selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
   worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V9-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V8-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V7-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V6-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V3-OWNER-V9-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,
    worldId:'WTW1999FullIndustry-COHORTS-V2-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:selectedIndustrySeed,worldId:'WTW1999FullIndustry-H'+selectedIndustryHorses});
   if(!selected)selected=await reopenPersistent1999Industry(store,{
    seed:19990101,worldId:'WTW1999FullIndustry'});
   if(selected?.status==='READY'){
    fullIndustryManifest=selected.manifest;
    industryDirectory=await readPersistent1999Directory(store,fullIndustryManifest);
    activeWorldCareer=await resumeCanonicalRun(store,fullIndustryManifest);
    await browseFullIndustry(0,'directory');
    notice=activeWorldCareer?'Saved gameplay test career resumed at '+
     activeWorldCareer.run.clock.date+'.':'Saved world verified and ready.';
   }else if(selected?.status==='GENERATING'){
    notice='January 1999 world creation was interrupted. Select CREATE / RESUME FULL INDUSTRY.';
   }
  }catch(error){
   notice='1999 world could not be verified: '+String(error.message||error);
  }finally{store.close()}
  await refresh();
 }
 catch(error){
  const root=modal();root.innerHTML='<section class="wtw-cc-panel" role="dialog">'+
   '<button data-cc-action="close">CLOSE</button><h2>CAREER STORAGE UNAVAILABLE</h2><p>'+
   esc(String(error.message||error))+'</p><p>Your existing game and saves have not been changed.</p></section>';
  root.hidden=false;
 }
}
/**
 * Full-industry preparation uses its own storage; gameplay activation uses the
 * same canonical engine as the installed career.
 */
async function prepareFictionalIndustry(options){
 return createIndustryInWorker(options,options.onProgress,options.onStage);
}
let industryWorkerRequestId=0;
function createIndustryInWorker(options,onProgress=()=>{},onStage=()=>{}){
 if(typeof Worker!=='function')return Promise.reject(Error(
  'This app cannot start the background 1999 world builder; update to the current desktop build'));
 const worker=new Worker('/next/1999-industry-bootstrap-worker.mjs?rev=responsive-genesis-v1',
  {type:'module'});
 const id=++industryWorkerRequestId;
 return new Promise((resolve,reject)=>{
  let settled=false;
  const finish=(error,value)=>{
   if(settled)return;settled=true;worker.terminate();
   if(error)reject(error);else resolve(value);
  };
  worker.addEventListener('message',event=>{
   const message=event.data;
   if(message?.id!==id)return;
   if(message.type==='STAGE'){onStage(message.message);return}
   if(message.type==='PROGRESS'){onProgress(message);return}
   if(message.type==='COMPLETE'){finish(null,message.manifest);return}
   if(message.type==='ERROR')finish(Error(message.message+'\n'+message.stack));
  });
  worker.addEventListener('error',event=>finish(Error(
   'The background world builder failed: '+(event.message||'unknown worker error'))));
  worker.addEventListener('messageerror',()=>finish(Error(
   'The background world builder returned an unreadable response')));
  worker.postMessage({type:'CREATE_1999_INDUSTRY',id,
   seed:options.seed??19990101,worldId:options.worldId??'WTW1999FullIndustry',
   targetOpeningHorses:options.targetOpeningHorses??null,
   batchSize:options.batchSize??1000});
 });
}
async function saveFictionalIndustryCareer(manifest,run){
 const store=await open1999IndustryDatabase();
 try{return await savePersistent1999CareerRun(store,manifest,run)}
 finally{store.close()}
}
async function readFictionalIndustryCareer(manifest,runId){
 const store=await open1999IndustryDatabase();
 try{return await loadPersistent1999CareerRun(store,manifest,runId)}
 finally{store.close()}
}
window.WTWCompactCareerManager=Object.freeze({open,listSlots,storeGame,
 editSavedWorldEntity,exportCareerWorldChangesForReview,
 restoreGame,exportSlot,importFile,dbName:DB_NAME,
 prepareFictionalIndustry,saveFictionalIndustryCareer,
 readFictionalIndustryCareer,sharedCareerBytes,importSharedCareerFile,
 bootstrapBundledCareer});
if(window.WTWDesktop?.runtime==='windows-desktop'&&!window.WTWDesktop.smokeMode){
 window.WTWDesktopCareerBootstrapPromise=bootstrapBundledCareer().catch(error=>{
  console.error('Bundled full-world career startup failed',error);
  return {error:String(error?.message||error)};
 });
}
