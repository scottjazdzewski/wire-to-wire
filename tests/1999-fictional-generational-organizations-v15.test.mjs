import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {readFileSync} from 'node:fs';
import {
 createFictionalWorldNameEngine
} from '../public/1999/engine/fictional-world-name-engine.mjs';
import {
 organizationNamingEra,generationalOrganizationNamingEra,
 generationalOrganizationNamingPeriod,GENERATIONAL_ORGANIZATION_NAME_MODEL,
 generationalFarmCandidate,generationalOwnerCandidate,
 generationalStableCandidate,generationalBreakingCandidate
} from '../public/1999/engine/organization-naming-styles.mjs';
import {
 auditGenerationalOrganizationNames,GENERATIONAL_ORGANIZATION_QUALITY_MODEL
} from '../public/1999/engine/generational-organization-quality-v15.mjs';
import {auditFictionalIdentityNaming}
 from '../public/1999/engine/fictional-name-quality-audit.mjs';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';

const spec={worldId:'V15-Editorial-Names',seed:19990101,
 roles:{trainer:175,jockey:55,farm_manager:13,bloodstock_agent:15},
 owners:140,facilities:{generalFarms:14,studFarms:9,nurseries:5,
  bloodstockFarms:6,breakingTraining:5},
 ownerNamingPolicy:{partnershipLimit:10,soleOwnerPercent:23}};
const norm=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');

test('V15 explicitly preserves frozen 1999 names and manifest fingerprint',()=>{
 const w=createFictionalWorldNameEngine({
  worldId:'Eras-Compatibility',seed:19990101,year:1999,
  roles:{trainer:200,jockey:80,farrier:15,bloodstock_agent:20},
  owners:130,facilities:{generalFarms:12,studFarms:7,nurseries:3}
 });
 assert.equal(w.manifest.fingerprint,'64afc00b');
 assert.equal(w.manifest.schema,'WTW_FICTIONAL_WORLD_IDENTITIES_V7');
 assert.ok(!Object.hasOwn(w.manifest,'generationalOrganizationNameModel'));
 assert.equal(w.people.length,445);
 assert.equal(w.owners.length+w.stables.length+w.farms.length+
  w.trainingCenters.length,352);
 assert.deepEqual(w.people.slice(0,9).map(x=>x.name),[
  'William Gallagher','Thomas Becker','Michelle Carroll','Patricia Jones',
  'David Baker','Peter Y. Smith','Joshua Davis','Jeffrey Williams','Ángel Ramírez'
 ]);
 assert.deepEqual(w.farms.slice(0,5).map(x=>x.name),[
  'Live Oak Trace Thoroughbred Nursery','Frazier Thoroughbred Nursery',
  'Tates Creek Foster Acres','Rancho Piedra Stud','Greenbriar Farm'
 ]);
 assert.ok(w.owners.every(o=>!Object.hasOwn(o,'organizationNamingModel')));
 assert.ok(w.farms.every(o=>!Object.hasOwn(o,'organizationNamingPeriod')));
 const audit=auditGenerationalOrganizationNames(w,{expectedYear:1999});
 assert.equal(audit.pass,true,JSON.stringify(audit.issues));
 assert.equal(audit.model,GENERATIONAL_ORGANIZATION_QUALITY_MODEL);
});
test('later organization styles reflect decades, with correct regional roots and principal surnames',()=>{
 const eras=[2005,2019,2020,2035,2050,2060,2099],
  namesByYear=new Map();
 for(const year of eras){
  const w=createFictionalWorldNameEngine({...spec,year});
  const audit=auditGenerationalOrganizationNames(w,{
   expectedYear:year,partnershipLimit:10
  });
  const existing=auditFictionalIdentityNaming(w);
  assert.equal(audit.pass,true,JSON.stringify(audit.issues));
  assert.equal(existing.pass,true,JSON.stringify(existing.issues));
  assert.equal(w.manifest.generationalOrganizationNameModel,
   GENERATIONAL_ORGANIZATION_NAME_MODEL);
  assert.equal(w.manifest.generationalOrganizationPeriod,
   generationalOrganizationNamingPeriod(year));
  assert.ok(w.manifest.ownershipPartnershipsMinted<=10);
  assert.equal(audit.partnershipsIssued,w.manifest.ownershipPartnershipsMinted);
  assert.ok(Object.keys(audit.regions).length>=7);
  assert.ok((audit.archetypes.FAMILY_OPERATION??0)>3);
  assert.ok((audit.archetypes.PRIVATE_RACING_OPERATION??0)>25);
  assert.ok((audit.archetypes.INDIVIDUAL_OWNER??0)>10);
  assert.ok(audit.styles.CONTEMPORARY>10);
  for(const owner of w.owners){
   assert.equal(owner.organizationNamingModel,GENERATIONAL_ORGANIZATION_NAME_MODEL);
   if(owner.ownershipArchetype==='FAMILY_OPERATION'&&owner.familyName){
    const p=w.people.find(p=>p.id===owner.principalId);
    assert.equal(norm(owner.familyName),norm(p.primarySurname));
   }
  }
  for(const org of [...w.stables,...w.farms,...w.trainingCenters])
   assert.equal(org.organizationNamingPeriod,
    generationalOrganizationNamingPeriod(year));
  namesByYear.set(year,{
   owners:w.owners.map(x=>x.name),stables:w.stables.map(x=>x.name),
   farms:w.farms.map(x=>x.name)
  });
  assert.deepEqual(w,createFictionalWorldNameEngine({...spec,year}));
 }
 // Site names are tied to long editorial periods, not regenerated simply
 // because the calendar advances by a single year within the same period.
 assert.deepEqual(namesByYear.get(2005).farms,namesByYear.get(2019).farms);
 assert.notDeepEqual(namesByYear.get(2019).owners,namesByYear.get(2020).owners);
 assert.notDeepEqual(namesByYear.get(2035).farms,namesByYear.get(2050).farms);
 assert.equal(generationalOrganizationNamingPeriod(1999),'FROZEN_1999');
 assert.equal(generationalOrganizationNamingPeriod(2000),'EARLY_21ST_CENTURY');
 assert.equal(generationalOrganizationNamingPeriod(2020),'CONTEMPORARY_EDITORIAL');
 assert.equal(generationalOrganizationNamingPeriod(2050),'FUTURE_EDITORIAL');
 assert.throws(()=>generationalOrganizationNamingPeriod(2100),/2000–2099/);
});
test('future names cannot invent another co-owner or change the supplied trainer',()=>{
 const owner=generationalOwnerCandidate(19990101,1,0,
  'María López','López',{region:'KENTUCKY',era:'CONTEMPORARY',namingYear:2035});
 const stable=generationalStableCandidate(19990101,3,0,
  'Thiago González','González',{region:'FLORIDA',namingYear:2050});
 assert.ok(typeof owner==='string'&&owner.length>5);
 assert.ok(typeof stable==='string'&&stable.length>5);
 assert.doesNotMatch(owner,/\b(?:Surnames|Person2|Name2)\b/);
 assert.doesNotMatch(stable,/\b(?:John Smith|Jane Doe)\b/);
 assert.match(generationalFarmCandidate(101,2,4,'STUD_FARM',{
  namingYear:2040,region:'KENTUCKY'}),/\b(?:Stud|Stallion)\b/);
 assert.match(generationalBreakingCandidate(101,2,4,{
  namingYear:2060,region:'ONTARIO'}),/\b(?:Training|Development)\b/);
 assert.equal(generationalOrganizationNamingEra(44,2,'owner',1999),
  organizationNamingEra(44,2,'owner'));
 assert.throws(()=>generationalOwnerCandidate(44,2,0,
  'María López','López',{namingYear:1999}),/2000–2099/);
});
test('organization-specific QA catches rewritten era, mismatched families and wrong archetypes',()=>{
 const year=2035,w=createFictionalWorldNameEngine({...spec,year}),
  fam=w.owners.find(o=>o.familyName);
 assert.ok(fam);
 const broken={...w,
  owners:w.owners.map(o=>o.id===fam.id?{
   ...o,familyName:'Invented Relative',ownershipArchetype:'RACING_COMPANY',
   organizationNamingPeriod:'FROZEN_1999'}:o),
  stables:w.stables.map((o,i)=>i===0?{...o,trainerId:'NO_TRAINER'}:o)
 };
 const qa=auditGenerationalOrganizationNames(broken);
 assert.equal(qa.pass,false);
 assert.ok(qa.issueCounts.WRONG_PERIOD>=1);
 assert.ok(qa.issueCounts.FALSE_FAMILY_NAME>=1);
 assert.ok(qa.issueCounts.OWNER_ARCHETYPE_MISMATCH>=1);
 assert.ok(qa.issueCounts.STABLE_TRAINER_MISMATCH>=1);
 assert.ok(qa.issues.length>=3);
 assert.throws(()=>auditGenerationalOrganizationNames(w,{expectedYear:1999}),/year mismatch/);
});
test('decades of indexed requests limit new partnerships while preserving every issued identity',()=>{
 const worldId='V15-LONG-GAME-TEST',seed=19990101;
 const reg=createIndexedFictionalNameRegistry({worldId,seed,
  protectedPeople:['Canon Protected Jockey'],
  protectedOrganizations:['Kingsmere Farm','Historic Stud']});
 let cursor=null,issued=0,owners=0;
 const openingNames=new Map();
 for(let index=0;index<32;index++){
  const year=1999+Math.floor(index*100/31);
  const batch=generateIndexedFictionalNames({registry:reg,worldId,seed,cursor,year,
   roles:{trainer:30,jockey:18,farrier:5},owners:42,
   facilities:{generalFarms:3,studFarms:1,nurseries:1},
   maxPartnershipGroups:12,soleOwnerPercent:23
  });
  const qa=auditGenerationalOrganizationNames(batch,{expectedYear:year,
   partnershipLimit:12});
  const identity=auditFictionalIdentityNaming(batch);
  assert.equal(qa.pass,true,JSON.stringify(qa.issues));
  assert.equal(identity.pass,true,JSON.stringify(identity.issues));
  issued+=batch.people.length+identity.organizations;
  owners+=batch.owners.length;
  if(index===0)for(const o of batch.owners)openingNames.set(o.id,o.name);
  cursor=batch.nextCursor;
  assert.equal(cursor.year,year);
  assert.ok(cursor.partnershipsIssued<=12);
  assert.ok(JSON.stringify(cursor).length<350);
 }
 assert.equal(reg.namesIssued,issued);
 assert.equal(reg.ownerCount,owners);
 assert.equal(reg.formalGroupsIssued,12);
 for(const row of reg.listOwners({limit:200}))
  if(openingNames.has(row.id))assert.equal(row.name,openingNames.get(row.id));
 assert.equal(reg.index.hasAnyName('Kingsmere Farm'),true);
 assert.ok(!reg.listGroups({limit:50}).some(x=>x.name==='Kingsmere Farm'));
});
test('V14 generational stress benchmark now also checks V15 organizations',()=>{
 const script=new URL('../scripts/bench-generational-naming-v14.mjs',import.meta.url).pathname;
 const raw=execFileSync(process.execPath,[script,
  '--batches','7','--owners','28','--trainers','20','--jockeys','15',
  '--farms','4','--historic','400','--start','1999','--end','2099'
 ],{encoding:'utf8',timeout:90000});
 const result=JSON.parse(raw);
 assert.equal(result.benchmark,'WTW-GENERATIONAL-NAMING-V14');
 assert.equal(result.organizationQualityModel,GENERATIONAL_ORGANIZATION_QUALITY_MODEL);
 assert.equal(result.counts.issues,0);
 assert.equal(result.playableWorldModified,false);
 assert.equal(result.options.batches,7);
 assert.equal(result.owners,196);
 assert.ok(result.finalCursorBytes<350);
});
test('V15 module and checks cannot write game world, user records, or horses',()=>{
 const styles=readFileSync(new URL('../public/1999/engine/organization-naming-styles.mjs',
  import.meta.url),'utf8');
 const audit=readFileSync(new URL('../public/1999/engine/generational-organization-quality-v15.mjs',
  import.meta.url),'utf8');
 const game=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',
  import.meta.url),'utf8');
 assert.doesNotMatch(styles+audit,/\b(?:fetch|indexedDB|localStorage|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(game,/generational-organization-quality-v15/);
 assert.doesNotMatch(game,/generationalOrganizationNamingEra/);
});
