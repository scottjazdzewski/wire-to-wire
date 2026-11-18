import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 attributeDefinitions,requiredAttributeKeys,checkAttributeCatalog,
 auditGeneratedAttributeCoverage,normalizeObservation
} from '../src/game/attribute-contract.js';

const catalog=JSON.parse(readFileSync(new URL('../public/assets/game/attribute-catalog.v1.json',import.meta.url),'utf8'));

test('single versioned horse and racing-person attribute authority has valid unique definitions',()=>{
 const c=checkAttributeCatalog(catalog);
 assert.deepEqual(c.errors,[],c.errors.join('; '));
 assert.equal(c.ok,true);
 assert.deepEqual(Object.keys(catalog.horse_categories),[
   'Speed & Pace','Surface & Environment','Physical & Biometric','Mental & Class','Current Condition'
 ]);
 assert.ok(requiredAttributeKeys(catalog,'horses').includes('raw_speed'));
 assert.ok(requiredAttributeKeys(catalog,'horses').includes('sloppy_track_aptitude'));
 assert.ok(requiredAttributeKeys(catalog,'horses').includes('stride_frequency'));
 assert.ok(requiredAttributeKeys(catalog,'horses').includes('competitive_desire'));
});

test('every human has common traits, with role-specific abilities and valid combined roles',()=>{
 const trainer=requiredAttributeKeys(catalog,'people',['trainer']);
 const rider=requiredAttributeKeys(catalog,'people',['jockey']);
 assert.ok(trainer.includes('planning')&&trainer.includes('conditioning'));
 assert.ok(rider.includes('planning')&&rider.includes('traffic_navigation'));
 assert.ok(!trainer.includes('traffic_navigation'),'Do not force jockey-specific skills on trainers');
 const dual=requiredAttributeKeys(catalog,'people',['trainer','breeder']);
 assert.ok(dual.includes('conditioning')&&dual.includes('mating_planning'));
 assert.equal(dual.length,new Set(dual).size,'Dual roles must not repeat shared traits');
 for(const role of ['owner','breeder','farm_manager','veterinarian','bloodstock_agent','farrier','racing_secretary']){
   assert.ok(requiredAttributeKeys(catalog,'people',[role]).length>catalog.person_common.length,role+' must have specialties');
 }
 assert.throws(()=>requiredAttributeKeys(catalog,'people',['nonexistent']),/roles/);
 assert.equal(catalog.person_roles.groom,undefined);
 assert.equal(catalog.person_roles.exercise_rider,undefined);
});

test('generator coverage audit catches missing ability values but does not create any',()=>{
 const required=attributeDefinitions(catalog,'horses').filter(x=>x.scope==='latent').map(x=>x.key);
 const missing=auditGeneratedAttributeCoverage({catalog,entityGroup:'horses',latent:{}});
 assert.equal(missing.ok,false);
 assert.deepEqual(missing.missing,required);
 const incompleteFixture=Object.fromEntries(required.map(key=>[key,'TEST_ONLY']));
 const invalid=auditGeneratedAttributeCoverage({catalog,entityGroup:'horses',latent:incompleteFixture});
 assert.equal(invalid.ok,false);
 assert.deepEqual(invalid.invalid,required,'Trait coverage alone is insufficient; hidden ability values must be finite numbers');
 const syntheticFixture=Object.fromEntries(required.map(key=>[key,0.5]));
 const complete=auditGeneratedAttributeCoverage({catalog,entityGroup:'horses',latent:syntheticFixture});
 assert.equal(complete.ok,true);
 assert.equal(complete.expected,required.length);
 assert.deepEqual(Object.keys(syntheticFixture),required);
 assert.equal(catalog.horse_categories['Speed & Pace'][0].key,'raw_speed');
});

test('latent abilities remain unseen; unknown scouting never becomes average or zero',()=>{
 const unassessed=normalizeObservation({attribute_key:'raw_speed',status:'unassessed'});
 assert.equal(unassessed.estimate,null);
 assert.equal(unassessed.confidence,null);
 assert.equal(unassessed.observer_id,null);
 assert.deepEqual(unassessed.evidence_refs,[]);
 assert.throws(()=>normalizeObservation({attribute_key:'raw_speed',status:'unassessed',estimate:50}),/cannot show a value/);
 assert.throws(()=>normalizeObservation({attribute_key:'raw_speed',status:'estimated'}),/need an explicitly sourced value/);
 const report=normalizeObservation({attribute_key:'raw_speed',status:'estimated',estimate:12,confidence:'low',observer_id:'P-TEST',observed_at:'1999-05-01',evidence_refs:['WORKOUT-TEST']});
 assert.equal(report.estimate,12);
 assert.equal(report.confidence,'low');
 assert.equal(report.observer_id,'P-TEST');
 assert.deepEqual(report.evidence_refs,['WORKOUT-TEST']);
});

test('catalog never contains horses, people, per-entity ratings, or generated genetic values',()=>{
 assert.equal(catalog.rules.no_population.includes('does not generate or assign values'),true);
 for(const banned of ['horse_records','people_records','runners','entity_ratings','generated_values','horseState','staffState']){
   assert.equal(Object.hasOwn(catalog,banned),false,banned+' should not be a second registry');
 }
 assert.ok(catalog.rules.latent_visibility.includes('never directly exposed'));
 assert.ok(catalog.rules.range.includes('has not yet been approved'));
});
