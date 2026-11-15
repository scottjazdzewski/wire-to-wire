import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const get=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');
const js=get('public/next/next.js');
const css=get('public/next/next.css');
const open=js.indexOf('function dossierEntityCategory(');
const finish=js.indexOf('\nfunction dossierNavigationContext(',open);
assert.ok(open>=0&&finish>open,'One existing dossier implementation must remain');
const source=js.slice(open,finish);

function fixture(){
 const APP={departmentVisible:[],searchIndex:[],directoryHorseItems:[],
  recordBrowse:null,custom:'',previewEntity:null,raceDetail:null};
 const opened=[];
 const root={appendChild(button){
  button.click=()=>{
   const index=Number(button.dataset.val);
   const item=button.dataset.ng==='dept-open'?APP.departmentVisible[index]:
    button.dataset.ng==='search-go'?APP.searchIndex[index]:null;
   opened.push({action:button.dataset.ng,value:button.dataset.val,name:item?._name||item?.name});
   if(item?._id)APP.custom='FoundingProfile:person:'+item._id;
   else if(item?.worldKey)APP.custom='WorldRecord:'+encodeURIComponent(item.worldKey);
  };
 }};
 const document={createElement:()=>({dataset:{},remove(){},hidden:false})};
 const helpers=Function('APP','root','document','currentRoute','safe','world1999Entry','horseRows',
  'pilotRelationships','dossierNavigationContext',
  source+'\nreturn {entry:recordBrowseEntry,capture:recordBrowseCapture,'+
  'matches:recordBrowseMatches,context:recordBrowseContext,'+
  'step:recordBrowseStep,bar:recordBrowseToolbar,category:dossierEntityCategory};'
 )(APP,root,document,()=>null,String,v=>null,()=>[],null,()=>null);
 return {APP,opened,...helpers};
}
function list(values,action){
 const buttons=values.map(value=>({dataset:{ng:action,val:String(value)}}));
 const scope={querySelectorAll:selector=>
  selector==='button[data-ng="'+action+'"]'?buttons:[]};
 for(const button of buttons)button.closest=()=>scope;
 return buttons;
}

test('Trainers: Previous/Next follows currently visible sort order, not alphabetical or tabs',()=>{
 const f=fixture();
 f.APP.departmentVisible=[
  {_kind:'person',_name:'Zelda Trainer',_id:'P-11',role:'TRAINER'},
  {_kind:'person',_name:'Amy Trainer',_id:'P-12',role:'TRAINER'},
  {_kind:'person',_name:'Morgan Trainer',_id:'P-13',role:'TRAINER'}
 ];
 const buttons=list(['0','1','2'],'dept-open');
 f.capture(buttons[0],'dept-open','0');
 f.APP.custom='FoundingProfile:person:P-11';
 let context=f.context(null);
 assert.equal(context.family,'trainer');
 assert.equal(context.total,3);
 assert.equal(context.next.name,'Amy Trainer','follows visible list, not alphabetical order');
 assert.equal(context.previous.name,'Morgan Trainer','wraps to the last visible trainer');
 assert.equal(f.step(1),true);
 assert.deepEqual(f.opened,[{action:'dept-open',value:'1',name:'Amy Trainer'}]);
 assert.equal(f.APP.custom,'FoundingProfile:person:P-12');
 assert.equal(f.context(null).next.name,'Morgan Trainer');
 f.step(1);
 assert.equal(f.context(null).next.name,'Zelda Trainer','list cursor wraps');
});

test('Farms, owners, racing stables and trainers retain peer category on mixed search lists',()=>{
 const f=fixture();
 f.APP.searchIndex=[
  {kind:'farm',name:'Horseshoe Stud',worldKey:'farm:O-1',detail:'STUD FARM'},
  {kind:'farm',name:'Horizon Racing',worldKey:'farm:O-2',detail:'RACING STABLE'},
  {kind:'farm',name:'Ivy Hill Stud',worldKey:'farm:O-3',detail:'STUD FARM'},
  {kind:'person',name:'Trainer Sam',worldKey:'person:P-1',detail:'TRAINER'},
  {kind:'farm',name:'Jasper Stud',worldKey:'farm:O-4',detail:'STUD FARM'}
 ];
 const buttons=list(['0','1','2','3','4'],'search-go');
 f.capture(buttons[0],'search-go','0');
 f.APP.custom='WorldRecord:farm%3AO-1';
 assert.equal(f.context(null).family,'facility');
 assert.equal(f.context(null).total,3);
 assert.equal(f.context(null).next.name,'Ivy Hill Stud');
 assert.equal(f.context(null).previous.name,'Jasper Stud');
});

test('After filtering, only visible records are browsed, preserving canonical identity',()=>{
 const f=fixture();
 f.APP.departmentVisible=[
  {_kind:'track',_name:'Saratoga',_id:'T-3'},
  {_kind:'track',_name:'Aqueduct',_id:'T-1'},
  {_kind:'track',_name:'Belmont',_id:'T-2'}
 ];
 const buttons=list(['2','0'],'dept-open');
 f.capture(buttons[0],'dept-open','2');
 f.APP.custom='WorldRecord:track%3AT-2';
 assert.equal(f.context(null).total,2);
 assert.equal(f.context(null).next.name,'Saratoga');
 assert.equal(f.context(null).previous.name,'Saratoga');
 assert.equal(f.matches(null),true);
 f.APP.custom='WorldRecord:track%3AT-1';
 assert.equal(f.context(null),null,'old cursor must not leak into unrelated profile');
});

test('Race file records inherit same sorted list without editing race results or game date',()=>{
 const f=fixture();
 f.APP.departmentVisible=[
  {_kind:'race',_name:'Race 9',_id:'R9'},
  {_kind:'race',_name:'Race 1',_id:'R1'}
 ];
 const buttons=list(['0','1'],'dept-open');
 f.capture(buttons[0],'dept-open','0');
 f.APP.custom='RaceFile:R9';
 f.APP.raceDetail={id:'R9',name:'Race 9'};
 assert.equal(f.context(null).next.name,'Race 1');
 assert.match(js,/if\(choices\.source==='list'\)return recordBrowseStep\(direction\)/);
 assert.doesNotMatch(source,/dispatch\('ADVANCE_DAY'|localStorage\.setItem|saveCareer|random\(/);
});

test('Shared toolbar is used on world, preview, race and test-horse record views',()=>{
 assert.match(js,/recordBrowseToolbar\(route\)/);
 assert.match(js,/WorldRecord:\|RaceFile:\|Preview:\|PilotHorse:/);
 assert.match(js,/recordBrowseCapture\(btn,key,val\)/);
 assert.match(js,/RECORD_BROWSE_LIST=.*ng-rs-scroll.*ng-manager-rows.*ng-stakes-table/);
 assert.match(css,/\.ng-record-browse-bar\{/);
 assert.match(css,/\.ng-record-browse-bar button\.ng-profile-entity-step/);
 assert.match(js,/const adjacent=dossierNavigationContext\(route\)/);
 assert.match(js,/data-ng="dossier-entity-step"/);
});
