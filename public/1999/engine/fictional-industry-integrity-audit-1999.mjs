/**
 * Full-census, read-only audit for a completed, persisted 1999 world.
 * Unlike the lightweight reopen certificate this inspects EVERY batch and
 * every rated horse, person, organization and initially scheduled race.
 * IndexedDB remains the source of truth; no mutations or result generation.
 */
import {connect1999Horse,rate1999Entity}
 from './fictional-industry-graph-1999.mjs';
import {readPersistent1999IndustryBatch,readPersistent1999Directory}
 from './fictional-industry-persistence-1999.mjs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,scheduledRaceDays1999}
 from '../../next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../../next/1999-condition-book-engine.mjs';

export const INDUSTRY_FULL_INTEGRITY_AUDIT_SCHEMA='WTW_1999_FULL_CENSUS_AUDIT_V1';
const ROLES=new Set(['trainer','jockey','groom','exercise_rider','veterinarian',
 'farrier','farm_manager','breeding_attendant']);
function check(condition,message){if(!condition)throw Error('1999 integrity: '+message)}
function ratings(record,type,seed){
 // Horse ratings include the same deterministic sire/dam adjustment used at
 // genesis. Recompute through the graph constructor so yearling and prospect
 // records are compared against their persisted, pedigree-aware ratings.
 const expected=type==='horse'?
  connect1999Horse(record,{seed}).ratings:rate1999Entity(seed,type,record.id);
 const actual=record.roleRatings?.[type]??record.ratings;
 check(record.ratingsProvenance==='MODELED_1999_UNCALIBRATED',
  record.id+' missing modeled ratings provenance');
 check(actual&&Object.keys(actual).length===Object.keys(expected).length&&
  Object.entries(expected).every(([key,value])=>actual[key]===value),
  record.id+' rating mismatch for '+type);
}
function edge(record,type,toId){
 const matches=record.relationships.filter(e=>e.type===type);
 check(matches.length===(toId?1:0)&&(!toId||
  matches[0].fromId===record.id&&matches[0].toId===toId&&
  matches[0].provenance==='MODELED_1999_OPENING_WORLD'),
  record.id+' bad '+type+' relationship');
}
function dateOnly(date){
 return typeof date==='string'&&/^1999-\d{2}-\d{2}$/.test(date)&&
  !Number.isNaN(Date.parse(date+'T12:00:00Z'))&&
  new Date(date+'T12:00:00Z').toISOString().slice(0,10)===date;
}
const raceStatus=r=>r.status==='SCHEDULED'&&r.winnerId===null&&
 Array.isArray(r.fieldHorseIds)&&r.fieldHorseIds.length===0&&
 !r.results?.length&&!r.entries?.length;
const roleFromId=id=>/^P-FICTIONAL-1999-([A-Z-]+)-\d{7}$/.exec(id)?.[1]
 ?.toLowerCase().replaceAll('-','_')??null;

/** Streaming batch traversal bounds transient record allocations. */
export async function auditPersistent1999World(store,manifest,{expectedHorses=null}={}){
 check(manifest?.status==='COMPLETE','incomplete or missing manifest');
 const seed=manifest.seed;
 if(expectedHorses!==null)check(manifest.horseCount===expectedHorses,
  'selected opening world size mismatch');
 const directory=await readPersistent1999Directory(store,manifest);
 const tracks=new Map(),farms=new Map(),owners=new Map(),allIds=new Set();
 for(const record of directory){
  check(record?.id&&!allIds.has(record.id),'duplicate directory ID '+record?.id);
  allIds.add(record.id);
  check(Array.isArray(record.relationships),'directory relationship list missing '+record.id);
  const roles=new Set(record.operatingRoles||[]);
  if(record.id.startsWith('T-')||roles.has('TRACK')){
   ratings(record,'track',seed);
   tracks.set(record.id,record);
   check(TRACK_PROGRAM_1999[record.id]?.playableIn1999===true&&
    TRACK_PROGRAM_1999[record.id]?.trackOperating==='OPEN_1999',
    'archived/unapproved opening track '+record.id);
  }else{
   const isFarm=roles.has('BREEDING_OR_CARE_FACILITY')||
    record.id.startsWith('O-FICTIONAL-FARM-');
   const isOwner=roles.has('LEGAL_OWNER')||
    record.id.startsWith('O-FICTIONAL-OWNER-');
   check(isFarm||isOwner,'unknown directory entity '+record.id);
   if(isFarm){ratings(record,'farm',seed);farms.set(record.id,record)}
   if(isOwner){ratings(record,'owner',seed);owners.set(record.id,record)}
   const home=record.homeTrackId??record.relationships.find(e=>
    e.type==='REGIONAL_CIRCUIT')?.toId??null;
   check(!!home,'directory missing track locality '+record.id);
   edge(record,'REGIONAL_CIRCUIT',home);
  }
 }
 check(tracks.size===107,'expected 107 active tracks, found '+tracks.size);
 check(farms.size>0&&owners.size>0,'farm/owner directory missing');
 for(const record of [...farms.values(),...owners.values()]){
  const home=record.homeTrackId??record.relationships.find(e=>
   e.type==='REGIONAL_CIRCUIT')?.toId??null;
  check(tracks.has(home),'organization not connected to live track '+record.id);
  check(record.location?.city&&record.location?.region&&record.location?.country,
   'unlocated organization '+record.id);
 }
 const personIds=new Set(),workplaces=new Map(),roleCounts={};
 let people=0;
 for(let i=0;i<manifest.personBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'personBatches',i);
  for(const p of batch){
   check(p?.id&&!personIds.has(p.id),'duplicate personnel ID '+p?.id);
   personIds.add(p.id);people++;
   check(ROLES.has(p.role)&&roleFromId(p.id)===p.role,'wrong personnel role '+p.id);
   roleCounts[p.role]=(roleCounts[p.role]||0)+1;
   check(p.id==='P-FICTIONAL-1999-'+p.role.toUpperCase().replaceAll('_','-')+
    '-'+String(roleCounts[p.role]).padStart(7,'0'),
    'missing personnel ordinal / unexpected personnel order '+p.id);
   ratings(p,p.role,seed);
   check(Array.isArray(p.relationships),'person missing relationships '+p.id);
   edge(p,'WORKS_AT',p.workplaceId);
   const farmRole=p.role==='farm_manager'||p.role==='breeding_attendant';
   check((farmRole?farms:tracks).has(p.workplaceId),
    'invalid personnel workplace '+p.id+' at '+p.workplaceId);
   check(p.name?.trim()&&p.dateOfBirth&&p.birthplace?.city&&
    p.birthplace?.region&&p.birthplace?.countryCode===p.birthCountryCode,
    'unidentified or unlocated person '+p.id);
   workplaces.set(p.id,p.workplaceId);
  }
 }
 check(people===manifest.personCount,'person census mismatch');
 for(const [role,count] of Object.entries(manifest.staffing.counts))
  check(roleCounts[role]===count,'person role census mismatch '+role);
 const horses=new Set(),foundingHorseIds=new Set(manifest.foundingHorseIds||[]),
  foundFoundingHorseIds=new Set(),byCohort={},homeTrackCounts={},horseStatuses={};
 let horseCount=0,connectedRunners=0;
 for(let i=0;i<manifest.horseBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',i);
  for(const h of batch){
   check(h?.id&&!horses.has(h.id),'duplicate horse ID '+h?.id);
   horses.add(h.id);horseCount++;
   const approvedFounder=foundingHorseIds.has(h.id);
   if(approvedFounder)foundFoundingHorseIds.add(h.id);
   else{
    byCohort[h.cohort]=(byCohort[h.cohort]||0)+1;
    check(h.id==='H-FICTIONAL-1999-'+String(h.cohort).toUpperCase()+'-'+
     String(byCohort[h.cohort]).padStart(7,'0'),
     'missing horse ordinal / unexpected horse cohort order '+h.id);
   }
   horseStatuses[h.status]=(horseStatuses[h.status]||0)+1;
   ratings(h,'horse',seed);
   check(h.registryProvenance===(approvedFounder?
    'APPROVED_FOUNDING_1999_SOURCE':'FICTIONAL_1999_DETERMINISTIC_V1'),
    'unprovenanced horse '+h.id);
   check(owners.has(h.ownerId)&&(!h.foalingFarmId||farms.has(h.foalingFarmId)),
    'broken ownership / foaling reference '+h.id);
   if(h.foalingFarmId){
    const farm=farms.get(h.foalingFarmId);
    check(farm&&h.birthplace?.farmId===h.foalingFarmId&&
     h.birthplace?.city===farm.location.city&&
     h.birthplace?.region===farm.location.region&&
     h.birthplace?.country===farm.location.country,
     'foaling location mismatch '+h.id);
   }
   check(Number.isInteger(h.foalYear)&&h.foalYear<=1998&&
    (approvedFounder?!h.dateOfBirth||
     h.dateOfBirth.startsWith(String(h.foalYear)+'-'):
     !!h.dateOfBirth&&h.dateOfBirth.startsWith(String(h.foalYear)+'-')),
    'unborn or invalid dated opening horse '+h.id);
   check(h.status!=='PROJECTED_NOT_YET_BORN',
    'forecast foal incorrectly entered opening horse census');
   check(Array.isArray(h.relationships),'horse relationship list missing '+h.id);
   if(h.sireId)check(approvedFounder?foundingHorseIds.has(h.sireId):
    /^H-FICTIONAL-1999-STALLIONS-\d{7}$/.test(h.sireId)&&
     Number(h.sireId.slice(-7))>=1&&Number(h.sireId.slice(-7))<=manifest.plan.counts.stallions,
    'missing or wrong sire reference '+h.id);
   if(h.damId)check(approvedFounder?foundingHorseIds.has(h.damId):
    /^H-FICTIONAL-1999-BROODMARES-\d{7}$/.test(h.damId)&&
     Number(h.damId.slice(-7))>=1&&Number(h.damId.slice(-7))<=manifest.plan.counts.broodmares,
    'missing or wrong dam reference '+h.id);
   if(h.status==='RACING'||h.status==='TWO_YEAR_OLD_PROSPECT'){
    check(tracks.has(h.homeTrackId),'no live horse home track '+h.id);
    check(h.trainerId&&workplaces.get(h.trainerId)===h.homeTrackId,
     'trainer outside horse circuit '+h.id);
    if(h.status==='RACING')
     check(h.jockeyId&&workplaces.get(h.jockeyId)===h.homeTrackId,
      'jockey outside horse circuit '+h.id);
    connectedRunners++;
    homeTrackCounts[h.homeTrackId]=(homeTrackCounts[h.homeTrackId]||0)+1;
   }else check(!h.trainerId&&!h.jockeyId&&!h.homeTrackId,
    'inactive horse assigned to racing workforce '+h.id);
   if(approvedFounder){
    check(h.foundingSource?.id===h.id&&h.name?.trim(),
     'approved founding horse identity/history changed '+h.id);
   }else check(h.name?.trim()&&h.namingStatus==='PROVISIONAL_EDITABLE_1999_OPENING',
    'unregistered opening horse name '+h.id);
   const expectedEdges=[
    ['OWNED_BY',h.ownerId],['BRED_BY',h.breederId],
    ['FOALED_AT',h.foalingFarmId],['CARED_AT',h.careFacilityId],
    ['CARED_BY',h.careStaffId],['SIRED_BY',h.sireId],['OUT_OF',h.damId],
    ['HOME_TRACK',h.homeTrackId],['TRAINED_AT',h.trainingBarnId],
    ['TRAINED_BY',h.trainerId],['PREFERRED_JOCKEY',h.jockeyId]
   ];
   for(const [type,target] of expectedEdges)edge(h,type,target);
   check(h.relationships.length===expectedEdges.filter(([,target])=>target).length,
    'extra horse relationship '+h.id);
  }
 }
 check(horseCount===manifest.horseCount,'horse census mismatch');
 check(foundFoundingHorseIds.size===foundingHorseIds.size&&
  [...foundingHorseIds].every(id=>foundFoundingHorseIds.has(id)),
  'approved founding horse IDs missing from the opening registry');
 for(const [cohort,count] of Object.entries(manifest.plan.counts)){
  if(cohort==='annualFoals')continue;
  check(byCohort[cohort]===count,'horse cohort mismatch '+cohort);
 }
 for(const id of tracks.keys()){
  check(homeTrackCounts[id]>0,'operating course has no assigned runners '+id);
  check([...workplaces.values()].includes(id),
   'operating course has no workers '+id);
 }
 let coverings=0;
 const coveringIds=new Set();
 for(let i=0;i<manifest.coveringBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'coveringBatches',i);
  for(const c of batch){
   check(c?.id&&!coveringIds.has(c.id),'duplicate covering ID '+c?.id);
   coveringIds.add(c.id);coverings++;
   check(horses.has(c.mareId)&&horses.has(c.stallionId)&&
    c.status==='COVERING_BOOKED'&&c.liveFoalId===null,
    'invalid unbirthed covering '+c.id);
  }
 }
 check(coverings===manifest.coveringCount,'covering census mismatch');
 const cards=new Set(),races=new Set(),daysByTrack={};
 const trackOrder=new Map([...tracks.keys()].map((id,i)=>[id,i]));
 let scheduled=0,cardCount=0;
 for(let i=0;i<manifest.calendarBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'calendarBatches',i);
  for(const card of batch){
   check(card?.id&&!cards.has(card.id),'duplicate card ID '+card?.id);
   cards.add(card.id);cardCount++;
   check(tracks.has(card.trackId)&&dateOnly(card.date)&&
    trackMeetOpen1999(card.trackId,card.date),
    'race card outside active meet '+card.id);
   check(card.id==='CARD-'+card.trackId+'-'+card.date,
    'card ID mismatch '+card.id);
   daysByTrack[card.trackId]=(daysByTrack[card.trackId]||0)+1;
   check(Array.isArray(card.races)&&card.races.length>0,
    'empty scheduled card '+card.id);
   const book=buildConditionBook1999({date:card.date,
    track:tracks.get(card.trackId),trackIndex:trackOrder.get(card.trackId),
    seed,sourceStakes:[],includeKnownStakes:false});
   check(book.length===card.races.length,'condition book length drift '+card.id);
   for(const [idx,r] of card.races.entries()){
    const expected=book[idx];
    check(r.id===expected.id&&r.condition===expected.conditions&&
     r.age===expected.ageRequirement&&r.sex===expected.sexRestriction&&
     r.surface===expected.surface&&
     r.distance_furlongs===expected.distanceFurlongs&&
     r.fieldCapacity===expected.fieldCapacity&&
     r.purse_minor===Math.round(expected.purse*100),
     'condition book content drift '+r.id);
    check(r.id&&!races.has(r.id),'duplicate race ID '+r.id);
    races.add(r.id);scheduled++;
    check(r.raceNumber===idx+1&&raceStatus(r)&&
     Number.isSafeInteger(r.purse_minor)&&r.purse_minor>0&&
     r.fieldCapacity>=8&&r.fieldCapacity<=14&&
     (r.surface==='DIRT'||r.surface==='TURF')&&
     TRACK_PROGRAM_1999[card.trackId].surfaces.includes(
      r.surface==='DIRT'?'Dirt':'Turf'),
     'invalid or prematurely run race '+r.id);
   }
  }
 }
 for(const id of tracks.keys())
  check(daysByTrack[id]===scheduledRaceDays1999(id),
   'race calendar missed a meet day at '+id);
 check(cardCount===manifest.scheduledCards&&scheduled===manifest.scheduledRaces,
  'scheduled card/race census mismatch');
 return {schema:INDUSTRY_FULL_INTEGRITY_AUDIT_SCHEMA,seed,
  worldId:manifest.worldId,openingHorses:horseCount,personnel:people,
  owners:owners.size,farms:farms.size,activeTracks:tracks.size,
  connectedRunners,coverings,scheduledCards:cardCount,scheduledRaces:scheduled,
  horseCohorts:byCohort,horseStatuses,
  check:'PASS',forecastFoalsExcluded:true,unopenedCards:true};
}
