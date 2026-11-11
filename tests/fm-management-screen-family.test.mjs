import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const js=fs.readFileSync(path.join(root,'public/next/next.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/next/next.css'),'utf8');
const start=js.indexOf('function managerDashboard(){');
const end=js.indexOf('function renderRoute(){',start);
assert.ok(start>0&&end>start,'Unified sports-management screen must exist in source');
const source=js.slice(start,end);
const create=new Function('APP','tabmap','globalSearchItems','currentMessages','racingRows','horseRows',
 'horseOwnership','horseOwnerBadge','cashDisplay','safe','glyph',source+'\nreturn managerDashboard();');

const records=[
 {kind:'horse',name:'Powerline',detail:'Horse Profile'},
 {kind:'person',name:'Gabe Larkin',detail:'Stable Staff'},
 {kind:'person',name:'Alistair Dunleavy',detail:'Bloodstock'},
 {kind:'farm',name:'Kingsmere',detail:'Versailles, Kentucky'},
 {kind:'track',name:'Keeneland',detail:'Lexington, KY'},
 {kind:'race',name:'Alabama Stakes',detail:'Saratoga · Graded',track:'Saratoga'},
 {kind:'decision',name:'Post-work filling',detail:'Health / Vet',caseId:'powerline'}
];
const decisions=[
 {case:'powerline',title:'Post-work filling',from:'Harrow & Pike Vet',resolved:false,urgent:true},
 {case:'buyers',title:'Sale catalog notes',from:'Sales',resolved:true,urgent:false}
];
const races=[{date:'Jul 20',name:'Powerline',track:'Keeneland',status:'TARGET'}];
const sections={Office:['Overview','Messages'],Stable:['Overview','Horses'],Racing:['Overview','Results'],Breeding:['Overview','Stallions'],Sales:['Overview','Auctions'],Personnel:['Overview','Staff','Trainers'],Facilities:['Overview','Farms'],Finances:['Overview','Budgets'],World:['Overview','Tracks']};
const render=(section,page='Overview')=>{
 const app={section,page,searchIndex:[]};
 const html=create(app,sections,()=>records,()=>decisions,()=>races,()=>[{name:'Powerline',activity:'Training'}],
 ()=>null,()=>'<span class="owner-mark">?</span>',()=>'$100,000',String,
 ()=>'<svg aria-hidden="true"></svg>');
 return {html,app};
};

test('All departments use a real shared management-game layout, never duplicated filler cards',()=>{
 for(const section of Object.keys(sections)){
  const {html,app}=render(section);
  assert.ok(html.includes('ng-manager-screen'),'Shared shell missing for '+section);
  assert.ok(html.includes('ng-manager-workspace'),'Dense 2-column workspace missing for '+section);
  assert.ok(html.includes('ng-manager-row'),'Source-backed roster is expected for '+section);
  assert.ok(html.includes('ng-manager-metric'),'Source-backed KPIs missing for '+section);
  assert.ok(html.includes('ng-manager-case'),'Relevant decisions must be available without tabs for '+section);
  assert.ok(html.includes('ng-manager-fixture'),'Calendar should show existing upcoming target for '+section);
  assert.ok(html.includes('data-ng-select="manager-screen"'),'Subrecord navigation must be a compact selector for '+section);
  assert.ok(!html.includes('is reserved for source-connected records'),'No legacy placeholder cards for '+section);
  assert.equal(app.searchIndex.length,records.length,'Navigation index must be real source registry for '+section);
 }
 assert.ok(js.includes('else {body=managerDashboard()}'),'Unimplemented department routes must use the real manager shell');
 assert.ok(js.includes("field.matches('select[data-ng-select=\"manager-screen\"]')"),'Department selector must navigate');
});

test('Management rows and actions only expose source-backed records',()=>{
 const stable=render('Stable').html;
 assert.ok(stable.includes('Powerline'),'Stable links real horse');
 assert.ok(stable.includes('Gabe Larkin'),'Stable shows actual personnel references');
 assert.ok(stable.includes('ng-manager-row-name'),'Compact roster data columns are required');
 assert.ok(stable.includes('data-ng="search-go"'),'List rows open original source routes');
 assert.ok(!stable.includes('Alabama Stakes'),'Stable directory should not miscategorize world race');
 const racing=render('Racing').html;
 assert.ok(racing.includes('Alabama Stakes')&&racing.includes('Keeneland'),'Racing includes connected races and racecourses');
 const people=render('Personnel','Staff').html;
 assert.ok(people.includes('Gabe Larkin'),'Stable Staff filters include sourced staff');
 assert.ok(!people.includes('Alistair Dunleavy'),'Staff roster excludes unrelated bloodstock role');
 const finances=render('Finances','Budgets').html;
 assert.ok(finances.includes('$100,000'),'Current source-backed cash available without tab switch');
 assert.ok(finances.includes('Post-work filling'),'Decision context stays attached without fabricated transactions');
 assert.ok(!finances.includes('Transfer budget'),'Do not invent financial figures');
});

test('Canonical CSS exposes one reusable dense sports-management component family',()=>{
 const classes=['.ng-route-manager{','.ng-manager-screen{','.ng-manager-head{','.ng-manager-metrics{',
  '.ng-manager-workspace{','.ng-manager-primary{','.ng-manager-columns{','.ng-manager-row{',
  '.ng-manager-sidebar{','.ng-manager-secondary{','.ng-manager-fixture{'];
 for(const name of classes)assert.ok(css.includes(name),'Missing shared canonical selector '+name);
 assert.ok(css.includes('grid-template-columns:minmax(0,2.1fr) minmax(265px,.9fr)'),'Roster should dominate the content area');
 assert.ok(css.includes('flex:0 0 28px'),'Source records must read like FM rows, not large cards');
 assert.ok(!css.includes('.ng-manager-custom-overrides'),'Never introduce an override stylesheet pattern');
});
