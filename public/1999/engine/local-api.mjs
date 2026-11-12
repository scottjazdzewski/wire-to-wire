// 1999 browser population adapter. Every visible directory uses the same
// deterministic generator/canon snapshot WITHOUT Cloudflare Pages Functions,
// JWT, D1 migrations, or an online API request. Read-only test projection.
import {create1999Universe,MODES} from './full-world-generator.mjs?rev=wtw1999-20261112-r9';
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {createClean1999Clock} from '../test-clock.mjs';
import {validateCareerGameDate} from './age-ability.mjs';
const CACHE=new Map();
function parse(raw){return new URL(raw,'https://wire-to-wire.invalid');}
function int(raw,defaultValue,max){const n=Number(raw);return raw!==null&&raw!==''&&Number.isInteger(n)&&n>=0&&n<=max?n:defaultValue;}
function currentWorld(q){
 const seed=int(q.get('seed'),19990101,4294967295)||19990101;
 const mode=q.get('mode')||'CANON_ANCHORED_TEST';
 if(!MODES.includes(mode))throw Error('Unknown world generation mode');
 const key=seed+'|'+mode;
 if(CACHE.has(key)){const v=CACHE.get(key);CACHE.delete(key);CACHE.set(key,v);return v;}
 const v=create1999Universe({seed,mode});CACHE.set(key,v);
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
   gameplayReady:false,counts:w.counts,audit:w.audit,clock:createClean1999Clock(w.seed)};
 }
 if(p==='/api/1999/sim/horses')return pager(q,w.counts.horses,i=>atDate(w.horseAt(i)),'SOURCE_267_PLUS_TEST_GENERATED');
 if(p==='/api/1999/sim/horse-directory')return pager(q,w.counts.horses,i=>w.horseDirectoryAt(i),'FULL_87500_INDEX_SOURCE_AND_TEST');
 if(p==='/api/1999/sim/owner-horses'){
  const id=String(q.get('ownerId')||'').trim();
  if(!id||!/^O-[A-Z0-9-]{1,45}$/.test(id))throw Error('Valid owner ID required');
  const horseIndexes=w.ownedHorseIndexes(id);
  return pager(q,horseIndexes.length,i=>atDate(w.horseAt(horseIndexes[i])),'CANON_AND_TEST_OWNERSHIP_ROSTER');
 }
 if(p==='/api/1999/sim/owners')return pager(q,w.counts.owners,i=>atDate(w.ownerAt(i)),'SOURCE_LINKED_PLUS_TEST_ECONOMY');
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
 if(p==='/api/1999/sim/mare-directory')return pager(q,w.counts.breedingMares,i=>w.mareDirectoryAt(i),'GLOBAL_26000_MARES_TEST_INDEX');
 if(p==='/api/1999/sim/foaling-forecast')return w.annualFoalingForecast();
 if(p==='/api/1999/sim/conditions'){
  const trackIndex=int(q.get('trackIndex'),0,w.counts.tracks-1);
  const date=q.get('date')||'1999-01-01';
  return {source:'TEST_CONDITION_BOOK_NOT_OFFICIAL_ENTRIES',date,track:w.trackAt(trackIndex),races:w.conditionBook(date,trackIndex)};
 }
 if(p==='/api/1999/horses')return canonList(q,canon.horses,['name','id','ownerId','trainerId']);
 if(p==='/api/1999/organizations')return canonList(q,canon.organizations,['name','id','type','locationLabel']);
 if(p==='/api/1999/people')return canonList(q,canon.people,['name','id','role']);
 if(p==='/api/1999/tracks'){
  const activeIds=new Set(Array.from({length:w.counts.tracks},(_,i)=>w.trackAt(i).sourceTrackId));
  return canonList(q,canon.tracks.filter(t=>activeIds.has(t.id)),['name','id','locality','region']);
}
 if(p==='/api/1999/calendar')return canonList(q,w.sourceStakes,['name','id','trackName','division']);
 if(p==='/api/1999/stallions')return {active:canon.activeStallions1999,pendingNotBookable:canon.pendingNotBookableStallions,
  source:'JANUARY_1999_SOURCE_STALLION_AND_FARM_RECORDS'};
 if(p==='/api/1999/broodmare-boarding')return canonList(q,canon.productionBroodmareBoarding1999,['name','id']);
 if(p==='/api/1999/events')return canonList(q,canon.openingEventQueue1999,['id','type','circuit']);
 throw Error('Unknown browser test-world directory: '+p);
}
