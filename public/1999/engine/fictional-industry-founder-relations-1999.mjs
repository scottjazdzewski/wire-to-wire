/**
 * Versioned, provenance-aware facility links for approved founding horses.
 * Source gaps are represented as explicit regional or care-facility proxies;
 * the original source fields remain recoverable for checkpoint validation.
 */
export const APPROVED_FOUNDING_RELATIONSHIP_REVISION=1;
function normalizedRegion(value){
 const parts=String(value||'').split(/[;,\/|]+/).map(part=>
  part.trim().toLowerCase().replace(/[^a-z]/g,'')).filter(Boolean);
 const qualifiers=['central','eastern','western','northern','southern','upper','lower'];
 return parts.map(part=>{
  for(const qualifier of qualifiers)
   if(part.startsWith(qualifier)&&part.length>qualifier.length)
    return part.slice(qualifier.length);
  return part;
 });
}
function deterministicIndex(value,count){
 let total=0;
 for(const character of String(value||''))total=(total+character.charCodeAt(0))>>>0;
 return count?total%count:0;
}
function facilityEdge(type,fromId,toId){
 return {type,fromId,toId,provenance:'MODELED_1999_OPENING_WORLD'};
}
export function completeApprovedFoundingHorseRelationships(horse,farms){
 if(!horse?.id||!Array.isArray(farms)||!farms.length)
  throw Error('Approved founding relationship assignment requires a horse and farms');
 if(horse.foundingRelationshipRevision===APPROVED_FOUNDING_RELATIONSHIP_REVISION)
  return horse;
 const farmById=new Map(farms.map(farm=>[farm.id,farm]));
 const careFarm=farmById.get(horse.careFacilityId);
 if(!careFarm)throw Error('Approved founding horse has no valid care farm: '+horse.id);
 const sourceBirthplace=horse.birthplace?{...horse.birthplace}:
  {city:null,region:null,country:null,farmId:null,provenance:'SOURCE_NOT_RECORDED'};
 const sourceFoalingId=horse.foalingFarmId||sourceBirthplace.farmId||null;
 const sourceBreederId=horse.breederId||horse.breederOrganizationId||
  horse.sourceRecord?.breederOrganizationId||null;
 const exactFoalingFarm=sourceFoalingId?farmById.get(sourceFoalingId)||null:null;
 const exactBreeder=sourceBreederId?farmById.get(sourceBreederId)||null:null;
 const sourceRegions=normalizedRegion(sourceBirthplace.region);
 const regionalFarms=farms.filter(farm=>{
  const regions=normalizedRegion(farm.location?.region);
  return sourceRegions.some(region=>regions.includes(region));
 }).sort((a,b)=>a.id.localeCompare(b.id));
 const proxyFarm=regionalFarms.length?
  regionalFarms[deterministicIndex(horse.id,regionalFarms.length)]:careFarm;
 const foalingFarm=exactFoalingFarm||proxyFarm;
 const breederFarm=exactBreeder||foalingFarm;
 const foalingRelationshipProvenance=exactFoalingFarm?
  'APPROVED_SOURCE_EXACT_FARM':regionalFarms.length?
   'MODELED_REGIONAL_FARM_PROXY':'MODELED_CARE_FACILITY_PROXY';
 const breederRelationshipProvenance=exactBreeder?
  'APPROVED_SOURCE_BREEDER_ORGANIZATION':'MODELED_FOALING_FARM_PROXY';
 const birthplace={city:foalingFarm.location?.city??null,
  region:foalingFarm.location?.region??null,
  country:foalingFarm.location?.country??null,
  farmId:foalingFarm.id,
  provenance:exactFoalingFarm?'APPROVED_SOURCE_EXACT_FOALING_FARM':
   regionalFarms.length?'MODELED_REGIONAL_FARM_PROXY':
   'MODELED_CARE_FACILITY_PROXY'};
 const relationships=(horse.relationships||[]).filter(edge=>
  edge.type!=='BRED_BY'&&edge.type!=='FOALED_AT');
 relationships.push(facilityEdge('BRED_BY',horse.id,breederFarm.id),
  facilityEdge('FOALED_AT',horse.id,foalingFarm.id));
 // On a fresh row, let connect1999Horse create relationships in its original
 // field position. Existing persisted rows already have this field, so the
 // migration replaces it in place and preserves legacy snapshot ordering.
 const relationshipField=Array.isArray(horse.relationships)?{relationships}:{};
 return {...horse,breederId:breederFarm.id,foalingFarmId:foalingFarm.id,
  birthplace,...relationshipField,
  foundingRelationshipBaseline:{
   breederId:horse.breederId??null,
   foalingFarmId:horse.foalingFarmId??null,
   birthplace:sourceBirthplace},
  foundingRelationshipRevision:APPROVED_FOUNDING_RELATIONSHIP_REVISION,
  breederRelationshipProvenance,foalingRelationshipProvenance};
}
/** Reconstruct the previous snapshot row while validating a legacy checkpoint. */
export function restoreLegacyApprovedFoundingHorseRelationships(horse){
 if(!horse?.foundingRelationshipBaseline)return horse;
 const {foundingRelationshipBaseline,foundingRelationshipRevision,
  breederRelationshipProvenance,foalingRelationshipProvenance,...legacy}=horse;
 legacy.breederId=foundingRelationshipBaseline.breederId??null;
 legacy.foalingFarmId=foundingRelationshipBaseline.foalingFarmId??null;
 legacy.birthplace=foundingRelationshipBaseline.birthplace?
  {...foundingRelationshipBaseline.birthplace}:
  {city:null,region:null,country:null,farmId:null,provenance:'SOURCE_NOT_RECORDED'};
 legacy.relationships=(legacy.relationships||[]).filter(edge=>
  edge.type!=='BRED_BY'&&edge.type!=='FOALED_AT');
 return legacy;
}
