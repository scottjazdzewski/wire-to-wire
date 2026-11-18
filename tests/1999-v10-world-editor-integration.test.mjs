import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createCareerWorldEdits,addCareerWorldEdit,applyCareerWorldEdits,
 CAREER_WORLD_EDITS_SCHEMA} from '../public/next/1999-career-world-edits.mjs';
import {buildWorldEditReviewExport,WORLD_EDIT_REVIEW_SCHEMA}
 from '../public/next/1999-world-edit-review-export.mjs';
import {createPersistedIndustryHorseDirectory,createPersistedIndustryEntityDirectory}
 from '../public/next/1999-persisted-world-directory.mjs';
const HORSE='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001';
const manifest={worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H2',
 seed:19990101,horseCount:2,personCount:2,targetOpeningHorses:2};
function fixture(){
 return {authority:{sha256:'a'.repeat(64)},entities:{
  horses:[{id:HORSE,name:'Barn Crossing',status:'RACING',foalYear:1996,
   ownerId:'O-000061',trainerId:'P-001',homeTrackId:'T-0002'},
   {id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000002',name:'Golden Branch',
    foalYear:1996,ownerId:'O-OTHER',trainerId:'P-001',homeTrackId:'T-0002'}],
  people:[{id:'P-001',name:'Alana Bell',role:'trainer'},
   {id:'P-002',name:'Sean Quinn',role:'jockey'}],
  organizations:[{id:'O-000061',name:'Kingsmere Farm'},
   {id:'O-OTHER',name:'Smaller Farm'}],
  tracks:[{id:'T-0002',name:'Racecourse'}]
 }};
}
test('V10 World editor changes real saved horse, person, farm and track identities only in the working career',()=>{
 const world=fixture(),unmodified=fixture();
 let edits=createCareerWorldEdits();
 assert.equal(edits.schema,CAREER_WORLD_EDITS_SCHEMA);
 edits=addCareerWorldEdit(edits,world,'horse',HORSE,
  {name:'Kingsmere Runner',biography:'Approved starter edit',
   reviewNotes:'Move into the Kingsmere high-end program; needs validated transfer and ratings review'});
 edits=addCareerWorldEdit(edits,world,'person','P-001',{name:'Alana Kingsmere'});
 edits=addCareerWorldEdit(edits,world,'organization','O-000061',
  {name:'Kingsmere Racing Farm',biography:'Established major breeding operation'});
 edits=addCareerWorldEdit(edits,world,'track','T-0002',{name:'Racecourse Revised'});
 const disk=JSON.parse(JSON.stringify(edits));
 const otherCareer=fixture();
 const run={stable_horse_ids:['REG-001'],runtime:{registered_horses:{by_id:{
  'REG-001':{horse_id:'REG-001',world_source_horse_id:HORSE,
   registered_name:'Barn Crossing',name:'Barn Crossing',registration_receipt_id:'KEEP'}}}}};
 assert.equal(applyCareerWorldEdits(world,disk,{run}).applied,4);
 assert.equal(world.entities.horses[0].id,HORSE);
 assert.equal(world.entities.horses[0].name,'Kingsmere Runner');
 assert.match(world.entities.horses[0].reviewNotes,/validated transfer/);
 assert.equal(world.entities.horses[0].ownerId,'O-000061','review notes must never invent a transfer');
 assert.equal(run.runtime.registered_horses.by_id['REG-001'].registered_name,'Kingsmere Runner');
 assert.equal(run.runtime.registered_horses.by_id['REG-001'].registration_receipt_id,'KEEP');
 assert.equal(unmodified.entities.horses[0].name,'Barn Crossing');
 assert.equal(otherCareer.entities.organizations[0].name,'Kingsmere Farm');
 const horseDirectory=createPersistedIndustryHorseDirectory({world,manifest});
 assert.equal(horseDirectory.browse({search:'Kingsmere Runner'}).total,1);
 assert.match(horseDirectory.byId(HORSE).reviewNotes,/validated transfer/);
 const orgDirectory=createPersistedIndustryEntityDirectory({
  world,manifest,kind:'organization'});
 assert.equal(orgDirectory.browse({search:'Kingsmere Racing Farm'}).total,1);
 assert.equal(orgDirectory.byId('O-000061').biography,
  'Established major breeding operation');
 const reopen=fixture();
 assert.equal(applyCareerWorldEdits(reopen,JSON.parse(JSON.stringify(disk))).applied,4);
 assert.equal(reopen.entities.horses[0].name,'Kingsmere Runner');
 assert.equal(reopen.entities.organizations[0].id,'O-000061');
});
test('editor rejects pretend owner transfers, immutable IDs, ghost records and duplicate renames',()=>{
 const world=fixture();
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{id:'FAKE'}),/Unsupported/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{ownerId:'O-OTHER'}),/Unsupported/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{trainerId:'P-002'}),/Unsupported/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{homeTrackId:'T-0002'}),/Unsupported/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{name:'Golden Branch'}),/already has that name/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse','UNKNOWN',{name:'Lost Horse'}),/Unknown/);
 assert.throws(()=>addCareerWorldEdit(null,world,'horse',HORSE,{name:' '}),/visible text/);
});
test('review export contains immutable source ID, seed, fingerprint and only explicit changed values',()=>{
 const world=fixture();
 const run={run_id:'WTW-RUN-1999-19990101-SIZE-2-OP-O-000061',
  clock:{date:'1999-06-02'}};
 const edits=addCareerWorldEdit(createCareerWorldEdits(),world,'horse',HORSE,
  {name:'Kingsmere Runner',reviewNotes:'Raise potential only after source review'});
 const data=buildWorldEditReviewExport({manifest,world,run,worldEdits:edits,
  createdAt:'2026-11-18T16:00:00.000Z'});
 assert.equal(data.schema,WORLD_EDIT_REVIEW_SCHEMA);
 assert.equal(data.recordCount,1);
 assert.equal(data.source.worldId,manifest.worldId);
 assert.equal(data.source.snapshotSha256,world.authority.sha256);
 assert.equal(data.source.careerRunId,run.run_id);
 assert.deepEqual(data.records,[{kind:'horse',id:HORSE,
  fields:{name:'Kingsmere Runner',reviewNotes:'Raise potential only after source review'}}]);
 assert.equal(data.mediaIncluded,false);
 assert.equal(data.careerProgressIncluded,false);
 assert.equal(world.entities.horses[0].name,'Barn Crossing');
});
test('V10 editor uses same persistent player career and exports from normal in-game controls',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const manager=read('public/next/1999-commercial-career-manager.mjs');
 const ui=read('public/next/next.js');
 for(const token of ['hydrateCareerWorldEdits','editSavedWorldEntity',
  'buildWorldEditReviewExport','exportCareerWorldChangesForReview',
  'worldEdits:career.worldEdits||prior?.changes?.worldEdits',
  'changes:{...prior.changes,canonicalRun:nextRun,worldEdits:edits}',
  'World edit did not survive persisted read-back'])
  assert.ok(manager.includes(token),'missing integration contract: '+token);
 for(const token of ['EDIT THIS RECORD','SAVE WORLD CHANGES',
  'EXPORT WORLD CHANGES FOR CHATGPT','data-saved-world-field="name"',
  'data-saved-world-field="biography"','data-saved-world-field="reviewNotes"',
  'saved-world-save',
  'saved-world-export','SAVED AND VERIFIED IN ACTIVE CAREER'])
  assert.ok(ui.includes(token),'missing live UI: '+token);
 assert.match(manager,/The frozen shared baseline cannot be edited/);
 assert.match(ui,/Structural requests are saved as review notes and exported/);
 assert.match(ui,/they do NOT alter owner|they do NOT alter/i);
});
