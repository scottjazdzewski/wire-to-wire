/**
 * Opening-world ratings and graph edges. All values are deterministic,
 * immutable at genesis, and marked as modeled rather than observed history.
 * A relationship is a typed ID reference, never a display-name join.
 */
export const INDUSTRY_GRAPH_SCHEMA='WTW_INDUSTRY_ENTITY_GRAPH_1999_V1';
function hash(seed,key){let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 return h>>>0}
const score=(seed,id,attribute,low=15,high=95)=>
 low+hash(seed,id+':'+attribute)%(high-low+1);
export function rate1999Entity(seed,entityType,id){
 if(!Number.isSafeInteger(seed)||seed<1||!id)throw Error('Invalid entity rating');
 const attributes={
  horse:['speed','stamina','acceleration','class','consistency','soundness',
   'temperament','surfaceDirt','surfaceTurf','breedingValue'],
  trainer:['conditioning','placement','development','raceStrategy',
   'horseCare','reputation','integrity'],
  jockey:['tactics','paceJudgment','finishing','gateSkill','versatility',
   'fitness','reputation'],
  owner:['resources','ambition','patience','riskTolerance','reputation'],
  farm:['breeding','youngstockCare','facilities','management','reputation'],
  track:['surfaceQuality','safety','purseStrength','prestige','facilities'],
  groom:['horseCare','observation','reliability','experience'],
  exercise_rider:['horsemanship','feedback','fitness','reliability'],
  veterinarian:['diagnostics','treatment','prevention','reliability'],
  farrier:['hoofCare','correctiveSkill','reliability'],
  farm_manager:['operations','breeding','staffManagement','reliability'],
  breeding_attendant:['horseHandling','reproduction','reliability']
 }[entityType];
 if(!attributes)throw Error('Unknown entity rating type '+entityType);
 return Object.fromEntries(attributes.map(a=>[a,score(seed,id,a)]));
}
export function relationship1999(type,fromId,toId){
 if(!type||!fromId||!toId)throw Error('Invalid relationship edge');
 return {type,fromId,toId,provenance:'MODELED_1999_OPENING_WORLD'};
}
export function connect1999Horse(horse,{seed,trainerCount=0,jockeyCount=0,
 tracks=[],farms=[],owners=[],staffByTrack=null,staffByFarm=null}={}){
 if(!horse?.id||!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid horse graph input');
 const id=horse.id,edges=[];
 const ratings=rate1999Entity(seed,'horse',id);
 const development={...(horse.development||{})};
 let familyDelta=0;
 if(horse.sireId||horse.damId){
  const sire=horse.sireId?score(seed,horse.sireId,'breedingValue'):55;
  const dam=horse.damId?score(seed,horse.damId,'breedingValue'):55;
  const familyValue=sire*.42+dam*.58;
  familyDelta=Math.round((familyValue-55)*.22);
  for(const [attribute,weight] of Object.entries({
   speed:.55,stamina:.50,acceleration:.45,class:.55,breedingValue:.75
  }))ratings[attribute]=Math.max(15,Math.min(95,
   ratings[attribute]+Math.round(familyDelta*weight)));
  if(Number.isFinite(development.potential))
   development.potential=Math.max(1,Math.min(99,development.potential+familyDelta));
 }
 const resourceAdjustment={HANDFUL:0,SMALL:1,REGIONAL:2,MAJOR:3,ELITE:4}[
  horse.ownerPortfolioTier]??0;
 if(Number.isFinite(development.readiness))
  development.readiness=Math.max(0,Math.min(100,
   development.readiness+resourceAdjustment));
 const add=(type,target)=>{if(target)edges.push(relationship1999(type,id,target))};
 add('OWNED_BY',horse.ownerId);
 add('BRED_BY',horse.breederId);
 add('FOALED_AT',horse.foalingFarmId);
 // The foaling farm remains a real, physical care relationship at opening;
 // racing horses additionally have a distinct track-based training circuit.
 // A caregiver is selected from the actual staff assigned to that farm, with
 // a deterministic labor-market fallback for farms without a resident hire.
 const careFacilityId=horse.careFacilityId||horse.foalingFarmId||null;
 const farmStaff=staffByFarm?.get(careFacilityId)||{};
 const allFarmStaff=staffByFarm?.get('*')||{};
 const carePool=[...(farmStaff.breeding_attendant||[]),
  ...(farmStaff.farm_manager||[]),...(allFarmStaff.breeding_attendant||[]),
  ...(allFarmStaff.farm_manager||[])];
 const careStaffId=carePool.length?
  carePool[hash(seed,id+':care-staff')%carePool.length]:null;
 add('CARED_AT',careFacilityId);
 add('CARED_BY',careStaffId);
 add('SIRED_BY',horse.sireId);
 add('OUT_OF',horse.damId);
 add('HOME_TRACK',horse.homeTrackId);
 const active=horse.status==='RACING'||horse.status==='TWO_YEAR_OLD_PROSPECT';
 const assigned=(role,count)=>{
  if(staffByTrack){
   const candidates=staffByTrack[role]?.get(horse.homeTrackId)||[];
   if(!candidates.length)throw Error('No '+role+' available at '+horse.homeTrackId);
   return candidates[hash(seed,id+':'+role)%candidates.length];
  }
  return count?'P-FICTIONAL-1999-'+role.toUpperCase()+'-'+
   String(1+hash(seed,id+':'+role)%count).padStart(7,'0'):null;
 };
 const trainerId=active?assigned('trainer',trainerCount):null;
 const jockeyId=horse.status==='RACING'?assigned('jockey',jockeyCount):null;
 const trainingBarnId=active?(horse.trainingBarnId||horse.homeTrackId):null;
 add('TRAINED_AT',trainingBarnId);
 add('TRAINED_BY',trainerId);
 add('PREFERRED_JOCKEY',jockeyId);
 return {...horse,development,trainerId,jockeyId,careFacilityId,careStaffId,
  trainingBarnId,
  ratings,
  relationships:edges,ratingsProvenance:'MODELED_1999_UNCALIBRATED'};
}
export function connect1999Person(person,{seed}={}){
 if(!person?.id||!person?.role)throw Error('Invalid person graph input');
 const type=person.role;
 return {...person,ratings:rate1999Entity(seed,type,person.id),
  relationships:[relationship1999('WORKS_AT',person.id,person.workplaceId)],
  ratingsProvenance:'MODELED_1999_UNCALIBRATED'};
}
export function connect1999DirectoryEntity(entity,{seed,type,homeTrackId=null}={}){
 if(!entity?.id||!['farm','owner','track'].includes(type))
  throw Error('Invalid directory graph input');
 const edges=homeTrackId&&type!=='track'?
  [relationship1999('REGIONAL_CIRCUIT',entity.id,homeTrackId)]:[];
 return {...entity,ratings:rate1999Entity(seed,type,entity.id),
  relationships:edges,ratingsProvenance:'MODELED_1999_UNCALIBRATED'};
}
export function validate1999GraphBatch(records,ids){
 const problems=[];
 for(const entity of records){
  if(!entity?.id||!entity.ratings||!Array.isArray(entity.relationships)){
   problems.push({id:entity?.id??null,reason:'INCOMPLETE_ENTITY'});continue;
  }
  for(const edge of entity.relationships){
   if(edge.fromId!==entity.id||!ids.has(edge.toId))
    problems.push({id:entity.id,reason:'BROKEN_REFERENCE',edge});
  }
 }
 return {valid:problems.length===0,problems};
}

/**
 * Validate every typed relationship against the exact opening-world census.
 * This avoids loading all horses or people to check a cross-batch target.
 * Cohort/role identity is verified by permanent ID and ordinal bounds.
 */
export function validate1999IndustryReferences(records,{
 plan,staffing,tracks,farms,owners,foundingHorses=[]
}={}){
 if(!plan?.counts||!staffing?.counts||![tracks,farms,owners,foundingHorses].every(Array.isArray))
  throw Error('Missing world census for relationship validation');
 const allowed=new Set([...tracks,...farms,...owners].map(x=>x.id));
 const foundingHorseIds=new Set(foundingHorses.map(x=>x.id));
 const horseCohorts=['broodmares','stallions','yearlings','twoYearOldProspects',
  'threeYearOldRunners','fourYearOldRunners','fivePlusRunners'];
 const horseTokens=horseCohorts.map(x=>x.toUpperCase());
 const roleNames=Object.keys(staffing.counts);
 const roleTokens=roleNames.map(x=>x.toUpperCase().replaceAll('_','-'));
 function known(id){
  if(allowed.has(id))return true;
  if(foundingHorseIds.has(id))return true;
  const horse=/^H-FICTIONAL-1999-([A-Z]+)-(\d{7})$/.exec(id);
  if(horse){
   const n=horseTokens.indexOf(horse[1]);
   return n>=0&&Number(horse[2])>=1&&
    Number(horse[2])<=plan.counts[horseCohorts[n]];
  }
  const person=/^P-FICTIONAL-1999-([A-Z-]+)-(\d{7})$/.exec(id);
  if(person){
   const n=roleTokens.indexOf(person[1]);
   return n>=0&&Number(person[2])>=1&&
    Number(person[2])<=staffing.counts[roleNames[n]];
  }
  return false;
 }
 const problems=[];
 for(const entity of records){
  if(!known(entity.id))problems.push({id:entity.id,reason:'UNKNOWN_ENTITY'});
  if(!entity.ratings||!Object.values(entity.ratings).every(
   x=>Number.isInteger(x)&&x>=0&&x<=100))
   problems.push({id:entity.id,reason:'INVALID_RATINGS'});
  if(!Array.isArray(entity.relationships)){
   problems.push({id:entity.id,reason:'MISSING_RELATIONSHIPS'});continue;
  }
  if(entity.id.startsWith('H-FICTIONAL-1999-')){
   const year=Number(entity.foalYear);
   const cohort=entity.cohort;
   if(!Number.isInteger(year)||year>1998||
    (cohort==='yearlings'&&year!==1998)||
    (cohort==='twoYearOldProspects'&&year!==1997)||
    (cohort==='threeYearOldRunners'&&year!==1996)||
    (cohort==='fourYearOldRunners'&&year!==1995)||
    (cohort==='fivePlusRunners'&&year>1994))
    problems.push({id:entity.id,reason:'INVALID_FOAL_YEAR'});
   if(entity.sireId===entity.id||entity.damId===entity.id||
    (entity.sireId&&entity.sireId===entity.damId))
    problems.push({id:entity.id,reason:'INVALID_PARENTAGE'});
   if(entity.sireId&&!entity.sireId.startsWith('H-FICTIONAL-1999-STALLIONS-'))
    problems.push({id:entity.id,reason:'INVALID_SIRE_ROLE'});
   if(entity.damId&&!entity.damId.startsWith('H-FICTIONAL-1999-BROODMARES-'))
    problems.push({id:entity.id,reason:'INVALID_DAM_ROLE'});
   if(entity.foalingFarmId&&entity.birthplace?.farmId!==entity.foalingFarmId)
    problems.push({id:entity.id,reason:'BIRTHPLACE_FARM_MISMATCH'});
   if(entity.breederId&&!farms.some(f=>f.id===entity.breederId))
    problems.push({id:entity.id,reason:'INVALID_BREEDER'});
   if(entity.homeTrackId&&!tracks.some(t=>t.id===entity.homeTrackId))
    problems.push({id:entity.id,reason:'INVALID_HOME_TRACK'});
   if(!entity.careFacilityId||!farms.some(f=>f.id===entity.careFacilityId))
    problems.push({id:entity.id,reason:'MISSING_CARE_FACILITY'});
   if(entity.careStaffId&&!/^P-FICTIONAL-1999-(?:FARM-MANAGER|BREEDING-ATTENDANT)-\d{7}$/.test(entity.careStaffId))
    problems.push({id:entity.id,reason:'INVALID_CARE_STAFF'});
   if(entity.trainingBarnId&&(!entity.homeTrackId||
    !farms.some(f=>f.id===entity.trainingBarnId)&&
    !tracks.some(t=>t.id===entity.trainingBarnId)))
    problems.push({id:entity.id,reason:'INVALID_TRAINING_CIRCUIT'});
   if(entity.trainerId&&entity.status!=='RACING'&&
    entity.status!=='TWO_YEAR_OLD_PROSPECT')
    problems.push({id:entity.id,reason:'INACTIVE_HORSE_HAS_TRAINER'});
  }
  for(const edge of entity.relationships){
   if(edge.fromId!==entity.id||!known(edge.toId))
    problems.push({id:entity.id,reason:'BROKEN_REFERENCE',edge});
  }
 }
 return {valid:problems.length===0,problems};
}
