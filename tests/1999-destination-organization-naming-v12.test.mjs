import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {TRACK_PROGRAM_1999} from '../public/next/1999-track-program.mjs';
import {create1999DestinationNamingMarkets,DESTINATION_NAMING_MARKET_MODEL_1999}
 from '../public/1999/engine/fictional-directory-destination-names-1999.mjs';
import {createFictionalWorldNameEngine}
 from '../public/1999/engine/fictional-world-name-engine.mjs';
import {organizationNamingRegion}
 from '../public/1999/engine/organization-naming-styles.mjs';
import {auditFictionalIdentityNaming}
 from '../public/1999/engine/fictional-name-quality-audit.mjs';

const source=JSON.parse(readFileSync(
 new URL('../public/data/track-geography-v33.json',import.meta.url),'utf8'));
const byId=new Map(source.tracks.map(t=>[t.id,t]));
const tracks=Object.values(TRACK_PROGRAM_1999)
 .filter(t=>t.playableIn1999!==false&&t.trackOperating==='OPEN_1999')
 .map(t=>{
  const geo=byId.get(t.id);
  assert.ok(geo?.city_locality&&geo?.state_province_region&&geo?.country,
   'real active track must have complete geographic context: '+t.id);
  return {id:t.id,name:t.name,
   location:{city:geo.city_locality,region:geo.state_province_region,
    country:geo.country}};
 });
const norm=x=>String(x).normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
 .toLowerCase().replace(/&/g,'and').replace(/[^a-z0-9]+/g,'');

test('real 1999 playable tracks have 107 explicit destination naming markets',()=>{
 assert.equal(tracks.length,107);
 const allocation=create1999DestinationNamingMarkets({
  tracks,ownerCountByTrack:tracks.map(()=>10),farmsPerTrack:4
 });
 assert.equal(allocation.schema,DESTINATION_NAMING_MARKET_MODEL_1999);
 assert.equal(allocation.markets.length,107);
 assert.equal(allocation.ownerMarketIds.length,1070);
 assert.equal(allocation.farmMarketIds.length,428);
 assert.equal(new Set(allocation.markets.map(m=>m.id)).size,107);
 for(let i=0;i<107;i++){
  const market=allocation.markets[i];
  assert.equal(market.region,tracks[i].location.region);
  assert.equal(market.city,tracks[i].location.city);
  assert.ok(allocation.ownerMarketIds.slice(i*10,i*10+10)
   .every(x=>x===market.id));
  assert.ok(allocation.farmMarketIds.slice(i*4,i*4+4)
   .every(x=>x===market.id));
 }
 assert.deepEqual(allocation,create1999DestinationNamingMarkets({
  tracks,ownerCountByTrack:tracks.map(()=>10),farmsPerTrack:4
 }));
});

test('actual V11 naming engine gives every owner, principal and farm the destination region',()=>{
 const ownerCountByTrack=tracks.map((_,i)=>i%2===0?15:16);
 const destination=create1999DestinationNamingMarkets({
  tracks,ownerCountByTrack,farmsPerTrack:4});
 const args={
  worldId:'WTW1999RegionOwnersV12',seed:19990101,year:1999,roles:{},
  owners:destination.ownerMarketIds.length,
  facilities:{generalFarms:destination.farmMarketIds.length,studFarms:0,
   nurseries:0,bloodstockFarms:0,breakingTraining:0},
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS_SCALABLE_V11',
  markets:destination.markets,
  destinationMarketIds:{
   owners:destination.ownerMarketIds,farms:destination.farmMarketIds
  },
  protectedNames:[...tracks.map(t=>t.name),'Kingsmere Farm','Split Rail Farm']
 };
 const w=createFictionalWorldNameEngine(args);
 assert.equal(w.owners.length,destination.ownerMarketIds.length);
 assert.equal(w.farms.length,428);
 assert.equal(w.manifest.destinationNamingModel,DESTINATION_NAMING_MARKET_MODEL_1999);
 assert.equal(new Set(w.owners.map(x=>norm(x.name))).size,w.owners.length);
 assert.equal(new Set(w.farms.map(x=>norm(x.name))).size,w.farms.length);
 const markets=new Map(destination.markets.map(m=>[m.id,m]));
 const people=new Map(w.people.map(x=>[x.id,x]));
 for(let i=0;i<w.owners.length;i++){
  const owner=w.owners[i],expected=markets.get(destination.ownerMarketIds[i]);
  const principal=people.get(owner.principalId);
  assert.ok(principal,'owner must have a real reciprocal source person ID');
  assert.equal(principal.organizationId,owner.id);
  assert.equal(owner.principalName,principal.name);
  assert.equal(owner.location.region,expected.region);
  assert.equal(owner.location.marketId,expected.id);
  assert.equal(owner.namingRegion,organizationNamingRegion(expected));
  assert.equal(principal.location.marketId,expected.id);
 }
 for(let i=0;i<w.farms.length;i++){
  const farm=w.farms[i],expected=markets.get(destination.farmMarketIds[i]);
  assert.equal(farm.location.marketId,expected.id);
  assert.equal(farm.location.region,expected.region);
  assert.equal(farm.namingRegion,organizationNamingRegion(expected));
 }
 const audit=auditFictionalIdentityNaming(w);
 assert.equal(audit.pass,true,JSON.stringify(audit.issues));
 assert.deepEqual(w,createFictionalWorldNameEngine(args));
 const old=createFictionalWorldNameEngine({...args,destinationMarketIds:undefined});
 assert.ok(!Object.hasOwn(old.manifest,'destinationNamingModel'));
 assert.notEqual(old.manifest.fingerprint,w.manifest.fingerprint);
});

test('destination binding is impossible in frozen 1999 V10 and fails closed on bad geography',()=>{
 const plan=create1999DestinationNamingMarkets({
  tracks:tracks.slice(0,2),ownerCountByTrack:[3,2],farmsPerTrack:4
 });
 const base={worldId:'WTW1999RegionGuard',seed:19990101,year:1999,
  owners:5,roles:{},facilities:{generalFarms:8},markets:plan.markets,
  destinationMarketIds:{owners:plan.ownerMarketIds,farms:plan.farmMarketIds}};
 assert.throws(()=>createFictionalWorldNameEngine({
  ...base,ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'
 }),/require explicit V11/);
 const sourceModel='ARCHIVAL_1999_RACING_OWNERS_SCALABLE_V11';
 assert.throws(()=>createFictionalWorldNameEngine({
  ...base,ownerNameSourceModel:sourceModel,
  destinationMarketIds:{...base.destinationMarketIds,owners:['unknown',...plan.ownerMarketIds.slice(1)]}
 }),/must match real geographic markets/);
 assert.throws(()=>createFictionalWorldNameEngine({
  ...base,ownerNameSourceModel:sourceModel,
  destinationMarketIds:{...base.destinationMarketIds,farms:[]}
 }),/must match real geographic markets/);
 assert.throws(()=>create1999DestinationNamingMarkets({
  tracks:[tracks[0],tracks[0]],ownerCountByTrack:[1,1]
 }),/Repeated destination naming track ID/);
 assert.throws(()=>create1999DestinationNamingMarkets({
  tracks:[{id:'T-0001',location:{city:'Test',region:'Somewhere',country:'Unknown'}}],
  ownerCountByTrack:[1]
 }),/unrecognized country/);
 // V10 replay has no new manifest field and the approved legacy engine
 // snapshots are pinned separately in the existing V7/V10 tests.
 const v10=createFictionalWorldNameEngine({
  worldId:'WTW1999LegacyGuard',seed:19990101,year:1999,
  owners:5,roles:{},facilities:{generalFarms:8},
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'
 });
 assert.equal(v10.manifest.destinationNamingModel,undefined);
 assert.deepEqual(v10,createFictionalWorldNameEngine({
  worldId:'WTW1999LegacyGuard',seed:19990101,year:1999,
  owners:5,roles:{},facilities:{generalFarms:8},
  ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'
 }));
});

test('real worker invokes destination naming only behind explicit new version and world key',()=>{
 const worker=readFileSync(new URL(
  '../public/next/1999-industry-bootstrap-worker.mjs',import.meta.url),'utf8');
 assert.match(worker,/directoryNamingModel==='V12_DESTINATION_TRACK'/);
 assert.match(worker,/NAMES-V11/);
 assert.match(worker,/create1999DestinationNamingMarkets/);
 assert.match(worker,/request\.directoryNamingModel\?\?null/);
 assert.match(worker,/ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS'/);
 assert.match(worker,/ownerNameSourceModel:'ARCHIVAL_1999_RACING_OWNERS_SCALABLE_V11'/);
 assert.match(worker,/destinationMarketIds:/);
 const manager=readFileSync(new URL(
  '../public/next/1999-commercial-career-manager.mjs',import.meta.url),'utf8');
 assert.match(manager,/directoryNamingModel:options\.directoryNamingModel\?\?null/);
 assert.match(manager,/worldId:options\.worldId\?\?'WTW1999FullIndustry'/);
});
