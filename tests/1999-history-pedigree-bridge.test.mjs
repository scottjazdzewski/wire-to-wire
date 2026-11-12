import test from 'node:test';
import assert from 'node:assert/strict';
import {HISTORICAL_HORSES} from '../public/1999/engine/historical-horse-index.mjs';
import {historicalHorseById,historicalPedigree,readLocal1999World} from '../public/1999/engine/local-api.mjs';

test('history graph imports full ID-locked master, no duplicates',()=>{
 assert.equal(HISTORICAL_HORSES.length,3856);
 assert.equal(new Set(HISTORICAL_HORSES.map(row=>row[0])).size,3856);
 assert.equal(historicalHorseById('H-1811-000001').name,'Banneret');
});
test('historical lineage retains ID and source identity without inventing parents',()=>{
 const h=historicalHorseById('H-1937-000001');
 assert.ok(h);
 const graph=historicalPedigree(h.id,2);
 assert.equal(graph.id,h.id);
 assert.equal(graph.name,h.name);
 assert.equal(graph.source,'HISTORICAL_HORSE_MASTER_V3_3');
 assert.equal(historicalHorseById('H-9999-999999'),null);
 assert.equal(historicalPedigree('H-9999-999999').source,'UNRESOLVED_HISTORICAL_PARENT_ID');
});
test('browser API serves historical horse and pedigree read-only',()=>{
 const single=readLocal1999World('/api/1999/history/horse?id=H-1937-000001');
 const ancestry=readLocal1999World('/api/1999/history/pedigree?id=H-1937-000001&depth=2');
 assert.equal(single.horse.id,'H-1937-000001');
 assert.equal(ancestry.pedigree.name,single.horse.name);
 assert.equal(single.source,'HISTORICAL_HORSE_MASTER_V3_3');
});
test('1999 source-locked opening horses retain parent IDs independently of historical import',()=>{
 const opening=readLocal1999World('/api/1999/horses?limit=100');
 assert.equal(opening.total,267);
 const horse=opening.items.find(h=>h.id==='H-1997-030001');
 assert.ok(horse);
 assert.equal(horse.sireId,'H-1987-000001');
 assert.equal(horse.damId,'H-1989-020001');
 // Opening production parents can live outside the pre-1999 historical master.
 // Never fabricate a parent identity to satisfy a pedigree lookup.
 const sire=historicalPedigree(horse.sireId,1);
 const dam=historicalPedigree(horse.damId,1);
 assert.equal(sire.id,horse.sireId);
 assert.equal(dam.id,horse.damId);
 assert.ok(sire.name||sire.source==='UNRESOLVED_HISTORICAL_PARENT_ID');
 assert.ok(dam.name||dam.source==='UNRESOLVED_HISTORICAL_PARENT_ID');
});
