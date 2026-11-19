#!/usr/bin/env node
/**
 * Offline, reviewed export -> canonical 1999 source release.
 * Input: WTW_WORLD_EDIT_REVIEW_V1 exported by the official Windows game.
 * Output: source-controlled approved promotion pack compiled into next EXE.
 *
 * Never modifies the baseline saved world, existing player careers, or immutable IDs.
 */
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {dirname,join,resolve} from 'node:path';
import {APPROVED_1999_WORLD_RELEASE} from
 '../public/1999/engine/approved-1999-world-release-data.mjs';
import {validateApproved1999WorldRelease,ORIGINAL_1999_WORLD_ID}
 from '../public/1999/engine/approved-1999-world-release.mjs';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const bundlePath=join(root,'public/1999/engine/approved-1999-world-release-data.mjs');
const pendingPath=join(root,'data/1999-world-structural-requests-pending.json');
const [input,...flags]=process.argv.slice(2);
const approve=flags.includes('--approve'),dryRun=flags.includes('--dry-run');
if(!input||flags.some(f=>!['--approve','--dry-run'].includes(f))||(!approve&&!dryRun)){
 console.error('Usage: node scripts/promote-1999-world-changes.mjs <WTW_WORLD_CHANGES_FOR_REVIEW.json> --dry-run|--approve');
 process.exitCode=2;
}else{
 const exported=JSON.parse(await readFile(resolve(input),'utf8'));
 const source=exported.source||{};
 if(exported.schema!=='WTW_WORLD_EDIT_REVIEW_V1'||
    exported.purpose!=='HUMAN_REVIEW_FOR_STARTING_FICTIONAL_WORLD_PROMOTION'||
    source.worldId!==ORIGINAL_1999_WORLD_ID||source.seed!==19990101||
    source.horseCount!==300000||source.startYear!==1999||
    !/^[a-f0-9]{64}$/i.test(source.snapshotSha256||'')||
    !Array.isArray(exported.records)||
    exported.recordCount!==exported.records.length||
    !source.careerRunId||typeof source.careerDate!=='string')
  throw Error('Export does not belong to the original 300,000-horse playable 1999 world. No release records changed.');
 validateApproved1999WorldRelease(APPROVED_1999_WORLD_RELEASE);
 if(APPROVED_1999_WORLD_RELEASE.sourceSnapshotSha256&&
    APPROVED_1999_WORLD_RELEASE.sourceSnapshotSha256!==source.snapshotSha256)
  throw Error('Export world fingerprint conflicts with the existing approved release; reconcile source differences first');
 const recordsById=new Map(APPROVED_1999_WORLD_RELEASE.records.map(r=>
  [r.kind+':'+r.id,{kind:r.kind,id:r.id,fields:{...r.fields}}]));
 const requests=[];
 for(const record of exported.records){
  const {kind,id,fields}=record||{};
  if(!['horse','person','organization','track'].includes(kind)||
     typeof id!=='string'||!id||!fields||
     typeof fields!=='object'||Array.isArray(fields)||
     Object.values(fields).some(v=>typeof v!=='string'))
   throw Error('Invalid exported change entry or immutable ID');
  const unsupported=Object.keys(fields).filter(k=>!['name','biography','reviewNotes'].includes(k));
  if(unsupported.length)throw Error('Unreviewed operational field change requires gameplay integration: '+id+': '+unsupported.join(','));
  if(typeof fields.reviewNotes==='string'&&fields.reviewNotes.trim())
   requests.push({kind,id,request:fields.reviewNotes,sourceCareer:source.careerRunId});
  const allowed=Object.fromEntries(Object.entries(fields).filter(([k])=>k==='name'||k==='biography'));
  if(!Object.keys(allowed).length)continue;
  const ref=kind+':'+id,current=recordsById.get(ref);
  recordsById.set(ref,{kind,id,fields:{...(current?.fields||{}),...allowed}});
 }
 const records=[...recordsById.values()].sort((a,b)=>
  (a.kind+':'+a.id).localeCompare(b.kind+':'+b.id));
 const digest=createHash('sha256').update(JSON.stringify({
  sourceWorldId:source.worldId,sourceSeed:source.seed,
  sourceSnapshotSha256:source.snapshotSha256,records
 })).digest('hex');
 const pack={
  schema:'WTW_1999_APPROVED_WORLD_RELEASE_V1',
  sourceWorldId:ORIGINAL_1999_WORLD_ID,sourceSeed:19990101,
  sourceSnapshotSha256:records.length?source.snapshotSha256:null,
  revision:records.length?'R'+digest.slice(0,12):'BASE',records
 };
 validateApproved1999WorldRelease(pack);
 const summary={
  source:source.worldId,snapshotSha256:source.snapshotSha256,
  inputRecords:exported.records.length,approvedMetadataRecords:records.length,
  structuralRequestsAwaitingEngineWork:requests.length,
  nextWorldId:pack.sourceWorldId+(records.length?'-RELEASE-'+pack.revision:''),
  approved:approve&&!dryRun
 };
 console.log(JSON.stringify(summary,null,2));
 if(approve&&!dryRun){
  // Both review requests and approved text edits are inspectable in the PR.
  // Structural requests are NOT included in generated runtime data.
  const moduleText='/** Source-controlled approved 1999 World release. Generated from a reviewed in-game export. */\n'+
   'export const APPROVED_1999_WORLD_RELEASE=Object.freeze('+
   JSON.stringify(pack,null,2)+');\n';
  await writeFile(bundlePath,moduleText,'utf8');
  await mkdir(dirname(pendingPath),{recursive:true});
  await writeFile(pendingPath,JSON.stringify({
   schema:'WTW_1999_PENDING_STRUCTURAL_REQUESTS_V1',sourceWorldId:source.worldId,
   sourceSnapshotSha256:source.snapshotSha256,requests
  },null,2)+'\n','utf8');
  console.log('Updated approved source release. Commit both files in a reviewable GitHub PR, run actual industry genesis and desktop tests, then publish a new release.');
 }
}
