import test from 'node:test';
import assert from 'node:assert/strict';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {buildFoundingAncestry1999,FOUNDING_ANCESTRY_SCHEMA}
 from '../public/1999/engine/founding-ancestry-1999.mjs';

const world=createFounding1999Universe({seed:19990101});
const tree=world.foundingAncestry;
const livingIds=new Set([...world.sourceHorses,...world.sourceStallions,
 ...world.sourceBroodmares].map(x=>x.id));
const historicalIds=new Set(world.historicalHorses.map(x=>x.id));
const recordIds=new Set(tree.records.map(x=>x.id));

test('only directly selected founding stock and attached historical horses may seed old pedigree closure',()=>{
 assert.equal(tree.schema,FOUNDING_ANCESTRY_SCHEMA);
 assert.equal(tree.generations,5);
 assert.equal(world.counts.worldHorses,73);
 assert.equal(tree.livingRootCount,livingIds.size);
 assert.equal(tree.audit.rootCount,new Set([...livingIds,...historicalIds]).size);
 assert.ok(tree.records.length>world.counts.worldHorses);
 assert.equal(tree.records.length,recordIds.size);
 assert.ok([...livingIds].every(id=>recordIds.has(id)));
 assert.ok([...historicalIds].every(id=>recordIds.has(id)));
 assert.ok(tree.records.every(row=>row.depth>=0&&row.depth<=5));
 assert.ok(tree.records.every(row=>row.activeIn1999===livingIds.has(row.id)));
 assert.equal(tree.audit.unselectedHistoricPopulationIsNotPlayable,true);
});

test('each historic pedigree edge is by source parent ID, not a fabricated sale or champion result',()=>{
 assert.ok(tree.edges.length>0);
 assert.ok(tree.edges.every(e=>recordIds.has(e.childId)&&recordIds.has(e.parentId)));
 assert.ok(tree.edges.every(e=>['SIRE','DAM'].includes(e.role)));
 assert.ok(tree.edges.every(e=>['EXACT_HISTORICAL_PARENT_ID','EXACT_SOURCE_PARENT_ID_TO_SELECTED_HISTORICAL_ROOT'].includes(e.source)));
 assert.ok(tree.missingNamedParents.every(p=>!recordIds.has(p.id)));
 assert.ok(tree.missingNamedParents.every(p=>p.referredBy.length>=1));
 assert.ok(tree.records.filter(x=>!x.activeIn1999).every(x=>x.sourceKind!=='GENERATED_TEST_HORSE'));
 assert.ok(tree.records.some(x=>x.name==='Gospel Truth'||x.name==='Dominion Nails'));
 assert.equal(tree.audit.historicResultsUnmodified,true);
});

test('ancestry bridge deterministic under same selected roots, no background 325k records leaked',()=>{
 const another=buildFoundingAncestry1999({livingHorses:[...world.sourceHorses,
  ...world.sourceStallions,...world.sourceBroodmares],
  historicalHorses:world.historicalHorses,generations:5});
 assert.deepEqual(another,tree);
 assert.ok(tree.records.every(x=>!String(x.id).startsWith('H-TEST-')));
 assert.ok(!world.sourceHorses.some(x=>x.id.startsWith('H-TEST-')));
 assert.throws(()=>buildFoundingAncestry1999({generations:9}),/one to eight/);
});

test('unqualified 1999 API calls cannot accidentally reopen the retired 325k universe',()=>{
 const overview=readLocal1999World('/api/1999/sim/overview');
 assert.equal(overview.mode,'FOUNDING_1999');
 assert.equal(overview.counts.horses,0);
 assert.equal(overview.counts.worldHorses,73);
 assert.equal(readLocal1999World('/api/1999/sim/world-horse-directory?limit=1').total,73);
 const historic=readLocal1999World('/api/1999/sim/founding-ancestry?id=H-1970-000001');
 assert.equal(historic.horse?.name,'Gospel Truth');
 assert.equal(historic.horse?.activeIn1999,false);
 assert.ok(historic.parents.length>0);
 assert.equal(historic.historicalResultsUnmodified,true);
 const outside=readLocal1999World('/api/1999/sim/founding-ancestry?id=H-TEST-999999');
 assert.equal(outside.horse,null);
 assert.equal(outside.status,'HORSE_NOT_CONNECTED_TO_FOUNDING_ORGANIZATIONS');
 assert.throws(()=>readLocal1999World('/api/1999/sim/founding-ancestry?id='),/Exact founding/);
});
