import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 ownerTrainerEvidence,selectOwnerTrainerMandate,getOwnerTrainerMandate,
 getOwnerTrainerCareerReview,getTrainerCareerForm,getTrainerContract}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';
const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=load('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=load('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=load('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'MODELED_1999_OWNER_TRAINER_CAREER_QA',
  source:'ISOLATED_CAREER_TEST_NOT_HISTORICAL_PROFESSIONAL_EVALUATION',
  sha256:createHash('sha256').update('owner-trainer-rolling-career-1999').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  people,tracks:directory.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const day=state=>command(state,'careerreview:day:'+state.clock.date,'ADVANCE_DAY');
const through=(target,start=fresh())=>{
 let state=start;while(state.clock.date<target)state=day(state);return state;
};
const all=state=>Object.values(state.runtime.registered_horses.by_id);
const pairOf=h=>h.owner_organization_id+'|'+h.trainer_id;
const aiHorse=state=>all(state).find(h=>
 h.owner_organization_id!==state.player.operation_id);
const ownHorse=state=>all(state).find(h=>
 h.owner_organization_id===state.player.operation_id);
test('28-day owner/trainer career reviews use only official race results, paid care and actual finances',()=>{
 const start=fresh(),snapshot=JSON.stringify(world);
 const first=day(start),h=aiHorse(first);
 const initial=getOwnerTrainerCareerReview(first,world,h.owner_organization_id,h.trainer_id);
 assert.equal(initial.mandate,'NORMAL');
 assert.equal(initial.last_review_date,null);
 assert.ok(initial.next_review_date>=first.clock.date);
 const before=structuredClone(first);
 const preview=ownerTrainerEvidence(first,world,h.owner_organization_id,h.trainer_id);
 assert.equal(preview.starts,0);
 assert.equal(preview.care_expense_minor,
  -first.runtime.finances.ledger.filter(row=>
   row.date==='1999-01-02'&&row.operation_id===h.owner_organization_id&&
   row.kind==='HORSE_CARE_OWNER_PAYMENT'&&
   all(first).some(x=>x.horse_id===row.horse_id&&x.trainer_id===h.trainer_id)).
  reduce((n,row)=>n+row.amount_minor,0),
  'Owner evaluation includes care actually paid on the first training day');
 assert.equal(preview.provenance,'ACTUAL_SAVED_GAME_RESULTS_AND_FINANCE_NOT_HISTORICAL_ASSESSMENT');
 assert.deepEqual(first,before,'Career evaluation preview must not change the save');
 const completed=through('1999-01-31',first);
 const reviews=completed.runtime.owner_trainer_reviews;
 assert.ok(reviews.totals.scheduled_reviews>0);
 assert.ok(completed.event_log.some(e=>e.kind==='OWNER_TRAINER_CAREER_REVIEW'));
 const entries=Object.values(reviews.by_pair);
 assert.ok(entries.every(e=>e.review_count===1&&e.history.length===1));
 assert.ok(entries.every(e=>e.last_review_date==='1999-01-30'));
 const official=Object.values(completed.runtime.races).
  filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&r.date<='1999-01-30');
 // Owner reviews occur before the Jan 30 racing-agent settlement. Results
 // from later the SAME DAY cannot retroactively appear in that review.
 // Post-settlement trainer career form may correctly include Jan 30 races.
 const reviewOfficial=official.filter(r=>r.date<'1999-01-30');
 assert.ok(official.length>=3);
 for(const [id,item] of Object.entries(reviews.by_pair)){
  assert.equal(pairOf({owner_organization_id:item.owner_id,trainer_id:item.trainer_id}),id);
  const expected=reviewOfficial.reduce((n,r)=>n+r.results.filter(x=>
   x.owner_id===item.owner_id&&x.trainer_id===item.trainer_id).length,0);
  assert.equal(item.evidence.starts,expected);
  assert.equal(item.evidence.wins,reviewOfficial.reduce((n,r)=>n+r.results.filter(x=>
   x.owner_id===item.owner_id&&x.trainer_id===item.trainer_id&&x.finish===1).length,0));
  assert.equal(item.evidence.care_expense_minor,
   -completed.runtime.finances.ledger.filter(row=>row.kind==='HORSE_CARE_OWNER_PAYMENT'&&
    row.operation_id===item.owner_id&&row.date<'1999-01-30'&&
    (all(completed).some(x=>x.horse_id===row.horse_id&&x.trainer_id===item.trainer_id)||
     ['WTW_DAILY_FINANCE_ROLLUP_V1','WTW_MONTHLY_FINANCE_ROLLUP_V1'].
      includes(row.rollup_schema)&&row.trainer_id===item.trainer_id)).
    reduce((n,row)=>n+row.amount_minor,0),
   'The Jan 30 review occurs before Jan 30 care settlement, so it must not include future same-day invoices');
  assert.equal(item.history[0].starts,item.evidence.starts);
  if(item.owner_id===completed.player.operation_id)
   assert.equal(item.history[0].reason,'PLAYER_OWNER_RETAINS_DIRECTION',
    'The player owns this manager decision even with limited race evidence');
  else if(item.evidence.decision_sample_basis==='INSUFFICIENT')
   assert.equal(item.history[0].reason,'WAIT_FOR_SUSTAINED_RACE_SAMPLE');
  else if(expected<3)
   assert.ok(item.evidence.trainer_multi_client_starts>=5,
    'Small owner sample may be supplemented only by five actual multi-client trainer starts');
 }
 assert.ok(entries.some(x=>x.evidence.decision_sample_basis==='TRAINER_MULTI_CLIENT_FORM'),
  'Single-horse owners must be able to evaluate a trainer using enough real results across clients');
 assert.ok(reviews.totals.ai_mandate_changes>=1,
  'The 45 actual modeled starters must produce at least one evidence-driven AI owner action');
 const trainersSeen=[...new Set(all(completed).map(h=>h.trainer_id))];
 for(const t of trainersSeen){
  const career=getTrainerCareerForm(completed,t);
  assert.ok(career&&career.as_of==='1999-01-30');
  assert.equal(career.starts,reviewOfficial.reduce((n,r)=>n+r.results.filter(x=>
   x.trainer_id===t).length,0),
   'Career form is a Jan30 review-time snapshot, not a backdated Jan30 evening result');
  assert.equal(career.provenance,'MODELED_1999_GAME_RESULTS_NOT_HISTORICAL_PROFESSIONAL_RATING');
 }
 assert.equal(JSON.stringify(world),snapshot,'No change to historical source identities');
 assert.deepEqual(importGameSave(exportGameSave(completed,world),world),completed);
 let replay=fresh();for(let i=0;i<30;i++)replay=day(replay);
 assert.deepEqual(replay,completed,'Two equal seeds and races must yield identical long-term career reviews');
 console.info('WTW_1999_OWNER_TRAINER_CAREER_QA',JSON.stringify({
  date:completed.clock.date,approved_person_ids:trainersSeen.length,
  review_pairs:entries.length,actual_races:official.length,
  starts:official.reduce((n,r)=>n+r.results.length,0),
  owner_changes:reviews.totals.ai_mandate_changes,
  trainer_form_by_id:trainersSeen.map(id=>({
   id,starts:getTrainerCareerForm(completed,id).starts,
   form:getTrainerCareerForm(completed,id).average_relative_form})),
  decisions:entries.filter(x=>x.mandate!=='NORMAL').map(x=>({
   owner:x.owner_id,trainer:x.trainer_id,mandate:x.mandate,
   sample:x.evidence.decision_sample_basis,
   reviewed_form:x.evidence.decision_form}))}));
});
test('long-term judgments require real samples and distinguish owner-financing pressure from trainer ability',()=>{
 const example={starts:5,average_relative_form:-.28,owner_trust:.4,
  unfunded_horse_days:0};
 assert.deepEqual(selectOwnerTrainerMandate({...example,starts:1},'NORMAL',50000000),
  {mandate:'NORMAL',reason:'WAIT_FOR_SUSTAINED_RACE_SAMPLE'});
 assert.deepEqual(selectOwnerTrainerMandate({...example,unfunded_horse_days:3},'NORMAL',50000000),
  {mandate:'NORMAL',reason:'OWNER_FINANCING_PRESSURE_NOT_TRAINER_FAULT'});
 assert.equal(selectOwnerTrainerMandate(example,'NORMAL',50000000).mandate,'WATCH');
 assert.equal(selectOwnerTrainerMandate(example,'WATCH',50000000).mandate,'IMPROVEMENT_PLAN');
 assert.equal(selectOwnerTrainerMandate({...example,average_relative_form:.23,owner_trust:.7},
  'WATCH',50000000).mandate,'SUPPORT');
 assert.equal(selectOwnerTrainerMandate({...example,owner_trust:.58,average_relative_form:-.06},
  'SUPPORT',50000000).mandate,'NORMAL');
});
test('player can direct their own trainer relationship but AI cannot alter player-managed direction or wage',()=>{
 let s=fresh();const h=ownHorse(s),other=aiHorse(s);
 const payload={owner_id:h.owner_organization_id,trainer_id:h.trainer_id,mandate:'SUPPORT'};
 const base=structuredClone(s);
 assert.throws(()=>command(s,'careerreview:system-player','SET_OWNER_TRAINER_MANDATE',
  payload,'system'),e=>e.code==='TRAINER_MANDATE_PERMISSION');
 assert.throws(()=>command(s,'careerreview:wrong-owner','SET_OWNER_TRAINER_MANDATE',{
  owner_id:other.owner_organization_id,trainer_id:other.trainer_id,mandate:'WATCH'
 },'player'),e=>e.code==='TRAINER_MANDATE_PERMISSION');
 assert.throws(()=>command(s,'careerreview:invalid','SET_OWNER_TRAINER_MANDATE',{
  ...payload,mandate:'FIRE_TRAINER'
 },'player'),e=>e.code==='TRAINER_MANDATE');
 assert.deepEqual(s,base,'Rejected demands cannot modify game cash, horses or trust');
 s=command(s,'careerreview:player-support','SET_OWNER_TRAINER_MANDATE',payload,'player');
 assert.equal(getOwnerTrainerMandate(s,payload.owner_id,payload.trainer_id),'SUPPORT');
 const beforeFee=getTrainerContract(s,world,payload.owner_id,payload.trainer_id).
  current_daily_fee_minor;
 const duplicate=dispatchGameCommand({state:s,world,command:{
  id:'careerreview:player-support',type:'SET_OWNER_TRAINER_MANDATE',payload,actor:'player'}});
 assert.equal(duplicate.duplicate,true);
 const advanced=through('1999-02-03',s);
 assert.equal(getOwnerTrainerMandate(advanced,payload.owner_id,payload.trainer_id),'SUPPORT');
 assert.equal(getTrainerContract(advanced,world,payload.owner_id,payload.trainer_id).
  current_daily_fee_minor,beforeFee);
 assert.ok(advanced.event_log.some(e=>e.kind==='OWNER_TRAINER_CAREER_REVIEW'&&
  e.details.owner_id===payload.owner_id&&
  e.details.reason==='PLAYER_OWNER_RETAINS_DIRECTION'));
 assert.deepEqual(importGameSave(exportGameSave(advanced,world),world),advanced);
});
test('backed trainers earn real funded premium horse care; improvement plans support welfare not unfunded spending',()=>{
 const base=day(fresh());
 const h=all(base).find(x=>x.owner_organization_id!==base.player.operation_id&&
  x.starting_attributes.potential_ability<73);
 assert.ok(h);
 const owner=h.owner_organization_id,k=pairOf(h);
 const template=structuredClone(base);
 template.runtime.agents.owners[owner].investment_appetite=.2;
 template.runtime.agents.owners[owner].welfare_priority=.45;
 template.runtime.agents.relationships[k].owner_trust=.75;
 template.runtime.finances.operation_balances_minor[owner]=90000000;
 const care=template.runtime.horse[h.horse_id];
 care.policy={...care.policy,feed:'STANDARD',care:'BASIC',source:'AI_GAMEPLAY_DECISION'};
 care.finance.unfunded_days=1; // Force today's independent owner review in this controlled game fixture.
 const normal=structuredClone(template),back=structuredClone(template),improve=structuredClone(template);
 back.runtime.owner_trainer_reviews.by_pair[k].mandate='SUPPORT';
 improve.runtime.owner_trainer_reviews.by_pair[k].mandate='IMPROVEMENT_PLAN';
 const a=day(normal),b=day(back),c=day(improve);
 assert.equal(a.runtime.horse[h.horse_id].policy.feed,'STANDARD');
 assert.equal(b.runtime.horse[h.horse_id].policy.feed,'PREMIUM');
 assert.equal(c.runtime.horse[h.horse_id].policy.care,'PROACTIVE');
 assert.ok(b.runtime.horse[h.horse_id].policy.monthly_budget_minor>
  a.runtime.horse[h.horse_id].policy.monthly_budget_minor);
 const spent=state=>state.runtime.finances.ledger.filter(e=>
  e.date==='1999-01-03'&&e.horse_id===h.horse_id&&
  e.kind==='HORSE_CARE_OWNER_PAYMENT').reduce((n,e)=>n-e.amount_minor,0);
 assert.ok(spent(b)>spent(a));
 assert.ok(spent(c)>spent(a));
 for(const s of [a,b,c])assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('an evidence-backed improvement plan changes REAL AI wage renewal without modifying a signed player contract',()=>{
 const initial=day(fresh());
 const h=aiHorse(initial),owner=h.owner_organization_id,trainer=h.trainer_id,k=pairOf(h);
 const s=structuredClone(initial);
 const review=s.runtime.owner_trainer_reviews.by_pair[k];
 assert.ok(review);
 review.mandate='IMPROVEMENT_PLAN';review.authority='AI_OWNER_CAREER_REVIEW';
 review.next_review_date='1999-02-20'; // Keep current 28-day evidence available during next contract review.
 review.evidence={...ownerTrainerEvidence(s,world,owner,trainer),
  starts:5,average_relative_form:-.30,
  decision_sample_starts:5,decision_form:-.30,decision_sample_basis:'OWNER_RESULTS'};
 s.runtime.finances.operation_balances_minor[owner]=90000000;
 s.runtime.people[trainer].game_race_record={starts:5,wins:0,managed_purse_minor:0,
  professional_standing:.5};
 const agreement=s.runtime.trainer_contracts.by_pair[k];
 assert.ok(agreement);
 agreement.daily_fee_minor=3000;agreement.review_on='1999-01-03';agreement.pending=null;
 const ordinary=structuredClone(s);
 ordinary.runtime.owner_trainer_reviews.by_pair[k].mandate='NORMAL';
 const pressure=day(s),reward=day(ordinary);
 const under=pressure.runtime.trainer_contracts.by_pair[k],
  unblocked=reward.runtime.trainer_contracts.by_pair[k];
 assert.equal(under.pending,null);
 assert.equal(under.last_review_reason,'OWNER_IMPROVEMENT_PLAN_DEFERS_OPTIONAL_RAISE');
 assert.ok(unblocked.pending?.daily_fee_minor>3000);
 assert.ok(pressure.event_log.some(e=>e.kind==='TRAINER_SERVICE_REVIEWED'&&
  e.details.owner_id===owner&&
  e.details.reason==='OWNER_IMPROVEMENT_PLAN_DEFERS_OPTIONAL_RAISE'));
 assert.ok(reward.event_log.some(e=>e.kind==='AI_TRAINER_SERVICE_RENEGOTIATED'&&
  e.details.owner_id===owner));
 const laterPressure=day(pressure),laterReward=day(reward);
 assert.equal(laterPressure.runtime.trainer_contracts.by_pair[k].daily_fee_minor,3000);
 assert.ok(laterReward.runtime.trainer_contracts.by_pair[k].daily_fee_minor>3000);
 assert.deepEqual(importGameSave(exportGameSave(laterPressure,world),world),laterPressure);
 assert.deepEqual(importGameSave(exportGameSave(laterReward,world),world),laterReward);
});
test('browser exposes the exact game career-form and owner strategy without reading or writing a shadow store',async()=>{
 const service=await createPlaytestCareer({directory,trainers,jockeys,cohort});
 service.advanceTo('1999-01-31');
 const h=service.view().stable.find(x=>x.owner_id===service.state.player.operation_id);
 assert.ok(h);
 const before=service.getSave();
 const review=service.getOwnerTrainerReview(h.owner_id,h.trainer_id);
 const form=service.getTrainerCareerForm(h.trainer_id);
 assert.ok(review.last_review_date&&form.as_of);
 assert.deepEqual(review,getOwnerTrainerCareerReview(service.state,service.world,h.owner_id,h.trainer_id));
 assert.deepEqual(form,getTrainerCareerForm(service.state,h.trainer_id));
 assert.equal(service.getSave(),before);
 const loaded=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:before});
 assert.deepEqual(loaded.getOwnerTrainerReview(h.owner_id,h.trainer_id),review);
 assert.deepEqual(loaded.getTrainerCareerForm(h.trainer_id),form);
});
