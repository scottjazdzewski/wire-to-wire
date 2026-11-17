/**
 * Commercial jockey retainer auction. One existing local career and finance
 * ledger, no parallel simulation. Offers are unpaid until a real contract
 * signs; booking priority cannot override a signed race or travel constraint.
 */
import {get1999JockeyPartnership} from './jockey-partnerships-1999.mjs';
export const JOCKEY_RETAINER_SCHEMA='WTW_1999_JOCKEY_RETAINERS_V1';
export const JOCKEY_RETAINER_COMMANDS=Object.freeze([
 'OFFER_1999_JOCKEY_RETAINER','WITHDRAW_1999_JOCKEY_RETAINER',
 'TERMINATE_1999_JOCKEY_RETAINER']);
const DAY=86400000;
const gap=(a,b)=>Math.round((Date.parse(b+'T12:00:00Z')-Date.parse(a+'T12:00:00Z'))/DAY);
const date=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&
 new Date(d+'T12:00:00Z').toISOString().slice(0,10)===d;
const dollars=n=>Number.isSafeInteger(n)&&n>=0;
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const intersects=(a,b,c,d)=>a<=d&&c<=b;
const pair=(j,o,s)=>j+':'+o+':'+s;
const root=state=>state.runtime.racing.retainers??=({
 schema:JOCKEY_RETAINER_SCHEMA,offers:{},contracts:{},last_review_date:null});
const ownerHorse=(s,o,t)=>Object.values(s.runtime.registered_horses?.by_id||{}).
 some(h=>h.owner_organization_id===o&&h.trainer_id===t&&h.starting_attributes);
const ownerMayAct=(s,owner,actor)=>actor==='player'?
 s.player.role==='owner'&&s.player.operation_id===owner:
 actor==='system'&&s.player.operation_id!==owner;
function absence(j,start,end){
 return j?.career_status==='RETIRED'||Boolean(j?.availability&&
  intersects(start,end,j.availability.start_date,j.availability.through_date));
}
export function quote1999JockeyRetainer(state,{jockeyId,startDate,endDate}={}){
 const j=state.runtime.racing?.jockeys?.[jockeyId];
 if(!j||!date(startDate)||!date(endDate)||gap(startDate,endDate)<6||
  gap(startDate,endDate)>27)throw Error('Retainer requires live jockey and 7–28 dated days');
 const days=gap(startDate,endDate)+1;
 const daily={ELITE:27000,ESTABLISHED:17500,REGIONAL:10500,
  DEVELOPING:6500}[j.tier]??10500;
 return {days,jockey_id:jockeyId,
  minimum_fee_minor:Math.round(days*daily*(.85+
   .3*clamp(j.game_reputation??.5,0,1))),
  daily_floor_minor:daily,kind:'NONEXCLUSIVE_PRIORITY_NOT_GUARANTEED_MOUNTS'};
}
function active(state,jockey,dateOfRace){
 return Object.values(state.runtime.racing?.retainers?.contracts||{}).find(c=>
  c.jockey_id===jockey&&c.status==='ACTIVE'&&
  c.start_date<=dateOfRace&&c.end_date>=dateOfRace)||null;
}
export function get1999JockeyRetainerPreference(state,{
 jockeyId,ownerId,trainerId,raceDate}={}){
 const contract=active(state,jockeyId,raceDate);
 return !contract||contract.owner_id!==ownerId?
  {priority:0,contract_id:null}:
  {priority:contract.trainer_id===trainerId?.05:.035,
   contract_id:contract.id,nonexclusive:true};
}
/** A player cannot offer for another owner; AI cannot control player money. */
export function jockeyRetainerAction({state,world,command,emit}){
 const p=command.payload||{},rt=root(state),today=state.clock.date;
 if(command.type==='WITHDRAW_1999_JOCKEY_RETAINER'){
  const o=rt.offers[p.offer_id];
  if(!o||o.status!=='PENDING'||!ownerMayAct(state,o.owner_id,command.actor))
   throw Error('Only owner may withdraw a pending unpaid retainer');
  o.status='WITHDRAWN';o.resolved_date=today;
  emit('JOCKEY_RETAINER_OFFER_WITHDRAWN',{offer_id:o.id,
   owner_id:o.owner_id,jockey_id:o.jockey_id,charged_minor:0});
  return {withdrawn:true};
 }
 if(command.type==='TERMINATE_1999_JOCKEY_RETAINER'){
  const c=rt.contracts[p.contract_id];
  if(!c||c.status!=='ACTIVE'||!ownerMayAct(state,c.owner_id,command.actor)||
   today>c.end_date)throw Error('Only the owning party can end a live signed retainer');
  terminate(state,c,'OWNER_WITHDRAWAL',emit,.15);
  return {terminated:true,refunded_minor:c.refunded_minor,
   cancellation_penalty_minor:c.cancellation_penalty_minor};
 }
 if(command.type!=='OFFER_1999_JOCKEY_RETAINER')
  throw Error('Unsupported jockey retainer command');
 const j=state.runtime.racing?.jockeys?.[p.jockey_id],
  validOwner=world.entities?.organizations?.some(x=>x.id===p.owner_id);
 if(!j||!validOwner||!world.entities.people.some(x=>x.id===p.trainer_id)||
  !ownerHorse(state,p.owner_id,p.trainer_id)||
  !ownerMayAct(state,p.owner_id,command.actor))
  throw Error('Retainer requires authorized owning operation, active trainer and real rider');
 if(!date(p.start_date)||!date(p.end_date)||gap(today,p.start_date)<2||
  gap(today,p.start_date)>30||absence(j,p.start_date,p.end_date))
  throw Error('Retainer requires available rider and start in 2–30 days');
 const quote=quote1999JockeyRetainer(state,{jockeyId:j.id,
  startDate:p.start_date,endDate:p.end_date});
 if(!dollars(p.total_fee_minor)||p.total_fee_minor<1000||
  p.total_fee_minor>3000000)
  throw Error('Invalid modeled retainer fee');
 const balance=state.runtime.finances.operation_balances_minor?.[p.owner_id];
 if(!dollars(balance)||balance<p.total_fee_minor)
  throw Error('Owning operation cannot fund this retainer');
 const id=pair(j.id,p.owner_id,p.start_date),prior=rt.offers[id];
 if(prior&&(prior.status!=='PENDING'||
  p.total_fee_minor<=prior.total_fee_minor))
  throw Error('Only an increased unpaid offer may replace the existing bid');
 if(!prior&&Object.keys(rt.offers).length>=5000)
  throw Error('Too many retained market bids');
 rt.offers[id]={id,jockey_id:j.id,owner_id:p.owner_id,
  trainer_id:p.trainer_id,start_date:p.start_date,
  end_date:p.end_date,total_fee_minor:p.total_fee_minor,
  quoted_minimum_minor:quote.minimum_fee_minor,
  offered_date:today,status:'PENDING'};
 emit(prior?'JOCKEY_RETAINER_OFFER_RAISED':'JOCKEY_RETAINER_OFFER_SUBMITTED',{
  offer_id:id,owner_id:p.owner_id,jockey_id:j.id,
  total_fee_minor:p.total_fee_minor,minimum_fee_minor:quote.minimum_fee_minor,
  signing_date:new Date(Date.parse(p.start_date+'T12:00:00Z')-DAY).
   toISOString().slice(0,10),charged_minor:0});
 return {offered:true,id};
}
function preference(state,o){
 const q=quote1999JockeyRetainer(state,{jockeyId:o.jockey_id,
  startDate:o.start_date,endDate:o.end_date});
 const bond=get1999JockeyPartnership(state,{trainerId:o.trainer_id,
  ownerId:o.owner_id,jockeyId:o.jockey_id});
 return {accepted:o.total_fee_minor>=q.minimum_fee_minor,
  score:Math.min(2.5,o.total_fee_minor/q.minimum_fee_minor)*.75+
   bond.trainerBond*.18+bond.ownerBond*.07};
}
function recordTransfer(state,c,amount,reason){
 if(!Number.isSafeInteger(amount)||amount<0)throw Error('Invalid retainer payment');
 const fin=state.runtime.finances,account=fin.operation_balances_minor,
  rt=state.runtime.racing;
 if(reason==='SIGNED'){
  if(!dollars(account[c.owner_id])||account[c.owner_id]<amount)
   throw Error('Unfunded jockey retainer signature');
  account[c.owner_id]-=amount;
  rt.jockey_finances_minor[c.jockey_id]+=amount;
 }else{
  if(rt.jockey_finances_minor[c.jockey_id]<amount)
   throw Error('Jockey balance insufficient to refund unserved retainer');
  account[c.owner_id]+=amount;
  rt.jockey_finances_minor[c.jockey_id]-=amount;
 }
 if(state.player.operation_id===c.owner_id)
  fin.balance_minor=account[c.owner_id];
 const sign=reason==='SIGNED'?-1:1;
 fin.ledger.push(
  {date:state.clock.date,kind:reason==='SIGNED'?
   'JOCKEY_RETAINER_OWNER_DEBIT':'JOCKEY_RETAINER_OWNER_REFUND',
   operation_id:c.owner_id,person_id:c.jockey_id,
   amount_minor:sign*amount,contract_id:c.id},
  {date:state.clock.date,kind:reason==='SIGNED'?
   'JOCKEY_RETAINER_RIDER_CREDIT':'JOCKEY_RETAINER_RIDER_REVERSAL',
   operation_id:null,person_id:c.jockey_id,
   amount_minor:-sign*amount,contract_id:c.id});
}
/** Pro-rated refunds are explicit ledger reversals; original payment remains. */
function terminate(state,c,reason,emit,penaltyRate=0){
 const day=state.clock.date,first=day>c.start_date?day:c.start_date;
 const remaining=Math.max(0,gap(first,c.end_date)+1),
  duration=gap(c.start_date,c.end_date)+1,
  unserved=Math.floor(c.total_fee_minor*remaining/duration),
  penalty=Math.floor(unserved*penaltyRate),refund=unserved-penalty;
 if(refund)recordTransfer(state,c,refund,'REFUND');
 c.status='TERMINATED';c.terminated_date=day;
 c.refunded_minor=refund;c.termination_reason=reason;
 c.cancellation_penalty_minor=penalty;
 emit('JOCKEY_RETAINER_TERMINATED',{contract_id:c.id,reason,
  jockey_id:c.jockey_id,owner_id:c.owner_id,
  refunded_minor:refund,unused_days:remaining,
  cancellation_penalty_minor:penalty});
}
/** Called inside the same ADVANCE_DAY as racing, after workforce transitions. */
export function advance1999JockeyRetainers({state,world,emit}){
 const rt=root(state),today=state.clock.date;
 if(rt.last_review_date===today)return {signed:0,declined:0,terminated:0};
 let signed=0,declined=0,terminated=0;
 for(const c of Object.values(rt.contracts)){
  if(c.status!=='ACTIVE')continue;
  const j=state.runtime.racing.jockeys[c.jockey_id],
   reason=j?.career_status==='RETIRED'?'RETIRED':
    j?.availability&&today>=j.availability.start_date&&
      today<=j.availability.through_date?'RIDER_'+j.availability.kind:null;
  if(reason&&today<=c.end_date){
   terminate(state,c,reason,emit);terminated++;
  }else if(today>c.end_date){
   c.status='EXPIRED';c.expired_date=today;
   emit('JOCKEY_RETAINER_EXPIRED',{contract_id:c.id,
    jockey_id:c.jockey_id,end_date:c.end_date});
  }
 }
 const due=Object.values(rt.offers).filter(o=>
  o.status==='PENDING'&&gap(today,o.start_date)<=1).
  sort((a,b)=>a.start_date.localeCompare(b.start_date)||
   a.jockey_id.localeCompare(b.jockey_id)||a.id.localeCompare(b.id));
 const grouped=new Map();
 for(const o of due){
  const key=o.jockey_id+':'+o.start_date;
  if(!grouped.has(key))grouped.set(key,[]);
  grouped.get(key).push(o);
 }
 for(const proposals of grouped.values()){
  const ranked=proposals.map(o=>({o,...preference(state,o)})).
   sort((a,b)=>b.score-a.score||
    b.o.total_fee_minor-a.o.total_fee_minor||a.o.id.localeCompare(b.o.id));
  let winner=null;
  for(const {o,accepted,score} of ranked){
   const j=state.runtime.racing.jockeys[o.jockey_id];
   const account=state.runtime.finances.operation_balances_minor?.[o.owner_id];
   if(!accepted||!j||absence(j,o.start_date,o.end_date)||
    !dollars(account)||account<o.total_fee_minor||
    Object.values(rt.contracts).some(c=>c.status==='ACTIVE'&&
     c.jockey_id===o.jockey_id&&
     intersects(c.start_date,c.end_date,o.start_date,o.end_date)))continue;
   const contract={...o,status:'ACTIVE',signed_date:today,
    signature_score:Math.round(score*1000000)/1000000,
    refunded_minor:0,kind:'NONEXCLUSIVE_OWNER_TRAINER_PRIORITY'};
   recordTransfer(state,contract,contract.total_fee_minor,'SIGNED');
   rt.contracts[contract.id]=contract;
   o.status='SIGNED';o.resolved_date=today;winner=o;signed++;
   emit('JOCKEY_RETAINER_SIGNED',{contract_id:contract.id,
    jockey_id:contract.jockey_id,owner_id:contract.owner_id,
    trainer_id:contract.trainer_id,total_fee_minor:contract.total_fee_minor,
    start_date:contract.start_date,end_date:contract.end_date,
    nonexclusive:true});
   break;
  }
  for(const {o} of ranked)if(o!==winner){
   o.status='DECLINED';o.resolved_date=today;
   o.reason=winner?'RIVAL_RETAINER_SIGNED':
    'NOT_FUNDED_ACCEPTED_AVAILABLE_OR_NO_CONTRACT_OVERLAP';
   declined++;
   emit('JOCKEY_RETAINER_OFFER_DECLINED',{offer_id:o.id,
    owner_id:o.owner_id,jockey_id:o.jockey_id,
    winning_offer_id:winner?.id??null,reason:o.reason,charged_minor:0});
  }
 }
 rt.last_review_date=today;
 // Keep pending offers, contracts and ledger. Old rejected offers already
 // survive in the append-only canonical game event log.
 if(Object.keys(rt.offers).length>1500)
  for(const o of Object.values(rt.offers).filter(o=>
   o.status!=='PENDING'&&gap(o.resolved_date,today)>90).
   sort((a,b)=>a.id.localeCompare(b.id)))
   delete rt.offers[o.id];
 return {signed,declined,terminated};
}
export function validate1999JockeyRetainers(state,world){
 const rt=state.runtime.racing?.retainers;
 if(rt===undefined)return;
 if(!rt||rt.schema!==JOCKEY_RETAINER_SCHEMA||
  !rt.offers||Array.isArray(rt.offers)||
  !rt.contracts||Array.isArray(rt.contracts)||
  Object.keys(rt.offers).length>5000||
  rt.last_review_date!==null&&(!date(rt.last_review_date)||
   rt.last_review_date>state.clock.date))
  throw Error('Invalid saved jockey retainer market');
 const jockeys=state.runtime.racing.jockeys,
  owners=new Set(world.entities.organizations.map(x=>x.id)),
  people=new Set(world.entities.people.map(x=>x.id));
 for(const [id,c] of Object.entries(rt.contracts)){
  if(id!==c.id||!jockeys[c.jockey_id]||!owners.has(c.owner_id)||
   !people.has(c.trainer_id)||!date(c.start_date)||!date(c.end_date)||
   !date(c.signed_date)||c.signed_date>state.clock.date||
   gap(c.start_date,c.end_date)<6||gap(c.start_date,c.end_date)>27||
   !dollars(c.total_fee_minor)||!dollars(c.refunded_minor)||
   c.refunded_minor>c.total_fee_minor||
   !['ACTIVE','EXPIRED','TERMINATED'].includes(c.status))
   throw Error('Invalid saved signed jockey retainer');
  if(c.status==='TERMINATED'&&(!date(c.terminated_date)||
   c.terminated_date>state.clock.date))throw Error('Invalid retainer termination');
 }
 for(const [id,o] of Object.entries(rt.offers)){
  if(id!==o.id||!jockeys[o.jockey_id]||
   !['PENDING','SIGNED','DECLINED','WITHDRAWN'].includes(o.status)||
   !date(o.start_date)||!date(o.end_date)||
   !date(o.offered_date)||o.offered_date>state.clock.date||
   !dollars(o.total_fee_minor)||
   o.status==='SIGNED'&&!rt.contracts[o.id])
   throw Error('Invalid saved jockey retainer bid');
 }
}
