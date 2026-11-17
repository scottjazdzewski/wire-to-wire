import test from 'node:test';
import assert from 'node:assert/strict';
import {createCareerWorldEdits,addCareerWorldEdit,applyCareerWorldEdits,
 CAREER_WORLD_EDITS_SCHEMA} from '../public/next/1999-career-world-edits.mjs';
import {createPersistedIndustryHorseDirectory,createPersistedIndustryEntityDirectory}
 from '../public/next/1999-persisted-world-directory.mjs';
function fixture(){
 return {world:{entities:{
  horses:[{id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001',name:'Silent Barn',
   foalYear:1996,status:'RACING',ownerId:'O-1',trainerId:'P-1',homeTrackId:'T-1'},
   {id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000002',name:'Golden Branch',
    foalYear:1996,status:'RACING',ownerId:'O-1',trainerId:'P-1',homeTrackId:'T-1'}],
  people:[{id:'P-1',name:'Alex Bell',role:'trainer'},
   {id:'P-2',name:'Marie Twain',role:'trainer'},
   {id:'P-3',name:'Another Rider',role:'jockey'}],
  organizations:[{id:'O-1',name:'Rain Barn',type:'OWNER'},
   {id:'O-2',name:'Sun Farm',type:'FARM'}],
  tracks:[{id:'T-1',name:'Spring Downs'},{id:'T-2',name:'Coastal Downs'}]
 }},manifest:{worldId:'WTW-1999-TEST',horseCount:2}};
}
const originalId='H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0000001';
test('career-local names, biographies and background relationships persist by immutable IDs',()=>{
 const {world,manifest}=fixture(),other=fixture().world;
 const oldId=world.entities.horses[0].id;
 let edits=createCareerWorldEdits();
 assert.equal(edits.schema,CAREER_WORLD_EDITS_SCHEMA);
 edits=addCareerWorldEdit(edits,world,'horse',oldId,
  {name:'New Recorded Name',biography:'Career development entry',
   ownerId:'O-2',trainerId:'P-2',homeTrackId:'T-2'});
 edits=addCareerWorldEdit(edits,world,'person','P-1',
  {name:'Alex Morgan',biography:'Local career note'});
 edits=addCareerWorldEdit(edits,world,'organization','O-1',{name:'Rain & Rail'});
 edits=addCareerWorldEdit(edits,world,'track','T-1',{name:'Spring Racecourse'});
 const disk=JSON.parse(JSON.stringify(edits));
 assert.equal(other.entities.horses[0].name,'Silent Barn','base generated world never mutated');
 const reopened=fixture().world;
 assert.equal(applyCareerWorldEdits(reopened,disk).applied,4);
 assert.equal(reopened.entities.horses[0].id,oldId);
 assert.equal(reopened.entities.horses[0].name,'New Recorded Name');
 assert.equal(reopened.entities.horses[0].ownerId,'O-2');
 assert.equal(reopened.entities.people[0].name,'Alex Morgan');
 assert.equal(reopened.entities.organizations[0].name,'Rain & Rail');
 assert.equal(reopened.entities.tracks[0].name,'Spring Racecourse');
 const browse=createPersistedIndustryHorseDirectory({world:reopened,manifest});
 assert.equal(browse.browse({search:'New Recorded Name'}).items[0]._id,oldId);
 assert.equal(browse.byId(oldId).owner,'Sun Farm');
 assert.equal(createPersistedIndustryEntityDirectory({world:reopened,manifest,kind:'person'})
  .browse({search:'Alex Morgan'}).total,1);
});
test('registered player horse name resolves through same saved run without changing immutable receipt',()=>{
 const f=fixture();
 const run={stable_horse_ids:['REG-1'],runtime:{registered_horses:{by_id:{
  'REG-1':{horse_id:'REG-1',world_source_horse_id:originalId,
   name:'Silent Barn',registered_name:'Silent Barn',registration_receipt_id:'UNTOUCHED'}}}}};
 const edits=addCareerWorldEdit(null,f.world,'horse',originalId,{name:'Updated Stable Name'},{run});
 applyCareerWorldEdits(f.world,JSON.parse(JSON.stringify(edits)),{run});
 assert.equal(run.runtime.registered_horses.by_id['REG-1'].registered_name,'Updated Stable Name');
 assert.equal(run.runtime.registered_horses.by_id['REG-1'].registration_receipt_id,'UNTOUCHED');
 assert.equal(run.stable_horse_ids[0],'REG-1');
 const reloadRun=JSON.parse(JSON.stringify(run));
 const reload=fixture();
 applyCareerWorldEdits(reload.world,JSON.parse(JSON.stringify(edits)),{run:reloadRun});
 assert.equal(reloadRun.runtime.registered_horses.by_id['REG-1'].name,'Updated Stable Name');
 assert.equal(reload.world.entities.horses[0].id,originalId);
});
test('reject unknown fields, invalid target IDs, duplicate new names and active-stable transfers',()=>{
 const f=fixture();
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,{id:'CORRUPTED'}),/unsupported/i);
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse','UNKNOWN',{name:'Changed'}),/unknown/i);
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,{name:'Golden Branch'}),/already has that name/);
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,{ownerId:'NOT-EXISTS'}),/Unknown ownerId/);
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,{trainerId:'P-3'}),/not a trainer/);
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,{homeTrackId:'MISSING'}),/Unknown homeTrackId/);
 const run={stable_horse_ids:['REG-1'],runtime:{registered_horses:{by_id:{'REG-1':{
  world_source_horse_id:originalId}}}}};
 assert.throws(()=>addCareerWorldEdit(null,f.world,'horse',originalId,
  {ownerId:'O-2'},{run}),/gameplay commands/);
 assert.throws(()=>applyCareerWorldEdits(f.world,{schema:'BAD',byId:{}}),/Incompatible/);
});
