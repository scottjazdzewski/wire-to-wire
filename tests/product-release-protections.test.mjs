import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {dirname,resolve,join,relative} from 'node:path';
import {fileURLToPath} from 'node:url';

const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const read=path=>readFileSync(resolve(root,path),'utf8');
const lock=JSON.parse(read('ops/approved-visual-assets.lock.json'));
const imageExt=/\.(?:png|jpg|jpeg|webp|svg|gif)$/i;
function allImages(folder){
 const list=[];
 const visit=dir=>{for(const entry of readdirSync(dir,{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())visit(path);
  else if(entry.isFile()&&imageExt.test(entry.name))
   list.push(relative(root,path).split('\\').join('/'));
 }};
 visit(resolve(root,folder));
 return list.sort();
}
function blobHash(bytes){
 return createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
}

test('Every shipped image is present and has exact approved bytes: logos, trophies, badges, flags, heroes',()=>{
 assert.equal(lock.schema,'WTW_APPROVED_VISUAL_ASSET_LOCK_V1');
 const listed=Object.keys(lock.assets).sort();
 assert.ok(listed.length>=250,'Visual asset lock unexpectedly sparse after 108 generated 64px logos retired');
 assert.ok(listed.every(path=>!path.startsWith('public/assets/office/owner-logos/')),
  'Retired pixelated owner images must never return to the approved visual lock');
 assert.deepEqual(allImages('public/assets'),listed,
  'A visual asset was added or removed without release manifest review');
 for(const path of listed){
  assert.ok(path.startsWith('public/assets/')&&!path.includes('..'),path);
  assert.match(lock.assets[path],/^[0-9a-f]{40}$/);
  assert.equal(blobHash(readFileSync(resolve(root,path))),lock.assets[path],
   'Approved art was changed: '+path+'. A new visual needs explicit approval and a reviewed lock update.');
 }
});

test('One canonical playable UI, protected track family and no resurrected screen implementations',()=>{
 const start=read('public/index.html'),html=read('public/next/index.html');
 const manager=read('public/manager/index.html');
 const js=read('public/next/next.js'),css=read('public/next/next.css');
 assert.match(start,/url=\/next\/\?world=1999/);
 assert.match(manager,/url=\/next\/\?world=1999/);
 assert.match(html,/<body class="wtw-next-active">/);
 assert.match(html,/data-wtw-layout="legacy-data-bridge" aria-hidden="true" hidden/);
 assert.match(js,/root\.id='wtwNextgen'/);
 assert.match(js,/function profileDetail\(route,sourceOverride=null\)/);
 assert.match(js,/ng-track-workspace/);
 assert.match(js,/ng-stakes-table/);
 assert.match(js,/if\(isTrack&&APP\.detailTab==='History'\)\{\s*left=trackHistoryFull\(\)/);
 assert.match(css,/ng-track-info-stack/);
 for(const path of ['public/manager/manager.js','public/manager/manager.css',
  'public/office-v30-2.js','public/office-v30-3.js'])
  assert.equal(existsSync(resolve(root,path)),false,'Retired UI returned: '+path);
 assert.doesNotMatch(js,/pilotHorseConnectionsPanel|profileRecordSection|connectedTableState|ng-connected-profile/);
});

test('Founding logos are exact-ID linked and game save rules match the authoritative browser mirror',()=>{
 const index=JSON.parse(read('public/assets/office/founding-organization-logo-index.json'));
 const directory=JSON.parse(read('public/data/wtw-1999-founding-directory-v1.json'));
 const ids=new Set(directory.organizations.map(x=>x.id));
 assert.equal(ids.size,directory.organizations.length);
 assert.equal(index.publishedCount,Object.keys(index.organizations).length);
 assert.equal(index.publishedCount+index.remainingWithoutMatchedLogo,ids.size);
 for(const [key,value] of Object.entries(index.organizations)){
  assert.match(key,/^organization:O-[A-Za-z0-9-]+$/);
  assert.ok(ids.has(key.slice('organization:'.length)),'Unmatched asset identity: '+key);
  assert.ok(value.startsWith('/assets/office/'));
  assert.ok(existsSync(resolve(root,'public'+value)),'Logo is missing: '+value);
 }
 assert.equal(read('src/game/persistence.js'),read('public/1999/game/persistence.js'),
  'Source and browser may not have different game save implementations');
});

test('The universal product integrity workflow covers ALL pull requests and real browser restart certification',()=>{
 const workflow=read('.github/workflows/product-release-integrity.yml');
 assert.match(workflow,/pull_request:/);
 assert.match(workflow,/push:/);
 assert.match(workflow,/product-release-protections\.test\.mjs/);
 assert.match(workflow,/product-lifecycle-10000\.test\.mjs/);
 assert.match(workflow,/product-browser-restart-certification\.mjs/);
 assert.doesNotMatch(workflow,/\n\s*paths:/,
  'Never restrict the product-wide release check to one engineering workstream');
});
