/* WTW — one headless gameplay command surface for the current management UI.
 * This module never renders an Office panel, clicks a hidden button or owns
 * career state. Canonical native services perform and persist each command.
 */
(function(global){
 'use strict';
 let pendingAdvance=null;
 let pendingDecision=null;
 let pendingTrainerRequest=null;
 function dispatch(command,payload){
  const manager=global?.__WTW_1999_MANAGEMENT__;
  if(!manager||manager.mode!=='FOUNDING_1999')
   throw Error('1999 management game is not ready');
  const pilot=global.__WTW_1999_UI_DATA__?.gameplayService;
  const pilotRequested=new URLSearchParams(global.location?.search||'').get('playtest')==='38';
  if(command==='SAVE_CURRENT'||command==='LOAD_CAREER'){
   if(pilot||pilotRequested)
    throw Error('The active playtest saves to its game engine automatically; switch to the founding world to use these career slots.');
   if(command==='SAVE_CURRENT'){
    if(typeof manager.saveCurrentCareer!=='function')throw Error('Current game save service unavailable');
    return manager.saveCurrentCareer();
   }
   if(typeof manager.restoreCareer!=='function')throw Error('Current game load service unavailable');
   return manager.restoreCareer(payload);
  }
  if(command==='RETURN_OFFICE'){
   if(typeof manager.returnToOffice!=='function')
    throw Error('Current game navigation service unavailable');
   return manager.returnToOffice();
  }
  if(command==='ANSWER_TRAINER_MANAGEMENT_REQUEST'){
   if(!pilot)throw Error('Trainer management requests require an active playable 1999 career');
   if(pendingTrainerRequest)throw Error('A trainer management response is already being saved');
   const {request_id,choice}=payload||{};
   const state=pilot.state,owner=state?.player?.operation_id;
   if(state?.player?.role!=='owner'||!owner)
    throw Error('Only the player owner can answer trainer management requests');
   if(!['ACCEPT','COUNTER','DECLINE'].includes(choice))
    throw Error('Invalid trainer management decision');
   const rows=Object.values(state.runtime?.trainer_management_requests?.by_pair||{});
   const request=rows.map(row=>row?.active).find(row=>
    row?.status==='OPEN'&&row.id===request_id&&
    row.owner_id===owner&&row.deadline>=state.clock.date);
   if(!request)throw Error('Trainer request is no longer available to this owner');
   const exact={request_id:request.id,owner_id:request.owner_id,
    trainer_id:request.trainer_id,choice};
   pendingTrainerRequest=Promise.resolve(
    pilot.submit('ANSWER_TRAINER_MANAGEMENT_REQUEST',exact,'player'))
    .finally(()=>{pendingTrainerRequest=null});
   return pendingTrainerRequest;
  }
  if(command==='ANSWER_DECISION'){
   if(!pilot)throw Error('Game decision service unavailable');
   if(pendingDecision)throw Error('A game decision is already being recorded');
   const {decision_id,option_id}=payload||{};
   const pending=pilot.state.decisions.pending;
   const decision=typeof decision_id==='string'&&Object.hasOwn(pending,decision_id)&&pending[decision_id];
   if(!decision?.option_ids?.includes(option_id))throw Error('Decision or option is no longer available');
   pendingDecision=Promise.resolve(pilot.submit(command,{decision_id,option_id},'player'))
    .finally(()=>{pendingDecision=null});
   return pendingDecision;
  }
  if(command==='ADVANCE_DAY'){
   if(pilotRequested&&!pilot)throw Error('The playtest clock is still loading');
   if(!pilot&&typeof manager.advanceOneDay!=='function')
    throw Error('Current game clock service unavailable');
   if(pendingAdvance)return pendingAdvance;
   const result=pilot?pilot.submit(command,{},'system'):manager.advanceOneDay();
   if(result&&typeof result.then==='function'){
    const promise=Promise.resolve(result);
    pendingAdvance=promise.finally(()=>{pendingAdvance=null;});
    return pendingAdvance;
   }
   return result;
  }
  throw Error('Unsupported game command: '+String(command));
 }
 const api=Object.freeze({schema:'WTW_OFFICE_DIRECT_COMMANDS_V2',dispatch});
 if(global)global.__WTW_OFFICE_COMMANDS__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
