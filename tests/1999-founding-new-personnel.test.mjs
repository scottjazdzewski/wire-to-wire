import test from 'node:test';
import assert from 'node:assert/strict';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {createFoundingProfessionals1999,foundingProfessionalCounts} from
 '../public/1999/engine/founding-personnel-1999.mjs';

const w=createFounding1999Universe({seed:19990101});
const candidates=Array.from({length:Object.values(foundingProfessionalCounts).reduce((a,b)=>a+b,0)},
 (_,i)=>w.personAt(i));

test('hard-reset staff are NEW scenario identities only, not the 325k-era generated pool',()=>{
 assert.equal(candidates.length,68);
 assert.equal(w.counts.people,w.sourcePeople.length+candidates.length);
 assert.equal(w.audit.newProfessionalPool,68);
 assert.equal(w.audit.originalGeneratedStaffImported,0);
 assert.ok(candidates.every(p=>p.id.startsWith('P-FOUNDING-STAFF-')));
 assert.ok(candidates.every(p=>p.source==='FRESH_FOUNDING_1999_GENERATED_PERSON_NOT_LEGACY_ROSTER'));
 assert.ok(candidates.every(p=>p.employerOrganizationId===null&&p.employmentStatus==='AVAILABLE_UNCONTRACTED'));
 assert.ok(candidates.every(p=>p.payrollAnnual===0&&!p.contractedAtOpening));
 assert.ok(candidates.every(p=>p.name&&!/\d$/.test(p.name)));
 assert.equal(new Set(candidates.map(x=>x.id)).size,68);
 assert.equal(new Set(candidates.map(x=>x.name.toLowerCase())).size,68);
 assert.ok(candidates.every(p=>!['groom','exercise_rider'].includes(p.role)));
 assert.throws(()=>w.personAt(68),/Founding workforce index/);
});

test('foundation people have exact role counts, geographic names, and age-appropriate ability',()=>{
 for(const [role,n] of Object.entries(foundingProfessionalCounts))
  assert.equal(candidates.filter(p=>p.role===role).length,n,role);
 const claimed=new Set(w.sourcePeople.map(p=>p.name.toLowerCase()));
 assert.ok(candidates.every(p=>!claimed.has(p.name.toLowerCase())));
 for(const person of candidates){
  assert.ok(person.location?.city||person.location?.state,person.id+' home base');
  assert.ok(person.baseTrackId?.startsWith('T-'),person.id+' circuit');
  assert.ok(person.age>=18&&person.age<=72,person.id+' age');
  assert.equal(person.ability.age,person.age);
  assert.ok(person.ability.peakAge>0);
  assert.ok(person.ability.current>=1&&person.ability.current<=99);
  assert.ok(person.ability.potential>=person.ability.current);
  assert.ok(person.ability.potential<=99);
  assert.ok(Object.keys(person.attributes).length>=10);
  assert.ok(Object.values(person.attributes).every(x=>typeof x==='number'&&x>=0&&x<=1));
  assert.ok(person.birthCountry,person.id+' origin');
  assert.equal(person.nameStatus,'PROVISIONAL_FOUNDING_GAME_PERSON');
 }
 const riders=candidates.filter(p=>p.role==='jockey');
 assert.equal(riders.length,26);
 assert.ok(riders.every(p=>p.compensation.mountFee>0&&p.compensation.notGuaranteedSalary));
 assert.ok(riders.every(p=>p.bookingMarket.competingBarns.length===0));
 assert.ok(riders.some(p=>['PR','PA','VE','MX','CL','PE','CO','DO'].includes(p.birthCountry)),
 'jockey naming should include Latin-American origins');
});

test('new founding professionals reproduce exactly for same seed without shadow personnel IDs',()=>{
 const tracks=Array.from({length:w.counts.tracks},(_,i)=>w.trackAt(i));
 const another=createFoundingProfessionals1999({
  seed:19990101,protectedNames:w.sourcePeople.map(p=>p.name),tracks});
 assert.deepEqual(another,candidates.map(({bookingMarket,...x})=>x));
 const changed=createFoundingProfessionals1999({
  seed:19990102,protectedNames:w.sourcePeople.map(p=>p.name),tracks});
 assert.notEqual(another[0].name,changed[0].name);
 assert.ok(another.every(x=>!x.id.startsWith('P-TEST-')));
});
