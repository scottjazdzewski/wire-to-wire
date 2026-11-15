/**
 * WTW 1999 fictional industry — deterministic, offline snapshot assembly.
 * Uses the EXISTING person/organization naming factory and horse ratings.
 * Registered horse names must come from the separately approved horse-name
 * pipeline; this module deliberately does not invent a second naming engine.
 *
 * This is the source-of-truth population assembly layer, not a second game
 * kernel or an implicit career commit. A career must freeze and persist the
 * returned world manifest before the game run is activated.
 */
import {createFictionalWorldNameEngine} from './fictional-world-name-engine.mjs';
import {completeFictionalPersonBiographiesV1} from './fictional-person-biographies-v1.mjs';
import {model1999StartingHorseAttributes} from '../game/horse-starting-attributes.js';
import {validateWorld,WORLD_SCHEMA} from '../game/contracts.js';

export const FICTIONAL_1999_INDUSTRY_SCHEMA='WTW_FICTIONAL_1999_INDUSTRY_V1';
const START='1999-01-01';
const cleanId=(prefix,id)=>prefix+'-'+String(id).replace(/^WTWFI-/,'').replaceAll('_','-');
const hash=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;
 for(const c of String(key)){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;return h>>>0};
const draw=(seed,key,n)=>hash(seed,key)%n;
const text=x=>String(x??'').trim();
const dateFor=(seed,id,year)=>{
 const d=new Date(Date.UTC(year,0,1));
 const days=year%4===0&&(year%100!==0||year%400===0)?366:365;
 d.setUTCDate(1+draw(seed,'horse-dob:'+id,days));
 return d.toISOString().slice(0,10);
};
async function digest(value){
 const bytes=new TextEncoder().encode(JSON.stringify(value));
 const hashBytes=new Uint8Array(await globalThis.crypto.subtle.digest('SHA-256',bytes));
 return [...hashBytes].map(b=>b.toString(16).padStart(2,'0')).join('');
}
function verifyNames(names,count,reserved){
 if(!Array.isArray(names)||names.length!==count)
  throw Error('Exactly '+count+' accepted horse names are required before world creation');
 const seen=new Set(reserved.map(n=>text(n).toLocaleLowerCase('en-US')));
 for(const name of names){
  if(typeof name!=='string'||name!==name.trim()||name.length<2||name.length>18)
   throw Error('Horse naming pipeline supplied an invalid registered name');
  const key=name.toLocaleLowerCase('en-US');
  if(seen.has(key))throw Error('Duplicate or protected registered horse name '+name);
  seen.add(key);
 }
}
function trackOpen(t){
 return t?.playableIn1999!==false&&t?.trackOperating!=='HISTORICAL_ONLY'&&
  t?.operating!=='HISTORICAL_ONLY'&&t?.status!=='HISTORICAL_ONLY';
}
function birthYearOf(h){return Number(h.foalYear??h.foaling_year??h.birth_date?.slice(0,4)??0)}
function sexOf(h){return String(h.sex||'').toUpperCase()}
/**
 * Generate all IDs and relationships in memory; no storage writes, HTTP or
 * fallback to the old 38-horse fixture. horseNames is a frozen, independently
 * accepted registration batch from the horse-naming workstream.
 */
export async function assembleFictional1999Industry({
 seed=19990101,worldId='WTW1999Industry',tracks,horseNames,
 foundationHorses=[],horseCount=horseNames?.length??0,
 trainersPerTrack=4,jockeysPerTrack=3,ownersPerTrack=8
}={}){
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid 1999 world seed');
 if(!Array.isArray(tracks)||!tracks.length||tracks.length>300||
  !tracks.every(t=>/^(?:T|IT)-[A-Za-z0-9-]+$/.test(t?.id||'')&&text(t.name)))
  throw Error('World requires an approved ID-addressable track registry');
 if(!Number.isInteger(horseCount)||horseCount<1||horseCount>100000)
  throw Error('World horse count must be 1–100000');
 for(const n of [trainersPerTrack,jockeysPerTrack,ownersPerTrack])
  if(!Number.isInteger(n)||n<1||n>100)throw Error('Invalid industry staffing ratio');
 const active=tracks.filter(trackOpen);
 if(!active.length)throw Error('No active 1999 tracks');
 const trackIds=new Set(tracks.map(t=>t.id));
 if(trackIds.size!==tracks.length)throw Error('Duplicate track ID');
 if(!Array.isArray(foundationHorses))throw Error('Foundation pedigree must be an array');
 const protectedNames=foundationHorses.map(h=>h.name);
 verifyNames(horseNames,horseCount,protectedNames);
 const trainers=active.length*trainersPerTrack;
 const jockeys=active.length*jockeysPerTrack;
 const owners=active.length*ownersPerTrack;
 const farmManagers=Math.max(8,Math.ceil(active.length*1.4));
 const farms=Math.max(4,Math.floor(farmManagers*.8));
 const named=createFictionalWorldNameEngine({
  worldId,seed,year:1999,owners,
  roles:{trainer:trainers,jockey:jockeys,farm_manager:farmManagers,
   veterinarian:Math.ceil(active.length*.8),farrier:Math.ceil(active.length*.8),
   bloodstock_agent:Math.ceil(active.length*.5),racing_secretary:active.length},
  facilities:{generalFarms:Math.ceil(farms*.5),studFarms:Math.ceil(farms*.25),
   nurseries:Math.ceil(farms*.15),bloodstockFarms:farms-
    Math.ceil(farms*.5)-Math.ceil(farms*.25)-Math.ceil(farms*.15),
   breakingTraining:Math.ceil(active.length*.4)},
  protectedNames
 });
 const people=completeFictionalPersonBiographiesV1({people:named.people,seed});
 const peopleById=new Map(people.map(p=>[p.id,p]));
 const stableOrg=named.stables.map((s,i)=>({
  ...s,id:cleanId('O',s.id),trainerId:cleanId('P',s.trainerId),
  home_track_id:active[i%active.length].id,
  stalls_total:Math.max(45,Math.ceil(horseCount/trainers)+12),
  operational_status:'OPEN_1999',founded_year:1970+draw(seed,'stable-year:'+i,28),
  opening_cash_minor:15000000+draw(seed,'stable-cash:'+i,20000000)
 }));
 const ownerOrg=named.owners.map((o,i)=>({
  ...o,id:cleanId('O',o.id),principalId:cleanId('P',o.principalId),
  founded_year:1960+draw(seed,'owner-year:'+i,39),
  opening_cash_minor:10000000+draw(seed,'owner-cash:'+i,90000000)
 }));
 const farmOrg=named.farms.map((f,i)=>({
  ...f,id:cleanId('O',f.id),managerIds:f.managerIds.map(id=>cleanId('P',id)),
  founded_year:1950+draw(seed,'farm-year:'+i,49),
  operating_capacity:80+draw(seed,'farm-cap:'+i,120)
 }));
 const trainingOrg=named.trainingCenters.map(t=>({
  ...t,id:cleanId('O',t.id),operating_capacity:70,
  founded_year:1980+draw(seed,'center-year:'+t.id,18)
 }));
 const organizations=[...ownerOrg,...stableOrg,...farmOrg,...trainingOrg];
 const organizationIds=new Set(organizations.map(o=>o.id));
 for(const stable of stableOrg)
  if(!peopleById.has(stable.trainerId))throw Error('Stable trainer link missing');
 for(const owner of ownerOrg)
  if(!peopleById.has(owner.principalId))throw Error('Owner principal link missing');
 const ancestorIds=new Set();
 const parents=foundationHorses.map(h=>{
  if(!/^H-[A-Za-z0-9-]+$/.test(h?.id||'')||!text(h.name)||
   !Number.isInteger(birthYearOf(h))||birthYearOf(h)>1995||
   ancestorIds.has(h.id))throw Error('Invalid or duplicate foundation pedigree');
  ancestorIds.add(h.id);
  return {...h,foalYear:birthYearOf(h)};
 });
 const horses=[];
 const sirePools=new Map(),damPools=new Map();
 for(let year=1989;year<=1997;year++){
  sirePools.set(year,parents.filter(h=>birthYearOf(h)<=year-4&&
   ['HORSE','COLT','STALLION'].includes(sexOf(h))));
  damPools.set(year,parents.filter(h=>birthYearOf(h)<=year-4&&
   ['MARE','FILLY','BROODMARE'].includes(sexOf(h))));
 }
 for(let i=0;i<horseCount;i++){
  const id='H-WTW1999-'+seed.toString(16).toUpperCase()+'-'+String(i+1).padStart(7,'0');
  const year=1989+draw(seed,'foal-year:'+i,9);
  const sex=draw(seed,'sex:'+i,2)===0?'COLT':'FILLY';
  const sires=sirePools.get(year),dams=damPools.get(year);
  const sire=sires.length?sires[draw(seed,'sire:'+i,sires.length)]:null;
  const dam=dams.length?dams[draw(seed,'dam:'+i,dams.length)]:null;
  if(!sire||!dam)throw Error('Incomplete foundation sire/dam cohort for horse '+id);
  const stable=stableOrg[i%stableOrg.length];
  const owner=ownerOrg[draw(seed,'owner:'+i,ownerOrg.length)];
  const farm=farmOrg[draw(seed,'breeder:'+i,farmOrg.length)];
  const horse={
   id,name:horseNames[i],sex,foalYear:year,birth_date:dateFor(seed,id,year),
   sireId:sire.id,damId:dam.id,ownerId:owner.id,breederId:farm.id,
   trainerId:stable.trainerId,stableId:stable.id,
   homeTrackId:stable.home_track_id,foalingFarmId:farm.id,
   racingStatus1999:year>=1992?'IN_TRAINING':'ACTIVE_OR_BREEDING',
   ratings:model1999StartingHorseAttributes({
    horse_id:id,seed,foaling_year:year,sex
   }),
   career:{starts:0,wins:0,earnings_minor:0},
   source:'GENERATED_FICTIONAL_1999',namingAuthority:'EXTERNAL_ACCEPTED_HORSE_NAME_BATCH'
  };
  horses.push(horse);
  for(let future=year+4;future<=1997;future++)
   (sex==='COLT'?sirePools:damPools).get(future).push(horse);
 }
 const allHorseIds=new Set([...parents,...horses].map(h=>h.id));
 const entities={horses:[...parents,...horses],people,organizations,
  tracks:tracks.map(t=>({...t}))};
 for(const h of horses){
  if(!organizationIds.has(h.ownerId)||!organizationIds.has(h.stableId)||
   !organizationIds.has(h.breederId)||!peopleById.has(h.trainerId)||
   !trackIds.has(h.homeTrackId)||!allHorseIds.has(h.sireId)||
   !allHorseIds.has(h.damId))
   throw Error('World relationship integrity failed for '+h.id);
 }
 const manifest={schema:FICTIONAL_1999_INDUSTRY_SCHEMA,seed,worldId,startDate:START,
  generatorRevision:FICTIONAL_1999_INDUSTRY_SCHEMA,
  namingRevision:named.manifest.schema,namingFingerprint:named.manifest.fingerprint,
  horseNaming:'EXTERNAL_ACCEPTED_BATCH',activeTracks:active.length,
  archivedTracks:tracks.length-active.length,generatedHorses:horses.length,
  foundationHorses:parents.length,people:people.length,organizations:organizations.length};
 const authority={snapshot_id:'WTW-FICTIONAL-1999-'+seed+'-'+worldId,
  source:'OFFLINE_GENERATED_FICTIONAL_GAME',sha256:await digest({manifest,entities})};
 const world={schema:WORLD_SCHEMA,start_date:START,authority,entities,manifest};
 validateWorld(world);
 return world;
}
