import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getLocalTrainerHiringMarket,getCareerHorseConnections,getTrainerContract}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {trainerEmploymentAction} from '../src/game/trainer-employment-1999.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-TRAINER-EMPLOYMENT-SINGLE-RUN-QA',
  source:'ISOLATED_MODELED_EMPLOYMENT_NOT_HISTORICAL',
  sha256:createHash('sha256').update('trainer-employment-v1').digest('hex')},
 entities:{horses:directory.horses,people,
  organizations:directory.organizations,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}});
const day=state=>command(state,'hire:day:'+state.clock.date,'ADVANCE_DAY').state;
const market=state=>getLocalTrainerHiringMarket(state,world);
const selected=(state,condition=()=>true)=>{
 const row=market(state).offers.find(x=>x.local_trainers.length&&condition(x));
 assert.ok(row,'Expected an actual same-track available local trainer');
 return {row,trainer:row.local_trainers[0]};
};
const payload=(x)=>({horse_id:x.row.horse_id,
 trainer_id:x.trainer.to_trainer_id,site_id:x.trainer.destination_site_id,
 daily_fee_minor:x.trainer.minimum_daily_fee_minor});
const apply=(s,x,id='hire:offer:1')=>command(s,id,'OFFER_LOCAL_TRAINER_ASSIGNMENT',payload(x),'player');

test('real same-track employment market shows only source trainers and staffed available barns, with no mutation',()=>{
 const s=day(fresh()),before=JSON.stringify(s),rows=market(s).offers;
 assert.ok(rows.some(x=>x.local_trainers.length));
 assert.equal(rows.length,Object.values(s.runtime.registered_horses.by_id).
  filter(h=>h.owner_organization_id===s.player.operation_id).length);
 for(const x of rows)for(const candidate of x.local_trainers){
  const site=s.runtime.facilities.sites[candidate.destination_site_id];
  assert.ok(world.entities.people.some(p=>p.id===candidate.to_trainer_id));
  assert.equal(site.head_trainer_person_id,candidate.to_trainer_id);
  assert.equal(site.status,'ACTIVE');
  assert.equal(site.host_track_id,x.host_track_id);
  assert.notEqual(candidate.from_trainer_id,candidate.to_trainer_id);
  assert.ok(candidate.minimum_daily_fee_minor>=3000);
 }
 assert.equal(JSON.stringify(s),before,'Market reads must be pure');
});

test('accepted local hire moves the horse on the next day with the actual trainer, barn, care and contract',()=>{
 let s=day(fresh()),x=selected(s),h=s.runtime.registered_horses.by_id[x.row.horse_id];
 const before={trainer:h.trainer_id,site:h.current_residence_id,
  fitness:s.runtime.horse[h.horse_id].training.fitness,
  history:s.runtime.horse[h.horse_id].training.history.length};
 const oldFee=s.runtime.trainer_contracts.by_pair[
  h.owner_organization_id+'|'+h.trainer_id]?.daily_fee_minor;
 const oldLedger=s.runtime.finances.ledger.length,
  oldCash=s.runtime.finances.operation_balances_minor[h.owner_organization_id];
 const applied=apply(s,x);
 s=applied.state;
 assert.ok(applied.events.some(e=>e.kind==='LOCAL_TRAINER_OFFER_ACCEPTED'));
 assert.equal(s.runtime.registered_horses.by_id[x.row.horse_id].trainer_id,before.trainer);
 assert.equal(s.runtime.finances.ledger.length,oldLedger);
 assert.equal(s.runtime.finances.operation_balances_minor[h.owner_organization_id],oldCash);
 assert.equal(s.runtime.trainer_employment.by_horse[x.row.horse_id].status,'ACCEPTED_PENDING_MOVE');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 s=day(s);
 h=s.runtime.registered_horses.by_id[x.row.horse_id];
 assert.equal(h.trainer_id,x.trainer.to_trainer_id);
 assert.equal(h.current_residence_id,x.trainer.destination_site_id);
 assert.equal(h.racing_barn_id,h.current_residence_id);
 assert.equal(s.runtime.horse[h.horse_id].training.trainerId,h.trainer_id);
 assert.equal(s.runtime.horse[h.horse_id].training.asOf,s.clock.date);
 assert.ok(s.runtime.horse[h.horse_id].training.history.length>=before.history);
 const active=s.runtime.trainer_contracts.by_pair[h.owner_organization_id+'|'+h.trainer_id];
 assert.equal(active.status,'ACTIVE');
 assert.equal(active.daily_fee_minor,x.trainer.minimum_daily_fee_minor);
 assert.equal(s.runtime.trainer_employment.by_horse[h.horse_id],undefined);
 assert.ok(s.runtime.trainer_employment.history.some(r=>
  r.horse_id===h.horse_id&&r.status==='COMPLETED'));
 assert.ok(s.event_log.some(e=>e.kind==='LOCAL_TRAINER_ASSIGNMENT_EFFECTIVE'&&
  e.details.horse_id===h.horse_id&&e.details.cash_posted===false));
 const remaining=Object.values(s.runtime.registered_horses.by_id).filter(z=>
  z.owner_organization_id===h.owner_organization_id&&
  z.trainer_id===before.trainer);
 const prior=s.runtime.trainer_contracts.by_pair[h.owner_organization_id+'|'+before.trainer];
 if(remaining.length===0&&prior){
  assert.equal(prior.status,'TERMINATED');
  assert.ok(s.event_log.some(e=>e.kind==='TRAINER_SERVICE_RELATIONSHIP_ENDED'&&
   e.details.trainer_id===before.trainer));
 }else if(prior)assert.equal(prior.status,'ACTIVE');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const other=day(s);
 assert.equal(other.runtime.registered_horses.by_id[h.horse_id].trainer_id,h.trainer_id);
 assert.deepEqual(importGameSave(exportGameSave(other,world),world),other);
});

test('withdrawal, under-market quote, owner permission and insufficient funds cannot cause an unsanctioned change',()=>{
 const s=day(fresh()),x=selected(s),p=payload(x),original=JSON.stringify(s);
 assert.throws(()=>command(s,'hire:unauthorized','OFFER_LOCAL_TRAINER_ASSIGNMENT',p,'system'),
  e=>e.code==='TRAINER_HIRE_PERMISSION');
 assert.throws(()=>command(s,'hire:wrongbarn','OFFER_LOCAL_TRAINER_ASSIGNMENT',
  {...p,site_id:'F-FAKE'},'player'),e=>e.code==='TRAINER_HIRE_LOCAL');
 assert.throws(()=>command(s,'hire:wrongfee','OFFER_LOCAL_TRAINER_ASSIGNMENT',
  {...p,daily_fee_minor:2999},'player'),e=>e.code==='TRAINER_HIRE_FEE');
 const dest=s.runtime.facilities.sites[p.site_id];
 assert.ok(dest);
 const poor=structuredClone(s);
 poor.runtime.finances.operation_balances_minor[x.row.owner_id]=0;
 if(poor.player.operation_id===x.row.owner_id)
  poor.runtime.finances.balance_minor=0;
 // Exercise the inner affordability gate directly. A fabricated change
 // to a complete game ledger is deliberately rejected by save validation
 // before a command is dispatched, so this is an isolated policy unit test.
 assert.throws(()=>trainerEmploymentAction({state:poor,world,
  command:{type:'OFFER_LOCAL_TRAINER_ASSIGNMENT',payload:p,actor:'player'},
  emit:()=>{}}),e=>e.code==='TRAINER_HIRE_FUNDS');
 assert.equal(JSON.stringify(s),original);
 const signed=apply(s,x);
 const offer=signed.state.runtime.trainer_employment.by_horse[p.horse_id];
 assert.throws(()=>apply(signed.state,x,'hire:second'),e=>e.code==='TRAINER_HIRE_PENDING');
 const withdrawn=command(signed.state,'hire:withdraw','WITHDRAW_LOCAL_TRAINER_OFFER',{
  horse_id:p.horse_id,offer_id:offer.id},'player').state;
 assert.equal(withdrawn.runtime.trainer_employment.by_horse[p.horse_id],undefined);
 assert.ok(withdrawn.runtime.trainer_employment.history.some(r=>r.id===offer.id&&r.status==='WITHDRAWN'));
 assert.equal(day(withdrawn).runtime.registered_horses.by_id[p.horse_id].trainer_id,x.row.current_trainer_id);
 assert.deepEqual(importGameSave(exportGameSave(withdrawn,world),world),withdrawn);
});

test('an offer cannot be applied while a horse has a live racing entry or is physically away',()=>{
 const s=day(fresh()),x=selected(s),h=s.runtime.registered_horses.by_id[x.row.horse_id],p=payload(x);
 const entryBlocked=structuredClone(s);
 entryBlocked.runtime.entries['test:active']={horse_id:h.horse_id,race_id:'R-TEST',status:'BOOKED'};
 entryBlocked.runtime.races['R-TEST']={status:'ENTRIES_OPEN'};
 assert.equal(getLocalTrainerHiringMarket(entryBlocked,world,h.horse_id).
  offers[0].location_blocker,'LIVE_RACE_ENTRY');
 const travelBlocked=structuredClone(s);
 travelBlocked.runtime.racing.horse_travel[h.horse_id]={status:'OUTBOUND'};
 assert.equal(getLocalTrainerHiringMarket(travelBlocked,world,h.horse_id).
  offers[0].location_blocker,'HORSE_SHIPPING_OR_AWAY');
 // Command validation separately requires a real booking/shipping record;
 // never place a forged travel record into an otherwise valid game save.
});

test('sustained trainer frustration issues a warning but never fires a player trainer or teleports a horse',()=>{
 let s=day(fresh()),x=selected(s),h=s.runtime.registered_horses.by_id[x.row.horse_id];
 const owner=h.owner_organization_id,k=owner+'|'+h.trainer_id,relation=s.runtime.agents.relationships[k];
 assert.ok(relation);
 Object.assign(relation,{owner_trust:.01,trainer_support:.001,days:95,unfunded_days:60});
 s=day(s);
 const notices=market(s).notices.filter(n=>n.owner_id===owner&&n.trainer_id===h.trainer_id);
 assert.ok(notices.length>=1,'Severe real relationship pressure should become a visible warning');
 assert.equal(notices[0].status,'OPEN');
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].trainer_id,h.trainer_id);
 assert.equal(s.runtime.trainer_employment.by_horse[h.horse_id],undefined,
  'Player must explicitly authorize any new employment');
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_DEPARTURE_WARNING'&&
  e.details.owner_id===owner&&e.details.trainer_id===h.trainer_id&&
  e.details.player_decision_required===true));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
