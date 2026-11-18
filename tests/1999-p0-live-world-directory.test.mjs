import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createPersistedIndustryHorseDirectory,createPersistedIndustryEntityDirectory}
 from '../public/next/1999-persisted-world-directory.mjs';

function worldOf(size){
 const horses=Array.from({length:size},(_,i)=>({
  id:'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-'+String(i+1).padStart(7,'0'),
  name:'Generated Horse '+(i+1),foalYear:1996,sex:i%2?'MARE':'HORSE',
  status:'RACING',cohort:'threeYearOldRunners',
  ownerId:i%50===0?'O-000061':'O-FICTIONAL-OWNER-000001',
  breederId:'O-000061',foalingFarmId:'O-000061',
  careFacilityId:i%3===0?'O-000061':'O-FICTIONAL-FARM-000001',
  managementOrganizationId:i%3===0?'O-000061':null,
  trainerId:'P-001',homeTrackId:'T-001'}));
 return {world:{entities:{horses,organizations:[
  {id:'O-000061',name:'Kingsmere Farm'},
  {id:'O-FICTIONAL-OWNER-000001',name:'Field Owner'},
  {id:'O-FICTIONAL-FARM-000001',name:'Other Farm'}],
  people:[{id:'P-001',name:'Real Trainer',role:'trainer'}],
  tracks:[{id:'T-001',name:'Real Track'}]}},
  manifest:{worldId:'WTW1999FullIndustry-COHORTS-V6-OWNER-V10-NAMES-V10-H'+size,
   horseCount:size}};
}
test('the full 300k saved census is indexed without a 73/160 horse cutoff',()=>{
 const {world,manifest}=worldOf(300000);
 const api=createPersistedIndustryHorseDirectory({world,manifest});
 assert.equal(api.size,300000);
 const first=api.browse({offset:0,limit:160,sort:'name'});
 assert.equal(first.loaded,300000);
 assert.equal(first.total,300000);
 assert.equal(first.items.length,160);
 assert.equal(api.byId('H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0300000').name,
  'Generated Horse 300000');
 const search=api.browse({search:'Generated Horse 299999'});
 assert.equal(search.total,1);
 assert.equal(search.items[0]._id,'H-FICTIONAL-1999-THREEYEAROLDRUNNERS-0299999');
 const kingsmere=api.browse({filters:{ownerId:'O-000061'}});
 assert.equal(kingsmere.total,6000);
 assert.equal(kingsmere.items.length,160);
 assert.equal(api.browse({filters:{careFacilityId:'O-000061'}}).total,100000);
 assert.equal(api.browse({filters:{managementOrganizationId:'O-000061'}}).total,100000);
 assert.equal(first.items[0]._savedWorldId,manifest.worldId);
 assert.equal(first.items[0].ca,null);
 assert.equal(first.items[0].pa,null);
});
test('the same save exposes actual organization, trainer and track IDs',()=>{
 const f=worldOf(4);
 for(const kind of ['organization','person','track']){
  const api=createPersistedIndustryEntityDirectory({...f,kind});
  assert.ok(api.size>0);
  assert.ok(api.browse({search:kind==='person'?'Real Trainer':
   kind==='track'?'Real Track':'Kingsmere Farm'}).total>=1);
 }
 const org=createPersistedIndustryEntityDirectory({...f,kind:'organization'})
  .byId('O-000061');
 assert.equal(org.name,'Kingsmere Farm');
 assert.equal(org._savedWorldId,f.manifest.worldId);
});
test('normal Windows World screens bind only to saved V10 records, never fake 73',()=>{
 const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
 const manager=read('public/next/1999-commercial-career-manager.mjs');
 const ui=read('public/next/next.js');
 assert.match(manager,/createPersistedIndustryHorseDirectory/);
 assert.match(manager,/worldHorseBrowse:liveWorldHorseDirectory\.browse/);
 assert.match(manager,/worldEntityBrowse:\(kind,options\)=>liveWorldEntityDirectories/);
 assert.match(ui,/const savedHorseBrowse=savedDirectory\?\.worldHorseBrowse/);
 assert.match(ui,/globalHorseDirectory&&savedHorseBrowse\?savedHorseBrowse\(savedOptions\)/);
 assert.match(ui,/window\.WTWDesktop\?\.runtime==='windows-desktop'/);
 assert.match(ui,/SavedWorld:/);
 assert.match(ui,/function savedWorldRecordProfile\(\)/);
 assert.match(ui,/The 73-horse archival index is not a substitute/);
});
test('incomplete census or missing identities are never silently substituted',()=>{
 const f=worldOf(3);
 assert.throws(()=>createPersistedIndustryHorseDirectory({
  world:f.world,manifest:{...f.manifest,horseCount:73}}),/exact saved world census/);
 f.world.entities.horses[1].id=f.world.entities.horses[0].id;
 assert.throws(()=>createPersistedIndustryHorseDirectory(f),/duplicate horse identity/);
});
