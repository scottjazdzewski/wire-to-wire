/* Jan 1, 1999 is the only gameplay epoch in the approved management UI.
 * The old Office engine is a PRESENTATION COMPATIBILITY SHELL, not game history.
 * Older demo state, decisions, follow-ups and named saves are NOT imported. */
(()=>{
'use strict';
const START='1999-01-01', MAIN='wtw1999ManagementStateV1';
const SCHEMA='WTW_1999_CLEAN_CAREER_V3', SESSION='wtw1999CleanCareerV3';
const SEED=19990101;
const selectedWorld=window.WTW1999CommercialConfig?.current?.()||{population:325000,mode:'CANON_ANCHORED_TEST',seed:SEED};

function fresh(profile=selectedWorld){
 const world=window.WTW1999CommercialConfig?.normalize?.(profile)||profile;
 return {
  version:'WTW_1999_CLEAN_CAREER_V3',schema:SCHEMA,date:START,
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
  x?.worldAnchor?.seed===SEED&&x.currentCase!=='powerline'&&typeof x.date==='string'&&
  /^\d{4}-\d{2}-\d{2}$/.test(x.date)&&x.date>=START;
}
try{
 // Do not reuse 2014 or early experimental 1999 sessions. The first launch of
 // this schema creates a clean opening world, then subsequent reloads preserve
 // this session's own date and approved test operations.
 const previous=parse(localStorage.getItem(MAIN));
 const keep=valid(previous)&&localStorage.getItem(SESSION)==='active';
 // The opening profile belongs to its save: loading an older saved career
 // restores its own source mode, seed, and population instead of today's UI selection.
 if(!keep)localStorage.setItem(MAIN,JSON.stringify(fresh()));
 localStorage.setItem(SESSION,'active');
 // Old-era saved demo state is not part of this new universe.
 // Do not touch historical canon or other unrelated files.
}catch(e){window.__WTW_1999_BOOT_WARNING__=String(e?.message||e)}
window.__WTW_1999_MANAGEMENT__={
 schema:SCHEMA,startDate:START,seed:selectedWorld.seed,mode:selectedWorld.mode,worldProfile:selectedWorld,
 gameSaveKey:MAIN,saveKey:MAIN,createFreshState:fresh,namedSaveKey:'wtw1999NamedGameSavesV1',
 historyArchive:'/archive/?page=seasons',
 status:'CLEAN_JAN1_1999__APPROVED_UI__NO_2014_DEMO_HISTORY'
};
})();
