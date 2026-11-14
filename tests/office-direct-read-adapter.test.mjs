import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const script=read('public/next/office-direct-read.js');
const game=read('public/next/next.js');
const html=read('public/next/index.html');
const sandbox={window:{},module:{exports:{}},Date,Number};
vm.runInNewContext(script,sandbox,{filename:'office-direct-read.js'});
const api=sandbox.window.__WTW_OFFICE_DIRECT_READ__;

test('direct read adapter contains no DOM, mutation or network behavior',()=>{
 assert.equal(api.schema,'WTW_OFFICE_DIRECT_READ_V2');
 assert.equal(Object.isFrozen(api),true);
 assert.doesNotMatch(script,/\bdocument\b|\blocalStorage\b|\bfetch\s*\(|\.click\s*\(|\.innerHTML\b/);
 assert.deepEqual(Object.keys(api).sort(),['decisions','gameDate','schema','validDate']);
});

test('game date prioritizes authoritative playtest clock over stale save or legacy chip',()=>{
 assert.equal(api.gameDate({
  engineDate:'1999-02-03',careerDate:'1999-01-29',
  legacyDate:'1999-01-01',cleanMode:true
 }),'1999-02-03');
 assert.equal(api.gameDate({
  engineDate:'invalid',careerDate:'1999-01-29',
  legacyDate:'1999-05-02',cleanMode:true
 }),'1999-01-29');
 assert.equal(api.gameDate({legacyDate:'1999-01-08',cleanMode:true}),'1999-01-01');
 assert.equal(api.gameDate({legacyDate:'1999-01-08',cleanMode:false}),'1999-01-01');
});

test('invalid calendar dates cannot advance or rewind the game',()=>{
 for(const date of ['1999-02-30','1999-13-01','1999-1-01','tomorrow','1999-00-01']){
  assert.equal(api.validDate(date),'');
 }
 assert.equal(api.validDate('1999-02-28'),'1999-02-28');
});

test('Inbox projects exact engine IDs, choices and persisted receipts',()=>{
 const pending={id:'D-1',option_ids:['rest','work'],created_date:'1999-01-01',
  context:{title:'Training review',option_labels:{rest:'Rest the horse'}}};
 const resolved={...pending,id:'D-2',option_id:'rest',resolved_date:'1999-01-02'};
 const [open,closed]=api.decisions({decisions:{pending:{'D-1':pending},resolved:{'D-2':resolved}}});
 assert.equal(open.message.case,'D-1');
 assert.equal(open.desk.moves[0].optionId,'rest');
 assert.equal(open.desk.moves[1].title,'work');
 assert.equal(closed.message.resolved,true);
 assert.equal(closed.desk.moves.length,0);
 assert.equal(closed.desk.receipt.date,'1999-01-02');
 assert.equal(closed.desk.receipt.choiceTitle,'Rest the horse');
 assert.equal(api.decisions().length,0);
});

test('current management screen uses direct adapter ahead of old DOM source',()=>{
 assert.ok(html.includes('/next/office-direct-read.js?rev=wtw-headless-read-v2'));
 assert.ok(html.indexOf('office-direct-read.js')<html.indexOf('/next/next.js'));
 assert.doesNotMatch(game,/\.dateChip|\.left \.msg/);
 assert.match(game,/__WTW_OFFICE_DIRECT_READ__\.decisions\(/);
 assert.match(game,/__WTW_OFFICE_DIRECT_READ__\.gameDate\(/);
 assert.match(game,/__WTW_1999_UI_DATA__\?\.gameplayService\?\.state\?\.clock\?\.date/);
});
