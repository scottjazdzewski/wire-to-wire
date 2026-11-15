import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK_PROGRAM_1999,trackProgram1999,scheduledRaceDays1999}
 from '../public/next/1999-track-program.mjs';
import {ARCHIVED_TRACK_IDS_1999,APPROVED_NEW_TRACK_IDS_1999}
 from '../public/next/approved-track-expansion-1999.mjs';
import {buildFictional1999RaceCalendar}
 from '../public/1999/engine/fictional-world-calendar-v1.mjs';

test('full 1999 opening world has 107 active and 17 historical-only track identities',()=>{
 const records=Object.values(TRACK_PROGRAM_1999);
 const live=records.filter(t=>t.playableIn1999&&t.trackOperating==='OPEN_1999');
 assert.equal(records.length,124);
 assert.equal(live.length,107);
 assert.equal(records.length-live.length,17);
 for(const id of ARCHIVED_TRACK_IDS_1999)
  assert.equal(trackProgram1999(id).playableIn1999,false,id);
 for(const id of APPROVED_NEW_TRACK_IDS_1999)
  assert.ok(live.some(t=>t.id===id),id);
 assert.equal(trackProgram1999('T-0061').name,'Comanche Raceway');
 assert.equal(trackProgram1999('T-0075').physicalTrackId,'T-0032');
});
test('every approved seasonal track has the exact locally modeled 1999 race day count',()=>{
 const days={'T-0119':78,'T-0120':56,'T-0121':44,
  'T-0122':30,'T-0123':30,'T-0124':63,
  'T-0106':48,'T-0061':126};
 for(const [id,n] of Object.entries(days))
  assert.equal(scheduledRaceDays1999(id),n,id);
});
test('generated 1999 calendar covers exactly the approved active tracks',()=>{
 const tracks=Object.values(TRACK_PROGRAM_1999).filter(t=>t.playableIn1999);
 const calendar=buildFictional1999RaceCalendar(tracks);
 assert.equal(calendar.unprogrammedTrackIds.length,0);
 assert.equal(calendar.summary.tracksWithCards,107);
 assert.ok(calendar.summary.scheduledRaces>50000);
 assert.ok(calendar.cards.every(c=>!ARCHIVED_TRACK_IDS_1999.includes(c.trackId)));
});
