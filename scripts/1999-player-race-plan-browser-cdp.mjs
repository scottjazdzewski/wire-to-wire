#!/usr/bin/env node
/** Real browser owner racing controls: select horse/race/jockey, confirm,
 * verify one actual IndexedDB transaction, reload and check canonical state.
 */
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import assert from 'node:assert/strict';
const wait=ms=>new Promise(done=>setTimeout(done,ms));
const port=9337,chrome=process.env.CHROME||'google-chrome';
const folder=mkdtempSync(join(tmpdir(),'wtw-player-race-'));
const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
 '--disable-dev-shm-usage','--disable-background-networking','--disable-extensions',
 '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
 '--remote-debugging-port='+port,'--user-data-dir='+folder,
 'http://127.0.0.1:8869/next/?playtest=38'],{stdio:'ignore'});
let socket=null,serial=0;const inflight=new Map();
try{
 let target=null;
 for(let i=0;i<100;i++){
  try{
   const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
   target=pages.find(p=>p.type==='page'&&p.url.includes('/next/?playtest=38'));
   if(target)break;
  }catch{}
  await wait(200);
 }
 assert.ok(target,'No playable 1999 Chromium target');
 socket=new WebSocket(target.webSocketDebuggerUrl);
 await new Promise((yes,no)=>{
  socket.addEventListener('open',yes,{once:true});
  socket.addEventListener('error',no,{once:true});
 });
 socket.addEventListener('message',e=>{
  let data;try{data=JSON.parse(e.data)}catch{return}
  const p=inflight.get(data.id);if(!p)return;inflight.delete(data.id);
  if(data.error)p.reject(Error(data.error.message));else p.resolve(data.result);
 });
 const call=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++serial;inflight.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 await call('Runtime.enable');await call('Page.enable');
 const evalJS=async expression=>{
  const result=await call('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(result.exceptionDetails)throw Error('Browser evaluation: '+JSON.stringify(result.exceptionDetails));
  return result.result.value;
 };
 const until=async(fn,description)=>{
  let current;
  for(let i=0;i<140;i++){
   try{current=await evalJS(fn)}catch(error){
    if(i>134)throw error;await wait(175);continue;
   }
   if(current?.error)throw Error(description+': '+current.error);
   if(current?.ready)return current;
   await wait(175);
  }
  throw Error(description+' timed out: '+JSON.stringify(current));
 };
 await until(`(()=>{
  if(window.__WTW_1999_PLAYTEST_ERROR__)
   return {error:window.__WTW_1999_PLAYTEST_ERROR__};
  return {ready:!!window.__WTW_1999_PLAYTEST__&&
   !!window.WTW1999PlayerRacePlans&&!!window.__WTW_NEXT__};
 })()`,'Game and Race Planning controller');
 await evalJS(`window.__WTW_1999_PLAYTEST__.advanceTo('1999-01-02').then(()=>true)`);
 const prepared=await evalJS(`(()=>{
  const game=window.__WTW_1999_PLAYTEST__;
  for(const horse of game.view().stable){
   const races=game.getRaceOpportunities(horse.horse_id,{includeProposals:false}).rows;
   for(const race of races.filter(r=>r.status==='PLAYER_CAN_ENTER')){
    for(const j of race.available_jockeys.filter(j=>j.owner_can_pay)){
     const payload={horse_id:horse.horse_id,race_id:race.race_id,jockey_id:j.jockey_id};
     const quote=game.getRacePlanQuote(payload);
     if(quote.can_confirm)return {horse_id:horse.horse_id,horse_name:horse.name,
      race_id:race.race_id,jockey_id:j.jockey_id,quote};
    }
   }
  }
  return null;
 })()`);
 assert.ok(prepared,'Real local player-owned race booking opportunity available');
 await evalJS(`(()=>{
  const nav=document.querySelector('#wtwNextgen [data-ng="menu"][data-val="Racing"]');
  if(!nav)throw Error('Racing navigation missing from approved menu');
  nav.click();
  return true;
 })()`);
 await until(`(()=>{
  const app=window.__WTW_NEXT__;
  return {ready:app?.app?.section==='Racing'&&
   !!document.querySelector('#wtwNextgen select[data-ng-select="department-tab"]')};
 })()`,'Racing department loaded');
 await evalJS(`(()=>{
  const tab=document.querySelector('#wtwNextgen select[data-ng-select="department-tab"]');
  tab.value='Race Planning';tab.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
 })()`);
 await until(`(()=>({ready:!!document.querySelector('#wtwNextgen .ng-race-plan-workspace select[data-ng-select="race-plan-horse"]')}))()`,
  'Existing Racing planning panel rendered');
 const showHorse=await evalJS(`(()=>{
  const h=document.querySelector('#wtwNextgen [data-ng-select="race-plan-horse"]');
  h.value=${JSON.stringify(prepared.horse_id)};h.dispatchEvent(new Event('change',{bubbles:true}));
  const r=document.querySelector('#wtwNextgen [data-ng-select="race-plan-race"]');
  if(!r)return false;
  r.value=${JSON.stringify(prepared.race_id)};
  r.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
 })()`);
 assert.equal(showHorse,true);
 await until(`(()=>{
  const jockey=document.querySelector('#wtwNextgen select[data-ng-select="race-plan-jockey"]');
  return {ready:!!jockey&&jockey.options.length>0};
 })()`,'Accepting jockey selection');
 await evalJS(`(()=>{
  const j=document.querySelector('#wtwNextgen [data-ng-select="race-plan-jockey"]');
  j.value=${JSON.stringify(prepared.jockey_id)};
  j.dispatchEvent(new Event('change',{bubbles:true}));
  return true;
 })()`);
 const prior=await evalJS(`(()=>{
  const game=window.__WTW_1999_PLAYTEST__;
  const p=${JSON.stringify(prepared)};
  const quote=game.getRacePlanQuote({
   horse_id:p.horse_id,race_id:p.race_id,jockey_id:p.jockey_id});
  return {quote,ledger:game.state.runtime.finances.ledger.length,
   cash:game.state.runtime.finances.operation_balances_minor[game.state.player.operation_id]};
 })()`);
 assert.equal(prior.quote.can_confirm,true);
 assert.equal(prior.quote.immediate_total_minor,prepared.quote.immediate_total_minor);
 const buttonReady=await evalJS(`(()=>{
  const b=document.querySelector('#wtwNextgen [data-ng="race-plan-confirm"]');
  return Boolean(b&&!b.disabled&&b.textContent.includes('CONFIRM ENTRY'));
 })()`);
 assert.equal(buttonReady,true,'Owner sees enabled confirmation with exact cost');
 await evalJS(`(()=>{
  window.confirm=()=>true;
  document.querySelector('#wtwNextgen [data-ng="race-plan-confirm"]').click();
  return true;
 })()`);
 const after=await until(`(()=>{
  const g=window.__WTW_1999_PLAYTEST__;
  const p=${JSON.stringify(prepared)},e=g?.state.runtime.entries?.[p.race_id+':'+p.horse_id];
  if(window.__WTW_1999_PLAYTEST_ERROR__)return {error:window.__WTW_1999_PLAYTEST_ERROR__};
  return {ready:e?.status==='BOOKED',jockey:e?.jockey_id,
   cash:g?.state.runtime.finances.operation_balances_minor[g.state.player.operation_id],
   ledger:g?.state.runtime.finances.ledger.length,
   revision:g?.state.revision,
   saved:g?.getSave()};
 })()`,'Actual player entry / mount and payment completed');
 assert.equal(after.jockey,prepared.jockey_id);
 assert.equal(after.cash,prior.cash-prepared.quote.immediate_total_minor);
 assert.equal(after.ledger,prior.ledger+2,'One debit and corresponding jockey receipt, no duplicate');
 await call('Page.reload',{ignoreCache:true});
 const restored=await until(`(()=>{
  const g=window.__WTW_1999_PLAYTEST__,p=${JSON.stringify(prepared)};
  const entry=g?.state.runtime.entries?.[p.race_id+':'+p.horse_id];
  if(window.__WTW_1999_PLAYTEST_ERROR__)return {error:window.__WTW_1999_PLAYTEST_ERROR__};
  return {ready:entry?.status==='BOOKED',jockey:entry?.jockey_id,
   saved:g?.getSave(),cash:g?.state.runtime.finances.operation_balances_minor[g.state.player.operation_id]};
 })()`,'Full browser reload restores paid jockey and entered horse');
 assert.equal(restored.saved,after.saved);
 assert.equal(restored.cash,after.cash);
 assert.equal(restored.jockey,prepared.jockey_id);
 await call('Page.navigate',{url:'http://127.0.0.1:8869/next/'});
 const clean=await until(`(()=>{
  const a=window.__WTW_1999_UI_DATA__,g=window.__WTW_1999_PLAYTEST__;
  return {ready:location.pathname+location.search==='/next/'&&!!a,
   sourceStable:a?.stableHorses?.length,playtest:!!g,
   bookingButton:!!document.querySelector('[data-ng="race-plan-confirm"]')};
 })()`,'Normal founding opening protected');
 assert.equal(clean.sourceStable,0);
 assert.equal(clean.playtest,false);
 assert.equal(clean.bookingButton,false);
 console.log('WTW_PLAYER_RACE_BOOKING_BROWSER_PASS '+JSON.stringify({
  horse:prepared.horse_name,race_id:prepared.race_id,jockey:prepared.jockey_id,
  paid_minor:prepared.quote.immediate_total_minor,save_reopened:'IDENTICAL',
  standard_founding_unmodified:true,existing_racing_tab:true}));
}finally{
 try{socket?.close()}catch{}
 try{proc.kill('SIGTERM')}catch{}
 try{rmSync(folder,{recursive:true,force:true,maxRetries:10,retryDelay:150})}catch{}
}
