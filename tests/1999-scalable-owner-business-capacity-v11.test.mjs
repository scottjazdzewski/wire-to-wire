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
