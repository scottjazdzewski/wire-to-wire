import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareerDelta,recoverCareerDelta,encodeCareerSave,decodeCareerSave,
 packCareerFile,unpackCareerFile,COMPACT_CAREER_SCHEMA} from '../public/1999/engine/compact-career.mjs';

const profile={schema:'WTW_WORLD_PROFILE_V1',seed:19990101,population:73,
 mode:'FOUNDING_1999',generator:'WTW_1999_FOUNDING_WORLD_V1'};
const baseline=()=>({
 version:'WTW_1999_FOUNDING_CAREER_V1',schema:'WTW_1999_FOUNDING_CAREER_V1',
 date:'1999-01-01',currentCase:'opening-stable',turn:0,
 worldAnchor:{schema:'WTW_1999_FOUNDING_CAREER_V1',startDate:'1999-01-01',
  seed:19990101,mode:'FOUNDING_1999',population:73,
  worldProfile:profile,historicalResultsImmutable:true},
 horseState:{},ownerState:{},staffState:{},finances:{},decisionLog:[],followUps:[],
 ephemeralTestKey:'to remove'
});

test('compact save roundtrips sparse game changes, Unicode, arrays and deletions',async()=>{
 const initial=baseline(),played=structuredClone(initial);
 delete played.ephemeralTestKey;
 played.date='1999-09-17';played.turn=259;
 played.horseState['H-UNIT-SESSION-0001']={
  status:'IN_TRAINING',reputation:85,notes:'Café del Mar — vitória'};
 played.ownerState['O-000011']={cash:1523125,trust:66};
 played.decisionLog.push({date:'1999-09-17',type:'RACE',raceId:'R-00001',position:2});
 const delta=createCareerDelta(played,initial,profile);
 assert.equal(delta.schema,COMPACT_CAREER_SCHEMA);
 assert.ok(!JSON.stringify(delta).includes('unapproved bulk horse profiles'));
 assert.deepEqual(recoverCareerDelta(delta,initial),played);
 const encoded=await encodeCareerSave(played,initial,profile);
 const binary=packCareerFile(encoded);
 assert.ok(binary.length<10*1024,'One career with a few mutations should stay below 10 KB');
 const file=unpackCareerFile(binary);
 assert.deepEqual(await decodeCareerSave(file,initial),played);
});
test('a damaged portable career is rejected, not silently loaded',async()=>{
 const saved=await encodeCareerSave(baseline(),baseline(),profile);
 const packed=packCareerFile(saved),bad=packed.slice();
 bad[bad.length-1]^=0x1;
 await assert.rejects(()=>decodeCareerSave(unpackCareerFile(bad),baseline()),/checksum mismatch/);
 assert.throws(()=>unpackCareerFile(new Uint8Array([1,2,3,4,5,6])),/Invalid|Not a/);
});
test('world seed, mode and population are pinned to the save',async()=>{
 const initial=baseline(),wrong=structuredClone(initial);
 wrong.worldAnchor.seed=12345;
 assert.throws(()=>createCareerDelta(wrong,initial,profile),/seed\/mode/);
 const encoded=await encodeCareerSave(initial,initial,profile);
 const tampered={header:{...encoded.header,world:{...profile,population:75000}},bytes:encoded.bytes};
 await assert.rejects(()=>decodeCareerSave(tampered,initial),/metadata/);
});
test('no entire-world snapshot is serialized when the save is unchanged',async()=>{
 const base=baseline();
 const encoded=await encodeCareerSave(base,base,profile);
 const restored=await decodeCareerSave(encoded,base);
 assert.deepEqual(restored,base);
 assert.ok(encoded.bytes.length<2048,'Seed-only save must not materialize discarded test-world profiles');
});
