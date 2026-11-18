#!/usr/bin/env node
/** Real Chromium process exit/relaunch with one unchanged IndexedDB career.
 * This is separate from the 10,000 fast kernel save/reopen test. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const url='http://127.0.0.1:8874/next/?playtest=38', port=9347;
const repeats=Number(process.env.WTW_BROWSER_RESTARTS||3);
if(!Number.isSafeInteger(repeats)||repeats<2||repeats>100)
 throw Error('WTW_BROWSER_RESTARTS must be an integer from 2 through 100');
const chrome=process.env.CHROME||'google-chrome';
const profile=mkdtempSync(join(tmpdir(),'wtw-product-reopen-'));
const server=spawn('python3',['-m','http.server','8874','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let browser=null;
async function awaitServer(){
 for(let i=0;i<80;i++){
  try{const response=await fetch('http://127.0.0.1:8874/next/');if(response.ok)return}catch{}
  await pause(150);
 }
 throw Error('The local /next/ server failed to boot');
}
async function stop(connection){
 if(!connection)return;
 try{connection.ws?.close()}catch{}
 if(connection.proc.exitCode===null){
  connection.proc.kill('SIGTERM');
  await Promise.race([new Promise(ok=>connection.proc.once('exit',ok)),pause(5000)]);
  if(connection.proc.exitCode===null){connection.proc.kill('SIGKILL');await pause(500)}
 }
}
async function start(){
 const proc=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--disable-extensions','--no-first-run',
  '--no-default-browser-check','--remote-allow-origins=*',
  '--remote-debugging-port='+port,'--user-data-dir='+profile,url
 ],{stdio:'ignore'});
 let ws=null;
 try{
  let page=null;
  for(let i=0;i<120;i++){
   if(proc.exitCode!==null)throw Error('Chromium exited unexpectedly');
   try{
    const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
    page=tabs.find(x=>x.type==='page'&&x.url.includes('playtest=38'));
    if(page)break;
   }catch{}
   await pause(200);
  }
  assert.ok(page,'Chromium did not open the original /next/ playtest URL');
  ws=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((ok,fail)=>{
   ws.addEventListener('open',ok,{once:true});
   ws.addEventListener('error',fail,{once:true});
  });
  const pending=new Map();let n=0;
  ws.addEventListener('message',event=>{
   let item;try{item=JSON.parse(event.data)}catch{return}
   if(!pending.has(item.id))return;
   const {ok,fail}=pending.get(item.id);pending.delete(item.id);
   if(item.error)fail(Error(item.error.message));else ok(item.result);
  });
  const send=(method,params={})=>new Promise((ok,fail)=>{
   const id=++n;pending.set(id,{ok,fail});
   ws.send(JSON.stringify({id,method,params}));
  });
  await send('Runtime.enable');
  const evaluate=async expression=>{
   const r=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
   if(r.exceptionDetails)throw Error('Game browser JS exception: '+JSON.stringify(r.exceptionDetails));
   return r.result.value;
  };
  return {proc,ws,evaluate};
 }catch(e){try{ws?.close()}catch{}proc.kill('SIGTERM');throw e}
}
const observe=`(async()=>{
 const api=window.__WTW_1999_PLAYTEST__;
 if(window.__WTW_1999_PLAYTEST_ERROR__)return {error:String(window.__WTW_1999_PLAYTEST_ERROR__)};
 if(!api)return {pending:window.__WTW_1999_PLAYTEST_LOADING__||true};
 const save=api.getSave(),v=api.view();
 const data=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(save)));
 const digest=Array.from(data,b=>b.toString(16).padStart(2,'0')).join('');
 return {ready:true,runId:v.run_id,revision:v.revision,date:v.date,
  horseCount:v.horse_count,owner:v.player_operation_id,
  cash:v.finance.owner_cash_minor,stable:v.stable.map(h=>h.horse_id).sort(),
  results:v.races.filter(r=>r.status==='OFFICIAL_SIM_RESULT').length,
  saveSHA256:digest,saveSize:save.length,
  shell:!!document.querySelector('#wtwNextgen .ng-manager-shell'),
  visibleRoots:document.querySelectorAll('#wtwNextgen').length,
  badPilotPanels:document.querySelectorAll('.ng-connected-profile').length,
  oldOfficeHidden:!!document.querySelector('.app[data-wtw-layout="legacy-data-bridge"][hidden]')};
})()`;
async function ready(connection){
 let last=null;
 for(let i=0;i<100;i++){
  try{last=await connection.evaluate(observe)}
  catch(error){if(i===99)throw error;await pause(200);continue}
  if(last?.error)throw Error(last.error);
  if(last?.ready)return last;
  await pause(200);
 }
 throw Error('Game did not restore its persisted career: '+JSON.stringify(last));
}
try{
 await awaitServer();let baseline=null;
 for(let cycle=1;cycle<=repeats;cycle++){
  browser=await start();
  let snap=await ready(browser);
  if(cycle===1){
   assert.equal(snap.date,'1999-01-01');
   assert.equal(snap.horseCount,38);
   await browser.evaluate("window.__WTW_1999_PLAYTEST__.submit('ADVANCE_DAY',{},'system').then(()=>true)");
   snap=await ready(browser);
   assert.equal(snap.date,'1999-01-02');
   baseline=snap;
  }else{
   assert.deepEqual(snap,baseline,'Career or UI changed on Chromium restart '+cycle);
  }
  assert.equal(snap.shell,true);
  assert.equal(snap.visibleRoots,1);
  assert.equal(snap.badPilotPanels,0);
  assert.equal(snap.oldOfficeHidden,true);
  console.log('WTW_BROWSER_RESTART '+cycle+'/'+repeats+' '+snap.date+' '+snap.saveSHA256);
  await stop(browser);browser=null;
 }
 console.log('WTW_PRODUCT_RESTART_CERTIFICATION_PASS '+JSON.stringify({
  browserProcesses:repeats,runId:baseline.runId,
  date:baseline.date,saveSHA256:baseline.saveSHA256,
  UI:'ONE_APPROVED_MANAGER',IndexedDB:'EXACT_SAVED_CAREER'}));
}finally{
 await stop(browser);
 server.kill('SIGTERM');
 // Chromium child cache writers can outlive the browser parent for a moment.
 // A late filesystem cleanup must not turn a proven identical career reopen
 // into a false gameplay failure; keep cleanup strict with a generous retry.
 await pause(450);
 rmSync(profile,{recursive:true,force:true,maxRetries:80,retryDelay:200});
}
