#!/usr/bin/env node
/** Wire to Wire interactive screen-family audit.
 * Walks the ACTUAL navigation rail and VIEW dropdowns for every 1999
 * department page in one Chromium process. Unlike static HTML inspection,
 * this confirms operating behavior and preserves the in-world game date.
 * History Archive is independently audited by desktop-visual-audit.sh.
 */
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';

const source=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const start=source.indexOf('const tabmap='),end=source.indexOf('\nconst actions=',start);
assert.ok(start>=0&&end>start);
const tabmap=vm.runInNewContext(source.slice(start,end)+'\ntabmap;');
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
const chrome=process.env.CHROME||'google-chrome';
const port=9363,url='http://127.0.0.1:8891/next/';
const profile=mkdtempSync(join(tmpdir(),'wtw-screen-matrix-'));
const server=spawn('python3',['-m','http.server','8891','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let proc=null,ws=null;
try {
 let serverUp=false;
 for(let i=0;i<75;i++){
  try{const r=await fetch(url);if(r.ok){serverUp=true;break}}catch{}
  await delay(150);
 }
 assert.ok(serverUp,'Source server did not start');
 proc=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions','--no-first-run',
  '--no-default-browser-check','--remote-allow-origins=*',
  '--window-size=1536,864','--remote-debugging-port='+port,
  '--user-data-dir='+profile,url
 ],{stdio:'ignore'});
 let tab=null;
 for(let i=0;i<110;i++){
  try {
   const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
   tab=pages.find(t=>t.type==='page'&&t.url.startsWith(url));
   if(tab)break;
  }catch{}
  if(proc.exitCode!==null)throw Error('Chromium stopped during screen audit startup');
  await delay(150);
 }
 assert.ok(tab,'Could not find game browser tab');
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((ok,fail)=>{
  ws.addEventListener('open',ok,{once:true});
  ws.addEventListener('error',fail,{once:true});
 });
 let seq=0;
 const pending=new Map();
 ws.addEventListener('message',event=>{
  let packet;try{packet=JSON.parse(event.data)}catch{return}
  if(!pending.has(packet.id))return;
  const {ok,fail}=pending.get(packet.id);pending.delete(packet.id);
  if(packet.error)fail(Error(packet.error.message));else ok(packet.result);
 });
 const command=(method,params={})=>new Promise((ok,fail)=>{
  const id=++seq;pending.set(id,{ok,fail});ws.send(JSON.stringify({id,method,params}));
 });
 await command('Runtime.enable');
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('Browser runtime error: '+JSON.stringify(r.exceptionDetails));
  return r.result.value;
 };
 const details=`(()=>{
  const app=window.__WTW_NEXT__?.app,root=document.getElementById('wtwNextgen');
  if(!app||!root?.querySelector('.ng-manager-shell'))return {ready:false};
  const selector=root.querySelector('select[data-ng-select="department-tab"],select[data-ng-select="manager-screen"]');
  const table=root.querySelector('.ng-rs-table');
  const scroller=root.querySelector('.ng-rs-scroll');
  return {ready:true,section:app.section,page:app.page,
   date:root.querySelector('.ng-global-date strong')?.textContent?.trim()||'',
   rail:!!root.querySelector('.ng-game-rail'),header:!!root.querySelector('.ng-global'),
   menu:selector?.dataset.ngSelect||null,
   selected:selector?.value||null,
   options:selector?[...selector.options].map(o=>o.value):[],
   roster:!!table,sortable:table?.querySelectorAll('thead button[data-ng]')?.length||0,
   scrollable:!!scroller&&scroller.tabIndex===0&&scroller.getAttribute('role')==='region',
   legacy:root.querySelectorAll('.ng-connected-profile,.ng-connected-drop,.ng-connected-table').length,
   numberOfRoots:document.querySelectorAll('#wtwNextgen').length,
   hiddenOffice:!!document.querySelector('.app[data-wtw-layout="legacy-data-bridge"][hidden]'),
   errors:window.__WTW_1999_PLAYTEST_ERROR__||null
  };
 })()`;
 const view=()=>evaluate(details);
 async function ready(section,page,where){
  let latest=null;
  for(let i=0;i<90;i++){
   latest=await view();
   if(latest?.ready&&latest.rail&&latest.header&&latest.hiddenOffice&&latest.numberOfRoots===1&&latest.date&&(!section||latest.section===section)&&(!page||latest.page===page))
    return latest;
   await delay(80);
  }
  throw Error(where+': game screen did not open; '+JSON.stringify(latest));
 }
 const baseline=await ready(null,null,'Initial Office');
 assert.ok(baseline.rail&&baseline.header&&baseline.hiddenOffice,'Initial game shell incomplete: '+JSON.stringify(baseline));
 assert.equal(baseline.numberOfRoots,1);
 let pageCount=0,tableCount=0;
 for(const [section,pages] of Object.entries(tabmap)){
  if(section==='History'||section==='Office')continue;
  const opened=await evaluate(`(()=>{
   const node=document.querySelector('#wtwNextgen .ng-game-rail [data-ng="menu"][data-val="${section}"]');
   if(!node)return false;node.click();return true;
  })()`);
  assert.ok(opened,'Department rail missing '+section);
  await ready(section,'Overview',section+' rail');
  for(const page of pages){
   let status=await ready(section,null,section+' screen');
   assert.ok(status.menu,'No usable VIEW dropdown on '+section+' / '+page);
   if(status.selected!==page){
    const changed=await evaluate(`(()=>{
     const selector=document.querySelector('#wtwNextgen select[data-ng-select="department-tab"],#wtwNextgen select[data-ng-select="manager-screen"]');
     if(!selector||![...selector.options].some(o=>o.value===${JSON.stringify(page)}))return false;
     selector.value=${JSON.stringify(page)};
     selector.dispatchEvent(new Event('change',{bubbles:true}));
     return true;
    })()`);
    assert.ok(changed,'VIEW dropdown could not select '+section+' / '+page);
   }
   status=await ready(section,page,section+' / '+page);
   assert.ok(status.rail&&status.header&&status.hiddenOffice);
   assert.equal(status.numberOfRoots,1);
   assert.equal(status.legacy,0);
   assert.equal(status.errors,null,'Game reported a command error on '+section+' / '+page);
   assert.equal(status.selected,page,'Wrong active VIEW state: '+section+' / '+page);
   assert.deepEqual(status.options,Array.from(pages),'VIEW options inconsistent on '+section+' / '+page);
   assert.equal(status.date,baseline.date,'Browsing a screen advanced the game clock');
   if(status.roster){
    assert.ok(status.sortable>=2,'Unsortable roster: '+section+' / '+page);
    assert.ok(status.scrollable,'Unreachable roster scroll: '+section+' / '+page);
    // Exercise a real header click, not merely the presence of a sort icon.
    // This toggles only the table projection; game time and source stay intact.
    const before=await evaluate(`(()=>{
     const b=document.querySelector('#wtwNextgen .ng-rs-table thead th button[data-ng]');
     if(!b)return null;const th=b.closest('th');
     const value={key:b.dataset.val,direction:th.getAttribute('aria-sort')};
     b.click();return value;
    })()`);
    assert.ok(before?.key,'Sortable header is not clickable: '+section+' / '+page);
    await ready(section,page,'Re-sort '+section+' / '+page);
    const after=await evaluate(`(()=>{
     const buttons=[...document.querySelectorAll('#wtwNextgen .ng-rs-table thead th button[data-ng]')];
     const b=buttons.find(x=>x.dataset.val===${JSON.stringify(before?.key)});
     return b?.closest('th')?.getAttribute('aria-sort')||null;
    })()`);
    assert.equal(after,before.direction==='ascending'?'descending':'ascending',
     'Sortable table failed to reverse its header direction: '+section+' / '+page);
    tableCount++;
    if(section==='Racing'&&page==='Calendar'){
     // Program-day cards have many tracks on the same date. The TRACK sort
     // must reverse the ACTUAL visible row order, not just its arrow.
     for(let press=0;press<2;press++){
      const toggled=await evaluate(`(()=>{
       const b=document.querySelector('#wtwNextgen .ng-rs-table thead button[data-ng="dept-sort"][data-val="track"]');
       if(!b)return false;b.click();return true;
      })()`);
      assert.ok(toggled,'Racing Calendar lost its TRACK sorting action');
      await ready(section,page,'Racing Track reverse sort');
     }
     const audit=await evaluate(`(()=>{
      const th=document.querySelector('#wtwNextgen .ng-rs-table thead button[data-val="track"]')?.closest('th');
      return {direction:th?.getAttribute('aria-sort')||null,
       tracks:[...document.querySelectorAll('#wtwNextgen .ng-rs-table tbody tr')]
        .map(row=>row.children[1]?.textContent?.trim()).filter(Boolean)};
     })()`);
     assert.equal(audit.direction,'descending','Racing track sort did not reverse');
     assert.ok(audit.tracks.length>=3,'Race day has too few source rows to verify track sorting');
     for(let i=1;i<audit.tracks.length;i++)
      assert.ok(audit.tracks[i-1].localeCompare(audit.tracks[i])>=0,
       'Track column claims descending while displayed races are not: '+audit.tracks[i-1]+' / '+audit.tracks[i]);
    }
   }
   pageCount++;
  }
  console.log('WTW_SCREEN_FAMILY_PASS '+section+' '+pages.length+' views');
 }
 // The Office home intentionally uses its approved compact horizontal quick-nav,
 // while its deeper pages use the same management VIEW menu as other departments.
 for(const page of Array.from(tabmap.Office)){
  const home=await evaluate(`(()=>{
   const b=document.querySelector('#wtwNextgen .ng-game-rail [data-ng="office"]');
   if(!b)return false;b.click();return true;
  })()`);
  assert.ok(home,'Office return control missing');
  await ready('Office','Office','Office overview');
  if(page!=='Overview'){
   const opened=await evaluate(`(()=>{
    const tab=[...document.querySelectorAll('#wtwNextgen .ng-subnav [data-ng="tab"]')]
     .find(n=>n.dataset.val===${JSON.stringify(page)});
    if(!tab)return false;tab.click();return true;
   })()`);
   assert.ok(opened,'Office quick-nav missing '+page);
   const state=page==='Calendar'?
    await ready('Racing','Overview','Office calendar to Racing'):
    await ready('Office',page,'Office / '+page);
   assert.equal(state.numberOfRoots,1);
   assert.equal(state.legacy,0);
   assert.equal(state.date,baseline.date);
   if(page!=='Calendar'){
    assert.equal(state.selected,page,'Office deep-view dropdown out of sync: '+page);
    assert.deepEqual(state.options,Array.from(tabmap.Office));
   }
  }else{
   const board=await evaluate("!!document.querySelector('#wtwNextgen .ng-board')");
   assert.ok(board,'Approved interactive Office dashboard is missing');
  }
  pageCount++;
 }
 console.log('WTW_SCREEN_FAMILY_PASS Office '+tabmap.Office.length+' views');

 // Check REAL information-panel sorting on all three shared manager families.
 // These are dense, source-linked record lists, not ornamental unclickable headers.
 const managerPanels=[
  {title:'World Overview',route:'?ui=World%20%E2%80%94%20Overview',cls:'ng-manager-screen'},
  {title:'World News',route:'?ui=World%20%E2%80%94%20News',cls:'ng-news-screen'},
  {title:'Opportunities',route:'?ui=Opportunities',cls:'ng-opportunity-screen'}
 ];
 const managerStatus=()=>evaluate(`(()=>{
  const root=document.getElementById('wtwNextgen');
  const screen=root?.querySelector('.ng-manager-screen');
  const scroller=screen?.querySelector('.ng-manager-rows');
  const nameHeader=screen?.querySelector('.ng-manager-columns [data-ng="manager-sort"][data-val="name"]');
  return {
   ready:!!screen&&!!scroller&&!!nameHeader,
   screen:screen?.className||'',
   date:root?.querySelector('.ng-global-date strong')?.textContent?.trim()||'',
   region:scroller?.getAttribute('role')||null,tabIndex:scroller?.tabIndex,
   order:nameHeader?.closest('[role="columnheader"]')?.getAttribute('aria-sort')||null,
   names:[...screen.querySelectorAll('.ng-manager-rows .ng-manager-row-name strong')]
    .map(x=>x.textContent.trim()),sourceLinks:[...screen.querySelectorAll('.ng-manager-rows .ng-manager-row')]
    .map(x=>x.dataset.val),
   legacy:screen?.querySelectorAll('.ng-connected-profile,.ng-connected-drop').length||0
  };
 })()`);
 const sortManagerName=()=>evaluate(`(()=>{
  const button=document.querySelector('#wtwNextgen .ng-manager-screen .ng-manager-columns [data-ng="manager-sort"][data-val="name"]');
  if(!button)return false;
  button.click();return true;
 })()`);
 async function managerReady(where,klass,direction){
  let last=null;
  for(let n=0;n<90;n++){
   try{
    last=await managerStatus();
    if(last?.ready&&last.screen.includes(klass)&&last.date===baseline.date&&
      (!direction||last.order===direction))return last;
   }catch{}
   await delay(100);
  }
  throw Error(where+' manager records unavailable: '+JSON.stringify(last));
 }
 for(const item of managerPanels){
  await command('Page.navigate',{url:'http://127.0.0.1:8891/next/'+item.route});
  const original=await managerReady(item.title,item.cls);
  assert.equal(original.region,'region','List not independently navigable in '+item.title);
  assert.equal(original.tabIndex,0,'Scroll needs keyboard focus in '+item.title);
  assert.equal(original.legacy,0);
  assert.equal(original.order,'none','The previously approved row order changed by default in '+item.title);
  assert.ok(await sortManagerName(),'NAME is not a working sort header in '+item.title);
  const ascending=await managerReady(item.title+' ascending',item.cls,'ascending');
  assert.ok(await sortManagerName(),'NAME cannot reverse its sort in '+item.title);
  const descending=await managerReady(item.title+' descending',item.cls,'descending');
  assert.equal(ascending.names.length,original.names.length);
  assert.equal(descending.names.length,original.names.length);
  assert.deepEqual(ascending.sourceLinks.slice().sort(),original.sourceLinks.slice().sort(),
   'Sorting changed the source-linked record identities in '+item.title);
  assert.deepEqual(descending.sourceLinks.slice().sort(),original.sourceLinks.slice().sort(),
   'Reverse sorting changed the source-linked record identities in '+item.title);
  const cmp=(a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'});
  if(original.names.length>=2){
   assert.deepEqual(ascending.names,ascending.names.slice().sort(cmp),
    'NAME claims ascending but visible data is unsorted in '+item.title);
   assert.deepEqual(descending.names,descending.names.slice().sort((a,b)=>-cmp(a,b)),
    'NAME claims descending but visible data is unsorted in '+item.title);
  }
  console.log('WTW_MANAGER_INFO_SORT_PASS '+item.title+' '+original.names.length+' source records');
 }

 // Exercise actual in-game profile navigation, not merely the presence
 // of Overview / History / MORE RECORDS. Every family must retain one identity
 // and date while its record selector changes the visible content.
 await command('Page.enable');
 const profiles=[
  {family:'TRACK',route:'?ui=WorldRecord%3Atrack%3AT-0002',id:'T-0002'},
  {family:'PERSON',route:'?ui=WorldRecord%3Aperson%3AP-000018',id:'P-000018'},
  {family:'OWNER',route:'?ui=FoundingProfile%3Aownership%3AO-000014',id:'O-000014'},
  {family:'FARM',route:'?ui=FoundingProfile%3Afacility%3AO-000061',id:'O-000061'},
  {family:'HORSE',route:'?page=horse&name=The+Last+Match',id:null}
 ];
 const profileStatus=()=>evaluate(`(()=>{
  const root=document.getElementById('wtwNextgen');
  const nav=root?.querySelector('.ng-route-profile .ng-person-dossierbar');
  const name=root?.querySelector('.ng-route-profile .ng-profile-identity h2')?.textContent?.trim()||'';
  const select=nav?.querySelector('select[data-ng-select="profile-record"]');
  const history=nav?.querySelector('[data-ng="detailtab"][data-val="History"]');
  const overview=nav?.querySelector('[data-ng="detailtab"][data-val="Overview"]');
  return {ready:!!nav&&!!name&&!!select&&!!history&&!!overview,
   name,identity:root?.getAttribute('data-wtw-identity')||'',
   sourceRecord:new URLSearchParams(location.search).get('ui')||'',
   date:root?.querySelector('.ng-global-date strong')?.textContent?.trim()||'',
   record:nav?.querySelector('.ng-person-dossierlabel small')?.textContent?.trim()||'',
   overview:overview?.getAttribute('aria-current')||'',
   history:history?.getAttribute('aria-current')||'',
   pager: [...(nav?.querySelectorAll('button[data-ng="profile-step"]')||[])].map(b=>({
    step:b.dataset.val,label:b.getAttribute('aria-label')||'',enabled:!b.disabled,
    title:b.title||''
   })),
   options:select?[...select.options].map(x=>x.value):[],
   selected:select?.value||'',hasStakes:!!root?.querySelector('.ng-track-stakes .ng-stakes-table'),
   hasMeet:!!root?.querySelector('.ng-track-info-stack .ng-track-meet-card'),
   hasTrackHistory:!!root?.querySelector('.ng-track-info-stack .ng-track-history-card'),
   legacy:root?.querySelectorAll('.ng-connected-profile,.ng-connected-drop,.ng-connected-table').length||0,
   roots:document.querySelectorAll('#wtwNextgen').length,
   oldOfficeHidden:!!document.querySelector('.app[data-wtw-layout="legacy-data-bridge"][hidden]')
  };
 })()`);
 async function profileReady(where,expectedRecord=null){
  let found=null;
  for(let n=0;n<120;n++){
   try{
    found=await profileStatus();
    if(found?.ready&&(!expectedRecord||found.record===expectedRecord))return found;
   }catch{}
   await delay(100);
  }
  throw Error('Profile did not open in '+where+': '+JSON.stringify(found));
 }
 for(const item of profiles){
  await command('Page.navigate',{url:'http://127.0.0.1:8891/next/'+item.route});
  const original=await profileReady(item.family+' overview','OVERVIEW');
  assert.equal(original.date,baseline.date,'Opening '+item.family+' changed career date');
  assert.equal(original.overview,'page',item.family+' overview is not selected');
  assert.equal(original.roots,1,'A second game UI opened in '+item.family);
  assert.equal(original.legacy,0,'Old pilot profiles came back in '+item.family);
  assert.equal(original.oldOfficeHidden,true);
  if(item.id)assert.ok(original.sourceRecord.endsWith(':'+item.id),
   'Opened the wrong canonical '+item.family+' source ID: '+original.sourceRecord);
  // A profile without approved person art has no theme key, by design.
  // If a theme exists, it must never belong to a different entity.
  if(item.family==='TRACK')assert.equal(original.identity,item.id,'Wrong approved track logo/theme');
  else if(item.id&&original.identity)assert.equal(original.identity,item.id,'Wrong '+item.family+' logo/theme');
  const deeper=original.options.find(x=>x&&x!=='Overview'&&x!=='History');
  assert.ok(deeper,item.family+' has no deeper record view');
  assert.deepEqual(original.pager.map(x=>x.step),['-1','1'],
   'Both adjacent dossier arrows must exist on '+item.family);
  assert.ok(original.pager.every(x=>x.enabled&&x.label&&x.title),
   'Local arrows require active keyboard-accessible labels and tooltips');
  // The shared arrow pair cycles canonical dossier views. NEXT from Overview
  // must open the first deeper record; PREVIOUS returns to Overview. PREVIOUS
  // from Overview wraps to History, and NEXT returns to Overview.
  async function stepProfile(direction){
   const found=await evaluate(`(()=>{
    const button=document.querySelector('#wtwNextgen .ng-person-dossierbar [data-ng="profile-step"][data-val="${direction}"]');
    if(!button||button.disabled)return false;button.click();return true;
   })()`);
   assert.ok(found,item.family+' local '+direction+' arrow missing or nonfunctional');
  }
  await stepProfile('1');
  const arrowNext=await profileReady(item.family+' next arrow',deeper.toUpperCase());
  assert.equal(arrowNext.selected,deeper,'NEXT did not actually open the first deeper '+item.family+' view');
  assert.equal(arrowNext.identity,original.identity);
  assert.equal(arrowNext.date,baseline.date);
  await stepProfile('-1');
  const arrowBack=await profileReady(item.family+' previous arrow','OVERVIEW');
  assert.equal(arrowBack.overview,'page');
  assert.equal(arrowBack.name,original.name);
  await stepProfile('-1');
  const arrowWrapped=await profileReady(item.family+' wrap to History','HISTORY');
  assert.equal(arrowWrapped.history,'page');
  await stepProfile('1');
  const arrowRestored=await profileReady(item.family+' wrap to Overview','OVERVIEW');
  assert.equal(arrowRestored.name,original.name);
  assert.equal(arrowRestored.sourceRecord,original.sourceRecord);
  assert.equal(arrowRestored.date,baseline.date);
  if(item.family==='TRACK'){
   assert.ok(original.hasStakes&&original.hasMeet&&original.hasTrackHistory,
    'The approved left stakes / right Meet and History track layout was replaced');
  }
  const openedHistory=await evaluate(`(()=>{
   const button=document.querySelector('#wtwNextgen .ng-person-dossierbar [data-ng="detailtab"][data-val="History"]');
   if(!button)return false;button.click();return true;
  })()`);
  assert.equal(openedHistory,true,'HISTORY control missing in '+item.family);
  const history=await profileReady(item.family+' history','HISTORY');
  assert.equal(history.history,'page',item.family+' history is not active after clicking');
  assert.equal(history.name,original.name,'Identity changed when opening '+item.family+' history');
  assert.equal(history.identity,original.identity);
  assert.equal(history.sourceRecord,original.sourceRecord);
  assert.equal(history.date,baseline.date);

  const choose=await evaluate(`(()=>{
   const select=document.querySelector('#wtwNextgen .ng-person-dossierbar select[data-ng-select="profile-record"]');
   if(!select||![...select.options].some(x=>x.value===${JSON.stringify(deeper)}))return false;
   select.value=${JSON.stringify(deeper)};
   select.dispatchEvent(new Event('change',{bubbles:true}));
   return true;
  })()`);
  assert.equal(choose,true,'MORE RECORDS did not accept '+deeper+' in '+item.family);
  const record=await profileReady(item.family+' '+deeper,deeper.toUpperCase());
  assert.equal(record.selected,deeper,'MORE RECORDS selected the wrong view in '+item.family);
  assert.equal(record.name,original.name);
  assert.equal(record.identity,original.identity);
  assert.equal(record.sourceRecord,original.sourceRecord);
  assert.equal(record.date,baseline.date);
  const returnHome=await evaluate(`(()=>{
   const button=document.querySelector('#wtwNextgen .ng-person-dossierbar [data-ng="detailtab"][data-val="Overview"]');
   if(!button)return false;button.click();return true;
  })()`);
  assert.equal(returnHome,true,'OVERVIEW control missing after '+deeper+' in '+item.family);
  const restored=await profileReady(item.family+' restored overview','OVERVIEW');
  assert.equal(restored.overview,'page');
  assert.equal(restored.identity,original.identity);
  assert.equal(restored.sourceRecord,original.sourceRecord);
  assert.equal(restored.name,original.name);
  assert.equal(restored.date,baseline.date);
  if(item.family==='TRACK')assert.ok(restored.hasStakes&&restored.hasMeet&&restored.hasTrackHistory,
   'Returning to track overview lost its approved full stadium layout');
  console.log('WTW_PROFILE_CONTROLS_PASS '+item.family+' '+original.name+' '+deeper+' local-arrows:forward/back/wrap');
 }

 // Global Search is a full-height source-linked directory. Verify the actual
 // controls update the row order, do not mutate the career, and scroll with
 // keyboard focus. This catches decorative sort buttons and clipped previews.
 await evaluate(`(()=>{
  window.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true}));
  return true;
 })()`);
 const searchStatus=()=>evaluate(`(()=>{
  const root=document.getElementById('wtwNextgen');
  const body=root?.querySelector('#ngSearchResults');
  const buttons=[...(root?.querySelectorAll('.ng-search-sort')||[])];
  return {ready:!!root?.querySelector('.ng-search-roster-page')&&!!body&&buttons.length===3,
   date:root?.querySelector('.ng-global-date strong')?.textContent?.trim()||'',
   rows:[...(body?.querySelectorAll('.ng-search-row')||[])].map(row=>({
    name:row.querySelector('.ng-search-row-name strong')?.textContent?.trim()||'',
    owner:row.querySelector('.ng-search-row-owner')?.textContent?.trim()||''
   })),
   bodyFocus:body?.tabIndex===0&&body?.getAttribute('role')==='region',
   scrollTop:body?.scrollTop||0,scrollHeight:body?.scrollHeight||0,clientHeight:body?.clientHeight||0,
   sort:buttons.map(b=>({key:b.dataset.val,pressed:b.getAttribute('aria-pressed'),arrow:b.querySelector('i')?.textContent?.trim()})),
   legacy:root?.querySelectorAll('.ng-connected-profile,.ng-connected-drop,.ng-connected-table').length||0
  };
 })()`);
 let initialSearch=null;
 for(let n=0;n<90;n++){
  initialSearch=await searchStatus();
  if(initialSearch?.ready&&initialSearch.rows.length>0)break;
  await delay(100);
 }
 assert.ok(initialSearch?.ready&&initialSearch.rows.length>0,
  'Global Search failed to open from the standard Ctrl+K shortcut');
 assert.ok(initialSearch.bodyFocus,'Global Search results are not keyboard-focusable');
 assert.equal(initialSearch.legacy,0);
 assert.equal(initialSearch.date,baseline.date,'Opening Global Search advanced the career');
 assert.ok(initialSearch.rows.length>=10,'Global Search unexpectedly lost the source-linked directory');
 async function sortSearch(field){
  const changed=await evaluate(`(()=>{
   const b=document.querySelector('#wtwNextgen .ng-search-sort[data-val="${field}"]');
   if(!b)return false;b.click();return true;
  })()`);
  assert.ok(changed,'Global Search missing sort control '+field);
  await delay(80);
  return searchStatus();
 }
 const descSearch=await sortSearch('name');
 assert.equal(descSearch.sort.find(x=>x.key==='name')?.arrow,'▼','Name sort did not reverse');
 for(let i=1;i<descSearch.rows.length;i++)
  assert.ok(descSearch.rows[i-1].name.localeCompare(descSearch.rows[i].name,undefined,
   {numeric:true,sensitivity:'base'})>=0,'Search results claim DESC but names are not reversed');
 const ascSearch=await sortSearch('name');
 assert.equal(ascSearch.sort.find(x=>x.key==='name')?.arrow,'▲');
 for(let i=1;i<ascSearch.rows.length;i++)
  assert.ok(ascSearch.rows[i-1].name.localeCompare(ascSearch.rows[i].name,undefined,
   {numeric:true,sensitivity:'base'})<=0,'Search results claim ASC but names are not sorted');
 for(const field of ['type','owner']){
  const ascending=await sortSearch(field);
  assert.equal(ascending.sort.find(x=>x.key===field)?.arrow,'▲',field+' did not activate');
  const descending=await sortSearch(field);
  assert.equal(descending.sort.find(x=>x.key===field)?.arrow,'▼',field+' did not reverse');
  assert.equal(descending.date,baseline.date);
 }
 const scrollBefore=await searchStatus();
 if(scrollBefore.scrollHeight>scrollBefore.clientHeight+10){
  const scrolled=await evaluate(`(()=>{
   const region=document.querySelector('#ngSearchResults');
   region.focus();region.scrollTop=region.scrollHeight;
   return {focused:document.activeElement===region,scrollTop:region.scrollTop};
  })()`);
  assert.ok(scrolled.focused&&scrolled.scrollTop>0,
   'Global Search long list cannot be independently focused/scrolled');
 }
 console.log('WTW_GLOBAL_SEARCH_CONTROLS_PASS '+JSON.stringify({
  visibleRows:initialSearch.rows.length,sortDirections:6,
  independentlyScrollable:scrollBefore.scrollHeight>scrollBefore.clientHeight+10,
  date:baseline.date
 }));

 // History is an independently routed Archive but remains part of the product.
 // Verify every canonical History category without moving it into /next/ or
 // reviving obsolete Office/Manager windows.
 const archiveCodes=['races','horses','people','tracks','seasons','sources'];
 assert.equal(archiveCodes.length,tabmap.History.length);
 for(const code of archiveCodes){
  await command('Page.navigate',{url:'http://127.0.0.1:8891/archive/?page='+code});
  let passed=false,last=null;
  for(let retry=0;retry<120;retry++){
   try{
    last=await evaluate(`({
      path:location.pathname,category:new URLSearchParams(location.search).get('page'),
      currentNav:document.querySelector('.side-nav [aria-current="page"]')?.dataset.page||null,
      loaded:!!document.querySelector('#app')&&
        !document.querySelector('#app .loading')&&!!document.querySelector('#app').textContent.trim(),
      recordLedger:!!document.querySelector('#app .history-ledger-table')
    })`);
    if(last?.path==='/archive/'&&last.category===code&&last.currentNav===code&&
      last.loaded&&(code!=='races'||last.recordLedger)){passed=true;break}
   }catch{}
   await delay(80);
  }
  assert.ok(passed,'Historical Archive route failed '+code+': '+JSON.stringify(last));
  pageCount++;
 }
 console.log('WTW_SCREEN_FAMILY_PASS History '+archiveCodes.length+' views');
 assert.ok(pageCount>=67,'The accepted Office + department + History screen inventory was reduced');
 assert.ok(tableCount>=18,'Full sortable roster family coverage unexpectedly missing');
 console.log('WTW_SCREEN_MATRIX_PASS '+JSON.stringify({
  individualViews:pageCount,sortableScrollableTableViews:tableCount,
  profileFamiliesWithWorkingControls:profiles.length,
  sortableManagerInformationScreens:managerPanels.length,
  date:baseline.date,oneUI:true,menuConsistency:true,sections:Object.keys(tabmap).length
 }));
}finally {
 try{ws?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 try{server.kill('SIGTERM')}catch{}
 await delay(300);
 rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:150});
}
