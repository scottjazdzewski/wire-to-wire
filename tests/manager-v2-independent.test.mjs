import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');

test('Clean-sheet Manager V2 parses, keeps one stylesheet and retains the canonical engine',()=>{
 const parsed=spawnSync(process.execPath,['--check',path.join(root,'public/manager/manager.js')],{encoding:'utf8'});
 assert.equal(parsed.status,0,parsed.stderr);
 const html=get('public/manager/index.html'),css=get('public/manager/manager.css'),js=get('public/manager/manager.js');
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.ok(html.includes('href="/manager/manager.css"'));
 assert.ok(html.includes('src="/manager/manager.js"'));
 assert.ok(!html.includes('src="/next/next.js"'));
 assert.ok(html.includes('src="/office-v30-4.js"'));
 assert.ok(css.includes('MANAGEMENT STUDIO V2'));
 assert.ok(js.includes('window.__wtwOfficeOpenSearchRecord'));
 assert.ok(js.includes('wtwOfficeStateV30'));
 assert.ok(js.includes('sourceAction(\'Continue\')'));
 assert.ok(js.includes('function horseProfile(name)')&&js.includes('function personProfile(name)'));
 assert.ok(!js.includes('localStorage.setItem'),'V2 presentation must not write fabricated data to the authoritative state');
 const legacy=get('public/office-v30-4.js');
 assert.ok(legacy.includes("if(e.target.closest('#mgApp'))return;"),'Legacy capture handler cannot intercept Manager V2 navigation clicks');
 assert.ok(legacy.includes('!window.__WTW_MANAGER_SILENT_NAV__'),'Legacy Office navigation must not add hidden history entries during Manager actions');
 assert.ok(js.includes('function withSilentOfficeRoute(task)'),'Manager navigation must protect browser history when syncing gameplay files');
});

test('Four-tier fictional preview ratings are explicitly isolated from save and switchable to real',()=>{
 const js=get('public/manager/manager.js'),css=get('public/manager/manager.css');
 assert.ok(js.includes("get('ratings')!=='real'"),'Source-data view must be available with ratings=real');
 assert.ok(js.includes('demoScore=(name,key)'),'Preview values are deterministically local to the UI');
 assert.ok(js.includes('Fictional demo rating, not in source record'),'Demo rating provenance must be explicit');
 assert.ok(js.includes('DEMO RATINGS · FICTIONAL · NOT SAVED'),'Fictional figures have conspicuous label');
 for(const tier of ['poor','average','good','elite']) {
  assert.ok(css.includes('.mg-meter.'+tier+' i'),'Color bar missing '+tier);
  assert.ok(css.includes('strong.'+tier),'Numeric rating color missing '+tier);
 }
 assert.ok(js.includes('obs.evidence_refs.length>0'),'Real measurements still need evidence');
 assert.ok(!js.includes('readState().horseState[name].attribute_observations='),'Preview must not write to horse save');
});
