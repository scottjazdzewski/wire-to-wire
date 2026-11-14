#!/usr/bin/env node
/**
 * WTW V21 — reproducible, throwaway 1999–2099 identity continuity certificate.
 *
 * This does NOT run a gameplay career, generate a live world, mint a horse,
 * or write any real IndexedDB/Drive/GitHub/Cloudflare state.
 * CI tests call certifyFictionalIndustryV21 directly; CLI prints JSON.
 */
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {auditFictionalGenerationalNameQuality}
 from '../public/1999/engine/generational-name-quality-v14.mjs';
import {auditGenerationalOrganizationNames}
 from '../public/1999/engine/generational-organization-quality-v15.mjs';
import {
 openDurableFictionalNameService,
 restoreDurableFictionalNamingBundle
} from '../public/1999/engine/durable-fictional-name-service.mjs';
import {
 restoreDurableOrganizationContinuityArchive
} from '../public/1999/engine/durable-organization-continuity-v17.mjs';
import {openFictionalIndustryIdentityBridge}
 from '../public/1999/engine/fictional-industry-identity-bridge-v18.mjs';
import {createFictionalIndustryReuseIndexV20}
 from '../public/1999/engine/fictional-industry-operations-v20.mjs';
import {auditFictionalIndustryReadinessV21}
 from '../public/1999/engine/fictional-industry-readiness-v21.mjs';

export const FICTIONAL_INDUSTRY_CERTIFICATION_MODEL_V21=
 'WTW_FICTIONAL_INDUSTRY_CERTIFICATE_V21';
const WORLD='V21-FINAL-CERTIFICATION-DISPOSABLE';
const SEED=19990101;
const copy=x=>JSON.parse(JSON.stringify(x));
function namingMemory(){
 const rows=new Map(),key=(worldId,seed)=>worldId+':'+seed;
 return {
  async read({worldId,seed}){return copy(rows.get(key(worldId,seed))??null)},
  async initialize(meta){
   const id=key(meta.worldId,meta.seed);
   if(rows.has(id))throw Error('Naming namespace already exists');
   rows.set(id,{meta:copy(meta),batches:[]});
  },
  async append({worldId,seed,expectedRevision,batch,cursor}){
   const row=rows.get(key(worldId,seed));
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Naming CAS refused stale certification batch');
   row.batches.push(copy(batch));row.meta.revision=cursor.revision;
   row.meta.cursor=copy(cursor);
  },
  async restore({meta,batches}){
   const id=key(meta.worldId,meta.seed);
   if(rows.has(id))throw Error('Refusing to overwrite naming certification');
   rows.set(id,copy({meta,batches}));
  }
 };
}
function continuityMemory(){
 const rows=new Map();
 return {
  async read({worldId}){return copy(rows.get(worldId)??null)},
  async initialize(meta){
   if(rows.has(meta.worldId))throw Error('Continuity already initialized');
   rows.set(meta.worldId,{meta:copy(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   const row=rows.get(worldId);
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Continuity CAS refused stale certification event');
   if(row.events.some(e=>e.eventId===event.eventId))
    throw Error('Duplicate certification event ID');
   row.events.push(copy(event));row.meta.revision=cursor.revision;
   row.meta.cursor=copy(cursor);
  },
  async restore({meta,events}){
   if(rows.has(meta.worldId))throw Error('Refusing to overwrite continuity certification');
   rows.set(meta.worldId,copy({meta,events}));
  }
 };
}
const fingerprintOf=value=>createHash('sha256')
 .update(JSON.stringify(value)).digest('hex');
const event=(eventId,type,year,other={})=>({
 eventId,sourceId:'DISPOSABLE_V21_CERTIFICATION_'+eventId,
 type,year,...other
});
const openingSource=()=>({
 worldId:WORLD,foundingYear:1999,people:[],owners:[],stables:[],
 farms:[],trainingCenters:[]
});
export async function certifyFictionalIndustryV21(){
 // Lock the historical 1999 legacy naming output to its long-established
 // actual regression fixture, never to newly invented opening-era records.
 const historic=createFictionalWorldNameEngine({
  worldId:'Eras-Compatibility',seed:SEED,year:1999,
  roles:{trainer:200,jockey:80,farrier:15,bloodstock_agent:20},
  owners:130,facilities:{generalFarms:12,studFarms:7,nurseries:3}
 });
 assert.equal(historic.manifest.fingerprint,'64afc00b');
 assert.equal(historic.people.length,445);
 assert.equal(historic.owners.length+historic.stables.length+
  historic.farms.length+historic.trainingCenters.length,352);

 const names=namingMemory(),continuity=continuityMemory();
 const namer=await openDurableFictionalNameService({
  storage:names,worldId:WORLD,seed:SEED
 });
 const bridge=await openFictionalIndustryIdentityBridge({
  namingStorage:names,continuityStorage:continuity,
  worldId:WORLD,seed:SEED,source:openingSource()
 });
 let peopleCount=0,firmCount=0,capacityEvents=0,qualityIssues=0,
  firstStable=null,firstTrainer=null,firstOwner=null,
  mostRecentStable=null,at2050=null,at2080=null;
 const openingNames=new Map(),eraCounts={
  LEGACY_1999:0,EARLY_2000_2019:0,CONTEMPORARY_2020_2049:0,
  MODERN_2050_2079:0,FUTURE_2080_2099:0
 };
 const allPersonIds=new Set(),allFirmIds=new Set();
 for(let year=1999;year<=2099;year++){
  const batch=await namer.generate({
   year,roles:{trainer:2,jockey:1,farm_manager:1},
   owners:3,facilities:{generalFarms:1},
   maxPartnershipGroups:12,soleOwnerPercent:23
  });
  // Small yearly batches are checked for source-consistency; substantial
  // sampling pools are quality-audited separately below for diversity.
  assert.equal(batch.manifest.writtenToGame,false);
  assert.equal(batch.nextCursor.year,year);
  assert.ok(JSON.stringify(batch.nextCursor).length<350);
  const era=year===1999?'LEGACY_1999':year<2020?'EARLY_2000_2019':
   year<2050?'CONTEMPORARY_2020_2049':year<2080?'MODERN_2050_2079':
   'FUTURE_2080_2099';
  eraCounts[era]+=batch.people.length;
  const firms=[...batch.owners,...batch.stables,...batch.farms,
   ...batch.trainingCenters];
  for(const person of batch.people){
   assert.ok(!allPersonIds.has(person.id),'Cross-decade duplicated person ID');
   allPersonIds.add(person.id);
   await bridge.registerApprovedPerson({
    personId:person.id,eventId:'PERSON-'+person.id,
    sourceId:'DISPOSABLE_PERSON_APPROVAL',year
   });
   const linked=bridge.getPersonIdentity(person.id);
   assert.equal(linked.id,person.id);
   assert.equal(linked.name,person.name);
   assert.equal(linked.primarySurname,person.primarySurname);
   assert.equal(linked.birthYear,person.birthYear);
   assert.equal(linked.namingMetadata.birthCountry,person.birthCountry);
   assert.equal(linked.registeredInContinuity,true);
   peopleCount++;
  }
  for(let index=0;index<firms.length;index++){
   const firm=firms[index];
   assert.ok(!allFirmIds.has(firm.id),'Cross-decade duplicated business ID');
   allFirmIds.add(firm.id);
   await bridge.registerApprovedOrganization({
    organizationId:firm.id,eventId:'FIRM-'+firm.id,
    sourceId:'DISPOSABLE_BUSINESS_APPROVAL',year
   });
   const linked=bridge.getOrganization(firm.id);
   assert.equal(linked.id,firm.id);
   assert.equal(linked.name,firm.name);
   assert.equal(linked.originalName,firm.name);
   if(year===1999)openingNames.set(firm.id,firm.name);
   const slots=linked.kind==='OWNER'?
    index%3===0?650:index%3===1?35:4:
    linked.kind==='STABLE'?225:
    linked.kind==='FARM'?130:90;
   await bridge.applyTransition({event:event('SLOTS-'+firm.id,
    'SET_OPERATING_CAPACITY',year,{
     organizationId:firm.id,horseSlots:slots
    })});
   capacityEvents++;firmCount++;
  }
  if(year===1999){
   firstStable=batch.stables[0];
   firstTrainer=batch.people.find(p=>p.id===firstStable.trainerId);
   firstOwner=batch.owners[0];
  }
  if(year===2050)at2050=batch.people.find(p=>p.role==='trainer');
  if(year===2080)at2080=batch.people.find(p=>p.role==='trainer');
  if(year===2050||year===2080){
   const replacement=year===2050?at2050:at2080;
   await bridge.applyTransition({event:event('SUCCESSION-'+year,
    'CHANGE_STABLE_TRAINER',year,{
     organizationId:firstStable.id,toPersonId:replacement.id
    })});
   if(year===2050){
    await bridge.applyTransition({event:event('RETIRE-FOUNDING-TRAINER',
     'RETIRE_PERSON',year,{personId:firstTrainer.id})});
   }
  }
  mostRecentStable=batch.stables[0];
 }
 assert.equal(namer.revision,101);
 assert.equal(peopleCount,allPersonIds.size);
 assert.equal(firmCount,allFirmIds.size);
 assert.ok(namer.partnershipGroupsIssued<=12);
 assert.equal(bridge.getOrganization(firstStable.id).trainerId,at2080.id);
 assert.equal(bridge.getPersonIdentity(firstTrainer.id).retired,true);
 assert.equal(bridge.getOrganization(firstStable.id).name,openingNames.get(firstStable.id));
 assert.equal(bridge.getOrganization(firstOwner.id).name,openingNames.get(firstOwner.id));
 assert.equal(bridge.getHistory(firstStable.id).length,4);
 assert.equal(bridge.getOrganization(mostRecentStable.id).status,'ACTIVE');

 // Independent, sufficiently large sample sizes for cultural and editorial
 // future-era QA; never pass false "real registration" provenance.
 const qualityYears=[1999,2000,2019,2020,2049,2050,2079,2080,2099];
 for(const year of qualityYears){
  const cohort=createFictionalWorldNameEngine({
   worldId:'V21-QUALITY-COHORT',seed:SEED,year,
   roles:{trainer:100,jockey:75,farm_manager:20,bloodstock_agent:20},
   owners:100,
   facilities:{generalFarms:5,studFarms:2,nurseries:2},
   ownerNamingPolicy:{partnershipLimit:12,soleOwnerPercent:23}
  });
  const namesQa=auditFictionalGenerationalNameQuality(cohort,{
   expectedYear:year
  });
  const firmQa=auditGenerationalOrganizationNames(cohort,{
   expectedYear:year,partnershipLimit:12
  });
  assert.equal(namesQa.pass,true,JSON.stringify(namesQa.issues));
  assert.equal(firmQa.pass,true,JSON.stringify(firmQa.issues));
  qualityIssues+=namesQa.issueTotal+firmQa.issueTotal;
 }
 assert.equal(qualityIssues,0);

 // A 1999 business whose personnel have reached implausible ages is flagged,
 // not assigned imagined successors or silently offered new training slots.
 const readiness=auditFictionalIndustryReadinessV21({
  continuity:bridge,year:2099,sampleLimit:12
 });
 assert.ok(readiness.needsDecision>0);
 assert.ok((readiness.byIssueCode.IMPLAUSIBLE_ACTIVE_AGE??0)>0);
 assert.equal(bridge.getOrganization(firstStable.id).id,firstStable.id);
 const reusable=createFictionalIndustryReuseIndexV20({continuity:bridge});
 const viable=reusable.findReusable({kind:'STABLE',slots:1,limit:250});
 assert.ok(viable.candidates.some(c=>c.id===firstStable.id),
  'properly succeeded original stable should still be viable');
 assert.ok(!viable.candidates.some(c=>c.id===batch1999InvalidId()),
  'planner may not use an invented business ID');
 function batch1999InvalidId(){return 'NOT-AN-APPROVED-BUSINESS'}
 assert.ok(reusable.getSummary({kind:'STABLE'}).byKind.STABLE
  .notReadyOrganizations>0);

 // Independently back up *both* registry authorities and restore into
 // empty, isolated namespaces. IDs, names, continuity and quality survive.
 const namingArchive=await bridge.exportNamingBundle();
 const industryArchive=await bridge.exportContinuityArchive();
 const restoredNames=namingMemory(),restoredContinuity=continuityMemory();
 await restoreDurableFictionalNamingBundle({
  storage:restoredNames,bundle:namingArchive
 });
 await restoreDurableOrganizationContinuityArchive({
  storage:restoredContinuity,archive:industryArchive
 });
 const recovered=await openFictionalIndustryIdentityBridge({
  namingStorage:restoredNames,continuityStorage:restoredContinuity,
  worldId:WORLD,seed:SEED
 });
 assert.equal(recovered.continuityRevision,bridge.continuityRevision);
 assert.equal(recovered.namingRevision,bridge.namingRevision);
 assert.equal(recovered.getOrganization(firstStable.id).name,firstStable.name);
 assert.equal(recovered.getOrganization(firstStable.id).trainerId,at2080.id);
 assert.equal(recovered.getOrganization(firstOwner.id).name,firstOwner.name);
 assert.equal(recovered.getPersonIdentity(firstTrainer.id).retired,true);
 assert.equal(recovered.getApprovedOrganizationIdentity(
  mostRecentStable.id).registration.kind,'STABLE');
 assert.deepEqual(
  recovered.getOrganization(firstStable.id,{withHistory:true}).history,
  bridge.getOrganization(firstStable.id,{withHistory:true}).history
 );
 const digest=fingerprintOf({
  openingFingerprint:historic.manifest.fingerprint,
  namingCursor:bridge.namingCursor,
  continuityCursor:bridge.continuityCursor,
  firstStable:bridge.getOrganization(firstStable.id,{withHistory:true}),
  latestFirm:bridge.getOrganization(mostRecentStable.id),
  eraCounts,readinessSummary:{
   inspected:readiness.inspected,
   ready:readiness.ready,
   needsDecision:readiness.needsDecision,
   byIssueCode:readiness.byIssueCode
  }
 });
 return Object.freeze({
  model:FICTIONAL_INDUSTRY_CERTIFICATION_MODEL_V21,
  result:'PASS',disposable:true,playableWorldModified:false,
  yearStart:1999,yearEnd:2099,yearsTested:101,
  namingSeed:SEED,opening1999Fingerprint:historic.manifest.fingerprint,
  peopleRegistered:peopleCount,organizationsRegistered:firmCount,
  operatingCapacityEvents:capacityEvents,
  totalContinuityEvents:bridge.continuityRevision,
  approvedNamingBatches:bridge.namingRevision,
  newPartnershipGroups:namer.partnershipGroupsIssued,
  generationalQualityYears:qualityYears,
  generationalQualityIssues:qualityIssues,
  retiredOriginalTrainer:true,permanentOriginalStable:true,
  flaggedAgingLeadership:readiness.needsDecision,
  noHorsesCreated:true,archiveRestorationVerified:true,
  finalCursorBytes:Buffer.byteLength(JSON.stringify(bridge.continuityCursor)),
  certificationDigest:'sha256-'+digest
 });
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 certifyFictionalIndustryV21().then(result=>{
  process.stdout.write(JSON.stringify(result,null,2)+'\n');
 }).catch(error=>{console.error(error);process.exitCode=1});
}
