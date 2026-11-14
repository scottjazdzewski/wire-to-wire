/**
 * WTW DAILY AGENT ENGINE V1 — deterministic decisions, not random flavor.
 *
 * Each active owner, trainer, and racing-site operator evaluates the actual
 * prior game state before today's expenses/workouts. Agents cannot mint funds,
 * rewrite source identity, create horses or overrule explicit player orders.
 * Future jockey, race-entry and breeding agents will reuse this clock.
 */
import {ensure,isObject,validDate,worldIdentity} from './contracts.js';
import {FEED_PROGRAMS,CARE_PROGRAMS,modeledTrainerSkills,setHorseCarePolicy} from './horse-care.js';
import {TRAINING_PLANS,recommendHorseWorkout} from '../engine/horse-development.mjs';
import {facilityAction} from './facility-operations.js';

export const DAILY_AGENT_SCHEMA='WTW_DAILY_AGENT_DECISIONS_V1';
const cap=(x,min=0,max=1)=>Math.max(min,Math.min(max,x));
const round4=x=>Math.round(cap(x)*10000)/10000;
const account=(state,id)=>state.runtime.finances.operation_balances_minor?.[id]??null;
const key=(owner,trainer)=>owner+'|'+trainer;
const stable=(state)=>Object.values(state.runtime.registered_horses?.by_id||{}).
 filter(h=>Boolean(h.starting_attributes)).sort((a,b)=>a.horse_id.localeCompare(b.horse_id));
function factor(seed,id,salt){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of id+':'+salt){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return (h>>>0)/4294967296;
}
export const createDailyAgentRuntime=()=>({
 schema:DAILY_AGENT_SCHEMA,last_day:null,owners:{},relationships:{},recent:[],
 totals:{owner_reviews:0,trainer_days:0,barn_reviews:0,owner_changes:0,
  workout_directives:0,welfare_alerts:0}
});
function root(state){return state.runtime.agents??(state.runtime.agents=createDailyAgentRuntime());}
export function validateDailyAgentRuntime(state,world){
 const a=state.runtime.agents;
 if(a===undefined)return; // Previously created valid career saves remain importable.
 ensure(isObject(a)&&a.schema===DAILY_AGENT_SCHEMA&&isObject(a.owners)&&
  isObject(a.relationships)&&Array.isArray(a.recent)&&a.recent.length<=120&&
  isObject(a.totals)&&(a.last_day===null||validDate(a.last_day)&&a.last_day<=state.clock.date),
  'AGENT_SAVE','Broken autonomous agents save slot');
 for(const count of Object.values(a.totals))
  ensure(Number.isSafeInteger(count)&&count>=0,'AGENT_SAVE','Invalid agent decision counter');
 for(const [id,profile] of Object.entries(a.owners)){
  ensure(Boolean(worldIdentity(world,'organizations',id))&&
   isObject(profile)&&profile.id===id&&
   ['CAUTIOUS','BALANCED','AMBITIOUS'].includes(profile.style)&&
   Number.isFinite(profile.welfare_priority)&&profile.welfare_priority>=0&&profile.welfare_priority<=1&&
   Number.isFinite(profile.investment_appetite)&&profile.investment_appetite>=0&&profile.investment_appetite<=1,
   'AGENT_SAVE','Unknown or malformed owner outlook');
 }
 for(const [pair,r] of Object.entries(a.relationships)){
  const [owner,trainer]=pair.split('|');
  ensure(isObject(r)&&owner===r.owner_id&&trainer===r.trainer_id&&
   Boolean(worldIdentity(world,'organizations',owner))&&
   Boolean(worldIdentity(world,'people',trainer))&&
   Number.isFinite(r.owner_trust)&&r.owner_trust>=0&&r.owner_trust<=1&&
   Number.isFinite(r.trainer_support)&&r.trainer_support>=0&&r.trainer_support<=1&&
   Number.isSafeInteger(r.days)&&r.days>=0,
   'AGENT_SAVE','Invalid owner-trainer relationship');
 }
 for(const row of a.recent)ensure(isObject(row)&&validDate(row.date)&&row.date<=state.clock.date&&
  typeof row.agent_id==='string'&&typeof row.reason==='string',
  'AGENT_SAVE','Invalid causal decision record');
}
function ownerOutlook(state,id){
 const a=root(state);
 if(!a.owners[id]){
  const seed=state.rng.seed,appetite=factor(seed,id,'appetite'),
   welfare=factor(seed,id,'welfare');
  a.owners[id]={id,
   style:appetite>.71?'AMBITIOUS':appetite<.31?'CAUTIOUS':'BALANCED',
   investment_appetite:round4(.2+.7*appetite),
   welfare_priority:round4(.28+.68*welfare)};
 }
 return a.owners[id];
}
function relation(state,h){
 const a=root(state),id=key(h.owner_organization_id,h.trainer_id);
 if(!a.relationships[id]){
  a.relationships[id]={owner_id:h.owner_organization_id,trainer_id:h.trainer_id,
   owner_trust:.5,trainer_support:.5,days:0,unfunded_days:0};
 }
 return a.relationships[id];
}
function note(a,record){
 a.recent.push(record);
 if(a.recent.length>120)a.recent.splice(0,a.recent.length-120);
}
function monthlyBaseline(h,site,skills){
 // Estimate the same money units as daily charge: board, feed, care,
 // trainer compensation and typical workout supplies.
 const trainerFee=Math.round(4000+4500*skills.roleAttributes.conditioning);
 const basic=site.daily_boarding_minor+FEED_PROGRAMS.STANDARD.daily_minor+
  CARE_PROGRAMS.BASIC.daily_minor+trainerFee+3000;
 return Math.round(basic*30.5);
}
function ownerDecision(state,h,site,profile,related,ownerHerd,day){
 const accounts=state.runtime.finances.operation_balances_minor;
 const cash=accounts[h.owner_organization_id];
 const skills=state.runtime.people[h.trainer_id]?.game_training_skills||
  modeledTrainerSkills(h.trainer_id,state.rng.seed);
 const baseline=monthlyBaseline(h,site,skills);
 const totalNeed=ownerHerd.reduce((sum,x)=>{
  const barn=state.runtime.facilities.sites[x.current_residence_id];
  return sum+monthlyBaseline(x,barn,
   state.runtime.people[x.trainer_id]?.game_training_skills||
    modeledTrainerSkills(x.trainer_id,state.rng.seed));
 },0);
 const runway=Number.isSafeInteger(cash)?cash/Math.max(1,totalNeed):0;
 const record=state.runtime.horse[h.horse_id];
 const risk=record.training.currentRisk,fitness=record.training.fitness,
  aptitude=h.starting_attributes.potential_ability/99;
 const severity=record.training.sorenessDays>0||risk>.53;
 const canInvest=runway>2.5&&(profile.investment_appetite>.6||aptitude>.75)&&
  related.owner_trust>=.38;
 const conserve=runway<1.3;
 const feed=conserve?'ECONOMY':canInvest?'PREMIUM':'STANDARD';
 const care=severity||(!conserve&&profile.welfare_priority>.73)?'PROACTIVE':'BASIC';
 const mult=conserve?1.04:canInvest?1.22:1.13;
 const monthly_budget_minor=Math.max(0,Math.min(100000000,
  Math.round((baseline+
   (FEED_PROGRAMS[feed].daily_minor-FEED_PROGRAMS.STANDARD.daily_minor+
    CARE_PROGRAMS[care].daily_minor-CARE_PROGRAMS.BASIC.daily_minor)*30.5)*mult/1000)*1000));
 return {feed,care,training_plan:record.policy.training_plan,monthly_budget_minor,
  reason:severity?'HORSE_WELFARE_RECOVERY':conserve?'OWNER_LIQUIDITY_PRESSURE':
   canInvest?'BACKING_PROMISING_HORSE':'BALANCED_CARE_INVESTMENT',
  evidence:{owner_cash_minor:cash??null,approx_runway_months:Math.round(runway*10)/10,
   expected_monthly_need_minor:totalNeed,
   horse_potential:h.starting_attributes.potential_ability,
   owner_welfare_priority:profile.welfare_priority,
   trainer_trust:related.owner_trust,fitness,risk}};
}
function chooseWorkout(state,h,related){
 const care=state.runtime.horse[h.horse_id],r=care.training,p=care.policy;
 const t=state.runtime.people[h.trainer_id]?.game_training_skills||
  modeledTrainerSkills(h.trainer_id,state.rng.seed);
 const q=t.roleAttributes,age=h.racing_age_1999;
 if(r.sorenessDays>0)return {workout:'REST',reason:'SORENESS_RECOVERY'};
 if(r.currentRisk>.62-q.veterinary_coordination*.14||r.fatigue>.52)
  return {workout:'REST',reason:'WELFARE_RISK_LIMIT'};
 if(r.fatigue>.32+q.layoff_management*.10||r.stress>.48||
  r.consecutiveHard>=2)
  return {workout:'LIGHT',reason:'RECOVER_FROM_TRAINING_LOAD'};
 if(age<=3&&r.gateSchooling<.58&&q.young_horse_development>.45)
  return {workout:'GATE',reason:'YOUNG_HORSE_GATE_DEVELOPMENT'};
 if(r.fitness<.60&&r.fatigue<.29&&q.workout_design>.48)
  return {workout:'STAMINA',reason:'FITNESS_FOUNDATION'};
 if(r.daysSinceSpeed>=5&&r.fatigue<.26&&r.currentRisk<.49&&
  r.speedCondition<.74&&q.workout_design>.5&&related.trainer_support>.32)
  return {workout:'SPEED',reason:'SPEED_CONDITIONING_WINDOW'};
 if(r.readiness>.73&&r.fatigue<.29&&r.stress<.35)
  return {workout:'PREP',reason:'RACE_PREPARATION'};
 if(p.training_plan==='AUTO'){
  const selected=recommendHorseWorkout(r,{
   id:h.horse_id,name:h.registered_name,trainerId:h.trainer_id,
   ageAtOpening:h.racing_age_1999,attributes:h.starting_attributes
  },t,state.clock.date);
  return {workout:selected,reason:'TRAINER_DELEGATED_PROGRAM'};
 }
 const plan=p.training_plan;
 return {workout:plan==='REST'?'REST':plan==='LIGHT'?'LIGHT':
  plan==='SPEED'?'SPEED':plan==='STAMINA'?'STAMINA':
  plan==='GATE'?'GATE':plan==='PREP'?'PREP':'BALANCED',
  reason:'TRAINER_EXECUTES_OWNER_PROGRAM'};
}
/** Executes before the single finance/training day; records why agents acted. */
export function runAutonomousDay({state,world,emit}){
 const a=root(state),day=state.clock.date;
 if(a.last_day===day)return;
 ensure(!a.last_day||a.last_day<day,'AGENT_DATE','Agents cannot run out of clock order');
 const horses=stable(state),byOwner=new Map(),byTrainer=new Map();
 for(const h of horses){
  const owner=h.owner_organization_id;
  if(!byOwner.has(owner))byOwner.set(owner,[]);
  byOwner.get(owner).push(h);
  if(!byTrainer.has(h.trainer_id))byTrainer.set(h.trainer_id,[]);
  byTrainer.get(h.trainer_id).push(h);
 }
 // Site operators are independent agents: meet the animals' staffing needs
 // without deliberately removing welfare-critical staff to improve margins.
 for(const site of Object.values(state.runtime.facilities?.sites||{}).
  sort((x,y)=>x.id.localeCompare(y.id))){
  if(site.type!=='RACING_STABLE')continue;
  a.totals.barn_reviews++;
  const operator=site.owner_id,occupants=horses.filter(h=>h.current_residence_id===site.id).length;
  if(operator===state.player.operation_id)continue;
  const cash=account(state,operator)??0;
  const dailyCost=site.daily_upkeep_minor+site.staff_required*site.staff_wage_daily_minor+
   (site.track_rent_daily_minor||0);
  const safeReserve=dailyCost*21;
  if(site.staff_count<site.staff_required&&cash>=safeReserve){
   facilityAction({state,world,command:{id:'agent:staff:'+day+':'+site.id,
    type:'FACILITY_SET_STAFFING',actor:'system',payload:{
     site_id:site.id,operation_id:operator,staff_count:site.staff_required}},emit});
   note(a,{date:day,agent_id:operator,role:'BARN_OPERATOR',site_id:site.id,
    reason:'STAFFING_RESTORED_FOR_HORSE_WELFARE',occupants,operating_cash_minor:cash});
  }else if(site.staff_count<site.staff_required&&occupants>0&&
   (state.clock.days_elapsed%7===1)){
   a.totals.welfare_alerts++;
   emit('BARN_OPERATOR_WELFARE_ALERT',{site_id:site.id,operator_id:operator,
    horse_count:occupants,staff_count:site.staff_count,
    required:site.staff_required,reason:'INSUFFICIENT_FUNDS_TO_RESTORE_STAFFING'});
  }
  const wanted=site.quality<68&&cash>safeReserve*2?'PREMIUM':
   cash<safeReserve&&site.quality>82?'ECONOMY':'STANDARD';
  if(site.maintenance_policy!==wanted){
   facilityAction({state,world,command:{id:'agent:maint:'+day+':'+site.id,
    type:'FACILITY_SET_MAINTENANCE',actor:'system',payload:{
     site_id:site.id,operation_id:operator,policy:wanted}},emit});
   note(a,{date:day,agent_id:operator,role:'BARN_OPERATOR',site_id:site.id,
    reason:'MAINTENANCE_RESPONSE_TO_QUALITY_AND_LIQUIDITY',quality:site.quality,
    operating_cash_minor:cash,decision:wanted});
  }
 }
 // Autonomous owners choose funding priorities from their *actual* portfolio,
 // available cash, horse condition and confidence in the assigned trainer.
 for(const [owner,herd] of [...byOwner].sort((x,y)=>x[0].localeCompare(y[0]))){
  const personality=ownerOutlook(state,owner);a.totals.owner_reviews++;
  if(owner===state.player.operation_id&&state.player.role==='owner')continue;
  const changes=[];
  for(const h of herd){
   const r=state.runtime.horse[h.horse_id];
   if(!r||r.policy.source==='PLAYER_DECISION')continue;
   const site=state.runtime.facilities.sites[h.current_residence_id];
   const proposal=ownerDecision(state,h,site,personality,relation(state,h),herd,day);
   const crisis=r.training.sorenessDays>0||r.finance.unfunded_days>0;
   if(!crisis&&state.clock.days_elapsed%7!==1)continue;
   const {reason,evidence,...policy}=proposal;
   if(['feed','care','training_plan','monthly_budget_minor'].
    every(k=>policy[k]===r.policy[k]))continue;
   setHorseCarePolicy({state,world,command:{id:'agent:owner:'+day+':'+h.horse_id,
    actor:'system',type:'SET_HORSE_CARE_POLICY',payload:{horse_id:h.horse_id,policy}},emit});
   changes.push({horse_id:h.horse_id,reason,evidence,
    feed:policy.feed,care:policy.care,budget_minor:policy.monthly_budget_minor});
   a.totals.owner_changes++;
  }
  if(changes.length){
   emit('OWNER_DAILY_STRATEGY',{owner_id:owner,style:personality.style,
    decisions:changes,causal_scope:'FUNDED_HORSE_CARE_AND_CONDITION'});
   note(a,{date:day,agent_id:owner,role:'OWNER',reason:'REBALANCED_HORSE_CARE',
    horses_affected:changes.length});
  }
 }
 // Trainers choose actual workouts. A human owner's fixed training order is
 // respected unless the animal must rest for safety. AUTO is delegated.
 for(const [trainer,herd] of [...byTrainer].sort((x,y)=>x[0].localeCompare(y[0]))){
  const decisions=[],counts={};
  for(const h of herd){
   const r=state.runtime.horse[h.horse_id];
   if(!r||r.last_day===day)continue;
   const rel=relation(state,h);
   let {workout,reason}=chooseWorkout(state,h,rel);
   const playerOrder=h.owner_organization_id===state.player.operation_id&&
    r.policy.source==='PLAYER_DECISION'&&r.policy.training_plan!=='AUTO';
   if(playerOrder&&!['SORENESS_RECOVERY','WELFARE_RISK_LIMIT'].includes(reason)){
    workout=null;reason='PLAYER_TRAINING_ORDER_RESPECTED';
   }
   // Null means "the player's plan remains the authority".
   r.agent={date:day,trainer_id:trainer,workout,reason,
    owner_id:h.owner_organization_id,site_id:h.current_residence_id};
   counts[reason]=(counts[reason]||0)+1;
   if(workout!==null)a.totals.workout_directives++;
   decisions.push({horse_id:h.horse_id,workout,reason});
  }
  if(decisions.length){
   a.totals.trainer_days++;
   emit('TRAINER_DAILY_DECISIONS',{trainer_id:trainer,count:decisions.length,
    reasons:counts,decisions});
  }
 }
 a.last_day=day;
}
export function settleDailyAgentFeedback({state,emit}){
 const a=root(state),day=state.clock.date,groups=new Map();
 for(const h of stable(state)){
  const r=state.runtime.horse[h.horse_id];
  if(!r||r.last_day!==day)continue;
  const id=key(h.owner_organization_id,h.trainer_id);
  if(!groups.has(id))groups.set(id,[]);
  groups.get(id).push({h,r});
 }
 for(const [id,group] of groups){
  const rel=relation(state,group[0].h);
  let changeOwner=0,changeTrainer=0,unfunded=0;
  for(const {r} of group){
   const today=r.history.at(-1);
   if(!today||today.date!==day)continue;
   if(today.unfunded){unfunded++;changeOwner-=.009;changeTrainer-=.020;}
   else{
    changeTrainer+=.003;
    const safe=today.risk<.55&&!r.training.sorenessDays;
    changeOwner+=safe&&r.training.readiness>.47?.003:-.006;
    if(r.training.sorenessDays>0)changeOwner-=.006;
   }
  }
  const n=Math.max(1,group.length);
  rel.owner_trust=round4(rel.owner_trust+changeOwner/n);
  rel.trainer_support=round4(rel.trainer_support+changeTrainer/n);
  rel.days++;rel.unfunded_days+=unfunded;
  if(unfunded)emit('OWNER_TRAINER_RELATIONSHIP_PRESSURE',{
   owner_id:rel.owner_id,trainer_id:rel.trainer_id,
   unpaid_horse_days:unfunded,owner_trust:rel.owner_trust,
   trainer_support:rel.trainer_support,
   reason:'OWNER_CARE_FINANCING_AFFECTED_STABLE_OPERATION'});
 }
}
/**
 * Actual race results change professional relationships and credibility.
 * Outcome is compared with entry-era innate ability, NOT expected to always
 * follow model odds. Poor finishes do not erase a trainer's skill overnight.
 */
export function applyRaceAgentFeedback({state,world,race,results,emit}){
 const a=root(state),day=state.clock.date,field=results.length;
 for(const result of results){
  const horse=state.runtime.registered_horses?.by_id?.[result.horse_id];
  if(!horse)continue;
  const rel=relation(state,horse);
  const trainer=state.runtime.people[horse.trainer_id]||{};
  const record=trainer.game_race_record||{starts:0,wins:0,
   managed_purse_minor:0,professional_standing:.5};
  const achievement=1-(result.finish-1)/Math.max(1,field-1);
  const expectation=.2+.6*(horse.starting_attributes.current_ability/99);
  const relative=achievement-expectation;
  const welfare=state.runtime.horse[horse.horse_id].training.currentRisk;
  const trustDelta=relative*.012-(welfare>.65?.006:0);
  rel.owner_trust=round4(rel.owner_trust+trustDelta);
  rel.trainer_support=round4(rel.trainer_support+(result.earnings_minor>0?.003:.001)-
   (welfare>.72?.004:0));
  record.starts++;if(result.finish===1)record.wins++;
  record.managed_purse_minor+=result.earnings_minor;
  record.professional_standing=round4(record.professional_standing+relative*.009);
  state.runtime.people[horse.trainer_id]={...trainer,game_race_record:record};
  const reason=relative>.2?'EXCEEDED_FORM_EXPECTATIONS':
   relative<-.2?'BELOW_FORM_EXPECTATIONS':'CONSISTENT_WITH_KNOWN_FORM';
  emit('POST_RACE_PROFESSIONAL_FEEDBACK',{race_id:race.id,
   horse_id:horse.horse_id,owner_id:horse.owner_organization_id,
   trainer_id:horse.trainer_id,jockey_id:result.jockey_id,
   finish:result.finish,field_size:field,reason,
   comparison:'MODELED_STARTING_ABILITY_NOT_MARKET_ODDS',
   owner_trust:rel.owner_trust,trainer_standing:record.professional_standing,
   purse_earnings_minor:result.earnings_minor});
  note(a,{date:day,agent_id:horse.trainer_id,role:'TRAINER',horse_id:horse.horse_id,
   race_id:race.id,reason,finish:result.finish,field_size:field});
 }
}
export function getAgentRelationships(state,ownerId,trainerId){
 const r=root(state).relationships[key(ownerId,trainerId)];
 return r?structuredClone(r):null;
}
