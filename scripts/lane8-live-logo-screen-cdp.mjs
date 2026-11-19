#!/usr/bin/env node
/** Lane 8: real management-screen screenshots only AFTER exact-ID logo decode.
 * Developer-only Chromium/loopback test; not part of the shipping game runtime.
 */
import assert from 'node:assert/strict';
import {mkdirSync,mkdtempSync,rmSync,writeFileSync} from 'node:fs';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const host='http://127.0.0.1:8765',port=9397;
const chrome=process.env.CHROME||(process.env.CI?'google-chrome':'chromium');
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const scenarios=[
 ['belmont-track','track','T-0002','WorldRecord:track:T-0002'],
 ['gulfstream-track','track','T-0017','WorldRecord:track:T-0017'],
 ['davenport-hall-facility','organization','O-FOUNDING-1999-001','FoundingProfile:facility:O-FOUNDING-1999-001'],
 ['split-rail-facility','organization','O-FOUNDING-1999-004','FoundingProfile:facility:O-FOUNDING-1999-004'],
 ['comanche-track','track','T-0061','WorldRecord:track:T-0061'],
 ['bluff-city-track','track','T-0119','WorldRecord:track:T-0119'],
 ['lowcountry-track','track','T-0120','WorldRecord:track:T-0120'],
 ['live-oak-track','track','T-0121','WorldRecord:track:T-0121'],
 ['sioux-plains-track','track','T-0122','WorldRecord:track:T-0122'],
 ['bitterroot-track','track','T-0123','WorldRecord:track:T-0123'],
 ['playfair-track','track','T-0124','WorldRecord:track:T-0124']
];
const priority=new Set(scenarios.slice(0,4).map(x=>x[0]));
const dir=mkdtempSync(join(tmpdir(),'wtw-lane8-art-'));
const proc=spawn(chrome,[
 '--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
 '--disable-background-networking','--disable-extensions','--no-first-run',
 '--remote-allow-origins=*','--remote-debugging-port='+port,
 '--user-data-dir='+dir,'--window-size=1536,864',host+'/next/'
],{stdio:'ignore'});
let ws;
function snapshot(kind,id){
 const root=document.getElementById('wtwNextgen');
 const profile=root?.querySelector('.ng-route-profile .ng-profile-view.ng-profile-track');
 const mark=profile?.querySelector(':scope > .ng-profile-intro > .ng-profile-source-photo');
 const img=mark?.querySelector('img');
 const raw=img?.currentSrc||img?.src||'';
 const imagePath=raw.startsWith('blob:')?'blob:':raw?new URL(raw,location.href).pathname:'';
 const source=kind==='track'?'/assets/places/track-hero/'+id+'.webp':
  '/assets/office/founding-organization-logos/'+id+'.png';
 const bound=img?.getBoundingClientRect();
 const loaded=!!img?.complete&&img.naturalWidth>0&&img.naturalHeight>0;
 const assigned=kind==='track'?
  (img?.dataset.wtwHeroProbePath===source&&img?.dataset.wtwHeroState==='active'
   &&mark.classList.contains('wtw-hero-transparent')):imagePath===source;
 const identity=root?.getAttribute('data-wtw-identity')||'';
 const route=decodeURIComponent(new URLSearchParams(location.search).get('ui')||'');
 return {identity,route,imagePath,source,loaded,assigned,
  fallback:!!mark?.querySelector('.wtw-hero-fallback'),
  width:bound?.width||0,height:bound?.height||0,
  naturalWidth:img?.naturalWidth||0,naturalHeight:img?.naturalHeight||0,
  viewportWidth:document.documentElement.clientWidth,
  viewportHeight:document.documentElement.clientHeight,
  overflow:document.documentElement.scrollWidth-document.documentElement.clientWidth,
  ready:!!profile&&loaded&&assigned&&!!bound&&bound.width>120&&bound.height>55
 };
}
try{
 let page=null;
 for(let i=0;i<100;i++){
  if(proc.exitCode!==null)throw Error('Chromium closed before artwork QA');
  try{
   const pages=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());
   page=pages.find(x=>x.type==='page'&&x.url.startsWith(host+'/next/'));
   if(page)break;
  }catch{}
  await sleep(120);
 }
 assert.ok(page,'CDP game page unavailable');
 ws=new WebSocket(page.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{
  ws.addEventListener('open',resolve,{once:true});
  ws.addEventListener('error',reject,{once:true});
 });
 let seq=0;
 const pending=new Map();
 ws.addEventListener('message',event=>{
  let p;try{p=JSON.parse(event.data)}catch{return}
  const item=pending.get(p.id);if(!item)return;pending.delete(p.id);
  if(p.error)item.reject(Error(p.error.message));else item.resolve(p.result);
 });
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++seq;pending.set(id,{resolve,reject});
  ws.send(JSON.stringify({id,method,params}));
 });
 const evalJS=async expression=>{
  const result=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(result.exceptionDetails)throw Error('Browser eval: '+JSON.stringify(result.exceptionDetails));
  return result.result.value;
 };
 const read=(kind,id)=>evalJS('('+snapshot.toString()+')('+
  JSON.stringify(kind)+','+JSON.stringify(id)+')');
 await cmd('Page.enable');await cmd('Runtime.enable');
 mkdirSync('visual-audit/screenshots',{recursive:true});
 mkdirSync('visual-audit/dom',{recursive:true});
 const evidence=[];
 for(const [label,kind,id,route] of scenarios){
  await cmd('Page.navigate',{url:host+'/next/?ui='+encodeURIComponent(route)});
  let actual;
  for(let i=0;i<220;i++){
   actual=await read(kind,id);
   if(actual?.ready&&actual.identity===id&&actual.route===route)break;
   await sleep(100);
  }
  assert.ok(actual?.ready&&actual.identity===id&&actual.route===route,
   label+' retained temporary initials or wrong logo: '+JSON.stringify(actual));
  assert.equal(actual.fallback,false,label+' still shows a placeholder');
  for(const [width,height] of priority.has(label)
   ? [[1536,864],[1280,720],[1024,768]]:[[1536,864]]){
   await cmd('Emulation.setDeviceMetricsOverride',{
    width,height,deviceScaleFactor:1,mobile:false
   });
   await sleep(100);
   const rendered=await read(kind,id);
   assert.equal(rendered.identity,id,label+' changed identity on resize');
   assert.equal(rendered.viewportWidth,width,label+' viewport width');
   assert.equal(rendered.viewportHeight,height,label+' viewport height');
   assert.ok(rendered.ready&&!rendered.fallback,label+' logo missing on resize');
   assert.ok(rendered.overflow<=3,label+' horizontal overflow: '+rendered.overflow);
   const png=await cmd('Page.captureScreenshot',{
    format:'png',fromSurface:true,captureBeyondViewport:false
   });
   const file='visual-audit/screenshots/'+label+
    (width===1536?'':'-'+width+'x'+height)+'.png';
   writeFileSync(file,Buffer.from(png.data,'base64'));
   evidence.push({label,id,kind,route,file,viewport:{width,height},
    naturalWidth:rendered.naturalWidth,naturalHeight:rendered.naturalHeight,
    assetPath:rendered.source});
   console.log('WTW_LANE8_REAL_ART_PASS',label,id,width+'x'+height);
  }
 }
 writeFileSync('visual-audit/dom/lane8-live-logo-proof.json',
  JSON.stringify({schema:'WTW_LANE8_REAL_GAME_ART_PROOF_V1',screens:evidence},null,2)+'\n');
 console.log('WTW_LANE8_ALL_LOGOS_ACTIVE',evidence.length);
}finally{
 try{ws?.close()}catch{}
 try{proc.kill('SIGKILL')}catch{}
 rmSync(dir,{recursive:true,force:true});
}
