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
  assert.ok(js.includes("isProfile||isOrganization?'':"),'Entity profiles and organization overview must not show duplicate route banners');
  assert.ok(js.includes("APP.custom==='Organization Overview'?null:currentRoute()"),'Open organization overview must take priority over a stale entity profile route');
  assert.ok(css.includes('.ng-profile-identity'));
  assert.ok(js.includes('function calendarTimeline(races,nonraces)'));
  assert.ok(js.includes('ng-cal-event'));
  assert.ok(css.includes('.ng-timeline-grid'));
  assert.ok(js.includes('APP.activeCase'));
});

test('Office case queue, filters and full-height result sheet are source-driven',()=>{
 const html=get('public/next/index.html');
 const js=get('public/next/next.js');
 const css=get('public/next/next.css');
 assert.ok(html.includes('src="/next/next.js"'));
 for(const key of ['caseprev','casenext','casecenter','nextopen','Open','Reviewed']){
   assert.ok(js.includes(key),'Missing real Office interaction '+key);
 }
 assert.ok(js.includes('selectAdjacentCase'));
 assert.ok(js.includes('currentMessages().filter(m=>m.resolved)'));
 assert.ok(js.includes('data-ng="menu" data-val="Stable"'),'Stable remains reachable in the top navigation and roster');
 assert.ok(js.includes('data-ng="menu" data-val="Racing"'),'Racing remains reachable in top navigation and schedule');
 assert.ok(!js.includes('class="ng-mast'),'Duplicate mast is intentionally absent from compact Office');
 assert.ok(css.includes('.ng-moves:has(>.ng-resolved)'),'A completed decision must use the whole results panel');
 assert.ok(css.includes('.ng-outtext'),'Decision outcomes must remain legible');
 assert.ok(css.includes('.ng-case-pip'),'Case navigation must be visible');
 assert.ok(!html.includes('<style'),'The Next UI keeps one external visual layer');
});

test('Next Racing Office v5 retains one visual system and the complete game connections',()=>{
 const css=get('public/next/next.css');
 const js=get('public/next/next.js');
 const html=get('public/next/index.html');
 assert.equal((html.match(/rel="stylesheet"/g)||[]).length,1);
 assert.ok(css.includes('WTW NEXT v5'), 'v5 Office design is published in the same stylesheet');
 assert.ok(css.includes('.ng-intelgrid'), 'Intel layout must remain readable');
 assert.ok(css.includes('.ng-featurephoto'), 'Editorial decision photo component missing');
 assert.ok(css.includes('.ng-resolved'), 'Completed decisions must remain usable');
 assert.ok(js.includes('selectAdjacentCase'), 'Case navigation must be preserved');
 for(const zone of ['function inbox()','function center()','function right()']) assert.ok(js.includes(zone),'Missing permanent Office zone: '+zone);
 for(const badge of ['horse','meet_schedule'])assert.ok(js.includes(badge),'Approved badges missing');
});
