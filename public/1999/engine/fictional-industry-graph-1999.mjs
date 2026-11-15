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
 tracks=[],farms=[],owners=[]}={}){
 if(!horse?.id||!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid horse graph input');
 const id=horse.id,edges=[];
 const add=(type,target)=>{if(target)edges.push(relationship1999(type,id,target))};
 add('OWNED_BY',horse.ownerId);
 add('FOALED_AT',horse.foalingFarmId);
 add('SIRED_BY',horse.sireId);
 add('OUT_OF',horse.damId);
 add('HOME_TRACK',horse.homeTrackId);
 const active=horse.status==='RACING'||horse.status==='TWO_YEAR_OLD_PROSPECT';
 const trainerId=active&&trainerCount?
  'P-FICTIONAL-1999-TRAINER-'+String(1+hash(seed,id+':trainer')%trainerCount).padStart(7,'0'):null;
 const jockeyId=horse.status==='RACING'&&jockeyCount?
  'P-FICTIONAL-1999-JOCKEY-'+String(1+hash(seed,id+':jockey')%jockeyCount).padStart(7,'0'):null;
 add('TRAINED_BY',trainerId);
 add('PREFERRED_JOCKEY',jockeyId);
 return {...horse,trainerId,jockeyId,
  ratings:rate1999Entity(seed,'horse',id),
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
