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
const APP={section:'Office',page:'Office',custom:'',filter:'All',msgPage:0,focus:'',outTab:0,detailTab:'Overview',routeId:'',ready:false,activeCase:'powerline',paintQueued:false,moreOpen:false,stableSort:'name',stableSortDesc:false,stableFilter:'all',stableSearch:'',networkSort:'best',networkRole:'all',networkPage:0,networkFocus:'',searchQuery:'',searchIndex:[],searchType:'all',searchSort:'name',searchPage:0};
let officePhotoIndex=null; // Optional UI-only media references; no duplication of historical/game entities.
let athleteAttributeCatalog=null; // One versioned shared character-definition file; no new horse ratings.

let personGeographyProjection=null; // Source-linked read-only UI projection of approved Participant_Geography.
let personGeographyLoading=false;
function loadPersonGeography(){
 if(personGeographyProjection||personGeographyLoading)return;
 personGeographyLoading=true;
 fetch('/data/person-geography-ui-v33.json',{credentials:'same-origin',cache:'force-cache'})
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
 if(id)return personGeographyProjection.people.find(x=>x.id===id&&x.name===name)||null;
 // Temporary legacy Office bridge; ambiguous names are never joined.
 const matches=personGeographyProjection.people.filter(x=>x.name===name);
 return matches.length===1?matches[0]:null;
}

const genericDeskPhoto='/assets/office/approved-office-photo.jpg';
let organizationLogoIndex=null; // UI-only logo asset refs; organization authority stays in the game database.

const tabmap={Office:['Overview','Messages','Decisions','Calendar','News','Reports','Career'],History:['Race Results','Horses','People & Farms','Facilities & Tracks','Historical Calendar','Coverage'],Stable:['Overview','Horses','Training','Health','Race Plans','Barns'],Racing:['Overview','Calendar','Entries','Results','Stakes','Race Planning'],Breeding:['Overview','Stallions','Broodmares','Foals','Pedigrees','Stud Farms'],Sales:['Overview','Auctions','Catalogs','Watchlist','Private Offers'],Personnel:['Overview','Trainers','Jockeys','Owners','Staff'],Facilities:['Overview','Barns','Training Centers','Farms'],Finances:['Overview','Cash Flow','Operating Costs','Budgets'],World:['Overview','Tracks','Meets','Major Races','News']};
const actions={Office:'Office Overview',Stable:'Stable',Racing:'Race Calendar',Sales:'Sales',World:'World'};
const officeMenu={Overview:'Office Overview',Messages:'Filter All',Decisions:'Open move history',Calendar:'Open Race Calendar',News:'News',Reports:'Open move history',Career:'Open move history'};
const state=()=>{try{return JSON.parse(localStorage.getItem('wtwOfficeStateV30')||'{}')}catch{return {}}};
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
function goOffice(){
 const hadCustom=Boolean(APP.custom);
 APP.custom='';APP.section='Office';APP.page='Office';
 bridgeNode(originalAct('Office Overview'));
 if(hadCustom)pushUIHistory('');
 paint();
}
function openMenu(section){
 APP.moreOpen=false;
 if(section==='History'){window.location.assign('/archive/?page=races');return}
 APP.section=section;APP.page='Overview';APP.custom='';
 if(actions[section])bridgeNode(originalAct(actions[section]));
 else{openCustomView(section,section,'Overview')}
}
function pageTab(name){if(APP.section==='History'){const pages={'Race Results':'races','Horses':'horses','People & Farms':'people','Facilities & Tracks':'tracks','Historical Calendar':'seasons','Coverage':'sources'};window.location.assign('/archive/?page='+encodeURIComponent(pages[name]||'races'));return}APP.page=name; const s=APP.section;
 if(s==='Office'){
   if(name==='Overview')return goOffice();
   if(name==='Messages')return openCustomView('Messages','Office',name)
   if(name==='Decisions')return openCustomView('Decisions','Office',name)
   if(name==='Calendar')return bridgeNode(originalAct('Race Calendar'));
   if(name==='News')return bridgeNode(originalAct('News'));
   if(name==='Reports'||name==='Career')return openCustomView(name,'Office',name)
 }
 if(s==='Stable'&&(name==='Overview'||name==='Horses'))return bridgeNode(originalAct('Stable'));
 if(s==='Racing'&&(name==='Overview'||name==='Calendar'||name==='Entries'||name==='Stakes'))return bridgeNode(originalAct('Race Calendar'));
 if(s==='Sales'&&(name==='Overview'||name==='Auctions'))return bridgeNode(originalAct('Sales'));
 if(s==='World'&&(name==='Overview'||name==='Tracks'||name==='Meets'||name==='Major Races'))return bridgeNode(originalAct('World'));
 openCustomView(`${s} — ${name}`,s,name);
}
const currentMessages=()=>$$('.left .msg[data-case]').map(n=>({case:n.dataset.case,from:$('.from',n)?.textContent.trim()||'Stable Office',title:$('.title',n)?.textContent.trim()||'',meta:$('.meta',n)?.textContent.trim()||'',time:$('.time',n)?.textContent.trim()||'',urgent:n.classList.contains('urgent'),resolved:n.classList.contains('resolved'),initials:$('.avatar',n)?.textContent.trim()||'WT'}));
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
const currDesk=()=>({type:$('#deskType')?.textContent.trim()||'RACING FILE',title:$('#deskTitle')?.textContent.trim()||'',summary:$('#deskSummary')?.textContent.trim()||'',pressure:$('#deskPressure')?.textContent.trim()||'',risk:$('#deskRisk')?.textContent.trim()||'',read:$('#deskRead')?.textContent.trim()||'',source:$('#deskSource')?.textContent.trim()||'',moves:$$('#moveGrid .moveCard').map(n=>({title:$('strong',n)?.textContent.trim()||'',tag:$('span',n)?.textContent.trim()||'',node:n})),intel:$$('#intelGrid .intelCard').map(n=>({title:$('b',n)?.textContent.trim()||'',body:$('p',n)?.textContent.trim()||'',tone:n.classList.contains('red')?'red':n.classList.contains('gold')?'gold':n.classList.contains('blue')?'blue':'green'}))});
const horseRows=()=>$$('.right .boardRows .rankRow').map((n,i)=>({name:$('strong',n)?.textContent.trim()||'',activity:$('.wtwV37HorseActivity',n)?.textContent.trim()||n.title||'No current Office activity recorded',tag:n.querySelector(':scope > span:last-child')?.textContent.trim()||'',index:i+1}));
const racingRows=()=>$$('.right .fixtureList .fixture[data-track]').map(n=>{const name=$('h4',n)?.textContent.trim()||'';const saved=state();const isPowerline=name==='Powerline';const confirmed=isPowerline && (saved.calendarState?.['Churchill R3']?.status==='Entered' || /^Entered/i.test(saved.horseState?.Powerline?.status||''));return {name,date:$('.d',n)?.textContent.trim()||'',track:n.dataset.track||'',tag:$('.raceTag',n)?.textContent.trim()||'',status:confirmed?'Entered':($('.wtwV37EntryFlag',n)?.textContent.trim()||'Target')}});
function menuIcon(kind){const names={mail:'✉',horse:'♞',race:'▤',intel:'◈',move:'➜',lead:'✦'};return names[kind]||'●'}
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
 const st=state(),o=st.organization&&typeof st.organization==='object'?st.organization:
                 st.stable&&typeof st.stable==='object'?st.stable:{};
 return {id:o.id==null?'':String(o.id),name:typeof o.name==='string'&&o.name.trim()?o.name.trim():'YOUR STABLE'};
}
function organizationLogoMarkup(id,name,kind='organization',large=false,brandFallback=false){
 const refs=organizationLogoIndex?.organizations||{};
 const keys=[id?kind+':'+id:'',kind+':'+name,kind==='stable'?'player':''].filter(Boolean);
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
 const linked=typeof window.__wtwOfficeHorseOwner==='function'?window.__wtwOfficeHorseOwner(name):null;
 const horse=state().horseState?.[name]||{};
 const id=linked?.id||(typeof horse.owner_id==='string'?horse.owner_id.trim():'');
 const raw=linked?.name||horse.owner_name||horse.owner;
 const owner=typeof raw==='string'?raw.trim():'';
 return owner&&owner!=='—'&&owner!=='Unknown'?{id,name:owner}:null;
}
function horseOwnerBadge(name,showName=false){
 const owner=horseOwnership(name);
 const logo=owner?organizationLogoMarkup(owner.id,owner.name,'owner',false,false):
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
   ['History','menu','History','calendar'],['Tracks & World','menu','World','grid']
  ]]
 ];
 const on=(label,key,value)=>key==='office'&&!APP.custom&&APP.section==='Office'&&!currentRoute()||
  key==='custom'&&APP.custom===value||key==='menu'&&APP.section===value&&!APP.custom;
 const btn=([label,key,value,icon])=>'<button type="button" data-ng="'+key+'"'+
  (value?' data-val="'+safe(value)+'"':'')+' class="ng-manager-rail-link'+(on(label,key,value)?' on':'')+'"'+
  ' title="'+safe(label)+'"'+(on(label,key,value)?' aria-current="page"':'')+'>'+
  '<span class="ng-manager-rail-icon" aria-hidden="true">'+glyph(icon,15)+'</span>'+
  '<span>'+safe(label)+'</span></button>';
 return '<aside class="ng-manager-sidebar" aria-label="Game departments">'+
  '<div class="ng-manager-rail-brand"><img src="/assets/wtw-office-approved-logo.png" alt="" />'+
  '<span><strong>WIRE TO WIRE</strong><small>RACING MANAGEMENT</small></span></div>'+
  groups.map(([title,links])=>'<section class="ng-manager-rail-group"><h2>'+title+'</h2>'+
    links.map(btn).join('')+'</section>').join('')+
  '<div class="ng-manager-rail-footer"><span class="ng-manager-rail-dot"></span>ACTIVE CAREER</div>'+
 '</aside>';
}
function header(){
 const date=$('.dateChip')?.textContent.trim()||'2014-07-15';
 const due=dueActions();
 // Each entity Overview has its own fully visible profile navigation.
 // Do not waste desktop height on unrelated department subtabs.
 const profileRoute=APP.custom?null:currentRoute();
 const hasOwnNavigation=Boolean(profileRoute&&/Profile$/.test(profileRoute.kicker))||
  APP.custom==='Search'||APP.custom==='Organization Overview'||Boolean(APP.custom&&APP.custom.includes(' — '));
 return `<header class="ng-global" aria-label="Wire to Wire application navigation">
  <div class="ng-hist"><button data-ng="back" aria-label="Previous page" title="Previous page">${glyph('left',15)}</button><button data-ng="forward" aria-label="Next page" title="Next page">${glyph('right',15)}</button></div>
  <button class="ng-mini-home" data-ng="office" title="Racing Office" aria-label="Go to Racing Office"><img class="ng-logo-mini" src="/assets/wtw-office-approved-logo.png" alt=""/><span class="ng-wordmark"><strong>WIRE TO WIRE</strong><small>RACING MANAGER</small></span></button>
  <div class="ng-manager-top-context"><strong>${safe(APP.section.toUpperCase())}</strong><span>${safe((APP.custom||profileRoute?.title||APP.page||'Overview').replace(/^Office$/,'Overview'))}</span></div>
  <div class="ng-global-tools"><button class="ng-iconbtn" data-ng="custom" data-val="Search" aria-label="Search">${glyph('search',17)}</button><button class="ng-iconbtn" data-ng="custom" data-val="Messages" aria-label="Inbox">${glyph('mail',17)}<i></i></button><button class="ng-iconbtn" data-ng="action" data-val="Save" aria-label="Save game">${glyph('save',17)}</button></div>
  <button class="ng-global-date" data-ng="menu" data-val="Racing" title="Open calendar for in-world date ${safe(date)}" aria-label="In-world date ${safe(date)}. Open racing calendar"><span>GAME DATE</span><strong>${safe(date)}</strong></button>
  ${due.length?'<button class="ng-global-due" data-ng="due" title="Review due management follow-ups">'+glyph('alert',13)+' DUE '+due.length+'</button>':''}
  <button class="ng-global-continue" data-ng="action" data-val="Continue" title="Advance in-world game" aria-label="Continue game">${glyph('play',14)}<span>CONTINUE</span>${glyph('right',15)}</button>
 </header>
 ${hasOwnNavigation?'':`<div class="ng-subbar"><nav class="ng-subnav" aria-label="Section navigation">${(tabmap[APP.section]||['Overview']).map(x=>`<button data-ng="tab" data-val="${safe(x)}" class="${APP.page===x||(APP.page==='Office'&&x==='Overview')?'on':''}">${safe(x)}</button>`).join('')}</nav></div>`}`;
}

// Real global discovery: known Office entities, connected record pages,
// management screens and a link to the separately maintained History Vault.
function globalSearchItems(){
 const rows=typeof window.__wtwOfficeSearchRecords==='function'?window.__wtwOfficeSearchRecords():[];
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
 return [...rows.filter(r=>r&&typeof r.name==='string').map(r=>({
  kind:r.kind,name:r.name,track:r.track||'',detail:r.kind==='person'?titleCaseUIRole(r.detail):r.detail||''
 })),...pages];
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
  entry.kind==='horse'?(horseOwnership(entry.name)?.name||''):''].filter(Boolean).join(' ').toLowerCase().includes(word)
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
  const ownerText=isHorse?(owner?.name||'Not recorded'):'—';
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
  APP.custom='';APP.moreOpen=false;
  if(window.__wtwOfficeOpenSearchRecord?.(item.kind,item.name,item.track))return schedulePaint(20);
  return;
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

function center(){const d=currDesk();const messages=currentMessages();const resolved=state().resolvedCases?.[APP.activeCase];const source=d.source&&d.source!=='—'?d.source:'Stable Office';const msg=messages.find(m=>m.case===APP.activeCase);const index=messages.findIndex(m=>m.case===APP.activeCase)+1;
const hasRelatedHorse=new Set(['powerline','lastmatch','pieta','entries','newsbuzz']).has(APP.activeCase);
const relatedAction=hasRelatedHorse?`<button class="alt" data-ng="profile-from-case">HORSE PROFILE ${glyph('arrow',14)}</button>`:'';
const resolvedRelatedAction=hasRelatedHorse?`<button class="ng-openhorse" data-ng="profile-from-case">RELATED HORSE FILE ${glyph('arrow',13)}</button>`:`<button class="ng-openhorse" data-ng="action" data-val="Open file">REVIEW SOURCE FILE ${glyph('arrow',13)}</button>`;
const moves=resolved?`<div class="ng-resolved"><div class="ng-resolution-title">${glyph('check',16)} ${safe(resolved.choiceTitle)}</div><div class="ng-resolvedtabs">${['Effect','Barn Reaction','Follow-up'].map((t,i)=>`<button class="${APP.outTab===i?'on':''}" data-ng="outtab" data-val="${i}">${t}</button>`).join('')}</div><div class="ng-outtext">${safe([resolved.immediate,resolved.reaction,resolved.followUp][APP.outTab])}</div><div class="ng-outcome-actions">${resolvedRelatedAction}<button class="ng-nextopen" data-ng="nextopen">NEXT OPEN CASE ${glyph('right',13)}</button></div></div>`:d.moves.map((m,i)=>`<button class="ng-move ng-move-${i%3}" data-ng="move" data-val="${i}"><span class="ng-move-number">0${i+1}</span><span class="ng-move-body"><span class="ng-movetag">${safe(m.tag)}</span><strong>${safe(m.title)}</strong>${typeof deskCases!=='undefined'&&deskCases[APP.activeCase]?.moves?.[i]?.[1]?`<span class="ng-move-note">${safe(deskCases[APP.activeCase].moves[i][1])}</span>`:''}</span><span class="ng-movearrow">${glyph('right',17)}</span></button>`).join('');
return `<section class="ng-main"><section class="ng-card ng-feature"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('folder',17)}</span><div class="ng-headinggroup"><h3>Decision Desk</h3><span>THE MANAGER'S PRIORITY FILE</span></div><button class="ng-org-chip" data-ng="organization" aria-label="Open organization overview; available cash ${safe(cashDisplay())}" title="View your racing operation and available cash">${organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',false,true)}<span class="ng-org-chip-cash"><small>CASH</small><strong>${safe(cashDisplay())}</strong></span></button><div class="ng-case-navigation"><div class="ng-case-pips" aria-label="Select today's case">${messages.map((m,i)=>`<button type="button" data-ng="case" data-val="${safe(m.case)}" class="ng-case-pip ${m.case===APP.activeCase?'on':''} ${m.resolved?'reviewed':m.urgent?'priority':''}" title="${safe(m.title)}${m.resolved?' — Reviewed':''}" aria-label="Case ${i+1}: ${safe(m.title)}" aria-current="${m.case===APP.activeCase?'true':'false'}"></button>`).join('')}</div><span class="ng-case-position"><span class="ng-live-dot"></span>${String(index).padStart(2,'0')} / ${String(messages.length).padStart(2,'0')}</span><div class="ng-case-arrows"><button type="button" data-ng="caseprev" aria-label="Previous decision" title="Previous case">${glyph('left',13)}</button><button type="button" data-ng="casenext" aria-label="Next decision" title="Next case">${glyph('right',13)}</button></div></div></header><div class="ng-featurebody"><div class="ng-case"><div class="ng-case-eyebrow"><span></span>${safe(d.type)} <i>·</i> ${safe(msg?.from||source)}</div><div class="ng-casetitle ng-static-title"><h2>${safe(d.title)}</h2></div><p class="ng-case-summary">${safe(d.summary)}</p><div class="ng-facts">${[['Pressure',d.pressure],['Primary risk',d.risk],['Manager read',d.read]].map((f,i)=>`<div class="ng-fact ng-fact-${i}"><small>${safe(f[0])}</small><b>${safe(f[1])}</b></div>`).join('')}</div><div class="ng-caseactions"><button data-ng="action" data-val="Open file">REVIEW FULL FILE ${glyph('arrow',14)}</button>${relatedAction}</div></div><div class="ng-featurephoto">${decisionScene(d)}</div></div></section><div class="ng-centerbottom"><section class="ng-card ng-intel"><header class="ng-cardhead"><span class="ng-sectionicon">${glyph('sparkle',16)}</span><div class="ng-headinggroup"><h3>Intelligence</h3><span>${d.intel.length} SOURCE READS</span></div><button class="ng-cardlink" data-ng="action" data-val="Open current source">${safe(source)} ${glyph('arrow',12)}</button></header><div class="ng-intelgrid">${d.intel.map((item,i)=>`<button class="ng-intelitem ng-intel-${i%4}" data-ng="intel" data-val="${i}"><span class="ng-intel-kicker" aria-label="Source ${i+1}"><span class="ng-intel-marker"></span>0${i+1}</span><b>${safe(item.title)}</b><p>${safe(item.body)}</p></button>`).join('')}</div></section><section class="ng-card ng-choices"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('flag',16)}</span><div class="ng-headinggroup"><h3>Your Call</h3><span>MANAGEMENT DECISION</span></div><span class="ng-choice-count">${resolved?'RECORDED':`${d.moves.length} OPTIONS`}</span></header><div class="ng-moves">${moves}</div></section></div></section>`;
}
function right(){const horses=horseRows(),races=racingRows();const leads=document.querySelectorAll('.app .oppList .oppItem').length;const entered=races.filter(r=>/entered/i.test(r.status)).length;
return `<aside class="ng-right"><section class="ng-card ng-roster"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('horse')}" alt=""/></span><div class="ng-headinggroup"><h3>Stable Roster</h3><span>${horses.length} HORSES · CURRENT ACTIVITY</span></div><button class="ng-cardlink" data-ng="menu" data-val="Stable">ALL ${glyph('arrow',12)}</button></header><div class="ng-rostercolumns"><span>HORSE / ACTIVITY</span><span>STATUS</span></div><div class="ng-rosterrows">${horses.length?horses.map(h=>`<button class="ng-rosterrow" aria-label="Open horse profile: ${safe(h.name)}" data-ng="horse" data-val="${safe(h.name)}"><span class="ng-rostername">${horseOwnerBadge(h.name)}${safe(h.name)}</span><span class="ng-horseact">${safe(h.activity)}</span><span class="ng-rostertag">${safe(h.tag)}</span></button>`).join(''):'<div class="ng-rail-empty">No horses are listed for this stable yet.</div>'}</div></section><section class="ng-card ng-races"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><div class="ng-headinggroup"><h3>Race Schedule</h3><span>UPCOMING ENTRIES & TARGETS</span></div><button class="ng-cardlink" data-ng="menu" data-val="Racing">FULL ${glyph('arrow',12)}</button></header><div class="ng-entrycolumns"><span>DATE</span><span>HORSE / RACECOURSE</span><span>STATUS</span></div><div class="ng-entrylist">${races.length?races.map((r,i)=>`<button class="ng-entryrow" aria-label="Open race target: ${safe(r.name)} at ${safe(r.track)}" data-ng="fixture" data-val="${i}"><span class="ng-entrydate">${safe(r.date)}</span><span class="ng-entrycopy"><b>${horseOwnerBadge(r.name)}${safe(r.name)}</b><span><i class="ng-flag-us" aria-label="United States" role="img"></i> ${safe(r.track)}</span></span><span class="ng-entrytag"><b>${safe(r.tag)}</b><small class="${/entered/i.test(r.status)?'entered':''}">${safe(r.status.replace('·','').trim())}</small></span></button>`).join(''):'<div class="ng-rail-empty">No upcoming race targets are currently recorded.</div>'}</div></section><button class="ng-leads" data-ng="custom" data-val="Opportunities"><span class="ng-lead-star">${glyph('sparkle',16)}</span><strong>OPPORTUNITIES</strong><span>${leads?`${leads} CURRENT LEADS`:"NO CURRENT LEADS"}</span>${glyph('right',16)}</button></aside>`;
}
const currentRoute=()=>{const el=$('#routeShell');if(!el||el.hidden)return null;return {kicker:$('#routeKicker')?.textContent.trim()||'Page',title:$('#routeTitle')?.textContent.trim()||'Page',body:$('#routeBody')?.innerHTML||'',badge:$('.wtwRouteBadge',el)?.getAttribute('src')||badge('history')}};
const pageBadge=()=>{const map={Stable:'farm_stable',Racing:'major_races',Sales:'connections',Breeding:'pedigree',Personnel:'people',Facilities:'farm_stable',Finances:'reputation',World:'track',Search:'history',Messages:'people',Decisions:'career_record',Reports:'history',Career:'achievements',Opportunities:'reputation'};return badge(map[APP.custom.split(' ')[0]]||map[APP.section]||'history')};

function profileDetail(route){
 const source=$('#routeBody .profilePage');if(!source)return null;
 const id=route.kicker+'|'+route.title;
 if(APP.routeId!==id){APP.routeId=id;APP.detailTab='Overview';APP.networkPage=0;APP.networkRole='all';APP.networkFocus=''}
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
 const tabs=(isHorse?['Overview','Career Record','Pedigree','Achievements','Connections','History']:
  isPerson?['Overview','Attributes','Reputation','Network','Stable Horses','Career','Connections','History']:
  isFarm?['Overview','Connected Horses','Operations','Connections','History']:
  isTrack?['Overview','Meet Schedule','Major Races','Connections','History']:
  ['Overview','Connections','History']);
 const rows=(items)=>'<div class="ng-data-rows">'+items.map(i=>`<div class="ng-data-row"><span>${safe(i.label)}</span><strong>${safe(i.value)}</strong></div>`).join('')+'</div>';
 const pills='<div class="ng-status-pills">'+states.slice(0,4).map(x=>`<span>${safe(x)}</span>`).join('')+'</div>';
 const tabbar=(isPerson||isHorse)?`<nav class="ng-person-dossierbar ng-management-dossierbar" aria-label="Personnel dossier navigation">
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
 const factsBlock=`<div class="ng-profile-facts">${fields.map(f=>`<div><small>${safe(f.label)}</small><strong>${safe(f.value)}</strong></div>`).join('')}</div>`;

 const horseAchievementPanel=isHorse?$$('.profilePanel',source).find(panel=>text('h3',panel).includes('Achievements')):null;
 const horseAchievements=horseAchievementPanel?$$('.achievementItem',horseAchievementPanel).map(el=>el.textContent.trim()).filter(Boolean):[];
 const connectionRows=()=>`<div class="ng-data-rows">${connection.map(f=>`<div class="ng-data-row"><span>${safe(f.label)}</span>${f.button?`<button data-ng="sourcebutton" data-val="${$$('#routeBody [data-act]').indexOf(f.button)}" aria-label="Open ${safe(f.label)} profile: ${safe(f.value)}">${safe(f.value)} ↗</button>`:`<strong>${safe(f.value)}</strong>`}</div>`).join('')||'<div class="ng-empty-record">No connected profiles recorded.</div>'}</div>`;

 const sourcePanels=$$('.profilePanel',source);
 const sourcePanel=word=>sourcePanels.find(panel=>text('h3',panel).toLowerCase().includes(word.toLowerCase()));
 const connectedPanel=isPerson?sourcePanel('Stable'):isFarm?sourcePanel('Connected Horses'):null;
 const sourceLinks=connectedPanel?$$('.achievementItem',connectedPanel):[];
 const connectedHorseRows=(limit=null)=>'<div class="ng-entity-links">'+((limit===null?sourceLinks:sourceLinks.slice(0,limit)).map(item=>{
  const btn=$('button[data-act]',item);
  const index=btn?$$('#routeBody [data-act]').indexOf(btn):-1;
  const label=(btn?.textContent.trim()||item.textContent.trim()).replace(/\s+/g,' ').trim();
  return index>=0?'<button data-ng="sourcebutton" data-val="'+index+'" aria-label="Open horse '+safe(label)+'"><span class="ng-horse-with-owner">'+horseOwnerBadge(label)+safe(label)+'</span>'+glyph('right',14)+'</button>':'<div class="ng-entity-link-static">'+safe(label)+'</div>';
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
 const stakesTable=(limit=100)=>'<div class="ng-stakes-table"><div class="ng-stakes-head"><span>RACE</span><span>DATE</span><span>GRADE</span><span>PURSE</span></div>'+
  (trackRaces.slice(0,limit).map(row=>{
   const cols=[...row.node.children].map(item=>item.textContent.trim()).slice(0,4);
   while(cols.length<4)cols.push('—');
   const index=$$('#routeBody [data-act]').indexOf(row.node);
   return index<0?'':'<button class="ng-stakes-data" data-ng="sourcebutton" data-val="'+index+'">'+cols.map(v=>'<span>'+safe(v)+'</span>').join('')+'</button>';
  }).join('')||'<div class="ng-empty-record">No verified stakes rows connected.</div>')+'</div>';
 const entityPhotoKind=isHorse?'horse':isPerson?'person':isFarm?'farm':isTrack?'track':'';
 const horseImage=entityPhotoKind?officeAssetPath(officePhotoIndex?.entities?.[entityPhotoKind+':'+route.title]):'';
 const sourceDecision=isHorse?$('#routeBody [data-act="Open profile decision"]'):null;
 const sourceFollowUp=isHorse?$('#routeBody [data-act="Open follow-up"]'):null;
 const quickLinks=[sourceDecision?'<button data-ng="sourcebutton" data-val="'+$$('#routeBody [data-act]').indexOf(sourceDecision)+'">OPEN RELATED DECISION '+glyph('arrow',12)+'</button>':'',
 sourceFollowUp?'<button data-ng="sourcebutton" data-val="'+$$('#routeBody [data-act]').indexOf(sourceFollowUp)+'">OPEN FOLLOW-UP '+glyph('arrow',12)+'</button>':''].filter(Boolean).join('');

 const athleteOverview=()=>{
  const catalog=athleteAttributeCatalog;
  const categories=catalog?.horse_categories||{};
  const display=catalog?.display?.horse_overview||{};
  const reports=state().scoutingState?.[route.title]?.attribute_observations||[];
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
    const label=verified?(report.status==='measured'?'Measured':'Scout estimate'):'Not yet assessed';
    const value=verified?String(report.estimate)+(report.unit?' '+report.unit:''):'—';
    const scaled=verified&&Number.isFinite(Number(report.estimate))&&
     Number.isFinite(Number(report.scale_min))&&Number.isFinite(Number(report.scale_max))&&
     Number(report.scale_max)>Number(report.scale_min)?
      Math.max(0,Math.min(100,100*(Number(report.estimate)-Number(report.scale_min))/
      (Number(report.scale_max)-Number(report.scale_min)))):null;
    const meter=scaled==null?'<span class="ng-horse-rating-unassessed" aria-hidden="true"></span>':
     '<span class="ng-horse-rating-track" aria-hidden="true"><i style="width:'+scaled.toFixed(1)+'%"></i></span>';
    return '<div class="ng-horse-rating-row" title="'+safe(def.meaning)+' · '+safe(label)+'"><span>'+safe(def.label)+'</span>'+meter+
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
     '<strong class="'+(verified?'known':'unknown')+'" title="'+safe(verified?'Source-backed '+report.status:'Not yet assessed')+'">'+
      (verified?safe(String(report.estimate)+(report.unit?' '+report.unit:'')):'—')+'</strong></div>';
   }).join('')+'</div>';
  const asMap=items=>'<div class="ng-horse-mgr-rows">'+items.map(([name,value])=>
   '<div class="ng-horse-mgr-row"><span>'+safe(name)+'</span><strong>'+safe(value)+'</strong></div>').join('')+'</div>';
  const career=record.filter(x=>known(x.value)).map(x=>[x.label,x.value]);
  const careerBody=career.length?asMap(career):'<p class="ng-horse-small-note">No verified career figures in this Office record.</p>';
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
    '<strong>'+safe(x.value)+'</strong>';
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
  const recent=verifiedHistory.length?'<div class="ng-horse-form-table"><div class="ng-horse-form-head"><span>DATE</span><span>RACE / TRACK</span><span>FINISH</span><span>SOURCE</span></div>'+
   verifiedHistory.slice(-5).reverse().map(x=>'<div class="ng-horse-form-row"><span>'+safe(x.date)+'</span><span>'+safe(x.race)+
   (known(x.track)?' · '+safe(x.track):'')+'</span><span>'+safe(x.finish||'—')+'</span><span>Verified</span></div>').join('')+'</div>':
   '<p class="ng-horse-small-note">No certified race-by-race form attached to this Office horse. Historical results remain in History.</p>';
  const panel=(name,body,cls='')=>'<section class="ng-horse-mgr-panel '+cls+'"><header><strong>'+name+'</strong></header>'+body+'</section>';
  return '<div class="ng-horse-dossier">'+
   '<div class="ng-horse-dossier-caption"><strong>ATHLETE & RACING INTELLIGENCE</strong><span>'+observedCount+
   ' OF '+allDefs.length+' ATTRIBUTES ASSESSED · UNASSESSED ≠ ZERO</span></div>'+
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
  const roleName=text('.profileSubline').replace(/^Job:\s*/i,'').trim().toLowerCase(),roleDisplay=titleCaseUIRole(roleName);
  const namedRoles={
   'stable staff':'stable_staff','bloodstock':'bloodstock_professional',
   'bloodstock agent':'bloodstock_agent','trainer':'trainer','jockey':'jockey',
   'owner':'owner','breeder':'breeder','farm manager':'farm_manager',
   'veterinarian':'veterinarian','groom':'groom','farrier':'farrier',
   'exercise rider':'exercise_rider','racing secretary':'racing_secretary'
  };
  const role=namedRoles[roleName]||null,cat=athleteAttributeCatalog||{};
  const work=state().staffState?.[route.title]||{};
  const observations=Array.isArray(work.attribute_observations)?work.attribute_observations:[];
  const observed=new Map(observations.filter(x=>x&&typeof x.attribute_key==='string').map(x=>[x.attribute_key,x]));
  const common=cat.person_common||[],special=role?(cat.person_roles?.[role]||[]):[];
  const quick=cat.display?.person_overview||{},commonQuick=(quick.common||[]).map(key=>common.find(t=>t.key===key)).filter(Boolean);
  const source=work.reputation_profile;
  const validRep=source?.schema==='WTW_PERSON_REPUTATION_V1'&&typeof source.scores?.overall==='number'&&
   Number.isFinite(source.scores.overall)&&source.scores.overall>=0&&source.scores.overall<=100&&
   Array.isArray(source.source?.refs)&&source.source.refs.length>0;
  const rep=validRep?source:null,axes=cat.reputation?.axes||[];
  const trust=typeof work.trust==='number'&&Number.isFinite(work.trust)?work.trust:null;
  const relationshipNotice=trust===null?'':'<div class="ng-person-relationship"><span>WORKING RELATIONSHIP TRUST</span><strong>'+(trust>0?'+':'')+safe(String(trust))+'</strong></div>';
  const attr=(def)=>{
   const obs=observed.get(def.key);
   const valid=obs&&(obs.status==='estimated'||obs.status==='measured')&&obs.estimate!==null&&obs.estimate!==undefined&&
    Array.isArray(obs.evidence_refs)&&obs.evidence_refs.length>0;
   return `<div class="ng-person-attribute" title="${safe(def.meaning)}"><span>${safe(def.label)}</span><strong class="${valid?'assessed':'unassessed'}">${valid?safe(String(obs.estimate)):'—'}</strong></div>`;
  };
  const attributes=(full=false)=>{
   const isObserved=def=>{const o=observed.get(def.key);return o&&
    (o.status==='measured'||o.status==='estimated')&&o.estimate!=null&&Array.isArray(o.evidence_refs)&&o.evidence_refs.length;};
   const found=common.filter(isObserved).length+special.filter(isObserved).length;
   if(full)return `<div class="ng-person-attribute-block"><div class="ng-person-minihead">PROFESSIONAL FOUNDATIONS <small>${common.filter(isObserved).length}/${common.length} ASSESSED</small></div>${common.map(attr).join('')}${special.length?`<div class="ng-person-minihead">${safe(roleDisplay.toUpperCase())} SKILLS <small>ROLE SPECIALTIES</small></div>${special.map(attr).join('')}`:''}</div>`;
   const first=common.slice(0,Math.ceil(common.length/2)),second=common.slice(Math.ceil(common.length/2));
   const column=(rows,label)=>`<section class="ng-person-skill-column"><div class="ng-person-minihead">${safe(label)}</div>${rows.map(attr).join('')}</section>`;
   return `<div class="ng-person-attribute-block ng-person-skill-matrix">
     <div class="ng-person-assessment-summary"><span>SCOUTING COVERAGE</span><strong>${found} / ${common.length+special.length} ASSESSED</strong><small>UNKNOWN DOES NOT MEAN ZERO</small></div>
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
      const content=`<span class="ng-person-horse-name">${horseOwnerBadge(label)}<strong>${safe(label)}</strong></span><span class="ng-person-horse-owner" title="${safe(owner?.name||'Owner not recorded')}">${safe(owner?.name||'Owner not recorded')}</span><span class="ng-person-horse-status" title="${safe(status)}">${safe(status)}</span>${glyph('right',12)}`;
      return index>=0?`<button class="ng-person-horse-row" data-ng="sourcebutton" data-val="${index}" aria-label="Open linked horse ${safe(label)}">${content}</button>`:
        `<div class="ng-person-horse-row ng-person-horse-static">${content}</div>`;
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
 const profileMark=isOrganizationProfile?organizationLogoMarkup('',route.title,route.kicker==='Farm Profile'?'farm':'organization',true):`<div class="ng-profile-badgeframe"><img src="${badge(route.kicker==='Horse Profile'?'horse':route.kicker==='Track Profile'?'track':route.kicker==='People Profile'?'people':'farm_stable')}" alt="Approved ${safe(route.kicker)} badge"/></div>`;

 const horseField=(label)=>fields.find(f=>f.label.toLowerCase()===label.toLowerCase())?.value||'—';
 const horseFoalingState=isHorse?(source.dataset.foalingState||'').trim():'';
 const horseFoalingCountry=isHorse?(source.dataset.foalingCountry||'').trim():'';
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
 const horseFoalingDisplay=[horseFoalingState,horseCountryLabel].filter(v=>v&&v!=='—').join(', ')||'—';
 const horseIdentityRow=isHorse?`<div class="ng-horse-biography" aria-label="Horse foaling and identity facts">
  <span class="ng-horse-bio-foaling"><small>FOALED</small><strong>${horseFlagPath?`<img class="ng-horse-bio-flag" src="${safe(horseFlagPath)}" alt="" width="22" height="16" decoding="async"/>`:''}${safe(horseFoalingDisplay)}</strong></span>
  <span><small>DATE OF BIRTH</small><strong>${safe(horseField('Date of birth'))}</strong></span>
  <span><small>SEX</small><strong>${safe(horseField('Sex'))}</strong></span>
  <span><small>AGE</small><strong>${safe(horseField('Age'))}</strong></span>
 </div>`:'';

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
 const currentYear=String(state()?.date||'2014-07-15').slice(0,10);
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
  [personOriginLabel,personOriginValue,personFlagImg],
  ['AGE',personAge,''],
  ['HOMETOWN',personHometown,''],
  [baseLabel,personBaseValue,'']
 ].filter(([,value])=>knownField(value)):[];

 const entityHeaderFields=isPerson?personIdentityFields:
  isFarm?[['LOCATION',factByName('Location')],['TYPE',factByName('Type')],['OWNER',factByName('Owner')],['STATUS',factByName('Current status')]]:
  isTrack?[['LOCATION',factByName('Location')],['SURFACES',factByName('Surfaces')],['OPERATING',factByName('Operating state')],['CIRCUIT',text('.profileSubline').split('·').slice(1).join('·').trim()||'—']]:[];
 const horseIdentityConnections=isHorse?connection.filter(x=>['owner','trainer','jockey','current stable'].includes(x.label.toLowerCase())&&knownField(x.value)).slice(0,3):[];
 const horseConnectionHeader=horseIdentityConnections.length?
  '<div class="ng-horse-header-connections">'+horseIdentityConnections.map(x=>
   '<div><small>'+safe(x.label)+'</small><strong>'+safe(x.value)+'</strong></div>').join('')+'</div>':'';
 const entityIdentityRow=entityHeaderFields.length?
  `<div class="ng-tier1-biography" aria-label="${safe(route.kicker)} identity summary">${entityHeaderFields.map(([label,value,flag])=>`<span><small>${safe(label)}</small><strong title="${safe(value)}">${flag||''}${safe(value)}</strong></span>`).join('')}</div>`:'';
 const identity=`<div class="ng-profile-intro">
  ${profileMark}
  <div class="ng-profile-identity"><div class="ng-profile-breadcrumb">${safe(route.kicker)} <span> / </span> Current Office</div><h2>${isHorse?horseOwnerBadge(route.title):''}${safe(route.title)}</h2>${horseIdentityRow}${entityIdentityRow}${horseConnectionHeader}${isHorse||isPerson||isFarm||isTrack?'':`<p>${safe(text('.profileSubline')||'Active source-linked office record')}</p>${pills}`}</div>${horseImage?`<div class="ng-profile-source-photo" role="img" aria-label="Approved image of ${safe(route.title)}"><img src="${safe(horseImage)}" alt="" loading="lazy" decoding="async"/></div>`:''}
  <div class="ng-profile-tools"><button data-ng="office" aria-label="Return to Racing Office">← OFFICE</button><button data-ng="menu" data-val="${isTrack?'Racing':isPerson||isFarm?'World':'Stable'}">${isTrack?'RACE CALENDAR':isPerson?'PEOPLE DIRECTORY':isFarm?'FARM DIRECTORY':'STABLE DIRECTORY'} ↗</button></div>
 </div>`;
 let left='',right='',footer='';
 if(APP.detailTab==='Overview'){
  if(isHorse){
   left=athleteOverview();
   right='';footer='';
  }else if(isPerson){
   const person=personWork();
   left=`<div class="ng-person-workspace ng-person-workspace-overview">
    <section class="ng-person-work-card ng-person-ov-attributes"><header>PROFESSIONAL RATINGS <span class="ng-person-panel-context">CURRENT & OBSERVED ABILITY</span></header>${person.attributes()}</section>
    <section class="ng-person-work-card ng-person-ov-reputation"><header>REPUTATION & RELATIONSHIP TRUST</header>${person.reputation()}</section>
    <section class="ng-person-work-card ng-person-ov-horses"><header>HORSE ASSIGNMENTS <span class="ng-person-panel-context">LIVE BARN STATUS</span></header>${person.horseAssignments()}</section>
    <section class="ng-person-work-card ng-person-ov-career"><header>CAREER & OPPORTUNITIES</header>${person.careerOverview}</section>
    <section class="ng-person-work-card ng-person-ov-network"><header>WORKING RELATIONSHIPS</header>${person.networkOverview}</section>
   </div>`;
   right='';footer='';
  }else if(isFarm){
   left=`<div class="ng-tier1-workspace">
    <section class="ng-tier1-card"><header>FARM AT A GLANCE <button data-ng="detailtab" data-val="Operations">OPERATIONS ${glyph('arrow',11)}</button></header>${rows(fields.filter(f=>!['location','type','owner'].includes(f.label.toLowerCase())))}<div class="ng-tier1-summaryline">Location, ownership and farm type appear beside the name.</div></section>
    <section class="ng-tier1-card"><header>CONNECTED HORSES <button data-ng="detailtab" data-val="Connected Horses">ALL HORSES ${glyph('arrow',11)}</button></header>${connectedHorseRows(4)}</section>
    <section class="ng-tier1-card"><header>PEOPLE & CURRENT ACTIVITY <button data-ng="detailtab" data-val="History">HISTORY ${glyph('arrow',11)}</button></header>${connectionRows()}<div class="ng-tier1-subhead">RECORDED ACTIVITY</div><div class="ng-tier1-activity">${farmAchievements.slice(0,2).map(x=>`<div>${safe(x)}</div>`).join('')||'<div>No sourced achievements yet.</div>'}</div></section>
   </div>`;right='';footer='';
  }else if(isTrack){
   left=`<div class="ng-tier1-workspace">
    <section class="ng-tier1-card"><header>RACECOURSE AT A GLANCE <button data-ng="detailtab" data-val="Connections">CONNECTIONS ${glyph('arrow',11)}</button></header>${rows(fields.filter(f=>!['location','surfaces','operating state'].includes(f.label.toLowerCase())))}<div class="ng-tier1-subhead">CURRENT OFFICE CONTEXT</div><div class="ng-tier1-activity">${trackNotes.filter(x=>/current office/i.test(x.label)).slice(0,1).map(x=>`<div>${safe(x.value)}</div>`).join('')||'<div>No current Office entry recorded.</div>'}</div></section>
    <section class="ng-tier1-card"><header>MEET & CONDITIONS <button data-ng="detailtab" data-val="Meet Schedule">MEET FILE ${glyph('arrow',11)}</button></header>${rows(meetValues)}<div class="ng-tier1-subhead">OPERATING INTELLIGENCE</div><div class="ng-tier1-activity">${trackNotes.filter(x=>!/current office/i.test(x.label)).slice(0,2).map(x=>`<div><b>${safe(x.label)}</b><span>${safe(x.value)}</span></div>`).join('')||'<div>No sourced operating notes.</div>'}</div></section>
    <section class="ng-tier1-card ng-tier1-stakes"><header>FEATURED STAKES <button data-ng="detailtab" data-val="Major Races">ALL RACES ${glyph('arrow',11)}</button></header>${stakesTable(5)}</section>
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
 }else if(APP.detailTab==='Pedigree'){
  left=`<section class="ng-detailcard"><header>PATERNAL LINE</header>${rows(blood.slice(0,3))}</section>`;
  right=`<section class="ng-detailcard"><header>MATERNAL LINE</header>${rows(blood.slice(3))}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>BLOODLINE AUTHORITY</header><div class="ng-notes">No pedigree is invented when the approved source has not yet connected a horse.</div></section>`;
 }else if((APP.detailTab==='Stable Horses'&&isPerson)||(APP.detailTab==='Connected Horses'&&isFarm)){
  left=`<section class="ng-detailcard ng-detailwide"><header>CONNECTED HORSE RECORDS</header>${connectedHorseRows()}</section>`;
 }else if(APP.detailTab==='Attributes'&&isPerson){
  const person=personWork();
  left=`<section class="ng-detailcard ng-detailwide ng-person-detail-sheet"><header>PROFESSIONAL ATTRIBUTE EVALUATIONS</header>${person.attributes(true)}<div class="ng-person-footnote">Estimates require observer evidence. Hidden professional ability is not shown to the player until observed.</div></section>`;
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
  right=`<section class="ng-detailcard"><header>OFFICE CONNECTIONS</header>${connectionRows()}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>DOCUMENTED FARM ACTIVITY</header><div class="ng-notes">${farmAchievements.map(n=>`<div>${safe(n)}</div>`).join('')||'<div>No additional sourced farm activity recorded.</div>'}</div></section>`;
 }else if(APP.detailTab==='Connections'){
  left=`<section class="ng-detailcard"><header>PEOPLE & FARM CONNECTIONS</header>${connectionRows()}</section>`;
  right=`<section class="ng-detailcard"><header>OFFICE CONTEXT</header>${factsBlock}</section>`;
 }else if(APP.detailTab==='Achievements'&&isHorse){
  left=`<section class="ng-detailcard ng-detailwide"><header>RECORDED ACHIEVEMENTS</header><div class="ng-notes">${horseAchievements.map(n=>`<div>${safe(n)}</div>`).join('')||'<div>No achievements documented in the current source record.</div>'}</div></section>`;
 }else if(isTrack&&(APP.detailTab==='Meet Schedule'||APP.detailTab==='Major Races')){
  if(APP.detailTab==='Major Races'){
   left=`<section class="ng-detailcard ng-detailwide"><header>STAKES RACE RECORDS</header>${stakesTable()}</section>`;
  }else{
   left=`<section class="ng-detailcard ng-detailwide"><header>MEET SCHEDULE & RACE DAYS</header>${rows(meetValues)}<button class="ng-entity-open" data-ng="detailtab" data-val="Major Races">BROWSE FEATURED STAKES ${glyph('arrow',12)}</button></section>`;
  }
 }else{
  left=`<section class="ng-detailcard ng-detailwide"><header>HISTORY & RECORDS</header><div class="ng-notes">${(notes.length?notes:details.map(x=>x.lines)).slice(0,8).map(n=>`<div>${safe(n)}</div>`).join('')||'No official history connected yet.'}</div></section>`;
 }
 const actions=`<div class="ng-detailactions"><button data-ng="menu" data-val="Stable">OPEN STABLE ↗</button><button data-ng="menu" data-val="Racing">RACE CALENDAR ↗</button><button data-ng="office">BACK TO OFFICE</button></div>`;
 return `<div class="ng-profile-view ${isHorse?'ng-profile-horse':isPerson?'ng-profile-person':isFarm?'ng-profile-farm':isTrack?'ng-profile-track':'ng-profile-entity'}">${identity}${tabbar}<div class="ng-detail-cols ${isHorse&&APP.detailTab==='Overview'?'ng-detail-cols-horse-overview':isPerson&&APP.detailTab==='Overview'?'ng-detail-cols-person':(isFarm||isTrack)&&APP.detailTab==='Overview'?'ng-detail-cols-tier1':''}">${left}${right}${footer}</div>${isHorse||isPerson||isFarm||isTrack?'':actions}</div>`;
}
function calendarTimeline(races,nonraces){
 const iso=$('.dateChip')?.textContent.trim()||'2014-07-15';
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
function functionalRoute(route){
 if(route.kicker==='Stable'){
  const horses=horseRows(),races=racingRows(),st=state(),q=APP.stableSearch.trim().toLowerCase();
  const entries=horses.map(h=>({horse:h,race:races.find(r=>r.name===h.name)}));
  const filtered=entries.filter(row=>APP.stableFilter==='entered'?/entered/i.test(row.race?.status||''):
   APP.stableFilter==='targets'?Boolean(row.race):
   APP.stableFilter==='unassigned'?!row.race:true);
  const keys={name:row=>row.horse.name,activity:row=>row.horse.activity,
   race:row=>row.race?row.race.track+' '+row.race.date:'',
   status:row=>row.race?.status||row.horse.tag};
  const sorter=keys[APP.stableSort]||keys.name;
  filtered.sort((a,b)=>sorter(a).localeCompare(sorter(b),undefined,{numeric:true,sensitivity:'base'})*(APP.stableSortDesc?-1:1));
  const matching=filtered.filter(row=>(row.horse.name+' '+row.horse.activity+' '+(row.race?.track||'')+' '+(row.race?.status||'')+' '+row.horse.tag).toLowerCase().includes(q));
  const sort=(key,label)=>`<button data-ng="stable-sort" data-val="${key}" aria-label="Sort horses by ${label}" aria-pressed="${APP.stableSort===key?'true':'false'}">${label}${APP.stableSort===key?(APP.stableSortDesc?' ▼':' ▲'):''}</button>`;
  const options=[['all','ALL'],['targets','WITH TARGET'],['entered','ENTERED'],['unassigned','NO TARGET']];
  const filters=options.map(([key,label])=>`<button data-ng="stable-filter" data-val="${key}" class="${APP.stableFilter===key?'on':''}" aria-pressed="${APP.stableFilter===key?'true':'false'}">${label}</button>`).join('');
  const rowHTML=(row)=>{
   const h=row.horse,r=row.race,description=h.name+' '+h.activity+' '+(r?.track||'')+' '+(r?.status||'')+' '+h.tag;
   return `<button class="ng-managementrow ng-stable-row" data-ng="horse" data-val="${safe(h.name)}" data-search="${safe(description)}" ${q&&!description.toLowerCase().includes(q)?'hidden':''} aria-label="Open horse profile: ${safe(h.name)}"><strong class="ng-horse-with-owner">${horseOwnerBadge(h.name)}${safe(h.name)}</strong><span>${safe(h.activity)}</span><span>${safe(r?r.track+' · '+r.date:'No current race target')}</span><i class="${r&&/entered/i.test(r.status)?'ng-stable-entered':''}">${safe(r?r.status:h.tag)} ${glyph('right',12)}</i></button>`;
  };
  const raceRowsHTML=races.map((r,i)=>`<button class="ng-stable-fixture" data-ng="fixture" data-val="${i}" aria-label="Open ${safe(r.name)} racing target"><strong>${safe(r.name)}</strong><span>${safe(r.track)} · ${safe(r.date)}</span><small class="${/entered/i.test(r.status)?'entered':''}">${safe(r.status)}</small></button>`).join('')||'<div class="ng-empty-record">No known racing commitments.</div>';
  const horseCaseFiles=currentMessages().filter(m=>horses.some(h=>m.title.toLowerCase().includes(h.name.toLowerCase())));
  const caseHTML=horseCaseFiles.slice(0,5).map(m=>`<button class="ng-stable-fixture" data-ng="case" data-val="${safe(m.case)}"><strong>${safe(m.title)}</strong><span>${safe(m.from)}</span><small>${m.resolved?'REVIEWED':'OPEN'}</small></button>`).join('')||'<div class="ng-empty-record">No currently displayed files name a stable horse.</div>';
  return `<section class="ng-functional ng-stable-directory">
   <div class="ng-stable-summary">
    <div><strong>${horses.length}</strong><span>HORSES</span></div>
    <div><strong>${races.filter(r=>/entered/i.test(r.status)).length}</strong><span>ENTERED</span></div>
    <div><strong>${races.filter(r=>!/entered/i.test(r.status)).length}</strong><span>RACE TARGETS</span></div>
    <div><strong>${Object.keys(st.resolvedCases||{}).length}</strong><span>RECORDED DECISIONS</span></div>
   </div>
   <div class="ng-stable-toolbar"><label for="ngStableSearch">FIND HORSE</label><input id="ngStableSearch" data-ng-input="stable-search" type="search" value="${safe(APP.stableSearch)}" placeholder="Horse, activity, racecourse…" autocomplete="off"/><div class="ng-stable-filters">${filters}</div><span class="ng-stable-visible">${matching.length} OF ${horses.length} HORSES</span></div>
   <div class="ng-stable-workspace"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('horse')}" alt=""/></span><h3>STABLE HORSE DIRECTORY</h3><small>SELECT A HORSE TO OPEN ITS PROFILE</small></header><div class="ng-tableheaders ng-stable-tablehead">${sort('name','HORSE')}${sort('activity','CURRENT ACTIVITY')}${sort('race','NEXT RACE TARGET')}${sort('status','STATUS')}</div><div class="ng-stable-tablebody">${filtered.map(rowHTML).join('')||'<div class="ng-empty-record">No horses match this status filter.</div>'}</div></section>
   <div class="ng-stable-context"><section class="ng-card"><header class="ng-cardhead"><h3>RACE COMMITMENTS</h3><small>CONFIRMED VS TARGETED</small></header><div class="ng-stable-contextlist">${raceRowsHTML}</div><button class="ng-stable-context-footer" data-ng="menu" data-val="Racing">OPEN RACE CALENDAR ${glyph('arrow',12)}</button></section>
   <section class="ng-card"><header class="ng-cardhead"><h3>HORSE-NAMED OFFICE FILES</h3><small>LINKED CASES</small></header><div class="ng-stable-contextlist">${caseHTML}</div></section></div></div></section>`;
 }
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
function managerDashboard(){
 const section=APP.section||'Office',page=APP.page||'Overview';
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
   return role.includes(target)||(page==='Staff'&&role.includes('groom'));
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
function renderRoute(){const route=APP.custom?null:currentRoute();const title=route?.title||APP.custom||'Page';const kicker=route?.kicker||APP.section;const bdg=route?badge(({'Horse Profile':'horse','People Profile':'people','Farm Profile':'farm_stable','Track Profile':'track','Race Calendar':'meet_schedule','Stable':'farm_stable','Sales':'connections','News':'history','World':'track','Opportunity Board':'reputation'}[route.kicker])||'history'):pageBadge();
let body='';const profile=route&&/Profile$/.test(route.kicker)?profileDetail(route):null;const functional=route?functionalRoute(route):null;if(profile)body=profile;else if(functional)body=functional;else if(route)body=route.body;else if(APP.custom==='Organization Overview'){body=organizationOverview()}
else if(APP.custom==='Due Actions'){body=dueActionOverview()}
else if(['Messages','Decisions','Opportunities'].includes(APP.custom)){body=managerDashboard()}
else if(APP.custom==='Search'){body=searchView()}
else {body=managerDashboard()}
const isProfile=Boolean(profile),isOrganization=APP.custom==='Organization Overview',isSearch=APP.custom==='Search',isManager=body.startsWith('<section class="ng-manager-screen">');
return `<main class="ng-route ${isProfile?'ng-route-profile':isOrganization?'ng-route-organization':isSearch?'ng-route-search':isManager?'ng-route-manager':''}">${isProfile||isOrganization||isManager?'':`<header class="ng-routeheading"><span class="ng-route-badge-slot" aria-hidden="true">${APP.custom==='Organization Overview'?organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',true,true):`<img class="ng-routebadge" src="${safe(bdg)}" alt=""/>`}</span><div class="ng-routetext"><small>${safe(kicker)}</small><h1>${safe(title)}</h1></div><button class="ng-back" data-ng="office">← RACING OFFICE</button></header>`}<div class="ng-routegrid" data-route-key="${safe((route?.kicker||APP.custom||APP.section)+'|'+(route?.title||APP.custom||APP.page))}"><div class="ng-routeinner">${body}</div></div></main>`;}
function paint(){
 if(!APP.ready)return;
 const oldRoute=$('.ng-routegrid',root),oldTab=$('.ng-profiletabs .on',root)?.dataset.val||'';
 const previousRouteKey=oldRoute?.dataset.routeKey||'';
 const previousRouteScroll=oldRoute?.scrollTop||0;
 const previousDetailScroll=$('.ng-profile-view .ng-detail-cols',root)?.scrollTop||0;
 const oldCards=$$('.ng-profile-view .ng-detailcard',root).map((card,index)=>({
  key:index+'|'+($('header',card)?.textContent.trim()||''),
  scroll:card.scrollTop
 }));
 APP.activeCase=$('.left .msg.selected')?.dataset.case||APP.activeCase;
 const route=currentRoute();
 const stage=(route||APP.custom)?renderRoute():`<main class="ng-board">${inbox()}${center()}${right()}</main>`;
 root.innerHTML=header()+'<div class="ng-manager-shell">'+managerSidebar()+
   '<div class="ng-manager-stage">'+stage+'</div></div>';
 const nextRoute=$('.ng-routegrid',root),nextTab=$('.ng-profiletabs .on',root)?.dataset.val||'';
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
 const btn=e.target.closest('#wtwNextgen [data-ng],#wtwNextgen [data-act]');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 const key=btn.dataset.ng, val=btn.dataset.val||'';
 if(!key && btn.dataset.act){syntheticAction(btn);return}
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
 if(key==='tab')return pageTab(val);
 if(key==='office')return goOffice();
 if(key==='case'){APP.custom='';APP.section='Office';APP.page='Overview';selectMessage(val);return}
 if(key==='casecenter'){goOffice();const next=currentMessages().find(m=>!m.resolved);if(next)selectMessage(next.case);return}
 if(key==='caseprev')return selectAdjacentCase(-1);
 if(key==='casenext')return selectAdjacentCase(1);
 if(key==='nextopen')return selectAdjacentCase(1,true);
 if(key==='stable-sort'){if(APP.stableSort===val)APP.stableSortDesc=!APP.stableSortDesc;else{APP.stableSort=val;APP.stableSortDesc=false}return paint()}
 if(key==='stable-filter'){APP.stableFilter=val;return paint()}
 if(key==='filter'){APP.filter=val;APP.msgPage=0;return paint()}
 if(key==='prev-msg'){APP.msgPage=Math.max(0,APP.msgPage-1);return paint()}
 if(key==='next-msg'){APP.msgPage++;return paint()}
 if(key==='horse'){const row=$$('.right .rankRow').find(x=>$('strong',x)?.textContent.trim()===val);return bridgeNode(row)}
 if(key==='fixture'){const n=$$('.right .fixtureList .fixture[data-track]')[Number(val)];return bridgeNode(n)}
 if(key==='track'){const row=$$('.right .fixture').find(x=>x.dataset.track===val);if(row){const p=$('p',row);return bridgeNode(p)}return bridgeNode(originalAct('World'))}
 if(key==='move'){const n=$$('#moveGrid .moveCard')[Number(val)];bridgeNode(n);return}
 if(key==='profile-from-case'){return bridgeNode(originalAct('Horse Profile'))}
 if(key==='intel'){return bridgeNode($$('#intelGrid .intelCard')[Number(val)])}
 if(key==='outtab'){APP.outTab=Number(val);return paint()}
 if(key==='network-sort'){APP.networkSort=val;APP.networkPage=0;APP.networkFocus='';return paint()}
 if(key==='network-role'){APP.networkRole=val;APP.networkPage=0;APP.networkFocus='';return paint()}
 if(key==='network-page'){APP.networkPage=Math.max(0,APP.networkPage+Number(val));return paint()}
 if(key==='network-select'){APP.networkFocus=val;return paint()}
 if(key==='detailtab'){APP.detailTab=val;return paint()}
 if(key==='sourcebutton'){const n=$$('#routeBody [data-act]')[Number(val)];return bridgeNode(n)}
 if(key==='action'){const x=originalAct(val); if(x)return bridgeNode(x);if(val==='Open file')return bridgeNode(originalAct('Open file'));return}
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
  if(field.matches('select[data-ng-select="manager-screen"]')&&field.value){
  pageTab(field.value);
  return;
 }
 if(field.matches('select[data-ng-select="profile-record"]')&&field.value){
   APP.detailTab=field.value;
   paint();
  }
});
root.addEventListener('keydown',event=>{
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
root.addEventListener('input',event=>{
 const input=event.target;
 if(input.matches('input[data-ng-input="global-search"]')){
  APP.searchQuery=input.value;APP.searchPage=0;
  updateSearchRoster();
  return;
 }
 if(!input.matches('input[data-ng-input="stable-search"]'))return;
 APP.stableSearch=input.value;
 const query=APP.stableSearch.trim().toLowerCase();
 let visible=0;
 $$('.ng-stable-row',root).forEach(row=>{
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
document.body.append(root);document.body.classList.add('wtw-next-active');APP.ready=true;
restoreNextUIRoute();
// Restore direct route link: existing Office script owns history and route hydration.
paint();setTimeout(paint,110);
fetch('/assets/office/organization-logo-index.json',{credentials:'same-origin',cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Logo index unavailable');return r.json()})
 .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){organizationLogoIndex=index;schedulePaint(20)}})
 .catch(()=>{/* The neutral organization mark is intentional until a real logo is registered. */});
fetch('/assets/game/attribute-catalog.v1.json',{credentials:'same-origin',cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Attribute definitions unavailable');return r.json()})
 .then(data=>{if(data?.schema==='WTW_ATTRIBUTE_CATALOG_V1'&&data.horse_categories&&data.display?.horse_overview){athleteAttributeCatalog=data;schedulePaint(20)}})
 .catch(()=>{/* No guessed ratings or parallel definitions when catalog is unavailable. */});
fetch('/assets/office/decision-photo-index.json',{credentials:'same-origin',cache:'no-store'})
 .then(response=>{if(!response.ok)throw Error('Photo index unavailable');return response.json()})
 .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){officePhotoIndex=index;schedulePaint(20)}})
 .catch(()=>{/* The approved reference photograph is the intentional fallback. */});

window.__WTW_NEXT__={paint,app:APP,horseRows,racingRows,currentMessages,state};
})();
