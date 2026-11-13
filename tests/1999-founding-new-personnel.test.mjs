import test from 'node:test';
import assert from 'node:assert/strict';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {createFoundingProfessionals1999,foundingProfessionalCounts} from
 '../public/1999/engine/founding-personnel-1999.mjs';

const world=createFounding1999Universe({seed:19990101});
test('clean founding world imports ZERO unapproved generated professionals',()=>{
 assert.equal(world.audit.newProfessionalPool,0);
 assert.equal(world.audit.originalGeneratedStaffImported,0);
 assert.equal(world.counts.trainers,0);
 assert.equal(world.counts.people,world.sourcePeople.length);
 assert.equal(world.counts.people,41);
 assert.throws(()=>world.personAt(0),/Founding workforce index/);
 assert.ok(world.sourcePeople.every(p=>!p.id.startsWith('P-FOUNDING-STAFF-')));
 assert.ok(!world.sourcePeople.some(p=>['Graham Kincaid','Hugh Radcliffe',
  'Sebastian Pryce','Daniel Calder'].includes(p.name)));
});

test('the future staff generator is isolated in tests, not mounted into the game',()=>{
 const tracks=Array.from({length:world.counts.tracks},(_,i)=>world.trackAt(i));
 const generate=seed=>createFoundingProfessionals1999({
  seed,protectedNames:world.sourcePeople.map(p=>p.name),tracks});
 const candidates=generate(19990101);
 assert.equal(candidates.length,Object.values(foundingProfessionalCounts).reduce((a,b)=>a+b,0));
 assert.equal(candidates.length,68);
 assert.ok(candidates.every(p=>p.id.startsWith('P-FOUNDING-STAFF-')));
 assert.ok(candidates.every(p=>p.employerOrganizationId===null&&p.employmentStatus==='AVAILABLE_UNCONTRACTED'));
 assert.ok(candidates.every(p=>!p.contractedAtOpening&&p.payrollAnnual===0));
 assert.equal(new Set(candidates.map(p=>p.id)).size,68);
 assert.equal(new Set(candidates.map(p=>p.name.toLowerCase())).size,68);
 assert.ok(candidates.every(p=>!world.sourcePeople.some(ap=>ap.id===p.id)));
 for(const [role,n] of Object.entries(foundingProfessionalCounts))
  assert.equal(candidates.filter(p=>p.role===role).length,n);
 assert.deepEqual(generate(19990101),candidates);
 assert.notEqual(generate(19990102)[0].name,candidates[0].name);
 assert.throws(()=>world.personAt(0),/Founding workforce index/);
});
