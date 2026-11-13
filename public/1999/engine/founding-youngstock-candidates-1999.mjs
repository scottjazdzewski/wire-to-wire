/**
 * WTW founding-world pre-1999 yearling / juvenile CANDIDATES.
 *
 * This is a read-only proposal generator for a new-fiction 1999 starting
 * world. It is NOT a 1997/1998 historical breeding certification, a live
 * foal registry, an owner transaction, a named-horse registrar or an engine
 * release. Only existing founding broodmares and standing stallions can be
 * proposed as parents, by exact immutable IDs.
 */
export const FOUNDING_YOUNGSTOCK_CANDIDATE_SCHEMA =
 'WTW_FOUNDING_1999_NEW_YOUNGSTOCK_CANDIDATES_V1';
const norm=x=>String(x??'').trim();
function hash(seed,value){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(value)){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}
 return (h^(h>>>16))>>>0;
}
function residence(h){
 return h.standingFarm1999||h.boardingFarm1999||null;
}
export function proposeFoundingYoungstock1999({
 seed=19990101,mares=[],stallions=[],organizations=[]
}={}){
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid founding yearling seed');
 if(!mares.length||!stallions.length)throw Error('Known founding sire and dam references required');
 const organizationIds=new Set(organizations.map(x=>x.id));
 const parentIds=new Set();
 for(const p of [...mares,...stallions]){
  if(!norm(p?.id)||!norm(p?.name)||!Number.isInteger(p.foalYear))
   throw Error('Parent must have exact historical ID, name, and foaling year');
  if(parentIds.has(p.id))throw Error('Duplicate founding parent ID '+p.id);
  parentIds.add(p.id);
 }
 const result=[];
 for(const birthYear of [1997,1998]){
  const usedMares=new Set();
  for(const mare of [...mares].sort((a,b)=>a.id.localeCompare(b.id))){
   // About 78% of mares per year form a preliminary non-registered cohort.
   // This percentage is deliberately a test fixture, not a historic live-foal rate.
   if(hash(seed,'select:'+birthYear+':'+mare.id)%100>=78)continue;
   if(mare.foalYear>birthYear-4)continue;
   if(usedMares.has(mare.id))throw Error('Mare has two foals in one year');
   const candidateSires=stallions.filter(s=>s.foalYear<=birthYear-5);
   if(!candidateSires.length)continue;
   const mareFarm=residence(mare);
   const local=candidateSires.filter(s=>{
    const f=residence(s);
    return f?.region&&mareFarm?.region&&f.region===mareFarm.region;
   });
   const candidates=local.length&&hash(seed,mare.id+':'+birthYear+':local')%100<85?
    local:candidateSires;
   const sire=candidates[hash(seed,'sire:'+mare.id+':'+birthYear)%candidates.length];
   const sex=hash(seed,'sex:'+mare.id+':'+birthYear)%2===0?'COLT':'FILLY';
   const fam=mareFarm?.farmOrganizationId||null;
   if(fam&&!organizationIds.has(fam))throw Error('Mare references excluded organization '+fam);
   const id='H-FNEW-'+birthYear+'-'+String(result.length+1).padStart(4,'0');
   const age=1999-birthYear;
   result.push({
    id,
    foalYear:birthYear,
    ageAtOpening:age,
    sex,
    sireId:sire.id,
    damId:mare.id,
    sireName:sire.name,
    damName:mare.name,
    registeredName:null,
    registrationStatus:'UNNAMED_NO_REGISTRATION_EVENT',
    displayLabel:birthYear+' '+(sex==='COLT'?'colt':'filly')+' out of '+mare.name+' by '+sire.name,
    foalingFarmId:null,
    foalingLocation:null,
    candidateFarmReferenceId:fam,
    candidateFarmReferenceName:mareFarm?.farmName||null,
    candidateFarmReferenceBasis:'1999_MARE_RESIDENCE__NOT_PROOF_OF_FOALING_SITE_IN_'+birthYear,
    breederOrganizationId:null,
    racingOwnerOrganizationId:null,
    racingTrainerId:null,
    racingBarnId:null,
    annualFoalingOutcomeStatus:'FICTIONAL_PRESTART_STORY_PROPOSED_NOT_COMMITTED',
    pedigreeStatus:'EXACT_SOURCE_PARENTS__MATING_NOT_HISTORICALLY_CERTIFIED',
    canonical:false,
    eligibleForRacing:false,
    eligibleForSales:false,
    ownerAndFoalingResidenceStatus:'NEEDS_ORIGINAL_1999_SCENARIO_AUTHORING',
    lifeStage:age===1?'YEARLING':'TWO_YEAR_OLD_UNREGISTERED',
    status:'READ_ONLY_NEW_FOUNDING_CANDIDATE_NOT_GAME_HORSE',
    source:FOUNDING_YOUNGSTOCK_CANDIDATE_SCHEMA
   });
   usedMares.add(mare.id);
  }
 }
 const list=Object.freeze(result.map(Object.freeze));
 const yearCounts=Object.fromEntries([1997,1998].map(y=>[y,list.filter(h=>h.foalYear===y).length]));
 return Object.freeze({
  schema:FOUNDING_YOUNGSTOCK_CANDIDATE_SCHEMA,
  status:'RESEARCH_PROPOSAL_NOT_ACTIVE_GAME_STATE',
  startDate:'1999-01-01',yearCounts,
  horses:list,
  audit:Object.freeze({
   namedCount:0,liveGameEntriesCreated:0,ownerTransactionsCreated:0,
   farmTransfersCreated:0,recordedHistoricalFoalsImported:0,
   candidateCount:list.length,distinctIds:new Set(list.map(x=>x.id)).size,
   uniqueMaresPerYear:list.every(h=>list.filter(x=>x.damId===h.damId&&x.foalYear===h.foalYear).length===1),
   sourceSireDamIdsOnly:true,
   foalingFarmNotInferredFrom1999Residence:true,
   officialRegistrationRequiredBeforeRacing:true
  })
 });
}
