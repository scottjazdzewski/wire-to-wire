import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const html=readFileSync('public/next/index.html','utf8');
const main=readFileSync('public/index.html','utf8');
const classic=readFileSync('public/legacy-2014/index.html','utf8');
const bootstrap=readFileSync('public/next/1999-bootstrap.js','utf8');
function start(preload={}){
 const records=new Map(Object.entries(preload));
 const localStorage={
  getItem:key=>records.has(key)?records.get(key):null,
  setItem:(key,v)=>{records.set(key,String(v))},
  removeItem:key=>records.delete(key)
 };
 const window={};
 vm.runInNewContext(bootstrap,{localStorage,window,JSON,console});
 return {records,window,game:JSON.parse(records.get('wtwOfficeStateV30')||'null')};
}
test('restored homepage opens the approved multi-screen manager, not the diagnostic dashboard',()=>{
 assert.match(main,/url=\/next\/\?world=1999/);
 assert.doesNotMatch(main,/url=\/1999\//);
 assert.match(html,/\/next\/next\.js/);
 assert.match(html,/\/next\/next\.css/);
 assert.match(html,/>1999-01-01<\/span>/);
 assert.match(html,/data-act="Stable"/);
 assert.match(html,/data-act="Race Calendar"/);
 assert.match(html,/data-act="Sales"/);
 assert.match(html,/data-act="World"/);
});
test('1999 boot runs before original Office scripts so state hydration uses 1999',()=>{
 const bootstrapIndex=html.indexOf('/next/1999-bootstrap.js');
 const classicIndex=html.indexOf('/office-v30-1.js');
 assert.ok(bootstrapIndex>0&&classicIndex>bootstrapIndex);
 assert.match(bootstrap,/WTW_1999_CANON_ANCHORED_TEST_V1/);
 const result=start();
 assert.equal(result.game.date,'1999-01-01');
 assert.equal(result.game.worldAnchor.seed,19990101);
 assert.equal(result.records.get('wtwManagement1999BootstrapV1'),'active');
});
test('existing 2014 prototype state is archived, never deleted',()=>{
 const legacy=JSON.stringify({version:'Office FM Track Profile Foundation v30',date:'2014-07-15',turn:17,resolvedCases:{some:'old'}});
 const result=start({wtwOfficeStateV30:legacy});
 assert.equal(result.records.get('wtwLegacy2014OfficeBackupV30'),legacy);
 assert.equal(result.game.date,'1999-01-01');
 assert.equal(result.game.turn,0);
 assert.match(classic,/2014-07-15/);
});
test('an existing 1999 career is preserved intact on every reload',()=>{
 const game=JSON.stringify({version:'Office FM Track Profile Foundation v30',date:'1999-04-12',turn:98,horseState:{'H-1996-008001':{status:'Observed'}}});
 const first=start({wtwOfficeStateV30:game});
 assert.equal(first.records.get('wtwOfficeStateV30'),game);
 const second=start(Object.fromEntries(first.records));
 assert.equal(second.records.get('wtwOfficeStateV30'),game);
 assert.equal(second.game.turn,98);
});
test('a leaked older-era reset cannot silently move the 1999 manager back to 2014',()=>{
 const result=start({wtwManagement1999BootstrapV1:'active',wtwOfficeStateV30:JSON.stringify({version:'old',date:'2014-07-15'})});
 assert.equal(result.game.date,'1999-01-01');
 assert.equal(result.records.get('wtwLegacy2014OfficeBackupV30'),JSON.stringify({version:'old',date:'2014-07-15'}));
});
test('the protected 1999 population and diagnostic directory remain separate',()=>{
 const lab=readFileSync('public/1999/index.html','utf8');
 assert.match(lab,/1999/);
 assert.doesNotMatch(main,/Legacy UI/);
});
