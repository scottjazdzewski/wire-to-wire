import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getOfficeView,getStableView,getOwnerPortfolioView,getCareerHorseConnections,
 getGameHorsePerformance,modeledTrainerSkills,modelHorsePostRaceResponse}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
const read=path=>JSON.parse(readFileSync(new URL(path,import.meta.url),'utf8'));
const source=read('../public/data/wtw-1999-founding-directory-v1.json');
const rosters=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const peopleIds=new Set(source.people.map(p=>p.id));
const world={schema:WORLD_SCHEMA,
 authority:{snapshot_id:'TEST-1999-CONNECTED-CARE',
  source:'ISOLATED_TEST_NOT_HISTORICAL',sha256:createHash('sha256').update('care/38/v1').digest('hex')},
 start_date:'1999-01-01',
 entities:{horses:source.horses,organizations:source.organizations,tracks:source.tracks,
  people:[...source.people,...rosters.trainers.filter(t=>!peopleIds.has(t.id))]}};
const fresh=()=>build1999PilotGameRun({world,manifest});
const change=(state,id,type,payload,actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,actor,payload}}).state;
const next=state=>change(state,'test:next:'+state.clock.date,'ADVANCE_DAY',{});
test('38 horses begin with different trainer skill, actual barn, care policy and stable owner views',()=>{
 const state=fresh(),registered=Object.values(state.runtime.registered_horses.by_id);
 assert.equal(registered.length,38);
 assert.equal(Object.keys(state.runtime.horse).length,38);
 assert.equal(new Set(registered.map(h=>h.trainer_id)).size,6);
 assert.equal(new Set(registered.map(h=>state.runtime.people[h.trainer_id].game_training_skills.roleAttributes.conditioning)).size,6);
 assert.equal(new Set(registered.map(h=>state.runtime.horse[h.horse_id].policy.feed)).size,3);
 assert.equal(new Set(registered.map(h=>state.runtime.horse[h.horse_id].policy.training_plan)).size,6);
 for(const h of registered){
  assert.deepEqual(state.runtime.people[h.trainer_id].game_training_skills,modeledTrainerSkills(h.trainer_id,manifest.seed));
  const r=state.runtime.horse[h.horse_id];
  assert.equal(r.training.trainerId,h.trainer_id);
  assert.equal(r.training.horseId,h.horse_id);
  assert.equal(r.last_day,'1999-01-01');
  assert.ok(Number.isSafeInteger(state.runtime.finances.operation_balances_minor[h.owner_organization_id]));
  assert.ok(state.runtime.facilities.sites[h.current_residence_id]);
 }
 const owner=registered[0].owner_organization_id;
 const expected=registered.filter(h=>h.owner_organization_id===owner).length;
 assert.equal(getOwnerPortfolioView(state,world,owner,{limit:0}).total,expected);
 assert.equal(getCareerHorseConnections(state,world,{kind:'owner',id:owner}).total,expected);
 assert.equal(getOfficeView(state,world).player_owner_horse_count,expected);
 assert.equal(getStableView(state,world).length,expected);
});
test('one clock day changes all 38 conditions and books actual owner expense and operator income only once',()=>{
 const state=fresh(),after=next(state);
 assert.equal(after.clock.date,'1999-01-02');
 const fees=after.runtime.finances.ledger.filter(l=>l.kind==='HORSE_CARE_OWNER_PAYMENT');
 const incomes=after.runtime.finances.ledger.filter(l=>l.kind==='HORSE_CARE_SITE_AND_TRAINER_INCOME');
 assert.equal(fees.length,38);assert.equal(incomes.length,38);
 assert.equal(new Set(fees.map(l=>l.transaction_id)).size,38);
 assert.deepEqual(new Set(fees.map(l=>l.transaction_id)),new Set(incomes.map(l=>l.transaction_id)));
 for(const f of fees){
  assert.ok(f.amount_minor<0);
  const receipt=incomes.find(x=>x.transaction_id===f.transaction_id);
  assert.ok(receipt&&receipt.amount_minor>0&&receipt.amount_minor<=-f.amount_minor);
  assert.equal(f.site_id,receipt.site_id);
  assert.ok(f.trainer_id&&f.owner_id===undefined);
  assert.ok(after.runtime.horse[f.horse_id].training.asOf==='1999-01-02');
 }
 const id=Object.keys(after.runtime.horse)[0];
 assert.notDeepEqual(after.runtime.horse[id].training,state.runtime.horse[id].training);
 assert.ok(getGameHorsePerformance(after,world,id).race_performance_index>0);
 assert.deepEqual(importGameSave(exportGameSave(after,world),world),after);
 const repeat=dispatchGameCommand({state:after,world,command:{
  id:'test:next:1999-01-01',type:'ADVANCE_DAY',actor:'system',payload:{}}});
 assert.equal(repeat.duplicate,true);assert.equal(repeat.state,after);
});
test('feed, veterinary care, trainer aptitude and barn condition materially alter training outcomes',()=>{
 const base=fresh(),id=manifest.assignments[0].horse_id,h=base.runtime.registered_horses.by_id[id];
 const policy=(feed,care)=>({feed,care,training_plan:'STAMINA',monthly_budget_minor:900000});
 let premium=change(base,'test:premium','SET_HORSE_CARE_POLICY',{horse_id:id,policy:policy('PREMIUM','PROACTIVE')});
 let economy=change(base,'test:economy','SET_HORSE_CARE_POLICY',{horse_id:id,policy:policy('ECONOMY','BASIC')});
 const good=next(premium),poor=next(economy);
 const better=good.runtime.horse[id].training,worse=poor.runtime.horse[id].training;
 assert.ok(better.fitness>worse.fitness || better.readiness>worse.readiness,'Care must alter horse condition');
 const feeHigh=good.runtime.finances.ledger.find(x=>x.kind==='HORSE_CARE_OWNER_PAYMENT'&&x.horse_id===id);
 const feeLow=poor.runtime.finances.ledger.find(x=>x.kind==='HORSE_CARE_OWNER_PAYMENT'&&x.horse_id===id);
 assert.ok(feeHigh.amount_minor<feeLow.amount_minor,'Better care must cost more');
 let withLowTrainer=structuredClone(premium);
 const t=withLowTrainer.runtime.people[h.trainer_id].game_training_skills;
 for(const name of Object.keys(t.roleAttributes))t.roleAttributes[name]=.15;
 t.ability.current=15;
 const tOutcome=next(withLowTrainer).runtime.horse[id].training;
 assert.ok(better.fitness!==tOutcome.fitness||better.stress!==tOutcome.stress||better.currentRisk!==tOutcome.currentRisk,
  'Trainer competence must affect conditioning');
 const site=base.runtime.facilities.sites[h.current_residence_id];
 let badBarn=structuredClone(premium);
 badBarn.runtime.facilities.sites[site.id].quality=25;
 const barnResult=next(badBarn).runtime.horse[id].training;
 assert.ok(better.fitness!==barnResult.fitness||better.readiness!==barnResult.readiness,'Facility quality must matter');
});
test('owner cash and chosen monthly ceiling are hard gates; unfunded horses suffer a modeled condition cost',()=>{
 let baseline=fresh(),id=manifest.assignments[0].horse_id;
 const lowBudget={feed:'PREMIUM',care:'PROACTIVE',training_plan:'SPEED',monthly_budget_minor:0};
 baseline=change(baseline,'test:zero-budget','SET_HORSE_CARE_POLICY',{horse_id:id,policy:lowBudget});
 const owner=baseline.runtime.registered_horses.by_id[id].owner_organization_id;
 const before=baseline.runtime.finances.operation_balances_minor[owner];
 const after=next(baseline),record=after.runtime.horse[id];
 assert.equal(record.finance.unfunded_days,1);
 assert.equal(record.finance.lifetime_minor,0);
 assert.equal(record.history.at(-1).unfunded,true);
 assert.ok(after.event_log.some(x=>x.kind==='HORSE_CARE_UNFUNDED'&&x.details.horse_id===id));
 assert.ok(!after.runtime.finances.ledger.some(x=>x.kind==='HORSE_CARE_OWNER_PAYMENT'&&x.horse_id===id));
 assert.equal(after.runtime.finances.operation_balances_minor[owner] <=before,true,
  'Other horses of the same owner may still incur charges, but unfunded horse must not bill');
 assert.equal(getGameHorsePerformance(after,world,id).eligible_on_condition,false);
 const unauthorized=manifest.assignments.find(h=>h.owner_organization_id!==baseline.player.operation_id);
 const wrong=()=>change(baseline,'test:wrong-owner','SET_HORSE_CARE_POLICY',
  {horse_id:unauthorized.horse_id,policy:lowBudget},'player');
 assert.throws(wrong,e=>e.code==='HORSE_CARE_PERMISSION');
});
test('post-race response uses an actual recorded finish input and preserves starting talent and the original save',()=>{
 const before=fresh(),id=manifest.assignments[0].horse_id,h=before.runtime.registered_horses.by_id[id];
 const r=before.runtime.horse[id];
 const projection=modelHorsePostRaceResponse(r,h,{race_id:'RACE-1999-01-TEST',finish:1,
  field_size:10,distance_furlongs:8,travel_miles:250},19990101);
 assert.ok(projection.training.fatigue>r.training.fatigue);
 assert.ok(projection.training.readiness<r.training.readiness);
 assert.ok(projection.training.confidence>=r.training.confidence);
 assert.equal(projection.training.asOf,r.training.asOf);
 assert.equal(before.runtime.horse[id],r);
 assert.equal(h.starting_attributes.current_ability,manifest.assignments[0].starting_attributes.current_ability);
 assert.throws(()=>modelHorsePostRaceResponse(r,h,{race_id:'RACE-X',finish:12,field_size:10,distance_furlongs:8}),
  e=>e.code==='HORSE_RACE_RESPONSE');
});


test('multi-month careers retain recent daily detail and exact monthly care totals',()=>{
 const dailyDetailKinds=new Set([
  'OWNER_DAILY_STRATEGY','TRAINER_DAILY_DECISIONS',
  'OWNER_TRAINER_RELATIONSHIP_PRESSURE','HORSE_NEEDS_ATTRIBUTES',
  'HORSE_TRANSIT_CARE_DAY','HORSE_CARE_UNFUNDED','HORSE_CARE_DAY'
 ]);
 const careFinanceKinds=new Set([
  'HORSE_CARE_OWNER_PAYMENT','HORSE_CARE_SITE_AND_TRAINER_INCOME',
  'HORSE_CARE_TRAINER_REMITTANCE','HORSE_CARE_TRAINER_EARNINGS',
  'HORSE_CARE_SUPPLIER_RECEIPT'
 ]);
 let state=fresh();
 const expected=Object.fromEntries([...careFinanceKinds].map(kind=>
  [kind,{count:0,amount:0}]));
 let firstDetail=null;
 for(let day=1;day<=120;day++){
  state=change(state,'test:journal:day-'+day,'ADVANCE_DAY',{});
  if(day===1)firstDetail=state.event_log.find(event=>dailyDetailKinds.has(event.kind));
  for(const row of state.runtime.finances.ledger)
   if(careFinanceKinds.has(row.kind)&&row.date===state.clock.date){
    expected[row.kind].count+=row.transaction_count??1;
    expected[row.kind].amount+=row.amount_minor;
   }
 }
 assert.ok(firstDetail,'First simulated day should emit a compact daily detail sample');
 const oldestRetained=new Date(Date.parse(state.clock.date+'T00:00:00Z')-
  89*86400000).toISOString().slice(0,10);
 const oldDailyDetails=state.event_log.filter(event=>
  dailyDetailKinds.has(event.kind)&&event.date<oldestRetained);
 assert.equal(oldDailyDetails.length,0,'Old sampled daily detail must be pruned');
 assert.ok(!state.event_log.some(event=>event.seq===firstDetail.seq),
  'The first day sample should not remain after the 90-day detail window');
 const summaries=state.event_log.filter(event=>event.kind==='DAILY_SIMULATION_SUMMARY');
 assert.equal(summaries.length,120,'Exact per-day summaries remain for the full career history');
 assert.equal(new Set(summaries.map(event=>event.details.date)).size,120);
 assert.ok(summaries.every(event=>event.details.date===event.date&&
  Object.keys(event.details.counts).length>0));
 const ledger=state.runtime.finances.ledger;
 const monthly=ledger.filter(row=>row.rollup_schema==='WTW_MONTHLY_FINANCE_ROLLUP_V1');
 assert.ok(monthly.length>0,'Older care transactions must compact into monthly totals');
 assert.ok(monthly.every(row=>/^\d{4}-\d{2}$/.test(row.rollup_period)&&
  row.period_start===row.rollup_period+'-01'&&row.date===row.period_end));
 const dailyCutoff=new Date(Date.parse(state.clock.date+'T00:00:00Z')-
  29*86400000).toISOString().slice(0,10);
 assert.ok(ledger.filter(row=>row.rollup_schema==='WTW_DAILY_FINANCE_ROLLUP_V1')
  .every(row=>row.date>=dailyCutoff),'Daily finance rollups must stay within 30 days');
 for(const kind of careFinanceKinds){
  const rows=ledger.filter(row=>row.kind===kind);
  assert.equal(rows.reduce((n,row)=>n+(row.transaction_count??1),0),
   expected[kind].count,kind+' transaction count must survive monthly compaction');
  assert.equal(rows.reduce((n,row)=>n+row.amount_minor,0),
   expected[kind].amount,kind+' amount must survive monthly compaction');
 }
 assert.ok(JSON.stringify(state).length<16_000_000,
  'A 120-day game run should stay bounded and saveable');
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
});
