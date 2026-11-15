import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999,trackProgram1999,trackMeetOpen1999,scheduledRaceDays1999}
 from '../public/next/1999-track-program.mjs';
import {APPROVED_NEW_TRACK_IDS_1999,ARCHIVED_TRACK_IDS_1999}
 from '../public/next/approved-track-expansion-1999.mjs';
import {WTW_ALTERNATE_STAKES_1999}
 from '../public/next/1999-alternate-stakes.mjs';
import {createFoundingSourceBase1999}
 from '../public/1999/engine/founding-source-base-1999.mjs';

const geography=JSON.parse(readFileSync(
 new URL('../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const hero=JSON.parse(readFileSync(
 new URL('../public/assets/identity/hero-art-index-v1.json',import.meta.url),'utf8'));

test('final owner-approved 1999 names match all game, geography and logo surfaces',()=>{
 const names={
  'T-0061':'Comanche Raceway','T-0119':'Bluff City Downs',
  'T-0120':'Lowcountry Racecourse','T-0121':'Live Oak Park',
  'T-0122':'Sioux Plains','T-0123':'Bitterroot Downs',
  'T-0124':'Playfair Race Course'
 };
 const world=createFoundingSourceBase1999();
 const tracks=Array.from({length:world.counts.tracks},(_,i)=>world.trackAt(i));
 for(const [id,name] of Object.entries(names)){
  assert.equal(trackProgram1999(id).name,name,id+' program name');
  assert.equal(tracks.find(t=>t.id===id)?.name,name,id+' actual game-track name');
  const geo=geography.tracks.find(t=>t.id===id);
  assert.ok(geo,id+' geography');
  assert.equal(geo.game_presentation_name||geo.name,name,id+' geography name');
  assert.equal(hero.tracks[id],'/assets/places/track-hero/'+id+'.webp');
 }
 assert.equal(trackProgram1999('T-0061').sourceName,'Sunland Park',
  'Comanche is a game-facing name, not a real-history rewrite');
 assert.equal(geography.tracks.find(t=>t.id==='T-0061').name,'Sunland Park');
 assert.equal(trackProgram1999('T-0122').name,'Sioux Plains');
 assert.equal(geography.tracks.find(t=>t.id==='T-0122').city_locality,
  'Fargo / West Fargo');
});

test('Sioux Plains appears in its game-modeled meet and stakes, never under retired title',()=>{
 const track=trackProgram1999('T-0122');
 assert.equal(track.playableIn1999,true);
 assert.equal(track.trackOperating,'OPEN_1999');
 assert.equal(track.circuit,'Northern Plains');
 assert.equal(scheduledRaceDays1999('T-0122'),30);
 assert.equal(trackMeetOpen1999('T-0122','1999-06-11'),true);
 assert.equal(trackMeetOpen1999('T-0122','1999-08-16'),false);
 const races=WTW_ALTERNATE_STAKES_1999.filter(r=>r.trackId==='T-0122');
 assert.equal(races.length,4);
 assert.ok(races.every(r=>r.trackName==='Sioux Plains'));
 assert.ok(races.some(r=>r.name==='Sioux Plains Prairie Cup'));
 assert.ok(races.some(r=>r.name==='Sioux Plains Juvenile'));
 assert.ok(races.every(r=>r.canonical===false));
 assert.ok(!races.some(r=>/Red River Downs|Red River Prairie Cup|Red River Juvenile/.test(r.name+' '+r.trackName)));
});

test('retired 1999 tracks have no cards and remain accessible in history/save IDs',()=>{
 const world=createFoundingSourceBase1999();
 const tracks=Array.from({length:world.counts.tracks},(_,i)=>world.trackAt(i));
 const inactive=['T-0042','T-0112','T-0115',...ARCHIVED_TRACK_IDS_1999];
 assert.equal(new Set(inactive).size,17);
 assert.equal(tracks.length,124);
 assert.equal(world.counts.activeTracks,107);
 assert.equal(world.counts.historicalTracks,17);
 assert.deepEqual(APPROVED_NEW_TRACK_IDS_1999,
  ['T-0119','T-0120','T-0121','T-0122','T-0123','T-0124']);
 for(const id of inactive){
  const p=trackProgram1999(id),record=tracks.find(t=>t.id===id);
  assert.ok(record,id+' preserved ID/history');
  assert.equal(p.playableIn1999,false,id);
  assert.equal(record.playableIn1999,false,id);
  assert.equal(record.operating,'HISTORICAL_ONLY',id);
  assert.equal(scheduledRaceDays1999(id),0,id);
  assert.equal(trackMeetOpen1999(id,'1999-07-10'),false,id);
 }
 assert.equal(trackProgram1999('T-0106').playableIn1999,true,
  'Sheepshead Bay remains the specifically approved historic survivor');
 assert.equal(trackProgram1999('T-0124').playableIn1999,true,
  'Alternate-history Playfair remains operational');
 assert.equal(geography.counts.active_1999,107);
 assert.equal(geography.counts.historical_only_1999,17);
});
