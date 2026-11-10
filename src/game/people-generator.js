/**
 * WTW game-character generation, keyed by immutable approved World Person IDs.
 *
 * Game-model ratings are NOT claims about historical people. Deterministic
 * beginning-of-career attributes and reputation are stored only in the game
 * runtime. Every person has the appropriate trait slots; observations start
 * unknown to the player.
 */
import {validateWorld,ensure,strictJSON} from './contracts.js';
import {nextRandom,validateSeed} from './rng.js';
import {attributeDefinitions} from './attribute-contract.js';
import {makeReputationBaseline,validateReputationCatalog} from './reputation.js';

const clamp01=x=>Math.max(.01,Math.min(.99,Math.round(x*10000)/10000));
const clamp100=x=>Math.min(99,Math.max(1,Math.round(x)));
function stableHash(str){
 let hash=2166136261;
 for(let i=0;i<str.length;i++){hash^=str.charCodeAt(i);hash=Math.imul(hash,16777619);}
 return (hash>>>0)||1;
}
function draw(rng){
 const x=nextRandom(rng.seed);
 rng.seed=x.next_seed;
 return x.value;
}
export function normalizePersonRoles(person,catalog){
 const raw=Array.isArray(person.roles)?person.roles:typeof person.role==='string'?[person.role]:[];
 return [...new Set(raw.filter(role=>typeof role==='string'&&Boolean(catalog.person_roles[role])))];
}
/**
 * Default generator inputs are the accepted world digest and person ID:
 * a character remains the SAME across different game saves of that world.
 *
 * No historical career fact is changed. More sophisticated accepted generation
 * authorities may replace this V1 prior but must retain IDs, provenance and
 * complete coverage checks.
 */
export function generatePeopleRuntime({world,catalog,worldSeed=null}={}){
 validateWorld(world);validateReputationCatalog(catalog);
 const seed=worldSeed===null?stableHash(world.authority.sha256+':WTW-PEOPLE-V1'):validateSeed(worldSeed);
 const out={};
 for(const person of world.entities.people){
  const roles=normalizePersonRoles(person,catalog);
  const rng={seed:stableHash(seed+':'+person.id)};
  const heritage=draw(rng),careerPotential=draw(rng),social=draw(rng);
  const latent={};
  for(const def of attributeDefinitions(catalog,'people',roles)){
    if(def.scope!=='latent')continue;
    // Correlated ability profiles: some people are broadly capable; each has
    // distinct technical strengths, flaws and professional specialisms.
    const professional=roles.length&&catalog.person_roles[roles[0]]?.some(d=>d.key===def.key);
    const mean=.27+heritage*.28+careerPotential*.15+(professional ? 0.05 : 0);
    latent[def.key]=clamp01(mean+(draw(rng)-.5)*.38);
  }
  // Reputation measures public standing, not hidden true ability.
  // A low-experience person can have excellent latent skill but little standing.
  // A rare high-status character may have weaker actual competence.
  const visibility=draw(rng)*draw(rng);
  const baseline=clamp100(18+72*visibility);
  const confidence=clamp100(baseline+(social-.5)*18);
  const professionalTrust=clamp100(baseline+(heritage-.5)*20);
  const scores={
    overall:baseline,
    owner_trust:confidence,
    professional_trust:professionalTrust,
    market:clamp100(baseline+(draw(rng)-.5)*24),
    national:clamp100(Math.min(baseline,baseline*.72)+draw(rng)*8)
  };
  const circuitId=typeof person.circuit_id==='string'&&person.circuit_id.trim()?person.circuit_id:null;
  if(circuitId)scores.circuit=clamp100(baseline+(draw(rng)-.5)*18);
  const ref='WTW-GAME-MODEL:PERSON-V1:'+world.authority.snapshot_id+':'+person.id;
  const reputation=makeReputationBaseline({catalog,scores,date:world.start_date,
    circuit_id:circuitId,source_kind:'GENERATED_GAME',source_refs:[ref]});
  out[person.id]={roles,latent,reputation,observations:[],relationships:{},
    origin:{kind:'GENERATED_GAME',version:'WTW-PEOPLE-V1',world_snapshot_id:world.authority.snapshot_id}};
 }
 return strictJSON(out);
}
