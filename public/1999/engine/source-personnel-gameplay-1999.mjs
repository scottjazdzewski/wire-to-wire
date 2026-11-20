/**
 * ONE source -> gameplay rating adapter for the existing 1999 career.
 *
 * A canonical P-ID is the authority. Never generate a second set of
 * technical traits by hashing a real saved person's ID. Old pilot identities
 * without the V10 source schema keep their existing legacy fallback.
 *
 * All ratings are modeled fiction, NOT certified historical observations.
 * Weights are explicit so future calibration can change them as a versioned
 * game rule, without rewriting an existing person's source record.
 */
export const SOURCE_PERSONNEL_GAMEPLAY_MODEL='WTW_1999_SOURCE_PERSONNEL_GAMEPLAY_V1';
export const SOURCE_PERSONNEL_RATING_KEYS=Object.freeze({
 trainer:Object.freeze(['conditioning','placement','development','raceStrategy',
  'horseCare','reputation','integrity']),
 jockey:Object.freeze(['tactics','paceJudgment','finishing','gateSkill',
  'versatility','fitness','reputation'])
});
const clamp=x=>Math.max(.01,Math.min(.99,Math.round(x*10000)/10000));
const blend=(ratings,weights)=>clamp(weights.reduce((sum,[key,weight])=>
 sum+ratings[key]*weight/100,0));
const strictSource=person=>person?.ratingsProvenance==='MODELED_1999_UNCALIBRATED';
function verifiedRole(person,role){
 if(!person||person.role!==role||!person.id)return null;
 const keys=SOURCE_PERSONNEL_RATING_KEYS[role];
 if(!person.ratings||typeof person.ratings!=='object'){
  if(strictSource(person))
   throw Error('Canonical '+role+' '+person.id+' is missing all source ratings');
  return null;
 }
 const complete=keys.every(key=>Number.isFinite(person.ratings[key])&&
  person.ratings[key]>=1&&person.ratings[key]<=99);
 if(!complete){
  if(strictSource(person))
   throw Error('Canonical '+role+' '+person.id+' has incomplete source rating values');
  return null;
 }
 return Object.fromEntries(keys.map(key=>[key,person.ratings[key]]));
}
export function project1999TrainerSourceSkills(person){
 const r=verifiedRole(person,'trainer');
 if(!r)return null;
 const attr={
  conditioning:blend(r,[['conditioning',1]]),
  workout_design:blend(r,[['development',.62],['raceStrategy',.38]]),
  young_horse_development:blend(r,[['development',.80],['horseCare',.20]]),
  veterinary_coordination:blend(r,[['horseCare',.70],['integrity',.30]]),
  layoff_management:blend(r,[['horseCare',.55],['conditioning',.25],
   ['integrity',.20]]),
  race_placement:blend(r,[['placement',.72],['raceStrategy',.28]])
 };
 const current=Math.round(99*(attr.conditioning*.22+
  attr.workout_design*.18+attr.young_horse_development*.20+
  attr.veterinary_coordination*.14+attr.layoff_management*.10+
  attr.race_placement*.16));
 return {source:SOURCE_PERSONNEL_GAMEPLAY_MODEL,source_person_id:person.id,
  source_role_ratings:r,
  // Public standing is a contract/fee input, NOT a fabricated conditioning
  // advantage. Actual paid agreements still override modeled quotations.
  source_reputation_index:blend(r,[['reputation',1]]),
  source_birth_date:person.dateOfBirth??null,
  source_workplace_id:person.workplaceId??null,
  roleAttributes:attr,ability:{current,potential:Math.min(99,
   Math.max(current,Math.round(current+(.99-attr.young_horse_development)*6)))}};
}
export function project1999JockeySourceSkills(person){
 const r=verifiedRole(person,'jockey');
 if(!r)return null;
 return {rating_source:SOURCE_PERSONNEL_GAMEPLAY_MODEL,
  source_person_id:person.id,source_role_ratings:r,
  judgment:blend(r,[['tactics',.8],['versatility',.2]]),
  pace:blend(r,[['paceJudgment',.85],['tactics',.15]]),
  finish:blend(r,[['finishing',.85],['fitness',.15]]),
  composure:blend(r,[['gateSkill',.35],['fitness',.35],['tactics',.3]]),
  horse_handling:blend(r,[['versatility',.65],['gateSkill',.35]])};
}
export function source1999RoleCoverage(people=[]){
 const counts={trainer:0,jockey:0},missing={trainer:[],jockey:[]};
 for(const person of people)if(Object.hasOwn(counts,person?.role)){
  counts[person.role]++;
  try{
   const result=person.role==='trainer'?
    project1999TrainerSourceSkills(person):project1999JockeySourceSkills(person);
   if(!result)missing[person.role].push(person.id);
  }catch{missing[person.role].push(person.id)}
 }
 return {counts,missing,
  complete:!missing.trainer.length&&!missing.jockey.length};
}
