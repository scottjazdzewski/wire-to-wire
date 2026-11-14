/* Wire to Wire — next-generation playable UI.
 * Adapter only: reads the existing Office DOM and triggers its canonical handlers.
 * Does not create a new simulation, game ledger or save namespace. */
(()=>{
'use strict';
const $=(q,p=document)=>p.querySelector(q), $$=(q,p=document)=>[...p.querySelectorAll(q)];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const approvedBadgeKinds=new Set(["horse","people","farm_stable","track","pedigree","career_record","achievements","reputation","meet_schedule","major_races","connections","history"]);
const badge=kind=>`/assets/profile-badges/v2/wtw_badge_${approvedBadgeKinds.has(kind)?kind:'history'}.png?shield=20261110b`;
const root=document.createElement('div');root.id='wtwNextgen';root.setAttribute('aria-label','Wire to Wire game interface');
const APP={worldEditKey:'',worldEditDraft:null,worldPhotoDraft:undefined,worldEditStatus:'',worldEditBusy:false,savePanelOpen:false,saveDraftName:'',saveError:'',section:'Office',page:'Office',custom:'',filter:'All',msgPage:0,focus:'',outTab:0,detailTab:'Overview',routeId:'',ready:false,activeCase:'opening-stable',paintQueued:false,moreOpen:false,stableSort:'name',stableSortDesc:false,stableFilter:'all',stableAttributeKey:'raw_speed',stableAttributeSort:'raw_speed',stableAttributeDesc:true,worldAttributeKey:'',stableMode:'all',stableSearch:'',directorySort:'name',directorySortDesc:false,directoryFilter:'all',directoryMode:'all',directorySearch:'',directoryHorseItems:[],racingMode:'meets',racingTrack:'',racingDate:'',racingCalendarOpen:false,departmentSearch:'',departmentSortKey:'',departmentSortDesc:false,departmentPageIndex:0,departmentScrollLimit:160,departmentScrollReset:false,departmentAuction:'',departmentCompany:'',salesWatched:{},departmentVisible:[],networkSort:'best',networkRole:'all',networkPage:0,networkFocus:'',stakeSort:'date',stakeSortDesc:false,searchQuery:'',searchIndex:[],searchType:'all',searchSort:'name',searchPage:0};
let officePhotoIndex=null; // Optional UI-only media references; no duplication of historical/game entities.
let athleteAttributeCatalog=null; // One versioned shared character-definition file; no new horse ratings.

let personGeographyProjection=null; // Source-linked read-only UI projection of approved Participant_Geography.
let personGeographyLoading=false;
function loadPersonGeography(){
 if(personGeographyProjection||personGeographyLoading)return;
 personGeographyLoading=true;
 fetch('/data/wtw-1999-approved-person-geography-v1.json?rev=small1999-20261113',{credentials:'same-origin',cache:'force-cache'})
 .then(r=>{if(!r.ok)throw Error('People geography unavailable');return r.json()})
 .then(data=>{
  if(data?.schema==='WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1'&&Array.isArray(data.people)&&data.person_count===data.people.length){
    personGeographyProjection=data;schedulePaint(20);
  }
 })
 .catch(()=>{/* Preserve unknown geography; never invent nationality, hometown or base. */})
 .finally(()=>{personGeographyLoading=false});
}
function personGeographyRecord(source,name){
 if(!personGeographyProjection)return null;
 const id=source?.dataset.personId?.trim();
 // Never guess a person by name: all 1999 geography is exact ID and name.
 return id?personGeographyProjection.people.find(x=>x.id===id&&x.name===name)||null:null;
}

const genericDeskPhoto='/assets/office/approved-office-photo.jpg';
let organizationLogoIndex=null; // UI-only logo refs, never organizational authority.
const isClean1999=()=>window.__WTW_1999_MANAGEMENT__?.worldProfile?.mode==='FOUNDING_1999';

const tabmap={Office:['Overview','Messages','Decisions','Calendar','News','Reports','Career'],History:['Race Results','Horses','People & Farms','Facilities & Tracks','Historical Calendar','Coverage'],Stable:['Overview','Horses','Training','Health','Race Plans','Barns'],Racing:['Overview','Calendar','Entries','Results','Stakes','Race Planning'],Breeding:['Overview','Stallions','Broodmares','Foals','Pedigrees','Stud Farms'],Sales:['Overview','Auctions','Sale Calendar','Sale Companies','Catalogs','Watchlist','Private Offers'],Personnel:['Overview','Trainers','Jockeys','Owners','Principals','Staff'],Facilities:['Overview','Stud Farms','Training Centers','Breaking Facilities','Racing Stables','Farms','Trainer Barns'],Tracks:['Overview','Active Meets','All Tracks','Stakes'],Finances:['Overview','Cash Flow','Operating Costs','Budgets'],World:['Overview','1999 Horses','People','Organizations','Tracks','Meets','Major Races','News']};
const actions={Office:'Office Overview',Stable:'Stable',Racing:'Race Calendar',Sales:'Sales',World:'World'};
const officeMenu={Overview:'Office Overview',Messages:'Filter All',Decisions:'Open move history',Calendar:'Open Race Calendar',News:'News',Reports:'Open move history',Career:'Open move history'};
const state=()=>{try{return JSON.parse(localStorage.getItem((window.__WTW_1999_MANAGEMENT__?.saveKey||'wtw1999ManagementStateV1'))||'{}')}catch{return {}}};
/* Named saves are snapshots of the canonical Office game state, never a new
   simulation ledger. World Editor patches and media remain independently stored. */
const NAMED_SAVE_KEY=window.__WTW_1999_MANAGEMENT__?.namedSaveKey||'wtwNamedGameSavesV1';
const valid1999Save=game=>!window.__WTW_1999_MANAGEMENT__||(game?.worldAnchor?.schema===window.__WTW_1999_MANAGEMENT__.schema&&game?.worldAnchor?.startDate==='1999-01-01'&&/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(game?.date||'')&&game.date>='1999-01-01');
function namedSaves(){
 try{const rows=JSON.parse(localStorage.getItem(NAMED_SAVE_KEY)||'[]');
  return Array.isArray(rows)?rows.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&x.game&&typeof x.game==='object'&&valid1999Save(x.game)):[];
 }catch{return []}
}
function namedSaveWrite(rows){localStorage.setItem(NAMED_SAVE_KEY,JSON.stringify(rows))}
function namedSaveError(message){APP.saveError=message;paint()}
function namedSaveCapture(){
 const native=$('.app [data-act]').find(n=>n.dataset.act==='Save');
 if(!native)throw Error('The original game save control is unavailable.');
 native.click(); // Canonical Office writes its current simulation state synchronously.
 const payload=JSON.parse(localStorage.getItem((window.__WTW_1999_MANAGEMENT__?.saveKey||'wtw1999ManagementStateV1'))||'null');
 if(!payload||typeof payload!=='object'||!payload.version||!payload.date||!valid1999Save(payload))
  throw Error('Only a clean Jan 1, 1999 world career can be saved here.');
 return payload;
}
function namedSavePanel(){
 const rows=namedSaves().sort((a,b)=>String(b.updatedAt||'').localeCompare(String(a.updatedAt||'')));
 const html=rows.map(slot=>'<div class="ng-save-slot"><div class="ng-save-slot-info"><strong>'+
  safe(slot.name)+'</strong><small>GAME '+safe(slot.game?.date||'Unknown date')+
  ' · SAVED '+safe(slot.updatedAt?new Date(slot.updatedAt).toLocaleString():'Unknown')+
  '</small></div><div class="ng-save-slot-actions">'+
  '<button type="button" data-ng="named-load" data-val="'+safe(slot.id)+'" class="primary">LOAD</button>'+
  '<button type="button" data-ng="named-rename" data-val="'+safe(slot.id)+'">RENAME</button>'+
  '<button type="button" data-ng="named-overwrite" data-val="'+safe(slot.id)+'">OVERWRITE</button>'+
  '<button type="button" data-ng="named-delete" data-val="'+safe(slot.id)+'" aria-label="Delete save '+safe(slot.name)+'">DELETE</button>'+
  '</div></div>').join('');
 return '<div class="ng-save-shade"><section class="ng-save-dialog" role="dialog" aria-modal="true" aria-label="Save and load game">'+
  '<header><div><small>WIRE TO WIRE / CAREER MANAGEMENT</small><h2>SAVE & LOAD GAME</h2></div>'+
  '<button type="button" data-ng="save-close" aria-label="Close save manager">✕ CLOSE</button></header>'+
  '<div class="ng-save-create"><label for="ngNamedSaveName">NAME NEW SAVE</label>'+
  '<input id="ngNamedSaveName" type="text" maxlength="60" placeholder="e.g. 1999 World Test — Opening Day" value="'+safe(APP.saveDraftName)+'"/>'+
  '<button type="button" data-ng="named-create" class="primary">SAVE NEW GAME</button></div>'+
  (APP.saveError?'<p class="ng-save-error" role="status">'+safe(APP.saveError)+'</p>':'')+
  '<div class="ng-save-list"><h3>YOUR NAMED SAVES <span>'+rows.length+' SLOTS</span></h3>'+
  (html||'<p class="ng-save-empty">No named saves yet. Give this career a name to save it.</p>')+'</div>'+
  '<footer><span>Stored in this browser. Loading replaces current progress. 1999 World record edits are backed up separately.</span>'+
  '<button type="button" data-ng="named-backup">EXPORT ALL SAVES</button>'+
  '<button type="button" data-ng="named-import">IMPORT SAVES</button>'+
  '<input type="file" id="ngNamedSavesImport" accept="application/json,.json" hidden/>'+
  '<button type="button" data-ng="named-export-current">EXPORT CURRENT GAME</button>'+
  '<button type="button" data-ng="commercial-career-open" class="primary">WORLD SETUP & COMPACT SAVES</button></footer>'+
  '</section></div>';
}
function namedSaveCreate(){
 const name=APP.saveDraftName.trim(),rows=namedSaves();
 if(!name)return namedSaveError('Enter a name so you can recognize this save later.');
 if(rows.some(x=>x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))return namedSaveError('That name is already in use. Rename the existing slot or choose another.');
 try{
  const game=namedSaveCapture(),now=new Date().toISOString();
  rows.unshift({id:'slot-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8),name,game,createdAt:now,updatedAt:now});
  namedSaveWrite(rows);APP.saveDraftName='';APP.saveError='';paint();
 }catch(e){namedSaveError('SAVE FAILED: '+(e?.message||'Browser storage unavailable'))}
}
function namedSaveHandle(action,id){
 const rows=namedSaves(),index=rows.findIndex(x=>x.id===id);
 if(index<0)return namedSaveError('This save is no longer available.');
 const slot=rows[index];
 if(action==='named-rename'){
  const next=window.prompt('Rename saved game:',slot.name);
  if(next===null)return;
  const name=next.trim().slice(0,60);
  if(!name)return namedSaveError('Save names cannot be blank.');
  if(rows.some(x=>x.id!==id&&x.name.toLocaleLowerCase()===name.toLocaleLowerCase()))
   return namedSaveError('Another save already has that name.');
  rows[index]={...slot,name};
 }else if(action==='named-delete'){
  if(!window.confirm('Permanently delete the save "'+slot.name+'"?'))return;
  rows.splice(index,1);
 }else if(action==='named-overwrite'){
  if(!window.confirm('Replace "'+slot.name+'" with the current game?'))return;
  try{rows[index]={...slot,game:namedSaveCapture(),updatedAt:new Date().toISOString()}}
  catch(e){return namedSaveError('OVERWRITE FAILED: '+(e?.message||'Could not capture game'))}
 }else if(action==='named-load'){
  if(!window.confirm('Load "'+slot.name+'"? Current unsaved progress will be replaced.'))return;
  try{
   // The original Office restores the dedicated 1999 save at startup; keep its native
   // migrations, chronology and decision application as the single authority.
   localStorage.setItem((window.__WTW_1999_MANAGEMENT__?.saveKey||'wtw1999ManagementStateV1'),JSON.stringify(slot.game));
   window.location.reload();
  }catch(e){namedSaveError('LOAD FAILED: '+(e?.message||'Storage is unavailable'))}
  return;
 }
 try{namedSaveWrite(rows);APP.saveError='';paint()}
 catch(e){namedSaveError('CHANGE FAILED: '+(e?.message||'Browser storage unavailable'))}
}
function namedSaveDownload(fileName,payload){
 const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
 const a=document.createElement('a');a.href=url;a.download=fileName;a.click();
 setTimeout(()=>URL.revokeObjectURL(url),1000);
}
async function namedSaveImport(file){
 if(!file)return;
 try{
  const data=JSON.parse(await file.text());
  if(data?.schema!=='WTW_NAMED_SAVE_SLOTS_V1'||!Array.isArray(data.slots))
   throw Error('Not a Wire to Wire named-saves backup.');
  const imported=data.slots.filter(x=>x&&typeof x.id==='string'&&typeof x.name==='string'&&x.game?.version&&x.game?.date&&valid1999Save(x.game));
  if(imported.length!==data.slots.length||imported.length>100)throw Error('One or more save slots are invalid.');
  const current=namedSaves(),ids=new Set(current.map(x=>x.id));
  const names=new Set(current.map(x=>x.name.toLocaleLowerCase()));
  let added=0;
  for(const slot of imported){
   if(ids.has(slot.id)||names.has(slot.name.toLocaleLowerCase()))continue;
   current.push({id:slot.id,name:slot.name.slice(0,60),game:slot.game,
    createdAt:slot.createdAt||new Date().toISOString(),updatedAt:slot.updatedAt||new Date().toISOString()});
   ids.add(slot.id);names.add(slot.name.toLocaleLowerCase());added++;
  }
  namedSaveWrite(current);APP.saveError=added+' saved game(s) imported. Choose LOAD to play one.';paint();
 }catch(e){namedSaveError('IMPORT FAILED: '+(e?.message||'Invalid file'))}
}
const originalAct=(act)=>{const o=$$('.app [data-act]').find(n=>n.dataset.act===act);return o||null;};
function bridgeNode(node){if(!node)return;node.click(); schedulePaint(15)}
function syntheticAction(el){const dummy=el.cloneNode(true); dummy.style.display='none'; document.body.appendChild(dummy);dummy.click();dummy.remove();schedulePaint(15)}
// One browser-history entry per custom UI destination; original Office
// profile and department routes already push their own history entries.
function pushUIHistory(view){
 const p=new URLSearchParams(location.search);
 for(const key of ['page','name','track','ui'])p.delete(key);
 if(view)p.set('ui',view);
 const url=location.pathname+(p.toString()?'?'+p.toString():'');
 if(url!==location.pathname+location.search)window.history.pushState({wtwUI:view||'office'},'',url);
}
function openCustomView(view,section='Office',page='Overview'){
 APP.custom=view;APP.section=section;APP.page=page;APP.moreOpen=false;
 pushUIHistory(view);paint();
}
function titleCaseUIRole(value){
 // Display-only: never changes the canonical role stored in the world.
 return String(value||'').trim().replace(/\b([a-z])([a-z]*)/gi,
  (word,first,rest)=>/^[A-Z]{2,}$/.test(word)?word:first.toUpperCase()+rest.toLowerCase());
}
function titleCaseOfficeFact(value){
 return String(value??'').trim().replace(/\b([a-z])([a-z]*)/gi,
  (word,first,rest)=>/^[A-Z]{2,}$/.test(word)?word:first.toUpperCase()+rest.toLowerCase());
}
function goOffice(){
 const hadCustom=Boolean(APP.custom);
 APP.custom='';APP.section='Office';APP.page='Office';
 bridgeNode(originalAct('Office Overview'));
 if(hadCustom)pushUIHistory('');
 paint();
}
function openMenu(section){
 // Explicit department navigation ends the focused select belonging to the
 // previous department. Otherwise paint() is deferred and shows stale Racing.
 if(APP.section!==section)endNativeSelectInteraction(false);
 APP.moreOpen=false;
 APP.departmentPageIndex=0;APP.departmentSearch='';APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
 if(section==='Sales'){APP.departmentAuction='';APP.departmentCompany=''}
 if(section==='Racing'){APP.racingMode='meets';APP.racingTrack=''}
 if(section==='History'){window.location.assign('/archive/?page=races');return}
 // Stable is a first-class next-generation screen. Clicking it must NOT
 // depend on the hidden Office's legacy click handler or its route shell.
 if(section==='Stable')return openCustomView('Stable — Overview','Stable','Overview');
 // The January 1999 Racing office must never depend on the legacy Office route,
 // which can reopen demo state or fail while the real world is loaded.
 if(section==='Racing')return openCustomView('Racing — Overview','Racing','Overview');
 if(section==='Sales')return openCustomView('Sales — Overview','Sales','Overview');
 APP.section=section;APP.page='Overview';APP.custom='';
 if(actions[section])bridgeNode(originalAct(actions[section]));
 else{openCustomView(section,section,'Overview')}
}
function pageTab(name){if(APP.section==='History'){const pages={'Race Results':'races','Horses':'horses','People & Farms':'people','Facilities & Tracks':'tracks','Historical Calendar':'seasons','Coverage':'sources'};window.location.assign('/archive/?page='+encodeURIComponent(pages[name]||'races'));return}APP.page=name; const s=APP.section;
 if(s==='Office'){
   if(name==='Overview')return goOffice();
   if(name==='Messages')return openCustomView('Messages','Office',name)
   if(name==='Decisions')return openCustomView('Decisions','Office',name)
   if(name==='Calendar')return openMenu('Racing');
   if(name==='News')return bridgeNode(originalAct('News'));
   if(name==='Reports'||name==='Career')return openCustomView(name,'Office',name)
 }
 if(DEP_NAMES.has(s)){
  APP.departmentPageIndex=0;APP.departmentSearch='';APP.departmentSortKey='';
  APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
  if(s==='Racing')return openCustomView('Racing — '+name,'Racing',name);
  if(s==='Sales'&&name==='Overview')return openCustomView('Sales — Overview','Sales','Overview');
  return openCustomView(s+' — '+name,s,name);
 }
 if(s==='Stable'&&(name==='Overview'||name==='Horses'))
  return openCustomView('Stable — '+name,'Stable',name);
 if(s==='World'&&['1999 Horses','People','Organizations'].includes(name)){
  APP.departmentPageIndex=0;APP.departmentSearch='';APP.departmentSortKey='';
  APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
  return openCustomView('World — '+name,'World',name);
 }
 if(s==='World'&&(name==='Tracks'||name==='Meets'))return openMenu('Tracks');
 if(s==='World'&&(name==='Overview'||name==='Major Races'))return bridgeNode(originalAct('World'));
 openCustomView(`${s} — ${name}`,s,name);
}
const currentMessages=()=>window.__WTW_1999_UI_DATA__?.officeMessages||$('.left .msg[data-case]').map(n=>({case:n.dataset.case,from:$('.from',n)?.textContent.trim()||'Stable Office',title:$('.title',n)?.textContent.trim()||'',meta:$('.meta',n)?.textContent.trim()||'',time:$('.time',n)?.textContent.trim()||'',urgent:n.classList.contains('urgent'),resolved:n.classList.contains('resolved'),initials:$('.avatar',n)?.textContent.trim()||'WT'}));
const selectMessage=id=>{APP.activeCase=id;const m=$(`.left .msg[data-case="${CSS.escape(id)}"]`);
 if(m){const all=filteredMessages();let pos=all.findIndex(x=>x.case===id);
 if(pos<0){APP.filter='All';pos=currentMessages().findIndex(x=>x.case===id)}
 if(pos>=0)APP.msgPage=Math.floor(pos/6);
 bridgeNode(m);
 }paint()};
function selectAdjacentCase(direction=1,onlyOpen=false){
 const all=currentMessages();const selected=all.findIndex(m=>m.case===APP.activeCase);
 if(!all.length)return;
 const start=Math.max(0,selected);
 for(let offset=1;offset<=all.length;offset++){
  const candidate=all[(start+direction*offset+all.length*3)%all.length];
  if(!onlyOpen || !candidate.resolved){selectMessage(candidate.case);return}
 }
}
const currDesk=()=>window.__WTW_1999_UI_DATA__?.officeDesks?.[APP.activeCase]||({type:$('#deskType')?.textContent.trim()||'RACING FILE',title:$('#deskTitle')?.textContent.trim()||'',summary:$('#deskSummary')?.textContent.trim()||'',pressure:$('#deskPressure')?.textContent.trim()||'',risk:$('#deskRisk')?.textContent.trim()||'',read:$('#deskRead')?.textContent.trim()||'',source:$('#deskSource')?.textContent.trim()||'',moves:$$('#moveGrid .moveCard').map(n=>({title:$('strong',n)?.textContent.trim()||'',tag:$('span',n)?.textContent.trim()||'',node:n})),intel:$$('#intelGrid .intelCard').map(n=>({title:$('b',n)?.textContent.trim()||'',body:$('p',n)?.textContent.trim()||'',tone:n.classList.contains('red')?'red':n.classList.contains('gold')?'gold':n.classList.contains('blue')?'blue':'green'}))});
const horseRows=()=>window.__WTW_1999_MANAGEMENT__?window.__WTW_1999_UI_DATA__?.stableHorses||[]:$('.right .boardRows .rankRow').map((n,i)=>({name:$('strong',n)?.textContent.trim()||'',activity:$('.wtwV37HorseActivity',n)?.textContent.trim()||n.title||'No current Office activity recorded',tag:n.querySelector(':scope > span:last-child')?.textContent.trim()||'',index:i+1}));
const racingRows=()=>window.__WTW_1999_MANAGEMENT__?[]:$('.right .fixtureList .fixture[data-track]').map(n=>{const name=$('h4',n)?.textContent.trim()||'';const saved=state();const isPowerline=name==='Powerline';const confirmed=isPowerline && (saved.calendarState?.['Churchill R3']?.status==='Entered' || /^Entered/i.test(saved.horseState?.Powerline?.status||''));return {name,date:$('.d',n)?.textContent.trim()||'',track:n.dataset.track||'',tag:$('.raceTag',n)?.textContent.trim()||'',status:confirmed?'Entered':($('.wtwV37EntryFlag',n)?.textContent.trim()||'Target')}});
const glyph=(name,size=16)=>{const paths={
  chevron:'<path d="m6 9 6 6 6-6"/>',
  left:'<path d="m15 18-6-6 6-6"/>',
  right:'<path d="m9 18 6-6-6-6"/>',
  arrow:'<path d="M7 17 17 7M8 7h9v9"/>',
  mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  check:'<path d="m4 12 5 5L20 6"/>',
  calendar:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>',
  search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  save:'<path d="M5 3h12l4 4v14H3V3zM7 3v7h10V3M7 21v-8h10v8"/>',
  grid:'<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>',
  inbox:'<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 13h5l2 3h4l2-3h5"/>',
  alert:'<path d="m12 3 10 18H2L12 3z"/><path d="M12 9v4m0 4h.01"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  rows:'<path d="M9 5h12M9 12h12M9 19h12"/><circle cx="4" cy="5" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="19" r="1"/>',
  flag:'<path d="M4 22V4m0 1c5-3 10 3 16 0v12c-6 3-11-3-16 0"/>',
  more:'<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
  play:'<path d="m8 5 11 7-11 7z"/>',
  folder:'<path d="M3 7V5h7l2 3h9v12H3V7z"/>',
  sparkle:'<path d="m12 3 2.5 6.5L21 12l-6.5 2.5L12 21l-2.5-6.5L3 12l6.5-2.5L12 3z"/>',
 };return `<svg class="ng-svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]||paths.grid}</svg>`};

/* Shared logo slot for player stable, farms and all future organization profiles. */
function playerOrganization(){
 const active=window.__WTW_1999_UI_DATA__;
 if(window.__WTW_1999_MANAGEMENT__&&active?.sourceOwnerId)return {id:active.sourceOwnerId,name:active.sourceOwnerName};
 const st=state(),o=st.organization&&typeof st.organization==='object'?st.organization:
                 st.stable&&typeof st.stable==='object'?st.stable:{};
 return {id:o.id==null?'':String(o.id),name:typeof o.name==='string'&&o.name.trim()?o.name.trim():'YOUR STABLE'};
}
function organizationLogoMarkup(id,name,kind='organization',large=false,brandFallback=false){
 const refs=organizationLogoIndex?.organizations||{};
 // The same immutable O-ID controls the Facility page, Ownership page and
 // horse-owner mark. Never fall back to a lookalike name or unapproved logo.
 const approvedOrg=isClean1999()?(world1999Data?.organizations||[]).find(o=>o.id===id):null;
 const keys=isClean1999()?approvedOrg?['organization:'+approvedOrg.id]:[]:
  [id?'organization:'+id:'',id?kind+':'+id:'',kind+':'+name,
   kind==='stable'?'player':''].filter(Boolean);
 const entityLogo=keys.map(key=>officeAssetPath(refs[key])).find(Boolean);
 // The real WTW brand logo is a UI icon for the player operation, never a claimed stable crest.
 const brandLogo=brandFallback&&!entityLogo?'/assets/wtw-office-approved-logo.png':'';
 const src=entityLogo||brandLogo;
 const initials=name==='YOUR STABLE'?'ST':name.split(/\s+/).slice(0,2).map(t=>t[0]||'').join('').toUpperCase().slice(0,2)||'ORG';
 const content=src?'<img class="ng-org-image" src="'+safe(src)+'" alt="" loading="lazy" decoding="async"/>':
  '<span class="ng-org-initials" aria-hidden="true">'+safe(initials)+'</span>';
 const description=entityLogo?'Approved logo for '+name:brandLogo?'Wire to Wire game logo, opening '+name+' operations':'Temporary logo placeholder for '+name;
 return '<span class="ng-org-mark'+(large?' ng-org-mark-large':'')+'" data-placeholder="'+safe(initials)+'" aria-label="'+safe(description)+'">'+content+'</span>';
}
// One presentation component across every horse occurrence. Identity comes
// only from Office horse owner references; training/boarding != ownership.
function horseOwnership(name){
 const horse=state().horseState?.[name]||{};
 if(isClean1999()){
  // EXACT OWNER ENTITY ONLY, for both starting stock and future test horses.
  // Breeder/boarding/foaling-farm IDs NEVER substitute for a horse's owner.
  const registered=(world1999Data?.horses||[]).filter(h=>h.name===name);
  const source=registered.length===1?registered[0]:null;
  const link=typeof window.__wtwOfficeHorseOwner==='function'?window.__wtwOfficeHorseOwner(name):null;
  const ownerId=[horse.owner_id,horse.ownerId,horse.ownerOrganizationId,
   horse.ownershipOrganizationId,horse.ownership?.organizationId,
   source?.ownerId,source?.owner_id,source?.ownershipOrganizationId,link?.id]
   .find(v=>typeof v==='string'&&/^(?:O-[A-Za-z0-9-]+)$/.test(v)&&
    (world1999Data?.organizations||[]).some(o=>o.id===v));
  const org=ownerId?(world1999Data?.organizations||[]).find(o=>o.id===ownerId):null;
  return org?{id:org.id,name:org.name}:null;
 }
 const linked=typeof window.__wtwOfficeHorseOwner==='function'?window.__wtwOfficeHorseOwner(name):null;
 const fallback=window.__WTW_1999_UI_DATA__?.ownerFor?.(name)||'';
 const id=linked?.id||(typeof horse.owner_id==='string'?horse.owner_id.trim():'');
 const raw=linked?.name||horse.owner_name||horse.owner||fallback;
 const owner=typeof raw==='string'?raw.trim():'';
 return owner&&owner!=='—'&&owner!=='Unknown'?{id,name:owner}:null;
}
function horseOwnerBadge(name,showName=false){
 const owner=horseOwnership(name);
 const logo=owner?organizationLogoMarkup(owner.id,owner.name,'organization',false,false):
  '<span class="ng-owner-unknown-mark" aria-hidden="true">?</span>';
 const desc=owner?'Owner: '+owner.name:'Owner not recorded';
 return '<span class="ng-horse-owner-badge'+(owner?' is-known':' is-unrecorded')+
   '" title="'+safe(desc)+'" aria-label="'+safe(desc)+'">'+logo+
   (showName?'<span class="ng-horse-owner-name">'+safe(owner?.name||'Not recorded')+'</span>':'')+'</span>';
}
function availableCash(){
 const st=state(),f=st.finances||{},stable=f.stable||{};
 const values=[stable.available_cash,stable.availableCash,stable.cash_balance,stable.cashBalance,f.available_cash,f.availableCash];
 const value=values.find(x=>typeof x==='number'&&Number.isFinite(x));
 return value===undefined?null:value;
}
function cashDisplay(){
 if(window.__WTW_1999_MANAGEMENT__&&Number.isFinite(window.__WTW_1999_UI_DATA__?.openingCash))
  return new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(window.__WTW_1999_UI_DATA__.openingCash)+' (TEST)';
 const cash=availableCash();
 return cash===null?'—':new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(cash);
}
function openFollowUps(){
 const follow=state().followUps;
 return (Array.isArray(follow)?follow:[]).filter(f=>f&&f.status!=='complete').sort((a,b)=>String(a.dueDate||'9999').localeCompare(String(b.dueDate||'9999')));
}
function dueActions(){
 const date=String($('.dateChip')?.textContent.trim()||state().date||'').slice(0,10);
 return openFollowUps().filter(f=>f.status==='due'||(f.status==='open'&&/^\d{4}-\d{2}-\d{2}$/.test(String(f.dueDate||''))&&f.dueDate<=date));
}
function openOrganization(){return openCustomView('Organization Overview')}


/* Full operation overview using only the live Office state; no additional ledger. */
function organizationOverview(){
 const org=playerOrganization(),st=state(),horses=horseRows(),races=racingRows(),messages=currentMessages(),follow=openFollowUps(),due=dueActions();
 const leads=document.querySelectorAll('.app .oppList .oppItem').length;
 const entered=races.filter(r=>/Entered/i.test(r.status)).length;
 const stat=(label,value)=>'<div><strong>'+safe(value)+'</strong><small>'+safe(label)+'</small></div>';
 const link=(key,val,title,desc)=>'<button data-ng="'+safe(key)+'" data-val="'+safe(val)+'"><strong>'+safe(title)+'</strong><span>'+safe(desc)+'</span>'+glyph('right',14)+'</button>';
 const panel=(title,linkLabel,key,val,body,count)=>'<section class="ng-org-overview-panel"><header><h3>'+safe(title)+'</h3><span class="ng-tier1-count">'+safe(String(count))+'</span><button data-ng="'+safe(key)+'" data-val="'+safe(val)+'">'+safe(linkLabel)+' '+glyph('arrow',12)+'</button></header><div class="ng-org-overview-list">'+(body||'<p>No matching records in the current Office.</p>')+'</div></section>';
 const openCases=messages.filter(m=>!m.resolved);
 const horseRowsHTML=horses.slice(0,4).map(h=>'<button data-ng="horse" data-val="'+safe(h.name)+'">'+horseOwnerBadge(h.name)+'<strong>'+safe(h.name)+'</strong><span>'+safe(h.activity||'Stable file')+'</span>'+glyph('right',14)+'</button>').join('');
 const raceRowsHTML=races.slice(0,4).map((r,i)=>link('fixture',i,r.name,r.date+' · '+r.track+' · '+r.status)).join('');
 const dueRowsHTML=follow.slice(0,4).map(f=>link('followup',f.id,f.caseTitle||f.caseId||'Follow-up',(f.dueDate||'No date')+' · '+(due.includes(f)?'DUE':'OPEN'))).join('');
 const decisionRowsHTML=openCases.slice(0,4).map(m=>link('case',m.case,m.title,m.from)).join('');
 const financialStatus=typeof st.finances?.stable?.status==='string'?st.finances.stable.status:'Financial baseline not established';
 const cash=availableCash();
 const finance='<div class="ng-org-finance"><small>AVAILABLE CASH</small><strong>'+safe(cashDisplay())+'</strong><p>'+safe(financialStatus)+(cash===null?' · No verified dollar amount':'')+'</p></div>';
 const opLinks='<div class="ng-tier1-shortcuts">'+[
  ['Personnel','PERSONNEL'],['Facilities','FACILITIES'],['Sales','SALES'],['Finances','FINANCES']
 ].map(([name,label])=>'<button data-ng="menu" data-val="'+safe(name)+'">'+safe(label)+' '+glyph('arrow',12)+'</button>').join('')+
 '<button data-ng="custom" data-val="Opportunities">OPPORTUNITIES ('+leads+') '+glyph('arrow',12)+'</button></div>';
 return '<div class="ng-org-overview ng-tier1-org"><div class="ng-org-overview-top">'+organizationLogoMarkup(org.id,org.name,'stable',true,true)+
  '<div class="ng-org-overview-name"><small>YOUR RACING OPERATION</small><h2>'+safe(org.name)+'</h2><p>Current commitments and decisions · '+safe($('.dateChip')?.textContent.trim()||'Game date pending')+'</p></div></div>'+
  '<div class="ng-org-overview-stats">'+stat('HORSES',horses.length)+stat('RACE TARGETS',races.length-entered)+stat('CONFIRMED ENTRIES',entered)+stat('OPEN CASES',openCases.length)+stat('DUE',due.length)+stat('OPPORTUNITIES',leads)+'</div>'+
  '<div class="ng-org-overview-grid">'+panel('STABLE ROSTER','ALL HORSES','menu','Stable',horseRowsHTML,horses.length)+panel('RACING COMMITMENTS','CALENDAR','menu','Racing',raceRowsHTML,races.length)+
  panel('OPEN DECISIONS','ALL FILES','tab','Decisions',decisionRowsHTML,openCases.length)+panel('FOLLOW-UPS','DECISION DESK','office','',dueRowsHTML,follow.length)+
  '<section class="ng-org-overview-panel"><header><h3>FINANCES & OPERATIONS</h3><button data-ng="menu" data-val="Finances">FINANCES '+glyph('arrow',12)+'</button></header>'+finance+'</section>'+
  '<section class="ng-org-overview-panel"><header><h3>MANAGEMENT DEPARTMENTS</h3><span class="ng-tier1-count">5</span></header>'+opLinks+'</section></div></div>';
}
function dueActionOverview(){
 const due=dueActions();
 const rows=due.map(f=>'<button data-ng="followup" data-val="'+safe(f.id)+'"><strong>'+safe(f.caseTitle||f.caseId||'Follow-up')+'</strong><span>'+safe((f.dueDate||'Due')+' · '+(f.text||'Follow-up is due'))+'</span>'+glyph('right',14)+'</button>').join('');
 return '<div class="ng-due-overview"><h2>DUE MANAGEMENT ACTIONS</h2><p>Follow-ups requiring attention before you advance the calendar.</p><div class="ng-org-overview-list">'+(rows||'<p>No follow-ups are due right now.</p>')+'</div><button data-ng="office">BACK TO RACING OFFICE</button></div>';
}

function managerSidebar(){
 const groups=[
  ['FRONT OFFICE',[
   ['Today','office','', 'grid'],['Inbox','custom','Messages','mail'],['Search','custom','Search','search']
  ]],
  ['RACING OPERATIONS',[
   ['Stable','menu','Stable','grid'],['Racing','menu','Racing','calendar'],
   ['Breeding','menu','Breeding','grid'],['Sales','menu','Sales','grid']
  ]],
  ['ORGANIZATION',[
   ['Personnel','menu','Personnel','grid'],['Facilities','menu','Facilities','grid'],
   ['Finances','menu','Finances','grid']
  ]],
  ['RACING WORLD',[
   ['Tracks','menu','Tracks','calendar'],['Horse Directory','world-directory','1999 Horses','search'],['World','menu','World','grid'],['History','menu','History','calendar']
  ]]
 ];
 const on=(label,key,value)=>key==='office'&&!APP.custom&&APP.section==='Office'&&!currentRoute()||
  key==='custom'&&APP.custom===value||key==='world-directory'&&APP.section==='World'&&APP.page==='1999 Horses'||key==='menu'&&APP.section===value&&
  (!APP.custom||APP.custom===value||APP.custom.startsWith(value+' — '));
 const btn=([label,key,value,icon])=>'<button type="button" data-ng="'+key+'"'+
  (value?' data-val="'+safe(value)+'"':'')+' class="ng-manager-rail-link'+(on(label,key,value)?' on':'')+'"'+
  ' title="'+safe(label)+'"'+(on(label,key,value)?' aria-current="page"':'')+'>'+
  '<span class="ng-manager-rail-icon" aria-hidden="true">'+glyph(icon,15)+'</span>'+
  '<span>'+safe(label)+'</span></button>';
 return '<aside class="ng-game-rail" aria-label="Game departments">'+
  '<div class="ng-manager-rail-brand"><img src="/assets/wtw-office-approved-logo.png" alt="" />'+
  '<span><strong>WIRE TO WIRE</strong><small>RACING MANAGEMENT</small></span></div>'+
  groups.map(([title,links])=>'<section class="ng-manager-rail-group"><h2>'+title+'</h2>'+
    links.map(btn).join('')+'</section>').join('')+
  '<div class="ng-manager-rail-footer"><span class="ng-manager-rail-dot"></span>ACTIVE CAREER</div>'+
 '</aside>';
}
function header(){
 const date=$('.dateChip')?.textContent.trim()||window.__WTW_1999_MANAGEMENT__?.startDate||'1999-01-01';
 const due=dueActions();
 // Each entity Overview has its own fully visible profile navigation.
 // Do not waste desktop height on unrelated department subtabs.
 const profileRoute=APP.custom?null:currentRoute();
 // The full-width department roster already owns section navigation through
 // its VIEW dropdown. Do not render a second horizontal tab menu above it.
 // Preserve Office navigation, where no department VIEW dropdown is present.
 const hasOwnNavigation=(APP.section!=='Office'&&!(APP.section==='World'&&APP.page==='Overview'))||
  Boolean(profileRoute&&/Profile$/.test(profileRoute.kicker))||
  APP.custom==='Search'||APP.custom==='Organization Overview'||Boolean(APP.custom&&APP.custom.includes(' — '));
 return `<header class="ng-global" aria-label="Wire to Wire application navigation">
  <div class="ng-hist"><button data-ng="back" aria-label="Previous page" title="Previous page">${glyph('left',15)}</button><button data-ng="forward" aria-label="Next page" title="Next page">${glyph('right',15)}</button></div>
  <button class="ng-mini-home" data-ng="office" title="Racing Office" aria-label="Go to Racing Office"><img class="ng-logo-mini" src="/assets/wtw-office-approved-logo.png" alt=""/><span class="ng-wordmark"><strong>WIRE TO WIRE</strong><small>RACING MANAGER</small></span></button>
  <div class="ng-manager-top-context"><strong>${safe(APP.section.toUpperCase())}</strong><span>${safe((APP.custom||profileRoute?.title||APP.page||'Overview').replace(/^Office$/,'Overview'))}</span></div>
  <div class="ng-global-tools"><button class="ng-iconbtn" data-ng="custom" data-val="Search" aria-label="Search">${glyph('search',17)}</button><button class="ng-iconbtn" data-ng="custom" data-val="Messages" aria-label="Inbox">${glyph('mail',17)}<i></i></button><button class="ng-iconbtn" data-ng="save-open" aria-label="Save or load named games" title="Save, load, or rename a game">${glyph('save',17)}</button></div>
  <button class="ng-global-date" data-ng="menu" data-val="Racing" title="Open calendar for in-world date ${safe(date)}" aria-label="In-world date ${safe(date)}. Open racing calendar"><span>GAME DATE</span><strong>${safe(date)}</strong></button>
  ${due.length?'<button class="ng-global-due" data-ng="due" title="Review due management follow-ups">'+glyph('alert',13)+' DUE '+due.length+'</button>':''}
  <button class="ng-global-continue" data-ng="action" data-val="Continue" title="Advance in-world game" aria-label="Continue game">${glyph('play',14)}<span>CONTINUE</span>${glyph('right',15)}</button>
 </header>
 ${hasOwnNavigation?'':`<div class="ng-subbar"><nav class="ng-subnav" aria-label="Section navigation">${(tabmap[APP.section]||['Overview']).map(x=>`<button data-ng="tab" data-val="${safe(x)}" class="${APP.page===x||(APP.page==='Office'&&x==='Overview')?'on':''}">${safe(x)}</button>`).join('')}</nav></div>`}`;
}

// Real global discovery: known Office entities, connected record pages,
// management screens and a link to the separately maintained History Vault.
/* Read-only 1999 world registry sourced from the v3.3 canonical Drive registry.
   This projects identities to the UI; it NEVER creates history, runs races,
   changes game saves, or infers missing birthplace/operations/finance data. */
let world1999Data=null,world1999Loading=false,world1999LoadFailed=false;
// Identity-only source-backed pilot jockeys do not alter the 41 founding leaders,
// and are NOT gameplay employees, mounts, wage obligations or abilities.
let world1999JockeyRoster=[];
let world1999TrainerRoster=[];

/* World Editor v1: canonical IDs remain immutable. The 1999 source JSON is
   immutable; user's edits are a browser-owned overlay, never a false source
   certification or a mutation to the global simulation save. */
const WORLD_EDIT_KEY=isClean1999()?'wtwFoundingWorldEditPatchesCleanV2':'wtwWorldEditPatchesV1';
const WORLD_EDIT_EXPORT='WTW_WORLD_USER_EDITS_V1';
const WORLD_LOCKED_FIELDS=new Set(['id','key','_role','registeredInV33','basis','source','sourceGate','chronologyCheck','population']);
const WORLD_FORBIDDEN_FIELDS=new Set(['__proto__','prototype','constructor']);
// Browser-authored display overlays must never supersede the accepted exact-ID
// founding principals or turn a non-operating investor into the operator.
const WORLD_FOUNDING_LOCKED_FIELDS=new Set(['publicPrincipal','publicPrincipalId',
 'principalOwner','principalOwnerId','leadershipStatus','leadershipPeopleIds',
 'publicInvestor','publicInvestorId','investorRole','principalRole']);
const isFoundingWorld=()=>window.__WTW_1999_MANAGEMENT__?.worldProfile?.mode==='FOUNDING_1999';
const WORLD_LINK_FIELDS={ownerId:'farm',trainerId:'person',sireId:'horse',damId:'horse',
 trackId:'track',homeTrackId:'track',publicPrincipalId:'person',ownershipOperationId:'farm'};
let world1999Base=null;
let worldUserPatches=worldReadPatches(),worldImageDB=null;
const worldImageCache=new Map(),worldImageFetching=new Set();
function worldReadPatches(){
 try{
  const raw=JSON.parse(localStorage.getItem(WORLD_EDIT_KEY)||'{}');
  return raw&&typeof raw==='object'&&!Array.isArray(raw)?raw:{};
 }catch{return {}}
}
function worldEditValidField(key){
 return typeof key==='string'&&/^[a-zA-Z][a-zA-Z0-9_]{0,79}$/.test(key)&&
  !WORLD_LOCKED_FIELDS.has(key)&&!WORLD_FORBIDDEN_FIELDS.has(key)&&
  !(isFoundingWorld()&&WORLD_FOUNDING_LOCKED_FIELDS.has(key));
}
function worldSanitizedPatch(raw){
 const out=Object.create(null);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return out;
 for(const [key,value] of Object.entries(raw)){
  if(!worldEditValidField(key))continue;
  if(typeof value==='string'&&value.length<=10000)out[key]=value;
  else if(typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))out[key]=value;
 }
 return out;
}
function worldSourceRecord(key,source=world1999Base){
 if(!source||!key||typeof key!=='string')return null;
 const type=key.split(':',1)[0],id=key.slice(type.length+1);
 const bucket={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[type];
 return (source[bucket]||[]).find(r=>(r.id||r.key)===id)||null;
}
function worldApplyEdits(source){
 if(!source)return source;
 const copy={...source,tracks:source.tracks.map(r=>({...r})),people:source.people.map(r=>({...r})),
  organizations:source.organizations.map(r=>({...r})),horses:source.horses.map(r=>({...r}))};
 for(const kind of ['tracks','people','organizations','horses']){
  const type={tracks:'track',people:'person',organizations:'farm',horses:'horse'}[kind];
  for(const record of copy[kind]){
   const key=type+':'+(record.id||record.key);
   Object.assign(record,worldSanitizedPatch(worldUserPatches[key]));
  }
 }
 return copy;
}
function worldRecordName(kind,id,otherwise=''){
 if(!id)return otherwise;
 const list={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[kind];
 const found=(world1999Data?.[list]||[]).find(x=>x.id===id||x.key===id);
 return found?.name||otherwise;
}
function worldEditOpen(key){
 const source=world1999Entry(key);
 if(!source)return;
 APP.worldEditKey=key;APP.worldEditDraft={...source._world};APP.worldEditStatus='';
 APP.worldPhotoDraft=undefined;APP.worldEditBusy=false;
 // An EDIT button in the World roster must open its record, not simply repaint the directory.
 if(APP.custom!=='WorldRecord:'+encodeURIComponent(key))return openWorld1999Entity(key);
 paint();
}
function worldEditCancel(){
 APP.worldEditKey='';APP.worldEditDraft=null;APP.worldPhotoDraft=undefined;
 APP.worldEditStatus='Edit cancelled. No changes saved.';paint();
}
function worldImageStore(){
 if(worldImageDB)return worldImageDB;
 if(!window.indexedDB)return Promise.reject(Error('Image storage is unavailable in this browser'));
 worldImageDB=new Promise((resolve,reject)=>{
  const req=indexedDB.open('WireToWireWorldMediaV1',1);
  req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains('images'))db.createObjectStore('images')};
  req.onsuccess=()=>resolve(req.result);
  req.onerror=()=>reject(req.error||Error('Unable to open local image storage'));
 });
 return worldImageDB;
}
async function worldGetImage(key){
 const db=await worldImageStore();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('images','readonly'),req=tx.objectStore('images').get(key);
  req.onsuccess=()=>resolve(req.result||'');
  req.onerror=()=>reject(req.error||Error('Image read failed'));
 });
}
async function worldSetImage(key,image){
 const db=await worldImageStore();
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('images','readwrite');
  tx.objectStore('images').put(image||'',key);
  tx.oncomplete=()=>resolve();
  tx.onerror=()=>reject(tx.error||Error('Image save failed'));
  tx.onabort=()=>reject(tx.error||Error('Image save cancelled'));
 });
}
function approvedIdentityAsset(kind,id,name){
 const category=kind==='organization'||kind==='owner'?'farm':kind;
 if(isClean1999()){
  if(category==='farm'){
   const allowed=(world1999Data?.organizations||[]).some(o=>o.id===id);
   const path=allowed?organizationLogoIndex?.organizations?.['organization:'+id]:'';
   return officeAssetPath(path||'');
  }
  if(category==='person'||category==='horse'){
   const registry=category==='person'?world1999Data?.people:world1999Data?.horses;
   const allowed=(registry||[]).some(o=>o.id===id);
   // No old name-joined portrait or prior-save IndexedDB image.
   return allowed?officeAssetPath(officePhotoIndex?.entities?.[category+':'+id]):'';
  }
 }
 const assets=officePhotoIndex?.entities||{};
 const byId=officeAssetPath(id?assets[category+':'+id]:'');
 if(byId)return byId;
 const byName=officeAssetPath(name?assets[category+':'+name]:'');
 if(byName)return byName;
 if(category==='farm'){
  const logos=organizationLogoIndex?.organizations||{};
  return officeAssetPath((id&&logos['organization:'+id])||
    (name&&logos['organization:'+name])||'');
 }
 return '';
}
function worldImageURL(key,record){
 // Previous-world IndexedDB media is not an approved 1999 identity asset.
 if(isClean1999()&&/^(?:farm|person|horse):/.test(key)){
  const kind=key.split(':')[0],id=record?.id||key.slice(key.indexOf(':')+1);
  return approvedIdentityAsset(kind,id,record?.name);
 }
 const stored=worldImageCache.get(key);
 if(stored)return stored;
 const kind=key.split(':')[0],id=record?.id||key.slice(key.indexOf(':')+1);
 const fallback=approvedIdentityAsset(kind,id,record?.name);
 if(worldImageCache.has(key))return record?.photoUrl||fallback||'';

 if(!worldImageFetching.has(key)){
  worldImageFetching.add(key);
  worldGetImage(key).then(src=>{const image=src||'';worldImageCache.set(key,image);if(image&&image!==record?.photoUrl)schedulePaint(30)})
   .catch(()=>{worldImageCache.set(key,'')}).finally(()=>worldImageFetching.delete(key));
 }
 const url=record?.photoUrl||fallback||'';
 return /^(?:https:\/\/|http:\/\/|\/assets\/)/i.test(url)?url:'';
}
function worldMediaPreview(key,record,editing=false){
 const current=editing&&APP.worldPhotoDraft!==undefined?APP.worldPhotoDraft:worldImageURL(key,record);
 const url=current||record?.photoUrl||'';
 return /^(?:data:image\/(?:png|jpe?g|webp);base64,|https?:\/\/|\/assets\/)/i.test(url)?
  '<img class="ng-world-edit-photo" src="'+safe(url)+'" alt="Selected image for '+safe(record?.name||'world record')+'" loading="lazy"/>':
  '<span class="ng-world-edit-photo-placeholder">NO IMAGE SELECTED</span>';
}
async function worldImageFile(file){
 if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type)||file.size>12000000)
  throw Error('Choose a PNG, JPEG or WebP image smaller than 12 MB.');
 return new Promise((resolve,reject)=>{
  const reader=new FileReader();
  reader.onerror=()=>reject(Error('Could not read the selected image.'));
  reader.onload=()=>{
   const image=new Image();
   image.onerror=()=>reject(Error('Selected file was not a usable image.'));
   image.onload=()=>{
    const scale=Math.min(1,1000/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(image.width*scale));
    canvas.height=Math.max(1,Math.round(image.height*scale));
    const ctx=canvas.getContext('2d');
    if(!ctx)return reject(Error('Image processing unavailable.'));
    ctx.drawImage(image,0,0,canvas.width,canvas.height);
    resolve(canvas.toDataURL('image/webp',.86));
   };
   image.src=reader.result;
  };
  reader.readAsDataURL(file);
 });
}
function worldEditRelationOptions(field,current){
 const kind=WORLD_LINK_FIELDS[field],group={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[kind];
 const candidates=world1999Data?.[group]||[];
 const selected=String(current||'');
 return '<select data-world-field="'+safe(field)+'" aria-label="'+safe(field)+'">'+
  '<option value="">None / unlinked</option>'+
  candidates.slice().sort((a,b)=>a.name.localeCompare(b.name)).map(x=>'<option value="'+safe(x.id||x.key)+'"'+
   ((x.id||x.key)===selected?' selected':'')+'>'+safe(x.name)+' · '+safe(x.id||x.key)+'</option>').join('')+
  (selected&&!candidates.some(x=>(x.id||x.key)===selected)?
   '<option value="'+safe(selected)+'" selected>Unknown source ID: '+safe(selected)+'</option>':'')+'</select>';
}
function worldEditFieldHTML(field,value){
 const label=field.replace(/([a-z])([A-Z])/g,'$1 $2').replace(/_/g,' ').toUpperCase();
 const hint=WORLD_LINK_FIELDS[field]?'CANONICAL RELATIONSHIP · ID':typeof value==='boolean'?'BOOLEAN':'';
 let control='';
 if(WORLD_LINK_FIELDS[field])control=worldEditRelationOptions(field,value);
 else if(typeof value==='boolean')control='<select data-world-field="'+safe(field)+'">'+
  '<option value="true"'+(value?' selected':'')+'>Yes</option>'+
  '<option value="false"'+(!value?' selected':'')+'>No</option></select>';
 else if(/^(notes?|description|legacySummary|history|biography|background|conditionReport)$/i.test(field)||String(value??'').length>140)
  control='<textarea data-world-field="'+safe(field)+'" rows="2">'+safe(String(value??''))+'</textarea>';
 else control='<input data-world-field="'+safe(field)+'" type="text" maxlength="10000" value="'+safe(String(value??''))+'"/>';
 return '<label class="ng-world-edit-field"><span>'+safe(label)+
  (hint?'<small>'+safe(hint)+'</small>':'')+'</span>'+control+'</label>';
}
function worldEditMarkup(entry){
 const key=entry.worldKey,d=APP.worldEditDraft||entry._world;
 const fields=Object.keys(d).filter(worldEditValidField).sort((a,b)=>
  a==='name'?-1:b==='name'?1:a.localeCompare(b));
 const locked=['id','key','_role','registeredInV33'].filter(k=>d[k]!==undefined);
 return '<section class="ng-world-editor" data-world-record="'+safe(key)+'">'+
  '<header><div><small>WIRE TO WIRE / WORLD EDITOR</small><h2>'+safe(d.name||entry.name)+'</h2></div>'+
  '<div class="ng-world-editor-actions"><button type="button" data-ng="world-cancel">CANCEL</button>'+
  '<button type="button" class="save" data-ng="world-save"'+(APP.worldEditBusy?' disabled':'')+'>SAVE CHANGES</button></div></header>'+
  '<p class="ng-world-editor-info">Edit any displayed attribute. Names and relationships retain their permanent IDs. '+
  'Changes save to this browser; use Export/Import to move them between devices.</p>'+
  '<div class="ng-world-editor-body">'+
  '<section class="ng-world-editor-media"><div class="ng-world-editor-photo">'+worldMediaPreview(key,d,true)+'</div>'+
  '<div><strong>PORTRAIT / LOGO / TRACK IMAGE</strong><p>Replace the image for this world record. The original file is never overwritten.</p>'+
  '<input type="file" id="wtwWorldImageInput" accept="image/png,image/jpeg,image/webp" aria-label="Choose replacement image"/>'+
  '<button type="button" data-ng="world-photo-clear">REMOVE CUSTOM IMAGE</button>'+
  '<small>Images are optimized for the site and saved in browser media storage.</small></div></section>'+
  '<div class="ng-world-editor-lock">PERMANENT IDENTITY: '+locked.map(k=>safe(k)+': '+safe(String(d[k]))).join(' · ')+'</div>'+
  '<div class="ng-world-editor-fields">'+fields.map(k=>worldEditFieldHTML(k,d[k])).join('')+'</div>'+
  '<div class="ng-world-editor-add"><input id="wtwWorldNewField" type="text" placeholder="Attribute key (e.g. biography)"/>'+
  '<input id="wtwWorldNewValue" type="text" placeholder="Value"/>'+
  '<button type="button" data-ng="world-add-field">ADD ATTRIBUTE</button></div>'+
  '</div><footer><span>'+safe(APP.worldEditStatus||'Unsaved changes will be discarded if you cancel.')+'</span>'+
  '<button type="button" data-ng="world-export">EXPORT BACKUP</button>'+
  '<button type="button" data-ng="world-import-open">IMPORT BACKUP</button>'+
  '<input type="file" id="wtwWorldImportInput" accept="application/json,.json" hidden/>'+
  '</footer></section>';
}
async function worldEditSave(){
 const key=APP.worldEditKey,entry=world1999Entry(key),draft=APP.worldEditDraft;
 if(!key||!entry||!draft||APP.worldEditBusy)return;
 APP.worldEditBusy=true;
 try{
  const base=worldSourceRecord(key);
  if(!base)throw Error('This record has no stable source ID.');
  const clean=worldSanitizedPatch(draft);
  if(!String(clean.name||'').trim())throw Error('A record must have a name.');
  for(const [field,kind] of Object.entries(WORLD_LINK_FIELDS)){
   if(!(field in clean)||!clean[field])continue;
   const group={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[kind];
   const target=(world1999Data[group]||[]).find(r=>r.id===clean[field]);
   if(!target){
    // A pre-existing historical ancestor may not be in this 1999 subset.
    // Never reject an unchanged approved external Horse_ID.
    if(clean[field]===base[field])continue;
    throw Error('Unknown '+field+' reference. Select a valid record.');
   }
   const nameField=field.endsWith('Id')?field.slice(0,-2):'';
   if(nameField&&nameField in clean)clean[nameField]=target.name;
  }
  // Save only user-changed fields. New source revisions remain visible rather
  // than being masked by dozens of unchanged snapshot attributes.
  const delta=Object.fromEntries(Object.entries(clean).filter(([field,value])=>
   !Object.is(base[field],value)));
  const updates={...worldUserPatches,[key]:delta};
  // Persist text first. If quota is exhausted, never report a successful save.
  localStorage.setItem(WORLD_EDIT_KEY,JSON.stringify(updates));
  if(APP.worldPhotoDraft!==undefined)await worldSetImage(key,APP.worldPhotoDraft||'');
  worldUserPatches=updates;
  if(APP.worldPhotoDraft!==undefined)worldImageCache.set(key,APP.worldPhotoDraft||'');
  world1999Data=worldApplyEdits(world1999Base);
  APP.worldEditKey='';APP.worldEditDraft=null;APP.worldPhotoDraft=undefined;
  APP.worldEditStatus='Saved in this browser. Export a backup to keep a portable copy.';
  APP.worldEditBusy=false;paint();
 }catch(err){APP.worldEditBusy=false;APP.worldEditStatus='SAVE FAILED: '+(err?.message||'Storage unavailable');paint()}
}
async function worldExportEdits(){
 try{
  const images=Object.create(null);
  const db=await worldImageStore();
  const rows=await new Promise((resolve,reject)=>{
   const tx=db.transaction('images','readonly'),store=tx.objectStore('images');
   const request=store.getAllKeys(),vals=store.getAll();
   tx.oncomplete=()=>resolve((request.result||[]).map((key,i)=>[key,vals.result?.[i]]));
   tx.onerror=()=>reject(tx.error||Error('Unable to export pictures'));
  });
  for(const [key,img] of rows)if(img)images[key]=img;
  const data={schema:WORLD_EDIT_EXPORT,exportedAt:new Date().toISOString(),
   changes:worldUserPatches,images};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');
  anchor.href=url;anchor.download='wire-to-wire-world-edits.json';anchor.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  APP.worldEditStatus='World edit backup exported.';paint();
 }catch(err){APP.worldEditStatus='Export failed: '+(err?.message||err);paint()}
}
async function worldImportEdits(file){
 if(!file)return;
 try{
  const input=JSON.parse(await file.text());
  if(input.schema!==WORLD_EDIT_EXPORT||!input.changes||typeof input.changes!=='object')
   throw Error('Not a Wire to Wire world edit backup.');
  const changes=Object.create(null);
  for(const [key,patch] of Object.entries(input.changes)){
   if(worldSourceRecord(key))changes[key]=worldSanitizedPatch(patch);
  }
  if(!window.confirm('Replace world edits saved in this browser with this backup?'))return;
  localStorage.setItem(WORLD_EDIT_KEY,JSON.stringify(changes));
  if(input.images&&typeof input.images==='object'){
   for(const [key,url] of Object.entries(input.images)){
    if(worldSourceRecord(key)&&typeof url==='string'&&
       /^data:image\/(?:png|jpe?g|webp);base64,/i.test(url)){
     await worldSetImage(key,url);worldImageCache.set(key,url);
    }
   }
  }
  worldUserPatches=changes;world1999Data=worldApplyEdits(world1999Base);
  APP.worldEditKey='';APP.worldEditDraft=null;APP.worldEditStatus='Imported edits and images.';
  paint();
 }catch(err){APP.worldEditStatus='Import failed: '+(err?.message||err);paint()}
}

let world1999Promise=null;
function loadWorld1999(){
 if(world1999Data||world1999LoadFailed)return Promise.resolve();
 if(world1999Loading)return world1999Promise||Promise.resolve();
 world1999Loading=true;
 const basePath='/data/wtw-1999-founding-directory-v1.json?rev=wtw1999-approved-only-20261113-r1';
 world1999Promise=Promise.all([
  fetch(basePath,{credentials:'same-origin',cache:'force-cache'}).then(r=>
   r.ok?r.json():Promise.reject(Error('1999 directory unavailable'))),
  fetch('/data/track-geography-v33.json',{credentials:'same-origin',cache:'force-cache'}).then(r=>
   r.ok?r.json():Promise.reject(Error('Canonical track geography unavailable'))),
  isClean1999()?fetch('/data/wtw-1999-jockey-pilot-v1.json?rev=clean-26-only-v3-20261113',
   {credentials:'same-origin',cache:'force-cache'}).then(r=>
    r.ok?r.json():Promise.reject(Error('Source jockey pilot unavailable'))):Promise.resolve(null),
  isClean1999()?fetch('/data/wtw-1999-trainer-pilot-v1.json?rev=source-trainer-identities-v1-20261113',
   {credentials:'same-origin',cache:'force-cache'}).then(r=>
    r.ok?r.json():Promise.reject(Error('Source trainer pilot unavailable'))):Promise.resolve(null)
 ]).then(([data,geo,pilot,trainerPilot])=>{
   if(data?.schema!=='WTW_1999_WORLD_DIRECTORY_V1'||
     !Array.isArray(data.tracks)||!Array.isArray(data.people)||
     !Array.isArray(data.organizations)||!Array.isArray(data.horses))
    throw Error('Unrecognized 1999 directory schema');
   if(isClean1999()){
    if(pilot?.schema!=='WTW_1999_JOCKEY_PILOT_IDENTITY_ROSTER_V1'||
      pilot.counts?.selectedPilot!==26||
      pilot.counts?.restoredByUser!==1||
      !Array.isArray(pilot.jockeys)||pilot.jockeys.length!==26)
     throw Error('Jockey identity pilot schema invalid');
    const pilotIds=new Set(pilot.jockeys.map(p=>p.id));
    const existingIds=new Set(data.people.map(p=>p.id));
    const chosen=pilot.jockeys.filter(p=>p.pilotStatus==='SELECTED_IDENTITY_ONLY');
    if(pilotIds.size!==26||chosen.length!==26||
       !chosen.some(p=>p.id==='P-1999-J-000001'&&p.gender==='MALE'&&
        p.homeTrackId==='T-0039'&&p.secondaryCircuit==='NEW_YORK_SELECTED_MAJOR_STAKES_DAYS')||
       !chosen.some(p=>p.id==='P-000057'&&p.gender==='MALE')||
       chosen.some(p=>p.role!=='JOCKEY'||!p.id.startsWith('P-')||
        existingIds.has(p.id)||!p.name||!p.base||p.performanceRatings!==null||
        p.employmentStatus!=='UNASSIGNED'))
     throw Error('Pilot jockey roster violates 1999 identity boundary');
    world1999JockeyRoster=chosen;
    if(trainerPilot?.schema!=='WTW_1999_TRAINER_PILOT_IDENTITIES_V1'||
      trainerPilot?.counts?.pilotTrainers!==20||
      !Array.isArray(trainerPilot.trainers)||trainerPilot.trainers.length!==20)
     throw Error('Trainer identity pilot unavailable or invalid');
    const trainerIds=new Set(trainerPilot.trainers.map(p=>p.id));
    if(trainerIds.size!==20||trainerPilot.trainers.some(p=>
      p.role!=='TRAINER'||p.entryStatus!=='SELECTED_IDENTITY_ONLY'||
      existingIds.has(p.id)||!p.name||!p.base||p.roleAttributes!==null||
      p.abilityStatus!=='UNASSESSED'||p.contract!==null))
     throw Error('Trainer identity pilot violates founding population boundary');
    world1999TrainerRoster=trainerPilot.trainers;
    if(geo?.counts?.north_america!==118||!Array.isArray(geo.tracks))
     throw Error('Complete North American track authority unavailable');
    const canonical=geo.tracks.filter(t=>t.registry==='NORTH_AMERICA');
    const ids=new Set(data.tracks.map(t=>t.id));
    const missing=canonical.filter(t=>!ids.has(t.id));
    if(canonical.length!==118||data.tracks.length+missing.length!==118)
     throw Error('North American 118-track identity reconciliation failed');
    // Add source-registered historical racecourses to the SITE DIRECTORY only.
    // Never create a meet, active condition book, physical facility or horse.
    data={...data,tracks:[...data.tracks,...missing.map(t=>({
     id:t.id,name:t.name,location:t.travel_node,
     region:t.macro_circuit||t.state_province_region||'',
     circuit:'HISTORICAL NORTH AMERICA',operating:'HISTORICAL_ONLY',
     registry:t.registry,geographyStatus:t.geography_status,
     historicalFoundationStatus:t.foundation_status,
     sourceBasis:t.source_basis,playableIn1999:false,
     historicalClosure:'CLOSED_PRE_1999',trackOperating:'HISTORICAL_ONLY'
    }))]};
   }
   world1999Base=data;world1999Data=worldApplyEdits(data);
   if(APP.ready)schedulePaint(15);
  })
  .catch(()=>{world1999LoadFailed=true;if(APP.ready)schedulePaint(15)})
  .finally(()=>{world1999Loading=false});
 return world1999Promise;
}
function world1999Key(kind,item){
 return kind+':'+(item.id||item.key||'');
}
function world1999Entries(){
 if(!world1999Data)return [];
 return [
  ...world1999Data.tracks.map(t=>({
   kind:'track',name:t.name,detail:t.region||t.circuit||'',location:t.location||'',
   canonicalId:t.id,worldKey:world1999Key('track',t),_world:t
  })),
  ...[...world1999Data.people,...world1999JockeyRoster,...world1999TrainerRoster].map(p=>({
   kind:'person',name:p.name,detail:p.role||'',location:p.base||'',
   canonicalId:p.id,worldKey:world1999Key('person',p),_world:p
  })),
  ...world1999Data.organizations.map(o=>({
   kind:'farm',name:o.name,detail:o.type||'',location:o.location||'',
   canonicalId:o.id,worldKey:world1999Key('farm',o),_world:o
  })),
  ...world1999Data.horses.map(h=>({
   kind:'horse',name:h.name,detail:h._role==='opening'?'1999 OPENING HORSE':
    h._role==='stallion'?'1999 STALLION':'1999 BROODMARE',
   location:h.location||'',canonicalId:h.id||'',
   worldKey:world1999Key('horse',h),_world:h
  }))
 ];
}
function world1999Entry(key){
 const listed=world1999Entries().find(e=>e.worldKey===key);
 if(listed)return listed;
 // Keep historic animals in a separate, non-living identity namespace.
 if(String(key).startsWith('historical-horse:')){
  const id=String(key).slice('historical-horse:'.length);
  const h=(world1999Data?.historicalHorses||[]).find(h=>h.id===id);
  return h?{kind:'historical-horse',name:h.name,canonicalId:h.id,
   worldKey:key,_world:h}:null;
 }
 const source=worldSourceRecord(key,world1999Data);
 if(!source)return null;
 const kind=key.split(':',1)[0];
 if(kind==='track'&&!world1999Data?.tracks?.some(t=>t.id===source.id))return null;
 return {kind,name:source.name,canonicalId:source.id||'',worldKey:key,_world:source};
}
function world1999Match(kind,name){
 const target=String(name||'').toLocaleLowerCase('en-US').trim();
 const matches=world1999Entries().filter(e=>(!kind||kind==='connection'||kind===e.kind)&&
  e.name.toLocaleLowerCase('en-US').trim()===target);
 return matches.length===1?matches[0]:null;
}
function openWorld1999Entity(key){
 const found=world1999Entry(key);
 if(!found)return false;
 return openCustomView('WorldRecord:'+encodeURIComponent(key),'World','Overview');
}
function openFounding1999Profile(kind,id){
 if(!isClean1999()||!['ownership','facility','person'].includes(kind)||!/^(?:O|P)-[A-Za-z0-9-]+$/.test(String(id||'')))return false;
 APP.detailTab='Overview';
 const section=kind==='facility'?'Facilities':'Personnel',page=kind==='ownership'?'Owners':'Overview';
 openCustomView('FoundingProfile:'+kind+':'+encodeURIComponent(id),section,page);
 return true;
}
function renderFounding1999Profile(kind,id){
 const source=world1999Data||world1999Base;
 if(!source)return '<section class="ng-world-source-profile" role="status"><p>Loading founding profile…</p></section>';
 const list=kind==='person'?[...source.people,...world1999JockeyRoster,...world1999TrainerRoster]:source.organizations;
 const record=(list||[]).find(x=>x.id===id);
 if(!record)return '<section class="ng-world-source-profile"><p>Not in the approved 1999 people or organization roster.</p></section>';
 const key=kind+':'+id;
 if(APP.foundingProfileKey!==key){APP.foundingProfileKey=key;APP.detailTab='Overview'}
 // Both page types must invoke the SAME already approved profileDetail()
 // renderer as Track and Horse. No independent founding profile layout.
 return restored1999Profile(kind==='person'?'person':'farm',
  kind==='person'?record:{...record,_foundingContext:kind});
}
function founding1999Profile(){
 const pieces=String(APP.custom||'').slice('FoundingProfile:'.length).split(':');
 const kind=pieces[0],id=decodeURIComponent(pieces.slice(1).join(':'));
 if(!['ownership','facility','person'].includes(kind))return '<p>Unsupported founding profile.</p>';
 return renderFounding1999Profile(kind,id);
}
function restored1999Profile(kind,record){
 const x=window.WTW1999Profiles?.source(kind,record,window.__WTW_1999_UI_DATA__);
 return x?profileDetail(x.route,x.node):null;
}
function world1999Profile(){
 const key=decodeURIComponent(String(APP.custom||'').slice('WorldRecord:'.length));
 const e=world1999Entry(key);
 if(e&&APP.worldEditKey===key)return worldEditMarkup(e);
 if(!e)return '<section class="ng-world-source-profile"><header><strong>1999 WORLD REGISTRY</strong></header>'+
  '<p>'+safe(world1999LoadFailed?'World source file is unavailable.':'Loading the 1999 source records…')+'</p></section>';
 const d=e._world||{},kind=e.kind;
 if(kind==='historical-horse'){
  const connections=(world1999Data?.historicalAnchors||[]).filter(a=>a.horseId===d.id);
  const related=connections.map(a=>{
   const org=(world1999Data?.organizations||[]).find(o=>o.id===a.organizationId);
   const child=org?world1999Entry('farm:'+org.id):null;
   const clickable=child?'<button type="button" data-ng="world-open" data-val="'+
    safe(child.worldKey)+'"><strong>'+safe(org.name)+'</strong></button>':
    '<strong>'+safe(org?.name||a.organizationId)+'</strong>';
   const years=Array.isArray(a.recordedStakesYears)&&a.recordedStakesYears.length?
    ' · horse-years '+a.recordedStakesYears.join(', '):'';
   return '<p>'+clickable+' · '+safe(String(a.role||'CONNECTION').replaceAll('_',' '))+
    safe(years)+' · '+safe(String(a.status||'SOURCE').replaceAll('_',' '))+'</p>';
  }).join('');
  const pedigree=[d.sireId?'Sire ID: '+d.sireId:'',
   d.damId?'Dam ID: '+d.damId:''].filter(Boolean).join(' · ');
  const year=d.foalYear?'Foaled '+d.foalYear:'Foaling year not independently recorded in this index';
  return '<section class="ng-world-source-profile" data-world-kind="historical-horse" data-world-id="'+safe(d.id)+'">'+
   '<header><strong>HISTORICAL HORSE · ARCHIVE REFERENCE, NOT A LIVING 1999 HORSE</strong></header>'+
   '<h2>'+safe(d.name)+'</h2><p>'+safe(d.id)+' · '+safe(year)+'</p>'+
   (pedigree?'<p>'+safe(pedigree)+'</p>':'')+
   '<section class="ng-world-related"><header><strong>RECORDED ORGANIZATION CONNECTIONS</strong>'+
   '<span>'+connections.length+' source links</span></header>'+related+'</section>'+
   '<p>A year-level historical association alone does not establish race-day ownership, training or breeder credit.</p>'+
   '</section>';
 }
 if(isClean1999()&&(kind==='farm'||kind==='person'))
  return renderFounding1999Profile(kind==='person'?'person':'ownership',d.id);
 if(kind==='horse'||kind==='person'||kind==='track')return restored1999Profile(kind,{...d,name:e.name});
 // All Horse, People and Track World records were already routed to the
 // authoritative full FM dossiers above. Only organization records use this view.
 if(kind!=='farm')return '<section class="ng-world-source-profile"><header><strong>RECORD TYPE UNAVAILABLE</strong></header></section>';
 const display='ORGANIZATION';
 const details=[];
 const add=(label,value,markup='')=>{if(value||markup)details.push({label,value:String(value||''),html:markup})};
 add('CANONICAL ID',d.id);
 add('OPERATION',titleCaseOfficeFact(d.type));
 add('APPROVED LOCATION',d.location||'Not specified');
 add('LOCATION PRECISION',d.locationGranularity||d.geographyStatus||'Source circuit only');
 add('RACING CIRCUIT',d.circuit||'');
 add('1999 PRINCIPAL',d.publicPrincipal||'',d.publicPrincipal?
  world1999Linked('person',d.publicPrincipalId,d.publicPrincipal):'');
 if(kind==='farm'&&world1999Data?.scenario==='FOUNDING_1999')
  add('LEADERSHIP APPROVAL',d.leadershipStatus?.includes('PENDING_USER_REVIEW')?
   'PROPOSED — AWAITING USER APPROVAL':
   d.leadershipStatus==='USER_APPROVED_1999_OPERATOR_LINK'?'USER APPROVED':
   d.leadershipStatus==='ESTABLISHED_1999_PRINCIPAL_LINK'?'ESTABLISHED':'NOT VERIFIED');
 if(kind==='farm'&&world1999Data?.scenario==='FOUNDING_1999'&&d.publicInvestor)
  add('MAJOR NON-OPERATING INVESTOR',d.publicInvestor,
   world1999Linked('person',d.publicInvestorId,d.publicInvestor));
 if(kind==='farm'&&world1999Data?.scenario==='FOUNDING_1999'&&d.relatedBloodstockAgencyId){
  add('BLOODSTOCK AFFILIATE',d.relatedBloodstockAgencyName||'Argosy Bloodstock',
   world1999Linked('farm',d.relatedBloodstockAgencyId,d.relatedBloodstockAgencyName||'Argosy Bloodstock'));
  add('BLOODSTOCK LEAD', 'Julian Voss',
   world1999Linked('person',d.relatedBloodstockStrategistId,'Julian Voss'));
 }
 const sourceNote='Source-linked January 1999 world record. Unrecorded facts remain blank; no gameplay or historical results are generated by this page.';
 const matches=(world1999Data?.horses||[]).filter(h=>h._role==='opening'&&h.ownerId===d.id);
 const relations=matches.slice(0,12).map(h=>{
  const child=world1999Entry(world1999Key('horse',h));
  return '<button type="button" data-ng="world-open" data-val="'+safe(child?.worldKey||'')+
   '" '+(!child?'disabled':'')+' title="Open source-linked horse '+safe(h.name)+'"><strong>'+safe(h.name)+
   '</strong><span>'+safe(h.trainer||h.owner||h.racingStatus||'1999 horse')+'</span>↗</button>';
 }).join('');
 const extraFields=Object.entries(d).filter(([field,value])=>
  worldEditValidField(field)&&!['name','status','role','type','location','owner','trainer',
  'sire','dam','track','base','birthplace','racingStatus','trainingStatus','healthStatus',
  'publicPrincipal','homeTrack','ownershipOperation','foalYear','sex','region','circuit',
  'operating','realAnchor','geographyStatus','locationGranularity'].includes(field)&&
  value!==null&&value!==undefined&&String(value).trim()!=='');
 const attributes=extraFields.length?'<details class="ng-world-extra-attributes"><summary>ALL RECORDED ATTRIBUTES · '+
  extraFields.length+'</summary><div>'+extraFields.map(([field,value])=>
   '<p><small>'+safe(field.replace(/([a-z])([A-Z])/g,'$1 $2').toUpperCase())+'</small><strong>'+
   safe(String(value))+'</strong></p>').join('')+'</div></details>':'';
 const toDir='Organizations';
 const breedingStock=(world1999Data?.horses||[]).filter(h=>
  h._role!=='opening'&&(h.standingFarm1999?.farmOrganizationId===d.id||
   h.boardingFarm1999?.farmOrganizationId===d.id));
 const breedingRows=breedingStock.map(h=>{
  const child=world1999Entry(world1999Key('horse',h));
  return '<button type="button" data-ng="world-open" data-val="'+safe(child?.worldKey||'')+
   '" '+(!child?'disabled':'')+' title="Open '+safe(h.name)+'"><strong>'+safe(h.name)+
   '</strong><span>'+safe(h._role==='stallion'?'STANDING STALLION':'BROODMARE')+'</span>↗</button>';
 }).join('');
 const breedingRelated=breedingStock.length?
  '<section class="ng-world-related"><header><strong>BREEDING STOCK AT THIS FARM</strong>'+
  '<span>'+breedingStock.length+' source-linked</span></header>'+breedingRows+'</section>':'';
 const anchors=(world1999Data?.historicalAnchors||[]).filter(a=>a.organizationId===d.id);
 const anchorRows=anchors.map(a=>{
  const child=a.horseId?(world1999Entry('horse:'+a.horseId)||
   world1999Entry('historical-horse:'+a.horseId)):null;
  const note=String(a.role||'CONNECTION').replaceAll('_',' ')+' · '+
   String(a.status||'HISTORICAL SOURCE').replaceAll('_',' ');
  return child?'<button type="button" data-ng="world-open" data-val="'+safe(child.worldKey)+
   '"><strong>'+safe(a.horse)+'</strong><span>'+safe(note)+'</span>↗</button>':
   '<p><strong>'+safe(a.horse)+'</strong> · '+safe(note)+
   (a.horseId?' · '+safe(a.horseId):'')+'</p>';
 }).join('');
 const historicalRelated=anchors.length?
  '<section class="ng-world-related"><header><strong>HISTORICAL HORSES &amp; BLOODLINES</strong>'+
  '<span>'+anchors.length+' named source/story links</span></header>'+anchorRows+'</section>':'';
 const related='<section class="ng-world-related"><header><strong>1999 ASSOCIATED HORSES</strong>'+
  '<span>'+matches.length+' source-linked · '+Math.min(12,matches.length)+' shown</span></header>'+
  (relations||'<p>No direct opening-horse owner, trainer or home-track relationship recorded in this directory.</p>')+
  '</section>';
 return '<section class="ng-world-source-profile" data-world-kind="'+safe(kind)+'" data-world-id="'+
  safe(d.id||d.key||'')+'">'+
  '<header><div><small>WIRE TO WIRE / 1999 WORLD / '+safe(display)+'</small><h2>'+
  safe(e.name)+'</h2></div><div class="ng-world-profile-photo">'+worldMediaPreview(key,d)+'</div><div class="ng-world-profile-actions">'+
  '<button type="button" data-ng="world-edit" data-val="'+safe(key)+'">EDIT RECORD</button>'+
  '<button data-ng="world-view" data-val="'+safe(toDir)+'">← '+safe(toDir.toUpperCase())+'</button>'+
  '<button data-ng="world-back">WORLD OVERVIEW</button></div></header>'+
  '<div class="ng-world-profile-sub"><strong>CANONICAL WORLD FILE</strong><span>'+
  safe(d.location||d.base||d.track||'1999 Start')+'</span><span>'+safe(d.id||'DOCUMENT-BASED IDENTITY')+'</span></div>'+
  '<div class="ng-world-profile-facts">'+details.map(x=>
   '<div><small>'+safe(x.label)+'</small><strong>'+(x.html||safe(x.value||'—'))+'</strong></div>').join('')+'</div>'+
  related+breedingRelated+historicalRelated+attributes+'<p class="ng-world-profile-footnote">'+safe(sourceNote)+'</p>'+
  '<div class="ng-world-profile-reference"><small>AUTHORITY: '+safe(world1999Data?.scenario==='FOUNDING_1999'?'FOUNDING 1999 · SOURCE & APPROVED STORIES':'WTW 1999 START v3.3 · SOURCE + USER EDIT OVERLAY')+' · '+safe(APP.worldEditStatus||'SOURCE ID PRESERVED')+'</small></div></section>';
}

function world1999Linked(kind,id,label){
 if(!id&&!label)return '—';
 const kindMap={organization:'farm',owner:'farm',trainer:'person'};
 const targetKind=kindMap[kind]||kind;
 const entry=id?world1999Entries().find(e=>e.kind===targetKind&&e.canonicalId===id):
  world1999Match(targetKind,label);
 if(!entry)return safe(label||id||'—');
 return '<button type="button" class="ng-entity-reference" data-ng="world-open" data-val="'+
  safe(entry.worldKey)+'" title="Open '+safe(entry.name)+'">'+safe(entry.name)+' ↗</button>';
}

function globalSearchItems(){
 const rows=typeof window.__wtwOfficeSearchRecords==='function'?window.__wtwOfficeSearchRecords():[];
 const universe=world1999Entries();
 const pages=[
  {kind:'page',name:'Racing Office',detail:'Decision Desk and Inbox',section:'Office'},
  {kind:'page',name:'Organization Overview',detail:'Stable finances, horses and commitments'},
  {kind:'page',name:'Historical Archive',detail:'Complete historical results and entities',section:'History'},
  ...Object.keys(tabmap).filter(n=>n!=='History').map(name=>({kind:'page',name,detail:'Game department',section:name})),
  ...Object.entries(tabmap).flatMap(([section,tabs])=>tabs.filter(name=>name!=='Overview').map(name=>({
   kind:'tab',name,detail:section+' · Screen',section
  }))),
  ...currentMessages().map(m=>({kind:'decision',name:m.title,detail:'Office · '+m.from,caseId:m.case}))
 ];
 const playableTracks=window.__WTW_1999_UI_DATA__?.extraTracks?.()||[];
 const playableTrackIds=new Set(playableTracks.map(t=>t.id));
 const playableTrackNames=new Set(playableTracks.map(t=>t.name));
 const original=rows.filter(r=>r&&typeof r.name==='string'&&
   (r.kind!=='track'||playableTrackIds.has(r.id)||playableTrackNames.has(r.name))).map(r=>{
  const bucket={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[r.kind];
  const base=(world1999Base?.[bucket]||[]).filter(x=>x.name===r.name);
  const unchanged=base.length===1?base[0].id||base[0].key:'';
  const extra=universe.find(u=>u.kind===r.kind&&
   (u.name===r.name||unchanged&&u.canonicalId===unchanged));
  return {kind:r.kind,name:extra?.name||r.name,sourceName:r.name,track:r.track||'',
   detail:r.kind==='person'?titleCaseUIRole(extra?._world?.role||r.detail):extra?._world?.type||r.detail||'',
   location:extra?.location||'',canonicalId:extra?.canonicalId||'',worldKey:extra?.worldKey||''};
 });
 const seen=new Set(original.map(r=>r.worldKey||r.kind+'|'+r.name));
 const rest=universe.filter(r=>!seen.has(r.worldKey||r.kind+'|'+r.name));
 return [...original,...rest,...pages];
}
const searchWords=value=>String(value||'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim().split(/\s+/).filter(Boolean);
// Roster-style directory: a single dense, sortable list instead of tiles.
// No source records are copied into a new database; each row routes to its
// original Office source, with 13 rows per page to avoid desktop scrolling.
const searchPageSize=()=>Math.max(10,Math.min(28,Math.floor(((window.innerHeight||768)-200)/25)));
const searchTypes=[
 ['all','ALL'],['horse','HORSES'],['person','PEOPLE'],['farm','FARMS'],
 ['track','TRACKS'],['race','RACES'],['pages','SCREENS']
];
const searchMatches=(entry,words)=>words.every(word=>
 [entry.name,entry.kind,entry.detail,entry.section,entry.track,
  entry.kind==='horse'?(entry._world?.owner||horseOwnership(entry.name)?.name||''):''].filter(Boolean).join(' ').toLowerCase().includes(word)
);
function searchRosterData(){
 const entries=APP.searchIndex||[],words=searchWords(APP.searchQuery);
 const scoped=entries.map((entry,i)=>({...entry,sourceIndex:i}))
  .filter(entry=>(APP.searchType==='all'||(APP.searchType==='pages'
   ?['page','tab','decision'].includes(entry.kind):entry.kind===APP.searchType))&&searchMatches(entry,words));
 const key=entry=>APP.searchSort==='type'?entry.kind:APP.searchSort==='owner'?
   (entry.kind==='horse'?(horseOwnership(entry.name)?.name||'zzzzzzzz'):'zzzzzzzz'):entry.name;
 scoped.sort((a,b)=>key(a).localeCompare(key(b),undefined,{numeric:true,sensitivity:'base'})||
  a.name.localeCompare(b.name,undefined,{numeric:true,sensitivity:'base'}));
 const totalPages=Math.max(1,Math.ceil(scoped.length/searchPageSize()));
 APP.searchPage=Math.min(Math.max(APP.searchPage,0),totalPages-1);
 return {all:scoped,page:scoped.slice(APP.searchPage*searchPageSize(),(APP.searchPage+1)*searchPageSize()),
  totalPages,count:scoped.length};
}
function searchRosterMarkup(){
 const result=searchRosterData();
 const rows=result.page.map(entry=>{
  const isHorse=entry.kind==='horse';
  const owner=isHorse?horseOwnership(entry.name):null;
  const ownerText=isHorse?(entry._world?.owner||owner?.name||'Not recorded'):'—';
  const nameCell=(isHorse?horseOwnerBadge(entry.name):'')+'<strong>'+safe(entry.name)+'</strong>';
  return `<button type="button" class="ng-search-row" data-ng="search-go" data-val="${entry.sourceIndex}" aria-label="Open ${safe(entry.kind)} page: ${safe(entry.name)}">
    <span class="ng-search-row-kind">${safe(entry.kind==='tab'?'SCREEN':entry.kind==='page'?'SECTION':entry.kind.toUpperCase())}</span>
    <span class="ng-search-row-name">${nameCell}</span>
    <span class="ng-search-row-detail" title="${safe(entry.detail||'Connected record')}">${safe(entry.detail||'Connected record')}</span>
    <span class="ng-search-row-owner" title="${safe(ownerText)}">${safe(ownerText)}</span>
    <span class="ng-search-row-open">${glyph('right',13)}</span>
   </button>`;
 }).join('');
 const start=result.count?APP.searchPage*searchPageSize()+1:0,end=Math.min(result.count,(APP.searchPage+1)*searchPageSize());
 const pager=`<span class="ng-search-page-range">${start}–${end} OF ${result.count} RESULTS</span>
  <div class="ng-search-pager"><button data-ng="search-page" data-val="-1" ${APP.searchPage===0?'disabled':''} aria-label="Previous search page">${glyph('left',13)}</button>
  <strong>${APP.searchPage+1} / ${result.totalPages}</strong>
  <button data-ng="search-page" data-val="1" ${APP.searchPage>=result.totalPages-1?'disabled':''} aria-label="Next search page">${glyph('right',13)}</button></div>`;
 return {rows,count:result.count,pager};
}
function updateSearchRoster(){
 const markup=searchRosterMarkup(),body=$('#ngSearchResults',root),counter=$('#ngSearchCount',root),pager=$('#ngSearchPager',root),empty=$('#ngSearchEmpty',root);
 if(body)body.innerHTML=markup.rows;
 if(counter)counter.textContent=markup.count+' MATCHING RECORDS';
 if(pager)pager.innerHTML=markup.pager;
 if(empty)empty.hidden=markup.count!==0;
 $$('.ng-search-type',root).forEach(btn=>{
  const active=btn.dataset.val===APP.searchType;btn.classList.toggle('on',active);btn.setAttribute('aria-pressed',String(active));
 });
 $$('.ng-search-sort',root).forEach(btn=>btn.classList.toggle('on',btn.dataset.val===APP.searchSort));
}
function searchView(){
 APP.searchIndex=globalSearchItems();
 const markup=searchRosterMarkup();
 return `<section class="ng-search-page ng-search-roster-page">
  <header class="ng-search-compact-head"><div><strong>DIRECTORY</strong><span>FIND A PERSON, HORSE, RACE OR SCREEN</span></div><button data-ng="office">RACING OFFICE ${glyph('arrow',12)}</button></header>
  <label class="ng-search-entry" for="ngGlobalSearch">${glyph('search',17)}<input id="ngGlobalSearch" type="search" value="${safe(APP.searchQuery)}" data-ng-input="global-search" placeholder="Search any available record or screen…" autocomplete="off" aria-label="Search Wire to Wire pages and records"/></label>
  <div class="ng-search-filters">
    <div class="ng-search-typebar" role="group" aria-label="Filter search by record type">${searchTypes.map(([value,label])=>`<button class="ng-search-type ${APP.searchType===value?'on':''}" data-ng="search-type" data-val="${value}" aria-pressed="${APP.searchType===value}">${label}</button>`).join('')}</div>
    <div class="ng-search-sortbar"><span>SORT</span>${[['name','NAME'],['type','TYPE'],['owner','OWNER']].map(([value,label])=>`<button class="ng-search-sort ${APP.searchSort===value?'on':''}" data-ng="search-sort" data-val="${value}">${label}</button>`).join('')}</div>
  </div>
  <div class="ng-search-table">
    <div class="ng-search-table-head"><span>TYPE</span><span>NAME</span><span>ROLE / RECORD</span><span>OWNER</span><span>OPEN</span></div>
    <div id="ngSearchResults" class="ng-search-table-body">${markup.rows}</div>
    <div id="ngSearchEmpty" class="ng-search-empty" ${markup.count?'hidden':''}>No matching connected records. Try another name or open History.</div>
  </div>
  <footer class="ng-search-table-footer"><span id="ngSearchCount">${markup.count} MATCHING RECORDS</span><div id="ngSearchPager" class="ng-search-page-control">${markup.pager}</div><button data-ng="search-history">HISTORICAL ARCHIVE ${glyph('arrow',12)}</button></footer>
 </section>`;
}
function openSearchItem(item){
 if(!item)return;
 if(['horse','person','farm','track','race'].includes(item.kind)){
  if(item.worldKey)return openWorld1999Entity(item.worldKey);
  if(window.__wtwOfficeOpenSearchRecord?.(item.kind,item.sourceName||item.name,item.track)){APP.custom='';APP.moreOpen=false;return schedulePaint(20)}
  return openEntityRecord(item.name,item.kind);
 }
 if(item.kind==='decision'){
  APP.custom='';APP.section='Office';APP.page='Overview';
  return selectMessage(item.caseId);
 }
 if(item.kind==='page'){
  if(item.section==='History')return window.location.assign('/archive/?page=races');
  if(item.name==='Racing Office'||item.name==='Office')return goOffice();
  if(item.name==='Organization Overview')return openOrganization();
  return openMenu(item.section||item.name);
 }
 if(item.kind==='tab'){
  if(item.section==='History'){
   const target={'Race Results':'races','Horses':'horses','People & Farms':'people','Facilities & Tracks':'tracks','Historical Calendar':'seasons','Coverage':'sources'};
   return window.location.assign('/archive/?page='+encodeURIComponent(target[item.name]||'races'));
  }
  openMenu(item.section);
  return pageTab(item.name);
 }
}
function filteredMessages(){const rows=currentMessages();return rows.filter(m=>APP.filter==='All'||(APP.filter==='Urgent'&&m.urgent&&!m.resolved)||(APP.filter==='Open'&&!m.resolved)||(APP.filter==='Reviewed'&&m.resolved))}
function inbox(){const arr=filteredMessages();const size=6;const pages=Math.max(1,Math.ceil(arr.length/size));APP.msgPage=Math.min(APP.msgPage,pages-1);const slice=arr.slice(APP.msgPage*size,(APP.msgPage+1)*size);const urgent=currentMessages().filter(x=>x.urgent&&!x.resolved).length;
 return `<aside class="ng-left"><section class="ng-card ng-inbox"><header class="ng-cardhead"><span class="ng-sectionicon">${glyph('inbox',17)}</span><div class="ng-headinggroup"><h3>Inbox</h3><span>STAFF & RACING CORRESPONDENCE</span></div><span class="ng-counter">${arr.length}</span></header><div class="ng-filters">${['All','Open','Urgent','Reviewed'].map(v=>`<button class="${APP.filter===v?'on':''}" data-ng="filter" data-val="${v}" aria-pressed="${APP.filter===v?'true':'false'}">${v==='Urgent'?`${glyph('alert',12)} Urgent ${urgent}`:v==='Open'?`Open ${currentMessages().filter(m=>!m.resolved).length}`:v==='Reviewed'?`Reviewed ${currentMessages().filter(m=>m.resolved).length}`:v}</button>`).join('')}</div><div class="ng-inboxdate"><span class="ng-live-dot"></span>TODAY'S OFFICE FILES <span>${safe($('.dateChip')?.textContent||'')}</span></div><div class="ng-msgs">${slice.map(m=>`<button class="ng-msg ${m.case===APP.activeCase?'on':''} ${m.urgent?'urgent':''}" data-ng="case" data-val="${safe(m.case)}" aria-current="${m.case===APP.activeCase?'true':'false'}"><div class="ng-avatar">${safe(m.initials)}</div><div class="ng-msgcopy"><div class="ng-msgfrom">${safe(m.from)}</div><div class="ng-msgtitle">${safe(m.title)}</div><div class="ng-msgmeta">${safe(m.meta)}</div></div><div class="ng-msgtrail"><span class="ng-msgtag ${m.urgent?'urgent':/sale|cash/i.test(m.title)?'sale':''}">${m.urgent?'ACTION':/vet|filling|soundness/i.test(m.title)?'VET':/catalog|sale/i.test(m.title)?'SALE':'INFO'}</span><div class="ng-msgtime">${safe(m.time)}</div></div></button>`).join('')}</div><footer class="ng-inboxfoot"><span>${arr.length?APP.msgPage*size+1:0}–${Math.min(arr.length,(APP.msgPage+1)*size)} OF ${arr.length} MESSAGES</span><div class="ng-pagination"><button aria-label="Previous inbox page" data-ng="prev-msg" ${APP.msgPage===0?'disabled':''}>${glyph('left',13)}</button><b>${APP.msgPage+1} / ${pages}</b><button aria-label="Next inbox page" data-ng="next-msg" ${APP.msgPage>=pages-1?'disabled':''}>${glyph('right',13)}</button></div></footer></section></aside>`;
}

// Decisions display the relevant entity's real photo if one exists, then a case/scene
// photo, then the approved generic photograph. Media lookup is never a new data ledger.
// The current Office prototype has name-linked cases; future source records can supply
// their immutable IDs to this asset index without changing the decision UI.
const casePhotoSubjects={
 powerline:{type:'horse',name:'Powerline',category:'racing'},
 lastmatch:{type:'horse',name:'The Last Match',category:'training'},
 saratoga:{type:'person',name:'Alistair Dunleavy',category:'sales'},
 pieta:{type:'horse',name:'Pieta',category:'training'},
 cash:{category:'finance'},
 newsbuzz:{type:'horse',name:'Argosy colt',category:'news'},
 entries:{type:'horse',name:'Powerline',category:'racing'},
 cedar:{type:'farm',name:'Cedar Spoke',category:'training'}
};
function officeAssetPath(value){
 if(typeof value!=='string'||value.includes('..')||!/^\/assets\/[a-zA-Z0-9_./-]+\.(jpg|jpeg|png|webp|avif)$/.test(value))return '';
 return value;
}
function decisionScene(d){
 const subject=casePhotoSubjects[APP.activeCase]||{};
 const context=(APP.activeCase+' '+d.type+' '+d.title).toLowerCase();
 const category=subject.category||(/auction|sales|catalog/.test(context)?'sales':/cash|finance/.test(context)?'finance':/health|vet|gallop/.test(context)?'training':'racing');
 const captions={sales:'SALES & BLOODSTOCK',finance:'STABLE FINANCES',training:'TRAINING & CARE',news:'RACING NEWS',racing:'RACE PLANNING'};
 const index=officePhotoIndex||{},caseMap=index.cases||{},entityMap=index.entities||{},categoryMap=index.categories||{};
 const matchedEntity=subject.type&&subject.name?officeAssetPath(entityMap[subject.type+':'+subject.name]):'';
 const matchedCase=officeAssetPath(caseMap[APP.activeCase]);
 const matchedCategory=officeAssetPath(categoryMap[category]);
 const photo=matchedCase||matchedEntity||matchedCategory||officeAssetPath(index.default)||genericDeskPhoto;
 const isEntity=Boolean(matchedEntity&&!matchedCase),isCase=Boolean(matchedCase);
 const reference=isEntity?subject.name:isCase?d.title:'EDITORIAL REFERENCE PHOTO';
 const accessible=isEntity?'Photograph of '+subject.name:isCase?'Decision scene photograph for '+d.title:'Generic editorial photograph of a horse at a stable';
 return `<figure class="ng-decision-scene ng-decision-photo" role="img" aria-label="${safe(accessible)}"><img class="ng-decision-photograph" src="${safe(photo)}" alt="" loading="eager" decoding="async"/><figcaption class="ng-decision-scene-caption"><span>${safe(captions[category]||'RACING OFFICE')}</span><small>${safe(reference)}</small></figcaption></figure>`;
}

function center(){const d=currDesk();const messages=currentMessages();const resolved=window.__WTW_1999_MANAGEMENT__?null:state().resolvedCases?.[APP.activeCase];const source=d.source&&d.source!=='—'?d.source:'Stable Office';const msg=messages.find(m=>m.case===APP.activeCase);const index=messages.findIndex(m=>m.case===APP.activeCase)+1;
const hasRelatedHorse=new Set(['powerline','lastmatch','pieta','entries','newsbuzz']).has(APP.activeCase);
const relatedAction=hasRelatedHorse?`<button class="alt" data-ng="profile-from-case">HORSE PROFILE ${glyph('arrow',14)}</button>`:'';
const resolvedRelatedAction=hasRelatedHorse?`<button class="ng-openhorse" data-ng="profile-from-case">RELATED HORSE FILE ${glyph('arrow',13)}</button>`:`<button class="ng-openhorse" data-ng="action" data-val="Open file">REVIEW SOURCE FILE ${glyph('arrow',13)}</button>`;
const moves=resolved?`<div class="ng-resolved"><div class="ng-resolution-title">${glyph('check',16)} ${safe(resolved.choiceTitle)}</div><div class="ng-resolvedtabs">${['Effect','Barn Reaction','Follow-up'].map((t,i)=>`<button class="${APP.outTab===i?'on':''}" data-ng="outtab" data-val="${i}">${t}</button>`).join('')}</div><div class="ng-outtext">${safe([resolved.immediate,resolved.reaction,resolved.followUp][APP.outTab])}</div><div class="ng-outcome-actions">${resolvedRelatedAction}<button class="ng-nextopen" data-ng="nextopen">NEXT OPEN CASE ${glyph('right',13)}</button></div></div>`:d.moves.map((m,i)=>`<button class="ng-move ng-move-${i%3}" data-ng="${window.__WTW_1999_MANAGEMENT__?'menu':'move'}" data-val="${safe(window.__WTW_1999_MANAGEMENT__?(m.menu||'World'):i)}"><span class="ng-move-number">0${i+1}</span><span class="ng-move-body"><span class="ng-movetag">${safe(m.tag)}</span><strong>${safe(m.title)}</strong>${typeof deskCases!=='undefined'&&deskCases[APP.activeCase]?.moves?.[i]?.[1]?`<span class="ng-move-note">${safe(deskCases[APP.activeCase].moves[i][1])}</span>`:''}</span><span class="ng-movearrow">${glyph('right',17)}</span></button>`).join('');
return `<section class="ng-main"><section class="ng-card ng-feature"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('folder',17)}</span><div class="ng-headinggroup"><h3>Decision Desk</h3><span>THE MANAGER'S PRIORITY FILE</span></div><button class="ng-org-chip" data-ng="organization" aria-label="Open organization overview; available cash ${safe(cashDisplay())}" title="View your racing operation and available cash">${organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',false,true)}<span class="ng-org-chip-cash"><small>CASH</small><strong>${safe(cashDisplay())}</strong></span></button><div class="ng-case-navigation"><div class="ng-case-pips" aria-label="Select today's case">${messages.map((m,i)=>`<button type="button" data-ng="case" data-val="${safe(m.case)}" class="ng-case-pip ${m.case===APP.activeCase?'on':''} ${m.resolved?'reviewed':m.urgent?'priority':''}" title="${safe(m.title)}${m.resolved?' — Reviewed':''}" aria-label="Case ${i+1}: ${safe(m.title)}" aria-current="${m.case===APP.activeCase?'true':'false'}"></button>`).join('')}</div><span class="ng-case-position"><span class="ng-live-dot"></span>${String(index).padStart(2,'0')} / ${String(messages.length).padStart(2,'0')}</span><div class="ng-case-arrows"><button type="button" data-ng="caseprev" aria-label="Previous decision" title="Previous case">${glyph('left',13)}</button><button type="button" data-ng="casenext" aria-label="Next decision" title="Next case">${glyph('right',13)}</button></div></div></header><div class="ng-featurebody"><div class="ng-case"><div class="ng-case-eyebrow"><span></span>${safe(d.type)} <i>·</i> ${safe(msg?.from||source)}</div><div class="ng-casetitle ng-static-title"><h2>${safe(d.title)}</h2></div><p class="ng-case-summary">${safe(d.summary)}</p><div class="ng-facts">${[['Pressure',d.pressure],['Primary risk',d.risk],['Manager read',d.read]].map((f,i)=>`<div class="ng-fact ng-fact-${i}"><small>${safe(f[0])}</small><b>${safe(titleCaseOfficeFact(f[1]))}</b></div>`).join('')}</div><div class="ng-caseactions"><button data-ng="action" data-val="Open file">REVIEW FULL FILE ${glyph('arrow',14)}</button>${relatedAction}</div></div><div class="ng-featurephoto">${decisionScene(d)}</div></div></section><div class="ng-centerbottom"><section class="ng-card ng-intel"><header class="ng-cardhead"><span class="ng-sectionicon">${glyph('sparkle',16)}</span><div class="ng-headinggroup"><h3>Intelligence</h3><span>${d.intel.length} ${window.__WTW_1999_MANAGEMENT__?'SOURCE / TEST READS':'SOURCE READS'}</span></div><button class="ng-cardlink" data-ng="action" data-val="Open current source">${safe(source)} ${glyph('arrow',12)}</button></header><div class="ng-intelgrid">${d.intel.map((item,i)=>`<button class="ng-intelitem ng-intel-${i%4}" data-ng="intel" data-val="${i}"><span class="ng-intel-kicker" aria-label="Source ${i+1}"><span class="ng-intel-marker"></span>0${i+1}</span><b>${safe(item.title)}</b><p>${safe(item.body)}</p></button>`).join('')}</div></section><section class="ng-card ng-choices"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('flag',16)}</span><div class="ng-headinggroup"><h3>${window.__WTW_1999_MANAGEMENT__?'Explore the World':'Your Call'}</h3><span>${window.__WTW_1999_MANAGEMENT__?'JANUARY 1999 TEST NAVIGATION':'MANAGEMENT DECISION'}</span></div><span class="ng-choice-count">${resolved?'RECORDED':`${d.moves.length} OPTIONS`}</span></header><div class="ng-moves">${moves}</div></section></div></section>`;
}
function right(){const horses=horseRows(),races=racingRows();const leads=document.querySelectorAll('.app .oppList .oppItem').length;const entered=races.filter(r=>/entered/i.test(r.status)).length;
return `<aside class="ng-right"><section class="ng-card ng-roster"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('horse')}" alt=""/></span><div class="ng-headinggroup"><h3>Stable Roster</h3><span>${horses.length} HORSES · CURRENT ACTIVITY</span></div><button class="ng-cardlink" data-ng="menu" data-val="Stable">ALL ${glyph('arrow',12)}</button></header><div class="ng-rostercolumns"><span>HORSE / ACTIVITY</span><span>STATUS</span></div><div class="ng-rosterrows">${horses.length?horses.map(h=>`<button class="ng-rosterrow" aria-label="Open horse profile: ${safe(h.name)}" data-ng="horse" data-val="${safe(h.name)}"><span class="ng-rostername">${horseOwnerBadge(h.name)}${safe(h.name)}</span><span class="ng-horseact">${safe(h.activity)}</span><span class="ng-rostertag">${safe(h.tag)}</span></button>`).join(''):'<div class="ng-rail-empty">No horses are listed for this stable yet.</div>'}</div></section><section class="ng-card ng-races"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><div class="ng-headinggroup"><h3>Race Schedule</h3><span>UPCOMING ENTRIES & TARGETS</span></div><button class="ng-cardlink" data-ng="menu" data-val="Racing">FULL ${glyph('arrow',12)}</button></header><div class="ng-entrycolumns"><span>DATE</span><span>HORSE / RACECOURSE</span><span>STATUS</span></div><div class="ng-entrylist">${races.length?races.map((r,i)=>`<button class="ng-entryrow" aria-label="Open race target: ${safe(r.name)} at ${safe(r.track)}" data-ng="fixture" data-val="${i}"><span class="ng-entrydate">${safe(r.date)}</span><span class="ng-entrycopy"><b>${horseOwnerBadge(r.name)}${safe(r.name)}</b><span><i class="ng-flag-us" aria-label="United States" role="img"></i> ${safe(r.track)}</span></span><span class="ng-entrytag"><b>${safe(r.tag)}</b><small class="${/entered/i.test(r.status)?'entered':''}">${safe(r.status.replace('·','').trim())}</small></span></button>`).join(''):'<div class="ng-rail-empty">No upcoming race targets are currently recorded.</div>'}</div></section><button class="ng-leads" data-ng="custom" data-val="Opportunities"><span class="ng-lead-star">${glyph('sparkle',16)}</span><strong>OPPORTUNITIES</strong><span>${leads?`${leads} CURRENT LEADS`:"NO CURRENT LEADS"}</span>${glyph('right',16)}</button></aside>`;
}
const currentRoute=()=>{const el=$('#routeShell');if(!el||el.hidden)return null;return {kicker:$('#routeKicker')?.textContent.trim()||'Page',title:$('#routeTitle')?.textContent.trim()||'Page',body:$('#routeBody')?.innerHTML||'',badge:$('.wtwRouteBadge',el)?.getAttribute('src')||badge('history')}};
const pageBadge=()=>{const map={Stable:'farm_stable',Racing:'major_races',Sales:'connections',Breeding:'pedigree',Personnel:'people',Facilities:'farm_stable',Finances:'reputation',World:'track',Search:'history',Messages:'people',Decisions:'career_record',Reports:'history',Career:'achievements',Opportunities:'reputation'};return badge(map[APP.custom.split(' ')[0]]||map[APP.section]||'history')};

// Canonical Office pedigree: no second page, save namespace or invented lineage.
// An entity name is resolved exactly to its immutable H-ID before retrieval.
const horsePedigreeCache=new Map();
const horsePedigreeLoading=new Set();
function loadOfficeHorsePedigree(name){
 if(horsePedigreeCache.has(name)||horsePedigreeLoading.has(name))return;
 horsePedigreeLoading.add(name);
 fetch('/api/entities?q='+encodeURIComponent(name)+'&kind=horse&limit=250',{credentials:'same-origin',cache:'no-store'})
 .then(r=>r.ok?r.json():Promise.reject(Error('Horse source unavailable')))
 .then(index=>{
  const ids=[...new Set((index.entities||[]).filter(e=>
   e.kind==='horse'&&(e.name===name||e.source_name===name)).map(e=>e.id))];
  if(ids.length!==1){
   horsePedigreeCache.set(name,{status:ids.length?'ambiguous':'unlinked'});
   return;
  }
  return fetch('/api/horses/'+encodeURIComponent(ids[0])+'/pedigree',{
   credentials:'same-origin',cache:'no-store'
  }).then(r=>r.ok?r.json():Promise.reject(Error('Pedigree source unavailable')))
   .then(data=>{
    if(data.horse_id!==ids[0]||!Array.isArray(data.nodes))throw Error('Invalid horse pedigree response');
    horsePedigreeCache.set(name,{status:'ready',horse_id:ids[0],data});
   });
 })
 .catch(()=>horsePedigreeCache.set(name,{status:'unavailable'}))
 .finally(()=>{horsePedigreeLoading.delete(name);schedulePaint(20)});
}
function officeFiveGenerationPedigree(name){
 const entry=horsePedigreeCache.get(name);
 const data=entry?.status==='ready'?entry.data:null;
 const all=new Map((data?.nodes||[]).filter(n=>/^[SD]{0,5}$/.test(n.path||'')).map(n=>[n.path,n]));
 const repeats=new Map();
 for(const n of all.values())if(n.horse_id)repeats.set(n.horse_id,(repeats.get(n.horse_id)||0)+1);
 if(!all.has(''))all.set('',{path:'',name,horse_id:null});
 const labels=['HORSE','PARENTS','GRANDPARENTS','GREAT-GRANDPARENTS','FOURTH GENERATION','FIFTH GENERATION'];
 let positions=[''];
 const columns=labels.map((label,depth)=>{
  const cells=positions.map(path=>{
   const n=all.get(path),known=Boolean(n?.horse_id),repeat=known&&(repeats.get(n.horse_id)||0)>1;
   const maternal=path.startsWith('D'),nameText=n?.name||'Unknown';
   const content=known&&path?
    '<button type="button" data-ng="pedigree-ancestor" data-val="'+safe(n.horse_id)+
    '" title="Open '+safe(nameText)+' horse profile">'+safe(nameText)+'</button>':
    '<span>'+safe(nameText)+'</span>';
   return '<div class="ng-ped5-node '+(known?'known':'unknown')+
    (repeat?' repeated':'')+(maternal?' maternal':' paternal')+'" title="'+
    safe(known?n.horse_id:'No documented ancestor')+'">'+content+'</div>';
  }).join('');
  positions=positions.flatMap(path=>[path+'S',path+'D']);
  return '<section class="ng-ped5-generation" aria-label="'+label+'"><header>'+label+'</header>'+
   '<div class="ng-ped5-stack">'+cells+'</div></section>';
 }).join('');
 const status=entry?.status==='ready'?
  Number(data.known_positions||all.size)+' / 63 POSITIONS SOURCE-LINKED':
  entry?.status==='ambiguous'?'AMBIGUOUS NAME — MATCH AN H-ID':
  entry?.status==='unlinked'?'HORSE ID NOT CONNECTED TO THIS OFFICE RECORD':
  entry?.status==='unavailable'?'SOURCE CONNECTION UNAVAILABLE':
  'CHECKING HISTORICAL HORSE RECORD';
 const note=entry?.status==='ready'?
  'Click any named ancestor to open its source-backed profile. Repeated ancestors are highlighted. Names follow saved display-name edits; identity follows Horse ID.':
  entry?.status==='unlinked'?
  'This Office horse has no exact match in the imported historical pedigree database. Ancestors are shown as unknown rather than invented.':
  entry?.status==='ambiguous'?
  'More than one historical horse uses this name. The profile needs its permanent Horse ID before a pedigree can be displayed.':
  entry?.status==='unavailable'?
  'The historical source is temporarily unavailable. No parent relationships are assumed.':
  'Checking the approved historical pedigree for an exact horse-identity match.';
 return '<section class="ng-detailcard ng-detailwide ng-ped5-card" aria-label="Five-generation pedigree">'+
  '<header><span>FIVE-GENERATION PEDIGREE</span><small>'+safe(status)+'</small></header>'+
  '<div class="ng-ped5-instructions">'+safe(note)+'</div>'+
  '<div class="ng-ped5-scroller" role="region" tabindex="0" aria-label="Five-generation pedigree scroll area">'+
  '<div class="ng-ped5-columns">'+columns+'</div></div>'+
  '<div class="ng-ped5-legend"><span><i class="ng-ped5-sire"></i>SIRE BRANCH</span>'+
  '<span><i class="ng-ped5-dam"></i>DAM BRANCH</span>'+
  '<span><i class="ng-ped5-repeat"></i>REPEATED ANCESTOR</span>'+
  '<small>63 TOTAL POSITIONS · UNKNOWN IS NOT ZERO</small></div></section>';
}

/* Read-only racecourse presentation facts. UI labels only: no alteration of race,
 * purse, venue geography, game state, or canonical historical registries.
 * Physical configurations are reference snapshots, not 1999-specific certification. */
const trackCourseFacts={
 'Belmont Park':{source:'https://cms.nyrainc.com/about/facility-details',rows:[
  ['MAIN DIRT','1½ miles'],['WIDENER TURF','1 5/16 miles'],
  ['INNER TURF','1 3/16 miles'],['SITE','445 acres']]},
 'Churchill Downs':{source:'https://www.twinspires.com/race-tracks/churchill-downs/',rows:[
  ['MAIN DIRT','1 mile'],['TURF OVAL','7/8 mile'],
  ['HOME STRETCH','1,234½ feet'],['MAIN WIDTH','80 feet']]},
 'Keeneland':{source:'https://www.playfecta.com/tracks/keeneland/',rows:[
  ['MAIN DIRT','1 1/16 miles'],['TURF OVAL','7½ furlongs'],
  ['HOME STRETCH','1,236 feet'],['TRAINING OVAL','5 furlongs']]},
 'Saratoga':{source:'https://www.twinspires.com/saratoga-race-meet-event-page/',rows:[
  ['MAIN DIRT','1 1/8 miles'],['MELLON TURF','1 mile + 98 ft'],
  ['INNER TURF','7 furlongs + 304 ft'],['HOME STRETCH','1,144 feet']]}
};

function profileDetail(route,sourceOverride=null){
 const source=$('#routeBody .profilePage')&&!sourceOverride?$('#routeBody .profilePage'):sourceOverride;if(!source)return null;
 const id=route.kicker+'|'+route.title;
 if(APP.routeId!==id){APP.routeId=id;APP.detailTab='Overview';APP.networkPage=0;APP.networkRole='all';APP.networkFocus='';APP.stakeSort='date';APP.stakeSortDesc=false}
 const text=(query,scope=source)=>$(query,scope)?.textContent.trim()||'';
 const fields=$$('.profileField',source).map(n=>({label:text('span',n),value:text('strong',n)||'—'}));
 const connection=$$('.profileLine',source).map(n=>({label:text('b',n),value:n.querySelector('button')?.textContent.trim()||n.querySelector('span')?.textContent.trim()||n.textContent.trim().replace(text('b',n),'').trim()||'—',button:n.querySelector('button')}));
 const blood=$$('.pedigreeNode',source).map(n=>({label:text('span',n),value:text('strong',n)||'—'}));
 const record=$$('.recordStat',source).map(n=>({label:text('span',n),value:text('b',n)||'—'}));
 const states=$$('.profileStatePill',source).map(n=>n.textContent.trim());
 const notes=$$('.achievementItem',source).map(n=>n.textContent.trim()).filter(Boolean);
 const details=$$('.profilePanel',source).map(n=>({title:text('h3',n),lines:n.textContent.trim().slice(0,700)}));
 const trackRaces=$$('.stakesRow',source).map((n,i)=>({name:text('strong',n),date:n.textContent.trim(),node:n,index:i}));
 const isHorse=route.kicker==='Horse Profile',isPerson=route.kicker==='People Profile',isFarm=route.kicker==='Farm Profile',isTrack=route.kicker==='Track Profile';
 const personnelAttributeColumns=()=>{
  const groupSizes=[9,15,12,10];
  return groupSizes.map((count,index)=>{
   const list=Array.from({length:count},(_,n)=>
    '<div class="ng-horse-rating-row ability-unrated"><span>Attribute slot '+
    String(n+1).padStart(2,'0')+'</span>'+
    '<span class="ng-horse-rating-unassessed" aria-hidden="true"></span>'+
    '<strong class="unknown">—</strong></div>').join('');
   return '<section class="ng-horse-mgr-panel ng-horse-ratings" data-personnel-attribute-group="'+(index+1)+
    '"><header><strong>ATTRIBUTE GROUP '+String(index+1).padStart(2,'0')+
    '</strong><span>0/'+count+' ASSIGNED</span></header>'+
    '<div class="ng-horse-rating-rows">'+list+'</div></section>';
  }).join('');
 };

 const tabs=(isHorse?['Overview','Career Record','Pedigree','Achievements','Connections','History']:
  isPerson?['Overview','Attributes','Reputation','Network','Stable Horses','Career','Connections','History']:
  isFarm?['Overview','Connected Horses','Operations','Connections','History']:
  isTrack?['Overview','Meet Schedule','Major Races','Connections','History']:
  ['Overview','Connections','History']);
 const rows=(items)=>'<div class="ng-data-rows">'+items.map(i=>`<div class="ng-data-row"><span>${safe(i.label)}</span>${namedProfileValue(i.label,i.value)}</div>`).join('')+'</div>';
 const pills='<div class="ng-status-pills">'+states.slice(0,4).map(x=>`<span>${safe(x)}</span>`).join('')+'</div>';
 const tabbar=isTrack||isFarm?'':(isPerson||isHorse)?`<nav class="ng-person-dossierbar ng-management-dossierbar" aria-label="Personnel dossier navigation">
   <span class="ng-person-dossierlabel">${isHorse?'HORSE RACING FILE':'PERSONNEL DOSSIER'} <small>ONE-SCREEN OVERVIEW</small></span>
   <div class="ng-person-dossieractions">
    <button data-ng="detailtab" data-val="Overview" class="${APP.detailTab==='Overview'?'on':''}">OVERVIEW</button>
    <button data-ng="detailtab" data-val="History" class="${APP.detailTab==='History'?'on':''}">HISTORY</button>
    <select data-ng-select="profile-record" aria-label="Open deeper profile records">
     <option value="">MORE RECORDS</option>
     ${tabs.filter(t=>!['Overview','History'].includes(t)).map(t=>`<option value="${safe(t)}" ${APP.detailTab===t?'selected':''}>${safe(t)}</option>`).join('')}
    </select>
   </div>
  </nav>`:
  '<nav class="ng-profiletabs" aria-label="'+safe(route.kicker)+' sections">'+tabs.map(t=>`<button data-ng="detailtab" data-val="${safe(t)}" class="${APP.detailTab===t?'on':''}" aria-current="${APP.detailTab===t?'page':'false'}">${safe(t)}</button>`).join('')+'</nav>';
 const factsBlock=`<div class="ng-profile-facts">${fields.map(f=>`<div><small>${safe(f.label)}</small>${namedProfileValue(f.label,f.value)}</div>`).join('')}</div>`;

 const horseAchievementPanel=isHorse?$$('.profilePanel',source).find(panel=>text('h3',panel).includes('Achievements')):null;
 const horseAchievements=horseAchievementPanel?$$('.achievementItem',horseAchievementPanel).map(el=>el.textContent.trim()).filter(Boolean):[];
 const horseLinkedConnection=f=>{
  const key=String(f.label).trim().toLowerCase();
  const id=key==='breeder'?source.dataset.breederId:
   key==='foaling farm'?source.dataset.foalingFarmId:'';
  if(isHorse&&source.dataset.testGenerated==='true'&&id){
   const action=key==='breeder'?'1999-breeder':'1999-foaling-farm';
   return '<button type="button" class="ng-entity-reference" data-ng="'+action+
    '" data-val="'+safe(id)+'" title="Open linked '+safe(f.label)+' record">'+safe(f.value)+' ↗</button>';
  }
  if(f.button)return '<button data-ng="sourcebutton" data-val="'+$('#routeBody [data-act]').indexOf(f.button)+
   '" aria-label="Open '+safe(f.label)+' profile: '+safe(f.value)+'">'+safe(f.value)+' ↗</button>';
  return namedProfileValue(f.label,f.value);
 };
 const connectionRows=(items=connection)=>'<div class="ng-data-rows">'+items.map(f=>
  '<div class="ng-data-row"><span>'+safe(f.label)+'</span>'+horseLinkedConnection(f)+'</div>'
 ).join('')+'</div>';

 // Source-first IDs: do not resolve founder connections by an ambiguous name.
 const founderOrg=isFarm?(world1999Data?.organizations||[]).find(o=>o.id===source.dataset.organizationId):null;
 const founderPerson=isPerson?(world1999Data?.people||[]).find(p=>p.id===source.dataset.personId):null;
 const allApprovedFounders=world1999Data?.people||[];
 const founderMemberIds=new Set([founderOrg?.publicPrincipalId,founderOrg?.principalOwnerId,
  founderOrg?.publicInvestorId,...(founderOrg?.leadershipPeopleIds||[])].filter(Boolean));
 const founderMembers=isFarm?allApprovedFounders.filter(p=>founderMemberIds.has(p.id)||
  p.operatingOrganizationId===founderOrg?.id||p.investorInOrganizationId===founderOrg?.id):[];
 const founderAffiliations=isPerson?(world1999Data?.organizations||[]).filter(o=>
  o.principalOwnerId===founderPerson?.id||o.publicPrincipalId===founderPerson?.id||
  o.publicInvestorId===founderPerson?.id||(o.leadershipPeopleIds||[]).includes(founderPerson?.id)||
  o.id===founderPerson?.operatingOrganizationId||o.id===founderPerson?.investorInOrganizationId):[];
 const founderStock=isFarm?(world1999Data?.horses||[]).filter(h=>
  h._role==='stallion'&&h.standingFarm1999?.farmOrganizationId===founderOrg?.id||
  h._role==='broodmare'&&h.boardingFarm1999?.farmOrganizationId===founderOrg?.id):[];
 const founderHistorical=isFarm?(world1999Data?.historicalAnchors||[]).filter(a=>a.organizationId===founderOrg?.id):[];
 const founderPersonLinks=()=>'<div class="ng-entity-links">'+
  (founderMembers.map(p=>'<div class="ng-entity-link-static"><span>'+
   safe(p.id===founderOrg?.publicInvestorId?'MAJOR NON-OPERATING INVESTOR':
    p.id===founderOrg?.principalOwnerId?'APPROVED PRINCIPAL':
    (p.positionTitle||p.role||'APPROVED CONNECTION').replaceAll('_',' '))+
   '</span>'+world1999Linked('person',p.id,p.name)+'</div>').join('')||
   '<div class="ng-empty-record">Principal not approved yet; no individual assigned.</div>')+
  (founderOrg?.relatedBloodstockAgencyId?'<div class="ng-entity-link-static"><span>RELATED BLOODSTOCK AGENCY</span>'+
   world1999Linked('farm',founderOrg.relatedBloodstockAgencyId,founderOrg.relatedBloodstockAgencyName)+'</div>':'')+
  (founderOrg?.relatedBloodstockStrategistId?'<div class="ng-entity-link-static"><span>BLOODSTOCK STRATEGIST</span>'+
   world1999Linked('person',founderOrg.relatedBloodstockStrategistId,'Julian Voss')+'</div>':'')+
  '</div>';
 const founderStockRows=()=>'<div class="ng-entity-links">'+(founderStock.map(h=>
  '<div class="ng-entity-link-static"><span>'+safe(h._role==='stallion'?'STALLION':'BROODMARE')+
  '</span>'+world1999Linked('horse',h.id,h.name)+'</div>').join('')||
  '<div class="ng-empty-record">No approved breeding stock linked to this operation.</div>')+'</div>';
 const founderHistoryRows=()=>'<div class="ng-stakes-table"><div class="ng-stakes-head">'+
  '<span>HORSE</span><span>RECORDED ROLE</span><span>YEARS</span><span>EVIDENCE</span></div>'+
  (founderHistorical.map(a=>{
   const target=world1999Entry('horse:'+a.horseId)||world1999Entry('historical-horse:'+a.horseId);
   return '<div class="ng-stakes-data"><span>'+(target?
    '<button type="button" data-ng="world-open" data-val="'+safe(target.worldKey)+'">'+safe(a.horse)+'</button>':
    safe(a.horse))+'</span><span>'+safe(String(a.role||'').replaceAll('_',' '))+
    '</span><span>'+safe((a.recordedStakesYears||[]).join(', ')||'—')+
    '</span><span>'+safe(a.status==='SOURCE_VERIFIED'?'SOURCE':'REVIEW')+'</span></div>';
  }).join('')||'<div class="ng-empty-record">No source-certified historical horse associations recorded.</div>')+
  '</div><p class="ng-horse-small-note">Year-level historical links do not prove race-day contracts, ownership, or purse earnings.</p>';
 const founderAffiliationRows=()=>'<div class="ng-horse-mgr-rows">'+
  (founderAffiliations.map(o=>'<div class="ng-horse-mgr-row"><span>'+
   safe(o.publicInvestorId===founderPerson?.id?'MAJOR NON-OPERATING INVESTOR':
    o.principalOwnerId===founderPerson?.id||o.publicPrincipalId===founderPerson?.id?
    'FOUNDING PRINCIPAL':'FOUNDING ORGANIZATION')+'</span>'+
   world1999Linked('farm',o.id,o.name)+'</div>').join('')||
  '<div class="ng-empty-record">No approved organization affiliation recorded.</div>')+'</div>';
 const sourcePanels=[...source.querySelectorAll('.profilePanel')];
 const sourcePanel=word=>sourcePanels.find(panel=>text('h3',panel).toLowerCase().includes(word.toLowerCase()));
 const connectedPanel=isPerson?sourcePanel('Stable'):isFarm?sourcePanel('Connected Horses'):null;
 const sourceLinks=connectedPanel?$$('.achievementItem',connectedPanel):[];
 const connectedHorseRows=(limit=null)=>'<div class="ng-entity-links">'+((limit===null?sourceLinks:sourceLinks.slice(0,limit)).map(item=>{
  const btn=$('button[data-act]',item);
  const index=btn?$$('#routeBody [data-act]').indexOf(btn):-1;
  const label=(btn?.textContent.trim()||item.textContent.trim()).replace(/\s+/g,' ').trim();
  return index>=0?'<button data-ng="sourcebutton" data-val="'+index+'" aria-label="Open horse '+safe(label)+'"><span class="ng-horse-with-owner">'+horseOwnerBadge(label)+safe(label)+'</span>'+glyph('right',14)+'</button>':'<div class="ng-entity-link-static">'+namedProfileValue('Horse',label,'horse')+'</div>';
 }).join('')||'<div class="ng-empty-record">No linked horses recorded.</div>')+'</div>';
 const personCareer=isPerson?sourcePanel('Career Wins'):null;
 const personReputation=isPerson?sourcePanel('Reputation'):null;
 const personWins=personCareer?text('.bigMetric strong',personCareer):'';
 const reputationLabel=personReputation?text('.bigMetric strong',personReputation):'';
 const meterValue=personReputation?$('.reputationBar i',personReputation)?.style.width||'':'';
 const reputationGauge=/^(?:100|[0-9]?\d)%$/.test(meterValue)?'<div class="ng-source-meter" aria-label="Source-backed reputation indicator"><span style="width:'+safe(meterValue)+'"></span></div>':'';
 const farmAchievementPanel=isFarm?sourcePanel('Achievements'):null;
 const farmAchievements=farmAchievementPanel?$$('.achievementItem',farmAchievementPanel).map(item=>item.textContent.trim()).filter(Boolean):[];
 const meetValues=isTrack?$$('.meetBlock',source).map(n=>({label:text('span',n),value:text('strong',n)})):[];
 const trackNotes=isTrack?$$('.trackNote',source).map(n=>({label:text('b',n),value:n.textContent.replace(text('b',n),'').trim()})):[];
 const trackRaceDays=trackNotes.find(x=>/race days/i.test(x.label));
 const trackOperatingNotes=trackNotes.filter(x=>!/race days|current office/i.test(x.label));
 const trackOfficeContext=trackNotes.find(x=>/current office/i.test(x.label)&&!/no current office entry/i.test(x.value));
 const trackConnectionLinks=connection.filter(x=>x.button);
 // Track history is a read-only supplement to the canonical Office track records.
 const trackAuthority=isTrack?(typeof window.__wtwOfficeTrackDirectory==='function'?
  window.__wtwOfficeTrackDirectory().find(x=>x.name===route.title):null):null;
 const trackHistory={
  opened:trackAuthority?.openingDate||'Not verified',
  capacity:trackAuthority?.capacity||'Not verified',
  capacityType:trackAuthority?.capacityType||'CAPACITY',
  capacityAsOf:trackAuthority?.capacityAsOf||'',
  blurb:trackAuthority?.historyBlurb||'Historical background has not yet been source-certified for this course.',
  source:trackAuthority?.historySource||''
 };
 const trackHistoryFacts=()=>'<div class="ng-track-history-facts">'+
  '<div><small>OPENED</small><strong>'+safe(trackHistory.opened)+'</strong></div>'+
  '<div><small>'+safe(trackHistory.capacityType)+'</small><strong>'+safe(trackHistory.capacity)+'</strong>'+
  (trackHistory.capacityAsOf?'<em>'+safe(trackHistory.capacityAsOf)+'</em>':'')+'</div></div>';
 const trackHistoryBlurb=()=>'<p class="ng-track-history-blurb">'+safe(trackHistory.blurb)+'</p>';
 const trackHistoryPanel=()=>'<section class="ng-tier1-card ng-track-history-card" aria-label="Track history">'+
  '<header>TRACK HISTORY <button data-ng="detailtab" data-val="History" aria-label="Open full history of '+safe(route.title)+'">FULL HISTORY ↗</button></header>'+
  '<div class="ng-track-history-content">'+trackHistoryFacts()+trackHistoryBlurb()+'</div></section>';
 const trackHistoryFull=()=>'<section class="ng-detailcard ng-detailwide ng-track-history-full">'+
  '<header>TRACK HISTORY · '+safe(route.title)+' <button data-ng="detailtab" data-val="Overview">← TRACK OVERVIEW</button></header>'+
  trackHistoryFacts()+trackHistoryBlurb()+
  (trackHistoryItems.length?'<div class="ng-notes">'+trackHistoryItems.slice(0,5).map(n=>'<div>'+safe(n)+'</div>').join('')+'</div>':'')+
  (trackHistory.source?'<p class="ng-track-history-source">HISTORICAL REFERENCE: <a href="'+safe(trackHistory.source)+'" target="_blank" rel="noopener noreferrer">OPEN SOURCE ↗</a></p>':'')+
  '</section>';
 const trackHistoryItems=isTrack?notes.filter(x=>!/\b(runtime|wiring|canonical|live season calendar|deployment|database|schema|stylesheet)\b/i.test(x)):[];
 const trackMeetFacts=[...meetValues,...(trackRaceDays?[trackRaceDays]:[])];
 const trackConfig=isTrack?trackCourseFacts[route.title]:null;
 const trackConfigMarkup=trackConfig?
  '<div class="ng-track-course-panel" aria-label="Racecourse configuration">'+
   '<div class="ng-track-course-heading"><strong>TRACK CONFIGURATION</strong>'+
    '<a href="'+safe(trackConfig.source)+'" target="_blank" rel="noopener noreferrer" title="Course reference, not specifically certified for 1999">SOURCE ↗</a></div>'+
   '<div class="ng-track-course-grid">'+trackConfig.rows.map(([label,value])=>
    '<div class="ng-track-course-fact"><small>'+safe(label)+'</small><b>'+safe(value)+'</b></div>').join('')+
   '</div></div>':'';

 const stakeDateRank=value=>{
  const match=String(value||'').match(/\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})\b/i);
  if(!match)return Number.MAX_SAFE_INTEGER;
  const month='jan feb mar apr may jun jul aug sep oct nov dec'.split(' ').indexOf(match[1].slice(0,3).toLowerCase());
  return month<0?Number.MAX_SAFE_INTEGER:month*32+Number(match[2]);
 };
 // Read-only: summarize only the WTW race rows already available on this track.
 const stakeScheduleSummary=()=>{
  const raw=trackRaces.map(r=>r.node?.children?.[3]?.textContent?.trim()||'');
  const parsed=raw.map(v=>/^\$[\d,]+(?:\.\d+)?$/.test(v)?Number(v.replace(/[$,]/g,'')):null);
  const canTotal=parsed.length>0&&parsed.every(v=>typeof v==='number'&&Number.isFinite(v));
  const sum=canTotal?parsed.reduce((a,b)=>a+b,0):0;
  const amount=canTotal?'$'+sum.toLocaleString('en-US'):'';
  return trackRaces.length+' RACE RECORDS'+(canTotal?' · '+amount+' SCHEDULED PURSES':'');
 };
 const stakesTable=(limit=100)=>{
  const values={name:0,date:1,grade:2,purse:3};
  const gradeRank=value=>{const g=(String(value||'').match(/\bG([123])\b/i)||[])[1];return g?Number(g):/major/i.test(value)?4:5};
  const purseRank=value=>{const n=Number(String(value||'').replace(/[^\d.]/g,''));return Number.isFinite(n)?n:-1};
  const rank=(key,row)=>key==='date'?stakeDateRank(row.cols[1]):key==='grade'?gradeRank(row.cols[2]):key==='purse'?purseRank(row.cols[3]):row.cols[0].toLocaleLowerCase();
  const compare=(a,b)=>{
   const av=rank(APP.stakeSort,a),bv=rank(APP.stakeSort,b);
   const result=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
   return (APP.stakeSortDesc?-1:1)*result || a.cols[0].localeCompare(b.cols[0]);
  };
  const ordered=trackRaces.map(row=>({row,cols:[...row.node.children].map(item=>item.textContent.trim()).slice(0,4)}))
   .sort(compare);
  const labels=[['name','RACE'],['date','DATE'],['grade','GRADE'],['purse','PURSE']];
  const header=labels.map(([key,label])=>{
   const active=APP.stakeSort===key,mark=active?(APP.stakeSortDesc?'↓':'↑'):'↕';
   return '<button type="button" data-ng="stake-sort" data-val="'+key+'" aria-sort="'+(active?(APP.stakeSortDesc?'descending':'ascending'):'none')+'"><span>'+label+'</span><i aria-hidden="true">'+mark+'</i></button>';
  }).join('');
  return '<div class="ng-stakes-table"><div class="ng-stakes-head">'+header+'</div>'+
   (ordered.slice(0,limit).map(({row,cols})=>{
    while(cols.length<4)cols.push('—');
    const index=$$('#routeBody [data-act]').indexOf(row.node);
    const grade=(cols[2].match(/\bG([123])\b/i)||[])[1];
    const gradeCell=grade?'<span class="ng-stakes-grade" aria-label="Grade '+grade+'" title="Grade '+grade+'"><img class="ng-stakes-trophy" src="/assets/trophies/approved-grade-'+grade+'-64.png" alt="" width="16" height="16" decoding="async"/><small class="ng-stakes-grade-text" aria-hidden="true">G'+grade+'</small></span>':'<span>'+safe(cols[2])+'</span>';
    const stakeId=row.node.dataset.stakeId||'';
    // Detached source rows have no legacy Office index: keep a live 1999 race-file click target.
    return '<button class="ng-stakes-data" data-ng="1999-stake" data-val="'+safe(stakeId)+
      '" data-name="'+safe(cols[0])+'" data-track="'+safe(route.title)+'" data-date="'+safe(cols[1])+'">'+
     '<span>'+safe(cols[0])+'</span><span>'+safe(cols[1])+'</span>'+gradeCell+'<span>'+safe(cols[3])+'</span></button>';
   }).join('')||'<div class="ng-empty-record">No verified stakes rows connected.</div>')+'</div>';
 };
 const entityPhotoKind=isHorse?'horse':isPerson?'person':isFarm?'farm':isTrack?'track':'';
 const profileSource=entityPhotoKind?world1999Match(entityPhotoKind,route.title):null;
 const horseImage=entityPhotoKind?approvedIdentityAsset(entityPhotoKind,profileSource?._world?.id||'',route.title):'';
 const sourceDecision=isHorse?$('#routeBody [data-act="Open profile decision"]'):null;
 const sourceFollowUp=isHorse?$('#routeBody [data-act="Open follow-up"]'):null;
 const quickLinks=[sourceDecision?'<button data-ng="sourcebutton" data-val="'+$$('#routeBody [data-act]').indexOf(sourceDecision)+'">OPEN RELATED DECISION '+glyph('arrow',12)+'</button>':'',
 sourceFollowUp?'<button data-ng="sourcebutton" data-val="'+$$('#routeBody [data-act]').indexOf(sourceFollowUp)+'">OPEN FOLLOW-UP '+glyph('arrow',12)+'</button>':''].filter(Boolean).join('');

 const athleteOverview=()=>{
  const catalog=athleteAttributeCatalog;
  const categories=catalog?.horse_categories||{};
  const display=catalog?.display?.horse_overview||{};
  const genuineReports=state().scoutingState?.[route.title]?.attribute_observations||[];
   const testSource=typeof source!=='undefined'&&(source?.dataset?.testGenerated==='true'||source?.dataset?.testAttributeModel==='true');
   const testAttrs=typeof source!=='undefined'?source?.dataset?.testAttributes:'';
   let testModel={};if(testSource){try{testModel=JSON.parse(testAttrs||'{}')}catch{}}
   const demoReports=Object.entries(testModel).filter(([,v])=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=1)
    .map(([attribute_key,v])=>({attribute_key,status:'estimated',estimate:Math.round(v*99),scale_min:0,scale_max:99,
     evidence_refs:['SIMULATED_1999_TEST_MODEL'],testGenerated:true}));
   const reports=[...demoReports,...(Array.isArray(genuineReports)?genuineReports:[])];
  const observed=new Map((Array.isArray(reports)?reports:[])
   .filter(r=>r&&typeof r.attribute_key==='string').map(r=>[r.attribute_key,r]));
  const known=x=>x!=null&&String(x).trim()&&!['—','Unknown','Not recorded','N/A'].includes(String(x).trim());
  const assessed=r=>r&&['estimated','measured'].includes(r.status)&&r.estimate!=null&&
   Array.isArray(r.evidence_refs)&&r.evidence_refs.length>0;
  const allDefs=Object.values(categories).flat();
  const observedCount=allDefs.filter(d=>assessed(observed.get(d.key))).length;
  const attributeColumns=Object.entries(display).map(([name,previewKeys])=>{
   const keys=(categories[name]||[]).map(def=>def.key);
   const defs=new Map((categories[name]||[]).map(def=>[def.key,def]));
   const lines=keys.map(key=>{
    const def=defs.get(key);if(!def)return '';
    const report=observed.get(key),verified=assessed(report);
    const label=verified?(report.testGenerated?'SIMULATED TEST SCORE · NOT AN OBSERVATION':report.status==='measured'?'Measured':'Scout estimate'):'Not yet assessed';
    const value=verified?String(report.estimate)+(report.unit?' '+report.unit:''):'—';
    const scaled=verified&&Number.isFinite(Number(report.estimate))&&
     Number.isFinite(Number(report.scale_min))&&Number.isFinite(Number(report.scale_max))&&
     Number(report.scale_max)>Number(report.scale_min)?
      Math.max(0,Math.min(100,100*(Number(report.estimate)-Number(report.scale_min))/
      (Number(report.scale_max)-Number(report.scale_min)))):null;
    const meter=scaled==null?'<span class="ng-horse-rating-unassessed" aria-hidden="true"></span>':
     '<span class="ng-horse-rating-track" aria-hidden="true"><i style="width:'+scaled.toFixed(1)+'%"></i></span>';
    const abilityBand=scaled===null?'ability-unrated':scaled>=75?'ability-high':
     scaled>=55?'ability-good':scaled>=35?'ability-moderate':'ability-low';
    return '<div class="ng-horse-rating-row '+abilityBand+'" title="'+safe(def.meaning)+' · '+safe(label)+'"><span>'+safe(def.label)+'</span>'+meter+
     '<strong class="'+(verified?'known':'unknown')+'">'+safe(value)+'</strong></div>';
   }).join('');
   return '<section class="ng-horse-mgr-panel ng-horse-ratings"><header><strong>'+safe(name.toUpperCase())+'</strong>'+
    '<span>'+keys.filter(key=>assessed(observed.get(key))).length+'/'+keys.length+' KNOWN</span></header>'+
    '<div class="ng-horse-rating-rows">'+lines+'</div></section>';
  }).join('');
  const conditionDefs=categories['Current Condition']||[];
  const conditionStrip='<div class="ng-horse-condition-strip" aria-label="Current condition attributes">'+
   conditionDefs.map(def=>{
    const report=observed.get(def.key),verified=assessed(report);
    return '<div class="ng-horse-condition-cell"><span>'+safe(def.label)+'</span>'+
     '<strong class="'+(verified?'known':'unknown')+'" title="'+safe(verified?report.testGenerated?'1999 SIMULATED TEST STATE':'Source-backed '+report.status:'Not yet assessed')+'">'+
      (verified?safe(String(report.estimate)+(report.unit?' '+report.unit:'')):'—')+'</strong></div>';
   }).join('')+'</div>';
  const asMap=items=>'<div class="ng-horse-mgr-rows">'+items.map(([name,value])=>
   '<div class="ng-horse-mgr-row"><span>'+safe(name)+'</span>'+namedProfileValue(name,value)+'</div>').join('')+'</div>';
  const career=record.filter(x=>known(x.value)).map(x=>[x.label,x.value]);
  let testCareer={};
  if(testSource)try{testCareer=JSON.parse(source.dataset.testCareer||'{}')}catch{}
  const testRaceHistory=Array.isArray(testCareer.raceHistory)?testCareer.raceHistory:[];
  const careerBody=career.length?asMap(career):
   '<p class="ng-horse-small-note">No verified career figures in this Office record.</p>';
  const status=states.find(x=>x&&!/^Target:|^Entry:/.test(x))||'No current update';
  const target=states.find(x=>/^Target:/.test(x))?.replace(/^Target:\s*/,'')||'Not entered';
  const entry=states.find(x=>/^Entry:/.test(x))?.replace(/^Entry:\s*/,'')||'Not recorded';
  const health=notes.find(x=>/Health\s*\/\s*Vet/i.test(x));
  const condition=asMap([['Status',status],...(health?[['Health / Vet',health.replace(/^Health\s*\/\s*Vet\s*[:·-]?\s*/i,'')]]:[])]);
  const racePlan=asMap([['Target',target],['Entry',entry]]);
  const liveNotes=notes.filter(x=>!/^No resolved decision|^No open follow-up/i.test(x)).slice(0,4);
  const activity=liveNotes.length?'<div class="ng-horse-mgr-notes">'+liveNotes.map(x=>
   '<div title="'+safe(x)+'">'+safe(x)+'</div>').join('')+'</div>':
    '<p class="ng-horse-small-note">No verified work or recent office report attached.</p>';
  const knownConnections=connection.filter(x=>known(x.value)).slice(0,6);
  const links=knownConnections.map(x=>{
   const index=x.button?$$('#routeBody [data-act]').indexOf(x.button):-1;
   const label='<span>'+safe(x.label)+'</span>';
   const value=index>=0?'<button data-ng="sourcebutton" data-val="'+index+'">'+safe(x.value)+' ↗</button>':
    namedProfileValue(x.label,x.value);
   return '<div class="ng-horse-mgr-row">'+label+value+'</div>';
  }).join('');
  const connections=links?'<div class="ng-horse-mgr-rows">'+links+'</div>':
   '<p class="ng-horse-small-note">Connections not yet verified.</p>';
  const pedigree=blood.filter(x=>known(x.value));
  const pedigreeBlock=pedigree.length?asMap(pedigree.map(x=>[x.label,x.value])):
   '<p class="ng-horse-small-note">Pedigree not yet connected to the approved horse record.</p>';
  const history=state().horseState?.[route.title]?.certified_results;
  const verifiedHistory=Array.isArray(history)?history.filter(x=>x&&
   Array.isArray(x.source_refs)&&x.source_refs.length>0&&known(x.date)&&known(x.race)):[];
  const testHistoryTable=items=>'<div class="ng-horse-form-table">'+
   '<div class="ng-horse-form-head"><span>DATE</span><span>RACE / TRACK</span><span>FINISH</span><span>SOURCE</span></div>'+
   items.map(x=>'<div class="ng-horse-form-row"><span>'+safe(x.date)+'</span><span>'+
    safe(x.raceClass||'Race')+' · '+safe(x.trackName||'')+' · '+
    safe(x.distanceFurlongs||'')+'f '+safe(x.surface||'')+
    '</span><span>'+safe(x.finishPosition||'—')+'</span><span>1999 TEST MODEL</span></div>').join('')+'</div>';
  const recent=verifiedHistory.length?'<div class="ng-horse-form-table"><div class="ng-horse-form-head"><span>DATE</span><span>RACE / TRACK</span><span>FINISH</span><span>SOURCE</span></div>'+
   verifiedHistory.slice(-5).reverse().map(x=>'<div class="ng-horse-form-row"><span>'+safe(x.date)+'</span><span>'+
   entityReferenceButton(x.race,'race',known(x.track)?'data-track="'+safe(x.track)+'"':'')+
   (known(x.track)?' · '+entityReferenceButton(x.track,'track'):'')+
   '</span><span>'+safe(x.finish||'—')+'</span><span>Verified</span></div>').join('')+'</div>':
   testRaceHistory.length?testHistoryTable(testRaceHistory.slice(0,5)):
   '<p class="ng-horse-small-note">No certified race-by-race form or pre-1999 starts attached; source and test histories remain separate.</p>';
  const panel=(name,body,cls='')=>'<section class="ng-horse-mgr-panel '+cls+'"><header><strong>'+name+'</strong></header>'+body+'</section>';
  return '<div class="ng-horse-dossier">'+
   '<div class="ng-horse-dossier-caption"><strong>ATHLETE & RACING INTELLIGENCE</strong><span>'+observedCount+
   ' OF '+allDefs.length+(testSource?' SIMULATED TEST ATTRIBUTES · NOT OBSERVED':' ATTRIBUTES ASSESSED · UNASSESSED ≠ ZERO')+'</span></div>'+
   '<div class="ng-horse-mgr-four">'+(attributeColumns||'<p class="ng-horse-small-note">Horse attribute definitions have not loaded.</p>')+'</div>'+conditionStrip+
   '<div class="ng-horse-mgr-five">'+
    panel('CAREER RECORD',careerBody)+panel('CURRENT CONDITION',condition)+
    panel('RACE PLAN',racePlan)+panel('RECENT WORK / OFFICE REPORTS',activity)+
    panel('KEY CONNECTIONS',connections)+'</div>'+
   '<div class="ng-horse-mgr-bottom">'+panel('RECENT RACES & FORM',recent,'ng-horse-form-card')+
    panel('PEDIGREE & BACKGROUND',pedigreeBlock,'ng-horse-pedigree-card')+'</div>'+
   '<div class="ng-horse-mgr-summary"><div><strong>RACING OFFICE SUMMARY</strong>'+
    '<span>'+safe(status)+(known(target)?' · Next target: '+safe(target):'')+'</span></div>'+
    '<div class="ng-horse-mgr-actions">'+quickLinks+'</div></div>'+
   '</div>';
 };

 const personWork=()=>{
  const roleName=String(source?.dataset?.personRole||text('.profileSubline').replace(/^Job:\s*/i,'')).replaceAll('_',' ').trim().toLowerCase(),roleDisplay=titleCaseUIRole(roleName);
  const namedRoles={
   'stable staff':'stable_staff','bloodstock':'bloodstock_professional',
   'bloodstock agent':'bloodstock_agent','trainer':'trainer','jockey':'jockey',
   'owner':'owner','breeder':'breeder','farm manager':'farm_manager',
   'veterinarian':'veterinarian','farrier':'farrier',
   'racing secretary':'racing_secretary'
  };
  const roleTokens=roleName.split(/\s*(?:\/|,|\+|&)\s*/).map(x=>namedRoles[x]||x.replaceAll(' ','_'));
  const roles=[...new Set(roleTokens.filter(Boolean))],role=roles[0]||null,cat=athleteAttributeCatalog||{};
  const work=state().staffState?.[route.title]||{};
  const observations=Array.isArray(work.attribute_observations)?work.attribute_observations:[];
  const observed=new Map(observations.filter(x=>x&&typeof x.attribute_key==='string').map(x=>[x.attribute_key,x]));
  const common=cat.person_common||[],special=[...new Map(roles.flatMap(role=>cat.person_roles?.[role]||[]).map(def=>[def.key,def])).values()];
  const simulatedPerson=source?.dataset?.testGenerated==='true'||source?.dataset?.testAttributeModel==='true';
  let modeled={};if(simulatedPerson)try{modeled=JSON.parse(source.dataset.testAttributes||'{}')}catch{}
  // A model-only number is not an observed skill rating or certified fact.
  const modelNumber=def=>{const n=modeled?.[def.key];return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=1?n:null;};
  const quick=cat.display?.person_overview||{},commonQuick=(quick.common||[]).map(key=>common.find(t=>t.key===key)).filter(Boolean);
  const reputationSource=work.reputation_profile;
  const validRep=reputationSource?.schema==='WTW_PERSON_REPUTATION_V1'&&typeof reputationSource.scores?.overall==='number'&&
   Number.isFinite(reputationSource.scores.overall)&&reputationSource.scores.overall>=0&&reputationSource.scores.overall<=100&&
   Array.isArray(reputationSource.source?.refs)&&reputationSource.source.refs.length>0;
  const rep=validRep?reputationSource:null,axes=cat.reputation?.axes||[];
  const trust=typeof work.trust==='number'&&Number.isFinite(work.trust)?work.trust:null;
  const relationshipNotice=trust===null?'':'<div class="ng-person-relationship"><span>WORKING RELATIONSHIP TRUST</span><strong>'+(trust>0?'+':'')+safe(String(trust))+'</strong></div>';
  const attr=(def)=>{
   const obs=observed.get(def.key);
   const valid=obs&&(obs.status==='estimated'||obs.status==='measured')&&obs.estimate!==null&&obs.estimate!==undefined&&
    Array.isArray(obs.evidence_refs)&&obs.evidence_refs.length>0;
   const preview=modelNumber(def),modeledValue=!valid&&preview!==null;
   const displayed=valid?String(obs.estimate):modeledValue?preview.toFixed(2)+' · TEST':'—';
   const provenance=modeledValue?' · 1999 normalized TEST estimate; not an observed rating or source fact':'';
   return `<div class="ng-person-attribute" title="${safe(def.meaning+provenance)}"><span>${safe(def.label)}</span><strong class="${valid?'assessed':modeledValue?'test-modeled':'unassessed'}">${safe(displayed)}</strong></div>`;
  };
  const attributes=(full=false)=>{
   const isObserved=def=>{const o=observed.get(def.key);return o&&
    (o.status==='measured'||o.status==='estimated')&&o.estimate!=null&&Array.isArray(o.evidence_refs)&&o.evidence_refs.length;};
   const found=common.filter(isObserved).length+special.filter(isObserved).length;
   const modelCount=[...common,...special].filter(def=>!isObserved(def)&&modelNumber(def)!==null).length;
   const modelNotice=modelCount?'<small>'+modelCount+' SIMULATED TEST VALUES · NOT OBSERVATIONS</small>':'';
   if(full)return `<div class="ng-person-attribute-block"><div class="ng-person-minihead">PROFESSIONAL FOUNDATIONS <small>${common.filter(isObserved).length}/${common.length} ASSESSED</small>${modelNotice}</div>${common.map(attr).join('')}${special.length?`<div class="ng-person-minihead">${safe(roleDisplay.toUpperCase())} SKILLS <small>ROLE SPECIALTIES</small></div>${special.map(attr).join('')}`:''}</div>`;
   const first=common.slice(0,Math.ceil(common.length/2)),second=common.slice(Math.ceil(common.length/2));
   const column=(rows,label)=>`<section class="ng-person-skill-column"><div class="ng-person-minihead">${safe(label)}</div>${rows.map(attr).join('')}</section>`;
   return `<div class="ng-person-attribute-block ng-person-skill-matrix">
     <div class="ng-person-assessment-summary"><span>SCOUTING COVERAGE</span><strong>${found} / ${common.length+special.length} ASSESSED</strong><small>UNKNOWN DOES NOT MEAN ZERO</small>${modelNotice}</div>
     <div class="ng-person-skill-columns">${column(first,'CORE ABILITIES')}${column(second,'PROFESSIONAL HABITS')}${special.length?column(special,roleDisplay.toUpperCase()+' SKILLS'):''}</div>
     ${!common.length?'<p class="ng-person-unrated">Source-backed attribute catalog is not loaded.</p>':''}
    </div>`;
  };
  const reputation=(full=false)=>`<div class="ng-person-reputation"><div class="ng-person-overall"><div><small>PROFESSIONAL STANDING</small><strong>${rep?safe(String(rep.scores.overall))+'<em> / 100</em>':'UNRATED'}</strong></div><span>${rep?(rep.source?.kind==='GENERATED_GAME'?'GAME-MODELED STANDING':'EVIDENCE-SOURCED SCORE'):'NOT YET ASSESSED'}</span></div><div class="ng-person-rep-axes">${axes.filter(axis=>full||axis.key!=='professional_trust').map(axis=>{
   const value=rep?.scores?.[axis.key],valid=typeof value==='number'&&Number.isFinite(value);
   return `<div><span>${safe(axis.label)}</span>${valid?`<span class="ng-person-scorebar" aria-hidden="true"><i style="width:${safe(String(value))}%"></i></span>`:'<span class="ng-person-scorebar empty" aria-hidden="true"></span>'}<strong class="${valid?'known':'unknown'}">${valid?safe(String(value)):'—'}</strong></div>`;
  }).join('')}</div>${relationshipNotice}${!rep?(full?'<p class="ng-person-unrated">Professional reputation is not yet established by the simulation or accepted career evidence. Relationship trust is separate.</p>':'<p class="ng-person-unrated">Not assessed yet. Working trust is separate.</p>'):`<div class="ng-person-rep-provenance">AS OF ${safe(rep.as_of||'—')} · ${rep.history?.length||0} RECORDED EVENTS</div>`}</div>`;

  // Relationship Network is a player-visible observation layer. Underlying
  // hidden pairwise affinity from the simulation is not exposed here.
  const rawRelationships=Array.isArray(work.relationship_reports)?work.relationship_reports:[];
  const knownRelations=rawRelationships.filter(x=>x&&typeof x==='object'&&
    Array.isArray(x.source_refs)&&x.source_refs.length>0&&
    (x.counterpart_id||x.counterpart_name)&&
    (x.score==null||(typeof x.score==='number'&&Number.isFinite(x.score)&&x.score>=0&&x.score<=100)))
   .map(x=>{
    const match=x.counterpart_id?personGeographyProjection?.people.find(p=>p.id===x.counterpart_id):null;
    const id=String(x.counterpart_id||match?.id||'');
    return {
      id, name:String(x.counterpart_name||match?.name||id||'Unknown contact'),
      role:titleCaseUIRole(x.counterpart_role||match?.role||'Not recorded'),
      score:x.score==null?null:x.score,
      sentiment:['positive','neutral','negative'].includes(x.sentiment)?x.sentiment:null,
      last_observed:String(x.observed_at||'—'),
      note:String(x.summary||'No observation summary recorded.'),
      evidence:x.source_refs.map(String)
    };
   });
  const networkPreview=`<div class="ng-person-network-preview"><span>KNOWN WORKING RELATIONSHIPS <strong>${knownRelations.length}</strong></span><button data-ng="detailtab" data-val="Network">NETWORK ${glyph('arrow',11)}</button></div>`;
  const network=()=>{
    const allRoles=['all',...new Set(knownRelations.map(r=>r.role))];
    if(!allRoles.includes(APP.networkRole))APP.networkRole='all';
    const scoped=knownRelations.filter(r=>APP.networkRole==='all'||r.role===APP.networkRole);
    const sorted=[...scoped].sort((a,b)=>{
      if(APP.networkSort==='name')return a.name.localeCompare(b.name);
      if(a.score===null)return 1;
      if(b.score===null)return -1;
      return (APP.networkSort==='worst'?a.score-b.score:b.score-a.score)||a.name.localeCompare(b.name);
    });
    const pageSize=8,totalPages=Math.max(1,Math.ceil(sorted.length/pageSize));
    const page=Math.max(0,Math.min(APP.networkPage,totalPages-1));
    const visible=sorted.slice(page*pageSize,(page+1)*pageSize);
    const selectVal=r=>r.id||r.name;
    const selected=knownRelations.find(r=>selectVal(r)===APP.networkFocus);
    const options=[['best','GOOD → BAD'],['worst','BAD → GOOD'],['name','NAME A–Z']];
    return `<div class="ng-person-network-screen">
      <div class="ng-person-network-toolbar"><div class="ng-network-sort">${options.map(([value,label])=>`<button data-ng="network-sort" data-val="${safe(value)}" class="${APP.networkSort===value?'on':''}" aria-pressed="${APP.networkSort===value}">${safe(label)}</button>`).join('')}</div>
       <div class="ng-network-role"><span>FILTER</span>${allRoles.map(value=>`<button data-ng="network-role" data-val="${safe(value)}" class="${APP.networkRole===value?'on':''}" aria-pressed="${APP.networkRole===value}">${safe(value==='all'?'ALL ROLES':value)}</button>`).join('')}</div></div>
      <div class="ng-network-explanation"><strong>${knownRelations.length} KNOWN RELATIONSHIPS</strong><span>Specific working relationships are separate from public reputation. Unknown relationships are not assumed neutral.</span></div>
      <div class="ng-network-table"><div class="ng-network-table-head"><span>PERSON / ORGANIZATION</span><span>ROLE</span><span>RELATIONSHIP</span><span>LAST EVIDENCE</span></div>
      ${visible.map(r=>`<button class="ng-network-table-row ${APP.networkFocus===selectVal(r)?'on':''}" data-ng="network-select" data-val="${safe(selectVal(r))}" aria-label="Inspect relationship with ${safe(r.name)}">
       <strong>${safe(r.name)}</strong><span>${safe(r.role)}</span><span class="ng-network-grade"><i>${r.score===null?'—':safe(r.score)+'/100'}</i>${r.sentiment?`<small class="${safe(r.sentiment)}">${safe(r.sentiment)}</small>`:''}</span><span>${safe(r.last_observed)}</span></button>`).join('')||'<div class="ng-network-empty">No source-backed relationship assessments for this person yet. As working relationships are observed, the table will sort them from strongest to weakest.</div>'}</div>
      <div class="ng-network-footer"><span>${sorted.length?'SHOWING '+(page*pageSize+1)+'–'+Math.min(sorted.length,(page+1)*pageSize)+' OF '+sorted.length:'NO REPORTED RELATIONSHIPS'}</span>
       <div><button data-ng="network-page" data-val="-1" ${page<=0?'disabled':''}>PREVIOUS</button><span>PAGE ${page+1} / ${totalPages}</span><button data-ng="network-page" data-val="1" ${page>=totalPages-1?'disabled':''}>NEXT</button></div></div>
      ${selected?`<section class="ng-network-evidence"><header>RELATIONSHIP FILE: ${safe(selected.name)}</header><p>${safe(selected.note)}</p><small>LAST OBSERVED ${safe(selected.last_observed)} · SOURCE RECORDS: ${safe(selected.evidence.join(', '))}</small></section>`:''}
     </div>`;
  };
  const opportunities=role==='jockey'?'MOUNTS':role==='trainer'?'HORSE ASSIGNMENTS':role==='breeder'?'BREEDING PARTNERS':role==='owner'?'HORSE OWNERSHIP':role==='bloodstock_professional'||role==='bloodstock_agent'?'BLOODSTOCK TRANSACTIONS':'PROFESSIONAL APPOINTMENTS';
  const assignedCount=sourceLinks.filter(item=>Boolean($('button[data-act]',item))).length;
  const careerContent=`<div class="ng-person-career-strip"><div><small>RECORDED CAREER WINS</small><strong>${safe(personWins&&personWins!=='—'?personWins:'Not recorded')}</strong></div><div><small>LINKED HORSES</small><strong>${assignedCount}</strong></div></div><div class="ng-person-minihead">CURRENT HORSE ASSIGNMENTS <button data-ng="detailtab" data-val="Stable Horses">ALL CONNECTIONS ${glyph('arrow',11)}</button></div>${connectedHorseRows(4)}<div class="ng-person-influence"><b>PROFESSIONAL OPPORTUNITIES</b><span>${safe(opportunities)}</span><small>Reputation is one factor; suitability and availability remain decisive.</small></div>`;

  // Full first-screen decision picture: a roster, compact career context and
  // observed contacts. These are presentations of the current source records,
  // never new ownership, inferred skills, or fabricated relationships.
  const horseAssignments=()=>{
    const sourceEntries=sourceLinks.slice(0,5).map(item=>{
      const btn=$('button[data-act]',item),index=btn?$$('#routeBody [data-act]').indexOf(btn):-1;
      const label=(btn?.textContent.trim()||item.textContent.trim()).replace(/\s+/g,' ').trim();
      const owner=horseOwnership(label);
      const horse=state().horseState?.[label]||{};
      const status=typeof horse.status==='string'&&horse.status.trim()?horse.status.trim():'Not recorded';
      const horseLink=index>=0?'<button type="button" class="ng-entity-reference" data-ng="sourcebutton" data-val="'+index+
       '" aria-label="Open horse '+safe(label)+'">'+safe(label)+' ↗</button>':
       entityReferenceButton(label,'horse');
      const ownerLink=owner?.name?entityReferenceButton(owner.name,'connection'):
       '<span>Owner not recorded</span>';
      return '<div class="ng-person-horse-row">'+
       '<span class="ng-person-horse-name">'+horseOwnerBadge(label)+horseLink+'</span>'+
       '<span class="ng-person-horse-owner" title="'+safe(owner?.name||'Owner not recorded')+'">'+ownerLink+'</span>'+
       '<span class="ng-person-horse-status" title="'+safe(status)+'">'+safe(status)+'</span>'+
       glyph('right',12)+'</div>';
    });
    return `<div class="ng-person-horse-table"><div class="ng-person-horse-head"><span>HORSE</span><span>OWNER</span><span>STATUS</span><span></span></div>${sourceEntries.join('')||'<div class="ng-person-compact-empty">No linked horses recorded.</div>'}</div>`;
  };
  const careerOverview=`<div class="ng-person-overview-stats"><div><small>RECORDED WINS</small><strong>${safe(personWins&&personWins!=='—'?personWins:'Not recorded')}</strong></div><div><small>LINKED HORSES</small><strong>${assignedCount}</strong></div></div><div class="ng-person-overview-opportunity"><small>PROFESSIONAL OPPORTUNITIES</small><strong>${safe(opportunities)}</strong></div>`;
  const networkOverview=`<div class="ng-person-overview-network"><div class="ng-person-overview-network-total"><strong>${knownRelations.length}</strong><span>SOURCED WORKING RELATIONSHIPS</span></div>${knownRelations.length?knownRelations.slice(0,4).map(r=>`<div class="ng-person-overview-relation"><strong title="${safe(r.name)}">${safe(r.name)}</strong><span>${r.score==null?'Unrated':safe(String(r.score))+'/100'}</span></div>`).join(''):'<div class="ng-person-compact-empty">No reported contacts yet.</div>'}</div>`;
  const events=rep?.history||[];
  const eventRows=events.length?events.slice().reverse().map(x=>`<div class="ng-person-rep-event"><b>${safe(x.date)}</b><span>${safe(x.signal.replaceAll('_',' '))}</span><small>${safe(x.source_refs?.join(', ')||'No evidence')}</small></div>`).join(''):'<p class="ng-person-unrated">No reputation events have been recorded.</p>';
  return {attributes,reputation,networkPreview,network,careerContent,careerOverview,horseAssignments,networkOverview,eventRows,roleName,rep};
 };
 const isOrganizationProfile=/^(?:Farm|Stable|Organization|Sales Organization|Ownership Group|Breeding Farm) Profile$/.test(route.kicker);
 // Reuse already-published exact-ID art in the EXISTING identity frame. Track
 // and personnel pages keep their approved layout and badge when no art exists.
 const canonicalProfileArt=isTrack?approvedIdentityAsset('track',source.dataset.trackId||'',route.title):
  isPerson?approvedIdentityAsset('person',source.dataset.personId||'',route.title):'';
 const identityArt=canonicalProfileArt||badge(route.kicker==='Horse Profile'?'horse':
  route.kicker==='Track Profile'?'track':route.kicker==='People Profile'?'people':'farm_stable');
 const identityAlt=canonicalProfileArt?(isTrack?'Racecourse logo':'Approved person portrait')+' for '+route.title:
  'Approved '+route.kicker+' badge';
 const profileMark=isOrganizationProfile?
  organizationLogoMarkup(source.dataset.organizationId||'',route.title,'organization',true):
  `<div class="ng-profile-badgeframe"><img src="${safe(identityArt)}" alt="${safe(identityAlt)}"/></div>`;

 const horseField=(label)=>fields.find(f=>f.label.toLowerCase()===label.toLowerCase())?.value||'—';
 const horseFoalingCity=isHorse?(source.dataset.foalingCity||'').trim():'';
  const horseFoalingState=isHorse?(source.dataset.foalingState||'').trim():'';
 const horseFoalingCountry=isHorse?(source.dataset.foalingCountry||'').trim():'';
  const horseFoalingEvidence=isHorse?(source.dataset.foalingEvidence||'').trim():'';
 const horseFoalingCode=isHorse?(source.dataset.foalingCountryCode||'').trim().toUpperCase():'';
 const horseCountryLabel=horseFoalingCountry==='United States'?'USA':horseFoalingCountry;
 // One source-backed country icon per approved foaling origin. Real vector
 // flags render on Windows; the label remains legible if a flag is unavailable.
 const horseCountryFlagAliases={
  'united states':'us','usa':'us','canada':'ca','england':'gb-eng',
  'great britain':'gb','united kingdom':'gb','uk':'gb','ireland':'ie',
  'france':'fr','argentina':'ar','japan':'jp','new zealand':'nz',
  'chile':'cl','germany':'de','puerto rico':'pr','australia':'au'
 };
 const horseFlagCodes=new Set(['us','ca','gb','gb-eng','ie','fr','ar','jp','nz','cl','de','pr','au']);
 const horseFoalingAlias=horseCountryFlagAliases[horseFoalingCountry.toLowerCase()];
 const horseCountryCode=horseFoalingCode.toLowerCase();
 // England has its own flag; GB flags must not silently replace it.
 const horseFlagCode=horseFoalingAlias||((horseFlagCodes.has(horseCountryCode))?horseCountryCode:'');
 const horseFlagPath=horseFlagCodes.has(horseFlagCode)?'/assets/flags/v1/'+horseFlagCode+'.svg':'';
 const horseFoalingDisplay=[horseFoalingCity,horseFoalingState,horseCountryLabel].filter(v=>v&&v!=='—').join(', ')||'Not recorded';
 const horseIdentityRow=isHorse?`<div class="ng-horse-biography" aria-label="Horse foaling and identity facts">
  <span class="ng-horse-bio-foaling" title="${safe(horseFoalingEvidence)}"><small>FOALED${horseFoalingEvidence.startsWith('SIMULATED')?' · TEST':''}</small><strong>${horseFlagPath?`<img class="ng-horse-bio-flag" src="${safe(horseFlagPath)}" alt="" width="22" height="16" decoding="async"/>`:''}${safe(horseFoalingDisplay)}</strong></span>
  <span><small>DATE OF BIRTH</small><strong>${safe(horseField('Date of birth'))}</strong></span>
  <span><small>SEX</small><strong>${safe(horseField('Sex'))}</strong></span>
  <span><small>AGE</small><strong>${safe(horseField('Age'))}</strong></span>
 </div>`:'';

 const horseStarRating=(key,label)=>{
  const record=state().scoutingState?.[route.title]?.star_ratings?.[key]||
   state().horseState?.[route.title]?.star_ratings?.[key];
  const value=Number(record?.rating??record?.stars);
  const verified=Number.isInteger(value)&&value>=1&&value<=5&&Array.isArray(record?.source_refs)&&record.source_refs.length>0;
  const stars=Array.from({length:5},(_,i)=>'<i class="'+(verified&&i<value?'filled':'')+'" aria-hidden="true">★</i>').join('');
  return '<span class="ng-horse-star-rating">'+
   '<small>'+label+'</small><span class="ng-horse-star-set">'+stars+'</span><b>'+(verified?value+'/5':'UNRATED')+'</b></span>';
 };
 const horseStarRow=isHorse?'<div class="ng-horse-star-row" aria-label="Current ability and future potential star ratings">'+
  horseStarRating('current_ability','CURRENT ABILITY')+horseStarRating('future_potential','FUTURE POTENTIAL')+
  '</div>':'';

 const factByName=label=>fields.find(f=>f.label.toLowerCase()===label.toLowerCase())?.value||'—';
 if(isPerson)loadPersonGeography();
 const approvedPerson=isPerson?personGeographyRecord(source,route.title):null;
 const gamePerson=state().staffState?.[route.title]||{};
 const gameIdentity=gamePerson.identity||{};
 const provenanceOK=record=>record&&Array.isArray(record.source_refs)&&record.source_refs.length>0;
 const normalizeLocation=x=>{
  if(!x)return '—';
  if(typeof x==='string')return x.trim()||'—';
  const regions={Florida:'FL','West Virginia':'WV','California':'CA','New York':'NY','Kentucky':'KY','Louisiana':'LA','Maryland':'MD','Virginia':'VA','New Jersey':'NJ','Pennsylvania':'PA'};
  const places=[x.city,x.region?(regions[x.region]||x.region):null].filter(Boolean);
  if(!places.length&&x.country)return x.country;
  return places.join(', ')||'—';
 };
 const knownField=x=>Boolean(x&&x!=='—'&&x!=='Unknown'&&x!=='Not recorded');
 const personBorn=approvedPerson?.birthplace||null;
 const personCountry=personBorn?.country||null;
 const personNationality=provenanceOK(gameIdentity)?gameIdentity.nationality||'':factByName('Nationality');
 const personOriginLabel=knownField(personNationality)?'NATIONALITY':'BIRTH COUNTRY';
 const personOriginValue=knownField(personNationality)?personNationality:(personCountry||'—');
 // A flag beside NATIONALITY must use separately sourced citizenship, never
 // assume the birth-country flag is also a person's current citizenship.
 const personNationalityKnown=knownField(personNationality);
 const personFlagCode=personNationalityKnown?
  (provenanceOK(gameIdentity)?String(gameIdentity.nationality_code||'').toLowerCase():''):
  String(personBorn?.flag_code||'').toLowerCase();
 const flagAllowed=new Set(['us','ca','gb','gb-eng','ie','fr','ar','jp','nz','cl','de','pr','au','cu','pa','ve','es','pe','co','at','mx','uy']);
 const personFlagImg=flagAllowed.has(personFlagCode)?`<img class="ng-person-national-flag" src="/assets/flags/v1/${safe(personFlagCode)}.svg" alt="" width="22" height="16" decoding="async"/>`:'';
 const personHometown=knownField(factByName('Birthplace'))?factByName('Birthplace'):normalizeLocation(personBorn);
 const currentBase=provenanceOK(gameIdentity)&&gameIdentity.current_base?normalizeLocation(gameIdentity.current_base):factByName('Location');
 const historicalBase=approvedPerson?.opening_base||approvedPerson?.career_base;
 const historicalBaseLabel=approvedPerson?.opening_base?'1999 BASE':'CAREER BASE';
 const baseLabel=knownField(currentBase)?'CURRENT BASE':historicalBase?historicalBaseLabel:'CURRENT BASE';
 const personBaseValue=knownField(currentBase)?currentBase:normalizeLocation(historicalBase);
 const isoBorn=provenanceOK(gameIdentity)?gameIdentity.date_of_birth||'':'';
 const currentYear=String(state()?.date||'1999-01-01').slice(0,10);
 const personDOB=/^\d{4}-\d{2}-\d{2}$/.test(isoBorn)?isoBorn:'';
 const ageAtGameDate=personDOB&&/^\d{4}-\d{2}-\d{2}$/.test(currentYear)?
  (()=>{const dob=new Date(personDOB+'T00:00:00Z'),now=new Date(currentYear+'T00:00:00Z');
   if(Number.isNaN(dob.getTime())||Number.isNaN(now.getTime())||now<dob)return null;
   let years=now.getUTCFullYear()-dob.getUTCFullYear();
   if(now.getUTCMonth()<dob.getUTCMonth()||now.getUTCMonth()===dob.getUTCMonth()&&now.getUTCDate()<dob.getUTCDate())years--;
   return String(years);
  })():null;
 const personAge=ageAtGameDate||factByName('Age');
 const personIdentityFields=isPerson?[
  ['ROLE',titleCaseUIRole(factByName('Role')),''],
  ['GENDER',factByName('Gender'),''],
  [personOriginLabel,personOriginValue,personFlagImg],
  ['AGE',personAge,''],
  ['HOMETOWN',personHometown,''],
  [baseLabel,personBaseValue,''],
  ['HOME TRACK',connection.find(f=>f.label.toLowerCase()==='home track')?.value||factByName('Home track'),''],
  ['OTHER CIRCUIT',factByName('Secondary circuit'),'']
 ].filter(([,value])=>knownField(value)):[];

 const entityHeaderFields=isPerson?personIdentityFields:
  isFarm?[['LOCATION',factByName('Location')],['TYPE',factByName('Type')],['OWNER',factByName('Owner')],['STATUS',factByName('Current status')]]:
  isTrack?[['LOCATION',factByName('Location')],['SURFACES',factByName('Surfaces')],['OPERATING',factByName('Operating state')],['CIRCUIT',text('.profileSubline').split('·').slice(1).join('·').trim()||'—']]:[];
 const horseIdentityConnections=isHorse?connection.filter(x=>['owner','breeder','trainer','current stable'].includes(x.label.toLowerCase())&&knownField(x.value)).slice(0,4):[];
 const horseConnectionHeader=horseIdentityConnections.length?
  '<div class="ng-horse-header-connections">'+horseIdentityConnections.map(x=>
   '<div><small>'+safe(x.label)+(x.label.toLowerCase()==='breeder'&&source.dataset.homebred==='true'?' · OWNER-BRED':'')+
   '</small><strong>'+horseLinkedConnection(x)+'</strong></div>').join('')+'</div>':'';
 const entityIdentityRow=entityHeaderFields.length?
  `<div class="ng-tier1-biography" aria-label="${safe(route.kicker)} identity summary">${entityHeaderFields.map(([label,value,flag])=>`<span><small>${safe(label)}</small><strong title="${safe(value)}">${flag||''}${safe(value)}</strong></span>`).join('')}</div>`:'';
  const worldSourceKind=isHorse?'horse':isPerson?'person':isFarm?'farm':isTrack?'track':'';
 const worldSourceEntry=worldSourceKind?world1999Match(worldSourceKind,route.title):null;
 const sourceEditButton=worldSourceEntry?'<button type="button" data-ng="world-edit-source" data-kind="'+
  safe(worldSourceKind)+'" data-name="'+safe(route.title)+'" title="Edit this source-backed record">EDIT RECORD</button>':'';
 const sourceImage=isFarm?
  approvedIdentityAsset('organization',source.dataset.organizationId||'',route.title):
  worldSourceEntry?worldImageURL(worldSourceEntry.worldKey,worldSourceEntry._world):'';
 const portraitRequired=isHorse||isPerson;
 const imageSlotRequired=isFarm||portraitRequired;
 const photoSrc=sourceImage||horseImage;
 const imageMarkup=photoSrc?'<img src="'+safe(photoSrc)+'" alt="" loading="lazy" decoding="async"/>':
  '<div class="ng-profile-photo-empty" aria-label="Image not yet assigned">'+
   '<span>'+safe(isFarm?'FACILITY / OWNER LOGO':'PORTRAIT')+'</span>'+
   '<small>IMAGE SLOT RESERVED</small></div>';
 const visualName=worldSourceEntry?.name||route.title;
 const profileDisplayType=isFarm?(source.dataset.foundingContext==='facility'?
  'FACILITY PROFILE':'OWNERSHIP PROFILE'):route.kicker;
 const identity=`<div class="ng-profile-intro">
  ${profileMark}
  <div class="ng-profile-identity"><div class="ng-profile-breadcrumb">${safe(profileDisplayType)} <span> / </span> Current Office</div><h2>${isHorse?horseOwnerBadge(route.title):''}${safe(visualName)}</h2>${horseIdentityRow}${horseStarRow}${entityIdentityRow}${horseConnectionHeader}${isHorse||isPerson||isFarm||isTrack?'':`<p>${safe(text('.profileSubline')||'Active source-linked office record')}</p>${pills}`}</div>${photoSrc||imageSlotRequired?`<div class="ng-profile-source-photo ${isFarm?'ng-profile-facility-logo':portraitRequired?'ng-profile-portrait':''}" role="img" aria-label="Image of ${safe(visualName)}">${imageMarkup}</div>`:''}
  <div class="ng-profile-tools"><button data-ng="office" aria-label="Return to Racing Office">← OFFICE</button><button data-ng="menu" data-val="${isTrack?'Racing':isPerson?'Personnel':isFarm?'Personnel':'Stable'}">${isTrack?'RACE CALENDAR':isPerson?'PERSONNEL DIRECTORY':isFarm?'OWNERSHIP DIRECTORY':'STABLE DIRECTORY'} ↗</button>${sourceEditButton}</div>
 </div>`;
 let left='',right='',footer='';
 if(APP.detailTab==='Overview'){
  if(isHorse){
   left=athleteOverview();
   right='';footer='';
  }else if(isPerson){
   // Structural lock: exactly the Horse Overview's four rating columns,
   // seven-item condition strip, five office panels, two lower panels and
   // full-width summary. Labels are UNASSIGNED until the user approves
   // role-specific personnel attributes; never invent ability scores.
   const person=personWork();
   const panel=(name,body,more='')=>'<section class="ng-horse-mgr-panel '+more+'"><header><strong>'+
    name+'</strong></header>'+body+'</section>';
   const professionalSlots=personnelAttributeColumns();
   const statusSlots='<div class="ng-horse-condition-strip" aria-label="Personnel condition and status slots">'+
    Array.from({length:7},(_,i)=>'<div class="ng-horse-condition-cell"><span>STATUS SLOT '+
    (i+1)+'</span><strong class="unknown">—</strong></div>').join('')+'</div>';
   const approvedLinks=founderAffiliationRows();
   const approvedConnections=founderAffiliations.length?
    founderAffiliations.map(o=>o.name).join(' · '):'Organization not yet assigned';
   // Keep the Horse page's complete overview visible at the same desktop
   // resolution. Full reputation, network and career detail live in deeper
   // tabs; these are concise record summaries with no inferred statistics.
   const summaryLines=items=>'<div class="ng-horse-mgr-rows">'+items.map(([label,value])=>
    '<div class="ng-horse-mgr-row"><span>'+safe(label)+'</span><strong>'+safe(value)+'</strong></div>'
   ).join('')+'</div>';
   const careerOverview=summaryLines([['Certified career results','—'],['Current appointment','Not recorded']]);
   const reputationOverview=summaryLines([['Professional standing','Unrated'],['Trust assessment','—']]);
   const relationOverview=summaryLines([['Approved institutions',String(founderAffiliations.length)],
    ['Observed professional contacts','—']]);
   left=`<div class="ng-horse-dossier ng-person-horse-dossier" data-template="horse-overview" data-personnel-role="${safe(source.dataset.personRole||'unspecified')}">
    <div class="ng-horse-dossier-caption"><strong>PROFESSIONAL & RACING INTELLIGENCE</strong><span>0 OF 46 ROLE-SPECIFIC SLOTS DEFINED · NOT SCORED</span></div>
    <div class="ng-horse-mgr-four">${professionalSlots}</div>
    ${statusSlots}
    <div class="ng-horse-mgr-five">
     ${panel('CAREER & APPOINTMENTS',careerOverview)}
     ${panel('CURRENT ASSIGNMENTS',person.horseAssignments())}
     ${panel('REPUTATION & TRUST',reputationOverview)}
     ${panel('WORKING RELATIONSHIPS',relationOverview)}
     ${panel('OWNERSHIP & AFFILIATIONS',approvedLinks)}
    </div>
    <div class="ng-horse-mgr-bottom">
     ${panel('CAREER RECORD & HISTORY','<p class="ng-horse-small-note">Role-specific career measures will be set with the personnel model. No figures inferred.</p>','ng-horse-form-card')}
     ${panel('BACKGROUND & CONNECTIONS',approvedLinks,'ng-horse-pedigree-card')}
    </div>
    <div class="ng-horse-mgr-summary"><div><strong>PERSONNEL OFFICE SUMMARY</strong><span>${safe(approvedConnections)}</span></div>
     <div class="ng-horse-mgr-actions"><button type="button" data-ng="detailtab" data-val="Connections">VIEW CONNECTIONS ↗</button></div>
    </div>
   </div>`;
   right='';footer='';
  }else if(isFarm){
   // EXACT approved Track workspace: large four-column record table on left,
   // Meet/Conditions-format operations on right, Track History-format panel
   // beneath. Blank attributes stay blank until a facility source supplies them.
   const facilityContext=source.dataset.foundingContext==='facility';
   const horses=facilityContext?founderStock:founderHistorical;
   const headers=facilityContext?['HORSE','ROLE','1999 RECORD','LOCATION']:['HORSE','ROLE','YEARS','EVIDENCE'];
   const head='<div class="ng-stakes-head">'+headers.map(label=>
    '<button type="button" disabled><span>'+label+'</span></button>').join('')+'</div>';
   const body=horses.map(h=>{
    const id=facilityContext?h.id:h.horseId;
    const target=world1999Entry('horse:'+id)||world1999Entry('historical-horse:'+id);
    const cols=facilityContext?
     [h.name,h._role==='stallion'?'STANDING STALLION':'BOARDING BROODMARE',
      'SOURCE-LINKED 1999',founderOrg?.location||'NOT RECORDED']:
     [h.horse,String(h.role||'').replaceAll('_',' '),(h.recordedStakesYears||[]).join(', ')||'—',
      h.status==='SOURCE_VERIFIED'?'SOURCE':'REVIEW'];
    const cells=cols.map(v=>'<span>'+safe(v||'—')+'</span>').join('');
    return target?
     '<button class="ng-stakes-data" data-ng="world-open" data-val="'+safe(target.worldKey)+
      '" aria-label="Open '+safe(cols[0])+' record">'+cells+'</button>':
     '<div class="ng-stakes-data ng-stakes-static">'+cells+'</div>';
   }).join('')||'<div class="ng-empty-record">No source-linked records yet. Facility layout reserved.</div>';
   const rows='<div class="ng-stakes-table ng-facility-records">'+head+body+'</div>';
   const stats=[
    ['INSTITUTION TYPE',founderOrg?.type||'NOT RECORDED'],
    ['1999 BASE',founderOrg?.location||'NOT RECORDED'],
    ['PRINCIPAL',founderOrg?.principalOwner||'AWAITING APPROVAL'],
    ['CAPACITY','NOT RECORDED'],
    ['STAFFING','NOT RECORDED'],
    ['MONTHLY COST','NOT RECORDED']
   ];
   const config='<div class="ng-track-course-panel"><div class="ng-track-course-heading">'+
    '<strong>'+(facilityContext?'FACILITY CONFIGURATION':'ORGANIZATION STRUCTURE')+'</strong><span>AWAITING SOURCE FIELDS</span></div>'+
    '<div class="ng-track-course-grid">'+
    [['ACREAGE','—'],['BARNS / SHEDROWS','—'],['TRAINING SURFACES','—'],['HORSE STALLS','—']].map(
     ([label,value])=>'<div class="ng-track-course-fact"><small>'+label+'</small><b>'+value+'</b></div>'
    ).join('')+'</div></div>';
   const sectionTitle=facilityContext?'BREEDING & STABLED HORSES':'HISTORICAL HORSE CONNECTIONS';
   left=`<div class="ng-track-workspace" data-template="track-overview" data-facility-id="${safe(founderOrg?.id||'')}">
    <section class="ng-tier1-card ng-tier1-stakes ng-track-stakes"><header>${sectionTitle} <span>${horses.length} SOURCE RECORDS</span></header>${rows}</section>
    <div class="ng-track-info-stack">
     <section class="ng-tier1-card ng-track-meet-card"><header>${facilityContext?'FACILITY & OPERATIONS':'OWNERSHIP & OPERATIONS'}</header>
      <div class="ng-track-conditions-body">${config}
       <div class="ng-track-meet-facts">${stats.map(([label,value])=>'<div class="ng-track-meet-fact"><small>'+safe(label)+'</small><strong>'+safe(value)+'</strong></div>').join('')}</div>
       <div class="ng-track-operating-notes">${founderPersonLinks()}</div>
      </div></section>
     <section class="ng-tier1-card ng-track-history-card"><header>${facilityContext?'FACILITY HISTORY':'OWNERSHIP HISTORY'} <button data-ng="detailtab" data-val="History">FULL HISTORY ↗</button></header>
      <div class="ng-track-history-content"><div class="ng-track-history-facts">
       <div><small>FOUNDED / OPENED</small><strong>NOT RECORDED</strong></div>
       <div><small>HISTORICAL LINKS</small><strong>${founderHistorical.length}</strong></div>
      </div><p class="ng-track-history-blurb">${safe(founderOrg?.approvedOrigin||'Historical description awaiting approved source.')}</p></div>
     </section>
    </div>
   </div>`;right='';footer='';
  }else if(isTrack){
   left=`<div class="ng-track-workspace">
    <section class="ng-tier1-card ng-tier1-stakes ng-track-stakes"><header>MAJOR RACES & STAKES <span>${stakeScheduleSummary()}</span></header>${stakesTable(100)}</section>
    <div class="ng-track-info-stack">
     <section class="ng-tier1-card ng-track-meet-card"><header>MEET & CONDITIONS</header><div class="ng-track-conditions-body">
      ${trackConfigMarkup}
      <div class="ng-track-meet-facts">${trackMeetFacts.map(f=>`<div class="ng-track-meet-fact"><small>${safe(f.label)}</small><strong>${safe(f.value)}</strong></div>`).join('')}</div>
      ${trackOperatingNotes.length?`<div class="ng-track-operating-notes">${trackOperatingNotes.slice(0,3).map(x=>`<article><b>${safe(x.label)}</b><span>${safe(x.value)}</span></article>`).join('')}</div>`:''}
      ${trackOfficeContext?`<div class="ng-track-office-context"><b>CURRENT OFFICE CONTEXT</b><span>${safe(trackOfficeContext.value)}</span></div>`:''}
     </div></section>
     ${trackHistoryPanel()}
    </div>
   </div>`;right='';footer='';
  }else{
   left=`<section class="ng-detailcard"><header>IDENTITY & STATUS</header>${factsBlock}</section>`;
   right=`<section class="ng-detailcard"><header>CONNECTIONS</header>${connectionRows()}</section>`;
   footer=`<section class="ng-detailcard ng-detailwide"><header>OFFICE CONTEXT</header><div class="ng-notes">${(notes.length?notes:['No current Office history connected.']).slice(0,4).map(n=>`<div>${safe(n)}</div>`).join('')}</div></section>`;
  }
 }else if(APP.detailTab==='Career Record'){
  left=`<section class="ng-detailcard"><header>CAREER RESULTS</header><div class="ng-kpis">${record.map(r=>`<div><strong>${safe(r.value)}</strong><small>${safe(r.label)}</small></div>`).join('')}</div></section>`;
  right=`<section class="ng-detailcard"><header>HORSE STATUS</header>${factsBlock}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>CAREER NOTES & DECISIONS</header><div class="ng-notes">${notes.map(n=>`<div>${safe(n)}</div>`).join('')||'No certified historical starts available.'}</div></section>`;
 }else if(APP.detailTab==='Pedigree'&&isHorse){
  loadOfficeHorsePedigree(route.title);
  left=officeFiveGenerationPedigree(route.title);
  right='';footer='';
 }else if((APP.detailTab==='Stable Horses'&&isPerson)||(APP.detailTab==='Connected Horses'&&isFarm)){
  left=`<section class="ng-detailcard ng-detailwide"><header>CONNECTED HORSE RECORDS</header>${isFarm?founderStockRows():connectedHorseRows()}</section>`;
 }else if(APP.detailTab==='Attributes'&&isPerson){
  // The detail tab is the SAME unassigned Horse-format attribute matrix as
  // the Overview. Older role scores and simulated legacy sheets never render.
  left=`<div class="ng-horse-dossier ng-person-horse-dossier" data-template="horse-attributes">
   <div class="ng-horse-dossier-caption"><strong>PERSONNEL ATTRIBUTES · ROLE DEFINITION PENDING</strong><span>0 OF 46 SLOTS ASSIGNED · NO SCORES</span></div>
   <div class="ng-horse-mgr-four">${personnelAttributeColumns()}</div>
   <p class="ng-horse-small-note">The four-category structure is locked to the Horse profile. Role-specific labels and ratings will be approved separately.</p>
  </div>`;
 }else if(APP.detailTab==='Reputation'&&isPerson){
  const person=personWork();
  left=`<section class="ng-detailcard ng-person-detail-sheet"><header>PROFESSIONAL REPUTATION</header>${person.reputation(true)}</section>`;
  right=`<section class="ng-detailcard ng-person-detail-sheet"><header>REPUTATION HISTORY & EVIDENCE</header><div class="ng-person-rep-history">${person.eventRows}</div></section>`;
 }else if(APP.detailTab==='Network'&&isPerson){
  const person=personWork();
  left=`<section class="ng-detailcard ng-detailwide ng-person-network-card"><header>RELATIONSHIP NETWORK · ${safe(route.title)}</header>${person.network()}</section>`;
 }else if(APP.detailTab==='Career'&&isPerson){
  left=`<section class="ng-detailcard"><header>PERSON & CAREER FACTS</header>${factsBlock}</section>`;
  right=`<section class="ng-detailcard"><header>RECORDED CAREER PERFORMANCE</header><div class="ng-entity-metrics"><div><small>CAREER WINS</small><strong>${safe(personWins||'—')}</strong></div><div><small>REPUTATION</small><strong>${safe(reputationLabel||'Not recorded')}</strong></div></div>${reputationGauge}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>CURRENT STABLE CONNECTIONS</header>${connectedHorseRows()}</section>`;
 }else if(APP.detailTab==='Operations'&&isFarm){
  left=`<section class="ng-detailcard"><header>OPERATION & LOCATION</header>${factsBlock}</section>`;
  right=`<section class="ng-detailcard"><header>APPROVED PRINCIPALS & INVESTORS</header>${founderPersonLinks()}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>CONNECTED BREEDING STOCK</header>${founderStockRows()}</section>`;
 }else if(APP.detailTab==='Connections'){
  left=`<section class="ng-detailcard"><header>PEOPLE & ORGANIZATION CONNECTIONS</header>${isPerson?founderAffiliationRows():isFarm?founderPersonLinks():connectionRows()}</section>`;
  right=`<section class="ng-detailcard"><header>OFFICE CONTEXT</header>${factsBlock}</section>`;
 }else if(APP.detailTab==='History'&&isHorse&&source.dataset.testGenerated==='true'){
  let history=[];
  try{const career=JSON.parse(source.dataset.testCareer||'{}');
   history=Array.isArray(career.raceHistory)?career.raceHistory:[];}catch{}
  const rows=history.map(x=>'<div class="ng-horse-form-row"><span>'+safe(x.date)+'</span><span>'+
   safe(x.raceClass||'Race')+' · '+safe(x.trackName||'')+' · '+
   safe(x.distanceFurlongs||'')+'f '+safe(x.surface||'')+'</span><span>'+
   safe(x.finishPosition||'—')+'</span><span>1999 TEST MODEL</span></div>').join('');
  left='<section class="ng-detailcard ng-detailwide"><header>PRE-1999 SIMULATED RACE HISTORY · '+
   history.length+' STARTS · NOT OFFICIAL RESULTS</header>'+
   (history.length?'<div class="ng-horse-form-table"><div class="ng-horse-form-head"><span>DATE</span>'+
    '<span>RACE / TRACK</span><span>FINISH</span><span>SOURCE</span></div>'+rows+'</div>':
    '<p class="ng-horse-small-note">Unraced in the 1999 test world at opening.</p>')+'</section>';
 }else if(APP.detailTab==='Achievements'&&isHorse){
  left=`<section class="ng-detailcard ng-detailwide"><header>RECORDED ACHIEVEMENTS</header><div class="ng-notes">${horseAchievements.map(n=>`<div>${safe(n)}</div>`).join('')||'<div>No achievements documented in the current source record.</div>'}</div></section>`;
 }else if(isTrack&&(APP.detailTab==='Meet Schedule'||APP.detailTab==='Major Races')){
  if(APP.detailTab==='Major Races'){
   left=`<section class="ng-detailcard ng-detailwide"><header>STAKES RACE RECORDS</header>${stakesTable()}</section>`;
  }else{
   left=`<section class="ng-detailcard ng-detailwide"><header>MEET SCHEDULE & RACE DAYS</header>${rows(meetValues)}<button class="ng-entity-open" data-ng="detailtab" data-val="Major Races">BROWSE FEATURED STAKES ${glyph('arrow',12)}</button></section>`;
  }
 }else if(isTrack&&APP.detailTab==='History'){
   left=trackHistoryFull();
 }else if(isFarm&&APP.detailTab==='History'){
   left=`<section class="ng-detailcard ng-detailwide"><header>HISTORICAL RACING & BLOODLINES</header>${founderHistoryRows()}</section>`;
   right=`<section class="ng-detailcard"><header>APPROVED ORIGIN</header><p class="ng-track-history-blurb">${safe(founderOrg?.approvedOrigin||'No approved origin narrative recorded.')}</p></section>`;
  }else{
  left=`<section class="ng-detailcard ng-detailwide"><header>HISTORY & RECORDS</header><div class="ng-notes">${(notes.length?notes:details.map(x=>x.lines)).slice(0,8).map(n=>`<div>${safe(n)}</div>`).join('')||'No official history connected yet.'}</div></section>`;
 }
 const actions=`<div class="ng-detailactions"><button data-ng="menu" data-val="Stable">OPEN STABLE ↗</button><button data-ng="menu" data-val="Racing">RACE CALENDAR ↗</button><button data-ng="office">BACK TO OFFICE</button></div>`;
 return `<div class="ng-profile-view ${isHorse?'ng-profile-horse':isPerson?'ng-profile-person ng-profile-horse':isFarm?'ng-profile-farm ng-profile-track':isTrack?'ng-profile-track':'ng-profile-entity'}">${identity}${tabbar}<div class="ng-detail-cols ${(isHorse||isPerson)&&('Overview'===APP.detailTab||isPerson&&APP.detailTab==='Attributes')?'ng-detail-cols-horse-overview':(isFarm||isTrack)&&APP.detailTab==='Overview'?'ng-detail-cols-tier1':''}">${left}${right}${footer}</div>${isHorse||isPerson||isFarm||isTrack?'':actions}</div>`;
}
function calendarTimeline(races,nonraces){
 const iso=$('.dateChip')?.textContent.trim()||'1999-01-01';
 if(!/^\d{4}-\d{2}-\d{2}$/.test(iso))return '';
 const base=new Date(iso+'T12:00:00');if(Number.isNaN(base.getTime()))return '';
 const events=[];
 const add=(d,title,kind,key)=>{const m=String(d).match(/(\d{1,2})\/(\d{1,2})/);if(!m)return;events.push({md:`${+m[1]}-${+m[2]}`,title,kind,key});};
 races.forEach(r=>add(r.date,r.name,/Entered/i.test(r.status)?'entered':'target',r.name));
 nonraces.forEach(r=>add(r.date,r.name,'commitment',''));
 const month=new Intl.DateTimeFormat('en-US',{month:'short'});
 const weekday=new Intl.DateTimeFormat('en-US',{weekday:'short'});
 let cells='';
 for(let i=0;i<14;i++){
  const d=new Date(base);d.setDate(base.getDate()+i);
  const daily=events.filter(e=>e.md===`${d.getMonth()+1}-${d.getDate()}`);
  const items=daily.map(e=>`<button class="ng-cal-event ${e.kind}" data-ng="${e.kind==='commitment'?'menu':'horse'}" data-val="${safe(e.kind==='commitment'?'Racing':e.key)}" title="${safe(e.title)}"><span class="ng-cal-dot"></span>${safe(e.title)}</button>`).join('');
  cells+=`<div class="ng-cal-day ${i===0?'today':''} ${daily.length?'with-event':''}"><div class="ng-cal-date"><span>${weekday.format(d)}</span><b>${d.getDate()}</b></div>${items||'<span class="ng-cal-empty">—</span>'}</div>`;
 }
 return `<section class="ng-card ng-timeline" aria-label="Upcoming 14-day racing and stable calendar"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><h3>14-DAY OPERATIONS CALENDAR</h3><small>${month.format(base).toUpperCase()} ${base.getFullYear()} · ENTRY STATUS IS SOURCE-DRIVEN</small></header><div class="ng-timeline-grid">${cells}</div><footer class="ng-timeline-legend"><span><i class="target"></i>Race target</span><span><i class="entered"></i>Confirmed entry</span><span><i class="commitment"></i>Other obligation</span></footer></section>`;
}

/* WTW live Stable screen: FM/OOTP roster, source-only evaluations. */
const liveStableIcon={
 sound:['✓','ok'],watch:['!','warn'],treat:['✚','risk'],ready:['✓','ok'],
 entered:['⚑','ok'],building:['↗','info'],restricted:['Ⅱ','warn'],
 up:['↗','ok'],down:['↘','risk'],level:['→','muted'],work:['↗','info'],unknown:['·','muted']
};
function liveStableSignal(code,label,detail){
 const mark=liveStableIcon[code]||liveStableIcon.unknown;
 return '<span class="ng-rs-signal '+mark[1]+'" title="'+safe(detail||label)+'" aria-label="'+safe(label)+'"><i aria-hidden="true">'+mark[0]+'</i>'+safe(label)+'</span>';
}
function liveStableKnown(v){return v!=null&&String(v).trim()&&!['—','Unknown','Not recorded','N/A','null'].includes(String(v).trim())?String(v).trim():''}
function liveStableDate(v){
 const raw=String(v||'');
 return /^\d{4}-\d{2}-\d{2}$/.test(raw)&&!Number.isNaN(Date.parse(raw+'T00:00:00Z'))?raw:'';
}
function liveStableRating(name,key,game){
 const r=game.scoutingState?.[name]?.star_ratings?.[key]||game.horseState?.[name]?.star_ratings?.[key];
 const n=Number(r?.rating??r?.stars);
 const valid=Number.isInteger(n)&&n>=1&&n<=5&&Array.isArray(r?.source_refs)&&r.source_refs.length>0;
 return {value:valid?n:null,
  display:valid?'<span class="ng-rs-stars" title="Evidence-backed '+safe(key.replace(/_/g,' '))+': '+n+'/5"><b>'+('★'.repeat(n))+'</b>'+('☆'.repeat(5-n))+'</span>':
   '<span class="ng-rs-missing" title="No sourced current rating">—</span>'};
}
function liveStableHorseData(h,r,game,caseFiles){
 const name=h.name,source=window.__WTW_1999_UI_DATA__?.sourceFacts?.(h.name)|| (typeof window.__wtwOfficeHorseRosterFacts==='function'?window.__wtwOfficeHorseRosterFacts(name)||{}:{});
 const saved=game.horseState?.[name]||{},scout=game.scoutingState?.[name]||{},cal=game.calendarState?.[name]||{};
 const related=caseFiles.filter(x=>x.title.toLowerCase().includes(name.toLowerCase()));
 const vetFile=related.find(x=>/vet|filling|soundness|medical/i.test(x.title||''));
 const treatment=[saved.treatment_status,saved.vet_flag,saved.health_status].filter(Boolean).join(' ');
 const isTreating=/under treatment|receiving treatment|treatment ongoing|in rehabilitation|on medication|under veterinary care/i.test(treatment);
 const isWatch=/vet|filling|scan|diagnos|monitor|injur|unsound|sore|caution|medical/i.test(treatment)||Boolean(vetFile);
 const cleared=/^(sound|cleared|fit|healthy|no active concerns)$/i.test(liveStableKnown(saved.health_status));
 let health=isTreating?['treat','Treatment',treatment]:isWatch?['watch','Vet watch',treatment||vetFile?.title]:cleared?['sound','Sound','Explicitly recorded sound']:['unknown','Unassessed','No confirmed health assessment'];
 const opening=source.openingCondition;
 if(health[0]==='unknown'&&opening){
  health=opening.health==='TEST_VET_WATCH'?['watch','Test · Vet watch','SIMULATED CONDITION · vet review needed, not an examination']:
   opening.health==='TEST_MONITOR'?['watch','Test · Monitor','SIMULATED CONDITION · monitoring risk, not a diagnosis']:
   ['sound','Test · No alert','SIMULATED CONDITION · no modeled alert; veterinary status unverified'];
 }
 const rawReady=liveStableKnown(saved.readiness_status)||liveStableKnown(saved.status)||liveStableKnown(h.activity);
 let ready=['unknown','Unassessed','No sourced race readiness assessment'];
 if(opening){
  const status=String(source.racing_status||'');
  ready=/TOO_YOUNG|AT_STUD|BROODMARE|RETIRED/.test(status)?
   ['restricted',status.replaceAll('_',' '),'MODEL · not eligible for a race as presently classified']:
   [opening.readiness>=77?'ready':'building',opening.readiness+'%','1999 SIMULATED OPENING READINESS · not race-entry clearance'];
 }
 if(/light jog|training paused|resting|scan pending|diagnostic|restricted|laid up|not ready|hold/i.test(rawReady))ready=['restricted','Restricted',rawReady];
 else if(/ready to race|ready to run|race ready|cleared to race/i.test(rawReady))ready=['ready','Ready',rawReady];
 else if(/work requested|more work|breeze|gate school|gallop|building|training rhythm|trending up|progressing/i.test(rawReady))ready=['building','Building',rawReady];
 const train=window.__WTW_1999_UI_DATA__?.horseTraining?.(h.horseId||name);
 if(game.horseDevelopment?.horses?.[h.horseId]&&train){
  const pct=Math.round(train.readiness*100)+'%';
  if(train.sorenessDays>0){
   health=['watch','Training watch','Simulated soreness caution, not a sourced veterinary finding'];
   ready=['restricted',pct,'MODELED GAMEPLAY · soreness watch, no race clearance implied'];
  }else{
   ready=[train.readiness>.7?'ready':'building',pct,
    'MODELED GAMEPLAY · fitness, fatigue and recovery; not a race entry clearance'];
   if(train.currentRisk>.7)health=['watch','Risk watch',
    'Simulated high-workload caution, not a sourced veterinary diagnosis'];
  }
 }
 if(r&&/entered/i.test(r.status||''))ready=['entered','Entered','Entry confirmed; race fitness is not independently assessed'];
 if(isTreating)ready=['restricted','Restricted','Explicit ongoing treatment'];
 const trend=String(saved.form_trend||scout.form_trend||'').trim().toLowerCase();
 let form=['unknown','—','No certified form trend'];
 if(!trend&&source.source==='1999_TEST_GENERATED'){
  const history=source.modelRaceHistory||[];
  if(history.length>=2){
   const recent=history.slice(0,3),previous=history.slice(3,6);
   const score=arr=>arr.reduce((sum,r)=>sum+Math.max(0,8-Number(r.finishPosition||8)),0)/Math.max(1,arr.length);
   const delta=score(recent)-score(previous);
   form=delta>1.2?['up','Test ↑','Simulated recent finishes improving']:
    delta<-.8?['down','Test ↓','Simulated recent finishes declining']:
    ['level','Test →','Simulated recent finishes relatively stable'];
  }else form=['unknown','Unraced','No prior race form at the 1999 opening'];
 }
 if(/^(up|improving|positive)$/.test(trend))form=['up','Up','Recorded racing form improving'];
 else if(/^(down|declining|negative)$/.test(trend))form=['down','Down','Recorded racing form declining'];
 else if(/^(flat|level|steady)$/.test(trend))form=['level','Flat','Recorded racing form steady'];
 else if(/trending up|improv(ed|ing)/i.test(h.activity||''))form=['work','Work ↑','Positive work/training trend (not race form)'];
 const birth=liveStableDate(source.date_of_birth||source.born),worldYear=Number(($('.dateChip')?.textContent.trim()||'1999-01-01').slice(0,4));
 const by=birth?Number(birth.slice(0,4)):NaN;
 const age=Number.isInteger(worldYear)&&Number.isInteger(by)&&worldYear>=by?String(worldYear-by):liveStableKnown(source.age);
 const sex=liveStableKnown(source.sex),sexCode=({colt:'C',filly:'F',gelding:'G',mare:'M',horse:'H',stallion:'H'})[sex.toLowerCase()]||sex;
 const results=Array.isArray(saved.certified_results)?saved.certified_results.filter(x=>x&&x.source_refs?.length&&liveStableDate(x.date)):[];
 const last=results.map(x=>x.date).sort().at(-1)||
  (!source.source?.includes('CANON')?liveStableDate(source.record?.lastRaced):'')||
  (saved.last_race_source_refs?.length?liveStableDate(saved.last_race_date):'');
 const raceLabel=r?liveStableKnown(r.track)+' · '+liveStableKnown(r.date):'';
 const target=liveStableKnown(cal.race_target)||(r?raceLabel:'');
 const entered=Boolean(r&&/entered/i.test(r.status||''));
 const upcoming=entered?raceLabel:liveStableKnown(cal.scheduled_race);
 const money=liveStableKnown(source.earnings)||
  (!source.source?.includes('CANON')&&Number.isFinite(source.record?.earnings)?
   '$'+source.record.earnings.toLocaleString('en-US'):'')||
  (saved.earnings_source_refs?.length?liveStableKnown(saved.career_earnings):'');
 const links=source.connections||{},owner=window.__WTW_1999_UI_DATA__?.ownerFor?.(name)||horseOwnership(name)?.name||'',trainer=liveStableKnown(links.trainer)||(saved.trainer_source_refs?.length?liveStableKnown(saved.trainer_name):'');
 const breeder=liveStableKnown(links.breeder)||(saved.breeder_source_refs?.length?liveStableKnown(saved.breeder_name):'');
 const tally=source.record||{},validRecord=['starts','wins','seconds','thirds'].every(k=>/^\d+$/.test(String(tally[k])));
 const record=validRecord?[tally.starts,tally.wins,tally.seconds,tally.thirds].join('-'):'';
 const modelRating=key=>{
  const sourced=liveStableRating(name,key,game);
  if(sourced.value!=null)return sourced;
  const n=Number(key==='current_ability'?source.ability?.currentStars:source.ability?.potentialStars);
  if(!Number.isInteger(n)||n<1||n>5)return sourced;
  return {value:n,display:'<span class="ng-rs-stars ng-test-rating" title="SIMULATED 1999 model rating · not a verified scout assessment"><b>'+
   '★'.repeat(n)+'</b>'+'☆'.repeat(5-n)+'</span>'};
 };
 return {name,age,sex:sexCode,sexFull:sex,health,ready,form,
  last:last||(source.source==='1999_TEST_GENERATED'?'Unraced':'Not recorded'),
  upcoming:upcoming||'Not entered',target:target||'No target',
  money:money||'Not recorded',owner:owner||'Not recorded',trainer:trainer||'Not recorded',
  breeder:breeder||'Not recorded',record:record||'Not recorded',
  activity:h.activity||'No current activity',
  ability:modelRating('current_ability'),potential:modelRating('future_potential'),
  entered,hasTarget:Boolean(r||target),cases:related};
}

function stableShortDate(value){
 const iso=liveStableDate(value);
 if(!iso)return value||'';
 const [y,m,d]=iso.split('-');
 return Number(m)+'/'+Number(d)+'/'+y.slice(2);
}

function liveStableTrainingView(){
 const adapter=window.__WTW_1999_UI_DATA__;
 if(!adapter?.horseTraining)return '<section class="ng-functional"><p>Training engine is unavailable for the current career.</p></section>';
 const horses=horseRows(),fin=adapter.trainingCosts?.()||{},plans=adapter.TRAINING_PLANS||{};
 const fmt=x=>Math.round(Number(x||0)*100)+'%';
 const money=x=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(x||0));
 const rows=horses.map(h=>{
  const profile=adapter.horseTraining(h.horseId||h.name);
  if(!profile)return '';
  const status=profile.status==='INACTIVE'?'NOT TRAINING':
   profile.sorenessDays>0?'SORENESS WATCH · '+profile.sorenessDays+'D':
   profile.currentRisk>.68?'RISK WATCH':'TRAINING';
  const warning=profile.sorenessDays>0?'Simulated soreness watch—not a veterinary diagnosis':
   profile.currentRisk>.68?'High workload risk—consider rest or light gallops':'No simulated soreness alert';
  const actions=Object.entries(plans).map(([id,p])=>{
   const chosen=profile.plan===id,disabled=profile.status==='INACTIVE'&&id!=='REST';
   return '<button data-ng="training-set" data-horse-id="'+safe(profile.horseId)+'" data-val="'+safe(id)+
    '" title="'+safe(p.label)+'" class="'+(chosen?'on':'')+'" aria-pressed="'+chosen+'"'+
    (disabled?' disabled':'')+'>'+safe(id==='BALANCED'?'BALANCED':id==='STAMINA'?'STAMINA':id==='SPEED'?'SPEED':
     id==='GATE'?'GATE':id==='PREP'?'RACE PREP':id==='LIGHT'?'LIGHT':'REST')+'</button>';
  }).join('');
  return '<tr><td><button data-ng="horse" data-val="'+safe(h.name)+'">'+safe(h.name)+'</button>'+
   '<small>'+safe(profile.horseId)+'</small></td>'+
   '<td><strong>'+fmt(profile.fitness)+'</strong></td><td><strong>'+fmt(profile.fatigue)+'</strong></td>'+
   '<td><strong>'+fmt(profile.readiness)+'</strong></td><td>'+fmt(profile.currentRisk)+'</td>'+
   '<td><span title="'+safe(warning)+'">'+safe(status)+'</span></td>'+
   '<td><span>'+safe(plans[profile.plan]?.label||profile.plan)+'</span><div class="ng-training-choices">'+actions+'</div></td>'+
   '<td><small>'+safe(profile.lastWork?.date||'OPENING')+' · '+safe(profile.lastWork?.work||'NO POST-OPENING WORK')+'</small></td></tr>';
 }).join('');
 const notice=APP.trainingNotice?'<p class="ng-training-notice" role="status">'+safe(APP.trainingNotice)+'</p>':'';
 return '<section class="ng-functional ng-training-desk">'+
  '<div class="ng-rs-title"><strong>STABLE · TRAINING COMMAND</strong><span>'+horses.length+
   ' HORSES · IN-GAME DATE '+safe(depGameDay())+' · SIMULATED CONDITION</span>'+
   '<button data-ng="stable-filter" data-val="all">BACK TO ROSTER</button></div>'+
  '<div class="ng-training-summary"><div><small>WORKED THROUGH</small><strong>'+safe(fin.processedThrough||'1999-01-01')+
   '</strong></div><div><small>POSTED TRAINING DAYS</small><strong>'+safe(fin.entries||0)+'</strong></div>'+
   '<div><small>MODELED STABLE EXPENSES</small><strong>'+safe(money(fin.totalSpent))+
   '</strong></div><div><small>SORENESS WATCHES</small><strong>'+safe(fin.recordedHealthAlerts||0)+'</strong></div></div>'+
  notice+
  '<p class="ng-training-explainer">Choose a horse’s weekly program; continue the calendar to run its workouts, recovery, fatigue, fitness and modeled risk. Sunday rest and graded work are applied automatically. Training costs are recorded in the current save’s simulation ledger—not certified payments or historical veterinary facts.</p>'+
  '<div class="ng-rs-scroll" tabindex="0" aria-label="Horse training plans and condition"><table class="ng-rs-table ng-training-table"><thead><tr>'+
   '<th>HORSE</th><th>FITNESS</th><th>FATIGUE</th><th>READINESS</th><th>RISK</th><th>MONITOR</th><th>WEEKLY PROGRAM / CHANGE PLAN</th><th>LATEST WORK</th>'+
   '</tr></thead><tbody>'+rows+'</tbody></table></div></section>';
}

// World Horse Directory uses the Stable roster presentation but never substitutes
// an owner's stable roster for the full world source. IDs remain authoritative.
function worldDirectoryHorseRows(){
 const adapter=window.__WTW_1999_UI_DATA__;
 const total=Number(adapter?.counts?.worldHorses??adapter?.counts?.horses??0);
 if(adapter?.worldHorseBrowse){
  const response=adapter.worldHorseBrowse({offset:0,limit:Math.max(160,total),sort:'name'});
  if(response?.indexing)return {indexing:true,total:response.total||total,items:[]};
  if(Array.isArray(response?.items))return {indexing:false,total:response.total??response.items.length,items:response.items};
 }
 const horses=world1999Data?.horses||[];
 return {indexing:false,total:horses.length,items:horses.map(h=>({
  _id:h.id||'',_canonId:h.id||'',_worldKey:world1999Key('horse',h),
  _name:h.name,name:h.name,age:h.age??'',sex:h.sex??'',
  owner:worldRecordName('farm',h.ownerId,h.owner||''),
  trainer:worldRecordName('person',h.trainerId,h.trainer||''),
  breeder:worldRecordName('farm',h.breederId,h.breeder||''),
  status:h.racingStatus||h.status||''
 }))};
}
function liveDirectoryHorseData(h,game,files,races){
 const base=liveStableHorseData({
  name:h.name,horseId:h._id||h._canonId||h.id,
  activity:h.status||'Source status not recorded'
 },races.find(r=>r.name===h.name),game,files);
 const missing=v=>v==null||String(v).trim()===''||String(v).trim()==='undefined';
 return {...base,
  age:missing(h.age)?base.age:String(h.age),
  sex:missing(h.sex)?base.sex:String(h.sex).slice(0,1).toUpperCase(),
  sexFull:missing(h.sex)?base.sexFull:String(h.sex),
  owner:missing(h.owner)?base.owner:String(h.owner),
  trainer:missing(h.trainer)?base.trainer:String(h.trainer),
  breeder:missing(h.breeder)?base.breeder:String(h.breeder),
  activity:h.status||base.activity,
  _directoryRecord:h,
  _directoryId:h._canonId||h._id||h.id||''
 };
}

function liveStableRosterView(directory=false){
 if(!directory&&APP.stableFilter==='training')return liveStableTrainingView();
 if(!directory&&APP.stableFilter==='attributes')return window.WTW1999AttributeRanking?.render({
  horses:horseRows(),adapter:window.__WTW_1999_UI_DATA__,app:APP,
  ownerBadge:horseOwnerBadge,safe
 })||'<section class="ng-functional">Attribute table unavailable.</section>';
 const universe=directory?worldDirectoryHorseRows():null;
 const horses=directory?universe.items:horseRows(),races=racingRows(),game=state(),files=currentMessages();
 const search=(directory?APP.directorySearch:APP.stableSearch).trim().toLowerCase();
 const all=horses.map(h=>directory?liveDirectoryHorseData(h,game,files,races):
  liveStableHorseData(h,races.find(r=>r.name===h.name),game,files));
 const scope=directory?'World|1999 Horses':'Stable|Roster';
 const stableCriteria=window.WTW1999RosterFilters?.get(APP,scope)||null;
 const activeFilter=directory?APP.directoryFilter:APP.stableFilter;
 const sortKey=directory?APP.directorySort:APP.stableSort;
 const sortDesc=directory?APP.directorySortDesc:APP.stableSortDesc;
 const mode=directory?APP.directoryMode:APP.stableMode;
 if(directory)APP.directoryHorseItems=all;
 const filtered=all.filter(x=>{
  if(stableCriteria&&!window.WTW1999RosterFilters.matches({
   name:x.name,age:x.age,sex:x.sexFull||x.sex,status:x.activity,
   health:x.health?.[1],readiness:x.ready?.[1],form:x.form?.[1],
   earnings:x.money,owner:x.owner,trainer:x.trainer,breeder:x.breeder,
   record:x.record,activity:x.activity,ability:x.ability?.value,potential:x.potential?.value
  },stableCriteria))return false;
  if(activeFilter==='entered'&&!x.entered)return false;
  if(activeFilter==='targets'&&!x.hasTarget)return false;
  if(activeFilter==='unassigned'&&x.hasTarget)return false;
  if(activeFilter==='vet'&&!['watch','treat'].includes(x.health[0]))return false;
  if(activeFilter==='ready'&&!['ready','entered'].includes(x.ready[0]))return false;
  return !search||[x.name,x.activity,x.target,x.owner,x.trainer,x.breeder,x.health[1],x.ready[1]]
   .some(v=>String(v||'').toLowerCase().includes(search));
 });
 const ratingScore=x=>x?.value??null;
 const rank={treat:4,watch:3,unknown:2,sound:1,ready:5,entered:4,building:3,restricted:1,up:5,work:4,level:3,down:1};
 const numericMoney=v=>{const text=String(v||'').replace(/[$,]/g,'').trim();return /^\d+(?:\.\d+)?$/.test(text)?Number(text):null};
 const keys={name:x=>x.name,age:x=>x.age?Number(x.age):null,sex:x=>x.sex,
  health:x=>x.health[0]==='unknown'?null:rank[x.health[0]],readiness:x=>x.ready[0]==='unknown'?null:(/^\d+%$/.test(x.ready[1])?Number(x.ready[1].slice(0,-1)):rank[x.ready[0]]),
  ability:x=>ratingScore(x.ability),potential:x=>ratingScore(x.potential),
  form:x=>x.form[0]==='unknown'?null:rank[x.form[0]],last:x=>x.last||null,
  next:x=>x.upcoming||null,target:x=>x.target||null,earnings:x=>numericMoney(x.money),
  owner:x=>x.owner||null,trainer:x=>x.trainer||null,breeder:x=>x.breeder||null,
  record:x=>x.record?Number(x.record.split('-')[0]):null,activity:x=>x.activity};
 const field=keys[sortKey]||keys.name;
 filtered.sort((a,b)=>{
  const av=field(a),bv=field(b),am=av==null||av==='',bm=bv==null||bv==='';
  if(am!==bm)return am?1:-1;
  const cmp=typeof av==='number'&&typeof bv==='number'?av-bv:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
  return (sortDesc?-cmp:cmp)||a.name.localeCompare(b.name);
 });
 const columns=[['name','HORSE'],['age','AGE'],['sex','SEX'],['health','HEALTH'],['readiness','READY'],['ability','CA'],['potential','PA'],
  ['form','FORM'],['last','LAST RACED'],['next','NEXT RACE'],['target','TARGET'],['earnings','EARNINGS'],['owner','OWNER'],
  ['trainer','TRAINER'],['breeder','BREEDER'],['record','S-W-P-S'],['activity','CURRENT ACTIVITY']];
 const th=columns.map(([key,label])=>'<th scope="col" aria-sort="'+(sortKey===key?(sortDesc?'descending':'ascending'):'none')+'"><button type="button" data-ng="'+(directory?'directory-sort':'stable-sort')+'" data-val="'+key+'" title="Sort by '+label+'" aria-label="Sort horse roster by '+label+'">'+label+
  '<span class="ng-rs-sort" aria-hidden="true">'+(sortKey===key?(sortDesc?'▼':'▲'):'↕')+'</span></button></th>').join('');
 const cell=(value,klass='',title='')=>'<td class="'+klass+'" title="'+safe(title||String(value||''))+'">'+(value||'<span class="ng-rs-missing">—</span>')+'</td>';
 const txt=(value,klass='')=>cell(value?safe(value):'',klass,value);
 const rowHTML=filtered.map(x=>{
  const ownerMark=horseOwnerBadge(x.name);
  const name='<button type="button" class="ng-rs-horse" data-ng="'+(directory?'directory-horse':'horse')+'" data-val="'+safe(directory?x._directoryId:x.name)+'">'+(directory?'':ownerMark)+
   '<span>'+safe(x.name)+'</span></button>';
  const datum=[cell(name,'ng-rs-first'),txt(x.age,'ng-rs-numeric'),txt(x.sex,'ng-rs-numeric'),
   cell(liveStableSignal(...x.health)),cell(liveStableSignal(...x.ready)),
   cell(x.ability.display,'ng-rs-stars-cell'),cell(x.potential.display,'ng-rs-stars-cell'),
   cell(liveStableSignal(...x.form)),txt(stableShortDate(x.last),'ng-rs-numeric'),txt(stableShortDate(x.upcoming),'ng-rs-race'),
   txt(x.target,'ng-rs-target'),txt(x.money,'ng-rs-numeric'),
   cell(namedProfileValue('Owner',x.owner),'',x.owner),cell(namedProfileValue('Trainer',x.trainer),'',x.trainer),
   cell(namedProfileValue('Breeder',x.breeder),'',x.breeder),
   txt(x.record,'ng-rs-numeric'),txt(x.activity,'ng-rs-activity')];
  return '<tr class="ng-wtw-roster-row" data-search="'+safe([x.name,x.activity,x.target,x.owner,x.trainer,x.breeder,x.health[1],x.ready[1]].join(' ').toLowerCase())+'">'+datum.join('')+'</tr>';
 }).join('');
 const filters=[['all','ALL'],['vet','VET WATCH'],['ready','READY'],['attributes','ATTRIBUTES'],['training','TRAINING'],['targets','WITH TARGET'],['entered','ENTERED'],['unassigned','NO TARGET']]
 .filter(([value])=>!directory||!['attributes','training'].includes(value))
 .map(([value,label])=>'<button data-ng="'+(directory?'directory-filter':'stable-filter')+'" data-val="'+value+'" class="'+(activeFilter===value?'on':'')+'" aria-pressed="'+(activeFilter===value?'true':'false')+'">'+label+'</button>').join('');
  const legend='<div class="ng-rs-legend">'+liveStableSignal('watch','Vet watch','Caution without assumed treatment')+
  liveStableSignal('treat','Treatment','Only documented active treatment')+liveStableSignal('building','Building','Training toward a race')+
  liveStableSignal('up','Form ↑','Recorded form improving')+liveStableSignal('down','Form ↓','Recorded form declining')+
  '<span>— = not recorded · Stars only when sourced · Targets ≠ entries</span></div>';
 return '<section class="ng-functional ng-stable-roster-v2 '+(directory?'ng-directory-roster':'')+'">'+
  '<div class="ng-rs-title"><strong>'+(directory?'HORSE DIRECTORY':'STABLE & HORSES')+'</strong><span>'+(directory?universe.total:all.length)+' HORSES · '+all.filter(x=>x.entered).length+
   ' ENTERED · '+all.filter(x=>x.hasTarget&&!x.entered).length+' TARGETED · '+all.filter(x=>['watch','treat'].includes(x.health[0])).length+
   ' VET WATCH</span>'+(directory?'':'<button data-ng="stable-world-edit" title="Open the editable 1999 World horse records">✎ EDIT 1999 RECORDS</button>')+'<button data-ng="menu" data-val="Racing">RACE CALENDAR ↗</button></div>'+
  (directory&&universe.indexing?'<div role="status" class="ng-dpt-disclosure">Indexing the registered world horse directory; source records remain unchanged.</div>':'')+
  '<div class="ng-rs-tools"><label for="'+(directory?'ngDirectorySearch':'ngStableSearch')+'">SEARCH</label><input id="'+(directory?'ngDirectorySearch':'ngStableSearch')+'" data-ng-input="'+(directory?'directory-search':'stable-search')+'" type="search" value="'+safe(directory?APP.directorySearch:APP.stableSearch)+
   '" placeholder="Horse, owner, trainer, status…" autocomplete="off"/><div class="ng-rs-filters">'+filters+'</div>'+
   '<div class="ng-rs-mode"><button data-ng="'+(directory?'directory-mode':'stable-mode')+'" data-val="all" class="'+(mode!=='compact'?'on':'')+'">ALL COLUMNS</button>'+
   '<button data-ng="'+(directory?'directory-mode':'stable-mode')+'" data-val="compact" class="'+(mode==='compact'?'on':'')+'">QUICK VIEW</button></div></div>'+
  (window.WTW1999RosterFilters?.render(columns,stableCriteria,safe,scope)||'')+
  '<section class="ng-rs-roster"><header><strong>HORSE MANAGEMENT ROSTER</strong><span class="ng-stable-visible">'+filtered.length+' OF '+all.length+
   ' HORSES · CLICK HEADINGS TO SORT</span></header>'+
   '<div class="ng-rs-scroll" tabindex="0" aria-label="Sortable horse roster; horizontally scroll for every column"><table class="ng-rs-table '+(mode==='compact'?'compact':'all')+
   '"><thead><tr>'+th+'</tr></thead><tbody>'+ (rowHTML||'<tr><td colspan="17" class="ng-rs-no-results">No horses match these filters.</td></tr>')+
   '</tbody></table></div>'+legend+'</section></section>';
}

function functionalRoute(route){
 if(route.kicker==='Stable')return liveStableRosterView();
 if(route.kicker==='Sales'&&APP.section==='Sales')return departmentRoster('Sales',APP.page);
 if(route.kicker==='Race Calendar'&&APP.section==='Racing')return departmentRoster('Racing',APP.page);
 if(route.kicker==='Race Calendar'){
  const races=racingRows();const entered=races.filter(r=>/Entered/i.test(r.status)).length;
  const nonraces=$$('.right .fixtureList .fixture:not([data-track])').map(n=>({date:$('.d',n)?.textContent.trim()||'',name:$('h4',n)?.textContent.trim()||'',detail:$('p',n)?.textContent.trim()||''}));
  return `<section class="ng-functional"><div class="ng-functionalstats"><div><b>${races.length}</b><span>Upcoming racing targets</span></div><div><b>${entered}</b><span>Entries confirmed</span></div><div><b>${races.length-entered}</b><span>Targets under consideration</span></div></div>${calendarTimeline(races,nonraces)}<div class="ng-functionalcontent"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><h3>RACING CALENDAR & ENTRIES</h3><small>SOURCE-CONNECTED TARGETS</small></header><div class="ng-tableheaders ng-raceheaders"><span>DATE</span><span>HORSE</span><span>RACECOURSE</span><span>STATUS</span></div>${races.map(r=>`<div class="ng-managementrow ng-racerow"><span>${safe(r.date)}</span><button data-ng="horse" data-val="${safe(r.name)}">${safe(r.name)} ↗</button><button data-ng="track" data-val="${safe(r.track)}">🇺🇸 ${safe(r.track)} · ${safe(r.tag)} ↗</button><i class="${/Entered/i.test(r.status)?'ng-entered':''}">${safe(r.status.replace('·','').trim())}</i></div>`).join('')}</section><section class="ng-card ng-sideinfo"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('history')}" alt=""/></span><h3>OTHER COMMITMENTS</h3></header><div class="ng-commandnotes">${nonraces.map(r=>`<div class="ng-commitment"><small>${safe(r.date)}</small><strong>${safe(r.name)}</strong><span>${safe(r.detail)}</span></div>`).join('')}<p>Targets are not reported as confirmed entries until the original decision engine records them.</p></div></section></div></section>`;
 }
 return null;
}
// Unified source-backed desktop management screen for every department that
// does not already have a deeper original Office route. The same roster/summary
// primitives apply across stable, racing, people, farms, world and finance.
/* Domain-specific department roster structures; no authoritative game-data edits. */
const DEP_NAMES=new Set(['Racing','Breeding','Sales','Personnel','Facilities','Finances','Tracks']);
const WORLD_1999_COLUMNS={
 Horses:[['name','HORSE',17],['age','AGE',4],['sex','SEX',6],
  ['ca','CA · TEST',5],['pa','PA · TEST',5],['status','1999 STATUS',15],['registryGroup','COHORT',13],
  ['sire','SIRE',13],['dam','DAM',13],['breeder','BREEDER',16],
  ['homebred','HOME-BRED',7],['owner','OWNER / FARM',15],
  ['trainer','TRAINER',12],['track','1999 HOME TRACK',12]],
 People:[['name','PERSON',22],['role','CANONICAL ROLE',25],['base','1999 OPERATING BASE',30],
  ['operation','OWNERSHIP OPERATION',23]],
 Organizations:[['name','ORGANIZATION',25],['type','OPERATION TYPE',27],['location','APPROVED LOCATION',25],
  ['principal','PRINCIPAL',13],['status','CANON STATUS',10]]
};
const DEP_COLUMNS={
 Meets:[['name','TRACK',18],['location','CITY / STATE',18],['surfaces','SURFACES',13],['meetWindow','MEET WINDOW',19],['status','MEET STATUS',10],['raceDays','DAYS',5],['preferredDays','RACE DAYS',11],['stakesCount','STAKES',6]],
 DayCard:[['date','DATE',10],['track','TRACK',18],['race','RACE / STAKES',21],['class','CONDITIONS',23],['surface','SURFACE',8],['distance','DISTANCE',8],['purse','PURSE',12],['status','PROGRAM STATUS',13]],
 Tracks:[['name','TRACK',18],['location','CITY / STATE',18],['surfaces','SURFACES',12],['circuit','CIRCUIT',16],['meetWindow','MEET WINDOWS',19],['status','STATUS',9],['raceDays','DAYS',4],['stakesCount','STAKES',4]],
 Racing:[['date','DATE',7],['track','TRACK',8],['race','RACE',6],['class','CLASS',7],['surface','SURF',4],['distance','DIST',5],['purse','PURSE',7],['horse','HORSE',11],['base','CURRENT BASE',12],['ship','SHIP MI',6],['jockey','JOCKEY',9],['trainer','TRAINER',8],['ready','READY',5],['status','ENTRY',5]],
 Breeding:[['horse','HORSE',12],['age','AGE',3],['sex','SEX',3],['sire','SIRE',9],['dam','DAM',9],['farm','FARM',9],['status','BREED STATUS',7],['health','HEALTH',6],['pedigree','PED',5],['value','BREED VAL',6],['owner','OWNER',10],['studFee','STUD FEE',8],['bookings','BOOK',5],['foals','FOALS',4],['winners','WINS',4]],
 SalesWatchlist:[['hip','HIP',7],['horse','HORSE',18],['auction','AUCTION',25],['company','HOUSE',14],['sire','SIRE',11],['dam','DAM',11],['consignor','CONSIGNOR',11],['value','EST VALUE',9],['status','STATUS',8]],
 SaleCalendar:[['date','DATES',12],['name','AUCTION',27],['company','SALES COMPANY',16],['city','LOCATION',16],['category','TYPE',14],['status','STATUS',15]],
 SaleCompanies:[['name','SALES COMPANY',19],['city','HEADQUARTERS',15],['saleCount','SALES',8],['nextSale','NEXT UPCOMING AUCTION',33],['months','USUAL SALE MONTHS',25]],
 Sales:[['hip','HIP',4],['horse','HORSE',12],['age','AGE',3],['sex','SEX',3],['sire','SIRE',11],['dam','DAM',11],['consignor','CONSIGNOR',10],['reserve','RESERVE',8],['bid','CURRENT BID',8],['value','EST VALUE',8],['ca','CA',4],['pa','PA',4],['condition','COND',7],['status','SALE STATUS',7]],
 OwnershipGroups:[['name','OWNER / OPERATION',25],['type','OWNER TYPE',19],['location','OPERATING BASE',22],['principal','PRINCIPAL OWNER',18],['status','STATUS',16]],
 PersonnelPrincipals:[['name','PERSON',22],['age','AGE IN 1999',8],['role','APPROVED ROLE',21],['operation','OWNERSHIP / FACILITY ENTITY',27],['base','BASE',16],['status','RELATIONSHIP',22]],
 Personnel:[['name','PERSON',13],['age','AGE',3],['role','ROLE',10],['ca','CA',4],['pa','PA',4],['reputation','REP',6],['specialty','SPECIALTY',10],['morale','MORALE',6],['workload','LOAD',6],['salary','EST. FEES / PAY',11],['commission','WIN %',5],['demand','DEMAND',7],
 ['competingBarns','RIVAL BARNS',7],['quotedMount','MOUNT QUOTE',8],['relationship','OUR REL',11],['contract','CONTRACT',9],['assignment','ASSIGNED',9],['base','BASE',9],['wins','WINS',4]],
 Facilities:[['name','FACILITY',14],['type','TYPE',9],['location','CITY / STATE',13],['capacity','CAP',5],['occupied','USED',5],['free','FREE',5],['condition','COND',7],['quality','QUALITY',7],['staff','STAFF',5],['cost','MONTHLY COST',10],['owner','OWNER',12],['status','STATUS',8]],
 Finances:[['date','DATE',11],['category','CATEGORY',16],['description','TRANSACTION / PURPOSE',28],['department','HORSE / DEPARTMENT',19],['income','INCOME',10],['expense','EXPENSE',10],['balance','BALANCE',6]]
};
/* Thoroughbred auction-house registry.
   Company/sale relationships and 2014 dates checked against:
   https://www.fasigtipton.com/results/2014
   https://obssales.com/blog/category/obs-thoroughbred-sales/2014-sales/
   https://www.keeneland.com/sites/default/files/April%20Sale-History%20and%20Stats.pdf
   https://www.lanereport.com/36376/2014/07/keeneland-catalogs-4181-yearlings-for-september-sale/
   https://www.lanereport.com/39176/2014/09/keeneland-catalogs-4026-horses-for-november-breeding-stock-sale/
   https://ctba.com/barretts-adds-fall-paddock-sale/
   These are scheduling facts, NOT catalog lots or game market prices.
   Other years use a month-only seasonal approximation unless real dated
   game-state auction records exist. Never fabricate an exact calendar day.
   The earliest years on seasonal patterns describe fixture coverage, NOT
   the founding date or proven start date of an individual auction. */
const DEP_SALE_HOUSES=Object.freeze({
 keeneland:{name:'Keeneland',city:'Lexington, KY',website:'https://www.keeneland.com/sales/'},
 fasigtipton:{name:'Fasig-Tipton',city:'Lexington, KY',website:'https://www.fasigtipton.com/'},
 obs:{name:'OBS',fullName:"Ocala Breeders' Sales",city:'Ocala, FL',website:'https://obssales.com/'},
 barretts:{name:'Barretts',city:'Pomona, CA',website:'',activeFrom:1990,activeTo:2018},
 wtba:{name:'Washington Thoroughbred Breeders Association',shortName:'WTBA',city:'Auburn, WA',website:'https://wtboa.com/Sales/Archives.htm',activeFrom:1940},
 canadian:{name:"Canadian Breeders' Sales",shortName:'Canadian Breeders',city:'Toronto, ON',website:'',activeFrom:1999}
});
/* [company ID, official sale name, verified first date, verified final date, venue, category].
   All listed 2014 dates are evidence-backed; market lot content remains a demo. */
/* Exact 1999 dates confirmed in contemporary racing reports or sale-company archives:
   Barretts 18-19 Oct (TDN 21 Oct 1999); WTBA 7 Sep + 5 Dec (WTBA 1999 archives);
   Canadian Breeders 7 Sep (TDN 3/9 Sep 1999); Fasig-Tipton Texas Aug 30-31 (TDN 2 Sep 1999).
   Other 1999 auctions retain usual-month labels until dates are separately verified. */
const DEP_SALE_EVENTS_1999=[
 ['fasigtipton','Texas Summer Yearling Sale','1999-08-30','1999-08-31','Grand Prairie, TX','Yearlings'],
 ['wtba','Summer Yearling Sale','1999-09-07','1999-09-07','Auburn, WA','Yearlings'],
 ['canadian','Selected Yearling Sale','1999-09-07','1999-09-07','Toronto, ON','Yearlings'],
 ['barretts','Fall Sale of Yearlings and Horses of All Ages','1999-10-18','1999-10-19','Pomona, CA','Mixed'],
 ['wtba','Winter Mixed Sale','1999-12-05','1999-12-05','Auburn, WA','Mixed']
];
const DEP_SALE_SEASONAL=[
 ['keeneland','January Horses of All Ages Sale',1,'Lexington, KY','Mixed',1956,9999],
 ['obs','Winter Mixed Sale',1,'Ocala, FL','Mixed',1999,9999],
 ['fasigtipton','Kentucky Winter Mixed Sale',2,'Lexington, KY','Mixed',1999,9999],
 ['obs','March Two-Year-Olds in Training Sale',3,'Ocala, FL','2YO',1999,9999],
 ['keeneland','April Two-Year-Olds in Training Sale',4,'Lexington, KY','2YO',1993,2014],
 ['obs','Spring Two-Year-Olds in Training Sale',4,'Ocala, FL','2YO',1999,9999],
 ['fasigtipton','Midlantic May Two-Year-Olds in Training Sale',5,'Timonium, MD','2YO',1999,9999],
 ['obs','June Two-Year-Olds and Horses of Racing Age Sale',6,'Ocala, FL','2YO / HRA',1999,9999],
 ['fasigtipton','The July Sale',7,'Lexington, KY','Yearlings',1999,9999],
 ['fasigtipton','The Saratoga Sale',8,'Saratoga Springs, NY','Yearlings',1900,9999],
 ['fasigtipton','New York Bred Yearlings Sale',8,'Saratoga Springs, NY','Yearlings',1999,9999],
 ['obs','August Yearling Sale',8,'Ocala, FL','Yearlings',1982,2014],
 ['keeneland','September Yearling Sale',9,'Lexington, KY','Yearlings',1960,9999],
 ['obs','October Yearling Sale',10,'Ocala, FL','Yearlings',2015,9999],
 ['fasigtipton','Kentucky October Yearlings Sale',10,'Lexington, KY','Yearlings',1999,9999],
 ['fasigtipton','The November Sale',11,'Lexington, KY','Breeding stock',1999,9999],
 ['keeneland','November Breeding Stock Sale',11,'Lexington, KY','Breeding stock',1944,9999],
 /* Regional sale organizations were established and active in the 1999 market.
    These are usual MONTHS only; do not invent a day for a different year. */
 ['barretts','March Selected Two-Year-Olds in Training Sale',3,'Pomona, CA','2YO',1990,2018],
 ['barretts','Fall Sale of Yearlings and Horses of All Ages',10,'Pomona, CA','Mixed',1990,2018],
 ['wtba','Summer Yearling Sale',9,'Auburn, WA','Yearlings',1999,9999],
 ['wtba','Winter Mixed Sale',12,'Auburn, WA','Mixed',1999,9999],
 ['canadian','Selected Yearling Sale',9,'Toronto, ON','Yearlings',1999,9999]
];
const DEP_SALE_MONTHS=['January','February','March','April','May','June','July','August','September','October','November','December'];

function depHash(v){let x=13;for(const c of String(v))x=(x*31+c.charCodeAt(0))%9973;return x}
function depMoney(n){
 if(n==null||n==='')return '';
 const value=String(n).trim(),match=value.match(/^\$?\s*(\d[\d,]*(?:\.\d+)?)([kKmM]?)$/);
 if(!match)return value;
 const amount=Number(match[1].replaceAll(',',''))*(/[mM]/.test(match[2])?1000000:/[kK]/.test(match[2])?1000:1);
 return Number.isFinite(amount)?'$'+Math.round(amount).toLocaleString('en-US'):value;
}


function depRaceIso(value){
 const s=String(value||''),direct=liveStableDate(s);if(direct)return direct;
 const m=s.match(/(\d{1,2})\/(\d{1,2})/);if(!m)return '';
 const current=$('.dateChip')?.textContent.trim()||'1999-01-01';
 return current.slice(0,4)+'-'+String(Number(m[1])).padStart(2,'0')+'-'+String(Number(m[2])).padStart(2,'0');
}

/* Canonical track meet windows are read from Office; the game date governs active meets. */
const DEP_MONTH={Jan:1,Feb:2,Mar:3,Apr:4,May:5,Jun:6,Jul:7,Aug:8,Sep:9,Oct:10,Nov:11,Dec:12};
function depGameDay(){return liveStableDate($('.dateChip')?.textContent.trim())||liveStableDate(state().date)||'1999-01-01'}
function depRaceBrowseDate(){
 const chosen=APP.racingDate;
 return /^1999-\d{2}-\d{2}$/.test(String(chosen||''))&&liveStableDate(chosen)?chosen:depGameDay();
}
// Calendar browsing never advances the simulation or commits results.
function depRacingCalendar(){
 const date=depRaceBrowseDate(),month=date.slice(0,7),first=new Date(month+'-01T12:00:00Z');
 const days=new Date(Date.UTC(1999,Number(date.slice(5,7)),0)).getUTCDate();
 const leading=(first.getUTCDay()+6)%7;
 const label=first.toLocaleDateString('en-US',{month:'long',year:'numeric',timeZone:'UTC'});
 const weekday=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
 const selected=APP.racingTrack||'';
 const rows=Array.from({length:leading},()=>'<span class="ng-racing-calendar-pad"></span>');
 for(let day=1;day<=days;day++){
  const iso=month+'-'+String(day).padStart(2,'0');
  const counts=window.__WTW_1999_UI_DATA__?.racingDaySummary?.(iso,selected)||{trackCount:0,plannedStakes:0};
  const activity=counts.trackCount?counts.trackCount+' '+(selected?'card':'tracks'):'DARK';
  const stake=counts.plannedStakes?' · '+counts.plannedStakes+' stakes':'';
  rows.push('<button type="button" data-ng="racing-calendar-day" data-val="'+iso+'" class="'+
   (iso===date?'selected ':'')+(counts.trackCount?'has-racing':'dark')+'" aria-pressed="'+(iso===date)+'" '+
   'title="View proposed '+iso+' race cards"><b>'+day+'</b><small>'+safe(activity+stake)+'</small></button>');
 }
 return '<section class="ng-racing-calendar" aria-label="1999 meeting and condition-book calendar">'+
  '<header><strong>1999 RACING CALENDAR</strong><div>'+
  '<button type="button" data-ng="racing-calendar-month" data-val="-1" '+(month==='1999-01'?'disabled':'')+' aria-label="Previous month">‹</button>'+
  '<span>'+safe(label)+(selected?' · '+safe(selected):' · ALL TRACKS')+'</span>'+
  '<button type="button" data-ng="racing-calendar-month" data-val="1" '+(month==='1999-12'?'disabled':'')+' aria-label="Next month">›</button></div></header>'+
  '<div class="ng-racing-cal-grid">'+weekday.map(x=>'<span class="weekday">'+x+'</span>').join('')+rows.join('')+'</div>'+
  '<p>Choose a date to inspect every proposed race. Meet windows follow track calendars; ordinary card dates remain modeled where exact fixtures are unavailable.</p>'+
  '</section>';
}

function depTrackCalendar(){
 const raw=typeof window.__wtwOfficeTrackDirectory==='function'?window.__wtwOfficeTrackDirectory():[];
 const permittedTracks=isClean1999()?new Set((world1999Data?.tracks||[]).map(t=>t.id)):null;
 const permittedNames=isClean1999()?new Set((world1999Data?.tracks||[]).map(t=>t.name)):null;
 const office=Array.isArray(raw)?raw.filter(x=>x&&typeof x.name==='string'&&
  (!isClean1999()||!permittedTracks.size||permittedTracks.has(x.id)||permittedNames.has(x.name))):[];
 const known=new Set(office.map(x=>x.id||x.name));
 const others=(world1999Data?.tracks||[])
  .filter(t=>!known.has(t.id)&&!known.has(t.name))
  .map(t=>({id:t.id,name:t.name,location:t.location,region:t.region,circuit:t.circuit,
   operating:t.operating,playableIn1999:t.playableIn1999!==false,
   meetWindow:'',raceDays:'',preferredDays:'',stakes:[],_source1999:true}));
 const extra=(window.__WTW_1999_UI_DATA__?.extraTracks?.()||[]).filter(t=>
  !isClean1999()||!permittedTracks.size||permittedTracks.has(t.id)||permittedNames.has(t.name));
 const byId=new Map(extra.map(t=>[t.id,t]));
 const byName=new Map(extra.map(t=>[t.name,t]));
 const seen=new Set([...office,...others].flatMap(t=>[t.id,t.name]).filter(Boolean));
 const missing=extra.filter(t=>!seen.has(t.id)&&!seen.has(t.name));
 return [...office,...others,...missing].filter(t=>!isClean1999()||
  !permittedTracks.size||permittedTracks.has(t.id)||permittedNames.has(t.name)).map(t=>{
  // The 1999 source directory, NOT the old track-program/demo defaults,
  // decides whether a historical racecourse is closed and remains dormant.
  const canonical=(world1999Data?.tracks||[]).find(r=>r.id===t.id);
  if(isClean1999()&&canonical?.operating==='HISTORICAL_ONLY')
   return {...t,id:canonical.id,name:canonical.name,location:canonical.location,
    circuit:canonical.circuit||t.circuit,operating:'HISTORICAL_ONLY',
    meetWindow:'',raceDays:'',preferredDays:'',stakes:[],
    playableIn1999:false,_source1999:true,_historyOnly:true};
  const p=byId.get(t.id)||byName.get(t.name)||null;
  const sourceStakes=(window.__WTW_1999_UI_DATA__?.stakesForTrack?.(t.name)||[])
   .map(r=>({...r,date:r.localDate||r.date||'',class:r.status||r.division||r.grade||'',purse:r.purse1999}));
  return {...t,...(p?{
   surfaces:p.surfaces,meetWindow:p.meetWindow,raceDays:p.raceDays,
   preferredDays:p.preferredDays,calendarBasis:p.calendarBasis,
   calendarSource:p.calendarSource,operating:p.operating,_source1999:false
  }:{}),stakes:sourceStakes.length?sourceStakes:(Array.isArray(t.stakes)?t.stakes:[])};
 });
}
function depCalendarIso(value,year=depGameDay().slice(0,4)){
 const d=String(value||'').match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
 if(!d||!DEP_MONTH[d[1]])return '';
 const iso=year+'-'+String(DEP_MONTH[d[1]]).padStart(2,'0')+'-'+String(Number(d[2])).padStart(2,'0');
 return liveStableDate(iso)?iso:'';
}
function depMeetWindows(track,year=depGameDay().slice(0,4)){
 return String(track?.meetWindow||'').split(';').map(part=>{
  const p=part.trim().match(/^([A-Za-z]{3}\s+\d{1,2})\s*[–-]\s*([A-Za-z]{3}\s+\d{1,2})$/);
  if(!p)return null;
  const start=depCalendarIso(p[1],year),end=depCalendarIso(p[2],year);
  return start&&end?{start,end,label:part.trim()}:null;
 }).filter(Boolean);
}
function depMeetState(track,date=depGameDay()){
 const wins=depMeetWindows(track,date.slice(0,4));
 const active=wins.find(w=>w.start<=date&&date<=w.end);
 const next=wins.filter(w=>w.start>date).sort((a,b)=>a.start.localeCompare(b.start))[0];
 return {active:Boolean(active),next:Boolean(next),window:active||next||null,
  status:active?'IN MEET':next?'UPCOMING':'OUT OF MEET'};
}
function depTrackRows(page='Overview',day=depGameDay()){
 const rows=depTrackCalendar().map(t=>{
  const meet=depMeetState(t,day);
  return {_kind:'track',_name:t.name,_canonId:t.id||'',name:t.name,location:t.location||'',surfaces:t.surfaces||'',
   circuit:t.circuit||'',meetWindow:meet.window?.label||t.meetWindow||'',
   status:t.operating==='HISTORICAL_ONLY'?'HISTORICAL · CLOSED BEFORE 1999':t._source1999?'MEET NOT RECORDED':meet.status,raceDays:t.raceDays||'',preferredDays:t.preferredDays||'',
   stakesCount:String(t.stakes?.length||0),_meetState:meet};
 });
 if(page==='Active Meets')return rows.filter(r=>r._meetState.active);
 if(page==='Stakes')return rows.filter(r=>Number(r.stakesCount)>0);
 return rows;
}
function depFacilityType(raw){
 const t=String(raw||'').toLowerCase();
 if(/own|syndicate|partnership|bloodstock group/.test(t))return 'Ownership Group';
 if(/break|pre.train/.test(t))return 'Breaking Facility';
 if(/stud|breeding/.test(t))return 'Stud Farm';
 // A barn is infrastructure within a racing operation, not a separate facility class.
 if(/racing stable|race barn|racing barn|training barn|\bstables?\b|\bbarn\b|shedrow/.test(t))return 'Racing Stable';
 if(/train/.test(t))return 'Training Center';
 return 'Farm';
}
function depFacilityRows(page,demo){
 // Only approved founding organizations are surfaced. A racing operation is
 // NOT evidence of a separate physical barn or a fabricated training center.
 const organizations=(world1999Data?.organizations||[]);
 const classify=o=>{
  const t=String(o.type||'').toUpperCase(),name=String(o.name||'').toUpperCase();
  if(/STUD|STALLION|INTEGRATED BREEDING/.test(t)||/\bSTUD\b/.test(name))return 'Stud Farm';
  if(/FARM|NURSERY/.test(t))return 'Farm';
  if(/RACING STABLE|OWNERSHIP STABLE/.test(t))return 'Racing Stable';
  return '';
 };
 const typeForPage={'Stud Farms':'Stud Farm','Farms':'Farm',
  'Racing Stables':'Racing Stable'};
 if(page==='Training Centers'||page==='Breaking Facilities'||page==='Trainer Barns')return [];
 return organizations.filter(o=>classify(o)&&
  (!typeForPage[page]||classify(o)===typeForPage[page])).map(o=>({
   _kind:'farm',_name:o.name,_id:o.id,_canonId:o.id,
   _worldKey:world1999Key('farm',o),
   name:o.name,type:classify(o),location:o.location||o.locationLabel||'',
   capacity:'',occupied:'',free:'',condition:'',quality:'',staff:'',cost:'',
   owner:o.publicPrincipal||'',status:'APPROVED INSTITUTION · SITE NOT CERTIFIED',
   _testGenerated:false
  }));
}

function depRows(section,page,demo,auction){
 // Populate the EXISTING OOTP/FM Personnel list with source-named pilot jockeys,
 // keeping all ratings, mounts, contracts and income blank until engine authoring.
 if(isClean1999()&&section==='Personnel'&&
   (page==='Trainers'||page==='Jockeys'||page==='Overview')){
  const people=page==='Jockeys'?world1999JockeyRoster:
   page==='Trainers'?world1999TrainerRoster:
   [...world1999JockeyRoster,...world1999TrainerRoster];
  return people.map(p=>({
   _kind:'person',_name:p.name,_id:p.id,_canonId:p.id,
   _worldKey:'person:'+p.id,name:p.name,role:p.role,
   age:'',base:p.base,homeTrack:p.homeTrack||'',_homeTrackId:p.homeTrackId||'',
   status:'1999 TEST IDENTITY · UNASSIGNED',
   ca:'',pa:'',reputation:'',specialty:'',morale:'',workload:'',
   salary:'',commission:'',demand:'',competingBarns:'',quotedMount:'',
   relationship:'',contract:'',assignment:'',wins:'',
   _testGenerated:false
  }));
 }
 // Daily condition books use the existing 1999 source generator; no entry is committed.
 if(section==='Racing'&&(page==='Calendar'||page==='Race Planning'||(page==='Overview'&&APP.racingMode==='day')))
  return window.__WTW_1999_UI_DATA__?.racingDayCards?.(depRaceBrowseDate(),APP.racingTrack)||[];
 // Existing manager tables stay unchanged; only their source rows are substituted.
 const modelRows=window.__WTW_1999_UI_DATA__?.departmentRows?.(section,page,{date:section==='Racing'?depRaceBrowseDate():depGameDay(),racingMode:APP.racingMode});
 if(Array.isArray(modelRows))return section==='Racing'&&APP.racingTrack&&page==='Stakes'?
  modelRows.filter(r=>r._track===APP.racingTrack||r.track===APP.racingTrack):modelRows;
 const game=state(),stable=horseRows(),races=racingRows(),all=globalSearchItems();
 APP.searchIndex=all;
 const source=kind=>all.map((r,i)=>({...r,_index:i})).filter(r=>r.kind===kind);
 const row=(kind,name,values)=>({...values,_kind:kind,_name:name});
 const fixture=name=>races.find(r=>r.name===name);
 if(section==='World'&&['1999 Horses','People','Organizations'].includes(page)){
  if(!world1999Data)return [];
  if(page==='1999 Horses')return (world1999Data.horses||[]).map(h=>({
   _kind:'horse',_name:h.name,_canonId:h.id||'',_worldKey:world1999Key('horse',h),
   name:h.name,age:h.age||'',sex:h.sex||'',sire:h.sire||'',dam:h.dam||'',
   owner:worldRecordName('farm',h.ownerId,h.owner||''),
   trainer:worldRecordName('person',h.trainerId,h.trainer||''),
   track:worldRecordName('track',h.trackId,h.track||''),
   _ownerId:h.ownerId||'',_trainerId:h.trainerId||'',_trackId:h.trackId||'',
   _sireId:h.sireId||'',_damId:h.damId||'',
   status:h.racingStatus||h.status||'',_role:h._role
  }));
  if(page==='People')return [...(world1999Data.people||[]),...world1999JockeyRoster,...world1999TrainerRoster].map(p=>({
   _kind:'person',_name:p.name,_canonId:p.id,_worldKey:world1999Key('person',p),
   name:p.name,role:p.positionTitle||p.role||'',base:p.base||'',
   operation:worldRecordName('farm',p.operatingOrganizationId||p.ownershipOperationId,
    p.ownershipOperation||''),_operationId:p.operatingOrganizationId||p.ownershipOperationId||''
  }));
  return (world1999Data.organizations||[]).map(o=>({
   _kind:'farm',_name:o.name,_canonId:o.id,_worldKey:world1999Key('farm',o),
   name:o.name,type:o.type||'',location:o.location||'',principal:worldRecordName('person',o.publicPrincipalId,o.publicPrincipal||''),_principalId:o.publicPrincipalId||'',
   status:o.leadershipStatus?.includes('PENDING_USER_REVIEW')?'PROPOSED · REVIEW':
    o.leadershipStatus==='USER_APPROVED_1999_OPERATOR_LINK'?'APPROVED':
    o.leadershipStatus==='ESTABLISHED_1999_PRINCIPAL_LINK'?'ESTABLISHED':o.status||''
  }));
 }
 if(section==='World'&&page==='Tracks')return depTrackRows('All Tracks');
 if(section==='Tracks')return depTrackRows(page);
 if(section==='Racing'&&page==='Overview'&&APP.racingMode!=='mine'){
  const tracks=depTrackRows('Overview',depRaceBrowseDate());
  if(APP.racingTrack)return tracks.filter(t=>t.name===APP.racingTrack).map(t=>({
   ...t,meetWindow:depTrackCalendar().find(x=>x.name===t.name)?.meetWindow||t.meetWindow
  }));
  return tracks.filter(t=>t._meetState.active);
 }
 // Racing entries and results require registered horses; none are auto-generated.
 if(section==='Racing')return [];
 if(section==='Breeding'){
  if(['Stallions','Broodmares'].includes(page)&&world1999Data){
   const role=page==='Stallions'?'stallion':'broodmare';
   return world1999Data.horses.filter(h=>h._role===role).map(h=>row('horse',h.name,{
    _canonId:h.id||'',_worldKey:world1999Key('horse',h),horse:h.name,
    age:h.foalYear?String(1999-Number(h.foalYear)):'',sex:h.sex||'',sire:h.sire||'',
    dam:h.dam||'',farm:h.farm||'',owner:h.owner||'',status:h.status||'',
    health:'',pedigree:'',value:'',studFee:'',bookings:'',foals:'',winners:''
   }));
  }
  if(page==='Stud Farms')return depFacilityRows('Stud Farms',false);
  return [];
 }
 if(section==='Sales'&&page==='Sale Calendar'){
  let entries=depAuctionList(demo);
  if(APP.departmentCompany)entries=entries.filter(a=>a.companyId===APP.departmentCompany);
  const now=depGameDay();
  return entries.map(a=>row('sale-event',a.name,{
   date:a.dateLabel||depSaleDateLabel(a),name:a.name,company:a.company,city:a.city,
   category:a.category,status:a.confirmedDate?(a.endDate<now?'Completed':a.date<=now?'IN SALE':'Upcoming'):
    a.sortKey<now?'Month unconfirmed':'Usual month',
   _iso:a.sortKey,_auctionId:a.id,_companyId:a.companyId
  }));
 }
 if(section==='Sales'&&page==='Sale Companies'){
  const schedule=depAuctionList(demo),now=depGameDay(),year=now.slice(0,4);
  return Object.entries(DEP_SALE_HOUSES).map(([id,h])=>{
   const offers=schedule.filter(a=>a.companyId===id);
   const next=offers.find(a=>(a.endDate||a.sortKey)>=now);
   const months=[...new Set(offers.filter(a=>a.sortKey.startsWith(year)).map(a=>DEP_SALE_MONTHS[Number(a.sortKey.slice(5,7))-1]))];
   return row('sale-company',h.name,{
    name:h.name,city:h.city,saleCount:String(offers.filter(a=>a.sortKey.startsWith(year)).length),
    nextSale:next?depSaleLabel(next):'None on current calendar',
    months:months.join(' · ')||'Historic sales (dates vary)',_companyId:id
   });
  });
 }
 if(section==='Sales'){
  if(page==='Watchlist')return Object.values(APP.salesWatched||{});
  if(!auction||!Array.isArray(auction.lots))return [];
  return auction.lots.map((lot,i)=>{
   const name=lot.horse||lot.horse_name||'',hip=String(lot.hip||'');
   return row('horse',name,{hip,horse:name,auction:auction.name,
    company:auction.company,_auctionId:auction.id,
    _watchKey:salesWatchKey(auction.id,hip,name),_demo:false,
    age:String(lot.age||''),sex:lot.sex||'',sire:lot.sire||'',dam:lot.dam||'',
    consignor:lot.consignor||'',reserve:depMoney(lot.reserve),
    bid:depMoney(lot.bid),value:depMoney(lot.estimated_value),
    ca:'',pa:'',condition:lot.condition||'',status:lot.status||''
   });
  }).filter(r=>page!=='Private Offers'||/offer/i.test(r.status));
 }
 if(section==='Personnel'){
  if(page==='Ownership Groups')return depFacilityRows('Ownership Groups',false).map(r=>({
   _kind:r._kind,_name:r._name,_canonId:r._canonId||'',name:r.name,
   type:r.type,location:r.location,principal:r.owner||'',status:r.status||''
  }));
  const match={Trainers:/trainer/i,Jockeys:/jockey/i,Owners:/owner|patron/i,
   Staff:/staff|vet|farrier|farm manager|bloodstock agent|racing secretary/i}[page];
  return source('person').filter(r=>!match||match.test(r.detail||'')).map(r=>
   row('person',r.name,{_canonId:r.canonicalId||'',name:r.name,
    age:'',role:r.detail||'',ca:'',pa:'',reputation:'',specialty:'',morale:'',
    workload:'',salary:'',contract:'',assignment:'',base:r.location||'',wins:''
   }));
 }
 if(section==='Facilities')return depFacilityRows(page,demo);

 const entries=Array.isArray(game.finances?.ledger)?
  game.finances.ledger.map(t=>[t.date,t.category,t.description,t.department,
   t.income,t.expense,t.balance]):[];
 let out=entries.map((t,i)=>row('finance',String(i),{date:stableShortDate(t[0]),category:t[1]||'',description:t[2]||'',department:t[3]||'',
  income:Number(t[4])>0?depMoney(t[4]):'',expense:Number(t[5])>0?depMoney(t[5]):'',balance:depMoney(t[6]),_iso:liveStableDate(t[0])}));
 if(page==='Operating Costs')out=out.filter(r=>r.expense);
 if(page==='Budgets')return [];
 return out;
}


function depSaleLabel(a){
 const name=String(a?.name||'Unnamed Sale'),company=String(a?.company||'Company not recorded');
 return name.endsWith(' - '+company)?name:name+' - '+company;
}
function depSaleDateLabel(a){
 if(!a)return '';
 if(!a.confirmedDate)return a.dateLabel||'Usual month only · exact date not verified';
 const begin=stableShortDate(a.date);
 const end=a.endDate&&a.endDate!==a.date?' – '+stableShortDate(a.endDate):'';
 return begin+end;
}
function depSaleCatalogRow(row,index,year=1999){
 const [id,name,date,endDate,city,category]=row;
 const company=DEP_SALE_HOUSES[id];
 return {id:year+'-'+id+'-'+index,date,endDate,sortKey:date,
  companyId:id,company:company?.name||'Company not recorded',
  name,city,category,confirmedDate:true,previewIndex:index,
  lots:[],dateLabel:depSaleDateLabel({date,endDate,confirmedDate:true})};
}
function depSeasonalSales(year){
 return DEP_SALE_SEASONAL.filter(([, , , , ,first,last])=>year>=first&&year<=last)
  .map(([companyId,name,month,city,category],i)=>{
   const sortKey=year+'-'+String(month).padStart(2,'0')+'-01';
   return {id:year+'-'+companyId+'-'+i,name,companyId,
    company:DEP_SALE_HOUSES[companyId]?.name||'Company not recorded',
    city,category,date:'',endDate:'',sortKey,confirmedDate:false,
    dateLabel:DEP_SALE_MONTHS[month-1]+' '+year+' · usual month, exact date unverified',
    previewIndex:i,lots:[]};
  });
}
// UI-only lot watchlist. Separate from authoritative save and financial records.
function salesWatchKey(auctionId,hip,horse){
 return String(auctionId||'')+'|'+String(hip||horse||'');
}
function salesUpcomingIndex(auctions,now=depGameDay()){
 const index=auctions.findIndex(a=>(a.endDate||a.sortKey)>=now);
 return index<0?(auctions.length?auctions.length-1:-1):index;
}
function salesDesk(page,auction,auctions,visibleTotal){
 const watched=Object.keys(APP.salesWatched||{}).length;
 const next=auctions[salesUpcomingIndex(auctions)];
 const go=(action,label,title,disabled=false)=>
  '<button type="button" data-ng="'+action+'" '+(disabled?'disabled ':'')+'title="'+safe(title||label)+'">'+safe(label)+'</button>';
 if(page==='Sale Calendar'||page==='Sale Companies'){
  const isCalendar=page==='Sale Calendar';
  return '<div class="ng-sales-desk ng-sales-directory" role="group" aria-label="Sales market summary">'+
   '<div class="ng-sales-desk-caption"><small>'+safe(depGameDay().slice(0,4))+' MARKET / NORTH AMERICA</small><strong>'+
   safe(isCalendar?'SALE CALENDAR':'SALES COMPANIES')+'</strong></div>'+
   '<div class="ng-sales-desk-field"><small>OPERATORS</small><b>'+Object.keys(DEP_SALE_HOUSES).length+'</b></div>'+
   '<div class="ng-sales-desk-field"><small>'+safe(isCalendar?'SALES LISTED':'CURRENT MARKET')+'</small><b>'+
   safe(isCalendar?String(visibleTotal):'Regional & national')+'</b></div>'+
   '<div class="ng-sales-desk-field ng-sales-desk-note"><small>DATE STANDARD</small><b>Exact dates where verified · otherwise usual month</b></div>'+
   '<div class="ng-sales-desk-actions">'+go('sale-next-up','NEXT SALE','Open next scheduled auction',!next)+
   go(isCalendar?'sale-company-list':'sale-calendar',isCalendar?'HOUSES':'CALENDAR','Switch Sales directory')+'</div>'+
   '</div>';
 }
 if(page==='Watchlist'){
  return '<div class="ng-sales-desk ng-sales-watch-desk" role="group" aria-label="Auction watchlist">'+
   '<div class="ng-sales-desk-caption"><small>PERSONAL SALES DESK</small><strong>WATCHLIST</strong></div>'+
   '<div class="ng-sales-desk-field"><small>WATCHED LOTS</small><b>'+watched+'</b></div>'+
   '<div class="ng-sales-desk-field ng-sales-desk-note"><small>STORAGE</small><b>Session only · no bids or transactions</b></div>'+
   '<div class="ng-sales-desk-actions">'+go('sale-catalog','CATALOG','Return to selected auction catalog')+
   go('sale-calendar','CALENDAR','Open chronological auction calendar')+'</div></div>';
 }
 const current=auctions.findIndex(a=>a.id===auction?.id);
 const month=auction?.confirmedDate?'VERIFIED DATE':'USUAL MONTH';
 const recordCount=String(visibleTotal);
 return '<div class="ng-sales-desk ng-sales-current-desk" role="group" aria-label="Selected auction information">'+
  '<div class="ng-sales-desk-caption"><small>AUCTION DESK / '+safe(auction?.company||'UNASSIGNED')+
  '</small><strong title="'+safe(auction?.name||'No upcoming auction')+'">'+safe(auction?.name||'NO AUCTION SELECTED')+'</strong></div>'+
  '<div class="ng-sales-desk-field ng-sales-date"><small>'+month+'</small><b>'+
  safe(auction?depSaleDateLabel(auction):'—')+'</b></div>'+
  '<div class="ng-sales-desk-field"><small>VENUE / TYPE</small><b>'+
  safe([auction?.city,auction?.category].filter(Boolean).join(' · ')||'—')+'</b></div>'+
  '<div class="ng-sales-desk-field"><small>'+safe('CATALOG LOTS')+'</small><b>'+
  recordCount+(watched?' · ★ '+watched:'')+'</b></div>'+
  '<div class="ng-sales-desk-actions">'+go('sale-prev','‹','Previous scheduled auction',current<=0)+
  go('sale-next','›','Next scheduled auction',current<0||current>=auctions.length-1)+
  go(page==='Catalogs'?'sale-overview':'sale-catalog',page==='Catalogs'?'OVERVIEW':'CATALOG','Show selected auction catalog')+
  go('sale-calendar','CALENDAR','Browse chronological sale dates')+
  go('sale-watchlist','★ WATCHLIST '+watched,'Review all watched lots in this session')+'</div></div>';
}

function depAuctionList(_preview){
 const verified=window.__WTW_1999_UI_DATA__?.auctionList?.();
 return Array.isArray(verified)?verified:[];
}

/* One connection router for every management roster and Tier One dossier.
   Real profiles are opened only via the authoritative Office record dispatcher;
   unregistered demo names get an honest preview rather than a dead link. */
const DEPT_ENTITY_COLUMNS={
 horse:'horse',name:'row',race:'race',track:'track',sire:'horse',dam:'horse',
 trainer:'person',jockey:'person',owner:'connection',breeder:'connection',
 consignor:'connection',farm:'farm'
};
function entityNotRecorded(name){
 return !name||/^(?:—|-|unknown|not recorded|none|n\/a|private|your operation|unassigned|tbd|not entered|no target)$/i.test(String(name).trim());
}
function entitySourceMatch(name,preferred='',track=''){
 const rows=typeof window.__wtwOfficeSearchRecords==='function'?window.__wtwOfficeSearchRecords():[];
 const matches=Array.isArray(rows)?rows.filter(x=>
  ['horse','person','farm','track','race'].includes(x?.kind)&&x.name===name&&
  (!track||x.kind!=='race'||x.track===track)):[];
 const exact=preferred&&preferred!=='connection'?matches.filter(x=>x.kind===preferred):matches;
 // Refuse to send duplicate names to whichever arbitrary person/farm comes first.
 return exact.length===1?exact[0]:null;
}
function entityKindForField(key,row){
 if(key==='name'||key==='horse')return row?._kind||'';
 if(key==='race')return 'race';
 return DEPT_ENTITY_COLUMNS[key]||'';
}
function entityReferenceButton(name,kind,attrs='',label=''){
 if(entityNotRecorded(name))return '<span>'+safe(name||'—')+'</span>';
 const display=label||name;
 return '<button type="button" class="ng-entity-reference" data-ng="named-entity" data-kind="'+safe(kind)+
  '" data-name="'+safe(name)+'" '+attrs+' title="Open '+safe(name)+' record">'+safe(display)+' ↗</button>';
}
function profileEntityKind(label){
 const t=String(label||'').toLowerCase();
 if(/\b(?:sire|dam|foal|horse|progeny|bloodline)\b/.test(t))return 'horse';
 if(/\b(?:trainer|jockey|rider|groom|veterinarian|farrier|manager|agent)\b/.test(t))return 'person';
 if(/\b(?:owner|breeder|consignor|vendor|seller)\b/.test(t))return 'connection';
 if(/\b(?:stud farm|farm|stable|barn|breeding station)\b/.test(t))return 'farm';
 if(/\b(?:track|racecourse|venue)\b/.test(t))return 'track';
 return '';
}
function namedProfileValue(label,value,preferred=''){
 const kind=preferred||profileEntityKind(label);
 if(!kind||entityNotRecorded(value))return '<strong>'+safe(value||'—')+'</strong>';
 return entityReferenceButton(value,kind);
}
function previewRecordRoute(kind,name,row=null){
 if(entityNotRecorded(name))return;
 APP.previewEntity={kind,name,row:row||null};
 // URL contains the specific preview name: browser back/forward and refresh
 // keep the identity; it is not a new canonical horse or organization record.
 const identity=kind==='person'&&row?._kind==='person'&&row._id?row._id:
  kind==='horse'&&row?._directoryIndex!=null&&row._id?row._id:name;
 openCustomView('Preview:'+encodeURIComponent(kind)+':'+encodeURIComponent(identity),APP.section,APP.page);
}
function openEntityRecord(name,preferred='',row=null){
 if(entityNotRecorded(name))return false;
 if(isClean1999()&&['farm','person','connection',''].includes(preferred)){
  const found=world1999Match(preferred==='connection'?'':preferred,name);
  if(found?.kind==='farm')return openFounding1999Profile('ownership',found.canonicalId);
  if(found?.kind==='person')return openFounding1999Profile('person',found.canonicalId);
 }
 // Generated personnel open their exact ID-backed FM dossier, never an
 // unrelated Office person with the same display name.
 if((preferred==='person'||row?._kind==='person')&&row?._kind==='person'&&row._testGenerated&&row._id)
  return previewRecordRoute('person',name,row);
 const exact=entitySourceMatch(name,preferred,row?._track||'');
 const kind=exact?.kind||preferred||row?._kind||'record';
 if(exact&&window.__wtwOfficeOpenSearchRecord?.(exact.kind,name,exact.track||row?._track)){
  APP.custom='';APP.previewEntity=null;APP.moreOpen=false;
  schedulePaint(20);
  return true;
 }
 const world=world1999Match(kind,name);
 if(world)return openWorld1999Entity(world.worldKey);
 // If this horse is not in the current Office roster, resolve its actual
 // historical Horse_ID before opening a profile. Duplicate names must remain
 // a search, never be assigned to an arbitrary horse.
 if(kind==='horse'){
  fetch('/api/entities?q='+encodeURIComponent(name)+'&kind=horse&limit=250',{credentials:'same-origin',cache:'no-store'})
   .then(r=>r.ok?r.json():Promise.reject(Error('No historical source response')))
   .then(data=>{
    const ids=[...new Set((data.entities||[]).filter(e=>e.kind==='horse'&&(e.name===name||e.source_name===name)).map(e=>e.id))];
    if(ids.length===1)window.location.assign('/archive/?page=horses&horse='+encodeURIComponent(ids[0]));
    else previewRecordRoute(kind,name,row);
   })
   .catch(()=>previewRecordRoute(kind,name,row));
  return true;
 }
 // No source-linked identity: show a clearly labeled preview, not a false file.
 previewRecordRoute(kind,name,row);
 return true;
}
function previewRecordView(){
 const fromState=APP.previewEntity,pieces=(APP.custom||'').split(':');
 const kind=fromState?.kind||decodeURIComponent(pieces[1]||'record');
 const id=decodeURIComponent(pieces.slice(2).join(':')||'');
 const name=fromState?.name||id||'Unregistered record';
 const people=[...(world1999Data?.people||[]),...world1999JockeyRoster,...world1999TrainerRoster];
 const horses=world1999Data?.horses||[];
 const person=people.find(p=>p.id===id||p.id===fromState?.row?._canonId&&p.name===name);
 const horse=horses.find(h=>h.id===id||h.id===fromState?.row?._canonId&&h.name===name);
 // Reuse the approved Horse-style profile only after exact canonical identity
 // has been verified; unregistered entities never acquire mock attributes.
 if(person||horse){
  const fields=fromState?.row||{};
  if(kind==='person')return restored1999Profile('person',{...person,...fields,name});
  if(kind==='horse')return restored1999Profile('horse',{...horse,...fields,name});
 }
 const message='This record is not registered in the approved January 1999 world. No entity, finances, pedigree or attributes have been invented.';
 return '<section class="ng-entity-preview ng-stable-roster-v2">'+
  '<header><div><small>UNREGISTERED · '+safe(kind.toUpperCase())+'</small><h2>'+
  safe(name)+'</h2></div><button data-ng="back" aria-label="Return to previous screen">← BACK</button></header>'+
  '<p class="ng-entity-preview-notice">'+safe(message)+'</p></section>';
}
function depCell(value,key){
 if(value==null||value==='')return '<span class="ng-rs-missing">—</span>';
 const t=key==='purse'?depMoney(value):String(value);
 if(['health','condition','status','morale','ready'].includes(key)){
  const tone=/treat|unfit|injur|poor|overdue|declin/i.test(t)?'treat':
   /watch|needs|risk|inspect|restricted|pending|not ready/i.test(t)?'watch':
   /entered|ready|sound|excellent|good|high|active|confirmed|fit|^[89]\d%$|^100%$/i.test(t)?'sound':'unknown';
  return liveStableSignal(tone,t,t);
 }
 if(['ca','pa'].includes(key)&&/^[1-5]$/.test(t))
  return '<span class="ng-rs-stars" title="Recorded rating '+t+'/5"><b>'+('★'.repeat(Number(t)))+'</b>'+('☆'.repeat(5-Number(t)))+'</span>';
 return safe(t);
}
function depNumeric(v){
 const s=String(v??'').trim().replace(/[$,%\s,]/g,'');
 if(!/^-?\d+(?:\.\d+)?[kKmM]?$/.test(s))return null;
 return Number(s.replace(/[kKmM]$/,''))*(/[mM]$/.test(s)?1000000:/[kK]$/.test(s)?1000:1);
}
function departmentRoster(section,page='Overview'){
 const demo=false; // Registered 1999 content only; preview population retired.
 const auctions=section==='Sales'?depAuctionList(demo):[];
 const gameDay=depGameDay();
 const auction=auctions.find(a=>a.id===APP.departmentAuction)||auctions.find(a=>(a.endDate||a.sortKey)>=gameDay)||null;
 const worldTraitGroups=section==='World'&&page==='1999 Horses'?
  window.__WTW_1999_UI_DATA__?.horseAttributeGroups||[]:[];
 const worldTraits=worldTraitGroups.flatMap(g=>g.definitions);
 const worldTrait=worldTraits.find(d=>d.key===APP.worldAttributeKey)||null;
 const worldAttributeKey=worldTrait?.key||'';
 const specs=section==='Personnel'&&page==='Owners'?DEP_COLUMNS.OwnershipGroups:
  section==='Personnel'&&page==='Principals'?DEP_COLUMNS.PersonnelPrincipals:
  section==='World'&&page==='Tracks'?DEP_COLUMNS.Tracks:section==='World'?(page==='1999 Horses'?
   [...WORLD_1999_COLUMNS.Horses,...(worldTrait?[['attr:'+worldAttributeKey,worldTrait.label+' · TEST',10]]:[])]:
   page==='People'?WORLD_1999_COLUMNS.People:WORLD_1999_COLUMNS.Organizations):
  section==='Sales'&&page==='Watchlist'?DEP_COLUMNS.SalesWatchlist:section==='Sales'&&page==='Sale Calendar'?DEP_COLUMNS.SaleCalendar:section==='Sales'&&page==='Sale Companies'?DEP_COLUMNS.SaleCompanies:section==='Breeding'&&page==='Stud Farms'?DEP_COLUMNS.Facilities:section==='Racing'&&(page==='Calendar'||page==='Race Planning'||page==='Overview'&&APP.racingMode==='day')?DEP_COLUMNS.DayCard:section==='Racing'&&page==='Overview'&&APP.racingMode!=='mine'?DEP_COLUMNS.Meets:DEP_COLUMNS[section];
 // Every department now uses one progressive, sortable roster without pagination.
 const globalHorseDirectory=section==='World'&&page==='1999 Horses'&&
  Boolean(window.__WTW_1999_UI_DATA__?.worldHorseBrowse);
 const virtualHorseIndex=section==='World'&&page==='1999 Horses'&&!globalHorseDirectory&&
  window.__WTW_1999_UI_DATA__?.worldHorsePage;
 const globalMareDirectory=section==='Breeding'&&page==='Broodmares'&&
  Boolean(window.__WTW_1999_UI_DATA__?.breedingMareBrowse);
 const virtualBroodmares=section==='Breeding'&&page==='Broodmares'&&!globalMareDirectory&&
  window.__WTW_1999_UI_DATA__?.breedingMarePage;
 const globalDirectory=globalHorseDirectory||globalMareDirectory;
 const virtualMethod=virtualHorseIndex?'worldHorsePage':virtualBroodmares?'breedingMarePage':null;
 // Large populations stay in the generator. Load a window, not 26k or 87.5k
 // complete horse profiles into every table render.
 const virtualData=virtualMethod?[]:null;
 let virtualTotal=0;
 if(virtualMethod){
  for(let offset=0;offset<APP.departmentScrollLimit;offset+=100){
   const response=window.__WTW_1999_UI_DATA__[virtualMethod](offset,
    Math.min(100,APP.departmentScrollLimit-offset),APP.departmentSearch);
   virtualTotal=response.total||0;
   virtualData.push(...(response.items||[]));
   if(offset+100>=virtualTotal)break;
  }
 }
 let rows=virtualMethod?virtualData:depRows(section,page,demo,auction);
 const search=APP.departmentSearch.trim().toLowerCase();
 if(search&&!virtualMethod)rows=rows.filter(r=>specs.some(([key])=>String(r[key]??'').toLowerCase().includes(search)));
 const rosterScope=section+'|'+page;
 const rosterFilter=window.WTW1999RosterFilters?.get(APP,rosterScope)||null;
 if(rosterFilter)rows=rows.filter(r=>window.WTW1999RosterFilters.matches(r,rosterFilter));
 const defaultSort=section==='World'?'name':section==='Sales'&&page==='Watchlist'?'auction':section==='Racing'&&(page==='Calendar'||page==='Race Planning'||page==='Overview'&&APP.racingMode==='day')?'track':section==='Racing'&&(page!=='Overview'||APP.racingMode==='mine'||APP.racingTrack)?'date':section==='Sales'&&page!=='Sale Calendar'&&page!=='Sale Companies'?'hip':section==='Finances'?'date':specs[0][0];
 const selectedSort=specs.some(x=>x[0]===APP.departmentSortKey)?APP.departmentSortKey:defaultSort;
 const sign=APP.departmentSortKey?(APP.departmentSortDesc?-1:1):(section==='Finances'?-1:1);
 let globalIndexing=false,globalProgress=0;
 if(globalDirectory){
  const browse=globalHorseDirectory?'worldHorseBrowse':'breedingMareBrowse';
  const result=window.__WTW_1999_UI_DATA__[browse]({
   offset:0,limit:APP.departmentScrollLimit,search:APP.departmentSearch,
   sort:selectedSort,desc:sign<0,filters:rosterFilter||{},attributeKey:globalHorseDirectory?worldAttributeKey:''
  });
  rows=result.items||[];virtualTotal=result.total||0;
  globalIndexing=Boolean(result.indexing);globalProgress=result.progress||0;
 }
 if(!globalDirectory)rows.sort((a,b)=>{
  if(section==='Racing'&&(page==='Calendar'||page==='Race Planning'||page==='Overview'&&APP.racingMode==='day')&&
     (!APP.departmentSortKey||APP.departmentSortKey==='track'||APP.departmentSortKey==='date'))
   return String(a.track).localeCompare(String(b.track))||
    Number(a._cardOrder??999)-Number(b._cardOrder??999)||
    String(a.race).localeCompare(String(b.race),undefined,{numeric:true});
  let av=selectedSort==='date'&&a._iso?a._iso:a[selectedSort],bv=selectedSort==='date'&&b._iso?b._iso:b[selectedSort];
  const am=av===null||av===undefined||av==='',bm=bv===null||bv===undefined||bv==='';
  if(am!==bm)return am?1:-1;
  const an=depNumeric(av),bn=depNumeric(bv);
  const comp=an!==null&&bn!==null?an-bn:String(av).localeCompare(String(bv),undefined,{numeric:true,sensitivity:'base'});
  return comp*sign||String(a._name).localeCompare(String(b._name));
 });
 const totalRecords=globalDirectory||virtualMethod?virtualTotal:rows.length;
 const shown=globalDirectory||virtualMethod?rows:rows.slice(0,Math.min(rows.length,APP.departmentScrollLimit));
 APP.departmentVisible=shown;

 const heads=specs.map(([key,label])=>'<th scope="col" aria-sort="'+(selectedSort===key?(sign===1?'ascending':'descending'):'none')+'"><button data-ng="dept-sort" data-val="'+key+'" title="Sort by '+safe(label)+'">'+safe(label)+'<span aria-hidden="true">'+(selectedSort===key?(sign===1?'▲':'▼'):'↕')+'</span></button></th>').join('');
 const body=shown.map((r,i)=>{
  return '<tr>'+specs.map(([key])=>{
   let v=depCell(r[key],key);
   if(globalHorseDirectory&&key.startsWith('attr:')){
    const raw=r[key];
    if(typeof raw==='number'&&Number.isFinite(raw)){
     const percentage=raw<=1?Math.round(raw*99):null;
     const shownValue=percentage===null?Number(raw.toFixed(2)):percentage;
     const band=percentage===null?'good':percentage>=75?'high':percentage>=55?'good':percentage>=35?'moderate':'low';
     v='<span class="ng-attr-score ability-'+band+'">'+
      (percentage===null?'':'<span class="ng-attr-track"><i style="width:'+percentage+'%"></i></span>')+
      '<b>'+shownValue+'</b></span>';
    }else v=raw==null?'—':safe(String(raw));
   }
   const kind=entityKindForField(key,r);
   if(section==='World'&&key==='operation'&&r.operation)
    v=world1999Linked('farm',r._operationId,r.operation);
   if(section==='World'&&key==='principal'&&r.principal)
    v=world1999Linked('person',r._principalId,r.principal);
   if(section==='World'&&r._role==='opening'&&['owner','trainer','track'].includes(key)){
    const k=key==='owner'?'farm':key==='trainer'?'person':'track';
    v=world1999Linked(k,r['_'+key+'Id'],r[key]);
   }
   if(section==='Sales'&&r._kind==='horse'&&key==='hip'){
    const watching=Boolean(APP.salesWatched?.[r._watchKey]);
    v='<div class="ng-sales-hip"><button type="button" data-ng="sale-watch" data-val="'+i+
     '" aria-label="'+(watching?'Remove ':'Watch ')+'lot '+safe(r.hip)+'" aria-pressed="'+watching+
     '" title="'+(watching?'Remove from watchlist':'Add to watchlist (this session)')+
     '" class="'+(watching?'on':'')+'">'+(watching?'★':'☆')+'</button><span>'+safe(r.hip||'—')+'</span></div>';
   }
   if(section==='Sales'&&r._kind==='horse'&&key==='auction'){
    v='<button type="button" class="ng-entity-reference" data-ng="sale-open-watch" data-val="'+i+
     '" title="Open '+safe(r.auction)+' catalog">'+safe(r.auction)+' ↗</button>';
   }
   if(section==='Sales'&&r._kind==='sale-event'&&key==='company'){
    v='<button type="button" class="ng-entity-reference" data-ng="dept-related" data-val="'+i+'" data-field="company" title="View sales operated by '+safe(String(r.company))+'">'+safe(String(r.company))+' ↗</button>';
   }
   const primary=(key==='horse'||key==='name'||(key==='race'&&['race','demo-race'].includes(r._kind)))&&r._kind!=='finance';
   if(primary){
    const first=r._kind==='horse'?
     (demo?'<span class="ng-rs-demo-owner" title="Fictional ownership marker">'+safe((r.owner||r._name||'?').charAt(0))+'</span>':horseOwnerBadge(r._name)):'';
    v='<button type="button" class="ng-rs-horse" data-ng="dept-open" data-val="'+i+
     '" aria-label="Open '+safe(r._name)+'" title="'+safe(r._kind==='sale-event'?'Open this auction':r._kind==='sale-company'?'View this company\'s sales':'Open '+r._name+' profile')+'">'+first+
     '<span>'+safe(r._name)+'</span></button>';
    if(section==='World'&&r._worldKey)
     v+='<button type="button" class="ng-world-inline-edit" data-ng="world-edit" data-val="'+safe(r._worldKey)+'" title="Edit '+safe(r._name)+'">✎ EDIT</button>';
   }else if(section==='World'&&r._role==='opening'&&['owner','trainer','track'].includes(key)){
    // Canonical IDs take precedence over similarly named unrelated entities.
   }else if(kind&&!entityNotRecorded(r[key])&&r._kind!=='finance'){
    v='<button type="button" class="ng-entity-reference" data-ng="dept-related" data-val="'+i+
     '" data-field="'+safe(key)+'" title="Open '+safe(String(r[key]))+' record">'+
     safe(String(r[key]))+' ↗</button>';
   }
   return '<td title="'+safe(String(r[key]??''))+'">'+v+'</td>';
  }).join('')+'</tr>';
 }).join('');
 const pager='<span class="ng-dpt-records">'+totalRecords+' RECORDS · '+shown.length+
  (globalIndexing?' LOADED · INDEXING '+globalProgress+' / '+(globalMareDirectory?Number(window.__WTW_1999_UI_DATA__?.counts?.breedingMares||0).toLocaleString('en-US')+' MARES':Number(window.__WTW_1999_UI_DATA__?.counts?.worldHorses||0).toLocaleString('en-US')+' HORSES')+'…':
   ' LOADED · SCROLL FOR MORE')+
  (globalHorseDirectory?' · SORT/FILTER ALL '+(Number(window.__WTW_1999_UI_DATA__?.counts?.worldHorses||0).toLocaleString('en-US'))+' HORSES':
   globalMareDirectory?' · SORT/FILTER ALL BROODMARES':
   virtualMethod?' · SCROLL FOR MORE':'')+'</span>';
 const viewOptions=(tabmap[section]||[]).map(t=>'<option value="'+safe(t)+'" '+(t===page?'selected':'')+'>'+safe(t)+'</option>').join('');
 const racingTracks=section==='Racing'?depTrackCalendar().slice().sort((a,b)=>a.name.localeCompare(b.name)):[];
 if(section==='Racing'&&APP.racingTrack&&!racingTracks.some(x=>x.name===APP.racingTrack)){
  APP.racingTrack='';if(APP.racingMode==='track')APP.racingMode='meets';
 }
 const racingDate=depRaceBrowseDate();
 const racingPicker=section==='Racing'?'<label class="ng-dpt-track-picker">TRACK <select data-ng-select="department-track" aria-label="Select any 1999 racecourse to inspect meets and condition books">'+
  '<option value="" '+(!APP.racingTrack?'selected':'')+'>ALL TRACKS ('+racingTracks.length+')</option>'+
  racingTracks.map(t=>'<option value="'+safe(t.name)+'" '+(APP.racingTrack===t.name?'selected':'')+'>'+safe(t.name+' · '+t.location)+'</option>').join('')+
  '</select></label>'+
  '<label class="ng-racing-track-find">FIND TRACK <input type="search" data-ng-input="racing-track-find" list="ngRacingTrackNameList" value="'+safe(APP.racingTrack)+'" placeholder="Type a track name…" autocomplete="off" aria-label="Find a racecourse by name"/><datalist id="ngRacingTrackNameList">'+
  racingTracks.map(t=>'<option value="'+safe(t.name)+'"></option>').join('')+'</datalist></label>'+
  '<label class="ng-racing-date-label" for="ngRacingBrowseDate">DATE <input id="ngRacingBrowseDate" data-ng-input="department-race-date" type="date" min="1999-01-01" max="1999-12-31" value="'+safe(racingDate)+'" aria-label="Browse 1999 race date"/></label>'+
  '<button data-ng="dept-meets" class="'+(APP.racingMode==='meets'||APP.racingMode==='track'?'on':'')+'" title="See all active meets on the selected date, or one track\'s full meet schedule">MEETS</button>'+
  '<button data-ng="dept-day-card" class="'+(APP.racingMode==='day'||page==='Race Planning'?'on':'')+'" title="All proposed race cards on the selected date">DAY\'S RACES</button>'+
  '<button data-ng="dept-race-calendar" class="'+(APP.racingCalendarOpen||page==='Calendar'?'on':'')+'" title="Show or hide the monthly racing calendar">CALENDAR</button>'+
  '<button data-ng="dept-race-game-date" title="Browse the game date without advancing time">GAME DATE</button>'+
  '<button data-ng="dept-myhorses" class="'+(APP.racingMode==='mine'?'on':'')+'" title="Upcoming plans for your owned horses">MY HORSES</button>':'';
 const salePicker=section==='Sales'&&!['Sale Calendar','Sale Companies','Watchlist'].includes(page)?'<label class="ng-dpt-auction-picker">AUCTION <select data-ng-select="department-auction" aria-label="Choose auction chronologically">'+
  (auctions.length?auctions.map(a=>'<option value="'+safe(a.id)+'" '+(auction?.id===a.id?'selected':'')+'>'+safe(depSaleLabel(a))+'</option>').join(''):'<option>No upcoming auction data</option>')+
  '</select></label>':'';
 const saleHouseLink=''; // Sales company accessible from desk and directory.
 const saleCompanyPicker=section==='Sales'&&page==='Sale Calendar'?
  '<label class="ng-dpt-sales-company-picker">COMPANY <select data-ng-select="department-sales-company" aria-label="Show sale calendar by operator">'+
  '<option value="" '+(!APP.departmentCompany?'selected':'')+'>ALL SALE COMPANIES</option>'+
  Object.entries(DEP_SALE_HOUSES).map(([id,house])=>'<option value="'+safe(id)+'" '+(APP.departmentCompany===id?'selected':'')+'>'+safe(house.name)+'</option>').join('')+
  '</select></label>':'';
 const worldAttributePicker=section==='World'&&page==='1999 Horses'&&worldTraits.length?
  '<label class="ng-dpt-track-picker">RANK WORLD HORSES BY <select data-ng-select="world-attribute" aria-label="Choose an attribute to rank every world horse">'+
  '<option value="" '+(!worldTrait?'selected':'')+'>SELECT AN ATTRIBUTE</option>'+
  worldTraitGroups.map(group=>'<optgroup label="'+safe(group.name)+'">'+group.definitions.map(def=>
   '<option value="'+safe(def.key)+'" '+(worldAttributeKey===def.key?'selected':'')+'>'+safe(def.label)+'</option>').join('')+
   '</optgroup>').join('')+'</select></label>':'';
 const salesDeskView=section==='Sales'?salesDesk(page,auction,auctions,rows.length):'';
 const cash=availableCash();
 const finance=section==='Finances'?'<div class="ng-dpt-finance">'+[
  ['CASH',cash!=null?depMoney(cash):'—'],
  ['MONTHLY INCOME','—'],['MONTHLY COSTS','—'],['NET CASH FLOW','—']
 ].map(([name,value])=>'<span><small>'+safe(name)+'</small><b>'+safe(value)+'</b></span>').join('')+'</div>':'';
 const racingDayView=section==='Racing'&&(page==='Calendar'||page==='Race Planning'||page==='Overview'&&APP.racingMode==='day');
 const racingDaySummary=section==='Racing'?window.__WTW_1999_UI_DATA__?.racingDaySummary?.(racingDate,APP.racingTrack):null;
 const racingSummary=section==='Racing'?'<div class="ng-racing-day-summary"><strong>'+safe(racingDate)+' · '+safe(APP.racingTrack||'ALL TRACKS')+'</strong>'+
  '<span>'+Number(racingDaySummary?.trackCount||0)+' TRACKS SCHEDULED TO RACE · '+Number(racingDaySummary?.plannedStakes||0)+' PLANNED STAKES · '+(racingDayView?totalRecords+' PROPOSED RACES / FEATURES':'VIEW MEET WINDOWS')+'</span></div>':'';
 const purpose=section==='Racing'?(racingDayView?'PROPOSED RACE CARDS · '+racingDate+' · '+(APP.racingTrack||'ALL TRACKS'):APP.racingMode==='mine'?'MY HORSES · ALL UPCOMING ENTRIES AND TARGETS':APP.racingTrack?'1999 MEETS AT '+APP.racingTrack.toUpperCase():'TRACKS HOLDING MEETS ON '+racingDate):
  section==='Breeding'?'STUD FEES, COVERINGS & PRODUCTION':
  section==='Sales'?(page==='Watchlist'?'WATCHED LOTS · UI SESSION ONLY':page==='Sale Calendar'?'CHRONOLOGICAL SALES · COMPANY · VENUE · DATE':page==='Sale Companies'?'AUCTION HOUSE DIRECTORY · SALES CALENDAR':auction?depSaleLabel(auction).toUpperCase()+' · '+depSaleDateLabel(auction)+' · '+(auction.city||''):'NO UPCOMING AUCTIONS'):
  section==='World'?'CANONICAL JANUARY 1999 POPULATION · SOURCE-LINKED IDENTITIES':
  section==='Personnel'?(page==='Owners'?'OWNERS · PARTNERSHIPS · SYNDICATES · PRINCIPALS':'TRAINERS · JOCKEYS · PROFESSIONAL STAFF'):
  section==='Facilities'?'CAPACITY · QUALITY · MAINTENANCE':'INCOME · EXPENSES · CASH FLOW';
 return '<section class="ng-functional ng-stable-roster-v2 ng-dept-roster" data-department="'+safe(section)+'" data-page="'+safe(page)+'" data-roster-kind="'+(specs===DEP_COLUMNS.Meets?'meet':'regular')+'">'+
  '<div class="ng-rs-title"><strong>'+safe(section.toUpperCase())+' · '+safe(page.toUpperCase())+'</strong><span title="'+safe(purpose)+'">'+safe(purpose)+(demo?' · FICTIONAL PREVIEW':'')+'</span></div>'+
  finance+'<div class="ng-rs-tools">'+racingPicker+salePicker+saleHouseLink+saleCompanyPicker+worldAttributePicker+'<label>VIEW <select data-ng-select="department-tab" aria-label="Choose '+safe(section)+' view">'+viewOptions+'</select></label>'+
  '<input id="ngDepartmentSearch" data-ng-input="department-search" type="search" aria-label="Search '+safe(section)+' roster" value="'+safe(APP.departmentSearch)+'" placeholder="Find records…" autocomplete="off"/>'+

  (section==='World'?'<button type="button" data-ng="world-export" title="Download all World edits and images">EXPORT EDITS</button>'+
   '<button type="button" data-ng="world-import-open" title="Import World editing backup">IMPORT EDITS</button>'+
   '<input type="file" id="wtwWorldImportInput" accept="application/json,.json" hidden/>':'')+
  '<span class="ng-dpt-mode">FULL-WIDTH ROSTER</span></div>'+
  (window.WTW1999RosterFilters?.render(specs,rosterFilter,safe,rosterScope)||'')+
  (section==='Racing'&&(APP.racingCalendarOpen||page==='Calendar')?depRacingCalendar():'')+racingSummary+salesDeskView+
  '<section class="ng-rs-roster"><header><strong>'+safe(section.toUpperCase())+' · SORTABLE ROSTER</strong><div class="ng-dpt-pager">'+pager+'</div></header>'+
  '<div class="ng-rs-scroll" tabindex="0" role="region" aria-label="'+safe(section)+' roster — scroll vertically and click column headings to sort"><table class="ng-rs-table ng-dpt-table"><thead><tr>'+heads+'</tr></thead><tbody>'+
  (body||'<tr><td colspan="'+specs.length+'" class="ng-rs-no-results">'+safe(globalIndexing?
   'Indexing '+globalProgress.toLocaleString('en-US')+' of '+(globalMareDirectory?Number(window.__WTW_1999_UI_DATA__?.counts?.breedingMares||0).toLocaleString('en-US')+' breeding mares':Number(window.__WTW_1999_UI_DATA__?.counts?.worldHorses||0).toLocaleString('en-US')+' horses')+
   ' for global sort/filter — source identities retained.':
   section==='Racing'&&racingDayView?'No races in the proposed condition book on '+racingDate+'. Choose another track or date.':section==='World'&&!world1999Data?'Loading the 1999 world registry…':section==='Sales'&&page==='Watchlist'?'No watched lots yet. Select ☆ beside a catalog hip to watch it for this session.':section==='Sales'&&page==='Private Offers'?'No recorded private offers. Bidding and negotiation are not enabled in this UI preview.':section==='Sales'?'No catalog lots recorded for this view.':demo?'No matching records.':'No supported records in this view.')+'</td></tr>')+
  '</tbody></table></div><div class="ng-dpt-disclosure">'+(racingDayView?'1999 GAME-MODELED CONDITION BOOKS · NO OFFICIAL ENTRIES · NO RESULTS COMMITTED · STAKES ARE PLANNED FEATURES':demo?'FICTIONAL DISPLAY VALUES ONLY — no prices, locations or medical facts saved.':'SOURCE RECORDS ONLY · unknown values shown as —')+
  '</div></section></section>';
}

function managerDashboard(){
 const section=APP.section||'Office',page=APP.page||'Overview';
 // The live Stable roster is routed directly, even without a legacy Office route.
 if(section==='Stable'&&(page==='Overview'||page==='Horses'))return liveStableRosterView();
 if(typeof DEP_NAMES!=='undefined'&&DEP_NAMES.has(section))return departmentRoster(section,page);
 if(section==='World'&&page==='1999 Horses')return liveStableRosterView(true);
 if(section==='World'&&['People','Organizations'].includes(page))return departmentRoster('World',page);
 const configs={
  Office:{kinds:['decision','horse','person'],label:'RACING OPERATIONS'},
  Stable:{kinds:['horse','person','farm'],label:'HORSES & STABLE OPERATIONS'},
  Racing:{kinds:['race','track','horse'],label:'RACES & ACTIVE TARGETS'},
  Breeding:{kinds:['farm','horse','person'],label:'BREEDING WORLD RECORDS'},
  Sales:{kinds:['horse','farm','decision'],label:'HORSES & MARKET FILES'},
  Personnel:{kinds:['person','horse'],label:'PEOPLE & ASSIGNMENTS'},
  Facilities:{kinds:['farm','track'],label:'FARMS & RACING FACILITIES'},
  Finances:{kinds:['decision','horse'],label:'FINANCIAL CONTEXT'},
  World:{kinds:['track','race','person','farm'],label:'RACING WORLD DIRECTORY'}
 };
 const config=configs[section]||configs.Office;
 const all=globalSearchItems();APP.searchIndex=all;
 const kindFilter=({kind,detail,name})=>{
  if(!config.kinds.includes(kind))return false;
  if(section==='Office'&&['Messages','Decisions'].includes(page))return kind==='decision';
  if(section==='Personnel'&&/^(Trainers|Jockeys|Owners|Staff)$/.test(page)&&kind==='person'){
   const role=(detail||'').toLowerCase(),target={Trainers:'trainer',Jockeys:'jockey',Owners:'owner',Staff:'staff'}[page];
   return role.includes(target);
  }
  if(section==='Facilities'&&page==='Farms')return kind==='farm';
  if(section==='Facilities'&&page==='Training Centers')return kind==='farm'||kind==='track';
  if(section==='Racing'&&page==='Results')return kind==='race';
  if(section==='World'&&page==='Tracks')return kind==='track';
  if(section==='World'&&page==='Major Races')return kind==='race';
  if(section==='Sales'&&page==='Auctions')return kind==='decision'||kind==='horse';
  return true;
 };
 const found=all.map((r,i)=>({...r,sourceIndex:i})).filter(kindFilter);
 const items=found.filter(r=>r.kind==='horse'||r.kind==='person'||r.kind==='farm'||r.kind==='track'||r.kind==='race'||r.kind==='decision');
 const messages=currentMessages(),open=messages.filter(m=>!m.resolved);
 const upcoming=racingRows();
 const records=items.map(r=>{
  const owner=r.kind==='horse'?horseOwnership(r.name):null;
  const secondary=r.kind==='horse'?(owner?.name||'Not recorded'):r.kind==='race'?(r.track||'—'):(r.detail||'—');
  const detail=r.kind==='horse'?(horseRows().find(h=>h.name===r.name)?.activity||'Horse file'):r.detail||'Connected record';
  return '<button class="ng-manager-row" type="button" data-ng="search-go" data-val="'+r.sourceIndex+'" aria-label="Open '+safe(r.name)+'">'+
   '<span class="ng-manager-row-type">'+safe(r.kind.toUpperCase())+'</span>'+
   '<span class="ng-manager-row-name">'+(r.kind==='horse'?horseOwnerBadge(r.name):'')+'<strong>'+safe(r.name)+'</strong></span>'+
   '<span class="ng-manager-row-detail">'+safe(detail)+'</span>'+
   '<span class="ng-manager-row-context" title="'+safe(secondary)+'">'+safe(secondary)+'</span>'+
   '<span class="ng-manager-row-open">'+glyph('right',12)+'</span></button>';
 }).join('');
 const caseList=messages.slice(0,7).map(m=>'<button class="ng-manager-case" data-ng="case" data-val="'+safe(m.case)+'">'+
  '<span class="ng-manager-case-indicator '+(m.resolved?'resolved':m.urgent?'urgent':'')+'"></span>'+
  '<span><strong>'+safe(m.title)+'</strong><small>'+safe(m.from)+'</small></span>'+
  '<span class="ng-manager-case-state">'+(m.resolved?'REVIEWED':m.urgent?'ACTION':'OPEN')+'</span></button>').join('');
 const schedule=upcoming.slice(0,6).map((r,i)=>'<button class="ng-manager-fixture" data-ng="fixture" data-val="'+i+'">'+
  '<span>'+safe(r.date)+'</span><strong>'+safe(r.name)+'</strong><small>'+safe(r.track)+'</small><em>'+safe(r.status||'TARGET')+'</em></button>').join('');
 const metrics=[
  ['CONNECTED FILES',String(items.length)],
  ['OPEN DECISIONS',String(open.length)],
  ['RACE TARGETS',String(upcoming.length)],
  ['AVAILABLE CASH',cashDisplay()]
 ].map(([label,value])=>'<div class="ng-manager-metric"><small>'+label+'</small><strong>'+safe(value)+'</strong></div>').join('');
 const sections=(tabmap[section]||[]).filter(x=>x!=='Overview');
 return '<section class="ng-manager-screen">'+
  '<header class="ng-manager-head"><div class="ng-manager-identity">'+
   '<span>'+safe(section.toUpperCase())+' / '+safe(page.toUpperCase())+'</span>'+
   '<h2>'+safe(config.label)+'</h2></div>'+
   '<div class="ng-manager-controls">'+
    (APP.custom==='Opportunities'?'<button data-ng="action" data-val="Open opportunity board">OPEN LIVE OPPORTUNITY BOARD</button>':'')+
    '<label>RECORD VIEW <select data-ng-select="manager-screen" aria-label="Open department screen">'+
    '<option value="Overview" '+(page==='Overview'?'selected':'')+'>Overview</option>'+
    sections.map(x=>'<option value="'+safe(x)+'" '+(page===x?'selected':'')+'>'+safe(x)+'</option>').join('')+
    '</select></label><button data-ng="custom" data-val="Search">'+glyph('search',13)+' SEARCH ALL</button></div></header>'+
  '<div class="ng-manager-metrics">'+metrics+'</div>'+
  '<div class="ng-manager-workspace"><section class="ng-manager-primary"><header>'+
   '<strong>'+safe(page==='Overview'?'CONNECTED WORLD RECORDS':page.toUpperCase()+' · CONNECTED RECORDS')+'</strong>'+
   '<span>'+items.length+' VERIFIED LINKS TO EXISTING PAGES</span></header>'+
   '<div class="ng-manager-columns"><span>TYPE</span><span>NAME</span><span>ROLE / ACTIVITY</span><span>OWNER / LOCATION</span><span></span></div>'+
   '<div class="ng-manager-rows">'+(records||'<p class="ng-manager-empty">No source-linked records for this screen yet. Nothing has been invented to fill the table.</p>')+'</div></section>'+
   '<aside class="ng-manager-sidebar"><section class="ng-manager-secondary"><header><strong>DECISION INBOX</strong><span>'+open.length+' OPEN</span></header>'+
     '<div class="ng-manager-secondary-list">'+caseList+'</div></section>'+
    '<section class="ng-manager-secondary"><header><strong>RACING CALENDAR</strong><span>'+upcoming.length+' TARGETS</span></header>'+
     '<div class="ng-manager-secondary-list">'+(schedule||'<p class="ng-manager-empty">No recorded race targets.</p>')+'</div></section>'+
   '</aside></div></section>';
}
function open1999Race(record){
 if(!record)return false;
 const race=record._raceData||record;
 const routeKey=String(race.id||race._raceId||[race.trackName||race.track||'',
  race.name||race.race||'',race.localDate||race.date||''].join('|'));
 if(!routeKey||routeKey==='||')return false;
 APP.raceDetail={...race,name:race.name||race.race||race.conditions||'Race file'};
 APP.raceRouteKey=routeKey;
 openCustomView('RaceFile:'+encodeURIComponent(routeKey),'Racing',APP.page);
 return true;
}
function renderRoute(){const route=APP.custom?null:currentRoute();const previewMode=APP.custom.startsWith('Preview:');const title=previewMode?(APP.previewEntity?.name||decodeURIComponent(APP.custom.split(':').slice(2).join(':'))):route?.title||APP.custom||'Page';const kicker=previewMode?'RECORD PREVIEW':route?.kicker||APP.section;const bdg=route?badge(({'Horse Profile':'horse','People Profile':'people','Farm Profile':'farm_stable','Track Profile':'track','Race Calendar':'meet_schedule','Stable':'farm_stable','Sales':'connections','News':'history','World':'track','Opportunity Board':'reputation'}[route.kicker])||'history'):pageBadge();
let body='';const profile=route&&/Profile$/.test(route.kicker)?profileDetail(route):null;const functional=route?functionalRoute(route):null;if(profile)body=profile;else if(functional)body=functional;else if(route)body=route.body;else if(APP.custom==='Organization Overview'){body=organizationOverview()}
else if(APP.custom==='Due Actions'){body=dueActionOverview()}
else if(['Messages','Decisions','Opportunities'].includes(APP.custom)){body=managerDashboard()}
else if(APP.custom==='Search'){body=searchView()}
else if(APP.custom.startsWith('WorldRecord:')){body=world1999Profile()}
else if(APP.custom.startsWith('FoundingProfile:')){body=founding1999Profile()}
else if(APP.custom.startsWith('RaceFile:')){const id=decodeURIComponent(APP.custom.slice('RaceFile:'.length));const race=APP.raceRouteKey===id?APP.raceDetail:window.__WTW_1999_UI_DATA__?.findRace?.(id);body=window.WTW1999RaceConditions?.render(race,window.__WTW_1999_UI_DATA__)||'<section class="ng-1999-race-file"><h2>Race file loading unavailable</h2></section>'}
else if(APP.custom.startsWith('Preview:')){body=previewRecordView()}
else {body=managerDashboard()}
const isProfile=Boolean(profile)||body.startsWith('<div class="ng-profile-view '),isOrganization=APP.custom==='Organization Overview',isSearch=APP.custom==='Search',isManager=body.startsWith('<section class="ng-manager-screen">');
return `<main class="ng-route ${isProfile?'ng-route-profile':isOrganization?'ng-route-organization':isSearch?'ng-route-search':isManager?'ng-route-manager':''}">${isProfile||isOrganization||isManager?'':`<header class="ng-routeheading"><span class="ng-route-badge-slot" aria-hidden="true">${APP.custom==='Organization Overview'?organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',true,true):`<img class="ng-routebadge" src="${safe(bdg)}" alt=""/>`}</span><div class="ng-routetext"><small>${safe(kicker)}</small><h1>${safe(title)}</h1></div><button class="ng-back" data-ng="office">← RACING OFFICE</button></header>`}<div class="ng-routegrid" data-route-key="${safe((route?.kicker||APP.custom||APP.section)+'|'+(route?.title||APP.custom||APP.page))}"><div class="ng-routeinner">${body}</div></div></main>`;}
// Keep browser-native select menus mounted while the user chooses an option.
// Hidden Office mutations repaint this interface frequently; a full re-render
// while the menu is open destroys the select and interrupts the mouse gesture.
let activeNativeSelect=null;
let deferredNativeSelectPaint=false;
function beginNativeSelectInteraction(select){
 if(!select||select.tagName!=='SELECT'||!root.contains(select))return;
 activeNativeSelect=select;
}
function endNativeSelectInteraction(flush=true){
 if(!activeNativeSelect)return;
 activeNativeSelect=null;
 const pending=deferredNativeSelectPaint;
 deferredNativeSelectPaint=false;
 if(flush&&pending)schedulePaint(0);
}
root.addEventListener('pointerdown',event=>{
 const select=event.target?.closest?.('select');
 if(select)beginNativeSelectInteraction(select);
},true);
root.addEventListener('focusin',event=>{
 beginNativeSelectInteraction(event.target);
},true);
root.addEventListener('focusout',event=>{
 const select=event.target;
 if(select!==activeNativeSelect)return;
 setTimeout(()=>{
  if(activeNativeSelect===select&&document.activeElement!==select)
   endNativeSelectInteraction(true);
 },0);
},true);
function paint(){
 if(!APP.ready)return;
 // Read-only career progression: date drives the one source world, not UI stars.
 window.__WTW_1999_UI_DATA__?.setGameDate?.(depGameDay());
 if(window.__WTW_1999_MANAGEMENT__&&!window.__WTW_1999_UI_DATA__){
  root.innerHTML='<div class="ng-manager-shell" role="status" aria-label="Loading January 1999 game world"><div class="ng-manager-stage"><p style="padding:24px">Opening January 1, 1999 racing world…</p></div></div>';
  return;
 }
 loadWorld1999();
 if(activeNativeSelect&&activeNativeSelect.isConnected){deferredNativeSelectPaint=true;return}
 if(activeNativeSelect&&!activeNativeSelect.isConnected)endNativeSelectInteraction(false);
 const oldRoute=$('.ng-routegrid',root),oldTab=$('.ng-profiletabs .on',root)?.dataset.val||'';
 const previousRouteKey=oldRoute?.dataset.routeKey||'';
 const previousRouteScroll=oldRoute?.scrollTop||0;
 const previousRoster=$('.ng-dept-roster .ng-rs-scroll',root);
 const previousRosterKey=previousRoster?.closest('.ng-dept-roster')?.getAttribute('data-department')+'|'+
   previousRoster?.closest('.ng-dept-roster')?.getAttribute('data-page');
 const previousRosterScroll=previousRoster?.scrollTop||0;
 const previousDetailScroll=$('.ng-profile-view .ng-detail-cols',root)?.scrollTop||0;
 const oldCards=$$('.ng-profile-view .ng-detailcard',root).map((card,index)=>({
  key:index+'|'+($('header',card)?.textContent.trim()||''),
  scroll:card.scrollTop
 }));
 if(!window.__WTW_1999_MANAGEMENT__)APP.activeCase=$('.left .msg.selected')?.dataset.case||APP.activeCase;
 const route=currentRoute();
 const stage=(route||APP.custom)?renderRoute():`<main class="ng-board">${inbox()}${center()}${right()}</main>`;
 root.innerHTML=header()+'<div class="ng-manager-shell">'+managerSidebar()+
   '<div class="ng-manager-stage">'+stage+'</div></div>'+(APP.savePanelOpen?namedSavePanel():'');
 const nextRoute=$('.ng-routegrid',root),nextTab=$('.ng-profiletabs .on',root)?.dataset.val||'';
 const nextRoster=$('.ng-dept-roster .ng-rs-scroll',root);
 if(nextRoster){
  const nextRosterKey=nextRoster.closest('.ng-dept-roster')?.getAttribute('data-department')+'|'+
    nextRoster.closest('.ng-dept-roster')?.getAttribute('data-page');
  nextRoster.scrollTop=APP.departmentScrollReset||previousRosterKey!==nextRosterKey?0:previousRosterScroll;
  APP.departmentScrollReset=false;
 }
 if(nextRoute&&previousRouteKey&&nextRoute.dataset.routeKey===previousRouteKey){
  nextRoute.scrollTop=previousRouteScroll;
  if(oldTab===nextTab){
   const detail=$('.ng-profile-view .ng-detail-cols',root);
   if(detail)detail.scrollTop=previousDetailScroll;
   $$('.ng-profile-view .ng-detailcard',root).forEach((card,index)=>{
    const key=index+'|'+($('header',card)?.textContent.trim()||'');
    const prior=oldCards.find(item=>item.key===key);
    if(prior)card.scrollTop=prior.scroll;
   });
  }
 }
}
function schedulePaint(ms=0){if(APP.paintQueued)return;APP.paintQueued=true;setTimeout(()=>{APP.paintQueued=false;paint()},ms)}
// Capture new UI clicks before the old Office's document-level delegated handler.
window.addEventListener('click',e=>{
 if(e.target?.closest?.('#wtwNextgen select'))return;
 const btn=e.target.closest('#wtwNextgen [data-ng],#wtwNextgen [data-act]');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 const key=btn.dataset.ng, val=btn.dataset.val||'';
 if(!key && btn.dataset.act){syntheticAction(btn);return}
 if(key==='save-open'){
  // Compact IndexedDB careers are the default commercial path.
  // The old named-save dialog remains accessible as a compatibility fallback.
  if(window.WTWCompactCareerManager?.open)return window.WTWCompactCareerManager.open();
  APP.savePanelOpen=true;APP.saveError='';paint();root.querySelector('#ngNamedSaveName')?.focus();return;
 }
 if(key==='save-close'){APP.savePanelOpen=false;APP.saveError='';return paint()}
 if(key==='commercial-career-open'){
  if(!window.WTWCompactCareerManager?.open)return namedSaveError('Compact career manager has not loaded. Refresh this page.');
  APP.savePanelOpen=false;paint();return window.WTWCompactCareerManager.open();
 }
 if(key==='named-create')return namedSaveCreate();
 if(['named-load','named-rename','named-delete','named-overwrite'].includes(key))return namedSaveHandle(key,val);
 if(key==='named-export-current')return bridgeNode(originalAct('Export'));
 if(key==='named-backup')return namedSaveDownload('wire_to_wire_named_saves.json',
  {schema:'WTW_NAMED_SAVE_SLOTS_V1',exportedAt:new Date().toISOString(),slots:namedSaves()});
 if(key==='named-import')return root.querySelector('#ngNamedSavesImport')?.click();
 if(key==='organization')return openOrganization();
 if(key==='search-go')return openSearchItem(APP.searchIndex[Number(val)]);
 if(key==='search-type'){APP.searchType=val;APP.searchPage=0;return updateSearchRoster()}
 if(key==='search-sort'){APP.searchSort=val;APP.searchPage=0;return updateSearchRoster()}
 if(key==='search-page'){APP.searchPage=Math.max(0,APP.searchPage+Number(val));return updateSearchRoster()}
 if(key==='search-history')return window.location.assign('/archive/?page=races');
 if(key==='due')return openCustomView('Due Actions')
 if(key==='followup'){
  const item=openFollowUps().find(f=>String(f.id)===val);
  if(!item||!item.caseId)return;
  APP.custom='';APP.section='Office';APP.page='Overview';
  return selectMessage(item.caseId);
 }
 if(key==='more'){APP.moreOpen=!APP.moreOpen;return paint()}
 if(key==='menu')return openMenu(val);
 if(key==='world-directory'){APP.section='World';return pageTab('1999 Horses')}
 if(key==='tab')return pageTab(val);
 if(key==='office')return goOffice();
 if(key==='case'){APP.custom='';APP.section='Office';APP.page='Overview';selectMessage(val);return}
 if(key==='casecenter'){goOffice();const next=currentMessages().find(m=>!m.resolved);if(next)selectMessage(next.case);return}
 if(key==='caseprev')return selectAdjacentCase(-1);
 if(key==='casenext')return selectAdjacentCase(1);
 if(key==='nextopen')return selectAdjacentCase(1,true);
 if(key==='dept-meets'){APP.page='Overview';APP.racingMode=APP.racingTrack?'track':'meets';APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='dept-day-card'){APP.page='Overview';APP.racingMode='day';APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='dept-race-calendar'){APP.racingCalendarOpen=!APP.racingCalendarOpen;APP.departmentScrollReset=true;return paint()}
 if(key==='dept-race-game-date'){APP.racingDate=depGameDay();APP.page='Overview';APP.racingMode='day';APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='racing-calendar-day'){if(!/^1999-\d{2}-\d{2}$/.test(val))return;APP.racingDate=val;APP.page='Overview';APP.racingMode='day';APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='racing-calendar-month'){const day=depRaceBrowseDate(),month=Number(day.slice(5,7))+Number(val);if(month<1||month>12)return;APP.racingDate='1999-'+String(month).padStart(2,'0')+'-01';APP.racingCalendarOpen=true;APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='dept-myhorses'){APP.racingMode=APP.racingMode==='mine'?(APP.racingTrack?'track':'meets'):'mine';APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
 if(key==='roster-filter-clear'){
  const scope=btn.closest('.ng-list-filters')?.dataset.filterScope;
  if(scope&&APP.rosterFilters)APP.rosterFilters[scope]=window.WTW1999RosterFilters.initial();
  APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint();
 }
 if(key==='dept-sort'){
  if(APP.departmentSortKey===val)APP.departmentSortDesc=!APP.departmentSortDesc;
  else{APP.departmentSortKey=val;APP.departmentSortDesc=false}
  APP.departmentPageIndex=0;APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint();
 }
 // Previous/Next buttons have been retired from the department rosters.
 if(key==='sale-watch'){
  if(APP.section!=='Sales')return;
  const r=APP.departmentVisible[Number(val)];
  if(!r||r._kind!=='horse'||!r._watchKey)return;
  if(APP.salesWatched[r._watchKey])delete APP.salesWatched[r._watchKey];
  else APP.salesWatched[r._watchKey]={...r,status:r._demo?'DEMO · '+r.status:r.status};
  return paint();
 }
 if(key==='sale-open-watch'){
  const r=APP.departmentVisible[Number(val)];
  if(!r||!r._auctionId)return;
  APP.departmentAuction=r._auctionId;
  return pageTab('Catalogs');
 }
 if(['sale-prev','sale-next','sale-next-up'].includes(key)){
  if(APP.section!=='Sales')return;
  const auctions=depAuctionList(false);
  const selected=auctions.findIndex(a=>a.id===APP.departmentAuction);
  const current=selected>=0?selected:salesUpcomingIndex(auctions);
  const target=key==='sale-next-up'?salesUpcomingIndex(auctions):
   Math.max(0,Math.min(auctions.length-1,current+(key==='sale-prev'?-1:1)));
  if(!auctions[target]||key==='sale-next'&&current>=auctions.length-1||
   key==='sale-prev'&&current<=0)return;
  APP.departmentAuction=auctions[target].id;
  APP.departmentPageIndex=0;APP.departmentSearch='';APP.departmentSortKey='';
  return pageTab('Catalogs');
 }
 if(key==='sale-watchlist')return pageTab('Watchlist');
 if(key==='sale-catalog')return pageTab('Catalogs');
 if(key==='sale-overview')return pageTab('Overview');
 if(key==='sale-calendar')return pageTab('Sale Calendar');
 if(key==='sale-company-list')return pageTab('Sale Companies');
 if(key==='dept-company'){APP.departmentCompany=val;return pageTab('Sale Calendar')}
 if(key==='dept-open'){
  const r=APP.departmentVisible[Number(val)];if(!r)return;
   if(r._kind==='race')return open1999Race(r._raceData||r);
  if(r._mareIndex!=null){
   const full=window.__WTW_1999_UI_DATA__?.breedingMareByModelIndex?.(r._mareIndex);
   if(full)return previewRecordRoute('horse',full._name||full.name,full);
  }
  if(r._directoryIndex!=null){
   const full=window.__WTW_1999_UI_DATA__?.worldHorsePage?.(r._directoryIndex,1)?.items?.[0];
   if(full?._canonId)return openWorld1999Entity('horse:'+full._canonId);
   if(full)return previewRecordRoute('horse',full._name,full);
  }
  if(isClean1999()&&r._kind==='farm'&&r._id&&
   (APP.section==='Facilities'||APP.section==='Breeding'&&APP.page==='Stud Farms'||
    APP.section==='Personnel'&&APP.page==='Owners'))
   return openFounding1999Profile(APP.section==='Facilities'||APP.section==='Breeding'?
    'facility':'ownership',r._id);
  if(isClean1999()&&r._kind==='person'&&r._id)
   return openFounding1999Profile('person',r._id);
  if(r._testGenerated)return previewRecordRoute(r._kind==='person'?'person':
   r._kind==='farm'?'farm':'horse',r._name,r);
  if(r._worldKey)return openWorld1999Entity(r._worldKey);
  if(r._canonId){const match=world1999Entries().find(x=>x.canonicalId===r._canonId);
   if(match&&!window.__wtwOfficeSearchRecords?.().some(x=>x.kind===match.kind&&x.name===match.name))return openWorld1999Entity(match.worldKey);
  }
  if(APP.section==='Sales'&&r._kind==='sale-event'){
   APP.departmentAuction=r._auctionId;return pageTab('Overview');
  }
  if(APP.section==='Sales'&&r._kind==='sale-company'){
   APP.departmentCompany=r._companyId;return pageTab('Sale Calendar');
  }
  // Names open the entity's profile; the active-meet dropdown selects races.
  return openEntityRecord(r._name,r._kind,r);
 }
 if(key==='dept-related'){
  const r=APP.departmentVisible[Number(val)],field=btn.dataset.field;
  if(!r)return;
  if(APP.section==='Sales'&&field==='company'&&r._companyId){APP.departmentCompany=r._companyId;return pageTab('Sale Calendar')}
  if(!Object.prototype.hasOwnProperty.call(DEPT_ENTITY_COLUMNS,field))return;
  return openEntityRecord(r[field],entityKindForField(field,r),field==='race'?{
   _track:r._track||r.track||'',_kind:'race',
   type:'Race',location:r.track||'',date:r.date||'',status:r.status||''
  }:null);
 }
 if(key==='training-set'){
  const id=btn.dataset.horseId||'';
  try{
   const profile=window.__WTW_1999_UI_DATA__?.assignTraining?.(id,val);
   if(!profile)throw Error('Training is not available for this horse');
   APP.trainingNotice='Assigned '+safe(profile.nameAtOpening)+' to '+safe(window.__WTW_1999_UI_DATA__.TRAINING_PLANS[val]?.label||val)+'. Advance the game clock to run work.';
  }catch(error){APP.trainingNotice='TRAINING NOT CHANGED: '+String(error?.message||error)}
  return paint();
 }
 if(key==='stable-world-edit'){APP.section='World';return pageTab('1999 Horses')}
 if(key==='world-edit')return worldEditOpen(val);
 if(key==='world-edit-source'){
  const kind=btn.dataset.kind,name=btn.dataset.name;
  const world=world1999Match(kind,name);
  if(world){openWorld1999Entity(world.worldKey);return worldEditOpen(world.worldKey)}
  return;
 }
 if(key==='world-cancel')return worldEditCancel();
 if(key==='world-save')return worldEditSave();
 if(key==='world-export')return worldExportEdits();
 if(key==='world-import-open')return root.querySelector('#wtwWorldImportInput')?.click();
 if(key==='world-photo-clear'){
  if(!APP.worldEditDraft)return;
  APP.worldPhotoDraft=null;APP.worldEditStatus='Custom image will be removed when you save.';
  return paint();
 }
 if(key==='world-add-field'){
  if(!APP.worldEditDraft)return;
  const name=(root.querySelector('#wtwWorldNewField')?.value||'').trim();
  const value=root.querySelector('#wtwWorldNewValue')?.value||'';
  if(!worldEditValidField(name)){APP.worldEditStatus='Invalid or protected attribute key.';return paint()}
  if(Object.prototype.hasOwnProperty.call(APP.worldEditDraft,name)){
   APP.worldEditStatus='Attribute already exists. Edit it in the list.';return paint()
  }
  APP.worldEditDraft[name]=value;APP.worldEditStatus='Added '+name+' to this draft. Save to keep it.';
  return paint();
 }
 if(key==='world-back')return openMenu('World');
 if(key==='world-view'){
  if(val==='Tracks')return openMenu('Tracks');
  APP.section='World';return pageTab(val);
 }
 if(key==='founding-open'){
  const idx=val.indexOf(':'),kind=val.slice(0,idx),id=val.slice(idx+1);
  if(kind==='horse'){
   if(world1999Entry('horse:'+id))return openWorld1999Entity('horse:'+id);
   if(world1999Entry('historical-horse:'+id))return openWorld1999Entity('historical-horse:'+id);
   return;
  }
  return openFounding1999Profile(kind,id);
 }
 if(key==='world-open')return openWorld1999Entity(val);
 if(key==='1999-stake'){
  const source=window.__WTW_1999_UI_DATA__;
  const name=btn.dataset.name||'',track=btn.dataset.track||'';
  const byId=val?source?.findStake?.(val):null;
  const byName=source?.stakesForTrack?.(track)?.find(r=>r.name===name);
  const fallback=name?{id:val||'',name,trackName:track,localDate:btn.dataset.date||''}:null;
  return open1999Race(byId||byName||fallback);
 }
 if(key==='1999-breeder'){
  const owner=window.__WTW_1999_UI_DATA__?.breederProfile?.(val);
  if(!owner)return;
  const canonical=world1999Entries().find(x=>x.kind==='farm'&&x.canonicalId===val);
  if(canonical)return openWorld1999Entity(canonical.worldKey);
  const loc=owner.location||{};
  return previewRecordRoute('farm',owner.name,{_kind:'farm',_id:owner.id,name:owner.name,
   type:'BREEDING / OWNERSHIP OPERATION',location:[loc.city,loc.state,loc.country].filter(Boolean).join(', '),
   principal:owner.principalOwner||'',status:'1999 TEST WORLD BREEDER',_testGenerated:true});
 }
 if(key==='1999-foaling-farm'){
  const farm=window.__WTW_1999_UI_DATA__?.foalingFarmProfile?.(val);
  if(!farm)return;
  const loc=farm.location||{};
  return previewRecordRoute('farm',farm.name,{_kind:'farm',_id:farm.id,name:farm.name,
   type:'FOALING / BREEDING FARM',location:[loc.city,loc.state,loc.country].filter(Boolean).join(', '),
   capacity:farm.capacity||'',status:'1999 TEST WORLD FACILITY',_testGenerated:true});
 }
 if(key==='named-entity')return openEntityRecord(btn.dataset.name||'',btn.dataset.kind||'',btn.dataset.track?{_track:btn.dataset.track}:null);
 if(key==='directory-sort'){if(APP.directorySort===val)APP.directorySortDesc=!APP.directorySortDesc;else{APP.directorySort=val;APP.directorySortDesc=false}return paint()}
 if(key==='directory-filter'){APP.directoryFilter=val;return paint()}
 if(key==='directory-mode'){APP.directoryMode=val;return paint()}
 if(key==='directory-horse'){
  const record=APP.directoryHorseItems.find(x=>x._directoryId===val)?._directoryRecord;
  if(!record)return;
  if(record._worldKey&&world1999Entry(record._worldKey))return openWorld1999Entity(record._worldKey);
  if(record._canonId&&world1999Entry('horse:'+record._canonId))return openWorld1999Entity('horse:'+record._canonId);
  return previewRecordRoute('horse',record.name,record);
 }
 if(key==='stable-sort'){if(APP.stableSort===val)APP.stableSortDesc=!APP.stableSortDesc;else{APP.stableSort=val;APP.stableSortDesc=false}return paint()}
 if(key==='stable-attribute-sort'){
  if(APP.stableAttributeSort===val)APP.stableAttributeDesc=!APP.stableAttributeDesc;
  else{APP.stableAttributeSort=val;APP.stableAttributeDesc=true}
  // Sorting a visible column must NOT rearrange which attributes are displayed.
  // The selector alone changes the highlighted attribute column.
  return paint();
 }
 if(key==='stable-filter'){APP.stableFilter=val;return paint()}
  if(key==='stable-mode'){APP.stableMode=val;return paint()}
 if(key==='filter'){APP.filter=val;APP.msgPage=0;return paint()}
 if(key==='prev-msg'){APP.msgPage=Math.max(0,APP.msgPage-1);return paint()}
 if(key==='next-msg'){APP.msgPage++;return paint()}
 if(key==='pedigree-ancestor'){
  // Navigate by source H-ID; never trust ancestor name uniqueness.
  if(/^H-[A-Za-z0-9-]+$/.test(val))
   window.location.assign('/archive/?page=horses&horse='+encodeURIComponent(val));
  return;
 }
 if(key==='horse'){
  const row=window.__WTW_1999_UI_DATA__?.stableHorsePreview?.(val);
  if(row?._testGenerated)return previewRecordRoute('horse',val,row);
  if(row?._canonId)return openWorld1999Entity('horse:'+row._canonId);
  return openEntityRecord(val,'horse');
 }
 if(key==='fixture'){const n=$$('.right .fixtureList .fixture[data-track]')[Number(val)];return bridgeNode(n)}
 if(key==='track'){const row=$$('.right .fixture').find(x=>x.dataset.track===val);if(row){const p=$('p',row);return bridgeNode(p)}return bridgeNode(originalAct('World'))}
 if(key==='move'){const n=$$('#moveGrid .moveCard')[Number(val)];bridgeNode(n);return}
 if(key==='profile-from-case'){if(window.__WTW_1999_MANAGEMENT__)return openMenu('Stable');return bridgeNode(originalAct('Horse Profile'))}
 if(key==='intel'){if(window.__WTW_1999_MANAGEMENT__)return openMenu('World');return bridgeNode($('#intelGrid .intelCard')[Number(val)])}
 if(key==='outtab'){APP.outTab=Number(val);return paint()}
 if(key==='network-sort'){APP.networkSort=val;APP.networkPage=0;APP.networkFocus='';return paint()}
 if(key==='network-role'){APP.networkRole=val;APP.networkPage=0;APP.networkFocus='';return paint()}
 if(key==='network-page'){APP.networkPage=Math.max(0,APP.networkPage+Number(val));return paint()}
 if(key==='network-select'){APP.networkFocus=val;return paint()}
 if(key==='detailtab'){APP.detailTab=val;return paint()}
 if(key==='stake-sort'){if(APP.stakeSort===val)APP.stakeSortDesc=!APP.stakeSortDesc;else{APP.stakeSort=val;APP.stakeSortDesc=false}return paint()}
 if(key==='sourcebutton'){const n=$('#routeBody [data-act]')[Number(val)];
  if(n?.classList.contains('stakesRow')){const track=currentRoute()?.title||'';const title=n.querySelector('strong')?.textContent.trim()||n.children[0]?.textContent.trim()||'';const match=window.__WTW_1999_UI_DATA__?.stakesForTrack?.(track)?.find(r=>r.name===title);if(match)return open1999Race(match)}
  return bridgeNode(n)}
 if(key==='action'){
  if(window.__WTW_1999_MANAGEMENT__&&/^(?:Open )?Race Calendar$/.test(val))return openMenu('Racing');
  if(window.__WTW_1999_MANAGEMENT__&&val==='Continue'){
    window.__WTW_1999_MANAGEMENT__.advanceOneDay?.();
    return paint();
  }
  if(window.__WTW_1999_MANAGEMENT__&&['Open file','Open current source'].includes(val))
   return openMenu(window.__WTW_1999_UI_DATA__?.officeDesks?.[APP.activeCase]?.moves?.[0]?.menu||'World');
  const x=originalAct(val); if(x)return bridgeNode(x);if(val==='Open file')return bridgeNode(originalAct('Open file'));return}
 if(key==='custom'){
  if(val==='Opportunities')return bridgeNode(originalAct('Open opportunity board'));
  openCustomView(val);
  if(val==='Search')$('#ngGlobalSearch',root)?.focus();
  return;
 }
 if(key==='back')return window.history.back()
 if(key==='forward')return window.history.forward()
},true);
root.addEventListener('change',event=>{
  const field=event.target;
  if(field.id==='ngNamedSavesImport')return namedSaveImport(field.files?.[0]);
  if(field?.tagName==='SELECT')endNativeSelectInteraction(false);
  if(field.matches('select[data-ng-select^="roster-filter-"]')){
   const k=field.dataset.ngSelect.slice('roster-filter-'.length);
   const scope=field.closest('.ng-list-filters')?.dataset.filterScope;
   if(scope){window.WTW1999RosterFilters.get(APP,scope)[k]=field.value;
    APP.departmentScrollLimit=160;APP.departmentScrollReset=true;}
   return paint();
  }
  if(field.matches('select[data-ng-select="world-attribute"]')){
   APP.worldAttributeKey=field.value;
   APP.departmentSortKey=field.value?'attr:'+field.value:'name';
   APP.departmentSortDesc=Boolean(field.value);
   APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
   return paint();
  }
  if(field.matches('select[data-ng-select="stable-attribute"]')){
   APP.stableAttributeKey=field.value;APP.stableAttributeSort=field.value;
   APP.stableAttributeDesc=true;return paint();
  }
  if(field.matches('input[data-ng-input="racing-track-find"]')){
   const query=field.value.trim().toLocaleLowerCase('en-US');
   const all=depTrackCalendar();
   const exact=all.find(t=>t.name.toLocaleLowerCase('en-US')===query);
   const partial=query?all.filter(t=>t.name.toLocaleLowerCase('en-US').includes(query)):[];
   const picked=!query?'':exact?.name||(partial.length===1?partial[0].name:null);
   if(picked===null){field.setCustomValidity('Choose one racecourse from the suggestions.');field.reportValidity();return;}
   field.setCustomValidity('');
   APP.racingTrack=picked;
   if(APP.racingMode!=='day'&&APP.page!=='Calendar'&&APP.page!=='Race Planning')
    APP.racingMode=picked?'track':'meets';
   APP.departmentSortKey='';APP.departmentPageIndex=0;APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
   return paint();
  }
  if(field.matches('select[data-ng-select="department-track"]')){
   APP.racingTrack=field.value;
   if(APP.racingMode!=='day'&&APP.page!=='Calendar'&&APP.page!=='Race Planning')APP.racingMode=field.value?'track':'meets';
   APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
   return paint();
  }
  if(field.matches('input[data-ng-input="department-race-date"]')){
   const date=field.value;
   if(!/^1999-\d{2}-\d{2}$/.test(date)||!liveStableDate(date))return;
   APP.racingDate=date;APP.page='Overview';APP.racingMode='day';
   APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
   return paint();
  }
  if(field.matches('select[data-ng-select="department-sales-company"]')){APP.departmentCompany=field.value;APP.departmentPageIndex=0;APP.departmentSortKey='';APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
  if(field.matches('select[data-ng-select="department-auction"]')){APP.departmentAuction=field.value;APP.departmentPageIndex=0;APP.departmentScrollLimit=160;APP.departmentScrollReset=true;return paint()}
  if(field.matches('select[data-ng-select="department-tab"]'))return pageTab(field.value);
  if(field.matches('select[data-ng-select="manager-screen"]')&&field.value){
  pageTab(field.value);
  return;
 }
 if(field.matches('select[data-ng-select="profile-record"]')&&field.value){
   APP.detailTab=field.value;
   paint();
  }
});
root.addEventListener('input',event=>{
 if(event.target?.id==='ngNamedSaveName')APP.saveDraftName=event.target.value;
});
root.addEventListener('keydown',event=>{
 if(APP.savePanelOpen&&event.key==='Escape'){event.preventDefault();APP.savePanelOpen=false;return paint()}
 if(APP.savePanelOpen&&event.key==='Enter'&&event.target?.id==='ngNamedSaveName'){event.preventDefault();return namedSaveCreate()}
 if(event.key==='Escape'&&event.target===activeNativeSelect){
  setTimeout(()=>{if(activeNativeSelect===event.target)endNativeSelectInteraction(true)},0);
 }
 if(event.key==='Enter'&&event.target.matches('#ngGlobalSearch')){
  const first=$('.ng-search-row',root);
  if(first){event.preventDefault();first.click();}
 }
});
window.addEventListener('keydown',event=>{
 if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){
  event.preventDefault();openCustomView('Search');
  requestAnimationFrame(()=>$('#ngGlobalSearch',root)?.focus());
 }else if(event.key==='/'&&!/^(INPUT|TEXTAREA|SELECT)$/.test(event.target?.tagName||'')&&!event.ctrlKey&&!event.altKey&&!event.metaKey){
  event.preventDefault();openCustomView('Search');
  requestAnimationFrame(()=>$('#ngGlobalSearch',root)?.focus());
 }
});
root.addEventListener('scroll',event=>{
 const scroller=event.target;
 if(!scroller?.matches?.('.ng-dept-roster .ng-rs-scroll'))return;
 if(scroller.scrollTop+scroller.clientHeight<scroller.scrollHeight-240)return;
 const total=Number($('.ng-dpt-records',root)?.textContent.match(/^(\d+)/)?.[1]||0);
 if(total&&APP.departmentScrollLimit<total){APP.departmentScrollLimit=Math.min(total,APP.departmentScrollLimit+160);schedulePaint(0)}
},true);
root.addEventListener('input',event=>{
 const input=event.target;
 if(input.matches('input[data-ng-input="directory-search"]')){
  APP.directorySearch=input.value;const cursor=input.selectionStart;
  paint();const found=root.querySelector('input[data-ng-input="directory-search"]');
  if(found){found.focus();found.setSelectionRange(cursor,cursor)}return;
 }
 if(input.matches('input[data-ng-input^="roster-filter-"]')){
  const k=input.dataset.ngInput.slice('roster-filter-'.length);
  const scope=input.closest('.ng-list-filters')?.dataset.filterScope;
  if(scope){window.WTW1999RosterFilters.get(APP,scope)[k]=input.value;
   APP.departmentScrollLimit=160;APP.departmentScrollReset=true;}
  const caret=input.selectionStart;
  paint();
  const field=[...root.querySelectorAll('input[data-ng-input^="roster-filter-"]')]
    .find(x=>x.dataset.ngInput===input.dataset.ngInput&&x.closest('.ng-list-filters')?.dataset.filterScope===scope);
  if(field){field.focus();if(field.type==='search')field.setSelectionRange(caret,caret);}
  return;
 }
 if(input.matches('input[data-ng-input="global-search"]')){
  APP.searchQuery=input.value;APP.searchPage=0;
  updateSearchRoster();
  return;
 }
 if(input.matches('input[data-ng-input="department-search"]')){
  APP.departmentSearch=input.value;APP.departmentPageIndex=0;APP.departmentScrollLimit=160;APP.departmentScrollReset=true;
  const caret=input.selectionStart;
  paint();const el=$('#ngDepartmentSearch',root);if(el){el.focus();el.setSelectionRange(caret,caret)}
  return;
 }
 if(!input.matches('input[data-ng-input="stable-search"]'))return;
 APP.stableSearch=input.value;
 const query=APP.stableSearch.trim().toLowerCase();
 let visible=0;
 $$('.ng-wtw-roster-row',root).forEach(row=>{
  const match=(row.getAttribute('data-search')||'').toLowerCase().includes(query);
  row.hidden=!match;
  if(match)visible++;
 });
 const counter=$('.ng-stable-visible',root);
 if(counter)counter.textContent=visible+' OF '+horseRows().length+' HORSES';
},true);
function restoreNextUIRoute(){
 const p=new URLSearchParams(location.search),view=p.has('page')?'':p.get('ui')||'';
 APP.custom=view;APP.moreOpen=false;
 if(view){
  if(view.startsWith('WorldRecord:')){APP.section='World';APP.page='Overview';return}
  if(view.startsWith('FoundingProfile:')){
   const kind=view.split(':')[1];
   APP.section=kind==='facility'?'Facilities':'Personnel';
   APP.page=kind==='ownership'?'Owners':kind==='facility'?'Overview':'Principals';
   return;
  }
  if(view.startsWith('Preview:')){
   const parts=view.split(':');
   APP.previewEntity={kind:decodeURIComponent(parts[1]||'record'),name:decodeURIComponent(parts.slice(2).join(':')),row:null};
  }else APP.previewEntity=null;
  const [section,detail]=view.split(' — ');
  APP.section=tabmap[section]?section:'Office';
  APP.page=detail||'Overview';
 }else if(!p.has('page')){
  APP.section='Office';APP.page='Office';
 }else{
  const mapped={horse:'Stable',person:'World',farm:'Facilities',track:'World',race:'Racing',
   stable:'Stable',world:'World',sales:'Sales',calendar:'Racing',news:'Office'};
  APP.section=mapped[p.get('page')]||'Office';APP.page='Overview';
 }
}
// Keep editors mounted while typing. Only the Save action writes to storage.
root.addEventListener('input',event=>{
 const node=event.target.closest('[data-world-field]');
 if(!node||!APP.worldEditDraft)return;
 const field=node.dataset.worldField;
 if(!worldEditValidField(field))return;
 let value=node.value;
 const original=APP.worldEditDraft[field];
 if(typeof original==='number'){
  const number=Number(value);
  value=value!==''&&Number.isFinite(number)?number:value;
 }else if(typeof original==='boolean')value=value==='true';
 APP.worldEditDraft[field]=value;APP.worldEditStatus='Unsaved changes';
});
root.addEventListener('change',async event=>{
 const node=event.target;
 if(node.id==='wtwWorldImageInput'&&APP.worldEditKey){
  try{
   APP.worldPhotoDraft=await worldImageFile(node.files?.[0]);
   APP.worldEditStatus='Image loaded. Save changes to keep it.';paint();
  }catch(err){APP.worldEditStatus=err?.message||'Image not accepted';paint()}
  return;
 }
 if(node.id==='wtwWorldImportInput')return worldImportEdits(node.files?.[0]);
 if(node.matches('[data-world-field]')&&WORLD_LINK_FIELDS[node.dataset.worldField]&&APP.worldEditDraft){
  const field=node.dataset.worldField,kind=WORLD_LINK_FIELDS[field];
  const id=node.value,group={horse:'horses',person:'people',farm:'organizations',track:'tracks'}[kind];
  const linked=(world1999Data?.[group]||[]).find(x=>x.id===id);
  const nameKey=field.slice(0,-2);
  if(nameKey in APP.worldEditDraft){
   APP.worldEditDraft[nameKey]=linked?.name||'';
   const el=[...root.querySelectorAll('[data-world-field]')].find(x=>x.dataset.worldField===nameKey);
   if(el)el.value=APP.worldEditDraft[nameKey];
  }
 }
});

window.addEventListener('popstate',()=>{
 restoreNextUIRoute();
 schedulePaint(40);
});
// Avoid recursive mutation observations: only observe the original (hidden) app.
const adapter=$('.app');if(adapter){const mo=new MutationObserver(()=>schedulePaint(30));mo.observe(adapter,{subtree:true,characterData:true,childList:true,attributes:true,attributeFilter:['class','title']})}
const route=$('#routeShell');if(route){const mo=new MutationObserver(()=>schedulePaint(30));mo.observe(route,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']})}
root.addEventListener('error',event=>{
 const img=event.target;if(img?.tagName!=='IMG')return;
 if(img.classList.contains('ng-org-image')){
  const mark=img.closest('.ng-org-mark');
  if(mark){
   img.remove();
   const label=document.createElement('span');
   label.className='ng-org-initials';
   label.setAttribute('aria-hidden','true');
   label.textContent=mark.getAttribute('data-placeholder')||'ORG';
   mark.append(label);
  }
  return;
 }
 if(img.classList.contains('ng-decision-photograph')){
   if(img.getAttribute('src')!==genericDeskPhoto){
     img.src=genericDeskPhoto;
     const frame=img.closest('.ng-decision-photo');
     frame?.querySelector('.ng-decision-scene-caption small')?.replaceChildren(document.createTextNode('EDITORIAL REFERENCE PHOTO'));
     frame?.setAttribute('aria-label','Generic editorial photograph of a horse at a stable');
   }else img.closest('.ng-decision-photo')?.classList.add('ng-photo-unavailable');
   return;
 }
 if(!String(img.getAttribute('src')||'').includes('wtw_badge_'))return;
 img.closest('.ng-badge-slot,.ng-route-badge-slot,.ng-profile-badgeframe')?.classList.add('wtw-badge-missing');
 console.warn('WTW approved badge failed to load:',img.getAttribute('src'));
},true);
// One initial paint after core UI indexes arrive. Previously we painted twice
// and repainted once per fetch, visibly swapping the track logo after refresh.
root.innerHTML='<div class="ng-boot-shell" role="status" aria-live="polite"><strong>WIRE TO WIRE</strong><span>Preparing Racing Office…</span></div>';
document.body.append(root);document.body.classList.add('wtw-next-active');
restoreNextUIRoute();
// Cache-busted once per build: no stale JSON and no forced full reloads of
// unversioned indexes on every refresh.
const bootVersion='20261111-track-identity-boot-2';
const bootJson=path=>fetch(path+'?v='+bootVersion,{credentials:'same-origin',cache:'default'})
 .then(r=>r.ok?r.json():Promise.reject(Error('UI asset index unavailable')));
const bootJobs=[
 loadWorld1999(),
 bootJson(isClean1999()?'/assets/office/founding-organization-logo-index.json?rev=founder-logos-release-v2-20261113':'/assets/office/organization-logo-index.json')
  .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){organizationLogoIndex=index;if(APP.ready)schedulePaint(20)}})
  .catch(()=>{/* Neutral organization mark is the fallback. */}),
 bootJson('/assets/game/attribute-catalog.v1.json')
  .then(data=>{if(data?.schema==='WTW_ATTRIBUTE_CATALOG_V1'&&data.horse_categories&&data.display?.horse_overview){athleteAttributeCatalog=data;if(APP.ready)schedulePaint(20)}})
  .catch(()=>{/* Display verified source attributes only. */}),
 bootJson('/assets/office/decision-photo-index.json')
  .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){officePhotoIndex=index;if(APP.ready)schedulePaint(20)}})
  .catch(()=>{/* Generic desk photo is the fallback. */})
];
let bootFinished=false;
const finishBoot=()=>{if(bootFinished)return;bootFinished=true;APP.ready=true;paint()};
Promise.allSettled(bootJobs).then(finishBoot);
// Fail open after a stalled network request, not indefinitely blank.
setTimeout(finishBoot,2500);

window.__WTW_NEXT__={paint,app:APP,horseRows,racingRows,currentMessages,state};
})();
