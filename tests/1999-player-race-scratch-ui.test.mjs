import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL(
 '../public/next/1999-player-race-planning.mjs',import.meta.url),'utf8');
const route=readFileSync(new URL('../public/next/next.js',import.meta.url),'utf8');

function screen({status='BOOKED',confirm=true,fail=false,owner=true}={}){
 const commands=[],prompts=[];
 const entry={id:'R-1999-OPEN:H-1999-OWNED',race_id:'R-1999-OPEN',
  horse_id:'H-1999-OWNED',status,fee_minor:115000};
 const row={race_id:'R-1999-OPEN',date:'1999-01-12',track_id:'T-0017',
  conditions:'Allowance',surface:'DIRT',distance_furlongs:8,purse_minor:4000000,
  capacity:10,entries:3,source_status:'ACTUAL_GAME_RACE_ENTRIES_OPEN',
  eligibility_reasons:[],status:status==='SCRATCHED'?'SCRATCHED':'ALREADY_ENTERED',
  available_jockeys:[],receiving_barn_options:[],
  player_controls_horse:owner,booked_entry_id:entry.id,booked_jockey_id:'P-LOCAL'};
 const game={
  state:{clock:{date:'1999-01-04'},runtime:{entries:{[entry.id]:entry},
   facilities:{sites:{}}}},
  view:()=>({stable:[{horse_id:entry.horse_id,name:'Owned Runner',
   condition:{readiness:.93}}],races:[{id:row.race_id,track_id:row.track_id}],
   people:[]}),
  getRaceOpportunities:()=>({rows:[row]}),
  getRacePlanQuote:()=>{throw Error('A booked or scratched entry cannot be re-quoted')},
  submit:async(type,payload,actor)=>{
   commands.push({type,payload,actor});
   if(fail)throw Error('Engine rejected changed race conditions');
   entry.status='SCRATCHED';row.status='SCRATCHED';
  }
 };
 const window={__WTW_1999_UI_DATA__:{gameplayService:game},
  __WTW_NEXT__:{paint:()=>{}},confirm:message=>{
   prompts.push(message);return confirm;
  }};
 vm.runInContext(source,vm.createContext({
  window,location:{search:''},Intl,Date,Number,Math,JSON,String,Array,Set,Map,Object
 }),{filename:'1999-player-race-planning.mjs'});
 return {api:window.WTW1999PlayerRacePlans,commands,prompts,entry,row};
}

test('actual Race Entry Desk routes the owned booked runner to audited game scratch with no refund promise',async()=>{
 assert.match(route,/race-plan-scratch[^\n]+WTW1999PlayerRacePlans\?\.scratch/);
 const x=screen();
 const first=x.api.render();
 assert.match(first,/WITHDRAW ENTRY/);
 assert.match(first,/Withdrawal does not refund signed jockey fees/);
 assert.doesNotMatch(first,/CONFIRM ENTRY & PAY/);
 await x.api.scratch();
 assert.equal(x.commands.length,1);
 assert.equal(x.commands[0].type,'SCRATCH_1999_RACE');
 assert.equal(x.commands[0].actor,'player');
 assert.equal(x.commands[0].payload.race_id,'R-1999-OPEN');
 assert.equal(x.commands[0].payload.horse_id,'H-1999-OWNED');
 assert.equal(x.commands[0].payload.reason,'OWNER_WITHDRAWAL');
 assert.match(x.prompts[0],/\$1,150\.00/);
 assert.match(x.prompts[0],/not refunded/);
 assert.equal(x.entry.status,'SCRATCHED');
 assert.match(x.api.current().notice,/ENTRY WITHDRAWN/);
 const updated=x.api.render();
 assert.match(updated,/Withdrawn from this race/);
 assert.doesNotMatch(updated,/WITHDRAW ENTRY/);
 assert.doesNotMatch(updated,/CONFIRM ENTRY & PAY/);
});

test('owner cancellation, unauthorized horse and prior scratch never submit a race command',async()=>{
 const cancelled=screen({confirm:false});
 cancelled.api.render();await cancelled.api.scratch();
 assert.equal(cancelled.commands.length,0);
 const rival=screen({owner:false});
 assert.doesNotMatch(rival.api.render(),/WITHDRAW ENTRY/);
 await rival.api.scratch();
 assert.equal(rival.commands.length,0);
 assert.match(rival.api.current().error,/Only your own current/);
 const scratched=screen({status:'SCRATCHED'});
 assert.doesNotMatch(scratched.api.render(),/WITHDRAW ENTRY/);
 await scratched.api.scratch();
 assert.equal(scratched.commands.length,0);
});

test('engine refusal is displayed without a false confirmed withdrawal',async()=>{
 const x=screen({fail:true});
 x.api.render();await x.api.scratch();
 assert.equal(x.commands.length,1);
 assert.equal(x.entry.status,'BOOKED');
 assert.equal(x.api.current().notice,'');
 assert.match(x.api.current().error,/NO WITHDRAWAL COMMITTED/);
});
