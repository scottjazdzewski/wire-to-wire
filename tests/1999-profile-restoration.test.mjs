import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const get=path=>fs.readFileSync(new URL('../'+path,import.meta.url),'utf8');
const ui=get('public/next/next.js');
const html=get('public/next/index.html');
const foaling=JSON.parse(get('public/data/horse-foaling-registry-projection-v33.json'));

test('restored Tier One horse and track profiles reuse the existing renderer and grade artwork',()=>{
 assert.match(html,/\/next\/1999-restored-profiles\.js/);
 assert.match(ui,/profileDetail\(route,sourceOverride=null\)/);
 assert.match(ui,/function restored1999Profile\(/);
 assert.match(ui,/window\.WTW1999Profiles\?\.source/);
 assert.match(ui,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(ui,/if\(kind==='person'\)return restored1999Profile/);
 assert.match(ui,/if\(kind==='horse'\)return restored1999Profile/);
 assert.match(ui,/\/assets\/trophies\/approved-grade-/);
});

test('Personnel roster sorts full working set and scrolls instead of Prev/Next',()=>{
 assert.match(ui,/const shown=globalDirectory\|\|virtualMethod\?rows:rows\.slice\(0,Math\.min\(rows\.length,APP\.departmentScrollLimit\)\)/);
 assert.match(ui,/const pager='<span class="ng-dpt-records">/);
 assert.match(ui,/departmentScrollLimit\+160/);
 assert.match(get('public/next/next.css'),/\.ng-stable-roster-v2 \.ng-rs-scroll/);
 assert.match(get('public/next/next.css'),/ng-dept-roster\[data-department="Personnel"\] \.ng-dpt-pager/);
});

test('source-backed 1999 horse birthplace mapping uses Horse_ID and does not claim a stable is birthplace',()=>{
 assert.equal(foaling.schema,'WTW_1999_HORSE_FOALING_REGISTRY_PROJECTION_V1');
 assert.equal(foaling.source.countryField,'Foaling_Country');
 assert.equal(foaling.source.jurisdictionField,'Breeding_Jurisdiction');
 assert.ok(Object.keys(foaling.records).length>=250);
 for(const [id,row] of Object.entries(foaling.records)){
  assert.equal(row.horseId,id);
  assert.match(id,/^H-/);
  assert.ok(row.foalingCountry);
  assert.equal(row.jurisdictionIsNotExactFoalingPlace,true);
 }
 const context={window:{},document:{createElement(){return {dataset:{},innerHTML:'',className:''}}},fetch(){return new Promise(()=>{})}};
 vm.runInNewContext(get('public/next/1999-restored-profiles.js'),context);
 const horse=context.window.WTW1999Profiles.source('horse',{id:'H-TEST-000',name:'Example',age:4,sex:'MARE',owner:'Example Stable'},null);
 assert.equal(horse.node.dataset.ownershipGroup,'Example Stable');
 assert.equal(horse.node.dataset.foalingCountry,'');
 assert.match(horse.node.innerHTML,/Foaling year/);
 assert.match(horse.node.innerHTML,/Current stable/);
 const rated=context.window.WTW1999Profiles.source('horse',{
  id:'H-TEST-1999-0001',name:'Age Model Horse',age:3,sex:'COLT',_testGenerated:true,
  _testAbility:{schema:'WTW_1999_AGE_ABILITY_V1',currentStars:2,potentialStars:5,careerStage:'DEVELOPING'}
 },null);
 assert.match(rated.node.innerHTML,/CURRENT ABILITY · TEST/);
 assert.match(rated.node.innerHTML,/FUTURE POTENTIAL · TEST/);
 assert.match(rated.node.innerHTML,/2\/5/);
 assert.match(rated.node.innerHTML,/5\/5/);
});

test('source-backed horse and personnel attributes display the same detailed dossier, marked TEST not historical',()=>{
 const context={
  window:{},document:{createElement(){return {dataset:{},innerHTML:'',className:''}}},
  fetch(){return new Promise(()=>{})}
 };
 vm.runInNewContext(get('public/next/1999-restored-profiles.js'),context);
 const horse=context.window.WTW1999Profiles.source('horse',{
  id:'H-SOURCE-1999-1',name:'Registered Opening Horse',age:3,sex:'COLT'
 },{
  sourceHorseModel:id=>{
   assert.equal(id,'H-SOURCE-1999-1');
   return {id,attributes:{raw_speed:.82,conformation:.72,fitness:.63},
    ability:{schema:'WTW_1999_AGE_ABILITY_V1',currentStars:3,potentialStars:4,careerStage:'DEVELOPING'}};
  }
 });
 assert.equal(horse.route.kicker,'Horse Profile');
 assert.equal(horse.node.dataset.testGenerated,'false','Historical identity is not reclassified as invented');
 assert.equal(horse.node.dataset.testAttributeModel,'true');
 assert.equal(JSON.parse(horse.node.dataset.testAttributes).raw_speed,.82);
 assert.match(horse.node.innerHTML,/CURRENT ABILITY · TEST/);
 const jockey=context.window.WTW1999Profiles.source('person',{
  id:'P-SOURCE-1999-1',name:'Registered Jockey',role:'jockey'
 },{
  sourcePersonModel:id=>{
   assert.equal(id,'P-SOURCE-1999-1');
   return {id,attributes:{judgment:.75,break_timing:.88,race_tactics:.83}};
  }
 });
 assert.equal(jockey.route.kicker,'People Profile');
 assert.equal(jockey.node.dataset.testGenerated,'false');
 assert.equal(jockey.node.dataset.testAttributeModel,'true');
 assert.equal(jockey.node.dataset.personRole,'jockey');
 assert.equal(JSON.parse(jockey.node.dataset.testAttributes).break_timing,.88);
 assert.match(jockey.node.innerHTML,/Canonical person identity and recorded geography preserved/);
 const trainer=context.window.WTW1999Profiles.source('person',{
  id:'P-SOURCE-1999-2',name:'Registered Trainer',role:'trainer'
 },{
  sourcePersonModel:id=>({id,attributes:{conditioning:.81,workout_design:.78,planning:.7}})
 });
 assert.equal(trainer.node.dataset.personRole,'trainer');
 assert.equal(JSON.parse(trainer.node.dataset.testAttributes).workout_design,.78);
 assert.equal(trainer.route.kicker,jockey.route.kicker,'All people share the same detailed FM profile framework');
});

test('only organizations retain generic World view; horse and people duplicate renderers are absent',()=>{
 const start=ui.indexOf('function world1999Profile(){');
 const stop=ui.indexOf('function world1999Linked(',start);
 assert.ok(start>0&&stop>start);
 const block=ui.slice(start,stop);
 assert.match(block,/if\(kind==='horse'\|\|kind==='person'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(block,/const display='ORGANIZATION'/);
 assert.doesNotMatch(block,/add\('HORSE ID'/);
 assert.doesNotMatch(block,/add\('1999 BASE'/);
 assert.match(ui,/if\(kind==='person'\)return restored1999Profile\('person'/);
 assert.match(ui,/if\(kind==='horse'\)return restored1999Profile\('horse'/);
});
test('race conditions show documented restrictions and explicitly provisional eligibility',()=>{
 assert.match(html,/\/next\/1999-race-conditions\.js/);
 const context={window:{}};
 vm.runInNewContext(get('public/next/1999-race-conditions.js'),context);
 const race={id:'R-TEST-1999-1',name:'Maiden Race',date:'1999-01-01',
  trackName:'Belmont Park',ageRequirement:'3YO+',sexRestriction:'FILLIES_AND_MARES',
  surface:'DIRT',distanceFurlongs:8,purse:60000,conditions:'Maiden Special Weight'};
 const horses=[{name:'Meets Conditions',ageAtOpening:3,sex:'FILLY'},
  {name:'Too Young',ageAtOpening:2,sex:'FILLY'},
  {name:'Wrong Sex',ageAtOpening:3,sex:'COLT'}];
 const rendered=context.window.WTW1999RaceConditions.render(race,{ownedHorses:()=>horses});
 assert.match(rendered,/Belmont Park/);
 assert.match(rendered,/DIRT/);
 assert.match(rendered,/8 furlongs/);
 assert.match(rendered,/Maiden Special Weight/);
 assert.match(rendered,/1 of 3<\/strong> owned horses satisfy/);
 assert.match(rendered,/Meets Conditions/);
 assert.doesNotMatch(rendered,/data-val="Too Young"/);
 assert.doesNotMatch(rendered,/data-val="Wrong Sex"/);
 assert.match(rendered,/All remain provisional/);
 const unknown=context.window.WTW1999RaceConditions.render({id:'S-1999',name:'Stakes',trackName:'Belmont Park'},{ownedHorses:()=>horses});
 assert.match(unknown,/No named horse can be certified eligible/);
});
