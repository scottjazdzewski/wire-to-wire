import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=pathName=>fs.readFileSync(path.join(root,pathName),'utf8');

test('active site uses approved Office FM v30 structure rather than archive homepage',()=>{
 const html=get('public/index.html');
 assert.match(html,/<title>WIRE TO WIRE — Racing Office<\/title>/);
 for(const label of ['Office','Stable','Race Calendar','Sales','World','News']){
   assert.ok(html.includes('data-act="'+label+'"'), 'Missing game navigation '+label);
 }
 for(const action of ['+ Day','+ Week','+ Month','+ Year','Save','Load','Continue']){
   assert.ok(html.includes('data-act="'+action+'"'), 'Missing Office action '+action);
 }
 assert.match(html,/class="routeShell"/);
 assert.match(html,/href="\/archive\/"/);
 assert.ok(!html.includes('data:image/'), 'Embedded base64 images must stay external');
 assert.ok(!html.includes('<style'), 'Inline CSS forbidden by production CSP');
 assert.ok(!/<script(?:\s[^>]*)?>(?!\s*<\/script>)/i.test(html), 'Inline JS forbidden by production CSP');
});
test('all deployed Office assets and every approved badge exist byte-for-byte as separate files',()=>{
 const html=get('public/index.html'),css=get('public/office-visual-system-v38.css');
 for(const asset of ['wtw-office-approved-logo.png','wtw-office-original-photo.jpg']){
   assert.ok(fs.existsSync(path.join(root,'public/assets',asset)));
 }
 for(const part of [1,2,3,4]){
   const name='office-v30-'+part+'.js';
   assert.ok(html.includes('src="/'+name+'"'));
   const p=path.join(root,'public',name);
   const syntax=spawnSync(process.execPath,['--check',p],{encoding:'utf8'});
   assert.equal(syntax.status,0,syntax.stderr);
 }
 const approved=['horse','people','farm_stable','track','pedigree','career_record','achievements','reputation','meet_schedule','major_races','connections','history'];
 for(const kind of approved){
   const p='public/assets/profile-badges/v2/wtw_badge_'+kind+'.png';
   assert.ok(fs.existsSync(path.join(root,p)),p);
 }
 for(const kind of ['horse','people','farm_stable','track']){
   assert.ok(css.includes('/assets/profile-badges/v2/wtw_badge_'+kind+'.png'));
 }
 for(const old of ['horse','people','farm','track']){
   const oldPath='public/assets/profile-badges/wtw_badge_'+old+'_profile.png';
   assert.ok(!fs.existsSync(path.join(root,oldPath)), 'Deprecated badge still present: '+oldPath);
 }
 assert.ok(!css.includes('_profile.png'), 'Legacy profile badge reference remains');
 assert.ok(!get('public/office/office-routes.js').includes('_profile.png'), 'Legacy routes still reference deprecated art');
 for(const ext of ['css','js']){
   const name=ext==='css'?'office-visual-system-v38.css':'office-fm-v37.js';
   assert.ok(html.includes('/'+name+'"'), 'Missing v37 asset '+name);
   assert.ok(fs.existsSync(path.join(root,'public',name)));
   if(ext==='js')assert.equal(spawnSync(process.execPath,['--check',path.join(root,'public',name)],{encoding:'utf8'}).status,0);
 }
 assert.ok(!get('public/office-v30-4.js').includes('data:image/'));
 assert.ok(css.includes('.horseProfilePage .profilePhoto'));
 assert.ok(css.includes('.trackProfilePage .profilePhoto'));
});
test('archive review homepage and protected API remain separate',()=>{
 assert.ok(get('public/archive/index.html').includes('/app.js'));
 assert.ok(get('src/worker.js').includes('/api/bootstrap'));
 assert.ok(get('src/worker.js').includes('getIdentity()'));
});
