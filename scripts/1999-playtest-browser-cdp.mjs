#!/usr/bin/env node
/** Actual wall-clock Chromium browser automation using built-in Node 22 WebSocket.
 * Avoid --virtual-time-budget: virtual timers can finish before async IDB commits.
 * Tests the real /next/ site and one authoritative persisted game run.
 */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const delay=ms=>new Promise(r=>setTimeout(r,ms));
const browserUrl='http://127.0.0.1:8869/next/?playtest=38';
const port=9335,chrome=process.env.CHROME||'google-chrome';
const folder=mkdtempSync(join(tmpdir(),'wtw-1999-playtest-'));
const proc=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--disable-extensions','--no-first-run',
 '--no-default-browser-check','--remote-allow-origins=*',
 '--remote-debugging-port='+port,'--user-data-dir='+folder,browserUrl
],{stdio:'ignore'});
let ws=null;const pending=new Map();let seq=0;
try{
 let target=null;
 for(let i=0;i<100;i++){
  try{
   const rows=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
   target=rows.find(x=>x.type==='page'&&x.url.includes('/next/?playtest=38'));
   if(target)break;
  }catch{}
  await delay(200);
 }
 if(!target)throw Error('Chrome DevTools page target not found');
 ws=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 ws.addEventListener('message',event=>{
  let packet;try{packet=JSON.parse(event.data)}catch{return}
  if(!packet.id||!pending.has(packet.id))return;
  const {resolve,reject}=pending.get(packet.id);pending.delete(packet.id);
  if(packet.error)reject(Error(packet.error.message));
  else resolve(packet.result);
 });
 const command=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 await command('Runtime.enable');
 await command('Page.enable');
 const evaluate=async expression=>{
  const r=await command('Runtime.evaluate',{
   expression,returnByValue:true,awaitPromise:true});
  if(r.exceptionDetails)throw Error('Browser JavaScript exception '+JSON.stringify(r.exceptionDetails));
  return r.result.value;
 };
 const observe=()=>evaluate(`(()=>{
  const x=window.__WTW_1999_PLAYTEST__,ui=window.__WTW_1999_UI_DATA__;
  if(window.__WTW_1999_PLAYTEST_ERROR__)return {error:window.__WTW_1999_PLAYTEST_ERROR__};
  if(!x)return {loading:true,stage:window.__WTW_1999_PLAYTEST_LOADING__||null,ui:!!ui};
  const v=x.view(),race=v.races.filter(r=>r.status==='OFFICIAL_SIM_RESULT');
  return {ready:true,revision:v.revision,date:v.date,horseCount:v.horse_count,
   owned:v.stable.length,sourceHorses:ui?.counts?.horses||0,uiOwned:ui?.stableHorses?.length||0,
   jockeys:Object.keys(x.state.runtime.racing.jockeys).length,
   barns:Object.keys(x.state.runtime.facilities.sites).length,
   cash:v.finance.owner_cash_minor,starts:v.all_horses.filter(h=>h.career.starts>0).length,
   results:race.map(r=>({id:r.id,date:r.date,starters:r.results.length,
    winner:r.results[0].horse_id,purse:r.purse_minor}))};
 })()`);
 async function untilReady(label){
  let last=null;
  for(let i=0;i<100;i++){
   try{last=await observe()}catch(error){
    if(i<95){await delay(250);continue}
    throw error;
   }
   if(last?.error)throw Error('Browser game startup error: '+last.error);
   if(last?.ready)return last;
   await delay(250);
  }
  throw Error(label+' timed out: '+JSON.stringify(last));
 }
 const before=await untilReady('Initial 1999 playtest');
 assert.equal(before.date,'1999-01-01');
 assert.equal(before.horseCount,38);
 assert.equal(before.jockeys,26);
 assert.equal(before.barns,8);
 assert.equal(before.uiOwned,before.owned);
 const foundingBefore=await evaluate("localStorage.getItem('wtw1999FoundingStateV1')");
 await evaluate(`window.__WTW_1999_PLAYTEST__.submit('QUEUE_DECISION',{
  decision_id:'browser-training-review',option_ids:['rest','work'],
  context:{title:'Training review',option_labels:{rest:'Rest the horse',work:'Work the horse'}}
 },'system').then(()=>true)`);
 assert.equal(await evaluate(`(()=>{
  const root=document.getElementById('wtwNextgen');
  root.querySelector('[data-ng="case"][data-val="browser-training-review"]').click();
  const button=root.querySelector('[data-ng="answer-decision"][data-val="rest"]');
  if(!button?.textContent.includes('Rest the horse'))return false;
  button.click();
  return true;
 })()`),true);
 for(let i=0;i<100;i++){
  if(await evaluate("document.querySelector('.ng-resolution-title')?.textContent.includes('Rest the horse')"))break;
  await delay(100);
 }
 assert.equal(await evaluate("document.querySelector('.ng-resolution-title')?.textContent.trim()"),'Rest the horse');
 assert.equal(await evaluate("window.__WTW_1999_PLAYTEST__.state.decisions.resolved['browser-training-review']?.option_id"),'rest');
 await evaluate("window.__WTW_1999_PLAYTEST__.advanceTo('1999-01-16').then(()=>true)");
 const progressed=await untilReady('Game progression');
 assert.equal(progressed.date,'1999-01-16');
 assert.equal(progressed.results.length,3);
 assert.equal(progressed.starts,27);
 assert.equal(progressed.uiOwned,progressed.owned);
 // New document context reads back the same IDB record; no second run created.
 await command('Page.reload',{ignoreCache:true});
 const reloaded=await untilReady('IndexedDB reload');
 assert.deepEqual(reloaded,progressed);
 assert.equal(await evaluate("window.__WTW_1999_PLAYTEST__.state.decisions.resolved['browser-training-review'].option_id"),'rest');
 assert.equal(await evaluate("localStorage.getItem('wtw1999FoundingStateV1')"),foundingBefore);
 await command('Page.navigate',{url:'http://127.0.0.1:8869/next/'});
 let clean=null;
 for(let i=0;i<100;i++){
  try{
   clean=await evaluate(`({
    url:window.location.pathname+window.location.search,
    stable:window.__WTW_1999_UI_DATA__?.stableHorses?.length,
    sourceHorses:window.__WTW_1999_UI_DATA__?.counts?.horses,
    playtest:!!window.__WTW_1999_PLAYTEST__
   })`);
   if(clean.url==='/next/'&&Number.isInteger(clean.stable))break;
  }catch{}
  await delay(250);
 }
 assert.deepEqual(clean,{url:'/next/',stable:0,sourceHorses:0,playtest:false});
 // The visible compact save dialog writes to IndexedDB and can reload its
 // original founding date after a later Continue action.
 await evaluate(`document.querySelector('[data-ng="save-open"]').click()`);
 for(let i=0;i<100;i++){
  if(await evaluate("Boolean(document.querySelector('[data-cc-action=save]'))"))break;
  await delay(100);
 }
 await evaluate(`document.querySelector('[data-cc="save-name"]').value='Browser return point';
  document.querySelector('[data-cc-action="save"]').click()`);
 for(let i=0;i<100;i++){
  if(await evaluate("Boolean(document.querySelector('[data-cc-action=load]'))"))break;
  await delay(100);
 }
 assert.equal(await evaluate("document.querySelector('.wtw-cc-slot strong')?.textContent"),
  'Browser return point',await evaluate("document.querySelector('.wtw-cc-notice')?.textContent||'Compact Save did not respond'"));
 assert.equal(await evaluate(`(()=>{
  document.querySelector('[data-cc-action="close"]').click();
  document.querySelector('[data-ng="action"][data-val="Continue"]').click();
  return document.querySelector('.ng-global-date strong')?.textContent;
 })()`),'1999-01-02');
 await evaluate(`window.confirm=()=>true; document.querySelector('[data-ng="save-open"]').click()`);
 for(let i=0;i<100;i++){
  if(await evaluate("!document.getElementById('wtwCommercialCareerModal')?.hidden && Boolean(document.querySelector('[data-cc-action=load]'))"))break;
  await delay(100);
 }
 await evaluate(`document.querySelector('[data-cc-action="load"]').click()`);
 for(let i=0;i<100;i++){
  try{
   if(await evaluate("document.querySelector('.ng-global-date strong')?.textContent==='1999-01-01'"))break;
  }catch{}
  await delay(100);
 }
 assert.equal(await evaluate("document.querySelector('.ng-global-date strong')?.textContent"),'1999-01-01');
 assert.equal(await evaluate("window.WTWCompactCareerManager.listSlots().then(rows=>rows.length)"),1);
 console.log('WTW_BROWSER_PLAYTEST_PASS '+JSON.stringify({
  date:progressed.date,horseCount:progressed.horseCount,
  owned:progressed.owned,races:progressed.results,saveReload:'IDENTICAL',
  defaultFounding:'ZERO_RACEHORSES',decisionReload:'RECORDED',compactSaveLoad:'RESTORED'}));
}finally{
 try{ws?.close()}catch{}
 try{proc.kill('SIGTERM')}catch{}
 try{rmSync(folder,{recursive:true,force:true,maxRetries:10,retryDelay:150})}catch{}
}
