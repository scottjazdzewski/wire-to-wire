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
 assert.match(ui,/if\(kind==='horse'\|\|kind==='track'\)return restored1999Profile/);
 assert.match(ui,/if\(kind==='horse'&&generated\)return restored1999Profile/);
 assert.match(ui,/\/assets\/trophies\/approved-grade-/);
});

test('Personnel roster sorts full working set and scrolls instead of Prev/Next',()=>{
 assert.match(ui,/const continuousPersonnel=section==='Personnel'/);
 assert.match(ui,/continuousPersonnel\?rows\.slice\(0,Math\.min\(rows\.length,APP\.departmentScrollLimit\)\)/);
 assert.match(ui,/const pager=continuousPersonnel\?/);
 assert.match(ui,/departmentScrollLimit\+160/);
 assert.match(get('public/next/next.css'),/ng-dept-roster\[data-department="Personnel"\] \.ng-rs-scroll/);
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
});

test('race conditions show source data and only age/sex screen instead of fabricating entry eligibility',()=>{
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
 assert.match(rendered,/1 of 3 horses pass/);
 assert.match(rendered,/Meets Conditions/);
 assert.doesNotMatch(rendered,/data-val="Too Young"/);
 assert.doesNotMatch(rendered,/data-val="Wrong Sex"/);
 assert.match(rendered,/This is not entry clearance/);
 const unknown=context.window.WTW1999RaceConditions.render({id:'S-1999',name:'Stakes',trackName:'Belmont Park'},{ownedHorses:()=>horses});
 assert.match(unknown,/Eligibility remains unconfirmed/);
});
