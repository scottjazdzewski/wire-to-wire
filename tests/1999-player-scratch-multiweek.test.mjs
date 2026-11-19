import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,copyFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createHash,webcrypto} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {
 WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGameRacingRoster,get1999HorseRaceOpportunities,quote1999PlayerRacePlan,
 RACING_COMMANDS
} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {unpackShared1999Career} from '../public/1999/engine/shared-1999-career-package.mjs';

const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-PLAYER-SCRATCH-MULTIWEEK-QA',
  source:'ISOLATED_GAME_TEST_NOT_OFFICIAL_HISTORY',
  sha256:createHash('sha256').update('player-scratches-multiweek-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const day=state=>command(state,'scratch:day:'+state.clock.date,'ADVANCE_DAY');
function bookPlayer(){
 let state=day(fresh()),choice=null;
 for(const horse of Object.values(state.runtime.registered_horses.by_id).
  filter(h=>h.owner_organization_id===state.player.operation_id)){
  const opportunities=get1999HorseRaceOpportunities(state,world,horse.horse_id,
   {includeProposals:false}).rows;
  for(const race of opportunities.filter(row=>row.status==='PLAYER_CAN_ENTER')){
   for(const jockey of race.available_jockeys.filter(j=>j.owner_can_pay)){
    const payload={horse_id:horse.horse_id,race_id:race.race_id,
     jockey_id:jockey.jockey_id};
    const quote=quote1999PlayerRacePlan(state,world,payload);
    if(quote.can_confirm){choice={payload,quote};break}
   }
   if(choice)break;
  }
  if(choice)break;
 }
 assert.ok(choice,'Need an actual funded player entry in the existing condition book');
 state=command(state,'scratch:book-player','CONFIRM_1999_RACE_PLAN',{
  ...choice.payload,expected_revision:choice.quote.expected_revision,
  maximum_total_minor:choice.quote.immediate_total_minor},'player');
 return {state,choice};
}
function scratchPlayer(state,choice){
 return command(state,'scratch:owner-withdrawal','SCRATCH_1999_RACE',{
  race_id:choice.payload.race_id,horse_id:choice.payload.horse_id,
  reason:'OWNER_WITHDRAWAL'},'player');
}

test('actual 300,000-horse shared May 29 checkpoint is copied and integrity-verified, never advanced',async()=>{
 globalThis.crypto??=webcrypto;
 const source=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
  import.meta.url);
 const dir=mkdtempSync(join(tmpdir(),'wtw-lane1-checkpoint-'));
 try{
  const copied=join(dir,'shared-1999-copy.wtwcareer.gz');
  const before=createHash('sha256').update(readFileSync(source)).digest('hex');
  copyFileSync(source,copied);
  const checkpoint=await unpackShared1999Career(gunzipSync(readFileSync(copied)));
  assert.equal(checkpoint.world.seed,19990101);
  assert.equal(checkpoint.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
  assert.equal(checkpoint.world.horseCount,300000);
  assert.equal(checkpoint.careerRecord.runId,
   'WTW-RUN-1999-19990101-SIZE-300000');
  assert.equal(checkpoint.careerRecord.gameDate,'1999-05-29');
  assert.equal(checkpoint.careerRecord.changes.canonicalRun.clock.date,'1999-05-29');
  assert.equal(createHash('sha256').update(readFileSync(copied)).digest('hex'),before);
  assert.equal(createHash('sha256').update(readFileSync(source)).digest('hex'),before);
 }finally{rmSync(dir,{recursive:true,force:true})}
});

test('player books a real accepting jockey, then withdraws without phantom refund or a race start',()=>{
 assert.ok(RACING_COMMANDS.includes('SCRATCH_1999_RACE'));
 const {state,choice}=bookPlayer();
 const race=state.runtime.races[choice.payload.race_id];
 const id=race.id+':'+choice.payload.horse_id,entry=state.runtime.entries[id];
 assert.equal(entry.status,'BOOKED');
 assert.ok(race.field.includes(id));
 assert.ok(entry.fee_minor>0);
 const money=JSON.stringify(state.runtime.finances);
 const jockeyMoney=JSON.stringify(state.runtime.racing.jockey_finances_minor);
 const rival=Object.values(state.runtime.entries).find(e=>
  e.owner_id!==state.player.operation_id&&e.status==='BOOKED');
 assert.ok(rival);
 const trainerRole={...state,player:{...state.player,role:'trainer'}};
 assert.throws(()=>command(trainerRole,'scratch:wrong-role','SCRATCH_1999_RACE',{
  race_id:race.id,horse_id:entry.horse_id},'player'),
  e=>e.code==='RACE_PERMISSION','A trainer-role player cannot act as the owner');
 assert.throws(()=>command(state,'scratch:steal','SCRATCH_1999_RACE',{
  race_id:rival.race_id,horse_id:rival.horse_id},'player'),
  e=>e.code==='RACE_PERMISSION');
 assert.throws(()=>command(state,'scratch:pretend-vet','SCRATCH_1999_RACE',{
  race_id:race.id,horse_id:entry.horse_id,reason:'RACE_DAY_WELFARE_OR_BOOKING'},'player'),
  e=>e.code==='RACE_SCRATCH_REASON');
 const next=scratchPlayer(state,choice),withdrawn=next.runtime.entries[id];
 assert.equal(withdrawn.status,'SCRATCHED');
 assert.equal(withdrawn.scratch_actor,'player');
 assert.equal(withdrawn.scratch_reason,'OWNER_WITHDRAWAL');
 assert.equal(withdrawn.scratch_date,next.clock.date);
 assert.equal(next.runtime.races[race.id].field.includes(id),false);
 assert.equal(JSON.stringify(next.runtime.finances),money);
 assert.equal(JSON.stringify(next.runtime.racing.jockey_finances_minor),jockeyMoney);
 assert.equal(next.runtime.registered_horses.by_id[entry.horse_id].career.starts,0);
 const audit=next.event_log.find(e=>e.kind==='RACE_ENTRY_SCRATCHED'&&
  e.details.horse_id===entry.horse_id);
 assert.ok(audit);
 assert.equal(audit.details.booked_fee_retained_minor,entry.fee_minor);
 assert.equal(audit.details.refund_minor,0);
 assert.deepEqual(importGameSave(exportGameSave(next,world),world),next);
 assert.throws(()=>command(next,'scratch:again','SCRATCH_1999_RACE',{
  race_id:race.id,horse_id:entry.horse_id},'player'),e=>e.code==='RACE_SCRATCH');
 assert.deepEqual(state.runtime.entries[id],entry,'Original transaction is never mutated');
});

test('three consecutive racing weeks settle genuine races and reopen with the same fees, placings, form and class',()=>{
 const {state:booked,choice}=bookPlayer();
 let state=scratchPlayer(booked,choice);
 const scratchedId=choice.payload.race_id+':'+choice.payload.horse_id;
 const originalSource=JSON.stringify(world);
 const officialAt=new Map();
 for(let week=1;week<=3;week++){
  for(let d=0;d<7;d++)state=day(state);
  const saved=exportGameSave(state,world);
  state=importGameSave(saved,world); // actual close/reopen boundary each week
  assert.equal(state.clock.days_elapsed,1+week*7);
  assert.equal(state.runtime.entries[scratchedId].status,'SCRATCHED');
  assert.equal(state.runtime.registered_horses.by_id[choice.payload.horse_id].career.starts,0);
  const official=getGameRacingRoster(state).filter(r=>r.status==='OFFICIAL_SIM_RESULT');
  assert.ok(official.length>=2,'At least two real race fields should have settled in three weeks');
  for(const race of official){
   assert.equal(race.results.length,race.field.length);
   assert.ok(race.results.length>=2);
   assert.deepEqual(race.results.map(r=>r.finish),
    Array.from({length:race.results.length},(_,i)=>i+1));
   assert.equal(race.results.reduce((n,row)=>n+row.earnings_minor,0),race.purse_minor);
   for(const row of race.results){
    const horse=state.runtime.registered_horses.by_id[row.horse_id];
    assert.ok(horse.career.starts>=1);
    assert.ok(horse.career.earnings_minor>=row.earnings_minor);
    assert.ok(state.runtime.horse[row.horse_id].history.some(e=>
     e.kind==='RACE_RECOVERY_PROJECTION'&&e.race_id===race.id));
    assert.equal(row.owner_share_minor+row.trainer_share_minor+
     row.jockey_share_minor,row.earnings_minor);
   }
   const ledger=state.runtime.finances.ledger.filter(row=>row.race_id===race.id&&
    row.kind.startsWith('RACE_PURSE_'));
   assert.equal(ledger.reduce((n,row)=>n+row.amount_minor,0),race.purse_minor);
   const sponsor=state.runtime.finances.ledger.filter(row=>row.race_id===race.id&&
    row.kind==='RACE_MODELED_SPONSOR_ESCROW_RELEASE');
   assert.equal(sponsor.length,1);
   assert.equal(sponsor[0].amount_minor,-race.purse_minor);
   const snapshot=JSON.stringify(race.results);
   if(officialAt.has(race.id))assert.equal(snapshot,officialAt.get(race.id),
    'Later weeks cannot rerun or change a published result');
   officialAt.set(race.id,snapshot);
  }
  const ownerCash=state.runtime.finances.operation_balances_minor[state.player.operation_id];
  assert.equal(state.runtime.finances.balance_minor,ownerCash);
 }
 assert.ok(officialAt.size>=2);
 const actualSettlements=state.event_log.filter(e=>e.kind==='RACE_SETTLED');
 assert.equal(actualSettlements.length,officialAt.size,
  'One canonical settlement event per permanently official race');
 const totalStarters=[...officialAt.keys()].reduce((sum,id)=>
  sum+state.runtime.races[id].results.length,0);
 assert.ok(totalStarters>=officialAt.size*2);
 console.log('WTW_LANE1_PILOT_ACTUAL_RACING_COUNTS '+JSON.stringify({
  world:'EXISTING_38_HORSE_PILOT_NOT_FULL_V10',
  days_advanced:state.clock.days_elapsed,
  official_races:officialAt.size,
  settlement_events:actualSettlements.length,
  starters:totalStarters,
  manual_scratches:state.event_log.filter(e=>e.kind==='RACE_ENTRY_SCRATCHED').length,
  automatic_scratches:state.event_log.filter(e=>e.kind==='RACE_DAY_SCRATCH').length
 }));
 assert.ok(state.event_log.some(e=>e.kind==='HORSE_MAIDEN_GRADUATED'));
 assert.ok(state.event_log.some(e=>e.kind==='RACE_SETTLED'));
 assert.equal(JSON.stringify(world),originalSource);
 assert.equal(state.runtime.finances.ledger.filter(row=>
  row.race_id===choice.payload.race_id&&
  row.horse_id===choice.payload.horse_id&&row.kind==='RACE_PURSE_OWNER_CREDIT').length,0);
 const found=Object.values(state.runtime.races).find(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(found);
 assert.throws(()=>command(state,'scratch:late','SCRATCH_1999_RACE',{
  race_id:found.id,horse_id:found.results[0].horse_id},'system'),
  e=>e.code==='RACE_SCRATCH');
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
});
