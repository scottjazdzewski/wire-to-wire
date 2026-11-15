import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 RACE_TACTICS,get1999RaceTacticsPreview,getGameRacingRoster,
 get1999HorseRaceOpportunities,quote1999PlayerRacePlan}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const dir=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...dir.people,...trainers.trainers,...jockeys.jockeys].
 map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'TEST-RACE-TACTICS-LOCAL-1999',
  source:'ISOLATED_OFFLINE_GAMEPLAY_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('offline-race-tactics-v1').digest('hex')},
 entities:{horses:dir.horses,people,organizations:dir.organizations,tracks:dir.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
const command=(s,id,type,payload={},actor='system')=>
 dispatchGameCommand({state:s,world,command:{id,type,actor,payload}});
const day=s=>command(s,'pace:day:'+s.clock.date,'ADVANCE_DAY').state;
function bookedPlayerRun(){
 let s=day(fresh());
 const horses=Object.values(s.runtime.registered_horses.by_id).
  filter(h=>h.owner_organization_id===s.player.operation_id);
 const options=[];
 for(const h of horses){
  const races=get1999HorseRaceOpportunities(s,world,h.horse_id,
   {includeProposals:false}).rows;
  for(const r of races.filter(r=>r.status==='PLAYER_CAN_ENTER')){
   const j=r.available_jockeys.filter(j=>j.owner_can_pay);
   for(const jockey of j){
    const p={horse_id:h.horse_id,race_id:r.race_id,jockey_id:jockey.jockey_id,
     destination_site_id:null};
    const q=quote1999PlayerRacePlan(s,world,p);
    if(q.can_confirm)options.push({horse:h,race:s.runtime.races[r.race_id],
     payload:p,quote:q});
   }
  }
 }
 options.sort((a,b)=>b.race.field.length-a.race.field.length||
  a.race.date.localeCompare(b.race.date)||a.horse.horse_id.localeCompare(b.horse.horse_id));
 const x=options[0];
 assert.ok(x,'At least one funded player-owned horse must have a real local race and accepted jockey');
 const before=JSON.stringify(s);
 s=command(s,'pace:plan:1','CONFIRM_1999_RACE_PLAN',{
  ...x.payload,expected_revision:x.quote.expected_revision,
  maximum_total_minor:x.quote.immediate_total_minor},'player').state;
 assert.equal(JSON.stringify(fresh()).length>1000,true);
 assert.notEqual(JSON.stringify(s),before);
 assert.equal(s.runtime.entries[x.race.id+':'+x.horse.horse_id].status,'BOOKED');
 return {s,x};
}
const set=(s,x,tactic,id='pace:instruction:1',actor='player',revision=s.revision)=>
 command(s,id,'SET_1999_RACE_TACTICS',{
  race_id:x.race.id,horse_id:x.horse.horse_id,tactic,expected_revision:revision},actor);
const preview=(s,x)=>get1999RaceTacticsPreview(s,world,{
 race_id:x.race.id,horse_id:x.horse.horse_id});

test('booked player horse has locally computed field-pressure and jockey-tactic options, not hidden finishing order',()=>{
 const {s,x}=bookedPlayerRun(),before=structuredClone(s),p=preview(s,x);
 assert.deepEqual(p.options.map(x=>x.tactic),RACE_TACTICS);
 assert.equal(p.as_of,s.clock.date);
 assert.equal(p.race_id,x.race.id);
 assert.equal(p.horse_id,x.horse.horse_id);
 assert.equal(p.current_tactic,'AUTO');
 assert.equal(p.historical_result_claimed,false);
 assert.equal(p.field_pressure_index>=0&&p.field_pressure_index<=1,true);
 assert.equal(p.known_rivals,s.runtime.races[x.race.id].field.length-1);
 assert.equal(p.options[0].adjustment,0);
 assert.ok(p.options.some(q=>q.tactic!=='AUTO'&&q.adjustment!==0));
 assert.ok(p.options.every(q=>Math.abs(q.adjustment)<=.085&&
  Number.isFinite(q.pressure)));
 assert.deepEqual(s,before,'Read-only projected strategy has no gameplay, finance or network side effects');
});
test('owner riding instructions persist, are idempotent, can change before the race and are journaled without money',()=>{
 const {s,x}=bookedPlayerRun();
 const p=preview(s,x),initialLedger=s.runtime.finances.ledger.length;
 const change=p.options.filter(q=>q.tactic!=='AUTO').
  sort((a,b)=>Math.abs(b.adjustment)-Math.abs(a.adjustment))[0].tactic;
 let out=set(s,x,change);
 assert.equal(out.duplicate,false);
 assert.equal(out.state.runtime.entries[x.race.id+':'+x.horse.horse_id].race_tactic,change);
 assert.ok(out.events.some(e=>e.kind==='PLAYER_RACE_TACTICS_INSTRUCTED'&&
  e.details.selected_tactic===change&&e.details.finance_changed===false));
 assert.equal(out.state.runtime.finances.ledger.length,initialLedger);
 assert.deepEqual(importGameSave(exportGameSave(out.state,world),world),out.state);
 const again=set(out.state,x,change);
 assert.equal(again.duplicate,true);
 assert.deepEqual(again.state,out.state);
 const reverted=set(out.state,x,'AUTO','pace:instruction:2');
 assert.equal(reverted.state.runtime.entries[x.race.id+':'+x.horse.horse_id].race_tactic,undefined);
 assert.equal(preview(reverted.state,x).current_tactic,'AUTO');
 assert.deepEqual(importGameSave(exportGameSave(reverted.state,world),world),reverted.state);
});
test('tactics require actual owner, booked jockey, live race, valid choice and fresh revision',()=>{
 const {s,x}=bookedPlayerRun(),before=structuredClone(s);
 assert.throws(()=>set(s,x,'LEAD','pace:bad-actor','system'),
  e=>e.code==='RACE_TACTICS_PERMISSION');
 assert.throws(()=>set(s,x,'WIN_AT_ALL_COSTS','pace:invalid'),
  e=>e.code==='RACE_TACTICS_CHOICE');
 assert.throws(()=>set(s,x,'LEAD','pace:stale','player',s.revision-1),
  e=>e.code==='RACE_TACTICS_STALE');
 const other=Object.values(s.runtime.registered_horses.by_id).
  find(h=>h.owner_organization_id!==s.player.operation_id);
 assert.ok(other);
 assert.throws(()=>get1999RaceTacticsPreview(s,world,{
  race_id:x.race.id,horse_id:other.horse_id}),
  e=>e.code==='RACE_TACTICS_PREVIEW');
 assert.throws(()=>get1999RaceTacticsPreview(s,world,{
  race_id:'RACE-FAKE',horse_id:x.horse.horse_id}),
  e=>e.code==='RACE_TACTICS_PREVIEW');
 const noRider=structuredClone(s),entry=noRider.runtime.entries[x.race.id+':'+x.horse.horse_id];
 entry.status='ENTERED';entry.jockey_id=null;
 assert.throws(()=>get1999RaceTacticsPreview(noRider,world,{
  race_id:x.race.id,horse_id:x.horse.horse_id}),e=>e.code==='RACE_TACTICS_PREVIEW');
 assert.deepEqual(s,before,'Invalid attempts do not change canonical saved horse or game finances');
});
test('actual 1999 result applies instructions against the field, preserves purse and older AUTO career behavior',()=>{
 const {s,x}=bookedPlayerRun();
 const outlook=preview(s,x);
 const strategy=outlook.options.filter(v=>v.tactic!=='AUTO').
  sort((a,b)=>Math.abs(b.adjustment)-Math.abs(a.adjustment))[0];
 assert.ok(Math.abs(strategy.adjustment)>0);
 let baseline=s,changed=set(s,x,strategy.tactic).state;
 while(baseline.clock.date<x.race.date){
  baseline=day(baseline);
  changed=day(changed);
 }
 const race0=getGameRacingRoster(baseline).find(r=>r.id===x.race.id),
  race1=getGameRacingRoster(changed).find(r=>r.id===x.race.id);
 assert.equal(race0.status,'OFFICIAL_SIM_RESULT');
 assert.equal(race1.status,'OFFICIAL_SIM_RESULT');
 const result0=race0.results.find(r=>r.horse_id===x.horse.horse_id),
  result1=race1.results.find(r=>r.horse_id===x.horse.horse_id);
 assert.ok(result0&&result1);
 assert.equal(result0.race_tactic,undefined);
 assert.equal(result1.race_tactic,strategy.tactic);
 assert.ok(Number.isFinite(result1.tactical_adjustment_index));
 assert.equal(result1.tactical_adjustment_index,strategy.adjustment);
 assert.ok(changed.event_log.some(e=>e.kind==='RACE_TACTICAL_EXECUTION'&&
  e.details.horse_id===x.horse.horse_id&&
  e.details.tactic===strategy.tactic));
 assert.equal(baseline.event_log.some(e=>e.kind==='RACE_TACTICAL_EXECUTION'),false);
 for(const race of [race0,race1]){
  assert.equal(race.results.length,race.field.length);
  assert.equal(race.results.reduce((n,r)=>n+r.earnings_minor,0),race.purse_minor);
  assert.equal(race.escrow_minor,0);
  assert.ok(race.results.every((r,i)=>r.finish===i+1));
 }
 assert.deepEqual(importGameSave(exportGameSave(changed,world),world),changed);
 assert.deepEqual(importGameSave(exportGameSave(baseline,world),world),baseline);
 assert.throws(()=>set(changed,x,'LEAD','pace:after-result'),
  e=>e.code==='RACE_TACTICS_PREVIEW');
});
test('unsupported saved tactic and mismatched official result attribution reject corrupted portable careers',()=>{
 const {s,x}=bookedPlayerRun();
 let out=set(s,x,'CLOSE').state;
 const invalid=structuredClone(out);
 invalid.runtime.entries[x.race.id+':'+x.horse.horse_id].race_tactic='TELEPORT';
 assert.throws(()=>importGameSave(exportGameSave(invalid,world),world),
  e=>e.code==='RACE_TACTICS_SAVE'||e.code==='SAVE_INVALID');
 assert.deepEqual(importGameSave(exportGameSave(out,world),world),out);
});
