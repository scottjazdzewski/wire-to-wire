/* WIRE TO WIRE 1999 — authenticated source/test race file, view only.
 * A candidate is never represented as an officially cleared entry. */
(()=>{
'use strict';
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=(...v)=>v.find(x=>x!==null&&x!==undefined&&String(x).trim()!=='')??'Not recorded';
const money=v=>Number.isFinite(Number(v))&&Number(v)>0?'$'+Number(v).toLocaleString('en-US'):'Not recorded';
const sexOK=(sex,horse)=>{
 const value=String(sex).toUpperCase(),candidate=String(horse||'').toUpperCase();
 if(/FILLIES[_\s-]*AND[_\s-]*MARES|FILLIES|MARES/.test(value))return ['F','FILLY','MARE'].includes(candidate);
 if(/COLTS[_\s-]*AND[_\s-]*GELDINGS|MALES\s+ONLY/.test(value))return ['C','COLT','G','GELDING','H','HORSE','STALLION'].includes(candidate);
 return /\bOPEN\b/.test(value);
};
function render(race,ui){
 if(!race)return '<section class="ng-1999-race-file"><h2>Race source unavailable</h2><p>No record found. No race or eligibility details were invented.</p></section>';
 const id=String(race.id||''),alternate=race.calendarBasis==='WTW_ALTERNATE_HISTORY_GAME_MODELED',proposal=id.startsWith('R-TEST-')||race.canonical===false;
 const name=race.name||race.race||race.conditions||('Race '+(race.number||'')),track=race.trackName||race.track||'';
 const date=race.localDate||race.date||'Not recorded';
 const age=known(race.ageRequirement,race.ageRestriction,race.ageCondition,race.eligibility?.ageRequirement);
 const sex=known(race.sexRestriction,race.sexCondition,race.eligibility?.sexRestriction);
 const surface=known(race.surface,race.surfaceType);
 const furlongs=known(race.distanceFurlongs,race.distanceF);
 const distance=furlongs!=='Not recorded'?String(furlongs)+' furlongs':known(race.distance);
 const raceClass=known(race.conditions,race.class,race.division,race.status);
 const clauses=known(race.fullConditions,race.conditionText,race.eligibilityText,race.conditions);
 const purseText=money(race.purse1999??race.purse);
 const entries=[
  ['RACE DATE',date],['RACECOURSE',track],['SURFACE',surface],['DISTANCE',distance],
  ['CLASS / GRADE',known(race.grade,race.grade1999,race.status,raceClass)],['PURSE',purseText],
  ['AGE REQUIREMENT',age],['SEX RESTRICTION',sex],
  ['WIN / CLASS RESTRICTIONS',known(race.winRestriction)],
  ['CLAIMING PRICE',race.claimingPrice?money(race.claimingPrice):'Not applicable / not recorded'],
  ['WEIGHT CONDITIONS',known(race.weightConditions,race.weight)],
  ['ENTRY / NOMINATION TERMS',known(race.entryTerms)],
  ['COMPLETE AVAILABLE CONDITIONS',clauses],['FIELD CAPACITY',known(race.fieldCapacity)]
 ];
 const ageParsed=String(age).match(/^(\d+)\s*(?:YO|Y\.?O\.?|YEAR)/i);
 const minAge=ageParsed?Number(ageParsed[1]):null;
 const exactAge=minAge!==null&&!/\+|UP|OLDER|OVER/i.test(String(age));
 const verifiedSex=/\bOPEN\b|FILLIES|MARES|COLTS|GELDINGS|MALES\s+ONLY/i.test(String(sex));
 const owned=ui?.ownedHorses?.()||[];
 const maidenOnly=race.maidenOnly===true||/^MAIDEN\b/i.test(String(raceClass));
 const maxWins=Number.isInteger(race.maxCareerWins)?race.maxCareerWins:null;
 const classTestable=maidenOnly||maxWins!==null;
 const screened=minAge!==null&&verifiedSex?owned.filter(h=>{
  const hAge=Number(h.ageAtOpening||1999-Number(h.foalYear));
  if(!Number.isInteger(hAge)||hAge<minAge||(exactAge&&hAge>minAge))return false;
  if(!sexOK(sex,h.sex))return false;
  if(h.eligibility?.licensedAt1999Start===false)return false;
  const wins=typeof h.career?.wins==='number'?h.career.wins:null;
  if(wins!==null&&(maidenOnly&&wins>0||maxWins!==null&&wins>maxWins))return false;
  return true;
 }):null;
 const pending=screened?.filter(h=>classTestable&&typeof h.career?.wins!=='number')||[];
 const row=h=>{
  const wins=typeof h.career?.wins==='number'?h.career.wins:null;
  const needsVerification=classTestable&&wins===null;
  const status=needsVerification?'CLASS HISTORY UNVERIFIED':'AGE / SEX / KNOWN CLASS SCREEN';
  return '<button data-ng="horse" data-val="'+safe(h.name)+'">'+safe(h.name)+
   '<span>'+safe(String(h.ageAtOpening||1999-Number(h.foalYear)))+'YO · '+safe(h.sex||'—')+' · '+status+'</span></button>';
 };
 const eligible=screened===null?
  '<p>Age or sex conditions have not been fully documented for this race. No named horse can be certified eligible from the available source.</p>':
  '<p><strong>'+screened.length+' of '+owned.length+'</strong> owned horses satisfy the recorded age/sex and any checkable class restrictions.'+
  (pending.length?' '+pending.length+' require career-win verification.':'')+
  ' All remain provisional: vet clearance, nominations, class exceptions, imposts, and entry deadlines must still be checked.</p>'+
  '<div class="ng-race-eligible-list">'+screened.map(row).join('')+'</div>';
 return '<section class="ng-1999-race-file"><header><div><small>'+
   safe(alternate?'WTW 1999 ALTERNATE-HISTORY STAKES · NOT YET RUN':proposal?'1999 SIMULATED CONDITION BOOK · NOT ENTERED':'1999 SOURCE STAKES · NOT YET RUN')+
   '</small><h2>'+safe(name)+'</h2><p>'+safe(track)+' · '+safe(date)+'</p></div>'+
   '<button data-ng="named-entity" data-kind="track" data-name="'+safe(track)+'">TRACK PROFILE ↗</button></header>'+
   '<div class="ng-race-file-grid"><section class="ng-race-file-panel"><h3>FULL AVAILABLE RACE CONDITIONS</h3>'+
   '<div class="ng-race-file-facts">'+entries.map(([key,value])=>'<div><small>'+safe(key)+'</small><strong>'+safe(value)+'</strong></div>').join('')+'</div>'+
   '<p class="ng-1999-source-note">'+(proposal?
    'SIMULATED 1999 conditions, not official racebook clauses. No result or entry has been committed.':
    'Only documented historical conditions are shown. Missing eligibility clauses are not inferred.')+
   '</p></section><section class="ng-race-file-panel"><h3>YOUR HORSES · PROVISIONAL ELIGIBILITY</h3>'+
   eligible+'</section></div></section>';
}
window.WTW1999RaceConditions=Object.freeze({render});
})();