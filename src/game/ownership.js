/**
 * WTW ownership runtime: game-run-only overlay on an approved immutable world.
 *
 * The accepted world supplies horses and owner organization IDs. This module
 * cannot invent owners, horses, pedigrees, race results or money. A sale may
 * only complete after a separate, valid finance ledger entry exists.
 *
 * The read index is cached on the world object (WeakMap, outside save data).
 * Changes to ownership are sparse deltas in the existing WTW_GAME_RUN_V1 save.
 */
import {ensure,isObject,requireString,validDate} from './contracts.js';
export const OWNERSHIP_RUNTIME_SCHEMA='WTW_RUN_HORSE_OWNERSHIP_V1';
export const OWNERSHIP_COMMANDS=Object.freeze([
 'ASSIGN_HORSE_OWNER','REQUEST_HORSE_TRANSFER',
 'CANCEL_HORSE_TRANSFER','COMMIT_HORSE_TRANSFER'
]);
const WORLD_INDEX=new WeakMap();
const REQUEST_TYPES=new Set(['GIFT','SALE']);
function indexWorld(world){
 let found=WORLD_INDEX.get(world);if(found)return found;
 const horseById=new Map(),ownerById=new Map(),baseline=new Map();
 for(const o of world.entities.organizations)ownerById.set(o.id,o);
 for(const horse of world.entities.horses){
  horseById.set(horse.id,horse);
  const id=sourceOwnerId(horse);
  if(id){if(!baseline.has(id))baseline.set(id,[]);baseline.get(id).push(horse.id)}
 }
 found={horseById,ownerById,baseline};
 WORLD_INDEX.set(world,found);return found;
}
function sourceOwnerId(horse){
 const value=horse.ownerId??horse.owner_id??null;
 return typeof value==='string'&&value?value:null;
}
export function createOwnershipRuntime(){
 return {schema:OWNERSHIP_RUNTIME_SCHEMA,owner_overrides:{},pending_transfers:{}};
}
export function currentHorseOwnerId(state,world,horseId){
 const horses=indexWorld(world).horseById;
 const horse=horses.get(horseId);
 ensure(Boolean(horse),'UNKNOWN_HORSE','Unknown approved horse '+horseId);
 return state.runtime.ownership?.owner_overrides?.[horseId]?.owner_id??sourceOwnerId(horse);
}
export function validateOwnershipRuntime(state,world){
 const runtime=state.runtime.ownership;
 if(runtime===undefined)return; // backwards-compatible older WTW_GAME_RUN_V1 saves
 ensure(isObject(runtime)&&runtime.schema===OWNERSHIP_RUNTIME_SCHEMA&&
  isObject(runtime.owner_overrides)&&isObject(runtime.pending_transfers),
  'OWNERSHIP_RUNTIME','Invalid ownership runtime structure');
 const {horseById,ownerById}=indexWorld(world);
 for(const [horseId,override] of Object.entries(runtime.owner_overrides)){
  ensure(horseById.has(horseId)&&isObject(override)&&
   typeof override.owner_id==='string'&&ownerById.has(override.owner_id)&&
   typeof override.changed_on==='string'&&validDate(override.changed_on)&&
   override.changed_on<=state.clock.date &&
   ['INITIAL_ASSIGNMENT','GAMEPLAY_TRANSFER'].includes(override.kind),
   'OWNERSHIP_RUNTIME','Invalid horse-owner delta '+horseId);
  if(override.kind==='INITIAL_ASSIGNMENT')
   ensure(!sourceOwnerId(horseById.get(horseId)),'CANON_OWNER_LOCK',
    'Cannot replace a source owner with an initial assignment');
 }
 for(const [requestId,request] of Object.entries(runtime.pending_transfers)){
  ensure(isObject(request)&&request.request_id===requestId&&
   typeof request.horse_id==='string'&&horseById.has(request.horse_id)&&
   typeof request.from_owner_id==='string'&&ownerById.has(request.from_owner_id)&&
   typeof request.to_owner_id==='string'&&ownerById.has(request.to_owner_id)&&
   request.from_owner_id!==request.to_owner_id&&
   REQUEST_TYPES.has(request.transfer_type)&&
   validDate(request.requested_on)&&request.requested_on<=state.clock.date,
   'OWNERSHIP_RUNTIME','Invalid pending ownership transfer');
  ensure(currentHorseOwnerId(state,world,request.horse_id)===request.from_owner_id,
   'STALE_HORSE_OWNER','Pending transfer no longer belongs to original owner');
 }
}
function verifyOrg(world,id){
 requireString(id,'owner_id',128);
 ensure(indexWorld(world).ownerById.has(id),'UNKNOWN_OWNER',
  'Owner is not an approved organization '+id);
}
function verifyHorse(world,id){
 requireString(id,'horse_id',128);
 ensure(indexWorld(world).horseById.has(id),'UNKNOWN_HORSE',
  'Horse is not in the accepted world snapshot '+id);
}
function ownership(state){return state.runtime.ownership??(state.runtime.ownership=createOwnershipRuntime())}
function validRequestId(id){
 requireString(id,'request_id',128);
 ensure(!['__proto__','constructor','prototype'].includes(id)&&/^[A-Za-z0-9][A-Za-z0-9:_-]{1,127}$/.test(id),
  'INVALID_REQUEST_ID','Transfer request ID must be stable and namespaced');
}
export function ownershipAction({state,world,command,emit}){
 const {type,actor,payload:p}=command;
 const rt=ownership(state);
 if(type==='ASSIGN_HORSE_OWNER'){
  ensure(actor==='system','UNAUTHORIZED_COMMAND','Only game authoring can assign a previously unowned accepted horse');
  verifyHorse(world,p.horse_id);verifyOrg(world,p.owner_id);
  ensure(currentHorseOwnerId(state,world,p.horse_id)===null,
   'HORSE_ALREADY_OWNED','Cannot overwrite historical or existing ownership');
  rt.owner_overrides[p.horse_id]={
   owner_id:p.owner_id,changed_on:state.clock.date,kind:'INITIAL_ASSIGNMENT'
  };
  if(state.player.role==='owner'&&state.player.operation_id===p.owner_id&&
   !state.stable_horse_ids.includes(p.horse_id))state.stable_horse_ids.push(p.horse_id);
  emit('HORSE_OWNER_ASSIGNED',{horse_id:p.horse_id,owner_id:p.owner_id,
   scope:'GAME_RUN_ONLY__CANON_UNCHANGED'});
 }else if(type==='REQUEST_HORSE_TRANSFER'){
  ensure(actor==='player','UNAUTHORIZED_COMMAND','Only player can request a transfer');
  ensure(state.player.role==='owner'&&Boolean(state.player.operation_id),
   'UNAUTHORIZED_COMMAND','Only owner-role player with an approved operation may request an outgoing transfer');
  verifyHorse(world,p.horse_id);verifyOrg(world,p.to_owner_id);
  validRequestId(p.request_id);
  const from=currentHorseOwnerId(state,world,p.horse_id);
  ensure(from===state.player.operation_id,'NOT_HORSE_OWNER','You can only transfer a horse owned by your operation');
  ensure(from!==p.to_owner_id,'INVALID_TRANSFER','Cannot transfer a horse to its current owner');
  ensure(!rt.pending_transfers[p.request_id],'DUPLICATE_REQUEST','Transfer request already exists');
  ensure(!Object.values(rt.pending_transfers).some(x=>x.horse_id===p.horse_id),
   'PENDING_TRANSFER','Horse already has an unresolved transfer request');
  ensure(REQUEST_TYPES.has(p.transfer_type),'INVALID_TRANSFER','Transfer must be a GIFT or SALE');
  rt.pending_transfers[p.request_id]={
   request_id:p.request_id,horse_id:p.horse_id,
   from_owner_id:from,to_owner_id:p.to_owner_id,
   transfer_type:p.transfer_type,requested_on:state.clock.date
  };
  emit('HORSE_TRANSFER_REQUESTED',rt.pending_transfers[p.request_id]);
 }else if(type==='CANCEL_HORSE_TRANSFER'){
  validRequestId(p.request_id);
  const request=rt.pending_transfers[p.request_id];
  ensure(Boolean(request),'UNKNOWN_TRANSFER','No such pending ownership transfer');
  ensure(actor==='system'||actor==='player'&&
   state.player.role==='owner'&&state.player.operation_id===request.from_owner_id,
   'UNAUTHORIZED_COMMAND','Only the selling owner or game system can cancel this request');
  delete rt.pending_transfers[p.request_id];
  emit('HORSE_TRANSFER_CANCELLED',{request_id:p.request_id,horse_id:request.horse_id});
 }else if(type==='COMMIT_HORSE_TRANSFER'){
  ensure(actor==='system','UNAUTHORIZED_COMMAND','Only the verified game transaction system can commit ownership changes');
  validRequestId(p.request_id);
  const request=rt.pending_transfers[p.request_id];
  ensure(Boolean(request),'UNKNOWN_TRANSFER','No such pending ownership transfer');
  const current=currentHorseOwnerId(state,world,request.horse_id);
  ensure(current===request.from_owner_id,'STALE_HORSE_OWNER','Horse changed owner since transfer request');
  if(request.transfer_type==='SALE'){
   requireString(p.finance_ledger_id,'finance_ledger_id',128);
   const posted=state.runtime.finances.ledger.find(line=>
    line.id===p.finance_ledger_id&&line.horse_id===request.horse_id&&
    line.from_owner_id===request.from_owner_id&&line.to_owner_id===request.to_owner_id&&
    line.settlement_status==='POSTED');
   ensure(Boolean(posted),'FINANCE_NOT_SETTLED',
    'Cannot transfer a sold horse without a posted matching settlement');
  }else{
   ensure(p.finance_ledger_id===undefined,'INVALID_TRANSFER',
    'Gift transfer cannot declare a paid sale settlement');
  }
  rt.owner_overrides[request.horse_id]={
   owner_id:request.to_owner_id,changed_on:state.clock.date,
   kind:'GAMEPLAY_TRANSFER'
  };
  delete rt.pending_transfers[p.request_id];
  if(state.player.role==='owner'&&state.player.operation_id){
   if(state.player.operation_id===request.from_owner_id)
    state.stable_horse_ids=state.stable_horse_ids.filter(id=>id!==request.horse_id);
   else if(state.player.operation_id===request.to_owner_id&&
    !state.stable_horse_ids.includes(request.horse_id))
    state.stable_horse_ids.push(request.horse_id);
  }
  emit('HORSE_OWNERSHIP_TRANSFERRED',{
   horse_id:request.horse_id,from_owner_id:request.from_owner_id,
   to_owner_id:request.to_owner_id,request_id:p.request_id,
   transfer_type:request.transfer_type,
   finance_ledger_id:p.finance_ledger_id??null,
   scope:'GAME_RUN_ONLY__CANON_UNCHANGED'
  });
 }else throw Error('Unsupported ownership action '+type);
}
/**
 * Paged owner view: one shared canonical horse index, sparse career deltas.
 * First use costs O(horses). Later reads examine only this owner's base
 * membership and the small transfer overlay, never full profile records.
 */
export function getOwnerPortfolioView(state,world,ownerId,{offset=0,limit=30}={}){
 verifyOrg(world,ownerId);
 ensure(Number.isInteger(offset)&&offset>=0&&Number.isInteger(limit)&&limit>=0&&limit<=100,
  'INVALID_PAGING','Owner portfolio page must be 0..100 horses');
 const index=indexWorld(world),base=index.baseline.get(ownerId)||[],
  overlays=state.runtime.ownership?.owner_overrides||{};
 const baseSet=new Set(base);
 const ids=base.filter(id=>!Object.hasOwn(overlays,id)||overlays[id].owner_id===ownerId);
 for(const [horseId,change] of Object.entries(overlays)){
  if(change.owner_id===ownerId&&!baseSet.has(horseId))ids.push(horseId);
 }
 const items=ids.slice(offset,offset+limit).map(id=>{
  const horse=index.horseById.get(id);
  return {id,name:horse.name,owner_id:ownerId,
   canonical_owner_id:sourceOwnerId(horse),
   ownership_overridden:Object.hasOwn(overlays,id)};
 });
 return {owner_id:ownerId,total:ids.length,offset,limit,items,
  source:'APPROVED_WORLD_PLUS_GAME_RUN_OWNERSHIP_DELTAS'};
}
