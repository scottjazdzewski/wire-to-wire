import { openingWorld1999 as world } from './opening-world.v1.mjs';
const horses=new Map(world.horses.map(x=>[x.id,x]));
const races=new Map(world.stakes1999.map(x=>[x.id,x]));
const tracks=new Map(world.tracks.map(x=>[x.id,x]));
const matchISO=x=>/^1999-\d\d-\d\d$/.test(String(x||'')) && !Number.isNaN(Date.parse(x+'T12:00:00Z'));
const day=x=>Math.floor(Date.parse(x+'T12:00:00Z')/86400000);
const arr=x=>Array.isArray(x)?x:[];
const normalizeDate=x=>String(x||'').slice(0,10);

/**
 * Shared player/AI entry eligibility evaluator.
 * No mutation, no hidden horse quality, no assumed health, no invented entries.
 * The caller supplies *observations/events*, never a target win probability.
 */
export function evaluate1999Entry({horseId,raceId,observations={},actorRole='AI'}={}){
 const blocks=[],holds=[],h=horses.get(horseId),r=races.get(raceId);
 // Deliberately ignore actorRole for rules: parity is structural, not a promise.
 void actorRole;
 if(!h)blocks.push('BLOCK_NONEXISTENT_HORSE');
 if(!r)blocks.push('BLOCK_NONEXISTENT_STAKES');
 if(!h||!r)return {status:'BLOCKED',blocks,holds,entryCommitted:false,resultGenerated:false};
 const target=normalizeDate(r.localDate);
 if(!matchISO(target))blocks.push('BLOCK_INVALID_RACE_DATE');
 const age=1999-h.foalYear;
 const ageSpec=String(r.ageSex||'').toUpperCase();
 const minAge=ageSpec.match(/\b([2345])YO\+/);
 const exactAge=ageSpec.match(/\b([2345])YO(?!\+)/);
 if(minAge && age<Number(minAge[1]))blocks.push('BLOCK_AGE_INELIGIBLE');
 else if(!minAge&&exactAge&&age!==Number(exactAge[1]))blocks.push('BLOCK_AGE_INELIGIBLE');
 if(/FILL(Y|IES)|MARES|F&M/.test(ageSpec) && !['MARE','FILLY'].includes(h.sex))blocks.push('BLOCK_SEX_INELIGIBLE');
 if(matchISO(target)){
   for(const e of arr(observations.existingStarts)){
     if(e.horseId!==horseId || !matchISO(normalizeDate(e.date)))continue;
     const gap=day(target)-day(normalizeDate(e.date));
     if(gap===0)blocks.push('BLOCK_CONFLICTING_STARTS');
     else if(gap>0&&gap<=3)blocks.push('BLOCK_SHORT_REST_HARD');
     else if(gap>3&&gap<=21)holds.push('HOLD_POSTRACE_RECOVERY');
   }
   const last=normalizeDate(observations.lastStartDate);
   if(matchISO(last)){
     const gap=day(target)-day(last);
     if(gap<0)blocks.push('BLOCK_RACE_BEFORE_LAST_START');
     if(gap===0)blocks.push('BLOCK_CONFLICTING_STARTS');
     if(gap>0&&gap<=3)blocks.push('BLOCK_SHORT_REST_HARD');
     if(gap>3&&gap<=21)holds.push('HOLD_POSTRACE_RECOVERY');
   }
 }
 if(observations.meetOpen===false)blocks.push('BLOCK_MEET_CLOSED');
 else if(observations.meetOpen!==true)holds.push('HOLD_MEET_OPEN_CONFIRMATION');
 if(observations.ownerConsent===false)blocks.push('BLOCK_OWNER_REFUSAL');
 else if(observations.ownerConsent!==true)holds.push('HOLD_OWNER_AUTHORIZATION');
 if(observations.medicalClearance===false)blocks.push('BLOCK_HEALTH_RESTRICTION');
 else if(observations.medicalClearance!==true)holds.push('HOLD_CURRENT_HEALTH_OBSERVATION');
 if(observations.recentWorksVerified!==true)holds.push('HOLD_CURRENT_TRAINING_EVIDENCE');
 if(observations.raceConditionCompatible===false)blocks.push('BLOCK_RACE_CONDITIONS');
 else if(observations.raceConditionCompatible!==true)holds.push('HOLD_SURFACE_DISTANCE_CLASS_FIT');
 if(observations.fundingAvailable===false)blocks.push('BLOCK_INSUFFICIENT_FINANCE');
 else if(observations.fundingAvailable!==true)holds.push('HOLD_FINANCE');
 if(observations.stallCapacityAccepted===false)blocks.push('BLOCK_NO_STALL_CAPACITY');
 else if(observations.stallCapacityAccepted!==true)holds.push('HOLD_STALL_CAPACITY');
 if(observations.jockeyBookingConflict===true)blocks.push('BLOCK_JOCKEY_DOUBLE_BOOK');
 else if(observations.jockeyBookingVerified!==true)holds.push('HOLD_JOCKEY_ASSIGNMENT');
 if(observations.playerOrAiInterest==='PLAYER_ONLY_OVERRIDE')blocks.push('BLOCK_PLAYER_EXCEPTION');
 const currentTrackId=observations.currentTrackId||h.openingStable.trackId;
 if(currentTrackId!==r.trackId){
    const ship=observations.verifiedShipping;
    if(!ship||ship.approved!==true||ship.fromTrackId!==currentTrackId||ship.toTrackId!==r.trackId)
      blocks.push('BLOCK_UNSUPPORTED_TRAVEL');
    else{
      const arrival=normalizeDate(ship.arrivalDate);
      if(!matchISO(arrival)||!matchISO(target)||day(arrival)>=day(target))blocks.push('BLOCK_UNSUPPORTED_TRAVEL');
      else{
        const from=tracks.get(currentTrackId),to=tracks.get(r.trackId);
        if(!from||!to)blocks.push('BLOCK_UNRECOGNIZED_TRAVEL_NODE');
        if(from && to && (from.country!==to.country||from.region!==to.region))
          holds.push('HOLD_POST_SHIPPING_RECOVERY_REVIEW');
        if(from&&to&&from.country!==to.country&&ship.borderClearance!==true)
          blocks.push('BLOCK_INTERNATIONAL_CLEARANCE');
      }
    }
 }
 if(observations.alreadyEntered===true)blocks.push('BLOCK_DUPLICATE_ENTRY');
 const dedupe=x=>[...new Set(x)];
 const b=dedupe(blocks),hld=dedupe(holds);
 return {
  status:b.length?'BLOCKED':hld.length?'HOLD':'ELIGIBLE_FOR_ENTRY_REVIEW',
  blocks:b,holds:hld,horseId,raceId,
  entryCommitted:false,resultGenerated:false,shippingCommitted:false,
  rule:'PREPLAY_01_TO_12_AND_CIG_001_TO_009; IDENTICAL_PLAYER_AI_GATES; NO_OUTCOME_PRECOMMITMENT'
 };
}
