/**
 * Player-controlled scale settings for the fictional January 1999 world.
 * The track catalog is supplied by the selected local world pack. Preset sizes
 * follow that pack, so replacing the current North American track registry
 * does not require changing this profile contract.
 */
export const FICTIONAL_WORLD_PROFILE_SCHEMA='WTW_FICTIONAL_WORLD_PROFILE_1999_V1';
export const FICTIONAL_WORLD_GENERATOR_REVISION='WTW_FICTIONAL_WORLD_GENESIS_1999_V1';
export const MAX_FICTIONAL_WORLD_ACTIVE_HORSES=5000;

const PRESET_IDS=Object.freeze(['QUICK','REGIONAL','FULL']);
export const FICTIONAL_WORLD_PRESETS=Object.freeze([
 Object.freeze({id:'QUICK',label:'Quick test'}),
 Object.freeze({id:'REGIONAL',label:'Regional'}),
 Object.freeze({id:'FULL',label:'Full racing world'})
]);

const whole=n=>Number.isSafeInteger(n);
function catalogInfo(trackCatalog){
 if(Number.isSafeInteger(trackCatalog))return {count:trackCatalog,ids:null};
 const tracks=Array.isArray(trackCatalog)?trackCatalog:
  Array.isArray(trackCatalog?.tracks)?trackCatalog.tracks:null;
 if(!tracks)return {count:107,ids:null}; // owner-approved 1999 playable track network
 const ids=tracks.filter(t=>typeof t==='string'||t?.playableIn1999!==false)
  .map(t=>typeof t==='string'?t:t?.id);
 if(ids.some(id=>typeof id!=='string'||!/^T-[A-Za-z0-9-]+$/.test(id))||
  new Set(ids).size!==ids.length)
  throw Error('The local track pack must contain unique permanent T-ID records');
 return {count:ids.length,ids:new Set(ids)};
}
function presetSize(id,catalogCount){
 const requested=id==='QUICK'?12:id==='REGIONAL'?48:catalogCount;
 const trackCount=Math.min(requested,catalogCount);
 const activeHorses=Math.min(MAX_FICTIONAL_WORLD_ACTIVE_HORSES,
  Math.max(40,Math.round(trackCount*3400/118)));
 return {trackCount,activeHorses};
}

/** Normalize a requested size once and freeze every value needed by genesis. */
export function normalizeFictionalWorldProfile(input={},trackCatalog=107){
 if(!input||typeof input!=='object'||Array.isArray(input))
  throw Error('World settings must be an object');
 const {count:trackCatalogCount,ids:catalogIds}=catalogInfo(trackCatalog);
 if(!whole(trackCatalogCount)||trackCatalogCount<1||trackCatalogCount>500)
  throw Error('The selected local track pack must contain between 1 and 500 tracks');
 const requestedPreset=String(input.preset||'FULL').toUpperCase();
 if(!PRESET_IDS.includes(requestedPreset)&&requestedPreset!=='CUSTOM')
  throw Error('Unknown fictional-world preset '+requestedPreset);
 const defaults=presetSize(requestedPreset==='CUSTOM'?'FULL':requestedPreset,trackCatalogCount);
 const selectedTrackIds=input.trackIds??input.selectedTrackIds??null;
 if(selectedTrackIds!==null&&(!Array.isArray(selectedTrackIds)||!catalogIds||
  selectedTrackIds.some(id=>typeof id!=='string'||!catalogIds.has(id))||
  new Set(selectedTrackIds).size!==selectedTrackIds.length||!selectedTrackIds.length))
  throw Error('Custom track selection must contain unique IDs from the selected local track pack');
 const trackCount=Number(input.trackCount??selectedTrackIds?.length??defaults.trackCount);
 const activeHorses=Number(input.activeHorses??input.population??defaults.activeHorses);
 const seed=Number(input.seed??19990101);
 if(!whole(trackCount)||trackCount<1||trackCount>trackCatalogCount)
  throw Error('Choose a supported number of racecourses from 1 to '+trackCatalogCount);
 if(selectedTrackIds&&selectedTrackIds.length!==trackCount)
  throw Error('The chosen track count must match the selected track IDs');
 const minimum=Math.max(40,trackCount*4);
 if(!whole(activeHorses)||activeHorses<minimum||activeHorses>MAX_FICTIONAL_WORLD_ACTIVE_HORSES)
  throw Error('Choose between '+minimum+' and '+MAX_FICTIONAL_WORLD_ACTIVE_HORSES+
   ' active racehorses for this track count');
 if(!whole(seed)||seed<1||seed>4294967295)
  throw Error('World seed must be a positive 32-bit integer');

 const counts=Object.freeze({
  tracks:trackCount,activeHorses,
  owners:Math.max(60,Math.ceil(activeHorses/3)),
  trainers:Math.max(24,Math.ceil(activeHorses/8)),
  jockeys:Math.max(32,Math.ceil(trackCount*4)),
  grooms:Math.max(60,Math.ceil(activeHorses/2)),
  exerciseRiders:Math.max(30,Math.ceil(activeHorses/4)),
  farmManagers:Math.max(24,Math.ceil(activeHorses/20)),
  veterinarians:Math.max(18,Math.ceil(activeHorses/32)),
  farriers:Math.max(18,Math.ceil(activeHorses/40)),
  bloodstockAgents:Math.max(12,Math.ceil(activeHorses/80)),
  racingSecretaries:trackCount,
  farms:Math.max(24,Math.ceil(activeHorses/20)),
  studFarms:Math.max(12,Math.ceil(activeHorses/45)),
  nurseries:Math.max(8,Math.ceil(activeHorses/90)),
  bloodstockFarms:Math.max(4,Math.ceil(activeHorses/180))
 });
 const generatedPeople=counts.owners+counts.trainers+counts.jockeys+counts.grooms+
  counts.exerciseRiders+counts.farmManagers+counts.veterinarians+counts.farriers+
  counts.bloodstockAgents+counts.racingSecretaries;
 const generatedOrganizations=counts.owners+counts.trainers+counts.farms+
  counts.studFarms+counts.nurseries+counts.bloodstockFarms;
 const preset=input.trackCount!==undefined||input.activeHorses!==undefined||
  input.population!==undefined||selectedTrackIds?'CUSTOM':requestedPreset;
 return Object.freeze({schema:FICTIONAL_WORLD_PROFILE_SCHEMA,
  generator:FICTIONAL_WORLD_GENERATOR_REVISION,preset,seed,startDate:'1999-01-01',
  trackCount,selectedTrackIds:selectedTrackIds?Object.freeze([...selectedTrackIds]):null,
  activeHorses,population:activeHorses,counts,
  resourceEstimate:Object.freeze({generatedPeople,generatedOrganizations,
   projectedWorldEntities:generatedPeople+generatedOrganizations+trackCount+
    activeHorses,
   warning:activeHorses>=3000?'Large world: allow additional time for first creation and initial save.':null})});
}

export function fictionalWorldPreset(id,trackCatalog=107){
 const key=String(id||'').toUpperCase();
 if(!PRESET_IDS.includes(key))throw Error('Unknown fictional-world preset '+id);
 return normalizeFictionalWorldProfile({preset:key},trackCatalog);
}
