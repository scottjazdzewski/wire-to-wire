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

 /** Projects only actual canonical player-owner trainer requests.
  * No DOM, fake management data, local save, or mutable UI-side decision state. */
 function trainerRequests(state){
  const owner=state?.player?.role==='owner'?state.player.operation_id:null;
  if(!owner)return [];
  const source=state.runtime?.trainer_management_requests?.by_pair||{};
  const horses=state.runtime?.registered_horses?.by_id||{};
  const kinds={
   CARE_FUNDING:{title:'Trainer requests funded care',summary:'The barn recorded an unfunded care day.',
    choices:['Approve enhanced funded care','Authorize a limited care budget','Decline funding request'],
    risk:'Unfunded horse care'},
   POST_RACE_RECOVERY:{title:'Trainer requests postrace recovery',
    summary:'An official finish fell below the horse’s modeled form expectations.',
    choices:['Accept temporary rest','Compromise on light training','Decline the plan'],
    risk:'Postrace preparation'},
   CONTRACT_TERMS:{title:'Trainer requests improved terms',
    summary:'Race results and an actual service quote support renegotiation.',
    choices:['Offer trainer premium','Offer market-rate terms','Keep current terms'],
    risk:'Trainer retention'}
  };
  const permitted=new Set(['ACCEPT','COUNTER','DECLINE']);
  const rows=[];
  for(const group of Object.values(source)){
   if(!group||group.owner_id!==owner)continue;
   for(const r of [...(group.active?.status==='OPEN'?[group.active]:[]),
    ...(Array.isArray(group.history)?group.history:[])]){
    const kind=kinds[r?.kind],horse=horses[r?.horse_id];
    if(!kind||!horse||horse.owner_organization_id!==owner||
     horse.trainer_id!==r.trainer_id||typeof r.id!=='string')continue;
    const closed=r.status!=='OPEN';
    if(closed&&r.status!=='RESOLVED'&&r.status!=='EXPIRED')continue;
    if(!closed&&r.deadline<state.clock.date)continue;
    const name=typeof horse.registered_name==='string'&&horse.registered_name.trim()?horse.registered_name:horse.horse_id;
    const choices=['ACCEPT','COUNTER','DECLINE'];
    const chosen=permitted.has(r.response)?r.response:null;
    const description=r.kind==='CARE_FUNDING'&&Number.isSafeInteger(r.needed_minor)?
     'Actual recorded care requirement: 
 if(global)global.__WTW_OFFICE_DIRECT_READ__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
+(r.needed_minor/100).toFixed(2)+'.':
     r.race_id?'Recorded race: '+r.race_id+'.':'';
    const title=kind.title+' · '+name;
    const summary=kind.summary+' '+description;
    const moves=closed?[]:choices.map((id,i)=>({
     optionId:id,requestId:r.id,title:kind.choices[i],tag:'TRAINER REQUEST'
    }));
    rows.push({
     message:{case:r.id,from:'Your trainer',title,meta:summary,
      time:r.opened_on,initials:'TR',urgent:!closed,resolved:closed},
     desk:{type:'TRAINER MANAGEMENT REQUEST',title,summary,
      source:'Game engine · '+r.trainer_id,
      pressure:closed?'Recorded':r.deadline+' deadline',risk:kind.risk,
      read:r.reason||kind.summary,moves,intel:[],
      receipt:closed?{
       choiceTitle:r.status==='EXPIRED'?'Expired without response':
        kind.choices[choices.indexOf(chosen)]||'Recorded trainer decision',
       date:r.resolved_on||r.deadline}:null}
    });
   }
  }
  return rows.sort((a,b)=>Number(a.message.resolved)-Number(b.message.resolved)||
   b.message.time.localeCompare(a.message.time)||a.message.case.localeCompare(b.message.case));
 }
 const api=Object.freeze({schema:'WTW_OFFICE_DIRECT_READ_V2',validDate,gameDate,decisions,trainerRequests});
 if(global)global.__WTW_OFFICE_DIRECT_READ__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
