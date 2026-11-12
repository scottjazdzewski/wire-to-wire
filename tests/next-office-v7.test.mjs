import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {createHash} from 'node:crypto';
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
 assert.ok(js.includes("if(key==='horse')return openEntityRecord(val,'horse')"),'Stable horse selection must open the exact canonical Horse Profile');
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
 assert.ok(js.includes('function managerSidebar(){'),'Every route needs persistent FM/OOTP manager navigation');
 assert.ok(js.includes("['Breeding','menu','Breeding'"),'Breeding is reachable without overflowing the top header');
 assert.ok(js.includes("['Personnel','menu','Personnel'")&&js.includes("['Facilities','menu','Facilities'")&&js.includes("['Finances','menu','Finances'"),'Management departments are always visible in the rail');
 assert.ok(js.includes("['History','menu','History'"),'Historical world is always reachable');
 assert.ok(css.includes('.ng-manager-rail-link.on{'),'Active department uses a consistent sidebar state');
 assert.ok(css.includes('.ng-manager-stage{display:flex;flex-direction:column'),'Desktop has an unscrolling game stage');
 assert.ok(!js.includes('<nav class="ng-primary" aria-label="Primary game navigation">'),'Old scrolling eleven-button header is replaced, not retained');
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


test('Live Stable fills its viewport with FM roster density and clearly marked fictional visual previews',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const a=js.indexOf('function liveStableRating('),b=js.indexOf('function functionalRoute(',a);
 const page=js.slice(a,b);
 assert.ok(a>0&&page.includes('const horses=horseRows(),races=racingRows(),game=state()'),
  'Live roster must derive horses, schedule, and cases from the canonical Office sources');
 assert.ok(js.includes("if(route.kicker==='Stable')return liveStableRosterView()"),
  'Active Stable route must display the FM roster instead of the old directory');
 assert.ok(page.includes('const filtered=all.filter(')&&page.includes('filtered.sort('),
  'All columns need working filters and sort');
 for(const key of ["['name','HORSE']","['age','AGE']","['sex','SEX']","['health','HEALTH']",
  "['readiness','READY']","['ability','CA']","['potential','PA']","['form','FORM']",
  "['last','LAST RACED']","['next','NEXT RACE']","['target','TARGET']","['earnings','EARNINGS']",
  "['owner','OWNER']","['trainer','TRAINER']","['breeder','BREEDER']","['record','S-W-P-S']",
  "['activity','CURRENT ACTIVITY']"]){
  assert.ok(page.includes(key),'Missing management column '+key);
 }
 for(const icon of ["treat:['✚'","watch:['!'","up:['↗'","down:['↘'"]){
  assert.ok(js.includes(icon),'Icon library missing '+icon);
 }
 assert.ok(page.includes('saved.certified_results')&&page.includes('source_refs?.length'),
  'Last-raced date must come from certified results');
 assert.ok(page.includes('liveStableRating(')&&js.includes("Array.isArray(r?.source_refs)"),
  'Current ability and potential cannot be fabricated');
 assert.ok(page.includes("data-ng=\"horse\"")||page.includes("data-ng="+"'horse'"),
  'Roster horse clicks must open real profile');
 assert.ok(!page.includes('ng-rs-bottom')&&!css.includes('#wtwNextgen .ng-rs-bottom{'),
  'Do not restore upcoming races or vet files beneath the roster');
 assert.ok(page.includes('data-ng-input="stable-search"'),'Search input must remain usable');
 assert.ok(js.includes("if(key==='stable-sort')")&&js.includes("if(key==='stable-filter')")&&js.includes("if(key==='stable-mode')"));
 assert.ok(js.includes("$$('.ng-wtw-roster-row',root)"),'Quick search should act on actual rows');
 assert.ok(css.includes('.ng-rs-table{')&&css.includes('table-layout:fixed;min-width:0;width:100%')&&css.includes('.ng-rs-scroll{display:block;flex:1 1 auto;min-height:0;overflow:hidden'),
  'All roster columns must fit one viewport without horizontal or vertical scrolling');
 assert.ok(css.includes('height:29px;max-height:29px')&&css.includes('font-size:9.5px'),
  'Use the dense row and text sizing of the reference Personnel directory');
 assert.ok(css.includes('.ng-rs-horse .ng-horse-owner-badge')&&css.includes('width:13px!important;height:11px!important'),
  'Owner crest should be approximately the size of the country flag');
 assert.ok(js.includes('WTW_STABLE_DEMO')&&js.includes('FICTIONAL DEMO VALUES')&&js.includes('if(key===\'stable-demo\')'),
  'Visual preview must be clearly fictional and toggleable without writing to the game save');
 assert.ok(css.includes('.ng-rs-signal.risk{')&&css.includes('.ng-rs-signal.warn{'),
  'Treatment and watch need separate color tokens');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});



test('Six department rosters share FM density but preserve their own management decisions',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const start=js.indexOf('const DEP_NAMES=new Set('),end=js.indexOf('function managerDashboard(){',start);
 const code=js.slice(start,end);
 for(const section of ['Racing','Breeding','Sales','Personnel','Facilities','Finances']){
  assert.ok(code.includes(section+':['),'Missing '+section+' column schema');
  assert.ok(js.includes("DEP_NAMES.has(section)"),'Generic dashboard must route approved departments to their real rosters');
  assert.ok(css.includes('data-department="'+section+'"'),'Each department must have fitted column widths');
 }
 for(const label of ['CURRENT BASE','SHIP MI','STUD FEE','BREED VAL','CONSIGNOR','SALARY','MONTHLY COST','BALANCE']){
  assert.ok(code.includes(label),'Missing decision-useful roster field '+label);
 }
 assert.ok(code.includes("function depAuctionList(")&&code.includes("(a.endDate||a.sortKey)>=gameDay"),
  'Sales must select the next chronological auction by default');
 assert.ok(code.includes('data-ng-select="department-auction"'),
  'Auction chooser must be a real selection control');
 assert.ok(code.includes('APP.departmentVisible=shown'),'Visible roster records must link to the original entities');
 assert.ok(js.includes("if(key==='dept-open')")&&js.includes('__wtwOfficeOpenSearchRecord'),
  'Clicking a horse/person/farm must open the real source-linked profile');
 assert.ok(js.includes("if(key==='dept-page')")&&js.includes("if(key==='dept-sort')"),
  'Large directories must paginate and sort without a long scrolling page');
 assert.ok(js.includes("if(key==='dept-demo')")&&code.includes('FICTIONAL PREVIEW'),
  'Demo numbers and auction examples must be clearly labeled and toggleable');
 assert.ok(!code.includes('localStorage.setItem')&&!code.includes('gameState.horseState='),
  'Department preview must never mutate the canonical game save');
 assert.ok(css.includes('#wtwNextgen .ng-rs-scroll{display:block;flex:1 1 auto;min-height:0;overflow:hidden')&&js.includes('ng-stable-roster-v2 ng-dept-roster'),
  'Departments inherit exactly the same no-scroll roster viewport from Stable');
 assert.ok(css.includes('--wtw-ui-list-text:9.5px')&&css.includes('--wtw-roster-text:var(--wtw-ui-list-text)')&&css.includes('font-size:var(--wtw-roster-text);color:#dce6d7')&&css.includes('.ng-dpt-pager'),
  'Use the same shared font tokens and navigation density across Stable and all departments');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});

test('Facilities Ownership Groups list organizations once, with the principal as owner rather than a second person row',()=>{
 const js=get('public/next/next.js');
 const start=js.indexOf('function depFacilityType('),end=js.indexOf('function depRows(',start);
 assert.ok(start>0&&end>start,'Facility roster should have one canonical organization builder');
 const directory=[
  {kind:'farm',name:'Partners Farm',detail:'OWNERSHIP ENTITY',canonicalId:'O-006036',location:'New York'},
  {kind:'farm',name:'Elm Stable',detail:'OWNERSHIP ENTITY',canonicalId:'O-2345',location:'Maryland'},
  {kind:'farm',name:'Half Crown Stud',detail:'STALLION / BREEDING OPERATION',canonicalId:'O-555',location:'Kentucky'},
  {kind:'person',name:'George Steinbrenner',detail:'PUBLIC FIGURE / HORSE OWNER',canonicalId:'P-910001'},
  {kind:'person',name:'Second Racing Principal',detail:'OWNER',canonicalId:'P-888'}
 ];
 const world={organizations:[
  {id:'O-006036',name:'Partners Farm',publicPrincipal:'George Steinbrenner'},
  {id:'O-2345',name:'Elm Stable',publicPrincipal:'Second Racing Principal'}
 ]};
 const build=new Function('globalSearchItems','state','depHash','depMoney','DEP_FACILITY_PREVIEW',
  'world1999Data','APP',js.slice(start,end)+'\nreturn depFacilityRows;');
 const app={searchIndex:null};
 const rows=build(()=>directory,()=>({}),()=>7,n=>String(n),[],world,app)('Ownership Groups',false);
 assert.equal(rows.length,2,'Two organizations, not four organization/person duplications');
 assert.deepEqual(rows.map(r=>r.name),['Partners Farm','Elm Stable']);
 assert.deepEqual(rows.map(r=>r.owner),['George Steinbrenner','Second Racing Principal']);
 assert.ok(rows.every(r=>r._kind==='farm'&&r.type==='Ownership Group'),'Ownership group entries must be organizations only');
 assert.ok(!rows.some(r=>r._kind==='person'||r.type==='Ownership Office'));
 assert.equal(app.searchIndex.length,directory.length,'Person directory remains available for Personnel and identity links');
 assert.ok(js.includes("if(section==='Personnel')"),'People should remain listed under Personnel');
});
test('Track stakes use the SHA-verified original gold, silver and bronze trophy art at 16px',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 const hashes=[
  [1,'6a2d3ff6ae7c189f797d6fa40ab980c4e8361ee8741029c3439aa91880b2f81b'],
  [2,'f52f728d52903b97e5e5aa48d5fe70dd5e099b1abbf6a919feb2ffff99387c94'],
  [3,'94c50c313bcf4824953241ff2e7d8d243391ac8a1eb34372e2563ded077c8822']
 ];
 const provenance=get('public/assets/trophies/APPROVED_SOURCE_PROVENANCE.md');
 for(const [grade,hash] of hashes){
  const png=fs.readFileSync(path.join(root,'public/assets/trophies/approved-grade-'+grade+'-64.png'));
  assert.equal(png.subarray(0,8).toString('hex'),'89504e470d0a1a0a','Original trophy crop is a PNG');
  assert.equal(png.readUInt32BE(16),64,'Each icon keeps 4x retina pixels for 16px rendering');
  assert.equal(png.readUInt32BE(20),64,'Every grade is a square icon');
  assert.equal(createHash('sha256').update(png).digest('hex'),hash,'Original art cannot drift unnoticed for G'+grade);
  assert.ok(provenance.includes(hash),'Artwork provenance remains documented for G'+grade);
 }
 for(const original of [
  '182b6a71ad86928037625550b8ac2542f85fac4f0d6f753e06696f4410f0e6ec',
  'd0b11aac0f0d75169f19c7aceeeb3e30f73e3c78d932c0ad236e1790481f5a52',
  'b6dbeed7675f8c866b5d3feddc68f3ef521c758fa814807d39da60e7fb86c2d8'
 ])assert.ok(provenance.includes(original),'Original approved source SHA must remain recorded');
 assert.ok(js.includes('src="/assets/trophies/approved-grade-'+ "'+grade+'"+'-64.png"'),
  'Actual graded stakes use the correct approved G1/G2/G3 artwork asset');
 assert.ok(!js.includes('src="/assets/trophies/grade-'+ "'+grade+'"+'.svg"'),
  'The generic substitute SVGs cannot replace approved artwork');
 assert.ok(!js.includes('class="ng-stakes-trophy g'+ "'+grade+'"),
  'The damaged historic 2048px sprite must not be reused in the stakes list');
 const marker='.ng-track-stakes .ng-stakes-trophy{';
 const at=css.indexOf(marker);assert.ok(at>0);
 const iconRule=css.slice(at+marker.length,css.indexOf('}',at));
 for(const property of ['width:16px','height:16px','object-fit:contain'])
  assert.ok(iconRule.includes(property),'Each trophy fits the existing compact track row');
 assert.ok(css.includes('width:15px!important;height:15px!important'),
  'Narrow layouts preserve the same original art at 15px');
 assert.ok(js.includes('class="ng-stakes-grade-text"'),'Grades remain readable alongside trophy artwork');
 assert.ok(js.includes("const grade=(cols[2].match(/\\bG([123])\\b/i)||[])[1]"),
  'Grade eligibility must stay source-backed');
});

test('Track history is permanently visible below meet conditions for four registered courses',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css'),office=get('public/office-v30-4.js');
 const from=office.indexOf('const trackProfiles = {');
 const end=office.indexOf('\n  };',from);
 assert.ok(from>=0&&end>from);
 const profiles=new Function('return '+office.slice(from+'const trackProfiles = '.length,end+4))();
 const expected={
  'Belmont Park':['1905','85,000','Attendance capacity','2000 reference'],
  'Churchill Downs':['1875','48,500','Seating capacity','1999'],
  'Keeneland':['1936','Unverified','1999 seating capacity','1999 not yet source-certified'],
  'Saratoga':['1864','50,000','Attendance capacity','2000 reference']
 };
 for(const [name,[year,capacity,kind,period]] of Object.entries(expected)){
  const p=profiles[name];
  assert.ok(p,'Missing historic track '+name);
  assert.equal(p.openingYear,year);
  assert.equal(p.capacity,capacity);
  assert.equal(p.capacityType,kind);
  assert.equal(p.capacityAsOf,period);
  assert.ok(p.historyBlurb.length>85&&p.historySource.startsWith('https://'));
 }
 assert.ok(office.includes('openingYear:p.openingYear')&&office.includes('capacityAsOf:p.capacityAsOf'));
 assert.ok(js.includes('const trackHistoryPanel=()=>')&&js.includes('FULL HISTORY ↗'));
 assert.ok(js.includes(String.fromCharCode(36)+'{trackHistoryPanel()}'));
 assert.ok(js.includes("else if(isTrack&&APP.detailTab==='History')")&&js.includes('left=trackHistoryFull()'));
 assert.ok(js.includes('Historical background has not yet been source-certified'));
 assert.ok(css.includes('.ng-track-info-stack{display:grid;grid-template-columns:minmax(0,1fr);grid-template-rows:minmax(0,1fr) minmax(155px,194px)'));
 assert.ok(css.includes('.ng-track-info-stack>.ng-track-history-card{'));
 assert.ok(css.includes('.ng-track-history-content{')&&css.includes('.ng-track-history-facts{'));
 assert.ok(js.includes("approved-grade-'+grade+'-64.png")&&css.includes('width:16px!important;height:16px!important'),
  'Approved G1/G2/G3 artwork must remain intact and compact');
});
test('Tracks and Facilities are separate full-width directory rosters; all pages share roster fonts',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css'),office=get('public/office-v30-4.js');
 const start=js.indexOf('const DEP_NAMES=new Set('),end=js.indexOf('function managerDashboard(){',start);
 const code=js.slice(start,end);
 assert.ok(js.includes("Tracks:['Overview','Active Meets','All Tracks','Stakes']"));
 assert.ok(js.includes("['Tracks','menu','Tracks','calendar']"),'Tracks must be a visible standalone navigation item');
 assert.ok(js.includes("if(s==='World'&&(name==='Tracks'||name==='Meets'))return openMenu('Tracks')"));
 assert.ok(code.includes("Tracks:[['name','TRACK'")&&code.includes("Meets:[['name','TRACK'"),
  'Both track directory and active meet roster need their own explicit schemas');
 assert.ok(code.includes("if(section==='Tracks')return depTrackRows(page)"),'Tracks must not fall back to the generic World screen');
 assert.ok(code.includes("if(section==='Facilities')return depFacilityRows(page,demo)"),
  'Facilities must use organizations and operations, not racecourse rows');
 assert.ok(!code.includes("[...source('farm'),...source('track')]"),'No racecourses on the Facilities roster');
 for(const label of ['Stud Farms','Training Centers','Breaking Facilities','Racing Stables','Ownership Groups']){
  assert.ok(js.includes(label),'Missing Facilities subview: '+label);
 }
 assert.ok(!code.includes("type:'Ownership Office'")&&code.includes('owner:canonical?.publicPrincipal'),
  'An ownership organization appears once and its individual principal belongs in the Owner column');
 assert.ok(code.includes("_kind:'demo-facility'"),'Fictional facility entities must remain visibly non-authoritative');
 assert.ok(js.includes('previewRecordRoute(kind,name,row)')&&js.includes('FICTIONAL DESIGN PREVIEW'),'Demo facilities must open distinct labeled previews, never forged canonical profiles');
 assert.ok(office.includes('window.__wtwOfficeTrackDirectory = function()'),
  'Track names and meet dates must come from the authoritative Office record');
 assert.ok(css.includes('--wtw-ui-list-text:9.5px')&&css.includes('--wtw-roster-text:var(--wtw-ui-list-text)')&&css.includes('--wtw-roster-head:8.3px'));
 assert.ok(css.includes('font-size:var(--wtw-roster-name)!important')&&css.includes('font-size:var(--wtw-roster-head)!important'));
 assert.ok(css.includes('data-department="Tracks"')&&css.includes('data-roster-kind="meet"'));
});
test('Racing opens on active meets and has a true cross-track My Horses mode',()=>{
 const js=get('public/next/next.js'),office=get('public/office-v30-4.js');
 const start=js.indexOf('const DEP_NAMES=new Set('),end=js.indexOf('function managerDashboard(){',start);
 const code=js.slice(start,end);
 assert.ok(code.includes("function depMeetWindows(")&&code.includes("function depCurrentMeetRows()"));
 assert.ok(code.includes("const active=wins.find(w=>w.start<=date&&date<=w.end)"),
  'Active meets must be date-driven, not a static list');
 assert.ok(code.includes("if(section==='Racing'&&page==='Overview'&&APP.racingMode!=='mine')"));
 assert.ok(code.includes("if(APP.racingTrack)return depTrackRaceRows(APP.racingTrack,demo)"),
  'Dropdown must switch to individual races at selected track');
 assert.ok(code.includes("data-ng-select=\"department-track\""),'Track selector must be an interactive control');
 assert.ok(code.includes("data-ng=\"dept-myhorses\""),'My Horses must have its own toggle');
 assert.ok(js.includes("if(key==='dept-myhorses')")&&js.includes("if(key==='dept-meets')"),'Both mode buttons need real handlers');
 assert.ok(js.includes("field.matches('select[data-ng-select=\"department-track\"]')"));
 assert.ok(code.includes("if(page!=='Results')out=out.filter(r=>r._iso&&r._iso>=depGameDay())"),
  'My Horses must exclude races already in the past');
 assert.ok(code.includes("_track:trackName")&&js.includes("window.__wtwOfficeOpenSearchRecord?.(exact.kind,name,exact.track||row?._track)"),
  'Stake rows need to open their correct race profile at the named track');
 assert.ok(office.includes('meetWindow:p.meetWindow'),'In-meet windows must remain read-only canonical facts');
});

test('Stable and every department inherit one compact title, toolbar, and roster header frame',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 assert.ok(js.includes('ng-stable-roster-v2 ng-dept-roster'),
  'All department pages must use the identical base roster frame as Stable');
 const shared=[
  ['#wtwNextgen .ng-rs-title{','height:26px;flex:0 0 26px','gap:9px;padding:0 8px'],
  ['#wtwNextgen .ng-rs-tools{','gap:5px;flex:0 0 29px','min-height:29px;padding:2px 5px'],
  ['#wtwNextgen .ng-rs-roster>header{','height:23px;flex:0 0 23px','padding:0 7px'],
  ['#wtwNextgen .ng-rs-scroll{','overflow:hidden','overscroll-behavior:none'],
  ['#wtwNextgen .ng-rs-table td{','height:29px;max-height:29px','font-size:var(--wtw-roster-text)']
 ];
 for(const [selector,...parts] of shared){
  const pos=css.indexOf(selector);assert.ok(pos>0,'Missing shared frame '+selector);
  const block=css.slice(pos,css.indexOf('}',pos)+1);
  for(const part of parts)assert.ok(block.includes(part),selector+' drifted from '+part);
 }
 // A department may provide unique controls and column widths. It may not
 // change the global title height, toolbar padding, table-header height or fonts.
 assert.ok(css.includes('#wtwNextgen .ng-dept-roster .ng-rs-tools{flex-wrap:nowrap!important}'));
 for(const old of [
  '#wtwNextgen .ng-dept-roster .ng-rs-roster>header{height:25px',
  '#wtwNextgen .ng-dept-roster .ng-rs-title{padding:0 8px}',
  '#wtwNextgen .ng-dept-roster .ng-rs-tools{flex-wrap:nowrap!important;min-height:29px',
  '#wtwNextgen .ng-dept-roster .ng-rs-scroll{overflow:hidden!important',
  '#wtwNextgen .ng-dept-roster .ng-rs-table td{font-size:var(--wtw-roster-text)',
  '#wtwNextgen .ng-dept-roster .ng-rs-table th button{font-size:var(--wtw-roster-head)'
 ])assert.ok(!css.includes(old),'Redundant department override returned: '+old);
 assert.ok(js.includes('QUICK VIEW')&&js.includes('ALL COLUMNS'),
  'Retain user-approved horse columns and compact quick-view controls');
 assert.ok(css.includes('#wtwNextgen .ng-rs-table{border-collapse:collapse;table-layout:fixed;min-width:0;width:100%'),
  'Stable table is fitted to width rather than requiring horizontal scrolling');
 assert.ok(css.includes('#wtwNextgen .ng-dept-roster[data-department="Racing"] .ng-rs-table th:nth-child(1)'),
  'Department-specific column widths remain intact');
});

test('A single type scale controls every main roster, profile and directory at all desktop breakpoints',()=>{
 const css=get('public/next/next.css'),js=get('public/next/next.js');
 const decl=selector=>{
  const pos=css.indexOf(selector+'{');
  assert.ok(pos>=0,'Missing typography selector '+selector);
  return css.slice(pos+selector.length+1,css.indexOf('}',pos));
 };
 const hasSize=(selector,size)=>{
  assert.ok(decl(selector).includes('font-size:'+size),
   selector+' does not use the canonical size '+size);
 };
 // Stable, Racing, Breeding, Sales, Personnel, Facilities, Finances & Tracks
 // must use one table, header, entity-name, status and control scale.
 for(const section of ['Stable','Racing','Breeding','Sales','Personnel','Facilities','Finances','Tracks']){
  assert.ok(section==='Stable'||js.includes('data-department='),section+' must use shared roster geometry');
 }
 const root=decl('.ng-manager-shell');
 for(const field of ['--wtw-ui-list-text:9.5px','--wtw-ui-list-name:9.5px',
  '--wtw-ui-list-meta:8.5px','--wtw-ui-profile-title:clamp(21px,1.7vw,24px)',
  '--wtw-ui-profile-label:10px','--wtw-ui-profile-value:11px',
  '--wtw-ui-profile-tab:11.5px']){
  assert.ok(root.includes(field),'Root typography token absent: '+field);
 }
 const roster=decl('#wtwNextgen .ng-stable-roster-v2');
 for(const alias of ['--wtw-roster-text:var(--wtw-ui-list-text)',
  '--wtw-roster-name:var(--wtw-ui-list-name)',
  '--wtw-roster-control:8.5px','--wtw-roster-head:8.3px']){
  assert.ok(roster.includes(alias),'Roster typography alias absent: '+alias);
 }
 const checks=[
  ['#wtwNextgen .ng-rs-table td','var(--wtw-roster-text)'],
  ['#wtwNextgen .ng-rs-table th button','var(--wtw-roster-head)!important'],
  ['#wtwNextgen .ng-rs-horse','var(--wtw-roster-name)!important'],
  ['#wtwNextgen .ng-rs-signal','var(--wtw-roster-status)'],
  ['#wtwNextgen .ng-rs-tools button','var(--wtw-roster-control)!important'],
  ['#wtwNextgen .ng-dpt-pager button','var(--wtw-roster-control)!important'],
  ['#wtwNextgen .ng-rs-title strong','var(--wtw-roster-title)'],
  ['#wtwNextgen .ng-rs-roster>header strong','var(--wtw-roster-section)'],
  ['.ng-manager-row-name strong','var(--wtw-ui-list-name)'],
  ['.ng-search-row-name','var(--wtw-ui-list-name)'],
  ['.ng-manager-row-detail','var(--wtw-ui-list-text)'],
  ['.ng-search-row-detail','var(--wtw-ui-list-text)'],
  ['.ng-manager-columns','var(--wtw-ui-list-meta)'],
  ['.ng-search-table-head','var(--wtw-ui-list-meta)']
 ];
 for(const [selector,size] of checks)hasSize(selector,size);
 assert.ok(js.includes('ng-stable-roster-v2 ng-dept-roster'),
  'Departments inherit table fonts, entity names and indicators from the shared Stable wrapper');
 // Horse, person and track profiles retain hierarchy but not conflicting values.
 for(const selector of [
  '.ng-route-profile .ng-profile-horse .ng-profile-intro h2',
  '.ng-route-profile .ng-profile-track .ng-profile-intro h2',
  '.ng-route-profile .ng-profile-view:not(.ng-profile-horse) .ng-profile-intro h2'
 ])hasSize(selector,'var(--wtw-ui-profile-title)!important');
 for(const selector of [
  '.ng-route-profile .ng-profile-horse .ng-profile-facts small',
  '.ng-tier1-card .ng-data-row>span'
 ])hasSize(selector,'var(--wtw-ui-profile-label)!important');
 for(const selector of [
  '.ng-route-profile .ng-profile-horse .ng-profile-facts strong',
  '.ng-tier1-card .ng-data-row strong',
  '.ng-person-attribute strong'
 ])hasSize(selector,'var(--wtw-ui-profile-value)'+(selector.endsWith('strong')&&selector.startsWith('.ng-person-attribute')?'':'!important'));
 for(const selector of [
  '.ng-route-profile .ng-profile-view .ng-profiletabs button',
  '.ng-route-profile .ng-profile-horse .ng-profiletabs button'
 ])hasSize(selector,'var(--wtw-ui-profile-tab)!important');
 // The responsive overrides are shared, not special font sizes per department.
 assert.ok(css.includes('--wtw-ui-list-text:8.5px;--wtw-ui-list-name:9px;--wtw-ui-list-meta:8px;grid-template-columns:159px'),
  '1280px management list scale must match the roster');
 assert.ok(css.includes('--wtw-ui-list-text:8.5px;--wtw-ui-list-name:9px;--wtw-ui-list-meta:8px;grid-template-columns:46px'),
  '1080px management list scale must match the roster');
 assert.ok(css.includes('--wtw-roster-text:8.5px;--wtw-roster-head:7.5px;--wtw-roster-name:9px;--wtw-roster-status:8px;--wtw-roster-control:7.8px'));
 assert.ok(css.includes('--wtw-roster-control:7.5px'), 'Narrow-screen toolbar control text must be shared');
 assert.ok(!css.includes('#wtwNextgen .ng-dept-roster .ng-rs-table td{font-size:9px!important'),
  'Department body text must not override Stable with a fixed 9px');
});


test('Native dropdowns stay mounted through selection and preserve one-click mouse/keyboard behavior',()=>{
 const js=get('public/next/next.js');
 const start=js.indexOf('// Keep browser-native select menus mounted');
 const end=js.indexOf('function paint(){',start);
 assert.ok(start>0&&end>start,'Native select interaction guard must exist');
 const helpers=js.slice(start,end);
 const guardStart=js.indexOf('function paint(){',end);
 const guardEnd=js.indexOf(" const oldRoute=",guardStart);
 assert.ok(guardEnd>guardStart,'Root paint guard should come before replacing innerHTML');
 const partialPaint=js.slice(guardStart,guardEnd)+'\n}\n';
 const handlers={},calls=[],select={tagName:'SELECT',isConnected:true};
 const host={contains:el=>el===select,addEventListener:(type,fn)=>{handlers[type]=fn}};
 const documentStub={activeElement:select};
 const timers=[];
 const run=new Function('root','document','setTimeout','schedulePaint','APP','loadWorld1999',
  helpers+partialPaint+
  '\nreturn {paint,beginNativeSelectInteraction,endNativeSelectInteraction,'+
  'state:()=>({active:activeNativeSelect,pending:deferredNativeSelectPaint})};');
 const demo=run(host,documentStub,callback=>{timers.push(callback)},()=>{calls.push('paint')},{ready:true},()=>{});
 assert.ok(handlers.pointerdown&&handlers.focusin&&handlers.focusout,'Pointer/focus guards must be registered');
 handlers.pointerdown({target:{closest:()=>select}});
 demo.paint();
 assert.equal(demo.state().active,select,'Opening a dropdown must acquire the interaction lock');
 assert.equal(demo.state().pending,true,'Background redraws must be deferred while dropdown is open');
 assert.equal(calls.length,0,'Redraw must not destroy native select in mid-click');
 demo.endNativeSelectInteraction(false);
 assert.equal(demo.state().active,null,'Selection commit must release the lock');
 assert.equal(demo.state().pending,false,'Commit will repaint through the normal change handler');
 handlers.focusin({target:select});
 demo.paint();
 documentStub.activeElement={tagName:'BUTTON'};
 handlers.focusout({target:select});
 timers.forEach(fn=>fn());
 assert.equal(demo.state().active,null,'Leaving a dropdown must release the lock');
 assert.equal(calls.length,1,'Deferred redraw must resume exactly once after blur');
 const click=js.slice(js.indexOf("window.addEventListener('click',e=>{"),
  js.indexOf("if(key==='organization')",js.indexOf("window.addEventListener('click',e=>{")));
 assert.ok(click.indexOf("if(e.target?.closest?.('#wtwNextgen select'))return;")>=0,
  'Native select clicks must bypass preventDefault');
 assert.ok(click.indexOf("if(e.target?.closest?.('#wtwNextgen select'))return;")<click.indexOf('e.preventDefault()'),
  'Select bypass must occur BEFORE the delegated click handler suppresses clicks');
 const change=js.slice(js.indexOf("root.addEventListener('change',event=>{"),
  js.indexOf("root.addEventListener('keydown',event=>{"));
 assert.ok(change.indexOf("endNativeSelectInteraction(false)")<change.indexOf("department-track"),
  'Dropdown must unlock before its selected value invokes page navigation');
 for(const choice of ['department-track','department-auction','department-tab','manager-screen','profile-record'])
  assert.ok(change.includes('data-ng-select="'+choice+'"'),'Missing change handler for '+choice);
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});


test('Named management entities open exact profiles or clearly marked unregistered previews',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const start=js.indexOf('/* One connection router for every management roster');
 const end=js.indexOf('function depCell(',start);
 assert.ok(start>0&&end>start,'Shared entity router should exist');
 const helper=js.slice(start,end);
 const setup=[
  'const APP={custom:"",section:"Facilities",page:"Overview",previewEntity:null,moreOpen:false,departmentDemo:true};',
  'const DEP_FACILITY_PREVIEW=[["Oak Hollow Breaking Yard","Breaking Facility","Lexington, KY"]];',
  'const calls=[];',
  'const window={__wtwOfficeSearchRecords:()=>[',
  '{kind:"horse",name:"Bellarmine"},{kind:"person",name:"Alistair Dunleavy"},',
  '{kind:"farm",name:"Kingsmere"},{kind:"track",name:"Saratoga"},',
  '{kind:"race",name:"Named Stakes",track:"Saratoga"},{kind:"race",name:"Named Stakes",track:"Keeneland"},',
  '{kind:"person",name:"Ambiguous Racing"},{kind:"farm",name:"Ambiguous Racing"}],',
  '__wtwOfficeOpenSearchRecord:(kind,name,track)=>{calls.push({kind,name,track});return true}};',
  'const safe=value=>String(value??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(String.fromCharCode(34),"&quot;");',
  'const schedulePaint=()=>{};',
  'const openCustomView=view=>{APP.custom=view};',
  'const world1999Match=()=>null; // Empty new source index in this legacy-router unit test.',
  'const openWorld1999Entity=()=>false;'
 ].join('\n');
 const make=new Function(setup+'\n'+helper+
  '\nreturn {APP,calls,entitySourceMatch,entityNotRecorded,openEntityRecord,previewRecordView,namedProfileValue};');
 const r=make();
 assert.equal(r.entitySourceMatch('Kingsmere','farm').kind,'farm');
 assert.equal(r.entitySourceMatch('Ambiguous Racing','connection'),null);
 assert.equal(r.entityNotRecorded('Private'),true);
 assert.ok(r.namedProfileValue('Sire','Bellarmine').includes('data-kind="horse"'));
 assert.ok(r.namedProfileValue('Owner','Kingsmere').includes('data-kind="connection"'));
 assert.ok(!r.namedProfileValue('Age','4').includes('data-ng='));
 for(const [name,kind] of [['Bellarmine','horse'],['Alistair Dunleavy','person'],
  ['Kingsmere','farm'],['Saratoga','track']]){
  r.openEntityRecord(name,kind);
  assert.deepEqual(r.calls.at(-1),{kind,name,track:undefined});
 }
 r.openEntityRecord('Named Stakes','race',{_track:'Keeneland'});
 assert.deepEqual(r.calls.at(-1),{kind:'race',name:'Named Stakes',track:'Keeneland'});
 const count=r.calls.length;
 r.openEntityRecord('Oak Hollow Breaking Yard','demo-facility',{
  _kind:'demo-facility',type:'Breaking Facility',location:'Lexington, KY'
 });
 assert.equal(r.calls.length,count,'Demo operations cannot masquerade as canonical facilities');
 assert.ok(r.APP.custom.includes('Oak%20Hollow%20Breaking%20Yard'));
 assert.ok(r.previewRecordView().includes('FICTIONAL DESIGN PREVIEW'));
 assert.ok(r.previewRecordView().includes('Breaking Facility'));
 r.openEntityRecord('New Trainer','person');
 assert.ok(r.previewRecordView().includes('SOURCE CONNECTION PENDING'));
 for(const fragment of [
  'data-ng="dept-related"','data-ng="dept-open"','data-ng="named-entity"',
  "if(key==='dept-related')","if(key==='named-entity')",
  "if(key==='horse')return openEntityRecord(val,'horse')",
  "else if(APP.custom.startsWith('Preview:')){body=previewRecordView()}",
  "namedProfileValue('Owner',x.owner)","namedProfileValue('Trainer',x.trainer)",
  "namedProfileValue('Breeder',x.breeder)","entityReferenceButton(x.race,'race'",
  "entityReferenceButton(x.track,'track'"
 ])assert.ok(js.includes(fragment),'Missing entity link '+fragment);
 assert.ok(!js.includes("r._kind==='demo-facility'?'<span"),
  'Fictional facility names must never be plain dead text');
 assert.ok(css.includes('.ng-entity-reference:hover')&&css.includes('.ng-entity-preview>header'));
 assert.ok(!helper.includes('localStorage.setItem'));
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});

test('1999 source registries populate the whole game world without invented identities or game-state changes',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const file='public/data/wtw-1999-world-directory-v33.json';
 const raw=get(file),d=JSON.parse(raw);
 assert.equal(d.schema,'WTW_1999_WORLD_DIRECTORY_V1');
 assert.equal(d.counts.operatingTracks,102);
 assert.equal(d.counts.historicalTracks,16);
 assert.equal(d.counts.people,154);
 assert.equal(d.counts.organizations,137);
 assert.equal(d.counts.openingHorses,267);
 assert.equal(d.counts.stallions,29);
 assert.equal(d.counts.broodmares,21);
 assert.equal(d.counts.publicFigureOwnerLinks,29);
 assert.equal(d.tracks.length,118);
 assert.equal(d.people.length,154);
 assert.equal(d.organizations.length,137);
 assert.equal(d.horses.length,317);
 assert.equal(d.tracks.filter(t=>['OPEN','OPEN_1999'].includes(t.operating)).length,102);
 assert.equal(d.tracks.filter(t=>t.operating==='CLOSED_PRE_1999').length,16);
 for(const collection of [d.tracks,d.people,d.organizations,d.horses]){
  const keys=collection.map(e=>e.id||e.key);
  assert.ok(keys.every(Boolean),'Every identity needs a canonical ID or explicit source-document display key');
  assert.equal(new Set(keys).size,keys.length,'Canonical identities cannot be duplicated');
 }
 assert.ok(d.people.some(p=>p.name==='George Steinbrenner'&&p.ownershipOperation==='Partners Farm'));
 assert.ok(d.organizations.some(o=>o.id==='O-006036'&&o.publicPrincipal==='George Steinbrenner'));
 assert.ok(d.tracks.some(t=>t.name==='Aqueduct'&&t.id==='T-0001'&&t.location.includes('New York')));
 assert.ok(d.organizations.some(o=>o.name==='Wetherby Plain'&&o.location));
 assert.ok(d.horses.some(h=>h.name==='Luna by Morning'&&h.owner==='Carson Bell Stable'&&h.trainer==='Ike Benton'));
 assert.ok(d.horses.some(h=>h.name==='May Contain Nuts'&&h.registeredInV33===false&&!h.id),
  'Breeding document names without registry IDs cannot be passed off as fully registered horses');
 assert.ok(d.horses.filter(h=>h._role==='opening').every(h=>h.id&&h.ownerId&&h.trainerId));
 const start=js.indexOf('/* Read-only 1999 world registry');
 const end=js.indexOf('function globalSearchItems(){',start);
 assert.ok(start>0&&end>start);
 const helpers=js.slice(start,end);
 const reader=new Function('data',helpers+
  '\nworld1999Data=data;return {world1999Entries,world1999Entry,world1999Key,world1999Match};')(d);
 const entries=reader.world1999Entries();
 assert.equal(entries.length,102+154+137+317);
 assert.ok(entries.every(e=>e.worldKey&&e.name),'Every visible source record needs a name and stable identity route');
 assert.equal(reader.world1999Match('person','George Steinbrenner').canonicalId,'P-910001');
 assert.equal(reader.world1999Match('farm','Partners Farm').canonicalId,'O-006036');
 assert.equal(reader.world1999Match('track','Belmont Park').canonicalId,'T-0002');
 assert.ok(reader.world1999Match('horse','Luna by Morning').canonicalId.startsWith('H-'));
 assert.ok(reader.world1999Entry('horse:DOCUMENT-BROODMARE-may-contain-nuts'));
 assert.ok(!entries.some(e=>e.kind==='track'&&e._world.operating==='CLOSED_PRE_1999'),
  'Closed historical tracks cannot appear as operating in 1999');
 for(const text of [
  "if(section==='World'&&['1999 Horses','People','Organizations'].includes(page))",
  "if(['Stallions','Broodmares'].includes(page)&&world1999Data)",
  "section==='World'?(page==='1999 Horses'?WORLD_1999_COLUMNS.Horses",
  "if(section==='World'&&['1999 Horses','People','Organizations'].includes(page))return departmentRoster('World',page)",
  "if(r._worldKey)return openWorld1999Entity(r._worldKey)",
  "if(key==='world-open')return openWorld1999Entity(val)",
  "else if(APP.custom.startsWith('WorldRecord:')){body=world1999Profile()}",
  "loadWorld1999();",
  "status:t._source1999?'OPEN · MEET NOT RECORDED':meet.status",
  "base:r.location||saved.base||''",
  "_ownerId:h.ownerId||''","_trainerId:h.trainerId||''","_trackId:h.trackId||''",
  "v=world1999Linked(k,r['_'+key+'Id'],r[key])",
  "v=world1999Linked('farm',r._operationId,r.operation)",
  "v=world1999Linked('person',r._principalId,r.principal)"
 ])assert.ok(js.includes(text),'Missing 1999 directory route: '+text);
 assert.ok(css.includes('ng-world-source-profile')&&css.includes('data-page="1999 Horses"'));
 assert.ok(!helpers.includes('localStorage.setItem'),'The 1999 world projection must never change the canonical save');
 assert.ok(!raw.includes('futureWinner')&&!raw.includes('post1999Result'),'Do not publish imaginary future racing results');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});

test('Sales workspace provides next/previous auction navigation, exact-date warnings and real session watchlist',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const start=js.indexOf('// UI-only lot watchlist.');
 const end=js.indexOf('function depAuctionList(',start);
 assert.ok(start>0&&end>start,'Sales UI helpers are present');
 const helpers=js.slice(start,end);
 const APP={salesWatched:{},departmentDemo:true},houses={
  keeneland:{name:'Keeneland'},barretts:{name:'Barretts'},
  wtba:{name:'WTBA'},obs:{name:'OBS'},fasigtipton:{name:'Fasig-Tipton'},canadian:{name:'Canadian Breeders'}
 };
 const make=new Function('APP','DEP_SALE_HOUSES','depGameDay','safe','depSaleDateLabel',helpers+
  '\nreturn {salesWatchKey,salesUpcomingIndex,salesDesk};');
 const ui=make(APP,houses,()=> '1999-07-01',v=>String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;'),
  a=>a.confirmedDate?'10/18/99 – 10/19/99':'October 1999 · usual month, exact date unverified');
 const auctions=[
  {id:'jun',name:'June Mixed',company:'Keeneland',city:'Lexington, KY',category:'Mixed',sortKey:'1999-06-01',
   endDate:'1999-06-02',confirmedDate:true},
  {id:'bar',name:'Fall Sale of Yearlings and Horses of All Ages',company:'Barretts',city:'Pomona, CA',
   category:'Mixed',sortKey:'1999-10-18',endDate:'1999-10-19',confirmedDate:true},
  {id:'unverified',name:'Winter Sale',company:'WTBA',city:'Auburn, WA',
   category:'Mixed',sortKey:'1999-12-01',endDate:'',confirmedDate:false}
 ];
 assert.equal(ui.salesUpcomingIndex(auctions),'1'*1,'After June, Barretts must be the next future auction');
 assert.equal(ui.salesWatchKey('bar','100','Horse A'),'bar|100');
 assert.notEqual(ui.salesWatchKey('bar','100','Horse A'),ui.salesWatchKey('unverified','100','Horse A'),
  'Identical hips from different auction houses need unique watchlist identities');
 const current=ui.salesDesk('Overview',auctions[1],auctions,3);
 assert.ok(current.includes('AUCTION DESK / Barretts'));
 assert.ok(current.includes('Fall Sale of Yearlings and Horses of All Ages'));
 assert.ok(current.includes('VERIFIED DATE')&&current.includes('10/18/99'));
 assert.ok(current.includes('Pomona, CA · Mixed'));
 assert.ok(current.includes('data-ng="sale-prev"')&&current.includes('data-ng="sale-next"'));
 assert.ok(current.includes('data-ng="sale-watchlist"')&&current.includes('data-ng="sale-catalog"'));
 const unknown=ui.salesDesk('Catalogs',auctions[2],auctions,0);
 assert.ok(unknown.includes('USUAL MONTH')&&unknown.includes('exact date unverified'),
  'A projected sale must never display as a date-confirmed auction');
 assert.ok(unknown.includes('disabled'), 'Last auction should disable the Next arrow');
 APP.salesWatched['bar|100']={hip:'100',horse:'Horse A',auction:'Fall Sale',_auctionId:'bar'};
 APP.salesWatched['unverified|200']={hip:'200',horse:'Horse B',auction:'Winter Sale',_auctionId:'unverified'};
 const watched=ui.salesDesk('Watchlist',null,auctions,2);
 assert.ok(watched.includes('WATCHED LOTS')&&watched.includes('>2</b>'));
 assert.ok(watched.includes('Session only · no bids or transactions'));
 const company=ui.salesDesk('Sale Companies',null,auctions,6);
 assert.ok(company.includes('>6</b>')&&company.includes('data-ng="sale-next-up"'));
 for(const action of ['sale-watch','sale-open-watch','sale-prev','sale-next','sale-next-up',
   'sale-catalog','sale-overview','sale-calendar','sale-company-list','sale-watchlist']){
  assert.ok(js.includes("key==='"+action+"'")||js.includes("'"+action+"'"),'Missing handler for '+action);
 }
 const selected=js.slice(js.indexOf('function departmentRoster('),js.indexOf('function managerDashboard('));
 assert.ok(selected.includes("page==='Watchlist'?DEP_COLUMNS.SalesWatchlist"),
  'Watchlist needs an auction-oriented column layout');
 assert.ok(selected.includes('aria-pressed=')&&selected.includes('data-ng="sale-watch"'),
  'A hip must have an accessible watch/unwatch button');
 assert.ok(selected.includes("data-ng=\"sale-open-watch\""),
  'Watchlist auction names must return to their own selected catalog');
 assert.ok(selected.includes('salesDeskView+'),'Sales ribbon should be visible above the table');
 assert.ok(selected.includes('No watched lots yet.')&&selected.includes('No recorded private offers.'),
  'Empty state must not invent bids or negotiations');
 assert.ok(js.includes("if(page==='Watchlist')return Object.values(APP.salesWatched||{})"),
  'Watched lots must span auctions rather than being a fabricated every-other-row subset');
 assert.ok(js.includes("if(page==='Private Offers')out=out.filter(r=>!demo&&/offer/i.test(r.status))"),
  'Fictional offers cannot masquerade as actual negotiations');
 assert.ok(css.includes('ng-sales-desk-actions button')&&css.includes('ng-sales-hip>button'));
 assert.ok(css.includes('data-page="Watchlist"')&&css.includes('font-size:var(--wtw-roster-text)'),
  'Watchlist columns and font must use the approved FM type scale');
 assert.ok(js.includes("salesHeader=section==='Sales'?43:0"),
  'Sales must reduce its visible row count to reserve the auction desk height, avoiding clipped rows');
 assert.ok(!helpers.includes('localStorage.setItem'),'UI-only watchlist must not alter canonical saves');
 const syntax=spawnSync(process.execPath,['--check',path.join(root,'public/next/next.js')],{encoding:'utf8'});
 assert.equal(syntax.status,0,syntax.stderr);
});

test('Sales dropdown names the operator and uses verified historical dates with month-only fallback',()=>{
 const js=get('public/next/next.js'),css=get('public/next/next.css');
 const start=js.indexOf('const DEP_SALE_HOUSES=');
 const end=js.indexOf('function depHash(',start);
 const fstart=js.indexOf('function depSaleLabel('),fend=js.indexOf('/* One connection router',fstart);
 assert.ok(start>0&&end>start&&fstart>0&&fend>fstart);
 const source=js.slice(start,end)+'\n'+js.slice(fstart,fend);
 const mk=(today,auctions=[])=>new Function('depGameDay','stableShortDate','state','liveStableDate',
  source+'\nreturn {DEP_SALE_HOUSES,DEP_SALE_EVENTS_1999,DEP_SALE_EVENTS_2014,DEP_SALE_SEASONAL,depAuctionList,depSaleLabel,depSaleDateLabel,depSeasonalSales};')(
  ()=>today,s=>String(s||'').replace(/(\d{4})-(\d{2})-(\d{2})/,(_,y,m,d)=>Number(m)+'/'+Number(d)+'/'+y.slice(2)),
  ()=>({salesState:{auctions}}),
  s=>/^\d{4}-\d{2}-\d{2}$/.test(s||'')?s:'');
 const m=mk('2014-07-15');
 assert.deepEqual(Object.keys(m.DEP_SALE_HOUSES).sort(),
  ['barretts','canadian','fasigtipton','keeneland','obs','wtba']);
 const list=m.depAuctionList(true);
 assert.ok(list.length>=24,'2014 must contain the historical major-house sale calendar');
 assert.ok(list.every((a,i)=>i===0||list[i-1].sortKey<=a.sortKey),
  'Sale dropdown must be sorted by the in-game calendar');
 const sept=list.find(a=>a.date==='2014-09-08'&&a.company==='Keeneland');
 assert.equal(m.depSaleLabel(sept),'September Yearling Sale - Keeneland');
 assert.equal(sept.endDate,'2014-09-21');
 const obs=list.find(a=>a.date==='2014-08-26'&&a.company==='OBS');
 assert.equal(m.depSaleLabel(obs),'August Yearling Sale - OBS');
 assert.ok(list.some(a=>a.company==='Fasig-Tipton'&&a.date==='2014-08-04'&&a.name==='The Saratoga Sale'));
 assert.ok(list.some(a=>a.company==='Barretts'&&a.date==='2014-11-08'));
 const next=list.find(a=>(a.endDate||a.sortKey)>='2014-07-15');
 assert.equal(m.depSaleLabel(next),'The Saratoga Sale - Fasig-Tipton',
  'Next upcoming auction must be the earliest future sale, not invented July or August placeholders');
 const in1999=mk('1999-01-01').depAuctionList(true);
 const only1999=in1999.filter(a=>a.sortKey.startsWith('1999'));
 const confirmed1999=in1999.filter(a=>a.confirmedDate);
 assert.equal(confirmed1999.length,5,'Retain five source-confirmed regional sales in 1999');
 assert.ok(in1999.every((a,i)=>!i||in1999[i-1].sortKey<=a.sortKey),'1999 calendar must sort chronologically');
 const barretts=in1999.find(a=>a.name==='Fall Sale of Yearlings and Horses of All Ages'&&a.company==='Barretts'&&a.confirmedDate);
 assert.ok(barretts,'Barretts 1999 fall sale must not disappear');
 assert.equal(barretts.date,'1999-10-18');
 assert.equal(barretts.endDate,'1999-10-19');
 assert.equal(barretts.city,'Pomona, CA');
 assert.equal(m.depSaleLabel(barretts),'Fall Sale of Yearlings and Horses of All Ages - Barretts');
 const wtba=in1999.filter(a=>a.companyId==='wtba'&&a.confirmedDate);
 assert.deepEqual(wtba.map(a=>a.date),['1999-09-07','1999-12-05']);
 const canada=in1999.find(a=>a.companyId==='canadian'&&a.confirmedDate);
 assert.equal(canada.date,'1999-09-07');
 const texas=in1999.find(a=>a.companyId==='fasigtipton'&&a.name==='Texas Summer Yearling Sale'&&a.confirmedDate);
 assert.equal(texas.date,'1999-08-30');
 assert.equal(texas.endDate,'1999-08-31');
 assert.ok(in1999.some(a=>a.companyId==='barretts'&&a.name.includes('March')&&!a.confirmedDate),
  'Historical sale types without a verified day must remain month-only');
 assert.ok(!only1999.some(a=>a.companyId==='canadian'&&a.name==='Selected Yearling Sale'&&!a.confirmedDate),
  'Exactly-dated 1999 Canadian sale should not be duplicated by its usual-month placeholder');
 assert.ok(!only1999.some(a=>a.companyId==='wtba'&&!a.confirmedDate),
  'Verified 1999 WTBA dates replace seasonal placeholders');
 const regional2014=list.filter(a=>a.sortKey.startsWith('2014')&&['wtba','canadian'].includes(a.companyId));
 assert.ok(regional2014.length>=3,'Regional operators should remain visible on the 2014 calendar');
 assert.ok(regional2014.every(a=>!a.confirmedDate&&a.dateLabel.includes('exact date unverified')),
  'Never label a regional 2014 fixture as an exact verified historical date');
 const future=mk('2015-08-10').depAuctionList(true);
 const month=future.find(a=>a.name==='September Yearling Sale'&&a.sortKey.startsWith('2015'));
 assert.ok(month&&!month.confirmedDate&&!month.date);
 assert.ok(month.dateLabel.includes('exact date unverified'));
 assert.ok(!future.some(a=>a.name==='April Two-Year-Olds in Training Sale'&&a.company==='Keeneland'),
  'Discontinued Keeneland April 2YO event should not be projected beyond 2014');
 assert.ok(!future.some(a=>a.name==='August Yearling Sale'&&a.company==='OBS'),
  'OBS August yearling fixture must not be copied into the modern October calendar');
 const saved=mk('2014-07-15',[{id:'real1',name:'September Yearling Sale',date:'2014-09-08',location:'Lexington, KY',lots:[]}]);
 const real=saved.depAuctionList(false);
 assert.equal(real.length,1);
 assert.equal(real[0].company,'Keeneland','Exact known sale names can be matched to the verified company registry');
 const unknown=mk('2014-07-15',[{id:'real2',name:'Regional Partnership Sale',date:'2014-08-01',lots:[]}]);
 assert.equal(unknown.depAuctionList(false)[0].company,'Company not recorded','Do not invent company for unknown live sales');
 assert.ok(js.includes('data-ng-select="department-auction"'));
 assert.ok(js.includes('safe(depSaleLabel(a))'),'Dropdown must show Sale Name - Company');
 assert.ok(js.includes("section==='Sales'?(page==='Watchlist'")&&
  js.includes("page==='Sale Calendar'?'CHRONOLOGICAL SALES"),
  'Sales purpose title must support Watchlist and chronological sale calendar without hiding either view');
 assert.ok(js.includes("if(APP.section==='Sales'&&r._kind==='sale-event')"));
 assert.ok(js.includes("if(APP.section==='Sales'&&r._kind==='sale-company')"));
 assert.ok(js.includes("field.matches('select[data-ng-select=\"department-sales-company\"]')"));
 assert.ok(js.includes("if(key==='dept-company')"));
 assert.ok(js.includes('data-page="'));
 assert.ok(css.includes('data-page="Sale Calendar"')&&css.includes('data-page="Sale Companies"'),
  'Sale calendar and sale house directories must fit the locked roster widths');
 assert.ok(!source.includes('localStorage.setItem'),'Schedule lookup cannot persist the preview into game records');
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
 assert.ok(js.includes("isProfile||isOrganization||isManager?'':"),'Organization Overview must not show two competing title banners');
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
