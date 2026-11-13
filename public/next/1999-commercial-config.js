/* Wire to Wire commercial career world configuration.
 * Tiny deterministic description. Never persist generated horses here. */
(()=>{
'use strict';
const PROFILE_KEY='wtwFoundingWorldProfileV1';
const MAIN='wtw1999FoundingStateV1',SCHEMA='WTW_WORLD_PROFILE_V1';
const PRESETS=Object.freeze([
 {id:'founding',label:'Founding world — 112 source horses',population:112,mode:'FOUNDING_1999'},
 {id:'small',label:'Small — 25,000 horses',population:25000},
 {id:'regional',label:'Regional — 75,000 horses',population:75000},
 {id:'national',label:'National — 150,000 horses',population:150000},
 {id:'full',label:'Full world — 325,000 horses',population:325000}
]);
const DEFAULT=Object.freeze({schema:SCHEMA,population:112,seed:19990101,
 mode:'FOUNDING_1999',generator:'WTW_1999_FOUNDING_WORLD_V1'});
function normalize(value){
 const seed=Number(value?.seed??DEFAULT.seed);
 const mode=String(value?.mode||DEFAULT.mode);
 const pop=mode==='FOUNDING_1999'?112:Number(value?.population??DEFAULT.population);
 if(mode!=='FOUNDING_1999'&&(!Number.isSafeInteger(pop)||pop<10000||pop>325000))
  throw Error('Expanded world size must be 10,000–325,000 horses');
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)throw Error('World seed must be a positive 32-bit integer');
 if(!['FOUNDING_1999','CANON_ANCHORED_TEST','FULLY_FICTIONAL_TEST'].includes(mode))
  throw Error('Choose Founding 1999, Historical Foundation, or Fictional');
 return {schema:SCHEMA,population:pop,seed,mode,
  generator:mode==='FOUNDING_1999'?'WTW_1999_FOUNDING_WORLD_V1':'WTW_1999_FULL_SCALE_TEST_V1'};
}
function parse(raw){try{return JSON.parse(raw||'null')}catch{return null}}
function current(){
 try{
  const anchor=parse(localStorage.getItem(MAIN))?.worldAnchor;
  if(anchor?.schema==='WTW_1999_FOUNDING_CAREER_V1'){
   return normalize({...anchor,...(anchor.worldProfile||{}),
    population:anchor.worldProfile?.population??anchor.population??112});
  }
  const stored=parse(localStorage.getItem(PROFILE_KEY));
  if(stored)return normalize(stored);
 }catch{}
 return {...DEFAULT};
}
function pin(value){const profile=normalize(value);localStorage.setItem(PROFILE_KEY,JSON.stringify(profile));return profile}
window.WTW1999CommercialConfig=Object.freeze({schema:SCHEMA,presets:PRESETS,defaults:DEFAULT,
 normalize,current,pin,key:PROFILE_KEY});
})();
