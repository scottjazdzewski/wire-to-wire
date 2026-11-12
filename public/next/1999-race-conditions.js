/* WIRE TO WIRE 1999 — race conditions display only.
 * Uses source race/TEST condition-book rows. Never submits an entry. */
(()=>{
'use strict';
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const known=(...v)=>v.find(x=>x!==null&&x!==undefined&&String(x).trim()!=='')??'Not recorded';
function render(race,ui){
 if(!race)return '<section class="ng-1999-race-file"><h2>Race source unavailable</h2><p>Record not found. No race conditions or eligibility have been invented.</p></section>';
 const id=String(race.id||''),proposal=id.startsWith('R-TEST-')||race.canonical===false;
 const name=race.name||race.conditions||('Race '+(race.number||'')),track=race.trackName||race.track||'';
 const date=race.localDate||race.date||'—';
 const age=known(race.ageRequirement,race.ageRestriction,race.ageCondition,race.eligibility?.ageRequirement);
 const sex=known(race.sexRestriction,race.sexCondition,race.eligibility?.sexRestriction);
 const surface=known(race.surface,race.surfaceType);
 const furlongs=known(race.distanceFurlongs,race.distanceF);
 const distance=furlongs!=='Not recorded'?String(furlongs)+' furlongs':known(race.distance);
 const purse=Number(race.purse1999??race.purse);
 const purseText=Number.isFinite(purse)&&purse>0?'$'+purse.toLocaleString('en-US'):'Not recorded';
 const clauses=known(race.fullConditions,race.conditionText,race.eligibilityText,race.conditions,race.division);
 const entries=[
  ['RACE DATE',date],['RACECOURSE',track],['SURFACE',surface],['DISTANCE',distance],
  ['CLASS / GRADE',known(race.grade,race.grade1999,race.status)],['PURSE',purseText],
  ['AGE REQUIREMENT',age],['SEX RESTRICTION',sex],
  ['ENTRY / WEIGHT TERMS',known(race.weightConditions,race.weight,race.entryTerms)],
  ['OTHER CONDITIONS',clauses],['FIELD CAPACITY',known(race.fieldCapacity)]
 ];
 const parsed=String(age).match(/^(\d+)\s*(?:YO|Y\.?O\.?|YEAR)/i),minAge=parsed?Number(parsed[1]):null;
 const upperLimit=minAge!==null&&!/\+|UP|OLDER|OVER/i.test(String(age))?minAge:null;
 const female=/FILLIES[_\s-]*AND[_\s-]*MARES|FILLIES|MARES/i.test(String(sex));
 const male=/COLTS[_\s-]*AND[_\s-]*GELDINGS|MALES\s+ONLY/i.test(String(sex));
 const verifiedSex=female||male||/\bOPEN\b/i.test(String(sex));
 const horses=ui?.ownedHorses?.()||[];
 const screened=minAge!==null&&verifiedSex?horses.filter(h=>{
  const horseAge=Number(h.ageAtOpening||1999-Number(h.foalYear)),horseSex=String(h.sex||'').toUpperCase();
  if(!Number.isInteger(horseAge)||horseAge<minAge||upperLimit!==null&&horseAge>upperLimit)return false;
  if(female&&!['F','FILLY','MARE'].includes(horseSex))return false;
  if(male&&!['C','COLT','G','GELDING','H','HORSE','STALLION'].includes(horseSex))return false;
  if(h.eligibility?.licensedAt1999Start===false)return false;
  return true;
 }):null;
 const eligible=screened===null?
  '<p>Source restrictions are not complete enough to screen horses. Eligibility remains unconfirmed.</p>':
  '<p>'+screened.length+' of '+horses.length+' horses pass the recorded AGE/SEX screen. This is not entry clearance: health, class history, nominations, weights and deadlines remain separate.</p>'+
  '<div class="ng-race-eligible-list">'+screened.map(h=>'<button data-ng="horse" data-val="'+safe(h.name)+'">'+safe(h.name)+'<span>'+safe(String(h.ageAtOpening||1999-Number(h.foalYear)))+'YO · '+safe(h.sex||'—')+'</span></button>').join('')+'</div>';
 return '<section class="ng-1999-race-file"><header><div><small>'+safe(proposal?'1999 SIMULATED CONDITION BOOK · NOT ENTERED':'1999 SOURCE STAKES · NOT YET RUN')+'</small><h2>'+safe(name)+'</h2><p>'+safe(track)+' · '+safe(date)+'</p></div>'+
   '<button data-ng="named-entity" data-kind="track" data-name="'+safe(track)+'">TRACK PROFILE ↗</button></header>'+
   '<div class="ng-race-file-grid"><section class="ng-race-file-panel"><h3>RECORDED RACE CONDITIONS</h3>'+
   '<div class="ng-race-file-facts">'+entries.map(([key,value])=>'<div><small>'+safe(key)+'</small><strong>'+safe(value)+'</strong></div>').join('')+'</div>'+
   '<p class="ng-1999-source-note">'+(proposal?'Generated TEST proposal. No official entry or result exists.':'Source race data only. Missing clauses are not reconstructed.')+'</p></section>'+
   '<section class="ng-race-file-panel"><h3>YOUR HORSES · ELIGIBILITY</h3>'+eligible+'</section></div></section>';
}
window.WTW1999RaceConditions=Object.freeze({render});
})();
