import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {TRACK_PROGRAM_1999,trackProgram1999,trackMeetOpen1999,
 scheduledRaceDays1999,trackPhysicalVenueId1999} from '../public/next/1999-track-program.mjs';
import {ARCHIVED_TRACK_IDS_1999,APPROVED_NEW_TRACK_PROGRAMS_1999}
 from '../public/next/approved-track-expansion-1999.mjs';
import {createFoundingSourceBase1999} from '../public/1999/engine/founding-source-base-1999.mjs';
import {createFounding1999Universe} from '../public/1999/engine/founding-world-1999.mjs';
import {readLocal1999World} from '../public/1999/engine/local-api.mjs';
import {WTW_ALTERNATE_STAKES_1999} from '../public/next/1999-alternate-stakes.mjs';
import {gameRaceProgram,racingAction,raceEligibility} from '../public/1999/game/racing-1999.js';
import {shippingAssessment} from '../public/1999/game/shipping-1999.js';

test('exact approved 1999 meet totals, correct Thursday-to-Sunday codes, and the Monday Labor Day card',()=>{
 const totals={
  'T-0119':78,'T-0120':56,'T-0121':44,'T-0122':30,'T-0123':30,
  'T-0124':63,'T-0106':48,'T-0061':126
 };
 for(const [id,total] of Object.entries(totals))assert.equal(scheduledRaceDays1999(id),total,id);
 assert.deepEqual(trackProgram1999('T-0119').meets,[['03-05','05-30'],['09-03','11-28']]);
 assert.deepEqual(trackProgram1999('T-0120').meets,[['02-18','05-23']]);
 assert.deepEqual(trackProgram1999('T-0121').meets,[['09-02','11-14']]);
 assert.deepEqual(trackProgram1999('T-0122').meets,[['06-11','08-15']]);
 assert.deepEqual(trackProgram1999('T-0123').meets,[['06-25','08-29']]);
 assert.deepEqual(trackProgram1999('T-0124').meets,[['05-07','09-26']]);
 for(const id of ['T-0119','T-0122','T-0123','T-0124'])
  assert.deepEqual(trackProgram1999(id).dayPattern,[0,5,6],id+' Friday through Sunday');
 for(const id of ['T-0120','T-0121'])
  assert.deepEqual(trackProgram1999(id).dayPattern,[0,4,5,6],id+' Thursday through Sunday');
 assert.equal(trackMeetOpen1999('T-0106','1999-05-19'),false,'Wednesday is dark');
 assert.equal(trackMeetOpen1999('T-0106','1999-05-20'),true,'Thursday is a regular day');
 assert.equal(trackMeetOpen1999('T-0106','1999-09-05'),true,'Sunday remains a regular day');
 assert.equal(trackMeetOpen1999('T-0106','1999-09-06'),true,'special Monday Labor Day card');
 assert.equal(trackMeetOpen1999('T-0106','1999-09-07'),false,'meeting has ended');
 assert.deepEqual(trackProgram1999('T-0106').dayPattern,[0,4,5,6]);
});

test('the registry contains 107 active tracks and 17 retained history-only profiles',()=>{
 const base=createFoundingSourceBase1999();
 const tracks=Array.from({length:base.counts.tracks},(_,i)=>base.trackAt(i));
 assert.equal(Object.keys(TRACK_PROGRAM_1999).length,124);
 assert.equal(base.counts.tracks,124);
 assert.equal(base.counts.activeTracks,107);
 assert.equal(base.counts.historicalTracks,17);
 assert.equal(new Set(tracks.map(t=>t.id)).size,124);
 assert.equal(tracks.filter(t=>t.playableIn1999).length,107);
 assert.deepEqual(new Set(ARCHIVED_TRACK_IDS_1999),new Set([
  'T-0033','T-0103','T-0104','T-0105','T-0107','T-0108','T-0109',
  'T-0110','T-0111','T-0113','T-0114','T-0116','T-0117','T-0118'
 ]));
 for(const id of ['T-0042','T-0112','T-0115',...ARCHIVED_TRACK_IDS_1999]){
  const track=tracks.find(t=>t.id===id),index=tracks.findIndex(t=>t.id===id);
  assert.equal(track.playableIn1999,false,id);
  assert.equal(track.operating,'HISTORICAL_ONLY',id);
  assert.equal(track.racing.racesPerCard,0,id);
  assert.equal(track.meetWindow,'',id);
  assert.deepEqual(base.conditionBook('1999-06-01',index),[],id+' has no active condition book');
 }
 assert.equal(base.sourceStakes.length,93,'all approved source stakes remain available');
 const full=createFounding1999Universe({seed:19990101});
 assert.equal(full.counts.tracks,124);
 assert.equal(full.counts.activeTracks,107);
 assert.equal(readLocal1999World('/api/1999/sim/tracks?limit=200').total,124);
 const geo=JSON.parse(fs.readFileSync('public/data/track-geography-v33.json','utf8'));
 assert.equal(geo.counts.north_america,124);
 assert.equal(geo.counts.active_1999,107);
 assert.equal(geo.counts.historical_only_1999,17);
});

test('new tracks, Comanche, Sheepshead, and the San Mateo fair venue appear in the same local calendar',()=>{
 const base=createFoundingSourceBase1999();
 const tracks=Array.from({length:base.counts.tracks},(_,i)=>base.trackAt(i));
 assert.deepEqual(APPROVED_NEW_TRACK_PROGRAMS_1999.map(t=>t.id),
  ['T-0119','T-0120','T-0121','T-0122','T-0123','T-0124']);
 assert.equal(tracks.find(t=>t.id==='T-0061').name,'Comanche Raceway');
 assert.equal(tracks.find(t=>t.id==='T-0061').sourceName,'Sunland Park');
 assert.equal(tracks.find(t=>t.id==='T-0061').metroOrSubregion,'El Paso–Las Cruces metropolitan region');
 assert.equal(tracks.find(t=>t.id==='T-0075').name,'San Mateo County Fair');
 assert.equal(tracks.find(t=>t.id==='T-0075').physicalTrackId,'T-0032');
 assert.equal(trackPhysicalVenueId1999('T-0075'),'T-0032');
 assert.equal(trackProgram1999('T-0124').basis,'WTW_ALTERNATE_HISTORY_CONTINUED_OPERATION');
 for(const record of APPROVED_NEW_TRACK_PROGRAMS_1999){
  const track=tracks.find(t=>t.id===record.id),index=tracks.findIndex(t=>t.id===record.id);
  assert.ok(track,record.name+' missing from local directory');
  assert.equal(track.name,record.name);
  assert.ok(track.region&&track.circuit,record.name+' missing regional circuit');
  const stake=WTW_ALTERNATE_STAKES_1999.find(r=>r.trackId===record.id);
  assert.ok(stake,record.name+' missing a modeled stakes race');
  assert.equal(trackMeetOpen1999(record.id,stake.localDate),true,stake.name+' must be on a scheduled race day');
  const card=base.conditionBook(stake.localDate,index);
  const race=card.find(r=>r.stakeId===stake.id);
  assert.ok(race,stake.name+' missing from the condition book');
  assert.ok(race.fullConditions&&race.ageRequirement&&race.sexRestriction);
  assert.ok(['DIRT','TURF'].includes(race.surface));
  assert.ok(race.distanceFurlongs>0&&race.purse>0);
  assert.deepEqual(race.results,[]);
 }
});

test('the existing browser track directory joins the same program IDs and status',()=>{
 const ui=fs.readFileSync('public/next/next.js','utf8');
 assert.match(ui,/const trackPrograms=await import\('\.\/1999-track-program\.mjs'\)/);
 assert.match(ui,/const joined=\[\.\.\.data\.tracks,\.\.\.missing\.map\(t=>\{/);
 assert.match(ui,/playableIn1999:p\.playableIn1999===true/);
 assert.match(ui,/meetWindow:p\.meetWindow\|\|''/);
 assert.match(ui,/name:p\.name,sourceName:p\.sourceName/);
 assert.match(ui,/physicalTrackId:p\.physicalTrackId\|\|t\.physicalTrackId\|\|t\.id/);
 assert.match(ui,/modeledGrade\?'<span class="ng-stakes-modeled-class"/);
 assert.match(ui,/Modeled game class; no official grade is implied/);
 for(const column of ['CONDITIONS','DISTANCE','SURFACE'])assert.ok(ui.includes(column+'\']'));
 assert.match(ui,/if\(key==='stake-sort'\)/);
});

test('new modeled stakes open in the actual game race engine and enforce race conditions',()=>{
 const base=createFoundingSourceBase1999();
 const tracks=Array.from({length:base.counts.tracks},(_,i)=>base.trackAt(i));
 const track=tracks.find(t=>t.id==='T-0119');
 const stake=WTW_ALTERNATE_STAKES_1999.find(r=>r.trackId===track.id&&r.ageRequirement==='3YO'&&r.sexRestriction==='OPEN');
 assert.ok(stake);
 const currentDate=new Date(Date.parse(stake.localDate+'T12:00:00Z')-3*86400000).toISOString().slice(0,10);
 const state={clock:{date:currentDate},rng:{seed:19990101},runtime:{races:{},entries:{},
  facilities:{sites:{'S-TEST':{}}},registered_horses:{by_id:{}},horse:{},
  racing:{horse_travel:{}}}};
 const world={entities:{tracks:[track]}};
 const card=gameRaceProgram(state,world,track.id,stake.localDate);
 const book=card.find(r=>r.stakeId===stake.id);
 assert.ok(book,'the simulation race program contains the local stakes race');
 assert.equal(book.canonical,false);
 assert.equal(book.ageRequirement,'3YO');
 assert.equal(book.sexRestriction,'OPEN');
 assert.ok(book.surface&&book.distanceFurlongs&&book.purse);
 assert.equal(trackMeetOpen1999(track.id,stake.localDate),true);
 racingAction({state,world,command:{actor:'system',type:'OPEN_1999_RACE',payload:{
  track_id:track.id,date:stake.localDate,race_id:book.id}},emit:()=>{}});
 const opened=state.runtime.races[book.id];
 assert.equal(opened.status,'ENTRIES_OPEN');
 assert.equal(opened.stake_id,stake.id);
 const horse={horse_id:'H-TEST-3YO',foaling_year:1996,sex:'COLT',career:{wins:0},
  current_residence_id:'S-TEST',host_track_id:track.id};
 state.runtime.horse[horse.horse_id]={training:{sorenessDays:0,currentRisk:0,readiness:1},history:[]};
 const eligible=raceEligibility(state,horse,opened);
 assert.deepEqual(eligible,{eligible:true,reasons:[]});
});

test('shipping to a newly archived track is blocked while old saves without an explicit flag remain compatible',()=>{
 const archived=trackProgram1999('T-0103');
 const horse={horse_id:'H-SHIP',owner_organization_id:'O-TEST',current_residence_id:'S-HOME',
  host_track_id:'T-0001'};
 const site=(id,track)=>({id,host_track_id:track,status:'ACTIVE',staff_count:1,
  staff_required:1,stalls:10,contracts:[],location:{city:'New York',state:'New York',country:'USA'}});
 const state={clock:{date:'1999-01-01'},runtime:{registered_horses:{by_id:{'H-SHIP':horse}},
  racing:{horse_travel:{}},facilities:{sites:{'S-HOME':site('S-HOME','T-0001'),
   'S-ARCHIVE':site('S-ARCHIVE','T-0103')}},horse:{'H-SHIP':{
    training:{sorenessDays:0,currentRisk:0,readiness:1},history:[],
    policy:{monthly_budget_minor:3000000}}},finances:{operation_balances_minor:{'O-TEST':1000000000}},entries:{}}};
 const world={entities:{tracks:[{id:'T-0001',playableIn1999:true},
  {id:'T-0103',playableIn1999:false}]}};
 const result=shippingAssessment(state,world,'H-SHIP','S-ARCHIVE');
 assert.equal(archived.trackOperating,'HISTORICAL_ONLY');
 assert.ok(result.reasons.includes('DESTINATION_TRACK_NOT_ACTIVE_IN_1999'));
 assert.equal(shippingAssessment(state,{entities:{tracks:[{id:'T-0001'}]}},'H-SHIP','S-HOME')
  .reasons.includes('DESTINATION_TRACK_NOT_ACTIVE_IN_1999'),false);
});
