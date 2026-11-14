import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync,readFileSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {dirname,resolve} from 'node:path';

const base=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const source=path=>readFileSync(resolve(base,path),'utf8');
const exists=path=>existsSync(resolve(base,path));
const root=source('public/index.html');
const current=source('public/next/index.html');
const manager=source('public/manager/index.html');
const visualCSS=source('public/next/next.css');
const core=source('public/next/next.js');
const workflow=source('.github/workflows/desktop-visual-audit.yml');
const runner=source('scripts/run-current-tests.mjs');

test('retired manager screen has no runtime or stylesheet left to serve',()=>{
 for(const path of [
  'public/manager/manager.js',
  'public/manager/manager.css',
  'scripts/manager-v2-visual-audit.sh',
  'public/office-v30-2.js',
  'public/office-v30-3.js'
 ])assert.equal(exists(path),false,'Obsolete screen file reappeared: '+path);
 assert.match(manager,/http-equiv="refresh" content="0;url=\/next\/\?world=1999"/);
 assert.match(manager,/location\.replace\('\/next\/\?world=1999'\)/);
 assert.doesNotMatch(manager,/manager\.js|manager\.css|mgApp/);
 assert.match(root,/content="0;url=\/next\/\?world=1999"/);
 assert.ok(!current.includes('src="/manager/'),"Retired Manager V2 must never load");
});

test('only #wtwNextgen presents a playable Office layout',()=>{
 assert.match(current,/<body class="wtw-next-active">/);
 assert.match(current,/<div class="app"[^>]+data-wtw-layout="legacy-data-bridge"[^>]+aria-hidden="true" hidden>/);
 assert.match(current,/<div id="routeShell"[^>]+data-wtw-layout="legacy-data-bridge"[^>]+aria-hidden="true" hidden>/);
 assert.match(current,/<div id="toast"[^>]+data-wtw-layout="legacy-data-bridge"[^>]+aria-hidden="true">/);
 assert.match(visualCSS,/body\.wtw-next-active>\.app,body\.wtw-next-active>#routeShell,body\.wtw-next-active>#toast[^{}]+\{display:none!important\}/);
 assert.match(core,/root\.id='wtwNextgen'/);
 assert.match(core,/document\.body\.append\(root\)/);
 assert.match(core,/root\.innerHTML=header\(\)\+'<div class="ng-manager-shell">/);
 assert.doesNotMatch(current,/<script[^>]+src="[^"]*\/manager\/manager\.js/);
});

test('legacy DOM remains a quarantined GAMEPLAY ADAPTER, not a second player screen',()=>{
 // These selectors still power existing decision actions, save/load and
 // source-backed profile data. Do not drop them until a tested direct adapter
 // replaces the DOM bridge.
 for(const id of ['routeShell','routeBody','routeTitle','routeKicker','loadStateInput']){
  assert.match(current,new RegExp('id="'+id+'"'),'Required source bridge node missing '+id);
 }
 for(const ref of ['/office-v30-1.js','/office-v30-4.js','/office-fm-v37.js']){
  assert.ok(current.includes('src="'+ref),'Required source adapter missing '+ref);
 }
 assert.match(core,/const originalAct=\(act\)=>/);
 assert.match(core,/function bridgeNode\(node\)/);
 assert.match(core,/function profileDetail\(route,sourceOverride=null\)/);
 assert.match(core,/const currentRoute=\(\)=>/);
});

test('release checks cannot revive an obsolete screen or archived UI tests',()=>{
 assert.doesNotMatch(workflow,/manager-v2|Management Studio V2/);
 assert.match(workflow,/bash scripts\/desktop-visual-audit\.sh/);
 assert.ok(!runner.includes('const obsolete=new Set('),'No excluded legacy tests may be quietly revived');
 const obsolete=[
  'approved-badges-v2.test.mjs','fm-management-screen-family.test.mjs',
  'manager-v2-independent.test.mjs','next-office-v6.test.mjs',
  'next-office-v3.test.mjs','nextgen-ui.test.mjs',
  'next-office-v7.test.mjs','office-pedigree-existing-tab.test.mjs',
  'office-single-visual-layer.test.mjs','office-v30-site.test.mjs',
  'site-main-promotion.test.mjs','ui-canonical-style.test.mjs'
 ];
 const live=new Set(readdirSync(resolve(base,'tests')));
 for(const file of obsolete)assert.equal(live.has(file),false,'A deprecated layout test resurfaced: '+file);
});
