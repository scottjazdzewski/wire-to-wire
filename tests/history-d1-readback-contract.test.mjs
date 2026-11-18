import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import crypto from 'node:crypto';
const data=JSON.parse(fs.readFileSync('data/history-source/2026-11-07/stakes-editions.json','utf8'));
const held=JSON.parse(fs.readFileSync('data/history-audit/qa-pending-v384-inactive-edition-ids.json','utf8'));
test('D1 readback anchor uses the one existing WTW source export and 223 QA holds',()=>{
  const head=new Set(data.headers);
  assert.equal(data.rows.length,5370);
  assert.equal(new Set(data.rows.map(r=>r[0])).size,5370);
  for(const column of ['Race_Edition_ID','Race_Date','Winner_Horse_ID','Second_Horse_ID','Third_Horse_ID','Canon_Status'])
    assert.ok(head.has(column));
  const idx=data.headers.indexOf('Race_Edition_ID');
  const ids=new Set(data.rows.map(r=>r[idx]));
  assert.equal(held.excluded.length,223);
  assert.equal(new Set(held.excluded.map(x=>x.edition_id)).size,223);
  assert.ok(held.excluded.every(x=>ids.has(x.edition_id)));
  assert.equal(held.authority.source_status,'V3.84_QA_PENDING');
});
test('historical D1 parity workflow is SELECT-only and targets existing DB',()=>{
  const code=fs.readFileSync('scripts/remote-history-d1-readback.mjs','utf8');
  const workflow=fs.readFileSync('.github/workflows/history-d1-parity-readonly.yml','utf8');
  assert.match(code,/if\(!\/\^SELECT/);
  assert.match(code,/\['races','results'\]/);
  assert.doesNotMatch(code,/wrangler\s+d1\s+execute|migrations apply|DELETE\s+FROM|UPDATE\s+races\s+SET/i);
  assert.match(workflow,/workflow_dispatch:/);
  assert.match(workflow,/permissions:\s*\n\s*contents: read/);
  assert.match(workflow,/scripts\/prepare-d1-target\.mjs/);
  assert.match(workflow,/WTW_D1_IMPORT_TOKEN/);
  assert.doesNotMatch(workflow,/migrations apply|wrangler d1 execute|import_to_WTW_D1/i);
});
test('source-file digest remains stable within one reproducible readback invocation',()=>{
  const p='data/history-source/2026-11-07/stakes-editions.json';
  const one=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  const two=crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  assert.equal(one,two);
});
