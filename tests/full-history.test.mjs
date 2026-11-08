import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sourceDir=path.join(root,'data/history-source/2026-11-07');
const needed=['horse-master','horse-seasons','stakes-editions','pedigree-edges','bloodlines'];
const sample=path.join(root,'data/sample-history.json');

function row(headers,record){return headers.map(k=>record[k]??null)}
function writeSource(dir,name,records){
 const headers=[...new Set(records.flatMap(x=>Object.keys(x)))];
 fs.writeFileSync(path.join(dir,`${name}.json`),JSON.stringify({headers,rows:records.map(r=>row(headers,r))}));
}
test('historical importer preserves exact IDs and source-level connections',()=>{
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-import-test-'));
  const inDir=path.join(tmp,'source'),outDir=path.join(tmp,'out');fs.mkdirSync(inDir);
  try{
    writeSource(inDir,'horse-master',[{Horse_ID:'H-1950-008016',Registered_Name:'Double Duty',Foal_Year:1950,Sex:'GELDING',Canon_Role:'CLASSIC CHAMPION',Canon_Status:'USER_APPROVED',Sire_ID:'S-1',Dam_ID:'D-1'}]);
    writeSource(inDir,'horse-seasons',[{Horse_ID:'H-1950-008016',Horse_Name:'Double Duty',Race_Year:1953,Owner_ID:'OWN-1',Owner_Name:'Harbor Yard Stable',Trainer_ID:'TR-1',Trainer_Name:'Arthur Murray',Jockey_ID:'J-1',Jockey_Name:'Raymond Mercer',Breeder_ID:'BR-1',Breeder_Name:'Ashby Vale Farm',Stakes_Wins:2,Top3_Starts:2}]);
    writeSource(inDir,'stakes-editions',[{Race_Edition_ID:'HSE-1953-0001',Race_Name:'Kentucky Derby',Race_Year:1953,Race_Date:'1953-05-02',Track_ID:'T-1',Track_Name:'Churchill Downs',Surface:'DIRT',Winner_Horse_ID:'H-1950-008016',Winner_Name:'Double Duty',Canon_Status:'SOURCE'}]);
    writeSource(inDir,'pedigree-edges',[{Parent_ID:'S-1',Parent_Name:'Ancestor',Child_ID:'H-1950-008016',Child_Name:'Double Duty',Relation:'SIRE',Edge_Key:'K1'}]);
    writeSource(inDir,'bloodlines',[{Horse_ID:'H-1950-008016',Horse_Name:'Double Duty',Foal_Year:1950}]);
    const run=spawnSync(process.execPath,[path.join(root,'scripts/build-full-history.mjs')],{env:{...process.env,WTW_SOURCE_DIR:inDir,WTW_OUTPUT_DIR:outDir},encoding:'utf8'});
    assert.equal(run.status,0,run.stderr);
    const mf=JSON.parse(fs.readFileSync(path.join(outDir,'manifest.json')));
    assert.equal(mf.inputCounts.horses,1);assert.equal(mf.outputCounts.entities,6);
    assert.equal(mf.outputCounts.races,1);assert.equal(mf.outputCounts.connections,4);
    assert.equal(mf.outputCounts.results,1);
    assert.deepEqual(mf.yearCoverage.stakes,[1953,1953]);
    assert.match(fs.readFileSync(path.join(outDir,'01_entities_001.sql'),'utf8'),/Double Duty/);
    assert.match(fs.readFileSync(path.join(outDir,'07_results_001.sql'),'utf8'),/INSERT OR IGNORE/);
    assert.match(fs.readFileSync(path.join(outDir,'05_connections_001.sql'),'utf8'),/HORSE_SEASON_SOURCE/);
    assert.ok(!fs.existsSync(path.join(root,'public','full-history.json')));
  }finally{fs.rmSync(tmp,{recursive:true,force:true})}
});
test('complete historical source snapshots are staged only outside public assets',t=>{
  if(!needed.every(name=>fs.existsSync(path.join(sourceDir,`${name}.json`)))){
    t.skip('Source snapshots are in the connected private GitHub repository; local checkout is only the starter UI.');return;
  }
  for(const name of needed){
    const r=JSON.parse(fs.readFileSync(path.join(sourceDir,`${name}.json`)));
    assert.ok(r.headers.length>8,name+' source headers');assert.ok(r.rows.length>3000,name+' source rows');
  }
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'wtw-full-history-check-'));
  try {
    const run=spawnSync(process.execPath,[path.join(root,'scripts/build-full-history.mjs')],{
      env:{...process.env,WTW_OUTPUT_DIR:tmp},encoding:'utf8',maxBuffer:1024*1024*2
    });
    assert.equal(run.status,0,run.stderr);
    const manifest=JSON.parse(fs.readFileSync(path.join(tmp,'manifest.json')));
    assert.equal(manifest.inputCounts.horses,3856);
    assert.equal(manifest.inputCounts.seasons,5221);
    assert.equal(manifest.inputCounts.stakesEditions,5370);
    assert.equal(manifest.inputCounts.pedigreeEdges,8408);
    assert.equal(manifest.inputCounts.bloodlines,3856);
    assert.ok(manifest.outputCounts.entities>3856);
    assert.ok(manifest.outputCounts.results>15000);
    assert.deepEqual(manifest.yearCoverage.stakes,[1864,1998]);
  } finally {fs.rmSync(tmp,{recursive:true,force:true})}
});