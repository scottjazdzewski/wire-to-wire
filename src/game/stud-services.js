/**
 * V10 commerce: live breeding SERVICE bookings on the existing game-run finance
 * ledger. The source world retains immutable parent IDs, ownership and pedigree.
 * A covering is NOT a pregnancy or foal, and does not replace the persistent
 * world generator's distinct pre-existing breeding-book records.
 */
import {ensure,isObject,requireString,validDate,worldIdentity} from './contracts.js';
import {currentHorseOwnerId} from './ownership.js';
export const STUD_SERVICE_SCHEMA='WTW_1999_STUD_SERVICE_BUSINESS_V1';
export const STUD_SERVICE_COMMANDS=Object.freeze([
 'BOOK_PAID_STUD_SERVICE','PUBLISH_STUD_SERVICE_OFFER','WITHDRAW_STUD_SERVICE_OFFER'
]);
const int=Number.isSafeInteger;
const safeId=id=>typeof id==='string'&&/^[A-Za-z0-9][A-Za-z0-9:_-]{1,110}$/.test(id)&&
 !['__proto__','constructor','prototype'].includes(id);
const MAX_ANNUAL_SERVICE_BOOK=120; // Explicit modeled cap unless a lower real source cap exists.
export const createStudServiceRuntime=()=>({schema:STUD_SERVICE_SCHEMA,by_id:{},offers:{}});
const book=state=>state.runtime.stud_services??
 (state.runtime.stud_services=createStudServiceRuntime());
const yearOf=date=>Number(date.slice(0,4));
function currentOwner(state,world,horse){
 return currentHorseOwnerId(state,world,horse.id);
}
function resolve({state,world,horseId,status}){
 requireString(horseId,'horse_id',128);
 const horse=worldIdentity(world,'horses',horseId);
 ensure(horse&&horse.status===status,'STUD_HORSE_STATUS',
  'A live source '+status+' horse ID is required for a game covering');
 const ownerId=currentOwner(state,world,horse);
 ensure(ownerId&&worldIdentity(world,'organizations',ownerId),
  'STUD_LEGAL_OWNER','A covering needs a recorded legal owner');
 return {horse,ownerId};
}
function standingRecipient(world,stallion,legalOwnerId,recipientId){
 ensure(Boolean(worldIdentity(world,'organizations',recipientId)),
  'STUD_RECIPIENT','Stud-fee recipient must be an existing operating organization');
 // The legal stallion owner and its actual physical standing organization may
 // be different. Do not silently assume the owner operates the stud farm.
 const allowed=[legalOwnerId,stallion.careFacilityId,stallion.standingFarmId].
  filter(id=>typeof id==='string'&&worldIdentity(world,'organizations',id));
 ensure(allowed.includes(recipientId),'STUD_RECIPIENT',
  'Fee must go to the verified legal stallion owner or standing service facility');
}
function studOfferSplit(world,stallion,stallionOwner,recipient,fee,share){
 ensure(int(share)&&share>=0&&share<=(fee||0),'STUD_REVENUE_SPLIT',
  'Stud owner royalty must fit within actual agreed service fee');
 ensure(share===0||fee>0&&share<fee&&
  recipient!==stallionOwner&&
  [stallion.careFacilityId,stallion.standingFarmId].includes(recipient),
  'STUD_REVENUE_SPLIT','A royalty can only split a real standing-farm service fee');
}
function validateOfferAuthority(command,state,stallionOwner){
 ensure(command.actor==='player'&&state.player.operation_id===stallionOwner&&
  ['owner','breeder','farm'].includes(state.player.role)||
  command.actor==='system'&&stallionOwner!==state.player.operation_id,
  'STUD_OFFER_AUTHORITY',
  'Only legal stallion owners may approve service terms, or rival game AI');
}
function publishStudServiceOffer({state,world,command,emit}){
 const p=command.payload;
 ensure(safeId(p.offer_id),'STUD_OFFER_ID','Approved stable stud offer ID required');
 const {horse:stallion,ownerId:stallionOwner}=resolve({
  state,world,horseId:p.stallion_id,status:'STALLION'});
 validateOfferAuthority(command,state,stallionOwner);
 ensure(p.stallion_owner_organization_id===stallionOwner,
  'STUD_OFFER_AUTHORITY','Current legal stallion owner must authorize the fee');
 const recipient=p.fee_recipient_organization_id;
 standingRecipient(world,stallion,stallionOwner,recipient);
 ensure(int(p.fee_minor)&&p.fee_minor>0&&p.fee_minor<=1000000000,
  'STUD_FEE','Advertised paid service needs a positive fee in cents');
 const ownerShare=p.owner_share_minor??0;
 studOfferSplit(world,stallion,stallionOwner,recipient,p.fee_minor,ownerShare);
 ensure(validDate(p.expires_on)&&p.expires_on>=state.clock.date&&
  yearOf(p.expires_on)===yearOf(state.clock.date),
  'STUD_OFFER_DATE','Live breeding quotes must expire during their stated season');
 const rt=book(state),offers=rt.offers||(rt.offers={});
 ensure(!Object.hasOwn(offers,p.offer_id)&&
  !Object.values(offers).some(x=>x.stallion_id===stallion.id&&
   x.year===yearOf(state.clock.date)&&x.status==='OPEN'),
  'STUD_OFFER_DUPLICATE','One signed seasonal price offer per stallion');
 offers[p.offer_id]={offer_id:p.offer_id,stallion_id:stallion.id,
  stallion_owner_organization_id:stallionOwner,
  fee_recipient_organization_id:recipient,fee_minor:p.fee_minor,
  owner_share_minor:ownerShare,
  year:yearOf(state.clock.date),published_on:state.clock.date,
  expires_on:p.expires_on,status:'OPEN',
  provenance:'LEGAL_STALLION_OWNER_APPROVED_GAME_SERVICE_TERMS'};
 emit('STUD_SERVICE_OFFER_PUBLISHED',{...offers[p.offer_id]});
}
function withdrawStudServiceOffer({state,command,emit}){
 const p=command.payload,rt=book(state);
 ensure(safeId(p.offer_id),'STUD_OFFER_ID','Valid stud offer ID required');
 const offer=rt.offers?.[p.offer_id];
 ensure(offer&&offer.status==='OPEN','STUD_OFFER','Only live stud offers can be withdrawn');
 validateOfferAuthority(command,state,offer.stallion_owner_organization_id);
 offer.status='WITHDRAWN';offer.withdrawn_on=state.clock.date;
 emit('STUD_SERVICE_OFFER_WITHDRAWN',{offer_id:offer.offer_id,
  stallion_id:offer.stallion_id});
}
export function getStudServiceOfferMarket(state,world,{offset=0,limit=50}={}){
 ensure(int(offset)&&offset>=0&&int(limit)&&limit>=0&&limit<=100,
  'STUD_OFFER_PAGE','Service market page must be 0 to 100');
 const offers=Object.values(state.runtime.stud_services?.offers||{}).
  filter(x=>x.status==='OPEN'&&x.year===yearOf(state.clock.date)&&
   x.expires_on>=state.clock.date&&
   currentHorseOwnerId(state,world,x.stallion_id)===
    x.stallion_owner_organization_id).
  sort((a,b)=>a.fee_minor-b.fee_minor||a.offer_id.localeCompare(b.offer_id));
 return {as_of:state.clock.date,total:offers.length,offset,limit,
  items:offers.slice(offset,offset+limit).map(x=>({...x}))};
}
export function bookStudService({state,world,command,emit}){
 if(command.type==='PUBLISH_STUD_SERVICE_OFFER')
  return publishStudServiceOffer({state,world,command,emit});
 if(command.type==='WITHDRAW_STUD_SERVICE_OFFER')
  return withdrawStudServiceOffer({state,command,emit});
 ensure(command.type==='BOOK_PAID_STUD_SERVICE',
  'STUD_AUTHORITY','Unsupported paid breeding service action');
 const p=command.payload;
 ensure(command.actor==='system'||command.actor==='player',
  'STUD_AUTHORITY','Only authorized game actors can book a breeding service');
 ensure(safeId(p.booking_id),'STUD_BOOKING_ID','Stable breeding booking ID required');
 const {horse:mare,ownerId:payer}=resolve({state,world,horseId:p.mare_id,status:'BROODMARE'});
 const {horse:stallion,ownerId:stallionOwner}=resolve({state,world,horseId:p.stallion_id,status:'STALLION'});
 ensure(mare.id!==stallion.id,'STUD_PARENT','Sire and dam must be distinct horses');
 ensure(command.actor==='system'||state.player.operation_id===payer&&
  ['owner','breeder','farm'].includes(state.player.role),
  'STUD_LEGAL_OWNER','A manager cannot spend legal-owner funds without an owner contract');
 const recipient=p.fee_recipient_organization_id;
 standingRecipient(world,stallion,stallionOwner,recipient);
 ensure(int(p.fee_minor)&&p.fee_minor>=0&&p.fee_minor<=1000000000,
  'STUD_FEE','Stud fee must be a safe nonnegative amount in cents');
 ensure((payer===recipient&&p.fee_minor===0&&stallionOwner===payer)||
  (payer!==recipient&&p.fee_minor>0),
  'STUD_SELF_SETTLEMENT','Own-stock covering must have zero self-paid fee');
 const rt=book(state),date=state.clock.date,year=yearOf(date);
 const ownerShare=p.owner_share_minor??0;
 studOfferSplit(world,stallion,stallionOwner,recipient,p.fee_minor,ownerShare);
 const internalNoFee=payer===recipient&&p.fee_minor===0;
 if(command.actor==='player'&&!internalNoFee||p.offer_id!==undefined){
  ensure(safeId(p.offer_id),'STUD_OFFER_REQUIRED',
   'Player-paid stud services require a signed stallion owner offer');
  const offer=rt.offers?.[p.offer_id];
  ensure(offer&&offer.status==='OPEN'&&offer.year===year&&
   offer.expires_on>=date&&offer.stallion_id===stallion.id&&
   offer.stallion_owner_organization_id===stallionOwner&&
   offer.fee_recipient_organization_id===recipient&&
   offer.fee_minor===p.fee_minor&&
   offer.owner_share_minor===ownerShare,
   'STUD_OFFER_TERMS','Service fee, payees and season must match signed seller terms');
 }
 ensure(!Object.hasOwn(rt.by_id,p.booking_id),'STUD_BOOKING_DUPLICATE',
  'Stud booking ID already exists');
 const prior=Object.values(rt.by_id);
 ensure(!prior.some(x=>x.mare_id===mare.id&&x.year===year),
  'STUD_MARE_BOOKED','One live service booking per mare each breeding year');
 const capacity=Number.isSafeInteger(stallion.serviceBookLimit)&&
  stallion.serviceBookLimit>=1&&stallion.serviceBookLimit<=300?
  Math.min(MAX_ANNUAL_SERVICE_BOOK,stallion.serviceBookLimit):MAX_ANNUAL_SERVICE_BOOK;
 ensure(prior.filter(x=>x.stallion_id===stallion.id&&x.year===year).length<capacity,
  'STUD_BOOK_FULL','Stallion service book is full for the current game year');
 const amounts=state.runtime.finances.operation_balances_minor||{};
 const charge=p.fee_minor,transaction='STUD_SERVICE:'+p.booking_id;
 ensure(!state.runtime.finances.ledger.some(x=>x.transaction_id===transaction),
  'STUD_BOOKING_DUPLICATE','Stud transaction ID already posted');
 if(charge){
  const receipts=[
   [recipient,'STUD_SERVICE_FEE_INCOME',charge-ownerShare],
   ...(ownerShare?[[stallionOwner,'STUD_SERVICE_STALLION_OWNER_ROYALTY',ownerShare]]:[])
  ];
  const deltas=new Map([[payer,-charge]]);
  for(const [org,,amount] of receipts)
   deltas.set(org,(deltas.get(org)||0)+amount);
  ensure(int(amounts[payer])&&amounts[payer]>=charge,
   'STUD_INSUFFICIENT_FUNDS','Legal mare owner cannot afford the agreed fee');
  for(const [org,delta] of deltas)
   ensure(int(amounts[org])&&int(amounts[org]+delta),
    'STUD_INSUFFICIENT_FUNDS','Every real stud owner and provider needs a funded account');
  for(const [org,delta] of deltas)amounts[org]+=delta;
  if(deltas.has(state.player.operation_id))
   state.runtime.finances.balance_minor=amounts[state.player.operation_id];
  for(const [org,kind,amount] of [
   [payer,'STUD_SERVICE_FEE_PAYMENT',-charge],...receipts
  ])state.runtime.finances.ledger.push({
   date,transaction_id:transaction,booking_id:p.booking_id,
   operation_id:org,horse_id:mare.id,mare_id:mare.id,stallion_id:stallion.id,
   payer_organization_id:payer,recipient_organization_id:recipient,
   stallion_owner_organization_id:stallionOwner,
   amount_minor:amount,kind,provenance:'MODELED_LIVE_GAME_SERVICE_NOT_BIRTH'
  });
 }
 rt.by_id[p.booking_id]={booking_id:p.booking_id,mare_id:mare.id,
  stallion_id:stallion.id,year,booked_on:date,legal_mare_owner_id:payer,
  fee_recipient_organization_id:recipient,fee_minor:charge,
  stallion_owner_organization_id:stallionOwner,owner_share_minor:ownerShare,
  ...(p.offer_id?{offer_id:p.offer_id}:{}),
  transaction_id:charge?transaction:null,status:'COVERING_SERVICE_BOOKED',
  provenance:'MODELED_LIVE_GAME_SERVICE_NOT_PREGNANCY'};
 emit('STUD_SERVICE_BOOKED',{booking_id:p.booking_id,mare_id:mare.id,
  stallion_id:stallion.id,payer_organization_id:payer,
  fee_recipient_organization_id:recipient,fee_minor:charge,
  owner_share_minor:ownerShare,
  ...(p.offer_id?{offer_id:p.offer_id}:{}),
  transaction_id:charge?transaction:null,
  result:'SERVICE_ONLY_NO_PREGNANCY_OR_FOAL_CREATED'});
}
export function validateStudServices(state,world){
 const rt=state.runtime.stud_services;
 if(rt===undefined)return; // Older saves do not have gameplay stud contracts.
 ensure(isObject(rt)&&rt.schema===STUD_SERVICE_SCHEMA&&isObject(rt.by_id),
  'STUD_SAVE','Invalid saved breeding service book');
 const unique=new Set(),counts=new Map(),settlements=new Map();
 // Index once: a 300k-horse universe cannot scan its entire finance ledger
 // for every recorded annual breeding service during save validation.
 for(const row of state.runtime.finances.ledger){
  if(!row.transaction_id?.startsWith('STUD_SERVICE:'))continue;
  if(!settlements.has(row.transaction_id))settlements.set(row.transaction_id,[]);
  settlements.get(row.transaction_id).push(row);
 }
 for(const [id,x] of Object.entries(rt.by_id)){
  ensure(safeId(id)&&isObject(x)&&x.booking_id===id&&
   validDate(x.booked_on)&&x.booked_on<=state.clock.date&&
   x.year===yearOf(x.booked_on)&&x.status==='COVERING_SERVICE_BOOKED'&&
   x.provenance==='MODELED_LIVE_GAME_SERVICE_NOT_PREGNANCY'&&
   int(x.fee_minor)&&x.fee_minor>=0&&x.fee_minor<=1000000000&&
   Boolean(worldIdentity(world,'horses',x.mare_id))&&
   Boolean(worldIdentity(world,'horses',x.stallion_id))&&
   Boolean(worldIdentity(world,'organizations',x.legal_mare_owner_id))&&
   Boolean(worldIdentity(world,'organizations',x.fee_recipient_organization_id)),
   'STUD_SAVE','Invalid breeding booking identity, account or dated service');
  const mareKey=x.mare_id+':'+x.year,stallionKey=x.stallion_id+':'+x.year;
  ensure(!unique.has(mareKey),'STUD_SAVE','Duplicate mare covering in saved year');
  unique.add(mareKey);counts.set(stallionKey,(counts.get(stallionKey)||0)+1);
  const horse=worldIdentity(world,'horses',x.stallion_id);
  const capacity=int(horse?.serviceBookLimit)&&horse.serviceBookLimit>=1&&
   horse.serviceBookLimit<=300?
   Math.min(MAX_ANNUAL_SERVICE_BOOK,horse.serviceBookLimit):MAX_ANNUAL_SERVICE_BOOK;
  ensure(counts.get(stallionKey)<=capacity,
   'STUD_SAVE','Saved stallion service book overbooked');
  ensure(x.transaction_id===(x.fee_minor?'STUD_SERVICE:'+id:null),
   'STUD_SAVE','Fee receipt identity is inconsistent');
  if(x.fee_minor){
   const legs=settlements.get(x.transaction_id)||[];
   ensure(legs.length===2&&
    legs.some(y=>y.kind==='STUD_SERVICE_FEE_PAYMENT'&&
     y.operation_id===x.legal_mare_owner_id&&y.amount_minor===-x.fee_minor)&&
    legs.some(y=>y.kind==='STUD_SERVICE_FEE_INCOME'&&
     y.operation_id===x.fee_recipient_organization_id&&y.amount_minor===x.fee_minor)&&
    legs.every(y=>y.booking_id===id&&y.mare_id===x.mare_id&&
     y.stallion_id===x.stallion_id&&y.date===x.booked_on)&&
    legs.reduce((n,y)=>n+y.amount_minor,0)===0,
    'STUD_SAVE','Paid stud booking requires exact matching cash settlement');
  }
 }
}
export function studServiceBusinessView(state,world,operationId){
 ensure(Boolean(worldIdentity(world,'organizations',operationId)),
  'STUD_BUSINESS','Choose an approved operation');
 const bookings=Object.values(state.runtime.stud_services?.by_id||{}).
  filter(x=>x.legal_mare_owner_id===operationId||
   x.fee_recipient_organization_id===operationId);
 let feesPaid=0,feesReceived=0;
 const items=bookings.map(x=>{
  if(x.legal_mare_owner_id===operationId)feesPaid+=x.fee_minor;
  if(x.fee_recipient_organization_id===operationId)feesReceived+=x.fee_minor;
  return {...x};
 });
 return {operation_id:operationId,as_of:state.clock.date,bookings:items,
  bookings_count:items.length,stud_fees_paid_minor:feesPaid,
  stud_fees_received_minor:feesReceived,
  net_stud_cash_minor:feesReceived-feesPaid,
  operation_cash_minor:state.runtime.finances.operation_balances_minor?.[operationId]??null,
  provenance:'ACTUAL_GAME_SETTLED_SERVICES_NOT_PREGNANCIES'};
}
