import {readLocal1999World} from './engine/local-api.mjs';
import {createClean1999Clock,advance1999Clock,reset1999Clock,validate1999Clock,WTW_TEST_SAVE_NAMESPACE} from './test-clock.mjs';
const $=id=>document.getElementById(id),SAVE_MODE_KEY='wtw:1999:test-universe-mode:v1';
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const defs={
 'full-horses':['All 87,500 horses','Entire immutable-ID test population with recorded or generated opening attributes.','/api/1999/sim/horses','sim'],
 'owner-economy':['Owner economy','Large breeding corporations, regional operations and one-to-three horse owners.','/api/1999/sim/owners','sim'],
 'trainer-barns':['Trainer barns','Complete trainer strings, salaries, reputations and physical stall capacity.','/api/1999/sim/trainers','sim'],
 facilities:['Facilities','Barns, stud farms and training facilities with location and operating costs.','/api/1999/sim/facilities','sim'],
 auctions:['Sales & auctions','Thirty-six fictional 1999 auction events with locations, catalog sizes and fees.','/api/1999/sim/auctions','sim'],
 conditions:['Race condition books','Race-by-race conditions at active 1999 meets; no result is preloaded.','/api/1999/sim/conditions','condition'],
 horses:['Canonical horses','Protected named 1999 horses and immutable historical associations.','/api/1999/horses','source'],
 organizations:['Owners & farms','Source-verified pre-1999 organizations and measured career connections.','/api/1999/organizations','source'],
 people:['Horsemen','Existing trainer, jockey and historical participant identities.','/api/1999/people','source'],
 tracks:['Tracks & meets','Historical racing venues with geographic source authorities.','/api/1999/tracks','source'],
 calendar:['Stakes calendar','Source-grounded 1999 stakes options; outcomes are not predetermined.','/api/1999/calendar','date'],
 stallions:['Stallions & breeding','Source-active stallions with locked January 1999 farms.','/api/1999/stallions','studs'],
 'broodmare-boarding':['Broodmare boarding','January 1999 mare farm records, not projected pregnancies.','/api/1999/broodmare-boarding','source'],
 events:['Opening events','Source-authored queue, none marked as executed by this test view.','/api/1999/events','date']
};
let clock;try{const p=JSON.parse(localStorage.getItem(WTW_TEST_SAVE_NAMESPACE)||'null');clock=p?validate1999Clock(p):createClean1999Clock();}catch{clock=createClean1999Clock();}
let mode=localStorage.getItem(SAVE_MODE_KEY)==='FULLY_FICTIONAL_TEST'?'FULLY_FICTIONAL_TEST':'CANON_ANCHORED_TEST';
let tab='full-horses',offset=0,term='',token=0,trackIndex=0,tracksLoaded=false;
const fmtDate=d=>new Date(d+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',year:'numeric',month:'long',day:'numeric'});
const modelArgs=()=>new URLSearchParams({seed:String(clock.seed),mode});
function drawClock(){
 $('gameDate').textContent=fmtDate(clock.currentDate);$('gameDay').textContent='DAY '+clock.day;
 $('runMode').textContent=(mode==='FULLY_FICTIONAL_TEST'?'FULLY FICTIONAL':'CANON ANCHORED')+' · SEED '+clock.seed;
}
function persist(){localStorage.setItem(WTW_TEST_SAVE_NAMESPACE,JSON.stringify(validate1999Clock(clock)));localStorage.setItem(SAVE_MODE_KEY,mode);drawClock();}
function restart(newMode,newSeed){
 mode=newMode;clock=createClean1999Clock(newSeed);offset=0;tracksLoaded=false;trackIndex=0;term='';$('search').value='';
 persist();select('full-horses');overview();
}
$('oneDay').addEventListener('click',()=>advance(1));
$('oneWeek').addEventListener('click',()=>advance(7));
$('oneMonth').addEventListener('click',()=>advance(30));
$('reset').addEventListener('click',()=>{if(confirm('Reset this 1999 test save to January 1? The historic canon and older Office saves are untouched.')){clock=reset1999Clock(clock);persist();offset=0;load();}});
$('fictional').addEventListener('click',()=>{if(confirm('Create a new, entirely fictional 1999 testing universe? It will preserve the historical canon in its separate authority.'))restart('FULLY_FICTIONAL_TEST',clock.seed+1);});
$('canonWorld').addEventListener('click',()=>{if(confirm('Return to the January 1, 1999 canon-anchored test universe?'))restart('CANON_ANCHORED_TEST',19990101);});
function advance(days){clock=advance1999Clock(clock,days);persist();offset=0;load();}
drawClock();
for(const b of document.querySelectorAll('#tabs button'))b.addEventListener('click',()=>select(b.dataset.tab));
$('search').addEventListener('change',()=>{term=$('search').value.trim().toLowerCase();offset=0;load();});
$('refresh').addEventListener('click',()=>load());
$('prevPage').addEventListener('click',()=>{offset=Math.max(0,offset-15);load();});
$('nextPage').addEventListener('click',()=>{offset+=15;load();});
$('trackPicker').addEventListener('change',()=>{trackIndex=Number($('trackPicker').value)||0;load();});
function select(next){
 if(!defs[next])return;
 if(mode==='FULLY_FICTIONAL_TEST'&&['horses','organizations','people','calendar','stallions','broodmare-boarding','events'].includes(next))next='full-horses';
 tab=next;offset=0;term='';$('search').value='';
 for(const b of document.querySelectorAll('#tabs button')){
  b.classList.toggle('selected',b.dataset.tab===next);
  b.hidden=mode==='FULLY_FICTIONAL_TEST'&&['horses','organizations','people','calendar','stallions','broodmare-boarding','events'].includes(b.dataset.tab);
 }
 $('sectionTitle').textContent=defs[next][0];$('sectionDescription').textContent=defs[next][1];
 const condition=next==='conditions';$('trackPicker').hidden=!condition;$('trackPickerLabel').hidden=!condition;
 $('sectionKicker').textContent=condition?'1999 RACING CONDITIONS':'OPENING UNIVERSE';
 $('mode').textContent=mode==='FULLY_FICTIONAL_TEST'?'FICTIONAL SEED':'CANON LOCKED + TEST';
 load();
}
async function json(path){return readLocal1999World(path);}
function metric(n,label){return '<div class="metric"><strong>'+esc(Number(n||0).toLocaleString('en-US'))+'</strong><span>'+esc(label)+'</span></div>';}
async function overview(){
 try{const data=await json('/api/1999/sim/overview?'+modelArgs().toString());if(data.asOf!=='1999-01-01')throw Error('World has wrong date');
 const c=data.counts||{};
 $('metrics').innerHTML=metric(c.horses,'Horses in test world')+metric(c.owners,'Ownership groups')+metric(c.trainers,'Trainer strings')+metric(c.tracks,'Racing tracks')+metric(c.facilities,'Physical facilities')+metric(c.auctions,'1999 sales events');
 }catch(e){$('metrics').textContent=e.message;}
}
function row(x){
 let title='',sub='',where='',right='';
 if(tab==='full-horses'||tab==='horses'){title=x.name;sub=x.id+' · '+(x.ageAtOpening??'?')+'YO · '+x.sex;where=x.location?.city||x.openingStable?.name||'';right=(x.ownerId||'')+' · '+(x.trainerId||'');}
 else if(tab==='owner-economy'){title=x.name;sub=x.id+' · '+x.portfolio.tier;where=[x.location.city,x.location.state].filter(Boolean).join(', ');right=x.portfolio.generatedHorseSlots+' horses · $'+Number(x.finances.cash).toLocaleString('en-US');}
 else if(tab==='trainer-barns'){title=x.name;sub=x.id+' · '+x.barnId;where=[x.location.city,x.location.state].filter(Boolean).join(', ');right=x.generatedRunners+'/'+x.barnCapacity+' stalls';}
 else if(tab==='facilities'){title=x.name;sub=x.id+' · '+x.type;where=[x.location.city,x.location.state].filter(Boolean).join(', ');right=x.occupied+'/'+x.capacity+' places';}
 else if(tab==='auctions'){title=x.name;sub=x.id+' · '+x.date;where=[x.location.city,x.location.state].filter(Boolean).join(', ');right=x.catalogLots+' catalog lots';}
 else if(tab==='conditions'){title=x.conditions;sub=x.id+' · R'+x.number+' · '+x.date;where=x.distanceFurlongs+'f · '+x.surface+' · '+x.ageRequirement;right='$'+x.purse.toLocaleString('en-US');}
 else if(tab==='organizations'){title=x.name;sub=x.id+' · '+x.type;where=x.locationLabel;right=x.publicationTier==='APPROVED_EXISTING_ORIGIN'?'Approved legacy':'Source evidence';}
 else if(tab==='people'){title=x.name;sub=x.id+' · '+x.role;where=[x.base?.locality,x.base?.region].filter(Boolean).join(', ');right=x.status;}
 else if(tab==='tracks'){title=x.name;sub=x.id;where=[x.locality,x.region].filter(Boolean).join(', ');right=x.country;}
 else if(tab==='calendar'){title=x.name;sub=x.id+' · '+x.localDate;where=x.trackName;right=x.surface+' · '+x.ageSex;}
 else if(tab==='stallions'){title=x.name;sub=x.id+' · stud '+x.firstBreedingSeason;where=x.standingFarm1999?.farmName;right=x.standingFarm1999?.region;}
 else if(tab==='broodmare-boarding'){title=x.name;sub=x.id;where=x.boardingFarm1999?.farmName;right=x.boardingFarm1999?.region;}
 else if(tab==='events'){title=x.type;sub=x.id+' · '+x.scheduledLocalDateTime;where=x.circuit;right='Not executed';}
 return '<article class="record"><div><strong>'+esc(title)+'</strong><small>'+esc(sub)+'</small></div><div class="second">'+esc(where)+'</div><div class="third">'+esc(right)+'</div></article>';
}
async function populateTracks(){
 if(tracksLoaded)return;
 const args=modelArgs(),a=await json('/api/1999/sim/tracks?'+args+'&limit=100'),b=await json('/api/1999/sim/tracks?'+args+'&limit=100&offset=100');
 const all=[...(a.items||[]),...(b.items||[])];$('trackPicker').innerHTML=all.map((t,i)=>'<option value="'+i+'">'+esc(t.name)+' · '+esc(t.location.state)+'</option>').join('');
 const now=clock.currentDate;let defaultIndex=0;
 for(let i=0;i<all.length;i++){
  const id=all[i].name.toLowerCase();
  if(now.slice(5,7)==='01'&&/tampa bay|gulfstream|santa anita|fair grounds|delta downs/.test(id)){defaultIndex=i;break;}
 }
 trackIndex=defaultIndex;$('trackPicker').value=String(trackIndex);tracksLoaded=true;
}
async function load(){
 const request=++token,def=defs[tab],type=def[3],args=modelArgs();
 $('records').innerHTML='';$('status').textContent='Loading '+def[0]+'…';
 try{
  let items=[],total=0;
  if(type==='condition'){
   await populateTracks();
   const data=await json(def[2]+'?'+args+'&trackIndex='+trackIndex+'&date='+encodeURIComponent(clock.currentDate));
   items=data.races||[];total=items.length;
  }else if(type==='studs'){
   const data=await json(def[2]);const r=(data.active||[]).filter(x=>!term||x.name.toLowerCase().includes(term));
   items=r.slice(offset,offset+15);total=r.length;
  }else if(type==='date'){
   const data=await json(def[2]+'?limit=100');
   const filtered=(data.items||[]).filter(x=>String(x.localDate||x.scheduledLocalDateTime).slice(0,10)>=clock.currentDate)
    .filter(x=>!term||JSON.stringify([x.name,x.id,x.type,x.trackName]).toLowerCase().includes(term))
    .sort((a,b)=>String(a.localDate||a.scheduledLocalDateTime).localeCompare(String(b.localDate||b.scheduledLocalDateTime)));
   total=filtered.length;items=filtered.slice(offset,offset+15);
  }else{
   const url=new URLSearchParams({offset:String(offset),limit:'15'});
   if(type==='sim'){url.set('seed',String(clock.seed));url.set('mode',mode);}
   else if(term)url.set('q',term);
   const data=await json(def[2]+'?'+url.toString());
   items=data.items||[];total=data.total||0;
   if(type==='sim'&&term)items=items.filter(x=>JSON.stringify([x.name,x.id]).toLowerCase().includes(term));
  }
  if(request!==token)return;
  $('records').innerHTML=items.length?items.map(row).join(''):'<article class="record">No records on this date or at this track.</article>';
  $('pageInfo').textContent=total?(offset+1)+'–'+Math.min(offset+items.length,total)+' of '+Number(total).toLocaleString('en-US'):'0 records';
  $('prevPage').disabled=offset===0||type==='condition';$('nextPage').disabled=offset+15>=total||type==='condition';$('status').textContent='Population loaded in this browser · Jan 1, 1999 source canon stays read-only.';
 }catch(e){if(request!==token)return;$('status').textContent=e.message;$('pageInfo').textContent='Unavailable';$('prevPage').disabled=true;$('nextPage').disabled=true;}
}
select('full-horses');overview();