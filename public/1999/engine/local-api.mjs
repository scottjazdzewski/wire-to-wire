// 1999 browser population adapter. Every visible directory uses the same
// deterministic generator/canon snapshot WITHOUT Cloudflare Pages Functions,
// JWT, D1 migrations, or an online API request. Read-only test projection.
import {create1999Universe,MODES} from './full-world-generator.mjs?rev=wtw1999-20261112-r11';
import {createFounding1999Universe,FOUNDING_WORLD_MODE} from './founding-world-1999.mjs?rev=wtw1999-playable-pilot-20261113-r2';
import {withPlayable1999Pilot,PLAYABLE_PILOT_SCHEMA} from './founding-playable-pilot-1999.mjs';
import {scopeWorldPopulation,normalizeWorldProfile} from './world-profiles.mjs';
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {createClean1999Clock} from '../test-clock.mjs';
import {validateCareerGameDate} from './age-ability.mjs';
const CACHE=new Map();
function parse(raw){return new URL(raw,'https://wire-to-wire.invalid');}
function int(raw,defaultValue,max){const n=Number(raw);return raw!==null&&raw!==''&&Number.isInteger(n)&&n>=0&&n<=max?n:defaultValue;}
function currentWorld(q){
 const seed=int(q.get('seed'),19990101,4294967295)||19990101;
 const mode=q.get('mode')||FOUNDING_WORLD_MODE; // Legacy full-world analysis requires explicit opt-in.
 if(mode!==FOUNDING_WORLD_MODE&&!MODES.includes(mode))throw Error('Unknown world generation mode');
 if(mode===FOUNDING_WORLD_MODE){
  const pilot=q.get('pilot')==='opening';
  const key=seed+'|'+FOUNDING_WORLD_MODE+(pilot?'|PLAYABLE':'|SOURCE');
  if(CACHE.has(key))return CACHE.get(key);
  const founded=createFounding1999Universe({seed});
  const world=pilot?withPlayable1999Pilot(founded,{seed}):founded;
  CACHE.set(key,world);if(CACHE.size>2)CACHE.delete(CACHE.keys().next().value);
  return world;
 }
 const population=int(q.get('population'),325000,325000)||325000;
 const profile=normalizeWorldProfile({population,seed,mode});
 const key=seed+'|'+mode+'|'+profile.population;
 if(CACHE.has(key)){const v=CACHE.get(key);CACHE.delete(key);CACHE.set(key,v);return v;}
 const v=scopeWorldPopulation(create1999Universe({seed,mode}),profile);CACHE.set(key,v);
 if(CACHE.size>2)CACHE.delete(CACHE.keys().next().value);
 return v;
}
function pager(q,total,at,kind='source'){
 const offset=int(q.get('offset'),0,total),limit=int(q.get('limit'),15,100);
 const n=Math.min(limit,total-offset);
 return {total,offset,limit,items:Array.from({length:n},(_,i)=>at(offset+i)),recordsSource:kind};
}
function canonList(q,records,fields){
 const needle=String(q.get('q')||'').trim().toLowerCase().slice(0,120);
 const data=needle?records.filter(v=>fields.some(field=>String(v[field]||'').toLowerCase().includes(needle))):records;
 return pager(q,data.length,i=>data[i],'SOURCE_LOCKED_HISTORY');
}
export function readLocal1999World(raw){
 const url=parse(raw),p=url.pathname,q=url.searchParams;
 const w=currentWorld(q);
 const gameDate=q.get('date');
 if(gameDate)validateCareerGameDate(gameDate);
 const atDate=entity=>gameDate?w.projectAtDate(entity,gameDate):entity;
 if(p==='/api/1999/sim/overview'){
  return {asOf:gameDate||'1999-01-01',careerProjection:gameDate?'READ_ONLY_AGE_AND_ABILITY__NO_OUTCOMES':null,schema:w.schema,mode:w.mode,seed:w.seed,
   source:'BROWSER_DETERMINISTIC_GENERATOR__NO_API_OR_DATABASE_REQUIRED',
   gameplayReady:w.schema===PLAYABLE_PILOT_SCHEMA,worldProfile:w.worldProfile,counts:w.counts,audit:w.audit,clock:createClean1999Clock(w.seed)};
 }
 if(p==='/api/1999/sim/horses')return pager(q,w.counts.horses,i=>atDate(w.horseAt(i)),w.mode===FOUNDING_WORLD_MODE?'FOUNDING_SOURCE_ONLY':'SOURCE_267_PLUS_TEST_GENERATED');
 if(p==='/api/1999/sim/horse-directory')return pager(q,w.counts.horses,i=>w.horseDirectoryAt(i),w.mode===FOUNDING_WORLD_MODE?'FOUNDING_SOURCE_ONLY':'FULL_87500_INDEX_SOURCE_AND_TEST');
 // Complete 325k registry, disjoint from the existing 87.5k racehorse ID index.
 // All endpoints page at <=100 and never serialize the whole population.
 if(p==='/api/1999/sim/world-horse-directory')
  return pager(q,w.counts.worldHorses,i=>w.worldHorseDirectoryAt(i),
   w.mode===FOUNDING_WORLD_MODE?'FOUNDING_SOURCE_BREEDING_AND_RACERS':'325K_DISTINCT_WORLD_HORSE_INDEX_SOURCE_AND_TEST');
 if(p==='/api/1999/sim/world-horse-attribute'){
  const key=String(q.get('key')||'');
  if(!w.attributeCatalog.horse_categories||!Object.values(w.attributeCatalog.horse_categories)
   .flat().some(d=>d.key===key))throw Error('Unknown world horse attribute');
  return pager(q,w.counts.worldHorses,i=>({index:i,value:w.worldHorseAttributeAt(i,key)}),
   '325K_WORLD_TRAIT_PROJECTION_TEST_ONLY');
 }
 if(p==='/api/1999/sim/world-horse-profile'){
  const id=String(q.get('id')||'');
  const index=id?w.worldIndexByHorseId(id):
   int(q.get('index'),-1,w.counts.worldHorses-1);
  if(index<0||index>=w.counts.worldHorses)throw Error('Unknown world horse identity');
  return {index,horse:w.worldHorseAt(index),
   source:'1999_WORLD_HORSE_PROFILE_BY_STABLE_ID_OR_INDEX'};
 }

 if(p==='/api/1999/sim/new-youngstock-proposals'){
  if(w.mode!==FOUNDING_WORLD_MODE)throw Error('Youngstock proposals belong only to founding scenario');
  const proposal=w.proposedYoungstock;
  return {...pager(q,proposal.horses.length,i=>proposal.horses[i],
    'NEW_FICTION_1997_1998_PRESTART_PROPOSALS__NOT_LIVE'),
   schema:proposal.schema,yearCounts:proposal.yearCounts,
   registeredNames:proposal.audit.namedCount,
   playableEntriesCreated:proposal.audit.liveGameEntriesCreated,
   status:proposal.status};
 }
 if(p==='/api/1999/sim/founding-ancestry'){
  if(w.mode!==FOUNDING_WORLD_MODE)throw Error('Founding ancestry is only available in clean 1999 world');
  const id=String(q.get('id')||'').trim();
  if(!/^H-[A-Za-z0-9-]+$/.test(id))
   throw Error('Exact founding or connected-history horse ID required');
  const pedigree=w.foundingAncestry;
  const horse=pedigree.records.find(x=>x.id===id)||null;
  if(!horse)return {id,horse:null,parents:[],children:[],
   status:'HORSE_NOT_CONNECTED_TO_FOUNDING_ORGANIZATIONS'};
  return {id,horse,
   parents:pedigree.edges.filter(e=>e.childId===id).map(e=>({
    ...e,horse:pedigree.records.find(h=>h.id===e.parentId)||null})),
   children:pedigree.edges.filter(e=>e.parentId===id).map(e=>({
    ...e,horse:pedigree.records.find(h=>h.id===e.childId)||null})),
   missingNamedParents:pedigree.missingNamedParents.filter(m=>m.referredBy.some(x=>x.childId===id)),
   status:'SOURCE_ONLY_FIVE_GENERATIONS_NOT_1999_LIVING_POPULATION',
   historicalResultsUnmodified:true};
 }
 if(p==='/api/1999/sim/horse-attribute'){
  const key=String(q.get('key')||'');
  if(!w.attributeCatalog.horse_categories||!Object.values(w.attributeCatalog.horse_categories)
   .flat().some(d=>d.key===key))throw Error('Unknown horse attribute');
  return pager(q,w.counts.horses,i=>({index:i,value:w.horseAttributeAt(i,key)}),
   'SIMULATED_1999_ATTRIBUTE_NOT_SCOUTING_EVIDENCE');
 }
 if(p==='/api/1999/sim/owner-horses'){
  const id=String(q.get('ownerId')||'').trim();
  if(!id||!/^O-[A-Z0-9-]{1,45}$/.test(id))throw Error('Valid owner ID required');
  const horseIndexes=w.ownedHorseIndexes(id);
  return pager(q,horseIndexes.length,i=>atDate(w.horseAt(horseIndexes[i])),'CANON_AND_TEST_OWNERSHIP_ROSTER');
 }
 if(p==='/api/1999/sim/owners')return pager(q,w.counts.owners,i=>atDate(w.ownerAt(i)),w.mode===FOUNDING_WORLD_MODE?'SOURCE_OWNERS_FINANCES_NOT_CERTIFIED':'SOURCE_LINKED_PLUS_TEST_ECONOMY');
 if(p==='/api/1999/sim/trainers')return pager(q,w.counts.trainers,i=>atDate(w.trainerAt(i)),'SOURCE_LINKED_PLUS_TEST_HORSEMEN');
 if(p==='/api/1999/sim/people')return pager(q,w.counts.people-w.sourcePeople.length,i=>atDate(w.personAt(i)),'SIMULATED_WORKFORCE');
 if(p==='/api/1999/sim/source-people')return pager(q,w.sourcePeople.length,i=>atDate(w.sourcePersonAt(i)),'CANON_IDS_PLUS_TEST_ONLY_ABILITY');
 if(p==='/api/1999/sim/tracks')return pager(q,w.counts.tracks,i=>w.trackAt(i),'CANON_GEOGRAPHY_WITH_SIMULATED_OPERATIONS');
 if(p==='/api/1999/sim/facilities')return pager(q,w.counts.facilities,i=>w.facilityAt(i),'SIMULATED_FACILITIES');
 if(p==='/api/1999/sim/auctions')return pager(q,w.counts.auctions,i=>w.auctionAt(i),'SIMULATED_AUCTIONS');
 if(p==='/api/1999/sim/breeding-stock'){
  const sex=q.get('sex')==='SIRE'?'SIRE':'DAM';
  return pager(q,sex==='SIRE'?w.counts.breedingStallions:w.counts.breedingMares,
   i=>w.parentAt(i,sex),'VIRTUAL_SIMULATED_BREEDING_STOCK');
 }
 if(p==='/api/1999/sim/mare-directory')return pager(q,w.counts.breedingMares,i=>w.mareDirectoryAt(i),'GLOBAL_BREEDING_MARES_TEST_INDEX');
 if(p==='/api/1999/sim/foaling-forecast')return w.annualFoalingForecast();
 if(p==='/api/1999/sim/conditions'){
  const trackIndex=int(q.get('trackIndex'),0,w.counts.tracks-1);
  const date=q.get('date')||'1999-01-01';
  return {source:'TEST_CONDITION_BOOK_NOT_OFFICIAL_ENTRIES',date,track:w.trackAt(trackIndex),races:w.conditionBook(date,trackIndex)};
 }
 if(p==='/api/1999/horses')return canonList(q,w.mode===FOUNDING_WORLD_MODE?w.sourceHorses:canon.horses,['name','id','ownerId','trainerId']);
 if(p==='/api/1999/organizations')return canonList(q,w.mode===FOUNDING_WORLD_MODE?w.sourceOrganizations:canon.organizations,['name','id','type','locationLabel']);
 if(p==='/api/1999/people')return canonList(q,w.mode===FOUNDING_WORLD_MODE?w.sourcePeople:canon.people,['name','id','role']);
 if(p==='/api/1999/tracks'){
  const activeIds=new Set(Array.from({length:w.counts.tracks},(_,i)=>w.trackAt(i).sourceTrackId));
  return canonList(q,canon.tracks.filter(t=>activeIds.has(t.id)),['name','id','locality','region']);
}
 if(p==='/api/1999/calendar')return canonList(q,w.sourceStakes,['name','id','trackName','division']);
 if(p==='/api/1999/stallions')return {active:w.mode===FOUNDING_WORLD_MODE?w.sourceStallions:canon.activeStallions1999,
  pendingNotBookable:w.mode===FOUNDING_WORLD_MODE?[]:canon.pendingNotBookableStallions,
  source:'JANUARY_1999_SOURCE_STALLION_AND_FARM_RECORDS'};
 // In the small founding scenario, every selected boarding mare is already in
 // the 55-entry source breeding roster. Do not display them a second time.
 if(p==='/api/1999/broodmare-boarding')return canonList(q,w.mode===FOUNDING_WORLD_MODE?[]:canon.productionBroodmareBoarding1999,['name','id']);
 if(p==='/api/1999/events')return canonList(q,canon.openingEventQueue1999,['id','type','circuit']);
 throw Error('Unknown browser test-world directory: '+p);
}
