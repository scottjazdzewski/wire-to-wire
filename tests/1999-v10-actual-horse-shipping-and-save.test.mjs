import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {WORLD_SCHEMA,dispatchGameCommand,exportGameSave,importGameSave}
 from '../src/game/index.js';
import {build1999PilotGameRun} from '../src/game/1999-pilot-fixture.js';
import {shippingAssessment,horseTravelStatus,modeledShippingRoute}
 from '../src/game/shipping-1999.js';

const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url),'utf8'));
const d=read('../public/data/wtw-1999-founding-directory-v1.json');
const t=read('../public/data/wtw-1999-trainer-pilot-v1.json');
const j=read('../public/data/wtw-1999-jockey-pilot-v1.json');
const manifest=read('../data/1999-gameplay/first-38-horses-attributes-and-barns-v1.json');
const people=[...new Map([...d.people,...t.trainers,...j.jockeys].
 map(p=>[p.id,p])).values()];
const world={schema:WORLD_SCHEMA,start_date:'1999-01-01',
 authority:{snapshot_id:'WTW-LANE5-1999-SHIPPING-GAME',
  source:'APPROVED_PILOT_GAME_REGRESSION',
  sha256:createHash('sha256').update('wtw/1999/lane5/shipping').digest('hex')},
 entities:{horses:d.horses,organizations:d.organizations,tracks:d.tracks,people}};
const fresh=()=>build1999PilotGameRun({world,manifest,jockeys:j.jockeys});
test('true pilot horse KY/NY/FL/CA circuit quotes include actual funded New York to California shipping',()=>{
 const initial=fresh();
 const availableAt=(home,site)=>Object.values(initial.runtime.registered_horses.by_id).
  filter(h=>h.host_track_id===home).
  find(h=>shippingAssessment(initial,world,h.horse_id,site).allowed);
 const ny=availableAt('T-0001','F-1999-SA-NAKAMURA');
 const fl=availableAt('T-0017','F-1999-SA-NAKAMURA');
 assert.ok(ny&&fl,'actual healthy, funded registered NY and Florida horses must have viable California receiving space');
 const nyCa=shippingAssessment(initial,world,ny.horse_id,'F-1999-SA-NAKAMURA');
 const nyFl=shippingAssessment(initial,world,ny.horse_id,'F-1999-GP-WALKER');
 const flCa=shippingAssessment(initial,world,fl.horse_id,'F-1999-SA-NAKAMURA');
 assert.equal(nyCa.allowed,true,JSON.stringify(nyCa.reasons));
 assert.equal(nyFl.allowed,true,JSON.stringify(nyFl.reasons));
 assert.equal(flCa.allowed,true,JSON.stringify(flCa.reasons));
 assert.equal(nyCa.route.band,'CROSS_COUNTRY');
 assert.equal(nyCa.route.days,5);
 assert.equal(nyFl.route.band,'INTERREGIONAL');
 assert.equal(nyFl.route.days,3);
 assert.equal(flCa.route.band,'CROSS_COUNTRY');
 const beforeCash=initial.runtime.finances.operation_balances_minor[ny.owner_organization_id];
 const beforeLedger=initial.runtime.finances.ledger.length;
 const advanced=dispatchGameCommand({state:initial,world,command:{
  id:'lane5:actual:ship:ny-to-ca',type:'SHIP_1999_HORSE',actor:'system',
  payload:{horse_id:ny.horse_id,destination_site_id:'F-1999-SA-NAKAMURA'}
 }}).state;
 const trip=horseTravelStatus(advanced,ny.horse_id);
 assert.equal(trip.status,'OUTBOUND');
 assert.equal(trip.origin_track_id,'T-0001');
 assert.equal(trip.destination_track_id,'T-0028');
 assert.equal(trip.route_band,'CROSS_COUNTRY');
 assert.equal(trip.estimated_days,5);
 assert.equal(advanced.runtime.finances.operation_balances_minor[ny.owner_organization_id],
  beforeCash-nyCa.route.cost_minor,'actual owner is debited once');
 const newly=advanced.runtime.finances.ledger.slice(beforeLedger);
 assert.equal(newly.length,2);
 assert.equal(newly.reduce((sum,row)=>sum+row.amount_minor,0),0,
  'carrier charge must have matching receipt and no money duplication');
 const reloaded=importGameSave(exportGameSave(advanced,world),world);
 assert.deepEqual(horseTravelStatus(reloaded,ny.horse_id),trip,
  'actual signed shipping command survives authoritative game save and reopen');
 assert.equal(reloaded.runtime.registered_horses.by_id[ny.horse_id].horse_id,
  ny.horse_id,'horse immutable identity unchanged by transport');
});
test('1999 offline modeled interstate travel stays symmetric for actual source barn records',()=>{
 const lookup=id=>manifest.sites.find(s=>s.site_id===id);
 const a=lookup('F-1999-AQ-VENN'),b=lookup('F-1999-SA-NAKAMURA');
 assert.ok(a&&b);
 const loc=site=>({location:{city:site.city,state:site.state,country:site.country}});
 const out=modeledShippingRoute(loc(a),loc(b)),back=modeledShippingRoute(loc(b),loc(a));
 assert.equal(out.band,back.band);
 assert.equal(out.days,back.days);
 assert.equal(out.cost_minor,back.cost_minor);
});
