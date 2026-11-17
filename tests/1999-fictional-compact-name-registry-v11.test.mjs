import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {
 createIndexedFictionalNameRegistry,generateIndexedFictionalNames,
 INDEXED_FICTIONAL_NAME_REGISTRY_MODEL,COMPACT_FICTIONAL_NAME_CURSOR_MODEL
} from '../public/1999/engine/indexed-fictional-name-registry.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
const key=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const config={worldId:'REGISTRY-V11',seed:19990101,year:1999,
 roles:{trainer:10,jockey:8,bloodstock_agent:3},owners:22,
 facilities:{generalFarms:2,studFarms:1},
 maxPartnershipGroups:12,soleOwnerPercent:23};
test('compact registry cursor does not contain any prior names, owners or groups',()=>{
 const registry=createIndexedFictionalNameRegistry({
  worldId:config.worldId,seed:config.seed,
  protectedPeople:['José García','Seán OBrien'],
  protectedOrganizations:['Kingsmere Farm','Godolphin Racing']
 });
 assert.equal(registry.model,INDEXED_FICTIONAL_NAME_REGISTRY_MODEL);
 assert.equal(registry.index.hasAnyName('Jose Garcia'),true);
 assert.equal(registry.index.hasOrganizationRootConflict('kingsmere estate'),true);
 assert.equal(registry.index.hasOrganizationRootConflict('godolphin'),true);
 assert.equal(registry.index.hasOrganizationRootConflict('unrelated orchard'),false);
 let cursor=null,firstSize=0,firstOwners=null,issued=0;
 const allNames=new Set(['josegarcia','seanobrien','kingsmerefarm','godolphinracing']);
 for(let i=0;i<65;i++){
  const result=generateIndexedFictionalNames({...config,registry,cursor});
  const next=result.nextCursor;
  assert.equal(result.manifest.writtenToGame,false);
  assert.equal(result.manifest.storedInNamingRegistry,true);
  assert.equal(next.model,COMPACT_FICTIONAL_NAME_CURSOR_MODEL);
  assert.equal(next.nextBatch,i+1);
  assert.equal(next.revision,i+1);
  assert.equal(next.ownersIssued,config.owners*(i+1));
  assert.ok(next.partnershipsIssued<=config.maxPartnershipGroups);
  assert.ok(!Object.hasOwn(next,'mintedNames'));
  assert.ok(!Object.hasOwn(next,'ownerEntities'));
  assert.ok(!Object.hasOwn(next,'ownerGroupRecords'));
  const bytes=Buffer.byteLength(JSON.stringify(next),'utf8');
  if(!firstSize)firstSize=bytes;
  assert.ok(bytes<350,'cursor started growing with names: '+bytes);
  assert.ok(bytes-firstSize<18,'cursor size grows unexpectedly: '+bytes);
  const names=[...result.people,...result.owners,...result.stables,
   ...result.farms,...result.trainingCenters].map(x=>x.name);
  // Sole-owner display names can match their new principal IN THIS batch,
  // but never a previously issued person or organization.
  for(const name of names)
   if(allNames.has(key(name)))
    throw Error('Previously issued protected or fictional name '+name);
  for(const name of names)allNames.add(key(name));
  issued+=result.people.length+result.owners.length+result.stables.length+
   result.farms.length+result.trainingCenters.length;
  cursor=next;
  if(i===0)firstOwners=result.owners;
 }
 assert.equal(registry.revision,65);
 assert.equal(registry.ownerCount,1430);
 assert.ok(registry.namesIssued>3200);
 assert.equal(cursor.namesIssued,registry.namesIssued);
 assert.equal(registry.listOwners({limit:100}).length,100);
 assert.ok(registry.formalGroupsIssued<=12);
 assert.equal(registry.listGroups({limit:100}).length,registry.formalGroupsIssued);
 const old=firstOwners[0].id;
 assert.equal(registry.listOwners({offset:0,limit:1})[0].id,old);
 assert.equal(registry.index.hasAnyName(firstOwners[0].name),true);
});
test('one-name-index lookup protects people and organization roots without replaying a full history array',()=>{
 const registry=createIndexedFictionalNameRegistry({worldId:'INDEX-HISTORY',seed:33,
  protectedPeople:['María Elena Rodríguez','Jean Pierre Côté'],
  protectedOrganizations:['Cedar Hollow Farm','Blue Ridge Stud']
 });
 assert.equal(registry.index.hasAnyName('Maria Elena Rodriguez'),true);
 assert.equal(registry.index.hasAnyName('JEAN-PIERRE CÔTÉ'),true);
 assert.equal(registry.index.hasOrganizationRootConflict('cedar hollow estate'),true);
 assert.equal(registry.index.hasOrganizationRootConflict('blue ridge'),true);
 const first=generateIndexedFictionalNames({registry,worldId:'INDEX-HISTORY',seed:33,
  roles:{trainer:12,jockey:10},owners:15,
  facilities:{generalFarms:3,studFarms:1},maxPartnershipGroups:4});
 const fresh=registry.index;
 assert.ok(first.people.every(p=>fresh.hasAnyName(p.name)));
 assert.ok(first.farms.every(p=>fresh.hasAnyName(p.name)));
 for(const farm of first.farms){
  const name=farm.name;
  if(/(?:Farm|Farms|Acres|Stud)/i.test(name))
   assert.ok(registry.index.hasAnyName(name));
 }
 assert.equal(registry.revision,1);
});
test('registry enforces stale revision and rolls back colliding commits atomically',()=>{
 const registry=createIndexedFictionalNameRegistry({worldId:'ATOMIC-NAMES',seed:9001});
 const args={registry,worldId:'ATOMIC-NAMES',seed:9001,
  roles:{trainer:8},owners:8,facilities:{generalFarms:1},
  maxPartnershipGroups:2};
 const first=generateIndexedFictionalNames(args);
 const revision=registry.revision;
 const oldOwnerCount=registry.ownerCount;
 assert.throws(()=>generateIndexedFictionalNames(args),/Non-empty registry requires/);
 assert.throws(()=>registry.commit({
  expectedRevision:revision-1,people:[],organizations:[],owners:[],batchIndex:1
 }),/Stale indexed/);
 assert.throws(()=>registry.commit({
  expectedRevision:revision,people:[
   {id:'DUP-P',name:first.people[0].name}
  ],organizations:[],owners:[],batchIndex:1
 }),/collision/);
 assert.equal(registry.revision,revision);
 assert.equal(registry.ownerCount,oldOwnerCount);
 assert.throws(()=>generateIndexedFictionalNames({
  ...args,cursor:{...first.nextCursor,revision:0}
 }),/Stale or incompatible/);
 const second=generateIndexedFictionalNames({...args,cursor:first.nextCursor});
 assert.equal(second.nextCursor.revision,2);
 assert.ok(second.nextCursor.ownersIssued>first.nextCursor.ownersIssued);
});
test('explicit separate registry snapshot restores names and deterministic future generation',()=>{
 const params={worldId:'PERSIST-NAMES',seed:456789,roles:{trainer:12,jockey:9},
  owners:35,facilities:{generalFarms:2,studFarms:1},maxPartnershipGroups:5};
 const registry=createIndexedFictionalNameRegistry({
  worldId:params.worldId,seed:params.seed,
  protectedPeople:['Émile Gagnon'],
  protectedOrganizations:['Stone Orchard Stud']
 });
 let cursor=null;
 for(let i=0;i<4;i++)
  cursor=generateIndexedFictionalNames({...params,registry,cursor}).nextCursor;
 const compactBytes=Buffer.byteLength(JSON.stringify(cursor),'utf8');
 const fullSnapshot=JSON.parse(JSON.stringify(registry.snapshot()));
 const restored=createIndexedFictionalNameRegistry({
  worldId:params.worldId,seed:params.seed,snapshot:fullSnapshot
 });
 assert.equal(restored.revision,registry.revision);
 assert.equal(restored.namesIssued,registry.namesIssued);
 assert.equal(restored.ownerCount,registry.ownerCount);
 assert.equal(restored.formalGroupsIssued,registry.formalGroupsIssued);
 assert.ok(Buffer.byteLength(JSON.stringify(fullSnapshot))>compactBytes*8);
 const a=generateIndexedFictionalNames({...params,registry,cursor});
 const b=generateIndexedFictionalNames({...params,registry:restored,cursor});
 assert.deepEqual(a.people.map(x=>x.name),b.people.map(x=>x.name));
 assert.deepEqual(a.owners.map(x=>x.name),b.owners.map(x=>x.name));
 assert.deepEqual(a.nextCursor,b.nextCursor);
 const broken={...fullSnapshot,issuedPeople:[...fullSnapshot.issuedPeople]};
 broken.issuedPeople[0]={...broken.issuedPeople[0],name:'Corrupted Person'};
 assert.throws(()=>createIndexedFictionalNameRegistry({
  worldId:params.worldId,seed:params.seed,snapshot:broken
 }),/corrupted/);
});
test('large-simulation registry never embeds historical names in engine protected arrays',()=>{
 const reg=createIndexedFictionalNameRegistry({
  worldId:'MANY-HIST',seed:19990101,
  protectedOrganizations:Array.from({length:12000},(_,i)=>
   'Historical Estate '+String(i).padStart(6,'0')+' Farm')
 });
 assert.equal(reg.revision,0);
 const batch=generateIndexedFictionalNames({
  registry:reg,worldId:'MANY-HIST',seed:19990101,
  roles:{trainer:50,jockey:25},owners:80,
  facilities:{generalFarms:5,studFarms:2},maxPartnershipGroups:9
 });
 assert.equal(batch.nextCursor.nextBatch,1);
 assert.equal(batch.nextCursor.namesIssued,reg.namesIssued);
 assert.ok(Buffer.byteLength(JSON.stringify(batch.nextCursor))<350);
 const names=[...batch.owners,...batch.farms].map(x=>x.name);
 assert.ok(!names.some(x=>/^Historical Estate /i.test(x)));
});
test('indexed mechanism remains optional and does not touch playable world or legacy V8 caller',()=>{
 const source=readFileSync(new URL('../public/1999/engine/indexed-fictional-name-registry.mjs',import.meta.url),'utf8');
 const world=readFileSync(new URL('../public/1999/engine/founding-world-1999.mjs',import.meta.url),'utf8');
 const legacy=readFileSync(new URL('../public/1999/engine/on-demand-fictional-name-batches.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(world,/indexed-fictional-name-registry/);
 assert.doesNotMatch(legacy,/^import[^\n]*indexed-fictional-name-registry/m);
 const w=createFictionalWorldNameEngine({worldId:'INDEX-LEGACY-COMPAT',seed:12345,
  roles:{trainer:8},owners:12,facilities:{generalFarms:2}});
 assert.equal(w.owners.length,12);
});

test('indexed benchmark creates no playable world and keeps cursor size bounded',()=>{
 const script=new URL('../scripts/bench-indexed-naming-v11.mjs',import.meta.url).pathname;
 const output=execFileSync(process.execPath,[script,
  '--batches','6','--owners','20','--trainers','7',
  '--jockeys','5','--historic','250'
 ],{encoding:'utf8',timeout:90000});
 const report=JSON.parse(output);
 assert.equal(report.benchmark,'WTW-V11-COMPACT-INDEXED-NAME-REGISTRY');
 assert.equal(report.createsPlayableWorld,false);
 assert.equal(report.createsHorseEntities,false);
 assert.equal(report.options.batches,6);
 assert.equal(report.issuedOwnerEntities,120);
 assert.equal(report.issuedCounts.owners,120);
 assert.ok(report.issuedNames>200);
 assert.ok(report.finalCheckpointBytes<350);
 assert.ok(report.bytesGrowth<20);
});


// This deliberately recomputes the old non-cryptographic snapshot checksum:
// the test must exercise relational validation, not merely reject bad hashes.
function recomputeIndexedSnapshotChecksum(snapshot){
 const hash=(seed,value)=>{
  let h=(2166136261^(seed>>>0))>>>0;
  for(const char of String(value)){h^=char.charCodeAt(0);h=Math.imul(h,16777619)}
  h^=h>>>16;h=Math.imul(h,0x7feb352d);h^=h>>>15;
  h=Math.imul(h,0x846ca68b);h^=h>>>16;return h>>>0;
 };
 let h=0x915ec11;
 for(const part of [snapshot.model,snapshot.worldId,snapshot.seed,
  snapshot.revision,snapshot.protectedPeople,snapshot.protectedOrganizations,
  snapshot.issuedPeople,snapshot.issuedOrganizations,snapshot.ownerEntities])
  h=hash(h,JSON.stringify(part));
 snapshot.integrity=h.toString(16).padStart(8,'0');
 return snapshot;
}

test('identity-valid checksum must not conceal orphaned principals or divergent owner display names after reopen',()=>{
 const worldId='OWNER-LINK-REOPEN',seed=19990101;
 const registry=createIndexedFictionalNameRegistry({worldId,seed});
 const batch=generateIndexedFictionalNames({registry,worldId,seed,
  roles:{trainer:10,jockey:8},owners:20,
  facilities:{generalFarms:2},maxPartnershipGroups:4});
 const baseline=registry.snapshot(),first=baseline.ownerEntities[0];
 const approvedOrganization=baseline.issuedOrganizations.find(x=>x.id===first.id);
 assert.equal(first.name,approvedOrganization.name);
 assert.ok(baseline.issuedPeople.some(x=>x.id===first.principalId));
 const reopened=createIndexedFictionalNameRegistry({
  worldId,seed,snapshot:JSON.parse(JSON.stringify(baseline))
 });
 assert.deepEqual(reopened.snapshot(),baseline);
 const corruptions=[
  snapshot=>{snapshot.ownerEntities[0].principalId='PERSON-DOES-NOT-EXIST';},
  snapshot=>{snapshot.ownerEntities[0].name='Different Public Stable Name';},
  snapshot=>{snapshot.issuedOrganizations.find(x=>x.id===first.id).name='Wrong Approved Business';}
 ];
 for(const corrupt of corruptions){
  const snapshot=JSON.parse(JSON.stringify(baseline));
  corrupt(snapshot);
  recomputeIndexedSnapshotChecksum(snapshot);
  assert.throws(()=>createIndexedFictionalNameRegistry({worldId,seed,snapshot}),
   /Stored owner organization or principal identity mismatch/);
 }
 const revision=registry.revision;
 assert.throws(()=>registry.commit({
  expectedRevision:revision,
  people:[{id:'PERSON-NEW-ONE',name:'Carmen Vale'}],
  organizations:[{id:'ORG-NEW-ONE',name:'Vale Racing'}],
  owners:[{id:'ORG-NEW-ONE',name:'VALE RACING',principalId:'PERSON-NEW-ONE'}],
  batchIndex:batch.nextCursor.nextBatch
 }),/Owner organization or principal identity mismatch/);
 assert.equal(registry.revision,revision,'invalid linked names must never commit');
 assert.deepEqual(registry.snapshot(),baseline,'failed write leaves approved identity unchanged');
});

test('thousands of generated identities preserve names, owner links and stable IDs across future cohorts and snapshot reopens',()=>{
 const worldId='GENERATION-LINKS-V11',seed=19990101;
 const args={worldId,seed,
  roles:{trainer:55,jockey:44,bloodstock_agent:12,farrier:8},owners:65,
  facilities:{generalFarms:4,studFarms:2},
  maxPartnershipGroups:25,soleOwnerPercent:23};
 let registry=createIndexedFictionalNameRegistry({worldId,seed});
 let cursor=null,checked=0;
 const ids=new Map(),nameBirthBatch=new Map();
 const years=[1999,2005,2011,2017,2023,2029,2035,2041];
 for(const [batchIndex,year] of years.entries()){
  const result=generateIndexedFictionalNames({...args,year,registry,cursor});
  for(const row of [...result.people,...result.owners,...result.stables,
   ...result.farms,...result.trainingCenters]){
   assert.ok(!ids.has(row.id),'immutable ID reused: '+row.id);
   ids.set(row.id,row.name);
   const normalized=key(row.name);
   assert.notEqual(nameBirthBatch.get(normalized),true,
    'protected name was reissued in another generation: '+row.name);
   // Person and its individually named owner organization may share a
   // display name within the SAME generation; never across batches.
   if(!nameBirthBatch.has(normalized))nameBirthBatch.set(normalized,batchIndex);
   assert.equal(nameBirthBatch.get(normalized),batchIndex);
   checked++;
  }
  cursor=result.nextCursor;
  const snapshot=JSON.parse(JSON.stringify(registry.snapshot()));
  const organizations=new Map(snapshot.issuedOrganizations.map(o=>[o.id,o.name]));
  const people=new Set(snapshot.issuedPeople.map(p=>p.id));
  for(const owner of snapshot.ownerEntities){
   assert.equal(organizations.get(owner.id),owner.name);
   assert.ok(people.has(owner.principalId));
  }
  registry=createIndexedFictionalNameRegistry({worldId,seed,snapshot});
  assert.deepEqual(registry.snapshot(),snapshot);
  assert.equal(cursor.revision,registry.revision);
 }
 assert.ok(checked>2000,'expected more than two thousand real named person and organization records');
 assert.equal(ids.size,checked);
 const alternate=createIndexedFictionalNameRegistry({
  worldId,seed,snapshot:JSON.parse(JSON.stringify(registry.snapshot()))
 });
 const a=generateIndexedFictionalNames({...args,year:2051,registry,cursor});
 const b=generateIndexedFictionalNames({...args,year:2051,registry:alternate,cursor});
 assert.deepEqual(
  [...a.people,...a.owners,...a.stables,...a.farms,...a.trainingCenters]
   .map(x=>[x.id,x.name]),
  [...b.people,...b.owners,...b.stables,...b.farms,...b.trainingCenters]
   .map(x=>[x.id,x.name])
 );
 assert.deepEqual(a.nextCursor,b.nextCursor);
});
