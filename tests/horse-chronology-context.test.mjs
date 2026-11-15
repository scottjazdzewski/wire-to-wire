import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

const js=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
const start=js.indexOf('function horseBirthChronology(dateOfBirth,gameDate){');
const end=js.indexOf('function titleCaseUIRole(',start);
assert.ok(start>0&&end>start,'Production horse chronological UI guard is missing');
const chronology=new Function(js.slice(start,end)+'\nreturn horseBirthChronology;')();

test('horse profile calls out future birthdates relative to current game clock',()=>{
 for(const date of ['March 9, 2012','2012-03-09']){
  const s=chronology(date,'1999-01-01');
  assert.equal(s.future,true,date);
  assert.match(s.warning,/RECORDED DOB/);
  assert.match(s.warning,/AFTER GAME DATE 1999-01-01/);
  assert.match(s.warning,/current age and racing eligibility are not established/);
 }
 assert.match(js,/horseBirthChronology\(horseField\('Date of birth'\),depGameDay\(\)\)/);
 assert.match(js,/horseChronology\.future\?'NOT FOALED':horseField\('Age'\)/);
 assert.match(js,/ng-horse-chronology-alert/);
 assert.match(js,/role="status"/);
});

test('horse chronology never invents an age or eligibility from missing / malformed source dates',()=>{
 for(const dob of ['', '—', 'Unknown', 'February 30, 1998','2024-02-30']){
  const s=chronology(dob,'1999-01-01');
  assert.equal(s.future,false,dob);
  assert.equal(s.warning,'',dob);
 }
 for(const clock of ['', 'not a date']){
  assert.equal(chronology('March 9, 2012',clock).future,false);
 }
});

test('the same DOB is valid on its actual foaling date and after, with no warning',()=>{
 for(const gameDate of ['2012-03-09','2012-03-10','2026-11-15']){
  const s=chronology('March 9, 2012',gameDate);
  assert.equal(s.future,false,gameDate);
  assert.equal(s.warning,'',gameDate);
 }
});

test('horse form sorts certified race evidence by date rather than insertion order',()=>{
 assert.match(js,/verifiedHistory\.slice\(\)\.sort\(\(a,b\)=>String\(b\.date\)\.localeCompare\(String\(a\.date\)\)\)\.slice\(0,5\)/);
 assert.doesNotMatch(js,/verifiedHistory\.slice\(-5\)\.reverse\(\)/);
 assert.match(js,/Array\.isArray\(x\.source_refs\)&&x\.source_refs\.length>0/);
});
