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

test('Stable is a full-height source-backed horse-management dossier rather than four stretched cards',()=>{
 const js=get('public/manager/manager.js'),css=get('public/manager/manager.css');
 assert.ok(js.includes('mg-stable-horse-card')&&js.includes('mg-stable-horse-list'),
  'Each horse has a compact full-height stable dossier');
 assert.ok(js.includes('NEXT TARGET')&&js.includes('OWNER')&&js.includes('VIEW PROFILE'),
  'Every dossier must expose identity, owner, actual target and direct profile');
 assert.ok(js.includes("exact?$('p',exact)?.textContent.trim():''"),
  'Do not borrow a different horse\'s race target from an unrelated fixture');
 assert.ok(js.includes('FULL PERSONNEL DIRECTORY ›'),
  'Personnel panel retains source-backed deeper navigation');
 assert.ok(css.includes('.mg-operations-grid.mg-stable-command{')&&
  css.includes('.mg-stable-horse-card{')&&css.includes('.mg-stable-horse-list{'),
  'Stable uses a full-height grid and real integrated horse rows, not blank panels');
 assert.ok(!css.includes('max-height:220px}'),
  'Do not restore the old three-row personnel stretch workaround');
});

test('Approved images resolve by immutable entity ID or exact name, never fabricate portraits or logos',()=>{
 const js=get('public/manager/manager.js'),css=get('public/manager/manager.css');
 const photos=JSON.parse(get('public/assets/office/decision-photo-index.json'));
 const logos=JSON.parse(get('public/assets/office/organization-logo-index.json'));
 assert.ok(photos.entities&&typeof photos.entities==='object');
 assert.ok(logos.organizations&&typeof logos.organizations==='object');
 assert.ok(js.includes('function entityPhoto(kind,name)'),'Shared photo resolution function required');
 assert.ok(js.includes('id?kind+\':\'+id:null,kind+\':\'+name'),'Canonical ID takes precedence over ambiguous display name');
 assert.ok(js.includes('ui.photos?.entities'),'Must use existing read-only image index');
 assert.ok(js.includes('ui.logos?.organizations?.[v]'),'Owner badges must resolve approved organization crests');
 assert.ok(js.includes('data-visual-source'),'Photograph vs shield provenance must be visible in DOM');
 assert.ok(css.includes('.mg-portrait.fallback img{')&&css.includes('.mg-portrait.photo img{'));
 assert.ok(!js.includes('fetch(\'https://'),'No arbitrary image providers or third-party portraits');
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

test('Manager profiles and Search use authoritative read-only geography projections',()=>{
 const js=get('public/manager/manager.js');
 const cssHasTrackSelected=()=>get('public/manager/manager.css').includes('.mg-track-layout .mg-track-selected td{');
 const people=JSON.parse(get('public/data/person-geography-ui-v33.json'));
 const courses=JSON.parse(get('public/data/track-geography-v33.json'));
 assert.equal(people.schema,'WTW_UI_PERSON_GEOGRAPHY_PROJECTION_V1');
 assert.ok(people.people.length>=1000,'Canonical people projection should remain populated');
 assert.ok(courses.tracks.length>=100,'Canonical track projection should remain populated');
 const gabe=people.people.find(x=>x.id==='P-000023');
 assert.equal(gabe?.name,'Gabe Larkin');
 assert.equal(gabe.birthplace.city,'Jacksonville');
 assert.equal(gabe.opening_base.city,'Charles Town');
 assert.ok(js.includes("fetch('/data/person-geography-ui-v33.json')"));
 assert.ok(js.includes("fetch('/data/track-geography-v33.json')"));
 assert.ok(js.includes('function geographicPerson(name)'));
 assert.ok(js.includes('function geographicTrack(name)'));
 assert.ok(js.includes("kind==='track'&&geographicTrack(name)"),'Unlinked historical tracks must still open read-only profiles');
 assert.ok(js.includes('const registry=world.slice().sort('),'Racecourse profile without Office stakes must show useful full world register');
 assert.ok(js.includes('registryBody;'),'No giant empty stakes panel on geography-only track dossiers');
 assert.ok(cssHasTrackSelected(),'Selected current course visibly stands out in the register');
 assert.ok(js.includes('1999 BASE'),'Do not present an opening historical base as the current physical operating base');
 assert.ok(!js.includes('localStorage.setItem'),'Read-only snapshots must not write the source of truth');
});

test('One shared FM/OOTP management style governs every route and all roster tables sort in place',()=>{
 const js=get('public/manager/manager.js'),css=get('public/manager/manager.css');
 assert.ok(css.includes('--bg:#0b1118;--stage:#101722'),'All screens use the same neutral slate base');
 assert.ok(css.includes('.mg-section>header{')&&css.includes('background:#202b32'),
  'All management panels share restrained dark headers, not large solid-green bars');
 assert.ok(css.includes('.mg-table th[data-mg-sort-col]{'),
  'Shared sortable table headings have accessible hover and keyboard affordances');
 assert.ok(js.includes('function sortRosterColumn(header)'),'All roster tables use one sorter');
 assert.ok(js.includes("root.addEventListener('keydown',event=>"),'Keyboard users can activate table sorting');
 assert.ok(js.includes("tbody.append(...rows.map(x=>x.row))"),'Sorting only rearranges the visible DOM, not canonical records');
 assert.ok(js.includes("aria-sort"),'Table headers report sort direction');
 assert.ok(!js.includes('localStorage.setItem'),'Presentation-only sorting cannot change saved model data');
});
