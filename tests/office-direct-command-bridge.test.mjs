import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const source=read('public/next/office-direct-command.js');
const next=read('public/next/next.js');
const office=read('public/office-v30-4.js');
const html=read('public/next/index.html');
const commercial=read('public/next/1999-commercial-career-manager.mjs');
const boot=manager=>{
 const window={__WTW_1999_MANAGEMENT__:manager};
 const module={exports:{}};
 vm.runInNewContext(source,{window,module,Promise,Error,String,URLSearchParams},{filename:'office-direct-command.js'});
 return {window,api:module.exports};
};

test('one headless action surface; no legacy screen, DOM or own game storage',()=>{
 const {api}=boot({mode:'FOUNDING_1999'});
 assert.equal(api.schema,'WTW_OFFICE_DIRECT_COMMANDS_V2');
 assert.equal(Object.isFrozen(api),true);
 assert.deepEqual(Object.keys(api).sort(),['dispatch','schema']);
 assert.doesNotMatch(source,/\bdocument\b|\blocalStorage\b|\bindexedDB\b|querySelector|\.click\s*\(|\.innerHTML/);
 assert.match(html,/office-direct-command\.js\?rev=wtw-headless-commands-v3/);
 assert.ok(html.indexOf('office-v30-4.js')<html.indexOf('office-direct-command.js'));
 assert.ok(html.indexOf('office-direct-command.js')<html.indexOf('/next/next.js'));
});

test('Save directly calls existing canonical save handler exactly once',()=>{
 const payload={schema:'career',version:'WTW_1999_FOUNDING_CAREER_V1',date:'1999-01-02'};
 let count=0;
 const {api}=boot({mode:'FOUNDING_1999',saveCurrentCareer:()=>{count++;return payload}});
 assert.strictEqual(api.dispatch('SAVE_CURRENT'),payload);
 assert.equal(count,1);
 assert.match(office,/game\.saveCurrentCareer=\(\)=>\{\s*saveState\(\);/);
 assert.match(next,/const payload=commands\.dispatch\('SAVE_CURRENT'\)/);
 const snippet=next.slice(next.indexOf('function namedSaveCapture()'),
  next.indexOf('function namedSavePanel()'));
 assert.doesNotMatch(snippet,/originalAct|\.app \[data-act\]|\.click\(/);
 assert.match(snippet,/valid1999Save\(payload\)/);
});

test('1999 Save timestamps come from the career state, never the old hidden date chip',()=>{
 const dateBody=office.slice(office.indexOf('function currentGameDate()'),
  office.indexOf('function dueDate(days)'));
 assert.match(dateBody,/if\(window\.__WTW_1999_MANAGEMENT__\)/);
 assert.match(dateBody,/const date=String\(gameState\.date\|\|''\)/);
 assert.match(dateBody,/return date;/);
 assert.ok(dateBody.indexOf('return date;')<dateBody.indexOf('dateChip ? dateChip.textContent'),
  'Founding game date must return before legacy chip fallback');
});

test('Continue uses exactly one canonical game clock command',()=>{
 let advanced=0;
 const {api}=boot({mode:'FOUNDING_1999',advanceOneDay:()=>{advanced++;return '1999-01-02'}});
 assert.equal(api.dispatch('ADVANCE_DAY'),'1999-01-02');
 assert.equal(advanced,1);
 assert.match(next,/commands\.dispatch\('ADVANCE_DAY'\)/);
 assert.match(office,/game\.advanceOneDay=\(\)=>setDate\('day'\)/);
});

test('pending asynchronous advance cannot enqueue a second game day',async()=>{
 let finish,calls=0;
 const pending=new Promise(resolve=>finish=resolve);
 const {api}=boot({mode:'FOUNDING_1999',advanceOneDay:()=>{calls++;return pending}});
 const first=api.dispatch('ADVANCE_DAY'),second=api.dispatch('ADVANCE_DAY');
 assert.strictEqual(first,second);
 assert.equal(calls,1);
 finish('committed');
 assert.equal(await first,'committed');
 assert.equal(api.dispatch('ADVANCE_DAY')===first,false);
 assert.equal(calls,2);
});

test('unsupported modes and missing services fail closed; no ghost game action',()=>{
 const missing=boot({mode:'FOUNDING_1999'}).api;
 assert.throws(()=>missing.dispatch('SAVE_CURRENT'),/save service unavailable/i);
 assert.throws(()=>missing.dispatch('ADVANCE_DAY'),/clock service unavailable/i);
 assert.throws(()=>missing.dispatch('DELETE_HORSE'),/Unsupported game command/);
 assert.throws(()=>boot({mode:'ARCHIVE'}).api.dispatch('SAVE_CURRENT'),/not ready/i);
});

test('pilot gameplay IndexedDB save cannot masquerade as a named legacy save',()=>{
 let saved=0;
 const {window,api}=boot({mode:'FOUNDING_1999',saveCurrentCareer:()=>{saved++;return {}}});
 window.__WTW_1999_UI_DATA__={gameplayService:{state:{clock:{date:'1999-01-02'}}}};
 assert.throws(()=>api.dispatch('SAVE_CURRENT'),/playtest saves to its game engine automatically/i);
 assert.equal(saved,0);
});

test('both Load controls use the same founding authority, guarded before pilot startup',()=>{
 const payload={date:'1999-02-01'};
 let restored;
 const {window,api}=boot({mode:'FOUNDING_1999',restoreCareer:game=>{restored=game}});
 api.dispatch('LOAD_CAREER',payload);
 assert.strictEqual(restored,payload);
 window.location={search:'?playtest=38'};
 assert.throws(()=>api.dispatch('LOAD_CAREER',{}),/switch to the founding world/);
 assert.throws(()=>api.dispatch('ADVANCE_DAY'),/playtest clock is still loading/);
 assert.strictEqual(restored,payload);
 assert.match(next,/\.dispatch\('LOAD_CAREER',slot.game\)/);
 assert.match(commercial,/\.dispatch\('LOAD_CAREER',game\)/);
 assert.match(commercial,/\.dispatch\('SAVE_CURRENT'\)/);
 assert.doesNotMatch(commercial,/\.app \[data-act\]|localStorage\./);
});

test('decisions use the selected engine case and choice and release the lock after errors',async()=>{
 const {window,api}=boot({mode:'FOUNDING_1999'});
 assert.throws(()=>api.dispatch('ANSWER_DECISION',{}),/decision service unavailable/);
 const pending={'D-1':{option_ids:['rest','work']}};
 const calls=[];
 let attempt=0;
 window.__WTW_1999_UI_DATA__={gameplayService:{state:{decisions:{pending}},
  submit:(...args)=>{calls.push(args);return ++attempt===1?Promise.reject(Error('Save failed')):'committed'}}};
 assert.throws(()=>api.dispatch('ANSWER_DECISION',{decision_id:'D-1',option_id:'other'}),/no longer available/);
 assert.throws(()=>api.dispatch('ANSWER_DECISION',{decision_id:'__proto__',option_id:'rest'}),/no longer available/);
 const payload={decision_id:'D-1',option_id:'rest'};
 const first=api.dispatch('ANSWER_DECISION',payload);
 assert.throws(()=>api.dispatch('ANSWER_DECISION',payload),/already being recorded/);
 await assert.rejects(first,/Save failed/);
 assert.equal(await api.dispatch('ANSWER_DECISION',payload),'committed');
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),Array(2).fill(['ANSWER_DECISION',payload,'player']));
});

test('change job is dispatched to the active career save service',async()=>{
 const {window,api}=boot({mode:'FOUNDING_1999'});
 assert.throws(()=>api.dispatch('CHANGE_PLAYER_JOB',{role:'trainer'}),/active playable game career/);
 const calls=[];
 window.__WTW_1999_UI_DATA__={gameplayService:{
  submit:(...args)=>{calls.push(args);return Promise.resolve('committed')}
 }};
 const payload={role:'trainer',operation_id:'O-1',person_id:'P-1'};
 assert.equal(await api.dispatch('CHANGE_PLAYER_JOB',payload),'committed');
 assert.deepEqual(JSON.parse(JSON.stringify(calls)),[['CHANGE_PLAYER_JOB',payload,'player']]);
 assert.throws(()=>api.dispatch('CHANGE_PLAYER_JOB',{role:'invalid'}),/available career role/);
});

test('game command errors are reported rather than silently advancing',()=>{
 const segment=next.slice(next.indexOf("if(window.__WTW_1999_MANAGEMENT__&&val==='Continue')"),
  next.indexOf("if(window.__WTW_1999_MANAGEMENT__&&['Open file'"));
 assert.match(segment,/window\.__WTW_1999_PLAYTEST_ERROR__=String/);
 assert.match(segment,/result\.then\(\(\)=>paint\(\),error=>/);
});
