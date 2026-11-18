import test from 'node:test';
import assert from 'node:assert/strict';
import {createOrganizationNameRoster,ARCHIVAL_RACING_OWNER_NAME_MODEL,
 LEGACY_ARCHIVAL_RACING_OWNER_NAME_MODEL}
 from '../public/1999/engine/organization-name-engine.mjs';
import {regionalOrganizationNamingRoots}
 from '../public/1999/engine/organization-naming-styles.mjs';
import {CENSUS_2000_OWNER_SURNAMES}
 from '../public/1999/engine/census-2000-owner-surnames.mjs';
import {proposeScalable1999OwnerBusinessName,scalableOwnerNamingRoots,
 SCALABLE_OWNER_BUSINESS_NAME_MODEL,SCALABLE_OWNER_NAME_ATTEMPT_START,
 SCALABLE_OWNER_NAME_ATTEMPT_LIMIT}
 from '../public/1999/engine/scalable-owner-business-names-v11.mjs';

const norm=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');

test('V11 regional ownership proposals are deterministic, principal-linked, and never numbered',()=>{
 assert.match(SCALABLE_OWNER_BUSINESS_NAME_MODEL,/V11/);
 assert.match(ARCHIVAL_RACING_OWNER_NAME_MODEL,/V11/);
 assert.match(LEGACY_ARCHIVAL_RACING_OWNER_NAME_MODEL,/V10/);
 assert.equal(SCALABLE_OWNER_NAME_ATTEMPT_START,128);
 assert.ok(SCALABLE_OWNER_NAME_ATTEMPT_LIMIT>=2048);
 const kentucky=scalableOwnerNamingRoots('KENTUCKY');
 const florida=scalableOwnerNamingRoots('FLORIDA');
 assert.ok(kentucky.length>=45&&florida.length>=45);
 assert.ok(kentucky.length>regionalOrganizationNamingRoots('KENTUCKY').length);
 assert.ok(florida.length>regionalOrganizationNamingRoots('FLORIDA').length);
 assert.notDeepEqual(kentucky,florida);
 const args={seed:19990101,index:8672,attempt:134,principalName:'María Calderón',
  primarySurname:'Calderón',region:'FLORIDA',surnames:CENSUS_2000_OWNER_SURNAMES};
 const a=proposeScalable1999OwnerBusinessName(args);
 assert.equal(a,proposeScalable1999OwnerBusinessName(args));
 assert.match(a,/Calderón/);
 assert.ok(florida.some(root=>a.includes(root)),a);
 assert.doesNotMatch(a,/\d/,'business identities never use synthetic serials');
 assert.doesNotMatch(a,/\b(?:horse|owner)\s*\d+\b/i);
 assert.throws(()=>proposeScalable1999OwnerBusinessName({...args,attempt:127}),
  /Invalid scalable ownership-name/);
 assert.throws(()=>proposeScalable1999OwnerBusinessName({...args,surnames:'not-array'}),
  /Invalid scalable ownership-name/);
});

test('the actual archival owner roster has deterministic headroom for 29,000 organizations',()=>{
 const given='Avery|Bailey|Casey|Dakota|Ellis|Frankie|Harper|Jamie|Kendall|Logan|Morgan|Parker|Quinn|Riley|Sawyer|Taylor|Wren|Zion|Alex|Carmen|Derek|Elena|Felix|Grace|Imani|Julian|Kira|Leah|Mateo|Nora'.split('|');
 const principals=Array.from({length:29000},(_,i)=>
  given[i%given.length]+' '+CENSUS_2000_OWNER_SURNAMES[Math.floor(i/given.length)]);
 assert.equal(new Set(principals.map(norm)).size,29000);
 const references=['Clifton','Pegram','Wertheimer','Stronach','Melnyk','Farish','Vance'];
 const args={seed:19990101,ownerCount:29000,barnCount:0,farmCount:0,
  principalNames:principals,alignPrincipalSurnames:true,ownerSurnameReferences:references,
  ownerPartnershipLimit:3800,soleOwnerPercent:8,
  protectedNames:['Kingsmere Farm','Wetherby Plain','Four Corners Farm',
   'Crescent Mile Farm','Davenport Hall Farm','Split Rail Farm']};
 const result=createOrganizationNameRoster(args);
 assert.equal(result.model,ARCHIVAL_RACING_OWNER_NAME_MODEL);
 assert.equal(result.summary.ownerCapacityModel,SCALABLE_OWNER_BUSINESS_NAME_MODEL);
 assert.equal(result.summary.ownerCandidateAttemptBudget,SCALABLE_OWNER_NAME_ATTEMPT_LIMIT);
 assert.equal(result.owners.length,29000);
 assert.equal(new Set(result.owners.map(norm)).size,29000);
 // V11 must actually enrich normal new-world names rather than merely
 // adding an unreachable emergency fallback after all owners are issued.
 const newRoots=['Round Cedar','Long Hollow','Twin Pines','Three Willows',
  'White Fence Ridge','Copper Field','Oak Branch','Old Mill Road','Meadow Fork'];
 assert.ok(result.owners.filter(name=>
  newRoots.some(root=>name.includes(root))).length>=500,
 'V11-only regional owner names must enter the playable opening roster');
 assert.ok(result.owners.every(s=>typeof s==='string'&&s.length>=5&&!/\d/.test(s)));
 assert.ok(result.summary.partnershipGroupsCreated<=3800);
 assert.ok(result.owners.every(n=>!args.protectedNames.some(p=>norm(n)===norm(p))));
 assert.deepEqual(result,createOrganizationNameRoster(args),
  'same new-world seed must always yield the same durable organization IDs/names');
});

test('three consecutive 5,000-owner generations protect all earlier identities',()=>{
 const given='Avery Bailey Casey Dakota Ellis Frankie Harper Jamie Kendall Logan Morgan Parker Quinn Riley Sawyer Taylor Wren Zion Alex Carmen Derek Elena Felix Grace Imani Julian Kira Leah Mateo Nora'.split(' ');
 const protectedNames=['Kingsmere Farm','Davenport Hall Farm','Split Rail Farm'];
 const count=5000;
 for(let generation=0;generation<3;generation++){
  const seed=19990101+generation;
  const principals=Array.from({length:count},(_,i)=>
   given[(i+generation*3)%given.length]+' '+
   CENSUS_2000_OWNER_SURNAMES[Math.floor(i/given.length)]);
  const current=createOrganizationNameRoster({
   seed,ownerCount:count,barnCount:0,farmCount:0,
   principalNames:principals,ownerSurnameReferences:[
    'Clifton','Pegram','Wertheimer','Stronach','Melnyk','Farish','Vance'
   ],ownerPartnershipLimit:1000,soleOwnerPercent:8,
   alignPrincipalSurnames:true,protectedNames
  });
  const previous=new Set(protectedNames.map(norm));
  assert.equal(current.owners.length,count);
  assert.ok(current.owners.every(name=>!previous.has(norm(name))),
   'later cohorts cannot take any earlier owner or approved founding identity');
  protectedNames.push(...current.owners);
  assert.equal(new Set(protectedNames.map(norm)).size,3+(generation+1)*count);
 }
});

test('new-world approved owners, studs and racing barns remain locked beside protected people',()=>{
 const principalNames=['Alex West','Mina Brown','Nora Hale','Jasper North'];
 const args={seed:19990101,ownerCount:4,barnCount:2,farmCount:2,
  principalNames,trainerNames:['Daniel Holt','Tara Quinn'],
  ownerSurnameReferences:['Clifton','Pegram','Vance'],
  soleOwnerPercent:100,ownerPartnershipLimit:1,
  protectedNames:['Historic Thoroughbreds'],
  protectedPersonNames:principalNames,
  sourceOwnerNames:['Established Racing Partners'],
  sourceFarmNames:['Kingsmere Stud'],
  sourceBarnNames:['Prescott Racing Barn'],
  farmKindPlan:['STUD_FARM','FARM']};
 const result=createOrganizationNameRoster(args);
 assert.equal(result.owners[0],'Established Racing Partners');
 assert.equal(result.farms[0],'Kingsmere Stud');
 assert.equal(result.farmKinds[0],'STUD_FARM');
 assert.equal(result.barns[0],'Prescott Racing Barn');
 assert.equal(result.summary.partnershipGroupsCreated,1,
  'approved group consumes the real partnership ceiling');
 assert.deepEqual(result.owners.slice(1),principalNames.slice(1),
  'person-name reservations must not suppress their rightful sole owner label');
 const issued=[...result.owners,...result.farms,...result.barns];
 assert.equal(new Set(issued.map(norm)).size,issued.length);
 assert.deepEqual(result,createOrganizationNameRoster(args));
 const contested=createOrganizationNameRoster({...args,
  sourceOwnerNames:['Mina Brown']});
 assert.equal(contested.owners[0],'Mina Brown',
  'existing approved name always wins before a new sole-owner candidate');
 assert.notEqual(norm(contested.owners[1]),norm('Mina Brown'));
 assert.throws(()=>createOrganizationNameRoster({...args,
  sourceOwnerNames:['Kingsmere Stud']}),/Duplicate approved source organization name/);
 assert.throws(()=>createOrganizationNameRoster({...args,
  ownerPartnershipLimit:0}),/Approved source partnerships exceed naming group ceiling/);
});

test('no archival source keeps the previously frozen V7 candidate path and business roster',()=>{
 const args={seed:19990101,ownerCount:200,barnCount:14,farmCount:25,
  principalNames:Array.from({length:200},(_,i)=>'Owner '+i+' Mercer'),
  trainerNames:Array.from({length:14},(_,i)=>'Trainer '+i+' Holt')};
 const a=createOrganizationNameRoster(args);
 assert.notEqual(a.model,ARCHIVAL_RACING_OWNER_NAME_MODEL);
 assert.ok(!Object.hasOwn(a.summary,'ownerCapacityModel'));
 assert.equal(a.summary.maxDistinctiveRootUses,6);
 assert.deepEqual(a,createOrganizationNameRoster(args));
 const b=createOrganizationNameRoster({...args,
  ownerSurnameReferences:['Clifton','Stronach']});
 assert.equal(b.model,ARCHIVAL_RACING_OWNER_NAME_MODEL);
 assert.ok(b.summary.ownerCandidateAttemptBudget>512);
});
