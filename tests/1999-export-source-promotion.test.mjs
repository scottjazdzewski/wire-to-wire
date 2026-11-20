import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,writeFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
 APPROVED_1999_WORLD_RELEASE,ORIGINAL_1999_WORLD_ID,
 new1999WorldIdForApprovedRelease,releaseFor1999World,
 validateApproved1999WorldRelease,applyApproved1999ReleaseRecord,
 assertApproved1999ReleaseReferences
} from '../public/1999/engine/approved-1999-world-release.mjs';

const sourceSha='a'.repeat(64);
const exampleRelease={
 schema:'WTW_1999_APPROVED_WORLD_RELEASE_V1',
 sourceWorldId:ORIGINAL_1999_WORLD_ID,
 sourceSeed:19990101,sourceSnapshotSha256:sourceSha,
 revision:'R123456789abc',
 records:[
  {kind:'horse',id:'H-FICTIONAL-1999-BROODMARES-0000001',
   fields:{name:'Kingsmere Prospect',biography:'Approved 1999 opening description'}},
  {kind:'organization',id:'O-000061',fields:{name:'Kingsmere Racing'}}
 ]
};

test('Empty baseline release is a no-op on current world ID and leaves frozen game save compatible',()=>{
 assert.equal(APPROVED_1999_WORLD_RELEASE.records.length,0);
 assert.equal(new1999WorldIdForApprovedRelease({seed:19990101,horseCount:300000}),
  ORIGINAL_1999_WORLD_ID);
 assert.equal(releaseFor1999World({seed:19990101,horseCount:300000,worldId:ORIGINAL_1999_WORLD_ID}),null);
 const h={id:'H-FICTIONAL-1999-BROODMARES-0000001',name:'Unedited'};
 assert.equal(applyApproved1999ReleaseRecord(h,'horse',null),h);
});

test('Approved real release is versioned, source-bound and retains original permanent IDs',()=>{
 const release=validateApproved1999WorldRelease(exampleRelease);
 const id=new1999WorldIdForApprovedRelease({seed:19990101,horseCount:300000,release});
 assert.equal(id,ORIGINAL_1999_WORLD_ID+'-RELEASE-R123456789abc');
 assert.equal(releaseFor1999World({seed:19990101,horseCount:300000,worldId:id,release}),release);
 assert.equal(releaseFor1999World({seed:19990101,horseCount:300000,worldId:ORIGINAL_1999_WORLD_ID,release}),null);
 assert.equal(releaseFor1999World({seed:19990102,horseCount:300000,worldId:id,release}),null);
 assert.equal(releaseFor1999World({seed:19990101,horseCount:20000,worldId:id,release}),null);
 const horse={id:'H-FICTIONAL-1999-BROODMARES-0000001',name:'Old Mare',ownerId:'O-000061',status:'BROODMARE'};
 const edited=applyApproved1999ReleaseRecord(horse,'horse',release);
 assert.equal(edited.name,'Kingsmere Prospect');
 assert.equal(edited.biography,'Approved 1999 opening description');
 assert.equal(edited.id,horse.id);
 assert.equal(edited.ownerId,horse.ownerId);
 assert.equal(horse.name,'Old Mare');
 const owner=applyApproved1999ReleaseRecord({id:'O-000061',name:'Kingsmere Farm'},'organization',release);
 assert.equal(owner.name,'Kingsmere Racing');
 assert.deepEqual(assertApproved1999ReleaseReferences({release,foundIds:new Set([
  'horse:H-FICTIONAL-1999-BROODMARES-0000001','organization:O-000061'
 ])}),{count:2});
 assert.throws(()=>assertApproved1999ReleaseReferences({release,foundIds:new Set([
  'organization:O-000061'
 ])}),/absent from the actual generated universe/);
});

test('Publishing cannot silently rename an unrelated original or mutate financial/pedigree links',()=>{
 assert.throws(()=>applyApproved1999ReleaseRecord({
  id:'H-FICTIONAL-1999-BROODMARES-0000002',name:'Kingsmere Prospect'
 },'horse',exampleRelease),/collides/);
 assert.throws(()=>validateApproved1999WorldRelease({...exampleRelease,records:[
  {kind:'horse',id:'H-1',fields:{ownerId:'O-NEW'}}
 ]}),/Unsafe or unapproved/);
 assert.throws(()=>validateApproved1999WorldRelease({...exampleRelease,records:[
  {kind:'horse',id:'H-1',fields:{name:'Duplicate'}},
  {kind:'horse',id:'H-2',fields:{name:'Duplicate'}}
 ]}),/Duplicate promoted/);
});

test('Export-to-release compiler validates official export and reports review-only structural proposals',async()=>{
 const folder=await mkdtemp(join(tmpdir(),'wtw-1999-release-'));
 try{
  const file=join(folder,'world-export.json');
  const exported={
   schema:'WTW_WORLD_EDIT_REVIEW_V1',
   purpose:'HUMAN_REVIEW_FOR_STARTING_FICTIONAL_WORLD_PROMOTION',
   source:{worldId:ORIGINAL_1999_WORLD_ID,seed:19990101,
    horseCount:300000,startYear:1999,snapshotSha256:sourceSha,
    careerRunId:'WTW-PLAY-1999-KINGSMERE',careerDate:'1999-05-29'},
   recordCount:2,
   records:[
    {kind:'horse',id:'H-FICTIONAL-1999-BROODMARES-0000001',
     fields:{name:'Edited Mare',reviewNotes:'Requested trainer change needs transactional game command'}},
    {kind:'organization',id:'O-000061',
     fields:{biography:'Approved Kingsmere organizational profile'}}
   ]
  };
  await writeFile(file,JSON.stringify(exported),'utf8');
  const cli=fileURLToPath(new URL('../scripts/promote-1999-world-changes.mjs',import.meta.url));
  const dry=spawnSync(process.execPath,[cli,file,'--dry-run'],{encoding:'utf8'});
  assert.equal(dry.status,0,dry.stderr);
  const report=JSON.parse(dry.stdout);
  assert.equal(report.inputRecords,2);
  assert.equal(report.approvedMetadataRecords,2);
  assert.equal(report.structuralRequestsAwaitingEngineWork,1);
  assert.match(report.nextWorldId,/-RELEASE-R[0-9a-f]{12}$/);
  assert.equal(report.approved,false);
  const forbidden=spawnSync(process.execPath,[cli,file],{encoding:'utf8'});
  assert.equal(forbidden.status,2,'export cannot silently change official source without an explicit approval');
  exported.source.seed=19990102;
  await writeFile(file,JSON.stringify(exported),'utf8');
  const wrong=spawnSync(process.execPath,[cli,file,'--dry-run'],{encoding:'utf8'});
  assert.notEqual(wrong.status,0,'wrong original source seed must never promote');
 }finally{await rm(folder,{recursive:true,force:true})}
});
