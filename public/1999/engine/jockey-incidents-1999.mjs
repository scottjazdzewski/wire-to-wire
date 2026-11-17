/**
 * Deterministic post-race jockey incidents with real refunded mount contracts.
 * No synthetic historical riding results or mutable source-world identities.
 * A rider stays available for the rest of the incident's current race day;
 * the following dates enforce the persisted injury/suspension period.
 */
export const JOCKEY_INCIDENT_MODEL='WTW_1999_JOCKEY_POST_RACE_INCIDENT_V1';
const DAY=86400000;
const addDays=(day,n)=>new Date(Date.parse(day+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);
function fraction(seed,key){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of key){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return (h>>>0)/4294967296;
}
/** Transparent game probabilities: a modeled incident, never a real-world fact. */
export function modeled1999JockeyIncident(seed,jockeyId,raceId){
 const f=fraction(seed,jockeyId+':'+raceId+':POST_RACE_INCIDENT');
 if(f<.005)return {kind:'INJURY',days:7+Math.floor(fraction(seed,jockeyId+':'+raceId+':RECOVERY')*22)};
 if(f<.014)return {kind:'SUSPENSION',days:3+Math.floor(fraction(seed,jockeyId+':'+raceId+':STEWARDS')*12)};
 return null;
}
/** Reversals are journaled, never delete the original payment or booking event. */
function refundFutureMounts(state,jockey,availability,emit){
 const rt=state.runtime.racing,finances=state.runtime.finances;
 let count=0,total=0;
 for(const entry of Object.values(state.runtime.entries||{})){
  if(entry?.status!=='BOOKED'||entry.jockey_id!==jockey.id)continue;
  const race=state.runtime.races?.[entry.race_id];
  if(!race||race.status!=='ENTRIES_OPEN'||
   race.date<availability.start_date||race.date>availability.through_date)continue;
  const fee=entry.fee_minor;
  const owner=entry.owner_id||state.runtime.registered_horses?.by_id?.[entry.horse_id]?.owner_organization_id;
  if(!Number.isSafeInteger(fee)||fee<0||!owner||
   !Number.isSafeInteger(finances.operation_balances_minor?.[owner])||
   !Number.isSafeInteger(rt.jockey_finances_minor?.[jockey.id])||
   rt.jockey_finances_minor[jockey.id]<fee)
   throw Error('Cannot reconcile unavailable jockey booking refund');
  finances.operation_balances_minor[owner]+=fee;
  if(state.player?.operation_id===owner)
   finances.balance_minor=finances.operation_balances_minor[owner];
  rt.jockey_finances_minor[jockey.id]-=fee;
  finances.ledger.push(
   {date:state.clock.date,kind:'JOCKEY_UNAVAILABLE_OWNER_REFUND',
    operation_id:owner,amount_minor:fee,person_id:jockey.id,
    race_id:race.id,horse_id:entry.horse_id},
   {date:state.clock.date,kind:'JOCKEY_UNAVAILABLE_RIDER_REVERSAL',
    operation_id:null,person_id:jockey.id,amount_minor:-fee,
    race_id:race.id,horse_id:entry.horse_id});
  const offer=rt.premier_offers?.[entry.race_id+'|'+entry.horse_id+'|'+jockey.id];
  // Canonical offer IDs may differ; use the signed record's actual keys.
  const signed=offer&&offer.status==='SIGNED'?offer:
   Object.values(rt.premier_offers||{}).find(o=>
    o.status==='SIGNED'&&o.race_id===race.id&&
    o.horse_id===entry.horse_id&&o.jockey_id===jockey.id);
  if(signed){
   signed.status='CANCELLED';
   signed.cancelled_date=state.clock.date;
   signed.reason='SIGNED_RIDER_BECAME_UNAVAILABLE';
   signed.refunded_minor=fee;
  }
  entry.status='ENTERED';
  entry.cancelled_jockey_id=jockey.id;
  entry.jockey_id=null;
  entry.cancelled_date=state.clock.date;
  entry.cancellation_reason='JOCKEY_'+availability.kind;
  entry.refunded_minor=fee;
  delete entry.fee_minor;delete entry.travel;
  delete entry.mount_fee_minor;delete entry.travel_fee_minor;
  delete entry.premier_signing_bonus_minor;delete entry.race_tactic;
  count++;total+=fee;
  emit('JOCKEY_PAID_MOUNT_CANCELLED_AND_REFUNDED',{
   jockey_id:jockey.id,race_id:race.id,horse_id:entry.horse_id,
   owner_id:owner,refunded_minor:fee,incident:availability.kind,
   replacement_required:true});
 }
 return {count,total};
}
/** Called ONLY after an official race is settled, never during prediction. */
export function apply1999JockeyPostRaceConsequences({state,race,results,emit}){
 if(race.status!=='OFFICIAL_SIM_RESULT')throw Error('Jockey incidents require official results');
 const rt=state.runtime.racing,day=state.clock.date;
 let incidents=0,refunds=0;
 for(const result of results){
  const j=rt.jockeys[result.jockey_id];
  if(!j)continue;
  // Training is earned from actual professional starts, not future reservations.
  if(j.starts>0&&j.starts%20===0&&j.development_last_starts!==j.starts){
   j.development_last_starts=j.starts;
   const growth=j.starts<=400?.002:-.001;
   j.skills.judgment=Math.round(Math.max(.2,Math.min(.99,
    j.skills.judgment+growth))*1000)/1000;
   emit('JOCKEY_SKILL_DEVELOPED',{jockey_id:j.id,starts:j.starts,
    judgment:j.skills.judgment,change:growth,source_race_id:race.id});
  }
  if(j.availability?.start_date===addDays(day,1))continue;
  const incident=modeled1999JockeyIncident(state.rng.seed,j.id,race.id);
  if(!incident)continue;
  const availability={
   kind:incident.kind,start_date:addDays(day,1),
   through_date:addDays(day,incident.days),
   source_race_id:race.id,reported_date:day
  };
  j.availability=availability;
  const refunded=refundFutureMounts(state,j,availability,emit);
  incidents++;refunds+=refunded.count;
  emit('JOCKEY_POST_RACE_UNAVAILABLE',{
   jockey_id:j.id,race_id:race.id,kind:incident.kind,
   start_date:availability.start_date,
   through_date:availability.through_date,
   days:incident.days,
   refunded_mounts:refunded.count,refunded_minor:refunded.total,
   source:'DETERMINISTIC_MODELED_GAME_INCIDENT'});
 }
 return {incidents,refunded_mounts:refunds};
}
