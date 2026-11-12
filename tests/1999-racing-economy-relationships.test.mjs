import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const gen=read('public/1999/engine/full-world-generator.mjs');
const ui=read('public/next/next.js');
const adapter=read('public/next/1999-ui-source.mjs');
const profile=read('public/next/1999-restored-profiles.js');
const attribute=read('public/next/1999-attribute-ranking.js');
const shell=read('public/next/index.html');

test('opening-1999 career is source-separated from simulated pre-1999 races',()=>{
 assert.match(gen,/sourceRecordedStakesSeasons:c\.sourceRecordedStakesSeasons/);
 assert.match(gen,/provenance:'GENERATED_PRE_1999_TEST_RACE_NOT_VERIFIED'/);
 assert.match(gen,/const raced=age>=3&&sex!=='STALLION'/);
 assert.match(gen,/raceHistory,\s*provenance:'GENERATED_1998_AND_PRIOR_NONCANON_TEST_RACES_ONLY'/);
 assert.match(gen,/racingStatus1999:careerState/);
 assert.match(adapter,/modelRaceHistory:!source\?h\.career\?\.raceHistory/);
 assert.match(profile,/node\.dataset\.testCareer/);
 assert.match(ui,/PRE-1999 SIMULATED RACE HISTORY/);
});
test('stable attributes are a distinct sortable view without replacing the regular roster',()=>{
 assert.match(shell,/1999-attribute-ranking\.js\?rev=/);
 assert.match(ui,/\['attributes','ATTRIBUTES'\]/);
 assert.match(ui,/if\(APP\.stableFilter==='attributes'\)/);
 assert.match(ui,/stable-attribute-sort/);
 assert.match(attribute,/SIMULATED TEST SCORES/);
 assert.match(attribute,/data-ng="horse"/);
});
test('trainer and jockey compensation are correlated to quality and keep distinct contract structures',()=>{
 assert.match(gen,/Math\.pow\(quality,2\.4\)/);
 assert.match(gen,/MOUNT_AND_PURSE_FEES/);
 assert.match(gen,/winShareRate:jockeyWinRate/);
 assert.match(gen,/dayRate,estimatedAnnualFees:annualBaseSalary,winShareRate/);
 assert.match(adapter,/_testCompensation:p\.compensation/);
 assert.match(ui,/COMPENSATION TYPE · TEST/);
 assert.match(ui,/\['commission','WIN %'/);
});
test('relationships are linked to actual owner, trainer, and jockey identity keys',()=>{
 assert.match(gen,/ownerTrainer:relationship\(owner\.id,trainer\.id,'OWNER_TRAINER'\)/);
 assert.match(gen,/trainerJockey:relationship\(trainer\.id,preferredJockeyId,'TRAINER_JOCKEY'\)/);
 assert.match(adapter,/trainerRelations=new Map\(\),jockeyRelations=new Map\(\)/);
 assert.match(profile,/node\.dataset\.testRelationships/);
 assert.match(ui,/\['relationship','OUR REL'/);
});
