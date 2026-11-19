/**
 * One canonical yearly review for already-enrolled trainers. Real official
 * race results and stored starting role abilities are the only development
 * inputs. Never create a trainer, horse, purse, employer or second career.
 */
export const TRAINER_CAREER_PROGRESSION_SCHEMA='WTW_1999_TRAINER_CAREER_V1';
const cents=n=>Number.isSafeInteger(n)&&n>=0;
const bound=(n,a,b)=>Math.max(a,Math.min(b,n));
const four=n=>Math.round(bound(n,0,1)*10000)/10000;
const yearOf=d=>Number(String(d).slice(0,4));
const ATTRS=['conditioning','workout_design','young_horse_development',
 'veterinary_coordination','layoff_management','race_placement'];
const ageOn=(date,birth)=>{
 if(typeof birth!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(birth))
  return null;
 return yearOf(date)-yearOf(birth)-
  (date.slice(5)<birth.slice(5)?1:0);
};
const historicalResults=(state,year)=>{
 const byTrainer=new Map();
 for(const race of Object.values(state.runtime.races||{})){
  if(race.status!=='OFFICIAL_SIM_RESULT'||
   typeof race.date!=='string'||yearOf(race.date)!==year||
   race.date>=state.clock.date||!Array.isArray(race.results))continue;
  for(const res of race.results){
   if(!res?.trainer_id||!Number.isInteger(res.finish)||res.finish<1||
    !cents(res.trainer_share_minor))continue;
   if(!byTrainer.has(res.trainer_id))
    byTrainer.set(res.trainer_id,{starts:0,wins:0,trainer_purse_minor:0});
   const count=byTrainer.get(res.trainer_id);
   count.starts++;if(res.finish===1)count.wins++;
   count.trainer_purse_minor+=res.trainer_share_minor;
  }
 }
 return byTrainer;
};
/** Once on January 1, advance only people already modeled in the saved run. */
export function advance1999TrainerCareerProgression({state,world,emit=()=>{}}={}){
 const day=state?.clock?.date,year=yearOf(day);
 if(typeof day!=='string'||day.slice(5)!=='01-01'||year<=1999)
  return {year,reviewed:0,developed:0};
 const known=new Set((world?.entities?.people||[]).filter(p=>p.role==='trainer').
  map(p=>p.id));
 const real=historicalResults(state,year-1),people=state.runtime.people;
 let reviewed=0,developed=0;
 for(const [trainerId,person] of Object.entries(people).
  sort(([a],[b])=>a.localeCompare(b))){
  const skills=person.game_training_skills;
  if(!known.has(trainerId)||!skills?.roleAttributes||!skills.ability)continue;
  if(person.trainer_career_progression?.last_review_year>=year)continue;
  if(!ATTRS.every(a=>typeof skills.roleAttributes[a]==='number'&&
   Number.isFinite(skills.roleAttributes[a])&&
   skills.roleAttributes[a]>=0&&skills.roleAttributes[a]<=1))
   throw Error('Trainer has invalid saved gameplay technical ratings');
  const outcomes=real.get(trainerId)||
   {starts:0,wins:0,trainer_purse_minor:0};
  const prior=person.trainer_career_progression;
  const current=skills.ability.current??0,
   potential=skills.ability.potential??current;
  if(!Number.isInteger(current)||!Number.isInteger(potential)||
   current<0||current>99||potential<0||potential>99)
   throw Error('Trainer source ability or potential is invalid');
  const born=skills.biography?.date_of_birth;
  const age=ageOn(day,born);
  const development=skills.source_role_ratings?.development??50;
  // Starts and actual wins provide learning opportunities. Skill improvement
  // is strictly bounded by the existing saved potential; mature trainers can
  // decline, but never retire without a staffed, funded successor hire.
  const eligible=outcomes.starts>=3;
  const experience=eligible?
   Math.min(.010,Math.sqrt(outcomes.starts)*.0011+
    Math.min(outcomes.wins,15)*.0002):0;
  const room=bound((potential-current)/20,0,1);
  const training=experience*room*(.65+.35*bound(development/100,0,1));
  const decline=age!==null&&age>=62?
   Math.min(.009,(age-61)*.001):0;
  const old={...skills.roleAttributes},attrs={};
  let changed=false;
  for(const key of ATTRS){
   // Young-horse specialists improve more with real starts, while technical
   // safety and care remain grounded in their own persisted strength.
   const weight=key==='young_horse_development'?1.10:
    key==='veterinary_coordination'?.72:1;
   attrs[key]=four(old[key]+training*weight-decline);
   if(attrs[key]!==old[key])changed=true;
  }
  const ability=Math.round((attrs.conditioning+attrs.workout_design+
   attrs.veterinary_coordination)/3*99);
  skills.roleAttributes=attrs;skills.ability.current=bound(ability,0,99);
  const history=[...(prior?.annual||[]),{
   year:year-1,reviewed_on:day,
   age_at_review:age,starts:outcomes.starts,wins:outcomes.wins,
   trainer_purse_minor:outcomes.trainer_purse_minor,
   skill_before:old,skill_after:attrs,
   ability_before:current,ability_after:skills.ability.current,
   provenance:'OFFICIAL_COMPLETED_RACES_AND_SAVED_SOURCE_SKILL_POTENTIAL'
  }].slice(-40);
  person.trainer_career_progression={
   schema:TRAINER_CAREER_PROGRESSION_SCHEMA,last_review_year:year,
   starts:(prior?.starts||0)+outcomes.starts,
   wins:(prior?.wins||0)+outcomes.wins,
   trainer_purse_minor:(prior?.trainer_purse_minor||0)+
    outcomes.trainer_purse_minor,annual:history};
  reviewed++;if(changed)developed++;
  emit('TRAINER_CAREER_ANNUAL_REVIEW',{
   trainer_id:trainerId,season:year-1,reviewed_on:day,
   starts:outcomes.starts,wins:outcomes.wins,
   earned_purse_minor:outcomes.trainer_purse_minor,
   age,ability_before:current,ability_after:skills.ability.current,
   changed,source:'ACTUAL_SAVED_RACE_RESULTS_NOT_A_SIMULATED_BONUS'});
 }
 return {year,reviewed,developed};
}
export function validate1999TrainerCareerProgression(state,world){
 const known=new Set((world?.entities?.people||[]).filter(p=>p.role==='trainer').
  map(p=>p.id)),today=state.clock.date;
 for(const [id,p] of Object.entries(state.runtime.people||{})){
  const c=p.trainer_career_progression;
  if(c===undefined)continue;
  if(!known.has(id)||!p.game_training_skills||
   c?.schema!==TRAINER_CAREER_PROGRESSION_SCHEMA||
   !Number.isInteger(c.last_review_year)||c.last_review_year<2000||
   c.last_review_year>yearOf(today)||!cents(c.starts)||
   !cents(c.wins)||c.wins>c.starts||
   !cents(c.trainer_purse_minor)||!Array.isArray(c.annual)||
   c.annual.length<1||c.annual.length>40)
   throw Error('Invalid saved trainer career progress or personnel identity');
  let last=1998,starts=0,wins=0,purse=0;
  for(const item of c.annual){
   if(!Number.isInteger(item.year)||item.year<=last||
    item.year+1>c.last_review_year||
    item.reviewed_on!==String(item.year+1)+'-01-01'||
    item.reviewed_on>today||!cents(item.starts)||
    !cents(item.wins)||item.wins>item.starts||
    !cents(item.trainer_purse_minor)||
    !item.skill_before||!item.skill_after||
    !ATTRS.every(k=>typeof item.skill_after[k]==='number'&&
     item.skill_after[k]>=0&&item.skill_after[k]<=1))
    throw Error('Invalid actual-race trainer development history');
   last=item.year;starts+=item.starts;wins+=item.wins;
   purse+=item.trainer_purse_minor;
  }
  if(c.annual.at(-1).year+1!==c.last_review_year||
   starts>c.starts||wins>c.wins||purse>c.trainer_purse_minor)
   throw Error('Invalid saved trainer career year reconciliation');
 }
}
