import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Office uses exactly one authoritative visual stylesheet',()=>{
  const html=get('public/index.html');
  const sheets=html.split('\n').filter(line=>line.includes('rel="stylesheet"')).map(line=>line.match(/href="([^"]+)"/)?.[1]);
  assert.deepEqual(sheets,['/next/next.css']);
  const css=get('public/next/next.css');
  assert.match(css,/UNIFIED DESKTOP MANAGEMENT DESIGN SYSTEM/);
  assert.ok(css.includes('.ng-featurebody')&&css.includes('.ng-intelgrid')&&css.includes('.ng-search-roster-page'),'Main Office, analyst grid and Search share one rebuilt stylesheet');
  assert.ok(!css.includes('@import'),'Runtime stylesheet may not import a second style layer');
  assert.ok(!css.includes('wtw_badge_horse_profile.png'),'Deprecated badge path leaked');
  for(const badge of ['horse','people','farm_stable','track','pedigree','career_record','achievements','reputation','meet_schedule','major_races','connections','history']){
    assert.ok(fs.existsSync(path.join(root,'public/assets/profile-badges/v2/wtw_badge_'+badge+'.png')),'Missing approved '+badge+' badge');
  }
  assert.ok(html.includes('src="/office-v30-4.js"'),'Core engine preserved');
  assert.ok(html.includes('src="/office-fm-v37.js"'),'Live stable/entry view preserved');
  assert.ok(html.includes('src="/next/next.js"'),'Next-gen Office promoted to site root');
  assert.ok(html.includes('class="wtw-next-active"'),'New display layer activated at site root');
  assert.ok(html.includes('href="/archive/"'),'Historical archive link preserved');
});
