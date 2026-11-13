import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pilot=JSON.parse(read('public/data/wtw-1999-jockey-pilot-v1.json'));
const founding=JSON.parse(read('public/data/wtw-1999-founding-directory-v1.json'));
const office=read('public/next/next.js');
const profile=read('public/next/1999-restored-profiles.js');

test('Elite group includes user-confirmed male Paloma and restored male Simonne with distinct identities',()=>{
 assert.equal(pilot.counts.restoredByUser,1);
 assert.equal(pilot.counts.selectedPilot,26);
 assert.equal(pilot.jockeys.length,26);
 assert.ok(pilot.jockeys.every(x=>x.pilotStatus==='SELECTED_IDENTITY_ONLY'));
 const personIds=new Set(founding.people.map(p=>p.id));
 const saved=new Set(pilot.jockeys.map(p=>p.id));
 assert.equal(saved.size,26);
 for(const id of ['P-000053','P-000055','P-000057','P-1999-J-000001']){
  const p=pilot.jockeys.find(x=>x.id===id);
  assert.ok(p,id);
  assert.equal(p.pilotStatus,'SELECTED_IDENTITY_ONLY');
  assert.equal(p.eliteFirstPriority,true);
  assert.equal(p.gender,'MALE');
  assert.equal(p.pronouns,'he/him');
  assert.equal(p.performanceRatings,null);
  assert.deepEqual(p.bookedMounts,[]);
  assert.equal(p.employmentStatus,'UNASSIGNED');
 }
 const paloma=pilot.jockeys.find(x=>x.id==='P-000057');
 assert.equal(paloma.name,'Paloma Reyes');
 assert.ok(pilot.jockeys.some(x=>x.id==='P-000057'&&x.name===paloma.name));
 const simonne=pilot.jockeys.find(x=>x.id==='P-1999-J-000001');
 assert.equal(simonne.name,'Simonne Beaulieu');
 assert.equal(personIds.has(simonne.id),false,'new restoration must not overwrite historical person IDs');
 assert.equal(simonne.homeTrackId,'T-0039');
 assert.equal(simonne.homeTrack,'Woodbine');
 assert.equal(simonne.secondaryCircuit,'NEW_YORK_SELECTED_MAJOR_STAKES_DAYS');
 assert.match(simonne.availabilityPolicy,/NEW_YORK_MAJOR_RACES/);
 assert.match(simonne.travelBookingPolicy,/NO_AUTOMATIC_MOUNTS/);
 assert.equal(simonne.ageAtOpening,null);
 assert.equal(pilot.jockeys.find(p=>p.id==='P-900011').pilotStatus,'SELECTED_IDENTITY_ONLY');
 assert.equal(pilot.jockeys.filter(x=>x.pilotStatus==='SELECTED_IDENTITY_ONLY').length,26);
});
test('No new rating engine or page design is created; existing Personnel data and Horse-style profiles show gender and travel',()=>{
 assert.match(office,/pilot\.counts\?\.restoredByUser!==1/);
 assert.match(office,/pilot\.jockeys\.length!==26/);
 assert.match(office,/p\.id==='P-1999-J-000001'&&p\.gender==='MALE'/);
 assert.match(office,/p\.id==='P-000057'&&p\.gender==='MALE'/);
 assert.match(profile,/field\('Gender',d\.gender==='MALE'\?'Male'/);
 assert.match(profile,/New York · selected major stakes days/);
 assert.match(profile,/Travel policy/);
 assert.equal(founding.people.length,41);
 assert.equal(founding.organizations.length,37);
});
