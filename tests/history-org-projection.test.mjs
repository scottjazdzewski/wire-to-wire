import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const script=path.join(root,'scripts/build-history-org-projection.mjs');
const source=path.join(root,'data/history-source/canon-registry-2026-11-10/organization-economic-history.json');
const sourceSnapshot=JSON.parse(fs.readFileSync(source,'utf8'));
function run(extraEnv={}){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-canon-org-test-'));
  const result=spawnSync(process.execPath,[script],{
    cwd:root,encoding:'utf8',
    env:{...process.env,WTW_HISTORY_ORG_SQL_DIR:dir,...extraEnv}
  });
  return {dir,result};
}
test('one existing Drive authority exports 108 distinct org IDs to staging SQL',()=>{
  const {dir,result}=run();
  assert.equal(result.status,0,result.stderr||result.stdout);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'history-org-manifest.json'),'utf8'));
  const sql=fs.readFileSync(path.join(dir,'30_history_org_profiles.sql'),'utf8');
  assert.equal(manifest.source.spreadsheet_id,'1Lhpe6DG1foQ2-zayQBg4bKpTtu4MP_itpM1zo2GRSEA');
  assert.equal(manifest.counts.organizations,108);
  assert.equal(manifest.counts.with_origin,108);
  assert.equal(manifest.counts.with_stakes_year_links,99);
  assert.equal((sql.match(/^INSERT INTO wtw_history_org_profiles /gm)||[]).length,108);
  assert.match(sql,/Kingsmere Farm/);
  assert.match(sql,/ELITE_HISTORIC_GOLD_STANDARD/);
  assert.match(sql,/MODEST_SLIPPAGE_FROM_PEAK__NOT_COLLAPSE/);
  assert.match(sql,/SOURCE_ONLY_OUTLINE_PENDING_APPROVAL/);
  assert.match(sql,/UNAPPROVED_ORIGIN_DETAILS/);
  assert.doesNotMatch(sql,/^\s*(?:INSERT INTO|UPDATE|DELETE FROM)\s+(?:races|results|entities|display_name_overrides|name_edit_audit|change_requests|change_audit)\b/gmi);
  assert.doesNotMatch(sql,/^\s*(?:DROP|ALTER|DELETE)\b/gmi);
});
test('compiler rejects attempts to substitute another master',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-canon-input-'));
  const altered=structuredClone(sourceSnapshot);
  altered.authority.spreadsheet_id='a-competing-master';
  const file=path.join(tmp,'bad.json');fs.writeFileSync(file,JSON.stringify(altered));
  const {result}=run({WTW_HISTORY_ORG_SOURCE:file});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Wrong authority/);
});
test('compiler rejects duplicate immutable organization identities',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-canon-input-'));
  const altered=structuredClone(sourceSnapshot);
  altered.rows[1][0]=altered.rows[0][0];
  const file=path.join(tmp,'duplicate.json');fs.writeFileSync(file,JSON.stringify(altered));
  const {result}=run({WTW_HISTORY_ORG_SOURCE:file});
  assert.notEqual(result.status,0);
  assert.match(result.stderr,/Duplicate Organization_ID/);
});
test('source-level approved direction is separate from historical claims needing approval',()=>{
  const {dir,result}=run();
  assert.equal(result.status,0,result.stderr);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'history-org-manifest.json'),'utf8'));
  const tier=manifest.counts.by_publication_tier;
  assert.equal(tier.USER_APPROVED_DIRECTION_ONLY,1);
  assert.ok(tier.SOURCE_ONLY_OUTLINE_PENDING_APPROVAL>=12);
  assert.ok(tier.UNAPPROVED_ORIGIN_DETAILS>=70);
  assert.equal(Object.values(tier).reduce((a,b)=>a+b,0),108);
});

test('only ten source-approved organization histories publish their actual origin prose',()=>{
  const {dir,result}=run();
  assert.equal(result.status,0,result.stderr||result.stdout);
  const manifest=JSON.parse(fs.readFileSync(path.join(dir,'history-org-manifest.json'),'utf8'));
  const sql=fs.readFileSync(path.join(dir,'30_history_org_profiles.sql'),'utf8');
  assert.equal(manifest.counts.organizations,108);
  assert.equal(manifest.counts.approved_origin_publications,10);
  assert.equal(manifest.counts.identity_only_origin_redactions,98);
  assert.match(sql,/ELITE_HISTORIC_GOLD_STANDARD/);
  assert.match(sql,/Kingsmere Farm/);
  assert.match(sql,/IDENTITY_ONLY__ORIGIN_REQUIRES_APPROVAL/);
  const h=sourceSnapshot.headers;
  function sourceRow(id){const row=sourceSnapshot.rows.find(x=>x[h.indexOf('Organization_ID')]===id);
    assert.ok(row);return Object.fromEntries(h.map((key,i)=>[key,row[i]??'']));}
  const pending=sourceRow('O-000010');
  assert.match(pending.Approval_Gate,/SOURCE_HISTORY_OUTLINE/);
  assert.ok(pending.Origin_Through_1998.length>100);
  assert.ok(!sql.includes(pending.Origin_Through_1998),
    'Research-only origin prose may not leave source staging as published content');
  assert.ok(!sql.includes(pending.Economic_Continuity_Constraint),
    'Unapproved origin-based financial speculation must be redacted');
});

test('seventy-three new evidence-only backgrounds remain unseen until individually approved',()=>{
  const {dir,result}=run();
  assert.equal(result.status,0,result.stderr||result.stdout);
  const sql=fs.readFileSync(path.join(dir,'30_history_org_profiles.sql'),'utf8');
  const h=sourceSnapshot.headers;
  const iID=h.indexOf('Organization_ID'), iOrigin=h.indexOf('Origin_Through_1998'), iApproval=h.indexOf('Approval_Gate');
  const pending=sourceSnapshot.rows.filter(r=>r[iApproval]==='NEW_HISTORY_DETAILS_REQUIRE_USER_APPROVAL');
  assert.equal(pending.length,73);
  for(const row of pending){
    assert.match(row[iOrigin],/^EVIDENCE-ONLY PRE-1999 CONTINUITY/);
    assert.ok(!sql.includes(row[iOrigin]),'Unapproved origin leaked into published SQL '+row[iID]);
  }
  assert.match(sql,/IDENTITY_ONLY__ORIGIN_REQUIRES_APPROVAL/);
});
