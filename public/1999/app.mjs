import {createClean1999Clock,advance1999Clock,reset1999Clock,validate1999Clock,WTW_TEST_SAVE_NAMESPACE} from './test-clock.mjs';
const $=id=>document.getElementById(id);
const escape=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const tabs={
 horses:['Stable & horses','Source horse identities, owners, trainers and physical barns.','/api/1999/horses','page'],
 organizations:['Owners & farms','Verified opening organizations and recorded history.','/api/1999/organizations','page'],
 people:['Horsemen','People with physical hometowns and operating bases.','/api/1999/people','page'],
 tracks:['Tracks & meets','Source registered venues and geography.','/api/1999/tracks','page'],
 calendar:['Stakes calendar','1999 stakes; no future result has been generated.','/api/1999/calendar','dates'],
 stallions:['Stallions & breeding','Active source stud horses and actual standing farms.','/api/1999/stallions','studs'],
 'broodmare-boarding':['Broodmare boarding','Physical boarding locations, not assumed pregnancies.','/api/1999/broodmare-boarding','page'],
 events:['Opening events','Queued January events; source does not imply execution.','/api/1999/events','dates']
};
let clock;
try{const saved=JSON.parse(localStorage.getItem(WTW_TEST_SAVE_NAMESPACE)||'null');clock=saved?validate1999Clock(saved):createClean1999Clock();}catch{clock=createClean1999Clock();}
let tab='horses',offset=0,term='',sequence=0;
const dateText=date=>new Date(date+'T12:00:00Z').toLocaleDateString('en-US',{timeZone:'UTC',weekday:'long',year:'numeric',month:'long',day:'numeric'});
function drawClock(){$('gameDate').textContent=dateText(clock.currentDate);$('gameDay').textContent='DAY '+clock.day;$('runMode').textContent='SEED '+clock.seed+' · TEST ONLY';}
function saveClock(){localStorage.setItem(WTW_TEST_SAVE_NAMESPACE,JSON.stringify(validate1999Clock(clock)));drawClock();}
function step(days){clock=advance1999Clock(clock,days);saveClock();offset=0;load();}
$('oneDay').addEventListener('click',()=>step(1));
$('oneWeek').addEventListener('click',()=>step(7));
$('oneMonth').addEventListener('click',()=>step(30));
$('reset').addEventListener('click',()=>{
 if(!confirm('Reset only this 1999 test world to January 1? Your existing Office saves and canonical history remain untouched.'))return;
 clock=reset1999Clock(clock);offset=0;saveClock();load();
});
drawClock();
for(const b of document.querySelectorAll('#tabs button'))b.addEventListener('click',()=>select(b.dataset.tab));
$('search').addEventListener('change',()=>{term=$('search').value.trim().toLowerCase();offset=0;load();});
$('refresh').addEventListener('click',()=>load());
$('prevPage').addEventListener('click',()=>{offset=Math.max(0,offset-15);load();});
$('nextPage').addEventListener('click',()=>{offset+=15;load();});
function select(next){
 if(!tabs[next])return;tab=next;offset=0;term='';$('search').value='';
 for(const b of document.querySelectorAll('#tabs button'))b.classList.toggle('selected',b.dataset.tab===next);
 $('sectionTitle').textContent=tabs[next][0];$('sectionDescription').textContent=tabs[next][1];load();
}
async function json(path){const res=await fetch(path,{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}});if(!res.ok)throw Error('1999 source endpoint returned '+res.status+'. No substitute records were invented.');return res.json();}
function metric(n,label){return '<div class="metric"><strong>'+escape(Number(n||0).toLocaleString('en-US'))+'</strong><span>'+escape(label)+'</span></div>';}
async function overview(){
 try{const a=await json('/api/1999/overview');if(a.asOf!=='1999-01-01')throw Error('Unexpected world date');
 const c=a.counts||{};$('metrics').innerHTML=metric(c.featuredOpeningHorses,'Opening source horses')+metric(c.foundationOrganizations,'Owners & organizations')+metric(c.knownTracks,'Registered tracks')+metric(c.active1999StallionsDistinct,'Source-active stallions');
 }catch(e){$('metrics').textContent=e.message;}
}
function render(x){
 let title='',sub='',middle='',right='';
 if(tab==='horses'){title=x.name;sub=x.id+' · '+x.ageAtOpening+'YO · '+x.sex;middle=x.openingStable?.name||x.openingStable?.locality||'';right=x.ownerId;}
 if(tab==='organizations'){title=x.name;sub=x.id+' · '+x.type;middle=x.locationLabel;right=x.publicationTier==='APPROVED_EXISTING_ORIGIN'?'Approved legacy':'Source record';}
 if(tab==='people'){title=x.name;sub=x.id+' · '+x.role;middle=[x.base?.locality,x.base?.region].filter(Boolean).join(', ');right=x.status;}
 if(tab==='tracks'){title=x.name;sub=x.id;middle=[x.locality,x.region].filter(Boolean).join(', ');right=x.country;}
 if(tab==='calendar'){title=x.name;sub=x.id+' · '+x.localDate;middle=x.trackName;right=x.ageSex+' · '+x.surface;}
 if(tab==='stallions'){title=x.name;sub=x.id+' · stud '+x.firstBreedingSeason;middle=x.standingFarm1999?.farmName;right=x.standingFarm1999?.region;}
 if(tab==='broodmare-boarding'){title=x.name;sub=x.id;middle=x.boardingFarm1999?.farmName;right=x.boardingFarm1999?.region;}
 if(tab==='events'){title=x.type;sub=x.id+' · '+x.scheduledLocalDateTime;middle=x.circuit;right='Not executed';}
 return '<article class="record"><div><strong>'+escape(title)+'</strong><small>'+escape(sub)+'</small></div><div class="second">'+escape(middle)+'</div><div class="third">'+escape(right)+'</div></article>';
}
async function load(){
 const token=++sequence,kind=tabs[tab][3],path=tabs[tab][2];$('status').textContent='Loading source records…';$('records').innerHTML='';
 try{
  let items=[],total=0;
  if(kind==='studs'){const data=await json(path);const filtered=(data.active||[]).filter(x=>!term||x.name.toLowerCase().includes(term)||x.id.toLowerCase().includes(term));total=filtered.length;items=filtered.slice(offset,offset+15);}
  else if(kind==='dates'){
   const data=await json(path+'?limit=100');
   const filtered=(data.items||[]).filter(x=>{
    const date=String(tab==='calendar'?x.localDate:x.scheduledLocalDateTime).slice(0,10);
    return date>=clock.currentDate&&(!term||JSON.stringify([x.name,x.id,x.type,x.trackName]).toLowerCase().includes(term));
   }).sort((a,b)=>String(a.localDate||a.scheduledLocalDateTime).localeCompare(String(b.localDate||b.scheduledLocalDateTime)));
   total=filtered.length;items=filtered.slice(offset,offset+15);
  }else{
   const p=new URLSearchParams({offset:String(offset),limit:'15'});if(term)p.set('q',term);
   const data=await json(path+'?'+p.toString());items=data.items||[];total=data.total||0;
  }
  if(token!==sequence)return;
  $('records').innerHTML=items.length?items.map(render).join(''):'<article class="record">No matching records from this game date.</article>';
  $('pageInfo').textContent=total?(offset+1)+'–'+Math.min(offset+items.length,total)+' of '+Number(total).toLocaleString('en-US'):'0 records';
  $('prevPage').disabled=offset===0;$('nextPage').disabled=offset+15>=total;$('status').textContent='';
 }catch(e){if(token!==sequence)return;$('status').textContent=e.message;$('pageInfo').textContent='Unavailable';$('prevPage').disabled=true;$('nextPage').disabled=true;}
}
overview();load();