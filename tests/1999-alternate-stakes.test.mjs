import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,trackCardSurface1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {openingWorld1999} from '../src/1999/opening-world.v1.mjs';
test('every WTW 1999 course has a stake source or an explicitly modeled ungraded feature',()=>{
 const all=Object.values(TRACK_PROGRAM_1999);
 assert.equal(all.length,118);
 assert.equal(all.filter(p=>p.trackOperating==='OPEN_1999').length,115);
 assert.equal(all.filter(p=>p.trackOperating==='HISTORICAL_ONLY').length,3);
 assert.equal(all.filter(p=>p.trackOperating==='ARCHIVE_ONLY_1999').length,0);
 assert.ok(all.filter(p=>p.trackOperating==='OPEN_1999').every(p=>p.stakesIds.length||WTW_ALTERNATE_STAKES_1999.some(e=>e.trackId===p.id)));
 assert.equal(WTW_ALTERNATE_STAKES_1999.length,191); // five retired-course features removed from playable calendar
 assert.equal(new Set(WTW_ALTERNATE_STAKES_1999.map(r=>r.id)).size,WTW_ALTERNATE_STAKES_1999.length);
 assert.equal(openingWorld1999.stakes1999.length,93);
});
test('modeled races never trespass off-meet or off-surface and never pretend to be official',()=>{
 const original=new Set(openingWorld1999.stakes1999.map(r=>r.id));
 for(const r of WTW_ALTERNATE_STAKES_1999){
  const p=TRACK_PROGRAM_1999[r.trackId];
  assert.ok(p,r.id+' missing track');
  assert.equal(p.name,r.trackName);
  assert.equal(r.canonical,false);
  const fictionalExpansion=r.calendarBasis==='WTW_FICTIONAL_GAME_MODELED';
  if(fictionalExpansion)assert.equal(TRACK_PROGRAM_1999[r.trackId].basis,'WTW_FICTIONAL_GAME_MODELED');
  else assert.equal(r.calendarBasis,'WTW_ALTERNATE_HISTORY_GAME_MODELED');
  assert.ok(fictionalExpansion?/^WTW G[123]$|^REGIONAL STAKES$/.test(r.grade):r.grade==='WTW UNGRADED FEATURE');
  assert.ok(!original.has(r.id),'duplicate historical stake identity');
  if(p.trackOperating==='OPEN_1999')assert.ok(trackMeetOpen1999(r.trackId,r.localDate),r.id+' off-meet '+r.localDate);
  else assert.equal(trackMeetOpen1999(r.trackId,r.localDate),false,'retired track must not hold scheduled races');
  assert.ok(r.surface==='DIRT'||r.surface==='TURF');
  assert.ok(p.surfaces.includes(r.surface==='TURF'?'Turf':'Dirt'));
  assert.ok(Number.isInteger(r.purse1999)&&r.purse1999>0);
 }
});
test('the 16 alternate-history venue identities keep their feature records; only active courses race',()=>{
 const revived=Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION');
 assert.equal(revived.length,16);
 assert.equal(revived.filter(p=>p.trackOperating==='OPEN_1999').length,14);
 assert.equal(revived.filter(p=>p.trackOperating==='HISTORICAL_ONLY').length,2);
 for(const p of revived){
  const races=WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackId===p.id);
  assert.equal(races.length,p.trackOperating==='OPEN_1999'?2:0,p.name);
  assert.equal(new Set(races.map(r=>r.localDate)).size,races.length,p.name);
  assert.ok(['OPEN_1999','HISTORICAL_ONLY'].includes(p.trackOperating));
 }
});
