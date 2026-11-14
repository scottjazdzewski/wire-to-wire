/**
 * WTW 1999 — ONE horse-care economy and condition loop in the game-run save.
 * Model assumptions, not sourced training bills or veterinary diagnoses.
 * Player and AI share the same commands, money limits and development rules.
 * This module never advances its own clock or modifies the founding source.
 */
import {ensure,isObject,worldIdentity} from './contracts.js';
import {TRAINING_PLANS,createHorseTrainingRecord,advanceHorseTrainingDay}
 from '../../public/1999/engine/horse-development.mjs';

export const HORSE_CARE_SCHEMA='WTW_1999_CONNECTED_HORSE_CARE_V1';
export const TRAINER_SKILLS_SCHEMA='WTW_1999_TRAINER_SKILLS_GAME_V1';
export const HORSE_CARE_COMMANDS=Object.freeze(['SET_HORSE_CARE_POLICY']);
export const FEED_PROGRAMS=Object.freeze({
 ECONOMY:{daily_minor:700,nutrition:.40},
 STANDARD:{daily_minor:1600,nutrition:.67},
 PREMIUM:{daily_minor:3000,nutrition:.91}
});
export const CARE_PROGRAMS=Object.freeze({
 BASIC:{daily_minor:500,supervision:.48},
 PROACTIVE:{daily_minor:1500,supervision:.88}
});
const cap=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const money=Number.isSafeInteger;
const seedPart=(seed,key)=>{let h=(2166136261^(seed>>>0))>>>0;
 for(const c of key){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return (h>>>0)/4294967296;};
const round4=x=>Math.round(cap(x)*10000)/10000;
export function modeledTrainerSkills(personId,seed=19990101){
 ensure(/^P-[A-Za-z0-9-]+$/.test(personId)&&Number.isSafeInteger(seed)&&seed>0,
  'TRAINER_SKILLS','Approved trainer identity and seed required');
 const pick=k=>round4(.34+.55*seedPart(seed,personId+':'+k));
 const attributes={
  conditioning:pick('conditioning'),workout_design:pick('planning'),
  young_horse_development:pick('young'),veterinary_coordination:pick('health'),
  layoff_management:pick('layoff'),race_placement:pick('placement')
 };
 return {schema:TRAINER_SKILLS_SCHEMA,source:'MODELED_1999_GAMEPLAY_NOT_HISTORICAL',
  person_id:personId,roleAttributes:attributes,
  ability:{current:Math.round((attributes.conditioning+attributes.workout_design+
   attributes.veterinary_coordination)/3*99)}};
}
export function defaultHorseCarePolicy(){
 return {feed:'STANDARD',care:'BASIC',training_plan:'AUTO',
  monthly_budget_minor:500000,source:'MODELED_GAMEPLAY_DEFAULT'};
}
function descriptor(horse,site,skills,policy){
 const feed=FEED_PROGRAMS[policy.feed],care=CARE_PROGRAMS[policy.care];
 const fee=Math.round(4000+4500*skills.roleAttributes.conditioning);
 const board=site.daily_boarding_minor??0;
 const monthlyCareCost=(board+feed.daily_minor+care.daily_minor)*30.4375/100;
 return {
  horse:{id:horse.horse_id,name:horse.registered_name,
   trainerId:horse.trainer_id,ageAtOpening:horse.racing_age_1999,
   attributes:horse.starting_attributes,finances:{monthlyCareCost}},
  trainer:{...skills,compensation:{dayRate:fee/100}},
  fee_minor:fee,board_minor:board,feed_minor:feed.daily_minor,care_minor:care.daily_minor
 };
}
function estimateContext(policy,site,occupancy){
 const effective=Math.max(1,Math.floor(site.stalls*Math.min(1,
  site.staff_count/Math.max(1,site.staff_required))));
 const crowding=cap(occupancy/effective);
 return {nutrition:FEED_PROGRAMS[policy.feed].nutrition,
  supervision:cap(CARE_PROGRAMS[policy.care].supervision*
   Math.min(1,site.staff_count/Math.max(1,site.staff_required))),
  barnQuality:cap(site.quality/100),crowding};
}
function requirePolicy(policy){
 ensure(isObject(policy)&&Object.hasOwn(FEED_PROGRAMS,policy.feed)&&
  Object.hasOwn(CARE_PROGRAMS,policy.care)&&Object.hasOwn(TRAINING_PLANS,policy.training_plan)&&
  money(policy.monthly_budget_minor)&&policy.monthly_budget_minor>=0&&
  policy.monthly_budget_minor<=100000000,
  'HORSE_CARE_POLICY','Valid feed, care, workout plan and monthly cash limit required');
}
export function createHorseCareRecord(horse,asOf='1999-01-01'){
 ensure(horse?.starting_attributes&&typeof horse.horse_id==='string',
  'HORSE_CARE_ATTRIBUTES','Game horse needs starting attributes');
 const train=createHorseTrainingRecord({
  id:horse.horse_id,name:horse.registered_name,trainerId:horse.trainer_id,
  ageAtOpening:horse.racing_age_1999,attributes:horse.starting_attributes},asOf);
 return {schema:HORSE_CARE_SCHEMA,horse_id:horse.horse_id,policy:defaultHorseCarePolicy(),
  training:train,finance:{month:asOf.slice(0,7),spent_minor:0,lifetime_minor:0,
   unfunded_days:0},last_day:asOf,history:[],
  provenance:'1999_MODELED_CARE_GAMEPLAY_ONLY'};
}
export function initializeGameHorseCare(state,horse){
 if(!horse.starting_attributes)return;
 if(!state.runtime.horse[horse.horse_id])
  state.runtime.horse[horse.horse_id]=createHorseCareRecord(horse,state.clock.date);
 const person=state.runtime.people[horse.trainer_id]||{};
 if(!person.game_training_skills)
  state.runtime.people[horse.trainer_id]={...person,
   game_training_skills:modeledTrainerSkills(horse.trainer_id,state.rng.seed)};
}
export function setHorseCarePolicy({state,world,command,emit}){
 const p=command.payload,horse=state.runtime.registered_horses?.by_id?.[p.horse_id];
 ensure(Boolean(horse),'UNKNOWN_HORSE','Only game-registered racehorses can receive care policy');
 ensure(command.actor==='system'||(command.actor==='player'&&
  state.player.role==='owner'&&state.player.operation_id===horse.owner_organization_id),
  'HORSE_CARE_PERMISSION','Only authorized owner or AI manager can decide horse care');
 ensure(isObject(p.policy),'HORSE_CARE_POLICY','Care policy required');
 requirePolicy(p.policy);
 const record=state.runtime.horse[horse.horse_id]||
  (state.runtime.horse[horse.horse_id]=createHorseCareRecord(horse,state.clock.date));
 record.policy={feed:p.policy.feed,care:p.policy.care,
  training_plan:p.policy.training_plan,
  monthly_budget_minor:p.policy.monthly_budget_minor,
  source:command.actor==='player'?'PLAYER_DECISION':'AI_GAMEPLAY_DECISION'};
 record.training.plan=record.policy.training_plan;
 emit('HORSE_CARE_POLICY_CHANGED',{horse_id:horse.horse_id,
  owner_id:horse.owner_organization_id,trainer_id:horse.trainer_id,
  policy:structuredClone(record.policy)});
}
function addFinance(state,operation,amount,kind,horse,site,transaction,details){
 const balances=state.runtime.finances.operation_balances_minor;
 ensure(money(balances[operation])&&money(balances[operation]+amount),
  'HORSE_CARE_FINANCES','Care transaction requires an established operation account');
 balances[operation]+=amount;
 if(state.player.operation_id===operation)state.runtime.finances.balance_minor=balances[operation];
 state.runtime.finances.ledger.push({date:state.clock.date,
  operation_id:operation,site_id:site,horse_id:horse,
  amount_minor:amount,kind,transaction_id:transaction,...details});
}
export function validateHorseCareRuntime(state,world){
 for(const [id,record] of Object.entries(state.runtime.horse||{})){
  if(record?.schema!==HORSE_CARE_SCHEMA)continue; // Older independent runtime records.
  const h=state.runtime.registered_horses?.by_id?.[id];
  ensure(Boolean(h)&&record.horse_id===id&&isObject(record.training)&&
   record.training.horseId===id&&record.training.trainerId===h.trainer_id,
   'HORSE_CARE_SAVE','Care must reference one registered horse and its trainer');
  requirePolicy(record.policy);
  ensure(isObject(record.finance)&&money(record.finance.spent_minor)&&
   money(record.finance.lifetime_minor)&&money(record.finance.unfunded_days)&&
   Array.isArray(record.history)&&typeof record.last_day==='string'&&
   record.last_day<=state.clock.date&&record.training.asOf===record.last_day,
   'HORSE_CARE_SAVE','Invalid money, days, or training progress');
  ensure(Boolean(worldIdentity(world,'people',h.trainer_id)),'HORSE_CARE_SAVE','Unknown trainer');
 }
}
export function advanceGameHorseCare({state,world,emit}){
 const horses=Object.values(state.runtime.registered_horses?.by_id||{}).sort((a,b)=>
  a.horse_id.localeCompare(b.horse_id));
 const accounts=state.runtime.finances.operation_balances_minor,day=state.clock.date;
 const occupancy={};
 for(const h of horses)occupancy[h.current_residence_id]=(occupancy[h.current_residence_id]||0)+1;
 for(const h of horses){
  if(!h.starting_attributes){emit('HORSE_NEEDS_ATTRIBUTES',{horse_id:h.horse_id});continue}
  initializeGameHorseCare(state,h);
  const r=state.runtime.horse[h.horse_id];
  if(r.last_day===day)continue;
  const site=state.runtime.facilities?.sites?.[h.current_residence_id];
  ensure(Boolean(site),'HORSE_CARE_SITE','Registered horse lost its physical barn');
  if(r.finance.month!==day.slice(0,7)){
   r.finance.month=day.slice(0,7);r.finance.spent_minor=0;
  }
  const skills=state.runtime.people[h.trainer_id]?.game_training_skills||
   modeledTrainerSkills(h.trainer_id,state.rng.seed);
  state.runtime.people[h.trainer_id]={
   ...(state.runtime.people[h.trainer_id]||{}),game_training_skills:skills};
  const p=r.policy,info=descriptor(h,site,skills,p);
  const context=estimateContext(p,site,occupancy[h.current_residence_id]);
  const train={...r.training,plan:p.training_plan};
  const allowed=site.status==='ACTIVE'&&site.staff_count>=site.staff_required;
  const work=advanceHorseTrainingDay(train,info.horse,info.trainer,day,
   state.rng.seed,context);
  const charge_minor=Math.round(work.charge*100);
  const canPay=allowed&&money(accounts[h.owner_organization_id])&&
   accounts[h.owner_organization_id]>=charge_minor&&
   r.finance.spent_minor+charge_minor<=p.monthly_budget_minor;
  let result=work,used=charge_minor;
  if(!canPay){
   // Nothing is billed without funds. The resulting welfare and fitness risk
   // is a gameplay consequence, NOT a clinical diagnosis.
   const poor={nutrition:.16,supervision:.10,barnQuality:Math.min(context.barnQuality,.3),
    crowding:Math.max(context.crowding,.95)};
   result=advanceHorseTrainingDay({...train,plan:'REST'},info.horse,info.trainer,
    day,state.rng.seed,poor);
   result.horse.fitness=round4(result.horse.fitness-.004);
   result.horse.stress=round4(result.horse.stress+.018);
   result.horse.currentRisk=round4(result.horse.currentRisk+.02);
   result.horse.readiness=round4(result.horse.readiness-.027);
   result.horse.plan=p.training_plan;
   result.horse.trainingSpent=r.training.trainingSpent; // unpaid model work is not booked as spent cash
   used=0;r.finance.unfunded_days++;
   emit('HORSE_CARE_UNFUNDED',{horse_id:h.horse_id,owner_id:h.owner_organization_id,
    needed_minor:charge_minor,balance_minor:accounts[h.owner_organization_id]??null,
    monthly_budget_minor:p.monthly_budget_minor,barn_operational:allowed});
  }else{
   const transaction='CARE:'+day+':'+h.horse_id;
   const operator=site.operator_organization_id||site.owner_id;
   const service=info.board_minor+info.fee_minor;
   ensure(service<=used,'HORSE_CARE_FINANCES','Modeled care charge below contractual board and trainer cost');
   addFinance(state,h.owner_organization_id,-used,'HORSE_CARE_OWNER_PAYMENT',
    h.horse_id,site.id,transaction,{operator_id:operator,
     trainer_id:h.trainer_id,feed:p.feed,care:p.care,workout:result.work,
     feed_minor:info.feed_minor,board_minor:info.board_minor,
     trainer_fee_minor:info.fee_minor,other_care_minor:used-service});
   addFinance(state,operator,service,'HORSE_CARE_SITE_AND_TRAINER_INCOME',
    h.horse_id,site.id,transaction,{owner_id:h.owner_organization_id,
     trainer_id:h.trainer_id,board_minor:info.board_minor,
     trainer_fee_minor:info.fee_minor});
   r.finance.spent_minor+=used;r.finance.lifetime_minor+=used;
  }
  r.training=result.horse;r.last_day=day;
  r.history.push({date:day,work:result.work,paid_minor:used,
   nutrition:p.feed,care:p.care,facility_id:site.id,
   crowding:round4(context.crowding),barn_quality:site.quality,
   fitness:r.training.fitness,readiness:r.training.readiness,
   risk:r.training.currentRisk,unfunded:!canPay});
  if(r.history.length>45)r.history.splice(0,r.history.length-45);
  emit('HORSE_CARE_DAY',{horse_id:h.horse_id,trainer_id:h.trainer_id,
   owner_id:h.owner_organization_id,site_id:site.id,workout:result.work,
   paid_minor:used,fitness:r.training.fitness,readiness:r.training.readiness,
   health_risk:r.training.currentRisk});
 }
}
export function getGameHorsePerformance(state,world,id){
 const horse=state.runtime.registered_horses?.by_id?.[id];
 ensure(Boolean(horse),'UNKNOWN_HORSE','Horse must be registered in the active game');
 const care=state.runtime.horse[id],a=horse.starting_attributes;
 ensure(Boolean(care)&&Boolean(a),'HORSE_CARE_ATTRIBUTES','Horse care record and starting abilities required');
 const t=care.training,site=state.runtime.facilities.sites[horse.current_residence_id];
 const skills=state.runtime.people[horse.trainer_id]?.game_training_skills||
  modeledTrainerSkills(horse.trainer_id,state.rng.seed);
 const score=cap(a.current_ability/99*.61+t.readiness*.21+
  (t.speedCondition+t.staminaCondition)/2*.09+skills.roleAttributes.race_placement*.09-
  t.currentRisk*.07);
 return {horse_id:id,as_of:state.clock.date,owner_id:horse.owner_organization_id,
  trainer_id:horse.trainer_id,site_id:site.id,base_ability:a.current_ability,
  potential_ability:a.potential_ability,readiness:t.readiness,fitness:t.fitness,
  fatigue:t.fatigue,confidence:t.confidence,stress:t.stress,
  soundness_risk:t.currentRisk,soreness_days:t.sorenessDays,
  conditioning:t.staminaCondition,speed_condition:t.speedCondition,
  feed:care.policy.feed,care:care.policy.care,barn_quality:site.quality,
  monthly_budget_minor:care.policy.monthly_budget_minor,
  month_spent_minor:care.finance.spent_minor,
  trainer_gameplay_skills:structuredClone(skills.roleAttributes),
  race_performance_index:round4(score),
  eligible_on_condition:t.sorenessDays===0&&t.readiness>=.45&&t.currentRisk<.78&&
   care.history.at(-1)?.unfunded!==true,
  provenance:'MODELED_GAME_RACE_PREPARATION_NOT_PROBABILITY_OR_HISTORICAL_FACT'};
}
/** This will be called by the official results settlement, not by profile/UI.
 * It does NOT fabricate a race result, payout, or medical diagnosis.
 */
export function modelHorsePostRaceResponse(record,horse,{race_id,finish,field_size,
 distance_furlongs,travel_miles=0}={},seed=19990101){
 ensure(record?.schema===HORSE_CARE_SCHEMA&&horse?.horse_id===record.horse_id&&
  typeof race_id==='string'&&race_id.length>0&&money(finish)&&finish>=1&&
  money(field_size)&&field_size>=finish&&field_size>=2&&field_size<=24&&
  Number.isFinite(distance_furlongs)&&distance_furlongs>=4&&distance_furlongs<=18&&
  Number.isFinite(travel_miles)&&travel_miles>=0,
  'HORSE_RACE_RESPONSE','Actual race result parameters needed');
 const next=structuredClone(record);
 const training=next.training,effort=cap(.55+distance_furlongs*.045);
 const impact=effort*(.085+.05*training.currentRisk)+Math.min(.025,travel_miles/15000);
 training.fatigue=round4(training.fatigue+impact);
 training.fitness=round4(training.fitness-.005-.003*effort);
 training.stress=round4(training.stress+.014+Math.min(.028,travel_miles/15000));
 training.confidence=round4(training.confidence+.04*(1-(finish-1)/(field_size-1))-.019);
 training.currentRisk=round4(training.currentRisk+impact*.19);
 training.readiness=round4(training.readiness-.08-.03*effort);
 if(seedPart(seed,horse.horse_id+':'+race_id+':soreness')<
  .001+.023*training.currentRisk*training.currentRisk){
  training.sorenessDays=Math.max(training.sorenessDays,3);
  training.alerts.push({date:training.asOf,kind:'MODELED_POSTRACE_SORENESS',
   note:'Simulated monitoring condition, not a clinical finding'});
 }
 next.history.push({date:training.asOf,kind:'RACE_RECOVERY_PROJECTION',
  race_id,finish,field_size,travel_miles,readiness:training.readiness,
  fatigue:training.fatigue,health_risk:training.currentRisk});
 if(next.history.length>45)next.history.splice(0,next.history.length-45);
 return next;
}
