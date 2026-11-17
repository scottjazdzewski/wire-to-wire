import test from 'node:test';
import assert from 'node:assert/strict';
import {get1999JockeyPartnership,JOCKEY_PARTNERSHIP_MODEL}
 from '../public/1999/engine/jockey-partnerships-1999.mjs';
import {scorePremierJockeyOffer}
 from '../public/1999/engine/jockey-premier-market-1999.mjs';
import {readFileSync,copyFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';

const trainer='P-FICTIONAL-1999-TRAINER-0000001';
const owner='O-FICTIONAL-1999-OWNER-0000001';
const otherOwner='O-FICTIONAL-1999-OWNER-0000002';
const jockey='P-FICTIONAL-1999-JOCKEY-0000001';
const horse='H-FICTIONAL-1999-THREEYEARRUNNERS-0000001';
const base=()=>({clock:{date:'1999-05-29'},runtime:{races:{},entries:{},
 registered_horses:{by_id:{[horse]:{horse_id:horse,trainer_id:trainer,
 owner_organization_id:owner}}}}});
const partnership=s=>get1999JockeyPartnership(s,{
 trainerId:trainer,ownerId:owner,jockeyId:jockey});
function mount(s,{id='1',status='BOOKED',finish=null,trainerId=trainer,
 ownerId=owner,date='1999-03-01'}={}){
 const rid='R-'+id;
 s.runtime.races[rid]={id:rid,date,
  status:status==='RESULTED'?'OFFICIAL_SIM_RESULT':'ENTRIES_OPEN',
  results:status==='RESULTED'?[{horse_id:'H-'+id,jockey_share_minor:11000}]:[]};
 s.runtime.entries[rid+':H-'+id]={id:rid+':H-'+id,
  race_id:rid,horse_id:'H-'+id,trainer_id:trainerId,owner_id:ownerId,
  jockey_id:jockey,status,...(finish?{finish}:{})};
}
test('new jockey partnership starts neutral, with no imaginary historical loyalty',()=>{
 assert.equal(JOCKEY_PARTNERSHIP_MODEL,'WTW_1999_JOCKEY_PARTNERSHIPS_V1');
 const result=partnership(base());
 assert.equal(result.trainerMounts,0);
 assert.equal(result.ownerMounts,0);
 assert.equal(result.trainerWins,0);
 assert.equal(result.trainerBond,0);
 assert.equal(result.ownerBond,0);
});
test('paid mounts and actual winners create distinct trainer and owner relationships',()=>{
 const s=base();
 mount(s,{id:'1',status:'RESULTED',finish:1,date:'1999-02-01'});
 mount(s,{id:'2',status:'RESULTED',finish:3,date:'1999-02-11'});
 mount(s,{id:'3',status:'BOOKED',date:'1999-02-21'});
 mount(s,{id:'4',status:'RESULTED',finish:2,ownerId:otherOwner,
  date:'1999-03-02'});
 mount(s,{id:'5',status:'ENTERED',date:'1999-03-03'});
 mount(s,{id:'6',status:'SCRATCHED',date:'1999-03-04'});
 const current=partnership(s);
 assert.equal(current.trainerMounts,4);
 assert.equal(current.trainerRiddenMounts,3);
 assert.equal(current.trainerBookedMounts,1);
 assert.equal(current.ownerRiddenMounts,2);
 assert.equal(current.ownerBookedMounts,1);
 assert.equal(current.trainerBond,.191,
  'Booked but unrun rides must not artificially improve trainer loyalty');
 assert.equal(current.ownerBond,.085);
 assert.equal(current.trainerWins,1);
 assert.equal(current.trainerPlaces,3);
 assert.equal(current.ownerMounts,3);
 assert.equal(current.ownerWins,1);
 assert.equal(current.trainerPursesMinor,33000);
 assert.equal(current.mostRecentTrainerDate,'1999-03-02');
 assert.ok(current.trainerBond>0);
 assert.ok(current.ownerBond>0);
 assert.deepEqual(partnership(JSON.parse(JSON.stringify(s))),current,
  'Career relationships must reproduce exactly on save/reopen');
 const other=get1999JockeyPartnership(s,{
  trainerId:trainer,ownerId:otherOwner,jockeyId:jockey});
 assert.equal(other.trainerMounts,4);
 assert.equal(other.ownerMounts,1,'Owners retain independent partnership history');
});
test('the real trainer, horse and owner IDs matter; no inferred loyalty from name or invented results',()=>{
 const s=base();
 mount(s,{id:'8',status:'RESULTED',finish:1,
  trainerId:'P-FICTIONAL-1999-TRAINER-0000002',
  ownerId:otherOwner});
 const current=partnership(s);
 assert.equal(current.trainerMounts,0);
 assert.equal(current.ownerMounts,0);
 assert.equal(current.trainerBond,0);
 assert.equal(current.ownerBond,0);
});

test('May 29 future-only booking stacks cannot buy elite jockey loyalty before any real ride',()=>{
 const s=base();
 for(let i=0;i<16;i++)mount(s,{id:'future-'+i,status:'BOOKED',
  date:'1999-07-01'});
 const before=partnership(s);
 assert.equal(before.trainerMounts,16,
  'All future contracts remain valid signed commitments');
 assert.equal(before.ownerMounts,16);
 assert.equal(before.trainerBookedMounts,16);
 assert.equal(before.ownerBookedMounts,16);
 assert.equal(before.trainerRiddenMounts,0);
 assert.equal(before.ownerRiddenMounts,0);
 assert.equal(before.trainerBond,0);
 assert.equal(before.ownerBond,0);
 assert.equal(before.mostRecentTrainerDate,null);
 const horseRating={starting_attributes:{current_ability:87,
  turf_aptitude:.8,dirt_aptitude:.76,sprint_aptitude:.81,
  route_aptitude:.82}};
 const eligibleRider={skills:{judgment:.88,horse_handling:.84},game_reputation:.76};
 const feature={purse_minor:40000000,stakes_grade:'G1'};
 const quote={mountMinor:16000};
 const fresh=scorePremierJockeyOffer({horse:horseRating,jockey:eligibleRider,
  race:feature,partnership:get1999JockeyPartnership(base(),
   {trainerId:trainer,ownerId:owner,jockeyId:jockey}),quote,bonus_minor:0});
 const reserved=scorePremierJockeyOffer({horse:horseRating,jockey:eligibleRider,
  race:feature,partnership:before,quote,bonus_minor:0});
 assert.equal(reserved.score,fresh.score,
  '16 unrun bookings must confer zero artificial bidding advantage');
 assert.deepEqual(partnership(JSON.parse(JSON.stringify(s))),before,
  'Existing signed commitments and neutral bond persist over save/reopen');
 // Only an actual official result with a date reached by the game clock can
 // mature a booking into earned trust, without changing its permanent ID.
 s.runtime.entries['R-future-0:H-future-0'].status='RESULTED';
 s.runtime.entries['R-future-0:H-future-0'].finish=1;
 s.runtime.races['R-future-0'].status='OFFICIAL_SIM_RESULT';
 s.runtime.races['R-future-0'].results=[{horse_id:'H-future-0',
  jockey_share_minor:11000}];
 assert.equal(partnership(s).trainerBond,0,
  'A future-dated result cannot generate loyalty as of May 29');
 s.clock.date='1999-07-01';
 const matured=partnership(s);
 assert.equal(matured.trainerRiddenMounts,1);
 assert.equal(matured.ownerRiddenMounts,1);
 assert.equal(matured.trainerBond,.093);
 assert.equal(matured.ownerBond,.06);
 assert.equal(matured.mostRecentTrainerDate,'1999-07-01');
 assert.deepEqual(partnership(JSON.parse(JSON.stringify(s))),matured);
});
test('read-only Build 643 May 29 300k shared career copy uses genuine settled rides without touching the baseline',async()=>{
 const source=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
  import.meta.url),bytes=readFileSync(source),
  dir=mkdtempSync(join(tmpdir(),'wtw-jockey-relationship-'));
 const copied=join(dir,'WTW_1999_FULL_WORLD_SHARED_CAREER.COPY.wtwcareer.gz');
 try{
  copyFileSync(source,copied);
  assert.deepEqual(readFileSync(copied),bytes);
  const checkpoint=await unpackShared1999Career(gunzipSync(readFileSync(copied)));
  assert.equal(checkpoint.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
  assert.equal(checkpoint.world.seed,19990101);
  assert.equal(checkpoint.world.horseCount,300000);
  assert.equal(checkpoint.careerRecord.runId,
   'WTW-RUN-1999-19990101-SIZE-300000');
  assert.equal(checkpoint.careerRecord.gameDate,'1999-05-29');
  const reference=checkpoint.careerRecord.changes.canonicalRun;
  assert.equal(reference.clock.date,'1999-05-29');
  const race=Object.values(reference.runtime.races||{}).
   find(r=>r.status==='OFFICIAL_SIM_RESULT'&&r.results?.length);
  assert.ok(race,'Saved real 1999 career must have an official settled race');
  const winner=race.results.find(r=>r.finish===1);
  assert.ok(winner?.jockey_id&&winner.trainer_id&&winner.owner_id);
  const actual=get1999JockeyPartnership(reference,{
   trainerId:winner.trainer_id,ownerId:winner.owner_id,
   jockeyId:winner.jockey_id});
  assert.ok(actual.trainerRiddenMounts>=1,
   'Actual May 29 winning jockey must have a real completed partnership ride');
  assert.ok(actual.ownerRiddenMounts>=1);
  assert.ok(actual.trainerWins>=1);
  assert.ok(actual.trainerBond>0);
  assert.equal(actual.mostRecentTrainerDate<=reference.clock.date,true);
  const stable=structuredClone(reference);
  assert.deepEqual(get1999JockeyPartnership(stable,{
   trainerId:winner.trainer_id,ownerId:winner.owner_id,
   jockeyId:winner.jockey_id}),actual);
  assert.deepEqual(readFileSync(source),bytes,
   'Never advance, rewrite, or overwrite the shared May 29 save');
 }finally{rmSync(dir,{recursive:true,force:true})}
});
