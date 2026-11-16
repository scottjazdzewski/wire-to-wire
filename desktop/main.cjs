'use strict';
/* G1 Windows shell for the ONE existing Wire to Wire game.
 * No hosted game URL, no HTTP server, no separate simulation or UI.
 * Compact career slots use G3's first native-store slice; active autosave is
 * still browser-origin. Real-history content is optional for fictional launch.
 */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {app,BrowserWindow,protocol,net,session,dialog,ipcMain}=require('electron');
const {bundledFile,htmlContentSecurityPolicy}=require('./local-content.cjs');
const {createCareerStore}=require('./career-store.cjs');

const ORIGIN='wtw://game';
const args=process.argv.slice(1);
const startupStartedAt=process.hrtime.bigint();
const startupMilestones={};
function markStartup(name){
 startupMilestones[name]=Number(process.hrtime.bigint()-startupStartedAt)/1e6;
}
function option(name){
 const flag='--'+name+'=';
 const item=args.find(a=>a.startsWith(flag));
 return item?item.slice(flag.length):null;
}
// The portable Windows wrapper may not forward process arguments. The test
// runner also uses inherited environment variables, which reach the extracted
// Electron child without requiring an installer or a launcher rewrite.
const smokePhase=option('wtw-smoke')||process.env.WTW_SMOKE_PHASE||null;
const smokeReport=option('wtw-smoke-report')||process.env.WTW_SMOKE_REPORT||null;
const smokeUserData=option('wtw-smoke-user-data')||process.env.WTW_SMOKE_USER_DATA||null;
function recordBootFailure(context,error){
 const description=String(error?.stack||error?.message||error||'Unknown startup error');
 let logfile='Unavailable';
 try{
  logfile=path.join(app.getPath('userData'),'wtw-startup-diagnostics.log');
  fs.mkdirSync(path.dirname(logfile),{recursive:true});
  fs.appendFileSync(logfile,'['+new Date().toISOString()+'] '+context+'\n'+description+'\n','utf8');
 }catch(writeError){
  console.error('Unable to write startup diagnostics',String(writeError));
 }
 console.error('WTW DESKTOP STARTUP:',context,description,'Diagnostic file:',logfile);
 if(!smokePhase&&app.isReady()){
  try{dialog.showErrorBox('Wire to Wire could not open',
   'The game encountered an error while starting.\n\n'+
   description.slice(0,450)+'\n\nDiagnostic file:\n'+logfile+
   '\n\nYour saved careers have not been deleted.');}
  catch(dialogError){console.error('Unable to show startup error window',String(dialogError));}
 }
}
process.on('uncaughtException',error=>recordBootFailure('uncaughtException',error));
process.on('unhandledRejection',error=>recordBootFailure('unhandledRejection',error));
app.setName('Wire to Wire');
if(smokeUserData){
 const userPath=path.resolve(smokeUserData);
 fs.mkdirSync(userPath,{recursive:true});
 app.setPath('userData',userPath);
}
if(process.platform==='win32')app.setAppUserModelId('com.wiretowire.racingmanager');
protocol.registerSchemesAsPrivileged([{
 scheme:'wtw',privileges:{standard:true,secure:true,supportFetchAPI:true}
}]);
const contentRoot=app.isPackaged
 ?path.join(process.resourcesPath,'game-public')
 :path.resolve(__dirname,'..','public');

function reportSmoke(details,passed){
 const evidence={...details,startup:{...startupMilestones,
  totalMs:Number(process.hrtime.bigint()-startupStartedAt)/1e6}};
 if(smokeReport){
  const filename=path.resolve(smokeReport);
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,JSON.stringify(evidence,null,2)+'\n','utf8');
 }
 console.log('WTW_DESKTOP_SMOKE_'+(passed?'PASS ':'FAIL ')+JSON.stringify(evidence));
 app.exit(passed?0:1);
}

function restrictNetwork(){
 // Game resources come only from the bundled "wtw://game" protocol.
 // Other URLs have no permitted runtime path, even if code requests them.
 session.defaultSession.webRequest.onBeforeRequest({
  urls:['http://*/*','https://*/*','ws://*/*','wss://*/*']
 },(_details,callback)=>callback({cancel:true}));
 session.defaultSession.setPermissionRequestHandler((_webContents,_permission,callback)=>callback(false));
 session.defaultSession.setPermissionCheckHandler(()=>false);
}

function registerCareerStorage(){
 const store=createCareerStore(path.join(app.getPath('userData'),'careers-v1'));
 const trustedSender=event=>{
  try{return new URL(event.senderFrame?.url||'').origin===ORIGIN}
  catch{return false}
 };
 const handle=(channel,action)=>ipcMain.handle(channel,async(event,...args)=>{
  if(!trustedSender(event))throw Error('Career storage request came from an untrusted page');
  return action(...args);
 });
 handle('wtw-careers:list',()=>store.list());
 handle('wtw-careers:get',id=>store.get(id));
 handle('wtw-careers:put',(meta,record)=>store.put(meta,record));
 handle('wtw-careers:remove',id=>store.remove(id));
}

const mediaTypes=Object.freeze({
 '.html':'text/html; charset=utf-8',
 '.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8',
 '.cjs':'text/javascript; charset=utf-8',
 '.json':'application/json; charset=utf-8',
 '.css':'text/css; charset=utf-8',
 '.svg':'image/svg+xml',
 '.png':'image/png',
 '.jpg':'image/jpeg',
 '.jpeg':'image/jpeg',
 '.webp':'image/webp',
 '.gif':'image/gif',
 '.ico':'image/x-icon',
 '.woff':'font/woff',
 '.woff2':'font/woff2',
 '.ttf':'font/ttf',
 '.wasm':'application/wasm'
});

async function serveLocalAsset(request){
 const filename=bundledFile(contentRoot,request.url);
 if(!filename)return new Response('Bundled game resource is unavailable offline',{status:404});
 try{
  const result=await net.fetch(pathToFileURL(filename).toString());
  if(!result.ok)return result;
  const ext=path.extname(filename).toLowerCase();
  const headers=new Headers(result.headers);
  headers.set('Content-Type',mediaTypes[ext]||'application/octet-stream');
  headers.set('X-Content-Type-Options','nosniff');
  if(ext==='.html')headers.set('Content-Security-Policy',htmlContentSecurityPolicy);
  return new Response(result.body,{status:result.status,headers});
 }catch(error){
  console.error('Missing bundled asset:',path.relative(contentRoot,filename),error?.message);
  return new Response('Bundled asset missing',{status:404});
 }
}

function openGameWindow(){
 const win=new BrowserWindow({
  title:'Wire to Wire — Racing Manager',
  width:1536,height:864,minWidth:1040,minHeight:680,
  backgroundColor:'#131c1d',
  autoHideMenuBar:true,
  // The original smoke test hid the actual window, masking user-visible startup failures.
  show:!smokePhase||smokePhase==='visible',
  webPreferences:{
   sandbox:true,contextIsolation:true,nodeIntegration:false,webSecurity:true,
   allowRunningInsecureContent:false,webviewTag:false,
   preload:path.join(__dirname,'preload.cjs')
  }
 });
 win.webContents.setWindowOpenHandler(()=>({action:'deny'}));
 win.webContents.on('will-navigate',(event,url)=>{
  if(!url.startsWith(ORIGIN+'/'))event.preventDefault();
 });
 win.webContents.on('did-fail-load',(_event,code,description,url,isMainFrame)=>{
  if(isMainFrame&&code!==-3)recordBootFailure(
   'Failed to load the main game document ('+code+'): '+url,description);
  else console.error('Game resource failed:',code,description,url);
 });
 win.webContents.on('render-process-gone',(_event,details)=>
  recordBootFailure('Game renderer exited unexpectedly',JSON.stringify(details)));
 win.on('unresponsive',()=>
  recordBootFailure('Game window became unresponsive','Windows could not display the active game window.'));
 win.webContents.once('did-finish-load',()=>markStartup('documentLoaded'));
 markStartup('windowCreated');

 return win;
}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const browserProbe=[
 '(()=>{',
 ' const root=document.getElementById("wtwNextgen");',
 ' const management=window.__WTW_1999_MANAGEMENT__;',
 ' let saved=null;',
 ' try{saved=JSON.parse(localStorage.getItem(management?.saveKey)||"null")}catch{}',
 ' return {',
 '  title:document.title,origin:location.origin,',
 '  gameVisible:!!root&&root.textContent.trim().length>100,',
 '  // Confirm real layout pixels rather than trusting hidden-window DOM text.',
 '  frameWidth:root?.getBoundingClientRect().width||0,',
 '  frameHeight:root?.getBoundingClientRect().height||0,',
 '  renderedButtons:root?.querySelectorAll("button").length||0,',
 '  cssDisplay:root?getComputedStyle(root).display:"missing",',
 '  cssVisibility:root?getComputedStyle(root).visibility:"missing",',
 '  oldOfficeHidden:!!document.querySelector("[data-wtw-layout=\\"legacy-data-bridge\\"][hidden]"),',
 '  date:saved?.date||null,schema:management?.schema||null,',
 '  desktop:window.WTWDesktop?.runtime||null,',
 '  savedMarker:localStorage.getItem("WTW_DESKTOP_G1_REOPEN_PROOF")',
 ' };',
 '})()'
].join('\n');

async function runSmoke(win){
 const deadline=Date.now()+90000;
 let last=null;
 while(Date.now()<deadline){
  if(win.isDestroyed())throw Error('Main window closed during desktop startup');
  try{last=await win.webContents.executeJavaScript(browserProbe,true)}
  catch(error){last={error:String(error?.message||error)}}
  if(last?.gameVisible&&last.oldOfficeHidden&&last.schema&&last.date&&
     last.desktop==='windows-desktop')break;
  await sleep(450);
 }
 if(!last?.gameVisible||!last.oldOfficeHidden||!last.schema||!last.date||
    last.desktop!=='windows-desktop')throw Error('Game UI did not initialize: '+JSON.stringify(last));
 if(last.origin!==ORIGIN)throw Error('Application loaded an unexpected origin: '+last.origin);
 markStartup('gameUIReady');
 if(smokePhase==='visible'){
  // GitHub's Windows runner uses a noninteractive service session; a Chromium
  // capture there can contain only background pixels although the DOM is ready.
  // Assert a visibly laid-out live game and preserve the screenshot, but never
  // claim a screenshot from a noninteractive runner is manual visual QA.
  if(!win.isVisible())throw Error('Desktop game window is not visible');
  const size=win.getBounds();
  if(size.width<1000||size.height<600)throw Error('Unexpectedly small desktop window');
  if(last.frameWidth<900||last.frameHeight<450||last.renderedButtons<5||
     last.cssDisplay==='none'||last.cssVisibility!=='visible')
   throw Error('The game UI lacks a visible rendered layout: '+JSON.stringify(last));
  await sleep(1600);
  const screenshot=(await win.webContents.capturePage()).toPNG();
  if(smokeReport){
   const screenshotPath=path.join(path.dirname(path.resolve(smokeReport)),'wtw-visible-desktop.png');
   fs.writeFileSync(screenshotPath,screenshot);
  }
  reportSmoke({
   phase:'visible',bundledOrigin:last.origin,gameDate:last.date,
   gameInterface:'ONE_APPROVED_UI',windowVisible:true,
   windowWidth:size.width,windowHeight:size.height,
   frameWidth:last.frameWidth,frameHeight:last.frameHeight,
   renderedButtons:last.renderedButtons,
   screenshotBytes:screenshot.length,
   screenshotStatus:screenshot.length>=25000?'CAPTURE_RECORDED':
     'NONINTERACTIVE_WINDOWS_RUNNER_UNVERIFIED',
   humanVisibleWindowCertification:'NOT_YET_VERIFIED_ON_END_USER_MACHINE',
   retailCertification:'NOT_YET_DESKTOP_CERTIFIED'
  },true);
  return;
 }
 if(smokePhase==='write'){
  await win.webContents.executeJavaScript(
   'localStorage.setItem("WTW_DESKTOP_G1_REOPEN_PROOF","LOCAL_FIRST_1999");true;',true);
  const wroteCareer=await win.webContents.executeJavaScript(
   'window.WTWDesktop.careers.put('+JSON.stringify({
    id:'career-desktop-smoke-000001',name:'Desktop storage smoke',date:'1999-01-01',
    createdAt:'2026-11-14T00:00:00.000Z',updatedAt:'2026-11-14T00:00:00.000Z',bytes:4
   })+',{header:{schema:"WTW_COMPACT_CAREER_V1",size:4,checksum:"smoke"},'+
   'bytes:new Uint8Array([87,84,87,49])}).then(()=>true)',true);
  if(!wroteCareer)throw Error('Desktop-owned career storage write did not complete');
 }else if(smokePhase==='read'){
  if(last.savedMarker!=='LOCAL_FIRST_1999')
   throw Error('App-local state was lost across a real Windows process restart');
  const recoveredCareer=await win.webContents.executeJavaScript(
   '(async()=>{const c=await window.WTWDesktop.careers.get("career-desktop-smoke-000001");'+
   'const ok=c.meta.name==="Desktop storage smoke"&&'+
   'Array.from(c.bytes).join(",")==="87,84,87,49";'+
   'if(!ok)throw Error("Desktop career payload changed across process restart");'+
   'await window.WTWDesktop.careers.remove(c.meta.id);return true})()',true);
  if(!recoveredCareer)throw Error('Desktop-owned career storage did not reopen');
 }else throw Error('Unknown smoke test phase '+smokePhase);
 reportSmoke({
  phase:smokePhase,bundledOrigin:last.origin,
  gameDate:last.date,foundingSchema:last.schema,gameInterface:'ONE_APPROVED_UI',
  appLocalStorageReopen:smokePhase==='read'?'VERIFIED':'WRITTEN',
  desktopCompactCareerStoreReopen:smokePhase==='read'?'VERIFIED':'WRITTEN',
  careerSaveAuthority:'PARTIAL_NATIVE_COMPACT_SLOTS; ACTIVE_GAME_AUTOSAVE_STILL_LOCALSTORAGE',
  realHistoryModule:'OPTIONAL_FUTURE_WORK; NOT_REQUIRED_FOR_FICTIONAL_LAUNCH',
  retailCertification:'NOT_YET_DESKTOP_CERTIFIED'
 },true);
}

app.whenReady().then(async()=>{
 markStartup('appReady');
 restrictNetwork();
 registerCareerStorage();
 protocol.handle('wtw',serveLocalAsset);
 markStartup('protocolReady');
 const win=openGameWindow();
 // Existing approved UI entry point: wtw://game/next/index.html.
 await win.loadURL(ORIGIN+'/next/index.html');
 if(!smokePhase){win.show();win.focus();}
 if(smokePhase)await runSmoke(win);
}).catch(error=>{
 const description=String(error?.stack||error?.message||error);
 recordBootFailure('Application initialization',description);
 if(smokePhase)reportSmoke({phase:smokePhase,error:description},false);
});
app.on('window-all-closed',()=>app.quit());
