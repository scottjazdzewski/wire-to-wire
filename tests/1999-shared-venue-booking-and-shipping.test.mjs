import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
import {get1999HorseRaceOpportunities,shippingAssessment}
 from '../src/game/index.js';

globalThis.crypto??=webcrypto;
const asset=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
 import.meta.url);
const getSaved=async()=>{
 const p=await unpackShared1999Career(gunzipSync(readFileSync(asset)));
 assert.equal(p.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(p.world.horseCount,300000);
 assert.equal(p.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 return p;
};
const venueWorld={entities:{tracks:[
 {id:'T-0001',name:'Aqueduct',playableIn1999:true},
 {id:'T-0032',name:'Bay Meadows',playableIn1999:true},
 {id:'T-0075',name:'San Mateo County Fair',playableIn1999:true}
]}};

test('shared May 1999 saved horse sees genuine August fair proposals at its same physical venue',async()=>{
 const checkpoint=await getSaved();
 const state=structuredClone(checkpoint.careerRecord.changes.canonicalRun);
 const original=Object.values(state.runtime.registered_horses.by_id).
  find(h=>h.starting_attributes&&h.current_residence_id&&
   !['OUTBOUND','RETURNING','AT_DESTINATION'].includes(
    state.runtime.racing?.horse_travel?.[h.horse_id]?.status));
 assert.ok(original,'must read a real registered horse from the canonical career');
 // Isolated scenario changes only a COPY of the actual career.
 state.clock.date='1999-08-01';
 state.runtime.registered_horses.by_id[original.horse_id]={
  ...original,host_track_id:'T-0032'};
 const horse=state.runtime.registered_horses.by_id[original.horse_id];
 const rows=get1999HorseRaceOpportunities(state,venueWorld,horse.horse_id,{
  horizonDays:21,includeProposals:true,limit:200}).rows;
 assert.ok(rows.some(r=>r.track_id==='T-0075'&&r.date==='1999-08-14'),
  'a Bay Meadows resident must see the existing San Mateo fair condition book');
 assert.ok(rows.filter(r=>r.track_id==='T-0075').every(r=>
  r.status==='CONDITION_BOOK_PROPOSAL_NOT_ENTERABLE'),
  'opportunity list must never pretend an unopened fair race has started');
 assert.ok(rows.every(r=>!r.historical_results_claimed));
 assert.equal(checkpoint.careerRecord.changes.canonicalRun.
  runtime.registered_horses.by_id[original.horse_id].host_track_id,
  original.host_track_id,'no mutation of source career');
});

test('real approved San Mateo fair race permits shipping to its Bay Meadows receiving barn',async()=>{
 const checkpoint=await getSaved();
 const original=Object.values(checkpoint.careerRecord.changes.canonicalRun.
  runtime.registered_horses.by_id).find(h=>h.starting_attributes);
 assert.ok(original);
 const book=buildConditionBook1999({date:'1999-08-14',
  track:{id:'T-0075',name:'San Mateo County Fair'},trackIndex:74,
  seed:checkpoint.world.seed,includeKnownStakes:false});
 assert.ok(book.length>0,'only the approved existing fair race card may be assessed');
 const race=book[0];
 const horse={...original,host_track_id:'T-0001',current_residence_id:'F-L5-HOME'};
 const home={id:'F-L5-HOME',status:'ACTIVE',type:'RACING_STABLE',
  host_track_id:'T-0001',staff_count:2,staff_required:1,
  stalls:30,contracts:[],location:{city:'Queens',state:'New York',country:'USA'}};
 const away={...home,id:'F-L5-BAY',host_track_id:'T-0032',
  location:{city:'San Mateo',state:'California',country:'USA'}};
 const state={clock:{date:'1999-08-01'},runtime:{
  registered_horses:{by_id:{[horse.horse_id]:horse}},
  facilities:{sites:{[home.id]:home,[away.id]:away}},
  racing:{horse_travel:{}},entries:{},
  horse:{[horse.horse_id]:{policy:{monthly_budget_minor:150000},
   training:{sorenessDays:0,currentRisk:.1,readiness:.8}}},
  finances:{operation_balances_minor:{[horse.owner_organization_id]:10000000}},
  races:{[race.id]:{id:race.id,track_id:'T-0075',
   date:race.date,status:'ENTRIES_OPEN'}}
 }};
 const quote=shippingAssessment(state,venueWorld,horse.horse_id,away.id,{
  targetRaceId:race.id});
 assert.equal(quote.allowed,true,JSON.stringify(quote.reasons));
 assert.equal(quote.destination_track_id,'T-0032');
 assert.equal(quote.target_race_id,race.id);
 assert.equal(quote.route.band,'CROSS_COUNTRY');
 assert.ok(quote.route.days>=2&&quote.route.cost_minor>0);
 assert.equal(quote.reasons.includes('UNKNOWN_DESTINATION_RACE'),false,
  'the fair meeting ID must resolve against the physical receiving track ID');
 const impossible=shippingAssessment(state,venueWorld,horse.horse_id,home.id,{
  targetRaceId:race.id});
 assert.equal(impossible.allowed,false,'home barn is not a fair receiving barn');
});
