import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
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
 const world=readFileSync(new URL('../public/1999/engine/full-world-generator.mjs',import.meta.url),'utf8');
 const legacy=readFileSync(new URL('../public/1999/engine/on-demand-fictional-name-batches.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(source,/\b(?:fetch|localStorage|indexedDB|writeFile|setItem)\s*\(/);
 assert.doesNotMatch(world,/indexed-fictional-name-registry/);
 assert.doesNotMatch(legacy,/indexed-fictional-name-registry/);
 const w=createFictionalWorldNameEngine({worldId:'INDEX-LEGACY-COMPAT',seed:12345,
  roles:{trainer:8},owners:12,facilities:{generalFarms:2}});
 assert.equal(w.owners.length,12);
});
