/**
 * Wire to Wire — commercial local-first career manager.
 *
 * No cloud account or paid storage is required. IndexedDB stores compact,
 * checksummed career deltas, not generated horses. Existing 1999 localStorage
 * saves are NOT deleted or changed. Supports portable .wtwsave files.
 */
import {encodeCareerSave,decodeCareerSave,packCareerFile,unpackCareerFile}
 from '/1999/engine/compact-career.mjs';

const DB_NAME='WireToWireCompactCareersV1',MAIN='wtw1999ManagementStateV1';
const LEGACY='wtw1999NamedGameSavesV1';
const MAX_SLOTS=60;
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
function currentGame(){
 const raw=localStorage.getItem(MAIN);
 let game;try{game=JSON.parse(raw||'null')}catch{}
 if(game?.worldAnchor?.schema!=='WTW_1999_CLEAN_CAREER_V3')
  throw Error('No valid 1999 career is currently active');
 return game;
}
function profileForGame(game){
 const a=game.worldAnchor||{};
 return config().normalize({
  seed:a.worldProfile?.seed??a.seed??19990101,
  mode:a.worldProfile?.mode??a.mode??'CANON_ANCHORED_TEST',
  population:a.worldProfile?.population??a.population??325000
 });
}
function baselineFor(profile){
 const create=window.__WTW_1999_MANAGEMENT__?.createFreshState;
 if(typeof create!=='function')throw Error('Game-state authority not available');
 return create(profile);
}
function captureCurrent(){
 // Existing game engine remains the sole authority for actual game changes.
 const save=[...document.querySelectorAll('.app [data-act]')]
  .find(element=>element.dataset.act==='Save');
 if(save)save.click();
 return currentGame();
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
 localStorage.setItem(MAIN,JSON.stringify(game));
 config().pin(profile);
 localStorage.setItem('wtw1999CleanCareerV3','active');
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
 if(!file||file.size>64*1024*1024+32780)
  throw Error('This save is larger than the supported 64 MB file limit');
 const data=unpackCareerFile(await file.arrayBuffer());
 const profile=config().normalize(data.header.world);
 const game=await decodeCareerSave(data,baselineFor(profile));
 return storeGame(file.name.replace(/\.wtwsave$/i,'').replace(/_/g,' ').slice(0,80),
  game);
}
async function migrateLegacy(){
 let old;try{old=JSON.parse(localStorage.getItem(LEGACY)||'[]')}catch{}
 if(!Array.isArray(old)||!old.length)return 0;
 const slots=await listSlots(),names=new Set(slots.map(x=>x.name.toLowerCase()));
 let migrated=0;
 for(const item of old){
  if(!item?.game?.worldAnchor||!item?.name||
   names.has(String(item.name).toLowerCase()))continue;
  const slot=await storeGame(String(item.name),item.game);
  names.add(slot.name.toLowerCase());migrated++;
 }
 return migrated;
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
  population:Number(dom.querySelector('[data-cc="population"]')?.value||325000),
  seed:Number(dom.querySelector('[data-cc="seed"]')?.value||19990101),
  mode:dom.querySelector('[data-cc="mode"]')?.value||'CANON_ANCHORED_TEST'
 });
}
let busy=false,notice='';
async function refresh(){
 const root=modal();
 const current=config().current(),slots=await listSlots();
 const saved=slots.map(x=>'<div class="wtw-cc-slot"><div><strong>'+esc(x.name)+'</strong>'+
  '<small>'+esc(x.date)+' · '+fmt(x.profile?.population)+' horses · '+
   esc(x.profile?.mode==='FULLY_FICTIONAL_TEST'?'Fictional':'Historical foundation')+
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
   esc(current.mode==='FULLY_FICTIONAL_TEST'?'FICTIONAL':'HISTORICAL FOUNDATION')+
   ' · SEED '+esc(current.seed)+'</div>'+
  '<div class="wtw-cc-section"><h3>NEW WORLD</h3>'+
  '<p>Choose a unique starting world. The population is generated from its seed, not stored as 325,000 profiles.</p>'+
  '<div class="wtw-cc-grid"><label>HORSE POPULATION<input data-cc="population" type="number" min="10000" max="325000" step="1000" value="'+
   current.population+'"/></label>'+
  '<label>WORLD SOURCE<select data-cc="mode"><option value="CANON_ANCHORED_TEST" '+
   (current.mode==='CANON_ANCHORED_TEST'?'selected':'')+'>Historical foundation</option>'+
   '<option value="FULLY_FICTIONAL_TEST" '+(current.mode==='FULLY_FICTIONAL_TEST'?'selected':'')+
   '>Entirely fictional</option></select></label>'+
  '<label>WORLD SEED<input data-cc="seed" type="number" min="1" max="4294967295" step="1" value="'+esc(current.seed)+'"/></label></div>'+
  '<div class="wtw-cc-actions">'+config().presets.map(p=>'<button data-cc-action="preset" data-population="'+p.population+'">'+esc(p.label)+'</button>').join('')+'</div>'+
  '<p class="wtw-cc-warning">World presets scale the population directory and breeding stock. The existing January 1999 race scheduler still uses its original 87,500-horse gameplay scope until lifecycle integration is completed.</p>'+
  '<button data-cc-action="new-world" class="primary">CREATE NEW WORLD (BACK UP CURRENT CAREER FIRST)</button></div>'+
  '<div class="wtw-cc-section"><h3>COMPACT SAVES · '+slots.length+' SLOTS</h3>'+
  '<p>Local device only. No account, monthly fee or cloud storage required. Portable .wtwsave files have checksums and gzip compression where supported.</p>'+
  '<div class="wtw-cc-actions"><input data-cc="save-name" maxlength="80" placeholder="Name current career" value="1999 Career"/>'+
  '<button data-cc-action="save" class="primary">SAVE CURRENT CAREER</button>'+
  '<button data-cc-action="import">IMPORT .WTWSAVE</button>'+
  '<input type="file" data-cc="import-file" accept=".wtwsave,application/octet-stream" hidden>'+
  '<button data-cc-action="migrate">COPY LEGACY SAVES</button></div>'+
  (notice?'<p class="wtw-cc-notice" role="status">'+esc(notice)+'</p>':'')+
  '<div class="wtw-cc-slots">'+(saved||'<p>No compact careers yet. Saving creates a portable, compressed career delta.</p>')+'</div>'+
  quota+'</div><footer>Historical source records remain protected. Old browser saves are not deleted or overwritten when imported.</footer></section>';
 root.hidden=false;
}
async function perform(action,element){
 if(action==='close'){modal().hidden=true;return}
 if(action==='preset'){
  const input=modal().querySelector('[data-cc="population"]');
  input.value=String(element.dataset.population);return;
 }
 if(action==='import'){modal().querySelector('[data-cc="import-file"]').click();return}
 if(action==='save'){
  const name=modal().querySelector('[data-cc="save-name"]').value.trim();
  if(!name)throw Error('Enter a career name');
  const slot=await storeGame(name,captureCurrent());
  notice='Saved '+slot.name+' · '+kb(slot.bytes)+'.';return;
 }
 if(action==='migrate'){
  const count=await migrateLegacy();
  notice=count+' previous saved career(s) copied to compact storage. Originals are preserved.';return;
 }
 if(action==='new-world'){
  const profile=inputProfile();
  if(!window.confirm('Create a new '+fmt(profile.population)+'-horse '+
   (profile.mode==='FULLY_FICTIONAL_TEST'?'fictional':'historical')+
   ' world? The current career will be backed up before it is replaced.'))return;
  const backup=await storeGame('Pre-new-world backup · '+new Date().toISOString().slice(0,16),
   captureCurrent());
  const fresh=baselineFor(profile);
  // New settings take effect only after the confirmed, successful backup.
  localStorage.setItem(MAIN,JSON.stringify(fresh));
  config().pin(profile);
  localStorage.setItem('wtw1999CleanCareerV3','active');
  notice='Previous career backed up as '+backup.name+'.';
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
 try{notice='';await refresh()}
 catch(error){
  const root=modal();root.innerHTML='<section class="wtw-cc-panel" role="dialog">'+
   '<button data-cc-action="close">CLOSE</button><h2>CAREER STORAGE UNAVAILABLE</h2><p>'+
   esc(String(error.message||error))+'</p><p>Your existing game and saves have not been changed.</p></section>';
  root.hidden=false;
 }
}
window.WTWCompactCareerManager=Object.freeze({open,listSlots,storeGame,
 restoreGame,exportSlot,importFile,migrateLegacy,dbName:DB_NAME});
