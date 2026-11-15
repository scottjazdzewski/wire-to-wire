import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/next/next.js'),css=read('public/next/next.css');
const register=read('docs/design/WTW_SCREEN_BY_SCREEN_STANDARDIZATION_REGISTER_2026-11-14.md');
const product=read('docs/engineering/PRODUCT_WIDE_RELEASE_CONTRACT.md');
const tabStart=ui.indexOf('const tabmap='),tabEnd=ui.indexOf('\nconst actions=',tabStart);
assert.ok(tabStart>=0&&tabEnd>tabStart,'Current UI must retain one central complete view inventory');
const tabmap=vm.runInNewContext(ui.slice(tabStart,tabEnd)+'\ntabmap;');
const menuStart=ui.indexOf('function managementViewOptions('),menuEnd=ui.indexOf('\n/* News is',menuStart);
assert.ok(menuStart>0&&menuEnd>menuStart,'One shared view-options renderer must serve management + department screens');
const safe=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const renderer=Function('tabmap','safe',ui.slice(menuStart,menuEnd)+
 '\nreturn {options:managementViewOptions,control:managerRecordViewControl};')(tabmap,safe);

test('Every current department and its listed screens uses the same VIEW menu options in the same order',()=>{
 const expected=['Office','History','Stable','Racing','Breeding','Sales','Personnel',
  'Facilities','Tracks','Finances','World'];
 assert.deepEqual(Object.keys(tabmap),expected);
 let views=0;
 for(const [section,pages] of Object.entries(tabmap)){
  assert.ok(pages.length>=4,section+' must have its established views');
  assert.equal(pages[0],section==='History'?'Race Results':'Overview',section+' opening view must not change');
  for(const page of pages){
   const options=renderer.options(section,page),manager=renderer.control(section,page);
   assert.equal((options.match(/<option /g)||[]).length,pages.length,section+':'+page);
   assert.equal((options.match(/selected/g)||[]).length,1,'Exactly one current view: '+section+':'+page);
   assert.ok(options.includes('<option value="'+safe(page)+'" selected>'+safe(page)+'</option>'));
   assert.ok(manager.includes(options),'Management and department views must not fork: '+section);
   assert.match(manager,/<label>VIEW <select data-ng-select="manager-screen"/);
   assert.ok(manager.includes('aria-label="Choose '+section+' view"'));
   const real=pages.map(p=>'<option value="'+safe(p)+'" '+(p===page?'selected':'')+'>'+safe(p)+'</option>').join('');
   assert.equal(options,real,'Do not reorder or remove previously approved pages');
   views++;
  }
 }
 assert.ok(views>=55,'Most of the established WTW pages disappeared');
 assert.match(ui,/const viewOptions=managementViewOptions\(section,page\);/);
 assert.match(ui,/data-ng-select="department-tab"/);
});

test('Dense rosters: Stable, World Horses, Racing and every department preserve scroll, sort and filter family',()=>{
 const stable=ui.slice(ui.indexOf('function liveStableRosterView('),ui.indexOf('\nfunction functionalRoute('));
 const department=ui.slice(ui.indexOf('function departmentRoster('),ui.indexOf('\nfunction managementViewOptions('));
 assert.ok(stable.length>3000&&department.length>4000);
 for(const body of [stable,department]){
  assert.match(body,/class="ng-rs-scroll" tabindex="0" role="region"/);
  assert.match(body,/class="ng-rs-table/);
  assert.match(body,/class="ng-rs-tools"/);
  assert.match(body,/rosterDensityControls\(/);
 }
 assert.match(stable,/managerRecordViewControl\(directory\?'World':'Stable',directory\?'1999 Horses':APP\.page\|\|'Overview'\)/,
  'Stable and World Horse Directory must display the same functional VIEW dropdown');
 assert.match(css,/#wtwNextgen \.ng-rs-tools select\{[^}]*min-width:120px/,
  'Shared roster menu must fit the compact full-height table toolbar');
 assert.match(stable,/directory\?'directory-sort':'stable-sort'/);
 assert.match(department,/data-ng="dept-sort"/);
 assert.match(department,/aria-sort=/);
 assert.match(department,/data-ng-input="department-search"/);
 assert.match(department,/WTW1999RosterFilters/);
 assert.match(ui,/if\(section==='World'&&\['People','Organizations','Tracks','Meets'\]\.includes\(page\)\)return departmentRoster\('World',page\)/,
  'World directories must not fall back to generic unsortable cards');
 assert.match(department,/section==='World'&&page==='Tracks'\?DEP_COLUMNS\.Tracks/);
 assert.match(department,/section==='World'&&page==='Meets'\?DEP_COLUMNS\.Meets/);
 assert.match(ui,/if\(s==='World'&&\(name==='Tracks'\|\|name==='Meets'\)\)return openCustomView\('World — '\+name,'World',name\)/);

 assert.match(ui,/data-ng="stake-sort"/);
 assert.match(ui,/data-ng="search-sort"/);
 assert.match(ui,/if\(key==='stake-sort'\)/);
 assert.match(ui,/if\(key==='dept-sort'\)/);
 assert.match(css,/#wtwNextgen \.ng-stable-roster-v2 \.ng-rs-scroll\{[\s\S]*?overflow-y:auto!important/);
 assert.match(css,/\.ng-track-stakes \.ng-stakes-table\{[^}]*overflow-y:auto/);
});

test('Every profile keeps consistent local controls; no menu can resurrect retired overlays',()=>{
 assert.match(ui,/data-ng-select="profile-record"/);
 assert.match(ui,/MORE RECORDS/);
 assert.match(ui,/data-ng="detailtab"/);
 assert.match(ui,/aria-current=/);
 assert.match(ui,/ng-track-info-stack/);
 assert.match(ui,/if\(isTrack&&APP\.detailTab==='History'\)\{\s*left=trackHistoryFull\(\)/);
 assert.doesNotMatch(ui,/pilotHorseConnectionsPanel|profileRecordSection|connectedTableState|ng-connected-profile/);
});

test('The screen-by-screen register and universal release contract cover all departments, profiles and use cases',()=>{
 for(const section of Object.keys(tabmap))
  assert.ok(register.includes('| '+section+' —')||register.includes('| **'+section+' ')||
   register.includes('| '+section+' /')||register.includes('| '+section+' dossier')||
   register.includes('| **Track dossier**')&&section==='Tracks'||
   register.includes('| History / Archive')&&section==='History',
   'Current screen family missing from inventory: '+section);
 for(const required of ['Horse dossier','Person dossier','Farm / ownership','Global Search',
  'Save / Load / Continue','1536×864','1280×800','independently scroll','sorting',
  'SOURCE GAP','never']){
  assert.ok(register.toLowerCase().includes(required.toLowerCase()),required+' not captured');
 }
 for(const required of ['Mandatory on every applicable','dropdown','scroll','sortable',
  'dynamic','SCREEN']){ // product contract is general, not an individual page waiver
  if(required==='dynamic'||required==='SCREEN')continue;
  assert.ok(product.toLowerCase().includes(required.toLowerCase()),required);
 }
});
