import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const html=readFileSync('public/next/index.html','utf8');
const root=readFileSync('public/index.html','utf8');
const bootstrap=readFileSync('public/next/1999-bootstrap.js','utf8');
const JS=(s)=>JSON.parse(s);
function start(preload={}){
 const records=new Map(Object.entries(preload));
 const localStorage={
  getItem:key=>records.has(key)?records.get(key):null,
  setItem:(key,v)=>records.set(key,String(v)),
  removeItem:key=>records.delete(key)
 };
 const window={};
 vm.runInNewContext(bootstrap,{localStorage,window,JSON,console});
 return {records,window,state:JS(records.get('wtwOfficeStateV30'))};
}
test('1999 main entry uses the original approved multi-screen UI and no diagnostic replacement',()=>{
 assert.match(root,/url=\/next\/\?world=1999/);
 assert.doesNotMatch(root,/url=\/1999\//);
 for(const path of ['/next/next.js','/next/next.css','/next/1999-bootstrap.js','/next/1999-ui-source.mjs'])
  assert.ok(html.includes(path),path);
 for(const action of ['Stable','Race Calendar','Sales','World'])assert.ok(html.includes('data-act="'+action+'"'));
 assert.match(html,/>1999-01-01<\/span>/);
 assert.ok(html.indexOf('/next/1999-bootstrap.js')<html.indexOf('/office-v30-1.js'));
});
test('first launch is 1999-01-01 and no old demo decisions or outcomes survive',()=>{
 const x=start();
 assert.equal(x.state.date,'1999-01-01');
 assert.equal(x.state.worldAnchor.schema,'WTW_1999_CLEAN_CAREER_V2');
 assert.equal(x.state.worldAnchor.startDate,'1999-01-01');
 assert.equal(x.state.worldAnchor.seed,19990101);
 assert.equal(x.state.turn,0);
 assert.deepEqual(Object.keys(x.state.horseState),[]);
 assert.deepEqual(x.state.decisionLog,[]);
 assert.deepEqual(Object.keys(x.state.calendarState),[]);
 assert.equal(x.records.get('wtw1999CleanCareerV2'),'active');
 assert.equal(x.window.__WTW_1999_MANAGEMENT__.startDate,'1999-01-01');
});
test('old 2014 demo and early 1999 experiments are not imported',()=>{
 for(const date of ['2014-07-15','1999-04-12']){
  const old=JSON.stringify({version:'Office FM Track Profile Foundation v30',date,turn:98,
   currentCase:'powerline',horseState:{Powerline:{status:'Entered'}},
   decisionLog:[{caseId:'powerline'}]});
  const x=start({wtwOfficeStateV30:old});
  assert.equal(x.state.date,'1999-01-01');
  assert.equal(x.state.turn,0);
  assert.deepEqual(x.state.decisionLog,[]);
  assert.ok(!x.state.horseState.Powerline);
  assert.equal(x.records.has('wtwLegacy2014OfficeBackupV30'),false);
 }
});
test('clean 1999 career progresses and survives reload',()=>{
 const a=start();
 const saved={...a.state,date:'1999-01-12',turn:11,horseState:{'H-1996-008001':{tested:true}}};
 a.records.set('wtwOfficeStateV30',JSON.stringify(saved));
 const b=start(Object.fromEntries(a.records));
 assert.equal(b.state.date,'1999-01-12');
 assert.equal(b.state.turn,11);
 assert.equal(b.state.horseState['H-1996-008001'].tested,true);
});
test('leaked invalid older-era active session is rejected',()=>{
 const stale=JSON.stringify({date:'2014-07-15',version:'old',worldAnchor:{startDate:'1999-01-01'}});
 const x=start({wtw1999CleanCareerV2:'active',wtwOfficeStateV30:stale});
 assert.equal(x.state.date,'1999-01-01');
});
