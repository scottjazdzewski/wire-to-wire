/* WIRE TO WIRE historical source-view prototype: no source mutations. */
const $ = id => document.getElementById(id);
const escapeHTML = value => String(value??'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const h = escapeHTML;
const fields = {
  entity: {name:'Registered / display name',summary:'Profile summary',foal_year:'Foaling year',sex:'Sex',role:'Person role',status:'Verification status'},
  race: {name:'Race name',year:'Race year',date:'Race date',track_name:'Racing venue',status:'Source status'},
  connection: {party_id:'Connected owner / trainer / person ID',year:'Season',role:'Connection role',basis:'Evidence basis'},
  result: {horse_id:'Placed horse ID',position:'Finishing position'}
};
const state = {page:'overview',year:1953,calendarMonth:null,role:'trainer',involvement:'balanced',search:'',trackDirectory:null,data:null,mode:'LOADING',changes:[],nameEdits:[],availableYears:[],edit:null,rename:null,apiIssue:''};
const GAME_PREF_KEY = 'wtw_game_manager_preferences_v1';
try { const saved=JSON.parse(localStorage.getItem(GAME_PREF_KEY)||'{}'); if(['owner','trainer','farm','breeder','jockey'].includes(saved.role))state.role=saved.role; if(['hands-on','balanced','executive'].includes(saved.involvement))state.involvement=saved.involvement; } catch {}
// Deep links from the main Racing Office open the existing protected historical archive.
const archivePage = new URLSearchParams(window.location.search).get('page');
if (['overview','seasons','horses','people','tracks','races','search','changes','sources'].includes(archivePage)) state.page=archivePage;
const SAMPLE_KEY = 'wtw_canon_desk_local_proposals_v1';
let toastTimeout;
function storedChanges(){try{return JSON.parse(localStorage.getItem(SAMPLE_KEY)||'[]')}catch{return []}}
function storeChanges(){try{localStorage.setItem(SAMPLE_KEY,JSON.stringify(state.changes))}catch{}}
function pill(text,style=''){return `<span class="ribbon ${style}">${h(text)}</span>`}
let entityIndex=new Map(),raceIndex=new Map(),resultIndex=new Map(),winIndex=new Map(),partyIndex=new Map();
function entity(id){return entityIndex.get(id)}
function race(id){return raceIndex.get(id)}
function rebuildResultIndex(){
 entityIndex=new Map((state.data?.entities||[]).map(v=>[v.id,v]));
 raceIndex=new Map((state.data?.races||[]).map(v=>[v.id,v]));
 resultIndex=new Map();winIndex=new Map();partyIndex=new Map();
 for(const r of state.data?.results||[]){
   if(!resultIndex.has(r.edition_id))resultIndex.set(r.edition_id,[]);
   resultIndex.get(r.edition_id).push(r);
   if(Number(r.position)===1)winIndex.set(r.horse_id,(winIndex.get(r.horse_id)||0)+1);
 }
 for(const c of state.data?.connections||[]){
   if(!partyIndex.has(c.party_id))partyIndex.set(c.party_id,{count:0,roles:new Set()});
   const p=partyIndex.get(c.party_id);p.count++;p.roles.add(c.role);
 }
}
function resultOf(id){return resultIndex.get(id)||[]}
function nameFor(id){return entity(id)?.name || id || 'Unrecorded'}
function years(){return [...new Set((state.availableYears.length?state.availableYears:(state.data?.races||[]).map(v=>v.year)).map(Number).filter(Number.isInteger))].sort((a,b)=>a-b)}
function formatStatus(s){if(s==='NAME_APPROVED')return pill('Approved');if(s==='NAME_REVIEW')return pill('Name review','pending');if(s==='PENDING')return pill('Pending','pending');if(s==='APPROVED_FOR_PROMOTION')return pill('Approved for promotion');if(s==='REJECTED')return pill('Rejected','red');return pill(s||'Source snapshot','gray')}
function count(kind){return state.data?.entities.filter(e=>e.kind===kind).length||0}
function renameButton(type,id,name){return `<button type="button" class="inline-rename" data-rename-type="${h(type)}" data-id="${h(id)}" data-current-name="${h(name)}" title="Edit this name" aria-label="Edit name ${h(name)}">✎</button>`}
function openButton(type,id,label){return `<span class="name-edit-pair"><button type="button" class="name-cell" data-open-type="${h(type)}" data-id="${h(id)}">${h(label)}</button>${renameButton(type,id,label)}</span>`}
function venueName(record){if(!record?.track_name)return 'Track unrecorded';return `<span class="name-edit-pair"><span>${h(record.track_name)}</span>${renameButton('venue',record.id,record.track_name)}</span>`}
function editButton(type,id,label='Propose correction',className='button button-quiet'){return `<button class="${className}" data-edit-type="${h(type)}" data-id="${h(id)}">${h(label)}</button>`}
function pageTitle(){return ({overview:'Command Center',seasons:'Race Calendar',horses:'My Stable',people:'People & Farms',tracks:'Racecourses',races:'History Vault',search:'Archive Search',changes:'Record Review',sources:'History Coverage'})[state.page]||'Command Center'}
function intro(label,title,desc,more=''){return `<div class="page-intro"><div><div class="smallcaps">${h(label)}</div><h2>${h(title)}</h2><p>${h(desc)}</p></div>${more}</div>`}
function metric(value,label,foot){return `<div class="metric"><div class="metric-label">${h(label)}</div><div class="metric-value">${h(value)}</div><div class="metric-foot">${h(foot)}</div></div>`}
function section(title,subtitle='',content='',action=''){return `<section class="panel"><div class="panel-head"><div><h3>${h(title)}</h3><p>${h(subtitle)}</p></div>${action}</div>${content}</section>`}
function noRecords(desc){return `<div class="empty"><h3>Nothing to display yet</h3><p>${h(desc)}</p></div>`}
function recordMatches(value){return !state.search || [value.name,value.id,value.summary,value.role,value.track_name,value.year].some(x=>String(x||'').toLowerCase().includes(state.search.toLowerCase()))}
function filteredEntities(kind){return (state.data?.entities||[]).filter(v=>v.kind===kind&&recordMatches(v)).sort((a,b)=>a.name.localeCompare(b.name))}
function yearTabs(){
 const all=years();const decade=Math.floor(state.year/10)*10;
 const sameDecade=all.filter(y=>Math.floor(y/10)*10===decade);
 const earlier=all.filter(y=>y<sameDecade[0]).at(-1);
 const later=all.find(y=>y>sameDecade.at(-1));
 return `<div class="year-tabs year-strip" aria-label="Select season">
 ${earlier?`<button class="year-step" data-year="${earlier}" aria-label="Previous decade">← ${Math.floor(earlier/10)*10}s</button>`:''}
 ${sameDecade.map(y=>`<button class="year-tab ${y===state.year?'active':''}" data-year="${y}">${y}</button>`).join('')}
 ${later?`<button class="year-step" data-year="${later}" aria-label="Next decade">${Math.floor(later/10)*10}s →</button>`:''}
 <span class="year-hint">All years available in the SEASON menu above.</span></div>`;
}
function sessionRaces(year=state.year){return (state.data?.races||[]).filter(x=>Number(x.year)===Number(year)).sort((a,b)=>String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99'))||a.name.localeCompare(b.name))}
function sessionHorseIds(year=state.year){const ids=new Set(sessionRaces(year).flatMap(e=>resultOf(e.id).map(r=>r.horse_id)));(state.data?.connections||[]).filter(x=>Number(x.year)===Number(year)).forEach(x=>ids.add(x.horse_id));return [...ids]}
function dateLabel(r){return r?.date?String(r.date):'Date not recorded'}
function dateEvidence(r){
 const basis=String(r?.date_basis||'').toUpperCase(),status=String(r?.status||'').toUpperCase(),qa=String(r?.chronology_qa||'').toUpperCase(),all=basis+' '+status+' '+qa;
 if(/NOT[_\s-]?RUN|NON[_\s-]?RUN/.test(all))return {kind:'not-run',label:'Not run'};
 if(/HOLD|REVIEW|PENDING|UNRESOLVED|QUARANTINED/.test(all))return {kind:'review',label:'Needs review'};
 if(!r?.date)return {kind:'missing',label:'Day not recorded'};
 if(/UNVERIFIED/.test(basis))return {kind:'unverified',label:'Schedule date · unverified'};
 if(/GOVERNED_WTW/.test(basis))return {kind:'fixed',label:'WTW fixed schedule'};
 if(/INTERNAL|PROVISIONAL|CANON_SCHEDULE/.test(basis))return {kind:'internal',label:'Internal schedule date'};
 if(/HISTORICAL_EXACT_DATE/.test(basis))return {kind:'exact',label:'Exact date · sourced'};
 return {kind:'unknown',label:'Date evidence unavailable'};
}
function evidencePill(r){const e=dateEvidence(r),basis=[r?.date_basis,r?.chronology_qa].filter(Boolean).join(' · ')||'Source evidence not available';return '<span class="date-evidence evidence-'+e.kind+'" title="'+h(basis)+'">'+h(e.label)+'</span>'}
function horseSourceBadge(e){
 if(e?.kind!=='horse'||!e.archive_source)return '';
 const key=String(e.archive_source).toUpperCase(),labels={EXISTING_CANON:['Existing canon','canon'],HISTORICAL_STAKES_BACKFILL:['Reconstructed history · review identity','reconstructed'],GENERATED_SUPPORT_PARENT:['Generated pedigree support · not a result','generated']};
 const item=labels[key]||['Source class: '+key,'other'];
 return '<span class="horse-source-tag horse-source-'+item[1]+'">'+h(item[0])+'</span>';
}
function seasonHeadline(y){const r=sessionRaces(y);return r.length?`${r.length} documented races · ${sessionHorseIds(y).length} referenced horses`:'No source races loaded for this season'}
function winnerOf(r){return resultOf(r.id).find(x=>Number(x.position)===1)}
function renderOverview(){
 const year=state.year, raceList=sessionRaces(year), allHorses=(state.data.entities||[]).filter(e=>e.kind==='horse');
 const recorded=(state.data.results||[]).filter(r=>{const edition=race(r.edition_id);return edition&&Number(edition.year)===Number(year)});
 const firsts=recorded.filter(r=>Number(r.position)===1).length, top3=recorded.filter(r=>Number(r.position)<=3).length;
 const people=(state.data.entities||[]).filter(e=>e.kind==='person'), farms=(state.data.entities||[]).filter(e=>e.kind==='organization');
 const yearConnections=(state.data.connections||[]).filter(c=>Number(c.year)===Number(year));
 const role=state.role||'trainer', level=state.involvement||'balanced';
 const roles=[['owner','Owner'],['trainer','Trainer'],['farm','Farm manager'],['breeder','Breeder'],['jockey','Jockey']];
 const roleLabels={owner:'Owner',trainer:'Trainer',farm:'Farm manager',breeder:'Breeder',jockey:'Jockey'};
 const focus={owner:'Ownership decisions, budgets and which horses carry your colors.',trainer:'Training plans, race placement and the people who prepare each horse.',farm:'Farm operations, breeding stock, facilities and long-range planning.',breeder:'Bloodlines, matings, foal development and sale decisions.',jockey:'Race tactics, mounts, preparation and relationships with stables.'};
 const levelLabels={'hands-on':'Hands-on','balanced':'Balanced','executive':'Executive'};
 const levelCopy={'hands-on':'Frequent daily choices and close control.','balanced':'Key decisions with room to delegate.','executive':'Set priorities and review the operation.'};
 const roleOptions=roles.map(([value,label])=>'<option value="'+value+'"'+(role===value?' selected':'')+'>'+label+'</option>').join('');
 const levelOptions=[['hands-on','Hands-on'],['balanced','Balanced'],['executive','Executive']].map(([value,label])=>'<option value="'+value+'"'+(level===value?' selected':'')+'>'+label+'</option>').join('');
 const topHorses=allHorses.slice().sort((a,b)=>(winIndex.get(b.id)||0)-(winIndex.get(a.id)||0)||a.name.localeCompare(b.name)).slice(0,4);
 const horseRows=topHorses.map((e,i)=>'<div class="roster-row featured-roster-row"><span class="roster-rank">'+(i+1)+'</span><div class="asset-placeholder asset-mini" data-asset-slot="horse-card"><span>HORSE</span></div><div class="roster-main">'+openButton('entity',e.id,e.name)+'<small>'+h(e.foal_year||'Foaling year not recorded')+' · '+h(e.sex||'sex not recorded')+'</small></div><span class="roster-stat">'+(winIndex.get(e.id)||0)+'<small>recorded wins</small></span></div>').join('')||'<p class="empty-note">No horse records are loaded for this view.</p>';
 const raceRows=raceList.slice(0,5).map(r=>'<article class="mini-race-row"><div class="mini-race-main"><span class="smallcaps">'+h(dateLabel(r))+' '+evidencePill(r)+'</span><strong>'+openButton('race',r.id,r.name)+'</strong><small>'+venueName(r)+'</small></div><div class="mini-race-winner">'+(winnerOf(r)?'<span>WINNER</span>'+openButton('entity',winnerOf(r).horse_id,nameFor(winnerOf(r).horse_id)):'<span class="muted">Winner not loaded</span>')+'</div></article>').join('')||'<p class="empty-note">No race editions are loaded for this season.</p>';
 const optionRole=roleLabels[role]||'Trainer', scope=state.mode==='D1_CONNECTED'?'ARCHIVE ONLINE':'HISTORICAL PREVIEW';
 const exactDates=raceList.filter(r=>dateEvidence(r).kind==='exact').length;
 return '<div class="command-center command-center-v2">'+
 '<section class="operations-hero"><div class="operations-hero-copy"><div class="command-kicker">'+scope+' · '+h(year)+' RACING YEAR</div><h2>WIRE TO WIRE<br><span>Racing Operations</span></h2><p>Run the sport from the seat you choose. The historical universe is live now; management decisions unlock as the simulation layer comes online.</p><div class="operations-status-row"><span><i class="status-dot"></i> Historical universe connected</span><span>Simulation engine paused</span></div></div><div class="season-book"><div class="season-book-top"><span>SEASON BOOK</span><small>WTW</small></div><strong>'+h(year)+'</strong><div class="season-book-grid"><span><b>'+raceList.length.toLocaleString()+'</b> races</span><span><b>'+allHorses.length.toLocaleString()+'</b> horses</span><span><b>'+exactDates.toLocaleString()+'</b> exact dates</span><span><b>'+yearConnections.length.toLocaleString()+'</b> links</span></div></div></section>'+
 '<section class="management-bar management-bar-v2"><div class="management-heading"><span class="smallcaps">YOUR DESK</span><strong>'+optionRole+' · '+levelLabels[level]+'</strong></div><label><span>MANAGEMENT ROLE</span><select class="game-select" data-game-pref="role">'+roleOptions+'</select></label><label><span>INVOLVEMENT</span><select class="game-select" data-game-pref="involvement">'+levelOptions+'</select></label><div class="management-focus">'+focus[role]+' <span>'+levelCopy[level]+'</span></div></section>'+
 '<div class="operations-kpi-strip"><div><small>RECORDED WINNERS</small><strong>'+firsts.toLocaleString()+'</strong><span>'+h(year)+' source results</span></div><div><small>TOP-THREE FINISHES</small><strong>'+top3.toLocaleString()+'</strong><span>Imported placings</span></div><div><small>PEOPLE</small><strong>'+people.length.toLocaleString()+'</strong><span>Horsemen and participants</span></div><div><small>FARMS / OWNERS</small><strong>'+farms.length.toLocaleString()+'</strong><span>Organizations</span></div></div>'+
 '<div class="command-grid command-grid-v2"><section class="game-panel race-ops-panel"><header class="game-panel-heading"><div><span class="smallcaps">RACE OFFICE</span><h3>'+h(year)+' race book</h3></div><button class="text-button" data-page="seasons">Open calendar →</button></header><div class="mini-race-list">'+raceRows+'</div></section>'+
 '<section class="game-panel stable-panel"><header class="game-panel-heading"><div><span class="smallcaps">THE BARN</span><h3>Leading archive horses</h3></div><button class="text-button" data-page="horses">Open stable →</button></header><div class="roster-list">'+horseRows+'</div></section>'+
 '<section class="game-panel network-panel"><header class="game-panel-heading"><div><span class="smallcaps">RACING NETWORK</span><h3>People, farms & racecourses</h3></div><button class="text-button" data-page="people">Open network →</button></header><div class="network-command-grid"><button data-page="people"><strong>'+people.length.toLocaleString()+'</strong><span>People</span><small>Trainers, jockeys, owners & breeders</small></button><button data-page="people"><strong>'+farms.length.toLocaleString()+'</strong><span>Farms & organizations</span><small>Operations linked to the archive</small></button><button data-page="tracks"><strong>'+((state.trackDirectory?.tracks||[]).length||count('track')).toLocaleString()+'</strong><span>Racecourses</span><small>Canonical WTW venues</small></button></div></section>'+
 '<section class="archive-strip operations-archive-strip"><span class="archive-mark">i</span><div><strong>History is kept separate from simulation.</strong><p>Everything shown here is sourced from the loaded historical universe. Missing lifetime totals, earnings, race-day assignments or game reputation are never invented.</p></div><button class="text-button" data-page="sources">History coverage →</button></section></div>'+
 '<p class="manager-note">Role and involvement are interface preferences saved on this device. They do not yet change historical data or simulate decisions.</p></div>';
}
function renderSeasons(){
 const y=Number(state.year),yearRaces=sessionRaces(y),seasonPeople=(state.data?.connections||[]).filter(c=>Number(c.year)===y);
 const ranked=[...new Set(seasonPeople.map(c=>c.horse_id))];
 const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const validDate=value=>{
  const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if(!m)return null;
  const date=new Date(Date.UTC(Number(m[1]),Number(m[2])-1,Number(m[3])));
  return date.getUTCFullYear()===Number(m[1])&&date.getUTCMonth()===Number(m[2])-1&&date.getUTCDate()===Number(m[3])?m:null;
 };
 const datedMonths=yearRaces.map(r=>validDate(r.date)).filter(Boolean).map(m=>Number(m[2])-1);
 const month=state.calendarMonth===null?(datedMonths[0]??0):Math.max(0,Math.min(11,Number(state.calendarMonth)));
 state.calendarMonth=month;
 const scheduledKinds=['exact','internal','unverified','fixed'];
 const calendarRaces=yearRaces.filter(r=>{const d=validDate(r.date);return d&&Number(d[2])===month+1&&scheduledKinds.includes(dateEvidence(r).kind)});
 const dateIssues=yearRaces.filter(r=>!validDate(r.date)&&dateEvidence(r).kind!=='not-run');
 const reviewRaces=yearRaces.filter(r=>validDate(r.date)&&['review','unknown'].includes(dateEvidence(r).kind));
 const notRunRaces=yearRaces.filter(r=>dateEvidence(r).kind==='not-run');
 const countKind=k=>yearRaces.filter(r=>dateEvidence(r).kind===k).length;
 const exactCount=countKind('exact'),scheduleCount=countKind('internal')+countKind('unverified')+countKind('fixed');
 const reviewCount=countKind('review')+countKind('unknown')+countKind('missing');
 const notRunCount=countKind('not-run');
 const exactMonth=calendarRaces.filter(r=>dateEvidence(r).kind==='exact').length;
 const daysInMonth=new Date(Date.UTC(y,month+1,0)).getUTCDate(),firstWeekday=new Date(Date.UTC(y,month,1)).getUTCDay();
 const dayMap=new Map();
 for(const r of calendarRaces){const d=validDate(r.date),day=Number(d[3]);if(!dayMap.has(day))dayMap.set(day,[]);dayMap.get(day).push(r)}
 const slots=Math.ceil((firstWeekday+daysInMonth)/7)*7;
 const dayCells=Array.from({length:slots},(_,slot)=>{
  const day=slot-firstWeekday+1;
  if(day<1||day>daysInMonth)return '<div class="calendar-day calendar-day-empty" aria-hidden="true"></div>';
  const events=dayMap.get(day)||[];
  const chips=events.slice(0,2).map(r=>{const e=dateEvidence(r);const label=r.name+' · '+venueName(r)+' · '+e.label;return '<button type="button" class="calendar-day-event evidence-'+h(e.kind)+'" data-open-type="race" data-id="'+h(r.id)+'" title="'+h(label)+'" aria-label="'+h(label)+'"><span>'+h(r.name)+'</span></button>'}).join('');
  const more=events.length>2?'<button type="button" class="calendar-more" data-calendar-agenda="true" aria-label="View all '+events.length+' races on '+monthNames[month]+' '+day+'">'+(events.length-2)+' more · view all</button>':'';
  return '<div class="calendar-day" role="gridcell" aria-label="'+h(monthNames[month]+' '+day+', '+y+' · '+events.length+' race editions')+'"><span class="calendar-day-number">'+day+'</span><div class="calendar-day-items">'+chips+more+'</div></div>';
 }).join('');
 const weekdays=['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>'<div class="calendar-weekday" role="columnheader">'+d+'</div>').join('');
 const options=monthNames.map((name,index)=>'<option value="'+index+'"'+(index===month?' selected':'')+'>'+name+'</option>').join('');
 const agenda=calendarRaces.map(r=>{
  const d=validDate(r.date),e=dateEvidence(r);
  return '<article class="calendar-agenda-item"><div class="calendar-agenda-date"><strong>'+Number(d[3])+'</strong><small>'+monthNames[month].slice(0,3).toUpperCase()+'</small></div><div class="calendar-agenda-copy"><button type="button" data-open-type="race" data-id="'+h(r.id)+'">'+h(r.name)+'</button><small>'+venueName(r)+(winnerOf(r)?' · winner '+nameFor(winnerOf(r).horse_id):'')+'</small><span class="date-evidence evidence-'+h(e.kind)+'">'+h(e.label)+'</span></div></article>';
 }).join('');
 const known=ranked.slice(0,8).map(id=>'<div class="season-horse-row">'+openButton('entity',id,nameFor(id))+'<small>'+seasonPeople.filter(c=>c.horse_id===id).length+' season links</small></div>').join('');
 const compactRows=items=>items.map(r=>{const e=dateEvidence(r);return '<div class="calendar-review-item"><div><strong>'+openButton('race',r.id,r.name)+'</strong><small>'+venueName(r)+' · '+h(dateLabel(r))+'</small></div>'+evidencePill(r)+'</div>'}).join('');
 const legend=['exact','internal','unverified','fixed','review','not-run','missing'].map(k=>{const labels={exact:'Exact · sourced',internal:'Internal schedule',unverified:'Schedule · unverified',fixed:'WTW fixed',review:'Needs review','not-run':'Not run',missing:'Day not recorded'};return '<span class="date-evidence evidence-'+k+'">'+labels[k]+'</span>'}).join('');
 const sourceReadback=state.data?.meta?.historySource?.verification;
 const sourceVerificationNotice=state.mode==='D1_CONNECTED'&&sourceReadback?.stored_race_field_differences===0
   ? ' Race/result ID parity checked against stored D1 on November 10, 2026; historical evidence approval remains open.'
   : ' Live source verification is unavailable for this session; do not treat preview data as certified.';
 const sourceNotice='<div class="calendar-source-banner"><span class="source-alert-pill">HISTORICAL SOURCE QA OPEN</span><p>'+(y<1973?'Before 1973, the year is the historical requirement. Dates without authenticated evidence are provisional scheduling placeholders; practical campaigning and geography still matter.':'From 1973 onward, exact historical dates are the goal. Internal and governed fixed dates remain provisional.')+sourceVerificationNotice+'</p><button class="text-button" data-page="sources">Open history coverage →</button></div>';
 const seasonHero='<section class="calendar-season-hero"><div class="calendar-season-year"><span>RACING YEAR</span><strong>'+h(y)+'</strong><small>WTW HISTORICAL BOOK</small></div><div class="calendar-season-copy"><span class="smallcaps">SEASON OFFICE</span><h3>'+h(y)+' stakes calendar</h3><p>Move month by month through the racing year. Source-backed dates, working schedule dates, held records and non-runs stay visually distinct so geography and recovery logic remain believable.</p></div><div class="calendar-season-facts"><span><b>'+exactCount+'</b> exact dates</span><span><b>'+scheduleCount+'</b> schedule dates</span><span><b>'+ranked.length+'</b> referenced horses</span></div></section>';
 const issuePanels=(dateIssues.length?section('Day not recorded',dateIssues.length+' editions are kept outside the day grid',compactRows(dateIssues)):'')+
  (reviewRaces.length?section('Held or unresolved dates',reviewRaces.length+' editions are not placed on the calendar grid',compactRows(reviewRaces)):'')+
  (notRunRaces.length?section('Not run',notRunRaces.length+' source-marked non-runs',compactRows(notRunRaces)):'');
 return intro('THE HISTORICAL YEARBOOK',y+' Season Calendar','A true month view for the imported stakes schedule. Exact dates, internal schedule dates, review holds and non-runs remain distinct.', '<div class="record-count">'+yearRaces.length.toLocaleString()+' editions · '+ranked.length.toLocaleString()+' referenced horses</div>')+
  seasonHero+sourceNotice+
  '<div class="metrics">'+metric(yearRaces.length,'Stakes editions','Imported rows for this season')+metric(exactCount,'Exact dates','Source-backed day values')+metric(scheduleCount,'Schedule dates','Internal, unverified or governed')+metric(reviewCount+notRunCount,'Held / missing / not run','Kept outside the day grid')+'</div>'+
  '<div class="calendar-evidence-legend"><span>DATE EVIDENCE</span>'+legend+'</div>'+
  '<div class="calendar-page-layout"><section class="calendar-month-panel"><div class="calendar-toolbar"><button type="button" class="calendar-nav-button" data-calendar-step="-1"'+(month===0?' disabled':'')+' aria-label="Previous month">‹</button><div class="calendar-month-heading-main"><span class="smallcaps">RACE MONTH</span><strong>'+monthNames[month]+' '+y+'</strong><small>'+calendarRaces.length+' scheduled editions · '+exactMonth+' exact-date sources</small></div><label class="calendar-month-select"><span>MONTH</span><select id="calendar-month-select">'+options+'</select></label><button type="button" class="calendar-nav-button" data-calendar-step="1"'+(month===11?' disabled':'')+' aria-label="Next month">›</button></div><div class="calendar-weekdays" role="row">'+weekdays+'</div><div class="calendar-grid" role="grid" aria-label="'+h(monthNames[month]+' '+y+' stakes calendar')+'">'+dayCells+'</div></section><aside class="calendar-right-rail">'+section(monthNames[month]+' race card',calendarRaces.length+' editions in date order','<div id="calendar-agenda" tabindex="-1">'+(agenda||'<div class="calendar-empty">No dated races are listed this month.</div>')+'</div>')+section('Season connections','Historical year-level links',known||'<div class="calendar-empty">No horse links are recorded for this season.</div>')+'</aside></div>'+
  (issuePanels?'<div class="calendar-support-panels">'+issuePanels+'</div>':'');
}
function renderHorses(){
 const list=filteredEntities('horse');
 const bySex=label=>list.filter(r=>String(r.sex||'').toUpperCase().includes(label)).length;
 const winners=list.filter(r=>(winIndex.get(r.id)||0)>0).length;
 const withPlacings=list.filter(r=>(state.data.results||[]).some(x=>x.horse_id===r.id)).length;
 const featured=list.slice().sort((a,b)=>(winIndex.get(b.id)||0)-(winIndex.get(a.id)||0)||a.name.localeCompare(b.name)).slice(0,3);
 const spotlight=featured.map((r,i)=>'<article class="stable-spotlight-card"><div class="stable-spotlight-rank">0'+(i+1)+'</div><div><span class="smallcaps">'+h(r.sex||'HORSE')+' · '+h(r.foal_year||'YEAR UNKNOWN')+'</span><h3>'+openButton('entity',r.id,r.name)+'</h3><p>'+h(r.summary||'Source-backed horse identity in the WTW historical universe.')+'</p></div><strong>'+(winIndex.get(r.id)||0)+'<small>recorded stakes wins</small></strong></article>').join('');
 const cards=list.slice(0,120).map(r=>{
  const wins=winIndex.get(r.id)||0;
  const placements=(state.data.results||[]).filter(x=>x.horse_id===r.id);
  const latest=placements.map(p=>race(p.edition_id)).filter(Boolean).sort((a,b)=>Number(b.year)-Number(a.year))[0];
  return '<article class="stable-card stable-card-v2"><div class="asset-placeholder stable-card-art" data-asset-slot="horse-portrait"><div class="horse-card-watermark">WTW</div><span>HORSE PORTRAIT</span><div class="horse-card-record"><b>'+wins+'</b><small>WINS</small></div></div><div class="stable-card-body"><div class="stable-card-meta"><span class="smallcaps">'+h(r.sex||'HORSE')+' · '+h(r.foal_year||'YEAR UNKNOWN')+'</span>'+horseSourceBadge(r)+'</div><h3>'+openButton('entity',r.id,r.name)+'</h3><p class="stable-card-summary">'+h(r.summary||'Historical horse file in the WTW source archive.')+'</p><div class="stable-card-stats"><span><strong>'+wins+'</strong> stakes wins</span><span><strong>'+placements.length+'</strong> top-three placings</span><span><strong>'+(latest?h(latest.year):'—')+'</strong> latest source year</span></div><div class="stable-card-actions"><button class="button button-primary stable-open" data-open-type="entity" data-id="'+h(r.id)+'">Open dossier</button><span>'+formatStatus(r.status)+'</span></div></div></article>';
 }).join('');
 return '<div class="stable-page">'+
 intro('RACING STRING','My Stable','The horse files in the historical universe. Rankings and counts below reflect only loaded source records—not simulated form, earnings or ownership.', '<div class="record-count">'+list.length.toLocaleString()+' horses in this view</div>')+
 '<section class="stable-summary-hero"><div><span class="smallcaps">STABLE BOOK</span><h2>Horse inventory</h2><p>Browse the archive like a working barn: identify proven winners, open individual dossiers, and move from horse to people, pedigree and race history.</p></div><div class="stable-summary-stats"><span><b>'+winners.toLocaleString()+'</b> recorded winners</span><span><b>'+withPlacings.toLocaleString()+'</b> with imported placings</span><span><b>'+bySex('STALLION').toLocaleString()+'</b> stallions</span><span><b>'+bySex('MARE').toLocaleString()+'</b> mares</span></div></section>'+
 (featured.length?'<section class="stable-spotlight"><header><div><span class="smallcaps">FORM BOOK</span><h3>Leading source records</h3></div><small>Ranked by recorded stakes wins only</small></header><div class="stable-spotlight-grid">'+spotlight+'</div></section>':'')+
 '<div class="stable-grid stable-grid-v2">'+(cards||'<p class="empty-note">No horse records match this search.</p>')+'</div>'+
 (list.length>120?'<p class="manager-note">Showing 120 matching horses at once. Search by name or permanent ID to narrow the roster.</p>':'')+
 '</div>';
}
function renderPeople(){
 const people=filteredEntities('person'),farms=filteredEntities('organization');
 const allLinks=(state.data?.connections||[]);
 const seasons=[...new Set(allLinks.map(c=>Number(c.year)).filter(Number.isFinite))];
 const roleCount=needle=>people.filter(e=>{const stored=partyIndex.get(e.id);const roles=[e.role,...(stored?.roles||[])].join(' ').toLowerCase();return roles.includes(needle)}).length;
 const makeCard=(e,type)=>{
  const stored=partyIndex.get(e.id),roles=stored?.roles||new Set(),links=stored?.count||0;
  const roleText=e.role||[...roles].join(', ')||(type==='person'?'Role not recorded':'Organization type not recorded');
  const seasonsFor=[...new Set(allLinks.filter(c=>c.party_id===e.id).map(c=>Number(c.year)).filter(Number.isFinite))].sort((a,b)=>b-a);
  const latest=seasonsFor[0];
  return '<article class="people-card network-card-v2"><div class="asset-placeholder people-art" data-asset-slot="'+(type==='person'?'person-headshot':'farm-logo')+'"><span>'+(type==='person'?'PERSON':'OPERATION')+'</span><div class="network-art-stamp">WTW</div></div><div class="people-card-body"><div class="network-card-top"><span class="smallcaps">'+(type==='person'?'RACING PERSONNEL':'FARM / ORGANIZATION')+'</span><span class="network-role-badge">'+h(roleText)+'</span></div><h3>'+openButton('entity',e.id,e.name)+'</h3><p>'+h(e.summary||'Historical identity in the WTW racing universe.')+'</p><div class="network-card-facts"><span><b>'+links+'</b> horse-year links</span><span><b>'+(latest||'—')+'</b> latest season</span></div><div class="people-card-footer"><button class="button button-primary" data-open-type="entity" data-id="'+h(e.id)+'">Open dossier</button>'+editButton('entity',e.id,'Review','button button-quiet')+'</div></div></article>';
 };
 const peopleCards=people.slice(0,100).map(e=>makeCard(e,'person')).join('');
 const farmCards=farms.slice(0,100).map(e=>makeCard(e,'organization')).join('');
 const limitNotice=(n,label)=>n>100?'<p class="manager-note">Showing the first 100 '+label+'. Search by name or permanent ID to narrow the list.</p>':'';
 return '<div class="network-page">'+
  intro('RACING NETWORK','People & Farms','The human and organizational side of WTW: trainers, jockeys, owners, breeders, farms and racing operations connected to the archive.', '<div class="record-count">'+people.length.toLocaleString()+' people · '+farms.length.toLocaleString()+' organizations</div>')+
  '<section class="network-hero"><div><span class="smallcaps">THE PADDOCK & BACKSTRETCH</span><h2>People power the racing world.</h2><p>Every horse belongs to a network of decisions, relationships and places. These files connect the historical archive without inventing race-day assignments that are not supported.</p></div><div class="network-hero-stats"><span><b>'+people.length.toLocaleString()+'</b> people</span><span><b>'+farms.length.toLocaleString()+'</b> organizations</span><span><b>'+allLinks.length.toLocaleString()+'</b> season links</span><span><b>'+seasons.length.toLocaleString()+'</b> linked seasons</span></div></section>'+
  '<div class="network-role-strip"><span><b>'+roleCount('trainer')+'</b> trainers</span><span><b>'+roleCount('jockey')+'</b> jockeys</span><span><b>'+roleCount('owner')+'</b> owners</span><span><b>'+roleCount('breeder')+'</b> breeders</span></div>'+
  section('People','Trainers, jockeys, owners, breeders and other horsemen', '<div class="people-grid network-grid-v2">'+(peopleCards||'<div class="calendar-empty">No people match this search.</div>')+'</div>', '<span class="record-count">'+people.length.toLocaleString()+' people</span>')+limitNotice(people.length,'people')+
  section('Farms & organizations','Breeding farms, ownership groups and racing operations', '<div class="people-grid network-grid-v2">'+(farmCards||'<div class="calendar-empty">No farms or organizations match this search.</div>')+'</div>', '<span class="record-count">'+farms.length.toLocaleString()+' organizations</span>')+limitNotice(farms.length,'organizations')+
  '</div>';
}
function renderSearch(){
 const query=state.search.toLowerCase().trim();
 if(!query)return intro('FIND THE ARCHIVE','Search Wire to Wire','Enter a horse, owner, jockey, trainer, farm, track, race, or permanent record ID.');
 const allEntities=(state.data?.entities||[]).filter(v=>recordMatches(v)).sort((a,b)=>a.name.localeCompare(b.name));
 const allRaces=(state.data?.races||[]).filter(v=>recordMatches(v)).sort((a,b)=>Number(a.year)-Number(b.year)||String(a.date||'9999-99-99').localeCompare(String(b.date||'9999-99-99'))||a.name.localeCompare(b.name));
 const entities=allEntities.slice(0,120).map(e=>`<div class="search-result"><div><span class="smallcaps">${h(e.kind)}</span><h4>${openButton('entity',e.id,e.name)}</h4><small>${h(e.id)}${e.foal_year?' · foaled '+h(e.foal_year):''}</small></div></div>`).join('');
 const races=allRaces.slice(0,120).map(r=>`<div class="search-result"><div><span class="smallcaps">Stakes edition · ${h(r.year)}</span><h4>${openButton('race',r.id,r.name)}</h4><small>${venueName(r)} · ${h(r.id)}</small></div></div>`).join('');
 return `${intro('FULL ARCHIVE SEARCH','Search Results',`${allEntities.length} matching identities and ${allRaces.length} race editions for “${state.search}”. Every displayed name can be edited using its pencil.`)}
 <div class="layout-two">
 ${section('Horses, people, farms & tracks',`${allEntities.length} matches`,entities||noRecords('No matching identities.'))}
 ${section('Races & venues',`${allRaces.length} matches`,races||noRecords('No matching races.'))}
 </div>
 ${allEntities.length>120||allRaces.length>120?'<p class="search-note">Showing the first 120 matches per category. Enter a more specific name or record ID to narrow results.</p>':''}`;
}
function renderTracks(){
 const directory=state.trackDirectory?.tracks||[];
 const imported=new Map((state.data?.entities||[]).filter(e=>e.kind==='track').map(e=>[e.id,e]));
 const list=directory.length ? directory.filter(t=>!state.search||[t.name,t.id,t.city_locality,t.state_province_region,t.country,t.macro_circuit].some(v=>String(v||'').toLowerCase().includes(state.search.toLowerCase()))) : filteredEntities('track').map(e=>({id:e.id,name:e.name,geography_status:e.status}));
 const counts=state.trackDirectory?.counts||{};
 const circuits=new Map();
 for(const t of directory){const key=t.macro_circuit||t.registry||'Other';circuits.set(key,(circuits.get(key)||0)+1)}
 const circuitChips=[...circuits.entries()].sort((a,b)=>b[1]-a[1]).slice(0,7).map(([name,n])=>'<span><b>'+n+'</b> '+h(name)+'</span>').join('');
 const featured=(list.length===directory.length?directory:list).slice().sort((a,b)=>{
   const pa=a.foundation_status==='CORE_CALENDAR'?0:a.opening_state==='ACTIVE'?1:2;
   const pb=b.foundation_status==='CORE_CALENDAR'?0:b.opening_state==='ACTIVE'?1:2;
   return pa-pb||String(a.name).localeCompare(String(b.name));
 }).slice(0,18);
 const trackCards=featured.map(t=>{
   const e=imported.get(t.id);
   const city=[t.city_locality,t.state_province_region].filter(Boolean).join(', ')||'Location pending';
   const status=t.geography_status==='WTW_PROPOSED_PLACEMENT'?'WTW proposed':t.geography_status==='BOUNDARY_PROVISIONAL'?'Boundary provisional':t.geography_status==='RESOLVED_CITY'?'Location resolved':(t.geography_status||'Archive record');
   const action=e?'<button class="text-button" data-open-type="entity" data-id="'+h(e.id)+'">Open record →</button>':'<span class="atlas-card-note">Archive profile pending</span>';
   return '<article class="racecourse-atlas-card"><div class="racecourse-atlas-top"><span>'+h(t.registry==='INTERNATIONAL'?'INTL':'WTW')+'</span><small>'+h(t.id)+'</small></div><div class="racecourse-atlas-mark">⌖</div><h3>'+h(t.name)+'</h3><p>'+h(city)+'</p><div class="racecourse-atlas-meta"><span>'+h(t.macro_circuit||t.country||'Racing network')+'</span><span>'+h(status)+'</span></div><div class="racecourse-atlas-action">'+action+'</div></article>';
 }).join('');
 const rows=list.map(t=>{
   const e=imported.get(t.id);
   const name=e?openButton('entity',e.id,e.name):'<strong>'+h(t.name)+'</strong>';
   const city=[t.city_locality,t.state_province_region,t.country].filter(Boolean).join(', ')||'Location not yet in this archive';
   const basis=t.geography_status==='WTW_PROPOSED_PLACEMENT'?'WTW proposed location':t.geography_status==='BOUNDARY_PROVISIONAL'?'Boundary provisional':t.geography_status==='RESOLVED_CITY'?'City/locality resolved':(t.geography_status||'Archive record');
   const node=t.travel_node?'<div class="subline">Travel node: '+h(t.travel_node)+'</div>':'';
   const note=t.boundary_note?'<div class="subline">'+h(t.boundary_note)+'</div>':'';
   const archive=e?editButton('entity',t.id,'Propose correction'):'<span class="muted">Archive detail pending import</span>';
   return '<tr><td>'+name+'<div class="subline">'+h(t.id)+'</div></td><td>'+h(city)+node+note+'</td><td>'+h(basis)+'</td><td>'+archive+'</td></tr>';
 }).join('');
 const summary=directory.length?'The complete WTW venue network: active, historical, closed and fictional tracks with explicit geography status.':'Only the currently imported archive is displayed until the geography directory loads.';
 const counter='<div class="record-count">'+list.length+' tracks</div>';
 const table='<div class="table-scroll"><table class="data-table"><thead><tr><th>Track</th><th>City / locality / travel node</th><th>Location evidence</th><th>Record review</th></tr></thead><tbody>'+(rows||'<tr><td colspan="4">No track locations available.</td></tr>')+'</tbody></table></div>';
 return intro('RACING MAP','Racecourses',summary,counter)+
  '<section class="racecourse-atlas-hero"><div><span class="smallcaps">WTW TRACK NETWORK</span><h2>'+((counts.total||directory.length)||list.length).toLocaleString()+' racecourses</h2><p>Every venue belongs to a physical racing world. City, circuit and travel-node geography support campaign planning without silently inventing historical race dates.</p><div class="racecourse-circuit-chips">'+circuitChips+'</div></div><div class="racecourse-atlas-totals"><span><b>'+h(counts.north_america??'118')+'</b> North America</span><span><b>'+h(counts.international??'16')+'</b> International</span><span><b>'+h(counts.sourced_localities??'—')+'</b> sourced localities</span><span><b>'+h(counts.boundary_provisional??'—')+'</b> boundary review</span></div></section>'+
  '<section class="racecourse-atlas-section"><header><div><span class="smallcaps">TRACK ATLAS</span><h3>'+(state.search?'Matching venues':'Core racing venues')+'</h3></div><small>Showing '+featured.length+' visual cards · full directory below</small></header><div class="racecourse-atlas-grid">'+(trackCards||'<p class="empty-note">No tracks match this search.</p>')+'</div></section>'+
  section('Complete track directory','All canonical WTW geography remains available in a precise registry view. Provisional and fictional localities stay labeled.',table);
}
function renderRaces(){
 const monthNames=['January','February','March','April','May','June','July','August','September','October','November','December'];
 const validDate=(value)=>{const m=String(value||'').match(/^(\d{4})-(\d{2})-(\d{2})$/);return m&&Number(m[2])>=1&&Number(m[2])<=12&&Number(m[3])>=1&&Number(m[3])<=31?m:null};
 const dateKey=(r)=>validDate(r.date)?String(r.date):'9999-99-99';
 const list=(state.data?.races||[]).filter(r=>(+r.year===+state.year||state.search)&&recordMatches(r)).sort((a,b)=>Number(a.year)-Number(b.year)||dateKey(a).localeCompare(dateKey(b))||a.name.localeCompare(b.name));
 const multiYear=new Set(list.map(r=>String(r.year))).size>1;
 const winnersLoaded=list.filter(r=>winnerOf(r)).length;
 const exactDates=list.filter(r=>dateEvidence(r).kind==='exact').length;
 const venues=new Set(list.map(r=>r.track_name).filter(Boolean)).size;
 const groups=new Map();
 for(const r of list){
  const match=validDate(r.date),month=match?monthNames[Number(match[2])-1]:'Day not recorded',label=(multiYear?String(r.year)+' · ':'')+month;
  if(!groups.has(label))groups.set(label,[]);
  groups.get(label).push(r);
 }
 const cards=(items)=>items.map(r=>{const evidence=dateEvidence(r);return '<article class="vault-race-card"><div class="vault-race-date"><small>'+h(r.year)+'</small><strong>'+(validDate(r.date)?Number(validDate(r.date)[3]):'—')+'</strong><span>'+(validDate(r.date)?monthNames[Number(validDate(r.date)[2])-1].slice(0,3).toUpperCase():'DATE')+'</span></div><div class="vault-race-main"><div class="vault-race-kicker">'+venueName(r)+' <span class="date-evidence-tag '+h(evidence.kind)+'">'+h(evidence.label)+'</span></div><h4>'+openButton('race',r.id,r.name)+'</h4><div class="vault-race-winner">'+(winnerOf(r)?'<span>WINNER</span>'+openButton('entity',winnerOf(r).horse_id,nameFor(winnerOf(r).horse_id)):'<span>FINISH ORDER</span><strong>Not imported</strong>')+'</div></div><div class="vault-race-actions">'+editButton('race',r.id,'Review','button button-quiet')+'</div></article>'}).join('');
 const grouped=[...groups].map(([label,items])=>'<section class="vault-month-group"><header><div><span class="smallcaps">RACE BOOK</span><h3>'+h(label)+'</h3></div><span>'+items.length+' editions</span></header><div class="vault-race-list">'+cards(items)+'</div></section>').join('');
 return '<div class="vault-page">'+
  intro('HISTORY VAULT','Stakes Archive','Chronological source records from the WTW racing universe. Each edition preserves its date-evidence status and links back to horses and venues.', '<div class="record-count">'+list.length.toLocaleString()+' race editions</div>')+
  '<section class="vault-hero"><div><span class="smallcaps">ARCHIVE LEDGER</span><h2>'+h(state.search?'Search results':state.year+' racing year')+'</h2><p>Open any race as a permanent historical file. Exact dates, unresolved chronology and missing finish orders remain explicit instead of being smoothed over.</p></div><div class="vault-hero-stats"><span><b>'+list.length.toLocaleString()+'</b> editions</span><span><b>'+winnersLoaded.toLocaleString()+'</b> winners loaded</span><span><b>'+exactDates.toLocaleString()+'</b> exact dates</span><span><b>'+venues.toLocaleString()+'</b> venues</span></div></section>'+
  yearTabs()+
  (grouped||noRecords('No matching race editions.'))+
  '</div>';
}
function nameHistory(){
 const edits=[...state.nameEdits].slice(0,100);
 if(state.mode!=='D1_CONNECTED')return '';
 const rows=edits.map(a=>`<div class="review-row"><div class="review-meta"><span>${h(a.edited_at)}</span><span>${h(a.target_type)} · ${h(a.target_id)}</span></div>
  <h4>${h(a.old_display_name)} → ${h(a.new_display_name)}</h4>
  <p>Original source: ${h(a.source_name||'Unknown')} · changed by ${h(a.editor_email||'Authorized administrator')}</p>
 </div>`).join('');
 return section('Recorded name edits',`${state.nameEdits.length} recent edits · retained in the private WTW database`,rows||noRecords('No names have been changed yet.'));
}
function renderChanges(){
 const ordered=[...state.changes].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 return `${intro('SOURCE-SAFE GOVERNANCE','Corrections & Approvals','Submit proposed edits to horse names, people, stables, seasonal connections, and race records. Approval records intent; it never silently rewrites historical results.')}
 <div class="callout"><strong>Protected canon:</strong> corrections in this desk remain proposals or approved-for-promotion decisions. A separate, verified promotion step is required before changes reach WTW's authoritative historical database.</div>
 ${section('Review queue',`${ordered.length} proposals ${state.mode==='DEMO'?'· saved in this browser only':'· stored in the separate WTW D1 database'}`,ordered.length?ordered.map(r=>`<div class="review-row"><div class="review-meta">${formatStatus(r.status)} <span>${h(r.target_type)} · ${h(r.target_id)}</span><span>${h(r.created_at||'')}</span></div><h4>${h(r.field)}: ${h(r.old_value??'blank')} → ${h(r.proposed_value)}</h4><p>${h(r.reason)}</p><div class="review-actions">${r.status==='PENDING'?`<button class="button button-primary" data-review-id="${h(r.id)}" data-review-action="APPROVED_FOR_PROMOTION">Approve for promotion</button><button class="button button-danger" data-review-id="${h(r.id)}" data-review-action="REJECTED">Reject</button>`:''}</div></div>`).join(''):noRecords('No correction proposals yet. Open a horse, race, person, or connection to propose one.'))}
 ${nameHistory()}`;
}
function renderSources(){
 const d=state.data,counts=d.meta?.counts||{},yearList=state.availableYears.length?state.availableYears:years();
 const period=yearList.length?yearList[0]+'–'+yearList[yearList.length-1]:'No season records loaded';
 const total=(key,fallback)=>Number.isFinite(Number(counts[key]))?Number(counts[key]):fallback;
 const metrics=[
  ['ENTITIES',total('entities',d.entities.length).toLocaleString(),'Horses, people, farms and tracks'],
  ['STAKES EDITIONS',total('races',d.races.length).toLocaleString(),'Imported race records'],
  ['SEASON LINKS',total('connections',d.connections.length).toLocaleString(),'Owner, trainer, jockey and breeder'],
  ['TOP-THREE RESULTS',total('results',d.results.length).toLocaleString(),'Placed horses in imported races']
 ];
 const extras=[['Horse details',counts.horseDetails],['Horse seasons',counts.horseSeasons],['Pedigree edges',counts.pedigreeEdges],['Bloodline profiles',counts.bloodlineProfiles]].map(([label,value])=>'<div class="coverage-extra"><span>'+label+'</span><strong>'+(value===undefined?'Not reported':Number(value).toLocaleString())+'</strong></div>').join('');
 const status=state.mode==='D1_CONNECTED'?'ARCHIVE CONNECTED':'ARCHIVE PREVIEW · LIVE D1 NOT CONFIRMED';
 const sourceAudit=d.meta?.historySource||{};
 const remote=sourceAudit.verification||{};
 const verified=state.mode==='D1_CONNECTED' &&
   sourceAudit.result_delta_status==='D1_PARITY_VERIFIED_2026_11_10__SOURCE_QA_PENDING' &&
   remote.stored_race_field_differences===0 && remote.stored_result_id_differences===0;
 const shownRaces=total('races',d.races.length),shownResults=total('results',d.results.length);
 const historicalStatus=verified?'D1 READBACK PASSED':'NOT VERIFIED IN THIS SESSION';
 const reconciliation='<section class="source-reconciliation"><div class="source-reconciliation-head"><div><span class="smallcaps">SINGLE HISTORY SOURCE · NOVEMBER 10, 2026 READBACK</span><h3>'+ (verified?'Stored races and results match the staged source':'Historical import verification pending') +'</h3></div><span class="source-alert-pill">SOURCE QA PENDING</span></div>'+
 '<p>'+ (verified
 ? 'The existing protected WTW D1 database was checked by immutable race and placing IDs against the stored edition export. No database update was needed for those audited fields. Current Drive E/W/M edition core fields matched that staged export at the November 10 reconciliation. Technical parity is not historical source certification: reconstructed horse identities, internal schedule dates and season-level human connections remain separately qualified.'
 : 'This session cannot establish the current D1 source parity. Do not use demonstration or partial pages to certify the full historical record.') +'</p>'+
 '<div class="source-delta-grid"><div><small>STORED RACE DIFFS</small><strong>'+(verified?'0':'—')+'</strong></div><div><small>STORED RESULT DIFFS</small><strong>'+(verified?'0':'—')+'</strong></div><div><small>STAKES EDITIONS CHECKED</small><strong>'+(verified?Number(remote.stored_edition_count).toLocaleString():'—')+'</strong></div><div><small>PLACINGS CHECKED</small><strong>'+(verified?Number(remote.stored_top_three_count).toLocaleString():'—')+'</strong></div><div><small>READBACK STATE</small><strong>'+historicalStatus+'</strong></div></div>'+
 '<div class="source-master-grid"><div><small>ACTIVE STAKES EDITIONS</small><strong>'+shownRaces.toLocaleString()+'</strong></div><div><small>QUARANTINED / INACTIVE</small><strong>'+(verified?Number(remote.inactive_edition_count).toLocaleString():'Not verified')+'</strong></div><div><small>ACTIVE RECORDED PLACINGS</small><strong>'+shownResults.toLocaleString()+'</strong></div><div><small>SOURCE STATUS</small><strong>QA PENDING</strong></div><div><small>AS-OF READBACK</small><strong>'+(verified?h(remote.as_of):'Not verified')+'</strong></div></div>'+
 '<p class="coverage-note">The 223 inactive or quarantined editions remain preserved for source audit, not counted as active racing results. Dates marked internal or WTW fixed are not externally authenticated solely because the race appears in D1. All source IDs and user-approved display-name overlays remain protected. Verification: '+(verified?'<a href="'+h(remote.run_url)+'" target="_blank" rel="noopener noreferrer">read-only D1 audit</a>':'No live source report')+'.</p></section>';
 return intro('HISTORY FIRST','History Coverage','A clear view of what is imported, what has passed technical audit, and what still needs historical certification.')+
 '<section class="coverage-hero"><div><span class="coverage-kicker">CURRENT ARCHIVE SCOPE</span><h2>Stakes history · '+h(period)+'</h2><p>The staged H/S/E/P/B import passed its remote row-count, source-hash and integrity audit. That confirms the import matches its staged files; it does not certify every historical claim as complete or correct.</p></div><span class="coverage-status">'+status+'</span></section>'+
 '<div class="coverage-metrics">'+metrics.map(x=>'<article><small>'+x[0]+'</small><strong>'+x[1]+'</strong><span>'+x[2]+'</span></article>').join('')+'</div>'+reconciliation+
 '<div class="coverage-layout"><section class="coverage-panel"><div class="coverage-panel-head"><div><span class="smallcaps">IMPORTED DETAIL TABLES</span><h3>What the archive contains</h3></div></div><div class="coverage-extra-list">'+extras+'</div><p class="coverage-note">Coverage reflects the imported source snapshot and current database response.</p></section>'+
 '<section class="coverage-panel"><div class="coverage-panel-head"><div><span class="smallcaps">CERTIFICATION GATES</span><h3>What still needs validation</h3></div></div><ul class="coverage-gates"><li><span class="gate-pass">PASS</span><div><strong>Race and result parity</strong><small>November 10 D1 readback confirms 5,370 edition IDs and 15,561 stored placing rows; historical correctness is a separate approval gate.</small></div></li><li><span class="gate-pending">NEXT</span><div><strong>Publication and source approval</strong><small>Stored race/result parity verified as of November 10; historic source QA remains open. Publish only approved history and organization dossiers.</small></div></li><li><span class="gate-pending">OPEN</span><div><strong>Historical source reconciliation</strong><small>Resolve race dates, horse identities, results, pedigrees and seasonal links against authoritative records.</small></div></li></ul></section>'+
 '<section class="coverage-limits"><div><span class="smallcaps">KNOWN SCOPE LIMITS</span><h3>Keep the record honest</h3></div><ul><li>Stakes-focused archive; not every ordinary race is represented.</li><li>Result data contains imported top-three placings, not every finisher.</li><li>Lifetime starts and earnings are not complete fields in this snapshot.</li><li>Owner, trainer and jockey links are season-level unless a race-day record proves otherwise.</li><li>3,115 horse identities are tagged as historical stakes backfill and 124 as generated pedigree support; these are not verified name examples.</li></ul></section>'+
 '<section class="coverage-panel"><div class="coverage-panel-head"><div><span class="smallcaps">SOURCE SAFEGUARDS</span><h3>Historical source stays protected</h3></div></div><p class="coverage-note">Display-name edits are logged in a separate overlay. Correction approvals do not overwrite original source records or frozen game-engine data.</p><button class="text-button" data-page="changes">Open record review →</button></section></div>';
}
function render(){
 if(!state.data) return;
 $('page-title').textContent=pageTitle();
 document.querySelectorAll('.nav-link').forEach(b=>{const active=b.dataset.page===state.page;b.classList.toggle('active',active);if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current')});
 $('change-count').textContent=state.changes.filter(c=>c.status==='PENDING').length;
 $('data-mode').textContent=state.mode==='D1_CONNECTED'?'ARCHIVE CONNECTED':'ARCHIVE PREVIEW';
 $('data-mode').classList.toggle('live',state.mode==='D1_CONNECTED');
 const map={overview:renderOverview,seasons:renderSeasons,horses:renderHorses,people:renderPeople,tracks:renderTracks,races:renderRaces,search:renderSearch,changes:renderChanges,sources:renderSources};
 $('app').innerHTML=(state.mode==='DEMO'&&state.apiIssue?`<div class="callout"><strong>Private historical database not connected to this session.</strong> The records shown here are only the small demonstration set, not the imported history. API: ${h(state.apiIssue)}. Confirm the three Production Access variables and redeploy before making saved edits.</div>`:'')+(map[state.page]||renderOverview)();
}
function setPage(page){state.page=page;document.body.classList.remove('menu-open');$('sidebar').classList.remove('mobile-open');render();window.scrollTo({top:0,behavior:'smooth'})}
function setYear(year){state.year=Number(year);$('year-select').value=String(year);render()}
function toast(message){let node=$('toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.hidden=true,4500)}
function renderNetworkEntityProfile(e,cn){
 const isPerson=e.kind==='person';
 const profileClass=isPerson?'person-profile':'farm-profile';
 const heading=isPerson?'PEOPLE FILE':'FARM & ORGANIZATION FILE';
 const assetSlot=isPerson?'person-headshot':'farm-logo';
 const assetLabel=isPerson?'PERSON HEADSHOT':'FARM / OPERATION';
 const roleText=e.role||[...(partyIndex.get(e.id)?.roles||[])].join(', ')||(isPerson?'Role not recorded':'Organization type not recorded');
 const links=cn.filter(c=>c.party_id===e.id);
 const uniqueHorseLinks=[];
 const seenHorses=new Set();
 for(const c of links){if(!c.horse_id||seenHorses.has(c.horse_id))continue;seenHorses.add(c.horse_id);uniqueHorseLinks.push(c)}
 uniqueHorseLinks.sort((a,b)=>Number(b.year)-Number(a.year)||nameFor(a.horse_id).localeCompare(nameFor(b.horse_id)));
 const sourceYears=[...new Set(links.map(c=>Number(c.year)).filter(Number.isFinite))].sort((a,b)=>b-a);
 const latestYear=sourceYears[0]||null;
 const linkedWins=[];
 const seenWins=new Set();
 for(const c of links){
  for(const result of (state.data?.results||[])){
   if(result.horse_id!==c.horse_id||Number(result.position)!==1)continue;
   const rr=race(result.edition_id);
   if(!rr||Number(rr.year)!==Number(c.year))continue;
   const key=result.edition_id+'::'+result.horse_id;
   if(seenWins.has(key))continue;
   seenWins.add(key);linkedWins.push({race:rr,horse_id:c.horse_id,year:c.year,role:c.role});
  }
 }
 linkedWins.sort((a,b)=>Number(b.year)-Number(a.year)||a.race.name.localeCompare(b.race.name));
 const factPairs=isPerson?[
  ['Job',roleText,false],
  ['Latest source season',latestYear||'Not recorded',!latestYear],
  ['Birthplace','Not loaded in current profile',true],
  ['Base location','Not loaded in current profile',true]
 ]:[
  ['Type',roleText,false],
  ['Latest source season',latestYear||'Not recorded',!latestYear],
  ['Location','Not loaded in current profile',true],
  ['Owner','Not established in current source',true]
 ];
 const factRows=factPairs.map(f=>'<div class="identity-fact"><small>'+h(f[0])+'</small><strong class="'+(f[2]?'not-recorded':'')+'">'+h(f[1])+'</strong></div>').join('');
 const horseRows=uniqueHorseLinks.slice(0,7).map(c=>'<div class="linked-horse-row"><div class="linked-horse-icon">♞</div><div>'+openButton('entity',c.horse_id,nameFor(c.horse_id))+'<span>'+h(c.year)+' · '+h(c.role||'season link')+'</span></div><span>›</span></div>').join('')||'<p class="empty-note">No horse-season connections are loaded for this record.</p>';
 const achievementRows=linkedWins.slice(0,5).map(w=>'<div class="achievement-item"><div class="achievement-medal">★</div><div><strong>'+openButton('race',w.race.id,w.race.name)+'</strong><small>'+h(w.year)+' · '+openButton('entity',w.horse_id,nameFor(w.horse_id))+' · '+h(w.role||'season link')+'</small></div></div>').join('')||'<div class="achievement-item"><div class="achievement-medal">—</div><div><strong>No supported stakes win is linked in this source.</strong><small>This is not treated as a zero-career total.</small></div></div>';
 const status=h(e.status||'SOURCE SNAPSHOT');
 const stableTitle=isPerson?'Stable / linked horses':'Connected horses';
 const careerValue=linkedWins.length?linkedWins.length:'—';
 const careerLabel=linkedWins.length?'Season-linked stakes wins':'Career wins unavailable';
 return '<div class="entity-profile '+profileClass+'"><div class="profile-header"><div class="asset-placeholder profile-portrait" data-asset-slot="'+assetSlot+'"><span>'+assetLabel+'</span></div><div class="profile-heading"><div class="eyebrow">'+heading+'</div><h2>'+h(e.name)+' '+renameButton('entity',e.id,e.name)+'</h2><div class="detail-id">'+h(e.id)+'</div><p class="profile-summary">'+h(e.summary||'No biographical narrative is present in the loaded source file.')+'</p><div class="profile-tags"><span>'+h(e.kind)+'</span><span>'+h(roleText)+'</span><span>'+status+'</span></div><div class="identity-facts">'+factRows+'</div></div><div class="profile-header-actions">'+editButton('entity',e.id,'Propose correction','button button-quiet')+'</div></div>'+
 '<div class="profile-dashboard"><section class="profile-card"><div class="profile-card-header"><h3>'+stableTitle+'</h3><small>'+uniqueHorseLinks.length+' horses</small></div><div class="profile-card-body linked-horse-list">'+horseRows+'</div></section>'+
 '<div><section class="profile-card"><div class="profile-card-header"><h3>Career wins</h3><small>source-safe</small></div><div class="profile-card-body career-figure"><strong>'+careerValue+'</strong><span>'+careerLabel+'</span><small>Counts only stakes wins by horses connected to this record in the same source season.</small></div></section><section class="profile-card reputation-panel"><div class="profile-card-header"><h3>Reputation</h3><small>simulation</small></div><div class="profile-card-body"><div class="reputation-grade"><strong>—</strong><div><b>Not yet modeled</b><br>Game reputation will live here once the simulation layer is active.</div></div><div class="reputation-bar"><span></span></div></div></section></div>'+
 '<section class="profile-card"><div class="profile-card-header"><h3>Achievements</h3><small>season-linked evidence</small></div><div class="profile-card-body achievement-stack">'+achievementRows+'</div></section></div>'+
 '<div class="profile-source-note">Connections shown here are season-level archive relationships. They do not prove a specific race-day assignment. Missing birthplace, base, farm ownership, reputation or complete career totals remain explicitly unavailable until those read models are connected.</div></div>';
}
async function openDetail(type,id){
 state.openDetail={type,id};
 const e=type==='entity'?entity(id):type==='race'?race(id):null;
 if(!e){toast('The requested record has not been imported.');return;}
 let markup='';
 if(type==='entity'){
  const cn=(state.data?.connections||[]).filter(c=>c.horse_id===id||c.party_id===id).sort((a,b)=>b.year-a.year);
  const placings=(state.data?.results||[]).filter(r=>r.horse_id===id).map(r=>({...r,race:race(r.edition_id)})).filter(r=>r.race).sort((a,b)=>b.race.year-a.race.year||Number(a.position)-Number(b.position));
  const isHorse=e.kind==='horse';
  const firsts=placings.filter(p=>Number(p.position)===1), seconds=placings.filter(p=>Number(p.position)===2), thirds=placings.filter(p=>Number(p.position)===3);
  const heading=isHorse?'HORSE CAREER FILE':(e.kind==='person'?'PEOPLE FILE':'FARM & ORGANIZATION FILE');
  const roleText=isHorse?(e.foal_year?'Foaled '+h(e.foal_year):'Foaling year not recorded'):(e.role||'Role not recorded');
  const assetSlot=isHorse?'horse-portrait':e.kind==='person'?'person-headshot':'farm-logo';
  const assetLabel=isHorse?'HORSE PORTRAIT':e.kind==='person'?'PERSON HEADSHOT':'FARM LOGO';
  const raceLine=placings.slice(0,3).map(p=>'<div class="profile-race-row"><div>'+openButton('race',p.race.id,p.race.name)+'<small>'+h(p.race.year)+' · '+venueName(p.race)+'</small></div><strong class="finish-badge finish-'+h(p.position)+'">'+h(p.position)+'</strong>'+editButton('result',p.edition_id+'::'+p.position,'Review','button button-quiet')+'</div>').join('');
  const connectionLine=cn.slice(0,5).map(c=>{const linkedId=c.horse_id===id?c.party_id:c.horse_id;return '<div class="profile-connection-row"><strong>'+h(c.year)+' · '+h(c.role)+'</strong><span>'+openButton('entity',linkedId,nameFor(linkedId))+'</span><small>'+h(c.basis||'Season-level source link')+'</small></div>'}).join('');
  const achievementLine=firsts.length?firsts.slice(0,3).map(p=>'<li>'+openButton('race',p.race.id,p.race.name)+' · '+h(p.race.year)+' winner</li>').join(''):'<li>No first-place result appears in the loaded source records.</li>';
  const quickAchievementLine=firsts.length?firsts.slice(0,3).map(p=>'<span>'+openButton('race',p.race.id,p.race.name)+'<small>'+h(p.race.year)+'</small></span>').join(''):'<span class="achievement-empty">No first-place result is listed in this archive.</span>';
  const expanded=placings.length>3?'<details class="profile-more"><summary>View all '+placings.length+' recorded appearances</summary><div class="profile-more-list">'+placings.slice(3).map(p=>'<div>'+openButton('race',p.race.id,p.race.name)+' <span>'+h(p.race.year)+' · position '+h(p.position)+'</span></div>').join('')+'</div></details>':'';
  const status=h(e.status||'SOURCE SNAPSHOT');
  markup='<div class="entity-profile '+(isHorse?'horse-profile':'')+'"><div class="profile-header"><div class="asset-placeholder profile-portrait" data-asset-slot="'+assetSlot+'"><span>'+assetLabel+'</span></div><div class="profile-heading"><div class="eyebrow">'+heading+'</div><h2>'+h(e.name)+' '+renameButton(type,e.id,e.name)+'</h2><div class="detail-id">'+h(e.id)+'</div><p class="profile-summary">'+h(e.summary||'No biographical narrative is present in the loaded source file.')+'</p><div class="profile-tags"><span>'+h(e.sex||e.kind)+'</span><span>'+roleText+'</span><span>'+status+'</span></div></div><div class="profile-header-actions">'+editButton('entity',e.id,'Propose correction','button button-quiet')+'</div></div>'+
  (isHorse?'<div class="profile-stats"><div><small>CAREER STARTS</small><strong>Not available</strong><span>Full total not in this file</span></div><div><small>RECORDED TOP-3</small><strong>'+placings.length+'</strong><span>Archive placings only</span></div><div><small>1ST PLACE</small><strong>'+firsts.length+'</strong><span>Recorded</span></div><div><small>2ND PLACE</small><strong>'+seconds.length+'</strong><span>Recorded</span></div><div><small>3RD PLACE</small><strong>'+thirds.length+'</strong><span>Recorded</span></div><div><small>EARNINGS</small><strong>Not imported</strong><span>Not treated as zero</span></div></div>'+
  '<div class="profile-pedigree-section"><div class="profile-section-title"><div><span class="smallcaps">BLOODLINE</span><h3>Pedigree at a glance</h3></div><span class="source-chip">SOURCE LINKS</span></div><div id="horse-pedigree-panel" class="profile-pedigree-grid"><div class="pedigree-card"><small>SIRE</small><strong>'+(state.mode==='D1_CONNECTED'?'Loading source record…':'Not in loaded sample')+'</strong></div><div class="pedigree-card"><small>DAM</small><strong>'+(state.mode==='D1_CONNECTED'?'Loading source record…':'Not in loaded sample')+'</strong></div></div></div>'+
  '<div class="profile-quick-achievements"><div><span class="smallcaps">NOTABLE ACHIEVEMENTS</span><h3>Recorded stakes wins</h3></div><div class="profile-quick-achievement-list">'+quickAchievementLine+'</div></div>'+
  '<div class="profile-columns"><section class="profile-section"><div class="profile-section-title"><div><span class="smallcaps">RACE HISTORY</span><h3>Recorded finishes</h3></div><span class="source-chip">'+placings.length+' APPEARANCES</span></div><div class="profile-race-list">'+(raceLine||'<p class="empty-note">No finish records in this source snapshot.</p>')+'</div>'+expanded+'<p class="source-caveat">This is the loaded archive record, not a verified lifetime start total.</p></section><section class="profile-section"><div class="profile-section-title"><div><span class="smallcaps">HIGHLIGHTS & CONNECTIONS</span><h3>Notable achievements</h3></div></div><ul class="achievement-list">'+achievementLine+'</ul><div class="profile-section-title profile-secondary-title"><div><span class="smallcaps">SEASON LINKS</span><h3>People around this horse</h3></div></div><div class="profile-connection-list">'+(connectionLine||'<p class="empty-note">No season connections imported.</p>')+'</div></section></div></div>':
  '<div class="entity-profile"><div class="profile-header"><div class="asset-placeholder profile-portrait" data-asset-slot="'+assetSlot+'"><span>'+assetLabel+'</span></div><div class="profile-heading"><div class="eyebrow">'+heading+'</div><h2>'+h(e.name)+' '+renameButton(type,e.id,e.name)+'</h2><div class="detail-id">'+h(e.id)+'</div><p class="profile-summary">'+h(e.summary||'No biographical narrative is present in the loaded source file.')+'</p><div class="profile-tags"><span>'+h(e.kind)+'</span><span>'+roleText+'</span><span>'+status+'</span></div></div><div class="profile-header-actions">'+editButton('entity',e.id,'Propose correction','button button-quiet')+'</div></div><div class="profile-columns"><section class="profile-section"><div class="profile-section-title"><div><span class="smallcaps">ASSOCIATIONS</span><h3>Season connections</h3></div><span class="source-chip">'+cn.length+' LINKS</span></div><div class="profile-connection-list">'+(connectionLine||'<p class="empty-note">No connections imported.</p>')+'</div></section><section class="profile-section"><div class="profile-section-title"><div><span class="smallcaps">SOURCE RECORD</span><h3>Historical identity</h3></div></div><div class="profile-stats compact-profile-stats"><div><small>TYPE</small><strong>'+h(e.kind)+'</strong></div><div><small>ROLE</small><strong>'+roleText+'</strong></div><div><small>HORSE-YEAR LINKS</small><strong>'+(partyIndex.get(e.id)?.count||0)+'</strong></div></div><p class="source-caveat">Connections are recorded at season level. They do not prove a specific race-day assignment.</p></section></div></div>');
  if(!isHorse) markup=renderNetworkEntityProfile(e,cn);
 } else {
  const results=resultOf(e.id).sort((a,b)=>a.position-b.position);
  markup='<div class="entity-profile race-profile"><div class="profile-heading"><div class="eyebrow">HISTORICAL RACE EDITION</div><h2>'+h(e.name)+' '+renameButton(type,e.id,e.name)+'</h2><div class="detail-id">'+h(e.id)+'</div><p class="profile-summary">'+venueName(e)+' · '+h(e.year)+' · '+h(dateLabel(e))+'</p></div><div class="profile-section-title"><div><span class="smallcaps">SOURCE FINISH ORDER</span><h3>Recorded finishers</h3></div><span class="source-chip">'+results.length+' RESULTS</span></div><div class="profile-race-list">'+(results.map(p=>'<div class="profile-race-row"><div><strong>'+openButton('entity',p.horse_id,nameFor(p.horse_id))+'</strong></div><strong class="finish-badge finish-'+h(p.position)+'">'+h(p.position)+'</strong>'+editButton('result',p.edition_id+'::'+p.position,'Review','button button-quiet')+'</div>').join('')||'<p class="empty-note">No finishers imported.</p>')+'</div><p class="source-caveat">Source: '+h(e.source||'Not specified')+' · '+h(e.status||'SOURCE SNAPSHOT')+'</p></div>';
 }
 $('detail-content').innerHTML='<button class="icon-button drawer-close" data-close-drawer="true" aria-label="Close profile">✕</button>'+markup;
 if(type==='entity'&&e.kind==='horse'){
  const horseConnections=(state.data?.connections||[]).filter(c=>c.horse_id===id).sort((a,b)=>Number(b.year)-Number(a.year));
  const roleDefs=[['Owner','owner'],['Trainer','trainer'],['Jockey','jockey'],['Breeder','breeder']];
  const cards=roleDefs.map(([label,key])=>{
   const c=horseConnections.find(x=>String(x.role||'').toLowerCase().includes(key));
   return '<div class="horse-connection-card"><small>'+label+'</small><strong>'+(c?openButton('entity',c.party_id,nameFor(c.party_id)):'Not recorded')+'</strong><span>'+(c?h(c.year)+' season connection':'No supported source link')+'</span></div>';
  }).join('');
  const heading=$('detail-content').querySelector('.profile-heading');
  if(heading)heading.insertAdjacentHTML('beforeend','<div class="horse-connection-strip">'+cards+'</div>');
 }
 $('drawer-backdrop').hidden=false;$('detail-drawer').classList.add('open');$('detail-drawer').setAttribute('aria-hidden','false');
 if(type==='entity'&&e.kind==='horse'&&state.mode==='D1_CONNECTED'){
  try{
   const resp=await fetch('/api/horses/'+encodeURIComponent(id),{credentials:'same-origin',cache:'no-store'});
   if(!resp.ok)throw Error('Detailed source unavailable');
   const info=await resp.json(),panel=$('horse-pedigree-panel');if(!panel||!$('detail-drawer').classList.contains('open')||state.openDetail?.type!=='entity'||state.openDetail?.id!==id)return;
   const parentBy=(word)=> (info.parents||[]).find(p=>String(p.relation||'').toLowerCase()===word);
   const parentCard=(label,p,idValue)=>{
    const pid=idValue||p?.parent_id,name=p?.parent_name||(pid&&entity(pid)?nameFor(pid):pid);
    const value=pid&&entity(pid)?openButton('entity',pid,nameFor(pid)):h(name||'Not recorded in this source');
    return '<div class="pedigree-card"><small>'+label+'</small><strong>'+value+'</strong><span>'+h(p?.biology_check||'Source link; verification status unavailable')+'</span></div>';
   };
   const sire=parentBy('sire'),dam=parentBy('dam');
   const details=info.details||{};
   const seasons=(info.seasons||[]).map(s=>'<div class="profile-season-row"><strong>'+h(s.year)+'</strong><span>'+h(s.stakes_wins??'—')+' stakes wins · '+h(s.top3_starts??'—')+' top-three stakes starts</span><small>'+h(s.region||'Region not recorded')+' · owner '+h(s.owner_id||'not recorded')+' · trainer '+h(s.trainer_id||'not recorded')+' · jockey '+h(s.jockey_id||'not recorded')+'</small></div>').join('');
   const wins=(info.seasons||[]).filter(s=>Number(s.stakes_wins)>0).map(s=>'<li>'+h(s.year)+': '+h(s.stakes_wins)+' source-recorded stakes wins</li>').join('');
   panel.innerHTML=parentCard('SIRE',sire,details.sire_id)+parentCard('DAM',dam,details.dam_id);
   const extra='<div class="profile-season-history"><div class="profile-section-title"><div><span class="smallcaps">ARCHIVE BY SEASON</span><h3>Season record</h3></div></div>'+(seasons||'<p class="empty-note">No horse seasons in the loaded source.</p>')+'</div>';
   panel.insertAdjacentHTML('afterend',extra);
   const achievements=$('detail-content').querySelector('.achievement-list');
   if(achievements&&wins)achievements.innerHTML=wins;
  }catch{const panel=$('horse-pedigree-panel');if(panel)panel.innerHTML='<div class="pedigree-card"><small>PEDIGREE</small><strong>Details unavailable</strong></div>'}
 }
}
function closeDrawer(){ state.openDetail=null; $('detail-drawer').classList.remove('open');$('detail-drawer').setAttribute('aria-hidden','true');$('drawer-backdrop').hidden=true;}
function showRename(type,id,current){
 if(!['entity','race','venue','pedigree'].includes(type)||!id||!current)return;
 const record=type==='entity'?entity(id):type==='race'||type==='venue'?race(id):null;
 const source=type==='venue'?record?.source_track_name:record?.source_name;
 state.rename={type,id,current,source:source||null};
 $('name-source-wrap').hidden=!source;
 $('name-source').value=source||'';
 $('name-target').textContent=`${type.toUpperCase()} · ${id}`;
 $('name-current').value=current;
 $('name-new').value=current;
 $('save-name').disabled=state.mode!=='D1_CONNECTED';
 $('name-note').innerHTML=state.mode==='D1_CONNECTED'
  ?'<strong>Saved to WTW:</strong> the displayed name changes throughout this private site. Original records, IDs and race results are preserved, with every edit logged.'
  :'<strong>Source preview only:</strong> the private historical database is not connected yet. Save will become available when the import succeeds.';
 $('name-dialog').showModal();$('name-new').focus();$('name-new').select();
}
async function saveName(e){
 e.preventDefault();const item=state.rename;if(!item)return;
 if(state.mode!=='D1_CONNECTED'){toast('Name changes require the private WTW database.');return}
 const next=$('name-new').value.trim();
 if(!next||next===item.current){toast('Enter a different name.');return}
 $('save-name').disabled=true;
 try {
   const resp=await fetch('/api/names',{method:'POST',credentials:'same-origin',headers:{'Content-Type':'application/json'},body:JSON.stringify({target_type:item.type,target_id:item.id,expected_name:item.current,name:next})});
   const body=await resp.json().catch(()=>({}));if(!resp.ok)throw Error(body.error||'Name update failed');
   state.nameEdits.unshift({target_type:item.type,target_id:item.id,old_display_name:item.current,new_display_name:next,source_name:body.source_name||item.source||'',editor_email:'authorized administrator',edited_at:new Date().toISOString()});
   if(item.type==='entity'){
     const record=entity(item.id);
     if(record){
       record.name=next;
       if(record.kind==='track'){
         for(const edition of state.data.races){
           if(edition.track_id===record.id&&!edition.venue_override_name)edition.track_name=next;
         }
       }
     }
   }
   if(item.type==='race'){const record=race(item.id);if(record)record.name=next}
   if(item.type==='venue'){const record=race(item.id);if(record){record.track_name=next;record.venue_override_name=next}}
   $('name-dialog').close();render();
   if(state.openDetail && $('detail-drawer').classList.contains('open')){
      await openDetail(state.openDetail.type,state.openDetail.id);
   }
   toast('Saved to WTW. Name updated; historical source remains unchanged.');
 }catch(err){toast('Unable to save name: '+err.message)}
 finally{$('save-name').disabled=false}
}
function targetOf(type,id){if(type==='entity')return entity(id);if(type==='race')return race(id);if(type==='connection')return state.data.connections.find(v=>v.id===id);if(type==='result'){const [edition,pos]=id.split('::');return state.data.results.find(v=>v.edition_id===edition&&String(v.position)===pos)}return null}
function showEdit(type,id){const target=targetOf(type,id);if(!target){toast('Source record not found.');return;}state.edit={type,id,target};const sel=$('edit-field');sel.innerHTML=Object.entries(fields[type]).map(([value,label])=>`<option value="${h(value)}">${h(label)}</option>`).join('');$('edit-target-type').value=type;$('edit-target-id').value=id;$('edit-target').textContent=`${type.toUpperCase()} · ${target.name||nameFor(target.horse_id)||id} · ${id}`;$('edit-reason').value='';$('edit-proposed').value='';fillOld();$('edit-dialog').showModal()}
function fillOld(){if(!state.edit)return;const field=$('edit-field').value;$('edit-original').value=String(state.edit.target[field]??'');$('edit-proposed').placeholder='Enter the corrected '+(fields[state.edit.type][field]||field).toLowerCase();}
async function fetchBootstrap(){const r=await fetch('/api/bootstrap',{credentials:'same-origin',cache:'no-store'});if(!r.ok){const info=await r.json().catch(()=>({}));throw new Error(`HTTP ${r.status}: ${info.error||'Private D1 API unavailable'}`)}return r.json()}
async function initialize(){
 try {const live=await fetchBootstrap();state.mode=live.mode;state.data={meta:{title:'WIRE TO WIRE — isolated D1 import',scope:live.partial?'Partial page of data: search the backend for more':'Currently imported records',authority:'Source snapshot, separate from original WTW master',note:'Approved-for-promotion proposals do not alter source records.',counts:live.counts,partial:live.partial,historySource:live.historySource},entities:live.entities,connections:live.connections,races:live.races,results:live.results};state.changes=live.changes;state.nameEdits=live.nameEdits||[];state.availableYears=live.years||[];}
 catch (error) {state.apiIssue=error.message;try {const r=await fetch('/sample-history.json',{cache:'no-store'});if(!r.ok)throw Error('Sample data unavailable');state.data=await r.json();state.mode='DEMO';state.changes=storedChanges();}catch{state.data={meta:{title:'WTW empty sample',scope:'No data loaded'},entities:[],connections:[],races:[],results:[]};state.mode='DEMO';state.changes=storedChanges()}}
 try { const r=await fetch('/data/track-geography-v33.json',{cache:'no-store'}); if(r.ok){const d=await r.json();if(d?.counts?.total===134&&Array.isArray(d.tracks)&&d.tracks.length===134&&new Set(d.tracks.map(t=>t.id)).size===134)state.trackDirectory=d; } } catch {}
 rebuildResultIndex();
 const yrs=years();if(yrs.length&&!yrs.includes(state.year))state.year=yrs[0];$('year-select').innerHTML=yrs.map(y=>`<option value="${y}">${y}</option>`).join('');$('year-select').value=String(state.year);render();
}
async function saveProposal(e){e.preventDefault();if(!state.edit)return;
 const type=state.edit.type,id=state.edit.id,field=$('edit-field').value,proposed=$('edit-proposed').value.trim(),reason=$('edit-reason').value.trim(),old=state.edit.target[field];
 if(!proposed||proposed===String(old??'')){toast('Enter a different proposed value.');return}if(reason.length<10){toast('Please give at least 10 characters of explanation.');return}
 const body={target_type:type,target_id:id,field,proposed_value:proposed,reason};
 if(state.mode==='D1_CONNECTED'){
  try{const r=await fetch('/api/changes',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body),credentials:'same-origin'}),d=await r.json();if(!r.ok)throw Error(d.error||'Save failed');const latest=await fetchBootstrap();state.changes=latest.changes;toast('Correction saved to the WTW review queue.');}catch(ex){toast('Unable to save: '+ex.message);return}
 } else {state.changes.unshift({...body,old_value:String(old??''),id:crypto.randomUUID?.()||`local-${Date.now()}`,status:'PENDING',created_by:'local-review',created_at:new Date().toISOString()});storeChanges();toast('Saved locally for review. Not synced to Cloudflare or the WTW master.')}
 $('edit-dialog').close();render();
}
async function decideChange(id,decision){const item=state.changes.find(v=>v.id===id);if(!item||item.status!=='PENDING')return;
 if(state.mode==='D1_CONNECTED'){
  try{const r=await fetch(`/api/changes/${encodeURIComponent(id)}/decision`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({decision}),credentials:'same-origin'}),d=await r.json();if(!r.ok)throw Error(d.error||'Decision failed');const latest=await fetchBootstrap();state.changes=latest.changes;}catch(ex){toast(ex.message);return}
 } else {item.status=decision;item.decided_at=new Date().toISOString();storeChanges()}
 toast(decision==='REJECTED'?'Proposal rejected.':'Approved for future promotion; source record remains untouched.');render();
}
document.addEventListener('click',e=>{const t=e.target.closest('[data-page],[data-year],[data-calendar-step],[data-calendar-agenda],[data-open-type],[data-edit-type],[data-rename-type],[data-close-drawer],[data-review-action]');if(!t)return;
 if(t.dataset.page){setPage(t.dataset.page);return}if(t.dataset.year){setYear(t.dataset.year);return}if(t.dataset.calendarStep){const next=Number(state.calendarMonth)+Number(t.dataset.calendarStep);if(next>=0&&next<=11){state.calendarMonth=next;render()}return}if(t.dataset.calendarAgenda){const agenda=document.getElementById('calendar-agenda');agenda?.scrollIntoView({behavior:'smooth',block:'center'});agenda?.focus({preventScroll:true});return}if(t.dataset.closeDrawer){closeDrawer();return}if(t.dataset.renameType){showRename(t.dataset.renameType,t.dataset.id,t.dataset.currentName);return}if(t.dataset.openType){openDetail(t.dataset.openType,t.dataset.id);return}if(t.dataset.editType){showEdit(t.dataset.editType,t.dataset.id);return}if(t.dataset.reviewAction){decideChange(t.dataset.reviewId,t.dataset.reviewAction)}
});
$('year-select').addEventListener('change',e=>setYear(e.target.value));
document.addEventListener('change',e=>{const monthControl=e.target.closest('#calendar-month-select');if(monthControl){state.calendarMonth=Number(monthControl.value);render();return}const control=e.target.closest('[data-game-pref]');if(!control)return;const key=control.dataset.gamePref;if(!['role','involvement'].includes(key))return;state[key]=control.value;try{localStorage.setItem(GAME_PREF_KEY,JSON.stringify({role:state.role,involvement:state.involvement}));}catch{}render();});
$('global-search').addEventListener('input',e=>{state.search=e.target.value.trim();if(state.search)state.page='search';else if(state.page==='search')state.page='overview';render()});
$('edit-field').addEventListener('change',fillOld);
$('edit-form').addEventListener('submit',saveProposal);
$('name-form').addEventListener('submit',saveName);
$('restore-name').addEventListener('click',()=>{if(!state.rename?.source)return;$('name-new').value=state.rename.source;$('name-new').focus()});
$('close-name-dialog').addEventListener('click',()=>$('name-dialog').close());
$('cancel-name-dialog').addEventListener('click',()=>$('name-dialog').close());
$('close-dialog').addEventListener('click',()=>$('edit-dialog').close());
$('cancel-dialog').addEventListener('click',()=>$('edit-dialog').close());
$('drawer-backdrop').addEventListener('click',closeDrawer);
$('mobile-menu').addEventListener('click',()=>$('sidebar').classList.toggle('mobile-open'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
initialize();