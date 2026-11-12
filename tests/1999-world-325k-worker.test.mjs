import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';

test('World worker sorts/filter whole universe, not the visible page',async()=>{
 const source=readFileSync(new URL('../public/next/1999-world-index.worker.mjs',import.meta.url),'utf8')
  .replace(/^import .*$/gm,'');
 const records=Array.from({length:620},(_,i)=>({
  index:i,id:'H-TEST-'+String(i).padStart(6,'0'),name:'Horse '+String(i).padStart(4,'0'),
  age:1+i%9,sex:i%2?'MARE':'COLT',status:i%3?'IN_TRAINING':'RETIRED',
  ownerId:'O-'+i%5,breederId:'O-'+(i+1)%5,trainerId:'T-'+i%3,trackId:'TRACK-0',
  homebred:i%4===0,sire:'Sire',dam:'Dam',ca:2+i%4,pa:3,canonical:false,
  registryGroup:i%2?'YEARLING':'RACING_AGE'
 }));
 const counts={worldHorses:records.length,horses:10,owners:5,trainers:3,tracks:1};
 const fakeAPI=raw=>{
  const url=new URL(raw,'https://wtw.test'),off=Number(url.searchParams.get('offset')||0),
   limit=Number(url.searchParams.get('limit')||100);
  const slice=list=>({items:list.slice(off,off+limit)});
  const path=url.pathname;
  if(path.endsWith('/overview'))return {counts};
  if(path.endsWith('/world-horse-directory'))return slice(records);
  if(path.endsWith('/world-horse-attribute'))
   return slice(records.map(r=>({index:r.index,value:r.index/620})));
  const kind=path.split('/').at(-1);
  if(['owners','trainers','tracks'].includes(kind)){
   const letter=kind==='owners'?'O':kind==='trainers'?'T':'TRACK';
   const n=kind==='owners'?5:kind==='trainers'?3:1;
   return slice(Array.from({length:n},(_,i)=>({id:letter+'-'+i,name:letter+' Name '+i})));
  }
  throw Error('Unexpected fixture request '+raw);
 };
 const messages=[],scope={postMessage:x=>messages.push(x)};
 new Function('readLocal1999World','self','setTimeout',source)(fakeAPI,scope,setImmediate);
 const request=async(requestId,query)=>{
  scope.onmessage({data:{type:'browse',requestId,query}});
  for(let i=0;i<2000;i++){
   const found=messages.find(m=>m.type==='result'&&m.requestId===requestId);
   if(found)return found.result;
   const error=messages.find(m=>m.type==='error');
   if(error)throw Error(error.message);
   await new Promise(resolve=>setImmediate(resolve));
  }
  throw Error('Worker fixture timeout');
 };
 const cohort=await request(1,{offset:0,limit:40,sort:'age',desc:true,
  filters:{ageMin:'4',sex:'MARE'},attributeKey:''});
 assert.equal(cohort.total,207);
 assert.ok(cohort.items.every(r=>r.sex==='MARE'&&Number(r.age)>=4));
 assert.equal(cohort.items[0].age,'9');
 const rating=await request(2,{offset:0,limit:30,sort:'attr:raw_speed',desc:true,
  filters:{sex:'MARE'},attributeKey:'raw_speed'});
 assert.equal(rating.total,310);
 assert.ok(rating.items[0]['attr:raw_speed']>rating.items.at(-1)['attr:raw_speed']);
 assert.ok(rating.items[0]._directoryIndex>500,'Global top-rated horse must be beyond first page');
 assert.ok(messages.some(m=>m.type==='index-ready'));
});
