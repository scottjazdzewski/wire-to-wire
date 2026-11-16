#!/usr/bin/env node
/** Screenshot/live-click audit using the EXACT bundled May 29, 1999 run.
 * Reads a checksum-verified COPY; never opens/updates the reference IndexedDB.
 * UI and engine source are served by the same offline /next/ application.
 */
import assert from 'node:assert/strict';
import {readFileSync,mkdirSync,mkdtempSync,writeFileSync,rmSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawn} from 'node:child_process';
import {unpackShared1999Career} from '../public/1999/engine/shared-1999-career-package.mjs';
import {projectPopulated1999Career} from '../public/next/1999-populated-career-read-model.mjs';

const data=gunzipSync(readFileSync(new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',import.meta.url)));
const checkpoint=await unpackShared1999Career(data);
const run=structuredClone(checkpoint.careerRecord.changes.canonicalRun);
const before=JSON.stringify(run);
const model=projectPopulated1999Career({run,manifest:checkpoint.world.manifest,
 snapshotSha256:checkpoint.world.snapshotSha256});
assert.equal(model.date,'1999-05-29');
const withResult=model.horseRows.find(h=>h.results.length);
assert.ok(withResult,'Shared saved career needs a horse with an official race result');
const output=process.env.WTW_POPULATED_UI_ARTIFACT_DIR||join(tmpdir(),'wtw-populated-ui-screens');
mkdirSync(output,{recursive:true});

const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=process.env.CHROME||'google-chrome';
const host='http://127.0.0.1:8895/next/';
const profile=mkdtempSync(join(tmpdir(),'wtw-populated-real-career-'));
const server=spawn('python3',['-m','http.server','8895','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let processChrome=null,ws=null;
try{
 let serverReady=false;
 for(let i=0;i<90;i++){
  try{if((await fetch(host)).ok){serverReady=true;break}}catch{}
  await delay(100);
 }
 assert.ok(serverReady,'Game source server unavailable');
 processChrome=spawn(chrome,[
  '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--disable-background-networking','--no-first-run','--no-default-browser-check',
  '--disable-extensions','--remote-allow-origins=*','--window-size=1440,900',
  '--remote-debugging-port=9373','--user-data-dir='+profile,host
 ],{stdio:'ignore'});
 let page=null;
 for(let i=0;i<150;i++){
  try{const all=await fetch('http://127.0.0.1:9373/json/list').then(r=>r.json());
   page=all.find(p=>p.type==='page'&&p.url.startsWith(host));if(page)break;
  }catch{}
  if(processChrome.exitCode!==null)throw Error('Chrome exited during startup');
  await delay(120);
 }
 assert.ok(page,'Game browser page did not launch');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 let seq=0;const pending=new Map();
 ws.addEventListener('message',event=>{
  let p;try{p=JSON.parse(event.data)}catch{return}
  if(!pending.has(p.id))return;
  const {resolve,reject}=pending.get(p.id);pending.delete(p.id);
  if(p.error)reject(Error(p.error.message));else resolve(p.result);
 });
 const call=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evalJS=async expression=>{
  const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error(JSON.stringify(result.exceptionDetails));
  return result.result.value;
 };
 await call('Runtime.enable');await call('Page.enable');
 let ready=false;
 for(let i=0;i<130;i++){
  ready=await evalJS("!!window.__WTW_NEXT__?.app?.ready&&!!document.querySelector('#wtwNextgen .ng-game-rail')");
  if(ready)break;
  await delay(120);
 }
 assert.ok(ready,'One approved 1999 management UI did not mount');
 const inject=await evalJS(`(()=>{
  const model=${JSON.stringify(model)};
  window.__WTW_ACTIVE_WORLD_CAREER_VIEW__=Object.freeze(model);
  window.__WTW_NEXT__.paint();
  return {date:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__.date,
   worldId:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__.worldId,
   horses:window.__WTW_NEXT__.horseRows().length};
 })()`);
 assert.equal(inject.date,'1999-05-29');
 assert.equal(inject.worldId,model.worldId);
 assert.equal(inject.horses,model.horseRows.length);
 const until=async (label,fn)=>{
  let last=null;
  for(let i=0;i<100;i++){last=await evalJS(fn);if(last?.ok)return last;await delay(100)}
  throw Error(label+': '+JSON.stringify(last));
 };
 const viewport=async (width,height)=>{
  await call('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  await delay(250);
 };
 const shot=async(name,width,height)=>{
  await viewport(width,height);
  const layout=await evalJS(`(()=>{
   const root=document.querySelector('#wtwNextgen');
   return {clock:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.date,
    overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
    screen:root?.querySelector('.ng-routeinner')?.getBoundingClientRect().width||0,
    viewport:document.documentElement.clientWidth};
  })()`);
  assert.equal(layout.clock,'1999-05-29');
  assert.ok(layout.overflow<=3,name+' has document horizontal overflow '+JSON.stringify(layout));
  assert.ok(layout.screen>width*.55,name+' has clipped manager workspace '+JSON.stringify(layout));
  const png=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  writeFileSync(join(output,name+'-'+width+'x'+height+'.png'),Buffer.from(png.data,'base64'));
  console.log('WTW_POPULATED_UI_SCREENSHOT_PASS '+name+' '+width+'x'+height);
  await call('Emulation.clearDeviceMetricsOverride');
 };
 const click=expression=>evalJS(`(()=>{const target=${expression};if(!target)return false;target.click();return true})()`);
 assert.ok(await click("document.querySelector('#wtwNextgen [data-ng=\"organization\"]')"));
 await until('Organization',`(()=>({ok:!!document.querySelector('#wtwNextgen .ng-org-overview')}))()`);
 const home=await evalJS(`(()=>{
  const h=document.querySelector('#wtwNextgen .ng-org-overview');
  return {text:h?.textContent||'',horseLinks:[...h.querySelectorAll('[data-ng="career-horse"]')].map(n=>n.dataset.val),
   raceLinks:[...h.querySelectorAll('[data-ng="career-race"]')].map(n=>n.dataset.val)};
 })()`);
 assert.ok(home.text.includes(model.operationName)&&home.text.includes(model.horseRows.length+''));
 assert.deepEqual(home.horseLinks,model.horseRows.slice(0,4).map(h=>h.horseId));
 assert.deepEqual(home.raceLinks,model.raceRows.slice(0,4).map(r=>r.id));
 await shot('organization',1280,800);
 assert.ok(await click("document.querySelector('#wtwNextgen .ng-game-rail [data-ng=\"menu\"][data-val=\"Stable\"]')"));
 await until('Stable roster',`(()=>({ok:!!document.querySelector('#wtwNextgen .ng-rs-table [data-horse-id]')}))()`);
 const names=await evalJS(`[...document.querySelectorAll('#wtwNextgen .ng-rs-table [data-horse-id]')].map(x=>x.dataset.horseId)`);
 assert.deepEqual(names.slice().sort(),model.horseRows.map(h=>h.horseId).sort());
 const sortButton="document.querySelector('#wtwNextgen .ng-rs-table [data-ng=\"stable-sort\"][data-val=\"name\"]')";
 assert.ok(await click(sortButton));
 const sorted=await evalJS("window.__WTW_NEXT__.app.stableSortDesc");
 assert.equal(sorted,true,'Name sorting did not toggle');
 const filter=await evalJS(`(()=>{
  const input=document.querySelector('#wtwNextgen input[data-ng-input="stable-search"]');
  if(!input)return false;input.value=${JSON.stringify(withResult.name)};
  input.dispatchEvent(new Event('input',{bubbles:true}));return true;
 })()`);
 assert.ok(filter);
 const filtered=await evalJS(`[...document.querySelectorAll('#wtwNextgen .ng-rs-table [data-horse-id]')].map(x=>x.dataset.horseId)`);
 assert.deepEqual(filtered,[withResult.horseId],'Name search did not retain exact H-ID');
 await evalJS(`(()=>{const input=document.querySelector('#wtwNextgen input[data-ng-input="stable-search"]');input.value='';input.dispatchEvent(new Event('input',{bubbles:true}));return true})()`);
 await shot('stable',1440,900);
 assert.ok(await click(`[...document.querySelectorAll('#wtwNextgen .ng-rs-table [data-horse-id]')].find(x=>x.dataset.horseId===${JSON.stringify(withResult.horseId)})`));
 await until('Horse profile',`(()=>({ok:document.querySelector('#wtwNextgen [data-career-horse-id]')?.dataset.careerHorseId===${JSON.stringify(withResult.horseId)}}))()`);
 const profileFields=await evalJS("document.querySelector('#wtwNextgen [data-career-horse-id]')?.textContent||''");
 assert.ok(profileFields.includes(withResult.name)&&profileFields.includes(withResult.horseId));
 await shot('horse-profile',1440,900);
 const officialId=withResult.results[0].raceId;
 assert.ok(await click(`[...document.querySelectorAll('#wtwNextgen [data-ng="career-race"]')].find(x=>x.dataset.val===${JSON.stringify(officialId)})`));
 await until('Official race file',`(()=>({ok:document.querySelector('#wtwNextgen [data-career-race-id]')?.dataset.careerRaceId===${JSON.stringify(officialId)}}))()`);
 const raceText=await evalJS("document.querySelector('#wtwNextgen [data-career-race-id]')?.textContent||''");
 assert.ok(raceText.includes('Official game result')&&raceText.includes(withResult.name));
 await shot('official-race',1366,768);
 await evalJS('window.history.back();true');
 await until('Back to horse by H-ID',`(()=>({ok:document.querySelector('#wtwNextgen [data-career-horse-id]')?.dataset.careerHorseId===${JSON.stringify(withResult.horseId)}}))()`);
 const saveReads=await evalJS(`(()=>({date:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.date,
  run:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.runId,
  owner:window.__WTW_ACTIVE_WORLD_CAREER_VIEW__?.operationId}))()`);
 assert.deepEqual(saveReads,{date:'1999-05-29',run:model.runId,owner:model.operationId});
 assert.equal(JSON.stringify(run),before,'UI browser test changed the checkpoint run');
 console.log('WTW_POPULATED_CAREER_UI_PASS '+JSON.stringify({
  worldId:model.worldId,runId:model.runId,date:model.date,
  horses:model.horseRows.length,races:model.raceRows.length,officialRaceId:officialId
 }));
}finally{
 ws?.close();
 if(processChrome)processChrome.kill('SIGKILL');
 server.kill('SIGKILL');
 rmSync(profile,{recursive:true,force:true});
}
