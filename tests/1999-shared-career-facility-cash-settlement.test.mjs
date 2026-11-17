import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash,webcrypto} from 'node:crypto';
import {gunzipSync} from 'node:zlib';
import {unpackShared1999Career} from '../public/1999/engine/shared-1999-career-package.mjs';
import {advanceFacilities} from '../src/game/facility-operations.js';

globalThis.crypto??=webcrypto;
const asset=new URL('../public/assets/careers/WTW_1999_FULL_WORLD_SHARED_CAREER.wtwcareer.gz',
 import.meta.url);

test('exact shared 300k May 1999 career: copy an existing site and reconcile next-day cash without modifying the checkpoint',async()=>{
 const bytes=readFileSync(asset);
 const beforeDigest=createHash('sha256').update(bytes).digest('hex');
 const checkpoint=await unpackShared1999Career(gunzipSync(bytes));
 const manifest=checkpoint.world.manifest;
 assert.equal(manifest.worldId,'WTW1999FullIndustry-COHORTS-V2-H300000');
 assert.equal(manifest.horseCount,300000);
 const original=checkpoint.careerRecord.changes.canonicalRun;
 assert.equal(original.run_id,'WTW-RUN-1999-19990101-SIZE-300000');
 assert.equal(original.clock.date,'1999-05-29');
 const sites=Object.values(original.runtime.facilities.sites||{});
 const balances=original.runtime.finances.operation_balances_minor;
 const site=sites.find(s=>s.status==='ACTIVE'&&
  Number.isSafeInteger(s.daily_upkeep_minor)&&s.daily_upkeep_minor>0&&
  Number.isSafeInteger(balances[s.operator_organization_id||s.owner_id]));
 assert.ok(site,'Shared run needs at least one real active staffed facility with posted operating cash');
 const owned=original.runtime.registered_horses.by_id;
 for(const horse of Object.values(owned)){
  assert.ok(horse.owner_organization_id&&horse.trainer_id,'Registered horse must retain its connections');
  assert.ok(original.runtime.facilities.sites[horse.current_residence_id],
   'Registered horse must retain its exact physical facility ID');
 }
 const copy=structuredClone(original);
 copy.clock.date='1999-05-30'; // next day after the unchanged shared May 29 clock
 // A targeted replay of one actual saved site, not a replacement world or a
 // claim that the full 300k-horse multi-season simulation has been certified.
 copy.runtime.facilities.sites={[site.id]:structuredClone(site)};
 const oldEntries=copy.runtime.finances.ledger.length;
 advanceFacilities({state:copy,world:null,emit:()=>{}});
 const delta=copy.runtime.finances.ledger.slice(oldEntries);
 const transactions=new Map();
 for(const entry of delta){
  if(!entry.transaction_id?.startsWith('FACILITY_OUTFLOW:'))continue;
  if(!transactions.has(entry.transaction_id))transactions.set(entry.transaction_id,[]);
  transactions.get(entry.transaction_id).push(entry);
 }
 assert.ok(transactions.size>0,'Real site must produce a modeled outflow with a balancing receipt');
 const account=site.operator_organization_id||site.owner_id;
 let debitTotal=0;
 for(const rows of transactions.values()){
  assert.equal(rows.length,2,'Outflow has exactly one real debit and one external receipt');
  assert.equal(rows.reduce((n,r)=>n+r.amount_minor,0),0);
  const debit=rows.find(r=>r.operation_id===account);
  const receipt=rows.find(r=>r.kind==='FACILITY_EXTERNAL_RECEIPT');
  assert.ok(debit&&receipt);
  assert.ok(debit.amount_minor<0);
  assert.equal(receipt.amount_minor,-debit.amount_minor);
  assert.equal(receipt.person_id,null);
  debitTotal+=debit.amount_minor;
 }
 const newBoardIncome=delta.filter(x=>x.operation_id===account&&
  x.kind==='FACILITY_BOARDING_REVENUE').reduce((n,x)=>n+x.amount_minor,0);
 assert.equal(copy.runtime.finances.operation_balances_minor[account],
  balances[account]+newBoardIncome+debitTotal);
 assert.equal(original.clock.date,'1999-05-29');
 assert.equal(original.runtime.finances.ledger.length,oldEntries);
 assert.equal(createHash('sha256').update(readFileSync(asset)).digest('hex'),beforeDigest,
  'Canonical shared career bytes may not change during tests');
});
