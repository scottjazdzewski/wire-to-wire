import test from 'node:test';
import assert from 'node:assert/strict';
import {connect1999Person,connect1999Horse,connect1999DirectoryEntity}
 from '../public/1999/engine/fictional-industry-graph-1999.mjs';
import {project1999TrainerSourceSkills,project1999JockeySourceSkills,
 source1999RoleCoverage,source1999JockeySelectionMerit,
 project1999OwnerSourceGameplay,
 project1999SupportStaffSourceSkills,project1999FarmSourceGameplay,
 source1999FarmYoungstockQuality,index1999WorkplacePersonnel,
 select1999WorkplacePerson,
 project1999TrackSourceGameplay,source1999TrackSurfaceAdjustment,
 source1999TrackRecoveryMultiplier,source1999TrackPrestigeOfferOffset,
 source1999TrackFacilitiesContribution,SOURCE_PERSONNEL_GAMEPLAY_MODEL}
 from '../public/1999/engine/source-personnel-gameplay-1999.mjs';
import {modeledTrainerSkills,initializeGameHorseCare,createHorseCareRecord,
 apply1999SourceCareStaff}
 from '../public/1999/game/horse-care.js';
import {baselineTrainerDailyFee}
 from '../public/1999/game/trainer-contracts-1999.js';
import {modeledJockeySkills,jockeyRaceExecutionIndex}
 from '../public/1999/game/racing-1999.js';
import {model1999StartingHorseAttributes}
 from '../public/1999/game/horse-starting-attributes.js';
import {createHorseTrainingRecord,advanceHorseTrainingDay}
 from '../public/1999/engine/horse-development.mjs';
import {modelHorsePostRaceResponse}
 from '../public/1999/game/horse-care.js';
import {workingRelationshipProfile}
 from '../public/1999/game/working-relationship-1999.js';
import {trainerContractQuote}
 from '../public/1999/game/trainer-contracts-1999.js';

const SEED=19990101;
const trainerId='P-FICTIONAL-1999-TRAINER-0000001';
const jockeyId='P-FICTIONAL-1999-JOCKEY-0000001';
const trainer=connect1999Person({
 id:trainerId,name:'Original Saved Trainer',role:'trainer',workplaceId:'T-0001'
},{seed:SEED});
const jockey=connect1999Person({
 id:jockeyId,name:'Original Saved Jockey',role:'jockey',workplaceId:'T-0001'
},{seed:SEED});
const sourceHorse=connect1999Horse({
 id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',
 name:'Canonical Runner',status:'RACING',sex:'GELDING',foalYear:1996,
 ownerId:'O-000061',ownerPortfolioTier:'ELITE',homeTrackId:'T-0001',
 development:{potential:84,readiness:60,soundness:76}
},{seed:SEED,trainerCount:10,jockeyCount:10});
const gameHorseId='H-GAME-1999-WORLD-'+sourceHorse.id.replace(/^H-FICTIONAL-1999-/,'');
const attributes=model1999StartingHorseAttributes({
 horse_id:gameHorseId,seed:SEED,foaling_year:1996,sex:'GELDING',
 horseRatings:sourceHorse.ratings,development:sourceHorse.development,
 ownerPortfolioTier:sourceHorse.ownerPortfolioTier
});
const careHorse={
 id:gameHorseId,horse_id:gameHorseId,name:'Canonical Runner',
 registered_name:'Canonical Runner',trainerId:trainerId,trainer_id:trainerId,
 racing_age_1999:3,ageAtOpening:3,starting_attributes:attributes,
 attributes,owner_organization_id:'O-000061',finances:{monthlyCareCost:2500}
};

test('every source trainer and jockey rating maps by permanent P-ID, not by display name',()=>{
 const t=modeledTrainerSkills(trainerId,SEED,trainer);
 const j=modeledJockeySkills(jockeyId,SEED,jockey);
 assert.equal(t.schema,'WTW_1999_TRAINER_SKILLS_GAME_V1');
 assert.equal(t.person_id,trainerId);
 assert.equal(t.source,SOURCE_PERSONNEL_GAMEPLAY_MODEL);
 assert.deepEqual(t.source_role_ratings,trainer.ratings);
 assert.deepEqual(j.source_role_ratings,jockey.ratings);
 assert.equal(j.rating_source,SOURCE_PERSONNEL_GAMEPLAY_MODEL);
 assert.equal(t.source_workplace_id,'T-0001');
 assert.deepEqual(
  modeledTrainerSkills(trainerId,SEED,{...trainer,name:'Changed Display Name'}),
  t);
 assert.deepEqual(
  modeledJockeySkills(jockeyId,SEED,{...jockey,name:'Changed Display Name'}),
  j);
 const coverage=source1999RoleCoverage([trainer,jockey]);
 assert.equal(coverage.complete,true);
 assert.deepEqual(coverage.counts,{trainer:1,jockey:1});
 assert.deepEqual(coverage.missing,{trainer:[],jockey:[]});
});

test('trainer source CONDITIONING has a causal one-day training effect in real horse engine',()=>{
 const low=structuredClone(trainer),high=structuredClone(trainer);
 low.ratings.conditioning=15;high.ratings.conditioning=95;
 const a=modeledTrainerSkills(trainerId,SEED,low);
 const b=modeledTrainerSkills(trainerId,SEED,high);
 assert.ok(b.roleAttributes.conditioning>a.roleAttributes.conditioning);
 assert.ok(b.ability.current>a.ability.current);
 const record=createHorseTrainingRecord(careHorse,'1999-01-01');
 const context={nutrition:.72,supervision:.77,barnQuality:.82,crowding:.5,
  workout:'BALANCED'};
 const resultLow=advanceHorseTrainingDay(
  structuredClone(record),careHorse,{...a,compensation:{dayRate:65}},
  '1999-01-02',SEED,context);
 const resultHigh=advanceHorseTrainingDay(
  structuredClone(record),careHorse,{...b,compensation:{dayRate:65}},
  '1999-01-02',SEED,context);
 assert.ok(resultHigh.horse.fitness>resultLow.horse.fitness,
  'Changing only canonical trainer conditioning must change actual horse fitness');
 assert.equal(record.asOf,'1999-01-01','Test must not rewrite starting horse');
});

test('trainer public REPUTATION affects actual fee without changing conditioning or negotiated terms',()=>{
 const low=structuredClone(trainer),high=structuredClone(trainer);
 low.ratings.reputation=15;high.ratings.reputation=95;
 const a=modeledTrainerSkills(trainerId,SEED,low);
 const b=modeledTrainerSkills(trainerId,SEED,high);
 assert.deepEqual(a.roleAttributes,b.roleAttributes,
  'Public reputation alone must not fabricate improved training talent');
 assert.ok(b.source_reputation_index>a.source_reputation_index);
 assert.ok(baselineTrainerDailyFee(b)>baselineTrainerDailyFee(a),
  'Source reputation must alter the actual game contract fee');
 const legacy=modeledTrainerSkills(trainerId,SEED);
 assert.equal(baselineTrainerDailyFee(legacy),
  Math.round(4000+4500*legacy.roleAttributes.conditioning),
  'Older careers keep original fee model');
});

test('jockey source FINISHING changes the exact index used by official race engine',()=>{
 const low=structuredClone(jockey),high=structuredClone(jockey);
 low.ratings.finishing=15;high.ratings.finishing=95;
 const a=modeledJockeySkills(jockeyId,SEED,low);
 const b=modeledJockeySkills(jockeyId,SEED,high);
 assert.ok(b.finish>a.finish);
 assert.ok(jockeyRaceExecutionIndex(b)>jockeyRaceExecutionIndex(a));
 assert.ok(source1999JockeySelectionMerit(high)>source1999JockeySelectionMerit(low),
  'Original 1999 jockey draft must select on actual P-ID source skill merit');
 assert.equal(a.pace,b.pace,
  'Changing finishing alone must not secretly change a separate pace rating');
 const repeat=modeledJockeySkills(jockeyId,SEED,high);
 assert.deepEqual(repeat,b,'Source-to-gameplay rating mapping must be deterministic');
});

test('canonical track facilities, prestige, surface and safety project from their saved T-ID ratings',()=>{
 const track=connect1999DirectoryEntity({id:'T-0001',name:'Saved Track'},
  {seed:SEED,type:'track'});
 const model=project1999TrackSourceGameplay(track);
 assert.equal(model.source_track_id,'T-0001');
 assert.deepEqual(model.source_ratings,track.ratings);
 assert.equal(model.facilities,track.ratings.facilities/100);
 assert.equal(model.purseStrength,track.ratings.purseStrength/100);
 const low=structuredClone(track),high=structuredClone(track);
 low.ratings.prestige=15;high.ratings.prestige=95;
 assert.ok(source1999TrackPrestigeOfferOffset(project1999TrackSourceGameplay(high))>
  source1999TrackPrestigeOfferOffset(project1999TrackSourceGameplay(low)),
  'Saved prestige must change the real rider mount-acceptance threshold');
 low.ratings.facilities=15;high.ratings.facilities=95;
 assert.ok(source1999TrackFacilitiesContribution(project1999TrackSourceGameplay(high))>
  source1999TrackFacilitiesContribution(project1999TrackSourceGameplay(low)),
  'Saved facilities must change the actual opening-site quality calculation');
 low.ratings.surfaceQuality=15;high.ratings.surfaceQuality=95;
 assert.ok(source1999TrackSurfaceAdjustment(
  project1999TrackSourceGameplay(high),.9)>
  source1999TrackSurfaceAdjustment(project1999TrackSourceGameplay(low),.9),
  'Saved surface quality must change the real horse/track matchup input');
 low.ratings.safety=15;high.ratings.safety=95;
 assert.ok(source1999TrackRecoveryMultiplier(project1999TrackSourceGameplay(high))<
  source1999TrackRecoveryMultiplier(project1999TrackSourceGameplay(low)));
 const incomplete=structuredClone(track);delete incomplete.ratings.safety;
 assert.throws(()=>project1999TrackSourceGameplay(incomplete),/incomplete source rating/);
});

test('track safety changes actual post-race condition in the existing horse care engine',()=>{
 const low=connect1999DirectoryEntity({id:'T-0001',name:'Unsafe'},
  {seed:SEED,type:'track'}),high=structuredClone(low);
 low.ratings.safety=15;high.ratings.safety=95;
 const base=createHorseCareRecord(careHorse,'1999-01-01');
 const event={race_id:'R-1999-0001',finish:2,field_size:8,
  distance_furlongs:8};
 const lowResult=modelHorsePostRaceResponse(structuredClone(base),careHorse,
  {...event,track_recovery_multiplier:source1999TrackRecoveryMultiplier(
   project1999TrackSourceGameplay(low))},SEED);
 const highResult=modelHorsePostRaceResponse(structuredClone(base),careHorse,
  {...event,track_recovery_multiplier:source1999TrackRecoveryMultiplier(
   project1999TrackSourceGameplay(high))},SEED);
 assert.ok(highResult.training.currentRisk<lowResult.training.currentRisk,
  'Only the canonical track safety rating changed; real post-race risk must improve');
 assert.equal(highResult.history.at(-1).track_recovery_multiplier,.6);
 assert.equal(lowResult.history.at(-1).track_recovery_multiplier,1.4);
});

test('all five canonical owner ratings are stored and drive the existing care, patience and contract decisions',()=>{
 const owner=connect1999DirectoryEntity({id:'O-FICTIONAL-OWNER-SOURCE-0001',
  name:'Saved Owner'},{seed:SEED,type:'owner'});
 const projected=project1999OwnerSourceGameplay(owner);
 assert.deepEqual(projected.source_role_ratings,owner.ratings);
 assert.equal(projected.resources,owner.ratings.resources/100);
 assert.equal(projected.ambition,owner.ratings.ambition/100);
 assert.equal(projected.patience,owner.ratings.patience/100);
 assert.equal(projected.riskTolerance,owner.ratings.riskTolerance/100);
 assert.equal(projected.reputation,owner.ratings.reputation/100);
 const impatient=structuredClone(owner),patient=structuredClone(owner);
 impatient.ratings.patience=15;patient.ratings.patience=95;
 const state={rng:{seed:SEED},runtime:{}};
 const a=workingRelationshipProfile(state,owner.id,trainerId,impatient);
 const b=workingRelationshipProfile(state,owner.id,trainerId,patient);
 assert.equal(a.owner_patience,.15);
 assert.equal(b.owner_patience,.95);
 const lowRep=structuredClone(owner),highRep=structuredClone(owner);
 lowRep.ratings.reputation=15;highRep.ratings.reputation=95;
 const gameState={rng:{seed:SEED},clock:{date:'1999-01-01'},runtime:{
  registered_horses:{by_id:{[gameHorseId]:{...careHorse,owner_organization_id:owner.id,
   starting_attributes:attributes}}},
  people:{[trainerId]:{game_training_skills:modeledTrainerSkills(trainerId,SEED,trainer)}},
  finances:{operation_balances_minor:{[owner.id]:100000000}}}};
 const quote=(organization)=>trainerContractQuote(gameState,
  {entities:{organizations:[organization],people:[trainer]}},owner.id,trainerId);
 assert.ok(quote(highRep).minimum_acceptable_minor<quote(lowRep).minimum_acceptable_minor,
  'Better saved owner standing must affect the existing signed-service offer threshold');
});

test('saved farm, farm manager and breeding attendant ratings change actual opening readiness',()=>{
 const farm=connect1999DirectoryEntity({id:'O-FICTIONAL-FARM-0001',name:'Care Farm'},
  {seed:SEED,type:'farm'});
 const manager=connect1999Person({id:'P-FICTIONAL-1999-FARM-MANAGER-0000001',
  role:'farm_manager',workplaceId:farm.id},{seed:SEED});
 const attendant=connect1999Person({id:'P-FICTIONAL-1999-BREEDING-ATTENDANT-0000001',
  role:'breeding_attendant',workplaceId:farm.id},{seed:SEED});
 const index=index1999WorkplacePersonnel([manager,attendant]);
 assert.equal(select1999WorkplacePerson(index,'farm_manager',farm.id,SEED,
  sourceHorse.id).id,manager.id);
 const care=source1999FarmYoungstockQuality(farm,manager,attendant);
 assert.equal(care.source_farm_id,farm.id);
 assert.equal(care.source_manager_id,manager.id);
 assert.equal(care.source_attendant_id,attendant.id);
 assert.deepEqual(care.source_ratings,farm.ratings);
 const input={horse_id:gameHorseId,seed:SEED,foaling_year:1996,sex:'GELDING',
  horseRatings:sourceHorse.ratings,development:sourceHorse.development,
  ownerPortfolioTier:sourceHorse.ownerPortfolioTier};
 const low=model1999StartingHorseAttributes({...input,sourceYoungstockQuality:.15});
 const high=model1999StartingHorseAttributes({...input,sourceYoungstockQuality:.95});
 assert.ok(high.training_focus>low.training_focus);
 assert.ok(high.fitness>low.fitness);
 for(const key of Object.keys(farm.ratings)){
  const changed=structuredClone(farm);changed.ratings[key]=1;
  assert.notEqual(source1999FarmYoungstockQuality(changed,manager,attendant).quality,
   care.quality,'Farm '+key+' rating must affect the actual opening care quality');
 }
 for(const person of [manager,attendant])for(const key of Object.keys(person.ratings)){
  const changed=structuredClone(person);changed.ratings[key]=1;
  const next=person.role==='farm_manager'?
   source1999FarmYoungstockQuality(farm,changed,attendant):
   source1999FarmYoungstockQuality(farm,manager,changed);
  assert.notEqual(next.quality,care.quality,
   person.role+' '+key+' must affect the horse opening condition model');
 }
});

test('groom, exercise rider, veterinarian and farrier ratings alter daily training and welfare inputs',()=>{
 const roles=[
  ['groom',['horseCare','observation','reliability','experience']],
  ['exercise_rider',['horsemanship','feedback','fitness','reliability']],
  ['veterinarian',['diagnostics','treatment','prevention','reliability']],
  ['farrier',['hoofCare','correctiveSkill','reliability']]
 ];
 for(const [role,keys] of roles){
  const person=connect1999Person({id:'P-FICTIONAL-1999-'+
   role.toUpperCase().replaceAll('_','-')+'-0000001',role,
   workplaceId:'T-0001'},{seed:SEED});
  const skill=project1999SupportStaffSourceSkills(person);
  assert.equal(skill.source_person_id,person.id);
  assert.deepEqual(skill.source_role_ratings,person.ratings);
  for(const key of keys){
   const changed=structuredClone(person);changed.ratings[key]=1;
   assert.notDeepEqual(project1999SupportStaffSourceSkills(changed),skill,
    role+' '+key+' must change its mapped gameplay profile');
  }
 }
 const rated=(role,values)=>({source_person_id:'P-'+role,
  ...values});
 const base={nutrition:.72,supervision:.77,barnQuality:.82,crowding:.5,
  workout:'BALANCED'};
 const record=createHorseTrainingRecord(careHorse,'1999-01-01');
 const trainerSkills=modeledTrainerSkills(trainerId,SEED,trainer);
 const apply=(staff,plan='BALANCED')=>advanceHorseTrainingDay(
  structuredClone(record),careHorse,trainerSkills,'1999-01-02',SEED,
  {...apply1999SourceCareStaff({...base,workout:plan},staff),workout:plan}).horse;
 const lowGroom=apply({groom:rated('groom',{care:.15,observation:.15})});
 const highGroom=apply({groom:rated('groom',{care:.95,observation:.95})});
 assert.ok(highGroom.fitness>lowGroom.fitness);
 assert.ok(highGroom.currentRisk<lowGroom.currentRisk);
 const lowRider=apply({exercise_rider:rated('exercise_rider',
  {trainingResponse:.15,paceWork:.15})});
 const highRider=apply({exercise_rider:rated('exercise_rider',
  {trainingResponse:.95,paceWork:.95})});
 assert.ok(highRider.fitness>lowRider.fitness);
 const lowVet=apply({veterinarian:rated('veterinarian',
  {prevention:.15,treatment:.15})},'REST');
 const highVet=apply({veterinarian:rated('veterinarian',
  {prevention:.95,treatment:.95})},'REST');
 assert.ok(highVet.currentRisk<lowVet.currentRisk);
 assert.ok(highVet.stress<lowVet.stress);
 const lowFarrier=apply({farrier:rated('farrier',{hoofCare:.15})});
 const highFarrier=apply({farrier:rated('farrier',{hoofCare:.95})});
 assert.ok(highFarrier.currentRisk<lowFarrier.currentRisk);
});

test('actual 1999 career initializes the trainer from canonical source and preserves saved progression',()=>{
 const world={entities:{people:[trainer],horses:[sourceHorse]}};
 const state={clock:{date:'1999-01-01'},rng:{seed:SEED},
  runtime:{horse:{},people:{}}};
 initializeGameHorseCare(state,careHorse,world);
 const original=state.runtime.people[trainerId].game_training_skills;
 assert.deepEqual(original.source_role_ratings,trainer.ratings);
 assert.equal(original.source_person_id,trainerId);
 const disk=structuredClone(state);
 assert.deepEqual(disk.runtime.people[trainerId].game_training_skills,original);
 const changed=structuredClone(world);
 changed.entities.people[0].ratings.conditioning=15;
 initializeGameHorseCare(state,careHorse,changed);
 assert.deepEqual(state.runtime.people[trainerId].game_training_skills,original,
  'An already played career must never lose its developed trainer skills');
});

test('original pilot saves retain fallback, but incomplete canonical source fails closed',()=>{
 assert.deepEqual(modeledTrainerSkills(trainerId,SEED),
  modeledTrainerSkills(trainerId,SEED,{id:trainerId,role:'trainer'}));
 assert.deepEqual(modeledJockeySkills(jockeyId,SEED),
  modeledJockeySkills(jockeyId,SEED,{id:jockeyId,role:'jockey'}));
 const invalid=structuredClone(trainer);
 delete invalid.ratings.conditioning;
 assert.throws(()=>project1999TrainerSourceSkills(invalid),/incomplete source rating/);
 assert.equal(source1999RoleCoverage([invalid,jockey]).complete,false);
 assert.deepEqual(source1999RoleCoverage([invalid,jockey]).missing.trainer,[trainerId]);
 const invalidJockey=structuredClone(jockey);
 delete invalidJockey.ratings.paceJudgment;
 assert.throws(()=>project1999JockeySourceSkills(invalidJockey),/incomplete source rating/);
 assert.throws(()=>modeledTrainerSkills(jockeyId,SEED,trainer),/source ID mismatch/);
});
