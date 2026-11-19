import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,getGameRacingRoster}
 from '../src/game/index.js';
import {raceEligibility,racingAction} from '../src/game/racing-1999.js';
import {run1999RacingAgents} from '../src/game/race-agents-1999.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {trackMeetOpen1999} from '../public/next/1999-track-program.mjs';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const seen=new Set(directory.people.map(p=>p.id));
const people=[...directory.people];
for(const p of [...trainer.trainers,...jockey.jockeys])
 if(!seen.has(p.id)){people.push(p);seen.add(p.id)}
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-1999-V10-RACE-GUARD',
  source:'1999-ISOLATED-GAME-TEST',
  sha256:createHash('sha256').update('1999/v10/lane5/race-guard').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};
function sourceState(){
 const initial=build1999PilotGameRun({world,manifest,jockeys:jockey.jockeys});
 const state=dispatchGameCommand({state:initial,world,command:{
  id:'lane5:opening-review',type:'ADVANCE_DAY',actor:'system',payload:{}
 }}).state;
 const race=getGameRacingRoster(state).find(r=>r.status==='ENTRIES_OPEN'&&r.field.length>=2);
 assert.ok(race,'game secretary must have opened a source-backed race with booked participants');
 assert.equal(trackMeetOpen1999(race.track_id,race.date),true);
 return {state,race:state.runtime.races[race.id]};
}
function unenterBookedHorse(state,race){
 const entryId=race.field.find(id=>state.runtime.entries[id]?.status==='BOOKED');
 assert.ok(entryId,'need a genuinely booked opening game horse');
 const horse=state.runtime.registered_horses.by_id[state.runtime.entries[entryId].horse_id];
 delete state.runtime.entries[entryId];
 race.field=race.field.filter(id=>id!==entryId);
 assert.equal(raceEligibility(state,horse,race).eligible,true,
  'originally entered canonical horse must remain eligible without its old entry');
 return horse;
}
function expectEntryRejection(state,race,horse,code){
 const priorEntries=Object.keys(state.runtime.entries).length;
 const priorField=race.field.length;
 assert.throws(()=>racingAction({state,world,emit:()=>{},command:{
  type:'ENTER_1999_RACE',actor:'system',payload:{
   race_id:race.id,horse_id:horse.horse_id}
 }}),err=>err?.code==='RACE_INELIGIBLE'&&err.message.includes(code),
  'engine must refuse '+code+' without creating an entry');
 assert.equal(Object.keys(state.runtime.entries).length,priorEntries);
 assert.equal(race.field.length,priorField);
}
test('V10 race entry refuses inactive horse, wrong age/venue/class/date, in actual opened condition book',()=>{
 const {state,race}=sourceState();
 const horse=unenterBookedHorse(state,race);
 assert.equal(horse.status,'IN_TRAINING');
 {
  const altered={...horse,status:'RETIRED'};
  state.runtime.registered_horses.by_id[horse.horse_id]=altered;
  expectEntryRejection(state,race,altered,'HORSE_NOT_ACTIVE_RACEHORSE');
 }
 state.runtime.registered_horses.by_id[horse.horse_id]=horse;
 {
  const bad={...race,age:1999-horse.foaling_year===2?'4YO+':'2YO'};
  state.runtime.races[race.id]=bad;
  expectEntryRejection(state,bad,horse,'AGE_RESTRICTION');
 }
 state.runtime.races[race.id]=race;
 {
  const bad={...race,conditions:'Claiming',maiden:false,max_wins:null};
  state.runtime.races[race.id]=bad;
  expectEntryRejection(state,bad,horse,'CLASS_CONDITIONS_NOT_YET_MODELED');
 }
 state.runtime.races[race.id]=race;
 {
  const previous=horse.host_track_id;
  horse.host_track_id='T-0028';
  if(previous==='T-0028')horse.host_track_id='T-0001';
  expectEntryRejection(state,race,horse,'NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE');
  horse.host_track_id=previous;
 }
 {
  const bad={...race,date:'1999-02-29'};
  state.runtime.races[race.id]=bad;
  expectEntryRejection(state,bad,horse,'RACECOURSE_NOT_RUNNING_ON_DATE');
 }
 state.runtime.races[race.id]=race;
 {
  const bad={...race,surface:'SYNTHETIC'};
  state.runtime.races[race.id]=bad;
  expectEntryRejection(state,bad,horse,'RACE_SURFACE_OR_DISTANCE_NOT_OFFERED');
 }
 state.runtime.races[race.id]=race;
 {
  const site=state.runtime.facilities.sites[horse.current_residence_id];
  const saved=site.status;
  site.status='CLOSED';
  expectEntryRejection(state,race,horse,'RACE_CARE_FACILITY_NOT_OPERATING');
  site.status=saved;
 }
 assert.equal(raceEligibility(state,horse,race).eligible,true,
  'original legitimate game condition remains enterable');
 racingAction({state,world,emit:()=>{},command:{
  type:'ENTER_1999_RACE',actor:'system',payload:{
   race_id:race.id,horse_id:horse.horse_id}
 }});
 assert.ok(state.runtime.entries[race.id+':'+horse.horse_id]);
});
test('V10 race-day settlement rechecks status after valid booking and cannot publish phantom result',()=>{
 const {state,race}=sourceState();
 const entry=state.runtime.entries[race.field[0]],horse=state.runtime.registered_horses.by_id[entry.horse_id];
 const originalStatus=horse.status;
 state.clock.date=race.date;
 const beforeLedger=state.runtime.finances.ledger.length;
 const beforeStarts=horse.career.starts;
 horse.status='RETIRED';
 assert.throws(()=>racingAction({state,world,emit:()=>{},command:{
  type:'SETTLE_1999_RACE',actor:'system',payload:{race_id:race.id}
 }}),err=>err?.code==='RACE_DAY_INELIGIBLE'&&
  err.message.includes('HORSE_NOT_ACTIVE_RACEHORSE'));
 assert.equal(race.status,'ENTRIES_OPEN');
 assert.equal(race.results,null);
 assert.equal(state.runtime.finances.ledger.length,beforeLedger);
 assert.equal(horse.career.starts,beforeStarts);
 horse.status=originalStatus;
});

test('V10 real race secretary scratches after-booking retired runner before paid settlement',()=>{
 const {state,race}=sourceState();
 const entryId=race.field.find(id=>state.runtime.entries[id].status==='BOOKED');
 const horse=state.runtime.registered_horses.by_id[state.runtime.entries[entryId].horse_id];
 const events=[];
 // Isolated advancing-clock boundary: only the existing race secretary
 // runs here, not a fabricated winner or independently settled fixture.
 state.clock.date=race.date;
 state.clock.days_elapsed=9;
 horse.status='RETIRED';
 const starts=horse.career.starts;
 run1999RacingAgents({state,world,emit:(kind,details)=>events.push({kind,details})});
 assert.equal(state.runtime.entries[entryId].status,'SCRATCHED');
 assert.equal(race.field.includes(entryId),false);
 assert.equal(horse.career.starts,starts);
 assert.ok(events.some(e=>e.kind==='RACE_DAY_SCRATCH'&&
  e.details.horse_id===horse.horse_id&&
  e.details.ineligible_reasons.includes('HORSE_NOT_ACTIVE_RACEHORSE')));
 assert.ok(!race.results?.some(row=>row.horse_id===horse.horse_id));
 assert.ok(['OFFICIAL_SIM_RESULT','CANCELLED_INSUFFICIENT_FIELD'].includes(race.status),
  'game clock must continue to a real result for remaining eligible horses or cancel');
});

test('V10 visitors use the staffed receiving barn, not the dark home site, with a real arrival buffer',()=>{
 const {state,race}=sourceState();
 const horse=unenterBookedHorse(state,race);
 const home=state.runtime.facilities.sites[horse.current_residence_id];
 const receivingId='F-LANE5-RECEIVING-1999';
 state.runtime.facilities.sites[receivingId]={
  ...structuredClone(home),id:receivingId,host_track_id:race.track_id,
  status:'ACTIVE',staff_count:Math.max(2,home.staff_required??2),
  staff_required:Math.max(1,home.staff_required??1)};
 const trip={
  status:'AT_DESTINATION',horse_id:horse.horse_id,
  destination_site_id:receivingId,destination_track_id:race.track_id,
  arrival_date:'1999-01-02'};
 state.runtime.racing.horse_travel[horse.horse_id]=trip;
 const oldHomeStatus=home.status;
 home.status='CLOSED';
 assert.equal(raceEligibility(state,horse,race).eligible,true,
  'horse at the paid local receiving barn is eligible despite dark permanent barn');
 const receiving=state.runtime.facilities.sites[receivingId];
 receiving.staff_count=0;
 assert.ok(raceEligibility(state,horse,race).reasons.
  includes('RACE_CARE_FACILITY_NOT_OPERATING'));
 receiving.staff_count=2;
 trip.status='OUTBOUND';
 trip.arrival_date='1999-01-03';
 assert.equal(raceEligibility(state,horse,race).eligible,true,
  'real booked carrier can enter when arriving two full days before race');
 trip.arrival_date=race.date;
 assert.ok(raceEligibility(state,horse,race).reasons.
  includes('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'),
  'outbound carrier cannot enter if race-day arrival violates acclimation');
 home.status=oldHomeStatus;
});

test('future-year racing age increments on January 1 without manufacturing a 2000 race card',()=>{
 const {state,race}=sourceState();
 const horse=Object.values(state.runtime.registered_horses.by_id).
  find(h=>h.foaling_year===1996&&h.status==='IN_TRAINING');
 assert.ok(horse,'game cohort includes a real 1996 foal that becomes a 4YO in 2000');
 // Pure eligibility hypotheticals, deliberately NOT approved or opened
 // racing opportunities. 2000 meets need separate seasonal authorization.
 const sample={...race,id:'R-AGE-HYPOTHETICAL-NOT-A-PROGRAM',
  source:'UNIT_HYPOTHETICAL_ONLY',conditions:'Maiden Special Weight',
  maiden:true,max_wins:null,age:'4YO+',sex:'OPEN'};
 state.clock.date='1999-12-20';
 sample.date='1999-12-29';
 assert.ok(raceEligibility(state,horse,sample).reasons.includes('AGE_RESTRICTION'));
 sample.date='2000-01-10';
 assert.equal(raceEligibility(state,horse,sample).reasons.includes('AGE_RESTRICTION'),false);
});
