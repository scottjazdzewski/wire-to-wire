import {create1999Universe,MODES,FULL_WORLD_SCHEMA,HORSE_POPULATION} from './full-world-generator.mjs';
import {createClean1999Clock} from './test-clock.mjs';

const ACTIVE=new Map(),MAX_CACHE=2;
const send=(data,status=200)=>({status,data});
function number(raw,defaultValue,max){if(raw===null||raw===undefined||raw==='')return defaultValue;const v=Number(raw);return Number.isInteger(v)&&v>=0&&v<=max?v:defaultValue;}
function world(url){
 const rawSeed=url.searchParams.get('seed');
 const seed=number(rawSeed,19990101,4294967295)||19990101;
 const mode=url.searchParams.get('mode')||MODES[0];
 if(!MODES.includes(mode))throw Error('Invalid test universe mode');
 const key=seed+':'+mode;
 if(ACTIVE.has(key)){const res=ACTIVE.get(key);ACTIVE.delete(key);ACTIVE.set(key,res);return res;}
 const made=create1999Universe({seed,mode});
 ACTIVE.set(key,made);
 if(ACTIVE.size>MAX_CACHE)ACTIVE.delete(ACTIVE.keys().next().value);
 return made;
}
const list=(url,total,fn,{limit=25,max=100}={})=>{
 const offset=number(url.searchParams.get('offset'),0,total);
 const size=number(url.searchParams.get('limit'),limit,max);
 return {total,offset,limit:size,items:Array.from({length:Math.min(size,total-offset)},(_,i)=>fn(offset+i))};
};
function identity(g){
 return {schema:g.schema,asOf:g.startDate,sourceMode:g.mode,seed:g.seed,canonProtected:g.canonProtected,
  populationLabel:'DETERMINISTIC_FULL_TEST_WORLD__CANON_OVERLAY_IS_READ_ONLY',
  lineage:'LOCKED_267_NAMED_SOURCE_HORSES_PLUS_REPLACEABLE_SIMULATED_ECONOMY',
  traitsVisibility:'ADMIN_TEST_VALUES__NOT_SCOUTING_OBSERVATIONS',
  saveStatus:'CLOCK_CLIENT_TEST_ONLY__NO_PERSISTENT_STG7_RACE_ENGINE',
  gameplayReady:false};
}
export function readFull1999TestWorld(url){
 if(typeof url==='string')url=new URL(url,'https://wtw.invalid');
 let g;try{g=world(url)}catch(e){return send({error:e.message},400);}
 const path=url.pathname,body=identity(g);
 let gameDate=null;
 try{const raw=url.searchParams.get('date');if(raw){
  // Projectors validate ISO and the supported era before any array is read.
  g.projectAtDate(g.horseAt(0),raw);gameDate=raw;
 }}catch(e){return send({error:e.message},400);}
 const atDate=entity=>gameDate?g.projectAtDate(entity,gameDate):entity;
 const meta=gameDate?{...body,asOf:gameDate,careerProjection:'READ_ONLY_AGE_AND_ABILITY__NO_OUTCOMES'}:body;
 if(path==='/api/1999/sim/overview')return send({...meta,counts:g.counts,audit:g.audit,clock:createClean1999Clock(g.seed),
  auctionCalendar:'36 SIMULATED_1999_AUCTIONS',conditionBooks:'DETERMINISTIC_1999_RACE_CARDS_GENERATED_BY_DATE_AND_TRACK',
  important:'The 87,500 population is indexed, synthetic and reproducible; it is NOT certification that the retained 87,500 protected P01–P08 production horses have been loaded. Gameplay transactions and results require STG7.'});
 if(path==='/api/1999/sim/horse-attributes')return send({...body,definitions:g.attributeCatalog.horse_categories});
 if(path==='/api/1999/sim/horses')return send({...meta,...list(url,g.counts.horses,index=>atDate(g.horseAt(index)))});
 if(path==='/api/1999/sim/owners')return send({...meta,...list(url,g.counts.owners,index=>atDate(g.ownerAt(index)))});
 if(path==='/api/1999/sim/trainers')return send({...meta,...list(url,g.counts.trainers,index=>atDate(g.trainerAt(index)))});
 if(path==='/api/1999/sim/people')return send({...meta,...list(url,g.counts.people-g.sourcePeople.length,index=>atDate(g.personAt(index)))});
 if(path==='/api/1999/sim/source-people')return send({...meta,...list(url,g.sourcePeople.length,index=>atDate(g.sourcePersonAt(index))),provenance:'CANONICAL_IDENTITIES_WITH_SEPARATE_TEST_ABILITY'});
 if(path==='/api/1999/sim/tracks')return send({...meta,...list(url,g.counts.tracks,index=>g.trackAt(index))});
 if(path==='/api/1999/sim/facilities')return send({...meta,...list(url,g.counts.facilities,index=>g.facilityAt(index))});
 if(path==='/api/1999/sim/auctions')return send({...meta,...list(url,g.counts.auctions,index=>g.auctionAt(index))});
 if(path==='/api/1999/sim/conditions'){
  const date=url.searchParams.get('date')||g.startDate,idx=number(url.searchParams.get('trackIndex'),0,g.counts.tracks-1);
  try{return send({...body,date,track:g.trackAt(idx),races:g.conditionBook(date,idx)});}
  catch(e){return send({error:e.message},400);}
 }
 const horse=path.match(/^\/api\/1999\/sim\/horses\/(\d+)$/);
 if(horse){const index=number(horse[1],-1,g.counts.horses-1);return index>=0?send({...meta,horse:atDate(g.horseAt(index))}):send({error:'Unknown horse'},404);}
 return send({error:'Unknown full-universe test endpoint'},404);
}
