import test from 'node:test';import assert from 'node:assert/strict';
import {createNameExclusionIndex,namingBrief,createSemanticHorseNamingSession,createBridgeProposerFromReviewedLedger,STYLE_DOMAINS} from './semantic-horse-names.mjs';
const e=(id,year=2000,status='UNNAMED')=>({horseId:id,foalYear:year-2,namingYear:year,nameStatus:status,ownerId:'O-'+id});
const yes=(items)=>items.map(({proposal:p})=>({horseId:p.horseId,name:p.name,score:5,grammarNatural:true,humanBelievable:true,originalEnough:true,eraAppropriate:true,reason:'TEST_FIXTURE'}));
test('reference screens exact and one-edit both directions',()=>{const idx=createNameExclusionIndex(['Daring Friday','Mint Rose']);assert.equal(idx.issue('Daring-Friday'),'EXACT_REFERENCE_OR_USED');assert.equal(idx.issue('Daring Frday'),'NEAR_REFERENCE_OR_USED');assert.equal(idx.issue('Daring Fridays'),'NEAR_REFERENCE_OR_USED');assert.equal(idx.issue('Mints Rose'),'NEAR_REFERENCE_OR_USED');assert.equal(idx.issue('Novel Name'),null);});
test('brief uses only supplied genealogy and real-owner style, otherwise editorial fiction',()=>{const b=namingBrief({...e('H1'),sireName:'Known Sire',damName:'Known Dam'},{seed:'X',ownerStyles:{'O-H1':{domain:'pedigree_echo'}}});assert.equal(b.parentNames.sire,'Known Sire');assert.equal(b.sourceDomainBasis,'SUPPLIED_OWNER_STYLE');const u=namingBrief(e('H2'),{seed:'X'});assert.equal(u.parentNames,null);assert.equal(u.sourceDomainBasis,'FICTIONAL_EDITORIAL_VARIETY');assert.ok(STYLE_DOMAINS.includes(u.sourceDomain));});
test('fails closed without independent reviewer; never marks registered',async()=>{const s=createSemanticHorseNamingSession({proposer:async bs=>bs.map(b=>({horseId:b.horseId,name:'Plausible Call',styleDomain:b.sourceDomain,sourceYear:1990})),maxRounds:1});const r=await s.previewBatch([e('H-1')]);assert.equal(r[0].status,'HELD_FOR_CREATIVE_AND_EDITORIAL_REVIEW');assert.equal(s.summary().ready,0);assert.equal(s.summary().rejected.REVIEWER_NOT_CONNECTED,1);});
test('rejects collisions, nonsensical QA and out-of-era, retries different whole names',async()=>{
 const p=async(bs,{attempt})=>bs.map(b=>({horseId:b.horseId,name:attempt===0?'Real Horse':attempt===1?'Nonsense Fork':'Proper Echo',styleDomain:b.sourceDomain,sourceYear:attempt===1?2100:1999}));
 const s=createSemanticHorseNamingSession({protectedNames:['Real Horse'],proposer:p,reviewer:yes,maxRounds:3});
 const r=await s.previewBatch([e('H-1')]);assert.equal(r[0].name,'Proper Echo');assert.equal(r[0].registrationStatus,'NOT_REGISTERED');assert.equal(s.summary().rejected.EXACT_REFERENCE_OR_USED,1);assert.equal(s.summary().rejected.FUTURE_SOURCE,1);
});
test('independent reviewer can reject a grammatically valid but artificial name',async()=>{let round=0;const p=async(bs,{attempt})=>bs.map(b=>({horseId:b.horseId,name:attempt===0?'Proper Croissant':'Sure Enough',styleDomain:b.sourceDomain}));
 const reviewer=async(items)=>items.map(({proposal:q})=>({horseId:q.horseId,name:q.name,score:q.name==='Proper Croissant'?2:5,grammarNatural:true,humanBelievable:q.name!=='Proper Croissant',originalEnough:true,eraAppropriate:true}));
 const s=createSemanticHorseNamingSession({proposer:p,reviewer});const r=await s.previewBatch([e('H-1')]);assert.equal(r[0].name,'Sure Enough');assert.equal(s.summary().rejected.EDITORIAL_REJECT,1);
});
test('preserves canon and registered identities without creative calls',async()=>{let called=0;const s=createSemanticHorseNamingSession({proposer:async()=>{called++;return [];},reviewer:yes});const r=await s.previewBatch([e('H1',2000,'CANON_LOCKED'),e('H2',2000,'REGISTERED')]);assert.equal(called,0);assert.ok(r.every(x=>x.status==='PRESERVED_EXISTING'&&x.name===null));});
test('never repeats names within or across cohorts, even if reviewer approves duplicates',async()=>{const s=createSemanticHorseNamingSession({proposer:async(bs,{attempt})=>bs.map(b=>({horseId:b.horseId,name:attempt===0?'One Good Day':'After The Rain',styleDomain:b.sourceDomain})),reviewer:yes,maxRounds:2});const r=await s.previewBatch([e('H1'),e('H2')]);assert.equal(r.filter(x=>x.name).length,2);const other=await s.previewBatch([e('H3',2001)]);assert.equal(other[0].name,null);assert.equal(s.summary().ready,2);});
test('idempotent repeated same horse, fail bad chronology/duplicate event',async()=>{let calls=0;const s=createSemanticHorseNamingSession({proposer:async bs=>{calls++;return bs.map(b=>({horseId:b.horseId,name:'Clear Signal',styleDomain:b.sourceDomain}));},reviewer:yes});const row=(await s.previewBatch([e('H1')]))[0];const again=(await s.previewBatch([e('H1')]))[0];assert.deepEqual(row,again);assert.equal(calls,1);await assert.rejects(s.previewBatch([e('H1'),e('H1')]),/DUPLICATE_HORSE/);await assert.rejects(s.previewBatch([{...e('H9'),foalYear:2002}]),/CHRONOLOGY/);});
test('bridge callback maps reviewed proposal, never marks it registered or makes new names',async()=>{const s=createSemanticHorseNamingSession({proposer:async bs=>bs.map(b=>({horseId:b.horseId,name:'Paper Lantern',styleDomain:b.sourceDomain})),reviewer:yes});await s.previewBatch([e('H1')]);const f=createBridgeProposerFromReviewedLedger(s.exportProvisionalLedger());const a=f({horseId:'H1',namingYear:2000,attempt:0});assert.equal(a.name,'Paper Lantern');assert.equal(a.method,'v456_semantic_whole_name');assert.equal(a.registrationStatus,'NOT_REGISTERED');assert.equal(f({horseId:'H1',namingYear:2001,attempt:0}),null);assert.equal(f({horseId:'H1',namingYear:2000,attempt:1}),null);});
test('concurrent batches cannot reserve same proposed name twice',async()=>{
 const s=createSemanticHorseNamingSession({proposer:async bs=>bs.map(b=>({horseId:b.horseId,name:'Separate Worlds',styleDomain:b.sourceDomain})),reviewer:yes,maxRounds:1});
 const [a,b]=await Promise.all([s.previewBatch([e('H-1')]),s.previewBatch([e('H-2')])]);
 assert.equal([a[0],b[0]].filter(x=>x.name).length,1);assert.equal(s.summary().ready,1);assert.equal(s.summary().held,1);
});
test('template-opening concentration is blocked in large phrase samples',async()=>{
 const alpha=i=>[i%26,(i*7)%26,Math.floor(i/26)%26,(Math.floor(i/26)*11)%26,(i*23+Math.floor(i/26)*5)%26].map(n=>String.fromCharCode(65+n)).join('');
 const ids=Array.from({length:220},(_,i)=>e('H-'+i));
 const s=createSemanticHorseNamingSession({proposer:async bs=>bs.map(b=>({horseId:b.horseId,name:'Call Me '+alpha(Number(b.horseId.slice(2))),styleDomain:b.sourceDomain})),reviewer:yes,maxRounds:1});
 const records=await s.previewBatch(ids);assert.ok(records.some(x=>x.status==='HELD_FOR_CREATIVE_AND_EDITORIAL_REVIEW'));assert.ok(s.summary().rejected.PHRASE_PREFIX_CONCENTRATION>0);
});
test('large invented-domain concentration is not treated as credible owner style',async()=>{
 const s=createSemanticHorseNamingSession({proposer:async bs=>bs.map(b=>({horseId:b.horseId,name:'Fable'+b.horseId.replaceAll('-',''),styleDomain:b.sourceDomain})),reviewer:yes,maxRounds:1,sourceFamilyCeiling:.1});
 // The test is a fixture for the algorithm, NOT a body of believable names.
 const result=await s.previewBatch(Array.from({length:300},(_,i)=>e('X'+String(i).padStart(3,'0'))));
 assert.ok(result.filter(x=>x.status==='PROVISIONAL_QA_PASSED').length>0);
 assert.ok(s.summary().ready<=300);
});
test('unsupported geographic/pedigree/person-language style is impossible without supplied facts',()=>{
 const base=e('H-NO-FACTS');
 assert.throws(()=>namingBrief(base,{ownerStyles:{'O-H-NO-FACTS':{domain:'pedigree_echo'}}}),/REQUIRED_PROVENANCE/);
 assert.throws(()=>namingBrief(base,{ownerStyles:{'O-H-NO-FACTS':{domain:'regional_reference'}}}),/REQUIRED_PROVENANCE/);
 assert.throws(()=>namingBrief(base,{ownerStyles:{'O-H-NO-FACTS':{domain:'private_joke'}}}),/REQUIRED_PROVENANCE/);
 assert.throws(()=>namingBrief(base,{ownerStyles:{'O-H-NO-FACTS':{domain:'international_language'}}}),/REQUIRED_PROVENANCE/);
});