/**
 * Deterministic, age-aware lifecycle decisions for the persisted 1999 career.
 * Decisions are applied to individual records by the industry persistence
 * engine, never inferred as a substitute for saved statuses.
 */
import {seeded1999Unit} from './fictional-industry-ecosystem-1999.mjs';

export const INDUSTRY_MATURE_LIFECYCLE_SCHEMA='WTW_INDUSTRY_MATURE_LIFECYCLE_V1';
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));

export function plan1999JuvenileDebut({seed,year,date,horse}={}){
 if(!horse?.id||!Number.isInteger(year)||year-Number(horse.foalYear)!==2||
  ![year+'-04-01',year+'-09-01'].includes(date))
  throw Error('Invalid dated juvenile race-readiness review');
 if(horse.status==='DECEASED'||horse.status==='RACING')
  return {decision:'UNCHANGED',patch:null};
 const readiness=horse.development?.readiness??0;
 const soundness=horse.development?.soundness??0;
 const late=date.endsWith('-09-01');
 const fitness=soundness>=(late?29:43);
 const ready=readiness>=(late?37:60);
 const chance=seeded1999Unit(seed,'juvenile-debut:'+year+':'+date+':'+horse.id);
 const started=fitness&&ready&&chance<(late?.94:.78);
 return {decision:started?'RACING':'DELAYED',
  patch:started?{status:'RACING',racingDebutDate:date,
   racingReadiness:'CLEARED',lastReadinessReview:date,
   cohort:'twoYearOldProspects'}:
   {status:'TWO_YEAR_OLD_PROSPECT',racingReadiness:'DELAYED',
    lastReadinessReview:date,nextReadinessReview:late?year+1+'-01-01':
     year+'-09-01'}};
}

export function plan1999MatureHorseYear({seed,year,horse}={}){
 if(!horse?.id||!Number.isInteger(year)||year<1999||
  !Number.isInteger(Number(horse.foalYear))||
  year-Number(horse.foalYear)<3)
  throw Error('Invalid adult horse lifecycle decision');
 const age=year-Number(horse.foalYear);
 const status=horse.status;
 if(status==='DECEASED'||status==='BROODMARE'||status==='STALLION')
  return {decision:'UNCHANGED',patch:null};
 const retired=['RETIRED_RACEHORSE','RETIRED_BROODMARE','RETIRED_STALLION']
  .includes(status);
 const active=status==='RACING'||status==='TWO_YEAR_OLD_PROSPECT';
 if(!retired&&!active)throw Error('Unsupported adult lifecycle status '+status);
 const roll=seeded1999Unit(seed,'mature-death:'+year+':'+horse.id);
 const mortality=retired?clamp(.006+Math.max(0,age-15)*.026,.006,.60):
  clamp(.002+Math.max(0,age-7)*.003,.002,.04);
 if(age>=31||roll<mortality)return {decision:'DECEASED',patch:{
  status:'DECEASED',cohort:'deceased',deathDate:year+'-01-01',
  deathYear:year,deathAge:age,deathStage:'MATURE_HORSE',
  deathCause:retired?'AGE_AND_HEALTH':'RACING_AND_HEALTH',
  mortalityRate:+mortality.toFixed(4),
  provenance:'MODELED_SEEDED_ADULT_MORTALITY'}};
 const dev=horse.development||{};
 const readiness=dev.readiness??50,soundness=dev.soundness??50;
 const potential=dev.potential??50;
 if(status==='TWO_YEAR_OLD_PROSPECT'){
  if(soundness<24&&age>=4)return {decision:'RETIRED',patch:{
   status:'RETIRED_RACEHORSE',cohort:'retiredRunners',retirementYear:year,
   retirementReason:'UNSOUND_BEFORE_DEBUT'}};
  if(soundness>=24||age>=4)return {decision:'RACING',patch:{
   status:'RACING',cohort:age===3?'threeYearOldRunners':'fourYearOldRunners',
   racingDebutDate:year+'-01-01',racingReadiness:'CLEARED'}};
  return {decision:'DELAYED',patch:{racingReadiness:'DELAYED',
   nextReadinessReview:year+1+'-01-01'}};
 }
 if(retired)return {decision:'UNCHANGED',patch:null};
 const retirementRoll=seeded1999Unit(seed,'mature-retirement:'+year+':'+horse.id);
 const retirementRisk=age>=7?clamp(.10+(age-7)*.18,0,1):0;
 if(age>=12||soundness<16||retirementRoll<retirementRisk)
  return {decision:'RETIRED',patch:{status:'RETIRED_RACEHORSE',
   cohort:'retiredRunners',retirementYear:year,
   retirementReason:age>=12?'AGE_LIMIT':soundness<16?'SOUNDNESS':'CAREER_TRANSITION'}};
 // Injury has a persistent recovery date. A horse with a medical hold
 // cannot be considered race-ready just because the calendar year changed.
 const eligibleToRecover=dev.medicalHoldUntil&&
  year+'-01-01'>=dev.medicalHoldUntil;
 const injuryRoll=seeded1999Unit(seed,'adult-injury:'+year+':'+horse.id);
 const injuryRisk=clamp(.018+Math.max(0,50-soundness)*.0008,.018,.068);
 if(injuryRoll<injuryRisk){
  const severity=5+Math.floor(seeded1999Unit(seed,
   'adult-injury-severity:'+year+':'+horse.id)*14);
  return {decision:'INJURED',patch:{
   development:{...dev,readiness:clamp(readiness-Math.ceil(severity*.8),0,100),
    soundness:clamp(soundness-severity,0,100),
    injuryCount:(Number(dev.injuryCount)||0)+1,
    medicalHoldUntil:year+1+'-01-01',
    latestInjury:{date:year+'-01-01',
     type:'MODELED_RACING_HEALTH_SETBACK',severity,recoveryYear:year+1},
    lastProgressionYear:year},
   racingReadiness:'MEDICAL_HOLD',developmentYear:year}};
 }
 if(age<=6){
  const pace=seeded1999Unit(seed,'adult-development:'+year+':'+horse.id);
  const gain=Math.round((potential-readiness)*.08+(pace-.5)*8);
  const wear=seeded1999Unit(seed,'adult-soundness:'+year+':'+horse.id);
  return {decision:'DEVELOPED',patch:{
   development:{...dev,readiness:clamp(readiness+gain,0,100),
    soundness:clamp(soundness+Math.round((wear-.5)*5),0,100),
    medicalHoldUntil:eligibleToRecover?null:dev.medicalHoldUntil,
    lastProgressionYear:year},
   ...(eligibleToRecover?{racingReadiness:'CLEARED'}:{}),
   developmentYear:year}};
 }
 if(eligibleToRecover)return {decision:'RECOVERED',patch:{
  development:{...dev,medicalHoldUntil:null,lastProgressionYear:year},
  racingReadiness:'CLEARED',developmentYear:year}};
 return {decision:'UNCHANGED',patch:null};
}
