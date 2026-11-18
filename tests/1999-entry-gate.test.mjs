import test from 'node:test';
import assert from 'node:assert/strict';
import {openingWorld1999 as world} from '../src/1999/opening-world.v1.mjs';
import {evaluate1999Entry} from '../src/1999/entry-gate.mjs';

const race=world.stakes1999.find(r=>r.name==='Kentucky Derby');
const claimedHorseId='H-PREVIOUS-GENERATED-0001';
const everyGreenLight={
 meetOpen:true,ownerConsent:true,medicalClearance:true,
 recentWorksVerified:true,raceConditionCompatible:true,
 fundingAvailable:true,stallCapacityAccepted:true,
 jockeyBookingVerified:true,existingStarts:[],alreadyEntered:false
};
test('clean 1999 registry has no starting horses and no automatic entries',()=>{
 assert.equal(world.horses.length,0);
 assert.ok(race?.id);
 const r=evaluate1999Entry({horseId:claimedHorseId,raceId:race.id,
  observations:everyGreenLight});
 assert.equal(r.status,'BLOCKED');
 assert.deepEqual(r.blocks,['BLOCK_NONEXISTENT_HORSE']);
 assert.equal(r.entryCommitted,false);
 assert.equal(r.resultGenerated,false);
});
test('old generated IDs cannot return via player, AI or all-green observations',()=>{
 for(const role of ['PLAYER','AI']){
  const r=evaluate1999Entry({horseId:'H-1997-030001',raceId:race.id,
    observations:everyGreenLight,actorRole:role});
  assert.equal(r.status,'BLOCKED');
  assert.ok(r.blocks.includes('BLOCK_NONEXISTENT_HORSE'));
  assert.equal(r.entryCommitted,false);
  assert.equal(r.resultGenerated,false);
 }
});
test('invalid race IDs cannot create a real race or result',()=>{
 const r=evaluate1999Entry({horseId:claimedHorseId,raceId:'STK-NOT-APPROVED',
  observations:everyGreenLight});
 assert.equal(r.status,'BLOCKED');
 assert.ok(r.blocks.includes('BLOCK_NONEXISTENT_STAKES'));
 assert.ok(r.blocks.includes('BLOCK_NONEXISTENT_HORSE'));
});
test('identical player/AI gate applies in the empty approved world',()=>{
 const args={horseId:claimedHorseId,raceId:race.id,observations:everyGreenLight};
 assert.deepEqual(
  evaluate1999Entry({...args,actorRole:'PLAYER'}),
  evaluate1999Entry({...args,actorRole:'AI'})
 );
});
