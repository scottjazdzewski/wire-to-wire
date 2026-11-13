import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createOrganizationNameRoster,createProtectedOrganizationRootGuard}
 from '../public/1999/engine/organization-name-engine.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {generateOnDemandFictionalNames}
 from '../public/1999/engine/on-demand-fictional-name-batches.mjs';
import {auditFictionalIdentityNaming,auditFictionalOnDemandNameState,
 FICTIONAL_NAME_QUALITY_MODEL}
 from '../public/1999/engine/fictional-name-quality-audit.mjs';

const normalize=s=>String(s).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');
const noFacilities={generalFarms:0,studFarms:0,nurseries:0,bloodstockFarms:0,breakingTraining:0};

test('indexed historical root guard has exact legacy prefix semantics across 12k roots',()=>{
 const roots=Array.from({length:12000},(_,i)=>
  'name'+String(i).padStart(6,'0')+' meadow');
 roots.push('kingsmere','stone ridge','river');
 const guard=createProtectedOrganizationRootGuard(roots);
 const naive=root=>roots.some(old=>(root.startsWith(old)||old.startsWith(root))&&
  Math.min(root.length,old.length)>=7);
 const probes=['kingsmere','kingsmere valley','kings','kingsmere equine','stone ridge',
  'stone','name000225 meadow','name000225 meadow farm','name0002','river',
  'unrelated farm','name000099 meadow west','name012000 meadow'];
 for(let i=0;i<2000;i++){
  const n=(Math.imul(i+198,2654435761)>>>0)%12000;
  const root='name'+String(n).padStart(6,'0')+(i%4===0?' meadow west':
   i%4===1?'':i%4===2?' meadow':' meadow golf');
  probes.push(root);
 }
 for(const p of probes)assert.equal(guard(p),naive(p),'prefix collision '+p);
 assert.throws(()=>createProtectedOrganizationRootGuard(null),/Invalid/);
});
test('large protected historical roster does not produce a near-identical new business',()=>{
 const historic=Array.from({length:12000},(_,i)=>
  'Archive Heritage '+String(i).padStart(6,'0')+' Farm');
 historic.push('Kingsmere Farm','River Stone Racing','Old Oak Estate Stud');
 const roster=createOrganizationNameRoster({
  seed:19990101,ownerCount:80,barnCount:30,farmCount:90,breakingCount:10,
  principalNames:Array.from({length:80},(_,i)=>'Owner Person'+i),
  trainerNames:Array.from({length:30},(_,i)=>'Trainer Person'+i),
  protectedNames:historic
 });
 const all=[...roster.owners,...roster.barns,...roster.farms,...roster.breakingCenters];
 assert.equal(all.length,210);
 assert.equal(new Set(all.map(normalize)).size,all.length);
 assert.ok(!all.some(x=>/^(Kingsmere|River Stone|Old Oak Estate)\b/i.test(x)));
 assert.equal(roster.summary.farms,90);
});
test('quality auditing validates 11,202 people and 8,408 organizations across different seeds',()=>{
 for(const seed of [19990101,19990102,23555331]){
  const world=createFictionalWorldNameEngine({worldId:'WorldQuality-'+seed,seed,
   protectedNames:['Kingsmere Farm','Historic Registry Stud']});
  const report=auditFictionalIdentityNaming({
   people:world.people,owners:world.owners,stables:world.stables,
   farms:world.farms,trainingCenters:world.trainingCenters,
   protectedNames:['Kingsmere Farm','Historic Registry Stud']
  });
  assert.equal(report.model,FICTIONAL_NAME_QUALITY_MODEL);
  assert.equal(report.pass,true,JSON.stringify(report.issues));
  assert.equal(report.totalErrors,0);
  assert.equal(report.people,11202);
  assert.equal(report.organizations,8408);
  assert.equal(report.ownerCount,3308);
  assert.equal(Object.values(report.ownerArchetypes).reduce((a,b)=>a+b,0),3308);
  assert.ok(Object.keys(report.namingRegions).length>=6);
  assert.equal(report.errorCounts.protectedCollisions,0);
 }
});
test('audit identifies duplicate names, synthetic facility mismatch and broken relationships',()=>{
 const w=createFictionalWorldNameEngine({
  worldId:'QA-Corruption',seed:345555,roles:{trainer:4,owner:0},
  owners:7,facilities:{studFarms:1,generalFarms:1},protectedNames:['Canon Farm']
 });
 const original=auditFictionalIdentityNaming(w);
 assert.equal(original.pass,true);
 const broken={...w,
  people:[...w.people,{...w.people[0],id:'DUPLICATE-ID',name:w.people[0].name}],
  stables:[...w.stables.slice(1),{...w.stables[0],trainerId:'NOT-A-TRAINER'}],
  farms:[...w.farms.slice(1),{...w.farms[0],name:'Madeup Racing'}]
 };
 const report=auditFictionalIdentityNaming(broken);
 assert.equal(report.pass,false);
 assert.ok(report.errorCounts.duplicateNames>0);
 assert.ok(report.errorCounts.missingTrainerLinks>0);
 assert.ok(report.errorCounts.wrongFacilityCategory>0);
 assert.throws(()=>auditFictionalIdentityNaming({...w,people:null}),/Invalid/);
});
test('multi-batch QA catches state rewrites and preserves previous owner and group identities',()=>{
 const params={worldId:'Lifetime-QA',seed:234567,roles:{trainer:30,jockey:25},
  owners:75,facilities:{generalFarms:2,studFarms:1},
  maxPartnershipGroups:9,soleOwnerPercent:24,
  protectedNames:['Historic Canon Business','Historic Canon Person']};
 let prior=null,totalNewGroups=0;
 for(let i=0;i<12;i++){
  const batch=generateOnDemandFictionalNames({...params,state:prior});
  const quality=auditFictionalIdentityNaming({
   ...batch,protectedNames:params.protectedNames
  });
  assert.equal(quality.pass,true,JSON.stringify(quality.issues));
  const checkpoint=auditFictionalOnDemandNameState({
   state:batch.nextState,batch,previousState:prior
  });
  assert.equal(checkpoint.pass,true,checkpoint.issues.join(','));
  totalNewGroups+=batch.ownership.newPartnershipGroups.length;
  assert.ok(totalNewGroups<=params.maxPartnershipGroups);
  prior=batch.nextState;
 }
 assert.equal(totalNewGroups,9);
 assert.equal(prior.partnershipsIssued,9);
 const damaged={...prior,ownerEntities:[...prior.ownerEntities].reverse()};
 const broken=auditFictionalOnDemandNameState({
  state:damaged,batch:{nextState:damaged},
  previousState:{...prior,nextBatch:prior.nextBatch-1}
 });
 assert.equal(broken.pass,false);
 assert.ok(broken.issues.includes('OWNER_IDENTITY_REWRITTEN'));
 const badNames={...prior,mintedNames:[...prior.mintedNames,prior.mintedNames[0]]};
 assert.ok(!auditFictionalOnDemandNameState({state:badNames,batch:{nextState:badNames}}).pass);
});
test('standalone benchmark produces only disposable naming statistics',()=>{
 const text=execFileSync(process.execPath,[
  new URL('../scripts/bench-fictional-naming-v10.mjs',import.meta.url).pathname,
  '--worlds','1','--batches','2','--owners','25','--trainers','15','--jockeys','15'
 ],{encoding:'utf8',timeout:90000});
 const results=JSON.parse(text);
 assert.equal(results.benchmark,'WTW-FICTIONAL-NAMES-V10');
 assert.equal(results.currentWorldModified,false);
 assert.equal(results.disposable,true);
 assert.equal(results.options.worlds,1);
 assert.equal(results.totals.owners,50);
 assert.ok(results.totals.issuedNames>100);
 assert.ok(results.durationMs>=0);
});
