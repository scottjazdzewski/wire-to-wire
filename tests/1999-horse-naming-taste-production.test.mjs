import test from 'node:test';
import assert from 'node:assert/strict';
import {OWNER_RATED_NAMES_V482,OWNER_RATED_TOTAL_V482,OWNER_RATING_COUNTS_V482,
 ownerRatedNameScore,buildTasteDirectedWritingLens,ownerTasteResearchSummary,
 CREATIVE_PERSPECTIVES_V482} from '../src/game/horse-naming-taste-v482.js';
import {OWNER_REVIEWED_NAME_KEYS_V478} from '../src/game/horse-naming-owner-review-v478.js';
import {auditHorseNamingCohort} from '../src/game/horse-naming-cohort-audit-v482.js';
import {buildStoryFirstWritingRequest} from '../src/game/horse-naming-model-creator.js';
import {buildStoryFirstWritingRequest as browserWriting} from '../public/1999/game/horse-naming-model-creator.js';
const normalize=s=>s.toLocaleLowerCase('en-US').replace(/[\u2018\u2019]/g,"'").replace(/[^a-z0-9]/g,'');
const brief=(horseId='H-GAME-1999-TEST-0001')=>({
 schema:'WTW_GAME_NAME_ORIGIN_BRIDGE_V1',status:'READY_FOR_ORIGINAL_NAME_WRITING',horseId,
 foalingYear:1996,owner:{id:'O-OWNER-001',name:'Owner Farm'},breeder:{id:'O-BREEDER-001',name:'Breeder Farm'},
 evidence:[{id:'OWNER_STORY:FOAL-001',kind:'OWNER_ATTESTED',sourceRef:'owner_story:FOAL-001',
 detail:'The colt was born during a sudden lightning storm and the owner recognized the mare by her breathing in the darkness.'}]
});
test('exact 520 score archive matches all previously reviewed exclusions',()=>{
 assert.equal(OWNER_RATED_TOTAL_V482,520);
 const counts={excellent:0,acceptable:0,questionable:0,reject:0};
 const keys=OWNER_RATED_NAMES_V482.map(([name,score])=>{
  assert.ok([1,2,3,4].includes(score));counts[['','excellent','acceptable','questionable','reject'][score]]++;
  return normalize(name);
 });
 assert.deepEqual(counts,OWNER_RATING_COUNTS_V482);
 assert.equal(new Set(keys).size,520);
 assert.deepEqual(new Set(keys),new Set(OWNER_REVIEWED_NAME_KEYS_V478));
 assert.equal(ownerRatedNameScore('Wild Geese'),4);
 assert.equal(ownerRatedNameScore('Mousetrap'),1);
});
test('writing prompt actually consumes real owner scores without recycling them as candidate names',()=>{
 const spec=buildStoryFirstWritingRequest(brief());
 const input=JSON.parse(spec.user);
 const lens=input.creativeDirection;
 assert.equal(input.owner.id,'O-OWNER-001');
 assert.ok(CREATIVE_PERSPECTIVES_V482.some(p=>p.id===lens.id));
 assert.ok(lens.priorExcellent.every(n=>ownerRatedNameScore(n)===1));
 assert.ok(lens.priorRejected.every(n=>ownerRatedNameScore(n)===4));
 assert.match(spec.system,/owner.*rating/i);
 assert.match(spec.system,/not.*copy/i);
 assert.equal(input.ratingHistoryReviewed,520);
});
test('creative brief is deterministic and changes lens over different foals',()=>{
 const a=buildStoryFirstWritingRequest(brief()),b=buildStoryFirstWritingRequest(brief());
 assert.deepEqual(a,b);
 const found=new Set(Array.from({length:128},(_,i)=>JSON.parse(buildStoryFirstWritingRequest(brief('H-GAME-1999-TEST-'+i)).user).creativeDirection.id));
 assert.equal(found.size,8);
 assert.equal(buildTasteDirectedWritingLens({horseId:brief().horseId,ownerId:brief().owner.id}).id,JSON.parse(a.user).creativeDirection.id);
});
test('same creative direction runs in the browser game and server game',()=>{
 assert.deepEqual(browserWriting(brief()),buildStoryFirstWritingRequest(brief()));
});
test('bulk name audit detects formulaic population without claiming 90 percent quality',()=>{
 const names=Array.from({length:55_000},(_,i)=>'Golden '+String(i));
 const a=auditHorseNamingCohort({names});
 assert.equal(a.uniqueExact,55_000);
 assert.ok(a.flagCount>0);
 assert.equal(a.ownerAcceptanceProven,false);
 assert.equal(a.gameWrites,0);
 assert.equal(ownerTasteResearchSummary().representativeOfProduction,false);
});