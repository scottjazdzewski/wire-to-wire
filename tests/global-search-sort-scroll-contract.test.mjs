import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const js=read('public/next/next.js');
const css=read('public/next/next.css');
const begin=js.indexOf('const searchPageSize=');
const end=js.indexOf('\nfunction searchRosterMarkup()',begin);
assert.ok(begin>0&&end>begin,'Approved global directory search must have a single data sorter');
const compiled=js.slice(begin,end);
const searchWords=query=>String(query||'').trim().toLowerCase().split(/\s+/).filter(Boolean);
const harness=app=>Function('APP','searchWords','horseOwnership',
  compiled+'\nreturn {data:searchRosterData,pageSize:searchPageSize};'
)(app,searchWords,()=>null);

const input=[
 {kind:'horse',name:'Foal Number Two',_world:{owner:'Elm Racing'}},
 {kind:'horse',name:'Foal Number Ten',_world:{owner:'Rose Stables'}},
 {kind:'person',name:'A Person'},
 {kind:'horse',name:'Foal Number Three',_world:{owner:'Maple Grove'}},
 {kind:'track',name:'Racecourse 9'},
 {kind:'horse',name:'Foal Number One'},
 {kind:'track',name:'Racecourse 11'}
];
const app=(values={})=>({searchIndex:input,searchQuery:'',searchType:'all',
 searchSort:'name',searchSortDesc:false,searchPage:0,...values});

test('Global Search toggles alphabetical, natural-number and kind sorting without changing canonical input records',()=>{
 const state=app();
 const before=JSON.stringify(state.searchIndex);
 const driver=harness(state);
 assert.equal(driver.pageSize(),60);
 assert.deepEqual(driver.data().all.map(x=>x.name),[
  'A Person','Foal Number One','Foal Number Three','Foal Number Two',
  'Foal Number Ten','Racecourse 9','Racecourse 11'
 ].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true,sensitivity:'base'})));
 state.searchSortDesc=true;
 const desc=driver.data().all;
 assert.equal(desc[0].name,'Racecourse 11');
 assert.equal(desc[1].name,'Racecourse 9');
 assert.equal(desc.at(-1).name,'A Person');
 state.searchSort='type';state.searchSortDesc=false;
 const types=driver.data().all.map(x=>x.kind);
 assert.deepEqual(types,['horse','horse','horse','horse','person','track','track']);
 state.searchSortDesc=true;
 assert.deepEqual(driver.data().all.map(x=>x.kind),['track','track','person','horse','horse','horse','horse']);
 assert.equal(JSON.stringify(state.searchIndex),before,'Sort must not mutate authoritative identity data');
});

test('Owner sorting follows the visible canonical owner and missing owners stay last in both directions',()=>{
 const state=app({searchSort:'owner'});
 const driver=harness(state);
 const asc=driver.data().all;
 assert.deepEqual(asc.slice(0,3).map(x=>x.name),[
  'Foal Number Two','Foal Number Three','Foal Number Ten'
 ]);
 assert.ok(asc.slice(3).every(x=>!x._world?.owner));
 state.searchSortDesc=true;
 const desc=driver.data().all;
 assert.deepEqual(desc.slice(0,3).map(x=>x.name),[
  'Foal Number Ten','Foal Number Three','Foal Number Two'
 ]);
 assert.ok(desc.slice(3).every(x=>!x._world?.owner));
 for(const row of asc){
  assert.equal(input[row.sourceIndex].name,row.name,'Link targets must retain original canonical source index');
 }
});

test('Search filters and scrollable paging see the entire index rather than a clipped 13-row preview',()=>{
 const rows=Array.from({length:140},(_,i)=>({
  name:'Horse '+String(i).padStart(3,'0'),kind:'horse',
  _world:{owner:i%2?'Elm Racing':'Rose Stables'}
 }));
 const state=app({searchIndex:rows,searchQuery:'Horse'});
 const driver=harness(state);
 const first=driver.data();
 assert.equal(first.count,140);
 assert.equal(first.page.length,60);
 assert.equal(first.totalPages,3);
 state.searchPage=1;
 const middle=driver.data();
 assert.equal(middle.page.length,60);
 assert.equal(middle.page[0].name,'Horse 060');
 state.searchPage=2;
 assert.equal(driver.data().page.length,20);
 state.searchQuery='Horse 01';state.searchPage=1;
 const filtered=driver.data();
 assert.equal(filtered.count,10);
 assert.equal(state.searchPage,0);
 assert.equal(filtered.page.length,10);
});

test('Global Search has a real focused scroll region and both directions of sorting in the existing UI',()=>{
 assert.match(js,/searchSortDesc:false/);
 assert.match(js,/if\(key==='search-sort'\)\{[\s\S]*?APP\.searchSortDesc=!APP\.searchSortDesc/);
 assert.match(js,/aria-pressed="\$\{APP\.searchSort===value\}"/);
 assert.match(js,/class="ng-search-sort-arrow"/);
 assert.ok(js.includes(" $('.ng-search-sort',root).forEach(btn=>{"),
  'Refreshing search sort must update every control, not call forEach on one selected element');
 assert.match(js,/id="ngSearchResults" class="ng-search-table-body" tabindex="0" role="region"/);
 assert.match(css,/\.ng-search-roster-page \.ng-search-table-body\{[^}]*overflow-y:auto!important/);
 assert.match(css,/\.ng-search-sortbar \.ng-search-sort-arrow\{/);
 assert.doesNotMatch(css,/\.ng-search-roster-page \.ng-search-table-body\{[^}]*overflow:hidden!important/);
 assert.match(js,/data-ng="search-page"/,'Paging must remain available for complete directory');
});
