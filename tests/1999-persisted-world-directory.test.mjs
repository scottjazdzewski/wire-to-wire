import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPersistedIndustryHorseDirectory,PERSISTED_INDUSTRY_DIRECTORY_SCHEMA}
 from '../public/next/1999-persisted-world-directory.mjs';

function fixture(){
 const horses=[
  {id:'H-FICTIONAL-1999-RACING-0003',name:'River Letter',foalYear:1996,sex:'F',
   status:'RACING',cohort:'3YO',ownerId:'O-01',trainerId:'P-01',
   foalingFarmId:'O-02',homeTrackId:'T-01',sireId:'H-SIRE-9',damId:'H-DAM-8'},
  {id:'H-FICTIONAL-1999-RACING-0002',name:'Blue Gate',foalYear:1997,sex:'M',
   status:'RACING',cohort:'2YO',ownerId:'O-02',trainerId:'P-01',
   foalingFarmId:'O-02',homeTrackId:'T-01'},
  {id:'H-FICTIONAL-1999-RACING-0001',name:'Blue Gate',foalYear:1994,sex:'F',
   status:'RETIRED',cohort:'5YO',ownerId:'O-01',trainerId:'P-02',
   foalingFarmId:'O-02',homeTrackId:'T-02'}
 ];
 const world={entities:{horses,organizations:[{id:'O-01',name:'Red Orchard'},
  {id:'O-02',name:'Green Meadow'}],
  people:[{id:'P-01',name:'June Foley'},{id:'P-02',name:'Bill Weston'}],
  tracks:[{id:'T-01',name:'Rail Park'},{id:'T-02',name:'Sound Downs'}]}};
 return {world,manifest:{horseCount:3,worldId:'WTW1999FullIndustry-COHORTS-V2-H3'}};
}
test('browse actual saved horse census with paged identities, not 73-horse preview',()=>{
 const api=createPersistedIndustryHorseDirectory(fixture());
 assert.equal(api.schema,PERSISTED_INDUSTRY_DIRECTORY_SCHEMA);
 assert.equal(api.size,3);
 const a=api.browse({offset:0,limit:2});
 const b=api.browse({offset:2,limit:2});
 assert.equal(a.total,3);assert.equal(a.loaded,3);
 assert.equal(a.items.length,2);assert.equal(b.items.length,1);
 assert.deepEqual([...a.items,...b.items].map(h=>h._id),[
  'H-FICTIONAL-1999-RACING-0001','H-FICTIONAL-1999-RACING-0002',
  'H-FICTIONAL-1999-RACING-0003']);
 assert.equal(a.items[0].name,'Blue Gate');
 assert.equal(a.items[0]._savedWorldId,fixture().manifest.worldId);
 assert.equal(a.items[0].ca,null);assert.equal(a.items[0].pa,null);
 assert.equal(api.byId('H-FICTIONAL-1999-RACING-0003').owner,'Red Orchard');
 assert.equal(api.byId('NOT-A-HORSE'),null);
});
test('source filtering and sorting preserve immutable IDs and real relationships',()=>{
 const api=createPersistedIndustryHorseDirectory(fixture());
 assert.equal(api.browse({search:'June Foley'}).total,2);
 assert.equal(api.browse({search:'H-FICTIONAL-1999-RACING-0001'}).items[0].age,5);
 assert.equal(api.browse({filters:{ageMin:5}}).total,1);
 assert.equal(api.browse({filters:{sex:'F'}}).total,2);
 assert.equal(api.browse({filters:{field:'owner',query:'Red Orchard'}}).total,2);
 assert.deepEqual(api.browse({sort:'age',desc:true}).items.map(h=>h.age),[5,3,2]);
 const first=api.byId('H-FICTIONAL-1999-RACING-0001');
 assert.equal(first.trainerId,'P-02');assert.equal(first.dam,'');
 assert.equal(first.ownerId,'O-01');
});
test('refuse missing or duplicated saved horse IDs and incomplete world size',()=>{
 const f=fixture();f.manifest.horseCount=4;
 assert.throws(()=>createPersistedIndustryHorseDirectory(f),/exact saved world census/);
 const g=fixture();g.world.entities.horses[2].id=g.world.entities.horses[0].id;
 assert.throws(()=>createPersistedIndustryHorseDirectory(g),/duplicate horse identity/);
});
test('current desktop UI favors saved world directory and explicitly distinguishes player stable',()=>{
 const manager=readFileSync(new URL('../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
 const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
 assert.match(manager,/worldHorseBrowse:indexedHorseDirectory\.browse/);
 assert.match(manager,/worldHorseById:indexedHorseDirectory\.byId/);
 assert.match(manager,/ENTER GAME · VIEW ALL WORLD HORSES/);
 assert.match(manager,/publishCareerReadModel\(\);/);
 assert.match(ui,/savedWorldBrowse=window\.__WTW_ACTIVE_WORLD_CAREER_VIEW__\?\.worldHorseBrowse/);
 assert.match(ui,/SavedIndustryHorse:/);
 assert.match(ui,/display-only changes are not offered as game edits/);
});
