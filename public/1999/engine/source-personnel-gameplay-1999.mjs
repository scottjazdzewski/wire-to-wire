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
export const SOURCE_OWNER_GAMEPLAY_MODEL='WTW_1999_SOURCE_OWNER_GAMEPLAY_V1';
export const SOURCE_TRACK_GAMEPLAY_MODEL='WTW_1999_SOURCE_TRACK_GAMEPLAY_V1';
export const SOURCE_FARM_GAMEPLAY_MODEL='WTW_1999_SOURCE_FARM_GAMEPLAY_V1';
export const SOURCE_SUPPORT_STAFF_GAMEPLAY_MODEL='WTW_1999_SOURCE_SUPPORT_STAFF_GAMEPLAY_V1';
export const SOURCE_PERSONNEL_RATING_KEYS=Object.freeze({
 trainer:Object.freeze(['conditioning','placement','development','raceStrategy',
  'horseCare','reputation','integrity']),
 jockey:Object.freeze(['tactics','paceJudgment','finishing','gateSkill',
  'versatility','fitness','reputation']),
 groom:Object.freeze(['horseCare','observation','reliability','experience']),
 exercise_rider:Object.freeze(['horsemanship','feedback','fitness','reliability']),
 veterinarian:Object.freeze(['diagnostics','treatment','prevention','reliability']),
 farrier:Object.freeze(['hoofCare','correctiveSkill','reliability']),
 farm_manager:Object.freeze(['operations','breeding','staffManagement','reliability']),
 breeding_attendant:Object.freeze(['horseHandling','reproduction','reliability'])
});
const clamp=x=>Math.max(.01,Math.min(.99,Math.round(x*10000)/10000));
const blend=(ratings,weights)=>clamp(weights.reduce((sum,[key,weight])=>
 sum+ratings[key]*weight/100,0));
const mix=(values,weights)=>clamp(weights.reduce((sum,[key,weight])=>
 sum+values[key]*weight,0));
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

/** Source-backed support staff traits used by daily care at their workplace. */
export function project1999SupportStaffSourceSkills(person){
 const role=person?.role;
 if(!['groom','exercise_rider','veterinarian','farrier','farm_manager',
  'breeding_attendant'].includes(role))return null;
 const r=verifiedRole(person,role);
 if(!r)return null;
 const common={source:SOURCE_SUPPORT_STAFF_GAMEPLAY_MODEL,
  source_person_id:person.id,source_role:role,source_role_ratings:r,
  source_workplace_id:person.workplaceId??null};
 if(role==='groom')return {...common,
  care:blend(r,[['horseCare',.45],['observation',.25],
   ['reliability',.20],['experience',.10]]),
  observation:blend(r,[['observation',.55],['experience',.25],
   ['reliability',.20]])};
 if(role==='exercise_rider')return {...common,
  trainingResponse:blend(r,[['horsemanship',.45],['feedback',.30],
   ['fitness',.15],['reliability',.10]]),
  paceWork:blend(r,[['horsemanship',.35],['feedback',.35],
   ['fitness',.20],['reliability',.10]])};
 if(role==='veterinarian')return {...common,
  prevention:blend(r,[['prevention',.45],['diagnostics',.25],
   ['reliability',.20],['treatment',.10]]),
  treatment:blend(r,[['treatment',.55],['diagnostics',.25],
   ['reliability',.20]])};
 if(role==='farrier')return {...common,
  hoofCare:blend(r,[['hoofCare',.60],['correctiveSkill',.25],
   ['reliability',.15]])};
 if(role==='farm_manager')return {...common,
  operations:blend(r,[['operations',.40],['staffManagement',.30],
   ['reliability',.20],['breeding',.10]]),
  breedingOperations:blend(r,[['breeding',.55],['operations',.20],
   ['staffManagement',.15],['reliability',.10]])};
 return {...common,
  handling:blend(r,[['horseHandling',.55],['reliability',.25],
   ['reproduction',.20]]),
  reproduction:blend(r,[['reproduction',.60],['horseHandling',.20],
   ['reliability',.20]])};
}

/** Index role assignments once; generation/career opening may process millions of links. */
export function index1999WorkplacePersonnel(people=[]){
 const index=new Map();
 for(const person of people){
  if(!person?.role||!person.workplaceId)continue;
  const key=person.role+'|'+person.workplaceId;
  if(!index.has(key))index.set(key,[]);
  index.get(key).push(person);
 }
 for(const staff of index.values())staff.sort((a,b)=>a.id.localeCompare(b.id));
 return index;
}
/** Stable workforce assignment from existing WORKS_AT workplace links. */
export function select1999WorkplacePerson(people,role,workplaceId,seed,subjectId){
 if((!Array.isArray(people)&&!(people instanceof Map))||!workplaceId||!Number.isSafeInteger(seed)||
  typeof subjectId!=='string')return null;
 const available=people instanceof Map?
  (people.get(role+'|'+workplaceId)||[]):people.filter(p=>
   p.role===role&&p.workplaceId===workplaceId).sort((a,b)=>a.id.localeCompare(b.id));
 if(!available.length)return null;
 let hash=(2166136261^(seed>>>0))>>>0;
 for(const c of role+'|'+workplaceId+'|'+subjectId){
  hash^=c.charCodeAt(0);hash=Math.imul(hash,16777619);
 }
 const person=available[(hash>>>0)%available.length];
 return project1999SupportStaffSourceSkills(person)?person:null;
}

/** Farm environment and resident carers affect initial young-horse readiness. */
export function project1999FarmSourceGameplay(farm){
 if(!farm?.id)return null;
 const keys=['breeding','youngstockCare','facilities','management','reputation'];
 const ratings=farm.ratings||{};
 const complete=keys.every(key=>Number.isFinite(ratings[key])&&
  ratings[key]>=1&&ratings[key]<=99);
 if(!complete){
  if(farm.ratingsProvenance==='MODELED_1999_UNCALIBRATED')
   throw Error('Canonical farm '+farm.id+' has incomplete source rating values');
  return null;
 }
 const source_ratings=Object.fromEntries(keys.map(key=>[key,ratings[key]]));
 return {schema:SOURCE_FARM_GAMEPLAY_MODEL,source_farm_id:farm.id,
  source_ratings,youngstockEnvironment:blend(ratings,[
   ['youngstockCare',.35],['facilities',.20],['management',.20],
   ['breeding',.15],['reputation',.10]]),
  breedingOperations:blend(ratings,[['breeding',.50],['management',.20],
   ['facilities',.15],['reputation',.15]])};
}

/** Farm ratings plus the horse's exact resident carer form one opening input. */
export function source1999FarmYoungstockQuality(farm,manager,attendant){
 const profile=project1999FarmSourceGameplay(farm);
 if(!profile)return null;
 const managerSkills=manager?project1999SupportStaffSourceSkills(manager):null;
 const attendantSkills=attendant?project1999SupportStaffSourceSkills(attendant):null;
 if(manager&&manager.role!=='farm_manager')
  throw Error('Youngstock manager must be a farm_manager');
 if(attendant&&attendant.role!=='breeding_attendant')
  throw Error('Youngstock carer must be a breeding_attendant');
 const residentManager=managerSkills?mix({operations:managerSkills.operations,
  breeding:managerSkills.breedingOperations},[['operations',.75],['breeding',.25]]):
  profile.breedingOperations;
 const residentAttendant=attendantSkills?mix({handling:attendantSkills.handling,
  reproduction:attendantSkills.reproduction},[['handling',.70],['reproduction',.30]]):
  profile.youngstockEnvironment;
 return {schema:SOURCE_FARM_GAMEPLAY_MODEL,source_farm_id:farm.id,
  source_manager_id:managerSkills?.source_person_id??null,
  source_attendant_id:attendantSkills?.source_person_id??null,
  source_ratings:profile.source_ratings,
  quality:mix({farm:profile.youngstockEnvironment,manager:residentManager,
   attendant:residentAttendant},[['farm',.70],['manager',.18],['attendant',.12]])};
}

/** Exact saved owner O-ID ratings for existing business and management decisions. */
export function project1999OwnerSourceGameplay(owner){
 if(!owner?.id)return null;
 const keys=['resources','ambition','patience','riskTolerance','reputation'];
 const ratings=owner.ratings||{};
 const complete=keys.every(key=>Number.isFinite(ratings[key])&&
  ratings[key]>=1&&ratings[key]<=99);
 if(!complete){
  if(owner.ratingsProvenance==='MODELED_1999_UNCALIBRATED')
   throw Error('Canonical owner '+owner.id+' has incomplete source rating values');
  return null;
 }
 const sourceRatings=Object.fromEntries(keys.map(key=>[key,ratings[key]]));
 const resources=ratings.resources/100,ambition=ratings.ambition/100,
  riskTolerance=ratings.riskTolerance/100,patience=ratings.patience/100,
  reputation=ratings.reputation/100;
 return {schema:SOURCE_OWNER_GAMEPLAY_MODEL,source_owner_id:owner.id,
  source_role_ratings:sourceRatings,resources,ambition,patience,riskTolerance,reputation,
  investmentAppetite:Math.max(.01,Math.min(.99,
   .45*ambition+.45*riskTolerance+.10*resources)),
  welfarePriority:Math.max(.01,Math.min(.99,.75*patience+.25*resources))};
}
export function source1999OwnerReputationContractOffset(owner){
 return owner?(owner.reputation-.55)*.08:0;
}
/** Pre-booking rider selection uses genuine saved P-ID source ability. */
export function source1999JockeySelectionMerit(person){
 const skills=project1999JockeySourceSkills(person);
 if(!skills)return Number.isFinite(person?.ratings?.ability)?
  person.ratings.ability:0;
 return Math.round(100*(skills.judgment*.25+skills.pace*.22+
  skills.finish*.26+skills.horse_handling*.17+
  (person.ratings.reputation/100)*.10));
}
export function source1999RoleCoverage(people=[]){
 const counts={},missing={};
 for(const person of people)if(Object.hasOwn(SOURCE_PERSONNEL_RATING_KEYS,person?.role)){
  const role=person.role;
  counts[role]??=0;missing[role]??=[];
  counts[role]++;
  try{
   const result=role==='trainer'?project1999TrainerSourceSkills(person):
    role==='jockey'?project1999JockeySourceSkills(person):
    project1999SupportStaffSourceSkills(person);
   if(!result)missing[role].push(person.id);
  }catch{missing[role].push(person.id)}
 }
 return {counts,missing,
  complete:Object.values(missing).every(ids=>ids.length===0)};
}

/**
 * Project the exact saved track ratings into bounded game inputs. The track
 * record remains the only source; these values are consumed by opening-barn
 * quality, rider acceptance, race performance, purse-market conditions and
 * race recovery. No track rating claims to be an observed historical score.
 */
export function project1999TrackSourceGameplay(track){
 if(!track?.id)return null;
 const keys=['surfaceQuality','safety','purseStrength','prestige','facilities'];
 const ratings=track.ratings||{};
 const complete=keys.every(key=>Number.isFinite(ratings[key])&&
  ratings[key]>=1&&ratings[key]<=99);
 if(!complete){
  if(track.ratingsProvenance==='MODELED_1999_UNCALIBRATED')
   throw Error('Canonical track '+track.id+' has incomplete source rating values');
  return null;
 }
 return {schema:SOURCE_TRACK_GAMEPLAY_MODEL,source_track_id:track.id,
  source_ratings:Object.fromEntries(keys.map(key=>[key,ratings[key]])),
  surfaceQuality:ratings.surfaceQuality/100,safety:ratings.safety/100,
  purseStrength:ratings.purseStrength/100,prestige:ratings.prestige/100,
  facilities:ratings.facilities/100};
}

/** Small, matchup-specific surface effect in official race performance. */
export function source1999TrackSurfaceAdjustment(track,horseSurfaceAptitude){
 if(!track||!Number.isFinite(horseSurfaceAptitude))return 0;
 return Math.max(-.07,Math.min(.07,
  (track.surfaceQuality-.55)*(horseSurfaceAptitude-.5)*.35));
}

/** Track prestige makes the same eligible mount more attractive to riders. */
export function source1999TrackPrestigeOfferOffset(track){
 return track?(track.prestige-.55)*.08:0;
}

/** Exact 15% contribution used when creating the career's opening barn. */
export function source1999TrackFacilitiesContribution(track){
 return track?track.source_ratings.facilities*.15:55*.15;
}

/** Relative safety changes recovery risk after a completed simulated race. */
export function source1999TrackRecoveryMultiplier(track){
 return track?Math.round(Math.max(.6,Math.min(1.4,
  1+(.55-track.safety)))*1000)/1000:1;
}
