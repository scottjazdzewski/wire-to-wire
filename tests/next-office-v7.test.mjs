import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');

test('v7 Office is a structural command-workspace redesign, not a second stylesheet',()=>{
 const rootHTML=get('public/index.html'),review=get('public/next/index.html');
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 for(const html of [rootHTML,review]){
   assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1,'Only one visual stylesheet is active');
   assert.ok(html.includes('href="/next/next.css"'));
   assert.ok(html.includes('src="/next/next.js"'));
   assert.ok(html.includes('src="/office-v30-4.js"'),'Canonical decision engine preserved');
   assert.ok(html.includes('src="/office-fm-v37.js"'),'Canonical full-page routes preserved');
 }
 assert.ok(rootHTML.includes('href="/archive/"'),'Historical archive remains linked');
 assert.ok(css.includes('WIRE TO WIRE NEXT v7'),'The reviewed new composition must be deployed');
 assert.ok(css.includes('.ng-main>.ng-centerbottom{display:contents'),'Intel and decision options must be peers in the full-height command grid');
 assert.ok(css.includes('.ng-main .ng-choices{grid-column:2'),'Decision choices must occupy their own vertical command column');
 assert.ok(css.includes('@media(max-width:1279px)'),'Compact laptop layout must remain readable');
 assert.ok(css.includes('Short-screen resolved decisions'),'Decision consequence text must be preserved at small viewports');
 assert.ok(css.includes('REFERENCE PHOTO'),'The existing generic photography must be identified honestly');
 assert.ok(!css.includes('@import'),'No additional CSS imports');
 for(const label of ['ng-move','ng-rosterrow','ng-entryrow','ng-intelitem','ng-msg','ng-resolved'])assert.ok(js.includes(label),'Missing core interactive Office element '+label);
 assert.ok(js.includes("typeof deskCases!=='undefined'"),'Option descriptions must read canonical source data, not a new ledger');
 assert.ok(js.includes('deskCases[APP.activeCase]?.moves?.[i]?.[1]'),'Option explanations must be source-linked');
 assert.ok(js.includes('ng-move-note'),'Option descriptions must be visible in the management UI');
 assert.ok(!js.includes('const deskCases='),'No second deskCases store');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});
