/* Wire to Wire — 1999 boot bridge for the EXISTING management UI.
 * Preserves the pre-1999/2014 demo save under a separate backup key.
 * Does not replace UI screens, CSS, pedigree/racing authority, or event logic. */
(()=>{
'use strict';
const START='1999-01-01';
const MAIN='wtwOfficeStateV30';
const LEGACY='wtwLegacy2014OfficeBackupV30';
const MARK='wtwManagement1999BootstrapV1';
const NONE={version:'Office FM Track Profile Foundation v30',date:START,currentCase:'powerline',
 turn:0,resolvedCases:{},decisionLog:[],horseState:{},ownerState:{},staffState:{},
 calendarState:{},finances:{},scoutingState:{},messageState:{},followUps:[],
 worldAnchor:{schema:'WTW_1999_CANON_ANCHORED_TEST_V1',startDate:START,seed:19990101,
 status:'DATA_AND_UI_INTEGRATION_IN_PROGRESS',historicalResultsImmutable:true}};
function safeParse(raw){try{const x=JSON.parse(raw);return x&&typeof x==='object'&&!Array.isArray(x)?x:null}catch{return null}}
try{
 const existing=localStorage.getItem(MAIN);
 const state=safeParse(existing);
 const marker=localStorage.getItem(MARK);
 const is1999OrLater=typeof state?.date==='string' && /^19(?:99)|20\d\d-\d\d-\d\d$/.test(state.date) && state.date>=START;
 // Bootstrap only once; never reset an in-progress 1999 career on page reload.
 if(marker!=='active'){
   if(state&&typeof state.date==='string'&&state.date>=START){
     localStorage.setItem(MARK,'active');
   }else{
     if(existing&&!localStorage.getItem(LEGACY))localStorage.setItem(LEGACY,existing);
     localStorage.setItem(MAIN,JSON.stringify(NONE));
     localStorage.setItem(MARK,'active');
   }
 }else if(!state || !is1999OrLater){
   // Reset or invalid earlier-era Office state cannot silently reintroduce 2014.
   if(existing&&!localStorage.getItem(LEGACY))localStorage.setItem(LEGACY,existing);
   localStorage.setItem(MAIN,JSON.stringify(NONE));
 }
}catch(e){
 // Do not make the management UI dependent on browser storage permission.
 window.__WTW_1999_BOOT_WARNING__=String(e?.message||e);
}
window.__WTW_1999_MANAGEMENT__={startDate:START,mode:'CANON_ANCHORED_TEST',
 saveKey:MAIN,priorDemoBackupKey:LEGACY,worldRoute:'/1999/',sourceDirectory:'/data/wtw-1999-world-directory-v33.json',
 status:'UI_RESTORED__SOURCE_RUNTIME_INTEGRATION_IN_PROGRESS'};
})();
