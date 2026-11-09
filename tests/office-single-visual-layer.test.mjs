import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Office uses exactly one authoritative visual stylesheet',()=>{
  const html=get('public/index.html');
  const sheets=[...html.matchAll(/<link\\s+rel="stylesheet"\\s+href="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(sheets,['/office-visual-system-v38.css']);
  const css=get('public/office-visual-system-v38.css');
  assert.match(css,/SINGLE AUTHORITATIVE VISUAL LAYER/);
  assert.match(css,/WTW V38/);
  assert.ok(!/@import\\s+url?\\s*\\(/i.test(css),'Runtime stylesheet may not load a second style layer');
  assert.ok(!css.includes('wtw_badge_horse_profile.png'),'Deprecated badge path leaked');
  for(const badge of ['horse','people','farm_stable','track','pedigree','career_record','achievements','reputation','meet_schedule','major_races','connections','history']){
    assert.ok(fs.existsSync(path.join(root,'public/assets/profile-badges/v2/wtw_badge_'+badge+'.png')),'Missing approved '+badge+' badge');
  }
  assert.ok(html.includes('src="/office-v30-4.js"'),'Core engine preserved');
  assert.ok(html.includes('src="/office-fm-v37.js"'),'Live stable/entry view preserved');
  assert.ok(html.includes('href="/archive/"'),'Historical archive link preserved');
});
