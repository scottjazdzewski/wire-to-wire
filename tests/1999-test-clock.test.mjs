import test from 'node:test';
import assert from 'node:assert/strict';
import {WTW_TEST_START_DATE,WTW_TEST_SAVE_NAMESPACE,createClean1999Clock,advance1999Clock,reset1999Clock,validate1999Clock} from '../src/1999/test-clock.mjs';
test('new universe begins on 1999-01-01 with no prior outcomes',()=>{
 const state=createClean1999Clock();
 assert.equal(WTW_TEST_START_DATE,'1999-01-01');
 assert.equal(state.currentDate,'1999-01-01');
 assert.equal(state.day,0);
 assert.deepEqual(state.activeEntries,[]);
 assert.deepEqual(state.committedResults,[]);
 assert.match(WTW_TEST_SAVE_NAMESPACE,/1999/);
});
test('calendar advances and resets cleanly without mutating original state',()=>{
 const start=createClean1999Clock(997);
 const next=advance1999Clock(start,1);
 assert.equal(next.currentDate,'1999-01-02');
 assert.equal(next.day,1);
 assert.equal(start.currentDate,'1999-01-01');
 assert.equal(advance1999Clock(start,31).currentDate,'1999-02-01');
 assert.equal(reset1999Clock(next).currentDate,'1999-01-01');
 assert.equal(reset1999Clock(next).seed,997);
});
test('old 2014 demo and backdated saves cannot become January 1999 game state',()=>{
 assert.throws(()=>validate1999Clock({schema:'WTW_DEMO_2014'}));
 assert.throws(()=>validate1999Clock({...createClean1999Clock(),currentDate:'2014-07-15',day:0}));
 assert.throws(()=>advance1999Clock(createClean1999Clock(),-1));
 assert.throws(()=>advance1999Clock(createClean1999Clock(),1000));
});
