import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('public/next/index.html','utf8');
const root=readFileSync('public/index.html','utf8');
const bootstrap=readFileSync('public/next/1999-bootstrap.js','utf8');
const office=readFileSync('public/office-v30-4.js','utf8');
const manager=readFileSync('public/next/next.js','utf8');
const KEY='wtw1999ManagementStateV1';
const SCHEMA='WTW_1999_CLEAN_CAREER_V3';
function start(preload={}){
 const records=new Map(Object.entries(preload));
 const localStorage={
  getItem:key=>records.has(key)?records.get(key):null,
  setItem:(key,v)=>records.set(key,String(v)),
  removeItem:key=>records.delete(key)
 };
 const window={};
 vm.runInNewContext(bootstrap,{localStorage,window,JSON,console});
 return {records,window,state:JSON.parse(records.get(KEY))};
}
test('1999 homepage renders approved original manager, not separate diagnostics UI',()=>{
 assert.match(root,/url=\/next\/\?world=1999/);
 assert.doesNotMatch(root,/url=\/1999\//);
 for(const path of ['/next/next.js','/next/next.css','/next/1999-bootstrap.js','/next/1999-ui-source.mjs'])assert.ok(html.includes(path),path);
 for(const menu of ['Stable','Race Calendar','Sales','World'])assert.ok(html.includes('data-act="'+menu+'"'));
 assert.match(html,/>1999-01-01<\/span>/);
 assert.ok(html.indexOf('/next/1999-bootstrap.js')<html.indexOf('/office-v30-1.js'));
});
test('new session begins with zero old decisions and no race results',()=>{
 const {state,window,records}=start();
 assert.equal(state.schema,SCHEMA);
 assert.equal(state.date,'1999-01-01');
 assert.equal(state.currentCase,'opening-stable');
 assert.equal(state.worldAnchor.startDate,'1999-01-01');
 assert.equal(state.worldAnchor.seed,19990101);
 assert.equal(state.turn,0);
 assert.deepEqual(Object.keys(state.horseState),[]);
 assert.deepEqual(state.decisionLog,[]);
 assert.deepEqual(Object.keys(state.calendarState),[]);
 assert.equal(state.worldAnchor.lastCommittedRaceResult,null);
 assert.equal(state.worldAnchor.lastCommittedTransaction,null);
 assert.equal(window.__WTW_1999_MANAGEMENT__.saveKey,KEY);
 assert.equal(records.get('wtw1999CleanCareerV3'),'active');
});
test('old Office case and save state are never imported into a 1999 world',()=>{
 for(const date of ['2014-07-15','1999-04-12']){
  const old=JSON.stringify({version:'Office FM Track Profile Foundation v30',date,turn:98,
   currentCase:'powerline',horseState:{Powerline:{status:'Entered'}},
   decisionLog:[{caseId:'powerline'}],worldAnchor:{startDate:'1999-01-01'}});
  const x=start({wtwOfficeStateV30:old});
  assert.equal(x.state.date,'1999-01-01');
  assert.equal(x.state.turn,0);
  assert.deepEqual(x.state.decisionLog,[]);
  assert.equal(x.state.horseState.Powerline,undefined);
  assert.equal(x.records.get('wtwOfficeStateV30'),old);
  assert.equal(x.records.has('wtwLegacy2014OfficeBackupV30'),false);
 }
});
test('true 1999 save persists progress without restoring old cases',()=>{
 const one=start();
 const later={...one.state,date:'1999-01-12',turn:11,horseState:{'H-1996-008001':{tested:true}}};
 one.records.set(KEY,JSON.stringify(later));
 const two=start(Object.fromEntries(one.records));
 assert.equal(two.state.date,'1999-01-12');
 assert.equal(two.state.turn,11);
 assert.equal(two.state.horseState['H-1996-008001'].tested,true);
 assert.equal(two.state.currentCase,'opening-stable');
});
test('invalid dated or mislabeled 1999 saves reset to clean Jan 1',()=>{
 const old=JSON.stringify({schema:SCHEMA,date:'2014-07-15',worldAnchor:{schema:SCHEMA,startDate:'1999-01-01',seed:19990101},currentCase:'powerline'});
 const testCases=[
  {[KEY]:old,wtw1999CleanCareerV3:'active'},
  {[KEY]:JSON.stringify({schema:'2014_DEMO',date:'1999-01-12',worldAnchor:{startDate:'1999-01-01'}}),wtw1999CleanCareerV3:'active'}
 ];
 for(const data of testCases){const x=start(data);assert.equal(x.state.date,'1999-01-01');assert.equal(x.state.currentCase,'opening-stable')}
});
test('native Office and manager share ONLY the 1999 state key with no prior-generation loading',()=>{
 assert.match(office,/WTW_1999_MANAGEMENT__\?\.saveKey/);
 assert.match(office,/localStorage\.getItem\(STATE_KEY\);/);
 assert.doesNotMatch(office,/localStorage\.getItem\('wtwOfficeStateV29'\)/);
 assert.doesNotMatch(office,/2014-07-15/);
 assert.match(manager,/window\.__WTW_1999_MANAGEMENT__\?\.saveKey/);
 assert.doesNotMatch(manager,/2014-07-15/);
});
