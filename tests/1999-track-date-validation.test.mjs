import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,scheduledRaceDays1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';

test('never make a 1999 race day out of a nonexistent calendar date',()=>{
 const bad=['1999-02-29','1999-02-30','1999-04-31','1999-06-31',
  '1999-09-31','1999-11-31','1999-00-10','1999-13-01',
  '1999-12-00','1999-01-32','1998-11-03','2000-02-29'];
 for(const t of Object.values(TRACK_PROGRAM_1999))
  for(const date of bad)
   assert.equal(trackMeetOpen1999(t.id,date),false,
    t.id+' produced a ghost race day '+date);
 assert.equal(trackMeetOpen1999('T-0001','1999-11-31'),false,
  'Aqueduct previously accepted nonexistent Nov 31 as Dec 1');
});

test('date fix preserves all approved 1999 daily meets, no new or missing cards',()=>{
 const expected={'T-0119':78,'T-0120':56,'T-0121':44,
  'T-0122':30,'T-0123':30,'T-0124':63,
  'T-0106':48,'T-0061':126};
 for(const [id,n] of Object.entries(expected))
  assert.equal(scheduledRaceDays1999(id),n,id+' approved racing-day total');
 assert.equal(trackMeetOpen1999('T-0013','1999-05-01'),true);
 assert.equal(trackMeetOpen1999('T-0013','1999-04-31'),false);
 assert.equal(trackMeetOpen1999('T-0113','1999-05-01'),false,
  'historical-only track may not reopen');
 const book=buildConditionBook1999({
  date:'1999-05-01',track:{id:'T-0013',name:'Churchill Downs'},trackIndex:12});
 assert.ok(book.length>0,'valid May 1 Churchill card remains');
 assert.throws(()=>buildConditionBook1999({
  date:'1999-04-31',track:{id:'T-0013',name:'Churchill Downs'},trackIndex:12}),
  /1999 date required/,'invalid dates cannot become condition books');
});
