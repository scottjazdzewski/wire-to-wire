/**
 * WIRE TO WIRE — naming preview inside the ONE management interface.
 * Research sandbox only. It runs the game-local story-first naming/QA modules but
 * NEVER dispatches a horse registration, changes a game run, or stores a career.
 * Nothing in this file is historical or player-owner attestation.
 */
import {buildGameHorseNamingBrief} from '../1999/game/horse-naming-bridge.js';
import {generateLocalStoryFirstHorseNames} from '../1999/game/horse-naming-local-v485.js';

export const NAMING_DESK_MODE='ISOLATED_LOCAL_NAMING_RESEARCH_V485';
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

export function createNamingDeskController({notify=()=>{}}={}){
 const model={fields:{ownerName:'Naming Lab Owner',breederName:'Naming Lab Breeder',
  foalingYear:'1996',story:''},busy:false,error:'',notice:'',results:[],
  recentNames:[],shortlist:[],rejected:[],attempt:0,hasGenerated:false};
 function refresh(){notify()}
 function setField(name,value){
  if(model.busy||!Object.hasOwn(model.fields,name))return false;
  model.fields[name]=String(value||'').slice(0,name==='story'?1000:100);
  return true;
 }
 function defaultOwner(name){
  if(!model.hasGenerated&&model.fields.ownerName==='Naming Lab Owner'&&str(name))
   model.fields.ownerName=String(name).slice(0,80);
 }
 function generate(){
  if(model.busy)return false;
  model.error='';model.notice='';model.results=[];
  let scenario;
  try{scenario=buildNamingLabScenario(model.fields)}
  catch(error){model.error=error.message;refresh();return false}
  model.busy=true;refresh();
  try{
   // Entirely local JavaScript. No model API, Cloudflare AI, Worker endpoint,
   // daily quota, network request or persistent world mutation.
   const verdict=generateLocalStoryFirstHorseNames({
    ...scenario,attempt:model.attempt++,count:8,recentNames:model.recentNames
   });
   model.results=verdict.screened;
   model.recentNames=[...model.recentNames,...model.results.map(r=>r.name)].slice(-60);
   model.hasGenerated=true;
   model.notice=verdict.readyForIndependentEditor+' LOCAL NAME(S) READY FOR EDITOR · '+
    verdict.held+' HELD · 0 REQUESTS · 0 CREDITS';
  }catch(error){
   const message=String(error?.message||error);
   model.error=message.includes('NAMING_')?'LOCAL NAME SCREEN FAILED: '+message:
    'LOCAL NAME GENERATION FAILED: '+message;
  }finally{model.busy=false;refresh()}
  return model.results.length>0;
 }
 function mark(name){
  const candidate=model.results.find(r=>r.name===name&&r.status==='AWAITING_INDEPENDENT_EDITOR');
  if(!candidate||model.rejected.includes(name))return false;
  if(!model.shortlist.includes(name))model.shortlist.push(name);
  model.notice='Marked as interesting for this browser session. NOT owner-approved or registered.';
  refresh();return true;
 }
 function reject(name){
  const candidate=model.results.find(r=>r.name===name);
  if(!candidate||model.rejected.includes(name))return false;
  model.rejected.push(name);
  model.shortlist=model.shortlist.filter(x=>x!==name);
  model.notice='Rejected this proposal in the temporary lab. No permanent owner rating or career record was changed.';
  refresh();return true;
 }
 function clear(){
  if(model.busy)return false;
  model.results=[];model.shortlist=[];model.rejected=[];model.recentNames=[];model.attempt=0;model.error='';
  model.notice='Lab results cleared. Your actual game save is unchanged.';
  refresh();return true;
 }
 function snapshot(){return JSON.parse(JSON.stringify(model))}
 function action(key,val){
  if(key==='naming-generate')return generate();
  if(key==='naming-keep')return mark(val);
  if(key==='naming-reject')return reject(val);
  if(key==='naming-clear')return clear();
  return false;
 }
 function render(){
  const f=model.fields;
  const candidates=model.results.map((r,i)=>{
   const pass=r.status==='AWAITING_INDEPENDENT_EDITOR';
   const rejected=model.rejected.includes(r.name);
   return '<article class="ng-naming-candidate"><div class="ng-naming-candidate-head"><strong>'+
    esc(r.name)+'</strong><small>'+(rejected?'REJECTED IN LAB':pass?'SCREENED · EDITOR NEEDED':'HELD')+'</small></div>'+
    '<p>'+esc(r.explanation||'No meaningful explanation')+'</p>'+
    '<small class="ng-naming-provenance">ORIGIN: '+esc(r.evidenceQuote||'Not supplied')+'</small>'+
    (r.reasons?.length?'<small class="ng-naming-issues">CHECK: '+esc(r.reasons.join(' · '))+'</small>':'')+
    '<div class="ng-naming-actions"><button type="button" data-ng="naming-keep" data-val="'+esc(r.name)+'"'+
     (!pass||rejected||model.shortlist.includes(r.name)?' disabled':'')+'>'+
     (model.shortlist.includes(r.name)?'MARKED':'MARK INTERESTING')+'</button>'+ 
     '<button type="button" data-ng="naming-reject" data-val="'+esc(r.name)+'"'+(rejected?' disabled':'')+'>'+
     (rejected?'REJECTED':'REJECT IN LAB')+'</button><span>NOT RELEASED</span></div></article>';
  }).join('');
  const metric=(label,value)=>'<div class="ng-manager-metric"><small>'+esc(label)+'</small><strong>'+esc(value)+'</strong></div>';
  return '<section class="ng-manager-screen ng-naming-desk" aria-label="Horse Naming Desk research preview">'+
   '<div class="ng-manager-head"><div class="ng-manager-identity"><span>STABLE / NAMING</span><h2>NAMING DESK</h2></div>'+
   '<div class="ng-manager-controls"><span class="ng-naming-status">ON-DEVICE SANDBOX · NO REGISTRATIONS</span>'+ 
   '<button type="button" data-ng="naming-clear">CLEAR LAB</button></div></div>'+
   '<div class="ng-manager-metrics">'+metric('OWNER-RATED RESEARCH','520')+
    metric('REMOTE AI REQUESTS','0')+metric('SCREENED IN THIS SESSION',model.results.filter(r=>r.status==='AWAITING_INDEPENDENT_EDITOR').length)+
    metric('LAB SHORTLIST',model.shortlist.length)+'</div>'+
   '<div class="ng-manager-workspace"><section class="ng-manager-primary"><header><strong>HORSE-SPECIFIC ORIGIN</strong><span>FICTIONAL TEST HORSE · NO GAME WRITES</span></header>'+ 
   '<div class="ng-naming-editor">'+
    '<div class="ng-naming-fields"><label>OWNER / STABLE<input data-naming-field="ownerName" maxlength="80" value="'+esc(f.ownerName)+'" autocomplete="off"/></label>'+ 
    '<label>BREEDER<input data-naming-field="breederName" maxlength="80" value="'+esc(f.breederName)+'" autocomplete="off"/></label>'+ 
    '<label>FOALING YEAR<input data-naming-field="foalingYear" type="number" min="1980" max="1996" value="'+esc(f.foalingYear)+'"/></label></div>'+ 
    '<label>WHAT ACTUALLY INSPIRED THIS HORSE’S NAME? <textarea data-naming-field="story" maxlength="1000" rows="3" placeholder="Describe an unusual moment, family story, foaling event, personality trait, phrase, or memory. For this lab only, fictional stories are permitted—but never treated as historical facts.">'+esc(f.story)+'</textarea></label>'+ 
    '<div class="ng-naming-actions"><button type="button" data-ng="naming-generate" class="primary"'+(model.busy?' disabled':'')+'>'+
      (model.busy?'WRITING NAMES…':'GENERATE LOCAL NAMES')+'</button><small>Runs in this game. No Cloudflare, credits, network calls or daily limits. Names are not registered horses.</small></div>'+ 
    (model.error?'<p class="ng-naming-error" role="alert">'+esc(model.error)+'</p>':'')+
    (model.notice?'<p class="ng-naming-notice" role="status">'+esc(model.notice)+'</p>':'')+
   '</div><header><strong>CREATIVE PROPOSALS</strong><span>'+model.results.length+' RETURNED</span></header>'+ 
   '<div class="ng-naming-results" tabindex="0" role="region" aria-label="Naming proposals">'+
    (candidates||'<p class="ng-manager-empty">No names generated yet. Add a horse-specific story, then generate local names. Nothing will be added to the current stable.</p>')+'</div></section>'+ 
   '<aside class="ng-manager-sidebar"><section class="ng-manager-secondary"><header><strong>EDITORIAL GATES</strong><span>ACTIVE</span></header>'+ 
   '<div class="ng-manager-secondary-list ng-naming-guidance"><p>1 · Meaning tied to the supplied story</p><p>2 · Previously rated names excluded</p><p>3 · Repeated and generic patterns screened</p><p>4 · Independent editorial review required</p><p>5 · Owner approval required before registration</p></div></section>'+ 
   '<section class="ng-manager-secondary"><header><strong>SESSION SHORTLIST</strong><span>'+model.shortlist.length+' LAB ONLY</span></header>'+ 
   '<div class="ng-manager-secondary-list ng-naming-guidance">'+(model.shortlist.map(n=>'<p>'+esc(n)+'</p>').join('')||
   '<p>No shortlisted names. The shortlist is temporary and is not a game save or approval.</p>')+'</div></section>'+ 
   '<section class="ng-manager-secondary"><header><strong>POPULATION SAFETY</strong></header>'+ 
   '<div class="ng-manager-secondary-list ng-naming-guidance"><p>The live 1999 roster, foaling records, horse identities, history, IndexedDB careers and registration gate are never modified by this desk.</p>'+ 
   '<p>When breeding is ready, actual saved horse and owner IDs can enter the separate owner-review workflow.</p><p>POPULATION PIPELINE · 16 source-backed foals per batch · 3,438 batches for 55,000 horses/year · AI requests are budget-limited and proposals remain unregistered.</p></div></section></aside></div></section>';
 }
 return {mode:NAMING_DESK_MODE,setField,defaultOwner,generate,mark,reject,clear,action,snapshot,render};
}

if(typeof window!=='undefined'){
 const desk=createNamingDeskController({notify:()=>window.__WTW_NEXT__?.paint?.()});
 window.WTW1999NamingDesk=desk;
 window.__WTW_NEXT__?.paint?.();
}