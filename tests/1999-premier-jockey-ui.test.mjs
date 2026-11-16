import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL(
 '../public/next/1999-player-race-planning.mjs',import.meta.url),'utf8');

function makeScreen(premier,{replacement=false}={}){
 const commands=[],quotes=[];
 const rider={jockey_id:'P-1999-ELITE-J-01',home_track_id:'T-0017',
  fee_minor:105000,owner_can_pay:true,away_travel:false,
  premier_offer_required:premier,maximum_signing_bonus_minor:250000};
 const opportunity={race_id:'R-1999-MODELED-G1-01',date:'1999-01-12',
  track_id:'T-0017',conditions:premier?'Stakes — G1':'Allowance',
  surface:'DIRT',distance_furlongs:8,purse_minor:50000000,
  capacity:12,entries:0,source_status:'ACTUAL_GAME_RACE_ENTRIES_OPEN',
  eligibility_reasons:[],status:replacement?'PREMIER_REPLACEMENT_REQUIRED':'PLAYER_CAN_ENTER',
  available_jockeys:[rider],receiving_barn_options:[]};
 const game={
  view:()=>({stable:[{horse_id:'H-1999-ONE',name:'Win Candidate',
   condition:{readiness:.94}}],races:[{id:opportunity.race_id,
   track_id:'T-0017'}],people:[{id:rider.jockey_id,name:'Elite Rider'}]}),
  state:{runtime:{facilities:{sites:{}}}},
  getRaceOpportunities:()=>({rows:[opportunity]}),
  getRacePlanQuote:opts=>{
   quotes.push({...opts});
   return {can_confirm:true,blockers:[],
    race_id:opportunity.race_id,race_date:opportunity.date,
    expected_revision:4,premier_offer_required:premier,
    existing_entry_fallback:replacement,
    offer_bonus_minor:premier?opts.bonus_minor:0,
    potential_jockey_if_signed_minor:premier?105000+opts.bonus_minor:0,
    total_if_signed_minor:premier?105000+opts.bonus_minor:105000,
    immediate_total_minor:premier?0:105000,
    jockey_booking_minor:premier?0:105000,
    premier_decision_due_date:premier?'1999-01-08':null,
    outbound_shipping_minor:0,owner_cash_minor:10000000,
    cash_after_booking_minor:premier?10000000:9895000,
    estimated_return_shipping_minor:0};
  },
  submit:async(type,payload,actor)=>{commands.push({type,payload,actor})}
 };
 const window={__WTW_1999_UI_DATA__:{gameplayService:game},
  __WTW_NEXT__:{paint:()=>{}},confirm:()=>true};
 const context=vm.createContext({window,location:{search:''},Intl,Date,
  Number,Math,JSON,String,Array,Set,Map,Object});
 vm.runInContext(source,context,{filename:'1999-player-race-planning.mjs'});
 return {api:window.WTW1999PlayerRacePlans,commands,quotes};
}
test('premier Race Entry Desk changes the actual signing bonus and authorizes the FULL possible charge, without a false booked confirmation',async()=>{
 const {api,commands,quotes}=makeScreen(true);
 const initial=api.render();
 assert.match(initial,/PREMIER SIGNING BONUS \(PAID ONLY IF SELECTED\)/);
 assert.match(initial,/JOCKEY COST IF OFFER WINS/);
 assert.match(initial,/SUBMIT PREMIER OFFER/);
 assert.match(initial,/JOCKEY FEE PAID NOW/);
 assert.match(initial,/\$0\.00/);
 assert.equal(api.select('race-plan-bonus','50000'),true);
 assert.equal(api.current().bonusMinor,50000);
 assert.match(api.render(),/MAX TOTAL IF SIGNED/);
 await api.confirm();
 assert.equal(commands.length,1);
 assert.equal(commands[0].type,'CONFIRM_1999_RACE_PLAN');
 assert.equal(commands[0].actor,'player');
 assert.equal(commands[0].payload.bonus_minor,50000);
 assert.equal(commands[0].payload.maximum_total_minor,155000);
 assert.equal(commands[0].payload.expected_revision,4);
 assert.ok(quotes.some(q=>q.bonus_minor===50000));
 assert.match(api.current().notice,/PREMIER OFFER SUBMITTED/);
 assert.doesNotMatch(api.current().notice,/jockey booked/i);
});
test('normal local jockeys still use immediate paid confirmation on the original Race Entry Desk',async()=>{
 const {api,commands}=makeScreen(false);
 const initial=api.render();
 assert.doesNotMatch(initial,/PREMIER SIGNING BONUS/);
 assert.match(initial,/CONFIRM ENTRY & PAY \$1,050\.00/);
 await api.confirm();
 assert.equal(commands.length,1);
 assert.equal(commands[0].payload.maximum_total_minor,105000);
 assert.equal(commands[0].payload.bonus_minor,0);
 assert.match(api.current().notice,/jockey booked/i);
});

test('rejected premier owner can book a real local replacement from existing desk with no second entry',async()=>{
 const {api,commands}=makeScreen(false,{replacement:true});
 const screen=api.render();
 assert.match(screen,/Premier bid lost/);
 assert.match(screen,/BOOK REPLACEMENT JOCKEY & PAY \$1,050\.00/);
 assert.doesNotMatch(screen,/SUBMIT PREMIER OFFER/);
 await api.confirm();
 assert.equal(commands.length,1);
 assert.equal(commands[0].type,'CONFIRM_1999_RACE_PLAN');
 assert.equal(commands[0].actor,'player');
 assert.equal(commands[0].payload.maximum_total_minor,105000);
 assert.match(api.current().notice,/REPLACEMENT JOCKEY BOOKED/);
});
