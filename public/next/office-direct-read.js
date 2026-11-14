/* WTW 1999 — direct, headless Office READ adapter (Phase 1).
 * No DOM selectors, screen rendering, save writes, or alternate game state.
 * The canonical game run owns its clock. The canonical UI source owns inbox rows.
 * Old Office markup is never a fallback in the supported founding-world mode.
 */
(function(global){
 'use strict';
 const START='1999-01-01';
 function validDate(value){
  if(typeof value!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(value))return '';
  const stamp=Date.parse(value+'T12:00:00Z');
  if(!Number.isFinite(stamp))return '';
  return new Date(stamp).toISOString().slice(0,10)===value?value:'';
 }
 function gameDate({engineDate,careerDate}={}){
  const engine=validDate(engineDate);
  if(engine&&engine>=START)return engine;
  const saved=validDate(careerDate);
  return saved&&saved>=START?saved:START;
 }
 function decisions(state){
  const text=value=>typeof value==='string'?value:'';
  const pending=Object.values(state?.decisions?.pending||{});
  const resolved=Object.values(state?.decisions?.resolved||{});
  return [...pending,...resolved].map(row=>{
   const closed=Boolean(row.resolved_date);
   const context=row.context||{};
   const title=text(context.title)||row.id;
   const summary=text(context.summary);
   const label=id=>(Object.hasOwn(context.option_labels||{},id)&&text(context.option_labels[id]))||id;
   const moves=closed?[]:row.option_ids.map(optionId=>({optionId,title:label(optionId),tag:'DECISION'}));
   return {
    message:{case:row.id,from:'Game engine',title,meta:summary,time:row.created_date,
     initials:'WT',urgent:!closed,resolved:closed},
    desk:{type:'MANAGEMENT DECISION',title,summary,source:'Game engine',
     pressure:closed?'Recorded':'Awaiting choice',risk:'',read:summary,moves,intel:[],
     receipt:closed?{choiceTitle:label(row.option_id),date:row.resolved_date}:null}
   };
  });
 }
 const api=Object.freeze({schema:'WTW_OFFICE_DIRECT_READ_V2',validDate,gameDate,decisions});
 if(global)global.__WTW_OFFICE_DIRECT_READ__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
