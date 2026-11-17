import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {same1999PhysicalVenue} from '../src/game/physical-venue-1999.js';
import {trackMeetOpen1999,trackPhysicalVenueId1999,TRACK_PROGRAM_1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {raceEligibility,effectiveHorseTrack} from '../src/game/index.js';
import {unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';

globalThis.crypto??=webcrypto;
const bundled=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
 import.meta.url);

test('1999 fair meeting uses existing Bay Meadows physical racing surface',()=>{
 assert.equal(trackPhysicalVenueId1999('T-0075'),'T-0032');
 assert.equal(same1999PhysicalVenue('T-0032','T-0075'),true);
 assert.equal(same1999PhysicalVenue('T-0075','T-0032'),true);
 assert.equal(same1999PhysicalVenue('T-0032','T-0032'),true);
 assert.equal(same1999PhysicalVenue('T-0032','T-0031'),false);
 assert.equal(same1999PhysicalVenue('T-0032',null),false);
 assert.equal(same1999PhysicalVenue('T-0032','T-NOT-A-TRACK'),false);
 assert.equal(same1999PhysicalVenue('T-FUTURE-001','T-FUTURE-001'),true,
  'same immutable generated track ID remains co-located without legacy registry overlay');
 assert.equal(same1999PhysicalVenue('T-FUTURE-001','T-FUTURE-002'),false);
 assert.equal(trackMeetOpen1999('T-0075','1999-08-14'),true);
 assert.equal(trackMeetOpen1999('T-0032','1999-08-14'),false);
});

test('all 1999 meeting calendars avoid simultaneous cards at a shared physical facility',()=>{
 const tracks=Object.values(TRACK_PROGRAM_1999).filter(t=>
  t.playableIn1999===true&&t.trackOperating==='OPEN_1999');
 assert.equal(tracks.length,107);
 const start=Date.UTC(1999,0,1);
 for(let i=0;i<365;i++){
  const date=new Date(start+i*86400000).toISOString().slice(0,10);
  const venues=new Map();
  for(const track of tracks){
   if(!trackMeetOpen1999(track.id,date))continue;
   const venue=trackPhysicalVenueId1999(track.id);
   assert.equal(venues.has(venue),false,
    date+' concurrent cards at '+track.id+' and '+venues.get(venue));
   venues.set(venue,track.id);
  }
 }
});

test('actual saved 300k career uses one Bay Meadows facility for its approved fair meeting',async()=>{
 const checkpoint=await unpackShared1999Career(gunzipSync(readFileSync(bundled)));
 assert.equal(checkpoint.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(checkpoint.world.horseCount,300000);
 assert.equal(checkpoint.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 const state=checkpoint.careerRecord.changes.canonicalRun;
 assert.equal(state.clock.date,'1999-05-29');
 const original=Object.values(state.runtime.registered_horses.by_id)
  .find(h=>h.starting_attributes&&h.current_residence_id&&
   !['OUTBOUND','RETURNING','AT_DESTINATION'].includes(
    state.runtime.racing?.horse_travel?.[h.horse_id]?.status));
 assert.ok(original,'actual bundled career must contain a registered source-identified horse');
 // Assess a hypothetical Bay Meadows assignment without mutating the
 // saved career, horse identities, confirmed dates, historical races or ledger.
 const horse={...original,host_track_id:'T-0032'};
 const book=buildConditionBook1999({
  date:'1999-08-14',track:{id:'T-0075',name:'San Mateo County Fair'},
  trackIndex:74,seed:checkpoint.world.seed,includeKnownStakes:false});
 assert.ok(book.length>0,'the test must use a genuine approved fair meet day');
 const r=book.find(x=>x.conditions==='Maiden Special Weight')||book[0];
 const race={...r,track_id:r.trackId,age:r.ageRequirement,
  sex:r.sexRestriction,max_wins:r.maxCareerWins};
 assert.equal(effectiveHorseTrack(state,horse),'T-0032');
 assert.ok(!raceEligibility(state,horse,race).reasons
  .includes('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'),
  'co-located runner cannot require a paid haul to the same surface');
 assert.ok(raceEligibility(state,horse,{...race,track_id:'T-0001'}).reasons
  .includes('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'),
  'a genuinely different track still requires transport');
 assert.equal(checkpoint.careerRecord.changes.canonicalRun
  .runtime.registered_horses.by_id[original.horse_id].host_track_id,
  original.host_track_id,'regression cannot rewrite the real saved horse');
});
