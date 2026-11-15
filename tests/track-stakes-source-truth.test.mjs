import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

// Use the actual canonical UI code; no duplicate formatter implementation.
const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const helperStart=ui.indexOf(' const trackStakesGradeView=');
const helperEnd=ui.indexOf(' // Same sorting/filter/view/scroll renderer',helperStart);
const tableStart=ui.indexOf(' const stakesTable=');
const tableEnd=ui.indexOf(' const entityPhotoKind=',tableStart);
assert.ok(helperStart>0&&helperEnd>helperStart&&tableStart>helperEnd&&tableEnd>tableStart,
 'Canonical track stakes formatter and renderer must remain available');
const {trackStakesGradeView,trackStakesPurseValue}=new Function(
 ui.slice(helperStart,helperEnd)+'\nreturn {trackStakesGradeView,trackStakesPurseValue};')();
const safe=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const dateStart=ui.indexOf(' const stakeDateRank=');
const dateEnd=ui.indexOf(' // Read-only: summarize',dateStart);
assert.ok(dateStart>0&&dateEnd>dateStart,'Date rank must use canonical source');
const stakeDateRank=new Function(ui.slice(dateStart,dateEnd)+'\nreturn stakeDateRank;')();
const row=(id,name,date,grade,purse)=>({node:{
 children:[name,date,grade,purse].map(textContent=>({textContent})),dataset:{stakeId:id}
}});
const rows=[
 row('S-1','Unverified Graded','1999-03-06','PLANNED_WTW_G1','$—'),
 row('S-2','Official Listed','1999-02-20','G2','$125,000'),
 row('S-3','Undated Feature','TBA','G3','$20,000')
];
const app={stakeSort:'grade',stakeSortDesc:false};
const render=new Function('trackRaces','APP','route','safe','stakeDateRank',
 'trackStakesGradeView','trackStakesPurseValue',
 ui.slice(tableStart,tableEnd)+'\nreturn stakesTable;')(
 rows,app,{title:'Example Track'},safe,stakeDateRank,trackStakesGradeView,trackStakesPurseValue);
const names=html=>[...html.matchAll(/data-name="([^"]+)"/g)].map(x=>x[1]);

test('planned internal source code never becomes an official graded trophy',()=>{
 for(const code of ['PLANNED_WTW_G1','planned_wtw_g2_feature','PLANNED WTW_G3']){
  const view=trackStakesGradeView(code);
  assert.deepEqual({label:view.label,grade:view.grade,rank:view.rank},
   {label:'PLANNED',grade:null,rank:5});
  assert.match(view.description,/official grade not certified/i);
 }
 assert.equal(trackStakesGradeView('G1').grade,'1');
 assert.equal(trackStakesGradeView('G2').grade,'2');
 assert.equal(trackStakesGradeView('G3').grade,'3');
 assert.equal(trackStakesGradeView('—').grade,null);
});

test('only strictly recorded currency counts as a numerical purse',()=>{
 assert.equal(trackStakesPurseValue('$125,000'),125000);
 assert.equal(trackStakesPurseValue('$0'),0);
 for(const unknown of ['—','$—','TBD','','not certified',null,'$1,000 TBD'])
  assert.equal(trackStakesPurseValue(unknown),null,String(unknown));
});

test('track dossier shows honest labels, maintains source links and real trophy badges',()=>{
 const html=render();
 assert.doesNotMatch(html,/PLANNED_WTW_G1/);
 assert.match(html,/>PLANNED<\/span>/);
 assert.match(html,/Game-modeled race; official grade not certified/);
 assert.equal((html.match(/ng-stakes-trophy/g)||[]).length,2);
 assert.match(html,/data-ng="1999-stake"/);
 assert.match(html,/data-val="S-1"/);
 assert.match(html,/data-val="S-2"/);
 assert.match(html,/data-val="S-3"/);
});

test('unknown purse and date always sort last regardless of sort direction',()=>{
 for(const desc of [false,true]){
  app.stakeSort='purse';app.stakeSortDesc=desc;
  assert.equal(names(render()).at(-1),'Unverified Graded');
  app.stakeSort='date';app.stakeSortDesc=desc;
  assert.equal(names(render()).at(-1),'Undated Feature');
  assert.deepEqual(names(render()).slice(0,2),desc?
   ['Unverified Graded','Official Listed']:['Official Listed','Unverified Graded']);
 }
 app.stakeSort='grade';app.stakeSortDesc=false;
 assert.equal(names(render()).at(-1),'Unverified Graded');
 // Sorting the displayed rows must never mutate the underlying track source.
 assert.deepEqual(rows.map(r=>r.node.dataset.stakeId),['S-1','S-2','S-3']);
});

test('ISO dates and dated month names sort by actual calendar date, not race title',()=>{
 assert.ok(stakeDateRank('1999-02-20')<stakeDateRank('1999-03-06'));
 assert.ok(stakeDateRank('1999-12-31')<stakeDateRank('2000-01-01'));
 assert.equal(stakeDateRank('Mar 6, 1999'),stakeDateRank('1999-03-06'));
 assert.equal(stakeDateRank('TBA'),Number.MAX_SAFE_INTEGER);
 assert.equal(stakeDateRank('1999-13-01'),Number.MAX_SAFE_INTEGER);
});
