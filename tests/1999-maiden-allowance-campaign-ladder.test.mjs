import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 gameRaceProgram,raceEligibility,getGameRacingRoster,supported1999RaceClass}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=read('../public/data/wtw-1999-founding-directory-v1.json');
const t=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const j=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...d.people,...t.trainers,...j.jockeys].map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'ALLOWANCE-MAIDEN-GRADUATION-1999',
  source:'NONHISTORICAL_1999_CAREER_CLASS_TEST',
  sha256:createHash('sha256').update('allowance-ladder-1999-v1').digest('hex')},
 entities:{horses:d.horses,organizations:d.organizations,tracks:d.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:j.jockeys});
const run=(s,id,type,payload={},actor='system')=>
 dispatchGameCommand({state:s,world,command:{id,type,payload,actor}}).state;
const day=s=>run(s,'allowance:day:'+s.clock.date,'ADVANCE_DAY');
const sample=(s,track,dateStart='1999-01-07',count=15)=>
 Array.from({length:count},(_,i)=>new Date(
  Date.parse(dateStart+'T12:00:00Z')+i*86400000).toISOString().slice(0,10)).
 flatMap(date=>gameRaceProgram(s,world,track,date));
const activeRace=(s,track,conditions,limit=null)=>sample(s,track).find(r=>
 r.conditions===conditions&&r.ageRequirement==='3YO+'&&r.sexRestriction==='OPEN'&&
 (limit===null||r.maxCareerWins===limit));
test('1999 source condition book exposes supported maiden and restricted allowance classes only',()=>{
 const s=fresh(),races=sample(s,'T-0017');
 const msw=races.find(r=>r.conditions==='Maiden Special Weight'&&r.ageRequirement==='3YO+');
 const nw2=activeRace(s,'T-0017','Allowance',1);
 const nw3=activeRace(s,'T-0017','Allowance',2);
 assert.ok(msw);assert.ok(nw2);assert.ok(nw3);
 assert.equal(supported1999RaceClass(msw),true);
 assert.equal(supported1999RaceClass(nw2),true);
 assert.equal(supported1999RaceClass(nw3),true);
 for(const className of ['Claiming','Maiden Claiming','Starter Allowance',
  'Allowance Optional Claiming','Handicap']){
  const x=races.find(r=>r.conditions===className);
  assert.ok(x,'Expected source race class '+className);
  assert.equal(supported1999RaceClass(x),false);
  assert.throws(()=>run(s,'unmodeled:'+x.id,'OPEN_1999_RACE',
   {race_id:x.id,track_id:x.trackId,date:x.date}),
   e=>e.code==='RACE_CLASS_UNMODELED','No fake ownership claims, starter flags or handicapping');
 }
 assert.equal(supported1999RaceClass({...nw2,maxCareerWins:null}),false);
});
test('allowance requires a prior winner and respects NW2/NW3 lifetime limits',()=>{
 const s=fresh(),track='T-0017';
 const h=Object.values(s.runtime.registered_horses.by_id).find(x=>
  x.owner_organization_id===s.player.operation_id&&x.host_track_id===track);
 assert.ok(h);
 const nw2=activeRace(s,track,'Allowance',1),nw3=activeRace(s,track,'Allowance',2);
 assert.ok(nw2&&nw3);
 const shape=book=>({
  id:book.id,track_id:book.trackId,date:book.date,
  age:book.ageRequirement,sex:book.sexRestriction,conditions:book.conditions,
  maiden:book.maidenOnly,max_wins:book.maxCareerWins,
  surface:book.surface,field_capacity:book.fieldCapacity
 });
 assert.ok(raceEligibility(s,h,shape(nw2)).reasons.includes('ALLOWANCE_REQUIRES_MAIDEN_VICTORY'));
 const graduate={...h,career:{...h.career,starts:1,wins:1}};
 assert.equal(raceEligibility(s,graduate,shape(nw2)).eligible,true);
 const twice={...h,career:{...h.career,starts:2,wins:2}};
 assert.ok(raceEligibility(s,twice,shape(nw2)).reasons.includes('CAREER_WIN_LIMIT'));
 assert.equal(raceEligibility(s,twice,shape(nw3)).eligible,true);
 const thrice={...h,career:{...h.career,starts:3,wins:3}};
 assert.ok(raceEligibility(s,thrice,shape(nw3)).reasons.includes('CAREER_WIN_LIMIT'));
 const maiden=activeRace(s,track,'Maiden Special Weight');
 assert.ok(maiden);
 assert.ok(raceEligibility(s,graduate,shape(maiden)).reasons.includes('MAIDEN_RESTRICTION'));
});
test('future nominations enforce rest spacing even when races are on different dates',()=>{
 let s=fresh(),h=Object.values(s.runtime.registered_horses.by_id).
  find(x=>x.owner_organization_id===s.player.operation_id&&x.host_track_id==='T-0017');
 assert.ok(h);
 const dates=[...new Set(sample(s,'T-0017').filter(r=>
  r.conditions==='Maiden Special Weight'&&r.ageRequirement==='3YO+'&&
  r.sexRestriction==='OPEN').map(x=>x.date))];
 assert.ok(dates.length>=2);
 const first=activeRace(s,'T-0017','Maiden Special Weight');
 const second=sample(s,'T-0017',dates[1],1).find(r=>
  r.conditions==='Maiden Special Weight'&&r.ageRequirement==='3YO+'&&r.sexRestriction==='OPEN');
 assert.ok(first&&second,'Two exact condition-book maiden races needed');
 s=run(s,'allowance:open:1','OPEN_1999_RACE',{
  race_id:first.id,track_id:first.trackId,date:first.date});
 s=run(s,'allowance:open:2','OPEN_1999_RACE',{
  race_id:second.id,track_id:second.trackId,date:second.date});
 s=run(s,'allowance:enter:1','ENTER_1999_RACE',{
  race_id:first.id,horse_id:h.horse_id},'player');
 const result=raceEligibility(s,h,s.runtime.races[second.id]);
 assert.ok(result.reasons.includes('CONFLICTING_CAMPAIGN_SPACING')||
  result.reasons.includes('CONFLICTING_ENTRY'));
 assert.throws(()=>run(s,'allowance:enter:2','ENTER_1999_RACE',
  {race_id:second.id,horse_id:h.horse_id},'player'),
  e=>e.code==='RACE_INELIGIBLE');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('independent AI maiden and allowance campaigns run at same track, without auto-entering player horses',()=>{
 let s=fresh();
 const horses=Object.values(s.runtime.registered_horses.by_id);
 const track='T-0017',winners=horses.filter(h=>
  h.host_track_id===track&&h.owner_organization_id!==s.player.operation_id).slice(0,2);
 assert.equal(winners.length,2);
 // Controlled game test fixture: promote two game horses to prior winners
 // without asserting any extra historical results or changing the source directory.
 for(const h of winners){s.runtime.registered_horses.by_id[h.horse_id].career.wins=1;
  s.runtime.registered_horses.by_id[h.horse_id].career.starts=1}
 s=day(s);
 const cards=getGameRacingRoster(s,track);
 const maiden=cards.find(x=>x.conditions==='Maiden Special Weight');
 const allowance=cards.find(x=>x.conditions==='Allowance');
 assert.ok(maiden,'Unraced horses must still have their maiden opportunities');
 assert.ok(allowance,'Prior winners must have a legitimate NW2/NW3 race program');
 assert.ok([1,2].includes(allowance.max_wins));
 assert.ok(allowance.field.length>=2);
 assert.ok(maiden.field.length>=2);
 assert.ok(allowance.field.every(id=>s.runtime.registered_horses.by_id[
  s.runtime.entries[id].horse_id].career.wins>=1));
 assert.ok(maiden.field.every(id=>s.runtime.registered_horses.by_id[
  s.runtime.entries[id].horse_id].career.wins===0));
 assert.ok([...maiden.field,...allowance.field].every(id=>
  s.runtime.entries[id].owner_id!==s.player.operation_id));
 const before=s;
 for(let i=0;i<15;i++)s=day(s);
 const completed=getGameRacingRoster(s,track).filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(completed.some(r=>r.conditions==='Allowance'),
  'Existing race resolution must actually settle a modeled allowance field');
 assert.ok(completed.some(r=>r.conditions==='Maiden Special Weight'));
 assert.ok(s.event_log.some(e=>e.kind==='RACE_SECRETARY_AND_TRAINER_PLAN'&&
  e.details.conditions==='Allowance'));
 assert.ok(s.event_log.some(e=>e.kind==='HORSE_MAIDEN_GRADUATED'));
 assert.equal(new Set(Object.values(s.runtime.entries).filter(e=>
  e.status!=='SCRATCHED').map(e=>e.id)).size,Object.values(s.runtime.entries).filter(e=>
   e.status!=='SCRATCHED').length);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
 // A full deterministic replay uses the same scenario mutations and one seed.
 let second=fresh();
 for(const h of winners){second.runtime.registered_horses.by_id[h.horse_id].career.wins=1;
  second.runtime.registered_horses.by_id[h.horse_id].career.starts=1}
 for(let i=0;i<16;i++)second=day(second);
 assert.deepEqual(second,s);
 console.info('WTW_1999_ALLOWANCE_LADDER_QA',JSON.stringify({
  start:before.clock.date,finish:s.clock.date,
  simulated_races:completed.map(x=>({id:x.id,conditions:x.conditions,
   runners:x.results?.length,winner:x.results?.[0]?.horse_id})),
  source_unchanged:d.horses.length,game_horses:horses.length}));
});
