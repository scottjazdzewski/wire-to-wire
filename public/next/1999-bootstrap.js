/* Wire to Wire 1999: clean management-game bootstrap.
 * The approved UI is preserved. No 2014 case, save, finance or horse state may be
 * used to initialize a 1999 game, including when loading a browser on a phone.
 */
(()=>{
 'use strict';
 const START='1999-01-01';
 const KEY='wtw1999ManagementStateV1';
 const SCHEMA='WTW_1999_CLEAN_MANAGEMENT_V1';
 const fresh=()=>({
   schema:SCHEMA,version:'WTW 1999 Management v1',
   date:START,worldStartDate:START,currentCase:'opening-stable',turn:0,
   resolvedCases:{},decisionLog:[],horseState:{},ownerState:{},
   staffState:{},calendarState:{},finances:{},scoutingState:{},
   messageState:{},followUps:[],enteredRaces:[],committedResults:[],
   worldAnchor:{schema:'WTW_1999_CANON_ANCHORED_TEST_V1',
     startDate:START,seed:19990101,canonHistoryImmutable:true,
     status:'SOURCE_WORLD_TEST__RACE_ENGINE_NOT_YET_COMMITTED'}
 });
 const valid=x=>x&&typeof x==='object'&&!Array.isArray(x)&&
   x.schema===SCHEMA&&x.worldAnchor?.startDate===START&&
   typeof x.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x.date)&&
   x.date>=START&&x.currentCase!=='powerline'&&
   Array.isArray(x.decisionLog)&&Array.isArray(x.committedResults);
 window.__WTW_1999_MANAGEMENT__={
   startDate:START,mode:'CANON_ANCHORED_TEST',saveKey:KEY,saveSchema:SCHEMA,
   worldRoute:'/1999/',sourceDirectory:'/data/wtw-1999-world-directory-v33.json',
   status:'CLEAN_1999_UI__SOURCE_RUNTIME_NOT_FULL_PLAYABLE'
 };
 try{
   let data=null;
   try{data=JSON.parse(localStorage.getItem(KEY)||'null')}catch{}
   if(!valid(data))localStorage.setItem(KEY,JSON.stringify(fresh()));
 }catch(e){window.__WTW_1999_BOOT_WARNING__=String(e?.message||e)}
})();
