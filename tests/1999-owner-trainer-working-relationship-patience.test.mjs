import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 workingRelationshipProfile,ownerTrainerEvidence,selectOwnerTrainerMandate,
 assessTrainerRelationshipPosition,trainerContractQuote,getOwnerTrainerCareerReview}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const load=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=load('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=load('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=load('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=load('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...d.people,...trainers.trainers,...jockeys.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'1999-WORKING-RELATIONSHIP-TEMPERAMENT-QA',
  source:'ISOLATED_MODELED_PERSONALITIES_NOT_HISTORICAL',
  sha256:createHash('sha256').update('owner-trainer-patience-working-v1').digest('hex')},
 entities:{horses:d.horses,organizations:d.organizations,people,tracks:d.tracks}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys});
const command=(s,id,type,payload={},actor='system')=>dispatchGameCommand({state:s,world,
 command:{id,type,payload,actor}}).state;
const advance=s=>command(s,'relationship:day:'+s.clock.date,'ADVANCE_DAY');
const byPair=s=>{
 const h=Object.values(s.runtime.registered_horses.by_id).
  find(h=>h.owner_organization_id!==s.player.operation_id);
 assert.ok(h);return {owner:h.owner_organization_id,trainer:h.trainer_id,
  id:h.owner_organization_id+'|'+h.trainer_id};
};
test('owner/trainer patience is distinct, reproducible by identity and independent of record reads',()=>{
 let s=advance(fresh());const {owner,trainer}=byPair(s);
 const unchanged=structuredClone(s);
 const a=workingRelationshipProfile(s,owner,trainer);
 assert.deepEqual(workingRelationshipProfile(s,owner,trainer),a);
 assert.ok(a.owner_patience>=0&&a.owner_patience<=1);
 assert.ok(a.trainer_patience>=0&&a.trainer_patience<=1);
 assert.ok(a.working_relationship_strength>=0&&a.working_relationship_strength<=1);
 assert.equal(a.evidence,'MODELED_STABLE_TEMPERAMENT_AND_ACTUAL_GAME_RELATIONSHIP_ONLY');
 const q=ownerTrainerEvidence(s,world,owner,trainer);
 assert.equal(q.owner_patience,a.owner_patience);
 assert.equal(q.trainer_patience,a.trainer_patience);
 assert.equal(q.working_relationship_strength,a.working_relationship_strength);
 assert.deepEqual(s,unchanged,'Review preview must never act as a hidden game command');
 assert.equal(workingRelationshipProfile(importGameSave(exportGameSave(s,world),world),
  owner,trainer).owner_patience,a.owner_patience);
});
test('same lackluster sustained form: impatient owner with poor bond watches; patient owner gives runway',()=>{
 const baseline={starts:5,decision_sample_basis:'OWNER_RESULTS',
  decision_sample_starts:5,decision_form:-.13,average_relative_form:-.13,
  owner_trust:.50,trainer_support:.5,unfunded_horse_days:0};
 const impatient={...baseline,owner_patience:.20,working_relationship_strength:.22};
 const patient={...baseline,owner_patience:.90,working_relationship_strength:.82};
 const bad=selectOwnerTrainerMandate(impatient,'NORMAL',40000000);
 const good=selectOwnerTrainerMandate(patient,'NORMAL',40000000);
 assert.equal(bad.mandate,'WATCH');
 assert.equal(good.mandate,'NORMAL');
 assert.match(bad.reason,/IMPATIENT_OWNER/);
 // Neither personal friendship nor patience excuses a prolonged collapse.
 const collapse={...patient,decision_form:-.52,average_relative_form:-.52};
 assert.equal(selectOwnerTrainerMandate(collapse,'NORMAL',40000000).mandate,'WATCH');
 assert.equal(selectOwnerTrainerMandate(collapse,'WATCH',40000000).mandate,'IMPROVEMENT_PLAN');
 assert.equal(selectOwnerTrainerMandate({...impatient,unfunded_horse_days:5},
  'NORMAL',0).reason,'OWNER_FINANCING_PRESSURE_NOT_TRAINER_FAULT');
});
test('a trainer has independent patience and can seek a better partnership before the owner turns against them',()=>{
 const standard={trainer_support:.15,working_relationship_strength:.20,
  relationship_friction:.5,shared_working_days:84,unfunded_horse_days:0};
 const patient=assessTrainerRelationshipPosition({...standard,trainer_patience:.90});
 const impatient=assessTrainerRelationshipPosition({...standard,trainer_patience:.15});
 assert.equal(patient.position,'PRESSING_FOR_CHANGE');
 assert.equal(impatient.position,'CONSIDERING_DEPARTURE');
 assert.equal(assessTrainerRelationshipPosition({...standard,trainer_patience:.15,
  shared_working_days:7,unfunded_horse_days:0}).position,'COMMITTED');
 assert.equal(assessTrainerRelationshipPosition({...standard,trainer_patience:.90,
  trainer_support:.95,working_relationship_strength:.9,relationship_friction:.03}).position,
  'COMMITTED');
});
test('actual owner-paid care and earned trust affect quoted trainer terms without invented transactions',()=>{
 let s=advance(fresh());const {owner,trainer,id}=byPair(s);
 const before=structuredClone(s),base=trainerContractQuote(s,world,owner,trainer);
 assert.equal(base.trainer_patience,workingRelationshipProfile(s,owner,trainer).trainer_patience);
 const valued=structuredClone(s),fractured=structuredClone(s);
 Object.assign(valued.runtime.agents.relationships[id],{
  owner_trust:.92,trainer_support:.91,days:90,unfunded_days:0});
 Object.assign(fractured.runtime.agents.relationships[id],{
  owner_trust:.17,trainer_support:.14,days:90,unfunded_days:11});
 const good=trainerContractQuote(valued,world,owner,trainer);
 const bad=trainerContractQuote(fractured,world,owner,trainer);
 assert.ok(bad.minimum_acceptable_minor>good.minimum_acceptable_minor);
 assert.ok(bad.working_relationship_strength<good.working_relationship_strength);
 assert.deepEqual(s,before);
 assert.equal(valued.runtime.finances.ledger.length,s.runtime.finances.ledger.length);
 assert.equal(fractured.runtime.finances.ledger.length,s.runtime.finances.ledger.length);
});
test('28-day lived relationship reviews persist both sides and keep player mandate under player control',()=>{
 let s=advance(fresh()),{owner,trainer,id}=byPair(s);
 const player=Object.values(s.runtime.registered_horses.by_id).
  find(h=>h.owner_organization_id===s.player.operation_id);
 const playerPair=player.owner_organization_id+'|'+player.trainer_id;
 s=command(s,'relationship:player-support','SET_OWNER_TRAINER_MANDATE',{
  owner_id:player.owner_organization_id,trainer_id:player.trainer_id,
  mandate:'SUPPORT'},'player');
 Object.assign(s.runtime.agents.relationships[id],{
  owner_trust:.21,trainer_support:.15,days:29,unfunded_days:10});
 while(s.clock.date<'1999-01-31')s=advance(s);
 const review=s.runtime.owner_trainer_reviews.by_pair[id];
 assert.ok(review?.history.length>=1);
 const last=review.history.at(-1);
 assert.ok(Number.isFinite(last.owner_patience));
 assert.ok(Number.isFinite(last.trainer_patience));
 assert.ok(Number.isFinite(last.working_relationship_strength));
 assert.ok(['FRUSTRATED','PRESSING_FOR_CHANGE','CONSIDERING_DEPARTURE'].
  includes(last.trainer_position));
 assert.equal(last.trainer_position,review.trainer_position);
 assert.ok(s.event_log.some(e=>e.kind==='TRAINER_WORKING_RELATIONSHIP_SIGNAL'&&
  e.details.owner_id===owner&&e.details.trainer_id===trainer&&
  e.details.no_automatic_employment_change===true));
 const playerReview=s.runtime.owner_trainer_reviews.by_pair[playerPair];
 assert.equal(playerReview.mandate,'SUPPORT');
 assert.equal(playerReview.authority,'PLAYER_OWNER_COMMAND');
 assert.deepEqual(getOwnerTrainerCareerReview(s,world,owner,trainer).trainer_position,
  review.trainer_position);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 const fromSaved=importGameSave(exportGameSave(s,world),world);
 assert.deepEqual(workingRelationshipProfile(fromSaved,owner,trainer),
  workingRelationshipProfile(s,owner,trainer));
 console.log('WTW_WORKING_RELATIONSHIPS_PASS',JSON.stringify({
  as_of:s.clock.date,owner_patience:last.owner_patience,
  trainer_patience:last.trainer_patience,
  working_strength:last.working_relationship_strength,
  trainer_signal:last.trainer_position,player_mandate:playerReview.mandate}));
});
