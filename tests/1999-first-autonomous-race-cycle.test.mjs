import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGameRacingRoster,gameRaceProgram,raceEligibility} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
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
 authority:{snapshot_id:'TEST-1999-FIRST-AUTONOMOUS-RACE',
  source:'ISOLATED_1999_GAME_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('1999/first-game-race/v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockey.jockeys});
const run=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,actor,payload}}).state;
const day=s=>run(s,'game:advance:'+s.clock.date,'ADVANCE_DAY');
test('selected jockey names are approved people IDs, and first 1999 game race is authentic modeled condition book',()=>{
 const state=fresh();
 assert.equal(Object.keys(state.runtime.racing.jockeys).length,26);
 assert.equal(Object.keys(state.runtime.registered_horses.by_id).length,38);
 assert.equal(Object.keys(state.runtime.races).length,0);
 const book=gameRaceProgram(state,world,'T-0017','1999-01-09');
 assert.ok(book.length>0);
 assert.ok(book.every(r=>r.conditionBookBasis==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'));
 assert.ok(book.every(r=>r.status==='CONDITION_BOOK_PROPOSAL_NOT_RUN'));
});
test('autonomous trainer + jockey pool books eligible real runner IDs without conflicts or owner cash invention',()=>{
 const state=day(fresh());
 assert.equal(state.clock.date,'1999-01-02');
 const races=getGameRacingRoster(state);
 assert.ok(races.length>=1,'At least one source-linked track should have a race');
 assert.ok(races.every(r=>r.date>state.clock.date));
 assert.ok(races.every(r=>r.source==='WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'));
 const all=races.flatMap(r=>r.field.map(id=>({race:r,entry:state.runtime.entries[id]})));
 assert.ok(all.length>=4,'At least four AI horses should enter valid future races');
 assert.ok(all.every(({entry})=>entry.jockey_id&&entry.status==='BOOKED'));
 const jockeyByDate=new Map();
 for(const {race,entry} of all){
  const horse=state.runtime.registered_horses.by_id[entry.horse_id];
  assert.ok(horse);assert.equal(horse.host_track_id,race.track_id);
  assert.ok(state.runtime.racing.jockeys[entry.jockey_id]);
  assert.equal(entry.owner_id,horse.owner_organization_id);
  assert.notEqual(entry.owner_id,state.player.operation_id,
   'Player horse must not be automatically entered');
  const key=race.date+'|'+entry.jockey_id;
  if(jockeyByDate.has(key))assert.equal(jockeyByDate.get(key),race.track_id);
  jockeyByDate.set(key,race.track_id);
 }
 const bookings=state.event_log.filter(e=>e.kind==='JOCKEY_MOUNT_BOOKED');
 assert.ok(bookings.every(x=>/JOCKEY_ACCEPTS/.test(x.details.reason)&&
  Number.isFinite(x.details.acceptance)));
 assert.equal(bookings.length,all.length);
 const debits=state.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_MOUNT_AND_TRAVEL_FEE');
 const credits=state.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_FEE_RECEIVED');
 assert.equal(debits.length,all.length);assert.equal(credits.length,all.length);
 assert.equal(debits.reduce((n,x)=>n+x.amount_minor,0)+
  credits.reduce((n,x)=>n+x.amount_minor,0),0);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
});
test('first 1999 race completes with full deterministic placings, purse ledger and postrace response',()=>{
 let state=fresh();for(let d=0;d<15;d++)state=day(state);
 const races=getGameRacingRoster(state),complete=races.filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(complete.length>=1,'A track must hold at least one fully booked eligible race');
 for(const r of complete){
  assert.equal(r.results.length,r.field.length);
  assert.ok(r.results.length>=2);
  assert.equal(r.results.reduce((n,x)=>n+x.earnings_minor,0),r.purse_minor);
  assert.equal(r.escrow_minor,0);
  assert.deepEqual(r.results.map(x=>x.finish),Array.from({length:r.results.length},(_,i)=>i+1));
  const feedback=state.event_log.filter(x=>x.kind==='POST_RACE_PROFESSIONAL_FEEDBACK'&&x.details.race_id===r.id);
  assert.equal(feedback.length,r.results.length);
  assert.ok(feedback.every(x=>x.details.owner_trust>=0&&x.details.owner_trust<=1));
  const professional=state.runtime.people[r.results[0].trainer_id].game_race_record;
  assert.ok(professional.starts>=1);
  assert.ok(professional.professional_standing>=0&&professional.professional_standing<=1);
  const rider=state.runtime.racing.jockeys[r.results[0].jockey_id];
  assert.ok(rider.game_reputation>=0&&rider.game_reputation<=1);
  const event=state.event_log.find(x=>x.kind==='RACE_SETTLED'&&x.details.race_id===r.id);
  assert.ok(event);
  const ownerCredits=state.runtime.finances.ledger.filter(x=>x.race_id===r.id&&
   x.kind==='RACE_PURSE_OWNER_CREDIT');
  const jockeyCredits=state.runtime.finances.ledger.filter(x=>x.race_id===r.id&&
   x.kind==='RACE_PURSE_JOCKEY_CREDIT');
  const trainerCredits=state.runtime.finances.ledger.filter(x=>x.race_id===r.id&&
   x.kind==='RACE_PURSE_TRAINER_CREDIT');
  assert.equal(trainerCredits.length,r.results.length);
  const sponsor=state.runtime.finances.ledger.find(x=>x.race_id===r.id&&
   x.kind==='RACE_MODELED_SPONSOR_ESCROW_RELEASE');
  assert.equal(ownerCredits.length,r.results.length);
  assert.equal(jockeyCredits.length,r.results.length);
  assert.ok(r.results.slice(5).every(row=>row.earnings_minor===0),
   'Only five paid places, never an accidental payout to the last finisher');
  assert.equal(sponsor.amount_minor+
   ownerCredits.reduce((n,x)=>n+x.amount_minor,0)+
   jockeyCredits.reduce((n,x)=>n+x.amount_minor,0)+
   trainerCredits.reduce((n,x)=>n+x.amount_minor,0),0);
  for(const row of r.results){
   const h=state.runtime.registered_horses.by_id[row.horse_id];
   assert.ok(h.career.starts>=1);
   assert.ok(h.career.earnings_minor>=row.earnings_minor);
   assert.ok(state.runtime.horse[h.horse_id].history.some(e=>e.kind==='RACE_RECOVERY_PROJECTION'&&e.race_id===r.id));
   assert.equal(row.owner_share_minor+row.trainer_share_minor+row.jockey_share_minor,row.earnings_minor);
  }
 }
 console.info('WTW_1999_RACE_CYCLE_QA',JSON.stringify(complete.map(r=>({
  race_id:r.id,date:r.date,track_id:r.track_id,starters:r.results.length,
  winner_horse_id:r.results[0].horse_id,purse_minor:r.purse_minor
 }))));
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 const second=fresh();let replay=second;for(let d=0;d<15;d++)replay=day(replay);
 assert.deepEqual(replay,state,'Same seed and actor state yield identical 15-day career');
});
test('race eligibility and bookings block unsafe and impossible choices',()=>{
 const state=day(fresh()),race=getGameRacingRoster(state)[0];
 assert.ok(race);
 const playerHorse=Object.values(state.runtime.registered_horses.by_id).
  find(h=>h.owner_organization_id===state.player.operation_id&&h.host_track_id===race.track_id);
 if(playerHorse){
  const invalid={...playerHorse,foaling_year:1998};
  assert.ok(!raceEligibility(state,invalid,race).eligible);
 }
 assert.throws(()=>run(state,'player:steal-entry','ENTER_1999_RACE',
  {race_id:race.id,horse_id:state.runtime.entries[race.field[0]].horse_id},'player'),e=>
   e.code==='RACE_PERMISSION'||e.code==='RACE_FULL_OR_DUPLICATE');
 assert.throws(()=>run(state,'fake:settle','SETTLE_1999_RACE',{race_id:race.id},'player'),e=>e.code==='RACE_PERMISSION');
 assert.throws(()=>run(state,'fake:card','OPEN_1999_RACE',{
  track_id:race.track_id,date:race.date,race_id:'R-FAKE-NOT-PROGRAM'}),e=>e.code==='RACE_PROGRAM');
});
