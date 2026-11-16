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

export const FULL_WORLD_CIRCUIT_90_DAY_SCHEMA='WTW_FULL_WORLD_CIRCUIT_90_DAY_READINESS_V1';
const DAY=86400000;
function requireValue(ok,message){if(!ok)throw Error('Full-world 90-day circuit: '+message)}
const at=offset=>new Date(Date.UTC(1999,0,1)+offset*DAY).toISOString().slice(0,10);
const add=(map,key,amount=1)=>map.set(key,(map.get(key)||0)+amount);
const pair=map,key=>map.get(key)||0;

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
 const tracks=new Map(directory.filter(x=>/^T-\d{4}$/.test(x.id)).
  map(t=>[t.id,t]));
 const owners=new Set(directory.filter(x=>x.id.startsWith('O-FICTIONAL-OWNER-')).
  map(o=>o.id));
 const farms=new Set(directory.filter(x=>x.id.startsWith('O-FICTIONAL-FARM-')).
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
 const horseIds=new Set(),byTrack=new Map(),cohorts=new Map(),status=new Map();
 let allHorses=0,racing=0,prospects=0;
 for(let i=0;i<manifest.horseBatchesCommitted;i++){
  const batch=await readPersistent1999IndustryBatch(store,manifest,'horseBatches',i);
  for(const h of batch){
   requireValue(h?.id&&!horseIds.has(h.id),'duplicate horse '+h?.id);
   horseIds.add(h.id);allHorses++;
   requireValue(owners.has(h.ownerId)&&farms.has(h.foalingFarmId),
    'invalid owner or foaling site '+h.id);
   requireValue(h.ratings&&h.name&&h.dateOfBirth&&h.foalYear<1999,
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
     racing++;
    }else prospects++;
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

 const summaries=dates.map(date=>({date,tracks:0,cards:0,races:0,
  fieldCapacity:0,purseMinor:0}));
 const byDate=new Map(summaries.map(x=>[x.date,x]));
 const datesByTrack=new Map(),observedCards=new Set(),observedRaces=new Set();
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
   requireValue(pair(byTrack,c.trackId)>0,'no runners at card '+c.id);
   requireValue(pair(personByTrackRole,c.trackId+'|trainer')>0&&
    pair(personByTrackRole,c.trackId+'|jockey')>0,
    'unworkable track personnel coverage for '+c.id);
   day.tracks++;day.cards++;windowCards++;
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
    day.purseMinor+=r.purse_minor;
    day.fieldCapacity+=r.fieldCapacity;
   }
  }
 }
 requireValue(allCards===manifest.scheduledCards&&allRaces===manifest.scheduledRaces,
  'annual source racing calendar no longer matches stored manifest');
 requireValue(windowRaces>0&&windowCards>0,'90-day racing circuit has no races');
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
  activeRacingHorses:racing,twoYearOldProspects:prospects,
  cohortCounts:Object.fromEntries(cohorts),statusCounts:Object.fromEntries(status),
  period:{start:dates[0],end,days:90,trackCards:windowCards,
   scheduledRaces:windowRaces,checkpoints},
  countsCovered:{horses:horseIds.size,people:staffById.size,
   calendarCards:allCards,calendarRaces:allRaces},
  verified:'FULL_WORLD_READ_ONLY_CIRCUIT_SCHEDULE_AND_WORKFORCE',
  liveGameDaysSimulated:0,liveRacesSettled:0,
  cannotCertifyYet:['FULL_POPULATION_KERNEL_ACTIVATION',
   '90_DAY_REAL_HORSE_AND_PERSON_MOVEMENT',
   'LIVE_RACE_ENTRIES_AND_SETTLEMENT',
   'WORLD_WIDE_FINANCIAL_LEDGER'],
  check:'PASS_READ_ONLY_NOT_GAMEPLAY_CERTIFICATION'};
}
