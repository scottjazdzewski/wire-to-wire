import test from 'node:test';
import assert from 'node:assert/strict';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import {packShared1999Career,unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';
import {CAREER_RACE_FILE_SCHEMA,projectCanonical1999RaceRows,
 renderCanonical1999RaceFile}
 from '../public/next/1999-canonical-career-race-files.mjs';

const source=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
 import.meta.url);
const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',
 import.meta.url),'utf8');
let shared;
async function checkpoint(){
 if(!shared)shared=await unpackShared1999Career(gunzipSync(readFileSync(source)));
 return shared;
}

test('May 29 canonical 300k career projects its actual completed game race and never writes the source',async()=>{
 const saved=await checkpoint(),run=saved.careerRecord.changes.canonicalRun;
 assert.equal(saved.world.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(saved.world.seed,19990101);
 assert.equal(saved.world.horseCount,300000);
 assert.equal(saved.careerRecord.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(saved.careerRecord.gameDate,'1999-05-29');
 const original=JSON.stringify(run),rows=projectCanonical1999RaceRows(run);
 const official=rows.filter(r=>r.gameStatus==='OFFICIAL_SIM_RESULT');
 assert.equal(official.length,1);
 const row=official[0],race=run.runtime.races[row.id];
 assert.equal(row.id,race.id);
 assert.equal(row.raceFile.schema,CAREER_RACE_FILE_SCHEMA);
 assert.equal(row.status,'Official Game Result');
 assert.equal(row.raceFile.date,race.date);
 assert.equal(row.raceFile.trackId,race.track_id);
 assert.equal(row.raceFile.purseMinor,race.purse_minor);
 assert.equal(row.raceFile.results.length,race.results.length);
 assert.deepEqual(row.raceFile.results.map(r=>r.horseId),
  [...race.results].sort((a,b)=>a.finish-b.finish).map(r=>r.horse_id));
 assert.deepEqual(row.raceFile.results.map(r=>r.earningsMinor),
  [...race.results].sort((a,b)=>a.finish-b.finish).map(r=>r.earnings_minor));
 for(const result of row.raceFile.results)
  assert.equal(result.horseName,run.runtime.registered_horses.by_id[result.horseId].registered_name);
 assert.equal(JSON.stringify(run),original,'Reading a race cannot advance or modify the shared saved career');
});

test('reopened copy of the exact shared May 29 checkpoint retains race identity and placing',async()=>{
 const saved=await checkpoint();
 const copiedRecord=structuredClone(saved.careerRecord);
 const prior=projectCanonical1999RaceRows(copiedRecord.changes.canonicalRun);
 const bytes=await packShared1999Career({
  manifest:structuredClone(saved.world.manifest),
  snapshotSha256:saved.world.snapshotSha256,careerRecord:copiedRecord
 });
 const again=await unpackShared1999Career(bytes);
 assert.equal(again.world.worldId,saved.world.worldId);
 assert.equal(again.careerRecord.runId,saved.careerRecord.runId);
 assert.equal(again.careerRecord.gameDate,'1999-05-29');
 assert.deepEqual(projectCanonical1999RaceRows(again.careerRecord.changes.canonicalRun),prior);
 assert.deepEqual(again.careerRecord,saved.careerRecord);
});

test('official game results display saved placing and never claim a future race or historical victory',async()=>{
 const saved=await checkpoint();
 const rows=projectCanonical1999RaceRows(saved.careerRecord.changes.canonicalRun);
 const actual=rows.find(r=>r.gameStatus==='OFFICIAL_SIM_RESULT');
 const html=renderCanonical1999RaceFile(actual);
 assert.match(html,/data-game-race-id=/);
 assert.match(html,/OFFICIAL GAME RESULT/);
 assert.match(html,/Saved finishing order and credited purses/);
 assert.match(html,/not historical facts/);
 for(const result of actual.raceFile.results){
  assert.ok(html.includes(result.horseId));
 }
 assert.doesNotMatch(html,/NOT YET RUN|PROVISIONAL ELIGIBILITY|No result or entry has been committed/);
 assert.ok(!html.includes('<script'));
});

test('other career cannot inherit a previous saved race ID or change the shared reference',async()=>{
 const saved=await checkpoint();
 const sourceRun=saved.careerRecord.changes.canonicalRun;
 const original=JSON.stringify(sourceRun);
 const copy=structuredClone(sourceRun);
 copy.runtime.races={};
 const rows=projectCanonical1999RaceRows(copy);
 assert.equal(rows.length,0);
 assert.equal(renderCanonical1999RaceFile(undefined).includes('Saved race unavailable'),true);
 assert.equal(JSON.stringify(sourceRun),original);
});

test('race opening is wired to the exact saved ID and a live reopened projection',()=>{
 assert.match(manager,/projectCanonical1999RaceRows\(run,career\.world\)/);
 assert.match(manager,/WTW1999CanonicalCareerRaceFile=Object\.freeze/);
 assert.match(manager,/prior\?\.worldId===snapshot\.worldId&&prior\?\.runId===snapshot\.runId/);
 assert.match(ui,/savedCareer\?r\.id:i/);
 assert.match(ui,/data-ng="fixture" data-val="\$\{safe\(window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__\?r\.id:i\)\}/);
 assert.match(ui,/data-ng="fixture" data-val="'\+safe\(window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__\?r\.id:i\)/);
 assert.match(ui,/r\.gameStatus==='ENTRIES_OPEN'/);
 assert.match(ui,/\['ENTERED','BOOKED'\]\.includes\(e\.status\)/);
 assert.match(ui,/if\(key==='fixture'\)\{\s*const saved=window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__/);
 assert.match(ui,/return openCustomView\('RaceFile:Career:'\+encodeURIComponent\(row\.id\)/);
 assert.match(ui,/saved\?\.raceRows\?\.find\(r=>r\.id===id\)/);
 assert.match(ui,/else if\(APP\.custom\.startsWith\('RaceFile:'\)\)/);
 assert.match(ui,/APP\.custom\.startsWith\('RaceFile:Career:'\)/);
 assert.match(ui,/window\.WTW1999CanonicalCareerRaceFile\?\.render\?\.\(row\)/);
});
