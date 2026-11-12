import assert from 'node:assert/strict';
import {test} from 'node:test';
import {TRACK_PROGRAM_1999,trackMeetOpen1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '../public/next/1999-regional-stakes.mjs';
test('all 134 WTW tracks retain a source or planned 1999 racing program',()=>{
 assert.equal(Object.keys(TRACK_PROGRAM_1999).length,134);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='WTW_FICTIONAL_GAME_MODELED').length,8);
});
test('regional expansion complements rather than duplicates 1999 source and fictional flagship stakes',()=>{
 const currentIds=new Set(WTW_ALTERNATE_STAKES_1999.map(x=>x.id));
 const ids=new Set();
 assert.ok(WTW_REGIONAL_STAKES_1999.length>=100);
 for(const race of WTW_REGIONAL_STAKES_1999){
  assert.ok(!ids.has(race.id)&&!currentIds.has(race.id),'unique stake identity: '+race.id);
  ids.add(race.id);
  const program=TRACK_PROGRAM_1999[race.trackId];
  assert.ok(program);
  assert.equal(program.name,race.trackName);
  assert.equal(race.canonical,false);
  assert.equal(race.status,'PLANNED_WTW_NOT_RUN');
  assert.equal(race.results.length,0);
  assert.ok(trackMeetOpen1999(race.trackId,race.localDate),race.id+' must occur on an open race day');
  assert.ok(program.surfaces.includes(race.surface==='TURF'?'Turf':'Dirt'),'surface must exist: '+race.id);
 }
});
test('ordinary regional tracks without locked stakes receive nonzero planned feature stakes',()=>{
 const tracks=Object.values(TRACK_PROGRAM_1999).filter(p=>p.trackOperating==='OPEN_1999'&&
  p.basis!=='WTW_FICTIONAL_GAME_MODELED'&&(p.stakesIds||[]).length===0);
 assert.ok(tracks.length>=30);
 for(const t of tracks)assert.ok(WTW_REGIONAL_STAKES_1999.some(r=>r.trackId===t.id),t.name);
});
