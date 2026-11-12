/**
 * WIRE TO WIRE — January 1999 Horse Development V1
 * Shared pure domain engine, used by premium game and Node verification.
 * A TRAINING MODEL, not certified veterinary findings, workouts or results.
 * Reads canonical/test horse identities without modifying source identities,
 * pedigrees, historical results, physical location or age/ability ceilings.
 * Mutable output lives ONLY in the approved game's horseDevelopment save slot.
 */
export const HORSE_DEVELOPMENT_SCHEMA='WTW_1999_HORSE_DEVELOPMENT_V1';
export const TRAINING_PLANS=Object.freeze({
 AUTO:{label:'Trainer-Directed',load:.44,cost:0,focus:'autonomy'},
 REST:{label:'Rest & Recover',load:0,cost:0,focus:'recovery'},
 LIGHT:{label:'Light Gallops',load:.23,cost:12,focus:'base'},
 BALANCED:{label:'Balanced Conditioning',load:.46,cost:24,focus:'base'},
 STAMINA:{label:'Stamina Development',load:.69,cost:40,focus:'stamina'},
 SPEED:{label:'Speed & Intervals',load:.82,cost:55,focus:'speed'},
 GATE:{label:'Gate Schooling',load:.40,cost:42,focus:'gate'},
 PREP:{label:'Race Preparation',load:.56,cost:35,focus:'sharpness'}
});
export const TRAINING_PLAN_IDS=Object.freeze(Object.keys(TRAINING_PLANS));
const START='1999-01-01',DAY=86400000;
const cap=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
const rnd=v=>Math.round(v*10000)/10000;
const isoDate=date=>{
 if(typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date))throw Error('Invalid training date');
 const ms=Date.parse(date+'T00:00:00.000Z');
 if(!Number.isFinite(ms)||new Date(ms).toISOString().slice(0,10)!==date||date<START||date>'2080-12-31')
  throw Error('Training date outside career timeline');
 return ms;
};
const dateString=ms=>new Date(ms).toISOString().slice(0,10);
const serial=(date)=>Math.round((isoDate(date)-isoDate(START))/DAY);
function random01(seed,key){
 let x=(2166136261^(seed>>>0))>>>0;
 for(let i=0;i<key.length;i++){x^=key.charCodeAt(i);x=Math.imul(x,16777619)}
 x^=x>>>16;x=Math.imul(x,2246822507);x^=x>>>13;return (x>>>0)/4294967296;
}
const attr=(v,key,fallback)=>Number.isFinite(v?.[key])?cap(v[key]):fallback;
function trainerQuality(trainer={}){
 const a=trainer.roleAttributes||trainer.attributes||{};
 const current=Number.isFinite(trainer.ability?.current)?trainer.ability.current/99:.5;
 return {
  conditioning:cap(attr(a,'conditioning',current)*.74+current*.26),
  planning:cap(attr(a,'workout_design',current)*.72+current*.28),
  young:cap(attr(a,'young_horse_development',current)*.75+current*.25),
  health:cap(attr(a,'veterinary_coordination',current)*.75+current*.25),
  layoff:cap(attr(a,'layoff_management',current)*.75+current*.25)
 };
}
function isInactive(horse){
 const s=String(horse?.racingStatus1999||horse?.racingStatus||horse?.career?.status||'').toUpperCase();
 return /^(RETIRED|AT_STUD|BROODMARE|TOO_YOUNG|DECEASED)$/.test(s);
}
function assertHorse(horse){
 if(!horse||!/^H-[A-Za-z0-9-]+$/.test(horse.id||'')||!horse.attributes)
  throw Error('Training requires a source-linked WTW horse ID and attributes');
}
function defaultPlan(horse){return isInactive(horse)?'REST':'BALANCED'}
export function createHorseTrainingRecord(horse,asOf=START){
 assertHorse(horse);isoDate(asOf);
 const a=horse.attributes,inactive=isInactive(horse);
 const fitness=attr(a,'fitness',.48);
 const fatigue=attr(a,'fatigue',.14);
 const gate=attr(a,'gate_composure',.4);
 const conf=attr(a,'confidence',.5);
 const stress=attr(a,'stress',.17);
 const innateRisk=attr(a,'soundness_risk',.5);
 const readiness=cap(fitness*.63+(1-fatigue)*.18+conf*.12+gate*.07);
 return {horseId:horse.id,nameAtOpening:horse.name,trainerId:horse.trainerId||null,
  plan:defaultPlan(horse),status:inactive?'INACTIVE':'ACTIVE',
  fitness:rnd(fitness),fatigue:rnd(fatigue),readiness:rnd(readiness),
  staminaCondition:rnd(.25+fitness*.45),speedCondition:rnd(.25+fitness*.45),
  gateSchooling:rnd(gate),confidence:rnd(conf),stress:rnd(stress),
  innateRisk:rnd(innateRisk),currentRisk:rnd(cap(innateRisk*.56+fatigue*.36+stress*.08)),
  sorenessDays:0,sorenessEvents:0,consecutiveHard:0,workDays:0,restDays:0,
  missedDays:0,streak:0,daysSinceSpeed:30,lastWork:null,asOf,
  trainingSpent:0,history:[],alerts:[],
  provenance:'MODELED_POST_1999_GAMEPLAY_CONDITION_NOT_SOURCED_HEALTH_OR_WORKOUT'};
}
function validateRecord(record,horse){
 if(!record||record.horseId!==horse.id||!TRAINING_PLANS[record.plan])
  throw Error('Training save references invalid horse or plan');
 if(!['ACTIVE','INACTIVE'].includes(record.status))throw Error('Invalid training status');
 for(const key of ['fitness','fatigue','readiness','staminaCondition','speedCondition','gateSchooling',
   'confidence','stress','innateRisk','currentRisk']){
  if(!Number.isFinite(record[key])||record[key]<0||record[key]>1)throw Error('Invalid saved horse metric '+key);
 }
 if(!Number.isInteger(record.sorenessDays)||record.sorenessDays<0||
  !Number.isInteger(record.workDays)||record.workDays<0||
  !Number.isInteger(record.restDays)||record.restDays<0||
  !Array.isArray(record.history)||!Array.isArray(record.alerts))throw Error('Invalid horse training save');
 isoDate(record.asOf);
 return record;
}
function createDevelopmentRoot(horses){
 const records={};
 for(const horse of horses){assertHorse(horse);
  if(Object.hasOwn(records,horse.id))throw Error('Duplicate stable horse ID');
  records[horse.id]=createHorseTrainingRecord(horse);
 }
 return {schema:HORSE_DEVELOPMENT_SCHEMA,processedThrough:START,horses:records,
  ledger:[],monthlyArchive:{},trainingDays:0,events:[],totalSpent:0,revision:0,
  provenance:'1999_GAME_RUN_MUTABLE_TRAINING_NOT_HISTORICAL_CANON'};
}
function validateRoot(root,horses){
 if(root.schema!==HORSE_DEVELOPMENT_SCHEMA)throw Error('Unsupported training save schema');
 isoDate(root.processedThrough);
 if(!root.horses||typeof root.horses!=='object'||!Array.isArray(root.ledger)||
    !Array.isArray(root.events)||!Number.isInteger(root.revision)||root.revision<0)
  throw Error('Corrupted training ledger');
 for(const horse of horses){
  if(!root.horses[horse.id])throw Error('Training save missing established horse '+horse.id);
  validateRecord(root.horses[horse.id],horse);
 }
 return root;
}
function prepareRoot(game,horses){
 if(!game||typeof game!=='object'||typeof game.date!=='string')throw Error('Missing approved career state');
 isoDate(game.date);
 if(!Array.isArray(horses)||horses.length===0)throw Error('Empty active stable');
 const prior=game.horseDevelopment;
 const root=prior?structuredClone(prior):createDevelopmentRoot(horses);
 if(prior)validateRoot(root,horses);
 return root;
}
function workFor(plan,dayOrdinal){
 if(plan==='REST')return 'REST';
 const weekday=(dayOrdinal+5)%7; // 1999-01-01 was Friday; Sunday off by default.
 if(weekday===0)return 'REST';
 if(plan==='LIGHT')return weekday===6?'REST':'LIGHT';
 if(plan==='BALANCED')return weekday===3?'LIGHT':'BALANCED';
 if(plan==='SPEED')return weekday===1||weekday===4?'SPEED':'LIGHT';
 if(plan==='STAMINA')return weekday===1||weekday===4?'STAMINA':'BALANCED';
 if(plan==='GATE')return weekday===2||weekday===5?'GATE':'LIGHT';
 if(plan==='PREP')return weekday===1?'SPEED':weekday===4?'PREP':'LIGHT';
 return plan;
}
/**
 * Delegated trainer chooses actual exercises from the same programs and
 * workload/health rules as the human. No scripted privilege or hidden stamina.
 * Better health coordination reduces unnecessary hard days.
 */
export function recommendHorseWorkout(record,horse,trainer,date){
 assertHorse(horse);validateRecord(record,horse);const ordinal=serial(date);
 const weekday=(ordinal+5)%7,t=trainerQuality(trainer);
 if(record.status==='INACTIVE'||record.sorenessDays>0||weekday===0)return 'REST';
 const limit=.48-t.health*.12;
 if(record.fatigue>limit+.13||record.currentRisk>.72-t.health*.1)return 'REST';
 if(record.fatigue>limit)return 'LIGHT';
 if(record.gateSchooling<.47&&weekday===2)return 'GATE';
 if(record.fitness<.53)return weekday===1||weekday===4?'STAMINA':'BALANCED';
 if(record.daysSinceSpeed>=5&&weekday===1&&record.fatigue<.35)return 'SPEED';
 if(record.readiness>.71&&record.fatigue<.28&&weekday===4)return 'PREP';
 return weekday===3?'LIGHT':'BALANCED';
}
function dayCharges(horse,trainer,plan,work){
 // Modeled 1999 per-diem care + trainer day fees + variable workout supplies.
 // No wage is charged twice: trainers are contractors paid horse-by-horse.
 const care=Number(horse.finances?.monthlyCareCost);
 const monthly=Number.isFinite(care)&&care>=0?care:1450;
 const rate=Number(trainer?.compensation?.dayRate);
 const trainerRate=Number.isFinite(rate)&&rate>=0?rate:54;
 const extras=work==='REST'?0:TRAINING_PLANS[work].cost;
 const dailyCare=Math.round(monthly/30.4375*100)/100;
 return {amount:Math.round((dailyCare+trainerRate+extras)*100)/100,
  components:{care:dailyCare,trainerDayFee:trainerRate,workoutSupplies:extras},
  basis:'1999_TEST_COST_ACCRUAL_NOT_CASH_POSTING'};

}
/**
 * One calendar day for one horse. The same inputs ALWAYS produce the same result.
 * The plan describes management intent; the weekly microcycle supplies rest days.
 * No sourced race results, genetic traits, career ability or medical diagnosis change.
 */
export function advanceHorseTrainingDay(record,horse,trainer,date,seed=19990101){
 assertHorse(horse);validateRecord(record,horse);const now=serial(date),prev=serial(record.asOf);
 if(now!==prev+1)throw Error('Training progression must advance exactly one day');
 if(!Number.isSafeInteger(seed)||seed<1)throw Error('Invalid training seed');
 const next={...record,history:[...record.history],alerts:[...record.alerts]};
 const t=trainerQuality(trainer),dayOrdinal=now;
 let work=next.status==='INACTIVE'?'REST':next.plan==='AUTO'?recommendHorseWorkout(next,horse,trainer,date):workFor(next.plan,dayOrdinal);
 if(next.sorenessDays>0)work='REST';
 const intensity=TRAINING_PLANS[work].load;
 const geneticallyTough=1-attr(horse.attributes,'soundness_risk',.48);
 const recovery=cap(.36+geneticallyTough*.34+t.health*.2);
 const response=.74+attr(horse.attributes,'training_focus',.5)*.27+t.conditioning*.32;
 const young=Number(horse.ageAtDate??horse.ageAtOpening)<4;
 const maturity=young?(.80+t.young*.25):1;
 const variability=.91+random01(seed,horse.id+':'+date+':response')*.18;
 const priorFatigue=next.fatigue;
 if(work==='REST'){
  next.fatigue=cap(next.fatigue-(.045+recovery*.055));
  next.stress=cap(next.stress-.034-recovery*.018);
  next.fitness=cap(next.fitness-.0018-(next.sorenessDays>0?.0015:0));
  next.restDays++;
  next.streak=0;next.consecutiveHard=0;
 }else{
  const load=intensity*(.90+random01(seed,horse.id+':'+date+':load')*.2);
  next.fatigue=cap(next.fatigue+load*(.085+.012*intensity)-recovery*.024);
  next.stress=cap(next.stress+load*.038-recovery*.013);
  next.fitness=cap(next.fitness+(load*.014*response*maturity*variability)*(1-priorFatigue*.72)-.0018);
  next.workDays++;next.streak++;
  next.consecutiveHard=intensity>=.65?next.consecutiveHard+1:0;
  next.daysSinceSpeed++;
  if(work==='STAMINA')next.staminaCondition=cap(next.staminaCondition+.0085*response*maturity*variability);
  if(work==='SPEED'){next.speedCondition=cap(next.speedCondition+.009*response*maturity*variability);next.daysSinceSpeed=0}
  if(work==='GATE')next.gateSchooling=cap(next.gateSchooling+.0105*(.6+t.planning*.55)*variability);
  if(work==='PREP'){next.speedCondition=cap(next.speedCondition+.0025*response);next.confidence=cap(next.confidence+.004)}
  if(work==='LIGHT'||work==='BALANCED')next.staminaCondition=cap(next.staminaCondition+.0015*response);
 }
 if(next.sorenessDays>0){
  next.sorenessDays--;
  if(next.sorenessDays===0)next.alerts.push({date,kind:'SIMULATED_REST_COMPLETED',
   note:'Soreness watch period completed; use a graded return to normal work'});
 }
 next.currentRisk=cap(next.innateRisk*.43+next.fatigue*.41+next.stress*.16+
  (next.consecutiveHard>=3?.13:0));
 // A modeled soreness interruption—not a diagnosis. A horse can become a
 // welfare caution while the historical identity remains untouched.
 const stressRisk=work==='SPEED'||work==='STAMINA'?1:.6;
 const chance=cap((.00015+.003*next.currentRisk*next.currentRisk+
  (next.fatigue>.68?.012*(next.fatigue-.68):0))*stressRisk,0,.045);
 if(work!=='REST'&&next.sorenessDays===0&&
    random01(seed,horse.id+':'+date+':soreness')<chance){
  next.sorenessDays=3+Math.floor(random01(seed,horse.id+':'+date+':layoff')*7);
  next.sorenessEvents++;
  next.alerts.push({date,kind:'MODELED_SORENESS_WATCH',
   note:'Training workload led to a simulated soreness watch; do not treat as a sourced veterinary diagnosis'});
 }
 if(next.currentRisk>.69&&(!next.alerts.length||next.alerts.at(-1).kind!=='HIGH_WORKLOAD_RISK')){
  next.alerts.push({date,kind:'HIGH_WORKLOAD_RISK',
   note:'Training load and fatigue warrant a lighter week and veterinary observation'});
 }
 if(next.fatigue>.58){next.confidence=cap(next.confidence-.0017)}
 else if(work!=='REST')next.confidence=cap(next.confidence+.0012);
 const freshness=1-next.fatigue;
 const recoveryPenalty=next.sorenessDays>0?.23:0;
 const sharpness=cap((next.speedCondition+next.staminaCondition)/2);
 next.readiness=cap(.48*next.fitness+.18*freshness+.12*next.gateSchooling+
  .12*next.confidence+.10*sharpness-.2*next.stress-recoveryPenalty);
 next.lastWork={date,work,planned:next.plan,load:rnd(intensity),sorenessWatch:next.sorenessDays>0};
 next.asOf=date;
 for(const key of ['fitness','fatigue','readiness','staminaCondition','speedCondition',
    'gateSchooling','confidence','stress','currentRisk'])next[key]=rnd(next[key]);
 next.history.push({...next.lastWork,fitness:next.fitness,fatigue:next.fatigue,
  readiness:next.readiness,risk:next.currentRisk});
 if(next.history.length>45)next.history=next.history.slice(-45);
 if(next.alerts.length>35)next.alerts=next.alerts.slice(-35);
 const breakdown=dayCharges(horse,trainer,next.plan,work);
 const charge=breakdown.amount;
 next.trainingSpent=Math.round((next.trainingSpent+charge)*100)/100;
 validateRecord(next,horse);
 return {horse:next,charge,work,breakdown:breakdown.components};
}
function horseRosterIndex(horses){
 const seen=new Set(),byId=new Map();
 for(const h of horses){
  assertHorse(h);if(seen.has(h.id))throw Error('Duplicate stable horse '+h.id);
  seen.add(h.id);byId.set(h.id,h);
 }return byId;
}
/** Plan assignment is atomic; it cannot retroactively change an already-run day. */
export function assignHorseTrainingPlan(game,{horse,plan,date=game?.date,stableHorses}={}){
 isoDate(date);if(!TRAINING_PLANS[plan])throw Error('Unsupported training program');
 assertHorse(horse);
 const roster=Array.isArray(stableHorses)?stableHorses:[horse];
 const allowed=horseRosterIndex(roster);
 if(!allowed.has(horse.id))throw Error('Horse is not part of the player stable');
 if(game.date!==date)throw Error('Training plan must be assigned on the current game date');
 const root=prepareRoot(game,roster);
 if(root.processedThrough!==game.date)throw Error('Process elapsed game days before assigning new work');
 const present=root.horses[horse.id];
 if(present.status==='INACTIVE'&&plan!=='REST')throw Error('Horse is outside active racing training');
 if(present.plan===plan)return game;
 root.horses[horse.id]={...present,plan};
 root.events.push({id:'PLAN-'+(root.revision+1)+'-'+horse.id,date,horseId:horse.id,
   type:'PLAN_ASSIGNED',plan,provenance:'PLAYER_DECISION_1999_GAME_RUN'});
 root.revision++;
 return {...game,horseDevelopment:root};
}
/**
 * Advance every missed day exactly once, in date order. Designed to be called
 * after the existing premium career clock is saved, not as a second clock.
 * Same save slot is used by named saves, refresh, import and export.
 */
export function simulateStableTrainingThrough(game,{horses,trainerById={},seed=19990101,date=game?.date}={}){
 if(!game||date!==game.date)throw Error('Training engine date must equal authoritative saved career date');
 isoDate(date);
 const byId=horseRosterIndex(horses);
 const root=prepareRoot(game,horses);
 if(root.processedThrough>date)throw Error('Cannot rewind a completed training history');
 let daysProcessed=0;
 for(let ts=isoDate(root.processedThrough)+DAY;ts<=isoDate(date);ts+=DAY){
  const day=dateString(ts),dayEvents=[],horseCharges=[];
  for(const [id,horse] of byId){
   const prior=root.horses[id],trainer=trainerById[horse.trainerId]||{};
   const r=advanceHorseTrainingDay(prior,horse,trainer,day,seed);
   root.horses[id]=r.horse;
   horseCharges.push({horseId:id,trainerId:horse.trainerId||null,amount:r.charge,
    components:r.breakdown,workout:r.work});
   const newAlerts=r.horse.alerts.filter(a=>a.date===day);
   for(const alert of newAlerts)dayEvents.push({id:'HEALTH-'+day+'-'+id+'-'+alert.kind,
    date:day,horseId:id,type:alert.kind,note:alert.note,
    provenance:'SIMULATED_GAMEPLAY_NOT_VET_MEDICAL_RECORD'});
  }
  const amount=Math.round(horseCharges.reduce((a,x)=>a+x.amount,0)*100)/100;
  const beforeDays=Number.isInteger(root.trainingDays)?root.trainingDays:root.ledger.length;
  root.ledger.push({id:'TRAIN-'+day,date:day,category:'STABLE_TRAINING_AND_CARE',
   amount,currency:'USD',charges:horseCharges,provenance:'1999_GAMEPLAY_TEST_COST_NOT_BANK_PAYMENT'});
  root.trainingDays=beforeDays+1;
  // Preserve day-by-day detail for the recent quarter. Older rows fold into
  // per-month, per-horse totals in the SAME career ledger to keep browser
  // localStorage viable across multi-year saves without losing accounting.
  if(root.ledger.length>90){
   root.monthlyArchive=root.monthlyArchive||{};
   const archived=root.ledger.splice(0,root.ledger.length-90);
   for(const entry of archived){
    const month=entry.date.slice(0,7);
    const summary=root.monthlyArchive[month]||{month,days:0,total:0,byHorse:{}};
    summary.days++;
    summary.total=Math.round((summary.total+entry.amount)*100)/100;
    for(const charge of entry.charges){
     summary.byHorse[charge.horseId]=Math.round(((summary.byHorse[charge.horseId]||0)+charge.amount)*100)/100;
    }
    root.monthlyArchive[month]=summary;
   }
  }
  root.events.push(...dayEvents);
  root.totalSpent=Math.round((root.totalSpent+amount)*100)/100;
  root.processedThrough=day;
  root.revision++;daysProcessed++;
 }
 if(!daysProcessed)return {game,daysProcessed:0};
 // Bound per-horse 45-day histories and 90-day daily ledgers. Monthly older
 // per-horse totals retain accounting custody without blowing save quotas.
 const development=root;
 return {game:{...game,horseDevelopment:development},daysProcessed};
}
export function horseTrainingSnapshot(game,horse){
 assertHorse(horse);
 const record=game?.horseDevelopment?.horses?.[horse.id];
 return record?validateRecord(record,horse):createHorseTrainingRecord(horse);
}
export function trainingFinancials(game){
 const d=game?.horseDevelopment;
 return {processedThrough:d?.processedThrough||START,
  totalSpent:Number(d?.totalSpent)||0,entries:d?.trainingDays??d?.ledger?.length??0,
  recordedHealthAlerts:d?.events?.filter(e=>e.type==='MODELED_SORENESS_WATCH').length||0,
  provenance:'SIMULATED_GAMEPLAY_COST_LEDGER_NOT_SOURCE_FINANCIAL_HISTORY'};
}
