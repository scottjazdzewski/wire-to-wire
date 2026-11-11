import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('All screens use one persistent management frame',()=>{
 const js=read('public/next/next.js'),css=read('public/next/next.css');
 assert.ok(js.includes('function managerSidebar(){'));
 assert.ok(js.includes('function header(){'));
 assert.ok(js.includes('ng-manager-shell')&&js.includes('ng-manager-stage'));
 assert.ok(js.includes('root.innerHTML=header()'));
 assert.ok(js.includes('managerSidebar()'));
 assert.ok(js.includes('function renderRoute(){'));
 assert.ok(js.includes('ng-board'));
 assert.ok(css.includes('.ng-manager-shell{display:grid;grid-template-columns:177px minmax(0,1fr)'));
 assert.ok(css.includes('.ng-manager-stage{display:flex;flex-direction:column'));
 assert.ok(css.includes('.ng-manager-rail-link.on{'));
 assert.ok(!js.includes('<nav class="ng-primary" aria-label="Primary game navigation">'));
});

test('Shared game navigation preserves source-backed department, search and history routes',()=>{
 const js=read('public/next/next.js');
 const start=js.indexOf('function managerSidebar(){'),end=js.indexOf('function header(){',start);
 const sidebar=js.slice(start,end);
 for(const name of ['Office','Stable','Racing','Breeding','Sales','Personnel','Facilities','Finances','History','World'])
  assert.ok(sidebar.includes("'"+name+"'"),name+' missing from persistent navigation');
 assert.ok(js.includes("if(key==='menu')return openMenu(val)"));
 assert.ok(js.includes("if(key==='tab')return pageTab(val)"));
 assert.ok(js.includes("if(section==='History'){window.location.assign('/archive/?page=races');return}"));
 assert.ok(js.includes('data-ng="back"')&&js.includes('data-ng="forward"'));
 assert.ok(js.includes('data-ng="action" data-val="Continue"'));
});
