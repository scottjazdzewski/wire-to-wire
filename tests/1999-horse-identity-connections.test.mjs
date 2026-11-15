import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {exportGameSave,importGameSave} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {getCareerHorseConnections} from '../src/game/horse-connections.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const source=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const projection=read('../public/data/wtw-1999-pilot-horse-relationships-v1.json');
const js=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const personIds=new Set(source.people.map(p=>p.id));
const world={
 schema:'WTW_WORLD_SNAPSHOT_V1',
 authority:{snapshot_id:'TEST-1999-IDENTITY-CONNECTIONS',
  source:'PILOT TEST ONLY',sha256:createHash('sha256').update(JSON.stringify(source.counts)).digest('hex')},
 start_date:'1999-01-01',
 entities:{horses:source.horses,people:[...source.people,...trainers.trainers.filter(p=>!personIds.has(p.id))],
  organizations:source.organizations,tracks:source.tracks}
};
test('public test-cohort projection matches exactly the authoritative fixture IDs and assignments',()=>{
 assert.equal(projection.total_horses,38);
 assert.equal(projection.total_sites,8);
 assert.equal(projection.status,'ISOLATED_GAME_TEST_COHORT_NOT_LIVE_CAREER');
 for(const h of projection.horses){
  const source=manifest.assignments.find(x=>x.horse_id===h.id);
  assert.ok(source);
  assert.equal(h.owner_organization_id,source.owner_organization_id);
  assert.equal(h.trainer_id,source.trainer_id);
  assert.equal(h.site_id,source.current_residence_id);
  assert.equal(h.track_id,source.host_track_id);
 }
});
test('live selector resolves owner, trainer, track and site by permanent ID, without blending ownership with residence',()=>{
 const state=build1999PilotGameRun({world,manifest});
 const check=(kind,id,match)=>{const x=getCareerHorseConnections(state,world,{kind,id});
  assert.equal(x.total,x.horses.length);
  assert.deepEqual(x.horses.map(h=>h.id).sort(),manifest.assignments.filter(match).map(h=>h.horse_id).sort());
  return x;};
 const owner='O-FOUNDING-1999-007',trainer='P-003134',track='T-0017',site='F-1999-GP-WALKER';
 check('owner',owner,h=>h.owner_organization_id===owner);
 check('trainer',trainer,h=>h.trainer_id===trainer);
 const atTrack=check('track',track,h=>h.host_track_id===track);
 check('site',site,h=>h.current_residence_id===site);
 assert.equal(atTrack.total,10);
 assert.ok(atTrack.horses.every(h=>h.site_name&&h.host_track_id==='T-0017'));
 assert.deepEqual(importGameSave(exportGameSave(state,world),world),state);
 assert.throws(()=>getCareerHorseConnections(state,world,{kind:'track',id:'T-MISSING'}),
  e=>e.code==='HORSE_CONNECTIONS');
});
test('test-cohort connections remain in the actual pilot engine, never injected into canonical trainer, track and owner pages',()=>{
 assert.match(js,/function pilotHorseDetail\(id\)/);
 assert.match(js,/APP\.custom\.startsWith\('PilotHorse:'\)/);
 assert.match(js,/if\(key==='pilot-connection'\)/);
 assert.doesNotMatch(js,/function pilotHorseConnectionsPanel\(|const pilotID=pilotKind|profileRecordSection\(/);
 assert.match(js,/ng-track-workspace/);
 assert.match(js,/const stakesTable=\(limit=100\)=>\{/);
 assert.match(js,/return '<div class="ng-stakes-table ng-track-stakes-table">/);
});
