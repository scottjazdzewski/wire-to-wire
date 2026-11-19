import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const roster=source.slice(source.indexOf('function liveStableRosterView(directory=false){'),
 source.indexOf('\nfunction functionalRoute(route){'));
assert.ok(roster.startsWith('function liveStableRosterView(directory=false){'),
 'The test must exercise the current shared Stable/World roster implementation');

function extract(start,end){
 const first=roster.indexOf(start),last=roster.indexOf(end,first+start.length);
 assert.ok(first>=0&&last>first,'Expected current roster implementation not found');
 return roster.slice(first,last);
}

const ageCode=extract(' const rosterAge=','\n const keys=');
const age=vm.runInNewContext(ageCode+'\nrosterAge', {});
const cellCode=extract(' const cell=','\n const rowHTML=');
const cells=vm.runInNewContext(cellCode+'\n({cell,txt})',{safe:value=>String(value??'')});

test('Stable and World roster sort age 0 before one-year-olds while missing stays missing',()=>{
 assert.equal(age({age:0}),0);
 assert.equal(age({age:'0'}),0);
 assert.equal(age({age:1}),1);
 assert.equal(age({age:' 2 '}),2);
 for(const unknown of [null,undefined,'',' ','—','unknown']){
  assert.equal(age({age:unknown}),null);
 }
});

test('Roster displays recorded numeric zero without turning unknown ages into newborns',()=>{
 assert.match(cells.txt(0,'ng-rs-numeric'),/>0<\/td>/);
 assert.match(cells.txt('0','ng-rs-numeric'),/>0<\/td>/);
 assert.match(cells.txt(null,'ng-rs-numeric'),/ng-rs-missing/);
 assert.match(cells.txt('','ng-rs-numeric'),/ng-rs-missing/);
 assert.doesNotMatch(cells.txt(0,'ng-rs-numeric'),/ng-rs-missing/);
});
