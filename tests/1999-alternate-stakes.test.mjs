import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,trackCardSurface1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {openingWorld1999} from '../src/1999/opening-world.v1.mjs';
test('every WTW 1999 course has a stake source or an explicitly modeled ungraded feature',()=>{
 const all=Object.values(TRACK_PROGRAM_1999);
 assert.equal(all.length,134);
 assert.ok(all.every(p=>p.trackOperating==='OPEN_1999'));
 assert.ok(all.every(p=>p.stakesIds.length||WTW_ALTERNATE_STAKES_1999.some(e=>e.trackId===p.id)));
 assert.equal(WTW_ALTERNATE_STAKES_1999.length,124);
 assert.equal(new Set(WTW_ALTERNATE_STAKES_1999.map(r=>r.id)).size,124);
 assert.equal(openingWorld1999.stakes1999.length,93);
});
test('modeled races never trespass off-meet or off-surface and never pretend to be official',()=>{
 const original=new Set(openingWorld1999.stakes1999.map(r=>r.id));
 for(const r of WTW_ALTERNATE_STAKES_1999){
  const p=TRACK_PROGRAM_1999[r.trackId];
  assert.ok(p,r.id+' missing track');
  assert.equal(p.name,r.trackName);
  assert.equal(r.canonical,false);
  assert.equal(r.calendarBasis,'WTW_ALTERNATE_HISTORY_GAME_MODELED');
  assert.equal(r.grade,'WTW UNGRADED FEATURE');
  assert.ok(!original.has(r.id),'duplicate historical stake identity');
  assert.ok(trackMeetOpen1999(r.trackId,r.localDate),r.id+' off-meet '+r.localDate);
  assert.ok(r.surface==='DIRT'||r.surface==='TURF');
  assert.ok(p.surfaces.includes(r.surface==='TURF'?'Turf':'Dirt'));
  assert.ok(Number.isInteger(r.purse1999)&&r.purse1999>0);
 }
});
test('the 16 real-world shuttered venues carry two distinct WTW 1999 stakes and stay open',()=>{
 const revived=Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION');
 assert.equal(revived.length,16);
 for(const p of revived){
  const races=WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackId===p.id);
  assert.equal(races.length,2,p.name);
  assert.equal(new Set(races.map(r=>r.localDate)).size,2,p.name);
  assert.equal(p.trackOperating,'OPEN_1999');
 }
});
