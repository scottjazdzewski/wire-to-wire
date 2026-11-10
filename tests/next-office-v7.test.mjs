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
 assert.ok(js.includes("const leads=document.querySelectorAll('.app .oppList .oppItem').length"),'Opportunity count must come from source data');
 assert.ok(!js.includes('<span>3 CURRENT LEADS</span>'),'Opportunities must not show a permanently hard-coded count');
 assert.ok(js.includes('No horses are listed for this stable yet.'),'Show a meaningful empty roster');
 assert.ok(js.includes('No upcoming race targets are currently recorded.'),'Show a meaningful empty fixture list');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Compact racing-management chrome eliminates duplicate mast and keeps global Continue/date accessible',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 const header=js.slice(js.indexOf('function header(){'),js.indexOf('function filteredMessages(){'));
 assert.ok(header.includes('class="ng-global"'),'One top application bar must remain');
 assert.ok(header.includes('ng-global-continue" data-ng="action" data-val="Continue"'),'Continue must be in top navigation and retain its canonical action');
 assert.ok(header.includes('ng-global-date" data-ng="menu" data-val="Racing"'),'Game date must remain visible and open existing calendar');
 assert.ok(!header.includes('class="ng-mast'),'The redundant 80px office mast must be removed');
 assert.ok(!header.includes('ng-mast-centre'),'Open case, horses and race counts already live in their respective panels');
 assert.ok(!header.includes('focusCard'),'The Current File block duplicates the Decision Desk');
 assert.ok(!header.includes('ng-fastnav'),'Remove duplicate shortcuts from secondary nav');
 assert.ok(header.includes('ng-subbar'),'Section navigation must stay accessible');
 assert.ok(css.includes('Compact football-management application chrome'),'A consistent responsive header should control space');
 assert.ok(css.includes('.ng-global .ng-global-continue{'),'Continue needs a proper top-bar design');
 assert.ok(css.includes('@media(max-width:780px){'),'Keep Continue and date available on smaller screens');
 assert.ok(css.includes('.ng-main .ng-intel>.ng-cardhead,\n.ng-main .ng-choices>.ng-cardhead{'),'Intel and Your Call should retain matching titlebar styles');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Racing Office source-linked interactions are correct and visually unambiguous',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const center=js.slice(js.indexOf('function center(){'),js.indexOf('function right(){'));
 assert.ok(center.includes('${relatedAction}</div></div><div class="ng-featurephoto">'),'Only horse-linked cases can offer a Horse Profile button');
 assert.ok(center.includes('<div class="ng-outcome-actions">${resolvedRelatedAction}'),'Resolved outcomes must use the case-appropriate related record');
 assert.ok(center.includes('ng-static-title'),'A decision title is a heading, not a redundant second Open File action');
 assert.ok(!center.includes('<button class="ng-casetitle"'),'The title cannot duplicate the explicit Review Full File button');
 assert.ok(js.includes("new Set(['powerline','lastmatch','pieta','entries','newsbuzz'])"),'Non-horse Cedar and sales/financial decisions should not show a Horse Profile');
 assert.ok(js.includes("const row=$$('.right .rankRow').find("),'Roster click must search the full source-backed list');
 assert.ok(js.includes("const n=$$('.right .fixtureList .fixture[data-track]')[Number(val)]"),'Fixture click must index the full list');
 assert.ok(js.includes('aria-pressed="${APP.filter===v?'),'Inbox filters need accessible selected state');
 assert.ok(js.includes('aria-current="${m.case===APP.activeCase?'),'Current Inbox item must be marked');
 assert.ok(css.includes('.ng-main .ng-static-title{'),'Static title must retain approved typography without interactive hover');
 assert.ok(css.includes('.ng-left .ng-inbox .ng-msg[aria-current="true"]'),'Selected Inbox case must be visually distinct');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});


test('Organization logo slot, operations overview, cash and due-alert read only canonical save state',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const logos=JSON.parse(get('public/assets/office/organization-logo-index.json'));
 assert.deepEqual(logos.organizations,{},'Do not invent organization branding or a parallel identity registry');
 assert.ok(js.includes("localStorage.getItem('wtwOfficeStateV30')"),'Keep the canonical Office save key');
 assert.ok(js.includes('function organizationLogoMarkup('),'All organizations need a reusable image/placeholder slot');
 assert.ok(js.includes('const isOrganizationProfile=/'),'Farm and future organization profile templates must reuse this mark');
 assert.ok(js.includes("kind==='stable'?'player':''"),'Player-stable logo can be attached without a new organization record');
 assert.ok(js.includes('ng-org-chip" data-ng="organization"'),'Decision Desk must link its stable mark to the operations overview');
 assert.ok(js.includes("APP.custom='Organization Overview'"),'Logo must open the actual operation overview');
 assert.ok(js.includes("else if(APP.custom==='Organization Overview'){body=organizationOverview()}"),'Organization view is wired into existing route rendering');
 assert.ok(js.includes('organizationLogoMarkup(playerOrganization().id,playerOrganization().name'), 'Overview and Office mark use the same identity');
 assert.ok(js.includes('function openFollowUps()'),'Follow-ups must be read from saved state');
 assert.ok(js.includes('function dueActions()'),'Due marker must be calculated from saved follow-up deadlines');
 assert.ok(js.includes('data-ng="due"'),'Due action must have a working navigation handler');
 assert.ok(js.includes("else if(APP.custom==='Due Actions'){body=dueActionOverview()}"),'Due marker must open a full actionable list');
 assert.ok(js.includes("const values=[stable.available_cash,stable.availableCash"),'Cash must be derived only from explicit money fields');
 assert.ok(js.includes("return value===undefined?null:value"),'Unknown cash must not show an invented dollar amount or zero');
 assert.ok(!js.includes('cash_flexibility,stable'),'Qualitative finance effects cannot be interpreted as money');
 assert.ok(css.includes('.ng-main .ng-feature>.ng-cardhead .ng-org-chip{'),'Organization button should live beside the Decision Desk heading');
 assert.ok(css.includes('.ng-org-overview-grid{'),'Full linked operations overview must exist');
 assert.ok(css.includes('.ng-global .ng-global-due{'),'Show due indicator in the compact global header');
 assert.ok(js.includes('ng-org-chip-cash'),'Available cash must sit beside the operation logo in the Decision Desk');
 assert.ok(!js.includes('class="ng-global-cash"'),'No cash readout should compete for space in the top navigation');
 assert.ok(css.includes('.ng-main .ng-feature>.ng-cardhead .ng-org-chip-cash{'),'Cash must share the Decision Desk organization control');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Desktop sign-off: real WTW brand icon, inline Cash, and no scrolling department bar',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const index=JSON.parse(get('public/assets/office/organization-logo-index.json'));
 assert.deepEqual(index.organizations,{},'Missing organization crest must not be fabricated');
 assert.ok(js.includes("const brandLogo=brandFallback&&!entityLogo?'/assets/wtw-office-approved-logo.png':''"),'The player operation button must use actual approved WTW brand artwork while awaiting its own crest');
 assert.ok(js.includes("brandLogo?'Wire to Wire game logo"),'The game logo must not be falsely described as an organization-specific emblem');
 assert.ok(js.includes("organizationLogoMarkup(playerOrganization().id,playerOrganization().name,'stable',false,true)"),'Decision Desk must render a real image instead of ST initials');
 assert.ok(js.includes('ng-org-chip-cash'),'Cash must sit alongside the real logo');
 assert.ok(!js.includes('class="ng-global-cash"'),'Cash must be removed from the crowded top header');
 assert.ok(js.includes('data-ng="more"'),'Less-frequent departments need an accessible compact menu at desktop widths');
 assert.ok(js.includes('APP.moreOpen=!APP.moreOpen'),'More menu must open and close via actual interaction');
 assert.ok(js.includes("['Breeding','Personnel','Facilities','Finances','World']"),'All hidden departments must remain reachable');
 assert.ok(css.includes('Desktop lock: image-only organization identity and inline cash; no top-bar scrolling'),'Approved desktop chrome must remain fixed');
 assert.ok(css.includes('overflow-x:hidden!important'),'Primary desktop navigation may not horizontally scroll');
 assert.ok(css.includes('data-val="Breeding"'),'Hidden departments must have responsive menu treatment');
 assert.ok(css.includes('.ng-global .ng-global-moremenu{'),'The menu must be rendered when additional departments are hidden');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});


test('First FM/OOTP desktop subpage pilot: Horse Profile data density, connected entities and no fictional data',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const start=js.indexOf('function profileDetail('),end=js.indexOf('function calendarTimeline(',start);
 const profile=js.slice(start,end);
 assert.ok(profile.includes("isHorse=route.kicker==='Horse Profile'"),'Horse template must be explicitly shared without affecting others');
 assert.ok(profile.includes("['Overview','Career Record','Pedigree','Achievements','Connections','History']"),'Horse has an independently navigable Achievements tab');
 assert.ok(profile.includes('aria-current="${APP.detailTab===t?'),'Active profile section must be accessible');
 assert.ok(profile.includes('ng-horse-careercard'),'Career summary must be visible on Horse Overview rather than buried behind another tab');
 assert.ok(profile.includes('ng-horse-connections'),'Connected trainer/owner/jockey/farm records should be visible in first overview');
 assert.ok(profile.includes('connectionRows()'),'Connections use existing source-linked route actions');
 assert.ok(profile.includes("data-ng=\"sourcebutton\""),'Connections and decision links must reuse the original source route actions');
 assert.ok(profile.includes('horseAchievements'),'Achievements must come from the existing approved source panel');
 assert.ok(profile.includes("No achievements documented in the current source record."),'Missing achievements must not be invented');
 assert.ok(profile.includes("officePhotoIndex?.entities?.[entityPhotoKind+':'+route.title]"),'Entity portraits may only be shown when actually linked in the approved photo index');
 assert.ok(profile.includes('sourceDecision')&&profile.includes('sourceFollowUp'),'Source-linked related decisions and follow-ups must remain navigable');
 assert.ok(css.includes('WTW FM/OOTP page-family pilot'),'One profile design system must stay in the existing stylesheet');
 assert.ok(css.includes('grid-template-columns:minmax(0,.92fr) minmax(0,1.03fr) minmax(0,1.1fr)'),'Desktop horse overview uses three purposeful, dense columns');
 assert.ok(css.includes('.ng-route-profile .ng-profile-horse .ng-profile-intro{'),'Horse profile has a compact identity band');
 assert.ok(css.includes('.ng-route-profile .ng-profile-horse .ng-horse-activity .ng-notes'),'Supporting Office context uses its own dense panel');
 const result=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});


test('FM/OOTP connected profiles: people, farms, tracks, sourced graphics, clickable evidence and scrolling',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const i=js.indexOf('function profileDetail('),j=js.indexOf('function calendarTimeline(',i);
 const profile=js.slice(i,j);
 for(const type of ['Horse','People','Farm','Track']) assert.ok(profile.includes("route.kicker==='"+type+" Profile'"),type+' template must use the existing profile adapter');
 assert.ok(profile.includes("['Overview','Stable Horses','Career','Connections','History']"),'Person profile needs stable and career drill-downs');
 assert.ok(profile.includes("['Overview','Connected Horses','Operations','Connections','History']"),'Farm needs connected horse and operation drill-downs');
 assert.ok(profile.includes("['Overview','Meet Schedule','Major Races','Connections','History']"),'Track profile preserves its meet and stakes navigation');
 assert.ok(profile.includes('function')===false||profile.includes('sourcePanels'),'Profile data should remain in existing source panels');
 assert.ok(profile.includes("$$('.profilePanel',source).find("),'Source panels need collection search, not a single Element.find()');
 assert.ok(profile.includes("$$('.achievementItem',horseAchievementPanel).map("),'Horse achievements must be a true collection');
 assert.ok(!profile.includes("$$$('#routeBody"),'No accidental triple-dollar source selector');
 assert.ok(profile.includes("const index=btn?$$('#routeBody [data-act]').indexOf(btn)"),'Linked entity action indexes must use the full NodeList');
 assert.ok(profile.includes("connectedHorseRows()"),'Linked person/farm horses must remain actionable');
 assert.ok(profile.includes("data-ng=\"sourcebutton\""),'Linked records and races must trigger original source handlers');
 assert.ok(profile.includes('stakesTable(6)'),'Track overview must include a source-backed compact stakes table');
 assert.ok(profile.includes("stakesTable()"),'Track Major Races should list all available source rows');
 assert.ok(profile.includes('reputationGauge'),'Person graphics must use source reputation, not fabricated values');
 assert.ok(profile.includes('ng-detail-cols-entity'),'People/Farm/Track use one shared desktop layout');
 assert.ok(profile.includes("officePhotoIndex?.entities?.[entityPhotoKind+':'+route.title]"),'Entity photos must use the previously approved photo-index mapping');
 assert.ok(css.includes('Connected subpage family: desktop information density'),'One common desktop layout governs connected profiles');
 assert.ok(css.includes('overflow-y:auto!important'),'Information must scroll within the profile workspace');
 assert.ok(css.includes('.ng-stakes-head,.ng-stakes-data{'),'Race rows must be consistent and aligned for comparable stakes data');
 assert.ok(js.includes('previousDetailScroll'),'Selected page scroll must persist through source-driven rerenders');
 assert.ok(js.includes('previousRouteKey'),'Scroll must reset on navigating to a distinct route');
 assert.ok(js.includes('data-route-key'),'Each screen needs stable identity for navigation continuity');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});


test('Stable directory uses the canonical horses and commitments with working search, sort and status filters',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const a=js.indexOf('function functionalRoute('),b=js.indexOf('function renderRoute(',a);
 const page=js.slice(a,b);
 assert.ok(page.includes("const horses=horseRows(),races=racingRows(),st=state()"),'Stable directory must read existing Office horses, fixtures and save state');
 assert.ok(page.includes('const entries=horses.map('),'Directory records must be derived from existing roster');
 assert.ok(page.includes("stableFilter==='entered'"),'Entry filter must only count confirmed race status');
 assert.ok(page.includes("stableFilter==='targets'"),'Race target filter must remain separate from entered');
 assert.ok(page.includes("stableFilter==='unassigned'"),'Unassigned horses must be filterable');
 assert.ok(page.includes("filtered.sort("),'Management columns must sort existing rows');
 assert.ok(page.includes("ng-stable-row"),'Stable directory must render dense clickable rows');
 assert.ok(page.includes('data-ng="horse"'),'Horse rows must open real source-backed profiles');
 assert.ok(page.includes('data-ng="fixture"'),'Sidebar race commitments must open the existing fixture handler');
 assert.ok(page.includes('data-ng="case"'),'Horse-named Office files must open the actual decision');
 assert.ok(page.includes('data-ng-input="stable-search"'),'Stable search must be keyboard accessible');
 assert.ok(js.includes("if(key==='stable-sort')"),'Sort controls must do something');
 assert.ok(js.includes("if(key==='stable-filter')"),'Filter controls must do something');
 assert.ok(js.includes("root.addEventListener('input',event=>"),'Search must filter without losing input focus');
 assert.ok(css.includes('.ng-stable-tablebody{'),'Management table needs its own scroll region');
 assert.ok(css.includes('.ng-stable-contextlist{'),'Commitment lists need independent scrolling');
 assert.ok(css.includes('.ng-stable-row[hidden]{display:none!important}'),'Clearing search must not leave invisible records stuck');
 assert.ok(!page.includes('Manager\'s daily overview'),'Replace generic explanatory sidebar with source-driven content');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Horse athletic overview uses four sourced FM-style trait groups with explicit unassessed states',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const catalog=JSON.parse(get('public/assets/game/attribute-catalog.v1.json'));
 const profile=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 assert.deepEqual(Object.keys(catalog.display.horse_overview),[
  'Speed & Pace','Surface & Environment','Physical & Biometric','Mental & Class'
 ]);
 for(const [category,keys] of Object.entries(catalog.display.horse_overview)){
   const defined=new Set(catalog.horse_categories[category].map(d=>d.key));
   assert.equal(keys.length,6,category+' must have six compact headline attributes');
   for(const key of keys)assert.ok(defined.has(key),'Overview trait must be defined by the single catalog: '+key);
 }
 assert.ok(js.includes("fetch('/assets/game/attribute-catalog.v1.json'"),'Horse UI must use one shared catalog, not a copied list');
 assert.ok(profile.includes('const athleteOverview=()=>'),'Horse Overview must use one dedicated athlete component');
 assert.ok(profile.includes('athleteAttributeCatalog'),'Horse attributes must come from the versioned definitions');
 assert.ok(profile.includes("state().scoutingState?.[route.title]"),'Scout observations must be read from the existing Office state');
 assert.ok(profile.includes('Array.isArray(report.evidence_refs)&&report.evidence_refs.length>0'),'Display only evidenced scouting/measurement values');
 assert.ok(profile.includes("'Unassessed'"),'Unknown ratings must remain unassessed');
 assert.ok(profile.includes('UNASSESSED IS NOT ZERO'),'The UI must distinguish unknown from poor');
 assert.ok(profile.includes('ng-athlete-secondary'),'Current condition, career and connections belong under athletics');
 assert.ok(profile.includes('No verified career figures attached'),'Empty careers must not create oversized fake KPI cards');
 assert.ok(css.includes('.ng-athlete-groups{'),'Four groups must be laid out together rather than as long vertical cards');
 assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'Overview groups must fit across the desktop viewport');
 assert.ok(css.includes('.ng-athlete-attribute strong.unknown'),'Unassessed traits must not receive a quality meter or fabricated color grade');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
