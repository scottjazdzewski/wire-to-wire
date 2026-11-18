import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGameHorsePerformance,getAgentRelationships} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=load('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=load('../public/data/wtw-1999-trainer-pilot-v1.json');
const cohort=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const approved=new Set(directory.people.map(x=>x.id));
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'AUTONOMOUS-1999-TEST-ONLY',
  source:'MODELED_NONCANONICAL_AGENT_INTEGRATION',
  sha256:createHash('sha256').update('agents/causal/1999').digest('hex')},
 entities:{horses:directory.horses,tracks:directory.tracks,
  organizations:directory.organizations,people:[
   ...directory.people,...trainers.trainers.filter(x=>!approved.has(x.id))]}};
const create=()=>build1999PilotGameRun({world,manifest:cohort});
const run=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const day=state=>run(state,'agent:test:'+state.clock.date,'ADVANCE_DAY');
const otherOwner=cohort.assignments.find(x=>x.owner_organization_id!==cohort.assignments[0].owner_organization_id).owner_organization_id;
test('all active owners, trainers and barn operators evaluate real state each day, with reproducible decisions',()=>{
 const start=create();
 const one=day(start),same=day(create());
 assert.deepEqual(one,same);
 assert.equal(one.clock.date,'1999-01-02');
 assert.equal(one.runtime.agents.last_day,one.clock.date);
 assert.equal(one.runtime.agents.totals.trainer_days,6);
 assert.ok(one.runtime.agents.totals.owner_reviews>=2);
 assert.equal(one.runtime.agents.totals.barn_reviews,8);
 assert.equal(one.runtime.agents.totals.workout_directives,38);
 const decisions=one.event_log.filter(x=>x.kind==='TRAINER_DAILY_DECISIONS');
 assert.equal(decisions.length,6);
 assert.equal(decisions.reduce((n,x)=>n+x.details.count,0),38);
 assert.equal(one.event_log.filter(x=>x.kind==='HORSE_CARE_DAY').length,38);
 for(const [id,r] of Object.entries(one.runtime.horse)){
  assert.equal(r.agent.date,one.clock.date,id);
  assert.equal(r.history.at(-1).date,one.clock.date);
  assert.equal(r.history.at(-1).agent_reason,r.agent.reason);
  assert.equal(r.history.at(-1).work,r.agent.workout,id);
 }
 assert.deepEqual(importGameSave(exportGameSave(one,world),world),one);
 const two=day(one);
 assert.equal(two.clock.date,'1999-01-03');
 assert.equal(two.runtime.agents.totals.trainer_days,12);
 assert.ok(Object.values(two.runtime.agents.relationships).every(x=>x.days===2));
 assert.deepEqual(importGameSave(exportGameSave(two,world),world),two);
});
test('owners autonomously change investment according to actual liquidity and horse needs, without fabricating cash',()=>{
 const baseline=create(),h=cohort.assignments.find(x=>x.owner_organization_id===otherOwner);
 const budgetBefore=baseline.runtime.horse[h.horse_id].policy.monthly_budget_minor;
 const poor=structuredClone(baseline),rich=structuredClone(baseline);
 poor.runtime.finances.operation_balances_minor[otherOwner]=380000;
 rich.runtime.finances.operation_balances_minor[otherOwner]=80000000;
 const a=day(poor),b=day(rich),pa=a.runtime.horse[h.horse_id].policy,pb=b.runtime.horse[h.horse_id].policy;
 assert.equal(pa.feed,'ECONOMY');
 assert.notEqual(pb.feed,'ECONOMY');
 assert.ok(pa.monthly_budget_minor<=pb.monthly_budget_minor);
 assert.ok(a.event_log.some(x=>x.kind==='OWNER_DAILY_STRATEGY'&&
  x.details.owner_id===otherOwner&&x.details.decisions.some(d=>
   d.reason==='OWNER_LIQUIDITY_PRESSURE'||d.reason==='HORSE_WELFARE_RECOVERY')));
 assert.equal(a.runtime.agents.owners[otherOwner].id,otherOwner);
 assert.ok(a.runtime.horse[h.horse_id].policy.monthly_budget_minor!==budgetBefore||
  a.runtime.horse[h.horse_id].policy.feed!=='STANDARD');
 const bill=a.runtime.finances.ledger.filter(x=>x.kind==='HORSE_CARE_OWNER_PAYMENT'&&
  x.operation_id===otherOwner);
 assert.ok(bill.every(x=>x.amount_minor<0));
 assert.ok(a.runtime.finances.operation_balances_minor[otherOwner]<=380000,
  'Owner cannot invent cash to fund preferred policy');
});
test('barn operator restores welfare-critical staffing when actual reserve can pay for it',()=>{
 let s=create();
 const site=Object.values(s.runtime.facilities.sites).find(x=>
  x.owner_id!==s.player.operation_id&&x.staff_required>1);
 assert.ok(site);
 s=run(s,'test:short-staff','FACILITY_SET_STAFFING',{
  site_id:site.id,operation_id:site.owner_id,staff_count:site.staff_required-1});
 assert.equal(s.runtime.facilities.sites[site.id].staff_count,site.staff_required-1);
 const next=day(s),restored=next.runtime.facilities.sites[site.id];
 assert.equal(restored.staff_count,site.staff_required);
 assert.equal(restored.status,'ACTIVE');
 assert.ok(next.runtime.agents.recent.some(x=>
  x.site_id===site.id&&x.reason==='STAFFING_RESTORED_FOR_HORSE_WELFARE'));
 assert.ok(next.event_log.some(x=>x.kind==='FACILITY_STAFFING_UPDATED'&&x.details.site_id===site.id));
});
test('autonomous trainer changes workload for stress but respects a player-directed plan',()=>{
 const base=create(),first=cohort.assignments[0],id=first.horse_id;
 const explicit=run(base,'owner:train-order','SET_HORSE_CARE_POLICY',{
  horse_id:id,policy:{
   feed:'STANDARD',care:'BASIC',training_plan:'SPEED',monthly_budget_minor:700000
  }},'player');
 const ordinary=day(explicit).runtime.horse[id];
 assert.equal(ordinary.agent.reason,'PLAYER_TRAINING_ORDER_RESPECTED');
 assert.equal(ordinary.agent.workout,null);
 const strained=structuredClone(explicit);
 strained.runtime.horse[id].training.fatigue=.80;
 strained.runtime.horse[id].training.currentRisk=.70;
 const safe=day(strained).runtime.horse[id];
 assert.equal(safe.agent.workout,'REST');
 assert.equal(safe.agent.reason,'WELFARE_RISK_LIMIT');
 assert.equal(safe.history.at(-1).work,'REST');
 assert.ok(safe.training.fatigue<.8);
});
test('unfunded owner decisions change trainer support, future horse condition, and relationship history',()=>{
 const base=create(),h=cohort.assignments[0],id=h.horse_id;
 const starved=run(base,'owner:budget-zero','SET_HORSE_CARE_POLICY',{
  horse_id:id,policy:{feed:'PREMIUM',care:'PROACTIVE',
   training_plan:'AUTO',monthly_budget_minor:0}},'player');
 const funded=run(base,'owner:budget-fund','SET_HORSE_CARE_POLICY',{
  horse_id:id,policy:{feed:'PREMIUM',care:'PROACTIVE',
   training_plan:'AUTO',monthly_budget_minor:800000}},'player');
 const a=day(starved),b=day(funded);
 const poor=getAgentRelationships(a,h.owner_organization_id,h.trainer_id);
 const good=getAgentRelationships(b,h.owner_organization_id,h.trainer_id);
 assert.ok(poor.trainer_support<good.trainer_support);
 assert.equal(a.runtime.horse[id].history.at(-1).unfunded,true);
 assert.equal(b.runtime.horse[id].history.at(-1).unfunded,false);
 assert.ok(getGameHorsePerformance(a,world,id).race_performance_index!==
  getGameHorsePerformance(b,world,id).race_performance_index);
 assert.ok(a.event_log.some(x=>x.kind==='OWNER_TRAINER_RELATIONSHIP_PRESSURE'&&
  x.details.owner_id===h.owner_organization_id&&x.details.trainer_id===h.trainer_id));
});
test('agents preserve explicit owner policy and all canonical source identities across repeated days',()=>{
 let state=create(),original=JSON.stringify(world),first=cohort.assignments[0].horse_id;
 for(let i=0;i<8;i++)state=day(state);
 assert.equal(state.clock.days_elapsed,8);
 assert.equal(state.runtime.agents.totals.trainer_days,48);
 assert.equal(state.runtime.agents.totals.barn_reviews,64);
 assert.equal(state.runtime.agents.totals.owner_reviews,80);
 assert.ok(state.runtime.agents.recent.length<=120);
 assert.equal(JSON.stringify(world),original);
 assert.equal(state.runtime.registered_horses.by_id[first].starting_attributes.current_ability,
  cohort.assignments[0].starting_attributes.current_ability);
 const received=new Set(state.runtime.finances.ledger.filter(x=>
  x.kind==='HORSE_CARE_SITE_AND_TRAINER_INCOME').map(x=>x.transaction_id));
 const outgoing=new Set(state.runtime.finances.ledger.filter(x=>
  x.kind==='HORSE_CARE_OWNER_PAYMENT').map(x=>x.transaction_id));
 assert.deepEqual(received,outgoing);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
});
