/* WTW — one headless gameplay command surface for the current management UI.
 * This module never renders an Office panel, clicks a hidden button or owns
 * career state. Canonical native services perform and persist each command.
 */
(function(global){
 'use strict';
 let pendingAdvance=null;
 function dispatch(command){
  const manager=global?.__WTW_1999_MANAGEMENT__;
  if(!manager||manager.mode!=='FOUNDING_1999')
   throw Error('1999 management game is not ready');
  if(command==='SAVE_CURRENT'){
   // Provisional 38-horse playtests persist in IndexedDB, NOT in the legacy
   // named-save shell. Reject a misleading snapshot until export/import parity.
   if(global.__WTW_1999_UI_DATA__?.gameplayService)
    throw Error('The active playtest saves to its game engine automatically; named engine saves are not available yet.');
   if(typeof manager.saveCurrentCareer!=='function')
    throw Error('Current game save service unavailable');
   return manager.saveCurrentCareer();
  }
  if(command==='ADVANCE_DAY'){
   if(typeof manager.advanceOneDay!=='function')
    throw Error('Current game clock service unavailable');
   if(pendingAdvance)return pendingAdvance;
   const result=manager.advanceOneDay();
   if(result&&typeof result.then==='function'){
    const promise=Promise.resolve(result);
    pendingAdvance=promise.finally(()=>{pendingAdvance=null;});
    return pendingAdvance;
   }
   return result;
  }
  throw Error('Unsupported game command: '+String(command));
 }
 const api=Object.freeze({schema:'WTW_OFFICE_DIRECT_COMMANDS_V1',dispatch});
 if(global)global.__WTW_OFFICE_COMMANDS__=api;
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:null);
