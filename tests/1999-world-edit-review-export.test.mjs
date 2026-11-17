import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildWorldEditReviewExport,WORLD_EDIT_REVIEW_SCHEMA}
 from '../public/next/1999-world-edit-review-export.mjs';
const manifest={worldId:'FICTIONAL-1999-TEST',seed:19990101,
 horseCount:300000,personCount:75724,targetOpeningHorses:300000};
const world={authority:{sha256:'a'.repeat(64)}};
const run={run_id:'WTW-RUN-1999-PLAYER',clock:{date:'1999-05-29'}};
test('export user-approved starting-world review records from saved career deltas',()=>{
 const edits={schema:'WTW_CAREER_WORLD_EDITS_V1',byId:{
  'track:T-001':{name:'New Course'},
  'horse:H-FICTIONAL-1999-FOURYEAROLDRUNNERS-0000001':{name:'Great Crossing'},
  'person:P-001':{biography:'Retired in 2005'}
 }};
 const data=buildWorldEditReviewExport({manifest,world,run,worldEdits:edits,
  createdAt:'2026-11-17T14:30:00.000Z'});
 assert.equal(data.schema,WORLD_EDIT_REVIEW_SCHEMA);
 assert.equal(data.recordCount,3);
 assert.equal(data.source.horseCount,300000);
 assert.equal(data.source.snapshotSha256,world.authority.sha256);
 assert.equal(data.source.careerRunId,run.run_id);
 assert.deepEqual(data.records.map(x=>x.kind),['horse','person','track']);
 assert.equal(data.records[0].fields.name,'Great Crossing');
 assert.equal(data.mediaIncluded,false);assert.equal(data.careerProgressIncluded,false);
 assert.equal(edits.byId['horse:H-FICTIONAL-1999-FOURYEAROLDRUNNERS-0000001'].name,
  'Great Crossing','export may not mutate current career data');
});
test('refuses mismatched or malformed saved-world edits, never exports executable instructions',()=>{
 const ok={manifest,world,run,createdAt:'2026-11-17T14:30:00.000Z'};
 assert.throws(()=>buildWorldEditReviewExport({...ok,worldEdits:{schema:'BAD',byId:{}}}),
  /valid saved fictional industry career/);
 assert.throws(()=>buildWorldEditReviewExport({...ok,worldEdits:{
  schema:'WTW_CAREER_WORLD_EDITS_V1',byId:{'unknown:IDENTITY':{name:'Bad'}}}}),
  /malformed entity reference/);
 assert.throws(()=>buildWorldEditReviewExport({...ok,worldEdits:{
  schema:'WTW_CAREER_WORLD_EDITS_V1',byId:{'horse:H-01':{}}}}),
  /malformed entity reference/);
});
test('career manager exposes review export and does not confuse export with automatic promotion',()=>{
 const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
 assert.match(manager,/export-world-changes-review/);
 assert.match(manager,/buildWorldEditReviewExport/);
 assert.match(manager,/WORLD CHANGES FOR CHATGPT/);
 assert.match(manager,/No game source was changed automatically/);
 assert.match(manager,/export-shared-career/);
});
