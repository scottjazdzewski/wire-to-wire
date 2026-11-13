/* WTW January 1999 user-approved CLEAN opening; zero racing horses.
 * Only the small founding scenario, approved staff and 118 tracks remain.
 * Old generated worlds and their browser save keys are retired and purged. */
(()=>{
'use strict';
const START='1999-01-01', MAIN='wtw1999FoundingStateV1';
const CLEAN_RESET='wtw1999UserApprovedCleanResetV2';
const RETIRED_KEYS=['wtw:1999:test-universe-mode:v1','wtw:1999:test-universe-save:v1',
 'wtw1999FoundingNamedSavesV1','wtwFoundingWorldProfileV1'];
const SCHEMA='WTW_1999_FOUNDING_CAREER_V1', SESSION='wtw1999FoundingSessionV1';
const SEED=19990101;
const selectedWorld=window.WTW1999CommercialConfig?.current?.()||{population:73,mode:'FOUNDING_1999',seed:SEED};

function fresh(profile=selectedWorld){
 const world=window.WTW1999CommercialConfig?.normalize?.(profile)||profile;
 return {
  version:SCHEMA,schema:SCHEMA,date:START,
  currentCase:'opening-stable',turn:0,resolvedCases:{},decisionLog:[],
  horseState:{},ownerState:{},staffState:{},calendarState:{},
  finances:{},scoutingState:{},messageState:{},followUps:[],
  // No pre-play 1999 result or transaction and no injected old case effects.
  worldAnchor:{schema:SCHEMA,startDate:START,seed:world.seed,mode:world.mode,
   population:world.population,worldProfile:world,
   historicalResultsImmutable:true,observationsOnly:true,
   lastCommittedRaceResult:null,lastCommittedTransaction:null}
 };
}
function parse(value){try{const x=JSON.parse(value);return x&&typeof x==='object'&&!Array.isArray(x)?x:null}catch{return null}}
function valid(x){
 return x?.worldAnchor?.schema===SCHEMA&&x?.worldAnchor?.startDate===START&&
  x.worldAnchor.mode==='FOUNDING_1999'&&x.worldAnchor.population===73&&
  x.worldAnchor.worldProfile?.mode==='FOUNDING_1999'&&
  x.worldAnchor.worldProfile?.population===73&&
  Number.isSafeInteger(x?.worldAnchor?.seed)&&x.worldAnchor.seed>0&&
  x.worldAnchor.seed<=4294967295&&x.currentCase!=='powerline'&&typeof x.date==='string'&&
  /^\d{4}-\d{2}-\d{2}$/.test(x.date)&&x.date>=START;
}
try{
 // Clear the retired generated-world browser saves ONCE per device. This does
 // not touch approved historical source records in Drive or D1.
 if(localStorage.getItem(CLEAN_RESET)!=='approved-small-1999'){
  for(const key of RETIRED_KEYS)localStorage.removeItem(key);
  localStorage.removeItem(MAIN);
  localStorage.removeItem(SESSION);
  // Old compact careers are a different IndexedDB store from clean V2;
  // no legacy import or retroactive population can be invoked.
  try{window.indexedDB?.deleteDatabase?.('WireToWireFoundingCareersV1')}catch{}
  localStorage.setItem(CLEAN_RESET,'approved-small-1999');
 }
 const previous=parse(localStorage.getItem(MAIN));
 const keep=valid(previous)&&localStorage.getItem(SESSION)==='active';
 if(!keep)localStorage.setItem(MAIN,JSON.stringify(fresh()));
 localStorage.setItem(SESSION,'active');
}catch(error){window.__WTW_1999_BOOT_WARNING__=String(error?.message||error)}
window.__WTW_1999_MANAGEMENT__={
 schema:SCHEMA,startDate:START,seed:selectedWorld.seed,mode:selectedWorld.mode,worldProfile:selectedWorld,
 gameSaveKey:MAIN,saveKey:MAIN,createFreshState:fresh,namedSaveKey:'wtw1999FoundingNamedSavesV1',
 historyArchive:'/archive/?page=seasons',
 status:'FOUNDING_WORLD_JAN1_1999__ISOLATED_CAREER__CANON_ARCHIVE_PRESERVED'
};
})();
