import test from 'node:test';
import assert from 'node:assert/strict';
import {get1999JockeyPartnership,JOCKEY_PARTNERSHIP_MODEL}
 from '../public/1999/engine/jockey-partnerships-1999.mjs';

const trainer='P-FICTIONAL-1999-TRAINER-0000001';
const owner='O-FICTIONAL-1999-OWNER-0000001';
const otherOwner='O-FICTIONAL-1999-OWNER-0000002';
const jockey='P-FICTIONAL-1999-JOCKEY-0000001';
const horse='H-FICTIONAL-1999-THREEYEARRUNNERS-0000001';
const base=()=>({runtime:{races:{},entries:{},
 registered_horses:{by_id:{[horse]:{horse_id:horse,trainer_id:trainer,
 owner_organization_id:owner}}}}});
const partnership=s=>get1999JockeyPartnership(s,{
 trainerId:trainer,ownerId:owner,jockeyId:jockey});
function mount(s,{id='1',status='BOOKED',finish=null,trainerId=trainer,
 ownerId=owner,date='1999-03-01'}={}){
 const rid='R-'+id;
 s.runtime.races[rid]={id:rid,date,
  status:status==='RESULTED'?'OFFICIAL_SIM_RESULT':'ENTRIES_OPEN',
  results:status==='RESULTED'?[{horse_id:'H-'+id,jockey_share_minor:11000}]:[]};
 s.runtime.entries[rid+':H-'+id]={id:rid+':H-'+id,
  race_id:rid,horse_id:'H-'+id,trainer_id:trainerId,owner_id:ownerId,
  jockey_id:jockey,status,...(finish?{finish}:{})};
}
test('new jockey partnership starts neutral, with no imaginary historical loyalty',()=>{
 assert.equal(JOCKEY_PARTNERSHIP_MODEL,'WTW_1999_JOCKEY_PARTNERSHIPS_V1');
 const result=partnership(base());
 assert.equal(result.trainerMounts,0);
 assert.equal(result.ownerMounts,0);
 assert.equal(result.trainerWins,0);
 assert.equal(result.trainerBond,0);
 assert.equal(result.ownerBond,0);
});
test('paid mounts and actual winners create distinct trainer and owner relationships',()=>{
 const s=base();
 mount(s,{id:'1',status:'RESULTED',finish:1,date:'1999-02-01'});
 mount(s,{id:'2',status:'RESULTED',finish:3,date:'1999-02-11'});
 mount(s,{id:'3',status:'BOOKED',date:'1999-02-21'});
 mount(s,{id:'4',status:'RESULTED',finish:2,ownerId:otherOwner,
  date:'1999-03-02'});
 mount(s,{id:'5',status:'ENTERED',date:'1999-03-03'});
 mount(s,{id:'6',status:'SCRATCHED',date:'1999-03-04'});
 const current=partnership(s);
 assert.equal(current.trainerMounts,4);
 assert.equal(current.trainerWins,1);
 assert.equal(current.trainerPlaces,3);
 assert.equal(current.ownerMounts,3);
 assert.equal(current.ownerWins,1);
 assert.equal(current.trainerPursesMinor,33000);
 assert.equal(current.mostRecentTrainerDate,'1999-03-02');
 assert.ok(current.trainerBond>0);
 assert.ok(current.ownerBond>0);
 assert.deepEqual(partnership(JSON.parse(JSON.stringify(s))),current,
  'Career relationships must reproduce exactly on save/reopen');
 const other=get1999JockeyPartnership(s,{
  trainerId:trainer,ownerId:otherOwner,jockeyId:jockey});
 assert.equal(other.trainerMounts,4);
 assert.equal(other.ownerMounts,1,'Owners retain independent partnership history');
});
test('the real trainer, horse and owner IDs matter; no inferred loyalty from name or invented results',()=>{
 const s=base();
 mount(s,{id:'8',status:'RESULTED',finish:1,
  trainerId:'P-FICTIONAL-1999-TRAINER-0000002',
  ownerId:otherOwner});
 const current=partnership(s);
 assert.equal(current.trainerMounts,0);
 assert.equal(current.ownerMounts,0);
 assert.equal(current.trainerBond,0);
 assert.equal(current.ownerBond,0);
});
