/**
 * Read-only race files for the ONE saved 1999 canonical game career.
 * Never infer entries, awards, eligibility or historical results.
 * Opening a race file is navigation, not a game command or save mutation.
 */
export const CAREER_RACE_FILE_SCHEMA='WTW_1999_CANONICAL_CAREER_RACE_FILE_V1';
const validCents=v=>Number.isSafeInteger(v)&&v>=0;
const safe=v=>String(v??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
const money=v=>validCents(v)?new Intl.NumberFormat('en-US',{
 style:'currency',currency:'USD',maximumFractionDigits:2
}).format(v/100):'Not recorded';
const status=v=>({
 ENTRIES_OPEN:'Entries Open',
 OFFICIAL_SIM_RESULT:'Official Game Result',
 CANCELLED_INSUFFICIENT_FIELD:'Cancelled — Insufficient Field'
}[v]||'Unverified Game Status');

function nameOfHorse(horses,id){
 return typeof horses?.[id]?.registered_name==='string'&&horses[id].registered_name.trim()?
  horses[id].registered_name:id;
}
/** Recreate the same player-visible projection after every save reopen.
 * The exact race/horse/entry IDs come only from the canonical saved run. */
export function projectCanonical1999RaceRows(run,world){
 const races=run?.runtime?.races,entries=run?.runtime?.entries||{},
  horses=run?.runtime?.registered_horses?.by_id||{};
 if(!races||typeof races!=='object'||Array.isArray(races))return [];
 const tracks=new Map((world?.entities?.tracks||[]).map(t=>[t.id,t.name]));
 return Object.values(races).filter(r=>r&&typeof r.id==='string'&&
  races[r.id]===r&&typeof r.date==='string'&&typeof r.track_id==='string')
 .map(r=>{
  const field=(Array.isArray(r.field)?r.field:[]).map(id=>{
   const entry=entries[id];
   if(!entry||entry.race_id!==r.id||!horses[entry.horse_id])return null;
   return Object.freeze({
    id:entry.id,horseId:entry.horse_id,
    horseName:nameOfHorse(horses,entry.horse_id),
    status:entry.status||'Not recorded',jockeyId:entry.jockey_id||null
   });
  }).filter(Boolean);
  const results=r.status==='OFFICIAL_SIM_RESULT'&&Array.isArray(r.results)?
   r.results.map(result=>Object.freeze({
    finish:result.finish,horseId:result.horse_id,
    horseName:nameOfHorse(horses,result.horse_id),
    jockeyId:result.jockey_id||null,
    earningsMinor:validCents(result.earnings_minor)?result.earnings_minor:null
   })).sort((a,b)=>a.finish-b.finish):[];
  const file=Object.freeze({
   schema:CAREER_RACE_FILE_SCHEMA,id:r.id,
   name:r.name||r.conditions||r.id,date:r.date,number:r.number??null,
   trackId:r.track_id,trackName:tracks.get(r.track_id)||r.track_id,
   gameStatus:r.status,status:status(r.status),
   source:r.source||null,resultsProvenance:r.result_provenance||null,
   settledDate:r.settled_date||null,
   conditions:r.conditions||null,fullConditions:r.full_conditions||null,
   age:r.age||null,sex:r.sex||null,surface:r.surface||null,
   distanceFurlongs:r.distance_furlongs??null,
   winRestriction:r.win_restriction||null,
   fieldCapacity:r.field_capacity??null,
   purseMinor:validCents(r.purse_minor)?r.purse_minor:null,
   field:Object.freeze(field),results:Object.freeze(results)
  });
  return Object.freeze({
   id:file.id,name:file.name,date:file.date,track:file.trackName,
   status:file.status,gameStatus:file.gameStatus,raceFile:file
  });
 }).sort((a,b)=>a.date.localeCompare(b.date)||a.id.localeCompare(b.id));
}
/** Status-correct game file. Completed races display their REAL saved modeled
 * placing and purse rows, never an unrun race's provisional eligibility. */
export function renderCanonical1999RaceFile(row){
 const file=row?.raceFile;
 if(file?.schema!==CAREER_RACE_FILE_SCHEMA||file.id!==row.id)
  return '<section class="ng-1999-race-file"><h2>Saved race unavailable</h2><p>No canonical career race record was found.</p></section>';
 const facts=[
  ['Race ID',file.id],['Game Status',file.status],['Race Date',file.date],
  ['Track',file.trackName],['Class',file.conditions],
  ['Full Conditions',file.fullConditions],['Surface',file.surface],
  ['Distance',Number.isFinite(file.distanceFurlongs)?file.distanceFurlongs+' furlongs':null],
  ['Age',file.age],['Sex',file.sex],['Win Restriction',file.winRestriction],
  ['Field Capacity',file.fieldCapacity],['Purse',money(file.purseMinor)]
 ];
 const records=file.results.length&&file.gameStatus==='OFFICIAL_SIM_RESULT'?
  '<p>Saved finishing order and credited purses — game-modeled results, not historical facts.</p>'+
  '<div class="ng-race-eligible-list">'+file.results.map(r=>
   '<div><strong>'+safe(r.finish)+'. '+safe(r.horseName)+'</strong>'+
   '<span>'+safe(r.horseId)+' · '+safe(money(r.earningsMinor))+'</span></div>'
  ).join('')+'</div>':
  file.gameStatus==='OFFICIAL_SIM_RESULT'?
   '<p>Result marked official, but the saved placing list is unavailable. No result was invented.</p>':
  file.gameStatus==='CANCELLED_INSUFFICIENT_FIELD'?
   '<p>This modeled race was cancelled for an insufficient field. No result was recorded.</p>':
   '<p>These are entered runners from the current career, not an eligibility prediction or an official result.</p>'+
   '<div class="ng-race-eligible-list">'+file.field.map(e=>
    '<div><strong>'+safe(e.horseName)+'</strong><span>'+
    safe(e.horseId)+' · '+safe(e.status)+'</span></div>'
   ).join('')+'</div>';
 return '<section class="ng-1999-race-file" data-game-race-id="'+safe(file.id)+'">'+
  '<header><div><small>1999 FICTIONAL CAREER · '+safe(file.status.toUpperCase())+
  '</small><h2>'+safe(file.name)+'</h2><p>'+safe(file.trackName)+
  ' · '+safe(file.date)+'</p></div></header>'+
  '<div class="ng-race-file-grid"><section class="ng-race-file-panel">'+
  '<h3>SAVED GAME RACE RECORD</h3><div class="ng-race-file-facts">'+
  facts.map(([label,value])=>'<div><small>'+safe(label.toUpperCase())+
   '</small><strong>'+safe(value??'Not recorded')+'</strong></div>').join('')+
  '</div><p>This file is derived from the current saved game, not a historic racebook.</p></section>'+
  '<section class="ng-race-file-panel"><h3>'+
  (file.gameStatus==='OFFICIAL_SIM_RESULT'?'OFFICIAL GAME RESULT':
   file.gameStatus==='ENTRIES_OPEN'?'CONFIRMED GAME ENTRIES':'RACE STATUS')+
  '</h3>'+records+'</section></div></section>';
}
