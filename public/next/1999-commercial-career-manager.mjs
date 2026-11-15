/**
 * Wire to Wire — commercial local-first career manager.
 *
 * No cloud account or paid storage is required. IndexedDB stores compact,
 * checksummed career deltas, not generated horses. Existing 1999 localStorage
 * saves are NOT deleted or changed. Supports portable .wtwsave files.
 */
import {encodeCareerSave,decodeCareerSave,packCareerFile,unpackCareerFile}
 from '/1999/engine/compact-career.mjs';
import {open1999IndustryDatabase,createPersistent1999Industry,
 savePersistent1999CareerRun,loadPersistent1999CareerRun,
 verifyPersistent1999WorldOpen,reopenPersistent1999Industry}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {TRACK_PROGRAM_1999} from '/next/1999-track-program.mjs';
import {createFictionalWorldNameEngine}
 from '/1999/engine/fictional-world-name-engine.mjs';
import {INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT}
 from '/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {readPersistent1999HorseProfile,readPersistent1999IndustryBatch,
 readPersistent1999Directory,findPersistent1999Person}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {openPersistent1999GameCareer} from '/1999/engine/fictional-industry-game-world-bridge-1999.mjs';
import {dispatchGameCommand} from '/1999/game/kernel.js';
import {gameRaceProgram,supported1999RaceClass,raceEligibility}
 from '/1999/game/racing-1999.js';
import {validateGameRun} from '/1999/game/state.js';

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
  population:a.worldProfile?.population??a.population??73
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
function selectedWorldSizePercent(){
 const value=Number(modal().querySelector('[data-cc="world-size-percent"]')?.value||
  fullIndustryManifest?.worldSizePercent||100);
 if(!Number.isInteger(value)||value<1||value>INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT)
  throw Error('World size must be a whole-number scale from 1 to '+
   INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT+' percent');
 return value;
}
let fullIndustryManifest=null;
let activeWorldCareer=null;
let industryBrowsePage=0,industryBrowseHtml='',industryBrowseKind='horseBatches';
let industryDirectory=[];
async function industryDirectories(seed=19990101,worldSizePercent=100){
 const response=await fetch('/data/track-geography-v33.json');
 if(!response.ok)throw Error('Bundled 1999 track geography unavailable');
 const geo=await response.json();
 const geoById=new Map((geo.tracks||[]).map(g=>[g.id,g]));
 const allTracks=Object.values(TRACK_PROGRAM_1999)
  .filter(t=>t.playableIn1999!==false&&t.trackOperating==='OPEN_1999')
  .map(t=>{
   const g=geoById.get(t.id);
   if(!g?.city_locality||!g?.state_province_region||!g?.country)
    throw Error('Missing local foaling/racing geography for '+t.id);
   return {id:t.id,name:t.name,location:{city:g.city_locality,
    region:g.state_province_region,country:g.country,
    metro:g.metro_or_subregion||null,circuit:g.macro_circuit||null},
    physicalTrackId:t.physicalTrackId||t.id,
    venueType:t.venueType||'PHYSICAL_RACECOURSE',
    physicalFacilityStatus:t.physicalFacilityStatus||'STANDALONE_FACILITY',
    geographyProvenance:g.geography_status};
  });
 if(!allTracks.length)throw Error('No approved operating 1999 tracks');
 // Reuse the established 1999 organization identity engine, never fabricate
 // track-prefix placeholders. Permanent world IDs remain unchanged.
 if(!Number.isInteger(worldSizePercent)||worldSizePercent<1||
  worldSizePercent>INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT)
  throw Error('Choose a world size from 1% to '+
   INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT+'%');
 const scale=worldSizePercent/100;
 const trackCount=Math.min(allTracks.length,Math.max(2,
  Math.ceil(allTracks.length*scale)));
 const selectedIndexes=new Set(Array.from({length:trackCount},(_,i)=>
  Math.round(i*(allTracks.length-1)/Math.max(1,trackCount-1))));
 const tracks=allTracks.filter((_,i)=>selectedIndexes.has(i));
 const farmCount=Math.max(tracks.length,Math.ceil(tracks.length*4*scale));
 const ownerCount=Math.max(tracks.length*2,Math.ceil(tracks.length*10*scale));
 const generated=createFictionalWorldNameEngine({
  worldId:'WTW1999IndustryDirectory',seed,year:1999,
  roles:{},owners:ownerCount,
  facilities:{generalFarms:farmCount,studFarms:0,nurseries:0,
   bloodstockFarms:0,breakingTraining:0},
  protectedNames:tracks.map(t=>t.name)
 });
 if(generated.owners.length!==ownerCount||
  generated.farms.length!==farmCount)
  throw Error('1999 approved organization name generator returned an incomplete directory');
 const farms=Array.from({length:farmCount},(_,index)=>{
  const t=tracks[index%tracks.length],named=generated.farms[index];
  return {id:'O-FICTIONAL-FARM-'+t.id+'-'+String(1+Math.floor(index/tracks.length)).padStart(2,'0'),
   name:named.name,location:t.location,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 });
 const owners=Array.from({length:ownerCount},(_,index)=>{
  const t=tracks[index%tracks.length],named=generated.owners[index];
  return {id:'O-FICTIONAL-OWNER-'+t.id+'-'+String(1+Math.floor(index/tracks.length)).padStart(2,'0'),
   name:named.name,location:t.location,
   ownershipArchetype:named.ownershipArchetype,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 });
 return {tracks,farms,owners};
}
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
   '<div class="wtw-cc-slot"><strong>'+esc(e.name||e.id)+'</strong> · '+
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
 (manifest.worldSizePercent??100)}
async function persistCanonicalRun(){
 if(!activeWorldCareer)return;
 const store=await open1999IndustryDatabase();
 try{await savePersistent1999CareerRun(store,activeWorldCareer.manifest,{
  runId:activeWorldCareer.run.run_id,gameDate:activeWorldCareer.run.clock.date,
  player:activeWorldCareer.run.player,
  changes:{canonicalRun:activeWorldCareer.run},
  version:Math.max(1,activeWorldCareer.run.revision+1)})}
 finally{store.close()}
}
async function resumeCanonicalRun(store,manifest){
 const saved=await loadPersistent1999CareerRun(store,manifest,canonicalRunId(manifest));
 if(!saved?.changes?.canonicalRun)return null;
 const career=await openPersistent1999GameCareer(store,manifest,{
  runId:canonicalRunId(manifest),operationId:saved.player.operation_id});
 validateGameRun(saved.changes.canonicalRun,career.world);
 return {...career,run:saved.changes.canonicalRun,manifest};
}
async function startCanonicalRun(){
 if(!fullIndustryManifest||fullIndustryManifest.status!=='COMPLETE')
  throw Error('Create or open a completed world first');
 const store=await open1999IndustryDatabase();
 try{
  activeWorldCareer=await openPersistent1999GameCareer(store,fullIndustryManifest,
   {runId:canonicalRunId(fullIndustryManifest)});
  activeWorldCareer.manifest=fullIndustryManifest;
  await persistCanonicalRun();
 }finally{store.close()}
 notice='TEST CAREER READY · '+fmt(activeWorldCareer.playableHorseCount)+
  ' owned runners at '+activeWorldCareer.homeTrackId+'.';
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
  state.runtime.registered_horses.by_id[official.results[0].horse_id]?.registered_name:
  null;
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
 const root=modal();
 const current=config().current(),slots=await listSlots();
 const saved=slots.map(x=>'<div class="wtw-cc-slot"><div><strong>'+esc(x.name)+'</strong>'+
  '<small>'+esc(x.date)+' · '+esc('Existing save')+
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
  '<div class="wtw-cc-current">CURRENT INSTALLED SAVE · SEED '+esc(current.seed)+
   ' · new test careers use the selected world size</div>'+
  '<div class="wtw-cc-section"><h3>NEW CAREER WORLD — CHOOSE YOUR SIZE · FULL FICTIONAL 1999 INDUSTRY</h3>'+
  '<p>Choose a custom world scale. Horse cohorts, breeding stock, personnel, owners, farms and the geographically distributed track circuit scale together. 100% is the standard world; larger settings support a massive world.</p>'+
  '<label>WORLD SIZE SCALE (% OF STANDARD)<input data-cc="world-size-percent" type="number" min="1" max="'+INDUSTRY_ECOSYSTEM_MAX_SIZE_PERCENT+'" step="1" value="'+esc(fullIndustryManifest?.worldSizePercent??100)+'"></label>'+
  '<label>WORLD SEED<input data-cc="seed" type="number" min="1" max="4294967295" step="1" value="'+esc(current.seed)+'"></label>'+
  '<div class="wtw-cc-actions"><button data-cc-action="open-existing-industry">OPEN SAVED WORLD AT THIS SIZE</button>'+
  '<button data-cc-action="open-full-industry">CREATE / RESUME WORLD AT THIS SIZE</button></div>'+
  '<p data-cc="industry-progress" role="status" aria-live="polite">'+
  (busy?'Preparing the full world…':'Opening-world records are stored on this device.')+'</p>'+
  (fullIndustryManifest?'<p>WORLD STORED · '+fmt(fullIndustryManifest.horseCount)+
   ' horses · '+fmt(fullIndustryManifest.personCount)+' personnel · '+
   fmt(fullIndustryManifest.worldSizePercent??100)+'% OF FULL · '+
   esc(fullIndustryManifest.status)+'</p>'+
   '<div class="wtw-cc-section"><h3>PLAYABLE GAMEPLAY TEST</h3>'+
   (activeWorldCareer?'<p>ACTIVE · '+esc(activeWorldCareer.run.clock.date)+
    ' · '+fmt(activeWorldCareer.playableHorseCount)+' player runners · '+
    esc(activeWorldCareer.homeTrackId)+' · race engine connected</p>'+
    '<div class="wtw-cc-actions"><button data-cc-action="open-next-test-race">OPEN NEXT TEST RACE / ENTER TWO</button>'+
    '<button data-cc-action="advance-test-day" class="primary">ADVANCE ONE GAME DAY</button></div>':
    '<p>Create a local test career from this exact world census. It uses the existing game clock, horse care, jockey booking and race settlement systems.</p>'+
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
   ' · 1999 COVERINGS BOOKED '+fmt(fullIndustryManifest.coveringCount)+
   ' · SCHEDULED RACE DAYS '+fmt(fullIndustryManifest.scheduledCards)+
   ' · RACES '+fmt(fullIndustryManifest.scheduledRaces)+'</p>'+
   '<div class="wtw-cc-actions"><button data-cc-action="industry-prev">PREVIOUS 20</button>'+
   '<button data-cc-action="industry-next">NEXT 20</button></div>'+industryBrowseHtml:'')+
  '</div>'+
  '<p class="wtw-cc-warning">The generated world is stored separately from existing careers. Start a gameplay test career to use the canonical game clock and race engine with horses from this world.</p>'+
  '<div class="wtw-cc-section"><h3>COMPACT SAVES · '+slots.length+' SLOTS</h3>'+
  '<p>Local device only. No account, monthly fee or cloud storage required. Portable .wtwsave files have checksums and gzip compression where supported. Total compact-save budget: 512 MB across slots.</p>'+
  '<div class="wtw-cc-actions"><input data-cc="save-name" maxlength="80" placeholder="Name current career" value="1999 Career"/>'+
  '<button data-cc-action="save" class="primary">SAVE CURRENT CAREER</button>'+
  '<button data-cc-action="import">IMPORT CAREER</button>'+
  '<input type="file" data-cc="import-file" accept=".wtwsave,.json,application/octet-stream,application/json" hidden>'+
  '</div>'+
  (notice?'<p class="wtw-cc-notice" role="status">'+esc(notice)+'</p>':'')+
  '<div class="wtw-cc-slots">'+(saved||'<p>No compact careers yet. Saving creates a portable, compressed career delta.</p>')+'</div>'+
  quota+'</div><footer>New size-selected worlds and test careers are stored separately from the currently installed save.</footer></section>';
 root.hidden=false;
}
async function perform(action,element){
 if(action==='close'){modal().hidden=true;return}
 if(action==='import'){modal().querySelector('[data-cc="import-file"]').click();return}
 if(action==='start-test-career'){await startCanonicalRun();return}
 if(action==='advance-test-day'){await advanceCanonicalRun();return}
 if(action==='open-next-test-race'){await openNextTestRace();return}
 if(action==='open-existing-industry'){
  const seed=Number(modal().querySelector('[data-cc="seed"]')?.value||19990101);
  const worldSizePercent=selectedWorldSizePercent();
  const db=await open1999IndustryDatabase();
  try{
   const reopened=await reopenPersistent1999Industry(db,{
    seed,worldId:'WTW1999FullIndustry',worldSizePercent});
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
  notice='Saved '+(reopened.manifest.worldSizePercent??100)+'% world opened and verified. Existing career unchanged.';
  return;
 }
 if(action==='open-full-industry'){
  notice='Generating the complete industry. This may take several minutes.';
  const seed=Number(modal().querySelector('[data-cc="seed"]')?.value||19990101);
  const worldSizePercent=selectedWorldSizePercent();
  const progress=modal().querySelector('[data-cc="industry-progress"]');
  fullIndustryManifest=await prepareFictionalIndustry({
   seed,worldId:'WTW1999FullIndustry',worldSizePercent,
   ...(await industryDirectories(seed,worldSizePercent)),batchSize:2000,
   yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0)),
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
  await browseFullIndustry(0);
  notice='1999 world created at '+worldSizePercent+'% and census verified. Existing career unchanged.';
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
   const reopened=await reopenPersistent1999Industry(store,{
    seed:19990101,worldId:'WTW1999FullIndustry'});
   if(reopened?.status==='READY'){
    fullIndustryManifest=reopened.manifest;
    industryDirectory=await readPersistent1999Directory(store,fullIndustryManifest);
    activeWorldCareer=await resumeCanonicalRun(store,fullIndustryManifest);
    await browseFullIndustry(0,'directory');
    notice=activeWorldCareer?'Saved gameplay test career resumed at '+
     activeWorldCareer.run.clock.date+'.':'Saved January 1999 world verified and ready.';
   }else if(reopened?.status==='GENERATING'){
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
 * Full-industry preparation uses its own storage and does not replace the
 * running 73-horse founding career. Play activation requires engine compatibility.
 */
async function prepareFictionalIndustry(options){
 const store=await open1999IndustryDatabase();
 try{return await createPersistent1999Industry({...options,store})}
 finally{store.close()}
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
 restoreGame,exportSlot,importFile,dbName:DB_NAME,
 prepareFictionalIndustry,saveFictionalIndustryCareer,
 readFictionalIndustryCareer});
