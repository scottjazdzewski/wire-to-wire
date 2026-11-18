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
// Gameplay-only opening liquidity, never an assertion about Kingsmere's
// historical books. This belongs to the saved player career, not the source.
const OPENING_CASH_USD=2500000;
function openingFinances(){
 return {stable:{available_cash:OPENING_CASH_USD,currency:'USD',
  status:'Modeled 1999 opening capital · gameplay, not historical'},
  openingCapital:{operation_id:'O-000061',amount_minor:OPENING_CASH_USD*100,
   currency:'USD',provenance:'MODELED_KINGSMERE_1999_PLAYER_OPENING',
   posted:false}};
}
function openingFinanceUpgrade(game){
 const hasFinance=game.finances&&Object.keys(game.finances).length>0;
 const untouched=Object.keys(game.horseState||{}).length===0&&
  Object.keys(game.calendarState||{}).length===0&&
  (game.decisionLog||[]).length===0&&!game.horseDevelopment&&
  game.worldAnchor?.lastCommittedTransaction==null;
 return !hasFinance&&untouched?{...game,finances:openingFinances()}:game;
}

function fresh(profile=selectedWorld){
 const world=window.WTW1999CommercialConfig?.normalize?.(profile)||profile;
 return {
  version:SCHEMA,schema:SCHEMA,date:START,
  currentCase:'opening-stable',turn:0,resolvedCases:{},decisionLog:[],
  horseState:{},ownerState:{},staffState:{},calendarState:{},
  finances:openingFinances(),scoutingState:{},messageState:{},followUps:[],
  // No pre-play 1999 result or transaction and no injected old case effects.
  worldAnchor:{schema:SCHEMA,startDate:START,seed:world.seed,mode:world.mode,
   population:world.population,worldProfile:world,
   historicalResultsImmutable:true,observationsOnly:true,
   lastCommittedRaceResult:null,lastCommittedTransaction:null}
 };
}
function parse(value){try{const x=JSON.parse(value);return x&&typeof x==='object'&&!Array.isArray(x)?x:null}catch{return null}}
function valid(x){
 const date=x?.date;
 const stamp=typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)
  ?Date.parse(date+'T00:00:00Z'):NaN;
 return (x?.schema===SCHEMA||(x?.schema==null&&x?.version===SCHEMA))&&
  x?.worldAnchor?.schema===SCHEMA&&x?.worldAnchor?.startDate===START&&
  x.worldAnchor.mode==='FOUNDING_1999'&&x.worldAnchor.population===73&&
  x.worldAnchor.worldProfile?.mode==='FOUNDING_1999'&&
  x.worldAnchor.worldProfile?.population===73&&
  Number.isSafeInteger(x?.worldAnchor?.seed)&&x.worldAnchor.seed>0&&
  x.worldAnchor.seed<=4294967295&&
  (x.worldAnchor.worldProfile.seed==null||x.worldAnchor.seed===x.worldAnchor.worldProfile.seed)&&
  x.currentCase!=='powerline'&&Number.isFinite(stamp)&&
  new Date(stamp).toISOString().slice(0,10)===date&&date>=START;
}
function restoreCareer(payload){
 if(!valid(payload))
  throw Error('Only a valid founding 1999 career can be loaded here.');
 const serialized=JSON.stringify({...payload,schema:SCHEMA});
 // Startup restores this snapshot, including its own training state. The
 // current career's save handler must not merge training into a loaded slot.
 localStorage.setItem(SESSION,'active');
 localStorage.setItem(MAIN,serialized);
}
// Naming feedback is kept INSIDE the current career snapshot. It is not
// a second localStorage key or a second save authority. Compact .wtwsave
// differential exports automatically include the optional field.
function readNamingFeedback(){
 const game=parse(localStorage.getItem(MAIN));
 if(!valid(game))throw Error('No valid active career for naming decisions');
 return game.namingFeedback??null;
}
function commitNamingFeedback(next,expectedRevision){
 const game=parse(localStorage.getItem(MAIN));
 if(!valid(game))throw Error('No valid active career for naming decisions');
 const old=game.namingFeedback;
 const revision=old?.revision??0;
 if(!Number.isSafeInteger(expectedRevision)||revision!==expectedRevision)
  throw Error('Naming choices changed in another game session; reload first');
 if(!next||next.schema!=='WTW_HORSE_NAMING_FEEDBACK_V1'||
  next.revision!==revision+1||!Array.isArray(next.events)||
  next.events.length!==next.revision||
  !next.decisions||typeof next.decisions!=='object')
  throw Error('Invalid next naming decision');
 // The controller provides a fully validated pure ledger; only this
 // existing career writer changes the saved in-progress game snapshot.
 const update={...game,namingFeedback:JSON.parse(JSON.stringify(next))};
 localStorage.setItem(MAIN,JSON.stringify(update)); // quota failure throws
 if(parse(localStorage.getItem(MAIN))?.namingFeedback?.revision!==next.revision)
  throw Error('Naming feedback write could not be verified');
 return update.namingFeedback;
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
 else{
  const seeded=openingFinanceUpgrade(previous);
  if(seeded!==previous)localStorage.setItem(MAIN,JSON.stringify(seeded));
 }
 localStorage.setItem(SESSION,'active');
}catch(error){window.__WTW_1999_BOOT_WARNING__=String(error?.message||error)}
window.__WTW_1999_MANAGEMENT__={
 schema:SCHEMA,startDate:START,seed:selectedWorld.seed,mode:selectedWorld.mode,worldProfile:selectedWorld,
 readNamingFeedback,commitNamingFeedback,
 gameSaveKey:MAIN,saveKey:MAIN,createFreshState:fresh,validateCareer:valid,restoreCareer,
 namedSaveKey:'wtw1999FoundingNamedSavesV1',
 historyArchive:'/archive/?page=seasons',
 status:'FOUNDING_WORLD_JAN1_1999__ISOLATED_CAREER__CANON_ARCHIVE_PRESERVED'
};
})();
