/**
 * WIRE TO WIRE — SOURCE-ONLY founding ancestry read model.
 *
 * Descendants, old winners and ancestors are NEVER imported into the living
 * 1999 horse roster simply because they exist in the historical archive.
 * Only traceable parents of this scenario's horses / explicit farm-linked
 * historical anchors can enter this read-only, five-generation lookup.
 *
 * Do not supply fictional parent names, retroactive race outcomes or pedigree
 * corrections. Missing source links remain identified gaps.
 */
import {openingWorld1999 as canon} from './canon-mini.mjs';

export const FOUNDING_ANCESTRY_SCHEMA='WTW_1999_FOUNDING_SOURCE_PEDIGREE_CLOSURE_V1';
const sourceGroups=[
 ['HISTORICAL_PEDIGREE',canon.pedigreeNodes],
 ['OPENING_RACER',canon.horses],
 ['SOURCE_STALLION',canon.activeStallions1999],
 ['SOURCE_MARE',canon.foundationalBroodmares1999],
 ['SOURCE_BOARDING_MARE',canon.productionBroodmareBoarding1999]
];
const clean=x=>String(x||'').trim();
function sourceRegistry(){
 const registry=new Map(),conflicts=[];
 for(const [kind,rows] of sourceGroups)for(const raw of rows){
  const id=clean(raw?.id);if(!id)continue;
  if(!registry.has(id)){registry.set(id,{...raw,sourceKind:kind});continue;}
  const prev=registry.get(id);
  if(clean(prev.name)&&clean(raw.name)&&prev.name!==raw.name)
   conflicts.push({id,firstName:prev.name,secondName:raw.name,firstSource:prev.sourceKind,secondSource:kind});
  // The pedigree register normally has the authoritative historic sex/parents.
  // Fill absent fields from ancillary source rows but do not overwrite history.
  for(const key of ['name','foalYear','sex','sireId','damId'])
   if((prev[key]==null||prev[key]==='')&&raw[key]!=null&&raw[key]!=='')
    prev[key]=raw[key];
 }
 return {registry,conflicts};
}
export function buildFoundingAncestry1999({
 livingHorses=[],historicalHorses=[],generations=5
}={}){
 if(!Number.isInteger(generations)||generations<1||generations>8)
  throw Error('Founding pedigree must trace one to eight generations');
 const {registry,conflicts}=sourceRegistry();
 const livingIds=new Set(livingHorses.map(h=>h.id));
 const roots=new Map();
 for(const horse of [...livingHorses,...historicalHorses]){
  if(!clean(horse?.id))continue;
  const id=horse.id,known=registry.get(id);
  if(!roots.has(id)){
   const merged={...(known||{})};
   // Some yearbook summaries carry null pedigree fields despite a proper
   // pedigree node existing; never let null erase real parent IDs.
   for(const [key,value] of Object.entries(horse))
    if(value!==undefined&&value!==null&&value!=='')merged[key]=value;
   roots.set(id,{...merged,sourceKind:known?.sourceKind||'SELECTED_HISTORICAL_ANCHOR'});
  }
 }
 const found=new Map(),edges=[],missingById=new Map(),unrecorded=[];
 const queue=[...roots.values()].map(h=>({horse:h,depth:0}));
 while(queue.length){
  const {horse,depth}=queue.shift();
  const id=clean(horse.id);if(!id)continue;
  const known=registry.get(id),record=depth===0?{...known,...horse}:{...known};
  const previous=found.get(id);
  if(previous&&previous.depth<=depth)continue;
  const sireId=clean(record.sireId),damId=clean(record.damId);
  found.set(id,{id,name:record.name||null,foalYear:record.foalYear??null,
   sex:record.sex||null,sireId:sireId||null,damId:damId||null,
   sourceKind:record.sourceKind||'SELECTED_HISTORICAL_ANCHOR',
   depth,activeIn1999:livingIds.has(id),
   basis:known?'EXACT_ID_IN_SOURCE_PEDIGREE_OR_OPENING_ROSTER':
    'SELECTED_HISTORICAL_HORSE_YEAR_ONLY__PARENTS_NOT_IN_LOCAL_SOURCE'});
  if(depth>=generations)continue;
  if(!sireId&&!damId)unrecorded.push({horseId:id,depth,
   status:'SOURCE_HAS_NO_FURTHER_NAMED_PARENTS'});
  for(const [role,parentId] of [['SIRE',sireId],['DAM',damId]]){
   if(!parentId)continue;
   const parent=registry.get(parentId);
   if(!parent){
    if(!missingById.has(parentId))missingById.set(parentId,{id:parentId,referredBy:[]});
    missingById.get(parentId).referredBy.push({childId:id,role});
    continue;
   }
   const chronologyOk=!(Number.isInteger(record.foalYear)&&
    Number.isInteger(parent.foalYear)&&parent.foalYear>=record.foalYear);
   edges.push({childId:id,parentId,role,generation:depth+1,
    source:'EXACT_HISTORICAL_PARENT_ID',chronologyOk});
   queue.push({horse:parent,depth:depth+1});
  }
 }
 const records=[...found.values()].sort((a,b)=>a.depth-b.depth||a.id.localeCompare(b.id));
 return {schema:FOUNDING_ANCESTRY_SCHEMA,generations,
  livingRootCount:livingIds.size,historicalRootCount:roots.size-livingIds.size,
  records,edges,missingNamedParents:[...missingById.values()],
  noFurtherParentEvidence:unrecorded,
  identityNameConflicts:conflicts.filter(c=>found.has(c.id)),
  audit:{rootCount:roots.size,totalReachableRecords:records.length,
   historicalReadOnlyRecords:records.filter(h=>!h.activeIn1999).length,
   connectedParentEdges:edges.length,missingNamedParentIds:missingById.size,
   sourceChronologyConflicts:edges.filter(e=>!e.chronologyOk).length,
   unselectedHistoricPopulationIsNotPlayable:true,
   historicResultsUnmodified:true}};
}
