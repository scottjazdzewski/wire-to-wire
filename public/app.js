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
const state = {page:'overview',year:1953,search:'',data:null,mode:'LOADING',changes:[],edit:null,rename:null};
const SAMPLE_KEY = 'wtw_canon_desk_local_proposals_v1';
let toastTimeout;
function storedChanges(){try{return JSON.parse(localStorage.getItem(SAMPLE_KEY)||'[]')}catch{return []}}
function storeChanges(){try{localStorage.setItem(SAMPLE_KEY,JSON.stringify(state.changes))}catch{}}
function pill(text,style=''){return `<span class="ribbon ${style}">${h(text)}</span>`}
function entity(id){return state.data?.entities.find(v=>v.id===id)}
function race(id){return state.data?.races.find(v=>v.id===id)}
let resultIndex=new Map();
function rebuildResultIndex(){resultIndex=new Map();for(const r of state.data?.results||[]){if(!resultIndex.has(r.edition_id))resultIndex.set(r.edition_id,[]);resultIndex.get(r.edition_id).push(r)}}
function resultOf(id){return resultIndex.get(id)||[]}
function nameFor(id){return entity(id)?.name || id || 'Unrecorded'}
function years(){return [...new Set((state.data?.races||[]).map(v=>Number(v.year)).filter(Boolean))].sort((a,b)=>a-b)}
function formatStatus(s){if(s==='NAME_APPROVED')return pill('Approved');if(s==='NAME_REVIEW')return pill('Name review','pending');if(s==='PENDING')return pill('Pending','pending');if(s==='APPROVED_FOR_PROMOTION')return pill('Approved for promotion');if(s==='REJECTED')return pill('Rejected','red');return pill(s||'Source snapshot','gray')}
function count(kind){return state.data?.entities.filter(e=>e.kind===kind).length||0}
function renameButton(type,id,name){return `<button type="button" class="inline-rename" data-rename-type="${h(type)}" data-id="${h(id)}" data-current-name="${h(name)}" title="Edit this name" aria-label="Edit name ${h(name)}">✎</button>`}
function openButton(type,id,label){return `<span class="name-edit-pair"><button type="button" class="name-cell" data-open-type="${h(type)}" data-id="${h(id)}">${h(label)}</button>${renameButton(type,id,label)}</span>`}
function venueName(record){if(!record?.track_name)return 'Track unrecorded';return `<span class="name-edit-pair"><span>${h(record.track_name)}</span>${renameButton('venue',record.id,record.track_name)}</span>`}
function editButton(type,id,label='Propose correction',className='button button-quiet'){return `<button class="${className}" data-edit-type="${h(type)}" data-id="${h(id)}">${h(label)}</button>`}
function pageTitle(){return ({overview:'The Universe',seasons:'Historical Seasons',horses:'Horse Registry',people:'People & Stables',tracks:'Track Registry',races:'Race History',changes:'Corrections & Approvals',sources:'Sources & Verification'})[state.page]||'The Universe'}
function intro(label,title,desc,more=''){return `<div class="page-intro"><div><div class="smallcaps">${h(label)}</div><h2>${h(title)}</h2><p>${h(desc)}</p></div>${more}</div>`}
function metric(value,label,foot){return `<div class="metric"><div class="metric-label">${h(label)}</div><div class="metric-value">${h(value)}</div><div class="metric-foot">${h(foot)}</div></div>`}
function section(title,subtitle='',content='',action=''){return `<section class="panel"><div class="panel-head"><div><h3>${h(title)}</h3><p>${h(subtitle)}</p></div>${action}</div>${content}</section>`}
function noRecords(desc){return `<div class="empty"><h3>Nothing to display yet</h3><p>${h(desc)}</p></div>`}
function recordMatches(value){return !state.search || [value.name,value.id,value.summary,value.role,value.track_name,value.year].some(x=>String(x||'').toLowerCase().includes(state.search.toLowerCase()))}
function filteredEntities(kind){return (state.data?.entities||[]).filter(v=>v.kind===kind&&recordMatches(v)).sort((a,b)=>a.name.localeCompare(b.name))}
function sessionRaces(year=state.year){return (state.data?.races||[]).filter(x=>Number(x.year)===Number(year)).sort((a,b)=>a.name.localeCompare(b.name))}
function sessionHorseIds(year=state.year){const ids=new Set(sessionRaces(year).flatMap(e=>resultOf(e.id).map(r=>r.horse_id)));(state.data?.connections||[]).filter(x=>Number(x.year)===Number(year)).forEach(x=>ids.add(x.horse_id));return [...ids]}
function dateLabel(r){if(!r.date)return 'Exact day unrecorded';if(String(r.date_basis||'').includes('UNVERIFIED'))return r.date+' · historical schedule date unverified';return r.date}
function seasonHeadline(y){const r=sessionRaces(y);return r.length?`${r.length} documented races · ${sessionHorseIds(y).length} referenced horses`:'No source races loaded for this season'}
function winnerOf(r){return resultOf(r.id).find(x=>Number(x.position)===1)}
function renderOverview(){
  const year=state.year, list=sessionRaces(year);
  const highlight=list.slice(0,6).map(r=>`<tr><td>${openButton('race',r.id,r.name)}<div class="subline">${venueName(r)}</div></td><td>${winnerOf(r)?openButton('entity',winnerOf(r).horse_id,nameFor(winnerOf(r).horse_id)):'—'}</td><td>${formatStatus(r.status)}</td></tr>`).join('');
  return `
    <div class="hero"><div class="hero-copy"><div class="hero-kicker">WELCOME TO THE ARCHIVE</div><h2>Every season. Every connection.<br>The complete WTW story.</h2><p>Browse source-recorded racing history, follow owners and trainers through the decades, and review corrections without rewriting protected results.</p></div><div class="hero-badge"><strong>${year}</strong><small>SELECTED SEASON</small></div></div>
    <div class="metrics">${metric(count('horse'),'Horses in this import','Import grows by approved batches')}${metric(count('person'),'People','Trainers and riders')}${metric(count('organization'),'Farms & stables','Owners and breeding operations')}${metric(state.data.races.length,'Recorded races','Dates not invented')}</div>
    <div class="layout-two">
      ${section(`${year} historical race file`,'Source-backed race entries from the loaded dataset',highlight?`<div class="table-scroll"><table class="data-table"><thead><tr><th>Race</th><th>Winner</th><th>Source status</th></tr></thead><tbody>${highlight}</tbody></table></div>`:noRecords('This year has not yet been imported.'),`<button data-page="seasons" class="text-button">View season →</button>`)}
      ${section('Quick navigation','Start with the record you want to inspect',`<div class="panel-body quick-links"><button class="quick-card" data-page="seasons"><span><strong>Year-by-year history</strong><small>Winners, participants, stories</small></span><span class="quick-arrow">→</span></button><button class="quick-card" data-page="horses"><span><strong>Horse career profiles</strong><small>Seasons, people, victories</small></span><span class="quick-arrow">→</span></button><button class="quick-card" data-page="people"><span><strong>People & stables</strong><small>Owner, trainer, jockey, breeder links</small></span><span class="quick-arrow">→</span></button><button class="quick-card" data-page="changes"><span><strong>Correction review</strong><small>Source-safe proposed changes</small></span><span class="quick-arrow">→</span></button></div>`)}
    </div>`;
}
function renderSeasons(){
  const y=state.year;const tabs=years().map(n=>`<button class="year-tab ${n===y?'active':''}" data-year="${n}">${n}</button>`).join('');
  const races=sessionRaces(y).filter(recordMatches);const seasonPeople=(state.data?.connections||[]).filter(c=>+c.year===+y);
  const ranked=[...new Set(seasonPeople.map(c=>c.horse_id))];
  const raceRows=races.map(r=>`<div class="race-card"><div><h4>${openButton('race',r.id,r.name)}</h4><p>${venueName(r)} · ${h(dateLabel(r))}</p><div class="winners">${winnerOf(r)?`Winner: ${openButton('entity',winnerOf(r).horse_id,nameFor(winnerOf(r).horse_id))}`:'Winner not in sample'}</div></div>${editButton('race',r.id,'Suggest edit')}</div>`).join('');
  const known=ranked.slice(0,10).map(id=>`<div class="detail-list-item">${openButton('entity',id,nameFor(id))}<small>${seasonPeople.filter(c=>c.horse_id===id).length} season connections</small></div>`).join('');
  return `${intro('THE HISTORICAL YEARBOOK',`${y} Racing Season`,'Select any imported season. Race results, participants and source uncertainty stay attached to their permanent IDs.')}
   <div class="year-tabs">${tabs}</div><div class="metrics">${metric(sessionRaces(y).length,'Recorded races','Imported source editions')}${metric(sessionHorseIds(y).length,'Featured horses','In results or season links')}${metric(seasonPeople.length,'Season connections','Owner / trainer / jockey / breeder')}${metric(races.filter(r=>r.date).length,'Exact dated races','Missing dates remain unknown')}</div>
   <div class="layout-two">${section(`${y} stakes calendar`,seasonHeadline(y),raceRows||noRecords('Try another imported year.'))}${section('Horses and horsemen','Year-level links, not necessarily race-day mounts',`<div class="panel-body">${known||noRecords('No people links imported.')}</div>`)}</div>`;
}
function renderHorses(){
 const list=filteredEntities('horse');
 const rows=list.slice(0,250).map(r=>{const wins=(state.data?.results||[]).filter(t=>t.horse_id===r.id&&+t.position===1).length;return `<tr><td>${openButton('entity',r.id,r.name)}<div class="subline">${h(r.id)}</div></td><td>${h(r.foal_year||'—')}</td><td>${h(r.sex||'—')}</td><td>${wins}</td><td>${formatStatus(r.status)}</td><td>${editButton('entity',r.id,'Propose edit')}</td></tr>`}).join('');
 return `${intro('SOURCE-RECORDED POPULATION','Horse Registry','Every horse name has a pencil to edit its display name without changing its permanent identity. Open any profile for results and connections.',`<div class="record-count">${list.length} horses displayed</div>`)}${section('Horses','Showing up to 250 matching records at once. Full database search is supported when the WTW D1 import is connected.',`<div class="table-scroll"><table class="data-table"><thead><tr><th>Horse</th><th>Foaled</th><th>Sex</th><th>Recorded wins</th><th>Name status</th><th>Review</th></tr></thead><tbody>${rows||'<tr><td colspan="6">No matching horses</td></tr>'}</tbody></table></div>`)}`;
}
function renderPeople(){
  const list=[...filteredEntities('person'),...filteredEntities('organization')].sort((a,b)=>a.name.localeCompare(b.name));
  const rows=list.slice(0,250).map(e=>{const roles=new Set((state.data?.connections||[]).filter(c=>c.party_id===e.id).map(c=>c.role));const count=(state.data?.connections||[]).filter(c=>c.party_id===e.id).length;return `<tr><td>${openButton('entity',e.id,e.name)}<div class="subline">${h(e.id)}</div></td><td>${h(e.kind==='person'?'Person':'Farm / stable')}</td><td>${h(e.role||[...roles].join(', ')||'—')}</td><td>${count}</td><td>${editButton('entity',e.id,'Propose edit')}</td></tr>`}).join('');
  return `${intro('HUMAN & STABLE RECORDS','People & Stables','Edit trainer, jockey, owner, breeder, farm and stable names with the pencil beside each record. Historical associations retain their IDs.')}
   ${section('People, owners, farms & studs',`${list.length} matches in the current import`, `<div class="table-scroll"><table class="data-table"><thead><tr><th>Name</th><th>Type</th><th>Known role</th><th>Horse-year links</th><th>Review</th></tr></thead><tbody>${rows||'<tr><td colspan="5">No matches</td></tr>'}</tbody></table></div>`)}`;
}
function renderTracks(){
 const list=filteredEntities('track');
 const rows=list.map(t=>`<tr><td>${openButton('entity',t.id,t.name)}<div class="subline">${h(t.id)}</div></td><td>${formatStatus(t.status)}</td><td>${editButton('entity',t.id,'Propose correction')}</td></tr>`).join('');
 return `${intro('RACING VENUES','Track Registry','Every imported track has a name editor. Renaming a tracked venue also updates linked race editions, while its permanent ID stays fixed.',`<div class="record-count">${list.length} tracks</div>`)}${section('Tracks and venues','Original names remain preserved in the historical source',`<div class="table-scroll"><table class="data-table"><thead><tr><th>Track / location</th><th>Source status</th><th>Review</th></tr></thead><tbody>${rows||'<tr><td colspan="3">No track identities loaded yet.</td></tr>'}</tbody></table></div>`)}`;
}
function renderRaces(){
 const list=(state.data?.races||[]).filter(r=>(+r.year===+state.year||state.search)&&recordMatches(r));
 return `${intro('RACE RECORDS','Race History','Edit race and venue names using the pencil. Horse names update everywhere through permanent horse IDs.')}
 <div class="year-tabs">${years().map(y=>`<button class="year-tab ${state.year===y?'active':''}" data-year="${y}">${y}</button>`).join('')}</div>
 ${section(`${state.search?'Matching':'Selected'} race editions`,`${list.length} entries`,list.map(r=>`<div class="race-card"><div><h4>${openButton('race',r.id,r.name)}</h4><p>${h(r.year)} · ${venueName(r)} · ${h(dateLabel(r))}</p><div class="winners">${winnerOf(r)?`Winner: ${openButton('entity',winnerOf(r).horse_id,nameFor(winnerOf(r).horse_id))}`:'Finish order not imported'}</div></div>${editButton('race',r.id,'Propose edit')}</div>`).join('')||noRecords('No matching race editions.'))}`;
}
function renderChanges(){
 const ordered=[...state.changes].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 return `${intro('SOURCE-SAFE GOVERNANCE','Corrections & Approvals','Submit proposed edits to horse names, people, stables, seasonal connections, and race records. Approval records intent; it never silently rewrites historical results.')}
 <div class="callout"><strong>Protected canon:</strong> corrections in this desk remain proposals or approved-for-promotion decisions. A separate, verified promotion step is required before changes reach WTW's authoritative historical database.</div>
 ${section('Review queue',`${ordered.length} proposals ${state.mode==='DEMO'?'· saved in this browser only':'· stored in the separate WTW D1 database'}`,ordered.length?ordered.map(r=>`<div class="review-row"><div class="review-meta">${formatStatus(r.status)} <span>${h(r.target_type)} · ${h(r.target_id)}</span><span>${h(r.created_at||'')}</span></div><h4>${h(r.field)}: ${h(r.old_value??'blank')} → ${h(r.proposed_value)}</h4><p>${h(r.reason)}</p><div class="review-actions">${r.status==='PENDING'?`<button class="button button-primary" data-review-id="${h(r.id)}" data-review-action="APPROVED_FOR_PROMOTION">Approve for promotion</button><button class="button button-danger" data-review-id="${h(r.id)}" data-review-action="REJECTED">Reject</button>`:''}</div></div>`).join(''):noRecords('No correction proposals yet. Open a horse, race, person, or connection to propose one.'))}`;
}
function renderSources(){const d=state.data;return `${intro('PROVENANCE & RELEASE SAFETY','Sources & Status','See what has actually been loaded and what is still missing before this desk becomes a complete universe explorer.')}
 <div class="callout callout-green"><strong>Independent project.</strong> This desk does not connect to the Rail & Rye or Hockey Lab repositories, databases, hosting resources, or credentials. It also does not write to the frozen January 1999 gameplay engine.</div>
 <div class="metrics">${metric(d.entities.length,'Entities loaded','Horses, people, farms')}${metric(d.connections.length,'Connections','Year-level source links')}${metric(d.races.length,'Race editions','Result archive sample')}${metric(d.results.length,'Placed horses','Results in this import')}</div>
 <div class="layout-two">
 ${section('Current data authority','Transparency before publication',`<div class="panel-body"><p><strong>Dataset:</strong> ${h(d.meta?.title||'WTW staged source import')}</p><p><strong>Mode:</strong> ${h(state.mode==='DEMO'?'LOCAL SAMPLE / DEMONSTRATION':state.mode)}</p><p><strong>Scope:</strong> ${h(d.meta?.scope||'Partial import into separate D1 read model')}</p><p><strong>Source:</strong> ${h(d.meta?.authority||'WTW source files, as imported')}</p><p class="muted">${h(d.meta?.note||'Not a gameplay authority. Missing exact dates are not invented.')}</p></div>`)}
 ${section('Safe-edit workflow','No unreviewed source writes',`<div class="panel-body"><div class="quick-links"><div class="quick-card"><span><strong>1. Inspect a source record</strong><small>IDs, role, season and racing context visible</small></span></div><div class="quick-card"><span><strong>2. Propose a correction</strong><small>Original and replacement value captured</small></span></div><div class="quick-card"><span><strong>3. Approve or reject</strong><small>Decision and reason retained in audit log</small></span></div><div class="quick-card"><span><strong>4. Promote separately</strong><small>Not implemented: requires exact-ID multi-source reconciliation</small></span></div></div></div>`)}
 </div>`;}
function render(){
 if(!state.data) return;
 $('page-title').textContent=pageTitle();
 document.querySelectorAll('[data-page]').forEach(b=>b.classList.toggle('active',b.classList.contains('nav-link')&&b.dataset.page===state.page));
 $('change-count').textContent=state.changes.filter(c=>c.status==='PENDING').length;
 $('data-mode').textContent=state.mode==='D1_CONNECTED'?'D1 CONNECTED':'CURATED DEMO · NOT SYNCED';
 $('data-mode').classList.toggle('live',state.mode==='D1_CONNECTED');
 const map={overview:renderOverview,seasons:renderSeasons,horses:renderHorses,people:renderPeople,tracks:renderTracks,races:renderRaces,changes:renderChanges,sources:renderSources};
 $('app').innerHTML=(map[state.page]||renderOverview)();
}
function setPage(page){state.page=page;document.body.classList.remove('menu-open');$('sidebar').classList.remove('mobile-open');render();window.scrollTo({top:0,behavior:'smooth'})}
function setYear(year){state.year=Number(year);$('year-select').value=String(year);render()}
function toast(message){let node=$('toast');node.textContent=message;node.hidden=false;clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>node.hidden=true,4500)}
async function openDetail(type,id){
 state.openDetail={type,id};
 const e=type==='entity'?entity(id):type==='race'?race(id):null;
 if(!e){toast('The requested record has not been imported.');return;}
 let markup='';
 if(type==='entity'){
   const cn=(state.data?.connections||[]).filter(c=>c.horse_id===id||c.party_id===id).sort((a,b)=>b.year-a.year);
   const placings=(state.data?.results||[]).filter(r=>r.horse_id===id).map(r=>({...r,race:race(r.edition_id)})).filter(r=>r.race).sort((a,b)=>b.race.year-a.race.year);
   markup=`<div class="eyebrow">${h(e.kind)} PROFILE</div><h2>${h(e.name)} ${renameButton(type,e.id,e.name)}</h2><div class="detail-id">${h(e.id)}</div><p class="detail-desc">${h(e.summary||'Historical source identity. Detailed biography not yet imported.')}</p>
   <div class="detail-facts"><div class="detail-fact"><small>Type</small><strong>${h(e.kind)}</strong></div><div class="detail-fact"><small>Foaling year / role</small><strong>${h(e.foal_year||e.role||'Not recorded')}</strong></div><div class="detail-fact"><small>Sex</small><strong>${h(e.sex||'Not applicable / unknown')}</strong></div><div class="detail-fact"><small>Source status</small><strong>${h(e.status||'SOURCE_SNAPSHOT')}</strong></div></div>
   <div class="detail-edit">${editButton('entity',e.id,'Propose a name or profile correction','button button-primary')}</div>
   <h3>Season connections</h3><div class="detail-list">${cn.map(c=>`<div class="detail-list-item"><div><strong>${h(c.year)} · ${h(c.role)}</strong><small>${c.horse_id===id?openButton('entity',c.party_id,nameFor(c.party_id)):openButton('entity',c.horse_id,nameFor(c.horse_id))} · ${h(c.basis||'Basis unrecorded')}</small></div>${editButton('connection',c.id,'Edit','button button-quiet')}</div>`).join('')||'<p class="muted">No connections imported yet.</p>'}</div>
   ${e.kind==='horse'?`<h3>Recorded race appearances</h3><div class="detail-list">${placings.map(p=>`<div class="detail-list-item"><div>${openButton('race',p.race.id,p.race.name)}<small>${h(p.race.year)} · ${venueName(p.race)} · position ${h(p.position)}</small></div>${editButton('result',`${p.edition_id}::${p.position}`,'Review','button button-quiet')}</div>`).join('')||'<p class="muted">No race appearances in this import.</p>'}</div>`:''}
   <h3>Pedigree and barn history</h3><div id="horse-pedigree-panel"><p class="muted">Source pedigree details load from the private archive when connected. Barn locations are not inferred from a stable's region.</p></div>`;
 } else {
   const results=resultOf(e.id);
   markup=`<div class="eyebrow">HISTORICAL RACE EDITION</div><h2>${h(e.name)} ${renameButton(type,e.id,e.name)}</h2><div class="detail-id">${h(e.id)}</div>
   <p class="detail-desc">${venueName(e)} · ${h(e.year)} · ${h(dateLabel(e))}<br>Source: ${h(e.source||'Not specified')}</p>
   <div class="detail-edit">${editButton('race',e.id,'Propose a race-record correction','button button-primary')}</div><h3>Recorded finishers</h3><div class="detail-list">${results.sort((a,b)=>a.position-b.position).map(p=>`<div class="detail-list-item"><div><strong>Position ${h(p.position)}</strong><small>${openButton('entity',p.horse_id,nameFor(p.horse_id))}</small></div>${editButton('result',`${p.edition_id}::${p.position}`,'Review','button button-quiet')}</div>`).join('')||'<p class="muted">No finishers imported yet.</p>'}</div>`;
 }
 $('detail-content').innerHTML=`<button class="icon-button drawer-close" data-close-drawer="true" aria-label="Close profile">✕</button>${markup}`;
 $('drawer-backdrop').hidden=false;$('detail-drawer').classList.add('open');$('detail-drawer').setAttribute('aria-hidden','false');
 if(type==='entity'&&e.kind==='horse'&&state.mode==='D1_CONNECTED'){
   try {
     const resp=await fetch(`/api/horses/${encodeURIComponent(id)}`,{credentials:'same-origin'});
     if(!resp.ok)throw Error('Detailed source unavailable');
     const info=await resp.json(),panel=$('horse-pedigree-panel');
     if(!panel||!$('detail-drawer').classList.contains('open'))return;
     const parents=(info.parents||[]).map(p=>`<div class="detail-list-item"><div><strong>${h(p.relation)}</strong><small>${p.parent_id&&entity(p.parent_id)?openButton('entity',p.parent_id,nameFor(p.parent_id)):p.parent_id?`<span class="name-edit-pair"><span>${h(p.parent_name||p.parent_id)}</span>${renameButton('pedigree',p.parent_id,p.parent_name||p.parent_id)}</span>`:h(p.parent_name||'Not recorded')} · ${h(p.biology_check||'Unverified')}</small></div></div>`).join('');
     const seasonSummary=(info.seasons||[]).map(s=>`<div class="detail-list-item"><div><strong>${h(s.year)} season</strong><small>${h(s.stakes_wins??'—')} stakes wins · ${h(s.top3_starts??'—')} top-three stakes starts · region ${h(s.region||'Not recorded')}</small></div></div>`).join('');
     panel.innerHTML=`<h3>Recorded ancestry</h3><div class="detail-list">${parents||'<p class="muted">No parent edges available in this source.</p>'}</div><h3>Season-by-season record</h3><div class="detail-list">${seasonSummary||'<p class="muted">No season summaries available.</p>'}</div><p class="muted">Relationships are historical source references and may still require certification.</p>`;
   }catch {const panel=$('horse-pedigree-panel');if(panel)panel.textContent='Detailed source could not be loaded.'}
 }
}
function closeDrawer(){ state.openDetail=null; $('detail-drawer').classList.remove('open');$('detail-drawer').setAttribute('aria-hidden','true');$('drawer-backdrop').hidden=true;}
function showRename(type,id,current){
 if(!['entity','race','venue','pedigree'].includes(type)||!id||!current)return;
 state.rename={type,id,current};
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
   if(item.type==='entity'){const record=entity(item.id);if(record)record.name=next}
   if(item.type==='race'){const record=race(item.id);if(record)record.name=next}
   if(item.type==='venue'){const record=race(item.id);if(record)record.track_name=next}
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
async function fetchBootstrap(){const r=await fetch('/api/bootstrap',{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw new Error('Backend not available');return r.json()}
async function initialize(){
 try {const live=await fetchBootstrap();state.mode=live.mode;state.data={meta:{title:'WIRE TO WIRE — isolated D1 import',scope:live.partial?'Partial page of data: search the backend for more':'Currently imported records',authority:'Source snapshot, separate from original WTW master',note:'Approved-for-promotion proposals do not alter source records.'},entities:live.entities,connections:live.connections,races:live.races,results:live.results};state.changes=live.changes;}
 catch {try {const r=await fetch('/sample-history.json',{cache:'no-store'});if(!r.ok)throw Error('Sample data unavailable');state.data=await r.json();state.mode='DEMO';state.changes=storedChanges();}catch{state.data={meta:{title:'WTW empty sample',scope:'No data loaded'},entities:[],connections:[],races:[],results:[]};state.mode='DEMO';state.changes=storedChanges()}}
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
document.addEventListener('click',e=>{const t=e.target.closest('[data-page],[data-year],[data-open-type],[data-edit-type],[data-rename-type],[data-close-drawer],[data-review-action]');if(!t)return;
 if(t.dataset.page){setPage(t.dataset.page);return}if(t.dataset.year){setYear(t.dataset.year);return}if(t.dataset.closeDrawer){closeDrawer();return}if(t.dataset.renameType){showRename(t.dataset.renameType,t.dataset.id,t.dataset.currentName);return}if(t.dataset.openType){openDetail(t.dataset.openType,t.dataset.id);return}if(t.dataset.editType){showEdit(t.dataset.editType,t.dataset.id);return}if(t.dataset.reviewAction){decideChange(t.dataset.reviewId,t.dataset.reviewAction)}
});
$('year-select').addEventListener('change',e=>setYear(e.target.value));
$('global-search').addEventListener('input',e=>{state.search=e.target.value.trim();if(state.search&&['overview','seasons','sources','changes'].includes(state.page))state.page='horses';render()});
$('edit-field').addEventListener('change',fillOld);
$('edit-form').addEventListener('submit',saveProposal);
$('name-form').addEventListener('submit',saveName);
$('close-name-dialog').addEventListener('click',()=>$('name-dialog').close());
$('cancel-name-dialog').addEventListener('click',()=>$('name-dialog').close());
$('close-dialog').addEventListener('click',()=>$('edit-dialog').close());
$('cancel-dialog').addEventListener('click',()=>$('edit-dialog').close());
$('drawer-backdrop').addEventListener('click',closeDrawer);
$('mobile-menu').addEventListener('click',()=>$('sidebar').classList.toggle('mobile-open'));
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeDrawer()});
initialize();