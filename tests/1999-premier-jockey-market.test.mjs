import test from 'node:test';
import assert from 'node:assert/strict';
import {racingAction,createRacingRuntime,
 resolve1999PremierJockeyOffers,compact1999PremierJockeyOffers,jockeyBookingDecision}
 from '../src/game/racing-1999.js';
import {premierOfferId,scorePremierJockeyOffer,premierBonusCap}
 from '../public/1999/engine/jockey-premier-market-1999.mjs';
import {get1999JockeyPartnership}
 from '../public/1999/engine/jockey-partnerships-1999.mjs';
import {book1999LostPremierFallbacks}
 from '../src/game/race-agents-1999.js';
import {quote1999PlayerRacePlan,confirm1999PlayerRacePlan}
 from '../src/game/player-race-plan-1999.js';
import {get1999HorseRaceOpportunities} from '../src/game/race-opportunities-1999.js';

const raceId='R-1999-MODELED-G1-01',jockeyId='P-1999-ELITE-J-01';
const ownerIds=['O-1999-RIVAL-A','O-1999-RIVAL-B'];
const horseIds=['H-1999-G1-CONTENDER-A','H-1999-G1-CONTENDER-B'];
const trainerIds=['P-1999-TRAINER-A','P-1999-TRAINER-B'];
const riders=['P-1999-ELITE-J-01','P-1999-ELITE-J-02'];
const world={entities:{tracks:[{id:'T-0017',location:{state:'Florida',country:'USA'}}],people:[]}};
function fixture(){
 const rt=createRacingRuntime();
 rt.jockeys=Object.fromEntries(riders.map((id,i)=>[id,{
  id,home_track_id:'T-0017',tier:'ELITE',starts:0,wins:0,
  skills:{judgment:.92,horse_handling:.95,finish:.9,pace:.86,composure:.86},
  game_reputation:.84
 }]));
 rt.jockey_finances_minor=Object.fromEntries(riders.map(id=>[id,0]));
 const race={id:raceId,date:'1999-01-12',track_id:'T-0017',
  age:'3YO+',sex:'OPEN',conditions:'Handicap',
  surface:'DIRT',distance_furlongs:8,
  stake_id:'WTW-MODELED-G1',stake_source_status:'MODELED',
  stakes_grade:'G1',canonical:false,maiden:false,max_wins:null,
  purse_minor:50000000,escrow_minor:50000000,
  field_capacity:12,status:'ENTRIES_OPEN',field:[],results:null,
  source:'WTW_1999_TRACK_SPECIFIC_MEET_PROGRESSION'};
 const horses={},care={};
 for(let i=0;i<2;i++){
  const id=horseIds[i];
  horses[id]={horse_id:id,foaling_year:1996,sex:'COLT',
   trainer_id:trainerIds[i],owner_organization_id:ownerIds[i],
   home_track_id:'T-0017',host_track_id:'T-0017',
   current_residence_id:'F-1999-LOCAL-BARN',
   starting_attributes:{current_ability:i===0?96:79,
    potential_ability:94,temperament:.88,dirt_aptitude:.87,
    turf_aptitude:.62,route_aptitude:.9,sprint_aptitude:.75},
   career:{starts:1,wins:1,earnings_minor:1500000}};
  care[id]={policy:{feed:'HAY',care:'BALANCED',monthly_budget_minor:90000},
   finance:{spent_minor:0},history:[],
   training:{readiness:.95,fitness:.89,fatigue:.02,confidence:.85,
    stress:.1,currentRisk:.01,sorenessDays:0,speedCondition:.91,
    staminaCondition:.88}};
 }
 return {revision:0,rng:{seed:19990101},clock:{date:'1999-01-02',days_elapsed:1},
  player:{role:'owner',operation_id:ownerIds[0]},
  runtime:{racing:rt,registered_horses:{by_id:horses},
   horse:care,people:{},facilities:{sites:{
    'F-1999-LOCAL-BARN':{id:'F-1999-LOCAL-BARN',
     host_track_id:'T-0017',quality:.9,status:'ACTIVE'}}},
   finances:{balance_minor:10000000,
    operation_balances_minor:{[ownerIds[0]]:10000000,
     [ownerIds[1]]:10000000},ledger:[]},
   races:{[raceId]:race},entries:{}}};
}
function actions(s){
 const events=[];
 const act=(type,payload,actor='system')=>racingAction({
  state:s,world,command:{type,payload,actor},
  emit:(kind,details)=>events.push({kind,details})});
 return {act,events};
}
function entrants(s){
 const {act,events}=actions(s);
 for(let i=0;i<2;i++)
  act('ENTER_1999_RACE',{race_id:raceId,horse_id:horseIds[i]},
   i===0?'player':'system');
 return {act,events};
}
test('two rival owners can offer premier mount; no owner or jockey pays before jockey selects',()=>{
 const s=fixture(),{act,events}=entrants(s);
 const quote=jockeyBookingDecision(s,world,s.runtime.races[raceId],
  s.runtime.registered_horses.by_id[horseIds[0]],
  s.runtime.racing.jockeys[jockeyId]);
 assert.equal(quote.accept,true,quote.reason);
 assert.ok(premierBonusCap(quote.quote)>80000);
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[0],
  jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[1],
  jockey_id:jockeyId,bonus_minor:120000},'system');
 assert.equal(Object.keys(s.runtime.racing.premier_offers).length,2);
 assert.ok(Object.values(s.runtime.racing.premier_offers).every(x=>x.status==='PENDING'));
 assert.equal(s.runtime.finances.ledger.length,0);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerIds[0]],10000000);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerIds[1]],10000000);
 assert.equal(resolve1999PremierJockeyOffers({state:s,world,emit:()=>{}}).signed,0);
 assert.ok(events.filter(x=>x.kind==='JOCKEY_PREMIER_OFFER_SUBMITTED').length===2);
 assert.throws(()=>act('BOOK_1999_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId},'player'),/competing offer/i);
});
test('at four-day major-race deadline best quality and relationships win: one signed mount, one debit, loser notified',()=>{
 const s=fixture(),{act,events}=entrants(s);
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[0],
  jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[1],
  jockey_id:jockeyId,bonus_minor:120000},'system');
 const start=JSON.parse(JSON.stringify(s));
 s.clock.date='1999-01-08';
 const summary=resolve1999PremierJockeyOffers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 assert.deepEqual(summary,{signed:1,declined:1,pending:0});
 const offer=Object.values(s.runtime.racing.premier_offers),
  signed=offer.find(x=>x.status==='SIGNED'),
  loser=offer.find(x=>x.status==='DECLINED');
 assert.ok(signed&&loser);
 assert.equal(signed.horse_id,horseIds[0],
  'Better horse must win despite rival offering somewhat more cash');
 assert.equal(loser.reason,'RIVAL_HORSE_WON_PREMIER_RIDE');
 assert.equal(loser.winning_horse_id,horseIds[0]);
 const entry=s.runtime.entries[raceId+':'+horseIds[0]];
 assert.equal(entry.status,'BOOKED');
 assert.equal(entry.jockey_id,jockeyId);
 assert.equal(entry.premier_signing_bonus_minor,80000);
 assert.equal(s.runtime.entries[raceId+':'+horseIds[1]].status,'ENTERED');
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_FEE_RECEIVED').length,1);
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_MOUNT_AND_TRAVEL_FEE').length,1);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerIds[1]],10000000);
 assert.equal(s.runtime.racing.jockey_finances_minor[jockeyId],entry.fee_minor);
 assert.ok(events.some(e=>e.kind==='JOCKEY_PREMIER_OFFER_SIGNED'));
 assert.ok(events.some(e=>e.kind==='JOCKEY_PREMIER_OFFER_DECLINED'));
 const again=resolve1999PremierJockeyOffers({state:s,world,emit:()=>{}});
 assert.deepEqual(again,{signed:0,declined:0,pending:0});
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_FEE_RECEIVED').length,1);
 // The offer source and decision are permanent, not a new synthetic table.
 const clone=JSON.parse(JSON.stringify(s));
 assert.deepEqual(clone.runtime.racing.premier_offers,s.runtime.racing.premier_offers);
 assert.deepEqual(clone.runtime.entries,s.runtime.entries);
 assert.equal(start.runtime.finances.ledger.length,0);
});
test('pending offers can be raised but cannot be paid early, late, or above the cap',()=>{
 const s=fixture(),{act}=entrants(s);
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[0],
  jockey_id:jockeyId,bonus_minor:25000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[0],
  jockey_id:jockeyId,bonus_minor:50000},'player');
 assert.equal(s.runtime.racing.premier_offers[premierOfferId(
  raceId,horseIds[0],jockeyId)].bonus_minor,50000);
 assert.throws(()=>act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId,bonus_minor:20000},'player'));
 assert.throws(()=>act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:250001},'system'));
 s.clock.date='1999-01-08';
 assert.throws(()=>act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:10000},'system'));
 assert.equal(s.runtime.finances.ledger.length,0);
});
test('real past partnerships affect major-race competing offers even with equal bids',()=>{
 const s=fixture(),{act,events}=entrants(s),r=s.runtime.races[raceId];
 const prior={id:'R-1999-PRIOR',date:'1999-01-01',track_id:r.track_id,
  status:'OFFICIAL_SIM_RESULT',results:[],purse_minor:2000000};
 s.runtime.races[prior.id]=prior;
 // Add an authentic completed previous team effort for the less-favored
 // horse; no fake relationship is inserted into any permanent profile.
 s.runtime.entries[prior.id+':'+horseIds[1]]={
  id:prior.id+':'+horseIds[1],race_id:prior.id,
  horse_id:horseIds[1],owner_id:ownerIds[1],trainer_id:trainerIds[1],
  jockey_id:jockeyId,status:'RESULTED',finish:1};
 prior.results.push({horse_id:horseIds[1],jockey_share_minor:12000});
 const bond=get1999JockeyPartnership(s,{
  trainerId:trainerIds[1],ownerId:ownerIds[1],jockeyId});
 assert.ok(bond.trainerMounts>0&&bond.trainerWins>0);
 const first=s.runtime.registered_horses.by_id[horseIds[0]],
  second=s.runtime.registered_horses.by_id[horseIds[1]],
  jockey=s.runtime.racing.jockeys[jockeyId],
  quote=jockeyBookingDecision(s,world,r,first,jockey).quote;
 const old=scorePremierJockeyOffer({horse:first,jockey,race:r,
  partnership:get1999JockeyPartnership(s,{trainerId:trainerIds[0],
   ownerId:ownerIds[0],jockeyId}),quote,bonus_minor:10000});
 const won=scorePremierJockeyOffer({horse:second,jockey,race:r,
  partnership:bond,quote,bonus_minor:10000});
 assert.ok(won.relationshipIndex>old.relationshipIndex);
 assert.equal(s.runtime.racing.premier_offers&&
  Object.keys(s.runtime.racing.premier_offers).length,0);
});

test('real owner atomic race-plan quote offers an elite mount without prematurely taking the jockey fee',()=>{
 const s=fixture(),events=[];
 const payload={horse_id:horseIds[0],race_id:raceId,
  jockey_id:jockeyId,bonus_minor:70000};
 const quoted=quote1999PlayerRacePlan(s,world,payload);
 assert.equal(quoted.can_confirm,true,JSON.stringify(quoted.blockers));
 assert.equal(quoted.premier_offer_required,true);
 assert.equal(quoted.offer_bonus_minor,70000);
 assert.equal(quoted.premier_decision_due_date,'1999-01-08');
 assert.equal(quoted.immediate_total_minor,0,
  'Home-stable player rider offer may not debit jockey before signature');
 assert.ok(quoted.potential_jockey_if_signed_minor>70000);
 assert.equal(quoted.total_if_signed_minor,quoted.potential_jockey_if_signed_minor);
 assert.equal(s.runtime.finances.ledger.length,0);
 const committed=confirm1999PlayerRacePlan({state:s,world,
  command:{actor:'player',payload:{
   ...payload,expected_revision:0,
   maximum_total_minor:quoted.total_if_signed_minor}},
  emit:(kind,details)=>events.push({kind,details})});
 assert.equal(committed,undefined);
 assert.ok(events.some(e=>e.kind==='PLAYER_PREMIER_RIDE_OFFER_SUBMITTED'));
 assert.equal(events.filter(e=>e.kind==='PLAYER_RACE_PLAN_CONFIRMED').length,0);
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].status,'ENTERED');
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].jockey_id,null);
 const offer=s.runtime.racing.premier_offers[premierOfferId(
  raceId,horseIds[0],jockeyId)];
 assert.equal(offer.status,'PENDING');
 assert.equal(offer.maximum_jockey_fee_minor,quoted.total_if_signed_minor);
 assert.equal(s.runtime.finances.ledger.length,0);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerIds[0]],10000000);
 const prior=JSON.parse(JSON.stringify(s));
 assert.deepEqual(prior.runtime.racing.premier_offers,s.runtime.racing.premier_offers);
 // The owner can authorize only what was quoted, not a later surprise fee.
 const forbidden=fixture(),bad=quote1999PlayerRacePlan(forbidden,world,
  {...payload,bonus_minor:250001});
 assert.equal(bad.can_confirm,false);
 assert.ok(bad.blockers.some(b=>b.code==='PREMIER_OFFER_BONUS'));
});
test('ordinary nonelite rider remains immediately bookable and paid, no premier offer needed',()=>{
 const s=fixture(),horse=s.runtime.registered_horses.by_id[horseIds[0]];
 const normal='P-1999-LOCAL-JOCKEY-03';
 s.runtime.racing.jockeys[normal]={
  id:normal,home_track_id:'T-0017',tier:'REGIONAL',starts:0,wins:0,
  skills:{judgment:.85,horse_handling:.87,finish:.78,pace:.79,composure:.82},
  game_reputation:.65};
 s.runtime.racing.jockey_finances_minor[normal]=0;
 const r=s.runtime.races[raceId];
 r.conditions='Allowance';r.stake_id=null;r.stake_source_status=null;
 r.stakes_grade=null;r.purse_minor=4500000;r.max_wins=1;
 const p={horse_id:horse.horse_id,race_id:raceId,jockey_id:normal};
 const quote=quote1999PlayerRacePlan(s,world,p);
 assert.equal(quote.can_confirm,true,JSON.stringify(quote.blockers));
 assert.equal(quote.premier_offer_required,false);
 assert.ok(quote.jockey_booking_minor>0);
 assert.equal(quote.immediate_total_minor,quote.jockey_booking_minor);
 confirm1999PlayerRacePlan({state:s,world,
  command:{actor:'player',payload:{...p,expected_revision:0,
   maximum_total_minor:quote.total_if_signed_minor}},emit:()=>{}});
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].status,'BOOKED');
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].jockey_id,normal);
 assert.equal(Object.keys(s.runtime.racing.premier_offers).length,0);
 assert.equal(s.runtime.finances.ledger.filter(x=>
  x.kind==='JOCKEY_MOUNT_AND_TRAVEL_FEE').length,1);
});

test('winning elite jockey signs separate races on same card without requiring a different rider per mount',()=>{
 const s=fixture(),{act,events}=actions(s);
 const second='R-1999-MODELED-G1-02';
 s.runtime.races[second]={...structuredClone(s.runtime.races[raceId]),
  id:second,purse_minor:42000000,escrow_minor:42000000,field:[]};
 act('ENTER_1999_RACE',{race_id:raceId,horse_id:horseIds[0]},'player');
 act('ENTER_1999_RACE',{race_id:second,horse_id:horseIds[1]},'system');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:second,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:80000},'system');
 s.clock.date='1999-01-08';
 const result=resolve1999PremierJockeyOffers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 assert.deepEqual(result,{signed:2,declined:0,pending:0});
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].jockey_id,jockeyId);
 assert.equal(s.runtime.entries[second+':'+horseIds[1]].jockey_id,jockeyId);
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].status,'BOOKED');
 assert.equal(s.runtime.entries[second+':'+horseIds[1]].status,'BOOKED');
 assert.equal(s.runtime.finances.ledger.filter(x=>x.kind==='JOCKEY_FEE_RECEIVED').length,2);
 assert.equal(events.filter(e=>e.kind==='JOCKEY_PREMIER_OFFER_SIGNED').length,2);
 const trackAndDate=new Set([s.runtime.races[raceId],s.runtime.races[second]].
  map(r=>r.track_id+'|'+r.date));
 assert.equal(trackAndDate.size,1,'Same jockey can work an entire card at one track');
});

test('decades of saved jockey offers cannot fill the live save with old declined bids or erase signed mounts',()=>{
 const s=fixture(),{act}=entrants(s);
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[0],
  jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,horse_id:horseIds[1],
  jockey_id:jockeyId,bonus_minor:110000},'system');
 s.clock.date='1999-01-08';
 const result=resolve1999PremierJockeyOffers({state:s,world,emit:()=>{}});
 assert.equal(result.signed,1);
 const paidBefore=structuredClone(s.runtime.finances.ledger);
 const signedBefore=structuredClone(s.runtime.entries[raceId+':'+horseIds[0]]);
 assert.equal(Object.keys(s.runtime.racing.premier_offers).length,2);
 s.clock.date='1999-07-15';
 const compact=compact1999PremierJockeyOffers({state:s,emit:()=>{}});
 assert.deepEqual(compact,{removed:2,retained:0});
 assert.deepEqual(s.runtime.finances.ledger,paidBefore,
  'The actual rider fee and owner debit must remain permanent');
 assert.deepEqual(s.runtime.entries[raceId+':'+horseIds[0]],signedBefore,
  'Accepted signed mounts must survive removal of the old proposal record');
 assert.deepEqual(compact1999PremierJockeyOffers({state:s,emit:()=>{}}),
  {removed:0,retained:0});
 const saved=JSON.parse(JSON.stringify(s));
 assert.equal(Object.keys(saved.runtime.racing.premier_offers).length,0);
 assert.deepEqual(saved.runtime.entries,s.runtime.entries);
});

test('losing AI trainer hires affordable real alternate after G1 bid without affecting the winner',()=>{
 const s=fixture(),{act,events}=entrants(s);
 const alternate='P-1999-LOCAL-FALLBACK-01';
 s.runtime.racing.jockeys[alternate]={id:alternate,
  home_track_id:'T-0017',tier:'REGIONAL',starts:0,wins:0,
  skills:{judgment:.96,horse_handling:.95,finish:.91,pace:.89,composure:.87},
  game_reputation:.76};
 s.runtime.racing.jockey_finances_minor[alternate]=0;
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:120000},'system');
 s.clock.date='1999-01-08';
 assert.deepEqual(resolve1999PremierJockeyOffers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})}),
  {signed:1,declined:1,pending:0});
 const loser=s.runtime.entries[raceId+':'+horseIds[1]];
 assert.equal(loser.status,'ENTERED');
 const before=s.runtime.finances.operation_balances_minor[ownerIds[1]];
 const result=book1999LostPremierFallbacks({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 assert.deepEqual(result,{booked:1,unavailable:0,playerDecisions:0});
 assert.equal(loser.status,'BOOKED');
 assert.equal(loser.jockey_id,alternate);
 assert.ok(loser.fee_minor>0);
 assert.equal(before-s.runtime.finances.operation_balances_minor[ownerIds[1]],
  loser.fee_minor,'Only actually signed fallback mount charges rival owner');
 assert.equal(s.runtime.racing.jockey_finances_minor[alternate],loser.fee_minor);
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].jockey_id,jockeyId);
 assert.ok(events.some(e=>e.kind==='AI_PREMIER_FALLBACK_BOOKED'));
 const ledger=structuredClone(s.runtime.finances.ledger);
 assert.deepEqual(book1999LostPremierFallbacks({state:s,world,emit:()=>{}}),
  {booked:0,unavailable:0,playerDecisions:0},
  'Fallback cannot rebook or double-charge a horse already booked');
 assert.deepEqual(s.runtime.finances.ledger,ledger);
 assert.deepEqual(JSON.parse(JSON.stringify(s.runtime.entries)),s.runtime.entries);
});
test('player loses rival G1 bid: must choose own replacement, no AI booking, no debit',()=>{
 const s=fixture(),{act,events}=entrants(s);
 // Make the rival an objectively better prospect and higher offer.
 s.runtime.registered_horses.by_id[horseIds[0]].
  starting_attributes.current_ability=65;
 s.runtime.registered_horses.by_id[horseIds[1]].
  starting_attributes.current_ability=98;
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:120000},'system');
 s.clock.date='1999-01-08';
 assert.equal(resolve1999PremierJockeyOffers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})}).signed,1);
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].status,'ENTERED');
 const before=s.runtime.finances.operation_balances_minor[ownerIds[0]];
 const result=book1999LostPremierFallbacks({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 assert.deepEqual(result,{booked:0,unavailable:0,playerDecisions:1});
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].jockey_id,null);
 assert.equal(s.runtime.finances.operation_balances_minor[ownerIds[0]],before);
 assert.ok(events.some(e=>e.kind==='PLAYER_PREMIER_FALLBACK_AVAILABLE'));
});

test('owner who loses the G1 jockey signs a REAL replacement on existing entry with only one new payment',()=>{
 const s=fixture(),{act,events}=entrants(s);
 s.runtime.registered_horses.by_id[horseIds[0]].
  starting_attributes.current_ability=65;
 s.runtime.registered_horses.by_id[horseIds[1]].
  starting_attributes.current_ability=98;
 const regular='P-1999-FALLBACK-REGIONAL-03';
 s.runtime.racing.jockeys[regular]={id:regular,
  home_track_id:'T-0017',tier:'REGIONAL',starts:0,wins:0,
  skills:{judgment:.97,horse_handling:.94,finish:.91,pace:.87,composure:.93},
  game_reputation:.75};
 s.runtime.racing.jockey_finances_minor[regular]=0;
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[0],jockey_id:jockeyId,bonus_minor:80000},'player');
 act('OFFER_1999_PREMIER_JOCKEY',{race_id:raceId,
  horse_id:horseIds[1],jockey_id:jockeyId,bonus_minor:120000},'system');
 s.clock.date='1999-01-08';
 resolve1999PremierJockeyOffers({state:s,world,
  emit:(kind,details)=>events.push({kind,details})});
 const priorEntry=s.runtime.entries[raceId+':'+horseIds[0]];
 assert.equal(priorEntry.status,'ENTERED');
 assert.equal(priorEntry.jockey_id,null);
 const rows=get1999HorseRaceOpportunities(s,world,horseIds[0],
  {includeProposals:false}).rows;
 const opportunity=rows.find(r=>r.race_id===raceId);
 assert.ok(opportunity,'Existing race entry must remain in read-only advisor');
 assert.equal(opportunity.status,'PREMIER_REPLACEMENT_REQUIRED');
 assert.equal(opportunity.next_required_action,'BOOK_1999_JOCKEY');
 assert.ok(opportunity.available_jockeys.some(r=>r.jockey_id===regular));
 assert.ok(opportunity.available_jockeys.every(r=>!r.premier_offer_required),
  'Late, already-closed elite auctions cannot appear as valid choices');
 const quote=quote1999PlayerRacePlan(s,world,{
  horse_id:horseIds[0],race_id:raceId,jockey_id:regular});
 assert.equal(quote.can_confirm,true,JSON.stringify(quote.blockers));
 assert.equal(quote.existing_entry_fallback,true);
 assert.equal(quote.outbound_shipping_minor,0);
 assert.equal(quote.jockey_booking_minor,quote.immediate_total_minor);
 const entryId=priorEntry.id,ledgerBefore=s.runtime.finances.ledger.length,
  balanceBefore=s.runtime.finances.operation_balances_minor[ownerIds[0]];
 confirm1999PlayerRacePlan({state:s,world,command:{actor:'player',
  payload:{horse_id:horseIds[0],race_id:raceId,jockey_id:regular,
   expected_revision:0,maximum_total_minor:quote.total_if_signed_minor}},
  emit:(kind,details)=>events.push({kind,details})});
 assert.equal(s.runtime.entries[raceId+':'+horseIds[0]].id,entryId);
 assert.equal(s.runtime.races[raceId].field.filter(id=>id===entryId).length,1,
  'Owner cannot pay to enter an existing race twice');
 assert.equal(s.runtime.entries[entryId].status,'BOOKED');
 assert.equal(s.runtime.entries[entryId].jockey_id,regular);
 assert.equal(balanceBefore-s.runtime.finances.operation_balances_minor[ownerIds[0]],
  quote.jockey_booking_minor);
 assert.equal(s.runtime.finances.ledger.length-ledgerBefore,2,
  'Owner booking and rider receipt are one balanced pair of entries');
 assert.ok(events.some(e=>e.kind==='PLAYER_PREMIER_REPLACEMENT_JOCKEY_BOOKED'));
 assert.deepEqual(JSON.parse(JSON.stringify(s.runtime.entries)),s.runtime.entries);
});
