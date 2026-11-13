import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const world=JSON.parse(readFileSync(new URL('../public/data/wtw-1999-founding-directory-v1.json',import.meta.url),'utf8'));
const js=readFileSync(new URL('../public/next/1999-founding-profiles.js',import.meta.url),'utf8');
const office=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../public/next/index.html',import.meta.url),'utf8');
const css=readFileSync(new URL('../public/next/next.css',import.meta.url),'utf8');
const context={window:{}};
vm.runInNewContext(js,context,{timeout:10000});
const profiles=context.window.WTW1999FoundingProfiles;

test('both accepted template families are loaded before the immutable Office renderer',()=>{
 assert.ok(profiles);
 assert.equal(typeof profiles.institution,'function');
 assert.equal(typeof profiles.person,'function');
 assert.ok(html.indexOf('/next/1999-founding-profiles.js')>=0);
 assert.ok(html.indexOf('/next/1999-founding-profiles.js')<html.indexOf('/next/next.js'));
 assert.match(office,/function openFounding1999Profile\(kind,id\)/);
 assert.match(office,/FoundingProfile:/);
 assert.match(office,/if\(key==='founding-open'\)/);
 assert.match(js,/data-ng="founding-open"/);
 assert.match(css,/WTW FOUNDING PROFILE TEMPLATES V1/);
});

test('37 exact founding organizations share one identity; Track-like ownership/facility lenses do not create any new sites',()=>{
 assert.equal(world.organizations.length,37);
 assert.equal(world.counts.approvedOpeningPhysicalFacilities,0);
 assert.equal(world.counts.generatedTrainingCenters,0);
 const ids=new Set();
 let facilities=0;
 for(const org of world.organizations){
  assert.ok(!ids.has(org.id),org.name);ids.add(org.id);
  const owner=profiles.institution('ownership',org,world,{tab:'Overview',logoMarkup:'<span>APPROVED MARK SLOT</span>'});
  assert.match(owner,/ng-profile-track ng-founding-profile ng-founding-ownership/);
  assert.match(owner,/ng-track-workspace ng-founding-workspace/);
  assert.ok(owner.includes('data-founding-id="'+org.id+'"'));
  assert.ok(owner.includes('EXACT ID · '+org.id));
  assert.ok(owner.includes('HISTORICAL RACING &amp; BLOODLINES'));
  assert.ok(!owner.includes('SIMULATED TEST WORLD'));
  const category=profiles.category(org);
  if(['STUD_FARM','FARM','RACING_STABLE_ORGANIZATION'].includes(category)){
   facilities++;
   const facility=profiles.institution('facility',org,world,{tab:'Overview',logoMarkup:''});
   assert.match(facility,/ng-profile-track ng-founding-profile ng-founding-facility/);
   assert.ok(facility.includes('data-founding-id="'+org.id+'"'));
   assert.ok(facility.includes('FACILITY READINESS'));
   assert.ok(facility.includes('NOT REGISTERED'));
   assert.ok(!facility.includes('117 TRAINING CENTERS'));
  }
 }
 assert.equal(facilities,30);
 assert.equal(world.organizations.filter(o=>profiles.category(o)==='STUD_FARM').length,5);
 assert.equal(world.organizations.filter(o=>profiles.category(o)==='FARM').length,15);
 assert.equal(world.organizations.filter(o=>profiles.category(o)==='RACING_STABLE_ORGANIZATION').length,10);
});

test('four unapproved leaders never appear as principals; investor Magic Johnson is NOT manager',()=>{
 const pending=new Set(['O-000002','O-000064','O-000057','O-006905']);
 const forbidden=['Graham Kincaid','Hugh Radcliffe','Sebastian Pryce','Daniel Calder'];
 for(const id of pending){
  const org=world.organizations.find(o=>o.id===id);
  const rendered=profiles.institution('ownership',org,world,{tab:'Leadership'});
  assert.match(rendered,/PENDING APPROVAL · NO PRINCIPAL ASSIGNED/);
  assert.ok(forbidden.every(name=>!rendered.includes(name)));
 }
 const led=world.organizations.find(o=>o.id==='O-006905');
 const markup=profiles.institution('ownership',led,world,{tab:'Overview'});
 assert.match(markup,/MAJOR NON-OPERATING INVESTOR/);
 assert.match(markup,/Magic Johnson/);
 assert.match(markup,/founding-open" data-val="person:P-910018"/);
 assert.ok(!markup.includes('Daniel Calder'));
 const argosy=profiles.institution('ownership',
  world.organizations.find(o=>o.id==='O-000014'),world,{tab:'Overview'});
 assert.match(argosy,/Julian Voss/);
 assert.match(argosy,/person:P-000018/);
});

test('Horse-style personnel dossiers open for exactly 41 approved people, without synthetic attributes or contracts',()=>{
 assert.equal(world.people.length,41);
 const unique=new Set();
 for(const p of world.people){
  assert.ok(!unique.has(p.id));unique.add(p.id);
  const html=profiles.person(p,world,{tab:'Overview',personBadge:''});
  assert.match(html,/ng-profile-horse ng-profile-person ng-founding-profile ng-founding-person/);
  assert.ok(html.includes('data-founding-id="'+p.id+'"'));
  assert.ok(html.includes('EXACT ID · '+p.id));
  assert.ok(html.includes('PROFESSIONAL EVALUATION'));
  assert.ok(html.includes('AWAITING CERTIFIED DATA'));
  assert.ok(!html.includes('SIMULATED TEST VALUES'));
  assert.ok(!html.includes('1999 TEST PERSON'));
  assert.ok(!html.includes('CURRENT ABILITY · TEST'));
 }
 assert.equal(unique.size,41);
 const voss=profiles.person(world.people.find(p=>p.id==='P-000018'),world,{tab:'Connections'});
 assert.match(voss,/Argosy Bloodstock/);
 assert.match(voss,/ownership:O-000014/);
 const johnson=profiles.person(world.people.find(p=>p.id==='P-910018'),world,{tab:'History'});
 assert.match(johnson,/No management authority or ownership percentage is implied/);
});

test('navigation, history and stud-stock links point to canonical IDs; no source data mutated',()=>{
 const before=JSON.stringify(world);
 const bell=world.organizations.find(x=>x.id==='O-000068');
 const stock=profiles.institution('facility',bell,world,{tab:'Breeding Stock'});
 assert.match(stock,/STANDING STALLION/);
 assert.match(stock,/founding-open" data-val="horse:H-/);
 const king=world.organizations.find(x=>x.id==='O-000061');
 const history=profiles.institution('ownership',king,world,{tab:'History'});
 assert.match(history,/documented historical/i);
 assert.match(history,/founding-open" data-val="horse:H-/);
 assert.match(history,/RACING_OWNER|BREEDER/);
 assert.equal(JSON.stringify(world),before);
});
