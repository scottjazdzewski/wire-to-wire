import assert from 'node:assert/strict';
import {test} from 'node:test';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,trackCardSurface1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
test('118 immutable domestic/Cuban course identities and sourced 1999 meeting corrections',()=>{
 assert.equal(Object.keys(TRACK_PROGRAM_1999).length,118);
 assert.ok(Object.keys(TRACK_PROGRAM_1999).every(id=>/^T-\d{4}$/.test(id)));
 assert.deepEqual(TRACK_PROGRAM_1999['T-0003'].meets,[['07-28','09-06']]);
 assert.deepEqual(TRACK_PROGRAM_1999['T-0013'].meets,[['04-24','06-27'],['10-31','11-27']]);
 assert.deepEqual(TRACK_PROGRAM_1999['T-0016'].meets,[['06-28','09-06']]);
 assert.equal(trackMeetOpen1999('T-0003','1999-07-24'),false);
 assert.equal(trackMeetOpen1999('T-0003','1999-07-28'),true);
 assert.equal(trackMeetOpen1999('T-0013','1999-04-24'),true);
 assert.equal(trackMeetOpen1999('T-0016','1999-07-06'),true);
});
test('each fictional WTW course has 12 future-only stakes on valid race dates',()=>{
 for(let n=94;n<=101;n++){
  const id='T-'+String(n).padStart(4,'0'),p=TRACK_PROGRAM_1999[id];
  const races=WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackId===id);
  assert.equal(p.basis,'WTW_FICTIONAL_GAME_MODELED');
  assert.equal(races.length,12,id);
  assert.equal(new Set(races.map(r=>r.id)).size,12,id);
  for(const race of races){
   assert.equal(trackMeetOpen1999(id,race.localDate),true,race.name);
   assert.equal(race.canonical,false);
   assert.ok(p.surfaces.includes(race.surface==='TURF'?'Turf':'Dirt'));
  }
 }
});
test('existing historical stakes and track-only surface restrictions survive',()=>{
 assert.equal(new Set(WTW_ALTERNATE_STAKES_1999.map(r=>r.id)).size,WTW_ALTERNATE_STAKES_1999.length);
 assert.ok(WTW_ALTERNATE_STAKES_1999.every(r=>r.canonical===false));
 assert.equal(trackCardSurface1999('T-0097',5),'DIRT');
});
