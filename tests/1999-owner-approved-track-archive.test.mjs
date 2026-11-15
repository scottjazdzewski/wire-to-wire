import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999,trackCardSurface1999} from '../public/next/1999-track-program.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '../public/next/1999-regional-stakes.mjs';
const archived=["T-0033","T-0103","T-0104","T-0105","T-0107","T-0108","T-0109","T-0110","T-0111","T-0113","T-0114","T-0116","T-0117","T-0118"];
test('owner-approved historic retirements never issue 1999 race dates or cards',()=>{
 const ui=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');
 const match=ui.match(/const WTW_RETIRED_TRACK_IDS=new Set\((\[[^;]+\])\);/);
 assert.ok(match,'retired-track ID exclusion set in management UI');
 const hidden=new Set(JSON.parse(match[1]));
 for(const id of archived){
  const track=TRACK_PROGRAM_1999[id];
  assert.ok(track?.name,'source track retained '+id);
  assert.equal(track.trackOperating,'HISTORICAL_ONLY',id);
  assert.equal(track.playableIn1999,false,id);
  assert.ok(hidden.has(id),'hidden from active Racing screen '+id);
  assert.equal(trackCardSurface1999(id,0),null,id);
  for(let day=1;day<=365;day++){
   const date=new Date(Date.UTC(1999,0,day)).toISOString().slice(0,10);
   assert.equal(trackMeetOpen1999(id,date),false,id+' '+date);
  }
  assert.ok(!WTW_ALTERNATE_STAKES_1999.some(r=>r.trackId===id),'feature race left at '+id);
  assert.ok(!WTW_REGIONAL_STAKES_1999.some(r=>r.trackId===id),'regional race left at '+id);
 }
 assert.equal(TRACK_PROGRAM_1999['T-0106'].trackOperating,'OPEN_1999');
});
