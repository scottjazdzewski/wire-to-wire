import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 trainerContractQuote,getTrainerContract,baselineTrainerDailyFee}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainers.trainers,...jockeys.jockeys].map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'MODELED_TRAINER_CONTRACT_CARE_1999',
  source:'ISOLATED_GAME_CONTRACT_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('1999-trainer-contract-test-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,tracks:directory.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,payload,actor}}).state;
const advance=s=>command(s,'contract:test:day:'+s.clock.date,'ADVANCE_DAY');
const ownPair=s=>{
 const h=Object.values(s.runtime.registered_horses.by_id).find(h=>
  h.owner_organization_id===s.player.operation_id);
 assert.ok(h);
 return {owner:h.owner_organization_id,trainer:h.trainer_id,horse:h,
  count:Object.values(s.runtime.registered_horses.by_id).
   filter(x=>x.owner_organization_id===h.owner_organization_id&&
    x.trainer_id===h.trainer_id).length};
};
const care= (state,h)=>state.runtime.finances.ledger.filter(row=>
 row.horse_id===h.horse_id&&row.kind==='HORSE_CARE_OWNER_PAYMENT');
test('opening quotes are deterministic, bounded, read-only, and based on an actual approved trainer and horse',()=>{
 const s=fresh(),pair=ownPair(s),before=structuredClone(s);
 const q=trainerContractQuote(s,world,pair.owner,pair.trainer);
 assert.equal(q.horse_count,pair.count);
 assert.equal(q.modelled_fee_minor,undefined);
 const skills=s.runtime.people[pair.trainer].game_training_skills;
 assert.equal(q.modeled_base_fee_minor,baselineTrainerDailyFee(skills));
 assert.ok(q.minimum_acceptable_minor>0&&q.trainer_capacity>=5);
 assert.equal(q.current_daily_fee_minor,q.modeled_base_fee_minor);
 assert.equal(getTrainerContract(s,world,pair.owner,pair.trainer).agreement,null);
 assert.deepEqual(s,before,'Requesting a quote must not create or modify game state');
 assert.throws(()=>getTrainerContract(s,world,pair.owner,'P-UNKNOWN'),
  error=>error.code==='TRAINER_CONTRACT');
});
test('player lowball offer is declined, does not cut trainer pay and is recorded in the journal',()=>{
 let s=fresh(),p=ownPair(s),q=trainerContractQuote(s,world,p.owner,p.trainer);
 assert.ok(q.minimum_acceptable_minor>3000);
 s=command(s,'contract:test:lowball','OFFER_TRAINER_SERVICE_TERMS',{
  owner_id:p.owner,trainer_id:p.trainer,daily_fee_minor:3000},'player');
 const contract=getTrainerContract(s,world,p.owner,p.trainer).agreement;
 assert.equal(contract.daily_fee_minor,q.modeled_base_fee_minor);
 assert.equal(contract.pending,null);
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_SERVICE_OFFER_DECLINED'&&
  e.details.trainer_id===p.trainer&&e.details.minimum_acceptable_minor===q.minimum_acceptable_minor));
 s=advance(s);
 const posted=care(s,p.horse).at(-1);
 assert.equal(posted.trainer_fee_minor,q.modeled_base_fee_minor);
 assert.equal(s.runtime.racing.trainer_finances_minor[p.trainer]>0,true);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('signed player terms become actual next-day owner care cost, with zero-sum settlement and duplicate protection',()=>{
 const base=fresh(),p=ownPair(base),q=trainerContractQuote(base,world,p.owner,p.trainer);
 const proposed=q.modeled_base_fee_minor+2000;
 const payload={owner_id:p.owner,trainer_id:p.trainer,daily_fee_minor:proposed};
 const first=dispatchGameCommand({state:base,world,command:{
  id:'contract:test:raise',type:'OFFER_TRAINER_SERVICE_TERMS',payload,actor:'player'}});
 assert.equal(first.duplicate,false);
 let signed=first.state;
 const agreement=getTrainerContract(signed,world,p.owner,p.trainer).agreement;
 assert.equal(agreement.pending.daily_fee_minor,proposed);
 assert.equal(agreement.daily_fee_minor,q.modeled_base_fee_minor);
 const duplicate=dispatchGameCommand({state:signed,world,command:{
  id:'contract:test:raise',type:'OFFER_TRAINER_SERVICE_TERMS',payload,actor:'player'}});
 assert.equal(duplicate.duplicate,true);
 assert.deepEqual(duplicate.state,signed);
 const normal=advance(base),negotiated=advance(signed);
 const a=care(normal,p.horse).at(-1),b=care(negotiated,p.horse).at(-1);
 assert.equal(b.trainer_fee_minor,proposed);
 assert.equal(b.trainer_fee_minor-a.trainer_fee_minor,2000);
 const affected=Object.values(negotiated.runtime.registered_horses.by_id).
  filter(h=>h.owner_organization_id===p.owner&&h.trainer_id===p.trainer);
 assert.equal(negotiated.runtime.racing.trainer_finances_minor[p.trainer]-
  normal.runtime.racing.trainer_finances_minor[p.trainer],2000*affected.length);
 const ids=affected.map(h=>'CARE:1999-01-02:'+h.horse_id);
 for(const id of ids){
  const entries=negotiated.runtime.finances.ledger.filter(row=>row.transaction_id===id);
  assert.equal(entries.reduce((n,row)=>n+row.amount_minor,0),0);
  assert.ok(entries.some(x=>x.kind==='HORSE_CARE_TRAINER_EARNINGS'&&
   x.amount_minor===proposed&&x.person_id===p.trainer));
 }
 assert.equal(getTrainerContract(negotiated,world,p.owner,p.trainer).agreement.pending,null);
 assert.deepEqual(importGameSave(exportGameSave(negotiated,world),world),negotiated);
});
test('system and other owners cannot renegotiate player terms without player authorization',()=>{
 let s=fresh(),p=ownPair(s);
 assert.throws(()=>command(s,'contract:test:forbidden','OFFER_TRAINER_SERVICE_TERMS',{
  owner_id:manifest.assignments.find(x=>x.owner_organization_id!==p.owner).owner_organization_id,
  trainer_id:p.trainer,daily_fee_minor:9500},'player'),e=>
   e.code==='TRAINER_CONTRACT'||e.code==='TRAINER_PERMISSION');
 const first=trainerContractQuote(s,world,p.owner,p.trainer).current_daily_fee_minor;
 for(let n=0;n<32;n++)s=advance(s);
 const c=getTrainerContract(s,world,p.owner,p.trainer).agreement;
 assert.equal(c.daily_fee_minor,first);
 assert.equal(c.pending,null);
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_SERVICE_REVIEW_DUE'&&
  e.details.owner_id===p.owner&&e.details.trainer_id===p.trainer));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('AI service renewal responds to recorded reputation, trust and owner cash after scheduled review',()=>{
 let s=fresh();s=advance(s);
 const horse=Object.values(s.runtime.registered_horses.by_id).find(h=>
  h.owner_organization_id!==s.player.operation_id);
 const owner=horse.owner_organization_id,trainer=horse.trainer_id;
 const id=owner+'|'+trainer;
 const c=getTrainerContract(s,world,owner,trainer).agreement;
 const first=c.daily_fee_minor;
 s.runtime.agents.relationships[id].trainer_support=.05;
 const person=s.runtime.people[trainer];
 person.game_race_record={starts:20,wins:16,managed_purse_minor:3000000,
  professional_standing:1};
 const quote=trainerContractQuote(s,world,owner,trainer);
 assert.ok(quote.minimum_acceptable_minor>first);
 while(s.clock.date<'1999-01-29')s=advance(s);
 const reviewQuote=trainerContractQuote(s,world,owner,trainer);
 assert.ok(reviewQuote.minimum_acceptable_minor>first);
 s=advance(s); // January 30: agent reviews the actual January 29 trust/standing
 const offer=getTrainerContract(s,world,owner,trainer).agreement;
 assert.ok(offer.pending,'AI must negotiate an affordable raise in response to exceptional trainer standing');
 assert.equal(offer.pending.daily_fee_minor,reviewQuote.minimum_acceptable_minor);
 assert.equal(offer.daily_fee_minor,first,'Review cannot retroactively change today\'s fee');
 s=advance(s);
 const active=getTrainerContract(s,world,owner,trainer).agreement;
 assert.equal(active.daily_fee_minor,reviewQuote.minimum_acceptable_minor);
 assert.ok(s.event_log.some(e=>e.kind==='AI_TRAINER_SERVICE_RENEGOTIATED'&&
  e.details.owner_id===owner&&e.details.trainer_id===trainer));
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('fixed-baseline terms leave the original 15-day 38-horse game race cycle deterministic',()=>{
 let a=fresh(),b=fresh();
 for(let i=0;i<15;i++){a=advance(a);b=advance(b)}
 assert.deepEqual(a,b);
 assert.equal(a.clock.date,'1999-01-16');
 assert.equal(Object.values(a.runtime.races).filter(r=>r.status==='OFFICIAL_SIM_RESULT').length,3);
 assert.equal(Object.keys(a.runtime.trainer_contracts.by_pair).length>0,true);
 const totalCare=a.runtime.finances.ledger.filter(x=>x.kind==='HORSE_CARE_TRAINER_EARNINGS').
 reduce((n,x)=>n+x.amount_minor,0);
 assert.ok(totalCare>0);
 assert.deepEqual(importGameSave(exportGameSave(a,world),world),a);
});
