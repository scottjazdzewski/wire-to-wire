import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave,
 getGameHorsePerformance,horseTravelStatus,physicalHorseSiteId,
 effectiveHorseCareSite,receivingBarnCapacity} from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const directory=read('../public/data/wtw-1999-founding-directory-v1.json');
const trainer=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const jockey=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const cohort=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...directory.people,...trainer.trainers,...jockey.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'PHYSICAL-CARE-AND-TRANSPORT-1999',
  source:'ISOLATED_GAME_TEST_NOT_HISTORICAL',
  sha256:createHash('sha256').update('physical-care-1999-v1').digest('hex')},
 entities:{horses:directory.horses,organizations:directory.organizations,
  tracks:directory.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest:cohort,jockeys:jockey.jockeys});
const run=(s,id,type,payload,actor='system')=>dispatchGameCommand({state:s,world,
 command:{id,type,payload,actor}}).state;
const day=s=>run(s,'physical-care:day:'+s.clock.date,'ADVANCE_DAY',{});
const away='F-1999-AQ-VENN';
const choose=s=>Object.values(s.runtime.registered_horses.by_id).find(h=>
 h.owner_organization_id===s.player.operation_id&&h.host_track_id==='T-0017');

test('carrier days are no-workout, carrier-funded care days; neither physical barn collects phantom board',()=>{
 let s=fresh();const h=choose(s);assert.ok(h);
 const home=h.current_residence_id,owner=h.owner_organization_id;
 s=run(s,'physical-care:ship','SHIP_1999_HORSE',{
  horse_id:h.horse_id,destination_site_id:away},'player');
 assert.equal(physicalHorseSiteId(s,h),null);
 assert.equal(effectiveHorseCareSite(s,h),null);
 const cashAfterCarrier=s.runtime.finances.operation_balances_minor[owner];
 s=day(s);
 assert.equal(s.clock.date,'1999-01-02');
 const training=s.runtime.horse[h.horse_id],last=training.history.at(-1);
 assert.equal(horseTravelStatus(s,h.horse_id).status,'OUTBOUND');
 assert.equal(last.work,'REST');
 assert.equal(last.agent_reason,'IN_TRANSIT_RECOVERY');
 assert.equal(last.travel_status,'OUTBOUND');
 assert.equal(last.facility_id,null);
 assert.equal(last.paid_minor,0);
 assert.equal(last.unfunded,false);
 assert.equal(training.agent.reason,'HORSE_IN_TRANSIT');
 assert.equal(training.agent.site_id,null);
 assert.equal(training.training.asOf,s.clock.date);
 assert.equal(s.runtime.finances.ledger.filter(l=>l.horse_id===h.horse_id&&
  l.date===s.clock.date&&/HORSE_CARE_OWNER_PAYMENT|HORSE_CARE_SITE_AND_TRAINER_INCOME/.test(l.kind)).length,0);
 assert.ok(s.runtime.finances.operation_balances_minor[owner]<=cashAfterCarrier,
  'Other horses may be billed; this traveler cannot create extra horse-care charges');
 const performance=getGameHorsePerformance(s,world,h.horse_id);
 assert.equal(performance.site_id,null);
 assert.equal(performance.barn_quality,null);
 assert.equal(performance.eligible_on_condition,false);
 assert.equal(s.event_log.filter(e=>e.kind==='HORSE_TRANSIT_CARE_DAY'&&
  e.details.horse_id===h.horse_id).length,1);
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].current_residence_id,home);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('arrival moves training, care payment and site occupancy to receiving barn, not permanent home',()=>{
 let s=fresh(),h=choose(s);assert.ok(h);
 const home=h.current_residence_id,occupied=s.runtime.registered_horses.by_id;
 const receivingFree=receivingBarnCapacity(s,away);
 s=run(s,'physical-care:ship','SHIP_1999_HORSE',{
  horse_id:h.horse_id,destination_site_id:away},'player');
 for(let i=0;i<3;i++)s=day(s);
 assert.equal(s.clock.date,'1999-01-04');
 assert.equal(horseTravelStatus(s,h.horse_id).status,'AT_DESTINATION');
 assert.equal(physicalHorseSiteId(s,h),away);
 assert.equal(effectiveHorseCareSite(s,h).id,away);
 assert.equal(receivingBarnCapacity(s,away),receivingFree-1);
 const record=s.runtime.horse[h.horse_id],recent=record.history.at(-1);
 assert.equal(record.agent.reason,'ARRIVAL_RECOVERY');
 assert.equal(record.agent.site_id,away);
 assert.equal(recent.work,'REST');
 assert.equal(recent.facility_id,away);
 assert.equal(recent.unfunded,false);
 assert.ok(Number.isFinite(recent.crowding)&&recent.crowding>=0&&recent.crowding<=1,
  'Visiting horses must never produce NaN crowding');
 const guest=s.runtime.facilities.sites[away];
 const atSite=Object.values(occupied).filter(x=>physicalHorseSiteId(s,x)===away).length;
 const workingStalls=Math.max(1,Math.floor(guest.stalls*Math.min(1,
  guest.staff_count/Math.max(1,guest.staff_required))));
 assert.equal(recent.crowding,Math.round(Math.min(1,atSite/workingStalls)*10000)/10000);
 const ownerPayments=s.runtime.finances.ledger.filter(l=>l.date===s.clock.date&&
  l.horse_id===h.horse_id&&l.kind==='HORSE_CARE_OWNER_PAYMENT');
 const receipts=s.runtime.finances.ledger.filter(l=>l.date===s.clock.date&&
  l.horse_id===h.horse_id&&l.kind==='HORSE_CARE_SITE_AND_TRAINER_INCOME');
 assert.equal(ownerPayments.length,1);assert.equal(receipts.length,1);
 assert.equal(ownerPayments[0].site_id,away);
 assert.equal(receipts[0].site_id,away);
 assert.equal(receipts[0].operation_id,guest.operator_organization_id);
 assert.notEqual(receipts[0].site_id,home);
 assert.equal(getGameHorsePerformance(s,world,h.horse_id).site_id,away);
 assert.equal(s.runtime.registered_horses.by_id[h.horse_id].current_residence_id,home,
  'Original permanent barn identity must not be rewritten');
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});

test('return shipping has physical carrier days without home or guest boarding and recovers correct home after arrival',()=>{
 let s=fresh(),h=choose(s);
 s=run(s,'physical-care:ship','SHIP_1999_HORSE',{
  horse_id:h.horse_id,destination_site_id:away},'player');
 for(let i=0;i<3;i++)s=day(s);
 s=run(s,'physical-care:return','RETURN_1999_HORSE',{horse_id:h.horse_id},'player');
 assert.equal(horseTravelStatus(s,h.horse_id).status,'RETURNING');
 assert.equal(physicalHorseSiteId(s,h),null);
 s=day(s);
 assert.equal(s.runtime.horse[h.horse_id].history.at(-1).work,'REST');
 assert.equal(s.runtime.horse[h.horse_id].history.at(-1).paid_minor,0);
 assert.equal(s.runtime.horse[h.horse_id].history.at(-1).facility_id,null);
 for(let i=0;i<2;i++)s=day(s);
 assert.equal(horseTravelStatus(s,h.horse_id).status,'HOME');
 assert.equal(s.runtime.horse[h.horse_id].history.at(-1).facility_id,h.current_residence_id);
 assert.equal(s.runtime.horse[h.horse_id].agent.reason,'ARRIVAL_RECOVERY');
 const carrier=s.runtime.finances.ledger.filter(l=>l.horse_id===h.horse_id&&
  ['HORSE_OUTBOUND_SHIPPING_CHARGE','HORSE_RETURN_SHIPPING_CHARGE',
   'MODELED_HORSE_CARRIER_RECEIPT'].includes(l.kind));
 assert.equal(carrier.reduce((n,l)=>n+l.amount_minor,0),0);
 const repeat=dispatchGameCommand({state:s,world,command:{
  id:'physical-care:day:1999-01-06',type:'ADVANCE_DAY',payload:{},actor:'system'}});
 assert.equal(repeat.duplicate,true);
 assert.deepEqual(repeat.state,s);
 assert.deepEqual(importGameSave(exportGameSave(s,world),world),s);
});
