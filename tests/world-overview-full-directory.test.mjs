import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const a=ui.indexOf('function worldCompleteDirectoryView(){');
const b=ui.indexOf('\nfunction managerDashboard(){',a);
assert.ok(a>0&&b>a,'Missing canonical full World manager directory');
const source=ui.slice(a,b);
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({
 '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
})[c]);
const base=Array.from({length:145},(_,i)=>({
 kind:'horse',name:'Horse '+String(i).padStart(3,'0'),
 canonicalId:'H-'+String(i).padStart(4,'0'),
 worldKey:'horse:H-'+String(i).padStart(4,'0'),
 detail:'BROODMARE',location:'Kentucky',_world:{
  id:'H-'+String(i).padStart(4,'0'),
  name:'Horse '+String(i).padStart(3,'0'),sireId:'H-SIRE-1',
  ancestryNote:i===88?'Special bluegrass pedigree':'source identity'
 }
}));
const person={kind:'person',name:'Trainer ABC',canonicalId:'P-001',
 worldKey:'person:P-001',detail:'TRAINER',location:'Lexington',
 _world:{id:'P-001',name:'Trainer ABC',dateOfBirth:'1961-03-22',
  birthplace:{city:'Kyoto',countryCode:'JP'}}};
const malicious={kind:'farm',name:'<script>bad()</script>',
 canonicalId:'F-001',worldKey:'farm:F-001',detail:'STUD FARM',
 _world:{id:'F-001',name:'<script>bad()</script>'}};
const game={
 organizations:[{id:'O-1',name:'Owner One'}],
 historicalHorses:[{id:'HX-1',name:'Archival Horse'}]
};
function build(app,world=base.concat([person,malicious])){
 const sort=(scope,rows)=>{
  const sign=app.managerSortDesc?-1:1;
  return [...rows].sort((a,b)=>sign*String(a[app.managerSortKey]??'')
   .localeCompare(String(b[app.managerSortKey]??''),undefined,{numeric:true}));
 };
 return new Function('APP','world1999Entries','world1999Data',
  'managerSortRecords','managerSortableColumns','managerRecordViewControl',
  'safe','glyph','searchWords','world1999Loading','world1999LoadFailed',
  source+'\nreturn worldCompleteDirectoryView;')(
   app,()=>world,game,sort,
   (scope,cols)=>'<div class="ng-manager-columns">'+cols.map(x=>x[0]).join(' ')+'</div>',
   ()=>'VIEW <select data-ng-select="manager-screen"></select>',
   escape,()=>'<svg></svg>',
   text=>String(text||'').toLowerCase().split(/[^a-z0-9]+/).filter(Boolean),
   false,false);
}
const app=()=>({
 worldDirectorySearch:'',worldDirectoryType:'all',worldDirectoryPage:0,
 managerSortScope:'',managerSortKey:'',managerSortDesc:false,worldEditStatus:''
});

test('World source directory has full searchable index, no 20-per-type truncation, and bounded page DOM',()=>{
 const state=app(),html=build(state)();
 assert.match(html,/ng-manager-screen ng-world-complete/);
 assert.match(html,/data-ng-input="world-directory-search"/);
 assert.match(html,/data-ng="world-export"/);
 assert.match(html,/data-ng="world-import-open"/);
 assert.match(html,/id="wtwWorldImportInput"/);
 assert.match(html,/data-ng="world-directory-type" data-val="person"/);
 assert.match(html,/data-ng="world-directory-page"/);
 assert.match(html,/100 OF 148 MATCHES/);
 assert.match(html,/1 \/ 2/);
 assert.equal((html.match(/data-ng="world-open"/g)||[]).length,100);
 assert.ok(!html.includes('Horse 120'),'Unrendered later page must remain in the searchable data');
 state.worldDirectoryPage=1;
 const second=build(state)();
 assert.match(second,/101–148 OF 148 MATCHES/);
 assert.match(second,/Horse 120/);
 assert.equal((second.match(/data-ng="world-open"/g)||[]).length,48);
 assert.equal(state.worldDirectoryPage,1);
});

test('World search covers full record attributes, birthplace, relation IDs and historical horses',()=>{
 const state=app();state.worldDirectorySearch='bluegrass';
 assert.match(build(state)(),/Horse 088/);
 assert.doesNotMatch(build(state)(),/Horse 000/);
 state.worldDirectorySearch='Kyoto JP';
 assert.match(build(state)(),/Trainer ABC/);
 state.worldDirectorySearch='HX-1';
 assert.match(build(state)(),/Archival Horse/);
 state.worldDirectorySearch='sire-1';
 assert.equal((build(state)().match(/data-ng="world-open"/g)||[]).length,100);
 state.worldDirectoryType='person';state.worldDirectorySearch='';
 const filtered=build(state)();
 assert.match(filtered,/Trainer ABC/);
 assert.equal((filtered.match(/data-ng="world-open"/g)||[]).length,1);
 assert.match(filtered,/1 OF 1 MATCHES/);
});

test('World canonical IDs and user names are never modified by sort/filter/page changes',()=>{
 const state=app(),original=JSON.stringify(base);
 state.managerSortScope='World:Directory';state.managerSortKey='identity';
 state.managerSortDesc=true;
 const html=build(state)();
 assert.match(html,/H-0144/);
 assert.doesNotMatch(html,/<script>bad\(\)<\/script>/);
 assert.equal(JSON.stringify(base),original);
 assert.match(ui,/APP\.worldDirectoryPage=Math\.max\(0,APP\.worldDirectoryPage\+Number\(val\)\)/);
 assert.match(ui,/APP\.worldDirectorySearch=input\.value;APP\.worldDirectoryPage=0/);
 assert.match(ui,/if\(section==='World'&&page==='Overview'\)return worldCompleteDirectoryView\(\)/);
});

test('Full World list shares management CSS; no second app or added stylesheet',()=>{
 assert.match(css,/\.ng-world-complete \.ng-manager-workspace\{grid-template-columns:minmax\(0,1fr\)\}/);
 assert.match(css,/\.ng-world-complete \.ng-manager-columns,\.ng-world-complete \.ng-manager-row/);
 assert.match(css,/\.ng-world-directory-types/);
 assert.match(css,/\.ng-world-directory-foot/);
 assert.equal((ui.match(/function worldCompleteDirectoryView\(/g)||[]).length,1);
 assert.doesNotMatch(ui,/items\.filter\(row=>row\.kind===kind\)\.slice\(0,20\)/);
});
