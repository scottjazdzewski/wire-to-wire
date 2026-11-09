/* Wire to Wire — next-generation playable UI.
 * Adapter only: reads the existing Office DOM and triggers its canonical handlers.
 * Does not create a new simulation, game ledger or save namespace. */
(()=>{
'use strict';
const $=(q,p=document)=>p.querySelector(q), $$=(q,p=document)=>[...p.querySelectorAll(q)];
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const badge=kind=>`/assets/profile-badges/v2/wtw_badge_${kind}.png`;
const root=document.createElement('div');root.id='wtwNextgen';root.setAttribute('aria-label','Wire to Wire game interface');
const APP={section:'Office',page:'Office',custom:'',filter:'All',msgPage:0,focus:'',outTab:0,detailTab:'Overview',routeId:'',ready:false,activeCase:'powerline',paintQueued:false};
const tabmap={Office:['Overview','Messages','Decisions','Calendar','News','Reports','Career'],Stable:['Overview','Horses','Training','Health','Race Plans','Barns'],Racing:['Overview','Calendar','Entries','Results','Stakes','Race Planning'],Breeding:['Overview','Stallions','Broodmares','Foals','Pedigrees','Stud Farms'],Sales:['Overview','Auctions','Catalogs','Watchlist','Private Offers'],Personnel:['Overview','Trainers','Jockeys','Owners','Staff'],Facilities:['Overview','Barns','Training Centers','Farms'],Finances:['Overview','Cash Flow','Operating Costs','Budgets'],World:['Overview','Tracks','Meets','Major Races','News','History']};
const actions={Office:'Office Overview',Stable:'Stable',Racing:'Race Calendar',Sales:'Sales',World:'World'};
const officeMenu={Overview:'Office Overview',Messages:'Filter All',Decisions:'Open move history',Calendar:'Open Race Calendar',News:'News',Reports:'Open move history',Career:'Open move history'};
const state=()=>{try{return JSON.parse(localStorage.getItem('wtwOfficeStateV30')||'{}')}catch{return {}}};
const originalAct=(act)=>{const o=$$('.app [data-act]').find(n=>n.dataset.act===act);return o||null;};
function bridgeNode(node){if(!node)return;node.click(); schedulePaint(15)}
function syntheticAction(el){const dummy=el.cloneNode(true); dummy.style.display='none'; document.body.appendChild(dummy);dummy.click();dummy.remove();schedulePaint(15)}
function goOffice(){APP.custom='';APP.section='Office';APP.page='Office';bridgeNode(originalAct('Office Overview'));paint()}
function openMenu(section){
 APP.section=section;APP.page='Overview';APP.custom='';
 if(actions[section])bridgeNode(originalAct(actions[section]));
 else{APP.custom=section; paint()}
}
function pageTab(name){APP.page=name; const s=APP.section;
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
const selectMessage=id=>{APP.activeCase=id;const m=$(`.left .msg[data-case="${CSS.escape(id)}"]`);if(m)bridgeNode(m);paint()};
const currDesk=()=>({type:$('#deskType')?.textContent.trim()||'RACING FILE',title:$('#deskTitle')?.textContent.trim()||'',summary:$('#deskSummary')?.textContent.trim()||'',pressure:$('#deskPressure')?.textContent.trim()||'',risk:$('#deskRisk')?.textContent.trim()||'',read:$('#deskRead')?.textContent.trim()||'',source:$('#deskSource')?.textContent.trim()||'',moves:$$('#moveGrid .moveCard').map(n=>({title:$('strong',n)?.textContent.trim()||'',tag:$('span',n)?.textContent.trim()||'',node:n})),intel:$$('#intelGrid .intelCard').map(n=>({title:$('b',n)?.textContent.trim()||'',body:$('p',n)?.textContent.trim()||'',tone:n.classList.contains('red')?'red':n.classList.contains('gold')?'gold':n.classList.contains('blue')?'blue':'green'}))});
const horseRows=()=>$$('.right .boardRows .rankRow').map((n,i)=>({name:$('strong',n)?.textContent.trim()||'',activity:$('.wtwV37HorseActivity',n)?.textContent.trim()||n.title||'No current Office activity recorded',tag:n.querySelector(':scope > span:last-child')?.textContent.trim()||'',index:i+1}));
const racingRows=()=>$$('.right .fixtureList .fixture[data-track]').map(n=>{const name=$('h4',n)?.textContent.trim()||'';const saved=state();const isPowerline=name==='Powerline';const confirmed=isPowerline && (saved.calendarState?.['Churchill R3']?.status==='Entered' || /^Entered/i.test(saved.horseState?.Powerline?.status||''));return {name,date:$('.d',n)?.textContent.trim()||'',track:n.dataset.track||'',tag:$('.raceTag',n)?.textContent.trim()||'',status:confirmed?'Entered':($('.wtwV37EntryFlag',n)?.textContent.trim()||'Target')}});
function menuIcon(kind){const names={mail:'✉',horse:'♞',race:'▤',intel:'◈',move:'➜',lead:'✦'};return names[kind]||'●'}
function header(){const date=$('.dateChip')?.textContent.trim()||'2014-07-15';const horses=horseRows().length,races=racingRows().length;
 return `<header class="ng-global"><div class="ng-hist"><button data-ng="back" title="Previous page">‹</button><button data-ng="forward" title="Next page">›</button></div><img class="ng-logo-mini" src="/assets/wtw-office-approved-logo.png" alt="Wire to Wire"/><nav class="ng-primary" aria-label="Main navigation">${Object.keys(tabmap).map(x=>`<button data-ng="menu" data-val="${x}" class="${APP.section===x?'on':''}">${x.toUpperCase()}<small>⌄</small></button>`).join('')}</nav><div class="ng-global-tools"><button class="ng-iconbtn" data-ng="custom" data-val="Search" title="Search">⌕</button><button class="ng-iconbtn" data-ng="custom" data-val="Messages" title="Inbox">✉</button><button class="ng-iconbtn" data-ng="action" data-val="Save" title="Save game">▣</button></div></header>
 <div class="ng-mast"><div class="ng-brand"><img class="ng-brand-logo" src="/assets/wtw-office-approved-logo.png" alt="WTW logo"/><div class="ng-brand-copy"><div class="ng-eyebrow">Racing management · Executive Office</div><div class="ng-brand-name">${APP.section==='Office'?'WIRE TO WIRE':safe(APP.section.toUpperCase())}</div><div class="ng-brand-sub">${APP.section==='Office'?'Your stable, decisions, entries and racing world':`Wire to Wire / ${safe(APP.section)} operations`}</div></div></div><div class="ng-briefstats"><div><b>${horses}</b><small>Horses</small></div><div><b>${races}</b><small>Race targets</small></div></div><div class="ng-dateblock"><strong>${safe(date)}</strong><span>In-world office date</span></div><button class="ng-continue" data-ng="action" data-val="Continue">CONTINUE&nbsp;&nbsp; ›</button></div>
 <div class="ng-subbar"><nav class="ng-subnav" aria-label="Section navigation">${(tabmap[APP.section]||['Overview']).map(x=>`<button data-ng="tab" data-val="${safe(x)}" class="${APP.page===x||(APP.page==='Office'&&x==='Overview')?'on':''}">${safe(x)}</button>`).join('')}</nav><div class="ng-fastnav"><button data-ng="menu" data-val="Stable">♞ Stable</button><button data-ng="menu" data-val="Racing">▤ Race Calendar</button><button data-ng="custom" data-val="Opportunities">✦ Opportunities</button></div></div>`;
}
function filteredMessages(){const rows=currentMessages();return rows.filter(m=>APP.filter==='All'||(APP.filter==='Urgent'&&m.urgent)||(APP.filter==='New'&&!m.resolved)||(APP.filter==='Unread'&&!m.resolved))}
function inbox(){const arr=filteredMessages();const size=6;const pages=Math.max(1,Math.ceil(arr.length/size));APP.msgPage=Math.min(APP.msgPage,pages-1);const slice=arr.slice(APP.msgPage*size,(APP.msgPage+1)*size);
return `<aside class="ng-left"><section class="ng-card ng-inbox"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('people')}" alt=""/><h3>MESSAGES & STAFF REPORTS</h3><small>${currentMessages().filter(x=>!x.resolved).length} ACTIVE</small></header><div class="ng-filters">${['All','New','Urgent','Unread'].map(v=>`<button class="${APP.filter===v?'on':''}" data-ng="filter" data-val="${v}">${v}${v==='Urgent'?' (2)':''}</button>`).join('')}</div><div class="ng-inboxdate">OFFICE FEED · ${safe($('.dateChip')?.textContent||'')}</div><div class="ng-msgs" style="grid-template-rows:repeat(${Math.max(1,slice.length)},minmax(0,1fr))">${slice.map(m=>`<button class="ng-msg ${m.case===APP.activeCase?'on':''} ${m.urgent?'urgent':''}" data-ng="case" data-val="${safe(m.case)}"><div class="ng-avatar">${safe(m.initials)}</div><div class="ng-msgcopy"><div class="ng-msgfrom">${safe(m.from)}</div><div class="ng-msgtitle">${safe(m.title)}</div><div class="ng-msgmeta">${safe(m.meta)}</div></div><div class="ng-msgtrail"><span class="ng-msgtag ${m.urgent?'urgent':/sale|cash/i.test(m.title)?'sale':''}">${m.urgent?'Priority':/vet|filling|soundness/i.test(m.title)?'Vet':/catalog|sale/i.test(m.title)?'Sales':'Office'}</span><div class="ng-msgtime">${safe(m.time)}</div></div></button>`).join('')}</div><footer class="ng-inboxfoot"><span>${arr.length?APP.msgPage*size+1:0}–${Math.min(arr.length,(APP.msgPage+1)*size)} of ${arr.length} messages</span><button data-ng="prev-msg" ${APP.msgPage===0?'disabled':''}>‹</button> ${APP.msgPage+1}/${pages} <button data-ng="next-msg" ${APP.msgPage>=pages-1?'disabled':''}>›</button></footer></section></aside>`}
function center(){const d=currDesk(); const resolved=state().resolvedCases?.[APP.activeCase];
const source= d.source&&d.source!=='—'?d.source:'Stable Office';
const moves = resolved?`<div class="ng-resolved"><strong>✓ ${safe(resolved.choiceTitle)}</strong><div class="ng-resolvedtabs">${['Effect','Barn Reaction','Follow-up'].map((t,i)=>`<button class="${APP.outTab===i?'on':''}" data-ng="outtab" data-val="${i}">${t}</button>`).join('')}</div><div class="ng-outtext">${safe([resolved.immediate,resolved.reaction,resolved.followUp][APP.outTab])}</div><button class="ng-openhorse" data-ng="profile-from-case">OPEN RELATED PROFILE ↗</button></div>`:d.moves.map((m,i)=>`<button class="ng-move" data-ng="move" data-val="${i}"><span class="ng-movetag">${safe(m.tag)}</span><strong>${safe(m.title)}</strong><span class="ng-movearrow">›</span></button>`).join('');
return `<section class="ng-main"><section class="ng-card ng-feature"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('career_record')}" alt=""/><h3>DECISION DESK</h3><span class="ng-rightlabel">TODAY'S PRIORITY · ${$$('.left .msg[data-case]').findIndex(n=>n.dataset.case===APP.activeCase)+1} OF ${currentMessages().length}</span></header><div class="ng-featurebody"><div class="ng-case"><div class="ng-case-eyebrow">${safe(d.type)}</div><h2>${safe(d.title)}</h2><p>${safe(d.summary)}</p><div class="ng-facts">${[['Pressure',d.pressure],['Primary risk',d.risk],['Best read',d.read]].map(x=>`<div class="ng-fact"><small>${safe(x[0])}</small><b>${safe(x[1])}</b></div>`).join('')}</div><div class="ng-caseactions"><button data-ng="action" data-val="Open file">OPEN DECISION FILE ↗</button><button class="alt" data-ng="profile-from-case">HORSE PROFILE ↗</button></div></div><div class="ng-featurephoto"><img src="/assets/wtw-office-original-photo.jpg" alt="Racing stable atmosphere"/><div class="ng-photo-caption">Racing office · Reference imagery</div></div></div></section><div class="ng-centerbottom"><section class="ng-card ng-intel"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('connections')}" alt=""/><h3>INTELLIGENCE</h3><button class="ng-rightlabel" data-ng="action" data-val="Open current source">${safe(source)} ↗</button></header><div class="ng-intelgrid">${d.intel.map((item,i)=>`<button class="ng-intelitem" style="--accent:${['#3fc48d','#cc5b6d','#dfbb62','#56a4bd'][i%4]}" data-ng="intel" data-val="${i}"><b>${safe(item.title)}</b><p>${safe(item.body)}</p></button>`).join('')}</div></section><section class="ng-card ng-choices"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('major_races')}" alt=""/><h3>YOUR OPTIONS</h3><small>${resolved?'DECISION RECORDED':`${d.moves.length} CHOICES`}</small></header><div class="ng-moves">${moves}</div></section></div></section>`}
function right(){const horses=horseRows();const races=racingRows();const entered=races.filter(r=>/entered/i.test(r.status)).length;
return `<aside class="ng-right"><section class="ng-card ng-roster"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('horse')}" alt=""/><h3>YOUR STABLE</h3><button class="ng-rightlabel" data-ng="menu" data-val="Stable">${horses.length} HORSES · VIEW ALL ↗</button></header><div class="ng-rosterrows">${horses.map(h=>`<button class="ng-rosterrow" aria-label="Open horse profile: ${safe(h.name)}" data-ng="horse" data-val="${safe(h.name)}"><span class="ng-number">${String(h.index).padStart(2,'0')}</span><span class="ng-rostercopy"><span class="ng-horsename">${safe(h.name)}</span><div class="ng-horseact">${safe(h.activity)}</div></span><span class="ng-rostertag">${safe(h.tag)}</span></button>`).join('')}</div></section><section class="ng-card ng-races"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/><h3>UPCOMING RACES</h3><button class="ng-rightlabel" data-ng="menu" data-val="Racing">${entered?`${entered} ENTERED · `:''}${races.length} TARGETS ↗</button></header><div class="ng-entrylist">${races.map(r=>`<button class="ng-entryrow" aria-label="Open racecourse: ${safe(r.track)}" data-ng="track" data-val="${safe(r.track)}"><span class="ng-entrydate">${safe(r.date)}</span><span class="ng-entrycopy"><span class="ng-entryname">${safe(r.name)}</span><div class="ng-entrytrack">🇺🇸 ${safe(r.track)}</div></span><span class="ng-entrytag">${safe(r.tag)}<span class="ng-entrystatus ${/entered/i.test(r.status)?'entered':''}">${safe(r.status.replace('·','').trim())}</span></span></button>`).join('')}</div></section><button class="ng-leads" data-ng="custom" data-val="Opportunities"><img class="ng-headicon" src="${badge('reputation')}" alt=""/><strong>OPPORTUNITIES</strong><small>3 LEADS &nbsp; ›</small></button></aside>`}
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
 const identity=`<div class="ng-profile-intro">
  <div class="ng-profile-badgeframe"><img src="${badge(route.kicker==='Horse Profile'?'horse':route.kicker==='Track Profile'?'track':route.kicker==='People Profile'?'people':'farm_stable')}" alt="Approved ${safe(route.kicker)} badge"/></div>
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
 return `<section class="ng-card ng-timeline" aria-label="Upcoming 14-day racing and stable calendar"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/><h3>14-DAY OPERATIONS CALENDAR</h3><small>${month.format(base).toUpperCase()} ${base.getFullYear()} · ENTRY STATUS IS SOURCE-DRIVEN</small></header><div class="ng-timeline-grid">${cells}</div><footer class="ng-timeline-legend"><span><i class="target"></i>Race target</span><span><i class="entered"></i>Confirmed entry</span><span><i class="commitment"></i>Other obligation</span></footer></section>`;
}
function functionalRoute(route){
 if(route.kicker==='Stable'){
  const horses=horseRows(), races=racingRows();const st=state();
  return `<section class="ng-functional"><div class="ng-functionalstats"><div><b>${horses.length}</b><span>Horses in current office</span></div><div><b>${races.length}</b><span>Race targets under review</span></div><div><b>${Object.keys(st.resolvedCases||{}).length}</b><span>Office decisions recorded</span></div></div><div class="ng-functionalcontent"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('horse')}" alt=""/><h3>ALL HORSES · CURRENT STABLE</h3><small>${horses.length} ACTIVE FILES</small></header><div class="ng-tableheaders"><span>HORSE</span><span>OFFICE ACTIVITY</span><span>RACE TARGET</span><span>STATUS</span></div>${horses.map(h=>{const race=races.find(r=>r.name===h.name);return `<button class="ng-managementrow" data-ng="horse" data-val="${safe(h.name)}"><strong>${safe(h.name)}</strong><span>${safe(h.activity)}</span><span>${safe(race?race.track+' · '+race.date:'No scheduled target')}</span><i>${safe(h.tag)} ›</i></button>`}).join('')}</section><section class="ng-card ng-sideinfo"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('connections')}" alt=""/><h3>STABLE COMMAND</h3></header><div class="ng-commandnotes"><strong>Manager's daily overview</strong><p>Horse names open their individual racing profiles. All status information comes from the same Office state and updates after decisions.</p><button data-ng="menu" data-val="Racing">VIEW RACE CALENDAR ↗</button><button data-ng="custom" data-val="Opportunities">REVIEW OPPORTUNITIES ↗</button></div></section></div></section>`;
 }
 if(route.kicker==='Race Calendar'){
  const races=racingRows();const entered=races.filter(r=>/Entered/i.test(r.status)).length;
  const nonraces=$$('.right .fixtureList .fixture:not([data-track])').map(n=>({date:$('.d',n)?.textContent.trim()||'',name:$('h4',n)?.textContent.trim()||'',detail:$('p',n)?.textContent.trim()||''}));
  return `<section class="ng-functional"><div class="ng-functionalstats"><div><b>${races.length}</b><span>Upcoming racing targets</span></div><div><b>${entered}</b><span>Entries confirmed</span></div><div><b>${races.length-entered}</b><span>Targets under consideration</span></div></div>${calendarTimeline(races,nonraces)}<div class="ng-functionalcontent"><section class="ng-card ng-managementtable"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('meet_schedule')}" alt=""/><h3>RACING CALENDAR & ENTRIES</h3><small>SOURCE-CONNECTED TARGETS</small></header><div class="ng-tableheaders ng-raceheaders"><span>DATE</span><span>HORSE</span><span>RACECOURSE</span><span>STATUS</span></div>${races.map(r=>`<div class="ng-managementrow ng-racerow"><span>${safe(r.date)}</span><button data-ng="horse" data-val="${safe(r.name)}">${safe(r.name)} ↗</button><button data-ng="track" data-val="${safe(r.track)}">🇺🇸 ${safe(r.track)} · ${safe(r.tag)} ↗</button><i class="${/Entered/i.test(r.status)?'ng-entered':''}">${safe(r.status.replace('·','').trim())}</i></div>`).join('')}</section><section class="ng-card ng-sideinfo"><header class="ng-cardhead"><img class="ng-headicon" src="${badge('history')}" alt=""/><h3>OTHER COMMITMENTS</h3></header><div class="ng-commandnotes">${nonraces.map(r=>`<div class="ng-commitment"><small>${safe(r.date)}</small><strong>${safe(r.name)}</strong><span>${safe(r.detail)}</span></div>`).join('')}<p>Targets are not reported as confirmed entries until the original decision engine records them.</p></div></section></div></section>`;
 }
 return null;
}
function renderRoute(){const route=currentRoute();const title=route?.title||APP.custom||'Page';const kicker=route?.kicker||APP.section;const bdg=route?badge(({'Horse Profile':'horse','People Profile':'people','Farm Profile':'farm_stable','Track Profile':'track','Race Calendar':'meet_schedule','Stable':'farm_stable','Sales':'connections','News':'history','World':'track','Opportunity Board':'reputation'}[route.kicker])||'history'):pageBadge();
let body='';const profile=route&&/Profile$/.test(route.kicker)?profileDetail(route):null;const functional=route?functionalRoute(route):null;if(profile)body=profile;else if(functional)body=functional;else if(route)body=route.body;else if(APP.custom==='Messages'){body=`<section class="ng-customcard"><h3>Messages and correspondence</h3><p>Select any item to return to the Decision Desk and review its options.</p>${currentMessages().map(m=>`<button data-ng="case" data-val="${safe(m.case)}">${safe(m.from)} — ${safe(m.title)}</button>`).join('')}</section>`}
else if(APP.custom==='Decisions'){body=`<section class="ng-customcard"><h3>Today's Decisions</h3>${currentMessages().map(m=>`<button data-ng="case" data-val="${safe(m.case)}">${safe(m.title)} ↗</button>`).join('')}</section>`}
else if(APP.custom==='Opportunities'){body=`<section class="ng-customcard"><h3>Opportunity Board</h3><p>Uncommitted racing and commercial leads from the Office's original data.</p><button data-ng="action" data-val="Open opportunity board">OPEN EXISTING OPPORTUNITY BOARD ↗</button></section>`}
else if(APP.custom==='Search'){body=`<section class="ng-customcard"><h3>Find a horse or racetrack</h3><p>Search across the horses and racecourses currently connected to this Office.</p>${horseRows().map(h=>`<button data-ng="horse" data-val="${safe(h.name)}">${safe(h.name)}</button>`).join('')}${racingRows().map(r=>`<button data-ng="track" data-val="${safe(r.track)}">${safe(r.track)}</button>`).join('')}</section>`}
else {const category=APP.custom||APP.section;const features=(tabmap[APP.section]||[]).filter(x=>x!=='Overview');body=`<div class="ng-custompage">${features.map(x=>`<section class="ng-customcard"><h3>${safe(x)}</h3><p>The ${safe(category)} view is reserved for source-connected records. We won't invent figures, horse IDs, or outcomes.</p><button data-ng="tab" data-val="${safe(x)}">OPEN ${safe(x).toUpperCase()} ↗</button></section>`).join('')}</div>`}
const isProfile=Boolean(profile);
return `<main class="ng-route ${isProfile?'ng-route-profile':''}">${isProfile?'':`<header class="ng-routeheading"><img class="ng-routebadge" src="${safe(bdg)}" alt=""/><div class="ng-routetext"><small>${safe(kicker)}</small><h1>${safe(title)}</h1></div><button class="ng-back" data-ng="office">← RACING OFFICE</button></header>`}<div class="ng-routegrid"><div class="ng-routeinner">${body}</div></div></main>`;}
function paint(){if(!APP.ready)return;APP.activeCase=$('.left .msg.selected')?.dataset.case||APP.activeCase;const route=currentRoute();root.innerHTML=header()+((route||APP.custom)?renderRoute():`<main class="ng-board">${inbox()}${center()}${right()}</main>`);}
function schedulePaint(ms=0){if(APP.paintQueued)return;APP.paintQueued=true;setTimeout(()=>{APP.paintQueued=false;paint()},ms)}
// Capture new UI clicks before the old Office's document-level delegated handler.
window.addEventListener('click',e=>{
 const btn=e.target.closest('#wtwNextgen [data-ng],#wtwNextgen [data-act]');if(!btn)return;
 e.preventDefault();e.stopImmediatePropagation();e.stopPropagation();
 const key=btn.dataset.ng, val=btn.dataset.val||'';
 if(!key && btn.dataset.act){syntheticAction(btn);return}
 if(key==='menu')return openMenu(val);
 if(key==='tab')return pageTab(val);
 if(key==='office')return goOffice();
 if(key==='case'){APP.custom='';APP.section='Office';APP.page='Overview';selectMessage(val);return}
 if(key==='filter'){APP.filter=val;APP.msgPage=0;return paint()}
 if(key==='prev-msg'){APP.msgPage=Math.max(0,APP.msgPage-1);return paint()}
 if(key==='next-msg'){APP.msgPage++;return paint()}
 if(key==='horse'){const row=$$('.right .rankRow').find(x=>$('strong',x)?.textContent.trim()===val);return bridgeNode(row)}
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
document.body.append(root);document.body.classList.add('wtw-next-active');APP.ready=true;
// Restore direct route link: existing Office script owns history and route hydration.
paint();setTimeout(paint,110);
window.__WTW_NEXT__={paint,app:APP,horseRows,racingRows,currentMessages,state};
})();
