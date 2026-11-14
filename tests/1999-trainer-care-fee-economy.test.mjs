import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=read('../public/data/wtw-1999-founding-directory-v1.json');
const t=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const j=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...d.people,...t.trainers,...j.jockeys].map(x=>[x.id,x])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'TRAINER-FEE-CAUSAL-ACCOUNTING-1999',
  source:'TEST_GAME_ECONOMICS_NOT_HISTORICAL',
  sha256:createHash('sha256').update('trainer-fees/1999/v1').digest('hex')},
 entities:{horses:d.horses,organizations:d.organizations,tracks:d.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:j.jockeys});
const act=(state,id,type,payload,actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const day=state=>act(state,'fees:next:'+state.clock.date,'ADVANCE_DAY',{});
const byTransaction=state=>{
 const map=new Map();
 for(const row of state.runtime.finances.ledger){
  if(!String(row.transaction_id||'').startsWith('CARE:'))continue;
  if(!map.has(row.transaction_id))map.set(row.transaction_id,[]);
  map.get(row.transaction_id).push(row);
 }
 return map;
};
test('38 funded care transactions balance: owner pays once, barn keeps board, trainer earns fee, suppliers get the rest',()=>{
 const state=day(fresh()),groups=byTransaction(state);
 assert.equal(groups.size,38);
 let sumBilled=0,sumBoarded=0,sumTrainers=0,sumSuppliers=0;
 const earned={};
 for(const [tx,rows] of groups){
  const kinds=new Map(rows.map(r=>[r.kind,r]));
  const bill=kinds.get('HORSE_CARE_OWNER_PAYMENT');
  const site=kinds.get('HORSE_CARE_SITE_AND_TRAINER_INCOME');
  const remit=kinds.get('HORSE_CARE_TRAINER_REMITTANCE');
  const trainer=kinds.get('HORSE_CARE_TRAINER_EARNINGS');
  const supplier=kinds.get('HORSE_CARE_SUPPLIER_RECEIPT');
  assert.ok(bill&&site&&remit&&trainer,tx);
  assert.equal(rows.reduce((n,x)=>n+x.amount_minor,0),0,tx+' must balance by counterparty');
  assert.equal(site.amount_minor+remit.amount_minor,bill.board_minor);
  assert.equal(remit.amount_minor,-bill.trainer_fee_minor);
  assert.equal(trainer.amount_minor,bill.trainer_fee_minor);
  assert.equal(trainer.person_id,bill.trainer_id);
  assert.equal(trainer.transaction_id,bill.transaction_id);
  assert.equal(site.operation_id,remit.operation_id);
  assert.equal(site.site_id,remit.site_id);
  assert.equal((supplier?.amount_minor||0),-bill.amount_minor-site.amount_minor);
  assert.equal(trainer.operation_id,null);
  sumBilled-=bill.amount_minor;sumBoarded+=bill.board_minor;
  sumTrainers+=trainer.amount_minor;sumSuppliers+=supplier?.amount_minor||0;
  earned[trainer.person_id]=(earned[trainer.person_id]||0)+trainer.amount_minor;
 }
 assert.equal(sumBilled,sumBoarded+sumTrainers+sumSuppliers);
 assert.deepEqual(state.runtime.racing.trainer_finances_minor,earned);
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 console.info('WTW_TRAINER_CARE_FINANCE_QA',JSON.stringify({
  horse_days:groups.size,owner_cents:sumBilled,barn_cents:sumBoarded,
  trainer_cents:sumTrainers,external_cents:sumSuppliers}));
});
test('an unfunded player horse cannot create trainer pay or supplier revenue',()=>{
 const base=fresh(),h=cohort.assignments.find(x=>
  x.owner_organization_id===base.player.operation_id);
 assert.ok(h);
 const standard=day(base);
 let under=act(base,'fees:zero-policy','SET_HORSE_CARE_POLICY',{
  horse_id:h.horse_id,policy:{feed:'PREMIUM',care:'PROACTIVE',
   training_plan:'AUTO',monthly_budget_minor:0}},'player');
 under=day(under);
 assert.ok(under.runtime.horse[h.horse_id].finance.unfunded_days>=1);
 const original=standard.runtime.finances.ledger.find(x=>
  x.kind==='HORSE_CARE_TRAINER_EARNINGS'&&x.horse_id===h.horse_id);
 assert.ok(original&&original.amount_minor>0);
 assert.ok(!under.runtime.finances.ledger.some(x=>x.horse_id===h.horse_id&&
  ['HORSE_CARE_TRAINER_EARNINGS','HORSE_CARE_SUPPLIER_RECEIPT',
   'HORSE_CARE_TRAINER_REMITTANCE'].includes(x.kind)));
 const first=standard.runtime.racing.trainer_finances_minor[h.trainer_id];
 const second=under.runtime.racing.trainer_finances_minor[h.trainer_id];
 assert.equal(first-second,original.amount_minor);
});
test('replay across a 15-day racing career preserves distinct care earnings and race-purse trainer income',()=>{
 let state=fresh();for(let i=0;i<15;i++)state=day(state);
 const receipts=state.runtime.finances.ledger;
 const care=receipts.filter(x=>x.kind==='HORSE_CARE_TRAINER_EARNINGS');
 const purse=receipts.filter(x=>x.kind==='RACE_PURSE_TRAINER_CREDIT');
 assert.ok(care.length>38);
 assert.ok(purse.length>=2);
 const byTrainer={};
 for(const x of [...care,...purse])byTrainer[x.person_id]=(byTrainer[x.person_id]||0)+x.amount_minor;
 assert.deepEqual(state.runtime.racing.trainer_finances_minor,byTrainer);
 assert.equal([...byTransaction(state)].filter(([,rows])=>
  rows.reduce((n,r)=>n+r.amount_minor,0)!==0).length,0);
 const recovered=importGameSave(exportGameSave(state,world),world);
 assert.deepEqual(recovered,state);
 const dupe=dispatchGameCommand({state,world,command:{
  id:'fees:next:1999-01-15',type:'ADVANCE_DAY',payload:{},actor:'system'}});
 assert.equal(dupe.duplicate,true);
 assert.deepEqual(dupe.state,state);
});
