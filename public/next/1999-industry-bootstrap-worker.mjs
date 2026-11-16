/**
 * Keeps full-world materialization off the interactive Electron renderer.
 * This worker owns only generation work; the existing IndexedDB schema and
 * canonical world engine remain unchanged.
 */
import {open1999IndustryDatabase,createPersistent1999Industry}
 from '/1999/engine/fictional-industry-persistence-1999.mjs';
import {TRACK_PROGRAM_1999} from '/next/1999-track-program.mjs';
import {createFictionalWorldNameEngine}
 from '/1999/engine/fictional-world-name-engine.mjs';

async function industryDirectories(seed){
 const response=await fetch('/data/track-geography-v33.json');
 if(!response.ok)throw Error('Bundled 1999 track geography unavailable');
 const geo=await response.json();
 const geoById=new Map((geo.tracks||[]).map(g=>[g.id,g]));
 const tracks=Object.values(TRACK_PROGRAM_1999)
  .filter(t=>t.playableIn1999!==false&&t.trackOperating==='OPEN_1999')
  .map(t=>{
   const g=geoById.get(t.id);
   if(!g?.city_locality||!g?.state_province_region||!g?.country)
    throw Error('Missing local foaling/racing geography for '+t.id);
   return {id:t.id,name:t.name,location:{city:g.city_locality,
    region:g.state_province_region,country:g.country,
    metro:g.metro_or_subregion||null,circuit:g.macro_circuit||null},
    physicalTrackId:t.physicalTrackId||t.id,
    venueType:t.venueType||'PHYSICAL_RACECOURSE',
    physicalFacilityStatus:t.physicalFacilityStatus||'STANDALONE_FACILITY',
    geographyProvenance:g.geography_status};
  });
 if(!tracks.length)throw Error('No approved operating 1999 tracks');
 const farmCount=tracks.length*4,ownerCount=tracks.length*10;
 const generated=createFictionalWorldNameEngine({
  worldId:'WTW1999IndustryDirectory',seed,year:1999,roles:{},owners:ownerCount,
  facilities:{generalFarms:farmCount,studFarms:0,nurseries:0,
   bloodstockFarms:0,breakingTraining:0},
  protectedNames:tracks.map(t=>t.name)
 });
 if(generated.owners.length!==ownerCount||generated.farms.length!==farmCount)
  throw Error('1999 approved organization name generator returned an incomplete directory');
 const farms=tracks.flatMap((t,trackIndex)=>Array.from({length:4},(_,i)=>{
  const named=generated.farms[trackIndex*4+i];
  return {id:'O-FICTIONAL-FARM-'+t.id+'-'+String(i+1).padStart(2,'0'),
   name:named.name,location:t.location,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
 const owners=tracks.flatMap((t,trackIndex)=>Array.from({length:10},(_,i)=>{
  const named=generated.owners[trackIndex*10+i];
  return {id:'O-FICTIONAL-OWNER-'+t.id+'-'+String(i+1).padStart(2,'0'),
   name:named.name,location:t.location,
   ownershipArchetype:named.ownershipArchetype,
   namingStatus:'GENERATED_1999_ORGANIZATION_ENGINE',
   namingSourceId:named.id,
   geographyStatus:t.location?.region?'REGION_PROVIDED':'LOCATION_REVIEW_REQUIRED'};
 }));
 return {tracks,farms,owners};
}

self.addEventListener('message',async event=>{
 const request=event.data||{};
 if(request.type!=='CREATE_1999_INDUSTRY')return;
 const id=request.id;
 const send=(type,data={})=>self.postMessage({id,type,...data});
 let store;
 try{
  send('STAGE',{message:'Loading the bundled 1999 geography and racecourse directory…'});
  const directories=await industryDirectories(request.seed);
  send('STAGE',{message:'Preparing the opening population and personnel in the background…'});
  store=await open1999IndustryDatabase();
  const manifest=await createPersistent1999Industry({
   ...directories,store,seed:request.seed,worldId:request.worldId,
   targetOpeningHorses:request.targetOpeningHorses,
   batchSize:request.batchSize,
   yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0)),
   onProgress:progress=>send('PROGRESS',progress)
  });
  send('COMPLETE',{manifest});
 }catch(error){
  send('ERROR',{message:String(error?.message||error),
   stack:String(error?.stack||'')});
 }finally{
  try{store?.close()}catch{}
 }
});
