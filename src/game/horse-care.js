/**
 * WTW 1999 — ONE horse-care economy and condition loop in the game-run save.
 * Model assumptions, not sourced training bills or veterinary diagnoses.
 * Player and AI share the same commands, money limits and development rules.
 * This module never advances its own clock or modifies the founding source.
 */
import {ensure,isObject,worldIdentity,validDate} from './contracts.js';
import {TRAINING_PLANS,createHorseTrainingRecord,advanceHorseTrainingDay,recommendHorseWorkout}
 from '../../public/1999/engine/horse-development.mjs';
import {horseTravelStatus,effectiveHorseCareSite} from './shipping-1999.js';
import {trainerDailyFee} from './trainer-contracts-1999.js';
import {project1999TrainerSourceSkills} from '../../public/1999/engine/source-personnel-gameplay-1999.mjs';
import {index1999WorkplacePersonnel,select1999WorkplacePerson,
 project1999SupportStaffSourceSkills} from '../../public/1999/engine/source-personnel-gameplay-1999.mjs';

export const HORSE_CARE_SCHEMA='WTW_1999_CONNECTED_HORSE_CARE_V1';
export const TRAINER_SKILLS_SCHEMA='WTW_1999_TRAINER_SKILLS_GAME_V1';
export const HORSE_CARE_COMMANDS=Object.freeze(['SET_HORSE_CARE_POLICY','SET_1999_RACE_PREPARATION']);
export const HORSE_RACE_PREPARATION_SCHEMA='WTW_1999_TARGETED_RACE_PREPARATION_V1';
export const RACE_PREPARATION_APPROACHES=Object.freeze(['BALANCED','SHARPEN','CONSERVE']);
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
export function modeledTrainerSkills(personId,seed=19990101,identity=null){
 ensure(/^P-[A-Za-z0-9-]+$/.test(personId)&&Number.isSafeInteger(seed)&&seed>0,
  'TRAINER_SKILLS','Approved trainer identity and seed required');
 // Real V10 trainer P-ID source skills take precedence over the old
 // standalone trainer-ID hash. Preserve legacy pilot behavior only for
 // people who do not have a canonical source rating record.
 if(identity){
  ensure(identity.id===personId,'TRAINER_SKILLS','Trainer rating source ID mismatch');
  const direct=project1999TrainerSourceSkills(identity);
  if(direct)return {schema:TRAINER_SKILLS_SCHEMA,person_id:personId,...direct};
 }
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
function descriptor(state,horse,site,skills,policy){
 const feed=FEED_PROGRAMS[policy.feed],care=CARE_PROGRAMS[policy.care];
 const fee=trainerDailyFee(state,horse,skills);
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
const raceDays=(from,to)=>(Date.parse(to+'T12:00:00Z')-
 Date.parse(from+'T12:00:00Z'))/86400000;
function preparationStep(prep,training,day){
 const remaining=raceDays(day,prep.race_date);
 let phase,workout;
 if(remaining<=1){phase='FINAL_REST';workout='REST'}
 else if(remaining<=3){phase='TAPER';workout='LIGHT'}
 else if(remaining<=8){
  phase='SHARPENING';
  workout=prep.approach==='CONSERVE'?'LIGHT':
   remaining%2===0?'PREP':'LIGHT';
 }else{
  phase='FOUNDATION';
  workout=prep.approach==='CONSERVE'?'LIGHT':
   prep.approach==='SHARPEN'&&training.daysSinceSpeed>=4&&
   training.fatigue<=.29&&training.currentRisk<.48?'SPEED':'BALANCED';
 }
 if(training.sorenessDays>0||training.currentRisk>=.65||training.fatigue>=.61){
  workout='REST';phase='WELFARE_REST';
 }else if(workout!=='REST'&&(training.currentRisk>=.55||training.fatigue>=.46)){
  workout='LIGHT';phase='WELFARE_LIGHT';
 }
 return {phase,workout,days_to_race:remaining,
  modeled_welfare_override:phase.startsWith('WELFARE_')};
}
function closeRacePreparation(record,day,reason,emit){
 const p=record.race_preparation;
 if(!p||p.status!=='ACTIVE')return;
 p.status=reason==='OFFICIAL_RESULT'?'COMPLETED':'CANCELLED';
 p.closed_on=day;p.close_reason=reason;
 emit('HORSE_RACE_PREPARATION_CLOSED',{horse_id:record.horse_id,
  race_id:p.race_id,owner_id:p.owner_id,approach:p.approach,
  status:p.status,reason,closed_on:day});
}
function authorizedRacePreparation(state,horseId,raceId){
 const h=state.runtime.registered_horses?.by_id?.[horseId],
  r=state.runtime.races?.[raceId],
  e=state.runtime.entries?.[raceId+':'+horseId];
 ensure(Boolean(h)&&h.starting_attributes&&r&&r.source===
  'WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'&&
  r.status==='ENTRIES_OPEN'&&
  e?.status==='BOOKED'&&e.owner_id===h.owner_organization_id&&
  e.trainer_id===h.trainer_id&&e.jockey_id&&
  state.runtime.racing?.jockeys?.[e.jockey_id],
  'HORSE_RACE_PREP_BOOKING','Use a real booked game horse and an open 1999 race');
 return {horse:h,race:r,entry:e};
}
/** Read-only owner preparation outlook, tied to one booked race and the
 * actual paid training model; this never manufactures a workout or result. */
export function get1999RacePreparation(state,world,{horse_id,race_id}={}){
 const {horse,race,entry}=authorizedRacePreparation(state,horse_id,race_id);
 ensure(state.player.role==='owner'&&
  state.player.operation_id===horse.owner_organization_id,
  'HORSE_RACE_PREP_PERMISSION','Only the horse owner can view this management plan');
 const record=state.runtime.horse?.[horse_id];
 ensure(record?.schema===HORSE_CARE_SCHEMA,
  'HORSE_RACE_PREP_RECORD','Real current horse training record is required');
 const left=raceDays(state.clock.date,race.date);
 const current=record.race_preparation?.status==='ACTIVE'?
  record.race_preparation:null;
 const mode=current?.race_id===race_id?current.approach:'BALANCED';
 const modeled=preparationStep({approach:mode,race_date:race.date},record.training,state.clock.date);
 return structuredClone({
  schema:HORSE_RACE_PREPARATION_SCHEMA,
  date:state.clock.date,expected_revision:state.revision,
  horse_id,race_id,race_date:race.date,track_id:race.track_id,
  owner_id:horse.owner_organization_id,trainer_id:horse.trainer_id,
  jockey_id:entry.jockey_id,days_until_race:left,
  eligible_to_start:left>=2&&left<=28,
  approaches:RACE_PREPARATION_APPROACHES,
  active_plan:current,current_workout:modeled,
  horse_condition:{readiness:record.training.readiness,
   fitness:record.training.fitness,fatigue:record.training.fatigue,
   soundness_risk:record.training.currentRisk,
   soreness_days:record.training.sorenessDays},
  actual_funded_care_program:record.policy.care,
  original_training_plan:record.policy.training_plan,
  warning:'MODELED_CONDITION_WORKLOAD_NOT_VETERINARY_CLEARANCE_OR_RACE_RESULT',
  source:'LOCAL_APPROVED_GAME_CARE_AND_RACE_ENTRY_NO_NETWORK'});
}
/** Owner-authorized schedule, not an artificial training simulation.
 * All real workouts and owner charges still happen in advanceGameHorseCare. */
export function set1999RacePreparation({state,world,command,emit}){
 const p=command.payload;
 ensure(command.actor==='player'&&state.player.role==='owner'&&
  isObject(p)&&typeof p.horse_id==='string'&&
  typeof p.race_id==='string'&&
  (p.approach==='CANCEL'||RACE_PREPARATION_APPROACHES.includes(p.approach)),
  'HORSE_RACE_PREP_PERMISSION','Only the player owner can select a supported race preparation');
 ensure(Number.isSafeInteger(p.expected_revision)&&
  p.expected_revision===state.revision,
  'HORSE_RACE_PREP_STALE','Game date or management choices changed; renew the current quote');
 if(p.approach==='CANCEL'){
  const h=state.runtime.registered_horses?.by_id?.[p.horse_id],
   record=state.runtime.horse?.[p.horse_id],active=record?.race_preparation;
  ensure(h&&h.owner_organization_id===state.player.operation_id&&
   active?.status==='ACTIVE'&&active.race_id===p.race_id,
   'HORSE_RACE_PREP_ACTIVE','Only the owner can cancel their exact active race preparation');
  closeRacePreparation(record,state.clock.date,'OWNER_CANCELLED',emit);
  return;
 }
 const outlook=get1999RacePreparation(state,world,p);
 ensure(outlook.eligible_to_start,'HORSE_RACE_PREP_WINDOW',
  'Start an actual booked race preparation between two and twenty-eight days before the race');
 const record=state.runtime.horse[p.horse_id],existing=record.race_preparation;
 ensure(!existing||existing.status!=='ACTIVE'||existing.race_id===p.race_id,
  'HORSE_RACE_PREP_CONFLICT','Cancel the other booked-race preparation before changing targets');
 record.race_preparation={
  schema:HORSE_RACE_PREPARATION_SCHEMA,horse_id:p.horse_id,
  owner_id:outlook.owner_id,race_id:p.race_id,
  race_date:outlook.race_date,approach:p.approach,
  selected_on:state.clock.date,status:'ACTIVE',
  original_training_plan:record.policy.training_plan,
  last_work_date:null,last_workout:null,
  closed_on:null,close_reason:null
 };
 emit('HORSE_RACE_PREPARATION_SELECTED',{horse_id:p.horse_id,
  race_id:p.race_id,owner_id:outlook.owner_id,
  trainer_id:outlook.trainer_id,approach:p.approach,
  race_date:outlook.race_date,days_to_race:outlook.days_until_race,
  prior_approach:existing?.status==='ACTIVE'?existing.approach:null,
  cash_charged_minor:0,uses_funded_daily_training:true});
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
export function initializeGameHorseCare(state,horse,world=null){
 if(!horse.starting_attributes)return;
 if(!state.runtime.horse[horse.horse_id])
  state.runtime.horse[horse.horse_id]=createHorseCareRecord(horse,state.clock.date);
 const person=state.runtime.people[horse.trainer_id]||{};
 if(!person.game_training_skills)
  state.runtime.people[horse.trainer_id]={...person,
   game_training_skills:modeledTrainerSkills(horse.trainer_id,state.rng.seed,
    world?worldIdentity(world,'people',horse.trainer_id):null)};
}
function localHorseCareWorkforce(index,trackId,seed,horseId){
 if(!index||!trackId)return null;
 const roles=['groom','exercise_rider','veterinarian','farrier'];
 return Object.fromEntries(roles.map(role=>{
  const person=select1999WorkplacePerson(index,role,trackId,seed,horseId);
  return [role,person?project1999SupportStaffSourceSkills(person):null];
 }));
}
export function apply1999SourceCareStaff(context,workforce){
 const groom=workforce?.groom,exerciseRider=workforce?.exercise_rider,
  veterinarian=workforce?.veterinarian,farrier=workforce?.farrier;
 return {...context,
  supervision:cap(context.supervision+((groom?.care??.55)-.55)*.20),
  observation:groom?.observation??.55,
  trainingSupport:exerciseRider?.trainingResponse!==undefined?
   .60*exerciseRider.trainingResponse+.40*exerciseRider.paceWork:.55,
  prevention:veterinarian?.prevention??.55,
  treatment:veterinarian?.treatment??.55,
  hoofCare:farrier?.hoofCare??.55};
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
 if(record.race_preparation?.status==='ACTIVE'&&
  record.race_preparation.original_training_plan!==record.policy.training_plan)
  closeRacePreparation(record,state.clock.date,'OWNER_CHANGED_TRAINING_POLICY',emit);
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
  for(const day of record.history)if(day.source_staff_ids){
   ensure(isObject(day.source_staff_ids)&&
    typeof day.source_staff_workplace_id==='string',
    'HORSE_CARE_SAVE','Invalid saved care-staff source links');
   for(const [role,personId] of Object.entries(day.source_staff_ids)){
    ensure(['groom','exercise_rider','veterinarian','farrier'].includes(role),
     'HORSE_CARE_SAVE','Unknown source care-staff role');
    if(personId===null)continue;
    const person=worldIdentity(world,'people',personId);
    ensure(Boolean(person)&&person.role===role&&
     person.workplaceId===day.source_staff_workplace_id&&
     Boolean(project1999SupportStaffSourceSkills(person)),
     'HORSE_CARE_SAVE','Daily care-staff link must resolve to the saved role and workplace');
   }
  }
  ensure(Boolean(worldIdentity(world,'people',h.trainer_id)),'HORSE_CARE_SAVE','Unknown trainer');
  const prep=record.race_preparation;
  if(prep!==undefined){
   ensure(isObject(prep)&&prep.schema===HORSE_RACE_PREPARATION_SCHEMA&&
    prep.horse_id===id&&prep.owner_id===h.owner_organization_id&&
    typeof prep.race_id==='string'&&
    validDate(prep.race_date)&&validDate(prep.selected_on)&&
    prep.race_date>=prep.selected_on&&
    prep.selected_on<=state.clock.date&&
    RACE_PREPARATION_APPROACHES.includes(prep.approach)&&
    Object.hasOwn(TRAINING_PLANS,prep.original_training_plan)&&
    ['ACTIVE','COMPLETED','CANCELLED'].includes(prep.status)&&
    (prep.last_work_date===null||validDate(prep.last_work_date)&&
      prep.last_work_date>=prep.selected_on&&prep.last_work_date<=state.clock.date)&&
    (prep.last_workout===null||Object.hasOwn(TRAINING_PLANS,prep.last_workout))&&
    (prep.status==='ACTIVE'?prep.closed_on===null&&prep.close_reason===null:
     validDate(prep.closed_on)&&prep.closed_on<=state.clock.date&&
      typeof prep.close_reason==='string'),
    'HORSE_RACE_PREP_SAVE','Invalid targeted training cycle in player career');
   const race=state.runtime.races?.[prep.race_id],
    entry=state.runtime.entries?.[prep.race_id+':'+id];
   ensure(race&&race.date===prep.race_date&&entry&&
    entry.owner_id===prep.owner_id,
    'HORSE_RACE_PREP_SAVE','Saved race preparation lost its real booking or horse owner');
  }

 }
}
export function advanceGameHorseCare({state,world,emit}){
 const horses=Object.values(state.runtime.registered_horses?.by_id||{}).sort((a,b)=>
  a.horse_id.localeCompare(b.horse_id));
 const accounts=state.runtime.finances.operation_balances_minor,day=state.clock.date;
 const sourceStaffIndex=world?index1999WorkplacePersonnel(world.entities.people||[]):null;
 const occupancy={};
 for(const h of horses){
  const liveSite=effectiveHorseCareSite(state,h);
  if(liveSite)occupancy[liveSite.id]=(occupancy[liveSite.id]||0)+1;
 }
 for(const h of horses){
  if(!h.starting_attributes){emit('HORSE_NEEDS_ATTRIBUTES',{horse_id:h.horse_id});continue}
  initializeGameHorseCare(state,h,world);
  const r=state.runtime.horse[h.horse_id];
  if(r.last_day===day)continue;
  const prep=r.race_preparation;
  if(prep?.status==='ACTIVE'){
   const target=state.runtime.races?.[prep.race_id],
    entry=state.runtime.entries?.[prep.race_id+':'+h.horse_id];
   if(day>prep.race_date||!target||target.status==='CANCELLED_INSUFFICIENT_FIELD'||
    !entry||!['BOOKED','RESULTED'].includes(entry.status)||
    h.owner_organization_id!==prep.owner_id||
    h.trainer_id!==entry.trainer_id){
    closeRacePreparation(r,day,
     target?.status==='OFFICIAL_SIM_RESULT'?'OFFICIAL_RESULT':
     !target||target.status==='CANCELLED_INSUFFICIENT_FIELD'?
      'RACE_CANCELLED_OR_MISSING':'ENTRY_OR_CAREER_CHANGED',emit);
   }
  }
  const livePrep=r.race_preparation?.status==='ACTIVE'?
   r.race_preparation:null;
  const site=effectiveHorseCareSite(state,h),trip=horseTravelStatus(state,h.horse_id);
  const inTransit=trip&&['OUTBOUND','RETURNING'].includes(trip.status);
  ensure(Boolean(site)||inTransit,'HORSE_CARE_SITE','Registered horse lost its physical barn');
  if(r.finance.month!==day.slice(0,7)){
   r.finance.month=day.slice(0,7);r.finance.spent_minor=0;
  }
  const skills=state.runtime.people[h.trainer_id]?.game_training_skills||
   modeledTrainerSkills(h.trainer_id,state.rng.seed,
    world?worldIdentity(world,'people',h.trainer_id):null);
  state.runtime.people[h.trainer_id]={
   ...(state.runtime.people[h.trainer_id]||{}),game_training_skills:skills};
  const p=r.policy;
  if(inTransit){
   // Transport payment was posted once when the carrier was booked. While
   // physically between barns a horse cannot perform track workouts and
   // neither barn earns fictitious board or trainer fees for that day.
   const home=state.runtime.facilities.sites[h.current_residence_id];
   const model=descriptor(state,h,home,skills,p);
   const carrierCare={nutrition:.62,supervision:.6,barnQuality:.60,
    crowding:.35,workout:'REST'};
   const work=advanceHorseTrainingDay({...r.training,plan:'REST'},
    model.horse,model.trainer,day,state.rng.seed,carrierCare);
   work.horse.trainingSpent=r.training.trainingSpent;
   r.training=work.horse;r.last_day=day;
   if(livePrep){livePrep.last_work_date=day;livePrep.last_workout='REST'}
   r.history.push({date:day,work:'REST',agent_reason:'IN_TRANSIT_RECOVERY',
    paid_minor:0,nutrition:'CARRIER_INCLUDED_IN_SHIPPING',
    care:'CARRIER_INCLUDED_IN_SHIPPING',facility_id:null,
    travel_status:trip.status,crowding:null,barn_quality:null,
    ...(livePrep?{preparation_race_id:livePrep.race_id,
     preparation_phase:'TRAVEL_REST'}:{}),
    fitness:r.training.fitness,readiness:r.training.readiness,
    risk:r.training.currentRisk,unfunded:false});
   if(r.history.length>45)r.history.splice(0,r.history.length-45);
   emit('HORSE_TRANSIT_CARE_DAY',{horse_id:h.horse_id,owner_id:h.owner_organization_id,
    trainer_id:h.trainer_id,status:trip.status,site_id:null,paid_minor:0,
    workout:'REST',reason:'PHYSICAL_TRANSPORT_NO_BARN_BOARDING',
    readiness:r.training.readiness,stress:r.training.stress});
   continue;
  }
  const info=descriptor(state,h,site,skills,p);
  const context=estimateContext(p,site,occupancy[site.id]??0);
  const workforce=localHorseCareWorkforce(sourceStaffIndex,site.host_track_id,
   state.rng.seed,h.horse_id);
  const careContext=apply1999SourceCareStaff(context,workforce);
  const train={...r.training,plan:p.training_plan};
  const allowed=site.status==='ACTIVE'&&site.staff_count>=site.staff_required;
  const arrivalToday=trip?.history?.at(-1)?.date===day&&
    ['ARRIVED_AT_TRACK','RETURNED_HOME'].includes(trip.history.at(-1).event);
  const forcedRest=arrivalToday;
  const prepStep=livePrep?preparationStep(livePrep,r.training,day):null;
  // Use the SAME trainer model's rest/day-safety signal; targeted owner
  // preparation cannot bypass its weekly rest or fatigue-limited workload.
  const trainerSafety=prepStep?recommendHorseWorkout(train,info.horse,info.trainer,day):null;
  const workout=forcedRest?'REST':prepStep?
   trainerSafety==='REST'?'REST':
   trainerSafety==='LIGHT'&&prepStep.workout!=='REST'?'LIGHT':
   prepStep.workout:r.agent?.date===day?r.agent.workout:null;
  const prepPhase=prepStep?(forcedRest?'ARRIVAL_REST':
   workout!==prepStep.workout?'TRAINER_SAFETY_ADJUSTMENT':prepStep.phase):null;
  const work=advanceHorseTrainingDay(train,info.horse,info.trainer,day,
   state.rng.seed,{...careContext,workout});
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
   // The facility receives the combined boarding/training invoice, then
   // remits the trainer's earned fee to the permanent P-ID. The site keeps
   // the boarding portion, irrespective of ownership or temporary location.
   addFinance(state,operator,-info.fee_minor,'HORSE_CARE_TRAINER_REMITTANCE',
    h.horse_id,site.id,transaction,{trainer_id:h.trainer_id,
     owner_id:h.owner_organization_id});
   const paid=state.runtime.racing?.trainer_finances_minor;
   ensure(isObject(paid),'HORSE_CARE_FINANCES','Missing saved trainer earnings registry');
   const previous=paid[h.trainer_id]||0;
   ensure(money(previous)&&money(previous+info.fee_minor),
    'HORSE_CARE_FINANCES','Trainer earnings must remain valid integer cents');
   paid[h.trainer_id]=previous+info.fee_minor;
   state.runtime.finances.ledger.push({date:state.clock.date,
    transaction_id:transaction,kind:'HORSE_CARE_TRAINER_EARNINGS',
    operation_id:null,person_id:h.trainer_id,horse_id:h.horse_id,
    site_id:site.id,amount_minor:info.fee_minor,
    source:'MODELED_PAID_DAILY_TRAINER_SERVICE'});
   // Feed, medicines and workout supplies leave the game economy for a
   // modeled external supplier; explicit settlement prevents money from
   // disappearing without an auditable counterparty.
   const outside=used-service;
   if(outside>0)state.runtime.finances.ledger.push({date:state.clock.date,
    transaction_id:transaction,kind:'HORSE_CARE_SUPPLIER_RECEIPT',
    operation_id:null,horse_id:h.horse_id,site_id:site.id,
    amount_minor:outside,owner_id:h.owner_organization_id,
    source:'MODELED_EXTERNAL_CARE_SUPPLY_PROVIDER'});
   r.finance.spent_minor+=used;r.finance.lifetime_minor+=used;
  }
  r.training=result.horse;r.last_day=day;
  if(livePrep){livePrep.last_work_date=day;livePrep.last_workout=result.work;
   emit('HORSE_RACE_PREPARATION_WORKOUT',{horse_id:h.horse_id,
    owner_id:h.owner_organization_id,race_id:livePrep.race_id,
    days_to_race:prepStep.days_to_race,
    phase:prepPhase,
    planned_workout:workout,actual_workout:result.work,
    funded:canPay,paid_minor:used,readiness:r.training.readiness,
    fatigue:r.training.fatigue,risk:r.training.currentRisk});
  }
  r.history.push({date:day,work:result.work,
   ...(livePrep?{preparation_race_id:livePrep.race_id,
    preparation_phase:prepPhase}:{}),
   agent_reason:livePrep?'OWNER_APPROVED_RACE_PREPARATION':
    r.agent?.date===day?r.agent.reason:null,paid_minor:used,
   nutrition:p.feed,care:p.care,facility_id:site.id,
   ...(workforce?{source_staff_ids:Object.fromEntries(Object.entries(workforce).
    map(([role,profile])=>[role,profile?.source_person_id??null])),
    source_staff_workplace_id:site.host_track_id??null}:{}),
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
 const t=care.training,site=effectiveHorseCareSite(state,horse);
 const skills=state.runtime.people[horse.trainer_id]?.game_training_skills||
  modeledTrainerSkills(horse.trainer_id,state.rng.seed,
   world?worldIdentity(world,'people',horse.trainer_id):null);
 const score=cap(a.current_ability/99*.61+t.readiness*.21+
  (t.speedCondition+t.staminaCondition)/2*.09+skills.roleAttributes.race_placement*.09-
  t.currentRisk*.07);
 return {horse_id:id,as_of:state.clock.date,owner_id:horse.owner_organization_id,
  trainer_id:horse.trainer_id,site_id:site?.id??null,base_ability:a.current_ability,
  potential_ability:a.potential_ability,readiness:t.readiness,fitness:t.fitness,
  fatigue:t.fatigue,confidence:t.confidence,stress:t.stress,
  soundness_risk:t.currentRisk,soreness_days:t.sorenessDays,
  conditioning:t.staminaCondition,speed_condition:t.speedCondition,
  feed:care.policy.feed,care:care.policy.care,barn_quality:site?.quality??null,
  monthly_budget_minor:care.policy.monthly_budget_minor,
  month_spent_minor:care.finance.spent_minor,
  trainer_gameplay_skills:structuredClone(skills.roleAttributes),
  race_preparation:care.race_preparation?structuredClone(care.race_preparation):null,
  race_performance_index:round4(score),
  eligible_on_condition:Boolean(site)&&t.sorenessDays===0&&
   t.readiness>=.45&&t.currentRisk<.78&&
   care.history.at(-1)?.unfunded!==true,
  provenance:'MODELED_GAME_RACE_PREPARATION_NOT_PROBABILITY_OR_HISTORICAL_FACT'};
}
/** This will be called by the official results settlement, not by profile/UI.
 * It does NOT fabricate a race result, payout, or medical diagnosis.
 */
export function modelHorsePostRaceResponse(record,horse,{race_id,finish,field_size,
 distance_furlongs,travel_miles=0,track_recovery_multiplier=1}={},seed=19990101){
 ensure(record?.schema===HORSE_CARE_SCHEMA&&horse?.horse_id===record.horse_id&&
  typeof race_id==='string'&&race_id.length>0&&money(finish)&&finish>=1&&
  money(field_size)&&field_size>=finish&&field_size>=2&&field_size<=24&&
  Number.isFinite(distance_furlongs)&&distance_furlongs>=4&&distance_furlongs<=18&&
  Number.isFinite(travel_miles)&&travel_miles>=0&&
  Number.isFinite(track_recovery_multiplier)&&
  track_recovery_multiplier>=.6&&track_recovery_multiplier<=1.4,
  'HORSE_RACE_RESPONSE','Actual race result parameters needed');
 const next=structuredClone(record);
 const training=next.training,effort=cap(.55+distance_furlongs*.045);
 const impact=effort*(.085+.05*training.currentRisk)+Math.min(.025,travel_miles/15000);
 training.fatigue=round4(training.fatigue+impact);
 training.fitness=round4(training.fitness-.005-.003*effort);
 training.stress=round4(training.stress+.014+Math.min(.028,travel_miles/15000));
 training.confidence=round4(training.confidence+.04*(1-(finish-1)/(field_size-1))-.019);
 training.currentRisk=round4(training.currentRisk+impact*.19*track_recovery_multiplier);
 training.readiness=round4(training.readiness-.08-.03*effort);
 if(seedPart(seed,horse.horse_id+':'+race_id+':soreness')<
  (.001+.023*training.currentRisk*training.currentRisk)*track_recovery_multiplier){
  training.sorenessDays=Math.max(training.sorenessDays,3);
  training.alerts.push({date:training.asOf,kind:'MODELED_POSTRACE_SORENESS',
   note:'Simulated monitoring condition, not a clinical finding'});
 }
 next.history.push({date:training.asOf,kind:'RACE_RECOVERY_PROJECTION',
  race_id,finish,field_size,travel_miles,track_recovery_multiplier,
  readiness:training.readiness,
  fatigue:training.fatigue,health_risk:training.currentRisk});
 if(next.history.length>45)next.history.splice(0,next.history.length-45);
 return next;
}
