import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999} from '../src/1999/opening-world.v1.mjs';
import {TRACK_PROGRAM_1999,trackProgram1999,trackMeetOpen1999,trackCardSurface1999}
 from '../public/next/1999-track-program.mjs';
import {applyVerifiedStakeDay1999} from '../public/next/1999-verified-stakes-dates.mjs';

test('every one of the 118 domestic/Cuban canonical track IDs has one 1999 program',()=>{
 const ids=openingWorld1999.tracks.map(t=>t.id);
 assert.equal(ids.length,118);
 assert.equal(new Set(ids).size,118);
 assert.deepEqual(Object.keys(TRACK_PROGRAM_1999).sort(),ids.slice().sort());
 for(const t of openingWorld1999.tracks){
  const program=trackProgram1999(t.id);
  assert.equal(program.id,t.id);
  assert.equal(program.name,t.name);
  assert.ok(program.basis);
  assert.ok(program.surfaces);
 }
});

test('all 93 canonical stakes remain ID-linked inside their host 1999 meet windows',()=>{
 assert.equal(openingWorld1999.stakes1999.length,93);
 const seen=new Set();
 for(const sourced of openingWorld1999.stakes1999){
  const stake=applyVerifiedStakeDay1999(sourced);
  assert.ok(!seen.has(stake.id),'duplicate source stake '+stake.id);
  seen.add(stake.id);
  const p=trackProgram1999(stake.trackId);
  assert.ok(p,'missing course for '+stake.id);
  assert.ok(p.stakesIds.includes(stake.id),'unlinked stake '+stake.id);
  assert.ok(p.stakesDates.includes(stake.localDate),'missing stake date '+stake.id);
  const monthDay=stake.localDate.slice(5);
  assert.ok(p.meets.some(([a,b])=>a<=monthDay&&monthDay<=b),'stake outside meet '+stake.id);
 }
 assert.equal(Object.values(TRACK_PROGRAM_1999).reduce((a,p)=>a+p.stakesIds.length,0),93);
});

test('every North American course operates in the WTW 1999 alternative universe',()=>{
 const northAmerican=Object.values(TRACK_PROGRAM_1999).filter(x=>x.id.startsWith('T-'));
 assert.equal(northAmerican.length,118);
 assert.equal(northAmerican.filter(x=>x.trackOperating==='OPEN_1999').length,118);
 const revived=northAmerican.filter(x=>x.basis==='WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION');
 assert.equal(revived.length,16);
 for(const p of revived){
  assert.ok(p.meets.length>=2,p.name+' missing revived meet');
  assert.ok(p.dayPattern.length>=4,p.name+' missing race-day pattern');
  assert.ok(['Dirt','Dirt · Turf','Turf'].includes(p.surfaces),p.name+' unsupported course');
  assert.equal(p.trackOperating,'OPEN_1999');
  assert.ok(p.meets.some(([a,b])=>{for(let d=Date.parse('1999-'+a+'T12:00:00Z'),end=Date.parse('1999-'+b+'T12:00:00Z');d<=end;d+=86400000){if(trackMeetOpen1999(p.id,new Date(d).toISOString().slice(0,10)))return true;}return false;}),p.name+' no racing dates');
 }
});

test('authenticated 1999 state racing calendar windows block off-meet cards',()=>{
 assert.equal(trackProgram1999('T-0030').basis,'VERIFIED_1999_CALENDAR');
 assert.equal(trackMeetOpen1999('T-0030','1999-01-01'),false);
 assert.equal(trackMeetOpen1999('T-0030','1999-08-29'),true);
 assert.equal(trackMeetOpen1999('T-0004','1999-06-02'),false); // New Jersey racing dark
 assert.equal(trackMeetOpen1999('T-0004','1999-05-31'),true); // Holiday racing
 assert.equal(trackMeetOpen1999('T-0042','1999-05-25'),true);
 assert.equal(trackMeetOpen1999('T-0042','1999-06-01'),false);
});

test('source surface restrictions carry into generated race conditions',()=>{
 assert.equal(trackProgram1999('T-0006').surfaces,'Dirt'); // Finger Lakes
 assert.equal(trackCardSurface1999('T-0006',5),'DIRT');
 assert.equal(trackProgram1999('T-0016').surfaces,'Dirt · Turf'); // Ellis Park
 assert.equal(trackCardSurface1999('T-0016',5),'TURF');
 assert.equal(trackProgram1999('T-0046').surfaces,'Turf'); // Kentucky Downs
 assert.equal(trackCardSurface1999('T-0046',1),'TURF');
 assert.equal(trackCardSurface1999('T-0046',5),'TURF');
});

test('real state calendars, established game windows and fictitious meets remain distinct',()=>{
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='VERIFIED_1999_CALENDAR').length,25);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='APPROVED_WTW_1999_GAME_CALENDAR').length,1);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='WTW_FICTIONAL_GAME_MODELED').length,8);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='PUBLISHED_1999_SARATOGA_PROPOSAL').length,1);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='INTERNATIONAL_GAME_MODELED').length,0);
 assert.equal(Object.values(TRACK_PROGRAM_1999).filter(p=>p.trackOperating==='ARCHIVE_ONLY_1999').length,0);
 for(const p of Object.values(TRACK_PROGRAM_1999).filter(p=>p.basis==='VERIFIED_1999_CALENDAR'))
  assert.ok(/^https:\/\//.test(p.sourceUrl),'verified calendar has no source '+p.id);
});
