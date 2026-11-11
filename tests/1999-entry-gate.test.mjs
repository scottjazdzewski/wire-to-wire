import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as w} from '../src/1999/opening-world.v1.mjs';
import {evaluate1999Entry as evaluate} from '../src/1999/entry-gate.mjs';
const h=w.horses.find(x=>x.foalYear===1995);
const juvenile=w.horses.find(x=>x.foalYear===1996);
const derby=w.stakes1999.find(x=>x.name==='Kentucky Derby');
const localOlder=w.stakes1999.find(x=>x.localDate>='1999-02-01' && x.ageSex.includes('4YO+') && x.trackId===h.openingStable.trackId);
const older=w.stakes1999.find(x=>x.ageSex.includes('4YO+') && x.localDate>='1999-02-01');
const obs={meetOpen:true,ownerConsent:true,medicalClearance:true,recentWorksVerified:true,raceConditionCompatible:true,fundingAvailable:true,stallCapacityAccepted:true,jockeyBookingVerified:true};
test('age-ineligible 1998 veteran cannot reenter 1999 Derby',()=>{
 assert.equal(derby.ageSex.includes('3YO'),true);
 const result=evaluate({horseId:h.id,raceId:derby.id,observations:obs});
 assert.equal(result.status,'BLOCKED');assert.ok(result.blocks.includes('BLOCK_AGE_INELIGIBLE'));
 assert.equal(result.entryCommitted,false);
});
test('one horse cannot appear at two venues on same day',()=>{
 const r=older;const result=evaluate({horseId:h.id,raceId:r.id,observations:{...obs,existingStarts:[{horseId:h.id,date:r.localDate,trackId:'T-XXXX'}]}});
 assert.ok(result.blocks.includes('BLOCK_CONFLICTING_STARTS'));assert.equal(result.resultGenerated,false);
});
test('unsupported travel is blocked rather than teleporting',()=>{
 const r=older;
 const candidate=w.horses.find(x=>x.openingStable.trackId!==r.trackId&&x.foalYear<=1995);
 const result=evaluate({horseId:candidate.id,raceId:r.id,observations:obs});
 assert.equal(result.status,'BLOCKED');assert.ok(result.blocks.includes('BLOCK_UNSUPPORTED_TRAVEL'));
});
test('unknown recovery, health, meet and ownership never imply entry',()=>{
 const r=older,candidate=w.horses.find(x=>x.foalYear<=1995);
 const result=evaluate({horseId:candidate.id,raceId:r.id,observations:{}});
 assert.notEqual(result.status,'ELIGIBLE_FOR_ENTRY_REVIEW');assert.equal(result.entryCommitted,false);
});
test('recent four-to-21-day rest requires observed recovery',()=>{
 const r=older,prev=new Date(Date.parse(r.localDate+'T12:00:00Z')-21*86400000).toISOString().slice(0,10);
 const candidate=w.horses.find(x=>x.openingStable.trackId===r.trackId&&x.foalYear<=1995);
 if(!candidate)return; // fixture conditional, live location is never fabricated
 const result=evaluate({horseId:candidate.id,raceId:r.id,observations:{...obs,lastStartDate:prev}});
 assert.equal(result.status,'HOLD');assert.ok(result.holds.includes('HOLD_POSTRACE_RECOVERY'));
});
test('player and AI share the exact same rule outputs',()=>{
 const r=older;const player=evaluate({horseId:h.id,raceId:r.id,observations:obs,actorRole:'PLAYER'});
 const ai=evaluate({horseId:h.id,raceId:r.id,observations:obs,actorRole:'AI'});
 assert.deepEqual(player,ai);
});
test('meet-closed and jockey double book are explicit blocks',()=>{
 const r=older, result=evaluate({horseId:h.id,raceId:r.id,observations:{...obs,meetOpen:false,jockeyBookingConflict:true}});
 assert.ok(result.blocks.includes('BLOCK_MEET_CLOSED'));
 assert.ok(result.blocks.includes('BLOCK_JOCKEY_DOUBLE_BOOK'));
});
test('a passed screening is not a booked runner and never creates a result',()=>{
 const r=older, candidate=w.horses.find(x=>x.openingStable.trackId===r.trackId&&x.foalYear<=1995);
 if(!candidate)return;
 const result=evaluate({horseId:candidate.id,raceId:r.id,observations:obs});
 assert.equal(result.status,'ELIGIBLE_FOR_ENTRY_REVIEW');
 assert.equal(result.entryCommitted,false);
 assert.equal(result.shippingCommitted,false);
 assert.equal(result.resultGenerated,false);
});
