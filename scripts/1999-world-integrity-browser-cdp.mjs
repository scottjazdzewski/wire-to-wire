#!/usr/bin/env node
/**
 * Real Chromium / IndexedDB industry audit. Fresh isolated Chrome profile per
 * CI job; browser process is deliberately killed and relaunched before reopen.
 * WTW_INTEGRITY_SIZE=10000|300000|325000; WTW_INTEGRITY_SEED=<positive int>.
 * No mocked IndexedDB, alternate game world, or UI source modifications.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const size=Number(process.env.WTW_INTEGRITY_SIZE||10000);
const seed=Number(process.env.WTW_INTEGRITY_SEED||19990101);
assert.ok([10000,300000,325000].includes(size),'Unsupported scale acceptance size');
assert.ok(Number.isSafeInteger(seed)&&seed>0);
const worldId='WTW1999FullIndustry-COHORTS-V6-OWNER-V9-NAMES-V6-H'+size;
const key=worldId+':'+seed;
const profile=mkdtempSync(join(tmpdir(),'wtw-integrity-'+size+'-'));
const cdpPort=Number(process.env.WTW_INTEGRITY_CDP_PORT||9447);
const httpPort=Number(process.env.WTW_INTEGRITY_HTTP_PORT||8895);
const chrome=process.env.CHROME||'google-chrome';
const deadlineMs=Number(process.env.WTW_INTEGRITY_TIMEOUT_MS||1200000);
const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
let browser=null;
const server=spawn('python3',['-m','http.server',String(httpPort),
 '--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
async function readyServer(){
 for(let i=0;i<100;i++){
  try{if((await fetch('http://127.0.0.1:'+httpPort+'/next/')).ok)return}catch{}
  await pause(200);
 }
 throw Error('Local /next/ server failed');
}
async function launch(){
 const proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--enable-precise-memory-info','--disable-gpu','--disable-extensions',
  '--disable-background-networking','--no-first-run',
  '--remote-allow-origins=*','--remote-debugging-port='+cdpPort,
  '--user-data-dir='+profile,'http://127.0.0.1:'+httpPort+'/next/'],{stdio:'ignore'});
 let socket;
 try{
  let page;
  for(let i=0;i<160;i++){
   if(proc.exitCode!==null)throw Error('Chromium exited unexpectedly');
   try{
    const pages=await fetch('http://127.0.0.1:'+cdpPort+'/json/list').then(r=>r.json());
    page=pages.find(p=>p.type==='page'&&p.url.includes('/next/'));
    if(page)break;
   }catch{}
   await pause(250);
  }
  assert.ok(page,'Chromium did not open /next/');
  socket=new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((resolve,reject)=>{
   socket.addEventListener('open',resolve,{once:true});
   socket.addEventListener('error',reject,{once:true});
  });
  let id=0;
  const waiting=new Map();
  socket.addEventListener('message',event=>{
   let item;try{item=JSON.parse(event.data)}catch{return}
   const current=waiting.get(item.id);if(!current)return;
   waiting.delete(item.id);
   if(item.error)current.reject(Error(item.error.message));
   else current.resolve(item.result);
  });
  const send=(method,params={})=>new Promise((resolve,reject)=>{
   const next=++id;waiting.set(next,{resolve,reject});
   socket.send(JSON.stringify({id:next,method,params}));
  });
  await send('Runtime.enable');
  const evaluate=async expression=>{
   const result=await send('Runtime.evaluate',{
    expression,returnByValue:true,awaitPromise:true});
   if(result.exceptionDetails)throw Error('Browser JS exception: '+
    JSON.stringify(result.exceptionDetails).slice(0,1400));
   return result.result.value;
  };
  return {proc,socket,evaluate};
 }catch(error){
  try{socket?.close()}catch{}
  proc.kill('SIGTERM');throw error;
 }
}
async function stop(){
 if(!browser)return;
 const current=browser;browser=null;
 try{current.socket.close()}catch{}
 if(current.proc.exitCode===null){
  current.proc.kill('SIGTERM');
  await Promise.race([new Promise(ok=>current.proc.once('exit',ok)),pause(5000)]);
  if(current.proc.exitCode===null)current.proc.kill('SIGKILL');
 }
}
async function until(label,fn,maxMs=30000){
 const started=Date.now(),errors=[];
 while(Date.now()-started<maxMs){
  try{const r=await fn();if(r?.done)return r.value;
   if(r?.fatal)throw Error(label+': '+r.fatal)}
  catch(err){
   if(String(err.message).startsWith(label+':'))throw err;
   errors.push(String(err.message||err));
   if(errors.length>3)errors.shift();
  }
  await pause(1000);
 }
 throw Error(label+' timed out '+JSON.stringify(errors));
}
const inspectStatus=`(async()=>{
 const api=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
 const db=await api.open1999IndustryDatabase();
 try{
  const m=await db.get('manifests',${JSON.stringify(key)});
  const notice=document.querySelector('#wtwCommercialCareerModal')?.textContent
   ?.match(/ERROR:[^\\n]{0,240}/)?.[0]||null;
  return {status:m?.status||'MISSING',horses:m?.horseCount||0,
   horseBatches:m?.horseBatchesCommitted||0,personBatches:m?.personBatchesCommitted||0,
   notice};
 }finally{db.close()}
})()`;
const fullAudit=`(async()=>{
 const persistence=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
 const audit=await import('/1999/engine/fictional-industry-integrity-audit-1999.mjs');
 const db=await persistence.open1999IndustryDatabase();
 try{
  const opened=await persistence.reopenPersistent1999Industry(db,{
   seed:${seed},worldId:${JSON.stringify(worldId)}});
  if(opened?.status!=='READY')throw Error('Saved world not ready for deep audit');
  const t=performance.now();
  const report=await audit.auditPersistent1999World(db,opened.manifest,{
   expectedHorses:${size}});
  const name='H-FICTIONAL-1999-FIVEPLUSRUNNERS-';
  const ordinal=opened.manifest.plan.counts.fivePlusRunners;
  const lastId=name+String(ordinal).padStart(7,'0');
  const horse=await persistence.findPersistent1999Horse(db,opened.manifest,lastId);
  const personRole=Object.keys(opened.manifest.staffing.counts).at(-1);
  const personId='P-FICTIONAL-1999-'+personRole.toUpperCase().replaceAll('_','-')
   +'-'+String(opened.manifest.staffing.counts[personRole]).padStart(7,'0');
  const person=await persistence.findPersistent1999Person(db,opened.manifest,personId);
  if(horse?.id!==lastId||person?.id!==personId)
   throw Error('Last-batch directory/profile lookup failed');
  return {...report,auditMs:Math.round(performance.now()-t),
   reopenCertificate:opened.certificate,profileHorseId:horse.id,
   profilePersonId:person.id,
   jsHeapBytes:performance.memory?.usedJSHeapSize??null};
 }finally{db.close()}
})()`;
const fullNinetyDayAudit=`(async()=>{
 const persistence=await import('/1999/engine/fictional-industry-persistence-1999.mjs');
 const circuits=await import('/1999/engine/fictional-industry-90-day-circuit-audit-1999.mjs');
 const store=await persistence.open1999IndustryDatabase();
 try{
  const opened=await persistence.reopenPersistent1999Industry(store,{
   seed:${seed},worldId:${JSON.stringify(worldId)}});
  if(opened?.status!=='READY')throw Error('Cannot audit an incomplete full world');
  return await circuits.auditFullWorld1999NinetyDayCircuit(store,opened.manifest,{
   expectedHorses:${size}});
 }finally{store.close()}
})()`;
try{
 await readyServer();
 browser=await launch();
 await until('Career Manager ready',async()=>{
  const ready=await browser.evaluate('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:ready,value:ready};
 },30000);
 await browser.evaluate('window.WTWCompactCareerManager.open().then(()=>true)');
 const click=await browser.evaluate(`(()=>{
  const root=document.querySelector('#wtwCommercialCareerModal');
  const n=root?.querySelector('[data-cc="industry-size"]');
  const b=root?.querySelector('[data-cc-action="open-full-industry"]');
  if(!n||!b)return false;
  n.value=${JSON.stringify(String(size))};
  b.click();return true;
 })()`);
 assert.equal(click,true,'Cannot create selected-size world via actual UI');
 const start=Date.now();
 const manifestStatus=await until('Full world generation',async()=>{
  const state=await browser.evaluate(inspectStatus);
  if(state.notice)return {fatal:state.notice};
  return {done:state.status==='COMPLETE',value:state};
 },deadlineMs);
 assert.equal(manifestStatus.horses,size);
 const creationMs=Date.now()-start;
 const before=await browser.evaluate(fullAudit);
 assert.equal(before.check,'PASS');
 assert.equal(before.openingHorses,size);
 const seasonBefore=await browser.evaluate(fullNinetyDayAudit);
 assert.equal(seasonBefore.openingHorses,size);
 assert.equal(seasonBefore.check,'PASS_READ_ONLY_NOT_GAMEPLAY_CERTIFICATION');
 assert.equal(seasonBefore.period.days,90);
 assert.equal(seasonBefore.raceClassCoverage.sourceScheduledRaces,
  seasonBefore.period.scheduledRaces,
  'race class audit must count every 1999 90-day condition-book race');
 assert.equal(Object.values(seasonBefore.raceClassCoverage.classCounts).
  reduce((n,v)=>n+v,0),seasonBefore.period.scheduledRaces);
 assert.ok(seasonBefore.raceClassCoverage.classesWithoutFullyModeledOpeningEntryRules>0,
  'do not misrepresent unimplemented race classes as playable');
 assert.equal(seasonBefore.sourceShippingReadiness.actualShipments,0,
  'readiness audit must never fabricate shipping');
 assert.ok(seasonBefore.sourceShippingReadiness.modeledDomesticRoadPairs>0);
 assert.ok(seasonBefore.sourceShippingReadiness.
  pairsWithMeetDateAfterModeledTravelAndRecovery>0,
  'no modeled circuit movement windows found');
 assert.equal(seasonBefore.sourceCapacity.tracksWithFewerThanTwoResidentJockeys,0,
  'no new full-world track can have fewer than two resident jockeys');
 assert.equal(seasonBefore.sourceCapacity.tracksShortOfOneFullFieldOfDistinctJockeys,0,
  'real program-sized jockey colony cannot fill the largest single race');
 assert.ok(seasonBefore.sourceCapacity.tracksWithScheduledCards>0);
 // Multiple rides per jockey on a card are allowed; NEVER multiply jockey
 // headcount by the number of races to estimate single-day labor demand.
 assert.equal(seasonBefore.sourceCapacity.
  maximumSingleRaceUsesDistinctJockeys_NotRacesTimesFieldSize,true);
 if(size>=300000){
  assert.equal(seasonBefore.raceClassCoverage.
   olderHorseSourceRacesWithoutTwoMatchingActiveLocalRunners,0,
   'production-size world lost source age/sex candidate coverage for adult horses');
  assert.equal(seasonBefore.sourceCapacity.tracksNeedingGuestRunnersToFillAllRaces,0,
   'default and maximum world source calendars lost their optimistic local two-starter capacity');
 }
 assert.deepEqual(seasonBefore.period.checkpoints.map(c=>c.elapsedDays),[30,60,90]);
 console.log('WTW_FULL_WORLD_90_DAY_CIRCUIT_READINESS_PASS '+JSON.stringify({
  size,seed,report:seasonBefore}));
 console.log('WTW_INTEGRITY_CREATE_PASS '+JSON.stringify({
  size,seed,creationMs,report:before}));
 await stop();
 browser=await launch();
 await until('Career Manager after browser relaunch',async()=>{
  const ready=await browser.evaluate('Boolean(window.WTWCompactCareerManager?.open)');
  return {done:ready,value:ready};
 },30000);
 const reopenStarted=Date.now();
 const after=await browser.evaluate(fullAudit);
 const reopenMs=Date.now()-reopenStarted;
 assert.equal(after.check,'PASS');
 const seasonAfter=await browser.evaluate(fullNinetyDayAudit);
 assert.deepEqual(seasonAfter,seasonBefore,
  '90-day whole-industry circuit coverage changed across Chromium restart');
 console.log('WTW_FULL_WORLD_90_DAY_CIRCUIT_REOPEN_PASS '+JSON.stringify({
  size,seed,period:seasonAfter.period,openingHorses:seasonAfter.openingHorses,
  liveGameDaysSimulated:seasonAfter.liveGameDaysSimulated}));
 assert.deepEqual({...after,auditMs:null,jsHeapBytes:null},
  {...before,auditMs:null,jsHeapBytes:null},
  'Reopened full census changed after Chrome process restart');
 console.log('WTW_INTEGRITY_REOPEN_PASS '+JSON.stringify({
  size,seed,creationMs,reopenMs,report:after}));
}finally{
 await stop();
 server.kill('SIGTERM');
 try{rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:250})}
 catch(error){console.warn('Chromium test-profile cleanup:',error.code||error.message)}
}
