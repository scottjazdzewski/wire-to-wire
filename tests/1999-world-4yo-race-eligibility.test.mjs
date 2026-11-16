import test from 'node:test';
import assert from 'node:assert/strict';
import {raceEligibility,supported1999RaceClass}
 from '../src/game/racing-1999.js';

// Canonical race eligibility unit regression. Not the retired 38-horse
// pilot and not a substitute for 300k/325k whole-world browser acceptance.
function activeHorse(year){
 return {horse_id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',
  foaling_year:year,sex:'HORSE',status:'IN_TRAINING',
  host_track_id:'T-0001',current_residence_id:'F-RACING',
  career:{starts:0,wins:0,earnings_minor:0}};
}
function liveState(horse){
 return {clock:{date:'1999-01-01'},
  runtime:{races:{},entries:{},racing:{horse_travel:{}},
   facilities:{sites:{'F-RACING':{id:'F-RACING',
    host_track_id:'T-0001',status:'ACTIVE'}}},
   horse:{[horse.horse_id]:{
    history:[],training:{sorenessDays:0,currentRisk:0,
     readiness:.9,fatigue:0}}}}};
}
const stakes={
 id:'WTW-1999-MODELED-4YO-STAKE',date:'1999-01-20',track_id:'T-0001',
 age:'4YO+',sex:'OPEN',conditions:'Handicap',
 surface:'DIRT',distance_furlongs:8,purse_minor:5400000,
 stake_id:'WTW-MODELED-STAKE',stake_source_status:'MODELED',
 canonical:false,field_capacity:10
};
test('1999 modeled 4YO+ stakes cannot admit 3YO horses and allow actual four-year-olds',()=>{
 assert.equal(supported1999RaceClass(stakes),true);
 const three=activeHorse(1996),four=activeHorse(1995);
 const tooYoung=raceEligibility(liveState(three),three,stakes);
 assert.equal(tooYoung.eligible,false);
 assert.ok(tooYoung.reasons.includes('AGE_RESTRICTION'));
 const adult=raceEligibility(liveState(four),four,stakes);
 assert.ok(!adult.reasons.includes('AGE_RESTRICTION'));
 assert.equal(adult.eligible,true,adult.reasons.join(','));
});
test('3YO age-restricted races still admit 3YO and exclude 4YO',()=>{
 const race={...stakes,id:'WTW-1999-3YO-STAKE',age:'3YO'};
 const three=activeHorse(1996),four=activeHorse(1995);
 assert.equal(raceEligibility(liveState(three),three,race).eligible,true);
 assert.ok(raceEligibility(liveState(four),four,race).reasons.includes('AGE_RESTRICTION'));
});
