/**
 * WTW 1999 modeled working relationships.
 *
 * Canonical owner patience uses its persisted source O-ID rating; older
 * pilot owners retain the fixed, reproducible GAME temperament fallback.
 * Relationship strength and friction change with actual paid-care, welfare,
 * race and trust history.
 * These are explicitly NOT biographies of real industry participants.
 * This selector is pure: it never creates records, changes the game seed,
 * edits historical identities or silently acts for a human player.
 */
import {project1999OwnerSourceGameplay}
 from '../engine/source-personnel-gameplay-1999.mjs';
const bounded=x=>Math.max(0,Math.min(1,x));
const four=x=>Math.round(bounded(x)*10000)/10000;
function factor(seed,id,salt){
 let h=(2166136261^(seed>>>0))>>>0;
 for(const c of id+':'+salt){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}
 h^=h>>>16;h=Math.imul(h,2246822507);h^=h>>>13;
 return (h>>>0)/4294967296;
}
export function workingRelationshipProfile(state,ownerId,trainerId,sourceOwner=null){
 const seed=state.rng.seed;
 const outlook=state.runtime.agents?.owners?.[ownerId];
 const style=outlook?.style??'BALANCED';
 const ownerModel=project1999OwnerSourceGameplay(sourceOwner);
 const ownerPatience=ownerModel?.patience??four(
  .20+.63*factor(seed,ownerId,'owner-patience')+
  (style==='CAUTIOUS'?.08:style==='AMBITIOUS'?-.08:0));
 const trainerPatience=four(.17+.66*factor(seed,trainerId,'trainer-patience'));
 const compatibility=four(.23+.54*factor(seed,ownerId+'|'+trainerId,'working-compatibility'));
 const rel=state.runtime.agents?.relationships?.[ownerId+'|'+trainerId];
 const ownerTrust=rel?.owner_trust??.5,trainerSupport=rel?.trainer_support??.5;
 const days=rel?.days??0,unfunded=rel?.unfunded_days??0;
 const tenure=four(Math.min(1,days/180));
 const unmet=four(unfunded/Math.max(1,days));
 const disagreement=four(Math.abs(ownerTrust-trainerSupport));
 const friction=four(.58*disagreement+.42*unmet);
 const strength=four(.43*ownerTrust+.35*trainerSupport+
  .14*compatibility+.08*tenure-.12*friction);
 return {
  owner_id:ownerId,trainer_id:trainerId,
  owner_patience:ownerPatience,trainer_patience:trainerPatience,
  owner_rating_source:ownerModel?.schema??null,
  personality_compatibility:compatibility,
  working_relationship_strength:strength,
  relationship_friction:friction,
  owner_trust:four(ownerTrust),trainer_support:four(trainerSupport),
  shared_working_days:days,unfunded_horse_days:unfunded,
  expectation_alignment:four(1-disagreement),
  evidence:'MODELED_STABLE_TEMPERAMENT_AND_ACTUAL_GAME_RELATIONSHIP_ONLY'
 };
}
