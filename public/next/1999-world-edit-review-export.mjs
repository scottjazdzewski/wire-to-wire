/**
 * User-uploadable review manifest for promoting an EXPLICITLY APPROVED subset
 * of career-local fictional World overrides into the starting-world template.
 * This is NOT a career save, executable code, asset pack or automatic approval.
 */
export const WORLD_EDIT_REVIEW_SCHEMA='WTW_WORLD_EDIT_REVIEW_V1';
const TYPES=new Set(['horse','person','organization','track']);
export function buildWorldEditReviewExport({manifest,world,run,worldEdits,createdAt}={}){
 if(!manifest?.worldId||!Number.isSafeInteger(manifest.seed)||!world?.authority?.sha256||
   !run?.run_id||!run?.clock?.date||!worldEdits||
   worldEdits.schema!=='WTW_CAREER_WORLD_EDITS_V1'||!
   worldEdits.byId||typeof worldEdits.byId!=='object'||Array.isArray(worldEdits.byId))
  throw Error('Open a valid saved fictional industry career before exporting edits');
 if(typeof createdAt!=='string'||!/^\d{4}-\d{2}-\d{2}T/.test(createdAt))
  throw Error('World edit export requires a recorded timestamp');
 const records=Object.entries(worldEdits.byId).sort(([a],[b])=>a.localeCompare(b))
  .map(([ref,fields])=>{
   const split=ref.indexOf(':'),kind=ref.slice(0,split),id=ref.slice(split+1);
   if(split<1||!TYPES.has(kind)||!id||!fields||
     typeof fields!=='object'||Array.isArray(fields)||!Object.keys(fields).length)
    throw Error('Saved world edits contain a malformed entity reference');
   if(Object.entries(fields).some(([key,value])=>typeof key!=='string'||
     typeof value!=='string'||key==='__proto__'||key==='constructor'))
    throw Error('Saved world edits contain invalid field content');
   return {kind,id,fields:Object.fromEntries(Object.entries(fields).map(
    ([key,value])=>[key,value]))};
  });
 const counts=Object.fromEntries([...TYPES].map(kind=>[
  kind,records.filter(record=>record.kind===kind).length]));
 return {
  schema:WORLD_EDIT_REVIEW_SCHEMA,
  purpose:'HUMAN_REVIEW_FOR_STARTING_FICTIONAL_WORLD_PROMOTION',
  generatedAt:createdAt,
  source:{worldId:manifest.worldId,seed:manifest.seed,
   targetOpeningHorses:manifest.targetOpeningHorses??manifest.horseCount,
   horseCount:manifest.horseCount,personCount:manifest.personCount,
   snapshotSha256:world.authority.sha256,
   startYear:1999,careerRunId:run.run_id,careerDate:run.clock.date,
   generatorRevision:manifest.generatorRevision??null},
  recordCount:records.length,counts,records,
  mediaIncluded:false,careerProgressIncluded:false,
  instructions:'Upload this JSON to the WIRE TO WIRE integration chat. Every change requires ID/relationship validation and approval before promotion to the default fictional world. Keep this career save separately. No automatic GitHub commit or build occurs.'
 };
}
