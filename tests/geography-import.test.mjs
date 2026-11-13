import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
test('all Drive v3.3 geography source partitions compile into isolated D1 SQL without identity inventions',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-geo-import-'));
 try {
  const run=spawnSync(process.execPath,[path.join(root,'scripts/build-geography-import.mjs')],{
   env:{...process.env,WTW_GEO_OUTPUT_DIR:dir},encoding:'utf8',maxBuffer:1024*1024*4
  });
  assert.equal(run.status,0,run.stderr||run.stdout);
  const m=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json'),'utf8'));
  assert.equal(m.total,8449);
  assert.deepEqual(m.counts,{horse_current:2522,horse_foaling:2991,participant_geography:2688,organization_geography:130,track_geography:118});
  assert.equal(m.unique_horses_current,2488);
  assert.equal(m.unique_horses_foaling,2991);
  assert.equal(m.unique_organizations,108);
  assert.equal(m.tracks.north_america,118);
  assert.equal(m.tracks.international,0);
  assert.equal(m.files.length,24);
  assert.equal(m.sql_chunks.reduce((a,b)=>a+b.records,0),8449);
  assert.match(m.digest,/^[0-9a-f]{64}$/);
  assert.ok(fs.existsSync(path.join(dir,'geo_999_manifest.sql')));
  assert.ok(!fs.existsSync(path.join(root,'public','horse-geography-1999.json')));

  const py=[
   'import sqlite3,sys,pathlib',
   'c=sqlite3.connect(":memory:")',
   'c.executescript(pathlib.Path(sys.argv[1]).read_text())',
   'files=sorted(pathlib.Path(sys.argv[2]).glob("geo_*.sql"))',
   'for f in files: c.executescript(f.read_text())',
   'one=lambda q:c.execute(q).fetchone()[0]',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records") == 8449',
   'assert one("SELECT COUNT(DISTINCT source_record_id) FROM wtw_geo_read_records") == 8449',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE source_sheet=\'Horse_Geography\'") == 2522',
   'assert one("SELECT COUNT(DISTINCT entity_id) FROM wtw_geo_read_records WHERE source_sheet=\'Horse_Geography\'") == 2488',
   'assert one("SELECT COUNT(DISTINCT entity_id) FROM wtw_geo_read_records WHERE source_sheet=\'Horse_Foaling_Geography\'") == 2991',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE source_sheet=\'Participant_Geography\'") == 2688',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE source_sheet=\'Organization_Geography\'") == 130',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE source_sheet=\'Track_Geography\'") == 118',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE geography_status=\'WTW_PROPOSED_PLACEMENT\'") == 8',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE geography_status=\'BOUNDARY_PROVISIONAL\'") == 5',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE source_record_id=\'HG-000486\' AND entity_id=\'H-1993-000007\'") == 1',
   'assert one("SELECT COUNT(*) FROM wtw_geo_read_records WHERE entity_id=\'P-000023\' AND city_locality IS NULL AND state_region=\'Mid-Atlantic\'") >= 1',
   'assert one("SELECT COUNT(*) FROM wtw_geo_import_manifest") == 1',
   'assert one("SELECT length(source_digest_sha256) FROM wtw_geo_import_manifest") == 64',
   'assert c.execute("PRAGMA foreign_key_check").fetchall() == []',
   'print("PASS: all 8449 rows join and source status is retained with no legacy entity FK")'
  ].join('\n');
  const audit=spawnSync('python3',['-c',py,path.join(root,'migrations/0005_canon_geography_read_model.sql'),dir],{
   encoding:'utf8',maxBuffer:1024*1024*4
  });
  assert.equal(audit.status,0,audit.stderr||audit.stdout);
  assert.match(audit.stdout,/PASS: all 8449 rows/);
 }finally {fs.rmSync(dir,{recursive:true,force:true});}
});
