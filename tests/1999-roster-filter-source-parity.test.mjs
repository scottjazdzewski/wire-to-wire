import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';

const source=readFileSync(new URL('../public/next/1999-roster-filters.js',import.meta.url),'utf8');
const browser={window:{}};
vm.runInNewContext(source,browser,{filename:'1999-roster-filters.js'});
const {initial,matches,render,get}=browser.window.WTW1999RosterFilters;
const criteria=overrides=>({...initial(),...overrides});
const names=(rows,filter)=>rows.filter(row=>matches(row,filter)).map(row=>row.id);

test('unknown horse ages never masquerade as foals aged zero in canonical roster filters',()=>{
 const rows=[
  {id:'known-foal',age:0},{id:'yearling',age:1},{id:'older',age:'4'},
  {id:'missing',age:''},{id:'null',age:null},{id:'absent'},
  {id:'not-recorded',age:'—'},{id:'unavailable',age:'N/A'}
 ];
 assert.deepEqual(names(rows,criteria({ageMax:'0'})),['known-foal']);
 assert.deepEqual(names(rows,criteria({ageMin:'0',ageMax:'1'})),['known-foal','yearling']);
 assert.deepEqual(names(rows,criteria({ageMin:'2'})),['older']);
 assert.deepEqual(names(rows,criteria({})),rows.map(row=>row.id),
  'No active criteria must preserve all real records including unknowns');
});

test('0 is still a real numeric value; accounting negatives and displayed cash are comparable',()=>{
 assert.equal(matches({age:0},criteria({ageMin:'0',ageMax:'0'})),true);
 assert.equal(matches({age:'  '},criteria({ageMin:'0'})),false);
 assert.equal(matches({cost:'($2,500)'},criteria({field:'cost',query:'-2500'})),true);
 assert.equal(matches({cost:'$2,500'},criteria({field:'cost',query:'2500'})),true);
 assert.equal(matches({cost:'—'},criteria({field:'cost',query:'0'})),false);
 assert.equal(matches({cost:0},criteria({field:'cost',query:'0'})),true);
});

test('status filters match labels, not misleading fragments inside other statuses',()=>{
 const rows=[
  {id:'active',status:'ACTIVE'},
  {id:'inactive',status:'INACTIVE'},
  {id:'train',status:'IN_TRAINING / ACTIVE'},
  {id:'unavailable',status:'UNAVAILABLE'},
  {id:'available',status:'AVAILABLE'},
  {id:'pre-race',status:'PRE-RACE'},
  {id:'recovered',status:'RESTING'},
  {id:'fallback',status:'',racingStatus1999:'ACTIVE'},
  {id:'activity',status:' ',activity:'ACTIVE'},
  {id:'unknown',status:null}
 ];
 assert.deepEqual(names(rows,criteria({status:'ACTIVE'})),['active','train','fallback','activity']);
 assert.deepEqual(names(rows,criteria({status:'AVAILABLE'})),['available']);
 assert.deepEqual(names(rows,criteria({status:'IN TRAINING'})),['train']);
 assert.deepEqual(names(rows,criteria({status:'PRE-RACE'})),['pre-race']);
 assert.deepEqual(names(rows,criteria({status:'RESTING'})),['recovered']);
});

test('age zero criteria survive re-render and filter scopes do not overwrite each other',()=>{
 const app={};
 const roster=get(app,'Stable|Roster');
 const directory=get(app,'World|1999 Horses');
 roster.ageMax='0';
 directory.status='ACTIVE';
 assert.notEqual(roster,directory);
 const markup=render([['name','HORSE'],['age','AGE'],['status','STATUS']],roster,
  value=>String(value).replaceAll('&','&amp;').replaceAll('"','&quot;'),'Stable|Roster');
 assert.match(markup,/data-ng-input="roster-filter-ageMax" value="0"/);
 assert.match(markup,/data-filter-scope="Stable\|Roster"/);
 assert.equal(get(app,'Stable|Roster').ageMax,'0');
 assert.equal(get(app,'World|1999 Horses').status,'ACTIVE');
});

test('matching and rendering do not mutate the registered horse or organization data',()=>{
 const row=Object.freeze({id:'horse-000001',age:'',status:'INACTIVE',earnings:'($250)'});
 const snapshot=JSON.stringify(row);
 matches(row,criteria({ageMin:'0',status:'ACTIVE'}));
 matches(row,criteria({field:'earnings',query:'-250'}));
 assert.equal(JSON.stringify(row),snapshot);
});


test('the existing Stable attribute ranking prints real age zero rather than unknown',()=>{
 const attrSource=readFileSync(new URL('../public/next/1999-attribute-ranking.js',import.meta.url),'utf8');
 const view={window:{}};
 vm.runInNewContext(attrSource,view,{filename:'1999-attribute-ranking.js'});
 const adapter={
  horseAttributeGroups:[{name:'Racing',definitions:[{key:'raw_speed',label:'Speed'}]}],
  stableHorseAttributes:()=>({raw_speed:0.40}),
  sourceFacts:()=>({age:0,sex:'C',racing_status:'UNRACED',
   connections:{owner:'Canonical Owner',trainer:'Canonical Trainer'}})
 };
 const markup=view.window.WTW1999AttributeRanking.render({
  horses:[{name:'Saved Foal'}],adapter,
  app:{stableAttributeKey:'raw_speed',stableAttributeSort:'raw_speed',
   stableAttributeDesc:true,stableSearch:'',stableFilter:'attributes'},
  ownerBadge:()=>'',safe:value=>String(value??'')
 });
 assert.match(markup,/<td>0<\/td><td>C<\/td>/,
  'Age 0 must be visible on the real attribute-ranking screen');
 assert.match(markup,/Saved Foal/);
});
