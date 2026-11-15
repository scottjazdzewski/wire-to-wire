import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {runInNewContext} from 'node:vm';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const html=read('public/next/index.html');
const profile=read('public/next/profile-hero-v2.mjs');
const profileCSS=css; // The one canonical design system includes profile rules.
const themes=read('public/next/identity-themes.mjs');
const audit=read('scripts/desktop-visual-audit.sh');
const standard=read('docs/design/WTW_UNIFIED_SCREEN_INTERACTION_LOCK_2026-11-13.md');
const count=(s,pattern)=>(s.match(pattern)||[]).length;

test('one shared management shell, route entry and department navigation remain authoritative',()=>{
 assert.equal(count(js,/function renderRoute\(\)/g),1,'Never build a second page renderer');
 assert.equal(count(js,/function openMenu\(section\)/g),1,'Global department navigation must be shared');
 assert.equal(count(js,/function pageTab\(name\)/g),1,'Department tab navigation must be shared');
 assert.equal(count(js,/ng-game-rail/g)>=1,true,'Persistent department rail must remain');
 assert.equal(count(js,/ng-global/g)>=1,true,'Game top bar must remain');
 assert.equal(count(js,/ng-manager-stage/g)>=1,true,'One common game stage must remain');
 assert.match(profileCSS,/#wtwNextgen > \.ng-subbar\{display:none!important/,'Redundant top horizontal department strip must stay hidden');
});

test('horse, people, track, stable and farm profiles share one renderer family',()=>{
 assert.equal(count(js,/function profileDetail\(/g),1,'No copied entity profile implementations');
 assert.equal(count(js,/function restored1999Profile\(/g),1,'All canonical records use one restored-profile adapter');
 assert.match(js,/return x\?profileDetail\(x\.route,x\.node\):null/);
 assert.match(js,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(js,/return restored1999Profile\(kind==='person'\?'person':'farm'/);
 assert.match(js,/ng-profile-intro/,'Shared identity row must stay');
 assert.match(js,/ng-profile-identity/,'Shared name and metadata area must stay');
 assert.match(js,/tabbar=\(isTrack\|\|isFarm\|\|isPerson\|\|isHorse\)\?/,
  'Horse, people, track and organization profiles must share one local navigation renderer');
 assert.match(js,/ng-person-dossierbar/,'Shared profile navigation is present');
 for(const family of ['HORSE RACING FILE','PERSONNEL DOSSIER','TRACK DOSSIER','FACILITY DOSSIER','OWNERSHIP DOSSIER']){
  assert.ok(js.includes(family),'Missing profile family category: '+family);
 }
 assert.match(js,/ng-profiletabs/,'Track and farm retain their local profile records');
 assert.match(js,/data-ng="detailtab"/,'Local sections must remain real navigation actions');
 assert.match(profile,/polishDossierContext\(root\)/,'Dossier header names must not regress to raw routes');
 assert.match(profile,/ensureHeroStage\(profile,kind,name\)/,'Track and farm use one hero stage');
 assert.match(js,/wtw-unassigned-media/,'Horse and personnel missing-image states must share a real component');
 assert.match(css,/\.wtw-unassigned-media strong/,'Missing-image monograms must use the one style authority');
 assert.ok(!js.includes('IMAGE SLOT RESERVED'),'No unfinished placeholder labels on game profiles');
});

test('the one FM/OOTP renderer owns track rosters and the same view modes across departments',()=>{
 const start=js.indexOf('const stakesTable=(limit=100)=>{');
 const stop=js.indexOf('\n const entityPhotoKind=',start);
 const track=js.slice(start,stop);
 assert.ok(start>0&&stop>start);
 assert.match(track,/ng-stakes-table/);
 assert.match(track,/data-ng="stake-sort"/);
 assert.match(track,/data-ng="1999-stake"/);
 assert.match(track,/ng-stakes-trophy/);
 assert.match(js,/function rosterDensityControls\(scope,activeMode\)/);
 assert.match(js,/rosterDensityControls\('department',departmentMode\)/);
 assert.match(js,/rosterDensityControls\(directory\?'directory':'stable',mode\)/);
 assert.match(css,/\.ng-track-workspace\{display:grid!important/);
 assert.match(js,/trackHistoryPanel\(\)/);
 assert.doesNotMatch(js,/pilotHorseConnectionsPanel|profileRecordSection|connectedTableState|ng-connected-profile/);
 assert.doesNotMatch(css,/\.ng-connected-drop|\.ng-connected-profile/);
});

test('entity colors and logos can change, but never create another navigation implementation',()=>{
 assert.match(themes,/paletteFromImageData\(/,'Entity-specific colors must come from the actual displayed logo pixels, presentation-only');
 assert.match(profile,/heroCandidate\(/,'Entity hero marks follow canonical IDs');
 assert.match(profile,/visibleAlphaBounds\(/,'Transparent master logos retain visual fitting');
 assert.match(profileCSS,/grid-template-areas:"badge identity mark" "badge tools mark"/,
  'Track/farm name, controls and logo occupy protected separate grid slots');
 assert.match(profileCSS,/ng-tier1-biography strong/,'Full identity facts remain visible');
 assert.match(profileCSS,/white-space:normal!important/,'Content must wrap instead of vanish');
 assert.match(standard,/status semantics/,'Semantically meaningful status colors must be protected');
});

test('direct Office deep links keep their requested page instead of silently showing Overview',()=>{
 assert.match(js,/const page=section==='Office'&&\/\^\(Messages\|Decisions\|Reports\|Career\)\$\/\.test\(routeName\)/);
 assert.match(js,/if\(section==='Office'&&\['Messages','Decisions'\]\.includes\(page\)\)return kind==='decision'/);
 assert.match(js,/managerRecordViewControl\(section,page\)/);
});
test('Office Career is its own source-backed career and save view, never World search',()=>{
 const start=js.indexOf('function managerCareerView(){');
 const end=js.indexOf('function managerDashboard(){',start);
 assert.ok(start>0&&end>start);
 const page=js.slice(start,end);
 assert.match(page,/const game=state\(\)/);
 assert.match(page,/gameplayService\?\.state/);
 assert.match(page,/const person=recorded/);
 assert.match(page,/const role=recorded/);
 assert.match(page,/MANAGER CAREER & OPERATION/);
 assert.match(page,/managerRecordViewControl\('Office','Career'\)/);
 assert.match(page,/data-ng="commercial-career-open"/);
 assert.match(page,/Not recorded/);
 assert.match(page,/No urgent decisions are recorded/);
 assert.match(page,/const action=messages\.filter\(m=>m\.urgent&&!m\.resolved\)/);
 assert.doesNotMatch(page,/globalSearchItems\(|fakeCareer|mockPlayer/);
 assert.match(js,/section==='Office'&&page==='Career'\)return managerCareerView\(\)/);
});
test('Office Inbox and Decisions use source cases, not a fake connected-world directory',()=>{
 const start=js.indexOf('function managerOfficeInboxView(page){');
 const stop=js.indexOf('function managerDashboard(){',start);
 assert.ok(start>0&&stop>start);
 const inbox=js.slice(start,stop);
 assert.match(inbox,/const all=currentMessages\(\)/);
 assert.match(inbox,/const actionable=all\.filter\(m=>m\.urgent&&!m\.resolved\)/);
 assert.match(inbox,/const listed=\(decisions\?actionable:all\)/);
 assert.match(inbox,/data-ng="case"/);
 assert.match(inbox,/ng-manager-message-inbox/);
 assert.match(inbox,/FRONT OFFICE/);
 assert.doesNotMatch(inbox,/data-ng="search-go"|fakeCase|exampleDecision|placeholderMessage/);
 const dashboard=js.slice(js.indexOf('function managerDashboard(){'),js.indexOf('function open1999Race(',js.indexOf('function managerDashboard(){')));
 assert.match(dashboard,/managerOfficeInboxView\(page\)/);
 assert.match(dashboard,/page==='Training'\)return liveStableTrainingView\(\)/);
});
test('Office selects source case inline and previews recorded risks before opening',()=>{
 const begin=js.indexOf('function managerOfficeInboxView(page){');
 const end=js.indexOf('/* One native Stable workflow',begin);
 const view=js.slice(begin,end);
 assert.match(view,/managerSortableColumns\(scope/);
 assert.match(view,/data-ng="office-focus"/);
 assert.match(view,/aria-pressed/);
 assert.match(view,/ng-office-file-preview/);
 assert.match(view,/desk\?\.read/);
 assert.match(view,/desk\?\.risk/);
 assert.match(view,/SOURCE-LINKED NEXT STEPS/);
 assert.match(view,/data-ng="case"/);
 assert.match(view,/data-ng="menu"/);
 assert.match(js,/if\(key==='office-focus'\)/);
 assert.doesNotMatch(view,/mockMessage|fakeCase|Math\.random/);
 assert.match(css,/ng-manager-message-inbox \.ng-manager-row\[aria-pressed="true"\]/);
});
test('Career dossier uses only current-save identity, actionable Office cases, follow-ups and approved organization mark',()=>{
 const a=js.indexOf('function managerCareerView(){');
 const b=js.indexOf('function managerDashboard(){',a);
 assert.ok(a>=0&&b>a);
 const view=js.slice(a,b);
 assert.match(view,/const game=state\(\),live=/);
 assert.match(view,/org=playerOrganization\(\)/);
 assert.match(view,/organizationLogoMarkup\(org\.id,org\.name,'stable',true,false\)/);
 assert.match(view,/messages=currentMessages\(\)/);
 assert.match(view,/const action=messages\.filter\(m=>m\.urgent&&!m\.resolved\)/);
 assert.match(view,/follow=openFollowUps\(\),due=dueActions\(\)/);
 assert.match(view,/availableCash\(\)/);
 assert.match(view,/Not recorded/);
 assert.match(view,/data-ng="case"/);
 assert.match(view,/data-ng="followup"/);
 assert.match(view,/data-ng="commercial-career-open"/);
 assert.match(view,/data-ng="organization"/);
 assert.match(view,/ng-career-priorities/);
 assert.match(view,/OFFICE UPDATES/);
 assert.match(view,/messages\.filter\(m=>!m\.urgent\|\|m\.resolved\)/);
 assert.match(view,/Manager and position not recorded/);

 assert.match(view,/ng-career-identity/);
 assert.match(view,/ng-career-facts/);
 assert.doesNotMatch(view,/Math\.random|fabricatedAchievement|fakeJobOffer/);
 assert.match(css,/#wtwNextgen \.ng-career-identity/);
 assert.match(css,/#wtwNextgen \.ng-career-facts/);
});
test('Today priority facts retain their complete recorded values for inspection',()=>{
 assert.ok(js.includes('title="${safe(f[0]+'), 'Today fact title lacks the original source');
 assert.ok(js.includes('aria-label="${safe(f[0]+'), 'Today fact aria label lacks the original source');
});
test('Stable Training opens the real simulation training desk and has a working back-to-roster action',()=>{
 const start=js.indexOf('function liveStableTrainingView(){');
 const stop=js.indexOf('function worldDirectoryHorseRows(){',start);
 const view=js.slice(start,stop);
 assert.match(view,/adapter\.horseTraining/);
 assert.match(view,/data-ng="training-set"/);
 assert.match(view,/ng-training-desk/);
 assert.match(view,/data-ng="stable-filter" data-val="all"/);
 assert.match(js,/APP\.custom==='Stable — Training'&&val==='all'/);
 assert.match(js,/openCustomView\('Stable — Overview','Stable','Overview'\)/);
});
test('zero-horse player-stable views show grounded onboarding instead of an empty void',()=>{
 const code=js.slice(js.indexOf('function stableOperationsView('),js.indexOf('function managerDashboard('));
 assert.match(code,/ng-manager-onboarding/);
 assert.match(code,/ZERO ASSIGNED HORSES/);
 assert.match(code,/data-ng="menu" data-val="Stable"/);
 assert.match(code,/data-ng="menu" data-val="World"/);
 assert.match(css,/#wtwNextgen \.ng-manager-onboarding/);
});
test('Stable Health, Race Plans and Barns show real player horses and never generic World directory records',()=>{
 const start=js.indexOf('function stableOperationsView(page){');
 const end=js.indexOf('function managerDashboard(){',start);
 assert.ok(start>0&&end>start);
 const view=js.slice(start,end);
 assert.match(view,/const rows=horseRows\(\),game=state\(\),races=racingRows\(\),cases=currentMessages\(\)/);
 assert.match(view,/liveStableHorseData\(h,races\.find\(r=>r\.name===h\.name\),game,cases\)/);
 assert.match(view,/managerRecordViewControl\('Stable',page\)/);
 assert.match(view,/managerSortableColumns\(scope/);
 assert.match(view,/data-ng="horse"/);
 assert.match(view,/Source records have not been invented/);
 assert.doesNotMatch(view,/globalSearchItems\(\)|sourceLinkedWorldDirectory|demoRecords/);
 assert.match(js,/\['Health','Race Plans','Barns'\]\.includes\(page\)\)return stableOperationsView\(page\)/);
});
test('an untouched roster filter does not falsely hide source-empty navigation',()=>{
 const helper=js.slice(js.indexOf('function departmentEmptyPanel('),js.indexOf('function departmentRoster('));
 assert.match(helper,/const criteria=window\.WTW1999RosterFilters\?\.get/);
 assert.match(helper,/criteria\.field&&String\(criteria\.query\|\|''\)\.trim\(\)/);
 assert.match(helper,/criteria\.ageMin\?\?''/);
 assert.match(helper,/criteria\.ageMax\?\?''/);
 assert.doesNotMatch(helper,/Boolean\(APP\.departmentSearch\|\|window\.WTW1999RosterFilters/);
});
test('empty department actions only use registered VIEW tabs; no fictional data',()=>{
 const helper=js.slice(js.indexOf('function departmentEmptyPanel('),js.indexOf('function departmentRoster('));
 assert.match(helper,/tabmap\[section\]/);
 assert.match(helper,/data-ng="tab"/);
 assert.match(helper,/NO VERIFIED LEDGER ROWS/);
 assert.match(helper,/NO COMMITTED ENTRIES/);
 assert.match(js,/departmentEmptyPanel\(section,page,globalIndexing\?/);
 assert.match(css,/td\.ng-rs-no-results\{height:148px!important/);
});
test('do not add page-specific CSS layers or new style patch stacks',()=>{
 const assets=[...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"/g)]
  .map(m=>m[1].split('?')[0]);
 const allowed=['/next/next.css'];
 assert.deepEqual(assets,allowed,'Unexpected stylesheet: consolidate shared rules instead of adding a fifth override');
 assert.equal(new Set(assets).size,assets.length);
 for(const asset of assets)assert.ok(existsSync(new URL('../public'+asset,import.meta.url)),asset);
 assert.ok(!/\.ng-profile-track-\d+/.test(profileCSS),'Never style individual tracks as bespoke pages');
 assert.match(standard,/one canonical management stylesheet/i,'No new CSS override layers are allowed');
});

test('a screenshot smoke test does not mean FM/OOTP visual approval',()=>{
 for(const view of ['racing-office','global-search','horse-profile','people-profile',
  'founder-owner','founder-facility','personnel','facilities','finances','breeding']){
  assert.ok(audit.includes('capture '+view+' '),'Visual route missing: '+view);
 }
 assert.match(standard,/mark \*\*REJECTED\*\*/,'Weak interfaces must be explicitly rejected');
 for(const view of ['aqueduct-track','belmont-track','gulfstream-track','kingsmere-farm','northbank-stable']){
  assert.ok(audit.includes('capture '+view+' '),'Missing cross-screen comparison screenshot: '+view);
 }
 for(const name of ['laptop-horse','laptop-person','laptop-aqueduct','laptop-belmont','laptop-farm','laptop-owner']){
  assert.ok(audit.includes('probe '+name+' '),'Missing laptop geometry check: '+name);
 }
 assert.match(audit,/UNIFIED PROFILE GEOMETRY VERIFIED/);
 assert.match(standard,/A \*\*person\*\* compares screenshots/,'Visual acceptance needs an actual reviewer');
 assert.match(standard,/No CSS patch stacks|No CSS patch stack|one canonical management stylesheet/i);
});

test('ALL registered manager VIEW routes have independent screenshot evidence or an explicit existing-route alias',()=>{
 const start=js.indexOf('const tabmap='),end=js.indexOf('\nconst actions=',start);
 assert.ok(start>=0&&end>start,'VIEW catalog was not found');
 const tabmap=runInNewContext(js.slice(start,end)+'\ntabmap;');
 const captures=[...audit.matchAll(/^capture\s+([\w-]+)\s+'([^']*)'/gm)]
  .map(match=>{
   const [_,slug,route]=match;
   const ui=route.startsWith('?')?new URLSearchParams(route.slice(1)).get('ui'):null;
   return {slug,ui,route};
  });
 const slugs=new Set(captures.map(x=>x.slug));
 assert.equal(slugs.size,captures.length,'Screenshot artifact names must be unique');
 const office={
  Overview:'racing-office',Messages:'office-messages',Decisions:'office-decisions',
  Calendar:'racing-roster',News:'office-news',Reports:'office-reports',Career:'office-career'
 };
 // Office Calendar is not a second renderer; its existing button routes
 // to the actual Racing desk. Do not invent another Office calendar page.
 assert.match(js,/if\(name==='Calendar'\)return openMenu\('Racing'\)/);
 const history={
  'Race Results':'history-vault',Horses:'history-horses',
  'People & Farms':'history-people-farms',
  'Facilities & Tracks':'history-tracks-facilities',
  'Historical Calendar':'history-calendar',Coverage:'history-coverage'
 };
 const absent=[];
 for(const [section,pages] of Object.entries(tabmap)){
  for(const page of pages){
   if(section==='Office'||section==='History'){
    const alias=(section==='Office'?office:history)[page];
    if(!alias||!slugs.has(alias))absent.push(section+' / '+page);
    continue;
   }
   const exact=section+' — '+page;
   const aliases=page==='Overview'?[section,exact]:[exact];
   if(!captures.some(x=>aliases.includes(x.ui)))absent.push(section+' / '+page);
  }
 }
 assert.deepEqual(absent,[], 'Every registered VIEW needs an actual rendered screenshot or confirmed alias');
 assert.ok(captures.length>=80,'Screenshot coverage must not drop below 80 distinct routes');
 for(const page of ['stable-horses','stable-training','office-messages','office-decisions','office-career',
  'horse-profile','people-profile','history-year-review'])
  assert.ok(slugs.has(page),'Missing critical career/profile route: '+page);
});

test('one shared readable typography scale applies across ALL management screens',()=>{
 const root=css.match(/\.ng-manager-shell\{([^}]*)\}/)?.[1];
 const laptop=css.match(/@media\(min-width:1081px\) and \(max-width:1300px\)\{\.ng-manager-shell\{([^}]*)\}/)?.[1];
 const narrow=css.match(/@media\(max-width:1080px\)\{\.ng-manager-shell\{([^}]*)\}/)?.[1];
 assert.ok(root&&laptop&&narrow,'Desktop/laptop typography variables missing');
 const value=(string,token)=>Number(string.match(new RegExp('--wtw-ui-'+token+':([\\d.]+)px'))?.[1]);
 for(const [name,vars,textMinimum,nameMinimum,metaMinimum] of [
  ['desktop',root,10.5,11,9.5],['laptop',laptop,10,10.5,9],
  ['compact',narrow,9.5,10,9]
 ]){
  assert.ok(value(vars,'list-text')>=textMinimum,name+' text is too small');
  assert.ok(value(vars,'list-name')>=nameMinimum,name+' record names are too small');
  assert.ok(value(vars,'list-meta')>=metaMinimum,name+' metadata is illegible');
 }
 assert.equal((root.match(/--wtw-ui-profile-title:/g)||[]).length,1,
  'Shared profile typography variables must not be duplicated');
 assert.match(css,/\.ng-manager-row-name strong\{font-size:var\(--wtw-ui-list-name\)/);
 assert.match(css,/\.ng-manager-row-detail\{font-size:var\(--wtw-ui-list-text\)/);
});
