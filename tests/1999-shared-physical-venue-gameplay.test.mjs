import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {same1999PhysicalVenue} from '../src/game/physical-venue-1999.js';
import {trackMeetOpen1999,trackPhysicalVenueId1999,TRACK_PROGRAM_1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {WORLD_SCHEMA,raceEligibility,effectiveHorseTrack}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainer.trainers,...jockey.jockeys]
 .map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'VENUE-ID-1999-READ-ONLY-TEST',
  source:'SAME_PHYSICAL_TRACK_TEST_NOT_HISTORICAL_RESULT',
  sha256:createHash('sha256').update('1999-existing-fair-venue').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};

test('1999 fair meeting uses existing Bay Meadows physical racing surface',()=>{
 assert.equal(trackPhysicalVenueId1999('T-0075'),'T-0032');
 assert.equal(same1999PhysicalVenue('T-0032','T-0075'),true);
 assert.equal(same1999PhysicalVenue('T-0075','T-0032'),true);
 assert.equal(same1999PhysicalVenue('T-0032','T-0032'),true);
 assert.equal(same1999PhysicalVenue('T-0032','T-0031'),false);
 assert.equal(same1999PhysicalVenue('T-0032',null),false);
 assert.equal(same1999PhysicalVenue('T-0032','T-NOT-A-TRACK'),false);
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

test('approved fair condition-book runner need not ship to its own racing surface',()=>{
 const state=build1999PilotGameRun({world,manifest,jockeys:jockey.jockeys});
 const original=Object.values(state.runtime.registered_horses.by_id)
  .find(h=>h.starting_attributes&&h.current_residence_id);
 assert.ok(original,'must use an existing registered source-identified horse');
 // Read-only venue-assessment fixture: no canonical save or result is changed.
 const horse={...original,host_track_id:'T-0032'};
 const book=buildConditionBook1999({
  date:'1999-08-14',track:{id:'T-0075',name:'San Mateo County Fair'},
  trackIndex:74,includeKnownStakes:false});
 assert.ok(book.length>0,'must use an actual approved fair meet day');
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
});
