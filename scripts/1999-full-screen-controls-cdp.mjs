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
 // Verify ACTUAL record-row clicks on three different departments. List
 // Previous/Next must track the filtered/sorted visible row order and its
 // immutable source identities, never change a detail tab or the game clock.
 for(const specimen of [
  {section:'Personnel',page:'Trainers',family:'trainer'},
  {section:'Facilities',page:'Farms',family:'facility'},
  {section:'Tracks',page:'All Tracks',family:'track'}
 ]){
  const rail=await evaluate(`(()=>{const n=document.querySelector('#wtwNextgen .ng-game-rail [data-ng="menu"][data-val="${specimen.section}"]');if(!n)return false;n.click();return true})()`);
  assert.ok(rail,'Record browsing rail missing '+specimen.section);
  await ready(specimen.section,'Overview','Record browsing '+specimen.section);
  const tab=await evaluate(`(()=>{const s=document.querySelector('#wtwNextgen select[data-ng-select="department-tab"],#wtwNextgen select[data-ng-select="manager-screen"]');if(!s||![...s.options].some(o=>o.value===${JSON.stringify(specimen.page)}))return false;s.value=${JSON.stringify(specimen.page)};s.dispatchEvent(new Event('change',{bubbles:true}));return true})()`);
  assert.ok(tab,'Cannot select '+specimen.section+' / '+specimen.page);
  await ready(specimen.section,specimen.page,'Source-backed record list '+specimen.family);
  const visible=await evaluate(`(()=>[...document.querySelectorAll('#wtwNextgen .ng-rs-table tbody button[data-ng="dept-open"]')].map(b=>({name:b.textContent.trim(),index:b.dataset.val})))()`);
  assert.ok(visible.length>=2,'Need at least two real '+specimen.family+' rows to browse');
  const opened=await evaluate(`(()=>{const b=document.querySelector('#wtwNextgen .ng-rs-table tbody button[data-ng="dept-open"]');if(!b)return false;b.click();return true})()`);
  assert.ok(opened,'Cannot open first '+specimen.family+' record');
  const status=()=>evaluate(`(()=>{const a=window.__WTW_NEXT__?.app,r=document.getElementById('wtwNextgen');return {custom:a?.custom||'',family:a?.recordBrowse?.family||'',cursor:a?.recordBrowse?.index,total:a?.recordBrowse?.items?.length||0,items:a?.recordBrowse?.items?.map(x=>x.name)||[],date:r?.querySelector('.ng-global-date strong')?.textContent?.trim()||'',next:!!r?.querySelector('button[data-ng="dossier-entity-step"][data-val="1"]'),back:!!r?.querySelector('button[data-ng="dossier-entity-step"][data-val="-1"]'),recordBar:!!r?.querySelector('.ng-record-browse-bar,.ng-person-dossierbar')}})()`);
  let before=null;
  for(let retry=0;retry<90;retry++){
   before=await status();
   if(before?.family===specimen.family&&before.cursor===0&&before.next&&before.back&&before.recordBar)break;
   await delay(100);
  }
  assert.equal(before?.family,specimen.family,
   'Opening '+specimen.family+' from a visible roster failed to capture category: '+JSON.stringify(before));
  assert.ok(before.total>=2&&before.next&&before.back&&before.recordBar);
  assert.equal(before.date,baseline.date,'Opening '+specimen.family+' list moved the game clock');
  assert.equal(before.items[0],visible[0].name,
   'First '+specimen.family+' source row does not match the opened record');
  const stepped=await evaluate(`(()=>{const b=document.querySelector('#wtwNextgen button[data-ng="dossier-entity-step"][data-val="1"]');if(!b||b.disabled)return false;b.click();return true})()`);
  assert.ok(stepped,'NEXT missing from '+specimen.family+' source detail');
  let after=null;
  for(let retry=0;retry<90;retry++){
   after=await status();
   if(after?.cursor===1&&after.custom!==before.custom&&after.next&&after.back)break;
   await delay(100);
  }
  assert.equal(after?.cursor,1,'NEXT did not advance '+specimen.family+' list cursor: '+JSON.stringify(after));
  assert.notEqual(after.custom,before.custom,'NEXT opened the same '+specimen.family+' identity');
  assert.equal(after.date,baseline.date);
  const returned=await evaluate(`(()=>{const b=document.querySelector('#wtwNextgen button[data-ng="dossier-entity-step"][data-val="-1"]');if(!b||b.disabled)return false;b.click();return true})()`);
  assert.ok(returned,'PREVIOUS missing after '+specimen.family+' step');
  for(let retry=0;retry<90;retry++){
   after=await status();
   if(after?.cursor===0&&after.custom===before.custom)break;
   await delay(100);
  }
  assert.equal(after?.cursor,0,'PREVIOUS did not return to '+specimen.family+' list origin');
  assert.equal(after.custom,before.custom,'PREVIOUS returned to different source ID');
  console.log('WTW_LIST_ORIGIN_RECORD_BROWSE_PASS '+specimen.family+' '+before.total+' entries');
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
   worldTotal:screen?.querySelector('.ng-world-directory-pager')?.textContent?.match(/(\d+) RECORDS/)?.[1]||null,
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
  if(item.title==='World Overview'){
   // The full directory pages only visible DOM rows. Descending sort is
   // expected to expose different canonical IDs from the same full index.
   assert.equal(ascending.worldTotal,original.worldTotal);
   assert.equal(descending.worldTotal,original.worldTotal);
   for(const view of [original,ascending,descending]){
    assert.ok(view.names.length>0&&view.names.length<=100);
    assert.equal(view.sourceLinks.length,view.names.length);
    assert.ok(view.sourceLinks.every(id=>
     /^(?:horse|historical-horse|person|farm|track):[A-Za-z0-9-]+$/.test(id)),
     'World contains an unapproved or unstable record link');
   }
  }else{
   assert.deepEqual(ascending.sourceLinks.slice().sort(),original.sourceLinks.slice().sort(),
    'Sorting changed the source-linked record identities in '+item.title);
   assert.deepEqual(descending.sourceLinks.slice().sort(),original.sourceLinks.slice().sort(),
    'Reverse sorting changed the source-linked record identities in '+item.title);
  }
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
  {family:'TRACK',group:'track',route:'?ui=WorldRecord%3Atrack%3AT-0002',id:'T-0002'},
  {family:'TRAINER',group:'trainer',route:'?ui=FoundingProfile%3Aperson%3AP-000023',id:'P-000023'},
  {family:'JOCKEY',group:'jockey',route:'?ui=FoundingProfile%3Aperson%3AP-000053',id:'P-000053'},
  {family:'OWNER',group:'owner',route:'?ui=FoundingProfile%3Aownership%3AO-000014',id:'O-000014'},
  {family:'FACILITY',group:'facility',route:'?ui=FoundingProfile%3Afacility%3AO-FOUNDING-1999-013',id:'O-FOUNDING-1999-013'},
  {family:'FARM',group:'facility',route:'?ui=FoundingProfile%3Afacility%3AO-000061',id:'O-000061'},
  {family:'HORSE',group:'horse',route:'?ui=WorldRecord%3Ahorse%3AH-1992-000002',id:'H-1992-000002'}
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
   sourceRecord:decodeURIComponent(new URLSearchParams(location.search).get('ui')||''),
   date:root?.querySelector('.ng-global-date strong')?.textContent?.trim()||'',
   record:nav?.querySelector('.ng-person-dossierlabel small')?.textContent?.trim()||'',
   overview:overview?.getAttribute('aria-current')||'',
   history:history?.getAttribute('aria-current')||'',
   pager: [...(nav?.querySelectorAll('button[data-ng="dossier-entity-step"]')||[])].map(b=>({
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
   'Both shared previous/next ENTITY arrows must exist on '+item.family);
  assert.ok(original.pager.every(x=>x.enabled&&x.label&&x.title),
   'Both role-matched record arrows must be operable and accessible for '+item.family);
  assert.ok(original.pager[0].label.startsWith('Previous '+item.group+': '));
  assert.ok(original.pager[1].label.startsWith('Next '+item.group+': '));
  const firstNeighbor=original.pager[1].label.slice(('Next '+item.group+': ').length);
  // It must change the selected ENTITY, never cycle Overview into a detail
  // section of the same track/trainer/jockey/owner/facility/horse.
  async function stepProfile(direction){
   const activated=await evaluate(`(()=>{
    const button=document.querySelector('#wtwNextgen .ng-person-dossierbar [data-ng="dossier-entity-step"][data-val="${direction}"]');
    if(!button||button.disabled)return false;button.click();return true;
   })()`);
   assert.ok(activated,item.family+' entity arrow '+direction+' missing or disabled');
  }
  async function changedProfile(old,label){
   let candidate=null;
   for(let n=0;n<120;n++){
    candidate=await profileStatus();
    if(candidate?.ready&&candidate.record==='OVERVIEW'&&
      candidate.sourceRecord!==old.sourceRecord&&candidate.name!==old.name)return candidate;
    await delay(100);
   }
   throw Error('Entity arrow did not open a different '+label+': '+JSON.stringify(candidate));
  }
  async function sameProfile(old,label){
   let candidate=null;
   for(let n=0;n<120;n++){
    candidate=await profileStatus();
    if(candidate?.ready&&candidate.record==='OVERVIEW'&&
      candidate.sourceRecord===old.sourceRecord&&candidate.name===old.name)return candidate;
    await delay(100);
   }
   throw Error('Entity arrow did not return to same '+label+': '+JSON.stringify(candidate));
  }
  await stepProfile('1');
  const arrowNext=await changedProfile(original,item.family+' next record');
  assert.equal(item.family==='HORSE'?arrowNext.name.replace(/^\?/,''):arrowNext.name,firstNeighbor,
   'NEXT did not open the role-matched linked '+item.group+' promised in its label');
  assert.notEqual(arrowNext.sourceRecord,original.sourceRecord,
   'NEXT only changed the same entity tab on '+item.family);
  assert.equal(arrowNext.date,baseline.date);
  assert.equal(arrowNext.overview,'page');
  await stepProfile('-1');
  const arrowBack=await sameProfile(original,item.family+' previous record');
  assert.equal(arrowBack.name,original.name);
  await stepProfile('-1');
  const arrowPrev=await changedProfile(original,item.family+' wrap to previous record');
  assert.ok(arrowPrev.pager[1].label.startsWith('Next '+item.group+': '),
   'PREVIOUS crossed from '+item.group+' into another entity type');
  await stepProfile('1');
  const arrowRestored=await sameProfile(original,item.family+' wrap to original');
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
  console.log('WTW_PROFILE_CONTROLS_PASS '+item.family+' '+original.name+' '+deeper+' entity-arrows:'+firstNeighbor);
 }


 // Source-backed Office files: selecting a row previews it in place, while
 // only OPEN COMPLETE FILE enters the authoritative Today decision screen.
 const openInbox=await evaluate(`(()=>{
  const b=document.querySelector('#wtwNextgen .ng-game-rail [data-ng="custom"][data-val="Messages"]');
  if(!b)return false;b.click();return true;
 })()`);
 assert.equal(openInbox,true,'Office Inbox rail action missing');
 assert.equal((await ready('Office',null,'Office Inbox')).selected,'Messages');
 const officeInitial=await evaluate(`(()=>{
  const r=document.getElementById('wtwNextgen');
  const rows=[...r.querySelectorAll('.ng-manager-rows [data-ng="office-focus"]')];
  return {rows:rows.length,first:rows[0]?.dataset.val,second:rows[1]?.dataset.val,
   selected:rows.filter(x=>x.getAttribute('aria-pressed')==='true').map(x=>x.dataset.val),
   date:r.querySelector('.ng-global-date strong')?.textContent?.trim()};
 })()`);
 assert.ok(officeInitial.rows>=3&&officeInitial.second,'Inbox source files absent');
 assert.equal(officeInitial.selected.length,1,'Inbox has no unique selected file');
 const focusOffice=await evaluate(`(()=>{
  const b=[...document.querySelectorAll('#wtwNextgen .ng-manager-rows [data-ng="office-focus"]')][1];
  if(!b)return false;b.click();return true;
 })()`);
 assert.equal(focusOffice,true);
 assert.equal((await ready('Office',null,'Office preview after selection')).selected,'Messages');
 const preview=await evaluate(`(()=>{
  const r=document.getElementById('wtwNextgen'),app=window.__WTW_NEXT__.app;
  return {caseId:app.activeCase,
   selected:[...r.querySelectorAll('.ng-manager-rows [data-ng="office-focus"][aria-pressed="true"]')].map(b=>b.dataset.val),
   title:r.querySelector('.ng-office-file-preview h3')?.textContent?.trim(),
   summary:r.querySelector('.ng-office-file-preview p')?.textContent?.trim(),
   facts:r.querySelectorAll('.ng-office-file-facts dd').length,
   open:r.querySelector('.ng-office-open')?.dataset.val,
   date:r.querySelector('.ng-global-date strong')?.textContent?.trim()};
 })()`);
 assert.equal(preview.caseId,officeInitial.second,'Preview selection failed');
 assert.deepEqual(preview.selected,[officeInitial.second]);
 assert.equal(preview.open,officeInitial.second,'Full file button points to wrong case');
 assert.ok(preview.title&&preview.summary&&preview.facts>=2,'Source-backed case preview missing facts');
 assert.equal(preview.date,baseline.date,'Previewing an Office file advanced game date');
 const decisionSelect=await evaluate(`(()=>{
  const sel=document.querySelector('#wtwNextgen select[data-ng-select="manager-screen"]');
  if(!sel)return false;
  sel.value='Decisions';sel.dispatchEvent(new Event('change',{bubbles:true}));return true;
 })()`);
 assert.equal(decisionSelect,true,'Could not choose Decisions via standard VIEW');
 assert.equal((await ready('Office',null,'Office Decisions')).selected,'Decisions');
 const actions=await evaluate(`(()=>{
  const r=document.getElementById('wtwNextgen');
  return {statuses:[...r.querySelectorAll('.ng-manager-rows [data-ng="office-focus"]')].map(x=>x.querySelector('.ng-manager-row-type')?.textContent?.trim()),
   preview:!!r.querySelector('.ng-office-file-preview'),
   date:r.querySelector('.ng-global-date strong')?.textContent?.trim()};
 })()`);
 assert.ok(actions.statuses.length>0&&actions.statuses.length<officeInitial.rows,'Decisions still duplicates Inbox');
 assert.ok(actions.statuses.every(x=>x==='ACTION'),'Informational messages leaked into Decisions');
 assert.ok(actions.preview&&actions.date===baseline.date);
 const fileOpened=await evaluate(`(()=>{
  const b=document.querySelector('#wtwNextgen .ng-office-open');
  if(!b)return false;b.click();return true;
 })()`);
 assert.equal(fileOpened,true,'Open complete Office file control missing');
 await ready('Office','Office','Office complete case');
 assert.equal((await view()).date,baseline.date,'Opening full Office file advanced career');
 console.log('WTW_OFFICE_PREVIEW_PASS '+JSON.stringify({inbox:officeInitial.rows,actions:actions.statuses.length,date:baseline.date}));

 // Career dossier uses the real in-world appointment, save manager and
 // actionable Office case sources. Opening a case must not advance the date.
 const careerOpen=await evaluate(`(()=>{
  const b=document.querySelector('#wtwNextgen .ng-subnav [data-ng="tab"][data-val="Career"]');
  if(!b)return false;b.click();return true;
 })()`);
 assert.ok(careerOpen,'Career VIEW is absent on the canonical Office navigation');
 await ready('Office','Career','Career dossier');
 const career=await evaluate(`(()=>{
  const r=document.getElementById('wtwNextgen'),app=window.__WTW_NEXT__.app;
  return {
   custom:app.custom,date:r.querySelector('.ng-global-date strong')?.textContent?.trim(),
   title:r.querySelector('.ng-career-identity h3')?.textContent?.trim(),
   values:[...r.querySelectorAll('.ng-career-field strong')].map(x=>x.textContent.trim()),
   actionCount:r.querySelectorAll('.ng-career-attention-row').length,
   actionCase:r.querySelector('.ng-career-attention-row')?.dataset.val,
   manage:!!r.querySelector('[data-ng="commercial-career-open"]'),
   existingDesks:r.querySelectorAll('.ng-manager-career [data-ng="menu"]').length,
   sidebarIconOverlap:[...r.querySelectorAll('.ng-manager-career .ng-manager-case')].some(row=>
    row.children[0]?.getBoundingClientRect().right>row.children[1]?.getBoundingClientRect().left+1),
   note:r.querySelector('.ng-career-boundary')?.textContent?.trim(),
   identity:r.querySelector('.ng-career-identity')?.getBoundingClientRect().width,
   rail:r.querySelector('.ng-game-rail')?.getBoundingClientRect().width
  };
 })()`);
 assert.equal(career.custom,'Career');
 assert.equal(career.date,baseline.date,'Opening Career dossier advanced game date');
 assert.ok(career.identity>150&&career.rail>100,'Career identity does not fit in the actual manager shell');
 assert.ok(career.title&&career.values.length>=6,'Career dossier failed to display recorded fields');
 assert.ok(career.manage&&career.existingDesks>=3,'Career lost local saves or existing department controls');
 assert.equal(career.sidebarIconOverlap,false,'Career sidebar icon overlaps an action title');
 assert.match(career.note,/not invented/,'Missing-field disclosure removed from Career');
 assert.ok(career.actionCount>=1&&career.actionCase,'Opening review sources missing from active Career');
 const fromCareer=await evaluate(`(()=>{
  const b=document.querySelector('#wtwNextgen .ng-career-attention-row');
  if(!b)return false;b.click();return true;
 })()`);
 assert.ok(fromCareer,'Career recorded action does not open full case');
 await ready('Office','Office','Career action returns to Today');
 const today=await evaluate(`(()=>{
  const r=document.getElementById('wtwNextgen');
  return {date:r.querySelector('.ng-global-date strong')?.textContent?.trim(),
   priority:r.querySelector('.ng-feature .ng-headinggroup>span')?.textContent?.trim(),
   caseState:r.querySelector('.ng-main .ng-case-eyebrow')?.textContent?.trim()};
 })()`);
 assert.equal(today.date,baseline.date,'Reviewing career action advanced game time');
 assert.match(today.priority,/ACTION FILES.*FOLLOW-UPS DUE/,'Today lost current priority count');
 assert.match(today.caseState,/ACTION REQUIRED/,'Today did not visibly identify the selected action file');
 console.log('WTW_CAREER_DOSSIER_PASS '+JSON.stringify({fields:career.values.length,actionCount:career.actionCount,clock:today.date}));

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
