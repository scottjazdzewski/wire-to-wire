import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
test('Public person geography contains only exact approved 1999 people, never old 1308-record workforce',()=>{
 const index=read('public/data/wtw-1999-approved-person-geography-v1.json');
 const founder=read('public/data/wtw-1999-founding-directory-v1.json');
 const jockey=read('public/data/wtw-1999-jockey-pilot-v1.json');
 const trainers=read('public/data/wtw-1999-trainer-pilot-v1.json');
 const allowed=new Map([...founder.people,...jockey.jockeys,...trainers.trainers].map(p=>[p.id,p.name]));
 assert.equal(allowed.size,87);
 assert.equal(index.schema,'WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1');
 assert.equal(index.person_count,index.people.length);
 assert.equal(index.person_count,37);
 assert.equal(new Set(index.people.map(p=>p.id)).size,37);
 for(const p of index.people){
  assert.equal(allowed.get(p.id),p.name,'Unknown former-world person id '+p.id);
  assert.ok(!Object.hasOwn(p,'birth_date'),'No fictional date of birth');
  assert.ok(!Object.hasOwn(p,'nationality'),'Birthplace does not imply citizenship');
  if(p.birthplace?.flag_code){
   assert.ok(fs.existsSync(path.join(root,'public/assets/flags/v1/'+p.birthplace.flag_code+'.svg')));
  }
 }
 const owen=index.people.find(p=>p.id==='P-000064');
 assert.equal(owen?.birthplace?.region,'Louisiana');
 assert.equal(owen?.birthplace?.city,'');
 assert.equal(owen?.opening_base?.city,'Carencro');
 assert.ok(!fs.existsSync(path.join(root,'public/data/person-geography-ui-v33.json')));
 assert.ok(!fs.existsSync(path.join(root,'public/data/wtw-1999-world-directory-v33.json')));
});
