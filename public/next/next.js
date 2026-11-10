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
const APP={section:'Office',page:'Office',custom:'',filter:'All',msgPage:0,focus:'',outTab:0,detailTab:'Overview',routeId:'',ready:false,activeCase:'powerline',paintQueued:false};
let officePhotoIndex=null; // Optional UI-only media references; no duplication of historical/game entities.
const genericDeskPhoto='/assets/office/approved-office-photo.jpg';
let organizationLogoIndex=null; // UI-only logo asset refs; organization authority stays in the game database.

const tabmap={Office:['Overview','Messages','Decisions','Calendar','News','Reports','Career'],History:['Race Results','Horses','People & Farms','Facilities & Tracks','Historical Calendar','Coverage'],Stable:['Overview','Horses','Training','Health','Race Plans','Barns'],Racing:['Overview','Calendar','Entries','Results','Stakes','Race Planning'],Breeding:['Overview','Stallions','Broodmares','Foals','Pedigrees','Stud Farms'],Sales:['Overview','Auctions','Catalogs','Watchlist','Private Offers'],Personnel:['Overview','Trainers','Jockeys','Owners','Staff'],Facilities:['Overview','Barns','Training Centers','Farms'],Finances:['Overview','Cash Flow','Operating Costs','Budgets'],World:['Overview','Tracks','Meets','Major Races','News']};
const actions={Office:'Office Overview',Stable:'Stable',Racing:'Race Calendar',Sales:'Sales',World:'World'};
const officeMenu={Overview:'Office Overview',Messages:'Filter All',Decisions:'Open move history',Calendar:'Open Race Calendar',News:'News',Reports:'Open move history',Career:'Open move history'};
const state=()=>{try{return JSON.parse(localStorage.getItem('wtwOfficeStateV30')||'{}')}catch{return {}}};
const originalAct=(act)=>{const o=$$('.app [data-act]').find(n=>n.dataset.act===act);return o||null;};
function bridgeNode(node){if(!node)return;node.click(); schedulePaint(15)}
function syntheticAction(el){const dummy=el.cloneNode(true); dummy.style.display='none'; document.body.appendChild(dummy);dummy.click();dummy.remove();schedulePaint(15)}
function goOffice(){APP.custom='';APP.section='Office';APP.page='Office';bridgeNode(originalAct('Office Overview'));paint()}
function openMenu(section){
 if(section==='History'){window.location.assign('/archive/?page=races');return}
 APP.section=section;APP.page='Overview';APP.custom='';
 if(actions[section])bridgeNode(originalAct(actions[section]));
 else{APP.custom=section; paint()}
}
function pageTab(name){if(APP.section==='History'){const pages={'Race Results':'races','Horses':'horses','People & Farms':'people','Facilities & Tracks':'tracks','Historical Calendar':'seasons','Coverage':'sources'};window.location.assign('/archive/?page='+encodeURIComponent(pages[name]||'races'));return}APP.page=name; const s=APP.section;
 if(s==='Office'){
   if(name==='Overview')return goOffice();
   if(name==='Messages'){APP.custom='Messages';return paint()}
   if(name==='Decisions'){APP.custom='Decisions';return paint()}
   if(name==='Calendar')return bridgeNode(originalAct('Race Calendar'));
   if(name==='News')return bridgeNode(originalAct('News'));
   if(name==='Reports'||name==='Career'){APP.custom=name;return paint()}
 }
 if(s==='Stable'&&(name==='Overview'||name==='Horses'))return bridgeNode(originalAct('Stable'));
 if(s==='Racing'&&(name==='Overview'||name==='Calendar'||name==='Entries'||name==='Stakes'))return bridgeNode(originalAct('Race Calendar'));
 if(s==='Sales'&&(name==='Overview'||name==='Auctions'))return bridgeNode(originalAct('Sales'));
 if(s==='World'&&(name==='Overview'||name==='Tracks'||name==='Meets'||name==='Major Races'))return bridgeNode(originalAct('World'));
 APP.custom=`${s} — ${name}`;paint();
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
function organizationLogoMarkup(id,name,kind='organization',large=false){
 const refs=organizationLogoIndex?.organizations||{};
 const keys=[id?kind+':'+id:'',kind+':'+name,kind==='stable'?'player':''].filter(Boolean);
 const src=keys.map(key=>officeAssetPath(refs[key])).find(Boolean);
 const initials=name==='YOUR STABLE'?'ST':name.split(/\s+/).slice(0,2).map(t=>t[0]||'').join('').toUpperCase().slice(0,2)||'ORG';
 const content=src?'<img class="ng-org-image" src="'+safe(src)+'" alt="" loading="lazy" decoding="async"/>':
  '<span class="ng-org-initials" aria-hidden="true">'+safe(initials)+'</span>';
 return '<span class="ng-org-mark'+(large?' ng-org-mark-large':'')+'" data-placeholder="'+safe(initials)+'" aria-label="'+safe(src?'Approved logo for '+name:'Temporary logo placeholder for '+name)+'">'+content+'</span>';
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
function openOrganization(){APP.custom='Organization Overview';APP.section='Office';APP.page='Overview';paint()}


/* Full operation overview using only the live Office state; no additional ledger. */
function organizationOverview(){
 const org=playerOrganization(),st=state(),horses=horseRows(),races=racingRows(),messages=currentMessages(),follow=openFollowUps(),due=dueActions();
 const leads=document.querySelectorAll('.app .oppList .oppItem').length;
 const entered=races.filter(r=>/Entered/i.test(r.status)).length;
 const stat=(label,value)=>'<div><strong>'+safe(value)+'</strong><small>'+safe(label)+'</small></div>';
 const link=(key,val,title,desc)=>'<button data-ng="'+safe(key)+'" data-val="'+safe(val)+'"><strong>'+safe(title)+'</strong><span>'+safe(desc)+'</span>'+glyph('right',14)+'</button>';
 const panel=(title,linkLabel,key,val,body)=>'<section class="ng-org-overview-panel"><header><h3>'+safe(title)+'</h3><button data-ng="'+safe(key)+'" data-val="'+safe(val)+'">'+safe(linkLabel)+' '+glyph('arrow',12)+'</button></header><div class="ng-org-overview-list">'+(body||'<p>No matching records in the current Office.</p>')+'</div></section>';
 const horseRowsHTML=horses.map(h=>link('horse',h.name,h.name,h.activity||'Stable file')).join('');
 const raceRowsHTML=races.map((r,i)=>link('fixture',i,r.name,r.date+' · '+r.track+' · '+r.status)).join('');
 const dueRowsHTML=follow.map(f=>link('followup',f.id,f.caseTitle||f.caseId||'Follow-up',(f.dueDate||'No date')+' · '+(due.includes(f)?'DUE':'OPEN'))).join('');
 const decisionRowsHTML=messages.filter(m=>!m.resolved).map(m=>link('case',m.case,m.title,m.from)).join('');
 const financialStatus=typeof st.finances?.stable?.status==='string'?st.finances.stable.status:'Financial baseline not established';
 const cash=availableCash();
 const finance='<div class="ng-org-finance"><small>AVAILABLE CASH</small><strong>'+safe(cashDisplay())+'</strong><p>'+safe(financialStatus)+(cash===null?' · No verified dollar amount':'')+'</p></div>';
 const navigation='<div class="ng-org-shortcuts"><button data-ng="menu" data-val="Finances">FINANCES</button><button data-ng="custom" data-val="Opportunities">OPPORTUNITIES ('+leads+')</button><button data-ng="menu" data-val="Sales">SALES</button><button data-ng="menu" data-val="Personnel">PEOPLE</button><button data-ng="menu" data-val="Facilities">FACILITIES</button></div>';
 return '<div class="ng-org-overview"><div class="ng-org-overview-top">'+organizationLogoMarkup(org.id,org.name,'stable',true)+
  '<div class="ng-org-overview-name"><small>YOUR RACING OPERATION</small><h2>'+safe(org.name)+'</h2><p>All current management commitments, sourced from this Office save.</p></div></div>'+
  '<div class="ng-org-overview-stats">'+stat('HORSES',horses.length)+stat('RACE TARGETS',races.length)+stat('CONFIRMED ENTRIES',entered)+stat('OPEN CASES',messages.filter(m=>!m.resolved).length)+stat('DUE',due.length)+stat('OPPORTUNITIES',leads)+'</div>'+
  '<div class="ng-org-overview-grid">'+panel('STABLE ROSTER','ALL HORSES','menu','Stable',horseRowsHTML)+panel('RACING COMMITMENTS','CALENDAR','menu','Racing',raceRowsHTML)+
  panel('FOLLOW-UPS','DECISION DESK','office','',dueRowsHTML)+panel('OPEN DECISIONS','ALL DECISIONS','tab','Decisions',decisionRowsHTML)+
  '<section class="ng-org-overview-panel"><header><h3>FINANCES & OPERATIONS</h3></header>'+finance+navigation+'</section></div></div>';
}
function dueActionOverview(){
 const due=dueActions();
 const rows=due.map(f=>'<button data-ng="followup" data-val="'+safe(f.id)+'"><strong>'+safe(f.caseTitle||f.caseId||'Follow-up')+'</strong><span>'+safe((f.dueDate||'Due')+' · '+(f.text||'Follow-up is due'))+'</span>'+glyph('right',14)+'</button>').join('');
 return '<div class="ng-due-overview"><h2>DUE MANAGEMENT ACTIONS</h2><p>Follow-ups requiring attention before you advance the calendar.</p><div class="ng-org-overview-list">'+(rows||'<p>No follow-ups are due right now.</p>')+'</div><button data-ng="office">BACK TO RACING OFFICE</button></div>';
}

function header(){
 const date=$('.dateChip')?.textContent.trim()||'2014-07-15';
 const due=dueActions();
 return `<header class="ng-global" aria-label="Wire to Wire application navigation">
  <div class="ng-hist"><button data-ng="back" aria-label="Previous page" title="Previous page">${glyph('left',15)}</button><button data-ng="forward" aria-label="Next page" title="Next page">${glyph('right',15)}</button></div>
  <button class="ng-mini-home" data-ng="office" title="Racing Office" aria-label="Go to Racing Office"><img class="ng-logo-mini" src="/assets/wtw-office-approved-logo.png" alt="Wire to Wire"/></button>
  <nav class="ng-primary" aria-label="Primary game navigation">${Object.keys(tabmap).map(x=>`<button data-ng="menu" data-val="${x}" class="${APP.section===x?'on':''}">${x.toUpperCase()}${glyph('chevron',11)}</button>`).join('')}</nav>
  <div class="ng-global-tools"><button class="ng-iconbtn" data-ng="custom" data-val="Search" aria-label="Search">${glyph('search',17)}</button><button class="ng-iconbtn" data-ng="custom" data-val="Messages" aria-label="Inbox">${glyph('mail',17)}<i></i></button><button class="ng-iconbtn" data-ng="action" data-val="Save" aria-label="Save game">${glyph('save',17)}</button></div>
  <button class="ng-global-date" data-ng="menu" data-val="Racing" title="Open calendar for in-world date ${safe(date)}" aria-label="In-world date ${safe(date)}. Open racing calendar"><span>GAME DATE</span><strong>${safe(date)}</strong></button>
  <button class="ng-global-cash" data-ng="organization" title="Available cash from the saved game; dash means no baseline recorded" aria-label="Available cash: ${safe(cashDisplay())}. Open stable overview"><small>CASH</small><strong>${safe(cashDisplay())}</strong></button>
  ${due.length?'<button class="ng-global-due" data-ng="due" title="Review due management follow-ups">'+glyph('alert',13)+' DUE '+due.length+'</button>':''}
  <button class="ng-global-continue" data-ng="action" data-val="Continue" title="Advance in-world game" aria-label="Continue game">${glyph('play',14)}<span>CONTINUE</span>${glyph('right',15)}</button>
 </header>
 <div class="ng-subbar"><nav class="ng-subnav" aria-label="Section navigation">${(tabmap[APP.section]||['Overview']).map(x=>`<button data-ng="tab" data-val="${safe(x)}" class="${APP.page===x||(APP.page==='Office'&&x==='Overview')?'on':''}">${safe(x)}</button>`).join('')}</nav></div>`;
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
return `<section class="ng-main"><section class="ng-card ng-feature"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('folder',17)}</span><div class="ng-headinggroup"><h3>Decision Desk</h3><span>THE MANAGER'S PRIORITY FILE</span></div><button class="ng-org-chip" data-ng="organization" aria-label="Open your stable operations overview" title="View every part of your racing operation">${organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable')}<span class="ng-org-chip-copy"><strong>${safe(playerOrganization().name)}</strong><small>ORGANIZATION OVERVIEW ${glyph('right',11)}</small></span></button><div class="ng-case-navigation"><div class="ng-case-pips" aria-label="Select today's case">${messages.map((m,i)=>`<button type="button" data-ng="case" data-val="${safe(m.case)}" class="ng-case-pip ${m.case===APP.activeCase?'on':''} ${m.resolved?'reviewed':m.urgent?'priority':''}" title="${safe(m.title)}${m.resolved?' — Reviewed':''}" aria-label="Case ${i+1}: ${safe(m.title)}" aria-current="${m.case===APP.activeCase?'true':'false'}"></button>`).join('')}</div><span class="ng-case-position"><span class="ng-live-dot"></span>${String(index).padStart(2,'0')} / ${String(messages.length).padStart(2,'0')}</span><div class="ng-case-arrows"><button type="button" data-ng="caseprev" aria-label="Previous decision" title="Previous case">${glyph('left',13)}</button><button type="button" data-ng="casenext" aria-label="Next decision" title="Next case">${glyph('right',13)}</button></div></div></header><div class="ng-featurebody"><div class="ng-case"><div class="ng-case-eyebrow"><span></span>${safe(d.type)} <i>·</i> ${safe(msg?.from||source)}</div><div class="ng-casetitle ng-static-title"><h2>${safe(d.title)}</h2></div><p class="ng-case-summary">${safe(d.summary)}</p><div class="ng-facts">${[['Pressure',d.pressure],['Primary risk',d.risk],['Manager read',d.read]].map((f,i)=>`<div class="ng-fact ng-fact-${i}"><small>${safe(f[0])}</small><b>${safe(f[1])}</b></div>`).join('')}</div><div class="ng-caseactions"><button data-ng="action" data-val="Open file">REVIEW FULL FILE ${glyph('arrow',14)}</button>${relatedAction}</div></div><div class="ng-featurephoto">${decisionScene(d)}</div></div></section><div class="ng-centerbottom"><section class="ng-card ng-intel"><header class="ng-cardhead"><span class="ng-sectionicon">${glyph('sparkle',16)}</span><div class="ng-headinggroup"><h3>Intelligence</h3><span>${d.intel.length} SOURCE READS</span></div><button class="ng-cardlink" data-ng="action" data-val="Open current source">${safe(source)} ${glyph('arrow',12)}</button></header><div class="ng-intelgrid">${d.intel.map((item,i)=>`<button class="ng-intelitem ng-intel-${i%4}" data-ng="intel" data-val="${i}"><span class="ng-intel-kicker" aria-label="Source ${i+1}"><span class="ng-intel-marker"></span>0${i+1}</span><b>${safe(item.title)}</b><p>${safe(item.body)}</p></button>`).join('')}</div></section><section class="ng-card ng-choices"><header class="ng-cardhead"><span class="ng-sectionicon gold">${glyph('flag',16)}</span><div class="ng-headinggroup"><h3>Your Call</h3><span>MANAGEMENT DECISION</span></div><span class="ng-choice-count">${resolved?'RECORDED':`${d.moves.length} OPTIONS`}</span></header><div class="ng-moves">${moves}</div></section></div></section>`;
}
function right(){const horses=horseRows(),races=racingRows();const leads=document.querySelectorAll('.app .oppList .oppItem').length;const entered=races.filter(r=>/entered/i.test(r.status)).length;
return `<aside class="ng-right"><section class="ng-card ng-roster"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('horse')}" alt=""/></span><div class="ng-headinggroup"><h3>Stable Roster</h3><span>${horses.length} HORSES · CURRENT ACTIVITY</span></div><button class="ng-cardlink" data-ng="menu" data-val="Stable">ALL ${glyph('arrow',12)}</button></header><div class="ng-rostercolumns"><span>HORSE / ACTIVITY</span><span>STATUS</span></div><div class="ng-rosterrows">${horses.length?horses.map(h=>`<button class="ng-rosterrow" aria-label="Open horse profile: ${safe(h.name)}" data-ng="horse" data-val="${safe(h.name)}"><span class="ng-rostername">${safe(h.name)}</span><span class="ng-horseact">${safe(h.activity)}</span><span class="ng-rostertag">${safe(h.tag)}</span></button>`).join(''):'<div class="ng-rail-empty">No horses are listed for this stable yet.</div>'}</div></section><section class="ng-card ng-races"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><div class="ng-headinggroup"><h3>Race Schedule</h3><span>UPCOMING ENTRIES & TARGETS</span></div><button class="ng-cardlink" data-ng="menu" data-val="Racing">FULL ${glyph('arrow',12)}</button></header><div class="ng-entrycolumns"><span>DATE</span><span>HORSE / RACECOURSE</span><span>STATUS</span></div><div class="ng-entrylist">${races.length?races.map((r,i)=>`<button class="ng-entryrow" aria-label="Open race target: ${safe(r.name)} at ${safe(r.track)}" data-ng="fixture" data-val="${i}"><span class="ng-entrydate">${safe(r.date)}</span><span class="ng-entrycopy"><b>${safe(r.name)}</b><span><i class="ng-flag-us" aria-label="United States" role="img"></i> ${safe(r.track)}</span></span><span class="ng-entrytag"><b>${safe(r.tag)}</b><small class="${/entered/i.test(r.status)?'entered':''}">${safe(r.status.replace('·','').trim())}</small></span></button>`).join(''):'<div class="ng-rail-empty">No upcoming race targets are currently recorded.</div>'}</div></section><button class="ng-leads" data-ng="custom" data-val="Opportunities"><span class="ng-lead-star">${glyph('sparkle',16)}</span><strong>OPPORTUNITIES</strong><span>${leads?`${leads} CURRENT LEADS`:"NO CURRENT LEADS"}</span>${glyph('right',16)}</button></aside>`;
}
const currentRoute=()=>{const el=$('#routeShell');if(!el||el.hidden)return null;return {kicker:$('#routeKicker')?.textContent.trim()||'Page',title:$('#routeTitle')?.textContent.trim()||'Page',body:$('#routeBody')?.innerHTML||'',badge:$('.wtwRouteBadge',el)?.getAttribute('src')||badge('history')}};
const pageBadge=()=>{const map={Stable:'farm_stable',Racing:'major_races',Sales:'connections',Breeding:'pedigree',Personnel:'people',Facilities:'farm_stable',Finances:'reputation',World:'track',Search:'history',Messages:'people',Decisions:'career_record',Reports:'history',Career:'achievements',Opportunities:'reputation'};return badge(map[APP.custom.split(' ')[0]]||map[APP.section]||'history')};

function profileDetail(route){
 const source=$('#routeBody .profilePage');if(!source)return null;
 const id=route.kicker+'|'+route.title;
 if(APP.routeId!==id){APP.routeId=id;APP.detailTab='Overview'}
 const text=(query,scope=source)=>$(query,scope)?.textContent.trim()||'';
 const fields=$$('.profileField',source).map(n=>({label:text('span',n),value:text('strong',n)||'—'}));
 const connection=$$('.profileLine',source).map(n=>({label:text('b',n),value:n.querySelector('button')?.textContent.trim()||n.querySelector('span')?.textContent.trim()||n.textContent.trim().replace(text('b',n),'').trim()||'—',button:n.querySelector('button')}));
 const blood=$$('.pedigreeNode',source).map(n=>({label:text('span',n),value:text('strong',n)||'—'}));
 const record=$$('.recordStat',source).map(n=>({label:text('span',n),value:text('b',n)||'—'}));
 const states=$$('.profileStatePill',source).map(n=>n.textContent.trim());
 const notes=$$('.achievementItem',source).map(n=>n.textContent.trim()).filter(Boolean);
 const details=$$('.profilePanel',source).map(n=>({title:text('h3',n),lines:n.textContent.trim().slice(0,700)}));
 const trackRaces=$$('.stakesRow',source).map((n,i)=>({name:text('strong',n),date:n.textContent.trim(),node:n,index:i}));
 const tabs=(route.kicker==='Horse Profile'?['Overview','Career Record','Pedigree','Connections','History']:route.kicker==='Track Profile'?['Overview','Meet Schedule','Major Races','Connections','History']:['Overview','Connections','History']);
 const rows=(items)=>'<div class="ng-data-rows">'+items.map(i=>`<div class="ng-data-row"><span>${safe(i.label)}</span><strong>${safe(i.value)}</strong></div>`).join('')+'</div>';
 const pills='<div class="ng-status-pills">'+states.slice(0,4).map(x=>`<span>${safe(x)}</span>`).join('')+'</div>';
 const tabbar='<nav class="ng-profiletabs">'+tabs.map(t=>`<button data-ng="detailtab" data-val="${safe(t)}" class="${APP.detailTab===t?'on':''}">${safe(t)}</button>`).join('')+'</nav>';
 const factsBlock=`<div class="ng-profile-facts">${fields.map(f=>`<div><small>${safe(f.label)}</small><strong>${safe(f.value)}</strong></div>`).join('')}</div>`;
 const isOrganizationProfile=/^(?:Farm|Stable|Organization|Sales Organization|Ownership Group|Breeding Farm) Profile$/.test(route.kicker);
 const profileMark=isOrganizationProfile?organizationLogoMarkup('',route.title,route.kicker==='Farm Profile'?'farm':'organization',true):`<div class="ng-profile-badgeframe"><img src="${badge(route.kicker==='Horse Profile'?'horse':route.kicker==='Track Profile'?'track':route.kicker==='People Profile'?'people':'farm_stable')}" alt="Approved ${safe(route.kicker)} badge"/></div>`;
 const identity=`<div class="ng-profile-intro">
  ${profileMark}
  <div class="ng-profile-identity"><div class="ng-profile-breadcrumb">${safe(route.kicker)} <span> / </span> Current Office</div><h2>${safe(route.title)}</h2><p>${safe(text('.profileSubline')||'Active source-linked office record')}</p>${pills}</div>
  <div class="ng-profile-tools"><button data-ng="office" aria-label="Return to Racing Office">← OFFICE</button><button data-ng="menu" data-val="${route.kicker==='Track Profile'?'Racing':'Stable'}">${route.kicker==='Track Profile'?'RACE CALENDAR':'STABLE DIRECTORY'} ↗</button></div>
 </div>`;
 let left='',right='',footer='';
 if(APP.detailTab==='Overview'){
  left=`<section class="ng-detailcard"><header>IDENTITY & STATUS</header>${factsBlock}</section>`;
  right=`<section class="ng-detailcard"><header>${route.kicker==='Track Profile'?'RACING & LOCATION':'CONNECTIONS'}</header>${rows(connection.slice(0,6))}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>LATEST OFFICE CONTEXT</header><div class="ng-notes">${(notes.length?notes:['No separate performance history is connected to this Office record yet.']).slice(0,4).map(n=>`<div>${safe(n)}</div>`).join('')}</div></section>`;
 }else if(APP.detailTab==='Career Record'){
  left=`<section class="ng-detailcard"><header>CAREER RESULTS</header><div class="ng-kpis">${record.map(r=>`<div><strong>${safe(r.value)}</strong><small>${safe(r.label)}</small></div>`).join('')}</div></section>`;
  right=`<section class="ng-detailcard"><header>HORSE STATUS</header>${factsBlock}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>CAREER NOTES & DECISIONS</header><div class="ng-notes">${notes.map(n=>`<div>${safe(n)}</div>`).join('')||'No certified historical starts available.'}</div></section>`;
 }else if(APP.detailTab==='Pedigree'){
  left=`<section class="ng-detailcard"><header>PATERNAL LINE</header>${rows(blood.slice(0,3))}</section>`;
  right=`<section class="ng-detailcard"><header>MATERNAL LINE</header>${rows(blood.slice(3))}</section>`;
  footer=`<section class="ng-detailcard ng-detailwide"><header>BLOODLINE AUTHORITY</header><div class="ng-notes">No pedigree is invented when the approved source has not yet connected a horse.</div></section>`;
 }else if(APP.detailTab==='Connections'){
  left=`<section class="ng-detailcard"><header>PEOPLE & FARM CONNECTIONS</header><div class="ng-data-rows">${connection.map(f=>`<div class="ng-data-row"><span>${safe(f.label)}</span>${f.button?`<button data-ng="sourcebutton" data-val="${$$('#routeBody [data-act]').indexOf(f.button)}">${safe(f.value)} ↗</button>`:`<strong>${safe(f.value)}</strong>`}</div>`).join('')}</div></section>`;
  right=`<section class="ng-detailcard"><header>OFFICE CONTEXT</header>${factsBlock}</section>`;
 }else if(APP.detailTab==='Meet Schedule'||APP.detailTab==='Major Races'){
  left=`<section class="ng-detailcard ng-detailwide"><header>TRACK EVENTS & SIGNATURE STAKES</header><div class="ng-compact-list">${(trackRaces.length?trackRaces:[]).slice(0,12).map(r=>`<button data-ng="sourcebutton" data-val="${$$('#routeBody [data-act]').indexOf(r.node)}"><b>${safe(r.name)}</b><span>${safe(r.date.slice(r.name.length))}</span><i>›</i></button>`).join('')||'<p>No approved race calendar data linked yet.</p>'}</div></section>`;
 }else{
  left=`<section class="ng-detailcard ng-detailwide"><header>HISTORY & RECORDS</header><div class="ng-notes">${(notes.length?notes:details.map(x=>x.lines)).slice(0,8).map(n=>`<div>${safe(n)}</div>`).join('')||'No official history connected yet.'}</div></section>`;
 }
 const actions=`<div class="ng-detailactions"><button data-ng="menu" data-val="Stable">OPEN STABLE ↗</button><button data-ng="menu" data-val="Racing">RACE CALENDAR ↗</button><button data-ng="office">BACK TO OFFICE</button></div>`;
 return `<div class="ng-profile-view">${identity}${tabbar}<div class="ng-detail-cols">${left}${right}${footer}</div>${actions}</div>`;
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
  const horses=horseRows(), races=racingRows();const st=state();
  return `<section class="ng-functional"><div class="ng-functionalstats"><div><b>${horses.length}</b><span>Horses in current office</span></div><div><b>${races.length}</b><span>Race targets under review</span></div><div><b>${Object.keys(st.resolvedCases||{}).length}</b><span>Office decisions recorded</span></div></div><div class="ng-functionalcontent"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('horse')}" alt=""/></span><h3>ALL HORSES · CURRENT STABLE</h3><small>${horses.length} ACTIVE FILES</small></header><div class="ng-tableheaders"><span>HORSE</span><span>OFFICE ACTIVITY</span><span>RACE TARGET</span><span>STATUS</span></div>${horses.map(h=>{const race=races.find(r=>r.name===h.name);return `<button class="ng-managementrow" data-ng="horse" data-val="${safe(h.name)}"><strong>${safe(h.name)}</strong><span>${safe(h.activity)}</span><span>${safe(race?race.track+' · '+race.date:'No scheduled target')}</span><i>${safe(h.tag)} ›</i></button>`}).join('')}</section><section class="ng-card ng-sideinfo"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('connections')}" alt=""/></span><h3>STABLE COMMAND</h3></header><div class="ng-commandnotes"><strong>Manager's daily overview</strong><p>Horse names open their individual racing profiles. All status information comes from the same Office state and updates after decisions.</p><button data-ng="menu" data-val="Racing">VIEW RACE CALENDAR ↗</button><button data-ng="custom" data-val="Opportunities">REVIEW OPPORTUNITIES ↗</button></div></section></div></section>`;
 }
 if(route.kicker==='Race Calendar'){
  const races=racingRows();const entered=races.filter(r=>/Entered/i.test(r.status)).length;
  const nonraces=$$('.right .fixtureList .fixture:not([data-track])').map(n=>({date:$('.d',n)?.textContent.trim()||'',name:$('h4',n)?.textContent.trim()||'',detail:$('p',n)?.textContent.trim()||''}));
  return `<section class="ng-functional"><div class="ng-functionalstats"><div><b>${races.length}</b><span>Upcoming racing targets</span></div><div><b>${entered}</b><span>Entries confirmed</span></div><div><b>${races.length-entered}</b><span>Targets under consideration</span></div></div>${calendarTimeline(races,nonraces)}<div class="ng-functionalcontent"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/></span><h3>RACING CALENDAR & ENTRIES</h3><small>SOURCE-CONNECTED TARGETS</small></header><div class="ng-tableheaders ng-raceheaders"><span>DATE</span><span>HORSE</span><span>RACECOURSE</span><span>STATUS</span></div>${races.map(r=>`<div class="ng-managementrow ng-racerow"><span>${safe(r.date)}</span><button data-ng="horse" data-val="${safe(r.name)}">${safe(r.name)} ↗</button><button data-ng="track" data-val="${safe(r.track)}">🇺🇸 ${safe(r.track)} · ${safe(r.tag)} ↗</button><i class="${/Entered/i.test(r.status)?'ng-entered':''}">${safe(r.status.replace('·','').trim())}</i></div>`).join('')}</section><section class="ng-card ng-sideinfo"><header class="ng-cardhead"><span class="ng-badge-slot" aria-hidden="true"><img class="ng-headicon" src="${badge('history')}" alt=""/></span><h3>OTHER COMMITMENTS</h3></header><div class="ng-commandnotes">${nonraces.map(r=>`<div class="ng-commitment"><small>${safe(r.date)}</small><strong>${safe(r.name)}</strong><span>${safe(r.detail)}</span></div>`).join('')}<p>Targets are not reported as confirmed entries until the original decision engine records them.</p></div></section></div></section>`;
 }
 return null;
}
function renderRoute(){const route=currentRoute();const title=route?.title||APP.custom||'Page';const kicker=route?.kicker||APP.section;const bdg=route?badge(({'Horse Profile':'horse','People Profile':'people','Farm Profile':'farm_stable','Track Profile':'track','Race Calendar':'meet_schedule','Stable':'farm_stable','Sales':'connections','News':'history','World':'track','Opportunity Board':'reputation'}[route.kicker])||'history'):pageBadge();
let body='';const profile=route&&/Profile$/.test(route.kicker)?profileDetail(route):null;const functional=route?functionalRoute(route):null;if(profile)body=profile;else if(functional)body=functional;else if(route)body=route.body;else if(APP.custom==='Organization Overview'){body=organizationOverview()}
else if(APP.custom==='Due Actions'){body=dueActionOverview()}
else if(APP.custom==='Messages'){body=`<section class="ng-customcard"><h3>Messages and correspondence</h3><p>Select any item to return to the Decision Desk and review its options.</p>${currentMessages().map(m=>`<button data-ng="case" data-val="${safe(m.case)}">${safe(m.from)} — ${safe(m.title)}</button>`).join('')}</section>`}
else if(APP.custom==='Decisions'){body=`<section class="ng-customcard"><h3>Today's Decisions</h3>${currentMessages().map(m=>`<button data-ng="case" data-val="${safe(m.case)}">${safe(m.title)} ↗</button>`).join('')}</section>`}
else if(APP.custom==='Opportunities'){body=`<section class="ng-customcard"><h3>Opportunity Board</h3><p>Uncommitted racing and commercial leads from the Office's original data.</p><button data-ng="action" data-val="Open opportunity board">OPEN EXISTING OPPORTUNITY BOARD ↗</button></section>`}
else if(APP.custom==='Search'){body=`<section class="ng-customcard"><h3>Find a horse or racetrack</h3><p>Search across the horses and racecourses currently connected to this Office.</p>${horseRows().map(h=>`<button data-ng="horse" data-val="${safe(h.name)}">${safe(h.name)}</button>`).join('')}${racingRows().map(r=>`<button data-ng="track" data-val="${safe(r.track)}">${safe(r.track)}</button>`).join('')}</section>`}
else {const category=APP.custom||APP.section;const features=(tabmap[APP.section]||[]).filter(x=>x!=='Overview');body=`<div class="ng-custompage">${features.map(x=>`<section class="ng-customcard"><h3>${safe(x)}</h3><p>The ${safe(category)} view is reserved for source-connected records. We won't invent figures, horse IDs, or outcomes.</p><button data-ng="tab" data-val="${safe(x)}">OPEN ${safe(x).toUpperCase()} ↗</button></section>`).join('')}</div>`}
const isProfile=Boolean(profile);
return `<main class="ng-route ${isProfile?'ng-route-profile':''}">${isProfile?'':`<header class="ng-routeheading"><span class="ng-route-badge-slot" aria-hidden="true">${APP.custom==='Organization Overview'?organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',true):`<img class="ng-routebadge" src="${safe(bdg)}" alt=""/>`}</span><div class="ng-routetext"><small>${safe(kicker)}</small><h1>${safe(title)}</h1></div><button class="ng-back" data-ng="office">← RACING OFFICE</button></header>`}<div class="ng-routegrid"><div class="ng-routeinner">${body}</div></div></main>`;}
function paint(){if(!APP.ready)return;APP.activeCase=$('.left .msg.selected')?.dataset.case||APP.activeCase;const route=currentRoute();root.innerHTML=header()+((route||APP.custom)?renderRoute():`<main class="ng-board">${inbox()}${center()}${right()}</main>`);}
function schedulePaint(ms=0){if(APP.paintQueued)return;APP.paintQueued=true;setTimeout(()=>{APP.paintQueued=false;paint()},ms)}
// Capture new UI clicks before the old Office's document-level delegated handler.
window.addEventListener('click',e=>{
 const btn=e.target.closest('#wtwNextgen [data-ng],#wtwNextgen [data-act]');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 const key=btn.dataset.ng, val=btn.dataset.val||'';
 if(!key && btn.dataset.act){syntheticAction(btn);return}
 if(key==='organization')return openOrganization();
 if(key==='due'){APP.section='Office';APP.page='Overview';APP.custom='Due Actions';return paint()}
 if(key==='followup'){
  const item=openFollowUps().find(f=>String(f.id)===val);
  if(!item||!item.caseId)return;
  APP.custom='';APP.section='Office';APP.page='Overview';
  return selectMessage(item.caseId);
 }
 if(key==='menu')return openMenu(val);
 if(key==='tab')return pageTab(val);
 if(key==='office')return goOffice();
 if(key==='case'){APP.custom='';APP.section='Office';APP.page='Overview';selectMessage(val);return}
 if(key==='casecenter'){goOffice();const next=currentMessages().find(m=>!m.resolved);if(next)selectMessage(next.case);return}
 if(key==='caseprev')return selectAdjacentCase(-1);
 if(key==='casenext')return selectAdjacentCase(1);
 if(key==='nextopen')return selectAdjacentCase(1,true);
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
 if(key==='detailtab'){APP.detailTab=val;return paint()}
 if(key==='sourcebutton'){const n=$$('#routeBody [data-act]')[Number(val)];return bridgeNode(n)}
 if(key==='action'){const x=originalAct(val); if(x)return bridgeNode(x);if(val==='Open file')return bridgeNode(originalAct('Open file'));return}
 if(key==='custom'){if(val==='Opportunities')return bridgeNode(originalAct('Open opportunity board'));APP.custom=val;return paint()}
 if(key==='back'){return bridgeNode(originalAct('Back'))}
 if(key==='forward'){return bridgeNode(originalAct('Forward'))}
},true);
window.addEventListener('popstate',()=>schedulePaint(40));
// Avoid recursive mutation observations: only observe the original (hidden) app.
const adapter=$('.app');if(adapter){const mo=new MutationObserver(()=>schedulePaint(30));mo.observe(adapter,{subtree:true,characterData:true,childList:true,attributes:true,attributeFilter:['class','title']})}
const route=$('#routeShell');if(route){const mo=new MutationObserver(()=>schedulePaint(30));mo.observe(route,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['hidden']})}
root.addEventListener('error',event=>{
 const img=event.target;if(img?.tagName!=='IMG')return;
 if(img.classList.contains('ng-org-image')){
   const mark=img.closest('.ng-org-mark');
   if(mark){img.remove();const label=document.createElement('span');label.className='ng-org-initials';label.textContent='ORG';mark.append(label)}
   return;
 }
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
// Restore direct route link: existing Office script owns history and route hydration.
paint();setTimeout(paint,110);
fetch('/assets/office/organization-logo-index.json',{credentials:'same-origin',cache:'no-store'})
 .then(r=>{if(!r.ok)throw Error('Logo index unavailable');return r.json()})
 .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){organizationLogoIndex=index;schedulePaint(20)}})
 .catch(()=>{/* The neutral organization mark is intentional until a real logo is registered. */});
fetch('/assets/office/decision-photo-index.json',{credentials:'same-origin',cache:'no-store'})
 .then(response=>{if(!response.ok)throw Error('Photo index unavailable');return response.json()})
 .then(index=>{if(index&&typeof index==='object'&&!Array.isArray(index)){officePhotoIndex=index;schedulePaint(20)}})
 .catch(()=>{/* The approved reference photograph is the intentional fallback. */});

window.__WTW_NEXT__={paint,app:APP,horseRows,racingRows,currentMessages,state};
})();
