import assert from 'node:assert/strict';
import {test} from 'node:test';
import {openingWorld1999 as canon} from '../src/1999/opening-world.v1.mjs';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,trackProgram1999} from '../public/next/1999-track-program.mjs';
import {applyVerifiedStakeDay1999,VERIFIED_1999_STAKES_DATES} from '../public/next/1999-verified-stakes-dates.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '../public/next/1999-regional-stakes.mjs';

test('1999 playable calendar has 118 U.S., Canadian and Cuban courses but retains all 134 historical IDs',()=>{
 const w=create1999Universe();
 assert.equal(Object.keys(TRACK_PROGRAM_1999).length,134);
 assert.equal(w.counts.horses,87500);
 assert.equal(w.counts.tracks,118);
 const active=new Set();
 for(let i=0;i<w.counts.tracks;i++){
  const t=w.trackAt(i);active.add(t.sourceTrackId||t.id);
  assert.ok(['USA','Canada','Cuba'].includes(t.location.country),t.name+' outside playable region');
 }
 assert.ok(active.has('T-0102'),'Oriental Park, Cuba missing');
 assert.ok(active.has('T-0039'),'Woodbine, Canada missing');
 for(let i=1;i<=16;i++){
  const id='IT-'+String(i).padStart(4,'0');
  assert.equal(trackProgram1999(id).trackOperating,'ARCHIVE_ONLY_1999');
  assert.ok(!active.has(id));
  assert.equal(trackMeetOpen1999(id,'1999-08-07'),false);
 }
 assert.ok(WTW_ALTERNATE_STAKES_1999.every(s=>!s.trackId.startsWith('IT-')));
 assert.ok(WTW_REGIONAL_STAKES_1999.every(s=>!s.trackId.startsWith('IT-')));
});

test('Keeneland meet bounds are exact historic 1999 date spans with 31 days',()=>{
 const p=trackProgram1999('T-0014');
 assert.deepEqual(p.meets,[['04-02','04-23'],['10-09','10-30']]);
 assert.equal(p.raceDays,'31');
 assert.equal(trackMeetOpen1999(p.id,'1999-04-04'),false);
 assert.equal(trackMeetOpen1999(p.id,'1999-04-24'),false);
 assert.equal(trackMeetOpen1999(p.id,'1999-10-08'),false);
 assert.equal(trackMeetOpen1999(p.id,'1999-10-09'),true);
});

test('Oaklawn 1999 meet dates follow track-published 52-day season',()=>{
 const p=trackProgram1999('T-0021');
 assert.deepEqual(p.meets,[['01-29','04-10']]);
 assert.equal(p.raceDays,'52');
 assert.equal(trackMeetOpen1999(p.id,'1999-01-15'),false);
 assert.equal(trackMeetOpen1999(p.id,'1999-01-29'),true);
 assert.equal(trackMeetOpen1999(p.id,'1999-04-10'),true);
 assert.equal(trackMeetOpen1999(p.id,'1999-04-11'),false);
});

test('historical 1999 corrections preserve every stake ID and are playable on the researched day',()=>{
 assert.equal(Object.keys(VERIFIED_1999_STAKES_DATES).length,24);
 assert.equal(canon.stakes1999.length,93);
 for(const s of canon.stakes1999){
  const adjusted=applyVerifiedStakeDay1999(s);
  assert.equal(adjusted.id,s.id);
  assert.equal(adjusted.name,s.name);
  assert.equal(adjusted.trackId,s.trackId);
  assert.equal(trackMeetOpen1999(s.trackId,adjusted.localDate),true,s.id+' on dark date');
  assert.ok(trackProgram1999(s.trackId).stakesDates.includes(adjusted.localDate));
  if(VERIFIED_1999_STAKES_DATES[s.id]){
    assert.equal(adjusted.sourceCalendarDate1999,s.localDate);
    assert.match(adjusted.dateEvidenceUrl,/^https:\/\//);
  }
 }
 assert.equal(applyVerifiedStakeDay1999(canon.stakes1999.find(x=>x.id==='STK-0015')).localDate,'1999-04-18');
 assert.equal(applyVerifiedStakeDay1999(canon.stakes1999.find(x=>x.id==='STK-0023')).localDate,'1999-08-01');
 assert.equal(applyVerifiedStakeDay1999(canon.stakes1999.find(x=>x.id==='STK-0027')).localDate,'1999-06-27');
});
