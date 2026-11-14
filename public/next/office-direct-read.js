/* WTW 1999 — direct, headless Office READ adapter (Phase 1).
 * No DOM selectors, screen rendering, save writes, or alternate game state.
 * The canonical game run owns its clock. The canonical UI source owns inbox rows.
 * Old Office markup is never a fallback in the supported founding-world mode.
 */
(function(global){
 'use strict';
 const START='1999-01-01';
 function validDate(value){
  if(typeof value!=='string'||!/^\\d{4}-\\d{2}-\\d{2}$/.test(value))return '';
  const stamp=Date.parse(value+'T12:00:00Z');
  if(!Number.isFinite(stamp))return '';
  return new Date(stamp).toISOString().slice(0,10)===value?value:'';
 }
 function gameDate({engineDate,careerDate,legacyDate,cleanMode=true}={}){
  const engine=validDate(engineDate);
  if(engine&&engine>=START)return engine;
  const saved=validDate(careerDate);
  // A stale hidden date chip cannot rewind/override the supported 1999 game.
  if(cleanMode)return saved&&saved>=START?saved:START;
  return validDate(legacyDate)||saved||START;
 }
 function messages({sourceMessages,legacyMessages,cleanMode=true}={}){
  if(Array.isArray(sourceMessages))return sourceMessages;
  // When 1999 source data is loading, show an empty Inbox, not old demo cases.
  if(cleanMode)return [];
  return Array.isArray(legacyMessages)?legacyMessages:[];
 }
 const api=Object.freeze({schema:'WTW_OFFICE_DIRECT_READ_V1',validDate,gameDate,messages});
 if(global)global.__WTW_OFFICE_DIRECT_READ__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
