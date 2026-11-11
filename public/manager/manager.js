/* WTW MANAGEMENT STUDIO V2 — clean-sheet presentation.
   Reads original Office simulation and source-linked profile DOM only.
   No new authoritative data, rating generation, saves or gameplay decisions. */
(()=>{
'use strict';
const $=(q,scope=document)=>scope.querySelector(q), $$=(q,scope=document)=>[...scope.querySelectorAll(q)];
const h=v=>String(v==null?'':v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const known=v=>v!=null&&String(v).trim()!==''&&!['—','Unknown','Not recorded','N/A'].includes(String(v).trim());
const root=document.createElement('div');root.id='mgApp';root.setAttribute('aria-label','Wire to Wire Management Studio');document.body.appendChild(root);
const ui={view:'office',q:'',type:'all',sort:'name',caseId:'powerline',catalog:null,photos:null,searchRecords:[],filterFocus:false,stage:'',renderCount:0};
const readState=()=>{try{return JSON.parse(localStorage.getItem('wtwOfficeStateV30')||'{}')}catch{return {}}};
const records=()=>typeof window.__wtwOfficeSearchRecords==='function'?window.__wtwOfficeSearchRecords():[];
const activeRoute=()=>{const p=new URLSearchParams(location.search);const page=p.get('page');return page&&page!=='office'?{type:page,name:p.get('name'),track:p.get('track')}:null;};
const nowDate=()=>$('.app .dateChip')?.textContent.trim()||readState().date||'2014-07-15';
const icon={office:'⌂',inbox:'✉',stable:'♞',racing:'⚑',breeding:'♧',sales:'◆',person:'♟',farm:'⌂',track:'◈',finances:'$',world:'◎',search:'⌕',history:'▤'};
const button=(label,action,value,cl='mg-button')=>'<button type="button" class="'+cl+'" data-act="MG UI" data-mg="'+h(action)+'"'+(value!=null?' data-value="'+h(value)+'"':'')+'>'+label+'</button>';
const siteRoot=()=>location.pathname.startsWith('/manager/')?'/manager/':'/';
const stateUrl=view=>{const p=new URLSearchParams();if(view!=='office')p.set('ui',view);return siteRoot()+(p.toString()?'?'+p:'')};
const sourceAction=action=>{const el=$$('.app [data-act]').find(n=>n.dataset.act===action);if(el){el.click();setTimeout(render,60);return true}return false};
function nav(view){
 if(view==='history'){location.assign('/archive/?page=races');return}
 ui.view=view;ui.q='';ui.type='all';
 history.pushState({mg:view},'',stateUrl(view));
 render();
}
function openRecord(kind,name,track){
 if(!window.__wtwOfficeOpenSearchRecord?.(kind,name,track))return;
 ui.view='profile';
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
 return base.concat(pages.map(r=>({kind:'screen',name:r[0],detail:'Management department',view:r[1]})));
}
function owner(name){const r=typeof window.__wtwOfficeHorseOwner==='function'?window.__wtwOfficeHorseOwner(name):null;return r?.name||'Not recorded'}
function ownerChip(name){const v=owner(name);return '<span class="mg-owner-mark" title="'+h(v)+'">'+(known(v)?h(v.slice(0,1).toUpperCase()):'?')+'</span>'}
function compactTable(head,rows,config=''){
 return '<div class="mg-table-wrap"><table class="mg-table '+config+'"><thead><tr>'+head.map(x=>'<th'+(x.numeric?' class="numeric"':'')+(x.style?' style="'+h(x.style)+'"':'')+'>'+h(x.text||x)+'</th>').join('')+'</tr></thead><tbody>'+rows.join('')+'</tbody></table></div>';
}
function tableCell(text,cls=''){return '<td'+(cls?' class="'+cls+'"':'')+'>'+text+'</td>'}
function linkRecord(record,label,ownerBadge=false){
 const raw=(ownerBadge?ownerChip(record.name)+' ':'')+'<span>'+h(label||record.name)+'</span>';
 return button(raw,'open',record.kind+'|'+record.name+'|'+(record.track||''),'mg-rowlink');
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
 const table=compactTable([{text:'TYPE',style:'width:82px'},{text:'NAME',style:'width:26%'},{text:'ROLE / RACE RECORD'},{text:'OWNER / CONNECTION',style:'width:20%'},{text:'LOCATION / TRACK',style:'width:16%'},{text:'OPEN',style:'width:52px'}],
 rows.map(r=>'<tr>'+tableCell('<span class="mg-tag '+(r.kind==='horse'?'':'unrated')+'">'+h(r.kind.toUpperCase())+'</span>')+
  tableCell(linkRecord(r,r.name,r.kind==='horse'),'strong')+tableCell(h(r.detail||'—'))+
  tableCell(h(r.kind==='horse'?(r.owner_name||owner(r.name)):'—'),'dim')+
  tableCell(h(r.track||'—'),'dim')+tableCell(button('›','open',r.kind+'|'+r.name+'|'+(r.track||''),'mg-rowlink'),'numeric')+'</tr>'),'mg-search-table');
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
 const item=currentCase();if(!item)return empty('No current management decisions');
 const notes=(item.intel||[]).map(x=>'<div class="mg-intel-row"><b>'+h(x[0])+'</b><span>'+h(x[1])+'</span></div>').join('');
 return panel('Decision Desk','<div class="mg-case-top"><div class="mg-case-copy"><div class="mg-kicker mg-gold">'+h(item.type)+' · '+h(item.source)+'</div>'+
 '<h2>'+h(item.title)+'</h2><p>'+h(item.summary)+'</p><div class="mg-facts">'+[['PRESSURE',item.pressure],['PRIMARY RISK',item.risk],['MANAGER READ',item.read]].map(x=>'<span>'+h(x[0])+'<b>'+h(x[1])+'</b></span>').join('')+'</div></div>'+
 '<div class="mg-case-photo"><img src="'+h(item.image||'/assets/wtw-office-original-photo.jpg')+'" alt="Racing office editorial photograph"></div></div>'+
 '<div class="mg-case-choices">'+(item.moves||[]).map((m,i)=>button('<span>0'+(i+1)+' · '+h(m[2])+'</span><b>'+h(m[0])+'</b><small>'+h(m[1])+'</small>','choose',m[0],'mg-choice')).join('')+'</div>'+
 '<div style="display:grid;grid-template-columns:1fr 1fr">'+notes+'</div>','ACTIVE MANAGEMENT FILE');
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
 const roster=panel('Stable Roster',compactTable([{text:'HORSE'},{text:'OWNER'},{text:'STATUS'},{text:'RACE TARGET'},{text:'PROFILE'}],stableRows()),'OPEN ATHLETES');
 const decisions=caseDecision(),msgs=inboxView();
 const dates=$$('.fixtureList .fixture').slice(0,6).map(n=>'<tr>'+tableCell(h($('.d',n)?.textContent.trim()||'—'))+
  tableCell(h($('h4',n)?.textContent.trim()||'—'),'strong')+
  tableCell(h($('p',n)?.textContent.trim()||'—'),'dim')+'</tr>');
 const calendar=panel('Upcoming Racing',compactTable([{text:'DATE',style:'width:100px'},{text:'HORSE / EVENT'},{text:'TRACK & CONDITIONS'}],dates),button('FULL ↗','nav','racing'));
 const q=cases().length;
 return pageBar('Racing Office','DAILY MANAGEMENT · '+nowDate(),button('GLOBAL DIRECTORY','nav','search')+button('MY STABLE','nav','stable'))+
 '<div class="mg-content"><div class="mg-home-grid"><div class="mg-home-left">'+msgs+'</div><div class="mg-home-center">'+decisions+'</div><div class="mg-home-right">'+calendar+roster+'</div></div></div>';
}
function sourceProfile(){
 const doc=$('#routeBody .profilePage');if(!doc)return null;
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
function portrait(kind,name){
 // Prefer an explicitly approved actual photograph; badges are a fallback only.
 const source=sourceProfile();
 const img=$('.profileHero .profilePhoto img',source?.doc);
 const href=img?.getAttribute('src')||'';
 const fallback='/assets/profile-badges/v2/wtw_badge_'+(kind==='horse'?'horse':kind==='person'?'people':kind==='farm'?'farm_stable':'track')+'.png';
 return '<div class="mg-portrait '+(kind!=='horse'?'fallback':'')+'"><img src="'+h(href||fallback)+'" alt="'+h(name)+' profile image"></div>';
}
function identity(kind,name,record){
 const p=sourceProfile();const f=p?.fields||[];
 let origin=[],extras=[];
 if(kind==='horse'){
  const loc=[p?.doc?.dataset.foalingState,p?.doc?.dataset.foalingCountry].filter(known).join(', ');
  const born=srcValue(f,'Date of birth')||srcValue(f,'Born'),sex=srcValue(f,'Sex'),age=srcValue(f,'Age');
  origin=[sex?'Sex '+sex:'',age?'Age '+age:'',born?'Born '+born:'',loc?'Foaled '+loc:''].filter(Boolean);
  extras=p?.career?.slice(0,4)||[];
 }else{
  origin=[p?.sub,...f.slice(0,3).map(x=>x[0]+' '+x[1])].filter(Boolean);
  extras=p?.career?.slice(0,3)||[];
 }
 const connections=(p?.connections||[]).slice(0,2);
 return '<section class="mg-profile-identity">'+portrait(kind,name)+'<div class="mg-nameblock">'+
 '<div class="mg-kicker">'+h(kind.toUpperCase())+' PROFILE / CURRENT RACING UNIVERSE</div><h2>'+h(name)+'</h2>'+
 '<div class="mg-identity-meta">'+origin.map(x=>'<span>'+h(x)+'</span>').join('<span>·</span>')+'</div>'+
 '<div class="mg-id-stats">'+extras.map(x=>'<span>'+h(x[0])+' <b>'+h(x[1])+'</b></span>').join('')+'</div></div>'+
 connections.map(x=>'<div class="mg-id-connection"><small>'+h(x[0])+'</small><strong>'+h(x[1])+'</strong></div>').join('')+'</section>';
}
function observations(kind,name){
 const save=readState();
 return kind==='horse'?(save.scoutingState?.[name]?.attribute_observations||[]):(save.staffState?.[name]?.attribute_observations||[]);
}
function rating(def,obs){
 const valid=obs&&['estimated','measured'].includes(obs.status)&&obs.estimate!=null&&Array.isArray(obs.evidence_refs)&&obs.evidence_refs.length>0;
 const min=Number(obs?.scale_min),max=Number(obs?.scale_max),value=Number(obs?.estimate);
 const canBar=valid&&Number.isFinite(value)&&Number.isFinite(min)&&Number.isFinite(max)&&max>min;
 const percent=canBar?Math.max(0,Math.min(100,100*(value-min)/(max-min))):0;
 return '<div class="mg-attribute" title="'+h(def.meaning||'')+'"><span>'+h(def.label)+'</span>'+
 '<span class="mg-meter'+(canBar?'':' empty')+'">'+(canBar?'<i style="width:'+percent.toFixed(1)+'%"></i>':'')+'</span>'+
 '<strong class="'+(valid?'':'unknown')+'">'+(valid?h(obs.estimate+(obs.unit?' '+obs.unit:'')):'—')+'</strong></div>';
}
function horseProfile(name){
 const source=sourceProfile(),cat=ui.catalog?.horse_categories||{},reports=new Map((observations('horse',name)||[]).map(x=>[x.attribute_key,x]));
 const groups=['Speed & Pace','Surface & Environment','Physical & Biometric','Mental & Class'];
 const columns=groups.map(group=>{const defs=cat[group]||[];const count=defs.filter(x=>{const r=reports.get(x.key);return r&&r.estimate!=null&&r.evidence_refs?.length}).length;
 return panel(group,defs.length?'<div class="mg-attr-list">'+defs.map(x=>rating(x,reports.get(x.key))).join('')+'</div>':empty('Attribute definitions not loaded'),count+'/'+defs.length+' ASSESSED','mg-attributes')}).join('');
 const condition=(cat['Current Condition']||[]).map(x=>{const r=reports.get(x.key);const ok=r&&r.estimate!=null&&r.evidence_refs?.length;return '<div><span>'+h(x.label)+'</span><strong class="'+(ok?'':'unknown')+'">'+(ok?h(r.estimate):'—')+'</strong></div>'}).join('');
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
 return pageBar(name,'EVIDENCE-BASED ATHLETE DOSSIER',button('HISTORY','nav','history')+button('STABLE ROSTER','nav','stable'))+
 '<div class="mg-content"><div class="mg-profile-scroll">'+identity('horse',name)+
 '<div class="mg-profile-grid4">'+columns+'</div>'+
 '<div class="mg-profile-strip">'+condition+'</div>'+
 '<div class="mg-profile-grid5">'+career+current+plan+notes+people+'</div>'+
 '<div class="mg-profile-grid2">'+races+pedigree+'</div>'+
 '<div class="mg-overview-foot"><strong>SCOUTING COVERAGE</strong><span>'+knownN+' / '+Object.values(cat).flat().length+' evidenced attributes · Unassessed is not zero</span></div></div></div>';
}
function personProfile(name){
 const s=sourceProfile()||{career:[],states:[],notes:[],connections:[],fields:[]};const catalog=ui.catalog||{};
 const role=s.sub.replace(/^Job:\s*/i,'').toLowerCase();
 const key={'stable staff':'stable_staff','trainer':'trainer','jockey':'jockey','owner':'owner','breeder':'breeder','bloodstock':'bloodstock_professional','farm manager':'farm_manager','veterinarian':'veterinarian','groom':'groom','farrier':'farrier','exercise rider':'exercise_rider'}[role]||'stable_staff';
 const defs=(catalog.person_common||[]).concat(catalog.person_roles?.[key]||[]);
 const obs=new Map((observations('person',name)||[]).map(x=>[x.attribute_key,x]));
 const chunks=[defs.slice(0,Math.ceil(defs.length/3)),defs.slice(Math.ceil(defs.length/3),Math.ceil(defs.length*2/3)),defs.slice(Math.ceil(defs.length*2/3))];
 const columns='<div class="mg-person-columns">'+chunks.map((a,i)=>panel(['Professional','Judgment & Work','Specialties'][i],'<div class="mg-attr-list">'+a.map(x=>rating(x,obs.get(x.key))).join('')+'</div>','','mg-person-column')).join('')+'</div>';
 const work=readState().staffState?.[name]||{},rep=work.reputation_profile;
 const verified=rep?.schema==='WTW_PERSON_REPUTATION_V1'&&Array.isArray(rep.source?.refs)&&rep.source.refs.length&&Number.isFinite(rep.scores?.overall);
 const axes=(catalog.reputation?.axes||[]).map(x=>[x.label,verified&&rep.scores?.[x.key]!=null?rep.scores[x.key]:'—']);
 const reputation=panel('Reputation & Standing','<div class="mg-summary"><div class="mg-kicker">PROFESSIONAL STANDING</div><strong style="font-size:26px">'+(verified?h(rep.scores.overall)+' / 100':'UNRATED')+'</strong><br><span class="mg-muted">'+(verified?'Sourced professional assessment':'Not yet assessed · Trust is separate')+'</span></div>'+pairs(axes));
 const links=records().filter(x=>x.kind==='horse'&&s.notes.some(note=>note.includes(x.name)));
 const horses=links.length?compactTable([{text:'HORSE'},{text:'OWNER'},{text:'OPEN'}],links.map(x=>'<tr>'+tableCell(linkRecord(x,x.name,true))+tableCell(h(owner(x.name)))+tableCell(button('OPEN','open','horse|'+x.name+'|','mg-rowlink'))+'</tr>')):empty('No linked horses recorded in the current Office file.');
 const network=Array.isArray(work.relationship_reports)?work.relationship_reports.filter(x=>x.source_refs?.length):[];
 return pageBar(name,'PERSONNEL DOSSIER · '+(role||'STAFF'),button('PEOPLE DIRECTORY','nav','person'))+
 '<div class="mg-content"><div class="mg-profile-scroll">'+identity('person',name)+'<div class="mg-person-grid">'+panel('Professional Attributes',columns,defs.length+' DEFINED RATINGS')+reputation+'</div>'+
 '<div class="mg-person-bottom">'+panel('Current Horse Assignments',horses)+panel('Career & Background',pairs(s.fields.concat(s.career).slice(0,8)))+panel('Working Network',network.length?pairs(network.slice(0,6).map(x=>[x.counterpart_name||x.counterpart_id,String(x.score??'Unrated')])):empty('No evidenced working relationships yet.'))+'</div>'+
 '<div class="mg-overview-foot"><strong>PERSONNEL FILE</strong><span>All currently known career, professional and roster information is presented on the first screen</span></div></div></div>';
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
function department(view){
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
  if(['farm','track','race'].includes(route.type))return otherProfile(route.type,route.name);
 }
 if(ui.view==='search')return searchView();
 if(ui.view==='office')return home();
 return department(ui.view);
}
function render(){
 ui.renderCount++;
 const route=activeRoute();
 root.innerHTML=header()+sidebar()+'<main class="mg-main" aria-label="Management workspace">'+view()+'</main>';
 if(ui.filterFocus){
  const input=$('#mgSearch')||$('#mgTopSearch');if(input){input.focus();input.setSelectionRange(input.value.length,input.value.length)}
  ui.filterFocus=false;
 }
}
function goFromSearch(value){
 const [kind,name,track]=value.split('|');
 if(kind==='screen'){nav((allRecords().find(r=>r.kind==='screen'&&r.name===name)||{}).view||'office');return}
 openRecord(kind,name,track);
}
root.addEventListener('click',event=>{
 const el=event.target.closest('[data-mg]');if(!el)return;
 event.preventDefault();event.stopPropagation();
 const action=el.dataset.mg,value=el.dataset.value||'';
 if(action==='nav'){nav(value);return}
 if(action==='open'){goFromSearch(value);return}
 if(action==='case'){ui.caseId=value;const source=$('.app .msg[data-case="'+CSS.escape(value)+'"]');if(source)source.click();render();return}
 if(action==='choose'){const src=$$('.app [data-act]').find(x=>x.dataset.act==='Choose: '+value);if(src)src.click();setTimeout(render,60);return}
 if(action==='filter'){ui.type=value;render();return}
 if(action==='sort'){ui.sort=value;render();return}
 if(action==='continue'){sourceAction('Continue');setTimeout(render,100);return}
 if(action==='save'){sourceAction('Save');return}
 if(action==='back'){history.back();setTimeout(render,100);return}
 if(action==='forward'){history.forward();setTimeout(render,100);return}
});
root.addEventListener('input',event=>{
 if(!['search','topsearch'].includes(event.target.dataset.mgInput))return;
 ui.q=event.target.value;ui.view='search';ui.filterFocus=true;
 history.replaceState({mg:'search'},'',stateUrl('search'));
 render();
});
root.addEventListener('keydown',event=>{
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
 fetch('/assets/office/decision-photo-index.json').then(x=>x.ok?x.json():null).then(x=>{ui.photos=x})
]).then(render);
render();setTimeout(render,150);
window.__WTW_MANAGER_V2__={render,state:readState,records,ui,openRecord};
})();
