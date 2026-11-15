/**
 * WIRE TO WIRE — naming preview inside the ONE management interface.
 * Research sandbox only. It runs the game-local story-first naming/QA modules but
 * NEVER dispatches a horse registration, changes a game run, or stores a career.
 * Nothing in this file is historical or player-owner attestation.
 */
import {buildGameHorseNamingBrief} from '../1999/game/horse-naming-bridge.js';
import {generateLocalStoryFirstHorseNames} from '../1999/game/horse-naming-local-v485.js';
import {createNamingFeedback,validateNamingFeedback,recordNamingFeedback,
 excludedNamingFeedbackNames,rankNamingCandidates}
 from '../1999/game/horse-naming-feedback-v489.js';

export const NAMING_DESK_MODE='LOCAL_NAMING_DESK_FEEDBACK_V489';
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
const str=x=>typeof x==='string'?x.trim():'';
const KEY=/^[a-zA-Z0-9 '-]+$/;

/** A disposable lab-only horse. Never place this entity in a saved game. */
export function buildNamingLabScenario({ownerName,breederName,story,foalingYear=1996}={}){
 const owner=str(ownerName),breeder=str(breederName),origin=str(story);
 if(owner.length<2||owner.length>80||breeder.length<2||breeder.length>80)
  throw Error('Enter an owner and a breeder for this fictional test scenario (2–80 characters).');
 if(!Number.isInteger(Number(foalingYear))||Number(foalingYear)<1980||Number(foalingYear)>1996)
  throw Error('Use a foaling year from 1980–1996 for the 1999 test context.');
 if(origin.length<35||origin.length>1000)
  throw Error('Describe the horse-specific inspiration in 35–1,000 characters.');
 const horse={horse_id:'H-GAME-1999-NAMINGLAB1',foaling_year:Number(foalingYear),
  owner_organization_id:'O-NAMING-LAB-OWNER',breeder_organization_id:'O-NAMING-LAB-BREEDER',
  sire_id:null,dam_id:null,foaling_location_id:null};
 const source={story_id:'NAMING-LAB-STORY-01',owner_id:horse.owner_organization_id,
  breeder_id:horse.breeder_organization_id,horse_id:horse.horse_id,
  foaling_year:horse.foaling_year,story:origin,date:'1999-01-01',attested_by:'OWNER'};
 const world={entities:{horses:[],people:[],tracks:[],organizations:[
  {id:horse.owner_organization_id,name:owner},{id:horse.breeder_organization_id,name:breeder}]}};
 const state={event_log:[],runtime:{horse_naming:{stories_by_id:{[source.story_id]:source}},
  registered_horses:{by_id:{}}}};
 const brief=buildGameHorseNamingBrief({world,state,horse});
 if(brief.status!=='READY_FOR_ORIGINAL_NAME_WRITING')throw Error('A real story is required.');
 return {world,state,horse,brief,mode:NAMING_DESK_MODE,registrationEnabled:false};
}


/**
 * In the current founding career, feedback is committed through the existing
 * single saved-career authority. The fallback in-memory adapter exists ONLY
 * for isolated tests; the UI never silently claims memory-only writes persist.
 */
export function createNamingDeskController({
 notify=()=>{},loadFeedback=null,saveFeedback=null,getTargets=()=>[],
 gameplayActive=()=>false,commitGameplay=null
}={}){
 let memory=createNamingFeedback();
 const load=typeof loadFeedback==='function'?loadFeedback:()=>memory;
 const write=typeof saveFeedback==='function'?saveFeedback:(next)=>{memory=next;return next};
 const model={fields:{ownerName:'Naming Lab Owner',breederName:'Naming Lab Breeder',
  foalingYear:'1996',story:'',direction:'',targetHorseId:''},
  busy:false,error:'',notice:'',results:[],allResults:[],recentNames:[],attempt:0,
  shortlist:[],rejected:[],hasGenerated:false,view:'ALL',sortKey:'name',sortDesc:false,
  feedback:createNamingFeedback()};
 try{model.feedback=validateNamingFeedback(load()||createNamingFeedback())}
 catch(error){model.error='NAMING HISTORY UNAVAILABLE: '+String(error.message||error)}
 function refresh(){notify()}
 function feedback(){
  // Reload from the active saved career, including after a real game engine
  // resumes asynchronously or the player loads a different save slot.
  const live=load();
  if(live)model.feedback=validateNamingFeedback(live);
  return validateNamingFeedback(model.feedback);
 }
 function currentTargets(){
  const rows=getTargets();
  return Array.isArray(rows)?rows.filter(row=>
   row&&typeof row.id==='string'&&row.id&&typeof row.name==='string'): [];
 }
 function setField(name,value){
  if(model.busy||!Object.hasOwn(model.fields,name))return false;
  model.fields[name]=String(value??'').slice(0,name==='story'?1000:name==='direction'?300:128);
  return true;
 }
 function defaultOwner(name){
  if(!model.hasGenerated&&model.fields.ownerName==='Naming Lab Owner'&&str(name))
   model.fields.ownerName=String(name).slice(0,80);
 }
 function setView(value){
  const next=String(value||'').toUpperCase();
  if(!['ALL','NEW','KEEP','CHOOSE','REJECT'].includes(next))return false;
  model.view=next;refresh();return true;
 }
 function sort(key){
  if(!['name','originMotif','decision'].includes(key))return false;
  model.sortDesc=model.sortKey===key?!model.sortDesc:false;
  model.sortKey=key;refresh();return true;
 }
 function generate(){
  if(model.busy)return false;
  model.error='';model.notice='';
  let scenario;
  try{scenario=buildNamingLabScenario(model.fields)}
  catch(error){model.error=error.message;refresh();return false}
  model.busy=true;refresh();
  try{
   // Career-wide rejected and already-chosen names always stay excluded.
   // Kept names remain available from the bank for another future horse.
   const blocked=excludedNamingFeedbackNames(feedback());
   // A single button press presents a genuine list instead of just 8 cards.
   // Each of three calls still uses the existing eight-name editorial gate;
   // we never bypass source, history, length or independent-screen checks.
   const found=[],batchKeys=new Set(),recent=[...model.recentNames],profile=feedback();
   let held=0;
   for(let page=0;page<3;page++){
    const verdict=generateLocalStoryFirstHorseNames({
     ...scenario,attempt:model.attempt++,count:8,
     recentNames:recent.slice(-60),
     additionalReviewedNames:[...blocked,...found.map(x=>x.name)],
     nameFeedback:profile,direction:model.fields.direction
    });
    held+=verdict.held||0;
    for(const candidate of verdict.screened){
     const key=candidate.name.toLocaleLowerCase('en-US');
     if(batchKeys.has(key))continue;
     batchKeys.add(key);found.push(candidate);recent.push(candidate.name);
    }
   }
   model.results=found;
   const existing=new Set(model.allResults.map(x=>x.name.toLocaleLowerCase('en-US')));
   for(const row of model.results)if(!existing.has(row.name.toLocaleLowerCase('en-US'))){
    model.allResults.push(row);existing.add(row.name.toLocaleLowerCase('en-US'));
   }
   model.recentNames=[...model.recentNames,...model.results.map(r=>r.name)].slice(-60);
   model.hasGenerated=true;model.view='ALL';
   model.notice=model.results.length+' EDITOR-SCREENED NAME(S) · '+
    held+' HELD · 0 NETWORK CALLS. Your prior choices influence ranking.';
  }catch(error){
   model.error='LOCAL NAMING FAILED: '+String(error?.message||error);
  }finally{model.busy=false;refresh()}
  return model.results.length>0;
 }
 function row(name){
  const key=String(name||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g,'');
  const result=model.allResults.find(r=>r.name&&r.name.normalize('NFKD')
   .replace(/[\u0300-\u036f]/g,'').toLocaleLowerCase('en-US')
   .replace(/[^a-z0-9]/g,'')===key);
  const prior=feedback().decisions[key];
  if(!result&&!prior)return null;
  return {name:result?.name||prior.name,
   motifId:result?.originMotif||prior?.motifId||'',
   status:result?.status||'AWAITING_INDEPENDENT_EDITOR',
   decision:prior?.decision||'',
   explanation:result?.explanation||'Previously saved naming decision',
   evidenceQuote:result?.evidenceQuote||'',
   horseId:prior?.horseId||''};
 }
 function decide(name,decision){
  if(model.busy)return false;
  model.error='';model.notice='';
  try{
   const item=row(name);
   if(!item)throw Error('Choose a name from the current list or saved name bank');
   if(item.status!=='AWAITING_INDEPENDENT_EDITOR')
    throw Error('This candidate failed the independent name screening');
   const target=decision==='CHOOSE'?model.fields.targetHorseId:'';
   if(decision==='CHOOSE'&&!currentTargets().some(x=>x.id===target))
    throw Error('Select an actual horse from the active career before choosing');
   const before=feedback();
   const next=recordNamingFeedback(before,{
    name:item.name,decision,motifId:item.motifId,horseId:target,
    prompt:model.fields.direction
   });
   if(next===before){model.notice='Already recorded: '+item.name;refresh();return true}
   const saved=write(next,before.revision);
   model.feedback=validateNamingFeedback(saved||next);
   model.shortlist=Object.values(model.feedback.decisions)
    .filter(x=>x.decision==='KEEP').map(x=>x.name);
   model.rejected=Object.values(model.feedback.decisions)
    .filter(x=>x.decision==='REJECT').map(x=>x.name);
   model.notice=decision==='KEEP'?item.name+' saved for a future horse.':
    decision==='REJECT'?item.name+' permanently excluded from this career.':
    item.name+' chosen for '+currentTargets().find(x=>x.id===target)?.name+
     '. Selection saved; official name/identity change is not yet registered.';
   refresh();return true;
  }catch(error){model.error=String(error?.message||error);refresh();return false}
 }
 async function decideGameplay(name,decision){
  if(model.busy||typeof commitGameplay!=='function')return false;
  model.error='';model.notice='';
  let attempted=null;
  try{
   const item=row(name),target=decision==='CHOOSE'?model.fields.targetHorseId:'';
   if(!item||item.status!=='AWAITING_INDEPENDENT_EDITOR')
    throw Error('Only independently screened names may be reviewed');
   if(decision==='CHOOSE'&&!currentTargets().some(x=>x.id===target))
    throw Error('Select a real player-owned horse before choosing');
   const prior=feedback();
   attempted=recordNamingFeedback(prior,{name:item.name,decision,
    motifId:item.motifId,horseId:target,prompt:model.fields.direction});
   if(attempted===prior){model.notice='Already recorded: '+item.name;return true}
   model.busy=true;refresh();
   // The actual game service resolves only AFTER its IndexedDB transaction
   // commits. Never display a false success on an interrupted write.
   await commitGameplay({name:item.name,decision,motif_id:item.motifId,
    horse_id:target,prompt:model.fields.direction});
   model.feedback=validateNamingFeedback(load()||attempted);
   if(model.feedback.revision!==attempted.revision)
    throw Error('Game did not persist the expected name preference revision');
   model.shortlist=Object.values(model.feedback.decisions)
    .filter(x=>x.decision==='KEEP').map(x=>x.name);
   model.rejected=Object.values(model.feedback.decisions)
    .filter(x=>x.decision==='REJECT').map(x=>x.name);
   model.notice=decision==='KEEP'?item.name+' kept for later in the saved game.':
    decision==='REJECT'?item.name+' permanently rejected in the saved game.':
    item.name+' selected for '+currentTargets().find(x=>x.id===target)?.name+
    '. Player decision is saved; official registrar approval remains pending.';
   return true;
  }catch(error){model.error=String(error?.message||error);return false}
  finally{model.busy=false;refresh()}
 }
 function mark(name){return decide(name,'KEEP')}
 function reject(name){return decide(name,'REJECT')}
 function choose(name){return decide(name,'CHOOSE')}
 function clear(){
  if(model.busy)return false;
  model.results=[];model.allResults=[];model.recentNames=[];model.attempt=0;model.error='';
  // Never erase lifetime rejected/kept/chosen decisions by clearing a preview.
  model.notice='Current proposal list cleared. Saved choices remain in this career.';
  refresh();return true;
 }
 function snapshot(){return JSON.parse(JSON.stringify(model))}
 function action(key,val){
  if(key==='naming-generate')return generate();
  if(key==='naming-keep')return gameplayActive()?decideGameplay(val,'KEEP'):mark(val);
  if(key==='naming-reject')return gameplayActive()?decideGameplay(val,'REJECT'):reject(val);
  if(key==='naming-choose')return gameplayActive()?decideGameplay(val,'CHOOSE'):choose(val);
  if(key==='naming-clear')return clear();
  if(key==='naming-view')return setView(val);
  if(key==='naming-sort')return sort(val);
  return false;
 }
 function render(){
  const f=model.fields,profile=feedback();
  const targets=currentTargets();
  const bank=Object.values(profile.decisions);
  const displayed=new Map();
  for(const item of model.allResults)displayed.set(item.name.toLocaleLowerCase('en-US'),{
   ...item,decision:profile.decisions[item.name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLocaleLowerCase('en-US').replace(/[^a-z0-9]/g,'')]?.decision||''});
  for(const item of bank)if(![...displayed.values()].some(x=>x.name===item.name))
   displayed.set(item.name.toLocaleLowerCase('en-US'),{
    name:item.name,originMotif:item.motifId,decision:item.decision,
    status:'AWAITING_INDEPENDENT_EDITOR',explanation:'Saved naming decision',
    evidenceQuote:'',horseId:item.horseId
   });
  const rows=[...displayed.values()].filter(x=>model.view==='ALL'||
   model.view==='NEW'&&!x.decision||x.decision===model.view)
   .sort((a,b)=>{
    const key=model.sortKey,left=String(a[key]||''),right=String(b[key]||'');
    const value=left.localeCompare(right,undefined,{sensitivity:'base'});
    return (model.sortDesc?-value:value)||a.name.localeCompare(b.name);
   });
  const counts={KEEP:0,CHOOSE:0,REJECT:0};
  bank.forEach(x=>counts[x.decision]++);
  const targetOptions=targets.map(t=>'<option value="'+esc(t.id)+'"'+
   (f.targetHorseId===t.id?' selected':'')+'>'+esc(t.name)+' · '+esc(t.id)+'</option>').join('');
  const options=['ALL','NEW','KEEP','CHOOSE','REJECT'].map(v=>
   '<button type="button" data-ng="naming-view" data-val="'+v+'" class="'+
   (model.view===v?'on':'')+'">'+
   ({ALL:'ALL',NEW:'NEW',KEEP:'KEPT',CHOOSE:'CHOSEN',REJECT:'REJECTED'}[v])+
   '</button>').join('');
  const head=(field,label)=>'<button type="button" data-ng="naming-sort" data-val="'+
   field+'" class="ng-naming-sort" aria-label="Sort by '+esc(label)+'">'+esc(label)+
   (model.sortKey===field?(model.sortDesc?' ↓':' ↑'):' ↕')+'</button>';
  const tableRows=rows.map((r,i)=>{
   const verdict=r.decision||'NEW',locked=verdict==='REJECT'||verdict==='CHOOSE';
   const valid=r.status==='AWAITING_INDEPENDENT_EDITOR';
   const canChoose=valid&&!locked&&Boolean(targets.find(t=>t.id===f.targetHorseId));
   const status=verdict==='KEEP'?'KEPT FOR LATER':verdict==='CHOOSE'?'CHOSEN FOR HORSE':
     verdict==='REJECT'?'REJECTED · NEVER REUSE':valid?'AWAITING CHOICE':'HELD';
   const btn=(kind,label,disabled)=>'<button type="button" data-ng="naming-'+
    kind+'" data-val="'+esc(r.name)+'"'+(disabled?' disabled':'')+'>'+
    label+'</button>';
   return '<tr><td class="ng-naming-row-number">'+(i+1)+'</td>'+
    '<td class="ng-naming-row-name"><strong>'+esc(r.name)+'</strong>'+
     '<small>'+esc(r.explanation||'')+'</small></td>'+
    '<td>'+esc(r.originMotif||'—')+'</td><td class="ng-naming-decision">'+esc(status)+'</td>'+
    '<td><div class="ng-naming-list-buttons">'+
    btn('choose','CHOOSE FOR THIS HORSE',!canChoose)+
    btn('keep',verdict==='KEEP'?'KEPT':'KEEP',!valid||locked||verdict==='KEEP')+
    btn('reject',verdict==='REJECT'?'REJECTED':'REJECT',!valid||locked)+
    '</div></td></tr>';
  }).join('');
  const metric=(label,value)=>'<div class="ng-manager-metric"><small>'+esc(label)+
    '</small><strong>'+esc(value)+'</strong></div>';
  return '<section class="ng-manager-screen ng-naming-desk" aria-label="Horse Naming Desk">'+
   '<div class="ng-manager-head"><div class="ng-manager-identity">'+
    '<span>STABLE / HORSE NAMES</span><h2>NAMING DESK</h2></div>'+
   '<div class="ng-manager-controls"><span class="ng-naming-status">ON-DEVICE · LEARNS YOUR PREFERENCES</span>'+
    '<button type="button" data-ng="naming-clear">CLEAR CURRENT LIST</button></div></div>'+
   '<div class="ng-manager-metrics">'+metric('NAME DECISIONS',profile.revision)+
    metric('KEPT FOR LATER',counts.KEEP)+metric('CHOSEN',counts.CHOOSE)+
    metric('PERMANENT REJECTS',counts.REJECT)+'</div>'+
   '<div class="ng-naming-workspace">'+
   '<section class="ng-naming-composer"><div class="ng-naming-fields">'+
    '<label>OWNER / STABLE<input data-naming-field="ownerName" maxlength="80" value="'+esc(f.ownerName)+'"/></label>'+
    '<label>BREEDER<input data-naming-field="breederName" maxlength="80" value="'+esc(f.breederName)+'"/></label>'+
    '<label>FOALING YEAR<input data-naming-field="foalingYear" type="number" min="1980" max="1996" value="'+esc(f.foalingYear)+'"/></label>'+
    '<label>HORSE FOR CHOSEN NAME<select data-naming-field="targetHorseId"><option value="">SELECT A HORSE</option>'+
     targetOptions+'</select></label></div>'+
    '<label>STORY / INSPIRATION<textarea data-naming-field="story" maxlength="1000" rows="2" placeholder="Tell the story or describe the moment behind the name.">'+esc(f.story)+'</textarea></label>'+
    '<label>CREATIVE DIRECTION (OPTIONAL)<input data-naming-field="direction" maxlength="300" value="'+esc(f.direction)+'" placeholder="e.g. short and understated, one word, not too literal"/></label>'+
    '<div class="ng-naming-actions"><button type="button" class="primary" data-ng="naming-generate"'+
    (model.busy?' disabled':'')+'>GENERATE NAMES</button>'+
    '<small>Choices are saved in this career. Generation is local; no paid AI or network required.</small></div>'+
    (model.error?'<p class="ng-naming-error" role="alert">'+esc(model.error)+'</p>':'')+
    (model.notice?'<p class="ng-naming-notice" role="status">'+esc(model.notice)+'</p>':'')+
   '</section><div class="ng-naming-table-toolbar"><strong>NAME PROPOSALS & SAVED DECISIONS</strong>'+
    '<div class="ng-naming-view-filters">'+options+'</div><small>'+rows.length+' ROWS</small></div>'+
   '<div class="ng-naming-table-scroll" tabindex="0" role="region" aria-label="Generated horse names and decisions">'+
    '<table class="ng-naming-table"><thead><tr><th>#</th><th>'+head('name','NAME & INSPIRATION')+'</th>'+
    '<th>'+head('originMotif','ORIGIN')+'</th><th>'+head('decision','STATUS')+'</th><th>YOUR DECISION</th></tr></thead><tbody>'+
     (tableRows||'<tr><td colspan="5" class="ng-naming-no-results">Tell a horse story and generate suggestions. Kept names remain in your bank; rejected names never return in this career.</td></tr>')+
    '</tbody></table></div>'+
   '<footer class="ng-naming-footer">KEEP = future name bank · REJECT = career-wide exclusion · CHOOSE = saves your horse-specific selection, pending official game identity registration. '+
    (!targets.length?'No eligible horse is currently connected, so Choose is unavailable.':'')+
    ' 55,000-per-year target is NOT capacity-certified; names without safe unique candidates remain held.</footer></div></section>';
 }
 return {mode:NAMING_DESK_MODE,setField,defaultOwner,generate,mark,reject,choose,clear,
  setView,sort,action,snapshot,render};
}

if(typeof window!=='undefined'){
 const manager=window.__WTW_1999_MANAGEMENT__;
 const desk=createNamingDeskController({
  notify:()=>window.__WTW_NEXT__?.paint?.(),
  loadFeedback:()=>window.__WTW_1999_UI_DATA__?.gameplayService?.state?.runtime?.horse_naming?.feedback||manager?.readNamingFeedback?.()||null,
  gameplayActive:()=>Boolean(window.__WTW_1999_UI_DATA__?.gameplayService),
  commitGameplay:payload=>window.__WTW_1999_UI_DATA__.gameplayService.submit('OWNER_SET_HORSE_NAMING_PREFERENCE',payload),
  saveFeedback:(next,revision)=>{
   if(!manager?.commitNamingFeedback)throw Error('Career naming save service unavailable');
   if(window.__WTW_1999_UI_DATA__?.gameplayService)
    throw Error('Playtest naming needs a gameplay-owned save bridge; no detached writes allowed');
   return manager.commitNamingFeedback(next,revision);
  },
  getTargets:()=>Array.isArray(window.__WTW_1999_UI_DATA__?.gameplayService?.view?.()?.stable||window.__WTW_1999_UI_DATA__?.stableHorses)?
   (window.__WTW_1999_UI_DATA__?.gameplayService?.view?.()?.stable||window.__WTW_1999_UI_DATA__.stableHorses).map(h=>({
    id:String(h.horse_id||h.id||''),name:String(h.name||'')
   })).filter(h=>h.id&&h.name):[]
 });
 window.WTW1999NamingDesk=desk;
 window.__WTW_NEXT__?.paint?.();
}
