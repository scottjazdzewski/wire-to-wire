import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=x=>JSON.parse(fs.readFileSync(path.join(root,x),'utf8'));
const files=[
 'participant-0001-0400.json','participant-0401-0800.json','participant-0801-1200.json',
 'participant-1201-1600.json','participant-1601-2000.json','participant-2001-2400.json',
 'participant-2401-2688.json'
].map(x=>'data/geography/import/'+x);
const countryFlags={USA:'us',Canada:'ca',Cuba:'cu',Panama:'pa',Venezuela:'ve',Spain:'es',
 Argentina:'ar',Ireland:'ie',Peru:'pe',England:'gb-eng',Chile:'cl',Colombia:'co',
 Austria:'at',Mexico:'mx',France:'fr',Uruguay:'uy'};
test('Public people identity is read-only projection of the ONE approved Participant_Geography source',()=>{
 const index=get('public/data/person-geography-ui-v33.json');
 assert.equal(index.schema,'WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1');
 assert.equal(index.person_count,1308);
 assert.deepEqual(index.source_paths,files);
 const byId=new Map(index.people.map(p=>[p.id,p]));
 assert.equal(byId.size,index.people.length);
 const birth=new Map(),base=new Map(),career=new Map();
 for(const filename of files){
  const data=get(filename);
  for(const row of data.rows){
   const x=Object.fromEntries(data.headers.map((key,i)=>[key,row[i]]));
   if(x.location_type==='BIRTHPLACE')birth.set(x.person_id,x);
   if(x.location_type==='HOME_BASE_CANON')base.set(x.person_id,x);
   if(x.location_type==='PRIMARY_CAREER_BASE')career.set(x.person_id,x);
  }
 }
 assert.equal(birth.size,1308);
 assert.equal(base.size,77);
 assert.equal(career.size,1198);
 for(const [id,p] of byId){
  const b=birth.get(id);
  assert.ok(b,id+' must have canonical birthplace');
  assert.equal(p.name,b.name);
  if(id==='P-000064'){
   // User corrected the fictional 1999 jockey Owen LeBlanc to Louisiana.
   // Original imported source remains immutable; display projection shows the override.
   assert.equal(p.birthplace.source_record_id,'USER-20261113-OWEN-ORIGIN');
   assert.equal(p.birthplace.city,'');
   assert.equal(p.birthplace.region,'Louisiana');
  }else{
   assert.equal(p.birthplace.source_record_id,b.geo_record_id);
   assert.equal(p.birthplace.city,b.city_locality||null);
   assert.equal(p.birthplace.region,b.state_region||null);
  }
  assert.equal(p.birthplace.country,b.country);
  assert.equal(p.birthplace.flag_code,countryFlags[b.country]);
  assert.ok(fs.existsSync(path.join(root,'public/assets/flags/v1/'+p.birthplace.flag_code+'.svg')));
  assert.equal(Object.hasOwn(p,'nationality'),false,'Birth country cannot assert citizenship');
  assert.equal(Object.hasOwn(p,'birth_date'),false,'Geography alone cannot invent a birth date or age');
  if(base.has(id)){
   assert.equal(p.opening_base.source_record_id,base.get(id).geo_record_id);
   assert.equal(p.opening_base.as_of,'1999');
   assert.equal(p.opening_base.city,base.get(id).city_locality||null);
  }else assert.equal(p.opening_base,null);
  if(career.has(id)){
   assert.equal(p.career_base.source_record_id,career.get(id).geo_record_id);
  }else assert.equal(p.career_base,null);
 }
 const gabe=byId.get('P-000023');
 assert.equal(gabe.name,'Gabe Larkin');
 assert.deepEqual([gabe.birthplace.city,gabe.birthplace.region,gabe.opening_base.city,gabe.opening_base.region],[
  'Jacksonville','Florida','Charles Town','West Virginia'
 ]);
 assert.equal(index.recorded_base_count,1275);
});
