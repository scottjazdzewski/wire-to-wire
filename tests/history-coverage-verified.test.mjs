import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {historicalSourceStatus,api} from '../src/worker.js';
const app=fs.readFileSync('public/app.js','utf8');
test('history coverage no longer claims superseded v3.67 and 5,192 active editions',()=>{
  assert.doesNotMatch(app,/Loaded archive and current master differ/);
  assert.doesNotMatch(app,/The site still uses an older archive snapshot/);
  assert.doesNotMatch(app,/The current Drive master is v3\.67/);
  assert.doesNotMatch(app,/1,550 shared editions differ/);
  assert.doesNotMatch(app,/ACTIVE EDITIONS<\/small><strong>5,192/);
});
test('history source labels require verified protected D1 response and still show QA pending',()=>{
  assert.match(app,/historySource:live\.historySource/);
  assert.match(app,/state\.mode==='D1_CONNECTED'/);
  assert.match(app,/D1_PARITY_VERIFIED_2026_11_10__SOURCE_QA_PENDING/);
  assert.match(app,/SOURCE QA PENDING/);
  assert.match(app,/source-reconciliation/);
  assert.match(app,/source-delta-grid/);
  assert.match(app,/source-master-grid/);
  assert.match(app,/data-page="sources"/);
  assert.match(app,/data-page="changes"/);
});
test('API distinguishes exact stored-row readback from unapproved historical source claims',()=>{
  assert.equal(historicalSourceStatus.result_delta_status,'D1_PARITY_VERIFIED_2026_11_10__SOURCE_QA_PENDING');
  assert.equal(historicalSourceStatus.verification.stored_edition_count,5370);
  assert.equal(historicalSourceStatus.verification.active_edition_count,5147);
  assert.equal(historicalSourceStatus.verification.inactive_edition_count,223);
  assert.equal(historicalSourceStatus.verification.stored_top_three_count,15561);
  assert.equal(historicalSourceStatus.verification.active_top_three_count,15441);
  assert.equal(historicalSourceStatus.verification.stored_race_field_differences,0);
  assert.equal(historicalSourceStatus.verification.stored_result_id_differences,0);
  assert.match(historicalSourceStatus.warning,/QA PENDING/);
});
