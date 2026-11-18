/**
 * WIRE TO WIRE — full persisted industry, 90-day circuit readiness census.
 *
 * Inspects every original horse, professional, owner, farm and the source
 * condition-book calendar across all 107 active courses for 90 consecutive
 * calendar days. This is NOT a second race simulation or a 30-horse gameplay
 * career: the immutable opening-world records are read directly from IndexedDB.
 *
 * IMPORTANT: 1999 source cards still contain scheduling opportunities, not
 * live race entries, jockey bookings, travel movements, fees or settled races.
 * A passing result certifies full-world *operational coverage and readiness*,
 * NEVER that 300k/325k horses have completed 90 days in the gameplay kernel.
 * Live progression is independently required before release.
 */
import {readPersistent1999Directory,readPersistent1999IndustryBatch}
 from './fictional-industry-persistence-1999.mjs';
import {trackMeetOpen1999,trackPhysicalVenueId1999}
 from '../../next/1999-track-program.mjs';
import {modeledShippingRoute} from '../game/shipping-1999.js';

export const FULL_WORLD_CIRCUIT_90_DAY_SCHEMA='WTW_FULL_WORLD_CIRCUIT_90_DAY_READINESS_V1';
const DAY=86400000;
function requireValue(ok,message){if(!ok)throw Error('Full-world 90-day circuit: '+message)}
const at=offset=>new Date(Date.UTC(1999,0,1)+offset*DAY).toISOString().slice(0,10);
const add=(map,key,amount=1)=>map.set(key,(map.get(key)||0)+amount);
const pair=(map,key)=>map.get(key)||0;

/**
 * Fixed 1999-01-02 to 1999-04-01 inclusive; the initial date is 1999-01-01.
 * Counts ALL opening horses rather than choosing a pilot owner or any sample.
 */
export async function auditFullWorld1999NinetyDayCircuit(store,manifest,{
 expectedHorses=null
}={}){
 requireValue(manifest?.status==='COMPLETE','a completed persisted world is required');
 const dates=Array.from({length:90},(_,i)=>at(i+1));
 const dateSet=new Set(dates),end=at(90);
 const directory=await readPersistent1999Directory(store,manifest);
 const tracks=new Map(directory.filter(x=>/^T-\d{4}$/.test(x.id)||
  x.operatingRoles?.includes('TRACK')).map(t=>[t.id,t]));
 const owners=new Set(directory.filter(x=>x.operatingRoles?.includes('LEGAL_OWNER')).
  map(o=>o.id));
 const farms=new Set(directory.filter(x=>x.operatingRoles?.includes('BREEDING_OR_CARE_FACILITY')).
  map(f=>f.id));
 requireValue(tracks.size===107,'missing an active 1999 racecourse');
 requireValue(owners.size>0&&farms.size>0,'missing operating organizations');
 const staff=new Map(),staffById=new Map(),personByTrackRole=new Map();
 let people=0;
 for(let i=0;i<manifest.personBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'personBatches',i);
  for(const p of batch){
   requireValue(p?.id&&!staffById.has(p.id),'duplicate person '+p?.id);
   requireValue(p.workplaceId&&p.role&&p.ratings,'unplaced or unrated person '+p.id);
   const validWorkplace=tracks.has(p.workplaceId)||farms.has(p.workplaceId);
   requireValue(validWorkplace,'person employed outside current world '+p.id);
   staffById.set(p.id,{role:p.role,workplaceId:p.workplaceId});
   add(staff,p.role);
   if(tracks.has(p.workplaceId))add(personByTrackRole,p.workplaceId+'|'+p.role);
   people++;
  }
 }
 requireValue(people===manifest.personCount,'full personnel count changed');
 // Source-demographic eligibility is not race-day fitness or entry permission.
 const demographicByTrack=new Map();
 const horseIds=new Set(),foundingHorseIds=new Set(manifest.foundingHorseIds||[]),
  byTrack=new Map(),racingByTrack=new Map(),
  prospectsByTrack=new Map(),cohorts=new Map(),status=new Map();
 let allHorses=0,racing=0,prospects=0;
 for(let i=0;i<manifest.horseBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',i);
  for(const h of batch){
   requireValue(h?.id&&!horseIds.has(h.id),'duplicate horse '+h?.id);
   horseIds.add(h.id);allHorses++;
   const approvedFounder=foundingHorseIds.has(h.id);
   requireValue(owners.has(h.ownerId)&&(!h.foalingFarmId||farms.has(h.foalingFarmId)),
    'invalid owner or foaling site '+h.id);
   requireValue(h.ratings&&h.name&&h.foalYear<1999&&
    (approvedFounder?!h.dateOfBirth||h.dateOfBirth.startsWith(String(h.foalYear)+'-'):
     !!h.dateOfBirth&&h.dateOfBirth.startsWith(String(h.foalYear)+'-')),
    'missing dated registered horse/ratings '+h.id);
   requireValue(h.status!=='PROJECTED_NOT_YET_BORN',
    'unborn foal counted as a live opening horse '+h.id);
   add(cohorts,h.cohort);add(status,h.status);
   if(h.status==='RACING'||h.status==='TWO_YEAR_OLD_PROSPECT'){
    requireValue(tracks.has(h.homeTrackId),'unlocated active or prospective runner '+h.id);
    requireValue(staffById.get(h.trainerId)?.workplaceId===h.homeTrackId&&
     staffById.get(h.trainerId)?.role==='trainer',
     'trainer at another circuit '+h.id);
    if(h.status==='RACING'){
     requireValue(staffById.get(h.jockeyId)?.workplaceId===h.homeTrackId&&
      staffById.get(h.jockeyId)?.role==='jockey',
      'jockey at another circuit '+h.id);
     racing++;add(racingByTrack,h.homeTrackId);
     add(demographicByTrack,
      h.homeTrackId+'|RACING|'+(1999-h.foalYear)+'|'+h.sex);
    }else{
     prospects++;add(prospectsByTrack,h.homeTrackId);
     add(demographicByTrack,
      h.homeTrackId+'|TWO_YEAR_OLD_PROSPECT|'+(1999-h.foalYear)+'|'+h.sex);
    }
    add(byTrack,h.homeTrackId);
   }
  }
 }
 requireValue(allHorses===manifest.horseCount,'opening population differs from manifest');
 if(expectedHorses!==null)
  requireValue(allHorses===expectedHorses,'user-selected horse count changed');
 for(const [cohort,count] of Object.entries(manifest.plan.counts))
  if(cohort!=='annualFoals')
   requireValue(pair(cohorts,cohort)===count,'cohort mismatch '+cohort);
 for(const id of tracks.keys())
  requireValue(pair(byTrack,id)>0&&
   pair(personByTrackRole,id+'|trainer')>0&&
   pair(personByTrackRole,id+'|jockey')>0,
   'missing on-track runners or professionals '+id);

 // Covering reservations are part of the existing full industry, but are
 // never evidence that a forecast 1999 foal has already been born.
 let coverings=0;
 const coveringIds=new Set();
 for(let i=0;i<manifest.coveringBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'coveringBatches',i);
  for(const c of batch){
   requireValue(c?.id&&!coveringIds.has(c.id),'duplicate covering '+c?.id);
   coveringIds.add(c.id);coverings++;
   requireValue(horseIds.has(c.mareId)&&horseIds.has(c.stallionId)&&
    c.status==='COVERING_BOOKED'&&c.liveFoalId===null,
    'phantom birth or invalid booked parentage '+c.id);
  }
 }
 requireValue(coverings===manifest.coveringCount,
  'breeding-book count differs from persisted census');

 const summaries=dates.map(date=>({date,tracks:0,cards:0,races:0,
  fieldCapacity:0,purseMinor:0}));
 const byDate=new Map(summaries.map(x=>[x.date,x]));
 // Opening-resident resources are measured against each track's calendar.
 // This is source-only local capacity: an away jockey can potentially travel,
 // but is NOT considered present without a canonical booking and itinerary.
 const localLoad=new Map([...tracks.keys()].map(id=>[id,{
  trackId:id,openingRacingHorses:0,openingTwoYearOldProspects:0,
  residentTrainers:pair(personByTrackRole,id+'|trainer'),
  residentJockeys:pair(personByTrackRole,id+'|jockey'),
  quarterCards:0,quarterRaces:0,declaredFieldSlots:0,
  maximumSingleRaceFieldCapacity:0,
  raceDaysWithCards:0,minStartSlotsForRaceSettlement:0
 }]));
 for(const id of tracks.keys()){
  const row=localLoad.get(id);
  row.openingRacingHorses=pair(racingByTrack,id);
  row.openingTwoYearOldProspects=pair(prospectsByTrack,id);
 }
 // Full-census age/sex upper bounds; 2YO prospects are NOT assumed ready.
 const raceClassCounts=new Map(),demographicGaps=[];
 let ageSexInsufficientRaces=0,matureAgeSexInsufficientRaces=0,
  juvenileAgeSexInsufficientRaces=0,unmodeledClassRaces=0;
 const residentDemographics=[...demographicByTrack.entries()].map(([key,count])=>{
  const [trackId,status,age,sex]=key.split('|');
  return {trackId,status,age:Number(age),sex,count};
 });
 const candidates=(trackId,race)=>{
  requireValue(['2YO','3YO','3YO+','4YO+'].includes(race.age),
   'unknown modeled race age restriction '+race.id+' '+race.age);
  requireValue(['OPEN','FILLIES_AND_MARES'].includes(race.sex),
   'unknown modeled race sex restriction '+race.id+' '+race.sex);
  const eligible=residentDemographics.filter(d=>
   d.trackId===trackId&&
   (race.age==='2YO'?d.age===2:race.age==='3YO'?d.age===3:
    race.age==='4YO+'?d.age>=4:d.age>=3)&&
   (race.sex==='OPEN'||['FILLY','MARE'].includes(d.sex)));
  return {
   currentRacing:eligible.filter(d=>d.status==='RACING').
    reduce((n,d)=>n+d.count,0),
   undevelopedProspects:eligible.filter(d=>
    d.status==='TWO_YEAR_OLD_PROSPECT').reduce((n,d)=>n+d.count,0)
  };
 };
 const datesByTrack=new Map(),observedCards=new Set(),observedRaces=new Set();
 const trackDates=new Map([...tracks.keys()].map(id=>[id,[]]));
 const physicalVenues=new Map();
 let allCards=0,allRaces=0,windowCards=0,windowRaces=0;
 for(let i=0;i<manifest.calendarBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'calendarBatches',i);
  for(const c of batch){
   requireValue(c?.id&&!observedCards.has(c.id),'duplicate race card '+c?.id);
   observedCards.add(c.id);allCards++;
   requireValue(tracks.has(c.trackId)&&trackMeetOpen1999(c.trackId,c.date),
    'card outside meet '+c.id);
   requireValue(Array.isArray(c.races)&&c.races.length>0,
    'empty condition book '+c.id);
   allRaces+=c.races.length;
   if(!dateSet.has(c.date))continue;
   const day=byDate.get(c.date);
   const venue=trackPhysicalVenueId1999(c.trackId);
   const venueKey=c.date+'|'+venue;
   requireValue(!physicalVenues.has(venueKey),
    'two race meets scheduled simultaneously at one physical venue: '+
     c.trackId+' and '+physicalVenues.get(venueKey));
   physicalVenues.set(venueKey,c.trackId);
   const trackDay=c.trackId+'|'+c.date;
   requireValue(!datesByTrack.has(trackDay),'duplicate track/racing date '+trackDay);
   datesByTrack.set(trackDay,true);
   trackDates.get(c.trackId).push(c.date);
   requireValue(pair(byTrack,c.trackId)>0,'no runners at card '+c.id);
   requireValue(pair(personByTrackRole,c.trackId+'|trainer')>0&&
    pair(personByTrackRole,c.trackId+'|jockey')>0,
    'unworkable track personnel coverage for '+c.id);
   day.tracks++;day.cards++;windowCards++;
   const load=localLoad.get(c.trackId);
   load.quarterCards++;load.raceDaysWithCards++;
   for(const r of c.races){
    requireValue(r?.id&&!observedRaces.has(r.id),'duplicate race '+r?.id);
    observedRaces.add(r.id);
    requireValue(r.status==='SCHEDULED'&&r.winnerId===null&&
     Array.isArray(r.fieldHorseIds)&&r.fieldHorseIds.length===0,
     'invented race entry or result '+r.id);
    requireValue(Number.isSafeInteger(r.purse_minor)&&r.purse_minor>0&&
     Number.isSafeInteger(r.fieldCapacity)&&r.fieldCapacity>0,
     'invalid condition-book finances or capacity '+r.id);
    day.races++;windowRaces++;
    load.quarterRaces++;load.declaredFieldSlots+=r.fieldCapacity;
    load.maximumSingleRaceFieldCapacity=Math.max(
     load.maximumSingleRaceFieldCapacity,r.fieldCapacity);
    load.minStartSlotsForRaceSettlement+=2;
    add(raceClassCounts,r.condition);
    // Claiming, Starter, Handicap etc. lack completed canonical entry rules.
    if(!['Maiden Special Weight','Allowance'].includes(r.condition))
     unmodeledClassRaces++;
    const pool=candidates(c.trackId,r);
    if(pool.currentRacing<2){
     ageSexInsufficientRaces++;
     if(r.age==='2YO')juvenileAgeSexInsufficientRaces++;
     else matureAgeSexInsufficientRaces++;
     if(demographicGaps.length<100)demographicGaps.push({
      raceId:r.id,trackId:c.trackId,date:c.date,
      age:r.age,sex:r.sex,condition:r.condition,
      openingResidentEligibleRacing:pool.currentRacing,
      openingPotentialButUntrainedProspects:pool.undevelopedProspects
     });
    }
    day.purseMinor+=r.purse_minor;
    day.fieldCapacity+=r.fieldCapacity;
   }
  }
 }
 requireValue(allCards===manifest.scheduledCards&&allRaces===manifest.scheduledRaces,
  'annual source racing calendar no longer matches stored manifest');
 requireValue(windowRaces>0&&windowCards>0,'90-day racing circuit has no races');
 // The saved industry has physical track locations and actual meet dates.
 // Verify potential date-respecting routes, without creating a shipment,
 // a jockey booking, a boarding invoice or any fabricated race result.
 const routeBands=new Map(),routeReasons=new Map();
 const trackSites=new Map([...tracks.values()].map(t=>[t.id,{
  id:t.id,location:{city:t.location?.city,
   state:t.location?.region,country:t.location?.country}
 }]));
 for(const days of trackDates.values())days.sort();
 let consideredPairs=0,sharedVenuePairs=0,supportedPairs=0;
 let unsupportedPairs=0,routeFeasiblePairs=0,noDateConnectionPairs=0;
 const visitedTracks=new Set();
 for(const from of tracks.keys()){
  for(const to of tracks.keys()){
   if(from===to)continue;
   if(trackPhysicalVenueId1999(from)===trackPhysicalVenueId1999(to)){
    sharedVenuePairs++;continue;
   }
   consideredPairs++;
   const outward=modeledShippingRoute(trackSites.get(from),trackSites.get(to));
   const reverse=modeledShippingRoute(trackSites.get(to),trackSites.get(from));
   requireValue(outward.supported===reverse.supported,
    'asymmetric shipping support '+from+' to '+to);
   if(!outward.supported){
    unsupportedPairs++;
    add(routeReasons,outward.reason||'UNSUPPORTED');
    continue;
   }
   requireValue(outward.band===reverse.band&&outward.days===reverse.days&&
    outward.cost_minor===reverse.cost_minor&&
    Number.isSafeInteger(outward.cost_minor)&&outward.cost_minor>0&&
    Number.isInteger(outward.days)&&outward.days>=1,
    'incorrect route symmetry, cost, or duration '+from+' to '+to);
   requireValue(!('miles' in outward),
    'model fabricated measured physical road miles '+from+' to '+to);
   supportedPairs++;
   add(routeBands,outward.band);
   const fromDates=trackDates.get(from),toDates=trackDates.get(to);
   // The 2 extra days are arrival recovery before the next opportunity.
   const arrivalWindow=(outward.days+2)*DAY;
   const possible=fromDates.some(date=>{
    const departure=Date.parse(date+'T12:00:00Z');
    return toDates.some(next=>
     Date.parse(next+'T12:00:00Z')-departure>=arrivalWindow);
   });
   if(possible){
    routeFeasiblePairs++;
    visitedTracks.add(from);visitedTracks.add(to);
   }else noDateConnectionPairs++;
  }
 }
 requireValue(consideredPairs+sharedVenuePairs===tracks.size*(tracks.size-1),
  'route matrix did not visit every ordered track pair');
 requireValue(supportedPairs+unsupportedPairs===consideredPairs,
  'route matrix lost a supported or unsupported pair');
 requireValue(routeFeasiblePairs>0,
  'no cross-track meet opportunities available in 90 days');
 const sourceShippingReadiness={
  meaning:'POTENTIAL_TRACK_TO_TRACK_MEET_WINDOWS_NOT_ACTUAL_HORSE_OR_JOCKEY_SHIPMENTS',
  requiresTwoArrivalRecoveryDays:true,geographicOrderedPairs:consideredPairs,
  sharedPhysicalVenueOrderedPairs:sharedVenuePairs,
  modeledDomesticRoadPairs:supportedPairs,unsupportedGeographyPairs:unsupportedPairs,
  pairsWithMeetDateAfterModeledTravelAndRecovery:routeFeasiblePairs,
  pairsWithoutAnInWindowMeetDateAfterTravel:noDateConnectionPairs,
  tracksConnectedByAtLeastOnePossibleMeetTransfer:visitedTracks.size,
  modeledHaulingBands:Object.fromEntries(routeBands),
  unsupportedGeographyReasons:Object.fromEntries(routeReasons),
  actualShipments:0,actualShippingChargesMinor:0
 };
 const trackLoad=[...localLoad.values()].sort((a,b)=>a.trackId.localeCompare(b.trackId));
 const localJockeyShortages=trackLoad.filter(t=>t.quarterCards>0&&
  t.residentJockeys<2);
 const minimumLocalJockeys=Math.min(...trackLoad.filter(t=>t.quarterCards>0).
  map(t=>t.residentJockeys));
 // The canonical raceEligibility currently requires at least 12 days
 // between results. Assume an unrealistically favorable 8 starts/horse
 // in these 90 days, with no illness, scratches, class/sex restrictions,
 // same-date conflicts or missed meets. This is an UPPER BOUND only.
 // A track below the two-runner floor must receive away runners or
 // leave some source races unfilled; we must never invent those runners.
 const minimumHorseCampaignSpacingDays=12;
 const optimisticMaxStartsPerLocalRunner=
  1+Math.floor((dates.length-1)/minimumHorseCampaignSpacingDays);
 const localHorseDeficits=trackLoad.filter(t=>t.quarterRaces>0&&
  t.minStartSlotsForRaceSettlement>
  t.openingRacingHorses*optimisticMaxStartsPerLocalRunner);
 const raceClassCoverage={
  sourceScheduledRaces:windowRaces,
  classCounts:Object.fromEntries(raceClassCounts),
  classesWithoutFullyModeledOpeningEntryRules:unmodeledClassRaces,
  classesPotentiallySupportedAtCanonicalGameLevel:
   windowRaces-unmodeledClassRaces,
  notAClaimOfPlayableRaces:true,
  restrictionsChecked:'OPENING_RESIDENT_AGE_AND_SEX_UPPER_BOUND_ONLY',
  racesWithFewerThanTwoDemographicallyMatchingActiveLocalRunners:
   ageSexInsufficientRaces,
  twoYearOldSourceRacesWithoutTwoActiveLocalRunners:
   juvenileAgeSexInsufficientRaces,
  olderHorseSourceRacesWithoutTwoMatchingActiveLocalRunners:
   matureAgeSexInsufficientRaces,
  firstDemographicGaps:demographicGaps,
  raceDayFitnessWinsFundsTravelAndEntriesNotModeled:true
 };
 const tracksShortOfOneFullFieldOfDistinctJockeys=trackLoad.filter(t=>
  t.quarterCards>0&&t.residentJockeys<t.maximumSingleRaceFieldCapacity);
 const sourceCapacity={
  rule:'SOURCE_LOCAL_RESIDENT_CAPACITY_ONLY_NO_CROSS_TRACK_JOCKEY_TRAVEL',
  maximumSingleRaceUsesDistinctJockeys_NotRacesTimesFieldSize:true,
  tracksShortOfOneFullFieldOfDistinctJockeys:
   tracksShortOfOneFullFieldOfDistinctJockeys.length,
  deficitTracksForFullField:tracksShortOfOneFullFieldOfDistinctJockeys.map(t=>({
   trackId:t.trackId,localJockeys:t.residentJockeys,
   largestSingleField:t.maximumSingleRaceFieldCapacity,
   sourceCards:t.quarterCards
  })),
  twoRunnersPerRaceIsMinimumNotFullField:true,
  canonicalMinimumDaysBetweenRaceStarts:minimumHorseCampaignSpacingDays,
  optimisticMaxStartsPerLocalRunnerIn90Days:optimisticMaxStartsPerLocalRunner,
  tracksNeedingGuestRunnersToFillAllRaces:localHorseDeficits.length,
  sourceRacesAtThoseTracks:localHorseDeficits.reduce((n,t)=>n+t.quarterRaces,0),
  theoreticalLocalStartsAtThoseTracks:localHorseDeficits.reduce((n,t)=>
   n+t.openingRacingHorses*optimisticMaxStartsPerLocalRunner,0),
  minimumRequiredStartsAtThoseTracks:localHorseDeficits.reduce((n,t)=>
   n+t.minStartSlotsForRaceSettlement,0),
  localHorseDeficits:localHorseDeficits.map(t=>({
   trackId:t.trackId,quarterRaces:t.quarterRaces,
   openingRacingHorses:t.openingRacingHorses,
   minimumRequiredStarts:t.minStartSlotsForRaceSettlement,
   optimisticMaximumLocalStarts:t.openingRacingHorses*optimisticMaxStartsPerLocalRunner
  })),

  minimumDifferentJockeysPerSettledRace:2,
  tracksWithScheduledCards:trackLoad.filter(t=>t.quarterCards>0).length,
  openingResidentRacingHorses:trackLoad.reduce((n,t)=>n+t.openingRacingHorses,0),
  openingResidentTwoYearOldProspects:trackLoad.reduce((n,t)=>n+t.openingTwoYearOldProspects,0),
  openingResidentJockeys:trackLoad.reduce((n,t)=>n+t.residentJockeys,0),
  openingResidentTrainers:trackLoad.reduce((n,t)=>n+t.residentTrainers,0),
  minimumBookedMountsIfEveryScheduledRaceActuallyRuns:windowRaces*2,
  declaredFieldSlots:trackLoad.reduce((n,t)=>n+t.declaredFieldSlots,0),
  trackByTrack:trackLoad,
  minimumResidentJockeysAtScheduledTracks:minimumLocalJockeys,
  tracksWithFewerThanTwoResidentJockeys:localJockeyShortages.length,
  cardsAtThoseTracks:localJockeyShortages.reduce((n,t)=>n+t.quarterCards,0),
  racesAtThoseTracks:localJockeyShortages.reduce((n,t)=>n+t.quarterRaces,0),
  residentJockeysAreNotGuaranteedAvailableForEveryRace:true,
  sourceCalendarIsNotGuaranteedToBeRunInFull:true,
  localDeficits:localJockeyShortages.map(t=>({
   trackId:t.trackId,jockeys:t.residentJockeys,scheduledCards:t.quarterCards,
   scheduledRaces:t.quarterRaces
  }))
 };
 const checkpoints=[30,60,90].map(n=>{
  const block=summaries.slice(n-30,n);
  return {gameDate:block.at(-1).date,elapsedDays:n,
   racingDays:block.filter(x=>x.cards>0).length,
   trackCards:block.reduce((x,d)=>x+d.cards,0),
   scheduledRaces:block.reduce((x,d)=>x+d.races,0),
   totalDeclaredFieldSlots:block.reduce((x,d)=>x+d.fieldCapacity,0),
   scheduledPursesMinor:block.reduce((x,d)=>x+d.purseMinor,0)};
 });
 // These are full-population, full-calendar coverage checks. The current
 // persistent career adapter activates only the selected owner's first 30
 // horses in the kernel. Never conflate these results with live race progress.
 return {schema:FULL_WORLD_CIRCUIT_90_DAY_SCHEMA,worldId:manifest.worldId,
  seed:manifest.seed,openingHorses:allHorses,openingPeople:people,
  openingOwners:owners.size,openingFarms:farms.size,tracks:tracks.size,
  bookedUnbirthedCoverings:coverings,
  activeRacingHorses:racing,twoYearOldProspects:prospects,
  cohortCounts:Object.fromEntries(cohorts),statusCounts:Object.fromEntries(status),
  period:{start:dates[0],end,days:90,trackCards:windowCards,
   scheduledRaces:windowRaces,checkpoints},
  sourceCapacity,sourceShippingReadiness,raceClassCoverage,
  countsCovered:{horses:horseIds.size,people:staffById.size,
   breedingCoverings:coveringIds.size,
   calendarCards:allCards,calendarRaces:allRaces},
  verified:'FULL_WORLD_READ_ONLY_CIRCUIT_SCHEDULE_AND_WORKFORCE',
  liveGameDaysSimulated:0,liveRacesSettled:0,
  cannotCertifyYet:['FULL_POPULATION_KERNEL_ACTIVATION',
   '90_DAY_REAL_HORSE_AND_PERSON_MOVEMENT',
   'LIVE_RACE_ENTRIES_AND_SETTLEMENT',
   'WORLD_WIDE_FINANCIAL_LEDGER'],
  check:'PASS_READ_ONLY_NOT_GAMEPLAY_CERTIFICATION'};
}
