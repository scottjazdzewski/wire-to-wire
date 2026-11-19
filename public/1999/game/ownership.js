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
 'CANCEL_HORSE_TRANSFER','COMMIT_HORSE_TRANSFER','SETTLE_HORSE_SALE',
 'LIST_HORSE_FOR_SALE','BUY_LISTED_HORSE','CANCEL_HORSE_LISTING'
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
 return {schema:OWNERSHIP_RUNTIME_SCHEMA,owner_overrides:{},pending_transfers:{},
  market_listings:{}};
}
export function currentHorseOwnerId(state,world,horseId){
 const gameHorse=state.runtime.registered_horses?.by_id?.[horseId];
 if(gameHorse)return gameHorse.owner_organization_id;
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
 const registered=state.runtime.registered_horses?.by_id||{};
 const knownHorse=id=>horseById.has(id)||Object.hasOwn(registered,id);
 for(const [horseId,override] of Object.entries(runtime.owner_overrides)){
  ensure(knownHorse(horseId)&&isObject(override)&&
   typeof override.owner_id==='string'&&ownerById.has(override.owner_id)&&
   typeof override.changed_on==='string'&&validDate(override.changed_on)&&
   override.changed_on<=state.clock.date &&
   ['INITIAL_ASSIGNMENT','GAMEPLAY_TRANSFER'].includes(override.kind),
   'OWNERSHIP_RUNTIME','Invalid horse-owner delta '+horseId);
  if(override.kind==='INITIAL_ASSIGNMENT')
   ensure(horseById.has(horseId)&&!sourceOwnerId(horseById.get(horseId)),
    'CANON_OWNER_LOCK','Cannot replace an existing registered or source owner');
  if(Object.hasOwn(registered,horseId))
   ensure(override.kind==='GAMEPLAY_TRANSFER'&&
    registered[horseId].owner_organization_id===override.owner_id,
    'OWNERSHIP_RUNTIME','Registered career owner and transfer delta disagree');
 }
 for(const [requestId,request] of Object.entries(runtime.pending_transfers)){
  ensure(isObject(request)&&request.request_id===requestId&&
   typeof request.horse_id==='string'&&knownHorse(request.horse_id)&&
   typeof request.from_owner_id==='string'&&ownerById.has(request.from_owner_id)&&
   typeof request.to_owner_id==='string'&&ownerById.has(request.to_owner_id)&&
   request.from_owner_id!==request.to_owner_id&&
   REQUEST_TYPES.has(request.transfer_type)&&
   (request.price_minor===undefined||request.transfer_type==='SALE'&&
    Number.isSafeInteger(request.price_minor)&&request.price_minor>0&&
    request.price_minor<=1000000000000)&&
   validDate(request.requested_on)&&request.requested_on<=state.clock.date,
   'OWNERSHIP_RUNTIME','Invalid pending ownership transfer');
  ensure(currentHorseOwnerId(state,world,request.horse_id)===request.from_owner_id,
   'STALE_HORSE_OWNER','Pending transfer no longer belongs to original owner');
 }
 const listings=runtime.market_listings||{};
 ensure(isObject(listings),'HORSE_MARKET','Invalid horse-market listing store');
 for(const [id,l] of Object.entries(listings)){
  ensure(isObject(l)&&l.listing_id===id&&
   typeof l.horse_id==='string'&&knownHorse(l.horse_id)&&
   typeof l.seller_id==='string'&&ownerById.has(l.seller_id)&&
   Number.isSafeInteger(l.price_minor)&&l.price_minor>0&&
   l.price_minor<=1000000000000&&
   validDate(l.listed_on)&&l.listed_on<=state.clock.date&&
   validDate(l.expires_on)&&l.expires_on>=l.listed_on&&
   ['OPEN','SOLD','CANCELLED'].includes(l.status),
   'HORSE_MARKET','Invalid listing identity, price or dates');
  if(l.status==='OPEN')ensure(currentHorseOwnerId(state,world,l.horse_id)===l.seller_id,
   'HORSE_MARKET','Open horse listing no longer belongs to seller');
  if(l.status==='SOLD')ensure(
   typeof l.buyer_id==='string'&&ownerById.has(l.buyer_id)&&
   validDate(l.sold_on)&&l.sold_on<=state.clock.date&&
   typeof l.settlement_transaction_id==='string',
   'HORSE_MARKET','Invalid sale closure and financial receipt');
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
function ensureNoRegisteredSourceAlias(state,id){
 // An admitted source H-ID is a historical identity; ownership of that
 // physical horse must pass through its sole active H-GAME registration.
 ensure(!Object.values(state.runtime.registered_horses?.by_id||{}).
  some(h=>h.world_source_horse_id===id),
  'HORSE_REGISTERED_ALIAS','Use the admitted game horse ID for ownership transfers');
}
function verifyTransferHorse(state,world,id){
 requireString(id,'horse_id',128);
 ensure(indexWorld(world).horseById.has(id)||
  Object.hasOwn(state.runtime.registered_horses?.by_id||{},id),
  'UNKNOWN_HORSE','Horse must exist in approved world or active registered career');
 ensureNoRegisteredSourceAlias(state,id);
}
function ensureCareerHorseTransferReady(state,id){
 const h=state.runtime.registered_horses?.by_id?.[id];
 if(!h)return;
 const trip=state.runtime.racing?.horse_travel?.[id];
 ensure(!trip||!['OUTBOUND','RETURNING','AT_DESTINATION'].includes(trip.status),
  'HORSE_TRANSFER_IN_TRANSIT','A traveling horse must arrive before changing ownership');
 ensure(state.runtime.horse?.[id]?.race_preparation?.status!=='ACTIVE',
  'HORSE_TRANSFER_RACE_PREP','Complete or cancel approved race preparation before transferring ownership');
 ensure(!state.runtime.trainer_employment?.by_horse?.[id],
  'HORSE_TRANSFER_TRAINER_OFFER','Resolve an accepted trainer change before transferring ownership');
 ensure(!state.runtime.trainer_management_requests?.training_orders?.[id],
  'HORSE_TRANSFER_TRAINER_ORDER','Resolve an active owner trainer order before changing ownership');
 ensure(!Object.values(state.runtime.entries||{}).some(e=>
  e?.horse_id===id&&['BOOKED','ENTERED'].includes(e.status)&&
  !['OFFICIAL_SIM_RESULT','CANCELLED_INSUFFICIENT_FIELD'].includes(
   state.runtime.races?.[e.race_id]?.status)),
  'HORSE_TRANSFER_RACE_ENTRY','Resolve current race commitments before a change of owner');
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
 if(type==='LIST_HORSE_FOR_SALE'){
  verifyTransferHorse(state,world,p.horse_id);
  validRequestId(p.listing_id);verifyOrg(world,p.seller_id);
  ensure(p.listing_id.length<=110,'HORSE_MARKET','Listing ID must support a stable request receipt');
  ensure(actor==='player'&&
   ['owner','breeder','farm'].includes(state.player.role)&&
   state.player.operation_id===p.seller_id||
   actor==='system'&&p.seller_id!==state.player.operation_id,
   'HORSE_MARKET_PERMISSION','Only the legal seller or rival AI can authorize a listing');
  ensure(currentHorseOwnerId(state,world,p.horse_id)===p.seller_id,
   'NOT_HORSE_OWNER','Management and boarding are not legal title');
  ensureCareerHorseTransferReady(state,p.horse_id);
  ensure(Number.isSafeInteger(p.price_minor)&&p.price_minor>0&&
   p.price_minor<=1000000000000,
   'HORSE_SALE_PRICE','A listing must state a funded sale price in cents');
  ensure(validDate(p.expires_on)&&p.expires_on>=state.clock.date,
   'HORSE_MARKET_DATE','Sale listing must expire on or after today');
  const listings=rt.market_listings||(rt.market_listings={});
  ensure(!Object.hasOwn(listings,p.listing_id)&&
   !Object.values(listings).some(l=>l.horse_id===p.horse_id&&l.status==='OPEN')&&
   !Object.values(rt.pending_transfers).some(x=>x.horse_id===p.horse_id),
   'HORSE_MARKET_DUPLICATE','A horse can have only one open sale commitment');
  listings[p.listing_id]={listing_id:p.listing_id,
   horse_id:p.horse_id,seller_id:p.seller_id,price_minor:p.price_minor,
   listed_on:state.clock.date,expires_on:p.expires_on,status:'OPEN'};
  emit('HORSE_SALE_LISTED',{...listings[p.listing_id]});
 }else if(type==='CANCEL_HORSE_LISTING'){
  validRequestId(p.listing_id);
  const l=rt.market_listings?.[p.listing_id];
  ensure(l&&l.status==='OPEN','HORSE_MARKET','Only open listings can be cancelled');
  ensure(actor==='system'||actor==='player'&&
   ['owner','breeder','farm'].includes(state.player.role)&&
   state.player.operation_id===l.seller_id,
   'HORSE_MARKET_PERMISSION','Only the legal selling operation may withdraw');
  l.status='CANCELLED';l.cancelled_on=state.clock.date;
  emit('HORSE_SALE_LISTING_CANCELLED',{listing_id:l.listing_id,
   horse_id:l.horse_id,seller_id:l.seller_id});
 }else if(type==='BUY_LISTED_HORSE'){
  ensure(actor==='player'&&Boolean(state.player.operation_id)&&
   ['owner','farm','breeder'].includes(state.player.role),
   'HORSE_MARKET_PERMISSION','A buyer must control an actual operating business');
  validRequestId(p.listing_id);validRequestId(p.settlement_id);
  const l=rt.market_listings?.[p.listing_id];
  ensure(l&&l.status==='OPEN'&&l.expires_on>=state.clock.date,
   'HORSE_MARKET','An active seller-approved listing is required');
  ensure(state.player.operation_id!==l.seller_id,
   'HORSE_MARKET','A seller cannot buy its own horse');
  verifyTransferHorse(state,world,l.horse_id);
  ensure(currentHorseOwnerId(state,world,l.horse_id)===l.seller_id,
   'STALE_HORSE_OWNER','Seller no longer owns the listed horse');
  ensureCareerHorseTransferReady(state,l.horse_id);
  const requestId='MARKET:'+l.listing_id;
  ensure(!Object.hasOwn(rt.pending_transfers,requestId)&&
   !Object.values(rt.pending_transfers).some(x=>x.horse_id===l.horse_id),
   'HORSE_MARKET','A live transfer already uses this horse');
  rt.pending_transfers[requestId]={request_id:requestId,
   horse_id:l.horse_id,from_owner_id:l.seller_id,
   to_owner_id:state.player.operation_id,transfer_type:'SALE',
   requested_on:state.clock.date,price_minor:l.price_minor};
  ownershipAction({state,world,command:{...command,
   type:'SETTLE_HORSE_SALE',actor:'system',payload:{
    request_id:requestId,settlement_id:p.settlement_id}},emit});
  l.status='SOLD';l.sold_on=state.clock.date;
  l.buyer_id=state.player.operation_id;
  l.settlement_transaction_id='HORSE_SALE:'+p.settlement_id;
  emit('HORSE_LISTING_SOLD',{listing_id:l.listing_id,
   horse_id:l.horse_id,seller_id:l.seller_id,buyer_id:l.buyer_id,
   price_minor:l.price_minor,transaction_id:l.settlement_transaction_id});
 }else if(type==='ASSIGN_HORSE_OWNER'){
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
  verifyTransferHorse(state,world,p.horse_id);verifyOrg(world,p.to_owner_id);
  validRequestId(p.request_id);
  const from=currentHorseOwnerId(state,world,p.horse_id);
  ensure(from===state.player.operation_id,'NOT_HORSE_OWNER','You can only transfer a horse owned by your operation');
  ensure(from!==p.to_owner_id,'INVALID_TRANSFER','Cannot transfer a horse to its current owner');
  ensure(!rt.pending_transfers[p.request_id],'DUPLICATE_REQUEST','Transfer request already exists');
  ensure(!Object.values(rt.pending_transfers).some(x=>x.horse_id===p.horse_id),
   'PENDING_TRANSFER','Horse already has an unresolved transfer request');
  ensure(REQUEST_TYPES.has(p.transfer_type),'INVALID_TRANSFER','Transfer must be a GIFT or SALE');
  if(p.transfer_type==='SALE')ensure(Number.isSafeInteger(p.price_minor)&&
   p.price_minor>0&&p.price_minor<=1000000000000,
   'HORSE_SALE_PRICE','Seller must approve a positive sale price in cents');
  else ensure(p.price_minor===undefined,'INVALID_TRANSFER','A gift cannot set a sale price');
  rt.pending_transfers[p.request_id]={
   request_id:p.request_id,horse_id:p.horse_id,
   from_owner_id:from,to_owner_id:p.to_owner_id,
   transfer_type:p.transfer_type,requested_on:state.clock.date,
   ...(p.transfer_type==='SALE'?{price_minor:p.price_minor}:{})
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
 }else if(type==='SETTLE_HORSE_SALE'){
  ensure(actor==='system','UNAUTHORIZED_COMMAND','Only the game transaction service may settle a horse sale');
  validRequestId(p.request_id);validRequestId(p.settlement_id);
  const request=rt.pending_transfers[p.request_id];
  ensure(Boolean(request)&&request.transfer_type==='SALE','UNKNOWN_SALE','A pending horse sale is required');
  ensureNoRegisteredSourceAlias(state,request.horse_id);
  ensure(currentHorseOwnerId(state,world,request.horse_id)===request.from_owner_id,
   'STALE_HORSE_OWNER','Seller no longer owns the horse');
  ensureCareerHorseTransferReady(state,request.horse_id);
  ensure(Number.isSafeInteger(request.price_minor)&&request.price_minor>0,
   'HORSE_SALE_PRICE','Seller must have agreed a price');
  const accounts=state.runtime.finances.operation_balances_minor||{};
  const buyer=request.to_owner_id,seller=request.from_owner_id,price=request.price_minor;
  ensure(Number.isSafeInteger(accounts[buyer])&&accounts[buyer]>=price&&
   Number.isSafeInteger(accounts[seller])&&Number.isSafeInteger(accounts[seller]+price),
   'HORSE_SALE_FUNDS','Buyer must have funds and both owners need established accounts');
  const transaction='HORSE_SALE:'+p.settlement_id;
  ensure(!state.runtime.finances.ledger.some(l=>l.transaction_id===transaction),
   'HORSE_SALE_DUPLICATE','Settlement transaction was already used');
  accounts[buyer]-=price;accounts[seller]+=price;
  if(state.player.operation_id===buyer)state.runtime.finances.balance_minor=accounts[buyer];
  if(state.player.operation_id===seller)state.runtime.finances.balance_minor=accounts[seller];
  for(const [org,kind,amount] of [
   [buyer,'HORSE_SALE_BUYER_PAYMENT',-price],
   [seller,'HORSE_SALE_SELLER_RECEIPT',price]
  ])state.runtime.finances.ledger.push({
   date:state.clock.date,transaction_id:transaction,request_id:request.request_id,
   operation_id:org,horse_id:request.horse_id,
   from_owner_id:seller,to_owner_id:buyer,amount_minor:amount,
   kind,settlement_status:'POSTED',price_minor:price
  });
  emit('HORSE_SALE_CASH_SETTLED',{request_id:request.request_id,
   transaction_id:transaction,horse_id:request.horse_id,
   buyer_id:buyer,seller_id:seller,price_minor:price,net_minor:0});
  // Reuse the existing audited transfer, roster, and saved ownership update.
  ownershipAction({state,world,command:{...command,
   type:'COMMIT_HORSE_TRANSFER',payload:{
    request_id:p.request_id,finance_ledger_id:transaction}},emit});
 }else if(type==='COMMIT_HORSE_TRANSFER'){
  ensure(actor==='system','UNAUTHORIZED_COMMAND','Only the verified game transaction system can commit ownership changes');
  validRequestId(p.request_id);
  const request=rt.pending_transfers[p.request_id];
  ensure(Boolean(request),'UNKNOWN_TRANSFER','No such pending ownership transfer');
  ensureNoRegisteredSourceAlias(state,request.horse_id);
  const current=currentHorseOwnerId(state,world,request.horse_id);
  ensure(current===request.from_owner_id,'STALE_HORSE_OWNER','Horse changed owner since transfer request');
  ensureCareerHorseTransferReady(state,request.horse_id);
  if(request.transfer_type==='SALE'){
   requireString(p.finance_ledger_id,'finance_ledger_id',128);
   const legs=state.runtime.finances.ledger.filter(line=>
    line.transaction_id===p.finance_ledger_id&&line.request_id===request.request_id&&
    line.horse_id===request.horse_id&&
    line.from_owner_id===request.from_owner_id&&line.to_owner_id===request.to_owner_id&&
    line.settlement_status==='POSTED');
   const price=request.price_minor;
   ensure(Number.isSafeInteger(price)&&price>0&&legs.length===2&&
    legs.some(x=>x.kind==='HORSE_SALE_BUYER_PAYMENT'&&
     x.operation_id===request.to_owner_id&&x.amount_minor===-price)&&
    legs.some(x=>x.kind==='HORSE_SALE_SELLER_RECEIPT'&&
     x.operation_id===request.from_owner_id&&x.amount_minor===price)&&
    legs.reduce((n,x)=>n+x.amount_minor,0)===0,
    'FINANCE_NOT_SETTLED','A sale requires posted matching buyer and seller cash entries');
  }else{
   ensure(p.finance_ledger_id===undefined,'INVALID_TRANSFER',
    'Gift transfer cannot declare a paid sale settlement');
  }
  rt.owner_overrides[request.horse_id]={
   owner_id:request.to_owner_id,changed_on:state.clock.date,
   kind:'GAMEPLAY_TRANSFER'
  };
  const registered=state.runtime.registered_horses?.by_id?.[request.horse_id];
  if(registered){
   const trainer=registered.trainer_id;
   registered.owner_organization_id=request.to_owner_id;
   // Welfare and physical residency stay with the same actual animal; the
   // new owner receives a fresh monthly spending ceiling, not old invoices.
   const care=state.runtime.horse?.[request.horse_id];
   if(care?.finance){
    const previousSpent=care.finance.spent_minor;
    care.finance.spent_minor=0;
    emit('HORSE_CARE_BUDGET_TRANSFERRED',{
     horse_id:request.horse_id,from_owner_id:request.from_owner_id,
     to_owner_id:request.to_owner_id,previous_owner_month_spent_minor:previousSpent,
     facility_id:registered.current_residence_id,trainer_id:trainer});
   }
   // A trainer's former client stops paying after selling their last horse;
   // other owners using the same trainer are not terminated.
   const oldPair=request.from_owner_id+'|'+trainer;
   const contract=state.runtime.trainer_contracts?.by_pair?.[oldPair];
   if(contract?.status==='ACTIVE'&&
    !Object.values(state.runtime.registered_horses.by_id).some(h=>
     h.owner_organization_id===request.from_owner_id&&h.trainer_id===trainer)){
    contract.status='TERMINATED';contract.ended_on=state.clock.date;
    contract.pending=null;
    contract.last_review_reason='OWNER_TRANSFERRED_LAST_TRAINED_HORSE';
    emit('TRAINER_SERVICE_RELATIONSHIP_ENDED',{
     owner_id:request.from_owner_id,trainer_id:trainer,
     horse_id:request.horse_id,ended_on:state.clock.date,
     reason:contract.last_review_reason,other_owners_unaffected:true});
   }
  }
  delete rt.pending_transfers[p.request_id];
  for(const listing of Object.values(rt.market_listings||{})){
   if(listing.horse_id===request.horse_id&&listing.status==='OPEN'&&
    'MARKET:'+listing.listing_id!==p.request_id){
    listing.status='CANCELLED';listing.cancelled_on=state.clock.date;
    emit('HORSE_SALE_LISTING_CANCELLED',{listing_id:listing.listing_id,
     horse_id:listing.horse_id,reason:'LEGAL_OWNER_CHANGED'});
   }
  }
  if(['owner','breeder','farm'].includes(state.player.role)&&state.player.operation_id){
   const playerId=state.player.operation_id;
   const registered=state.runtime.registered_horses?.by_id?.[request.horse_id];
   const source=indexWorld(world).horseById.get(
    registered?.world_source_horse_id||request.horse_id);
   // A horse sold by its legal owner may remain in the same business's
   // MANAGED, BOARDED, TRAINED, BRED or FOALED_AT inventory.
   const stillManaged=Boolean(source&&[
    source.managementOrganizationId,source.careFacilityId,source.trainingBarnId,
    source.breederId,source.foalingFarmId].includes(playerId));
   if(playerId===request.from_owner_id&&!stillManaged)
    state.stable_horse_ids=state.stable_horse_ids.filter(id=>id!==request.horse_id);
   else if(playerId===request.to_owner_id&&
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
 const registered=state.runtime.registered_horses?.by_id||{};
 // A world-source H-ID and its registered H-GAME career record describe the
 // same physical animal. Never double-count both identities in owner rosters.
 const representedSources=new Set(Object.values(registered).
  map(h=>h.world_source_horse_id).filter(Boolean));
 const ids=[],seen=new Set();
 const append=id=>{if(!seen.has(id)){seen.add(id);ids.push(id)}};
 for(const id of base)
  if(!representedSources.has(id)&&
   (!Object.hasOwn(overlays,id)||overlays[id].owner_id===ownerId))append(id);
 for(const [horseId,change] of Object.entries(overlays))
  if(change.owner_id===ownerId&&!representedSources.has(horseId))append(horseId);
 for(const h of Object.values(registered))
  if(h.owner_organization_id===ownerId)append(h.horse_id);
 if(Object.keys(registered).length)ids.sort((a,b)=>(index.horseById.get(a)?.name||registered[a]?.registered_name||'')
  .localeCompare(index.horseById.get(b)?.name||registered[b]?.registered_name||'')||a.localeCompare(b));
 const items=ids.slice(offset,offset+limit).map(id=>{
  const horse=index.horseById.get(id)||registered[id];
  return {id,name:horse.name,owner_id:ownerId,
   canonical_owner_id:horse.world_source_horse_id?
    sourceOwnerId(index.horseById.get(horse.world_source_horse_id)||horse):
    horse.owner_organization_id??sourceOwnerId(horse),
   ownership_overridden:Object.hasOwn(overlays,id)};
 });
 return {owner_id:ownerId,total:ids.length,offset,limit,items,
  source:'APPROVED_WORLD_PLUS_GAME_RUN_OWNERSHIP_DELTAS'};
}
