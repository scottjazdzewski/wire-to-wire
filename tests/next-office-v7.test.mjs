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
 assert.ok(css.includes('UNIFIED DESKTOP MANAGEMENT DESIGN SYSTEM'),'The single rebuilt FM/OOTP design system must be deployed');
 assert.ok(css.includes('.ng-main>.ng-centerbottom{display:contents'),'Intel and decision options must be peers in the full-height command grid');
 assert.ok(css.includes('.ng-main .ng-choices{grid-column:2'),'Decision choices must occupy their own vertical command column');
 assert.ok(css.includes('@media(max-width:1279px)'),'Compact laptop layout must remain readable');
 assert.ok(css.includes('.ng-moves:has(>.ng-resolved)'),'Resolved decisions must retain the full available outcome panel');
 assert.ok(js.includes('EDITORIAL REFERENCE PHOTO'),'The existing generic photography must be identified honestly');
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
 assert.ok(css.includes('.ng-global .ng-global-continue{'),'The consolidated application chrome must preserve Continue');
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
 assert.ok(js.includes("function openOrganization(){return openCustomView('Organization Overview')}"),'Logo must open the actual operation overview with recorded browser history');
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
 assert.ok(css.includes('.ng-global .ng-global-moremenu{'),'The consolidated desktop chrome must preserve navigation and organization identity');
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
 assert.ok(profile.includes('aria-label="Open deeper profile records"'),'Horse profile detail sections remain accessible through a compact selector');
 assert.ok(profile.includes("panel('CAREER RECORD',careerBody)"),'Career summary must be visible on the main horse dossier');
 assert.ok(profile.includes("panel('KEY CONNECTIONS',connections)"),'Source-backed connections must be visible in the main horse dossier');
 assert.ok(profile.includes('connectionRows()'),'Connections use existing source-linked route actions');
 assert.ok(profile.includes("data-ng=\"sourcebutton\""),'Connections and decision links must reuse the original source route actions');
 assert.ok(profile.includes('horseAchievements'),'Achievements must come from the existing approved source panel');
 assert.ok(profile.includes("No achievements documented in the current source record."),'Missing achievements must not be invented');
 assert.ok(profile.includes("officePhotoIndex?.entities?.[entityPhotoKind+':'+route.title]"),'Entity portraits may only be shown when actually linked in the approved photo index');
 assert.ok(profile.includes('sourceDecision')&&profile.includes('sourceFollowUp'),'Source-linked related decisions and follow-ups must remain navigable');
 assert.ok(css.includes('.ng-detail-cols-horse-overview'),'Horse profile layout must remain in the canonical stylesheet');
 assert.ok(css.includes('.ng-horse-mgr-four{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))')&&css.includes('.ng-horse-mgr-five{display:grid;grid-template-columns:1fr 1fr 1fr 1.25fr 1.1fr'),'Desktop horse dossier has four rating and five operations panels');
 assert.ok(css.includes('.ng-route-profile .ng-profile-horse .ng-profile-intro{'),'Horse profile has a compact identity band');
 assert.ok(css.includes('.ng-horse-mgr-notes{')&&css.includes('.ng-horse-form-table{'),'Office notes and certified recent race form have compact tables');
 const result=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);
});


test('FM/OOTP connected profiles: people, farms, tracks, sourced graphics, clickable evidence and scrolling',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const i=js.indexOf('function profileDetail('),j=js.indexOf('function calendarTimeline(',i);
 const profile=js.slice(i,j);
 for(const type of ['Horse','People','Farm','Track']) assert.ok(profile.includes("route.kicker==='"+type+" Profile'"),type+' template must use the existing profile adapter');
 assert.ok(profile.includes("['Overview','Attributes','Reputation','Network','Stable Horses','Career','Connections','History']"),'People profile needs skill, reputation, stable and career drill-downs');
 assert.ok(profile.includes("['Overview','Connected Horses','Operations','Connections','History']"),'Farm needs connected horse and operation drill-downs');
 assert.ok(profile.includes("['Overview','Meet Schedule','Major Races','Connections','History']"),'Track profile preserves its meet and stakes navigation');
 assert.ok(profile.includes('function')===false||profile.includes('sourcePanels'),'Profile data should remain in existing source panels');
 assert.ok(profile.includes("$$('.profilePanel',source).find("),'Source panels need collection search, not a single Element.find()');
 assert.ok(profile.includes("$$('.achievementItem',horseAchievementPanel).map("),'Horse achievements must be a true collection');
 assert.ok(!profile.includes("$$$('#routeBody"),'No accidental triple-dollar source selector');
 assert.ok(profile.includes("const index=btn?$$('#routeBody [data-act]').indexOf(btn)"),'Linked entity action indexes must use the full NodeList');
 assert.ok(profile.includes("connectedHorseRows()"),'Linked person/farm horses must remain actionable');
 assert.ok(profile.includes("data-ng=\"sourcebutton\""),'Linked records and races must trigger original source handlers');
 assert.ok(profile.includes('stakesTable(5)'),'Track Overview must show a compact sourced stakes preview');
 assert.ok(profile.includes("stakesTable()"),'Track Major Races should list all available source rows');
 assert.ok(profile.includes('reputationGauge'),'Person graphics must use source reputation, not fabricated values');
 assert.ok(profile.includes('ng-detail-cols-tier1')&&profile.includes('ng-detail-cols-person'),'People, Farm and Track overviews use the shared Tier 1 desktop layout');
 assert.ok(profile.includes("officePhotoIndex?.entities?.[entityPhotoKind+':'+route.title]"),'Entity photos must use the previously approved photo-index mapping');
 assert.ok(css.includes('.ng-tier1-workspace'),'One common Tier 1 desktop layout governs connected profiles');
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
 assert.ok(profile.includes('Array.isArray(r.evidence_refs)&&r.evidence_refs.length>0'),'Display only evidenced scouting/measurement values');
 assert.ok(profile.includes("'Not yet assessed'"),'Unknown ratings must remain explicitly unassessed');
 assert.ok(profile.includes('UNASSESSED ≠ ZERO'),'The UI must distinguish unknown from poor');
 assert.ok(profile.includes('ng-horse-mgr-five'),'Current condition, career and connections are all shown directly under ratings');
 assert.ok(profile.includes('No verified career figures in this Office record.'),'Empty careers must not create fake KPI cards');
 assert.ok(css.includes('.ng-horse-mgr-four{'),'Four groups must be laid out together rather than as long vertical cards');
 assert.ok(css.includes('grid-template-columns:repeat(4,minmax(0,1fr))'),'Overview groups must fit across the desktop viewport');
 assert.ok(css.includes('.ng-horse-rating-row>strong.unknown')&&css.includes('.ng-horse-rating-unassessed'),'Unassessed traits must not receive a fabricated quality meter');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('People profiles surface skills and sourced industry reputation without conflating trust',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const source=get('public/office-v30-4.js');
 const cat=JSON.parse(get('public/assets/game/attribute-catalog.v1.json'));
 const profile=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 assert.ok(cat.reputation.schema==='WTW_PERSON_REPUTATION_V1');
 assert.ok(cat.reputation.scale.min===0&&cat.reputation.scale.max===100);
 assert.ok(cat.person_roles.stable_staff&&cat.person_roles.bloodstock_professional);
 assert.ok(cat.display.person_overview.common.includes('judgment'));
 for(const item of ['mount','training_assignment','mating','sale_consignment','purchase','hiring']){
  assert.ok(cat.reputation.effects[item],item+' must have an opportunity impact');
  assert.ok(cat.reputation.effects[item].reputation_weight<=0.30,'Reputation is meaningful but not a substitute for true competence');
 }
 assert.ok(profile.includes('const personWork=()=>'),'People should use a reusable human character model');
 assert.ok(profile.includes('ng-person-workspace'),'Overview should show useful professional skills, reputation and appointments immediately');
 assert.ok(profile.includes('<option value="')&&profile.includes('data-ng-select="profile-record"'),'All detailed Skills records remain reachable from one compact dropdown');
 assert.ok(profile.includes("APP.detailTab==='Reputation'"),'Professional reputation full evidence remains reachable from the records menu');
 assert.ok(profile.includes("work.reputation_profile"),'Office prototype may display only an explicitly supplied, sourced reputation');
 assert.ok(profile.includes("source?.schema==='WTW_PERSON_REPUTATION_V1'"),'Only game reputation schema ratings should be shown');
 assert.ok(profile.includes('Array.isArray(source.source?.refs)&&source.source.refs.length>0'),'Reputation cannot be invented without baseline provenance');
 assert.ok(profile.includes("work.attribute_observations"),'Person traits must come from saved observed evidence, not hidden ability');
 assert.ok(profile.includes("obs.evidence_refs.length>0"),'Traits require observation evidence');
 assert.ok(css.includes('.ng-person-workspace'),'Three useful information columns replace dead overview space');
 assert.ok(source.includes("Trust is an interpersonal relationship, not earned industry reputation."),'Legacy trust cannot be passed off as an industry rating');
 assert.ok(!source.includes("return {label:'Unrated',pct:50}"),'Unrated people must not have a fake 50% reputation bar');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('The Last Match user-approved birth identity stays locked and its racing age follows the game date',()=>{
 const source=get('public/office-v30-4.js');
 const ui=get('public/next/next.js');
 const record=source.match(/'The Last Match':\{([^}]+)\}/)?.[1]||'';
 assert.ok(record.includes("born:'2012-03-09'"),'Full date of birth must be March 9, 2012');
 assert.ok(record.includes("date_of_birth:'2012-03-09'"),'Canonical birth field must match');
 assert.ok(record.includes("sex:'Colt'"),'Horse is a colt in the 2014 game');
 assert.ok(record.includes("foaling_state:'Kentucky'"),'Kentucky must stay locked');
 assert.ok(record.includes("foaling_country:'United States'"),'Horse foaled in the United States');
 assert.ok(record.includes("foaling_country_code:'US'"),'Flag must identify the USA');
 assert.ok(record.includes("foaling_provenance:'USER_DIRECTED_2026-11-10'"),'Provenance must not be omitted');
 assert.ok(source.includes("const racingYear=Number(currentGameDate().slice(0,4))"),'Age must use in-game date, not today');
 assert.ok(source.includes("String(racingYear-birthYear)"),'North American racing age advances at each January 1');
 assert.equal(2014-2012,2);
 assert.ok(source.includes("month:'long',day:'numeric',year:'numeric',timeZone:'UTC'"),'DOB must be human readable');
 assert.ok(ui.includes('ng-horse-biography'),'Date, flag, sex and age should remain beside the name');
 assert.ok(ui.includes('ng-horse-bio-flag'),'Approved foaling country must display as a flag');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/office-v30-4.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Horse Profile uses real licensed country flag artwork and keeps the identity header uncluttered',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const profile=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 const codes=['us','ca','gb','gb-eng','ie','fr','ar','jp','nz','cl','de','pr','au'];
 const license=get('public/assets/flags/v1/LICENSE.flag-icons.txt');
 assert.ok(license.includes('The MIT License')&&license.includes('Copyright (c) 2013 Panayiotis Lipiridis'),'Retain source SVG flag artwork licensing');
 for(const code of codes){
  const svg=get('public/assets/flags/v1/'+code+'.svg');
  assert.ok(svg.startsWith('<svg')&&svg.includes('</svg>'),'Real SVG flag required for '+code);
  assert.ok(profile.includes("'"+code+"'"),'Profile must know valid flag '+code);
 }
 for(const country of ['united states','canada','england','great britain','ireland','france','argentina','japan','new zealand','chile','germany','puerto rico','australia']){
  assert.ok(profile.includes("'"+country+"'"),'Grounded flag name alias must exist: '+country);
 }
 assert.ok(profile.includes("'england':'gb-eng'"),'England and GB must use different approved flags');
 assert.ok(profile.includes("'/assets/flags/v1/'+horseFlagCode+'.svg'"),'Flag URL is drawn only from existing local vector assets');
 assert.ok(profile.includes('class="ng-horse-bio-flag" src='),'Foaling flag is a real image, not a text glyph that renders US');
 assert.ok(!profile.includes('String.fromCodePoint(...[...horseFoalingCode]'),'Emoji codepoints are unreliable for Windows flags');
 assert.ok(profile.includes('horseIdentityRow'),'Birth location and identity remain beside horse name');
 assert.ok(profile.includes("isHorse||isPerson||isFarm||isTrack?'':"),'Tier 1 profile headers omit duplicate state chips while lower-tier profiles preserve context');
 assert.ok(css.includes('.ng-profile-horse .ng-horse-bio-flag{'),'Flag should be consistently small and aligned with identity line');
 assert.ok(css.includes('.ng-detail-cols-horse-overview'),'Horse Overview remains desktop-first without a long scrolling page');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Tier 1 entity screens use the same compact identity bar and no-scroll Overview design',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const p=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 for(const key of ['isHorse','isPerson','isFarm','isTrack']) assert.ok(p.includes(key),'All Tier 1 entity kinds must stay in the same profile renderer');
 assert.ok(p.includes('ng-tier1-biography'),'People, Farm and Track identity details must sit beside the name, like Horse');
 for(const field of ['HOMETOWN','CURRENT BASE','LOCATION','SURFACES','CIRCUIT','OWNER','STATUS'])assert.ok(p.includes("'"+field+"'"),'Known identity field '+field+' must be accessible in the header');
 assert.ok(p.includes('ng-tier1-workspace'),'Farm and Track Overview use matching three-column workspaces');
 assert.ok(p.includes('ng-person-workspace'),'People Overview retains its attribute/reputation/career columns');
 assert.ok(p.includes("common.slice(0,Math.ceil(common.length/2))")&&p.includes("column(special,roleDisplay.toUpperCase()+' SKILLS')"),'All professional and role skills must be on-screen without changing tabs');
 assert.ok(p.includes('stakesTable(5)'),'Track shows real linked stakes without overfilling the overview');
 assert.ok(p.includes('data-val="Connected Horses"'),'Farm primary screen must link directly to its deeper horse records');
 assert.ok(p.includes('data-val="Major Races"'),'Track primary screen must link to full stakes history');
 assert.ok(p.includes('data-ng-select="profile-record"')&&p.includes("APP.detailTab==='Reputation'"),'Full sourced reputation details remain accessible through one compact record selector');
 assert.ok(css.includes('.ng-tier1-workspace')&&css.includes('.ng-tier1-biography'),'Shared Tier 1 screen layout must remain in the canonical stylesheet');
 assert.ok(css.includes('.ng-detail-cols-tier1'),'Farm/Track workspaces must have a dedicated viewport-sized body');
 assert.ok(css.includes('.ng-detail-cols-person'),'People Overview must be bounded to the viewport');
 assert.ok(css.includes('overflow:hidden!important'),'Overview panels must not become independently scrollable');
 assert.ok(css.includes('.ng-tier1-biography strong'),'Identity line must truncate instead of creating horizontal scroll');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});

test('Tier 1 Organization Overview has six purposeful panels and no duplicate header',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const org=js.slice(js.indexOf('function organizationOverview('),js.indexOf('function dueActionOverview('));
 for(const heading of ['STABLE ROSTER','RACING COMMITMENTS','OPEN DECISIONS','FOLLOW-UPS','FINANCES & OPERATIONS','MANAGEMENT DEPARTMENTS']){
  assert.ok(org.includes(heading),'Organization screen must include functional area '+heading);
 }
 assert.ok(org.includes("horses.slice(0,4)")&&org.includes("races.slice(0,4)")&&org.includes("follow.slice(0,4)"),'At-a-glance lists should be concise, with clickable drill-downs');
 assert.ok(org.includes("panel('STABLE ROSTER','ALL HORSES'"),'Full roster remains accessible');
 assert.ok(org.includes("panel('RACING COMMITMENTS','CALENDAR'"),'All commitments remain accessible');
 assert.ok(org.includes("panel('OPEN DECISIONS','ALL FILES'"),'All open cases remain accessible');
 assert.ok(org.includes("cashDisplay()"),'No invented cash appears in management dashboard');
 assert.ok(js.includes("isProfile||isOrganization?'':"),'Organization Overview must not show two competing title banners');
 assert.ok(js.includes('ng-route-organization'),'Organization Overview has its own compact desktop route');
 assert.ok(css.includes('grid-template-columns:repeat(3,minmax(0,1fr))!important'),'Six organization panels should occupy a three-column dashboard');
 assert.ok(css.includes('.ng-tier1-org .ng-org-overview-list{'),'First-tier management lists are bounded to the viewport');
 assert.ok(css.includes('overflow:hidden!important'),'Top-level screens should not need independent panel scrolling');
});

test('Tier 1 People Profile keeps only known identity facts and actions above the fold',()=>{
 const source=get('public/office-v30-4.js'),js=get('public/next/next.js'),css=get('public/next/next.css');
 const p=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 assert.ok(p.includes('const personIdentityFields=isPerson?')&&p.includes("].filter(([,value])=>knownField(value)):[];"),'Person header shows only sourced origin, age, hometown and base values and suppresses blanks');
 assert.ok(p.includes('personOriginLabel')&&p.includes('personHometown')&&p.includes('baseLabel'),'Missing values must be accurately labeled, never invented');
 assert.ok(p.includes("isPerson?'PEOPLE DIRECTORY'"),'Person header must lead to people rather than horse roster');
 assert.ok(p.includes('class="ng-person-career-strip"'),'Career and assignments need compact summary, not redundant role stats');
 assert.ok(p.includes('CURRENT HORSE ASSIGNMENTS'),"Person's actual linked horses must be visible immediately");
 assert.ok(p.includes('data-val="Stable Horses"'),'All person-to-horse connections must remain navigable');
 assert.ok(p.includes('PROFESSIONAL RATINGS')&&p.includes('REPUTATION & RELATIONSHIP TRUST')&&p.includes('HORSE ASSIGNMENTS')&&p.includes('CAREER & OPPORTUNITIES')&&p.includes('WORKING RELATIONSHIPS'),'Personnel Overview displays all five core information areas without selecting additional tabs');
 assert.ok(p.includes('source?.schema')||p.includes("source?.schema==='WTW_PERSON_REPUTATION_V1'"),'Reputation data must remain validated and attributed');
 assert.ok(p.includes('Array.isArray(source.source?.refs)&&source.source.refs.length>0'),'No fabricated reputation on the overview');
 assert.ok(css.includes('.ng-profile-person .ng-person-workspace-overview'),'Desktop People Overview must retain the five-area information-dense layout');
 assert.ok(css.includes('.ng-profile-person .ng-person-career-strip'),'Person career evidence must use a dense two-cell strip');
 assert.ok(source.includes("'Gabe Larkin':{person_id:'P-000023',job:'Stable staff'"),'Original personnel roster must not be rewritten to fill blank facts');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});


test('People header uses canonical birthplaces and recorded bases without guessing citizenship or age',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css'),source=get('public/office-v30-4.js');
 const geo=JSON.parse(get('public/data/person-geography-ui-v33.json'));
 assert.equal(geo.schema,'WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1');
 assert.equal(geo.person_count,1308);
 assert.equal(geo.birthplace_count,1308);
 assert.equal(geo.recorded_base_count,1275);
 assert.ok(geo.scope.includes('READ_ONLY_SITE_PROJECTION'),'UI geography cannot become a people master');
 const l=geo.people.find(x=>x.id==='P-000023');
 assert.equal(l.name,'Gabe Larkin');
 assert.deepEqual([l.birthplace.city,l.birthplace.region,l.birthplace.country,l.birthplace.flag_code],['Jacksonville','Florida','USA','us']);
 assert.deepEqual([l.opening_base.city,l.opening_base.region,l.opening_base.as_of],['Charles Town','West Virginia','1999']);
 assert.ok(l.birthplace.source_record_id&&l.opening_base.source_record_id);
 assert.ok(source.includes("'Gabe Larkin':{person_id:'P-000023'"),'Legacy Office person must link by canonical ID');
 assert.ok(source.includes('data-person-id='),'Person identity must flow into UI');
 assert.ok(js.includes('loadPersonGeography()'),'Person header loads approved geography');
 assert.ok(js.includes('personGeographyRecord(source,route.title)'),'Do not guess identity from a nearby track');
 assert.ok(js.includes("const personOriginLabel=knownField(personNationality)?'NATIONALITY':'BIRTH COUNTRY'"),'Birth-country flag is not nationality proof');
 assert.ok(js.includes("const baseLabel=knownField(currentBase)?'CURRENT BASE'"),'1999 base cannot pretend to be a 2014 current location');
 assert.ok(js.includes("const personAge=ageAtGameDate||factByName('Age')"),'Age requires source or date of birth');
 assert.ok(css.includes('.ng-profile-person .ng-person-national-flag{'),'Windows-compatible real flag SVG');
 assert.ok(css.includes('.ng-profile-person .ng-tier1-biography{'),'Compact mobile-friendly identity header');
 const actual=[...new Set(geo.people.map(p=>p.birthplace.country))].sort();
 const flags={USA:'us',Canada:'ca',Cuba:'cu',Panama:'pa',Venezuela:'ve',Spain:'es',Argentina:'ar',Ireland:'ie',Peru:'pe',England:'gb-eng',Chile:'cl',Colombia:'co',Austria:'at',Mexico:'mx',France:'fr',Uruguay:'uy'};
 assert.deepEqual(actual,Object.keys(flags).sort());
 for(const [country,code] of Object.entries(flags))
   assert.ok(get('public/assets/flags/v1/'+code+'.svg').startsWith('<svg'),country+' needs its SVG flag');
});

test('People Network gives ranked source-only relationships with role filters, paging and evidence',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const p=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 assert.ok(p.includes("['Overview','Attributes','Reputation','Network','Stable Horses'"),'People need a Network tab');
 assert.ok(p.includes("Array.isArray(work.relationship_reports)"),'Read known observations from current game state');
 assert.ok(p.includes("Array.isArray(x.source_refs)&&x.source_refs.length>0"),'Unknown affinity is never shown as fact');
 assert.ok(p.includes("APP.networkSort==='worst'?a.score-b.score:b.score-a.score"),'Allow good-to-bad or bad-to-good sorting');
 assert.ok(p.includes("APP.networkRole==='all'||r.role===APP.networkRole"),'Filter by role');
 assert.ok(p.includes("knownRelations.length"),'Overview previews known relationship count');
 assert.ok(p.includes('data-ng="network-select"'),'Select a row to inspect its sources');
 for(const key of ["network-sort","network-role","network-page","network-select"])assert.ok(js.includes("if(key==='"+key+"')"),key+' control must work');
 assert.ok(css.includes('.ng-network-table-row{')&&css.includes('.ng-person-network-preview'),'Consistent Network design');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});

test('Global UI navigation, role capitalization, full-site search and centered density remain operational',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css'),source=get('public/office-v30-4.js');
 assert.ok(js.includes("if(key==='back')return window.history.back()"),'Back must visit prior browser game page');
 assert.ok(js.includes("if(key==='forward')return window.history.forward()"),'Forward must revisit next browser game page');
 assert.ok(js.includes("window.history.pushState({wtwUI:view||'office'}"),'Custom screens must record navigable URL history');
 assert.ok(js.includes('restoreNextUIRoute();'),'Direct search-screen URLs must restore after reload');
 assert.ok(source.includes("q.delete('ui')"),'Native Office routes must clear stale search/department query state');
 assert.ok(js.includes("window.addEventListener('popstate',()=>{"),'Back and Forward must restore route UI state');
 assert.ok(js.includes("const route=APP.custom?null:currentRoute()"),'Custom Search cannot be hidden by an active profile');
 assert.ok(js.includes("function titleCaseUIRole("),'Professional titles must have a reusable title-case display rule');
 assert.ok(js.includes("['ROLE',titleCaseUIRole(factByName('Role'))"),'Stable Staff must be title case in People identity bars');
 assert.ok(js.includes("function globalSearchItems("),'Search must index actual game records and screen routes');
 assert.ok(js.includes("typeof window.__wtwOfficeSearchRecords==='function'"),'Search must read existing Office entities without a shadow database');
 assert.ok(source.includes('window.__wtwOfficeSearchRecords = function()'),'Office exposes real available people, horses, tracks and races for search');
 assert.ok(source.includes('window.__wtwOfficeOpenSearchRecord = function(kind,name,track)'),'Search result opens original page handler');
 for(const k of ["horse","person","farm","track","race"])assert.ok(source.includes("kind==='"+k+"'"),'Source page must be openable: '+k);
 assert.ok(js.includes('data-ng-input="global-search"'),'Search should accept user typing');
 assert.ok(js.includes("if(event.key==='Enter'&&event.target.matches('#ngGlobalSearch'))"),'Search must allow keyboard navigation');
 assert.ok(js.includes("if(key==='search-go')return openSearchItem("),'Search results need real navigation');
 assert.ok(js.includes('ng-search-table-body')&&js.includes('ng-search-row'),'Search provides compact OOTP-style roster rows, not static cards');
 assert.ok(css.includes('.ng-search-roster-page .ng-search-row{'),'Search should display legible compact rows with live filtering and paging');
 assert.ok(css.includes('.ng-search-table-head,.ng-search-row{'),'Shared compact aligned data columns must remain across roster-style screens');
 assert.ok(css.includes('.ng-main .ng-intel .ng-intelitem b{'),'Racing Office intelligence must retain readable information density');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
 const officeCheck=spawnSync(process.execPath,['--check',path.join(root,'public/office-v30-4.js')],{encoding:'utf8'});
 assert.equal(officeCheck.status,0,officeCheck.stderr);
});


test('Search Directory fits OOTP-style tabular roster with real owners, sorting and paginated record navigation',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css'),office=get('public/office-v30-4.js');
 assert.ok(js.includes("const searchPageSize=()=>"),'Page length must adapt to desktop viewport height');
 assert.ok(js.includes('ng-search-table-head'),'Search must have distinct type, name, detail, owner and action columns');
 assert.ok(js.includes('ng-search-row-name'),'Search must use condensed full-width table rows, not two-column cards');
 for(const key of ['search-type','search-sort','search-page','search-go'])assert.ok(js.includes("data-ng=\""+key+"\""),'Directory '+key+' is functional');
 assert.ok(js.includes('function updateSearchRoster()'),'Filtering and sorting must update roster without losing typing focus');
 assert.ok(js.includes('APP.searchQuery=input.value;APP.searchPage=0'),'Typing must reset page to the first matching row');
 assert.ok(js.includes('horseOwnerBadge(entry.name)'),'Each horse result needs its owner emblem');
 assert.ok(js.includes("APP.searchSort==='owner'"),'Owner can be used as sort field');
 assert.ok(css.includes('grid-template-columns:76px minmax(185px,1.2fr)'),'Desktop records have distinct aligned data columns');
 assert.ok(css.includes('.ng-route-search .ng-routeheading{display:none!important}'),'Search avoids duplicate 100px hero and dead space');
 assert.ok(css.includes('.ng-search-roster-page .ng-search-table-body{'),'Search uses viewport bounded table rather than long cards');
 assert.ok(css.includes('.ng-search-pager button:disabled'),'Pagination must not lead to phantom pages');
 assert.ok(office.includes('window.__wtwOfficeHorseOwner = function(name)'),'Owner identity sourced from original approved Office game state');
 assert.ok(office.includes("runtime.owner_name||runtime.owner||facts.owner"),'UI must not infer owner from stable or barn membership');
 assert.ok(js.includes("owner&&owner!=='—'&&owner!=='Unknown'"),'Unknown owner must remain explicitly unrecorded');
 assert.ok(js.includes("owner_name"),'Horse owner badge helper has a readable owner label');
 for(const context of ['ng-rostername','ng-entrycopy','ng-managementrow','ng-profile-identity','ng-entity-links'])
  assert.ok(js.includes(context),'Original horse context retained: '+context);
 assert.ok(js.includes('horseOwnerBadge(h.name)'),'Stable list and schedule must reuse the owner emblem');
 assert.ok(js.includes('horseOwnerBadge(route.title)'),'Horse profile name must include owner emblem');
 assert.ok(js.includes('horseOwnerBadge(label)'),'People-to-horse links must include owner emblem');
 assert.ok(css.includes('.ng-horse-owner-badge .ng-owner-unknown-mark'),'Unknown ownership gets visible neutral question mark');
 const check=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(check.status,0,check.stderr);
});


test('Search magnifier opens a working roster at desktop heights without throwing',()=>{
 const js=get('public/next/next.js');
 const begin=js.indexOf('const searchPageSize=()=>');
 const end=js.indexOf('function openSearchItem(item){',begin);
 assert.ok(begin>0&&end>begin,'Search roster render functions must be available');
 const source=js.slice(begin,end);
 assert.ok(!source.includes('searchPageSize()()'),'Never call the page-size result as a function');
 const execute=new Function('APP','window','searchWords','horseOwnership','horseOwnerBadge','globalSearchItems','safe','glyph',
  source+'\nreturn searchView();');
 const samples=[
  {kind:'horse',name:'Powerline',detail:'Horse Profile'},
  {kind:'person',name:'Gabe Larkin',detail:'Stable Staff'},
  {kind:'track',name:'Keeneland',detail:'Lexington'}
 ];
 const fakeAPP={searchIndex:[],searchQuery:'',searchType:'all',searchSort:'name',searchPage:0};
 const stubWords=value=>String(value||'').toLowerCase().trim().split(/\s+/).filter(Boolean);
 const run=height=>execute(fakeAPP,{innerHeight:height},stubWords,()=>null,
  ()=>'<span class="owner">?</span>',()=>samples,value=>String(value),()=>'<svg></svg>');
 for(const height of [700,768,900,1080]){
  const html=run(height);
  assert.ok(html.includes('ngGlobalSearch'),'Search input must actually render at '+height+'px');
  assert.ok(html.includes('ng-search-row'),'Search result rows must render at '+height+'px');
  assert.equal(fakeAPP.searchIndex.length,3,'Source record index must be populated');
 }
 fakeAPP.searchQuery='gabe';
 const filtered=run(768);
 assert.ok(filtered.includes('Gabe Larkin'),'Known person can be found by typing');
 assert.ok(!filtered.includes('data-ng="search-go" data-val="0"'),'Nonmatching horse is filtered from the roster');
 fakeAPP.searchQuery='';fakeAPP.searchType='horse';
 const horses=run(768);
 assert.ok(horses.includes('Powerline')&&!horses.includes('Gabe Larkin'),'Type filters operate on source rows');
});

test('People Overview places attributes, reputation, horses, career and relationships together',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const p=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 assert.ok(p.includes('ng-person-workspace-overview'),'Overview must use dense two-band layout');
 assert.ok(js.includes("APP.custom==='Search'||APP.custom==='Organization Overview'"),'Search and organization hide irrelevant departmental navigation');
 assert.ok(js.includes("/Profile$/.test(profileRoute.kicker)"),'Profile routes have their own relevant detail tabs without duplicate top-level subbar');

 for(const area of ['ng-person-ov-attributes','ng-person-ov-reputation','ng-person-ov-horses','ng-person-ov-career','ng-person-ov-network'])
  assert.ok(p.includes(area),'Overview must show '+area+' without switching tabs');
 assert.ok(p.includes('person.horseAssignments()'),'Connected horses, owner badges and status are visible immediately');
 assert.ok(p.includes('person.careerOverview'),'Career summary is visible immediately');
 assert.ok(p.includes('person.networkOverview'),'Observed relationships are visible immediately');
 assert.ok(p.includes('owner?.name||\'Owner not recorded\''),'Unknown ownership must not be invented');
 assert.ok(p.includes('horseOwnerBadge(label)'),'Owner badge must be visible by each connected horse');
 assert.ok(p.includes('knownRelations.slice(0,4)'),'Preview observed relationships without leaking hidden relationship state');
 assert.ok(p.includes('sourceLinks.slice(0,5)'),'Horse assignments originate from existing Office links');
 assert.ok(css.includes('grid-template-columns:repeat(12,minmax(0,1fr))!important'),'Dense desktop overview uses a 12-column grid');
 assert.ok(css.includes('ng-person-ov-horses'),'Horse assignments have dedicated visible panel');
 const parsed=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(parsed.status,0,parsed.stderr);
});


test('People FM dossier is full-information-first, limits navigation and uses natural panel heights',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const p=js.slice(js.indexOf('function profileDetail('),js.indexOf('function calendarTimeline('));
 const personNav=p.slice(p.indexOf('const tabbar=(isPerson||isHorse)?'),p.indexOf('const factsBlock='));
 assert.ok(personNav.includes('ng-person-dossierbar'),'Personnel uses one slim dossier bar, not eight visible tabs');
 assert.ok(personNav.includes('ONE-SCREEN OVERVIEW'),'No-click Overview is the default file');
 assert.ok(personNav.includes('data-val="History"'),'History remains a one-click action');
 assert.ok(personNav.includes('data-ng-select="profile-record"'),'Supplemental details are grouped under one select');
 assert.ok(personNav.includes("tabs.filter(t=>!['Overview','History'].includes(t))"),'Six secondary tabs stay behind one record selector');
 assert.ok(js.includes("field.matches('select[data-ng-select=\"profile-record\"]')"),'Record dropdown changes actual rendered page');
 assert.ok(p.includes('common.length+special.length'),'Coverage counts all canonical person traits');
 assert.ok(p.includes('ng-person-skill-columns')&&p.includes('column(first,')&&p.includes('column(second,')&&p.includes('column(special,'),'Skills presented in compact multi-column FM ratings matrix');
 assert.ok(p.includes('UNKNOWN DOES NOT MEAN ZERO'),'Unknown ratings are not fabricated');
 assert.ok(p.includes('person.horseAssignments()')&&p.includes('person.reputation()')&&p.includes('person.networkOverview')&&p.includes('person.careerOverview'),'All core personnel sections visible in the Overview');
 assert.ok(css.includes('.ng-person-dossierbar{'),'New shared dossier controls live in canonical stylesheet');
 assert.ok(css.includes('.ng-person-skill-columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr))'),'Dense ratings occupy three short columns');
 assert.ok(css.includes('grid-template-rows:max-content max-content!important'),'Content-based panel sizing replaces empty stretch rows');
 assert.ok(css.includes('height:auto!important;min-height:0!important;overflow:hidden!important;align-self:start!important'),'Cards fit actual rows instead of blank filler');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});
