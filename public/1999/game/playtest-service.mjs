/**
 * WTW Jan 1999 GAME ENGINE PLAYTEST SERVICE.
 *
 * Explicit opt-in only: /next/?playtest=38. The approved Jan 1 founding
 * source world remains zero active racehorses. The 38 provisional fictional
 * horses, 8 barns and modeled finance/jockeys are in this isolated game RUN.
 * This is NOT the historical source, an official production name release,
 * or a second racing rule engine. All transactions go through src/game code.
 */
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,nextDate,
 getGameHorsePerformance,getGameRacingRoster,getAgentRelationships,
 getOwnerPortfolioView,getCareerHorseConnections}
 from './index.js';
import {build1999PilotGameRun} from './1999-pilot-fixture.js';

export const PLAYTEST_SCHEMA='WTW_BROWSER_GAMEPLAY_PLAYTEST_V1';
export const PLAYTEST_QUERY='playtest=38';
export const PLAYTEST_STORAGE='WireToWire1999GameplayPilotV1';
export const PLAYTEST_KEY='active-38-horse-game-run';
const paths=Object.freeze({
 directory:'/data/wtw-1999-founding-directory-v1.json',
 trainers:'/data/wtw-1999-trainer-pilot-v1.json',
 jockeys:'/data/wtw-1999-jockey-pilot-v1.json',
 cohort:'/data/wtw-1999-playtest-cohort-38-v1.json'
});
const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
const stableJson=x=>JSON.stringify(x);
const unique=(rows,key)=>{const used=new Set();return rows.filter(r=>{
 if(used.has(r[key]))return false;used.add(r[key]);return true;
})};
async function sha256(text){
 const subtle=globalThis.crypto?.subtle;
 if(!subtle)throw Error('A secure browser context is required for source integrity');
 const hash=new Uint8Array(await subtle.digest('SHA-256',new TextEncoder().encode(text)));
 return Array.from(hash,b=>b.toString(16).padStart(2,'0')).join('');
}
/** Build the same source-only world snapshot used by the Node game fixture. */
export async function buildPlaytestSnapshot({directory,trainers,jockeys}){
 if(directory?.startDate!=='1999-01-01'||!Array.isArray(directory.people)||
  !Array.isArray(directory.tracks)||!Array.isArray(directory.organizations)||
  !Array.isArray(directory.horses)||!Array.isArray(trainers?.trainers)||
  !Array.isArray(jockeys?.jockeys)||jockeys.jockeys.length!==26)
  throw Error('Missing approved 1999 source identities and selected jockey roster');
 const seen=new Map();
 for(const person of [...directory.people,...trainers.trainers,...jockeys.jockeys]){
  const prior=seen.get(person.id);
  if(prior&&prior.name!==person.name)
   throw Error('Conflicting canonical person identity '+person.id);
  if(!prior)seen.set(person.id,person);
 }
 const persons=[...seen.values()];
 const basis=stableJson({directory,trainers:trainers.trainers.map(x=>[x.id,x.name]),
  jockeys:jockeys.jockeys.map(x=>[x.id,x.name,x.homeTrackId])});
 return {
  schema:WORLD_SCHEMA,start_date:'1999-01-01',
  authority:{snapshot_id:'WTW-1999-FOUNDING-PLAYTEST-SNAPSHOT-V1',
   source:'PUBLIC_APPROVED_DIRECTORY_PLUS_SELECTED_PROFESSIONAL_PILOTS',
   sha256:await sha256(basis)},
  entities:{horses:directory.horses,organizations:directory.organizations,
   people:persons,tracks:directory.tracks}
 };
}
export async function createPlaytestCareer({directory,trainers,jockeys,cohort,save=null,
 playerOperationId='O-000061'}={}){
 const world=await buildPlaytestSnapshot({directory,trainers,jockeys});
 if(cohort?.schema!=='WTW_1999_TEST_HORSE_START_AND_RESIDENCE_V1'||
  cohort?.status!=='ISOLATED_GAME_TEST_COHORT_NOT_AUTHORITATIVE_OPENING'||
  cohort?.horse_count!==38||cohort?.source_names?.accepted_for_production!==false)
  throw Error('Only the explicit provisional 38-horse game test is playable here');
 let state=save?importGameSave(save,world):
  build1999PilotGameRun({world,manifest:cohort,jockeys:jockeys.jockeys,
   playerOperationId,runId:'WTW-RUN-BROWSER-PILOT-38'});
 const listeners=new Set();
 const view=()=>{
  const horses=Object.values(state.runtime.registered_horses.by_id).
   sort((a,b)=>a.registered_name.localeCompare(b.registered_name));
  const sites=state.runtime.facilities.sites,persons=new Map(world.entities.people.map(x=>[x.id,x.name]));
  const orgs=new Map(world.entities.organizations.map(x=>[x.id,x.name]));
  const tracks=new Map(world.entities.tracks.map(x=>[x.id,x.name]));
  const racing=getGameRacingRoster(state);
  const entries=Object.values(state.runtime.entries).map(e=>({...e,
   race_date:state.runtime.races[e.race_id]?.date||null,
   track_id:state.runtime.races[e.race_id]?.track_id||null}));
  const runners=horses.map(h=>{
   const site=sites[h.current_residence_id],condition=getGameHorsePerformance(state,world,h.horse_id);
   const finishHistory=racing.filter(r=>r.results?.some(x=>x.horse_id===h.horse_id)).
    map(r=>({race_id:r.id,date:r.date,track_id:r.track_id,
     finish:r.results.find(x=>x.horse_id===h.horse_id).finish,
     starters:r.results.length}));
   return {horse_id:h.horse_id,id:h.horse_id,name:h.registered_name,
    source:'ISOLATED_GAME_TEST_COHORT_NOT_HISTORICAL',
    owner_id:h.owner_organization_id,owner_name:orgs.get(h.owner_organization_id),
    trainer_id:h.trainer_id,trainer_name:persons.get(h.trainer_id),
    trainerId:h.trainer_id,ownerId:h.owner_organization_id,
    breederId:h.breeder_organization_id,
    site_id:site.id,site_name:site.name,
    host_track_id:h.host_track_id,track_name:tracks.get(h.host_track_id),
    sex:h.sex,foaling_year:h.foaling_year,birth_date:h.birth_date,
    ageAtOpening:h.racing_age_1999,foalYear:h.foaling_year,dateOfBirth:h.birth_date,
    racingStatus1999:'MODELED_1999_GAME_IN_TRAINING',
    openingStable:{name:site.name,trackId:h.host_track_id,locality:
     [site.location?.city,site.location?.state].filter(Boolean).join(', ')},
    attributes:h.starting_attributes,
    ability:{currentStars:Math.round(h.starting_attributes.current_ability/99*10)/2,
     potentialStars:Math.round(h.starting_attributes.potential_ability/99*10)/2},
    career:{...h.career,raceHistory:finishHistory},
    condition,training:state.runtime.horse[h.horse_id]?.training||null,
    carePolicy:state.runtime.horse[h.horse_id]?.policy||null,
    finances:{monthlyCareCost:state.runtime.horse[h.horse_id]?.finance.spent_minor/100||0},
    modelResults:finishHistory};
  });
  return {schema:PLAYTEST_SCHEMA,run_id:state.run_id,date:state.clock.date,
   revision:state.revision,player_operation_id:state.player.operation_id,
   as_of:state.clock.date,horse_count:runners.length,source_history_modified:false,
   all_horses:runners,stable:runners.filter(x=>x.owner_id===state.player.operation_id),
   races:racing,entries,people:world.entities.people,
   finance:{...state.runtime.finances,owner_cash_minor:
    state.runtime.finances.operation_balances_minor[state.player.operation_id]},
   agents:state.runtime.agents,notes:'ISOLATED PROVISIONAL PLAYTEST; NOT APPROVED LIVE HISTORICAL POPULATION'};
 };
 const api={
  get world(){return world},
  get state(){return state},
  view,
  onChange(fn){listeners.add(fn);return ()=>listeners.delete(fn)},
  getSave(){return exportGameSave(state,world)},
  getProfile(id){return getGameHorsePerformance(state,world,id)},
  getConnections(kind,id){return getCareerHorseConnections(state,world,{kind,id})},
  getRelationship(ownerId,trainerId){return getAgentRelationships(state,ownerId,trainerId)},
  getOwnerPortfolio(ownerId){return getOwnerPortfolioView(state,world,ownerId)},
  command(type,payload,{actor='player',id=null}={}){
   const cmd={id:id||'pilot:browser:'+String(state.revision+1)+':'+type,
    type,actor,payload};
   const out=dispatchGameCommand({state,world,command:cmd});
   state=out.state;
   for(const fn of listeners)fn(view());
   return out;
  },
  advanceDay(){return this.command('ADVANCE_DAY',{}, {actor:'system'})},
  advanceTo(date){
   if(typeof date!=='string'||date<state.clock.date)throw Error('Cannot reverse a career clock');
   if((Date.parse(date)-Date.parse(state.clock.date))/86400000>45)
    throw Error('Advance no more than 45 days per action');
   let turns=0;
   while(state.clock.date<date){this.advanceDay();turns++}
   return {days:turns,view:view()};
  },
  setTrainingPlan(horseId,plan){
   const r=state.runtime.horse[horseId];
   if(!r)throw Error('Horse not registered in this career');
   return this.command('SET_HORSE_CARE_POLICY',{
    horse_id:horseId,policy:{...r.policy,training_plan:plan}
   });
  }
 };
 return api;
}
async function openDB(){
 if(typeof indexedDB==='undefined')throw Error('IndexedDB not available for game-save persistence');
 return new Promise((resolve,reject)=>{
  const req=indexedDB.open(PLAYTEST_STORAGE,1);
  req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains('careers'))
    req.result.createObjectStore('careers',{keyPath:'key'})};
  req.onerror=()=>reject(req.error||Error('Playtest database unavailable'));
  req.onsuccess=()=>resolve(req.result);
 });
}
function transact(db,mode,record=null){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction('careers',mode),store=tx.objectStore('careers');
  let response=null;
  const req=mode==='readonly'?store.get(PLAYTEST_KEY):store.put({key:PLAYTEST_KEY,save:record});
  req.onsuccess=()=>{response=req.result};
  tx.oncomplete=()=>resolve(response); // only acknowledge after durable transaction commit
  tx.onerror=()=>reject(tx.error||Error('Playtest save transaction failed'));
  tx.onabort=()=>reject(tx.error||Error('Playtest save transaction aborted'));
 });
}
export function browserPlaytestRequested(location=globalThis.location){
 return new URLSearchParams(location?.search||'').get('playtest')==='38';
}
/** One asynchronous save transaction per command; IndexedDB is authoritative.
 * No second localStorage gameplay finance/horse data is written. */
export async function bootBrowserPlaytest1999(){
 if(!browserPlaytestRequested())return null;
 const data=await Promise.all(Object.values(paths).map(path=>
  fetch(path,{cache:'no-store'}).then(r=>{if(!r.ok)throw Error('Missing 1999 scenario source '+path);return r.json()})));
 const [directory,trainers,jockeys,cohort]=data,db=await openDB();
 const prior=await transact(db,'readonly');
 let engine=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:prior?.save||null});
 if(!prior)await transact(db,'readwrite',engine.getSave());
 const listeners=new Set();let busy=Promise.resolve();
 const sync=()=>{
  const v=engine.view();
  const key=globalThis.__WTW_1999_MANAGEMENT__?.saveKey;
  if(key&&typeof localStorage!=='undefined'){
   const raw=localStorage.getItem(key);
   if(raw){const shell=JSON.parse(raw);
    if(shell?.worldAnchor?.schema==='WTW_1999_FOUNDING_CAREER_V1'){
     shell.date=v.date;shell.turn=engine.state.clock.days_elapsed;
     shell.worldAnchor.playtestRunId=v.run_id;
     shell.worldAnchor.playtestProvenance=v.notes;
     localStorage.setItem(key,JSON.stringify(shell));
    }
   }
  }
  for(const listener of listeners)listener(v);
  if(typeof CustomEvent==='function')globalThis.dispatchEvent?.(
   new CustomEvent('wtw1999-playtest-update',{detail:{date:v.date,revision:v.revision}}));
 };
 const api={
  get state(){return engine.state},view:()=>engine.view(),getSave:()=>engine.getSave(),
  get world(){return engine.world},
  onChange(fn){listeners.add(fn);return()=>listeners.delete(fn)},
  submit(type,payload,actor='player'){
   busy=busy.then(async()=>{
    // Persist first; publish state only if the transaction succeeds.
    const saved=engine.getSave();
    try{const out=engine.command(type,payload,{actor});await transact(db,'readwrite',engine.getSave());
     sync();return out;
    }catch(error){
     engine=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:saved});
     throw error;
    }
   });
   return busy;
  },
  advanceTo(date){
   busy=busy.then(async()=>{
    const saved=engine.getSave();
    try{const result=engine.advanceTo(date);await transact(db,'readwrite',engine.getSave());
     sync();return result;
    }catch(error){
     engine=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:saved});
     throw error;
    }
   });
   return busy;
  },
  setTrainingPlan(horseId,plan){
   busy=busy.then(async()=>{
    const saved=engine.getSave();
    try{const result=engine.setTrainingPlan(horseId,plan);
     await transact(db,'readwrite',engine.getSave());sync();return result;
    }catch(error){engine=await createPlaytestCareer({directory,trainers,jockeys,cohort,save:saved});throw error}
   });
   return busy;
  }
 };
 globalThis.__WTW_1999_PLAYTEST__=api;
 sync();
 return api;
}
