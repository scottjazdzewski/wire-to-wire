/**
 * Repeatable 1999 population-capacity benchmark.
 * Run: npm run bench:world
 * Enumerates lightweight identities only. Full profiles stay on demand.
 * No network access and no game-save mutations.
 */
import {performance} from 'node:perf_hooks';
import {create1999Universe,WORLD_HORSE_POPULATION} from '../public/1999/engine/full-world-generator.mjs';

const world=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const start=performance.now(),ids=new Set(),groups=new Map(),milestones=[];
const checkpoints=new Set([100000,200000,WORLD_HORSE_POPULATION]);
for(let i=0;i<WORLD_HORSE_POPULATION;i++){
 const item=world.worldHorseDirectoryAt(i);
 if(!item?.id||!item?.name)throw Error('Missing world identity '+i);
 if(ids.has(item.id))throw Error('Duplicate world identity '+item.id);
 ids.add(item.id);
 groups.set(item.registryGroup,(groups.get(item.registryGroup)||0)+1);
 if(i%271===0&&world.worldIndexByHorseId(item.id)!==i)
  throw Error('Non-reversible ID at '+i+': '+item.id);
 if(checkpoints.has(i+1))milestones.push({records:i+1,elapsedMs:+(performance.now()-start).toFixed(1)});
}
const stats=world.populationCacheStats();
const report={schema:world.schema,worldHorses:ids.size,legacyHorses:world.counts.horses,
 partitionGroups:Object.fromEntries(groups),milestones,
 profileCacheLimits:{registered:stats.legacyFullProfileLimit,additional:stats.additionalFullProfileLimit},
 memoryMiB:+(process.memoryUsage().rss/(1024*1024)).toFixed(1),
 note:'Local Node enumeration benchmark; NOT browser FPS/load timing or verified historical population'};
console.log(JSON.stringify(report,null,2));
if(ids.size!==WORLD_HORSE_POPULATION)process.exitCode=1;
