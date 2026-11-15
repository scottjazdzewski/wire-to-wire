import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createFictionalWorldNameEngine} from '../public/1999/engine/fictional-world-name-engine.mjs';
import {auditFictionalPersonBiographiesV1,completeFictionalPersonBiographiesV1} from '../public/1999/engine/fictional-person-biographies-v1.mjs';
import attributeCatalog from '../public/1999/engine/attribute-catalog.mjs';
import {WORLD_SCHEMA,createGameRun,exportGameSave,importGameSave} from '../src/game/index.js';

const spec={worldId:'BiographyTest',seed:19990101,year:1999,
 roles:{trainer:8,jockey:6,farm_manager:4,veterinarian:3,farrier:2,bloodstock_agent:2,racing_secretary:1},
 owners:12,facilities:{generalFarms:2,studFarms:1,nurseries:1,bloodstockFarms:0,breakingTraining:0}};

test('completes the established 1999 identity roster with stable full biographies and game IDs',async()=>{
 const identities=createFictionalWorldNameEngine(spec);
 const input=identities.people.map(x=>({...x}));
 const profiles=completeFictionalPersonBiographiesV1({people:input,seed:spec.seed});
 assert.equal(profiles.length,input.length);
 assert.deepEqual(profiles.map(x=>x.name),input.map(x=>x.name));
 assert.match(profiles[0].id,/^P-[A-Za-z0-9-]+$/);
 assert.match(profiles[0].date_of_birth,/^\d{4}-\d{2}-\d{2}$/);
 assert.notDeepEqual(profiles[0].birthplace,profiles[0].work_location);
 assert.ok(profiles.find(p=>p.role==='trainer').generation_links.racing_stable_id);
 assert.ok(profiles.find(p=>p.role==='farm_manager').generation_links.farm_id);
 assert.ok(profiles.find(p=>p.role==='owner').generation_links.owner_organization_id);
 assert.equal(auditFictionalPersonBiographiesV1({people:profiles}).valid,true);
 assert.deepEqual(profiles,completeFictionalPersonBiographiesV1({people:input,seed:spec.seed}));
 assert.deepEqual(input,identities.people);
 const digest=createHash('sha256').update(JSON.stringify(profiles)).digest('hex');
 const world={schema:WORLD_SCHEMA,authority:{snapshot_id:'TEST-FICTIONAL-BIOGRAPHY-WORLD',source:'LOCAL_FICTIONAL_GENERATION_TEST',sha256:digest},start_date:'1999-01-01',entities:{horses:[],people:profiles,organizations:[],tracks:[]}};
 const run=createGameRun({world,runId:'WTW-RUN-BIOGRAPHY-TEST',seed:spec.seed,player:{role:'owner',involvement:'balanced'},personGenerationCatalog:attributeCatalog});
 assert.equal(Object.keys(run.runtime.people).length,profiles.length);
 assert.ok(Object.values(run.runtime.people).every(p=>Object.keys(p.latent).length>0&&Object.values(p.latent).every(n=>n>=0&&n<=1)));
 assert.deepEqual(importGameSave(exportGameSave(run,world),world),run);
 const flags=await Promise.all([...new Set(profiles.map(p=>p.birthplace.country_code))].map(async code=>{
  try{await readFile(new URL('../public/assets/flags/v1/'+code.toLowerCase()+'.svg',import.meta.url));return code}
  catch{return null}
 }));
 assert.ok(flags.every(Boolean),'Every generated birth country must have a bundled local flag asset');
});

test('rejects unsupported, duplicate, or age-inconsistent person input instead of saving partial profiles',()=>{
 const person={id:'WTWFI-X-PERSON-TRAINER-000001',name:'Test Person',role:'trainer',birthYear:1950,ageAtOpening:49,birthCountry:'US',location:{countryCode:'US'}};
 assert.throws(()=>completeFictionalPersonBiographiesV1({people:[person,person],seed:1}),/Duplicate fictional person identity/);
 assert.throws(()=>completeFictionalPersonBiographiesV1({people:[{...person,birthCountry:'XX'}],seed:1}),/No locally modeled birthplace pool/);
 const p=completeFictionalPersonBiographiesV1({people:[person],seed:1});
 assert.equal(auditFictionalPersonBiographiesV1({people:[{...p[0],biography:{...p[0].biography,age_at_opening:17}}]}).valid,false);
});
