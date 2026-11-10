import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
test('v6 Racing Office is one cohesive viewport and still one visual system',()=>{
 const main=get('public/index.html'),review=get('public/next/index.html');
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 for(const html of [main,review]){
  assert.equal((html.match(/<link\s+rel="stylesheet"/g)||[]).length,1,'One stylesheet');
  assert.ok(html.includes('href="/next/next.css"'));
  assert.ok(html.includes('src="/next/next.js"'));
  assert.ok(html.includes('src="/office-v30-4.js"'));
  assert.ok(html.includes('src="/office-fm-v37.js"'));
 }
 assert.ok(main.includes('href="/archive/"'),'Archive preserved');
 assert.ok(css.includes('WTW Next v6'),'Shared v6 Office system');
 assert.ok(css.includes('.ng-main>.ng-feature'),'Decision, Intel, and choices share one surface');
 assert.ok(css.includes('.ng-right>.ng-roster'),'Stable and races share one operations rail');
 assert.ok(css.includes('.ng-featurephoto img'),'Horse photo is visible behind readable text');
 assert.ok(css.includes('.ng-moves:has(>.ng-resolved)'),'Resolved decision fills the available panel');
 assert.ok(css.includes('.ng-flag-us'),'US flags render without relying on Windows emoji fonts');
 assert.ok(!css.includes('@import'),'No extra CSS imports');
 assert.ok(js.includes('<span>STATUS</span>'),'Race status column cannot wrap the entry count');
 assert.ok(!js.includes('<span>\${entered} ENTERED</span>'),'Retired clipped column label');
 assert.ok(js.includes('class="ng-flag-us"'),'Race flags use the approved flag treatment');
 for(const item of ['function inbox()','function center()','function right()','selectAdjacentCase','ng-resolved','ng-move','ng-rosterrow','ng-entryrow'])assert.ok(js.includes(item),item);
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
