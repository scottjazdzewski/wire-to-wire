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


test('Office sign-off geometry, historical nav, and case-aware actions stay wired to the original data',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js'),archive=get('public/app.js');
 assert.ok(css.includes('grid-column:1 / -1!important'),'Decision Desk must span the upper center width');
 assert.ok(css.includes('.ng-main .ng-choices{grid-column:2!important;grid-row:2!important'),'Your Call must start level with Intelligence');
 assert.ok(css.includes('.ng-main .ng-intel{grid-column:1!important;grid-row:2!important'));
 assert.ok(js.includes('decisionScene(d)'),'Decision-specific art must be shown in the expanded desk');
 assert.ok(js.includes('hasRelatedHorse'),'Non-horse decisions must not offer an unrelated Horse Profile');
 assert.ok(js.includes('resolvedRelatedAction'),'Resolved decision actions must be case-aware too');
 assert.ok(js.includes("if(section==='History'){window.location.assign('/archive/?page=races');return}"));
 assert.ok(js.includes("History:['Race Results','Horses','People & Farms','Facilities & Tracks','Historical Calendar','Coverage']"));
 assert.ok(archive.includes('archivePage'),'Existing history browser must accept deep links');
 assert.ok(css.includes('button:focus-visible'),'Keyboard users need visible focus');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Office inbox and analyst-panel visual QA: fixed rows, equal widths, and visible editorial photograph',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 assert.ok(!js.includes('style="grid-template-rows:repeat('),'Inbox row height must not depend on current page message count');
 assert.ok(css.includes('.ng-left .ng-inbox .ng-msg{'),'Inbox entries must have a dedicated uniform-height rule');
 assert.ok(css.includes('flex:0 0 78px!important'),'Normal-height inbox rows must stay compact');
 assert.ok(css.includes('grid-template-columns:repeat(2,minmax(0,1fr))!important'),'Intelligence and Your Call should have equal widths');
 assert.ok(css.includes('.ng-main .ng-intel .ng-intelitem{'),'Intelligence must use a compact row layout');
 assert.ok(js.includes('/assets/office/approved-office-photo.jpg'),'Use the already-approved stable photo instead of a nonphotographic mockup');
 assert.ok(js.includes('EDITORIAL REFERENCE PHOTO'),'The generic photograph must be identified honestly');
 assert.ok(css.includes('.ng-main>.ng-feature .ng-featurephoto{display:block!important}'),'Decision photography must stay visible at short viewport heights');
});


test('Decision photography resolves approved scene and entity assets without modifying history or gameplay',()=>{
 const js=get('public/next/next.js'),index=JSON.parse(get('public/assets/office/decision-photo-index.json'));
 assert.equal(index.default,'/assets/office/approved-office-photo.jpg');
 assert.deepEqual(index.cases,{});
 assert.deepEqual(index.entities,{});
 assert.ok(js.includes("fetch('/assets/office/decision-photo-index.json'"),'Office must load a UI-only photo index');
 assert.ok(js.includes('matchedCase||matchedEntity||matchedCategory'),'Override and specific entity pictures must precede category fallbacks');
 assert.ok(js.includes('casePhotoSubjects'),'Every existing decision must have a stable visual subject or scene');
 for(const id of ['powerline','lastmatch','saratoga','pieta','cash','newsbuzz','entries','cedar']) assert.ok(js.includes(id+':{'),'Missing subject for decision '+id);
 assert.ok(js.includes('img.src=genericDeskPhoto'),'Failed image paths must recover without losing the decision UI');
 assert.ok(js.includes('const relatedAction=hasRelatedHorse?\x60<button'),'Horse file button must render, not self-reference an uninitialized variable');
 assert.ok(!js.includes('hasRelatedHorse?\x60\x24{relatedAction}'),'Self-referential decision button causes runtime ReferenceError');
 assert.ok(!js.includes('hasRelatedHorse?\x60\x24{resolvedRelatedAction}'),'Resolved action cannot self-reference');
 assert.ok(js.includes('EDITORIAL REFERENCE PHOTO'),'Generic image must not be misrepresented as actual named horse');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Racing Office right-hand operations panels stay readable and source-linked',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 assert.ok(css.includes('.ng-right .ng-roster .ng-rosterrows,'),'Stable roster must use fixed height scrollable rows');
 assert.ok(css.includes('.ng-right .ng-races .ng-entrylist{'),'Race schedule must use fixed height scrollable rows');
 assert.ok(css.includes('overflow-y:auto!important'),'Operations lists must scroll rather than clip growth');
 assert.ok(js.includes('data-ng="fixture" data-val="${i}"'),'Upcoming race rows must open an actual fixture');
 assert.ok(js.includes("if(key==='fixture')"),'Fixture click must be handled');
 assert.ok(js.includes("bridgeNode(n)"),'Fixture must call the original source action');
 assert.ok(!js.includes('aria-label="Open racecourse: '),'A fixture action must not be falsely labeled a track profile');
 assert.ok(js.includes("const leads=$$('.app .oppList .oppItem').length"),'Opportunity count must come from source data');
 assert.ok(!js.includes('<span>3 CURRENT LEADS</span>'),'Opportunities must not show a permanently hard-coded count');
 assert.ok(js.includes('No horses are listed for this stable yet.'),'Show a meaningful empty roster');
 assert.ok(js.includes('No upcoming race targets are currently recorded.'),'Show a meaningful empty fixture list');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
