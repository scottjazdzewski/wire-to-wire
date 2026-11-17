import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',
 import.meta.url),'utf8');
test('bundled Windows first launch safely handles null active career',()=>{
 assert.match(manager,/if\(activeWorldCareer&&activeWorldCareer\.run\?\.run_id===\s*playerRunId\(activeWorldCareer\.manifest\)\)/);
 assert.doesNotMatch(manager,
  /if\(activeWorldCareer\?\.run\?\.run_id===playerRunId\(activeWorldCareer\.manifest\)\)/);
});
test('player day, race and editable changes never mutate frozen reference run',()=>{
 assert.match(manager,/async function ensurePlayerWorkingCareer\(\)/);
 assert.match(manager,/async function advanceCanonicalRun\(\)\{[\s\S]*?await ensurePlayerWorkingCareer\(\)/);
 assert.match(manager,/async function openNextTestRace\(\)\{[\s\S]*?await ensurePlayerWorkingCareer\(\)/);
 assert.match(manager,/if\(isFrozen\)nextRun\.run_id=playerRunId\(career\.manifest\)/);
 assert.match(manager,/const editable=await loadPersistent1999CareerRun\(store,manifest,playerRunId\(manifest\)\)/);
});
