import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave}
 from '../src/game/index.js';
import {racingAction,raceEligibility,gameRaceProgram,supported1999RaceClass,
 modeled1999HandicapWeight,HANDICAP_WEIGHT_BASIS_1999,validateRacingRuntime}
 from '../src/game/racing-1999.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {TRACK_PROGRAM_1999,trackMeetOpen1999}
 from '../public/next/1999-track-program.mjs';
import {buildConditionBook1999}
 from '../public/next/1999-condition-book-engine.mjs';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainers=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockeys=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const allPeople=[...directory.people];
const seen=new Set(allPeople.map(p=>p.id));
for(const p of [...trainers.trainers,...jockeys.jockeys])
 if(!seen.has(p.id)){allPeople.push(p);seen.add(p.id)}
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-1999-V10-HANDICAP-ENTRY',
 source:'APPROVED_1999_TEST_COHORT',
 sha256:createHash('sha256').update('wtw/1999/handicap-regression').digest('hex')},
 entities:{horses:directory.horses,people:allPeople,organizations:directory.organizations,
 tracks:directory.tracks}};
function game(){
 const initial=build1999PilotGameRun({world,manifest,jockeys:jockeys.jockeys});
 return dispatchGameCommand({state:initial,world,command:{
  id:'handicap:opening:day',type:'ADVANCE_DAY',actor:'system',payload:{}}}).state;
}
const addDays=(date,offset)=>
 new Date(Date.parse(date+'T12:00:00Z')+offset*86400000).toISOString().slice(0,10);
test('all 107 approved active 1999 tracks keep exact source handicap cards; claiming remains unmodeled',()=>{
 const tracks=Object.values(TRACK_PROGRAM_1999).
  filter(p=>p.trackOperating==='OPEN_1999'&&p.playableIn1999===true);
 assert.equal(tracks.length,107);
 let handicapCount=0,claimingCount=0;
 const regions=new Set();
 const geography=read('../public/data/track-geography-v33.json');
 const locator=new Map(geography.tracks.map(t=>[t.id,t]));
 for(const track of tracks){
  const location=locator.get(track.id);
  assert.ok(location,'every source course must retain approved geography '+track.id);
  for(let offset=0;offset<90;offset++){
   const date=addDays('1999-01-02',offset);
   if(!trackMeetOpen1999(track.id,date))continue;
   const books=buildConditionBook1999({date,track,
    trackIndex:Number(track.id.slice(2))-1,seed:19990101,includeKnownStakes:false});
   for(const r of books){
    if(r.conditions==='Handicap'){
     handicapCount++;
     assert.equal(supported1999RaceClass(r),true,track.id+' '+date);
     regions.add(location.state_province_region);
    }
    if(['Claiming','Maiden Claiming','Starter Allowance','Allowance Optional Claiming'].
      includes(r.conditions)){
     claimingCount++;
     assert.equal(supported1999RaceClass(r),false,
      'cannot drop original source claiming/starter transfer requirements');
    }
   }
  }
 }
 assert.ok(handicapCount>100,'a material number of real source handicap programs must be executable');
 assert.ok(claimingCount>1000,'source unmodeled conditions must stay distinct, never be relabeled');
 assert.ok(regions.size>=10,'a national cross-region race-calendar sample must be covered');
});
test('handicap from a live approved condition book requires game form and assigns a retained 110–122 lb impost',()=>{
 const state=game();
 let option=null;
 const horses=Object.values(state.runtime.registered_horses.by_id);
 for(const h of horses){
  if(option)break;
  for(let offset=2;offset<=28&&!option;offset++){
   const date=addDays(state.clock.date,offset);
   const books=gameRaceProgram(state,world,h.host_track_id,date);
   const b=books.find(r=>r.conditions==='Handicap'&&
    (r.ageRequirement==='3YO+'?1999-h.foaling_year>=3:
     r.ageRequirement==='4YO+'?1999-h.foaling_year>=4:
     r.ageRequirement==='3YO'?1999-h.foaling_year===3:
     1999-h.foaling_year===2)&&
    (r.sexRestriction==='OPEN'||['FILLY','MARE'].includes(h.sex))&&
    !state.runtime.races[r.id]);
   if(b)option={horse:h,book:b};
  }
 }
 assert.ok(option,'pilot active circuit must publish an unmodified 1999 handicap proposal');
 const {horse,book}=option;
 const r={
  id:book.id,track_id:book.trackId,date:book.date,conditions:book.conditions,
  age:book.ageRequirement,sex:book.sexRestriction,
  surface:book.surface,distance_furlongs:book.distanceFurlongs,
  max_wins:book.maxCareerWins,maiden:book.maidenOnly,
  purse_minor:book.purse*100,source:'WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'
 };
 assert.ok(raceEligibility(state,horse,r).reasons.includes(
  'HANDICAP_REQUIRES_TWO_RECORDED_STARTS'));
 assert.equal(modeled1999HandicapWeight(horse),null);
 // Isolated two-start game-form scenario; never alters an authentic history.
 // Actual production starts are earned only from modeled race settlement.
 horse.career.starts=2;
 horse.career.wins=1;
 for(const id of Object.keys(state.runtime.entries)){
  if(state.runtime.entries[id].horse_id!==horse.horse_id)continue;
  const oldRace=state.runtime.races[state.runtime.entries[id].race_id];
  if(oldRace)oldRace.field=oldRace.field.filter(e=>e!==id);
  delete state.runtime.entries[id];
 }
 assert.ok(raceEligibility(state,horse,r).eligible,
  JSON.stringify(raceEligibility(state,horse,r).reasons));
 const emit=()=>{};
 racingAction({state,world,emit,command:{type:'OPEN_1999_RACE',actor:'system',
  payload:{track_id:book.trackId,date:book.date,race_id:book.id}}});
 const live=state.runtime.races[book.id];
 assert.equal(live.handicap_weight_basis,HANDICAP_WEIGHT_BASIS_1999);
 racingAction({state,world,emit,command:{type:'ENTER_1999_RACE',actor:'system',
  payload:{race_id:book.id,horse_id:horse.horse_id}}});
 const e=state.runtime.entries[book.id+':'+horse.horse_id];
 assert.equal(e.handicap_weight_lbs,modeled1999HandicapWeight(horse));
 assert.ok(e.handicap_weight_lbs>=110&&e.handicap_weight_lbs<=122);
 assert.equal(e.handicap_weight_basis,HANDICAP_WEIGHT_BASIS_1999);
 assert.equal(live.purse_minor,Math.round(book.purse*100));
 assert.equal(live.id,book.id);
 validateRacingRuntime(state,world);
 const restored=importGameSave(exportGameSave(state,world),world);
 assert.deepEqual(restored.runtime.entries[e.id],e,
  'model-declared handicap impost must survive actual game save/reopen');
});
test('better form earns greater modeled handicap weight without inventing source official weights',()=>{
 const ordinary={starting_attributes:{current_ability:50},
  career:{starts:2,wins:0}};
 const good={starting_attributes:{current_ability:95},
  career:{starts:5,wins:4}};
 assert.equal(modeled1999HandicapWeight({...ordinary,career:{starts:0,wins:0}}),null);
 assert.ok(modeled1999HandicapWeight(good)>modeled1999HandicapWeight(ordinary));
 assert.ok(modeled1999HandicapWeight(good)<=122);
});
