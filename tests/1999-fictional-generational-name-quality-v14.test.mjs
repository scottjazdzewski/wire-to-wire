import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {createIndexedFictionalNameRegistry,generateIndexedFictionalNames}
 from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {auditFictionalGenerationalNameQuality,
 GENERATIONAL_NAMING_QUALITY_MODEL}
 from '../public/1999/engine/generational-name-quality-v14.mjs';
import {auditFictionalIdentityNaming}
 from '../public/1999/engine/fictional-name-quality-audit.mjs';

const spec={worldId:'V14-QUALITY-TEST',seed:19990101,
 roles:{trainer:130,jockey:90,bloodstock_agent:35,farrier:20},
 owners:120,facilities:{generalFarms:5,studFarms:2,nurseries:2}};
test('cohort audit accepts genuine 1999, 2030, 2050, 2099 proposal names and distinguishes source evidence',()=>{
 for(const year of [1999,2030,2050,2099]){
  const w=createFictionalWorldNameEngine({...spec,year});
  const qa=auditFictionalGenerationalNameQuality(w,{expectedYear:year});
  assert.equal(qa.model,GENERATIONAL_NAMING_QUALITY_MODEL);
  assert.equal(qa.pass,true,JSON.stringify(qa.issues));
  assert.equal(qa.issueTotal,0);
  assert.equal(qa.people,395);
  assert.ok(qa.distinctGivenNames>90);
  assert.ok(qa.distinctSurnames>100);
  assert.equal(Object.values(qa.birthDecades).reduce((a,b)=>a+b,0),qa.people);
  assert.equal(Object.values(qa.namingOrigins).reduce((a,b)=>a+b,0),qa.people);
  if(year===1999){
   assert.equal(qa.nameGeneratorModel,null);
   assert.equal(qa.birthYearAfter1989,0);
  }else{
   assert.match(qa.nameGeneratorModel,/V13/);
   assert.ok(qa.birthYearAfter1989>0);
   assert.ok(Object.keys(qa.evidenceTypes).some(x=>x.includes('SSA_US')));
  }
  if(year===2099){
   assert.ok(qa.birthYearAfter2025>300);
   assert.ok(Object.keys(qa.evidenceTypes).includes('EDITORIAL_FUTURE_US_NOT_OBSERVED'));
  }
  assert.deepEqual(qa,auditFictionalGenerationalNameQuality(w,{expectedYear:year}));
 }
});
test('quality gate rejects bad birth cohorts, country/culture surnames and falsified source claims',()=>{
 const w=createFictionalWorldNameEngine({...spec,year:2050});
 const american=w.people.find(p=>p.birthCountry==='US'&&p.birthYear>2000);
 const overseas=w.people.find(p=>p.birthCountry==='GB'&&p.birthYear>1990);
 assert.ok(american&&overseas);
 const bad={
  ...w,
  people:w.people.map(p=>p.id===american.id?
   {...p,name:'ImaginaryUnregisteredGiven Jones',
    generationalNameEvidence:'SSA_US_DECADE_TOP30_RANK_EDITORIAL_DRAW',
    nameOrigin:'SSA_US_DECADE_TOP30_RANK_EDITORIAL_DRAW',ageAtOpening:120}:
   p.id===overseas.id?
    {...p,primarySurname:'CompletelyMadeUpEnglishSurname'}:p)
 };
 const qa=auditFictionalGenerationalNameQuality(bad);
 assert.equal(qa.pass,false);
 assert.ok(qa.issueCounts.WRONG_GIVEN_COHORT>=1);
 assert.ok(qa.issueCounts.WRONG_CULTURAL_SURNAME>=1);
 assert.ok(qa.issueCounts.INVALID_PROFESSIONAL_AGE>=1);
 assert.ok(qa.issues.length>=3&&qa.issues.length<=32);
 assert.throws(()=>auditFictionalGenerationalNameQuality(w,{expectedYear:2040}),
  /mismatch/);
 assert.throws(()=>auditFictionalGenerationalNameQuality({people:[]}),
  /Invalid/);
});
test('improper future source labels and altered 1999 metadata cannot pass period QA',()=>{
 const fresh=createFictionalWorldNameEngine({...spec,year:2099});
 const modern=fresh.people.find(p=>p.birthCountry==='US'&&p.birthYear>=2026);
 assert.ok(modern);
 const fake={...fresh,people:fresh.people.map(p=>p.id===modern.id?
  {...p,nameOrigin:'SSA_US_DECADE_TOP30_RANK_EDITORIAL_DRAW'}:p)};
 const qa=auditFictionalGenerationalNameQuality(fake);
 assert.equal(qa.pass,false);
 assert.ok(qa.issueCounts.WRONG_NAME_SOURCE>0);
 const legacy=createFictionalWorldNameEngine({...spec,year:1999});
 const altered={...legacy,people:[{
  ...legacy.people[0],generationalNameEvidence:'EDITORIAL_FUTURE_US_NOT_OBSERVED'
 },...legacy.people.slice(1)]};
 const audit=auditFictionalGenerationalNameQuality(altered);
 assert.ok(!audit.pass&&audit.issueCounts.LEGACY_1999_CHANGED===1);
});
test('many sequential naming requests preserve canonical owner IDs and session caps across decades',()=>{
 const worldId='V14-INCREMENTAL-LIFETIME',seed=325555;
 const registry=createIndexedFictionalNameRegistry({
  worldId,seed,
  protectedPeople:['Protected Canon Rider'],
  protectedOrganizations:['Protected Canon Stud']
 });
 let cursor=null,issued=0,people=0;
 for(let i=0;i<16;i++){
  const year=1999+Math.floor(i*100/15);
  const batch=generateIndexedFictionalNames({
   registry,worldId,seed,year,cursor,
   roles:{trainer:15,jockey:9,farrier:3},owners:25,
   facilities:{generalFarms:2,studFarms:1},
   maxPartnershipGroups:8
  });
  const generational=auditFictionalGenerationalNameQuality({
   manifest:batch.manifest,people:batch.people
  },{expectedYear:year});
  const quality=auditFictionalIdentityNaming({
   ...batch,protectedNames:['Protected Canon Rider','Protected Canon Stud']
  });
  assert.equal(generational.pass,true,JSON.stringify(generational.issues));
  assert.equal(quality.pass,true,JSON.stringify(quality.issues));
  cursor=batch.nextCursor;
  people+=batch.people.length;issued+=batch.people.length+
   batch.owners.length+batch.stables.length+batch.farms.length+
   batch.trainingCenters.length;
  assert.equal(cursor.year,year);
  assert.ok(cursor.partnershipsIssued<=8);
  assert.ok(JSON.stringify(cursor).length<350);
 }
 assert.equal(registry.namesIssued,issued);
 assert.equal(registry.ownerCount,400);
 assert.equal(people,16*52);
 assert.equal(cursor.revision,16);
 assert.equal(registry.formalGroupsIssued<=8,true);
 assert.ok(registry.hasAnyName('Protected Canon Stud'));
});
test('CLI stress runner produces only synthetic statistics and maintains bounded naming cursors',()=>{
 const script=new URL('../scripts/bench-generational-naming-v14.mjs',import.meta.url).pathname;
 const out=JSON.parse(execFileSync(process.execPath,[script,
  '--batches','6','--owners','15','--trainers','12','--jockeys','9',
  '--farms','3','--historic','250','--start','1999','--end','2099'
 ],{encoding:'utf8',timeout:90000}));
 assert.equal(out.benchmark,'WTW-GENERATIONAL-NAMING-V14');
 assert.equal(out.disposable,true);
 assert.equal(out.playableWorldModified,false);
 assert.equal(out.options.batches,6);
 assert.equal(out.owners,90);
 assert.equal(out.counts.issues,0);
 assert.equal(out.issuedNames,out.counts.people+out.counts.organizations);
 assert.ok(out.finalCursorBytes<350);
 assert.ok(out.cursorGrowthBytes<20);
 assert.equal(Object.values(out.byEra).reduce((a,b)=>a+b,0),out.counts.people);
});
test('generation quality gate is read only and does not touch history, game world, horses or UI',()=>{
 const file=readFileSync(new URL('../public/1999/engine/generational-name-quality-v14.mjs',import.meta.url),'utf8');
 const source=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(file,/\b(?:fetch|indexedDB|writeFile|setItem|localStorage)\s*\(/);
 assert.doesNotMatch(source,/generational-name-quality-v14/);
});
