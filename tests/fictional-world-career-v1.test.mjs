import test from 'node:test';
import assert from 'node:assert/strict';
import {createFictional1999GameRun} from '../public/1999/engine/fictional-world-career-v1.mjs';
import {calculate1999OpeningTreasury,OPENING_OPERATION_RESERVE_MONTHS,
 OPENING_OPERATION_MONTHLY_PER_HORSE_BUDGET_MINOR}
 from '../public/1999/engine/fictional-industry-game-world-bridge-1999.mjs';
import {validateGameRun} from '../public/1999/game/state.js';
test('opening operation treasury scales to full racing string, tier and resources',()=>{
 const fullString=calculate1999OpeningTreasury({
  portfolioTier:'ELITE',resources:55,activeRunnerCount:311});
 assert.equal(fullString,Math.ceil(311*
  OPENING_OPERATION_MONTHLY_PER_HORSE_BUDGET_MINOR*
  OPENING_OPERATION_RESERVE_MONTHS*1.025));
 assert.ok(fullString>=311*OPENING_OPERATION_MONTHLY_PER_HORSE_BUDGET_MINOR*
  OPENING_OPERATION_RESERVE_MONTHS,
  'a large stable should open with at least eighteen months of its modeled care budget');
 assert.equal(calculate1999OpeningTreasury({
  portfolioTier:'HANDFUL',resources:55,activeRunnerCount:0}),25000000);
 assert.ok(calculate1999OpeningTreasury({
  portfolioTier:'ELITE',resources:55,activeRunnerCount:0})>
  calculate1999OpeningTreasury({
   portfolioTier:'SMALL',resources:55,activeRunnerCount:0}));
 assert.ok(calculate1999OpeningTreasury({
  portfolioTier:'REGIONAL',resources:100,activeRunnerCount:100})>
  calculate1999OpeningTreasury({
   portfolioTier:'REGIONAL',resources:0,activeRunnerCount:100}));
 assert.throws(()=>calculate1999OpeningTreasury({
  portfolioTier:'ELITE',resources:55,activeRunnerCount:-1}),/runner count/);
});

test('full 1999 industry enters the canonical game run with editable names',async()=>{
 const career=await createFictional1999GameRun({
  seed:19990101,worldId:'CareerBridgeTest',
  tracks:[{id:'T-9001',name:'Test Racing Downs',trackOperating:'OPEN_1999'}],
  foundationHorses:[{id:'H-1980-0001',name:'Old Sire',sex:'HORSE',foalYear:1980},
   {id:'H-1981-0002',name:'Old Mare',sex:'MARE',foalYear:1981}],horseCount:24
 });
 assert.equal(career.world.manifest.generatedHorses,24);
 assert.equal(career.world.manifest.horseNaming,'PROVISIONAL_EDITABLE');
 assert.equal(validateGameRun(career.run,career.world),career.run);
 assert.equal(career.run.world_ref.sha256,career.world.authority.sha256);
 assert.ok(career.run.player.operation_id);
 assert.equal(career.run.runtime.finances.balance_minor,
  calculate1999OpeningTreasury({portfolioTier:career.operation.portfolioTier,
   resources:career.operation.ratings?.resources??55,
   activeRunnerCount:career.playableHorseCount}));
 assert.equal(career.run.runtime.finances.operation_balances_minor[
  career.operation.id],career.run.runtime.finances.balance_minor);
});
