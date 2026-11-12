import test from 'node:test';
import assert from 'node:assert/strict';
import {canonicalRaceResult,packRaceMonth,unpackRaceMonth,
 encodeRaceMonth,decodeRaceMonth} from '../public/1999/engine/compact-race-results.mjs';

const race=(number,month='1999-01')=>({
 id:'R-TEST-'+String(number).padStart(6,'0'),
 date:month+'-'+String(1+number%28).padStart(2,'0'),
 trackId:'TRACK-'+number%15,surface:number%5===0?'TURF':'DIRT',
 distanceYards:1100+number%7*220,purseCents:2500000,
 conditionsId:'ALLOWANCE-'+number%10,provenance:'SIMULATED_1999_PLUS',
 starters:Array.from({length:10},(_,j)=>({
  horseId:'H-TEST-'+((number*7+j)%12000),jockeyId:'J-TEST-'+((number+j)%200),
  trainerId:'T-TEST-'+((number*3+j)%350),finish:j+1,
  earningsCents:j===0?1500000:j===1?500000:j===2?250000:0
 }))
});
test('monthly archive retains every starter, finish and purse payment without score drift',async()=>{
 const races=Array.from({length:1000},(_,i)=>race(i));
 const packed=packRaceMonth('1999-01',races);
 assert.equal(packed.races.length,1000);
 assert.equal(packed.starts.length,10000);
 const restored=unpackRaceMonth(packed);
 assert.equal(restored.length,1000);
 for(let i=0;i<races.length;i++){
  const original=canonicalRaceResult(races[i]),actual=restored[i];
  assert.equal(actual.id,original.id);
  assert.equal(actual.date,original.date);
  assert.equal(actual.trackId,original.trackId);
  assert.equal(actual.distanceYards,original.distanceYards);
  assert.equal(actual.purseCents,original.purseCents);
  assert.deepEqual(actual.starters.map(x=>[
   x.horseId,x.jockeyId,x.trainerId,x.finish,x.earningsCents
  ]),original.starters);
 }
 const encoded=await encodeRaceMonth('1999-01',races);
 assert.equal(encoded.metadata.races,1000);
 assert.equal(encoded.metadata.starters,10000);
 assert.deepEqual((await decodeRaceMonth(encoded))[15].starters,restored[15].starters);
});
test('archive does not invent missing winners or permit repeated horses and race IDs',()=>{
 const a=race(1);a.starters[0].finish=2;
 assert.throws(()=>canonicalRaceResult(a),/no winner/);
 const b=race(2);b.starters[1].horseId=b.starters[0].horseId;
 assert.throws(()=>canonicalRaceResult(b),/Duplicate horse/);
 assert.throws(()=>packRaceMonth('1999-01',[race(2),race(2)]),/Duplicate race ID/);
 assert.throws(()=>packRaceMonth('1999-02',[race(2)]),/outside target month/);
});
test('an altered archive fails its mandatory integrity check',async()=>{
 const block=await encodeRaceMonth('1999-01',[race(12),race(13)]);
 const damaged={metadata:block.metadata,bytes:block.bytes.slice()};
 damaged.bytes[damaged.bytes.length-1]^=1;
 await assert.rejects(()=>decodeRaceMonth(damaged),/checksum mismatch/);
});

test('race facts cannot be silently reconstructed from rerunning new simulation code',()=>{
 const archived=packRaceMonth('1999-01',[race(5)]);
 const historical=unpackRaceMonth(archived)[0];
 assert.equal(historical.starters[0].finish,1);
 assert.equal(historical.starters[0].earningsCents,1500000);
 assert.equal(historical.provenance,'SIMULATED_1999_PLUS');
 assert.equal(archived.horses.length,10);
 assert.ok(archived.trainers.length<=10);
});
