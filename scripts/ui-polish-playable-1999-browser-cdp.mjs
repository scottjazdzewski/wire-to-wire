#!/usr/bin/env node
/** Targeted runtime UI QA for the playable 1999 branch.
 * Uses the actual /next/ page, actual Chromium and actual IndexedDB.
 * Does not modify any game source or generated source-world records.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdirSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';

const chrome=process.env.CHROME||'chromium';
const phase=process.env.WTW_UI_POLISH_PHASE||'before';
const output='visual-audit/playable-ui-window4/'+phase;
mkdirSync(output,{recursive:true});
const profile=mkdtempSync(join(tmpdir(),'wtw-ui4-'));
const browserPort=9491,sitePort=8897;
const server=spawn('python3',['-m','http.server',String(sitePort),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let proc=null,socket=null;
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function waitFor(label,read,ms=35000){
 const start=Date.now();let last=null;
 while(Date.now()-start<ms){
  try{last=await read();if(last?.ready)return last.value;}
  catch(error){last={error:String(error)};}
  await delay(220);
 }
 throw Error(label+' timed out: '+JSON.stringify(last));
}
try{
 const url='http://127.0.0.1:'+sitePort+'/next/';
 await waitFor('local web server',async()=>{
  try{return {ready:(await fetch(url)).ok,value:true};}catch{return {ready:false}}
 });
 proc=spawn(chrome,['--headless=new','--no-sandbox','--disable-dev-shm-usage',
  '--disable-gpu','--disable-extensions','--disable-background-networking',
  '--remote-allow-origins=*','--remote-debugging-port='+browserPort,
  '--user-data-dir='+profile,'--window-size=1440,900',url],{stdio:'ignore'});
 const tab=await waitFor('game Chromium tab',async()=>{
  const res=await fetch('http://127.0.0.1:'+browserPort+'/json/list').then(r=>r.json());
  const item=res.find(p=>p.type==='page'&&p.url.includes('/next/'));
  return {ready:!!item,value:item};
 });
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  socket.addEventListener('open',resolve,{once:true});
  socket.addEventListener('error',reject,{once:true});
 });
 let sequence=0;const pending=new Map();
 socket.addEventListener('message',event=>{
  let packet;try{packet=JSON.parse(event.data)}catch{return}
  const promise=pending.get(packet.id);if(!promise)return;
  pending.delete(packet.id);
  if(packet.error)promise.reject(Error(packet.error.message));else promise.resolve(packet.result);
 });
 const send=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++sequence;pending.set(id,{resolve,reject});
  socket.send(JSON.stringify({id,method,params}));
 });
 const evaluate=async expression=>{
  const result=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error('Chromium JavaScript exception: '+
   JSON.stringify(result.exceptionDetails).slice(0,650));
  return result.result.value;
 };
 await send('Page.enable');await send('Runtime.enable');
 await waitFor('live Office application',async()=>{
  const v=await evaluate('Boolean(window.__WTW_NEXT__?.app?.ready&&document.querySelector("#wtwNextgen .ng-game-rail"))');
  return {ready:v,value:true};
 });
 // Build/activate the same selected 10k industry test run through the real UI.
 await waitFor('world manager module',async()=>{
  const v=await evaluate('typeof window.WTWCompactCareerManager?.open==="function"');
  return {ready:v,value:true};
 });
 await evaluate('window.WTWCompactCareerManager.open().then(()=>true)');
 let manager=await evaluate('(()=>{const e=document.querySelector("#wtwCommercialCareerModal");return {visible:!!e&&!e.hidden,actionCount:e?.querySelectorAll("[data-cc-action]").length||0};})()');
 assert.ok(manager.visible,'Career Manager did not open');
 await evaluate('(()=>{const n=document.querySelector("[data-cc=industry-size]");n.value="10000";document.querySelector("[data-cc-action=open-full-industry]").click();return true;})()');
 await waitFor('selected 10000-horse world generation',async()=>{
  const value=await evaluate('(()=>{const e=document.querySelector("#wtwCommercialCareerModal");return {ready:!!e?.querySelector("[data-cc-action=start-test-career]"),error:(e?.textContent||"").match(/ERROR:[^\\n]{0,240}/)?.[0]||null};})()');
  if(value.error)throw Error(value.error);
  return {ready:value.ready,value:value};
 },240000);
 await evaluate('document.querySelector("[data-cc-action=start-test-career]").click();true');
 await waitFor('playable custom-world career',async()=>{
  const value=await evaluate('(()=>{const e=document.querySelector("#wtwCommercialCareerModal");return {ready:!!e?.querySelector("[data-cc-action=advance-test-day]"),error:(e?.textContent||"").match(/ERROR:[^\\n]{0,240}/)?.[0]||null};})()');
  if(value.error)throw Error(value.error);
  return {ready:value.ready,value:value};
 },180000);
 const world=await evaluate('(()=>{const e=document.querySelector("#wtwCommercialCareerModal");return {playing:!!e?.textContent.includes("canonical race engine connected"),horseCount:/10,000/.test(e?.textContent||""),actions:[...e.querySelectorAll("button[data-cc-action]")].map(x=>x.dataset.ccAction)};})()');
 assert.ok(world.playing&&world.horseCount,'Persisted world failed to enter playable test career');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 const screenshots=[];
 const audit=[];
 const viewports=[[1440,900],[1280,720],[1024,768]];
 // Profile routes and department routes use actual renderer, without a second UI.
 const routes=[
  ['office','Office','Office',''],
  ['stable','Stable','Overview',''],
  ['calendar','Racing','Calendar',''],
  ['world','World','Overview',''],
  ['world-tracks','World','Tracks',''],
  ['track-belmont','World','Tracks','WorldRecord:track:T-0002'],
  ['track-churchill','World','Tracks','WorldRecord:track:T-0003'],
  ['track-keeneland','World','Tracks','WorldRecord:track:T-0006'],
  ['track-saratoga','World','Tracks','WorldRecord:track:T-0005'],
  ['horse','World','1999 Horses','WorldRecord:horse:H-000001'],
  ['people','World','People','WorldRecord:person:P-000018'],
  ['farm','Facilities','Farms','FoundingProfile:facility:O-000061']
 ];
 for(const [width,height] of viewports){
  await send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
  for(const [name,section,page,custom] of routes){
   await evaluate('(()=>{const ui=window.__WTW_NEXT__;ui.app.section='+JSON.stringify(section)+';ui.app.page='+JSON.stringify(page)+';ui.app.custom='+JSON.stringify(custom)+';ui.app.detailTab="Overview";ui.paint();return true;})()');
   await delay(300);
   const result=await evaluate('(()=>{const root=document.getElementById("wtwNextgen");const shell=root?.querySelector(".ng-manager-shell");const rect=x=>x?.getBoundingClientRect();const s=rect(shell);const p=root?.querySelector(".ng-route-profile,.ng-board,.ng-dept-roster,.ng-manager-screen,.ng-stable-roster-v2");const images=[...root.querySelectorAll("img")].filter(x=>x.getBoundingClientRect().width>1&&x.getBoundingClientRect().height>1);const visibleButtons=[...root.querySelectorAll("button")].filter(x=>!x.disabled&&getComputedStyle(x).visibility!=="hidden"&&x.getBoundingClientRect().width>1);const out=visibleButtons.filter(x=>{const r=x.getBoundingClientRect();return r.right>innerWidth+3||r.left< -3;}).map(x=>({text:x.textContent.trim().slice(0,26),action:x.dataset.ng||""}));const stake=root.querySelector(".ng-track-stakes .ng-stakes-table");const scroll=stake?{height:stake.clientHeight,content:stake.scrollHeight,overflow:getComputedStyle(stake).overflowY}:null;return {ready:!!shell&&!!p,routeTitle:root.querySelector(".ng-profile-intro h1,.ng-profile-intro h2,.ng-manager-identity h2")?.textContent?.trim()||"",routeClasses:p?.className||"",horizontalOverflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,verticalOverflow:document.documentElement.scrollHeight-document.documentElement.clientHeight,shellFits:!!s&&s.left>=-3&&s.right<=innerWidth+3,offscreenControls:out,buttonCount:visibleButtons.length,unwiredButtons:visibleButtons.filter(x=>!x.dataset.ng&&!x.closest("[data-ng]")&&!x.dataset.ccAction&&!x.getAttribute("onclick")).length,brokenImages:images.filter(x=>x.complete&&x.naturalWidth===0).map(x=>x.getAttribute("src")).slice(0,9),visibleImages:images.length,stakeScroll:scroll};})()');
   const record={viewport:width+'x'+height,route:name,...result};
   audit.push(record);
   const pic=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
   const file=output+'/'+name+'-'+width+'x'+height+'.png';
   writeFileSync(file,Buffer.from(pic.data,'base64'));
   screenshots.push(file);
  }
  // Reopen the UI manager in-place to inspect the configured full world.
  await evaluate('window.WTWCompactCareerManager.open().then(()=>true)');
  const modalMetric=await evaluate('(()=>{const m=document.querySelector("#wtwCommercialCareerModal");const p=m?.querySelector(".wtw-cc-panel");return {shown:!!m&&!m.hidden,world:m?.textContent.includes("PLAYABLE GAMEPLAY TEST"),clientHeight:p?.clientHeight||0,scrollHeight:p?.scrollHeight||0,viewport:innerHeight,overflow:document.documentElement.scrollHeight-document.documentElement.clientHeight};})()');
  audit.push({viewport:width+'x'+height,route:'career-manager',...modalMetric});
  const pic=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  writeFileSync(output+'/career-manager-'+width+'x'+height+'.png',Buffer.from(pic.data,'base64'));
  await evaluate('document.querySelector("#wtwCommercialCareerModal [data-cc-action=close]")?.click();true');
 }
 // Full track dossier has independent tabs. Confirm each route is reachable,
 // without inventing a new track-view layer or changing game time.
 await send('Emulation.setDeviceMetricsOverride',{width:1280,height:720,deviceScaleFactor:1,mobile:false});
 await evaluate('(()=>{const ui=window.__WTW_NEXT__;ui.app.section="World";ui.app.page="Tracks";ui.app.custom="WorldRecord:track:T-0002";ui.app.detailTab="Overview";ui.paint();return true;})()');
 const tabs=await evaluate('(()=>[...document.querySelectorAll("#wtwNextgen .ng-person-dossieractions button[data-ng=detailtab]")].map(x=>x.dataset.val))()');
 audit.push({route:'belmont-track-tabs',tabs});
 const report={phase,base:'playable-1999',world,viewports,audit,screenshots};
 writeFileSync(output+'/audit.json',JSON.stringify(report,null,2));
 console.log('WTW_UI_POLISH_PHASE '+phase);
 console.log('WTW_UI_PLAYABLE_WORLD '+JSON.stringify(world));
 for(const row of audit)console.log('WTW_UI_VIEWPORT '+JSON.stringify(row));
 console.log('WTW_UI_POLISH_BASELINE_PASS '+JSON.stringify({phase,views:audit.length,screenshots:screenshots.length,world}));
}finally{
 try{socket?.close()}catch{}
 if(proc?.exitCode===null){proc.kill('SIGTERM');await delay(1000);if(proc.exitCode===null)proc.kill('SIGKILL')}
 server.kill('SIGTERM');
 rmSync(profile,{recursive:true,force:true});
}
