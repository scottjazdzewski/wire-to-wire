import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 UI_PROJECTION_SCHEMA,UI_COMMAND_SCHEMA,UI_RECEIPT_SCHEMA,
 playerVisibleProjection,createPlayerGameplayBridge
} from '../public/next/1999-canonical-gameplay-bridge.mjs';

const hashA='a'.repeat(64),hashB='b'.repeat(64),hashC='c'.repeat(64);
const projection=(overrides={})=>({
 schema:UI_PROJECTION_SCHEMA,
 engine:{release:'v1.34',sha256:hashA},
 world:{kind:'FICTIONAL_ENGINE_SANDBOX',snapshotId:'TEST-SANDBOX-1999'},
 session:{id:'WTW-RUN-TEST001',date:'1999-01-01',revision:0,journalHash:hashB},
 player:{personId:'P-TEST-001',role:'TRAINER',organizationId:'O-TEST-001',visibility:'PLAYER_SAFE'},
 horses:[{id:'H-TEST-001',name:'Measured Tide',ownerId:'O-TEST-001',
  trainerId:'P-TEST-001',trackId:'T-TEST-001',age:3,sex:'COLT',status:'IN_TRAINING',
  condition:{fitness:.52,fatigue:.18,readiness:.64,healthLabel:'No modeled alert',
   observationStatus:'GAMEPLAY_MODEL_NOT_VET_CERTIFIED'},
  privateLatentPotential:99}],
 races:[{id:'R-TEST-001',trackId:'T-TEST-001',date:'1999-01-08',
  title:'Maiden Special Weight',status:'CONDITION_BOOK',conditionText:'3YO maiden',
  privateProjectedWinChance:.87}],
 entries:[],results:[],
 finances:{currency:'USD',postedBalanceMinor:550000,postedTransactions:[],
  imaginaryPurseForecast:1500000},
 permissions:[{action:'TRAINING_ASSIGN',targetId:'H-TEST-001',allowed:true,reasonCode:'TRAINER_AUTHORIZED'},
  {action:'RACE_ENTER',targetId:'H-TEST-001',allowed:false,reasonCode:'OWNER_CONSENT_MISSING'}],
 ...overrides
});

test('gameplay projection explicitly labels sandbox rather than misrepresenting 267 historical horses',()=>{
 const raw=projection(),p=playerVisibleProjection(raw);
 assert.equal(p.world.kind,'FICTIONAL_ENGINE_SANDBOX');
 assert.equal(p.world.snapshotId,'TEST-SANDBOX-1999');
 assert.equal(p.horses[0].id,'H-TEST-001');
 assert.equal(p.horses[0].name,'Measured Tide');
 assert.equal(p.engine.release,'v1.34');
 assert.equal(p.finances.postedBalanceMinor,550000);
 assert.equal(p.finances.currency,'USD');
 assert.equal(p.horses[0].privateLatentPotential,undefined);
 assert.equal(p.races[0].privateProjectedWinChance,undefined);
 assert.equal(p.finances.imaginaryPurseForecast,undefined);
 assert.ok(Object.isFrozen(p));
 assert.ok(Object.isFrozen(p.horses[0]));
 assert.throws(()=>{p.horses[0].name='Fabricated Winner'});
 assert.equal(raw.horses[0].name,'Measured Tide','UI cannot mutate engine response');
});

test('source-bound history integration requires declared canonical snapshot, not synthetic ID alignment',()=>{
 assert.throws(()=>playerVisibleProjection(projection({
  world:{kind:'HISTORY_INTEGRATED',snapshotId:'WORLD-1999'}
 })),/canonicalSourceSnapshotId/);
 const bound=playerVisibleProjection(projection({
  world:{kind:'HISTORY_INTEGRATED',snapshotId:'WORLD-1999',
   canonicalSourceSnapshotId:'CANON-JAN1999-V33'}
 }));
 assert.equal(bound.world.canonicalSourceSnapshotId,'CANON-JAN1999-V33');
 assert.throws(()=>playerVisibleProjection(projection(),{
  expectedWorldSnapshotId:'CANON-JAN1999-V33'
 }),/world source mismatch/);
 assert.throws(()=>playerVisibleProjection(projection(),{
  expectedEngineSha256:hashC
 }),/engine release mismatch/);
});

test('missing and duplicate IDs, imaginary entries, and invalid future results fail closed',()=>{
 const p=projection();
 assert.throws(()=>playerVisibleProjection({...p,horses:[p.horses[0],p.horses[0]]}),/duplicate ID/);
 assert.throws(()=>playerVisibleProjection({...p,entries:[{
  id:'E-TEST-001',horseId:'H-TEST-001',raceId:'R-DOES-NOT-EXIST',status:'DRAWN'
 }]}),/unprojected race/);
 assert.throws(()=>playerVisibleProjection({...p,results:[{
  raceId:'R-NOT-ON-CARD',finishOrder:['H-TEST-001']
 }]}),/no projected race/);
 assert.throws(()=>playerVisibleProjection({...p,player:{...p.player,visibility:'ENGINE_INTERNAL'}}),
  /PLAYER_SAFE/);
 assert.throws(()=>playerVisibleProjection({...p,finances:{...p.finances,postedBalanceMinor:53.12}}),
  /integer amount/);
});

test('browser UI only forwards engine-permitted action envelopes; it never runs gameplay itself',async()=>{
 let current=projection();let sent=null,requests=0;
 const bridge=createPlayerGameplayBridge({
  getProjection:async()=>{requests++;return current},
  submitCommand:async envelope=>{
   sent=envelope;
   current=projection({session:{id:'WTW-RUN-TEST001',date:'1999-01-02',
    revision:1,journalHash:hashC}});
   return {schema:UI_RECEIPT_SCHEMA,commandId:envelope.commandId,
    sessionId:envelope.sessionId,status:'APPLIED',reasonCode:'OK'};
  },expectedWorldSnapshotId:'TEST-SANDBOX-1999',expectedEngineSha256:hashA
 });
 assert.equal(bridge.isReady(),false);
 await assert.rejects(bridge.dispatch({
  commandId:'CMD-1',action:'TRAINING_ASSIGN',targetId:'H-TEST-001'
 }),/refresh projection/);
 await bridge.refresh();
 assert.equal(bridge.worldKind(),'FICTIONAL_ENGINE_SANDBOX');
 await assert.rejects(bridge.dispatch({
  commandId:'CMD-NOT-ALLOWED',action:'RACE_ENTER',targetId:'H-TEST-001'
 }),/not authorized/);
 const answer=await bridge.dispatch({commandId:'CMD-1',action:'TRAINING_ASSIGN',
  targetId:'H-TEST-001',payload:{plan:'LIGHT'}});
 assert.equal(sent.schema,UI_COMMAND_SCHEMA);
 assert.equal(sent.commandId,'CMD-1');
 assert.equal(sent.expectedRevision,0);
 assert.equal(sent.expectedJournalHash,hashB);
 assert.equal(sent.worldSnapshotId,'TEST-SANDBOX-1999');
 assert.equal(sent.engineSha256,hashA);
 assert.deepEqual(sent.payload,{plan:'LIGHT'});
 assert.equal(answer.status,'APPLIED');
 assert.equal(answer.projection.session.revision,1);
 assert.equal(answer.projection.session.date,'1999-01-02');
 assert.equal(bridge.snapshot().session.journalHash,hashC);
 assert.equal(requests,2,'UI refreshes from engine after authoritative receipt');
});

test('rejected engine actions leave the displayed snapshot unchanged',async()=>{
 let commits=0,reads=0;
 const bridge=createPlayerGameplayBridge({
  getProjection:async()=>{reads++;return projection()},
  submitCommand:async envelope=>{
   commits++;
   return {schema:UI_RECEIPT_SCHEMA,sessionId:envelope.sessionId,
    commandId:envelope.commandId,status:'REJECTED',reasonCode:'HORSE_NOT_CLEARED'};
  }
 });
 const before=await bridge.refresh();
 const answer=await bridge.dispatch({commandId:'CMD-REJECT-1',action:'TRAINING_ASSIGN',
  targetId:'H-TEST-001',payload:{plan:'HARD'}});
 assert.equal(commits,1);
 assert.equal(reads,1);
 assert.strictEqual(before,bridge.snapshot());
 assert.equal(answer.reasonCode,'HORSE_NOT_CLEARED');
 assert.equal(answer.status,'REJECTED');
});

test('bad receipts and projection revision rollback cannot be rendered as success',async()=>{
 const bad=createPlayerGameplayBridge({
  getProjection:async()=>projection(),
  submitCommand:async()=>({schema:UI_RECEIPT_SCHEMA,sessionId:'WRONG',
   commandId:'CMD-4',status:'APPLIED',reasonCode:'OK'})
 });
 await bad.refresh();
 await assert.rejects(bad.dispatch({
  commandId:'CMD-4',action:'TRAINING_ASSIGN',targetId:'H-TEST-001'
 }),/receipt does not match command/);
 let newest=projection({session:{id:'WTW-RUN-TEST001',date:'1999-01-02',
  revision:1,journalHash:hashC}});
 const bridge=createPlayerGameplayBridge({
  getProjection:async()=>newest,
  submitCommand:async()=>{throw Error('unused')}
 });
 await bridge.refresh();
 newest=projection();
 await assert.rejects(bridge.refresh(),/revision moved backward/);
 assert.equal(bridge.snapshot().session.revision,1);
});

test('UI bridge has no local save key, clock, random model, race scoring or payout path',()=>{
 const code=readFileSync(new URL('../public/next/1999-canonical-gameplay-bridge.mjs',import.meta.url),'utf8');
 assert.doesNotMatch(code,/\blocalStorage\s*\./);
 assert.doesNotMatch(code,/\bindexedDB\s*\./);
 assert.doesNotMatch(code,/\bMath\.random\(/);
 assert.doesNotMatch(code,/\bwindow\.\w+\s*=/);
 const shell=readFileSync(new URL('../public/next/index.html',import.meta.url),'utf8');
 assert.doesNotMatch(shell,/1999-canonical-gameplay-bridge\.mjs/,'do not activate until engine interface is approved');
});
