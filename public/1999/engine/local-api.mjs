// 1999 browser population adapter. Every visible directory uses the same
// deterministic generator/canon snapshot WITHOUT Cloudflare Pages Functions,
// JWT, D1 migrations, or an online API request. Read-only test projection.
import {create1999Universe,MODES} from './full-world-generator.mjs';
import {openingWorld1999 as canon} from './canon-mini.mjs';
import {createClean1999Clock} from '../test-clock.mjs';
import {HISTORICAL_HORSES,HISTORICAL_HORSE_FIELDS} from './historical-horse-index.mjs';
const HISTORICAL_BY_ID=new Map(HISTORICAL_HORSES.map(row=>[row[0],Object.fromEntries(HISTORICAL_HORSE_FIELDS.map((key,i)=>[key,row[i]||null]))]));
export function historicalHorseById(id){return HISTORICAL_BY_ID.get(String(id||''))||null;}
export function historicalPedigree(id,depth=2){
 const visited=new Set();
 const walk=(horseId,level)=>{
  if(!horseId)return null;
  const horse=historicalHorseById(horseId);
  if(!horse)return {id:horseId,source:'UNRESOLVED_HISTORICAL_PARENT_ID'};
  if(visited.has(horseId))return {id:horseId,source:'CYCLE_GUARD'};
  if(level<=0)return {...horse,source:'HISTORICAL_HORSE_MASTER_V3_3'};
  visited.add(horseId);
  const result={...horse,source:'HISTORICAL_HORSE_MASTER_V3_3',sire:walk(horse.sireId,level-1),dam:walk(horse.damId,level-1)};
  visited.delete(horseId);
  return result;
 };
 return walk(id,Math.max(0,Math.min(5,Math.trunc(Number(depth)||0))));
}
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
 if(p==='/api/1999/sim/overview'){
  return {asOf:'1999-01-01',schema:w.schema,mode:w.mode,seed:w.seed,
   source:'BROWSER_DETERMINISTIC_GENERATOR__NO_API_OR_DATABASE_REQUIRED',
   gameplayReady:false,counts:w.counts,audit:w.audit,clock:createClean1999Clock(w.seed)};
 }
 if(p==='/api/1999/sim/horses')return pager(q,w.counts.horses,i=>w.horseAt(i),'SOURCE_267_PLUS_TEST_GENERATED');
 if(p==='/api/1999/sim/owner-horses'){
  const id=String(q.get('ownerId')||'').trim();
  if(!id||!/^O-[A-Z0-9-]{1,45}$/.test(id))throw Error('Valid owner ID required');
  const horseIndexes=w.ownedHorseIndexes(id);
  return pager(q,horseIndexes.length,i=>w.horseAt(horseIndexes[i]),'CANON_AND_TEST_OWNERSHIP_ROSTER');
 }
 if(p==='/api/1999/sim/owners')return pager(q,w.counts.owners,i=>w.ownerAt(i),'SOURCE_LINKED_PLUS_TEST_ECONOMY');
 if(p==='/api/1999/sim/trainers')return pager(q,w.counts.trainers,i=>w.trainerAt(i),'SOURCE_LINKED_PLUS_TEST_HORSEMEN');
 if(p==='/api/1999/sim/people')return pager(q,w.counts.people-w.sourcePeople.length,i=>w.personAt(i),'SIMULATED_WORKFORCE');
 if(p==='/api/1999/sim/tracks')return pager(q,w.counts.tracks,i=>w.trackAt(i),'CANON_GEOGRAPHY_WITH_SIMULATED_OPERATIONS');
 if(p==='/api/1999/sim/facilities')return pager(q,w.counts.facilities,i=>w.facilityAt(i),'SIMULATED_FACILITIES');
 if(p==='/api/1999/sim/auctions')return pager(q,w.counts.auctions,i=>w.auctionAt(i),'SIMULATED_AUCTIONS');
 if(p==='/api/1999/sim/conditions'){
  const trackIndex=int(q.get('trackIndex'),0,w.counts.tracks-1);
  const date=q.get('date')||'1999-01-01';
  return {source:'TEST_CONDITION_BOOK_NOT_OFFICIAL_ENTRIES',date,track:w.trackAt(trackIndex),races:w.conditionBook(date,trackIndex)};
 }
 if(p==='/api/1999/history/horse')return {source:'HISTORICAL_HORSE_MASTER_V3_3',horse:historicalHorseById(q.get('id'))};
 if(p==='/api/1999/history/pedigree')return {source:'HISTORICAL_HORSE_MASTER_V3_3',pedigree:historicalPedigree(q.get('id'),int(q.get('depth'),2,5))};
 if(p==='/api/1999/horses')return canonList(q,canon.horses,['name','id','ownerId','trainerId']);
 if(p==='/api/1999/organizations')return canonList(q,canon.organizations,['name','id','type','locationLabel']);
 if(p==='/api/1999/people')return canonList(q,canon.people,['name','id','role']);
 if(p==='/api/1999/tracks')return canonList(q,canon.tracks,['name','id','locality','region']);
 if(p==='/api/1999/calendar')return canonList(q,canon.stakes1999,['name','id','trackName','division']);
 if(p==='/api/1999/stallions')return {active:canon.activeStallions1999,pendingNotBookable:canon.pendingNotBookableStallions,
  source:'JANUARY_1999_SOURCE_STALLION_AND_FARM_RECORDS'};
 if(p==='/api/1999/broodmare-boarding')return canonList(q,canon.productionBroodmareBoarding1999,['name','id']);
 if(p==='/api/1999/events')return canonList(q,canon.openingEventQueue1999,['id','type','circuit']);
 throw Error('Unknown browser test-world directory: '+p);
}
