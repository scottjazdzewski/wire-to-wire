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
import {readPersistent1999HorseProfile,readPersistent1999IndustryBatch,
 readPersistent1999Directory}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';

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
function inputProfile(){
 const dom=modal();
 return config().normalize({
  population:Number(dom.querySelector('[data-cc="population"]')?.value||73),
  seed:Number(dom.querySelector('[data-cc="seed"]')?.value||19990101),
  mode:dom.querySelector('[data-cc="mode"]')?.value||'FOUNDING_1999'
 });
}
let fullIndustryManifest=null;
let industryBrowsePage=0,industryBrowseHtml='',industryBrowseKind='horseBatches';
let industryDirectory=[];
function industryDirectories(seed=19990101){
 const tracks=Object.values(TRACK_PROGRAM_1999)
  .filter(t=>t.playableIn1999!==false&&t.trackOperating==='OPEN_1999')
  .map(t=>({id:t.id,name:t.name,location:t.location??{}}));
 if(!tracks.length)throw Error('No approved operating 1999 tracks');
 // Reuse the established 1999 organization identity engine, never fabricate
 // track-prefix placeholders. Permanent world IDs remain unchanged.
 const farmCount=tracks.length*4,ownerCount=tracks.length*10;
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
 const farms=tracks.flatMap((t,trackIndex)=>Array.from({length:4},(_,i)=>{
  const named=generated.farms[trackIndex*4+i];
  return {id:'O-FICTIONAL-FARM-'+t.id+'-'+String(i+1).padStart(2,'0'),
   name:named.name,location:t.location,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
 const owners=tracks.flatMap((t,trackIndex)=>Array.from({length:10},(_,i)=>{
  const named=generated.owners[trackIndex*10+i];
  return {id:'O-FICTIONAL-OWNER-'+t.id+'-'+String(i+1).padStart(2,'0'),
   name:named.name,location:t.location,
   ownershipArchetype:named.ownershipArchetype,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
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
    .map(([k,v])=>k+': '+v).join(' / '))+'</div>').join('');
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
     (kind==='horseBatches'?'<button data-cc-action="inspect-listed-horse" data-id="'+
      esc(h.id)+'">PROFILE</button>':'')+'</div>';
   }).join('')+'</div>';
 }finally{store.close()}
}
async function inspectFullIndustryHorse(horseId){
 if(!fullIndustryManifest)throw Error('Open the full industry first');
 const store=await open1999IndustryDatabase();
 try{return await readPersistent1999HorseProfile(store,fullIndustryManifest,horseId)}
 finally{store.close()}
}
let busy=false,notice='';
async function refresh(){
 const root=modal();
 const current=config().current(),slots=await listSlots();
 const saved=slots.map(x=>'<div class="wtw-cc-slot"><div><strong>'+esc(x.name)+'</strong>'+
  '<small>'+esc(x.date)+' · '+fmt(x.profile?.population)+' horses · '+
   esc('Founding 1999')+
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
  '<div class="wtw-cc-current">CURRENT WORLD · '+fmt(current.population)+' HORSES · '+
   esc('FOUNDING 1999')+
   ' · SEED '+esc(current.seed)+'</div>'+
  '<div class="wtw-cc-section"><h3>FULL FICTIONAL 1999 INDUSTRY — WORLD EXPLORER</h3>'+
  '<p>Generate and reopen the large opening-world registry without replacing your current career. Horse and personnel names and some farm/owner identities still await approved naming inputs. Live race gameplay is not yet activated for this world.</p>'+
  '<div class="wtw-cc-actions"><button data-cc-action="open-existing-industry">OPEN SAVED 1999 WORLD</button>'+ 
  '<button data-cc-action="open-full-industry">CREATE / RESUME FULL INDUSTRY</button></div>'+ 
  '<p data-cc="industry-progress" role="status" aria-live="polite">'+
  (busy?'Preparing the full world…':'Opening-world records are stored on this device.')+'</p>'+
  (fullIndustryManifest?'<p>WORLD STORED · '+fmt(fullIndustryManifest.horseCount)+
   ' horses · '+fmt(fullIndustryManifest.personCount)+' personnel · '+
   esc(fullIndustryManifest.status)+'</p>'+
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
  '<div class="wtw-cc-section"><h3>NEW CAREER / START FROM SCRATCH</h3>'+
  '<p>1999 founding foundation (development): 73 protected breeding horses, no registered racing horses and no generated industry. A complete fictional population and its believable history are still in engineering. This action creates a separate named career from the available foundation; it does not claim to generate the future full world.</p>'+
  '<div class="wtw-cc-grid"><label>NEW CAREER NAME<input data-cc="new-name" type="text" maxlength="80" value="New 1999 Founding Career"/></label>'+
  '<label>APPROVED BREEDING HORSES<input data-cc="population" type="number" min="73" max="73" step="1" value="73" readonly/></label>'+ 
  '<label>WORLD SOURCE<select data-cc="mode"><option value="FOUNDING_1999" selected>Founding 1999 (source only)</option></select></label>'+
  '<label>WORLD SEED<input data-cc="seed" type="number" min="1" max="4294967295" step="1" value="'+esc(current.seed)+'"/></label></div>'+
  '<div class="wtw-cc-actions">'+config().presets.map(p=>'<button data-cc-action="preset" data-population="'+p.population+'" data-mode="'+(p.mode||'CANON_ANCHORED_TEST')+'">'+esc(p.label)+'</button>').join('')+'</div>'+
  '<p class="wtw-cc-warning">Founding 1999 scenario only (73 breeding horses). Full fictional 1999 world genesis and reusable customized world templates are not yet available. The current career will be saved to a new backup slot first.</p>'+
  '<button data-cc-action="new-world" class="primary">CREATE &amp; SAVE NEW CAREER</button></div>'+
  '<div class="wtw-cc-section"><h3>COMPACT SAVES · '+slots.length+' SLOTS</h3>'+
  '<p>Local device only. No account, monthly fee or cloud storage required. Portable .wtwsave files have checksums and gzip compression where supported. Total compact-save budget: 512 MB across slots.</p>'+
  '<div class="wtw-cc-actions"><input data-cc="save-name" maxlength="80" placeholder="Name current career" value="1999 Career"/>'+
  '<button data-cc-action="save" class="primary">SAVE CURRENT CAREER</button>'+
  '<button data-cc-action="import">IMPORT CAREER</button>'+
  '<input type="file" data-cc="import-file" accept=".wtwsave,.json,application/octet-stream,application/json" hidden>'+
  '</div>'+ 
  (notice?'<p class="wtw-cc-notice" role="status">'+esc(notice)+'</p>':'')+
  '<div class="wtw-cc-slots">'+(saved||'<p>No compact careers yet. Saving creates a portable, compressed career delta.</p>')+'</div>'+
  quota+'</div><footer>Only approved founding-era game saves may be loaded. Old generated populations cannot be restored.</footer></section>';
 root.hidden=false;
}
async function perform(action,element){
 if(action==='close'){modal().hidden=true;return}
 if(action==='preset'){
  const input=modal().querySelector('[data-cc="population"]');
  input.value=String(element.dataset.population);
  const mode=modal().querySelector('[data-cc="mode"]');
  if(mode)mode.value=element.dataset.mode||'CANON_ANCHORED_TEST';
  return;
 }
 if(action==='import'){modal().querySelector('[data-cc="import-file"]').click();return}
 if(action==='open-existing-industry'){
  const seed=Number(modal().querySelector('[data-cc="seed"]')?.value||19990101);
  const db=await open1999IndustryDatabase();
  try{
   const reopened=await reopenPersistent1999Industry(db,{
    seed,worldId:'WTW1999FullIndustry'});
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
  }finally{db.close()}
  await browseFullIndustry(0,'directory');
  notice='Saved 1999 world opened and verified. Existing career unchanged.';
  return;
 }
 if(action==='open-full-industry'){
  notice='Generating the complete industry. This may take several minutes.';
  const seed=Number(modal().querySelector('[data-cc="seed"]')?.value||19990101);
  const progress=modal().querySelector('[data-cc="industry-progress"]');
  fullIndustryManifest=await prepareFictionalIndustry({
   seed,worldId:'WTW1999FullIndustry',...industryDirectories(seed),batchSize:2000,
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
 if(action==='new-world'){
  const profile=inputProfile();
  const careerName=modal().querySelector('[data-cc="new-name"]')?.value?.trim();
  if(!careerName)throw Error('Enter a name for the new career');
  if(!window.confirm('Create and save a separate "'+careerName.slice(0,80)+
   '" career using the 73-horse founding 1999 development foundation? '+
   'This does NOT generate the unfinished full fictional industry. '+
   'The current active career will be backed up first; neither career will be deleted.'))return;
  const backup=await storeGame('Pre-new-world backup · '+new Date().toISOString().slice(0,16),
   captureCurrent());
  const fresh=baselineFor(profile);
  // A separate confirmed career slot must exist BEFORE the active world changes.
  // If disk quota/storage fails here, retain the current active game untouched.
  const created=await storeGame(careerName,fresh);
  window.__WTW_OFFICE_COMMANDS__.dispatch('LOAD_CAREER',fresh);
  notice='Current career preserved as '+backup.name+'; new career saved as '+
   created.name+'.';
  location.reload();return;
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
    await browseFullIndustry(0,'directory');
    notice='Saved January 1999 world verified and available for inspection.';
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
