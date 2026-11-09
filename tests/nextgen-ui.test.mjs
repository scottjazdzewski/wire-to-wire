import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const get=p=>fs.readFileSync(path.join(root,p),'utf8');
test('Next UI is a standalone review page with one fresh visual layer',()=>{
 const html=get('public/next/index.html');
 const styles=[...html.matchAll(/href="(\/next\/next\.css)"/g)];
 assert.equal(styles.length,1);
 assert.equal((html.match(/<link\s+rel="stylesheet"/g)||[]).length,1);
 assert.match(html,/class="wtw-next-active"/);
 assert.ok(html.includes('src="/next/next.js"'));
 assert.ok(html.includes('src="/office-v30-4.js"'));
 assert.ok(html.includes('src="/office-fm-v37.js"'));
 assert.ok(html.includes('content="noindex,nofollow"'));
 assert.ok(!html.includes('<style'),'No embedded second visual layer');
 assert.ok(!html.includes('<script>'),'Production CSP prohibits inline scripts');
 const css=get('public/next/next.css');
 assert.ok(css.startsWith('/* WIRE TO WIRE NEXT'));
 assert.ok(!css.includes('@import'),'No CSS layers imported');
 const js=get('public/next/next.js');
 assert.ok(js.includes('wtwOfficeStateV30'),'One canonical save namespace');
 for(const area of ['Messages','Decisions','Your Stable','Race Calendar'])assert.ok(html.includes('WIRE TO WIRE')&&js.toLowerCase().includes(area.toLowerCase().split(' ')[0]));
 for(const p of ['public/next/next.js','public/office-v30-4.js']){
  const check=spawnSync(process.execPath,['--check',path.join(root,p)],{encoding:'utf8'});
  assert.equal(check.status,0,check.stderr);
 }
});

test('Shared profile template replaces duplicate page banners',()=>{
  const js=get('public/next/next.js');
  const css=get('public/next/next.css');
  assert.ok(js.includes('ng-profile-badgeframe'));
  assert.ok(js.includes('ng-route-profile'));
  assert.ok(js.includes('isProfile?\'\':'));
  assert.ok(css.includes('.ng-profile-identity'));
  assert.ok(js.includes('function calendarTimeline(races,nonraces)'));
  assert.ok(js.includes('ng-cal-event'));
  assert.ok(css.includes('.ng-timeline-grid'));
  assert.ok(js.includes('APP.activeCase'));
});
