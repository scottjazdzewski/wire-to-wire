import {test} from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync} from 'node:fs';
import {readLocal1999World as read} from '../public/1999/engine/local-api.mjs';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
const file=p=>new URL('../'+p,import.meta.url);
const present=p=>existsSync(file(p));
const directory=JSON.parse(readFileSync(file('public/data/wtw-1999-founding-directory-v1.json'),'utf8'));
const jockeys=JSON.parse(readFileSync(file('public/data/wtw-1999-jockey-pilot-v1.json'),'utf8'));
const trainers=JSON.parse(readFileSync(file('public/data/wtw-1999-trainer-pilot-v1.json'),'utf8'));

test('clean opening has ONLY approved 37 organizations, 41 founding people, 73 breeders, ALL 118 tracks',()=>{
 const w=createFounding1999Universe({seed:19990101});
 const c=read('/api/1999/sim/overview').counts;
 assert.equal(c.horses,0,'Never resurrect generated racing horses');
 assert.equal(c.generatedHorses,0);
 assert.equal(c.worldHorses,73);
 assert.equal(c.breedingStallions,18);
 assert.equal(c.breedingMares,55);
 assert.equal(c.owners,37);
 assert.equal(c.people,41);
 assert.equal(c.tracks,118);
 assert.equal(w.counts.horses,0);
 assert.equal(w.sourceHorses.length,0);
 assert.equal(directory.organizations.length,37);
 assert.equal(directory.people.length,41);
 assert.equal(directory.horses.length,73);
 assert.equal(read('/api/1999/sim/horse-directory').total,0);
 assert.equal(read('/api/1999/sim/horses').total,0);
 assert.equal(read('/api/1999/horses').total,0);
 assert.equal(read('/api/1999/sim/owner-horses?ownerId=O-000011').total,0);
 assert.equal(read('/api/1999/sim/auctions').total,0);
 assert.equal(read('/api/1999/sim/people').total,0);
 assert.equal(read('/api/1999/sim/world-horse-directory').total,73);
});
test('all existing tracks available, no fake physical barns or staff',()=>{
 const w=createFounding1999Universe({seed:19990101});
 assert.equal(w.counts.facilities,30);
 assert.equal(w.counts.trainers,0);
 const refs=read('/api/1999/sim/facilities?limit=100').items;
 assert.equal(refs.length,30);
 assert.ok(refs.every(x=>x.facilityReferenceOnly===true||x.institutionalReferenceOnly===true||
   x.source==='APPROVED_ORGANIZATION_REFERENCE'||x.status?.includes('NOT_REGISTERED')||
   !x.propertyId),'30 org references never license building assets');
 const tracks=read('/api/1999/sim/tracks?limit=100');
 assert.equal(tracks.total,118);
 assert.equal(new Set(tracks.items.map(x=>x.id)).size,100);
});
test('only our explicitly selected 26 jockeys and 20 trainers enter Personnel overlays',()=>{
 const selected=jockeys.jockeys.filter(x=>x.pilotStatus==='SELECTED_IDENTITY_ONLY');
 assert.equal(selected.length,26);
 assert.equal(trainers.trainers.length,20);
 assert.equal(new Set([...selected,...trainers.trainers].map(x=>x.id)).size,46);
 assert.ok(selected.find(x=>x.name==='Paloma Reyes'&&x.gender==='MALE'));
 assert.ok(selected.find(x=>x.name==='Simonne Beaulieu'&&x.gender==='MALE'&&
  x.secondaryCircuit==='NEW_YORK_SELECTED_MAJOR_STAKES_DAYS'));
 assert.ok(selected.find(x=>x.name==='Owen LeBlanc'&&/Louisiana/.test(x.birthplace)));
 assert.ok(selected.every(x=>x.performanceRatings===null&&x.bookedMounts.length===0));
 assert.ok(trainers.trainers.every(x=>x.roleAttributes===null&&x.contract===null));
});
test('old large modes and generated-game routes cannot be reopened by API options',()=>{
 for(const query of ['?mode=CANON_ANCHORED_TEST','?mode=FULLY_FICTIONAL_TEST',
   '?population=325000','?population=87500','?pilot=opening']){
  assert.throws(()=>read('/api/1999/sim/overview'+query),/Retired/);
 }
 for(const old of [
  'public/1999/engine/full-world-generator.mjs',
  'public/1999/engine/world-profiles.mjs',
  'src/1999/full-world-generator.mjs',
  'src/1999/full-world-readmodel.mjs',
  'public/next/1999-world-index.worker.mjs',
  'public/1999/engine/founding-youngstock-candidates-1999.mjs',
  'public/1999/app.mjs','public/1999/index.html',
  'public/legacy-2014/index.html'
 ])assert.equal(present(old),false,old+' must be absent from main');
});
test('clean browser config and saves cannot import retired worlds',()=>{
 const config=readFileSync(file('public/next/1999-commercial-config.js'),'utf8');
 const career=readFileSync(file('public/1999/engine/compact-career.mjs'),'utf8');
 const startup=readFileSync(file('public/next/1999-bootstrap.js'),'utf8');
 const adapter=readFileSync(file('public/next/1999-ui-source.mjs'),'utf8');
 assert.match(config,/only the approved small 1999 world/);
 assert.match(career,/profile\.population!==73/);
 assert.match(startup,/wtw1999UserApprovedCleanResetV2/);
 assert.doesNotMatch(adapter,/1999-world-index\.worker|FULLY_FICTIONAL_TEST|H-TEST-1999-/);
});
