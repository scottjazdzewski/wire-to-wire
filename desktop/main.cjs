'use strict';
/* G1 Windows shell for the ONE existing Wire to Wire game.
 * No hosted game URL, no HTTP server, no separate simulation or UI.
 * G2 local D1 historical pack and G3 desktop-owned career storage remain open.
 */
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const {app,BrowserWindow,protocol,net,session}=require('electron');
const {bundledFile,htmlContentSecurityPolicy}=require('./local-content.cjs');

const ORIGIN='wtw://game';
const args=process.argv.slice(1);
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
 if(smokeReport){
  const filename=path.resolve(smokeReport);
  fs.mkdirSync(path.dirname(filename),{recursive:true});
  fs.writeFileSync(filename,JSON.stringify(details,null,2)+'\n','utf8');
 }
 console.log('WTW_DESKTOP_SMOKE_'+(passed?'PASS ':'FAIL ')+JSON.stringify(details));
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
 if(!filename)return new Response('Unavailable offline; historical data migration pending',{status:404});
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
  show:!smokePhase,
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
 win.webContents.on('did-fail-load',(_event,code,description,url)=>{
  console.error('Desktop document load failed:',code,description,url);
 });
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
 if(smokePhase==='write'){
  await win.webContents.executeJavaScript(
   'localStorage.setItem("WTW_DESKTOP_G1_REOPEN_PROOF","LOCAL_FIRST_1999");true;',true);
 }else if(smokePhase==='read'){
  if(last.savedMarker!=='LOCAL_FIRST_1999')
   throw Error('App-local state was lost across a real Windows process restart');
 }else throw Error('Unknown smoke test phase '+smokePhase);
 reportSmoke({
  phase:smokePhase,bundledOrigin:last.origin,
  gameDate:last.date,foundingSchema:last.schema,gameInterface:'ONE_APPROVED_UI',
  appLocalStorageReopen:smokePhase==='read'?'VERIFIED':'WRITTEN',
  careerSaveAuthority:'CURRENT_INDEXEDDB_TRANSITION_ONLY',
  offlineHistoricalD1:'G2_NOT_YET_MIGRATED',
  retailCertification:'NOT_YET_DESKTOP_CERTIFIED'
 },true);
}

app.whenReady().then(async()=>{
 restrictNetwork();
 protocol.handle('wtw',serveLocalAsset);
 const win=openGameWindow();
 await win.loadURL(ORIGIN+'/next/index.html');
 if(smokePhase)await runSmoke(win);
}).catch(error=>{
 const description=String(error?.stack||error?.message||error);
 console.error('WTW desktop boot failure:',description);
 if(smokePhase)reportSmoke({phase:smokePhase,error:description},false);
});
app.on('window-all-closed',()=>app.quit());
