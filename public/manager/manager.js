/* WTW MANAGEMENT STUDIO V2 — clean-sheet presentation.
   Reads original Office simulation and source-linked profile DOM only.
   No new authoritative data, rating generation, saves or gameplay decisions. */
(()=>{
'use strict';
const $=(q,scope=document)=>scope.querySelector(q), $$=(q,scope=document)=>[...scope.querySelectorAll(q)];
const h=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const known=v=>v!=null&&String(v).trim()!==''&&!['—','Unknown','Not recorded','N/A'].includes(String(v).trim());
const root=document.createElement('div');root.id='mgApp';root.setAttribute('aria-label','Wire to Wire Management Studio');document.body.appendChild(root);
const ui={view:'office',q:'',type:'all',sort:'name',caseId:'powerline',catalog:null,photos:null,logos:null,personGeo:null,trackGeo:null,searchRecords:[],filterFocus:false,stage:'',renderCount:0,stableQuery:'',stableFilter:'all',stableColumns:'all',stableFocus:false,demoRatings:new URLSearchParams(location.search).get('ratings')!=='real'};
const readState=()=>{try{return JSON.parse(localStorage.getItem('wtwOfficeStateV30')||'{}')}catch{return {}}};
const demoScore=(name,key)=>{
 let seed=2166136261;
 for(const c of name+'|'+key)seed=Math.imul(seed^c.charCodeAt(0),16777619)>>>0;
 const bias=/speed|acceleration|stamina|competitive|intelligence|horse_handling|fitness/.test(key)?14:0;
 return Math.max(19,Math.min(97,29+(seed%57)+bias));
};
const scoreTier=x=>x>=85?'elite':x>=65?'good':x>=42?'average':'poor';
const demoLabel=()=>ui.demoRatings?'<span class="mg-demo-label" title="Illustrative ratings for visual review only, not saved scouting data">DEMO RATINGS · FICTIONAL · NOT SAVED</span>':'';
const records=()=>typeof window.__wtwOfficeSearchRecords==='function'?window.__wtwOfficeSearchRecords():[];
const activeRoute=()=>{const p=new URLSearchParams(location.search);const page=p.get('page');return page&&page!=='office'?{type:page,name:p.get('name'),track:p.get('track'),id:p.get('id')}:null;};
const nowDate=()=>$('.app .dateChip')?.textContent.trim()||readState().date||'2014-07-15';
const icon={office:'⌂',inbox:'✉',stable:'♞',racing:'⚑',breeding:'♧',sales:'◆',person:'♟',farm:'⌂',track:'◈',finances:'$',world:'◎',search:'⌕',history:'▤'};
const button=(label,action,value,cl='mg-button')=>'<button type="button" class="'+cl+'" data-act="MG UI" data-mg="'+h(action)+'"'+(value!=null?' data-value="'+h(value)+'"':'')+'>'+label+'</button>';
const siteRoot=()=>location.pathname.startsWith('/manager/')?'/manager/':'/';
const stateUrl=view=>{const p=new URLSearchParams();if(view!=='office')p.set('ui',view);return siteRoot()+(p.toString()?'?'+p:'')};
const sourceAction=action=>{const el=$$('.app [data-act]').find(n=>n.dataset.act===action);if(el){el.click();setTimeout(render,60);return true}return false};
function withSilentOfficeRoute(task){
 const before=!!window.__WTW_MANAGER_SILENT_NAV__;
 window.__WTW_MANAGER_SILENT_NAV__=true;
 try{return task()}finally{window.__WTW_MANAGER_SILENT_NAV__=before}
}
function nav(view){
 if(view==='history'){location.assign('/archive/?page=races');return}
 const shell=$('#routeShell');
 const close=shell&&!shell.hidden?$('#routeShell [data-act="Close route"]'):null;
 if(close)withSilentOfficeRoute(()=>close.click());
 ui.view=view;ui.q='';ui.type='all';
 history.pushState({mg:view},'',stateUrl(view));
 render();
}
function openRecord(kind,name,track){
 const sourcePersonId=kind==='person'&&String(track||'').startsWith('@')?String(track).slice(1):'';
 const geoPerson=sourcePersonId?ui.personGeo?.people?.find(p=>p.id===sourcePersonId&&p.name===name):geographicPerson(name);
 const active=window.__wtwOfficeOpenSearchRecord?.(kind,name,track);
 if(!active){
  if((kind==='track'&&geographicTrack(name))||(kind==='person'&&geoPerson)){
   const route=new URLSearchParams({page:kind,name});
   if(kind==='person'&&geoPerson?.id)route.set('id',geoPerson.id);
   history.pushState({mg:'profile'},'',siteRoot()+'?'+route.toString());
   ui.view='profile';render();return;
  }
  return;
 }
 ui.view='profile';
 const route=new URLSearchParams({page:kind,name});
 if(track&&!String(track).startsWith('@'))route.set('track',track);
 history.replaceState({mg:'profile'},'',siteRoot()+'?'+route.toString());
 setTimeout(render,80);
}
const panel=(title,body,caption='',cl='')=>'<section class="mg-section '+cl+'"><header><strong>'+h(title)+'</strong>'+(caption?'<small>'+h(caption)+'</small>':'')+'</header>'+body+'</section>';
const empty=(text='No source-backed record attached to this Office file.')=>'<div class="mg-empty">'+h(text)+'</div>';
const pair=(label,value,raw=false)=>'<div class="mg-minirow"><span>'+h(label)+'</span><strong>'+(raw?value:h(value))+'</strong></div>';
const pairs=arr=>'<div class="mg-minirows">'+arr.map(x=>pair(x[0],x[1])).join('')+'</div>';
function sidebar(){
 const active=activeRoute();const current=active?(active.type==='horse'?'stable':active.type==='person'?'person':active.type==='farm'?'farm':active.type==='track'?'track':'racing'):ui.view;
 const groups=[['FRONT OFFICE',[['office','Today'],['inbox','Inbox'],['search','Search']]],['RACING OPERATIONS',[['stable','Stable & Horses'],['racing','Racing Calendar'],['breeding','Breeding'],['sales','Sales & Auctions']]],['THE ORGANIZATION',[['person','Personnel'],['farm','Farms & Barns'],['finances','Finances']]],['RACING WORLD',[['track','Racecourses'],['world','World Directory'],['history','History Vault']]]];
 return '<aside class="mg-rail" aria-label="Main game navigation">'+groups.map(group=>'<div class="mg-rail-head">'+h(group[0])+'</div>'+group[1].map(row=>
  button('<b>'+h(icon[row[0]]||'•')+'</b><span>'+h(row[1])+'</span>','nav',row[0],'mg-rail-item'+(current===row[0]?' on':''))).join('')+'<div class="mg-rail-sep"></div>').join('')+'<div class="mg-rail-foot">ACTIVE RACING OFFICE · SOURCE-LINKED GAME DATA</div></aside>';
}
function header(){
 const route=activeRoute();const title=route?route.name||route.type:ui.view==='office'?'Racing Office':ui.view.charAt(0).toUpperCase()+ui.view.slice(1);
 return '<header class="mg-top"><div class="mg-top-nav"><img class="mg-mark" alt="Wire to Wire" src="/assets/wtw-office-approved-logo.png"><div class="mg-brand"><strong>WIRE TO WIRE</strong><small>RACING MANAGEMENT</small></div></div>'+
 '<div class="mg-top-name">'+button('‹','back',null,'mg-top-tool')+button('›','forward',null,'mg-top-tool')+'<strong>'+h(title).toUpperCase()+'</strong><span>Management Studio · 2014 racing universe</span></div>'+
 '<label class="mg-global-search"><span>⌕</span><input type="search" id="mgTopSearch" data-mg-input="topsearch" placeholder="Search horses, people, tracks and pages" value="'+h(ui.view==='search'?ui.q:'')+'"></label>'+
 '<div class="mg-date"><small>IN-WORLD DATE</small><strong>'+h(nowDate())+'</strong></div>'+
 '<div class="mg-top-actions">'+button('▣','save',null,'mg-top-tool')+button('CONTINUE ›','continue',null,'mg-continue')+'</div></header>';
}
function pageBar(title,context='',actions=''){
 return '<div class="mg-screenbar"><div><h1>'+h(title)+'</h1><small>'+h(context)+'</small></div><div class="mg-actionbar">'+actions+'</div></div>';
}
function allRecords(){
 const base=records().map(r=>Object.assign({},r));
 const pages=[['Office','office'],['Search','search'],['Stable','stable'],['Racing','racing'],['Sales','sales'],['Personnel','person'],['Farms','farm'],['Racecourses','track'],['Breeding','breeding'],['Finances','finances'],['History','history']];
 const registered=new Set(base.filter(r=>r.kind==='track').map(r=>r.name.toLowerCase()));
 const tracks=(ui.trackGeo?.tracks||[]).filter(r=>r.name&&!registered.has(r.name.toLowerCase()))
  .map(r=>({kind:'track',name:r.name,detail:r.macro_circuit||r.registry||'Racing world record',track:r.travel_node||locationName(r),
   directory_only:true,track_id:r.id}));
 const registeredPeople=new Set(base.filter(r=>r.kind==='person').map(r=>r.name.toLowerCase()));
 const people=(ui.personGeo?.people||[]).filter(r=>r.name&&!registeredPeople.has(r.name.toLowerCase()))
  .map(r=>({kind:'person',name:r.name,detail:r.role||'Professional directory record',
   track:locationName(r.opening_base||r.career_base||r.birthplace),directory_only:true,person_id:r.id}));
 return base.concat(tracks,people,pages.map(r=>({kind:'screen',name:r[0],detail:'Management department',view:r[1]})));
}
function owner(name){
 const linked=typeof window.__wtwOfficeHorseOwner==='function'?window.__wtwOfficeHorseOwner(name):null;
 const saved=readState().horseState?.[name]||{};
 const connected=sourceProfile()?.connections?.find(([label])=>/^owner$/i.test(label))?.[1];
 const value=linked?.name||saved.owner_name||saved.owner||connected;
 return known(value)?String(value).trim():'Not recorded';
}
function ownerChip(name){
 const v=owner(name),entry=ui.logos?.organizations?.[v],src=typeof entry==='string'?entry:entry?.src;
 const trusted=typeof src==='string'&&/^\/assets\/[a-zA-Z0-9_./-]+$/.test(src)&&!src.includes('..');
 return '<span class="mg-owner-mark" title="'+h(v)+'">'+
  (trusted?'<img src="'+h(src)+'" alt="'+h(v)+' organization crest" loading="lazy">':
  known(v)?h(v.slice(0,1).toUpperCase()):'?')+'</span>';
}
function compactTable(head,rows,config=''){
 return '<div class="mg-table-wrap"><table class="mg-table '+config+'"><thead><tr>'+head.map((x,i)=>{
  const name=x.text||x,canSort=!/^(OPEN|PROFILE|VIEW|SELECT|ACTION)$/i.test(String(name));
  return '<th'+(x.numeric?' class="numeric"':'')+(x.style?' style="'+h(x.style)+'"':'')+
   (canSort?' data-mg-sort-col="'+i+'" tabindex="0" aria-sort="none" title="Sort by '+h(name)+'"':'')+
   '>'+h(name)+(canSort?'<span class="mg-table-sortmark" aria-hidden="true">↕</span>':'')+'</th>';
 }).join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
function sortRosterColumn(header){
 const table=header.closest('table.mg-table'),tbody=table?.tBodies?.[0];
 if(!table||!tbody)return;
 const index=Number(header.dataset.mgSortCol);
 if(!Number.isInteger(index)||index<0)return;
 const descending=header.getAttribute('aria-sort')==='ascending';
 const rows=Array.from(tbody.rows).map((row,ordinal)=>({row,ordinal,
  text:row.cells[index]?.dataset.sortValue??row.cells[index]?.textContent?.replace(/\s+/g,' ').trim()??''}));
 const numeric=text=>{
  const normalized=text.replace(/[$,%+]/g,'').replace(/,/g,'').trim();
  return /^[-+]?\d+(?:\.\d+)?$/.test(normalized)?Number(normalized):null;
 };
 const cmp=new Intl.Collator(undefined,{numeric:true,sensitivity:'base'});
 rows.sort((a,b)=>{
  const aMissing=!String(a.text).trim()||a.text==='—',bMissing=!String(b.text).trim()||b.text==='—';
  if(aMissing!==bMissing)return aMissing?1:-1;
  const av=numeric(String(a.text)),bv=numeric(String(b.text));
  const result=av!=null&&bv!=null?av-bv:cmp.compare(String(a.text),String(b.text));
  return (descending?-result:result)||a.ordinal-b.ordinal;
 });
 tbody.append(...rows.map(x=>x.row));
 table.querySelectorAll('thead th[data-mg-sort-col]').forEach(el=>{
  const active=el===header;
  el.setAttribute('aria-sort',active?(descending?'descending':'ascending'):'none');
  const marker=el.querySelector('.mg-table-sortmark');
  if(marker)marker.textContent=active?(descending?'▾':'▴'):'↕';
 });
}
function tableCell(text,cls='',sortValue){return '<td'+(cls?' class="'+cls+'"':'')+(sortValue!==undefined?' data-sort-value="'+h(String(sortValue??''))+'"':'')+'>'+text+'</td>'}
function linkRecord(record,label,ownerBadge=false){
 const raw=(ownerBadge?ownerChip(record.name)+' ':'')+'<span>'+h(label||record.name)+'</span>';
 const locator=record.kind==='person'&&record.person_id?'@'+record.person_id:(record.track||'');
 return button(raw,'open',record.kind+'|'+record.name+'|'+locator,'mg-rowlink');
}
function searchResults(){
 const query=ui.q.toLowerCase().trim();
 return allRecords().filter(x=>(ui.type==='all'||x.kind===ui.type)&&(!query||[x.name,x.kind,x.detail,x.owner_name,x.track].some(y=>String(y||'').toLowerCase().includes(query)))).sort((a,b)=>{
  if(ui.sort==='type')return a.kind.localeCompare(b.kind)||a.name.localeCompare(b.name);
  if(ui.sort==='owner')return (a.owner_name||'').localeCompare(b.owner_name||'')||a.name.localeCompare(b.name);
  return a.name.localeCompare(b.name);
 });
}
function searchView(){
 const kinds=[['all','All'],['horse','Horses'],['person','People'],['farm','Farms'],['track','Tracks'],['race','Races'],['screen','Screens']];
 const rows=searchResults(),total=rows.length;
 const contextValue=r=>r.kind==='horse'?(r.owner_name||owner(r.name)):
  r.kind==='person'?(r.person_id||'Office profile'):
  r.kind==='track'?(r.track_id||geographicTrack(r.name)?.id||'Track record'):
  r.kind==='race'?'Active stakes record':r.kind==='screen'?'Game department':'Current Office record';
 const locator=r=>r.kind==='person'&&r.person_id?'@'+r.person_id:(r.track||'');
 const table=compactTable([{text:'TYPE',style:'width:82px'},{text:'NAME',style:'width:26%'},{text:'ROLE / RACE RECORD'},{text:'OWNER / SOURCE ID',style:'width:18%'},{text:'LOCATION / TRACK',style:'width:18%'},{text:'OPEN',style:'width:52px'}],
 rows.map(r=>'<tr>'+tableCell('<span class="mg-tag '+(r.kind==='horse'?'':'unrated')+'">'+h(r.kind.toUpperCase())+'</span>')+
  tableCell(linkRecord(r,r.name,r.kind==='horse'),'strong')+tableCell(h(r.detail||'—'))+
  tableCell(h(contextValue(r)),'dim')+
  tableCell(h(r.track||'—'),'dim')+tableCell(button('›','open',r.kind+'|'+r.name+'|'+locator(r),'mg-rowlink'),'numeric')+'</tr>'),'mg-search-table');
 return pageBar('Global Directory','SOURCE RECORDS · SORTABLE ROSTER',button('HISTORICAL ARCHIVE ↗','nav','history'))+
 '<div class="mg-content"><div class="mg-search-layout"><div class="mg-filterbar"><input id="mgSearch" type="search" placeholder="Search any available person, horse, track, farm, race or screen…" data-mg-input="search" value="'+h(ui.q)+'">'+
 kinds.map(x=>button(x[1],'filter',x[0],'mg-button'+(ui.type===x[0]?' on':''))).join('')+
 '<span class="mg-kicker" style="margin-left:auto">SORT</span>'+
 [['name','NAME'],['type','TYPE'],['owner','OWNER']].map(x=>button(x[1],'sort',x[0],'mg-button'+(ui.sort===x[0]?' on':''))).join('')+'</div>'+
 '<div class="mg-section mg-search-table">'+table+'</div>'+
 '<footer class="mg-search-foot"><b>'+total+' MATCHING RECORDS</b><span>Double-click-free navigation · Select any record to open its complete profile</span></footer></div></div>';
}
function cases(){
 const keys=['powerline','lastmatch','saratoga','pieta','cash','newsbuzz','entries','cedar'];
 return keys.filter(k=>typeof deskCases!=='undefined'&&deskCases[k]).map(k=>Object.assign({id:k},deskCases[k]));
}
function currentCase(){return cases().find(c=>c.id===ui.caseId)||cases()[0]||null}
function caseDecision(){
 const queue=cases(),item=currentCase();if(!item)return empty('No current management decisions');
 const currentIndex=queue.findIndex(c=>c.id===item.id);
 const nextFile=queue.length>1?queue[(currentIndex+1)%queue.length]:null;
 const nextAction=nextFile?'<div class="mg-case-next"><span>UP NEXT IN THE OFFICE</span>'+
  button(h(nextFile.title)+' ›','case',nextFile.id,'mg-case-next-link')+'</div>':'';
 const notes=(item.intel||[]).map(x=>'<div class="mg-intel-row"><b>'+h(x[0])+'</b><span>'+h(x[1])+'</span></div>').join('');
 return panel('Decision Desk','<div class="mg-case-top"><div class="mg-case-copy"><div class="mg-kicker mg-gold">'+h(item.type)+' · '+h(item.source)+'</div>'+
 '<h2>'+h(item.title)+'</h2><p>'+h(item.summary)+'</p><div class="mg-facts">'+[['PRESSURE',item.pressure],['PRIMARY RISK',item.risk],['MANAGER READ',item.read]].map(x=>'<span>'+h(x[0])+'<b>'+h(x[1])+'</b></span>').join('')+'</div></div>'+
 '<div class="mg-case-photo"><img src="'+h(ui.photos?.cases?.[item.id]||ui.photos?.categories?.[item.type]||ui.photos?.default||item.image||'/assets/office/approved-office-photo.jpg')+'" alt="Approved racing office editorial photograph"></div></div>'+
 '<div class="mg-case-choices">'+(item.moves||[]).map((m,i)=>button('<span>0'+(i+1)+' · '+h(m[2])+'</span><b>'+h(m[0])+'</b><small>'+h(m[1])+'</small>','choose',m[0],'mg-choice')).join('')+'</div>'+
 '<div class="mg-case-intelligence">'+notes+'</div>'+nextAction,'ACTIVE MANAGEMENT FILE');
}
function inboxView(){
 const all=cases();
 const rows=all.map((m,i)=>button('<i>'+h(m.source.split(/\s+/).map(x=>x[0]).join('').slice(0,2))+'</i><div><strong>'+h(m.title)+'</strong><span>'+h(m.source)+' · '+h(m.type)+'</span></div><time>'+('0'+(i+1)).slice(-2)+'</time>','case',m.id,'mg-feed-row'+(ui.caseId===m.id?' active':''))).join('');
 return panel('Inbox',rows,all.length+' OFFICE FILES');
}
function stableRows(){
 const all=records().filter(x=>x.kind==='horse');
 return all.map((r,i)=>'<tr>'+tableCell(linkRecord(r,r.name,true),'strong')+
  tableCell(h(owner(r.name)),'dim')+
  tableCell(h(readState().horseState?.[r.name]?.status||'No recent status'),'dim')+
  tableCell(h(readState().calendarState?.[r.name]?.race_target||'—'),'gold')+
  tableCell(button('PROFILE ›','open','horse|'+r.name+'|','mg-rowlink'),'numeric')+'</tr>');
}
function home(){
 const all=cases(),horseRecords=records().filter(r=>r.kind==='horse');
 const staff=records().filter(r=>r.kind==='person');
 const game=readState();
 const selected=currentCase();
 const source=$$('.fixtureList .fixture').slice(0,8);
 const calendarRows=source.map(n=>'<tr>'+tableCell(h($('.d',n)?.textContent.trim()||'—'))+
   tableCell(h($('h4',n)?.textContent.trim()||'—'),'strong')+
   tableCell(h($('p',n)?.textContent.trim()||'—'),'dim')+'</tr>');
 const calendar=panel('Racing Schedule',compactTable([{text:'DATE',style:'width:74px'},{text:'HORSE / EVENT'},{text:'TRACK & CONDITIONS'}],calendarRows),
   source.length+' SCHEDULED ENTRIES');
 const staffRows=staff.slice(0,8).map(r=>'<tr>'+tableCell(linkRecord(r,r.name),'strong')+
   tableCell(h(r.detail||'—'),'dim')+tableCell(button('›','open','person|'+r.name+'|','mg-rowlink'),'numeric')+'</tr>');
 const staffPanel=panel('Personnel & Assignments',compactTable([{text:'PERSON'},{text:'ROLE'},{text:'PROFILE',style:'width:45px'}],staffRows),staff.length+' STAFF RECORDS');
 const rosterRows=horseRecords.map(r=>{
  const status=game.horseState?.[r.name]?.status||all.find(c=>c.title?.toLowerCase().includes(r.name.toLowerCase()))?.type||'No new report';
  const target=game.calendarState?.[r.name]?.race_target||'—';
  return '<tr>'+tableCell(linkRecord(r,r.name,true),'strong')+
    tableCell(h(owner(r.name)),'dim')+tableCell(h(status),'gold')+
    tableCell(h(target),'dim')+tableCell(button('›','open','horse|'+r.name+'|','mg-rowlink'),'numeric')+'</tr>';
 });
 const roster=panel('Active Stable Roster',compactTable([
  {text:'HORSE',style:'width:29%'},{text:'OWNER',style:'width:26%'},
  {text:'CURRENT FILE'},{text:'TARGET'},{text:'OPEN',style:'width:45px'}],rosterRows),horseRecords.length+' HORSES');
 const priority=panel('Decision & Opportunity Ledger',compactTable([
  {text:'CASE / SUBJECT',style:'width:48%'},{text:'PRESSURE'},
  {text:'PRIMARY RISK'},{text:'OPEN',style:'width:47px'}],
  all.map(c=>'<tr>'+tableCell(button(h(c.title),'case',c.id,'mg-rowlink'),'strong')+
   tableCell(h(c.pressure||'—'),'gold')+tableCell(h(c.risk||'—'),'dim')+
   tableCell(button('›','case',c.id,'mg-rowlink'),'numeric')+'</tr>')),all.length+' CURRENT CASES');
 const pressureLevels=[
  ['HIGH',all.filter(x=>/high|urgent/i.test(x.pressure||'')).length],
  ['MEDIUM',all.filter(x=>/medium|moderate/i.test(x.pressure||'')).length],
  ['LOW',all.filter(x=>/low/i.test(x.pressure||'')).length]
 ];
 const pressurePanel=panel('Decision Pressure','<div class="mg-office-pressure">'+
  pressureLevels.map(([label,count])=>'<div class="mg-office-pressure-item"><small>'+label+
   '</small><strong>'+count+'</strong></div>').join('')+'</div>',
  all.length+' SOURCE CASES');
 const watch=panel('Stable Intelligence',compactTable([
  {text:'HORSE / SOURCE'},{text:'CURRENT SIGNAL'},{text:'OPEN',style:'width:47px'}],
  all.slice(0,8)
   .map(c=>'<tr>'+tableCell(button(h(c.source),'case',c.id,'mg-rowlink'),'strong')+
      tableCell(h(c.read||'Office review'),'dim')+tableCell(button('›','case',c.id,'mg-rowlink'),'numeric')+'</tr>')),
   'LIVE OFFICE READS');
 return pageBar('Racing Office','DAILY MANAGEMENT · '+nowDate(),
   button('GLOBAL DIRECTORY','nav','search')+button('MY STABLE','nav','stable'))+
 '<div class="mg-content mg-office-content">'+
 '<div class="mg-home-top"><div class="mg-home-stack mg-home-inbox">'+inboxView()+'</div>'+
 '<div class="mg-home-stack mg-home-case">'+caseDecision()+'</div>'+
 '<div class="mg-home-stack mg-home-side">'+calendar+staffPanel+pressurePanel+'</div></div>'+
 '<div class="mg-home-bottom">'+roster+priority+watch+'</div>'+
 '</div>';
}
function sourceProfile(){
 const doc=$('#routeBody .profilePage');if(!doc)return null;
 const current=activeRoute();if(current?.name&&$('#routeTitle')?.textContent.trim()!==current.name)return null;
 const txt=(q,s=doc)=>$(q,s)?.textContent.trim()||'';
 const fields=$$('.profileField',doc).map(n=>[txt('span',n),txt('strong',n)]).filter(x=>known(x[1]));
 const connections=$$('.profileLine',doc).map(n=>[txt('b',n),$('button',n)?.textContent.trim()||$('span',n)?.textContent.trim()||'']).filter(x=>known(x[1]));
 const pedigree=$$('.pedigreeNode',doc).map(n=>[txt('span',n),txt('strong',n)]).filter(x=>known(x[1]));
 const career=$$('.recordStat',doc).map(n=>[txt('span',n),txt('b',n)]).filter(x=>known(x[1]));
 const states=$$('.profileStatePill',doc).map(n=>n.textContent.trim()).filter(Boolean);
 const notes=$$('.achievementItem',doc).map(n=>n.textContent.trim()).filter(Boolean);
 const sub=txt('.profileSubline');
 return {doc,fields,connections,pedigree,career,states,notes,sub};
}
const srcValue=(pairs,key)=>pairs.find(x=>x[0].toLowerCase()===key.toLowerCase())?.[1]||'';
function entityPhoto(kind,name){
 // Approved site imagery is a read-only image pointer, not an entity identity database.
 const assets=ui.photos?.entities||{};
 const route=activeRoute();
 const id=kind==='person'?(route?.id||geographicPerson(name)?.id):
  kind==='track'?geographicTrack(name)?.id:null;
 const keys=[id?kind+':'+id:null,kind+':'+name];
 for(const key of keys.filter(Boolean)){
  const entry=assets[key],src=typeof entry==='string'?entry:entry?.src;
  if(typeof src==='string'&&/^\/assets\/[a-zA-Z0-9_./-]+$/.test(src)&&!src.includes('..'))return src;
 }
 return '';
}
function portrait(kind,name){
 const source=sourceProfile(),sourceImg=$('.profileHero .profilePhoto img',source?.doc);
 const candidate=sourceImg?.getAttribute('src')||'';
 const sourcePhoto=/^\/assets\/[a-zA-Z0-9_./-]+$/.test(candidate)&&
  !candidate.includes('/profile-badges/')&&!candidate.includes('..')?candidate:'';
 const photo=entityPhoto(kind,name)||sourcePhoto;
 const fallback='/assets/profile-badges/v2/wtw_badge_'+
  (kind==='horse'?'horse':kind==='person'?'people':kind==='farm'?'farm_stable':'track')+'.png';
 return '<div class="mg-portrait '+(photo?'photo':'fallback')+'" data-visual-source="'+(photo?'approved-photo':'identity-badge')+'">'+
  '<img src="'+h(photo||fallback)+'" alt="'+h(photo?'Approved photograph of '+name:'Profile badge for '+name)+'"></div>';
}
function geographicPerson(name){
 const people=ui.personGeo?.people;if(!Array.isArray(people))return null;
 const id=activeRoute()?.id||sourceProfile()?.doc?.dataset?.personId||'';
 if(id){const exact=people.find(p=>p.id===id);if(exact)return exact}
 const matching=people.filter(p=>p.name?.trim().toLowerCase()===String(name).trim().toLowerCase());
 return matching.length===1?matching[0]:null;
}
function geographicTrack(name){
 const tracks=ui.trackGeo?.tracks;if(!Array.isArray(tracks))return null;
 const matching=tracks.filter(p=>p.name?.trim().toLowerCase()===String(name).trim().toLowerCase());
 return matching.length===1?matching[0]:null;
}
function locationName(place){
 if(!place)return '';
 return [place.city||place.city_locality,place.region||place.state_province_region,place.country].filter(known).join(', ');
}
function geoFlag(code){
 const region=String(code||'').split('-')[0].toUpperCase().replace(/^UK$/,'GB');
 if(!/^[A-Z]{2}$/.test(region))return '';
 return [...region].map(c=>String.fromCodePoint(127397+c.charCodeAt(0))).join('');
}
function identity(kind,name,record){
 const p=sourceProfile();const f=p?.fields||[];
 let origin=[],extras=[],horseFacts='',horseStars='';
 if(kind==='horse'){
  const saved=readState().horseState?.[name]||{};
  const linked=saved.identity&&Array.isArray(saved.identity.source_refs)&&saved.identity.source_refs.length?saved.identity:{};
  const field=(key,label)=>srcValue(f,label)||linked[key]||'';
  const ds=p?.doc?.dataset||{};
  const foalState=ds.foalingState||field('foaling_state','Foaling state');
  const foalCountry=ds.foalingCountry||field('foaling_country','Foaling country');
  const countryCode=ds.foalingCountryCode||field('foaling_country_code','Foaling country code')||
   ({'United States':'US','USA':'US','Canada':'CA','England':'GB-ENG','United Kingdom':'GB','Ireland':'IE','France':'FR','Japan':'JP','Australia':'AU'}[foalCountry]||'');
  const foalPlace=[foalState,foalCountry==='United States'?'USA':foalCountry].filter(known).join(', ');
  const rawDob=field('date_of_birth','Date of birth')||field('born','Born');
  const validDob=/^\d{4}-\d{2}-\d{2}$/.test(rawDob)&&!Number.isNaN(Date.parse(rawDob+'T00:00:00Z'));
  const dob=validDob?new Intl.DateTimeFormat('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'UTC'}).format(new Date(rawDob+'T00:00:00Z')):(known(rawDob)?rawDob:'Not recorded');
  const inWorldYear=Number(String(nowDate()).slice(0,4)),birthYear=validDob?Number(rawDob.slice(0,4)):NaN;
  const derivedAge=Number.isInteger(inWorldYear)&&Number.isInteger(birthYear)&&inWorldYear>=birthYear?String(inWorldYear-birthYear):'';
  const age=field('age','Age')||derivedAge||'Not recorded';
  const sex=field('sex','Sex')||'Not recorded';
  const flag=geoFlag(countryCode);
  const facts=[['FOALED',((flag?flag+' ':'')+(known(foalPlace)?foalPlace:'Not recorded'))],
   ['DATE OF BIRTH',dob],['AGE',age],['SEX',sex]];
  horseFacts='<div class="mg-horse-idfacts" aria-label="Horse identity details">'+facts.map(([label,value])=>
   '<span><small>'+h(label)+'</small><strong>'+h(value)+'</strong></span>').join('')+'</div>';
  const ratings=readState().scoutingState?.[name]?.star_ratings||saved.star_ratings||{};
  const oneRating=(key,label)=>{
   const entry=ratings[key],score=Number(entry?.rating??entry?.stars);
   const rated=Number.isInteger(score)&&score>=1&&score<=5&&Array.isArray(entry?.source_refs)&&entry.source_refs.length>0;
   const marks=Array.from({length:5},(_,i)=>'<i class="'+(rated&&i<score?'filled':'')+'" aria-hidden="true">★</i>').join('');
   return '<span class="mg-horse-star"><small>'+label+'</small><span>'+marks+'</span><b>'+(rated?score+'/5':'UNRATED')+'</b></span>';
  };
  horseStars='<div class="mg-horse-starline" aria-label="Current ability and future potential">'+
   oneRating('current_ability','CURRENT ABILITY')+oneRating('future_potential','FUTURE POTENTIAL')+
   '<em>1 developing · 3 competitive · 5 elite</em></div>';
  extras=p?.career?.slice(0,4)||[];
 }else if(kind==='person'){
  const record=geographicPerson(name),birth=record?.birthplace,base=record?.opening_base,careerBase=record?.career_base;
  const role=p?.sub?.replace(/^Job:\s*/i,'')||srcValue(f,'Role')||record?.role||'';
  const flag=geoFlag(birth?.flag_code);
  origin=[role?'ROLE '+role:'',birth?.country?(flag?flag+' ':'')+'BIRTH COUNTRY '+birth.country:'',
    birth?.city?'BORN '+[birth.city,birth.region].filter(known).join(', '):'',
    base?'1999 BASE '+locationName(base):careerBase?'RECORDED CAREER BASE '+locationName(careerBase):'',
    ...f.filter(([key])=>!/^(role|job|birthplace|born|country|base|location)$/i.test(key)).slice(0,2).map(x=>x[0]+' '+x[1])].filter(Boolean);
  extras=p?.career?.slice(0,3)||[];
 }else if(kind==='track'){
  const record=geographicTrack(name);
  origin=[record?'LOCATION '+locationName(record):'',
   record?.macro_circuit?'CIRCUIT '+record.macro_circuit:'',
   record?.opening_state?'1999 STATUS '+record.opening_state:'',
   ...(!record?f.filter(([key])=>!/location/i.test(key)).slice(0,1).map(x=>x[0]+' '+x[1]):[])].filter(Boolean);
  extras=record?[]:p?.career?.slice(0,3)||[];
 }else{
  origin=[p?.sub,...f.slice(0,3).map(x=>x[0]+' '+x[1])].filter(Boolean);
  extras=p?.career?.slice(0,3)||[];
 }
 const connections=(p?.connections||[]).slice(0,2);
 return '<section class="mg-profile-identity">'+portrait(kind,name)+'<div class="mg-nameblock">'+
 '<div class="mg-kicker">'+h(kind.toUpperCase())+' PROFILE / CURRENT RACING UNIVERSE</div><h2>'+(kind==='horse'?ownerChip(name):'')+h(name)+'</h2>'+
 (kind==='horse'?horseFacts+horseStars:'<div class="mg-identity-meta">'+origin.map(x=>'<span>'+h(x)+'</span>').join('<span>·</span>')+'</div>')+
 '<div class="mg-id-stats">'+extras.map(x=>'<span>'+h(x[0])+' <b>'+h(x[1])+'</b></span>').join('')+'</div></div>'+
 connections.map(x=>'<div class="mg-id-connection"><small>'+h(x[0])+'</small><strong>'+h(x[1])+'</strong></div>').join('')+'</section>';
}
function observations(kind,name){
 const save=readState();
 return kind==='horse'?(save.scoutingState?.[name]?.attribute_observations||[]):(save.staffState?.[name]?.attribute_observations||[]);
}
function rating(def,obs,personName){
 const verified=obs&&['estimated','measured'].includes(obs.status)&&obs.estimate!=null&&Array.isArray(obs.evidence_refs)&&obs.evidence_refs.length>0;
 const demo=ui.demoRatings&&!verified;
 const value=demo?demoScore(personName||'Office preview',def.key):Number(obs?.estimate);
 const min=demo?0:Number(obs?.scale_min),max=demo?100:Number(obs?.scale_max);
 const canBar=(verified||demo)&&Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min;
 const percent=canBar?Math.max(0,Math.min(100,100*(value-min)/(max-min))):0;
 const tier=canBar?scoreTier(percent):'unknown';
 const label=demo?'Fictional demo rating, not in source record':verified?'Source-backed observation':'Unassessed';
 return '<div class="mg-attribute" title="'+h(def.meaning||'')+' · '+h(label)+'"><span>'+h(def.label)+'</span>'+
 '<span class="mg-meter'+(canBar?' '+tier:' empty')+'">'+(canBar?'<i style="width:'+percent.toFixed(1)+'%"></i>':'')+'</span>'+
 '<strong class="'+tier+'">'+(canBar?h(String(value)+(verified&&obs.unit?' '+obs.unit:'')):'—')+'</strong></div>';
}
function horseProfile(name){
 const source=sourceProfile(),cat=ui.catalog?.horse_categories||{},reports=new Map((observations('horse',name)||[]).map(x=>[x.attribute_key,x]));
 const groups=['Speed & Pace','Surface & Environment','Physical & Biometric','Mental & Class'];
 const columns=groups.map(group=>{const defs=cat[group]||[];const count=defs.filter(x=>{const r=reports.get(x.key);return r&&r.estimate!=null&&r.evidence_refs?.length}).length;
 return panel(group,defs.length?'<div class="mg-attr-list">'+defs.map(x=>rating(x,reports.get(x.key),name)).join('')+'</div>':empty('Attribute definitions not loaded'),count+'/'+defs.length+' ASSESSED','mg-attributes')}).join('');
 const condition=(cat['Current Condition']||[]).map(x=>{const r=reports.get(x.key);const ok=r&&r.estimate!=null&&r.evidence_refs?.length;const demo=ui.demoRatings&&!ok;const score=demo?demoScore(name,x.key):Number(r?.estimate);const tier=ok||demo?scoreTier(score):'unknown';return '<div><span>'+h(x.label)+'</span><strong class="'+tier+'">'+(ok||demo?h(score):'—')+'</strong></div>'}).join('');
 const s=source||{career:[],connections:[],pedigree:[],states:[],notes:[]};
 const status=s.states.find(x=>!x.startsWith('Target:'))||'No current training status';
 const target=s.states.find(x=>x.startsWith('Target:'))?.replace(/^Target:\s*/,'')||'Not recorded';
 const career=panel('Career Record',s.career.length?pairs(s.career):empty('No verified career totals attached.'));
 const current=panel('Current Condition',pairs([['Training',status],...s.notes.filter(x=>x.includes('Health / Vet')).slice(0,1).map(x=>['Health / Vet',x])]));
 const plan=panel('Race Plan',pairs([['Current target',target],['Entry status',s.states.find(x=>x.startsWith('Entry:'))||'Not entered']]));
 const notes=panel('Training & Office',s.notes.length?'<div class="mg-minirows">'+s.notes.slice(0,6).map(x=>'<div class="mg-minirow"><span style="grid-column:1 / -1">'+h(x)+'</span></div>').join('')+'</div>':empty('No approved workouts yet.'));
 const people=panel('Connections',s.connections.length?pairs(s.connections.slice(0,7)):empty('No connections registered.'));
 const history=readState().horseState?.[name]?.certified_results||[];
 const approved=Array.isArray(history)?history.filter(x=>x&&Array.isArray(x.source_refs)&&x.source_refs.length&&known(x.date)&&known(x.race)):[];
 const races=panel('Recent Races & Form',approved.length?compactTable([{text:'DATE'},{text:'RACE'},{text:'TRACK'},{text:'FINISH'},{text:'SOURCE'}],approved.slice(-8).reverse().map(x=>'<tr>'+tableCell(h(x.date))+tableCell(h(x.race),'strong')+tableCell(h(x.track||'—'))+tableCell(h(x.finish||'—'),'gold')+tableCell('Verified')+'</tr>')):empty('No certified race-by-race starts linked to this Office horse. Full historical results are in History.'));
 const pedigree=panel('Pedigree & Background',s.pedigree.length?pairs(s.pedigree):empty('No source-backed pedigree attached.'));
 const knownN=Object.values(cat).flat().filter(x=>reports.get(x.key)?.evidence_refs?.length).length;
 return pageBar(name,ui.demoRatings?'VISUAL DEMO · FICTIONAL RATINGS':'EVIDENCE-BASED ATHLETE DOSSIER',button('HISTORY','nav','history')+button('STABLE ROSTER','nav','stable'))+
 '<div class="mg-content"><div class="mg-profile-scroll">'+identity('horse',name)+
 '<div class="mg-profile-grid4">'+columns+'</div>'+
 '<div class="mg-profile-strip">'+condition+'</div>'+
 '<div class="mg-profile-grid5">'+career+current+plan+notes+people+'</div>'+
 '<div class="mg-profile-grid2">'+races+pedigree+'</div>'+
 '<div class="mg-overview-foot"><strong>SCOUTING COVERAGE</strong>'+demoLabel()+'<span>'+knownN+' / '+Object.values(cat).flat().length+' evidenced attributes · Unassessed is not zero</span></div></div></div>';
}
function personProfile(name){
 const s=sourceProfile()||{career:[],states:[],notes:[],connections:[],fields:[],sub:''},catalog=ui.catalog||{};
 const role=(s.sub.replace(/^Job:\s*/i,'')||geographicPerson(name)?.role||'').toLowerCase();
 const key={'stable staff':'stable_staff','trainer':'trainer','jockey':'jockey','owner':'owner','breeder':'breeder','bloodstock':'bloodstock_professional','farm manager':'farm_manager','veterinarian':'veterinarian','groom':'groom','farrier':'farrier','exercise rider':'exercise_rider'}[role]||(/trainer/.test(role)?'trainer':/jockey/.test(role)?'jockey':/owner|patron/.test(role)?'owner':'stable_staff');
 const base=catalog.person_common||[],special=catalog.person_roles?.[key]||[],defs=base.concat(special);
 const obs=new Map((observations('person',name)||[]).map(x=>[x.attribute_key,x]));
 const group=(title,arr)=>'<section class="mg-person-skill-group"><header><strong>'+h(title)+'</strong><small>'+arr.length+' RATINGS</small></header>'+
  '<div class="mg-attr-list">'+arr.map(x=>rating(x,obs.get(x.key),name)).join('')+'</div></section>';
 const foundations=base.slice(0,Math.ceil(base.length/2)),judgment=base.slice(Math.ceil(base.length/2));
 const skills=group('PROFESSIONAL FOUNDATIONS',foundations)+group('JUDGMENT & WORK',judgment)+(special.length?group((role||'ROLE').toUpperCase()+' SPECIALTIES',special):'');
 const work=readState().staffState?.[name]||{},rep=work.reputation_profile;
 const verified=rep?.schema==='WTW_PERSON_REPUTATION_V1'&&Array.isArray(rep.source?.refs)&&rep.source.refs.length&&Number.isFinite(rep.scores?.overall);
 const repPreview=ui.demoRatings&&!verified;
 const repOverall=verified?Number(rep.scores.overall):repPreview?demoScore(name,'reputation_overall'):null;
 const axes=(catalog.reputation?.axes||[]).map(x=>[x.label,verified&&rep.scores?.[x.key]!=null?Number(rep.scores[x.key]):repPreview?demoScore(name,'reputation_'+x.key):null]);
 const axisRows='<div class="mg-person-rep-list">'+axes.map(([label,score])=>
  '<div class="mg-person-rep-row"><span>'+h(label)+'</span>'+
   '<span class="mg-meter '+(score==null?'empty':scoreTier(score))+'">'+
    (score==null?'':'<i style="width:'+score+'%"></i>')+'</span>'+
   '<strong class="'+(score==null?'unknown':scoreTier(score))+'">'+(score==null?'—':score)+'</strong></div>').join('')+'</div>';
 const repBody='<div class="mg-person-standing"><small>PROFESSIONAL STANDING</small><strong>'+
  (repOverall==null?'UNRATED':h(repOverall)+' / 100')+'</strong><span>'+
  (verified?'Evidenced professional assessment':repPreview?'FICTIONAL REPUTATION · VISUAL PREVIEW ONLY':'Professional reputation not yet assessed')+
  '</span></div>'+axisRows;
 const reputation=panel('Reputation & Standing',repBody,repPreview?'DEMO SCORES':'SOURCED PERSONNEL FILE');
 const links=records().filter(x=>x.kind==='horse'&&s.notes.some(note=>note.includes(x.name)));
 const horses=links.length?compactTable([{text:'HORSE'},{text:'OWNER'},{text:'OPEN'}],links.map(x=>'<tr>'+tableCell(linkRecord(x,x.name,true))+
  tableCell(h(owner(x.name)))+tableCell(button('OPEN','open','horse|'+x.name+'|','mg-rowlink'))+'</tr>')):empty('No horses linked to this personnel file.');
 const geo=geographicPerson(name),background=s.fields.concat(s.career);
 if(geo){
  if(geo.birthplace)background.push(['Place of birth',locationName(geo.birthplace)]);
  if(geo.opening_base)background.push(['1999 opening base',locationName(geo.opening_base)]);
  else if(geo.career_base)background.push(['Recorded career base',locationName(geo.career_base)]);
  background.push(['Geography ID',geo.id]);
 }
 const network=Array.isArray(work.relationship_reports)?work.relationship_reports.filter(x=>x.source_refs?.length):[];
 const side='<div class="mg-person-side">'+reputation+
  panel('Current Horse Assignments',horses,links.length+' CONNECTED')+
  panel('Career & Background',background.length?pairs(background.slice(0,12)):empty('No verified career history yet.'))+
  panel('Working Network',network.length?pairs(network.slice(0,6).map(x=>[x.counterpart_name||x.counterpart_id,String(x.score??'Unrated')])):empty('No evidenced working relationships yet.'))+'</div>';
 return pageBar(name,'PERSONNEL DOSSIER · '+(role||'STAFF'),button('PEOPLE DIRECTORY','nav','person'))+
 '<div class="mg-content"><div class="mg-profile-scroll mg-person-profile-scroll">'+identity('person',name)+
 '<div class="mg-person-dossier'+(defs.length>17?' mg-person-dense':'')+'">'+panel('Professional Attributes','<div class="mg-person-rating-stack">'+skills+'</div>',
 defs.length+' DEFINED RATINGS','mg-person-primary')+side+'</div>'+
 '<div class="mg-overview-foot"><strong>PERSONNEL FILE</strong>'+demoLabel()+
 '<span>Ratings, reputation, assignments and available career evidence are all on this Overview</span></div></div></div>';
}
function trackProfile(name){
 const geo=geographicTrack(name),world=ui.trackGeo?.tracks||[],
  matches=records().filter(x=>x.kind==='race'&&String(x.track||'').toLowerCase()===name.toLowerCase()),
  sameCircuit=geo?.macro_circuit?world.filter(x=>x.name!==name&&x.macro_circuit===geo.macro_circuit):[];
 const details=geo?[
  ['City / locality',geo.city_locality],['State / province',geo.state_province_region],
  ['Country',geo.country],['Racing circuit',geo.macro_circuit],
  ['Travel node',geo.travel_node],['1999 opening state',geo.opening_state],
  ['Calendar classification',geo.foundation_status],['Geography evidence',geo.geography_status]
 ].filter(x=>known(x[1])):sourceProfile()?.fields||[];
 const registry=world.slice().sort((a,b)=>{
  const tier=p=>p.name===name?-1:(geo&&p.macro_circuit===geo.macro_circuit?0:1);
  return tier(a)-tier(b)||String(a.macro_circuit||'').localeCompare(String(b.macro_circuit||''))||
   String(a.name).localeCompare(String(b.name));
 });
 const registryBody=registry.length?compactTable([
  {text:'COURSE',style:'width:30%'},{text:'CIRCUIT / REGION',style:'width:28%'},
  {text:'LOCATION'},{text:'1999',style:'width:73px'},{text:'PROFILE',style:'width:65px'}
 ],registry.map(x=>'<tr'+(x.name===name?' class="mg-track-selected"':'')+'>'+
  tableCell(button(h(x.name),'open','track|'+x.name+'|','mg-rowlink'),'strong')+
  tableCell(h(x.macro_circuit||x.registry||'—'),'dim')+
  tableCell(h(x.travel_node||locationName(x)),'dim')+
  tableCell('<span title="'+h(x.opening_state||'—')+'">'+h(x.opening_state==='CLOSED_PRE_1999'?'CLOSED':x.opening_state==='OPEN_1999'?'OPEN':x.opening_state||'—')+'</span>','gold')+
  tableCell(button('VIEW ›','open','track|'+x.name+'|','mg-rowlink'),'numeric')+'</tr>')):
  empty('The official racecourse directory is not available.');
 const raceBody=matches.length?compactTable([{text:'STAKES / RACE',style:'width:48%'},{text:'RACE CLASS'},
   {text:'OPEN',style:'width:60px'}],matches.map(x=>'<tr>'+tableCell(linkRecord(x,x.name),'strong')+
   tableCell(h(x.detail||'—'),'dim')+
   tableCell(button('OPEN ›','open','race|'+x.name+'|'+(x.track||''),'mg-rowlink'),'numeric')+'</tr>')):
   registryBody;
 const circuitBody=sameCircuit.length?compactTable([{text:'COURSE',style:'width:38%'},{text:'LOCATION / TRAVEL'},
   {text:'OPEN',style:'width:60px'}],sameCircuit.map(x=>'<tr>'+
   tableCell(button(h(x.name),'open','track|'+x.name+'|','mg-rowlink'),'strong')+
   tableCell(h(x.travel_node||locationName(x)),'dim')+
   tableCell(button('OPEN ›','open','track|'+x.name+'|','mg-rowlink'),'numeric')+'</tr>')):
   empty('No other registered course in the same racing circuit.');
 const fixtures=$$('.fixtureList .fixture').filter(n=>n.textContent.toLowerCase().includes(name.toLowerCase()));
 const upcoming=fixtures.length?compactTable([{text:'DATE',style:'width:96px'},{text:'OFFICE EVENT'},
  {text:'TRACK / CONTEXT'}],fixtures.map(n=>'<tr>'+
  tableCell(h($('.d',n)?.textContent.trim()||'—'))+
  tableCell(h($('h4',n)?.textContent.trim()||'—'),'strong')+
  tableCell(h($('p',n)?.textContent.trim()||'—'),'dim')+'</tr>')):
  empty('No current Office racing entry at this venue.');
 return pageBar(name,'RACECOURSE · '+(geo?.macro_circuit||'APPROVED WORLD DIRECTORY'),
   button('RACECOURSES','nav','track')+button('HISTORY ARCHIVE','nav','history'))+
  '<div class="mg-content"><div class="mg-profile-scroll">'+identity('track',name)+
   '<div class="mg-track-layout">'+
     panel(matches.length?'Major Races & Stakes':'Racing World · Racecourse Register',raceBody,matches.length?matches.length+' ACTIVE RACE RECORDS':registry.length+' SOURCE-BACKED VENUES · CURRENT CIRCUIT FIRST')+
     '<div class="mg-track-side">'+
      panel('Geography & Operating Context',details.length?pairs(details):empty('No approved locality attached.'),
       geo?'READ-ONLY CANON GEOGRAPHY':'OFFICE RECORD')+
      panel('Office Racing at Venue',upcoming,fixtures.length+' SCHEDULED')+
      panel('Other Courses in Circuit',circuitBody,sameCircuit.length+' REGIONAL COURSES')+
     '</div></div></div></div>';
}
function otherProfile(kind,name){
 const s=sourceProfile()||{fields:[],connections:[],career:[],notes:[],pedigree:[]};
 const kindTitle={farm:'FARM / TRAINING FACILITY',track:'RACECOURSE',race:'HISTORICAL RACE'}[kind]||'OFFICE FILE';
 const rec=records().filter(r=>r.kind==='horse'&&s.notes.some(v=>v.includes(r.name)));
 const stable=panel('Connected Horses',rec.length?compactTable([{text:'HORSE'},{text:'OWNER'},{text:'OPEN'}],rec.map(x=>'<tr>'+tableCell(linkRecord(x,x.name,true))+tableCell(h(owner(x.name)))+tableCell(button('›','open','horse|'+x.name+'|','mg-rowlink'))+'</tr>')):empty('No verified roster assignment in this file.'));
 return pageBar(name,kindTitle,button('DIRECTORY','nav','search'))+
 '<div class="mg-content"><div class="mg-profile-scroll">'+identity(kind,name)+
 '<div class="mg-dashboard-tiles">'+s.fields.slice(0,4).map(x=>'<div class="mg-stat"><small>'+h(x[0])+'</small><strong style="font-size:16px">'+h(x[1])+'</strong></div>').join('')+'</div>'+
 '<div class="mg-person-bottom">'+panel('Operating Details',s.fields.length?pairs(s.fields):empty())+
 panel('People & Connections',s.connections.length?pairs(s.connections):empty())+
 panel('Current Activity',s.notes.length?'<div class="mg-summary">'+s.notes.slice(0,8).map(x=>'<div>'+h(x)+'</div>').join('')+'</div>':empty())+'</div>'+stable+'</div></div>';
}

/* Tier One Stable: one sourced horse per row; badges are UI-only. */
const stableIconSet={sound:['✓','good'],watch:['!','warn'],treatment:['✚','danger'],
 ready:['✓','good'],entered:['⚑','good'],building:['↗','info'],restricted:['⏸','warn'],
 up:['↗','good'],down:['↘','danger'],level:['→','neutral'],work:['↗','info'],
 unknown:['?','neutral']};
function stableIcon(key,label,description){
 const [symbol,color]=stableIconSet[key]||stableIconSet.unknown;
 return '<span class="mg-stable-signal '+color+'" title="'+h(description||label)+'" aria-label="'+h(label)+'">'+
  '<b aria-hidden="true">'+symbol+'</b><span>'+h(label)+'</span></span>';
}
function stableKnown(v){return v!=null&&known(v)&&String(v).trim()!=='—'?String(v).trim():''}
function stableEvidenceStars(name,key){
 const save=readState();
 const entry=save.scoutingState?.[name]?.star_ratings?.[key]||save.horseState?.[name]?.star_ratings?.[key];
 const n=Number(entry?.rating??entry?.stars);
 const valid=Number.isInteger(n)&&n>=1&&n<=5&&Array.isArray(entry?.source_refs)&&entry.source_refs.length>0;
 return {sort:valid?n:'',
  html:valid?'<span class="mg-stable-stars" title="Evidenced '+h(key.replace(/_/g,' '))+' · '+n+'/5" aria-label="'+n+' of 5 stars">'+
   '<em>'+('★'.repeat(n))+'</em>'+('☆'.repeat(5-n))+'</span>':
   '<span class="mg-stable-unknown" title="No evidenced star rating">—</span>'};
}
function stableDate(v){
 const s=String(v||'');
 return /^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T00:00:00Z'))?s:'';
}
function stableHorseSnapshot(record,fixtures,files,save){
 const name=record.name;
 const facts=typeof window.__wtwOfficeHorseRosterFacts==='function'?window.__wtwOfficeHorseRosterFacts(name)||{}:{};
 const horse=save.horseState?.[name]||{},scout=save.scoutingState?.[name]||{},calendar=save.calendarState?.[name]||{};
 const file=files.find(c=>[c.title,c.summary].some(s=>String(s||'').toLowerCase().includes(name.toLowerCase())));
 const status=stableKnown(horse.status)||stableKnown(scout.status)||stableKnown(file?.type);
 const vet=stableKnown(horse.vet_flag),healthRaw=[vet,horse.health_status,horse.treatment_status].filter(Boolean).join(' ');
 const treating=/(under treatment|receiving treatment|treatment ongoing|in rehabilitation|on medication|under veterinary care)/i.test(healthRaw);
 const watching=/(vet|filling|scan|diagnos|monitor|injur|unsound|sore|caution|medical)/i.test(healthRaw)||/vet|soundness/i.test(file?.type||'');
 const sound=/^(sound|cleared|fit|healthy|no active concerns)$/i.test(stableKnown(horse.health_status));
 const health=treating?['treatment','Treatment']:watching?['watch','Vet watch']:sound?['sound','Sound']:['unknown','Unassessed'];
 const readyRaw=stableKnown(horse.readiness_status)||status;
 let ready=['unknown','Unassessed'];
 if(/light jog|training paused|resting|scan pending|diagnostic scan|restricted|laid up|not ready|hold/i.test(readyRaw))ready=['restricted','Restricted'];
 else if(/ready to race|ready to run|race ready|cleared to race/i.test(readyRaw))ready=['ready','Ready'];
 else if(/entered|entry filed|race.prep/i.test(readyRaw))ready=['entered','Entered'];
 else if(/work requested|more work|breeze|gate school|gallop|building|training rhythm|progressing/i.test(readyRaw))ready=['building','Building'];
 if(treating)ready=['restricted','Restricted'];
 const explicitTrend=String(horse.form_trend||scout.form_trend||'').toLowerCase();
 let form=['unknown','—','No recorded racing form trend'];
 if(/^(up|improving|positive)$/.test(explicitTrend))form=['up','Up','Source-recorded form improving'];
 else if(/^(down|declining|negative)$/.test(explicitTrend))form=['down','Down','Source-recorded form declining'];
 else if(/^(flat|steady|level)$/.test(explicitTrend))form=['level','Level','Source-recorded form steady'];
 else if(/training read/i.test(file?.type||'')&&/trending (the )?right way/i.test(file?.title||''))form=['work','Work ↑','Positive training report, not verified race form'];
 const born=stableDate(facts.date_of_birth||facts.born),raceYear=Number(nowDate().slice(0,4));
 const birthYear=born?Number(born.slice(0,4)):NaN;
 const age=Number.isInteger(raceYear)&&Number.isInteger(birthYear)&&raceYear>=birthYear?String(raceYear-birthYear):stableKnown(facts.age);
 const sex=stableKnown(facts.sex),sexShort=({colt:'C',filly:'F',gelding:'G',mare:'M',horse:'H',stallion:'H'})[sex.toLowerCase()]||sex||'—';
 const starts=Array.isArray(horse.certified_results)?horse.certified_results.filter(x=>x?.source_refs?.length&&stableDate(x.date)):[];
 const last=starts.map(x=>x.date).sort().at(-1)||(
  horse.last_race_source_refs?.length?stableDate(horse.last_race_date):'');
 const matchingFixture=fixtures.find(n=>n.dataset.profile===name);
 const target=stableKnown(calendar.race_target)||stableKnown(matchingFixture?$('p',matchingFixture)?.textContent.trim():'');
 const entry=stableKnown(calendar.entry_status||calendar.status);
 const entered=/entered|confirmed|accepted/i.test(entry)||/entered|confirmed/i.test(status);
 const raceTarget=/maiden|allowance|stakes|handicap|race|r\d\b/i.test(target)&&!/pending|work|held|alternate|not entered|no target/i.test(target);
 const next=stableKnown(calendar.next_race||calendar.scheduled_race)||(entered&&raceTarget?target:'');
 const nextDate=stableDate(calendar.next_race_date||calendar.scheduled_date);
 const earnings=stableKnown(facts.earnings)||(horse.earnings_source_refs?.length?stableKnown(horse.career_earnings):'');
 const connections=facts.connections||{};
 const ownerName=owner(name),trainer=stableKnown(connections.trainer)||(horse.trainer_source_refs?.length?stableKnown(horse.trainer_name):'');
 const breeder=stableKnown(connections.breeder)||(horse.breeder_source_refs?.length?stableKnown(horse.breeder_name):'');
 const recordStats=facts.record||{},recordValid=['starts','wins','seconds','thirds'].every(k=>/^\d+$/.test(String(recordStats[k])));
 const careerRecord=recordValid?['starts','wins','seconds','thirds'].map(k=>recordStats[k]).join('-'):'';
 return {name,status,vet,file,age,sexShort,health,ready,readyRaw,form,last,next,nextDate,target,earnings,
  ownerName,trainer,breeder,careerRecord,ability:stableEvidenceStars(name,'current_ability'),
  potential:stableEvidenceStars(name,'future_potential')};
}
function stableRosterView(){
 const save=readState(),horseRecords=records().filter(x=>x.kind==='horse'),files=cases();
 const fixtures=$('.fixtureList .fixture');
 const all=horseRecords.map(x=>stableHorseSnapshot(x,fixtures,files,save));
 const q=ui.stableQuery.toLowerCase().trim();
 const rows=all.filter(x=>{
  if(q&&![x.name,x.status,x.target,x.ownerName,x.trainer,x.breeder].some(v=>String(v||'').toLowerCase().includes(q)))return false;
  if(ui.stableFilter==='vet')return ['watch','treatment'].includes(x.health[0]);
  if(ui.stableFilter==='ready')return ['ready','entered'].includes(x.ready[0]);
  if(ui.stableFilter==='action')return Boolean(x.file);
  return true;
 });
 const td=(v,cls,sort)=>tableCell(h(stableKnown(v)||'—'),cls,sort??stableKnown(v));
 const badges=Object.freeze({treatment:4,watch:3,unknown:2,sound:1,ready:5,entered:4,building:3,restricted:1,
  up:5,work:4,level:3,down:1});
 const body=rows.map(x=>'<tr>'+
  tableCell('<div class="mg-stable-horse-cell">'+ownerChip(x.name)+button(h(x.name),'open','horse|'+x.name+'|','mg-stable-name')+'</div>'+
   (x.status?'<small title="'+h(x.status)+'">'+h(x.status)+'</small>':''),'mg-stable-horse-id',x.name)+
  tableCell(h(x.age||'—')+' / '+h(x.sexShort),'mg-stable-age',x.age||'')+
  tableCell(stableIcon(x.health[0],x.health[1],x.vet||x.file?.title||x.health[1]),'',badges[x.health[0]])+
  tableCell(stableIcon(x.ready[0],x.ready[1],x.readyRaw||'Not assessed'),'',badges[x.ready[0]])+
  tableCell(x.ability.html,'mg-stable-star-cell',x.ability.sort)+
  tableCell(x.potential.html,'mg-stable-star-cell',x.potential.sort)+
  tableCell(stableIcon(x.form[0],x.form[1],x.form[2]),'',x.form[0]==='unknown'?'':badges[x.form[0]])+
  td(x.last,'mg-stable-date',x.last)+
  td(x.nextDate?x.nextDate+' '+x.next:x.next,'mg-stable-next',x.nextDate||x.next)+
  td(x.target,'mg-stable-target',x.target)+
  td(x.earnings,'mg-stable-earnings',x.earnings.replace(/[^0-9.]/g,''))+
  td(x.ownerName==='Not recorded'?'':x.ownerName,'mg-stable-person',x.ownerName==='Not recorded'?'':x.ownerName)+
  td(x.trainer,'mg-stable-person',x.trainer)+
  td(x.breeder,'mg-stable-person',x.breeder)+
  td(x.careerRecord,'mg-stable-record',x.careerRecord)+
  tableCell(button('›','open','horse|'+x.name+'|','mg-rowlink'),'numeric')+'</tr>').join('');
 const headings=['HORSE','AGE/SEX','HEALTH','READY','ABILITY','POTENTIAL','FORM','LAST RACED','NEXT RACE','TARGET','EARNINGS','OWNER','TRAINER','BREEDER','S-W-P-S','OPEN'];
 const head=headings.map((v,i)=>'<th'+(i===15?' class="numeric"':' data-mg-sort-col="'+i+'" tabindex="0" aria-sort="none" title="Sort by '+h(v)+'"')+'>'+v+(i===15?'':'<span class="mg-table-sortmark" aria-hidden="true">↕</span>')+'</th>').join('');
 const table='<div class="mg-table-wrap mg-stable-roster-scroller" tabindex="0" aria-label="Horse roster, scroll horizontally for extra columns">'+
  '<table class="mg-table mg-stable-roster '+(ui.stableColumns==='focus'?'mg-stable-roster-focus':'')+'"><thead><tr>'+head+'</tr></thead><tbody>'+
  (body||'<tr><td colspan="16" class="mg-stable-empty">No matching horses. Clear the filters to see the stable.</td></tr>')+
  '</tbody></table></div>';
 const filterButtons=[['all','ALL'],['vet','VET WATCH'],['ready','READY / ENTERED'],['action','OPEN FILES']].map(([value,label])=>
  button(label,'stable-filter',value,'mg-button'+(ui.stableFilter===value?' on':''))).join('');
 const scheduleRows=fixtures.slice(0,4).map(n=>'<tr>'+td($('.d',n)?.textContent.trim())+
  td($('h4',n)?.textContent.trim(),'strong')+td($('p',n)?.textContent.trim(),'dim')+'</tr>');
 const personnel=records().filter(x=>x.kind==='person');
 const peopleRows=personnel.slice(0,3).map(x=>'<tr>'+tableCell(linkRecord(x,x.name),'strong')+td(x.detail,'dim')+'</tr>');
 const related=files.filter(f=>all.some(x=>x.file?.id===f.id));
 const caseRows=related.slice(0,4).map(x=>'<tr>'+tableCell(button(h(x.title),'open-case',x.id,'mg-rowlink'),'strong')+
  td(x.pressure,'dim')+'</tr>');
 const support='<div class="mg-stable-support">'+
  panel('Upcoming Racing',compactTable([{text:'DATE'},{text:'HORSE / EVENT'},{text:'CONTEXT'}],scheduleRows),'CURRENT CALENDAR')+
  panel('Personnel & Connections',compactTable([{text:'PERSON'},{text:'ROLE'}],peopleRows),personnel.length+' PEOPLE')+
  panel('Management Files',caseRows.length?compactTable([{text:'HORSE FILE'},{text:'PRESSURE'}],caseRows):empty('No active horse files'),related.length+' RELATED')+'</div>';
 const legend='<div class="mg-stable-roster-legend">'+
  stableIcon('sound','Sound','Only when explicitly recorded')+
  stableIcon('watch','Vet watch','Concern or investigation; treatment not assumed')+
  stableIcon('treatment','Treatment','Explicit treatment only')+
  stableIcon('ready','Ready','Explicitly confirmed readiness')+
  stableIcon('up','Up','Improving form')+
  stableIcon('down','Down','Declining form')+
  '<span>— = no sourced value · Stars require evidence · Targets are not confirmed entries</span></div>';
 return pageBar('Stable & Horses','SORTABLE HORSE OPERATIONS · '+all.length+' RECORDS',
  button('GLOBAL DIRECTORY','nav','search')+button('HISTORY ARCHIVE','nav','history'))+
  '<div class="mg-content mg-stable-roster-page"><div class="mg-stable-toolbar">'+
  '<label class="mg-stable-query"><span>⌕</span><input id="mgStableSearch" type="search" data-mg-input="stable-search" placeholder="Find horse, owner, trainer…" value="'+h(ui.stableQuery)+'"></label>'+
  '<div class="mg-stable-filters">'+filterButtons+'</div>'+
  '<div class="mg-stable-views">'+button('ALL COLUMNS','stable-columns','all','mg-button'+(ui.stableColumns==='all'?' on':''))+
  button('QUICK VIEW','stable-columns','focus','mg-button'+(ui.stableColumns==='focus'?' on':''))+'</div></div>'+
  '<section class="mg-section mg-stable-roster-panel"><header><strong>STABLE ROSTER</strong><small>'+rows.length+' / '+all.length+' · CLICK HEADERS TO SORT</small></header>'+
  table+legend+'</section>'+support+'</div>';
}

function operationsDashboard(view){
 const viewIsStable=view==='stable',kind=viewIsStable?'horse':'track';
 const base=viewIsStable?records().filter(x=>x.kind==='horse'):allRecords().filter(x=>x.kind==='track');
 const staff=records().filter(x=>x.kind==='person');
 const racing=records().filter(x=>x.kind==='race');
 const office=cases();
 const fixtureNodes=$$('.fixtureList .fixture').slice(0,12);
 const fixtures=fixtureNodes.map(n=>'<tr>'+tableCell(h($('.d',n)?.textContent.trim()||'—'))+
  tableCell(h($('h4',n)?.textContent.trim()||'—'),'strong')+
  tableCell(h($('p',n)?.textContent.trim()||'—'),'dim')+'</tr>');
 const roster=base.map(x=>{
  const condition=readState().horseState?.[x.name]?.status;
  const context=office.find(c=>c.title?.toLowerCase().includes(x.name.toLowerCase()));
  const fixture=fixtureNodes.find(n=>n.dataset.profile===x.name);
  const target=readState().calendarState?.[x.name]?.race_target||
   (fixture?$('p',fixture)?.textContent.trim():'')||'—';
  return '<tr>'+tableCell(linkRecord(x,x.name,viewIsStable),'strong')+
   (viewIsStable?
    tableCell(h(condition||context?.type||'No current report'),'dim')+
    tableCell(h(target),'gold')+
    tableCell(h(owner(x.name)),'dim'):
    tableCell(h(x.detail||'—'))+tableCell(h(x.track||'—'),'dim'))+
   tableCell(button('OPEN ›','open',x.kind+'|'+x.name+'|'+(x.track||''),'mg-rowlink'),'numeric')+'</tr>';
 });
 const secondary=viewIsStable?staff.map(x=>'<tr>'+tableCell(linkRecord(x,x.name),'strong')+
  tableCell(h(x.detail||'Personnel record'))+tableCell(h(x.track||'—'),'dim')+
  tableCell(button('OPEN ›','open','person|'+x.name+'|','mg-rowlink'),'numeric')+'</tr>'):
  racing.map(x=>'<tr>'+tableCell(linkRecord(x,x.name),'strong')+tableCell(h(x.detail||'Stakes record'))+
  tableCell(h(x.track||'—'),'dim')+tableCell(button('OPEN ›','open','race|'+x.name+'|'+(x.track||''),'mg-rowlink'),'numeric')+'</tr>');
 const decisionRows=office.map(x=>'<div class="mg-op-case">'+
  '<div class="mg-op-case-category">'+h(x.type||'OFFICE')+'</div>'+
  '<div class="mg-op-case-text"><strong>'+h(x.title||x.id)+'</strong><small>'+h(x.source||'Office')+
    ' · '+h(x.pressure||'Current file')+'</small></div>'+
  button('REVIEW ›','open-case',x.id,'mg-rowlink')+'</div>').join('');
 const title=viewIsStable?'Stable & Horses':'Racecourses',short=viewIsStable?'HORSE OPERATIONS':'TRACKS / VENUES';
 const stableCards=base.map(x=>{
  const game=readState();
  const status=game.horseState?.[x.name]?.status;
  const related=office.find(c=>[c.title,c.summary].some(t=>String(t||'').toLowerCase().includes(x.name.toLowerCase())));
  const exact=fixtureNodes.find(n=>n.dataset.profile===x.name);
  const target=game.calendarState?.[x.name]?.race_target||(exact?$('p',exact)?.textContent.trim():'')||'';
  return '<article class="mg-stable-horse-card">'+
   '<div class="mg-stable-horse-head">'+ownerChip(x.name)+
    '<div class="mg-stable-horse-title">'+
      button(h(x.name),'open','horse|'+x.name+'|','mg-stable-horse-link')+
      '<small>'+h(status||related?.type||'No current report')+'</small></div>'+
    button('VIEW PROFILE ›','open','horse|'+x.name+'|','mg-stable-horse-open')+'</div>'+
   '<div class="mg-stable-horse-detail"><span><b>OWNER</b> '+h(owner(x.name))+'</span>'+
    '<span><b>NEXT TARGET</b> '+h(target||'Not entered')+'</span></div>'+
   (related?'<div class="mg-stable-horse-context"><span>'+h(related.title)+'</span>'+
       button('REVIEW CASE ›','open-case',related.id,'mg-stable-horse-review')+'</div>':
     '<div class="mg-stable-horse-context"><span>No additional sourced horse decision.</span></div>')+
   '</article>';
 }).join('');
 const first=panel(title,viewIsStable?
  '<div class="mg-stable-horse-list">'+stableCards+'</div>':
  compactTable([{text:'NAME',style:'width:34%'},{text:'RECORD'},{text:'LOCATION'},
    {text:'OPEN',style:'width:65px'}],roster),base.length+' RECORDS');
 const second=panel('Upcoming Racing',fixtures.length?compactTable([{text:'DATE',style:'width:84px'},{text:'HORSE / RACE'},{text:'TRACK / CONDITIONS'}],fixtures):
  empty('No sourced race targets are attached to the active schedule.'),'CURRENT RACE CALENDAR');
 const personnelBody=secondary.length?compactTable([{text:'NAME',style:'width:34%'},{text:'ROLE / RECORD'},
   {text:'BASE / TRACK'},{text:'OPEN',style:'width:65px'}],secondary):
  empty('No additional current source records.');
 const third=panel(viewIsStable?'Personnel & Connections':'Stakes & Competition',
  personnelBody+(viewIsStable?'<div class="mg-stable-directory-action">'+
   button('FULL PERSONNEL DIRECTORY ›','nav','person','mg-rowlink')+'</div>':''),
  viewIsStable?staff.length+' PEOPLE':'RACING RECORDS');
 const fourth=panel('Management Files',decisionRows||empty('No current Office cases.'),office.length+' LIVE CASES');
 return pageBar(title,short,button('GLOBAL DIRECTORY','nav','search')+button('HISTORY ARCHIVE','nav','history'))+
  '<div class="mg-content mg-op-content"><div class="mg-operations-grid '+(viewIsStable?'stable mg-stable-command':'tracks')+'">'+
  first+second+third+fourth+'</div></div>';
}
function departmentStudio(view){
 const all=records(),horses=all.filter(x=>x.kind==='horse'),
  people=allRecords().filter(x=>x.kind==='person'),farms=all.filter(x=>x.kind==='farm'),
  tracks=allRecords().filter(x=>x.kind==='track'),races=all.filter(x=>x.kind==='race'),office=cases();
 const fixtures=$$('.fixtureList .fixture').slice(0,18);
 const summary=([a,b,c,d])=>panel(a,b,c,d);
 const horseList=()=>compactTable([{text:'HORSE',style:'width:27%'},{text:'OWNER'},
  {text:'CURRENT STATUS'},{text:'NEXT TARGET'},{text:'OPEN',style:'width:58px'}],
  horses.map(x=>'<tr>'+tableCell(linkRecord(x,x.name,true),'strong')+
   tableCell(h(owner(x.name)),'dim')+
   tableCell(h(readState().horseState?.[x.name]?.status||'No current report'),'dim')+
   tableCell(h(readState().calendarState?.[x.name]?.race_target||'—'),'gold')+
   tableCell(button('OPEN ›','open','horse|'+x.name+'|','mg-rowlink'),'numeric')+'</tr>'));
 const peopleList=(list=people)=>compactTable([{text:'PERSON',style:'width:34%'},{text:'ROLE / PROFESSIONAL FILE'},
   {text:'RECORDED LOCATION'},{text:'OPEN',style:'width:64px'}],list.map(x=>'<tr>'+
   tableCell(linkRecord(x,x.name),'strong')+tableCell(h(x.detail||'Personnel record'))+
   tableCell(h(x.track||'—'),'dim')+tableCell(button('OPEN ›','open','person|'+x.name+'|'+(x.person_id?'@'+x.person_id:''),'mg-rowlink'),'numeric')+'</tr>'));
 const placeList=(list,kind)=>compactTable([{text:'LOCATION',style:'width:33%'},{text:'RECORD / BASE'},
   {text:'OPEN',style:'width:62px'}],list.map(x=>'<tr>'+tableCell(linkRecord(x,x.name),'strong')+
   tableCell(h(x.detail||x.track||'—'),'dim')+
   tableCell(button('OPEN ›','open',kind+'|'+x.name+'|'+(x.track||''),'mg-rowlink'),'numeric')+'</tr>'));
 const raceList=()=>compactTable([{text:'RACE',style:'width:35%'},{text:'GRADE / VENUE'},
   {text:'TRACK'},{text:'OPEN',style:'width:62px'}],races.map(x=>'<tr>'+
   tableCell(linkRecord(x,x.name),'strong')+tableCell(h(x.detail||'—'))+
   tableCell(h(x.track||'—'),'dim')+tableCell(button('OPEN ›','open','race|'+x.name+'|'+(x.track||''),'mg-rowlink'),'numeric')+'</tr>'));
 const calendar=()=>fixtures.length?compactTable([{text:'DATE',style:'width:88px'},{text:'HORSE / EVENT'},
   {text:'TRACK / CONTEXT'}],fixtures.map(n=>'<tr>'+tableCell(h($('.d',n)?.textContent.trim()||'—'))+
   tableCell(h($('h4',n)?.textContent.trim()||'—'),'strong')+
   tableCell(h($('p',n)?.textContent.trim()||'—'),'dim')+'</tr>')):
   empty('No approved upcoming race or event entries in the current Office file.');
 const caseList=(filtered=office)=>filtered.length?filtered.map(x=>'<div class="mg-op-case">'+
  '<div class="mg-op-case-category">'+h(x.type||'OFFICE')+'</div>'+
  '<div class="mg-op-case-text"><strong>'+h(x.title||x.id)+'</strong><small>'+
   h(x.source||'Office')+' · '+h(x.risk||x.pressure||'Current management file')+'</small></div>'+
  button('REVIEW ›','open-case',x.id,'mg-rowlink')+'</div>').join(''):
  empty('No current Office decisions of this type.');
 const important=words=>office.filter(x=>words.test([x.type,x.title,x.source,x.summary].join(' ')));
 const bloodstock=people.filter(x=>/bloodstock|breeder|farm|owner|agent|sales/i.test(x.detail||''));
 const racingPeople=people.filter(x=>/jockey|trainer|stable|rider/i.test(x.detail||''));
 const circuitGroups=new Map();
 for(const x of ui.trackGeo?.tracks||[]){
  const k=x.macro_circuit||'Circuit not yet classified';
  if(!circuitGroups.has(k))circuitGroups.set(k,[]);
  circuitGroups.get(k).push(x);
 }
 const circuitTable=compactTable([
  {text:'RACING CIRCUIT',style:'width:49%'},{text:'TRACKS',style:'width:65px'},
  {text:'SAMPLE VENUE'},{text:'OPEN',style:'width:55px'}
 ],[...circuitGroups.entries()].sort((a,b)=>b[1].length-a[1].length||a[0].localeCompare(b[0]))
  .map(([area,venues])=>{
   const first=venues[0];
   return '<tr>'+tableCell(h(area),'strong')+tableCell(h(String(venues.length)),'numeric')+
    tableCell(h(first.name),'dim')+
    tableCell(button('OPEN ›','open','track|'+first.name+'|','mg-rowlink'),'numeric')+'</tr>';
  }));
 const worldIntel='<div class="mg-world-current">'+caseList(important(/race|track|news|world|colt|entries|calendar/i))+'</div>'+
  '<div class="mg-world-circuit-label"><strong>RACING CIRCUIT INDEX</strong><span>'+circuitGroups.size+
   ' NETWORKS · '+(ui.trackGeo?.tracks?.length||0)+' SOURCE-BACKED TRACKS</span></div>'+circuitTable;
 const folder={
  racing:{
   title:'Racing & Stakes',sub:'RACE PLACEMENT · STAKES CALENDAR',
   sections:[
    ['Stakes & Race Directory',raceList(),races.length+' RACE RECORDS'],
    ['Upcoming Race Calendar',calendar(),fixtures.length+' OFFICE ENTRIES'],
    ['Eligible Stable Athletes',horseList(),horses.length+' HORSES'],
    ['Racing Decisions',caseList(important(/entry|race|place|training|work|vet|calendar/i)),
      'SOURCE-LINKED MANAGEMENT']
   ]
  },
  breeding:{
   title:'Breeding Operations',sub:'FARMS · BLOODSTOCK · HORSE RECORDS',
   sections:[
    ['Farms & Stud Operations',farms.length?placeList(farms,'farm'):empty('No registered farms in the active Office file.'),farms.length+' FACILITY RECORDS'],
    ['Owner & Agency Directory',bloodstock.length?peopleList(bloodstock):empty('No source-linked ownership or agency records.'),bloodstock.length+' WORLD DIRECTORY ENTRIES'],
    ['Horse & Ownership Register',horseList(),horses.length+' HORSES'],
    ['Bloodstock Intelligence',caseList(important(/sales|hip|foal|breeding|colt|bloodstock|auction/i)),'MARKET / BREEDING FILES']
   ]
  },
  sales:{
   title:'Sales & Auctions',sub:'BLOODSTOCK MARKET · ACTIVE OPPORTUNITIES',
   sections:[
    ['Sales & Bloodstock Intelligence',caseList(important(/sales|auction|catalog|hip|buy|price|bloodstock/i)),
      'CURRENT MANAGEMENT LEADS'],
    ['Owners & Market Agents',bloodstock.length?peopleList(bloodstock):empty('No source-linked owner or agent records.'),bloodstock.length+' WORLD DIRECTORY ENTRIES'],
    ['Horse & Ownership Register',horseList(),horses.length+' HORSES'],
    ['Current Office Calendar',calendar(),fixtures.length+' SCHEDULED ITEMS']
   ]
  },
  person:{
   title:'Personnel Directory',sub:'TRAINERS · JOCKEYS · STABLE STAFF',
   sections:[
    ['Racing Personnel Directory',peopleList(),people.length+' CURRENT / HISTORICAL PEOPLE'],
    ['Stable Athletes',horseList(),horses.length+' HORSE RECORDS'],
    ['Staff & Office Intelligence',caseList(important(/staff|jockey|trainer|stable|gallop|work|vet|bloodstock/i)),
       'SOURCE-LINKED REPORTS'],
    ['Upcoming Race Assignments',calendar(),fixtures.length+' SCHEDULED ITEMS']
   ]
  },
  farm:{
   title:'Farms & Facilities',sub:'FARM OPERATIONS · FACILITY NETWORK',
   sections:[
    ['Farm & Barn Directory',farms.length?placeList(farms,'farm'):empty('No registered farms in the current Office source.'),farms.length+' FACILITIES'],
    ['World Training Professionals',racingPeople.length?peopleList(racingPeople):peopleList(),racingPeople.length+' WORLD DIRECTORY ENTRIES'],
    ['Horses & Current Operations',horseList(),horses.length+' HORSES'],
    ['Facility Management Files',caseList(important(/stable|barn|turnout|farm|health|vet|work|training/i)),
      'CURRENT OFFICE REPORTS']
   ]
  },
  world:{
   title:'Racing World',sub:'RACECOURSES · STAKES · CALENDAR',
   sections:[
    ['Racecourse Directory',placeList(tracks,'track'),tracks.length+' VENUES'],
    ['Current Racing Schedule',calendar(),fixtures.length+' OFFICE ENTRIES'],
    ['Stakes & Major Races',raceList(),races.length+' RACE RECORDS'],
    ['Racing World Intelligence & Circuit Network',worldIntel,
      'LIVE WORLD FILES · REGIONAL DIRECTORY']
   ]
  }
 };
 const config=folder[view];if(!config)return null;
 const heading=pageBar(config.title,config.sub,button('GLOBAL DIRECTORY','nav','search')+
  button('HISTORY ARCHIVE','nav','history'));
 const directoryViews={breeding:1,sales:1,person:0,farm:1};
 if(Object.prototype.hasOwnProperty.call(directoryViews,view)){
  const main=directoryViews[view];
  return heading+'<div class="mg-content mg-op-content"><div class="mg-directory-layout '+view+'">'+
   summary(config.sections[main])+
   '<div class="mg-directory-side">'+config.sections.filter((x,i)=>i!==main).map(x=>summary(x)).join('')+
   '</div></div></div>';
 }
 return heading+'<div class="mg-content mg-op-content"><div class="mg-operations-grid mg-department-suite '+view+'">'+
  config.sections.map(x=>summary(x)).join('')+'</div></div>';
}
function financeStudio(){
 const all=cases(),cash=all.find(c=>c.id==='cash'),sales=all.find(c=>c.id==='saratoga'),
  related=all.filter(c=>/finance|cash|sales|auction|price|owner|buy/i.test([c.type,c.title,c.summary].join(' ')));
 const signalRows=item=>item?.intel?.length?item.intel.map(x=>
  '<div class="mg-finance-signal"><strong>'+h(x[0])+'</strong><span>'+h(x[1])+'</span></div>').join(''):
  empty('No further sourced market signals in this Office file.');
 const actionRows=item=>item?.moves?.length?item.moves.map((m,i)=>
  '<div class="mg-finance-option"><strong>'+String(i+1).padStart(2,'0')+'</strong>'+
  '<span><b>'+h(m[0])+'</b><small>'+h(m[1])+'</small></span></div>').join(''):'';
 const cashDetail=cash?'<div class="mg-finance-lead"><div class="mg-kicker mg-gold">'+h(cash.type||'FINANCE / OPERATIONS')+
  ' · '+h(cash.source||'OFFICE')+'</div><h2>'+h(cash.title)+'</h2><p>'+h(cash.summary)+'</p>'+
  '<div class="mg-finance-facts"><span>PRESSURE <b>'+h(cash.pressure||'Not recorded')+'</b></span>'+
  '<span>PRIMARY RISK <b>'+h(cash.risk||'Not recorded')+'</b></span>'+
  '<span>MANAGER READ <b>'+h(cash.read||'Not recorded')+'</b></span></div>'+
  '<div class="mg-finance-decision"><strong>AVAILABLE MANAGEMENT STANCES</strong>'+
   actionRows(cash)+button('REVIEW CASH DECISION ›','open-case',cash.id,'mg-button on')+'</div></div>':
  empty('No live financial management file is attached.');
 const cashPanel=panel('Current Financial File',cashDetail,'MANAGEMENT DECISION');
 const signalsPanel=panel('Financial Intelligence',signalRows(cash),'APPROVED OFFICE READS');
 const salesPanel=panel('Market & Purchase Exposure',
  sales?'<div class="mg-finance-lead"><div class="mg-kicker">'+h(sales.source||'BLOODSTOCK')+'</div>'+
   '<h2>'+h(sales.title)+'</h2><p>'+h(sales.summary)+'</p></div>'+signalRows(sales)+
   '<div class="mg-finance-footer">'+button('REVIEW SALES FILE ›','open-case',sales.id,'mg-button on')+'</div>':
   empty('No current bloodstock purchase file.'),'SALES / CASH DISCIPLINE');
 const ledger=panel('Related Office Decisions',related.length?related.map(x=>
   '<div class="mg-op-case"><div class="mg-op-case-category">'+h(x.type||'FINANCE')+'</div>'+
   '<div class="mg-op-case-text"><strong>'+h(x.title)+'</strong>'+
   '<small>'+h(x.source||'Office')+' · '+h(x.risk||x.pressure||'Current case')+'</small></div>'+
   button('REVIEW ›','open-case',x.id,'mg-rowlink')+'</div>').join(''):
   empty('No other sourced financial decision files.'),related.length+' CURRENT FILES');
 return pageBar('Financial Operations','CASH DISCIPLINE · PURCHASE EXPOSURE',
  button('SALES & AUCTIONS','nav','sales')+button('RACING OFFICE','nav','office'))+
 '<div class="mg-content mg-op-content"><div class="mg-operations-grid mg-finance-grid">'+
 cashPanel+signalsPanel+salesPanel+ledger+'</div></div>';
}
function department(view){
 if(view==='stable')return stableRosterView();
 if(view==='track')return operationsDashboard(view);
 if(view==='finances')return financeStudio();
 const studio=departmentStudio(view);if(studio)return studio;
 const map={stable:['horse','Stable & Horses','HORSE OPERATIONS'],racing:['race','Racing & Stakes','CALENDAR / ENTRIES'],breeding:['farm','Breeding Operations','FARMS / BLOODSTOCK'],sales:['horse','Sales & Market','HORSES / SALES CONTEXT'],person:['person','Personnel Directory','TRAINERS, JOCKEYS & STAFF'],farm:['farm','Farms & Facilities','FARM / BARN DIRECTORY'],track:['track','Racecourses','TRACKS & VENUES'],world:['track','Racing World','GLOBAL RACING OPERATIONS'],finances:['horse','Financial Operations','OFFICE / FINANCIAL CONTEXT'],inbox:['horse','Office Correspondence','DECISION FILES']};
 const item=map[view]||map.stable,kind=item[0],list=records().filter(r=>r.kind===kind),game=readState();
 const status=list.map(r=>'<tr>'+tableCell(linkRecord(r,r.name,kind==='horse'),'strong')+
  tableCell(h(r.detail||'—'))+tableCell(h(kind==='horse'?owner(r.name):'—'),'dim')+
  tableCell(h(kind==='horse'?(game.horseState?.[r.name]?.status||'No recent status'):(r.track||'—')),'gold')+
  tableCell(button('OPEN ›','open',r.kind+'|'+r.name+'|'+(r.track||''),'mg-rowlink'),'numeric')+'</tr>');
 const heading=pageBar(item[1],item[2],button('SEARCH ALL RECORDS','nav','search')+button('HISTORICAL ARCHIVE','nav','history'));
 if(view==='inbox')return pageBar('Inbox','SOURCE-LINKED MANAGEMENT CASES')+'<div class="mg-content">'+inboxView()+caseDecision()+'</div>';
 return heading+'<div class="mg-content"><div class="mg-dashboard-tiles">'+
  [['CONNECTED RECORDS',String(list.length)],['GAME DATE',nowDate()],['CURRENT STATE','Live Office'],['DATA SOURCE','Canonical']].map(x=>'<div class="mg-stat"><small>'+h(x[0])+'</small><strong style="font-size:17px">'+h(x[1])+'</strong></div>').join('')+'</div>'+
  '<div class="mg-department-grid">'+panel(item[1],compactTable([{text:'NAME',style:'width:30%'},{text:'ROLE / DESCRIPTION'},{text:'OWNER / CONNECTION'},{text:'STATUS / CONTEXT'},{text:'OPEN',style:'width:70px'}],status),'OPEN SOURCE RECORDS')+
  panel('Management Context','<div class="mg-summary"><strong>Operational records</strong><p>This screen uses the approved current Office roster and its linked profiles. Historical coverage is available in the History Vault. Unverified fields remain unfilled.</p>'+
  '<p>Choose any row to open its full dossier. The same profile structure and typography are used throughout the game.</p></div>'+
  (view==='finances'?pairs([['Available cash','See Racing Office cash file'],['Financial source','Current Office decisions']]):empty('No additional sourced summary attached.')))+
  '</div></div>';
}
function view(){
 const route=activeRoute();if(route&&route.name){
  if(route.type==='horse')return horseProfile(route.name);
  if(route.type==='person')return personProfile(route.name);
  if(route.type==='track')return trackProfile(route.name);
  if(['farm','race'].includes(route.type))return otherProfile(route.type,route.name);
 }
 if(ui.view==='search')return searchView();
 if(ui.view==='office')return home();
 return department(ui.view);
}
function render(){
 ui.renderCount++;
 const route=activeRoute();
 root.innerHTML=header()+sidebar()+'<main class="mg-main" aria-label="Management workspace">'+view()+'</main>';
 if(ui.filterFocus||ui.stableFocus){
  const input=ui.stableFocus?$('#mgStableSearch'):($('#mgSearch')||$('#mgTopSearch'));if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}
  ui.filterFocus=false;ui.stableFocus=false;
 }
}
function goFromSearch(value){
 const [kind,name,track]=value.split('|');
 if(kind==='screen'){nav((allRecords().find(r=>r.kind==='screen'&&r.name===name)||{}).view||'office');return}
 openRecord(kind,name,track);
}
root.addEventListener('click',event=>{
 const sortCol=event.target.closest('th[data-mg-sort-col]');
 if(sortCol&&root.contains(sortCol)){event.preventDefault();sortRosterColumn(sortCol);return}
 const el=event.target.closest('[data-mg]');if(!el)return;
 event.preventDefault();event.stopPropagation();
 const action=el.dataset.mg,value=el.dataset.value||'';
 if(action==='nav'){nav(value);return}
 if(action==='open'){goFromSearch(value);return}
 if(action==='open-case'){ui.caseId=value;const source=$('.app .msg[data-case="'+CSS.escape(value)+'"]');if(source)withSilentOfficeRoute(()=>source.click());nav('office');return}
 if(action==='case'){ui.caseId=value;const source=$('.app .msg[data-case="'+CSS.escape(value)+'"]');if(source)withSilentOfficeRoute(()=>source.click());render();return}
 if(action==='choose'){const src=$$('.app [data-act]').find(x=>x.dataset.act==='Choose: '+value);if(src)src.click();setTimeout(render,60);return}
 if(action==='stable-filter'){ui.stableFilter=value;render();return}
 if(action==='stable-columns'){ui.stableColumns=value;render();return}
 if(action==='filter'){ui.type=value;render();return}
 if(action==='sort'){ui.sort=value;render();return}
 if(action==='continue'){sourceAction('Continue');setTimeout(render,100);return}
 if(action==='save'){sourceAction('Save');return}
 if(action==='back'){history.back();setTimeout(render,100);return}
 if(action==='forward'){history.forward();setTimeout(render,100);return}
});
root.addEventListener('input',event=>{
 if(event.target.dataset.mgInput==='stable-search'){ui.stableQuery=event.target.value;ui.stableFocus=true;render();return}
 if(!['search','topsearch'].includes(event.target.dataset.mgInput))return;
 ui.q=event.target.value;ui.view='search';ui.filterFocus=true;
 history.replaceState({mg:'search'},'',stateUrl('search'));
 render();
});
root.addEventListener('keydown',event=>{
 const sortable=event.target.closest('th[data-mg-sort-col]');
 if(sortable&&(event.key==='Enter'||event.key===' ')){
  event.preventDefault();sortRosterColumn(sortable);return;
 }
 if(event.key==='Enter'&&event.target.matches('#mgSearch,#mgTopSearch')){
  const r=searchResults()[0];if(r){event.preventDefault();if(r.kind==='screen')nav(r.view);else openRecord(r.kind,r.name,r.track)}
 }
});
window.addEventListener('popstate',()=>setTimeout(()=>{
 const route=activeRoute();const p=new URLSearchParams(location.search);
 ui.view=route?'profile':p.get('ui')||'office';render();
},100));
window.addEventListener('storage',event=>{if(event.key==='wtwOfficeStateV30')render()});
const params=new URLSearchParams(location.search);
ui.view=activeRoute()?'profile':params.get('ui')||'office';
if(!['profile','office','search','stable','racing','breeding','sales','person','farm','track','world','finances','inbox'].includes(ui.view))ui.view='office';
Promise.allSettled([
 fetch('/assets/game/attribute-catalog.v1.json').then(x=>x.ok?x.json():null).then(x=>{if(x?.horse_categories)ui.catalog=x}),
 fetch('/assets/office/decision-photo-index.json').then(x=>x.ok?x.json():null).then(x=>{ui.photos=x}),
 fetch('/assets/office/organization-logo-index.json').then(x=>x.ok?x.json():null).then(x=>{if(x?.organizations)ui.logos=x}),
 fetch('/data/person-geography-ui-v33.json').then(x=>x.ok?x.json():null).then(x=>{if(x?.schema==='WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1')ui.personGeo=x}),
 fetch('/data/track-geography-v33.json').then(x=>x.ok?x.json():null).then(x=>{if(x?.tracks&&x?.authority)ui.trackGeo=x})
]).then(render);
render();setTimeout(render,150);
window.__WTW_MANAGER_V2__={render,state:readState,records,ui,openRecord};
})();
