import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {openingWorld1999 as source} from '../src/1999/opening-world.v1.mjs';

test('every 1999 horse belongs to exactly one owner, including all source-locked opening horses',()=>{
 const world=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
 const visited=new Set();
 const canonByOwner=new Map();
 for(const horse of source.horses)canonByOwner.set(horse.ownerId,(canonByOwner.get(horse.ownerId)||0)+1);
 for(let n=0;n<world.counts.owners;n++){
  const owner=world.ownerAt(n);
  const indexes=world.ownedHorseIndexes(owner.id);
  assert.equal(indexes.length,owner.portfolio.generatedHorseSlots+(canonByOwner.get(owner.id)||0),'count '+owner.id);
  for(const idx of indexes){
   assert.ok(idx>=0&&idx<world.counts.horses,owner.id+' bad horse index');
   assert.ok(!visited.has(idx),'duplicate horse index '+idx);
   visited.add(idx);
  }
 }
 assert.equal(visited.size,87500);
 for(const id of [source.organizations[0].id,source.organizations[10].id,'O-TEST-1999-00200','O-TEST-1999-03308']){
  for(const idx of world.ownedHorseIndexes(id).slice(0,25)){
   assert.equal(world.horseAt(idx).ownerId,id,'wrong owner for '+idx);
  }
 }
});

test('new owner-stable API pages exact indexed horses and preserves 1999 history',()=>{
 const id=source.organizations[10].id;
 const url='/api/1999/sim/owner-horses?seed=19990101&mode=CANON_ANCHORED_TEST&ownerId='+encodeURIComponent(id);
 const first=readLocal1999World(url+'&offset=0&limit=30');
 assert.ok(first.total>0);
 assert.ok(first.items.length>0&&first.items.length<=30);
 assert.ok(first.items.every(x=>x.ownerId===id));
 assert.ok(first.items.every(x=>!x.career?.results||x.no1999Results===true));
 const last=readLocal1999World(url+'&offset='+Math.max(0,first.total-25)+'&limit=25');
 assert.ok(last.items.every(x=>x.ownerId===id));
 assert.equal(first.recordsSource,'CANON_AND_TEST_OWNERSHIP_ROSTER');
});
