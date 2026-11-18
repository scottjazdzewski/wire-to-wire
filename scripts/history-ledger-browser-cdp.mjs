#!/usr/bin/env node
/** Real Chromium acceptance for the ONE /archive/ historical ledger.
 * Runs on safe sample fallback when D1 is absent in CI. Source claims remain
 * unverified in demo mode; this checks UI behavior only, not history truth. */
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const wait=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const origin='http://127.0.0.1:8897';
const url=origin+'/archive/';
const port=9367;
const chrome=process.env.CHROME||'google-chrome';
const profile=mkdtempSync(join(tmpdir(),'wtw-history-ledger-'));
const server=spawn('python3',['-m','http.server','8897','--bind','127.0.0.1','--directory','public'],{stdio:'ignore'});
let browser,ws;
try{
 let available=false;
 for(let i=0;i<80;i++){
  try{const response=await fetch(url);if(response.ok){available=true;break}}catch{}
  await wait(150);
 }
 assert.ok(available,'Archive local server did not start');
 browser=spawn(chrome,['--headless=new','--no-sandbox','--disable-gpu','--disable-dev-shm-usage',
  '--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-extensions',
  '--remote-allow-origins=*','--window-size=1536,864','--remote-debugging-port='+port,
  '--user-data-dir='+profile,url],{stdio:'ignore'});
 let tab=null;
 for(let i=0;i<120;i++){
  if(browser.exitCode!==null)throw Error('Chromium exited');
  try{const tabs=await fetch('http://127.0.0.1:'+port+'/json/list').then(r=>r.json());tab=tabs.find(x=>x.type==='page'&&x.url.includes('/archive/'));if(tab)break}catch{}
  await wait(150);
 }
 assert.ok(tab,'Archive tab missing');
 ws=new WebSocket(tab.webSocketDebuggerUrl);
 await new Promise((resolve,reject)=>{ws.addEventListener('open',resolve,{once:true});ws.addEventListener('error',reject,{once:true})});
 const pending=new Map();let next=0;
 ws.addEventListener('message',event=>{
  let packet;try{packet=JSON.parse(event.data)}catch{return}
  if(!pending.has(packet.id))return;
  const {resolve,reject}=pending.get(packet.id);pending.delete(packet.id);
  packet.error?reject(Error(packet.error.message)):resolve(packet.result);
 });
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{
  const id=++next;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));
 });
 await cmd('Runtime.enable');
 const evalJS=async expression=>{
  const data=await cmd('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});
  if(data.exceptionDetails)throw Error('History browser exception: '+JSON.stringify(data.exceptionDetails));
  return data.result.value;
 };
 const status=()=>evalJS(`(()=>{
  const main=document.querySelector('#app');
  const table=main?.querySelector('.history-ledger-table');
  const body=main?.querySelector('.history-ledger-table-region');
  const sort=main?.querySelector('button[data-history-sort="year"]')?.closest('th');
  return {title:document.getElementById('page-title')?.textContent||'',
   ledger:!!main?.querySelector('.history-ledger-page:not(.history-year-review)'),
   review:!!main?.querySelector('.history-year-review'),
   rows:table?[...table.querySelectorAll('tbody tr')].map(tr=>tr.querySelector('td:first-child')?.textContent?.trim()||''):[],
   sort:sort?.getAttribute('aria-sort')||null,
   region:!!body&&body.getAttribute('role')==='region'&&body.tabIndex===0,
   classics:main?.querySelectorAll('.history-classic').length||0,
   awardsMissing:!!main?.querySelector('.history-no-awards'),
   reviewTitle:main?.querySelector('.history-year-review h2')?.textContent?.trim()||'',
   returnButton:!!main?.querySelector('[data-history-back]'),
   search:!!main?.querySelector('[data-history-query]'),
   mode:document.getElementById('data-mode')?.textContent||'',
   href:location.href,
   entry:!!document.querySelector('.wtw-return-office')
  };
 })()`);
 async function ready(mode){
  let last;
  for(let i=0;i<110;i++){
   try{last=await status()}catch{}
   if(last?.[mode]&&(mode==='review'||last.rows.length>0))return last;
   await wait(120);
  }
  throw Error('History '+mode+' failed to render: '+JSON.stringify(last));
 }
 let initial=await ready('ledger');
 assert.equal(initial.title,'History Records');
 assert.ok(initial.region&&initial.entry);
 assert.ok(initial.search);
 assert.equal(initial.sort,'descending');
 assert.ok(initial.rows.length>5,'The sample read model did not fill the archive');
 const click=expression=>evalJS(`(()=>{const el=document.querySelector(${JSON.stringify(expression)});if(!el)return false;el.click();return true})()`);
 assert.ok(await click('[data-history-sort="year"]'));
 let asc=await ready('ledger');
 assert.equal(asc.sort,'ascending');
 assert.ok(Number(asc.rows[0])<=Number(asc.rows.at(-1)));
 assert.ok(await click('[data-history-sort="year"]'));
 let desc=await ready('ledger');
 assert.equal(desc.sort,'descending');
 assert.ok(Number(desc.rows[0])>=Number(desc.rows.at(-1)));
 // Filter the entire source list by track; the control must alter real rows.
 const filtered=await evalJS(`(()=>{
  const el=document.querySelector('[data-history-filter="track"]');
  const option=[...el.options].find(x=>x.value==='Pimlico');
  if(!option)return null;
  el.value=option.value;el.dispatchEvent(new Event('change',{bubbles:true}));
  return option.value;
 })()`);
 assert.equal(filtered,'Pimlico');
 let track=await ready('ledger');
 assert.ok(track.rows.length>0&&track.rows.length<=desc.rows.length);
 await evalJS(`(()=>{
  const el=document.querySelector('[data-history-filter="track"]');
  el.value='all';el.dispatchEvent(new Event('change',{bubbles:true}));
 })()`);
 assert.ok(await click('button[data-history-year="1953"]'),'Cannot open 1953 from table');
 let year=await ready('review');
 assert.match(year.reviewTitle,/1953 Year in Review/);
 assert.equal(year.classics,3);
 assert.ok(year.awardsMissing,'Unsourced award winners were fabricated');
 assert.ok(year.returnButton);
 assert.match(year.href,/review=1953/);
 await evalJS('history.back()');
 let returned=await ready('ledger');
 assert.ok(!returned.review,'Browser Back did not reopen full ledger');
 // The annual page is also a durable direct link, not a one-time overlay.
 await cmd('Page.enable');
 await cmd('Page.navigate',{url:origin+'/archive/?page=races&review=1953'});
 const direct=await ready('review');
 assert.equal(direct.classics,3);
 assert.ok(direct.awardsMissing);
 assert.ok(await click('[data-history-back]'));
 const last=await ready('ledger');
 assert.ok(last.region);
 assert.match(last.href,/page=races/);
 assert.doesNotMatch(last.href,/review=1953/);
 console.log('WTW_HISTORY_LEDGER_BROWSER_PASS '+JSON.stringify({
  sortedBothWays:true,trackFilter:true,sourceRows:initial.rows.length,
  annualClassics:direct.classics,awardsNotInvented:direct.awardsMissing,
  browserBack:true,directYearLink:true,returnToLedger:true
 }));
}finally{
 try{ws?.close()}catch{}
 if(browser?.exitCode===null){browser.kill('SIGTERM');await wait(350);if(browser.exitCode===null)browser.kill('SIGKILL')}
 server.kill('SIGTERM');
 rmSync(profile,{recursive:true,force:true,maxRetries:10,retryDelay:120});
}
