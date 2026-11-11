import { openingWorld1999 as world } from './opening-world.v1.mjs';

// Source-only January 1, 1999 world projection. This is deliberately read-only.
// No ability vectors, future outcomes, unapproved organizational origins,
// race-day personnel assumptions, or pre-authorized entries are imported.
const horseById = new Map(world.horses.map(x=>[x.id,x]));
const orgById = new Map(world.organizations.map(x=>[x.id,x]));
const personById = new Map(world.people.map(x=>[x.id,x]));
const pedigreeById = new Map(world.pedigreeNodes.map(x=>[x.id,x]));
const safeInt=(raw, fallback, max)=>{const n=Number(raw);return Number.isInteger(n)?Math.min(Math.max(n,0),max):fallback};
function page(url, records, searchFields, limit=50) {
 const q=String(url.searchParams.get('q')||'').trim().toLocaleLowerCase().slice(0,90);
 const data=q?records.filter(x=>searchFields.some(k=>String(x[k]||'').toLocaleLowerCase().includes(q))):records;
 const offset=safeInt(url.searchParams.get('offset'),0,999999);
 const requested=safeInt(url.searchParams.get('limit'),limit,100);
 return {total:data.length,offset,limit:requested,items:data.slice(offset,offset+requested)};
}
function respond(data,status=200){return {status,data};}
const notFound=()=>respond({error:'Unknown 1999 source record'},404);
const boundary={
 mode:'SOURCE_VERIFIED_1999_FOUNDATION_WORLD',
 asOf:world.effectiveDate,
 gameplayReady:false,
 runtimeStatus:'OPENING_DATA_VERIFIED__STG7_PLAYER_AI_SIMULATION_NOT_YET_CERTIFIED',
 populationScope:world.populationScope,
 provenance:world.sourceGovernance,
 protectedResults:'NONE_GENERATED',
 futureEntryPolicy:'NO_HORSE_IS_AUTOMATICALLY_ENTERED',
 sourceRecordedHistoryOnly:true
};
function pedigree(id,depth=4){
 const root=pedigreeById.get(id);
 if(!root)return null;
 const walk=(horseId,level,seen=new Set())=>{
  if(!horseId||level<0||seen.has(horseId))return null;
  const h=pedigreeById.get(horseId);
  if(!h)return {id:horseId,name:null,missingFromThisProjection:true};
  const next=new Set(seen);next.add(horseId);
  return {id:h.id,name:h.name,foalYear:h.foalYear,sex:h.sex,
   authority:h.authority,...(level>0?{sire:walk(h.sireId,level-1,next),dam:walk(h.damId,level-1,next)}:{})};
 };
 return walk(id,depth);
}
export function readOpeningWorld1999(url) {
 if(typeof url==='string') url=new URL(url,'https://wtw.invalid');
 const pathname=url.pathname;
 if(pathname==='/api/1999/overview')return respond({...boundary,counts:world.counts,
  criticalGate:'The complete 87,500-horse production run and live 1999 event loop are NOT certified by this named 267-horse source projection.',
  approvalPolicy:'10 approved organizational histories; 98 identity-and-record-evidence only',
  documents:'Authoritative Drive v3.3 opening registry and external historical H/S/awards'});
 if(pathname==='/api/1999/world')return respond({...boundary,world});
 if(pathname==='/api/1999/horses')return respond({...boundary,...page(url,world.horses,['name','id'])});
 const horse=pathname.match(/^\/api\/1999\/horses\/(H-[A-Za-z0-9-]+)$/);
 if(horse){const h=horseById.get(horse[1]);return h?respond({...boundary,horse:h,
  owner:orgById.get(h.ownerId)||null,trainer:personById.get(h.trainerId)||null,
  pedigree:pedigree(h.id)}):notFound();}
 const pedigreePath=pathname.match(/^\/api\/1999\/pedigree\/(H-[A-Za-z0-9-]+)$/);
 if(pedigreePath){const record=pedigree(pedigreePath[1]);return record?respond({...boundary,pedigree:record}):notFound();}
 if(pathname==='/api/1999/organizations')return respond({...boundary,...page(url,world.organizations,['name','id','type'])});
 const organization=pathname.match(/^\/api\/1999\/organizations\/(O-\d{6})$/);
 if(organization){const o=orgById.get(organization[1]);return o?respond({...boundary,organization:o}):notFound();}
 if(pathname==='/api/1999/people')return respond({...boundary,...page(url,world.people,['name','id','role'])});
 const person=pathname.match(/^\/api\/1999\/people\/(P-\d{6})$/);
 if(person){const p=personById.get(person[1]);return p?respond({...boundary,person:p}):notFound();}
 if(pathname==='/api/1999/stallions')return respond({...boundary,active:world.activeStallions1999,
  pendingNotBookable:world.pendingNotBookableStallions});
 if(pathname==='/api/1999/broodmares')return respond({...boundary,foundation:world.foundationalBroodmares1999,
  sourceRecordedBoardingLocations:world.counts.broodmareBoardingLocationsSourceRecords,
  note:'Foundational mares are actual 1999 boarding/residence records; no current pregnancy or future foal is implied.'});
 if(pathname==='/api/1999/calendar')return respond({...boundary,...page(url,world.stakes1999,['name','trackName','division'],100)});
 if(pathname==='/api/1999/events')return respond({...boundary,execution:'NOT_STARTED_FROM_THIS_PROJECTION',...page(url,world.openingEventQueue1999,['id','type','circuit'],100)});
 if(pathname==='/api/1999/tracks')return respond({...boundary,...page(url,world.tracks,['name','locality','region'],100)});
 if(pathname==='/api/1999/historical-seasons')return respond({...boundary,years:world.historicalYearbook});
 return notFound();
}
