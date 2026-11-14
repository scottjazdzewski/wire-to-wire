import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createFoundingSourceBase1999} from '../public/1999/engine/founding-source-base-1999.mjs';
import {trackProgram1999} from '../public/next/1999-track-program.mjs';
test('118 immutable racecourse identities remain accessible when their active status changes',()=>{
 const w=createFoundingSourceBase1999();
 assert.equal(w.counts.tracks,118);
 const tracks=Array.from({length:w.counts.tracks},(_,i)=>w.trackAt(i));
 assert.equal(new Set(tracks.map(x=>x.id)).size,118);
 const retired=tracks.filter(x=>trackProgram1999(x.id)?.trackOperating!=='OPEN_1999');
 assert.equal(retired.length,3);
 for(const track of retired){
  assert.equal(track.playableIn1999,false);
  assert.equal(track.operating,'HISTORICAL_ONLY');
  assert.equal(track.racing.racesPerCard,0);
  const index=tracks.findIndex(t=>t.id===track.id);
  assert.deepEqual(w.conditionBook('1999-06-01',index),[]);
 }
 assert.equal(tracks.filter(t=>t.playableIn1999).length,115);
 assert.ok(w.sourceStakes.every(r=>trackProgram1999(r.trackId)?.trackOperating==='OPEN_1999'));
});
