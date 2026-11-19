import test from 'node:test';
import assert from 'node:assert/strict';
import {connect1999Horse,connect1999Person,connect1999DirectoryEntity}
 from '../public/1999/engine/fictional-industry-graph-1999.mjs';
import {model1999StartingHorseAttributes}
 from '../public/1999/game/horse-starting-attributes.js';
import {createPersistedIndustryHorseDirectory,createPersistedIndustryEntityDirectory}
 from '../public/next/1999-persisted-world-directory.mjs';
import {project1999SavedHorseRatings,project1999SavedEntityRatings,
 audit1999SavedWorldRatings,OPENING_HORSE_RATING_KEYS}
 from '../public/next/1999-world-rating-projection.mjs';
const seed=19990101;
const track={id:'T-0002',name:'Actual Track',location:{region:'Kentucky'}};
const owner=connect1999DirectoryEntity({id:'O-000061',name:'Kingsmere Farm'},
 {seed,type:'owner',homeTrackId:track.id});
const person=id=>connect1999Person({id,name:'Person '+id,role:'trainer',
 workplaceId:track.id},{seed});
function horse(id,status,year,sex='GELDING'){
 return connect1999Horse({id,name:'Horse '+id,status,foalYear:year,sex,
  ownerId:owner.id,foalingFarmId:owner.id,careFacilityId:owner.id,
  homeTrackId:status==='RACING'?track.id:null,
  ownerPortfolioTier:'ELITE',
  development:{potential:80,readiness:62,soundness:76}
 },{seed,trainerCount:2,jockeyCount:2});
}
const raceHorse=horse('H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001','RACING',1996);
const mare=horse('H-FICTIONAL-1999-BROODMARES-0000001','BROODMARE',1980,'MARE');
function world(){
 return {entities:{
  horses:[structuredClone(raceHorse),structuredClone(mare)],
  people:[person('P-FICTIONAL-1999-TRAINER-0000001')],
  organizations:[structuredClone(owner)],
  tracks:[structuredClone(track)]
 }};
}
const manifest={worldId:'WTW1999FullIndustry-TEST-RATING-COVERAGE',seed,
 horseCount:2,personCount:1};

test('real opening racehorse shows EXACT same CA and PA as the actual game engine',()=>{
 const w=world(),horseRows=createPersistedIndustryHorseDirectory({world:w,manifest});
 const row=horseRows.byId(raceHorse.id);
 const expected=model1999StartingHorseAttributes({
  horse_id:'H-GAME-1999-WORLD-'+raceHorse.id.replace(/^H-FICTIONAL-1999-/,''),
  seed,foaling_year:1996,sex:'GELDING',
  horseRatings:raceHorse.ratings,development:raceHorse.development,
  ownerPortfolioTier:raceHorse.ownerPortfolioTier
 });
 assert.equal(row.ca,expected.current_ability);
 assert.equal(row.pa,expected.potential_ability);
 assert.equal(row.abilityMethod,'EXACT_GAMEPLAY_STARTING_ATTRIBUTES');
 assert.equal(row.ratingDataStatus,'COMPLETE');
 assert.equal(row.ratingSpeed,raceHorse.ratings.speed);
 assert.equal(row.ratingClass,raceHorse.ratings.class);
 assert.equal(row.ratingBreedingValue,raceHorse.ratings.breedingValue);
 assert.equal(row.ratingCoverage,'10/10');
 assert.equal(Object.keys(raceHorse.ratings).length,OPENING_HORSE_RATING_KEYS.length);
});

test('1999 retired and breeding animals still display all saved rating dimensions without fake race registration',()=>{
 const w=world();
 const source=createPersistedIndustryHorseDirectory({world:w,manifest}).byId(mare.id);
 assert.equal(source.abilityMethod,'MODELED_LATENT_NONRUNNER_NOT_RACE_READY');
 assert.equal(source.ratingDataStatus,'COMPLETE');
 assert.equal(source.pa,mare.development.potential);
 assert.equal(source.ratingStamina,mare.ratings.stamina);
 assert.ok(Number.isFinite(source.athleticIndex));
 assert.ok(source.ca<=source.pa);
 assert.equal(source.sourceHorseId,mare.id);
 assert.ok(!('horse_id' in w.entities.horses[1]),
  'World browsing must not falsely register breeding stock as race starters');
});

test('ratings exist and remain inspectable for all person roles and enterprise screens',()=>{
 const w=world();
 const row=createPersistedIndustryEntityDirectory({world:w,manifest,kind:'person'})
  .byId(w.entities.people[0].id);
 assert.equal(row.ratingDataStatus,'COMPLETE');
 assert.ok(Number.isFinite(row.ratingIntegrity), 'Trainer Integrity skill must not overwrite status');
 assert.equal(row.ratingConditioning,w.entities.people[0].ratings.conditioning);
 assert.ok(row.ratingCoverage>=7);
 assert.ok(Number.isFinite(row.overallRating));
 const org=createPersistedIndustryEntityDirectory({world:w,manifest,kind:'organization'})
  .byId(owner.id);
 assert.equal(org.ratingDataStatus,'COMPLETE');
 assert.ok(Number.isFinite(org.overallRating));
 const horses=createPersistedIndustryHorseDirectory({world:w,manifest});
 assert.deepEqual(horses.ratingAudit(),{
  horses:2,people:1,ratedHorses:2,ratedPeople:1,
  expectedHorses:2,expectedPeople:1,
  missingHorseIds:[],missingPersonIds:[],valid:true
 });
});

test('missing ratings are reported, never silently fabricated or presented as complete',()=>{
 const w=world();
 delete w.entities.horses[1].ratings.speed;
 delete w.entities.people[0].ratings;
 const rating=project1999SavedHorseRatings(w.entities.horses[1],{seed});
 assert.equal(rating.ratingDataStatus,'MISSING: speed');
 assert.equal(rating.ca,null);
 const personRating=project1999SavedEntityRatings(w.entities.people[0]);
 assert.equal(personRating.ratingDataStatus,'MISSING');
 const audit=audit1999SavedWorldRatings(w,manifest);
 assert.equal(audit.valid,false);
 assert.deepEqual(audit.missingHorseIds,[mare.id]);
 assert.deepEqual(audit.missingPersonIds,[w.entities.people[0].id]);
});
