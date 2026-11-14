import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 createFictionalOrganizationContinuityRegistry,
 FICTIONAL_INDUSTRY_SLOT_LIMITS_V20,CONTINUITY_EVENT_TYPES
} from '../public/1999/engine/fictional-organization-continuity-v16.mjs';
import {
 openDurableOrganizationContinuityService,
 restoreDurableOrganizationContinuityArchive
} from '../public/1999/engine/durable-organization-continuity-v17.mjs';
import {
 createFictionalIndustryReuseIndexV20,
 FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20
} from '../public/1999/engine/fictional-industry-operations-v20.mjs';

const clone=x=>JSON.parse(JSON.stringify(x));
const WORLD='V20-DISPOSABLE-INDUSTRY';
const people=[
 {id:'OWNER-A',name:'Adele Brooks',role:'owner',primarySurname:'Brooks',birthYear:1975},
 {id:'OWNER-B',name:'Brianna Ryder',role:'owner',primarySurname:'Ryder',birthYear:1976},
 {id:'TRAINER-A',name:'Carlos Méndez',role:'trainer',primarySurname:'Méndez',birthYear:1974},
 {id:'TRAINER-B',name:'Julian Price',role:'trainer',primarySurname:'Price',birthYear:1972},
 {id:'MANAGER-A',name:'Marie Windsor',role:'farm_manager',primarySurname:'Windsor',birthYear:1977},
 {id:'MANAGER-B',name:'Leon Fisher',role:'farm_manager',primarySurname:'Fisher',birthYear:1971}
];
const source=()=>({
 worldId:WORLD,foundingYear:1999,people:clone(people),
 owners:[
  {id:'SMALL-OWNER',name:'Elm Ridge Racing',ownershipArchetype:'RACING_COMPANY',
   principalId:'OWNER-A',namingRegion:'KENTUCKY'},
  {id:'MAJOR-OWNER',name:'Stonefield Racing Company',
   ownershipArchetype:'RACING_COMPANY',principalId:'OWNER-B',
   namingRegion:'KENTUCKY'},
  {id:'OTHER-OWNER',name:'Cypress Athletic Racing',
   ownershipArchetype:'PRIVATE_RACING_OPERATION',principalId:'OWNER-B',
   namingRegion:'FLORIDA'}
 ],
 stables:[
  {id:'STABLE-A',name:'Elkhorn Barn Racing Stable',
   trainerId:'TRAINER-A',namingRegion:'KENTUCKY'},
  {id:'STABLE-B',name:'Calumet Pass Stable',
   trainerId:'TRAINER-B',namingRegion:'KENTUCKY'}
 ],
 farms:[{id:'FARM-A',name:'Clearwater Thoroughbred Farm',
  managerIds:['MANAGER-A'],namingRegion:'KENTUCKY'}],
 trainingCenters:[{id:'CENTER-A',name:'Big Cedar Training Center',
  managerIds:['MANAGER-B'],namingRegion:'FLORIDA'}]
});
const ev=(eventId,type,year,other={})=>({
 type,eventId,year,sourceId:'SYNTHETIC_V20_'+eventId,...other
});
const cap=(id,year,horseSlots,eventId='CAP-'+id)=>ev(
 eventId,'SET_OPERATING_CAPACITY',year,{organizationId:id,horseSlots});
const apply=(reg,event)=>reg.apply({expectedRevision:reg.revision,event});
const plan=(reg,usageByOrganizationId={})=>createFictionalIndustryReuseIndexV20({
 continuity:reg,usageByOrganizationId
});
async function configure(reg){
 for(const [id,slots] of [
  ['SMALL-OWNER',4],['MAJOR-OWNER',650],['OTHER-OWNER',80],
  ['STABLE-A',35],['STABLE-B',140],['FARM-A',200],['CENTER-A',55]
 ])apply(reg,cap(id,2025,slots));
}
function memoryContinuity(){
 const rows=new Map();let fail=null;
 return {
  failNext(mode='ROLLBACK'){fail=mode},
  async read({worldId}){return clone(rows.get(worldId)??null)},
  async initialize(meta){
   if(rows.has(meta.worldId))throw Error('Already initialized');
   rows.set(meta.worldId,{meta:clone(meta),events:[]});
  },
  async append({worldId,expectedRevision,event,cursor}){
   const behavior=fail;fail=null;
   if(behavior==='ROLLBACK')throw Error('V20 synthetic rollback');
   const row=rows.get(worldId);
   if(!row||row.meta.revision!==expectedRevision)
    throw Error('Stale persisted continuity revision');
   if(row.events.some(e=>e.eventId===event.eventId))
    throw Error('Repeated continuity event ID');
   row.events.push(clone(event));
   row.meta.revision=cursor.revision;
   row.meta.cursor=clone(cursor);
   if(behavior==='AMBIGUOUS')throw Error('V20 synthetic committed then interrupted');
  },
  async restore({meta,events}){
   if(rows.has(meta.worldId))throw Error('Continuity restore overwrite refused');
   rows.set(meta.worldId,clone({meta,events}));
  }
 };
}

test('V20 separate, kind-specific capacity events preserve exact permanent business IDs and 1999 source',()=>{
 const founder=source(),frozen=JSON.stringify(founder);
 const reg=createFictionalOrganizationContinuityRegistry({source:founder});
 assert.ok(CONTINUITY_EVENT_TYPES.includes('SET_OPERATING_CAPACITY'));
 assert.equal(reg.getOrganization('MAJOR-OWNER').operatingCapacity,undefined);
 const preview=reg.preview({expectedRevision:0,event:cap('MAJOR-OWNER',2025,650)});
 assert.equal(preview.revision,1);
 assert.equal(reg.revision,0);
 assert.equal(reg.getOrganization('MAJOR-OWNER').operatingCapacity,undefined);
 configure(reg);
 assert.equal(reg.revision,7);
 for(const [id,slots,kind] of [
  ['SMALL-OWNER',4,'OWNER'],['MAJOR-OWNER',650,'OWNER'],
  ['STABLE-A',35,'STABLE'],['STABLE-B',140,'STABLE'],
  ['FARM-A',200,'FARM'],['CENTER-A',55,'TRAINING_CENTER']
 ]){
  const org=reg.getOrganization(id);
  assert.equal(org.id,id);
  assert.equal(org.operatingCapacity.horseSlots,slots);
  assert.equal(org.operatingCapacity.slotType,
   FICTIONAL_INDUSTRY_SLOT_LIMITS_V20[kind].slotType);
  assert.equal(org.operatingCapacity.updatedYear,2025);
  assert.equal(reg.getHistory(id).length,1);
 }
 assert.equal(reg.getOrganization('MAJOR-OWNER').name,
  founder.owners[1].name);
 assert.equal(JSON.stringify(founder),frozen);
 assert.ok(JSON.stringify(reg.cursor).length<300);
});
test('V20 rejects invalid, duplicate, unchanged or closed capacities without writing events',()=>{
 const reg=createFictionalOrganizationContinuityRegistry({source:source()});
 for(const [id,slots] of [
  ['SMALL-OWNER',0],['SMALL-OWNER',5001],['SMALL-OWNER',1.5],
  ['STABLE-A',351],['FARM-A',2001],['CENTER-A',1001],
  ['DOES-NOT-EXIST',10]
 ]){
  const event=cap(id,2025,slots,'INVALID-'+id+'-'+slots);
  assert.throws(()=>apply(reg,event),
   /outside type-specific limits|Unknown organization ID/);
 }
 assert.equal(reg.revision,0);
 apply(reg,cap('STABLE-A',2025,70,'GOOD'));
 assert.throws(()=>apply(reg,cap('STABLE-A',2025,70,'UNCHANGED')),
  /unchanged/);
 assert.throws(()=>apply(reg,cap('STABLE-A',2025,40,'GOOD')),
  /Repeated continuity event/);
 apply(reg,ev('CLOSE','CLOSE_ORGANIZATION',2026,{organizationId:'STABLE-A'}));
 assert.throws(()=>apply(reg,cap('STABLE-A',2026,100,'CLOSED-UPDATE')),
  /closed operation/);
 assert.equal(reg.getHistory('STABLE-A').length,2);
 assert.equal(reg.getOrganization('STABLE-A').operatingCapacity.horseSlots,70);
});
test('V20 explicit career stages preserve names and rule out impossible progress or unrecorded promotions',()=>{
 const reg=createFictionalOrganizationContinuityRegistry({source:source()});
 const initial=reg.getPerson('TRAINER-A'),before=JSON.stringify(initial);
 assert.equal(initial.career,undefined);
 assert.throws(()=>apply(reg,ev('EARLY-VETERAN','RECORD_PERSON_CAREER',
  1999,{personId:'TRAINER-A',stage:'VETERAN',careerStartYear:1996})),
 /sufficient documented experience/);
 apply(reg,ev('START','RECORD_PERSON_CAREER',2000,{
  personId:'TRAINER-A',stage:'EMERGING',careerStartYear:1994
 }));
 apply(reg,ev('ESTABLISHED','RECORD_PERSON_CAREER',2001,{
  personId:'TRAINER-A',stage:'ESTABLISHED',careerStartYear:1994
 }));
 assert.throws(()=>apply(reg,ev('REGRESS','RECORD_PERSON_CAREER',2006,{
  personId:'TRAINER-A',stage:'EMERGING',careerStartYear:1994
 })),/regress, skip or alter/);
 assert.throws(()=>apply(reg,ev('RESET-START','RECORD_PERSON_CAREER',2012,{
  personId:'TRAINER-A',stage:'VETERAN',careerStartYear:2001
 })),/regress, skip or alter/);
 apply(reg,ev('VETERAN','RECORD_PERSON_CAREER',2012,{
  personId:'TRAINER-A',stage:'VETERAN',careerStartYear:1994
 }));
 const active=reg.getPerson('TRAINER-A');
 assert.equal(active.id,initial.id);
 assert.equal(active.name,initial.name);
 assert.equal(active.birthYear,initial.birthYear);
 assert.equal(active.career.stage,'VETERAN');
 assert.equal(active.career.careerStartYear,1994);
 assert.equal(reg.revision,3);
 assert.ok(!JSON.stringify(reg.exportSnapshot()).includes('worldState'));
 assert.ok(before.includes('TRAINER-A'));
});
test('V20 leave blocks new appointments, demands duty transfer, and retirement remains terminal',()=>{
 const reg=createFictionalOrganizationContinuityRegistry({source:source()});
 assert.throws(()=>apply(reg,ev('LEAVE-BEFORE-TRANSFER','SET_PERSON_AVAILABILITY',
  2025,{personId:'TRAINER-A',availability:'ON_LEAVE'})),
 /Transfer active duties/);
 apply(reg,ev('TRANSFER','CHANGE_STABLE_TRAINER',2025,{
  organizationId:'STABLE-A',toPersonId:'TRAINER-B'
 }));
 apply(reg,ev('LEAVE','SET_PERSON_AVAILABILITY',2025,{
  personId:'TRAINER-A',availability:'ON_LEAVE'
 }));
 assert.equal(reg.getPerson('TRAINER-A').availability,'ON_LEAVE');
 assert.throws(()=>apply(reg,ev('INVALID-HIRE','CHANGE_STABLE_TRAINER',2026,{
  organizationId:'STABLE-A',toPersonId:'TRAINER-A'
 })),/existing active person/);
 assert.throws(()=>apply(reg,ev('INVALID-CAREER','RECORD_PERSON_CAREER',
  2026,{personId:'TRAINER-A',stage:'EMERGING',careerStartYear:1995})),
 /active existing person/);
 apply(reg,ev('RETURN','SET_PERSON_AVAILABILITY',2027,{
  personId:'TRAINER-A',availability:'AVAILABLE'
 }));
 apply(reg,ev('RESTORE-TRAINER','CHANGE_STABLE_TRAINER',2027,{
  organizationId:'STABLE-A',toPersonId:'TRAINER-A'
 }));
 assert.throws(()=>apply(reg,ev('RETIRE-WITH-DUTIES','RETIRE_PERSON',
  2028,{personId:'TRAINER-A'})),/Transfer all active/);
 apply(reg,ev('TRANSFER-AGAIN','CHANGE_STABLE_TRAINER',2028,{
  organizationId:'STABLE-A',toPersonId:'TRAINER-B'
 }));
 apply(reg,ev('RETIRE','RETIRE_PERSON',2028,{personId:'TRAINER-A'}));
 assert.equal(reg.getPerson('TRAINER-A').retired,true);
 assert.throws(()=>apply(reg,ev('RETURN-RETIRED','SET_PERSON_AVAILABILITY',
  2029,{personId:'TRAINER-A',availability:'AVAILABLE'})),/non-retired/);
 assert.throws(()=>apply(reg,ev('HIRE-RETIRED','CHANGE_STABLE_TRAINER',
  2029,{organizationId:'STABLE-A',toPersonId:'TRAINER-A'})),
 /existing active person/);
});
test('V20 cached reuse proposals favor established owners and never silently add a new syndicate',()=>{
 const reg=createFictionalOrganizationContinuityRegistry({source:source()});
 assert.equal(plan(reg).findReusable({
  kind:'OWNER',region:'KENTUCKY'
 }).candidates.length,0,'unconfigured entities cannot be assumed to have slots');
 configure(reg);
 const observed={'SMALL-OWNER':3,'MAJOR-OWNER':425,'OTHER-OWNER':20,
  'STABLE-A':35,'STABLE-B':50,'FARM-A':28,'CENTER-A':13};
 const index=plan(reg,observed);
 const result=index.findReusable({kind:'OWNER',region:'KENTUCKY',slots:100});
 assert.equal(result.candidates.length,1);
 assert.equal(result.candidates[0].id,'MAJOR-OWNER');
 assert.equal(result.candidates[0].capacity,650);
 assert.equal(result.candidates[0].available,225);
 assert.equal(result.makesAssignments,false);
 assert.equal(index.findReusable({kind:'OWNER',region:'FLORIDA',
  slots:150}).candidates.length,0);
 assert.equal(index.findReusable({kind:'OWNER',region:'FLORIDA',
  slots:150,includeOtherRegions:true}).candidates[0].id,'MAJOR-OWNER');
 assert.equal(index.findReusable({kind:'STABLE',region:'KENTUCKY',
  slots:1}).candidates[0].id,'STABLE-B');
 const packed=index.planAggregateDemand({kind:'OWNER',region:'KENTUCKY',
  horseCount:220});
 assert.equal(packed.proposedHorseSlots,220);
 assert.equal(packed.unplacedHorseSlots,0);
 assert.ok(packed.allocations.every(x=>x.organizationId==='MAJOR-OWNER'));
 const shortage=index.planAggregateDemand({kind:'OWNER',region:'KENTUCKY',
  horseCount:300});
 assert.equal(shortage.unplacedHorseSlots,74);
 assert.equal(shortage.requiresAdditionalCapacity,true);
 assert.equal(index.getSummary({kind:'OWNER'}).byKind.OWNER.activeOrganizations,3);
 assert.equal(reg.organizationCount,7,'a plan must not create any business');
 assert.equal(reg.revision,7,'a plan must not write any lifecycle event');
 assert.equal(reg.getOrganization('MAJOR-OWNER').name,'Stonefield Racing Company');
});
test('V20 planner refuses stale revisions, invalid counts, and over-capacity organizations',()=>{
 const reg=createFictionalOrganizationContinuityRegistry({source:source()});
 configure(reg);
 assert.throws(()=>plan(reg,{'MAJOR-OWNER':-1}),/Invalid observed occupancy/);
 assert.throws(()=>plan(reg,{'MAJOR-OWNER':1.5}),/Invalid observed occupancy/);
 const index=plan(reg,{'SMALL-OWNER':7});
 assert.equal(index.getSummary({kind:'OWNER'}).byKind.OWNER.overCapacityOrganizations,1);
 assert.equal(index.findReusable({kind:'OWNER',region:'KENTUCKY',
  slots:1}).candidates.some(x=>x.id==='SMALL-OWNER'),false);
 assert.throws(()=>index.findReusable({kind:'WRONG'}),/Unknown industry/);
 assert.throws(()=>index.findReusable({kind:'OWNER',slots:0}),/Invalid required/);
 assert.throws(()=>index.findReusable({kind:'OWNER',limit:251}),/Invalid candidate/);
 assert.throws(()=>index.findReusable({kind:'OWNER',policy:'AUTO-CREATE'}),
  /Unknown industry reuse policy/);
 apply(reg,ev('CLOSE-FARM','CLOSE_ORGANIZATION',2026,{organizationId:'FARM-A'}));
 assert.throws(()=>index.getSummary(),/stale/);
 assert.equal(plan(reg).findReusable({kind:'FARM'}).candidates.length,0);
});
test('V20 V17 persistence: failed writes, simultaneous sessions, restart and sealed archive recovery',async()=>{
 const store=memoryContinuity();
 let a=await openDurableOrganizationContinuityService({storage:store,worldId:WORLD,source:source()});
 const b=await openDurableOrganizationContinuityService({storage:store,worldId:WORLD});
 store.failNext();
 await assert.rejects(()=>a.apply({expectedRevision:a.revision,
  event:cap('MAJOR-OWNER',2025,500)}),/V20 synthetic rollback/);
 assert.equal(a.getOrganization('MAJOR-OWNER').operatingCapacity,undefined);
 assert.equal((await store.read({worldId:WORLD})).events.length,0);
 await assert.rejects(()=>a.apply({expectedRevision:0,
  event:cap('MAJOR-OWNER',2025,500,'BLOCKED')}),/refresh/);
 await a.refresh();
 store.failNext('AMBIGUOUS');
 await assert.rejects(()=>a.apply({expectedRevision:0,
  event:cap('MAJOR-OWNER',2025,500,'AMBIGUOUS')}),/committed then interrupted/);
 assert.equal(a.getOrganization('MAJOR-OWNER').operatingCapacity,undefined);
 await a.refresh();
 assert.equal(a.getOrganization('MAJOR-OWNER').operatingCapacity.horseSlots,500);
 await assert.rejects(()=>b.apply({expectedRevision:0,
  event:cap('STABLE-A',2025,100,'LOST-TAB')}),/Stale persisted continuity revision/);
 await b.refresh();
 await b.apply({expectedRevision:b.revision,
  event:cap('STABLE-A',2025,100,'WIN-TAB')});
 a=await openDurableOrganizationContinuityService({storage:store,worldId:WORLD});
 assert.equal(a.revision,2);
 assert.equal(a.getOrganization('STABLE-A').operatingCapacity.horseSlots,100);
 await a.apply({expectedRevision:a.revision,
  event:ev('PROGRESS','RECORD_PERSON_CAREER',2026,{
   personId:'TRAINER-B',stage:'VETERAN',careerStartYear:1992
  })});
 const archive=await a.exportArchive();
 const other=memoryContinuity();
 const revived=await restoreDurableOrganizationContinuityArchive({storage:other,archive});
 assert.deepEqual(revived.getOrganization('MAJOR-OWNER').operatingCapacity,
  a.getOrganization('MAJOR-OWNER').operatingCapacity);
 assert.deepEqual(revived.getPerson('TRAINER-B').career,a.getPerson('TRAINER-B').career);
 assert.equal(plan(revived).findReusable({kind:'OWNER',
  region:'KENTUCKY'}).candidates[0].id,'MAJOR-OWNER');
 await assert.rejects(()=>restoreDurableOrganizationContinuityArchive({
  storage:other,archive
 }),/overwrite/);
 assert.equal((await store.read({worldId:WORLD})).events.length,3);
});
test('V20 100,000-slot aggregate industry planning requires no horse rows or per-horse registry writes',()=>{
 // A plausible synthetic stable fleet, not the live 1999 universe.
 const worldId='V20-HUNDRED-THOUSAND-READ-ONLY';
 const trainers=Array.from({length:400},(_,i)=>({
  id:'TRAINER-'+i,name:'Synthetic Trainer '+i,
  role:'trainer',primarySurname:'Trainer',birthYear:1973
 }));
 const stables=Array.from({length:400},(_,i)=>({
  id:'STABLE-'+i,name:'Synthetic Stable '+i,trainerId:'TRAINER-'+i,
  namingRegion:i<370?'KENTUCKY':'FLORIDA'
 }));
 const reg=createFictionalOrganizationContinuityRegistry({source:{
  worldId,foundingYear:1999,people:trainers,owners:[],stables,
  farms:[],trainingCenters:[]
 }});
 for(let i=0;i<400;i++)apply(reg,cap('STABLE-'+i,2025,300,'CAPACITY-'+i));
 const before=reg.revision,startingCount=reg.organizationCount;
 const index=plan(reg);
 const all=index.planAggregateDemand({kind:'STABLE',horseCount:100000});
 assert.equal(all.requestedHorseSlots,100000);
 assert.equal(all.proposedHorseSlots,100000);
 assert.equal(all.unplacedHorseSlots,0);
 assert.equal(all.allocations.length,334);
 assert.equal(all.makesAssignments,false);
 const kentucky=index.planAggregateDemand({kind:'STABLE',
  region:'KENTUCKY',horseCount:100000});
 assert.equal(kentucky.unplacedHorseSlots,0);
 const oversub=index.planAggregateDemand({kind:'STABLE',
  region:'KENTUCKY',horseCount:120000});
 assert.equal(oversub.unplacedHorseSlots,9000);
 assert.equal(oversub.requiresAdditionalCapacity,true);
 assert.equal(reg.revision,before);
 assert.equal(reg.organizationCount,startingCount);
 assert.equal(reg.eventCount,400);
 assert.equal(index.getSummary({kind:'STABLE'}).byKind.STABLE.capacitySlots,120000);
 assert.ok(JSON.stringify(reg.cursor).length<300);
});
test('V20 module remains detached from playable world and does not mint horses or alter career saves',()=>{
 const code=readFileSync(new URL(
  '../public/1999/engine/fictional-industry-operations-v20.mjs',
  import.meta.url),'utf8');
 const boot=readFileSync(new URL(
  '../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 assert.equal(FICTIONAL_INDUSTRY_OPERATIONS_MODEL_V20,
  'WTW_FICTIONAL_INDUSTRY_OPERATIONS_V20');
 assert.doesNotMatch(boot,/fictional-industry-operations-v20/);
 assert.doesNotMatch(code,/\b(?:fetch|localStorage|setItem|writeFile|createFictionalWorldNameEngine)\s*\(/);
 assert.doesNotMatch(code,/\.generate\s*\(/);
});
