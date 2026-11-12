import test from 'node:test';
import assert from 'node:assert/strict';
import {create1999Universe} from '../src/1999/full-world-generator.mjs';
import {openingWorld1999} from '../src/1999/opening-world.v1.mjs';
import {TRACK_PROGRAM_1999,trackMeetOpen1999} from '../public/next/1999-track-program.mjs';
import {applyVerifiedStakeDay1999} from '../public/next/1999-verified-stakes-dates.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {WTW_REGIONAL_STAKES_1999} from '../public/next/1999-regional-stakes.mjs';

const world=create1999Universe({seed:19990101,mode:'CANON_ANCHORED_TEST'});
const playable=new Map(Array.from({length:world.counts.tracks},(_,i)=>[world.trackAt(i).sourceTrackId,i]));
const all=[...openingWorld1999.stakes1999.map(applyVerifiedStakeDay1999),
 ...WTW_ALTERNATE_STAKES_1999,...WTW_REGIONAL_STAKES_1999]
 .filter(e=>playable.has(e.trackId));
const cards=new Map();

function cardAt(id,date){
 const key=id+'|'+date;
 if(!cards.has(key))cards.set(key,world.conditionBook(date,playable.get(id)));
 return cards.get(key);
}

test('every registered planned 1999 stakes event appears exactly once inside a numbered home-track race card',()=>{
 assert.equal(world.counts.tracks,118);
 assert.equal(openingWorld1999.stakes1999.length,93);
 assert.ok(all.length>200,'regional racing stakes appear to be missing');
 const ids=new Set();
 for(const event of all){
  assert.ok(!ids.has(event.id),'duplicate stakes identity: '+event.id);ids.add(event.id);
  assert.match(event.localDate,/^1999-\d{2}-\d{2}$/);
  assert.equal(trackMeetOpen1999(event.trackId,event.localDate),true,event.id+' scheduled on a dark date');
  const races=cardAt(event.trackId,event.localDate);
  const hits=races.filter(r=>r.stakeId===event.id);
  assert.equal(hits.length,1,event.id+' must occupy exactly one numbered race slot');
  const race=hits[0];
  assert.ok(race.number>=1&&race.number<=races.length,'unnumbered stakes: '+event.id);
  assert.equal(race.stakeName,event.name);
  assert.equal(race.purse,Number(event.purse1999??event.purse),event.id+' changed purse');
  assert.equal(race.surface,String(event.surface).toUpperCase(),event.id+' changed racing surface');
  assert.equal(race.status,'CONDITION_BOOK_PROPOSAL_NOT_RUN');
  assert.deepEqual(race.currentEntries,[]);
  assert.deepEqual(race.results,[]);
 }
});
test('all 118 tracks respect surfaces, distinct race numbers and 1999 calendar availability',()=>{
 for(const [id,index] of playable){
  const p=TRACK_PROGRAM_1999[id];assert.ok(p&&p.trackOperating==='OPEN_1999');
  let first=null;
  for(let month=1;month<=12&&!first;month++){
   const max=new Date(Date.UTC(1999,month,0)).getUTCDate();
   for(let d=1;d<=max;d++){
    const date='1999-'+String(month).padStart(2,'0')+'-'+String(d).padStart(2,'0');
    if(trackMeetOpen1999(id,date)){first=date;break;}
   }
  }
  assert.ok(first,'no meet date available for '+id);
  const races=cardAt(id,first);
  assert.ok(races.length>=6&&races.length<=16,id+' invalid card size');
  assert.deepEqual(races.map(x=>x.number),races.map((_,i)=>i+1),'nonconsecutive card: '+id);
  assert.ok(new Set(races.map(x=>x.id)).size===races.length,id+' duplicate race IDs');
  for(const r of races){
   assert.equal(r.trackName,world.trackAt(index).name);
   assert.ok(r.purse>0&&Number.isFinite(r.purse),id+' invalid purse');
   assert.ok(p.surfaces.includes(r.surface==='TURF'?'Turf':'Dirt'),id+' unsupported surface');
   assert.equal(r.canonical,false);
  }
 }
});
