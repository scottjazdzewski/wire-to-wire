import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {
 certifyFictionalIndustryV21,
 FICTIONAL_INDUSTRY_CERTIFICATION_MODEL_V21
} from '../scripts/certify-fictional-industry-v21.mjs';
import {createFictionalOrganizationContinuityRegistry}
 from '../public/1999/engine/fictional-organization-continuity-v16.mjs';
import {createFictionalIndustryReuseIndexV20}
 from '../public/1999/engine/fictional-industry-operations-v20.mjs';
import {
 assessFictionalOrganizationReadinessV21,auditFictionalIndustryReadinessV21,
 FICTIONAL_INDUSTRY_READINESS_MODEL_V21
} from '../public/1999/engine/fictional-industry-readiness-v21.mjs';

const event=(eventId,type,year,details={})=>({
 eventId,type,sourceId:'V21_SYNTHETIC_'+eventId,year,...details
});
const foundation=()=>({
 worldId:'V21-LEADER-SAFETY-ONLY',foundingYear:1999,
 people:[
  {id:'P-OWNER',name:'Marion Wallace',role:'owner',
   primarySurname:'Wallace',birthYear:1950},
  {id:'P-TRAINER',name:'José Arroyo',role:'trainer',
   primarySurname:'Arroyo',birthYear:1960},
  {id:'P-MANAGER',name:'Anne Greenwood',role:'farm_manager',
   primarySurname:'Greenwood',birthYear:1974}
 ],
 owners:[{id:'O-OWNER',name:'Copper Vale Racing Company',
  ownershipArchetype:'RACING_COMPANY',principalId:'P-OWNER',
  namingRegion:'KENTUCKY'}],
 stables:[{id:'O-STABLE',name:'Midway Creek Racing Stable',
  trainerId:'P-TRAINER',namingRegion:'KENTUCKY'}],
 farms:[{id:'O-FARM',name:'Gold Trace Thoroughbred Farm',
  managerIds:['P-MANAGER'],namingRegion:'KENTUCKY'}],
 trainingCenters:[{id:'O-UNSTAFFED',name:'Pine Hollow Training Center',
  managerIds:[],namingRegion:'KENTUCKY'}]
});
const apply=(reg,e)=>reg.apply({expectedRevision:reg.revision,event:e});
test('V21 readiness audit detects implausible aged, unavailable and unstaffed management without inventing identities',()=>{
 const source=foundation(),foundingBefore=JSON.stringify(source);
 const reg=createFictionalOrganizationContinuityRegistry({source});
 for(const id of ['O-OWNER','O-STABLE','O-FARM','O-UNSTAFFED'])
  apply(reg,event('CAP-'+id,'SET_OPERATING_CAPACITY',2099,{
   organizationId:id,horseSlots:75
  }));
 const audit=auditFictionalIndustryReadinessV21({
  continuity:reg,year:2099,sampleLimit:10
 });
 assert.equal(audit.model,FICTIONAL_INDUSTRY_READINESS_MODEL_V21);
 assert.equal(audit.inspected,4);
 assert.equal(audit.ready,0);
 assert.equal(audit.needsDecision,4);
 assert.ok(audit.byIssueCode.IMPLAUSIBLE_ACTIVE_AGE>=3);
 assert.equal(audit.byIssueCode.UNSTAFFED_OPERATION,1);
 assert.equal(audit.samples.length,4);
 assert.equal(reg.organizationCount,4);
 const plan=createFictionalIndustryReuseIndexV20({continuity:reg});
 const summary=plan.getSummary({kind:'STABLE'}).byKind.STABLE;
 assert.equal(summary.activeOrganizations,1);
 assert.equal(summary.notReadyOrganizations,1);
 assert.equal(summary.blockedCapacitySlots,75);
 assert.equal(summary.freeSlots,0);
 assert.equal(plan.findReusable({
  kind:'STABLE',region:'KENTUCKY'
 }).candidates.length,0);
 assert.equal(JSON.stringify(source),foundingBefore);
 assert.equal(reg.getOrganization('O-STABLE').name,
  'Midway Creek Racing Stable');
});
test('V21 audited organization status is read-only and flags retired, unavailable and role-incompatible leaders',()=>{
 const person={id:'P1',role:'trainer',retired:false,
  birthYear:2000,availability:'AVAILABLE'};
 const organization={id:'STABLE-CHECK',kind:'STABLE',
  name:'Fictional Stable',status:'ACTIVE',trainerId:'P1'};
 const getPerson=()=>person;
 const ready=assessFictionalOrganizationReadinessV21({
  organization,getPerson,year:2040
 });
 assert.equal(ready.ready,true);
 const retired=assessFictionalOrganizationReadinessV21({
  organization,getPerson:()=>({...person,retired:true,
   availability:'ON_LEAVE',role:'owner'}),year:2040
 });
 assert.equal(retired.ready,false);
 assert.deepEqual(retired.issues.map(x=>x.code),[
  'WRONG_PROFESSIONAL_ROLE','RETIRED_LEADER','UNAVAILABLE_LEADER'
 ]);
 const closed=assessFictionalOrganizationReadinessV21({
  organization:{...organization,status:'CLOSED'},
  getPerson,year:2040
 });
 assert.equal(closed.issues[0].code,'CLOSED_OPERATION');
 const missing=assessFictionalOrganizationReadinessV21({
  organization,getPerson:()=>null,year:2040
 });
 assert.equal(missing.issues[0].code,'MISSING_APPROVED_PERSON');
 assert.equal(organization.name,'Fictional Stable');
});
test('V21 final synthetic 1999–2099 certification preserves legacy name fingerprint, approvals, succession and backups',async()=>{
 const certificate=await certifyFictionalIndustryV21();
 assert.equal(certificate.model,FICTIONAL_INDUSTRY_CERTIFICATION_MODEL_V21);
 assert.equal(certificate.result,'PASS');
 assert.equal(certificate.disposable,true);
 assert.equal(certificate.playableWorldModified,false);
 assert.equal(certificate.noHorsesCreated,true);
 assert.equal(certificate.yearStart,1999);
 assert.equal(certificate.yearEnd,2099);
 assert.equal(certificate.yearsTested,101);
 assert.equal(certificate.opening1999Fingerprint,'64afc00b');
 assert.equal(certificate.approvedNamingBatches,101);
 assert.ok(certificate.peopleRegistered>=500);
 assert.ok(certificate.organizationsRegistered>=400);
 assert.ok(certificate.totalContinuityEvents>1500);
 assert.equal(certificate.operatingCapacityEvents,
  certificate.organizationsRegistered);
 assert.ok(certificate.newPartnershipGroups<=12);
 assert.equal(certificate.generationalQualityIssues,0);
 assert.ok(certificate.generationalQualityYears.includes(1999));
 assert.ok(certificate.generationalQualityYears.includes(2099));
 assert.equal(certificate.permanentOriginalStable,true);
 assert.equal(certificate.retiredOriginalTrainer,true);
 assert.ok(certificate.flaggedAgingLeadership>0);
 assert.equal(certificate.archiveRestorationVerified,true);
 assert.ok(certificate.finalCursorBytes<300);
 assert.match(certificate.certificationDigest,/^sha256-[a-f0-9]{64}$/);
});
test('V21 certificate is reproducible from the same seed and intentionally carries no live-world information',async()=>{
 const first=await certifyFictionalIndustryV21();
 const again=await certifyFictionalIndustryV21();
 assert.deepEqual(again,first,
  'A frozen 101-year identity/career/organization scenario must not drift');
 assert.equal(first.newPartnershipGroups,again.newPartnershipGroups);
 assert.equal(first.archiveRestorationVerified,true);
 const cli=readFileSync(new URL(
  '../scripts/certify-fictional-industry-v21.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(cli,/\b(?:indexedDB|localStorage|writeFile|fetch|updateFile|putFile)\s*\(/);
 const boot=readFileSync(new URL(
  '../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(boot,/fictional-industry-readiness-v21|certify-fictional-industry-v21/);
});
test('V21 operator certification command emits parseable standalone PASS certificate',()=>{
 const command=new URL(
  '../scripts/certify-fictional-industry-v21.mjs',import.meta.url).pathname;
 const output=execFileSync(process.execPath,[command],{
  encoding:'utf8',timeout:90000,maxBuffer:1024*1024
 });
 const result=JSON.parse(output);
 assert.equal(result.model,FICTIONAL_INDUSTRY_CERTIFICATION_MODEL_V21);
 assert.equal(result.result,'PASS');
 assert.equal(result.yearStart,1999);
 assert.equal(result.yearEnd,2099);
 assert.equal(result.disposable,true);
 assert.equal(result.playableWorldModified,false);
 assert.equal(result.noHorsesCreated,true);
 assert.equal(result.archiveRestorationVerified,true);
 assert.match(result.certificationDigest,/^sha256-[a-f0-9]{64}$/);
});
