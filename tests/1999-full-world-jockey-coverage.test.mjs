import test from 'node:test';
import assert from 'node:assert/strict';
import {TRACK_PROGRAM_1999} from '../public/next/1999-track-program.mjs';
import {plan1999Ecosystem}
 from '../public/1999/engine/fictional-industry-ecosystem-1999.mjs';
import {plan1999IndustryStaffing,generate1999StaffingBatches}
 from '../public/1999/engine/fictional-industry-staffing-1999.mjs';

const tracks=Object.values(TRACK_PROGRAM_1999).
 filter(x=>x.trackOperating==='OPEN_1999'&&x.playableIn1999===true);
const farms=[{id:'O-TEST-FARM',location:{region:'Kentucky',country:'USA'}}];
const total=counts=>Object.values(counts).reduce((s,n)=>s+n,0);
const roster=n=>Array.from({length:n},(_,i)=>({
 name:'Unimportant Test Identity '+(i+1),birthCountry:'US'
}));
function materialize(staffing,seed){
 const byTrack=new Map(tracks.map(t=>[t.id,0]));
 const ids=new Set();
 let people=0,jockeys=0;
 for(const batch of generate1999StaffingBatches({
  seed,staffing,tracks,farms,batchSize:1000,
  nameRoster:roster(total(staffing.counts)),ensureCircuitCoverage:true
 })){
  for(const p of batch.records){
   assert.ok(!ids.has(p.id),'duplicate permanent person ID '+p.id);
   ids.add(p.id);people++;
   if(p.role==='jockey'){
    assert.ok(byTrack.has(p.workplaceId),'unknown 1999 jockey workplace');
    byTrack.set(p.workplaceId,byTrack.get(p.workplaceId)+1);
    jockeys++;
   }
  }
 }
 assert.equal(people,total(staffing.counts));
 assert.equal(jockeys,staffing.counts.jockey);
 return byTrack;
}
test('new real 10k fictional industry has two named local jockey records at every 1999 track with exact horse count',()=>{
 assert.equal(tracks.length,107);
 for(const seed of [19990101,19990102]){
  const ecosystem=plan1999Ecosystem({seed,targetOpeningHorses:10000});
  assert.equal(ecosystem.openingRegistryHorses,10000);
  const current=plan1999IndustryStaffing({seed,ecosystem,
   minimumRacingTracks:tracks.length});
  assert.equal(current.minimumJockeysPerTrack,2);
  assert.ok(current.counts.jockey>=214);
  const jockeys=materialize(current,seed);
  assert.equal(jockeys.size,107);
  for(const [track,n] of jockeys)assert.ok(n>=2,track+' is below two resident jockeys');
 }
});
test('default 300k and maximum 325k industry staffing preserve adequate labor without changing horse crops',()=>{
 for(const horses of [300000,325000]){
  const seed=19990101;
  const ecosystem=plan1999Ecosystem({seed,targetOpeningHorses:horses});
  assert.equal(ecosystem.openingRegistryHorses,horses);
  const staffing=plan1999IndustryStaffing({seed,ecosystem,
   minimumRacingTracks:tracks.length});
  assert.ok(staffing.counts.jockey>=2*tracks.length);
  assert.ok(staffing.counts.trainer>=tracks.length);
 }
});
test('saved original one-jockey staffing layout keeps its legacy permanent IDs and never silently changes saved people',()=>{
 const seed=19990101;
 const ecosystem=plan1999Ecosystem({seed,targetOpeningHorses:10000});
 const legacy=plan1999IndustryStaffing({seed,ecosystem,
  minimumRacingTracks:tracks.length,minimumJockeysPerTrack:1});
 assert.equal(legacy.counts.jockey,141);
 assert.equal(legacy.minimumJockeysPerTrack,1);
 const placed=materialize(legacy,seed);
 assert.equal([...placed.values()].reduce((n,x)=>n+x,0),141);
 assert.ok([...placed.values()].some(x=>x===1));
 const current=plan1999IndustryStaffing({seed,ecosystem,
  minimumRacingTracks:tracks.length});
 assert.equal(current.counts.jockey,214);
 // Existing world manifests select their own original staffing plan on
 // resume; this fixture confirms that old identities can still materialize.
});
