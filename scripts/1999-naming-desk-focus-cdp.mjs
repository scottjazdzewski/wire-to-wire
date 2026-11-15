#!/usr/bin/env node
/** Real Chromium regression for a single click + ordinary keyboard typing
 * in the existing Naming Desk. No Cloudflare, API calls, or saved-game writes.
 */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const chrome=process.env.CHROME||'google-chrome';
const profile=mkdtempSync(join(tmpdir(),'wtw-naming-focus-'));
const serverPort=8897,debugPort=9381;
const url='http://127.0.0.1:'+serverPort+'/next/?ui=Stable%20%E2%80%94%20Naming%20Desk';
const server=spawn('python3',['-m','http.server',String(serverPort),'--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let browser=null,socket=null;
try{
 let serverUp=false;
 for(let i=0;i<75;i++){try{const r=await fetch(url);if(r.ok){serverUp=true;break}}catch{}await wait(150)}
 assert.ok(serverUp,'Local game server did not start');
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu',
  '--disable-dev-shm-usage','--disable-background-networking','--disable-extensions',
  '--no-first-run','--no-default-browser-check','--remote-allow-origins=*',
  '--window-size=1536,864','--remote-debugging-port='+debugPort,
  '--user-data-dir='+profile,url],{stdio:'ignore'});
 let tab=null;
 for(let i=0;i<110;i++){
  try{const tabs=await fetch('http://127.0.0.1:'+debugPort+'/json/list').then(x=>x.json());
   tab=tabs.find(t=>t.type==='page'&&t.url.startsWith(url));if(tab)break;
  }catch{}
  if(browser.exitCode!==null)throw Error('Chromium exited during Naming Desk startup');
  await wait(150);
 }
 assert.ok(tab,'Chromium did not open the actual Naming Desk route');
 socket=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((yes,no)=>{socket.addEventListener('open',yes,{once:true});socket.addEventListener('error',no,{once:true})});
 let serial=0;const pending=new Map();
 socket.addEventListener('message',e=>{let p;try{p=JSON.parse(e.data)}catch{return}
  const promise=pending.get(p.id);if(!promise)return;pending.delete(p.id);
  if(p.error)promise.reject(Error(p.error.message));else promise.resolve(p.result);
 });
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++serial;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));
 });
 await cmd('Runtime.enable');
 const evaluate=async expression=>{
  const x=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});
  if(x.exceptionDetails)throw Error('Naming Desk browser exception: '+JSON.stringify(x.exceptionDetails));
  return x.result.value;
 };
 let mounted=false;
 for(let i=0;i<110;i++){
  mounted=await evaluate("Boolean(window.__WTW_NEXT__?.app?.ready&&document.querySelector('#wtwNextgen .ng-naming-desk [data-naming-field]'))");
  if(mounted)break;await wait(120);
 }
 assert.ok(mounted,'Naming Desk was not mounted in approved /next/ UI');
 const get=(name)=>evaluate("(()=>{const e=document.querySelector('#wtwNextgen [data-naming-field="+JSON.stringify(name)+"]');if(!e)return null;const b=e.getBoundingClientRect();return {x:b.left+b.width/2,y:b.top+b.height/2,value:e.value,focused:document.activeElement===e,connected:e.isConnected}})()");
 // CDP pointer events emulate a single physical click, not element.focus().
 const click=async(name)=>{
  const a=await get(name);assert.ok(a&&a.connected,'Missing visible Naming Desk field: '+name);
  assert.ok(a.x>0&&a.y>0,'Naming field is outside the viewport');
  await cmd('Input.dispatchMouseEvent',{type:'mouseMoved',x:a.x,y:a.y});
  await cmd('Input.dispatchMouseEvent',{type:'mousePressed',x:a.x,y:a.y,button:'left',clickCount:1});
  await cmd('Input.dispatchMouseEvent',{type:'mouseReleased',x:a.x,y:a.y,button:'left',clickCount:1});
  await wait(70);
  assert.equal((await get(name))?.focused,true,'One click did not focus '+name);
 };
 const testField=async(name,text)=>{
  await click(name);
  const before=(await get(name)).value;
  for(let i=0;i<4;i++)await evaluate("window.__WTW_NEXT__.paint()"); // reproducible hidden Office redraw pressure
  await evaluate("(()=>{const e=document.querySelector('.app');if(e)e.setAttribute('title','focus-test-'+Math.random())})()");
  await wait(200); // allow MutationObserver repaint attempt
  assert.equal((await get(name))?.focused,true,'Background UI redraw stole focus from '+name);
  await cmd('Input.insertText',{text});
  await wait(80);
  const after=await get(name);
  assert.equal(after.focused,true,'Keystroke focus lost in '+name);
  assert.ok(after.value.includes(text),'Typed text did not persist in '+name+': '+JSON.stringify(after));
  assert.ok(after.value.length>=before.length+text.length,'Field lost previous value during typing');
  return after.value;
 };
 const owner=await testField('ownerName',' New Owner');
 const breeder=await testField('breederName',' New Breeder');
 const story=await testField('story',' Click once to type normally.');
 assert.ok(owner.includes(' New Owner')&&breeder.includes(' New Breeder')&&story.includes(' Click once'));
 // Leaving the editor flushes deferred rendering and rehydrates model values.
 await evaluate("document.querySelector('#wtwNextgen .ng-manager-identity h2')?.click()");
 await wait(160);
 const state=await evaluate("(()=>{const d=window.WTW1999NamingDesk.snapshot();return {fields:d.fields,route:window.__WTW_NEXT__.app.custom,uiCount:document.querySelectorAll('#wtwNextgen').length,active:document.activeElement?.tagName}})()");
 assert.equal(state.fields.ownerName,owner);
 assert.equal(state.fields.breederName,breeder);
 assert.equal(state.fields.story,story);
 assert.equal(state.route,'Stable — Naming Desk');
 assert.equal(state.uiCount,1);
 console.log('WTW_NAMING_DESK_FOCUS_PASS '+JSON.stringify({fieldsTested:3,realClick:true,typing:true,backgroundRedraws:12,gameWrites:0,oneUI:true}));
}finally{
 try{socket?.close()}catch{}
 try{browser?.kill('SIGTERM')}catch{}
 try{server.kill('SIGTERM')}catch{}
 await wait(250);
 rmSync(profile,{recursive:true,force:true,maxRetries:8,retryDelay:150});
}
