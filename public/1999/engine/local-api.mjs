/**
 * WTW January 1999 single approved-source browser API.
 *
 * NO full-world generator, no 87,500 or 325,000 test horses, no legacy
 * fictional mode, no generated owner, trainer, barn, staff or auction.
 * 1999 living animals are only 73 APPROVED breeding stock until the user
 * explicitly registers new game horses. The 118 racecourses remain visible.
 */
import {createFounding1999Universe,FOUNDING_WORLD_MODE} from './founding-world-1999.mjs';
import {createClean1999Clock} from '../test-clock.mjs';
import {validateCareerGameDate} from './age-ability.mjs';
const CACHE=new Map();
function int(v,defaultValue,max){
 const n=Number(v);return v!==null&&v!==''&&Number.isSafeInteger(n)&&n>=0&&n<=max?n:defaultValue;
}
const pager=(query,total,at,source='APPROVED_FOUNDING_ONLY')=>{
 const offset=int(query.get('offset'),0,total),limit=int(query.get('limit'),15,100);
 const n=Math.min(limit,Math.max(0,total-offset));
 return {total,offset,limit,items:Array.from({length:n},(_,i)=>at(offset+i)),recordsSource:source};
};
const list=(q,data,keys)=>{
 const needle=String(q.get('q')||'').trim().toLowerCase().slice(0,120);
 const filtered=needle?data.filter(x=>keys.some(k=>String(x[k]??'').toLowerCase().includes(needle))):data;
 return pager(q,filtered.length,i=>filtered[i],'SOURCE_LOCKED_1999_FOUNDING');
};
function approvedWorld(q){
 if(q.has('pilot')||q.has('worldSize')||q.has('populationSize'))
  throw Error('Retired world creation options are unavailable');
 const mode=q.get('mode')||FOUNDING_WORLD_MODE;
 if(mode!==FOUNDING_WORLD_MODE)throw Error('Retired synthetic world mode is not available');
 const population=q.get('population');
 if(population!==null&&Number(population)!==73)
  throw Error('Retired synthetic population is not available');
 const seed=int(q.get('seed'),19990101,4294967295)||19990101;
 if(!CACHE.has(seed)){
  CACHE.set(seed,createFounding1999Universe({seed}));
  if(CACHE.size>2)CACHE.delete(CACHE.keys().next().value);
 }
 return CACHE.get(seed);
}
export function readLocal1999World(raw){
 const url=new URL(raw,'https://wire-to-wire.invalid'),p=url.pathname,q=url.searchParams;
 const w=approvedWorld(q);
 const date=q.get('date');
 if(date)validateCareerGameDate(date);
 const atDate=v=>date?w.projectAtDate(v,date):v;
 if(p==='/api/1999/sim/overview'){
  return {asOf:date||'1999-01-01',careerProjection:'APPROVED_FOUNDING_ONLY',
   schema:w.schema,mode:w.mode,seed:w.seed,
   source:'APPROVED_FOUNDING_NO_SYNTHETIC_WORLD',gameplayReady:false,
   worldProfile:w.worldProfile,counts:w.counts,audit:w.audit,clock:createClean1999Clock(w.seed)};
 }
 if(p==='/api/1999/sim/horses')
  return pager(q,w.counts.horses,i=>atDate(w.horseAt(i)));
 if(p==='/api/1999/sim/horse-directory')
  return pager(q,w.counts.horses,i=>w.horseDirectoryAt(i));
 if(p==='/api/1999/sim/world-horse-directory')
  return pager(q,w.counts.worldHorses,i=>w.worldHorseDirectoryAt(i));
 if(p==='/api/1999/sim/world-horse-attribute'){
  const key=String(q.get('key')||'');
  if(!Object.values(w.attributeCatalog.horse_categories).flat().some(x=>x.key===key))
   throw Error('Unknown horse attribute');
  return pager(q,w.counts.worldHorses,i=>({index:i,value:null,
   status:'SOURCE_HORSE_ATTRIBUTE_NOT_ASSESSED'}));
 }
 if(p==='/api/1999/sim/world-horse-profile'){
  const id=String(q.get('id')||'').trim();
  const index=id?w.worldIndexByHorseId(id):int(q.get('index'),-1,w.counts.worldHorses-1);
  if(index<0||index>=w.counts.worldHorses)throw Error('Unknown approved founding horse');
  return {index,horse:w.worldHorseAt(index),source:'APPROVED_1999_LIVING_HORSE'};
 }
 if(p==='/api/1999/sim/founding-ancestry'){
  const id=String(q.get('id')||'').trim();
  if(!/^H-[A-Za-z0-9-]+$/.test(id))
   throw Error('Exact approved or connected-history horse ID required');
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
  if(!Object.values(w.attributeCatalog.horse_categories).flat().some(x=>x.key===key))
   throw Error('Unknown horse attribute');
  return pager(q,w.counts.horses,i=>({index:i,value:null,
   status:'NO_APPROVED_RACING_HORSE'}));
 }
 if(p==='/api/1999/sim/owner-horses'){
  const id=String(q.get('ownerId')||'').trim();
  if(!/^O-[A-Z0-9-]{1,45}$/.test(id))throw Error('Valid owner ID required');
  return pager(q,w.ownedHorseIndexes(id).length,i=>atDate(w.horseAt(w.ownedHorseIndexes(id)[i])));
 }
 if(p==='/api/1999/sim/owners')
  return pager(q,w.counts.owners,i=>atDate(w.ownerAt(i)));
 if(p==='/api/1999/sim/trainers')
  return pager(q,w.counts.trainers,i=>atDate(w.trainerAt(i)));
 if(p==='/api/1999/sim/people')
  return pager(q,0,()=>{throw Error('No generated workers registered')});
 if(p==='/api/1999/sim/source-people')
  return pager(q,w.sourcePeople.length,i=>atDate(w.sourcePersonAt(i)));
 if(p==='/api/1999/sim/tracks')
  return pager(q,w.counts.tracks,i=>w.trackAt(i));
 if(p==='/api/1999/sim/facilities')
  return pager(q,w.counts.facilities,i=>w.facilityAt(i),
   'APPROVED_ORGANIZATION_REFERENCES_NOT_PHYSICAL_BUILDINGS');
 if(p==='/api/1999/sim/auctions')
  return pager(q,0,()=>{throw Error('No auction catalogs registered')});
 if(p==='/api/1999/sim/breeding-stock'){
  const sex=q.get('sex')==='SIRE'?'SIRE':'DAM';
  const count=sex==='SIRE'?w.counts.breedingStallions:w.counts.breedingMares;
  return pager(q,count,i=>w.parentAt(i,sex));
 }
 if(p==='/api/1999/sim/mare-directory')
  return pager(q,w.counts.breedingMares,i=>w.mareDirectoryAt(i));
 if(p==='/api/1999/sim/foaling-forecast')return w.annualFoalingForecast();
 if(p==='/api/1999/sim/conditions'){
  const trackIndex=int(q.get('trackIndex'),0,w.counts.tracks-1);
  const day=q.get('date')||'1999-01-01';
  return {source:'APPROVED_1999_TRACK_CONDITION_BOOK_PROPOSALS_NOT_ENTRIES',
   date:day,track:w.trackAt(trackIndex),races:w.conditionBook(day,trackIndex)};
 }
 if(p==='/api/1999/horses')return list(q,w.sourceHorses,['id','name','ownerId']);
 if(p==='/api/1999/organizations')return list(q,w.sourceOrganizations,
  ['id','name','type','locationLabel']);
 if(p==='/api/1999/people')return list(q,w.sourcePeople,['id','name','role']);
 if(p==='/api/1999/tracks'){
  const rows=Array.from({length:w.counts.tracks},(_,i)=>w.trackAt(i));
  return list(q,rows,['id','name','sourceTrackId']);
 }
 if(p==='/api/1999/calendar')return list(q,w.sourceStakes,['id','name','trackName']);
 if(p==='/api/1999/stallions')
  return {active:w.sourceStallions,pendingNotBookable:[],
   source:'APPROVED_FOUNDING_STALLIONS_NO_TEST_STOCK'};
 if(p==='/api/1999/broodmare-boarding')
  return list(q,[],['id','name']);
 if(p==='/api/1999/events')
  return list(q,[],['id','type']);
 throw Error('Unknown or retired 1999 world endpoint: '+p);
}
