import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 get1999HorseRaceOpportunities,RACE_OPPORTUNITY_SCHEMA,
 getGameRacingRoster} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {createPlaytestCareer} from '../public/1999/game/playtest-service.mjs';
import {jockeyBookingDecision,raceEligibility} from '../src/game/racing-1999.js';
import {shippingAssessment} from '../src/game/shipping-1999.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=read('../public/data/wtw-1999-founding-directory-v1.json');
const t=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const j=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...d.people,...t.trainers,...j.jockeys].map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'OWNER_RACE_ENTRY_ADVISOR_1999',
  source:'GAME_CAREER_PROJECTION_NOT_HISTORICAL_BOOKING',
  sha256:createHash('sha256').update('owner-entry-planner-1999-v1').digest('hex')},
 entities:{horses:d.horses,organizations:d.organizations,tracks:d.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:j.jockeys});
const command=(state,id,type,payload={},actor='system')=>
 dispatchGameCommand({state,world,command:{id,type,actor,payload}}).state;
const day=s=>command(s,'entry-advisor:day:'+s.clock.date,'ADVANCE_DAY');
const playerHorse=s=>Object.values(s.runtime.registered_horses.by_id).
 find(h=>h.owner_organization_id===s.player.operation_id&&h.host_track_id==='T-0017');
test('opening source-condition-book proposals never masquerade as actionable entries',()=>{
 const s=fresh(),h=playerHorse(s);assert.ok(h);
 const before=structuredClone(s),result=get1999HorseRaceOpportunities(s,world,h.horse_id);
 assert.equal(result.schema,RACE_OPPORTUNITY_SCHEMA);
 assert.equal(result.as_of,'1999-01-01');
 assert.ok(result.total>0);
 assert.ok(result.rows.every(r=>r.source_status==='MODELED_SOURCE_CONDITION_BOOK_PROPOSAL'&&
  r.status==='CONDITION_BOOK_PROPOSAL_NOT_ENTERABLE'));
 assert.ok(result.rows.every(r=>r.next_required_action==='WAIT_FOR_RACE_SECRETARY_OPENING'));
 assert.ok(result.rows.every(r=>r.available_jockeys.length===0));
 assert.ok(result.rows.every(r=>r.historical_results_claimed===false));
 assert.equal(Object.keys(s.runtime.races).length,0);
 assert.deepEqual(s,before);
 assert.throws(()=>get1999HorseRaceOpportunities(s,world,'H-FAKE'),e=>e.code==='RACE_OPPORTUNITY_QUERY');
 assert.throws(()=>get1999HorseRaceOpportunities(s,world,h.horse_id,{horizonDays:365}),
  e=>e.code==='RACE_OPPORTUNITY_QUERY');
});
test('real race opportunity tells player exact available selected jockeys, fees and rules without entering',()=>{
 const s=day(fresh()),h=playerHorse(s),before=structuredClone(s);
 const rows=get1999HorseRaceOpportunities(s,world,h.horse_id,{includeProposals:false}).rows;
 assert.ok(rows.length>=3);
 const ready=rows.find(r=>r.status==='PLAYER_CAN_ENTER'&&r.track_id===h.host_track_id);
 assert.ok(ready,JSON.stringify(rows.map(x=>({id:x.race_id,track:x.track_id,status:x.status,reason:x.eligibility_reasons}))));
 assert.equal(ready.player_controls_horse,true);
 assert.equal(ready.eligibility_reasons.length,0);
 assert.equal(ready.next_required_action,'ENTER_1999_RACE');
 assert.ok(ready.available_jockeys.length>0);
 assert.ok(ready.available_jockeys.every(j=>
  s.runtime.racing.jockeys[j.jockey_id]&&
  Number.isSafeInteger(j.fee_minor)&&j.fee_minor>0&&
  j.fee_minor===j.mount_fee_minor+j.travel_fee_minor&&
  (j.away_travel||j.travel_fee_minor===0)),
  'The owner quote must use the actual jockey booking model, never flat $60/$240 fees');
 assert.equal(ready.owner_cash_minor,s.runtime.finances.operation_balances_minor[h.owner_organization_id]);
 assert.equal(ready.source_status,'ACTUAL_GAME_RACE_ENTRIES_OPEN');
 assert.deepEqual(s,before,'Query must not create a booking or debit cash');
 let entered=command(s,'entry-advisor:player-entry','ENTER_1999_RACE',{
  race_id:ready.race_id,horse_id:h.horse_id},'player');
 const jockey=ready.available_jockeys.find(j=>j.owner_can_pay);
 assert.ok(jockey);
 entered=command(entered,'entry-advisor:player-jockey','BOOK_1999_JOCKEY',{
  race_id:ready.race_id,horse_id:h.horse_id,jockey_id:jockey.jockey_id},'player');
 const after=get1999HorseRaceOpportunities(entered,world,h.horse_id,{includeProposals:false}).rows.
  find(x=>x.race_id===ready.race_id);
 assert.equal(after.status,'ALREADY_ENTERED');
 assert.equal(after.booked_jockey_id,jockey.jockey_id);
 assert.equal(after.next_required_action,'NONE_BOOKED');
 assert.ok(entered.runtime.finances.operation_balances_minor[h.owner_organization_id]<
  s.runtime.finances.operation_balances_minor[h.owner_organization_id]);
 assert.deepEqual(importGameSave(exportGameSave(entered,world),world),entered);
});
test('away venue is a shipping requirement, not a fabricated entry or available mount',()=>{
 const s=day(fresh()),h=playerHorse(s);
 const view=get1999HorseRaceOpportunities(s,world,h.horse_id,{includeProposals:false});
 const away=view.rows.find(r=>r.status==='SHIPPING_REQUIRED'&&
  r.track_id!==h.host_track_id);
 if(!away){
  const inspected=view.rows.filter(r=>r.track_id!==h.host_track_id).
   map(row=>{
    const race=s.runtime.races[row.race_id];
    const eligible=race?raceEligibility(s,h,race):null;
    const shipping=Object.values(s.runtime.facilities.sites).
     filter(site=>site.type==='RACING_STABLE'&&site.host_track_id===row.track_id).
     map(site=>({site:site.id,...shippingAssessment(s,world,h.horse_id,site.id,
      {targetRaceId:race?.id})}));
    const jockeys=race?Object.values(s.runtime.racing.jockeys).reduce((n,rider)=>{
     const verdict=jockeyBookingDecision(s,world,race,h,rider);
     n[verdict.reason]=(n[verdict.reason]||0)+1;
     return n;
    },{}):{};
    return {id:row.race_id,track:row.track_id,status:row.status,
     reasons:row.eligibility_reasons,field:race?.field.length,
     capacity:race?.field_capacity,eligible,shipping:shipping.map(x=>({
      site:x.site,allowed:x.allowed,reasons:x.reasons,days:x.route?.days})),
     jockeyRejections:jockeys};
   });
  assert.fail('Shippable away horse must retain an accepting real jockey: '+
   JSON.stringify(inspected));
 }
 const approved=away.receiving_barn_options.find(s=>s.allowed);
 assert.ok(approved);
 assert.ok(approved.stalls_available>0);
 assert.ok(approved.travel_days>=1);
 assert.ok(approved.shipping_minor>0);
 assert.equal(away.next_required_action,'SHIP_1999_HORSE');
 assert.ok(away.eligibility_reasons.includes('NOT_PHYSICALLY_AT_TRACK_OR_CONFIRMED_TO_ARRIVE'));
 assert.equal(s.runtime.racing.horse_travel[h.horse_id],undefined);
 assert.equal(s.runtime.finances.ledger.some(l=>l.kind==='HORSE_OUTBOUND_SHIPPING_CHARGE'),false);
 const other=Object.values(s.runtime.registered_horses.by_id).find(x=>
  x.owner_organization_id!==s.player.operation_id&&x.host_track_id===away.track_id);
 assert.ok(other);
 const unauthorized=get1999HorseRaceOpportunities(s,world,other.horse_id,{
  includeProposals:false});
 assert.ok(unauthorized.rows.every(x=>x.status!=='PLAYER_CAN_ENTER'));
});
test('after a maiden victory the entry advisor recognizes NW2/NW3 proposals without mislabeling them real races',()=>{
 let s=fresh();for(let i=0;i<15;i++)s=day(s);
 const actual=getGameRacingRoster(s).filter(r=>r.status==='OFFICIAL_SIM_RESULT');
 assert.ok(actual.length>=3);
 const winner=s.runtime.registered_horses.by_id[actual[0].results[0].horse_id];
 assert.ok(winner.career.wins>=1);
 const view=get1999HorseRaceOpportunities(s,world,winner.horse_id,{
  horizonDays:21,includeProposals:true,limit:150});
 const allowance=view.rows.filter(r=>r.conditions==='Allowance'&&
  r.source_status==='MODELED_SOURCE_CONDITION_BOOK_PROPOSAL');
 assert.ok(allowance.length>0);
 assert.ok(allowance.every(r=>r.max_career_wins===1||r.max_career_wins===2));
 assert.ok(allowance.some(r=>!r.eligibility_reasons.includes('ALLOWANCE_REQUIRES_MAIDEN_VICTORY')));
 assert.ok(view.rows.filter(r=>r.conditions==='Maiden Special Weight').every(r=>
  r.eligibility_reasons.includes('MAIDEN_RESTRICTION')));
 const second=get1999HorseRaceOpportunities(s,world,winner.horse_id,{
  horizonDays:21,includeProposals:true,limit:150});
 assert.deepEqual(second,view);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
test('browser career service exposes same read-only owner race opportunities without changing save',async()=>{
 const service=await createPlaytestCareer({directory:d,trainers:t,jockeys:j,cohort});
 const h=service.view().stable.find(x=>x.host_track_id==='T-0017');
 assert.ok(h);
 const before=service.getSave();
 const value=service.getRaceOpportunities(h.horse_id,{horizonDays:8});
 assert.equal(value.schema,RACE_OPPORTUNITY_SCHEMA);
 assert.ok(value.rows.length>0);
 assert.equal(service.getSave(),before);
 service.advanceDay();
 const next=service.getRaceOpportunities(h.horse_id,{includeProposals:false});
 assert.ok(next.rows.some(x=>x.source_status==='ACTUAL_GAME_RACE_ENTRIES_OPEN'));
 assert.equal(service.state.clock.date,'1999-01-02');
});
