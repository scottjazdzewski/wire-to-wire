import test from 'node:test';
import assert from 'node:assert/strict';
import {createRacingRuntime,validateRacingRuntime}
 from '../src/game/racing-1999.js';
import {advance1999JockeyWorkforce,get1999JockeyCareerRankings}
 from '../public/1999/engine/jockey-lifecycle-1999.mjs';
import {assessJockeySchedule}
 from '../public/1999/engine/jockey-engagements-1999.mjs';
const T='T-0017',OLD='P-SOURCE-OLDER',YOUNG='P-SOURCE-YOUNGER';
const OWNER='O-REAL',H='H-1999',R='R-2000-JAN-BOOKED';
const world={start_date:'1999-01-01',entities:{
 tracks:[{id:T,location:{state:'Florida',country:'USA'}}],
 people:[
  {id:OLD,name:'Morgan Field',role:'jockey',dateOfBirth:'1941-03-10',workplaceId:T},
  {id:YOUNG,name:'Patrick Stone',role:'jockey',dateOfBirth:'1978-02-15',workplaceId:T}
 ]}};
function agent(id){return {id,home_track_id:T,tier:'REGIONAL',
 starts:30,wins:6,game_reputation:.55,skills:{
 judgment:.68,pace:.69,finish:.71,horse_handling:.72,composure:.7}};}
function fixture(seed,{paidFuture=false}={}){
 const rt=createRacingRuntime();
 rt.jockeys={[OLD]:agent(OLD),[YOUNG]:agent(YOUNG)};
 rt.jockey_finances_minor={[OLD]:30000,[YOUNG]:15000};
 const entries={},races={};
 if(paidFuture){
  races[R]={id:R,date:'2000-01-10',track_id:T,status:'ENTRIES_OPEN'};
  entries[R+':'+H]={id:R+':'+H,horse_id:H,race_id:R,
   owner_id:OWNER,jockey_id:OLD,status:'BOOKED',
   fee_minor:9000,mount_fee_minor:9000,
   premier_signing_bonus_minor:0};
 }
 return {rng:{seed},clock:{date:'2000-01-01',days_elapsed:365},
  player:{operation_id:OWNER,role:'owner'},
  runtime:{racing:rt,entries,races,
   horse:{},facilities:{sites:{}},registered_horses:{by_id:{
    [H]:{horse_id:H,owner_organization_id:OWNER}
   }},finances:{balance_minor:100000,
    operation_balances_minor:{[OWNER]:100000},ledger:[]}}};
}
const evolve=s=>{
 const events=[];
 const result=advance1999JockeyWorkforce({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 return {result,events};
};
test('annual retirement preserves permanent IDs/results; real prepaid mount refunded and apprentice usable',()=>{
 const s=fixture(19990101,{paidFuture:true});
 const out=evolve(s);
 assert.equal(out.result.retired,1);
 assert.equal(out.result.entered,1);
 assert.equal(s.runtime.racing.jockeys[OLD].career_status,'RETIRED');
 assert.equal(s.runtime.racing.jockeys[OLD].retired_date,'2000-01-01');
 assert.equal(s.runtime.racing.jockeys[OLD].starts,30);
 assert.equal(s.runtime.racing.jockeys[OLD].wins,6);
 assert.equal(s.runtime.entries[R+':'+H].status,'ENTERED');
 assert.equal(s.runtime.entries[R+':'+H].cancelled_jockey_id,OLD);
 assert.equal(s.runtime.entries[R+':'+H].refunded_minor,9000);
 assert.equal(s.runtime.finances.operation_balances_minor[OWNER],109000);
 assert.equal(s.runtime.racing.jockey_finances_minor[OLD],21000);
 const ids=Object.keys(s.runtime.racing.generated_jockeys);
 assert.equal(ids.length,1);
 const id=ids[0];
 assert.match(id,/^P-GAME-JOCKEY-2000-00001$/);
 const rookie=s.runtime.racing.generated_jockeys[id];
 assert.equal(rookie.workplaceId,T);
 assert.ok(rookie.name.length>3);
 assert.equal(s.runtime.racing.jockeys[id].career_status,'ACTIVE');
 const race={id:'R-2000-ROOKIE',date:'2000-01-12',track_id:T};
 assert.equal(assessJockeySchedule(s,world,s.runtime.racing.jockeys[id],race).allowed,true);
 assert.equal(assessJockeySchedule(s,world,s.runtime.racing.jockeys[OLD],race).reason,
  'JOCKEY_RETIRED');
 const rank=get1999JockeyCareerRankings({state:s,world});
 assert.ok(rank.some(x=>x.id===id&&x.name===rookie.name));
 assert.ok(rank.some(x=>x.id===OLD&&x.career_status==='RETIRED'));
 const saved=JSON.parse(JSON.stringify(s));
 validateRacingRuntime(saved,world);
 assert.deepEqual(evolve(saved).result,{year:2000,retired:0,entered:0,changed:false});
 assert.deepEqual(saved,s,'one annual transition per career year, no double payment');
});
test('1999 source names and original identities never replaced by annual rookies',()=>{
 const s=fixture(19990101);
 const before=JSON.stringify(world);
 evolve(s);
 assert.equal(JSON.stringify(world),before);
 const i=s.runtime.racing.generated_jockeys;
 assert.ok(Object.values(i).every(x=>!world.entities.people.some(p=>p.id===x.id)));
 assert.ok(s.runtime.racing.jockeys[YOUNG]);
 assert.equal(s.runtime.racing.jockeys[YOUNG].starts,30);
});
test('2000 to 2030 multiple seeds: active workforce stays finite and saved identities survive reopen',()=>{
 for(const seed of [19990101,11223344,99887766]){
  let s=fixture(seed);
  const identities=new Set(Object.keys(s.runtime.racing.jockeys));
  for(let year=2000;year<=2030;year++){
   s.clock.date=year+'-01-01';
   const {result}=evolve(s);
   assert.equal(result.year,year);
   assert.equal(result.retired,result.entered,
    'each retirement opens exactly one real rookie apprenticeship');
   for(const id of Object.keys(s.runtime.racing.jockeys))identities.add(id);
   assert.equal(Object.values(s.runtime.racing.jockeys).
    filter(j=>j.career_status!=='RETIRED').length,2);
   assert.ok(Object.keys(s.runtime.racing.jockeys).length<=64,
    'retired history grows only from actual bounded replacements');
   assert.equal(new Set(Object.keys(s.runtime.racing.jockeys)).size,
    Object.keys(s.runtime.racing.jockeys).length);
   validateRacingRuntime(s,world);
   s=JSON.parse(JSON.stringify(s));
   assert.equal(Object.keys(s.runtime.racing.jockeys).length,identities.size);
  }
  assert.ok(identities.size>2,'new jockey identities enter actual game each seed');
  assert.equal(s.runtime.racing.last_workforce_year,2030);
  assert.deepEqual(JSON.parse(JSON.stringify(s.runtime.racing.generated_jockeys)),
   s.runtime.racing.generated_jockeys);
 }
});
