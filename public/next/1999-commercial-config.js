/* WTW CLEAN 1999 WORLD — user-approved population only.
 * No fictional/legacy modes, no generated companies, runners or facilities.
 * Naming and future game creation must use separately approved registration.
 */
(()=>{
'use strict';
const PROFILE_KEY='wtwFoundingWorldProfileV1';
const MAIN='wtw1999FoundingStateV1',SCHEMA='WTW_WORLD_PROFILE_V1';
const DEFAULT=Object.freeze({schema:SCHEMA,population:73,seed:19990101,
 mode:'FOUNDING_1999',generator:'WTW_1999_FOUNDING_WORLD_V1'});
const PRESETS=Object.freeze([
 Object.freeze({id:'founding',label:'1999 Opening — 73 approved breeding horses, 0 racing horses',
  population:73,mode:'FOUNDING_1999'})
]);
function normalize(value){
 const mode=value?.mode??DEFAULT.mode;
 const population=Number(value?.population??DEFAULT.population);
 const seed=Number(value?.seed??DEFAULT.seed);
 if(mode!=='FOUNDING_1999'||population!==73)
  throw Error('Retired test world is unavailable; only the approved small 1999 world is supported');
 if(!Number.isSafeInteger(seed)||seed<1||seed>4294967295)
  throw Error('Invalid founding seed');
 return {schema:SCHEMA,population:73,mode:'FOUNDING_1999',seed,generator:DEFAULT.generator};
}
function parse(raw){try{return JSON.parse(raw||'null')}catch{return null}}
function current(){
 try{
  const anchor=parse(localStorage.getItem(MAIN))?.worldAnchor;
  if(anchor?.schema==='WTW_1999_FOUNDING_CAREER_V1'&&
     anchor.mode==='FOUNDING_1999'&&anchor.population===73)
   return normalize({...anchor.worldProfile,...anchor,mode:'FOUNDING_1999',population:73});
 }catch{}
 return {...DEFAULT};
}
function pin(profile){
 const clean=normalize(profile);
 localStorage.setItem(PROFILE_KEY,JSON.stringify(clean));
 return clean;
}
window.WTW1999CommercialConfig=Object.freeze({schema:SCHEMA,presets:PRESETS,
 defaults:DEFAULT,normalize,current,pin,key:PROFILE_KEY});
})();