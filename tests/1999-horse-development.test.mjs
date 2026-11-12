import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {
 HORSE_DEVELOPMENT_SCHEMA,TRAINING_PLANS,createHorseTrainingRecord,
 advanceHorseTrainingDay,assignHorseTrainingPlan,simulateStableTrainingThrough,
 horseTrainingSnapshot,trainingFinancials,recommendHorseWorkout
} from '../public/1999/engine/horse-development.mjs';

const universe=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const roster=[];
for(let i=267;i<650&&roster.length<8;i++){
 const h=universe.horseAt(i);
 if(!['RETIRED','BROODMARE','AT_STUD','TOO_YOUNG'].includes(h.racingStatus1999))roster.push(h);
}
assert.equal(roster.length,8);
const trainerById=Object.fromEntries(roster.map((h,i)=>[h.trainerId,{
 id:h.trainerId,role:'trainer',
 ability:{current:50+i*2},
 roleAttributes:{conditioning:.63,workout_design:.68,
  young_horse_development:.55,veterinary_coordination:.7,layoff_management:.62},
 compensation:{dayRate:65+i}
}]));
const game0=()=>({
 schema:'WTW_1999_CLEAN_CAREER_V3',
 date:'1999-01-01',
 horseState:{},finances:{cash:123456},
 worldAnchor:{schema:'WTW_1999_CLEAN_CAREER_V3',startDate:'1999-01-01',seed:19990101}
});
const config=date=>({horses:roster,trainerById,seed:19990101,date});
const iso=n=>new Date(Date.parse('1999-01-01T00:00:00.000Z')+n*86400000).toISOString().slice(0,10);
const work=(game,date)=>simulateStableTrainingThrough({...game,date},config(date)).game;

test('30 game days generate repeatable horse-by-horse training, recovery, risk and costs',()=>{
 const frozen=roster.map(h=>JSON.stringify(h));
 const game=work(game0(),'1999-01-31');
 const d=game.horseDevelopment;
 assert.equal(d.schema,HORSE_DEVELOPMENT_SCHEMA);
 assert.equal(d.processedThrough,'1999-01-31');
 assert.equal(d.ledger.length,30);
 assert.equal(d.ledger[0].date,'1999-01-02');
 assert.equal(d.ledger.at(-1).date,'1999-01-31');
 assert.equal(d.ledger.at(-1).charges.length,8);
 assert.equal(trainingFinancials(game).entries,30);
 assert.ok(d.totalSpent>0);
 assert.equal(game.finances.cash,123456,'No fictitious bank payment is forced');
 for(const h of roster){
  const p=d.horses[h.id];
  assert.ok(p.workDays+p.restDays===30);
  assert.equal(p.history.length,30);
  assert.equal(p.asOf,'1999-01-31');
  assert.equal(p.horseId,h.id);
  assert.equal(p.nameAtOpening,h.name);
  assert.ok(p.fitness>=0&&p.fitness<=1);
  assert.ok(p.fatigue>=0&&p.fatigue<=1);
  assert.ok(p.readiness>=0&&p.readiness<=1);
  assert.ok(p.currentRisk>=0&&p.currentRisk<=1);
  assert.ok(p.trainingSpent>0);
 }
 assert.deepEqual(roster.map(h=>JSON.stringify(h)),frozen,'Never change historical or opening modeled source');
 assert.deepEqual(work(game0(),'1999-01-31'),game,'Same seed and 30-day window must produce identical state');
});

test('30 one-day continues exactly match one batch and repeating a day has zero effects',()=>{
 const direct=work(game0(),'1999-01-31');
 let daily=game0();
 for(let day=1;day<=30;day++)daily=work(daily,iso(day));
 assert.deepEqual(daily,direct);
 const replay=simulateStableTrainingThrough(daily,config(daily.date));
 assert.equal(replay.daysProcessed,0);
 assert.strictEqual(replay.game,daily);
 assert.equal(replay.game.horseDevelopment.ledger.length,30);
});

test('rest, speed and stamina create materially different outcomes without raising innate talent',()=>{
 const horse=roster[0],one=[horse],basic=game0();
 const rest=assignHorseTrainingPlan(basic,{horse,plan:'REST',stableHorses:one});
 const speed=assignHorseTrainingPlan(basic,{horse,plan:'SPEED',stableHorses:one});
 const stam=assignHorseTrainingPlan(basic,{horse,plan:'STAMINA',stableHorses:one});
 const trainingSet=(game,program)=>simulateStableTrainingThrough({...game,date:'1999-01-31'},
   {horses:one,trainerById,seed:19990101,date:'1999-01-31'}).game.horseDevelopment.horses[horse.id];
 const r=trainingSet(rest,'REST'),s=trainingSet(speed,'SPEED'),t=trainingSet(stam,'STAMINA');
 assert.ok(s.fitness>r.fitness,'Training has a conditioning advantage over prolonged rest');
 assert.ok(s.speedCondition>r.speedCondition);
 assert.ok(t.staminaCondition>r.staminaCondition);
 assert.ok(s.workDays>r.workDays);
 assert.ok(r.restDays===30);
 assert.equal(horse.ability.peakCeiling,roster[0].ability.peakCeiling);
 assert.equal(horse.ability.current,roster[0].ability.current);
});

test('trainer skill influences outcomes, but identical plan obeys the same physics',()=>{
 const horse=roster[1],p=createHorseTrainingRecord(horse);
 const skilled={roleAttributes:{conditioning:1,workout_design:1,veterinary_coordination:1,
 young_horse_development:1},ability:{current:90}};
 const novice={roleAttributes:{conditioning:.05,workout_design:.05,veterinary_coordination:.05,
 young_horse_development:.05},ability:{current:22}};
 const high=advanceHorseTrainingDay(p,horse,skilled,'1999-01-02');
 const low=advanceHorseTrainingDay(p,horse,novice,'1999-01-02');
 assert.ok(high.horse.fitness>low.horse.fitness);
 assert.ok(high.horse.fatigue<=low.horse.fatigue);
 assert.equal(high.work,low.work);
 assert.equal(high.horse.horseId,low.horse.horseId);
 assert.deepEqual(createHorseTrainingRecord(horse),p,'No transient work may edit baseline');
});

test('trainer-directed plans choose independently and still obey welfare/rest scheduling',()=>{
 const horse=roster[0],p=createHorseTrainingRecord(horse);
 const high=trainerById[horse.trainerId];
 assert.equal(TRAINING_PLANS.AUTO.label,'Trainer-Directed');
 const zero=assignHorseTrainingPlan(game0(),{horse,plan:'AUTO',stableHorses:[horse]});
 const next=simulateStableTrainingThrough({...zero,date:'1999-01-31'},
  {horses:[horse],trainerById,seed:19990101,date:'1999-01-31'}).game;
 const days=next.horseDevelopment.horses[horse.id].history;
 assert.ok(days.some(x=>x.work==='REST'));
 assert.ok(days.some(x=>x.work!=='REST'));
 assert.ok(days.every(x=>Object.hasOwn(TRAINING_PLANS,x.work)));
 const rec=recommendHorseWorkout({...p,fatigue:.82},horse,high,'1999-01-04');
 assert.equal(rec,'REST','A fatigued horse must not be pushed by its trainer');
});

test('soreness watch causes actual rest, not an invented veterinary diagnosis',()=>{
 const horse=roster[2],p={...createHorseTrainingRecord(horse),sorenessDays:4};
 const d1=advanceHorseTrainingDay(p,horse,trainerById[horse.trainerId],'1999-01-02');
 assert.equal(d1.work,'REST');
 assert.equal(d1.horse.sorenessDays,3);
 assert.ok(d1.horse.readiness<.8);
 let state=d1.horse;
 for(let i=2;i<=5;i++)state=advanceHorseTrainingDay(state,horse,trainerById[horse.trainerId],iso(i)).horse;
 assert.equal(state.sorenessDays,0);
 assert.ok(state.alerts.every(x=>!/diagnosed infection|fracture|certified/i.test(x.note)));
 assert.equal(horse.racingStatus1999,roster[2].racingStatus1999);
});

test('invalid plans, missing horses, retroactive edits and rewind attempts are refused',()=>{
 const horse=roster[0],g=game0();
 assert.throws(()=>assignHorseTrainingPlan(g,{horse,plan:'NUCLEAR',stableHorses:roster}));
 assert.throws(()=>assignHorseTrainingPlan(g,{horse,plan:'SPEED',stableHorses:roster.slice(1)}));
 assert.equal(g.horseDevelopment,undefined);
 const on15=work(g,'1999-01-15');
 assert.throws(()=>simulateStableTrainingThrough({...on15,date:'1999-01-08'},config('1999-01-08')));
 assert.throws(()=>assignHorseTrainingPlan(on15,{horse,plan:'LIGHT',date:'1999-01-01',stableHorses:roster}));
 const current=assignHorseTrainingPlan(on15,{horse,plan:'LIGHT',date:on15.date,stableHorses:roster});
 assert.equal(current.horseDevelopment.horses[horse.id].plan,'LIGHT');
 assert.equal(current.horseDevelopment.ledger.length,14);
 assert.equal(current.horseDevelopment.events.at(-1).type,'PLAN_ASSIGNED');
 assert.equal(on15.horseDevelopment.horses[horse.id].plan,'BALANCED','Previous save must not mutate');
});

test('opening canonical horse and first-world provenance remain untouched by modeled training',()=>{
 const horse=universe.horseAt(0);
 const original=JSON.stringify(horse);
 const p=createHorseTrainingRecord(horse);
 assert.equal(p.horseId,horse.id);
 assert.match(p.provenance,/NOT_SOURCED_HEALTH_OR_WORKOUT/);
 const later=advanceHorseTrainingDay(p,horse,trainerById[horse.trainerId]||{},'1999-01-02');
 assert.equal(later.horse.horseId,horse.id);
 assert.equal(JSON.stringify(horse),original);
 assert.deepEqual(horse.sourceRecordedStakesSeasons,universe.horseAt(0).sourceRecordedStakesSeasons);
});

test('premium Stable interface uses the same dated career save and exposes real plan buttons',()=>{
 const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
 const adapter=readFileSync(new URL('../public/next/1999-ui-source.mjs',import.meta.url),'utf8');
 const office=readFileSync(new URL('../public/office-v30-4.js',import.meta.url),'utf8');
 assert.match(ui,/function liveStableTrainingView\(\)/);
 assert.match(ui,/data-ng="training-set"/);
 assert.match(ui,/\['training','TRAINING'\]/);
 assert.match(adapter,/horseTraining,assignTraining,trainingCosts/);
 assert.match(adapter,/simulateStableTrainingThrough\(game/);
 assert.match(office,/gameState.horseDevelopment=saved.horseDevelopment/);
});
