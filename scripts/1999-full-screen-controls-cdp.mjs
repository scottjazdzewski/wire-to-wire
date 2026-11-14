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

 // History is an independently routed Archive but remains part of the product.
 // Verify every canonical History category without moving it into /next/ or
 // reviving obsolete Office/Manager windows.
 await command('Page.enable');
 const archiveCodes=['races','horses','people','tracks','seasons','sources'];
 assert.equal(archiveCodes.length,tabmap.History.length);
 for(const code of archiveCodes){
  await command('Page.navigate',{url:'http://127.0.0.1:8891/archive/?page='+code});
  let passed=false,last=null;
  for(let retry=0;retry<120;retry++){
   try{
    last=await evaluate(`({
      path:location.pathname,category:new URLSearchParams(location.search).get('page'),
      vault:document.body?.textContent?.includes('History Vault')||false
    })`);
    if(last?.path==='/archive/'&&last.category===code&&last.vault){passed=true;break}
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
  date:baseline.date,oneUI:true,menuConsistency:true,sections:Object.keys(tabmap).length
 }));
}finally {
 try{ws?.close()}catch{}
 try{proc?.kill('SIGTERM')}catch{}
 try{server.kill('SIGTERM')}catch{}
 await delay(300);
 rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:150});
}
