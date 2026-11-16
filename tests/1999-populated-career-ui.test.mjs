import test from 'node:test';
import assert from 'node:assert/strict';
import {webcrypto} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import {packShared1999Career,unpackShared1999Career}
 from '../public/1999/engine/shared-1999-career-package.mjs';
import {projectPopulated1999Career,POPULATED_1999_UI_READ_MODEL_SCHEMA}
 from '../public/next/1999-populated-career-read-model.mjs';

globalThis.crypto??=webcrypto;
const file=path=>readFileSync(new URL('../'+path,import.meta.url));
const source=path=>file(path).toString('utf8');
const canonicalBytes=gunzipSync(file('public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz'));
const checkpoint=await unpackShared1999Career(canonicalBytes);
const manifest=checkpoint.world.manifest;
const snapshotSha256=checkpoint.world.snapshotSha256;
const originalRecord=checkpoint.careerRecord;
const originalRun=originalRecord.changes.canonicalRun;
const read=run=>projectPopulated1999Career({manifest,run,snapshotSha256});

test('shared May 29, 1999 career projects exact player horses and ledger cash',()=>{
 const before=JSON.stringify(originalRun);
 const model=read(structuredClone(originalRun));
 assert.equal(model.schema,POPULATED_1999_UI_READ_MODEL_SCHEMA);
 assert.equal(model.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(model.runId,'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(model.date,'1999-05-29');
 assert.equal(model.worldHorseCount,300000);
 assert.equal(model.personCount,75724);
 assert.equal(model.operationId,originalRun.player.operation_id);
 assert.equal(model.cashMinor,originalRun.runtime.finances.operation_balances_minor[model.operationId]);
 assert.equal(model.horseRows.length,originalRun.stable_horse_ids.length);
 assert.ok(model.horseRows.length>=2,'The full-world save must show its actual owned stable');
 assert.deepEqual(model.horseRows.map(h=>h.horseId),originalRun.stable_horse_ids);
 for(const horse of model.horseRows){
  const sourceHorse=originalRun.runtime.registered_horses.by_id[horse.horseId];
  assert.equal(horse.name,sourceHorse.registered_name);
  assert.equal(horse.ownerId,originalRun.player.operation_id);
  assert.equal(horse.trainerId,sourceHorse.trainer_id);
  assert.equal(horse.earningsMinor,sourceHorse.career.earnings_minor);
  assert.equal(horse.starts,sourceHorse.career.starts);
  assert.equal(horse.wins,sourceHorse.career.wins);
  assert.equal(horse.birthDate,sourceHorse.birth_date);
  assert.equal(horse.results.length,
   Object.values(originalRun.runtime.races).filter(r=>r.status==='OFFICIAL_SIM_RESULT'&&
    r.results?.some(x=>x.horse_id===horse.horseId)).length);
 }
 assert.equal(JSON.stringify(originalRun),before,'UI projection mutated the reference career');
});

test('the shared race is exact R-ID and official results, never invented targets',()=>{
 const model=read(structuredClone(originalRun));
 const official=Object.values(originalRun.runtime.races)
  .filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.equal(official.length,1,'Assembled shared career has one completed game race');
 const actual=official[0],race=model.raceRows.find(r=>r.id===actual.id);
 assert.ok(race);
 assert.equal(race.date,actual.date);
 assert.equal(race.trackId,actual.track_id);
 assert.equal(race.status,'OFFICIAL_SIM_RESULT');
 assert.equal(race.statusLabel,'Official game result');
 assert.equal(race.purseMinor,actual.purse_minor);
 assert.deepEqual(race.results.map(x=>x.horseId),actual.results.slice()
  .sort((a,b)=>a.finish-b.finish).map(x=>x.horse_id));
 assert.deepEqual(race.results.map(x=>x.earningsMinor),actual.results.slice()
  .sort((a,b)=>a.finish-b.finish).map(x=>x.earnings_minor));
 assert.ok(model.raceRows.every(r=>r.id&&r.status!=='Planned'));
 assert.ok(model.raceRows.every(r=>r.playerEntryCount>=0));
 assert.ok(model.horseRows.some(h=>h.results.some(x=>x.raceId===actual.id)));
});

test('an isolated copy survives checksum export/reopen without advancing the reference',async()=>{
 const copy=structuredClone(originalRun);
 const before=JSON.stringify(copy);
 const record=structuredClone(originalRecord);
 record.changes.canonicalRun=copy;
 const encoded=await packShared1999Career({manifest,snapshotSha256,careerRecord:record});
 const reopened=await unpackShared1999Career(encoded);
 assert.deepEqual(read(reopened.careerRecord.changes.canonicalRun),read(copy));
 assert.equal(reopened.careerRecord.runId,originalRecord.runId);
 assert.equal(reopened.careerRecord.gameDate,'1999-05-29');
 assert.equal(JSON.stringify(originalRun),JSON.stringify(checkpoint.careerRecord.changes.canonicalRun));
 assert.equal(JSON.stringify(copy),before);
});

test('projection rejects a foreign run/world, unowned roster or missing race identity',()=>{
 const wrongSha=structuredClone(originalRun);
 wrongSha.world_ref.sha256='0'.repeat(64);
 assert.throws(()=>read(wrongSha),/mismatched world or career/);
 const wrongStable=structuredClone(originalRun);
 wrongStable.stable_horse_ids.push('NONCANONICAL-ID');
 assert.throws(()=>read(wrongStable),/unresolved or unowned horse/);
 const wrongOwner=structuredClone(originalRun);
 wrongOwner.runtime.registered_horses.by_id[wrongOwner.stable_horse_ids[0]].owner_organization_id='O-OTHER';
 assert.throws(()=>read(wrongOwner),/unresolved or unowned horse/);
});

test('one approved UI routes exact career IDs and preserves other menus, sorting and filtering',()=>{
 const ui=source('public/next/next.js');
 const manager=source('public/next/1999-commercial-career-manager.mjs');
 assert.match(manager,/projectPopulated1999Career\(/);
 assert.match(manager,/publishCareerReadModel\(/);
 assert.match(ui,/function liveSavedCareerHorseData\(/);
 assert.match(ui,/function savedCareerHorseProfile\(/);
 assert.match(ui,/function savedCareerRaceFile\(/);
 assert.match(ui,/if\(key==='career-horse'\)return openSavedCareerHorse\(val\)/);
 assert.match(ui,/if\(key==='career-race'\)return openSavedCareerRace\(val\)/);
 assert.match(ui,/data-career-horse-id/);
 assert.match(ui,/data-career-race-id/);
 assert.match(ui,/APP\.stableSort/);
 assert.match(ui,/APP\.stableSearch/);
 assert.match(ui,/data-ng="stable-filter"/);
 assert.match(ui,/window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__/);
 assert.match(ui,/function cashDisplay\(/);
 const start=ui.indexOf('const tabmap='),end=ui.indexOf('\nconst actions=',start);
 const tabs=vm.runInNewContext(ui.slice(start,end)+'\ntabmap;');
 const pages=Object.values(tabs).flat();
 assert.ok(pages.length>=65);
 assert.ok(pages.every(p=>!/[a-z]/i.test(p)||p.match(/[a-z]/i)[0]===p.match(/[a-z]/i)[0].toUpperCase()));
});
