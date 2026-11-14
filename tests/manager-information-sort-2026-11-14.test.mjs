import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const ui=read('public/next/next.js');
const css=read('public/next/next.css');
const start=ui.indexOf('function managerRecordSortState(');
const end=ui.indexOf('function sourceNewsDesk()',start);
assert.ok(start>0&&end>start,'Every information screen needs one shared manager column sorter');
const helper=ui.slice(start,end);
const safe=s=>String(s??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
const app={managerSortScope:'',managerSortKey:'',managerSortDesc:false};
const {sort,header}=new Function('APP','safe',helper+
 '\nreturn {sort:managerSortRecords,header:managerSortableColumns};')(app,safe);

const source=[
 {kind:'horse',name:'Horse 10',detail:'FIT',context:'Saratoga',sourceIndex:17},
 {kind:'track',name:'Belmont',detail:'NY',context:'1999-04-12',sourceIndex:4},
 {kind:'horse',name:'Horse 2',detail:'READY',context:'Aqueduct',sourceIndex:5},
 {kind:'horse',name:'Horse 2',detail:'READY',context:'Aqueduct',sourceIndex:3}
];
const snapshot=JSON.stringify(source);

test('Inactive sort preserves the approved category/chronological preview, never mutates source IDs or records',()=>{
 assert.strictEqual(sort('World:Overview',source),source,'Default World preview order must remain exactly as approved');
 assert.equal(JSON.stringify(source),snapshot);
 const out=header('World:Overview',[['kind','TYPE'],['name','NAME'],['detail','ROLE'],['context','BASE']]);
 assert.equal((out.match(/data-ng="manager-sort"/g)||[]).length,4);
 assert.equal((out.match(/aria-sort="none"/g)||[]).length,4);
 assert.match(out,/role="row"/);
 assert.match(out,/role="columnheader"/);
});

test('All manager screen families share actual asc/desc/number-aware, stable read-only sorting',()=>{
 for(const scope of ['World:Overview','World:News','Office:News','Office:Opportunities']){
  app.managerSortScope=scope;app.managerSortKey='name';app.managerSortDesc=false;
  const ascending=sort(scope,source);
  assert.deepEqual(ascending.map(x=>x.name),['Belmont','Horse 2','Horse 2','Horse 10']);
  assert.deepEqual(ascending.filter(x=>x.name==='Horse 2').map(x=>x.sourceIndex),[5,3],
   'Stable equal-key sort must preserve duplicate records and exact original IDs');
  assert.equal(JSON.stringify(source),snapshot,'Sorting a view may never alter the source array');
  const head=header(scope,[['kind','TYPE'],['name','NAME'],['detail','DETAIL'],['context','CONTEXT']]);
  assert.match(head,/aria-sort="ascending"/);
  assert.equal((head.match(/aria-sort="ascending"/g)||[]).length,1);
  assert.match(head,/data-ng="manager-sort" data-scope="[^"]+" data-val="name"/);
  app.managerSortDesc=true;
  const descending=sort(scope,source);
  assert.deepEqual(descending.map(x=>x.name),['Horse 10','Horse 2','Horse 2','Belmont']);
  assert.match(header(scope,[['name','NAME']]),/aria-sort="descending"/);
 }
});

test('Sorting is scoped to its displayed screen and all contexts use the one interaction handler',()=>{
 app.managerSortScope='World:News';app.managerSortKey='context';app.managerSortDesc=true;
 assert.strictEqual(sort('World:Overview',source),source,'An Office/News sort must not reorder World overview');
 assert.deepEqual(sort('World:News',source).map(x=>x.context),
  ['Saratoga','Aqueduct','Aqueduct','1999-04-12']);
 assert.match(ui,/if\(key==='manager-sort'\)/);
 assert.match(ui,/APP\.managerSortScope===scope&&APP\.managerSortKey===val/);
 assert.equal((ui.match(/function managerSortRecords\(/g)||[]).length,1);
 assert.equal((ui.match(/function managerSortableColumns\(/g)||[]).length,1);
 assert.equal((ui.match(/managerSortableColumns\((?:newsScope|opportunityScope|overviewScope),/g)||[]).length,3);
});

test('Information-rich management panels expose keyboard-focusable internal scroll, no second stylesheet',()=>{
 assert.equal((ui.match(/class="ng-manager-rows" tabindex="0" role="region"/g)||[]).length,3);
 assert.equal((ui.match(/class="ng-manager-secondary-list" tabindex="0" role="region"/g)||[]).length,2);
 assert.match(css,/\.ng-manager-rows:focus-visible,\.ng-manager-secondary-list:focus-visible/);
 assert.match(css,/\.ng-manager-columns>span\[aria-sort="descending"\]>button/);
 assert.match(css,/\.ng-manager-columns>span\[role="columnheader"\]>button:hover/);
 assert.doesNotMatch(ui,/function connectedTableState\(|function profileRecordSection\(/);
});

test('Sort headings always escape incoming labels and scope attributes',()=>{
 const output=header('World:" onmouseenter="bad()', [['name','<img src=x>']]);
 assert.doesNotMatch(output,/<img|onmouseenter="bad\(\)"/);
 assert.match(output,/&lt;img src=x>/);
 assert.match(output,/World:&quot; onmouseenter=/);
});
